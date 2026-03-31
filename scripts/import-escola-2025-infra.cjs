#!/usr/bin/env node
/**
 * Import campos de infraestrutura, sustentabilidade, inclusão e participação
 * da Tabela_Escola_2025.csv → censo_escolas (ano=2025)
 *
 * Estratégia: lê CSV → INSERT em temp table → UPDATE em massa (1 query)
 */
const { Pool } = require('pg');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', 'Dados', 'Censo Escolar 2025', 'Tabela_Escola_2025.csv');

const pool = new Pool({
  connectionString: process.env.RAILWAY_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

const CAMPOS_BIN = [
  ['in_banheiro',                   'IN_BANHEIRO'],
  ['in_banheiro_pne',               'IN_BANHEIRO_PNE'],
  ['in_laboratorio_ciencias',       'IN_LABORATORIO_CIENCIAS'],
  ['in_patio_coberto',              'IN_PATIO_COBERTO'],
  ['in_cozinha',                    'IN_COZINHA'],
  ['in_refeitorio',                 'IN_REFEITORIO'],
  ['in_internet_alunos',            'IN_INTERNET_ALUNOS'],
  ['in_energia_renovavel',          'IN_ENERGIA_RENOVAVEL'],
  ['in_lixo_servico_coleta',        'IN_LIXO_SERVICO_COLETA'],
  ['in_lixo_queima',                'IN_LIXO_QUEIMA'],
  ['in_tratamento_lixo_separacao',  'IN_TRATAMENTO_LIXO_SEPARACAO'],
  ['in_tratamento_lixo_reciclagem', 'IN_TRATAMENTO_LIXO_RECICLAGEM'],
  ['in_tratamento_lixo_inexistente','IN_TRATAMENTO_LIXO_INEXISTENTE'],
  ['in_area_verde',                 'IN_AREA_VERDE'],
  ['in_area_plantio',               'IN_AREA_PLANTIO'],
  ['in_sala_atendimento_especial',  'IN_SALA_ATENDIMENTO_ESPECIAL'],
  ['in_acessibilidade_rampas',      'IN_ACESSIBILIDADE_RAMPAS'],
  ['in_acessibilidade_pisos_tateis','IN_ACESSIBILIDADE_PISOS_TATEIS'],
  ['in_acessibilidade_sinal_visual','IN_ACESSIBILIDADE_SINAL_VISUAL'],
  ['in_acessibilidade_inexistente', 'IN_ACESSIBILIDADE_INEXISTENTE'],
  ['in_educacao_indigena',          'IN_EDUCACAO_INDIGENA'],
  ['in_orgao_conselho_escolar',     'IN_ORGAO_CONSELHO_ESCOLAR'],
  ['in_orgao_ass_pais',             'IN_ORGAO_ASS_PAIS'],
  ['in_orgao_gremio_estudantil',    'IN_ORGAO_GREMIO_ESTUDANTIL'],
  ['in_material_ped_quilombola',    'IN_MATERIAL_PED_QUILOMBOLA'],
  ['in_material_ped_campo',         'IN_MATERIAL_PED_CAMPO'],
  ['in_material_ped_indigena',      'IN_MATERIAL_PED_INDIGENA'],
];
const CAMPOS_INT = [
  ['qt_salas_utilizadas_dentro',  'QT_SALAS_UTILIZADAS_DENTRO'],
  ['qt_salas_utilizadas_fora',    'QT_SALAS_UTILIZADAS_FORA'],
  ['qt_desktop_aluno',            'QT_DESKTOP_ALUNO'],
  ['qt_comp_portatil_aluno',      'QT_COMP_PORTATIL_ALUNO'],
  ['qt_tablet_aluno',             'QT_TABLET_ALUNO'],
  ['tp_localizacao_diferenciada', 'TP_LOCALIZACAO_DIFERENCIADA'],
];

const ALL_COLS = [...CAMPOS_BIN, ...CAMPOS_INT];
const INT_COLS = new Set(CAMPOS_INT.map(([col]) => col));

async function main() {
  console.log('Lendo CSV...');
  if (!fs.existsSync(CSV_PATH)) { console.error('CSV não encontrado:', CSV_PATH); process.exit(1); }

  // 1) Lê CSV completo para memória (só colunas relevantes)
  const rows = [];
  let colIdx = {};
  let headers = null;
  let lineN = 0;

  const fileStream = fs.createReadStream(CSV_PATH);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const rawLine of rl) {
    lineN++;
    const line = Buffer.from(rawLine, 'binary').toString('latin1');
    const cols = line.split(';');
    if (!headers) {
      headers = cols.map(h => h.trim());
      headers.forEach((h, i) => { colIdx[h] = i; });
      console.log(`Cabeçalho: ${headers.length} colunas`);
      continue;
    }
    const co_entidade = cols[colIdx['CO_ENTIDADE']]?.trim();
    if (!co_entidade) continue;
    const vals = ALL_COLS.map(([, csv]) => {
      const v = cols[colIdx[csv]]?.trim() ?? null;
      return v === '' ? null : v;
    });
    rows.push([co_entidade, ...vals]);
    if (lineN % 50000 === 0) process.stdout.write(`  lidas: ${lineN.toLocaleString()}\n`);
  }
  console.log(`Total lidas: ${rows.length.toLocaleString()} escolas`);

  // 2) Conecta, cria temp table e insere em lotes
  const client = await pool.connect();
  try {
    const colDefs = ALL_COLS.map(([col]) => `${col} TEXT`).join(', ');
    await client.query(`
      CREATE TEMP TABLE _import_escola_infra (
        co_entidade BIGINT,
        ${colDefs}
      )
    `);
    console.log('Temp table criada. Inserindo dados em lotes...');

    const BATCH = 3000;
    const paramCount = 1 + ALL_COLS.length;
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      const valuesClause = chunk.map((_, ri) =>
        '(' + Array.from({ length: paramCount }, (__, ci) => `$${ri * paramCount + ci + 1}`).join(',') + ')'
      ).join(',');
      await client.query(
        `INSERT INTO _import_escola_infra VALUES ${valuesClause}`,
        chunk.flatMap(r => r)
      );
      if ((i + BATCH) % 30000 < BATCH) process.stdout.write(`  inseridos: ${Math.min(i + BATCH, rows.length).toLocaleString()}\n`);
    }
    console.log('INSERT concluído. Executando UPDATE em massa...');

    // 3) UPDATE em massa via JOIN
    const setCols = ALL_COLS.map(([col]) =>
      INT_COLS.has(col)
        ? `${col} = NULLIF(t.${col}, '')::INTEGER`
        : `${col} = NULLIF(t.${col}, '')`
    ).join(',\n        ');

    const result = await client.query(`
      UPDATE censo_escolas c
      SET ${setCols}
      FROM _import_escola_infra t
      WHERE c.co_entidade = t.co_entidade AND c.ano = 2025
    `);
    console.log(`UPDATE concluído: ${result.rowCount.toLocaleString()} linhas atualizadas`);

    await client.query('DROP TABLE IF EXISTS _import_escola_infra');
  } finally {
    client.release();
  }

  // 4) Verifica amostra
  const check = await pool.query(`
    SELECT co_entidade, in_energia_renovavel, in_tratamento_lixo_separacao,
           in_acessibilidade_rampas, in_orgao_conselho_escolar,
           qt_salas_utilizadas_dentro, in_internet_alunos
    FROM censo_escolas
    WHERE ano=2025 AND co_entidade=15044327
  `);
  console.log('\nVerificação (escola 15044327):');
  console.log(check.rows[0]);

  const stats = await pool.query(`
    SELECT COUNT(*) total,
           COUNT(in_energia_renovavel) com_sustent,
           COUNT(in_acessibilidade_rampas) com_access,
           COUNT(in_orgao_conselho_escolar) com_partic
    FROM censo_escolas WHERE ano=2025
  `);
  console.log('Estatísticas finais 2025:', stats.rows[0]);

  await pool.end();
  console.log('\nImportação concluída com sucesso!');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
