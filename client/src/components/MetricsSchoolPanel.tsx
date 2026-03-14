import React from "react";

const THEMES = [
  "theme-blue",
  "theme-yellow",
  "theme-green",
  "theme-purple",
  "theme-pink",
  "theme-teal",
];

export function MetricsSchoolPanel({ metrics }: { metrics: Array<any> }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mt-4 mb-8">
      {metrics.map((m, i) => {
        const delta = m.prev !== null && typeof m.val === "number" ? m.val - m.prev : null;
        return (
          <div key={i} className={`metric ${THEMES[i % THEMES.length]} shadow-md border p-6 rounded-2xl relative transition-transform duration-150 ${i % 2 === 0 ? "-rotate-1.5" : "rotate-1.5"}`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#6b7785]">{m.label}</label>
                <strong className="block text-3xl font-bold leading-none" style={{letterSpacing:'-0.04em'}}>{typeof m.val === 'number' ? m.val.toLocaleString('pt-BR') : m.val}</strong>
              </div>
              <div className="w-11 h-11 rounded-2xl grid place-items-center text-xl shrink-0 bg-white/70 border border-white/90">{m.icon}</div>
            </div>
            {m.extra ? (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold bg-white/60 text-gray-600">{m.extra}</span>
            ) : delta !== null && delta !== 0 ? (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold ${delta > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{delta > 0 ? '▲' : '▼'} {Math.abs(delta)} vs ano anterior</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
