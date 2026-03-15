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
      { tipo: "EXCEL", nome: "Plano de Aplicação do PDDE", desc: "Planilha para planejar a aplicação dos recursos por ação e prioridade." },
      { tipo: "EXCEL", nome: "Cronograma de Compras da Escola", desc: "Modelo para organizar prazos de cotação, compra, entrega e conferência." },
      { tipo: "WORD", nome: "Roteiro de Prioridades", desc: "Folha simples para registrar urgências, responsáveis e prazos da escola." },
      { tipo: "CHECKLIST", nome: "Checklist do Início do Ano", desc: "Lista rápida para revisar pendências de organização antes das atividades." },
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
      { tipo: "EXCEL", nome: "Mapa de Pesquisa de Preços", desc: "Planilha para comparar propostas de fornecedores e justificar a escolha." },
      { tipo: "CHECKLIST", nome: "Checklist de Pesquisa de Mercado", desc: "Lista rápida para validar documentação e critérios antes da contratação." },
      { tipo: "WORD", nome: "Modelo de Cotação Simples", desc: "Documento para reunir respostas de fornecedores em linguagem direta." },
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
      { tipo: "WORD", nome: "Modelo de Solicitação de Orçamento", desc: "Documento padrão para solicitar orçamento a fornecedores." },
      { tipo: "WORD", nome: "Ata de Deliberação de Compra", desc: "Modelo de ata para registrar decisão colegiada sobre a aquisição." },
      { tipo: "CHECKLIST", nome: "Checklist da Compra", desc: "Ajuda a acompanhar etapas antes, durante e depois da contratação." },
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
      { tipo: "CHECKLIST", nome: "Checklist de Recebimento de Materiais", desc: "Roteiro para conferência de quantidade, qualidade e conformidade na entrega." },
      { tipo: "WORD", nome: "Termo de Recebimento", desc: "Modelo para formalizar o recebimento de bens e serviços." },
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
      { tipo: "CHECKLIST", nome: "Checklist de Prestação de Contas", desc: "Guia de verificação final antes do envio da prestação de contas." },
      { tipo: "PDF", nome: "Relatório Simplificado de Execução", desc: "Modelo para consolidar despesas executadas e anexos comprobatórios." },
      { tipo: "WORD", nome: "Resumo de Despesas", desc: "Documento para organizar despesas por categoria de forma clara." },
      { tipo: "EXCEL", nome: "Planilha de Anexos", desc: "Acompanha comprovantes e facilita a conferência da documentação." },
      { tipo: "WORD", nome: "Declaração de Regularidade", desc: "Modelo para apoiar registros formais e organização documental." },
      { tipo: "CHECKLIST", nome: "Revisão Final da Pasta", desc: "Lista final para checar se os documentos estão completos antes do envio." },
    ],
  },
];

const BANDEIRINHAS = ["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];
const FITAS_HEADER = ["bg-[#efe1bc]", "bg-[#e8d7b7]", "bg-[#f1e5c9]"];

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
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

        {/* conteúdo */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
            {cartao.tipo}
          </span>
          {cartao.featured && (
            <span className="rounded-full bg-[#fff5e8] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#b56a22] shadow-sm">
              essencial
            </span>
          )}
        </div>

        <div className="relative inline-block max-w-full">
          <span className={`absolute inset-x-0 bottom-0.5 h-3 rounded-sm ${marcador}`} />
          <h3 className="relative text-[1.1rem] sm:text-[1.22rem] font-black leading-[1.2] text-slate-800">
            {cartao.nome}
          </h3>
        </div>

        <p className="mt-3 min-h-[72px] text-[0.88rem] sm:text-[0.93rem] leading-6 text-slate-600">
          {cartao.desc}
        </p>

        <div className="mt-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            {cartao.downloadUrl ? "Arquivo pronto" : "Em breve"}
          </div>
          <button
            className="w-full sm:w-auto rounded-2xl bg-white/90 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_4px_10px_rgba(0,0,0,0.06)] transition hover:bg-white active:scale-95"
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
          >
            ⬇ Baixar
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
  const fileiras = chunk(cartoes, 3);

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
            className="banner-sway relative w-[88%] max-w-[380px] rounded-b-[24px] rounded-t-[10px] border-2 border-white/70 px-5 pb-8 pt-5 text-center shadow-[0_20px_36px_rgba(70,52,36,0.16)]"
            style={{ transformOrigin: "top center", marginTop: -2 }}
          >
            {/* fundo colorido */}
            <div className={`absolute inset-0 rounded-b-[24px] rounded-t-[10px] border-2 ${secao.borda} bg-gradient-to-b ${secao.cor} opacity-96`} />

            {/* suporte horizontal no topo (fixação no mastro) */}
            <div className="absolute left-1/2 top-0 h-[6px] w-20 -translate-x-1/2 -translate-y-[50%] rounded-full bg-[#b78555] shadow-[0_2px_6px_rgba(90,60,30,0.22)]" />
            {/* argolas laterais */}
            <div className="absolute left-5 top-0 h-3 w-3 -translate-y-[120%] rounded-full bg-[#7a4e23] shadow-sm" />
            <div className="absolute right-5 top-0 h-3 w-3 -translate-y-[120%] rounded-full bg-[#7a4e23] shadow-sm" />

            {/* ponteiras triangulares na base */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-around px-8 translate-y-[90%]">
              {[0,1,2].map((i) => (
                <span
                  key={i}
                  className="h-0 w-0 border-l-[16px] border-r-[16px] border-t-[22px] border-l-transparent border-r-transparent border-t-white/55"
                />
              ))}
            </div>

            {/* conteúdo do estandarte */}
            <div className="relative z-10">
              <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${secao.selo} text-2xl shadow-inner`}>
                {secao.icone}
              </div>
              <div className="relative inline-block">
                <span className="absolute inset-x-0 bottom-0.5 h-3 rounded-sm bg-yellow-200/65" />
                <h2 className={`relative text-2xl font-black sm:text-3xl ${secao.texto}`}>{secao.titulo}</h2>
              </div>
              <p className="mt-2 text-sm font-medium tracking-wide text-slate-600">
                {cartoes.length} {cartoes.length === 1 ? "modelo disponível" : "modelos disponíveis"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FILEIRAS COM VARAL ===== */}
      <div className="space-y-14 sm:space-y-16">
        {fileiras.map((linha, linhaIdx) => (
          <div key={linhaIdx} className="relative px-1 md:px-4">
            {/* corda do varal */}
            <div className="pointer-events-none absolute left-2 right-2 top-3 h-[5px] rounded-full bg-[repeating-linear-gradient(45deg,#9a6a3a,#9a6a3a_6px,#b07b45_6px,#b07b45_12px)] shadow-sm md:left-6 md:right-6 line-wind" />

            {/* grade de cartões */}
            <div className="grid gap-x-6 gap-y-14 pt-10 sm:grid-cols-2 xl:grid-cols-3">
              {linha.map((cartao, i) => (
                <CartaoFerramenta
                  key={`${cartao.nome}-${i}-${linhaIdx}`}
                  cartao={cartao}
                  index={i}
                  linhaIdx={linhaIdx}
                  secaoIdx={secaoIdx}
                  secao={secao}
                />
              ))}
            </div>
          </div>
        ))}
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
        .flag-sway   { animation: swayTiny 5.3s ease-in-out infinite; transform-origin: top center; }
        .banner-sway { animation: swayMedium 7.6s ease-in-out infinite; transform-origin: top center; }
        .flyer-float { animation: flyerFloat 6.4s ease-in-out infinite; }
        .paper-shadow { animation: shadowPulse 6.4s ease-in-out infinite; }
        .line-wind   { animation: lineWind 8.8s ease-in-out infinite; transform-origin: center center; }
      `}</style>

      <Navigation />

      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-5 md:px-8 md:py-10 xl:px-10">

        {/* ===== HEADER ===== */}
        <header className="relative mb-16 overflow-hidden rounded-[28px] border border-[#ddd1bf] bg-[#f8f2e8] px-4 pb-7 pt-6 shadow-[0_16px_40px_rgba(86,65,40,0.10)] sm:px-6 md:mb-20 md:rounded-[34px] md:px-8 md:pb-8 md:pt-7">

          {/* corda + bandeirinhas do cabeçalho */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28">
            <div className="absolute left-5 right-5 top-6 h-[4px] rounded-full bg-[repeating-linear-gradient(45deg,#9a6a3a,#9a6a3a_7px,#b07b45_7px,#b07b45_14px)] opacity-90" />
            <div className="flex justify-between px-8 pt-8 md:px-12">
              {BANDEIRINHAS.map((cor, i) => (
                <div
                  key={i}
                  className="flag-sway h-0 w-0 border-l-[15px] border-r-[15px] border-t-[26px] border-l-transparent border-r-transparent drop-shadow-sm md:border-l-[18px] md:border-r-[18px] md:border-t-[32px]"
                  style={{ borderTopColor: cor, animationDelay: `${i * 0.15}s` }}
                />
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
