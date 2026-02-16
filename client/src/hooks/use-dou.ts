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
