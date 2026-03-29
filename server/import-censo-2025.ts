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
      in_lixo_enterra:               bin(e.IN_LIXO_ENTERRA),
      in_lixo_destino_final_publico: bin(e.IN_LIXO_DESTINO_FINAL_PUBLICO),
      // Tratamento de lixo
      in_tratamento_lixo_separacao:   bin(e.IN_TRATAMENTO_LIXO_SEPARACAO),
      in_tratamento_lixo_reciclagem:  bin(e.IN_TRATAMENTO_LIXO_RECICLAGEM),
      in_tratamento_lixo_reutiliza:   bin(e.IN_TRATAMENTO_LIXO_REUTILIZA),
      in_tratamento_lixo_inexistente: bin(e.IN_TRATAMENTO_LIXO_INEXISTENTE),
      // Espaços de aprendizagem
      in_biblioteca:               bin(e.IN_BIBLIOTECA),
      in_biblioteca_sala_leitura:  bin(e.IN_BIBLIOTECA_SALA_LEITURA),
      in_sala_leitura:             bin(e.IN_SALA_LEITURA),
      in_sala_multiuso:            bin(e.IN_SALA_MULTIUSO),
      in_sala_atelie_artes:        bin(e.IN_SALA_ATELIE_ARTES),
      in_sala_musica_coral:        bin(e.IN_SALA_MUSICA_CORAL),
      in_sala_estudio_danca:       bin(e.IN_SALA_ESTUDIO_DANCA),
      in_sala_estudio_gravacao:    bin(e.IN_SALA_ESTUDIO_GRAVACAO),
      in_sala_repouso_aluno:       bin(e.IN_SALA_REPOUSO_ALUNO),
      in_sala_atendimento_especial: bin(e.IN_SALA_ATENDIMENTO_ESPECIAL),
      in_laboratorio_informatica:  bin(e.IN_LABORATORIO_INFORMATICA),
      in_laboratorio_ciencias:     bin(e.IN_LABORATORIO_CIENCIAS),
      in_laboratorio_educ_prof:    bin(e.IN_LABORATORIO_EDUC_PROF),
      // Espaços administrativos
      in_sala_professor:  bin(e.IN_SALA_PROFESSOR),
      in_sala_diretoria:  bin(e.IN_SALA_DIRETORIA),
      in_secretaria:      bin(e.IN_SECRETARIA),
      // Esportes e lazer
      in_quadra_esportes:           bin(e.IN_QUADRA_ESPORTES),
      in_quadra_esportes_coberta:   bin(e.IN_QUADRA_ESPORTES_COBERTA),
      in_quadra_esportes_descoberta: bin(e.IN_QUADRA_ESPORTES_DESCOBERTA),
      in_patio_coberto:   bin(e.IN_PATIO_COBERTO),
      in_patio_descoberto: bin(e.IN_PATIO_DESCOBERTO),
      in_parque_infantil: bin(e.IN_PARQUE_INFANTIL),
      in_piscina:         bin(e.IN_PISCINA),
      in_auditorio:       bin(e.IN_AUDITORIO),
      in_dormitorio_aluno:     bin(e.IN_DORMITORIO_ALUNO),
      in_dormitorio_professor: bin(e.IN_DORMITORIO_PROFESSOR),
      // Alimentação e gestão
      in_cozinha:     bin(e.IN_COZINHA),
      in_almoxarifado: bin(e.IN_ALMOXARIFADO),
      in_refeitorio:  bin(e.IN_REFEITORIO),
      in_despensa:    bin(e.IN_DESPENSA),
      // Banheiros
      in_banheiro:             bin(e.IN_BANHEIRO),
      in_banheiro_pne:         bin(e.IN_BANHEIRO_PNE),
      in_banheiro_chuveiro:    bin(e.IN_BANHEIRO_CHUVEIRO),
      in_banheiro_funcionarios: bin(e.IN_BANHEIRO_FUNCIONARIOS),
      in_banheiro_ei:          bin(e.IN_BANHEIRO_EI),
      // Acessibilidade
      in_acessibilidade_rampas:       bin(e.IN_ACESSIBILIDADE_RAMPAS),
      in_acessibilidade_corrimao:     bin(e.IN_ACESSIBILIDADE_CORRIMAO),
      in_acessibilidade_elevador:     bin(e.IN_ACESSIBILIDADE_ELEVADOR),
      in_acessibilidade_pisos_tateis: bin(e.IN_ACESSIBILIDADE_PISOS_TATEIS),
      in_acessibilidade_sinal_visual: bin(e.IN_ACESSIBILIDADE_SINAL_VISUAL),
      in_acessibilidade_sinal_sonoro: bin(e.IN_ACESSIBILIDADE_SINAL_SONORO),
      in_acessibilidade_telas_leitoras: bin(e.IN_ACESSIBILIDADE_TELAS_LEITORAS),
      in_dependencias_pne:    bin(e.IN_DEPENDENCIAS_PNE),
      // Sustentabilidade
      in_area_verde:   bin(e.IN_AREA_VERDE),
      in_area_plantio: bin(e.IN_AREA_PLANTIO),
      in_horta:        bin(e.IN_HORTA),
      in_compostagem:  bin(e.IN_COMPOSTAGEM),
      in_viveiro:      bin(e.IN_VIVEIRO),
      // Internet
      in_internet:                bin(e.IN_INTERNET),
      in_internet_alunos:         bin(e.IN_INTERNET_ALUNOS),
      in_internet_administrativo: bin(e.IN_INTERNET_ADMINISTRATIVO),
      in_banda_larga:             bin(e.IN_BANDA_LARGA),
      in_rede_local:              bin(e.IN_REDE_LOCAL),
      in_wifi:                    bin(e.IN_WIFI),
      // Tecnologia — contagens
      qt_desktop_aluno:       num(e.QT_DESKTOP_ALUNO),
      qt_comp_portatil_aluno: num(e.QT_COMP_PORTATIL_ALUNO),
      qt_tablet_aluno:        num(e.QT_TABLET_ALUNO),
      qt_desktop_adm:         num(e.QT_DESKTOP_ADM),
      qt_comp_portatil_adm:   num(e.QT_COMP_PORTATIL_ADM),
      qt_equip_tv:            num(e.QT_EQUIP_TV),
      qt_equip_multimidia:    num(e.QT_EQUIP_MULTIMIDIA),
      qt_equip_lousa_digital: num(e.QT_EQUIP_LOUSA_DIGITAL),
      qt_equip_som:           num(e.QT_EQUIP_SOM),
      qt_equip_impressora:    num(e.QT_EQUIP_IMPRESSORA),
      qt_equip_impressora_mult: num(e.QT_EQUIP_IMPRESSORA_MULT),
      qt_equip_copiadora:     num(e.QT_EQUIP_COPIADORA),
      // Material pedagógico
      in_material_ped_multimidia:  bin(e.IN_MATERIAL_PED_MULTIMIDIA),
      in_material_ped_infantil:    bin(e.IN_MATERIAL_PED_INFANTIL),
      in_material_ped_cientifico:  bin(e.IN_MATERIAL_PED_CIENTIFICO),
      in_material_ped_musical:     bin(e.IN_MATERIAL_PED_MUSICAL),
      in_material_ped_jogos:       bin(e.IN_MATERIAL_PED_JOGOS),
      in_material_ped_artisticas:  bin(e.IN_MATERIAL_PED_ARTISTICAS),
      in_material_ped_desportiva:  bin(e.IN_MATERIAL_PED_DESPORTIVA),
      in_material_ped_edu_esp:     bin(e.IN_MATERIAL_PED_EDU_ESP),
      // Ed. Especial — recursos
      in_esp_libras:                  bin(e.IN_ESP_LIBRAS),
      in_esp_braille:                 bin(e.IN_ESP_BRAILLE),
      in_esp_comunicacao_alternativa: bin(e.IN_ESP_COMUNICACAO_ALTERNATIVA),
      in_esp_orient_mobilidade:       bin(e.IN_ESP_ORIENT_MOBILIDADE),
      in_esp_enriquecimento_curricular: bin(e.IN_ESP_ENRIQUECIMENTO_CURRICULAR),
      in_prof_interprete_libras:      bin(e.IN_PROF_INTERPRETE_LIBRAS),
      in_prof_apoio:                  bin(e.IN_PROF_APOIO),
      // Modalidades educacionais
      in_educacao_indigena:   bin(e.IN_EDUCACAO_INDIGENA),
      in_educacao_quilombola: bin(e.IN_EDUCACAO_QUILOMBOLA),
      in_educacao_campo:      bin(e.IN_EDUCACAO_CAMPO),
      in_educacao_ambiental:  bin(e.IN_EDUCACAO_AMBIENTAL),
      in_tempo_integral:      bin(e.IN_TEMPO_INTEGRAL),
      // Etapas ofertadas
      in_inf:      bin(e.IN_ED_INF),
      in_inf_cre:  bin(e.IN_CRECHE),
      in_inf_pre:  bin(e.IN_PRE_ESCOLA),
      in_fund:     bin(e.IN_FUND_AI) === 1 || bin(e.IN_FUND_AF) === 1 ? 1 : (bin(e.IN_FUND_AI) === 0 && bin(e.IN_FUND_AF) === 0 ? 0 : null),
      in_fund_ai:  bin(e.IN_FUND_AI),
      in_fund_af:  bin(e.IN_FUND_AF),
      in_med:      bin(e.IN_MEDIO),
      in_prof:     bin(e.IN_PROFISSIONALIZANTE),
      in_eja:      bin(e.IN_EJA),
      in_esp:      bin(e.IN_ESPECIAL_EXCLUSIVA),
      in_regular:  bin(e.IN_REGULAR),
      // Gestor / organização da escola
      in_orgao_conselho_escolar:   bin(e.IN_ORGAO_CONSELHO_ESCOLAR),
      in_orgao_ass_pais_mestres:   bin(e.IN_ORGAO_ASSOCIACAO_PAIS_MESTRES),
      in_orgao_gremio_estudantil:  bin(e.IN_ORGAO_GREMIO_ESTUDANTIL),
      in_ppp:                      bin(e.IN_PROJETO_POLITICO_PEDAGOGICO),
      in_poder_publico_parceria:   bin(e.IN_PODER_PUBLICO_PARCERIA),
      in_redes_sociais:            bin(e.IN_REDES_SOCIAIS),
      // Vínculo institucional
      in_vinculo_secretaria_educacao: bin(e.IN_VINCULO_SECRETARIA_EDUCACAO),
      in_vinculo_seguranca_publica:   bin(e.IN_VINCULO_SEGURANCA_PUBLICA),
      in_vinculo_secretaria_saude:    bin(e.IN_VINCULO_SECRETARIA_SAUDE),
      in_vinculo_outro_orgao:         bin(e.IN_VINCULO_OUTRO_ORGAO),
      // Local de funcionamento
      in_local_func_predio_escolar:     bin(e.IN_LOCAL_FUNC_PREDIO_ESCOLAR),
      in_local_func_salas_outra_esc:    bin(e.IN_LOCAL_FUNC_SALAS_OUTRA_ESC),
      in_local_func_galpao:             bin(e.IN_LOCAL_FUNC_GALPAO),
      in_local_func_socioeducativo:     bin(e.IN_LOCAL_FUNC_UNID_SOCIOEDUCATIVA),
      in_local_func_unid_prisional:     bin(e.IN_LOCAL_FUNC_UNID_PRISIONAL),
      in_local_func_outros:             bin(e.IN_LOCAL_FUNC_OUTROS),
      in_predio_compartilhado:          bin(e.IN_PREDIO_COMPARTILHADO),
      // Línguas estrangeiras
      in_lingua_ingles:       bin(e.IN_LINGUA_INGLES),
      in_lingua_espanhol:     bin(e.IN_LINGUA_ESPANHOL),
      in_lingua_frances:      bin(e.IN_LINGUA_FRANCES),
      in_lingua_libras:       bin(e.IN_LINGUA_LIBRAS),
      in_lingua_indigena:     bin(e.IN_LINGUA_INDIGENA),
      in_lingua_outra_estrang: bin(e.IN_LINGUA_OUTRA_ESTRANG),
      // Localização diferenciada (0=não diferenciada; 1=área indígena; 2=quilombola; 3=assentamento; 4=campo; 5=ilha; 6=reserva extrativista)
      tp_localizacao_diferenciada: num(e.TP_LOCALIZACAO_DIFERENCIADA),
      // Calendário letivo
      dt_ano_letivo_inicio:  e.DT_ANO_LETIVO_INICIO  || null,
      dt_ano_letivo_termino: e.DT_ANO_LETIVO_TERMINO || null,
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
      // Por etapa
      qt_mat_bas:      num(m.QT_MAT_BAS),
      qt_mat_inf:      num(m.QT_MAT_INF),
      qt_mat_inf_cre:  num(m.QT_MAT_INF_CRE),
      qt_mat_inf_pre:  num(m.QT_MAT_INF_PRE),
      qt_mat_fund:     num(m.QT_MAT_FUND),
      qt_mat_fund_ai:  num(m.QT_MAT_FUND_AI),
      qt_mat_fund_af:  num(m.QT_MAT_FUND_AF),
      qt_mat_med:      num(m.QT_MAT_MED),
      qt_mat_eja:      num(m.QT_MAT_EJA),
      qt_mat_eja_fund: num(m.QT_MAT_EJA_FUND),
      qt_mat_eja_med:  num(m.QT_MAT_EJA_MED),
      qt_mat_prof:     num(m.QT_MAT_PROF),
      qt_mat_prof_tec: num(m.QT_MAT_PROF_TEC),
      qt_mat_esp:      num(m.QT_MAT_ESP),
      qt_mat_esp_cc:   num(m.QT_MAT_ESP_CC),
      qt_mat_esp_ce:   num(m.QT_MAT_ESP_CE),
      // Por sexo
      qt_mat_bas_fem:  num(m.QT_MAT_BAS_FEM),
      qt_mat_bas_masc: num(m.QT_MAT_BAS_MASC),
      // Por cor/raça
      qt_mat_bas_branca:  num(m.QT_MAT_BRANCA),
      qt_mat_bas_preta:   num(m.QT_MAT_PRETA),
      qt_mat_bas_parda:   num(m.QT_MAT_PARDA),
      qt_mat_bas_amarela: num(m.QT_MAT_AMARELA),
      qt_mat_bas_indigena: num(m.QT_MAT_INDIGENA),
      qt_mat_bas_nd:       num(m.QT_MAT_ND),
      // Por faixa etária
      qt_mat_bas_0_3:    num(m.QT_MAT_0_3),
      qt_mat_bas_4_5:    num(m.QT_MAT_4_5),
      qt_mat_bas_6_10:   num(m.QT_MAT_6_10),
      qt_mat_bas_11_14:  num(m.QT_MAT_11_14),
      qt_mat_bas_15_17:  num(m.QT_MAT_15_17),
      qt_mat_bas_18_mais: num(m.QT_MAT_18_MAIS),
      // Turno (matrículas)
      qt_mat_bas_d:   num(m.QT_MAT_BAS_D),
      qt_mat_bas_n:   num(m.QT_MAT_BAS_N),
      qt_mat_bas_ead: num(m.QT_MAT_BAS_EAD),
      // Zona
      qt_mat_zr_urb: num(m.QT_MAT_ZR_URB),
      qt_mat_zr_rur: num(m.QT_MAT_ZR_RUR),
      // Transporte
      qt_transp_publico: num(m.QT_MAT_TRANSP_PUBLICO),
      qt_transp_resp_est: num(m.QT_MAT_TRANSP_EST),
      qt_transp_resp_mun: num(m.QT_MAT_TRANSP_MUN),
      // Tempo integral — matrículas
      qt_mat_inf_int:      num(m.QT_MAT_INF_INT),
      qt_mat_fund_ai_int:  num(m.QT_MAT_FUND_AI_INT),
      qt_mat_fund_af_int:  num(m.QT_MAT_FUND_AF_INT),
      qt_mat_med_int:      num(m.QT_MAT_MED_INT),
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
      qt_doc_inf:     num(d.QT_DOC_INF),
      qt_doc_inf_cre: num(d.QT_DOC_INF_CRE),
      qt_doc_inf_pre: num(d.QT_DOC_INF_PRE),
      qt_doc_fund:    num(d.QT_DOC_FUND),
      qt_doc_fund_ai: num(d.QT_DOC_FUND_AI),
      qt_doc_fund_af: num(d.QT_DOC_FUND_AF),
      qt_doc_med:     num(d.QT_DOC_MED),
      qt_doc_eja:     num(d.QT_DOC_EJA),
      qt_doc_eja_fund: num(d.QT_DOC_EJA_FUND),
      qt_doc_eja_med:  num(d.QT_DOC_EJA_MED),
      qt_doc_prof:    num(d.QT_DOC_PROF),
      qt_doc_esp:     num(d.QT_DOC_ESP),
      qt_doc_esp_cc:  num(d.QT_DOC_ESP_CC),
      qt_doc_esp_ce:  num(d.QT_DOC_ESP_CE),
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
      qt_tur_inf:     num(t.QT_TUR_INF),
      qt_tur_inf_cre: num(t.QT_TUR_INF_CRE),
      qt_tur_inf_pre: num(t.QT_TUR_INF_PRE),
      qt_tur_fund:    num(t.QT_TUR_FUND),
      qt_tur_fund_ai: num(t.QT_TUR_FUND_AI),
      qt_tur_fund_af: num(t.QT_TUR_FUND_AF),
      qt_tur_med:     num(t.QT_TUR_MED),
      qt_tur_eja:     num(t.QT_TUR_EJA),
      qt_tur_eja_fund: num(t.QT_TUR_EJA_FUND),
      qt_tur_eja_med:  num(t.QT_TUR_EJA_MED),
      qt_tur_prof:    num(t.QT_TUR_PROF),
      qt_tur_esp:     num(t.QT_TUR_ESP),
      qt_tur_esp_cc:  num(t.QT_TUR_ESP_CC),
      qt_tur_esp_ce:  num(t.QT_TUR_ESP_CE),
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

// Decode tables for gestor fields
const ESC_DECODE: Record<string, string> = {
  '1': 'Fund. incompleto', '2': 'Fund. completo', '3': 'Ensino Médio',
  '4': 'Superior', '5': 'Licenciatura', '6': 'Pós-graduação',
};
const POS_DECODE: Record<string, string> = {
  '1': 'Especialização', '2': 'Mestrado', '3': 'Doutorado',
};
const GESTAO_DECODE: Record<string, string> = {
  '1': 'Indicação', '2': 'Eleição pela comunidade', '3': 'Eleição + indicação',
  '4': 'Concurso público', '5': 'Processo seletivo', '6': 'Outro',
};
const TEMPO_DECODE: Record<string, string> = {
  '1': 'Menos de 1 ano', '2': '1 a 2 anos', '3': '2 a 4 anos',
  '4': '5 a 10 anos', '5': 'Mais de 10 anos',
};

async function importGestores() {
  await updateFromCsv("5/5", "Tabela_Gestor_Escolar_2025.csv", (g) => {
    const inep = g.CO_ENTIDADE; if (!inep) return null;
    const patch = {
      qt_gest_bas: num(g.QT_GEST_BAS),
      // Perfil do(a) gestor(a) — primeira linha vence (ON CONFLICT ignora se já preenchido)
      gest_sexo:         g.TP_SEXO === '1' ? 'Masculino' : g.TP_SEXO === '2' ? 'Feminino' : null,
      gest_escolaridade: ESC_DECODE[g.TP_ESCOLARIDADE] || null,
      gest_pos_graduacao: POS_DECODE[g.TP_POS_GRADUACAO] || null,
      gest_tipo_gestao:  GESTAO_DECODE[g.TP_TIPO_GESTAO] || null,
      gest_tempo_gestao: TEMPO_DECODE[g.TP_TEMPO_GESTAO] || null,
    };
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
