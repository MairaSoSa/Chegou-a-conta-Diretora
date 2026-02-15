import { db } from "./db";
import { censoEscolar, importacaoStatus } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import fs from "fs";
import readline from "readline";

const DEP_MAP: Record<string, string> = { "1": "Federal", "2": "Estadual", "3": "Municipal", "4": "Privada" };
const LOC_MAP: Record<string, string> = { "1": "Urbana", "2": "Rural" };
const SIT_MAP: Record<string, string> = { "1": "Em Atividade", "2": "Paralisada", "3": "Extinta", "4": "Extinta em Anos Anteriores" };

export async function importCensoCsvFromFile(filePath: string, ano: number) {
  console.log(`[INEP CSV] Starting import from ${filePath} for year ${ano}`);

  db.run(sql`DELETE FROM censo_escolar WHERE ano = ${ano}`);
  console.log(`[INEP CSV] Cleared existing data for year ${ano}`);

  const fileStream = fs.createReadStream(filePath, { encoding: "latin1" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let headers: string[] = [];
  let lineCount = 0;
  let imported = 0;
  let batchValues: any[] = [];
  const BATCH_SIZE = 1000;

  const updateImportStatus = (status: string, importedCount: number, total: number) => {
    const existing = db.select().from(importacaoStatus)
      .where(and(eq(importacaoStatus.tipo, "censo_escolar_csv"), eq(importacaoStatus.ano, ano)))
      .get();
    const record = {
      tipo: "censo_escolar_csv", ano, status,
      registrosImportados: importedCount, totalRegistros: total, erro: null,
      iniciadoEm: existing?.iniciadoEm || Date.now(),
      finalizadoEm: status === "completo" ? Date.now() : null,
    };
    if (existing) {
      db.update(importacaoStatus).set(record).where(eq(importacaoStatus.id, existing.id)).run();
    } else {
      db.insert(importacaoStatus).values(record).run();
    }
  };

  updateImportStatus("importando", 0, 0);

  function insertMany(records: any[]) {
    db.transaction((tx) => {
      for (const rec of records) {
        tx.insert(censoEscolar).values(rec).run();
      }
    });
  }

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
      ...keyData,
    };

    batchValues.push({
      inep: String(inep),
      ano,
      nome: get("NO_ENTIDADE") || null,
      municipio: get("NO_MUNICIPIO") || null,
      uf: get("SG_UF") || null,
      dependencia: DEP_MAP[depCode] || null,
      localizacao: LOC_MAP[locCode] || null,
      situacao: SIT_MAP[sitCode] || null,
      matriculas: keyData.qt_mat_bas || 0,
      docentes: keyData.qt_docentes || keyData.qt_doc_bas || 0,
      turmas: keyData.qt_turmas || 0,
      dados: JSON.stringify(dados),
      updatedAt: Date.now(),
    });

    if (batchValues.length >= BATCH_SIZE) {
      insertMany(batchValues);
      imported += batchValues.length;
      batchValues = [];

      if (imported % 50000 === 0) {
        console.log(`[INEP CSV] Imported ${imported} schools...`);
        updateImportStatus("importando", imported, lineCount - 1);
      }
    }
  }

  if (batchValues.length > 0) {
    insertMany(batchValues);
    imported += batchValues.length;
  }

  updateImportStatus("completo", imported, imported);
  console.log(`[INEP CSV] Completed: ${imported} schools imported for year ${ano}`);
  return { imported, total: lineCount - 1 };
}

if (process.argv[1]?.endsWith("import-inep-csv.ts")) {
  const filePath = process.argv[2] || "/tmp/inep-data/microdados_censo_escolar_2024/dados/microdados_ed_basica_2024.csv";
  const ano = parseInt(process.argv[3] || "2024");
  console.log(`Starting INEP CSV import: ${filePath} (year ${ano})`);
  importCensoCsvFromFile(filePath, ano).then(result => {
    console.log("Import result:", result);
    process.exit(0);
  }).catch(err => {
    console.error("Import failed:", err);
    process.exit(1);
  });
}
