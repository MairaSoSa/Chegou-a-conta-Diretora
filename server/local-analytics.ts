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
  // Fetch most-recent IDEB row
  const idebRow = sqlite.prepare(`SELECT dados FROM indicadores_educacionais WHERE tipo='ideb' AND inep=? ORDER BY ano DESC LIMIT 1`).get(inep) as any;
  const inseRow = sqlite.prepare(`SELECT dados FROM indicadores_educacionais WHERE tipo='inse' AND inep=? ORDER BY ano DESC LIMIT 1`).get(inep) as any;
  const rendRow = sqlite.prepare(`SELECT dados FROM indicadores_educacionais WHERE tipo='taxas_rendimento' AND inep=? ORDER BY ano DESC LIMIT 1`).get(inep) as any;
  const tdiRow = sqlite.prepare(`SELECT dados FROM indicadores_educacionais WHERE tipo='tdi' AND inep=? ORDER BY ano DESC LIMIT 1`).get(inep) as any;
  const atuRow = sqlite.prepare(`SELECT dados FROM indicadores_educacionais WHERE tipo='atu' AND inep=? ORDER BY ano DESC LIMIT 1`).get(inep) as any;

  const ideb = idebRow ? JSON.parse(idebRow.dados) : {};
  const inse = inseRow ? JSON.parse(inseRow.dados) : {};
  const rend = rendRow ? JSON.parse(rendRow.dados) : {};
  const tdi = tdiRow ? JSON.parse(tdiRow.dados) : {};
  const atu = atuRow ? JSON.parse(atuRow.dados) : {};

  // Fetch all historical IDEB years for this school to detect progression
  const idebHistRows = sqlite.prepare(
    `SELECT ano, dados FROM indicadores_educacionais WHERE tipo='ideb' AND inep=? ORDER BY ano ASC`
  ).all(inep) as Array<{ ano: number; dados: string }>;
  const idebHistorico = idebHistRows.map(r => ({ ano: r.ano, ...JSON.parse(r.dados) }));

  // Helper: detect IDEB progression for a field (e.g. 'ideb_ai')
  // Finds the two most recent years that actually have data for that field
  function getIdebProgressao(field: string): { delta: number; label: string; anoAnterior: number } | null {
    const comDados = idebHistorico.filter(r => {
      const v = Number((r as any)[field]);
      return !isNaN(v) && v > 0;
    });
    if (comDados.length < 2) return null;
    const ultimo = comDados[comDados.length - 1];
    const penultimo = comDados[comDados.length - 2];
    const vAtual = Number((ultimo as any)[field]);
    const vAnterior = Number((penultimo as any)[field]);
    const delta = vAtual - vAnterior;
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

  const abandFund = rend.abandono_fund;
  const abandMed = rend.abandono_med;
  if (abandFund != null && abandFund < 1) pontos_fortes.push(`Baixa taxa de abandono no Ensino Fundamental: ${round1(abandFund)}%`);
  else if (abandFund != null && abandFund > 5) pontos_atencao.push(`Taxa de abandono elevada no Fundamental: ${round1(abandFund)}% — busca ativa recomendada`);

  if (abandMed != null && abandMed > 8) pontos_atencao.push(`Taxa de abandono no Ensino Médio: ${round1(abandMed)}% — atenção à permanência`);
  else if (abandMed != null && abandMed < 2) pontos_fortes.push(`Boa retenção no Ensino Médio: abandono de apenas ${round1(abandMed)}%`);

  const reprovFund = rend.reprovacao_fund;
  if (reprovFund != null) {
    if (reprovFund > 15) pontos_atencao.push(`Reprovação alta no Fundamental: ${round1(reprovFund)}%`);
    else if (reprovFund < 5) pontos_fortes.push(`Baixa reprovação no Fundamental: ${round1(reprovFund)}%`);
  }

  const tdiEtapas = [
    { key: 'tdi_fund_ai', label: 'Fundamental AI' },
    { key: 'tdi_fund_af', label: 'Fundamental AF' },
    { key: 'tdi_med', label: 'Ensino Médio' },
  ];
  for (const { key, label } of tdiEtapas) {
    const v = tdi[key];
    if (v != null && v > 30) pontos_atencao.push(`Distorção idade-série elevada no ${label}: ${round1(v)}%`);
  }

  const atuEtapas = [
    { key: 'atu_fund_ai', label: 'Fundamental AI' },
    { key: 'atu_fund_af', label: 'Fundamental AF' },
    { key: 'atu_med', label: 'Ensino Médio' },
  ];
  for (const { key, label } of atuEtapas) {
    const v = atu[key];
    if (v != null && v > 35) pontos_atencao.push(`Turmas superlotadas no ${label}: média de ${round1(v)} alunos/turma`);
  }

  // Check if there is any IDEB progression detected
  const algumIdebMelhorando = (['ai','af','em'] as const).some(k => getIdebProgressao(`ideb_${k}`) !== null);

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
