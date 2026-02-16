import { useQuery } from "@tanstack/react-query";

export interface DOUResult {
  title: string;
  href: string;
  abstract: string;
  date: string;
  section: string;
  hierarchy: string;
  artType: string;
}

export interface DOUSearchResponse {
  ok: boolean;
  results: DOUResult[];
  total: number;
  message?: string;
  searchUrl?: string;
}

export interface DOUSearchParams {
  q: string;
  exact?: boolean;
  from?: string;
  to?: string;
  limit?: number;
}

export function useDOUSearch(params: DOUSearchParams, enabled = true) {
  const queryString = new URLSearchParams();
  if (params.q) queryString.set("q", params.q);
  if (params.exact === false) queryString.set("exact", "false");
  if (params.from) queryString.set("from", params.from);
  if (params.to) queryString.set("to", params.to);
  if (params.limit) queryString.set("limit", String(params.limit));

  return useQuery<DOUSearchResponse>({
    queryKey: ["/api/dou/search", params],
    queryFn: async () => {
      const res = await fetch(`/api/dou/search?${queryString.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Falha ao buscar no DOU");
      }
      return res.json();
    },
    enabled: enabled && !!(params.q?.trim()),
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}

export function useDOUCrossReference(normaTitle: string | null, enabled = true) {
  return useQuery<DOUSearchResponse>({
    queryKey: ["/api/dou/cross-reference", normaTitle],
    queryFn: async () => {
      const res = await fetch(`/api/dou/cross-reference?norma=${encodeURIComponent(normaTitle || "")}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Falha ao buscar referência no DOU");
      }
      return res.json();
    },
    enabled: enabled && !!(normaTitle?.trim()),
    staleTime: 1000 * 60 * 15,
    retry: 1,
  });
}

export interface MunicipalGazette {
  territory_id: string;
  territory_name: string;
  state_code: string;
  date: string;
  url: string;
  txt_url: string | null;
  edition: string | null;
  is_extra_edition: boolean | null;
  excerpts: string[];
}

export interface MunicipalGazetteResponse {
  ok: boolean;
  total: number;
  gazettes: MunicipalGazette[];
  message?: string;
}

export interface MunicipalSearchParams {
  q: string;
  size?: number;
  offset?: number;
  territory_ids?: string;
  since?: string;
  until?: string;
}

export function useMunicipalGazetteSearch(params: MunicipalSearchParams, enabled = true) {
  const queryString = new URLSearchParams();
  if (params.q) queryString.set("q", params.q);
  if (params.size) queryString.set("size", String(params.size));
  if (params.offset) queryString.set("offset", String(params.offset));
  if (params.territory_ids) queryString.set("territory_ids", params.territory_ids);
  if (params.since) queryString.set("since", params.since);
  if (params.until) queryString.set("until", params.until);

  return useQuery<MunicipalGazetteResponse>({
    queryKey: ["/api/diarios-municipais/busca", params],
    queryFn: async () => {
      const res = await fetch(`/api/diarios-municipais/busca?${queryString.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Falha ao buscar diários municipais");
      }
      return res.json();
    },
    enabled: enabled && !!(params.q?.trim()),
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}

export interface StateGazetteSearchParams {
  q: string;
  state: string;
  size?: number;
  offset?: number;
}

export function useStateGazetteSearch(params: StateGazetteSearchParams, enabled = true) {
  const queryString = new URLSearchParams();
  if (params.q) queryString.set("q", params.q);
  if (params.state) queryString.set("state", params.state);
  if (params.size) queryString.set("size", String(params.size));
  if (params.offset) queryString.set("offset", String(params.offset));

  return useQuery<MunicipalGazetteResponse>({
    queryKey: ["/api/diarios-estaduais/busca", params],
    queryFn: async () => {
      const res = await fetch(`/api/diarios-estaduais/busca?${queryString.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Falha ao buscar diários estaduais");
      }
      return res.json();
    },
    enabled: enabled && !!(params.q?.trim()) && !!(params.state?.trim()),
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}

export interface CityResult {
  territory_id: string;
  territory_name: string;
  state_code: string;
  publication_urls: any[];
  level: string;
}

export function useCitySearch(name: string, enabled = true) {
  return useQuery<{ ok: boolean; cities: CityResult[] }>({
    queryKey: ["/api/diarios-municipais/cidades", name],
    queryFn: async () => {
      const res = await fetch(`/api/diarios-municipais/cidades?name=${encodeURIComponent(name)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Falha ao buscar cidades");
      }
      return res.json();
    },
    enabled: enabled && !!(name?.trim()),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
}
