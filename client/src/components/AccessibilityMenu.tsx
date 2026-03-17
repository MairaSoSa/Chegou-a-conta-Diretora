import { useState, useEffect, useCallback, useRef } from "react";
import {
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  Contrast,
  Type,
  RotateCcw,
  X,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Square,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FONT_SIZE_KEY = "accessibility-font-size";
const HIGH_CONTRAST_KEY = "accessibility-high-contrast";
const DYSLEXIA_FONT_KEY = "accessibility-dyslexia-font";
const SCREEN_READER_KEY = "accessibility-screen-reader";

function getStructuredPageChunks(): string[] {
  const root = document.querySelector("main") || document.body;
  const parts: string[] = [];

  function walkNode(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute("role");
      if (["script", "style", "noscript", "svg", "path", "iframe"].includes(tag)) return;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return;
      if (el.getAttribute("aria-hidden") === "true") return;
      if (tag === "nav" || role === "navigation") {
        parts.push("Navegação.");
        for (const child of Array.from(el.childNodes)) walkNode(child);
        parts.push("Fim da navegação.");
        return;
      }
      if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
        const level = tag.charAt(1);
        const text = el.textContent?.trim();
        if (text) parts.push(`Título nível ${level}: ${text}.`);
        return;
      }
      if (tag === "button" || role === "button") {
        const label = el.getAttribute("aria-label") || el.textContent?.trim();
        if (label) parts.push(`Botão: ${label}.`);
        return;
      }
      if (tag === "a" && el.getAttribute("href")) {
        const label = el.getAttribute("aria-label") || el.textContent?.trim();
        if (label) parts.push(`Link: ${label}.`);
        return;
      }
      if (tag === "input" || tag === "textarea") {
        const label = el.getAttribute("aria-label") || el.getAttribute("placeholder") || "";
        if (label) parts.push(`Campo de texto: ${label}.`);
        return;
      }
      if (tag === "img") {
        const alt = el.getAttribute("alt");
        if (alt) parts.push(`Imagem: ${alt}.`);
        return;
      }
      if (tag === "section" || role === "region") {
        const ariaLabel = el.getAttribute("aria-label");
        if (ariaLabel) parts.push(`Seção: ${ariaLabel}.`);
      }
      if (tag === "footer") parts.push("Rodapé.");
      for (const child of Array.from(el.childNodes)) walkNode(child);
      if (tag === "footer") parts.push("Fim do rodapé.");
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text && text.length > 1) parts.push(text);
    }
  }

  walkNode(root);
  const chunks: string[] = [];
  let current = "";
  for (const part of parts) {
    const cleaned = part.replace(/\s+/g, " ").trim();
    if (!cleaned) continue;
    if (current.length + cleaned.length > 80) {
      if (current.trim()) chunks.push(current.trim());
      current = cleaned;
    } else {
      current += (current ? " " : "") + cleaned;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function findFeminineVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const ptBrFeminine = voices.find(
    (v) =>
      v.lang === "pt-BR" &&
      (v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("feminino") ||
        v.name.toLowerCase().includes("luciana") ||
        v.name.toLowerCase().includes("vitória") ||
        v.name.toLowerCase().includes("francisca") ||
        v.name.toLowerCase().includes("maria") ||
        v.name.toLowerCase().includes("google") ||
        (v.name.toLowerCase().includes("microsoft") && !v.name.toLowerCase().includes("daniel")))
  );
  if (ptBrFeminine) return ptBrFeminine;
  const ptBr = voices.find((v) => v.lang === "pt-BR");
  if (ptBr) return ptBr;
  return voices.find((v) => v.lang.startsWith("pt")) || null;
}

export function AccessibilityMenu({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const stoppedRef = useRef(false);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY);
    const savedContrast = localStorage.getItem(HIGH_CONTRAST_KEY);
    const savedDyslexia = localStorage.getItem(DYSLEXIA_FONT_KEY);
    const savedReader = localStorage.getItem(SCREEN_READER_KEY);
    if (savedFontSize) {
      const size = parseInt(savedFontSize);
      setFontSize(size);
      document.documentElement.style.fontSize = `${size}%`;
    }
    if (savedContrast === "true") {
      setHighContrast(true);
      document.documentElement.classList.add("high-contrast");
    }
    if (savedDyslexia === "true") {
      setDyslexiaFont(true);
      document.documentElement.classList.add("dyslexia-font");
    }
    if (savedReader === "true") setScreenReaderEnabled(true);
  }, []);

  useEffect(() => {
    if (speechSupported) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    return () => {
      if (speechSupported) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, []);

  const clearKeepAlive = useCallback(() => {
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
  }, []);

  const startKeepAlive = useCallback(() => {
    clearKeepAlive();
    keepAliveRef.current = setInterval(() => {
      if (speechSupported && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 5000);
  }, [speechSupported, clearKeepAlive]);

  const speakNextChunk = useCallback(() => {
    if (!speechSupported || stoppedRef.current) return;
    const chunks = chunksRef.current;
    const idx = chunkIndexRef.current;
    if (idx >= chunks.length) {
      setIsSpeaking(false); setIsPaused(false);
      chunksRef.current = []; chunkIndexRef.current = 0; clearKeepAlive(); return;
    }
    const utterance = new SpeechSynthesisUtterance(chunks[idx]);
    utterance.lang = "pt-BR"; utterance.rate = 1.0; utterance.pitch = 1.0; utterance.volume = 1.0;
    const voice = findFeminineVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (stoppedRef.current) return;
      chunkIndexRef.current = idx + 1;
      setTimeout(() => speakNextChunk(), 80);
    };
    utterance.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled" || stoppedRef.current) return;
      chunkIndexRef.current = idx + 1;
      setTimeout(() => speakNextChunk(), 80);
    };
    window.speechSynthesis.speak(utterance);
  }, [speechSupported, clearKeepAlive]);

  const stopSpeaking = useCallback(() => {
    stoppedRef.current = true; clearKeepAlive();
    if (speechSupported) window.speechSynthesis.cancel();
    setIsSpeaking(false); setIsPaused(false);
    chunksRef.current = []; chunkIndexRef.current = 0;
  }, [speechSupported, clearKeepAlive]);

  const startSpeaking = useCallback(() => {
    if (!speechSupported) return;
    stopSpeaking();
    const chunks = getStructuredPageChunks();
    if (chunks.length === 0) return;
    stoppedRef.current = false; chunksRef.current = chunks; chunkIndexRef.current = 0;
    setIsSpeaking(true); setIsPaused(false);
    startKeepAlive(); speakNextChunk();
  }, [speechSupported, stopSpeaking, speakNextChunk, startKeepAlive]);

  const togglePause = useCallback(() => {
    if (!speechSupported) return;
    if (isPaused) { window.speechSynthesis.resume(); startKeepAlive(); setIsPaused(false); }
    else { clearKeepAlive(); window.speechSynthesis.pause(); setIsPaused(true); }
  }, [speechSupported, isPaused, startKeepAlive, clearKeepAlive]);

  const toggleScreenReader = useCallback(() => {
    const newValue = !screenReaderEnabled;
    setScreenReaderEnabled(newValue);
    localStorage.setItem(SCREEN_READER_KEY, newValue.toString());
    if (!newValue) stopSpeaking();
  }, [screenReaderEnabled, stopSpeaking]);

  const updateFontSize = (newSize: number) => {
    const s = Math.min(150, Math.max(80, newSize));
    setFontSize(s);
    document.documentElement.style.fontSize = `${s}%`;
    localStorage.setItem(FONT_SIZE_KEY, s.toString());
  };

  const toggleHighContrast = () => {
    const v = !highContrast; setHighContrast(v);
    document.documentElement.classList.toggle("high-contrast", v);
    localStorage.setItem(HIGH_CONTRAST_KEY, v.toString());
  };

  const toggleDyslexiaFont = () => {
    const v = !dyslexiaFont; setDyslexiaFont(v);
    document.documentElement.classList.toggle("dyslexia-font", v);
    localStorage.setItem(DYSLEXIA_FONT_KEY, v.toString());
  };

  const resetAll = () => {
    setFontSize(100); setHighContrast(false); setDyslexiaFont(false);
    setScreenReaderEnabled(false); stopSpeaking();
    document.documentElement.style.fontSize = "100%";
    document.documentElement.classList.remove("high-contrast", "dyslexia-font");
    [FONT_SIZE_KEY, HIGH_CONTRAST_KEY, DYSLEXIA_FONT_KEY, SCREEN_READER_KEY].forEach((k) =>
      localStorage.removeItem(k)
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="fixed right-4 z-50 rounded-2xl shadow-xl border border-[#ddd0c8] p-4 w-68"
          style={{ bottom: "3.5rem", background: "#faf4ee", width: 268 }}
          role="dialog"
          aria-label="Ajustes de visualização e leitura"
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#5a3328]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#8e5c48]" />
              Visualização
            </h3>
            <button
              onClick={onToggle}
              aria-label="Fechar"
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#a07060] hover:bg-[#f0e4db] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {/* Tamanho do texto */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] text-[#8b5a4d]">
                <Type className="w-3 h-3" />
                Tamanho do texto: {fontSize}%
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateFontSize(fontSize - 10)}
                  disabled={fontSize <= 80}
                  data-testid="button-decrease-font"
                  aria-label="Diminuir texto"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#d9cec6] bg-[#f5ede7] px-2 py-1.5 text-[12px] text-[#5a3328] hover:bg-[#ede3db] disabled:opacity-40 transition-colors"
                >
                  <ZoomOut className="w-3 h-3" /> A-
                </button>
                <button
                  onClick={() => updateFontSize(fontSize + 10)}
                  disabled={fontSize >= 150}
                  data-testid="button-increase-font"
                  aria-label="Aumentar texto"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#d9cec6] bg-[#f5ede7] px-2 py-1.5 text-[12px] text-[#5a3328] hover:bg-[#ede3db] disabled:opacity-40 transition-colors"
                >
                  <ZoomIn className="w-3 h-3" /> A+
                </button>
              </div>
            </div>

            {/* Alto contraste */}
            <button
              onClick={toggleHighContrast}
              aria-pressed={highContrast}
              data-testid="button-high-contrast"
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors ${
                highContrast
                  ? "border-[#c5a08a] bg-[#8e2f2f] text-white"
                  : "border-[#d9cec6] bg-[#f5ede7] text-[#5a3328] hover:bg-[#ede3db]"
              }`}
            >
              <Contrast className="w-3 h-3" />
              Alto contraste
              {highContrast && <span className="ml-auto text-[10px] opacity-80">Ativo</span>}
            </button>

            {/* Fonte dislexia */}
            <button
              onClick={toggleDyslexiaFont}
              aria-pressed={dyslexiaFont}
              data-testid="button-dyslexia-font"
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors ${
                dyslexiaFont
                  ? "border-[#c5a08a] bg-[#8e2f2f] text-white"
                  : "border-[#d9cec6] bg-[#f5ede7] text-[#5a3328] hover:bg-[#ede3db]"
              }`}
            >
              <Type className="w-3 h-3" />
              Fonte para dislexia
              {dyslexiaFont && <span className="ml-auto text-[10px] opacity-80">Ativo</span>}
            </button>

            {/* Leitura em voz */}
            {speechSupported && (
              <>
                <div className="h-px bg-[#e8ddd6] my-1" />
                <div className="flex items-center gap-1.5 mb-1">
                  <Volume2 className="w-3 h-3 text-[#8b5a4d]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8b5a4d]">Voz</span>
                </div>
                <button
                  onClick={toggleScreenReader}
                  aria-pressed={screenReaderEnabled}
                  data-testid="button-screen-reader"
                  className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors ${
                    screenReaderEnabled
                      ? "border-[#c5a08a] bg-[#8e2f2f] text-white"
                      : "border-[#d9cec6] bg-[#f5ede7] text-[#5a3328] hover:bg-[#ede3db]"
                  }`}
                >
                  {screenReaderEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  Ouvir a página
                  {screenReaderEnabled && <span className="ml-auto text-[10px] opacity-80">Ativo</span>}
                </button>

                {screenReaderEnabled && (
                  <div className="flex gap-2">
                    <button
                      onClick={isSpeaking ? togglePause : startSpeaking}
                      data-testid="button-read-page"
                      aria-label={isSpeaking ? (isPaused ? "Continuar" : "Pausar") : "Ler página"}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[12px] transition-colors ${
                        isSpeaking && !isPaused
                          ? "border-[#c5a08a] bg-[#8e2f2f] text-white"
                          : "border-[#d9cec6] bg-[#f5ede7] text-[#5a3328] hover:bg-[#ede3db]"
                      }`}
                    >
                      {isSpeaking
                        ? isPaused
                          ? <><Play className="w-3 h-3" /> Continuar</>
                          : <><Pause className="w-3 h-3" /> Pausar</>
                        : <><Play className="w-3 h-3" /> Ler página</>}
                    </button>
                    {isSpeaking && (
                      <button
                        onClick={stopSpeaking}
                        data-testid="button-stop-reading"
                        aria-label="Parar"
                        className="flex items-center justify-center rounded-lg border border-[#d9cec6] bg-[#f5ede7] px-3 py-1.5 text-[#5a3328] hover:bg-[#ede3db] transition-colors"
                      >
                        <Square className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="h-px bg-[#e8ddd6] my-1" />
            <button
              onClick={resetAll}
              data-testid="button-reset-accessibility"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] text-[#a07060] hover:bg-[#f0e4db] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Restaurar padrão
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
