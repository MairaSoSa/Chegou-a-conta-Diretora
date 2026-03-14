#!/usr/bin/env node
/**
 * seed-demo.mjs — Insere 3 escolas de exemplo realistas no banco SQLite
 * para que o painel de Dados Educacionais funcione sem precisar importar
 * os microdados do INEP (arquivos grandes, ~1h de download).
 *
 * Uso: node scripts/seed-demo.mjs
 * É seguro rodar várias vezes (idempotente).
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawDbPath = (process.env.SQLITE_DATABASE_URL || "file:dev.db").replace("file:", "");
const resolvedPath = path.isAbsolute(rawDbPath) ? rawDbPath : path.join(process.cwd(), rawDbPath);
const db = new Database(resolvedPath, { timeout: 5000 });
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

const now = Math.floor(Date.now() / 1000);

// ── Escolas demo ────────────────────────────────────────────────────────────
const ESCOLAS = [
  {
    inep: "35000001",
    nome: "EMEF JARDIM DAS ACÁCIAS",
    uf: "SP",
    municipio: "São Paulo",
    co_municipio: "3550308",
    regiao: "Sudeste",
    dependencia: "Municipal",
    localizacao: "Urbana",
  },
  {
    inep: "31000002",
    nome: "EE PROF MARIA DA CONCEIÇÃO SILVA",
    uf: "MG",
    municipio: "Belo Horizonte",
    co_municipio: "3106200",
    regiao: "Sudeste",
    dependencia: "Estadual",
    localizacao: "Urbana",
  },
  {
    inep: "43000003",
    nome: "EMEF ASSIS BRASIL",
    uf: "RS",
    municipio: "Porto Alegre",
    co_municipio: "4314902",
    regiao: "Sul",
    dependencia: "Municipal",
    localizacao: "Urbana",
  },
];

// ── Dados do censo por escola e ano ─────────────────────────────────────────
function censoBase(escola, ano) {
  // Factor de crescimento entre anos
  const f = { 2022: 0.92, 2023: 0.96, 2024: 1.0 }[ano] ?? 1.0;
  const varEscola = { "35000001": 1.2, "31000002": 0.9, "43000003": 0.75 }[escola.inep] ?? 1.0;

  const mat_fund_ai = Math.round(240 * f * varEscola);
  const mat_fund_af = Math.round(180 * f * varEscola);
  const mat_med = escola.dependencia === "Municipal" ? 0 : Math.round(120 * f * varEscola);
  const mat_bas = mat_fund_ai + mat_fund_af + mat_med;
  const docentes = Math.round(mat_bas / 18);
  const turmas = Math.round(mat_bas / 28);
  const salas = turmas + 2;

  return {
    co_entidade: parseInt(escola.inep),
    no_entidade: escola.nome,
    sg_uf: escola.uf,
    no_municipio: escola.municipio,
    co_municipio: escola.co_municipio,
    no_regiao: escola.regiao,
    ds_dependencia: escola.dependencia,
    ds_localizacao: escola.localizacao,
    ds_situacao: "Em Atividade",
    tp_dependencia: escola.dependencia === "Municipal" ? 3 : 2,
    tp_localizacao: 1,
    tp_situacao_funcionamento: 1,
    tp_aee: 1,
    tp_regulamentacao: 1,
    tp_responsavel_regulamentacao: 3,
    // Matrículas totais
    qt_mat_bas: mat_bas,
    qt_mat_fund: mat_fund_ai + mat_fund_af,
    qt_mat_fund_ai: mat_fund_ai,
    qt_mat_fund_af: mat_fund_af,
    qt_mat_med: mat_med,
    qt_mat_inf: 0,
    qt_mat_inf_cre: 0,
    qt_mat_inf_pre: 0,
    qt_mat_eja: Math.round(30 * f * varEscola),
    qt_mat_eja_fund: Math.round(20 * f * varEscola),
    qt_mat_eja_med: Math.round(10 * f * varEscola),
    qt_mat_esp: Math.round(18 * f * varEscola),
    qt_mat_esp_cc: Math.round(14 * f * varEscola),
    qt_mat_esp_ce: Math.round(4 * f * varEscola),
    // Anos do Fund. AI
    qt_mat_fund_ai_1: Math.round(mat_fund_ai * 0.20),
    qt_mat_fund_ai_2: Math.round(mat_fund_ai * 0.21),
    qt_mat_fund_ai_3: Math.round(mat_fund_ai * 0.20),
    qt_mat_fund_ai_4: Math.round(mat_fund_ai * 0.20),
    qt_mat_fund_ai_5: Math.round(mat_fund_ai * 0.19),
    // Anos do Fund. AF
    qt_mat_fund_af_6: Math.round(mat_fund_af * 0.26),
    qt_mat_fund_af_7: Math.round(mat_fund_af * 0.25),
    qt_mat_fund_af_8: Math.round(mat_fund_af * 0.25),
    qt_mat_fund_af_9: Math.round(mat_fund_af * 0.24),
    // Séries do Médio
    qt_mat_med_prop_1: Math.round(mat_med * 0.38),
    qt_mat_med_prop_2: Math.round(mat_med * 0.33),
    qt_mat_med_prop_3: Math.round(mat_med * 0.29),
    qt_mat_med_prop_4: 0,
    // Por turno
    qt_mat_bas_d: Math.round(mat_bas * 0.92),
    qt_mat_bas_n: Math.round(mat_bas * 0.08),
    qt_mat_bas_ead: 0,
    // Por sexo
    qt_mat_bas_fem: Math.round(mat_bas * 0.49),
    qt_mat_bas_masc: Math.round(mat_bas * 0.51),
    qt_mat_bas_nd: 0,
    // Por cor/raça
    qt_mat_bas_branca: Math.round(mat_bas * 0.38),
    qt_mat_bas_preta: Math.round(mat_bas * 0.10),
    qt_mat_bas_parda: Math.round(mat_bas * 0.46),
    qt_mat_bas_amarela: Math.round(mat_bas * 0.02),
    qt_mat_bas_indigena: Math.round(mat_bas * 0.01),
    // Por faixa etária
    qt_mat_bas_0_3: 0,
    qt_mat_bas_4_5: 0,
    qt_mat_bas_6_10: mat_fund_ai,
    qt_mat_bas_11_14: mat_fund_af,
    qt_mat_bas_15_17: mat_med,
    qt_mat_bas_18_mais: Math.round(30 * f * varEscola),
    // Por zona
    qt_mat_zr_urb: Math.round(mat_bas * 0.95),
    qt_mat_zr_rur: Math.round(mat_bas * 0.05),
    // Integral
    qt_mat_inf_int: 0,
    qt_mat_fund_ai_int: Math.round(mat_fund_ai * 0.25),
    qt_mat_fund_af_int: 0,
    qt_mat_med_int: 0,
    // Transporte
    qt_transp_publico: Math.round(mat_bas * 0.12),
    qt_transp_resp_est: Math.round(mat_bas * 0.03),
    qt_transp_resp_mun: Math.round(mat_bas * 0.09),
    // Docentes
    qt_doc_bas: docentes,
    qt_doc_inf: 0,
    qt_doc_inf_cre: 0,
    qt_doc_inf_pre: 0,
    qt_doc_fund: Math.round(docentes * 0.78),
    qt_doc_fund_ai: Math.round(docentes * 0.42),
    qt_doc_fund_af: Math.round(docentes * 0.36),
    qt_doc_med: mat_med > 0 ? Math.round(docentes * 0.22) : 0,
    qt_doc_prof: 0,
    qt_doc_eja: Math.round(docentes * 0.05),
    qt_doc_esp: Math.round(docentes * 0.08),
    qt_doc_esp_cc: Math.round(docentes * 0.06),
    qt_doc_esp_ce: Math.round(docentes * 0.02),
    // Turmas
    qt_tur_bas: turmas,
    qt_tur_inf: 0,
    qt_tur_inf_cre: 0,
    qt_tur_inf_pre: 0,
    qt_tur_fund: Math.round(turmas * 0.82),
    qt_tur_fund_ai: Math.round(turmas * 0.44),
    qt_tur_fund_af: Math.round(turmas * 0.38),
    qt_tur_med: mat_med > 0 ? Math.round(turmas * 0.18) : 0,
    qt_tur_prof: 0,
    qt_tur_eja: 2,
    qt_tur_esp: 1,
    qt_tur_esp_cc: 1,
    qt_tur_esp_ce: 0,
    qt_tur_bas_d: turmas - 2,
    qt_tur_bas_n: 2,
    // Salas
    qt_salas_utilizadas: salas,
    qt_salas_utilizadas_dentro: salas - 1,
    qt_salas_utilizadas_fora: 1,
    qt_salas_utiliza_climatizadas: Math.round(salas * 0.6),
    qt_salas_utilizadas_acessiveis: Math.round(salas * 0.4),
    // Equipamentos
    qt_equip_dvd: 2,
    qt_equip_som: 4,
    qt_equip_tv: 8,
    qt_equip_lousa_digital: 3,
    qt_equip_multimidia: 5,
    qt_desktop_aluno: Math.round(mat_bas * 0.08),
    qt_comp_portatil_aluno: Math.round(mat_bas * 0.05),
    qt_tablet_aluno: Math.round(mat_bas * 0.03),
    // Profissionais não-docentes
    qt_prof_administrativos: 6,
    qt_prof_servicos_gerais: 8,
    qt_prof_bibliotecario: 1,
    qt_prof_saude: 1,
    qt_prof_coordenador: 3,
    qt_prof_fonaudiologo: 0,
    qt_prof_nutricionista: 1,
    qt_prof_psicologo: 0,
    qt_prof_alimentacao: 4,
    qt_prof_pedagogia: 2,
    qt_prof_secretario: 2,
    qt_prof_seguranca: 3,
    qt_prof_monitores: 2,
    qt_prof_gestao: 1,
    qt_prof_assist_social: 1,
    qt_prof_trad_libras: 0,
    // Infraestrutura básica (1=Sim, 0=Não)
    in_agua_potavel: 1,
    in_agua_rede_publica: 1,
    in_agua_poco_artesiano: 0,
    in_agua_cacimba: 0,
    in_agua_fonte_rio: 0,
    in_agua_inexistente: 0,
    in_agua_carro_pipa: 0,
    in_energia_rede_publica: 1,
    in_energia_gerador_fossil: 0,
    in_energia_renovavel: 0,
    in_energia_inexistente: 0,
    in_esgoto_rede_publica: 1,
    in_esgoto_fossa_septica: 0,
    in_esgoto_fossa_comum: 0,
    in_esgoto_fossa: 0,
    in_esgoto_inexistente: 0,
    in_lixo_servico_coleta: 1,
    in_lixo_queima: 0,
    in_lixo_enterra: 0,
    in_lixo_destino_final_publico: 1,
    // Internet
    in_internet: 1,
    in_internet_alunos: 1,
    in_internet_aprendizagem: 1,
    in_banda_larga: 1,
    in_internet_administrativo: 1,
    in_internet_comunidade: 0,
    in_acesso_internet_computador: 1,
    in_aces_internet_disp_pessoais: 1,
    // Computador
    in_computador: 1,
    in_equip_impressora: 1,
    in_equip_copiadora: 1,
    in_equip_scanner: 0,
    // Espaços físicos
    in_biblioteca: 1,
    in_biblioteca_sala_leitura: 1,
    in_laboratorio_informatica: 1,
    in_laboratorio_ciencias: 0,
    in_laboratorio_educ_prof: 0,
    in_quadra_esportes_coberta: 1,
    in_quadra_esportes_descoberta: 0,
    in_cozinha: 1,
    in_despensa: 1,
    in_refeitorio: 1,
    in_almoxarifado: 1,
    in_patio_coberto: 1,
    in_patio_descoberto: 1,
    in_parque_infantil: 0,
    in_auditorio: 0,
    in_piscina: 0,
    in_area_verde: 1,
    in_sala_multiuso: 1,
    in_sala_diretoria: 1,
    in_sala_professor: 1,
    in_secretaria: 1,
    in_sala_atendimento_especial: 1,
    in_sala_atelie_artes: 0,
    in_sala_musica_coral: 0,
    in_viveiro: 0,
    // Banheiros
    in_banheiro: 1,
    in_banheiro_ei: 0,
    in_banheiro_pne: 1,
    in_banheiro_funcionarios: 1,
    in_banheiro_chuveiro: 1,
    // Acessibilidade
    in_acessibilidade_rampas: 1,
    in_acessibilidade_corrimao: 1,
    in_acessibilidade_elevador: 0,
    in_acessibilidade_pisos_tateis: 0,
    in_acessibilidade_vao_livre: 1,
    in_acessibilidade_sinal_sonoro: 0,
    in_acessibilidade_sinal_tatil: 0,
    in_acessibilidade_sinal_visual: 0,
    // Organização escolar
    in_orgao_conselho_escolar: 1,
    in_orgao_ass_pais_mestres: 1,
    in_orgao_gremio_estudantil: 0,
    in_redes_sociais: 1,
    in_educ_ambiental: 1,
    in_predio_compartilhado: 0,
    in_local_func_predio_escolar: 1,
    in_alimentacao: 1,
    // Etapas e modalidades
    in_inf: 0,
    in_inf_cre: 0,
    in_inf_pre: 0,
    in_fund: 1,
    in_fund_ai: 1,
    in_fund_af: 1,
    in_med: mat_med > 0 ? 1 : 0,
    in_prof: 0,
    in_eja: 1,
    in_eja_fund: 1,
    in_eja_med: 1,
    in_esp: 1,
    // Material pedagógico
    in_material_ped_multimidia: 1,
    in_material_ped_infantil: 0,
    in_material_ped_cientifico: 1,
    in_material_ped_difusao: 1,
    in_material_ped_musical: 0,
    in_material_ped_jogos: 1,
    in_material_ped_artisticas: 1,
    in_material_ped_profissional: 0,
    in_material_ped_desportiva: 1,
    in_material_ped_indigena: 0,
    in_material_ped_etnico: 0,
    in_material_ped_quilombola: 0,
    in_material_ped_edu_esp: 1,
    // Contato (opcional)
    telefone: "",
  };
}

// ── Indicadores por escola e ano ─────────────────────────────────────────────
function indicadoresData(escola, ano) {
  const f = { 2022: 0.94, 2023: 0.97, 2024: 1.0 }[ano] ?? 1.0;
  const v = { "35000001": 1.08, "31000002": 0.96, "43000003": 1.02 }[escola.inep] ?? 1.0;

  return [
    {
      tipo: "taxas_rendimento",
      dados: {
        co_entidade: parseInt(escola.inep),
        aprovacao_fund: parseFloat((92.4 * f * Math.min(v, 1.05)).toFixed(1)),
        aprovacao_fund_ai: parseFloat((94.1 * f * Math.min(v, 1.05)).toFixed(1)),
        aprovacao_fund_af: parseFloat((90.3 * f * Math.min(v, 1.05)).toFixed(1)),
        aprovacao_medio: escola.dependencia === "Estadual" ? parseFloat((87.5 * f * v).toFixed(1)) : null,
        reprovacao_fund: parseFloat((4.8 / f / v).toFixed(1)),
        reprovacao_fund_ai: parseFloat((3.6 / f / v).toFixed(1)),
        reprovacao_fund_af: parseFloat((6.2 / f / v).toFixed(1)),
        reprovacao_medio: escola.dependencia === "Estadual" ? parseFloat((7.1 / f / v).toFixed(1)) : null,
        abandono_fund: parseFloat((2.8 / f / v).toFixed(1)),
        abandono_fund_ai: parseFloat((2.3 / f / v).toFixed(1)),
        abandono_fund_af: parseFloat((3.5 / f / v).toFixed(1)),
        abandono_medio: escola.dependencia === "Estadual" ? parseFloat((5.4 / f / v).toFixed(1)) : null,
      },
    },
    {
      tipo: "ideb",
      dados: {
        co_entidade: parseInt(escola.inep),
        ideb_ai: ano >= 2023 ? parseFloat((5.8 * v).toFixed(1)) : parseFloat((5.4 * v).toFixed(1)),
        meta_ai: 5.5,
        ideb_af: parseFloat((4.9 * v).toFixed(1)),
        meta_af: 4.7,
        ideb_em: escola.dependencia === "Estadual" ? parseFloat((4.2 * v).toFixed(1)) : null,
        meta_em: escola.dependencia === "Estadual" ? 4.0 : null,
      },
    },
    {
      tipo: "tdi",
      dados: {
        co_entidade: parseInt(escola.inep),
        fundamental_total: parseFloat((14.2 / v / f).toFixed(1)),
        fundamental_ai: parseFloat((10.1 / v / f).toFixed(1)),
        fundamental_af: parseFloat((18.6 / v / f).toFixed(1)),
        medio_total: escola.dependencia === "Estadual" ? parseFloat((22.3 / v / f).toFixed(1)) : null,
      },
    },
    {
      tipo: "icg",
      dados: {
        co_entidade: parseInt(escola.inep),
        nivel: 3,
        nivel_texto: "Nível 3",
      },
    },
    {
      tipo: "inse",
      dados: {
        co_entidade: parseInt(escola.inep),
        media: parseFloat((5.12 * v).toFixed(2)),
        nivel_predominante: "IV",
        percentual_nivel_i: 8.2,
        percentual_nivel_ii: 15.4,
        percentual_nivel_iii: 22.1,
        percentual_nivel_iv: 28.8,
        percentual_nivel_v: 16.3,
        percentual_nivel_vi: 6.4,
        percentual_nivel_vii: 2.8,
        percentual_nivel_viii: 0.0,
      },
    },
    {
      tipo: "ird",
      dados: {
        co_entidade: parseInt(escola.inep),
        ird_fund: parseFloat((3.62 * v).toFixed(2)),
        ird_fund_ai: parseFloat((3.88 * v).toFixed(2)),
        ird_fund_af: parseFloat((3.41 * v).toFixed(2)),
        ird_medio: escola.dependencia === "Estadual" ? parseFloat((3.12 * v).toFixed(2)) : null,
        media: parseFloat((3.62 * v).toFixed(2)),
      },
    },
    {
      tipo: "dsu",
      dados: {
        co_entidade: parseInt(escola.inep),
        dsu_fund: parseFloat((91.4 * Math.min(v, 1.08)).toFixed(1)),
        dsu_fund_ai: parseFloat((89.6 * Math.min(v, 1.08)).toFixed(1)),
        dsu_fund_af: parseFloat((93.5 * Math.min(v, 1.08)).toFixed(1)),
        dsu_medio: escola.dependencia === "Estadual" ? 95.2 : null,
        fundamental_total: parseFloat((91.4 * Math.min(v, 1.08)).toFixed(1)),
      },
    },
    {
      tipo: "atu",
      dados: {
        co_entidade: parseInt(escola.inep),
        atu_fund: parseFloat((28.4 / (v * 0.9)).toFixed(1)),
        fund: parseFloat((28.4 / (v * 0.9)).toFixed(1)),
        atu_fund_ai: parseFloat((27.1 / (v * 0.9)).toFixed(1)),
        fund_ai: parseFloat((27.1 / (v * 0.9)).toFixed(1)),
        atu_fund_af: parseFloat((30.2 / (v * 0.9)).toFixed(1)),
        fund_af: parseFloat((30.2 / (v * 0.9)).toFixed(1)),
        atu_medio: escola.dependencia === "Estadual" ? parseFloat((34.8 / (v * 0.9)).toFixed(1)) : null,
        medio: escola.dependencia === "Estadual" ? parseFloat((34.8 / (v * 0.9)).toFixed(1)) : null,
        fundamental_total: parseFloat((28.4 / (v * 0.9)).toFixed(1)),
      },
    },
    {
      tipo: "had",
      dados: {
        co_entidade: parseInt(escola.inep),
        had_fund: 4.8,
        fund: 4.8,
        had_fund_ai: 4.6,
        fund_ai: 4.6,
        had_fund_af: 5.1,
        fund_af: 5.1,
        had_medio: escola.dependencia === "Estadual" ? 5.4 : null,
        medio: escola.dependencia === "Estadual" ? 5.4 : null,
        fundamental_total: 4.8,
      },
    },
    {
      tipo: "afd",
      dados: {
        co_entidade: parseInt(escola.inep),
        grupo_1: parseFloat((88.2 * v).toFixed(1)),
        afd_grupo_1: parseFloat((88.2 * v).toFixed(1)),
        grupo_2: parseFloat((7.4 / v).toFixed(1)),
        grupo_3: parseFloat((3.2 / v).toFixed(1)),
        grupo_4: parseFloat((1.2 / v).toFixed(1)),
      },
    },
    {
      tipo: "ied",
      dados: {
        co_entidade: parseInt(escola.inep),
        nivel_1: 12.4,
        nivel_2: 18.6,
        nivel_3: 28.2,
        nivel_4: 22.8,
        nivel_5: 13.4,
        nivel_6: 4.6,
      },
    },
    {
      tipo: "saeb",
      dados: {
        co_entidade: parseInt(escola.inep),
        mt_ai: parseFloat((232.4 * v).toFixed(1)),
        lp_ai: parseFloat((226.8 * v).toFixed(1)),
        mt_af: parseFloat((268.6 * v).toFixed(1)),
        lp_af: parseFloat((274.2 * v).toFixed(1)),
        mt_em: escola.dependencia === "Estadual" ? parseFloat((282.4 * v).toFixed(1)) : null,
        lp_em: escola.dependencia === "Estadual" ? parseFloat((286.1 * v).toFixed(1)) : null,
      },
    },
    {
      tipo: "taxa_nao_resposta",
      dados: {
        co_entidade: parseInt(escola.inep),
        fund: parseFloat((3.8 / v).toFixed(1)),
        med: escola.dependencia === "Estadual" ? parseFloat((5.2 / v).toFixed(1)) : null,
      },
    },
  ];
}

// ── Execução principal ────────────────────────────────────────────────────────
const insertCenso = db.prepare(`
  INSERT OR IGNORE INTO censo_escolar (inep, ano, nome, municipio, uf, dependencia, localizacao, situacao, matriculas, docentes, turmas, dados, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const checkIndicador = db.prepare(`
  SELECT id FROM indicadores_educacionais WHERE inep = ? AND ano = ? AND tipo = ? LIMIT 1
`);
const insertIndicador = db.prepare(`
  INSERT INTO indicadores_educacionais (inep, ano, tipo, dados, updated_at)
  VALUES (?, ?, ?, ?, ?)
`);
const updateIndicador = db.prepare(`
  UPDATE indicadores_educacionais SET dados = ?, updated_at = ? WHERE inep = ? AND ano = ? AND tipo = ?
`);

let censoInserted = 0;
let indicadoresInserted = 0;

const ANOS = [2022, 2023, 2024];

for (const escola of ESCOLAS) {
  for (const ano of ANOS) {
    const dados = censoBase(escola, ano);

    const r1 = insertCenso.run(
      escola.inep,
      ano,
      escola.nome,
      escola.municipio,
      escola.uf,
      escola.dependencia,
      escola.localizacao,
      "Em Atividade",
      dados.qt_mat_bas,
      dados.qt_doc_bas,
      dados.qt_tur_bas,
      JSON.stringify(dados),
      now
    );
    if (r1.changes > 0) censoInserted++;

    for (const ind of indicadoresData(escola, ano)) {
      // IDEB and SAEB only have data in odd years (like real INEP)
      if (["ideb", "saeb"].includes(ind.tipo) && ano % 2 === 0) continue;

      const existing = checkIndicador.get(escola.inep, ano, ind.tipo);
      if (existing) {
        updateIndicador.run(JSON.stringify(ind.dados), now, escola.inep, ano, ind.tipo);
      } else {
        insertIndicador.run(escola.inep, ano, ind.tipo, JSON.stringify(ind.dados), now);
        indicadoresInserted++;
      }
    }
  }
}

console.log(`✅ Seed concluído:`);
console.log(`   Censo: ${censoInserted} registros inseridos (${ESCOLAS.length} escolas × ${ANOS.length} anos)`);
console.log(`   Indicadores: ${indicadoresInserted} registros inseridos`);
console.log(``);
console.log(`📌 Códigos INEP das escolas demo:`);
ESCOLAS.forEach((e) => console.log(`   ${e.inep} — ${e.nome} (${e.municipio}/${e.uf})`));
console.log(``);
console.log(`ℹ  Use estes códigos no campo de busca do painel "Dados Educacionais".`);
