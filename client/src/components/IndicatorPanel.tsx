import React from "react";

const STATUS_COLORS: Record<string, string> = {
  critico: "bg-red-50 border-red-200 text-red-700",
  atencao: "bg-amber-50 border-amber-200 text-amber-700",
  adequado: "bg-yellow-50 border-yellow-200 text-yellow-700",
  bom: "bg-green-50 border-green-200 text-green-700",
  info: "bg-blue-50 border-blue-200 text-blue-700",
  sem_dados: "bg-gray-50 border-gray-200 text-gray-500",
};

export function IndicatorPanel({ indicators }: { indicators: Array<any> }) {
  if (!indicators.length) return null;
  return (
    <div className="indicator-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 mt-2 mb-4">
      {indicators.map((ind, i) => (
        <div
          key={i}
          className={`indicator-card p-3 rounded-lg border border-gray-200 bg-white relative transition-all duration-100 ${STATUS_COLORS[ind.status] || STATUS_COLORS['info']}`}
        >
          <div className="indicator-top flex items-center gap-1 mb-1">
            <span className={`badge px-1.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_COLORS[ind.status] || STATUS_COLORS['info']}`}>{ind.label}</span>
            <span className="text-[11px] text-muted-foreground font-mono">{ind.tipo}</span>
          </div>
          <div className="indicator-title font-semibold text-[13px] mb-0.5 truncate" title={ind.titulo}>{ind.titulo}</div>
          <div className="indicator-value text-lg font-bold mb-0.5 text-[#24313f]">{ind.valor}</div>
          {ind.secundarios && (
            <div className="flex flex-wrap gap-0.5 mb-0.5">
              {ind.secundarios.map((s: string, j: number) => (
                <span key={j} className="mini-chip bg-white/90 border border-gray-200 rounded-full px-1.5 py-0.5 text-[10px] font-medium">{s}</span>
              ))}
            </div>
          )}
          <p className="text-xs text-[#47586d] leading-snug mt-0.5">{ind.explicacao}</p>
        </div>
      ))}
    </div>
  );
}
