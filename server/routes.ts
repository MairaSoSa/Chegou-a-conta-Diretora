import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import crypto from "crypto";
import { readFileSync, existsSync } from "fs";
import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";
import express from "express";
import Papa from "papaparse";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { storage } from "./storage";
import { sqlite, resolvedDbPath } from "./db";
import { pgGet, pgAll, pgRun } from "./pg";
import { api } from "@shared/routes";
import { registerChatRoutes } from "./integrations/chat";
import { registerCadernoRoutes } from "./caderno-routes";
import { registerObjectStorageRoutes } from "./integrations/object_storage";
import { fetchMecNormasFilters, syncMecNormas } from "./integrations/mecnormas";
import { backfillAiDocumentEmbeddings } from "./integrations/embeddings";
import {
  getPddeInfo, getPddeUexSaldo,
  getSituacaoCadastral, getMunicipiosPorUf,
  getSituacaoPrestacaoConta, getSituacaoAtendimento, getRelatorioSuspensao,
  getRelatorioSuspensaoPorEscola,
} from "./scraper/pdde";
import { searchDOU, searchDOUForNorma } from "./scraper/dou";
import {
  searchSchoolsLocal, getEscolaCompletaLocal, getEscolaEvolucaoLocal,
  importFromExternalApi, getImportStatus, getLocalSchoolCount, getLocalStats,
  listCensoEscolar, getCensoEscolarDetail, getCensoEstatisticas,
  listIndicador, getIndicadorDetail, getEscolaCompleta, getApiInfo,
  getMediasNacionais, invalidateStatsCache, getEscolaCenso2025,
} from "./importador";
import { importAllDriveYears, importDriveYear, importProgress as driveProgress } from "./importador-drive";
import {
  searchEscolasRailway, getEscolaEvolucaoRailway,
  getEscolaCompletaRailway, getEscolaBasicaRailway,
  getComparativoRailway, getDiagnosticoRailway,
} from "./railway-client";
import {
  buildLocalMaps, getComparativoLocal, getDiagnosticoLocal,
} from "./local-analytics";
import { importAllIndicators, getIndicatorImportRunning, getAvailableIndicators, importIdeb, importInse, generateSaebFromIdeb } from "./import-inep-indicators";
import { 
  localizarPrestacoesPorCnpj,
  localizarPrestacoesPorUf,
  detalharPrestacao,
  recuperarHistoricoAnalise,
  consultarSaldosPdde,
  consultarExecFinPdde
} from "./scraper/sigpc";
import { z } from "zod";
import {
  insertToolSchema, insertGlossarySchema, insertTrilhaUnitSchema,
  insertProgramSchema, insertProgramDetailSchema,
  insertAiDocumentSchema
} from "@shared/schema";

function resolveServerJson(filename: string): string {
  const devPath = join(process.cwd(), "server", filename);
  if (existsSync(devPath)) return devPath;
  return join(process.cwd(), filename);
}

const MUNICIPIO_CENTROIDES: Record<number, [number, number]> = JSON.parse(
  readFileSync(resolveServerJson("municipio-centroides.json"), "utf-8")
);

// Helper: grava no cache (fire-and-forget, nunca trava a rota)
function safeCacheWrite(key: string, data: any) {
  pgRun(
    `INSERT INTO stats_cache(cache_key,data,updated_at) VALUES(?,?,?)
     ON CONFLICT(cache_key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`,
    [key, JSON.stringify(data), Date.now()]
  ).catch(() => {});
}

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

// Resolve o caminho do worker relativo a este arquivo (funciona com tsx e em build)
const _workerDir = (() => { try { return dirname(fileURLToPath(import.meta.url)); } catch { return process.cwd(); } })();
const INSIGHTS_WORKER_PATH = join(_workerDir, "censo-insights-worker.mjs");

// Mapa de cálculos em andamento — evita N workers simultâneos para o mesmo scope
const _pendingInsights = new Map<string, Promise<any>>();

/** Roda o cálculo pesado em Worker Thread para não bloquear o event loop */
function computeInsightsInWorker(scope: string, campos: Array<{key:string;label:string}>, dbPath: string): Promise<any> {
  const key = `insights_${scope}`;
  const existing = _pendingInsights.get(key);
  if (existing) return existing;
  const p = new Promise<any>((resolve, reject) => {
    const w = new Worker(INSIGHTS_WORKER_PATH, { workerData: { dbPath, campos, scope } });
    w.once("message", msg => { _pendingInsights.delete(key); if (msg.ok) resolve(msg.payload); else reject(new Error(msg.error)); });
    w.once("error", err => { _pendingInsights.delete(key); reject(err); });
    w.once("exit", code => { if (code !== 0) { _pendingInsights.delete(key); reject(new Error(`Worker exited ${code}`)); } });
  });
  _pendingInsights.set(key, p);
  return p;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Health check — must be the very first route (responds before DB is ready)
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true, ts: Date.now() });
  });

  // Pré-computa médias IDEB locais (municipio/UF/Brasil) em background
  setTimeout(async () => { try { await buildLocalMaps(); } catch(e: any) { console.warn("[analytics] buildLocalMaps falhou:", e.message); } }, 0);

  registerChatRoutes(app);
  registerCadernoRoutes(app);
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
  app.get(api.schools.search.path, async (req, res) => {
    const query = req.query.q as string | undefined;
    if (!query || query.length < 2) return res.json([]);
    res.json(await searchSchoolsLocal(query));
  });

  app.get(api.schools.get.path, async (req, res) => {
    const inep = getParam(req.params, "inep");
    const localResults = await searchSchoolsLocal(inep);
    if (localResults.length > 0) return res.json(localResults[0]);
    res.status(404).json({ message: "Escola não encontrada. Importe os dados pelo painel admin." });
  });

  // === PUBLIC: ESCOLA COMPLETA (Railway primeiro, local como fallback) ===
  app.get("/api/escola-completa/:inep", async (req, res) => {
    const inep = getParam(req.params, "inep");
    const ano = parseInt(req.query.ano as string) || new Date().getFullYear();
    const railwayData = await getEscolaCompletaRailway(inep, ano);
    if (railwayData) return res.json(railwayData);
    const localData = await getEscolaCompletaLocal(inep, ano);
    if (localData) return res.json(localData);
    res.json({ co_entidade: parseInt(inep), anos_disponiveis: [], ano_selecionado: ano });
  });

  // === PUBLIC: ESCOLA EVOLUÇÃO (Railway primeiro, local como fallback) ===
  app.get("/api/escola-evolucao/:inep", async (req, res) => {
    const inep = getParam(req.params, "inep");
    const CACHE_KEY = `evolucao_${inep}`;
    const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h (dados do censo são anuais)

    // 1. Cache persistente (se disponível e fresco)
    const cached = await pgGet(
      `SELECT data, updated_at FROM stats_cache WHERE cache_key=? LIMIT 1`,
      [CACHE_KEY]
    ) as any;
    if (cached && (Date.now() - cached.updated_at) < CACHE_TTL_MS) {
      return res.json(JSON.parse(cached.data));
    }

    // 2. Dados locais servidos imediatamente (sem esperar Railway)
    const localData = await getEscolaEvolucaoLocal(inep);
    if (!localData) {
      return res.json({ co_entidade: parseInt(inep), anos_disponiveis: [], escola: null, censo_por_ano: {}, indicadores_por_ano: {} });
    }

    // 3. Retorna local imediatamente
    res.json(localData);

    // 4. Em background, tenta enriquecer com Railway e atualiza o cache
    (async () => {
      try {
        const railwayData = await getEscolaEvolucaoRailway(inep);
        if (!railwayData) { safeCacheWrite(CACHE_KEY, localData); return; }

        // Mescla: local como base, Railway enriquece com IDEB/SAEB/metadados
        const localCenso = localData.censo_por_ano as Record<number, any>;
        const mergedCenso: Record<number, any> = {};
        const allAnosCenso = new Set<number>([
          ...Object.keys(railwayData.censo_por_ano).map(Number),
          ...Object.keys(localCenso).map(Number),
        ]);
        for (const ano of allAnosCenso) {
          const loc  = localCenso[ano]  ?? {};
          const rail = (railwayData.censo_por_ano as Record<number, any>)[ano] ?? {};
          mergedCenso[ano] = { ...loc, ...rail };
          for (const field of ['qt_mat_bas','qt_doc_bas','qt_tur_bas','qt_salas_utilizadas',
                               'qt_mat_fund','qt_mat_fund_ai','qt_mat_fund_af','qt_mat_med',
                               'qt_mat_eja','qt_mat_esp','qt_mat_bas_fem','qt_mat_bas_masc',
                               'in_agua_potavel','in_energia_rede_publica','in_esgoto_rede_publica',
                               'in_biblioteca','in_laboratorio_informatica','in_quadra_esportes',
                               'in_internet','in_banda_larga','in_alimentacao']) {
            if ((rail[field] == null || rail[field] === undefined) && loc[field] != null) {
              mergedCenso[ano][field] = loc[field];
            }
          }
        }
        const localInd = localData.indicadores_por_ano as Record<number, any>;
        const mergedInd: Record<number, any> = {};
        const allAnosInd = new Set<number>([
          ...Object.keys(railwayData.indicadores_por_ano).map(Number),
          ...Object.keys(localInd).map(Number),
        ]);
        for (const ano of allAnosInd) {
          const localAno = localInd[ano] ?? {};
          const railAno  = ((railwayData.indicadores_por_ano as Record<number, any>)[ano]) ?? {};
          const allTipos = new Set([...Object.keys(localAno), ...Object.keys(railAno)]);
          mergedInd[ano] = {};
          for (const tipo of allTipos) {
            // Local data is richer (full distributions); railway fills missing top-level fields only
            mergedInd[ano][tipo] = { ...(railAno[tipo] ?? {}), ...(localAno[tipo] ?? {}) };
          }
        }
        const anosSet = new Set<number>([
          ...Object.keys(mergedCenso).map(Number),
          ...Object.keys(mergedInd).map(Number),
        ]);
        const merged = {
          ...railwayData,
          anos_disponiveis: [...anosSet].sort((a, b) => a - b),
          censo_por_ano: mergedCenso,
          indicadores_por_ano: mergedInd,
        };
        if (merged.anos_disponiveis.length > 0) safeCacheWrite(CACHE_KEY, merged);
      } catch {
        safeCacheWrite(CACHE_KEY, localData);
      }
    })();
  });

  // === PUBLIC: COMPARATIVO (escola vs município, UF e Brasil) ===
  // Usa Railway com cache persistente no banco (survives server restarts)
  app.get("/api/escola-comparativo/:inep", async (req, res) => {
    const inep = getParam(req.params, "inep");
    const CACHE_KEY = `comparativo_${inep}`;
    const CACHE_TTL_DAYS = 7;

    // 1. Checar cache persistente no banco
    const cached = await pgGet(
      `SELECT data, updated_at FROM stats_cache WHERE cache_key=? LIMIT 1`,
      [CACHE_KEY]
    ) as any;

    if (cached) {
      const ageMs = Date.now() - cached.updated_at;
      if (ageMs < CACHE_TTL_DAYS * 24 * 60 * 60 * 1000) {
        return res.json(JSON.parse(cached.data));
      }
    }

    // 2. Cache miss — buscar local primeiro (Railway como fallback)
    const localData = await getComparativoLocal(inep);
    if (localData) {
      safeCacheWrite(CACHE_KEY, localData);
      return res.json(localData);
    }
    const railwayData = await getComparativoRailway(inep);
    if (!railwayData) return res.json(null);
    safeCacheWrite(CACHE_KEY, railwayData);
    res.json(railwayData);
  });

  // === PUBLIC: MICRORREGIÃO — média IDEB local a partir do banco SQLite ===
  const microlookup: Record<string, [number, string]> = JSON.parse(
    readFileSync(resolveServerJson("municipio-microregiao.json"), "utf8")
  );

  app.get("/api/escola-microregiao/:inep", async (req, res) => {
    try {
      const inep = getParam(req.params, "inep");

      // 1. Buscar co_municipio via tabela auxiliar indexada
      const munRow = await pgGet(
        `SELECT co_municipio FROM escola_municipio WHERE inep=? LIMIT 1`,
        [inep]
      ) as any;
      if (!munRow) return res.json(null);
      const co_municipio = String(munRow.co_municipio);

      // 2. Descobrir microrregião a partir do lookup em memória
      const entry = microlookup[co_municipio];
      if (!entry) return res.json(null);
      const [micro_cod, micro_nome] = entry;

      // 3. Checar cache por microrregião
      const CACHE_KEY = `micro_${micro_cod}`;
      const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 dias
      const cached = await pgGet(
        `SELECT data, updated_at FROM stats_cache WHERE cache_key=? LIMIT 1`,
        [CACHE_KEY]
      ) as any;
      if (cached && (Date.now() - cached.updated_at) < CACHE_TTL_MS) {
        return res.json(JSON.parse(cached.data));
      }

      // 4. Cache miss — calcular médias via tabela escola_municipio + indicadores
      const municsMicro = Object.entries(microlookup)
        .filter(([, v]) => v[0] === micro_cod)
        .map(([k]) => k);
      if (municsMicro.length === 0) return res.json(null);

      // Buscar ineps da microrregião
      const ph = municsMicro.map(() => '?').join(',');
      const inepsRegiao = await pgAll(
        `SELECT inep FROM escola_municipio WHERE co_municipio IN (${ph})`,
        municsMicro
      ) as { inep: string }[];

      if (inepsRegiao.length === 0) return res.json(null);

      // Buscar IDEB em lotes de 900
      const allIneps = inepsRegiao.map(r => r.inep);
      const sums: Record<string, number> = { ai: 0, af: 0, em: 0 };
      const cnts: Record<string, number> = { ai: 0, af: 0, em: 0 };
      const BATCH = 900;
      for (let i = 0; i < allIneps.length; i += BATCH) {
        const batch = allIneps.slice(i, i + BATCH);
        const ph2 = batch.map(() => '?').join(',');
        const rows = await pgAll(
          `SELECT dados FROM indicadores_educacionais WHERE tipo='ideb' AND inep IN (${ph2})`,
          batch
        ) as { dados: string }[];
        for (const row of rows) {
          const d = typeof row.dados === "string" ? JSON.parse(row.dados) : (row.dados || {});
          for (const etapa of ['ai','af','em'] as const) {
            const v = d[`ideb_${etapa}`];
            if (v != null && v > 0) { sums[etapa] += Number(v); cnts[etapa]++; }
          }
        }
      }

      const resultado = {
        micro_nome,
        micro_cod,
        n_escolas: allIneps.length,
        ideb_ai: cnts.ai > 0 ? Math.round(sums.ai / cnts.ai * 10) / 10 : null,
        ideb_af: cnts.af > 0 ? Math.round(sums.af / cnts.af * 10) / 10 : null,
        ideb_em: cnts.em > 0 ? Math.round(sums.em / cnts.em * 10) / 10 : null,
      };

      safeCacheWrite(CACHE_KEY, resultado);
      res.json(resultado);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // === PUBLIC: DIAGNÓSTICO (pontos fortes, pontos de atenção, leituras) ===
  app.get("/api/escola-diagnostico/:inep", async (req, res) => {
    const inep = getParam(req.params, "inep");
    const CACHE_KEY = `diagnostico_${inep}`;
    const CACHE_TTL_DAYS = 7;

    const cached = await pgGet(
      `SELECT data, updated_at FROM stats_cache WHERE cache_key=? LIMIT 1`,
      [CACHE_KEY]
    ) as any;

    if (cached && (Date.now() - cached.updated_at) < CACHE_TTL_DAYS * 86400000) {
      return res.json(JSON.parse(cached.data));
    }

    const localDiag = await getDiagnosticoLocal(inep);
    if (localDiag) {
      safeCacheWrite(CACHE_KEY, localDiag);
      return res.json(localDiag);
    }
    const railwayDiag = await getDiagnosticoRailway(inep);
    if (!railwayDiag) return res.json(null);
    safeCacheWrite(CACHE_KEY, railwayDiag);
    res.json(railwayDiag);
  });

  app.get("/api/medias-nacionais", async (req, res) => {
    const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;
    res.json(await getMediasNacionais(ano));
  });

  // === PUBLIC: API INFO (mirrors api-escolas root) ===
  app.get("/api/info", async (_req, res) => {
    res.json(await getApiInfo());
  });

  // === PUBLIC: CENSO 2025 DETALHADO (matrículas, turmas, docentes, gestor por escola) ===
  app.get("/api/escola-censo2025/:inep", async (req, res) => {
    const inep = getParam(req.params, "inep");
    const data = await getEscolaCenso2025(inep);
    if (!data) return res.status(404).json({ erro: "Escola não encontrada no Censo 2025." });
    res.json(data);
  });

  // === PUBLIC: ESCOLA BUSCAR (local DB — busca rápida, dados do Railway no painel) ===
  app.get("/api/escola/buscar", async (req, res) => {
    const nome = req.query.nome as string;
    const perPage = parseInt(req.query.per_page as string) || 20;
    if (!nome || nome.length < 2) return res.json({ dados: [], total: 0 });

    const localResults = await searchSchoolsLocal(nome, perPage);
    if (localResults.length > 0) {
      return res.json({
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
    }

    const railwayResults = await searchEscolasRailway(nome, perPage);
    res.json(railwayResults);
  });

  app.get("/api/escola/:inep", async (req, res) => {
    const inep = getParam(req.params, "inep");
    const railwayData = await getEscolaBasicaRailway(inep);
    if (railwayData) return res.json(railwayData);
    const localData = await getEscolaCompleta(inep);
    if (localData) return res.json(localData);
    res.status(404).json({ erro: "Escola não encontrada." });
  });

  // === PUBLIC: CENSO ESCOLAR ROUTES ===
  app.get("/api/censo-escolar/:ano/escolas/estatisticas", async (req, res) => {
    const ano = parseInt(req.params.ano);
    const local = await getCensoEstatisticas(ano);

    // Se o banco local tem muito poucos dados (ambiente sem carga completa),
    // retorna os dados oficiais do Censo Escolar INEP/MEC como fallback.
    const OFICIAL: Record<number, any> = {
      2025: {
        ano: 2025,
        total_escolas: 180540,
        total_matriculas: 46018380,
        total_docentes: 2992045,
        total_turmas: 2233976,
        por_dependencia: { Federal: 716, Estadual: 29998, Municipal: 107372, Privada: 42454 },
        por_localizacao: { Urbana: 129777, Rural: 50763 },
        por_uf: { AC:1524, AL:2882, AM:5562, AP:875, BA:16106, CE:7716, DF:1332, ES:3046, GO:4752, MA:11219, MG:15910, MS:1859, MT:2710, PA:10530, PB:4636, PE:7992, PI:4017, PR:9576, RJ:11647, RN:3416, RO:1220, RR:915, RS:9946, SC:6750, SE:2004, SP:30817, TO:1581 },
        por_situacao: { 'Em Atividade': 180540, 'Paralisada': 29780, 'Extinta': 3872 },
        _fonte: 'censo_escolar_2025',
      },
      2024: {
        ano: 2024,
        total_escolas: 215548,
        total_matriculas: 47090227,
        total_docentes: 2939075,
        total_turmas: 2224100,
        por_dependencia: { Federal: 724, Estadual: 33255, Municipal: 129001, Privada: 52568 },
        por_localizacao: { Urbana: 173092, Rural: 42456 },
        por_uf: { AC:1413, AL:5189, AM:7002, AP:1066, BA:26025, CE:13101, DF:737, ES:4297, GO:7262, MA:14143, MG:22895, MS:3254, MT:4521, PA:16193, PB:7196, PE:11695, PI:7278, PR:10561, RJ:11219, RN:5395, RO:3039, RR:811, RS:11174, SC:7153, SE:3196, SP:24760, TO:3173 },
        por_situacao: { 'Em Atividade': 215548 },
        _fonte: 'oficial_inep_2024',
      },
      2023: {
        ano: 2023,
        total_escolas: 215421,
        total_matriculas: 47341842,
        total_docentes: 2921069,
        total_turmas: 2213760,
        por_dependencia: { Federal: 718, Estadual: 33124, Municipal: 129241, Privada: 52338 },
        por_localizacao: { Urbana: 172800, Rural: 42621 },
        por_uf: {},
        por_situacao: { 'Em Atividade': 215421 },
        _fonte: 'oficial_inep_2023',
      },
    };

    if (local.total_escolas < 10000 && OFICIAL[ano]) {
      return res.json(OFICIAL[ano]);
    }
    res.json(local);
  });

  // === ESCOLAS COM PERFIL SIMILAR ===
  app.get("/api/escola/:inep/similares", async (req, res) => {
    const inep = req.params.inep;
    const ano = parseInt(req.query.ano as string) || 2025;
    try {
      // 1ª query: escola base com modalidades + municipio
      const escola = await pgGet(`
        SELECT inep, uf, dependencia, localizacao,
          CAST(COALESCE(matriculas, '0') AS BIGINT) as matriculas,
          CAST(COALESCE((dados::jsonb)->>'co_municipio', '0') AS BIGINT) as co_municipio,
          CAST(COALESCE((dados::jsonb)->>'qt_mat_inf',  '0') AS BIGINT) as qt_mat_inf,
          CAST(COALESCE((dados::jsonb)->>'qt_mat_fund', '0') AS BIGINT) as qt_mat_fund,
          CAST(COALESCE((dados::jsonb)->>'qt_mat_med',  '0') AS BIGINT) as qt_mat_med,
          CAST(COALESCE((dados::jsonb)->>'qt_mat_eja',  '0') AS BIGINT) as qt_mat_eja,
          CAST(COALESCE((dados::jsonb)->>'qt_mat_prof', '0') AS BIGINT) as qt_mat_prof
        FROM censo_escolar WHERE inep=? AND ano=? LIMIT 1
      `, [inep, ano]) as any;
      if (!escola) return res.status(404).json({ erro: "Escola não encontrada" });

      const minMat = Math.floor((escola.matriculas || 50) * 0.33);
      const maxMat = Math.ceil((escola.matriculas || 50) * 3.00);
      const targetMat = escola.matriculas || 50;

      // Modalidades da escola base (ex: Set {"EM","EJA"})
      const toModalidades = (r: any): Set<string> => {
        const s = new Set<string>();
        if (r.qt_mat_inf  > 0) s.add("EI");
        if (r.qt_mat_fund > 0) s.add("EF");
        if (r.qt_mat_med  > 0) s.add("EM");
        if (r.qt_mat_eja  > 0) s.add("EJA");
        if (r.qt_mat_prof > 0) s.add("EP");
        if (s.size === 0) s.add("EF");
        return s;
      };
      const modalidadesBase = toModalidades(escola);
      const fingerprintBase = [...modalidadesBase].sort().join("+");

      // ICG da escola base
      const icgBaseRow = await pgGet(`
        SELECT (dados::jsonb)->>'nivel' as nivel
        FROM indicadores_educacionais WHERE inep=? AND ano=? AND tipo='icg' LIMIT 1
      `, [inep, ano]) as any;
      const icgBase = icgBaseRow?.nivel ?? null;

      const ufBase = escola.uf?.toUpperCase() || "";

      // 2ª query: leve — campos indexados, mesmo estado
      const candidatos = await pgAll(`
        SELECT inep, nome, municipio, uf, dependencia, localizacao,
          CAST(COALESCE(matriculas, '0') AS BIGINT) as matriculas
        FROM censo_escolar
        WHERE ano=? AND dependencia=? AND UPPER(uf)=? AND situacao='Em Atividade' AND inep!=?
      `, [ano, escola.dependencia, ufBase, inep]) as any[];

      // Filtro leve: faixa de matrículas (sem JSON ainda)
      const prefiltrados = candidatos.filter(s => {
        const mat = s.matriculas || 0;
        return mat >= minMat && mat <= maxMat;
      });

      // Haversine por município usando centroide real (5.570 municípios)
      const haversineKm = (coMun1: number, coMun2: number): number => {
        const c1 = MUNICIPIO_CENTROIDES[coMun1];
        const c2 = MUNICIPIO_CENTROIDES[coMun2];
        if (!c1 || !c2) return 9999;
        const R = 6371;
        const dLat = (c2[0] - c1[0]) * Math.PI / 180;
        const dLon = (c2[1] - c1[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(c1[0]*Math.PI/180)*Math.cos(c2[0]*Math.PI/180)*Math.sin(dLon/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      };
      const coMunBase = escola.co_municipio || 0;

      let similares: any[] = [];
      if (prefiltrados.length > 0) {
        const prefIneps = prefiltrados.map(s => s.inep);

        // Processa em lotes de 500 para respeitar o limite de variáveis do SQLite (999)
        const BATCH = 500;
        const detalheMap: Record<string, any> = {};
        for (let i = 0; i < prefIneps.length; i += BATCH) {
          const batch = prefIneps.slice(i, i + BATCH);
          const placeholders = batch.map(() => "?").join(",");
          const detalhes = await pgAll(`
            SELECT c.inep,
              (c.dados::jsonb)->>'telefone'    as telefone,
              (c.dados::jsonb)->>'ds_endereco' as ds_endereco,
              (c.dados::jsonb)->>'no_bairro'   as no_bairro,
              (c.dados::jsonb)->>'co_cep'      as co_cep,
              CAST(COALESCE((c.dados::jsonb)->>'co_municipio', '0') AS BIGINT) as co_municipio,
              CAST(COALESCE((c.dados::jsonb)->>'qt_mat_inf',  '0') AS BIGINT) as qt_mat_inf,
              CAST(COALESCE((c.dados::jsonb)->>'qt_mat_fund', '0') AS BIGINT) as qt_mat_fund,
              CAST(COALESCE((c.dados::jsonb)->>'qt_mat_med',  '0') AS BIGINT) as qt_mat_med,
              CAST(COALESCE((c.dados::jsonb)->>'qt_mat_eja',  '0') AS BIGINT) as qt_mat_eja,
              CAST(COALESCE((c.dados::jsonb)->>'qt_mat_prof', '0') AS BIGINT) as qt_mat_prof,
              CAST(COALESCE((ie.dados::jsonb)->>'nivel', '0') AS BIGINT) as icg_nivel
            FROM censo_escolar c
            LEFT JOIN indicadores_educacionais ie
              ON ie.inep = c.inep AND ie.ano = ? AND ie.tipo = 'icg'
            WHERE c.ano=? AND c.inep IN (${placeholders})
          `, [ano, ano, ...batch]) as any[];
          for (const d of detalhes) detalheMap[d.inep] = d;
        }

        // Filtro: candidata deve ter ao menos 1 modalidade em comum com a base
        // Prioridade geográfica (haversine) traz cidades vizinhas antes de capitais
        const contemBase = (s: any): boolean => {
          const mods = toModalidades(s);
          for (const m of modalidadesBase) {
            if (mods.has(m)) return true;
          }
          return false;
        };

        similares = prefiltrados
          .map(s => ({ ...s, ...(detalheMap[s.inep] || {}) }))
          .filter(s => {
            if (!contemBase(s)) return false;
            if (icgBase !== null && s.icg_nivel !== null && s.icg_nivel !== icgBase) return false;
            return true;
          })
          .sort((a, b) => {
            // Ordena por distância haversine (distância em linha reta) para pré-selecionar os 50 mais próximos.
            // Mantemos o comparador simples e transitivo para evitar instabilidades no sort.
            const da = haversineKm(coMunBase, a.co_municipio || 0);
            const db = haversineKm(coMunBase, b.co_municipio || 0);
            if (da !== db) return da - db;
            // Desempate por município igual: prefere maior sobreposição de modalidade
            const overlapA = [...modalidadesBase].filter(m => toModalidades(a).has(m)).length;
            const overlapB = [...modalidadesBase].filter(m => toModalidades(b).has(m)).length;
            if (overlapA !== overlapB) return overlapB - overlapA;
            return Math.abs((a.matriculas||0) - targetMat) - Math.abs((b.matriculas||0) - targetMat);
          })
          .slice(0, 50);
      }

      // === Distância rodoviária via OSRM (OpenStreetMap) com cache SQLite ===
      let distanciaRodoviaria = false;
      const munToRoadKm: Record<number, number> = {};
      const baseCentroid = MUNICIPIO_CENTROIDES[coMunBase];
      if (baseCentroid && similares.length > 0 && coMunBase) {
        try {
          const destMuns = [...new Set(similares.map((s: any) => s.co_municipio).filter(Boolean))] as number[];

          // 1. Busca do cache PG (instant)
          if (destMuns.length > 0) {
            const placeholders = destMuns.map(() => "?").join(",");
            try {
              const cachedRows = await pgAll(
                `SELECT co_mun_dest, km FROM mun_road_dist WHERE co_mun_orig=? AND co_mun_dest IN (${placeholders})`,
                [coMunBase, ...destMuns]
              ) as { co_mun_dest: number; km: number }[];
              for (const row of cachedRows) munToRoadKm[row.co_mun_dest] = row.km;
            } catch {}
          }

          // 2. Chama OSRM apenas para municípios não cacheados
          const uncached = destMuns.filter(m => munToRoadKm[m] === undefined);
          if (uncached.length > 0) {
            // Manter alinhamento: apenas municípios COM centroide, na mesma ordem
            const uncachedWithCoord = uncached
              .map(mun => { const c = MUNICIPIO_CENTROIDES[mun]; return c ? { mun, coord: `${c[1]},${c[0]}` } : null; })
              .filter(Boolean) as { mun: number; coord: string }[];

            if (uncachedWithCoord.length > 0) {
              const destCoords = uncachedWithCoord.map(x => x.coord);
              const allCoords = [`${baseCentroid[1]},${baseCentroid[0]}`, ...destCoords].join(";");
              const osrmUrl = `http://router.project-osrm.org/table/v1/driving/${allCoords}?sources=0&annotations=distance`;
              const osrmRes = await fetch(osrmUrl, { signal: AbortSignal.timeout(8000) });
              if (osrmRes.ok) {
                const osrmData = await osrmRes.json() as any;
                if (osrmData.code === "Ok" && Array.isArray(osrmData.distances?.[0])) {
                  const row = osrmData.distances[0] as (number | null)[];
                  // Usar uncachedWithCoord (alinhado com destCoords) — evita deslocamento de índice
                  const roadInsertSql = `INSERT INTO mun_road_dist (co_mun_orig, co_mun_dest, km) VALUES (?, ?, ?) ON CONFLICT (co_mun_orig, co_mun_dest) DO UPDATE SET km=excluded.km`;
                  for (let i = 0; i < uncachedWithCoord.length; i++) {
                    const meters = row[i + 1];
                    if (meters != null && isFinite(meters)) {
                      const km = Math.round(meters / 1000);
                      munToRoadKm[uncachedWithCoord[i].mun] = km;
                      pgRun(roadInsertSql, [coMunBase, uncachedWithCoord[i].mun, km]).catch(() => {});
                      pgRun(roadInsertSql, [uncachedWithCoord[i].mun, coMunBase, km]).catch(() => {});
                    }
                  }
                }
              }
            }
          }

          if (destMuns.some(m => munToRoadKm[m] !== undefined)) {
            distanciaRodoviaria = true;
          }
        } catch {
          // fallback silencioso para haversine
        }
      }

      // Re-ordenar por distância rodoviária se obtida
      if (distanciaRodoviaria) {
        similares.sort((a, b) => {
          const da = munToRoadKm[a.co_municipio] ?? haversineKm(coMunBase, a.co_municipio || 0);
          const db = munToRoadKm[b.co_municipio] ?? haversineKm(coMunBase, b.co_municipio || 0);
          return da - db;
        });
      }

      const porUf: Record<string, number> = {};
      for (const s of similares) {
        if (s.uf) porUf[s.uf.toUpperCase()] = (porUf[s.uf.toUpperCase()] || 0) + 1;
      }

      res.json({
        escola_base: {
          inep, dependencia: escola.dependencia, localizacao: escola.localizacao,
          matriculas: escola.matriculas, uf: ufBase,
          modalidades: fingerprintBase,
          icg_nivel: icgBase,
        },
        total: similares.length,
        por_uf: porUf,
        distancia_tipo: distanciaRodoviaria ? "rodoviária" : "linha reta",
        escolas: similares.map(s => ({
          inep: s.inep,
          nome: s.nome,
          municipio: s.municipio,
          uf: s.uf?.toUpperCase(),
          dependencia: s.dependencia,
          localizacao: s.localizacao,
          matriculas: s.matriculas,
          distancia_km: coMunBase && s.co_municipio
            ? (munToRoadKm[s.co_municipio] ?? Math.round(haversineKm(coMunBase, s.co_municipio)))
            : null,
          telefone: s.telefone || null,
          ds_endereco: s.ds_endereco || null,
          no_bairro: s.no_bairro || null,
          co_cep: s.co_cep || null,
          icg_nivel: s.icg_nivel ?? null,
          modalidades: [
            s.qt_mat_inf  > 0 && "Infantil",
            s.qt_mat_fund > 0 && "Fundamental",
            s.qt_mat_med  > 0 && "Médio",
            s.qt_mat_eja  > 0 && "EJA",
            s.qt_mat_prof > 0 && "Prof.",
          ].filter(Boolean),
        })),
      });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  });

  // === STATS POR UF ===
  app.get("/api/censo-escolar/:ano/uf/:uf/stats", async (req, res) => {
    const ano = parseInt(req.params.ano);
    const uf = (req.params.uf || "").toUpperCase();

    try {
      const total = await pgGet(
        `SELECT COUNT(*) as escolas, COALESCE(SUM(CAST(matriculas AS BIGINT)),0) as matriculas
         FROM censo_escolar WHERE ano=? AND UPPER(uf)=?`,
        [ano, uf]
      ) as any;
      const totalComDocentes = await pgGet(
        `SELECT COUNT(*) as escolas,
                COALESCE(SUM(CAST(matriculas AS BIGINT)),0) as matriculas,
                COALESCE(SUM(CAST(docentes AS BIGINT)),0) as docentes,
                COALESCE(SUM(CAST(turmas AS BIGINT)),0) as turmas
         FROM censo_escolar WHERE ano=? AND UPPER(uf)=?`,
        [ano, uf]
      ) as any;
      const porDep = await pgAll(
        `SELECT dependencia, COUNT(*) as n FROM censo_escolar WHERE ano=? AND UPPER(uf)=? GROUP BY dependencia`,
        [ano, uf]
      ) as any[];
      const porLoc = await pgAll(
        `SELECT localizacao, COUNT(*) as n FROM censo_escolar WHERE ano=? AND UPPER(uf)=? GROUP BY localizacao`,
        [ano, uf]
      ) as any[];
      const topMun = await pgAll(
        `SELECT municipio, COUNT(*) as escolas, COALESCE(SUM(CAST(matriculas AS BIGINT)),0) as matriculas
         FROM censo_escolar WHERE ano=? AND UPPER(uf)=? AND situacao='Em Atividade'
         GROUP BY municipio ORDER BY escolas DESC LIMIT 8`,
        [ano, uf]
      ) as any[];

      res.json({
        uf,
        ano,
        total_escolas: Number(total?.escolas || 0),
        total_matriculas: Number(total?.matriculas || 0),
        total_docentes: Number(totalComDocentes?.docentes || 0),
        total_turmas: Number(totalComDocentes?.turmas || 0),
        por_dependencia: Object.fromEntries(porDep.map((r: any) => [r.dependencia || "Outro", Number(r.n)])),
        por_localizacao: Object.fromEntries(porLoc.map((r: any) => [r.localizacao || "Outro", Number(r.n)])),
        top_municipios: topMun.map((r: any) => ({ municipio: r.municipio, escolas: Number(r.escolas), matriculas: Number(r.matriculas) || 0 })),
      });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  });

  // === INSIGHTS CENSO: comparativo 2024→2025 por campo binário (por UF ou nacional) ===
  // Resultado é cacheado por 7 dias. Cálculo pesado roda em Worker Thread (não bloqueia o event loop).
  app.get("/api/censo-escolar/insights/:scope", async (req, res) => {
    const scope = (req.params.scope || "BR").toUpperCase();
    const CACHE_KEY = `censo_insights_${scope}`;
    const CACHE_TTL_H = 7 * 24; // 7 dias — dados do censo são estáticos

    // Verifica cache primeiro
    try {
      const cached = await pgGet(
        `SELECT data, updated_at FROM stats_cache WHERE cache_key=? LIMIT 1`,
        [CACHE_KEY]
      ) as any;
      if (cached) {
        const ageH = (Date.now() - Number(cached.updated_at)) / 3600000;
        if (ageH < CACHE_TTL_H) {
          return res.json(JSON.parse(cached.data));
        }
      }
    } catch {}

    const CAMPOS = [
      { key: "in_agua_potavel",             label: "Água potável" },
      { key: "in_agua_rede_publica",        label: "Água da rede pública" },
      { key: "in_esgoto_rede_publica",      label: "Esgoto em rede pública" },
      { key: "in_lixo_servico_coleta",      label: "Coleta regular de lixo" },
      { key: "in_energia_rede_publica",     label: "Energia da rede pública" },
      { key: "in_banheiro",                 label: "Banheiro" },
      { key: "in_banheiro_pne",             label: "Banheiro acessível (PNE)" },
      { key: "in_internet",                label: "Acesso à internet" },
      { key: "in_banda_larga",             label: "Banda larga" },
      { key: "in_wifi",                    label: "Wi-Fi" },
      { key: "in_biblioteca",              label: "Biblioteca" },
      { key: "in_laboratorio_informatica", label: "Lab. de informática" },
      { key: "in_energia_renovavel",       label: "Energia renovável" },
      { key: "in_quadra_esportes_coberta", label: "Quadra coberta" },
      { key: "in_refeitorio",              label: "Refeitório" },
      { key: "in_cozinha",                 label: "Cozinha" },
      { key: "in_horta",                   label: "Horta escolar" },
      { key: "in_educacao_indigena",       label: "Ed. Indígena" },
      { key: "in_educacao_quilombola",     label: "Ed. Quilombola" },
      { key: "in_educacao_campo",          label: "Ed. do Campo" },
      { key: "in_ppp",                     label: "Projeto Político-Pedagógico" },
    ];

    try {
      const payload = await computeInsightsInWorker(scope, CAMPOS, resolvedDbPath);

      safeCacheWrite(CACHE_KEY, payload);

      res.json(payload);
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  });

  app.get("/api/censo-escolar/:ano/escolas/:inep", async (req, res) => {
    const ano = parseInt(req.params.ano);
    const inep = getParam(req.params, "inep");
    const data = await getCensoEscolarDetail(ano, inep);
    if (!data) return res.status(404).json({ erro: "Escola não encontrada" });
    res.json(data);
  });

  app.get("/api/censo-escolar/:ano/escolas", async (req, res) => {
    const ano = parseInt(req.params.ano);
    const page = parseInt(req.query.pagina as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 20;
    const filters: Record<string, string> = {};
    for (const key of ["uf", "municipio", "nome", "tp_dependencia", "tp_localizacao", "tp_situacao"]) {
      if (req.query[key]) filters[key] = req.query[key] as string;
    }
    res.json(await listCensoEscolar(ano, filters, page, perPage));
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
    app.get(`/api/${apiPath}/:ano/escolas/:inep`, async (req, res) => {
      const ano = parseInt(req.params.ano);
      const inep = getParam(req.params, "inep");
      const data = await getIndicadorDetail(tipoDb, ano, inep);
      if (!data) return res.status(404).json({ erro: "Não encontrado" });
      res.json(data);
    });

    app.get(`/api/${apiPath}/:ano/escolas`, async (req, res) => {
      const ano = parseInt(req.params.ano);
      const page = parseInt(req.query.pagina as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 20;
      const filters: Record<string, string> = {};
      for (const key of ["uf", "municipio", "nome", "etapa", "rede"]) {
        if (req.query[key]) filters[key] = req.query[key] as string;
      }
      res.json(await listIndicador(tipoDb, ano, filters, page, perPage));
    });
  }

  // === LEGACY: /api/indicador/* routes (backward compat) ===
  for (const [apiPath, tipoDb] of Object.entries(INDICATOR_TIPO_MAP)) {
    app.get(`/api/indicador/${apiPath}/:ano/escolas/:inep`, async (req, res) => {
      const ano = parseInt(req.params.ano);
      const inep = getParam(req.params, "inep");
      const data = await getIndicadorDetail(tipoDb, ano, inep);
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
      const CACHE_KEY = `pdde_info_${inep}_${ano}`;
      const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4h
      const cached = await pgGet(`SELECT data, updated_at FROM stats_cache WHERE cache_key=? LIMIT 1`, [CACHE_KEY]) as any;
      if (cached && (Date.now() - cached.updated_at) < CACHE_TTL_MS) {
        const parsed = JSON.parse(cached.data);
        return res.json({ ...parsed, _cached_at: cached.updated_at });
      }
      const result = await getPddeInfo(ano, inep);
      if (result?.ok) safeCacheWrite(CACHE_KEY, result);
      const nowTs = Date.now();
      res.json({ ...result, _cached_at: nowTs });
    } catch (err: any) {
      console.error("PDDE scraper error:", err.message);
      res.status(500).json({ ok: false, error: "Erro ao consultar dados do FNDE" });
    }
  });

  // === PUBLIC: SIGPC - PRESTAÇÃO DE CONTAS ===
  // Endpoint 1: Localizar prestações por CNPJ (busca inicial)
  app.get("/api/pdde/execfin/:coEscola", async (req, res) => {
    try {
      const coEscola = req.params.coEscola.replace(/[^\d]/g, "");
      if (!/^\d{8}$/.test(coEscola)) {
        return res.status(400).json({ ok: false, repasses: [], anosDisponiveis: [], fonte: "indisponivel", error: "Código INEP inválido (deve ter 8 dígitos)" });
      }
      const CACHE_KEY = `pdde_execfin_${coEscola}`;
      const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
      const cached = await pgGet(`SELECT data, updated_at FROM stats_cache WHERE cache_key=? LIMIT 1`, [CACHE_KEY]) as any;
      if (cached && (Date.now() - cached.updated_at) < CACHE_TTL_MS) return res.json(JSON.parse(cached.data));
      const result = await consultarExecFinPdde(coEscola);
      if (result?.ok) safeCacheWrite(CACHE_KEY, result);
      res.json(result);
    } catch (err: any) {
      console.error("PDDE exec fin error:", err.message);
      res.status(500).json({ ok: false, repasses: [], anosDisponiveis: [], fonte: "indisponivel", error: "Erro ao consultar execução financeira PDDE" });
    }
  });

  app.get("/api/pdde/saldos/:coEscola", async (req, res) => {
    try {
      const coEscola = req.params.coEscola.replace(/[^\d]/g, "");
      if (!/^\d{8}$/.test(coEscola)) {
        return res.status(400).json({ ok: false, saldos: [], anosDisponiveis: [], fonte: "indisponivel", error: "Código INEP inválido (deve ter 8 dígitos)" });
      }
      const CACHE_KEY = `pdde_saldos_${coEscola}`;
      const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
      const cached = await pgGet(`SELECT data, updated_at FROM stats_cache WHERE cache_key=? LIMIT 1`, [CACHE_KEY]) as any;
      if (cached && (Date.now() - cached.updated_at) < CACHE_TTL_MS) return res.json(JSON.parse(cached.data));
      const result = await consultarSaldosPdde(coEscola);
      if (result?.ok) safeCacheWrite(CACHE_KEY, result);
      res.json(result);
    } catch (err: any) {
      console.error("PDDE saldos error:", err.message);
      res.status(500).json({ ok: false, saldos: [], anosDisponiveis: [], fonte: "indisponivel", error: "Erro ao consultar saldos PDDE" });
    }
  });

  app.get("/api/pdde/uex/saldo", async (req, res) => {
    try {
      const cnpj = String(req.query.cnpj || "").replace(/\D/g, "");
      const mes = req.query.mes ? String(req.query.mes) : undefined;
      const sg_uf = req.query.sg_uf ? String(req.query.sg_uf) : undefined;
      const co_municipio_fnde = req.query.co_municipio_fnde ? String(req.query.co_municipio_fnde) : undefined;
      const co_programa_fnde = req.query.co_programa_fnde ? String(req.query.co_programa_fnde) : undefined;
      const page = req.query.page ? Number(req.query.page) : 1;

      if (!cnpj && !sg_uf) {
        return res.status(400).json({ ok: false, saldos: [], total_saldo_fundos: 0, total_saldo_geral: 0, error: "Informe CNPJ ou UF para consulta" });
      }

      // Build list of months to try: requested month + up to 4 previous months as fallback
      const buildMonthList = (base?: string): string[] => {
        const ref = base || (() => { const d = new Date(); return `${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`; })();
        const [mm, yyyy] = ref.split('-').map(Number);
        const months: string[] = [];
        for (let i = 0; i < 5; i++) {
          let m = mm - i; let y = yyyy;
          if (m <= 0) { m += 12; y -= 1; }
          months.push(`${String(m).padStart(2,'0')}-${y}`);
        }
        return months;
      };

      // Only do fallback for single-CNPJ queries (not bulk UF queries)
      if (cnpj && !sg_uf) {
        for (const tryMes of buildMonthList(mes)) {
          const result = await getPddeUexSaldo(cnpj, { mes: tryMes, co_programa_fnde, page });
          if (result?.ok && result.saldos && result.saldos.length > 0) {
            return res.json(result);
          }
        }
        // All months returned no data — return last attempt with its mes
        const last = await getPddeUexSaldo(cnpj, { mes: buildMonthList(mes)[0], co_programa_fnde, page });
        return res.json(last);
      }

      const result = await getPddeUexSaldo(cnpj || "", { mes, sg_uf, co_municipio_fnde, co_programa_fnde, page });
      res.json(result);
    } catch (err: any) {
      console.error("PDDE UEX saldo error:", err.message);
      res.status(500).json({ ok: false, saldos: [], total_saldo_fundos: 0, total_saldo_geral: 0, error: "Erro ao consultar saldo da UEx" });
    }
  });

  app.get("/api/pdde/relatorios/situacao-cadastral", async (req, res) => {
    try {
      const {
        ano = String(new Date().getFullYear()),
        sg_uf, co_municipio_fnde, cnpj, co_escola,
        tp_relatorio, st_cadstral, ds_localizacao, fimMandato, page,
      } = req.query as Record<string, string>;

      if (!ano) return res.status(400).json({ ok: false, error: "Parâmetro 'ano' é obrigatório" });

      const result = await getSituacaoCadastral({
        ano, sg_uf, co_municipio_fnde, cnpj, co_escola,
        tp_relatorio, st_cadstral, ds_localizacao, fimMandato, page,
      });
      res.json(result);
    } catch (err: any) {
      console.error("PDDE situação cadastral error:", err.message);
      res.status(500).json({ ok: false, total_registros: null, pagina_atual: 1, itens: [], error: "Erro ao consultar situação cadastral" });
    }
  });

  app.get("/api/pdde/municipios/:sg_uf", async (req, res) => {
    try {
      const sg_uf = req.params.sg_uf.toUpperCase().replace(/[^A-Z]/g, "");
      if (sg_uf.length !== 2) return res.status(400).json({ ok: false, municipios: [], error: "UF inválida" });
      const result = await getMunicipiosPorUf(sg_uf);
      res.json(result);
    } catch (err: any) {
      console.error("PDDE municípios error:", err.message);
      res.status(500).json({ ok: false, municipios: [], error: "Erro ao buscar municípios" });
    }
  });

  app.get("/api/pdde/relatorios/prestacao-contas", async (req, res) => {
    try {
      const {
        ano = String(new Date().getFullYear()),
        sg_uf, co_municipio_fnde, co_programa_fnde, cnpj, co_escola, tp_relatorio, page,
      } = req.query as Record<string, string>;
      const result = await getSituacaoPrestacaoConta({ ano, sg_uf, co_municipio_fnde, co_programa_fnde, cnpj, co_escola, tp_relatorio, page });
      res.json(result);
    } catch (err: any) {
      console.error("PDDE prestação de contas error:", err.message);
      res.status(500).json({ ok: false, disponivel: false, total_registros: null, pagina_atual: 1, itens: [], error: "Erro ao consultar prestação de contas" });
    }
  });

  app.get("/api/pdde/relatorios/atendimento", async (req, res) => {
    try {
      const {
        ano = String(new Date().getFullYear()),
        sg_uf, co_municipio_fnde, cnpj, co_escola, tp_relatorio, page,
      } = req.query as Record<string, string>;
      const result = await getSituacaoAtendimento({ ano, sg_uf, co_municipio_fnde, cnpj, co_escola, tp_relatorio, page });
      res.json(result);
    } catch (err: any) {
      console.error("PDDE atendimento error:", err.message);
      res.status(500).json({ ok: false, disponivel: false, total_registros: null, pagina_atual: 1, itens: [], error: "Erro ao consultar situação de atendimento" });
    }
  });

  app.get("/api/pdde/relatorios/suspensao", async (req, res) => {
    try {
      const {
        ano = String(new Date().getFullYear()),
        sg_uf, co_municipio_fnde, cnpj, co_escola, tp_relatorio, page,
      } = req.query as Record<string, string>;
      const result = await getRelatorioSuspensao({ ano, sg_uf, co_municipio_fnde, cnpj, co_escola, tp_relatorio, page });
      res.json(result);
    } catch (err: any) {
      console.error("PDDE suspensão error:", err.message);
      res.status(500).json({ ok: false, disponivel: false, total_registros: null, pagina_atual: 1, itens: [], error: "Erro ao consultar relatório de suspensão" });
    }
  });

  app.get("/api/pdde/suspensao/escola/:inep", async (req, res) => {
    try {
      const co_escola = req.params.inep;
      const ano = Number(req.query.ano) || new Date().getFullYear();
      const sg_uf = (req.query.sg_uf as string || "").toUpperCase();
      if (!sg_uf) return res.status(400).json({ ok: false, error: "sg_uf obrigatório" });

      const CACHE_KEY = `pdde_susp_escola_${co_escola}_${sg_uf}_${ano}`;
      const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4h
      const cached = await pgGet(
        `SELECT data, updated_at FROM stats_cache WHERE cache_key=? LIMIT 1`,
        [CACHE_KEY]
      ) as any;
      if (cached && (Date.now() - cached.updated_at) < CACHE_TTL_MS) {
        return res.json(JSON.parse(cached.data));
      }

      const result = await getRelatorioSuspensaoPorEscola(co_escola, sg_uf, ano);
      safeCacheWrite(CACHE_KEY, result);
      res.json(result);
    } catch (err: any) {
      console.error("PDDE suspensão-escola error:", err.message);
      res.status(500).json({ ok: false, disponivel: false, co_escola: req.params.inep, ano: 0, itens: [], error: "Erro ao consultar suspensão" });
    }
  });


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

  app.get("/api/sigpc/uf/:uf", async (req, res) => {
    try {
      const uf = req.params.uf.toUpperCase();
      const ano = parseInt(req.query.ano as string) || 2024;
      const programa = req.query.programa as string | undefined;
      const top = Math.min(parseInt(req.query.top as string) || 100, 500);
      const skip = parseInt(req.query.skip as string) || 0;

      const result = await localizarPrestacoesPorUf(uf, ano, programa, top, skip);
      res.json(result);
    } catch (err: any) {
      console.error("SIGPC UF error:", err.message);
      res.status(500).json({ ok: false, error: "Erro ao buscar prestações por UF", prestacoes: [], fonte: "indisponivel" });
    }
  });

  app.get("/api/sigpc/detalhar/:pcId", async (req, res) => {
    try {
      const pcId = parseInt(req.params.pcId);
      if (isNaN(pcId)) {
        return res.status(400).json({ ok: false, error: "pcId inválido" });
      }

      const detalhes = await detalharPrestacao(pcId);
      if (!detalhes) {
        return res.json({ ok: false, error: "Detalhamento não disponível via API OLINDA (apenas dados agregados). Use a consulta por CNPJ para ver os dados da prestação de contas." });
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
  app.post("/api/admin/cache/invalidar", adminAuth, (_req, res) => {
    invalidateStatsCache();
    res.json({ mensagem: "Cache de estatísticas limpo com sucesso" });
  });

  app.post("/api/admin/importar", adminAuth, async (req, res) => {
    const tipos = req.body.tipos as string[] | undefined;
    const anos = req.body.anos as number[] | undefined;
    importFromExternalApi(tipos, anos).then(result => {
      invalidateStatsCache();
      console.log("[Import] Finished:", JSON.stringify(result.errors?.length || 0), "errors");
    });
    res.json({ mensagem: "Importação iniciada em background", status: getImportStatus() });
  });

  app.get("/api/admin/importar-status", adminAuth, async (_req, res) => {
    res.json({ ...getImportStatus(), stats: await getLocalStats() });
  });

  app.get("/api/importar-status", async (_req, res) => {
    res.json({ ...getImportStatus(), stats: await getLocalStats() });
  });

  app.post("/api/admin/importar-indicadores", adminAuth, async (req, res) => {
    if (getIndicatorImportRunning()) {
      return res.status(409).json({ error: "Importação de indicadores já em andamento" });
    }
    const tipos = req.body.tipos as string[] | undefined;
    const anos = req.body.anos as number[] | undefined;
    importAllIndicators(tipos, anos).then(result => {
      invalidateStatsCache();
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
      invalidateStatsCache();
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
      invalidateStatsCache();
      console.log("[INEP] INSE import finished:", JSON.stringify(result.errors?.length || 0), "errors");
    });
    res.json({ mensagem: "Importação de INSE iniciada em background" });
  });

  // === ADMIN: IMPORTAR MICRODADOS DO DRIVE (2020-2024) ===
  app.post("/api/admin/importar-drive", adminAuth, async (req, res) => {
    if (driveProgress.running) {
      return res.status(409).json({ error: "Importação do Drive já em andamento" });
    }
    const anos: number[] = req.body.anos ?? [2020, 2021, 2022, 2023, 2024];
    importAllDriveYears(anos).then(() => {
      invalidateStatsCache();
      console.log("[drive-import] All years done, cache invalidated");
    }).catch(err => {
      console.error("[drive-import] Fatal error:", err);
    });
    res.json({ mensagem: "Importação do Google Drive iniciada em background", anos });
  });

  app.post("/api/admin/importar-drive-ano", adminAuth, async (req, res) => {
    if (driveProgress.running) {
      return res.status(409).json({ error: "Importação do Drive já em andamento" });
    }
    const ano: number = req.body.ano;
    if (!ano) return res.status(400).json({ error: "ano obrigatório" });
    importDriveYear(ano).then(() => {
      invalidateStatsCache();
    }).catch(err => {
      console.error("[drive-import] Error:", err);
    });
    res.json({ mensagem: `Importação do Google Drive para ${ano} iniciada`, ano });
  });

  app.get("/api/admin/importar-drive-status", adminAuth, (_req, res) => {
    res.json(driveProgress);
  });

  // ── Import Censo 2025 (Python script) ─────────────────────────────────────
  const censo2025Status = { running: false, log: [] as string[], exitCode: null as number | null };
  app.post("/api/admin/importar-censo-2025", adminAuth, (_req, res) => {
    if (censo2025Status.running) {
      return res.status(409).json({ error: "Import 2025 já em andamento" });
    }
    censo2025Status.running = true;
    censo2025Status.log = [];
    censo2025Status.exitCode = null;
    const py = spawn("python3", ["-u", "server/import-censo-2025.py"], { cwd: process.cwd() });
    py.stdout.on("data", (d: Buffer) => { censo2025Status.log.push(d.toString()); });
    py.stderr.on("data", (d: Buffer) => { censo2025Status.log.push("[ERR] " + d.toString()); });
    py.on("close", (code: number) => {
      censo2025Status.running = false;
      censo2025Status.exitCode = code;
      if (code === 0) invalidateStatsCache();
      console.log(`[censo-2025] Python import finished with code ${code}`);
    });
    res.json({ mensagem: "Import Censo 2025 iniciado em background" });
  });
  app.get("/api/admin/importar-censo-2025-status", adminAuth, (_req, res) => {
    res.json({ ...censo2025Status, log: censo2025Status.log.slice(-50) });
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
      importIdeb([ano]).then(r => { invalidateStatsCache(); console.log("[INEP] IDEB import done:", r.errors?.length || 0, "errors"); });
      return res.json({ mensagem: `Importação de IDEB ${ano} iniciada` });
    }
    if (dbTipo === "inse") {
      if (getIndicatorImportRunning()) return res.status(409).json({ error: "Importação já em andamento" });
      importInse([ano]).then(r => { invalidateStatsCache(); console.log("[INEP] INSE import done:", r.errors?.length || 0, "errors"); });
      return res.json({ mensagem: `Importação de INSE ${ano} iniciada` });
    }
    if (dbTipo === "saeb") {
      if (getIndicatorImportRunning()) return res.status(409).json({ error: "Importação já em andamento" });
      generateSaebFromIdeb().then(r => { invalidateStatsCache(); console.log("[INEP] SAEB generation done:", JSON.stringify(r)); });
      return res.json({ mensagem: "Geração de SAEB a partir de IDEB iniciada" });
    }

    if (getIndicatorImportRunning()) return res.status(409).json({ error: "Importação já em andamento" });
    importAllIndicators([dbTipo], [ano]).then(r => {
      invalidateStatsCache();
      console.log(`[INEP] ${dbTipo} import done:`, r.errors?.length || 0, "errors");
    });
    res.json({ mensagem: `Importação de ${tipo} ${ano} iniciada` });
  });

  app.get("/api/admin/indicadores-status", adminAuth, async (_req, res) => {
    const stats = await getLocalStats();
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

  const mecNormasCache: { data: any; timestamp: number; tipo?: string; page?: number } | { entries: Map<string, { data: any; timestamp: number }> } = { entries: new Map() };
  const MEC_CACHE_TTL = 1000 * 60 * 30;

  app.get("/api/mecnormas/all", async (req, res) => {
    try {
      const page = Math.max(0, parseInt(String(req.query.page || "0"), 10));
      const size = Math.min(parseInt(String(req.query.size || "50"), 10), 100);
      const tipo = req.query.tipo ? String(req.query.tipo) : undefined;
      const assunto = req.query.assunto ? String(req.query.assunto) : undefined;
      const vigente = req.query.vigente;
      const q = req.query.q ? String(req.query.q) : undefined;

      const cacheKey = `${page}-${size}-${tipo || ""}-${assunto || ""}-${vigente || ""}-${q || ""}`;
      const cached = (mecNormasCache as any).entries?.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < MEC_CACHE_TTL) {
        return res.json(cached.data);
      }

      const url = new URL("https://mecnormas.mec.gov.br/pesquisa/api/atos");
      url.searchParams.set("page", String(page));
      url.searchParams.set("pageSize", String(size));
      if (tipo) url.searchParams.set("tipo", tipo);
      if (assunto) url.searchParams.set("assunto", assunto);
      if (vigente === "true") url.searchParams.set("vigente", "true");
      if (vigente === "false") url.searchParams.set("vigente", "false");
      if (q) url.searchParams.set("buscaTextual", q);

      const response = await fetch(url.toString(), {
        headers: { "User-Agent": "chegou-a-conta-bot", "Accept": "application/json" },
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        return res.status(502).json({ ok: false, message: "MEC Normas indisponível" });
      }

      const data = await response.json();
      const result = {
        ok: true,
        entidades: data.entidades || [],
        total: data.total || 0,
        page,
        size,
        totalPages: Math.ceil((data.total || 0) / size),
      };

      if (!(mecNormasCache as any).entries) {
        (mecNormasCache as any).entries = new Map();
      }
      (mecNormasCache as any).entries.set(cacheKey, { data: result, timestamp: Date.now() });

      if ((mecNormasCache as any).entries.size > 100) {
        const firstKey = (mecNormasCache as any).entries.keys().next().value;
        (mecNormasCache as any).entries.delete(firstKey);
      }

      res.json(result);
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message || "Erro ao buscar normas do MEC" });
    }
  });

  app.get("/api/mecnormas/tipos", async (_req, res) => {
    try {
      const cacheKey = "tipos-summary";
      const cached = (mecNormasCache as any).entries?.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < MEC_CACHE_TTL) {
        return res.json(cached.data);
      }

      const sampleResp = await fetch("https://mecnormas.mec.gov.br/pesquisa/api/atos?page=0&pageSize=50", {
        headers: { "User-Agent": "chegou-a-conta-bot", "Accept": "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      const sampleData = await sampleResp.json();
      const totalGeral = sampleData.total || 0;

      const discoveredTipos = new Map<number, string>();
      for (const ato of (sampleData.entidades || [])) {
        if (ato.tipo?.id && ato.tipo?.nome) {
          discoveredTipos.set(ato.tipo.id, ato.tipo.nome);
        }
      }

      const knownTipoIds = [3403, 3753, 3203, 3503, 3603, 3703, 3803, 3853, 3903, 3953, 4003, 4053, 4103, 4153, 4253, 4353, 4553, 4653, 3303];
      for (const id of knownTipoIds) {
        if (!discoveredTipos.has(id)) discoveredTipos.set(id, "");
      }

      const tipoCounts: { id: number; nome: string; total: number }[] = [];
      const countPromises = [...discoveredTipos.entries()].map(async ([tipoId, tipoName]) => {
        try {
          const resp = await fetch(`https://mecnormas.mec.gov.br/pesquisa/api/atos?page=0&pageSize=1&tipo=${tipoId}`, {
            headers: { "User-Agent": "chegou-a-conta-bot", "Accept": "application/json" },
            signal: AbortSignal.timeout(10000),
          });
          const d = await resp.json();
          if (d.total > 0) {
            const nome = tipoName || d.entidades?.[0]?.tipo?.nome || `Tipo ${tipoId}`;
            tipoCounts.push({ id: tipoId, nome: nome.trim(), total: d.total });
          }
        } catch {}
      });
      await Promise.all(countPromises);

      const result = {
        ok: true,
        totalGeral,
        tipos: tipoCounts.sort((a, b) => b.total - a.total),
      };

      if (!(mecNormasCache as any).entries) {
        (mecNormasCache as any).entries = new Map();
      }
      (mecNormasCache as any).entries.set(cacheKey, { data: result, timestamp: Date.now() });

      res.json(result);
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message || "Erro ao buscar tipos" });
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
      const exactMatch = req.query.exact === "true";
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

  // === PUBLIC: QUERIDO DIÁRIO (MUNICIPAL GAZETTES) ===
  app.get("/api/diarios-municipais/busca", async (req, res) => {
    try {
      const q = String(req.query.q || "").trim();
      if (!q) {
        return res.status(400).json({ ok: false, message: "Termo de busca obrigatório" });
      }
      const size = Math.min(parseInt(String(req.query.size || "10"), 10), 30);
      const offset = parseInt(String(req.query.offset || "0"), 10);
      const territoryIds = req.query.territory_ids ? String(req.query.territory_ids) : undefined;
      const since = req.query.since ? String(req.query.since) : undefined;
      const until = req.query.until ? String(req.query.until) : undefined;

      const params = new URLSearchParams();
      params.set("querystring", q);
      params.set("size", String(size));
      params.set("offset", String(offset));
      params.set("excerpt_size", "200");
      params.set("number_of_excerpts", "1");
      params.set("pre_tags", "<mark>");
      params.set("post_tags", "</mark>");
      params.set("sort_by", "relevance");
      if (territoryIds) params.set("territory_ids", territoryIds);
      if (since) params.set("published_since", since);
      if (until) params.set("published_until", until);

      const apiUrl = `https://api.queridodiario.ok.org.br/gazettes?${params.toString()}`;
      const response = await fetch(apiUrl, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`Querido Diário API returned ${response.status}`);
      }

      const data = await response.json();
      const sanitizeExcerpt = (html: string): string => {
        return html
          .replace(/<(?!\/?mark\b)[^>]*>/gi, "")
          .replace(/on\w+\s*=/gi, "");
      };

      res.json({
        ok: true,
        total: data.total_gazettes || 0,
        gazettes: (data.gazettes || []).map((g: any) => ({
          territory_id: g.territory_id,
          territory_name: g.territory_name,
          state_code: g.state_code,
          date: g.date,
          url: g.url,
          txt_url: g.txt_url,
          edition: g.edition,
          is_extra_edition: g.is_extra_edition,
          excerpts: (g.excerpts || []).map((e: string) => sanitizeExcerpt(e)),
        })),
      });
    } catch (e: any) {
      res.status(500).json({ ok: false, total: 0, gazettes: [], message: e.message });
    }
  });

  app.get("/api/diarios-municipais/cidades", async (req, res) => {
    try {
      const name = String(req.query.name || "").trim();
      if (!name) {
        return res.status(400).json({ ok: false, message: "Nome da cidade obrigatório" });
      }
      const response = await fetch(`https://api.queridodiario.ok.org.br/cities?city_name=${encodeURIComponent(name)}`, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      const data = await response.json();
      res.json({ ok: true, cities: data.cities || [] });
    } catch (e: any) {
      res.status(500).json({ ok: false, cities: [], message: e.message });
    }
  });

  // === DOE: State gazette search via Querido Diário (search all, filter by state) ===
  app.get("/api/diarios-estaduais/busca", async (req, res) => {
    try {
      const q = String(req.query.q || "").trim();
      const stateCode = String(req.query.state || "").trim().toUpperCase();
      if (!q) {
        return res.status(400).json({ ok: false, message: "Termo de busca obrigatório" });
      }
      if (!stateCode || stateCode.length !== 2) {
        return res.status(400).json({ ok: false, message: "Código do estado (UF) obrigatório" });
      }

      const size = Math.min(parseInt(String(req.query.size || "10"), 10), 30);
      const offset = parseInt(String(req.query.offset || "0"), 10);
      const fetchSize = Math.min(size * 15, 150);
      const apiOffset = offset * 15;

      const params = new URLSearchParams();
      params.set("querystring", q);
      params.set("size", String(fetchSize));
      params.set("offset", String(apiOffset));
      params.set("excerpt_size", "200");
      params.set("number_of_excerpts", "1");
      params.set("pre_tags", "<mark>");
      params.set("post_tags", "</mark>");
      params.set("sort_by", "relevance");

      const apiUrl = `https://api.queridodiario.ok.org.br/gazettes?${params.toString()}`;
      const response = await fetch(apiUrl, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        throw new Error(`Querido Diário API returned ${response.status}`);
      }

      const data = await response.json();
      const sanitizeExcerpt = (html: string): string => {
        return html.replace(/<(?!\/?mark\b)[^>]*>/gi, "").replace(/on\w+\s*=/gi, "");
      };

      const allGazettes = (data.gazettes || []);
      const filtered = allGazettes
        .filter((g: any) => g.state_code === stateCode)
        .slice(0, size)
        .map((g: any) => ({
          territory_id: g.territory_id,
          territory_name: g.territory_name,
          state_code: g.state_code,
          date: g.date,
          url: g.url,
          txt_url: g.txt_url,
          edition: g.edition,
          is_extra_edition: g.is_extra_edition,
          excerpts: (g.excerpts || []).map((e: string) => sanitizeExcerpt(e)),
        }));

      res.json({
        ok: true,
        total: filtered.length,
        gazettes: filtered,
        allStates: [...new Set(allGazettes.map((g: any) => g.state_code))].sort(),
      });
    } catch (e: any) {
      res.status(500).json({ ok: false, total: 0, gazettes: [], message: e.message });
    }
  });

  // === CALENDAR: NEWS & DEADLINES ===
  app.get("/api/noticias-educacao", async (req, res) => {
    try {
      const { buscarNoticiasEducacao } = await import("./scraper/noticias-educacao.js");
      const limit = Math.min(parseInt(String(req.query.limit || "15")), 30);
      const result = await buscarNoticiasEducacao(limit);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ ok: false, noticias: [], total: 0, error: e.message });
    }
  });

  app.get("/api/prazos-educacionais", async (req, res) => {
    try {
      const { getPrazosEducacionais } = await import("./scraper/noticias-educacao.js");
      const ano = parseInt(String(req.query.ano || new Date().getFullYear()));
      const prazos = getPrazosEducacionais(ano);
      res.json({ ok: true, prazos, ano });
    } catch (e: any) {
      res.status(500).json({ ok: false, prazos: [], error: e.message });
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

  app.post("/api/tts", async (req, res) => {
    try {
      const text = typeof req.body?.text === "string" ? req.body.text.slice(0, 4000).trim() : "";
      if (!text) return res.status(400).json({ error: "text obrigatório" });
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "nova",
        input: text,
        response_format: "mp3",
        speed: 1.0,
      });
      const buffer = Buffer.from(await mp3.arrayBuffer());
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Cache-Control", "no-store");
      res.send(buffer);
    } catch (err) {
      console.error("TTS error:", err);
      res.status(500).json({ error: "Falha no TTS" });
    }
  });

  // Pré-aquece o cache de insights nacionais em background (query pesada, só precisa rodar uma vez)
  setTimeout(() => {
    const PREWARM_CAMPOS = [
      { key: "in_agua_potavel",             label: "Água potável" },
      { key: "in_agua_rede_publica",        label: "Água da rede pública" },
      { key: "in_esgoto_rede_publica",      label: "Esgoto em rede pública" },
      { key: "in_lixo_servico_coleta",      label: "Coleta regular de lixo" },
      { key: "in_energia_rede_publica",     label: "Energia da rede pública" },
      { key: "in_banheiro",                 label: "Banheiro" },
      { key: "in_banheiro_pne",             label: "Banheiro acessível (PNE)" },
      { key: "in_internet",                label: "Acesso à internet" },
      { key: "in_banda_larga",             label: "Banda larga" },
      { key: "in_wifi",                    label: "Wi-Fi" },
      { key: "in_biblioteca",              label: "Biblioteca" },
      { key: "in_laboratorio_informatica", label: "Lab. de informática" },
      { key: "in_energia_renovavel",       label: "Energia renovável" },
      { key: "in_quadra_esportes_coberta", label: "Quadra coberta" },
      { key: "in_refeitorio",              label: "Refeitório" },
      { key: "in_cozinha",                 label: "Cozinha" },
      { key: "in_horta",                   label: "Horta escolar" },
      { key: "in_educacao_indigena",       label: "Ed. Indígena" },
      { key: "in_educacao_quilombola",     label: "Ed. Quilombola" },
      { key: "in_educacao_campo",          label: "Ed. do Campo" },
      { key: "in_ppp",                     label: "Projeto Político-Pedagógico" },
    ];
    (async () => {
      for (const scope of ["BR"]) {
        const CACHE_KEY = `censo_insights_${scope}`;
        try {
          const existing = await pgGet(`SELECT updated_at FROM stats_cache WHERE cache_key=? LIMIT 1`, [CACHE_KEY]) as any;
          if (existing) {
            const ageH = (Date.now() - Number(existing.updated_at)) / 3600000;
            if (ageH < 7 * 24) { continue; }
          }
        } catch {}
        console.log(`[censo-insights] Pré-aquecendo cache para ${scope} (worker thread)...`);
        computeInsightsInWorker(scope, PREWARM_CAMPOS, resolvedDbPath)
          .then(payload => {
            safeCacheWrite(CACHE_KEY, payload);
            console.log(`[censo-insights] Cache ${scope} salvo (${payload.campos.length} campos).`);
          })
          .catch((e: any) => console.error(`[censo-insights] Erro ao pré-aquecer ${scope}:`, e.message));
      }
    })();
  }, 3000);

  // ── EQUIPAMENTOS PÚBLICOS (SUAS / IBGE MUNIC) ──
  // OSM/Overpass query runs client-side to avoid server rate limits
  app.get("/api/equipamentos-publicos/:coMunicipio", async (req, res) => {
    const { coMunicipio } = req.params;

    if (!coMunicipio || !/^\d{6,7}$/.test(coMunicipio)) {
      return res.status(400).json({ ok: false, error: "Código de município inválido" });
    }

    const ibgeMunicipio = coMunicipio.length === 7 ? coMunicipio.slice(0, 6) : coMunicipio;
    const SUAS_INDICATORS = "72814|72837|72839|72858";

    try {
      const url = `https://servicodados.ibge.gov.br/api/v1/pesquisas/10079/periodos/2013/indicadores/${SUAS_INDICATORS}/resultados/${ibgeMunicipio}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "ChegoAContaDiretora/1.0" } });
      if (!r.ok) throw new Error(`IBGE HTTP ${r.status}`);
      const data: any[] = await r.json();
      const byId: Record<number, string | null> = {};
      for (const ind of data) { byId[ind.id] = ind?.res?.[0]?.res?.["2013"] ?? null; }
      return res.json({
        ok: true,
        co_municipio: coMunicipio,
        ibge_fonte: "IBGE MUNIC Assistência Social 2013",
        suas_counts: {
          cras:       { total: byId[72814] ?? null, label: "CRAS",             descricao: "Centro de Referência da Assistência Social" },
          creas:      { total: byId[72837] ?? null, label: "CREAS",            descricao: "Centro de Referência Especializado de Assistência Social" },
          centro_pop: { total: byId[72839] ?? null, label: "Centro POP",       descricao: "Centro de Referência para Pop. em Situação de Rua" },
          abrigos:    { total: byId[72858] ?? null, label: "Abrigos / Casa Lar", descricao: "Serviços de acolhimento institucional" },
        },
        links: [
          { nome: "Mapa SUAS (MDS)", url: "https://mapas.mds.gov.br/mapas/app/painel-suas/" },
          { nome: "CNES (saúde)", url: "https://cnes.datasus.gov.br/" },
          { nome: "Dados abertos SUAS", url: "https://dados.gov.br/dataset/unidades-de-atendimento-da-assistencia-social" },
          { nome: "CadSUAS", url: "https://cadsuas.mds.gov.br/" },
        ],
      });
    } catch (e: any) {
      return res.json({
        ok: false,
        co_municipio: coMunicipio,
        error: e.message,
        suas_counts: {},
        links: [
          { nome: "Mapa SUAS (MDS)", url: "https://mapas.mds.gov.br/mapas/app/painel-suas/" },
          { nome: "CNES (saúde)", url: "https://cnes.datasus.gov.br/" },
        ],
      });
    }
  });

  // ── MAPA SOCIAL MDS – equipamentos por município ──
  const mapaSocialCache: Record<string, { data: any; at: number }> = {};
  const MAPA_SOCIAL_TTL_MS = 6 * 60 * 60 * 1000; // 6h

  app.get("/api/mapa-social/:coMunicipio", async (req, res) => {
    const { coMunicipio } = req.params;
    if (!coMunicipio || !/^\d{6,7}$/.test(coMunicipio)) {
      return res.status(400).json({ ok: false, error: "Código de município inválido" });
    }

    const ibge6 = coMunicipio.length === 7 ? coMunicipio.slice(0, 6) : coMunicipio;
    const cached = mapaSocialCache[ibge6];
    if (cached && Date.now() - cached.at < MAPA_SOCIAL_TTL_MS) {
      return res.json(cached.data);
    }

    // Social assistance types we care about
    const SOCIAL_TYPES = new Set([
      "CRAS", "CREAS", "CAPS", "CONSELHO_TUTELAR", "CONSELHO_ASSISTENCIA",
      "ACOLHIMENTO", "CONVIVENCIA", "CENTRO_POP", "CENTRO_DIA", "CMDCA",
      "REPUBLICA", "REDE_PARCERIA",
    ]);

    const TIPO_LABEL: Record<string, string> = {
      CRAS: "CRAS",
      CREAS: "CREAS",
      CAPS: "CAPS",
      CONSELHO_TUTELAR: "Conselho Tutelar",
      CONSELHO_ASSISTENCIA: "Conselho Municipal de Assistência Social",
      ACOLHIMENTO: "Serviço de Acolhimento",
      CONVIVENCIA: "Centro de Convivência",
      CENTRO_POP: "Centro POP",
      CENTRO_DIA: "Centro-Dia",
      CMDCA: "CMDCA",
      REPUBLICA: "República",
      REDE_PARCERIA: "Rede de Parceria",
    };

    try {
      const apiUrl = `https://mapa-social-api.mds.gov.br/api/v1/equipamento?q=${ibge6}&rows=300`;
      const r = await fetch(apiUrl, {
        signal: AbortSignal.timeout(12000),
        headers: { "User-Agent": "ChegoAContaDiretora/1.0", "Accept": "application/json" },
      });
      if (!r.ok) throw new Error(`Mapa Social HTTP ${r.status}`);
      const raw: any = await r.json();

      const equipamentos: any[] = [];
      for (const doc of (raw.docs ?? [])) {
        const tipo: string = doc.tipo_equipamento_eq ?? "";
        if (!SOCIAL_TYPES.has(tipo)) continue;
        equipamentos.push({
          tipo,
          tipo_label: TIPO_LABEL[tipo] ?? tipo,
          nome: doc.nome ?? "",
          endereco: [doc.endereco, doc.numero, doc.bairro].filter(Boolean).join(", "),
          cep: doc.cep ?? "",
          telefone: doc.telefone ?? "",
          email: doc.email ?? "",
          latitude: doc.latitude ?? null,
          longitude: doc.longitude ?? null,
          municipio: doc.municipio ?? "",
          cod_ibge: doc.cod_ibge ?? ibge6,
        });
      }

      // Group by tipo
      const grouped: Record<string, any[]> = {};
      for (const eq of equipamentos) {
        if (!grouped[eq.tipo]) grouped[eq.tipo] = [];
        grouped[eq.tipo].push(eq);
      }

      const result = {
        ok: true,
        co_municipio: coMunicipio,
        ibge6,
        total: equipamentos.length,
        fonte: "Mapa Social – MDS (dados.mds.gov.br)",
        atualizado_em: new Date().toISOString(),
        equipamentos,
        grouped,
      };

      mapaSocialCache[ibge6] = { data: result, at: Date.now() };
      return res.json(result);
    } catch (e: any) {
      return res.json({ ok: false, co_municipio: coMunicipio, error: e.message, equipamentos: [], grouped: {} });
    }
  });

  // ── BUSCA CRAS/CREAS por município (cadunicobrasil.com.br scraper) ──
  // Cache: avoid re-geocoding the same municipality within the server process lifetime
  const crasCacheStore: Record<string, { data: any; at: number }> = {};
  const CRAS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

  app.get("/api/busca-cras", async (req, res) => {
    const { municipio, uf, tipo = "CRAS" } = req.query as Record<string, string>;
    if (!municipio || !uf) return res.status(400).json({ ok: false, error: "municipio e uf obrigatórios" });

    const toSlug = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const tipoSlug = tipo.toLowerCase() === "creas" ? "creas" : "cras";
    const munSlug = toSlug(municipio);
    const cacheKey = `${tipoSlug}:${munSlug}`;
    const cached = crasCacheStore[cacheKey];
    if (cached && Date.now() - cached.at < CRAS_CACHE_TTL_MS) {
      return res.json(cached.data);
    }
    const pageUrl = `https://cadunicobrasil.com.br/${tipoSlug}-${munSlug}/`;

    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    try {
      const resp = await fetch(pageUrl, {
        signal: AbortSignal.timeout(12000),
        headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "pt-BR,pt;q=0.9" },
        redirect: "follow",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const html = await resp.text();

      // Check if we got a real municipality page (canonical must match our URL)
      const canonicalM = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
      const canonical = canonicalM ? canonicalM[1] : "";
      if (!canonical.includes(`/${tipoSlug}-${munSlug}/`)) {
        const noPageResult = { ok: true, municipio, uf, tipo: tipoSlug.toUpperCase(), units: [], source: pageUrl, nota: "Sem página específica" };
        crasCacheStore[cacheKey] = { data: noPageResult, at: Date.now() };
        return res.json(noPageResult);
      }

      // Find "locais-de-atendimento" section or any section with address data
      const sectionIds = ["locais-de-atendimento", "atendimento", "unidades", "enderecos", "onde-fica"];
      let sectionText = "";
      for (const sid of sectionIds) {
        const m = html.match(new RegExp(`id=["']${sid}["'][^>]*>(.*?)(?=<h[23]|</article)`, "si"));
        if (m) { sectionText = m[1]; break; }
      }

      // Fallback: scan full content for "Endereço:" patterns
      if (!sectionText) {
        const bodyM = html.match(/<article[^>]*>(.*?)<\/article>/si) || html.match(/<main[^>]*>(.*?)<\/main>/si);
        sectionText = bodyM ? bodyM[1] : html;
      }

      // Clean HTML to plain text
      let text = sectionText
        .replace(/<script[^>]*>.*?<\/script>/gsi, " ")
        .replace(/<style[^>]*>.*?<\/style>/gsi, " ")
        .replace(/&#8220;|&#8221;/g, '"')
        .replace(/&#160;/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\(adsbygoogle[^)]*\)[^;]*;/g, " ")
        .replace(/\s+/g, " ").trim();

      // Parse units: split on "Endereço:" — names appear at END of each part (after phone/email)
      const junkRe = /\(adsbygoogle[^)]*\)\s*\.?\s*push\s*\([^)]*\)\s*;?|\[email[^\]]*\]/gi;
      const parts = text.split(/\s+Endere[çc]o:\s*/i);
      const units: any[] = [];

      // For each part, extract: address, phone, and trailing name (for next unit)
      const parsed = parts.map((part) => {
        const clean = part.replace(junkRe, " ").replace(/\s+/g, " ").trim();

        const telIdx = clean.search(/\s+Telefone:/i);
        const emailIdx = clean.search(/\s+Email:/i);

        // Address ends at first of Telefone/Email
        const addrEnd = [telIdx, emailIdx].filter(x => x > 0).reduce((a, b) => Math.min(a, b), clean.length);
        const endereco = clean.slice(0, addrEnd).trim();

        // Phone
        const telM = clean.match(/Telefone:\s*([\d\s().\-]{6,20}\d)/i);
        const telefone = telM ? telM[1].replace(/\s+/g, " ").trim() : "";

        // Trailing name: strip phone+email fields, leftover at end = next CRAS unit name
        const stripFields = (s: string) => s
          .replace(/Telefone:\s*[\d\s().\-]{4,20}\d/gi, "")   // phone field+value
          .replace(/(?:Telefone|Email):\s*/gi, "")              // any leftover label
          .replace(/\s+/g, " ").trim()
          .replace(/^\W+/, "").trim();

        let trailingName = "";
        if (addrEnd < clean.length) {
          const sliced = clean.slice(addrEnd);
          trailingName = stripFields(sliced);
        } else {
          // Part 0 (intro): no phone/email markers — grab trailing capitalized word group
          // E.g. "...Plano Diretor Norte 407 Norte" → "407 Norte"
          const m = clean.match(/\b([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\d][A-Za-záéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ\d\s()–\-]{2,70})$/);
          if (m) {
            // strip leading lowercase words and punctuation
            trailingName = m[1].trim().replace(/^[a-záéíóúâêîôûãõç\s,;–\-]+/, "").trim();
          }
        }
        // Sanity check: reject if purely numeric or leftover label text
        if (trailingName.length > 80 || /^[\d\s]+$/.test(trailingName) || /^(?:Telefone|Email)/i.test(trailingName)) {
          trailingName = trailingName.replace(/^.*?([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][\w\sáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ()–\-]{2,60})$/, "$1").trim().slice(0, 60);
        }

        return { endereco, telefone, trailingName };
      });

      for (let i = 1; i < parts.length; i++) {
        const { endereco, telefone } = parsed[i];
        const nome = parsed[i - 1].trailingName || `${tipoSlug.toUpperCase()} ${municipio} ${i}`;
        if (endereco.length > 5) {
          units.push({ nome, endereco, telefone, fonte_url: pageUrl, endereco_verificado: false });
        }
      }

      // ── Validação de endereço via Nominatim (OpenStreetMap Geocoding) ──
      // Geocodifica o endereço scraped para obter coordenadas e CEP confirmados.
      // Respeita o limite de 1 req/s da política de uso gratuito do Nominatim.
      const nominatimBase = "https://nominatim.openstreetmap.org/search";
      const nominatimUA = "chegoua-conta-diretora/1.0 (educacao publica br)";

      // Build a clean geocoding query from scraped address:
      // Use main street/avenue name only (first comma-segment, strip lot/apt codes)
      const toGeoQuery = (endereco: string, mun: string, ufStr: string): string => {
        // Take only first segment (before first comma or em-dash)
        const firstSeg = endereco.split(/[,;]|[-–](?=\s)/)[0].trim();
        // Remove lot / apartment / block suffixes: Lote, APM, QI, nº, s/n, etc.
        const road = firstSeg
          .replace(/\b(Lote|Lts?|APM|QI|Apto?|nº|n\.|s\/n|sn|Bloco|Bl\.?|Lt\.?)\s*[\d\w]*/gi, "")
          .replace(/\s+/g, " ").trim();
        return `${road} ${mun}`;
      };

      for (let ui = 0; ui < units.length; ui++) {
        const u = units[ui];
        try {
          // Wait 1.1 s between requests (Nominatim usage policy)
          if (ui > 0) await new Promise(r => setTimeout(r, 1100));
          const geoQ = encodeURIComponent(toGeoQuery(u.endereco, municipio, uf));
          const nmResp = await fetch(`${nominatimBase}?q=${geoQ}&format=json&limit=1&addressdetails=1&countrycodes=br`, {
            signal: AbortSignal.timeout(6000),
            headers: { "User-Agent": nominatimUA, "Accept-Language": "pt-BR,pt;q=0.9" },
          });
          if (!nmResp.ok) continue;
          const nmData: any[] = await nmResp.json();
          if (!nmData.length) continue;
          const hit = nmData[0];
          const addr = hit.address || {};
          // Build clean address from structured Nominatim components
          const road = addr.road || addr.pedestrian || addr.footway || addr.path || addr.street || "";
          const num = addr.house_number && addr.house_number !== "sn" ? `nº ${addr.house_number}` : "";
          const bairro = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || "";
          const cep = addr.postcode ? `CEP ${addr.postcode}` : "";
          const parts_addr = [road, num, bairro, cep].map(s => s.trim()).filter(Boolean);
          if (parts_addr.length >= 2 && road) {
            // Keep original scraped address but annotate with coords + CEP
            u.cep = addr.postcode || null;
            u.endereco_verificado = true;
            u.lat = parseFloat(hit.lat);
            u.lon = parseFloat(hit.lon);
            u.mapsUrl = `https://www.google.com/maps?q=${hit.lat},${hit.lon}`;
            // Append CEP to original address if not already present
            if (addr.postcode && !u.endereco.includes(addr.postcode)) {
              u.endereco = `${u.endereco} — CEP ${addr.postcode}`;
            }
          }
        } catch {
          // Nominatim timeout or error — keep original address
        }
      }

      const result = { ok: true, municipio, uf, tipo: tipoSlug.toUpperCase(), units, source: pageUrl };
      crasCacheStore[cacheKey] = { data: result, at: Date.now() };
      return res.json(result);
    } catch (e: any) {
      return res.json({ ok: false, municipio, uf, tipo: tipoSlug.toUpperCase(), units: [], error: e.message });
    }
  });

  return httpServer;
}
