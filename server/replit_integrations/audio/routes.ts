import express, { type Express, type Request, type Response } from "express";
import { chatStorage } from "../chat/storage";
import { openai, speechToText, ensureCompatibleFormat } from "./client";
import { storage } from "../../storage";

// Body parser with 50MB limit for audio payloads
const audioBodyParser = express.json({ limit: "50mb" });

export function registerAudioRoutes(app: Express): void {
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
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send voice message and get streaming audio response
  // Auto-detects audio format and converts WebM/MP4/OGG to WAV
  // Uses gpt-4o-mini-transcribe for STT, gpt-audio for voice response
  app.post("/api/conversations/:id/messages", audioBodyParser, async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { audio, voice = "alloy" } = req.body;

      if (!audio) {
        return res.status(400).json({ error: "Audio data (base64) is required" });
      }

      // 1. Auto-detect format and convert to OpenAI-compatible format
      const rawBuffer = Buffer.from(audio, "base64");
      const { buffer: audioBuffer, format: inputFormat } = await ensureCompatibleFormat(rawBuffer);

      // 2. Transcribe user audio
      const userTranscript = await speechToText(audioBuffer, inputFormat);

      // 3. Save user message
      await chatStorage.createMessage(conversationId, "user", userTranscript);

      // 4. Get conversation history
      const existingMessages = await chatStorage.getMessagesByConversation(conversationId);

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
        for (const prog of programItems) {
          knowledgeBase += `\n--- ${prog.code}: ${prog.name} ---\n`;
          knowledgeBase += `Descrição: ${prog.description}\n`;
          knowledgeBase += `Status: ${prog.status}\n`;
          if (prog.lastReferenceYear) knowledgeBase += `Ano de referência: ${prog.lastReferenceYear}\n`;
          if (prog.observation) knowledgeBase += `Observação: ${prog.observation}\n`;
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
        for (const tool of toolItems) {
          knowledgeBase += `- ${tool.title} (${tool.category}): ${tool.description}\n`;
        }
      }

      if (trilhaItems.length > 0) {
        knowledgeBase += "\n=== TRILHA DE APRENDIZAGEM ===\n";
        for (const unit of trilhaItems) {
          knowledgeBase += `- ${unit.unitId} - ${unit.title}: ${unit.subtitle}\n`;
        }
      }

      const hasContent = knowledgeBase.trim().length > 0;

      const systemPrompt = `Você é a assistente virtual do site "Chegou a Conta, Diretora!". Seu papel é ajudar diretoras de escolas públicas brasileiras com dúvidas sobre gestão financeira escolar.

REGRA FUNDAMENTAL — OBRIGATÓRIA E INVIOLÁVEL:
Você SOMENTE pode responder usando as informações que estão listadas abaixo na seção "BASE DE CONHECIMENTO".
Você NÃO possui conhecimento próprio. Você NÃO sabe nada além do que está escrito abaixo.
Se a informação NÃO estiver explicitamente presente na BASE DE CONHECIMENTO abaixo, você DEVE dizer:
"Desculpe, não tenho essa informação na minha base de dados. Sugiro consultar o site do FNDE ou entrar em contato com a secretaria de educação do seu município."

PROIBIÇÕES ABSOLUTAS:
- NUNCA invente dados, números, valores, percentuais, datas ou prazos que não estejam na base abaixo.
- NUNCA use seu conhecimento geral para complementar respostas.
- NUNCA crie informações sobre legislação, resoluções, portarias ou normas que não estejam explicitamente na base.
- NUNCA responda perguntas que não sejam sobre gestão financeira escolar, programas educacionais ou o conteúdo do site.
- Se alguém perguntar sobre assuntos fora do escopo, diga: "Só posso ajudar com assuntos relacionados à gestão financeira da escola."

COMPORTAMENTO:
- Use linguagem simples e acessível.
- Seja direta e prática nas respostas.
- Quando relevante, mencione as ferramentas e materiais disponíveis no site.

======= BASE DE CONHECIMENTO (ÚNICA FONTE DE VERDADE) =======
${hasContent ? knowledgeBase : "A base de conhecimento está vazia. Informe ao usuário que o conteúdo ainda está sendo cadastrado e sugira consultar o FNDE."}
======= FIM DA BASE DE CONHECIMENTO =======

LEMBRETE FINAL: Qualquer informação que NÃO esteja entre as marcações acima NÃO existe para você. Responda EXCLUSIVAMENTE com o que está lá.`;

      const chatHistory = [
        { role: "system" as const, content: systemPrompt },
        ...existingMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      // 5. Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ type: "user_transcript", data: userTranscript })}\n\n`);

      // 6. Stream audio response from gpt-audio (temperature 0.3 to reduce hallucination)
      const stream = await openai.chat.completions.create({
        model: "gpt-audio",
        modalities: ["text", "audio"],
        audio: { voice, format: "pcm16" },
        messages: chatHistory,
        stream: true,
        temperature: 0.3,
      });

      let assistantTranscript = "";

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta as any;
        if (!delta) continue;

        if (delta?.audio?.transcript) {
          assistantTranscript += delta.audio.transcript;
          res.write(`data: ${JSON.stringify({ type: "transcript", data: delta.audio.transcript })}\n\n`);
        }

        if (delta?.audio?.data) {
          res.write(`data: ${JSON.stringify({ type: "audio", data: delta.audio.data })}\n\n`);
        }
      }

      // 7. Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", assistantTranscript);

      res.write(`data: ${JSON.stringify({ type: "done", transcript: assistantTranscript })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error processing voice message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to process voice message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process voice message" });
      }
    }
  });
}
