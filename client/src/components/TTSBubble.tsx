import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, X, Volume2 } from "@/components/Icons";
import { useTTS } from "@/contexts/TTSContext";

function WaveBars() {
  return (
    <span className="tts-wave" aria-hidden="true">
      <span /><span /><span /><span />
    </span>
  );
}

export function TTSBubble() {
  const { isActive, isPlaying, isPaused, pause, resume, stop } = useTTS();

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="tts-bubble"
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 340, damping: 26 }}
          className="fixed z-[9999] flex items-center gap-2 rounded-full shadow-xl px-3.5 py-2"
          style={{
            bottom: "1.5rem",
            right: "1.5rem",
            background: "linear-gradient(135deg, #4a7c5c 0%, #3a6b4a 100%)",
            border: "1.5px solid rgba(255,255,255,.18)",
            boxShadow: "0 4px 20px rgba(58,107,74,.45), 0 1px 4px rgba(0,0,0,.18)",
          }}
          role="status"
          aria-label="Reprodução de áudio em andamento"
        >
          <Volume2 className="w-3.5 h-3.5 text-white/70 shrink-0" />

          {isPlaying && !isPaused ? (
            <WaveBars />
          ) : (
            <span className="text-white/70 text-[11px] font-medium" style={{ fontFamily: "Nunito, sans-serif" }}>
              pausado
            </span>
          )}

          <button
            onClick={isPlaying && !isPaused ? pause : resume}
            aria-label={isPaused ? "Continuar leitura" : "Pausar leitura"}
            className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 hover:bg-white/35 transition-colors"
          >
            {isPaused
              ? <Play className="w-3 h-3 text-white" />
              : <Pause className="w-3 h-3 text-white" />}
          </button>

          <button
            onClick={stop}
            aria-label="Fechar leitura"
            className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-3 h-3 text-white/80" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
