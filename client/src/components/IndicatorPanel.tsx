import React from "react";

function fmt(v: number | null | undefined, decimals = 1) {
  if (v == null) return "—";
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDiff(v: number | null | undefined) {
  if (v == null || isNaN(v)) return "";
  const s = v >= 0 ? "+" : "";
  return `${s}${Number(v).toFixed(1).replace(".", ",")}`;
}

function statusIdeb(v: number) {
  if (v < 4.0) return "critico";
  if (v < 5.0) return "atencao";
  if (v < 6.0) return "adequado";
  return "bom";
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  critico:  { bg: "#fff5f5", border: "#fecaca", text: "#b91c1c", badge: "#fee2e2" },
  atencao:  { bg: "#fffbeb", border: "#fde68a", text: "#92400e", badge: "#fef3c7" },
  adequado: { bg: "#fefce8", border: "#fef08a", text: "#713f12", badge: "#fef9c3" },
  bom:      { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", badge: "#dcfce7" },
  info:     { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", badge: "#dbeafe" },
  sem_dados:{ bg: "#f8fafc", border: "#e2e8f0", text: "#64748b", badge: "#f1f5f9" },
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
          titulo: `Alunos/Turma — ${label}`,
          valor: fmt(v) + " al./turma",
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
      { key: "nota_mt_ai", label: "Matemática AI", ref: "~230 (AI)" },
      { key: "nota_lp_ai", label: "Língua Port. AI", ref: "~230 (AI)" },
      { key: "nota_mt_af", label: "Matemática AF", ref: "~260 (AF)" },
      { key: "nota_lp_af", label: "Língua Port. AF", ref: "~260 (AF)" },
      { key: "nota_mt_em", label: "Matemática Médio", ref: "~275 (EM)" },
      { key: "nota_lp_em", label: "Língua Port. Médio", ref: "~275 (EM)" },
    ];
    for (const { key, label, ref } of vals) {
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
          explicacao: `Proficiência no SAEB. Referência nacional: ${ref}.`,
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

export function IndicatorPanel({
  indicators,
  indicadores,
  mediasNacionais,
  comparativo,
  microregiao,
  historico,
}: {
  indicators?: Array<any>;
  indicadores?: Record<string, any>;
  mediasNacionais?: any;
  comparativo?: any;
  microregiao?: any;
  historico?: Record<string, Array<{ano: number; valor: number}>>;
}) {
  const items = indicators ?? (indicadores ? buildIndicators(indicadores, mediasNacionais) : []);
  if (!items || !items.length) return null;

  const getEvolucao = (ind: any): Array<{ano: number; valor: number}> => {
    if (!historico) return [];
    if (ind.tipoKey === "ied") {
      const s5 = historico["ied.nivel_5"] ?? [];
      const s6 = historico["ied.nivel_6"] ?? [];
      const anos = Array.from(new Set([...s5.map(d => d.ano), ...s6.map(d => d.ano)])).sort();
      return anos.map(ano => ({
        ano,
        valor: Number(((s5.find(d => d.ano === ano)?.valor ?? 0) + (s6.find(d => d.ano === ano)?.valor ?? 0)).toFixed(1)),
      })).filter(d => d.valor > 0);
    }
    return historico[`${ind.tipoKey}.${ind.fieldKey}`] ?? [];
  };

  const getRefs = (ind: any) => {
    const school = Number(ind.raw);
    if (isNaN(school)) return [] as Array<{label: string; value: number | null; diff: number | null}>;

    if (ind.tipoKey === "ideb" && ind.fieldKey) {
      const microVal = getNested(microregiao, ind.fieldKey);
      const munVal = getNested(comparativo, `municipio.${ind.fieldKey}`);
      const ufVal = getNested(comparativo, `uf.${ind.fieldKey}`);
      const brVal = getNested(comparativo, `brasil.${ind.fieldKey}`) ?? getNested(mediasNacionais, `ideb.${ind.fieldKey}`);
      return [
        { label: `Micro ${microregiao?.micro_nome || ''}`.trim(), value: microVal, diff: microVal != null ? school - microVal : null },
        { label: comparativo?.municipio?.nome || "Município", value: munVal, diff: munVal != null ? school - munVal : null },
        { label: comparativo?.uf?.sg || "UF", value: ufVal, diff: ufVal != null ? school - ufVal : null },
        { label: "Brasil", value: brVal, diff: brVal != null ? school - brVal : null },
      ].filter(r => r.value != null);
    }

    if (ind.tipoKey === "ied") {
      const mn5 = getNested(mediasNacionais, "ied.nivel_5");
      const mn6 = getNested(mediasNacionais, "ied.nivel_6");
      if (mn5 == null && mn6 == null) return [];
      const brVal = (mn5 ?? 0) + (mn6 ?? 0);
      return [{ label: "Brasil", value: Number(brVal.toFixed(1)), diff: school - brVal }];
    }

    const br = getNested(mediasNacionais, `${ind.tipoKey}.${ind.fieldKey}`);
    if (br == null) return [] as Array<{label: string; value: number | null; diff: number | null}>;
    return [{ label: "Brasil", value: br, diff: school - br }];
  };

  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'10px', marginTop:'4px', marginBottom:'16px'}}>
      {items.map((ind: any, i: number) => {
        const colors = STATUS_COLORS[ind.status] ?? STATUS_COLORS["info"];
        const evolucao = getEvolucao(ind);
        const refs = getRefs(ind);

        const visibleEv = evolucao.slice(-5);
        const hasEv = visibleEv.length >= 2;
        const firstEv = visibleEv[0];
        const lastEv = visibleEv[visibleEv.length - 1];
        const delta = hasEv ? lastEv.valor - firstEv.valor : null;
        const higherIsBetter = !["tdi", "reprovacao_fund", "reprovacao_med", "abandono_fund", "abandono_med"].includes(ind.tipoKey)
          && !["Reprovação Fund.", "Reprovação Médio", "Abandono Fund.", "Abandono Médio"].includes(ind.label);
        const improving = delta != null ? (higherIsBetter ? delta > 0 : delta < 0) : null;
        const trendIcon = improving == null ? null : improving ? "↑" : delta === 0 ? "→" : "↓";
        const trendColor = improving == null ? "#94a3b8" : improving ? "#166534" : "#b91c1c";

        return (
          <div
            key={i}
            style={{
              background: colors.bg,
              border: `1.5px solid ${colors.border}`,
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            {/* Cabeçalho */}
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 4}}>
              <span style={{fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', color: colors.text, background: colors.badge, borderRadius:20, padding:'2px 8px'}}>{ind.tipo}</span>
              <span style={{fontSize:11, color:'#64748b', fontWeight:600}}>{ind.label}</span>
            </div>
            <div style={{fontSize:13, fontWeight:700, color:'#1e293b', marginBottom:2, lineHeight:1.3}}>{ind.titulo}</div>
            <div style={{fontSize:22, fontWeight:800, color: colors.text, letterSpacing:'-0.02em', marginBottom:8, lineHeight:1}}>{ind.valor}</div>

            {/* Evolução própria — PRINCIPAL */}
            {hasEv ? (
              <div style={{background:'rgba(255,255,255,0.7)', borderRadius:8, padding:'8px 10px', marginBottom:8}}>
                <div style={{fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6}}>
                  Evolução da escola
                </div>
                <div style={{display:'flex', alignItems:'flex-end', gap:'4px', flexWrap:'wrap'}}>
                  {visibleEv.map((d, idx) => (
                    <React.Fragment key={d.ano}>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:13, fontWeight:700, color:'#1e293b', lineHeight:1}}>{fmt(d.valor, ind.tipo === 'SAEB' ? 0 : 1)}</div>
                        <div style={{fontSize:9, color:'#94a3b8', marginTop:2}}>{d.ano}</div>
                      </div>
                      {idx < visibleEv.length - 1 && (
                        <span style={{fontSize:11, color:'#cbd5e1', marginBottom:8}}>›</span>
                      )}
                    </React.Fragment>
                  ))}
                  {trendIcon && delta != null && (
                    <span style={{fontSize:13, fontWeight:800, color: trendColor, marginLeft:4, marginBottom:8}}>
                      {trendIcon} {fmtDiff(delta)}
                    </span>
                  )}
                </div>
                {hasEv && (
                  <div style={{fontSize:10, color:'#94a3b8', marginTop:4}}>
                    {improving === true ? 'Trajetória de melhora' : improving === false ? 'Trajetória de piora' : 'Estável'}
                    {delta != null && firstEv ? ` desde ${firstEv.ano}` : ''}
                  </div>
                )}
              </div>
            ) : (
              <div style={{background:'rgba(255,255,255,0.5)', borderRadius:8, padding:'7px 10px', marginBottom:8}}>
                <div style={{fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3}}>Evolução da escola</div>
                <div style={{fontSize:11, color:'#94a3b8'}}>Apenas um ano disponível</div>
              </div>
            )}

            {/* Referências nacionais/regionais — CONTEXTO */}
            {refs.length > 0 && (
              <div style={{borderTop:'1px dashed #e2e8f0', paddingTop:7, marginBottom:6}}>
                <div style={{fontSize:9, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4}}>Referência</div>
                <div style={{display:'flex', flexDirection:'column', gap:3}}>
                  {refs.map((r, idx) => (
                    <div key={idx} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{fontSize:11, color:'#94a3b8'}}>{r.label}</span>
                      <span style={{fontSize:11, fontWeight:600, color:'#64748b'}}>
                        {r.value == null ? '—' : fmt(r.value, ind.tipo === 'SAEB' ? 0 : 1)}
                        {r.diff != null && (
                          <span style={{marginLeft:4, fontSize:10, color: r.diff >= 0 ? '#16a34a' : '#dc2626'}}>
                            {fmtDiff(r.diff)}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explicação */}
            <p style={{fontSize:11, color:'#64748b', lineHeight:1.5, margin:0}}>{ind.explicacao}</p>
          </div>
        );
      })}
    </div>
  );
}
