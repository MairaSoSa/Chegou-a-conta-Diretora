import { type Express } from "express";
import { db, sqlite } from "./db";
import { cadernoDocuments, cadernoDocumentVersions, cadernoNotes, cadernoSources } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { searchSchoolsLocal } from "./importador";

// ── Detecta e monta contexto rico de uma escola a partir do texto da mensagem ─
function buscarDadosEscolaParaChat(texto: string, inepParam?: string): string {
  let inep = inepParam?.trim() || "";

  // 1. Tenta detectar código INEP (7-8 dígitos) na mensagem
  if (!inep) {
    const match = texto.match(/\b(\d{7,8})\b/);
    if (match) inep = match[1];
  }

  // 2. Tenta buscar por nome de escola apenas quando há menção explícita com prefixo
  // Ex: "escola Dom Mario", "colégio Tiradentes", "EMEF Santos Dumont"
  if (!inep) {
    const nomeMatch = texto.match(/(?:escola|colégio|colegio|emef|emei|eem|eei|eeef|cmei|eja)\s+([A-Za-zÀ-ÿ]{2}[A-Za-zÀ-ÿ\s]{2,40})/i);
    if (nomeMatch) {
      // Pega apenas as 4 primeiras palavras do nome capturado
      const palavras = nomeMatch[1].trim().split(/\s+/).slice(0, 4).join(" ");
      const resultados = searchSchoolsLocal(palavras, 1);
      if (resultados.length > 0) inep = resultados[0].inep;
    }
  }

  if (!inep) return "";

  // ── Dados cadastrais (todos os anos disponíveis) ──────────────────────────
  const censoRows = sqlite.prepare(`
    SELECT ano, nome, municipio, uf, dependencia, localizacao, situacao,
           matriculas, docentes, turmas, dados
    FROM censo_escolar
    WHERE inep = ?
    ORDER BY ano DESC
  `).all(inep) as any[];

  if (censoRows.length === 0) return "";

  const base = censoRows[0];
  const nomeEscola = base.nome || "Escola";

  const linhas: string[] = [
    `DADOS REAIS DA ESCOLA MENCIONADA:`,
    `- Nome: ${nomeEscola}`,
    `- Código INEP: ${inep}`,
    `- Município: ${base.municipio}/${base.uf}`,
    `- Rede: ${base.dependencia}`,
    `- Localização: ${base.localizacao}`,
    `- Situação: ${base.situacao || "Em Atividade"}`,
  ];

  // Infraestrutura do dado mais recente
  if (base.dados) {
    try {
      const d = JSON.parse(base.dados);
      const flags: string[] = [];
      if (d.in_quilombola == 1 || d.in_quilombola === true) flags.push("Escola Quilombola");
      if (d.in_ribeirinha == 1 || d.in_ribeirinha === true) flags.push("Escola Ribeirinha");
      if (d.in_campo == 1 || d.in_campo === true) flags.push("Escola do Campo");
      if (flags.length) linhas.push(`- Tipo especial: ${flags.join(", ")}`);

      const infra: string[] = [];
      if (d.in_internet == 1) infra.push("internet");
      if (d.in_biblioteca == 1 || d.in_sala_leitura == 1) infra.push("biblioteca/sala de leitura");
      if (d.in_quadra_esportes_coberta == 1 || d.in_quadra_esportes_descoberta == 1) infra.push("quadra de esportes");
      if (d.in_laboratorio_informatica == 1) infra.push("laboratório de informática");
      if (d.in_laboratorio_ciencias == 1) infra.push("laboratório de ciências");
      if (d.in_agua_potavel == 1) infra.push("água potável");
      if (infra.length) linhas.push(`- Infraestrutura (${base.ano}): ${infra.join(", ")}`);
    } catch {}
  }

  // Evolução de matrículas, docentes, turmas por ano
  const evoLinhas: string[] = [];
  for (const row of censoRows) {
    const partes: string[] = [];
    if (row.matriculas != null) partes.push(`${row.matriculas} matrículas`);
    if (row.docentes != null) partes.push(`${row.docentes} docentes`);
    if (row.turmas != null) partes.push(`${row.turmas} turmas`);
    if (partes.length) evoLinhas.push(`  ${row.ano}: ${partes.join(", ")}`);
  }
  if (evoLinhas.length) linhas.push(`- Histórico:\n${evoLinhas.join("\n")}`);

  // ── Indicadores educacionais ──────────────────────────────────────────────
  const indicadores = sqlite.prepare(`
    SELECT tipo, ano, dados
    FROM indicadores_educacionais
    WHERE inep = ?
    ORDER BY tipo, ano DESC
  `).all(inep) as any[];

  if (indicadores.length > 0) {
    const porTipo: Record<string, any[]> = {};
    for (const ind of indicadores) {
      if (!porTipo[ind.tipo]) porTipo[ind.tipo] = [];
      porTipo[ind.tipo].push(ind);
    }

    const indLinhas: string[] = [];

    // IDEB
    if (porTipo.ideb) {
      for (const row of porTipo.ideb.slice(0, 3)) {
        try {
          const d = JSON.parse(row.dados || "{}");
          const partes: string[] = [];
          if (d.ideb_ai != null) partes.push(`Anos Iniciais: ${d.ideb_ai}`);
          if (d.ideb_af != null) partes.push(`Anos Finais: ${d.ideb_af}`);
          if (d.ideb_em != null) partes.push(`Ensino Médio: ${d.ideb_em}`);
          if (partes.length) indLinhas.push(`  IDEB ${row.ano}: ${partes.join(" | ")}`);
        } catch {}
      }
    }

    // INSE
    if (porTipo.inse) {
      const row = porTipo.inse[0];
      try {
        const d = JSON.parse(row.dados || "{}");
        if (d.inse_valor != null || d.media != null) {
          indLinhas.push(`  INSE ${row.ano}: ${d.inse_valor ?? d.media ?? "—"} (nível socioeconômico)`);
        }
      } catch {}
    }

    // ICG
    if (porTipo.icg) {
      const row = porTipo.icg[0];
      try {
        const d = JSON.parse(row.dados || "{}");
        if (d.icg != null || d.valor != null) {
          indLinhas.push(`  ICG ${row.ano}: ${d.icg ?? d.valor ?? "—"} (complexidade de gestão)`);
        }
      } catch {}
    }

    // TDI
    if (porTipo.tdi) {
      const row = porTipo.tdi[0];
      try {
        const d = JSON.parse(row.dados || "{}");
        if (d.tdi != null || d.valor != null || d.tdi_total != null) {
          indLinhas.push(`  Taxa de Distorção Idade-Série ${row.ano}: ${d.tdi ?? d.tdi_total ?? d.valor ?? "—"}%`);
        }
      } catch {}
    }

    if (indLinhas.length) {
      linhas.push(`- Indicadores educacionais:\n${indLinhas.join("\n")}`);
    }
  }

  return linhas.join("\n");
}

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

      // Texto completo das últimas mensagens para detectar escola/INEP
      const textoConversa = messages.slice(-4)
        .map((m: any) => m.content || "")
        .join(" ");

      const contextParts: string[] = [];

      // ── Dados reais da escola (detecta por INEP explícito, ou busca na mensagem) ──
      const dadosEscola = buscarDadosEscolaParaChat(textoConversa, inep ? String(inep) : undefined);
      if (dadosEscola) {
        contextParts.push(dadosEscola);
      }

      // ── Anotações recentes do caderno ────────────────────────────────────────
      const notes = sqlite.prepare(
        "SELECT title, content FROM caderno_notes ORDER BY created_at DESC LIMIT 5"
      ).all() as any[];

      if (notes.length > 0) {
        const noteLines = notes.map((n: any) => `- ${n.title}: ${String(n.content).slice(0, 120)}`);
        contextParts.push(`ANOTAÇÕES RECENTES DO CADERNO:\n${noteLines.join("\n")}`);
      }

      const contextBlock = contextParts.length > 0
        ? `\n\n---\nCONTEXTO DISPONÍVEL (dados reais do sistema):\n${contextParts.join("\n\n")}\n---`
        : "";

      const docTypeMap: Record<string, string> = {
        ata: "Ata de Reunião",
        oficio: "Ofício",
        pesquisa: "Pesquisa de Preços",
        relatorio: "Relatório de Execução",
      };
      const docTypeName = documentType ? (docTypeMap[documentType] || documentType) : null;

      const isEditorContext = chatContext === "editor";
      const isFieldReview = chatContext === "field_review";

      const systemPrompt = isFieldReview
        ? `Você é uma revisora de textos do "Caderno da Diretora". Sua tarefa é analisar o conteúdo de um campo específico de um documento escolar e dar um feedback curto e direto.

Regras:
- Responda em no máximo 2 frases curtas
- Se o texto for claramente errado (ex: "xxxxxxx", "aaa", texto aleatório, sem sentido), diga isso diretamente: "Esse conteúdo não parece adequado para este campo."
- Se faltar informação importante, aponte o que falta
- Se estiver bom, confirme brevemente e sugira algum detalhe para completar
- Se houver erro de português, corrija com gentileza
- NUNCA use os conectores "Além disso", "Portanto", "Ademais"
- Fale de forma simples, como uma colega diretora de escola`
        : isEditorContext
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

DADOS REAIS DO SISTEMA:
Quando o contexto abaixo tiver dados de uma escola, use esses dados para responder. Não invente — se não estiver no contexto, diga que não tem essa informação disponível.
Nunca invente dados (valores, datas, nomes) — use [informar] quando necessário.
Responda SOMENTE sobre gestão escolar e PDDE. Máximo 300 palavras, exceto ao gerar documentos.

OBRIGATÓRIO — FINAL DE CADA RESPOSTA:
Sempre termine a resposta com este bloco (adapte ao tema da pergunta):

---
**Para saber mais:** [cite 1 ou 2 unidades relevantes da lista abaixo com o link correto, e/ou a página de legislação do site]

Unidades disponíveis (use o link exato):
- [Como funciona o PDDE](/trilha?unit=U03) — regras e funcionamento
- [O que é a UEx e o conselho escolar](/trilha?unit=U05) — associação e colegiado
- [Como planejar o uso dos recursos](/trilha?unit=U12) — planejamento de compras
- [O que pode ser pago com os recursos](/trilha?unit=U13) — itens permitidos e vedados
- [Como funciona a prestação de contas](/trilha?unit=U16) — documentos e prazos
- [Notas fiscais e comprovantes](/trilha?unit=U14) — como guardar os documentos
- [Legislação e normas do PDDE](/legislacao) — leis e resoluções completas${contextBlock}`;

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 1400,
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
