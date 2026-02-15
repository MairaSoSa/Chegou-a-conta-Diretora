import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useSchoolSearch(query: string) {
  return useQuery({
    queryKey: [api.schools.search.path, query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const url = `${api.schools.search.path}?q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to search schools");
      return res.json();
    },
    enabled: query.length >= 2,
  });
}

export function useSchool(inep: string) {
  return useQuery({
    queryKey: [api.schools.get.path, inep],
    queryFn: async () => {
      if (!inep) return null;
      const url = buildUrl(api.schools.get.path, { inep });
      const res = await fetch(url);
      if (res.status === 404) throw new Error("Escola não encontrada");
      if (!res.ok) throw new Error("Erro ao buscar dados da escola");
      return res.json();
    },
    enabled: !!inep,
    retry: false
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
      const data = await res.json();
      if (data.erro) return null;
      return data;
    },
    enabled: !!inep,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
