import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import crypto from "crypto";
import express from "express";
import Papa from "papaparse";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerChatRoutes } from "./integrations/chat";
import { registerObjectStorageRoutes } from "./integrations/object_storage";
import { fetchMecNormasFilters, syncMecNormas } from "./integrations/mecnormas";
import { backfillAiDocumentEmbeddings } from "./integrations/embeddings";
import { getPddeInfo } from "./scraper/pdde";
import { searchDOU, searchDOUForNorma } from "./scraper/dou";
import {
  searchSchoolsLocal, getEscolaCompletaLocal, getEscolaEvolucaoLocal,
  importFromExternalApi, getImportStatus, getLocalSchoolCount, getLocalStats,
  listCensoEscolar, getCensoEscolarDetail, getCensoEstatisticas,
  listIndicador, getIndicadorDetail, getEscolaCompleta, getApiInfo,
} from "./importador";
import { importAllIndicators, getIndicatorImportRunning, getAvailableIndicators, importIdeb, importInse, generateSaebFromIdeb } from "./import-inep-indicators";
import { 
  localizarPrestacoesPorCnpj,
  detalharPrestacao,
  recuperarHistoricoAnalise
} from "./scraper/sigpc";
import { z } from "zod";
import {
  insertToolSchema, insertGlossarySchema, insertTrilhaUnitSchema,
  insertProgramSchema, insertProgramDetailSchema,
  insertAiDocumentSchema
} from "@shared/schema";

const settingsEntrySchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  label: z.string().optional(),
});

const csvUploadSchema = z.object({
  csvData: z.string().min(1, "Dados CSV não fornecidos"),
  label: z.string().optional(),
});

const aiDocFromUrlSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  category: z.string().optional(),
  authHeaderName: z.string().optional(),
  authHeaderValue: z.string().optional(),
});

const mecNormasSyncSchema = z.object({
  buscaTextual: z.string().optional(),
  exata: z.boolean().optional(),
  tipo: z.union([z.number(), z.string()]).optional(),
  assunto: z.union([z.number(), z.string()]).optional(),
  unidade: z.union([z.number(), z.string()]).optional(),
  ordenacao: z.union([z.number(), z.string()]).optional(),
  pageSize: z.number().int().min(1).max(200).optional(),
  currentPage: z.number().int().min(1).optional(),
  maxPages: z.number().int().min(1).max(500).optional(),
});

const embeddingsBackfillSchema = z.object({
  category: z.string().optional(),
  limit: z.number().int().min(1).max(5000).optional(),
});

const VALID_DASHBOARD_CATEGORIES = [
  "enrollment", "ideb", "repasses", "prestacao", "taxas",
  "infraestrutura", "acoes_pdde", "calendario", "escola",
  "icg", "inse", "tdi", "ird", "dsu", "had", "atu", "ied", "afd"
] as const;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin2024";
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

function generateToken(): string {
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac("sha256", ADMIN_PASSWORD).update(timestamp).digest("hex");
  return `${timestamp}.${hmac}`;
}

function verifyToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [timestamp, hmac] = parts;
  const expectedHmac = crypto.createHmac("sha256", ADMIN_PASSWORD).update(timestamp).digest("hex");
  if (hmac !== expectedHmac) return false;
  const createdAt = parseInt(timestamp, 10);
  if (isNaN(createdAt)) return false;
  return Date.now() - createdAt < TOKEN_EXPIRY_MS;
}

function getParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function adminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  const token = authHeader.slice(7);
  if (!verifyToken(token)) {
    return res.status(401).json({ message: "Sessão expirada" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  registerChatRoutes(app);
  registerObjectStorageRoutes(app, adminAuth);

  app.post(
    "/api/admin/extract-text",
    adminAuth,
    (req, _res, next) => {
      console.log("[extract-text] upload", {
        contentType: req.headers["content-type"],
        contentLength: req.headers["content-length"],
        fileName: req.headers["x-file-name"],
      });
      next();
    },
    express.raw({ type: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "application/octet-stream"], limit: "500mb" }),
    async (req: Request, res: Response) => {
      try {
        const contentType = req.headers["content-type"] || "";
        const fileName = (req.headers["x-file-name"] as string) || "documento";
        const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
        if (!Buffer.isBuffer(req.body)) {
          return res.status(400).json({ message: "Corpo do arquivo inválido ou formato não suportado." });
        }

        const buffer = req.body as Buffer;

        if (buffer.length === 0) {
          return res.status(400).json({ message: "Arquivo vazio ou formato não suportado." });
        }

        let text = "";
        const isPdf = contentType.includes("pdf") || fileExt === "pdf";
        const isWord = contentType.includes("wordprocessingml") || contentType.includes("msword") || ["docx", "doc"].includes(fileExt);

        if (isPdf) {
          const parser = new PDFParse({ data: buffer });
          const result = await parser.getText();
          text = result.text;
        } else if (isWord) {
          const result = await mammoth.extractRawText({ buffer });
          text = result.value;
        } else {
          return res.status(400).json({ message: "Formato não suportado. Use PDF ou Word (.docx)." });
        }

        text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

        if (!text) {
          return res.status(422).json({ message: "Não foi possível extrair texto deste arquivo. Ele pode conter apenas imagens." });
        }

        res.json({ text, fileName });
      } catch (err: any) {
        console.error("Text extraction error:", err);
        res.status(500).json({ message: "Erro ao processar arquivo: " + (err.message || "erro desconhecido") });
      }
    }
  );

  // === PUBLIC: SCHOOLS (100% local) ===
  app.get(api.schools.search.path, (req, res) => {
    const query = req.query.q as string | undefined;
    if (!query || query.length < 2) return res.json([]);
    res.json(searchSchoolsLocal(query));
  });

  app.get(api.schools.get.path, (req, res) => {
    const inep = getParam(req.params, "inep");
    const localResults = searchSchoolsLocal(inep);
    if (localResults.length > 0) return res.json(localResults[0]);
    res.status(404).json({ message: "Escola não encontrada. Importe os dados pelo painel admin." });
  });

  // === PUBLIC: ESCOLA COMPLETA (100% local) ===
  app.get("/api/escola-completa/:inep", (req, res) => {
    const inep = getParam(req.params, "inep");
    const ano = parseInt(req.query.ano as string) || new Date().getFullYear();
    const localData = getEscolaCompletaLocal(inep, ano);
    if (localData) return res.json(localData);
    res.json({ co_entidade: parseInt(inep), anos_disponiveis: [], ano_selecionado: ano });
  });

  // === PUBLIC: ESCOLA EVOLUÇÃO (all years - 100% local) ===
  app.get("/api/escola-evolucao/:inep", (req, res) => {
    const inep = getParam(req.params, "inep");
    const localData = getEscolaEvolucaoLocal(inep);
    if (localData) return res.json(localData);
    res.json({ co_entidade: parseInt(inep), anos_disponiveis: [], escola: null, censo_por_ano: {}, indicadores_por_ano: {} });
  });

  // === PUBLIC: API INFO (mirrors api-escolas root) ===
  app.get("/api/info", (_req, res) => {
    res.json(getApiInfo());
  });

  // === PUBLIC: ESCOLA BUSCAR + DETALHE (100% local) ===
  app.get("/api/escola/buscar", (req, res) => {
    const nome = req.query.nome as string;
    const perPage = parseInt(req.query.per_page as string) || 20;
    if (!nome || nome.length < 2) return res.json({ dados: [], total: 0 });

    const localResults = searchSchoolsLocal(nome, perPage);
    res.json({
      dados: localResults.map(s => ({
        co_entidade: s.id,
        no_entidade: s.name,
        no_municipio: s.city,
        sg_uf: s.state,
        ds_dependencia: s.network,
        ds_localizacao: s.location,
        qt_matriculas: s.enrollmentCount,
      })),
      total: localResults.length,
    });
  });

  app.get("/api/escola/:inep", (req, res) => {
    const inep = getParam(req.params, "inep");
    const localData = getEscolaCompleta(inep);
    if (localData) return res.json(localData);
    res.status(404).json({ erro: "Escola não encontrada. Importe os dados pelo painel admin." });
  });

  // === PUBLIC: CENSO ESCOLAR ROUTES ===
  app.get("/api/censo-escolar/:ano/escolas/estatisticas", (req, res) => {
    const ano = parseInt(req.params.ano);
    res.json(getCensoEstatisticas(ano));
  });

  app.get("/api/censo-escolar/:ano/escolas/:inep", (req, res) => {
    const ano = parseInt(req.params.ano);
    const inep = getParam(req.params, "inep");
    const data = getCensoEscolarDetail(ano, inep);
    if (!data) return res.status(404).json({ erro: "Escola não encontrada" });
    res.json(data);
  });

  app.get("/api/censo-escolar/:ano/escolas", (req, res) => {
    const ano = parseInt(req.params.ano);
    const page = parseInt(req.query.pagina as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 20;
    const filters: Record<string, string> = {};
    for (const key of ["uf", "municipio", "nome", "tp_dependencia", "tp_localizacao", "tp_situacao"]) {
      if (req.query[key]) filters[key] = req.query[key] as string;
    }
    res.json(listCensoEscolar(ano, filters, page, perPage));
  });

  // === PUBLIC: INDICATOR ROUTES (local-first) ===
  const INDICATOR_TIPO_MAP: Record<string, string> = {
    "ideb": "ideb",
    "icg": "icg",
    "inse": "inse",
    "tdi": "tdi",
    "ird": "ird",
    "taxa-rendimento": "taxas_rendimento",

    "saeb": "saeb",
    "atu": "atu",
    "had": "had",
    "dsu": "dsu",
    "afd": "afd",
    "ied": "ied",
    "taxa-nao-resposta": "taxa_nao_resposta",
  };

  for (const [apiPath, tipoDb] of Object.entries(INDICATOR_TIPO_MAP)) {
    app.get(`/api/${apiPath}/:ano/escolas/:inep`, (req, res) => {
      const ano = parseInt(req.params.ano);
      const inep = getParam(req.params, "inep");
      const data = getIndicadorDetail(tipoDb, ano, inep);
      if (!data) return res.status(404).json({ erro: "Não encontrado" });
      res.json(data);
    });

    app.get(`/api/${apiPath}/:ano/escolas`, (req, res) => {
      const ano = parseInt(req.params.ano);
      const page = parseInt(req.query.pagina as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 20;
      const filters: Record<string, string> = {};
      for (const key of ["uf", "municipio", "nome", "etapa", "rede"]) {
        if (req.query[key]) filters[key] = req.query[key] as string;
      }
      res.json(listIndicador(tipoDb, ano, filters, page, perPage));
    });
  }

  // === LEGACY: /api/indicador/* routes (backward compat) ===
  for (const [apiPath, tipoDb] of Object.entries(INDICATOR_TIPO_MAP)) {
    app.get(`/api/indicador/${apiPath}/:ano/escolas/:inep`, (req, res) => {
      const ano = parseInt(req.params.ano);
      const inep = getParam(req.params, "inep");
      const data = getIndicadorDetail(tipoDb, ano, inep);
      if (!data) return res.status(404).json({ erro: "Não encontrado" });
      res.json(data);
    });
  }

  // === PUBLIC: PDDE INFO (FNDE Scraper) ===
  app.get("/api/pdde/:inep", async (req, res) => {
    try {
      const inep = getParam(req.params, "inep");
      const ano = parseInt(req.query.ano as string) || new Date().getFullYear();
      if (!/^\d{8}$/.test(inep)) {
        return res.status(400).json({ ok: false, error: "Código INEP deve ter 8 dígitos" });
      }
      const result = await getPddeInfo(ano, inep);
      res.json(result);
    } catch (err: any) {
      console.error("PDDE scraper error:", err.message);
      res.status(500).json({ ok: false, error: "Erro ao consultar dados do FNDE" });
    }
  });

  // === PUBLIC: SIGPC - PRESTAÇÃO DE CONTAS ===
  // Endpoint 1: Localizar prestações por CNPJ (busca inicial)
  app.get("/api/sigpc/localizar/:cnpj", async (req, res) => {
    try {
      const cnpj = decodeURIComponent(req.params.cnpj);
      const anoConcessao = req.query.anoConcessao ? parseInt(req.query.anoConcessao as string) : undefined;

      const result = await localizarPrestacoesPorCnpj(cnpj, anoConcessao);
      res.json(result);
    } catch (err: any) {
      console.error("SIGPC localizar error:", err.message);
      res.status(500).json({ ok: false, error: "Erro ao localizar prestações", prestacoes: [], fonte: "indisponivel" });
    }
  });

  // Endpoint 2: Detalhar prestação por pcId
  app.get("/api/sigpc/detalhar/:pcId", async (req, res) => {
    try {
      const pcId = parseInt(req.params.pcId);
      if (isNaN(pcId)) {
        return res.status(400).json({ ok: false, error: "pcId inválido" });
      }

      const detalhes = await detalharPrestacao(pcId);
      if (!detalhes) {
        return res.status(404).json({ ok: false, error: "Prestação não encontrada" });
      }

      res.json({ ok: true, prestacao: detalhes });
    } catch (err: any) {
      console.error("SIGPC detalhar error:", err.message);
      res.status(500).json({ ok: false, error: "Erro ao detalhar prestação" });
    }
  });

  // Endpoint 3: Histórico de análise por concessaoId
  app.get("/api/sigpc/historico/:concessaoId", async (req, res) => {
    try {
      const concessaoId = parseInt(req.params.concessaoId);
      if (isNaN(concessaoId)) {
        return res.status(400).json({ ok: false, error: "concessaoId inválido" });
      }

      const historico = await recuperarHistoricoAnalise(concessaoId);
      res.json({ ok: true, historico });
    } catch (err: any) {
      console.error("SIGPC historico error:", err.message);
      res.status(500).json({ ok: false, error: "Erro ao recuperar histórico" });
    }
  });

  // === PUBLIC: PROGRAMS ===
  app.get(api.programs.list.path, async (_req, res) => {
    const programs = await storage.getPrograms();
    res.json(programs);
  });

  app.get(api.programs.get.path, async (req, res) => {
    const code = getParam(req.params, "code");
    const program = await storage.getProgramByCode(code);
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }
    const details = await storage.getProgramDetails(code);
    res.json({ ...program, details });
  });

  // === PUBLIC: TOOLS ===
  app.get(api.tools.list.path, async (req, res) => {
    const category = req.query.category as string | undefined;
    const tools = await storage.getTools(category);
    res.json(tools);
  });

  // === PUBLIC: GLOSSARY ===
  app.get(api.glossary.list.path, async (_req, res) => {
    const items = await storage.getGlossary();
    res.json(items);
  });

  // === PUBLIC: TRILHA ===
  app.get(api.trilha.list.path, async (_req, res) => {
    const units = await storage.getTrilhaUnits();
    res.json(units);
  });

  app.get(api.trilha.get.path, async (req, res) => {
    const unitId = getParam(req.params, "unitId");
    const unit = await storage.getTrilhaUnitByUnitId(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }
    res.json(unit);
  });

  // === ADMIN: AUTH ===
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      const token = generateToken();
      res.json({ success: true, token });
    } else {
      res.status(401).json({ message: "Senha incorreta" });
    }
  });

  // === DEBUG: OPENAI ===
  app.get("/api/debug/openai", (_req, res) => {
    res.json({
      configured: !!process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    });
  });

  // === ADMIN: GLOSSARY ===
  app.post("/api/admin/glossary", adminAuth, async (req, res) => {
    try {
      const data = insertGlossarySchema.parse(req.body);
      const item = await storage.createGlossaryItem(data);
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.put("/api/admin/glossary/:id", adminAuth, async (req, res) => {
    try {
      const data = insertGlossarySchema.partial().parse(req.body);
      const id = parseInt(getParam(req.params, "id"), 10);
      const updated = await storage.updateGlossaryItem(id, data);
      if (!updated) return res.status(404).json({ message: "Item não encontrado" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/glossary/:id", adminAuth, async (req, res) => {
    const id = parseInt(getParam(req.params, "id"), 10);
    const deleted = await storage.deleteGlossaryItem(id);
    if (!deleted) return res.status(404).json({ message: "Item não encontrado" });
    res.json({ success: true });
  });

  // === ADMIN: TOOLS ===
  app.post("/api/admin/tools", adminAuth, async (req, res) => {
    try {
      const data = insertToolSchema.parse(req.body);
      const tool = await storage.createTool(data);
      res.json(tool);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.put("/api/admin/tools/:id", adminAuth, async (req, res) => {
    try {
      const data = insertToolSchema.partial().parse(req.body);
      const id = parseInt(getParam(req.params, "id"), 10);
      const updated = await storage.updateTool(id, data);
      if (!updated) return res.status(404).json({ message: "Ferramenta não encontrada" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/tools/:id", adminAuth, async (req, res) => {
    const id = parseInt(getParam(req.params, "id"), 10);
    const deleted = await storage.deleteTool(id);
    if (!deleted) return res.status(404).json({ message: "Ferramenta não encontrada" });
    res.json({ success: true });
  });

  // === ADMIN: TRILHA UNITS ===
  app.post("/api/admin/trilha", adminAuth, async (req, res) => {
    try {
      const data = insertTrilhaUnitSchema.parse(req.body);
      const unit = await storage.createTrilhaUnit(data);
      res.json(unit);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.put("/api/admin/trilha/:id", adminAuth, async (req, res) => {
    try {
      const data = insertTrilhaUnitSchema.partial().parse(req.body);
      const id = parseInt(getParam(req.params, "id"), 10);
      const updated = await storage.updateTrilhaUnit(id, data);
      if (!updated) return res.status(404).json({ message: "Unidade não encontrada" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/trilha/:id", adminAuth, async (req, res) => {
    const id = parseInt(getParam(req.params, "id"), 10);
    const deleted = await storage.deleteTrilhaUnit(id);
    if (!deleted) return res.status(404).json({ message: "Unidade não encontrada" });
    res.json({ success: true });
  });

  // === ADMIN: PROGRAMS ===
  app.post("/api/admin/programs", adminAuth, async (req, res) => {
    try {
      const data = insertProgramSchema.parse(req.body);
      const program = await storage.createProgram(data);
      res.json(program);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.put("/api/admin/programs/:id", adminAuth, async (req, res) => {
    try {
      const data = insertProgramSchema.partial().parse(req.body);
      const id = parseInt(getParam(req.params, "id"), 10);
      const updated = await storage.updateProgram(id, data);
      if (!updated) return res.status(404).json({ message: "Programa não encontrado" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/programs/:id", adminAuth, async (req, res) => {
    const id = parseInt(getParam(req.params, "id"), 10);
    const deleted = await storage.deleteProgram(id);
    if (!deleted) return res.status(404).json({ message: "Programa não encontrado" });
    res.json({ success: true });
  });

  // === ADMIN: PROGRAM DETAILS ===
  app.post("/api/admin/program-details", adminAuth, async (req, res) => {
    try {
      const data = insertProgramDetailSchema.parse(req.body);
      const detail = await storage.createProgramDetail(data);
      res.json(detail);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.put("/api/admin/program-details/:id", adminAuth, async (req, res) => {
    try {
      const data = insertProgramDetailSchema.partial().parse(req.body);
      const id = parseInt(getParam(req.params, "id"), 10);
      const updated = await storage.updateProgramDetail(id, data);
      if (!updated) return res.status(404).json({ message: "Detalhe não encontrado" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/program-details/:id", adminAuth, async (req, res) => {
    const id = parseInt(getParam(req.params, "id"), 10);
    const deleted = await storage.deleteProgramDetail(id);
    if (!deleted) return res.status(404).json({ message: "Detalhe não encontrado" });
    res.json({ success: true });
  });

  // === PUBLIC: SITE SETTINGS ===
  app.get("/api/settings", async (_req, res) => {
    const settings = await storage.getSiteSettings();
    const result: Record<string, string> = {};
    for (const s of settings) result[s.key] = s.value;
    res.json(result);
  });

  // === ADMIN: SITE SETTINGS ===
  app.put("/api/admin/settings", adminAuth, async (req, res) => {
    try {
      const entries = z.array(settingsEntrySchema).parse(req.body);
      const results = [];
      for (const entry of entries) {
        const setting = await storage.upsertSiteSetting(entry.key, entry.value, entry.label);
        results.push(setting);
      }
      res.json(results);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // === PUBLIC: DASHBOARD DATASETS ===
  app.get("/api/dashboard/datasets", async (_req, res) => {
    try {
      const datasets = await storage.getDashboardDatasets();
      // Ensure data is parsed if it's stored as a stringified blob
      const parsedDatasets = datasets.map(d => ({
        ...d,
        data: typeof d.data === 'string' ? JSON.parse(d.data) : d.data
      }));
      res.json(parsedDatasets);
    } catch (error) {
      console.error("Error fetching dashboard datasets:", error);
      res.status(500).json({ message: "Failed to fetch dashboard datasets" });
    }
  });

  app.get("/api/dashboard/datasets/:category", async (req, res) => {
    const category = getParam(req.params, "category");
    const dataset = await storage.getDashboardDatasetByCategory(category);
    if (!dataset) return res.status(404).json({ message: "Dados não encontrados" });
    res.json(dataset);
  });

  // === ADMIN: DATA IMPORT (from external API) ===
  app.post("/api/admin/importar", adminAuth, async (req, res) => {
    const tipos = req.body.tipos as string[] | undefined;
    const anos = req.body.anos as number[] | undefined;
    importFromExternalApi(tipos, anos).then(result => {
      console.log("[Import] Finished:", JSON.stringify(result.errors?.length || 0), "errors");
    });
    res.json({ mensagem: "Importação iniciada em background", status: getImportStatus() });
  });

  app.get("/api/admin/importar-status", adminAuth, async (_req, res) => {
    res.json({ ...getImportStatus(), stats: getLocalStats() });
  });

  app.get("/api/importar-status", async (_req, res) => {
    res.json({ ...getImportStatus(), stats: getLocalStats() });
  });

  app.post("/api/admin/importar-indicadores", adminAuth, async (req, res) => {
    if (getIndicatorImportRunning()) {
      return res.status(409).json({ error: "Importação de indicadores já em andamento" });
    }
    const tipos = req.body.tipos as string[] | undefined;
    const anos = req.body.anos as number[] | undefined;
    importAllIndicators(tipos, anos).then(result => {
      console.log("[INEP] Indicator import finished:", JSON.stringify(result.errors?.length || 0), "errors");
    });
    res.json({ mensagem: "Importação de indicadores INEP iniciada em background", disponíveis: getAvailableIndicators() });
  });

  app.post("/api/admin/importar-ideb", adminAuth, async (req, res) => {
    if (getIndicatorImportRunning()) {
      return res.status(409).json({ error: "Importação já em andamento" });
    }
    const anos = req.body.anos as number[] | undefined;
    importIdeb(anos).then(result => {
      console.log("[INEP] IDEB import finished:", JSON.stringify(result.errors?.length || 0), "errors");
    });
    res.json({ mensagem: "Importação de IDEB iniciada em background" });
  });

  app.post("/api/admin/importar-inse", adminAuth, async (req, res) => {
    if (getIndicatorImportRunning()) {
      return res.status(409).json({ error: "Importação já em andamento" });
    }
    const anos = req.body.anos as number[] | undefined;
    importInse(anos).then(result => {
      console.log("[INEP] INSE import finished:", JSON.stringify(result.errors?.length || 0), "errors");
    });
    res.json({ mensagem: "Importação de INSE iniciada em background" });
  });

  app.post("/api/:tipo/importar", adminAuth, async (req, res) => {
    const tipo = req.params.tipo;
    const tipoMap: Record<string, string> = {
      "censo-escolar": "censo_escolar",
      "ideb": "ideb", "icg": "icg", "inse": "inse",
      "tdi": "tdi", "ird": "ird",
      "taxa-rendimento": "taxas_rendimento",
      "atu": "atu", "had": "had", "dsu": "dsu", "afd": "afd",
      "ied": "ied", "taxa-nao-resposta": "taxa_nao_resposta",
      "saeb": "saeb",
    };
    const dbTipo = tipoMap[tipo as string];
    if (!dbTipo) return res.status(404).json({ erro: "Tipo de indicador não encontrado" });

    const ano = parseInt(req.query.ano as string) || 2024;

    if (dbTipo === "ideb") {
      if (getIndicatorImportRunning()) return res.status(409).json({ error: "Importação já em andamento" });
      importIdeb([ano]).then(r => console.log("[INEP] IDEB import done:", r.errors?.length || 0, "errors"));
      return res.json({ mensagem: `Importação de IDEB ${ano} iniciada` });
    }
    if (dbTipo === "inse") {
      if (getIndicatorImportRunning()) return res.status(409).json({ error: "Importação já em andamento" });
      importInse([ano]).then(r => console.log("[INEP] INSE import done:", r.errors?.length || 0, "errors"));
      return res.json({ mensagem: `Importação de INSE ${ano} iniciada` });
    }
    if (dbTipo === "saeb") {
      if (getIndicatorImportRunning()) return res.status(409).json({ error: "Importação já em andamento" });
      generateSaebFromIdeb().then(r => console.log("[INEP] SAEB generation done:", JSON.stringify(r)));
      return res.json({ mensagem: "Geração de SAEB a partir de IDEB iniciada" });
    }

    if (getIndicatorImportRunning()) return res.status(409).json({ error: "Importação já em andamento" });
    importAllIndicators([dbTipo], [ano]).then(r => {
      console.log(`[INEP] ${dbTipo} import done:`, r.errors?.length || 0, "errors");
    });
    res.json({ mensagem: `Importação de ${tipo} ${ano} iniciada` });
  });

  app.get("/api/admin/indicadores-status", adminAuth, async (_req, res) => {
    const stats = getLocalStats();
    res.json({ running: getIndicatorImportRunning(), disponíveis: getAvailableIndicators(), stats });
  });

  // === ADMIN: DASHBOARD CSV UPLOAD ===
  const DASHBOARD_CATEGORIES: Record<string, { label: string; columns: string[] }> = {
    enrollment: { label: "Matrículas", columns: ["year", "total", "iniciais", "finais"] },
    ideb: { label: "IDEB", columns: ["year", "escola", "municipal", "estadual", "meta"] },
    repasses: { label: "Repasses", columns: ["year", "pdde", "pnae", "pnate", "total"] },
    prestacao: { label: "Prestação de Contas", columns: ["exercicio", "status", "programa"] },
    taxas: { label: "Taxas Educacionais", columns: ["aprovacao", "reprovacao", "abandono", "distorcao"] },
    infraestrutura: { label: "Infraestrutura", columns: ["item", "valor"] },
    acoes_pdde: { label: "Ações PDDE", columns: ["nome", "status", "valor"] },
    calendario: { label: "Calendário", columns: ["mes", "ano", "dia", "evento", "tipo", "urgente"] },
    escola: { label: "Dados da Escola", columns: ["campo", "valor"] },
    icg: { label: "ICG - Complexidade de Gestão", columns: ["ano", "valor", "nivel"] },
    inse: { label: "INSE - Nível Socioeconômico", columns: ["ano", "valor", "nivel"] },
    tdi: { label: "TDI - Distorção Idade-Série", columns: ["ano", "valor", "nivel"] },
    ird: { label: "IRD - Regularidade do Docente", columns: ["ano", "valor", "nivel"] },
    dsu: { label: "DSU - Docentes com Superior", columns: ["ano", "valor", "nivel"] },
    had: { label: "HAD - Horas-aula Diárias", columns: ["ano", "valor", "nivel"] },
    atu: { label: "ATU - Alunos por Turma", columns: ["ano", "valor", "nivel"] },
    ied: { label: "IED - Esforço Docente", columns: ["ano", "valor", "nivel"] },
    afd: { label: "AFD - Adequação Formação Docente", columns: ["ano", "valor", "nivel"] },
  };

  app.get("/api/admin/dashboard/categories", adminAuth, async (_req, res) => {
    res.json(DASHBOARD_CATEGORIES);
  });

  app.get("/api/admin/dashboard/template/:category", adminAuth, async (req, res) => {
    const category = getParam(req.params, "category");
    const config = DASHBOARD_CATEGORIES[category];
    if (!config) return res.status(404).json({ message: "Categoria não encontrada" });
    const csv = Papa.unparse({ fields: config.columns, data: [] });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=modelo_${category}.csv`);
    res.send(csv);
  });

  app.post("/api/admin/dashboard/upload/:category", adminAuth, async (req, res) => {
    try {
      const category = getParam(req.params, "category");
      if (!VALID_DASHBOARD_CATEGORIES.includes(category as any)) {
        return res.status(400).json({ message: "Categoria inválida" });
      }
      const config = DASHBOARD_CATEGORIES[category];
      if (!config) return res.status(404).json({ message: "Categoria não encontrada" });

      const { csvData, label } = csvUploadSchema.parse(req.body);

      const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true, dynamicTyping: true });
      if (parsed.errors.length > 0) {
        return res.status(400).json({ message: "Erro no CSV", errors: parsed.errors });
      }

      const dataset = await storage.upsertDashboardDataset(category, parsed.data, label);
      res.json(dataset);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/admin/dashboard/:id/label", adminAuth, async (req, res) => {
    try {
      const id = parseInt(getParam(req.params, "id"), 10);
      const { label } = z.object({ label: z.string() }).parse(req.body);
      const updated = await storage.updateDashboardDatasetLabel(id, label);
      if (!updated) return res.status(404).json({ message: "Dataset não encontrado" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/dashboard/:id", adminAuth, async (req, res) => {
    const id = parseInt(getParam(req.params, "id"), 10);
    const deleted = await storage.deleteDashboardDataset(id);
    if (!deleted) return res.status(404).json({ message: "Dataset não encontrado" });
    res.json({ success: true });
  });

  // === PUBLIC: AI DOCUMENTS ===
  app.get("/api/ai-documents", async (_req, res) => {
    const docs = await storage.getAiDocuments();
    res.json(docs);
  });

  // === PUBLIC: MEC NORMAS FILTERS ===
  app.get("/api/mecnormas/filters", async (_req, res) => {
    try {
      const filters = await fetchMecNormasFilters();
      res.json(filters);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Erro ao buscar filtros do MEC Normas" });
    }
  });

  // === PUBLIC: MEC NORMAS SEARCH ===
  app.get("/api/mecnormas/search", async (req, res) => {
    try {
      const q = String(req.query.q || "");
      const exata = req.query.exata === "true";
      const tipo = req.query.tipo ? String(req.query.tipo) : undefined;
      const assunto = req.query.assunto ? String(req.query.assunto) : undefined;
      const unidade = req.query.unidade ? String(req.query.unidade) : undefined;
      const ordenacao = req.query.ordenacao ? String(req.query.ordenacao) : "2";
      const page = parseInt(String(req.query.page || "1"), 10);
      const pageSize = Math.min(parseInt(String(req.query.pageSize || "20"), 10), 50);

      const url = new URL("https://mecnormas.mec.gov.br/pesquisa/api/atos");
      if (q) url.searchParams.set("buscaTextual", q);
      url.searchParams.set("exata", String(exata));
      if (tipo) url.searchParams.set("tipo", tipo);
      if (assunto) url.searchParams.set("assunto", assunto);
      if (unidade) url.searchParams.set("unidade", unidade);
      url.searchParams.set("ordenacao", ordenacao);
      url.searchParams.set("pageSize", String(pageSize));
      url.searchParams.set("currentPage", String(page));

      const response = await fetch(url.toString(), {
        headers: { "User-Agent": "chegou-a-conta-bot" },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return res.status(502).json({ ok: false, message: "MEC Normas indisponível" });
      }

      const data = await response.json();
      res.json({ ok: true, data });
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message || "Erro ao buscar normas" });
    }
  });

  // === PUBLIC: MEC NORMAS DETAIL ===
  app.get("/api/mecnormas/atos/:id", async (req, res) => {
    try {
      const atoId = getParam(req.params, "id");
      const url = `https://mecnormas.mec.gov.br/pesquisa/api/atos/${atoId}`;
      const response = await fetch(url, {
        headers: { "User-Agent": "chegou-a-conta-bot" },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        return res.status(502).json({ ok: false, message: "Ato não encontrado" });
      }
      const data = await response.json();
      res.json({ ok: true, data });
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message || "Erro ao buscar ato" });
    }
  });

  // === PUBLIC: DOU SEARCH ===
  app.get("/api/dou/search", async (req, res) => {
    try {
      const q = String(req.query.q || "");
      if (!q.trim()) {
        return res.status(400).json({ ok: false, message: "Termo de busca obrigatório" });
      }
      const exactMatch = req.query.exact !== "false";
      const publishFrom = req.query.from ? String(req.query.from) : undefined;
      const publishTo = req.query.to ? String(req.query.to) : undefined;
      const maxResults = Math.min(parseInt(String(req.query.limit || "20"), 10), 50);

      const result = await searchDOU({ query: q, exactMatch, publishFrom, publishTo, maxResults });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ ok: false, results: [], total: 0, message: e.message });
    }
  });

  // === PUBLIC: DOU CROSS-REFERENCE FOR NORMA ===
  app.get("/api/dou/cross-reference", async (req, res) => {
    try {
      const norma = String(req.query.norma || "");
      if (!norma.trim()) {
        return res.status(400).json({ ok: false, message: "Nome da norma obrigatório" });
      }
      const result = await searchDOUForNorma(norma);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ ok: false, results: [], total: 0, message: e.message });
    }
  });

  // === ADMIN: AI DOCUMENTS ===
  app.post("/api/admin/ai-documents", adminAuth, async (req, res) => {
    try {
      const data = insertAiDocumentSchema.parse(req.body);
      const doc = await storage.createAiDocument(data);
      res.json(doc);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/admin/ai-documents/embeddings/backfill", adminAuth, async (req, res) => {
    try {
      const payload = embeddingsBackfillSchema.parse(req.body || {});
      const result = await backfillAiDocumentEmbeddings(payload);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Erro ao gerar embeddings" });
    }
  });

  app.post("/api/admin/ai-documents/fetch-url", adminAuth, async (req, res) => {
    try {
      const data = aiDocFromUrlSchema.parse(req.body);
      const headers: Record<string, string> = {};
      if (data.authHeaderName && data.authHeaderValue) {
        headers[data.authHeaderName] = data.authHeaderValue;
      }

      const response = await fetch(data.url, { headers });
      if (!response.ok) {
        return res.status(400).json({ message: `Falha ao buscar URL (${response.status})` });
      }

      const contentType = response.headers.get("content-type") || "";
      let content = "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        content = JSON.stringify(json, null, 2);
      } else {
        content = await response.text();
      }

      if (!content.trim()) {
        return res.status(422).json({ message: "Conteúdo vazio ao buscar URL" });
      }

      const doc = await storage.createAiDocument({
        title: data.title,
        content,
        category: data.category,
        link: data.url,
        sortOrder: 0,
      });

      res.json(doc);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.put("/api/admin/ai-documents/:id", adminAuth, async (req, res) => {
    try {
      const data = insertAiDocumentSchema.partial().parse(req.body);
      const id = parseInt(getParam(req.params, "id"), 10);
      const updated = await storage.updateAiDocument(id, data);
      if (!updated) return res.status(404).json({ message: "Documento não encontrado" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/ai-documents/:id", adminAuth, async (req, res) => {
    const id = parseInt(getParam(req.params, "id"), 10);
    const deleted = await storage.deleteAiDocument(id);
    if (!deleted) return res.status(404).json({ message: "Documento não encontrado" });
    res.json({ success: true });
  });

  // === ADMIN: MEC NORMAS SYNC ===
  app.post("/api/admin/mecnormas/sync", adminAuth, async (req, res) => {
    try {
      const options = mecNormasSyncSchema.parse(req.body || {});
      const result = await syncMecNormas(options);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Erro ao sincronizar MEC Normas" });
    }
  });

  app.get("/api/admin/unanswered-questions", adminAuth, async (_req, res) => {
    const questions = await storage.getUnansweredQuestions();
    res.json(questions);
  });

  app.patch("/api/admin/unanswered-questions/:id", adminAuth, async (req, res) => {
    const id = parseInt(getParam(req.params, "id"), 10);
    const { status } = req.body;
    const updated = await storage.updateUnansweredQuestionStatus(id, status);
    if (!updated) return res.status(404).json({ message: "Pergunta não encontrada" });
    res.json(updated);
  });

  app.delete("/api/admin/unanswered-questions/:id", adminAuth, async (req, res) => {
    const id = parseInt(getParam(req.params, "id"), 10);
    const deleted = await storage.deleteUnansweredQuestion(id);
    if (!deleted) return res.status(404).json({ message: "Pergunta não encontrada" });
    res.json({ success: true });
  });

  return httpServer;
}
