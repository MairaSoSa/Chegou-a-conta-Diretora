import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { normalizeTextDeep } from "@/lib/utils";

export function useSchoolSearch(query: string) {
  return useQuery({
    queryKey: [api.schools.search.path, query],
    queryFn: async () => {
      if (!query || query.length < 2) return { dados: [], total: 0 };
      const res = await fetch(`/api/escola/buscar?nome=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to search schools");
      return normalizeTextDeep(await res.json());
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });
}

export function useSchool(inep: string) {
  return useQuery({
    queryKey: [api.schools.get.path, inep],
    queryFn: async () => {
      if (!inep) return null;
      const res = await fetch(`/api/escola/${inep}`);
      if (res.status === 404) throw new Error("Escola não encontrada");
      if (!res.ok) throw new Error("Erro ao buscar dados da escola");
      return normalizeTextDeep(await res.json());
    },
    enabled: !!inep,
    retry: false,
  });
}

export function useEscolaCompleta(inep: string, ano?: number) {
  return useQuery({
    queryKey: ["escola-completa", inep, ano],
    queryFn: async () => {
      if (!inep) return null;
      const anoParam = ano || new Date().getFullYear();
      const res = await fetch(`/api/escola-completa/${inep}?ano=${anoParam}`);
      if (!res.ok) return null;
      const data = normalizeTextDeep(await res.json());
      if (data.erro) return null;
      return data;
    },
    enabled: !!inep,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEscolaEvolucao(inep: string) {
  return useQuery({
    queryKey: ["escola-evolucao", inep],
    queryFn: async () => {
      if (!inep) return null;
      const res = await fetch(`/api/escola-evolucao/${inep}`);
      if (!res.ok) return null;
      const data = normalizeTextDeep(await res.json());
      if (!data.escola) return null;
      return data;
    },
    enabled: !!inep,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEscolaComparativo(inep: string) {
  return useQuery({
    queryKey: ["escola-comparativo", inep],
    queryFn: async () => {
      if (!inep) return null;
      const res = await fetch(`/api/escola-comparativo/${inep}`);
      if (!res.ok) return null;
      return normalizeTextDeep(await res.json());
    },
    enabled: !!inep,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
}

export function useEscolaMicroregiao(inep: string) {
  return useQuery({
    queryKey: ["escola-microregiao", inep],
    queryFn: async () => {
      if (!inep) return null;
      const res = await fetch(`/api/escola-microregiao/${inep}`);
      if (!res.ok) return null;
      return normalizeTextDeep(await res.json());
    },
    enabled: !!inep,
    retry: false,
    staleTime: 30 * 60 * 1000,
  });
}

export function useEscolaDiagnostico(inep: string) {
  return useQuery({
    queryKey: ["escola-diagnostico", inep],
    queryFn: async () => {
      if (!inep) return null;
      const res = await fetch(`/api/escola-diagnostico/${inep}`);
      if (!res.ok) return null;
      return normalizeTextDeep(await res.json());
    },
    enabled: !!inep,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
}

export function useEscolaCenso2025(inep: string) {
  return useQuery({
    queryKey: ["escola-censo2025", inep],
    queryFn: async () => {
      if (!inep) return null;
      const res = await fetch(`/api/escola-censo2025/${inep}`);
      if (!res.ok) return null;
      return await res.json();
    },
    enabled: !!inep,
    retry: false,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useEscolaTurmas(inep: string) {
  return useQuery({
    queryKey: ["escola-turmas", inep],
    queryFn: async () => {
      if (!inep) return null;
      const res = await fetch(`/api/escola-turmas/${inep}`);
      if (!res.ok) return null;
      return await res.json();
    },
    enabled: !!inep,
    retry: false,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useUfStats(uf: string | null, ano = 2025) {
  return useQuery({
    queryKey: ["uf-stats", uf, ano],
    queryFn: async () => {
      if (!uf) return null;
      const res = await fetch(`/api/censo-escolar/${ano}/uf/${uf}/stats`);
      if (!res.ok) return null;
      return normalizeTextDeep(await res.json());
    },
    enabled: !!uf,
    staleTime: 30 * 60 * 1000,
  });
}

export function useEstatisticas(ano: number) {
  return useQuery({
    queryKey: ["estatisticas", ano],
    queryFn: async () => {
      const res = await fetch(`/api/censo-escolar/${ano}/escolas/estatisticas`);
      if (!res.ok) throw new Error("Erro ao buscar estatísticas");
      return normalizeTextDeep(await res.json());
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useMediasNacionais(ano?: number) {
  return useQuery({
    queryKey: ["medias-nacionais", ano],
    queryFn: async () => {
      const url = ano ? `/api/medias-nacionais?ano=${ano}` : '/api/medias-nacionais';
      const res = await fetch(url);
      if (!res.ok) return {};
      return normalizeTextDeep(await res.json());
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useListaEscolas(ano: number, filters: Record<string, string>, page: number, perPage: number = 20) {
  return useQuery({
    queryKey: ["lista-escolas", ano, filters, page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", String(perPage));
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      const res = await fetch(`/api/censo-escolar/${ano}/escolas?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao buscar escolas");
      return normalizeTextDeep(await res.json());
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSimilarSchools(inep: string, ano: number, enabled: boolean) {
  return useQuery({
    queryKey: ["similar-schools", inep, ano],
    queryFn: async () => {
      if (!inep) return null;
      const res = await fetch(`/api/escola/${inep}/similares?ano=${ano}`);
      if (!res.ok) throw new Error("Erro ao buscar escolas similares");
      return normalizeTextDeep(await res.json());
    },
    enabled: !!inep && enabled,
    staleTime: 10 * 60 * 1000,
  });
}
