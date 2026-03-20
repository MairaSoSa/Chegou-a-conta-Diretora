const RAILWAY_API = "https://chegou-a-conta-diretora-api-production.up.railway.app";

const DEP_MAP: Record<number, string> = { 1: "Federal", 2: "Estadual", 3: "Municipal", 4: "Privada" };
const LOC_MAP: Record<number, string> = { 1: "Urbana", 2: "Rural" };
const SIT_MAP: Record<number, string> = { 1: "Em Atividade", 2: "Paralisada", 3: "Extinta", 4: "Extinta", 5: "Extinta" };

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
      fundamental_total: a.FUN_CAT_0,
      medio_total: a.MED_CAT_0,
      fundamental_ai: a.FUN_AI_CAT_0,
      fundamental_af: a.FUN_AF_CAT_0,
    };
  }

  if (h.tnr_dados_json) {
    const a = h.tnr_dados_json;
    const tnrFund = a["4_CAT_FUN"] ?? a.FUN_CAT_0 ?? a.FUND_CAT_0;
    const tnrMed  = a["4_CAT_MED"] ?? a.MED_CAT_0;
    ind.taxa_nao_resposta = {
      taxa_nao_resposta_fund: tnrFund,
      taxa_nao_resposta_med: tnrMed,
      tnr_fund: tnrFund,
      tnr_med: tnrMed,
      tnr_fun_ai: a["4_CAT_FUN_AI"],
      tnr_fun_af: a["4_CAT_FUN_AF"],
      tnr_fun_01: a["4_CAT_FUN_01"], tnr_fun_02: a["4_CAT_FUN_02"],
      tnr_fun_03: a["4_CAT_FUN_03"], tnr_fun_04: a["4_CAT_FUN_04"],
      tnr_fun_05: a["4_CAT_FUN_05"], tnr_fun_06: a["4_CAT_FUN_06"],
      tnr_fun_07: a["4_CAT_FUN_07"], tnr_fun_08: a["4_CAT_FUN_08"],
      tnr_fun_09: a["4_CAT_FUN_09"],
    };
  }

  if (h.rendimento_dados_json) {
    const a = h.rendimento_dados_json;
    const aprovTotal  = a["Taxa de Aprovação"]  ?? a.APROV_BAS_CAT_0  ?? a.aprovacao_total  ?? null;
    const abandTotal  = a["Taxa de Abandono"]   ?? a.ABAND_BAS_CAT_0  ?? a.abandono_total   ?? null;
    const reprovTotal = a["Taxa de Reprovação"] ?? a.REPROV_BAS_CAT_0 ?? a.reprovacao_total  ?? null;
    const aprovFund  = a.APROV_FUN_CAT_0  ?? null;
    const abandFund  = a.ABAND_FUN_CAT_0  ?? null;
    const reprovFund = a.REPROV_FUN_CAT_0 ?? null;
    const aprovMed   = a.APROV_MED_CAT_0  ?? null;
    const abandMed   = a.ABAND_MED_CAT_0  ?? null;
    const reprovMed  = a.REPROV_MED_CAT_0 ?? null;
    const aprovFunAI = a["Unnamed: 10"] ?? null;
    const aprovFunAF = a["Unnamed: 16"] ?? null;
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
      aprovacao_fund_ai:  aprovFunAI,
      aprovacao_fund_af:  aprovFunAF,
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

// Extrai dados de censo do campo "raw" do /completo
function mapCensoRaw(raw: any, baseInfo: any): any {
  if (!raw) return baseInfo;
  return {
    ...baseInfo,
    // Matrículas
    qt_mat_bas:  raw.qt_mat_bas  != null ? Number(raw.qt_mat_bas)  : null,
    qt_mat_inf:  raw.qt_mat_inf  != null ? Number(raw.qt_mat_inf)  : null,
    qt_mat_fund: raw.qt_mat_fund != null ? Number(raw.qt_mat_fund) : null,
    qt_mat_med:  raw.qt_mat_med  != null ? Number(raw.qt_mat_med)  : null,
    qt_mat_eja:  raw.qt_mat_eja  != null ? Number(raw.qt_mat_eja)  : null,
    // Docentes
    qt_doc_bas:  raw.qt_doc_bas  != null ? Number(raw.qt_doc_bas)  : null,
    qt_doc_inf:  raw.qt_doc_inf  != null ? Number(raw.qt_doc_inf)  : null,
    qt_doc_fund: raw.qt_doc_fund != null ? Number(raw.qt_doc_fund) : null,
    qt_doc_med:  raw.qt_doc_med  != null ? Number(raw.qt_doc_med)  : null,
    // Turmas
    qt_tur_bas:  raw.qt_tur_bas  != null ? Number(raw.qt_tur_bas)  : null,
    qt_tur_inf:  raw.qt_tur_inf  != null ? Number(raw.qt_tur_inf)  : null,
    qt_tur_fund: raw.qt_tur_fund != null ? Number(raw.qt_tur_fund) : null,
    qt_tur_med:  raw.qt_tur_med  != null ? Number(raw.qt_tur_med)  : null,
    // Salas
    qt_salas_utilizadas:        raw.qt_salas_utilizadas        != null ? Number(raw.qt_salas_utilizadas)        : null,
    qt_salas_utilizadas_dentro: raw.qt_salas_utilizadas_dentro != null ? Number(raw.qt_salas_utilizadas_dentro) : null,
    qt_salas_utilizadas_fora:   raw.qt_salas_utilizadas_fora   != null ? Number(raw.qt_salas_utilizadas_fora)   : null,
    // Infraestrutura básica
    in_agua_potavel:        raw.in_agua_potavel,
    in_energia_rede_publica: raw.in_energia_rede_publica,
    in_esgoto_rede_publica:  raw.in_esgoto_rede_publica,
    in_internet:             raw.in_internet,
    in_banda_larga:          raw.in_banda_larga,
    // Dependências
    in_laboratorio_informatica: raw.in_laboratorio_informatica,
    in_biblioteca:              raw.in_biblioteca,
    in_quadra_esportes:         raw.in_quadra_esportes,
    in_alimentacao:             raw.in_alimentacao,
    // Ano do raw
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
  // Usa /completo — uma única chamada com tudo: censo, infraestrutura, indicadores, IDEB
  const data = await fetchRailway(`/escolas/${inep}/completo`, 12000);
  if (!data?.encontrada) return null;

  const escolaData    = data.escola ?? {};
  const identificacao = escolaData.identificacao  ?? {};
  const regionalizacao = escolaData.regionalizacao ?? {};
  const funcionamento = escolaData.funcionamento   ?? {};
  const rawCenso      = escolaData.raw             ?? null;
  const historico: any[] = escolaData.historico ?? data.historico ?? [];
  const idebArray: any[] = data.ideb ?? [];

  // Dados da escola — tp_situacao_funcionamento vem como string em "funcionamento"
  const noRegiao    = regionalizacao.no_regiao ?? null;
  const dsDep       = DEP_MAP[identificacao.tp_dependencia] ?? String(identificacao.tp_dependencia ?? "");
  const dsLoc       = LOC_MAP[identificacao.tp_localizacao] ?? String(identificacao.tp_localizacao ?? "");
  const sitFuncNum  = parseInt(String(funcionamento.tp_situacao_funcionamento ?? "")) || null;
  const dsSit       = sitFuncNum ? (SIT_MAP[sitFuncNum] ?? null) : null;
  const escolaAtiva = funcionamento.in_escola_ativa === true || sitFuncNum === 1;

  // Ano do censo raw (último disponível)
  const anoRaw = rawCenso?.ano ?? null;

  const baseInfo = {
    co_entidade:    identificacao.co_entidade  ?? parseInt(inep),
    no_entidade:    identificacao.no_entidade  ?? null,
    co_municipio:   identificacao.co_municipio ?? null,
    no_municipio:   identificacao.no_municipio ?? null,
    sg_uf:          identificacao.sg_uf        ?? null,
    no_uf:          identificacao.no_uf        ?? null,
    no_regiao:      noRegiao,
    no_mesorregiao: regionalizacao.no_mesorregiao ?? null,
    no_microrregiao: regionalizacao.no_microrregiao ?? null,
    ds_dependencia: dsDep,
    ds_localizacao: dsLoc,
    ds_situacao:    dsSit,
    escola_ativa:   escolaAtiva,
  };

  const censoByYear: Record<number, any> = {};
  const indicadoresByYear: Record<number, Record<string, any>> = {};

  for (const h of historico) {
    const ano = h.ano;
    const anyJson = h.afd_dados_json ?? h.atu_dados_json ?? h.had_dados_json ?? h.tdi_dados_json ?? h.ird_dados_json ?? {};
    const regFromJson = anyJson.NO_REGIAO ?? noRegiao;

    censoByYear[ano] = {
      co_entidade:    h.co_entidade    ?? identificacao.co_entidade,
      no_entidade:    h.no_entidade    ?? identificacao.no_entidade,
      co_municipio:   h.co_municipio   ?? identificacao.co_municipio,
      no_municipio:   h.no_municipio   ?? identificacao.no_municipio,
      sg_uf:          h.sg_uf          ?? identificacao.sg_uf,
      no_regiao:      regFromJson,
      ds_dependencia: DEP_MAP[h.tp_dependencia] ?? dsDep,
      ds_localizacao: LOC_MAP[h.tp_localizacao] ?? dsLoc,
      ds_situacao:    SIT_MAP[h.tp_situacao_funcionamento] ?? dsSit,
      tp_situacao_funcionamento: h.tp_situacao_funcionamento,
    };

    // Sobrescreve ano do raw com dados de censo completos
    if (anoRaw && ano === anoRaw && rawCenso) {
      censoByYear[ano] = mapCensoRaw(rawCenso, censoByYear[ano]);
    }

    indicadoresByYear[ano] = mapIndicadores(h);
  }

  // Se o ano do raw não estava no historico, adiciona como entrada de censo
  if (anoRaw && !censoByYear[anoRaw] && rawCenso) {
    censoByYear[anoRaw] = mapCensoRaw(rawCenso, { ...baseInfo });
  }

  // Merge IDEB do array separado (quando vem do /completo)
  const idebByYear: Record<number, any> = {};
  for (const item of idebArray) {
    if (!idebByYear[item.ano]) idebByYear[item.ano] = {};
    const etapa = item.etapa;
    if (etapa === "anos_iniciais") {
      idebByYear[item.ano].ideb_ai = item.ideb;
      idebByYear[item.ano].nota_mt_ai = item.dados_json?.nota_mt ?? item.nota_saeb;
      idebByYear[item.ano].nota_lp_ai = item.dados_json?.nota_lp ?? item.nota_saeb;
    } else if (etapa === "anos_finais") {
      idebByYear[item.ano].ideb_af = item.ideb;
      idebByYear[item.ano].nota_mt_af = item.dados_json?.nota_mt ?? item.nota_saeb;
      idebByYear[item.ano].nota_lp_af = item.dados_json?.nota_lp ?? item.nota_saeb;
    } else if (etapa === "ensino_medio") {
      idebByYear[item.ano].ideb_em = item.ideb;
      idebByYear[item.ano].nota_mt_em = item.dados_json?.nota_mt ?? item.nota_saeb;
      idebByYear[item.ano].nota_lp_em = item.dados_json?.nota_lp ?? item.nota_saeb;
    }
  }

  for (const [anoStr, idebData] of Object.entries(idebByYear)) {
    const ano = parseInt(anoStr);
    if (!indicadoresByYear[ano]) indicadoresByYear[ano] = {};
    if (!indicadoresByYear[ano].ideb) indicadoresByYear[ano].ideb = idebData;
    if (!indicadoresByYear[ano].saeb) {
      indicadoresByYear[ano].saeb = {
        nota_mt_ai: idebData.nota_mt_ai, nota_lp_ai: idebData.nota_lp_ai,
        nota_mt_af: idebData.nota_mt_af, nota_lp_af: idebData.nota_lp_af,
        nota_mt_em: idebData.nota_mt_em, nota_lp_em: idebData.nota_lp_em,
      };
    }
  }

  // Ano do raio-x (indicadores_recentes do /completo, para IDEB da capa)
  const indRecentes = escolaData.indicadores_recentes ?? {};
  const idebRecentes = indRecentes.ideb ?? {};

  const anosSet = new Set<number>([
    ...historico.map((h: any) => h.ano),
    ...Object.keys(idebByYear).map(Number),
    ...(anoRaw ? [anoRaw] : []),
  ]);
  const anos = [...anosSet].sort((a, b) => a - b);

  return {
    co_entidade: parseInt(inep),
    anos_disponiveis: anos,
    escola: {
      ...baseInfo,
      // Resumo IDEB da capa (do indicadores_recentes)
      ideb_ai_recente: idebRecentes.anos_iniciais?.valor ?? null,
      ideb_af_recente: idebRecentes.anos_finais?.valor  ?? null,
      ideb_em_recente: idebRecentes.ensino_medio?.valor ?? null,
      ideb_ai_ano:     idebRecentes.anos_iniciais?.ano  ?? null,
      ideb_af_ano:     idebRecentes.anos_finais?.ano    ?? null,
    },
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
