import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useCreateConversation, useSendMessage, useConversation } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "O que posso comprar com verba do PDDE?",
  "Como fazer pesquisa de preços válida?",
  "Quais documentos para prestação de contas?",
  "Posso pagar tarifa bancária com PNAE?"
];

export default function Chat() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { mutate: createConversation } = useCreateConversation();
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { data: conversationData } = useConversation(conversationId);

  // Initialize conversation on mount if not exists
  useEffect(() => {
    if (!conversationId) {
      createConversation("Nova Conversa", {
        onSuccess: (data) => setConversationId(data.id)
      });
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationData?.messages, isSending]);

  const handleSend = () => {
    if (!input.trim() || !conversationId) return;
    
    sendMessage({ conversationId, content: input });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col font-sans overflow-hidden">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col max-w-4xl h-[calc(100vh-64px)]">
        <div className="flex-1 bg-card/30 border border-white/5 rounded-2xl flex flex-col overflow-hidden backdrop-blur-sm relative">
          
          {/* Header */}
          <div className="p-4 border-b border-white/5 bg-card/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">Assistente Virtual</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online • Especialista em legislação escolar
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
            {conversationData?.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-0 animate-in fade-in duration-700">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Como posso ajudar hoje?</h3>
                <p className="text-muted-foreground mb-8 max-w-sm">
                  Tire suas dúvidas sobre PDDE, PNAE, PNATE e prestação de contas.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        // Optional: auto-send
                      }}
                      className="text-sm p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all text-left text-muted-foreground hover:text-primary"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {conversationData?.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-white/10 text-amber-400"
                )}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed",
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-white/5 border border-white/10 rounded-tl-sm"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isSending && (
               <div className="flex gap-4 max-w-[85%] mr-auto">
                <div className="w-8 h-8 rounded-full bg-white/10 text-amber-400 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 rounded-tl-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-card border-t border-white/5">
            <div className="relative flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua dúvida aqui..."
                className="bg-background border-white/10 focus:border-primary pr-12 h-12"
                disabled={isSending}
              />
              <Button 
                onClick={handleSend} 
                disabled={!input.trim() || isSending}
                className="absolute right-1 top-1 bottom-1 w-10 h-10 p-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground/50 mt-2">
              A IA pode cometer erros. Sempre verifique as informações oficiais.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
