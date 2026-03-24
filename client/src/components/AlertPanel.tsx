import React from "react";

type AlertItem = {
  tipo: string;
  titulo: string;
  descricao: string;
  indicador: string;
  progressao?: { delta: number; label: string; anoAnterior: number };
};

export function AlertPanel({ alerts }: { alerts: AlertItem[] }) {
  if (!alerts.length) return null;
  return (
    <div className="alert-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4 mb-8">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={`alert-card p-5 rounded-2xl border shadow-md relative transition-transform duration-150 ${a.tipo === 'critical' ? 'bg-red-50 border-red-200' : a.tipo === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'} ${i % 2 === 0 ? '-rotate-1' : 'rotate-1'}`}
        >
          <div className="topline flex items-center gap-2 mb-2">
            <span className={`severity px-2 py-1 rounded-full text-xs font-bold ${a.tipo === 'critical' ? 'bg-red-100 text-red-700' : a.tipo === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
              {a.tipo === 'critical' ? 'Precisa de atenção' : a.tipo === 'warning' ? 'Atenção' : 'OK'}
            </span>
            <span className="text-xs text-muted-foreground font-mono">{a.indicador}</span>
          </div>
          <h3 className="font-bold text-base mb-1" style={{color: a.tipo === 'critical' ? '#b74f42' : a.tipo === 'warning' ? '#9b6a16' : '#2f7a58'}}>{a.titulo}</h3>
          <p className="text-sm text-[#47586d] leading-snug">{a.descricao}</p>
          {a.progressao && (
            <div style={{marginTop:'8px',display:'inline-flex',alignItems:'center',gap:'5px',background:'#eafaf2',border:'1px solid #a3dfc0',borderRadius:'20px',padding:'3px 10px'}}>
              <span style={{fontSize:'13px'}}>📈</span>
              <span style={{fontSize:'11px',fontWeight:700,color:'#1f7a4a'}}>{a.progressao.label}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
