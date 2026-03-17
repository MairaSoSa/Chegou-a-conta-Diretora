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
// Returns "" for near-white, transparent or unrecognized colors.
function cssColorToName(rgb: string): string {
  const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return "";
  const r = +m[1], g = +m[2], b = +m[3];
  // Skip near-white, very-light-beige or fully transparent backgrounds
  if (r > 240 && g > 232 && b > 218) return "";
  if (r === 0 && g === 0 && b === 0) return "";
  // Yellow / golden
  if (r > 220 && g > 195 && b < 140 && r - b > 90) return "amarela";
  // Peach / salmon
  if (r > 225 && g > 155 && g < 210 && b < 165 && r - g > 20 && r - b > 60) return "pêssego";
  // Orange / amber
  if (r > 225 && g > 120 && g < 175 && b < 100) return "laranja";
  // Pink / rose
  if (r > 215 && g > 165 && g < 215 && b > 160 && b < 215 && r - g > 10) return "rosada";
  // Light red / coral
  if (r > 220 && g < 150 && b < 150) return "vermelha";
  // Lilac / purple
  if (r > 170 && r < 230 && b > 185 && g < r && g < b) return "lilás";
  // Teal / mint / sage
  if (g > 170 && b > 165 && r < 180 && g > r && b > r) return "verde-água";
  // Light green / pistachio
  if (g > 195 && r > 180 && b < 185 && g - b > 30 && g >= r) return "verde-claro";
  // Blue
  if (b > 185 && r < 170 && g < 185 && b - r > 40) return "azul";
  // Warm brown / tan
  if (r > 180 && g > 140 && b < 120 && r - b > 70) return "bege-escuro";
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

// Builds a spatial, interpretive description of a colored card — like guiding someone with eyes closed.
function describeCard(el: HTMLElement): string {
  const style = window.getComputedStyle(el);
  const colorName = cssColorToName(style.backgroundColor);

  const heading = el.querySelector("h1,h2,h3,h4,h5,h6");
  const headText = heading?.textContent?.trim() ?? "";

  // Collect subtitle / body text, excluding the heading itself
  const bodyNodes = Array.from(el.querySelectorAll("p,span,small"))
    .map(n => n.textContent?.trim() ?? "")
    .filter(t => t && t !== headText && t.length > 2)
    .filter((t, i, arr) => arr.indexOf(t) === i);
  const bodyText = bodyNodes.slice(0, 2).join(". ");

  // Named button or link inside the card
  const cta = Array.from(el.querySelectorAll("a,button"))
    .map(n => n.textContent?.trim())
    .filter(t => t && t.length > 1)
    .slice(0, 1)[0];

  const postIt = colorName ? `No post-it ${colorName}` : "No post-it";
  let desc = `${postIt} está escrito: ${headText}.`;
  if (bodyText) desc += ` ${bodyText}.`;
  if (cta) desc += ` Tem um botão que diz: ${cta}.`;
  desc += " É clicável.";
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
    "/": "Estamos na página inicial do site, chamada Chegou a Conta, Diretora. É um espaço feito para diretoras de escola pública entenderem como funcionam os recursos e programas da educação.",
    "/dashboard": "Estamos no Painel da Escola. Aqui você pode pesquisar sua escola e ver os dados do censo, indicadores do IDEB e informações financeiras dos programas do FNDE.",
    "/trilha": "Estamos na Trilha da Diretora. É um caminho de aprendizado com etapas sobre como funciona a gestão financeira das escolas públicas.",
    "/legislacao": "Estamos na seção de Legislação. Aqui ficam as leis, resoluções, portarias e instruções normativas do MEC, além do Diário Oficial.",
    "/programas": "Estamos na seção de Programas. Aqui você encontra informações sobre o PDDE e as Ações Integradas.",
    "/ferramentas": "Estamos na seção de Ferramentas. Aqui ficam modelos de ofício, planilhas e materiais de apoio prontos para usar.",
    "/chat": "Estamos no Caderno da Diretora. Aqui você pode pesquisar, perguntar para a inteligência artificial e redigir documentos escolares.",
    "/calendario": "Estamos no Calendário. Aqui ficam os prazos de prestação de contas e repasses do FNDE.",
  };
  const intro = siteIntros["/"] && path === "/"
    ? siteIntros["/"]
    : Object.entries(siteIntros).filter(([k]) => k !== "/").find(([k]) => path.startsWith(k))?.[1]
    ?? `Estamos na seção ${sectionName} do site Chegou a Conta, Diretora.`;
  parts.push(intro);

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

    // Detect a group of sibling cards and describe them as a set
    if (tag === "div" || tag === "section" || tag === "ul") {
      const cardChildren = Array.from(el.children).filter(
        c => detectCard(c as HTMLElement)
      ) as HTMLElement[];
      if (cardChildren.length >= 2) {
        // Mark all card children visited so they won't be re-described
        cardChildren.forEach(c => visited.add(c));
        const heading = el.querySelector(":scope > h1,:scope > h2,:scope > h3");
        const groupTitle = heading?.textContent?.trim();
        if (groupTitle) {
          parts.push(`Logo abaixo, na seção "${groupTitle}", você vê um conjunto de post-its coloridos. Cada um leva a uma área diferente do site.`);
        } else {
          parts.push(`Há um conjunto de post-its coloridos na tela. Cada um leva a uma área diferente do site.`);
        }
        cardChildren.forEach((card) => parts.push(describeCard(card)));
        // Still walk non-card children of this container
        Array.from(el.childNodes).forEach(child => {
          if (child.nodeType === Node.ELEMENT_NODE && !cardChildren.includes(child as HTMLElement)) {
            walk(child);
          }
        });
        return;
      }
    }

    // Individual card
    if (detectCard(el)) {
      visited.add(el);
      parts.push(describeCard(el));
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
      if (label) parts.push(`Botão "${label}".`);
      return;
    }

    // Standalone anchor links (not inside a card)
    if (tag === "a" && el.getAttribute("href")) {
      const label = el.getAttribute("aria-label") || el.textContent?.trim();
      if (label && label.length > 1) parts.push(`Link: ${label}.`);
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
    const sel = window.getSelection()?.toString().trim();
    if (sel) start(sel);
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
