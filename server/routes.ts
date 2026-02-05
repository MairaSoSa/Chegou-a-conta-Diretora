import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerChatRoutes } from "./replit_integrations/chat";
import { insertToolSchema, insertGlossarySchema, insertTrilhaUnitSchema, insertProgramSchema, insertProgramDetailSchema } from "@shared/schema";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin2024";
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
const activeTokens = new Map<string, number>();

function generateToken(): string {
  const token = crypto.randomBytes(32).toString("hex");
  activeTokens.set(token, Date.now() + TOKEN_EXPIRY_MS);
  return token;
}

function adminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  const token = authHeader.slice(7);
  const expiry = activeTokens.get(token);
  if (!expiry || Date.now() > expiry) {
    activeTokens.delete(token);
    return res.status(401).json({ message: "Sessão expirada" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  registerChatRoutes(app);

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

  return httpServer;
}
