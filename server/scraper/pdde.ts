import * as cheerio from "cheerio";

const BASE = "https://www.fnde.gov.br";
const CONSULTA_URL = `${BASE}/pddeinfo/pddeinfo/escola/consultar`;

const HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (compatible; PDDEInfoDash/1.0)",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

function brToFloat(s: string | null | undefined): number | null {
  const trimmed = (s || "").trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/\./g, "").replace(",", ".");
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function parseIntSafe(s: string): number | null {
  const cleaned = (s || "").trim().replace(/\./g, "").replace(",", "");
  const val = parseInt(cleaned, 10);
  return isNaN(val) ? null : val;
}

export interface PddeContaBancaria {
  programa: string;
  banco: string;
  agencia: string;
  conta: string;
  saldo: number | null;
  ocorrencia: string | null;
}

export interface PddeUex {
  executora: string;
  cnpj: string;
  uf: string;
  municipio: string;
}

export interface PddeSituacaoUex {
  mandato_inicio: string | null;
  mandato_fim: string | null;
  dados_cadastrais: string | null;
  prestacao_contas: string | null;
}

export interface PddeSituacaoEex {
  adesao: string | null;
  prestacao_contas: string | null;
}

export interface PddeDestinacao {
  destinacao: string;
  devido_custeio: number | null;
  devido_capital: number | null;
  devido_total: number | null;
  ajuste_custeio: number | null;
  ajuste_capital: number | null;
  ajuste_total: number | null;
  final_devido_total: number | null;
  pago_custeio: number | null;
  pago_capital: number | null;
  pago_total: number | null;
  data_ordem_pgto: string | null;
}

export interface PddeInfo {
  ok: boolean;
  error?: string;
  ano: number;
  co_escola: string;
  nome_escola?: string;
  uf?: string;
  municipio?: string;
  rede?: string;
  matriculas_por_nivel?: Record<string, number>;
  matriculas_total?: number | null;
  uex?: PddeUex;
  contas?: PddeContaBancaria[];
  situacao_uex?: PddeSituacaoUex;
  situacao_eex?: PddeSituacaoEex;
  destinacoes?: PddeDestinacao[];
}

function findTableByCaptionContains($target: cheerio.Cheerio<any>, $: cheerio.CheerioAPI, text: string): cheerio.Cheerio<any> | null {
  const tables = $target.find("table");
  for (let i = 0; i < tables.length; i++) {
    const table = $(tables[i]);
    const caption = table.find("caption");
    if (caption.length && caption.text().trim().toLowerCase().includes(text.toLowerCase())) {
      return table;
    }
  }
  return null;
}

export async function getPddeInfo(ano: number, coEscola: string): Promise<PddeInfo> {
  try {
    const params = new URLSearchParams({
      ano: String(ano),
      co_escola: String(coEscola),
      consultar: "Consultar",
    });

    const url = `${CONSULTA_URL}?${params.toString()}`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(30000),
      });
    } catch (fetchErr: any) {
      return { ok: false, error: `Erro de conexão com o FNDE: ${fetchErr.message || 'timeout'}`, ano, co_escola: coEscola };
    }

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}`, ano, co_escola: coEscola };
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder("iso-8859-1");
    const html = decoder.decode(buffer);
    const $ = cheerio.load(html);

  let $target: cheerio.Cheerio<any> | null = null;
  const escolaItems = $("div.escola-item");
  escolaItems.each((_: number, el: any) => {
    const item = $(el);
    item.find("td").each((_: number, td: any) => {
      if ($(td).text().trim() === String(coEscola)) {
        $target = item;
        return false;
      }
    });
    if ($target) return false;
  });

  if (!$target) {
    if (escolaItems.length === 0) {
      const bodyText = $("body").text();
      if (bodyText.includes(coEscola)) {
        $target = $("body") as any;
      }
    }
    if (!$target) {
      return { ok: false, error: "Escola não encontrada no retorno (verifique ano e código INEP).", ano, co_escola: coEscola };
    }
  }

  const data: PddeInfo = { ok: true, ano, co_escola: coEscola };

  const t1 = findTableByCaptionContains($target!, $, "Dados da Escola");
  if (t1) {
    const rows = t1.find("tbody tr");
    rows.each((_, tr) => {
      const ths = $(tr).find("th").map((_, th) => $(th).text().trim()).get();
      const tds = $(tr).find("td").map((_, td) => $(td).text().trim()).get();
      const line = ths.join(" ");

      if (line.includes("Nome Escola") && tds.length >= 2) {
        if (tds[0] === String(coEscola)) {
          data.nome_escola = tds[1];
        }
      }

      if (line.includes("UF:") && line.includes("Município:") && line.includes("Rede de Ensino:") && tds.length >= 3) {
        data.uf = tds[0];
        data.municipio = tds[1];
        data.rede = tds[2];
      }
    });

    const alunos: Record<string, number> = {};
    let total: number | null = null;
    rows.each((_, tr) => {
      const tds = $(tr).find("td").map((_, td) => $(td).text().trim()).get();
      if (tds.length >= 2) {
        const nivel = tds[0].trim();
        const qtd = tds[tds.length - 1].trim();
        if (nivel.toUpperCase() === "TOTAL") {
          total = parseIntSafe(qtd);
        } else if (nivel && !nivel.includes("Nome") && !nivel.includes("UF") && !nivel.includes("Rede")) {
          const parsed = parseIntSafe(qtd);
          if (parsed !== null && parsed > 0) {
            alunos[nivel] = parsed;
          }
        }
      }
    });
    if (Object.keys(alunos).length > 0) data.matriculas_por_nivel = alunos;
    data.matriculas_total = total;
  }

  const t2 = findTableByCaptionContains($target!, $, "Unidade Executora Própria");
  if (t2) {
    const tds = t2.find("tbody tr td").map((_, td) => $(td).text().trim()).get();
    if (tds.length >= 4) {
      data.uex = {
        executora: tds[0],
        cnpj: tds[1],
        uf: tds[2],
        municipio: tds[3],
      };
    }
  }

  const t3 = findTableByCaptionContains($target!, $, "Dados Bancários");
  const contas: PddeContaBancaria[] = [];
  if (t3) {
    t3.find("tbody tr").each((_, tr) => {
      const cols = $(tr).find("td").map((_, td) => $(td).text().trim()).get();
      if (cols.length === 6) {
        contas.push({
          programa: cols[0],
          banco: cols[1],
          agencia: cols[2],
          conta: cols[3],
          saldo: brToFloat(cols[4]),
          ocorrencia: cols[5] || null,
        });
      }
    });
  }
  data.contas = contas;

  const t4 = findTableByCaptionContains($target!, $, "Situação da Unidade Executora");
  if (t4) {
    const fullText = t4.text();
    const mandatoMatch = fullText.match(/Início do mandato:\s*([0-9/]+).*Fim do mandato:\s*([0-9/]+)/);
    const situacaoUex: PddeSituacaoUex = {
      mandato_inicio: mandatoMatch ? mandatoMatch[1] : null,
      mandato_fim: mandatoMatch ? mandatoMatch[2] : null,
      dados_cadastrais: null,
      prestacao_contas: null,
    };

    t4.find("tbody tr").each((_, tr) => {
      const th = $(tr).find("th");
      const td = $(tr).find("td");
      if (!th.length || !td.length) return;
      const k = th.text().trim().toLowerCase();
      const v = td.text().trim();
      if (k.includes("dados cadastrais")) situacaoUex.dados_cadastrais = v;
      if (k.includes("prestação de contas")) situacaoUex.prestacao_contas = v;
    });
    data.situacao_uex = situacaoUex;
  }

  const t5 = findTableByCaptionContains($target!, $, "Situação da Entidade Executora");
  if (t5) {
    const eex: PddeSituacaoEex = { adesao: null, prestacao_contas: null };
    t5.find("tbody tr").each((_, tr) => {
      const th = $(tr).find("th");
      const td = $(tr).find("td");
      if (!th.length || !td.length) return;
      const k = th.text().trim().toLowerCase();
      const v = td.text().trim();
      if (k.includes("adesão")) eex.adesao = v;
      if (k.includes("prestação de contas")) eex.prestacao_contas = v;
    });
    data.situacao_eex = eex;
  }

  const destTable = ($target! as any).find("div.listagem.destinacao table");
  const destinacoes: PddeDestinacao[] = [];
  if (destTable.length) {
    destTable.find("tbody tr").each((_: number, tr: any) => {
      const tds = $(tr).find("td").map((_i: number, td: any) => $(td).text().trim()).get();
      if (tds.length === 12) {
        destinacoes.push({
          destinacao: tds[0],
          devido_custeio: brToFloat(tds[1]),
          devido_capital: brToFloat(tds[2]),
          devido_total: brToFloat(tds[3]),
          ajuste_custeio: brToFloat(tds[4]),
          ajuste_capital: brToFloat(tds[5]),
          ajuste_total: brToFloat(tds[6]),
          final_devido_total: brToFloat(tds[7]),
          pago_custeio: brToFloat(tds[8]),
          pago_capital: brToFloat(tds[9]),
          pago_total: brToFloat(tds[10]),
          data_ordem_pgto: tds[11] || null,
        });
      }
    });
  }
  data.destinacoes = destinacoes;

    return data;
  } catch (err: any) {
    return { ok: false, error: `Erro ao processar dados do FNDE: ${err.message || 'erro desconhecido'}`, ano, co_escola: coEscola };
  }
}
