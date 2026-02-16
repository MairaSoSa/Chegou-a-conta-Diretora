import { useQuery } from "@tanstack/react-query";

export interface MecNormasFilters {
  tipos: Array<{ id: number; nome: string }>;
  assuntos: Array<{ id: number; nome: string }>;
  unidades: Array<{ id: number; nome: string }>;
  ordenacoes: Array<{ id: number; nome: string }>;
}

export interface MecNormasAto {
  id: number | string;
  titulo?: string;
  tituloAto?: string;
  identificacao?: string;
  ementa?: string;
  resumo?: string;
  numero?: string | number;
  numeroAto?: string | number;
  dataPublicacao?: string;
  dataPublicacaoAto?: string;
  dataDePublicacao?: string;
  dataDePublicacaoString?: string;
  dataDeEdicaoString?: string;
  disponivelEm?: string;
  disponivel_em?: string;
  vigente?: boolean;
  tipo?: { id?: number; nome?: string; descricao?: string };
  assunto?: { id?: number; nome?: string; descricao?: string };
  assuntos?: Array<{ id?: number; nome?: string }>;
  unidade?: { id?: number; nome?: string; sigla?: string; descricao?: string };
  anoText?: string;
}

export interface MecNormasSearchParams {
  q?: string;
  exata?: boolean;
  tipo?: string;
  assunto?: string;
  unidade?: string;
  ordenacao?: string;
  page?: number;
  pageSize?: number;
}

export interface MecNormasAllParams {
  page?: number;
  size?: number;
  tipo?: string;
  assunto?: string;
  vigente?: string;
  q?: string;
}

export interface MecNormasTiposSummary {
  ok: boolean;
  totalGeral: number;
  tipos: Array<{ id: number; nome: string; total: number }>;
}

export function useMecNormasFilters() {
  return useQuery<MecNormasFilters>({
    queryKey: ["/api/mecnormas/filters"],
    queryFn: async () => {
      const res = await fetch("/api/mecnormas/filters");
      if (!res.ok) throw new Error("Falha ao carregar filtros");
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
    retry: 2,
  });
}

export function useMecNormasTipos() {
  return useQuery<MecNormasTiposSummary>({
    queryKey: ["/api/mecnormas/tipos"],
    queryFn: async () => {
      const res = await fetch("/api/mecnormas/tipos");
      if (!res.ok) throw new Error("Falha ao carregar tipos");
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
    retry: 2,
  });
}

export function useMecNormasAll(params: MecNormasAllParams) {
  const queryString = new URLSearchParams();
  if (params.page !== undefined) queryString.set("page", String(params.page));
  if (params.size) queryString.set("size", String(params.size));
  if (params.tipo) queryString.set("tipo", params.tipo);
  if (params.assunto) queryString.set("assunto", params.assunto);
  if (params.vigente) queryString.set("vigente", params.vigente);
  if (params.q) queryString.set("q", params.q);

  return useQuery({
    queryKey: ["/api/mecnormas/all", params],
    queryFn: async () => {
      const res = await fetch(`/api/mecnormas/all?${queryString.toString()}`);
      if (!res.ok) throw new Error("Falha ao buscar normas");
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}

export function useMecNormasSearch(params: MecNormasSearchParams, enabled = true) {
  const queryString = new URLSearchParams();
  if (params.q) queryString.set("q", params.q);
  if (params.exata) queryString.set("exata", "true");
  if (params.tipo) queryString.set("tipo", params.tipo);
  if (params.assunto) queryString.set("assunto", params.assunto);
  if (params.unidade) queryString.set("unidade", params.unidade);
  if (params.ordenacao) queryString.set("ordenacao", params.ordenacao);
  if (params.page) queryString.set("page", String(params.page));
  if (params.pageSize) queryString.set("pageSize", String(params.pageSize));

  return useQuery({
    queryKey: ["/api/mecnormas/search", params],
    queryFn: async () => {
      const res = await fetch(`/api/mecnormas/search?${queryString.toString()}`);
      if (!res.ok) throw new Error("Falha ao buscar normas");
      const json = await res.json();
      return json;
    },
    enabled: enabled && !!(params.q?.trim()),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useMecNormasDetail(atoId: string | number | null) {
  return useQuery({
    queryKey: ["/api/mecnormas/atos", atoId],
    queryFn: async () => {
      const res = await fetch(`/api/mecnormas/atos/${atoId}`);
      if (!res.ok) throw new Error("Ato não encontrado");
      return res.json();
    },
    enabled: !!atoId,
    staleTime: 1000 * 60 * 10,
  });
}
