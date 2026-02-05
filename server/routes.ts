import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerChatRoutes } from "./replit_integrations/chat";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Register Chat AI Integration
  registerChatRoutes(app);

  // === SCHOOLS ===
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

  // === PROGRAMS ===
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

  // === TOOLS ===
  app.get(api.tools.list.path, async (req, res) => {
    const category = req.query.category as string | undefined;
    const tools = await storage.getTools(category);
    res.json(tools);
  });

  return httpServer;
}

export async function seedDatabase() {
  const schools = await storage.getSchools();
  if (schools.length === 0) {
    await storage.createSchool({
      inep: "12345678",
      name: "Escola Municipal Rio Verde",
      city: "Rio Verde",
      state: "GO",
      network: "Municipal",
      location: "Rural",
      enrollmentCount: 312,
      dataStatus: "Parcial",
    });
  }

  const programs = await storage.getPrograms();
  if (programs.length === 0) {
    await storage.createProgram({
      code: "PDDE",
      name: "PDDE Básico",
      description: "Recursos para manutenção e pequenos reparos.",
      lastReferenceYear: 2025,
      status: "Regular",
      observation: "Consta em base pública",
    });
    await storage.createProgram({
      code: "PNAE",
      name: "PNAE",
      description: "Alimentação escolar.",
      lastReferenceYear: 2025,
      status: "Regular",
      observation: "Dado disponível",
    });
    await storage.createProgram({
      code: "PNATE",
      name: "PNATE",
      description: "Transporte escolar.",
      lastReferenceYear: 2024,
      status: "Atrasado",
      observation: "Dado possivelmente atrasado",
    });

    // Details for PDDE
    await storage.createProgramDetail({
      programCode: "PDDE",
      type: "allowed",
      content: "Despesas de custeio (material de consumo, serviços).",
      category: "Financeiro",
    });
    await storage.createProgramDetail({
      programCode: "PDDE",
      type: "allowed",
      content: "Pequenos reparos e manutenção.",
      category: "Financeiro",
    });
    await storage.createProgramDetail({
      programCode: "PDDE",
      type: "forbidden",
      content: "Pagamento de pessoal (salários).",
      category: "Financeiro",
    });
     await storage.createProgramDetail({
      programCode: "PDDE",
      type: "forbidden",
      content: "Combustível.",
      category: "Financeiro",
    });
  }

  const tools = await storage.getTools();
  if (tools.length === 0) {
    await storage.createTool({
      title: "Checklist do Mês",
      category: "Planejar",
      description: "Organizar execução e documentos.",
      type: "checklist",
    });
    await storage.createTool({
      title: "Solicitação de Cotação",
      category: "Pesquisar",
      description: "Modelo de pedido de preços.",
      type: "model",
    });
     await storage.createTool({
      title: "Mapa Comparativo",
      category: "Contratar",
      description: "Comparar propostas de fornecedores.",
      type: "spreadsheet",
    });
  }
}
