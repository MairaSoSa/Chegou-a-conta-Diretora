import { useQuery } from "@tanstack/react-query";

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

export function usePddeSaldos(coEscola: string | null) {
  return useQuery<PddeSaldosResult>({
    queryKey: ["pdde-saldos", coEscola],
    queryFn: async () => {
      if (!coEscola) return { ok: false, saldos: [], anosDisponiveis: [], fonte: "indisponivel" as const, error: "Sem código INEP" };
      const res = await fetch(`/api/pdde/saldos/${coEscola}`);
      if (!res.ok) throw new Error("Erro ao consultar saldos PDDE");
      return res.json();
    },
    enabled: !!coEscola && /^\d{8}$/.test(coEscola),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
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

export function usePddeExecFin(coEscola: string | null) {
  return useQuery<PddeExecFinResult>({
    queryKey: ["pdde-execfin", coEscola],
    queryFn: async () => {
      if (!coEscola) return { ok: false, repasses: [], anosDisponiveis: [], fonte: "indisponivel" as const, error: "Sem código INEP" };
      const res = await fetch(`/api/pdde/execfin/${coEscola}`);
      if (!res.ok) throw new Error("Erro ao consultar execução financeira PDDE");
      return res.json();
    },
    enabled: !!coEscola && /^\d{8}$/.test(coEscola),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
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

export interface PddeUexSaldoItem {
  programa: string | null;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  saldo: number | null;
  saldo_texto: string | null;
}

export interface PddeUexSaldoResult {
  ok: boolean;
  ano: number;
  cnpj: string;
  saldos: PddeUexSaldoItem[];
  total_saldo: number;
  error?: string;
}

export function usePddeUexSaldo(cnpj: string | null, ano?: number) {
  const currentYear = new Date().getFullYear();
  const queryYear = ano || currentYear;
  const cnpjClean = (cnpj || "").replace(/\D/g, "");

  return useQuery<PddeUexSaldoResult>({
    queryKey: ["pdde-uex-saldo", cnpjClean, queryYear],
    queryFn: async () => {
      if (!cnpjClean) return { ok: false, ano: queryYear, cnpj: "", saldos: [], total_saldo: 0, error: "Sem CNPJ" };
      const res = await fetch(`/api/pdde/uex/saldo?cnpj=${cnpjClean}&ano=${queryYear}`);
      if (!res.ok) throw new Error("Erro ao consultar saldo UEx");
      return res.json();
    },
    enabled: !!cnpjClean && cnpjClean.length === 14,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
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
      if (!data.ok && queryYear === currentYear && data.error && /nenhum dado|não encontrad/i.test(data.error)) {
        const fallbackRes = await fetch(`/api/pdde/${inep}?ano=${currentYear - 1}`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData.ok) {
            console.log("PDDE Data Received (fallback):", fallbackData);
            return fallbackData;
          }
        }
      }
      console.log("PDDE Data Received:", data);
      return data;
    },
    enabled: !!inep && /^\d{8}$/.test(inep),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
