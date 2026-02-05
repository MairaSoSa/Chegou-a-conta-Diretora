import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Send, Bot, User, Sparkles, MessageCircle, 
  HelpCircle, BookOpen, Calculator, FileText,
  Lightbulb, Clock, ChevronRight, Loader2
} from "lucide-react";
import { useCreateConversation, useSendMessage, useConversation } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const SUGESTOES = [
  {
    pergunta: "O que posso comprar com o dinheiro do PDDE?",
    categoria: "PDDE",
    icone: <HelpCircle className="w-4 h-4" />
  },
  {
    pergunta: "Como fazer pesquisa de preços do jeito certo?",
    categoria: "Compras",
    icone: <Calculator className="w-4 h-4" />
  },
  {
    pergunta: "Quais documentos preciso guardar pra prestação de contas?",
    categoria: "Documentos",
    icone: <FileText className="w-4 h-4" />
  },
  {
    pergunta: "Posso pagar conta de luz com verba do PNAE?",
    categoria: "PNAE",
    icone: <Lightbulb className="w-4 h-4" />
  },
  {
    pergunta: "Qual o prazo pra prestar contas do PDDE?",
    categoria: "Prazos",
    icone: <Clock className="w-4 h-4" />
  },
  {
    pergunta: "Como funciona a reunião do Conselho Escolar?",
    categoria: "Conselho",
    icone: <BookOpen className="w-4 h-4" />
  }
];

function MensagemAssistente({ conteudo }: { conteudo: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 max-w-[90%] mr-auto"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-sm shadow-sm">
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{conteudo}</p>
      </div>
    </motion.div>
  );
}

function MensagemUsuario({ conteudo }: { conteudo: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 max-w-[90%] ml-auto flex-row-reverse"
    >
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
        <User className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="bg-primary text-primary-foreground p-4 rounded-2xl rounded-tr-sm">
        <p className="leading-relaxed">{conteudo}</p>
      </div>
    </motion.div>
  );
}

function IndicadorDigitando() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 max-w-[90%] mr-auto"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
        <motion.span 
          className="w-2 h-2 bg-emerald-400 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
        />
        <motion.span 
          className="w-2 h-2 bg-emerald-400 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
        />
        <motion.span 
          className="w-2 h-2 bg-emerald-400 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
        />
      </div>
    </motion.div>
  );
}

function TelaBoasVindas({ onSugestao }: { onSugestao: (texto: string) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full text-center px-4 py-8"
    >
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-6">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Oi, Diretora! Posso ajudar?
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
        Sou sua assistente virtual especialista em verbas escolares. 
        Pode perguntar sobre PDDE, PNAE, PNATE, prestação de contas... 
        tô aqui pra isso!
      </p>
      
      <div className="w-full max-w-2xl">
        <p className="text-sm text-muted-foreground mb-3 flex items-center justify-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Perguntas frequentes:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUGESTOES.map((sugestao, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSugestao(sugestao.pergunta)}
              className="group flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all text-left"
              data-testid={`sugestao-${i}`}
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                {sugestao.icone}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {sugestao.pergunta}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{sugestao.categoria}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Chat() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { mutate: createConversation } = useCreateConversation();
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { data: conversationData } = useConversation(conversationId);

  useEffect(() => {
    if (!conversationId) {
      createConversation("Nova Conversa", {
        onSuccess: (data) => setConversationId(data.id)
      });
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationData?.messages, isSending]);

  const handleSend = (texto?: string) => {
    const mensagem = texto || input;
    if (!mensagem.trim() || !conversationId) return;
    
    sendMessage({ conversationId, content: mensagem });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const temMensagens = conversationData?.messages && conversationData.messages.length > 0;

  return (
    <div className="h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background flex flex-col font-sans overflow-hidden">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-4 flex flex-col max-w-4xl overflow-hidden">
        <Card className="flex-1 flex flex-col overflow-hidden border-slate-200">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-gradient-to-r from-emerald-50 to-green-50 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                Assistente Virtual
                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs font-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Online
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Especialista em verbas escolares • PDDE, PNAE, PNATE
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" 
            ref={scrollRef}
          >
            {!temMensagens ? (
              <TelaBoasVindas onSugestao={(texto) => handleSend(texto)} />
            ) : (
              <AnimatePresence mode="popLayout">
                {conversationData?.messages.map((msg) => (
                  msg.role === "user" 
                    ? <MensagemUsuario key={msg.id} conteudo={msg.content} />
                    : <MensagemAssistente key={msg.id} conteudo={msg.content} />
                ))}
                {isSending && <IndicadorDigitando />}
              </AnimatePresence>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua dúvida aqui..."
                className="min-h-[52px] max-h-32 resize-none border-slate-200 focus:border-primary"
                disabled={isSending}
                rows={1}
                data-testid="input-mensagem"
              />
              <Button 
                onClick={() => handleSend()} 
                disabled={!input.trim() || isSending}
                size="lg"
                className="px-4 h-auto bg-primary hover:bg-primary/90"
                data-testid="button-enviar"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-[11px] text-center text-muted-foreground mt-2">
              A assistente pode errar às vezes. Sempre confirme as informações nos sites oficiais do FNDE.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
