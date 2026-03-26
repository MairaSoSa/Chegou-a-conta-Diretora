import { useQuery } from "@tanstack/react-query";
import { normalizeTextDeep } from "@/lib/utils";

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
      return normalizeTextDeep(await res.json());
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
      return normalizeTextDeep(await res.json());
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
  uf: string | null;
  municipio: string | null;
  rede_atendimento: string | null;
  cnpj: string | null;
  razao_social: string | null;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  mes_ano: string | null;
  saldo_conta: number | null;
  saldo_fundos: number | null;
  saldo_poupanca: number | null;
  saldo_rdb_cdb: number | null;
  programa: string | null;
  saldo_total: number | null;
}

export interface PddeUexSaldoResult {
  ok: boolean;
  mes: string;
  cnpj: string;
  saldos: PddeUexSaldoItem[];
  total_saldo_fundos: number;
  total_saldo_geral: number;
  error?: string;
}

export function usePddeUexSaldo(cnpj: string | null, opts?: { mes?: string }) {
  const cnpjClean = (cnpj || "").replace(/\D/g, "");

  return useQuery<PddeUexSaldoResult>({
    queryKey: ["pdde-uex-saldo", cnpjClean, opts?.mes],
    queryFn: async () => {
      if (!cnpjClean) return { ok: false, mes: "", cnpj: "", saldos: [], total_saldo_fundos: 0, total_saldo_geral: 0, error: "Sem CNPJ" };
      const params = new URLSearchParams({ cnpj: cnpjClean });
      if (opts?.mes) params.set("mes", opts.mes);
      const res = await fetch(`/api/pdde/uex/saldo?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao consultar saldo UEx");
      return normalizeTextDeep(await res.json());
    },
    enabled: !!cnpjClean && cnpjClean.length === 14,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export interface SituacaoCadastralItem {
  ano: string | null;
  regiao: string | null;
  uf: string | null;
  municipio: string | null;
  cnpj_eex: string | null;
  codigo_escola: string | null;
  escola: string | null;
  localizacao: string | null;
  cnpj_uex: string | null;
  razao_social: string | null;
  ddd: string | null;
  telefone: string | null;
  rede_atendimento: string | null;
  mandato_dirigente: string | null;
  data_fim_mandato: string | null;
  data_atualizacao: string | null;
  hora_atualizacao: string | null;
}

export interface SituacaoCadastralResult {
  ok: boolean;
  total_registros: number | null;
  pagina_atual: number;
  itens: SituacaoCadastralItem[];
  error?: string;
}

export function usePddeSituacaoCadastral(inep: string | null, ano?: number) {
  const queryYear = ano || new Date().getFullYear();
  return useQuery<SituacaoCadastralResult>({
    queryKey: ["pdde-situacao-cadastral", inep, queryYear],
    queryFn: async () => {
      const tryYear = async (year: number) => {
        const res = await fetch(
          `/api/pdde/relatorios/situacao-cadastral?ano=${year}&co_escola=${inep}`
        );
        if (!res.ok) throw new Error("Erro ao consultar situação cadastral");
        return normalizeTextDeep(await res.json()) as SituacaoCadastralResult;
      };
      const result = await tryYear(queryYear);
      if (result.ok && result.itens.length === 0) {
        return tryYear(queryYear - 1);
      }
      return result;
    },
    enabled: !!inep && /^\d{8}$/.test(inep),
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}

export interface SituacaoPrestacaoContaItem {
  ano: string | null;
  programa: string | null;
  regiao: string | null;
  uf: string | null;
  municipio: string | null;
  razao_social_eex: string | null;
  cnpj_eex: string | null;
  situacao_pc_eex: string | null;
  suspensao_eex: string | null;
  escola: string | null;
  codigo_escola: string | null;
  cnpj_uex: string | null;
  situacao_pc_uex: string | null;
  suspensao_uex: string | null;
  valor_previsto: string | null;
}

export interface SituacaoPrestacaoContaResult {
  ok: boolean;
  total_registros: number | null;
  pagina_atual: number;
  itens: SituacaoPrestacaoContaItem[];
  disponivel: boolean;
  error?: string;
}

export function usePddePrestacaoConta(inep: string | null, ano?: number) {
  const queryYear = ano || new Date().getFullYear();
  return useQuery<SituacaoPrestacaoContaResult>({
    queryKey: ["pdde-prestacao-conta", inep, queryYear],
    queryFn: async () => {
      if (!inep) return { ok: false, disponivel: false, total_registros: null, pagina_atual: 1, itens: [], error: "Sem código INEP" };
      const tryYear = async (year: number) => {
        const res = await fetch(`/api/pdde/relatorios/prestacao-contas?ano=${year}&co_escola=${inep}`);
        if (!res.ok) throw new Error("Erro ao consultar prestação de contas");
        return normalizeTextDeep(await res.json()) as SituacaoPrestacaoContaResult;
      };
      const result = await tryYear(queryYear);
      if (result.ok && result.itens.length === 0) return tryYear(queryYear - 1);
      return result;
    },
    enabled: !!inep && /^\d{8}$/.test(inep),
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}

export interface SituacaoAtendimentoItem {
  ano: string | null;
  regiao: string | null;
  uf: string | null;
  municipio: string | null;
  codigo_municipio_ibge: string | null;
  cnpj_eex: string | null;
  escola: string | null;
  codigo_escola: string | null;
  rede_atendimento: string | null;
  qtd_alunos: string | null;
  cnpj_uex: string | null;
  razao_social_uex: string | null;
  programa: string | null;
  destinacao: string | null;
  valor_custeio: number | null;
  valor_capital: number | null;
  valor_total: number | null;
  data_ordem_pgto: string | null;
}

export interface SituacaoAtendimentoResult {
  ok: boolean;
  total_registros: number | null;
  pagina_atual: number;
  itens: SituacaoAtendimentoItem[];
  disponivel: boolean;
  error?: string;
}

export function usePddeAtendimento(inep: string | null, ano?: number) {
  const queryYear = ano || new Date().getFullYear();
  return useQuery<SituacaoAtendimentoResult>({
    queryKey: ["pdde-atendimento", inep, queryYear],
    queryFn: async () => {
      if (!inep) return { ok: false, disponivel: false, total_registros: null, pagina_atual: 1, itens: [], error: "Sem código INEP" };
      const tryYear = async (year: number) => {
        const res = await fetch(`/api/pdde/relatorios/atendimento?ano=${year}&co_escola=${inep}`);
        if (!res.ok) throw new Error("Erro ao consultar situação de atendimento");
        return normalizeTextDeep(await res.json()) as SituacaoAtendimentoResult;
      };
      const result = await tryYear(queryYear);
      if (result.ok && result.itens.length === 0) return tryYear(queryYear - 1);
      return result;
    },
    enabled: !!inep && /^\d{8}$/.test(inep),
    staleTime: 15 * 60 * 1000,
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
      const data = normalizeTextDeep(await res.json());
      if (!data.ok && queryYear === currentYear && data.error && /nenhum dado|não encontrad/i.test(data.error)) {
        const fallbackRes = await fetch(`/api/pdde/${inep}?ano=${currentYear - 1}`);
        if (fallbackRes.ok) {
          const fallbackData = normalizeTextDeep(await fallbackRes.json());
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
