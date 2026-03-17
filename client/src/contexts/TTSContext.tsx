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

function getPageTextDescribed(): string {
  const parts: string[] = [];
  const title = getPageTitle();
  const path = window.location.pathname;
  const sectionName = path === "/" ? "Página inicial" :
    path.startsWith("/dashboard") ? "Painel da Escola" :
    path.startsWith("/trilha") ? "Trilha da Diretora" :
    path.startsWith("/legislacao") ? "Legislação" :
    path.startsWith("/programas") ? "Programas" :
    path.startsWith("/ferramentas") ? "Ferramentas" :
    path.startsWith("/chat") ? "Caderno da Diretora" :
    path.startsWith("/calendario") ? "Calendário" :
    "esta página";

  parts.push(`Você está em: ${sectionName}. ${title ? `Título da página: ${title}.` : ""}`);

  const skip = new Set(["script","style","noscript","svg","path","iframe"]);

  function walk(node: Node, depth = 0) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (skip.has(tag)) return;
    if (el.getAttribute("aria-hidden") === "true") return;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;

    const ariaLabel = el.getAttribute("aria-label") ?? "";
    const text = innerText(el);
    if (!text) return;

    if (tag === "nav") {
      parts.push("Início da navegação.");
      for (const child of Array.from(el.childNodes)) walk(child, depth + 1);
      parts.push("Fim da navegação.");
      return;
    }

    if (["h1","h2","h3","h4"].includes(tag)) {
      const level = tag.charAt(1);
      parts.push(`Título nível ${level}: ${text}.`);
      return;
    }

    if (tag === "a" && el.getAttribute("href")) {
      const label = ariaLabel || text;
      parts.push(`Link clicável: ${label}.`);
      return;
    }

    if (tag === "button") {
      const label = ariaLabel || text;
      parts.push(`Botão: ${label}.`);
      return;
    }

    if (isClickable(el) && (tag === "div" || tag === "article" || tag === "li")) {
      const label = ariaLabel || text.slice(0, 120);
      parts.push(`Card clicável: ${label}.`);
      return;
    }

    if (tag === "section" || tag === "article" || tag === "main") {
      const regionLabel = ariaLabel || (el.getAttribute("aria-labelledby") ?? "");
      if (regionLabel) parts.push(`Seção: ${regionLabel}.`);
      for (const child of Array.from(el.childNodes)) walk(child, depth + 1);
      return;
    }

    if (tag === "p" || tag === "span" || tag === "label" || tag === "li" || tag === "td") {
      if (text.length > 1) parts.push(text);
      return;
    }

    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const t = child.textContent?.trim();
        if (t && t.length > 1) parts.push(t);
      } else {
        walk(child, depth + 1);
      }
    }
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
