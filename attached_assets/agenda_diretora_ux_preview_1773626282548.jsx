import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Newspaper,
  Pin,
  BellRing,
  BadgeAlert,
  BookOpenCheck,
  FileText,
  CircleDollarSign,
  BusFront,
  Apple,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  CheckCircle2,
  Clock3,
  Info,
  Dot,
  X,
} from "lucide-react";

const months = [
  { key: "jan", label: "JAN", prazos: 0 },
  { key: "fev", label: "FEV", prazos: 3 },
  { key: "mar", label: "MAR", prazos: 5 },
  { key: "abr", label: "ABR", prazos: 3 },
  { key: "mai", label: "MAI", prazos: 1 },
  { key: "jun", label: "JUN", prazos: 0 },
  { key: "jul", label: "JUL", prazos: 0 },
  { key: "ago", label: "AGO", prazos: 1 },
  { key: "set", label: "SET", prazos: 1 },
  { key: "out", label: "OUT", prazos: 1 },
  { key: "nov", label: "NOV", prazos: 1 },
  { key: "dez", label: "DEZ", prazos: 1 },
];

const categoryStyles = {
  PDDE: {
    tone: "bg-sky-100 text-sky-700 border-sky-200",
    line: "border-l-sky-300",
    wash: "from-sky-50 to-white",
    icon: CircleDollarSign,
  },
  PNAE: {
    tone: "bg-emerald-100 text-emerald-700 border-emerald-200",
    line: "border-l-emerald-300",
    wash: "from-emerald-50 to-white",
    icon: Apple,
  },
  PNATE: {
    tone: "bg-amber-100 text-amber-700 border-amber-200",
    line: "border-l-amber-300",
    wash: "from-amber-50 to-white",
    icon: BusFront,
  },
  FUNDEB: {
    tone: "bg-violet-100 text-violet-700 border-violet-200",
    line: "border-l-violet-300",
    wash: "from-violet-50 to-white",
    icon: BookOpenCheck,
  },
  CENSO: {
    tone: "bg-pink-100 text-pink-700 border-pink-200",
    line: "border-l-pink-300",
    wash: "from-pink-50 to-white",
    icon: FileText,
  },
  SAEB: {
    tone: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    line: "border-l-fuchsia-300",
    wash: "from-fuchsia-50 to-white",
    icon: GraduationCap,
  },
  PRESTAÇÃO: {
    tone: "bg-orange-100 text-orange-700 border-orange-200",
    line: "border-l-orange-300",
    wash: "from-orange-50 to-white",
    icon: FileText,
  },
  PLANEJAMENTO: {
    tone: "bg-teal-100 text-teal-700 border-teal-200",
    line: "border-l-teal-300",
    wash: "from-teal-50 to-white",
    icon: CalendarDays,
  },
  GERAL: {
    tone: "bg-stone-100 text-stone-700 border-stone-200",
    line: "border-l-stone-300",
    wash: "from-stone-50 to-white",
    icon: Info,
  },
};

const urgencyStyles = {
  Urgente: "text-rose-600 bg-rose-50 border-rose-200",
  Atenção: "text-amber-700 bg-amber-50 border-amber-200",
  Informativo: "text-emerald-700 bg-emerald-50 border-emerald-200",
};

const monthNumbers: Record<string, number> = {
  jan: 0,
  fev: 1,
  mar: 2,
  abr: 3,
  mai: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  set: 8,
  out: 9,
  nov: 10,
  dez: 11,
};

const weekdayLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const scheduleItems = [
  {
    month: "mar",
    day: "05",
    category: "PDDE",
    urgency: "Urgente",
    title: "1ª Parcela PDDE — Recebimento",
    desc: "Recebimento da primeira parcela do PDDE. Verificar o depósito na conta da UEx e alinhar os próximos passos com o conselho escolar.",
    source: "Fonte: FNDE/PDDE",
  },
  {
    month: "mar",
    day: "10",
    category: "PNATE",
    urgency: "Atenção",
    title: "PNATE — Início do repasse",
    desc: "Conferir se os valores destinados ao transporte escolar já foram repassados para o município e registrados corretamente.",
    source: "Fonte: FNDE/PNATE",
  },
  {
    month: "mar",
    day: "12",
    category: "PLANEJAMENTO",
    urgency: "Atenção",
    title: "Conselho Escolar — Reunião de Planejamento",
    desc: "Momento de organizar prioridades do semestre, discutir uso dos recursos e registrar deliberações em ata.",
    source: "Fonte: Legislação Educacional",
  },
  {
    month: "mar",
    day: "19",
    category: "PNAE",
    urgency: "Urgente",
    title: "PNAE — Prestação de Contas Anual",
    desc: "O CAE deve emitir parecer sobre a prestação de contas. Vale revisar documentação, notas e execução dos alimentos comprados.",
    source: "Fonte: FNDE/PNAE",
  },
  {
    month: "mar",
    day: "24",
    category: "GERAL",
    urgency: "Atenção",
    title: "Avaliações Diagnósticas — Início",
    desc: "Aplicar avaliações diagnósticas para identificar o nível de aprendizagem e organizar intervenções pedagógicas.",
    source: "Fonte: Gestão Pedagógica",
  },
  {
    month: "abr",
    day: "08",
    category: "PNAE",
    urgency: "Atenção",
    title: "PNAE — Compras da Agricultura Familiar",
    desc: "Acompanhar se o percentual mínimo de compras está sendo cumprido e se os contratos estão adequados.",
    source: "Fonte: FNDE/PNAE",
  },
  {
    month: "abr",
    day: "15",
    category: "FUNDEB",
    urgency: "Atenção",
    title: "FUNDEB — Acompanhamento dos Repasses",
    desc: "Conferir repasses do FUNDEB, comparar com meses anteriores e verificar possíveis variações no fluxo recebido.",
    source: "Fonte: FNDE/INEP",
  },
  {
    month: "abr",
    day: "28",
    category: "GERAL",
    urgency: "Informativo",
    title: "Dia Nacional da Educação",
    desc: "Boa oportunidade para mobilização da comunidade escolar, reflexão sobre metas e divulgação de ações internas.",
    source: "Fonte: Calendário Educacional",
  },
  {
    month: "mai",
    day: "30",
    category: "CENSO",
    urgency: "Urgente",
    title: "Censo Escolar — Coleta da Matrícula Inicial",
    desc: "Prazo para revisar alunos, turmas e vínculos. Uma boa conferência aqui evita retrabalho e inconsistências depois.",
    source: "Fonte: INEP",
  },
  {
    month: "ago",
    day: "30",
    category: "CENSO",
    urgency: "Urgente",
    title: "Censo Escolar — Encerramento da Coleta",
    desc: "Último momento para validar a matrícula inicial. Vale revisar pendências antes do fechamento definitivo.",
    source: "Fonte: INEP",
  },
  {
    month: "set",
    day: "10",
    category: "PDDE",
    urgency: "Urgente",
    title: "2ª Parcela PDDE — Recebimento",
    desc: "Conferir nova parcela, atualizar planejamento e registrar prioridades junto à equipe gestora.",
    source: "Fonte: FNDE/PDDE",
  },
  {
    month: "out",
    day: "22",
    category: "SAEB",
    urgency: "Urgente",
    title: "SAEB — Aplicação das Provas",
    desc: "Organizar logística interna, conferir turmas elegíveis e apoiar participação dos estudantes.",
    source: "Fonte: INEP",
  },
  {
    month: "nov",
    day: "12",
    category: "PLANEJAMENTO",
    urgency: "Atenção",
    title: "Planejamento para o Ano Seguinte",
    desc: "Mapear prioridades de infraestrutura, materiais, rotinas pedagógicas e necessidades de apoio para o próximo ciclo.",
    source: "Fonte: Gestão Escolar",
  },
  {
    month: "dez",
    day: "18",
    category: "PDDE",
    urgency: "Urgente",
    title: "PDDE — Encerramento do Exercício Financeiro",
    desc: "Encerrar movimentações, conferir saldo, documentos e pendências para facilitar a prestação de contas.",
    source: "Fonte: FNDE/PDDE",
  },
  {
    month: "fev",
    day: "10",
    category: "PLANEJAMENTO",
    urgency: "Urgente",
    title: "Início do Ano Letivo — Planejamento Escolar",
    desc: "Revisar calendário, projeto pedagógico, equipe e uso inicial dos recursos disponíveis para o ano.",
    source: "Fonte: Calendário Escolar",
  },
  {
    month: "fev",
    day: "20",
    category: "PRESTAÇÃO",
    urgency: "Urgente",
    title: "PDDE — Prestação de Contas",
    desc: "Prazo para reunir notas, extratos, atas e organizar a documentação referente ao exercício anterior.",
    source: "Fonte: FNDE/PDDE",
  },
  {
    month: "fev",
    day: "15",
    category: "CENSO",
    urgency: "Urgente",
    title: "Censo Escolar — Situação do Aluno",
    desc: "Período para informar situação final do estudante no Educacenso, com revisão cuidadosa dos registros.",
    source: "Fonte: INEP",
  },
];

const newsItems = [
  "FNDE registra novos atendimentos no Balcão Virtual Institucional",
  "FNDE divulga orientações iniciais para programas de 2026",
  "Protagonismo feminino fortalece a educação pública em diferentes territórios",
  "Canal de atendimento do FNDE reúne novas informações para gestores",
  "Merendeiras vencedoras são reconhecidas em premiação nacional",
  "INEP reforça calendário de avaliações e coleta educacional",
];

function HandDrawnPin({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-7 w-7 ${className}`}>
      <div className="absolute left-1/2 top-0 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-[#a35d4f] bg-[#d98676] shadow-sm" />
      <div className="absolute left-1/2 top-3 h-3.5 w-[2px] -translate-x-1/2 rotate-6 rounded-full bg-[#7f6559]" />
      <div className="absolute left-1/2 top-[18px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-[#7f6559]" />
    </div>
  );
}

function Tape({ rotate = "rotate-[-6deg]", className = "" }: { rotate?: string; className?: string }) {
  return (
    <div
      className={`absolute h-8 w-24 ${rotate} rounded-sm border border-white/40 bg-[#efe4b2]/75 backdrop-blur-[1px] shadow-sm ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, rgba(255,255,255,.18) 0px, rgba(255,255,255,.18) 2px, transparent 2px, transparent 6px)",
      }}
    />
  );
}

function ScribbleIcon({ Icon, className = "" }: { Icon: any; className?: string }) {
  return <Icon className={`h-4 w-4 rotate-[-5deg] stroke-[2.2] ${className}`} />;
}

function ScribbleLoop({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 15C18 8 33 8 47 13C61 18 77 19 92 12C101 8 110 8 116 12"
        stroke="#8f877d"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 6"
      />
    </svg>
  );
}

function HandDrawnStar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
      <path
        d="M18 4L21 13L31 13L23 19L26 30L18 23L10 30L13 19L5 13L15 13L18 4Z"
        stroke="#b97f2b"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#f6dd75"
      />
    </svg>
  );
}

function IrregularCalendarCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-[3px] rounded-[28px] border border-[#e5dbc9] opacity-60" />
      <div
        className="absolute inset-0 rounded-[30px] border-2 border-[#d8cbb8] opacity-70"
        style={{ clipPath: "polygon(2% 4%, 97% 2%, 99% 18%, 97% 51%, 100% 96%, 4% 99%, 1% 79%, 3% 28%)" }}
      />
      <div className="relative overflow-hidden rounded-[30px] bg-[#fffdf8]">{children}</div>
    </div>
  );
}

export default function AgendaDiretoraUX() {
  const [selectedMonth, setSelectedMonth] = useState("mar");
  const [year, setYear] = useState(2026);
  const [query, setQuery] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarPanelRef = useRef<HTMLDivElement | null>(null);

  const filteredItems = useMemo(() => {
    return scheduleItems.filter((item) => {
      const sameMonth = item.month === selectedMonth;
      const match = `${item.title} ${item.desc} ${item.category}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return sameMonth && match;
    });
  }, [selectedMonth, query]);

  const monthLabel = months.find((m) => m.key === selectedMonth)?.label;
  const monthIndex = monthNumbers[selectedMonth];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();

  const rawCalendarCells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) => {
    if (index < firstWeekday) return null;
    return index - firstWeekday + 1;
  });

  const trailingEmptyCells = (7 - (rawCalendarCells.length % 7)) % 7;
  const calendarCells = [...rawCalendarCells, ...Array.from({ length: trailingEmptyCells }, () => null)];

  const deadlinesByDay = filteredItems.reduce<Record<number, typeof filteredItems>>((acc, item) => {
    const day = Number(item.day);
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});
  const urgentCount = filteredItems.filter((i) => i.urgency === "Urgente").length;
  const attentionCount = filteredItems.filter((i) => i.urgency === "Atenção").length;
  const infoCount = filteredItems.filter((i) => i.urgency === "Informativo").length;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCalendarOpen(false);
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (!isCalendarOpen) return;
      const target = event.target as Node | null;
      if (calendarPanelRef.current && target && !calendarPanelRef.current.contains(target)) {
        setIsCalendarOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isCalendarOpen]);

  return (
    <div className="min-h-screen bg-[#ece4d8] text-[#4c4a43]">
      <div
        className="min-h-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, rgba(255,255,255,.55), transparent 24%), linear-gradient(180deg, rgba(240,232,221,1) 0%, rgba(232,223,211,1) 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[30px] border border-[#d8cfbf] bg-[#f8f4ec] shadow-[0_20px_70px_rgba(91,74,52,0.08)]"
          >
            <Tape className="left-7 top-4" />
            <Tape rotate="rotate-[8deg]" className="right-8 top-5 hidden sm:block" />

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
                      Agenda da Diretora
                    </h1>
                  </div>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6a63] sm:text-[15px]">
                    Prazos, rotinas da gestão escolar e notícias importantes organizados como uma agenda viva da secretaria.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 self-start rounded-[22px] border border-[#d8cfbf] bg-[#fffdf8] p-2 shadow-sm">
                  <button
                    onClick={() => setYear((y) => y - 1)}
                    className="rounded-xl border border-[#e6dccf] bg-white p-2 text-[#736b60] transition hover:-translate-y-0.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-[72px] text-center text-lg font-bold text-[#4f5a44]">{year}</div>
                  <button
                    onClick={() => setYear((y) => y + 1)}
                    className="rounded-xl border border-[#e6dccf] bg-white p-2 text-[#736b60] transition hover:-translate-y-0.5"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-[#dce2ee] bg-[#f4f7ff] p-4 text-sm text-[#5e6680] shadow-inner">
                <div className="mb-1 flex items-center gap-2 font-semibold text-[#4765b6]">
                  <ScribbleIcon Icon={CalendarDays} className="text-[#4765b6]" />
                  Como usar esta agenda
                </div>
                <p className="leading-6">
                  Escolha um mês, filtre por palavra-chave e acompanhe os principais marcos da rotina escolar. As datas podem variar conforme o edital e a rede.
                </p>
              </div>
            </div>

            <div className="px-4 py-5 sm:px-6 lg:px-8">
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {months.map((month, index) => {
                    const active = selectedMonth === month.key;

                    return (
                      <motion.button
                        key={month.key}
                        whileHover={{ y: -4, rotate: active ? 0 : index % 2 === 0 ? -2 : 2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          setSelectedMonth(month.key);
                          setIsCalendarOpen(true);
                        }}
                        className={`relative min-w-[92px] rounded-[14px] border-2 px-4 pb-4 pt-4 text-left transition ${
                          active
                            ? "border-[#c9bba7] bg-[#fffdf7]"
                            : "border-[#e6dac9] bg-[#f6f1e7]"
                        }`}
                        style={{
                          boxShadow:
                            "0 6px 0 rgba(0,0,0,0.04), 0 12px 20px rgba(0,0,0,0.05)",
                          transformOrigin: "center",
                        }}
                      >
                        {/* fita segurando o mês */}
                        {active && (
                          <Tape
                            className="left-1/2 top-[-12px] z-10 -translate-x-1/2"
                            rotate="rotate-[3deg]"
                          />
                        )}

                        {/* rabisco tipo calendário */}
                        <div className="relative z-10 flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-[#7b7467] bg-white text-[10px] font-black">
                            {month.label.slice(0,1)}
                          </div>

                          <div className="text-xs font-black tracking-[0.2em] text-[#5e594f]">
                            {month.label}
                          </div>
                        </div>

                        {/* rabisco linhas de calendário */}
                        <div className="mt-3 space-y-1 opacity-70">
                          <div className="h-[2px] w-8 rounded bg-[#bfb5a6]" />
                          <div className="h-[2px] w-10 rounded bg-[#c8bdad]" />
                          <div className="h-[2px] w-6 rounded bg-[#cfc4b3]" />
                        </div>

                        <div className={`mt-2 text-[11px] font-semibold ${month.prazos ? "text-rose-500" : "text-[#9a9488]"}`}>
                          {month.prazos ? `${month.prazos} prazo${month.prazos > 1 ? "s" : ""}` : "sem prazo"}
                        </div>

                        {month.prazos > 0 && (
                          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-400" />
                        )}

                        {/* borda rabiscada */}
                        <div
                          className="pointer-events-none absolute inset-0 rounded-[14px] border border-dashed border-[#d8cfc0] opacity-40"
                          style={{ clipPath: index % 2 === 0 ? "polygon(2% 3%, 98% 2%, 100% 18%, 97% 100%, 3% 98%, 1% 27%)" : "polygon(3% 1%, 97% 4%, 99% 28%, 97% 99%, 2% 97%, 0 16%)" }}
                        />
                      </motion.button>
                    );
                                    })}
                </div>

                <div className="relative w-full xl:max-w-sm">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f887d]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar prazo, programa ou tema"
                    className="w-full rounded-[18px] border border-[#e4dacd] bg-white px-11 py-3 text-sm outline-none ring-0 placeholder:text-[#a7a096] focus:border-[#c8baa9]"
                  />
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-5">
                  <AnimatePresence mode="wait">
                    {isCalendarOpen && (
                      <motion.div
                        ref={calendarPanelRef}
                        key={`${selectedMonth}-${year}`}
                        initial={{ opacity: 0, rotateY: -16, x: 26, scale: 0.985 }}
                        animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
                        exit={{ opacity: 0, rotateY: 18, x: -34, scale: 0.97 }}
                        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                        style={{ transformPerspective: 1600, transformOrigin: "left center" }}
                      >
                        <IrregularCalendarCard>
                          <div className="relative border border-[#e8dece] bg-[linear-gradient(180deg,#fffdf8_0%,#f8f3ea_100%)] p-4 sm:p-5">
                            <Tape className="left-8 top-[-10px]" rotate="rotate-[-7deg]" />
                            <Tape className="right-12 top-[-11px] hidden sm:block" rotate="rotate-[8deg]" />
                            <HandDrawnPin className="absolute left-5 top-4 z-20" />
                            <HandDrawnPin className="absolute right-6 top-4 z-20 hidden sm:block" />

                            <div className="relative z-10 mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                              <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#eadfcd] bg-[#fff8da] px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#8b7631]">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  Calendário do mês
                                </div>
                                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#4a473f] sm:text-[30px]">
                                  {monthLabel} {year}
                                </h2>
                                <p className="mt-1 text-sm text-[#7d766c]">
                                  Veja o mês completo, com destaque para as datas que já têm prazo ou rotina importante.
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="rounded-[18px] border border-[#eadfcf] bg-white px-4 py-2 text-sm font-semibold text-[#7b7468] shadow-sm">
                                  {filteredItems.length} marcação{filteredItems.length !== 1 ? "ões" : ""} no mês
                                </div>
                                <button
                                  onClick={() => setIsCalendarOpen(false)}
                                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4dacd] bg-white text-[#6f695f] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f7f3ea]"
                                  aria-label="Fechar calendário"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <ScribbleLoop className="mb-3 h-6 w-full opacity-50" />

                            <div
                              className="rounded-[28px] border-2 border-[#ddd1c1] bg-[#fffefb] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-4"
                              style={{ clipPath: "polygon(1% 2%, 98% 1%, 100% 18%, 98% 99%, 2% 98%, 0% 12%)" }}
                            >
                              <div className="mb-3 grid grid-cols-7 gap-2">
                                {weekdayLabels.map((label, idx) => (
                                  <div
                                    key={label}
                                    className={`rounded-[12px] border px-2 py-2 text-center text-[10px] font-black tracking-[0.18em] sm:text-[11px] ${
                                      idx === 0 || idx === 6
                                        ? "border-[#f0d6d6] bg-[#fff5f5] text-[#a66a6a]"
                                        : "border-[#ece2d4] bg-[#faf6ef] text-[#8a8377]"
                                    }`}
                                  >
                                    {label}
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-7 gap-2">
                                {calendarCells.map((day, idx) => {
                                  if (!day) {
                                    return <div key={`empty-${idx}`} className="min-h-[92px] rounded-[18px] border border-dashed border-[#efe7da] bg-[#fbf8f2]/70" />;
                                  }

                                  const items = deadlinesByDay[day] || [];
                                  const urgent = items.some((item) => item.urgency === "Urgente");
                                  const attention = items.some((item) => item.urgency === "Atenção");
                                  const hasItem = items.length > 0;
                                  const firstTitle = items[0]?.title;

                                  return (
                                    <motion.button
                                      key={day}
                                      whileHover={{ y: -3, rotate: day % 2 === 0 ? -0.8 : 0.8 }}
                                      whileTap={{ scale: 0.98 }}
                                      className={`group relative min-h-[92px] overflow-visible rounded-[20px] border p-2 text-left shadow-sm transition sm:min-h-[106px] ${
                                        hasItem
                                          ? "border-[#dfcfbd] bg-[#fffdf8]"
                                          : "border-[#efe4d7] bg-[#fcfaf5]"
                                      }`}
                                      style={{ clipPath: day % 2 === 0 ? "polygon(3% 2%, 98% 4%, 100% 26%, 97% 99%, 1% 97%, 0% 12%)" : "polygon(1% 4%, 96% 1%, 99% 16%, 98% 98%, 4% 99%, 0 22%)" }}
                                    >
                                      {hasItem && (
                                        <>
                                          <div
                                            className={`absolute left-2 right-2 top-2 h-6 rounded-md opacity-80 ${
                                              urgent
                                                ? "bg-[#ffd7a8]"
                                                : attention
                                                  ? "bg-[#fff2a8]"
                                                  : "bg-[#dff2bf]"
                                            }`}
                                          />
                                          <div className="absolute right-2 top-1.5 z-20">
                                            {urgent ? (
                                              <HandDrawnPin className="scale-[0.72]" />
                                            ) : (
                                              <HandDrawnStar className="h-5 w-5 rotate-[10deg]" />
                                            )}
                                          </div>
                                        </>
                                      )}

                                      <div className="relative z-10 flex items-start justify-between">
                                        <div
                                          className="relative inline-flex h-8 w-8 items-center justify-center rounded-[10px] border-2 border-[#d9cdbd] bg-white text-sm font-black text-[#5a564e] italic"
                                          style={{ transform: `rotate(${day % 2 === 0 ? "-3deg" : "2deg"})`, fontFamily: '"Comic Sans MS", "Bradley Hand", cursive' }}
                                        >
                                          {day}
                                        </div>
                                        {hasItem && <Dot className={`h-5 w-5 ${urgent ? "text-rose-500" : attention ? "text-amber-500" : "text-emerald-500"}`} />}
                                      </div>

                                      <div className="relative z-10 mt-2 space-y-1">
                                        {items.slice(0, 2).map((item) => (
                                          <div
                                            key={`${day}-${item.title}`}
                                            className="rounded-[10px] border border-[#efe4d5] bg-white/80 px-2 py-1 text-[10px] font-semibold leading-4 text-[#6c665e]"
                                          >
                                            {item.category}
                                          </div>
                                        ))}
                                        {items.length > 2 && (
                                          <div className="text-[10px] font-bold text-[#8b8478]">+{items.length - 2} mais</div>
                                        )}
                                      </div>

                                      {hasItem && (
                                        <div className="pointer-events-none absolute left-1/2 top-[-12px] z-30 w-[170px] -translate-x-1/2 rounded-[14px] border border-[#d9cdbf] bg-[#fffdf7] px-3 py-2 text-[11px] font-semibold leading-4 text-[#5e584f] opacity-0 shadow-[0_10px_30px_rgba(77,61,38,0.12)] transition duration-200 group-hover:opacity-100">
                                          <div className="font-black text-[#4f4a43]">{firstTitle}</div>
                                          {items.length > 1 && (
                                            <div className="mt-1 text-[#8b8478]">+{items.length - 1} outro{items.length - 1 > 1 ? "s" : ""} prazo{items.length - 1 > 1 ? "s" : ""}</div>
                                          )}
                                        </div>
                                      )}

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

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[24px] border border-[#e6dccf] bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-rose-50 p-3 text-rose-600"><BellRing className="h-5 w-5" /></div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.16em] text-[#9c9388]">Urgentes</div>
                          <div className="text-2xl font-black text-[#4e4a43]">{urgentCount}</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-[#e6dccf] bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-amber-50 p-3 text-amber-600"><BadgeAlert className="h-5 w-5" /></div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.16em] text-[#9c9388]">Atenção</div>
                          <div className="text-2xl font-black text-[#4e4a43]">{attentionCount}</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-[#e6dccf] bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.16em] text-[#9c9388]">Informativos</div>
                          <div className="text-2xl font-black text-[#4e4a43]">{infoCount}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-[#ddd2c4] bg-[#fdfbf7] p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#eef0e5] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#71815e]">
                          <Clock3 className="h-3.5 w-3.5" />
                          Mês selecionado
                        </div>
                        <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#494740]">
                          Prazos de {monthLabel}
                        </h2>
                      </div>
                      <div className="rounded-full border border-[#ebe1d5] bg-white px-3 py-1.5 text-xs font-semibold text-[#8b8478]">
                        {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {filteredItems.map((item, idx) => {
                        const category = categoryStyles[item.category as keyof typeof categoryStyles];
                        const Icon = category.icon;
                        return (
                          <motion.article
                            key={`${item.month}-${item.day}-${item.title}`}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.03 }}
                            whileHover={{ y: -4, rotate: idx % 2 === 0 ? -0.3 : 0.3 }}
                            className={`group relative overflow-hidden rounded-[26px] border border-[#e4d9cb] bg-gradient-to-br ${category.wash} p-4 shadow-[0_10px_35px_rgba(81,64,42,0.06)] sm:p-5`}
                          >
                            <Tape className="left-6 top-[-8px]" rotate={idx % 2 === 0 ? "rotate-[-8deg]" : "rotate-[7deg]"} />
                            <HandDrawnPin className="absolute right-4 top-3 z-20" />
                            <div className={`absolute left-0 top-0 h-full w-2 border-l-4 ${category.line}`} />

                            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start">
                              <div className="flex shrink-0 items-center gap-3 sm:w-[92px] sm:flex-col sm:items-center sm:justify-start">
                                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-[18px] border border-[#efe5d8] bg-white shadow-sm">
                                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#948a7f]">{monthLabel}</span>
                                  <span className="text-lg font-black leading-none text-[#514c45]">{item.day}</span>
                                </div>
                                <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-bold ${urgencyStyles[item.urgency as keyof typeof urgencyStyles]}`}>
                                  {item.urgency}
                                </div>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold ${category.tone}`}>
                                    <ScribbleIcon Icon={Icon} />
                                    {item.category}
                                  </span>
                                </div>

                                <h3 className="text-xl font-black tracking-[-0.02em] text-[#4d4a43]">
                                  {item.title}
                                </h3>
                                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d675f]">
                                  {item.desc}
                                </p>

                                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#8b857a]">
                                  <span>{item.source}</span>
                                  <span className="text-[#9b9388]">•</span>
                                  <button className="text-[#587cc9] underline decoration-dotted underline-offset-4 transition hover:text-[#315dbb]">
                                    Saiba mais
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.article>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-[#eadfce] bg-[#fffdf8] p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-2xl bg-[#eef2e1] p-3 text-[#6e8152]">
                        <Pin className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-[#4c4942]">Legenda de categorias</h3>
                        <p className="text-sm text-[#7d776d]">Cada programa aparece com sua própria cor para facilitar a leitura.</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {Object.entries(categoryStyles).map(([name, style]) => {
                        const Icon = style.icon;
                        return (
                          <span
                            key={name}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold shadow-sm ${style.tone}`}
                          >
                            <ScribbleIcon Icon={Icon} />
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <aside className="space-y-5">
                  <div className="relative overflow-hidden rounded-[28px] border border-[#ddd2c4] bg-[#f8f4eb] p-4 shadow-sm sm:p-5">
                    <div className="absolute right-4 top-4 rotate-[8deg] rounded-md border border-[#efe3cf] bg-[#fff7c7] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#8d7b33] shadow-sm">
                      mural
                    </div>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-2xl bg-[#eef3e4] p-3 text-[#708255]">
                        <Newspaper className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-[#4d4a43]">Notícias recentes</h3>
                        <p className="text-sm text-[#7d776d]">Recortes rápidos para a diretora acompanhar.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {newsItems.map((news, idx) => (
                        <motion.div
                          key={news}
                          whileHover={{ x: 3, rotate: idx % 2 === 0 ? -0.25 : 0.25 }}
                          className="relative rounded-[22px] border border-[#e8dccd] bg-white p-4 shadow-sm"
                        >
                          <Tape className="left-4 top-[-10px]" rotate={idx % 2 === 0 ? "rotate-[-7deg]" : "rotate-[6deg]"} />
                          <div className="mb-2 flex items-start gap-3">
                            <div className="mt-0.5 rounded-xl bg-[#edf4e6] p-2 text-[#6b8556]">
                              <Newspaper className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold leading-5 text-[#4f4a44]">{news}</div>
                              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-[#898276]">
                                <span className="rounded-full bg-[#f2f5ea] px-2 py-1 text-[#6f8158]">FNDE</span>
                                <span>2026</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-[#ddd2c4] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-2xl bg-sky-50 p-3 text-sky-600">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-[#4d4a43]">Resumo do mês</h3>
                        <p className="text-sm text-[#7c766c]">Uma leitura rápida antes de agir.</p>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-dashed border-[#d9d0c2] bg-[#faf7f0] p-4 text-sm leading-6 text-[#6f695f]">
                      Em <span className="font-bold text-[#4f4a43]">{monthLabel}</span>, a agenda reúne
                      <span className="font-bold text-[#4f4a43]"> {filteredItems.length} prazo{filteredItems.length !== 1 ? "s" : ""}</span>, com foco especial em
                      <span className="font-bold text-rose-600"> {urgentCount} item{urgentCount !== 1 ? "s" : ""} urgente{urgentCount !== 1 ? "s" : ""}</span>.
                      Isso ajuda a diretora a visualizar o que exige ação imediata e o que pode ser organizado com mais calma.
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
