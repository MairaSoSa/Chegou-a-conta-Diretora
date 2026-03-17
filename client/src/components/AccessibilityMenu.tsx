import { useState, useEffect, useCallback, useRef } from "react";
import {
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  Contrast,
  Type,
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Square,
} from "lucide-react";
import { motion } from "framer-motion";

const FONT_SIZE_KEY = "accessibility-font-size";
const HIGH_CONTRAST_KEY = "accessibility-high-contrast";
const DYSLEXIA_FONT_KEY = "accessibility-dyslexia-font";
const SCREEN_READER_KEY = "accessibility-screen-reader";

const TAB_W = 26;
const PANEL_W = 264;

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

export function AccessibilityMenu(_props?: { isOpen?: boolean; onToggle?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
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
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const anyActive = highContrast || dyslexiaFont || fontSize !== 100 || screenReaderEnabled;

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

  const handleMouseEnter = () => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div
      className="fixed left-0 z-50 select-none"
      style={{ top: "50%", transform: "translateY(-50%)" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Menu de acessibilidade"
    >
      <motion.div
        className="flex flex-row overflow-hidden"
        animate={{ width: isOpen ? TAB_W + PANEL_W : TAB_W }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        style={{
          borderRadius: "0 16px 16px 0",
          boxShadow: "2px 2px 12px rgba(0,0,0,0.13)",
        }}
      >
        {/* ── Tab (linguinha) — sempre visível ── */}
        <button
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Ajustes de acessibilidade"
          data-testid="button-accessibility-menu"
          style={{
            width: TAB_W,
            minWidth: TAB_W,
            background: anyActive ? "#8e6a5a" : "#c8b4a4",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            padding: "10px 0",
            cursor: "pointer",
            border: "none",
            outline: "none",
            position: "relative",
          }}
        >
          <SlidersHorizontal
            style={{ width: 12, height: 12, color: anyActive ? "#fff" : "#5a3328", flexShrink: 0 }}
          />
          {anyActive && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#f5c56e",
                position: "absolute",
                top: 5,
                right: 4,
              }}
            />
          )}
        </button>

        {/* ── Painel de controles ── */}
        <div
          style={{
            width: PANEL_W,
            minWidth: PANEL_W,
            background: "#faf4ee",
            borderTop: "1px solid #e0cfc6",
            borderRight: "1px solid #e0cfc6",
            borderBottom: "1px solid #e0cfc6",
            overflowY: "auto",
            maxHeight: "80vh",
            padding: "14px 14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Cabeçalho */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <SlidersHorizontal style={{ width: 13, height: 13, color: "#8e5c48" }} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#5a3328" }}>
              Visualização
            </span>
          </div>

          {/* Tamanho do texto */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, color: "#8b5a4d", display: "flex", alignItems: "center", gap: 6 }}>
              <Type style={{ width: 12, height: 12 }} />
              Tamanho do texto: {fontSize}%
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => updateFontSize(fontSize - 10)}
                disabled={fontSize <= 80}
                data-testid="button-decrease-font"
                aria-label="Diminuir texto"
                style={btnStyle(false, fontSize <= 80)}
              >
                <ZoomOut style={{ width: 12, height: 12 }} /> A-
              </button>
              <button
                onClick={() => updateFontSize(fontSize + 10)}
                disabled={fontSize >= 150}
                data-testid="button-increase-font"
                aria-label="Aumentar texto"
                style={btnStyle(false, fontSize >= 150)}
              >
                <ZoomIn style={{ width: 12, height: 12 }} /> A+
              </button>
            </div>
          </div>

          {/* Alto contraste */}
          <button
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            data-testid="button-high-contrast"
            style={btnStyle(highContrast)}
          >
            <Contrast style={{ width: 12, height: 12 }} />
            Alto contraste
            {highContrast && <span style={activeBadge}>Ativo</span>}
          </button>

          {/* Fonte dislexia */}
          <button
            onClick={toggleDyslexiaFont}
            aria-pressed={dyslexiaFont}
            data-testid="button-dyslexia-font"
            style={btnStyle(dyslexiaFont)}
          >
            <Type style={{ width: 12, height: 12 }} />
            Fonte para dislexia
            {dyslexiaFont && <span style={activeBadge}>Ativo</span>}
          </button>

          {/* Leitura em voz */}
          {speechSupported && (
            <>
              <div style={{ height: 1, background: "#e0cfc6", margin: "0 -2px" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Volume2 style={{ width: 12, height: 12, color: "#8b5a4d" }} />
                <span style={{ fontSize: 11, color: "#8b5a4d", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700 }}>
                  Voz
                </span>
              </div>
              <button
                onClick={toggleScreenReader}
                aria-pressed={screenReaderEnabled}
                data-testid="button-screen-reader"
                style={btnStyle(screenReaderEnabled)}
              >
                {screenReaderEnabled
                  ? <Volume2 style={{ width: 12, height: 12 }} />
                  : <VolumeX style={{ width: 12, height: 12 }} />}
                Ouvir a página
                {screenReaderEnabled && <span style={activeBadge}>Ativo</span>}
              </button>

              {screenReaderEnabled && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={isSpeaking ? togglePause : startSpeaking}
                    data-testid="button-read-page"
                    aria-label={isSpeaking ? (isPaused ? "Continuar" : "Pausar") : "Ler página"}
                    style={{ ...btnStyle(isSpeaking && !isPaused), flex: 1 }}
                  >
                    {isSpeaking
                      ? isPaused
                        ? <><Play style={{ width: 11, height: 11 }} /> Continuar</>
                        : <><Pause style={{ width: 11, height: 11 }} /> Pausar</>
                      : <><Play style={{ width: 11, height: 11 }} /> Ler página</>}
                  </button>
                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      data-testid="button-stop-reading"
                      aria-label="Parar"
                      style={btnStyle(false)}
                    >
                      <Square style={{ width: 10, height: 10 }} />
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Reset */}
          <div style={{ height: 1, background: "#e0cfc6", margin: "0 -2px" }} />
          <button
            onClick={resetAll}
            data-testid="button-reset-accessibility"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 11, color: "#a07060", background: "transparent",
              border: "none", cursor: "pointer", padding: "4px 2px",
            }}
          >
            <RotateCcw style={{ width: 11, height: 11 }} />
            Restaurar padrão
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function btnStyle(active: boolean, disabled = false): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 6,
    width: "100%",
    padding: "7px 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    border: `1px solid ${active ? "#c5a08a" : "#d9cec6"}`,
    background: active ? "#8e2f2f" : "#f5ede7",
    color: active ? "#fff" : "#5a3328",
    transition: "all 0.15s ease",
  };
}

const activeBadge: React.CSSProperties = {
  marginLeft: "auto",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  opacity: 0.85,
};
