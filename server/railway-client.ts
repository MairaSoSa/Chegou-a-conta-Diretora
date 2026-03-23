const RAILWAY_API = "https://chegou-a-conta-diretora-api-production.up.railway.app";

const DEP_MAP: Record<number, string> = { 1: "Federal", 2: "Estadual", 3: "Municipal", 4: "Privada" };
const LOC_MAP: Record<number, string> = { 1: "Urbana", 2: "Rural" };
const SIT_MAP: Record<number, string> = { 1: "Em Atividade", 2: "Paralisada", 3: "Extinta", 4: "Extinta", 5: "Extinta" };

const serverCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function cacheGet(key: string) {
  const e = serverCache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL_MS) { serverCache.delete(key); return null; }
  return e.data;
}
function cacheSet(key: string, data: any) {
  serverCache.set(key, { data, ts: Date.now() });
}

async function fetchRailway(path: string, timeout = 8000): Promise<any | null> {
  try {
    const res = await fetch(`${RAILWAY_API}${path}`, {
      signal: AbortSignal.timeout(timeout),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function mapIndicadores(h: any): Record<string, any> {
  const ind: Record<string, any> = {};

  if (h.ideb_ai != null || h.ideb_af != null || h.ideb_em != null) {
    ind.ideb = { ideb_ai: h.ideb_ai, ideb_af: h.ideb_af, ideb_em: h.ideb_em };
  }

  if (h.nota_saeb_ai != null || h.nota_saeb_af != null || h.nota_saeb_em != null) {
    ind.saeb = {
      nota_mt_ai: h.nota_saeb_ai, nota_lp_ai: h.nota_saeb_ai,
      nota_mt_af: h.nota_saeb_af, nota_lp_af: h.nota_saeb_af,
      nota_mt_em: h.nota_saeb_em, nota_lp_em: h.nota_saeb_em,
    };
  }

  if (h.inse_dados_json) {
    const inse = h.inse_dados_json;
    ind.inse = {
      media_inse: inse.MEDIA_INSE ?? inse.INSE_VALOR_ABSOLUTO ?? h.inse_valor,
      valor: inse.MEDIA_INSE ?? inse.INSE_VALOR_ABSOLUTO ?? h.inse_valor,
      grupo: inse.INSE_CLASSIFICACAO ?? inse.NO_GRUPO ?? h.inse_grupo,
    };
  } else if (h.inse_valor != null) {
    ind.inse = { media_inse: h.inse_valor, valor: h.inse_valor, grupo: h.inse_grupo };
  }

  if (h.afd_dados_json) {
    const a = h.afd_dados_json;
    ind.afd = {
      fun_cat_1: a.FUN_CAT_1, fun_cat_2: a.FUN_CAT_2, fun_cat_3: a.FUN_CAT_3, fun_cat_4: a.FUN_CAT_4, fun_cat_5: a.FUN_CAT_5,
      med_cat_1: a.MED_CAT_1, med_cat_2: a.MED_CAT_2, med_cat_3: a.MED_CAT_3, med_cat_4: a.MED_CAT_4, med_cat_5: a.MED_CAT_5,
      ed_inf_cat_1: a.ED_INF_CAT_1,
    };
  }

  if (h.atu_dados_json) {
    const a = h.atu_dados_json;
    ind.atu = {
      media_fund: a.FUN_CAT_0,
      media_med: a.MED_CAT_0,
      media_fund_ai: a.FUN_AI_CAT_0,
      media_fund_af: a.FUN_AF_CAT_0,
      media_cre: a.CRE_CAT_0,
      media_pre: a.PRE_CAT_0,
      media_ed_inf: a.ED_INF_CAT_0,
    };
  }

  if (h.had_dados_json) {
    const a = h.had_dados_json;
    ind.had = {
      media_fund: a.FUN_CAT_0,
      media_med: a.MED_CAT_0,
      media_fund_ai: a.FUN_AI_CAT_0,
      media_fund_af: a.FUN_AF_CAT_0,
      media_cre: a.CRE_CAT_0,
    };
  }

  if (h.icg_dados_json) {
    const a = h.icg_dados_json;
    const complexStr: string = a.COMPLEX ?? a.NIVEL_CAT_0 ?? a.nivel ?? a.ICG_NIVEL ?? "";
    const nivelNum = parseInt(String(complexStr).replace(/\D/g, "")) || null;
    ind.icg = { nivel: nivelNum, nivel_label: complexStr };
  }

  if (h.ird_dados_json) {
    const a = h.ird_dados_json;
    ind.ird = { media_ird: a.EDU_BAS_CAT_0, media: a.EDU_BAS_CAT_0 };
  }

  if (h.tdi_dados_json) {
    const a = h.tdi_dados_json;
    ind.tdi = {
      fundamental_total: a.FUN_CAT_0  ?? null,
      medio_total:       a.MED_CAT_0  ?? null,
      fundamental_ai:    a.FUN_AI_CAT_0 ?? null,
      fundamental_af:    a.FUN_AF_CAT_0 ?? null,
      // Por série — Fundamental Anos Iniciais (1º–5º)
      fun_01: a.FUN_01_CAT_0 ?? null, fun_02: a.FUN_02_CAT_0 ?? null,
      fun_03: a.FUN_03_CAT_0 ?? null, fun_04: a.FUN_04_CAT_0 ?? null,
      fun_05: a.FUN_05_CAT_0 ?? null,
      // Por série — Fundamental Anos Finais (6º–9º)
      fun_06: a.FUN_06_CAT_0 ?? null, fun_07: a.FUN_07_CAT_0 ?? null,
      fun_08: a.FUN_08_CAT_0 ?? null, fun_09: a.FUN_09_CAT_0 ?? null,
      // Por série — Ensino Médio (1ª–4ª)
      med_01: a.MED_01_CAT_0 ?? null, med_02: a.MED_02_CAT_0 ?? null,
      med_03: a.MED_03_CAT_0 ?? null, med_04: a.MED_04_CAT_0 ?? null,
    };
  }

  if (h.tnr_dados_json) {
    const a = h.tnr_dados_json;
    // Dois formatos: 2020 usa FUN_01_CAT4, 2021+ usa 4_CAT_FUN_01
    const f = (new4: string, old4: string) => a[new4] ?? a[old4] ?? null;
    const tnrFund = a["4_CAT_FUN"] ?? a.FUN_CAT_0 ?? a.FUND_CAT_0 ?? null;
    const tnrMed  = a["4_CAT_MED"] ?? a.MED_CAT_0 ?? null;
    ind.taxa_nao_resposta = {
      taxa_nao_resposta_fund: tnrFund,
      taxa_nao_resposta_med: tnrMed,
      taxa_nao_resposta_fund_ai: a["4_CAT_FUN_AI"] ?? a.FUN_AI_CAT4 ?? null,
      taxa_nao_resposta_fund_af: a["4_CAT_FUN_AF"] ?? a.FUN_AF_CAT4 ?? null,
      tnr_fund: tnrFund,
      tnr_med: tnrMed,
      tnr_fun_01: f("4_CAT_FUN_01","FUN_01_CAT4"), tnr_fun_02: f("4_CAT_FUN_02","FUN_02_CAT4"),
      tnr_fun_03: f("4_CAT_FUN_03","FUN_03_CAT4"), tnr_fun_04: f("4_CAT_FUN_04","FUN_04_CAT4"),
      tnr_fun_05: f("4_CAT_FUN_05","FUN_05_CAT4"), tnr_fun_06: f("4_CAT_FUN_06","FUN_06_CAT4"),
      tnr_fun_07: f("4_CAT_FUN_07","FUN_07_CAT4"), tnr_fun_08: f("4_CAT_FUN_08","FUN_08_CAT4"),
      tnr_fun_09: f("4_CAT_FUN_09","FUN_09_CAT4"),
      tnr_med_01: a["4_CAT_MED_01"] ?? a.MED_01_CAT4 ?? null,
      tnr_med_02: a["4_CAT_MED_02"] ?? a.MED_02_CAT4 ?? null,
      tnr_med_03: a["4_CAT_MED_03"] ?? a.MED_03_CAT4 ?? null,
      tnr_med_04: a["4_CAT_MED_04"] ?? a.MED_04_CAT4 ?? null,
    };
  }

  if (h.rendimento_dados_json) {
    const a = h.rendimento_dados_json;
    // Helper: pega valor numérico de coluna Unnamed ou null se "--"/ausente
    const u = (idx: number) => { const v = a[`Unnamed: ${idx}`]; return (v != null && v !== '--') ? Number(v) : null; };
    const aprovTotal  = a["Taxa de Aprovação"]  ?? a.APROV_BAS_CAT_0  ?? a.aprovacao_total  ?? null;
    const abandTotal  = a["Taxa de Abandono"]   ?? a.ABAND_BAS_CAT_0  ?? a.abandono_total   ?? null;
    const reprovTotal = a["Taxa de Reprovação"] ?? a.REPROV_BAS_CAT_0 ?? a.reprovacao_total  ?? null;
    const aprovFund  = a.APROV_FUN_CAT_0  ?? null;
    const abandFund  = a.ABAND_FUN_CAT_0  ?? null;
    const reprovFund = a.REPROV_FUN_CAT_0 ?? null;
    const aprovMed   = a.APROV_MED_CAT_0  ?? u(21) ?? null;
    const abandMed   = a.ABAND_MED_CAT_0  ?? u(57) ?? null;
    const reprovMed  = a.REPROV_MED_CAT_0 ?? u(39) ?? null;
    // Unnamed column mapping (INEP sheet structure):
    // Aprovação:  AI=10, AF=11, 1o-5o=12-16, 6o-9o=17-20, EM=21, 1a-3a=22-24
    // Reprovação: +18 de aprovação
    // Abandono:   +36 de aprovação
    ind.taxas_rendimento = {
      aprovacao_total:    aprovTotal,
      abandono_total:     abandTotal,
      reprovacao_total:   reprovTotal,
      aprovacao_fund:     aprovFund  ?? aprovTotal,
      abandono_fund:      abandFund  ?? abandTotal,
      reprovacao_fund:    reprovFund ?? reprovTotal,
      aprovacao_med:      aprovMed,
      abandono_med:       abandMed,
      reprovacao_med:     reprovMed,
      aprovacao_fund_ai:  u(10),
      aprovacao_fund_af:  u(11),
      reprovacao_fund_ai: u(28),
      reprovacao_fund_af: u(29),
      abandono_fund_ai:   u(46),
      abandono_fund_af:   u(47),
      // Por série — Fundamental Anos Iniciais (1º–5º)
      aprovacao_fun_01: u(12), aprovacao_fun_02: u(13), aprovacao_fun_03: u(14), aprovacao_fun_04: u(15), aprovacao_fun_05: u(16),
      reprovacao_fun_01: u(30), reprovacao_fun_02: u(31), reprovacao_fun_03: u(32), reprovacao_fun_04: u(33), reprovacao_fun_05: u(34),
      abandono_fun_01: u(48), abandono_fun_02: u(49), abandono_fun_03: u(50), abandono_fun_04: u(51), abandono_fun_05: u(52),
      // Por série — Fundamental Anos Finais (6º–9º)
      aprovacao_fun_06: u(17), aprovacao_fun_07: u(18), aprovacao_fun_08: u(19), aprovacao_fun_09: u(20),
      reprovacao_fun_06: u(35), reprovacao_fun_07: u(36), reprovacao_fun_08: u(37), reprovacao_fun_09: u(38),
      abandono_fun_06: u(53), abandono_fun_07: u(54), abandono_fun_08: u(55), abandono_fun_09: u(56),
      // Por série — Ensino Médio (1ª–3ª)
      aprovacao_med_01: u(22), aprovacao_med_02: u(23), aprovacao_med_03: u(24),
      reprovacao_med_01: u(40), reprovacao_med_02: u(41), reprovacao_med_03: u(42),
      abandono_med_01: u(58), abandono_med_02: u(59), abandono_med_03: u(60),
    };
  } else if (h.taxa_aprovacao_ai != null || h.taxa_aprovacao_af != null) {
    ind.taxas_rendimento = {
      aprovacao_fund: h.taxa_aprovacao_ai ?? h.taxa_aprovacao_af,
      aprovacao_total: h.taxa_aprovacao_ai ?? h.taxa_aprovacao_af,
    };
  }

  if (h.ied_dados_json) {
    const a = h.ied_dados_json;
    ind.ied = {
      nivel_1: a.NIVEL_1_CAT_0 ?? a.nivel_1,
      nivel_2: a.NIVEL_2_CAT_0 ?? a.nivel_2,
      nivel_3: a.NIVEL_3_CAT_0 ?? a.nivel_3,
      nivel_4: a.NIVEL_4_CAT_0 ?? a.nivel_4,
      nivel_5: a.NIVEL_5_CAT_0 ?? a.nivel_5,
      nivel_6: a.NIVEL_6_CAT_0 ?? a.nivel_6,
    };
  }

  return ind;
}

function n(v: any): number | null { return v != null ? Number(v) : null; }
function b(v: any): number | null { return v != null ? Number(v) : null; }

// Extrai dados completos de censo + infraestrutura dos objetos estruturados do /completo
function mapCensoRaw(escolaData: any, baseInfo: any): any {
  const raw  = escolaData?.raw                    ?? {};
  const dep  = escolaData?.dependencias           ?? {};
  const inf  = escolaData?.infraestrutura_saneamento ?? {};
  const tec  = escolaData?.tecnologia_conectividade  ?? {};
  const ace  = escolaData?.acessibilidade            ?? {};
  const ali  = escolaData?.alimentacao_servicos      ?? {};
  const str  = escolaData?.estrutura                 ?? {};
  const mat  = str.matriculas                        ?? {};
  const doc  = str.docentes                          ?? {};
  const tur  = str.turmas                            ?? {};
  const cap  = escolaData?.capacidade_fisica         ?? {};

  return {
    ...baseInfo,
    // ── Matrículas ──────────────────────────────────────────────────────────
    qt_mat_bas:  n(raw.qt_mat_bas  ?? mat.qt_mat_bas),
    qt_mat_inf:  n(raw.qt_mat_inf  ?? mat.qt_mat_inf),
    qt_mat_fund: n(raw.qt_mat_fund ?? mat.qt_mat_fund),
    qt_mat_med:  n(raw.qt_mat_med  ?? mat.qt_mat_med),
    qt_mat_eja:  n(raw.qt_mat_eja  ?? mat.qt_mat_eja),
    // ── Docentes ────────────────────────────────────────────────────────────
    qt_doc_bas:  n(raw.qt_doc_bas  ?? doc.qt_doc_bas),
    qt_doc_inf:  n(raw.qt_doc_inf  ?? doc.qt_doc_inf),
    qt_doc_fund: n(raw.qt_doc_fund ?? doc.qt_doc_fund),
    qt_doc_med:  n(raw.qt_doc_med  ?? doc.qt_doc_med),
    // ── Turmas ──────────────────────────────────────────────────────────────
    qt_tur_bas:  n(raw.qt_tur_bas  ?? tur.qt_tur_bas),
    qt_tur_inf:  n(raw.qt_tur_inf  ?? tur.qt_tur_inf),
    qt_tur_fund: n(raw.qt_tur_fund ?? tur.qt_tur_fund),
    qt_tur_med:  n(raw.qt_tur_med  ?? tur.qt_tur_med),
    // ── Salas ───────────────────────────────────────────────────────────────
    qt_salas_utilizadas:        n(raw.qt_salas_utilizadas        ?? cap.qt_salas_utilizadas),
    qt_salas_utilizadas_dentro: n(raw.qt_salas_utilizadas_dentro ?? cap.qt_salas_utilizadas_dentro),
    qt_salas_utilizadas_fora:   n(raw.qt_salas_utilizadas_fora   ?? cap.qt_salas_utilizadas_fora),
    // ── Saneamento / Água ───────────────────────────────────────────────────
    in_agua_potavel:          b(raw.in_agua_potavel        ?? inf.agua_potavel),
    in_agua_rede_publica:     b(raw.in_agua_rede_publica   ?? inf.agua_rede_publica),
    in_agua_poco_artesiano:   b(inf.agua_poco_artesiano),
    in_agua_cacimba:          b(inf.agua_cacimba),
    in_agua_fonte_rio:        b(inf.agua_fonte_rio),
    in_agua_carro_pipa:       b(inf.agua_carro_pipa),
    in_agua_inexistente:      b(inf.agua_inexistente),
    // ── Energia ─────────────────────────────────────────────────────────────
    in_energia_rede_publica:  b(raw.in_energia_rede_publica ?? inf.energia_rede_publica),
    in_energia_gerador_fossil: b(inf.energia_gerador_fossil),
    in_energia_renovavel:     b(inf.energia_renovavel),
    in_energia_inexistente:   b(inf.energia_inexistente),
    // ── Esgoto ──────────────────────────────────────────────────────────────
    in_esgoto_rede_publica:   b(raw.in_esgoto_rede_publica ?? inf.esgoto_rede_publica),
    in_esgoto_fossa_septica:  b(inf.esgoto_fossa_septica),
    in_esgoto_fossa_comum:    b(inf.esgoto_fossa_comum),
    in_esgoto_fossa:          b(inf.esgoto_fossa),
    in_esgoto_inexistente:    b(inf.esgoto_inexistente),
    // ── Lixo ────────────────────────────────────────────────────────────────
    in_lixo_coleta_publica:       b(inf.lixo_coleta_publica),
    in_lixo_servico_coleta:       b(inf.lixo_coleta_publica),  // alias nome antigo
    in_lixo_queima:               b(inf.lixo_queima),
    in_lixo_enterra:              b(inf.lixo_enterra),
    in_lixo_destino_publico:      b(inf.lixo_destino_publico),
    in_tratamento_lixo_separacao: b(inf.tratamento_lixo_separacao),
    in_tratamento_lixo_reutiliza: b(inf.tratamento_lixo_reutiliza),
    in_tratamento_lixo_reciclagem: b(inf.tratamento_lixo_reciclagem),
    // ── Dependências / Espaços ───────────────────────────────────────────────
    in_biblioteca:              b(raw.in_biblioteca    ?? dep.biblioteca),
    in_biblioteca_sala_leitura: b(dep.biblioteca_sala_leitura),
    in_laboratorio_informatica: b(raw.in_laboratorio_informatica ?? dep.laboratorio_informatica),
    in_laboratorio_ciencias:    b(dep.laboratorio_ciencias),
    in_quadra_esportes:         b(raw.in_quadra_esportes ?? dep.quadra_esportes),
    in_quadra_esportes_coberta:   b(dep.quadra_esportes_coberta),
    in_quadra_esportes_descoberta: b(dep.quadra_esportes ?? dep.quadra_esportes_descoberta),
    in_sala_diretoria:          b(dep.sala_diretoria),
    in_sala_professor:          b(dep.sala_professor),
    in_cozinha:                 b(dep.cozinha),
    in_refeitorio:              b(dep.refeitorio),
    in_almoxarifado:            b(dep.almoxarifado),
    in_auditorio:               b(dep.auditorio),
    in_patio_coberto:           b(dep.patio_coberto),
    in_patio_descoberto:        b(dep.patio_descoberto),
    in_parque_infantil:         b(dep.parque_infantil),
    in_banheiro:                b(dep.banheiro),
    in_banheiro_ei:             b(dep.banheiro_ei),
    in_banheiro_pne:            b(dep.banheiro_pne),
    in_banheiro_funcionarios:   b(dep.banheiro_funcionarios),
    in_dormitorio_aluno:        b(dep.dormitorio_aluno),
    in_dormitorio_professor:    b(dep.dormitorio_professor),
    // ── Internet / Tecnologia ───────────────────────────────────────────────
    in_internet:                b(raw.in_internet  ?? tec.internet),
    in_banda_larga:             b(raw.in_banda_larga ?? tec.banda_larga),
    in_internet_alunos:         b(tec.internet_alunos),
    in_internet_administrativo: b(tec.internet_administrativo),
    in_internet_aprendizagem:   b(tec.internet_aprendizagem),
    qt_computadores:            n(tec.computadores),
    in_tablet_aluno:            b(tec.tablet_aluno),
    in_equip_tv:                b(tec.equip_tv),
    in_equip_multimidia:        b(tec.equip_multimidia),
    in_impressora:              b(tec.impressora),
    // ── Acessibilidade ───────────────────────────────────────────────────────
    in_corrimao:                b(ace.corrimao),
    in_elevador:                b(ace.elevador),
    in_pisos_tateis:            b(ace.pisos_tateis),
    in_rampas:                  b(ace.rampas),
    in_sinal_visual:            b(ace.sinal_visual),
    in_acessibilidade_inexistente: b(ace.acessibilidade_inexistente),
    // ── Alimentação e Serviços ───────────────────────────────────────────────
    in_alimentacao:             b(raw.in_alimentacao ?? ali.alimentacao_escolar),
    in_alimentacao_escolar:     b(ali.alimentacao_escolar),
    in_atendimento_aee:         b(ali.atendimento_aee),
    in_atividade_complementar:  b(ali.atividade_complementar),
    // Ano do censo
    ano_raw: raw.ano ?? null,
  };
}

export async function searchEscolasRailway(nome: string, limit = 50) {
  const data = await fetchRailway(`/buscar/escolas?nome=${encodeURIComponent(nome)}&limite=${limit}`);
  if (!data?.escolas) return { dados: [], total: 0 };

  return {
    dados: data.escolas.map((e: any) => ({
      co_entidade: e.co_entidade,
      no_entidade: e.no_entidade,
      no_municipio: e.no_municipio,
      sg_uf: e.sg_uf,
      ds_dependencia: DEP_MAP[e.tp_dependencia] ?? String(e.tp_dependencia ?? ""),
      ds_localizacao: LOC_MAP[e.tp_localizacao] ?? String(e.tp_localizacao ?? ""),
      qt_matriculas: 0,
    })),
    total: data.quantidade ?? data.escolas.length,
  };
}

export async function getEscolaEvolucaoRailway(inep: string) {
  // Usa /historico — retorna todos os anos com indicadores por série
  const data = await fetchRailway(`/escolas/${inep}/historico`, 15000);
  if (!data?.historico) return null;

  const historico: any[] = data.historico ?? [];
  if (!historico.length) return null;

  // Info da escola vem em cada item do historico
  const latest = historico[historico.length - 1] ?? {};
  const dsDep = DEP_MAP[latest.tp_dependencia] ?? String(latest.tp_dependencia ?? "");
  const dsLoc = LOC_MAP[latest.tp_localizacao] ?? String(latest.tp_localizacao ?? "");
  const dsSit = SIT_MAP[latest.tp_situacao_funcionamento] ?? null;

  const baseInfo = {
    co_entidade:    latest.co_entidade  ?? parseInt(inep),
    no_entidade:    latest.no_entidade  ?? null,
    co_municipio:   latest.co_municipio ?? null,
    no_municipio:   latest.no_municipio ?? null,
    sg_uf:          latest.sg_uf        ?? null,
    ds_dependencia: dsDep,
    ds_localizacao: dsLoc,
    ds_situacao:    dsSit,
    escola_ativa:   latest.tp_situacao_funcionamento === 1,
  };

  const censoByYear: Record<number, any> = {};
  const indicadoresByYear: Record<number, Record<string, any>> = {};

  for (const h of historico) {
    const ano = h.ano;
    censoByYear[ano] = {
      co_entidade:    h.co_entidade    ?? latest.co_entidade,
      no_entidade:    h.no_entidade    ?? latest.no_entidade,
      co_municipio:   h.co_municipio   ?? latest.co_municipio,
      no_municipio:   h.no_municipio   ?? latest.no_municipio,
      sg_uf:          h.sg_uf          ?? latest.sg_uf,
      ds_dependencia: DEP_MAP[h.tp_dependencia] ?? dsDep,
      ds_localizacao: LOC_MAP[h.tp_localizacao] ?? dsLoc,
      ds_situacao:    SIT_MAP[h.tp_situacao_funcionamento] ?? dsSit,
      tp_situacao_funcionamento: h.tp_situacao_funcionamento,
    };

    const ind = mapIndicadores(h);

    // IDEB e SAEB vêm diretamente nos campos do historico
    if (h.ideb_ai != null || h.ideb_af != null || h.ideb_em != null) {
      if (!ind.ideb) ind.ideb = {};
      ind.ideb.ideb_ai = h.ideb_ai ?? ind.ideb.ideb_ai ?? null;
      ind.ideb.ideb_af = h.ideb_af ?? ind.ideb.ideb_af ?? null;
      ind.ideb.ideb_em = h.ideb_em ?? ind.ideb.ideb_em ?? null;
    }
    if (h.nota_saeb_ai != null || h.nota_saeb_af != null || h.nota_saeb_em != null) {
      if (!ind.saeb) ind.saeb = {};
      ind.saeb.nota_mt_ai = h.nota_saeb_ai ?? ind.saeb.nota_mt_ai ?? null;
      ind.saeb.nota_lp_ai = h.nota_saeb_ai ?? ind.saeb.nota_lp_ai ?? null;
      ind.saeb.nota_mt_af = h.nota_saeb_af ?? ind.saeb.nota_mt_af ?? null;
      ind.saeb.nota_lp_af = h.nota_saeb_af ?? ind.saeb.nota_lp_af ?? null;
      ind.saeb.nota_mt_em = h.nota_saeb_em ?? ind.saeb.nota_mt_em ?? null;
      ind.saeb.nota_lp_em = h.nota_saeb_em ?? ind.saeb.nota_lp_em ?? null;
    }

    indicadoresByYear[ano] = ind;
  }

  const anos = historico.map((h: any) => h.ano).sort((a: number, b: number) => a - b);

  return {
    co_entidade: parseInt(inep),
    anos_disponiveis: anos,
    escola: baseInfo,
    censo_por_ano: censoByYear,
    indicadores_por_ano: indicadoresByYear,
  };
}

export async function getEscolaCompletaRailway(inep: string, ano?: number) {
  const data = await fetchRailway(`/escolas/${inep}/completo`, 12000);
  if (!data?.encontrada) return null;

  const escolaData    = data.escola ?? {};
  const identificacao = escolaData.identificacao ?? {};
  const historico: any[] = escolaData.historico ?? [];
  const idebArray: any[] = data.ideb ?? [];

  const anos: number[] = [
    ...new Set([
      ...historico.map((h: any) => h.ano),
      ...idebArray.map((i: any) => i.ano),
    ])
  ].sort((a, b) => a - b);

  const anoSel = ano && anos.includes(ano) ? ano : (anos[anos.length - 1] ?? ano);
  const hAno = historico.find((h: any) => h.ano === anoSel) ?? historico[historico.length - 1];
  const ind = hAno ? mapIndicadores(hAno) : {};

  const dsDep = DEP_MAP[identificacao.tp_dependencia] ?? "";
  const dsLoc = LOC_MAP[identificacao.tp_localizacao] ?? "";

  return {
    co_entidade: parseInt(inep),
    anos_disponiveis: anos.map(String),
    ano_selecionado: anoSel,
    escola: {
      no_entidade:  identificacao.no_entidade  ?? hAno?.no_entidade,
      no_municipio: identificacao.no_municipio ?? hAno?.no_municipio,
      sg_uf:        identificacao.sg_uf        ?? hAno?.sg_uf,
      ds_dependencia: dsDep,
      ds_localizacao: dsLoc,
    },
    ...ind,
    ideb: ind.ideb ?? null,
    inse: ind.inse ?? null,
    taxas_rendimento: ind.taxas_rendimento ?? null,
    afd: ind.afd ?? null,
    atu: ind.atu ?? null,
    had: ind.had ?? null,
    icg: ind.icg ?? null,
    ird: ind.ird ?? null,
    tdi: ind.tdi ?? null,
    ied: ind.ied ?? null,
  };
}

export async function getComparativoRailway(inep: string) {
  const cacheKey = `comparativo:${inep}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const data = await fetchRailway(`/comparar/escola/${inep}`, 15000);
  if (!data?.encontrada) return null;
  const escola = data.escola ?? {};
  const comp = data.comparacao ?? {};
  const result = {
    co_entidade: parseInt(inep),
    escola: {
      inse: escola.inse ?? null,
      ideb_ai: escola.ideb_ai ?? null,
      ideb_af: escola.ideb_af ?? null,
      ideb_em: escola.ideb_em ?? null,
    },
    municipio: {
      nome: escola.no_municipio ?? null,
      inse: comp.municipio?.inse ?? null,
      ideb_ai: comp.municipio?.ideb_ai ?? null,
      ideb_af: comp.municipio?.ideb_af ?? null,
      ideb_em: comp.municipio?.ideb_em ?? null,
    },
    uf: {
      sg: escola.sg_uf ?? null,
      inse: comp.uf?.inse ?? null,
      ideb_ai: comp.uf?.ideb_ai ?? null,
      ideb_af: comp.uf?.ideb_af ?? null,
      ideb_em: comp.uf?.ideb_em ?? null,
    },
    brasil: {
      inse: comp.brasil?.inse ?? null,
      ideb_ai: comp.brasil?.ideb_ai ?? null,
      ideb_af: comp.brasil?.ideb_af ?? null,
      ideb_em: comp.brasil?.ideb_em ?? null,
    },
  };
  cacheSet(cacheKey, result);
  return result;
}

export async function getDiagnosticoRailway(inep: string) {
  const cacheKey = `diagnostico:${inep}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const data = await fetchRailway(`/diagnostico/escola/${inep}`, 15000);
  if (!data?.encontrada) return null;
  const result = {
    co_entidade: parseInt(inep),
    resumo_geral: data.resumo_geral ?? null,
    leituras: data.leituras ?? [],
    pontos_fortes: data.pontos_fortes ?? [],
    pontos_atencao: data.pontos_atencao ?? [],
    indicadores_recentes: {
      inse_valor: data.indicadores_recentes?.inse_valor ?? null,
      inse_grupo: data.indicadores_recentes?.inse_grupo ?? null,
      ideb_ai: data.indicadores_recentes?.ideb_ai_recente ?? null,
      ideb_af: data.indicadores_recentes?.ideb_af_recente ?? null,
      ideb_em: data.indicadores_recentes?.ideb_em_recente ?? null,
    },
    comparativos: {
      municipio: data.comparativos?.municipio ?? null,
      uf: data.comparativos?.uf ?? null,
    },
  };
  cacheSet(cacheKey, result);
  return result;
}

export async function getEscolaBasicaRailway(inep: string) {
  const data = await fetchRailway(`/escolas/${inep}`);
  if (!data?.encontrada) return null;
  const e = data.escola;
  return {
    co_entidade: parseInt(inep),
    no_entidade: e?.no_entidade,
    no_municipio: e?.no_municipio,
    sg_uf: e?.sg_uf,
    ds_dependencia: DEP_MAP[e?.tp_dependencia] ?? "",
    ds_localizacao: LOC_MAP[e?.tp_localizacao] ?? "",
    escola_ativa: e?.escola_ativa,
    ideb_ai: e?.ideb_ai_recente,
    ideb_af: e?.ideb_af_recente,
    ideb_em: e?.ideb_em_recente,
    inse_valor: e?.inse_valor,
    inse_grupo: e?.inse_grupo,
  };
}
