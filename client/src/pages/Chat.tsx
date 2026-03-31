import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Send, Bot, User, Loader2, BookMarked, Bookmark,
  ChevronRight, ChevronLeft, ClipboardCopy, Plus, X, Download,
  FileText, Mail, Search, BarChart3, Bold, Italic,
  Underline, Highlighter, RefreshCw, MessageCircle, PenTool,
  BookOpen, Scale, ClipboardList, Paperclip, MapPin, Info,
  DollarSign, Landmark, Folder, School, Coins, Pin,
} from "@/components/Icons";

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
  "Como registrar uma ata de reunião?",
  "Quais são as regras de prestação de contas do PDDE?",
  "Quais documentos a escola precisa guardar?",
  "Como funciona a reunião do conselho escolar?",
];

const STORAGE_KEY = "caderno-diretora-v2";

const TRILHA_DESTAQUES: { id: string; title: string; sub: string; emoji: React.ReactNode; accent: string }[] = [
  { id: "U03", title: "Como funciona o PDDE", sub: "Regras, objetivos e funcionamento do programa", emoji: <BookOpen size={20} />, accent: "bg-[#fff1a8]" },
  { id: "U12", title: "Como planejar o uso dos recursos", sub: "Planejamento e priorização de compras", emoji: <ClipboardList size={20} />, accent: "bg-[#ffd9c8]" },
  { id: "U13", title: "O que pode ser pago com os recursos", sub: "Itens permitidos e vedados pelo PDDE", emoji: <DollarSign size={20} />, accent: "bg-[#d4f0d4]" },
  { id: "U16", title: "Como funciona a prestação de contas", sub: "Documentos e prazos obrigatórios", emoji: <BarChart3 size={20} />, accent: "bg-[#c8e0ff]" },
  { id: "U05", title: "O que é a unidade executora (UEx)", sub: "Organização e papel da UEx na escola", emoji: <Landmark size={20} />, accent: "bg-[#f9e4ff]" },
  { id: "U14", title: "Notas fiscais e comprovantes", sub: "Como guardar e organizar os documentos", emoji: <FileText size={20} />, accent: "bg-[#ffe4b2]" },
];

const LEGISLACAO_BASE: { emoji: React.ReactNode; titulo: string; desc: string; href: string }[] = [
  { emoji: <FileText size={18} />, titulo: "Lei nº 11.947/2009", desc: "Institui o PDDE e define as regras de execução financeira", href: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l11947.htm" },
  { emoji: <ClipboardList size={18} />, titulo: "Resolução FNDE nº 15/2021", desc: "Normas de execução do PDDE — compras, documentos e prestação de contas", href: "https://www.fnde.gov.br/index.php/legislacao/resolucoes/item/14304-resolucao-n-15-de-16-de-setembro-de-2021" },
  { emoji: <BookOpen size={18} />, titulo: "Manual de Execução do PDDE – FNDE", desc: "Orientações práticas para gestão dos recursos do PDDE", href: "https://www.fnde.gov.br/programas/pdde" },
  { emoji: <Scale size={18} />, titulo: "Lei nº 14.133/2021", desc: "Nova Lei de Licitações e Contratos Administrativos", href: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm" },
  { emoji: <FileText size={18} />, titulo: "Decreto nº 6.253/2007", desc: "Regulamenta o FUNDEB e o repasse de recursos às escolas", href: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2007/decreto/d6253.htm" },
];

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
  const marcadores = ["**Fontes:**", "Fontes:", "Fontes usadas:"];
  for (const m of marcadores) {
    const idx = conteudo.indexOf(m);
    if (idx > -1) return { corpo: conteudo.substring(0, idx).trim(), fontes: conteudo.substring(idx).trim() };
  }
  return { corpo: conteudo, fontes: null };
}

function parsePesquisaReply(conteudo: string): { corpo: string; fontes: string | null; paraSaberMais: string | null } {
  const saberMaisRe = /\n?---+\s*\n?(?:📚\s*)?\*{0,2}Para saber mais[^:]*:\*{0,2}/i;
  const saberMaisMatch = saberMaisRe.exec(conteudo);
  let textoBase = conteudo;
  let paraSaberMais: string | null = null;
  if (saberMaisMatch && saberMaisMatch.index !== undefined) {
    textoBase = conteudo.substring(0, saberMaisMatch.index).trim();
    paraSaberMais = conteudo.substring(saberMaisMatch.index + saberMaisMatch[0].length).trim();
  }
  const { corpo, fontes } = separarFontes(textoBase);
  return { corpo, fontes, paraSaberMais };
}

// ─── CHAT COMPONENTS ──────────────────────────────────────────────────────────

const mdLinkComponents = {
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
      className="text-[#8e2f2f] underline font-medium hover:text-[#6e2020]">
      {children}
    </a>
  ),
};

function MensagemAssistente({ conteudo, onSaveNote }: { conteudo: string; onSaveNote?: (text: string, sources: string | null) => void }) {
  const { corpo, fontes, paraSaberMais } = parsePesquisaReply(conteudo);
  const [fontesExpanded, setFontesExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start">
      <div className="mt-1 shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#8e2f2f]/10 text-[#8e2f2f]">
        <Bot className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 rounded-2xl bg-white border border-[#e8dad2] px-4 py-3 shadow-sm">
        <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 text-[14px] leading-7 text-[#3d2318]">
          <ReactMarkdown components={mdLinkComponents}>{corpo}</ReactMarkdown>
        </div>

        {/* Para saber mais */}
        {paraSaberMais && (
          <div className="mt-3 rounded-xl bg-[#fff8ee] border border-[#f0d9c4] px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8e6040] mb-1.5">
              <BookOpen className="w-3 h-3" /> Para saber mais
            </div>
            <div className="text-[12px] leading-[1.7] text-[#5f4032] prose prose-sm max-w-none prose-p:my-0">
              <ReactMarkdown components={mdLinkComponents}>{paraSaberMais}</ReactMarkdown>
            </div>
          </div>
        )}

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

// ── Card de resposta IA (página direita da caderneta) ────────────────────────
const CARD_EMOJIS: React.ReactNode[] = [
  <ClipboardList size={20} />, <BookOpen size={20} />, <FileText size={20} />,
  <BarChart3 size={20} />, <Info size={20} />, <Paperclip size={20} />,
  <Pin size={20} />, <Search size={20} />,
];
const CARD_ACCENTS = [
  "bg-[#fff1a8]", "bg-[#ffd9c8]", "bg-[#d4f0d4]",
  "bg-[#c8e0ff]", "bg-[#f9e4ff]", "bg-[#ffe4b2]",
];

function CardRespostaAI({
  msg, onSave, idx,
}: { msg: { id: number; content: string }; onSave: (t: string, s: string | null) => void; idx: number }) {
  const [saved, setSaved] = useState(false);
  const { corpo, fontes } = separarFontes(msg.content);
  const emoji = CARD_EMOJIS[idx % CARD_EMOJIS.length];
  const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
  const rotation = idx % 2 === 0 ? "rotate-[-0.5deg]" : "rotate-[0.4deg]";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className={`relative overflow-hidden rounded-[28px] border border-[#e4d7ce] bg-[#fffdf9] shadow-[0_16px_34px_rgba(95,64,50,0.10)] ${rotation}`}
    >
      {/* Cabeçalho do card */}
      <div className="border-b border-[#efe5dd] bg-[linear-gradient(180deg,#fffaf4_0%,#fffdf9_100%)] px-5 pt-5 pb-4">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] ${accent} text-xl shadow-sm`}>
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff08f] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#75591d]">
              <MapPin size={11} /> Secretaria Virtual
            </div>
            <div className="mt-3 text-[14px] leading-7 text-[#5f4032] prose prose-sm max-w-none">
              <ReactMarkdown>{corpo}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* Fontes */}
      {fontes && (
        <div className="px-5 py-4 border-t border-[#efe5dd] bg-[#fffaf6]">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#a38778] mb-2 flex items-center gap-1"><BookOpen size={10} /> Base legal</div>
          <div className="text-[13px] text-[#5f4032] leading-6">
            <ReactMarkdown>{fontes}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Ação */}
      <div className="px-5 pb-4 pt-3 flex items-center gap-3">
        <button
          onClick={() => { onSave(corpo, fontes); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e4d7ce] bg-[#fff8f3] px-3 py-1.5 text-[11px] text-[#8e2f2f] hover:bg-[#fff0eb] transition-colors shadow-sm"
        >
          <BookMarked className="w-3 h-3" />
          {saved ? "Nota salva!" : "Salvar nota"}
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(corpo)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e4d7ce] bg-[#fff8f3] px-3 py-1.5 text-[11px] text-[#8e2f2f] hover:bg-[#fff0eb] transition-colors shadow-sm"
        >
          <ClipboardCopy className="w-3 h-3" /> Copiar
        </button>
      </div>
    </motion.article>
  );
}

// ── Suggestions grid (cards estilo preview) ────────────────────────────────
const SUGESTAO_EMOJIS: React.ReactNode[] = [
  <Coins size={16} />, <FileText size={16} />, <FileText size={16} />,
  <Folder size={16} />, <School size={16} />, <BarChart3 size={16} />,
];
function SugestaoCard({ s, idx, onClick }: { s: string; idx: number; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
      onClick={onClick}
      className={`group rounded-[16px] border border-[#e4d7ce] bg-[#fffaf6] p-3 text-left shadow-sm hover:-translate-y-1 hover:shadow-md transition-all ${idx % 2 === 0 ? "rotate-[-0.5deg]" : "rotate-[0.4deg]"}`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff1a8] text-sm shadow-sm">
          {SUGESTAO_EMOJIS[idx % SUGESTAO_EMOJIS.length]}
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.16em] text-[#a38778] mb-0.5">Clique para usar</div>
          <span className="text-[12px] font-semibold text-[#5f4032] leading-[1.35]">{s}</span>
        </div>
      </div>
    </motion.button>
  );
}

// ── Sugestões contextuais para a página direita ───────────────────────────
function getSuggestionsFromConversation(msgs: { role: string; content: string }[]) {
  const txt = msgs.map(m => m.content).join(" ").toLowerCase();
  const trilha = TRILHA_DESTAQUES.filter(u => {
    if (u.id === "U03") return /pdde|programa|repasse|recurso|fnde/.test(txt);
    if (u.id === "U12") return /planeja|compra|uso|recurso|gastar/.test(txt);
    if (u.id === "U13") return /pagar|comprar|permitido|vedado|pode|gasto/.test(txt);
    if (u.id === "U16") return /prest|conta|documento|prazo|relatório|pc/.test(txt);
    if (u.id === "U05") return /uex|executora|conselho|reunião|ata|colegiado/.test(txt);
    if (u.id === "U14") return /nota fiscal|comprovante|guardar|documento/.test(txt);
    return false;
  });
  const leis = LEGISLACAO_BASE.filter(l => {
    if (/pdde|fnde|recurso|execução/.test(txt) && l.titulo.includes("11.947")) return true;
    if (/resolução|execução|compra/.test(txt) && l.titulo.includes("15/2021")) return true;
    if (/manual|orientação/.test(txt) && l.titulo.toLowerCase().includes("manual")) return true;
    if (/licitação|contrat|compra|fornecedor/.test(txt) && l.titulo.includes("14.133")) return true;
    if (/fundeb|repasse/.test(txt) && l.titulo.includes("6.253")) return true;
    return false;
  });
  return { trilha: trilha.slice(0, 3), leis: leis.slice(0, 3) };
}

// ── PesquisaPanel principal ───────────────────────────────────────────────
function PesquisaPanel() {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [msgs, setMsgs] = useState<{ id: number; role: string; content: string }[]>([]);
  const [apiNotes, setApiNotes] = useState<any[]>([]);
  const convScrollRef = useRef<HTMLDivElement>(null);
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  const sugestoes = settings?.chat_chips
    ? settings.chat_chips.split("\n").map(s => s.trim()).filter(Boolean)
    : SUGESTOES;

  useEffect(() => {
    fetch("/api/caderno/notas").then(r => r.json()).then(d => { if (d.ok) setApiNotes(d.notes || []); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (convScrollRef.current && (msgs.length > 0 || isSending)) {
      convScrollRef.current.scrollTop = convScrollRef.current.scrollHeight;
    }
  }, [msgs, isSending]);

  const handleSend = async (texto?: string) => {
    const msg = texto || input;
    if (!msg.trim() || isSending) return;
    setInput("");
    const userMsg = { id: Date.now(), role: "user", content: msg };
    setMsgs(prev => [...prev, userMsg]);
    setIsSending(true);
    try {
      const history = [...msgs, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/caderno/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (data.reply) {
        setMsgs(prev => [...prev, { id: Date.now() + 1, role: "assistant", content: data.reply }]);
      }
    } catch {
      setMsgs(prev => [...prev, { id: Date.now() + 1, role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente." }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleNewChat = () => {
    setMsgs([]);
    setInput("");
  };

  const handleSaveNote = async (text: string, sources: string | null) => {
    try {
      const res = await fetch("/api/caderno/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: text.substring(0, 60) + (text.length > 60 ? "..." : ""), content: text, sourceExcerpt: sources || undefined }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.ok) setApiNotes(prev => [d.note, ...prev]);
      }
    } catch {}
  };

  const temMensagens = msgs.length > 0;

  return (
    /* ════════════════════════════════════════════════════
       CADERNETA ABERTA — capa vermelha + duas páginas
    ════════════════════════════════════════════════════ */
    <div className="mx-auto w-full" style={{ maxWidth: 860 }}>
    <section
      className="relative overflow-hidden shadow-[0_28px_70px_rgba(80,18,18,0.48),0_6px_16px_rgba(80,18,18,0.20)]"
      style={{ borderRadius: 28, background: "linear-gradient(155deg,#c23535 0%,#8e2f2f 48%,#6a1e1e 100%)" }}
    >
      {/* Textura de linho na capa */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.055, backgroundImage: "repeating-linear-gradient(0deg,#000 0,#000 1px,transparent 1px,transparent 5px),repeating-linear-gradient(90deg,#000 0,#000 1px,transparent 1px,transparent 5px)" }} />
      {/* Borda interna */}
      <div className="absolute inset-[9px] pointer-events-none" style={{ borderRadius: 28, border: "1px solid rgba(220,110,110,0.28)" }} />
      {/* Reflexo no topo */}
      <div className="absolute inset-x-[12%] top-0 h-[2px] pointer-events-none" style={{ borderRadius: 999, background: "rgba(255,255,255,0.22)" }} />

      {/* ──────────────────────────────────────────────────
          PÁGINAS ABERTAS
      ────────────────────────────────────────────────── */}
      <div
        className="relative grid grid-cols-1 lg:grid-cols-2 mx-2"
        style={{ borderRadius: "18px 18px 0 0", overflow: "hidden" }}
      >
        {/* Dobra central (crease) */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 z-10 hidden lg:block"
          style={{ width: 40, background: "radial-gradient(ellipse at center,rgba(0,0,0,0.28) 0%,rgba(0,0,0,0.08) 45%,transparent 72%)" }} />
        <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 z-10 hidden lg:block"
          style={{ width: 2, background: "linear-gradient(180deg,rgba(55,10,10,0.75) 0%,rgba(100,28,28,0.38) 50%,rgba(55,10,10,0.75) 100%)" }} />

        {/* ══════════════════════════════════
            PÁGINA ESQUERDA
        ══════════════════════════════════ */}
        <div
          className="relative flex flex-col border-b lg:border-b-0 lg:border-r border-[#d8c4ae]"
          style={{ height: "clamp(540px, calc(100vh - 250px), 720px)", background: "#fdf5e8" }}
        >
          {/* ── Curvatura do papel ── */}
          {/* Topo e fundo escurecem levemente — papel dobra para fora */}
          <div className="pointer-events-none absolute inset-0 z-[5]"
            style={{ background: "linear-gradient(to bottom, rgba(140,80,40,0.09) 0%, transparent 22%, transparent 78%, rgba(140,80,40,0.09) 100%)" }} />
          {/* Lado da dobra (direita no desktop) fica ligeiramente mais escuro */}
          <div className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-20 hidden lg:block"
            style={{ background: "linear-gradient(to left, rgba(100,40,20,0.10) 0%, transparent 100%)" }} />

          <div className="relative z-10 flex flex-col" style={{ height: "100%" }}>

            {/* ── Cabeçalho fixo ── */}
            <div className="flex items-center px-7 pr-10 lg:pr-14 pt-6 pb-3 shrink-0 gap-2">
              <div className="flex-1 flex justify-center items-center gap-1.5 rounded-full px-3 py-1 font-bold uppercase text-[#8e2f2f]"
                style={{ background: "rgba(142,47,47,0.10)", fontSize: 10, letterSpacing: "0.20em" }}>
                <PenTool size={12} style={{display:'inline-block',verticalAlign:'middle'}} /> Folha de Pesquisa
              </div>
              {temMensagens && (
                <button onClick={handleNewChat}
                  className="flex-1 flex justify-center items-center gap-1 rounded-full border border-[#d9bfb5] bg-white/80 px-3 py-1 text-[#8e2f2f] hover:bg-[#fff0eb] transition-colors"
                  style={{ fontSize: 10 }}>
                  <RefreshCw className="w-3 h-3" /> Nova conversa
                </button>
              )}
            </div>

            {/* ── Área rolável de mensagens ── */}
            <div className="flex-1 overflow-y-auto px-7 pr-10 lg:pr-14 pb-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-[#f0e4d0] [&::-webkit-scrollbar-thumb]:bg-[#d4b896] [&::-webkit-scrollbar-thumb]:rounded-full" ref={convScrollRef}>
              {!temMensagens ? (
                /* Estado vazio: cards de sugestão */
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {sugestoes.map((s, i) => (
                    <SugestaoCard key={i} s={s} idx={i} onClick={() => handleSend(s)} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3 py-2">
                  {msgs.map(msg =>
                    msg.role === "user"
                      ? <MensagemUsuario key={msg.id} conteudo={msg.content} />
                      : <MensagemAssistente key={msg.id} conteudo={msg.content} onSaveNote={handleSaveNote} />
                  )}
                  {isSending && <IndicadorDigitando />}
                </div>
              )}
            </div>

            {/* ── Input fixo no fundo ── */}
            <div className="shrink-0 px-7 pr-10 lg:pr-14 pb-6 pt-2 border-t border-[#e8d8c8]">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Digite sua dúvida… (Enter para enviar)"
                  rows={2}
                  className="w-full resize-none outline-none placeholder:text-[#c5a898] text-[#5f4032]"
                  style={{
                    borderRadius: 16,
                    border: "1.5px solid #dcc8b8",
                    background: "rgba(255,255,255,0.90)",
                    padding: "12px 50px 12px 16px",
                    fontSize: 14,
                    boxShadow: "0 2px 10px rgba(95,64,50,0.08)",
                    lineHeight: "1.5",
                  }}
                  disabled={isSending}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isSending}
                  className="absolute bottom-2.5 right-2.5 flex items-center justify-center text-white transition-colors"
                  style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: input.trim() && !isSending ? "#8e2f2f" : "rgba(142,47,47,0.30)",
                    boxShadow: input.trim() ? "0 2px 8px rgba(80,18,18,0.25)" : "none",
                  }}
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════
            PÁGINA DIREITA — Contexto
        ══════════════════════════════════ */}
        <div
          className="relative flex flex-col"
          style={{ height: "clamp(540px, calc(100vh - 250px), 720px)", background: "#fffaf2" }}
        >
          {/* ── Curvatura do papel (espelhada) ── */}
          <div className="pointer-events-none absolute inset-0 z-[5]"
            style={{ background: "linear-gradient(to bottom, rgba(140,80,40,0.09) 0%, transparent 22%, transparent 78%, rgba(140,80,40,0.09) 100%)" }} />
          <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-20 hidden lg:block"
            style={{ background: "linear-gradient(to right, rgba(100,40,20,0.10) 0%, transparent 100%)" }} />

          <div className="relative z-10 flex-1 overflow-y-auto p-7 pl-10 lg:pl-14 pb-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-[#ede8dc] [&::-webkit-scrollbar-thumb]:bg-[#d0c4b0] [&::-webkit-scrollbar-thumb]:rounded-full">
            {!temMensagens ? (
              /* ── Estado vazio ── */
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="mb-4 opacity-30 flex justify-center"><BookOpen size={40} /></div>
                <p className="text-[#b09080] leading-6" style={{ fontSize: 13 }}>
                  Comece uma pesquisa ao lado e sugestões de leitura e legislação relevante aparecerão aqui.
                </p>
              </div>
            ) : (
              /* ── Conteúdo dinâmico baseado na conversa ── */
              (() => {
                const { trilha, leis } = getSuggestionsFromConversation(msgs);
                return (
                  <motion.div key={msgs.length} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                    {trilha.length > 0 && (
                      <div className="mb-6">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1e7] px-3 py-1 font-bold uppercase text-[#9a5a4f] mb-3"
                          style={{ fontSize: 10, letterSpacing: "0.20em" }}>
                          <BookOpen size={10} style={{display:'inline-block',verticalAlign:'middle'}} /> Leituras sugeridas
                        </div>
                        <div className="space-y-2">
                          {trilha.map(u => (
                            <a key={u.id} href={`/trilha?unit=${u.id}`}
                              className="group flex items-center gap-3 rounded-[16px] border border-[#ead8cc] bg-white/70 px-4 py-3 hover:bg-[#fff6f2] hover:border-[#e0bfb0] transition-all">
                              <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base"
                                style={{ background: u.accent + "33" }}>{u.emoji}</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold uppercase text-[#b07860]" style={{ fontSize: 10, letterSpacing: "0.12em" }}>Unidade {u.id}</div>
                                <div className="font-semibold text-[#5f4032] leading-5 truncate" style={{ fontSize: 12 }}>{u.title}</div>
                                <div className="text-[#9a7060]" style={{ fontSize: 11 }}>{u.sub}</div>
                              </div>
                              <div className="shrink-0 font-semibold uppercase text-[#8e2f2f] opacity-40 group-hover:opacity-100 transition-opacity" style={{ fontSize: 10 }}>Ver →</div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {leis.length > 0 && (
                      <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff8d6] px-3 py-1 font-bold uppercase text-[#75591d] mb-3"
                          style={{ fontSize: 10, letterSpacing: "0.18em" }}>
                          <Scale size={10} style={{display:'inline-block',verticalAlign:'middle'}} /> Base Legal
                        </div>
                        <div className="rounded-[16px] border border-dashed border-[#ddc8bc] bg-[#fffaf6] px-4 py-3 space-y-2">
                          {leis.map(lei => (
                            <a key={lei.titulo} href={lei.href} target="_blank" rel="noopener noreferrer"
                              className="group flex items-start gap-2.5 rounded-xl bg-white/60 px-3 py-2 hover:bg-[#fff0e8] hover:border hover:border-[#e8c8b8] transition-all">
                              <span className="text-sm shrink-0 mt-0.5 text-[#8e5a3a]">{lei.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[#5f4032] leading-5 group-hover:text-[#8e2f2f] transition-colors" style={{ fontSize: 12 }}>{lei.titulo}</div>
                                <div className="text-[#9a7060]" style={{ fontSize: 11 }}>{lei.desc}</div>
                              </div>
                              <span className="shrink-0 text-[10px] font-semibold text-[#8e2f2f] opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">Abrir →</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {trilha.length === 0 && leis.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                        <div className="mb-3 opacity-25"><Search size={28} /></div>
                        <p className="text-[#b09080]" style={{ fontSize: 12 }}>Continue pesquisando para ver sugestões relacionadas.</p>
                      </div>
                    )}
                  </motion.div>
                );
              })()
            )}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────
          BORDA INFERIOR — pilha de páginas
      ────────────────────────────────────────────────── */}
      <div className="relative mx-3 pointer-events-none" style={{ height: 20 }} aria-hidden>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="absolute left-0 right-0"
            style={{
              bottom: i * 3,
              height: 3,
              background: i % 2 === 0 ? "#f0e4d2" : "#e4d2bc",
              opacity: 1 - i * 0.12,
              borderRadius: i === 0 ? "0 0 8px 8px" : 2,
            }} />
        ))}
      </div>

      {/* Sombra interna na base */}
      <div className="pointer-events-none" style={{ height: 8, background: "linear-gradient(to bottom,rgba(80,18,18,0.18),transparent)" }} />
    </section>
    </div>
  );
}

// ─── EDITOR FIELD ─────────────────────────────────────────────────────────────

const BASE_FIELD_CLASS = "rounded-xl border border-[#e6dad2] bg-[#fffaf6] px-3 py-2 text-[14px] text-[#5f4032] outline-none focus:border-[#caa798] focus:ring-2 focus:ring-[#ead2c4] transition w-full";

function InlineField({
  field, placeholder, multiline = false,
  value, onChangeValue, activeField, onFocus,
}: {
  field: string; placeholder: string; multiline?: boolean;
  value: string; onChangeValue: (field: string, val: string) => void;
  activeField: string; onFocus: (field: string) => void;
}) {
  const isActive = activeField === field;
  const ringClass = isActive ? "ring-2 ring-[#caa798]" : "";
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={e => onChangeValue(field, e.target.value)}
        onFocus={() => onFocus(field)}
        placeholder={placeholder}
        className={`${BASE_FIELD_CLASS} mt-1 min-h-[100px] resize-y ${ringClass}`}
      />
    );
  }
  return (
    <input
      value={value}
      onChange={e => onChangeValue(field, e.target.value)}
      onFocus={() => onFocus(field)}
      placeholder={placeholder}
      className={`${BASE_FIELD_CLASS} mt-1 ${ringClass}`}
    />
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
  const [showTipsMobile, setShowTipsMobile] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rightTab, setRightTab] = useState<"guia" | "chat">("guia");
  const [expandedGuideField, setExpandedGuideField] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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
    setRenameValue(activeDoc?.title || "");
    setIsRenaming(true);
    setTimeout(() => renameInputRef.current?.select(), 30);
  };

  const handleRenameSubmit = () => {
    const next = renameValue.trim();
    if (next) {
      updateCurrentDoc(doc => ({ ...doc, title: next, saved: false }));
      setSaveStatus("Nome alterado");
    }
    setIsRenaming(false);
  };

  const buildPrintHtml = (doc: OpenDoc) => {
    const d = doc.data;
    const guides = TEMPLATE_GUIDES[doc.template] || [];
    const rows = guides.map(({ field, title }) =>
      d[field] ? `<div class="field"><span class="label">${title}</span><div class="value">${d[field].replace(/\n/g, "<br>")}</div></div>` : ""
    ).filter(Boolean).join("\n");
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${doc.title}</title>
<style>
  body{font-family:Arial,sans-serif;max-width:680px;margin:40px auto;padding:24px;color:#222;line-height:1.75;font-size:13px}
  h1{font-size:18px;text-align:center;margin-bottom:30px;font-weight:700;border-bottom:2px solid #8e2f2f;padding-bottom:10px;color:#3d2318}
  .field{margin-bottom:18px}
  .label{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#8e2f2f;margin-bottom:4px}
  .value{padding:8px 12px;border:1px solid #ddd;border-radius:6px;background:#fafafa;white-space:pre-wrap}
  @media print{body{margin:20px}h1{page-break-after:avoid}}
</style></head><body><h1>${doc.title}</h1>${rows}</body></html>`;
  };

  const handlePrint = () => {
    if (!activeDoc) return;
    const html = buildPrintHtml(activeDoc);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const handleDownload = () => {
    if (!activeDoc) return;
    const html = buildPrintHtml(activeDoc);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeDoc.title.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, "").replace(/\s+/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleChat = async (overrideMessage?: string) => {
    const text = (overrideMessage ?? chatInput).trim();
    if (!text || chatLoading) return;
    const userMsg = { role: "user" as const, content: text };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    setRightTab("chat");
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    try {
      const res = await fetch("/api/caderno/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          documentType: templateToType(currentTemplate),
          chatContext: "editor",
        }),
      });
      const data = await res.json();
      const reply = data.ok ? data.reply : (data.message || "Erro ao obter resposta.");
      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Erro de conexão. Tente novamente." }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const handleChatApplyToField = (content: string, field: string) => {
    const stripped = content.replace(/\*\*/g, "").replace(/^#+\s/gm, "").trim();
    updateField(field, stripped.slice(0, 2000));
  };

  // Ao focar um campo: marca como ativo E abre automaticamente a dica no guia
  const handleFieldFocus = useCallback((field: string) => {
    setActiveGuideField(field);
    setExpandedGuideField(field);
    setRightTab("guia");
  }, []);

  // renderFields usa InlineField (definido FORA do componente) diretamente,
  // passando os dados como props — sem nenhum componente-wrapper definido aqui dentro.
  const renderFields = () => {
    const fp = { onChangeValue: updateField, activeField: activeGuideField, onFocus: handleFieldFocus };
    const d = currentData;
    switch (currentTemplate) {
      case "Ata de Reunião":
        return (
          <div className="space-y-4">
            <div><label className="field-label">Título</label>
              <InlineField field="titulo" placeholder="Nome da ata..." value={d.titulo||""} {...fp} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="field-label">Data</label>
                <InlineField field="data" placeholder="dd/mm/aaaa" value={d.data||""} {...fp} /></div>
              <div><label className="field-label">Horário</label>
                <InlineField field="horario" placeholder="08h00 às 10h00" value={d.horario||""} {...fp} /></div>
            </div>
            <div><label className="field-label">Local</label>
              <InlineField field="local" placeholder="Sala de reuniões..." value={d.local||""} {...fp} /></div>
            <div><label className="field-label">Participantes</label>
              <InlineField field="participantes" placeholder="Nome e função dos participantes..." value={d.participantes||""} multiline {...fp} /></div>
            <div><label className="field-label">Pauta</label>
              <InlineField field="pauta" placeholder="Assuntos tratados na reunião..." value={d.pauta||""} multiline {...fp} /></div>
            <div><label className="field-label">Deliberações</label>
              <InlineField field="deliberacoes" placeholder="Decisões tomadas..." value={d.deliberacoes||""} multiline {...fp} /></div>
            <div><label className="field-label">Encaminhamentos</label>
              <InlineField field="encaminhamentos" placeholder="Próximos passos e responsáveis..." value={d.encaminhamentos||""} multiline {...fp} /></div>
            <div><label className="field-label">Fechamento</label>
              <InlineField field="fechamento" placeholder="Frase de encerramento..." value={d.fechamento||""} {...fp} /></div>
          </div>
        );
      case "Ofício":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="field-label">Número</label>
                <InlineField field="numero" placeholder="Ofício nº ____/2026" value={d.numero||""} {...fp} /></div>
              <div><label className="field-label">Data</label>
                <InlineField field="data" placeholder="dd/mm/aaaa" value={d.data||""} {...fp} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="field-label">Destinatário</label>
                <InlineField field="destinatario" placeholder="Nome completo..." value={d.destinatario||""} {...fp} /></div>
              <div><label className="field-label">Cargo</label>
                <InlineField field="cargo" placeholder="Cargo do destinatário..." value={d.cargo||""} {...fp} /></div>
            </div>
            <div><label className="field-label">Órgão</label>
              <InlineField field="orgao" placeholder="Secretaria, escola..." value={d.orgao||""} {...fp} /></div>
            <div><label className="field-label">Assunto</label>
              <InlineField field="assunto" placeholder="Assunto do ofício..." value={d.assunto||""} {...fp} /></div>
            <div><label className="field-label">Corpo do texto</label>
              <InlineField field="corpo" placeholder="Texto do ofício..." value={d.corpo||""} multiline {...fp} /></div>
            <div><label className="field-label">Encerramento</label>
              <InlineField field="encerramento" placeholder="Atenciosamente," value={d.encerramento||""} {...fp} /></div>
            <div><label className="field-label">Assinatura</label>
              <InlineField field="assinatura" placeholder="Nome e função..." value={d.assinatura||""} {...fp} /></div>
          </div>
        );
      case "Pesquisa de Preços":
        return (
          <div className="space-y-4">
            <div><label className="field-label">Objeto da compra</label>
              <InlineField field="objeto" placeholder="O que será adquirido..." value={d.objeto||""} {...fp} /></div>
            <div><label className="field-label">Descrição do item</label>
              <InlineField field="item" placeholder="Descrição detalhada..." value={d.item||""} multiline {...fp} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="field-label">Fornecedor 1</label>
                <InlineField field="fornecedor1" placeholder="Nome ou CNPJ..." value={d.fornecedor1||""} {...fp} /></div>
              <div><label className="field-label">Valor 1</label>
                <InlineField field="valor1" placeholder="R$ 0,00" value={d.valor1||""} {...fp} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="field-label">Fornecedor 2</label>
                <InlineField field="fornecedor2" placeholder="Nome ou CNPJ..." value={d.fornecedor2||""} {...fp} /></div>
              <div><label className="field-label">Valor 2</label>
                <InlineField field="valor2" placeholder="R$ 0,00" value={d.valor2||""} {...fp} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="field-label">Fornecedor 3</label>
                <InlineField field="fornecedor3" placeholder="Nome ou CNPJ..." value={d.fornecedor3||""} {...fp} /></div>
              <div><label className="field-label">Valor 3</label>
                <InlineField field="valor3" placeholder="R$ 0,00" value={d.valor3||""} {...fp} /></div>
            </div>
            <div><label className="field-label">Justificativa da escolha</label>
              <InlineField field="justificativa" placeholder="Por que este fornecedor foi escolhido..." value={d.justificativa||""} multiline {...fp} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="field-label">Responsável</label>
                <InlineField field="responsavel" placeholder="Nome de quem pesquisou..." value={d.responsavel||""} {...fp} /></div>
              <div><label className="field-label">Data</label>
                <InlineField field="data" placeholder="dd/mm/aaaa" value={d.data||""} {...fp} /></div>
            </div>
          </div>
        );
      case "Relatório":
        return (
          <div className="space-y-4">
            <div><label className="field-label">Título</label>
              <InlineField field="titulo" placeholder="Nome do relatório..." value={d.titulo||""} {...fp} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="field-label">Período</label>
                <InlineField field="periodo" placeholder="Jan–Dez 2025" value={d.periodo||""} {...fp} /></div>
              <div><label className="field-label">Responsável</label>
                <InlineField field="responsavel" placeholder="Nome e função..." value={d.responsavel||""} {...fp} /></div>
            </div>
            <div><label className="field-label">Objetivo</label>
              <InlineField field="objetivo" placeholder="Propósito do relatório..." value={d.objetivo||""} multiline {...fp} /></div>
            <div><label className="field-label">Atividades realizadas</label>
              <InlineField field="atividades" placeholder="O que foi feito no período..." value={d.atividades||""} multiline {...fp} /></div>
            <div><label className="field-label">Resultados</label>
              <InlineField field="resultados" placeholder="O que foi alcançado..." value={d.resultados||""} multiline {...fp} /></div>
            <div><label className="field-label">Dificuldades</label>
              <InlineField field="dificuldades" placeholder="Desafios encontrados..." value={d.dificuldades||""} multiline {...fp} /></div>
            <div><label className="field-label">Encaminhamentos</label>
              <InlineField field="encaminhamentos" placeholder="Próximos passos..." value={d.encaminhamentos||""} multiline {...fp} /></div>
          </div>
        );
    }
  };

  const templateLabel = currentTemplate;

  const toggleGuideField = (field: string) => {
    setExpandedGuideField(prev => prev === field ? null : field);
    setActiveGuideField(field);
  };

  return (
    <div className="flex h-full min-h-[600px]">

      {/* ── Left panel: modelos ── */}
      <aside className="w-52 shrink-0 border-r border-[#e0cfc6] bg-[#faf5f0] flex flex-col hidden md:flex">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#b07a6a] font-bold mb-3">Tipo de documento</p>
          <div className="flex flex-col gap-1.5">
            {TEMPLATES.map(t => (
              <button
                key={t.title}
                onClick={() => handleSelectTemplate(t.title)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                  currentTemplate === t.title
                    ? "bg-[#8e2f2f] text-white shadow-sm"
                    : "text-[#7d5246] hover:bg-[#f0e8e2]"
                }`}
              >
                <span className={`shrink-0 ${currentTemplate === t.title ? "text-white" : "text-[#8e2f2f]"}`}>{t.icon}</span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold leading-tight truncate">{t.title}</div>
                  <div className={`text-[10px] mt-0.5 ${currentTemplate === t.title ? "text-white/70" : "text-[#b07a6a]"}`}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Documentos abertos */}
        {openDocs.length > 1 && (
          <div className="px-4 pt-4 border-t border-[#e0cfc6] mt-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#b07a6a] font-bold mb-2">Abertos</p>
            <div className="flex flex-col gap-1">
              {openDocs.map(doc => (
                <div
                  key={doc.id}
                  className={`group flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer transition-all ${
                    doc.id === activeDocId ? "bg-[#8e2f2f]/10 text-[#8e2f2f]" : "text-[#7d5246] hover:bg-[#f0e8e2]"
                  }`}
                  onClick={() => handleOpenDocument(doc.id)}
                >
                  <span className="flex-1 text-[11px] font-medium truncate">{doc.title}</span>
                  {!doc.saved && <span className="w-1.5 h-1.5 rounded-full bg-[#8e2f2f]/50 shrink-0" />}
                  <button
                    onClick={e => { e.stopPropagation(); handleCloseDocument(doc.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#f0d8d0]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto p-4 border-t border-[#e0cfc6]">
          <button
            onClick={handleNewDocument}
            className="flex items-center gap-2 w-full rounded-xl border border-dashed border-[#c5a898] px-3 py-2.5 text-[12px] font-medium text-[#8e2f2f] hover:bg-[#fff0eb] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo documento
          </button>
        </div>
      </aside>

      {/* ── Center: editor ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Toolbar principal */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e0cfc6] bg-white">
          {/* Título / rename inline */}
          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={e => { if (e.key === "Enter") handleRenameSubmit(); if (e.key === "Escape") setIsRenaming(false); }}
              className="flex-1 min-w-0 text-[14px] font-semibold text-[#5a3328] border border-[#c5a898] rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-[#ead2c4]"
            />
          ) : (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-[14px] font-semibold text-[#3d2318] truncate">{activeDoc?.title || "Documento"}</span>
              <button
                onClick={handleRename}
                className="shrink-0 p-1 rounded-md text-[#b07a6a] hover:text-[#8e2f2f] hover:bg-[#f0e8e2] transition-colors"
                title="Renomear documento"
              >
                <PenTool className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Status de salvamento */}
          <span className={`text-[11px] shrink-0 font-medium ${saveStatus.startsWith("Salvo") ? "text-[#5da56d]" : saveStatus.includes("Erro") ? "text-red-500" : "text-[#b07a6a]"}`}>
            {saveStatus}
          </span>

          {/* Botão Guia — mobile */}
          <button onClick={() => setShowTipsMobile(true)}
            className="lg:hidden flex items-center gap-1.5 rounded-lg border border-[#d9bfb5] px-3 py-1.5 text-[12px] text-[#8e2f2f] hover:bg-[#fff0eb] transition-colors shrink-0"
          >
            <Info size={12} /> Guia
          </button>

          {/* Prévia */}
          <button
            onClick={() => setShowPreview(v => !v)}
            className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors shrink-0 ${
              showPreview ? "bg-[#8e2f2f]/10 border-[#8e2f2f]/30 text-[#8e2f2f]" : "border-[#d9bfb5] text-[#7d5246] hover:bg-[#f0e8e2]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {showPreview ? "Editar" : "Prévia"}
          </button>

          {/* Imprimir */}
          <button onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[#d9bfb5] px-3 py-1.5 text-[12px] font-medium text-[#7d5246] hover:bg-[#f0e8e2] transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Imprimir / PDF
          </button>

          {/* Salvar */}
          <button onClick={() => handleSave()} disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg bg-[#8e2f2f] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#6e2020] transition-colors disabled:opacity-50 shrink-0"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Salvar
          </button>
        </div>

        {/* Barra de progresso + abas de documento (mobile) */}
        {openDocs.length > 1 && (
          <div className="flex items-center gap-0.5 border-b border-[#e0cfc6] bg-[#f3ece6] px-3 pt-1.5 overflow-x-auto md:hidden">
            {openDocs.map(doc => (
              <div
                key={doc.id}
                onClick={() => handleOpenDocument(doc.id)}
                className={`group flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-[11px] cursor-pointer shrink-0 transition-all border-b-2 ${
                  doc.id === activeDocId ? "bg-white border-[#8e2f2f] text-[#5a3328]" : "border-transparent text-[#a07060] hover:bg-[#f8f0ea]"
                }`}
              >
                <span className="max-w-[120px] truncate font-medium">{doc.title}</span>
                {!doc.saved && <span className="w-1 h-1 rounded-full bg-[#8e2f2f]/60" />}
              </div>
            ))}
          </div>
        )}

        {/* Barra de progresso */}
        <div className="flex items-center gap-3 px-4 py-2 bg-[#fdf8f4] border-b border-[#f0e5df]">
          <span className="text-[11px] text-[#a38778] font-medium shrink-0">
            {filledCount} de {currentTips.length} campos preenchidos
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-[#f0e5df] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#8e2f2f] transition-all duration-500"
              style={{ width: `${currentTips.length ? (filledCount / currentTips.length) * 100 : 0}%` }}
            />
          </div>
          {filledCount === currentTips.length && (
            <span className="text-[11px] text-[#5da56d] font-bold shrink-0">✓ Completo</span>
          )}
        </div>

        {/* Área de conteúdo: edição ou prévia */}
        <div className="flex-1 overflow-y-auto">
          {showPreview ? (
            <div className="p-6">
              <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#e0cfc6] shadow-sm p-8">
                <h2 className="text-[18px] font-bold text-[#3d2318] text-center mb-6 pb-4 border-b-2 border-[#8e2f2f]">{activeDoc?.title}</h2>
                {(TEMPLATE_GUIDES[currentTemplate] || []).map(({ field, title }) => {
                  const val = currentData[field];
                  if (!val?.trim()) return null;
                  return (
                    <div key={field} className="mb-5">
                      <span className="block text-[10px] font-bold uppercase tracking-[.12em] text-[#8e2f2f] mb-1">{title}</span>
                      <p className="text-[13px] text-[#3d2318] leading-relaxed whitespace-pre-wrap border border-[#ede5db] rounded-lg px-3 py-2 bg-[#fdfaf7]">{val}</p>
                    </div>
                  );
                })}
                {filledCount === 0 && (
                  <p className="text-center text-[#b07a6a] text-[13px]">Preencha os campos ao lado para ver a prévia aqui.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="px-5 py-5">
              {renderFields()}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: guia + chat ── */}
      <aside className="w-[290px] shrink-0 border-l border-[#e0cfc6] hidden lg:flex flex-col">

        {/* Tabs */}
        <div className="flex border-b border-[#e0cfc6] bg-[#ede5db]">
          {(["guia", "chat"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setRightTab(tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
                rightTab === tab ? "border-[#8e2f2f] text-[#8e2f2f] bg-[#faf4ee]" : "border-transparent text-[#a07060] hover:text-[#8e2f2f]"
              }`}
            >
              {tab === "guia" ? <><Info size={13} /> Guia</> : <><MessageCircle size={13} /> Chat IA{chatMessages.length > 0 && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#8e2f2f]" />}</>}
            </button>
          ))}
        </div>

        {/* ── Guia ── */}
        {rightTab === "guia" && (
          <div className="flex-1 overflow-y-auto" style={{ background: "#faf4ee" }}>
            <div className="p-3 space-y-1.5">
              {currentTips.map((item, idx) => {
                const isFilled = !!String(currentData[item.field] || "").trim();
                const isExpanded = expandedGuideField === item.field;
                const isActive = activeGuideField === item.field;

                return (
                  <div key={item.field}>
                    <button
                      onClick={() => toggleGuideField(item.field)}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                        isActive
                          ? "bg-[#8e2f2f]/8 border border-[#d7c7bb] shadow-sm bg-white"
                          : "hover:bg-white/70 border border-transparent"
                      }`}
                    >
                      {/* Número */}
                      <span className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                        isFilled ? "bg-[#5da56d] text-white" : "bg-[#e8d8d0] text-[#8e2f2f]"
                      }`}>
                        {isFilled ? "✓" : idx + 1}
                      </span>
                      {/* Label */}
                      <span className={`flex-1 text-[13px] font-semibold ${isActive ? "text-[#3d2318]" : "text-[#5f4032]"}`}>
                        {item.title}
                      </span>
                      {/* Status badge */}
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isFilled ? "bg-[#e7f4ea] text-[#3d7a4e]" : "bg-[#f6e9df] text-[#a15f49]"
                      }`}>
                        {isFilled ? "OK" : "vazio"}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 text-[#b07a6a] shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>

                    {/* Dica expandida */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="mx-2 mb-1 rounded-b-xl rounded-t-sm border border-t-0 border-[#d7c7bb] bg-white px-4 py-3"
                      >
                        <p className="text-[12px] text-[#5f4032] leading-relaxed">{item.tip}</p>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Ações rápidas no rodapé do guia */}
            <div className="p-3 border-t border-[#e0cfc6] mt-2 space-y-2">
              <button
                onClick={handlePrint}
                className="w-full flex items-center gap-2 justify-center rounded-xl border border-[#d9bfb5] py-2.5 text-[12px] font-semibold text-[#7d5246] hover:bg-[#f0e8e2] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Imprimir / salvar como PDF
              </button>
              <button
                onClick={() => setRightTab("chat")}
                className="w-full flex items-center gap-2 justify-center rounded-xl border border-[#d9bfb5] py-2.5 text-[12px] font-semibold text-[#8e2f2f] hover:bg-[#fff0eb] transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Pedir ajuda à IA
              </button>
            </div>
          </div>
        )}

        {/* ── Chat IA ── */}
        {rightTab === "chat" && (
          <div className="flex flex-col flex-1 min-h-0" style={{ background: "#faf4ee" }}>
            {chatMessages.length === 0 ? (
              <div className="flex-1 overflow-y-auto p-3">
                <p className="text-[11px] text-[#a07060] font-semibold uppercase tracking-wider mb-2">Sugestões para este documento</p>
                <div className="space-y-2">
                  {[
                    `Gere um rascunho completo de ${templateLabel.toLowerCase()}`,
                    `Quais são os requisitos legais para ${templateLabel.toLowerCase()}?`,
                    "Como deve ser o fecho e assinatura deste documento?",
                    "Revise a gramática deste texto: [cole aqui]",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleChat(s)}
                      disabled={chatLoading}
                      className="w-full text-left text-[12px] text-[#5f4032] bg-white border border-[#d9bfb5] rounded-xl px-3 py-2.5 hover:bg-[#fff0eb] hover:border-[#c5a898] transition-colors leading-snug"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${msg.role === "user" ? "bg-[#8e2f2f]" : "bg-[#a07060]"}`}>
                      {msg.role === "user" ? "D" : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`rounded-2xl px-3 py-2.5 text-[12px] leading-relaxed max-w-[200px] ${msg.role === "user" ? "bg-[#8e2f2f] text-white" : "bg-white border border-[#d9bfb5] text-[#3d2318]"}`}>
                      {msg.role === "assistant" ? (
                        <>
                          <div className="prose prose-xs max-w-none prose-p:my-0.5 prose-ul:my-0.5 text-[#3d2318]">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                          {activeGuideField && (
                            <button
                              onClick={() => handleChatApplyToField(msg.content, activeGuideField)}
                              className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#8e2f2f]/10 border border-[#8e2f2f]/20 px-2.5 py-1.5 text-[11px] font-semibold text-[#8e2f2f] hover:bg-[#8e2f2f]/20 transition-colors w-full justify-center"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Inserir no campo "{currentTips.find(t => t.field === activeGuideField)?.title || activeGuideField}"
                            </button>
                          )}
                        </>
                      ) : msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2 items-start">
                    <div className="shrink-0 w-7 h-7 rounded-full bg-[#a07060] flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-[#d9bfb5] rounded-2xl px-3 py-2.5 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#a07060]" />
                      <span className="text-[11px] text-[#a07060]">Pensando…</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
            )}
            <div className="p-3 border-t border-[#e0cfc6] bg-white/70">
              {chatMessages.length > 0 && (
                <button
                  onClick={() => setChatMessages([])}
                  className="text-[11px] text-[#a07060] hover:text-[#8e2f2f] mb-2 flex items-center gap-1 font-medium transition-colors"
                >
                  <X className="w-3 h-3" />
                  Nova conversa
                </button>
              )}
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                  placeholder="Pergunte à IA sobre este documento…"
                  disabled={chatLoading}
                  className="flex-1 text-[12px] border border-[#d9bfb5] rounded-xl px-3 py-2 bg-white text-[#5f4032] placeholder:text-[#c0a090] focus:outline-none focus:border-[#c5a898] focus:ring-1 focus:ring-[#ead2c4]"
                />
                <button
                  onClick={() => handleChat()}
                  disabled={chatLoading || !chatInput.trim()}
                  className="w-9 h-9 rounded-xl bg-[#8e2f2f] hover:bg-[#6e2020] text-white flex items-center justify-center disabled:opacity-40 transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

      </aside>

      {/* ── Mobile Guia bottom sheet ── */}
      {showTipsMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTipsMobile(false)} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="relative z-10 rounded-t-2xl overflow-hidden flex flex-col"
            style={{ background: "#faf4ee", maxHeight: "75vh" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#e0cfc6] bg-[#ede5db]">
              <span className="text-[13px] font-bold text-[#5a3328] flex items-center gap-2"><Info size={14} /> Guia de preenchimento</span>
              <button onClick={() => setShowTipsMobile(false)} className="rounded-full p-1.5 hover:bg-[#d9cec6] text-[#7d5246] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-3 py-3 space-y-1.5">
              {currentTips.map((item, idx) => {
                const isFilled = !!String(currentData[item.field] || "").trim();
                const isActive = activeGuideField === item.field;
                return (
                  <button
                    key={item.field}
                    onClick={() => { setActiveGuideField(item.field); setShowTipsMobile(false); }}
                    className={`w-full text-left rounded-xl border px-4 py-3 flex items-start gap-3 transition-all ${
                      isActive ? "border-[#c5a08a] bg-white shadow-md" : "border-[#d9cec6] bg-[#f5ede7] hover:bg-white"
                    }`}
                  >
                    <span className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black mt-0.5 ${
                      isFilled ? "bg-[#5da56d] text-white" : "bg-[#e8d8d0] text-[#8e2f2f]"
                    }`}>
                      {isFilled ? "✓" : idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-[#5a3328]">{item.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isFilled ? "bg-[#e7f4ea] text-[#3d7a4e]" : "bg-[#f6e9df] text-[#a15f49]"}`}>
                          {isFilled ? "OK" : "vazio"}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#7d5246] leading-relaxed">{item.tip}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
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
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg,#f5ede4 0%,#ede0d4 60%,#f5ede4 100%)" }}>

      {/* Subtle dot grid background */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(circle, #8e4a3a 1px, transparent 1px)", backgroundSize: "24px 24px" }}
      />

      <Navigation />

      <main className="relative z-10 flex-1 flex flex-col mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-6 pb-16">

        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-[#3d2318]">{settings?.chat_titulo || "Caderno da Diretora"}</h1>
          <p className="mt-2 text-[15px] text-[#8b5a4d]">{settings?.chat_subtitulo || "Pesquise orientações e monte documentos escolares com facilidade"}</p>

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
            <motion.div key="pesquisa" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
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
      <Footer />
    </div>
  );
}
