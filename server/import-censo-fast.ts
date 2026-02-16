import Database from "better-sqlite3";
import fs from "fs";
import readline from "readline";
import path from "path";

const DEP_MAP: Record<string, string> = { "1": "Federal", "2": "Estadual", "3": "Municipal", "4": "Privada" };
const LOC_MAP: Record<string, string> = { "1": "Urbana", "2": "Rural" };
const SIT_MAP: Record<string, string> = { "1": "Em Atividade", "2": "Paralisada", "3": "Extinta", "4": "Extinta em Anos Anteriores" };

async function importCensoFast(filePath: string, ano: number) {
  const dbPath = path.join(process.cwd(), "dev.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = OFF");
  db.pragma("cache_size = -64000");

  console.log(`[FAST] Deleting existing ${ano} data...`);
  db.exec(`DELETE FROM censo_escolar WHERE ano = ${ano}`);

  const stmt = db.prepare(`INSERT INTO censo_escolar (inep, ano, nome, municipio, uf, dependencia, localizacao, situacao, matriculas, docentes, turmas, dados, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const fileStream = fs.createReadStream(filePath, { encoding: "latin1" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let headers: string[] = [];
  let lineCount = 0;
  let imported = 0;
  let batch: any[][] = [];
  const BATCH_SIZE = 5000;
  const now = Date.now();

  const insertBatch = db.transaction((rows: any[][]) => {
    for (const row of rows) {
      stmt.run(...row);
    }
  });

  for await (const line of rl) {
    lineCount++;
    if (lineCount === 1) {
      headers = line.split(";").map(h => h.replace(/"/g, "").trim());
      continue;
    }

    const values = line.split(";").map(v => v.replace(/"/g, "").trim());
    if (values.length < 20) continue;

    const get = (col: string) => {
      const idx = headers.indexOf(col);
      return idx >= 0 ? values[idx] : "";
    };

    const inep = get("CO_ENTIDADE");
    if (!inep) continue;

    const depCode = get("TP_DEPENDENCIA");
    const locCode = get("TP_LOCALIZACAO");
    const sitCode = get("TP_SITUACAO_FUNCIONAMENTO");

    const keyData: Record<string, any> = {};
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
      if (imported % 50000 === 0) {
        console.log(`[FAST] ${ano}: ${imported} schools imported...`);
      }
    }
  }

  if (batch.length > 0) {
    insertBatch(batch);
    imported += batch.length;
  }

  console.log(`[FAST] ${ano}: Completed - ${imported} schools imported`);
  db.close();
  return imported;
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: npx tsx server/import-censo-fast.ts <csv_path> <year>");
  process.exit(1);
}

importCensoFast(args[0], parseInt(args[1])).then(count => {
  console.log(`Done: ${count} records`);
  process.exit(0);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
