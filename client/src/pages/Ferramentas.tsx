import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import type { Tool } from "@shared/schema";

// ---------------------------------------------------------------------------
// Dados do mural (design fixo – substituído por dados da API quando disponível)
// ---------------------------------------------------------------------------
const SECOES_DESIGN = [
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
    cartoes: [
      { tipo: "EXCEL", nome: "Plano de Aplicação do PDDE", desc: "Planilha para planejar a aplicação dos recursos por ação e prioridade.", popular: true },
      { tipo: "EXCEL", nome: "Cronograma de Compras da Escola", desc: "Modelo para organizar prazos de cotação, compra, entrega e conferência." },
      { tipo: "WORD", nome: "Roteiro de Prioridades", desc: "Folha simples para registrar urgências, responsáveis e prazos da escola." },
      { tipo: "CHECKLIST", nome: "Checklist do Início do Ano", desc: "Lista rápida para revisar pendências de organização antes das atividades.", popular: true },
      { tipo: "PDF", nome: "Guia de Planejamento Mensal", desc: "Resumo visual para apoiar a organização das ações e acompanhar o mês." },
      { tipo: "WORD", nome: "Quadro de Metas da Escola", desc: "Documento para registrar metas, tarefas principais e acompanhamento." },
    ],
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
    cartoes: [
      { tipo: "EXCEL", nome: "Mapa de Pesquisa de Preços", desc: "Planilha para comparar propostas de fornecedores e justificar a escolha.", popular: true },
      { tipo: "CHECKLIST", nome: "Checklist de Pesquisa de Mercado", desc: "Lista rápida para validar documentação e critérios antes da contratação." },
      { tipo: "WORD", nome: "Modelo de Cotação Simples", desc: "Documento para reunir respostas de fornecedores em linguagem direta.", popular: true },
      { tipo: "PDF", nome: "Guia de Boas Práticas", desc: "Orientações objetivas para apoiar a pesquisa de preços na escola." },
      { tipo: "CHECKLIST", nome: "Verificação de Documentos", desc: "Ajuda a conferir se as informações básicas dos fornecedores estão presentes." },
      { tipo: "WORD", nome: "Registro de Contatos", desc: "Ficha para registrar contato, retorno e condições apresentadas." },
    ],
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
    cartoes: [
      { tipo: "WORD", nome: "Modelo de Solicitação de Orçamento", desc: "Documento padrão para solicitar orçamento a fornecedores.", popular: true },
      { tipo: "WORD", nome: "Ata de Deliberação de Compra", desc: "Modelo de ata para registrar decisão colegiada sobre a aquisição." },
      { tipo: "CHECKLIST", nome: "Checklist da Compra", desc: "Ajuda a acompanhar etapas antes, durante e depois da contratação.", popular: true },
      { tipo: "PDF", nome: "Guia Rápido de Aquisição", desc: "Resumo prático com pontos importantes para apoiar a compra." },
      { tipo: "WORD", nome: "Registro de Decisão", desc: "Documento para formalizar justificativas e escolhas da escola." },
      { tipo: "EXCEL", nome: "Controle de Pedidos", desc: "Planilha para acompanhar pedidos, valores e status das aquisições." },
    ],
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
    cartoes: [
      { tipo: "CHECKLIST", nome: "Checklist de Recebimento de Materiais", desc: "Roteiro para conferência de quantidade, qualidade e conformidade na entrega.", popular: true },
      { tipo: "WORD", nome: "Termo de Recebimento", desc: "Modelo para formalizar o recebimento de bens e serviços.", popular: true },
      { tipo: "WORD", nome: "Ficha de Conferência", desc: "Documento para anotar pendências, ajustes e observações da entrega." },
      { tipo: "PDF", nome: "Guia de Conferência Visual", desc: "Apoio rápido para revisar o que observar no momento do recebimento." },
      { tipo: "CHECKLIST", nome: "Conferência de Quantidades", desc: "Lista simples para garantir que os itens recebidos batem com o pedido." },
      { tipo: "WORD", nome: "Registro de Ocorrências", desc: "Modelo para registrar danos, divergências ou problemas encontrados." },
    ],
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
    cartoes: [
      { tipo: "CHECKLIST", nome: "Checklist de Prestação de Contas", desc: "Guia de verificação final antes do envio da prestação de contas.", popular: true },
      { tipo: "PDF", nome: "Relatório Simplificado de Execução", desc: "Modelo para consolidar despesas executadas e anexos comprobatórios." },
      { tipo: "WORD", nome: "Resumo de Despesas", desc: "Documento para organizar despesas por categoria de forma clara." },
      { tipo: "EXCEL", nome: "Planilha de Anexos", desc: "Acompanha comprovantes e facilita a conferência da documentação.", popular: true },
      { tipo: "WORD", nome: "Declaração de Regularidade", desc: "Modelo para apoiar registros formais e organização documental." },
      { tipo: "CHECKLIST", nome: "Revisão Final da Pasta", desc: "Lista final para checar se os documentos estão completos antes do envio." },
    ],
  },
];

const BANDEIRINHAS = ["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];
const FITAS_HEADER = ["bg-[#efe1bc]", "bg-[#e8d7b7]", "bg-[#f1e5c9]"];

// ---------------------------------------------------------------------------
// Ícones feitos à mão (SVG) para cada seção
// ---------------------------------------------------------------------------
const ICONES_SVG: Record<string, React.ReactNode> = {
  planejar: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="5" y="9" width="30" height="26" rx="2.5" />
      <line x1="5" y1="17" x2="35" y2="17" />
      <line x1="14" y1="4" x2="14" y2="13" />
      <line x1="26" y1="4" x2="26" y2="13" />
      <rect x="11" y="22" width="4" height="4" rx="0.8" />
      <rect x="18" y="22" width="4" height="4" rx="0.8" />
      <rect x="11" y="29" width="4" height="4" rx="0.8" />
      <rect x="25" y="22" width="4" height="4" rx="0.8" />
    </svg>
  ),
  pesquisar: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-6 h-6">
      <circle cx="17" cy="17" r="10" />
      <path d="M24.5 24.5 L35 35" strokeWidth="3" />
      <line x1="13" y1="17" x2="21" y2="17" strokeOpacity="0.45" />
      <line x1="17" y1="13" x2="17" y2="21" strokeOpacity="0.45" />
    </svg>
  ),
  comprar: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M6 9 L11 9 L16 29 L34 29" />
      <path d="M12 15 L36 15 L33 27 L14 27" />
      <circle cx="18" cy="35" r="2.5" />
      <circle cx="30" cy="35" r="2.5" />
    </svg>
  ),
  receber: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="6" y="5" width="28" height="30" rx="2.5" />
      <path d="M13 19.5 L18 25.5 L27 13.5" strokeWidth="2.6" />
      <line x1="13" y1="31" x2="22" y2="31" strokeOpacity="0.45" />
    </svg>
  ),
  prestar: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M11 3 L29 3 L29 37 L11 37 Z" />
      <line x1="16" y1="11" x2="24" y2="11" />
      <line x1="16" y1="17" x2="24" y2="17" />
      <line x1="16" y1="23" x2="21" y2="23" />
      <line x1="16" y1="29" x2="23" y2="29" />
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// Decorações conceituais do cabeçalho (substituem bandeirinhas simples)
// ---------------------------------------------------------------------------
const DECO_SHAPES = [
  // Lápis
  (cor: string) => (
    <svg key="lapis" viewBox="0 0 18 36" width="14" height="28" style={{ color: cor }}>
      <rect x="3" y="6" width="12" height="22" rx="1.5" fill={cor} opacity="0.9" />
      <polygon points="3,28 15,28 9,36" fill={cor} opacity="0.7" />
      <rect x="3" y="4" width="12" height="4" rx="1" fill="#f8c97a" opacity="0.9" />
      <rect x="5" y="6" width="2" height="18" rx="1" fill="rgba(255,255,255,0.25)" />
    </svg>
  ),
  // Estrela
  (cor: string) => (
    <svg key="star" viewBox="0 0 32 32" width="22" height="22" style={{ color: cor }}>
      <polygon points="16,2 20,12 31,12 22,19 25,30 16,23 7,30 10,19 1,12 12,12" fill={cor} opacity="0.88" />
    </svg>
  ),
  // Livro aberto
  (cor: string) => (
    <svg key="livro" viewBox="0 0 36 28" width="26" height="20" fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 C18 6, 12 4, 4 5 L4 24 C12 23, 18 25, 18 25" fill={cor} fillOpacity="0.2" />
      <path d="M18 6 C18 6, 24 4, 32 5 L32 24 C24 23, 18 25, 18 25" fill={cor} fillOpacity="0.2" />
      <line x1="18" y1="6" x2="18" y2="25" />
    </svg>
  ),
  // Régua
  (cor: string) => (
    <svg key="regua" viewBox="0 0 12 36" width="10" height="30">
      <rect x="1" y="1" width="10" height="34" rx="1.5" fill={cor} opacity="0.85" />
      {[5,9,13,17,21,25,29].map((y, i) => (
        <line key={i} x1="1" y1={y} x2={i % 2 === 0 ? "6" : "4"} y2={y} stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
      ))}
    </svg>
  ),
  // Moeda
  (cor: string) => (
    <svg key="moeda" viewBox="0 0 28 28" width="22" height="22">
      <circle cx="14" cy="14" r="12" fill={cor} opacity="0.88" />
      <circle cx="14" cy="14" r="9" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      <text x="14" y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fill="rgba(255,255,255,0.8)">R$</text>
    </svg>
  ),
  // Clipe / pasta
  (cor: string) => (
    <svg key="pasta" viewBox="0 0 28 34" width="20" height="26" fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="6" width="22" height="26" rx="2" fill={cor} fillOpacity="0.25" />
      <path d="M9 6 C9 3, 11 1, 14 1 C17 1, 19 3, 19 6" />
      <line x1="9" y1="15" x2="19" y2="15" />
      <line x1="9" y1="20" x2="19" y2="20" />
      <line x1="9" y1="25" x2="15" y2="25" />
    </svg>
  ),
];

const DECO_CORES = ["#c0392b", "#2980b9", "#27ae60", "#e67e22", "#8e44ad", "#16a085", "#d35400", "#2c3e50"];

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ---------------------------------------------------------------------------
// Badge de tipo do documento
// ---------------------------------------------------------------------------
function TipoBadge({ tipo }: { tipo: string }) {
  if (tipo === "EXCEL") return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700">📊 Excel</span>;
  if (tipo === "WORD") return <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700">📝 Word</span>;
  if (tipo === "CHECKLIST") return <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700">✅ Checklist</span>;
  if (tipo === "PDF") return <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-rose-700">📄 PDF</span>;
  return <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">{tipo}</span>;
}

// ---------------------------------------------------------------------------
// Cartão individual
// ---------------------------------------------------------------------------
interface Cartao {
  tipo: string;
  nome: string;
  desc: string;
  downloadUrl?: string;
  featured?: boolean;
  popular?: boolean;
}

function CartaoFerramenta({
  cartao, index, linhaIdx, secaoIdx, secao,
}: {
  cartao: Cartao;
  index: number;
  linhaIdx: number;
  secaoIdx: number;
  secao: typeof SECOES_DESIGN[0];
}) {
  const { toast } = useToast();
  const rotacao = (index + linhaIdx) % 2 === 0 ? -1.6 : 1.45;
  const fitaClasse = FITAS_HEADER[(index + linhaIdx) % FITAS_HEADER.length];
  const fitaCartao = secao.fitas[(index + linhaIdx) % secao.fitas.length];
  const papel = secao.papeis[index % secao.papeis.length];
  const marcador = secao.marcadores[(index + linhaIdx) % secao.marcadores.length];

  const handleDownload = () => {
    if (cartao.downloadUrl) {
      window.open(cartao.downloadUrl, "_blank");
    } else {
      toast({ title: "Em breve!", description: `${cartao.nome} estará disponível para download em breve.`, duration: 3000 });
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[320px] xl:max-w-[340px]">
      {/* sombra flutuante */}
      <div
        className="paper-shadow absolute inset-x-6 bottom-[-8px] h-6 rounded-[50%] bg-black/10 blur-[10px]"
        style={{ animationDelay: `${(index + linhaIdx) * 0.2}s` }}
      />

      <article
        className={`flyer-float group relative min-h-[260px] sm:min-h-[280px] overflow-visible rounded-[14px] border border-[#f1eadf] ${papel} px-4 pb-4 pt-7 sm:px-5 sm:pb-5 sm:pt-8 shadow-[0_18px_34px_rgba(84,61,39,0.12)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_26px_44px_rgba(84,61,39,0.18)] cursor-pointer`}
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
        {/* fitas duplas no topo */}
        <div className={`absolute left-1/2 top-0 h-5 w-20 -translate-x-1/2 -translate-y-[45%] rotate-[-2deg] rounded-sm ${fitaClasse} opacity-95 shadow-[0_2px_8px_rgba(70,60,40,0.12)]`} />
        <div className={`absolute left-6 right-6 top-0 h-4 -translate-y-[45%] rotate-[1deg] rounded-sm ${fitaCartao} opacity-80`} />

        {/* pregador */}
        <div className="absolute left-1/2 top-0 z-10 h-7 w-6 -translate-x-1/2 -translate-y-[88%] rounded-b-[6px] rounded-t-[2px] bg-[linear-gradient(to_bottom,#c99a65,#9f6e3d)] shadow-[0_4px_8px_rgba(80,50,20,0.25)]">
          <div className="mx-auto mt-[2px] h-[3px] w-[10px] rounded-full bg-[#dcb58d] opacity-70" />
        </div>
        <div className="absolute left-1/2 top-0 z-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-[135%] rounded-full bg-[#6f4926]" />

        {/* textura sutil de papel */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(#000 0.4px, transparent 0.4px)", backgroundSize: "6px 6px" }} />
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-3 bg-gradient-to-b from-black/5 to-transparent" />

        {/* badge essencial (canto) */}
        {cartao.featured && (
          <div className="mb-2 flex justify-end">
            <span className="rounded-full bg-[#fff5e8] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#b56a22] shadow-sm">
              essencial
            </span>
          </div>
        )}

        {/* nome com marcação multilinhas */}
        <h3 className="text-[1.1rem] sm:text-[1.22rem] font-black leading-[1.7] text-slate-800">
          <span className={`box-decoration-clone ${marcador} px-0.5 leading-[1.7]`}>
            {cartao.nome}
          </span>
        </h3>
        {/* tipo badge colado abaixo do nome */}
        <div className="mt-1.5">
          <TipoBadge tipo={cartao.tipo} />
        </div>

        <p className="mt-3 min-h-[72px] text-[0.88rem] sm:text-[0.93rem] leading-6 text-slate-600">
          {cartao.desc}
        </p>

        <div className="mt-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            {cartao.popular ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-600">
                🔥 Mais baixado
              </span>
            ) : (
              <>
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                {cartao.downloadUrl ? "Arquivo pronto" : "Em breve"}
              </>
            )}
          </div>
          <button
            className="download-btn w-full sm:w-auto rounded-2xl bg-white/90 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_4px_10px_rgba(0,0,0,0.06)] transition hover:bg-white active:scale-95 overflow-hidden relative"
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <span className="download-arrow inline-block">⬇</span> Baixar
            </span>
            <span className="shimmer-sweep absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </button>
        </div>
      </article>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Seção com estandarte no mastro + cartões no varal
// ---------------------------------------------------------------------------
function SecaoCategoria({
  secao, cartoes, secaoIdx,
}: {
  secao: typeof SECOES_DESIGN[0];
  cartoes: Cartao[];
  secaoIdx: number;
}) {
  if (cartoes.length === 0) return null;

  // Cores das bandeirinhas específicas deste mastro (rotacionadas pelo índice da seção)
  const bandeirinhasMastro = [...BANDEIRINHAS.slice(secaoIdx % BANDEIRINHAS.length), ...BANDEIRINHAS.slice(0, secaoIdx % BANDEIRINHAS.length)];

  return (
    <section className="relative">

      {/* ===== MASTRO COM ESTANDARTE ===== */}
      <div className="flex justify-center mb-16 sm:mb-20">
        <div className="relative flex flex-col items-center" style={{ width: 420 }}>

          {/* — cordão de bandeirinhas esquerdo — */}
          <div className="absolute top-0 left-0 right-1/2 flex items-start justify-end gap-0 overflow-visible" style={{ height: 38, paddingRight: 12 }}>
            {/* fio */}
            <div className="absolute top-[8px] left-0 right-[12px] h-[2px] rounded-full bg-[#8b6840] opacity-70 line-wind" style={{ transformOrigin: 'right center' }} />
            {/* bandeirinhas */}
            <div className="absolute top-0 left-0 right-[12px] flex justify-around items-start pt-0">
              {bandeirinhasMastro.slice(0, 5).map((cor, i) => (
                <div
                  key={i}
                  className="flag-sway h-0 w-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent drop-shadow-sm"
                  style={{ borderTopColor: cor, animationDelay: `${i * 0.18}s`, marginTop: 2 }}
                />
              ))}
            </div>
          </div>

          {/* — cordão de bandeirinhas direito — */}
          <div className="absolute top-0 left-1/2 right-0 flex items-start justify-start gap-0 overflow-visible" style={{ height: 38, paddingLeft: 12 }}>
            <div className="absolute top-[8px] left-[12px] right-0 h-[2px] rounded-full bg-[#8b6840] opacity-70 line-wind" style={{ transformOrigin: 'left center' }} />
            <div className="absolute top-0 left-[12px] right-0 flex justify-around items-start pt-0">
              {bandeirinhasMastro.slice(3, 8).map((cor, i) => (
                <div
                  key={i}
                  className="flag-sway h-0 w-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent drop-shadow-sm"
                  style={{ borderTopColor: cor, animationDelay: `${(i + 5) * 0.16}s`, marginTop: 2 }}
                />
              ))}
            </div>
          </div>

          {/* — mastro vertical — */}
          <div className="relative z-10 flex flex-col items-center" style={{ marginTop: 4 }}>
            {/* bola do topo */}
            <div className="h-5 w-5 rounded-full bg-[linear-gradient(135deg,#d4a057,#8b5e2a)] shadow-[0_3px_8px_rgba(90,55,20,0.35)]" />
            {/* pau */}
            <div
              className="w-[10px] rounded-b-sm"
              style={{
                height: 56,
                background: "linear-gradient(to right, #c8894a, #e8a95c, #c0803e)",
                boxShadow: "inset -2px 0 4px rgba(0,0,0,0.18), 2px 0 6px rgba(0,0,0,0.10)",
              }}
            />
          </div>

          {/* — estandarte — */}
          <div
            className="banner-sway relative mt-2 w-[88%] max-w-[400px] rounded-b-[26px] rounded-t-[12px] border-2 border-white/70 px-5 pb-7 pt-5 text-center shadow-[0_18px_34px_rgba(70,52,36,0.14)] backdrop-blur-sm sm:px-6 md:px-8 md:pb-8 md:pt-6 md:rounded-b-[30px]"
            style={{ transformOrigin: "top center" }}
          >
            {/* fundo colorido */}
            <div className={`absolute inset-0 rounded-b-[30px] rounded-t-[12px] border-2 ${secao.borda} bg-gradient-to-b ${secao.cor} opacity-95`} />

            {/* suporte horizontal no topo */}
            <div className="absolute left-1/2 top-0 h-5 w-16 -translate-x-1/2 -translate-y-[70%] rounded-md bg-[#b78555] shadow-[0_3px_8px_rgba(90,60,30,0.18)]" />
            <div className="absolute left-6 top-0 h-3 w-3 -translate-y-[145%] rounded-full bg-[#82552d]" />
            <div className="absolute right-6 top-0 h-3 w-3 -translate-y-[145%] rounded-full bg-[#82552d]" />

            {/* ponteiras triangulares na base */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-10 translate-y-[92%]">
              <span className="h-0 w-0 border-l-[18px] border-r-[18px] border-t-[26px] border-l-transparent border-r-transparent border-t-white/65" />
              <span className="h-0 w-0 border-l-[18px] border-r-[18px] border-t-[26px] border-l-transparent border-r-transparent border-t-white/65" />
            </div>

            {/* conteúdo */}
            <div className="relative z-10">
              <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${secao.selo} shadow-inner`}>
                {ICONES_SVG[secao.id]}
              </div>
              <div className="relative inline-block">
                <span className="absolute inset-x-0 bottom-1 h-3 rounded-sm bg-yellow-200/70" />
                <h2 className={`relative text-2xl font-black sm:text-3xl ${secao.texto}`}>{secao.titulo}</h2>
              </div>
              <p className="mt-2 text-sm font-medium tracking-wide text-slate-600">
                {cartoes.length} {cartoes.length === 1 ? "modelo disponível" : "modelos disponíveis"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== VARAL ÚNICO + GRID RESPONSIVO ===== */}
      <div className="relative px-1 md:px-4">
        {/* corda do varal */}
        <div className="pointer-events-none absolute left-2 right-2 top-3 h-[5px] rounded-full bg-[repeating-linear-gradient(45deg,#9a6a3a,#9a6a3a_6px,#b07b45_6px,#b07b45_12px)] shadow-sm md:left-6 md:right-6 line-wind" />

        {/* grade responsiva: 1 col → 2 col → 3 col */}
        <div className="grid gap-x-6 gap-y-14 pt-10 sm:grid-cols-2 xl:grid-cols-3">
          {cartoes.map((cartao, i) => (
            <CartaoFerramenta
              key={`${cartao.nome}-${i}`}
              cartao={cartao}
              index={i}
              linhaIdx={0}
              secaoIdx={secaoIdx}
              secao={secao}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
export default function Ferramentas() {
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);

  const { data: toolsDB = [] } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
  });

  // Merge: para cada cartão do design, tenta encontrar correspondente no banco pelo título
  function mergeCartoes(secaoId: string, cartoes: typeof SECOES_DESIGN[0]["cartoes"]): Cartao[] {
    const dbDaCategoria = toolsDB.filter((t) => t.category === secaoId);
    const resultado: Cartao[] = cartoes.map((c) => {
      const match = dbDaCategoria.find(
        (t) => t.title.toLowerCase().trim() === c.nome.toLowerCase().trim()
      );
      return {
        tipo: c.tipo,
        nome: c.nome,
        desc: c.desc,
        downloadUrl: match?.downloadUrl || undefined,
        featured: match?.featured || false,
        popular: (c as any).popular || false,
      };
    });
    // Adiciona ferramentas do banco que não existem no design
    dbDaCategoria.forEach((t) => {
      const jaExiste = resultado.find((r) => r.nome.toLowerCase().trim() === t.title.toLowerCase().trim());
      if (!jaExiste) {
        resultado.push({
          tipo: (t.type || "pdf").toUpperCase(),
          nome: t.title,
          desc: t.description || "",
          downloadUrl: t.downloadUrl || undefined,
          featured: t.featured || false,
        });
      }
    });
    return resultado;
  }

  const totalModelos = SECOES_DESIGN.reduce((acc, s) => acc + s.cartoes.length, 0);

  // Filtro de tipo aplicado sobre os cartões de design
  function filtrarCartoes(cartoes: Cartao[]): Cartao[] {
    if (!filtroTipo) return cartoes;
    return cartoes.filter((c) => c.tipo.toLowerCase() === filtroTipo);
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden text-slate-800"
      style={{
        background: "#efe8dd",
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(120,110,90,0.08) 1px, transparent 0), linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(0,0,0,0.02))",
        backgroundSize: "22px 22px, 100% 100%",
      }}
    >
      <style>{`
        @keyframes swayTiny {
          0%   { transform: rotate(-1.8deg) translateY(0px); }
          50%  { transform: rotate(1.8deg) translateY(1.5px); }
          100% { transform: rotate(-1.8deg) translateY(0px); }
        }
        @keyframes swayMedium {
          0%   { transform: rotate(-1.35deg) translateY(0px); }
          50%  { transform: rotate(1.35deg) translateY(2.5px); }
          100% { transform: rotate(-1.35deg) translateY(0px); }
        }
        @keyframes flyerFloat {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(-4.5px); }
          100% { transform: translateY(0px); }
        }
        @keyframes shadowPulse {
          0%   { opacity: .11; transform: scaleX(1); }
          50%  { opacity: .17; transform: scaleX(1.03); }
          100% { opacity: .11; transform: scaleX(1); }
        }
        @keyframes lineWind {
          0%   { transform: rotate(-0.22deg) translateX(0px); }
          50%  { transform: rotate(0.22deg) translateX(1.5px); }
          100% { transform: rotate(-0.22deg) translateX(0px); }
        }
        @keyframes arrowBounce {
          0%, 100% { transform: translateY(0); }
          40%      { transform: translateY(3px); }
          60%      { transform: translateY(1px); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .flag-sway    { animation: swayTiny 5.3s ease-in-out infinite; transform-origin: top center; }
        .banner-sway  { animation: swayMedium 7.6s ease-in-out infinite; transform-origin: top center; }
        .flyer-float  { animation: flyerFloat 6.4s ease-in-out infinite; }
        .paper-shadow { animation: shadowPulse 6.4s ease-in-out infinite; }
        .line-wind    { animation: lineWind 8.8s ease-in-out infinite; transform-origin: center center; }
        .download-btn:hover .download-arrow { animation: arrowBounce 0.6s ease-in-out; }
        .download-btn:hover .shimmer-sweep  { animation: shimmer 0.7s ease-in-out; }
      `}</style>

      <Navigation />

      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-5 md:px-8 md:py-10 xl:px-10">

        {/* ===== HEADER ===== */}
        <header className="relative mb-16 overflow-hidden rounded-[28px] border border-[#ddd1bf] bg-[#f8f2e8] px-4 pb-7 pt-6 shadow-[0_16px_40px_rgba(86,65,40,0.10)] sm:px-6 md:mb-20 md:rounded-[34px] md:px-8 md:pb-8 md:pt-7">

          {/* corda + decorações conceituais do cabeçalho */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28">
            <div className="absolute left-5 right-5 top-8 h-[3px] rounded-full opacity-70"
              style={{ background: "repeating-linear-gradient(90deg,#9a6a3a 0px,#9a6a3a 8px,#c9955e 8px,#c9955e 16px)" }} />
            <div className="absolute left-5 right-5 top-8 flex items-end justify-between px-4">
              {DECO_CORES.map((cor, i) => (
                <div
                  key={i}
                  className="flag-sway -translate-y-1 drop-shadow-sm"
                  style={{ animationDelay: `${i * 0.22}s`, animationDuration: `${4.8 + (i % 3) * 0.9}s` }}
                >
                  {DECO_SHAPES[i % DECO_SHAPES.length](cor)}
                </div>
              ))}
            </div>
          </div>

          <div className="relative pt-12 md:pt-14">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

              {/* título */}
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl md:text-5xl xl:text-6xl">
                  Mural de Ferramentas
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7 md:text-lg">
                  {totalModelos} modelos prontos para baixar e usar — organizados em estandartes por etapa do trabalho da diretora.
                </p>
              </div>

              {/* filtros */}
              <div className="relative rounded-[20px] border border-[#ded4c8] bg-white/85 p-3 shadow-[0_10px_24px_rgba(90,70,40,0.08)] backdrop-blur-sm lg:min-w-[380px]">
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
                      className={`rounded-full px-4 py-2 transition-all ${
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

        {/* ===== SEÇÕES ===== */}
        <div className="space-y-28 md:space-y-32">
          {SECOES_DESIGN.map((secao, secaoIdx) => {
            const merged = mergeCartoes(secao.id, secao.cartoes);
            const cartoesFiltrados = filtrarCartoes(merged);
            return (
              <SecaoCategoria
                key={secao.id}
                secao={secao}
                cartoes={cartoesFiltrados}
                secaoIdx={secaoIdx}
              />
            );
          })}
        </div>

        <div className="mt-20 pb-6 text-center text-sm text-slate-500">
          Os checklists funcionam melhor impressos e colados no mural da secretaria! 📌
        </div>
      </div>

      <Footer />
    </div>
  );
}
