import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Send, Bot, User, Sparkles, MessageCircle, 
  HelpCircle, BookOpen, Calculator, FileText,
  Lightbulb, Clock, ChevronRight, Loader2
} from "lucide-react";
import { useCreateConversation, useSendMessage, useConversation } from "@/hooks/use-chat";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

const SUGESTOES = [
  {
    pergunta: "O que posso comprar com o dinheiro do PDDE?",
    categoria: "PDDE",
    icone: <HelpCircle className="w-4 h-4" />
  },
  {
    pergunta: "Como fazer pesquisa de preços do jeito certo?",
    categoria: "Conselho",
    icone: <BookOpen className="w-4 h-4" />
  }
];

function separarFontes(conteudo: string): { corpo: string; fontes: string | null } {
  const marcadores = ["📚 **Fontes:**", "**Fontes:**", "Fontes:"];
    if (indice > -1) {
                {temMensagens ? (
                  <Button
                    onClick={handleNewChat}
                    className="h-8 px-3 text-xs bg-transparent text-muted-foreground border border-[#E6E0D3] hover:bg-white/80"
                  >
                    Nova conversa
                  </Button>
                ) : null}
              </div>
            {corpo}
          </ReactMarkdown>
        </div>
        {fontes ? (
          <div className="mt-3 text-[10px] sm:text-[11px] leading-snug text-muted-foreground prose prose-xs max-w-none prose-p:my-0.5 prose-ul:my-0.5 prose-li:my-0.5 prose-a:text-muted-foreground prose-a:underline">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined} className="text-muted-foreground underline hover:text-muted-foreground/80">
                    {children}
                  </a>
                ),
              }}
            >
              {fontes}
            </ReactMarkdown>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function MensagemUsuario({ conteudo }: { conteudo: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 max-w-[80%] ml-auto flex-row-reverse items-start"
    >
      <div className="mt-1 text-[#C9A227]">
        <User className="w-4 h-4" />
      </div>
      <div className="notebook-bubble user">
        <p className="leading-relaxed text-[17px] sm:text-[18px] font-note text-[#5C4A1D]">{conteudo}</p>
      </div>
    </motion.div>
  );
}

function IndicadorDigitando() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 max-w-[92%] mr-auto items-start"
    >
      <div className="mt-1 text-[#4A6CF7]">
        <Lightbulb className="w-4 h-4" />
      </div>
      <div className="notebook-bubble ai flex items-center gap-1.5">
        <motion.span 
          className="w-2 h-2 bg-[#4A6CF7] rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
        />
        <motion.span 
          className="w-2 h-2 bg-[#4A6CF7] rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
        />
        <motion.span 
          className="w-2 h-2 bg-[#4A6CF7] rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
        />
      </div>
    </motion.div>
  );
}

function TelaBoasVindas({
  onSugestao,
  showSugestoes = true,
}: {
  onSugestao: (texto: string) => void;
  showSugestoes?: boolean;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-start text-left px-2 py-4 sm:py-6"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 font-note text-left">
        Bem-vinda ao seu caderno de apoio
      </h2>
      <p className="text-xs sm:text-sm text-muted-foreground mb-3 max-w-md leading-relaxed text-left">
        Um espaço simples e direto para tirar dúvidas sobre o dashboard, entender as trilhas de aprendizagem e consultar conteúdos ligados à administração financeira da escola.
      </p>
      <div className="max-w-md w-full grid gap-3 text-left mb-4">
        <div className="rounded-2xl border border-[#E9DFC9] bg-[#FFF7C7] px-4 py-3 text-xs sm:text-sm text-foreground/90 leading-relaxed shadow-sm rotate-[-0.5deg]">
          <p className="font-semibold text-foreground mb-1">O que você pode perguntar</p>
          <p>
            Programas, prazos, valores, indicadores ou termos que não ficaram claros. Respostas diretas, com exemplos do dia a dia e adaptadas à realidade da sua escola.
          </p>
        </div>
        <div className="rounded-2xl border border-[#E6E0D3] bg-[#FFFDF7] px-4 py-3 text-xs sm:text-sm text-muted-foreground leading-relaxed shadow-sm rotate-[0.4deg]">
          <p className="font-semibold text-foreground mb-1">Observação importante</p>
          <p>
            As respostas podem variar um pouco. Tenho aprimorado constantemente o aprendizado da IA, mas é com o uso que ela vai ficando cada vez mais precisa.
          </p>
          <p className="mt-2">
            Sempre que possível, consulte fontes oficiais e canais institucionais. A proposta aqui é apoiar e facilitar o entendimento.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl mb-3 text-left text-xs sm:text-sm">
        <div className="rounded-xl border border-[#E6E0D3] bg-white/70 px-3 py-2 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Aqui dentro</p>
          <p className="text-foreground leading-relaxed">
            Programas, ferramentas e trilhas em um so lugar.
          </p>
        </div>
        <div className="rounded-xl border border-[#E6E0D3] bg-white/70 px-3 py-2 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Jeito de explicar</p>
          <p className="text-foreground leading-relaxed">
            Resposta curta, exemplo pratico e sem juridiques.
          </p>
        </div>
      </div>

      <p className="text-[11px] sm:text-xs text-muted-foreground mb-4 max-w-md leading-relaxed">
        Exemplo: se sua escola e ribeirinha, do interior ou quilombola, a pergunta vale do mesmo jeito. Eu adapto o exemplo para a sua realidade.
      </p>
      
      {showSugestoes ? (
        <div className="w-full">
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 flex items-center justify-center gap-2">
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Escolha uma pergunta para comecar:
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
      ) : null}
    </motion.div>
  );
}

function SugestoesLaterais({ onSugestao }: { onSugestao: (texto: string) => void }) {
  return (
    <div className="hidden lg:flex lg:flex-col gap-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
        <MessageCircle className="w-3.5 h-3.5" />
        Sugestoes prontas
      </div>
      <div className="flex flex-col gap-2">
        {SUGESTOES.slice(0, 5).map((sugestao, i) => (
          <button
            key={i}
            onClick={() => onSugestao(sugestao.pergunta)}
            className="text-left rounded-xl bg-white/80 border border-[#E6E0D3] px-3 py-3 text-sm text-foreground hover:border-primary/30 hover:shadow-sm transition"
            data-testid={`sugestao-lateral-${i}`}
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-600">{sugestao.icone}</span>
              <span className="leading-snug">{sugestao.pergunta}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Chat() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [pageKey, setPageKey] = useState(0);
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

  const handleNewChat = () => {
    createConversation("Nova Conversa", {
      onSuccess: (data) => {
        setConversationId(data.id);
        setPageKey((prev) => prev + 1);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const temMensagens = conversationData?.messages && conversationData.messages.length > 0;

  return (
    <div className="min-h-screen chat-stage flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center">
        <Card className="notebook-sheet notebook-float w-full max-w-[760px] flex-1 flex flex-col min-h-0 overflow-visible mx-auto">
          <div className="pl-16 sm:pl-20 pr-6 sm:pr-8 pt-10 pb-3 flex items-center justify-between gap-3">
            <div className="w-full max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-note text-left">
                Caderno da Diretora
              </h2>
            </div>
            {temMensagens ? (
              <Button
                onClick={handleNewChat}
                className="h-8 px-3 text-xs bg-transparent text-muted-foreground border border-[#E6E0D3] hover:bg-white/80"
              >
                Nova conversa
              </Button>
            ) : null}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={pageKey}
              initial={{ opacity: 0, x: 40, rotateZ: 1 }}
              animate={{ opacity: 1, x: 0, rotateZ: 0 }}
              exit={{ opacity: 0, x: -40, rotateZ: -1 }}
              transition={{ duration: 0.25 }}
              className="flex-1 min-h-0"
            >
              {/* Messages Area */}
              <div className="relative flex-1 overflow-y-auto overflow-x-hidden pl-16 sm:pl-20 pr-6 sm:pr-8 pb-4 space-y-4 sm:space-y-5 min-h-0" ref={scrollRef}>
                {!temMensagens ? (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 lg:gap-8 items-start">
                    <TelaBoasVindas onSugestao={(texto) => handleSend(texto)} showSugestoes={false} />
                    <SugestoesLaterais onSugestao={(texto) => handleSend(texto)} />
                  </div>
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
              <div className="pl-16 sm:pl-20 pr-6 sm:pr-8 pb-4 pt-1">
                <div className="rounded-2xl border border-[#E6E0D3] bg-white/80 px-4 py-3 shadow-sm">
                  <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                    Escreva sua pergunta aqui
                  </div>
                  <div className="flex items-end gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua dúvida sobre PDDE..."
                    className="notebook-input min-h-[44px] max-h-28 resize-none text-[17px] sm:text-[18px] font-note"
                    disabled={isSending}
                    rows={1}
                    data-testid="input-mensagem"
                  />
                  <Button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isSending}
                    className="self-end flex-shrink-0 bg-[#4A6CF7] hover:bg-[#3C5BE0]"
                    data-testid="button-enviar"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </Card>
      </main>
    </div>
  );
}
