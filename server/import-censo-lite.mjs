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
  'TP_AEE', 'TP_REGULAMENTACAO', 'TP_RESPONSAVEL_REGULAMENTACAO',
  'IN_AGUA_POTAVEL', 'IN_AGUA_REDE_PUBLICA', 'IN_AGUA_POCO_ARTESIANO', 'IN_AGUA_CACIMBA',
  'IN_AGUA_FONTE_RIO', 'IN_AGUA_INEXISTENTE', 'IN_AGUA_CARRO_PIPA',
  'IN_ENERGIA_REDE_PUBLICA', 'IN_ENERGIA_GERADOR_FOSSIL', 'IN_ENERGIA_RENOVAVEL', 'IN_ENERGIA_INEXISTENTE',
  'IN_ESGOTO_REDE_PUBLICA', 'IN_ESGOTO_FOSSA_SEPTICA', 'IN_ESGOTO_FOSSA_COMUM', 'IN_ESGOTO_FOSSA', 'IN_ESGOTO_INEXISTENTE',
  'IN_LIXO_SERVICO_COLETA', 'IN_LIXO_QUEIMA', 'IN_LIXO_ENTERRA', 'IN_LIXO_DESTINO_FINAL_PUBLICO',
  'IN_INTERNET', 'IN_INTERNET_ALUNOS', 'IN_INTERNET_APRENDIZAGEM', 'IN_BANDA_LARGA',
  'IN_BIBLIOTECA', 'IN_BIBLIOTECA_SALA_LEITURA', 'IN_SALA_LEITURA',
  'IN_LABORATORIO_INFORMATICA', 'IN_LABORATORIO_CIENCIAS', 'IN_LABORATORIO_EDUC_PROF',
  'IN_QUADRA_ESPORTES', 'IN_QUADRA_ESPORTES_COBERTA', 'IN_QUADRA_ESPORTES_DESCOBERTA',
  'IN_COZINHA', 'IN_REFEITORIO', 'IN_PARQUE_INFANTIL',
  'IN_PATIO_COBERTO', 'IN_PATIO_DESCOBERTO',
  'IN_AUDITORIO', 'IN_ALMOXARIFADO', 'IN_AREA_VERDE',
  'IN_SALA_DIRETORIA', 'IN_SALA_PROFESSOR', 'IN_SECRETARIA',
  'IN_SALA_ATENDIMENTO_ESPECIAL', 'IN_SALA_REPOUSO_ALUNO',
  'IN_SALA_ATELIE_ARTES', 'IN_SALA_MUSICA_CORAL', 'IN_SALA_ESTUDIO_DANCA',
  'IN_SALA_MULTIUSO', 'IN_SALA_OFICINAS_EDUC_PROF',
  'QT_SALAS_UTILIZADAS', 'QT_SALAS_UTILIZADAS_DENTRO', 'QT_SALAS_UTILIZADAS_FORA',
  'QT_SALAS_UTILIZA_CLIMATIZADAS', 'QT_SALAS_UTILIZADAS_ACESSIVEIS',
  'QT_EQUIP_DVD', 'QT_EQUIP_SOM', 'QT_EQUIP_TV', 'QT_EQUIP_LOUSA_DIGITAL', 'QT_EQUIP_MULTIMIDIA',
  'QT_DESKTOP_ALUNO', 'QT_COMP_PORTATIL_ALUNO', 'QT_TABLET_ALUNO',
  'IN_ACESSIBILIDADE_CORRIMAO', 'IN_ACESSIBILIDADE_ELEVADOR', 'IN_ACESSIBILIDADE_PISOS_TATEIS',
  'IN_ACESSIBILIDADE_VAO_LIVRE', 'IN_ACESSIBILIDADE_RAMPAS',
  'IN_ACESSIBILIDADE_SINAL_SONORO', 'IN_ACESSIBILIDADE_SINAL_TATIL', 'IN_ACESSIBILIDADE_SINAL_VISUAL',
  'IN_ACESSIBILIDADE_INEXISTENTE',
  'IN_MATERIAL_PED_MUSICAL', 'IN_MATERIAL_PED_JOGOS', 'IN_MATERIAL_PED_ARTISTICAS',
  'IN_MATERIAL_PED_PROFISSIONAL', 'IN_MATERIAL_PED_DESPORTIVA',
  'IN_MATERIAL_PED_INDIGENA', 'IN_MATERIAL_PED_ETNICO', 'IN_MATERIAL_PED_CAMPO',
  'IN_MATERIAL_PED_QUILOMBOLA', 'IN_MATERIAL_PED_EDU_ESP', 'IN_MATERIAL_PED_NENHUM',
  'IN_LOCAL_FUNC_PREDIO_ESCOLAR', 'IN_PREDIO_COMPARTILHADO',
  'IN_ORGAO_CONSELHO_ESCOLAR', 'IN_ORGAO_ASS_PAIS_MESTRES', 'IN_ORGAO_GREMIO_ESTUDANTIL',
  'IN_TRATAMENTO_LIXO_SEPARACAO',
  'IN_REDES_SOCIAIS', 'IN_EDUC_AMBIENTAL',
  'IN_VIVEIRO',
  'IN_BANHEIRO', 'IN_BANHEIRO_EI', 'IN_BANHEIRO_PNE', 'IN_BANHEIRO_FUNCIONARIOS', 'IN_BANHEIRO_CHUVEIRO',
  'IN_COMPUTADOR', 'IN_EQUIP_IMPRESSORA', 'IN_EQUIP_COPIADORA', 'IN_EQUIP_SCANNER',
  'IN_INTERNET_ADMINISTRATIVO', 'IN_INTERNET_COMUNIDADE',
  'IN_ACESSO_INTERNET_COMPUTADOR', 'IN_ACES_INTERNET_DISP_PESSOAIS',
  'IN_MATERIAL_PED_MULTIMIDIA', 'IN_MATERIAL_PED_INFANTIL', 'IN_MATERIAL_PED_CIENTIFICO', 'IN_MATERIAL_PED_DIFUSAO',
  'QT_PROF_ADMINISTRATIVOS', 'QT_PROF_SERVICOS_GERAIS', 'QT_PROF_BIBLIOTECARIO',
  'QT_PROF_SAUDE', 'QT_PROF_COORDENADOR', 'QT_PROF_FONAUDIOLOGO',
  'QT_PROF_NUTRICIONISTA', 'QT_PROF_PSICOLOGO', 'QT_PROF_ALIMENTACAO',
  'QT_PROF_PEDAGOGIA', 'QT_PROF_SECRETARIO', 'QT_PROF_SEGURANCA',
  'QT_PROF_MONITORES', 'QT_PROF_GESTAO', 'QT_PROF_ASSIST_SOCIAL', 'QT_PROF_TRAD_LIBRAS',
  'QT_DOC_INF', 'QT_DOC_INF_CRE', 'QT_DOC_INF_PRE',
  'QT_DOC_FUND', 'QT_DOC_FUND_AI', 'QT_DOC_FUND_AF',
  'QT_DOC_MED', 'QT_DOC_EJA', 'QT_DOC_EJA_FUND', 'QT_DOC_EJA_MED',
  'QT_DOC_ESP', 'QT_DOC_ESP_CC', 'QT_DOC_ESP_CE',
  'QT_DOC_PROF', 'QT_DOC_PROF_TEC',
  'QT_TUR_INF', 'QT_TUR_INF_CRE', 'QT_TUR_INF_PRE',
  'QT_TUR_FUND', 'QT_TUR_FUND_AI', 'QT_TUR_FUND_AF',
  'QT_TUR_MED', 'QT_TUR_EJA', 'QT_TUR_EJA_FUND', 'QT_TUR_EJA_MED',
  'QT_TUR_ESP', 'QT_TUR_ESP_CC', 'QT_TUR_ESP_CE',
  'QT_TUR_PROF', 'QT_TUR_PROF_TEC',
  'QT_TUR_BAS_D', 'QT_TUR_BAS_N', 'QT_TUR_BAS_EAD',
  'QT_TUR_FUND_AI_INT', 'QT_TUR_FUND_AF_INT', 'QT_TUR_FUND_INT',
  'QT_TUR_INF_INT', 'QT_TUR_INF_CRE_INT', 'QT_TUR_INF_PRE_INT',
  'QT_TUR_MED_INT',
  'QT_MAT_BAS_BRANCA', 'QT_MAT_BAS_PRETA', 'QT_MAT_BAS_PARDA',
  'QT_MAT_BAS_AMARELA', 'QT_MAT_BAS_INDIGENA', 'QT_MAT_BAS_ND',
  'QT_MAT_BAS_0_3', 'QT_MAT_BAS_4_5', 'QT_MAT_BAS_6_10',
  'QT_MAT_BAS_11_14', 'QT_MAT_BAS_15_17', 'QT_MAT_BAS_18_MAIS',
  'QT_MAT_ZR_URB', 'QT_MAT_ZR_RUR',
  'QT_MAT_FUND_INT', 'QT_MAT_FUND_AI_INT', 'QT_MAT_FUND_AF_INT',
  'QT_MAT_INF_INT', 'QT_MAT_INF_CRE_INT', 'QT_MAT_INF_PRE_INT',
  'QT_MAT_MED_INT',
  'QT_TRANSP_PUBLICO', 'QT_TRANSP_RESP_EST', 'QT_TRANSP_RESP_MUN',
]);

async function importCensoLite(filePath, ano) {
  const dbPath = path.join(__dirname, '..', 'dev.db');
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = OFF");
  db.pragma("cache_size = -64000");

  console.log(`[LITE] Using INSERT OR REPLACE for ${ano} data...`);

  const stmt = db.prepare(`INSERT OR REPLACE INTO censo_escolar (inep, ano, nome, municipio, uf, dependencia, localizacao, situacao, matriculas, docentes, turmas, dados, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const fileStream = fs.createReadStream(filePath, { encoding: "latin1" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let headers = [];
  let headerIndices = {};
  let lineCount = 0;
  let imported = 0;
  let batch = [];
  const BATCH_SIZE = 20000;
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
