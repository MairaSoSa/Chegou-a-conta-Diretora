import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Send, Bot, User, Sparkles, MessageCircle, 
  HelpCircle, BookOpen, Calculator, FileText,
  Lightbulb, Clock, ChevronRight, Loader2,
  BookMarked, PenTool, Bookmark, ClipboardCopy
} from "lucide-react";
import { useCreateConversation, useSendMessage, useConversation } from "@/hooks/use-chat";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import DocumentEditor from "@/components/caderno/DocumentEditor";

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
  const marcadores = ["📚 **Fontes:**", "**Fontes:**", "Fontes:", "📌 **Fontes usadas:**", "📌 Fontes usadas:"];
  for (const marcador of marcadores) {
    const indice = conteudo.indexOf(marcador);
    if (indice > -1) {
      return {
        corpo: conteudo.substring(0, indice).trim(),
        fontes: conteudo.substring(indice).trim(),
      };
    }
  }
  return { corpo: conteudo, fontes: null };
}

function MensagemAssistente({ conteudo, onSaveNote }: { conteudo: string; onSaveNote?: (text: string, sources: string | null) => void }) {
  const { corpo, fontes } = separarFontes(conteudo);
  const [fontesExpanded, setFontesExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSaveNote?.(corpo, fontes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 max-w-[92%] mr-auto items-start"
    >
      <div className="mt-1 text-[#5d4037]">
        <Bot className="w-4 h-4" />
      </div>
      <div className="notebook-bubble ai">
        <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-1 text-[15px] sm:text-[16px] leading-relaxed font-note text-[#3A3A3A]">
          <ReactMarkdown
            components={{
              a: ({ href, children }) => (
                <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined} className="text-[#5d4037] underline hover:text-[#8d6e63]">
                  {children}
                </a>
              ),
            }}
          >
            {corpo}
          </ReactMarkdown>
        </div>
        
        {fontes && (
          <div className="mt-2">
            <button
              onClick={() => setFontesExpanded(!fontesExpanded)}
              className="flex items-center gap-1.5 text-xs text-[#8d6e63] hover:text-[#5d4037] transition-colors"
            >
              <Bookmark className="w-3 h-3" />
              <span>📌 Fontes usadas</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${fontesExpanded ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {fontesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 text-[10px] sm:text-[11px] leading-snug text-muted-foreground prose prose-xs max-w-none prose-p:my-0.5 prose-ul:my-0.5 prose-li:my-0.5 p-2 rounded-lg bg-[#efebe9]/50 border border-[#8d6e63]/20">
                    <ReactMarkdown
                      components={{
                        a: ({ href, children }) => (
                          <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined} className="text-[#5d4037] underline hover:text-[#8d6e63]">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {fontes}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 text-[10px] text-[#8d6e63] hover:text-[#5d4037] transition-colors px-2 py-1 rounded-md hover:bg-[#efebe9]"
            title="Salvar como nota"
          >
            <BookMarked className="w-3 h-3" />
            {saved ? "Salvo!" : "Salvar como nota"}
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(corpo)}
            className="flex items-center gap-1 text-[10px] text-[#8d6e63] hover:text-[#5d4037] transition-colors px-2 py-1 rounded-md hover:bg-[#efebe9]"
            title="Copiar"
          >
            <ClipboardCopy className="w-3 h-3" />
            Copiar
          </button>
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
      className="flex gap-2 max-w-[80%] ml-auto flex-row-reverse items-start"
    >
      <div className="mt-1 text-[#8d6e63]">
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
      <div className="mt-1 text-[#5d4037]">
        <Lightbulb className="w-4 h-4" />
      </div>
      <div className="notebook-bubble ai flex items-center gap-1.5">
        <motion.span 
          className="w-2 h-2 bg-[#8d6e63] rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
        />
        <motion.span 
          className="w-2 h-2 bg-[#8d6e63] rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
        />
        <motion.span 
          className="w-2 h-2 bg-[#8d6e63] rounded-full"
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
      <h2 className="text-xl sm:text-2xl font-bold text-[#5d4037] mb-2 font-note text-left">
        Folha de Pesquisa
      </h2>
      <p className="text-xs sm:text-sm text-[#8d6e63] mb-3 max-w-md leading-relaxed text-left">
        Pesquise sobre programas, normas e gestão escolar. As respostas incluem fontes que você pode salvar como notas ou usar nos seus documentos.
      </p>
      <div className="max-w-md w-full grid gap-3 text-left mb-4">
        <div className="rounded-2xl border border-[#8d6e63]/30 bg-[#faf5f0] px-4 py-3 text-xs sm:text-sm text-[#5d4037] leading-relaxed shadow-sm rotate-[-0.5deg]">
          <p className="font-semibold text-[#5d4037] mb-1">O que você pode perguntar</p>
          <p>
            Programas, prazos, valores, indicadores ou termos que não ficaram claros. Respostas diretas, com exemplos do dia a dia.
          </p>
        </div>
        <div className="rounded-2xl border border-[#8d6e63]/20 bg-[#efebe9]/50 px-4 py-3 text-xs sm:text-sm text-[#6d4c41] leading-relaxed shadow-sm rotate-[0.4deg]">
          <p className="font-semibold text-[#5d4037] mb-1">Dica</p>
          <p>
            Cada resposta pode ser salva como nota ou copiada diretamente para o editor de documentos.
          </p>
        </div>
      </div>

      {showSugestoes && (
        <div className="w-full">
          <p className="text-xs sm:text-sm text-[#8d6e63] mb-2 sm:mb-3 flex items-center gap-2">
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Escolha uma pergunta para começar:
          </p>
          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            {SUGESTOES.map((sugestao, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => onSugestao(sugestao.pergunta)}
                className="group flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white border border-[#8d6e63]/20 hover:border-[#5d4037]/30 hover:shadow-md transition-all text-left"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#efebe9] text-[#5d4037] flex items-center justify-center flex-shrink-0">
                  {sugestao.icone}
                </div>
                <p className="flex-1 text-sm font-medium text-[#5d4037] leading-snug">
                  {sugestao.pergunta}
                </p>
                <ChevronRight className="w-4 h-4 text-[#8d6e63] flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function NotasSalvas() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/caderno/notas")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setNotes(data.notes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (notes.length === 0) return null;

  return (
    <div className="mt-4 px-2">
      <p className="text-xs uppercase tracking-wide text-[#8d6e63] mb-2 flex items-center gap-1.5">
        <BookMarked className="w-3.5 h-3.5" />
        Notas salvas ({notes.length})
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {notes.slice(0, 5).map((note: any) => (
          <div key={note.id} className="rounded-lg border border-[#8d6e63]/20 bg-[#faf5f0] p-2 text-xs text-[#5d4037]">
            <p className="font-medium truncate">{note.title}</p>
            <p className="text-[#8d6e63] truncate mt-0.5">{note.content?.substring(0, 80)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResearchChat() {
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

  const handleSaveNote = async (text: string, sources: string | null) => {
    try {
      await fetch("/api/caderno/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: text.substring(0, 60) + (text.length > 60 ? "..." : ""),
          content: text,
          sourceExcerpt: sources || undefined,
          conversationId,
        }),
      });
    } catch (e) {
      console.error("Failed to save note:", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const temMensagens = conversationData?.messages && conversationData.messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2">
        <div />
        {temMensagens && (
          <Button
            onClick={handleNewChat}
            size="sm"
            className="h-7 px-3 text-xs bg-transparent text-[#8d6e63] border border-[#8d6e63]/30 hover:bg-[#efebe9]"
          >
            Nova conversa
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={pageKey}
          initial={{ opacity: 0, x: 40, rotateZ: 1 }}
          animate={{ opacity: 1, x: 0, rotateZ: 0 }}
          exit={{ opacity: 0, x: -40, rotateZ: -1 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="relative flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 pb-4 space-y-4 sm:space-y-5 min-h-0" ref={scrollRef}>
            {!temMensagens ? (
              <TelaBoasVindas onSugestao={(texto) => handleSend(texto)} showSugestoes={true} />
            ) : (
              <AnimatePresence mode="popLayout">
                {conversationData?.messages.map((msg) => (
                  msg.role === "user" 
                    ? <MensagemUsuario key={msg.id} conteudo={msg.content} />
                    : <MensagemAssistente key={msg.id} conteudo={msg.content} onSaveNote={handleSaveNote} />
                ))}
                {isSending && <IndicadorDigitando />}
              </AnimatePresence>
            )}
            <NotasSalvas />
          </div>

          <div className="px-4 sm:px-6 pb-4 pt-1">
            <div className="rounded-2xl border border-[#8d6e63]/30 bg-white/80 px-4 py-3 shadow-sm">
              <div className="mb-2 text-xs uppercase tracking-wide text-[#8d6e63]">
                Escreva sua pergunta aqui
              </div>
              <div className="flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pesquise sobre programas, normas, gestão..."
                  className="notebook-input min-h-[44px] max-h-28 resize-none text-[17px] sm:text-[18px] font-note border-[#8d6e63]/20"
                  disabled={isSending}
                  rows={1}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isSending}
                  className="self-end flex-shrink-0 bg-[#5d4037] hover:bg-[#6d4c41]"
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
    </div>
  );
}

export default function Chat() {
  const [activeTab, setActiveTab] = useState<"chat" | "editor">("chat");

  return (
    <div className="min-h-screen chat-stage flex flex-col font-sans" style={{ background: "linear-gradient(135deg, #faf5f0 0%, #efebe9 50%, #faf5f0 100%)" }}>
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#5d4037] font-note">
              Caderno da Diretora
            </h1>
            <p className="text-sm text-[#8d6e63] mt-1">
              Pesquise, anote e redija documentos escolares
            </p>
          </div>

          <div className="flex items-center justify-center gap-1 mb-4">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "chat"
                  ? "bg-[#5d4037] text-white shadow-md"
                  : "bg-white/80 text-[#6d4c41] border border-[#8d6e63]/30 hover:bg-[#efebe9]"
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Folha de Pesquisa
            </button>
            <button
              onClick={() => setActiveTab("editor")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "editor"
                  ? "bg-[#5d4037] text-white shadow-md"
                  : "bg-white/80 text-[#6d4c41] border border-[#8d6e63]/30 hover:bg-[#efebe9]"
              }`}
            >
              <PenTool className="w-4 h-4" />
              Editor de Documentos
            </button>
          </div>

          <Card className="w-full bg-white/90 border-[#8d6e63]/20 shadow-lg rounded-2xl overflow-hidden min-h-[600px]">
            {activeTab === "chat" ? (
              <ResearchChat />
            ) : (
              <DocumentEditor />
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
