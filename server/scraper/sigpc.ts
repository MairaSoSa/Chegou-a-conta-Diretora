const OLINDA_BASE = "https://www.fnde.gov.br/olinda-ide/servico/DADOS_ABERTOS_PDDE_SIGPC/versao/v1/odata";
const SIGPCADM_BASE = "https://www.fnde.gov.br/sigpcadm";
export const SIGPCADM_PUBLIC_URL = `${SIGPCADM_BASE}/sistema.pu?operation=localizar`;
export const SIGPCADM_LOCALIZAR_PC = `${SIGPCADM_BASE}/publico/json/util/localizarPc`;

const HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

const apiCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = apiCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
  if (entry) apiCache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  apiCache.set(key, { data, ts: Date.now() });
}

export interface SigpcPrestacaoListItem {
  pcId: number;
  processoNumero: string;
  programaNome: string;
  entidadeNome: string;
  cnpj: string;
  situacaoNome: string;
  faseNome: string;
  anoConcessao: number;
  convenioNumero?: string;
  valorConcessao: number;
  fonte?: string;
  uf?: string;
  regiao?: string;
  esfera?: string;
  localizacao?: string;
  dirigente?: string;
  efeitoSuspensivo?: string;
  medidaExcecao?: string;
  cnpjEex?: string;
  razaoSocialEex?: string;
  fasePcEex?: string;
  situacaoPcEex?: string;
  situacaoOpcEex?: string;
  valorPagoEex?: string;
  efeitoSuspensivoEex?: string;
  medidaExcecaoEex?: string;
  faseMedidaExcecaoEex?: string;
}

export interface SigpcPrestacaoDetalhada {
  pcId: number;
  processoNumero: string;
  programaNome: string;
  programaCodigo: string;
  entidadeNome: string;
  cnpj: string;
  endereco: string;
  municipio: string;
  uf: string;
  situacaoNome: string;
  faseNome: string;
  anoConcessao: number;
  convenioNumero?: string;
  valorConcessao: number;
  valorLiberado: number;
  valorExecutado: number;
  saldoConta: number;
  dataInicio: string;
  dataFim: string;
  dataAprovacao?: string;
  concessaoId: number;
  parcelas: SigpcParcela[];
  dirigentes: SigpcDirigente[];
  documentos: SigpcDocumento[];
  fonte?: string;
}

export interface SigpcParcela {
  parcelaId: number;
  numero: number;
  valor: number;
  dataLiberacao: string;
  situacao: string;
}

export interface SigpcDirigente {
  dirigenteId: number;
  nome: string;
  cpf: string;
  cargo: string;
  dataInicio: string;
  dataFim?: string;
  situacao: string;
}

export interface SigpcDocumento {
  documentoId: number;
  tipo: string;
  numero: string;
  dataEmissao: string;
  situacao: string;
  observacao?: string;
}

export interface SigpcHistoricoAnalise {
  historicoId: number;
  dataAnalise: string;
  analista: string;
  tipoAnalise: string;
  resultado: string;
  parecer: string;
  documentosAnalisados: string[];
}

function parseOlindaResponse(text: string): any | null {
  let cleaned = text.trim();
  if (cleaned.startsWith("/*")) {
    cleaned = cleaned.replace(/^\/\*/, "").replace(/\*\/$/, "").trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function parseValorPago(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  const cleaned = val.replace(/[^\d.,-]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function mapOlindaToListItem(item: any, idx: number): SigpcPrestacaoListItem {
  return {
    pcId: idx + 1,
    processoNumero: item.NU_SEQ_CONCESSAO || "",
    programaNome: item.DS_PROGRAMA_FNDE || "",
    entidadeNome: item.RAZAO_SOCIAL_UEX || "",
    cnpj: item.CNPJ_UEX || "",
    situacaoNome: item.DSSITUACAOOPC || "",
    faseNome: item.FASE_PC_EEX || "",
    anoConcessao: item.ANO || 0,
    valorConcessao: parseValorPago(item.VL_PAGO_UEX),
    fonte: "olinda-sigpc",
    uf: item.UF || "",
    regiao: item.REGIAO || "",
    esfera: item.ESFERA || "",
    localizacao: item.LOCALIZACAO || "",
    dirigente: item.DIRIGENTE_UEX || "",
    efeitoSuspensivo: item.EFEITO_SUSPENSIVO_UEX || "",
    medidaExcecao: item.SIT_NOME_MEDIDA_EXCECAO_UEX || "",
    cnpjEex: item.NU_CNPJ_EEX || "",
    razaoSocialEex: item.NO_RAZAO_SOCIAL_EEX || "",
    fasePcEex: item.FASE_PC_EEX || "",
    situacaoPcEex: item.SITUACAO_PC_EEX || "",
    situacaoOpcEex: item.SITUACAO_OPC_EEX || "",
    valorPagoEex: item.VL_PAGO_EEX || "",
    efeitoSuspensivoEex: item.EFEITO_SUSPENSIVO_EEX || "",
    medidaExcecaoEex: item.SIT_NOME_MEDIDA_EXCECAO_EEX || "",
    faseMedidaExcecaoEex: item.FASE_NOME_MEDIDA_EXCECAO_EEX || "",
  };
}

async function fetchOlindaSigpc(ano: number, filter?: string, top = 100, skip = 0): Promise<any[] | null> {
  try {
    const params = new URLSearchParams();
    params.set("$format", "json");
    params.set("@Ano_Consulta", String(ano));
    params.set("$top", String(top));
    if (skip > 0) params.set("$skip", String(skip));
    if (filter) params.set("$filter", filter);

    const url = `${OLINDA_BASE}/Prestacao_Conta_SIGPC(Ano_Consulta=@Ano_Consulta)?${params.toString()}`;
    console.log(`[SIGPC-OLINDA] Fetching: ano=${ano}, filter=${filter || 'none'}, top=${top}`);

    const response = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.log(`[SIGPC-OLINDA] HTTP ${response.status}`);
      return null;
    }

    const text = await response.text();
    const data = parseOlindaResponse(text);

    if (!data) {
      console.log("[SIGPC-OLINDA] Failed to parse response");
      return null;
    }

    if (data.codigo && data.codigo >= 400) {
      console.log(`[SIGPC-OLINDA] API error ${data.codigo}: ${data.mensagem}`);
      return null;
    }

    const records = data.value || data.d?.results || [];
    console.log(`[SIGPC-OLINDA] Got ${records.length} records for ano=${ano}`);
    return records;
  } catch (err: any) {
    console.log(`[SIGPC-OLINDA] Error: ${err.message}`);
    return null;
  }
}

export interface SigpcLocalizarResult {
  ok: boolean;
  prestacoes: SigpcPrestacaoListItem[];
  fonte: "olinda-sigpc" | "sigpcadm" | "indisponivel";
  error?: string;
  anosConsultados?: number[];
  sigpcUrl?: string;
}

export async function localizarPrestacoesPorCnpj(
  cnpj: string,
  anoConcessao?: number
): Promise<SigpcLocalizarResult> {
  const cleanCnpj = cnpj.replace(/[^\d]/g, "");
  const formattedCnpj = cleanCnpj.length === 14
    ? `${cleanCnpj.slice(0,2)}.${cleanCnpj.slice(2,5)}.${cleanCnpj.slice(5,8)}/${cleanCnpj.slice(8,12)}-${cleanCnpj.slice(12)}`
    : cnpj;

  const filter = `CNPJ_UEX eq '${formattedCnpj}'`;

  const anosToQuery = anoConcessao
    ? [anoConcessao]
    : [2024, 2023, 2022, 2021, 2020];

  const allPrestacoes: SigpcPrestacaoListItem[] = [];
  const anosConsultados: number[] = [];
  let apiAvailable = false;

  for (const ano of anosToQuery) {
    const records = await fetchOlindaSigpc(ano, filter, 200);
    if (records !== null) {
      apiAvailable = true;
      anosConsultados.push(ano);
      allPrestacoes.push(...records.map((item: any, idx: number) =>
        mapOlindaToListItem(item, allPrestacoes.length + idx)
      ));
    }
  }

  if (!apiAvailable) {
    return {
      ok: false,
      fonte: "indisponivel",
      prestacoes: [],
      error: "O sistema SIGPC/OLINDA do FNDE está temporariamente indisponível. Tente novamente mais tarde.",
      anosConsultados: [],
    };
  }

  return {
    ok: true,
    fonte: "olinda-sigpc",
    prestacoes: allPrestacoes,
    anosConsultados,
  };
}

export async function localizarPrestacoesPorUf(
  uf: string,
  ano: number,
  programa?: string,
  top = 100,
  skip = 0
): Promise<SigpcLocalizarResult> {
  const cleanUf = uf.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
  if (cleanUf.length !== 2) {
    return { ok: false, fonte: "indisponivel", prestacoes: [], error: "UF inválida" };
  }
  let filter = `UF eq '${cleanUf}'`;
  if (programa) {
    const cleanPrograma = programa.replace(/'/g, "''");
    filter += ` and DS_PROGRAMA_FNDE eq '${cleanPrograma}'`;
  }

  const records = await fetchOlindaSigpc(ano, filter, top, skip);

  if (records === null) {
    return {
      ok: false,
      fonte: "indisponivel",
      prestacoes: [],
      error: "API OLINDA indisponível",
    };
  }

  return {
    ok: true,
    fonte: "olinda-sigpc",
    prestacoes: records.map((item: any, idx: number) =>
      mapOlindaToListItem(item, skip + idx)
    ),
  };
}

export async function detalharPrestacao(pcId: number): Promise<SigpcPrestacaoDetalhada | null> {
  console.log("[SIGPC-OLINDA] Detail endpoint not available in OLINDA API (bulk data only)");
  return null;
}

export async function recuperarHistoricoAnalise(concessaoId: number): Promise<SigpcHistoricoAnalise[]> {
  console.log("[SIGPC-OLINDA] History endpoint not available in OLINDA API");
  return [];
}

const PDDE_BASICO_BASE = "https://www.fnde.gov.br/olinda-ide/servico/DADOS_ABERTOS_PDDE_BASICO/versao/v1/odata";
const PDDE_EXEC_FIN_BASE = "https://www.fnde.gov.br/olinda-ide/servico/DADOS_ABERTOS_PDDE_BASICO_3/versao/v1/odata";

export interface PddeSaldoConta {
  an_exercicio: number;
  uf: string;
  codigo_municipio: string;
  nome_municipio: string;
  co_escola: string;
  no_escola: string;
  regiao: string;
  localizacao: string;
  esfera_administrativa: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  saldo_acumulado: number;
}

export interface PddeSaldosResult {
  ok: boolean;
  saldos: PddeSaldoConta[];
  anosDisponiveis: number[];
  fonte: "olinda-pdde-basico" | "indisponivel";
  error?: string;
}

async function fetchPddeSaldos(ano: number, coEscola: string): Promise<PddeSaldoConta[] | null> {
  try {
    const cleanCode = coEscola.replace(/'/g, "");
    const url = `${PDDE_BASICO_BASE}/Saldo_Contas_UEX_Publico(Ano_consulta=@Ano_consulta)?$format=json&@Ano_consulta=${ano}&$top=50&$filter=co_escola eq '${cleanCode}'`;
    console.log(`[PDDE-SALDOS] Fetching saldos: escola=${coEscola}, ano=${ano}`);

    const response = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      console.log(`[PDDE-SALDOS] HTTP ${response.status}`);
      return null;
    }

    const text = await response.text();
    const data = parseOlindaResponse(text);
    if (!data || data.codigo) return null;

    const records = data.value || [];
    return records
      .filter((r: any) => r.banco || parseFloat(r.saldo_acumulado || "0") > 0)
      .map((r: any) => ({
        an_exercicio: r.an_exercicio,
        uf: r.uf,
        codigo_municipio: r.codigo_municipio,
        nome_municipio: r.nome_municipio,
        co_escola: r.co_escola,
        no_escola: r.no_escola,
        regiao: r.regiao,
        localizacao: r.localizacao,
        esfera_administrativa: r.esfera_administrativa,
        banco: r.banco,
        agencia: r.agencia,
        conta: r.conta,
        saldo_acumulado: parseFloat(r.saldo_acumulado || "0"),
      }));
  } catch (err: any) {
    console.log(`[PDDE-SALDOS] Error: ${err.message}`);
    return null;
  }
}

export async function consultarSaldosPdde(coEscola: string): Promise<PddeSaldosResult> {
  const cleanCode = coEscola.replace(/[^\d]/g, "");
  const cacheKey = `saldos:${cleanCode}`;
  const cached = getCached<PddeSaldosResult>(cacheKey);
  if (cached) {
    console.log(`[PDDE-SALDOS] Cache hit: ${cleanCode}`);
    return cached;
  }
  const anosToQuery = [2026, 2025, 2024, 2023, 2022, 2021, 2020];

  const results = await Promise.all(
    anosToQuery.map(ano => fetchPddeSaldos(ano, cleanCode).then(records => ({ ano, records })))
  );

  const allSaldos: PddeSaldoConta[] = [];
  const anosDisponiveis: number[] = [];
  let apiAvailable = false;

  for (const { ano, records } of results) {
    if (records !== null) {
      apiAvailable = true;
      if (records.length > 0) {
        anosDisponiveis.push(ano);
        allSaldos.push(...records);
      }
    }
  }

  anosDisponiveis.sort((a, b) => b - a);

  if (!apiAvailable) {
    return {
      ok: false,
      saldos: [],
      anosDisponiveis: [],
      fonte: "indisponivel",
      error: "A API OLINDA do PDDE Básico está temporariamente indisponível.",
    };
  }

  const result: PddeSaldosResult = {
    ok: true,
    saldos: allSaldos,
    anosDisponiveis,
    fonte: "olinda-pdde-basico",
  };
  setCache(cacheKey, result);
  return result;
}

export interface PddeExecFinItem {
  an_exercicio: number;
  sg_uf: string;
  no_municipio: string;
  co_municipio_ibge: string;
  co_escola: string;
  no_escola: string;
  qt_alunos: number;
  no_esfera_adm: string;
  no_regiao: string;
  localizacao: string;
  cnpj_uex: string;
  no_uex: string;
  no_cargo: string;
  dt_ini_vinculacao: string;
  ds_programa_fnde: string;
  sg_destinacao: string;
  vl_pago_custeio: number;
  vl_pago_capital: number;
  vl_pago_total: number;
}

export interface PddeExecFinResult {
  ok: boolean;
  repasses: PddeExecFinItem[];
  anosDisponiveis: number[];
  fonte: "olinda-pdde-exec-fin" | "indisponivel";
  error?: string;
}

async function fetchPddeExecFin(ano: number, coEscola: string): Promise<PddeExecFinItem[] | null> {
  try {
    const url = `${PDDE_EXEC_FIN_BASE}/Execucao_Financeira_PDDE_Basico_Publico(Ano_consulta=@Ano_consulta)?$format=json&@Ano_consulta=${ano}&$top=100&$filter=CO_ESCOLA eq '${coEscola}'`;
    console.log(`[PDDE-EXECFIN] Fetching: escola=${coEscola}, ano=${ano}`);

    const response = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      console.log(`[PDDE-EXECFIN] HTTP ${response.status}`);
      return null;
    }

    const text = await response.text();
    const data = parseOlindaResponse(text);
    if (!data || data.codigo) return null;

    const records = data.value || [];
    return records.map((r: any) => ({
      an_exercicio: r.AN_EXERCICIO,
      sg_uf: r.SG_UF,
      no_municipio: r.NO_MUNICIPIO,
      co_municipio_ibge: r.CO_MUNICIPIO_IBGE,
      co_escola: r.CO_ESCOLA,
      no_escola: r.NO_ESCOLA,
      qt_alunos: parseInt(r.QT_ALUNOS) || 0,
      no_esfera_adm: r.NO_ESFERA_ADM,
      no_regiao: r.NO_REGIAO,
      localizacao: r.LOCALIZACAO,
      cnpj_uex: r.CNPJ_UEX,
      no_uex: r.NO_UEX,
      no_cargo: r.NO_CARGO,
      dt_ini_vinculacao: r.DT_INI_VINCULACAO,
      ds_programa_fnde: r.DS_PROGRAMA_FNDE,
      sg_destinacao: r.SG_DESTINACAO,
      vl_pago_custeio: parseFloat(r.VL_PAGO_CUSTEIO) || 0,
      vl_pago_capital: parseFloat(r.VL_PAGO_CAPITAL) || 0,
      vl_pago_total: parseFloat(r.VL_PAGO_TOTAL) || 0,
    }));
  } catch (err: any) {
    console.log(`[PDDE-EXECFIN] Error: ${err.message}`);
    return null;
  }
}

export async function consultarExecFinPdde(coEscola: string): Promise<PddeExecFinResult> {
  const cleanCode = coEscola.replace(/[^\d]/g, "");
  const cacheKey = `execfin:${cleanCode}`;
  const cached = getCached<PddeExecFinResult>(cacheKey);
  if (cached) {
    console.log(`[PDDE-EXECFIN] Cache hit: ${cleanCode}`);
    return cached;
  }
  const anosToQuery = [2026, 2025, 2024, 2023, 2022, 2021, 2020];

  const results = await Promise.all(
    anosToQuery.map(ano => fetchPddeExecFin(ano, cleanCode).then(records => ({ ano, records })))
  );

  const allRepasses: PddeExecFinItem[] = [];
  const anosDisponiveis: number[] = [];
  let apiAvailable = false;

  for (const { ano, records } of results) {
    if (records !== null) {
      apiAvailable = true;
      if (records.length > 0) {
        anosDisponiveis.push(ano);
        allRepasses.push(...records);
      }
    }
  }

  anosDisponiveis.sort((a, b) => b - a);

  if (!apiAvailable) {
    return {
      ok: false,
      repasses: [],
      anosDisponiveis: [],
      fonte: "indisponivel",
      error: "A API de Execução Financeira do FNDE está temporariamente indisponível.",
    };
  }

  const result: PddeExecFinResult = {
    ok: true,
    repasses: allRepasses,
    anosDisponiveis,
    fonte: "olinda-pdde-exec-fin",
  };
  setCache(cacheKey, result);
  return result;
}
