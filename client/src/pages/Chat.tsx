import { useState, useRef, useEffect, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Send, Bot, User, Sparkles, MessageCircle, 
  HelpCircle, BookOpen, Calculator, FileText,
  Lightbulb, Clock, ChevronRight, Loader2, Mic, Square
} from "lucide-react";
import { useCreateConversation, useSendMessage, useConversation } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

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
        <div className="text-foreground leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:mt-2 prose-headings:mb-1 prose-a:text-primary prose-a:underline">
          <ReactMarkdown
            components={{
              a: ({ href, children }) => (
                <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined} className="text-primary underline hover:text-primary/80">
                  {children}
                </a>
              ),
            }}
          >
            {conteudo}
          </ReactMarkdown>
        </div>
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
      className="flex flex-col items-center text-center px-2 py-4 sm:py-6"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-4 sm:mb-6">
        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
          <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
        </div>
      </div>
      
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
        Oi! Posso ajudar?
      </h2>
      <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-sm leading-relaxed">
        Sou sua assistente para dúvidas sobre verbas escolares: PDDE, PNAE, PNATE...
      </p>
      
      <div className="w-full">
        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 flex items-center justify-center gap-2">
          <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Clique para perguntar:
        </p>
        <div className="grid grid-cols-1 gap-2 sm:gap-3">
          {SUGESTOES.slice(0, 4).map((sugestao, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => onSugestao(sugestao.pergunta)}
              className="group flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all text-left"
              data-testid={`sugestao-${i}`}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                {sugestao.icone}
              </div>
              <p className="flex-1 text-sm font-medium text-foreground leading-snug">
                {sugestao.pergunta}
              </p>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  
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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        chunksRef.current = [];

        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(",")[1];
            const res = await fetch("/api/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audio: base64 }),
            });
            if (!res.ok) throw new Error("Transcription failed");
            const { transcript } = await res.json();
            setIsTranscribing(false);
            if (transcript && transcript.trim()) {
              handleSend(transcript.trim());
            } else {
              toast({ title: "Nenhum texto detectado", description: "Tente falar mais perto do microfone.", variant: "destructive" });
            }
          };
        } catch (err) {
          setIsTranscribing(false);
          toast({ title: "Erro ao transcrever", description: "Tente novamente.", variant: "destructive" });
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast({ title: "Microfone indisponível", description: "Permita o acesso ao microfone no navegador.", variant: "destructive" });
    }
  }, [conversationId, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const temMensagens = conversationData?.messages && conversationData.messages.length > 0;
  const isBusy = isSending || isTranscribing;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col max-w-3xl">
        <Card className="flex-1 flex flex-col min-h-0 border-slate-200 overflow-hidden">
          {/* Header - mais compacto */}
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-b bg-gradient-to-r from-emerald-50 to-green-50 flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md flex-shrink-0">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-foreground flex items-center gap-2 flex-wrap">
                <span className="truncate">Assistente</span>
                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs font-normal flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Online
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                Tira-dúvidas sobre verbas escolares
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-slate-50/50 min-h-0" 
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
          <div className="p-3 sm:p-4 bg-white border-t flex-shrink-0">
            {isRecording && (
              <div className="flex items-center justify-center gap-2 mb-2 py-2 px-3 rounded-lg bg-red-50 border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm text-red-700 font-medium" data-testid="text-recording-status">Gravando...</span>
              </div>
            )}
            {isTranscribing && (
              <div className="flex items-center justify-center gap-2 mb-2 py-2 px-3 rounded-lg bg-amber-50 border border-amber-200">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span className="text-sm text-amber-700 font-medium" data-testid="text-transcribing-status">Transcrevendo seu áudio...</span>
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite ou grave sua dúvida..."
                className="min-h-[44px] max-h-24 resize-none border-slate-200 focus:border-primary text-base"
                disabled={isBusy}
                rows={1}
                data-testid="input-mensagem"
              />
              {isRecording ? (
                <Button 
                  onClick={stopRecording}
                  variant="destructive"
                  size="icon"
                  className="self-end flex-shrink-0"
                  data-testid="button-parar-gravacao"
                >
                  <Square className="w-5 h-5" />
                </Button>
              ) : (
                <Button 
                  onClick={startRecording}
                  variant="outline"
                  size="icon"
                  disabled={isBusy}
                  className="self-end flex-shrink-0"
                  data-testid="button-gravar"
                >
                  {isTranscribing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
              )}
              <Button 
                onClick={() => handleSend()} 
                disabled={!input.trim() || isBusy}
                className="self-end flex-shrink-0"
                data-testid="button-enviar"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-[10px] sm:text-[11px] text-center text-muted-foreground mt-2">
              Confirme sempre nos sites oficiais do FNDE
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
