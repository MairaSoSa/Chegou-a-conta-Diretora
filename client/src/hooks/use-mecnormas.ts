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
  disponivelEm?: string;
  disponivel_em?: string;
  tipo?: { id?: number; nome?: string; descricao?: string };
  assunto?: { id?: number; nome?: string; descricao?: string };
  unidade?: { id?: number; nome?: string; descricao?: string };
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
