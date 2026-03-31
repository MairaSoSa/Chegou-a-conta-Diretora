#!/usr/bin/env node
const { Pool } = require('pg');
const fs = require('fs');
const readline = require('readline');

const pool = new Pool({
  connectionString: process.env.RAILWAY_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

const BATCH_SIZE = 500;

const FILES = [
  {
    file: 'attached_assets/Tabela_Turma_2025_1774975977488.csv',
    table: 'turma_escola',
    hasSerialId: true,
  },
  {
    file: 'attached_assets/Tabela_Docente_2025_1774975996154.csv',
    table: 'docente_escola',
    hasSerialId: true,
  },
  {
    file: 'attached_assets/Tabela_Gestor_Escolar_2025_1774975987827.csv',
    table: 'gestor_escolar',
    hasSerialId: false,
  },
  {
    file: 'attached_assets/Tabela_Matricula_2025_1774976012044.csv',
    table: 'matricula_escola',
    hasSerialId: false,
  },
];

async function insertBatch(table, hasSerialId, batch) {
  const values = [];
  const placeholders = batch.map((row, i) => {
    const base = i * 3;
    values.push(row.ano, row.co_entidade, row.dados_json);
    return `($${base + 1}, $${base + 2}, $${base + 3})`;
  });

  const conflict = hasSerialId
    ? ''
    : ' ON CONFLICT (ano, co_entidade) DO NOTHING';

  const sql = `INSERT INTO ${table} (ano, co_entidade, dados_json) VALUES ${placeholders.join(',')}${conflict}`;
  await pool.query(sql, values);
}

async function importFile({ file, table, hasSerialId }) {
  console.log(`\n[${table}] Iniciando importação de ${file}...`);
  const start = Date.now();

  const fileStream = fs.createReadStream(file, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let headers = null;
  let batch = [];
  let total = 0;
  let errors = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    const cols = line.split(';');

    if (!headers) {
      headers = cols.map(h => h.trim());
      continue;
    }

    const obj = {};
    headers.forEach((h, i) => {
      const val = cols[i] !== undefined ? cols[i].trim() : null;
      obj[h] = val === '' ? null : val;
    });

    const ano = obj['NU_ANO_CENSO'];
    const co_entidade = obj['CO_ENTIDADE'];

    if (!ano || !co_entidade) continue;

    batch.push({ ano, co_entidade, dados_json: JSON.stringify(obj) });

    if (batch.length >= BATCH_SIZE) {
      try {
        await insertBatch(table, hasSerialId, batch);
        total += batch.length;
      } catch (e) {
        errors++;
        console.error(`  Erro no batch: ${e.message}`);
      }
      batch = [];
      if (total % 10000 === 0) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`  [${table}] ${total} linhas | ${elapsed}s`);
      }
    }
  }

  if (batch.length > 0) {
    try {
      await insertBatch(table, hasSerialId, batch);
      total += batch.length;
    } catch (e) {
      errors++;
      console.error(`  Erro no batch final: ${e.message}`);
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[${table}] CONCLUÍDO: ${total} linhas em ${elapsed}s (${errors} erros de batch)`);
  return { table, total, errors, elapsed };
}

async function main() {
  console.log('=== Importação Censo 2025 ===');
  const results = [];

  for (const cfg of FILES) {
    if (!fs.existsSync(cfg.file)) {
      console.log(`AVISO: arquivo não encontrado: ${cfg.file}`);
      continue;
    }
    const result = await importFile(cfg);
    results.push(result);
  }

  console.log('\n=== RESUMO FINAL ===');
  for (const r of results) {
    console.log(`  ${r.table}: ${r.total} linhas | ${r.elapsed}s | ${r.errors} erros`);
  }

  await pool.end();
}

main().catch(e => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
