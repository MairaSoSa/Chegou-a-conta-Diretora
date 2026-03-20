import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import crypto from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import express from "express";
import Papa from "papaparse";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { storage } from "./storage";
import { sqlite } from "./db";
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
} from "./scraper/pdde";
import { searchDOU, searchDOUForNorma } from "./scraper/dou";
import {
  searchSchoolsLocal, getEscolaCompletaLocal, getEscolaEvolucaoLocal,
  importFromExternalApi, getImportStatus, getLocalSchoolCount, getLocalStats,
  listCensoEscolar, getCensoEscolarDetail, getCensoEstatisticas,
  listIndicador, getIndicadorDetail, getEscolaCompleta, getApiInfo,
  getMediasNacionais, invalidateStatsCache,
} from "./importador";
import {
  searchEscolasRailway, getEscolaEvolucaoRailway,
  getEscolaCompletaRailway, getEscolaBasicaRailway,
  getComparativoRailway, getDiagnosticoRailway,
} from "./railway-client";
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

const MUNICIPIO_CENTROIDES: Record<number, [number, number]> = JSON.parse(
  readFileSync(join(process.cwd(), "server", "municipio-centroides.json"), "utf-8")
);

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

  // === PUBLIC: ESCOLA COMPLETA (Railway primeiro, local como fallback) ===
  app.get("/api/escola-completa/:inep", async (req, res) => {
    const inep = getParam(req.params, "inep");
    const ano = parseInt(req.query.ano as string) || new Date().getFullYear();
    const railwayData = await getEscolaCompletaRailway(inep, ano);
    if (railwayData) return res.json(railwayData);
    const localData = getEscolaCompletaLocal(inep, ano);
    if (localData) return res.json(localData);
    res.json({ co_entidade: parseInt(inep), anos_disponiveis: [], ano_selecionado: ano });
  });

  // === PUBLIC: ESCOLA EVOLUÇÃO (Railway primeiro, local como fallback) ===
  app.get("/api/escola-evolucao/:inep", async (req, res) => {
    const inep = getParam(req.params, "inep");
    const [railwayData, localData] = await Promise.all([
      getEscolaEvolucaoRailway(inep),
      Promise.resolve(getEscolaEvolucaoLocal(inep)),
    ]);

    if (!railwayData && !localData) {
      return res.json({ co_entidade: parseInt(inep), anos_disponiveis: [], escola: null, censo_por_ano: {}, indicadores_por_ano: {} });
    }
    if (!railwayData) return res.json(localData);
    if (!localData)   return res.json(railwayData);

    // Mescla: local tem dados quantitativos do censo (qt_mat_bas, docentes, turmas, infra)
    // para todos os anos; Railway tem metadados e indicadores (IDEB, SAEB).
    // Estratégia: local como base de cada ano, Railway sobrescreve os campos que tem.
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
      // Garante que campos quantitativos locais não sejam apagados pelo Railway
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

    // Mescla indicadores: local como base, Railway adiciona/sobrescreve
    const localInd = localData.indicadores_por_ano as Record<number, any>;
    const mergedInd: Record<number, any> = {};
    const allAnosInd = new Set<number>([
      ...Object.keys(railwayData.indicadores_por_ano).map(Number),
      ...Object.keys(localInd).map(Number),
    ]);
    for (const ano of allAnosInd) {
      const loc  = localInd[ano]  ?? {};
      const rail = (railwayData.indicadores_por_ano as Record<number, any>)[ano] ?? {};
      mergedInd[ano] = { ...loc, ...rail };
    }

    const anosSet = new Set<number>([
      ...Object.keys(mergedCenso).map(Number),
      ...Object.keys(mergedInd).map(Number),
    ]);

    return res.json({
      ...railwayData,
      anos_disponiveis: [...anosSet].sort((a, b) => a - b),
      censo_por_ano:       mergedCenso,
      indicadores_por_ano: mergedInd,
    });
  });

  // === PUBLIC: COMPARATIVO (escola vs município, UF e Brasil) ===
  // Usa Railway com cache persistente no banco (survives server restarts)
  app.get("/api/escola-comparativo/:inep", async (req, res) => {
    const inep = getParam(req.params, "inep");
    const CACHE_KEY = `comparativo_${inep}`;
    const CACHE_TTL_DAYS = 7;

    // 1. Checar cache persistente no banco
    const cached = sqlite.prepare(
      `SELECT data, updated_at FROM stats_cache WHERE cache_key=? LIMIT 1`
    ).get(CACHE_KEY) as any;

    if (cached) {
      const ageMs = Date.now() - cached.updated_at;
      if (ageMs < CACHE_TTL_DAYS * 24 * 60 * 60 * 1000) {
        return res.json(JSON.parse(cached.data));
      }
    }

    // 2. Cache miss — buscar no Railway
    const data = await getComparativoRailway(inep);
    if (!data) return res.json(null);

    // 3. Salvar no cache persistente
    sqlite.prepare(
      `INSERT INTO stats_cache (cache_key, data, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(cache_key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`
    ).run(CACHE_KEY, JSON.stringify(data), Date.now());

    res.json(data);
  });

  // === PUBLIC: MICRORREGIÃO — média IDEB local a partir do banco SQLite ===
  const microlookup: Record<string, [number, string]> = JSON.parse(
    readFileSync(join(process.cwd(), "server/municipio-microregiao.json"), "utf8")
  );

  app.get("/api/escola-microregiao/:inep", (req, res) => {
    const inep = getParam(req.params, "inep");

    // 1. Buscar co_municipio via tabela auxiliar indexada (muito rápido)
    const munRow = sqlite.prepare(
      `SELECT co_municipio FROM escola_municipio WHERE inep=? LIMIT 1`
    ).get(inep) as any;
    if (!munRow) return res.json(null);
    const co_municipio = String(munRow.co_municipio);

    // 2. Descobrir microrregião a partir do lookup em memória
    const entry = microlookup[co_municipio];
    if (!entry) return res.json(null);
    const [micro_cod, micro_nome] = entry;

    // 3. Checar cache por microrregião (resultado é o mesmo para toda escola da região)
    const CACHE_KEY = `micro_${micro_cod}`;
    const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 dias
    const cached = sqlite.prepare(
      `SELECT data, updated_at FROM stats_cache WHERE cache_key=? LIMIT 1`
    ).get(CACHE_KEY) as any;
    if (cached && (Date.now() - cached.updated_at) < CACHE_TTL_MS) {
      return res.json(JSON.parse(cached.data));
    }

    // 4. Cache miss — calcular médias via tabela escola_municipio + indicadores
    const municsMicro = Object.entries(microlookup)
      .filter(([, v]) => v[0] === micro_cod)
      .map(([k]) => k);
    if (municsMicro.length === 0) return res.json(null);

    // Buscar ineps da microrregião pela tabela indexada (rápido)
    const ph = municsMicro.map(() => '?').join(',');
    const inepsRegiao = sqlite.prepare(
      `SELECT inep FROM escola_municipio WHERE co_municipio IN (${ph})`
    ).all(...municsMicro) as { inep: string }[];

    if (inepsRegiao.length === 0) return res.json(null);

    // Buscar IDEB em lotes de 900 para respeitar limite SQLite
    const allIneps = inepsRegiao.map(r => r.inep);
    const sums: Record<string, number> = { ai: 0, af: 0, em: 0 };
    const cnts: Record<string, number> = { ai: 0, af: 0, em: 0 };
    const BATCH = 900;
    for (let i = 0; i < allIneps.length; i += BATCH) {
      const batch = allIneps.slice(i, i + BATCH);
      const ph2 = batch.map(() => '?').join(',');
      const rows = sqlite.prepare(
        `SELECT dados FROM indicadores_educacionais WHERE tipo='ideb' AND inep IN (${ph2})`
      ).all(...batch) as { dados: string }[];
      for (const row of rows) {
        const d = JSON.parse(row.dados);
        for (const etapa of ['ai','af','em'] as const) {
          const v = d[`ideb_${etapa}`];
          if (v != null && v > 0) { sums[etapa] += v; cnts[etapa]++; }
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

    // 5. Salvar no cache
    sqlite.prepare(
      `INSERT INTO stats_cache(cache_key, data, updated_at)
       VALUES(?,?,?)
       ON CONFLICT(cache_key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`
    ).run(CACHE_KEY, JSON.stringify(resultado), Date.now());

    res.json(resultado);
  });

  // === PUBLIC: DIAGNÓSTICO (pontos fortes, pontos de atenção, leituras) ===
  app.get("/api/escola-diagnostico/:inep", async (req, res) => {
    const inep = getParam(req.params, "inep");
    const CACHE_KEY = `diagnostico_${inep}`;
    const CACHE_TTL_DAYS = 7;

    const cached = sqlite.prepare(
      `SELECT data, updated_at FROM stats_cache WHERE cache_key=? LIMIT 1`
    ).get(CACHE_KEY) as any;

    if (cached && (Date.now() - cached.updated_at) < CACHE_TTL_DAYS * 86400000) {
      return res.json(JSON.parse(cached.data));
    }

    const data = await getDiagnosticoRailway(inep);
    if (!data) return res.json(null);

    sqlite.prepare(
      `INSERT INTO stats_cache (cache_key, data, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(cache_key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`
    ).run(CACHE_KEY, JSON.stringify(data), Date.now());

    res.json(data);
  });

  app.get("/api/medias-nacionais", (req, res) => {
    const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;
    res.json(getMediasNacionais(ano));
  });

  // === PUBLIC: API INFO (mirrors api-escolas root) ===
  app.get("/api/info", (_req, res) => {
    res.json(getApiInfo());
  });

  // === PUBLIC: ESCOLA BUSCAR (local DB — busca rápida, dados do Railway no painel) ===
  app.get("/api/escola/buscar", async (req, res) => {
    const nome = req.query.nome as string;
    const perPage = parseInt(req.query.per_page as string) || 20;
    if (!nome || nome.length < 2) return res.json({ dados: [], total: 0 });

    const localResults = searchSchoolsLocal(nome, perPage);
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
    const localData = getEscolaCompleta(inep);
    if (localData) return res.json(localData);
    res.status(404).json({ erro: "Escola não encontrada." });
  });

  // === PUBLIC: CENSO ESCOLAR ROUTES ===
  app.get("/api/censo-escolar/:ano/escolas/estatisticas", (req, res) => {
    const ano = parseInt(req.params.ano);
    const local = getCensoEstatisticas(ano);

    // Se o banco local tem muito poucos dados (ambiente sem carga completa),
    // retorna os dados oficiais do Censo Escolar INEP/MEC como fallback.
    const OFICIAL: Record<number, any> = {
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
  app.get("/api/escola/:inep/similares", (req, res) => {
    const inep = req.params.inep;
    const ano = parseInt(req.query.ano as string) || 2024;
    try {
      // 1ª query: escola base com modalidades + municipio (json_extract em 1 linha — rápido)
      const escola = sqlite.prepare(`
        SELECT inep, uf, dependencia, localizacao,
          CAST(matriculas as INTEGER) as matriculas,
          CAST(COALESCE(json_extract(dados, '$.co_municipio'), 0) as INTEGER) as co_municipio,
          CAST(COALESCE(json_extract(dados, '$.qt_mat_inf'),  0) as INTEGER) as qt_mat_inf,
          CAST(COALESCE(json_extract(dados, '$.qt_mat_fund'), 0) as INTEGER) as qt_mat_fund,
          CAST(COALESCE(json_extract(dados, '$.qt_mat_med'),  0) as INTEGER) as qt_mat_med,
          CAST(COALESCE(json_extract(dados, '$.qt_mat_eja'),  0) as INTEGER) as qt_mat_eja,
          CAST(COALESCE(json_extract(dados, '$.qt_mat_prof'), 0) as INTEGER) as qt_mat_prof
        FROM censo_escolar WHERE inep=? AND ano=? LIMIT 1
      `).get(inep, ano) as any;
      if (!escola) return res.status(404).json({ erro: "Escola não encontrada" });

      const minMat = Math.floor((escola.matriculas || 50) * 0.70);
      const maxMat = Math.ceil((escola.matriculas || 50) * 1.30);
      const targetMat = escola.matriculas || 50;

      // Fingerprint de modalidade da escola base (ex: "EF+EM" ou "EI" ou "EF+EJA")
      const toFingerprint = (r: any) => [
        r.qt_mat_inf  > 0 ? "EI"  : null,
        r.qt_mat_fund > 0 ? "EF"  : null,
        r.qt_mat_med  > 0 ? "EM"  : null,
        r.qt_mat_eja  > 0 ? "EJA" : null,
        r.qt_mat_prof > 0 ? "EP"  : null,
      ].filter(Boolean).sort().join("+") || "EF";
      const fingerprintBase = toFingerprint(escola);

      // ICG da escola base
      const icgBase = (sqlite.prepare(`
        SELECT json_extract(dados, '$.nivel') as nivel
        FROM indicadores_educacionais WHERE inep=? AND ano=? AND tipo='icg' LIMIT 1
      `).get(inep, ano) as any)?.nivel ?? null;

      const ufBase = escola.uf?.toUpperCase() || "";

      // 2ª query: leve — campos indexados, mesmo estado
      const candidatos = sqlite.prepare(`
        SELECT inep, nome, municipio, uf, dependencia, localizacao,
          CAST(matriculas as INTEGER) as matriculas
        FROM censo_escolar
        WHERE ano=? AND dependencia=? AND localizacao=? AND uf=? AND situacao='Em Atividade' AND inep!=?
      `).all(ano, escola.dependencia, escola.localizacao, ufBase, inep) as any[];

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
        const placeholders = prefIneps.map(() => "?").join(",");
        const detalhes = sqlite.prepare(`
          SELECT c.inep,
            json_extract(c.dados, '$.telefone')    as telefone,
            json_extract(c.dados, '$.ds_endereco') as ds_endereco,
            json_extract(c.dados, '$.no_bairro')   as no_bairro,
            json_extract(c.dados, '$.co_cep')      as co_cep,
            CAST(COALESCE(json_extract(c.dados, '$.co_municipio'), 0) as INTEGER) as co_municipio,
            CAST(COALESCE(json_extract(c.dados, '$.qt_mat_inf'),  0) as INTEGER) as qt_mat_inf,
            CAST(COALESCE(json_extract(c.dados, '$.qt_mat_fund'), 0) as INTEGER) as qt_mat_fund,
            CAST(COALESCE(json_extract(c.dados, '$.qt_mat_med'),  0) as INTEGER) as qt_mat_med,
            CAST(COALESCE(json_extract(c.dados, '$.qt_mat_eja'),  0) as INTEGER) as qt_mat_eja,
            CAST(COALESCE(json_extract(c.dados, '$.qt_mat_prof'), 0) as INTEGER) as qt_mat_prof,
            CAST(json_extract(ie.dados, '$.nivel') as INTEGER) as icg_nivel
          FROM censo_escolar c
          LEFT JOIN indicadores_educacionais ie
            ON ie.inep = c.inep AND ie.ano = ? AND ie.tipo = 'icg'
          WHERE c.ano=? AND c.inep IN (${placeholders})
        `).all(ano, ano, ...prefIneps) as any[];

        const detalheMap: Record<string, any> = {};
        for (const d of detalhes) detalheMap[d.inep] = d;

        // Filtro por modalidade (fingerprint exato) + ICG + merge + ordenação por distância
        similares = prefiltrados
          .map(s => ({ ...s, ...(detalheMap[s.inep] || {}) }))
          .filter(s => {
            if (toFingerprint(s) !== fingerprintBase) return false;
            if (icgBase !== null && s.icg_nivel !== null && s.icg_nivel !== icgBase) return false;
            return true;
          })
          .sort((a, b) => {
            const da = haversineKm(coMunBase, a.co_municipio || 0);
            const db = haversineKm(coMunBase, b.co_municipio || 0);
            if (Math.abs(da - db) > 5) return da - db;
            return Math.abs((a.matriculas||0) - targetMat) - Math.abs((b.matriculas||0) - targetMat);
          })
          .slice(0, 200);
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
        escolas: similares.map(s => ({
          inep: s.inep,
          nome: s.nome,
          municipio: s.municipio,
          uf: s.uf?.toUpperCase(),
          dependencia: s.dependencia,
          localizacao: s.localizacao,
          matriculas: s.matriculas,
          distancia_km: coMunBase && s.co_municipio ? Math.round(haversineKm(coMunBase, s.co_municipio)) : null,
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
  app.get("/api/censo-escolar/:ano/uf/:uf/stats", (req, res) => {
    const ano = parseInt(req.params.ano);
    const uf = (req.params.uf || "").toUpperCase();
    try {
      const total = sqlite.prepare(
        `SELECT COUNT(*) as escolas, SUM(CAST(matriculas as INTEGER)) as matriculas
         FROM censo_escolar WHERE ano=? AND upper(uf)=?`
      ).get(ano, uf) as any;
      const porDep = sqlite.prepare(
        `SELECT dependencia, COUNT(*) as n FROM censo_escolar WHERE ano=? AND upper(uf)=? GROUP BY dependencia`
      ).all(ano, uf) as any[];
      const porLoc = sqlite.prepare(
        `SELECT localizacao, COUNT(*) as n FROM censo_escolar WHERE ano=? AND upper(uf)=? GROUP BY localizacao`
      ).all(ano, uf) as any[];
      const topMun = sqlite.prepare(
        `SELECT municipio, COUNT(*) as escolas, SUM(CAST(matriculas as INTEGER)) as matriculas
         FROM censo_escolar WHERE ano=? AND upper(uf)=? AND situacao='Em Atividade'
         GROUP BY municipio ORDER BY escolas DESC LIMIT 8`
      ).all(ano, uf) as any[];
      res.json({
        uf,
        ano,
        total_escolas: total?.escolas || 0,
        total_matriculas: total?.matriculas || 0,
        por_dependencia: Object.fromEntries(porDep.map((r: any) => [r.dependencia || "Outro", r.n])),
        por_localizacao: Object.fromEntries(porLoc.map((r: any) => [r.localizacao || "Outro", r.n])),
        top_municipios: topMun.map((r: any) => ({ municipio: r.municipio, escolas: r.escolas, matriculas: r.matriculas || 0 })),
      });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
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
  app.get("/api/pdde/execfin/:coEscola", async (req, res) => {
    try {
      const coEscola = req.params.coEscola.replace(/[^\d]/g, "");
      if (!/^\d{8}$/.test(coEscola)) {
        return res.status(400).json({ ok: false, repasses: [], anosDisponiveis: [], fonte: "indisponivel", error: "Código INEP inválido (deve ter 8 dígitos)" });
      }
      const result = await consultarExecFinPdde(coEscola);
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
      const result = await consultarSaldosPdde(coEscola);
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

  return httpServer;
}
