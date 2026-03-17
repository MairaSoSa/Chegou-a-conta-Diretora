import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays, Newspaper, Pin, BellRing, BadgeAlert, BookOpenCheck,
  FileText, CircleDollarSign, BusFront, Apple, GraduationCap,
  Search, Sparkles, CheckCircle2, Clock3,
  X, Loader2, RefreshCw, AlertTriangle, AlertCircle,
  ExternalLink, Landmark, BookOpen,
} from "lucide-react";

interface PrazoEducacional {
  titulo: string;
  descricao: string;
  dataInicio?: string;
  dataFim?: string;
  mes: number;
  categoria: string;
  fonte: string;
  urgencia: "alta" | "media" | "baixa";
  url?: string;
  aConfirmar?: boolean;
}

interface NoticiaEducacao {
  titulo: string;
  url: string;
  data: string;
  fonte: "MEC" | "FNDE" | "INEP";
  categoria?: string;
  resumo?: string;
}

const MONTH_LABELS = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
const MONTH_FULL   = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAY_LABELS = ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"];

const categoryStyles: Record<string, { tone: string; line: string; wash: string; icon: any }> = {
  PDDE:        { tone: "bg-sky-100 text-sky-700 border-sky-200",         line: "border-l-sky-300",      wash: "from-sky-50 to-white",      icon: CircleDollarSign },
  PNAE:        { tone: "bg-emerald-100 text-emerald-700 border-emerald-200", line: "border-l-emerald-300", wash: "from-emerald-50 to-white",  icon: Apple },
  PNATE:       { tone: "bg-amber-100 text-amber-700 border-amber-200",   line: "border-l-amber-300",    wash: "from-amber-50 to-white",    icon: BusFront },
  FUNDEB:      { tone: "bg-violet-100 text-violet-700 border-violet-200", line: "border-l-violet-300",  wash: "from-violet-50 to-white",   icon: BookOpenCheck },
  CENSO:       { tone: "bg-pink-100 text-pink-700 border-pink-200",      line: "border-l-pink-300",     wash: "from-pink-50 to-white",     icon: FileText },
  SAEB:        { tone: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200", line: "border-l-fuchsia-300", wash: "from-fuchsia-50 to-white", icon: GraduationCap },
  "PRESTAÇÃO": { tone: "bg-orange-100 text-orange-700 border-orange-200", line: "border-l-orange-300", wash: "from-orange-50 to-white",   icon: FileText },
  PLANEJAMENTO:{ tone: "bg-teal-100 text-teal-700 border-teal-200",      line: "border-l-teal-300",     wash: "from-teal-50 to-white",     icon: CalendarDays },
  GERAL:       { tone: "bg-stone-100 text-stone-700 border-stone-200",   line: "border-l-stone-300",    wash: "from-stone-50 to-white",    icon: Pin },
};

const urgencyStyles: Record<string, string> = {
  Urgente:     "text-rose-600 bg-rose-50 border-rose-200",
  Atenção:     "text-amber-700 bg-amber-50 border-amber-200",
  Informativo: "text-emerald-700 bg-emerald-50 border-emerald-200",
};

function mapUrgencia(u: string): "Urgente" | "Atenção" | "Informativo" {
  if (u === "alta") return "Urgente";
  if (u === "media") return "Atenção";
  return "Informativo";
}

function extractDay(dataInicio?: string, dataFim?: string): number | null {
  if (dataInicio) {
    const d = new Date(dataInicio + "T12:00:00");
    if (!isNaN(d.getTime())) return d.getDate();
  }
  if (dataFim) {
    const d = new Date(dataFim + "T12:00:00");
    if (!isNaN(d.getTime())) return d.getDate();
  }
  return null;
}

function Tape({ rotate = "rotate-[-6deg]", className = "" }: { rotate?: string; className?: string }) {
  return (
    <div
      className={`absolute h-8 w-24 ${rotate} rounded-sm border border-white/40 bg-[#efe4b2]/75 backdrop-blur-[1px] shadow-sm ${className}`}
      style={{ backgroundImage: "repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0px,rgba(255,255,255,.18) 2px,transparent 2px,transparent 6px)" }}
    />
  );
}

function HandDrawnPin({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-7 w-7 ${className}`}>
      <div className="absolute left-1/2 top-0 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-[#a35d4f] bg-[#d98676] shadow-sm" />
      <div className="absolute left-1/2 top-3 h-3.5 w-[2px] -translate-x-1/2 rotate-6 rounded-full bg-[#7f6559]" />
      <div className="absolute left-1/2 top-[18px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-[#7f6559]" />
    </div>
  );
}

function HandDrawnStar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
      <path d="M18 4L21 13L31 13L23 19L26 30L18 23L10 30L13 19L5 13L15 13L18 4Z"
        stroke="#b97f2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#f6dd75" />
    </svg>
  );
}

function ScribbleLoop({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 24" className={className} fill="none" aria-hidden="true">
      <path d="M4 15C18 8 33 8 47 13C61 18 77 19 92 12C101 8 110 8 116 12"
        stroke="#8f877d" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 6" />
    </svg>
  );
}

function IrregularCalendarCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-[3px] rounded-[28px] border border-[#e5dbc9] opacity-60" />
      <div className="absolute inset-0 rounded-[30px] border-2 border-[#d8cbb8] opacity-70"
        style={{ clipPath: "polygon(2% 4%,97% 2%,99% 18%,97% 51%,100% 96%,4% 99%,1% 79%,3% 28%)" }} />
      <div className="relative overflow-hidden rounded-[30px] bg-[#fffdf8]">{children}</div>
    </div>
  );
}

function fonteIcon(fonte: string) {
  if (fonte === "MEC") return <Landmark className="h-3.5 w-3.5" />;
  if (fonte === "FNDE") return <BookOpen className="h-3.5 w-3.5" />;
  if (fonte === "INEP") return <GraduationCap className="h-3.5 w-3.5" />;
  return <Newspaper className="h-3.5 w-3.5" />;
}
function fonteBadgeClass(fonte: string): string {
  if (fonte === "MEC") return "bg-sky-100 text-sky-700 border-sky-200";
  if (fonte === "FNDE") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  return "bg-violet-100 text-violet-700 border-violet-200";
}

export default function CalendarioPage() {
  const currentDate = new Date();
  const mesAtual = currentDate.getMonth() + 1;
  const ano = 2026;
  const [mesSelecionado, setMesSelecionado] = useState<number>(mesAtual);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileDaySheet, setMobileDaySheet] = useState<{ day: number; items: PrazoEducacional[] } | null>(null);
  const calendarPanelRef = useRef<HTMLDivElement | null>(null);

  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  const prazosQuery = useQuery<{ ok: boolean; prazos: PrazoEducacional[]; ano: number }>({
    queryKey: ["/api/prazos-educacionais", ano],
    queryFn: async () => {
      const res = await fetch(`/api/prazos-educacionais?ano=${ano}`);
      if (!res.ok) throw new Error("Erro ao carregar prazos");
      return res.json();
    },
  });

  const noticiasQuery = useQuery<{ ok: boolean; noticias: NoticiaEducacao[]; total: number }>({
    queryKey: ["/api/noticias-educacao"],
    queryFn: async () => {
      const res = await fetch("/api/noticias-educacao?limit=12");
      if (!res.ok) throw new Error("Erro ao carregar notícias");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const prazos = prazosQuery.data?.prazos || [];
  const noticias = noticiasQuery.data?.noticias || [];

  const prazosPorMes: Record<number, PrazoEducacional[]> = useMemo(() => {
    const acc: Record<number, PrazoEducacional[]> = {};
    for (const p of prazos) {
      if (!acc[p.mes]) acc[p.mes] = [];
      acc[p.mes].push(p);
    }
    return acc;
  }, [prazos]);

  const filteredItems = useMemo(() => {
    const mesItems = prazosPorMes[mesSelecionado] || [];
    if (!query.trim()) return mesItems;
    const q = query.toLowerCase();
    return mesItems.filter(p => `${p.titulo} ${p.descricao} ${p.categoria}`.toLowerCase().includes(q));
  }, [prazosPorMes, mesSelecionado, query]);

  const monthIdx = mesSelecionado - 1;
  const monthLabel = MONTH_LABELS[monthIdx];
  const daysInMonth = new Date(ano, mesSelecionado, 0).getDate();
  const firstWeekday = new Date(ano, monthIdx, 1).getDay();

  const rawCells = Array.from({ length: firstWeekday + daysInMonth }, (_, i) =>
    i < firstWeekday ? null : i - firstWeekday + 1
  );
  const trailing = (7 - (rawCells.length % 7)) % 7;
  const calendarCells = [...rawCells, ...Array.from({ length: trailing }, () => null)];

  const deadlinesByDay = useMemo(() =>
    filteredItems.reduce<Record<number, PrazoEducacional[]>>((acc, p) => {
      const day = extractDay(p.dataInicio, p.dataFim);
      if (day === null) return acc;
      if (!acc[day]) acc[day] = [];
      acc[day].push(p);
      return acc;
    }, {}), [filteredItems]);

  const prazosSemData = useMemo(() =>
    filteredItems.filter(p => extractDay(p.dataInicio, p.dataFim) === null),
    [filteredItems]);

  const urgentCount = filteredItems.filter(p => p.urgencia === "alta").length;
  const attentionCount = filteredItems.filter(p => p.urgencia === "media").length;
  const infoCount = filteredItems.filter(p => p.urgencia === "baixa").length;

  const resumoDoMes = useMemo(() => {
    const mesNome = MONTH_FULL[monthIdx];
    if (filteredItems.length === 0) {
      return `${mesNome} está tranquilo por enquanto — sem prazos registrados. Aproveite esse respiro para organizar pastas, revisar documentos e se preparar com calma para o que vem por aí. Você merece!`;
    }
    const categorias = [...new Set(filteredItems.map(p => p.categoria))];
    const urgentes = filteredItems.filter(p => p.urgencia === "alta");
    const kw: Record<string, string[]> = {
      PDDE: ["pdde","dinheiro direto"], PNAE: ["pnae","alimentação","merenda","cae"],
      PNATE: ["pnate","transporte"], FUNDEB: ["fundeb"],
      CENSO: ["censo","matrícula","inep"], SAEB: ["saeb","avaliação"],
      PRESTAÇÃO: ["prestação","contas"], PLANEJAMENTO: ["planejamento","ppp","conselho escolar"],
    };
    const noticiasRelevantes = noticias.filter(n => {
      const txt = (n.titulo + " " + (n.resumo || "")).toLowerCase();
      return categorias.some(cat => (kw[cat] || [cat.toLowerCase()]).some(w => txt.includes(w)));
    }).slice(0, 1);

    const partes: string[] = [];
    partes.push(
      `Diretora, ${mesNome} traz ${filteredItems.length} compromisso${filteredItems.length > 1 ? "s" : ""} para ficar de olho` +
      (categorias.length ? `, envolvendo ${categorias.slice(0, 3).join(", ")}` : "") + "."
    );
    if (urgentes.length > 0) {
      const nomes = urgentes.slice(0, 2).map(p => p.titulo);
      partes.push(`Fique atenta: ${nomes.join(" e ")} ${urgentes.length > 1 ? "pedem" : "pede"} ação logo — não deixe passar!`);
    }
    if (attentionCount > 0) {
      partes.push(`Tem mais ${attentionCount} item${attentionCount > 1 ? "s" : ""} que valem um planejamento antecipado para não virar correria.`);
    }
    if (noticiasRelevantes.length > 0) {
      partes.push(`Também vale conferir nas notícias: ${noticiasRelevantes[0].titulo}.`);
    }
    return partes.join(" ");
  }, [filteredItems, noticias, monthIdx, urgentCount, attentionCount]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setIsCalendarOpen(false); }
    function onMouse(e: MouseEvent) {
      if (!isCalendarOpen) return;
      const t = e.target as Node | null;
      if (calendarPanelRef.current && t && !calendarPanelRef.current.contains(t)) setIsCalendarOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onMouse);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onMouse); };
  }, [isCalendarOpen]);

  return (
    <div className="min-h-screen bg-[#ece4d8] text-[#4c4a43]">
      <Navigation />
      <div className="min-h-screen" style={{ backgroundImage: "radial-gradient(circle at top left,rgba(255,255,255,.55),transparent 24%),linear-gradient(180deg,rgba(240,232,221,1) 0%,rgba(232,223,211,1) 100%)" }}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[30px] border border-[#d8cfbf] bg-[#f8f4ec] shadow-[0_20px_70px_rgba(91,74,52,0.08)]"
          >
            {/* ── Header ── */}
            <div className="border-b border-[#e6dccf] bg-[linear-gradient(180deg,#eef4df_0%,#e5eed3_100%)] px-5 pb-5 pt-8 sm:px-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d6d9c8] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#77815a]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Agenda escolar visual
                  </div>
                  <div className="relative inline-block">
                    <div className="absolute bottom-2 left-1 right-1 h-4 rounded-md bg-[#f5db69]/65" />
                    <h1 className="relative text-3xl font-black tracking-[-0.03em] text-[#3d5130] sm:text-4xl">
                      {settings?.calendario_titulo || "Agenda da Diretora"}
                    </h1>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6a63] sm:text-[15px]">
                    {settings?.calendario_desc || "Prazos, rotinas da gestão escolar e notícias importantes organizados como uma agenda viva da secretaria."}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start rounded-[18px] border border-[#d8cfbf] bg-[#fffdf8] px-4 py-2 shadow-sm">
                  <CalendarDays className="h-4 w-4 text-[#7a8a68]" />
                  <span className="text-base font-bold text-[#4f5a44]">2026</span>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-[#dce2ee] bg-[#f4f7ff] p-4 text-sm text-[#5e6680] shadow-inner">
                <div className="mb-1 flex items-center gap-2 font-semibold text-[#4765b6]">
                  <CalendarDays className="h-4 w-4 rotate-[-5deg] stroke-[2.2]" />
                  Como usar esta agenda
                </div>
                <p className="leading-6">
                  {settings?.calendario_como_usar || "Escolha um mês, filtre por palavra-chave e acompanhe os principais marcos da rotina escolar. As datas podem variar conforme edital — confirme sempre nos portais oficiais."}
                </p>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="px-4 py-5 sm:px-6 lg:px-8">
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                {/* Month cards */}
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
                  {MONTH_LABELS.map((label, index) => {
                    const mes = index + 1;
                    const active = mesSelecionado === mes;
                    const count = prazosPorMes[mes]?.length || 0;
                    const hasUrgente = prazosPorMes[mes]?.some(p => p.urgencia === "alta");
                    return (
                      <motion.button
                        key={mes}
                        whileHover={{ y: -4, rotate: active ? 0 : index % 2 === 0 ? -2 : 2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => { setMesSelecionado(mes); setIsCalendarOpen(true); }}
                        className={`relative min-w-[72px] sm:min-w-[92px] rounded-[14px] border-2 px-2 sm:px-4 pb-3 sm:pb-4 pt-3 sm:pt-4 text-left transition ${
                          active ? "border-[#c9bba7] bg-[#fffdf7]" : "border-[#e6dac9] bg-[#f6f1e7]"
                        }`}
                        style={{ boxShadow: "0 6px 0 rgba(0,0,0,0.04),0 12px 20px rgba(0,0,0,0.05)", transformOrigin: "center" }}
                      >
                        {active && <Tape className="left-1/2 top-[-12px] z-10 -translate-x-1/2" rotate="rotate-[3deg]" />}
                        <div className="relative z-10 flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-[#7b7467] bg-white text-[10px] font-black">
                            {label.slice(0,1)}
                          </div>
                          <div className="text-xs font-black tracking-[0.2em] text-[#5e594f]">{label}</div>
                        </div>
                        <div className="mt-3 space-y-1 opacity-70">
                          <div className="h-[2px] w-8 rounded bg-[#bfb5a6]" />
                          <div className="h-[2px] w-10 rounded bg-[#c8bdad]" />
                          <div className="h-[2px] w-6 rounded bg-[#cfc4b3]" />
                        </div>
                        <div className={`mt-2 text-[11px] font-semibold ${count ? "text-rose-500" : "text-[#9a9488]"}`}>
                          {count ? `${count} prazo${count > 1 ? "s" : ""}` : "sem prazo"}
                        </div>
                        {hasUrgente && (
                          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-400" />
                        )}
                        <div className="pointer-events-none absolute inset-0 rounded-[14px] border border-dashed border-[#d8cfc0] opacity-40"
                          style={{ clipPath: index % 2 === 0 ? "polygon(2% 3%,98% 2%,100% 18%,97% 100%,3% 98%,1% 27%)" : "polygon(3% 1%,97% 4%,99% 28%,97% 99%,2% 97%,0 16%)" }} />
                      </motion.button>
                    );
                  })}
                </div>

                {/* Search */}
                <div className="relative w-full xl:max-w-sm">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f887d]" />
                  <input value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Buscar prazo, programa ou tema"
                    className="w-full rounded-[18px] border border-[#e4dacd] bg-white px-11 py-3 text-sm outline-none placeholder:text-[#a7a096] focus:border-[#c8baa9]" />
                </div>
              </div>

              {/* Main grid */}
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-5">

                  {/* ── Calendar panel ── */}
                  <AnimatePresence mode="wait">
                    {isCalendarOpen && (
                      <motion.div ref={calendarPanelRef}
                        key={`${mesSelecionado}-${ano}`}
                        initial={{ opacity: 0, rotateY: -16, x: 26, scale: 0.985 }}
                        animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
                        exit={{ opacity: 0, rotateY: 18, x: -34, scale: 0.97 }}
                        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                        style={{ transformPerspective: 1600, transformOrigin: "left center" }}
                      >
                        <IrregularCalendarCard>
                          <div className="relative border border-[#e8dece] bg-[linear-gradient(180deg,#fffdf8_0%,#f8f3ea_100%)] p-4 sm:p-5">
                            <div className="relative z-10 mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                              <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#eadfcd] bg-[#fff8da] px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#8b7631]">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  Calendário do mês
                                </div>
                                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#4a473f] sm:text-[30px]">
                                  {MONTH_FULL[monthIdx]} {ano}
                                </h2>
                                <p className="mt-1 text-sm text-[#7d766c]">
                                  Datas com prazos ou rotinas importantes destacadas.
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="rounded-[18px] border border-[#eadfcf] bg-white px-4 py-2 text-sm font-semibold text-[#7b7468] shadow-sm">
                                  {filteredItems.length} marcação{filteredItems.length !== 1 ? "ões" : ""} no mês
                                </div>
                                <button onClick={() => setIsCalendarOpen(false)}
                                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4dacd] bg-white text-[#6f695f] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f7f3ea]">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <ScribbleLoop className="mb-3 h-6 w-full opacity-50" />

                            {prazosSemData.length > 0 && (
                              <div className="mb-3 rounded-[18px] border border-[#ecdece] bg-[#fdf8f0] p-3">
                                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8a7f72]">
                                  Sem data específica neste mês
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {prazosSemData.map((p) => {
                                    const c = categoryStyles[p.categoria] || categoryStyles.GERAL;
                                    const Icon = c.icon;
                                    return (
                                      <span key={p.titulo} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${c.tone}`} title={p.titulo}>
                                        <Icon className="h-3 w-3" />
                                        {p.titulo.length > 32 ? p.titulo.slice(0, 32) + "…" : p.titulo}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="rounded-[28px] border-2 border-[#ddd1c1] bg-[#fffefb] p-2 sm:p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-4"
                              style={{ clipPath: "polygon(1% 2%,98% 1%,100% 18%,98% 99%,2% 98%,0% 12%)" }}>
                              <div className="mb-2 sm:mb-3 grid grid-cols-7 gap-1 sm:gap-2">
                                {WEEKDAY_LABELS.map((lbl, idx) => (
                                  <div key={lbl}
                                    className={`rounded-[8px] sm:rounded-[12px] border px-0.5 sm:px-2 py-1 sm:py-2 text-center text-[8px] sm:text-[10px] font-black tracking-tight sm:tracking-[0.18em] ${
                                      idx === 0 || idx === 6
                                        ? "border-[#f0d6d6] bg-[#fff5f5] text-[#a66a6a]"
                                        : "border-[#ece2d4] bg-[#faf6ef] text-[#8a8377]"
                                    }`}>
                                    {lbl.slice(0, 1)}
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                                {calendarCells.map((day, idx) => {
                                  if (!day) {
                                    return <div key={`e-${idx}`} className="min-h-[56px] sm:min-h-[92px] rounded-[12px] sm:rounded-[18px] border border-dashed border-[#efe7da] bg-[#fbf8f2]/70" />;
                                  }
                                  const items = deadlinesByDay[day] || [];
                                  const urgent = items.some(i => i.urgencia === "alta");
                                  const attention = items.some(i => i.urgencia === "media");
                                  const hasItem = items.length > 0;
                                  const firstTitle = items[0]?.titulo;
                                  const cat = hasItem ? (categoryStyles[items[0].categoria] || categoryStyles.GERAL) : null;
                                  return (
                                    <motion.button key={day}
                                      whileHover={{ y: -3, rotate: day % 2 === 0 ? -0.8 : 0.8 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => { if (hasItem) setMobileDaySheet({ day, items }); }}
                                      className={`group relative min-h-[56px] sm:min-h-[92px] overflow-visible rounded-[14px] sm:rounded-[20px] border p-1 sm:p-2 text-left shadow-sm transition ${
                                        hasItem ? "border-[#dfcfbd] bg-[#fffdf8] cursor-pointer" : "border-[#efe4d7] bg-[#fcfaf5] cursor-default"
                                      }`}
                                      style={{ clipPath: day % 2 === 0 ? "polygon(3% 2%,98% 4%,100% 26%,97% 99%,1% 97%,0% 12%)" : "polygon(1% 4%,96% 1%,99% 16%,98% 98%,4% 99%,0 22%)" }}>
                                      {hasItem && (
                                        <>
                                          <div className={`absolute left-1 right-1 top-1 sm:left-2 sm:right-2 sm:top-2 h-4 sm:h-6 rounded-md opacity-80 ${urgent ? "bg-[#ffd7a8]" : attention ? "bg-[#fff2a8]" : "bg-[#dff2bf]"}`} />
                                          <div className="absolute right-1 top-1 sm:right-2 sm:top-1.5 z-20">
                                            {urgent ? <HandDrawnPin className="scale-[0.72]" /> : <HandDrawnStar className="h-5 w-5 rotate-[10deg]" />}
                                          </div>
                                        </>
                                      )}
                                      <div className="relative z-10 flex items-start justify-between">
                                        <div className="relative inline-flex h-5 w-5 sm:h-8 sm:w-8 items-center justify-center rounded-[6px] sm:rounded-[10px] border sm:border-2 border-[#d9cdbd] bg-white text-[10px] sm:text-sm font-black italic text-[#5a564e]"
                                          style={{ transform: `rotate(${day % 2 === 0 ? "-3deg" : "2deg"})` }}>
                                          {day}
                                        </div>
                                        {hasItem && <div className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full mt-0.5 shrink-0 ${urgent ? "bg-rose-500" : attention ? "bg-amber-500" : "bg-emerald-500"}`} />}
                                      </div>
                                      <div className="relative z-10 mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1">
                                        {items.slice(0, 2).map((item) => (
                                          <div key={item.titulo}
                                            className={`rounded-[8px] border px-1.5 py-0.5 text-[9px] font-bold leading-4 ${cat?.tone || "bg-stone-100 text-stone-700 border-stone-200"}`}>
                                            {item.categoria}
                                          </div>
                                        ))}
                                        {items.length > 2 && <div className="text-[9px] font-bold text-[#8b8478]">+{items.length - 2} mais</div>}
                                      </div>
                                      <div className="pointer-events-none absolute inset-0 rounded-[20px] border border-dashed border-[#e9dfd1] opacity-40" />
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </IrregularCalendarCard>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Count cards ── */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {[
                      { label: "Urgentes", count: urgentCount, bg: "bg-rose-50", text: "text-rose-600", Icon: BellRing },
                      { label: "Atenção", count: attentionCount, bg: "bg-amber-50", text: "text-amber-600", Icon: BadgeAlert },
                      { label: "Informativos", count: infoCount, bg: "bg-emerald-50", text: "text-emerald-600", Icon: CheckCircle2 },
                    ].map(({ label, count, bg, text, Icon }) => (
                      <div key={label} className="rounded-[18px] sm:rounded-[24px] border border-[#e6dccf] bg-white p-3 sm:p-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <div className={`rounded-xl sm:rounded-2xl ${bg} ${text} p-2 sm:p-3 self-start sm:self-auto`}><Icon className="h-4 w-4 sm:h-5 sm:w-5" /></div>
                          <div>
                            <div className="text-[10px] sm:text-xs uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#9c9388]">{label}</div>
                            <div className="text-xl sm:text-2xl font-black text-[#4e4a43]">{count}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Deadline cards ── */}
                  <div className="rounded-[28px] border border-[#ddd2c4] bg-[#fdfbf7] p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#eef0e5] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#71815e]">
                          <Clock3 className="h-3.5 w-3.5" />
                          Mês selecionado
                        </div>
                        <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#494740]">
                          Prazos de {MONTH_FULL[monthIdx]}
                        </h2>
                      </div>
                      <div className="rounded-full border border-[#ebe1d5] bg-white px-3 py-1.5 text-xs font-semibold text-[#8b8478]">
                        {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
                      </div>
                    </div>

                    {prazosQuery.isLoading ? (
                      <div className="flex flex-col items-center gap-3 py-12 text-center">
                        <Loader2 className="h-7 w-7 animate-spin text-[#6d4c41]" />
                        <p className="text-sm text-[#94a3b8]">Carregando prazos...</p>
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 rounded-[22px] border border-dashed border-[#e6dccf] bg-[#faf7f1] py-12 text-center">
                        <CalendarDays className="h-10 w-10 opacity-20" />
                        <p className="text-sm text-[#94a3b8]">Nenhum prazo encontrado para este mês.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {filteredItems.map((prazo, idx) => {
                          const cat = categoryStyles[prazo.categoria] || categoryStyles.GERAL;
                          const Icon = cat.icon;
                          const urgLabel = mapUrgencia(prazo.urgencia);
                          const day = extractDay(prazo.dataInicio, prazo.dataFim);
                          return (
                            <motion.article key={`${prazo.mes}-${prazo.titulo}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, delay: idx * 0.03 }}
                              whileHover={{ y: -2, rotate: idx % 2 === 0 ? -0.2 : 0.2 }}
                              className={`group relative overflow-hidden rounded-[20px] border border-[#e4d9cb] bg-gradient-to-br ${cat.wash} p-3 shadow-[0_4px_16px_rgba(81,64,42,0.05)]`}
                            >
                              <div className={`absolute left-0 top-0 h-full w-1.5 ${cat.line} border-l-[3px]`} />

                              <div className="relative z-10 flex items-start gap-3 pl-1">
                                {/* date pill */}
                                <div className="flex shrink-0 flex-col items-center gap-1">
                                  <div className="flex h-11 w-11 flex-col items-center justify-center rounded-[14px] border border-[#efe5d8] bg-white shadow-sm">
                                    <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#a89e94]">{monthLabel}</span>
                                    {day !== null
                                      ? <span className="text-[15px] font-black leading-none text-[#514c45]">{String(day).padStart(2,"0")}</span>
                                      : <span className="text-[10px] font-black leading-none text-[#b0a898]">—</span>
                                    }
                                  </div>
                                  <div className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${urgencyStyles[urgLabel]}`}>
                                    {urgLabel}
                                  </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cat.tone}`}>
                                      <Icon className="h-3 w-3" />
                                      {prazo.categoria}
                                    </span>
                                    {prazo.aConfirmar && (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                        <AlertTriangle className="h-2.5 w-2.5" /> A confirmar
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-[14px] font-black leading-snug tracking-[-0.01em] text-[#4d4a43]">{prazo.titulo}</h3>
                                  <p className="mt-1 text-[12px] leading-5 text-[#6d675f] line-clamp-2">{prazo.descricao}</p>
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-[#9b9388]">
                                    <span>Fonte: {prazo.fonte}</span>
                                    {prazo.dataFim && !prazo.aConfirmar && (
                                      <>
                                        <span>·</span>
                                        <span className="text-rose-500">Até {new Date(prazo.dataFim + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                                      </>
                                    )}
                                    {prazo.url && (
                                      <>
                                        <span>·</span>
                                        <a href={prazo.url} target="_blank" rel="noopener noreferrer"
                                          className="text-[#587cc9] underline decoration-dotted underline-offset-2 transition hover:text-[#315dbb]">
                                          Saiba mais
                                        </a>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <HandDrawnPin className="hidden shrink-0 scale-75 sm:block" />
                              </div>
                            </motion.article>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-4 rounded-[22px] border-l-4 border-[#e9a42e] bg-[#fbf6e8] px-5 py-4 text-xs leading-6 text-[#99602f]">
                      <AlertCircle className="mr-2 inline h-3.5 w-3.5" />
                      As datas são baseadas nos cronogramas típicos. Confirme sempre nos editais oficiais do FNDE, INEP e MEC.
                    </div>
                  </div>

                  {/* ── Category legend ── */}
                  <div className="rounded-[26px] border border-[#eadfce] bg-[#fffdf8] p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-2xl bg-[#eef2e1] p-3 text-[#6e8152]"><Pin className="h-5 w-5" /></div>
                      <div>
                        <h3 className="text-lg font-black text-[#4c4942]">Legenda de categorias</h3>
                        <p className="text-sm text-[#7d776d]">Cada programa aparece com sua própria cor para facilitar a leitura.</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {Object.entries(categoryStyles).map(([name, style]) => {
                        const Icon = style.icon;
                        return (
                          <span key={name} className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold shadow-sm ${style.tone}`}>
                            <Icon className="h-4 w-4 rotate-[-5deg] stroke-[2.2]" />{name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Sidebar ── */}
                <aside className="space-y-5">
                  {/* News panel */}
                  <div className="relative overflow-hidden rounded-[28px] border border-[#ddd2c4] bg-[#f8f4eb] p-4 shadow-sm sm:p-5">
                    <div className="absolute right-4 top-4 rotate-[8deg] rounded-md border border-[#efe3cf] bg-[#fff7c7] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#8d7b33] shadow-sm">
                      mural
                    </div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-[#eef3e4] p-3 text-[#708255]"><Newspaper className="h-5 w-5" /></div>
                        <div>
                          <h3 className="text-lg font-black text-[#4d4a43]">Notícias recentes</h3>
                          <p className="text-sm text-[#7d776d]">Recortes rápidos para acompanhar.</p>
                        </div>
                      </div>
                      <button onClick={() => noticiasQuery.refetch()} disabled={noticiasQuery.isFetching}
                        className="rounded-full border border-[#e4dacd] bg-white p-2 text-[#94a3b8] shadow-sm transition hover:-translate-y-0.5">
                        <RefreshCw className={`h-3.5 w-3.5 ${noticiasQuery.isFetching ? "animate-spin" : ""}`} />
                      </button>
                    </div>

                    {noticiasQuery.isLoading ? (
                      <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#6d4c41]" />
                        <p className="text-xs text-[#94a3b8]">Buscando notícias do MEC, FNDE e INEP...</p>
                      </div>
                    ) : noticias.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <Newspaper className="h-8 w-8 opacity-20" />
                        <p className="text-xs text-[#94a3b8]">Nenhuma notícia encontrada no momento.</p>
                      </div>
                    ) : (
                      <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#d5c9b8] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#f0e9de]">
                        {noticias.map((news, idx) => (
                          <motion.a key={idx} href={news.url} target="_blank" rel="noopener noreferrer"
                            whileHover={{ x: 3 }}
                            className="block rounded-[18px] border border-[#e8dccd] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 shrink-0 rounded-xl border p-2 ${fonteBadgeClass(news.fonte)}`}>
                                {fonteIcon(news.fonte)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold leading-5 text-[#4f4a44]">{news.titulo}</div>
                                {news.resumo && (
                                  <p className="mt-1.5 text-[12px] leading-5 text-[#6d6860] line-clamp-3">{news.resumo}</p>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${fonteBadgeClass(news.fonte)}`}>{news.fonte}</span>
                                  {news.categoria && (
                                    <span className="rounded-full bg-[#f2f4ee] px-2 py-0.5 text-[10px] font-semibold text-[#6d7a5a]">{news.categoria}</span>
                                  )}
                                  {news.data && <span className="text-[10px] text-[#a09890]">{news.data}</span>}
                                </div>
                              </div>
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#cbd5e1]" />
                            </div>
                          </motion.a>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {[
                        { label: "MEC", href: "https://www.gov.br/mec/pt-br/assuntos/noticias", cls: "bg-sky-100 text-sky-700 border-sky-200", Icon: Landmark },
                        { label: "FNDE", href: "https://www.gov.br/fnde/pt-br/assuntos/noticias", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", Icon: BookOpen },
                        { label: "INEP", href: "https://www.gov.br/inep/pt-br/assuntos/noticias", cls: "bg-violet-100 text-violet-700 border-violet-200", Icon: GraduationCap },
                      ].map(({ label, href, cls, Icon }) => (
                        <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition hover:-translate-y-0.5 ${cls}`}>
                          <Icon className="h-3 w-3" />{label}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Month summary */}
                  <div className="rounded-[28px] border border-[#ddd2c4] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-2xl bg-sky-50 p-3 text-sky-600"><CalendarDays className="h-5 w-5" /></div>
                      <div>
                        <h3 className="text-lg font-black text-[#4d4a43]">Resumo do mês</h3>
                        <p className="text-sm text-[#7c766c]">Uma leitura rápida antes de agir.</p>
                      </div>
                    </div>
                    <div className="rounded-[22px] border border-dashed border-[#d9d0c2] bg-[#faf7f0] p-4 text-sm leading-6 text-[#6f695f]">
                      {resumoDoMes}
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      {/* ── Mobile Day Sheet ── */}
      <AnimatePresence>
        {mobileDaySheet && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDaySheet(null)}
              onMouseDown={(e) => e.stopPropagation()}
              className="fixed inset-0 z-40 bg-black/40"
            />
            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              onMouseDown={(e) => e.stopPropagation()}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px] border-t border-[#d8cfc0] bg-[#fffdf8] shadow-[0_-12px_40px_rgba(80,60,30,0.14)] sm:left-auto sm:right-6 sm:bottom-6 sm:rounded-[28px] sm:border sm:w-[400px]"
              style={{ maxHeight: "82vh", overflowY: "auto" }}
            >
              {/* Drag handle — mobile only */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="h-1 w-10 rounded-full bg-[#d0c8bb]" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 sm:pt-4 border-b border-[#ece5d8]">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9b9388]">
                    {MONTH_FULL[mesSelecionado - 1]} {ano}
                  </div>
                  <div className="text-2xl font-black text-[#3d3a33] mt-0.5">
                    Dia {mobileDaySheet.day}
                  </div>
                </div>
                <button
                  onClick={() => setMobileDaySheet(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4dacd] bg-white text-[#6f695f] shadow-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Events list */}
              <div className="px-4 py-4 space-y-3">
                {mobileDaySheet.items.map((item, idx) => {
                  const cat = categoryStyles[item.categoria] || categoryStyles.GERAL;
                  const CatIcon = cat.icon;
                  const urgLabel = mapUrgencia(item.urgencia);
                  const urgStyle = urgencyStyles[urgLabel];
                  return (
                    <div
                      key={idx}
                      className={`rounded-[20px] border bg-gradient-to-br ${cat.wash} p-4 border-l-4 ${cat.line} border-[#e8dfd2]`}
                    >
                      {/* Category + urgency */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cat.tone}`}>
                          <CatIcon className="h-3 w-3" />
                          {item.categoria}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${urgStyle}`}>
                          {urgLabel}
                        </span>
                        {item.aConfirmar && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                            A confirmar
                          </span>
                        )}
                      </div>
                      {/* Title */}
                      <h3 className="text-sm font-black text-[#3d3a33] leading-snug mb-1">
                        {item.titulo}
                      </h3>
                      {/* Description */}
                      {item.descricao && (
                        <p className="text-[13px] text-[#6e6a62] leading-5">{item.descricao}</p>
                      )}
                      {/* Date range */}
                      {(item.dataInicio || item.dataFim) && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#9b9388]">
                          <CalendarDays className="h-3 w-3 shrink-0" />
                          {item.dataInicio && <span>{new Date(item.dataInicio + "T12:00:00").toLocaleDateString("pt-BR")}</span>}
                          {item.dataInicio && item.dataFim && <span>–</span>}
                          {item.dataFim && <span>{new Date(item.dataFim + "T12:00:00").toLocaleDateString("pt-BR")}</span>}
                        </div>
                      )}
                      {/* Source + link */}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#a09890]">Fonte: {item.fonte}</span>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-[#44533d] px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                            Acessar <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Safe area spacer for phones with home indicator */}
              <div className="pb-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
