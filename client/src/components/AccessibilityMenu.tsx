import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
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
  Square
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FONT_SIZE_KEY = "accessibility-font-size";
const HIGH_CONTRAST_KEY = "accessibility-high-contrast";
const DYSLEXIA_FONT_KEY = "accessibility-dyslexia-font";
const SCREEN_READER_KEY = "accessibility-screen-reader";

function getStructuredPageChunks(): string[] {
  const root = document.querySelector('main') || document.body;
  const parts: string[] = [];

  function walkNode(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role');

      if (['script', 'style', 'noscript', 'svg', 'path', 'iframe'].includes(tag)) return;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      if (el.getAttribute('aria-hidden') === 'true') return;

      if (tag === 'nav' || role === 'navigation') {
        parts.push('Navegação.');
        for (const child of Array.from(el.childNodes)) walkNode(child);
        parts.push('Fim da navegação.');
        return;
      }

      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        const level = tag.charAt(1);
        const text = el.textContent?.trim();
        if (text) parts.push(`Título nível ${level}: ${text}.`);
        return;
      }

      if (tag === 'button' || role === 'button') {
        const label = el.getAttribute('aria-label') || el.textContent?.trim();
        if (label) parts.push(`Botão: ${label}.`);
        return;
      }

      if (tag === 'a' && el.getAttribute('href')) {
        const label = el.getAttribute('aria-label') || el.textContent?.trim();
        if (label) parts.push(`Link: ${label}.`);
        return;
      }

      if (tag === 'input' || tag === 'textarea') {
        const label = el.getAttribute('aria-label') || el.getAttribute('placeholder') || '';
        if (label) parts.push(`Campo de texto: ${label}.`);
        return;
      }

      if (tag === 'img') {
        const alt = el.getAttribute('alt');
        if (alt) parts.push(`Imagem: ${alt}.`);
        return;
      }

      if (tag === 'section' || role === 'region') {
        const ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel) parts.push(`Seção: ${ariaLabel}.`);
      }

      if (tag === 'footer') {
        parts.push('Rodapé.');
      }

      for (const child of Array.from(el.childNodes)) {
        walkNode(child);
      }

      if (tag === 'footer') {
        parts.push('Fim do rodapé.');
      }

    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text && text.length > 1) {
        parts.push(text);
      }
    }
  }

  walkNode(root);

  const chunks: string[] = [];
  let current = '';
  for (const part of parts) {
    const cleaned = part.replace(/\s+/g, ' ').trim();
    if (!cleaned) continue;
    if (current.length + cleaned.length > 150) {
      if (current.trim()) chunks.push(current.trim());
      current = cleaned;
    } else {
      current += (current ? ' ' : '') + cleaned;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

function findFeminineVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();

  const ptBrFeminine = voices.find(v =>
    v.lang === 'pt-BR' &&
    (v.name.toLowerCase().includes('female') ||
     v.name.toLowerCase().includes('feminino') ||
     v.name.toLowerCase().includes('woman') ||
     v.name.toLowerCase().includes('mulher') ||
     v.name.toLowerCase().includes('luciana') ||
     v.name.toLowerCase().includes('vitória') ||
     v.name.toLowerCase().includes('francisca') ||
     v.name.toLowerCase().includes('maria') ||
     v.name.toLowerCase().includes('google') ||
     v.name.toLowerCase().includes('microsoft') && !v.name.toLowerCase().includes('daniel'))
  );
  if (ptBrFeminine) return ptBrFeminine;

  const ptBr = voices.find(v => v.lang === 'pt-BR');
  if (ptBr) return ptBr;

  const ptAny = voices.find(v => v.lang.startsWith('pt'));
  if (ptAny) return ptAny;

  return null;
}

export function AccessibilityMenu() {
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
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

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
    if (savedReader === "true") {
      setScreenReaderEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (speechSupported) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      if (speechSupported) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const speakNextChunk = useCallback(() => {
    if (!speechSupported || stoppedRef.current) return;

    const chunks = chunksRef.current;
    const idx = chunkIndexRef.current;

    if (idx >= chunks.length) {
      setIsSpeaking(false);
      setIsPaused(false);
      chunksRef.current = [];
      chunkIndexRef.current = 0;
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[idx]);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voice = findFeminineVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      if (stoppedRef.current) return;
      chunkIndexRef.current = idx + 1;
      speakNextChunk();
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || stoppedRef.current) return;
      chunkIndexRef.current = idx + 1;
      speakNextChunk();
    };

    window.speechSynthesis.speak(utterance);
  }, [speechSupported]);

  const stopSpeaking = useCallback(() => {
    stoppedRef.current = true;
    if (speechSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    chunksRef.current = [];
    chunkIndexRef.current = 0;
  }, [speechSupported]);

  const startSpeaking = useCallback(() => {
    if (!speechSupported) return;
    stopSpeaking();

    const chunks = getStructuredPageChunks();
    if (chunks.length === 0) return;

    stoppedRef.current = false;
    chunksRef.current = chunks;
    chunkIndexRef.current = 0;
    setIsSpeaking(true);
    setIsPaused(false);

    speakNextChunk();
  }, [speechSupported, stopSpeaking, speakNextChunk]);

  const togglePause = useCallback(() => {
    if (!speechSupported) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [speechSupported, isPaused]);

  const toggleScreenReader = useCallback(() => {
    const newValue = !screenReaderEnabled;
    setScreenReaderEnabled(newValue);
    localStorage.setItem(SCREEN_READER_KEY, newValue.toString());
    if (!newValue) {
      stopSpeaking();
    }
  }, [screenReaderEnabled, stopSpeaking]);

  const updateFontSize = (newSize: number) => {
    const clampedSize = Math.min(150, Math.max(80, newSize));
    setFontSize(clampedSize);
    document.documentElement.style.fontSize = `${clampedSize}%`;
    localStorage.setItem(FONT_SIZE_KEY, clampedSize.toString());
  };

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    if (newValue) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
    localStorage.setItem(HIGH_CONTRAST_KEY, newValue.toString());
  };

  const toggleDyslexiaFont = () => {
    const newValue = !dyslexiaFont;
    setDyslexiaFont(newValue);
    if (newValue) {
      document.documentElement.classList.add("dyslexia-font");
    } else {
      document.documentElement.classList.remove("dyslexia-font");
    }
    localStorage.setItem(DYSLEXIA_FONT_KEY, newValue.toString());
  };

  const resetAll = () => {
    setFontSize(100);
    setHighContrast(false);
    setDyslexiaFont(false);
    setScreenReaderEnabled(false);
    stopSpeaking();
    document.documentElement.style.fontSize = "100%";
    document.documentElement.classList.remove("high-contrast", "dyslexia-font");
    localStorage.removeItem(FONT_SIZE_KEY);
    localStorage.removeItem(HIGH_CONTRAST_KEY);
    localStorage.removeItem(DYSLEXIA_FONT_KEY);
    localStorage.removeItem(SCREEN_READER_KEY);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        variant="outline"
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700"
        aria-label="Ajustes de visualização e leitura"
        data-testid="button-accessibility-menu"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 w-72"
            role="dialog"
            aria-label="Ajustes de visualização e leitura"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                Ajustes do Site
              </h3>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setIsOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Tamanho do texto: {fontSize}%
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateFontSize(fontSize - 10)}
                    disabled={fontSize <= 80}
                    className="flex-1"
                    aria-label="Diminuir texto"
                    data-testid="button-decrease-font"
                  >
                    <ZoomOut className="w-4 h-4 mr-1" />
                    A-
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateFontSize(fontSize + 10)}
                    disabled={fontSize >= 150}
                    className="flex-1"
                    aria-label="Aumentar texto"
                    data-testid="button-increase-font"
                  >
                    <ZoomIn className="w-4 h-4 mr-1" />
                    A+
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant={highContrast ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={toggleHighContrast}
                  aria-pressed={highContrast}
                  data-testid="button-high-contrast"
                >
                  <Contrast className="w-4 h-4 mr-2" />
                  Alto contraste
                  {highContrast && <span className="ml-auto text-xs">Ativo</span>}
                </Button>

                <Button
                  variant={dyslexiaFont ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={toggleDyslexiaFont}
                  aria-pressed={dyslexiaFont}
                  data-testid="button-dyslexia-font"
                >
                  <Type className="w-4 h-4 mr-2" />
                  Fonte para dislexia
                  {dyslexiaFont && <span className="ml-auto text-xs">Ativo</span>}
                </Button>
              </div>

              {speechSupported && (
                <div className="space-y-2">
                  <div className="h-px bg-border" />
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Leitura em voz alta
                  </label>

                  <Button
                    variant={screenReaderEnabled ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={toggleScreenReader}
                    aria-pressed={screenReaderEnabled}
                    data-testid="button-screen-reader"
                  >
                    {screenReaderEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                    Ouvir a página
                    {screenReaderEnabled && <span className="ml-auto text-xs">Ativo</span>}
                  </Button>

                  {screenReaderEnabled && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isSpeaking && !isPaused ? "default" : "outline"}
                        onClick={isSpeaking ? togglePause : startSpeaking}
                        className="flex-1"
                        data-testid="button-read-page"
                        aria-label={isSpeaking ? (isPaused ? "Continuar leitura" : "Pausar leitura") : "Ler página"}
                      >
                        {isSpeaking ? (
                          isPaused ? (
                            <><Play className="w-4 h-4 mr-1" /> Continuar</>
                          ) : (
                            <><Pause className="w-4 h-4 mr-1" /> Pausar</>
                          )
                        ) : (
                          <><Play className="w-4 h-4 mr-1" /> Ler página</>
                        )}
                      </Button>
                      {isSpeaking && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={stopSpeaking}
                          data-testid="button-stop-reading"
                          aria-label="Parar leitura"
                        >
                          <Square className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}

                  {screenReaderEnabled && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Uma voz feminina vai ler a página, dizendo o que é cada parte (botão, título, link)
                    </p>
                  )}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={resetAll}
                data-testid="button-reset-accessibility"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar padrão
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
