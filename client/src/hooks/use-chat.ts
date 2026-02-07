import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Chat types derived from server structure
interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

interface Message {
  id: number;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export function useConversations() {
  return useQuery({
    queryKey: ["/api/conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return (await res.json()) as Conversation[];
    },
  });
}

export function useConversation(id: number | null) {
  return useQuery({
    queryKey: ["/api/conversations", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return (await res.json()) as Conversation & { messages: Message[] };
    },
    enabled: !!id,
    refetchInterval: 5000, // Poll for updates during active chat
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return (await res.json()) as Conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number, content: string }) => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      
      if (!res.ok) throw new Error("Failed to send message");
      
      // Properly consume the SSE stream to completion
      if (!res.body) throw new Error("No response body");
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE messages
          const lines = buffer.split("\n");
          buffer = lines[lines.length - 1]; // Keep incomplete line in buffer
          
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.done) {
                  // SSE stream is complete
                  return true;
                }
              } catch (e) {
                // Ignore JSON parse errors for malformed SSE data
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      return true;
    },
    onSuccess: (_, { conversationId }) => {
      // Invalidate specific conversation to show new messages
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId] });
    },
  });
}
