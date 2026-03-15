import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Tool } from "@shared/schema";

const CATEGORIAS = [
  {
    id: "planejar",
    titulo: "Planejar",
    icone: "🗓️",
    cor: "from-violet-100 via-violet-50 to-fuchsia-50",
    borda: "border-violet-300",
    texto: "text-violet-900",
    selo: "bg-violet-200",
    fitas: ["bg-violet-300/90", "bg-fuchsia-200/90", "bg-violet-200/90", "bg-purple-200/90"],
    papeis: ["bg-[#fcf8ff]", "bg-[#fffaff]", "bg-[#fdf9ff]", "bg-[#fcf7ff]"],
    marcadores: ["bg-yellow-200/75", "bg-lime-200/70", "bg-cyan-200/70", "bg-pink-200/70"],
  },
  {
    id: "pesquisar",
    titulo: "Pesquisar Preços",
    icone: "🔎",
    cor: "from-sky-100 via-cyan-50 to-blue-50",
    borda: "border-sky-300",
    texto: "text-sky-900",
    selo: "bg-sky-200",
    fitas: ["bg-sky-300/90", "bg-cyan-200/90", "bg-blue-200/90", "bg-sky-200/90"],
    papeis: ["bg-[#f8fdff]", "bg-[#f8ffff]", "bg-[#f9fcff]", "bg-[#f7fdff]"],
    marcadores: ["bg-cyan-200/70", "bg-yellow-200/70", "bg-lime-200/70", "bg-pink-200/70"],
  },
  {
    id: "comprar",
    titulo: "Comprar",
    icone: "🛒",
    cor: "from-emerald-100 via-green-50 to-teal-50",
    borda: "border-emerald-300",
    texto: "text-emerald-900",
    selo: "bg-emerald-200",
    fitas: ["bg-emerald-300/90", "bg-teal-200/90", "bg-green-200/90", "bg-emerald-200/90"],
    papeis: ["bg-[#f7fff9]", "bg-[#f7fffc]", "bg-[#fbfff9]", "bg-[#f9fffb]"],
    marcadores: ["bg-lime-200/70", "bg-yellow-200/70", "bg-cyan-200/70", "bg-pink-200/70"],
  },
  {
    id: "receber",
    titulo: "Receber e Conferir",
    icone: "📥",
    cor: "from-amber-100 via-yellow-50 to-orange-50",
    borda: "border-amber-300",
    texto: "text-amber-900",
    selo: "bg-amber-200",
    fitas: ["bg-amber-300/90", "bg-orange-200/90", "bg-amber-200/90", "bg-yellow-200/90"],
    papeis: ["bg-[#fffdf5]", "bg-[#fffaf3]", "bg-[#fffdf8]", "bg-[#fffdf4]"],
    marcadores: ["bg-yellow-200/75", "bg-lime-200/70", "bg-cyan-200/70", "bg-pink-200/70"],
  },
  {
    id: "prestar",
    titulo: "Prestar Contas",
    icone: "🧾",
    cor: "from-rose-100 via-pink-50 to-red-50",
    borda: "border-rose-300",
    texto: "text-rose-900",
    selo: "bg-rose-200",
    fitas: ["bg-rose-300/90", "bg-pink-200/90", "bg-rose-200/90", "bg-red-200/90"],
    papeis: ["bg-[#fff8fa]", "bg-[#fff8fb]", "bg-[#fff9fb]", "bg-[#fff7f9]"],
    marcadores: ["bg-pink-200/75", "bg-yellow-200/70", "bg-cyan-200/70", "bg-lime-200/70"],
  },
];

const BANDEIRINHAS = ["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];
const FITAS_HEADER = ["bg-[#efe1bc]", "bg-[#e8d7b7]", "bg-[#f1e5c9]"];

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function tipoLabel(type: string) {
  if (type === "excel") return "EXCEL";
  if (type === "word") return "WORD";
  if (type === "checklist") return "CHECKLIST";
  return "PDF";
}

function CartaoFerramenta({
  tool, index, linhaIdx, secaoIdx, cat,
}: {
  tool: Tool; index: number; linhaIdx: number; secaoIdx: number; cat: typeof CATEGORIAS[0];
}) {
  const { toast } = useToast();
  const rotacao = (index + linhaIdx) % 2 === 0 ? -1.6 : 1.45;
  const fitaClasse = FITAS_HEADER[(index + linhaIdx) % FITAS_HEADER.length];
  const fitaCartao = cat.fitas[(index + linhaIdx) % cat.fitas.length];
  const papel = cat.papeis[index % cat.papeis.length];
  const marcador = cat.marcadores[(index + linhaIdx) % cat.marcadores.length];

  const handleDownload = () => {
    if (tool.downloadUrl) {
      window.open(tool.downloadUrl, "_blank");
    } else {
      toast({ title: "Download iniciado", description: `Baixando ${tool.title}...`, duration: 3000 });
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[320px] xl:max-w-[340px]">
      <div
        className="paper-shadow absolute inset-x-6 bottom-[-8px] h-6 rounded-[50%] bg-black/10 blur-[10px]"
        style={{ animationDelay: `${(index + linhaIdx) * 0.2}s` }}
      />
      <article
        className={`flyer-float group relative min-h-[260px] sm:min-h-[280px] overflow-visible rounded-[14px] border border-[#f1eadf] ${papel} px-4 pb-4 pt-6 sm:px-5 sm:pb-5 sm:pt-7 shadow-[0_18px_34px_rgba(84,61,39,0.12)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_40px_rgba(84,61,39,0.16)] cursor-pointer`}
        style={{
          transform: `rotate(${rotacao}deg)`,
          animationDelay: `${(index + linhaIdx) * 0.25}s`,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(90,80,60,0.06) 1px, transparent 0), linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0.1))",
          backgroundSize: "16px 16px, 100% 100%",
          clipPath:
            "polygon(0% 4%, 4% 1%, 10% 3%, 16% 0%, 22% 3%, 30% 1%, 38% 4%, 46% 0%, 54% 3%, 62% 1%, 70% 4%, 78% 0%, 86% 3%, 94% 1%, 100% 4%, 100% 95%, 96% 98%, 90% 97%, 84% 99%, 76% 97%, 68% 99%, 60% 97.5%, 52% 99%, 44% 97%, 36% 99%, 28% 97%, 20% 98.5%, 12% 97%, 5% 99%, 0% 96%)",
        }}
        onClick={handleDownload}
      >
        {/* fita dupla no topo */}
        <div className={`absolute left-1/2 top-0 h-5 w-20 -translate-x-1/2 -translate-y-[45%] rotate-[-2deg] rounded-sm ${fitaClasse} opacity-95 shadow-[0_2px_8px_rgba(70,60,40,0.12)]`} />
        <div className={`absolute left-6 right-6 top-0 h-4 -translate-y-[45%] rotate-[1deg] rounded-sm ${fitaCartao} opacity-80`} />

        {/* pregador */}
        <div className="absolute left-1/2 top-0 z-10 h-7 w-6 -translate-x-1/2 -translate-y-[88%] rounded-b-[6px] rounded-t-[2px] bg-[linear-gradient(to_bottom,#c99a65,#9f6e3d)] shadow-[0_4px_8px_rgba(80,50,20,0.25)]">
          <div className="mx-auto mt-[2px] h-[3px] w-[10px] rounded-full bg-[#dcb58d] opacity-70" />
        </div>
        <div className="absolute left-1/2 top-0 z-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-[135%] rounded-full bg-[#6f4926]" />

        {/* textura de fundo */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(#000 0.4px, transparent 0.4px)", backgroundSize: "6px 6px" }} />
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-3 bg-gradient-to-b from-black/5 to-transparent" />

        {/* detalhes decorativos */}
        <div className="pointer-events-none absolute left-4 top-14 rotate-[-6deg] text-[9px] font-bold text-red-400 opacity-40">PROTOCOLO</div>
        <div className="pointer-events-none absolute right-6 bottom-16 rotate-[8deg] text-[9px] font-bold text-blue-400 opacity-40">ARQUIVO</div>
        <div className="pointer-events-none absolute right-4 top-14 hidden sm:flex h-[66px] w-[66px] items-center justify-center rounded-full border-[2.5px] border-red-500/22 text-center text-[8px] font-black uppercase leading-[1.1] tracking-[0.16em] text-red-500/28 rotate-[14deg]">
          <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full border border-red-500/20 px-1">escola municipal</div>
        </div>
        <div className="absolute right-3 top-4 rotate-[10deg] text-[9px] font-black uppercase tracking-[0.16em] text-[#b24e4e] opacity-50 sm:text-[10px] sm:tracking-[0.2em]">
          pronto para uso
        </div>

        {/* conteúdo */}
        <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            {tipoLabel(tool.type)}
          </span>
          {tool.featured && (
            <span className="rounded-full bg-[#fff5e8] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#b56a22] shadow-sm">
              essencial
            </span>
          )}
        </div>

        <div className="relative inline-block max-w-full">
          <span className={`absolute inset-x-0 bottom-1 h-3 rounded-sm ${marcador}`} />
          <h3 className="relative text-[1.15rem] sm:text-[1.3rem] font-black leading-[1.15] text-slate-800">
            {tool.title}
          </h3>
        </div>

        <p className="mt-3 min-h-[72px] sm:min-h-[84px] text-[0.9rem] sm:text-[0.95rem] leading-6 text-slate-600">
          {tool.description}
        </p>

        <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:mt-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Arquivo pronto
          </div>
          <button
            className="w-full sm:w-auto rounded-2xl bg-white/90 px-5 py-3 text-sm font-bold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_4px_10px_rgba(0,0,0,0.05)] transition hover:bg-white"
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
          >
            ⬇ Baixar
          </button>
        </div>
      </article>
    </div>
  );
}

function SecaoCategoria({
  cat, ferramentas, secaoIdx,
}: {
  cat: typeof CATEGORIAS[0]; ferramentas: Tool[]; secaoIdx: number;
}) {
  if (ferramentas.length === 0) return null;
  const fileiras = chunk(ferramentas, 3);

  return (
    <section className="relative">
      {/* estandarte */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 flex justify-center">
        <div
          className="banner-sway relative mt-2 w-[92%] max-w-[420px] rounded-b-[26px] rounded-t-[12px] border-2 border-white/70 px-5 pb-7 pt-5 text-center shadow-[0_18px_34px_rgba(70,52,36,0.14)] backdrop-blur-sm sm:px-6 md:min-w-[320px] md:px-8 md:pb-8 md:pt-6 md:rounded-b-[30px]"
        >
          <div className={`absolute inset-0 rounded-b-[30px] rounded-t-[12px] border-2 ${cat.borda} bg-gradient-to-b ${cat.cor} opacity-95`} />
          <div className="absolute left-1/2 top-0 h-5 w-16 -translate-x-1/2 -translate-y-[70%] rounded-md bg-[#b78555] shadow-[0_3px_8px_rgba(90,60,30,0.18)]" />
          <div className="absolute left-6 top-0 h-3 w-3 -translate-y-[145%] rounded-full bg-[#82552d]" />
          <div className="absolute right-6 top-0 h-3 w-3 -translate-y-[145%] rounded-full bg-[#82552d]" />
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-10 translate-y-[92%]">
            <span className="h-0 w-0 border-l-[18px] border-r-[18px] border-t-[26px] border-l-transparent border-r-transparent border-t-white/65" />
            <span className="h-0 w-0 border-l-[18px] border-r-[18px] border-t-[26px] border-l-transparent border-r-transparent border-t-white/65" />
          </div>
          <div className="relative z-10">
            <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${cat.selo} text-2xl shadow-inner`}>
              {cat.icone}
            </div>
            <div className="relative inline-block">
              <span className="absolute inset-x-0 bottom-1 h-3 rounded-sm bg-yellow-200/70" />
              <h2 className={`relative text-2xl font-black sm:text-3xl ${cat.texto}`}>{cat.titulo}</h2>
            </div>
            <p className="mt-2 text-sm font-medium tracking-wide text-slate-600 md:text-base">
              {ferramentas.length} {ferramentas.length === 1 ? "modelo disponível" : "modelos disponíveis"}
            </p>
          </div>
        </div>
      </div>

      {/* fileiras com varal */}
      <div className="pt-32 sm:pt-36">
        <div className="space-y-12 sm:space-y-14">
          {fileiras.map((linha, linhaIdx) => (
            <div key={linhaIdx} className="relative px-0 sm:px-1 md:px-3">
              {/* corda do varal */}
              <div className="pointer-events-none absolute left-2 right-2 top-4 h-[5px] rounded-full bg-[repeating-linear-gradient(45deg,#9a6a3a,#9a6a3a_6px,#b07b45_6px,#b07b45_12px)] shadow-sm md:left-8 md:right-8 line-wind" />

              {/* bandeirinhas do varal */}
              <div className="pointer-events-none absolute left-0 right-0 top-0 flex justify-center gap-4 opacity-95 md:gap-6">
                {[0, 1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="flag-sway h-0 w-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent md:border-l-[11px] md:border-r-[11px] md:border-t-[18px]"
                    style={{
                      borderTopColor: BANDEIRINHAS[(secaoIdx + linhaIdx + item) % BANDEIRINHAS.length],
                      animationDelay: `${(item + linhaIdx) * 0.12}s`,
                    }}
                  />
                ))}
              </div>

              <div className="grid gap-x-5 gap-y-12 pt-8 sm:gap-x-6 sm:gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
                {linha.map((tool, i) => (
                  <CartaoFerramenta
                    key={tool.id}
                    tool={tool}
                    index={i}
                    linhaIdx={linhaIdx}
                    secaoIdx={secaoIdx}
                    cat={cat}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Ferramentas() {
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);

  const { data: tools = [], isLoading } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
  });

  const ferramentasFiltradas = filtroTipo
    ? tools.filter((f) => f.type === filtroTipo)
    : tools;

  return (
    <div
      className="min-h-screen overflow-hidden text-slate-800"
      style={{
        background: "#efe8dd",
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(120,110,90,0.08) 1px, transparent 0), linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(0,0,0,0.02))",
        backgroundSize: "22px 22px, 100% 100%",
      }}
    >
      <style>{`
        @keyframes swayTiny {
          0% { transform: rotate(-1.8deg) translateY(0px); }
          50% { transform: rotate(1.8deg) translateY(1.5px); }
          100% { transform: rotate(-1.8deg) translateY(0px); }
        }
        @keyframes swayMedium {
          0% { transform: rotate(-1.35deg) translateY(0px); }
          50% { transform: rotate(1.35deg) translateY(2.5px); }
          100% { transform: rotate(-1.35deg) translateY(0px); }
        }
        @keyframes flyerFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-4.5px); }
          100% { transform: translateY(0px); }
        }
        @keyframes shadowPulse {
          0% { opacity: .11; transform: scaleX(1); }
          50% { opacity: .16; transform: scaleX(1.03); }
          100% { opacity: .11; transform: scaleX(1); }
        }
        @keyframes lineWind {
          0% { transform: rotate(-0.22deg) translateX(0px); }
          50% { transform: rotate(0.22deg) translateX(1.5px); }
          100% { transform: rotate(-0.22deg) translateX(0px); }
        }
        .flag-sway { animation: swayTiny 5.3s ease-in-out infinite; transform-origin: top center; }
        .banner-sway { animation: swayMedium 7.6s ease-in-out infinite; transform-origin: top center; }
        .flyer-float { animation: flyerFloat 6.4s ease-in-out infinite; }
        .paper-shadow { animation: shadowPulse 6.4s ease-in-out infinite; }
        .line-wind { animation: lineWind 8.8s ease-in-out infinite; transform-origin: center center; }
      `}</style>

      <Navigation />

      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-5 md:px-8 md:py-10 xl:px-10">
        {/* header */}
        <header className="relative mb-14 overflow-hidden rounded-[28px] border border-[#ddd1bf] bg-[#f8f2e8] px-4 pb-7 pt-6 shadow-[0_16px_40px_rgba(86,65,40,0.10)] sm:px-6 md:mb-16 md:rounded-[34px] md:px-8 md:pb-8 md:pt-7">
          {/* corda + bandeirinhas do topo */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28">
            <div className="absolute left-5 right-5 top-6 h-[4px] rounded-full bg-[repeating-linear-gradient(45deg,#9a6a3a,#9a6a3a_7px,#b07b45_7px,#b07b45_14px)] opacity-90" />
            <div className="flex justify-between px-7 pt-8 md:px-10">
              {BANDEIRINHAS.map((cor, i) => (
                <div
                  key={i}
                  className="flag-sway h-0 w-0 border-l-[16px] border-r-[16px] border-t-[28px] border-l-transparent border-r-transparent drop-shadow-sm md:border-l-[18px] md:border-r-[18px] md:border-t-[32px]"
                  style={{ borderTopColor: cor, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>

          <div className="relative pt-12 md:pt-14">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="relative mt-1 flex h-16 w-16 items-center justify-center rounded-[22px] bg-emerald-500 text-3xl text-white shadow-[0_12px_20px_rgba(16,120,80,0.28)]">
                  🔧
                  <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-white/70 blur-[1px]" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl md:text-5xl xl:text-6xl">
                    Mural de Ferramentas
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7 md:text-lg">
                    {isLoading
                      ? "Carregando modelos..."
                      : `${tools.length} modelos prontos para baixar e usar — estandartes, varais e papéis com pregadores.`}
                  </p>
                </div>
              </div>

              {/* filtros */}
              <div className="relative rounded-[20px] border border-[#ded4c8] bg-white/85 p-3 shadow-[0_10px_24px_rgba(90,70,40,0.08)] backdrop-blur-sm lg:min-w-[360px]">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
                  <span className="mr-1 text-slate-500">Tipo:</span>
                  {[
                    { label: "Todos", valor: null },
                    { label: "Excel", valor: "excel" },
                    { label: "Word", valor: "word" },
                    { label: "Checklist", valor: "checklist" },
                    { label: "PDF", valor: "pdf" },
                  ].map(({ label, valor }) => (
                    <button
                      key={label}
                      onClick={() => setFiltroTipo(valor)}
                      className={`rounded-full px-4 py-2 transition ${
                        filtroTipo === valor
                          ? "bg-[#f4ead8] text-slate-900 ring-1 ring-[#b99668] shadow-sm"
                          : "bg-[#fbf8f3] hover:bg-[#f3eee6]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* conteúdo */}
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-amber-700/60" />
          </div>
        ) : ferramentasFiltradas.length === 0 ? (
          <div className="py-24 text-center text-slate-500">Nenhum modelo encontrado para este filtro.</div>
        ) : (
          <div className="space-y-20 md:space-y-24">
            {CATEGORIAS.map((cat, secaoIdx) => {
              const ferramentas = ferramentasFiltradas.filter((f) => f.category === cat.id);
              return (
                <SecaoCategoria
                  key={cat.id}
                  cat={cat}
                  ferramentas={ferramentas}
                  secaoIdx={secaoIdx}
                />
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
