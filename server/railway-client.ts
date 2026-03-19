const RAILWAY_API = "https://chegou-a-conta-diretora-api-production.up.railway.app";

const DEP_MAP: Record<number, string> = { 1: "Federal", 2: "Estadual", 3: "Municipal", 4: "Privada" };
const LOC_MAP: Record<number, string> = { 1: "Urbana", 2: "Rural" };

async function fetchRailway(path: string, timeout = 6000): Promise<any | null> {
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
    ind.inse = { media_inse: inse.INSE_VALOR_ABSOLUTO ?? h.inse_valor, valor: h.inse_valor, grupo: h.inse_grupo };
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
    ind.icg = {
      nivel: a.NIVEL_CAT_0 ?? a.nivel ?? a.ICG_NIVEL,
    };
  }

  if (h.ird_dados_json) {
    const a = h.ird_dados_json;
    ind.ird = {
      media_ird: a.EDU_BAS_CAT_0,
      media: a.EDU_BAS_CAT_0,
    };
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
    ind.taxa_nao_resposta = {
      taxa_nao_resposta_fund: a.FUN_CAT_0 ?? a.FUND_CAT_0,
      taxa_nao_resposta_med: a.MED_CAT_0,
      tnr_fund: a.FUN_CAT_0 ?? a.FUND_CAT_0,
      tnr_med: a.MED_CAT_0,
    };
  }

  if (h.rendimento_dados_json) {
    const a = h.rendimento_dados_json;
    ind.taxas_rendimento = {
      aprovacao_fund: a.APROV_FUN_CAT_0 ?? a.aprovacao_fund,
      reprovacao_fund: a.REPROV_FUN_CAT_0 ?? a.reprovacao_fund,
      abandono_fund: a.ABAND_FUN_CAT_0 ?? a.abandono_fund,
      aprovacao_med: a.APROV_MED_CAT_0 ?? a.aprovacao_med,
      reprovacao_med: a.REPROV_MED_CAT_0 ?? a.reprovacao_med,
      abandono_med: a.ABAND_MED_CAT_0 ?? a.abandono_med,
      aprovacao_total: a.APROV_BAS_CAT_0 ?? a.aprovacao_total,
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
  const data = await fetchRailway(`/escolas/${inep}/series-historicas`);
  if (!data?.historico?.length && !data?.ideb?.length) return null;

  const historico: any[] = data.historico ?? [];
  const idebArray: any[] = data.ideb ?? [];

  const censoByYear: Record<number, any> = {};
  const indicadoresByYear: Record<number, Record<string, any>> = {};

  for (const h of historico) {
    censoByYear[h.ano] = {
      no_entidade: h.no_entidade,
      no_municipio: h.no_municipio,
      sg_uf: h.sg_uf,
      ds_dependencia: DEP_MAP[h.tp_dependencia] ?? String(h.tp_dependencia ?? ""),
      ds_localizacao: LOC_MAP[h.tp_localizacao] ?? String(h.tp_localizacao ?? ""),
    };
    indicadoresByYear[h.ano] = mapIndicadores(h);
  }

  // Merge IDEB array (anos_iniciais, anos_finais, ensino_medio por ano)
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
    indicadoresByYear[ano].ideb = idebData;
    // Build saeb from IDEB data
    indicadoresByYear[ano].saeb = {
      nota_mt_ai: idebData.nota_mt_ai,
      nota_lp_ai: idebData.nota_lp_ai,
      nota_mt_af: idebData.nota_mt_af,
      nota_lp_af: idebData.nota_lp_af,
      nota_mt_em: idebData.nota_mt_em,
      nota_lp_em: idebData.nota_lp_em,
    };
  }

  const anosSet = new Set<number>([
    ...historico.map((h: any) => h.ano),
    ...Object.keys(idebByYear).map(Number),
  ]);
  const anos = [...anosSet].sort((a, b) => a - b);

  const latest = historico.length > 0 ? historico[historico.length - 1] : null;

  return {
    co_entidade: parseInt(inep),
    anos_disponiveis: anos,
    escola: {
      no_entidade: latest?.no_entidade,
      no_municipio: latest?.no_municipio,
      sg_uf: latest?.sg_uf,
      ds_dependencia: DEP_MAP[latest?.tp_dependencia] ?? String(latest?.tp_dependencia ?? ""),
      ds_localizacao: LOC_MAP[latest?.tp_localizacao] ?? String(latest?.tp_localizacao ?? ""),
    },
    censo_por_ano: censoByYear,
    indicadores_por_ano: indicadoresByYear,
  };
}

export async function getEscolaCompletaRailway(inep: string, ano?: number) {
  const data = await fetchRailway(`/escolas/${inep}/raio-x`);
  if (!data?.encontrada) return null;

  const anos: number[] = data.anos_disponiveis ?? [];
  const anoSel = ano && anos.includes(ano) ? ano : (anos[anos.length - 1] ?? ano);
  const escola = data.escola ?? {};
  const historico: any[] = data.historico ?? [];
  const hAno = historico.find((h: any) => h.ano === anoSel) ?? historico[historico.length - 1];

  const ind = hAno ? mapIndicadores(hAno) : {};

  return {
    co_entidade: parseInt(inep),
    anos_disponiveis: anos.map(String),
    ano_selecionado: anoSel,
    escola: {
      no_entidade: escola.no_entidade ?? hAno?.no_entidade,
      no_municipio: escola.no_municipio ?? hAno?.no_municipio,
      sg_uf: escola.sg_uf ?? hAno?.sg_uf,
      ds_dependencia: DEP_MAP[escola.tp_dependencia] ?? DEP_MAP[hAno?.tp_dependencia] ?? "",
      ds_localizacao: LOC_MAP[escola.tp_localizacao] ?? LOC_MAP[hAno?.tp_localizacao] ?? "",
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
