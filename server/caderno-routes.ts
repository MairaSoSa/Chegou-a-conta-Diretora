import { type Express } from "express";
import { db, sqlite } from "./db";
import { cadernoDocuments, cadernoDocumentVersions, cadernoNotes, cadernoSources } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export function registerCadernoRoutes(app: Express): void {

  app.get("/api/caderno/escola/:inep", async (req, res) => {
    try {
      const inep = String(req.params.inep).trim();
      if (!inep || inep.length < 7) {
        return res.status(400).json({ ok: false, message: "Código INEP inválido" });
      }
      const row = sqlite.prepare(`
        SELECT inep, nome, municipio, uf, dependencia, localizacao, matriculas
        FROM censo_escolar
        WHERE inep = ?
        ORDER BY ano DESC
        LIMIT 1
      `).get(inep) as any;

      if (!row) {
        return res.json({ ok: false, message: "Escola não encontrada" });
      }
      res.json({
        ok: true,
        escola: {
          inep: row.inep,
          nome: row.nome,
          municipio: row.municipio,
          uf: row.uf,
          rede: row.dependencia,
          localizacao: row.localizacao,
          matriculas: row.matriculas,
        },
      });
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  app.get("/api/caderno/documentos", async (_req, res) => {
    try {
      const docs = await db.select().from(cadernoDocuments).orderBy(desc(cadernoDocuments.updatedAt));
      res.json({ ok: true, documents: docs });
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  app.post("/api/caderno/documentos", async (req, res) => {
    try {
      const { type, title, inep, headerData, bodyHtml } = req.body;
      if (!type || !title) {
        return res.status(400).json({ ok: false, message: "Tipo e título são obrigatórios" });
      }
      const now = Date.now();
      const result = sqlite.prepare(`
        INSERT INTO caderno_documents (type, title, inep, header_data, body_html, status, quality_score, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'rascunho', 'red', ?, ?)
      `).run(type, title, inep || null, headerData ? JSON.stringify(headerData) : null, bodyHtml || "", now, now);

      const doc = sqlite.prepare("SELECT * FROM caderno_documents WHERE id = ?").get(result.lastInsertRowid) as any;
      res.status(201).json({ ok: true, document: doc });
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  app.get("/api/caderno/documentos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const doc = sqlite.prepare("SELECT * FROM caderno_documents WHERE id = ?").get(id) as any;
      if (!doc) {
        return res.status(404).json({ ok: false, message: "Documento não encontrado" });
      }
      res.json({ ok: true, document: doc });
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  app.put("/api/caderno/documentos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, bodyHtml, headerData, status, qualityScore, inep, logoUrl } = req.body;
      const now = Date.now();

      const sets: string[] = [];
      const vals: any[] = [];

      if (title !== undefined) { sets.push("title = ?"); vals.push(title); }
      if (bodyHtml !== undefined) { sets.push("body_html = ?"); vals.push(bodyHtml); }
      if (headerData !== undefined) { sets.push("header_data = ?"); vals.push(typeof headerData === "string" ? headerData : JSON.stringify(headerData)); }
      if (status !== undefined) { sets.push("status = ?"); vals.push(status); }
      if (qualityScore !== undefined) { sets.push("quality_score = ?"); vals.push(qualityScore); }
      if (inep !== undefined) { sets.push("inep = ?"); vals.push(inep); }
      if (logoUrl !== undefined) { sets.push("logo_url = ?"); vals.push(logoUrl); }

      sets.push("updated_at = ?");
      vals.push(now);
      vals.push(id);

      sqlite.prepare(`UPDATE caderno_documents SET ${sets.join(", ")} WHERE id = ?`).run(...vals);

      const doc = sqlite.prepare("SELECT * FROM caderno_documents WHERE id = ?").get(id) as any;
      res.json({ ok: true, document: doc });
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  app.post("/api/caderno/documentos/:id/versao", async (req, res) => {
    try {
      const docId = parseInt(req.params.id);
      const doc = sqlite.prepare("SELECT * FROM caderno_documents WHERE id = ?").get(docId) as any;
      if (!doc) {
        return res.status(404).json({ ok: false, message: "Documento não encontrado" });
      }
      const now = Date.now();
      sqlite.prepare(`
        INSERT INTO caderno_document_versions (document_id, body_html, header_data, created_at)
        VALUES (?, ?, ?, ?)
      `).run(docId, doc.body_html || "", doc.header_data || null, now);

      const count = (sqlite.prepare("SELECT COUNT(*) as c FROM caderno_document_versions WHERE document_id = ?").get(docId) as any).c;
      if (count > 10) {
        sqlite.prepare(`
          DELETE FROM caderno_document_versions WHERE id IN (
            SELECT id FROM caderno_document_versions WHERE document_id = ? ORDER BY created_at ASC LIMIT ?
          )
        `).run(docId, count - 10);
      }

      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  app.get("/api/caderno/documentos/:id/versoes", async (req, res) => {
    try {
      const docId = parseInt(req.params.id);
      const versions = sqlite.prepare(
        "SELECT id, document_id, created_at FROM caderno_document_versions WHERE document_id = ? ORDER BY created_at DESC LIMIT 10"
      ).all(docId);
      res.json({ ok: true, versions });
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  app.delete("/api/caderno/documentos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      sqlite.prepare("DELETE FROM caderno_document_versions WHERE document_id = ?").run(id);
      sqlite.prepare("DELETE FROM caderno_documents WHERE id = ?").run(id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  app.get("/api/caderno/notas", async (_req, res) => {
    try {
      const notes = await db.select().from(cadernoNotes).orderBy(desc(cadernoNotes.createdAt));
      res.json({ ok: true, notes });
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  app.post("/api/caderno/notas", async (req, res) => {
    try {
      const { title, content, sourceUrl, sourceTitle, sourceExcerpt, tags, documentId, conversationId } = req.body;
      if (!title || !content) {
        return res.status(400).json({ ok: false, message: "Título e conteúdo são obrigatórios" });
      }
      const now = Date.now();
      const result = sqlite.prepare(`
        INSERT INTO caderno_notes (title, content, source_url, source_title, source_excerpt, tags, document_id, conversation_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(title, content, sourceUrl || null, sourceTitle || null, sourceExcerpt || null, tags || null, documentId || null, conversationId || null, now);

      const note = sqlite.prepare("SELECT * FROM caderno_notes WHERE id = ?").get(result.lastInsertRowid);
      res.status(201).json({ ok: true, note });
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  app.delete("/api/caderno/notas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      sqlite.prepare("DELETE FROM caderno_notes WHERE id = ?").run(id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  app.post("/api/caderno/assistente", async (req, res) => {
    try {
      const { action, text, documentType, context } = req.body;
      if (!action || !text) {
        return res.status(400).json({ ok: false, message: "Ação e texto são obrigatórios" });
      }

      const { isOpenAIAvailable, reformulateWithOpenAI } = await import("./integrations/openai/chat.js");
      if (!isOpenAIAvailable()) {
        return res.json({ ok: false, message: "Assistente de IA não configurado (falta chave OpenAI)" });
      }

      const prompts: Record<string, string> = {
        rewrite: `Reescreva o trecho abaixo de forma mais clara e objetiva, mantendo o sentido original. Use linguagem simples e direta, adequada para documentos escolares.\n\nTrecho:\n"${text}"`,
        grammar: `Corrija erros de gramática, concordância e pontuação no trecho abaixo. Liste as correções feitas e retorne o texto corrigido.\n\nTrecho:\n"${text}"`,
        descriptive: `Torne o trecho abaixo mais descritivo e detalhado, sem inventar informações. Sugira onde adicionar dados concretos (datas, valores, nomes).\n\nTrecho:\n"${text}"`,
        completeness: `Analise o documento do tipo "${documentType || "documento"}" e verifique se há campos ou informações faltando. Liste os itens obrigatórios que não aparecem no texto.\n\nTexto:\n"${text}"`,
        checklist: `Gere um checklist de completude para um documento do tipo "${documentType || "documento"}" escolar. Marque com ✅ itens presentes e ❌ itens faltando com base no texto.\n\nTexto:\n"${text}"`,
        inconsistencies: `Analise o texto e aponte possíveis inconsistências: datas incoerentes, valores sem unidade, nomes incompletos, CNPJ/CPF mencionados sem verificação, termos vagos como "conforme combinado" ou "diversos".\n\nTexto:\n"${text}"`,
      };

      const prompt = prompts[action] || `Analise o seguinte texto de um documento escolar e dê sugestões de melhoria:\n\n"${text}"`;

      const systemPrompt = `Você é um assistente de redação para documentos escolares. Responda de forma:
- Clara e objetiva
- Sem juridiquês
- Sugestiva, nunca imperativa ("Talvez possa...", "Falta indicar...")
- Curta (máximo 8 linhas)
Use **negrito** nos pontos principais.`;

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      });

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      });

      const result = response.choices?.[0]?.message?.content?.trim() || "Não foi possível gerar sugestão.";
      res.json({ ok: true, suggestion: result, action });
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });
}
