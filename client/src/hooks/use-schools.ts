import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useSchoolSearch(query: string) {
  return useQuery({
    queryKey: [api.schools.search.path, query],
    queryFn: async () => {
      // Don't search if query is too short
      if (!query || query.length < 2) return [];
      
      const url = `${api.schools.search.path}?q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to search schools");
      return api.schools.search.responses[200].parse(await res.json());
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
      return api.schools.get.responses[200].parse(await res.json());
    },
    enabled: !!inep,
    retry: false
  });
}
