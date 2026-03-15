import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { useCreateConversation, useSendMessage, useConversation } from "@/hooks/use-chat";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Send, Bot, User, Loader2, BookMarked, Bookmark,
  ChevronRight, ClipboardCopy, Plus, X, Download,
  FileText, Mail, Search, BarChart3, Bold, Italic,
  Underline, Highlighter, RefreshCw, MessageCircle, PenTool,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TemplateName = "Ata de Reunião" | "Ofício" | "Pesquisa de Preços" | "Relatório";

interface OpenDoc {
  id: string;
  apiId?: number;
  template: TemplateName;
  title: string;
  saved: boolean;
  data: Record<string, string>;
  formats: Record<string, Record<string, boolean>>;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TEMPLATE_DEFAULTS: Record<TemplateName, Record<string, string>> = {
  "Ata de Reunião": {
    titulo: "Ata de reunião do conselho escolar",
    data: "", horario: "", local: "", participantes: "",
    pauta: "", deliberacoes: "", encaminhamentos: "",
    fechamento: "Nada mais havendo a tratar, a reunião foi encerrada.",
  },
  "Ofício": {
    numero: "Ofício nº ____/2026", destinatario: "", cargo: "", orgao: "",
    assunto: "", corpo: "", encerramento: "Atenciosamente,", assinatura: "",
  },
  "Pesquisa de Preços": {
    objeto: "", item: "", fornecedor1: "", valor1: "",
    fornecedor2: "", valor2: "", fornecedor3: "", valor3: "",
    justificativa: "", responsavel: "", data: "",
  },
  "Relatório": {
    titulo: "Relatório de execução", periodo: "", objetivo: "", atividades: "",
    resultados: "", dificuldades: "", encaminhamentos: "", responsavel: "",
  },
};

const TEMPLATE_GUIDES: Record<TemplateName, { field: string; title: string; tip: string }[]> = {
  "Ata de Reunião": [
    { field: "titulo", title: "Título", tip: "Use um nome direto, como Ata de reunião do conselho escolar ou Ata da UEx." },
    { field: "data", title: "Data", tip: "Informe a data completa para facilitar arquivo e conferência futura." },
    { field: "horario", title: "Horário", tip: "Vale registrar o início e, se necessário, o término." },
    { field: "local", title: "Local", tip: "Indique o espaço da reunião ou se foi virtual." },
    { field: "participantes", title: "Participantes", tip: "Liste nomes e funções de quem participou." },
    { field: "pauta", title: "Pauta", tip: "Resuma os assuntos da reunião com clareza." },
    { field: "deliberacoes", title: "Deliberações", tip: "Registre o que foi decidido de forma objetiva." },
    { field: "encaminhamentos", title: "Encaminhamentos", tip: "Anote próximos passos, responsáveis e prazos." },
    { field: "fechamento", title: "Fechamento", tip: "Finalize com uma frase formal e simples." },
  ],
  "Ofício": [
    { field: "numero", title: "Número", tip: "Mantenha um padrão simples de numeração do documento." },
    { field: "destinatario", title: "Destinatário", tip: "Escreva o nome da pessoa ou setor que vai receber o ofício." },
    { field: "cargo", title: "Cargo", tip: "Inclua o cargo para dar formalidade ao documento." },
    { field: "orgao", title: "Órgão", tip: "Indique secretaria, escola, regional ou instituição." },
    { field: "assunto", title: "Assunto", tip: "Use uma linha curta e objetiva." },
    { field: "corpo", title: "Corpo do texto", tip: "Explique o pedido, informação ou encaminhamento sem excessos." },
    { field: "encerramento", title: "Encerramento", tip: "Use uma fórmula de cortesia simples, como Atenciosamente." },
    { field: "assinatura", title: "Assinatura", tip: "Registre nome e função de quem assina o documento." },
  ],
  "Pesquisa de Preços": [
    { field: "objeto", title: "Objeto da compra", tip: "Explique rapidamente o que será adquirido." },
    { field: "item", title: "Item", tip: "Descreva o item com clareza para permitir comparação justa." },
    { field: "fornecedor1", title: "Fornecedor 1", tip: "Indique um fornecedor ou referência consultada." },
    { field: "fornecedor2", title: "Fornecedor 2", tip: "A comparação precisa ser equivalente ao mesmo item." },
    { field: "fornecedor3", title: "Fornecedor 3", tip: "Ter mais de uma referência fortalece a justificativa." },
    { field: "justificativa", title: "Justificativa", tip: "Explique como foi escolhida a proposta mais adequada." },
    { field: "responsavel", title: "Responsável", tip: "Informe quem realizou a pesquisa." },
    { field: "data", title: "Data", tip: "Registre a data da consulta ou consolidação." },
  ],
  "Relatório": [
    { field: "titulo", title: "Título", tip: "Use um nome simples para identificar o relatório." },
    { field: "periodo", title: "Período", tip: "Indique o intervalo de tempo analisado." },
    { field: "objetivo", title: "Objetivo", tip: "Explique o propósito do relatório em poucas linhas." },
    { field: "atividades", title: "Atividades", tip: "Liste o que foi realizado no período." },
    { field: "resultados", title: "Resultados", tip: "Mostre o que foi alcançado ou observado." },
    { field: "dificuldades", title: "Dificuldades", tip: "Registre desafios de forma honesta e objetiva." },
    { field: "encaminhamentos", title: "Encaminhamentos", tip: "Indique próximos passos ou recomendações." },
    { field: "responsavel", title: "Responsável", tip: "Informe nome e função da pessoa responsável." },
  ],
};

const TEMPLATES: { icon: React.ReactNode; title: TemplateName; desc: string }[] = [
  { icon: <FileText className="w-4 h-4" />, title: "Ata de Reunião", desc: "Modelo oficial" },
  { icon: <Mail className="w-4 h-4" />, title: "Ofício", desc: "Texto formal" },
  { icon: <Search className="w-4 h-4" />, title: "Pesquisa de Preços", desc: "Registro de cotações" },
  { icon: <BarChart3 className="w-4 h-4" />, title: "Relatório", desc: "Execução do recurso" },
];

const SUGESTOES = [
  "PDDE: o que pode comprar?",
  "Como fazer pesquisa de preços do jeito certo?",
  "Como registrar uma ata de reunião?",
  "Quais são as regras de prestação de contas do PDDE?",
  "Quais documentos a escola precisa guardar?",
  "Como funciona a reunião do conselho escolar?",
];

const STORAGE_KEY = "caderno-diretora-v2";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function createDoc(template: TemplateName, suffix = ""): OpenDoc {
  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    template,
    title: suffix ? `${template} ${suffix}` : template,
    saved: false,
    formats: {},
    data: JSON.parse(JSON.stringify(TEMPLATE_DEFAULTS[template])),
  };
}

function docToHtml(doc: OpenDoc): string {
  const d = doc.data;
  const lines: string[] = [];
  const guides = TEMPLATE_GUIDES[doc.template] || [];
  for (const { field, title } of guides) {
    if (d[field]) lines.push(`<p><strong>${title}:</strong> ${d[field]}</p>`);
  }
  return lines.join("\n");
}

function separarFontes(conteudo: string): { corpo: string; fontes: string | null } {
  const marcadores = ["📚 **Fontes:**", "**Fontes:**", "Fontes:", "📌 **Fontes usadas:**"];
  for (const m of marcadores) {
    const idx = conteudo.indexOf(m);
    if (idx > -1) return { corpo: conteudo.substring(0, idx).trim(), fontes: conteudo.substring(idx).trim() };
  }
  return { corpo: conteudo, fontes: null };
}

// ─── CHAT COMPONENTS ──────────────────────────────────────────────────────────

function MensagemAssistente({ conteudo, onSaveNote }: { conteudo: string; onSaveNote?: (text: string, sources: string | null) => void }) {
  const { corpo, fontes } = separarFontes(conteudo);
  const [fontesExpanded, setFontesExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start">
      <div className="mt-1 shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#8e2f2f]/10 text-[#8e2f2f]">
        <Bot className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 rounded-2xl bg-white border border-[#e8dad2] px-4 py-3 shadow-sm">
        <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 text-[14px] leading-7 text-[#3d2318]">
          <ReactMarkdown
            components={{
              a: ({ href, children }) => (
                <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-[#8e2f2f] underline">
                  {children}
                </a>
              ),
            }}
          >
            {corpo}
          </ReactMarkdown>
        </div>
        {fontes && (
          <div className="mt-2 border-t border-[#e8dad2] pt-2">
            <button
              onClick={() => setFontesExpanded(!fontesExpanded)}
              className="flex items-center gap-1.5 text-[11px] text-[#a07060] hover:text-[#8e2f2f] transition-colors"
            >
              <Bookmark className="w-3 h-3" />
              Fontes usadas
              <ChevronRight className={`w-3 h-3 transition-transform ${fontesExpanded ? "rotate-90" : ""}`} />
            </button>
            {fontesExpanded && (
              <div className="mt-1 pl-3 border-l-2 border-[#e8dad2] text-[11px] text-[#a07060] leading-6">
                <ReactMarkdown>{fontes}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-3 mt-2 pt-1">
          <button
            onClick={() => { onSaveNote?.(corpo, fontes); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
            className="flex items-center gap-1 text-[10px] text-[#a07060] hover:text-[#8e2f2f] transition-colors"
          >
            <BookMarked className="w-3 h-3" />
            {saved ? "Salvo!" : "Salvar nota"}
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(corpo)}
            className="flex items-center gap-1 text-[10px] text-[#a07060] hover:text-[#8e2f2f] transition-colors"
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
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start justify-end">
      <div className="max-w-[80%] rounded-2xl bg-[#8e2f2f] px-4 py-3 text-white shadow-sm">
        <p className="text-[14px] leading-6 m-0">{conteudo}</p>
      </div>
      <div className="mt-1 shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#e8dad2] text-[#8e2f2f]">
        <User className="w-4 h-4" />
      </div>
    </motion.div>
  );
}

function IndicadorDigitando() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-start">
      <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#8e2f2f]/10 text-[#8e2f2f]">
        <Bot className="w-4 h-4" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl bg-white border border-[#e8dad2] px-4 py-3 shadow-sm">
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.span key={i} className="w-2 h-2 bg-[#8e2f2f]/40 rounded-full"
            animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay }} />
        ))}
      </div>
    </motion.div>
  );
}

// ─── PESQUISA PANEL ───────────────────────────────────────────────────────────

function PesquisaPanel() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [pageKey, setPageKey] = useState(0);
  const [apiNotes, setApiNotes] = useState<any[]>([]);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  const { mutate: createConversation } = useCreateConversation();
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { data: conversationData } = useConversation(conversationId);

  useEffect(() => {
    createConversation("Nova Conversa", { onSuccess: (data) => setConversationId(data.id) });
    fetch("/api/caderno/notas").then(r => r.json()).then(d => { if (d.ok) setApiNotes(d.notes || []); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (leftScrollRef.current) leftScrollRef.current.scrollTop = leftScrollRef.current.scrollHeight;
    if (rightScrollRef.current) rightScrollRef.current.scrollTop = rightScrollRef.current.scrollHeight;
  }, [conversationData?.messages, isSending]);

  const handleSend = (texto?: string) => {
    const msg = texto || input;
    if (!msg.trim() || !conversationId) return;
    sendMessage({ conversationId, content: msg });
    setInput("");
  };

  const handleNewChat = () => {
    createConversation("Nova Conversa", { onSuccess: (data) => { setConversationId(data.id); setPageKey(p => p + 1); } });
  };

  const handleSaveNote = async (text: string, sources: string | null) => {
    try {
      const res = await fetch("/api/caderno/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: text.substring(0, 60) + (text.length > 60 ? "..." : ""), content: text, sourceExcerpt: sources || undefined, conversationId }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.ok) setApiNotes(prev => [d.note, ...prev]);
      }
    } catch {}
  };

  const msgs = conversationData?.messages ?? [];
  const userMsgs = msgs.filter(m => m.role === "user");
  const aiMsgs = msgs.filter(m => m.role === "assistant");
  const temMensagens = msgs.length > 0;

  // Lined paper background (shared between pages)
  const linedPaper = {
    backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #c8ddf5 31px, #c8ddf5 32.5px)",
    backgroundSize: "100% 32px",
    backgroundPosition: "0 20px",
  } as React.CSSProperties;

  return (
    /* ── Capa vermelha aberta ── */
    <div
      className="relative h-full"
      style={{
        background: "linear-gradient(180deg,#a73c3c 0%,#8e2f2f 45%,#742020 100%)",
        padding: "14px",
        boxShadow: "0 36px 90px rgba(94,36,36,0.34)",
      }}
    >
      {/* Sombra no topo da capa */}
      <div className="absolute inset-x-[6%] top-3 h-5 rounded-full bg-black/15 blur-md pointer-events-none" />
      {/* Anel interno decorativo */}
      <div className="absolute inset-[8px] rounded-[28px] border border-[#c96f6f]/40 pointer-events-none" />
      {/* Brilho no topo */}
      <div className="absolute inset-x-10 top-4 h-7 rounded-full bg-white/10 blur-xl pointer-events-none" />

      {/* ── Páginas abertas ── */}
      <div
        className="relative h-full grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-[22px] overflow-hidden border border-[#692020]"
        style={{ background: "linear-gradient(180deg,#7f2626 0%,#6f1f1f 100%)" }}
      >
        {/* Dobra central — sombra */}
        <div
          className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 z-10 hidden lg:block"
          style={{
            width: "80px",
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.16) 38%, transparent 70%)",
          }}
        />
        {/* Dobra central — linha */}
        <div
          className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] z-10 hidden lg:block"
          style={{ background: "linear-gradient(180deg,#5a1717 0%,#8e2f2f 50%,#5a1717 100%)", opacity: 0.65 }}
        />

        {/* ════════════════ PÁGINA ESQUERDA — Perguntas ════════════════ */}
        <div
          className="relative flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-[#d9c9be]"
          style={{ background: "#fbf4eb", ...linedPaper }}
        >
          {/* Cabeçalho da página esquerda */}
          <div className="shrink-0 px-6 pt-5 pb-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff1e7] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a5a4f] shadow-sm">
              <span>✍️</span><span>Pergunte à Secretaria Virtual</span>
            </div>
            <h3 className="mt-3 text-[22px] font-black leading-tight text-[#4d2318]">Folha de pesquisa</h3>
            <p className="mt-1 text-[12px] text-[#7b5b4d] leading-5">
              Escreva sua dúvida — a resposta aparece na página ao lado.
            </p>
          </div>

          {/* Notas salvas */}
          {apiNotes.length > 0 && (
            <div className="shrink-0 flex gap-3 overflow-x-auto px-6 pb-3">
              {apiNotes.slice(0, 3).map((note: any, i) => (
                <div
                  key={note.id || i}
                  className="shrink-0 w-40 rounded-md bg-[#fff4a8] px-3 py-2.5 shadow-sm relative"
                  style={{
                    transform: `rotate(${(i % 2 === 0 ? -1.5 : 1.2) * (i * 0.3 + 0.4)}deg)`,
                    boxShadow: "0 8px 18px rgba(95,64,50,0.12)",
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-12 bg-[#f7dfcf] rounded-sm" />
                  <p className="text-[11px] leading-[17px] text-[#5a3828] line-clamp-3">{note.title || note.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Mensagens do usuário / sugestões */}
          <AnimatePresence mode="wait">
            <motion.div
              key={pageKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto px-6 pt-2 pb-2 min-h-0"
              ref={leftScrollRef}
            >
              {!temMensagens ? (
                <div className="pt-2">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#b07a6a] mb-2 font-semibold">
                    Sugestões para começar
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGESTOES.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        onClick={() => handleSend(s)}
                        className="rounded-full border border-[#d9bfb5] bg-white/80 px-3 py-1.5 text-[12px] text-[#5a3328] shadow-sm hover:border-[#8e2f2f] hover:bg-[#fff0eb] transition-colors text-left"
                      >
                        {s}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pb-2">
                  {userMsgs.map(msg => (
                    <MensagemUsuario key={msg.id} conteudo={msg.content} />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Campo de escrita */}
          <div className="shrink-0 px-5 pb-4 pt-2">
            {temMensagens && (
              <div className="mb-2 flex justify-end">
                <button
                  onClick={handleNewChat}
                  className="inline-flex items-center gap-1 rounded-full border border-[#d9bfb5] bg-white/80 px-3 py-1 text-[10px] text-[#8e2f2f] hover:bg-[#fff0eb] transition-colors"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Nova conversa
                </button>
              </div>
            )}
            <div className="flex items-end gap-2 rounded-2xl border border-[#dcc9bc] bg-white/80 px-3 py-2.5 shadow-sm backdrop-blur-sm">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Escreva sua pergunta aqui..."
                className="flex-1 resize-none text-[14px] text-[#3d2318] placeholder:text-[#c5a898] outline-none bg-transparent min-h-[34px] max-h-20"
                rows={1}
                disabled={isSending}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isSending}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-[#8e2f2f] text-white transition hover:bg-[#6e2020] disabled:opacity-40"
              >
                {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ════════════════ PÁGINA DIREITA — Respostas ════════════════ */}
        <div
          className="relative flex flex-col overflow-hidden"
          style={{ background: "#fffaf4", ...linedPaper }}
        >
          {/* Cabeçalho da página direita */}
          <div className="shrink-0 px-6 pt-5 pb-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f0f7ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#4a6d8e] shadow-sm">
              <Bot className="w-3 h-3" /><span>Respostas da Secretaria</span>
            </div>
            <h3 className="mt-3 text-[22px] font-black leading-tight text-[#4d2318]">Página de respostas</h3>
            <p className="mt-1 text-[12px] text-[#7b5b4d] leading-5">
              As orientações aparecem aqui, organizadas para você usar.
            </p>
          </div>

          {/* Respostas da IA */}
          <div
            className="flex-1 overflow-y-auto px-6 pt-2 pb-4 min-h-0"
            ref={rightScrollRef}
          >
            {!temMensagens ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-[#c5a898] pb-10">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                  style={{ background: "rgba(142,47,47,0.07)" }}
                >
                  📖
                </div>
                <p className="text-[13px] text-center leading-6 text-[#b09080]">
                  Escreva uma pergunta ao lado<br />e a resposta vai aparecer aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-4 pb-2">
                {aiMsgs.map(msg => (
                  <MensagemAssistente key={msg.id} conteudo={msg.content} onSaveNote={handleSaveNote} />
                ))}
                {isSending && <IndicadorDigitando />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EDITOR PANEL ─────────────────────────────────────────────────────────────

function EditorPanel() {
  const initialDoc = useMemo(() => { const d = createDoc("Ata de Reunião"); d.id = "ata-inicial"; return d; }, []);

  const [openDocs, setOpenDocs] = useState<OpenDoc[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.openDocs?.length) return parsed.openDocs;
      }
    } catch {}
    return [initialDoc];
  });

  const [activeDocId, setActiveDocId] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed?.activeDocId || initialDoc.id;
      }
    } catch {}
    return initialDoc.id;
  });

  const [saveStatus, setSaveStatus] = useState("Não salvo");
  const [activeGuideField, setActiveGuideField] = useState("titulo");
  const [isSaving, setIsSaving] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ openDocs, activeDocId }));
    } catch {}
  }, [openDocs, activeDocId]);

  const activeDoc = useMemo(() => openDocs.find(d => d.id === activeDocId) || openDocs[0], [openDocs, activeDocId]);
  const currentTemplate = activeDoc?.template || "Ata de Reunião";
  const currentData = activeDoc?.data || TEMPLATE_DEFAULTS["Ata de Reunião"];
  const currentTips = TEMPLATE_GUIDES[currentTemplate] || [];
  const filledCount = currentTips.filter(({ field }) => String(currentData[field] || "").trim()).length;

  const updateCurrentDoc = (updater: (doc: OpenDoc) => OpenDoc) => {
    setOpenDocs(prev => prev.map(doc => doc.id === activeDocId ? updater(doc) : doc));
  };

  const updateField = (field: string, value: string) => {
    updateCurrentDoc(doc => ({ ...doc, saved: false, data: { ...doc.data, [field]: value } }));
    setSaveStatus("Alterações não salvas");
    // autosave after 4s
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => handleSave(true), 4000);
  };

  const handleSelectTemplate = (template: TemplateName) => {
    const hasContent = activeDoc && Object.values(activeDoc.data).some(v => String(v || "").trim() !== "");
    if (activeDoc?.template !== template && hasContent) {
      if (!window.confirm("Trocar o modelo apaga o conteúdo atual. Deseja continuar?")) return;
    }
    updateCurrentDoc(doc => ({
      ...doc, template, title: template, saved: false, formats: {},
      data: JSON.parse(JSON.stringify(TEMPLATE_DEFAULTS[template])),
    }));
    setActiveGuideField(TEMPLATE_GUIDES[template]?.[0]?.field || "titulo");
    setSaveStatus("Novo modelo aberto");
  };

  const handleNewDocument = () => {
    const count = openDocs.filter(d => d.template === currentTemplate).length + 1;
    const newDoc = createDoc(currentTemplate, count > 1 ? String(count) : "");
    setOpenDocs(prev => [...prev, newDoc]);
    setActiveDocId(newDoc.id);
    setActiveGuideField(TEMPLATE_GUIDES[currentTemplate]?.[0]?.field || "titulo");
    setSaveStatus("Novo documento criado");
  };

  const handleOpenDocument = (docId: string) => {
    const doc = openDocs.find(d => d.id === docId);
    if (!doc) return;
    setActiveDocId(docId);
    setActiveGuideField(TEMPLATE_GUIDES[doc.template]?.[0]?.field || "titulo");
    setSaveStatus(doc.saved ? "Salvo" : "Alterações não salvas");
  };

  const handleCloseDocument = (docId: string) => {
    const target = openDocs.find(d => d.id === docId);
    const hasContent = target && Object.values(target.data).some(v => String(v || "").trim() !== "");
    if (target && !target.saved && hasContent) {
      if (!window.confirm("Documento com alterações não salvas. Fechar mesmo assim?")) return;
    }
    if (openDocs.length === 1) {
      const fresh = createDoc(currentTemplate);
      setOpenDocs([fresh]);
      setActiveDocId(fresh.id);
      setSaveStatus("Novo documento criado");
      return;
    }
    const remaining = openDocs.filter(d => d.id !== docId);
    setOpenDocs(remaining);
    if (activeDocId === docId) {
      setActiveDocId(remaining[0].id);
      setSaveStatus(remaining[0].saved ? "Salvo" : "Alterações não salvas");
    }
  };

  const handleSave = async (silent = false) => {
    if (!activeDoc) return;
    if (!silent) setIsSaving(true);
    try {
      const bodyHtml = docToHtml(activeDoc);
      if (activeDoc.apiId) {
        await fetch(`/api/caderno/documentos/${activeDoc.apiId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bodyHtml, headerData: activeDoc.data, title: activeDoc.title }),
        });
      } else {
        const res = await fetch("/api/caderno/documentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: templateToType(activeDoc.template), title: activeDoc.title }),
        });
        const data = await res.json();
        if (data.document?.id) {
          const apiId = data.document.id;
          await fetch(`/api/caderno/documentos/${apiId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bodyHtml, headerData: activeDoc.data, title: activeDoc.title }),
          });
          updateCurrentDoc(doc => ({ ...doc, apiId, saved: true }));
        }
      }
      updateCurrentDoc(doc => ({ ...doc, saved: true }));
      setSaveStatus(`Salvo às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    } catch {
      setSaveStatus("Erro ao salvar");
    } finally {
      if (!silent) setIsSaving(false);
    }
  };

  const handleRename = () => {
    const next = window.prompt("Novo nome do documento:", activeDoc?.title);
    if (!next?.trim()) return;
    updateCurrentDoc(doc => ({ ...doc, title: next.trim(), saved: false }));
    setSaveStatus("Nome alterado");
  };

  const handleDownload = () => {
    if (!activeDoc) return;
    const d = activeDoc.data;
    const guides = TEMPLATE_GUIDES[activeDoc.template] || [];
    const rows = guides.map(({ field, title }) =>
      d[field] ? `<p><strong>${title}:</strong> ${d[field].replace(/\n/g, "<br>")}</p>` : ""
    ).filter(Boolean).join("\n");
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${activeDoc.title}</title><style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;padding:20px;color:#333;line-height:1.7}h1{font-size:20px;text-align:center;margin-bottom:24px}p{margin:6px 0}</style></head><body><h1>${activeDoc.title}</h1>${rows}</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeDoc.title.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, "").replace(/\s+/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Inline field component
  const InlineField = ({ field, placeholder, multiline = false }: { field: string; placeholder: string; multiline?: boolean }) => {
    const baseClass = "rounded-xl border border-[#e6dad2] bg-[#fffaf6] px-3 py-2 text-[14px] text-[#5f4032] outline-none focus:border-[#caa798] focus:ring-2 focus:ring-[#ead2c4] transition w-full";
    const isActive = activeGuideField === field;

    if (multiline) {
      return (
        <textarea
          value={currentData[field] || ""}
          onChange={e => updateField(field, e.target.value)}
          onFocus={() => setActiveGuideField(field)}
          placeholder={placeholder}
          className={`${baseClass} mt-1 min-h-[100px] resize-y ${isActive ? "ring-2 ring-[#caa798]" : ""}`}
        />
      );
    }
    return (
      <input
        value={currentData[field] || ""}
        onChange={e => updateField(field, e.target.value)}
        onFocus={() => setActiveGuideField(field)}
        placeholder={placeholder}
        className={`${baseClass} mt-1 ${isActive ? "ring-2 ring-[#caa798]" : ""}`}
      />
    );
  };

  const renderFields = () => {
    switch (currentTemplate) {
      case "Ata de Reunião":
        return (
          <div className="space-y-4">
            <div><label className="field-label">Título</label><InlineField field="titulo" placeholder="Nome da ata..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Data</label><InlineField field="data" placeholder="dd/mm/aaaa" /></div>
              <div><label className="field-label">Horário</label><InlineField field="horario" placeholder="08h00 às 10h00" /></div>
            </div>
            <div><label className="field-label">Local</label><InlineField field="local" placeholder="Sala de reuniões..." /></div>
            <div><label className="field-label">Participantes</label><InlineField field="participantes" placeholder="Nome e função dos participantes..." multiline /></div>
            <div><label className="field-label">Pauta</label><InlineField field="pauta" placeholder="Assuntos tratados na reunião..." multiline /></div>
            <div><label className="field-label">Deliberações</label><InlineField field="deliberacoes" placeholder="Decisões tomadas..." multiline /></div>
            <div><label className="field-label">Encaminhamentos</label><InlineField field="encaminhamentos" placeholder="Próximos passos e responsáveis..." multiline /></div>
            <div><label className="field-label">Fechamento</label><InlineField field="fechamento" placeholder="Frase de encerramento..." /></div>
          </div>
        );
      case "Ofício":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Número</label><InlineField field="numero" placeholder="Ofício nº ____/2026" /></div>
              <div><label className="field-label">Data</label><InlineField field="data" placeholder="dd/mm/aaaa" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Destinatário</label><InlineField field="destinatario" placeholder="Nome completo..." /></div>
              <div><label className="field-label">Cargo</label><InlineField field="cargo" placeholder="Cargo do destinatário..." /></div>
            </div>
            <div><label className="field-label">Órgão</label><InlineField field="orgao" placeholder="Secretaria, escola..." /></div>
            <div><label className="field-label">Assunto</label><InlineField field="assunto" placeholder="Assunto do ofício..." /></div>
            <div><label className="field-label">Corpo do texto</label><InlineField field="corpo" placeholder="Texto do ofício..." multiline /></div>
            <div><label className="field-label">Encerramento</label><InlineField field="encerramento" placeholder="Atenciosamente," /></div>
            <div><label className="field-label">Assinatura</label><InlineField field="assinatura" placeholder="Nome e função..." /></div>
          </div>
        );
      case "Pesquisa de Preços":
        return (
          <div className="space-y-4">
            <div><label className="field-label">Objeto da compra</label><InlineField field="objeto" placeholder="O que será adquirido..." /></div>
            <div><label className="field-label">Descrição do item</label><InlineField field="item" placeholder="Descrição detalhada..." multiline /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Fornecedor 1</label><InlineField field="fornecedor1" placeholder="Nome ou CNPJ..." /></div>
              <div><label className="field-label">Valor 1</label><InlineField field="valor1" placeholder="R$ 0,00" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Fornecedor 2</label><InlineField field="fornecedor2" placeholder="Nome ou CNPJ..." /></div>
              <div><label className="field-label">Valor 2</label><InlineField field="valor2" placeholder="R$ 0,00" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Fornecedor 3</label><InlineField field="fornecedor3" placeholder="Nome ou CNPJ..." /></div>
              <div><label className="field-label">Valor 3</label><InlineField field="valor3" placeholder="R$ 0,00" /></div>
            </div>
            <div><label className="field-label">Justificativa da escolha</label><InlineField field="justificativa" placeholder="Por que este fornecedor foi escolhido..." multiline /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Responsável</label><InlineField field="responsavel" placeholder="Nome de quem pesquisou..." /></div>
              <div><label className="field-label">Data</label><InlineField field="data" placeholder="dd/mm/aaaa" /></div>
            </div>
          </div>
        );
      case "Relatório":
        return (
          <div className="space-y-4">
            <div><label className="field-label">Título</label><InlineField field="titulo" placeholder="Nome do relatório..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Período</label><InlineField field="periodo" placeholder="Jan–Dez 2025" /></div>
              <div><label className="field-label">Responsável</label><InlineField field="responsavel" placeholder="Nome e função..." /></div>
            </div>
            <div><label className="field-label">Objetivo</label><InlineField field="objetivo" placeholder="Propósito do relatório..." multiline /></div>
            <div><label className="field-label">Atividades realizadas</label><InlineField field="atividades" placeholder="O que foi feito no período..." multiline /></div>
            <div><label className="field-label">Resultados</label><InlineField field="resultados" placeholder="O que foi alcançado..." multiline /></div>
            <div><label className="field-label">Dificuldades</label><InlineField field="dificuldades" placeholder="Desafios encontrados..." multiline /></div>
            <div><label className="field-label">Encaminhamentos</label><InlineField field="encaminhamentos" placeholder="Próximos passos..." multiline /></div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full min-h-[600px]">

      {/* ── Left panel: templates + new doc ── */}
      <aside className="w-56 shrink-0 border-r border-[#e0cfc6] bg-[#faf5f0] flex flex-col p-4 gap-2 hidden md:flex">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#b07a6a] mb-1">Modelos</p>
        {TEMPLATES.map(t => (
          <button
            key={t.title}
            onClick={() => handleSelectTemplate(t.title)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all ${currentTemplate === t.title
              ? "bg-[#8e2f2f] text-white shadow-sm"
              : "text-[#7d5246] hover:bg-[#f0e8e2]"
              }`}
          >
            <span className={currentTemplate === t.title ? "text-white" : "text-[#8e2f2f]"}>{t.icon}</span>
            <div>
              <div className="leading-4">{t.title}</div>
              <div className={`text-[10px] ${currentTemplate === t.title ? "text-white/70" : "text-[#b07a6a]"}`}>{t.desc}</div>
            </div>
          </button>
        ))}

        <div className="mt-auto pt-4 border-t border-[#e0cfc6]">
          <button
            onClick={handleNewDocument}
            className="flex items-center gap-2 w-full rounded-xl border border-dashed border-[#c5a898] px-3 py-2.5 text-[12px] text-[#8e2f2f] hover:bg-[#fff0eb] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo documento
          </button>
        </div>
      </aside>

      {/* ── Center: chrome tabs + form editor ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chrome tabs */}
        <div className="flex items-center gap-0.5 border-b border-[#e0cfc6] bg-[#f3ece6] px-3 pt-2 overflow-x-auto">
          {openDocs.map(doc => (
            <div
              key={doc.id}
              onClick={() => handleOpenDocument(doc.id)}
              className={`group flex items-center gap-2 rounded-t-lg px-3 py-2 text-[12px] cursor-pointer shrink-0 transition-all border-b-2 ${doc.id === activeDocId
                ? "bg-white border-[#8e2f2f] text-[#5a3328] shadow-sm"
                : "border-transparent text-[#a07060] hover:bg-[#f8f0ea]"
                }`}
            >
              <span className="max-w-[140px] truncate font-medium">{doc.title}</span>
              {!doc.saved && <span className="w-1.5 h-1.5 rounded-full bg-[#8e2f2f]/60 shrink-0" />}
              <button
                onClick={e => { e.stopPropagation(); handleCloseDocument(doc.id); }}
                className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-[#f0e0d8] transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={handleNewDocument}
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-[#a07060] hover:bg-[#f0e0d8] hover:text-[#8e2f2f] transition-colors shrink-0"
            title="Novo documento"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Toolbar: title + actions */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#e0cfc6] bg-white">
          <button onDoubleClick={handleRename} className="flex-1 truncate text-[14px] font-semibold text-[#5a3328] text-left hover:text-[#8e2f2f] transition-colors" title="Duplo clique para renomear">
            {activeDoc?.title || "Documento"}
          </button>
          <span className="text-[11px] text-[#b07a6a] shrink-0">{saveStatus}</span>
          <button onClick={() => handleSave()} disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg bg-[#8e2f2f] px-3 py-1.5 text-[12px] text-white hover:bg-[#6e2020] transition-colors disabled:opacity-50 shrink-0"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Salvar
          </button>
          <button onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg border border-[#d9bfb5] px-3 py-1.5 text-[12px] text-[#7d5246] hover:bg-[#f0e8e2] transition-colors shrink-0"
          >
            <Download className="w-3 h-3" />
            Baixar
          </button>
        </div>

        {/* Form fields */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {renderFields()}
        </div>
      </div>

      {/* ── Right: guide panel with linguinhas ── */}
      <aside className="relative w-72 shrink-0 border-l border-[#e0cfc6] bg-[linear-gradient(180deg,#f8efe8_0%,#f5e8de_100%)] hidden lg:block">
        <div className="sticky top-0 p-5 overflow-y-auto max-h-screen">

          {/* Linguinhas laterais */}
          <div className="absolute -left-[88px] top-5 flex flex-col items-end gap-1.5">
            {currentTips.map(item => {
              const isFilled = String(currentData[item.field] || "").trim();
              const isActive = activeGuideField === item.field;
              return (
                <button
                  key={item.field}
                  onClick={() => setActiveGuideField(item.field)}
                  className={`relative flex h-9 w-24 items-center rounded-l-[10px] rounded-r-full border border-[#d7c7bb] px-2 text-[9px] font-bold uppercase tracking-[0.12em] shadow-sm transition-all overflow-hidden ${isActive ? "-translate-x-0 bg-[#8e2f2f] text-white" : isFilled ? "translate-x-2 bg-[#e9ddd2] text-[#6f4b3b] hover:translate-x-1" : "translate-x-2 bg-[#fff8f4] text-[#a15f49] hover:translate-x-1"}`}
                  title={item.title}
                >
                  <span className="truncate">{item.title}</span>
                  <span className={`absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-white shadow ${isFilled ? "bg-[#5da56d]" : "bg-[#d18b6c]"}`} />
                </button>
              );
            })}
          </div>

          {/* Progress card */}
          <div className="rounded-2xl border border-[#eadfd7] bg-white p-4 shadow-sm mb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#a38778]">Progresso</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#8e2f2f]">{filledCount}</span>
              <span className="text-sm text-[#a38778]">de {currentTips.length} campos</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#f0e5df] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#8e2f2f] transition-all"
                style={{ width: `${currentTips.length ? (filledCount / currentTips.length) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-[#a38778] leading-5">
              As linguinhas ao lado mostram pendências. Clique nelas para ver a dica do campo.
            </p>
          </div>

          {/* Tips list */}
          <div className="space-y-3">
            {currentTips.map((item, idx) => {
              const isFilled = String(currentData[item.field] || "").trim();
              const isActive = activeGuideField === item.field;
              return (
                <div
                  key={item.field}
                  onClick={() => setActiveGuideField(item.field)}
                  className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${isActive ? "border-[#8e2f2f] bg-white shadow-md" : isFilled ? "border-[#d7c7bb] bg-white" : "border-[#eadfd7] bg-[#fff8f4]"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f6ebe4] text-[10px] font-bold text-[#8e2f2f]">{idx + 1}</span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[#a38778] truncate">{item.title}</span>
                      </div>
                      <p className="text-[12px] leading-5 text-[#6c4e42]">{item.tip}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${isFilled ? "bg-[#e7f4ea] text-[#3d7a4e]" : "bg-[#f6e9df] text-[#a15f49]"}`}>
                      {isFilled ? "OK" : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}

// ─── HELPER ───────────────────────────────────────────────────────────────────

function templateToType(t: TemplateName): string {
  const map: Record<TemplateName, string> = {
    "Ata de Reunião": "ata", "Ofício": "oficio",
    "Pesquisa de Preços": "pesquisa", "Relatório": "relatorio",
  };
  return map[t] || "ata";
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Chat() {
  const [tab, setTab] = useState<"pesquisa" | "editor">("pesquisa");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg,#f5ede4 0%,#ede0d4 60%,#f5ede4 100%)" }}>

      {/* Subtle dot grid background */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(circle, #8e4a3a 1px, transparent 1px)", backgroundSize: "24px 24px" }}
      />

      <Navigation />

      <main className="relative z-10 flex-1 flex flex-col mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-6">

        {/* Header */}
        <header className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d8b8ad] bg-[#fff7f3]/90 px-4 py-1.5 shadow-sm mb-3">
            <span className="text-base">📕</span>
            <span className="text-[11px] tracking-[0.22em] uppercase text-[#9a5a4f]">Caderneta da Diretora</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#3d2318]">Caderno da Diretora</h1>
          <p className="mt-2 text-[15px] text-[#8b5a4d]">Pesquise orientações e monte documentos escolares com facilidade</p>

          {/* Tab switcher */}
          <div className="mt-5 inline-flex rounded-full border border-[#d9bfb5] bg-[#fff8f4] p-1 shadow-sm">
            <button
              onClick={() => setTab("pesquisa")}
              className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-semibold transition-colors ${tab === "pesquisa" ? "bg-[#8e2f2f] text-white shadow-sm" : "text-[#7d6153] hover:bg-[#f3ebe5]"}`}
            >
              <MessageCircle className="w-4 h-4" />
              Folha de Pesquisa
            </button>
            <button
              onClick={() => setTab("editor")}
              className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-semibold transition-colors ${tab === "editor" ? "bg-[#8e2f2f] text-white shadow-sm" : "text-[#7d6153] hover:bg-[#f3ebe5]"}`}
            >
              <PenTool className="w-4 h-4" />
              Editor de Documentos
            </button>
          </div>
        </header>

        {/* Content */}
        <AnimatePresence mode="wait">
          {tab === "pesquisa" ? (
            <motion.div key="pesquisa" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col rounded-3xl overflow-hidden"
            >
              <PesquisaPanel />
            </motion.div>
          ) : (
            <motion.div key="editor" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col rounded-3xl border border-[#e0cfc6] bg-white shadow-lg overflow-hidden"
              style={{ minHeight: 580 }}
            >
              <EditorPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #a38778;
          margin-bottom: 2px;
        }
      `}</style>
    </div>
  );
}
