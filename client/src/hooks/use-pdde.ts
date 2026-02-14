import { useQuery } from "@tanstack/react-query";

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
  acao?: string | null;
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

export function usePddeInfo(inep: string | null, ano?: number) {
  const currentYear = new Date().getFullYear();
  const queryYear = ano || currentYear;

  return useQuery<PddeInfo>({
    queryKey: ["/api/pdde", inep, queryYear],
    queryFn: async () => {
      if (!inep) return { ok: false, error: "No INEP code", ano: queryYear, co_escola: "" };
      const res = await fetch(`/api/pdde/${inep}?ano=${queryYear}`);
      if (!res.ok) throw new Error("Erro ao consultar PDDE");
      const data = await res.json();
      console.log("PDDE Data Received:", data);
      return data;
    },
    enabled: !!inep && /^\d{8}$/.test(inep),
    staleTime: 0,
    retry: 1,
  });
}
