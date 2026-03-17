import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useLocation } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Loader2 } from "lucide-react";
import type { TrilhaUnit } from "@shared/schema";

// Magnetic pin disc — round, flat, like a fridge magnet / whiteboard pin
function Pin({ color, dark, size = 32 }: { color: string; dark: string; size?: number }) {
  const id = color.replace("#", "mg");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter:
          "drop-shadow(0 4px 7px rgba(0,0,0,0.40)) drop-shadow(0 1px 2px rgba(0,0,0,0.28))",
        overflow: "visible",
      }}
    >
      <defs>
        {/* Outer ring in the pin's own color (no chrome/gray) */}
        <radialGradient id={`cr-${id}`} cx="35%" cy="28%" r="72%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="28%"  stopColor={color} />
          <stop offset="75%"  stopColor={color} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
        {/* Colored inner face gradient */}
        <radialGradient id={`fc-${id}`} cx="36%" cy="30%" r="68%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="25%"  stopColor={color} />
          <stop offset="80%"  stopColor={color} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
        {/* Chrome ring inner-shadow (bevel under inner disc) */}
        <radialGradient id={`bv-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="82%"  stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
        </radialGradient>
      </defs>

      {/* Soft elliptical shadow cast on the cork */}
      <ellipse cx="17" cy="30.5" rx="12" ry="2.8" fill="rgba(0,0,0,0.22)" />

      {/* Chrome outer disc */}
      <circle cx="16" cy="15" r="14" fill={`url(#cr-${id})`} />

      {/* Colored inner face */}
      <circle cx="16" cy="15" r="10.5" fill={`url(#fc-${id})`} />

      {/* Bevel shadow between chrome ring and inner face */}
      <circle cx="16" cy="15" r="10.5" fill={`url(#bv-${id})`} />

      {/* Thin groove line separating chrome from color */}
      <circle cx="16" cy="15" r="10.5" stroke="rgba(0,0,0,0.18)" strokeWidth="0.7" fill="none" />

      {/* Outer chrome rim edge */}
      <circle cx="16" cy="15" r="14" stroke="rgba(0,0,0,0.12)" strokeWidth="0.5" fill="none" />

      {/* Main specular highlight on chrome (top-left arc) */}
      <ellipse
        cx="9"
        cy="7.5"
        rx="5"
        ry="3"
        fill="rgba(255,255,255,0.70)"
        transform="rotate(-30 9 7.5)"
        style={{ filter: "blur(0.8px)" }}
      />

      {/* Secondary glint on inner colored face */}
      <ellipse
        cx="11.5"
        cy="10"
        rx="3"
        ry="1.8"
        fill="rgba(255,255,255,0.42)"
        transform="rotate(-25 11.5 10)"
        style={{ filter: "blur(0.4px)" }}
      />

      {/* Tiny chrome bottom glint (light reflected from below) */}
      <ellipse cx="22" cy="22.5" rx="1.8" ry="0.9" fill="rgba(255,255,255,0.20)" />
    </svg>
  );
}

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
  const [, navigate] = useLocation();
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null);

  const { data: units = [], isLoading } = useQuery<TrilhaUnit[]>({
    queryKey: ["/api/trilha"],
  });
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

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
          <div className="hidden sm:block absolute right-8 top-6 rounded-full border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm">
            guia visual da diretora
          </div>
          <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-900">
                <span>🗺️</span> mapa das unidades
              </p>
              <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-slate-800 md:text-6xl">
                {settings?.trilha_titulo || "Trilha da Diretora"}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#617285] md:text-xl">
                {settings?.trilha_desc || <>Um mural visual para navegar pelas unidades do{" "}<span className="font-semibold text-slate-700">Chegou a Conta, Diretora</span>.</>}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            // Bilhete de recado color schemes
            const memoVariants = [
              { header: "#fce8ed", body: "#fff7f9", border: "#f4c5d0", stripe: "#e88fa3", lines: false },
              { header: "#dbeafe", body: "#f8fbff", border: "#bfdbfe", stripe: "#6ea8e8", lines: true  },
              { header: "#fef3c7", body: "#fffdf0", border: "#fde68a", stripe: "#d4a74a", lines: false },
              { header: "#d1fae5", body: "#f0fdf9", border: "#a7f3d0", stripe: "#4aad7e", lines: true  },
              { header: "#ede9fe", body: "#faf8ff", border: "#ddd6fe", stripe: "#9177e0", lines: false },
              { header: "#fee2e2", body: "#fff8f8", border: "#fecaca", stripe: "#dc7a7a", lines: false },
              { header: "#e0f2fe", body: "#f8fcff", border: "#bae6fd", stripe: "#5aadcf", lines: true  },
            ];

            const tapeColors = ["rgba(255,255,180,0.82)","rgba(200,230,255,0.82)","rgba(255,200,200,0.76)","rgba(200,255,210,0.82)"];

            return (
              <section
                key={group.id}
                id={`trilha-${group.id}`}
                className="relative overflow-hidden rounded-[34px]"
              >
                {/* Cork board base color */}
                <div
                  className="absolute inset-0 rounded-[34px]"
                  style={{
                    background: "radial-gradient(ellipse at 28% 38%, #d4a96a 0%, #b8865a 45%, #9e7045 100%)",
                  }}
                />
                {/* Grain texture overlay via SVG feTurbulence */}
                <svg
                  className="absolute inset-0 w-full h-full rounded-[34px] pointer-events-none"
                  style={{ opacity: 0.22, mixBlendMode: "multiply" }}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <filter id={`cork-grain-${groupIdx}`} x="0%" y="0%" width="100%" height="100%">
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.72 0.52"
                      numOctaves="4"
                      seed={groupIdx * 7 + 3}
                      stitchTiles="stitch"
                    />
                    <feColorMatrix type="saturate" values="0.4" />
                  </filter>
                  <rect width="100%" height="100%" filter={`url(#cork-grain-${groupIdx})`} />
                </svg>
                {/* Cork fiber lines (horizontal streaks) */}
                <svg
                  className="absolute inset-0 w-full h-full rounded-[34px] pointer-events-none"
                  style={{ opacity: 0.09 }}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <filter id={`cork-fiber-${groupIdx}`}>
                    <feTurbulence type="turbulence" baseFrequency="0.01 0.8" numOctaves="2" seed={groupIdx + 12} stitchTiles="stitch"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.18  0 0 0 0 0.06  0 0 0 1 0" />
                  </filter>
                  <rect width="100%" height="100%" filter={`url(#cork-fiber-${groupIdx})`} />
                </svg>
                {/* Inner shadow edges for depth */}
                <div className="absolute inset-0 rounded-[34px] shadow-[inset_0_3px_16px_rgba(0,0,0,0.22),inset_0_-3px_10px_rgba(0,0,0,0.14)]" />

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

                  {/* Cards grid */}
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((unit, itemIdx) => {
                      const card = memoVariants[itemIdx % memoVariants.length];
                      const isHovered = hoveredUnit === unit.unitId;
                      const unitNum = parseInt(unit.unitId.replace("U", ""), 10);

                      return (
                        <div
                          key={unit.unitId}
                          className="relative cursor-pointer"
                          onMouseEnter={() => setHoveredUnit(unit.unitId)}
                          onMouseLeave={() => setHoveredUnit(null)}
                          onClick={() => navigate(`/trilha/${unit.unitId}`)}
                          style={{
                            transform: `translateY(${isHovered ? -8 : 0}px)`,
                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                          }}
                        >
                          <article
                            style={{
                              borderRadius: "16px",
                              background: "#fff",
                              border: `1.5px solid ${card.border}`,
                              boxShadow: isHovered
                                ? `0 16px 40px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.10)`
                                : `0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)`,
                              transition: "box-shadow 0.2s ease",
                              overflow: "hidden",
                            }}
                          >
                            {/* Colored top band with number */}
                            <div
                              style={{
                                background: `linear-gradient(135deg, ${card.stripe} 0%, ${card.header} 100%)`,
                                padding: "14px 18px 12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div
                                  style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.28)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 900,
                                    fontSize: "1rem",
                                    color: "#fff",
                                    flexShrink: 0,
                                    backdropFilter: "blur(4px)",
                                  }}
                                >
                                  {unitNum}
                                </div>
                                <span
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.18em",
                                    color: "rgba(255,255,255,0.85)",
                                  }}
                                >
                                  {emojiFor(group.personalidade)}&nbsp;
                                  {group.personalidade === "origem" ? "Fontes" : group.personalidade === "estrutura" ? "Estrutura" : group.personalidade === "planejamento" ? "Planejamento" : "Prestação"}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  color: "rgba(255,255,255,0.75)",
                                  fontFamily: "monospace",
                                }}
                              >
                                {unit.unitId}
                              </span>
                            </div>

                            {/* Body */}
                            <div style={{ padding: "16px 18px 14px", background: card.body }}>
                              <h3
                                style={{
                                  fontFamily: "'Nunito', sans-serif",
                                  fontWeight: 900,
                                  fontSize: "1rem",
                                  lineHeight: 1.3,
                                  color: "#1e293b",
                                  marginBottom: 6,
                                }}
                              >
                                {unit.title}
                              </h3>
                              <p
                                style={{
                                  fontSize: "12px",
                                  lineHeight: 1.5,
                                  color: "#64748b",
                                  marginBottom: 14,
                                }}
                              >
                                {unit.subtitle}
                              </p>

                              {/* Footer */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  paddingTop: 10,
                                  borderTop: `1px solid ${card.border}`,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: card.stripe,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  ⏱ {unit.duration}
                                </span>
                                <span
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: card.stripe,
                                    opacity: isHovered ? 1 : 0.55,
                                    transition: "opacity 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  ler unidade →
                                </span>
                              </div>
                            </div>
                          </article>
                        </div>
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
