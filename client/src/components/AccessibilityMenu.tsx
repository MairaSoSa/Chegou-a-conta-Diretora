import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Accessibility, 
  ZoomIn, 
  ZoomOut, 
  Contrast, 
  Type,
  RotateCcw,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FONT_SIZE_KEY = "accessibility-font-size";
const HIGH_CONTRAST_KEY = "accessibility-high-contrast";
const DYSLEXIA_FONT_KEY = "accessibility-dyslexia-font";

export function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);

  useEffect(() => {
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY);
    const savedContrast = localStorage.getItem(HIGH_CONTRAST_KEY);
    const savedDyslexia = localStorage.getItem(DYSLEXIA_FONT_KEY);
    
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
  }, []);

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
    document.documentElement.style.fontSize = "100%";
    document.documentElement.classList.remove("high-contrast", "dyslexia-font");
    localStorage.removeItem(FONT_SIZE_KEY);
    localStorage.removeItem(HIGH_CONTRAST_KEY);
    localStorage.removeItem(DYSLEXIA_FONT_KEY);
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
                className="h-8 w-8" 
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
