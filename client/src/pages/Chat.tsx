import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, Bot, User, MessageCircle, 
  HelpCircle, BookOpen,
  Lightbulb, ChevronRight, Loader2,
  BookMarked, PenTool, Bookmark, ClipboardCopy
} from "lucide-react";
import { useCreateConversation, useSendMessage, useConversation } from "@/hooks/use-chat";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import DocumentEditor from "@/components/caderno/DocumentEditor";

const SUGESTOES = [
  {
    pergunta: "O que posso comprar com o dinheiro do PDDE?",
    icone: <HelpCircle className="w-4 h-4" />
  },
  {
    pergunta: "Como fazer pesquisa de preços do jeito certo?",
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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 items-start"
    >
      <div className="mt-1 text-[#5d82b4] shrink-0">
        <Bot className="w-4 h-4" />
      </div>
      <div className="notebook-bubble ai flex-1 min-w-0">
        <div className="prose prose-sm max-w-none prose-p:my-0 prose-ul:my-0 prose-li:my-0 prose-headings:mt-2 prose-headings:mb-0 text-[15px] leading-[32px] text-[#2a2a2a]">
          <ReactMarkdown
            components={{
              a: ({ href, children }) => (
                <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined} className="text-[#5d4037] underline hover:text-[#8d6e63]">
                  {children}
                </a>
              ),
              p: ({ children }) => <p style={{ lineHeight: "32px", margin: 0 }}>{children}</p>,
              li: ({ children }) => <li style={{ lineHeight: "32px", margin: 0 }}>{children}</li>,
            }}
          >
            {corpo}
          </ReactMarkdown>
        </div>
        
        {fontes && (
          <div className="mt-0">
            <button
              onClick={() => setFontesExpanded(!fontesExpanded)}
              className="flex items-center gap-1.5 text-[11px] text-[#8d6e63] hover:text-[#5d4037] transition-colors leading-[32px]"
            >
              <Bookmark className="w-3 h-3" />
              <span>Fontes usadas</span>
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
                  <div className="text-[10px] leading-[24px] text-[#8d6e63] prose prose-xs max-w-none prose-p:my-0 prose-ul:my-0 prose-li:my-0 pl-2 border-l border-[#8d6e63]/20">
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

        <div className="flex items-center gap-3 leading-[32px]">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 text-[10px] text-[#8d6e63] hover:text-[#5d4037] transition-colors"
            title="Salvar como nota"
          >
            <BookMarked className="w-3 h-3" />
            {saved ? "Salvo!" : "Salvar"}
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(corpo)}
            className="flex items-center gap-1 text-[10px] text-[#8d6e63] hover:text-[#5d4037] transition-colors"
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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 items-start justify-end"
    >
      <div className="notebook-bubble user max-w-[85%]">
        <p className="leading-[32px] text-[16px] text-[#3d2e1a] m-0">{conteudo}</p>
      </div>
      <div className="mt-1 text-[#a08060] shrink-0">
        <User className="w-4 h-4" />
      </div>
    </motion.div>
  );
}

function IndicadorDigitando() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 items-start"
    >
      <div className="mt-1 text-[#5d82b4] shrink-0">
        <Lightbulb className="w-4 h-4" />
      </div>
      <div className="flex items-center gap-1.5 leading-[32px] h-[32px]">
        <motion.span 
          className="w-2 h-2 bg-[#8d6e63] rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
        />
        <motion.span 
          className="w-2 h-2 bg-[#8d6e63] rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
        />
        <motion.span 
          className="w-2 h-2 bg-[#8d6e63] rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
        />
      </div>
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
    <div className="mt-2">
      <p className="text-[11px] uppercase tracking-wide text-[#8d6e63] leading-[32px] flex items-center gap-1.5">
        <BookMarked className="w-3.5 h-3.5" />
        Notas salvas ({notes.length})
      </p>
      <div className="space-y-0">
        {notes.slice(0, 3).map((note: any) => (
          <div key={note.id} className="text-[13px] leading-[32px] text-[#5d4037] truncate">
            <span className="text-[#8d6e63] mr-1">-</span> {note.title}
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
      <AnimatePresence mode="wait">
        <motion.div
          key={pageKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="pl-[60px] pr-4 sm:pr-6 pt-3 pb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wider text-[#9b9b80] font-medium">Escreva sua pergunta</span>
              {temMensagens && (
                <Button
                  onClick={handleNewChat}
                  size="sm"
                  className="h-6 px-2 text-[10px] bg-transparent text-[#8d6e63] border border-[#8d6e63]/30 hover:bg-[#efebe9] rounded-md"
                >
                  Nova conversa
                </Button>
              )}
            </div>
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pesquise sobre programas, normas, gestão..."
                className="notebook-input min-h-[36px] max-h-20 resize-none text-[16px] border-[#8d6e63]/20 flex-1"
                disabled={isSending}
                rows={1}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isSending}
                className="shrink-0 bg-[#5d4037] hover:bg-[#6d4c41] h-9 w-9 p-0"
                size="icon"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto overflow-x-hidden pl-[60px] pr-4 sm:pr-6 pb-4 space-y-1 min-h-0"
            ref={scrollRef}
          >
            {!temMensagens ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-0"
              >
                <p className="text-[15px] leading-[32px] text-[#5d4037] font-medium m-0">
                  Folha de Pesquisa
                </p>
                <p className="text-[14px] leading-[32px] text-[#8d6e63] m-0">
                  Pergunte sobre programas, prazos, normas ou gestão escolar.
                </p>
                <p className="text-[14px] leading-[32px] text-[#8d6e63] m-0">
                  As respostas vêm com fontes e podem virar notas no seu caderno.
                </p>
                <p className="text-[13px] leading-[32px] text-[#a09070] m-0 mt-1">
                  Toque numa pergunta pra começar:
                </p>
                <div className="space-y-0">
                  {SUGESTOES.map((sugestao, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleSend(sugestao.pergunta)}
                      className="flex items-center gap-2 py-0 leading-[32px] text-left w-full group hover:bg-[#ffefd5]/30 rounded transition-colors px-1"
                    >
                      <span className="text-[#5d4037] shrink-0">{sugestao.icone}</span>
                      <span className="text-[14px] text-[#5d4037] group-hover:text-[#3d2e1a] underline decoration-dotted decoration-[#8d6e63]/40 transition-colors">
                        {sugestao.pergunta}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="pt-2 space-y-1">
                {conversationData?.messages.map((msg) => (
                  msg.role === "user" 
                    ? <MensagemUsuario key={msg.id} conteudo={msg.content} />
                    : <MensagemAssistente key={msg.id} conteudo={msg.content} onSaveNote={handleSaveNote} />
                ))}
                {isSending && <IndicadorDigitando />}
              </div>
            )}
            <NotasSalvas />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function Chat() {
  const [activeTab, setActiveTab] = useState<"chat" | "editor">("chat");

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: "linear-gradient(135deg, #faf5f0 0%, #efebe9 50%, #faf5f0 100%)" }}>
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#5d4037]">
              Caderno da Diretora
            </h1>
            <p className="text-sm text-[#8d6e63] mt-1">
              Pesquise, anote e redija documentos escolares
            </p>
          </div>

          <div className="flex items-center justify-center gap-1 mb-3">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === "editor"
                  ? "bg-[#5d4037] text-white shadow-md"
                  : "bg-white/80 text-[#6d4c41] border border-[#8d6e63]/30 hover:bg-[#efebe9]"
              }`}
            >
              <PenTool className="w-4 h-4" />
              Editor de Documentos
            </button>
          </div>

          <div className={`w-full rounded-2xl overflow-hidden ${activeTab === "chat" ? "paper-sheet min-h-[500px] max-h-[calc(100vh-220px)]" : "bg-white/90 border border-[#8d6e63]/20 shadow-lg min-h-[600px]"}`}>
            {activeTab === "chat" ? (
              <ResearchChat />
            ) : (
              <DocumentEditor />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
