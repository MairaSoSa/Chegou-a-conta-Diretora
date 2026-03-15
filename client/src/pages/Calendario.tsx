import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  Calendar, Clock, ExternalLink, AlertTriangle,
  Loader2, ChevronLeft, ChevronRight, Newspaper,
  BookOpen, Landmark, GraduationCap, RefreshCw,
  Info, CheckCircle2, AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface PrazoEducacional {
  titulo: string;
  descricao: string;
  dataInicio?: string;
  dataFim?: string;
  mes: number;
  categoria: string;
  fonte: string;
  urgencia: "alta" | "media" | "baixa";
  url?: string;
  aConfirmar?: boolean;
}

interface NoticiaEducacao {
  titulo: string;
  url: string;
  data: string;
  fonte: "MEC" | "FNDE" | "INEP";
  categoria?: string;
  resumo?: string;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const CATEGORIA_CORES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  PDDE: { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af", icon: "💰" },
  PNAE: { bg: "#dcfce7", border: "#86efac", text: "#166534", icon: "🍎" },
  PNATE: { bg: "#fef3c7", border: "#fcd34d", text: "#92400e", icon: "🚌" },
  FUNDEB: { bg: "#e0e7ff", border: "#a5b4fc", text: "#3730a3", icon: "🏦" },
  CENSO: { bg: "#fce7f3", border: "#f9a8d4", text: "#9d174d", icon: "📊" },
  SAEB: { bg: "#f3e8ff", border: "#c4b5fd", text: "#6b21a8", icon: "📝" },
  "PRESTAÇÃO": { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", icon: "📋" },
  PLANEJAMENTO: { bg: "#f0fdfa", border: "#5eead4", text: "#115e59", icon: "📅" },
  GERAL: { bg: "#f8fafc", border: "#cbd5e1", text: "#475569", icon: "📌" },
};

const URGENCIA_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  alta: { bg: "#fef2f2", text: "#dc2626", label: "Urgente" },
  media: { bg: "#fffbeb", text: "#d97706", label: "Atenção" },
  baixa: { bg: "#f0fdf4", text: "#16a34a", label: "Informativo" },
};

export default function CalendarioPage() {
  const currentDate = new Date();
  const anoAtual = Math.max(currentDate.getFullYear(), 2026);
  const [ano, setAno] = useState(anoAtual);
  const [mesSelecionado, setMesSelecionado] = useState<number | null>(null);

  const prazosQuery = useQuery<{ ok: boolean; prazos: PrazoEducacional[]; ano: number }>({
    queryKey: ["/api/prazos-educacionais", ano],
    queryFn: async () => {
      const res = await fetch(`/api/prazos-educacionais?ano=${ano}`);
      if (!res.ok) throw new Error("Erro ao carregar prazos");
      return res.json();
    },
  });

  const noticiasQuery = useQuery<{ ok: boolean; noticias: NoticiaEducacao[]; total: number }>({
    queryKey: ["/api/noticias-educacao"],
    queryFn: async () => {
      const res = await fetch("/api/noticias-educacao?limit=20");
      if (!res.ok) throw new Error("Erro ao carregar notícias");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const prazos = prazosQuery.data?.prazos || [];
  const noticias = noticiasQuery.data?.noticias || [];

  const mesAtual = currentDate.getMonth() + 1;
  const prazosPorMes: Record<number, PrazoEducacional[]> = {};
  for (const p of prazos) {
    if (!prazosPorMes[p.mes]) prazosPorMes[p.mes] = [];
    prazosPorMes[p.mes].push(p);
  }

  const prazosFiltrados = mesSelecionado
    ? prazos.filter((p) => p.mes === mesSelecionado)
    : prazos.sort((a, b) => {
        const distA = ((a.mes - mesAtual + 12) % 12);
        const distB = ((b.mes - mesAtual + 12) % 12);
        return distA - distB;
      });

  const fonteIcon = (fonte: string) => {
    if (fonte === "MEC") return <Landmark style={{ width: "14px", height: "14px" }} />;
    if (fonte === "FNDE") return <BookOpen style={{ width: "14px", height: "14px" }} />;
    if (fonte === "INEP") return <GraduationCap style={{ width: "14px", height: "14px" }} />;
    return <Newspaper style={{ width: "14px", height: "14px" }} />;
  };

  const fonteBadge = (fonte: string): React.CSSProperties => {
    if (fonte === "MEC") return { background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd" };
    if (fonte === "FNDE") return { background: "#dcfce7", color: "#166534", border: "1px solid #86efac" };
    return { background: "#f3e8ff", color: "#6b21a8", border: "1px solid #c4b5fd" };
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f4ede3" }}>
      <Navigation />
      <div style={{
        padding: "28px 24px 22px",
        borderBottom: "1px solid #ddd4c8",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px", color: "#3d4f34" }}>
              <Calendar style={{ width: "24px", height: "24px" }} />
              Calendário e Prazos da Diretora
            </h1>
            <p style={{ fontSize: "13px", color: "#7a8f6e" }}>
              Prazos importantes, datas-chave e notícias recentes do MEC, FNDE e INEP
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={() => ano > 2026 && setAno(ano - 1)} style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: "6px", padding: "6px", cursor: ano <= 2026 ? "not-allowed" : "pointer", color: "#3d4f34", opacity: ano <= 2026 ? 0.4 : 1 }}>
              <ChevronLeft style={{ width: "18px", height: "18px" }} />
            </button>
            <span style={{ fontSize: "18px", fontWeight: 700, minWidth: "60px", textAlign: "center" }}>{ano}</span>
            <button onClick={() => setAno(ano + 1)} style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: "6px", padding: "6px", cursor: "pointer", color: "#3d4f34" }}>
              <ChevronRight style={{ width: "18px", height: "18px" }} />
            </button>
          </div>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "24px 16px" }}>
        <div style={{
          background: "#eff6ff", borderLeft: "4px solid #3b82f6",
          padding: "14px 18px", borderRadius: "0 10px 10px 0",
          fontSize: "13px", color: "#1e40af", marginBottom: "20px", lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Info className="w-4 h-4" />
            Como usar este calendário
          </div>
          <p>Clique em um mês para filtrar os prazos. As datas são baseadas nos cronogramas típicos do MEC, FNDE e INEP. Confira sempre os editais oficiais para datas exatas de cada ano.</p>
        </div>

        {ano > 2026 && (
          <div style={{
            background: "#fffbeb", borderLeft: "4px solid #f59e0b",
            padding: "14px 18px", borderRadius: "0 10px 10px 0",
            fontSize: "13px", color: "#92400e", marginBottom: "20px", lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertTriangle className="w-4 h-4" />
              Datas ainda não confirmadas
            </div>
            <p>Os prazos para {ano} são baseados nos padrões dos anos anteriores. As datas exatas serão atualizadas quando forem publicadas oficialmente pelo MEC, FNDE e INEP.</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(85px, 1fr))", gap: "8px", marginBottom: "24px" }}>
          {MESES.map((nome, i) => {
            const mes = i + 1;
            const count = prazosPorMes[mes]?.length || 0;
            const isAtual = mes === mesAtual && ano === currentDate.getFullYear();
            const isSelecionado = mesSelecionado === mes;
            const hasUrgente = prazosPorMes[mes]?.some((p) => p.urgencia === "alta");
            return (
              <button
                key={mes}
                onClick={() => setMesSelecionado(isSelecionado ? null : mes)}
                style={{
                  padding: "10px 4px",
                  borderRadius: "8px",
                  border: isSelecionado ? "2px solid #5a6e4e" : isAtual ? "2px solid #7d9070" : "1px solid #e2e5ec",
                  background: isSelecionado ? "#5a6e4e" : isAtual ? "#f0f5ed" : "white",
                  color: isSelecionado ? "white" : isAtual ? "#4a5d3e" : "#475569",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700 }}>{nome.slice(0, 3).toUpperCase()}</div>
                {count > 0 && (
                  <div style={{
                    fontSize: "10px", fontWeight: 700, marginTop: "4px",
                    color: isSelecionado ? "rgba(255,255,255,0.8)" : hasUrgente ? "#dc2626" : "#94a3b8",
                  }}>
                    {count} {count === 1 ? "prazo" : "prazos"}
                  </div>
                )}
                {hasUrgente && !isSelecionado && (
                  <div style={{ position: "absolute", top: "4px", right: "4px", width: "6px", height: "6px", borderRadius: "50%", background: "#dc2626" }} />
                )}
              </button>
            );
          })}
        </div>

        <div className="calendario-grid" style={{ display: "grid", gap: "20px", alignItems: "start" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock style={{ width: "18px", height: "18px", color: "#5a6e4e" }} />
              {mesSelecionado
                ? `Prazos de ${MESES[mesSelecionado - 1]}`
                : "Próximos Prazos"}
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#94a3b8", marginLeft: "4px" }}>
                ({prazosFiltrados.length})
              </span>
            </h2>

            {prazosQuery.isLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: "#5a6e4e" }} />
                <div style={{ fontSize: "13px" }}>Carregando prazos...</div>
              </div>
            ) : prazosFiltrados.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8", background: "white", borderRadius: "10px", border: "1px solid #e2e5ec" }}>
                <Calendar className="w-8 h-8 mx-auto mb-2" style={{ opacity: 0.3 }} />
                <p style={{ fontSize: "13px" }}>Nenhum prazo encontrado para este mês.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {prazosFiltrados.map((prazo, idx) => {
                  const cat = CATEGORIA_CORES[prazo.categoria] || CATEGORIA_CORES.GERAL;
                  const urg = URGENCIA_BADGE[prazo.urgencia] || URGENCIA_BADGE.baixa;
                  const isProximo = prazo.mes === mesAtual && ano === currentDate.getFullYear();
                  return (
                    <div
                      key={idx}
                      style={{
                        background: "white",
                        borderRadius: "10px",
                        border: `1px solid ${isProximo ? cat.border : "#e2e5ec"}`,
                        boxShadow: isProximo ? `0 0 0 1px ${cat.border}` : "0 1px 3px rgba(0,0,0,0.04)",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "stretch" }}>
                        <div style={{
                          width: "56px", minHeight: "100%",
                          background: cat.bg,
                          display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center",
                          borderRight: `1px solid ${cat.border}`,
                          padding: "8px 0",
                        }}>
                          <span style={{ fontSize: "18px" }}>{cat.icon}</span>
                          <span style={{ fontSize: "9px", fontWeight: 700, color: cat.text, marginTop: "4px" }}>
                            {MESES[prazo.mes - 1]?.slice(0, 3).toUpperCase()}
                          </span>
                        </div>
                        <div style={{ flex: 1, padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", lineHeight: 1.3, flex: 1 }}>
                              {prazo.titulo}
                            </h3>
                            <span style={{
                              padding: "2px 8px", borderRadius: "12px",
                              fontSize: "10px", fontWeight: 700, whiteSpace: "nowrap",
                              background: urg.bg, color: urg.text,
                            }}>
                              {urg.label}
                            </span>
                          </div>
                          <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5, marginBottom: "8px" }}>
                            {prazo.descricao}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{
                              padding: "2px 8px", borderRadius: "4px",
                              fontSize: "10px", fontWeight: 600,
                              background: cat.bg, color: cat.text, border: `1px solid ${cat.border}`,
                            }}>
                              {prazo.categoria}
                            </span>
                            <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                              Fonte: {prazo.fonte}
                            </span>
                            {prazo.aConfirmar && (
                              <span style={{ fontSize: "10px", color: "#d97706", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px", background: "#fffbeb", padding: "1px 6px", borderRadius: "4px", border: "1px solid #fcd34d" }}>
                                <Clock style={{ width: "10px", height: "10px" }} />
                                Datas a confirmar
                              </span>
                            )}
                            {prazo.dataFim && !prazo.aConfirmar && (
                              <span style={{ fontSize: "10px", color: "#dc2626", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}>
                                <AlertTriangle style={{ width: "10px", height: "10px" }} />
                                Até {new Date(prazo.dataFim + "T12:00:00").toLocaleDateString("pt-BR")}
                              </span>
                            )}
                            {prazo.url && (
                              <a href={prazo.url} target="_blank" rel="noopener noreferrer" style={{
                                fontSize: "10px", color: "#1e40af", textDecoration: "none",
                                fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px",
                              }}>
                                <ExternalLink style={{ width: "10px", height: "10px" }} />
                                Saiba mais
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: "16px", padding: "12px 16px", background: "#fffbeb", borderRadius: "8px", border: "1px solid #fcd34d", fontSize: "11px", color: "#92400e", display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <AlertCircle style={{ width: "14px", height: "14px", flexShrink: 0, marginTop: "1px" }} />
              <span>
                As datas são baseadas nos cronogramas típicos. Verifique sempre os editais oficiais e portarias do FNDE, INEP e MEC para as datas exatas de cada ano.
              </span>
            </div>
          </div>

          <div style={{
            background: "white",
            borderRadius: "10px",
            border: "1px solid #e2e5ec",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            overflow: "hidden",
            position: "sticky",
            top: "16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #e2e5ec", background: "#f8faf7" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                <Newspaper style={{ width: "18px", height: "18px", color: "#5a6e4e" }} />
                Notícias Recentes
              </h2>
              <button
                onClick={() => noticiasQuery.refetch()}
                disabled={noticiasQuery.isFetching}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#94a3b8", padding: "4px",
                }}
                title="Atualizar notícias"
              >
                <RefreshCw style={{ width: "14px", height: "14px" }} className={noticiasQuery.isFetching ? "animate-spin" : ""} />
              </button>
            </div>

            <div style={{ maxHeight: "520px", overflowY: "auto", padding: "10px" }}>
            {noticiasQuery.isLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: "#5a6e4e" }} />
                <div style={{ fontSize: "12px" }}>Buscando notícias do MEC, FNDE e INEP...</div>
              </div>
            ) : noticias.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                <Newspaper className="w-8 h-8 mx-auto mb-2" style={{ opacity: 0.3 }} />
                <p style={{ fontSize: "12px" }}>Nenhuma notícia encontrada no momento.</p>
                <p style={{ fontSize: "11px", marginTop: "4px" }}>As notícias são buscadas diretamente nos portais oficiais.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {noticias.map((noticia, idx) => (
                  <a
                    key={idx}
                    href={noticia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      background: "#fafbfa",
                      borderRadius: "8px",
                      border: "1px solid #e2e5ec",
                      padding: "12px 14px",
                      textDecoration: "none",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{
                        padding: "6px",
                        borderRadius: "6px",
                        ...fonteBadge(noticia.fonte),
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {fonteIcon(noticia.fonte)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", lineHeight: 1.4, marginBottom: "4px" }}>
                          {noticia.titulo}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{
                            padding: "1px 6px", borderRadius: "4px",
                            fontSize: "9px", fontWeight: 700,
                            ...fonteBadge(noticia.fonte),
                          }}>
                            {noticia.fonte}
                          </span>
                          {noticia.categoria && (
                            <span style={{ fontSize: "9px", color: "#94a3b8" }}>{noticia.categoria}</span>
                          )}
                          {noticia.data && (
                            <span style={{ fontSize: "9px", color: "#94a3b8" }}>{noticia.data}</span>
                          )}
                        </div>
                      </div>
                      <ExternalLink style={{ width: "12px", height: "12px", color: "#cbd5e1", flexShrink: 0 }} />
                    </div>
                  </a>
                ))}
              </div>
            )}
            </div>

            <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e5ec", background: "#f8faf7", textAlign: "center" }}>
              <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                <a href="https://www.gov.br/mec/pt-br/assuntos/noticias" target="_blank" rel="noopener noreferrer" style={{ fontSize: "10px", color: "#1e40af", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px", padding: "4px 8px", borderRadius: "4px", background: "#dbeafe" }}>
                  <Landmark style={{ width: "10px", height: "10px" }} /> MEC
                </a>
                <a href="https://www.gov.br/fnde/pt-br/assuntos/noticias" target="_blank" rel="noopener noreferrer" style={{ fontSize: "10px", color: "#166534", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px", padding: "4px 8px", borderRadius: "4px", background: "#dcfce7" }}>
                  <BookOpen style={{ width: "10px", height: "10px" }} /> FNDE
                </a>
                <a href="https://www.gov.br/inep/pt-br/assuntos/noticias" target="_blank" rel="noopener noreferrer" style={{ fontSize: "10px", color: "#6b21a8", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px", padding: "4px 8px", borderRadius: "4px", background: "#f3e8ff" }}>
                  <GraduationCap style={{ width: "10px", height: "10px" }} /> INEP
                </a>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: "28px", padding: "20px", background: "white",
          borderRadius: "10px", border: "1px solid #e2e5ec",
        }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 style={{ width: "16px", height: "16px", color: "#16a34a" }} />
            Legenda de Categorias
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {Object.entries(CATEGORIA_CORES).map(([key, val]) => (
              <span
                key={key}
                style={{
                  padding: "4px 10px", borderRadius: "6px",
                  fontSize: "11px", fontWeight: 600,
                  background: val.bg, color: val.text, border: `1px solid ${val.border}`,
                  display: "inline-flex", alignItems: "center", gap: "4px",
                }}
              >
                {val.icon} {key}
              </span>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
