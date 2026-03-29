import { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  Contrast,
  Type,
  RotateCcw,
  X,
  Volume2,
  MousePointer2,
} from "@/components/Icons";
import { motion, AnimatePresence } from "framer-motion";
import { useTTS } from "@/contexts/TTSContext";

const FONT_SIZE_KEY = "accessibility-font-size";
const HIGH_CONTRAST_KEY = "accessibility-high-contrast";
const DYSLEXIA_FONT_KEY = "accessibility-dyslexia-font";

export function AccessibilityMenu({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const DYSLEXIA_MIN_FONT_SIZE = 110;

  const { readPage, readPageDescribed, readSelection, isActive } = useTTS();

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
      if (!savedFontSize || parseInt(savedFontSize) < DYSLEXIA_MIN_FONT_SIZE) {
        document.documentElement.style.fontSize = `${DYSLEXIA_MIN_FONT_SIZE}%`;
        setFontSize(DYSLEXIA_MIN_FONT_SIZE);
        localStorage.setItem(FONT_SIZE_KEY, DYSLEXIA_MIN_FONT_SIZE.toString());
      }
    }
  }, []);

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

    if (v && fontSize < DYSLEXIA_MIN_FONT_SIZE) {
      updateFontSize(DYSLEXIA_MIN_FONT_SIZE);
    }
  };

  const resetAll = () => {
    setFontSize(100); setHighContrast(false); setDyslexiaFont(false);
    document.documentElement.style.fontSize = "100%";
    document.documentElement.classList.remove("high-contrast", "dyslexia-font");
    [FONT_SIZE_KEY, HIGH_CONTRAST_KEY, DYSLEXIA_FONT_KEY].forEach(k => localStorage.removeItem(k));
  };

  const handleReadPage = () => {
    onToggle();
    setTimeout(() => readPage(), 120);
  };

  const handleReadPageDescribed = () => {
    onToggle();
    setTimeout(() => readPageDescribed(), 120);
  };

  const handleReadSelection = () => {
    const sel = window.getSelection()?.toString().trim();
    if (!sel) return;
    onToggle();
    setTimeout(() => readSelection(), 120);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="fixed right-4 z-50 rounded-2xl shadow-xl border border-[#ddd0c8] p-4"
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
            {/* Fonte para dislexia */}
            <button
              onClick={toggleDyslexiaFont}
              aria-pressed={dyslexiaFont}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors ${
                dyslexiaFont
                  ? "border-[#c5a08a] bg-[#8e2f2f] text-white"
                  : "border-[#d9cec6] bg-[#f5ede7] text-[#5a3328] hover:bg-[#ede3db]"
              }`}
            >
              <Type className="w-3 h-3" />
              Fonte para dislexia (110%+)
              {dyslexiaFont && <span className="ml-auto text-[10px] opacity-80">Ativo</span>}
            </button>

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
                  aria-label="Diminuir texto"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#d9cec6] bg-[#f5ede7] px-2 py-1.5 text-[12px] text-[#5a3328] hover:bg-[#ede3db] disabled:opacity-40 transition-colors"
                >
                  <ZoomOut className="w-3 h-3" /> A-
                </button>
                <button
                  onClick={() => updateFontSize(fontSize + 10)}
                  disabled={fontSize >= 150}
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

            {/* Leitura em voz */}
            <div className="h-px bg-[#e8ddd6] my-1" />
            <div className="flex items-center gap-1.5 mb-1">
              <Volume2 className="w-3 h-3 text-[#8b5a4d]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8b5a4d]">Voz</span>
              {isActive && (
                <span className="ml-auto text-[10px] text-[#4a7c5c] font-semibold">● em leitura</span>
              )}
            </div>

            <p className="text-[10px] text-[#a07060] px-0.5">Ler esta página:</p>
            <div className="flex gap-1.5">
              <button
                onClick={handleReadPage}
                title="Lê o texto corrido da página sem descrever os elementos"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#d9cec6] bg-[#f5ede7] px-2 py-2 text-[11px] font-medium text-[#5a3328] hover:bg-[#ede3db] transition-colors"
              >
                <Volume2 className="w-3 h-3 text-[#4a7c5c] shrink-0" />
                Corrido
              </button>
              <button
                onClick={handleReadPageDescribed}
                title="Anuncia onde você está no site e descreve cada elemento (link, botão, card)"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#d9cec6] bg-[#f5ede7] px-2 py-2 text-[11px] font-medium text-[#5a3328] hover:bg-[#ede3db] transition-colors"
              >
                <SlidersHorizontal className="w-3 h-3 text-[#4a7c5c] shrink-0" />
                Com descrição
              </button>
            </div>

            <button
              onClick={handleReadSelection}
              className="flex w-full items-center gap-2 rounded-lg border border-[#d9cec6] bg-[#f5ede7] px-3 py-2 text-[12px] font-medium text-[#5a3328] hover:bg-[#ede3db] transition-colors"
            >
              <MousePointer2 className="w-3 h-3 text-[#4a7c5c]" />
              Ler trecho selecionado
            </button>

            <div className="h-px bg-[#e8ddd6] my-1" />
            <button
              onClick={resetAll}
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
