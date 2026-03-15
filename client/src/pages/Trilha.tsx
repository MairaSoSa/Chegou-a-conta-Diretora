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
        <section className="space-y-14">
          {groups.map((group, groupIdx) => {
            const pinColors = ["#e74c3c","#3498db","#2ecc71","#f39c12","#9b59b6","#e67e22","#1abc9c"];
            const rotations = [-3.2, 1.8, -1.5, 2.6, -2.8, 1.2, -0.8, 3.1, -2.2, 1.6];
            const paperVariants = [
              // plain cream
              { bg: "#fffef9", lines: false, borderColor: "#e8ddc8", fold: false },
              // lined
              { bg: "#ffffff", lines: true, borderColor: "#dce3ed", fold: false },
              // warm white with fold
              { bg: "#fdf9f0", lines: false, borderColor: "#e0d5c0", fold: true },
              // faint blue lined
              { bg: "#f8fbff", lines: true, borderColor: "#ccd9ea", fold: false },
              // sticky yellow
              { bg: "#fefce8", lines: false, borderColor: "#e9e083", fold: false },
              // plain white
              { bg: "#ffffff", lines: false, borderColor: "#e2e8f0", fold: true },
              // aged cream
              { bg: "#fdf6e3", lines: true, borderColor: "#d6c89e", fold: false },
            ];

            const tapeColors = ["rgba(255,255,180,0.82)","rgba(200,230,255,0.82)","rgba(255,200,200,0.76)","rgba(200,255,210,0.82)"];

            return (
              <section
                key={group.id}
                id={`trilha-${group.id}`}
                className="relative overflow-hidden rounded-[34px]"
              >
                {/* Cork board background */}
                <div
                  className="absolute inset-0 rounded-[34px]"
                  style={{
                    background: "radial-gradient(ellipse at 30% 40%, #c9a97a 0%, #b8905e 40%, #a67c52 100%)",
                    backgroundImage: `
                      radial-gradient(ellipse at 30% 40%, #c9a97a 0%, #b8905e 40%, #a67c52 100%),
                      url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.8' fill='%23000' opacity='0.04'/%3E%3Ccircle cx='3' cy='3' r='0.8' fill='%23000' opacity='0.04'/%3E%3C/svg%3E")
                    `,
                  }}
                />
                {/* Inner shadow edges for depth */}
                <div className="absolute inset-0 rounded-[34px] shadow-[inset_0_2px_12px_rgba(0,0,0,0.18),inset_0_-2px_8px_rgba(0,0,0,0.10)]" />

                <div className="relative p-6 md:p-10">
                  {/* Section label */}
                  <div className="mb-8 flex items-start gap-4">
                    {/* Title paper */}
                    <div
                      className="relative max-w-xl"
                      style={{ transform: "rotate(-1.2deg)" }}
                    >
                      {/* tape strip on title */}
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 h-5 w-20 rounded-sm"
                        style={{ background: tapeColors[groupIdx % tapeColors.length], boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}
                      />
                      <div
                        className="rounded-xl border border-[#e0d5c0] bg-[#fdf9f0] px-6 py-4"
                        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)" }}
                      >
                        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#a09070]">
                          etapa {groupIdx + 1} · mapa da jornada
                        </p>
                        <h2 className="text-2xl font-extrabold text-slate-800 md:text-3xl">
                          {group.titulo}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#6b7280]">{group.descricao}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cards grid — paper sheets on the board */}
                  <div className="grid gap-x-5 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((unit, itemIdx) => {
                      const isPinned = pinned === unit.unitId;
                      const rot = rotations[itemIdx % rotations.length];
                      const paper = paperVariants[itemIdx % paperVariants.length];
                      const pinColor = pinColors[itemIdx % pinColors.length];
                      const tape = tapeColors[itemIdx % tapeColors.length];
                      const useTape = itemIdx % 2 === 0;

                      return (
                        <motion.div
                          key={unit.unitId}
                          style={{ rotate: rot, transformOrigin: "top center" }}
                          whileHover={{
                            y: -10,
                            rotate: 0,
                            scale: 1.03,
                            zIndex: 20,
                            boxShadow: "0 20px 40px rgba(0,0,0,0.28)",
                          }}
                          animate={isPinned ? { rotate: 0, y: -6, scale: 1.04, zIndex: 20 } : {}}
                          transition={{ type: "spring", stiffness: 280, damping: 22 }}
                          className="relative cursor-pointer"
                          onClick={() =>
                            setPinned((cur) => (cur === unit.unitId ? null : unit.unitId))
                          }
                        >
                          {/* Push pin or tape */}
                          {useTape ? (
                            <div
                              className="absolute -top-3 left-1/2 z-10 h-5 w-16 -translate-x-1/2 rotate-[-1deg] rounded-sm"
                              style={{
                                background: tape,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                              }}
                            />
                          ) : (
                            <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                              <div
                                className="h-6 w-6 rounded-full border-2 border-white/60"
                                style={{
                                  background: pinColor,
                                  boxShadow: `0 2px 6px ${pinColor}88, 0 1px 2px rgba(0,0,0,0.3)`,
                                }}
                              />
                            </div>
                          )}

                          {/* Paper card */}
                          <article
                            className="relative overflow-hidden rounded-sm"
                            style={{
                              background: paper.lines
                                ? `repeating-linear-gradient(to bottom, ${paper.bg} 0px, ${paper.bg} 23px, #d1d9e6 24px)`
                                : paper.bg,
                              borderColor: paper.borderColor,
                              borderWidth: "1px",
                              borderStyle: "solid",
                              boxShadow: isPinned
                                ? "0 16px 36px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.16)"
                                : "0 6px 20px rgba(0,0,0,0.22), 0 2px 4px rgba(0,0,0,0.14)",
                              padding: "20px 18px 18px",
                            }}
                          >
                            {/* Fold corner */}
                            {paper.fold && (
                              <div
                                className="absolute right-0 top-0"
                                style={{
                                  width: 0,
                                  height: 0,
                                  borderStyle: "solid",
                                  borderWidth: "0 28px 28px 0",
                                  borderColor: `transparent ${paper.borderColor} transparent transparent`,
                                }}
                              >
                                <div
                                  className="absolute"
                                  style={{
                                    width: 0, height: 0,
                                    borderStyle: "solid",
                                    borderWidth: "0 26px 26px 0",
                                    borderColor: `transparent #f0ebe0 transparent transparent`,
                                    right: -26, top: 0,
                                  }}
                                />
                              </div>
                            )}

                            {/* Red left margin line */}
                            {paper.lines && (
                              <div
                                className="absolute bottom-0 left-9 top-0 w-px"
                                style={{ background: "rgba(220,80,80,0.25)" }}
                              />
                            )}

                            {/* Header row */}
                            <div className="mb-3 flex items-center justify-between">
                              <span
                                className="rounded px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.16em]"
                                style={{
                                  background: "rgba(0,0,0,0.06)",
                                  color: "#7a6f60",
                                }}
                              >
                                {group.personalidade === "origem"
                                  ? "fonte"
                                  : group.personalidade === "estrutura"
                                  ? "estrutura"
                                  : group.personalidade === "planejamento"
                                  ? "planejamento"
                                  : "prestação"}
                              </span>
                              <span
                                className="font-mono text-[11px] font-bold text-slate-400"
                                style={{ letterSpacing: "0.1em" }}
                              >
                                {unit.unitId}
                              </span>
                            </div>

                            {/* Emoji + number */}
                            <div className="mb-3 flex items-center gap-2">
                              <span className="text-2xl">{emojiFor(group.personalidade)}</span>
                              <span
                                className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                                style={{
                                  background: `${paper.borderColor}88`,
                                  color: "#6b7280",
                                }}
                              >
                                {unitNum(unit).toString().padStart(2, "0")}
                              </span>
                            </div>

                            {/* Title */}
                            <h3
                              className="font-extrabold leading-snug text-slate-800"
                              style={{ fontSize: "1.05rem", fontFamily: "'Nunito', sans-serif" }}
                            >
                              {unit.title}
                            </h3>
                            <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
                              {unit.subtitle}
                            </p>

                            {/* Footer */}
                            <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
                              <span
                                className="text-[11px] font-semibold text-slate-400"
                                style={{ fontFamily: "monospace" }}
                              >
                                ⏱ {unit.duration}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/trilha/${unit.unitId}`);
                                }}
                                className="rounded-full border px-3.5 py-1 text-[12px] font-bold shadow-sm transition hover:shadow-md"
                                style={{
                                  borderColor: paper.borderColor,
                                  background: "rgba(255,255,255,0.8)",
                                  color: "#374151",
                                }}
                              >
                                abrir →
                              </button>
                            </div>
                          </article>
                        </motion.div>
                      );
                    })}
                  </div>
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
