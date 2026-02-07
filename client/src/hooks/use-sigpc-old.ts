import { useQuery } from "@tanstack/react-query";

export interface SigpcPrestacaoContas {
  concessaoId: number;
  cnpj: string;
  entidadeNome: string;
  programaNome: string;
  programaId: number;
  anoConcessao: number;
  situacao: string;
  situacaoId: number;
  numeroConvenio?: string;
  numeroTermoCompromisso?: string;
  valorConcessao?: number;
  valorPrestado?: number;
  dataLimite?: string;
  fase?: string;
  faseId?: number;
  municipio?: string;
  uf?: string;
}

export interface SigpcConsultaResult {
  ok: boolean;
  prestacoes?: SigpcPrestacaoContas[];
  error?: string;
  totalRegistros?: number;
}

export interface SigpcPrograma {
  id: number;
  nome: string;
  sigla?: string;
}

export interface SigpcProgramasResult {
  ok: boolean;
  programas?: SigpcPrograma[];
  error?: string;
}

/**
 * Hook para consultar prestações de contas por CNPJ
 */
export function useSigpcPrestacoes(
  cnpj: string | null,
  options?: {
    programaId?: number;
    anoConcessao?: number;
    municipioId?: number;
  }
) {
  return useQuery<SigpcConsultaResult>({
    queryKey: ["/api/sigpc/prestacoes", cnpj, options],
    queryFn: async () => {
      if (!cnpj) {
        return { ok: false, error: "CNPJ não fornecido" };
      }

      const params = new URLSearchParams();
      if (options?.programaId) {
        params.append("programaId", options.programaId.toString());
      }
      if (options?.anoConcessao) {
        params.append("anoConcessao", options.anoConcessao.toString());
      }
      if (options?.municipioId) {
        params.append("municipioId", options.municipioId.toString());
      }

      // Encode o CNPJ para evitar problemas com caracteres especiais (/)
      const cnpjEncoded = encodeURIComponent(cnpj);
      const url = `/api/sigpc/prestacoes/${cnpjEncoded}${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Erro ao consultar prestações");
      }
      return res.json();
    },
    enabled: !!cnpj,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
}

/**
 * Hook para consultar programas por ano
 */
export function useSigpcProgramas(ano: number) {
  return useQuery<SigpcProgramasResult>({
    queryKey: ["/api/sigpc/programas", ano],
    queryFn: async () => {
      const res = await fetch(`/api/sigpc/programas/${ano}`);
      if (!res.ok) {
        throw new Error("Erro ao consultar programas");
      }
      return res.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hora - dados estáticos
    retry: 2,
  });
}

/**
 * Hook para consultar anos disponíveis
 */
export function useSigpcAnos() {
  return useQuery<{ ok: boolean; anos?: number[]; error?: string }>({
    queryKey: ["/api/sigpc/anos"],
    queryFn: async () => {
      const res = await fetch("/api/sigpc/anos");
      if (!res.ok) {
        throw new Error("Erro ao consultar anos");
      }
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 horas
    retry: 2,
  });
}

/**
 * Hook para consultar situações de prestação de contas
 */
export function useSigpcSituacoes() {
  return useQuery<{ ok: boolean; situacoes?: any[]; error?: string }>({
    queryKey: ["/api/sigpc/situacoes"],
    queryFn: async () => {
      const res = await fetch("/api/sigpc/situacoes");
      if (!res.ok) {
        throw new Error("Erro ao consultar situações");
      }
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 horas
    retry: 2,
  });
}
