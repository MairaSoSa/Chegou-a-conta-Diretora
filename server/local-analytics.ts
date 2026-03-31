import { pgAll, pgGet } from "./pg";

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

export async function buildLocalMaps() {
  try {
    console.log("[analytics] Pré-computando médias IDEB por município/UF...");
    const t0 = Date.now();

    const rows = await pgAll<{
      co_municipio: string;
      uf_cod: string;
      ai: number | null;
      af: number | null;
      em: number | null;
    }>(`
      SELECT co_municipio::text AS co_municipio,
             LEFT(co_municipio::text, 2) AS uf_cod,
             AVG(CASE WHEN etapa='anos_iniciais' THEN ideb END) AS ai,
             AVG(CASE WHEN etapa='anos_finais'   THEN ideb END) AS af,
             AVG(CASE WHEN etapa='ensino_medio'  THEN ideb END) AS em
      FROM ideb_escola
      WHERE ideb IS NOT NULL AND co_municipio IS NOT NULL
      GROUP BY co_municipio::text
    `);

    municipioIdebMap = {};
    const ufAccum: Record<string, { ai: number[]; af: number[]; em: number[] }> = {};

    for (const r of rows) {
      municipioIdebMap[r.co_municipio] = {
        ai: r.ai != null ? Math.round(Number(r.ai) * 100) / 100 : null,
        af: r.af != null ? Math.round(Number(r.af) * 100) / 100 : null,
        em: r.em != null ? Math.round(Number(r.em) * 100) / 100 : null,
      };
      const uc = r.uf_cod;
      if (!ufAccum[uc]) ufAccum[uc] = { ai: [], af: [], em: [] };
      if (r.ai != null) ufAccum[uc].ai.push(Number(r.ai));
      if (r.af != null) ufAccum[uc].af.push(Number(r.af));
      if (r.em != null) ufAccum[uc].em.push(Number(r.em));
    }

    ufIdebMap = {};
    for (const [uc, acc] of Object.entries(ufAccum)) {
      const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100 : null;
      ufIdebMap[uc] = { ai: avg(acc.ai), af: avg(acc.af), em: avg(acc.em) };
    }

    const br = await pgGet<{ ai: number | null; af: number | null; em: number | null }>(`
      SELECT AVG(CASE WHEN etapa='anos_iniciais' THEN ideb END) AS ai,
             AVG(CASE WHEN etapa='anos_finais'   THEN ideb END) AS af,
             AVG(CASE WHEN etapa='ensino_medio'  THEN ideb END) AS em
      FROM ideb_escola WHERE ideb IS NOT NULL
    `);

    brasilIdeb = {
      ai: br?.ai != null ? Math.round(Number(br.ai) * 100) / 100 : null,
      af: br?.af != null ? Math.round(Number(br.af) * 100) / 100 : null,
      em: br?.em != null ? Math.round(Number(br.em) * 100) / 100 : null,
    };

    mapsReady = true;
    console.log(`[analytics] Mapas prontos: ${rows.length} municípios, ${Object.keys(ufIdebMap).length} UFs em ${Date.now() - t0}ms`);
  } catch (e: any) {
    console.warn("[analytics] Falha ao construir mapas IDEB:", e.message);
  }
}

export async function getComparativoLocal(inep: string) {
  try {
    const munRow = await pgGet<{ co_municipio: string }>(
      `SELECT co_municipio::text AS co_municipio FROM escola_municipio WHERE inep=? LIMIT 1`,
      [inep]
    );
    if (!munRow) return null;

    const co_municipio = String(munRow.co_municipio);
    const uf_cod = co_municipio.substring(0, 2);
    const sg_uf = UF_SIGLA[uf_cod] ?? null;

    const escolaRow = await pgGet<{ nome: string | null; municipio: string | null; uf: string | null }>(
      `SELECT nome, municipio, uf FROM escola_busca WHERE inep=? LIMIT 1`,
      [inep]
    );
    const no_municipio = escolaRow?.municipio ?? null;

    const coEntidade = parseInt(inep);
    const idebRows = await pgAll<{ etapa: string; ideb: number | null }>(
      `SELECT etapa, ideb FROM ideb_escola WHERE co_entidade=? AND ano=(SELECT MAX(ano) FROM ideb_escola WHERE co_entidade=?) ORDER BY etapa`,
      [coEntidade, coEntidade]
    );
    const ideb: Record<string, any> = {};
    for (const r of idebRows) {
      const v = r.ideb != null ? Number(r.ideb) : null;
      if (r.etapa === 'anos_iniciais') ideb.ideb_ai = v;
      if (r.etapa === 'anos_finais')   ideb.ideb_af = v;
      if (r.etapa === 'ensino_medio')  ideb.ideb_em = v;
    }

    const inseRow = await pgGet<{ dados_json: string }>(
      `SELECT dados_json FROM inse_escola WHERE co_entidade=? ORDER BY ano DESC LIMIT 1`,
      [coEntidade]
    );
    const inseJson = inseRow ? (typeof inseRow.dados_json === 'string' ? JSON.parse(inseRow.dados_json) : inseRow.dados_json) : {};
    const inse = { media_inse: inseJson?.MEDIA_INSE ?? null, nivel_inse: inseJson?.INSE_CLASSIFICACAO ?? null };

    const munAvg = municipioIdebMap[co_municipio] ?? { ai: null, af: null, em: null };
    const ufAvg  = ufIdebMap[uf_cod] ?? { ai: null, af: null, em: null };

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
  } catch (e: any) {
    console.warn("[analytics] getComparativoLocal erro:", e.message);
    return null;
  }
}

function round1(v: number | null | undefined): number | null {
  if (v == null) return null;
  return Math.round(v * 10) / 10;
}

function jsonField(obj: any, key: string): number | null {
  const v = obj?.[key];
  if (v == null || v === '--') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

async function getLatestFromTable(table: string, coEntidade: number): Promise<any> {
  try {
    const row = await pgGet<{ dados_json: string; ano: number }>(
      `SELECT dados_json, ano FROM ${table} WHERE co_entidade=? ORDER BY ano DESC LIMIT 1`,
      [coEntidade]
    );
    if (!row) return {};
    return typeof row.dados_json === 'string' ? JSON.parse(row.dados_json) : (row.dados_json ?? {});
  } catch { return {}; }
}

async function getHistFromTable(table: string, coEntidade: number): Promise<Array<{ ano: number } & Record<string, any>>> {
  try {
    const rows = await pgAll<{ dados_json: string; ano: number }>(
      `SELECT ano, dados_json FROM ${table} WHERE co_entidade=? ORDER BY ano ASC`,
      [coEntidade]
    );
    return rows.map(r => ({
      ano: Number(r.ano),
      ...(typeof r.dados_json === 'string' ? JSON.parse(r.dados_json) : (r.dados_json ?? {})),
    }));
  } catch { return []; }
}

export async function getDiagnosticoLocal(inep: string) {
  try {
    const coEntidade = parseInt(inep);

    const [idebRows, idebHistRows, inseRow, rendRow, tdiRow, atuRow, hadRow, irdRow, afdRow, iedRow] = await Promise.all([
      pgAll<{ etapa: string; ideb: number | null; ano: number }>(
        `SELECT etapa, ideb, ano FROM ideb_escola WHERE co_entidade=? AND ano=(SELECT MAX(ano) FROM ideb_escola WHERE co_entidade=?)`,
        [coEntidade, coEntidade]
      ),
      pgAll<{ etapa: string; ideb: number | null; ano: number }>(
        `SELECT ano, etapa, ideb FROM ideb_escola WHERE co_entidade=? ORDER BY ano ASC`,
        [coEntidade]
      ),
      pgGet<{ dados_json: string }>(
        `SELECT dados_json FROM inse_escola WHERE co_entidade=? ORDER BY ano DESC LIMIT 1`,
        [coEntidade]
      ),
      getLatestFromTable('rendimento_escola', coEntidade),
      getLatestFromTable('tdi_escola', coEntidade),
      getLatestFromTable('atu_escola', coEntidade),
      getLatestFromTable('had_escola', coEntidade),
      getLatestFromTable('ird_escola', coEntidade),
      getLatestFromTable('afd_escola', coEntidade),
      getLatestFromTable('ied_escola', coEntidade),
    ]);

    const [rendHist, tdiHist, atuHist, hadHist, irdHist, afdHist, iedHist] = await Promise.all([
      getHistFromTable('rendimento_escola', coEntidade),
      getHistFromTable('tdi_escola', coEntidade),
      getHistFromTable('atu_escola', coEntidade),
      getHistFromTable('had_escola', coEntidade),
      getHistFromTable('ird_escola', coEntidade),
      getHistFromTable('afd_escola', coEntidade),
      getHistFromTable('ied_escola', coEntidade),
    ]);

    const ideb: Record<string, any> = {};
    for (const r of idebRows) {
      const v = r.ideb != null ? Number(r.ideb) : null;
      if (r.etapa === 'anos_iniciais') ideb.ideb_ai = v;
      if (r.etapa === 'anos_finais')   ideb.ideb_af = v;
      if (r.etapa === 'ensino_medio')  ideb.ideb_em = v;
    }

    const idebHistByAno: Record<number, any> = {};
    for (const r of idebHistRows) {
      if (!idebHistByAno[r.ano]) idebHistByAno[r.ano] = { ano: r.ano };
      const v = r.ideb != null ? Number(r.ideb) : null;
      if (r.etapa === 'anos_iniciais') idebHistByAno[r.ano].ideb_ai = v;
      if (r.etapa === 'anos_finais')   idebHistByAno[r.ano].ideb_af = v;
      if (r.etapa === 'ensino_medio')  idebHistByAno[r.ano].ideb_em = v;
    }
    const idebHist = Object.values(idebHistByAno).sort((a: any, b: any) => a.ano - b.ano);

    const inseJson = inseRow ? (typeof inseRow.dados_json === 'string' ? JSON.parse(inseRow.dados_json) : inseRow.dados_json) : {};
    const inse = { media_inse: inseJson?.MEDIA_INSE ?? null, nivel_inse: inseJson?.INSE_CLASSIFICACAO ?? null };

    const rend = {
      abandono_fund:   jsonField(rendRow, 'Taxa de Abandono'),
      abandono_med:    jsonField(rendRow, 'Taxa de Abandono'),
      reprovacao_fund: jsonField(rendRow, 'Taxa de Reprovação'),
      reprovacao_med:  jsonField(rendRow, 'Taxa de Reprovação'),
    };

    const tdi = {
      fundamental_total: jsonField(tdiRow, 'FUN_CAT_0'),
      medio_total:       jsonField(tdiRow, 'MED_CAT_0'),
    };

    const atu = {
      media_fund: jsonField(atuRow, 'FUN_CAT_0'),
      media_med:  jsonField(atuRow, 'MED_CAT_0'),
    };

    const had = {
      media_fund: jsonField(hadRow, 'FUN_CAT_0'),
      media_med:  jsonField(hadRow, 'MED_CAT_0'),
    };

    const ird = { media_ird: jsonField(irdRow, 'EDU_BAS_CAT_0') };

    const dsu = { percentual_fund: null as number | null, percentual_med: null as number | null };

    const afd = { fun_cat_1: jsonField(afdRow, 'FUN_CAT_1') };

    const ied = {
      nivel_5: jsonField(iedRow, 'FUN_CAT_5'),
      nivel_6: jsonField(iedRow, 'FUN_CAT_6'),
    };

    const rendHistMapped = rendHist.map(r => ({
      ano: r.ano,
      abandono_fund:   jsonField(r, 'Taxa de Abandono'),
      abandono_med:    jsonField(r, 'Taxa de Abandono'),
      reprovacao_fund: jsonField(r, 'Taxa de Reprovação'),
      reprovacao_med:  jsonField(r, 'Taxa de Reprovação'),
    }));

    const tdiHistMapped  = tdiHist.map(r => ({ ano: r.ano, fundamental_total: jsonField(r, 'FUN_CAT_0'), medio_total: jsonField(r, 'MED_CAT_0') }));
    const atuHistMapped  = atuHist.map(r => ({ ano: r.ano, media_fund: jsonField(r, 'FUN_CAT_0'), media_med: jsonField(r, 'MED_CAT_0') }));
    const hadHistMapped  = hadHist.map(r => ({ ano: r.ano, media_fund: jsonField(r, 'FUN_CAT_0'), media_med: jsonField(r, 'MED_CAT_0') }));
    const irdHistMapped  = irdHist.map(r => ({ ano: r.ano, media_ird: jsonField(r, 'EDU_BAS_CAT_0') }));
    const dsuHistMapped: any[] = [];
    const afdHistMapped  = afdHist.map(r => ({ ano: r.ano, fun_cat_1: jsonField(r, 'FUN_CAT_1') }));
    const iedHistMapped  = iedHist.map(r => ({ ano: r.ano, nivel_5: jsonField(r, 'FUN_CAT_5'), nivel_6: jsonField(r, 'FUN_CAT_6') }));

    const iedAltoTotal = Number(ied.nivel_5 || 0) + Number(ied.nivel_6 || 0);

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
      leituras.push(`INSE (Nível Socioeconômico): ${round1(Number(inse.media_inse))} — ${inse.nivel_inse ?? ''}`);
      if ((Number(inse.media_inse) ?? 0) >= 5) pontos_fortes.push(`Nível socioeconômico favorável: ${inse.nivel_inse ?? round1(Number(inse.media_inse))}`);
    }

    const abandEtapas = [
      { field: 'abandono_fund', label: 'Ensino Fundamental', limCrit: 5, limWarn: 2 },
      { field: 'abandono_med',  label: 'Ensino Médio',       limCrit: 8, limWarn: 4 },
    ];
    for (const { field, label, limCrit, limWarn } of abandEtapas) {
      const v = (rend as any)[field];
      if (v == null) continue;
      const prog = getProgInd(rendHistMapped, field, false);
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
      const v = (rend as any)[field];
      if (v == null) continue;
      const prog = getProgInd(rendHistMapped, field, false);
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

    const tdiEtapas = [
      { key: 'fundamental_total', label: 'Fundamental' },
      { key: 'medio_total',       label: 'Ensino Médio' },
    ];
    for (const { key, label } of tdiEtapas) {
      const v = (tdi as any)[key];
      if (v == null) continue;
      const prog = getProgInd(tdiHistMapped, key, false);
      if (prog) {
        pontos_fortes.push(`Distorção idade-série no ${label} em queda: ${prog.label} (atual: ${round1(v)}%)`);
        if (v > 30) pontos_atencao.push(`Distorção idade-série no ${label} ainda elevada (${round1(v)}%) — mas está em queda. Reforçar ações de recomposição da aprendizagem e programas de aceleração de estudos pode acelerar esse avanço.`);
      } else if (v > 30) {
        pontos_atencao.push(`Distorção idade-série elevada no ${label}: ${round1(v)}% — estratégias de recomposição da aprendizagem e programas de aceleração de estudos são caminhos reconhecidos para reduzir essa defasagem.`);
      } else if (v > 20) {
        pontos_atencao.push(`Distorção idade-série no ${label}: ${round1(v)}% — monitore e planeje intervenções pedagógicas, com atenção à recomposição da aprendizagem dos alunos com maior defasagem.`);
      }
    }

    const atuEtapas = [
      { key: 'media_fund', label: 'Fundamental' },
      { key: 'media_med',  label: 'Ensino Médio' },
    ];
    for (const { key, label } of atuEtapas) {
      const v = (atu as any)[key];
      if (v == null) continue;
      const prog = getProgInd(atuHistMapped, key, false);
      if (v > 35) {
        if (prog) {
          pontos_fortes.push(`Média de alunos/turma no ${label} caindo: ${prog.label} (atual: ${round1(v)})`);
          pontos_atencao.push(`Turmas ainda superlotadas no ${label} (${round1(v)} alunos) — mas a tendência é de redução.`);
        } else {
          pontos_atencao.push(`Turmas superlotadas no ${label}: média de ${round1(v)} alunos/turma`);
        }
      }
    }

    const hadEtapas = [
      { key: 'media_fund', label: 'Fundamental' },
      { key: 'media_med',  label: 'Ensino Médio' },
    ];
    for (const { key, label } of hadEtapas) {
      const v = (had as any)[key];
      if (v == null || v <= 0) continue;
      const prog = getProgInd(hadHistMapped, key, true);
      if (prog) {
        if (iedAltoTotal > 30) {
          pontos_atencao.push(`Carga horária no ${label} subiu (${prog.label}, atual: ${round1(v)}h/dia), mas ${round1(iedAltoTotal)}% dos docentes já acumulam muitas escolas ou turnos — acompanhe o esforço docente.`);
        } else {
          leituras.push(`Carga horária no ${label}: ${prog.label} (atual: ${round1(v)}h/dia). Aumento de jornada pode ampliar o tempo de aprendizado, mas vale acompanhar o impacto no ritmo escolar.`);
        }
      } else if (v < 4) {
        pontos_atencao.push(`Carga horária no ${label} abaixo de 4h/dia (${round1(v)}h) — considere estratégias para ampliar a jornada escolar.`);
      }
    }

    const dsuEtapas = [
      { key: 'percentual_fund', label: 'Fundamental' },
      { key: 'percentual_med',  label: 'Ensino Médio' },
    ];
    for (const { key, label } of dsuEtapas) {
      const v = (dsu as any)[key];
      if (v == null || v <= 0) continue;
      const prog = getProgInd(dsuHistMapped, key, true);
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

    const irdMedia = Number(ird.media_ird ?? 0);
    if (irdMedia > 0) {
      const prog = getProgInd(irdHistMapped, 'media_ird', true);
      if (irdMedia >= 3) {
        if (prog) pontos_fortes.push(`Regularidade docente crescendo: ${prog.label} (atual: ${irdMedia.toFixed(2)})`);
      } else if (prog) {
        pontos_fortes.push(`Regularidade docente em alta: ${prog.label} (atual: ${irdMedia.toFixed(2)})`);
      } else if (irdMedia < 2) {
        pontos_atencao.push(`Baixa regularidade docente: ${irdMedia.toFixed(2)} — alta rotatividade de professores`);
      }
    }

    const afdFund = Number(afd.fun_cat_1 ?? 0);
    if (afdFund > 0) {
      const prog = getProgInd(afdHistMapped, 'fun_cat_1', true);
      if (prog) {
        pontos_fortes.push(`Adequação docente no Fundamental crescendo: ${prog.label} (atual: ${afdFund.toFixed(1)}%)`);
        if (afdFund < 50) pontos_atencao.push(`Adequação docente no Fundamental ainda abaixo de 50% (${afdFund.toFixed(1)}%) — mas em melhora.`);
      } else if (afdFund < 50) {
        pontos_atencao.push(`Adequação da formação docente baixa: ${afdFund.toFixed(1)}% — invista em formação alinhada à área de atuação`);
      }
    }

    if (iedAltoTotal > 0) {
      const prog = getProgInd(iedHistMapped, 'nivel_5', false);
      if (iedAltoTotal > 50) {
        if (prog) {
          pontos_fortes.push(`Sobrecarga docente em queda: ${prog.label} (atual: ${iedAltoTotal.toFixed(1)}% nos níveis 5-6)`);
          pontos_atencao.push(`Alta sobrecarga docente ainda presente (${iedAltoTotal.toFixed(1)}% nos níveis 5-6) — mas a tendência é positiva.`);
        } else {
          pontos_atencao.push(`Alto esforço docente: ${iedAltoTotal.toFixed(1)}% nos níveis 5 e 6 — risco de impacto na qualidade pedagógica`);
        }
      }
    }

    const algumMelhorando =
      (['ai','af','em'] as const).some(k => getIdebProgressao(`ideb_${k}`) !== null) ||
      ['abandono_fund','abandono_med','reprovacao_fund'].some(f => getProgInd(rendHistMapped, f, false) !== null) ||
      ['fundamental_total','medio_total'].some(f => getProgInd(tdiHistMapped, f, false) !== null) ||
      ['media_fund','media_med'].some(f => getProgInd(atuHistMapped, f, false) !== null) ||
      ['media_fund','media_med'].some(f => getProgInd(dsuHistMapped, f, true) !== null);

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
  } catch (e: any) {
    console.warn("[analytics] getDiagnosticoLocal erro:", e.message);
    return null;
  }
}
