import { type Express, type Request, type Response } from "express";
import { chatStorage } from "./storage";
import { storage } from "../../storage";
import { buildKnowledgeIndex, searchKnowledge } from "../../knowledge";
import { isOpenAIAvailable, reformulateWithOpenAI } from "../openai/chat";
import { searchEmbeddings } from "../embeddings";

// Helper functions for chat responses
function extractExcerpt(text: string, query: string, maxLen = 500): string {
  // Clean up the text first
  let cleaned = text.replace(/\s+/g, " ").trim();
  
  // Try to find relevant section based on query
  const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  let bestIdx = 0;
  let bestScore = 0;
  
  // Look for concentration of query words
  for (let i = 0; i < cleaned.length - 100; i += 50) {
    const window = cleaned.slice(i, i + 400).toLowerCase();
    let score = 0;
    for (const word of queryWords) {
      if (window.includes(word)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  
  // Extract a larger section
  let excerpt = cleaned.slice(bestIdx, bestIdx + maxLen * 2).trim();
  
  // Try to start at a sentence or paragraph boundary
  const sentenceStart = excerpt.search(/[.!?]\s+[A-ZÁÉÍÓÚa-z]/);
  if (sentenceStart > 0 && sentenceStart < 80) {
    excerpt = excerpt.slice(sentenceStart + 2);
  }
  
  // Find a good ending point (sentence boundary)
  const sentences = excerpt.split(/([.!?])\s+/);
  let result = "";
  let currentLen = 0;
  
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i] + (sentences[i + 1] || "");
    if (currentLen + sentence.length > maxLen && result.length > 100) {
      break;
    }
    result += sentence + " ";
    currentLen += sentence.length;
  }
  
  return result.trim() || excerpt.slice(0, maxLen).trim();
}

function formatSourceDate(addedAt?: number): string | null {
  if (!addedAt) return null;
  const formatted = new Date(addedAt).toLocaleDateString("pt-BR");
  return `inserido em ${formatted}`;
}

function formatSources(docs: Array<{ title: string; link?: string; addedAt?: number }>): string {
  return docs
    .map((d) => {
      const title = d.link ? `[${d.title}](${d.link})` : d.title;
      const dateLabel = formatSourceDate(d.addedAt) || "data nao registrada";
      return `- ${title} (${dateLabel})`;
    })
    .join("\n");
}

function addBoldMarkers(text: string): string {
  const tokens = [
    "PDDE",
    "PNAE",
    "PNATE",
    "FNDE",
    "PAR",
    "prestacao",
    "prestação",
    "prazo",
    "prazos",
    "valor",
    "valores",
    "indicador",
    "indicadores",
    "documento",
    "documentos",
  ];

  let result = text;
  for (const token of tokens) {
    const regex = new RegExp(`\\b(${token})\\b`, "i");
    if (regex.test(result)) {
      result = result.replace(regex, "**$1**");
    }
  }

  if (!result.includes("**")) {
    const firstWords = result.trim().split(/\s+/).slice(0, 2).join(" ");
    if (firstWords.length > 0) {
      result = result.replace(firstWords, `**${firstWords}**`);
    }
  }

  return result;
}

function extractAssistantBody(text: string): string {
  const markerList = ["📚 **Fontes:**", "**Fontes:**", "Fontes:"];
  for (const marker of markerList) {
    const index = text.indexOf(marker);
    if (index > -1) {
      return text.slice(0, index).trim();
    }
  }
  return text.trim();
}

function extractFirstSentence(text: string): string {
  const match = text.match(/[^.!?]+[.!?]/);
  return (match ? match[0] : text).trim();
}

function buildDocumentResponse(docs: Array<{ title: string; content: string; link?: string }>, query: string): string {
  if (docs.length === 0) {
    return addBoldMarkers("Não encontrei essa informação aqui no sistema agora.\nVocê quis dizer algum termo parecido? Só pra eu entender melhor.\nSe ainda assim eu não tiver, a Mairã acompanha as dúvidas sem resposta e pode buscar isso depois.\nSe você voltar mais tarde, é bem possível que já tenha algo 😊");
  }
  
  let response = "";
  
  // Get the most relevant excerpt from the first document
  const mainDoc = docs[0];
  const mainExcerpt = extractExcerpt(mainDoc.content || "", query);
  
  // Start with a more conversational intro
  response += "**Resumo rápido:**\n";
  response += mainExcerpt;
  
  // Add complementary info from other docs if they add value
  if (docs.length > 1 && docs.length <= 3 && mainExcerpt.length < 400) {
    const secondExcerpt = extractExcerpt(docs[1].content || "", query, 600);
    // Only add if it's different enough from the first and has meaningful content
    if (secondExcerpt && secondExcerpt.length > 200 && !mainExcerpt.includes(secondExcerpt.slice(0, 50))) {
      response += `\n\n**Complemento:**\n${secondExcerpt}`;
    }
  }
  
  // Add helpful closing
  response += "\n\n💬 Se quiser, me conta a realidade da sua escola que eu explico com um exemplo.";
  
  // Add sources
  const sourceList = formatSources(docs.slice(0, 2));
  response += `\n\n📚 **Fontes:**\n${sourceList}`;
  
  return addBoldMarkers(response.trim());
}

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (_req: Request, res: Response) => {
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

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Ensure index exists (build on demand)
      try {
        await buildKnowledgeIndex();
      } catch (e) {
        console.error("Failed to build knowledge index:", e);
      }

      const userMessages = messages.filter((m) => m.role === "user");
      const lastUserMessage = userMessages[userMessages.length - 1];
      let query = (lastUserMessage && lastUserMessage.content) ? lastUserMessage.content : "";

      const isGreeting = (text: string): boolean => {
        const cleaned = text.toLowerCase().trim();
        if (!cleaned) return false;
        const normalized = cleaned.replace(/[!?.",']/g, "").trim();
        const greetingRegex = /^(oi|ola|ol[aá]|bom dia|boa tarde|boa noite|e ai|e aí|ei|opa|oii+|olaa+)(\s+(tudo bem|como vai|como voce esta|como você está))?$/i;
        if (greetingRegex.test(normalized)) return true;
        const words = normalized.split(/\s+/).filter(Boolean);
        const startsWithGreeting = /^(oi|ola|ol[aá]|bom dia|boa tarde|boa noite|e ai|e aí|ei|opa|oii+|olaa+)$/i.test(words[0] || "");
        return (startsWithGreeting && words.length <= 6) || (startsWithGreeting && normalized.length <= 30) || normalized.length <= 6;
      };

      const isSmallTalk = (text: string): boolean => {
        const normalized = text.toLowerCase().trim();
        return /^(tudo bem|tudo bem\?|tudo certo|como vai|como vc ta|como voce ta|como você tá|beleza)\b/i.test(normalized);
      };

      const isFollowUpRequest = (text: string): boolean => {
        const normalized = text.toLowerCase();
        return /(explica|explique|explicar|melhor|exemplo|exemplos|resuma|resume|simplifica|jeito mais simples|o que isso quer dizer|como faço|como fazer|como organizo|como organizo isso|organizar|fala de um jeito mais simples|isso|assim|quero saber mais|me explica|detalhe)/i.test(normalized);
      };

      const isShortContinuation = (text: string): boolean => {
        const normalized = text.toLowerCase().trim();
        return /^(sim|isso|quero|pode|ok|pode sim|quero sim|pode ser)$/i.test(normalized);
      };

      const isProgramAmbiguous = (text: string): boolean => {
        const normalized = text.toLowerCase();
        return /(verba|dinheiro|recurso|recursos|saldo|repasse|programa)/i.test(normalized)
          && !/(pdde|pnae|pnate|vaar)/i.test(normalized);
      };

      const lastAssistantWithSources = [...messages]
        .reverse()
        .find((m) => m.role === "assistant" && m.content.includes("Fontes"));

      const stripFormalOpening = (text: string): string => {
        const lines = text.trim().split(/\n+/);
        const firstLine = lines[0] || "";
        const formalOpeners = [
          "ola! e um prazer",
          "olá! é um prazer",
          "e um prazer conversar",
          "estou aqui para ajudar",
          "olá! como posso ajudar",
        ];
        const normalizedFirst = firstLine.toLowerCase();
        if (formalOpeners.some((o) => normalizedFirst.includes(o))) {
          return lines.slice(1).join("\n").trim() || text;
        }
        return text;
      };

      const normalizeText = (text: string): string => {
        return text
          .toLowerCase()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "");
      };

      const shouldUseReformulated = (
        reformulated: string,
        sources: Array<{ title: string; content: string; link?: string }>
      ): boolean => {
        const combined = normalizeText(
          sources.map((s) => `${s.title} ${s.content} ${s.link || ""}`).join(" ")
        );
        const answer = normalizeText(reformulated);

        const sensitiveTokens = ["resolucao", "lei", "portaria", "decreto", "art.", "artigo"];
        for (const token of sensitiveTokens) {
          if (answer.includes(token) && !combined.includes(token)) return false;
        }

        const yearMatch = answer.match(/\b(19|20)\d{2}\b/);
        if (yearMatch && !combined.includes(yearMatch[0])) return false;

        const percentMatch = answer.match(/\b\d{1,3}\s*%\b/);
        if (percentMatch && !combined.includes(percentMatch[0])) return false;

        return true;
      };

      let assistantMessage = "";

      if (query && (isFollowUpRequest(query) || isShortContinuation(query)) && lastAssistantWithSources) {
        const baseText = extractAssistantBody(lastAssistantWithSources.content);
        const exampleSeed = extractFirstSentence(baseText);
        assistantMessage = addBoldMarkers(
          `Vamos por partes, bem simples:\n${baseText}\n\nExemplo: ${exampleSeed}`
        );

        await chatStorage.createMessage(conversationId, "assistant", assistantMessage);
        res.write(`data: ${JSON.stringify({ content: assistantMessage })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      if (query && isSmallTalk(query)) {
        const smallTalkResponse =
          "Oi! 😊 Tudo bem por aqui. E com você?\n" +
          "Quer falar de **PDDE**, **PNAE**, **PNATE** ou outra coisa da gestão?";

        await chatStorage.createMessage(conversationId, "assistant", smallTalkResponse);
        res.write(`data: ${JSON.stringify({ content: smallTalkResponse })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      if (query && isGreeting(query)) {
        const greetingResponse =
          "Oi! 😊 Tudo bem por aí?\n" +
          "Você quer falar de **PDDE**, **PNAE**, **PNATE** ou outra coisa?";

        await chatStorage.createMessage(conversationId, "assistant", greetingResponse);
        res.write(`data: ${JSON.stringify({ content: greetingResponse })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      // Prepare multiple search queries based on user intent
      const searchQueries: string[] = [query];
      const queryLower = query.toLowerCase();
      
      // Add specific search terms based on detection
      if (queryLower.match(/sabão|sabao|detergente|desinfetante|álcool|alcool|limpeza/)) {
        searchQueries.push("material de limpeza");
        searchQueries.push("posso comprar material de limpeza");
      }
      
      if (queryLower.match(/papel|caneta|lápis|lapis|grampo|cola|fita|expediente/)) {
        searchQueries.push("material de expediente");
        searchQueries.push("posso comprar papel caneta");
      }
      
      if (queryLower.match(/ventilador|bebedouro|geladeira|fogão/)) {
        searchQueries.push("equipamentos aparelhos");
        searchQueries.push("posso comprar ventilador bebedouro");
      }
      
      if (queryLower.match(/carteira|mesa|cadeira|armário|armario|móvel|movel|mobili/)) {
        searchQueries.push("mobiliário carteira mesa");
        searchQueries.push("posso comprar carteiras mesas");
      }
      
      if (queryLower.match(/computador|impressora|notebook|tablet|informática|informatica/)) {
        searchQueries.push("equipamentos informática computador");
        searchQueries.push("posso comprar computador");
      }

      if (queryLower.match(/pesquisa de pre[çc]os|cota[cç][aã]o|or[çc]amento|or[çc]amentos/)) {
        searchQueries.push("pesquisa de preços");
        searchQueries.push("cotação de preços");
        searchQueries.push("orçamentos");
      }
      
      // Perform multiple searches and combine unique results
      const allDocs = new Map<string, any>();

      // Embedding search on the original query (if enabled)
      try {
        const embeddingDocs = await searchEmbeddings(query, 3);
        for (const doc of embeddingDocs) {
          if (doc && doc.id) {
            allDocs.set(doc.id, doc);
          }
        }
      } catch (error) {
        console.warn("[chat] Embedding search failed:", error);
      }

      for (const searchQuery of searchQueries) {
        const docs = await searchKnowledge(searchQuery, 5);
        for (const doc of docs) {
          if (doc && doc.id) {
            allDocs.set(doc.id, doc);
          }
        }
      }
      
      const topDocs = Array.from(allDocs.values()).slice(0, 5);

      // Check if we have relevant results
      if (!topDocs || topDocs.length === 0) {
        // No results found - inform user politely
        if (lastAssistantWithSources && isFollowUpRequest(query)) {
          const baseText = extractAssistantBody(lastAssistantWithSources.content);
          const exampleSeed = extractFirstSentence(baseText);
          assistantMessage = addBoldMarkers(
            `Vamos por partes, bem simples:\n${baseText}\n\nExemplo: ${exampleSeed}`
          );
        } else {
          const programPrompt = isProgramAmbiguous(query)
            ? "Você está falando de **PDDE**, **PNAE** ou **PNATE**?"
            : "Você quis dizer algum termo parecido? Só pra eu entender melhor.";
          assistantMessage = addBoldMarkers(
            `Não encontrei essa informação aqui no sistema agora.\n${programPrompt}\n` +
            "Se ainda assim eu não tiver, a Mairã acompanha as dúvidas sem resposta e pode buscar isso depois.\n" +
            "Se você voltar mais tarde, é bem possível que já tenha algo 😊"
          );
        }
        if (lastUserMessage) {
          try {
            await storage.createUnansweredQuestion({ question: lastUserMessage.content, status: "pending" });
          } catch (e) {
            console.error("Failed to log unanswered question:", e);
          }
        }
      } else {
          // Try OpenAI first, fallback to Ollama, then document-based response
          const relevantDocs = topDocs.slice(0, 2);
          const excerpts = relevantDocs.map((d) => ({
            title: d.title,
            content: extractExcerpt(d.content || "", query, 500),
            link: d.link,
          }));

          const openaiAvailable = isOpenAIAvailable();
          if (openaiAvailable) {
            console.log("[chat] Using OpenAI for response reformulation");
            try {
              const reformulated = await reformulateWithOpenAI(excerpts, query, 0.4);
              if (reformulated && shouldUseReformulated(reformulated, excerpts)) {
                assistantMessage = addBoldMarkers(stripFormalOpening(reformulated));
                assistantMessage += `\n\n📚 **Fontes:**\n${formatSources(relevantDocs)}`;
              } else {
                assistantMessage = buildDocumentResponse(topDocs, query);
              }
            } catch (e) {
              console.error("Error using OpenAI:", e);
              assistantMessage = buildDocumentResponse(topDocs, query);
            }
          } else {
            console.warn("[chat] OpenAI not configured. Set OPENAI_API_KEY to enable.");
            assistantMessage = buildDocumentResponse(topDocs, query);
          }
      }

      await chatStorage.createMessage(conversationId, "assistant", assistantMessage);
      res.write(`data: ${JSON.stringify({ content: assistantMessage })}\n\n`);
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

}

