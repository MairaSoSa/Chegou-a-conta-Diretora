import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useTools(category?: string) {
  return useQuery({
    queryKey: [api.tools.list.path, category],
    queryFn: async () => {
      const url = category 
        ? `${api.tools.list.path}?category=${encodeURIComponent(category)}`
        : api.tools.list.path;
        
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch tools");
      return api.tools.list.responses[200].parse(await res.json());
    },
  });
}
