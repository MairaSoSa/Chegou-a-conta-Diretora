import { useQuery } from "@tanstack/react-query";

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

export interface SigpcLocalizarResponse {
  ok: boolean;
  prestacoes: SigpcPrestacaoListItem[];
  error?: string;
  fonte?: "olinda-sigpc" | "indisponivel";
  anosConsultados?: number[];
}

export function useSigpcLocalizar(cnpj?: string, anoConcessao?: number) {
  return useQuery<SigpcLocalizarResponse>({
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
    retry: 1,
  });
}

export function useSigpcPorUf(uf?: string, ano?: number, programa?: string) {
  return useQuery<SigpcLocalizarResponse>({
    queryKey: ["sigpc-uf", uf, ano, programa],
    queryFn: async () => {
      if (!uf) throw new Error("UF é obrigatória");
      
      const params = new URLSearchParams();
      if (ano) params.append("ano", String(ano));
      if (programa) params.append("programa", programa);
      
      const url = `/api/sigpc/uf/${uf}?${params.toString()}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error("Erro ao buscar prestações por UF");
      }
      
      return res.json();
    },
    enabled: !!uf,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

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
    retry: 1,
  });
}

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
    retry: 1,
  });
}
