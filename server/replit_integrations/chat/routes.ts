import express, { type Express, type Request, type Response } from "express";
import OpenAI, { toFile } from "openai";
import { chatStorage } from "./storage";
import { storage } from "../../storage";
import { ensureCompatibleFormat } from "../audio/client";

const audioBodyParser = express.json({ limit: "50mb" });

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const REFUSAL_PATTERNS = [
  "não tenho essa informação",
  "não está na minha base",
  "não possuo essa informação",
  "não encontrei essa informação",
  "não tenho dados sobre",
  "não consta na base",
  "conteúdo ainda está sendo cadastrado",
  "não tenho informações sobre",
];

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id as string);
      const { content } = req.body;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);

      const aiDocs = await storage.getAiDocuments();
      const glossaryItems = await storage.getGlossary();
      const toolItems = await storage.getTools();
      const trilhaItems = await storage.getTrilhaUnits();
      const programItems = await storage.getPrograms();

      let allProgramDetails: Array<{ programCode: string; type: string; content: string; category: string | null }> = [];
      for (const prog of programItems) {
        const details = await storage.getProgramDetails(prog.code);
        allProgramDetails = allProgramDetails.concat(details);
      }

      let knowledgeBase = "";

      if (aiDocs.length > 0) {
        knowledgeBase += "=== DOCUMENTOS DA BASE DE CONHECIMENTO ===\n";
        for (const doc of aiDocs) {
          knowledgeBase += `\n--- ${doc.title} ---\n${doc.content}\n`;
        }
      }

      if (programItems.length > 0) {
        knowledgeBase += "\n=== PROGRAMAS GOVERNAMENTAIS ===\n";
        knowledgeBase += "Página de programas: /programas\n";
        for (const prog of programItems) {
          knowledgeBase += `\n--- ${prog.code}: ${prog.name} ---\n`;
          knowledgeBase += `Descrição: ${prog.description}\n`;
          knowledgeBase += `Status: ${prog.status}\n`;
          if (prog.lastReferenceYear) knowledgeBase += `Ano de referência: ${prog.lastReferenceYear}\n`;
          if (prog.observation) knowledgeBase += `Observação: ${prog.observation}\n`;
          knowledgeBase += `Link: /programas/${prog.code}\n`;
          const progDetails = allProgramDetails.filter(d => d.programCode === prog.code);
          if (progDetails.length > 0) {
            for (const detail of progDetails) {
              knowledgeBase += `  ${detail.type}${detail.category ? ` (${detail.category})` : ""}: ${detail.content}\n`;
            }
          }
        }
      }

      if (glossaryItems.length > 0) {
        knowledgeBase += "\n=== GLOSSÁRIO DE TERMOS ===\n";
        for (const item of glossaryItems) {
          knowledgeBase += `${item.term}: ${item.explanation}\n`;
        }
      }

      if (toolItems.length > 0) {
        knowledgeBase += "\n=== FERRAMENTAS DISPONÍVEIS ===\n";
        knowledgeBase += "Página de ferramentas: /ferramentas\n";
        for (const tool of toolItems) {
          knowledgeBase += `- ${tool.title} (${tool.category}): ${tool.description}\n`;
        }
      }

      if (trilhaItems.length > 0) {
        knowledgeBase += "\n=== TRILHA DE APRENDIZAGEM ===\n";
        knowledgeBase += "Página da trilha: /trilha\n";
        for (const unit of trilhaItems) {
          knowledgeBase += `- ${unit.unitId} - ${unit.title}: ${unit.subtitle} → Link: /trilha/${unit.unitId}\n`;
        }
      }

      const hasContent = knowledgeBase.trim().length > 0;

      const systemPrompt = `Você é a assistente virtual do site "Chegou a Conta, Diretora!". Seu papel é ajudar diretoras de escolas públicas brasileiras com dúvidas sobre gestão financeira escolar.

REGRA FUNDAMENTAL — OBRIGATÓRIA E INVIOLÁVEL:
Você SOMENTE pode responder usando as informações que estão listadas abaixo na seção "BASE DE CONHECIMENTO".
Você NÃO possui conhecimento próprio. Você NÃO sabe nada além do que está escrito abaixo.
Se a informação NÃO estiver explicitamente presente na BASE DE CONHECIMENTO abaixo, você DEVE dizer:
"Desculpe, não tenho essa informação na minha base de dados. Sugiro consultar o [site do FNDE](https://www.fnde.gov.br) ou entrar em contato com a secretaria de educação do seu município."

PROIBIÇÕES ABSOLUTAS:
- NUNCA invente dados, números, valores, percentuais, datas ou prazos que não estejam na base abaixo.
- NUNCA use seu conhecimento geral para complementar respostas. Mesmo que você "saiba" algo, se não está na base abaixo, não responda.
- NUNCA crie informações sobre legislação, resoluções, portarias ou normas que não estejam explicitamente na base.
- NUNCA invente procedimentos ou etapas que não estejam documentados abaixo.
- NUNCA responda perguntas que não sejam sobre gestão financeira escolar, programas educacionais ou o conteúdo do site.
- Se alguém perguntar sobre assuntos fora do escopo (política, receitas, outros temas), diga: "Só posso ajudar com assuntos relacionados à gestão financeira da escola. Como posso te ajudar com isso?"

COMPORTAMENTO:
- Use linguagem simples e acessível, como se estivesse conversando com uma diretora de escola.
- Seja direta e prática nas respostas.
- Use formatação Markdown: **negrito** para termos importantes, listas com - para itens.
- Quando mencionar conteúdo do site, inclua links: [texto](/caminho).
- Quando mencionar unidades da trilha, inclua o link: [Nome da Unidade](/trilha/U00).
- Quando mencionar programas, inclua: [ver detalhes do programa](/programas/CÓDIGO).
- Para sites externos, use links completos: [site do FNDE](https://www.fnde.gov.br).

PÁGINAS DO SITE:
- Dashboard: /dashboard
- Trilha de Aprendizagem: /trilha
- Programas: /programas
- Ferramentas: /ferramentas
- Glossário: /glossario
- Chat IA: /chat

======= BASE DE CONHECIMENTO (ÚNICA FONTE DE VERDADE) =======
${hasContent ? knowledgeBase : "A base de conhecimento está vazia. Informe ao usuário que o conteúdo ainda está sendo cadastrado e sugira consultar o FNDE."}
======= FIM DA BASE DE CONHECIMENTO =======

LEMBRETE FINAL: Qualquer informação que NÃO esteja entre as marcações "BASE DE CONHECIMENTO" e "FIM DA BASE DE CONHECIMENTO" acima NÃO existe para você. Responda EXCLUSIVAMENTE com o que está lá.`;

      const chatMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from OpenAI (temperature 0.3 to reduce hallucination)
      const stream = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: chatMessages,
        stream: true,
        temperature: 0.3,
        max_completion_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      const responseLower = fullResponse.toLowerCase();
      const isRefusal = REFUSAL_PATTERNS.some(pattern => responseLower.includes(pattern));
      const outOfScopePatterns = ["só posso ajudar com assuntos relacionados à gestão financeira"];
      const isOutOfScope = outOfScopePatterns.some(pattern => responseLower.includes(pattern));

      if (isRefusal && !isOutOfScope) {
        const userMessages = messages.filter(m => m.role === "user");
        const lastUserMessage = userMessages[userMessages.length - 1];
        if (lastUserMessage) {
          try {
            await storage.createUnansweredQuestion({ question: lastUserMessage.content, status: "pending" });
          } catch (e) {
            console.error("Failed to log unanswered question:", e);
          }
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });

  app.post("/api/transcribe", audioBodyParser, async (req: Request, res: Response) => {
    try {
      const { audio } = req.body;
      if (!audio) {
        return res.status(400).json({ error: "Audio data (base64) is required" });
      }
      const rawBuffer = Buffer.from(audio, "base64");
      const { buffer: audioBuffer, format: inputFormat } = await ensureCompatibleFormat(rawBuffer);

      const file = await toFile(audioBuffer, `audio.${inputFormat}`);
      const response = await openai.audio.transcriptions.create({
        file,
        model: "gpt-4o-mini-transcribe",
        response_format: "json",
      });
      res.json({ transcript: response.text });
    } catch (error: any) {
      console.error("Error transcribing audio:", error?.status || error?.message || error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });
}

