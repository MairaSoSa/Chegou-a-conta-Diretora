import { useState, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, Users, ArrowRight, ArrowLeft,
  MapPin, GraduationCap, Info, ExternalLink,
  School, Loader2, BarChart3, TrendingUp,
  BookOpen, Award, ChevronDown, ChevronUp,
  Globe, Building2, TreePine, Filter, X, Clock, Heart,
  CheckCircle, CircleAlert
} from "lucide-react";
import { useSchoolSearch, useSchool, useEscolaEvolucao, useEstatisticas, useListaEscolas } from "@/hooks/use-schools";
import { usePddeInfo } from "@/hooks/use-pdde";
import { useSigpcLocalizar } from "@/hooks/use-sigpc";
import { DollarSign, Wallet, FileText, AlertTriangle, Landmark, BanknoteIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line
} from "recharts";

const UF_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MG: "Minas Gerais", MS: "Mato Grosso do Sul", MT: "Mato Grosso",
  PA: "Pará", PB: "Paraíba", PE: "Pernambuco", PI: "Piauí", PR: "Paraná",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RO: "Rondônia", RR: "Roraima",
  RS: "Rio Grande do Sul", SC: "Santa Catarina", SE: "Sergipe", SP: "São Paulo", TO: "Tocantins",
};

const CHART_COLORS = ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2", "#b7e4c7"];
const PIE_COLORS = ["#2d6a4f", "#40916c", "#74c69d", "#b7e4c7"];
const EXTRA_COLORS = ["#e76f51", "#264653", "#2a9d8f", "#e9c46a"];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInep, setSelectedInep] = useState<string | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(true);
  const [selectedAno, setSelectedAno] = useState(2024);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"overview" | "search">("overview");
  const [filterUf, setFilterUf] = useState("");
  const [filterDep, setFilterDep] = useState("");
  const [listPage, setListPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = useEstatisticas(selectedAno);
  const { data: searchResults, refetch: refetchSearch, isLoading: searchLoading } = useSchoolSearch(searchQuery);
  const { data: evolucaoData, isLoading: evolucaoLoading } = useEscolaEvolucao(selectedInep || "");
  const { data: pddeData, isLoading: pddeLoading } = usePddeInfo(selectedInep, selectedAno);
  const pddeCnpj = pddeData?.uex?.cnpj || null;
  const { data: sigpcData, isLoading: sigpcLoading } = useSigpcLocalizar(pddeCnpj || undefined);

  const listFilters = useMemo(() => {
    const f: Record<string, string> = {};
    if (filterUf) f.uf = filterUf;
    if (filterDep) f.tp_dependencia = filterDep;
    return f;
  }, [filterUf, filterDep]);

  const { data: listaEscolas, isLoading: listaLoading } = useListaEscolas(selectedAno, listFilters, listPage, 15);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectSchool = (inep: string) => {
    setSelectedInep(inep);
    setShowSearchDropdown(false);
    if (activeTab !== "search") setActiveTab("search");
  };

  const latestAno = useMemo(() => {
    if (!evolucaoData?.anos_disponiveis?.length) return null;
    return Math.max(...evolucaoData.anos_disponiveis);
  }, [evolucaoData]);

  const censoLatest = useMemo(() => {
    if (!evolucaoData || !latestAno) return null;
    return evolucaoData.censo_por_ano?.[latestAno] || null;
  }, [evolucaoData, latestAno]);

  const indicadoresLatest = useMemo(() => {
    if (!evolucaoData || !latestAno) return {};
    const allIndicadores = evolucaoData.indicadores_por_ano || {};
    const anos = evolucaoData.anos_disponiveis || [];
    const merged: Record<string, any> = {};
    const sortedAnos = [...anos].sort((a: number, b: number) => b - a);
    for (const ano of sortedAnos) {
      const yearData = allIndicadores[ano];
      if (!yearData) continue;
      for (const [tipo, dados] of Object.entries(yearData)) {
        if (!merged[tipo]) merged[tipo] = { ...dados as any, _ano: ano };
      }
    }
    return merged;
  }, [evolucaoData, latestAno]);

  const alertasPreocupantes = useMemo(() => {
    const alertas: { tipo: 'critical' | 'warning'; titulo: string; descricao: string; indicador: string }[] = [];
    const ind = indicadoresLatest;

    if (ind.ideb) {
      const vals = [
        { v: ind.ideb.ideb_ai, name: 'Anos Iniciais' },
        { v: ind.ideb.ideb_af, name: 'Anos Finais' },
        { v: ind.ideb.ideb_em, name: 'Ensino Médio' },
      ];
      for (const { v, name } of vals) {
        if (v != null && Number(v) > 0) {
          if (Number(v) < 4.0) {
            alertas.push({ tipo: 'critical', titulo: `IDEB ${name} muito baixo: ${Number(v).toFixed(1)}`, descricao: `O IDEB de ${name} está abaixo de 4,0, o que indica necessidade urgente de ações para melhoria da qualidade do ensino.`, indicador: 'ideb' });
          } else if (Number(v) < 5.0) {
            alertas.push({ tipo: 'warning', titulo: `IDEB ${name} requer atenção: ${Number(v).toFixed(1)}`, descricao: `O IDEB de ${name} está entre 4,0 e 5,0. Recomenda-se acompanhamento e planejamento de ações pedagógicas.`, indicador: 'ideb' });
          }
        }
      }
    }

    if (ind.taxas_rendimento) {
      const abandono = [
        { v: ind.taxas_rendimento.abandono_fund, name: 'Fundamental' },
        { v: ind.taxas_rendimento.abandono_med, name: 'Ensino Médio' },
      ];
      for (const { v, name } of abandono) {
        if (v != null) {
          if (Number(v) > 5) {
            alertas.push({ tipo: 'critical', titulo: `Abandono escolar elevado no ${name}: ${Number(v).toFixed(1)}%`, descricao: `A taxa de abandono acima de 5% exige ações imediatas de busca ativa e acolhimento dos alunos.`, indicador: 'taxas_rendimento' });
          } else if (Number(v) > 2) {
            alertas.push({ tipo: 'warning', titulo: `Abandono escolar no ${name}: ${Number(v).toFixed(1)}%`, descricao: `A taxa de abandono entre 2% e 5% merece atenção. Identifique os alunos em risco e implemente estratégias de permanência.`, indicador: 'taxas_rendimento' });
          }
        }
      }
      const reprov = [
        { v: ind.taxas_rendimento.reprovacao_fund, name: 'Fundamental' },
        { v: ind.taxas_rendimento.reprovacao_med, name: 'Ensino Médio' },
      ];
      for (const { v, name } of reprov) {
        if (v != null) {
          if (Number(v) > 20) {
            alertas.push({ tipo: 'critical', titulo: `Reprovação alta no ${name}: ${Number(v).toFixed(1)}%`, descricao: `Taxa de reprovação acima de 20% indica necessidade urgente de revisão das práticas pedagógicas e avaliativas.`, indicador: 'taxas_rendimento' });
          } else if (Number(v) > 10) {
            alertas.push({ tipo: 'warning', titulo: `Reprovação no ${name}: ${Number(v).toFixed(1)}%`, descricao: `Taxa de reprovação entre 10% e 20%. Avalie as causas e considere reforço escolar e acompanhamento individualizado.`, indicador: 'taxas_rendimento' });
          }
        }
      }
    }

    if (ind.tdi) {
      const tdiVals = [
        { v: ind.tdi.fundamental_total, name: 'Fundamental' },
        { v: ind.tdi.medio_total, name: 'Ensino Médio' },
      ];
      for (const { v, name } of tdiVals) {
        if (v != null) {
          if (Number(v) > 30) {
            alertas.push({ tipo: 'critical', titulo: `Distorção idade-série alta no ${name}: ${Number(v).toFixed(1)}%`, descricao: `Mais de 30% dos alunos estão com idade acima da esperada para a série. Considere programas de correção de fluxo.`, indicador: 'tdi' });
          } else if (Number(v) > 20) {
            alertas.push({ tipo: 'warning', titulo: `Distorção idade-série no ${name}: ${Number(v).toFixed(1)}%`, descricao: `Entre 20% e 30% dos alunos estão com defasagem. Monitore e planeje intervenções pedagógicas.`, indicador: 'tdi' });
          }
        }
      }
    }

    if (ind.dsu) {
      const dsuVals = [
        { v: ind.dsu.percentual_fund, name: 'Fundamental' },
        { v: ind.dsu.percentual_med, name: 'Ensino Médio' },
      ];
      for (const { v, name } of dsuVals) {
        if (v != null && Number(v) > 0) {
          if (Number(v) < 60) {
            alertas.push({ tipo: 'critical', titulo: `Poucos docentes com curso superior no ${name}: ${Number(v).toFixed(1)}%`, descricao: `Menos de 60% dos docentes possuem formação superior. Isso impacta diretamente a qualidade do ensino.`, indicador: 'dsu' });
          } else if (Number(v) < 80) {
            alertas.push({ tipo: 'warning', titulo: `Formação docente no ${name}: ${Number(v).toFixed(1)}%`, descricao: `Entre 60% e 80% dos docentes têm curso superior. Incentive a formação continuada.`, indicador: 'dsu' });
          }
        }
      }
    }

    if (ind.had) {
      const hadVals = [
        { v: ind.had.media_fund, name: 'Fundamental' },
        { v: ind.had.media_med, name: 'Ensino Médio' },
      ];
      for (const { v, name } of hadVals) {
        if (v != null && Number(v) > 0 && Number(v) < 4) {
          alertas.push({ tipo: 'warning', titulo: `Carga horária baixa no ${name}: ${Number(v).toFixed(1)}h/dia`, descricao: `A média de horas-aula diária está abaixo de 4 horas. Considere ampliar a jornada escolar.`, indicador: 'had' });
        }
      }
    }

    if (ind.atu) {
      const atuVals = [
        { v: ind.atu.media_fund, name: 'Fundamental' },
        { v: ind.atu.media_med, name: 'Ensino Médio' },
      ];
      for (const { v, name } of atuVals) {
        if (v != null && Number(v) > 35) {
          alertas.push({ tipo: 'warning', titulo: `Turmas superlotadas no ${name}: ${Number(v).toFixed(1)} alunos/turma`, descricao: `A média de alunos por turma acima de 35 prejudica a qualidade do atendimento pedagógico.`, indicador: 'atu' });
        }
      }
    }

    if (ind.icg) {
      const nivel = Number(ind.icg.nivel);
      if (nivel === 5 || nivel === 6) {
        alertas.push({ tipo: 'warning', titulo: `Alta complexidade de gestão: Nível ${nivel}`, descricao: `A escola possui nível elevado de complexidade de gestão, o que demanda maior suporte administrativo e pedagógico.`, indicador: 'icg' });
      }
    }

    if (ind.ird) {
      const media = Number(ind.ird.media_ird ?? ind.ird.media);
      if (media > 0 && media < 2.0) {
        alertas.push({ tipo: 'warning', titulo: `Baixa regularidade docente: ${media.toFixed(2)}`, descricao: `O índice de regularidade do corpo docente está abaixo de 2,0, indicando alta rotatividade de professores.`, indicador: 'ird' });
      }
    }

    if (ind.afd) {
      const funCat1 = Number(ind.afd.fun_cat_1);
      if (funCat1 > 0 && funCat1 < 50) {
        alertas.push({ tipo: 'warning', titulo: `Adequação da formação docente baixa: ${funCat1.toFixed(1)}%`, descricao: `Menos de 50% dos docentes do Fundamental possuem formação adequada (Grupo 1). Isso afeta a qualidade do ensino.`, indicador: 'afd' });
      }
    }

    if (ind.ied) {
      const n5 = Number(ind.ied.nivel_5 || 0);
      const n6 = Number(ind.ied.nivel_6 || 0);
      if ((n5 + n6) > 50) {
        alertas.push({ tipo: 'warning', titulo: `Alto esforço docente: ${(n5 + n6).toFixed(1)}% nos níveis 5 e 6`, descricao: `Mais da metade dos docentes atuam com sobrecarga (múltiplas escolas e turnos). Isso pode impactar a qualidade do trabalho pedagógico.`, indicador: 'ied' });
      }
    }

    return alertas;
  }, [indicadoresLatest]);

  const evolutionCharts = useMemo(() => {
    if (!evolucaoData) return null;
    const anos = evolucaoData.anos_disponiveis;
    const censo = evolucaoData.censo_por_ano;
    const indicadores = evolucaoData.indicadores_por_ano;

    return {
      matriculas: anos.map((a: number) => ({ ano: a, value: censo[a]?.qt_mat_bas || 0 })),
      docentes: anos.map((a: number) => ({ ano: a, value: censo[a]?.qt_doc_bas || censo[a]?.qt_docentes || 0 })),
      turmas: anos.map((a: number) => ({ ano: a, value: censo[a]?.qt_tur_bas || censo[a]?.qt_turmas || 0 })),
      taxasRendimento: anos.map((a: number) => {
        const tr = indicadores[a]?.taxas_rendimento;
        if (!tr) return { ano: a };
        return {
          ano: a,
          aprovacao: tr.aprovacao_fund ?? tr.aprovacao_total ?? null,
          reprovacao: tr.reprovacao_fund ?? tr.reprovacao_total ?? null,
          abandono: tr.abandono_fund ?? tr.abandono_total ?? null,
        };
      }),
      tdi: anos.map((a: number) => {
        const t = indicadores[a]?.tdi;
        if (!t) return { ano: a };
        return {
          ano: a,
          fund_total: t.fundamental_total ?? null,
          fund_af: t.fundamental_af ?? null,
          medio: t.medio_total ?? null,
        };
      }),
      atu: anos.map((a: number) => {
        const at = indicadores[a]?.atu;
        if (!at) return { ano: a };
        return {
          ano: a,
          fund: at.media_fund ?? null,
          fund_ai: at.media_fund_ai ?? null,
          fund_af: at.media_fund_af ?? null,
          medio: at.media_med ?? null,
        };
      }),
      had: anos.map((a: number) => {
        const h = indicadores[a]?.had;
        if (!h) return { ano: a };
        return {
          ano: a,
          fund: h.media_fund ?? null,
          fund_ai: h.media_fund_ai ?? null,
          fund_af: h.media_fund_af ?? null,
          medio: h.media_med ?? null,
        };
      }),
      dsu: anos.map((a: number) => {
        const d = indicadores[a]?.dsu;
        if (!d) return { ano: a };
        return {
          ano: a,
          fund: d.percentual_fund ?? null,
          fund_ai: d.percentual_fund_ai ?? null,
          fund_af: d.percentual_fund_af ?? null,
          medio: d.percentual_med ?? null,
        };
      }),
      icg: anos.map((a: number) => {
        const ic = indicadores[a]?.icg;
        if (!ic) return { ano: a };
        return { ano: a, nivel: ic.nivel ?? null };
      }),
      ird: anos.map((a: number) => {
        const ir = indicadores[a]?.ird;
        if (!ir) return { ano: a };
        return { ano: a, media: ir.media_ird ?? ir.media ?? null };
      }),
      ideb: anos.map((a: number) => {
        const id = indicadores[a]?.ideb;
        if (!id) return { ano: a };
        return {
          ano: a,
          ideb_ai: id.ideb_ai ?? id.ideb ?? null,
          ideb_af: id.ideb_af ?? null,
          ideb_em: id.ideb_em ?? null,
        };
      }),
      inse: anos.map((a: number) => {
        const ins = indicadores[a]?.inse;
        if (!ins) return { ano: a };
        return { ano: a, media: ins.media_inse ?? ins.valor ?? null };
      }),
      saeb: anos.map((a: number) => {
        const s = indicadores[a]?.saeb;
        if (!s) return { ano: a };
        return { ano: a, mt_ai: s.nota_mt_ai ?? null, lp_ai: s.nota_lp_ai ?? null, mt_af: s.nota_mt_af ?? null, lp_af: s.nota_lp_af ?? null, mt_em: s.nota_mt_em ?? null, lp_em: s.nota_lp_em ?? null };
      }),
      ied: anos.map((a: number) => {
        const ie = indicadores[a]?.ied;
        if (!ie) return { ano: a };
        return { ano: a, nivel_1: ie.nivel_1 ?? null, nivel_2: ie.nivel_2 ?? null, nivel_3: ie.nivel_3 ?? null, nivel_4: ie.nivel_4 ?? null, nivel_5: ie.nivel_5 ?? null, nivel_6: ie.nivel_6 ?? null };
      }),
      tnr: anos.map((a: number) => {
        const t = indicadores[a]?.taxa_nao_resposta;
        if (!t) return { ano: a };
        return { ano: a, fund: t.taxa_nao_resposta_fund ?? t.tnr_fund ?? null, med: t.taxa_nao_resposta_med ?? t.tnr_med ?? null };
      }),
    };
  }, [evolucaoData]);

  const ufChartData = useMemo(() => {
    if (!stats?.por_uf) return [];
    return Object.entries(stats.por_uf)
      .map(([uf, count]) => ({ uf, name: UF_NAMES[uf] || uf, escolas: count as number }))
      .sort((a, b) => b.escolas - a.escolas);
  }, [stats]);

  const depChartData = useMemo(() => {
    if (!stats?.por_dependencia) return [];
    return Object.entries(stats.por_dependencia)
      .map(([name, value]) => ({ name, value: value as number }));
  }, [stats]);

  const locChartData = useMemo(() => {
    if (!stats?.por_localizacao) return [];
    return Object.entries(stats.por_localizacao)
      .map(([name, value]) => ({ name, value: value as number }));
  }, [stats]);

  const sitChartData = useMemo(() => {
    if (!stats?.por_situacao) return [];
    return Object.entries(stats.por_situacao)
      .map(([name, value]) => ({ name, value: value as number }));
  }, [stats]);

  const formatNumber = (n: number) => n?.toLocaleString("pt-BR") || "0";

  const hasMultipleYears = (evolucaoData?.anos_disponiveis?.length || 0) > 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel de Dados Educacionais</h1>
            <p className="text-sm text-muted-foreground mt-1">Censo Escolar {selectedAno} - Fonte: INEP/MEC</p>
          </div>
          {activeTab === "overview" && (
            <div className="flex items-center gap-2">
              <select
                value={selectedAno}
                onChange={(e) => setSelectedAno(Number(e.target.value))}
                className="text-sm bg-background border border-border/50 rounded-lg px-3 py-2"
              >
                {[2024, 2023, 2022, 2021, 2020].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2 border-b border-border/30 pb-1">
          {[
            { key: "overview" as const, label: "Visão Geral", icon: BarChart3 },
            { key: "search" as const, label: "Buscar Escolas", icon: Search },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                activeTab === tab.key
                  ? "bg-accent/10 text-accent border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {statsLoading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-3" />
                <p className="text-muted-foreground">Carregando estatísticas...</p>
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={<School className="w-6 h-6 text-accent" />}
                    value={formatNumber(stats.total_escolas)}
                    label="Escolas"
                    color="bg-accent/10"
                  />
                  <StatCard
                    icon={<Users className="w-6 h-6 text-accent" />}
                    value={formatNumber(stats.total_matriculas)}
                    label="Matrículas"
                    color="bg-accent/10"
                  />
                  <StatCard
                    icon={<GraduationCap className="w-6 h-6 text-purple-600" />}
                    value={formatNumber(stats.total_docentes)}
                    label="Docentes"
                    color="bg-purple-600/10"
                  />
                  <StatCard
                    icon={<BookOpen className="w-6 h-6 text-orange-600" />}
                    value={Object.keys(stats.por_uf || {}).length.toString()}
                    label="Estados"
                    color="bg-orange-600/10"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card className="card-clay lg:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Globe className="w-4 h-4 text-accent" />
                        Escolas por Estado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={360}>
                        <BarChart data={ufChartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="uf" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={50} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                          <Tooltip
                            formatter={(value: number) => [formatNumber(value), "Escolas"]}
                            labelFormatter={(label) => UF_NAMES[label] || label}
                            contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                          />
                          <Bar dataKey="escolas" fill="#2d6a4f" radius={[4, 4, 0, 0]} cursor="pointer"
                            onClick={(data) => {
                              setFilterUf(data.uf);
                              setFilterDep("");
                              setListPage(1);
                              setActiveTab("search");
                            }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card className="card-clay">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-accent" />
                          Por Rede
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie data={depChartData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                              outerRadius={60} innerRadius={30} paddingAngle={2}>
                              {depChartData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: number) => formatNumber(v)} contentStyle={{ borderRadius: "12px" }} />
                            <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="card-clay">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TreePine className="w-4 h-4 text-accent" />
                          Localização
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {locChartData.map((item, i) => {
                            const pct = stats.total_escolas > 0 ? ((item.value / stats.total_escolas) * 100).toFixed(1) : "0";
                            return (
                              <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-muted-foreground">{formatNumber(item.value)} ({pct}%)</span>
                                </div>
                                <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Card className="card-clay">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="w-4 h-4 text-accent" />
                      Situação das Escolas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {sitChartData.map((item, i) => {
                        const pct = stats.total_escolas > 0 ? ((item.value / stats.total_escolas) * 100).toFixed(1) : "0";
                        const colors = ["text-green-700 bg-green-50 border-green-200", "text-amber-700 bg-amber-50 border-amber-200", "text-red-700 bg-red-50 border-red-200"];
                        return (
                          <div key={i} className={`p-4 rounded-xl border ${colors[i] || colors[0]}`}>
                            <p className="text-2xl font-bold">{formatNumber(item.value)}</p>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs mt-1 opacity-70">{pct}% do total</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-clay">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="w-4 h-4 text-accent" />
                      Ranking por Estado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {ufChartData.map((item, i) => (
                        <button
                          key={item.uf}
                          onClick={() => {
                            setFilterUf(item.uf);
                            setFilterDep("");
                            setListPage(1);
                            setActiveTab("search");
                          }}
                          className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 hover:bg-accent/10 border border-transparent hover:border-accent/30 transition-all text-left group"
                        >
                          <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold group-hover:text-accent transition-colors">{item.uf}</p>
                            <p className="text-xs text-muted-foreground truncate">{formatNumber(item.escolas)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        )}

        {activeTab === "search" && (
          <div className="space-y-4">
            <Card className="card-clay">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Busque por nome ou código INEP..."
                      className="pl-10 bg-background border-border/50 h-11 rounded-xl"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (searchQuery.length === 8 && /^\d+$/.test(searchQuery)) {
                            selectSchool(searchQuery);
                          } else {
                            refetchSearch();
                          }
                        }
                      }}
                    />
                    {showSearchDropdown && searchResults && searchResults.dados && searchResults.dados.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto">
                        {searchResults.dados.map((result: any) => (
                          <button
                            key={result.co_entidade}
                            className="w-full text-left px-4 py-3 hover:bg-accent/5 border-b border-border/20 last:border-0 transition-colors flex justify-between items-center group"
                            onClick={() => {
                              selectSchool(String(result.co_entidade));
                              setSearchQuery(result.no_entidade);
                            }}
                          >
                            <div>
                              <p className="font-semibold text-sm group-hover:text-accent">{result.no_entidade}</p>
                              <p className="text-xs text-muted-foreground">{result.co_entidade} - {result.no_municipio}/{result.sg_uf} - {result.ds_dependencia}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    className="h-11 rounded-xl"
                    disabled={searchLoading}
                    onClick={() => {
                      if (searchQuery.length === 8 && /^\d+$/.test(searchQuery)) {
                        selectSchool(searchQuery);
                      } else {
                        refetchSearch();
                      }
                    }}
                  >
                    {searchLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                    Buscar
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={filterUf}
                    onChange={(e) => { setFilterUf(e.target.value); setListPage(1); }}
                    className="text-sm bg-background border border-border/50 rounded-lg px-2 py-1.5"
                  >
                    <option value="">Todos os estados</option>
                    {Object.entries(UF_NAMES).sort(([a], [b]) => a.localeCompare(b)).map(([uf, name]) => (
                      <option key={uf} value={uf}>{uf} - {name}</option>
                    ))}
                  </select>
                  <select
                    value={filterDep}
                    onChange={(e) => { setFilterDep(e.target.value); setListPage(1); }}
                    className="text-sm bg-background border border-border/50 rounded-lg px-2 py-1.5"
                  >
                    <option value="">Todas as redes</option>
                    <option value="1">Federal</option>
                    <option value="2">Estadual</option>
                    <option value="3">Municipal</option>
                    <option value="4">Privada</option>
                  </select>
                  {(filterUf || filterDep) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setFilterUf(""); setFilterDep(""); setListPage(1); }}
                      className="text-xs text-muted-foreground"
                    >
                      <X className="w-3 h-3 mr-1" /> Limpar filtros
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {selectedInep && (
              <>
            {evolucaoLoading ? (
              <Card className="card-clay">
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-3" />
                  <p className="text-muted-foreground">Carregando dados da escola...</p>
                </CardContent>
              </Card>
            ) : evolucaoData && censoLatest ? (
              <>
                <Card className="card-clay border-l-4 border-l-accent">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedInep(null)}
                        className="shrink-0 text-muted-foreground hover:text-foreground -ml-1 -mt-1"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-foreground">{evolucaoData.escola.no_entidade}</h2>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {evolucaoData.escola.no_municipio}/{evolucaoData.escola.sg_uf}
                        </p>
                        {censoLatest.ds_endereco && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {censoLatest.ds_endereco}{censoLatest.ds_numero ? `, ${censoLatest.ds_numero}` : ""}{censoLatest.ds_complemento ? `, ${censoLatest.ds_complemento}` : ""}{censoLatest.no_bairro ? `, ${censoLatest.no_bairro}` : ""}{censoLatest.co_cep ? `. ${censoLatest.co_cep.toString().replace(/(\d{5})(\d{3})/, "$1-$2")}` : ""} - {evolucaoData.escola.no_municipio}/{evolucaoData.escola.sg_uf}
                          </p>
                        )}
                        {censoLatest.telefone && (
                          <p className="text-xs text-muted-foreground mt-0.5">Tel: {censoLatest.telefone}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Anos disponíveis: {evolucaoData.anos_disponiveis.join(", ")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-accent/10 text-accent border-0 font-mono">{selectedInep}</Badge>
                        <Badge variant="outline">{evolucaoData.escola.ds_dependencia}</Badge>
                        <Badge variant="outline">{evolucaoData.escola.ds_localizacao}</Badge>
                        <Badge variant="outline">{evolucaoData.escola.ds_situacao}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatCard
                    icon={<Users className="w-3.5 h-3.5 text-accent" />}
                    value={formatNumber(censoLatest.qt_mat_bas || 0)}
                    label={`Matrículas ${latestAno}`}
                    color="bg-accent/10"
                  />
                  <StatCard
                    icon={<GraduationCap className="w-3.5 h-3.5 text-accent" />}
                    value={formatNumber(censoLatest.qt_doc_bas || censoLatest.qt_docentes || 0)}
                    label={`Docentes ${latestAno}`}
                    color="bg-accent/10"
                  />
                  <StatCard
                    icon={<BookOpen className="w-3.5 h-3.5 text-purple-600" />}
                    value={formatNumber(censoLatest.qt_tur_bas || censoLatest.qt_turmas || 0)}
                    label={`Turmas ${latestAno}`}
                    color="bg-purple-600/10"
                  />
                  <StatCard
                    icon={<School className="w-3.5 h-3.5 text-orange-600" />}
                    value={formatNumber(censoLatest.qt_salas_utilizadas || 0)}
                    label={`Salas ${latestAno}`}
                    color="bg-orange-600/10"
                  />
                </div>

                {(() => {
                  const criticals = alertasPreocupantes.filter(a => a.tipo === 'critical');
                  const warnings = alertasPreocupantes.filter(a => a.tipo === 'warning');
                  const total = alertasPreocupantes.length;
                  const borderColor = criticals.length > 0 ? 'border-l-red-500' : warnings.length > 0 ? 'border-l-amber-400' : 'border-l-green-500';

                  return (
                    <Card className={`card-clay border-l-4 ${borderColor}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className={`w-5 h-5 ${criticals.length > 0 ? 'text-red-500' : warnings.length > 0 ? 'text-amber-500' : 'text-green-500'}`} />
                          Análise dos Dados
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {total > 0 ? `${total} ponto${total > 1 ? 's' : ''} de atenção identificado${total > 1 ? 's' : ''}` : 'Nenhum ponto de atenção identificado'}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {total === 0 ? (
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                            <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                            <div>
                              <p className="font-semibold text-green-800">Parabéns!</p>
                              <p className="text-sm text-green-700">Os indicadores da escola estão dentro das faixas esperadas. Continue o bom trabalho!</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            {criticals.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Pontos Críticos</p>
                                <div className="space-y-2">
                                  {criticals.map((alerta, i) => (
                                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-100">
                                      <CircleAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                      <div>
                                        <p className="text-sm font-semibold text-red-800">{alerta.titulo}</p>
                                        <p className="text-xs text-red-700 mt-0.5 leading-snug">{alerta.descricao}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {warnings.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Pontos de Atenção</p>
                                <div className="space-y-2">
                                  {warnings.map((alerta, i) => (
                                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-100">
                                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                      <div>
                                        <p className="text-sm font-semibold text-amber-800">{alerta.titulo}</p>
                                        <p className="text-xs text-amber-700 mt-0.5 leading-snug">{alerta.descricao}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}

                <Card className="card-clay border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Evolução ao Longo dos Anos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!hasMultipleYears ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                          Dados disponíveis apenas para {latestAno}. Quando houver mais anos importados, gráficos de evolução aparecerão aqui.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {evolutionCharts && (
                            <>
                              <EvolutionChart
                                title="Matrículas"
                                data={evolutionCharts.matriculas}
                                lines={[{ key: "value", color: CHART_COLORS[0], name: "Matrículas" }]}
                                icon={<Users className="w-4 h-4 text-accent" />}
                              />
                              <EvolutionChart
                                title="Docentes"
                                data={evolutionCharts.docentes}
                                lines={[{ key: "value", color: CHART_COLORS[1], name: "Docentes" }]}
                                icon={<GraduationCap className="w-4 h-4 text-accent" />}
                              />
                              <EvolutionChart
                                title="Taxas de Rendimento (%)"
                                data={evolutionCharts.taxasRendimento}
                                lines={[
                                  { key: "aprovacao", color: CHART_COLORS[0], name: "Aprovação" },
                                  { key: "reprovacao", color: EXTRA_COLORS[0], name: "Reprovação" },
                                  { key: "abandono", color: EXTRA_COLORS[1], name: "Abandono" },
                                ]}
                                icon={<TrendingUp className="w-4 h-4 text-green-600" />}
                              />
                              <EvolutionChart
                                title="ATU - Alunos por Turma"
                                data={evolutionCharts.atu}
                                lines={[
                                  { key: "fund", color: CHART_COLORS[0], name: "Fund. Total" },
                                  { key: "fund_af", color: CHART_COLORS[1], name: "Fund. AF" },
                                  { key: "medio", color: EXTRA_COLORS[2], name: "Médio" },
                                ]}
                                icon={<Users className="w-4 h-4 text-indigo-600" />}
                              />
                              <EvolutionChart
                                title="HAD - Horas-Aula Diária"
                                data={evolutionCharts.had}
                                lines={[
                                  { key: "fund", color: CHART_COLORS[0], name: "Fund. Total" },
                                  { key: "fund_af", color: CHART_COLORS[1], name: "Fund. AF" },
                                  { key: "medio", color: EXTRA_COLORS[2], name: "Médio" },
                                ]}
                                icon={<Clock className="w-4 h-4 text-cyan-600" />}
                              />
                              <EvolutionChart
                                title="DSU - Docentes com Superior (%)"
                                data={evolutionCharts.dsu}
                                lines={[
                                  { key: "fund", color: CHART_COLORS[0], name: "Fund. Total" },
                                  { key: "fund_af", color: CHART_COLORS[1], name: "Fund. AF" },
                                  { key: "medio", color: EXTRA_COLORS[2], name: "Médio" },
                                ]}
                                icon={<GraduationCap className="w-4 h-4 text-emerald-600" />}
                              />
                              <EvolutionChart
                                title="TDI - Distorção Idade-Série (%)"
                                data={evolutionCharts.tdi}
                                lines={[
                                  { key: "fund_total", color: CHART_COLORS[0], name: "Fund. Total" },
                                  { key: "fund_af", color: CHART_COLORS[1], name: "Fund. AF" },
                                  { key: "medio", color: EXTRA_COLORS[2], name: "Médio" },
                                ]}
                                icon={<BarChart3 className="w-4 h-4 text-orange-600" />}
                              />
                              <EvolutionChart
                                title="ICG - Complexidade de Gestão"
                                data={evolutionCharts.icg}
                                lines={[{ key: "nivel", color: CHART_COLORS[0], name: "Nível" }]}
                                icon={<BarChart3 className="w-4 h-4 text-accent" />}
                              />
                              <EvolutionChart
                                title="IRD - Regularidade do Docente"
                                data={evolutionCharts.ird}
                                lines={[{ key: "media", color: CHART_COLORS[2], name: "Média IRD" }]}
                                icon={<BarChart3 className="w-4 h-4 text-teal-600" />}
                              />
                              <EvolutionChart
                                title="IDEB"
                                data={evolutionCharts.ideb}
                                lines={[
                                  { key: "ideb_ai", color: CHART_COLORS[0], name: "Anos Iniciais" },
                                  { key: "ideb_af", color: CHART_COLORS[1], name: "Anos Finais" },
                                  { key: "ideb_em", color: EXTRA_COLORS[2], name: "Ensino Médio" },
                                ]}
                                icon={<Award className="w-4 h-4 text-amber-600" />}
                              />
                              <EvolutionChart
                                title="INSE - Nível Socioeconômico"
                                data={evolutionCharts.inse}
                                lines={[{ key: "media", color: CHART_COLORS[3], name: "Média INSE" }]}
                                icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
                              />
                              <EvolutionChart
                                title="SAEB - Proficiência"
                                data={evolutionCharts.saeb}
                                lines={[
                                  { key: "mt_ai", color: CHART_COLORS[0], name: "Mat. AI" },
                                  { key: "lp_ai", color: CHART_COLORS[1], name: "Port. AI" },
                                  { key: "mt_af", color: CHART_COLORS[2], name: "Mat. AF" },
                                  { key: "lp_af", color: CHART_COLORS[3], name: "Port. AF" },
                                  { key: "mt_em", color: EXTRA_COLORS[0], name: "Mat. EM" },
                                  { key: "lp_em", color: EXTRA_COLORS[1], name: "Port. EM" },
                                ]}
                                icon={<Award className="w-4 h-4 text-blue-600" />}
                              />
                              <EvolutionChart
                                title="IED - Esforço Docente (%)"
                                data={evolutionCharts.ied}
                                lines={[
                                  { key: "nivel_1", color: CHART_COLORS[0], name: "Nível 1" },
                                  { key: "nivel_2", color: CHART_COLORS[1], name: "Nível 2" },
                                  { key: "nivel_3", color: CHART_COLORS[2], name: "Nível 3" },
                                  { key: "nivel_4", color: CHART_COLORS[3], name: "Nível 4" },
                                  { key: "nivel_5", color: EXTRA_COLORS[0], name: "Nível 5" },
                                  { key: "nivel_6", color: EXTRA_COLORS[1], name: "Nível 6" },
                                ]}
                                icon={<GraduationCap className="w-4 h-4 text-pink-600" />}
                              />
                              <EvolutionChart
                                title="Taxa de Não-Resposta"
                                data={evolutionCharts.tnr}
                                lines={[
                                  { key: "fund", color: CHART_COLORS[0], name: "Fundamental" },
                                  { key: "med", color: EXTRA_COLORS[2], name: "Médio" },
                                ]}
                                icon={<BarChart3 className="w-4 h-4 text-yellow-600" />}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {evolutionCharts && (
                          <>
                            <EvolutionChart
                              title="Matrículas"
                              data={evolutionCharts.matriculas}
                              lines={[{ key: "value", color: CHART_COLORS[0], name: "Matrículas" }]}
                              icon={<Users className="w-4 h-4 text-accent" />}
                            />
                            <EvolutionChart
                              title="Docentes"
                              data={evolutionCharts.docentes}
                              lines={[{ key: "value", color: CHART_COLORS[1], name: "Docentes" }]}
                              icon={<GraduationCap className="w-4 h-4 text-accent" />}
                            />
                            <EvolutionChart
                              title="Taxas de Rendimento (%)"
                              data={evolutionCharts.taxasRendimento}
                              lines={[
                                { key: "aprovacao", color: CHART_COLORS[0], name: "Aprovação" },
                                { key: "reprovacao", color: EXTRA_COLORS[0], name: "Reprovação" },
                                { key: "abandono", color: EXTRA_COLORS[1], name: "Abandono" },
                              ]}
                              icon={<TrendingUp className="w-4 h-4 text-green-600" />}
                            />
                            <EvolutionChart
                              title="TDI - Distorção Idade-Série (%)"
                              data={evolutionCharts.tdi}
                              lines={[
                                { key: "fund_total", color: CHART_COLORS[0], name: "Fund. Total" },
                                { key: "fund_af", color: CHART_COLORS[1], name: "Fund. AF" },
                                { key: "medio", color: EXTRA_COLORS[2], name: "Médio" },
                              ]}
                              icon={<BarChart3 className="w-4 h-4 text-orange-600" />}
                            />
                            <EvolutionChart
                              title="ATU - Alunos por Turma"
                              data={evolutionCharts.atu}
                              lines={[
                                { key: "fund", color: CHART_COLORS[0], name: "Fund. Total" },
                                { key: "fund_ai", color: CHART_COLORS[1], name: "Fund. AI" },
                                { key: "fund_af", color: CHART_COLORS[2], name: "Fund. AF" },
                                { key: "medio", color: EXTRA_COLORS[2], name: "Médio" },
                              ]}
                              icon={<Users className="w-4 h-4 text-indigo-600" />}
                            />
                            <EvolutionChart
                              title="HAD - Horas-Aula Diária"
                              data={evolutionCharts.had}
                              lines={[
                                { key: "fund", color: CHART_COLORS[0], name: "Fund. Total" },
                                { key: "fund_ai", color: CHART_COLORS[1], name: "Fund. AI" },
                                { key: "fund_af", color: CHART_COLORS[2], name: "Fund. AF" },
                                { key: "medio", color: EXTRA_COLORS[2], name: "Médio" },
                              ]}
                              icon={<Clock className="w-4 h-4 text-cyan-600" />}
                            />
                            <EvolutionChart
                              title="DSU - Docentes com Superior (%)"
                              data={evolutionCharts.dsu}
                              lines={[
                                { key: "fund", color: CHART_COLORS[0], name: "Fund. Total" },
                                { key: "fund_ai", color: CHART_COLORS[1], name: "Fund. AI" },
                                { key: "fund_af", color: CHART_COLORS[2], name: "Fund. AF" },
                                { key: "medio", color: EXTRA_COLORS[2], name: "Médio" },
                              ]}
                              icon={<GraduationCap className="w-4 h-4 text-emerald-600" />}
                            />
                            <EvolutionChart
                              title="ICG - Complexidade de Gestão"
                              data={evolutionCharts.icg}
                              lines={[{ key: "nivel", color: CHART_COLORS[0], name: "Nível" }]}
                              icon={<BarChart3 className="w-4 h-4 text-accent" />}
                            />
                            <EvolutionChart
                              title="IRD - Regularidade do Docente"
                              data={evolutionCharts.ird}
                              lines={[{ key: "media", color: CHART_COLORS[2], name: "Média IRD" }]}
                              icon={<BarChart3 className="w-4 h-4 text-teal-600" />}
                            />
                            <EvolutionChart
                              title="IDEB"
                              data={evolutionCharts.ideb}
                              lines={[
                                { key: "ideb_ai", color: CHART_COLORS[0], name: "Anos Iniciais" },
                                { key: "ideb_af", color: CHART_COLORS[1], name: "Anos Finais" },
                                { key: "ideb_em", color: EXTRA_COLORS[2], name: "Ensino Médio" },
                              ]}
                              icon={<Award className="w-4 h-4 text-amber-600" />}
                            />
                            <EvolutionChart
                              title="INSE - Nível Socioeconômico"
                              data={evolutionCharts.inse}
                              lines={[{ key: "media", color: CHART_COLORS[3], name: "Média INSE" }]}
                              icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
                            />
                            <EvolutionChart
                              title="SAEB - Proficiência"
                              data={evolutionCharts.saeb}
                              lines={[
                                { key: "mt_ai", color: CHART_COLORS[0], name: "Mat. AI" },
                                { key: "lp_ai", color: CHART_COLORS[1], name: "Port. AI" },
                                { key: "mt_af", color: CHART_COLORS[2], name: "Mat. AF" },
                                { key: "lp_af", color: CHART_COLORS[3], name: "Port. AF" },
                                { key: "mt_em", color: EXTRA_COLORS[0], name: "Mat. EM" },
                                { key: "lp_em", color: EXTRA_COLORS[1], name: "Port. EM" },
                              ]}
                              icon={<Award className="w-4 h-4 text-blue-600" />}
                            />
                            <EvolutionChart
                              title="IED - Esforço Docente (%)"
                              data={evolutionCharts.ied}
                              lines={[
                                { key: "nivel_1", color: CHART_COLORS[0], name: "Nível 1" },
                                { key: "nivel_2", color: CHART_COLORS[1], name: "Nível 2" },
                                { key: "nivel_3", color: CHART_COLORS[2], name: "Nível 3" },
                                { key: "nivel_4", color: CHART_COLORS[3], name: "Nível 4" },
                                { key: "nivel_5", color: EXTRA_COLORS[0], name: "Nível 5" },
                                { key: "nivel_6", color: EXTRA_COLORS[1], name: "Nível 6" },
                              ]}
                              icon={<GraduationCap className="w-4 h-4 text-pink-600" />}
                            />
                            <EvolutionChart
                              title="Taxa de Não-Resposta"
                              data={evolutionCharts.tnr}
                              lines={[
                                { key: "fund", color: CHART_COLORS[0], name: "Fundamental" },
                                { key: "med", color: EXTRA_COLORS[2], name: "Médio" },
                              ]}
                              icon={<BarChart3 className="w-4 h-4 text-yellow-600" />}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {(() => {
                  type DiagStatus = 'bom' | 'adequado' | 'atencao' | 'critico' | 'sem_dados' | 'info';
                  type Diagnosis = { status: DiagStatus; valor: string; label: string; explicacao: string; secundarios?: string[] };

                  const statusConfig: Record<DiagStatus, { dot: string; bg: string; label: string }> = {
                    bom: { dot: 'bg-green-500', bg: 'bg-green-100 text-green-700', label: 'Bom' },
                    adequado: { dot: 'bg-blue-500', bg: 'bg-blue-100 text-blue-700', label: 'Adequado' },
                    atencao: { dot: 'bg-amber-500', bg: 'bg-amber-100 text-amber-700', label: 'Atenção' },
                    critico: { dot: 'bg-red-500', bg: 'bg-red-100 text-red-700', label: 'Crítico' },
                    sem_dados: { dot: 'bg-gray-400', bg: 'bg-gray-100 text-gray-600', label: 'Sem dados' },
                    info: { dot: 'bg-blue-500', bg: 'bg-blue-100 text-blue-700', label: 'Info' },
                  };

                  const fmtNum = (v: any, decimals = 1) => v != null ? Number(v).toFixed(decimals) : null;

                  const worstStatus = (...statuses: DiagStatus[]): DiagStatus => {
                    const order: DiagStatus[] = ['critico', 'atencao', 'adequado', 'bom', 'info', 'sem_dados'];
                    for (const s of order) { if (statuses.includes(s)) return s; }
                    return 'sem_dados';
                  };

                  const getDiagnosis = (tipo: string, data: any): Diagnosis | null => {
                    if (!data) return null;

                    switch (tipo) {
                      case 'ideb': {
                        const vals = [
                          { v: data.ideb_ai, n: 'AI' },
                          { v: data.ideb_af, n: 'AF' },
                          { v: data.ideb_em, n: 'EM' },
                        ].filter(x => x.v != null && Number(x.v) > 0);
                        if (vals.length === 0) return null;
                        const worst = Math.min(...vals.map(x => Number(x.v)));
                        const status: DiagStatus = worst >= 6 ? 'bom' : worst >= 5 ? 'adequado' : worst >= 4 ? 'atencao' : 'critico';
                        const mainVal = vals.map(x => `${x.n}: ${Number(x.v).toFixed(1)}`).join(' | ');
                        const secs: string[] = [];
                        if (data.nota_mt_af != null) secs.push(`Mat. AF: ${fmtNum(data.nota_mt_af)}`);
                        if (data.nota_lp_af != null) secs.push(`Port. AF: ${fmtNum(data.nota_lp_af)}`);
                        if (data.rendimento_af != null) secs.push(`Rend. AF: ${(Number(data.rendimento_af) * 100).toFixed(1)}%`);
                        if (data.projecao_af != null) secs.push(`Projeção AF: ${fmtNum(data.projecao_af)}`);
                        if (data.nota_mt_em != null) secs.push(`Mat. EM: ${fmtNum(data.nota_mt_em)}`);
                        if (data.nota_lp_em != null) secs.push(`Port. EM: ${fmtNum(data.nota_lp_em)}`);
                        if (data.rendimento_em != null) secs.push(`Rend. EM: ${(Number(data.rendimento_em) * 100).toFixed(1)}%`);
                        if (data.projecao_em != null) secs.push(`Projeção EM: ${fmtNum(data.projecao_em)}`);
                        if (data.ideb_ai != null) secs.push(`IDEB AI: ${fmtNum(data.ideb_ai)}`);
                        return { status, valor: mainVal, label: statusConfig[status].label, explicacao: 'Mede a qualidade do ensino combinando notas do SAEB e taxas de aprovação', secundarios: secs.length > 0 ? secs : undefined };
                      }
                      case 'taxas_rendimento': {
                        const abandVals = [data.abandono_fund, data.abandono_fund_ai, data.abandono_fund_af, data.abandono_med].filter(v => v != null).map(Number);
                        const repVals = [data.reprovacao_fund, data.reprovacao_fund_ai, data.reprovacao_fund_af, data.reprovacao_med].filter(v => v != null).map(Number);
                        const worstAband = abandVals.length > 0 ? Math.max(...abandVals) : null;
                        const worstRep = repVals.length > 0 ? Math.max(...repVals) : null;
                        let abandStatus: DiagStatus = 'sem_dados';
                        if (worstAband != null) abandStatus = worstAband <= 1 ? 'bom' : worstAband <= 2 ? 'adequado' : worstAband <= 5 ? 'atencao' : 'critico';
                        let repStatus: DiagStatus = 'sem_dados';
                        if (worstRep != null) repStatus = worstRep <= 5 ? 'bom' : worstRep <= 10 ? 'adequado' : worstRep <= 20 ? 'atencao' : 'critico';
                        const finalStatus = worstStatus(abandStatus, repStatus);
                        const parts: string[] = [];
                        const aprov = data.aprovacao_fund ?? data.aprovacao_med;
                        if (aprov != null) parts.push(`Aprov: ${fmtNum(aprov)}%`);
                        if (worstRep != null) parts.push(`Reprov: ${fmtNum(data.reprovacao_fund ?? data.reprovacao_med)}%`);
                        if (worstAband != null) parts.push(`Aband: ${fmtNum(data.abandono_fund ?? data.abandono_med)}%`);
                        const secs: string[] = [];
                        if (data.aprovacao_fund != null) secs.push(`Aprov. Fund: ${fmtNum(data.aprovacao_fund)}%`);
                        if (data.aprovacao_fund_ai != null) secs.push(`Aprov. AI: ${fmtNum(data.aprovacao_fund_ai)}%`);
                        if (data.aprovacao_fund_af != null) secs.push(`Aprov. AF: ${fmtNum(data.aprovacao_fund_af)}%`);
                        if (data.aprovacao_med != null) secs.push(`Aprov. Médio: ${fmtNum(data.aprovacao_med)}%`);
                        if (data.reprovacao_fund != null) secs.push(`Reprov. Fund: ${fmtNum(data.reprovacao_fund)}%`);
                        if (data.reprovacao_fund_ai != null) secs.push(`Reprov. AI: ${fmtNum(data.reprovacao_fund_ai)}%`);
                        if (data.reprovacao_fund_af != null) secs.push(`Reprov. AF: ${fmtNum(data.reprovacao_fund_af)}%`);
                        if (data.reprovacao_med != null) secs.push(`Reprov. Médio: ${fmtNum(data.reprovacao_med)}%`);
                        if (data.abandono_fund != null) secs.push(`Aband. Fund: ${fmtNum(data.abandono_fund)}%`);
                        if (data.abandono_fund_ai != null) secs.push(`Aband. AI: ${fmtNum(data.abandono_fund_ai)}%`);
                        if (data.abandono_fund_af != null) secs.push(`Aband. AF: ${fmtNum(data.abandono_fund_af)}%`);
                        if (data.abandono_med != null) secs.push(`Aband. Médio: ${fmtNum(data.abandono_med)}%`);
                        const expl = worstAband != null && worstRep != null
                          ? `Reprovação máx: ${fmtNum(worstRep)}% | Abandono máx: ${fmtNum(worstAband)}%`
                          : 'Taxas de aprovação, reprovação e abandono escolar';
                        return { status: finalStatus, valor: parts.join(' | ') || '—', label: statusConfig[finalStatus].label, explicacao: expl, secundarios: secs };
                      }
                      case 'tdi': {
                        const vals = [data.fundamental_total, data.medio_total].filter(v => v != null).map(Number);
                        if (vals.length === 0) return null;
                        const worst = Math.max(...vals);
                        const status: DiagStatus = worst < 10 ? 'bom' : worst < 20 ? 'adequado' : worst < 30 ? 'atencao' : 'critico';
                        const mainParts: string[] = [];
                        if (data.fundamental_total != null) mainParts.push(`Fund: ${fmtNum(data.fundamental_total)}%`);
                        if (data.medio_total != null) mainParts.push(`Médio: ${fmtNum(data.medio_total)}%`);
                        const secs: string[] = [];
                        if (data.fundamental_ai != null) secs.push(`Fund. AI: ${fmtNum(data.fundamental_ai)}%`);
                        if (data.fundamental_af != null) secs.push(`Fund. AF: ${fmtNum(data.fundamental_af)}%`);
                        if (data.fund_6ano != null) secs.push(`6º ano: ${fmtNum(data.fund_6ano)}%`);
                        if (data.fund_7ano != null) secs.push(`7º ano: ${fmtNum(data.fund_7ano)}%`);
                        if (data.fund_8ano != null) secs.push(`8º ano: ${fmtNum(data.fund_8ano)}%`);
                        if (data.fund_9ano != null) secs.push(`9º ano: ${fmtNum(data.fund_9ano)}%`);
                        if (data.medio_1serie != null) secs.push(`Médio 1ª: ${fmtNum(data.medio_1serie)}%`);
                        if (data.medio_2serie != null) secs.push(`Médio 2ª: ${fmtNum(data.medio_2serie)}%`);
                        if (data.medio_3serie != null) secs.push(`Médio 3ª: ${fmtNum(data.medio_3serie)}%`);
                        if (data.medio_4serie != null) secs.push(`Médio 4ª: ${fmtNum(data.medio_4serie)}%`);
                        return { status, valor: mainParts.join(' | '), label: statusConfig[status].label, explicacao: 'Percentual de alunos com idade acima da esperada para a série', secundarios: secs.length > 0 ? secs : undefined };
                      }
                      case 'icg': {
                        const nivel = Number(data.nivel);
                        if (isNaN(nivel)) return null;
                        const status: DiagStatus = nivel <= 2 ? 'bom' : nivel === 3 ? 'adequado' : nivel === 4 ? 'atencao' : 'critico';
                        return { status, valor: data.nivel_texto || `Nível ${nivel}`, label: statusConfig[status].label, explicacao: 'Nível de complexidade administrativa da escola (1=simples, 6=muito complexa)' };
                      }
                      case 'inse': {
                        const classif = data.inse_classificacao || data.nivel_inse || '';
                        const media = data.media_inse != null ? fmtNum(data.media_inse) : null;
                        const valor = classif || (media ? `Média: ${media}` : '—');
                        const secs: string[] = [];
                        if (media) secs.push(`Média INSE: ${media}`);
                        if (data.qtd_alunos_inse != null) secs.push(`Alunos avaliados: ${data.qtd_alunos_inse}`);
                        return { status: 'info' as DiagStatus, valor, label: 'Info', explicacao: 'Perfil socioeconômico médio dos alunos', secundarios: secs.length > 0 ? secs : undefined };
                      }
                      case 'ird': {
                        const media = Number(data.media_ird ?? data.media);
                        if (isNaN(media) || media === 0) return null;
                        const status: DiagStatus = media >= 3.0 ? 'bom' : media >= 2.5 ? 'adequado' : media >= 2.0 ? 'atencao' : 'critico';
                        return { status, valor: media.toFixed(2), label: statusConfig[status].label, explicacao: 'Indica se os professores permanecem na escola ao longo dos anos' };
                      }
                      case 'dsu': {
                        const vals = [data.percentual_fund, data.percentual_med].filter(v => v != null).map(Number);
                        if (vals.length === 0) return null;
                        const worst = Math.min(...vals);
                        const status: DiagStatus = worst >= 90 ? 'bom' : worst >= 80 ? 'adequado' : worst >= 60 ? 'atencao' : 'critico';
                        const mainParts: string[] = [];
                        if (data.percentual_fund != null) mainParts.push(`Fund: ${fmtNum(data.percentual_fund)}%`);
                        if (data.percentual_med != null) mainParts.push(`Médio: ${fmtNum(data.percentual_med)}%`);
                        const secs: string[] = [];
                        if (data.percentual_fund_ai != null) secs.push(`Fund. AI: ${fmtNum(data.percentual_fund_ai)}%`);
                        if (data.percentual_fund_af != null) secs.push(`Fund. AF: ${fmtNum(data.percentual_fund_af)}%`);
                        return { status, valor: mainParts.join(' | '), label: statusConfig[status].label, explicacao: 'Percentual de professores com diploma de curso superior', secundarios: secs.length > 0 ? secs : undefined };
                      }
                      case 'atu': {
                        const vals = [data.media_fund, data.media_med].filter(v => v != null).map(Number);
                        if (vals.length === 0) return null;
                        const worst = Math.max(...vals);
                        const status: DiagStatus = worst <= 25 ? 'bom' : worst <= 30 ? 'adequado' : worst <= 35 ? 'atencao' : 'critico';
                        const mainParts: string[] = [];
                        if (data.media_fund != null) mainParts.push(`Fund: ${fmtNum(data.media_fund)}`);
                        if (data.media_med != null) mainParts.push(`Médio: ${fmtNum(data.media_med)}`);
                        const secs: string[] = [];
                        if (data.media_fund_ai != null) secs.push(`Fund. AI: ${fmtNum(data.media_fund_ai)}`);
                        if (data.media_fund_af != null) secs.push(`Fund. AF: ${fmtNum(data.media_fund_af)}`);
                        return { status, valor: mainParts.join(' | '), label: statusConfig[status].label, explicacao: 'Média de alunos em cada sala de aula', secundarios: secs.length > 0 ? secs : undefined };
                      }
                      case 'had': {
                        const vals = [data.media_fund, data.media_med].filter(v => v != null).map(Number);
                        if (vals.length === 0) return null;
                        const worst = Math.min(...vals);
                        const status: DiagStatus = worst >= 5 ? 'bom' : worst >= 4 ? 'adequado' : worst >= 3.5 ? 'atencao' : 'critico';
                        const mainParts: string[] = [];
                        if (data.media_fund != null) mainParts.push(`Fund: ${fmtNum(data.media_fund)}h`);
                        if (data.media_med != null) mainParts.push(`Médio: ${fmtNum(data.media_med)}h`);
                        const secs: string[] = [];
                        if (data.media_fund_ai != null) secs.push(`Fund. AI: ${fmtNum(data.media_fund_ai)}h`);
                        if (data.media_fund_af != null) secs.push(`Fund. AF: ${fmtNum(data.media_fund_af)}h`);
                        return { status, valor: mainParts.join(' | '), label: statusConfig[status].label, explicacao: 'Tempo médio de aulas por dia', secundarios: secs.length > 0 ? secs : undefined };
                      }
                      case 'afd': {
                        const funCat1 = data.fun_cat_1 != null ? Number(data.fun_cat_1) : null;
                        const medCat1 = data.med_cat_1 != null ? Number(data.med_cat_1) : null;
                        const mainVal = funCat1 ?? medCat1;
                        if (mainVal == null) return null;
                        const status: DiagStatus = mainVal >= 80 ? 'bom' : mainVal >= 60 ? 'adequado' : mainVal >= 40 ? 'atencao' : 'critico';
                        const secs: string[] = [];
                        if (data.fun_cat_1 != null) secs.push(`Fund. G1: ${fmtNum(data.fun_cat_1)}%`);
                        if (data.fun_cat_2 != null) secs.push(`Fund. G2: ${fmtNum(data.fun_cat_2)}%`);
                        if (data.fun_cat_3 != null) secs.push(`Fund. G3: ${fmtNum(data.fun_cat_3)}%`);
                        if (data.fun_cat_4 != null) secs.push(`Fund. G4: ${fmtNum(data.fun_cat_4)}%`);
                        if (data.fun_cat_5 != null) secs.push(`Fund. G5: ${fmtNum(data.fun_cat_5)}%`);
                        if (data.med_cat_1 != null) secs.push(`Médio G1: ${fmtNum(data.med_cat_1)}%`);
                        if (data.med_cat_2 != null) secs.push(`Médio G2: ${fmtNum(data.med_cat_2)}%`);
                        if (data.med_cat_3 != null) secs.push(`Médio G3: ${fmtNum(data.med_cat_3)}%`);
                        if (data.med_cat_4 != null) secs.push(`Médio G4: ${fmtNum(data.med_cat_4)}%`);
                        if (data.med_cat_5 != null) secs.push(`Médio G5: ${fmtNum(data.med_cat_5)}%`);
                        return { status, valor: `${fmtNum(mainVal)}% (Grupo 1)`, label: statusConfig[status].label, explicacao: 'Percentual de professores com formação adequada à disciplina que lecionam', secundarios: secs };
                      }
                      case 'ied': {
                        const n1 = Number(data.nivel_1 || 0);
                        const n2 = Number(data.nivel_2 || 0);
                        const baixo = n1 + n2;
                        const status: DiagStatus = baixo >= 60 ? 'bom' : baixo >= 40 ? 'adequado' : baixo >= 20 ? 'atencao' : 'critico';
                        const secs: string[] = [];
                        if (data.nivel_1 != null) secs.push(`N1: ${fmtNum(data.nivel_1)}%`);
                        if (data.nivel_2 != null) secs.push(`N2: ${fmtNum(data.nivel_2)}%`);
                        if (data.nivel_3 != null) secs.push(`N3: ${fmtNum(data.nivel_3)}%`);
                        if (data.nivel_4 != null) secs.push(`N4: ${fmtNum(data.nivel_4)}%`);
                        if (data.nivel_5 != null) secs.push(`N5: ${fmtNum(data.nivel_5)}%`);
                        if (data.nivel_6 != null) secs.push(`N6: ${fmtNum(data.nivel_6)}%`);
                        if (data.percentual_fund != null) secs.push(`Fund: ${fmtNum(data.percentual_fund)}%`);
                        if (data.percentual_med != null) secs.push(`Médio: ${fmtNum(data.percentual_med)}%`);
                        return { status, valor: `${fmtNum(baixo)}% baixo esforço`, label: statusConfig[status].label, explicacao: 'Distribuição dos professores por nível de esforço (quantidade de escolas e turnos)', secundarios: secs };
                      }
                      case 'saeb': {
                        const scores: string[] = [];
                        if (data.nota_mt_ai != null) scores.push(`Mat. AI: ${fmtNum(data.nota_mt_ai)}`);
                        if (data.nota_lp_ai != null) scores.push(`Port. AI: ${fmtNum(data.nota_lp_ai)}`);
                        if (data.nota_mt_af != null) scores.push(`Mat. AF: ${fmtNum(data.nota_mt_af)}`);
                        if (data.nota_lp_af != null) scores.push(`Port. AF: ${fmtNum(data.nota_lp_af)}`);
                        if (data.nota_mt_em != null) scores.push(`Mat. EM: ${fmtNum(data.nota_mt_em)}`);
                        if (data.nota_lp_em != null) scores.push(`Port. EM: ${fmtNum(data.nota_lp_em)}`);
                        if (scores.length === 0) return null;
                        return { status: 'info' as DiagStatus, valor: scores.slice(0, 3).join(' | '), label: 'Info', explicacao: 'Notas de proficiência em Matemática e Português', secundarios: scores.length > 3 ? scores : undefined };
                      }
                      case 'taxa_nao_resposta': {
                        const vals = [
                          data.taxa_nao_resposta_fund ?? data.tnr_fund,
                          data.taxa_nao_resposta_med ?? data.tnr_med,
                        ].filter(v => v != null).map(Number);
                        if (vals.length === 0) return null;
                        const worst = Math.max(...vals);
                        const status: DiagStatus = worst < 5 ? 'bom' : worst < 10 ? 'adequado' : worst < 20 ? 'atencao' : 'critico';
                        const mainParts: string[] = [];
                        const fundVal = data.taxa_nao_resposta_fund ?? data.tnr_fund;
                        const medVal = data.taxa_nao_resposta_med ?? data.tnr_med;
                        if (fundVal != null) mainParts.push(`Fund: ${fmtNum(fundVal)}%`);
                        if (medVal != null) mainParts.push(`Médio: ${fmtNum(medVal)}%`);
                        const secs: string[] = [];
                        const fundAi = data.taxa_nao_resposta_fund_ai ?? data.tnr_fund_ai;
                        const fundAf = data.taxa_nao_resposta_fund_af ?? data.tnr_fund_af;
                        if (fundAi != null) secs.push(`Fund. AI: ${fmtNum(fundAi)}%`);
                        if (fundAf != null) secs.push(`Fund. AF: ${fmtNum(fundAf)}%`);
                        return { status, valor: mainParts.join(' | '), label: statusConfig[status].label, explicacao: 'Percentual de itens não respondidos nas avaliações', secundarios: secs.length > 0 ? secs : undefined };
                      }
                      default:
                        return null;
                    }
                  };

                  const indicatorOrder: { tipo: string; nome: string; key: string }[] = [
                    { tipo: 'ideb', nome: 'IDEB', key: 'ideb' },
                    { tipo: 'taxas_rendimento', nome: 'Taxas de Rendimento', key: 'taxas_rendimento' },
                    { tipo: 'tdi', nome: 'TDI', key: 'tdi' },
                    { tipo: 'icg', nome: 'ICG', key: 'icg' },
                    { tipo: 'inse', nome: 'INSE', key: 'inse' },
                    { tipo: 'ird', nome: 'IRD', key: 'ird' },
                    { tipo: 'dsu', nome: 'DSU', key: 'dsu' },
                    { tipo: 'atu', nome: 'ATU', key: 'atu' },
                    { tipo: 'had', nome: 'HAD', key: 'had' },
                    { tipo: 'afd', nome: 'AFD', key: 'afd' },
                    { tipo: 'ied', nome: 'IED', key: 'ied' },
                    { tipo: 'saeb', nome: 'SAEB', key: 'saeb' },
                    { tipo: 'taxa_nao_resposta', nome: 'TNR', key: 'taxa_nao_resposta' },
                  ];

                  const rows = indicatorOrder
                    .map(ind => {
                      const data = indicadoresLatest[ind.key];
                      if (!data) return null;
                      const diag = getDiagnosis(ind.tipo, data);
                      if (!diag) return null;
                      return { ...ind, data, diag, ano: data._ano };
                    })
                    .filter(Boolean) as { tipo: string; nome: string; key: string; data: any; diag: Diagnosis; ano?: number }[];

                  const allIndicatorKeys = indicatorOrder.map(i => i.key);
                  const missingCount = allIndicatorKeys.filter(k => !indicadoresLatest[k]).length;

                  if (rows.length === 0 && missingCount === 0) return null;

                  return (
                    <Card className="card-clay border-l-4 border-l-accent">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-accent" />
                          Raio-X Educacional
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Diagnóstico dos indicadores mais recentes</p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="divide-y divide-border/10">
                          {rows.map(row => {
                            const cfg = statusConfig[row.diag.status];
                            return (
                              <div key={row.key} className="flex items-start gap-3 py-3">
                                <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${cfg.dot}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-foreground">
                                      {row.nome}
                                      {row.ano && <span className="text-[10px] font-normal text-muted-foreground ml-1">({row.ano})</span>}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold">{row.diag.valor}</span>
                                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.bg}`}>{row.diag.label}</span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">{row.diag.explicacao}</p>
                                  {row.diag.secundarios && row.diag.secundarios.length > 0 && (
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
                                      {row.diag.secundarios.map((s, i) => <span key={i}>{s}</span>)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {missingCount > 0 && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/10">
                            <Info className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground">{missingCount} indicador{missingCount > 1 ? 'es' : ''} sem dados para esta escola</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}

                <IndicatorSection
                  title="Matrículas por Etapa"
                  icon={<BookOpen className="w-5 h-5 text-accent" />}
                  expanded={expandedSections['matriculas'] ?? true}
                  onToggle={() => toggleSection('matriculas')}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <InfoItem label="Ed. Infantil - Creche" value={censoLatest.qt_mat_inf_cre} />
                    <InfoItem label="Ed. Infantil - Pré-escola" value={censoLatest.qt_mat_inf_pre} />
                    <InfoItem label="Fund. Anos Iniciais" value={censoLatest.qt_mat_fund_ai} />
                    <InfoItem label="Fund. 1º ano" value={censoLatest.qt_mat_fund_ai_1} />
                    <InfoItem label="Fund. 2º ano" value={censoLatest.qt_mat_fund_ai_2} />
                    <InfoItem label="Fund. 3º ano" value={censoLatest.qt_mat_fund_ai_3} />
                    <InfoItem label="Fund. 4º ano" value={censoLatest.qt_mat_fund_ai_4} />
                    <InfoItem label="Fund. 5º ano" value={censoLatest.qt_mat_fund_ai_5} />
                    <InfoItem label="Fund. Anos Finais" value={censoLatest.qt_mat_fund_af} />
                    <InfoItem label="Fund. 6º ano" value={censoLatest.qt_mat_fund_af_6} />
                    <InfoItem label="Fund. 7º ano" value={censoLatest.qt_mat_fund_af_7} />
                    <InfoItem label="Fund. 8º ano" value={censoLatest.qt_mat_fund_af_8} />
                    <InfoItem label="Fund. 9º ano" value={censoLatest.qt_mat_fund_af_9} />
                    <InfoItem label="Ensino Médio" value={censoLatest.qt_mat_med} />
                    <InfoItem label="Médio 1ª série" value={censoLatest.qt_mat_med_prop_1} />
                    <InfoItem label="Médio 2ª série" value={censoLatest.qt_mat_med_prop_2} />
                    <InfoItem label="Médio 3ª série" value={censoLatest.qt_mat_med_prop_3} />
                    <InfoItem label="Médio 4ª série" value={censoLatest.qt_mat_med_prop_4} />
                    <InfoItem label="Ed. Profissional" value={censoLatest.qt_mat_prof} />
                    <InfoItem label="EJA Fund." value={censoLatest.qt_mat_eja_fund} />
                    <InfoItem label="EJA Médio" value={censoLatest.qt_mat_eja_med} />
                  </div>
                </IndicatorSection>

                <IndicatorSection
                  title="Educação Especial"
                  icon={<Heart className="w-5 h-5 text-accent" />}
                  expanded={expandedSections['educacao_especial'] ?? true}
                  onToggle={() => toggleSection('educacao_especial')}
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">AEE - Atendimento Educacional Especializado</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="AEE" value={censoLatest.tp_aee === 1 ? "Na própria escola" : censoLatest.tp_aee === 2 ? "Em outra escola" : censoLatest.tp_aee === 3 ? "Em instituição especializada" : censoLatest.tp_aee === 0 ? "Não oferece" : undefined} />
                        <InfoItem label="Sala Atend. Especial" value={censoLatest.in_sala_atendimento_especial === 1 ? "Sim" : censoLatest.in_sala_atendimento_especial === 0 ? "Não" : undefined} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Matrículas</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="Total Mat. Especial" value={censoLatest.qt_mat_esp} highlight />
                        <InfoItem label="Classes Comuns (Inclusão)" value={censoLatest.qt_mat_esp_cc} />
                        <InfoItem label="Classes Exclusivas" value={censoLatest.qt_mat_esp_ce} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Docentes</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="Total Docentes Ed. Especial" value={censoLatest.qt_doc_esp} />
                        <InfoItem label="Classes Comuns" value={censoLatest.qt_doc_esp_cc} />
                        <InfoItem label="Classes Exclusivas" value={censoLatest.qt_doc_esp_ce} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Turmas</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="Total Turmas Ed. Especial" value={censoLatest.qt_tur_esp} />
                        <InfoItem label="Classes Comuns" value={censoLatest.qt_tur_esp_cc} />
                        <InfoItem label="Classes Exclusivas" value={censoLatest.qt_tur_esp_ce} />
                      </div>
                    </div>
                  </div>
                </IndicatorSection>

                <IndicatorSection
                  title="Perfil dos Alunos"
                  icon={<Users className="w-5 h-5 text-accent" />}
                  expanded={expandedSections['perfil'] ?? true}
                  onToggle={() => toggleSection('perfil')}
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Por Turno</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="Diurno" value={censoLatest.qt_mat_bas_d} />
                        <InfoItem label="Noturno" value={censoLatest.qt_mat_bas_n} />
                        <InfoItem label="EAD" value={censoLatest.qt_mat_bas_ead} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Por Sexo</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="Feminino" value={censoLatest.qt_mat_bas_fem} />
                        <InfoItem label="Masculino" value={censoLatest.qt_mat_bas_masc} />
                        <InfoItem label="Não declarado" value={censoLatest.qt_mat_bas_nd} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Por Cor/Raça</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="Branca" value={censoLatest.qt_mat_bas_branca} />
                        <InfoItem label="Preta" value={censoLatest.qt_mat_bas_preta} />
                        <InfoItem label="Parda" value={censoLatest.qt_mat_bas_parda} />
                        <InfoItem label="Amarela" value={censoLatest.qt_mat_bas_amarela} />
                        <InfoItem label="Indígena" value={censoLatest.qt_mat_bas_indigena} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Por Faixa Etária</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="0 a 3 anos" value={censoLatest.qt_mat_bas_0_3} />
                        <InfoItem label="4 a 5 anos" value={censoLatest.qt_mat_bas_4_5} />
                        <InfoItem label="6 a 10 anos" value={censoLatest.qt_mat_bas_6_10} />
                        <InfoItem label="11 a 14 anos" value={censoLatest.qt_mat_bas_11_14} />
                        <InfoItem label="15 a 17 anos" value={censoLatest.qt_mat_bas_15_17} />
                        <InfoItem label="18+ anos" value={censoLatest.qt_mat_bas_18_mais} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Por Zona de Residência</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="Urbana" value={censoLatest.qt_mat_zr_urb} />
                        <InfoItem label="Rural" value={censoLatest.qt_mat_zr_rur} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Integral</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="Infantil Integral" value={censoLatest.qt_mat_inf_int} />
                        <InfoItem label="Fund. AI Integral" value={censoLatest.qt_mat_fund_ai_int} />
                        <InfoItem label="Fund. AF Integral" value={censoLatest.qt_mat_fund_af_int} />
                        <InfoItem label="Médio Integral" value={censoLatest.qt_mat_med_int} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Transporte Escolar</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="Transporte Público" value={censoLatest.qt_transp_publico} />
                        <InfoItem label="Resp. Estadual" value={censoLatest.qt_transp_resp_est} />
                        <InfoItem label="Resp. Municipal" value={censoLatest.qt_transp_resp_mun} />
                      </div>
                    </div>
                  </div>
                </IndicatorSection>

                <IndicatorSection
                  title="Docentes"
                  icon={<GraduationCap className="w-5 h-5 text-purple-600" />}
                  expanded={expandedSections['docentes'] ?? true}
                  onToggle={() => toggleSection('docentes')}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <InfoItem label="Total" value={censoLatest.qt_doc_bas} highlight />
                    <InfoItem label="Ed. Infantil" value={censoLatest.qt_doc_inf} />
                    <InfoItem label="Infantil Creche" value={censoLatest.qt_doc_inf_cre} />
                    <InfoItem label="Infantil Pré" value={censoLatest.qt_doc_inf_pre} />
                    <InfoItem label="Fundamental" value={censoLatest.qt_doc_fund} />
                    <InfoItem label="Fund. Anos Iniciais" value={censoLatest.qt_doc_fund_ai} />
                    <InfoItem label="Fund. Anos Finais" value={censoLatest.qt_doc_fund_af} />
                    <InfoItem label="Ensino Médio" value={censoLatest.qt_doc_med} />
                    <InfoItem label="Ed. Profissional" value={censoLatest.qt_doc_prof} />
                    <InfoItem label="EJA" value={censoLatest.qt_doc_eja} />
                    <InfoItem label="Ed. Especial" value={censoLatest.qt_doc_esp} />
                  </div>
                </IndicatorSection>

                <IndicatorSection
                  title="Turmas"
                  icon={<BookOpen className="w-5 h-5 text-teal-600" />}
                  expanded={expandedSections['turmas'] ?? false}
                  onToggle={() => toggleSection('turmas')}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <InfoItem label="Total" value={censoLatest.qt_tur_bas} highlight />
                    <InfoItem label="Ed. Infantil" value={censoLatest.qt_tur_inf} />
                    <InfoItem label="Infantil Creche" value={censoLatest.qt_tur_inf_cre} />
                    <InfoItem label="Infantil Pré" value={censoLatest.qt_tur_inf_pre} />
                    <InfoItem label="Fundamental" value={censoLatest.qt_tur_fund} />
                    <InfoItem label="Fund. Anos Iniciais" value={censoLatest.qt_tur_fund_ai} />
                    <InfoItem label="Fund. Anos Finais" value={censoLatest.qt_tur_fund_af} />
                    <InfoItem label="Ensino Médio" value={censoLatest.qt_tur_med} />
                    <InfoItem label="Ed. Profissional" value={censoLatest.qt_tur_prof} />
                    <InfoItem label="EJA" value={censoLatest.qt_tur_eja} />
                    <InfoItem label="Ed. Especial" value={censoLatest.qt_tur_esp} />
                    <InfoItem label="Diurnas" value={censoLatest.qt_tur_bas_d} />
                    <InfoItem label="Noturnas" value={censoLatest.qt_tur_bas_n} />
                  </div>
                </IndicatorSection>

                <IndicatorSection
                  title="Informações Gerais"
                  icon={<Info className="w-5 h-5 text-accent" />}
                  expanded={expandedSections['info'] ?? true}
                  onToggle={() => toggleSection('info')}
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Dados Básicos</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfoItem label="Situação" value={censoLatest.ds_situacao} />
                        <InfoItem label="Dependência" value={censoLatest.ds_dependencia} />
                        <InfoItem label="Localização" value={censoLatest.ds_localizacao} />
                        <InfoItem label="Região" value={censoLatest.no_regiao} />
                        <InfoItem label="Município" value={censoLatest.no_municipio} />
                        <InfoItem label="UF" value={censoLatest.sg_uf} />
                        <InfoItem label="Cód. Município" value={censoLatest.co_municipio} />
                        <InfoItem label="Regulamentação" value={censoLatest.tp_regulamentacao === 1 ? "Sim" : censoLatest.tp_regulamentacao === 2 ? "Sim, em tramitação" : censoLatest.tp_regulamentacao === 3 ? "Não" : undefined} />
                        <InfoItem label="Órgão Regulamentador" value={censoLatest.tp_responsavel_regulamentacao === 1 ? "Conselho Federal de Educação" : censoLatest.tp_responsavel_regulamentacao === 2 ? "Conselho Estadual de Educação" : censoLatest.tp_responsavel_regulamentacao === 3 ? "Conselho Municipal de Educação" : undefined} />
                        <InfraItem label="Prédio Escolar" value={censoLatest.in_local_func_predio_escolar} />
                        <InfraItem label="Prédio Compartilhado" value={censoLatest.in_predio_compartilhado} />
                        <InfraItem label="Alimentação" value={censoLatest.in_alimentacao} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Etapas e Modalidades Oferecidas</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Ed. Infantil" value={censoLatest.in_inf} />
                        <InfraItem label="Creche" value={censoLatest.in_inf_cre} />
                        <InfraItem label="Pré-escola" value={censoLatest.in_inf_pre} />
                        <InfraItem label="Ensino Fund." value={censoLatest.in_fund} />
                        <InfraItem label="Fund. Anos Iniciais" value={censoLatest.in_fund_ai} />
                        <InfraItem label="Fund. Anos Finais" value={censoLatest.in_fund_af} />
                        <InfraItem label="Ensino Médio" value={censoLatest.in_med} />
                        <InfraItem label="Ed. Profissional" value={censoLatest.in_prof} />
                        <InfraItem label="EJA" value={censoLatest.in_eja} />
                        <InfraItem label="EJA Fund." value={censoLatest.in_eja_fund} />
                        <InfraItem label="EJA Médio" value={censoLatest.in_eja_med} />
                        <InfraItem label="Ed. Especial" value={censoLatest.in_esp} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Organização</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Conselho Escolar" value={censoLatest.in_orgao_conselho_escolar} />
                        <InfraItem label="APM / APP" value={censoLatest.in_orgao_ass_pais_mestres} />
                        <InfraItem label="Grêmio Estudantil" value={censoLatest.in_orgao_gremio_estudantil} />
                        <InfraItem label="Redes Sociais" value={censoLatest.in_redes_sociais} />
                        <InfraItem label="Ed. Ambiental" value={censoLatest.in_educ_ambiental} />
                      </div>
                    </div>
                  </div>
                </IndicatorSection>

                <IndicatorSection
                  title="Água, Energia e Saneamento"
                  icon={<Info className="w-5 h-5 text-cyan-600" />}
                  expanded={expandedSections['saneamento'] ?? false}
                  onToggle={() => toggleSection('saneamento')}
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Água</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Água Potável" value={censoLatest.in_agua_potavel} />
                        <InfraItem label="Rede Pública" value={censoLatest.in_agua_rede_publica} />
                        <InfraItem label="Poço Artesiano" value={censoLatest.in_agua_poco_artesiano} />
                        <InfraItem label="Cacimba" value={censoLatest.in_agua_cacimba} />
                        <InfraItem label="Fonte/Rio" value={censoLatest.in_agua_fonte_rio} />
                        <InfraItem label="Carro-pipa" value={censoLatest.in_agua_carro_pipa} />
                        <InfraItem label="Inexistente" value={censoLatest.in_agua_inexistente} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Energia</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Rede Pública" value={censoLatest.in_energia_rede_publica} />
                        <InfraItem label="Gerador Fóssil" value={censoLatest.in_energia_gerador_fossil} />
                        <InfraItem label="Renovável" value={censoLatest.in_energia_renovavel} />
                        <InfraItem label="Inexistente" value={censoLatest.in_energia_inexistente} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Esgoto</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Rede Pública" value={censoLatest.in_esgoto_rede_publica} />
                        <InfraItem label="Fossa Séptica" value={censoLatest.in_esgoto_fossa_septica} />
                        <InfraItem label="Fossa Comum" value={censoLatest.in_esgoto_fossa_comum} />
                        <InfraItem label="Inexistente" value={censoLatest.in_esgoto_inexistente} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Lixo</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Coleta" value={censoLatest.in_lixo_servico_coleta} />
                        <InfraItem label="Queima" value={censoLatest.in_lixo_queima} />
                        <InfraItem label="Enterra" value={censoLatest.in_lixo_enterra} />
                        <InfraItem label="Separação" value={censoLatest.in_tratamento_lixo_separacao} />
                        <InfraItem label="Reciclagem" value={censoLatest.in_tratamento_lixo_reciclagem} />
                      </div>
                    </div>
                  </div>
                </IndicatorSection>

                <IndicatorSection
                  title="Infraestrutura e Dependências"
                  icon={<Building2 className="w-5 h-5 text-green-600" />}
                  expanded={expandedSections['infra'] ?? true}
                  onToggle={() => toggleSection('infra')}
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Salas</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfoItem label="Salas Utilizadas" value={censoLatest.qt_salas_utilizadas} />
                        <InfoItem label="Salas Dentro" value={censoLatest.qt_salas_utilizadas_dentro} />
                        <InfoItem label="Salas Fora" value={censoLatest.qt_salas_utilizadas_fora} />
                        <InfoItem label="Climatizadas" value={censoLatest.qt_salas_utiliza_climatizadas} />
                        <InfoItem label="Acessíveis" value={censoLatest.qt_salas_utilizadas_acessiveis} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Espaços</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Biblioteca" value={censoLatest.in_biblioteca} />
                        <InfraItem label="Sala de Leitura" value={censoLatest.in_biblioteca_sala_leitura} />
                        <InfraItem label="Lab. Informática" value={censoLatest.in_laboratorio_informatica} />
                        <InfraItem label="Lab. Ciências" value={censoLatest.in_laboratorio_ciencias} />
                        <InfraItem label="Lab. Ed. Profissional" value={censoLatest.in_laboratorio_educ_prof} />
                        <InfraItem label="Quadra Coberta" value={censoLatest.in_quadra_esportes_coberta} />
                        <InfraItem label="Quadra Descoberta" value={censoLatest.in_quadra_esportes_descoberta} />
                        <InfraItem label="Cozinha" value={censoLatest.in_cozinha} />
                        <InfraItem label="Despensa" value={censoLatest.in_despensa} />
                        <InfraItem label="Refeitório" value={censoLatest.in_refeitorio} />
                        <InfraItem label="Almoxarifado" value={censoLatest.in_almoxarifado} />
                        <InfraItem label="Pátio Coberto" value={censoLatest.in_patio_coberto} />
                        <InfraItem label="Pátio Descoberto" value={censoLatest.in_patio_descoberto} />
                        <InfraItem label="Parque Infantil" value={censoLatest.in_parque_infantil} />
                        <InfraItem label="Auditório" value={censoLatest.in_auditorio} />
                        <InfraItem label="Piscina" value={censoLatest.in_piscina} />
                        <InfraItem label="Área Verde" value={censoLatest.in_area_verde} />
                        <InfraItem label="Sala Multiuso" value={censoLatest.in_sala_multiuso} />
                        <InfraItem label="Sala Diretoria" value={censoLatest.in_sala_diretoria} />
                        <InfraItem label="Sala Professores" value={censoLatest.in_sala_professor} />
                        <InfraItem label="Secretaria" value={censoLatest.in_secretaria} />
                        <InfraItem label="Sala Atend. Especial" value={censoLatest.in_sala_atendimento_especial} />
                        <InfraItem label="Sala Artes" value={censoLatest.in_sala_atelie_artes} />
                        <InfraItem label="Sala Música" value={censoLatest.in_sala_musica_coral} />
                        <InfraItem label="Viveiro" value={censoLatest.in_viveiro} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Banheiros</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Banheiro" value={censoLatest.in_banheiro} />
                        <InfraItem label="Banheiro Ed. Infantil" value={censoLatest.in_banheiro_ei} />
                        <InfraItem label="Banheiro PNE" value={censoLatest.in_banheiro_pne} />
                        <InfraItem label="Banheiro Funcionários" value={censoLatest.in_banheiro_funcionarios} />
                        <InfraItem label="Chuveiro" value={censoLatest.in_banheiro_chuveiro} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Acessibilidade</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Rampas" value={censoLatest.in_acessibilidade_rampas} />
                        <InfraItem label="Corrimão" value={censoLatest.in_acessibilidade_corrimao} />
                        <InfraItem label="Elevador" value={censoLatest.in_acessibilidade_elevador} />
                        <InfraItem label="Pisos Táteis" value={censoLatest.in_acessibilidade_pisos_tateis} />
                        <InfraItem label="Vão Livre" value={censoLatest.in_acessibilidade_vao_livre} />
                        <InfraItem label="Sinal Sonoro" value={censoLatest.in_acessibilidade_sinal_sonoro} />
                        <InfraItem label="Sinal Tátil" value={censoLatest.in_acessibilidade_sinal_tatil} />
                        <InfraItem label="Sinal Visual" value={censoLatest.in_acessibilidade_sinal_visual} />
                      </div>
                    </div>
                  </div>
                </IndicatorSection>

                <IndicatorSection
                  title="Equipamentos e Tecnologia"
                  icon={<Info className="w-5 h-5 text-indigo-600" />}
                  expanded={expandedSections['equipamentos'] ?? false}
                  onToggle={() => toggleSection('equipamentos')}
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Equipamentos</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Computador" value={censoLatest.in_computador} />
                        <InfoItem label="Desktops p/ Alunos" value={censoLatest.qt_desktop_aluno} />
                        <InfoItem label="Notebooks p/ Alunos" value={censoLatest.qt_comp_portatil_aluno} />
                        <InfoItem label="Tablets p/ Alunos" value={censoLatest.qt_tablet_aluno} />
                        <InfoItem label="TVs" value={censoLatest.qt_equip_tv} />
                        <InfoItem label="Projetores" value={censoLatest.qt_equip_multimidia} />
                        <InfoItem label="Lousas Digitais" value={censoLatest.qt_equip_lousa_digital} />
                        <InfoItem label="Equipamentos de Som" value={censoLatest.qt_equip_som} />
                        <InfraItem label="Impressora" value={censoLatest.in_equip_impressora} />
                        <InfraItem label="Copiadora" value={censoLatest.in_equip_copiadora} />
                        <InfraItem label="Scanner" value={censoLatest.in_equip_scanner} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Internet e Conectividade</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Internet" value={censoLatest.in_internet} />
                        <InfraItem label="Banda Larga" value={censoLatest.in_banda_larga} />
                        <InfraItem label="Internet p/ Alunos" value={censoLatest.in_internet_alunos} />
                        <InfraItem label="Internet Administrativo" value={censoLatest.in_internet_administrativo} />
                        <InfraItem label="Internet Aprendizagem" value={censoLatest.in_internet_aprendizagem} />
                        <InfraItem label="Internet Comunidade" value={censoLatest.in_internet_comunidade} />
                        <InfraItem label="Acesso por Computador" value={censoLatest.in_acesso_internet_computador} />
                        <InfraItem label="Acesso por Dispositivos" value={censoLatest.in_aces_internet_disp_pessoais} />
                      </div>
                    </div>
                  </div>
                </IndicatorSection>

                <IndicatorSection
                  title="Profissionais (não docentes)"
                  icon={<Users className="w-5 h-5 text-amber-600" />}
                  expanded={expandedSections['profissionais'] ?? false}
                  onToggle={() => toggleSection('profissionais')}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <InfoItem label="Administrativos" value={censoLatest.qt_prof_administrativos} />
                    <InfoItem label="Serviços Gerais" value={censoLatest.qt_prof_servicos_gerais} />
                    <InfoItem label="Bibliotecários" value={censoLatest.qt_prof_bibliotecario} />
                    <InfoItem label="Saúde" value={censoLatest.qt_prof_saude} />
                    <InfoItem label="Coordenadores" value={censoLatest.qt_prof_coordenador} />
                    <InfoItem label="Fonoaudiólogos" value={censoLatest.qt_prof_fonaudiologo} />
                    <InfoItem label="Nutricionistas" value={censoLatest.qt_prof_nutricionista} />
                    <InfoItem label="Psicólogos" value={censoLatest.qt_prof_psicologo} />
                    <InfoItem label="Alimentação" value={censoLatest.qt_prof_alimentacao} />
                    <InfoItem label="Pedagogia" value={censoLatest.qt_prof_pedagogia} />
                    <InfoItem label="Secretários" value={censoLatest.qt_prof_secretario} />
                    <InfoItem label="Segurança" value={censoLatest.qt_prof_seguranca} />
                    <InfoItem label="Monitores" value={censoLatest.qt_prof_monitores} />
                    <InfoItem label="Gestão" value={censoLatest.qt_prof_gestao} />
                    <InfoItem label="Assistentes Sociais" value={censoLatest.qt_prof_assist_social} />
                    <InfoItem label="Trad. Libras" value={censoLatest.qt_prof_trad_libras} />
                  </div>
                </IndicatorSection>

                <IndicatorSection
                  title="Materiais Pedagógicos"
                  icon={<BookOpen className="w-5 h-5 text-rose-600" />}
                  expanded={expandedSections['materiais'] ?? false}
                  onToggle={() => toggleSection('materiais')}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <InfraItem label="Multimídia" value={censoLatest.in_material_ped_multimidia} />
                    <InfraItem label="Infantil" value={censoLatest.in_material_ped_infantil} />
                    <InfraItem label="Científico" value={censoLatest.in_material_ped_cientifico} />
                    <InfraItem label="Difusão" value={censoLatest.in_material_ped_difusao} />
                    <InfraItem label="Musical" value={censoLatest.in_material_ped_musical} />
                    <InfraItem label="Jogos" value={censoLatest.in_material_ped_jogos} />
                    <InfraItem label="Artísticas" value={censoLatest.in_material_ped_artisticas} />
                    <InfraItem label="Profissional" value={censoLatest.in_material_ped_profissional} />
                    <InfraItem label="Desportiva" value={censoLatest.in_material_ped_desportiva} />
                    <InfraItem label="Indígena" value={censoLatest.in_material_ped_indigena} />
                    <InfraItem label="Étnico" value={censoLatest.in_material_ped_etnico} />
                    <InfraItem label="Quilombola" value={censoLatest.in_material_ped_quilombola} />
                    <InfraItem label="Ed. Especial" value={censoLatest.in_material_ped_edu_esp} />
                  </div>
                </IndicatorSection>

                <IndicatorSection
                  title="Dados Financeiros (PDDE / SIGPC)"
                  icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
                  expanded={expandedSections['financeiro'] ?? false}
                  onToggle={() => toggleSection('financeiro')}
                >
                  <div className="space-y-5">
                    {(pddeLoading || sigpcLoading) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Consultando dados financeiros do FNDE...
                      </div>
                    )}

                    {pddeData && !pddeLoading && (
                      <>
                        {pddeData.ok ? (
                          <div className="space-y-4">
                            {pddeData.uex && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                                  <Landmark className="w-3.5 h-3.5" />
                                  Unidade Executora (UEx)
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <InfoItem label="Executora" value={pddeData.uex.executora} />
                                  <InfoItem label="CNPJ" value={pddeData.uex.cnpj} />
                                  <InfoItem label="UF" value={pddeData.uex.uf} />
                                  <InfoItem label="Município" value={pddeData.uex.municipio} />
                                </div>
                              </div>
                            )}

                            {pddeData.matriculas_total != null && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                  Matrículas PDDE ({pddeData.ano})
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <InfoItem label="Total" value={pddeData.matriculas_total} highlight />
                                  {pddeData.matriculas_por_nivel && Object.entries(pddeData.matriculas_por_nivel).map(([nivel, qt]) => (
                                    <InfoItem key={nivel} label={nivel} value={qt} />
                                  ))}
                                </div>
                              </div>
                            )}

                            {pddeData.contas && pddeData.contas.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                                  <BanknoteIcon className="w-3.5 h-3.5" />
                                  Contas Bancárias
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-border/30">
                                        <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Programa</th>
                                        <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Banco</th>
                                        <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Agência</th>
                                        <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Conta</th>
                                        <th className="text-right py-2 px-2 text-muted-foreground font-medium text-xs">Saldo</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {pddeData.contas.map((conta, idx) => (
                                        <tr key={idx} className="border-b border-border/10">
                                          <td className="py-2 px-2 text-xs font-medium">{conta.programa}</td>
                                          <td className="py-2 px-2 text-xs">{conta.banco}</td>
                                          <td className="py-2 px-2 text-xs font-mono">{conta.agencia}</td>
                                          <td className="py-2 px-2 text-xs font-mono">{conta.conta}</td>
                                          <td className="py-2 px-2 text-xs text-right font-mono">
                                            {conta.saldo != null ? `R$ ${conta.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {pddeData.destinacoes && pddeData.destinacoes.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                                  <Wallet className="w-3.5 h-3.5" />
                                  Repasses e Destinações ({pddeData.ano})
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-border/30">
                                        <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Destinação</th>
                                        <th className="text-right py-2 px-2 text-muted-foreground font-medium text-xs">Devido</th>
                                        <th className="text-right py-2 px-2 text-muted-foreground font-medium text-xs">Pago</th>
                                        <th className="text-right py-2 px-2 text-muted-foreground font-medium text-xs hidden md:table-cell">Data Pgto</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {pddeData.destinacoes.map((dest, idx) => (
                                        <tr key={idx} className="border-b border-border/10">
                                          <td className="py-2 px-2 text-xs font-medium">{dest.destinacao}</td>
                                          <td className="py-2 px-2 text-xs text-right font-mono">
                                            {dest.devido_total != null ? `R$ ${dest.devido_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                          </td>
                                          <td className="py-2 px-2 text-xs text-right font-mono">
                                            {dest.pago_total != null ? `R$ ${dest.pago_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                          </td>
                                          <td className="py-2 px-2 text-xs text-right hidden md:table-cell">{dest.data_ordem_pgto || '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {pddeData.situacao_uex && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                  Situação da UEx
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <InfoItem label="Mandato Início" value={pddeData.situacao_uex.mandato_inicio} />
                                  <InfoItem label="Mandato Fim" value={pddeData.situacao_uex.mandato_fim} />
                                  <InfoItem label="Dados Cadastrais" value={pddeData.situacao_uex.dados_cadastrais} />
                                  <InfoItem label="Prestação de Contas" value={pddeData.situacao_uex.prestacao_contas} />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/50 border border-amber-200/50">
                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-amber-800">PDDE Info indisponível</p>
                              <p className="text-xs text-amber-600 mt-1">
                                {pddeData.error || "O portal do FNDE pode estar temporariamente indisponível. Tente novamente mais tarde."}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {sigpcData && !sigpcLoading && (
                      <>
                        {sigpcData.prestacoes && sigpcData.prestacoes.length > 0 ? (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              Prestações de Contas (SIGPC)
                            </p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-border/30">
                                    <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Programa</th>
                                    <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Ano</th>
                                    <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Situação</th>
                                    <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs hidden md:table-cell">Fase</th>
                                    <th className="text-right py-2 px-2 text-muted-foreground font-medium text-xs">Valor</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sigpcData.prestacoes.map((pc: any, idx: number) => (
                                    <tr key={idx} className="border-b border-border/10">
                                      <td className="py-2 px-2 text-xs font-medium">{pc.programaNome}</td>
                                      <td className="py-2 px-2 text-xs">{pc.anoConcessao}</td>
                                      <td className="py-2 px-2 text-xs">
                                        <Badge variant={pc.situacaoNome === 'Aprovada' ? 'default' : pc.situacaoNome === 'Irregular' ? 'destructive' : 'outline'} className="text-xs">
                                          {pc.situacaoNome}
                                        </Badge>
                                      </td>
                                      <td className="py-2 px-2 text-xs hidden md:table-cell">{pc.faseNome}</td>
                                      <td className="py-2 px-2 text-xs text-right font-mono">
                                        R$ {pc.valorConcessao?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : sigpcData.ok === false ? (
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/50 border border-amber-200/50">
                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-amber-800">SIGPC indisponível</p>
                              <p className="text-xs text-amber-600 mt-1">
                                {sigpcData.error || "O sistema de prestação de contas do FNDE está temporariamente indisponível."}
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}

                    {!pddeLoading && !sigpcLoading && (!pddeData || (!pddeData.ok && !pddeData.error)) && !sigpcData && (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          Dados financeiros não disponíveis para esta escola no momento.
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/20">
                      <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                        Dados obtidos do PDDE Info e SIGPC do FNDE. Podem apresentar atraso ou indisponibilidade temporária.
                        Para dados oficiais, acesse{' '}
                        <a href="https://www.fnde.gov.br/pddeinfo/pddeinfo/escola/consultar" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">
                          PDDE Info
                        </a>{' '}ou{' '}
                        <a href="https://www.fnde.gov.br/sigpcadm/actionPublico.pu?tilesPublico=ConsultarSituacao" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">
                          SIGPC
                        </a>.
                      </p>
                    </div>
                  </div>
                </IndicatorSection>

                <Card className="card-clay">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-accent" />
                      Links Úteis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { nome: 'PDDE Interativo', url: 'https://pddeinterativo.mec.gov.br' },
                        { nome: 'Portal FNDE', url: 'https://www.fnde.gov.br' },
                        { nome: 'Dados INEP', url: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos' },
                      ].map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 hover:bg-accent/10 border border-transparent hover:border-accent/20 transition-all text-sm font-medium text-foreground"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-accent" />
                          {link.nome}
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="card-clay">
                <CardContent className="py-12 text-center">
                  <School className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Escola não encontrada.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setSelectedInep(null)}>
                    Fechar
                  </Button>
                </CardContent>
              </Card>
            )}
              </>
            )}

            {!selectedInep && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Digite o nome ou código INEP de uma escola para ver seus dados.</p>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function EvolutionChart({ title, data, lines, icon }: { title: string; data: any[]; lines: { key: string; color: string; name: string }[]; icon?: React.ReactNode }) {
  const hasData = data.some(d => lines.some(l => d[l.key] != null && d[l.key] !== 0));
  if (!hasData) return null;

  const isSinglePoint = data.length <= 1;

  return (
    <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
      <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        {icon}
        {title}
      </p>
      <ResponsiveContainer width="100%" height={200}>
        {isSinglePoint ? (
          <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number, name: string) => [
                typeof value === 'number' ? (Number.isInteger(value) ? value.toLocaleString('pt-BR') : value.toFixed(2)) : value,
                name
              ]}
              labelFormatter={(label) => `Ano: ${label}`}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
            />
            <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
            {lines.map((line) => (
              <Bar key={line.key} dataKey={line.key} fill={line.color} name={line.name} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number, name: string) => [
                typeof value === 'number' ? (Number.isInteger(value) ? value.toLocaleString('pt-BR') : value.toFixed(2)) : value,
                name
              ]}
              labelFormatter={(label) => `Ano: ${label}`}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
            />
            <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                stroke={line.color}
                name={line.name}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${color} border border-border/10`}>
      <div className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-tight truncate">{value}</p>
        <p className="text-[10px] font-medium text-muted-foreground leading-tight">{label}</p>
      </div>
    </div>
  );
}

function IndicatorSection({ title, icon, expanded = true, onToggle, children }: {
  title: string; icon: React.ReactNode; expanded?: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <Card className="card-clay">
      <CardHeader className="pb-2 cursor-pointer" onClick={onToggle}>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
          <span className="ml-auto">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </CardTitle>
      </CardHeader>
      {expanded && <CardContent>{children}</CardContent>}
    </Card>
  );
}

function IndicatorRows({ data }: { data: any }) {
  if (!data) return null;
  if (Array.isArray(data)) {
    return (
      <>
        {data.map((item: any, idx: number) => (
          <div key={idx} className="col-span-full">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(item)
                .filter(([k]) => k !== 'co_entidade' && k !== 'ano')
                .map(([k, v]) => (
                  <InfoItem key={k} label={k.replace(/_/g, ' ')} value={v as any} />
                ))}
            </div>
          </div>
        ))}
      </>
    );
  }
  return (
    <>
      {Object.entries(data)
        .filter(([k]) => k !== 'co_entidade' && k !== 'ano')
        .map(([k, v]) => (
          <InfoItem key={k} label={k.replace(/_/g, ' ')} value={v as any} />
        ))}
    </>
  );
}

function InfoItem({ label, value, highlight }: { label: string; value: string | number | null | undefined; highlight?: boolean }) {
  if (value === null || value === undefined || value === '') return null;
  const displayValue = typeof value === 'number' ? (Number.isInteger(value) ? value.toLocaleString('pt-BR') : value.toFixed(2)) : String(value);
  return (
    <div className="p-2 rounded-lg bg-muted/30">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${highlight ? 'text-accent font-bold text-base' : ''}`}>{displayValue}</p>
    </div>
  );
}

function InfraItem({ label, value }: { label: string; value: number | undefined | null }) {
  if (value === undefined || value === null) return null;
  return (
    <div className={`p-3 rounded-xl ${value === 1 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-400'}`}>
      <p className="text-xs opacity-70 mb-1">{label}</p>
      <p className="font-medium">{value === 1 ? "Sim" : "Não"}</p>
    </div>
  );
}
