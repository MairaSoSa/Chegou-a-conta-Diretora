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
      const get = (...cols: string[]) => {
        for (const col of cols) {
          const idx = headers.indexOf(col);
          if (idx >= 0) {
            const v = values[idx];
            return v === "--" || v === "" || v === null || v === undefined ? null : Number(v);
          }
        }
        return undefined;
      };
      return {
        aprovacao_fund: get("1_CAT_FUN", "tap_FUN"),
        aprovacao_fund_ai: get("1_CAT_FUN_AI", "tap_F14"),
        aprovacao_fund_af: get("1_CAT_FUN_AF", "tap_F58"),
        aprovacao_med: get("1_CAT_MED", "tap_MED"),
        reprovacao_fund: get("2_CAT_FUN", "tre_FUN"),
        reprovacao_fund_ai: get("2_CAT_FUN_AI", "tre_F14"),
        reprovacao_fund_af: get("2_CAT_FUN_AF", "tre_F58"),
        reprovacao_med: get("2_CAT_MED", "tre_MED"),
        abandono_fund: get("3_CAT_FUN", "tab_FUN"),
        abandono_fund_ai: get("3_CAT_FUN_AI", "tab_F14"),
        abandono_fund_af: get("3_CAT_FUN_AF", "tab_F58"),
        abandono_med: get("3_CAT_MED", "tab_MED"),
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
      const data: Record<string, any> = {};
      // Captura todos os prefixos relevantes: INF (Infantil), FUN (Fundamental), MED (Médio)
      for (const h of headers) {
        if (h.startsWith("INF_") || h.startsWith("FUN_") || h.startsWith("MED_")) {
          const v = get(h);
          if (v !== undefined) data[h.toLowerCase()] = v;
        }
      }
      // Aliases legados para compatibilidade com dados já importados
      if (!data.media_fund    && data.fun_cat_0    != null) data.media_fund    = data.fun_cat_0;
      if (!data.media_fund_ai && data.fun_ai_cat_0 != null) data.media_fund_ai = data.fun_ai_cat_0;
      if (!data.media_fund_af && data.fun_af_cat_0 != null) data.media_fund_af = data.fun_af_cat_0;
      if (!data.media_med     && data.med_cat_0    != null) data.media_med     = data.med_cat_0;
      return Object.keys(data).length > 0 ? data : null;
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
      const data: Record<string, any> = {};
      // Captura todos os prefixos relevantes: INF (Infantil), FUN (Fundamental), MED (Médio)
      for (const h of headers) {
        if (h.startsWith("INF_") || h.startsWith("FUN_") || h.startsWith("MED_")) {
          const v = get(h);
          if (v !== undefined) data[h.toLowerCase()] = v;
        }
      }
      // Aliases legados para compatibilidade com dados já importados
      if (!data.media_fund && data.fun_cat_0 != null)    data.media_fund    = data.fun_cat_0;
      if (!data.media_fund_ai && data.fun_ai_cat_0 != null) data.media_fund_ai = data.fun_ai_cat_0;
      if (!data.media_fund_af && data.fun_af_cat_0 != null) data.media_fund_af = data.fun_af_cat_0;
      if (!data.media_med && data.med_cat_0 != null)     data.media_med     = data.med_cat_0;
      return Object.keys(data).length > 0 ? data : null;
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
  {
    tipo: "ied",
    zipUrl: (ano) => `${INEP_BASE}/${ano}/IED_${ano}_ESCOLAS.zip`,
    xlsxPattern: /IED.*ESCOLAS.*\.xlsx$/i,
    extractData: (headers, values) => {
      const get = (col: string) => {
        const idx = headers.indexOf(col);
        if (idx < 0) return undefined;
        const v = values[idx];
        return v === "--" || v === "" || v === null || v === undefined ? null : Number(v);
      };
      const data: Record<string, any> = {};
      for (let level = 1; level <= 6; level++) {
        const funVal = get(`FUN_CAT_${level}`);
        if (funVal !== undefined) data[`nivel_${level}`] = funVal;
        const funAiVal = get(`FUN_AI_CAT_${level}`);
        if (funAiVal !== undefined) data[`fund_ai_nivel_${level}`] = funAiVal;
        const funAfVal = get(`FUN_AF_CAT_${level}`);
        if (funAfVal !== undefined) data[`fund_af_nivel_${level}`] = funAfVal;
        const medVal = get(`MED_CAT_${level}`);
        if (medVal !== undefined) data[`med_nivel_${level}`] = medVal;
      }
      return Object.keys(data).length > 0 ? data : null;
    },
  },
  {
    tipo: "taxa_nao_resposta",
    zipUrl: (ano) => `${INEP_BASE}/${ano}/tnr_escolas_${ano}.zip`,
    xlsxPattern: /tnr.*escolas.*\.xlsx$/i,
    extractData: (headers, values) => {
      const get = (...cols: string[]) => {
        for (const col of cols) {
          const idx = headers.indexOf(col);
          if (idx >= 0) {
            const v = values[idx];
            return v === "--" || v === "" || v === null || v === undefined ? null : Number(v);
          }
        }
        return undefined;
      };
      return {
        taxa_nao_resposta_fund: get("4_CAT_FUN", "TNR_FUN", "tnr_FUN"),
        taxa_nao_resposta_fund_ai: get("4_CAT_FUN_AI", "TNR_FUN_AI", "tnr_F14"),
        taxa_nao_resposta_fund_af: get("4_CAT_FUN_AF", "TNR_FUN_AF", "tnr_F58"),
        taxa_nao_resposta_med: get("4_CAT_MED", "TNR_MED", "tnr_MED"),
      };
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
  try { execSync(`rm -rf "${dir}"`); } catch {}
  fs.mkdirSync(dir, { recursive: true });
  const zipPath = path.join(dir, "data.zip");

  console.log(`[INEP] Downloading ${url}...`);
  try {
    execSync(`curl -sL --max-time 180 -o "${zipPath}" "${url}"`, { timeout: 200000 });
    if (!fs.existsSync(zipPath) || fs.statSync(zipPath).size < 1000) {
      console.log(`[INEP] Download failed or file too small for ${tipo} ${ano}`);
      return null;
    }
    execSync(`chmod -R u+w "${dir}" 2>/dev/null; unzip -o "${zipPath}" -d "${dir}"`, { timeout: 60000 });
    execSync(`chmod -R u+w "${dir}" 2>/dev/null`, { timeout: 5000 });
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
  console.log(`[INEP] Sample headers (first 30): ${headers.slice(0, 30).join(', ')}`);
  const catHeaders = headers.filter(h => h.startsWith('3_') || h.startsWith('4_') || h.startsWith('tnr') || h.startsWith('tab'));
  if (catHeaders.length > 0) console.log(`[INEP] TNR/Abandono headers: ${catHeaders.join(', ')}`);
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

const IDEB_BASE = "https://download.inep.gov.br/ideb/resultados";

interface IdebFileDef {
  etapa: string;
  zipUrl: (ano: number) => string;
  xlsxPattern: RegExp;
  prefix: string;
}

const IDEB_FILES: IdebFileDef[] = [
  {
    etapa: "ai",
    zipUrl: (ano) => `${IDEB_BASE}/divulgacao_anos_iniciais_escolas_${ano}.zip`,
    xlsxPattern: /anos_iniciais.*escolas.*\.xlsx$/i,
    prefix: "ai",
  },
  {
    etapa: "af",
    zipUrl: (ano) => `${IDEB_BASE}/divulgacao_anos_finais_escolas_${ano}.zip`,
    xlsxPattern: /anos_finais.*escolas.*\.xlsx$/i,
    prefix: "af",
  },
  {
    etapa: "em",
    zipUrl: (ano) => `${IDEB_BASE}/divulgacao_ensino_medio_escolas_${ano}.zip`,
    xlsxPattern: /ensino_medio.*escolas.*\.xlsx$/i,
    prefix: "em",
  },
];

const IDEB_YEARS = [2019, 2021, 2023];

export async function importIdeb(anos?: number[]) {
  if (indicatorImportRunning) return { error: "Importação já em andamento" };
  indicatorImportRunning = true;

  fs.mkdirSync(TMP_DIR, { recursive: true });
  const results: Record<string, any> = {};
  const errors: string[] = [];
  const latestIdebYear = 2023;

  try {
    for (const fileDef of IDEB_FILES) {
      const url = fileDef.zipUrl(latestIdebYear);
      console.log(`[INEP] Downloading IDEB ${fileDef.etapa}...`);
      updateStatus(`ideb_${fileDef.etapa}`, latestIdebYear, "baixando", 0, 0);

      const dir = await downloadAndExtract(url, `ideb_${fileDef.etapa}`, latestIdebYear);
      if (!dir) {
        errors.push(`ideb_${fileDef.etapa}: Download failed`);
        updateStatus(`ideb_${fileDef.etapa}`, latestIdebYear, "erro", 0, 0, "Falha no download");
        continue;
      }

      const xlsxPath = findXlsx(dir, fileDef.xlsxPattern);
      if (!xlsxPath) {
        const allFiles = fs.readdirSync(dir, { recursive: true }) as string[];
        const xlsxFiles = allFiles.filter(f => String(f).endsWith('.xlsx'));
        if (xlsxFiles.length > 0) {
          const firstXlsx = path.join(dir, String(xlsxFiles[0]));
          await processIdebFile(firstXlsx, fileDef, anos || IDEB_YEARS, results, errors);
        } else {
          errors.push(`ideb_${fileDef.etapa}: XLSX not found`);
          updateStatus(`ideb_${fileDef.etapa}`, latestIdebYear, "erro", 0, 0, "XLSX não encontrado");
        }
      } else {
        await processIdebFile(xlsxPath, fileDef, anos || IDEB_YEARS, results, errors);
      }

      try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    }
  } finally {
    indicatorImportRunning = false;
  }

  return { success: true, results, errors };
}

async function processIdebFile(xlsxPath: string, fileDef: IdebFileDef, anosToProcess: number[], results: Record<string, any>, errors: string[]) {
  console.log(`[INEP] Reading IDEB ${fileDef.etapa}: ${xlsxPath}`);
  const XLSX = await XLSX_IMPORT();
  const wb = XLSX.readFile(xlsxPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const allData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let headerRowIdx = -1;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(allData.length, 20); i++) {
    const row = allData[i];
    if (Array.isArray(row)) {
      const rowStrs = row.map((h: any) => String(h || "").trim());
      if (rowStrs.some(h => h.includes("CO_ENTIDADE") || h.includes("CO_ESCOLA") || h.includes("ID_ESCOLA") || h === "SG_UF")) {
        headerRowIdx = i;
        headers = rowStrs;
        break;
      }
    }
  }

  if (headerRowIdx < 0) {
    errors.push(`ideb_${fileDef.etapa}: Header row not found`);
    return;
  }

  const coEntidadeIdx = headers.findIndex(h => h === "CO_ENTIDADE" || h === "CO_ESCOLA" || h === "ID_ESCOLA");
  if (coEntidadeIdx < 0) {
    errors.push(`ideb_${fileDef.etapa}: CO_ENTIDADE/CO_ESCOLA column not found`);
    return;
  }

  console.log(`[INEP] IDEB ${fileDef.etapa} headers: ${headers.slice(0, 10).join(', ')}...`);

  for (const ano of anosToProcess) {
    const suffix = String(ano);
    const idebCol = headers.findIndex(h => h.includes("VL_OBSERVADO") && h.includes(suffix));
    const rendCol = headers.findIndex(h => h.includes("VL_INDICADOR_REND") && h.includes(suffix));
    const matCol = headers.findIndex(h => (h.includes("VL_NOTA_MATEMATICA") || h.includes("VL_NOTA_MT")) && h.includes(suffix));
    const ptCol = headers.findIndex(h => (h.includes("VL_NOTA_PORTUGUES") || h.includes("VL_NOTA_LP")) && h.includes(suffix));
    const projCol = headers.findIndex(h => h.includes("VL_PROJECAO") && h.includes(suffix));

    if (idebCol < 0) {
      console.log(`[INEP] IDEB ${fileDef.etapa} ${ano}: No VL_OBSERVADO column found`);
      continue;
    }

    console.log(`[INEP] Processing IDEB ${fileDef.etapa} ${ano}...`);
    let imported = 0;
    const batchValues: any[] = [];

    for (let i = headerRowIdx + 1; i < allData.length; i++) {
      const row = allData[i];
      if (!row || !row[coEntidadeIdx]) continue;

      const inep = String(row[coEntidadeIdx]).trim();
      if (!inep || inep.length < 6) continue;

      const getValue = (idx: number) => {
        if (idx < 0) return null;
        const v = row[idx];
        if (v === "--" || v === "" || v === null || v === undefined || v === "ND" || v === "N/D") return null;
        const num = Number(v);
        return isNaN(num) ? null : num;
      };

      const idebValue = getValue(idebCol);
      if (idebValue === null) continue;

      const data: Record<string, any> = {
        co_entidade: parseInt(inep),
        [`ideb_${fileDef.prefix}`]: idebValue,
        [`nota_mt_${fileDef.prefix}`]: getValue(matCol),
        [`nota_lp_${fileDef.prefix}`]: getValue(ptCol),
        [`rendimento_${fileDef.prefix}`]: getValue(rendCol),
        [`projecao_${fileDef.prefix}`]: getValue(projCol),
      };

      const existing = db.select().from(indicadoresEducacionais)
        .where(and(
          eq(indicadoresEducacionais.inep, inep),
          eq(indicadoresEducacionais.ano, ano),
          eq(indicadoresEducacionais.tipo, "ideb")
        ))
        .get();

      if (existing) {
        const existingData = existing.dados ? JSON.parse(existing.dados) : {};
        const mergedData = { ...existingData, ...data };
        db.update(indicadoresEducacionais)
          .set({ dados: JSON.stringify(mergedData), updatedAt: Date.now() })
          .where(eq(indicadoresEducacionais.id, existing.id))
          .run();
      } else {
        batchValues.push({
          inep, ano, tipo: "ideb",
          dados: JSON.stringify(data),
          updatedAt: Date.now(),
        });
      }

      imported++;
      if (batchValues.length >= 1000) {
        db.transaction((tx) => {
          for (const rec of batchValues) tx.insert(indicadoresEducacionais).values(rec).run();
        });
        batchValues.length = 0;
      }
    }

    if (batchValues.length > 0) {
      db.transaction((tx) => {
        for (const rec of batchValues) tx.insert(indicadoresEducacionais).values(rec).run();
      });
    }

    console.log(`[INEP] IDEB ${fileDef.etapa} ${ano}: ${imported} records`);
    updateStatus(`ideb_${fileDef.etapa}`, ano, "completo", imported, imported);
    results[`ideb_${fileDef.etapa}_${ano}`] = { imported };
  }
}

const INSE_BASE = "https://download.inep.gov.br/informacoes_estatisticas/indicadores_educacionais";

async function downloadXlsxDirect(url: string, destPath: string): Promise<boolean> {
  try {
    console.log(`[INEP] Downloading ${url}...`);
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 1000) return false;
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (e: any) {
    console.log(`[INEP] Download error: ${e.message}`);
    return false;
  }
}

export async function importInse(anos?: number[]) {
  if (indicatorImportRunning) return { error: "Importação já em andamento" };
  indicatorImportRunning = true;

  fs.mkdirSync(TMP_DIR, { recursive: true });
  const results: Record<string, any> = {};
  const errors: string[] = [];
  const anosToImport = anos || [2021, 2023];

  try {
    for (const ano of anosToImport) {
      const urls = [
        `${INSE_BASE}/${ano}/nivel_socioeconomico/INSE_${ano}_escolas.xlsx`,
        `${INSE_BASE}/${ano}/nivel_socioeconomico/INSE_${ano}_ESCOLAS.xlsx`,
        `${INSE_BASE}/${ano}/INSE_${ano}_ESCOLAS.xlsx`,
      ];

      const xlsxPath = path.join(TMP_DIR, `inse_${ano}.xlsx`);
      let downloaded = false;
      for (const url of urls) {
        downloaded = await downloadXlsxDirect(url, xlsxPath);
        if (downloaded) break;
      }

      if (!downloaded) {
        errors.push(`inse ${ano}: Download failed (all URLs tried)`);
        updateStatus("inse", ano, "erro", 0, 0, "Falha no download");
        continue;
      }

      console.log(`[INEP] Reading INSE ${ano}: ${xlsxPath}`);
      updateStatus("inse", ano, "processando", 0, 0);

      const XLSX = await XLSX_IMPORT();
      const wb = XLSX.readFile(xlsxPath);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const allData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      let headerRowIdx = -1;
      let headers: string[] = [];
      for (let i = 0; i < Math.min(allData.length, 20); i++) {
        const row = allData[i];
        if (Array.isArray(row)) {
          const rowStrs = row.map((h: any) => String(h || "").trim());
          if (rowStrs.some(h => h.includes("CO_ENTIDADE") || h.includes("CO_ESCOLA") || h.includes("ID_ESCOLA"))) {
            headerRowIdx = i;
            headers = rowStrs;
            break;
          }
        }
      }

      if (headerRowIdx < 0) {
        errors.push(`inse ${ano}: Header row not found`);
        try { fs.unlinkSync(xlsxPath); } catch {}
        continue;
      }

      const coIdx = headers.findIndex(h => h === "CO_ENTIDADE" || h === "CO_ESCOLA" || h === "ID_ESCOLA");
      const get = (row: any[], col: string) => {
        const idx = headers.indexOf(col);
        if (idx < 0) return undefined;
        const v = row[idx];
        if (v === "--" || v === "" || v === null || v === undefined) return null;
        return typeof v === "string" ? (isNaN(Number(v)) ? v : Number(v)) : v;
      };

      db.run(sql`DELETE FROM indicadores_educacionais WHERE tipo = 'inse' AND ano = ${ano}`);

      let imported = 0;
      let batchValues: any[] = [];

      for (let i = headerRowIdx + 1; i < allData.length; i++) {
        const row = allData[i];
        if (!row || !row[coIdx]) continue;
        const inep = String(row[coIdx]).trim();
        if (!inep || inep.length < 6) continue;

        const mediaInse = get(row, "MEDIA_INSE") ?? get(row, "INSE_VALOR") ?? get(row, "VL_INSE");
        const nivelInse = get(row, "INSE_CLASSIFICACAO") ?? get(row, "NIVEL_INSE") ?? get(row, "TP_CLASSIFICACAO_INSE");

        if (mediaInse === undefined && nivelInse === undefined) continue;

        const data: Record<string, any> = { co_entidade: parseInt(inep) };
        if (mediaInse !== undefined) data.media_inse = mediaInse;
        if (nivelInse !== undefined) data.nivel_inse = nivelInse;

        for (const h of headers) {
          if (h !== "CO_ENTIDADE" && h !== "CO_ESCOLA" && !data[h.toLowerCase()]) {
            const v = get(row, h);
            if (v !== undefined && v !== null) data[h.toLowerCase()] = v;
          }
        }

        batchValues.push({
          inep, ano, tipo: "inse",
          dados: JSON.stringify(data),
          updatedAt: Date.now(),
        });

        if (batchValues.length >= 1000) {
          db.transaction((tx) => {
            for (const rec of batchValues) tx.insert(indicadoresEducacionais).values(rec).run();
          });
          imported += batchValues.length;
          batchValues = [];
          if (imported % 10000 === 0) {
            console.log(`[INEP] INSE ${ano}: ${imported} records`);
            updateStatus("inse", ano, "importando", imported, allData.length);
          }
        }
      }

      if (batchValues.length > 0) {
        db.transaction((tx) => {
          for (const rec of batchValues) tx.insert(indicadoresEducacionais).values(rec).run();
        });
        imported += batchValues.length;
      }

      console.log(`[INEP] INSE ${ano}: completed with ${imported} records`);
      updateStatus("inse", ano, "completo", imported, imported);
      results[`inse_${ano}`] = { imported };

      try { fs.unlinkSync(xlsxPath); } catch {}
    }
  } finally {
    indicatorImportRunning = false;
  }

  return { success: true, results, errors };
}

export async function generateSaebFromIdeb() {
  if (indicatorImportRunning) return { error: "Importação já em andamento" };
  indicatorImportRunning = true;

  const results: Record<string, any> = {};
  const errors: string[] = [];

  try {
    const idebRecords = db.select().from(indicadoresEducacionais)
      .where(eq(indicadoresEducacionais.tipo, "ideb"))
      .all();

    console.log(`[INEP] Generating SAEB from ${idebRecords.length} IDEB records...`);

    const saebByKey: Record<string, { inep: string; ano: number; data: Record<string, any> }> = {};

    for (const rec of idebRecords) {
      const dados = rec.dados ? JSON.parse(rec.dados) : {};
      const key = `${rec.inep}_${rec.ano}`;

      if (!saebByKey[key]) {
        saebByKey[key] = { inep: rec.inep, ano: rec.ano, data: { co_entidade: parseInt(rec.inep) } };
      }

      const saebData = saebByKey[key].data;
      if (dados.nota_mt_ai != null) saebData.nota_mt_ai = dados.nota_mt_ai;
      if (dados.nota_lp_ai != null) saebData.nota_lp_ai = dados.nota_lp_ai;
      if (dados.nota_mt_af != null) saebData.nota_mt_af = dados.nota_mt_af;
      if (dados.nota_lp_af != null) saebData.nota_lp_af = dados.nota_lp_af;
      if (dados.nota_mt_em != null) saebData.nota_mt_em = dados.nota_mt_em;
      if (dados.nota_lp_em != null) saebData.nota_lp_em = dados.nota_lp_em;
    }

    const entries = Object.values(saebByKey).filter(e => {
      const d = e.data;
      return d.nota_mt_ai != null || d.nota_lp_ai != null || d.nota_mt_af != null || d.nota_lp_af != null || d.nota_mt_em != null || d.nota_lp_em != null;
    });

    const anoSet = new Set(entries.map(e => e.ano));
    for (const ano of anoSet) {
      db.run(sql`DELETE FROM indicadores_educacionais WHERE tipo = 'saeb' AND ano = ${ano}`);
    }

    let imported = 0;
    let batchValues: any[] = [];

    for (const entry of entries) {
      batchValues.push({
        inep: entry.inep,
        ano: entry.ano,
        tipo: "saeb",
        dados: JSON.stringify(entry.data),
        updatedAt: Date.now(),
      });

      if (batchValues.length >= 1000) {
        db.transaction((tx) => {
          for (const rec of batchValues) tx.insert(indicadoresEducacionais).values(rec).run();
        });
        imported += batchValues.length;
        batchValues = [];
      }
    }

    if (batchValues.length > 0) {
      db.transaction((tx) => {
        for (const rec of batchValues) tx.insert(indicadoresEducacionais).values(rec).run();
      });
      imported += batchValues.length;
    }

    console.log(`[INEP] SAEB generation completed: ${imported} records from IDEB data`);
    for (const ano of anoSet) {
      updateStatus("saeb", ano, "completo", imported, imported);
    }
    results.saeb = { imported, anos: [...anoSet] };
  } finally {
    indicatorImportRunning = false;
  }

  return { success: true, results, errors };
}
