import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Accessibility, 
  ZoomIn, 
  ZoomOut, 
  Contrast, 
  Type,
  RotateCcw,
  X,
  Volume2,
  VolumeX,
  Pause,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FONT_SIZE_KEY = "accessibility-font-size";
const HIGH_CONTRAST_KEY = "accessibility-high-contrast";
const DYSLEXIA_FONT_KEY = "accessibility-dyslexia-font";
const SCREEN_READER_KEY = "accessibility-screen-reader";

function getPageText(): string {
  const main = document.querySelector('main') || document.body;
  const walker = document.createTreeWalker(
    main,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'svg'].includes(tag)) return NodeFilter.FILTER_REJECT;
        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') return NodeFilter.FILTER_REJECT;
        if (node.textContent && node.textContent.trim().length > 0) return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_REJECT;
      }
    }
  );

  const texts: string[] = [];
  while (walker.nextNode()) {
    const text = walker.currentNode.textContent?.trim();
    if (text && text.length > 0) {
      texts.push(text);
    }
  }
  return texts.join('. ').replace(/\.{2,}/g, '.').replace(/\s+/g, ' ');
}

export function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
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
    return () => {
      if (speechSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    if (speechSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    utteranceRef.current = null;
  }, [speechSupported]);

  const startSpeaking = useCallback(() => {
    if (!speechSupported) return;
    stopSpeaking();

    const text = getPageText();
    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt'));
    if (ptVoice) utterance.voice = ptVoice;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  }, [speechSupported, stopSpeaking]);

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
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
        aria-label="Menu de acessibilidade"
        data-testid="button-accessibility-menu"
      >
        <Accessibility className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 w-72"
            role="dialog"
            aria-label="Opções de acessibilidade"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Accessibility className="w-4 h-4 text-emerald-600" />
                Acessibilidade
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
                    Leitor de tela
                    {screenReaderEnabled && <span className="ml-auto text-xs">Ativo</span>}
                  </Button>

                  {screenReaderEnabled && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isSpeaking && !isPaused ? "default" : "outline"}
                        onClick={isSpeaking ? (isPaused ? togglePause : togglePause) : startSpeaking}
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
                          <VolumeX className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}

                  {screenReaderEnabled && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      O computador vai ler o texto da página em voz alta pra você
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
