import { useState, useMemo } from "react";
import "../../public/painel-educacional.css";
import { AlertPanel } from "@/components/AlertPanel";
import { IndicatorPanel } from "@/components/IndicatorPanel";
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
import { useSchoolSearch, useSchool, useEscolaEvolucao, useEstatisticas, useListaEscolas, useMediasNacionais } from "@/hooks/use-schools";
import { usePddeInfo, usePddeSaldos, usePddeExecFin, usePddeUexSaldo, usePddeSituacaoCadastral, usePddePrestacaoConta, usePddeAtendimento } from "@/hooks/use-pdde";
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
  const [selectedChart, setSelectedChart] = useState("matriculas");
  const [activeTab, setActiveTab] = useState<"overview" | "search">("overview");
  const [filterUf, setFilterUf] = useState("");
  const [filterDep, setFilterDep] = useState("");
  const [listPage, setListPage] = useState(1);
  const [saldoMesSel, setSaldoMesSel] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  });

  const { data: stats, isLoading: statsLoading } = useEstatisticas(selectedAno);
  const { data: searchResults, refetch: refetchSearch, isLoading: searchLoading } = useSchoolSearch(searchQuery);
  const { data: evolucaoData, isLoading: evolucaoLoading } = useEscolaEvolucao(selectedInep || "");
  const { data: mediasNacionais } = useMediasNacionais(selectedAno);
  const pddeAno = new Date().getFullYear();
  const { data: pddeData, isLoading: pddeLoading } = usePddeInfo(selectedInep, pddeAno);
  const pddeCnpj = pddeData?.uex?.cnpj || null;
  const { data: pddeSaldosData, isLoading: pddeSaldosLoading, isError: pddeSaldosError } = usePddeSaldos(selectedInep);
  const { data: pddeExecFinData, isLoading: pddeExecFinLoading, isError: pddeExecFinError } = usePddeExecFin(selectedInep);
  const { data: pddeUexSaldoData, isLoading: pddeUexSaldoLoading } = usePddeUexSaldo(pddeCnpj, { mes: saldoMesSel });
  const { data: cadastralData, isLoading: cadastralLoading } = usePddeSituacaoCadastral(selectedInep, pddeAno);
  const { data: prestacaoContaData, isLoading: prestacaoContaLoading } = usePddePrestacaoConta(selectedInep, pddeAno);
  const { data: atendimentoData, isLoading: atendimentoLoading } = usePddeAtendimento(selectedInep, pddeAno);
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

  const censoPrev = useMemo(() => {
    if (!latestAno || !evolucaoData?.anos_disponiveis?.length) return null;
    const sortedAnos = [...evolucaoData.anos_disponiveis].sort((a: number, b: number) => b - a);
    const prevAno = sortedAnos.find((a: number) => a < latestAno);
    if (!prevAno || !evolucaoData?.censo_por_ano?.[prevAno]) return null;
    return evolucaoData.censo_por_ano[prevAno];
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
                {/* ── Hero mural ── */}
                <div className="relative rounded-[22px_30px_24px_28px] overflow-visible" style={{background:'linear-gradient(135deg,#fffef9 0%,#fff6cf 38%,#eef7ff 78%,#fdf1f6 100%)',border:'1px solid #eadfcb',boxShadow:'0 20px 42px rgba(82,71,50,0.10)',transform:'rotate(-0.4deg)'}}>
                  <div className="absolute w-44 h-7 rounded-lg pointer-events-none" style={{top:'-10px',right:'32px',background:'rgba(255,213,120,0.70)',transform:'rotate(4deg)'}}/>
                  <div className="p-5 flex flex-wrap gap-3 items-start">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedInep(null)} className="shrink-0 text-muted-foreground -ml-1 -mt-1"><X className="w-4 h-4"/></Button>
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-3" style={{background:'rgba(255,255,255,0.88)',border:'1px solid #e6d8c7',color:'#2d5a88'}}>
                        📘 Censo Escolar {latestAno} · INEP/MEC
                      </div>
                      <h2 className="text-xl font-bold leading-tight tracking-tight mb-3">{evolucaoData.escola.no_entidade}</h2>
                      <div className="flex flex-wrap gap-2">
                        {[
                          `📍 ${evolucaoData.escola.no_municipio}/${evolucaoData.escola.sg_uf}`,
                          `🏷 ${selectedInep}`,
                          `🏢 ${evolucaoData.escola.ds_dependencia}`,
                          evolucaoData.escola.ds_localizacao,
                          `✅ ${evolucaoData.escola.ds_situacao}`,
                          `📅 ${evolucaoData.anos_disponiveis.join(', ')}`,
                          ...(censoLatest.telefone ? [`📞 ${censoLatest.telefone}`] : []),
                        ].map((chip, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold" style={{background:'rgba(255,255,255,0.84)',border:'1px solid #e5e1d7',color:'#51606f'}}>{chip}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── bilhete intro ── */}
                <div className="auto-text-card" style={{fontSize:'14px',color:'#3d4d5a',lineHeight:1.6}}>
                  <strong className="scribble" style={{fontSize:'16px',color:'#4f4126'}}>Diretora, aqui está o raio-x completo desta escola!</strong>
                  <p className="mt-1">Dados do Censo Escolar {latestAno}, indicadores educacionais e situação financeira do PDDE — tudo filtrado pelo código INEP <strong>{selectedInep}</strong>.</p>
                </div>

                {/* ── Métricas resumo ── */}
                {(() => {
                  const THEMES = ['theme-blue','theme-yellow','theme-green','theme-purple','theme-pink','theme-teal'];
                  const METRICS = [
                    { label: `Matrículas ${latestAno}`, val: censoLatest.qt_mat_bas || 0, prev: censoPrev?.qt_mat_bas || 0, icon: '👩‍🎓' },
                    { label: `Docentes ${latestAno}`, val: censoLatest.qt_doc_bas || censoLatest.qt_docentes || 0, prev: censoPrev ? (censoPrev.qt_doc_bas || censoPrev.qt_docentes || 0) : 0, icon: '🧑‍🏫' },
                    { label: `Turmas ${latestAno}`, val: censoLatest.qt_tur_bas || censoLatest.qt_turmas || 0, prev: censoPrev ? (censoPrev.qt_tur_bas || censoPrev.qt_turmas || 0) : 0, icon: '🏫' },
                    { label: `Salas utilizadas`, val: censoLatest.qt_salas_utilizadas || 0, prev: censoPrev?.qt_salas_utilizadas || 0, icon: '🚪' },
                    { label: 'Pontos de atenção', val: alertasPreocupantes.length, prev: null, icon: alertasPreocupantes.filter(a=>a.tipo==='critical').length > 0 ? '⚠️' : alertasPreocupantes.length > 0 ? '◌' : '✅', extra: alertasPreocupantes.length === 0 ? 'Tudo certo' : `${alertasPreocupantes.filter(a=>a.tipo==='critical').length} crítico${alertasPreocupantes.filter(a=>a.tipo==='critical').length !== 1 ? 's' : ''}` },
                    { label: 'PDDE', val: pddeData?.ok ? (prestacaoContaData?.ok && prestacaoContaData.itens.length > 0 ? prestacaoContaData.itens.filter((i:any)=>i.situacao_pc_uex?.toLowerCase().includes('adimpl')).length === prestacaoContaData.itens.length ? 'OK' : 'Ver' : pddeData ? 'Ativo' : '—') : '—', prev: null, icon: '💸', extra: prestacaoContaData?.ok && prestacaoContaData.itens.length > 0 ? `${prestacaoContaData.itens.length} programa${prestacaoContaData.itens.length > 1 ? 's' : ''}` : pddeData?.ok ? pddeData.uex?.executora?.slice(0,22) : 'Sem dados' },
                  ];
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                      {METRICS.map((m, i) => {
                        const delta = m.prev !== null && typeof m.val === 'number' ? (m.val as number) - (m.prev as number) : null;
                        return (
                          <div key={i} className={`metric ${THEMES[i]}`}>
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{color:'#6b7785'}}>{m.label}</label>
                                <strong className="block text-3xl font-bold leading-none" style={{letterSpacing:'-0.04em'}}>{typeof m.val === 'number' ? m.val.toLocaleString('pt-BR') : m.val}</strong>
                              </div>
                              <div className="w-11 h-11 rounded-2xl grid place-items-center text-xl shrink-0" style={{background:'rgba(255,255,255,0.72)',border:'1px solid rgba(255,255,255,0.9)'}}>{m.icon}</div>
                            </div>
                            {(m as any).extra ? (
                              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold bg-white/60 text-gray-600">{(m as any).extra}</span>
                            ) : delta !== null && delta !== 0 ? (
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold ${delta > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{delta > 0 ? '▲' : '▼'} {Math.abs(delta)} vs ano anterior</span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {(() => {
                  const criticals = alertasPreocupantes.filter(a => a.tipo === 'critical');
                  const warnings = alertasPreocupantes.filter(a => a.tipo === 'warning');
                  const total = alertasPreocupantes.length;
                  const extractVal = (titulo: string) => { const m = titulo.match(/:\s*([\d,\.]+\s*%?)(\s*(?:alunos\/turma|h\/dia|h))?$/); return m ? m[1] + (m[2] || '') : null; };
                  const cleanTitle = (titulo: string) => titulo.replace(/:\s*[\d,\.]+\s*(?:%|alunos\/turma|h\/dia|h)?\s*$/, '').replace(/:\s*Nível\s*\d+\s*$/, '');
                  return (
                    <div className="space-y-4">
                      <div className="section-title">
                        <div>
                          <h2>Pontos de atenção</h2>
                          <p>Indicadores que merecem atenção especial desta escola</p>
                        </div>
                        {total > 0 && <span className="attention-count">◌ {total} ponto{total !== 1 ? 's' : ''} para acompanhar</span>}
                        {total === 0 && <span className="hint-chip">✅ Tudo dentro do esperado</span>}
                      </div>
                      <div className="organic-divider"/>

                      {total === 0 ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50" style={{borderLeft:'6px solid #2f7a58', border:'1px solid #c7e8d6', borderLeftWidth:'6px'}}>
                          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                          <p className="text-sm" style={{color:'#2f7a58'}}>Diretora, os indicadores desta escola estão dentro das faixas esperadas. Continue o bom trabalho!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[...criticals.map(a => ({...a, tipo: 'critical' as const})), ...warnings.map(a => ({...a, tipo: 'warning' as const}))].map((alerta, i) => {
                            const mv = extractVal(alerta.titulo);
                            const ct = cleanTitle(alerta.titulo);
                            return (
                              <div key={i} className={`alert-sticker ${alerta.tipo === 'critical' ? 'critical' : ''}`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <p className="text-sm font-bold leading-tight">{ct}</p>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${alerta.tipo === 'critical' ? 'bg-[#fdecea] text-[#b74f42]' : 'bg-[#fff4db] text-[#9b6a16]'}`}>
                                    {alerta.tipo === 'critical' ? 'Olhar com cuidado' : 'Acompanhar'}
                                  </span>
                                </div>
                                {mv && <strong className="block text-3xl font-bold leading-none mb-2" style={{letterSpacing:'-0.04em'}}>{mv}</strong>}
                                <p className="text-xs leading-snug" style={{color:'#6b7785'}}>{alerta.descricao}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <Card className="card-clay">
                  <CardHeader className="pb-2">
                    <div className="section-title">
                      <div>
                        <h2>Galeria de gráficos</h2>
                        <p>Escolha um recorte e visualize a evolução histórica da escola</p>
                      </div>
                      <span className="hint-chip">📊 {evolucaoData?.anos_disponiveis?.length || 1} ano{(evolucaoData?.anos_disponiveis?.length || 1) !== 1 ? 's' : ''} de dados</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!hasMultipleYears && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-4">
                        Por enquanto temos dados só de {latestAno}. Com mais anos importados, você vai ver a evolução aqui.
                      </div>
                    )}
                    {evolutionCharts && (() => {
                      const chartOptions = [
                        { id: "matriculas", label: "Matrículas", icon: <Users className="w-4 h-4" />, color: "#0ea5e9", description: "Total de alunos matriculados por ano.", data: evolutionCharts.matriculas, lines: [{ key: "value", color: "#0ea5e9", name: "Matrículas" }], unit: " alunos" },
                        { id: "docentes", label: "Docentes", icon: <GraduationCap className="w-4 h-4" />, color: "#8b5cf6", description: "Quantidade de professores na escola.", data: evolutionCharts.docentes, lines: [{ key: "value", color: "#8b5cf6", name: "Docentes" }] },
                        { id: "taxas", label: "Taxas de Rendimento", icon: <TrendingUp className="w-4 h-4" />, color: "#10b981", description: "Aprovação, reprovação e abandono escolar. Ideal: aprovação alta, abandono zero.", data: evolutionCharts.taxasRendimento, lines: [{ key: "aprovacao", color: "#10b981", name: "Aprovação" }, { key: "reprovacao", color: "#ef4444", name: "Reprovação" }, { key: "abandono", color: "#f59e0b", name: "Abandono" }], unit: "%" },
                        { id: "ideb", label: "IDEB", icon: <Award className="w-4 h-4" />, color: "#f59e0b", description: "Nota da escola no MEC (0–10). Combina provas SAEB e taxas de aprovação.", data: evolutionCharts.ideb, lines: [{ key: "ideb_ai", color: "#10b981", name: "Anos Iniciais" }, { key: "ideb_af", color: "#f59e0b", name: "Anos Finais" }, { key: "ideb_em", color: "#8b5cf6", name: "Ensino Médio" }] },
                        { id: "tdi", label: "Distorção Idade-Série", icon: <BarChart3 className="w-4 h-4" />, color: "#ef4444", description: "% de alunos com 2+ anos além da idade esperada para a série. Quanto menor, melhor.", data: evolutionCharts.tdi, lines: [{ key: "fund_total", color: "#ef4444", name: "Fund. Total" }, { key: "fund_af", color: "#f59e0b", name: "Fund. AF" }, { key: "medio", color: "#6366f1", name: "Médio" }], unit: "%" },
                        { id: "atu", label: "Alunos por Turma", icon: <Users className="w-4 h-4" />, color: "#6366f1", description: "Média de alunos por turma. Acima de 35 dificulta o aprendizado.", data: evolutionCharts.atu, lines: hasMultipleYears ? [{ key: "fund", color: "#0ea5e9", name: "Fund. Total" }, { key: "fund_ai", color: "#10b981", name: "Fund. AI" }, { key: "fund_af", color: "#f59e0b", name: "Fund. AF" }, { key: "medio", color: "#8b5cf6", name: "Médio" }] : [{ key: "fund", color: "#0ea5e9", name: "Fund. Total" }, { key: "fund_af", color: "#f59e0b", name: "Fund. AF" }, { key: "medio", color: "#8b5cf6", name: "Médio" }] },
                        { id: "had", label: "Horas-Aula Diária", icon: <Clock className="w-4 h-4" />, color: "#06b6d4", description: "Horas de aula por dia. MEC recomenda mín. 4h (parcial) ou 7h (integral).", data: evolutionCharts.had, lines: hasMultipleYears ? [{ key: "fund", color: "#06b6d4", name: "Fund. Total" }, { key: "fund_ai", color: "#10b981", name: "Fund. AI" }, { key: "fund_af", color: "#f59e0b", name: "Fund. AF" }, { key: "medio", color: "#ec4899", name: "Médio" }] : [{ key: "fund", color: "#06b6d4", name: "Fund. Total" }, { key: "fund_af", color: "#f59e0b", name: "Fund. AF" }, { key: "medio", color: "#ec4899", name: "Médio" }], unit: "h" },
                        { id: "dsu", label: "Docentes c/ Superior", icon: <GraduationCap className="w-4 h-4" />, color: "#10b981", description: "% de professores com diploma universitário. LDB exige formação superior.", data: evolutionCharts.dsu, lines: hasMultipleYears ? [{ key: "fund", color: "#10b981", name: "Fund. Total" }, { key: "fund_ai", color: "#0ea5e9", name: "Fund. AI" }, { key: "fund_af", color: "#f59e0b", name: "Fund. AF" }, { key: "medio", color: "#8b5cf6", name: "Médio" }] : [{ key: "fund", color: "#10b981", name: "Fund. Total" }, { key: "fund_af", color: "#f59e0b", name: "Fund. AF" }, { key: "medio", color: "#8b5cf6", name: "Médio" }], unit: "%" },
                        { id: "icg", label: "Complexidade de Gestão", icon: <BarChart3 className="w-4 h-4" />, color: "#f97316", description: "Nível 1–6 de complexidade administrativa. Leva em conta turnos, etapas e porte.", data: evolutionCharts.icg, lines: [{ key: "nivel", color: "#f97316", name: "Nível" }] },
                        { id: "ird", label: "Regularidade Docente", icon: <BarChart3 className="w-4 h-4" />, color: "#14b8a6", description: "Permanência dos professores na escola (0–5). Quanto maior, mais estabilidade pedagógica.", data: evolutionCharts.ird, lines: [{ key: "media", color: "#14b8a6", name: "Média IRD" }] },
                        { id: "inse", label: "Nível Socioeconômico", icon: <TrendingUp className="w-4 h-4" />, color: "#a855f7", description: "Perfil socioeconômico médio dos alunos. Contexto importante para planejar ações.", data: evolutionCharts.inse, lines: [{ key: "media", color: "#a855f7", name: "Média INSE" }] },
                        { id: "saeb", label: "SAEB - Proficiência", icon: <Award className="w-4 h-4" />, color: "#3b82f6", description: "Notas em Matemática e Português nas avaliações nacionais do SAEB.", data: evolutionCharts.saeb, lines: [{ key: "mt_ai", color: "#10b981", name: "Mat. AI" }, { key: "lp_ai", color: "#0ea5e9", name: "Port. AI" }, { key: "mt_af", color: "#f59e0b", name: "Mat. AF" }, { key: "lp_af", color: "#ef4444", name: "Port. AF" }, { key: "mt_em", color: "#8b5cf6", name: "Mat. EM" }, { key: "lp_em", color: "#ec4899", name: "Port. EM" }] },
                        { id: "ied", label: "Esforço Docente", icon: <GraduationCap className="w-4 h-4" />, color: "#ec4899", description: "% de professores por nível de esforço (1=menor, 6=maior — muitas turmas e escolas).", data: evolutionCharts.ied, lines: [{ key: "nivel_1", color: "#10b981", name: "Nível 1" }, { key: "nivel_2", color: "#0ea5e9", name: "Nível 2" }, { key: "nivel_3", color: "#f59e0b", name: "Nível 3" }, { key: "nivel_4", color: "#f97316", name: "Nível 4" }, { key: "nivel_5", color: "#ef4444", name: "Nível 5" }, { key: "nivel_6", color: "#7c3aed", name: "Nível 6" }], unit: "%" },
                        { id: "tnr", label: "Taxa de Não-Resposta", icon: <BarChart3 className="w-4 h-4" />, color: "#eab308", description: "% de itens em branco nas avaliações. Alta pode indicar desistências durante a prova.", data: evolutionCharts.tnr, lines: [{ key: "fund", color: "#0ea5e9", name: "Fundamental" }, { key: "med", color: "#ef4444", name: "Médio" }], unit: "%" },
                      ];
                      const available = chartOptions.filter(c => c.data && c.data.some((d: any) => c.lines.some(l => d[l.key] != null && d[l.key] !== 0)));
                      const current = available.find(c => c.id === selectedChart) || available[0];
                      if (!current) return null;

                      const latestData = current.data && current.data.length > 0 ? current.data[current.data.length - 1] : null;
                      const prevData = current.data && current.data.length > 1 ? current.data[current.data.length - 2] : null;
                      const summaryItems = current.lines.map(l => {
                        const val = latestData ? latestData[l.key] : null;
                        const prev = prevData ? prevData[l.key] : null;
                        const delta = (val != null && prev != null && prev !== 0) ? ((val - prev) / Math.abs(prev) * 100) : null;
                        return { name: l.name, color: l.color, value: val, delta };
                      }).filter(s => s.value != null && s.value !== 0);

                      return (
                        <div className="flex gap-3 items-start">
                          <div className="shrink-0 w-40 space-y-2 sticky top-4 overflow-y-auto" style={{maxHeight:'72vh'}}>
                            <div className="px-2.5 py-2 rounded-[16px_20px_16px_18px] text-[11px] font-bold leading-tight scribble" style={{background:'linear-gradient(135deg,#fff7b7 0%,#fff8db 100%)', color:'#6a5a33', border:'1px solid #e4cb74', transform:'rotate(-0.8deg)', boxShadow:'0 10px 16px rgba(100,83,46,0.07)'}}>
                              Escolha um recorte
                            </div>
                            {available.map((opt) => (
                              <button key={opt.id} className={`chart-tab-btn ${current.id === opt.id ? 'active' : ''}`}
                                onClick={() => setSelectedChart(opt.id)}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <div className="flex-1 min-w-0 relative overflow-visible" style={{background:'linear-gradient(180deg,#fffdf8 0%,#fcf8ee 100%)', border:'1px solid #eadfcb', borderRadius:'18px 24px 18px 22px', boxShadow:'0 12px 20px rgba(83,72,53,0.07)', transform:'rotate(0.3deg)'}}>
                            <div className="absolute w-14 h-3.5 rounded pointer-events-none" style={{top:'-7px', left:'22px', background:'rgba(188,218,243,0.62)', transform:'rotate(-6deg)'}}/>
                            <div className="p-4 pb-2">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-lg font-bold mb-0.5 scribble" style={{color:'#4f4126'}}>{current.label}</h4>
                                  <p className="text-sm text-muted-foreground">{current.description}</p>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 scribble" style={{background:'linear-gradient(135deg,#fff0bf 0%,#ffe39d 100%)', color:'#7c5710', border:'1px solid #e8cb7a', transform:'rotate(0.5deg)'}}>recorte do mural</span>
                              </div>
                              {summaryItems.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2.5">
                                  {summaryItems.map((s, i) => (
                                    <div key={i} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border"
                                      style={{background:'rgba(255,255,255,0.80)', borderColor:'rgba(0,0,0,0.07)', color:'#596777'}}>
                                      <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: s.color}}/>
                                      {s.name}: <span style={{color: s.color}}>{typeof s.value === 'number' ? (Number.isInteger(s.value) ? s.value.toLocaleString('pt-BR') : s.value.toLocaleString('pt-BR', {maximumFractionDigits:1})) : s.value}{current.unit||''}</span>
                                      {s.delta != null && <span className={s.delta >= 0 ? 'text-green-600' : 'text-red-500'}>{s.delta >= 0 ? '▲' : '▼'}{Math.abs(s.delta).toFixed(1)}%</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="px-3 pb-4">
                              <div className="relative rounded-[18px_26px_18px_22px] overflow-hidden" style={{background:`repeating-linear-gradient(0deg, transparent 0 31px, rgba(115,148,180,.06) 31px 32px), linear-gradient(to right, rgba(229,225,215,.40) 1px, transparent 1px) 0 0/16.666% 100%, #fffef9`, border:'1px solid #eadfcb', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.5), 0 12px 18px rgba(83,72,53,0.05)', padding:'16px 12px 8px'}}>
                                <div className="absolute w-8 h-8 pointer-events-none" style={{right:'10px',top:'10px',background:'linear-gradient(135deg, transparent 0 49%, rgba(245,232,205,.85) 50% 100%)',borderRadius:'4px',boxShadow:'-1px 1px 0 rgba(211,197,170,.7)'}}/>
                                <EvolutionChart data={current.data} lines={current.lines} unit={current.unit} large />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
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

                  const getNacionalLabel = (tipo: string): string | null => {
                    const mn = mediasNacionais as Record<string, any> | undefined;
                    if (!mn?.[tipo]) return null;
                    const d = mn[tipo];
                    switch (tipo) {
                      case 'ideb': {
                        const parts: string[] = [];
                        if (d.ideb_ai != null) parts.push(`AI: ${Number(d.ideb_ai).toFixed(1)}`);
                        if (d.ideb_af != null) parts.push(`AF: ${Number(d.ideb_af).toFixed(1)}`);
                        return parts.length > 0 ? parts.join(' | ') : null;
                      }
                      case 'taxas_rendimento': {
                        const parts: string[] = [];
                        if (d.aprovacao_fund != null) parts.push(`Aprov: ${Number(d.aprovacao_fund).toFixed(1)}%`);
                        if (d.abandono_fund != null) parts.push(`Aband: ${Number(d.abandono_fund).toFixed(1)}%`);
                        return parts.length > 0 ? parts.join(' | ') : null;
                      }
                      case 'tdi': {
                        const parts: string[] = [];
                        if (d.fundamental_total != null) parts.push(`Fund: ${Number(d.fundamental_total).toFixed(1)}%`);
                        if (d.medio_total != null) parts.push(`Médio: ${Number(d.medio_total).toFixed(1)}%`);
                        return parts.length > 0 ? parts.join(' | ') : null;
                      }
                      case 'atu': {
                        const v = d.atu_fund ?? d.fundamental_total;
                        return v != null ? `Fund: ${Number(v).toFixed(1)} alunos` : null;
                      }
                      case 'had': {
                        const v = d.had_fund ?? d.fundamental_total;
                        return v != null ? `Fund: ${Number(v).toFixed(1)}h` : null;
                      }
                      case 'dsu': {
                        const v = d.dsu_fund ?? d.fundamental_total;
                        return v != null ? `Fund: ${Number(v).toFixed(1)}%` : null;
                      }
                      case 'afd': {
                        const v = d.grupo_1 ?? d.afd_grupo_1;
                        return v != null ? `Grupo 1: ${Number(v).toFixed(1)}%` : null;
                      }
                      case 'ird': {
                        const v = d.ird_fund ?? d.media;
                        return v != null ? `${Number(v).toFixed(2)}` : null;
                      }
                      default: return null;
                    }
                  };

                  const rows = indicatorOrder
                    .map(ind => {
                      const data = indicadoresLatest[ind.key];
                      if (!data) return null;
                      const diag = getDiagnosis(ind.tipo, data);
                      if (!diag) return null;
                      const mediaNacional = getNacionalLabel(ind.tipo);
                      return { ...ind, data, diag, ano: data._ano, mediaNacional };
                    })
                    .filter(Boolean) as { tipo: string; nome: string; key: string; data: any; diag: Diagnosis; ano?: number; mediaNacional?: string | null }[];

                  const allIndicatorKeys = indicatorOrder.map(i => i.key);
                  const missingCount = allIndicatorKeys.filter(k => !indicadoresLatest[k]).length;

                  if (rows.length === 0 && missingCount === 0) return null;

                  return (
                    <Card className="card-clay">
                      <CardHeader className="pb-2">
                        <div className="section-title">
                          <div>
                            <h2>Raio-X educacional</h2>
                            <p>Indicadores mais recentes desta escola com diagnóstico automático</p>
                          </div>
                          <span className="hint-chip">🔬 {rows.length} indicador{rows.length !== 1 ? 'es' : ''}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {rows.map(row => {
                            const cfg = statusConfig[row.diag.status];
                            return (
                              <div key={row.key} className="indicator-card">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="text-sm font-bold" style={{color:'#485564'}}>
                                    {row.nome}
                                    {row.ano && <span className="text-[10px] font-normal text-muted-foreground ml-1">({row.ano})</span>}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${cfg.bg}`}>{row.diag.label}</span>
                                </div>
                                <div className="text-2xl font-bold leading-none mb-2" style={{letterSpacing:'-0.03em'}}>{row.diag.valor}</div>
                                <p className="text-xs text-muted-foreground leading-snug">{row.diag.explicacao}</p>
                                {row.mediaNacional && (
                                  <p className="text-[11px] mt-1" style={{color:'#4b7db5'}}>Média nacional: {row.mediaNacional}</p>
                                )}
                                {row.diag.secundarios && row.diag.secundarios.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {row.diag.secundarios.map((s, i) => <span key={i} className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold text-muted-foreground" style={{background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.06)'}}>{s}</span>)}
                                  </div>
                                )}
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                  expanded={expandedSections['turmas'] ?? true}
                  onToggle={() => toggleSection('turmas')}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
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
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
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
                  expanded={expandedSections['saneamento'] ?? true}
                  onToggle={() => toggleSection('saneamento')}
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Água</p>
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
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
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
                        <InfraItem label="Rede Pública" value={censoLatest.in_energia_rede_publica} />
                        <InfraItem label="Gerador Fóssil" value={censoLatest.in_energia_gerador_fossil} />
                        <InfraItem label="Renovável" value={censoLatest.in_energia_renovavel} />
                        <InfraItem label="Inexistente" value={censoLatest.in_energia_inexistente} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Esgoto</p>
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
                        <InfraItem label="Rede Pública" value={censoLatest.in_esgoto_rede_publica} />
                        <InfraItem label="Fossa Séptica" value={censoLatest.in_esgoto_fossa_septica} />
                        <InfraItem label="Fossa Comum" value={censoLatest.in_esgoto_fossa_comum} />
                        <InfraItem label="Inexistente" value={censoLatest.in_esgoto_inexistente} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Lixo</p>
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
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
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <InfoItem label="Salas Utilizadas" value={censoLatest.qt_salas_utilizadas} />
                        <InfoItem label="Salas Dentro" value={censoLatest.qt_salas_utilizadas_dentro} />
                        <InfoItem label="Salas Fora" value={censoLatest.qt_salas_utilizadas_fora} />
                        <InfoItem label="Climatizadas" value={censoLatest.qt_salas_utiliza_climatizadas} />
                        <InfoItem label="Acessíveis" value={censoLatest.qt_salas_utilizadas_acessiveis} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Espaços</p>
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
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
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
                        <InfraItem label="Banheiro" value={censoLatest.in_banheiro} />
                        <InfraItem label="Banheiro Ed. Infantil" value={censoLatest.in_banheiro_ei} />
                        <InfraItem label="Banheiro PNE" value={censoLatest.in_banheiro_pne} />
                        <InfraItem label="Banheiro Funcionários" value={censoLatest.in_banheiro_funcionarios} />
                        <InfraItem label="Chuveiro" value={censoLatest.in_banheiro_chuveiro} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Acessibilidade</p>
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
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
                  expanded={expandedSections['equipamentos'] ?? true}
                  onToggle={() => toggleSection('equipamentos')}
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Equipamentos</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
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
                  expanded={expandedSections['profissionais'] ?? true}
                  onToggle={() => toggleSection('profissionais')}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                  expanded={expandedSections['materiais'] ?? true}
                  onToggle={() => toggleSection('materiais')}
                >
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
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
                  title="Financeiro PDDE"
                  icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
                  expanded={expandedSections['financeiro'] ?? true}
                  onToggle={() => toggleSection('financeiro')}
                >
                  <div className="space-y-5">
                    {(pddeLoading || pddeSaldosLoading || pddeExecFinLoading) && (
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
                                  Contas Bancárias (PDDE Info)
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
                              <div className="space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                  Situação da UEx
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <InfoItem label="Mandato Início" value={pddeData.situacao_uex.mandato_inicio} />
                                  <InfoItem label="Mandato Fim" value={pddeData.situacao_uex.mandato_fim} />
                                  <InfoItem label="Dados Cadastrais" value={pddeData.situacao_uex.dados_cadastrais} />
                                  <InfoItem label="Prestação de Contas" value={pddeData.situacao_uex.prestacao_contas} />
                                </div>
                                {pddeData.situacao_uex.programas_pendentes && pddeData.situacao_uex.programas_pendentes.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide flex items-center gap-1 mb-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      Prestação de Contas Pendente
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {pddeData.situacao_uex.programas_pendentes.map((p, i) => (
                                        <span key={i} className="text-[10px] bg-red-50 border border-red-200 text-red-700 rounded px-2 py-0.5 font-medium">
                                          {p.ano_exercicio} — {p.programa}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {pddeCnpj && (
                              <div className="space-y-3">
                                {/* Header + Seletor Mês/Ano */}
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                    <BanknoteIcon className="w-3.5 h-3.5" />
                                    Saldo das Contas UEx (PDDEInfo)
                                  </p>
                                  <div className="flex items-center gap-1.5">
                                    <select
                                      value={saldoMesSel.split("-")[0]}
                                      onChange={e => setSaldoMesSel(`${e.target.value}-${saldoMesSel.split("-")[1]}`)}
                                      className="text-xs border border-border/50 rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                                    >
                                      {[
                                        ["01","Janeiro"],["02","Fevereiro"],["03","Março"],["04","Abril"],
                                        ["05","Maio"],["06","Junho"],["07","Julho"],["08","Agosto"],
                                        ["09","Setembro"],["10","Outubro"],["11","Novembro"],["12","Dezembro"]
                                      ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                    <select
                                      value={saldoMesSel.split("-")[1]}
                                      onChange={e => setSaldoMesSel(`${saldoMesSel.split("-")[0]}-${e.target.value}`)}
                                      className="text-xs border border-border/50 rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                                    >
                                      {Array.from({ length: new Date().getFullYear() - 2020 + 1 }, (_, i) => String(2020 + i))
                                        .reverse()
                                        .map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                  </div>
                                </div>

                                {/* Loading */}
                                {pddeUexSaldoLoading && (
                                  <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary" />
                                    Consultando saldos no PDDEInfo...
                                  </div>
                                )}

                                {/* Sem dados */}
                                {!pddeUexSaldoLoading && pddeUexSaldoData && !pddeUexSaldoData.ok && (
                                  <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 flex items-center gap-2">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                    {pddeUexSaldoData.error || "Nenhum saldo encontrado para o mês selecionado."}
                                  </div>
                                )}

                                {/* Dados disponíveis */}
                                {!pddeUexSaldoLoading && pddeUexSaldoData?.ok && pddeUexSaldoData.saldos.length > 0 && (() => {
                                  const saldos = pddeUexSaldoData.saldos;
                                  const totalConta = saldos.reduce((s, r) => s + (r.saldo_conta || 0), 0);
                                  const totalFundos = pddeUexSaldoData.total_saldo_fundos;
                                  const totalPoup = saldos.reduce((s, r) => s + (r.saldo_poupanca || 0), 0);
                                  const totalRdb = saldos.reduce((s, r) => s + (r.saldo_rdb_cdb || 0), 0);
                                  const totalGeral = pddeUexSaldoData.total_saldo_geral;
                                  const brl = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

                                  return (
                                    <div className="space-y-3">
                                      {/* Badge mês consultado */}
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5 font-semibold uppercase tracking-wide">
                                          Competência: {pddeUexSaldoData.mes.replace("-", "/")}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">{saldos.length} conta{saldos.length !== 1 ? "s" : ""} encontrada{saldos.length !== 1 ? "s" : ""}</span>
                                      </div>

                                      {/* Cards de resumo */}
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {[
                                          { label: "Saldo em Conta", value: totalConta, color: "text-blue-700", bg: "bg-blue-50/60 border-blue-100" },
                                          { label: "Saldo em Fundos", value: totalFundos, color: "text-green-700", bg: "bg-green-50/60 border-green-100" },
                                          { label: "Poupança", value: totalPoup, color: "text-amber-700", bg: "bg-amber-50/60 border-amber-100" },
                                          { label: "RDB/CDB", value: totalRdb, color: "text-purple-700", bg: "bg-purple-50/60 border-purple-100" },
                                        ].map(card => (
                                          <div key={card.label} className={`rounded-lg border px-3 py-2 ${card.bg}`}>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">{card.label}</p>
                                            <p className={`text-sm font-bold font-mono ${card.color}`}>R$ {brl(card.value)}</p>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Tabela detalhada */}
                                      <div className="overflow-x-auto rounded-lg border border-border/30">
                                        <table className="w-full text-xs">
                                          <thead>
                                            <tr className="bg-muted/40 border-b border-border/30">
                                              <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Programa</th>
                                              <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Banco</th>
                                              <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Agência</th>
                                              <th className="text-left py-2 px-3 font-semibold text-muted-foreground font-mono">Conta</th>
                                              <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Saldo Conta</th>
                                              <th className="text-right py-2 px-3 font-semibold text-green-700">Saldo Fundos</th>
                                              <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Poupança</th>
                                              <th className="text-right py-2 px-3 font-semibold text-muted-foreground">RDB/CDB</th>
                                              <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Total Linha</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {saldos.map((s, i) => (
                                              <tr key={i} className={`border-b border-border/10 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                                                <td className="py-2 px-3 font-semibold">
                                                  <span className="inline-flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                                                    {s.programa || '-'}
                                                  </span>
                                                </td>
                                                <td className="py-2 px-3 text-muted-foreground">{s.banco || '-'}</td>
                                                <td className="py-2 px-3 font-mono text-muted-foreground">{s.agencia || '-'}</td>
                                                <td className="py-2 px-3 font-mono">{s.conta || '-'}</td>
                                                <td className="py-2 px-3 text-right font-mono text-blue-700">
                                                  {(s.saldo_conta ?? 0) > 0 ? `R$ ${brl(s.saldo_conta!)}` : <span className="text-muted-foreground/50">—</span>}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-semibold text-green-700">
                                                  {(s.saldo_fundos ?? 0) > 0 ? `R$ ${brl(s.saldo_fundos!)}` : <span className="text-muted-foreground/50">—</span>}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-amber-700">
                                                  {(s.saldo_poupanca ?? 0) > 0 ? `R$ ${brl(s.saldo_poupanca!)}` : <span className="text-muted-foreground/50">—</span>}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-purple-700">
                                                  {(s.saldo_rdb_cdb ?? 0) > 0 ? `R$ ${brl(s.saldo_rdb_cdb!)}` : <span className="text-muted-foreground/50">—</span>}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-semibold">
                                                  {s.saldo_total != null && s.saldo_total > 0 ? `R$ ${brl(s.saldo_total)}` : <span className="text-muted-foreground/50">—</span>}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                          <tfoot>
                                            <tr className="bg-muted/30 border-t-2 border-border/40 font-bold">
                                              <td colSpan={4} className="py-2.5 px-3 text-xs text-right text-muted-foreground uppercase tracking-wide">Totais</td>
                                              <td className="py-2.5 px-3 text-right font-mono text-blue-700 text-xs">R$ {brl(totalConta)}</td>
                                              <td className="py-2.5 px-3 text-right font-mono text-green-700 text-xs">R$ {brl(totalFundos)}</td>
                                              <td className="py-2.5 px-3 text-right font-mono text-amber-700 text-xs">R$ {brl(totalPoup)}</td>
                                              <td className="py-2.5 px-3 text-right font-mono text-purple-700 text-xs">R$ {brl(totalRdb)}</td>
                                              <td className="py-2.5 px-3 text-right font-mono text-xs">R$ {brl(totalGeral)}</td>
                                            </tr>
                                          </tfoot>
                                        </table>
                                      </div>

                                      {/* Rodapé informativo */}
                                      <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                                        <ExternalLink className="w-3 h-3" />
                                        Fonte: PDDEInfo/FNDE — Consulta Saldo de Entidade · {saldos[0]?.uf} · {saldos[0]?.municipio}
                                      </p>
                                    </div>
                                  );
                                })()}
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

                    {cadastralLoading && selectedInep && (
                      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
                        Consultando situação cadastral...
                      </div>
                    )}

                    {cadastralData && !cadastralLoading && cadastralData.ok && cadastralData.itens.length > 0 && (() => {
                      const sc = cadastralData.itens[0];
                      const mandatoVencendo = sc.mandato_dirigente?.toLowerCase().includes("vencer") || sc.mandato_dirigente?.toLowerCase().includes("vencido");
                      const mandatoCor = sc.mandato_dirigente?.toLowerCase().includes("vencido")
                        ? "text-red-700 bg-red-50 border-red-200"
                        : mandatoVencendo
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : "text-green-700 bg-green-50 border-green-200";
                      const telefone = sc.ddd && sc.telefone ? `(${sc.ddd}) ${sc.telefone}` : sc.telefone || null;
                      return (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            Situação Cadastral no FNDE ({sc.ano})
                          </p>

                          {sc.mandato_dirigente && (
                            <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold border rounded-full px-3 py-1 ${mandatoCor}`}>
                              <Clock className="w-3 h-3" />
                              Mandato do Dirigente: {sc.mandato_dirigente}
                              {sc.data_fim_mandato && ` — vence em ${sc.data_fim_mandato}`}
                            </div>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <InfoItem label="Razão Social UEx" value={sc.razao_social} />
                            <InfoItem label="CNPJ UEx" value={sc.cnpj_uex} />
                            <InfoItem label="Rede de Atendimento" value={sc.rede_atendimento} />
                            <InfoItem label="Localização" value={sc.localizacao} />
                            <InfoItem label="Telefone" value={telefone} />
                            <InfoItem
                              label="Última Atualização Cadastral"
                              value={sc.data_atualizacao && sc.hora_atualizacao
                                ? `${sc.data_atualizacao} às ${sc.hora_atualizacao}`
                                : sc.data_atualizacao || null}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── Prestação de Contas ──────────────────────────── */}
                    {prestacaoContaLoading && selectedInep && (
                      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
                        Consultando situação de prestação de contas...
                      </div>
                    )}

                    {prestacaoContaData && !prestacaoContaLoading && prestacaoContaData.ok && prestacaoContaData.itens.length > 0 && (() => {
                      const brl = (v: string | null) => v || '-';
                      const adimplentes = prestacaoContaData.itens.filter(i => i.situacao_pc_uex?.toLowerCase().includes("adimpl"));
                      const inadimplentes = prestacaoContaData.itens.filter(i => i.situacao_pc_uex?.toLowerCase().includes("inadimpl"));
                      const suspensos = prestacaoContaData.itens.filter(i => i.suspensao_uex?.toUpperCase() === "SIM");
                      const ano = prestacaoContaData.itens[0]?.ano || String(pddeAno);
                      return (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            Situação de Prestação de Contas ({ano})
                          </p>

                          {/* Status badges summary */}
                          <div className="flex flex-wrap gap-2">
                            {inadimplentes.length > 0 ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold border rounded-full px-3 py-1 text-red-700 bg-red-50 border-red-200">
                                <AlertTriangle className="w-3 h-3" />
                                {inadimplentes.length} programa{inadimplentes.length > 1 ? "s" : ""} Inadimplente{inadimplentes.length > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold border rounded-full px-3 py-1 text-green-700 bg-green-50 border-green-200">
                                <CheckCircle className="w-3 h-3" />
                                {adimplentes.length} programa{adimplentes.length > 1 ? "s" : ""} Adimplente{adimplentes.length > 1 ? "s" : ""}
                              </span>
                            )}
                            {suspensos.length > 0 && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold border rounded-full px-3 py-1 text-orange-700 bg-orange-50 border-orange-200">
                                <AlertTriangle className="w-3 h-3" />
                                {suspensos.length} com Suspensão de Pagamento
                              </span>
                            )}
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border/30">
                                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Programa</th>
                                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Sit. PC UEx</th>
                                  <th className="text-left py-2 px-2 text-muted-foreground font-medium hidden md:table-cell">Sit. PC EEx</th>
                                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Suspensão</th>
                                  <th className="text-right py-2 px-2 text-muted-foreground font-medium hidden sm:table-cell">Valor Previsto</th>
                                </tr>
                              </thead>
                              <tbody>
                                {prestacaoContaData.itens.map((item, idx) => {
                                  const inadimpl = item.situacao_pc_uex?.toLowerCase().includes("inadimpl");
                                  const adimpl = item.situacao_pc_uex?.toLowerCase().includes("adimpl");
                                  const susp = item.suspensao_uex?.toUpperCase() === "SIM";
                                  return (
                                    <tr key={idx} className="border-b border-border/10 hover:bg-muted/20">
                                      <td className="py-2 px-2 font-medium">{item.programa || '-'}</td>
                                      <td className="py-2 px-2">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 border ${
                                          inadimpl ? "bg-red-50 text-red-700 border-red-200" :
                                          adimpl ? "bg-green-50 text-green-700 border-green-200" :
                                          "bg-muted text-muted-foreground border-border/30"
                                        }`}>
                                          {inadimpl && <AlertTriangle className="w-2.5 h-2.5" />}
                                          {adimpl && <CheckCircle className="w-2.5 h-2.5" />}
                                          {item.situacao_pc_uex || '-'}
                                        </span>
                                      </td>
                                      <td className="py-2 px-2 hidden md:table-cell text-muted-foreground">{item.situacao_pc_eex || '-'}</td>
                                      <td className="py-2 px-2">
                                        {susp ? (
                                          <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">Sim</span>
                                        ) : (
                                          <span className="text-[10px] text-muted-foreground">Não</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-2 text-right hidden sm:table-cell text-muted-foreground font-mono">
                                        {item.valor_previsto || '-'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── Situação de Atendimento (Repasses) ───────────── */}
                    {atendimentoLoading && selectedInep && (
                      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
                        Consultando repasses e valores de atendimento...
                      </div>
                    )}

                    {atendimentoData && !atendimentoLoading && atendimentoData.ok && atendimentoData.itens.length > 0 && (() => {
                      const ano = atendimentoData.itens[0]?.ano || String(pddeAno);
                      const brl = (v: number | null) => v != null ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-';
                      const totalGeral = atendimentoData.itens.reduce((s, i) => s + (i.valor_total || 0), 0);
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                              <BanknoteIcon className="w-3.5 h-3.5" />
                              Repasses por Programa ({ano})
                            </p>
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                              Total: {brl(totalGeral)}
                            </span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border/30">
                                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Programa</th>
                                  <th className="text-left py-2 px-2 text-muted-foreground font-medium hidden sm:table-cell">Destinação</th>
                                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">Custeio</th>
                                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">Capital</th>
                                  <th className="text-right py-2 px-2 text-muted-foreground font-medium font-semibold">Total</th>
                                  <th className="text-left py-2 px-2 text-muted-foreground font-medium hidden md:table-cell">Data Pgto</th>
                                </tr>
                              </thead>
                              <tbody>
                                {atendimentoData.itens.map((item, idx) => (
                                  <tr key={idx} className="border-b border-border/10 hover:bg-muted/20">
                                    <td className="py-2 px-2 font-medium">{item.programa || '-'}</td>
                                    <td className="py-2 px-2 hidden sm:table-cell text-muted-foreground">{item.destinacao || '-'}</td>
                                    <td className="py-2 px-2 text-right font-mono">{brl(item.valor_custeio)}</td>
                                    <td className="py-2 px-2 text-right font-mono">{brl(item.valor_capital)}</td>
                                    <td className={`py-2 px-2 text-right font-mono font-semibold ${item.valor_total && item.valor_total > 0 ? 'text-emerald-700' : ''}`}>
                                      {brl(item.valor_total)}
                                    </td>
                                    <td className="py-2 px-2 hidden md:table-cell text-muted-foreground">{item.data_ordem_pgto || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t border-border/40">
                                  <td colSpan={4} className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right hidden sm:table-cell">Total Geral:</td>
                                  <td colSpan={4} className="py-2 px-2 text-xs font-semibold text-right sm:hidden">Total:</td>
                                  <td className="py-2 px-2 text-right font-mono font-bold text-emerald-700">{brl(totalGeral)}</td>
                                  <td className="hidden md:table-cell" />
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      );
                    })()}

                    {pddeSaldosData && !pddeSaldosLoading && (
                      <>
                        {pddeSaldosData.ok && pddeSaldosData.saldos.length > 0 ? (
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                                <BanknoteIcon className="w-3.5 h-3.5" />
                                Saldos PDDE Básico — Dados Abertos FNDE ({pddeSaldosData.anosDisponiveis.join(', ')})
                              </p>
                              {(() => {
                                const saldosByYear = pddeSaldosData.saldos.reduce((acc: Record<number, typeof pddeSaldosData.saldos>, s) => {
                                  if (!acc[s.an_exercicio]) acc[s.an_exercicio] = [];
                                  acc[s.an_exercicio].push(s);
                                  return acc;
                                }, {});
                                const sortedYears = Object.keys(saldosByYear).map(Number).sort((a, b) => b - a);

                                const chartData = sortedYears.map(year => {
                                  const yearSaldos = saldosByYear[year];
                                  const total = yearSaldos.reduce((sum, s) => sum + s.saldo_acumulado, 0);
                                  return { ano: String(year), saldo: total };
                                }).reverse();

                                return (
                                  <div className="space-y-4">
                                    {chartData.length > 1 && (
                                      <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}k`} />
                                            <Tooltip
                                              formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Saldo']}
                                              labelFormatter={(label: string) => `Exercício ${label}`}
                                            />
                                            <Bar dataKey="saldo" fill="#2d6a4f" radius={[4, 4, 0, 0]} />
                                          </BarChart>
                                        </ResponsiveContainer>
                                      </div>
                                    )}

                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="border-b border-border/30">
                                            <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Exercício</th>
                                            <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Banco</th>
                                            <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Agência</th>
                                            <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Conta</th>
                                            <th className="text-right py-2 px-2 text-muted-foreground font-medium text-xs">Saldo Acumulado</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {sortedYears.map(year =>
                                            saldosByYear[year].map((s, idx) => (
                                              <tr key={`${year}-${idx}`} className="border-b border-border/10">
                                                <td className="py-2 px-2 text-xs font-medium">{s.an_exercicio}</td>
                                                <td className="py-2 px-2 text-xs">{s.banco || '-'}</td>
                                                <td className="py-2 px-2 text-xs font-mono">{s.agencia || '-'}</td>
                                                <td className="py-2 px-2 text-xs font-mono">{s.conta || '-'}</td>
                                                <td className={`py-2 px-2 text-xs text-right font-mono ${s.saldo_acumulado > 0 ? 'text-emerald-700 font-semibold' : s.saldo_acumulado < 0 ? 'text-red-600 font-semibold' : ''}`}>
                                                  R$ {s.saldo_acumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                              </tr>
                                            ))
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        ) : pddeSaldosData.ok === false ? (
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/50 border border-amber-200/50">
                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-amber-800">Saldos PDDE indisponíveis</p>
                              <p className="text-xs text-amber-600 mt-1">
                                {pddeSaldosData.error || "A API de dados abertos do FNDE está temporariamente indisponível."}
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}

                    {pddeSaldosError && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/50 border border-amber-200/50">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Erro ao consultar saldos PDDE</p>
                          <p className="text-xs text-amber-600 mt-1">
                            Não foi possível conectar à API de dados abertos do FNDE. Tente novamente mais tarde.
                          </p>
                        </div>
                      </div>
                    )}

                    {pddeExecFinData && !pddeExecFinLoading && (
                      <>
                        {pddeExecFinData.ok && pddeExecFinData.repasses.length > 0 ? (
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                                <Wallet className="w-3.5 h-3.5" />
                                Repasses PDDE — Execução Financeira ({pddeExecFinData.anosDisponiveis.join(', ')})
                              </p>
                              {(() => {
                                const byYear = pddeExecFinData.repasses.reduce((acc: Record<number, { custeio: number; capital: number; total: number }>, r) => {
                                  if (!acc[r.an_exercicio]) acc[r.an_exercicio] = { custeio: 0, capital: 0, total: 0 };
                                  acc[r.an_exercicio].custeio += r.vl_pago_custeio;
                                  acc[r.an_exercicio].capital += r.vl_pago_capital;
                                  acc[r.an_exercicio].total += r.vl_pago_total;
                                  return acc;
                                }, {});
                                const sortedYears = Object.keys(byYear).map(Number).sort();

                                const chartData = sortedYears.map(year => ({
                                  ano: String(year),
                                  Custeio: byYear[year].custeio,
                                  Capital: byYear[year].capital,
                                }));

                                return (
                                  <div className="space-y-4">
                                    {chartData.length > 1 && (
                                      <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}k`} />
                                            <Tooltip
                                              formatter={(value: number, name: string) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name]}
                                              labelFormatter={(label: string) => `Exercício ${label}`}
                                            />
                                            <Legend wrapperStyle={{ fontSize: 11 }} />
                                            <Bar dataKey="Custeio" fill="#2d6a4f" radius={[4, 4, 0, 0]} stackId="a" />
                                            <Bar dataKey="Capital" fill="#95d5b2" radius={[4, 4, 0, 0]} stackId="a" />
                                          </BarChart>
                                        </ResponsiveContainer>
                                      </div>
                                    )}

                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="border-b border-border/30">
                                            <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Ano</th>
                                            <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Destinação</th>
                                            <th className="text-right py-2 px-2 text-muted-foreground font-medium text-xs">Custeio</th>
                                            <th className="text-right py-2 px-2 text-muted-foreground font-medium text-xs">Capital</th>
                                            <th className="text-right py-2 px-2 text-muted-foreground font-medium text-xs">Total Pago</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {[...sortedYears].reverse().map(year =>
                                            pddeExecFinData.repasses
                                              .filter(r => r.an_exercicio === year)
                                              .map((r, idx) => (
                                                <tr key={`${year}-${idx}`} className="border-b border-border/10">
                                                  <td className="py-2 px-2 text-xs font-medium">{r.an_exercicio}</td>
                                                  <td className="py-2 px-2 text-xs">{r.sg_destinacao}</td>
                                                  <td className="py-2 px-2 text-xs text-right font-mono">
                                                    R$ {r.vl_pago_custeio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                  </td>
                                                  <td className="py-2 px-2 text-xs text-right font-mono">
                                                    R$ {r.vl_pago_capital.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                  </td>
                                                  <td className={`py-2 px-2 text-xs text-right font-mono font-semibold ${r.vl_pago_total > 0 ? 'text-emerald-700' : ''}`}>
                                                    R$ {r.vl_pago_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                  </td>
                                                </tr>
                                              ))
                                          )}
                                          <tr className="border-t-2 border-border/40 bg-muted/30">
                                            <td className="py-2 px-2 text-xs font-bold" colSpan={2}>Total Geral</td>
                                            <td className="py-2 px-2 text-xs text-right font-mono font-bold">
                                              R$ {pddeExecFinData.repasses.reduce((s, r) => s + r.vl_pago_custeio, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-2 px-2 text-xs text-right font-mono font-bold">
                                              R$ {pddeExecFinData.repasses.reduce((s, r) => s + r.vl_pago_capital, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-2 px-2 text-xs text-right font-mono font-bold text-emerald-700">
                                              R$ {pddeExecFinData.repasses.reduce((s, r) => s + r.vl_pago_total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        ) : pddeExecFinData.ok === false ? (
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200/50">
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-amber-800">Execução financeira indisponível</p>
                              <p className="text-[10px] text-amber-600 mt-0.5">
                                {pddeExecFinData.error || "A API de execução financeira do FNDE está temporariamente indisponível."}
                              </p>
                            </div>
                          </div>
                        ) : pddeExecFinData.ok && pddeExecFinData.repasses.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">
                            Sem registros de repasses PDDE para esta escola nos anos consultados (2020-2026).
                          </p>
                        ) : null}
                      </>
                    )}

                    {pddeExecFinError && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200/50">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-amber-800">Erro ao consultar execução financeira</p>
                          <p className="text-[10px] text-amber-600 mt-0.5">
                            Não foi possível conectar à API de dados abertos do FNDE. Tente novamente mais tarde.
                          </p>
                        </div>
                      </div>
                    )}


                    {!pddeLoading && !pddeSaldosLoading && !pddeExecFinLoading && (!pddeData || (!pddeData.ok && !pddeData.error)) && (!pddeSaldosData || !pddeSaldosData.ok) && (!pddeExecFinData || !pddeExecFinData.ok) && (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          Dados financeiros não disponíveis para esta escola no momento.
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/20">
                      <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                        Dados obtidos do PDDE Info e Dados Abertos do FNDE (2020-2026). Podem apresentar atraso ou indisponibilidade temporária.
                        Para dados oficiais, acesse{' '}
                        <a href="https://www.fnde.gov.br/pddeinfo/pddeinfo/escola/consultar" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">
                          PDDE Info
                        </a>{' '}ou{' '}
                        <a href="https://dados.gov.br/dados/conjuntos-dados/programa-dinheiro-direto-na-escola-pdde" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">
                          Dados Abertos PDDE
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

function EvolutionChart({ data, lines, unit, large }: { title?: string; data: any[]; lines: { key: string; color: string; name: string }[]; icon?: React.ReactNode; description?: string; unit?: string; large?: boolean }) {
  const hasData = data.some(d => lines.some(l => d[l.key] != null && d[l.key] !== 0));
  if (!hasData) return null;

  const unitSuffix = unit || '';
  const multiSeries = lines.length > 1;

  const formatValue = (value: number) => {
    if (typeof value !== 'number') return value;
    const formatted = Number.isInteger(value) ? value.toLocaleString('pt-BR') : value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    return `${formatted}${unitSuffix}`;
  };

  const renderLabel = (props: any) => {
    if (!large) return null;
    const { x, y, width, value } = props;
    if (value == null || value === 0) return null;
    const display = typeof value === 'number' ? (Number.isInteger(value) ? value.toLocaleString('pt-BR') : value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })) : value;
    return (
      <text x={x + width / 2} y={y - 4} textAnchor="middle" fontSize={10} fontWeight={600} fill="#555">
        {display}{unitSuffix}
      </text>
    );
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={large ? 300 : 140}>
        <BarChart data={data} margin={{ top: large ? 25 : 5, right: 5, bottom: 5, left: -10 }} barCategoryGap={large ? "25%" : "30%"}>
          <defs>
            {lines.map((line) => (
              <linearGradient key={`bg-${line.key}`} id={`bg-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={line.color} stopOpacity={1} />
                <stop offset="100%" stopColor={line.color} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          {large && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.5} />}
          <XAxis dataKey="ano" tick={{ fontSize: large ? 13 : 10, fontWeight: large ? 600 : 400 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: large ? 11 : 9 }} tickFormatter={(v) => `${v}${unitSuffix}`} axisLine={false} tickLine={false} width={50} />
          <Tooltip
            formatter={(value: number, name: string) => [formatValue(value), name]}
            labelFormatter={(label) => `${label}`}
            contentStyle={{ borderRadius: "12px", border: "none", fontSize: large ? "13px" : "11px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: "10px 14px", background: "white" }}
            cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 4 }}
          />
          {multiSeries && <Legend iconType="circle" iconSize={large ? 10 : 8} wrapperStyle={{ fontSize: large ? "12px" : "10px", paddingTop: 8 }} />}
          {lines.map((line) => (
            <Bar key={line.key} dataKey={line.key} fill={`url(#bg-${line.key})`} name={line.name} radius={[6, 6, 0, 0]} maxBarSize={large ? 44 : 32} label={large && lines.length <= 2 ? renderLabel : undefined} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatCard({ icon, value, label, color, delta }: { icon: React.ReactNode; value: string; label: string; color: string; delta?: number }) {
  return (
    <div className={`px-3 py-2 rounded-xl ${color} border border-border/10`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-lg font-bold">{value}</span>
        {delta != null && delta !== 0 && (
          <span className={`text-[10px] font-semibold ml-auto ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toLocaleString('pt-BR')}
          </span>
        )}
      </div>
      <p className="text-[10px] font-medium text-muted-foreground leading-tight mt-0.5">{label}</p>
    </div>
  );
}

function IndicatorSection({ title, icon, expanded = true, onToggle, children }: {
  title: string; icon: React.ReactNode; expanded?: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <Card className="card-clay">
      <CardHeader className="pb-2 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 text-muted-foreground">{icon}</span>
            <span className="mural-section-h2">{title}</span>
          </div>
          <span className="text-muted-foreground shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
  const displayValue = typeof value === 'number' ? (Number.isInteger(value) ? value.toLocaleString('pt-BR') : value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })) : String(value);
  const isZero = value === 0;
  return (
    <div className={`flex items-baseline justify-between gap-2 px-3 py-2 rounded-lg border ${highlight ? 'bg-accent/5 border-accent/20' : 'bg-card border-border/40'}`}>
      <span className="text-xs text-muted-foreground leading-tight">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${isZero ? 'text-muted-foreground/40' : highlight ? 'text-accent' : 'text-emerald-700'}`}>{displayValue}</span>
    </div>
  );
}

function InfraItem({ label, value }: { label: string; value: number | undefined | null }) {
  if (value === undefined || value === null) return null;
  const yes = value === 1;
  return (
    <div className="flex items-center gap-2 py-1 px-2">
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${yes ? 'bg-green-500' : 'bg-red-300'}`} />
      <span className={`text-xs ${yes ? 'text-foreground' : 'text-muted-foreground/60 line-through decoration-muted-foreground/30'}`}>{label}</span>
    </div>
  );
}
