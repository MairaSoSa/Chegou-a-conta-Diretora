import { sqlite } from "./db";

const UF_SIGLA: Record<string, string> = {
  "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO",
  "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB", "26": "PE",
  "27": "AL", "28": "SE", "29": "BA",
  "31": "MG", "32": "ES", "33": "RJ", "35": "SP",
  "41": "PR", "42": "SC", "43": "RS",
  "50": "MS", "51": "MT", "52": "GO", "53": "DF",
};

interface IdebAvg { ai: number | null; af: number | null; em: number | null }

let municipioIdebMap: Record<string, IdebAvg> = {};
let ufIdebMap: Record<string, IdebAvg> = {};
let brasilIdeb: IdebAvg = { ai: null, af: null, em: null };
let mapsReady = false;

export function buildLocalMaps() {
  try {
    console.log("[analytics] Pré-computando médias IDEB por município/UF...");
    const t0 = Date.now();

    const rows = sqlite.prepare(`
      SELECT em.co_municipio,
             SUBSTR(CAST(em.co_municipio AS TEXT), 1, 2) AS uf_cod,
             AVG(CAST(json_extract(ie.dados, '$.ideb_ai') AS REAL)) AS ai,
             AVG(CAST(json_extract(ie.dados, '$.ideb_af') AS REAL)) AS af,
             AVG(CAST(json_extract(ie.dados, '$.ideb_em') AS REAL)) AS em
      FROM indicadores_educacionais ie
      JOIN escola_municipio em ON ie.inep = em.inep
      WHERE ie.tipo = 'ideb'
      GROUP BY em.co_municipio
    `).all() as Array<{ co_municipio: string; uf_cod: string; ai: number|null; af: number|null; em: number|null }>;

    municipioIdebMap = {};
    const ufAccum: Record<string, { ai: number[]; af: number[]; em: number[] }> = {};

    for (const r of rows) {
      municipioIdebMap[String(r.co_municipio)] = {
        ai: r.ai != null ? Math.round(r.ai * 100) / 100 : null,
        af: r.af != null ? Math.round(r.af * 100) / 100 : null,
        em: r.em != null ? Math.round(r.em * 100) / 100 : null,
      };
      const uc = r.uf_cod;
      if (!ufAccum[uc]) ufAccum[uc] = { ai: [], af: [], em: [] };
      if (r.ai != null) ufAccum[uc].ai.push(r.ai);
      if (r.af != null) ufAccum[uc].af.push(r.af);
      if (r.em != null) ufAccum[uc].em.push(r.em);
    }

    ufIdebMap = {};
    for (const [uc, acc] of Object.entries(ufAccum)) {
      const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100 : null;
      ufIdebMap[uc] = { ai: avg(acc.ai), af: avg(acc.af), em: avg(acc.em) };
    }

    const br = sqlite.prepare(`
      SELECT AVG(CAST(json_extract(dados, '$.ideb_ai') AS REAL)) AS ai,
             AVG(CAST(json_extract(dados, '$.ideb_af') AS REAL)) AS af,
             AVG(CAST(json_extract(dados, '$.ideb_em') AS REAL)) AS em
      FROM indicadores_educacionais WHERE tipo = 'ideb'
    `).get() as any;

    brasilIdeb = {
      ai: br.ai != null ? Math.round(br.ai * 100) / 100 : null,
      af: br.af != null ? Math.round(br.af * 100) / 100 : null,
      em: br.em != null ? Math.round(br.em * 100) / 100 : null,
    };

    mapsReady = true;
    console.log(`[analytics] Mapas prontos: ${rows.length} municípios, ${Object.keys(ufIdebMap).length} UFs em ${Date.now() - t0}ms`);
  } catch (e: any) {
    console.warn("[analytics] Falha ao construir mapas IDEB:", e.message);
  }
}

export function getComparativoLocal(inep: string) {
  const munRow = sqlite.prepare(
    `SELECT em.co_municipio, cs.municipio, cs.uf
     FROM escola_municipio em
     JOIN censo_escolar cs ON em.inep = cs.inep
     WHERE em.inep = ?
     ORDER BY cs.ano DESC LIMIT 1`
  ).get(inep) as any;

  if (!munRow) return null;

  const co_municipio = String(munRow.co_municipio);
  const uf_cod = co_municipio.substring(0, 2);
  const sg_uf = munRow.uf ?? UF_SIGLA[uf_cod] ?? null;
  const no_municipio = munRow.municipio ?? null;

  const idebRow = sqlite.prepare(
    `SELECT dados FROM indicadores_educacionais WHERE tipo='ideb' AND inep=? LIMIT 1`
  ).get(inep) as any;
  const inseRow = sqlite.prepare(
    `SELECT dados FROM indicadores_educacionais WHERE tipo='inse' AND inep=? LIMIT 1`
  ).get(inep) as any;

  const ideb = idebRow ? JSON.parse(idebRow.dados) : {};
  const inse = inseRow ? JSON.parse(inseRow.dados) : {};

  const munAvg = municipioIdebMap[co_municipio] ?? { ai: null, af: null, em: null };
  const ufAvg = ufIdebMap[uf_cod] ?? { ai: null, af: null, em: null };

  return {
    co_entidade: parseInt(inep),
    escola: {
      inse: inse.media_inse ?? null,
      ideb_ai: ideb.ideb_ai ?? null,
      ideb_af: ideb.ideb_af ?? null,
      ideb_em: ideb.ideb_em ?? null,
    },
    municipio: {
      nome: no_municipio,
      inse: null,
      ideb_ai: munAvg.ai,
      ideb_af: munAvg.af,
      ideb_em: munAvg.em,
    },
    uf: {
      sg: sg_uf,
      inse: null,
      ideb_ai: ufAvg.ai,
      ideb_af: ufAvg.af,
      ideb_em: ufAvg.em,
    },
    brasil: {
      inse: null,
      ideb_ai: brasilIdeb.ai,
      ideb_af: brasilIdeb.af,
      ideb_em: brasilIdeb.em,
    },
  };
}

function round1(v: number | null | undefined): number | null {
  if (v == null) return null;
  return Math.round(v * 10) / 10;
}

export function getDiagnosticoLocal(inep: string) {
  // Fetch most-recent row for each indicator type
  const getLatest = (tipo: string) => {
    const row = sqlite.prepare(`SELECT dados FROM indicadores_educacionais WHERE tipo=? AND inep=? ORDER BY ano DESC LIMIT 1`).get(tipo, inep) as any;
    return row ? JSON.parse(row.dados) : {};
  };

  const ideb = getLatest('ideb');
  const inse = getLatest('inse');
  const rend = getLatest('taxas_rendimento');
  const tdi  = getLatest('tdi');
  const atu  = getLatest('atu');
  const had  = getLatest('had');
  const dsu  = getLatest('dsu');
  const ird  = getLatest('ird');
  const afd  = getLatest('afd');
  const ied  = getLatest('ied');

  // Fetch full history for each indicator to detect progression
  const getHist = (tipo: string) =>
    (sqlite.prepare(`SELECT ano, dados FROM indicadores_educacionais WHERE tipo=? AND inep=? ORDER BY ano ASC`).all(tipo, inep) as Array<{ ano: number; dados: string }>)
      .map(r => ({ ano: r.ano, ...JSON.parse(r.dados) as any }));

  const idebHist = getHist('ideb');
  const rendHist = getHist('taxas_rendimento');
  const tdiHist  = getHist('tdi');
  const atuHist  = getHist('atu');
  const hadHist  = getHist('had');
  const dsuHist  = getHist('dsu');
  const irdHist  = getHist('ird');
  const afdHist  = getHist('afd');
  const iedHist  = getHist('ied');

  // Generic progression helper
  // higherIsBetter=true: increase is good (DSU, HAD, IRD, AFD, aprovação)
  // higherIsBetter=false: decrease is good (abandono, reprovação, TDI, ATU, IED)
  function getProgInd(
    hist: any[],
    field: string,
    higherIsBetter: boolean
  ): { delta: number; label: string; anoAnterior: number } | null {
    const comDados = hist.filter(r => { const v = Number(r[field]); return !isNaN(v) && v > 0; });
    if (comDados.length < 2) return null;
    const ultimo = comDados[comDados.length - 1];
    const penultimo = comDados[comDados.length - 2];
    const delta = Number(ultimo[field]) - Number(penultimo[field]);
    const threshold = 0.3;
    if (higherIsBetter && delta > threshold)
      return { delta, label: `subiu ${round1(delta)} p.p. desde ${penultimo.ano}`, anoAnterior: penultimo.ano };
    if (!higherIsBetter && delta < -threshold)
      return { delta, label: `caiu ${round1(Math.abs(delta))} p.p. desde ${penultimo.ano}`, anoAnterior: penultimo.ano };
    return null;
  }

  // IDEB uses points (not p.p.)
  function getIdebProgressao(field: string): { delta: number; label: string; anoAnterior: number } | null {
    const comDados = idebHist.filter(r => { const v = Number(r[field]); return !isNaN(v) && v > 0; });
    if (comDados.length < 2) return null;
    const ultimo = comDados[comDados.length - 1];
    const penultimo = comDados[comDados.length - 2];
    const delta = Number(ultimo[field]) - Number(penultimo[field]);
    if (delta > 0.05) return { delta, label: `subiu ${round1(delta)} ponto${delta >= 2 ? 's' : ''} desde ${penultimo.ano}`, anoAnterior: penultimo.ano };
    return null;
  }

  const leituras: string[] = [];
  const pontos_fortes: string[] = [];
  const pontos_atencao: string[] = [];

  const etapasIdeb = [
    { key: 'ai', label: 'Anos Iniciais' },
    { key: 'af', label: 'Anos Finais' },
    { key: 'em', label: 'Ensino Médio' },
  ] as const;

  let idebRecente: number | null = null;
  let idebEtapaRecente = '';

  for (const { key, label } of etapasIdeb) {
    const v = ideb[`ideb_${key}`];
    if (v != null) {
      idebRecente = v;
      idebEtapaRecente = label;
      const prog = getIdebProgressao(`ideb_${key}`);
      const metaTxt = round1(ideb[`projecao_${key}`]) ?? 'não disponível';
      leituras.push(`IDEB ${label}: ${round1(v)} (meta: ${metaTxt}${prog ? ` — ${prog.label}` : ''})`);
      if (v >= 6) {
        pontos_fortes.push(`IDEB excelente em ${label}: ${round1(v)}`);
      } else if (v >= 5) {
        const msg = prog ? `IDEB satisfatório em ${label}: ${round1(v)} — e ainda ${prog.label}!` : `IDEB satisfatório em ${label}: ${round1(v)}`;
        pontos_fortes.push(msg);
      } else if (prog) {
        // Below ideal but improving — celebrate the progression prominently
        pontos_fortes.push(`IDEB em ${label} avançando: ${prog.label} (atual: ${round1(v)})`);
        if (v < 4) {
          pontos_atencao.push(`IDEB em ${label} ainda abaixo de 4,0 (${round1(v)}) — a escola está crescendo, mas vale reforçar o plano pedagógico`);
        }
      } else if (v < 4) {
        pontos_atencao.push(`IDEB em ${label}: ${round1(v)} — recomenda-se elaborar plano de melhoria pedagógica com metas de curto prazo`);
      } else {
        pontos_atencao.push(`IDEB em ${label}: ${round1(v)} — acompanhe e planeje ações para alcançar a meta de ${metaTxt}`);
      }
    }
  }

  if (inse.media_inse != null) {
    leituras.push(`INSE (Nível Socioeconômico): ${round1(inse.media_inse)} — ${inse.nivel_inse ?? ''}`);
    if ((inse.media_inse ?? 0) >= 5) pontos_fortes.push(`Nível socioeconômico favorável: ${inse.nivel_inse ?? round1(inse.media_inse)}`);
  }

  // ── Taxas de Rendimento (abandono e reprovação) ──
  const abandEtapas = [
    { field: 'abandono_fund', label: 'Ensino Fundamental', limCrit: 5, limWarn: 2 },
    { field: 'abandono_med',  label: 'Ensino Médio',       limCrit: 8, limWarn: 4 },
  ];
  for (const { field, label, limCrit, limWarn } of abandEtapas) {
    const v = rend[field];
    if (v == null) continue;
    const prog = getProgInd(rendHist, field, false); // lower is better
    if (v < 1) {
      pontos_fortes.push(`Baixa taxa de abandono no ${label}: ${round1(v)}%`);
    } else if (prog) {
      pontos_fortes.push(`Abandono no ${label} em queda: ${prog.label} (atual: ${round1(v)}%)`);
      if (v > limCrit) pontos_atencao.push(`Taxa de abandono no ${label} ainda elevada (${round1(v)}%) — mas já está caindo. Continue com as ações de busca ativa.`);
    } else if (v > limCrit) {
      pontos_atencao.push(`Taxa de abandono elevada no ${label}: ${round1(v)}% — busca ativa recomendada`);
    } else if (v > limWarn) {
      pontos_atencao.push(`Taxa de abandono no ${label}: ${round1(v)}% — monitore e implemente estratégias de permanência`);
    } else if (v < 2) {
      pontos_fortes.push(`Boa retenção no ${label}: abandono de apenas ${round1(v)}%`);
    }
  }

  const reprovEtapas = [
    { field: 'reprovacao_fund', label: 'Fundamental', limCrit: 15, limWarn: 8 },
    { field: 'reprovacao_med',  label: 'Ensino Médio', limCrit: 15, limWarn: 8 },
  ];
  for (const { field, label, limCrit, limWarn } of reprovEtapas) {
    const v = rend[field];
    if (v == null) continue;
    const prog = getProgInd(rendHist, field, false);
    if (v < 5) {
      pontos_fortes.push(`Baixa reprovação no ${label}: ${round1(v)}%`);
    } else if (prog) {
      pontos_fortes.push(`Reprovação no ${label} em queda: ${prog.label} (atual: ${round1(v)}%)`);
      if (v > limCrit) pontos_atencao.push(`Reprovação no ${label} ainda elevada (${round1(v)}%) — a tendência é positiva, mas vale revisar práticas avaliativas.`);
    } else if (v > limCrit) {
      pontos_atencao.push(`Reprovação alta no ${label}: ${round1(v)}% — revise práticas pedagógicas e avaliativas`);
    } else if (v > limWarn) {
      pontos_atencao.push(`Reprovação no ${label}: ${round1(v)}% — acompanhe e considere reforço escolar`);
    }
  }

  // ── TDI (distorção idade-série) ──
  const tdiEtapas = [
    { key: 'fundamental_total', label: 'Fundamental' },
    { key: 'medio_total',       label: 'Ensino Médio' },
  ];
  for (const { key, label } of tdiEtapas) {
    const v = tdi[key];
    if (v == null) continue;
    const prog = getProgInd(tdiHist, key, false);
    if (prog) {
      pontos_fortes.push(`Distorção idade-série no ${label} em queda: ${prog.label} (atual: ${round1(v)}%)`);
      if (v > 30) pontos_atencao.push(`Distorção idade-série no ${label} ainda elevada (${round1(v)}%) — mas está melhorando. Considere programas de correção de fluxo.`);
    } else if (v > 30) {
      pontos_atencao.push(`Distorção idade-série elevada no ${label}: ${round1(v)}% — considere programas de correção de fluxo`);
    } else if (v > 20) {
      pontos_atencao.push(`Distorção idade-série no ${label}: ${round1(v)}% — monitore e planeje intervenções pedagógicas`);
    }
  }

  // ── ATU (alunos por turma) ──
  const atuEtapas = [
    { key: 'media_fund', label: 'Fundamental' },
    { key: 'media_med',  label: 'Ensino Médio' },
  ];
  for (const { key, label } of atuEtapas) {
    const v = atu[key];
    if (v == null) continue;
    const prog = getProgInd(atuHist, key, false);
    if (v > 35) {
      if (prog) {
        pontos_fortes.push(`Média de alunos/turma no ${label} caindo: ${prog.label} (atual: ${round1(v)})`);
        pontos_atencao.push(`Turmas ainda superlotadas no ${label} (${round1(v)} alunos) — mas a tendência é de redução.`);
      } else {
        pontos_atencao.push(`Turmas superlotadas no ${label}: média de ${round1(v)} alunos/turma`);
      }
    }
  }

  // ── HAD (horas-aula diárias) ──
  const hadEtapas = [
    { key: 'media_fund', label: 'Fundamental' },
    { key: 'media_med',  label: 'Ensino Médio' },
  ];
  for (const { key, label } of hadEtapas) {
    const v = had[key];
    if (v == null || v <= 0) continue;
    const prog = getProgInd(hadHist, key, true);
    if (v >= 4) {
      if (prog) pontos_fortes.push(`Carga horária no ${label} crescendo: ${prog.label} (atual: ${round1(v)}h/dia)`);
    } else if (prog) {
      pontos_fortes.push(`Carga horária no ${label} aumentando: ${prog.label} (atual: ${round1(v)}h/dia)`);
    } else {
      pontos_atencao.push(`Carga horária baixa no ${label}: ${round1(v)}h/dia — considere ampliar a jornada escolar`);
    }
  }

  // ── DSU (docentes com curso superior) ──
  const dsuEtapas = [
    { key: 'percentual_fund', label: 'Fundamental' },
    { key: 'percentual_med',  label: 'Ensino Médio' },
  ];
  for (const { key, label } of dsuEtapas) {
    const v = dsu[key];
    if (v == null || v <= 0) continue;
    const prog = getProgInd(dsuHist, key, true);
    if (v >= 80) {
      if (prog) pontos_fortes.push(`Formação superior docente no ${label} crescendo: ${prog.label} (atual: ${round1(v)}%)`);
      else pontos_fortes.push(`Boa formação docente no ${label}: ${round1(v)}% com curso superior`);
    } else if (prog) {
      pontos_fortes.push(`Formação docente no ${label} em alta: ${prog.label} (atual: ${round1(v)}%)`);
      if (v < 60) pontos_atencao.push(`Docentes com superior no ${label} ainda abaixo de 60% (${round1(v)}%) — mas crescendo.`);
    } else if (v < 60) {
      pontos_atencao.push(`Poucos docentes com curso superior no ${label}: ${round1(v)}% — incentive a formação continuada`);
    } else {
      pontos_atencao.push(`Formação docente no ${label}: ${round1(v)}% com superior — incentive a formação continuada`);
    }
  }

  // ── IRD (regularidade docente) ──
  const irdMedia = Number(ird.media_ird ?? ird.media ?? 0);
  if (irdMedia > 0) {
    const prog = getProgInd(irdHist, 'media_ird', true) || getProgInd(irdHist, 'media', true);
    if (irdMedia >= 3) {
      if (prog) pontos_fortes.push(`Regularidade docente crescendo: ${prog.label} (atual: ${irdMedia.toFixed(2)})`);
    } else if (prog) {
      pontos_fortes.push(`Regularidade docente em alta: ${prog.label} (atual: ${irdMedia.toFixed(2)})`);
    } else if (irdMedia < 2) {
      pontos_atencao.push(`Baixa regularidade docente: ${irdMedia.toFixed(2)} — alta rotatividade de professores`);
    }
  }

  // ── AFD (adequação formação docente) ──
  const afdFund = Number(afd.fun_cat_1 ?? 0);
  if (afdFund > 0) {
    const prog = getProgInd(afdHist, 'fun_cat_1', true);
    if (prog) {
      pontos_fortes.push(`Adequação docente no Fundamental crescendo: ${prog.label} (atual: ${afdFund.toFixed(1)}%)`);
      if (afdFund < 50) pontos_atencao.push(`Adequação docente no Fundamental ainda abaixo de 50% (${afdFund.toFixed(1)}%) — mas em melhora.`);
    } else if (afdFund < 50) {
      pontos_atencao.push(`Adequação da formação docente baixa: ${afdFund.toFixed(1)}% — invista em formação alinhada à área de atuação`);
    }
  }

  // ── IED (esforço docente) ──
  const iedN5 = Number(ied.nivel_5 || 0);
  const iedN6 = Number(ied.nivel_6 || 0);
  const iedAlto = iedN5 + iedN6;
  if (iedAlto > 0) {
    const prog = getProgInd(iedHist, 'nivel_5', false);
    if (iedAlto > 50) {
      if (prog) {
        pontos_fortes.push(`Sobrecarga docente em queda: ${prog.label} (atual: ${iedAlto.toFixed(1)}% nos níveis 5-6)`);
        pontos_atencao.push(`Alta sobrecarga docente ainda presente (${iedAlto.toFixed(1)}% nos níveis 5-6) — mas a tendência é positiva.`);
      } else {
        pontos_atencao.push(`Alto esforço docente: ${iedAlto.toFixed(1)}% nos níveis 5 e 6 — risco de impacto na qualidade pedagógica`);
      }
    }
  }

  // Check if any indicator is improving (for resumo_geral)
  const algumMelhorando =
    (['ai','af','em'] as const).some(k => getIdebProgressao(`ideb_${k}`) !== null) ||
    ['abandono_fund','abandono_med','reprovacao_fund'].some(f => getProgInd(rendHist, f, false) !== null) ||
    ['fundamental_total','medio_total'].some(f => getProgInd(tdiHist, f, false) !== null) ||
    ['media_fund','media_med'].some(f => getProgInd(atuHist, f, false) !== null) ||
    ['media_fund','media_med'].some(f => getProgInd(dsuHist, f, true) !== null);

  // (kept for backward compat — same as algumMelhorando)
  const algumIdebMelhorando = algumMelhorando;

  let resumo_geral = "A escola possui base mínima para acompanhamento no painel.";
  if (pontos_fortes.length > 0 && pontos_atencao.length === 0) {
    resumo_geral = algumIdebMelhorando
      ? "A escola está em trajetória positiva, com indicadores educacionais em crescimento. Continue assim!"
      : "A escola apresenta bons indicadores educacionais, com destaque nos pontos identificados.";
  } else if (pontos_fortes.length > 0 && pontos_atencao.length > 0) {
    resumo_geral = algumIdebMelhorando
      ? "A escola está crescendo — os dados mostram avanços reais. Há pontos que merecem atenção, mas o caminho é positivo."
      : "A escola possui dados relevantes para análise. Há conquistas a celebrar e pontos que merecem acompanhamento.";
  } else if (pontos_atencao.length > 0) {
    resumo_geral = "Toda escola tem seu próprio ritmo. Os pontos abaixo indicam onde concentrar energia para avançar.";
  }

  if (leituras.length === 0 && pontos_fortes.length === 0 && pontos_atencao.length === 0) {
    return null;
  }

  return {
    co_entidade: parseInt(inep),
    resumo_geral,
    leituras,
    pontos_fortes,
    pontos_atencao,
    indicadores_recentes: {
      inse_valor: inse.media_inse ?? null,
      inse_grupo: inse.nivel_inse ?? null,
      ideb_ai: ideb.ideb_ai ?? null,
      ideb_af: ideb.ideb_af ?? null,
      ideb_em: ideb.ideb_em ?? null,
    },
  };
}
