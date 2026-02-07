import { useQuery } from "@tanstack/react-query";

// ============================================================================
// TIPOS
// ============================================================================

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

// ============================================================================
// HOOK 1: Localizar prestações (busca inicial)
// ============================================================================

export function useSigpcLocalizar(cnpj?: string, anoConcessao?: number) {
  return useQuery<{ ok: boolean; prestacoes: SigpcPrestacaoListItem[] }>({
    queryKey: ["sigpc-localizar", cnpj, anoConcessao],
    queryFn: async () => {
      if (!cnpj) throw new Error("CNPJ é obrigatório");
      
      const params = new URLSearchParams();
      if (anoConcessao) params.append("anoConcessao", String(anoConcessao));
      
      const url = `/api/sigpc/localizar/${encodeURIComponent(cnpj)}${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error("Erro ao localizar prestações");
      }
      
      return res.json();
    },
    enabled: !!cnpj,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

// ============================================================================
// HOOK 2: Detalhar prestação
// ============================================================================

export function useSigpcDetalhar(pcId?: number) {
  return useQuery<{ ok: boolean; prestacao: SigpcPrestacaoDetalhada }>({
    queryKey: ["sigpc-detalhar", pcId],
    queryFn: async () => {
      if (!pcId) throw new Error("pcId é obrigatório");
      
      const res = await fetch(`/api/sigpc/detalhar/${pcId}`);
      
      if (!res.ok) {
        throw new Error("Erro ao detalhar prestação");
      }
      
      return res.json();
    },
    enabled: !!pcId && pcId > 0,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

// ============================================================================
// HOOK 3: Histórico de análise
// ============================================================================

export function useSigpcHistorico(concessaoId?: number) {
  return useQuery<{ ok: boolean; historico: SigpcHistoricoAnalise[] }>({
    queryKey: ["sigpc-historico", concessaoId],
    queryFn: async () => {
      if (!concessaoId) throw new Error("concessaoId é obrigatório");
      
      const res = await fetch(`/api/sigpc/historico/${concessaoId}`);
      
      if (!res.ok) {
        throw new Error("Erro ao recuperar histórico");
      }
      
      return res.json();
    },
    enabled: !!concessaoId && concessaoId > 0,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
