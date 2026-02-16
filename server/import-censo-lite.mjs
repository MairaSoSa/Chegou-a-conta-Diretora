import Database from 'better-sqlite3';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEP_MAP = { "1": "Federal", "2": "Estadual", "3": "Municipal", "4": "Privada" };
const LOC_MAP = { "1": "Urbana", "2": "Rural" };
const SIT_MAP = { "1": "Em Atividade", "2": "Paralisada", "3": "Extinta", "4": "Extinta em Anos Anteriores" };

const ESSENTIAL_FIELDS = new Set([
  'CO_ENTIDADE', 'NO_ENTIDADE', 'SG_UF', 'NO_MUNICIPIO', 'CO_MUNICIPIO', 'NO_REGIAO',
  'TP_DEPENDENCIA', 'TP_LOCALIZACAO', 'TP_SITUACAO_FUNCIONAMENTO',
  'QT_MAT_BAS', 'QT_MAT_INF', 'QT_MAT_INF_CRE', 'QT_MAT_INF_PRE',
  'QT_MAT_FUND', 'QT_MAT_FUND_AI', 'QT_MAT_FUND_AF', 'QT_MAT_MED',
  'QT_MAT_EJA', 'QT_MAT_EJA_FUND', 'QT_MAT_EJA_MED',
  'QT_MAT_ESP', 'QT_MAT_ESP_CC', 'QT_MAT_ESP_CE',
  'QT_MAT_BAS_FEM', 'QT_MAT_BAS_MASC',
  'QT_DOCENTES', 'QT_DOC_BAS', 'QT_TURMAS', 'QT_TUR_BAS',
  'QT_MAT_FUND_AI_1', 'QT_MAT_FUND_AI_2', 'QT_MAT_FUND_AI_3', 'QT_MAT_FUND_AI_4', 'QT_MAT_FUND_AI_5',
  'QT_MAT_FUND_AF_6', 'QT_MAT_FUND_AF_7', 'QT_MAT_FUND_AF_8', 'QT_MAT_FUND_AF_9',
  'QT_MAT_MED_PROP_1', 'QT_MAT_MED_PROP_2', 'QT_MAT_MED_PROP_3',
  'QT_MAT_BAS_D', 'QT_MAT_BAS_N',
  'TP_AEE', 'TP_REGULAMENTACAO', 'TP_RESPONSAVEL_REGULAMENTACAO'
]);

async function importCensoLite(filePath, ano) {
  const dbPath = path.join(__dirname, '..', 'dev.db');
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = OFF");
  db.pragma("cache_size = -64000");

  console.log(`[LITE] Deleting existing ${ano} data...`);
  db.exec(`DELETE FROM censo_escolar WHERE ano = ${ano}`);

  const stmt = db.prepare(`INSERT INTO censo_escolar (inep, ano, nome, municipio, uf, dependencia, localizacao, situacao, matriculas, docentes, turmas, dados, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const fileStream = fs.createReadStream(filePath, { encoding: "latin1" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let headers = [];
  let headerIndices = {};
  let lineCount = 0;
  let imported = 0;
  let batch = [];
  const BATCH_SIZE = 10000;
  const now = Date.now();

  const insertBatch = db.transaction((rows) => {
    for (const row of rows) stmt.run(...row);
  });

  for await (const line of rl) {
    lineCount++;
    if (lineCount === 1) {
      headers = line.split(";").map(h => h.replace(/"/g, "").trim());
      for (let i = 0; i < headers.length; i++) {
        headerIndices[headers[i]] = i;
      }
      continue;
    }

    const values = line.split(";");
    if (values.length < 20) continue;

    const getVal = (col) => {
      const idx = headerIndices[col];
      return idx !== undefined ? values[idx].replace(/"/g, "").trim() : "";
    };

    const inep = getVal("CO_ENTIDADE");
    if (!inep) continue;

    const depCode = getVal("TP_DEPENDENCIA");
    const locCode = getVal("TP_LOCALIZACAO");
    const sitCode = getVal("TP_SITUACAO_FUNCIONAMENTO");

    const keyData = {};
    for (const field of ESSENTIAL_FIELDS) {
      const idx = headerIndices[field];
      if (idx !== undefined) {
        const raw = values[idx].replace(/"/g, "").trim();
        if (field.startsWith("QT_") || field.startsWith("IN_") || field.startsWith("TP_")) {
          const val = parseInt(raw);
          if (!isNaN(val)) keyData[field.toLowerCase()] = val;
        }
      }
    }

    const dados = JSON.stringify({
      co_entidade: parseInt(inep),
      no_entidade: getVal("NO_ENTIDADE"),
      sg_uf: getVal("SG_UF"),
      no_municipio: getVal("NO_MUNICIPIO"),
      co_municipio: parseInt(getVal("CO_MUNICIPIO")) || 0,
      no_regiao: getVal("NO_REGIAO"),
      ds_dependencia: DEP_MAP[depCode] || depCode,
      ds_localizacao: LOC_MAP[locCode] || locCode,
      ds_situacao: SIT_MAP[sitCode] || sitCode,
      ...keyData,
    });

    batch.push([
      String(inep), ano, getVal("NO_ENTIDADE") || null, getVal("NO_MUNICIPIO") || null,
      getVal("SG_UF") || null, DEP_MAP[depCode] || null, LOC_MAP[locCode] || null,
      SIT_MAP[sitCode] || null, keyData.qt_mat_bas || 0, keyData.qt_docentes || keyData.qt_doc_bas || 0,
      keyData.qt_turmas || keyData.qt_tur_bas || 0, dados, now
    ]);

    if (batch.length >= BATCH_SIZE) {
      insertBatch(batch);
      imported += batch.length;
      batch = [];
      if (imported % 50000 === 0) console.log(`[LITE] ${ano}: ${imported} imported...`);
    }
  }

  if (batch.length > 0) {
    insertBatch(batch);
    imported += batch.length;
  }

  console.log(`[LITE] ${ano}: Done - ${imported} schools`);
  db.close();
  return imported;
}

const years = process.argv.slice(2);
(async () => {
  for (const yearStr of years) {
    const year = parseInt(yearStr);
    const paths = [
      `/tmp/inep-data/censo_${year}/microdados_ed_basica_${year}.csv`,
      `/tmp/inep-data/censo_${year}/microdados_ed_basica_${year}.CSV`,
      `/tmp/inep-data/microdados_censo_escolar_${year}/dados/microdados_ed_basica_${year}.csv`,
      `/tmp/inep-data/microdados_censo_escolar_${year}/dados/microdados_ed_basica_${year}.CSV`,
    ];
    const filePath = paths.find(p => fs.existsSync(p));
    if (!filePath) { console.log(`No CSV for ${year}`); continue; }
    console.log(`Importing ${year} from ${filePath} (${(fs.statSync(filePath).size/(1024*1024)).toFixed(0)}MB)...`);
    await importCensoLite(filePath, year);
  }
  process.exit(0);
})();
