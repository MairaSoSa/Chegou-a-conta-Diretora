import Database from 'better-sqlite3';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEP_MAP = { "1": "Federal", "2": "Estadual", "3": "Municipal", "4": "Privada" };
const LOC_MAP = { "1": "Urbana", "2": "Rural" };
const SIT_MAP = { "1": "Em Atividade", "2": "Paralisada", "3": "Extinta", "4": "Extinta em Anos Anteriores" };

async function importCenso(filePath, ano) {
  const dbPath = path.join(__dirname, '..', 'dev.db');
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = OFF");
  db.pragma("cache_size = -64000");

  const skipDelete = process.env.SKIP_DELETE === '1';
  if (!skipDelete) {
    console.log(`[FAST] Deleting existing ${ano} data...`);
    db.exec(`DELETE FROM censo_escolar WHERE ano = ${ano}`);
  } else {
    console.log(`[FAST] Skipping delete for ${ano}, using INSERT OR REPLACE`);
  }

  const stmt = db.prepare(`INSERT OR REPLACE INTO censo_escolar (inep, ano, nome, municipio, uf, dependencia, localizacao, situacao, matriculas, docentes, turmas, dados, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const fileStream = fs.createReadStream(filePath, { encoding: "latin1" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let headers = [];
  let lineCount = 0;
  let imported = 0;
  let batch = [];
  const BATCH_SIZE = 5000;
  const now = Date.now();

  const insertBatch = db.transaction((rows) => {
    for (const row of rows) stmt.run(...row);
  });

  for await (const line of rl) {
    lineCount++;
    if (lineCount === 1) {
      headers = line.split(";").map(h => h.replace(/"/g, "").trim());
      continue;
    }

    const values = line.split(";").map(v => v.replace(/"/g, "").trim());
    if (values.length < 20) continue;

    const get = (col) => {
      const idx = headers.indexOf(col);
      return idx >= 0 ? values[idx] : "";
    };

    const inep = get("CO_ENTIDADE");
    if (!inep) continue;

    const depCode = get("TP_DEPENDENCIA");
    const locCode = get("TP_LOCALIZACAO");
    const sitCode = get("TP_SITUACAO_FUNCIONAMENTO");

    const keyData = {};
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      if (h.startsWith("IN_") || h.startsWith("QT_") || h.startsWith("TP_")) {
        const val = parseInt(values[i]);
        if (!isNaN(val)) keyData[h.toLowerCase()] = val;
      }
    }

    const endereco = get("DS_ENDERECO") || undefined;
    const numero = get("DS_NUMERO") || undefined;
    const complemento = get("DS_COMPLEMENTO") || undefined;
    const bairro = get("NO_BAIRRO") || undefined;
    const cep = get("CO_CEP") || undefined;
    const ddd = get("NU_DDD") || undefined;
    const telefone = get("NU_TELEFONE") || undefined;

    const dados = {
      co_entidade: parseInt(inep),
      no_entidade: get("NO_ENTIDADE"),
      sg_uf: get("SG_UF"),
      no_municipio: get("NO_MUNICIPIO"),
      co_municipio: parseInt(get("CO_MUNICIPIO")) || 0,
      no_regiao: get("NO_REGIAO"),
      ds_dependencia: DEP_MAP[depCode] || depCode,
      ds_localizacao: LOC_MAP[locCode] || locCode,
      ds_situacao: SIT_MAP[sitCode] || sitCode,
      ...(endereco && { ds_endereco: endereco }),
      ...(numero && { ds_numero: numero }),
      ...(complemento && { ds_complemento: complemento }),
      ...(bairro && { no_bairro: bairro }),
      ...(cep && { co_cep: cep }),
      ...(ddd && telefone && { telefone: `(${ddd}) ${telefone}` }),
      ...keyData,
    };

    batch.push([
      String(inep), ano, get("NO_ENTIDADE") || null, get("NO_MUNICIPIO") || null,
      get("SG_UF") || null, DEP_MAP[depCode] || null, LOC_MAP[locCode] || null,
      SIT_MAP[sitCode] || null, keyData.qt_mat_bas || 0, keyData.qt_docentes || keyData.qt_doc_bas || 0,
      keyData.qt_turmas || 0, JSON.stringify(dados), now
    ]);

    if (batch.length >= BATCH_SIZE) {
      insertBatch(batch);
      imported += batch.length;
      batch = [];
      if (imported % 50000 === 0) console.log(`[FAST] ${ano}: ${imported} imported...`);
    }
  }

  if (batch.length > 0) {
    insertBatch(batch);
    imported += batch.length;
  }

  console.log(`[FAST] ${ano}: Done - ${imported} schools`);
  db.close();
  return imported;
}

const years = process.argv.slice(2);
if (years.length === 0) {
  console.log("Usage: node server/import-censo-direct.mjs 2021 2020");
  process.exit(1);
}

(async () => {
  for (const yearStr of years) {
    const year = parseInt(yearStr);
    const paths = [
      `/tmp/inep-data/censo_${year}/microdados_${year}.csv`,
      `/tmp/inep-data/censo_${year}/microdados_ed_basica_${year}.csv`,
      `/tmp/inep-data/censo_${year}/microdados_ed_basica_${year}.CSV`,
    ];
    const filePath = paths.find(p => fs.existsSync(p));
    if (!filePath) {
      console.log(`No CSV found for ${year}, tried:`, paths);
      continue;
    }
    console.log(`Importing ${year} from ${filePath}...`);
    await importCenso(filePath, year);
  }
  console.log("All done!");
  process.exit(0);
})();
