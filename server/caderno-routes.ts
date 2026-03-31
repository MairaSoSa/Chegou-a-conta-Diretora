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

  app.post("/api/caderno/chat", async (req, res) => {
    try {
      const { messages, inep, documentType, chatContext } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ ok: false, message: "messages é obrigatório" });
      }

      const contextParts: string[] = [];

      if (inep && String(inep).length >= 7) {
        const escola = sqlite.prepare(`
          SELECT inep, nome, municipio, uf, dependencia, localizacao, matriculas, ano
          FROM censo_escolar WHERE inep = ? ORDER BY ano DESC LIMIT 1
        `).get(String(inep)) as any;

        if (escola) {
          contextParts.push(
            `ESCOLA DA DIRETORA:\n- Nome: ${escola.nome}\n- Município: ${escola.municipio}/${escola.uf}\n- Rede: ${escola.dependencia}\n- Localização: ${escola.localizacao}\n- Matrículas (${escola.ano}): ${escola.matriculas?.toLocaleString("pt-BR") || "—"}`
          );
        }

        const indicadores = sqlite.prepare(`
          SELECT tipo, ano, valor FROM indicadores_educacionais
          WHERE inep = ? ORDER BY ano DESC LIMIT 30
        `).all(String(inep)) as any[];

        if (indicadores.length > 0) {
          const seen = new Set<string>();
          const linhas: string[] = [];
          for (const ind of indicadores) {
            if (!seen.has(ind.tipo)) {
              seen.add(ind.tipo);
              linhas.push(`- ${ind.tipo}: ${ind.valor} (${ind.ano})`);
            }
          }
          if (linhas.length > 0) {
            contextParts.push(`INDICADORES EDUCACIONAIS:\n${linhas.join("\n")}`);
          }
        }
      }

      const notes = sqlite.prepare(
        "SELECT title, content FROM caderno_notes ORDER BY created_at DESC LIMIT 5"
      ).all() as any[];

      if (notes.length > 0) {
        const noteLines = notes.map((n: any) => `- ${n.title}: ${String(n.content).slice(0, 120)}`);
        contextParts.push(`ANOTAÇÕES RECENTES DO CADERNO:\n${noteLines.join("\n")}`);
      }

      const contextBlock = contextParts.length > 0
        ? `\n\n---\nCONTEXTO DISPONÍVEL:\n${contextParts.join("\n\n")}\n---`
        : "";

      const docTypeMap: Record<string, string> = {
        ata: "Ata de Reunião",
        oficio: "Ofício",
        pesquisa: "Pesquisa de Preços",
        relatorio: "Relatório de Execução",
      };
      const docTypeName = documentType ? (docTypeMap[documentType] || documentType) : null;

      const isEditorContext = chatContext === "editor";

      const systemPrompt = isEditorContext
        ? `Você é uma assistente de redação do "Caderno da Diretora". Você ajuda diretoras de escolas públicas — incluindo escolas quilombolas e ribeirinhas — a escrever os documentos que a escola precisa.${docTypeName ? `\n\nDocumento sendo escrito agora: **${docTypeName}**` : ""}

Sua única função é ajudar a escrever, corrigir e melhorar documentos escolares.

REGRA MAIS IMPORTANTE — LINGUAGEM:
Fale como se estivesse conversando com uma colega diretora de escola. Use palavras do dia a dia. Frases curtas. Sem palavras complicadas.
❌ Errado: "Proceda com a formalização dos dados da entidade executora no preâmbulo documental."
✅ Certo: "No começo da ata, escreva o nome da escola, a data e quem estava presente na reunião."

❌ Errado: "Conforme as normativas vigentes, a aquisição deve ser precedida de cotação mercadológica."
✅ Certo: "Antes de comprar qualquer coisa com o dinheiro da escola, você precisa pesquisar o preço em pelo menos três lugares diferentes. É como quando você vai ao mercado comparar preços antes de decidir onde comprar o arroz."

Como você ajuda:
- Escreve o texto completo pronto para a diretora copiar e só preencher os dados
- Explica cada parte do documento de forma simples
- Corrige erros de português e explica o que mudou, de forma gentil
- Coloca [informar] onde faltam dados que só a diretora sabe
- Avisa quando está faltando alguma coisa importante no documento

Regras:
- Responda SOMENTE sobre escrever e revisar documentos escolares
- Se a pergunta for sobre outro assunto, diga com carinho: "Esse chat é só para ajudar a escrever os documentos. Para essa dúvida, use a Folha de Pesquisa ao lado."
- NUNCA invente nomes, datas, valores ou CNPJs — use [informar]
- Ao gerar o texto do documento, use formatação clara com títulos e espaços${contextBlock}`
        : `Você é a assistente do "Caderno da Diretora". Você ajuda diretoras de escolas públicas brasileiras — especialmente de comunidades quilombolas, ribeirinhas e do campo — a entender e cuidar da gestão da escola.

Você responde dúvidas sobre PDDE, documentos, conselho escolar, prestação de contas e leis da educação.${docTypeName ? `\n\nDocumento sendo editado: ${docTypeName}` : ""}

REGRA MAIS IMPORTANTE — LINGUAGEM:
Fale como se estivesse numa conversa com uma colega diretora de escola. Use palavras simples, frases curtas. Sempre dê um exemplo do dia a dia para explicar.

Exemplos do jeito certo de falar:
❌ "O PDDE é um programa de transferência de recursos financeiros às entidades executoras."
✅ "O PDDE é o dinheiro que o governo manda direto para a escola — sem passar pela prefeitura — para a escola comprar o que precisa e fazer pequenos reparos."

❌ "A UEx é a unidade executora responsável pela gestão dos recursos financeiros."
✅ "A UEx é a associação de pais e professores que existe para receber e cuidar do dinheiro do PDDE. É como um grupo de confiança que cuida do dinheiro junto com a diretora."

❌ "É necessário realizar processo de cotação mercadológica prévia à aquisição."
✅ "Antes de comprar qualquer coisa com o dinheiro da escola, você precisa pesquisar o preço em pelo menos três lugares. Assim você prova que escolheu o mais barato e tudo fica certinho na prestação de contas."

Pense sempre na realidade de quem trabalha nessas escolas: às vezes a cidade fica longe, o acesso é de barco, as reuniões acontecem na própria comunidade, e os fornecedores podem ser do entorno da comunidade mesmo.

Seja acolhedora e encorajadora. A diretora está fazendo um trabalho muito importante.

Nunca invente dados (valores, datas, nomes) — use [informar].
Responda SOMENTE sobre gestão escolar e PDDE. Máximo 300 palavras, exceto ao gerar documentos.${contextBlock}`;

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 1200,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-12).map((m: any) => ({ role: m.role, content: m.content })),
        ],
      });

      const reply = response.choices?.[0]?.message?.content?.trim() || "Não consegui gerar uma resposta.";
      res.json({ ok: true, reply });
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
