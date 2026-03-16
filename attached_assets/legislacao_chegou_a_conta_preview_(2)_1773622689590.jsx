import { useState } from "react";

function HandDrawnIcon({ children, className = "h-7 w-7" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} overflow-visible`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g className="icon-sketch text-[#4f5b45]">{children}</g>
    </svg>
  );
}

export default function LegislacaoEducacionalPage() {
  const [activeTab, setActiveTab] = useState("normas");
  const categorias = [
    {
      icon: (
        <HandDrawnIcon>
          <circle cx="12" cy="12" r="8.2" strokeDasharray="58" strokeDashoffset="58" style={{ animationDelay: "0.02s" }} />
          <path d="M8 12.1c1.3.1 2.7.1 4 .1 1.5 0 2.8 0 4-.1" strokeDasharray="9" strokeDashoffset="9" style={{ animationDelay: "0.14s" }} />
          <path d="M12 8.2v7.6" strokeDasharray="8" strokeDashoffset="8" style={{ animationDelay: "0.24s" }} />
          <path d="M11.7 8l.6.2" opacity="0.55" />
        </HandDrawnIcon>
      ),
      title: "Recursos e financiamento",
      count: "12 normas principais",
      note: "PDDE, FUNDEB, repasses e uso do recurso",
      color: "from-[#f4e6a6] to-[#fff7d6]",
      tape: "rotate-[-2deg]",
    },
    {
      icon: (
        <HandDrawnIcon>
          <path d="M6.2 3.6h11.4v16l-1.8-.9-1.8.9-2-1-2 1-1.8-.9-1.8.9z" strokeDasharray="56" strokeDashoffset="56" style={{ animationDelay: "0.04s" }} />
          <path d="M9 8.2h6.1" strokeDasharray="7" strokeDashoffset="7" style={{ animationDelay: "0.18s" }} />
          <path d="M9 12.1h5.4" strokeDasharray="6" strokeDashoffset="6" style={{ animationDelay: "0.26s" }} />
          <path d="M8.7 8l.2.3" opacity="0.5" />
        </HandDrawnIcon>
      ),
      title: "Prestação de contas",
      count: "8 normas principais",
      note: "transparência, documentação e cuidados",
      color: "from-[#dcead7] to-[#f3faf0]",
      tape: "rotate-[1deg]",
    },
    {
      icon: (
        <HandDrawnIcon>
          <path d="M4.3 6.1h5.6v13.4H4.3z" strokeDasharray="38" strokeDashoffset="38" style={{ animationDelay: "0.03s" }} />
          <path d="M14.1 6.1h5.6v13.4h-5.6z" strokeDasharray="38" strokeDashoffset="38" style={{ animationDelay: "0.15s" }} />
          <path d="M10.2 7.2v11" strokeDasharray="11" strokeDashoffset="11" style={{ animationDelay: "0.23s" }} />
          <path d="M13.8 7.2v11" strokeDasharray="11" strokeDashoffset="11" style={{ animationDelay: "0.29s" }} />
        </HandDrawnIcon>
      ),
      title: "Currículo e ensino",
      count: "10 normas principais",
      note: "BNCC, diretrizes e organização pedagógica",
      color: "from-[#e8ddf3] to-[#faf5ff]",
      tape: "rotate-[-1deg]",
    },
    {
      icon: (
        <HandDrawnIcon>
          <path d="M3.4 10.2 12 4.4l8.6 5.8" strokeDasharray="21" strokeDashoffset="21" style={{ animationDelay: "0.03s" }} />
          <path d="M5.1 10.2v9.5h13.8v-9.5" strokeDasharray="33" strokeDashoffset="33" style={{ animationDelay: "0.15s" }} />
          <path d="M10.1 19.7v-5.8h3.8v5.8" strokeDasharray="16" strokeDashoffset="16" style={{ animationDelay: "0.25s" }} />
          <path d="M7.2 12.7h.2" opacity="0.5" />
        </HandDrawnIcon>
      ),
      title: "Gestão escolar",
      count: "9 normas principais",
      note: "funcionamento da escola e atribuições da gestão",
      color: "from-[#f1dfd8] to-[#fff8f4]",
      tape: "rotate-[2deg]",
    },
    {
      icon: (
        <HandDrawnIcon>
          <path d="M11.8 8.2c1.8-2.7 5.8-2 6 2 .2 4.8-3 7.7-5.9 7.7-3.1 0-6.2-2.9-6-7.7.2-4 4.1-4.7 5.9-2" strokeDasharray="42" strokeDashoffset="42" style={{ animationDelay: "0.04s" }} />
          <path d="M12.1 6c-.1-1.6 1.2-2.8 2.8-3.1" strokeDasharray="6" strokeDashoffset="6" style={{ animationDelay: "0.18s" }} />
          <path d="M9.4 9.7c.3-.2.6-.3.8-.3" opacity="0.5" />
        </HandDrawnIcon>
      ),
      title: "Alimentação escolar",
      count: "6 normas principais",
      note: "PNAE, compra de alimentos e cardápio",
      color: "from-[#ffe1cf] to-[#fff6ef]",
      tape: "rotate-[-2deg]",
    },
    {
      icon: (
        <HandDrawnIcon>
          <rect x="4.2" y="5.2" width="15.6" height="10.8" rx="2.2" strokeDasharray="44" strokeDashoffset="44" style={{ animationDelay: "0.03s" }} />
          <circle cx="8.1" cy="18" r="1.8" strokeDasharray="12" strokeDashoffset="12" style={{ animationDelay: "0.18s" }} />
          <circle cx="15.9" cy="18" r="1.8" strokeDasharray="12" strokeDashoffset="12" style={{ animationDelay: "0.26s" }} />
          <path d="M6.7 9.1h10.7" strokeDasharray="11" strokeDashoffset="11" style={{ animationDelay: "0.34s" }} />
        </HandDrawnIcon>
      ),
      title: "Transporte escolar",
      count: "5 normas principais",
      note: "PNATE e regras para deslocamento dos estudantes",
      color: "from-[#dce7f6] to-[#f7fbff]",
      tape: "rotate-[1deg]",
    },
  ];

  const cards = [
    // leis fundamentais com link direto para a legislação

    {
      label: "Essencial para a escola",
      labelColor: "bg-[#6b8d57] text-white",
      title: "Lei de Diretrizes e Bases da Educação",
      short: "LDB",
      year: "1996",
      type: "Lei Federal",
      what: "Organiza a educação brasileira e define responsabilidades da União, dos estados, dos municípios e das escolas.",
      why: "Ajuda a entender como a escola se estrutura, como o ensino é organizado e quais princípios orientam a gestão.",
      use: ["organização do ensino", "gestão democrática", "responsabilidades da direção"],
      url: "#",
      border: "border-[#d7c7a3]",
      pin: "bg-[#c95c4b]",
      angle: "rotate-[-1deg]",
    },
    {
      label: "Importante para o financeiro",
      labelColor: "bg-[#d79e39] text-white",
      title: "Programa Dinheiro Direto na Escola",
      short: "PDDE",
      year: "1995",
      type: "Programa Federal",
      what: "Envia recursos diretamente para apoiar pequenas melhorias, materiais e ações pedagógicas da escola.",
      why: "É uma das normas mais consultadas pela gestão quando o assunto é uso correto do dinheiro e prestação de contas.",
      use: ["compras permitidas", "pequenos reparos", "prestação de contas no SIGPC"],
      url: "#",
      border: "border-[#e2c98b]",
      pin: "bg-[#d79e39]",
      angle: "rotate-[1deg]",
    },
    {
      label: "Atenção à execução",
      labelColor: "bg-[#d96b63] text-white",
      title: "Programa Nacional de Alimentação Escolar",
      short: "PNAE",
      year: "1955",
      type: "Programa Federal",
      what: "Regula a alimentação escolar dos estudantes da rede pública e orienta critérios de aquisição e oferta dos alimentos.",
      why: "Impacta compras, cardápio, agricultura familiar e o cuidado diário com a alimentação escolar.",
      use: ["compra da agricultura familiar", "cardápio com nutricionista", "uso do recurso corretamente"],
      url: "#",
      border: "border-[#efc0b7]",
      pin: "bg-[#d96b63]",
      angle: "rotate-[-1deg]",
    },
  ];

  const timeline = [

    { year: "1996", title: "LDB", note: "organiza a educação brasileira" },
    { year: "2001", title: "PNE", note: "metas para a educação" },
    { year: "2007", title: "FUNDEB", note: "financiamento da educação básica" },
    { year: "2014", title: "Novo PNE", note: "planejamento educacional" },
    { year: "2017", title: "BNCC", note: "aprendizagens essenciais" },
    { year: "2020", title: "Novo FUNDEB", note: "financiamento permanente" },
  ];

  const recentChanges = [
    {
      status: "Nova",
      statusColor: "bg-[#dcead7] text-[#4e7a4d]",
      title: "Nova portaria publicada",
      when: "há 5 dias",
      summary: "Define uma orientação recente para execução de programa educacional e pode exigir atenção da gestão escolar.",
      detail: "Vale verificar se a mudança afeta repasses, documentação exigida ou rotinas de acompanhamento.",
    },
    {
      status: "Alterada",
      statusColor: "bg-[#f5e6b8] text-[#8a6a14]",
      title: "Resolução com atualização",
      when: "há 12 dias",
      summary: "Teve mudança em trechos importantes e pode alterar a leitura prática da norma anterior.",
      detail: "A explicação curta ajuda a entender rapidamente o que foi ajustado sem precisar ler tudo de imediato.",
    },
    {
      status: "Revogada",
      statusColor: "bg-[#f3d2cf] text-[#9b4b45]",
      title: "Regra substituída por novo ato",
      when: "há 1 mês",
      summary: "Uma norma anterior deixou de valer ou foi absorvida por regulamentação mais recente.",
      detail: "O ideal é destacar a mudança para evitar consulta em texto desatualizado.",
    },
    {
      status: "Impacto",
      statusColor: "bg-[#dce7f6] text-[#456487]",
      title: "Mudança com efeito na rotina",
      when: "neste mês",
      summary: "A alteração não cria uma lei nova, mas mexe na aplicação prática e merece atenção da escola.",
      detail: "Pode impactar organização documental, execução do recurso ou interpretação de procedimentos.",
    },
  ];

  const normas = [
    {
      title: "Resolução FNDE nº 15/2021",
      type: "Resolução",
      status: "Vigente",
      subject: "PDDE e execução financeira",
      summary: "Traz orientações operacionais importantes para execução e organização de rotinas ligadas aos programas educacionais.",
      url: "#",
    },
    {
      title: "Portaria MEC nº 458/2020",
      type: "Portaria",
      status: "Vigente",
      subject: "Gestão escolar e acompanhamento",
      summary: "Complementa regras administrativas que impactam a gestão escolar e a execução de políticas educacionais.",
      url: "#",
    },
    {
      title: "Decreto nº 11.162/2022",
      type: "Decreto",
      status: "Vigente",
      subject: "Política educacional",
      summary: "Regulamenta aspectos da política educacional e conecta a norma geral com a execução prática.",
      url: "#",
    },
    {
      title: "Instrução Normativa FNDE nº 03/2023",
      type: "Instrução Normativa",
      status: "Vigente",
      subject: "Documentação e conformidade",
      summary: "Detalha procedimentos de execução e organização documental relacionados aos programas educacionais.",
      url: "#",
    },
    {
      title: "Lei de Responsabilidade Fiscal",
      type: "Lei Complementar",
      status: "Vigente",
      subject: "Orçamento e responsabilidade fiscal",
      summary: "Define regras para gestão responsável do orçamento público e limites no uso dos recursos.",
      url: "#",
    },
    {
      title: "Base Nacional Comum Curricular",
      type: "Norma Educacional",
      status: "Vigente",
      subject: "Currículo e planejamento pedagógico",
      summary: "Orienta as aprendizagens essenciais e serve de referência para currículo e planejamento pedagógico.",
      url: "#",
    },
  ];

    return (
    <div className="min-h-screen bg-[#f4efe4] text-[#3f4637]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[34px] border border-[#d9ceb8] bg-[#fbf7ee] shadow-[0_20px_60px_rgba(90,80,50,0.10)]">
          <div className="absolute inset-x-0 top-0 h-14 bg-[repeating-linear-gradient(90deg,#adc09f_0px,#adc09f_90px,#a0b392_90px,#a0b392_180px)] opacity-70" />
          <div className="absolute left-6 top-5 h-4 w-24 rotate-[-4deg] rounded-sm bg-[#d9c289]/70" />
          <div className="absolute right-10 top-6 h-5 w-28 rotate-[6deg] rounded-sm bg-[#b7d0e8]/60" />

          <div className="relative px-5 pb-8 pt-20 sm:px-8 lg:px-10">
            <style>{`
              .icon-sketch > * {
                vector-effect: non-scaling-stroke;
                will-change: stroke-dashoffset, opacity;
                animation: sketch-draw 0.88s ease-out forwards;
                filter: drop-shadow(0.2px 0.4px 0 rgba(79,91,69,0.14));
              }
              .icon-sketch > *:nth-child(odd) {
                transform: rotate(-1.1deg);
                transform-origin: center;
              }
              .icon-sketch > *:nth-child(even) {
                transform: rotate(0.8deg) translateY(0.15px);
                transform-origin: center;
              }
              @keyframes sketch-draw {
                from {
                  stroke-dashoffset: var(--dash, 60);
                  opacity: 0.2;
                }
                70% {
                  opacity: 1;
                }
                to {
                  stroke-dashoffset: 0;
                  opacity: 1;
                }
              }
            `}</style>
            <div className="mb-8 rounded-[28px] border border-[#ddd2bc] bg-[#f6f2e9] p-3 shadow-sm">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("normas")}
                  className={`rounded-[18px] px-5 py-3 text-sm font-black transition ${
                    activeTab === "normas"
                      ? "bg-[#5d7452] text-white shadow-md"
                      : "border border-[#ddd2bc] bg-white text-[#60705d]"
                  }`}
                >
                  <span className="flex items-center gap-2"><HandDrawnIcon className="h-4 w-4"><path d="M4.3 6.1h5.6v13.4H4.3z" strokeDasharray="38" strokeDashoffset="38" style={{ animationDelay: "0.02s" }} /><path d="M14.1 6.1h5.6v13.4h-5.6z" strokeDasharray="38" strokeDashoffset="38" style={{ animationDelay: "0.12s" }} /></HandDrawnIcon>Normas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("diario")}
                  className={`rounded-[18px] px-5 py-3 text-sm font-black transition ${
                    activeTab === "diario"
                      ? "bg-[#5d7452] text-white shadow-md"
                      : "border border-[#ddd2bc] bg-white text-[#60705d]"
                  }`}
                >
                  <span className="flex items-center gap-2"><HandDrawnIcon className="h-4 w-4"><path d="M4.3 4.3h15.4v15.4H4.3z" strokeDasharray="48" strokeDashoffset="48" style={{ animationDelay: "0.02s" }} /><path d="M7.1 8.1h9.9" strokeDasharray="10" strokeDashoffset="10" style={{ animationDelay: "0.13s" }} /><path d="M7.1 12h6.1" strokeDasharray="7" strokeDashoffset="7" style={{ animationDelay: "0.21s" }} /><path d="M7.1 15.9h8.1" strokeDasharray="9" strokeDashoffset="9" style={{ animationDelay: "0.29s" }} /></HandDrawnIcon>Diário Oficial</span>
                </button>
              </div>
            </div>

            {activeTab === "normas" && (
              <>
            <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
              <div>
                <div className="mb-4 inline-flex rotate-[-2deg] items-center gap-2 rounded-full border border-[#d8cdb5] bg-[#fffdf8] px-4 py-2 text-sm shadow-sm"><HandDrawnIcon className="h-4 w-4"><path d="M4.3 6.1h5.6v13.4H4.3z" strokeDasharray="38" strokeDashoffset="38" style={{ animationDelay: "0.04s" }} /><path d="M14.1 6.1h5.6v13.4h-5.6z" strokeDasharray="38" strokeDashoffset="38" style={{ animationDelay: "0.14s" }} /></HandDrawnIcon>Normas</div>
                <h1 className="max-w-3xl text-3xl font-black tracking-tight text-[#40513b] sm:text-5xl">
                  Normas da gestão escolar
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[#5f6659] sm:text-lg">
                  Com as 12 leis fundamentais da educação em destaque, esta aba permite pesquisar por palavras-chave, filtrar por tipo e conferir o status de vigência de cada norma.
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#5e6659]">
                  <span className="rounded-full border border-[#d8cdb5] bg-[#f8f4ea] px-4 py-2 font-semibold">
                    Total no acervo: 4.440 normas
                  </span>
                  <span className="rounded-full border border-[#d8cdb5] bg-[#f8f4ea] px-4 py-2 font-semibold">
                    Fonte: MEC Normas - Ministério da Educação
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {[
                    "prestação de contas",
                    "PDDE",
                    "alimentação escolar",
                    "transporte",
                  ].map((tag) => (
                    <button
                      key={tag}
                      className="rounded-full border border-[#d9ceb8] bg-white px-4 py-2 text-sm font-medium text-[#53604f] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="rotate-[1deg] rounded-[26px] border border-dashed border-[#d8cab1] bg-[#fffaf2] p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-[#c95c4b] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                      Atualizações legislativas
                    </span>
                    <HandDrawnIcon className="h-5 w-5"><path d="M12 3.9c2.4 0 4 1.3 4 3.4 0 1.9-1.2 2.8-2.4 3.4l-.3 4.8-2.5-1.9-2.8 4.3-.9-.7 2.9-4.4-2.4-1.8 4.7-.4c1-.7 2-1.4 2-2.9 0-1.2-.8-2-2.3-2.2z" strokeDasharray="44" strokeDashoffset="44" style={{ animationDelay: "0.06s" }} /></HandDrawnIcon>
                  </div>

                  <div className="grid gap-3">
                    {recentChanges.slice(0, 3).map((item) => (
                      <div
                        key={item.title}
                        className="relative rounded-[18px] border border-[#e7dccd] bg-[#fffdf8] p-3 shadow-sm"
                      >
                        <div className="absolute -top-2 left-4 h-3 w-14 rotate-[-6deg] rounded-sm bg-[#e7d3a4]" />

                        <div className="flex items-center justify-between gap-2">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${item.statusColor}`}>
                            {item.status}
                          </span>
                          <span className="text-[11px] font-semibold text-[#8a8f84]">{item.when}</span>
                        </div>

                        <div className="mt-2 text-sm font-bold text-[#46543f]">{item.title}</div>
                        <div className="mt-1 text-xs leading-5 text-[#5d6558]">{item.summary}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <section className="mt-10">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-10 w-2 rounded-full bg-[#8fa37f]" />
                <div>
                  <h2 className="text-2xl font-black text-[#43513d]">Mapa da legislação da escola</h2>
                  <p className="text-sm text-[#6b7066]">A consulta fica organizada por temas da rotina escolar, para não parecer uma lista solta de normas.</p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {categorias.map((item) => (
                  <article
                    key={item.title}
                    className={`group relative overflow-hidden rounded-[28px] border border-[#d8cab4] bg-gradient-to-br ${item.color} p-5 shadow-[0_8px_18px_rgba(90,80,50,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(90,80,50,0.10)]`}
                  >
                    <div className={`absolute right-4 top-4 h-7 w-20 ${item.tape} rounded-sm bg-[#efe4c7]/85 shadow-sm`} />
                    <div className="relative flex items-start gap-4">
                      <div className="mt-1 text-3xl">{item.icon}</div>
                      <div>
                        <h3 className="text-xl font-black text-[#44533d]">{item.title}</h3>
                        <p className="mt-1 text-sm font-semibold text-[#61715b]">{item.count}</p>
                        <p className="mt-3 text-sm leading-6 text-[#596151]">{item.note}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-12 grid gap-8 xl:grid-cols-2">
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-10 w-2 rounded-full bg-[#d1a43c]" />
                  <div>
                    <h2 className="text-2xl font-black text-[#43513d]">Leis fundamentais</h2>
                    <p className="text-sm text-[#6b7066]">As normas mais importantes aparecem com explicação curta e link direto para a própria legislação.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {cards.map((card) => (
                    <article
                      key={card.title}
                      className={`relative ${card.angle} rounded-[28px] border-2 ${card.border} bg-[#fffdf8] p-6 shadow-[0_16px_40px_rgba(90,80,50,0.10)]`}
                    >
                      <div className={`absolute left-8 top-0 h-5 w-14 -translate-y-1/2 rounded-full ${card.pin} shadow-md`} />
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${card.labelColor}`}>
                            {card.label}
                          </span>
                          <h3 className="mt-3 text-2xl font-black text-[#3f493b]">{card.title}</h3>
                          <div className="mt-2 flex flex-wrap gap-2 text-sm text-[#697062]">
                            <span className="rounded-full bg-[#f3eedf] px-3 py-1">{card.short}</span>
                            <span className="rounded-full bg-[#f3eedf] px-3 py-1">{card.year}</span>
                            <span className="rounded-full bg-[#f3eedf] px-3 py-1">{card.type}</span>
                          </div>
                        </div>
                        <a
                          href={card.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-[#d7cab4] bg-white px-4 py-2 text-sm font-semibold text-[#52604d] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          Abrir lei
                        </a>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div className="rounded-[22px] border border-[#ece3d5] bg-[#fcfaf4] p-4">
                          <div className="text-xs font-black uppercase tracking-[0.15em] text-[#9b7a2c]">O que é</div>
                          <p className="mt-2 text-sm leading-6 text-[#5a6153]">{card.what}</p>
                        </div>
                        <div className="rounded-[22px] border border-[#ece3d5] bg-[#fcfaf4] p-4">
                          <div className="text-xs font-black uppercase tracking-[0.15em] text-[#9b7a2c]">Por que importa</div>
                          <p className="mt-2 text-sm leading-6 text-[#5a6153]">{card.why}</p>
                        </div>
                        <div className="rounded-[22px] border border-[#ece3d5] bg-[#fcfaf4] p-4">
                          <div className="text-xs font-black uppercase tracking-[0.15em] text-[#9b7a2c]">Aplicação prática</div>
                          <ul className="mt-2 space-y-2 text-sm text-[#5a6153]">
                            {card.use.map((item) => (
                              <li key={item} className="flex gap-2">
                                <span>•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <div className="rounded-[30px] border border-[#d7cab4] bg-[#fffaf2] p-6 shadow-[0_16px_40px_rgba(90,80,50,0.08)]">
                  <div className="mb-4 inline-flex rotate-[-2deg] rounded-full bg-[#c95c4b] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
                    linha do tempo
                  </div>
                  <h3 className="text-2xl font-black text-[#44513e]">Principais marcos da legislação educacional</h3>
                  <div className="mt-6 space-y-5">
                    {timeline.map((item, index) => (
                      <div key={item.year} className="relative pl-8">
                        {index !== timeline.length - 1 && (
                          <div className="absolute left-[11px] top-7 h-full w-[2px] bg-[#d9cfbd]" />
                        )}
                        <div className="absolute left-0 top-1 h-6 w-6 rounded-full border-4 border-[#fffaf2] bg-[#7f9a70] shadow-sm" />
                        <div className="rounded-[20px] border border-[#ece3d2] bg-white p-4">
                          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#9b7a2c]">{item.year}</div>
                          <div className="mt-1 text-lg font-black text-[#46543f]">{item.title}</div>
                          <div className="mt-1 text-sm text-[#61695c]">{item.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[30px] border border-[#d7cab4] bg-[#fbf7ef] p-6 shadow-[0_16px_40px_rgba(90,80,50,0.08)]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-black text-[#44513e]">Legislação com modificação recente</h3>
                      <p className="mt-1 text-sm text-[#666d61]">Pequenos cards em formato de boletim para mostrar normas criadas, alteradas ou revogadas recentemente.</p>
                    </div>
                    <HandDrawnIcon className="h-8 w-8"><path d="M4.3 4.3h15.4v15.4H4.3z" strokeDasharray="48" strokeDashoffset="48" style={{ animationDelay: "0.02s" }} /><path d="M7.1 8.1h9.9" strokeDasharray="10" strokeDashoffset="10" style={{ animationDelay: "0.13s" }} /><path d="M7.1 12h6.1" strokeDasharray="7" strokeDashoffset="7" style={{ animationDelay: "0.21s" }} /><path d="M7.1 15.9h8.1" strokeDasharray="9" strokeDashoffset="9" style={{ animationDelay: "0.29s" }} /></HandDrawnIcon>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {recentChanges.map((item) => (
                      <article
                        key={item.title}
                        className="relative rounded-[22px] border border-[#e7dccd] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="absolute -top-2 left-5 h-3 w-16 rotate-[-5deg] rounded-sm bg-[#e7d3a4]" />
                        <div className="flex items-start justify-between gap-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${item.statusColor}`}>
                            {item.status}
                          </span>
                          <span className="text-xs font-semibold text-[#8a8f84]">{item.when}</span>
                        </div>
                        <h4 className="mt-3 text-base font-black leading-6 text-[#46543f]">{item.title}</h4>
                        <p className="mt-2 text-sm leading-6 text-[#5d6558]">{item.summary}</p>
                        <div className="mt-3 rounded-[18px] border border-[#efe4d3] bg-[#fcfaf5] p-3">
                          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#9b7a2c]">O que mudou</div>
                          <p className="mt-1 text-sm leading-6 text-[#60685a]">{item.detail}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-8 rounded-[30px] border border-[#d7cab4] bg-[#f9f6ef] p-4 shadow-[0_14px_36px_rgba(90,80,50,0.08)] sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-10 w-2 rounded-full bg-[#cf7e3f]" />
                <div>
                  <h2 className="text-2xl font-black text-[#43513d]">Acervo de normas</h2>
                  <p className="text-sm text-[#6b7066]">
                    Uma área para consultar resoluções, portarias, decretos e outros atos, com indicação rápida do assunto ou programa relacionado.
                  </p>
                </div>
              </div>

              <div className="mb-6 grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Pesquisar lei, portaria, resolução..."
                  className="w-full rounded-2xl border border-[#e3d8c8] bg-white px-4 py-3 text-sm shadow-inner focus:outline-none"
                />

                <select
                  className="w-full rounded-2xl border border-[#e3d8c8] bg-white px-4 py-3 text-sm text-[#5e6659] shadow-inner focus:outline-none"
                  defaultValue="Todos"
                >
                  <option value="Todos">Todos</option>
                  <option value="Lei Complementar">Lei Complementar</option>
                  <option value="Resolução">Resolução</option>
                  <option value="Portaria">Portaria</option>
                  <option value="Decreto">Decreto</option>
                  <option value="Instrução Normativa">Instrução Normativa</option>
                  <option value="Norma Educacional">Norma Educacional</option>
                </select>
              </div>

              <div className="space-y-4">
                {normas.map((norma) => (
                  <div
                    key={norma.title}
                    className="grid gap-4 rounded-[24px] border border-[#e6ddcf] bg-white p-4 md:grid-cols-4 md:items-center"
                  >
                    <div>
                      <h3 className="text-lg font-black text-[#46543f]">{norma.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#60685a]">{norma.summary}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-[#e3d8c8] bg-[#f7f1e6] px-3 py-1 text-xs font-semibold text-[#6b6a58]">
                        {norma.type}
                      </span>
                      <span className="inline-flex rounded-full border border-[#d9e4f2] bg-[#eef5fd] px-3 py-1 text-xs font-semibold text-[#4c6480]">
                        {norma.subject}
                      </span>
                    </div>
                    <div>
                      <span className="inline-flex rounded-full bg-[#dcead7] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#4e7a4d]">
                        {norma.status}
                      </span>
                    </div>
                    <div>
                      <a
                        href={norma.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block w-full rounded-full border border-[#d4c7b3] bg-[#5d7452] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[#526847] md:w-auto"
                      >
                        Abrir lei
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </>
            )}

            {activeTab === "diario" && (
              <section className="mt-10 space-y-6">
                <div className="rounded-[28px] border border-[#d8cab4] bg-[#eef3e8] p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-[#4f5b45]"><HandDrawnIcon className="h-8 w-8"><path d="M4.3 4.3h15.4v15.4H4.3z" strokeDasharray="48" strokeDashoffset="48" style={{ animationDelay: "0.03s" }} /><path d="M7.1 8.1h9.9" strokeDasharray="10" strokeDashoffset="10" style={{ animationDelay: "0.13s" }} /><path d="M7.1 12h6.1" strokeDasharray="7" strokeDashoffset="7" style={{ animationDelay: "0.21s" }} /><path d="M7.1 15.9h8.1" strokeDasharray="9" strokeDashoffset="9" style={{ animationDelay: "0.29s" }} /></HandDrawnIcon></div>
                    <div>
                      <h2 className="text-2xl font-black text-[#43513d]">Diários oficiais</h2>
                      <p className="mt-2 text-sm leading-6 text-[#5f6659]">
                        Busque publicações do DOU, dos diários estaduais e dos diários municipais. A ideia aqui é manter a mesma estética do Chegou a Conta, mas com cara de painel de clipping e acompanhamento.
                      </p>
                      <p className="mt-3 text-sm font-semibold text-[#4f6944]">
                        Fontes: Imprensa Nacional e APIs de diários oficiais.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#ddd2bc] bg-[#f6f2e9] p-3 shadow-sm">
                  <div className="flex flex-wrap gap-3">
                    {[
                      "DOU Federal", "DOE Estados", "Diários Municipais",
                    ].map((item, index) => (
                      <button
                        key={item}
                        className={`rounded-[18px] px-5 py-3 text-sm font-black transition ${
                          index === 0
                            ? "border-2 border-[#9b7a66] bg-[#fffdf8] text-[#7b5d4a] shadow-sm"
                            : "border border-[#ddd2bc] bg-white text-[#64715f]"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[30px] border border-[#d7cab4] bg-white p-5 shadow-[0_14px_36px_rgba(90,80,50,0.08)]">
                  <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#7c8b75]">
                    Buscar no diário oficial
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                    <input
                      type="text"
                      placeholder="Ex.: PDDE, alimentação escolar, prestação de contas..."
                      className="w-full rounded-2xl border border-[#d8dcd3] bg-[#f8faf7] px-4 py-3 text-sm shadow-inner focus:outline-none"
                    />
                    <button className="rounded-2xl bg-[#8b9ab0] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-90">
                      Buscar
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-[#93a08f]">Sugestões:</span>
                    {[
                      "PDDE",
                      "PNAE alimentação escolar",
                      "PNATE transporte",
                      "FUNDEB",
                      "prestação de contas",
                    ].map((tag) => (
                      <button
                        key={tag}
                        className="rounded-full bg-[#edf1e5] px-3 py-1.5 text-xs font-semibold text-[#6d745e] transition hover:-translate-y-0.5"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-[28px] border border-[#d7cab4] bg-[#fffaf2] p-6 shadow-sm">
                    <div className="mb-4 inline-flex rotate-[-2deg] rounded-full bg-[#c95c4b] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
                      monitoramento
                    </div>
                    <h3 className="text-xl font-black text-[#44513e]">Como usar esta aba</h3>
                    <div className="mt-4 space-y-3">
                      {[
                        "Pesquise por programa, assunto ou palavra-chave.",
                        "Veja resultados recentes do diário escolhido.",
                        "Abra a publicação original ou leia um resumo curto.",
                        "Acompanhe normas novas, alteradas e revogações.",
                      ].map((item) => (
                        <div key={item} className="rounded-[18px] border border-[#e9dfcf] bg-white p-3 text-sm text-[#5e6659]">
                          ✓ {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-dashed border-[#ddd2bc] bg-[#f9f6ef] p-8 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#ded8ca] bg-white text-[#9eaa99]"><HandDrawnIcon className="h-8 w-8"><path d="M4.3 4.3h15.4v15.4H4.3z" strokeDasharray="48" strokeDashoffset="48" style={{ animationDelay: "0.04s" }} /><path d="M7.1 8.1h9.9" strokeDasharray="10" strokeDashoffset="10" style={{ animationDelay: "0.13s" }} /><path d="M7.1 12h6.1" strokeDasharray="7" strokeDashoffset="7" style={{ animationDelay: "0.21s" }} /><path d="M7.1 15.9h8.1" strokeDasharray="9" strokeDashoffset="9" style={{ animationDelay: "0.29s" }} /></HandDrawnIcon></div>
                    <h3 className="text-xl font-black text-[#8c9ab0]">Busque publicações no Diário Oficial</h3>
                    <p className="mt-2 text-sm leading-6 text-[#9da6b2]">
                      Aqui podem aparecer os resultados do DOU, dos diários estaduais ou dos diários municipais, com link para a publicação original e um pequeno resumo contextual.
                    </p>
                  </div>
                </div>

                <div className="rounded-[22px] border-l-4 border-[#e9a42e] bg-[#fbf6e8] px-5 py-4 text-sm leading-6 text-[#99602f] shadow-sm">
                  <strong>Nota:</strong> Esta aba reúne publicações dos diários oficiais que podem impactar a gestão escolar. Ela funciona como complemento do acervo de normas e pode destacar novidades relevantes para a diretora.
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
