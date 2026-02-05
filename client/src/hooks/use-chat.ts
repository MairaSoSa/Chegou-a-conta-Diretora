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
      // NOTE: The server uses SSE for responses, but for basic implementation we'll assume it returns or we poll
      // For this implementation, we'll trigger the POST which initiates the stream
      // Handling SSE in a simple hook is complex, so we'll rely on the server saving messages and polling to fetch updates
      // OR simpler: wait for the request to complete if it wasn't streaming-only. 
      // Given the implementation notes specified "Text based chat UI", we will use the standard fetch.
      // The provided server route sends SSE. 
      // To properly handle SSE without a complex streaming hook for now:
      // We will perform the fetch and consume the stream to completion, then invalidate.
      
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      
      if (!res.ok) throw new Error("Failed to send message");
      
      // Consume the stream so the browser doesn't keep it pending
      const reader = res.body?.getReader();
      if (reader) {
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      }
      
      return true;
    },
    onSuccess: (_, { conversationId }) => {
      // Invalidate specific conversation to show new messages
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId] });
    },
  });
}
