import iconv from "iconv-lite";

const SIGPC_BASE = "https://www.fnde.gov.br/sigpcadm";
const SIGPC_API = `${SIGPC_BASE}/publico/json/util`;

const HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/html, */*",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "Referer": "https://www.fnde.gov.br/sigpcadm/actionPublico.pu?tilesPublico=ConsultarSituacao",
  "Accept-Encoding": "identity",
  "Connection": "keep-alive"
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

async function tryRealSigpcApi(cnpj: string): Promise<any[] | null> {
  try {
    const cleanCnpj = cnpj.replace(/[^\d]/g, "");
    const url = `${SIGPC_API}/localizarPc?cnpj=${cleanCnpj}`;
    console.log(`[SIGPC] Trying real API: ${url}`);

    const response = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.log(`[SIGPC] Real API returned HTTP ${response.status}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    const buffer = Buffer.from(await response.arrayBuffer());
    const text = contentType.includes("charset=iso") || contentType.includes("latin")
      ? iconv.decode(buffer, "latin1")
      : buffer.toString("utf8");

    if (text.includes("Request Rejected") || text.includes("<html>")) {
      console.log("[SIGPC] Real API blocked by WAF");
      return null;
    }

    const data = JSON.parse(text);
    console.log("[SIGPC] Real API returned data:", JSON.stringify(data).substring(0, 200));
    return Array.isArray(data) ? data : data.prestacoes || data.dados || null;
  } catch (err: any) {
    console.log(`[SIGPC] Real API unavailable: ${err.message}`);
    return null;
  }
}

export interface SigpcLocalizarResult {
  ok: boolean;
  prestacoes: SigpcPrestacaoListItem[];
  fonte: "sigpc-real" | "indisponivel";
  error?: string;
}

export async function localizarPrestacoesPorCnpj(
  cnpj: string,
  anoConcessao?: number
): Promise<SigpcLocalizarResult> {
  const realData = await tryRealSigpcApi(cnpj);
  if (realData && realData.length > 0) {
    console.log(`[SIGPC] Using real data: ${realData.length} records`);
    return {
      ok: true,
      fonte: "sigpc-real",
      prestacoes: realData.map((item: any) => ({
        pcId: item.pcId || item.id || 0,
        processoNumero: item.processoNumero || item.processo || "",
        programaNome: item.programaNome || item.programa || "",
        entidadeNome: item.entidadeNome || item.entidade || "",
        cnpj: item.cnpj || cnpj,
        situacaoNome: item.situacaoNome || item.situacao || "",
        faseNome: item.faseNome || item.fase || "",
        anoConcessao: item.anoConcessao || item.ano || 0,
        convenioNumero: item.convenioNumero || item.convenio,
        valorConcessao: item.valorConcessao || item.valor || 0,
        fonte: "sigpc-real"
      }))
    };
  }

  if (realData === null) {
    console.log("[SIGPC] API blocked by WAF, returning unavailable status");
    return {
      ok: false,
      fonte: "indisponivel",
      prestacoes: [],
      error: "O sistema SIGPC do FNDE está temporariamente indisponível. Tente novamente mais tarde."
    };
  }

  return {
    ok: true,
    fonte: "sigpc-real",
    prestacoes: [],
  };
}

export async function detalharPrestacao(pcId: number): Promise<SigpcPrestacaoDetalhada | null> {
  try {
    const url = `${SIGPC_API}/detalharOPC?pcId=${pcId}`;
    console.log(`[SIGPC] Trying detail API: ${url}`);

    const response = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      const buffer = Buffer.from(await response.arrayBuffer());
      const text = contentType.includes("charset=iso") || contentType.includes("latin")
        ? iconv.decode(buffer, "latin1")
        : buffer.toString("utf8");

      if (!text.includes("Request Rejected") && !text.includes("<html>")) {
        const data = JSON.parse(text);
        console.log("[SIGPC] Detail API returned data");
        return { ...data, fonte: "sigpc-real" };
      }
    }
  } catch (err: any) {
    console.log(`[SIGPC] Detail API unavailable: ${err.message}`);
  }

  console.log("[SIGPC] Detail API blocked, returning null");
  return null;
}

export async function recuperarHistoricoAnalise(concessaoId: number): Promise<SigpcHistoricoAnalise[]> {
  try {
    const url = `${SIGPC_API}/conferirdocumentos/ConferirDocumentos?concessaoId=${concessaoId}&comando=recuperarHistoricoAnalise`;
    console.log(`[SIGPC] Trying history API: ${url}`);

    const response = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const buffer = Buffer.from(await response.arrayBuffer());
      const text = buffer.toString("utf8");

      if (!text.includes("Request Rejected") && !text.includes("<html>")) {
        const data = JSON.parse(text);
        return Array.isArray(data) ? data : [];
      }
    }
  } catch (err: any) {
    console.log(`[SIGPC] History API unavailable: ${err.message}`);
  }

  console.log("[SIGPC] History API blocked, returning empty");
  return [];
}
