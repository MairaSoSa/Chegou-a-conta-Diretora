import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

function getPageTitle(): string {
  const h1 = document.querySelector("h1,h2");
  return h1?.textContent?.trim() ?? document.title ?? "página";
}

function getPageText(): string {
  const root = document.querySelector("main") ?? document.body;
  const skip = new Set(["script","style","noscript","svg","path","iframe","nav","footer","button"]);
  const parts: string[] = [];

  function walk(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (skip.has(tag)) return;
      if (el.getAttribute("aria-hidden") === "true") return;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return;
      for (const child of Array.from(el.childNodes)) walk(child);
    } else if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent?.trim();
      if (t && t.length > 1) parts.push(t);
    }
  }

  walk(root);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function innerText(el: HTMLElement): string {
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

function isClickable(el: HTMLElement): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag === "a" || tag === "button") return true;
  const role = el.getAttribute("role");
  if (role === "button" || role === "link") return true;
  const style = window.getComputedStyle(el);
  return style.cursor === "pointer";
}

// Maps a computed rgb() color to a Portuguese color name for audio description.
// Thresholds are calibrated against the actual CSS card colors used in the app:
//   hl-yellow #f9e6a7=rgb(249,230,167) · hl-pink #f7c3d1=rgb(247,195,209)
//   hl-green  #c7e8d2=rgb(199,232,210) · hl-orange #ffe0b8=rgb(255,224,184)
//   hl-purple #d3c7f2=rgb(211,199,242) · hl-teal #b3e5de=rgb(179,229,222)
// Returns "" for near-white, very-light or unrecognized colors.
function cssColorToName(rgb: string): string {
  const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return "";
  const r = +m[1], g = +m[2], b = +m[3];
  // Transparent / near-white / black
  if (r > 248 && g > 248 && b > 248) return "";   // pure white
  if (r > 240 && g > 238 && b > 230) return "";   // near-white / very light beige
  if (r < 20  && g < 20  && b < 20)  return "";   // black
  // Purple / lilac: B is the dominant channel, B > R > G  (e.g. #d3c7f2)
  if (b > 210 && r > 190 && b > r && b > g && r > g) return "lilás";
  // Teal / mint / sage: G ≈ B >> R  (e.g. #b3e5de, #c7e8d2)
  if (g > 190 && b > 175 && r < 210 && g > r && b > r && g - r > 25) return "verde-água";
  // Pink / rose: R >> G, B > G, R > B  (e.g. #f7c3d1)
  if (r > 220 && b > g && r > b && r - g > 30) return "rosada";
  // Yellow: R ≈ G >> B, all warm  (e.g. #f9e6a7)
  if (r > 220 && g > 200 && b > 130 && b < 200 && r >= g && g - b > 40 && r - b > 60) return "amarela";
  // Light orange / peach: R >> B, G is high  (e.g. #ffe0b8)
  if (r > 235 && g > 190 && b > 150 && r > g && g > b && r - b > 50) return "laranja";
  // Blue: B is clearly dominant
  if (b > 185 && b > r + 40 && b > g + 20) return "azul";
  // Deep red / coral
  if (r > 200 && g < 120 && b < 120) return "vermelha";
  return "";
}

// Returns true if el appears to be a content card with a colored background.
function detectCard(el: HTMLElement): boolean {
  const tag = el.tagName.toLowerCase();
  if (!["div","article","li"].includes(tag)) return false;
  const style = window.getComputedStyle(el);
  if (!cssColorToName(style.backgroundColor)) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width < 90 || rect.height < 60) return false;
  return el.querySelector("h1,h2,h3,h4,h5,h6,strong") !== null;
}

// Known destinations by card title — what you'll find when you click each card.
const CARD_DESTINATIONS: Record<string, string> = {
  "Painel da Escola": "o Painel da Escola, onde você pesquisa sua escola pelo nome ou código INEP e vê dados de matrículas, IDEB, situação financeira e repasses do FNDE",
  "Legislação": "a Legislação, com leis, resoluções, portarias e instruções normativas do Ministério da Educação, além do Diário Oficial",
  "Calendário": "o Calendário de Prazos, com as datas de prestação de contas, repasses e obrigações do FNDE ao longo do ano",
  "Programas": "a seção de Programas, com explicações sobre o PDDE, PNAE, PNATE e as Ações Integradas",
  "Ferramentas": "as Ferramentas, uma biblioteca com modelos de ofício, planilhas de controle e materiais práticos para download",
  "Caderno da Diretora": "o Caderno da Diretora, onde você pode conversar com inteligência artificial sobre dúvidas da gestão, anotar e redigir documentos escolares",
  "Trilha da Diretora": "a Trilha da Diretora, um percurso de aprendizado com etapas explicando como funciona o financiamento da escola pública",
  "Glossário": "o Glossário, com explicações dos termos técnicos usados na gestão escolar",
};

// Known destinations by href path.
const HREF_DESTINATIONS: Record<string, string> = {
  "/dashboard": CARD_DESTINATIONS["Painel da Escola"],
  "/legislacao": CARD_DESTINATIONS["Legislação"],
  "/calendario": CARD_DESTINATIONS["Calendário"],
  "/programas": CARD_DESTINATIONS["Programas"],
  "/ferramentas": CARD_DESTINATIONS["Ferramentas"],
  "/chat": CARD_DESTINATIONS["Caderno da Diretora"],
  "/trilha": CARD_DESTINATIONS["Trilha da Diretora"],
  "/glossario": CARD_DESTINATIONS["Glossário"],
};

// Builds a spatial, interpretive description of a colored card — like guiding someone with eyes closed.
// hrefOverride: the href of a parent <a> wrapping this card element, when the card itself has no <a>.
function describeCard(el: HTMLElement, hrefOverride?: string): string {
  const style = window.getComputedStyle(el);
  const colorName = cssColorToName(style.backgroundColor);

  const heading = el.querySelector("h1,h2,h3,h4,h5,h6");
  const headText = heading?.textContent?.trim() ?? "";

  // Collect subtitle / body text, excluding heading and very short strings
  const bodyNodes = Array.from(el.querySelectorAll("p,span,small,[class*=remendo],[class*=label]"))
    .map(n => n.textContent?.trim() ?? "")
    .filter(t => t && t !== headText && t.length > 2)
    .filter((t, i, arr) => arr.indexOf(t) === i);
  const bodyText = bodyNodes.slice(0, 2).join(". ");

  // Named button or link inside the card (explicit <a> or <button>)
  const cta = Array.from(el.querySelectorAll("a,button"))
    .map(n => n.textContent?.trim())
    .filter(t => t && t.length > 1)
    .slice(0, 1)[0];

  // Find where this card leads — prefer hrefOverride, then inner <a>, then title lookup
  const linkHref = hrefOverride
    ?? (el.querySelector("a[href]") as HTMLAnchorElement | null)?.getAttribute("href")
    ?? "";
  const destination = HREF_DESTINATIONS[linkHref] ?? CARD_DESTINATIONS[headText];

  const postIt = colorName ? `No post-it ${colorName}` : "No post-it";
  let desc = `${postIt} está escrito: ${headText}.`;
  if (bodyText) desc += ` ${bodyText}.`;
  if (cta && cta !== headText) desc += ` Tem um botão que diz: "${cta}".`;
  if (destination) desc += ` Clicando, você vai para ${destination}.`;
  else desc += " É clicável.";
  return desc;
}

function getPageTextDescribed(): string {
  const parts: string[] = [];
  const path = window.location.pathname;
  const sectionName = path === "/" ? "página inicial" :
    path.startsWith("/dashboard") ? "Painel da Escola" :
    path.startsWith("/trilha") ? "Trilha da Diretora" :
    path.startsWith("/legislacao") ? "Legislação" :
    path.startsWith("/programas") ? "Programas" :
    path.startsWith("/ferramentas") ? "Ferramentas" :
    path.startsWith("/chat") ? "Caderno da Diretora" :
    path.startsWith("/calendario") ? "Calendário" :
    "esta página";

  const siteIntros: Record<string, string> = {
    "/": "Estamos na página inicial do site chamado Chegou a Conta, Diretora. É um espaço feito especialmente para diretoras de escola pública aprenderem como funcionam os recursos financeiros e os programas do governo federal para a educação.",
    "/dashboard": "Estamos no Painel da Escola, a ferramenta principal do site. Aqui você pesquisa qualquer escola pública brasileira pelo nome ou pelo código INEP e acessa os dados completos: número de matrículas, turmas, docentes, indicadores do IDEB e, se a escola tiver UEx cadastrada, os dados financeiros dos programas PDDE, PNAE e outros.",
    "/trilha": "Estamos na Trilha da Diretora, um percurso de aprendizado em etapas. Cada etapa explica um tema diferente sobre como funciona a gestão financeira das escolas públicas, desde o que é o PDDE até como fazer a prestação de contas. É um caminho progressivo — você pode seguir na ordem ou ir direto ao tema que precisa.",
    "/legislacao": "Estamos na seção de Legislação, o acervo de normas jurídicas da educação. Aqui você encontra as leis e resolução que regem os programas escolares — filtradas por tipo: Portarias, Resoluções, Leis Federais, Editais e mais. Além disso, há integração com o Diário Oficial da União e os Diários Municipais.",
    "/programas": "Estamos na seção de Programas do FNDE. Aqui você encontra explicações detalhadas sobre o PDDE, o PNAE, o PNATE, o FUNDEB e as Ações Integradas — o que cada um financia, quem tem direito, quais são as regras. Também há um glossário com os termos técnicos explicados em linguagem simples.",
    "/ferramentas": "Estamos na seção de Ferramentas, uma biblioteca de materiais prontos para usar no dia a dia da escola. Aqui ficam modelos de ofício, planilhas de controle de gastos, checklists de prestação de contas e outros documentos em formatos Excel, Word, PDF e Checklist.",
    "/chat": "Estamos no Caderno da Diretora, o ambiente interativo do site. Ele tem duas partes: a Folha de Pesquisa, onde você conversa com a inteligência artificial e tira dúvidas sobre gestão escolar, e o Editor de Documentos, onde você preenche formulários guiados para redigir documentos oficiais como ofícios, atas e relatórios.",
    "/calendario": "Estamos no Calendário de Prazos. Aqui ficam registradas todas as datas importantes do ano escolar relacionadas ao FNDE: prazos de prestação de contas, períodos de repasse, obrigações do PDDE, PNAE, PNATE, FUNDEB, CENSO e SAEB. Os prazos mais urgentes ficam destacados em vermelho-rosa.",
  };
  const intro = siteIntros["/"] && path === "/"
    ? siteIntros["/"]
    : Object.entries(siteIntros).filter(([k]) => k !== "/").find(([k]) => path.startsWith(k))?.[1]
    ?? `Estamos na seção ${sectionName} do site Chegou a Conta, Diretora.`;
  parts.push(intro);

  // Describe the visual design and layout of the current page — rich, spatial, interpretive.
  const pageLayouts: Record<string, string> = {
    "/": "O design da página imita uma folha de caderno escolar com fundo bege creme e linhas horizontais finas em toda a área, como papel pautado. Na lateral esquerda há uma margem rosada, reforçando a metáfora do caderno. No topo da página existe uma faixa horizontal de cor verde-sálvia escura, que contém o logotipo do site e o menu principal de navegação com todas as seções. O corpo da página é dividido em duas colunas: a esquerda, mais larga, apresenta o título de boas-vindas e os seis post-its coloridos com os atalhos principais; a direita, mais estreita, tem um quadro com a Trilha da Diretora, listando os temas de aprendizado disponíveis em sequência numerada. No rodapé, uma faixa bege com links institucionais.",
    "/dashboard": "A página do Painel da Escola tem fundo branco e estrutura de painel de dados profissional. Bem no topo, após a barra de navegação verde-sálvia, há um campo de busca grande onde você digita o nome ou código INEP da sua escola. Ao selecionar uma escola, a página se transforma: aparece o nome e endereço da escola em destaque, e abaixo surgem múltiplas seções de dados. As informações financeiras do FNDE ficam em blocos verdes com valores monetários. Os gráficos de matrículas e evolução são barras azuis e verdes sobre fundo claro. Os indicadores do IDEB e taxas de rendimento aparecem em cartões com borda colorida. No lado direito há um mapa interativo do Brasil com os estados coloridos em tons pastéis diferentes.",
    "/trilha": "A página da Trilha da Diretora tem fundo bege-creme com visual de um mural de aprendizado. Na parte superior há uma seção de destaque com fundo amarelo-bege e bordas arredondadas, onde está o título principal em letras grandes escuras e a descrição da trilha. Os botões de filtro por unidade temática são pílulas arredondadas. Abaixo, as unidades da trilha são apresentadas como fichas ou cartões organizados em grade, cada um com uma cor temática diferente: azul para finanças, âmbar para planejamento, verde-esmeralda para gestão, rosa para legislação. Cada ficha tem número, título, duração estimada e um pequeno resumo.",
    "/legislacao": "A página de Legislação tem fundo bege suave com detalhes terrosos. Na parte superior há uma seção de filtros: botões arredondados para selecionar o tipo de norma — Portarias, Resoluções, Leis, Editais. Ao lado dos filtros está o campo de busca por palavra-chave. Abaixo, o conteúdo é dividido em duas listas principais: 'Normas Fundamentais', com fundo amarelo-âmbar suave e barra dourada na lateral, listando as leis mais importantes para a escola; e 'Normas do FNDE', com barra laranja. Cada norma aparece como um cartão branco com título em verde-escuro, número de referência em cinza, descrição e uma coluna chamada 'Para a diretora' com linguagem prática.",
    "/programas": "A página de Programas tem fundo bege claro com visual de documentos e papéis empilhados. A primeira seção apresenta um Glossário com campo de busca e filtro por letra do alfabeto. Os termos aparecem em fichas com fundo creme e uma dobra decorativa no canto superior direito, como papel dobrado. A seguir, os programas são apresentados em blocos maiores: o PDDE tem um cartão com borda dourada e a marcação 'Direto para a escola' em verde; cada subprograma aparece como uma ficha interna menor. Os outros programas — PNAE, PNATE, FUNDEB — aparecem em seções separadas com suas próprias fichas e cores.",
    "/ferramentas": "A página de Ferramentas tem fundo claro e apresenta os materiais com visual de folhetos ou flyers flutuantes. Cada ferramenta é representada por um cartão que parece uma folha de papel com sombra suave e uma fita adesiva decorativa no topo. As fitas têm cores diferentes por categoria: violeta, azul-claro, verde-esmeralda, âmbar e rosa. No canto inferior de cada cartão há um selo colorido indicando o formato do arquivo: verde para Excel, azul para Word, âmbar para Checklist, vermelho-rosa para PDF. Os cartões flutuam em grade com espaçamento generoso.",
    "/chat": "A página do Caderno da Diretora tem dois ambientes separados por abas no topo. A primeira aba é a Folha de Pesquisa: tem fundo bege claro e apresenta uma conversa com a inteligência artificial. As mensagens da IA aparecem em balões brancos com borda marrom-suave, e as suas mensagens aparecem em balões vermelho-escuro com texto branco. No topo da conversa há fichas de sugestão de perguntas em cores pastéis. A segunda aba é o Editor de Documentos: traz campos de formulário para redigir documentos oficiais, com uma barra lateral direita mostrando dicas e um guia de preenchimento com indicadores de progresso em verde.",
    "/calendario": "A página do Calendário tem fundo bege-creme com visual de caderno de anotações. No topo há um calendário interativo com fundo branco e bordas arredondadas, onde você pode navegar pelos meses. Abaixo do calendário aparecem as fichas de prazos, cada uma com uma cor diferente dependendo do programa: azul-claro para o PDDE, verde-esmeralda para o PNAE, âmbar para o PNATE, violeta para o FUNDEB, rosa para o CENSO. Cada ficha mostra o programa, a data, a descrição do prazo e um indicador de urgência: vermelho-rosa para prazo urgente, âmbar para atenção, verde para apenas informativo.",
  };

  const layoutDesc = pageLayouts["/"] && path === "/"
    ? pageLayouts["/"]
    : Object.entries(pageLayouts).filter(([k]) => k !== "/").find(([k]) => path.startsWith(k))?.[1];
  if (layoutDesc) parts.push(layoutDesc);

  // Describe navigation links
  const nav = document.querySelector("nav");
  if (nav) {
    const navLinks = Array.from(nav.querySelectorAll("a,button"))
      .map(a => a.textContent?.trim())
      .filter(t => t && t.length > 1);
    if (navLinks.length) {
      parts.push(`O menu de navegação tem as seguintes seções disponíveis: ${navLinks.join(", ")}.`);
    }
  }

  const skip = new Set(["script","style","noscript","svg","path","iframe","nav","footer"]);
  const visited = new WeakSet<HTMLElement>();

  function walk(node: Node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    if (visited.has(el)) return;
    const tag = el.tagName.toLowerCase();
    if (skip.has(tag)) return;
    if (el.getAttribute("aria-hidden") === "true") return;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;

    // Helper: find a card element from a child — handles both direct cards and <a>-wrapped cards
    function resolveCard(child: HTMLElement): { card: HTMLElement; href: string } | null {
      if (detectCard(child)) return { card: child, href: "" };
      if (child.tagName.toLowerCase() === "a") {
        const inner = Array.from(child.children).find(gc => detectCard(gc as HTMLElement)) as HTMLElement | undefined;
        if (inner) return { card: inner, href: child.getAttribute("href") ?? "" };
      }
      return null;
    }

    // Detect a group of sibling cards (possibly wrapped in <a> links) and describe them as a set
    if (tag === "div" || tag === "section" || tag === "ul") {
      const resolvedCards = Array.from(el.children)
        .map(c => resolveCard(c as HTMLElement))
        .filter(Boolean) as { card: HTMLElement; href: string }[];

      if (resolvedCards.length >= 2) {
        // Mark all cards and their wrappers as visited
        resolvedCards.forEach(({ card }) => { visited.add(card); visited.add(card.parentElement!); });
        const heading = el.querySelector(":scope > h1,:scope > h2,:scope > h3");
        const groupTitle = heading?.textContent?.trim();
        if (groupTitle) {
          parts.push(`Logo abaixo, na seção "${groupTitle}", você vê um conjunto de post-its coloridos. Cada um leva a uma área diferente do site.`);
        } else {
          parts.push(`Há um conjunto de post-its coloridos na tela. Cada um leva a uma área diferente do site.`);
        }
        resolvedCards.forEach(({ card, href }) => parts.push(describeCard(card, href || undefined)));
        // Still walk non-card children of this container
        Array.from(el.childNodes).forEach(child => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const ch = child as HTMLElement;
            if (!resolvedCards.find(r => r.card === ch || r.card.parentElement === ch)) {
              walk(child);
            }
          }
        });
        return;
      }
    }

    // Individual card (direct or <a>-wrapped)
    if (detectCard(el)) {
      visited.add(el);
      parts.push(describeCard(el));
      return;
    }

    // <a> wrapping a single card
    if (tag === "a") {
      const href = el.getAttribute("href") ?? "";
      const innerCard = Array.from(el.children).find(c => detectCard(c as HTMLElement)) as HTMLElement | undefined;
      if (innerCard && !visited.has(innerCard)) {
        visited.add(innerCard);
        visited.add(el);
        parts.push(describeCard(innerCard, href));
        return;
      }
      // Plain link — describe it if it has meaningful text and a known destination
      const label = el.getAttribute("aria-label") || el.textContent?.trim();
      if (label && label.length > 1 && label.length < 80) {
        const dest = HREF_DESTINATIONS[href];
        if (dest) parts.push(`Link para ${dest}: "${label}".`);
        else parts.push(`Link: ${label}.`);
      }
      return;
    }

    // Headings — describe by visual weight, not level number
    if (["h1","h2","h3","h4"].includes(tag)) {
      const text = el.textContent?.trim();
      if (!text) return;
      const sz = parseFloat(style.fontSize);
      if (sz >= 28) parts.push(`Em letras grandes e destacadas: ${text}.`);
      else if (sz >= 20) parts.push(`Destaque: ${text}.`);
      else parts.push(`Subtítulo: ${text}.`);
      return;
    }

    // Standalone buttons
    if (tag === "button") {
      const label = el.getAttribute("aria-label") || el.textContent?.trim();
      if (label && label.length > 1 && label.length < 60) parts.push(`Botão "${label}".`);
      return;
    }

    // Paragraphs and list items
    if (["p","li"].includes(tag)) {
      const text = el.textContent?.trim();
      if (text && text.length > 2) parts.push(text);
      return;
    }

    // Generic container — recurse
    for (const child of Array.from(el.childNodes)) walk(child);
  }

  const root = document.querySelector("main") ?? document.body;
  for (const child of Array.from(root.childNodes)) walk(child);

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function chunkText(text: string, max = 900): string[] {
  const sentences = text.split(/(?<=[.!?;:])\s+/);
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (cur.length + s.length + 1 > max && cur) {
      chunks.push(cur.trim());
      cur = s;
    } else {
      cur += (cur ? " " : "") + s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.filter(c => c.length > 0);
}

async function fetchAudio(text: string): Promise<string> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("TTS request failed");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

interface TTSContextType {
  isActive: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  readPage: () => void;
  readPageDescribed: () => void;
  readSelection: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

const TTSContext = createContext<TTSContextType>({
  isActive: false, isPlaying: false, isPaused: false,
  readPage: () => {}, readPageDescribed: () => {}, readSelection: () => {},
  pause: () => {}, resume: () => {}, stop: () => {},
});

export function useTTS() { return useContext(TTSContext); }

export function TTSProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<string[]>([]);
  const idxRef = useRef(0);
  const stoppedRef = useRef(false);
  const prefetchedRef = useRef<{ idx: number; url: string } | null>(null);
  const blobUrlsRef = useRef<string[]>([]);

  const revokeAll = useCallback(() => {
    blobUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
    blobUrlsRef.current = [];
    prefetchedRef.current = null;
  }, []);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    revokeAll();
    chunksRef.current = [];
    idxRef.current = 0;
    setIsActive(false);
    setIsPlaying(false);
    setIsPaused(false);
  }, [revokeAll]);

  const prefetchNext = useCallback(async (nextIdx: number) => {
    const chunks = chunksRef.current;
    if (nextIdx >= chunks.length) return;
    if (prefetchedRef.current?.idx === nextIdx) return;
    try {
      const url = await fetchAudio(chunks[nextIdx]);
      if (stoppedRef.current) { URL.revokeObjectURL(url); return; }
      blobUrlsRef.current.push(url);
      prefetchedRef.current = { idx: nextIdx, url };
    } catch {
    }
  }, []);

  const playChunk = useCallback(async (idx: number) => {
    if (stoppedRef.current) return;
    const chunks = chunksRef.current;
    if (idx >= chunks.length) {
      setIsPlaying(false);
      setIsActive(false);
      return;
    }

    let url: string;
    if (prefetchedRef.current?.idx === idx) {
      url = prefetchedRef.current.url;
      prefetchedRef.current = null;
    } else {
      try {
        url = await fetchAudio(chunks[idx]);
        if (stoppedRef.current) { URL.revokeObjectURL(url); return; }
        blobUrlsRef.current.push(url);
      } catch {
        if (!stoppedRef.current) { idxRef.current = idx + 1; playChunk(idx + 1); }
        return;
      }
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    idxRef.current = idx;

    audio.play().catch(() => {});

    prefetchNext(idx + 1);

    audio.onended = () => {
      if (stoppedRef.current) return;
      playChunk(idx + 1);
    };
    audio.onerror = () => {
      if (!stoppedRef.current) playChunk(idx + 1);
    };
  }, [prefetchNext]);

  const start = useCallback((text: string) => {
    stop();
    const chunks = chunkText(text);
    if (chunks.length === 0) return;
    stoppedRef.current = false;
    chunksRef.current = chunks;
    idxRef.current = 0;
    setIsActive(true);
    setIsPlaying(true);
    setIsPaused(false);
    playChunk(0);
  }, [stop, playChunk]);

  const readPage = useCallback(() => {
    const text = getPageText();
    if (text) start(text);
  }, [start]);

  const readPageDescribed = useCallback(() => {
    const text = getPageTextDescribed();
    if (text) start(text);
  }, [start]);

  const readSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const fragment = range.cloneContents();

    const SKIP_TAGS = new Set(["script", "style", "svg", "noscript"]);
    const INTERACTIVE = new Set(["a", "button", "summary"]);

    const parts: string[] = [];

    function walk(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const t = node.textContent?.trim();
        if (t) parts.push(t);
        return;
      }
      if (!(node instanceof Element)) return;

      const tag = node.tagName.toLowerCase();
      if (SKIP_TAGS.has(tag)) return;

      // Prefer aria-label on interactive elements
      if (INTERACTIVE.has(tag) || node.getAttribute("role") === "button") {
        const label = node.getAttribute("aria-label");
        const inner = node.textContent?.replace(/\s+/g, " ").trim();
        const href = tag === "a" ? (node as HTMLAnchorElement).getAttribute("href") : null;
        const dest = href ? HREF_DESTINATIONS[href] ?? null : null;
        const readable = label || inner || "";
        if (readable) {
          if (dest) {
            parts.push(`${tag === "button" ? "Botão" : "Link"}: ${readable} — leva para ${dest}.`);
          } else {
            parts.push(`${tag === "button" ? "Botão" : "Link"}: ${readable}.`);
          }
        }
        return;
      }

      for (const child of node.childNodes) walk(child);
    }

    walk(fragment);

    const text = parts.join(" ").replace(/\s{2,}/g, " ").trim();
    if (text) start(text);
  }, [start]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying && !isPaused) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  }, [isPlaying, isPaused]);

  const resume = useCallback(() => {
    if (audioRef.current && isPaused) {
      audioRef.current.play().catch(() => {});
      setIsPaused(false);
    }
  }, [isPaused]);

  useEffect(() => () => { stop(); }, [stop]);

  return (
    <TTSContext.Provider value={{ isActive, isPlaying, isPaused, readPage, readPageDescribed, readSelection, pause, resume, stop }}>
      {children}
    </TTSContext.Provider>
  );
}
