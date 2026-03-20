import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useState, useEffect } from "react";

export function useSchoolSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    // INEP codes: fire immediately; name searches: debounce 350ms
    const delay = /^\d{7,8}$/.test(query.trim()) ? 0 : 350;
    const t = setTimeout(() => setDebouncedQuery(query), delay);
    return () => clearTimeout(t);
  }, [query]);

  return useQuery({
    queryKey: [api.schools.search.path, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return { dados: [], total: 0 };
      const res = await fetch(`/api/escola/buscar?nome=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error("Failed to search schools");
      return res.json();
    },
    enabled: debouncedQuery.length >= 2,
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
      return res.json();
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
      const data = await res.json();
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
      const data = await res.json();
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
      return res.json();
    },
    enabled: !!inep,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
}

export function useEscolaDiagnostico(inep: string) {
  return useQuery({
    queryKey: ["escola-diagnostico", inep],
    queryFn: async () => {
      if (!inep) return null;
      const res = await fetch(`/api/escola-diagnostico/${inep}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!inep,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
}

export function useEstatisticas(ano: number) {
  return useQuery({
    queryKey: ["estatisticas", ano],
    queryFn: async () => {
      const res = await fetch(`/api/censo-escolar/${ano}/escolas/estatisticas`);
      if (!res.ok) throw new Error("Erro ao buscar estatísticas");
      return res.json();
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
      return res.json();
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
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
