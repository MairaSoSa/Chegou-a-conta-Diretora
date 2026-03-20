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

// ── Índice em memória de escolas (cresce a cada consulta por INEP) ──────────
interface SchoolEntry {
  co_entidade: number;
  no_entidade: string;
  no_municipio: string;
  sg_uf: string;
  ds_dependencia: string;
  ds_localizacao: string;
  qt_matriculas: number;
}
const schoolIndex = new Map<number, SchoolEntry>();

function addToSchoolIndex(e: SchoolEntry) {
  if (e?.co_entidade && e?.no_entidade) {
    schoolIndex.set(e.co_entidade, e);
  }
}

function searchSchoolIndex(query: string, limit = 20): SchoolEntry[] {
  if (schoolIndex.size === 0) return [];
  const words = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(Boolean);
  const results: SchoolEntry[] = [];
  for (const e of schoolIndex.values()) {
    const name = e.no_entidade.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const city = e.no_municipio.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (words.every(w => name.includes(w) || city.includes(w) || e.sg_uf.toLowerCase() === w)) {
      results.push(e);
      if (results.length >= limit) break;
    }
  }
  return results.sort((a, b) => a.no_entidade.localeCompare(b.no_entidade));
}

function schoolToEntry(e: any, inep?: string): SchoolEntry | null {
  const co = e?.co_entidade ?? (inep ? parseInt(inep) : null);
  if (!co || !e?.no_entidade) return null;
  return {
    co_entidade: co,
    no_entidade: e.no_entidade ?? "",
    no_municipio: e.no_municipio ?? "",
    sg_uf: e.sg_uf ?? "",
    ds_dependencia: DEP_MAP[e.tp_dependencia] ?? e.ds_dependencia ?? "",
    ds_localizacao: LOC_MAP[e.tp_localizacao] ?? e.ds_localizacao ?? "",
    qt_matriculas: e.qt_mat_bas ?? e.qt_matriculas ?? 0,
  };
}

export function getSchoolIndexSize() { return schoolIndex.size; }

export async function searchEscolasRailway(nome: string, limit = 20) {
  const trimmed = nome.trim();

  // 1. Busca por INEP direto (7-8 dígitos) — resposta em ~3-4 s
  if (/^\d{7,8}$/.test(trimmed)) {
    const inep = trimmed.padStart(8, "0");

    // Checa índice primeiro (pode já estar indexado)
    const indexed = schoolIndex.get(parseInt(inep));
    if (indexed) return { dados: [indexed], total: 1, _fonte: "cache" };

    const resp = await fetchRailway(`/escolas/${inep}`, 10000);
    const raw = resp?.escola ?? (resp?.encontrada ? resp : null);
    if (raw && resp?.encontrada !== false) {
      const entry = schoolToEntry(raw, inep) ?? {
        co_entidade: parseInt(inep),
        no_entidade: raw.no_entidade ?? raw.nome ?? inep,
        no_municipio: raw.no_municipio ?? "",
        sg_uf: raw.sg_uf ?? "",
        ds_dependencia: DEP_MAP[raw.tp_dependencia] ?? "",
        ds_localizacao: LOC_MAP[raw.tp_localizacao] ?? "",
        qt_matriculas: raw.qt_mat_bas ?? 0,
      };
      addToSchoolIndex(entry);
      return { dados: [entry], total: 1, _fonte: "railway_inep" };
    }
    return { dados: [], total: 0 };
  }

  // 2. Busca por nome no índice em memória (instantâneo)
  if (schoolIndex.size > 0) {
    const hits = searchSchoolIndex(trimmed, limit);
    if (hits.length > 0) return { dados: hits, total: hits.length, _fonte: "cache" };
  }

  // 3. Índice vazio / sem resultados → informa ao usuário
  return {
    dados: [],
    total: 0,
    _info: "index_empty",
    mensagem: "Índice local vazio. Use o código INEP (8 dígitos) para busca direta.",
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

    // Sobrescreve o ano do raw com dados de censo + infraestrutura completos
    if (anoRaw && ano === anoRaw) {
      censoByYear[ano] = mapCensoRaw(escolaData, censoByYear[ano]);
    }

    indicadoresByYear[ano] = mapIndicadores(h);
  }

  // Se o ano do raw não estava no historico, adiciona como entrada de censo
  if (anoRaw && !censoByYear[anoRaw]) {
    censoByYear[anoRaw] = mapCensoRaw(escolaData, { ...baseInfo });
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

  // Adiciona ao índice de busca para pesquisas futuras por nome
  if (baseInfo.no_entidade) {
    addToSchoolIndex({
      co_entidade:    parseInt(inep),
      no_entidade:    baseInfo.no_entidade,
      no_municipio:   baseInfo.no_municipio ?? "",
      sg_uf:          baseInfo.sg_uf ?? "",
      ds_dependencia: baseInfo.ds_dependencia ?? "",
      ds_localizacao: baseInfo.ds_localizacao ?? "",
      qt_matriculas:  0,
    });
  }

  return {
    co_entidade: parseInt(inep),
    anos_disponiveis: anos,
    escola: {
      ...baseInfo,
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
