import React from "react";

function fmt(v: number | null | undefined, decimals = 1) {
  if (v == null) return "—";
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function statusIdeb(v: number) {
  if (v < 4.0) return "critico";
  if (v < 5.0) return "atencao";
  if (v < 6.0) return "adequado";
  return "bom";
}

const STATUS_COLORS: Record<string, string> = {
  critico: "bg-red-50 border-red-200 text-red-700",
  atencao: "bg-amber-50 border-amber-200 text-amber-700",
  adequado: "bg-yellow-50 border-yellow-200 text-yellow-700",
  bom: "bg-green-50 border-green-200 text-green-700",
  info: "bg-blue-50 border-blue-200 text-blue-700",
  sem_dados: "bg-gray-50 border-gray-200 text-gray-500",
};

function buildIndicators(indicadores: Record<string, any>, mediasNacionais: any): Array<any> {
  const result: any[] = [];
  const mn = mediasNacionais || {};

  if (indicadores.ideb) {
    const d = indicadores.ideb;
    const vals = [
      { key: "ideb_ai", label: "Anos Iniciais" },
      { key: "ideb_af", label: "Anos Finais" },
      { key: "ideb_em", label: "Ensino Médio" },
    ];
    for (const { key, label } of vals) {
      const v = d[key];
      if (v != null && Number(v) > 0) {
        result.push({
          tipo: "IDEB",
          label,
          titulo: `IDEB — ${label}`,
          valor: fmt(v),
          status: statusIdeb(Number(v)),
          explicacao: `Índice de Desenvolvimento da Educação Básica para ${label}. Meta nacional ≥ 6,0.`,
        });
      }
    }
  }

  if (indicadores.atu) {
    const d = indicadores.atu;
    const vals = [
      { key: "atu_fund_ai", label: "Fund. AI" },
      { key: "atu_fund_af", label: "Fund. AF" },
      { key: "atu_med", label: "Médio" },
      { key: "atu_inf", label: "Infantil" },
    ];
    for (const { key, label } of vals) {
      const v = d[key];
      if (v != null && Number(v) > 0) {
        const n = Number(v);
        let st = "bom";
        if (n > 35) st = "critico";
        else if (n > 30) st = "atencao";
        else if (n > 25) st = "adequado";
        result.push({
          tipo: "ATU",
          label,
          titulo: `Média Alunos/Turma — ${label}`,
          valor: fmt(v) + " alunos/turma",
          status: st,
          explicacao: "Relação média entre alunos matriculados e turmas existentes.",
        });
      }
    }
  }

  if (indicadores.tdi) {
    const d = indicadores.tdi;
    const vals = [
      { key: "tdi_fund", label: "Fundamental" },
      { key: "tdi_med", label: "Médio" },
    ];
    for (const { key, label } of vals) {
      const v = d[key];
      if (v != null) {
        const n = Number(v);
        let st = "bom";
        if (n > 30) st = "critico";
        else if (n > 15) st = "atencao";
        else if (n > 5) st = "adequado";
        result.push({
          tipo: "TDI",
          label,
          titulo: `Distorção Idade-Série — ${label}`,
          valor: fmt(v) + "%",
          status: st,
          explicacao: "Taxa de alunos com defasagem de 2 ou mais anos no ensino " + label.toLowerCase() + ".",
        });
      }
    }
  }

  if (indicadores.had) {
    const d = indicadores.had;
    const vals = [
      { key: "had_fund_ai", label: "Fund. AI" },
      { key: "had_fund_af", label: "Fund. AF" },
      { key: "had_med", label: "Médio" },
    ];
    for (const { key, label } of vals) {
      const v = d[key];
      if (v != null && Number(v) > 0) {
        const n = Number(v);
        let st = "bom";
        if (n < 3) st = "critico";
        else if (n < 4) st = "atencao";
        else if (n < 5) st = "adequado";
        result.push({
          tipo: "HAD",
          label,
          titulo: `Horas-Aula Diárias — ${label}`,
          valor: fmt(v) + "h",
          status: st,
          explicacao: "Número médio de horas-aula oferecidas por dia no " + label.toLowerCase() + ".",
        });
      }
    }
  }

  if (indicadores.dsu) {
    const d = indicadores.dsu;
    const vals = [
      { key: "dsu_fund_ai", label: "Fund. AI" },
      { key: "dsu_fund_af", label: "Fund. AF" },
      { key: "dsu_med", label: "Médio" },
    ];
    for (const { key, label } of vals) {
      const v = d[key];
      if (v != null) {
        const n = Number(v);
        let st = "bom";
        if (n < 50) st = "critico";
        else if (n < 70) st = "atencao";
        else if (n < 90) st = "adequado";
        result.push({
          tipo: "DSU",
          label,
          titulo: `Docentes c/ Superior — ${label}`,
          valor: fmt(v) + "%",
          status: st,
          explicacao: "Percentual de docentes com ensino superior completo.",
        });
      }
    }
  }

  if (indicadores.taxas_rendimento) {
    const d = indicadores.taxas_rendimento;
    const pairs = [
      { key: "aprovacao_fund", label: "Aprovação Fund.", inv: false },
      { key: "reprovacao_fund", label: "Reprovação Fund.", inv: true },
      { key: "abandono_fund", label: "Abandono Fund.", inv: true },
      { key: "aprovacao_med", label: "Aprovação Médio", inv: false },
      { key: "reprovacao_med", label: "Reprovação Médio", inv: true },
      { key: "abandono_med", label: "Abandono Médio", inv: true },
    ];
    for (const { key, label, inv } of pairs) {
      const v = d[key];
      if (v != null) {
        const n = Number(v);
        let st: string;
        if (inv) {
          if (n > 10) st = "critico";
          else if (n > 5) st = "atencao";
          else if (n > 2) st = "adequado";
          else st = "bom";
        } else {
          if (n >= 95) st = "bom";
          else if (n >= 90) st = "adequado";
          else if (n >= 80) st = "atencao";
          else st = "critico";
        }
        result.push({
          tipo: "Rendimento",
          label,
          titulo: label,
          valor: fmt(v) + "%",
          status: st,
          explicacao: "Taxa de " + label.toLowerCase() + " do Censo Escolar.",
        });
      }
    }
  }

  if (indicadores.inse) {
    const d = indicadores.inse;
    if (d.inse_valor != null && Number(d.inse_valor) > 0) {
      result.push({
        tipo: "INSE",
        label: "Nível " + (d.inse_classificacao || ""),
        titulo: "Índice Socioeconômico (INSE)",
        valor: fmt(d.inse_valor),
        status: "info",
        explicacao: "Nível socioeconômico médio dos estudantes da escola. Escala de I a VIII.",
      });
    }
  }

  if (indicadores.saeb) {
    const d = indicadores.saeb;
    const vals = [
      { key: "saeb_mat_fund_ai", label: "Matemática AI" },
      { key: "saeb_port_fund_ai", label: "Língua Port. AI" },
      { key: "saeb_mat_fund_af", label: "Matemática AF" },
      { key: "saeb_port_fund_af", label: "Língua Port. AF" },
      { key: "saeb_mat_med", label: "Matemática Médio" },
      { key: "saeb_port_med", label: "Língua Port. Médio" },
    ];
    for (const { key, label } of vals) {
      const v = d[key];
      if (v != null && Number(v) > 0) {
        result.push({
          tipo: "SAEB",
          label,
          titulo: `SAEB — ${label}`,
          valor: fmt(v, 0),
          status: "info",
          explicacao: "Proficiência no SAEB. Média nacional para o ensino fundamental: ~230 (AI) e ~260 (AF).",
        });
      }
    }
  }

  return result;
}

export function IndicatorPanel({
  indicators,
  indicadores,
  mediasNacionais,
}: {
  indicators?: Array<any>;
  indicadores?: Record<string, any>;
  mediasNacionais?: any;
}) {
  const items = indicators ?? (indicadores ? buildIndicators(indicadores, mediasNacionais) : []);
  if (!items || !items.length) return null;
  return (
    <div className="indicator-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 mt-2 mb-4">
      {items.map((ind: any, i: number) => (
        <div
          key={i}
          className={`indicator-card p-3 rounded-lg border bg-white relative transition-all duration-100 ${STATUS_COLORS[ind.status] || STATUS_COLORS["info"]}`}
        >
          <div className="indicator-top flex items-center gap-1 mb-1">
            <span className={`badge px-1.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_COLORS[ind.status] || STATUS_COLORS["info"]}`}>{ind.label}</span>
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
