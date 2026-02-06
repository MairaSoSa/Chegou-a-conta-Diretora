import { useQuery } from "@tanstack/react-query";

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

function normalizeCnpj(cnpj: string): string {
  return (cnpj || "").replace(/\D/g, "");
}

export function useSigpcLocalizar(cnpj: string | null | undefined, anoConcessao?: string, programaId?: string) {
  const cnpjDigits = cnpj ? normalizeCnpj(cnpj) : "";
  const ano = anoConcessao || String(new Date().getFullYear() - 1);
  const prog = programaId || "40";

  return useQuery<SigpcLocalizarResult>({
    queryKey: ["/api/sigpc/localizar", cnpjDigits, ano, prog],
    queryFn: async () => {
      if (!cnpjDigits || cnpjDigits.length < 11) {
        return { ok: false, error: "CNPJ inválido", cnpj: cnpjDigits, anoConcessao: ano, programaId: prog, processos: [] };
      }
      const params = new URLSearchParams({ cnpj: cnpjDigits, anoConcessao: ano, programaId: prog });
      const res = await fetch(`/api/sigpc/localizar?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao consultar SIGPC");
      return res.json();
    },
    enabled: !!cnpjDigits && cnpjDigits.length >= 11,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useSigpcDetalhe(pcId: string | number | null | undefined) {
  const id = pcId ? String(pcId) : "";

  return useQuery<SigpcDetalheResult>({
    queryKey: ["/api/sigpc/pc", id],
    queryFn: async () => {
      if (!id) return { ok: false, error: "Sem pcId", pcId: "" };
      const res = await fetch(`/api/sigpc/pc/${id}`);
      if (!res.ok) throw new Error("Erro ao detalhar processo");
      return res.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useSigpcHistorico(concessaoId: string | number | null | undefined) {
  const id = concessaoId ? String(concessaoId) : "";

  return useQuery<SigpcHistoricoResult>({
    queryKey: ["/api/sigpc/historico", id],
    queryFn: async () => {
      if (!id) return { ok: false, error: "Sem concessaoId", concessaoId: "" };
      const res = await fetch(`/api/sigpc/historico/${id}`);
      if (!res.ok) throw new Error("Erro ao consultar histórico");
      return res.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
