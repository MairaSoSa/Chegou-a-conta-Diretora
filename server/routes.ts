import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import Papa from "papaparse";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
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
});

const VALID_DASHBOARD_CATEGORIES = [
  "enrollment", "ideb", "repasses", "prestacao", "taxas",
  "infraestrutura", "acoes_pdde", "calendario", "escola",
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

  // === PUBLIC: SCHOOLS ===
  app.get(api.schools.search.path, async (req, res) => {
    const query = req.query.q as string | undefined;
    const schools = await storage.getSchools(query);
    res.json(schools);
  });

  app.get(api.schools.get.path, async (req, res) => {
    const school = await storage.getSchoolByInep(req.params.inep);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }
    res.json(school);
  });

  // === PUBLIC: PROGRAMS ===
  app.get(api.programs.list.path, async (req, res) => {
    const programs = await storage.getPrograms();
    res.json(programs);
  });

  app.get(api.programs.get.path, async (req, res) => {
    const code = req.params.code;
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
  app.get(api.glossary.list.path, async (req, res) => {
    const items = await storage.getGlossary();
    res.json(items);
  });

  // === PUBLIC: TRILHA ===
  app.get(api.trilha.list.path, async (req, res) => {
    const units = await storage.getTrilhaUnits();
    res.json(units);
  });

  app.get(api.trilha.get.path, async (req, res) => {
    const unit = await storage.getTrilhaUnitByUnitId(req.params.unitId);
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
      const id = parseInt(req.params.id);
      const updated = await storage.updateGlossaryItem(id, data);
      if (!updated) return res.status(404).json({ message: "Item não encontrado" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/glossary/:id", adminAuth, async (req, res) => {
    const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
      const updated = await storage.updateTool(id, data);
      if (!updated) return res.status(404).json({ message: "Ferramenta não encontrada" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/tools/:id", adminAuth, async (req, res) => {
    const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
      const updated = await storage.updateTrilhaUnit(id, data);
      if (!updated) return res.status(404).json({ message: "Unidade não encontrada" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/trilha/:id", adminAuth, async (req, res) => {
    const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
      const updated = await storage.updateProgram(id, data);
      if (!updated) return res.status(404).json({ message: "Programa não encontrado" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/programs/:id", adminAuth, async (req, res) => {
    const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
      const updated = await storage.updateProgramDetail(id, data);
      if (!updated) return res.status(404).json({ message: "Detalhe não encontrado" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/program-details/:id", adminAuth, async (req, res) => {
    const id = parseInt(req.params.id);
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
    const datasets = await storage.getDashboardDatasets();
    res.json(datasets);
  });

  app.get("/api/dashboard/datasets/:category", async (req, res) => {
    const dataset = await storage.getDashboardDatasetByCategory(req.params.category as string);
    if (!dataset) return res.status(404).json({ message: "Dados não encontrados" });
    res.json(dataset);
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
  };

  app.get("/api/admin/dashboard/categories", adminAuth, async (_req, res) => {
    res.json(DASHBOARD_CATEGORIES);
  });

  app.get("/api/admin/dashboard/template/:category", adminAuth, async (req, res) => {
    const category = req.params.category as string;
    const config = DASHBOARD_CATEGORIES[category];
    if (!config) return res.status(404).json({ message: "Categoria não encontrada" });
    const csv = Papa.unparse({ fields: config.columns, data: [] });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=modelo_${category}.csv`);
    res.send(csv);
  });

  app.post("/api/admin/dashboard/upload/:category", adminAuth, async (req, res) => {
    try {
      const category = req.params.category as string;
      if (!VALID_DASHBOARD_CATEGORIES.includes(category as any)) {
        return res.status(400).json({ message: "Categoria inválida" });
      }
      const config = DASHBOARD_CATEGORIES[category];
      if (!config) return res.status(404).json({ message: "Categoria não encontrada" });

      const { csvData } = csvUploadSchema.parse(req.body);

      const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true, dynamicTyping: true });
      if (parsed.errors.length > 0) {
        return res.status(400).json({ message: "Erro no CSV", errors: parsed.errors });
      }

      const dataset = await storage.upsertDashboardDataset(category, parsed.data);
      res.json(dataset);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/dashboard/:id", adminAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteDashboardDataset(id);
    if (!deleted) return res.status(404).json({ message: "Dataset não encontrado" });
    res.json({ success: true });
  });

  // === PUBLIC: AI DOCUMENTS ===
  app.get("/api/ai-documents", async (_req, res) => {
    const docs = await storage.getAiDocuments();
    res.json(docs);
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

  app.put("/api/admin/ai-documents/:id", adminAuth, async (req, res) => {
    try {
      const data = insertAiDocumentSchema.partial().parse(req.body);
      const id = parseInt(req.params.id);
      const updated = await storage.updateAiDocument(id, data);
      if (!updated) return res.status(404).json({ message: "Documento não encontrado" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/ai-documents/:id", adminAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteAiDocument(id);
    if (!deleted) return res.status(404).json({ message: "Documento não encontrado" });
    res.json({ success: true });
  });

  app.get("/api/admin/unanswered-questions", adminAuth, async (_req, res) => {
    const questions = await storage.getUnansweredQuestions();
    res.json(questions);
  });

  app.patch("/api/admin/unanswered-questions/:id", adminAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const updated = await storage.updateUnansweredQuestionStatus(id, status);
    if (!updated) return res.status(404).json({ message: "Pergunta não encontrada" });
    res.json(updated);
  });

  app.delete("/api/admin/unanswered-questions/:id", adminAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteUnansweredQuestion(id);
    if (!deleted) return res.status(404).json({ message: "Pergunta não encontrada" });
    res.json({ success: true });
  });

  return httpServer;
}
