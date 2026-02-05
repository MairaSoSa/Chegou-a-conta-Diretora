import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function usePrograms() {
  return useQuery({
    queryKey: [api.programs.list.path],
    queryFn: async () => {
      const res = await fetch(api.programs.list.path);
      if (!res.ok) throw new Error("Failed to fetch programs");
      return api.programs.list.responses[200].parse(await res.json());
    },
  });
}

export function useProgram(code: string) {
  return useQuery({
    queryKey: [api.programs.get.path, code],
    queryFn: async () => {
      if (!code) return null;
      const url = buildUrl(api.programs.get.path, { code });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch program details");
      return api.programs.get.responses[200].parse(await res.json());
    },
    enabled: !!code,
  });
}
