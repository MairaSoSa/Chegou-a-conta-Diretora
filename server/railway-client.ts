const RAILWAY_API = "https://chegou-a-conta-diretora-api-production.up.railway.app";

const DEP_MAP: Record<number, string> = { 1: "Federal", 2: "Estadual", 3: "Municipal", 4: "Privada" };
const LOC_MAP: Record<number, string> = { 1: "Urbana", 2: "Rural" };
const SIT_MAP: Record<number, string> = { 1: "Em Atividade", 2: "Paralisada", 3: "Extinta", 4: "Extinta", 5: "Extinta" };

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
    // ICG usa campo "COMPLEX" com valor "Nível 1"..."Nível 6"
    const complexStr: string = a.COMPLEX ?? a.NIVEL_CAT_0 ?? a.nivel ?? a.ICG_NIVEL ?? "";
    const nivelNum = parseInt(String(complexStr).replace(/\D/g, "")) || null;
    ind.icg = {
      nivel: nivelNum,
      nivel_label: complexStr,
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
    // TNR usa "4_CAT_FUN" e "4_CAT_MED" como chaves
    const tnrFund = a["4_CAT_FUN"] ?? a.FUN_CAT_0 ?? a.FUND_CAT_0;
    const tnrMed  = a["4_CAT_MED"] ?? a.MED_CAT_0;
    ind.taxa_nao_resposta = {
      taxa_nao_resposta_fund: tnrFund,
      taxa_nao_resposta_med: tnrMed,
      tnr_fund: tnrFund,
      tnr_med: tnrMed,
      // por série Fundamental
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
    // Campos nomeados confiáveis do JSON de Rendimento INEP
    const aprovTotal  = a["Taxa de Aprovação"]  ?? a.APROV_BAS_CAT_0  ?? a.aprovacao_total  ?? null;
    const abandTotal  = a["Taxa de Abandono"]   ?? a.ABAND_BAS_CAT_0  ?? a.abandono_total   ?? null;
    const reprovTotal = a["Taxa de Reprovação"] ?? a.REPROV_BAS_CAT_0 ?? a.reprovacao_total  ?? null;
    // Campos por etapa, quando existem com nomes explícitos
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
      // fallback: usa total quando não há split fund/med
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
    // Extrair no_regiao de qualquer _dados_json disponível
    const anyJson = h.afd_dados_json ?? h.atu_dados_json ?? h.had_dados_json ?? h.tdi_dados_json ?? h.ird_dados_json ?? {};
    censoByYear[h.ano] = {
      co_entidade: h.co_entidade,
      no_entidade: h.no_entidade,
      co_municipio: h.co_municipio,
      no_municipio: h.no_municipio,
      sg_uf: h.sg_uf,
      no_regiao: anyJson.NO_REGIAO ?? null,
      ds_dependencia: DEP_MAP[h.tp_dependencia] ?? String(h.tp_dependencia ?? ""),
      ds_localizacao: LOC_MAP[h.tp_localizacao] ?? String(h.tp_localizacao ?? ""),
      ds_situacao: SIT_MAP[h.tp_situacao_funcionamento] ?? null,
      tp_situacao_funcionamento: h.tp_situacao_funcionamento,
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

  const latestAnyJson = latest
    ? (latest.afd_dados_json ?? latest.atu_dados_json ?? latest.had_dados_json ?? latest.tdi_dados_json ?? latest.ird_dados_json ?? {})
    : {};

  return {
    co_entidade: parseInt(inep),
    anos_disponiveis: anos,
    escola: {
      co_entidade: parseInt(inep),
      no_entidade: latest?.no_entidade,
      co_municipio: latest?.co_municipio,
      no_municipio: latest?.no_municipio,
      sg_uf: latest?.sg_uf,
      no_regiao: latestAnyJson.NO_REGIAO ?? null,
      ds_dependencia: DEP_MAP[latest?.tp_dependencia] ?? String(latest?.tp_dependencia ?? ""),
      ds_localizacao: LOC_MAP[latest?.tp_localizacao] ?? String(latest?.tp_localizacao ?? ""),
      ds_situacao: SIT_MAP[latest?.tp_situacao_funcionamento] ?? null,
      escola_ativa: latest?.tp_situacao_funcionamento === 1,
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
