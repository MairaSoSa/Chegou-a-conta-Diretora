import * as cheerio from "cheerio";
import iconv from "iconv-lite";

const BASE = "https://www.fnde.gov.br/pddeinfo";
// Fix: The actual endpoint observed in DevTools has /pddeinfo/pddeinfo/
const CONSULTA_URL = `${BASE}/pddeinfo/escola/consultar`;

const HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "Referer": "https://www.fnde.gov.br/pddeinfo/pddeinfo/escola/consultar",
  "Accept-Encoding": "identity",
  "Connection": "keep-alive"
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

function findTableByCaptionContains($: cheerio.CheerioAPI, text: string): cheerio.Cheerio<any> | null {
  const search = text.toLowerCase();
  let found: cheerio.Cheerio<any> | null = null;
  
  $("table").each((_, table) => {
    const $t = $(table);
    const caption = $t.find("caption").text().trim().toLowerCase();
    const tableText = $t.text().toLowerCase();
    
    if (caption.includes(search) || tableText.includes(search)) {
      if ($t.find("tr").length > 0) {
        found = $t;
        return false;
      }
    }
  });
  
  return found;
}

export async function getPddeInfo(ano: number, coEscola: string): Promise<PddeInfo> {
  try {
    const params = new URLSearchParams({
      ano: String(ano),
      co_escola: String(coEscola),
      consultar: "Consultar",
    });

    // The endpoint is https://www.fnde.gov.br/pddeinfo/pddeinfo/escola/consultar
    const url = `${CONSULTA_URL}?${params.toString()}`;
    console.log(`[PDDE Scraper] Fetching: ${url}`);

    let response: Response;
    try {
      response = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(30000),
      });
    } catch (fetchErr: any) {
      console.error(`[PDDE Scraper] Fetch error:`, fetchErr);
      return { ok: false, error: `Erro de conexão com o FNDE: ${fetchErr.message || 'timeout'}`, ano, co_escola: coEscola };
    }

    if (!response.ok) {
      console.error(`[PDDE Scraper] HTTP Error: ${response.status}`);
      return { ok: false, error: `HTTP ${response.status}`, ano, co_escola: coEscola };
    }

    // Use iconv-lite to decode latin1 (ISO-8859-1) properly as noted in instructions
    const buffer = Buffer.from(await response.arrayBuffer());
    const html = iconv.decode(buffer, "latin1");
    
    console.log(`[PDDE Scraper] HTML Length: ${html.length}`);
    
    if (html.includes("sistema indisponível") || html.includes("Erro inesperado")) {
      console.error("[PDDE Scraper] FNDE system unavailable");
      return { ok: false, error: "Sistema do FNDE indisponível no momento.", ano, co_escola: coEscola };
    }

    const $ = cheerio.load(html);
    const data: PddeInfo = { ok: true, ano, co_escola: coEscola };

    // Detect missing school in portal's own message
    if (html.includes("Nenhum registro encontrado") || html.includes("não cadastrada")) {
       console.log("[PDDE Scraper] Portal returned 'No records found'");
       return { ok: false, error: "Nenhum dado financeiro encontrado para este ano.", ano, co_escola: coEscola };
    }

    // 1. DADOS DA ESCOLA
    const t1 = findTableByCaptionContains($, "Dados da Escola") || 
               findTableByCaptionContains($, "Identifica") || 
               findTableByCaptionContains($, coEscola) ||
               $("table").first();

    if (t1) {
      t1.find("tr").each((_, tr) => {
        const tds = $(tr).find("td, th").map((_, td) => $(td).text().trim()).get();
        const line = tds.join(" ").toLowerCase();
        
        if (line.includes("escola") && tds.length >= 2 && !data.nome_escola) {
          data.nome_escola = tds[tds.length - 1];
        }
        if ((line.includes("uf:") || line.includes("munic")) && tds.length >= 2) {
          tds.forEach((val, idx) => {
            if (val.toUpperCase().includes("UF:") && tds[idx+1]) data.uf = tds[idx+1];
            if (val.toLowerCase().includes("munic") && tds[idx+1]) data.municipio = tds[idx+1];
            if (val.toLowerCase().includes("rede") && tds[idx+1]) data.rede = tds[idx+1];
          });
        }
      });

      // MATRICULAS
      const alunos: Record<string, number> = {};
      let total: number | null = null;
      t1.find("tr").each((_, tr) => {
        const allCells = $(tr).find("th, td").map((_, c) => $(c).text().trim()).get();
        if (allCells.length >= 2) {
          const key = allCells[0].trim().toUpperCase();
          const val = allCells[allCells.length - 1].trim();
          if (key === "TOTAL") {
            total = parseIntSafe(val);
          } else if (key && !key.includes("NOME") && !key.includes("UF") && !key.includes("REDE") && !key.includes("NÍVEL") && val.match(/^\d+$/)) {
            const parsed = parseIntSafe(val);
            if (parsed !== null && parsed > 0) {
              alunos[allCells[0].trim()] = parsed;
            }
          }
        }
      });
      if (Object.keys(alunos).length > 0) data.matriculas_por_nivel = alunos;
      data.matriculas_total = total;
    }

    // 2. UNIDADE EXECUTORA
    const t2 = findTableByCaptionContains($, "Unidade Executora") || findTableByCaptionContains($, "UEX");
    if (t2) {
      const tds = t2.find("td").map((_, td) => $(td).text().trim()).get();
      if (tds.length >= 4) {
        data.uex = {
          executora: tds[0],
          cnpj: tds[1],
          uf: tds[2],
          municipio: tds[3],
        };
      }
    }

    // 3. DADOS BANCARIOS
    const t3 = findTableByCaptionContains($, "Dados Bancários") || findTableByCaptionContains($, "Contas");
    const contas: PddeContaBancaria[] = [];
    if (t3) {
      t3.find("tr").each((_, tr) => {
        const cols = $(tr).find("td").map((_, td) => $(td).text().trim()).get();
        if (cols.length >= 5) {
          const saldo = brToFloat(cols[4]);
          if (cols[0] && cols[0].length > 3) {
            contas.push({
              programa: cols[0],
              banco: cols[1],
              agencia: cols[2],
              conta: cols[3],
              saldo: saldo,
              ocorrencia: cols[5] || null,
            });
          }
        }
      });
    }
    data.contas = contas;

    // 4. SITUACAO UEX
    const t4 = findTableByCaptionContains($, "Situação da Unidade Executora");
    if (t4) {
      const situacaoUex: PddeSituacaoUex = {
        mandato_inicio: null, mandato_fim: null, dados_cadastrais: null, prestacao_contas: null
      };
      const text = t4.text();
      const m = text.match(/([0-9]{2}\/[0-9]{2}\/[0-9]{4})/g);
      if (m && m.length >= 2) {
        situacaoUex.mandato_inicio = m[0];
        situacaoUex.mandato_fim = m[1];
      }
      t4.find("tr").each((_, tr) => {
        const th = $(tr).find("th").text().trim().toLowerCase();
        const td = $(tr).find("td").text().trim();
        if (th.includes("dados cadastrais")) situacaoUex.dados_cadastrais = td;
        if (th.includes("prestação de contas")) situacaoUex.prestacao_contas = td;
      });
      data.situacao_uex = situacaoUex;
    }

    // 5. DESTINACOES
    const destinacoes: PddeDestinacao[] = [];
    $("table").each((_, table) => {
      const $t = $(table);
      const text = $t.text();
      if (text.includes("Destina") && text.includes("Pago")) {
        $t.find("tr").each((_, tr) => {
          const tds = $(tr).find("td").map((_, td) => $(td).text().trim()).get();
          if (tds.length >= 11) {
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
    });
    data.destinacoes = destinacoes;

    return data;
  } catch (err: any) {
    console.error(`[PDDE Scraper] Error:`, err);
    return { ok: false, error: `Erro no processamento: ${err.message}`, ano, co_escola: coEscola };
  }
}
