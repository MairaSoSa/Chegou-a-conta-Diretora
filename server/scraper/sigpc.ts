const BASE = "https://www.fnde.gov.br/sigpcadm";

const HEADERS: Record<string, string> = {
  accept: "application/json,text/javascript,*/*;q=0.1",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  referer: BASE + "/sistema.pu?operation=localizar",
};

function normalizeCnpj(cnpj: string): string {
  return (cnpj || "").replace(/\D/g, "");
}

async function fndeGet(path: string, params: Record<string, string | undefined> = {}): Promise<any> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      ...HEADERS,
      "x-requested-with": "XMLHttpRequest",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
    },
    signal: AbortSignal.timeout(25000),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`FNDE HTTP ${res.status} ${res.statusText}`);
  }

  if (text.includes("Request Rejected") || text.includes("<title>Request Rejected</title>")) {
    throw new Error("SIGPC_WAF_BLOCKED");
  }

  try {
    return JSON.parse(text);
  } catch {
    if (text.trim().startsWith("<")) {
      throw new Error("SIGPC_HTML_RESPONSE");
    }
    return { raw: text };
  }
}

export interface SigpcProcesso {
  pcId?: number;
  concessaoId?: number;
  entidade?: string;
  cnpj?: string;
  programa?: string;
  programaId?: number;
  anoConcessao?: string;
  statusPc?: string;
  statusAnalise?: string;
  uf?: string;
  municipio?: string;
  tipoEntidade?: string;
  valorTotal?: number;
  [key: string]: any;
}

export interface SigpcDirigente {
  nome?: string;
  cpf?: string;
  cargo?: string;
  dataInicio?: string;
  dataFim?: string;
  [key: string]: any;
}

export interface SigpcHistorico {
  data?: string;
  evento?: string;
  responsavel?: string;
  observacao?: string;
  [key: string]: any;
}

export interface SigpcLocalizarResult {
  ok: boolean;
  error?: string;
  wafBlocked?: boolean;
  cnpj: string;
  anoConcessao: string;
  programaId: string;
  totalCount?: number;
  processos: SigpcProcesso[];
  rawData?: any;
}

export interface SigpcDetalheResult {
  ok: boolean;
  error?: string;
  pcId: string;
  processo?: any;
  dirigenteAtual?: any;
  exDirigente?: any;
}

export interface SigpcHistoricoResult {
  ok: boolean;
  error?: string;
  concessaoId: string;
  historico?: any;
}

export async function localizarProcessos(
  cnpj: string,
  anoConcessao: string = String(new Date().getFullYear() - 1),
  programaId: string = "40",
  limit: string = "40",
  start: string = "0"
): Promise<SigpcLocalizarResult> {
  const cnpjDigits = normalizeCnpj(cnpj);

  if (!cnpjDigits || cnpjDigits.length < 11) {
    return { ok: false, error: "CNPJ inválido", cnpj: cnpjDigits, anoConcessao, programaId, processos: [] };
  }

  const cnpjParamAttempts = [
    { entidadeCnpj: cnpjDigits },
    { cnpj: cnpjDigits },
    { cnpjEntidade: cnpjDigits },
  ];

  let lastErr: Error | null = null;
  let wafBlocked = false;

  for (const cnpjParam of cnpjParamAttempts) {
    try {
      const data = await fndeGet("/publico/json/util/localizarPc", {
        tela: "localizar",
        tipoConsulta: "2",
        anoConcessao,
        programaId,
        limit,
        start,
        ...cnpjParam,
      });

      if (data && typeof data === "object") {
        let processos: SigpcProcesso[] = [];
        let totalCount = 0;

        if (data.totalCount !== undefined) {
          totalCount = parseInt(data.totalCount) || 0;
        }

        if (Array.isArray(data.data)) {
          processos = data.data;
        } else if (Array.isArray(data.registros)) {
          processos = data.registros;
        } else if (Array.isArray(data.rows)) {
          processos = data.rows;
        } else if (data.raw && typeof data.raw === "string") {
          continue;
        }

        return {
          ok: true,
          cnpj: cnpjDigits,
          anoConcessao,
          programaId,
          totalCount: totalCount || processos.length,
          processos,
          rawData: data,
        };
      }
    } catch (e: any) {
      lastErr = e;
      if (e.message === "SIGPC_WAF_BLOCKED") {
        wafBlocked = true;
        break;
      }
    }
  }

  const errorMsg = wafBlocked
    ? "O portal SIGPC do FNDE está temporariamente indisponível para consulta automática. Tente novamente mais tarde."
    : lastErr?.message || "Não foi possível consultar o SIGPC";

  return {
    ok: false,
    error: errorMsg,
    wafBlocked,
    cnpj: cnpjDigits,
    anoConcessao,
    programaId,
    processos: [],
  };
}

export async function detalharProcesso(pcId: string): Promise<SigpcDetalheResult> {
  try {
    let pcDetail: any = null;

    try {
      pcDetail = await fndeGet("/publico/json/util/localizarPc", { pcId });
    } catch {
      pcDetail = await fndeGet("/json/util/localizarPc", { pcId });
    }

    let dirigenteAtual: any = null;
    let exDirigente: any = null;

    try {
      dirigenteAtual = await fndeGet(
        "/json/dirigente/atualizarDirigenteListarDirigentes",
        { idPc: pcId, tipoDirigente: "A" }
      );
    } catch {}

    try {
      exDirigente = await fndeGet(
        "/json/dirigente/atualizarDirigenteListarDirigentes",
        { idPc: pcId, tipoDirigente: "E" }
      );
    } catch {}

    return {
      ok: true,
      pcId,
      processo: pcDetail,
      dirigenteAtual,
      exDirigente,
    };
  } catch (e: any) {
    return { ok: false, error: e.message, pcId };
  }
}

export async function historicoAnalise(concessaoId: string): Promise<SigpcHistoricoResult> {
  try {
    const data = await fndeGet("/json/conferirdocumentos/ConferirDocumentos", {
      concessaoId,
      comando: "recuperarHistoricoAnalise",
    });

    return { ok: true, concessaoId, historico: data };
  } catch (e: any) {
    return { ok: false, error: e.message, concessaoId };
  }
}
