import { db } from "./db";
import { indicadoresEducacionais, importacaoStatus } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const XLSX_IMPORT = async () => (await import("xlsx")).default;

const INEP_BASE = "https://download.inep.gov.br/informacoes_estatisticas/indicadores_educacionais";

interface IndicatorDef {
  tipo: string;
  zipUrl: (ano: number) => string;
  xlsxPattern: RegExp;
  extractData: (headers: string[], values: any[]) => Record<string, any> | null;
}

const INDICATORS: IndicatorDef[] = [
  {
    tipo: "tdi",
    zipUrl: (ano) => `${INEP_BASE}/${ano}/TDI_${ano}_ESCOLAS.zip`,
    xlsxPattern: /TDI.*ESCOLAS.*\.xlsx$/i,
    extractData: (headers, values) => {
      const get = (col: string) => {
        const idx = headers.indexOf(col);
        if (idx < 0) return undefined;
        const v = values[idx];
        return v === "--" || v === "" || v === null || v === undefined ? null : Number(v);
      };
      return {
        fundamental_total: get("FUN_CAT_0"),
        fundamental_ai: get("FUN_AI_CAT_0"),
        fundamental_af: get("FUN_AF_CAT_0"),
        fund_1ano: get("FUN_01_CAT_0"),
        fund_2ano: get("FUN_02_CAT_0"),
        fund_3ano: get("FUN_03_CAT_0"),
        fund_4ano: get("FUN_04_CAT_0"),
        fund_5ano: get("FUN_05_CAT_0"),
        fund_6ano: get("FUN_06_CAT_0"),
        fund_7ano: get("FUN_07_CAT_0"),
        fund_8ano: get("FUN_08_CAT_0"),
        fund_9ano: get("FUN_09_CAT_0"),
        medio_total: get("MED_CAT_0"),
        medio_1serie: get("MED_01_CAT_0"),
        medio_2serie: get("MED_02_CAT_0"),
        medio_3serie: get("MED_03_CAT_0"),
        medio_4serie: get("MED_04_CAT_0"),
      };
    },
  },
  {
    tipo: "icg",
    zipUrl: (ano) => `${INEP_BASE}/${ano}/ICG_${ano}_ESCOLAS.zip`,
    xlsxPattern: /ICG.*ESCOLAS.*\.xlsx$/i,
    extractData: (headers, values) => {
      const idx = headers.indexOf("COMPLEX");
      if (idx < 0) return null;
      const nivel = values[idx];
      if (!nivel || nivel === "--") return null;
      const nivelNum = typeof nivel === "string" ? parseInt(nivel.replace(/[^0-9]/g, "")) : nivel;
      return {
        nivel: nivelNum,
        nivel_texto: String(nivel),
      };
    },
  },
  {
    tipo: "ird",
    zipUrl: (ano) => `${INEP_BASE}/${ano}/IRD_${ano}_ESCOLAS.zip`,
    xlsxPattern: /IRD.*ESCOLAS.*\.xlsx$/i,
    extractData: (headers, values) => {
      const idx = headers.indexOf("EDU_BAS_CAT_0");
      if (idx < 0) return null;
      const v = values[idx];
      if (v === "--" || v === "" || v === null || v === undefined) return null;
      return {
        media_ird: Number(v),
      };
    },
  },
  {
    tipo: "taxas_rendimento",
    zipUrl: (ano) => `${INEP_BASE}/${ano}/tx_rend_escolas_${ano}.zip`,
    xlsxPattern: /tx_rend.*escolas.*\.xlsx$/i,
    extractData: (headers, values) => {
      const get = (col: string) => {
        const idx = headers.indexOf(col);
        if (idx < 0) return undefined;
        const v = values[idx];
        return v === "--" || v === "" || v === null || v === undefined ? null : Number(v);
      };
      return {
        aprovacao_fund: get("1_CAT_FUN"),
        aprovacao_fund_ai: get("1_CAT_FUN_AI"),
        aprovacao_fund_af: get("1_CAT_FUN_AF"),
        aprovacao_med: get("1_CAT_MED"),
        reprovacao_fund: get("2_CAT_FUN"),
        reprovacao_fund_ai: get("2_CAT_FUN_AI"),
        reprovacao_fund_af: get("2_CAT_FUN_AF"),
        reprovacao_med: get("2_CAT_MED"),
        abandono_fund: get("3_CAT_FUN"),
        abandono_fund_ai: get("3_CAT_FUN_AI"),
        abandono_fund_af: get("3_CAT_FUN_AF"),
        abandono_med: get("3_CAT_MED"),
      };
    },
  },
  {
    tipo: "atu",
    zipUrl: (ano) => `${INEP_BASE}/${ano}/ATU_${ano}_ESCOLAS.zip`,
    xlsxPattern: /ATU.*ESCOLAS.*\.xlsx$/i,
    extractData: (headers, values) => {
      const get = (col: string) => {
        const idx = headers.indexOf(col);
        if (idx < 0) return undefined;
        const v = values[idx];
        return v === "--" || v === "" || v === null || v === undefined ? null : Number(v);
      };
      return {
        media_fund: get("FUN_CAT_0"),
        media_fund_ai: get("FUN_AI_CAT_0"),
        media_fund_af: get("FUN_AF_CAT_0"),
        media_med: get("MED_CAT_0"),
      };
    },
  },
  {
    tipo: "had",
    zipUrl: (ano) => `${INEP_BASE}/${ano}/HAD_${ano}_ESCOLAS.zip`,
    xlsxPattern: /HAD.*ESCOLAS.*\.xlsx$/i,
    extractData: (headers, values) => {
      const get = (col: string) => {
        const idx = headers.indexOf(col);
        if (idx < 0) return undefined;
        const v = values[idx];
        return v === "--" || v === "" || v === null || v === undefined ? null : Number(v);
      };
      return {
        media_fund: get("FUN_CAT_0"),
        media_fund_ai: get("FUN_AI_CAT_0"),
        media_fund_af: get("FUN_AF_CAT_0"),
        media_med: get("MED_CAT_0"),
      };
    },
  },
  {
    tipo: "dsu",
    zipUrl: (ano) => `${INEP_BASE}/${ano}/DSU_${ano}_ESCOLAS.zip`,
    xlsxPattern: /DSU.*ESCOLAS.*\.xlsx$/i,
    extractData: (headers, values) => {
      const get = (col: string) => {
        const idx = headers.indexOf(col);
        if (idx < 0) return undefined;
        const v = values[idx];
        return v === "--" || v === "" || v === null || v === undefined ? null : Number(v);
      };
      return {
        percentual_fund: get("FUN_CAT_0"),
        percentual_fund_ai: get("FUN_AI_CAT_0"),
        percentual_fund_af: get("FUN_AF_CAT_0"),
        percentual_med: get("MED_CAT_0"),
      };
    },
  },
  {
    tipo: "afd",
    zipUrl: (ano) => `${INEP_BASE}/${ano}/AFD_${ano}_ESCOLAS.zip`,
    xlsxPattern: /AFD.*ESCOLAS.*\.xlsx$/i,
    extractData: (headers, values) => {
      const get = (col: string) => {
        const idx = headers.indexOf(col);
        if (idx < 0) return undefined;
        const v = values[idx];
        return v === "--" || v === "" || v === null || v === undefined ? null : Number(v);
      };
      const data: Record<string, any> = {};
      for (const h of headers) {
        if (h.startsWith("FUN_") || h.startsWith("MED_") || h.startsWith("EF_") || h.startsWith("EM_")) {
          const v = get(h);
          if (v !== undefined) data[h.toLowerCase()] = v;
        }
      }
      return Object.keys(data).length > 0 ? data : null;
    },
  },
];

const TMP_DIR = "/tmp/inep_indicators";

function updateStatus(tipo: string, ano: number, status: string, imported: number, total: number, erro?: string | null) {
  const existing = db.select().from(importacaoStatus)
    .where(and(eq(importacaoStatus.tipo, tipo), eq(importacaoStatus.ano, ano)))
    .get();
  const record = {
    tipo, ano, status,
    registrosImportados: imported,
    totalRegistros: total,
    erro: erro || null,
    iniciadoEm: existing?.iniciadoEm || Date.now(),
    finalizadoEm: status === "completo" || status === "erro" ? Date.now() : null,
  };
  if (existing) {
    db.update(importacaoStatus).set(record).where(eq(importacaoStatus.id, existing.id)).run();
  } else {
    db.insert(importacaoStatus).values(record).run();
  }
}

async function downloadAndExtract(url: string, tipo: string, ano: number): Promise<string | null> {
  const dir = path.join(TMP_DIR, `${tipo}_${ano}`);
  fs.mkdirSync(dir, { recursive: true });
  const zipPath = path.join(dir, "data.zip");

  console.log(`[INEP] Downloading ${url}...`);
  try {
    execSync(`curl -sL --max-time 180 -o "${zipPath}" "${url}"`, { timeout: 200000 });
    if (!fs.existsSync(zipPath) || fs.statSync(zipPath).size < 1000) {
      console.log(`[INEP] Download failed or file too small for ${tipo} ${ano}`);
      return null;
    }
    execSync(`unzip -o "${zipPath}" -d "${dir}"`, { timeout: 60000 });
    return dir;
  } catch (err: any) {
    console.error(`[INEP] Download/extract error for ${tipo} ${ano}:`, err.message);
    return null;
  }
}

function findXlsx(dir: string, pattern: RegExp): string | null {
  const findFiles = (d: string): string[] => {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    const files: string[] = [];
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) files.push(...findFiles(full));
      else if (e.isFile() && pattern.test(e.name)) files.push(full);
    }
    return files;
  };
  const matches = findFiles(dir);
  return matches.length > 0 ? matches[0] : null;
}

async function importIndicatorFile(def: IndicatorDef, ano: number): Promise<{ imported: number; error?: string }> {
  const url = def.zipUrl(ano);
  console.log(`[INEP] Starting import of ${def.tipo} ${ano}`);
  updateStatus(def.tipo, ano, "baixando", 0, 0);

  const dir = await downloadAndExtract(url, def.tipo, ano);
  if (!dir) {
    updateStatus(def.tipo, ano, "erro", 0, 0, "Falha no download");
    return { imported: 0, error: "Download failed" };
  }

  const xlsxPath = findXlsx(dir, def.xlsxPattern);
  if (!xlsxPath) {
    updateStatus(def.tipo, ano, "erro", 0, 0, "XLSX não encontrado no ZIP");
    return { imported: 0, error: "XLSX not found" };
  }

  console.log(`[INEP] Reading ${xlsxPath}...`);
  updateStatus(def.tipo, ano, "processando", 0, 0);

  const XLSX = await XLSX_IMPORT();
  const wb = XLSX.readFile(xlsxPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const allData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let headerRowIdx = -1;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(allData.length, 20); i++) {
    const row = allData[i];
    if (Array.isArray(row) && row.includes("CO_ENTIDADE")) {
      headerRowIdx = i;
      headers = row.map((h: any) => String(h || "").trim());
      break;
    }
  }

  if (headerRowIdx < 0) {
    updateStatus(def.tipo, ano, "erro", 0, 0, "Cabeçalho CO_ENTIDADE não encontrado");
    return { imported: 0, error: "Header row not found" };
  }

  const coEntidadeIdx = headers.indexOf("CO_ENTIDADE");
  console.log(`[INEP] Headers found at row ${headerRowIdx}, CO_ENTIDADE at col ${coEntidadeIdx}`);
  console.log(`[INEP] Total rows: ${allData.length - headerRowIdx - 1}`);

  db.run(sql`DELETE FROM indicadores_educacionais WHERE tipo = ${def.tipo} AND ano = ${ano}`);

  let imported = 0;
  let batchValues: any[] = [];
  const BATCH_SIZE = 1000;

  const flushBatch = () => {
    if (batchValues.length === 0) return;
    db.transaction((tx) => {
      for (const rec of batchValues) {
        tx.insert(indicadoresEducacionais).values(rec).run();
      }
    });
    batchValues = [];
  };

  for (let i = headerRowIdx + 1; i < allData.length; i++) {
    const row = allData[i];
    if (!row || !row[coEntidadeIdx]) continue;

    const inep = String(row[coEntidadeIdx]);
    if (!inep || inep.length < 6) continue;

    const extracted = def.extractData(headers, row);
    if (!extracted) continue;

    const hasData = Object.values(extracted).some(v => v !== null && v !== undefined);
    if (!hasData) continue;

    batchValues.push({
      inep,
      ano,
      tipo: def.tipo,
      dados: JSON.stringify({
        co_entidade: parseInt(inep),
        ...extracted,
      }),
      updatedAt: Date.now(),
    });

    if (batchValues.length >= BATCH_SIZE) {
      flushBatch();
      imported += BATCH_SIZE;
      if (imported % 10000 === 0) {
        console.log(`[INEP] ${def.tipo} ${ano}: imported ${imported} records`);
        updateStatus(def.tipo, ano, "importando", imported, allData.length - headerRowIdx - 1);
      }
    }
  }

  flushBatch();
  imported += batchValues.length;

  const totalCount = db.select({ count: sql<number>`count(*)` }).from(indicadoresEducacionais)
    .where(and(eq(indicadoresEducacionais.tipo, def.tipo), eq(indicadoresEducacionais.ano, ano)))
    .get()?.count || 0;

  console.log(`[INEP] ${def.tipo} ${ano}: completed with ${totalCount} records`);
  updateStatus(def.tipo, ano, "completo", totalCount, totalCount);

  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {}

  return { imported: totalCount };
}

let indicatorImportRunning = false;

export async function importAllIndicators(tipos?: string[], anos?: number[]) {
  if (indicatorImportRunning) return { error: "Importação de indicadores já em andamento" };
  indicatorImportRunning = true;

  fs.mkdirSync(TMP_DIR, { recursive: true });

  const results: Record<string, any> = {};
  const errors: string[] = [];
  const anosToImport = anos || [2024];

  try {
    for (const def of INDICATORS) {
      if (tipos && !tipos.includes(def.tipo)) continue;

      for (const ano of anosToImport) {
        try {
          const result = await importIndicatorFile(def, ano);
          results[`${def.tipo}_${ano}`] = result;
          if (result.error) errors.push(`${def.tipo} ${ano}: ${result.error}`);
        } catch (err: any) {
          console.error(`[INEP] Error importing ${def.tipo} ${ano}:`, err.message);
          errors.push(`${def.tipo} ${ano}: ${err.message}`);
          updateStatus(def.tipo, ano, "erro", 0, 0, err.message);
        }
      }
    }
  } finally {
    indicatorImportRunning = false;
  }

  return { success: true, results, errors };
}

export function getIndicatorImportRunning() {
  return indicatorImportRunning;
}

export function getAvailableIndicators() {
  return INDICATORS.map(d => d.tipo);
}
