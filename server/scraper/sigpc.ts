const OLINDA_BASE = "https://www.fnde.gov.br/olinda-ide/servico/DADOS_ABERTOS_PDDE_SIGPC/versao/v1/odata";

const HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

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
  fonte: "olinda-sigpc" | "indisponivel";
  error?: string;
  anosConsultados?: number[];
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
