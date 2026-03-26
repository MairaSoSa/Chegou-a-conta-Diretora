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
          tipoKey: "ideb",
          label,
          titulo: `IDEB — ${label}`,
          valor: fmt(v),
          raw: Number(v),
          fieldKey: key,
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
          tipoKey: "atu",
          label,
          titulo: `Média Alunos/Turma — ${label}`,
          valor: fmt(v) + " alunos/turma",
          raw: Number(v),
          fieldKey: key,
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
          tipoKey: "tdi",
          label,
          titulo: `Distorção Idade-Série — ${label}`,
          valor: fmt(v) + "%",
          raw: Number(v),
          fieldKey: key,
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
          tipoKey: "had",
          label,
          titulo: `Horas-Aula Diárias — ${label}`,
          valor: fmt(v) + "h",
          raw: Number(v),
          fieldKey: key,
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
          tipoKey: "dsu",
          label,
          titulo: `Docentes c/ Superior — ${label}`,
          valor: fmt(v) + "%",
          raw: Number(v),
          fieldKey: key,
          status: st,
          explicacao: "Percentual de docentes com ensino superior completo.",
        });
      }
    }
  }

  if (indicadores.icg) {
    const nivel = Number(indicadores.icg.nivel ?? indicadores.icg.icg_nivel);
    if (!isNaN(nivel) && nivel > 0) {
      let st = "bom";
      if (nivel >= 5) st = "critico";
      else if (nivel >= 4) st = "atencao";
      else if (nivel >= 3) st = "adequado";
      result.push({
        tipo: "ICG",
        tipoKey: "icg",
        label: `Nível ${nivel}`,
        titulo: "Complexidade de Gestão (ICG)",
        valor: `Nível ${nivel} / 6`,
        raw: nivel,
        fieldKey: "nivel",
        status: st,
        explicacao: "Índice de complexidade de gestão de 1 a 6. Escolas nos níveis 5–6 exigem maior suporte administrativo.",
      });
    }
  }

  if (indicadores.ird) {
    const media = Number(indicadores.ird.media_ird ?? indicadores.ird.media ?? indicadores.ird.ird_media);
    if (!isNaN(media) && media > 0) {
      let st = "bom";
      if (media < 2) st = "critico";
      else if (media < 3) st = "atencao";
      else if (media < 4) st = "adequado";
      result.push({
        tipo: "IRD",
        tipoKey: "ird",
        label: fmt(media),
        titulo: "Regularidade Docente (IRD)",
        valor: fmt(media) + " / 5",
        raw: media,
        fieldKey: "media_ird",
        status: st,
        explicacao: "Mede a regularidade do vínculo dos professores com a escola (escala 1–5). Abaixo de 3 indica alta rotatividade.",
      });
    }
  }

  if (indicadores.afd) {
    const d = indicadores.afd;
    const cat1Fund = Number(d.fun_cat_1 ?? d.afd_fund_cat1 ?? d.cat_1_fund);
    const cat1Med = Number(d.med_cat_1 ?? d.afd_med_cat1 ?? d.cat_1_med);
    const pairs = [
      { v: cat1Fund, label: "Fundamental" },
      { v: cat1Med, label: "Ensino Médio" },
    ];
    for (const { v, label } of pairs) {
      if (!isNaN(v) && v > 0) {
        let st = "bom";
        if (v < 50) st = "critico";
        else if (v < 70) st = "atencao";
        else if (v < 85) st = "adequado";
        result.push({
          tipo: "AFD",
          tipoKey: "afd",
          label,
          titulo: `Adequação Formação Docente — ${label}`,
          valor: fmt(v) + "%",
          raw: v,
          fieldKey: label === "Ensino Médio" ? "med_cat_1" : "fun_cat_1",
          status: st,
          explicacao: `% de professores do ${label} com formação adequada (Grupo 1) para a disciplina que lecionam.`,
        });
      }
    }
  }

  if (indicadores.ied) {
    const d = indicadores.ied;
    const n5 = Number(d.nivel_5 ?? d.ied_nivel5 ?? 0);
    const n6 = Number(d.nivel_6 ?? d.ied_nivel6 ?? 0);
    const alto = n5 + n6;
    if (alto >= 0 && (n5 > 0 || n6 > 0 || d.nivel_1 != null)) {
      result.push({
        tipo: "IED",
        tipoKey: "ied",
        label: `Nív. 5+6`,
        titulo: "Esforço Docente (IED)",
        valor: fmt(alto) + "% sobrecarga",
        raw: alto,
        fieldKey: "nivel_5_6",
        status: alto > 50 ? "atencao" : "bom",
        explicacao: "% de professores nos níveis de esforço mais altos (5 e 6), atuando em múltiplas escolas e turnos. Acima de 50% é preocupante.",
      });
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
          tipoKey: "taxas_rendimento",
          label,
          titulo: label,
          valor: fmt(v) + "%",
          raw: n,
          fieldKey: key,
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
        tipoKey: "inse",
        label: "Nível " + (d.inse_classificacao || ""),
        titulo: "Índice Socioeconômico (INSE)",
        valor: fmt(d.inse_valor),
        raw: Number(d.inse_valor),
        fieldKey: "inse_valor",
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
          tipoKey: "saeb",
          label,
          titulo: `SAEB — ${label}`,
          valor: fmt(v, 0),
          raw: Number(v),
          fieldKey: key,
          status: "info",
          explicacao: "Proficiência no SAEB. Média nacional para o ensino fundamental: ~230 (AI) e ~260 (AF).",
        });
      }
    }
  }

  return result;
}

function getNested(obj: any, path: string): number | null {
  if (!obj || !path) return null;
  const v = path.split('.').reduce((acc: any, k: string) => (acc ? acc[k] : undefined), obj);
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function fmtDiff(v: number | null | undefined) {
  if (v == null || isNaN(v)) return "";
  const s = v >= 0 ? "+" : "";
  return `${s}${Number(v).toFixed(1)}`;
}

export function IndicatorPanel({
  indicators,
  indicadores,
  mediasNacionais,
  comparativo,
  microregiao,
}: {
  indicators?: Array<any>;
  indicadores?: Record<string, any>;
  mediasNacionais?: any;
  comparativo?: any;
  microregiao?: any;
}) {
  const items = indicators ?? (indicadores ? buildIndicators(indicadores, mediasNacionais) : []);
  if (!items || !items.length) return null;

  const getRefs = (ind: any) => {
    const school = Number(ind.raw);
    if (isNaN(school)) return [] as Array<{label:string; value:number|null; diff:number|null}>;

    // IDEB: tem micro/mun/uf/brasil dedicados
    if (ind.tipoKey === "ideb" && ind.fieldKey) {
      const microVal = getNested(microregiao, ind.fieldKey);
      const munVal = getNested(comparativo, `municipio.${ind.fieldKey}`);
      const ufVal = getNested(comparativo, `uf.${ind.fieldKey}`);
      const brVal = getNested(comparativo, `brasil.${ind.fieldKey}`) ?? getNested(mediasNacionais, `ideb.${ind.fieldKey}`);
      return [
        { label: `Microrregião ${microregiao?.micro_nome || ''}`.trim(), value: microVal, diff: microVal != null ? school - microVal : null },
        { label: comparativo?.municipio?.nome || "Município", value: munVal, diff: munVal != null ? school - munVal : null },
        { label: comparativo?.uf?.sg || "UF", value: ufVal, diff: ufVal != null ? school - ufVal : null },
        { label: "Brasil", value: brVal, diff: brVal != null ? school - brVal : null },
      ];
    }

    // Demais cards: pelo menos Brasil (média nacional do mesmo campo)
    const br = getNested(mediasNacionais, `${ind.tipoKey}.${ind.fieldKey}`);
    if (br == null) return [] as Array<{label:string; value:number|null; diff:number|null}>;
    return [{ label: "Brasil", value: br, diff: school - br }];
  };

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
          {(() => {
            const refs = getRefs(ind);
            if (!refs.length) return null;
            return (
              <div className="mt-1 pt-1 border-t border-gray-200/80 space-y-0.5">
                {refs.map((r, idx) => (
                  <div key={`${ind.titulo}-${idx}`} className="flex items-center justify-between text-[11px]">
                    <span className="text-[#64748b] truncate pr-2">{r.label}</span>
                    <span className="font-medium text-[#334155] shrink-0">
                      {r.value == null ? "—" : fmt(r.value, 1)}
                      {r.diff != null && (
                        <span className={r.diff >= 0 ? "text-green-700 ml-1" : "text-red-700 ml-1"}>{fmtDiff(r.diff)}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      ))}
    </div>
  );
}
