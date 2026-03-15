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
    section: "bg-[#f7fbff] border-sky-100",
    chip: "bg-sky-100 text-sky-800",
    title: "text-sky-950",
    button: "border-sky-200 text-sky-800 hover:bg-sky-50",
    accent: "bg-sky-100",
    page: "bg-[#f8fcff] border-sky-200",
    flow: "bg-sky-50 border-sky-100",
  },
  estrutura: {
    section: "bg-[#fffaf2] border-amber-100",
    chip: "bg-amber-100 text-amber-900",
    title: "text-amber-950",
    button: "border-amber-200 text-amber-900 hover:bg-amber-50",
    accent: "bg-amber-100",
    page: "bg-[#fff9ef] border-amber-200",
    flow: "bg-amber-50 border-amber-100",
  },
  planejamento: {
    section: "bg-[#f7fff9] border-emerald-100",
    chip: "bg-emerald-100 text-emerald-900",
    title: "text-emerald-950",
    button: "border-emerald-200 text-emerald-900 hover:bg-emerald-50",
    accent: "bg-emerald-100",
    page: "bg-[#f7fff9] border-emerald-200",
    flow: "bg-emerald-50 border-emerald-100",
  },
  prestacao: {
    section: "bg-[#fff8fc] border-rose-100",
    chip: "bg-rose-100 text-rose-900",
    title: "text-rose-950",
    button: "border-rose-200 text-rose-900 hover:bg-rose-50",
    accent: "bg-rose-100",
    page: "bg-[#fff8fc] border-rose-200",
    flow: "bg-rose-50 border-rose-100",
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

const FICHAS = [
  {
    id: "leitura",
    tab: "leitura",
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
    tab: "prática",
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
    tab: "conversa",
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f6f0e6]">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!unidade) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f6f0e6]">
        <Navigation />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
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
    <div className="min-h-screen bg-[#f6f0e6] text-slate-700 flex flex-col">
      <Navigation />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 font-['Nunito','Quicksand',sans-serif] md:px-10 lg:px-12">
        {/* Nav bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate("/trilha")}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#6f8094] shadow-sm hover:bg-slate-50 transition"
          >
            ← voltar ao mural
          </button>
          <div className="flex gap-2">
            {prevUnit ? (
              <button
                onClick={() => navigate(`/trilha/${prevUnit.unitId}`)}
                className={`rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition ${tone.button}`}
              >
                ← anterior
              </button>
            ) : (
              <span className="rounded-full border border-slate-100 bg-white/50 px-4 py-2 text-sm font-medium text-slate-300 shadow-sm">
                ← anterior
              </span>
            )}
            {nextUnit ? (
              <button
                onClick={() => navigate(`/trilha/${nextUnit.unitId}`)}
                className={`rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition ${tone.button}`}
              >
                próxima →
              </button>
            ) : (
              <span className="rounded-full border border-slate-100 bg-white/50 px-4 py-2 text-sm font-medium text-slate-300 shadow-sm">
                próxima →
              </span>
            )}
          </div>
        </div>

        {/* Unit page card */}
        <section
          className={`relative overflow-hidden rounded-[34px] border p-8 shadow-[0_20px_70px_rgba(123,84,45,0.12)] md:p-10 ${tone.page}`}
        >
          {/* top tab decoration */}
          <div className="absolute left-1/2 top-0 h-7 w-40 -translate-x-1/2 rounded-b-[20px] border border-white/70 bg-white/75 shadow-sm" />
          <div className={`absolute right-8 top-8 h-16 w-16 rotate-6 rounded-[18px] opacity-55 ${tone.accent}`} />

          <div className="relative grid gap-8 xl:grid-cols-[0.78fr_1.22fr]">
            {/* Aside: unit identity */}
            <aside className="rounded-[28px] border border-white/80 bg-[#fffdf7] p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-slate-200 bg-white text-2xl shadow-sm">
                  {emojiFor(personalidade)}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                    unidade {unitNum.toString().padStart(2, "0")}
                  </p>
                  <p className="text-sm font-semibold text-slate-600">{unitId}</p>
                  <p className="mt-1 text-xs text-slate-400">{groupName(personalidade)}</p>
                </div>
              </div>

              {/* Visual placeholder */}
              <div className="rounded-[20px] border border-white/80 bg-white/78 p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                    visual da unidade
                  </span>
                  <span className="text-3xl">📓</span>
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-4/5 rounded-full bg-slate-200" />
                  <div className="h-2 w-3/4 rounded-full bg-slate-200" />
                  <div className="h-2 w-2/3 rounded-full bg-slate-200" />
                </div>
              </div>

              <div className="mt-4 rounded-[18px] border border-white/80 bg-[#fffdf7] p-4 text-[14px] leading-6 text-slate-600 shadow-sm">
                <span className="font-semibold">Nesta unidade:</span> visão geral, leitura guiada,
                materiais de apoio e fichas longas para consulta.
              </div>

              {/* Fichas */}
              <div className="mt-5 space-y-3">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                  fichas de aprofundamento
                </p>
                {FICHAS.map((ficha) => (
                  <button
                    key={ficha.id}
                    type="button"
                    onClick={() => setOpenFicha(ficha.id)}
                    className={`w-full rounded-[18px] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 ${tone.flow}`}
                  >
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                      {ficha.tab}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{ficha.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{ficha.preview}</p>
                  </button>
                ))}
              </div>
            </aside>

            {/* Main content */}
            <section className="relative min-w-0">
              {/* Title */}
              <div className="relative inline-flex max-w-full rotate-[-1deg] rounded-[16px] border border-white/80 bg-[#fffdf7] px-4 py-2 shadow-sm">
                <div className="absolute -top-3 left-6 h-5 w-16 rotate-[-4deg] rounded-sm border border-white/70 bg-white/75" />
                <h1 className="text-3xl font-extrabold leading-tight text-slate-700 md:text-4xl">
                  {unidade.title}
                </h1>
              </div>
              <p className="mt-4 max-w-3xl text-lg font-medium leading-8 text-slate-600">
                {unidade.subtitle}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full border border-slate-200 bg-[#fffdf7] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  leitura completa da unidade
                </div>
                <div className={`inline-flex rotate-[1deg] rounded-[14px] border border-white/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] shadow-sm ${tone.chip}`}>
                  {unidade.duration}
                </div>
              </div>

              <div className="mt-8 grid gap-5">
                {/* Intro + key panels */}
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <section className="rounded-[24px] border border-white/80 bg-white/78 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                        leitura principal
                      </div>
                      <div className="hidden md:block rounded-[16px] border bg-white/88 px-3 py-2 text-[11px] font-semibold shadow-sm text-slate-500">
                        olhe esta unidade como uma peça do todo
                      </div>
                    </div>
                    <p className="text-base leading-8 text-slate-700">
                      {unidade.intro ||
                        "Esta unidade apresenta conceitos fundamentais para a gestão financeira escolar de forma prática e acessível."}
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[18px] border border-slate-200 bg-[#fffdf8] p-4 shadow-sm">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                          olhar geral
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Ajuda a ligar o conteúdo da unidade à rotina concreta da escola.
                        </p>
                      </div>
                      <div className="rounded-[18px] border border-slate-200 bg-[#fffdf8] p-4 shadow-sm">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                          pergunta-chave
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          O que a diretora precisa enxergar com clareza para tomar decisões melhores?
                        </p>
                      </div>
                    </div>
                  </section>

                  <div className="grid gap-4">
                    {/* Ementa */}
                    <section className="rounded-[24px] border border-white/80 bg-white/94 p-4 shadow-sm">
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                        ementa
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {(() => {
                          const sections = (unidade.sections || []) as Array<{
                            tipo: string;
                            titulo: string;
                            conteudo: string | string[];
                          }>;
                          const first = sections[0];
                          return first
                            ? typeof first.conteudo === "string"
                              ? first.conteudo
                              : Array.isArray(first.conteudo)
                              ? first.conteudo[0]
                              : ""
                            : unidade.subtitle;
                        })()}
                      </p>
                    </section>

                    {/* Video suggestion */}
                    <section className={`rounded-[24px] border p-4 shadow-sm ${tone.flow}`}>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                        vídeo sugerido
                      </p>
                      <div className="mt-3 flex items-center gap-3 rounded-[16px] border border-white/80 bg-white/80 px-3 py-2 shadow-sm">
                        <span className="text-xl">🎬</span>
                        <p className="text-sm leading-5 text-slate-600">
                          Vídeo explicativo sobre {unidade.title.toLowerCase()}
                        </p>
                      </div>
                    </section>
                  </div>
                </div>

                {/* Sections from DB */}
                {(() => {
                  const sections = (unidade.sections || []) as Array<{
                    tipo: string;
                    titulo: string;
                    conteudo: string | string[];
                  }>;
                  if (sections.length === 0) return null;
                  return (
                    <div className="grid gap-5 md:grid-cols-2">
                      {sections.slice(0, 4).map((sec, idx) => (
                        <div
                          key={idx}
                          className="rounded-[22px] border border-slate-200 bg-white/78 p-4 shadow-sm"
                        >
                          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                            {sec.titulo || `seção ${idx + 1}`}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {typeof sec.conteudo === "string"
                              ? sec.conteudo
                              : Array.isArray(sec.conteudo)
                              ? sec.conteudo.join(" · ")
                              : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* What to observe + next steps */}
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-[20px] border border-slate-200 bg-white/78 p-4 shadow-sm">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                      o que observar
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                      <li className="flex gap-2">
                        <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                        <span>Se a equipe compreende a lógica geral da unidade.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                        <span>Se existem registros claros para consulta futura.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                        <span>Se o conteúdo já conversa com a rotina da escola.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-[20px] border border-slate-200 bg-white/78 p-4 shadow-sm">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                      próximos passos
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                      <li className="flex gap-2">
                        <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                        <span>Relacionar esta unidade à próxima da trilha.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                        <span>Usar a ficha longa em reunião interna.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                        <span>Criar um apoio visual próprio para a equipe.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>

        {/* Ficha modal */}
        <AnimatePresence>
          {openFicha && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm"
              onClick={() => setOpenFicha(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full max-w-4xl overflow-hidden rounded-[30px] border p-6 shadow-[0_30px_80px_rgba(0,0,0,0.22)] ${tone.page}`}
              >
                <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                      ficha aberta
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold leading-tight text-slate-700">
                      {FICHAS.find((f) => f.id === openFicha)?.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setOpenFicha(null)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#6f8094] shadow-sm hover:bg-slate-50 transition"
                  >
                    fechar
                  </button>
                </div>
                <div className="max-h-[68vh] space-y-5 overflow-auto rounded-[22px] border border-white/80 bg-[#fffdf7] p-6 text-[15px] leading-8 text-slate-600 shadow-sm">
                  {FICHAS.find((f) => f.id === openFicha)?.paragraphs.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
