import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Loader2 } from "lucide-react";
import type { TrilhaUnit } from "@shared/schema";

const toneMap = {
  origem: {
    spine: "#4a7a9b",
    spineLight: "#6a9db8",
    tab: "#b8d8ee",
    tabText: "#1e4a6a",
    strip: "#deeef8",
    punch: "#c0daea",
    header: "#eef6fc",
    chip: "bg-sky-100 text-sky-800",
    border: "#cfe5f4",
    accent: "#a8ccdf",
  },
  estrutura: {
    spine: "#8b6914",
    spineLight: "#b08c2a",
    tab: "#f0dea0",
    tabText: "#5a3d08",
    strip: "#fdf4d8",
    punch: "#e8d090",
    header: "#fefaf0",
    chip: "bg-amber-100 text-amber-900",
    border: "#f0e0a8",
    accent: "#d4b84a",
  },
  planejamento: {
    spine: "#2d7a54",
    spineLight: "#48a070",
    tab: "#b8eacc",
    tabText: "#0e4a28",
    strip: "#e4f8ec",
    punch: "#a8dab8",
    header: "#f0faf4",
    chip: "bg-emerald-100 text-emerald-900",
    border: "#b8ddc8",
    accent: "#6ab88a",
  },
  prestacao: {
    spine: "#8b3a5a",
    spineLight: "#b05878",
    tab: "#f0b8cc",
    tabText: "#5a1830",
    strip: "#fde8f0",
    punch: "#e0a0b8",
    header: "#fff4f8",
    chip: "bg-rose-100 text-rose-900",
    border: "#e8b8cc",
    accent: "#c87898",
  },
};

type ToneKey = keyof typeof toneMap;

function getPersonalidade(unitId: string): ToneKey {
  const n = parseInt(unitId.replace("U", ""), 10);
  if (n <= 4) return "origem";
  if (n <= 11) return "estrutura";
  if (n <= 15) return "planejamento";
  return "prestacao";
}

function emojiFor(p: ToneKey) {
  return p === "origem" ? "💧" : p === "estrutura" ? "📁" : p === "planejamento" ? "🗂️" : "📝";
}

function groupName(p: ToneKey) {
  return p === "origem"
    ? "De onde vêm os recursos"
    : p === "estrutura"
    ? "Estrutura administrativa"
    : p === "planejamento"
    ? "Planejamento e uso dos recursos"
    : "Prestação de contas e continuidade";
}

// Binder ring clip SVG — used only on the spine
function RingClip({ color }: { color: string }) {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="13" stroke={color} strokeWidth="4" fill="none" />
        <circle cx="18" cy="18" r="13" stroke="rgba(0,0,0,0.18)" strokeWidth="4" fill="none" strokeDasharray="20 62" strokeDashoffset="10" />
        <rect x="13" y="16" width="10" height="4" rx="2" fill={color} />
        <rect x="13" y="16" width="10" height="4" rx="2" fill="rgba(255,255,255,0.25)" />
      </svg>
    </div>
  );
}

// Paper / sticker card — sem furinhos, parece uma folha colada na página
function Ficha({
  tone,
  label,
  accent,
  rotate = 0,
  children,
  className = "",
}: {
  tone: (typeof toneMap)[ToneKey];
  label?: string;
  accent?: string;
  rotate?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[14px] bg-white ${className}`}
      style={{
        border: `1px solid ${tone.border}`,
        boxShadow: "0 3px 10px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    >
      {/* Colored label strip at top — like a sticker header */}
      {label && (
        <div
          className="px-4 py-1.5"
          style={{ background: accent || tone.tab }}
        >
          <span
            className="text-[9px] font-extrabold uppercase tracking-[0.22em]"
            style={{ color: tone.tabText }}
          >
            {label}
          </span>
        </div>
      )}
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

// ── Baralho de fichas empilhadas ──
// Fichas de aprofundamento aparecem uma em cima da outra
// como uma fila/deck de cartões de índice
function FichaStack({
  fichas,
  tone,
  onOpen,
}: {
  fichas: Array<{ id: string; label: string; title: string; preview: string; paragraphs: string[] }>;
  tone: (typeof toneMap)[ToneKey];
  onOpen: (id: string) => void;
}) {
  const [topIdx, setTopIdx] = useState(0);

  // Rotate stack so topIdx card is front
  const ordered = [
    ...fichas.slice(topIdx),
    ...fichas.slice(0, topIdx),
  ];

  return (
    <div className="relative select-none" style={{ minHeight: "270px", paddingBottom: "76px" }}>
      {/* Render back-to-front so front card is on top */}
      {[...ordered].reverse().map((ficha, reversedIdx) => {
        const stackPos = ordered.length - 1 - reversedIdx; // 0 = front card
        const isFront = stackPos === 0;
        const offset = stackPos * 38; // px each card peeks below the previous

        return (
          <div
            key={ficha.id}
            className="absolute left-0 right-0 overflow-hidden rounded-[16px] transition-all duration-300"
            style={{
              top: `${offset}px`,
              zIndex: ordered.length - stackPos,
              boxShadow: isFront
                ? "0 6px 20px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.08)"
                : "0 3px 10px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
              border: `1px solid ${tone.border}`,
            }}
          >
            {/* Colored tab header — always visible, clicking brings to front or opens */}
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-2.5 text-left"
              style={{ background: tone.tab }}
              onClick={() => {
                if (!isFront) {
                  setTopIdx(fichas.indexOf(ficha));
                } else {
                  onOpen(ficha.id);
                }
              }}
            >
              <span
                className="text-[9px] font-extrabold uppercase tracking-[0.22em]"
                style={{ color: tone.tabText }}
              >
                {ficha.label}
              </span>
              <span
                className="text-[9px] font-bold opacity-70"
                style={{ color: tone.tabText }}
              >
                {isFront ? "abrir →" : "↓"}
              </span>
            </button>

            {/* Body — only visible on front card */}
            {isFront && (
              <div className="bg-white px-4 py-3">
                <p className="text-sm font-bold text-slate-700">{ficha.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{ficha.preview}</p>
                <div className="mt-3 flex items-center gap-2">
                  <div
                    className="h-px flex-1"
                    style={{ background: tone.border }}
                  />
                  <span className="text-[10px] font-semibold" style={{ color: tone.spineLight }}>
                    4–5 páginas · leitura completa
                  </span>
                  <div
                    className="h-px flex-1"
                    style={{ background: tone.border }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const FICHAS_APROFUNDAMENTO = [
  {
    id: "leitura",
    label: "leitura",
    title: "Leitura ampliada da unidade",
    preview: "Uma explicação mais longa para compreender o sentido geral do tema.",
    paragraphs: [
      "Esta ficha transforma o tema da unidade em uma leitura mais contínua, menos fragmentada.",
      "Aqui, o objetivo não é apenas listar regras, mas mostrar como esse conteúdo pode fortalecer a tomada de decisão e diminuir dúvidas na rotina da escola.",
      "Ela serve como texto-base para estudo, reunião interna e retomada do assunto com mais calma.",
    ],
  },
  {
    id: "pratica",
    label: "prática",
    title: "Como isso aparece na prática",
    preview: "Exemplos concretos de como o tema aparece no dia a dia da escola.",
    paragraphs: [
      "Na prática, esta unidade aparece quando a direção precisa transformar regra em decisão concreta.",
      "Ela também surge quando a equipe tenta organizar melhor papéis, tempos e responsabilidades.",
      "Quando esse conteúdo fica claro, a escola ganha previsibilidade e mais segurança para agir.",
    ],
  },
  {
    id: "conversa",
    label: "conversa",
    title: "Perguntas para conversa com a equipe",
    preview: "Uma ficha pensada para apoiar reunião, formação ou conversa interna.",
    paragraphs: [
      "Quais pontos desta unidade a equipe já domina e quais ainda parecem mais nebulosos?",
      "Que quadro, checklist ou fluxo ajudaria a tornar esse conteúdo mais claro para toda a escola?",
      "Como este tema conversa com a próxima decisão administrativa que a direção vai tomar?",
    ],
  },
];

export default function TrilhaUnidade() {
  const params = useParams();
  const unitId = params.unitId || "U01";
  const [, navigate] = useLocation();
  const [openFicha, setOpenFicha] = useState<string | null>(null);

  const { data: unidade, isLoading } = useQuery<TrilhaUnit>({
    queryKey: ["/api/trilha", unitId],
  });

  const { data: allUnits = [] } = useQuery<TrilhaUnit[]>({
    queryKey: ["/api/trilha"],
  });

  const personalidade = getPersonalidade(unitId);
  const tone = toneMap[personalidade];

  const allSorted = [...allUnits].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const currentIdx = allSorted.findIndex((u) => u.unitId === unitId);
  const prevUnit = currentIdx > 0 ? allSorted[currentIdx - 1] : null;
  const nextUnit = currentIdx < allSorted.length - 1 ? allSorted[currentIdx + 1] : null;

  const unitNum = parseInt(unitId.replace("U", ""), 10);

  const sections = (unidade?.sections || []) as Array<{
    tipo: string;
    titulo: string;
    conteudo: string | string[];
  }>;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#ede8df]">
        <Navigation />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!unidade) {
    return (
      <div className="flex min-h-screen flex-col bg-[#ede8df]">
        <Navigation />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-slate-500">Unidade não encontrada</p>
          <button
            onClick={() => navigate("/trilha")}
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-[#6f8094] shadow-sm"
          >
            ← voltar ao mural
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#ede8df]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <Navigation />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">

        {/* Navigation bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate("/trilha")}
            className="rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm font-semibold text-stone-600 shadow-sm backdrop-blur-sm transition hover:bg-white"
          >
            ← voltar ao mural
          </button>
          <div className="flex gap-2">
            {prevUnit ? (
              <button
                onClick={() => navigate(`/trilha/${prevUnit.unitId}`)}
                className="rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition hover:opacity-80"
                style={{ borderColor: tone.border, color: tone.tabText, background: tone.header }}
              >
                ← anterior
              </button>
            ) : (
              <span className="rounded-full border border-stone-200 bg-white/40 px-4 py-2 text-sm font-semibold text-stone-300">
                ← anterior
              </span>
            )}
            {nextUnit ? (
              <button
                onClick={() => navigate(`/trilha/${nextUnit.unitId}`)}
                className="rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition hover:opacity-80"
                style={{ borderColor: tone.border, color: tone.tabText, background: tone.header }}
              >
                próxima →
              </button>
            ) : (
              <span className="rounded-full border border-stone-200 bg-white/40 px-4 py-2 text-sm font-semibold text-stone-300">
                próxima →
              </span>
            )}
          </div>
        </div>

        {/* ═══ FICHÁRIO / BINDER ═══ */}
        <div
          className="flex overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.10)]"
        >
          {/* ── BINDER SPINE ── */}
          <div
            className="flex w-14 flex-shrink-0 flex-col items-center justify-around py-10"
            style={{
              background: `linear-gradient(180deg, ${tone.spineLight} 0%, ${tone.spine} 50%, ${tone.spineLight} 100%)`,
              boxShadow: "inset -3px 0 8px rgba(0,0,0,0.25), inset 3px 0 4px rgba(255,255,255,0.12)",
            }}
          >
            {/* Spine label (rotated) */}
            <span
              className="mb-4 block text-[9px] font-extrabold uppercase tracking-[0.3em] opacity-70"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                color: "rgba(255,255,255,0.85)",
                letterSpacing: "0.28em",
              }}
            >
              {groupName(personalidade)}
            </span>

            {/* Ring clips */}
            <div className="flex flex-col gap-6">
              {[0, 1, 2].map((i) => (
                <RingClip key={i} color="rgba(255,255,255,0.65)" />
              ))}
            </div>
          </div>

          {/* ── PAPER AREA ── */}
          <div
            className="flex-1 space-y-4 p-5 md:p-7"
            style={{ background: "#f8f4ee" }}
          >

            {/* ── CAPA: Title ficha ── */}
            <Ficha tone={tone} label={unitId}>
              <div className="flex items-start gap-4">
                <div
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[14px] text-3xl font-black shadow-sm"
                  style={{ background: tone.tab, color: tone.tabText }}
                >
                  {unitNum.toString().padStart(2, "0")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.22em]" style={{ color: tone.spineLight }}>
                    {groupName(personalidade)} · {emojiFor(personalidade)} · ⏱ {unidade.duration}
                  </p>
                  <h1 className="text-2xl font-extrabold leading-tight text-slate-800 md:text-3xl">
                    {unidade.title}
                  </h1>
                  <p className="mt-1.5 text-sm leading-6 text-slate-500">{unidade.subtitle}</p>
                </div>
              </div>
            </Ficha>

            {/* ── INTRO + EMENTA ── */}
            <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
              <Ficha tone={tone} label="leitura principal">
                <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: tone.spineLight }}>
                  introdução
                </p>
                <p className="text-sm leading-7 text-slate-700">
                  {unidade.intro || "Esta unidade apresenta conceitos fundamentais para a gestão financeira escolar de forma prática e acessível."}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-[12px] border p-3" style={{ background: tone.header, borderColor: tone.border }}>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: tone.tabText }}>olhar geral</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Liga o conteúdo à rotina concreta da escola.</p>
                  </div>
                  <div className="rounded-[12px] border p-3" style={{ background: tone.header, borderColor: tone.border }}>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: tone.tabText }}>pergunta-chave</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">O que a diretora precisa enxergar para decidir melhor?</p>
                  </div>
                </div>
              </Ficha>

              <div className="flex flex-col gap-4">
                <Ficha tone={tone} label="ementa">
                  <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: tone.spineLight }}>ementa</p>
                  <p className="text-sm leading-6 text-slate-600">
                    {sections[0]
                      ? typeof sections[0].conteudo === "string"
                        ? sections[0].conteudo
                        : Array.isArray(sections[0].conteudo)
                        ? sections[0].conteudo[0]
                        : ""
                      : unidade.subtitle}
                  </p>
                </Ficha>
                <Ficha tone={tone} label="vídeo" accent={tone.accent}>
                  <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: tone.spineLight }}>vídeo sugerido</p>
                  <div className="flex items-center gap-3 rounded-[12px] border p-2.5" style={{ borderColor: tone.border, background: tone.header }}>
                    <span className="text-2xl">🎬</span>
                    <p className="text-xs leading-5 text-slate-500">Vídeo sobre {unidade.title.toLowerCase()}</p>
                  </div>
                </Ficha>
              </div>
            </div>

            {/* ── DB SECTIONS ── */}
            {sections.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {sections.slice(0, 4).map((sec, idx) => (
                  <Ficha key={idx} tone={tone} label={sec.titulo || `seção ${idx + 1}`} rotate={idx % 2 === 0 ? -0.4 : 0.5}>
                    <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: tone.spineLight }}>
                      {sec.titulo || `seção ${idx + 1}`}
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      {typeof sec.conteudo === "string"
                        ? sec.conteudo
                        : Array.isArray(sec.conteudo)
                        ? sec.conteudo.join(" · ")
                        : ""}
                    </p>
                  </Ficha>
                ))}
              </div>
            )}

            {/* ── OBSERVAR + PASSOS ── */}
            <div className="grid gap-4 md:grid-cols-2">
              <Ficha tone={tone} label="o que observar" rotate={-0.5}>
                <ul className="space-y-2 text-sm leading-6 text-slate-600">
                  {["Se a equipe compreende a lógica geral da unidade.", "Se existem registros claros para consulta futura.", "Se o conteúdo já conversa com a rotina da escola."].map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: tone.accent }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Ficha>
              <Ficha tone={tone} label="próximos passos" rotate={0.5}>
                <ul className="space-y-2 text-sm leading-6 text-slate-600">
                  {["Relacionar esta unidade à próxima da trilha.", "Usar a ficha longa em reunião interna.", "Criar um apoio visual próprio para a equipe."].map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: tone.accent }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Ficha>
            </div>

            {/* ── FICHAS DE APROFUNDAMENTO — deck empilhado ── */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${tone.border}, transparent)` }} />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.22em]" style={{ color: tone.spineLight }}>
                  fichas de aprofundamento
                </span>
                <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${tone.border}, transparent)` }} />
              </div>
              <FichaStack fichas={FICHAS_APROFUNDAMENTO} tone={tone} onOpen={setOpenFicha} />
            </div>

          </div>
        </div>
      </main>

      {/* Ficha modal */}
      <AnimatePresence>
        {openFicha && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
            onClick={() => setOpenFicha(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex w-full max-w-3xl overflow-hidden rounded-[24px] shadow-[0_30px_80px_rgba(0,0,0,0.25)]"
            >
              {/* Modal spine */}
              <div
                className="flex w-10 flex-shrink-0 flex-col items-center justify-center"
                style={{ background: `linear-gradient(180deg, ${tone.spineLight}, ${tone.spine})` }}
              >
                <div className="flex flex-col gap-5">
                  {[0, 1, 2].map((i) => (
                    <RingClip key={i} color="rgba(255,255,255,0.6)" />
                  ))}
                </div>
              </div>
              {/* Modal content */}
              <div className="flex-1 bg-[#f8f4ee] p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.22em]" style={{ color: tone.spineLight }}>
                      ficha aberta
                    </p>
                    <h3 className="mt-1 text-xl font-extrabold text-slate-800">
                      {FICHAS_APROFUNDAMENTO.find((f) => f.id === openFicha)?.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setOpenFicha(null)}
                    className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm font-semibold text-stone-500 shadow-sm transition hover:bg-stone-50"
                  >
                    fechar ×
                  </button>
                </div>
                <div
                  className="max-h-[60vh] space-y-4 overflow-auto rounded-[16px] border p-5 text-sm leading-8 text-slate-700"
                  style={{ background: "#fff", borderColor: tone.border }}
                >
                  {/* Left margin line */}
                  <div className="relative pl-6">
                    <div
                      className="absolute left-0 top-0 bottom-0 w-px"
                      style={{ background: `${tone.accent}88` }}
                    />
                    {FICHAS_APROFUNDAMENTO.find((f) => f.id === openFicha)?.paragraphs.map((p, i) => (
                      <p key={i} className="mb-3">{p}</p>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
