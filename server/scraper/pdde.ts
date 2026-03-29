import * as cheerio from "cheerio";
import iconv from "iconv-lite";

const BASE = "https://www.fnde.gov.br/pddeinfo";
const CONSULTA_URL = `${BASE}/pddeinfo/escola/consultar`;
const SALDO_UEX_URL = `${BASE}/consultasaldoentidade/consultasaldoentidade/consultasaldoentidade`;
const SITUACAO_CADASTRAL_URL = `${BASE}/situacaocadastroentidade/situacaocadastroentidade/situacaocadastroentidade`;

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

function normalizeText(value = ""): string {
  return value.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
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

export interface PddeProgramaPendente {
  ano_exercicio: number;
  programa: string;
}

export interface PddeSituacaoUex {
  mandato_inicio: string | null;
  mandato_fim: string | null;
  dados_cadastrais: string | null;
  prestacao_contas: string | null;
  programas_pendentes: PddeProgramaPendente[];
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

export interface PddeUexSaldo {
  uf: string | null;
  municipio: string | null;
  rede_atendimento: string | null;
  cnpj: string | null;
  razao_social: string | null;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  mes_ano: string | null;
  saldo_conta: number | null;
  saldo_fundos: number | null;
  saldo_poupanca: number | null;
  saldo_rdb_cdb: number | null;
  programa: string | null;
  saldo_total: number | null;
}

export interface PddeUexSaldoResult {
  ok: boolean;
  mes: string;
  cnpj: string;
  saldos: PddeUexSaldo[];
  total_saldo_fundos: number;
  total_saldo_geral: number;
  error?: string;
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

// Extract pending prestação de contas programs from full page text using regex
function extractProgramasPendentes(text: string): PddeProgramaPendente[] {
  const results: PddeProgramaPendente[] = [];

  // Look for a block after "Prestação de Contas" heading with year+program pairs
  const blockMatch = text.match(/Presta[cç][aã]o\s*de\s*Contas[\s\S]*?Ano\s*Exerc[ií]cio\s*Programa\s*([\s\S]*?)(?:Situa[cç][aã]o\s*da\s*Entidade\s*Executora|Destina[cç][aã]o|$)/i);
  if (!blockMatch) return results;

  const block = normalizeText(blockMatch[1]);
  const rowRegex = /(20[0-9]{2})\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-Za-záàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ0-9 \-\/]+)/g;

  let row;
  while ((row = rowRegex.exec(block)) !== null) {
    const programa = normalizeText(row[2]);
    if (programa.length > 2) {
      results.push({
        ano_exercicio: Number(row[1]),
        programa,
      });
    }
  }

  return results;
}

// Fallback text-based extraction for school basic data when table parsing fails
function extractBasicDataFromText(text: string): Partial<PddeInfo> {
  const result: Partial<PddeInfo> = {};

  const nome = text.match(/Nome\s*Escola:\s*(.+?)\s+UF:/i);
  const uf = text.match(/UF:\s*([A-Z]{2})/i);
  const municipio = text.match(/Munic[ií]pio:\s*(.+?)\s+(?:Rede\s*de\s*Ensino|N[ií]vel)/i);
  const rede = text.match(/Rede\s*de\s*Ensino:\s*(.+?)(?:\s+N[ií]vel|\s+Unidade|\s*$)/i);

  if (nome) result.nome_escola = normalizeText(nome[1]);
  if (uf) result.uf = uf[1];
  if (municipio) result.municipio = normalizeText(municipio[1]);
  if (rede) result.rede = normalizeText(rede[1]);

  return result;
}

// Fallback text-based extraction for matriculas
function extractMatriculasFromText(text: string): Record<string, number> {
  const alunos: Record<string, number> = {};
  const regex = /(ENSINO FUNDAMENTAL|PRÉ-ESCOLAR|CRECHE|ENSINO MÉDIO|EJA)\s+([0-9]+)/gi;
  let m;
  while ((m = regex.exec(text)) !== null) {
    alunos[normalizeText(m[1])] = Number(m[2]);
  }
  return alunos;
}

// Parse the saldo page from consultasaldoentidade (query-string format)
// Columns: UF(0) Município(1) Rede(2) CNPJ(3) RazãoSocial(4) Banco(5) Agência(6)
//          Conta(7) Mês/Ano(8) SaldoConta(9) SaldoFundos(10) SaldoPoupança(11)
//          SaldoRDB/CDB(12) Programa(13)
function parseSaldoPage($: cheerio.CheerioAPI): PddeUexSaldo[] {
  const saldos: PddeUexSaldo[] = [];

  $("#listagem tbody tr").each((_, tr) => {
    const cols = $(tr).find("td")
      .map((_: number, el: any) => normalizeText($(el).text())).get();

    if (cols.length >= 10) {
      const sc = brToFloat(cols[9]);
      const sf = brToFloat(cols[10]);
      const sp = brToFloat(cols[11]);
      const sr = brToFloat(cols[12]);
      const total = (sc || 0) + (sf || 0) + (sp || 0) + (sr || 0);
      saldos.push({
        uf: cols[0] || null,
        municipio: cols[1] || null,
        rede_atendimento: cols[2] || null,
        cnpj: cols[3] || null,
        razao_social: cols[4] || null,
        banco: cols[5] || null,
        agencia: cols[6] || null,
        conta: cols[7] || null,
        mes_ano: cols[8] || null,
        saldo_conta: sc,
        saldo_fundos: sf,
        saldo_poupanca: sp,
        saldo_rdb_cdb: sr,
        programa: cols[13] || null,
        saldo_total: total,
      });
    }
  });

  return saldos;
}

export async function getPddeInfo(ano: number, coEscola: string): Promise<PddeInfo> {
  try {
    const params = new URLSearchParams({
      ano: String(ano),
      co_escola: String(coEscola),
      consultar: "Consultar",
    });

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

    const buffer = Buffer.from(await response.arrayBuffer());
    const html = iconv.decode(buffer, "latin1");

    console.log(`[PDDE Scraper] HTML Length: ${html.length}`);

    if (html.includes("sistema indisponível") || html.includes("Erro inesperado")) {
      return { ok: false, error: "Sistema do FNDE indisponível no momento.", ano, co_escola: coEscola };
    }
    if (html.includes("ORA-") || html.includes("OCIStmtExecute") || html.includes("SQLSTATE")) {
      return { ok: false, error: "O banco de dados do FNDE está com erro interno. Tente novamente mais tarde.", ano, co_escola: coEscola };
    }
    if (html.includes("msgAlerta") && html.includes("General error")) {
      return { ok: false, error: "O sistema do FNDE está com problemas técnicos. Tente novamente mais tarde.", ano, co_escola: coEscola };
    }

    const $ = cheerio.load(html);
    const fullText = normalizeText($("body").text());

    if (html.includes("Nenhum registro encontrado") || html.includes("não cadastrada")) {
      return { ok: false, error: "Nenhum dado financeiro encontrado para este ano.", ano, co_escola: coEscola };
    }

    const data: PddeInfo = { ok: true, ano, co_escola: coEscola };

    // 1. DADOS DA ESCOLA (table-based, with text fallback)
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

      // Matriculas from table
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

    // Fallback: text-based extraction if table parsing missed key fields
    if (!data.nome_escola || !data.uf) {
      const textData = extractBasicDataFromText(fullText);
      if (!data.nome_escola && textData.nome_escola) data.nome_escola = textData.nome_escola;
      if (!data.uf && textData.uf) data.uf = textData.uf;
      if (!data.municipio && textData.municipio) data.municipio = textData.municipio;
      if (!data.rede && textData.rede) data.rede = textData.rede;
    }
    if (!data.matriculas_por_nivel || Object.keys(data.matriculas_por_nivel).length === 0) {
      const fallbackMatriculas = extractMatriculasFromText(fullText);
      if (Object.keys(fallbackMatriculas).length > 0) data.matriculas_por_nivel = fallbackMatriculas;
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

    // 3. DADOS BANCARIOS — resilient: detect by headers
    const contas: PddeContaBancaria[] = [];
    $("table").each((_, table) => {
      const $t = $(table);
      const headers = $t.find("tr").first().find("th, td")
        .map((_: number, el: any) => normalizeText($(el).text())).get();

      const looksLikeBank =
        headers.some((h: string) => /Programa|A[cç][aã]o/i.test(h)) &&
        headers.some((h: string) => /Banco/i.test(h)) &&
        headers.some((h: string) => /Ag[eê]ncia/i.test(h)) &&
        headers.some((h: string) => /Conta/i.test(h));

      if (!looksLikeBank) return;

      $t.find("tr").slice(1).each((_: number, tr: any) => {
        const cols = $(tr).find("td").map((_: number, td: any) => $(td).text().trim()).get();
        if (cols.length >= 5 && cols[0] && cols[0].length > 3) {
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
    });
    if (contas.length === 0) {
      // Fallback: findTableByCaptionContains
      const t3 = findTableByCaptionContains($, "Dados Bancários") || findTableByCaptionContains($, "Contas");
      if (t3) {
        t3.find("tr").each((_, tr) => {
          const cols = $(tr).find("td").map((_, td) => $(td).text().trim()).get();
          if (cols.length >= 5 && cols[0] && cols[0].length > 3) {
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
    }
    data.contas = contas;

    // 4. SITUACAO UEX + PROGRAMAS PENDENTES
    const t4 = findTableByCaptionContains($, "Situação da Unidade Executora");
    const situacaoUex: PddeSituacaoUex = {
      mandato_inicio: null,
      mandato_fim: null,
      dados_cadastrais: null,
      prestacao_contas: null,
      programas_pendentes: [],
    };
    if (t4) {
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
    }
    // Always try to extract pending programs from full text
    situacaoUex.programas_pendentes = extractProgramasPendentes(fullText);
    data.situacao_uex = situacaoUex;

    // 5. DESTINACOES — resilient: detect by headers
    const destinacoes: PddeDestinacao[] = [];
    $("table").each((_, table) => {
      const $t = $(table);
      const headers = $t.find("tr").first().find("th, td")
        .map((_: number, el: any) => normalizeText($(el).text())).get();

      const looksLikeRepasse =
        headers.some((h: string) => /Destina[cç][aã]o/i.test(h)) &&
        (headers.some((h: string) => /Vl\s*Devido/i.test(h)) || headers.some((h: string) => /Valor\s*Pago/i.test(h)));

      if (!looksLikeRepasse) return;

      $t.find("tr").slice(1).each((_: number, tr: any) => {
        const tds = $(tr).find("td").map((_: number, td: any) => $(td).text().trim()).get();
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
    });
    // Fallback
    if (destinacoes.length === 0) {
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
    }
    data.destinacoes = destinacoes;

    return data;
  } catch (err: any) {
    console.error(`[PDDE Scraper] Error:`, err);
    return { ok: false, error: `Erro no processamento: ${err.message}`, ano, co_escola: coEscola };
  }
}

// Returns "MM-YYYY" for the month to try (current month, or offset months back)
function mesParam(offsetMonths = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() - offsetMonths);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${yyyy}`;
}

export async function getPddeUexSaldo(
  cnpj: string,
  opts: { mes?: string; sg_uf?: string; co_municipio_fnde?: string; co_programa_fnde?: string; page?: number } = {}
): Promise<PddeUexSaldoResult> {
  const cnpjClean = cnpj.replace(/\D/g, "");
  const { sg_uf = "", co_municipio_fnde = "", co_programa_fnde = "", page = 1 } = opts;

  // Determine which month(s) to try: if caller specifies mes use it; otherwise try current month,
  // then fall back up to 3 months back until data is found.
  const candidateMeses = opts.mes
    ? [opts.mes]
    : [mesParam(0), mesParam(1), mesParam(2), mesParam(3)];

  for (const mes of candidateMeses) {
    const url = `${SALDO_UEX_URL}?mes=${encodeURIComponent(mes)}&cnpj=${cnpjClean}&co_programa_fnde=${encodeURIComponent(co_programa_fnde)}&sg_uf=${encodeURIComponent(sg_uf)}&co_municipio_fnde=${encodeURIComponent(co_municipio_fnde)}&consultar=Consultar${page > 1 ? `&page=${page}` : ""}`;

    console.log(`[PDDE UEX Saldo] Fetching: ${url}`);

    try {
      const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
      if (!response.ok) continue;

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 500) continue;
      const html = iconv.decode(buffer, "latin1");

      const $ = cheerio.load(html);
      const saldos = parseSaldoPage($);

      if (saldos.length === 0) continue;

      // Pagination
      const paginacaoTexto = normalizeText($(".listagemPaginacao").text());
      const matchPag = paginacaoTexto.match(/Exibindo\s+(\d+)\s*-\s*(\d+)\s*de\s*(\d+)\s*Registro/i);
      const total_registros = matchPag ? Number(matchPag[3]) : saldos.length;

      const total_saldo_fundos = saldos.reduce((sum, s) => sum + (s.saldo_fundos || 0), 0);
      const total_saldo_geral = saldos.reduce((sum, s) => sum + (s.saldo_total || 0), 0);

      return { ok: true, mes, cnpj: cnpjClean, saldos, total_saldo_fundos, total_saldo_geral };
    } catch (err: any) {
      console.warn(`[PDDE UEX Saldo] ${mes} error:`, err.message);
    }
  }

  return {
    ok: false, mes: candidateMeses[0], cnpj: cnpjClean,
    saldos: [], total_saldo_fundos: 0, total_saldo_geral: 0,
    error: "Nenhum saldo encontrado para os meses consultados.",
  };
}

// ── Situação Cadastral das Entidades ─────────────────────────────────────────

export interface SituacaoCadastralItem {
  ano: string | null;
  regiao: string | null;
  uf: string | null;
  municipio: string | null;
  cnpj_eex: string | null;
  codigo_escola: string | null;
  escola: string | null;
  localizacao: string | null;
  cnpj_uex: string | null;
  razao_social: string | null;
  ddd: string | null;
  telefone: string | null;
  rede_atendimento: string | null;
  mandato_dirigente: string | null;
  data_fim_mandato: string | null;
  data_atualizacao: string | null;
  hora_atualizacao: string | null;
}

export interface SituacaoCadastralResult {
  ok: boolean;
  total_registros: number | null;
  pagina_atual: number;
  itens: SituacaoCadastralItem[];
  error?: string;
}

export interface SituacaoCadastralParams {
  ano: string;
  sg_uf?: string;
  co_municipio_fnde?: string;
  cnpj?: string;
  co_escola?: string;
  tp_relatorio?: string;
  st_cadstral?: string;
  ds_localizacao?: string;
  fimMandato?: string;
  page?: string | number;
}

function parseSituacaoCadastral(html: string): { total_registros: number | null; itens: SituacaoCadastralItem[] } {
  const $ = cheerio.load(html);
  const rows: SituacaoCadastralItem[] = [];

  $("tbody tr").each((_, tr) => {
    const cols = $(tr).find("td")
      .map((__, td) => normalizeText($(td).text()))
      .get();

    if (cols.length >= 17) {
      rows.push({
        ano: cols[0] || null,
        regiao: cols[1] || null,
        uf: cols[2] || null,
        municipio: cols[3] || null,
        cnpj_eex: cols[4] || null,
        codigo_escola: cols[5] || null,
        escola: cols[6] || null,
        localizacao: cols[7] || null,
        cnpj_uex: cols[8] || null,
        razao_social: cols[9] || null,
        ddd: cols[10] || null,
        telefone: cols[11] || null,
        rede_atendimento: cols[12] || null,
        mandato_dirigente: cols[13] || null,
        data_fim_mandato: cols[14] || null,
        data_atualizacao: cols[15] || null,
        hora_atualizacao: cols[16] || null,
      });
    }
  });

  const paginacaoTexto = normalizeText($(".listagemPaginacao").text());
  const match = paginacaoTexto.match(/Exibindo\s+(\d+)\s*-\s*(\d+)\s*de\s*(\d+)\s*Registro/i);

  return {
    total_registros: match ? Number(match[3]) : null,
    itens: rows,
  };
}

export async function getSituacaoCadastral(params: SituacaoCadastralParams): Promise<SituacaoCadastralResult> {
  const {
    ano,
    sg_uf = "",
    co_municipio_fnde = "",
    cnpj = "",
    co_escola = "",
    tp_relatorio = "1",
    st_cadstral = "",
    ds_localizacao = "",
    fimMandato = "",
    page = "1",
  } = params;

  const pagina = Number(page) || 1;

  const qs = new URLSearchParams();
  qs.set("ano", ano);
  if (cnpj) qs.set("cnpj", cnpj.replace(/\D/g, ""));
  if (co_escola) qs.set("co_escola", co_escola);
  if (sg_uf) qs.set("sg_uf", sg_uf);
  if (co_municipio_fnde) qs.set("co_municipio_fnde", co_municipio_fnde);
  qs.set("tp_relatorio", tp_relatorio);
  if (st_cadstral) qs.set("st_cadstral", st_cadstral);
  if (ds_localizacao) qs.set("ds_localizacao", ds_localizacao);
  if (fimMandato) qs.set("fimMandato", fimMandato);
  if (pagina > 1) qs.set("page", String(pagina));
  qs.set("consultar", "Consultar");
  const url = `${SITUACAO_CADASTRAL_URL}?${qs.toString()}`;

  console.log(`[PDDE Situação Cadastral] Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return { ok: false, total_registros: null, pagina_atual: pagina, itens: [], error: `HTTP ${response.status}` };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const html = iconv.decode(buffer, "latin1");
    const parsed = parseSituacaoCadastral(html);

    return { ok: true, pagina_atual: pagina, ...parsed };
  } catch (err: any) {
    console.error(`[PDDE Situação Cadastral] Error:`, err);
    return { ok: false, total_registros: null, pagina_atual: pagina, itens: [], error: `Erro: ${err.message}` };
  }
}

// ── Situação Prestação de Contas ─────────────────────────────────────────────

export interface SituacaoPrestacaoContaItem {
  ano: string | null;
  programa: string | null;
  regiao: string | null;
  uf: string | null;
  municipio: string | null;
  razao_social_eex: string | null;
  cnpj_eex: string | null;
  situacao_pc_eex: string | null;
  suspensao_eex: string | null;
  escola: string | null;
  codigo_escola: string | null;
  cnpj_uex: string | null;
  situacao_pc_uex: string | null;
  suspensao_uex: string | null;
  valor_previsto: string | null;
}

export interface SituacaoPrestacaoContaResult {
  ok: boolean;
  total_registros: number | null;
  pagina_atual: number;
  itens: SituacaoPrestacaoContaItem[];
  disponivel: boolean;
  error?: string;
}

export interface SituacaoPrestacaoContaParams {
  ano: string;
  sg_uf?: string;
  co_municipio_fnde?: string;
  co_programa_fnde?: string;
  cnpj?: string;
  co_escola?: string;
  tp_relatorio?: string;
  page?: string | number;
}

function parseSituacaoPrestacaoConta(html: string): { total_registros: number | null; itens: SituacaoPrestacaoContaItem[] } {
  const $ = cheerio.load(html);
  const rows: SituacaoPrestacaoContaItem[] = [];

  // Columns (0-indexed):
  // 0:Ano 1:Programa 2:Região 3:UF 4:Município 5:Razão Social EEx 6:CNPJ EEx
  // 7:Situação PC EEx 8:Suspensão EEx 9:Nome Escola 10:Código Escola
  // 11:CNPJ Executora 12:Situação PC UEx 13:Suspensão UEx 14:Valor Total Previsto
  $("tbody tr").each((_, tr) => {
    const cols = $(tr).find("td")
      .map((__, td) => normalizeText($(td).text()))
      .get();

    if (cols.length >= 12) {
      rows.push({
        ano: cols[0] || null,
        programa: cols[1] || null,
        regiao: cols[2] || null,
        uf: cols[3] || null,
        municipio: cols[4] || null,
        razao_social_eex: cols[5] || null,
        cnpj_eex: cols[6] || null,
        situacao_pc_eex: cols[7] || null,
        suspensao_eex: cols[8] || null,
        escola: cols[9] || null,
        codigo_escola: cols[10] || null,
        cnpj_uex: cols[11] || null,
        situacao_pc_uex: cols[12] || null,
        suspensao_uex: cols[13] || null,
        valor_previsto: cols[14] || null,
      });
    }
  });

  const paginacaoTexto = normalizeText($(".listagemPaginacao").text());
  const match = paginacaoTexto.match(/Exibindo\s+(\d+)\s*-\s*(\d+)\s*de\s*(\d+)\s*Registro/i);
  return { total_registros: match ? Number(match[3]) : null, itens: rows };
}

export async function getSituacaoPrestacaoConta(params: SituacaoPrestacaoContaParams): Promise<SituacaoPrestacaoContaResult> {
  const { ano, sg_uf = "", co_municipio_fnde = "", co_programa_fnde = "", cnpj = "", co_escola = "", tp_relatorio = "1", page = "1" } = params;
  const pagina = Number(page) || 1;

  const qs = new URLSearchParams();
  qs.set("ano", ano);
  if (cnpj) qs.set("cnpj", cnpj.replace(/\D/g, ""));
  if (co_escola) qs.set("co_escola", co_escola);
  if (sg_uf) qs.set("sg_uf", sg_uf);
  if (co_municipio_fnde) qs.set("co_municipio_fnde", co_municipio_fnde);
  if (co_programa_fnde) qs.set("co_programa_fnde", co_programa_fnde);
  qs.set("tpRelatorio", tp_relatorio);
  if (pagina > 1) qs.set("page", String(pagina));
  qs.set("consultar", "Consultar");
  const url = `${BASE}/situacaoprestacaoconta/situacaoprestacaoconta/situacaoprestacaoconta?${qs.toString()}`;

  console.log(`[PDDE Prestação de Contas] Fetching: ${url}`);

  try {
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(25000) });
    if (!response.ok) {
      return { ok: false, disponivel: false, total_registros: null, pagina_atual: pagina, itens: [], error: `HTTP ${response.status}` };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      return { ok: false, disponivel: false, total_registros: null, pagina_atual: pagina, itens: [], error: "O portal de prestação de contas do FNDE não está disponível via acesso direto (exige sessão autenticada ou POST). Use a consulta por escola (/api/pdde/:inep) para obter a situação resumida da PC, ou o SIGPC via /api/sigpc para dados detalhados." };
    }
    const html = iconv.decode(buffer, "latin1");
    const parsed = parseSituacaoPrestacaoConta(html);
    return { ok: true, disponivel: true, pagina_atual: pagina, ...parsed };
  } catch (err: any) {
    console.error(`[PDDE Prestação de Contas] Error:`, err);
    return { ok: false, disponivel: false, total_registros: null, pagina_atual: pagina, itens: [], error: `Erro: ${err.message}` };
  }
}

// ── Situação de Atendimento da Entidade ──────────────────────────────────────

export interface SituacaoAtendimentoItem {
  ano: string | null;
  regiao: string | null;
  uf: string | null;
  municipio: string | null;
  codigo_municipio_ibge: string | null;
  cnpj_eex: string | null;
  escola: string | null;
  codigo_escola: string | null;
  rede_atendimento: string | null;
  qtd_alunos: string | null;
  cnpj_uex: string | null;
  razao_social_uex: string | null;
  programa: string | null;
  destinacao: string | null;
  valor_custeio: number | null;
  valor_capital: number | null;
  valor_total: number | null;
  data_ordem_pgto: string | null;
}

export interface SituacaoAtendimentoResult {
  ok: boolean;
  total_registros: number | null;
  pagina_atual: number;
  itens: SituacaoAtendimentoItem[];
  disponivel: boolean;
  error?: string;
}

export interface SituacaoAtendimentoParams {
  ano: string;
  sg_uf?: string;
  co_municipio_fnde?: string;
  cnpj?: string;
  co_escola?: string;
  tp_relatorio?: string;
  page?: string | number;
}

function parseSituacaoAtendimento(html: string): { total_registros: number | null; itens: SituacaoAtendimentoItem[] } {
  const $ = cheerio.load(html);
  const rows: SituacaoAtendimentoItem[] = [];

  // Columns (0-indexed):
  // 0:Ano 1:Região 2:UF 3:Município 4:Cód.Município IBGE 5:CNPJ EEx(SEDUC)
  // 6:Nome Escola 7:Código Escola 8:Rede Atendimento 9:Qtd.Alunos
  // 10:CNPJ Executora 11:Nome Executora 12:Programa 13:Destinação
  // 14:Valor Custeio 15:Valor Capital 16:Valor Total 17:Data Ordem Pagamento
  $("tbody tr").each((_, tr) => {
    const cols = $(tr).find("td")
      .map((__, td) => normalizeText($(td).text()))
      .get();

    if (cols.length >= 12) {
      rows.push({
        ano: cols[0] || null,
        regiao: cols[1] || null,
        uf: cols[2] || null,
        municipio: cols[3] || null,
        codigo_municipio_ibge: cols[4] || null,
        cnpj_eex: cols[5] || null,
        escola: cols[6] || null,
        codigo_escola: cols[7] || null,
        rede_atendimento: cols[8] || null,
        qtd_alunos: cols[9] || null,
        cnpj_uex: cols[10] || null,
        razao_social_uex: cols[11] || null,
        programa: cols[12] || null,
        destinacao: cols[13] || null,
        valor_custeio: brToFloat(cols[14]),
        valor_capital: brToFloat(cols[15]),
        valor_total: brToFloat(cols[16]),
        data_ordem_pgto: cols[17] || null,
      });
    }
  });

  const paginacaoTexto = normalizeText($(".listagemPaginacao").text());
  const match = paginacaoTexto.match(/Exibindo\s+(\d+)\s*-\s*(\d+)\s*de\s*(\d+)\s*Registro/i);
  return { total_registros: match ? Number(match[3]) : null, itens: rows };
}

export async function getSituacaoAtendimento(params: SituacaoAtendimentoParams): Promise<SituacaoAtendimentoResult> {
  const { ano, sg_uf = "", co_municipio_fnde = "", cnpj = "", co_escola = "", tp_relatorio = "1", page = "1" } = params;
  const pagina = Number(page) || 1;

  const qs = new URLSearchParams();
  qs.set("ano", ano);
  if (cnpj) qs.set("cnpj", cnpj.replace(/\D/g, ""));
  if (co_escola) qs.set("co_escola", co_escola);
  if (sg_uf) qs.set("sg_uf", sg_uf);
  if (co_municipio_fnde) qs.set("co_municipio_fnde", co_municipio_fnde);
  qs.set("tpRelatorio", tp_relatorio);
  if (pagina > 1) qs.set("page", String(pagina));
  qs.set("consultar", "Consultar");
  const url = `${BASE}/situacaoatendimentoentidade/situacaoatendimentoentidade/situacaoatendimentoentidade?${qs.toString()}`;

  console.log(`[PDDE Atendimento] Fetching: ${url}`);

  try {
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(25000) });
    if (!response.ok) {
      return { ok: false, disponivel: false, total_registros: null, pagina_atual: pagina, itens: [], error: `HTTP ${response.status}` };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      return { ok: false, disponivel: false, total_registros: null, pagina_atual: pagina, itens: [], error: "O portal de atendimento do FNDE não está disponível via acesso direto (exige sessão autenticada ou POST)." };
    }
    const html = iconv.decode(buffer, "latin1");
    const parsed = parseSituacaoAtendimento(html);
    return { ok: true, disponivel: true, pagina_atual: pagina, ...parsed };
  } catch (err: any) {
    console.error(`[PDDE Atendimento] Error:`, err);
    return { ok: false, disponivel: false, total_registros: null, pagina_atual: pagina, itens: [], error: `Erro: ${err.message}` };
  }
}

// ── Relatório de Suspensão ───────────────────────────────────────────────────

export interface SuspensaoItem {
  ano: string | null;
  regiao: string | null;
  uf: string | null;
  municipio: string | null;
  cnpj_eex: string | null;
  codigo_escola: string | null;
  escola: string | null;
  cnpj_uex: string | null;
  razao_social_uex: string | null;
  programa: string | null;
  tipo_suspensao: string | null;
  motivo: string | null;
  situacao: string | null;
}

export interface SuspensaoResult {
  ok: boolean;
  total_registros: number | null;
  pagina_atual: number;
  itens: SuspensaoItem[];
  disponivel: boolean;
  error?: string;
}

export interface SuspensaoParams {
  ano: string;
  sg_uf?: string;
  co_municipio_fnde?: string;
  cnpj?: string;
  co_escola?: string;
  tp_relatorio?: string;
  page?: string | number;
}

function parseSuspensao(html: string): { total_registros: number | null; itens: SuspensaoItem[] } {
  const $ = cheerio.load(html);
  const rows: SuspensaoItem[] = [];

  $("tbody tr").each((_, tr) => {
    const cols = $(tr).find("td")
      .map((__, td) => normalizeText($(td).text()))
      .get();

    if (cols.length >= 10) {
      rows.push({
        ano: cols[0] || null,
        regiao: cols[1] || null,
        uf: cols[2] || null,
        municipio: cols[3] || null,
        cnpj_eex: cols[4] || null,
        codigo_escola: cols[5] || null,
        escola: cols[6] || null,
        cnpj_uex: cols[7] || null,
        razao_social_uex: cols[8] || null,
        programa: cols[9] || null,
        tipo_suspensao: cols[10] || null,
        motivo: cols[11] || null,
        situacao: cols[12] || null,
      });
    }
  });

  const paginacaoTexto = normalizeText($(".listagemPaginacao").text());
  const match = paginacaoTexto.match(/Exibindo\s+(\d+)\s*-\s*(\d+)\s*de\s*(\d+)\s*Registro/i);
  return { total_registros: match ? Number(match[3]) : null, itens: rows };
}

export async function getRelatorioSuspensao(params: SuspensaoParams): Promise<SuspensaoResult> {
  const { ano, sg_uf = "", co_municipio_fnde = "", cnpj = "", co_escola = "", tp_relatorio = "1", page = "1" } = params;
  const pagina = Number(page) || 1;

  const qs = new URLSearchParams();
  qs.set("ano", ano);
  if (cnpj) qs.set("cnpj", cnpj.replace(/\D/g, ""));
  if (co_escola) qs.set("co_escola", co_escola);
  if (sg_uf) qs.set("sg_uf", sg_uf);
  if (co_municipio_fnde) qs.set("co_municipio_fnde", co_municipio_fnde);
  if (pagina > 1) qs.set("page", String(pagina));
  qs.set("consultar", "Consultar");
  const url = `${BASE}/relatoriosuspensao/relatoriosuspensao/relatoriosuspensao?${qs.toString()}`;

  console.log(`[PDDE Suspensão] Fetching: ${url}`);

  try {
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(25000) });
    if (!response.ok) {
      return { ok: false, disponivel: false, total_registros: null, pagina_atual: pagina, itens: [], error: `HTTP ${response.status}` };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      return { ok: false, disponivel: false, total_registros: null, pagina_atual: pagina, itens: [], error: "Resposta vazia do FNDE." };
    }
    const html = iconv.decode(buffer, "latin1");
    const parsed = parseSuspensao(html);
    if (parsed.itens.length === 0) {
      return { ok: false, disponivel: false, total_registros: null, pagina_atual: pagina, itens: [], error: "Dados de suspensão não disponíveis via scraping (página renderizada via JavaScript). Para verificar suspensões, utilize o SIGPC via /api/sigpc." };
    }
    return { ok: true, disponivel: true, pagina_atual: pagina, ...parsed };
  } catch (err: any) {
    console.error(`[PDDE Suspensão] Error:`, err);
    return { ok: false, disponivel: false, total_registros: null, pagina_atual: pagina, itens: [], error: `Erro: ${err.message}` };
  }
}

export interface SuspensaoEscolaItem {
  uf: string | null;
  municipio: string | null;
  rede: string | null;
  programa: string | null;
  acao: string | null;
  cnpj_uex: string | null;
  razao_social_uex: string | null;
  motivo: string | null;
}

export interface SuspensaoEscolaResult {
  ok: boolean;
  disponivel: boolean;
  co_escola: string;
  ano: number;
  itens: SuspensaoEscolaItem[];
  error?: string;
}

export async function getRelatorioSuspensaoPorEscola(
  co_escola: string,
  sg_uf: string,
  ano: number
): Promise<SuspensaoEscolaResult> {
  const qs = new URLSearchParams();
  qs.set("co_escola", co_escola);
  qs.append("siglaUf[]", sg_uf.toUpperCase());
  qs.set("ano", String(ano));
  const url = `${BASE}/relatoriosuspensao/relatoriosuspensao/excel?${qs.toString()}`;
  console.log(`[PDDE Suspensão-Escola] Fetching: ${url}`);
  try {
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
    if (!response.ok) {
      return { ok: false, disponivel: false, co_escola, ano, itens: [], error: `HTTP ${response.status}` };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const html = iconv.decode(buffer, "latin1");
    const $ = cheerio.load(html);
    const itens: SuspensaoEscolaItem[] = [];
    $("tr").each((_, tr) => {
      const cols = $(tr).find("td")
        .map((__, td) => normalizeText($(td).text()))
        .get();
      if (cols.length >= 10 && cols[5] && cols[5].trim() === co_escola) {
        const rawCnpj = cols[7] || "";
        const cnpj = rawCnpj.replace(/^=?"?|"?$/g, "").replace(/\D/g, "");
        const cnpjFmt = cnpj.length === 14
          ? `${cnpj.slice(0,2)}.${cnpj.slice(2,5)}.${cnpj.slice(5,8)}/${cnpj.slice(8,12)}-${cnpj.slice(12)}`
          : (cnpj || null);
        itens.push({
          uf: cols[0] || null,
          municipio: cols[1] || null,
          rede: cols[2] || null,
          programa: cols[3] || null,
          acao: cols[4] || null,
          cnpj_uex: cnpjFmt,
          razao_social_uex: cols[8] || null,
          motivo: cols[9] || null,
        });
      }
    });
    return { ok: true, disponivel: true, co_escola, ano, itens };
  } catch (err: any) {
    console.error(`[PDDE Suspensão-Escola] Error:`, err.message);
    return { ok: false, disponivel: false, co_escola, ano, itens: [], error: err.message };
  }
}

export async function getMunicipiosPorUf(sg_uf: string): Promise<{ ok: boolean; municipios: { codigo: string; nome: string }[]; error?: string }> {
  const url = `${BASE}/pddeinfo/corp/get-municipio/sg_uf/${encodeURIComponent(sg_uf.toUpperCase())}`;
  console.log(`[PDDE Municípios] Fetching: ${url}`);
  try {
    const response = await fetch(url, {
      headers: { ...HEADERS, "Accept": "application/json, text/javascript, */*" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      return { ok: false, municipios: [], error: `HTTP ${response.status}` };
    }
    const json = await response.json();
    const municipios = Array.isArray(json)
      ? json.map((m: any) => ({
          codigo: String(m.CO_MUNICIPIO_FNDE || m.co_municipio_fnde || m.codigo || m.id || ""),
          nome: String(m.NO_MUNICIPIO || m.no_municipio || m.nome || m.name || ""),
        })).filter(m => m.codigo && m.nome)
      : [];
    return { ok: true, municipios };
  } catch (err: any) {
    console.error(`[PDDE Municípios] Error:`, err);
    return { ok: false, municipios: [], error: `Erro: ${err.message}` };
  }
}
