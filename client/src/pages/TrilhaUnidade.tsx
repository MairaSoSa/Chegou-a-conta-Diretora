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

type ModalData = {
  emoji?: string;
  label: string;
  title: string;
  paragraphs: string[];
};

// Paper / sticker card — sem furinhos, parece uma folha colada na página
function Ficha({
  tone,
  label,
  accent,
  rotate = 0,
  children,
  className = "",
  onClick,
}: {
  tone: (typeof toneMap)[ToneKey];
  label?: string;
  accent?: string;
  rotate?: number;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={`relative overflow-hidden rounded-[14px] bg-white ${onClick ? "cursor-pointer transition-shadow hover:shadow-[0_6px_18px_rgba(0,0,0,0.13)]" : ""} ${className}`}
      style={{
        border: `1px solid ${tone.border}`,
        boxShadow: "0 3px 10px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    >
      {label && (
        <div className="flex items-center justify-between px-4 py-1.5" style={{ background: accent || tone.tab }}>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.22em]" style={{ color: tone.tabText }}>
            {label}
          </span>
          {onClick && (
            <span className="text-[9px] font-semibold opacity-60" style={{ color: tone.tabText }}>
              ler tudo →
            </span>
          )}
        </div>
      )}
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

// ── Quadro de fluxo ──
function FluxoQuadro({
  tone,
  steps,
}: {
  tone: (typeof toneMap)[ToneKey];
  steps: Array<{ num: number; label: string; desc: string }>;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[16px]"
      style={{
        background: "linear-gradient(135deg, #fdfaf4 0%, #f5f0e8 100%)",
        border: `1px solid ${tone.border}`,
        boxShadow: "0 3px 10px rgba(0,0,0,0.07)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-5 py-2.5"
        style={{ background: tone.tab, borderBottom: `1px solid ${tone.border}` }}
      >
        <span className="text-base">🗺️</span>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.22em]" style={{ color: tone.tabText }}>
          quadro de fluxo
        </span>
      </div>

      {/* Flow steps — horizontal with arrows */}
      <div className="flex flex-wrap items-start gap-0 p-4 md:flex-nowrap">
        {steps.map((step, i) => (
          <div key={step.num} className="flex min-w-0 flex-1 items-start">
            {/* Step box */}
            <div className="flex min-w-0 flex-1 flex-col items-center text-center">
              {/* Number badge */}
              <div
                className="mb-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold shadow-sm"
                style={{ background: tone.spineLight, color: "#fff" }}
              >
                {step.num}
              </div>
              {/* Label chip */}
              <div
                className="mb-1.5 rounded-[8px] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide"
                style={{ background: tone.tab, color: tone.tabText }}
              >
                {step.label}
              </div>
              {/* Description */}
              <p className="text-[11px] leading-4 text-slate-500 px-1">{step.desc}</p>
            </div>

            {/* Arrow connector (not after last step) */}
            {i < steps.length - 1 && (
              <div
                className="flex-shrink-0 self-center px-1 text-lg font-bold"
                style={{ color: tone.accent }}
              >
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Grade de fichas colapsáveis: compactadas por padrão, expandem no hover ──
function FichaGrid({
  fichas,
  tone,
  onOpen,
}: {
  fichas: Array<{ id: string; label: string; emoji: string; title: string; preview: string; paragraphs: string[] }>;
  tone: (typeof toneMap)[ToneKey];
  onOpen: (data: ModalData) => void;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {fichas.map((ficha) => (
        <button
          key={ficha.id}
          type="button"
          onClick={() =>
            onOpen({ emoji: ficha.emoji, label: ficha.label, title: ficha.title, paragraphs: ficha.paragraphs })
          }
          className="group w-full overflow-hidden rounded-[14px] text-left shadow-sm transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.13)]"
          style={{ border: `1px solid ${tone.border}` }}
        >
          {/* Colored tab — sempre visível */}
          <div
            className="flex items-center justify-between px-4 py-2.5 transition-opacity"
            style={{ background: tone.tab }}
          >
            <span
              className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.22em]"
              style={{ color: tone.tabText }}
            >
              <span className="text-base leading-none">{ficha.emoji}</span>
              {ficha.label}
            </span>
            <span
              className="text-[9px] font-bold opacity-0 transition-opacity duration-200 group-hover:opacity-60"
              style={{ color: tone.tabText }}
            >
              abrir →
            </span>
          </div>

          {/* Corpo: altura 0 por padrão, expande no hover via max-h transition */}
          <div className="max-h-0 overflow-hidden bg-white transition-[max-height] duration-300 ease-out group-hover:max-h-32">
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-slate-700">{ficha.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{ficha.preview}</p>
              <p className="mt-2 text-[10px] font-semibold" style={{ color: tone.spineLight }}>
                {ficha.paragraphs.length} parágrafos · clique para ler
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

const FICHAS_APROFUNDAMENTO = [
  {
    id: "leitura",
    label: "leitura",
    emoji: "📖",
    title: "Leitura ampliada da unidade",
    preview: "Texto corrido de 4–5 páginas para compreensão aprofundada do tema.",
    paragraphs: [
      "Esta ficha transforma o tema da unidade em uma leitura mais contínua, menos fragmentada. Aqui, o objetivo não é apenas listar regras, mas mostrar como esse conteúdo pode fortalecer a tomada de decisão e diminuir dúvidas na rotina da escola.",
      "O texto parte do contexto geral — por que esse tema existe, qual problema ele resolve na gestão escolar — e avança progressivamente para os pontos mais técnicos, sempre amarrando o conteúdo à realidade vivida pela diretora.",
      "A leitura é dividida em blocos temáticos que podem ser estudados em partes. Cada bloco termina com um destaque que resume o ponto central daquela seção, facilitando a revisão e o uso posterior como material de consulta.",
      "Esta ficha serve como texto-base para estudo pessoal, reunião interna de formação e retomada do assunto com mais calma em momentos de dúvida ou decisão.",
      "Ao final da leitura, a diretora deve ser capaz de explicar o tema para sua equipe com suas próprias palavras, conectando os conceitos à realidade concreta da escola e do programa de financiamento.",
    ],
  },
  {
    id: "pratica",
    label: "prática",
    emoji: "🛠️",
    title: "Como isso aparece na prática",
    preview: "Situações reais, exemplos e o que fazer quando o tema aparece no dia a dia.",
    paragraphs: [
      "Na prática, esta unidade aparece quando a direção precisa transformar uma regra em decisão concreta. A distância entre saber o que diz a norma e saber o que fazer na segunda-feira de manhã é exatamente o que esta ficha pretende reduzir.",
      "Começamos com situações frequentes que toda diretora já viveu ou vai viver: o recurso que chegou fora do prazo, a dúvida sobre qual despesa é permitida, o documento que foi solicitado na auditoria e ninguém sabia onde estava.",
      "Para cada situação, esta ficha apresenta o contexto, o que a legislação diz, o que costuma dar errado e o que fazer passo a passo. Os exemplos são baseados em casos reais coletados de escolas públicas de diferentes estados.",
      "A ficha também apresenta boas práticas que escolas bem-geridas adotam para evitar os problemas mais comuns: rotinas de registro, fluxos de aprovação interna, formas de organizar a documentação de comprovação.",
      "Esta é a ficha para consultar quando o problema já está acontecendo — não apenas para estudar antes. Guarde-a acessível para o momento em que a situação real aparecer.",
    ],
  },
  {
    id: "conversa",
    label: "conversa",
    emoji: "💬",
    title: "Perguntas para conversa com a equipe",
    preview: "Roteiro para reunião, formação ou conversa interna sobre o tema.",
    paragraphs: [
      "Esta ficha é um roteiro para conduzir uma conversa estruturada com a equipe escolar sobre o tema desta unidade. Ela pode ser usada em reunião pedagógica, formação interna, encontro com o conselho escolar ou conversa com a secretaria.",
      "Ponto de partida: o que a equipe já sabe? Antes de apresentar novos conteúdos, vale mapear o nível de familiaridade do grupo com o tema. As primeiras perguntas desta ficha servem exatamente para isso.",
      "Bloco central: quais pontos desta unidade a equipe já domina e quais ainda parecem nebulosos? Como esse conteúdo aparece no dia a dia da escola? Que situações já geraram dúvida ou conflito relacionadas a esse tema?",
      "Bloco de ação: o que a escola pode fazer diferente a partir de agora? Que mudança pequena, concreta e imediata poderia ser implementada? Quem seria responsável? Em que prazo?",
      "Encerramento: quais recursos, materiais ou apoios externos seriam úteis para aprofundar o tema? Existe alguém na rede que já resolveu bem esse problema e poderia compartilhar a experiência?",
    ],
  },
  {
    id: "glossario",
    label: "glossário",
    emoji: "📚",
    title: "Glossário dos termos desta unidade",
    preview: "Definições claras dos termos técnicos que aparecem na unidade.",
    paragraphs: [
      "Esta ficha apresenta os principais termos técnicos que aparecem nesta unidade, com definições em linguagem acessível. O objetivo é que a diretora possa consultar rapidamente quando encontrar um termo desconhecido em um documento oficial.",
      "Os termos são organizados em ordem de importância para a compreensão da unidade — não em ordem alfabética. Os mais centrais aparecem primeiro, seguidos de termos de apoio e termos relacionados que aparecem em documentos do MEC e do FNDE.",
      "Para cada termo, a ficha apresenta: a definição técnica (o que o documento oficial diz), a definição prática (o que isso significa na realidade da escola) e, quando relevante, um exemplo de como o termo aparece em formulários, portarias ou relatórios.",
      "Esta ficha foi elaborada com base nas portarias, resoluções e manuais publicados pelo FNDE e pelo MEC relacionados ao tema desta unidade. As definições são atualizadas conforme a legislação vigente.",
      "Dica de uso: imprima esta ficha e cole na pasta de documentos relacionados ao tema. Ela serve como guia de referência rápida durante o preenchimento de formulários, elaboração de relatórios e atendimento de auditorias.",
    ],
  },
  {
    id: "checklist",
    label: "checklist",
    emoji: "✅",
    title: "Lista de verificação da unidade",
    preview: "O que checar antes, durante e depois de cada processo desta unidade.",
    paragraphs: [
      "Esta ficha apresenta um checklist prático dividido em três momentos: antes do processo começar, durante a execução e após a conclusão. Ela foi elaborada para que a diretora possa verificar se nada foi esquecido em cada etapa.",
      "Antes de começar: verificar se os documentos de habilitação estão atualizados, se o plano de aplicação está aprovado pelo conselho escolar, se os prazos do calendário do FNDE foram consultados e se a equipe responsável pela execução foi orientada.",
      "Durante a execução: conferir se cada despesa está dentro do objeto do programa, se os comprovantes estão sendo coletados no momento do pagamento, se os registros no sistema estão sendo feitos em tempo real e se o saldo está sendo monitorado.",
      "Após a conclusão: verificar se todos os comprovantes foram digitalizados e organizados, se o relatório de execução foi concluído, se a prestação de contas foi submetida dentro do prazo e se o conselho escolar aprovou as contas.",
      "Esta lista não substitui os manuais e normativos oficiais, mas serve como guia de memória para evitar os erros mais comuns. Adapte-a à realidade da sua escola e complemente com os requisitos específicos do seu programa e estado.",
    ],
  },
  {
    id: "legislacao",
    label: "legislação",
    emoji: "⚖️",
    title: "Base legal desta unidade",
    preview: "As leis, portarias e resoluções que fundamentam o tema desta unidade.",
    paragraphs: [
      "Esta ficha apresenta a base legal que fundamenta o tema desta unidade. Conhecer a legislação não significa memorizar artigos, mas saber quais documentos consultar quando surge uma dúvida ou contestação.",
      "A legislação relacionada a este tema é composta principalmente por: resoluções do FNDE que definem as regras de cada programa, portarias do MEC que estabelecem diretrizes gerais, e leis federais que determinam o marco legal do financiamento da educação pública.",
      "Para cada norma listada nesta ficha, apresentamos: o número e ano do documento, o órgão que publicou, o que ela determina em relação a esta unidade e onde encontrar o texto completo (site do FNDE, Diário Oficial da União, portal do MEC).",
      "Atenção especial: a legislação é atualizada periodicamente. Resolução vigente até ontem pode ter sido substituída. Sempre verifique a data de publicação e se há versão mais recente antes de citar uma norma em um documento oficial.",
      "Esta ficha também apresenta os principais pontos de divergência que costumam gerar dúvida: casos em que a lei estadual diverge da federal, situações não previstas explicitamente e interpretações que variam entre os órgãos de controle.",
    ],
  },
  {
    id: "erros",
    label: "erros comuns",
    emoji: "⚠️",
    title: "Erros mais comuns e como evitá-los",
    preview: "Os equívocos que aparecem com mais frequência e como não repeti-los.",
    paragraphs: [
      "Esta ficha reúne os erros mais frequentemente encontrados em auditorias, prestações de contas e relatórios de fiscalização relacionados ao tema desta unidade. Conhecer os erros mais comuns é a forma mais eficiente de evitá-los.",
      "Erro 1 — Documentação incompleta: comprovantes ausentes, rasuras não justificadas, notas fiscais sem identificação do programa. Este é o erro mais frequente e também o mais fácil de evitar com uma rotina simples de organização no momento da despesa.",
      "Erro 2 — Aplicação fora do objeto: despesas realizadas com recursos de um programa em itens não permitidos por aquele programa específico. Cada programa tem seu objeto definido em resolução — consulte antes de gastar.",
      "Erro 3 — Prazos perdidos: submissão da prestação de contas fora do prazo, ausência de registro no sistema PDDE Web, reunião do conselho escolar não realizada no período exigido.",
      "Erro 4 — Processo licitatório inadequado: compras sem cotação prévia, fornecedores sem regularidade fiscal, contratos sem seguir as modalidades exigidas pela legislação. Este erro tem consequências graves e pode gerar devolução de recursos.",
      "Como usar esta ficha: revise esta lista antes de iniciar cada processo. Compartilhe com o responsável financeiro da escola. Use como pauta em reuniões de preparação para auditoria ou prestação de contas.",
    ],
  },
];

const FLUXO_STEPS = [
  { num: 1, label: "Identificar", desc: "Mapear os recursos disponíveis e as fontes de financiamento da escola" },
  { num: 2, label: "Planejar", desc: "Definir prioridades e elaborar o plano de aplicação dos recursos" },
  { num: 3, label: "Executar", desc: "Realizar as despesas respeitando as normas e o objeto do programa" },
  { num: 4, label: "Registrar", desc: "Documentar toda movimentação com comprovantes e registros no sistema" },
  { num: 5, label: "Prestar", desc: "Elaborar e enviar a prestação de contas dentro do prazo ao FNDE" },
];

export default function TrilhaUnidade() {
  const params = useParams();
  const unitId = params.unitId || "U01";
  const [, navigate] = useLocation();
  const [openModal, setOpenModal] = useState<ModalData | null>(null);

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
            className="hidden sm:flex w-14 flex-shrink-0 flex-col items-center justify-around py-10"
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
            className="flex-1 min-w-0"
            style={{ background: "#f8f4ee" }}
          >
            {/* Mobile: barra superior (substitui a lombada) */}
            <div
              className="flex sm:hidden items-center gap-3 px-4 py-2.5"
              style={{
                background: `linear-gradient(90deg, ${tone.spine} 0%, ${tone.spineLight} 100%)`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
              }}
            >
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-2 w-2 rounded-full" style={{ background: "rgba(255,255,255,0.45)" }} />
                ))}
              </div>
              <span
                className="text-[9px] font-extrabold uppercase tracking-[0.25em] truncate"
                style={{ color: "rgba(255,255,255,0.9)" }}
              >
                {groupName(personalidade)}
              </span>
              <span
                className="ml-auto shrink-0 rounded px-2 py-0.5 text-[9px] font-extrabold uppercase"
                style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)" }}
              >
                {unitId}
              </span>
            </div>

            {/* Content */}
            <div className="space-y-4 p-4 sm:p-5 md:p-7">

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
              <Ficha
                tone={tone}
                label="leitura principal"
                onClick={() => setOpenModal({
                  emoji: "📝",
                  label: "leitura principal",
                  title: "Introdução: por que este tema importa",
                  paragraphs: [
                    unidade.intro || "Esta unidade apresenta conceitos fundamentais para a gestão financeira escolar de forma prática e acessível.",
                    "Este tema é central porque todo recurso que chega à escola — seja pelo PDDE, PNAE, PNATE ou outras fontes — segue um fluxo que começa antes do dinheiro chegar e termina depois que ele é gasto.",
                    "A diretora que compreende a origem dos recursos consegue planejar melhor, evitar erros na aplicação e sustentar decisões na prestação de contas. Ela não precisa memorizar a lei — precisa entender a lógica.",
                    "Quando o tema fica claro para toda a equipe, a escola ganha previsibilidade: as pessoas sabem o que esperar, o que documentar e quando agir. Isso reduz o estresse e aumenta a segurança institucional.",
                    "Esta unidade é o ponto de partida. Ela não resolve todos os problemas, mas abre o mapa — mostrando onde estamos, para onde vamos e por que o caminho percorrido nessa trilha faz sentido.",
                  ],
                })}
              >
                <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: tone.spineLight }}>introdução</p>
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
                <Ficha
                  tone={tone}
                  label="ementa"
                  onClick={() => setOpenModal({
                    emoji: "📋",
                    label: "ementa",
                    title: "Ementa: o que esta unidade cobre",
                    paragraphs: [
                      sections[0]
                        ? typeof sections[0].conteudo === "string" ? sections[0].conteudo : Array.isArray(sections[0].conteudo) ? sections[0].conteudo.join(" ") : unidade.subtitle
                        : unidade.subtitle,
                      "Competência esperada ao final: a diretora consegue identificar as fontes de recurso da sua escola, sabe a quais programas está vinculada e compreende a lógica geral de fluxo e prestação de contas.",
                      "Pré-requisitos: nenhum. Esta unidade foi projetada para ser o ponto de entrada da trilha, sem exigir conhecimento técnico prévio sobre finanças públicas ou legislação educacional.",
                      "Conexão com outras unidades: os conceitos apresentados aqui são retomados em todas as demais unidades da trilha. Voltar a esta unidade para rever fundamentos é sempre válido e recomendado.",
                    ],
                  })}
                >
                  <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: tone.spineLight }}>ementa</p>
                  <p className="text-sm leading-6 text-slate-600">
                    {sections[0]
                      ? typeof sections[0].conteudo === "string" ? sections[0].conteudo : Array.isArray(sections[0].conteudo) ? sections[0].conteudo[0] : ""
                      : unidade.subtitle}
                  </p>
                </Ficha>

                <Ficha
                  tone={tone}
                  label="vídeo"
                  accent={tone.accent}
                  onClick={() => setOpenModal({
                    emoji: "🎬",
                    label: "vídeo sugerido",
                    title: `Guia de vídeo: ${unidade.title}`,
                    paragraphs: [
                      `Este vídeo foi selecionado para complementar a leitura desta unidade sobre "${unidade.title}". Ele apresenta o tema em formato audiovisual, com exemplos visuais e linguagem acessível.`,
                      "Como usar: assista ao vídeo antes ou depois da leitura do conteúdo escrito. Se usado em formação com a equipe, pause em momentos-chave para discussão em grupo.",
                      "O que observar no vídeo: atenção aos exemplos práticos, às referências de documentos e aos passos de processo que aparecem. Anote os pontos que fazem mais sentido para a realidade da sua escola.",
                      "Após assistir: utilize as fichas de aprofundamento para aprofundar os pontos que chamaram mais atenção. O vídeo é uma porta de entrada — o conteúdo completo está nas fichas.",
                    ],
                  })}
                >
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
                {sections.slice(0, 4).map((sec, idx) => {
                  const secText = typeof sec.conteudo === "string" ? sec.conteudo : Array.isArray(sec.conteudo) ? sec.conteudo.join(" ") : "";
                  return (
                    <Ficha
                      key={idx}
                      tone={tone}
                      label={sec.titulo || `seção ${idx + 1}`}
                      rotate={idx % 2 === 0 ? -0.4 : 0.5}
                      onClick={() => setOpenModal({
                        emoji: "📄",
                        label: sec.titulo || `seção ${idx + 1}`,
                        title: sec.titulo || `Seção ${idx + 1}`,
                        paragraphs: Array.isArray(sec.conteudo) ? sec.conteudo : [secText],
                      })}
                    >
                      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: tone.spineLight }}>
                        {sec.titulo || `seção ${idx + 1}`}
                      </p>
                      <p className="text-sm leading-6 text-slate-600">
                        {typeof sec.conteudo === "string" ? sec.conteudo : Array.isArray(sec.conteudo) ? sec.conteudo.join(" · ") : ""}
                      </p>
                    </Ficha>
                  );
                })}
              </div>
            )}

            {/* ── OBSERVAR + PASSOS ── */}
            <div className="grid gap-4 md:grid-cols-2">
              <Ficha
                tone={tone}
                label="o que observar"
                rotate={-0.5}
                onClick={() => setOpenModal({
                  emoji: "🔍",
                  label: "o que observar",
                  title: "Guia de observação: o que acompanhar nesta unidade",
                  paragraphs: [
                    "Se a equipe compreende a lógica geral da unidade e consegue explicá-la com suas próprias palavras — sem precisar ler o texto de novo para cada dúvida simples.",
                    "Se existem registros claros para consulta futura: documentos organizados, pastas físicas ou digitais com os comprovantes e registros de cada decisão tomada.",
                    "Se o conteúdo já conversa com a rotina da escola: as pessoas conseguem conectar os conceitos desta unidade a situações que já viveram ou que estão vivendo agora.",
                    "Se há alguém na equipe que ficou com dúvidas que ainda não foram respondidas — essas dúvidas devem ser endereçadas antes de avançar para a próxima unidade.",
                    "Se a unidade gerou alguma mudança concreta de comportamento ou de processo na escola: esse é o sinal mais claro de que a aprendizagem foi efetiva.",
                  ],
                })}
              >
                <ul className="space-y-2 text-sm leading-6 text-slate-600">
                  {["Se a equipe compreende a lógica geral da unidade.", "Se existem registros claros para consulta futura.", "Se o conteúdo já conversa com a rotina da escola."].map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: tone.accent }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Ficha>

              <Ficha
                tone={tone}
                label="próximos passos"
                rotate={0.5}
                onClick={() => setOpenModal({
                  emoji: "➡️",
                  label: "próximos passos",
                  title: "Próximos passos: o que fazer depois desta unidade",
                  paragraphs: [
                    "Relacionar esta unidade à próxima da trilha: identificar como os conceitos se conectam e o que muda no conhecimento necessário quando se avança ao próximo tema.",
                    "Usar a ficha longa em reunião interna: selecionar uma das fichas de aprofundamento e utilizá-la como base para uma conversa estruturada com a equipe pedagógica ou administrativa.",
                    "Criar um apoio visual próprio para a equipe: um quadro, um cartaz, uma tabela ou qualquer material que ajude a equipe a consultar rapidamente os pontos centrais desta unidade.",
                    "Verificar se há pendências relacionadas ao tema na escola: documentos que precisam ser organizados, processos que precisam ser ajustados, perguntas que precisam de resposta.",
                    "Registrar aprendizados no diário de gestão: anotar o que ficou mais claro, o que ainda gera dúvida e o que vai mudar na rotina a partir do que foi estudado.",
                  ],
                })}
              >
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

            {/* ── QUADRO DE FLUXO ── */}
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${tone.border}, transparent)` }} />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.22em]" style={{ color: tone.spineLight }}>
                  fluxo do processo
                </span>
                <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${tone.border}, transparent)` }} />
              </div>
              <FluxoQuadro tone={tone} steps={FLUXO_STEPS} />
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
              <FichaGrid fichas={FICHAS_APROFUNDAMENTO} tone={tone} onOpen={setOpenModal} />
            </div>

            </div>{/* end content wrapper */}
          </div>{/* end paper area */}
        </div>{/* end binder */}
      </main>

      {/* Ficha modal */}
      <AnimatePresence>
        {openModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
            onClick={() => setOpenModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex w-full max-w-3xl overflow-hidden rounded-[24px] shadow-[0_30px_80px_rgba(0,0,0,0.28)]"
            >
              {/* Binder spine */}
              <div
                className="flex w-10 flex-shrink-0 flex-col items-center justify-center gap-5 py-6"
                style={{ background: `linear-gradient(180deg, ${tone.spineLight}, ${tone.spine})` }}
              >
                {[0, 1, 2].map((i) => <RingClip key={i} color="rgba(255,255,255,0.6)" />)}
              </div>

              {/* Content area */}
              <div className="flex flex-1 flex-col bg-[#f8f4ee]">
                {/* Header bar */}
                <div
                  className="flex items-start justify-between gap-4 border-b px-6 py-4"
                  style={{ borderColor: tone.border }}
                >
                  <div>
                    <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.22em]" style={{ color: tone.spineLight }}>
                      {openModal.emoji && <span className="text-base leading-none">{openModal.emoji}</span>}
                      {openModal.label}
                    </p>
                    <h3 className="mt-1 text-xl font-extrabold text-slate-800">{openModal.title}</h3>
                  </div>
                  <button
                    onClick={() => setOpenModal(null)}
                    className="flex-shrink-0 rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm font-semibold text-stone-500 shadow-sm transition hover:bg-stone-50"
                  >
                    fechar ×
                  </button>
                </div>

                {/* Scrollable body — lined paper style */}
                <div className="max-h-[62vh] overflow-y-auto px-6 py-5">
                  <div
                    className="relative rounded-[14px] border bg-white p-5"
                    style={{ borderColor: tone.border }}
                  >
                    {/* Red left margin line */}
                    <div
                      className="absolute left-12 top-0 bottom-0 w-px"
                      style={{ background: "#f0a0a088" }}
                    />
                    {/* Ruled lines background */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-[14px] opacity-30"
                      style={{
                        backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #c7d0e0 31px, #c7d0e0 32px)",
                        backgroundPosition: "0 40px",
                      }}
                    />
                    <div className="relative pl-8 space-y-5 text-sm leading-8 text-slate-700">
                      {openModal.paragraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
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
