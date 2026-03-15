import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Loader2 } from "lucide-react";
import type { TrilhaUnit } from "@shared/schema";

const GROUPS = [
  {
    id: "origem",
    titulo: "De onde vêm os recursos",
    personalidade: "origem" as const,
    descricao:
      "O começo da jornada: entender as fontes de financiamento, os programas e o tempo dos repasses que chegam à escola.",
    range: [1, 4],
  },
  {
    id: "estrutura",
    titulo: "Estrutura administrativa",
    personalidade: "estrutura" as const,
    descricao:
      "Aqui a diretora encontra os pilares formais que sustentam a gestão: unidade executora, estatuto, cartório, conta e responsabilidades.",
    range: [5, 11],
  },
  {
    id: "planejamento",
    titulo: "Planejamento e uso dos recursos",
    personalidade: "planejamento" as const,
    descricao:
      "Uma trilha para transformar recurso em ação concreta: planejar, comprar, registrar e manter tudo bem organizado.",
    range: [12, 15],
  },
  {
    id: "prestacao",
    titulo: "Prestação de contas e continuidade",
    personalidade: "prestacao" as const,
    descricao:
      "A etapa que garante memória, transparência, participação e segurança na passagem de uma gestão para outra.",
    range: [16, 20],
  },
];

const toneMap = {
  origem: {
    section: "bg-[#f7fbff] border-sky-100",
    chip: "bg-sky-100 text-sky-800",
    title: "text-sky-950",
    button: "border-sky-200 text-sky-800 hover:bg-sky-50",
    accent: "bg-sky-100",
    page: "bg-[#f8fcff] border-sky-200",
  },
  estrutura: {
    section: "bg-[#fffaf2] border-amber-100",
    chip: "bg-amber-100 text-amber-900",
    title: "text-amber-950",
    button: "border-amber-200 text-amber-900 hover:bg-amber-50",
    accent: "bg-amber-100",
    page: "bg-[#fff9ef] border-amber-200",
  },
  planejamento: {
    section: "bg-[#f7fff9] border-emerald-100",
    chip: "bg-emerald-100 text-emerald-900",
    title: "text-emerald-950",
    button: "border-emerald-200 text-emerald-900 hover:bg-emerald-50",
    accent: "bg-emerald-100",
    page: "bg-[#f7fff9] border-emerald-200",
  },
  prestacao: {
    section: "bg-[#fff8fc] border-rose-100",
    chip: "bg-rose-100 text-rose-900",
    title: "text-rose-950",
    button: "border-rose-200 text-rose-900 hover:bg-rose-50",
    accent: "bg-rose-100",
    page: "bg-[#fff8fc] border-rose-200",
  },
};

function unitNum(unit: TrilhaUnit) {
  return parseInt(unit.unitId.replace("U", ""), 10);
}

function getPersonalidade(unit: TrilhaUnit): keyof typeof toneMap {
  const n = unitNum(unit);
  if (n <= 4) return "origem";
  if (n <= 11) return "estrutura";
  if (n <= 15) return "planejamento";
  return "prestacao";
}

function emojiFor(personalidade: keyof typeof toneMap) {
  return personalidade === "origem"
    ? "💧"
    : personalidade === "estrutura"
    ? "📁"
    : personalidade === "planejamento"
    ? "🗂️"
    : "📝";
}

export default function Trilha() {
  const [pinned, setPinned] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const { data: units = [], isLoading } = useQuery<TrilhaUnit[]>({
    queryKey: ["/api/trilha"],
  });

  const groups = useMemo(
    () =>
      GROUPS.map((g) => ({
        ...g,
        items: units.filter((u) => {
          const n = unitNum(u);
          return n >= g.range[0] && n <= g.range[1];
        }),
      })),
    [units]
  );

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

  return (
    <div className="min-h-screen bg-[#f6f0e6] text-slate-700 flex flex-col">
      <Navigation />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 font-['Nunito','Quicksand',sans-serif] md:px-10 lg:px-12">
        {/* Hero */}
        <section className="relative mb-10 overflow-hidden rounded-[34px] border border-[#dcccb4] bg-[#fff9ef] p-8 shadow-[0_20px_70px_rgba(123,84,45,0.12)] md:p-12">
          <div className="absolute right-8 top-6 rounded-full border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm">
            guia visual da diretora
          </div>
          <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-900">
                <span>🗺️</span> mapa das unidades
              </p>
              <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-slate-800 md:text-6xl">
                Trilha da Diretora
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#617285] md:text-xl">
                Um mural visual para navegar pelas unidades do{" "}
                <span className="font-semibold text-slate-700">
                  Chegou a Conta, Diretora
                </span>
                .
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {["20 unidades", "4 trilhas", "visual de mural", "navegação afetiva"].map(
                  (chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#6f8094] shadow-sm"
                    >
                      {chip}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Mini-map */}
            <div className="rounded-[34px] border-[10px] border-slate-900/10 bg-[#fffaf2] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.12)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-rose-300" />
                  <div className="h-4 w-4 rounded-full bg-amber-300" />
                  <div className="h-4 w-4 rounded-full bg-emerald-300" />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                  visão geral
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {groups.map((g, idx) => {
                  const tone = toneMap[g.personalidade];
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() =>
                        document
                          .getElementById(`trilha-${g.id}`)
                          ?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }
                      className={`rounded-[24px] border border-white/80 p-4 text-left shadow-[0_10px_24px_rgba(0,0,0,0.06)] transition hover:-translate-y-1 ${tone.accent}`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-[16px] border border-slate-300 bg-white/90 px-3 py-2 text-lg shadow-sm">
                          {idx + 1}
                        </span>
                        <span className="rounded-full bg-white/75 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                          trilha {idx + 1}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold leading-tight text-slate-700">
                        {g.titulo}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {g.items.length} unidades
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Trilha sections */}
        <section className="space-y-12">
          {groups.map((group, groupIdx) => {
            const tone = toneMap[group.personalidade];
            return (
              <section
                key={group.id}
                id={`trilha-${group.id}`}
                className={`relative overflow-hidden rounded-[34px] border p-6 shadow-[0_18px_44px_rgba(123,84,45,0.12)] md:p-8 ${tone.section}`}
              >
                <div
                  className={`absolute right-6 top-6 rounded-xl border px-3 py-2 text-sm shadow-sm ${tone.chip}`}
                >
                  etapa {groupIdx + 1}
                </div>
                <div
                  className={`absolute left-10 top-6 h-16 w-16 rotate-6 rounded-[18px] opacity-55 ${tone.accent}`}
                />

                <div className="relative mb-8 max-w-3xl pt-8">
                  <p className="mb-3 inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[#8093aa]">
                    mapa da jornada
                  </p>
                  <div className="inline-flex max-w-full rotate-[-1deg] rounded-[18px] border border-white/80 bg-white/92 px-4 py-3 shadow-sm">
                    <h2 className={`text-3xl font-extrabold md:text-4xl ${tone.title}`}>
                      {group.titulo}
                    </h2>
                  </div>
                  <p className="mt-4 text-lg leading-8 text-[#68788d]">{group.descricao}</p>
                </div>

                <div className="relative grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((unit, itemIdx) => {
                    const isPinned = pinned === unit.unitId;
                    const headerLabels = ["anotação da diretora", "guia rápido", "comunicado oficial"];
                    const header = headerLabels[itemIdx % 3];
                    const paperStyle =
                      itemIdx % 3 === 2
                        ? "bg-[repeating-linear-gradient(to_bottom,#ffffff,#ffffff_24px,#e5e7eb_25px)] border-[#e3c9c3]"
                        : "bg-[#fffdf7] border-slate-200";

                    return (
                      <motion.article
                        key={unit.unitId}
                        whileHover={{ y: -2, rotate: itemIdx % 2 === 0 ? -0.35 : 0.35 }}
                        onClick={() =>
                          setPinned((cur) => (cur === unit.unitId ? null : unit.unitId))
                        }
                        className={`cursor-pointer rounded-[26px] border p-5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-200 ${paperStyle} ${isPinned ? "ring-2 ring-offset-2 ring-slate-300" : ""}`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="rounded-[12px] border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500 shadow-sm">
                            {header}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tone.chip}`}>
                            {unit.unitId}
                          </span>
                        </div>

                        <div className="mb-4 mt-1 flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-xl shadow-sm">
                            {emojiFor(group.personalidade)}
                          </div>
                          <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                              unidade {unitNum(unit).toString().padStart(2, "0")}
                            </p>
                          </div>
                        </div>

                        <h3 className="text-lg font-extrabold leading-snug text-slate-700">
                          {unit.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{unit.subtitle}</p>

                        <div className="mt-4 flex items-center justify-between">
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${tone.chip}`}>
                            {unit.duration}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/trilha/${unit.unitId}`);
                            }}
                            className={`rounded-full border px-4 py-1.5 text-sm font-semibold shadow-sm transition ${tone.button}`}
                          >
                            abrir →
                          </button>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </section>

        {/* Footer note */}
        <div className="mt-14 text-center">
          <p className="text-sm text-slate-400">
            20 unidades · 4 trilhas · Chegou a Conta, Diretora
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
