import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const trilhasBase = [
  {
    id: 'origem',
    titulo: 'De onde vêm os recursos',
    personalidade: 'origem',
    descricao:
      'O começo da jornada: entender as fontes de financiamento, os programas e o tempo dos repasses que chegam à escola.',
    items: [
      {
        numero: '01',
        titulo: 'De onde vêm os recursos da escola',
        subtitulo: 'As principais fontes de financiamento da escola pública.',
        ementa:
          'Apresenta as diferentes fontes de recursos da escola pública, incluindo programas federais, repasses estaduais e municipais e outras formas de financiamento da educação.',
        tag: 'Fontes',
      },
      {
        numero: '02',
        titulo: 'Quais programas financiam a escola',
        subtitulo: 'Conhecendo os programas que apoiam o funcionamento da escola.',
        ementa:
          'Explica os principais programas educacionais que chegam às escolas, como PDDE, PNAE e PNATE, seus objetivos e como eles contribuem para o funcionamento da escola.',
        tag: 'Programas',
      },
      {
        numero: '03',
        titulo: 'Como funciona o PDDE',
        subtitulo: 'O principal programa de repasse direto para escolas públicas.',
        ementa:
          'Apresenta o funcionamento do Programa Dinheiro Direto na Escola, suas modalidades, regras gerais e responsabilidades da escola na gestão dos recursos.',
        tag: 'PDDE',
      },
      {
        numero: '04',
        titulo: 'Quando os recursos chegam',
        subtitulo: 'Entendendo os repasses dos programas educacionais.',
        ementa:
          'Apresenta como funcionam os calendários de repasse dos programas e como a escola pode acompanhar a chegada dos recursos.',
        tag: 'Repasses',
      },
    ],
  },
  {
    id: 'estrutura',
    titulo: 'Estrutura administrativa',
    personalidade: 'estrutura',
    descricao:
      'Aqui a diretora encontra os pilares formais que sustentam a gestão: unidade executora, estatuto, cartório, conta e responsabilidades.',
    items: [
      {
        numero: '05',
        titulo: 'Como a escola se organiza para receber recursos',
        subtitulo: 'Estruturas administrativas necessárias para participar dos programas.',
        ementa:
          'Explica as estruturas administrativas que permitem que a escola participe dos programas educacionais e receba recursos financeiros.',
        tag: 'Organização',
      },
      {
        numero: '06',
        titulo: 'O que é a unidade executora',
        subtitulo: 'A entidade responsável por administrar os recursos da escola.',
        ementa:
          'Apresenta o conceito de unidade executora, suas funções e sua importância para a gestão financeira da escola.',
        tag: 'UEX',
      },
      {
        numero: '07',
        titulo: 'Quem administra os recursos da escola',
        subtitulo: 'Diretoria, conselho e responsabilidades na gestão.',
        ementa:
          'Explica quem são os responsáveis pela administração dos recursos da unidade executora e como ocorre a participação da comunidade escolar.',
        tag: 'Gestão',
      },
      {
        numero: '08',
        titulo: 'O estatuto da unidade executora',
        subtitulo: 'O documento que define regras e funcionamento da entidade.',
        ementa:
          'Apresenta o estatuto da unidade executora, seus objetivos e sua importância para o funcionamento institucional da entidade.',
        tag: 'Estatuto',
      },
      {
        numero: '09',
        titulo: 'Documentos da escola no cartório',
        subtitulo: 'Registros que formalizam a unidade executora.',
        ementa:
          'Explica quais documentos precisam ser registrados em cartório, como estatuto e atas, e por que esses registros são importantes.',
        tag: 'Cartório',
      },
      {
        numero: '10',
        titulo: 'A conta bancária da escola',
        subtitulo: 'Onde ficam os recursos dos programas educacionais.',
        ementa:
          'Apresenta o funcionamento das contas bancárias vinculadas aos programas educacionais e sua importância na gestão financeira.',
        tag: 'Conta',
      },
      {
        numero: '11',
        titulo: 'Quem pode movimentar a conta',
        subtitulo: 'Responsáveis e autorizações para movimentação financeira.',
        ementa:
          'Explica quem pode movimentar as contas da unidade executora e como essas autorizações são registradas no banco.',
        tag: 'Autorização',
      },
    ],
  },
  {
    id: 'planejamento',
    titulo: 'Planejamento e uso dos recursos',
    personalidade: 'planejamento',
    descricao:
      'Uma trilha para transformar recurso em ação concreta: planejar, comprar, registrar e manter tudo bem organizado.',
    items: [
      {
        numero: '12',
        titulo: 'Como planejar o uso dos recursos',
        subtitulo: 'Definindo prioridades para melhorar a escola.',
        ementa:
          'Explica como planejar o uso dos recursos da escola considerando necessidades pedagógicas e administrativas.',
        tag: 'Planejamento',
      },
      {
        numero: '13',
        titulo: 'O que pode ser pago com os recursos',
        subtitulo: 'Regras para utilização dos recursos dos programas.',
        ementa:
          'Apresenta as despesas permitidas pelos programas educacionais e as principais restrições relacionadas ao uso dos recursos.',
        tag: 'Despesas',
      },
      {
        numero: '14',
        titulo: 'Notas fiscais e comprovantes',
        subtitulo: 'Documentos necessários para registrar despesas.',
        ementa:
          'Explica os documentos fiscais utilizados para comprovar despesas e garantir a regularidade da gestão financeira.',
        tag: 'Comprovação',
      },
      {
        numero: '15',
        titulo: 'Como organizar os documentos da escola',
        subtitulo: 'Gestão e arquivamento de documentos administrativos.',
        ementa:
          'Apresenta formas de organizar e arquivar documentos relacionados aos programas e à administração da escola.',
        tag: 'Arquivo',
      },
    ],
  },
  {
    id: 'prestacao',
    titulo: 'Prestação de contas e continuidade',
    personalidade: 'prestacao',
    descricao:
      'A etapa que garante memória, transparência, participação e segurança na passagem de uma gestão para outra.',
    items: [
      {
        numero: '16',
        titulo: 'Como funciona a prestação de contas',
        subtitulo: 'Demonstrando como os recursos foram utilizados.',
        ementa:
          'Explica o processo de prestação de contas dos programas educacionais e sua importância para a continuidade dos repasses.',
        tag: 'Prestação',
      },
      {
        numero: '17',
        titulo: 'Processos administrativos da escola',
        subtitulo: 'Registros formais de decisões e procedimentos institucionais.',
        ementa:
          'Apresenta o conceito de processos administrativos e sua importância para registrar decisões e procedimentos da escola.',
        tag: 'Processos',
      },
      {
        numero: '18',
        titulo: 'Documentos oficiais da escola',
        subtitulo: 'Atas, ofícios e registros institucionais.',
        ementa:
          'Apresenta os principais documentos oficiais utilizados na administração escolar e suas funções.',
        tag: 'Oficial',
      },
      {
        numero: '19',
        titulo: 'Transparência e participação da comunidade',
        subtitulo: 'Controle social e acompanhamento da gestão escolar.',
        ementa:
          'Explica o papel do conselho escolar e da comunidade no acompanhamento dos recursos e decisões administrativas.',
        tag: 'Participação',
      },
      {
        numero: '20',
        titulo: 'Transição entre diretores',
        subtitulo: 'Organizando a passagem de gestão da escola.',
        ementa:
          'Apresenta os cuidados necessários na transição administrativa entre diretoras e diretores para garantir continuidade na gestão.',
        tag: 'Transição',
      },
    ],
  },
];

const toneMap = {
  origem: {
    section: 'bg-[#f7fbff] border-sky-100',
    chip: 'bg-sky-100 text-sky-800',
    title: 'text-sky-950',
    button: 'border-sky-200 text-sky-800 hover:bg-sky-50',
    accent: 'bg-sky-100',
    page: 'bg-[#f8fcff] border-sky-200',
    flow: 'bg-sky-50 border-sky-100',
  },
  estrutura: {
    section: 'bg-[#fffaf2] border-amber-100',
    chip: 'bg-amber-100 text-amber-900',
    title: 'text-amber-950',
    button: 'border-amber-200 text-amber-900 hover:bg-amber-50',
    accent: 'bg-amber-100',
    page: 'bg-[#fff9ef] border-amber-200',
    flow: 'bg-amber-50 border-amber-100',
  },
  planejamento: {
    section: 'bg-[#f7fff9] border-emerald-100',
    chip: 'bg-emerald-100 text-emerald-900',
    title: 'text-emerald-950',
    button: 'border-emerald-200 text-emerald-900 hover:bg-emerald-50',
    accent: 'bg-emerald-100',
    page: 'bg-[#f7fff9] border-emerald-200',
    flow: 'bg-emerald-50 border-emerald-100',
  },
  prestacao: {
    section: 'bg-[#fff8fc] border-rose-100',
    chip: 'bg-rose-100 text-rose-900',
    title: 'text-rose-950',
    button: 'border-rose-200 text-rose-900 hover:bg-rose-50',
    accent: 'bg-rose-100',
    page: 'bg-[#fff8fc] border-rose-200',
    flow: 'bg-rose-50 border-rose-100',
  },
};

function truncate(text, max) {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}...`;
}

function unitContent(item) {
  const base = {
    origem: {
      intro:
        'Esta unidade abre o mapa do financiamento escolar de um jeito leve e visual. Em vez de começar pelo detalhe burocrático, ela ajuda a enxergar de onde nascem os recursos, por quais caminhos passam e como chegam à rotina da escola.',
      charge:
        'Uma charge pode mostrar a diretora cercada por siglas até perceber que cada uma aponta para uma porta diferente de entrada de recursos.',
      video: 'Vídeo sugerido: o caminho dos recursos na escola',
    },
    estrutura: {
      intro:
        'Aqui o foco é a base institucional que sustenta a gestão: unidade executora, estatuto, cartório, conta e responsabilidades. É a parte da jornada que organiza o chão administrativo da escola.',
      charge:
        'Uma charge pode brincar com a pilha de documentos que parece distante, mas sustenta cada decisão importante da escola.',
      video: 'Vídeo sugerido: quem faz o quê na gestão dos recursos',
    },
    planejamento: {
      intro:
        'Nesta etapa, o foco sai da estrutura e entra na decisão prática: como usar bem os recursos. É a hora de transformar repasse em prioridade, compra, registro e organização.',
      charge:
        'Uma charge pode mostrar a escola cercada por urgências diferentes, tentando descobrir o que realmente precisa entrar primeiro no planejamento.',
      video: 'Vídeo sugerido: como planejar o uso dos recursos',
    },
    prestacao: {
      intro:
        'Aqui a jornada fecha o ciclo com memória, transparência e continuidade. A unidade mostra que prestação de contas, documentos e passagem de gestão são parte da proteção institucional da escola.',
      charge:
        'Uma charge pode mostrar uma diretora deixando um mural organizado para quem chega depois, em vez de uma pilha impossível de decifrar.',
      video: 'Vídeo sugerido: prestação de contas sem mistério',
    },
  };

  return {
    ...base[item.personalidade],
    fichas: [
      {
        id: 'leitura',
        tab: 'leitura',
        title: 'Leitura ampliada da unidade',
        preview: 'Uma explicação mais longa para compreender o sentido geral do tema.',
        paragraphs: [
          'Esta ficha transforma o tema da unidade em uma leitura mais contínua, menos fragmentada.',
          'Aqui, o objetivo não é apenas listar regras, mas mostrar como esse conteúdo pode fortalecer a tomada de decisão e diminuir dúvidas na rotina da escola.',
          'Ela serve como texto-base para estudo, reunião interna e retomada do assunto com mais calma.',
        ],
      },
      {
        id: 'pratica',
        tab: 'prática',
        title: 'Como isso aparece na prática',
        preview: 'Exemplos concretos de como o tema aparece no dia a dia da escola.',
        paragraphs: [
          'Na prática, esta unidade aparece quando a direção precisa transformar regra em decisão concreta.',
          'Ela também surge quando a equipe tenta organizar melhor papéis, tempos e responsabilidades.',
          'Quando esse conteúdo fica claro, a escola ganha previsibilidade e mais segurança para agir.',
        ],
      },
      {
        id: 'conversa',
        tab: 'conversa',
        title: 'Perguntas para conversa com a equipe',
        preview: 'Uma ficha pensada para apoiar reunião, formação ou conversa interna.',
        paragraphs: [
          'Quais pontos desta unidade a equipe já domina e quais ainda parecem mais nebulosos?',
          'Que quadro, checklist ou fluxo ajudaria a tornar esse conteúdo mais claro para toda a escola?',
          'Como este tema conversa com a próxima decisão administrativa que a direção vai tomar?',
        ],
      },
    ],
  };
}

export default function ChegouAContaMapa() {
  const [openItem, setOpenItem] = useState(null);
  const [pinned, setPinned] = useState(null);
  const trilhas = useMemo(() => trilhasBase, []);

  const allItems = trilhas.flatMap((trilha) =>
    trilha.items.map((item) => ({ ...item, personalidade: trilha.personalidade, trilha: trilha.titulo }))
  );

  const activeItem = allItems.find((item) => item.numero === openItem) || null;

  if (activeItem) {
    return <UnitPage item={activeItem} allItems={allItems} onBack={() => setOpenItem(null)} onNavigate={setOpenItem} />;
  }

  return (
    <div className="min-h-screen bg-[#f6f0e6] text-slate-700">
      <main className="mx-auto max-w-7xl px-6 py-10 font-['Nunito','Quicksand',sans-serif] md:px-10 lg:px-12">
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
                Jornada da Gestão Escolar
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#617285] md:text-xl">
                Um mural rico, acolhedor e visual para navegar pelas unidades do <span className="font-semibold text-slate-700">Chegou a Conta, Diretora</span>.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {['20 unidades', '4 trilhas', 'visual de mural', 'navegação afetiva'].map((chip) => (
                  <span key={chip} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#6f8094] shadow-sm">
                    {chip}
                  </span>
                ))}
              </div>
            </div>

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
                {trilhas.map((trilha, index) => (
                  <button
                    key={trilha.id}
                    type="button"
                    onClick={() => document.getElementById(`trilha-${trilha.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className={`rounded-[24px] border border-white/80 p-4 text-left shadow-[0_10px_24px_rgba(0,0,0,0.06)] transition hover:-translate-y-1 ${toneMap[trilha.personalidade].accent}`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-[16px] border border-slate-300 bg-white/90 px-3 py-2 text-lg shadow-sm">{index + 1}</span>
                      <span className="rounded-full bg-white/75 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                        trilha {index + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold leading-tight text-slate-700">{trilha.titulo}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{trilha.items.length} unidades</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-12">
          {trilhas.map((trilha, trilhaIndex) => {
            const tone = toneMap[trilha.personalidade];
            return (
              <section key={trilha.id} id={`trilha-${trilha.id}`} className={`relative overflow-hidden rounded-[34px] border p-6 shadow-[0_18px_44px_rgba(123,84,45,0.12)] md:p-8 ${tone.section}`}>
                <div className={`absolute right-6 top-6 rounded-xl border px-3 py-2 text-sm shadow-sm ${tone.chip}`}>
                  etapa {trilhaIndex + 1}
                </div>
                <div className={`absolute left-10 top-6 h-16 w-16 rotate-6 rounded-[18px] opacity-55 ${tone.accent}`} />
                <div className="relative mb-8 max-w-3xl pt-8">
                  <p className="mb-3 inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[#8093aa]">
                    mapa da jornada
                  </p>
                  <div className="inline-flex max-w-full rotate-[-1deg] rounded-[18px] border border-white/80 bg-white/92 px-4 py-3 shadow-sm">
                    <h2 className="text-3xl font-extrabold text-slate-700 md:text-4xl">{trilha.titulo}</h2>
                  </div>
                  <p className="mt-4 text-lg leading-8 text-[#68788d]">{trilha.descricao}</p>
                </div>

                <div className="relative grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {trilha.items.map((item, itemIndex) => {
                    const isPinned = pinned === item.numero;
                    const header = itemIndex % 3 === 0 ? 'anotação da diretora' : itemIndex % 3 === 1 ? 'guia rápido' : 'comunicado oficial';
                    const paperStyle = itemIndex % 3 === 2
                      ? 'bg-[repeating-linear-gradient(to_bottom,#ffffff,#ffffff_24px,#e5e7eb_25px)] border-[#e3c9c3]'
                      : 'bg-[#fffdf7] border-slate-200';
                    return (
                      <motion.article
                        key={item.numero}
                        whileHover={{ y: -2, rotate: itemIndex % 2 === 0 ? -0.35 : 0.35 }}
                        onClick={() => setPinned((current) => (current === item.numero ? null : item.numero))}
                        className={`group relative overflow-visible rounded-[30px_24px_30px_36px] border ${paperStyle} p-5 shadow-[0_14px_22px_rgba(0,0,0,0.08)] before:absolute before:-top-2 before:left-6 before:h-4 before:w-16 before:rotate-[-3deg] before:bg-[#f3e8c8] before:content-[''] transition ${isPinned ? 'ring-2 ring-offset-2 ring-slate-200 shadow-[0_18px_34px_rgba(0,0,0,0.12)]' : ''}`}
                      >
                        {isPinned ? (
                          <>
                            <div className="absolute -top-4 left-[22%] h-8 w-8 -translate-x-1/2 rounded-full border border-[#9f2940] bg-gradient-to-b from-[#f27b87] via-[#de4f62] to-[#b73047] shadow-[0_10px_16px_rgba(0,0,0,0.22)]" />
                            <div className="absolute left-[22%] top-[10px] h-2 w-2 -translate-x-1/2 rounded-full bg-[rgba(88,52,52,0.14)]" />
                          </>
                        ) : (
                          <div className={`pointer-events-none absolute -top-3 left-8 h-6 w-16 rotate-[-3deg] rounded-sm border shadow-sm ${tone.accent}`} />
                        )}

                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-[15px] border border-slate-200 bg-white text-sm font-extrabold text-slate-600 shadow-sm">
                            {item.numero}
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${tone.chip}`}>
                            {item.tag}
                          </span>
                        </div>

                        <div className="mb-4 rounded-[24px_16px_22px_28px] border border-slate-200 bg-[#fffdf8] p-3 shadow-sm">
                          <div className="space-y-2">
                            <div className="h-2 w-24 rounded-full bg-slate-300/70" />
                            <div className="h-2 w-16 rounded-full bg-slate-200/80" />
                            <div className="h-2 w-28 rounded-full bg-slate-200/70" />
                          </div>
                        </div>

                        <div className="inline-flex max-w-[90%] rounded-[14px] border border-slate-200 bg-white/96 px-3 py-2 shadow-sm">
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">{header}
                            {header === 'comunicado oficial' && (
                              <span className="ml-2 inline-block rounded border border-rose-200 bg-rose-50 px-2 py-[1px] text-[9px] font-bold uppercase tracking-[0.18em] text-rose-700">PDDE</span>
                            )}</p>
                            <div className="mt-1 h-[2px] w-20 rounded-full bg-slate-200" />
                          </div>
                        </div>

                        <h3 className={`mt-3 pr-12 text-[20px] font-extrabold leading-tight ${tone.title}`}>{item.titulo}</h3>
                        <p className="mt-2 text-[12px] font-semibold leading-5 text-slate-700">{truncate(item.subtitulo, 44)}</p>
                        <p className="mt-2 text-[12px] leading-5 text-slate-600">{truncate(item.ementa, 52)}</p>
                        <div className="mt-2 border-t border-dashed border-slate-200/80 pt-2 text-[11px] leading-5 text-slate-500">
                          <span className="font-semibold">{isPinned ? 'Fixado no mural:' : 'No mural:'}</span>{' '}
                          {isPinned ? 'esta unidade foi presa no mural para consulta rápida.' : 'aviso importante para consulta rápida da diretora e da equipe escolar.'}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenItem(item.numero);
                            }}
                            className={`rounded-full border bg-white px-4 py-2 text-sm font-medium shadow-sm transition ${tone.button}`}
                          >
                            Abrir unidade
                          </button>
                          <span className="text-lg transition group-hover:translate-x-1">→</span>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </section>
      </main>
    </div>
  );
}

function UnitPage({ item, allItems, onBack, onNavigate }) {
  const tone = toneMap[item.personalidade];
  const content = unitContent(item);
  const [openFicha, setOpenFicha] = useState(null);

  return (
    <div className="min-h-screen bg-[#f6f0e6] font-['Nunito','Quicksand',sans-serif] text-slate-700">
      <style>{`
        @keyframes tvFlicker {
          0%, 100% { opacity: 0.9; transform: scaleY(1); }
          20% { opacity: 0.75; transform: scaleY(0.98); }
          40% { opacity: 0.95; transform: scaleY(1.01); }
          60% { opacity: 0.82; transform: scaleY(0.99); }
          80% { opacity: 0.92; transform: scaleY(1); }
        }
      `}</style>

      <main className="mx-auto max-w-7xl px-6 py-10 md:px-10 lg:px-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button onClick={onBack} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#6f8094] shadow-sm">
            ← voltar ao mural
          </button>
          <div className="flex gap-2">
            <button onClick={() => onNavigate(allItems[Math.max(0, allItems.findIndex((i) => i.numero === item.numero) - 1)].numero)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#6f8094] shadow-sm">
              anterior
            </button>
            <button onClick={() => onNavigate(allItems[Math.min(allItems.length - 1, allItems.findIndex((i) => i.numero === item.numero) + 1)].numero)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#6f8094] shadow-sm">
              próxima
            </button>
          </div>
        </div>

        <section className={`relative overflow-hidden rounded-[34px] border p-8 shadow-[0_20px_70px_rgba(123,84,45,0.12)] md:p-10 ${tone.page}`}>
          <div className="absolute left-1/2 top-0 h-7 w-40 -translate-x-1/2 rounded-b-[20px] border border-white/70 bg-white/75 shadow-sm" />
          <div className={`absolute right-8 top-8 h-16 w-16 rotate-6 rounded-[18px] opacity-55 ${tone.accent}`} />

          <div className="relative grid gap-8 xl:grid-cols-[0.78fr_1.22fr]">
            <aside className="rounded-[28px] border border-white/80 bg-[#fffdf7] p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-slate-200 bg-white text-2xl shadow-sm">
                  {item.personalidade === 'origem' ? '💧' : item.personalidade === 'estrutura' ? '📁' : item.personalidade === 'planejamento' ? '🗂️' : '📝'}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">unidade {item.numero}</p>
                  <p className="text-sm font-medium text-slate-600">{item.tag}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.trilha}</p>
                </div>
              </div>
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
                <span className="font-semibold">Nesta unidade:</span> visão geral, leitura guiada, materiais de apoio e fichas longas para consulta.
              </div>
            </aside>

            <section className="relative min-w-0">
              <div className="inline-flex max-w-full rotate-[-1deg] rounded-[16px] border border-white/80 bg-[#fffdf7] px-4 py-2 shadow-sm">
                <div className="absolute -top-3 left-6 h-5 w-16 rotate-[-4deg] rounded-sm border border-white/70 bg-white/75" />
                <h1 className="text-3xl font-extrabold leading-tight text-slate-700 md:text-5xl">{item.titulo}</h1>
              </div>
              <p className="mt-4 max-w-3xl text-lg font-medium leading-8 text-slate-600">{item.subtitulo}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full border border-slate-200 bg-[#fffdf7] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  leitura completa da unidade
                </div>
                <div className="inline-flex rotate-[1deg] rounded-[14px] border border-white/80 bg-white/94 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] shadow-sm">
                  feito para consulta afetiva
                </div>
              </div>

              <div className="mt-8 grid gap-5">
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <section className="rounded-[24px] border border-white/80 bg-white/78 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                        leitura principal
                      </div>
                      <div className="hidden md:block rounded-[16px] border bg-white/88 px-3 py-2 text-[11px] font-semibold shadow-sm">
                        olhe esta unidade como uma peça do todo
                      </div>
                    </div>
                    <p className="text-base leading-8 text-slate-700">{content.intro}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[18px] border border-slate-200 bg-[#fffdf8] p-4 shadow-sm">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">olhar geral</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Ajuda a ligar o conteúdo da unidade à rotina concreta da escola.</p>
                      </div>
                      <div className="rounded-[18px] border border-slate-200 bg-[#fffdf8] p-4 shadow-sm">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">pergunta-chave</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">O que a diretora precisa enxergar com clareza para tomar decisões melhores?</p>
                      </div>
                    </div>
                  </section>

                  <div className="grid gap-4">
                    <section className="relative rounded-[24px] border border-white/80 bg-white/94 p-4 shadow-sm">
                      <div className="absolute -right-3 top-5 rotate-[8deg] rounded-[12px] border px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] shadow-sm">
                        comentada
                      </div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">charge comentada</p>
                      <div className="mt-3 rounded-[18px] border border-white/80 bg-white/80 p-4">
                        <div className="mb-3 h-[2px] w-20 rounded-full bg-slate-200" />
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-slate-200 bg-slate-50 shadow-sm text-2xl">
                            💬
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">Charge comentada da unidade</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{content.charge}</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-[24px] border border-[#e7dcc6] bg-[#fffdf7] p-4 shadow-sm">
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">vídeo sugerido</p>
                      <div className="mt-3 rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="h-[2px] w-16 rounded-full bg-slate-200" />
                          <div className="flex gap-1"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /></div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="relative text-slate-700">
                            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-slate-200 bg-white shadow-sm">📺</div>
                            <div className="pointer-events-none absolute left-[13px] top-[17px] h-[16px] w-[22px] rounded-[3px] bg-white/35" style={{ animation: 'tvFlicker 1.8s steps(3) infinite' }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-700">{content.video}</p>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">vídeo de apoio</p>
                            <p className="mt-3 text-sm leading-6 text-slate-600">Um bloco para vídeo curto, aula comentada ou orientação introdutória sobre esta unidade.</p>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                <section className="rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">gaveta de fichas</p>
                      <p className="mt-1 text-sm text-slate-600">As fichas ficam organizadas em coluna. Clique para abrir a leitura longa em uma janela própria.</p>
                    </div>
                    <div className="text-2xl">🗃️</div>
                  </div>
                  <div className="grid gap-3 md:max-w-[560px]">
                    {content.fichas.map((ficha) => {
                      const isOpen = openFicha === ficha.id;
                      return (
                        <motion.button
                          key={ficha.id}
                          type="button"
                          onClick={() => setOpenFicha(ficha.id)}
                          initial={false}
                          animate={{ x: isOpen ? 8 : 0, scale: isOpen ? 1.01 : 1 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                          className={`w-full rounded-[18px] border bg-white px-4 py-4 text-left shadow-sm transition ${isOpen ? tone.flow : 'border-slate-200 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                                {ficha.tab}
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-700">{ficha.title}</div>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{ficha.preview}</p>
                            </div>
                            <div className="shrink-0 text-slate-400">↗</div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr_0.95fr]">
                  <div className={`rounded-[22px] border p-4 shadow-sm ${tone.flow}`}>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">mapa mental / fluxo / checklist</p>
                      <div className="text-xl">🔀</div>
                    </div>
                    <div className="grid gap-3">
                      <div className="rounded-[18px] border border-white/80 bg-white/80 p-4 shadow-sm">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">fluxo sugerido</p>
                        <div className="mt-3 grid gap-2 text-sm text-slate-600">
                          {['entender', 'organizar', 'registrar', 'acompanhar'].map((step, idx) => {
                            const indentClass = idx === 0 ? '' : idx === 1 ? 'ml-4' : idx === 2 ? 'ml-8' : 'ml-12';
                            const lineClass = idx === 0 ? 'ml-3' : idx === 1 ? 'ml-7' : 'ml-11';
                            return (
                              <div key={step}>
                                <div className={`flex items-center gap-2 ${indentClass}`}>
                                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300" />
                                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{step}</span>
                                </div>
                                {idx < 3 ? <div className={`h-4 w-[2px] bg-slate-200 ${lineClass}`} /> : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="rounded-[18px] border border-white/80 bg-white/80 p-4 shadow-sm">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">checklist rápido</p>
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                          <li className="flex gap-2"><span className="mt-1.5 inline-block h-4 w-4 rounded border border-slate-300 bg-white" /> verificar informações principais</li>
                          <li className="flex gap-2"><span className="mt-1.5 inline-block h-4 w-4 rounded border border-slate-300 bg-white" /> registrar decisões e documentos</li>
                          <li className="flex gap-2"><span className="mt-1.5 inline-block h-4 w-4 rounded border border-slate-300 bg-white" /> conectar com a próxima etapa</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-slate-200 bg-white/78 p-4 shadow-sm">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">o que observar</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                      <li className="flex gap-2"><span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-300" /> <span>Se a equipe compreende a lógica geral da unidade.</span></li>
                      <li className="flex gap-2"><span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-300" /> <span>Se existem registros claros para consulta futura.</span></li>
                      <li className="flex gap-2"><span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-300" /> <span>Se o conteúdo já conversa com a rotina da escola.</span></li>
                    </ul>
                  </div>

                  <div className="rounded-[20px] border border-slate-200 bg-white/78 p-4 shadow-sm">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">próximos passos</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                      <li className="flex gap-2"><span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-300" /> <span>Relacionar esta unidade à próxima trilha.</span></li>
                      <li className="flex gap-2"><span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-300" /> <span>Usar a ficha longa em reunião interna.</span></li>
                      <li className="flex gap-2"><span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-300" /> <span>Criar um apoio visual próprio para a equipe.</span></li>
                    </ul>
                  </div>
                </section>
              </div>
            </section>
          </div>
        </section>

        <AnimatePresence>
          {openFicha ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm" onClick={() => setOpenFicha(null)}>
              <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.22, ease: 'easeOut' }} onClick={(e) => e.stopPropagation()} className={`relative w-full max-w-4xl overflow-hidden rounded-[30px] border p-6 shadow-[0_30px_80px_rgba(0,0,0,0.22)] ${tone.page}`}>
                <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">ficha aberta</p>
                    <h3 className="mt-2 text-2xl font-extrabold leading-tight text-slate-700">{content.fichas.find((ficha) => ficha.id === openFicha)?.title}</h3>
                  </div>
                  <button onClick={() => setOpenFicha(null)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#6f8094] shadow-sm">fechar</button>
                </div>
                <div className="max-h-[68vh] space-y-5 overflow-auto rounded-[22px] border border-white/80 bg-[#fffdf7] p-6 text-[15px] leading-8 text-slate-600 shadow-sm">
                  {content.fichas.find((ficha) => ficha.id === openFicha)?.paragraphs.map((paragraph, idx) => <p key={idx}>{paragraph}</p>)}
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}
