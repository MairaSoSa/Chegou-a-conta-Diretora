/**
 * Importador Censo Escolar 2025 — versão streaming sequencial
 * Processa um CSV por vez para não estourar memória.
 * Uso: node --max-old-space-size=1024 -r tsx/cjs server/import-censo-2025.ts
 *   ou: npx tsx server/import-censo-2025.ts
 */
import Database from "better-sqlite3";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { join } from "path";

const DB_PATH = process.env.SQLITE_DATABASE_URL?.replace("file:", "") || "dev.db";
const DADOS_DIR = join(process.cwd(), "Dados/Censo Escolar 2025");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("cache_size = -32000");

const ANO = 2025;
const BATCH = 2000;

const DEP: Record<string, string> = { "1": "Federal", "2": "Estadual", "3": "Municipal", "4": "Privada" };
const LOC: Record<string, string> = { "1": "Urbana", "2": "Rural" };
const SIT: Record<string, string> = { "1": "Em Atividade", "2": "Paralisada", "3": "Extinta", "4": "Atividade Encerrada" };

function num(v: string | undefined): number | null {
  if (!v && v !== "0") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}
function bin(v: string | undefined): number | null {
  if (v === "1") return 1;
  if (v === "0") return 0;
  return null;
}

// ── Streaming CSV line processor ────────────────────────────────────────────

async function streamCsv(
  file: string,
  onRow: (row: Record<string, string>) => void,
  batchSize = BATCH,
  onFlush?: () => void
) {
  const rl = createInterface({ input: createReadStream(join(DADOS_DIR, file)), crlfDelay: Infinity });
  let headers: string[] = [];
  let first = true;
  let count = 0;
  let batch: (() => void)[] = [];

  for await (const line of rl) {
    if (first) { headers = line.split(";"); first = false; continue; }
    const cols = line.split(";");
    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) row[headers[i]] = cols[i] ?? "";
    batch.push(() => onRow(row));

    if (batch.length >= batchSize) {
      const txn = db.transaction(() => batch.forEach(fn => fn()));
      txn();
      batch = [];
      onFlush?.();
    }
    count++;
    if (count % 50000 === 0) process.stdout.write(`  ${file}: ${count}...\r`);
  }

  if (batch.length) {
    const txn = db.transaction(() => batch.forEach(fn => fn()));
    txn();
    onFlush?.();
  }

  console.log(`  ${file}: ${count} linhas processadas`);
  return count;
}

// ── Step 1: Escola — insere/atualiza registro base + infraestrutura ──────────

async function importEscola() {
  console.log("\n[1/5] Tabela_Escola_2025.csv — dados base + infraestrutura");

  const upsert = db.prepare(`
    INSERT INTO censo_escolar (inep, ano, nome, municipio, uf, dependencia, localizacao, situacao, matriculas, docentes, turmas, dados, updated_at)
    VALUES (@inep, @ano, @nome, @municipio, @uf, @dependencia, @localizacao, @situacao, 0, 0, 0, @dados, @ts)
    ON CONFLICT(inep, ano) DO UPDATE SET
      nome=excluded.nome, municipio=excluded.municipio, uf=excluded.uf,
      dependencia=excluded.dependencia, localizacao=excluded.localizacao,
      situacao=excluded.situacao, dados=excluded.dados, updated_at=excluded.updated_at
  `);

  await streamCsv("Tabela_Escola_2025.csv", (e) => {
    const inep = e.CO_ENTIDADE; if (!inep) return;
    const dep = e.TP_DEPENDENCIA, loc = e.TP_LOCALIZACAO, sit = e.TP_SITUACAO_FUNCIONAMENTO;
    const dados = {
      co_municipio: e.CO_MUNICIPIO || null,
      co_uf:        e.CO_UF        || null,
      co_regiao:    e.CO_REGIAO    || null,
      no_regiao:    e.NO_REGIAO    || null,
      co_cep:       e.CO_CEP       || null,
      ds_endereco:  e.DS_ENDERECO  || null,
      no_bairro:    e.NO_BAIRRO    || null,
      telefone:     e.NU_TELEFONE  || null,
      qt_salas_utilizadas:            num(e.QT_SALAS_UTILIZADAS),
      qt_salas_utiliza_climatizadas:  num(e.QT_SALAS_UTILIZA_CLIMATIZADAS),
      qt_salas_utilizadas_acessiveis: num(e.QT_SALAS_UTILIZADAS_ACESSIVEIS),
      // Água
      in_agua_potavel:        bin(e.IN_AGUA_POTAVEL),
      in_agua_rede_publica:   bin(e.IN_AGUA_REDE_PUBLICA),
      in_agua_poco_artesiano: bin(e.IN_AGUA_POCO_ARTESIANO),
      in_agua_cacimba:        bin(e.IN_AGUA_CACIMBA),
      in_agua_fonte_rio:      bin(e.IN_AGUA_FONTE_RIO),
      in_agua_inexistente:    bin(e.IN_AGUA_INEXISTENTE),
      // Energia
      in_energia_rede_publica:   bin(e.IN_ENERGIA_REDE_PUBLICA),
      in_energia_gerador_fossil: bin(e.IN_ENERGIA_GERADOR_FOSSIL),
      in_energia_renovavel:      bin(e.IN_ENERGIA_RENOVAVEL),
      in_energia_inexistente:    bin(e.IN_ENERGIA_INEXISTENTE),
      // Esgoto
      in_esgoto_rede_publica:  bin(e.IN_ESGOTO_REDE_PUBLICA),
      in_esgoto_fossa_septica: bin(e.IN_ESGOTO_FOSSA_SEPTICA),
      in_esgoto_fossa_comum:   bin(e.IN_ESGOTO_FOSSA_COMUM),
      in_esgoto_fossa:         bin(e.IN_ESGOTO_FOSSA),
      in_esgoto_inexistente:   bin(e.IN_ESGOTO_INEXISTENTE),
      // Lixo
      in_lixo_servico_coleta:        bin(e.IN_LIXO_SERVICO_COLETA),
      in_lixo_queima:                bin(e.IN_LIXO_QUEIMA),
      in_lixo_destino_final_publico: bin(e.IN_LIXO_DESTINO_FINAL_PUBLICO),
      // Espaços
      in_biblioteca:               bin(e.IN_BIBLIOTECA),
      in_biblioteca_sala_leitura:  bin(e.IN_BIBLIOTECA_SALA_LEITURA),
      in_quadra_esportes:          bin(e.IN_QUADRA_ESPORTES),
      in_quadra_esportes_coberta:  bin(e.IN_QUADRA_ESPORTES_COBERTA),
      in_quadra_esportes_descoberta: bin(e.IN_QUADRA_ESPORTES_DESCOBERTA),
      in_laboratorio_informatica:  bin(e.IN_LABORATORIO_INFORMATICA),
      in_laboratorio_ciencias:     bin(e.IN_LABORATORIO_CIENCIAS),
      in_auditorio:                bin(e.IN_AUDITORIO),
      in_cozinha:                  bin(e.IN_COZINHA),
      in_almoxarifado:             bin(e.IN_ALMOXARIFADO),
      in_banheiro:                 bin(e.IN_BANHEIRO),
      in_banheiro_pne:             bin(e.IN_BANHEIRO_PNE),
      in_refeitorio:               bin(e.IN_REFEITORIO),
      in_parque_infantil:          bin(e.IN_PARQUE_INFANTIL),
      in_area_verde:               bin(e.IN_AREA_VERDE),
      // Internet
      in_internet:                bin(e.IN_INTERNET),
      in_internet_alunos:         bin(e.IN_INTERNET_ALUNOS),
      in_internet_administrativo: bin(e.IN_INTERNET_ADMINISTRATIVO),
      in_banda_larga:             bin(e.IN_BANDA_LARGA),
      // Alimentação
      in_alimentacao: bin(e.IN_ALIMENTACAO),
      // Meta
      tp_dependencia: dep,
      tp_localizacao: loc,
      tp_situacao:    sit,
    };
    upsert.run({ inep, ano: ANO, nome: e.NO_ENTIDADE || null, municipio: e.NO_MUNICIPIO || null,
      uf: e.SG_UF || null, dependencia: DEP[dep] || null, localizacao: LOC[loc] || null,
      situacao: SIT[sit] || null, dados: JSON.stringify(dados), ts: Date.now() });
  });
}

// ── Step 2-5: tabelas de contagem — UPDATE mescla dados JSON + colunas diretas

async function updateFromCsv(
  step: string,
  file: string,
  buildUpdate: (row: Record<string, string>) => { inep: string; sql: string; params: any[] } | null
) {
  console.log(`\n[${step}] ${file}`);
  const stmts = new Map<string, Database.Statement>();

  const getStmt = (sql: string) => {
    if (!stmts.has(sql)) stmts.set(sql, db.prepare(sql));
    return stmts.get(sql)!;
  };

  await streamCsv(file, (row) => {
    const r = buildUpdate(row);
    if (!r) return;
    getStmt(r.sql).run(...r.params);
  });
}

async function importMatriculas() {
  await updateFromCsv("2/5", "Tabela_Matricula_2025.csv", (m) => {
    const inep = m.CO_ENTIDADE; if (!inep) return null;
    const mat = num(m.QT_MAT_BAS) || 0;

    const patch = {
      qt_mat_bas:      num(m.QT_MAT_BAS),
      qt_mat_inf:      num(m.QT_MAT_INF),
      qt_mat_inf_cre:  num(m.QT_MAT_INF_CRE),
      qt_mat_inf_pre:  num(m.QT_MAT_INF_PRE),
      qt_mat_fund:     num(m.QT_MAT_FUND),
      qt_mat_fund_ai:  num(m.QT_MAT_FUND_AI),
      qt_mat_fund_af:  num(m.QT_MAT_FUND_AF),
      qt_mat_med:      num(m.QT_MAT_MED),
      qt_mat_eja:      num(m.QT_MAT_EJA),
      qt_mat_esp:      num(m.QT_MAT_ESP),
      qt_mat_bas_fem:  num(m.QT_MAT_BAS_FEM),
      qt_mat_bas_masc: num(m.QT_MAT_BAS_MASC),
    };

    return {
      inep,
      sql: `UPDATE censo_escolar SET matriculas=?, dados=json_patch(dados, ?), updated_at=? WHERE inep=? AND ano=${ANO}`,
      params: [mat, JSON.stringify(patch), Date.now(), inep],
    };
  });
}

async function importDocentes() {
  await updateFromCsv("3/5", "Tabela_Docente_2025.csv", (d) => {
    const inep = d.CO_ENTIDADE; if (!inep) return null;
    const doc = num(d.QT_DOC_BAS) || 0;
    const patch = {
      qt_doc_bas:     num(d.QT_DOC_BAS),
      qt_doc_fund:    num(d.QT_DOC_FUND),
      qt_doc_fund_ai: num(d.QT_DOC_FUND_AI),
      qt_doc_fund_af: num(d.QT_DOC_FUND_AF),
      qt_doc_med:     num(d.QT_DOC_MED),
      qt_doc_eja:     num(d.QT_DOC_EJA),
    };
    return {
      inep,
      sql: `UPDATE censo_escolar SET docentes=?, dados=json_patch(dados, ?), updated_at=? WHERE inep=? AND ano=${ANO}`,
      params: [doc, JSON.stringify(patch), Date.now(), inep],
    };
  });
}

async function importTurmas() {
  await updateFromCsv("4/5", "Tabela_Turma_2025.csv", (t) => {
    const inep = t.CO_ENTIDADE; if (!inep) return null;
    const tur = num(t.QT_TUR_BAS) || 0;
    const patch = {
      qt_tur_bas:     num(t.QT_TUR_BAS),
      qt_tur_fund:    num(t.QT_TUR_FUND),
      qt_tur_fund_ai: num(t.QT_TUR_FUND_AI),
      qt_tur_fund_af: num(t.QT_TUR_FUND_AF),
      qt_tur_med:     num(t.QT_TUR_MED),
      qt_tur_bas_d:   num(t.QT_TUR_BAS_D),
      qt_tur_bas_n:   num(t.QT_TUR_BAS_N),
    };
    return {
      inep,
      sql: `UPDATE censo_escolar SET turmas=?, dados=json_patch(dados, ?), updated_at=? WHERE inep=? AND ano=${ANO}`,
      params: [tur, JSON.stringify(patch), Date.now(), inep],
    };
  });
}

async function importGestores() {
  await updateFromCsv("5/5", "Tabela_Gestor_Escolar_2025.csv", (g) => {
    const inep = g.CO_ENTIDADE; if (!inep) return null;
    const patch = { qt_gest_bas: num(g.QT_GEST_BAS) };
    return {
      inep,
      sql: `UPDATE censo_escolar SET dados=json_patch(dados, ?), updated_at=? WHERE inep=? AND ano=${ANO}`,
      params: [JSON.stringify(patch), Date.now(), inep],
    };
  });
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n=== IMPORTADOR CENSO ESCOLAR 2025 (streaming) ===");
  const t0 = Date.now();

  await importEscola();
  await importMatriculas();
  await importDocentes();
  await importTurmas();
  await importGestores();

  // Verificação final
  const cnt = (db.prepare(`SELECT COUNT(*) as c FROM censo_escolar WHERE ano=${ANO}`).get() as any).c;
  const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\n✅ Concluído: ${cnt} escolas no ano 2025 (${elapsed}s total)`);
  db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
