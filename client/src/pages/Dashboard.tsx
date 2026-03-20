import { useState, useMemo, useRef, useEffect } from "react";
import { BrazilMap } from "@/components/BrazilMap";
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
import { useSchoolSearch, useSchool, useEscolaEvolucao, useEstatisticas, useListaEscolas, useMediasNacionais, useEscolaComparativo, useEscolaDiagnostico, useUfStats } from "@/hooks/use-schools";
import { usePddeInfo, usePddeSaldos, usePddeExecFin, usePddeUexSaldo, usePddeSituacaoCadastral, usePddePrestacaoConta, usePddeAtendimento } from "@/hooks/use-pdde";
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


// Cores pastel para os estados do mapa
const PASTEL_COLORS = [
  '#ffb3ba', // rosa vivo
  '#ffdfba', // laranja claro
  '#ffffba', // amarelo claro
  '#baffc9', // verde claro
  '#bae1ff', // azul claro
  '#b5ead7', // verde água
  '#c7ceea', // azul lavanda
  '#e2f0cb', // verde limão
  '#f3c6e8', // lilás
  '#f7b6d2', // rosa chiclete
  '#f9e2ae', // amarelo pastel
  '#e0c3fc', // roxo claro
  '#c2f0fc', // azul piscina
  '#f6dfeb', // rosa bebê
  '#f7f7b6', // amarelo vivo
  '#d4f1f4', // azul gelo
  '#f9c6c9', // rosa coral
  '#f6eac2', // amarelo manteiga
  '#e0eafc', // azul céu
  '#f7d9c4', // pêssego
  '#d5c6f0', // violeta suave
  '#c8ead8', // verde salvia
  '#fce4b4', // amarelo abacaxi
  '#f0d0e8', // rosa mallow
  '#cce5ff', // azul bebê
  '#d0f0c0', // verde pistache
  '#ffd6e0'  // rosa claro
];

/* cores fixas por sigla — garantem distinção independente do ranking */
const STATE_FIXED_COLORS: Record<string, string> = {
  MT: "#d4554a",  /* terracota — se destaca dos vizinhos AM/GO/MS */
  RO: "#e8a825",  /* âmbar dourado — se destaca dos vizinhos AM/AC/PA */
};

// Paleta para gráficos de pizza
const PIE_COLORS = ["#2d6a4f", "#40916c", "#74c69d", "#b7e4c7"];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [schoolTabs, setSchoolTabs] = useState<Array<{id: string, label: string, inep: string}>>([]);
  const [activeTabId, setActiveTabId] = useState<string>("overview");
  const [selectedAno, setSelectedAno] = useState(2024);
  const selectedInep = activeTabId === "overview" ? null : (schoolTabs.find(t => t.id === activeTabId)?.inep || null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedChart, setSelectedChart] = useState("matriculas");
  const [activeSchoolTab, setActiveSchoolTab] = useState<"alunos" | "etapas" | "docentes" | "infra">("alunos");
  const [filterUf, setFilterUf] = useState("");
  const [filterDep, setFilterDep] = useState("");
  const [listPage, setListPage] = useState(1);
  const [clickedUf, setClickedUf] = useState<string | null>(null);
  const [saldoMesSel, setSaldoMesSel] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  });

  const { data: stats, isLoading: statsLoading } = useEstatisticas(selectedAno);
  const { data: ufStatsData, isLoading: ufStatsLoading } = useUfStats(clickedUf, selectedAno);
  const { data: searchResults, refetch: refetchSearch, isLoading: searchLoading } = useSchoolSearch(searchQuery);
  const { data: evolucaoData, isLoading: evolucaoLoading } = useEscolaEvolucao(selectedInep || "");
  const { data: mediasNacionais } = useMediasNacionais(selectedAno);
  const { data: comparativoData } = useEscolaComparativo(selectedInep || "");
  const { data: diagnosticoData } = useEscolaDiagnostico(selectedInep || "");
  const [pddeAno, setPddeAno] = useState<number>(new Date().getFullYear());
  const { data: pddeData, isLoading: pddeLoading } = usePddeInfo(selectedInep, pddeAno);
  const pddeCnpj = pddeData?.uex?.cnpj || null;
  const { data: pddeSaldosData, isLoading: pddeSaldosLoading, isError: pddeSaldosError } = usePddeSaldos(selectedInep);
  const { data: pddeExecFinData, isLoading: pddeExecFinLoading, isError: pddeExecFinError } = usePddeExecFin(selectedInep);
  const { data: pddeUexSaldoData, isLoading: pddeUexSaldoLoading } = usePddeUexSaldo(pddeCnpj, { mes: saldoMesSel });
  const { data: cadastralData, isLoading: cadastralLoading } = usePddeSituacaoCadastral(selectedInep, pddeAno);
  const { data: prestacaoContaData, isLoading: prestacaoContaLoading } = usePddePrestacaoConta(selectedInep, pddeAno);
  const { data: atendimentoData, isLoading: atendimentoLoading } = usePddeAtendimento(selectedInep, pddeAno);
  const { data: sigpcData, isLoading: sigpcLoading } = useSigpcLocalizar(pddeCnpj || undefined, pddeAno);
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setPddeAno(new Date().getFullYear());
  }, [selectedInep]);

  const selectSchool = (inep: string, name?: string) => {
    const tabId = `school-${inep}`;
    setSchoolTabs(prev => {
      if (prev.find(t => t.id === tabId)) return prev;
      return [...prev, { id: tabId, label: name || `INEP ${inep}`, inep }];
    });
    setActiveTabId(tabId);
    setSearchQuery("");
  };

  const closeTab = (tabId: string) => {
    setSchoolTabs(prev => prev.filter(t => t.id !== tabId));
    if (activeTabId === tabId) setActiveTabId("overview");
  };

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    if (/^\d{8}$/.test(q)) {
      selectSchool(q);
    } else {
      refetchSearch();
    }
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
          <div className="flex items-center gap-2">
            <select
              value={selectedAno}
              onChange={(e) => setSelectedAno(Number(e.target.value))}
              className="text-sm bg-background border border-border/50 rounded-lg px-3 py-2"
            >
              {[2024, 2023, 2022, 2021, 2020].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* ABAS ESTILO CHROME */}
        {schoolTabs.length > 0 && (
          <div className="flex items-end gap-0.5 mt-4 -mb-px overflow-x-auto" style={{scrollbarWidth:'none'}}>
            {/* Aba Visão Geral */}
            <button
              onClick={() => setActiveTabId("overview")}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl border border-border/60 transition-all shrink-0"
              style={{
                background: activeTabId === "overview" ? "var(--background, #fff)" : "#f1f5f9",
                borderBottom: activeTabId === "overview" ? "2px solid var(--background, #fff)" : "1px solid #e2e8f0",
                color: activeTabId === "overview" ? "#1e3a5f" : "#64748b",
                fontWeight: activeTabId === "overview" ? 700 : 500,
                zIndex: activeTabId === "overview" ? 2 : 1,
                marginBottom: activeTabId === "overview" ? "-1px" : 0,
              }}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Visão Geral
            </button>
            {/* Abas de escolas */}
            {schoolTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className="flex items-center gap-2 pl-4 pr-2 py-2.5 text-sm font-medium rounded-t-xl border border-border/60 transition-all group shrink-0 max-w-[220px]"
                style={{
                  background: activeTabId === tab.id ? "var(--background, #fff)" : "#f1f5f9",
                  borderBottom: activeTabId === tab.id ? "2px solid var(--background, #fff)" : "1px solid #e2e8f0",
                  color: activeTabId === tab.id ? "#1e3a5f" : "#64748b",
                  fontWeight: activeTabId === tab.id ? 700 : 500,
                  zIndex: activeTabId === tab.id ? 2 : 1,
                  marginBottom: activeTabId === tab.id ? "-1px" : 0,
                }}
              >
                <School className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
                <span
                  onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
                  className="ml-1 p-0.5 rounded-full hover:bg-black/10 opacity-50 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <X className="w-3 h-3" />
                </span>
              </button>
            ))}
          </div>
        )}
        {/* Linha divisória abaixo das abas */}
        {schoolTabs.length > 0 && (
          <div className="border-b border-border/60 -mt-0.5 mb-2" />
        )}

        <div className="space-y-6">
            {/* BUSCA DE ESCOLA */}
            {!selectedInep && <Card className="card-clay" style={{background:'linear-gradient(135deg,#f0f7ff 0%,#e8f5e9 100%)',border:'1.5px solid #c8dff7',position:'relative',zIndex:20,overflow:'visible',transform:'none'}}>
              <CardContent className="p-5" style={{overflow:'visible'}}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-1" style={{color:'#2d5a88'}}>🏫 Buscar minha escola</p>
                    <p className="text-xs text-muted-foreground mb-3">Digite o nome ou o código INEP (8 dígitos) para ver o painel completo</p>
                    {/* Wrapper com ref para fechar dropdown ao clicar fora */}
                    <div ref={searchContainerRef} className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <input
                            className="w-full pl-9 pr-3 h-10 rounded-xl text-sm border border-border/50 bg-white outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="Nome da escola ou código INEP (8 dígitos)"
                            value={searchQuery}
                            autoComplete="off"
                            onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                            onFocus={() => { if (searchQuery.length >= 2) setShowDropdown(true); }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { handleSearch(); setShowDropdown(false); }
                              if (e.key === 'Escape') { setShowDropdown(false); setSearchQuery(""); }
                            }}
                          />
                        </div>
                        <button
                          onClick={() => { handleSearch(); setShowDropdown(false); }}
                          className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-semibold text-white shrink-0"
                          style={{background:'#2d5a88'}}
                        >
                          Buscar <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* DROPDOWN AUTOCOMPLETE */}
                      {showDropdown && searchQuery.length >= 2 && (
                        <div
                          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-2xl overflow-hidden"
                          style={{
                            background: '#fff',
                            border: '1.5px solid #c8dff7',
                            boxShadow: '0 8px 32px 0 rgba(45,90,136,0.13), 0 2px 8px 0 rgba(0,0,0,0.07)',
                          }}
                        >
                          {/* Loading */}
                          {searchLoading && (
                            <div className="flex items-center gap-2.5 px-4 py-3.5 text-sm text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                              <span>Buscando escolas...</span>
                            </div>
                          )}

                          {/* Resultados */}
                          {!searchLoading && searchResults?.dados && searchResults.dados.length > 0 && (
                            <>
                              <div className="px-4 pt-2.5 pb-1 flex items-center justify-between">
                                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{color:'#2d5a88',opacity:0.7}}>
                                  {searchResults.dados.length} escola(s) encontrada(s)
                                </span>
                                <button
                                  onMouseDown={e => e.preventDefault()}
                                  onClick={() => { setSearchQuery(""); setShowDropdown(false); }}
                                  className="p-1 rounded-full hover:bg-blue-50 text-muted-foreground"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="max-h-72 overflow-y-auto divide-y divide-blue-50">
                                {searchResults.dados.map((result: any, idx: number) => (
                                  <button
                                    key={result.co_entidade}
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => { selectSchool(String(result.co_entidade), result.no_entidade); setShowDropdown(false); }}
                                    className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors group"
                                    style={{background: idx % 2 === 0 ? '#fff' : '#f7faff'}}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#eef4ff')}
                                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f7faff')}
                                  >
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{background:'#e8f0fb'}}>
                                      <School className="w-3.5 h-3.5" style={{color:'#2d5a88'}} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm text-foreground truncate">{result.no_entidade}</p>
                                      <p className="text-[11px] text-muted-foreground truncate">
                                        {result.no_municipio}/{result.sg_uf} · {result.ds_dependencia}
                                        {result.qt_matriculas > 0 && ` · ${result.qt_matriculas.toLocaleString('pt-BR')} alunos`}
                                      </p>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 text-blue-300 shrink-0 group-hover:text-blue-500 transition-colors" />
                                  </button>
                                ))}
                              </div>
                            </>
                          )}

                          {/* Sem resultados */}
                          {!searchLoading && searchResults?.dados && searchResults.dados.length === 0 && (
                            <div className="px-4 py-5 text-center text-sm text-muted-foreground">
                              <Search className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
                              Nenhuma escola encontrada para "<strong>{searchQuery}</strong>"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>}

            {/* RESUMO EXECUTIVO */}
            {!selectedInep && stats && (
              <section className="section">
                <div className="summary-grid">
                  <div className="metric theme-blue">
                    <label className="block text-xs font-semibold mb-1.5" style={{color:'#6b7785'}}>Escolas</label>
                    <strong className="block text-3xl font-bold leading-none" style={{letterSpacing:'-0.04em'}}>{formatNumber(stats.total_escolas)}</strong>
                  </div>
                  <div className="metric theme-yellow">
                    <label className="block text-xs font-semibold mb-1.5" style={{color:'#6b7785'}}>Matrículas</label>
                    <strong className="block text-3xl font-bold leading-none" style={{letterSpacing:'-0.04em'}}>{formatNumber(stats.total_matriculas)}</strong>
                  </div>
                  <div className="metric theme-green">
                    <label className="block text-xs font-semibold mb-1.5" style={{color:'#6b7785'}}>Docentes</label>
                    <strong className="block text-3xl font-bold leading-none" style={{letterSpacing:'-0.04em'}}>{formatNumber(stats.total_docentes)}</strong>
                  </div>
                  <div className="metric theme-purple">
                    <label className="block text-xs font-semibold mb-1.5" style={{color:'#6b7785'}}>Estados</label>
                    <strong className="block text-3xl font-bold leading-none" style={{letterSpacing:'-0.04em'}}>{Object.keys(stats.por_uf || {}).length}</strong>
                  </div>
                </div>
              </section>
            )}

            {/* BILHETE DA DIRETORA */}
            {!selectedInep && stats && (
              <section className="section postit-row" style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                gap: '32px',
                margin: '48px 0 24px 0',
                maxWidth: '740px',
                width: '100%',
              }}>
                {/* Post-it Bilhete da Diretora */}
                <div
                  className="postit-card postit-card-wrap"
                  style={{
                    background: 'linear-gradient(135deg, #fffbe7 80%, #ffe066 100%)',
                    border: '2.5px solid #ffe066',
                    borderRadius: '22px',
                    boxShadow: '0 4px 18px 0 #ffe06655, 0 1.5px 0 #ffe066 inset',
                    minWidth: 260,
                    maxWidth: 340,
                    padding: '22px 22px 18px 22px',
                    position: 'relative',
                    fontFamily: 'inherit',
                    margin: '0 auto',
                  }}
                >
                  <div style={{marginBottom:'10px',textAlign:'center'}}>
                    <span className="scribble" style={{fontSize:'15px',color:'#b59f3b',background:'#fffbe7',padding:'2px 10px',borderRadius:'10px'}}>Bilhete da Diretora</span>
                  </div>
                  <div style={{fontSize:'15px',color:'#4f4126',lineHeight:1.6,textAlign:'center'}}>
                    <strong style={{fontSize:'17px',color:'#4f4126'}}>Diretora, aqui está o raio-x nacional da educação!</strong>
                    <p style={{margin:'8px 0 0',fontSize:'14px',color:'#3d4d5a'}}>
                      Dados do Censo Escolar <strong>{selectedAno}</strong> — abrangendo {Object.keys(stats.por_uf || {}).length} estados, <strong>{formatNumber(stats.total_escolas)}</strong> escolas, <strong>{formatNumber(stats.total_matriculas)}</strong> matrículas e <strong>{formatNumber(stats.total_docentes)}</strong> docentes.
                    </p>
                  </div>
                  {/* desenho removido */}
                </div>
                {/* Post-it Situação das Escolas */}
                <div
                  className="postit-card postit-card-wrap"
                  style={{
                    background: 'linear-gradient(135deg, #e0f7fa 80%, #b2ebf2 100%)',
                    border: '2.5px solid #4dd0e1',
                    borderRadius: '22px',
                    boxShadow: '0 4px 18px 0 #4dd0e155, 0 1.5px 0 #b2ebf2 inset',
                    minWidth: 260,
                    maxWidth: 340,
                    padding: '22px 22px 18px 22px',
                    position: 'relative',
                    fontFamily: 'inherit',
                    margin: '0 auto',
                  }}
                >
                  <div style={{marginBottom:'10px',textAlign:'center'}}>
                    <span className="scribble" style={{fontSize:'15px',color:'#00838f',background:'#e0f7fa',padding:'2px 10px',borderRadius:'10px'}}>Situação das Escolas</span>
                  </div>
                  <div style={{fontSize:'15px',color:'#006064',lineHeight:1.6,textAlign:'center'}}>
                    <strong style={{fontSize:'17px',color:'#006064'}}>Total de escolas: {formatNumber(stats.total_escolas)}</strong>
                    <p style={{margin:'8px 0 0',fontSize:'14px',color:'#006064'}}>
                      Matrículas: <strong>{formatNumber(stats.total_matriculas)}</strong><br/>
                      Docentes: <strong>{formatNumber(stats.total_docentes)}</strong>
                    </p>
                  </div>
                  {/* desenho removido */}
                </div>
              </section>
            )}
            {!selectedInep && statsLoading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-3" />
                <p className="text-muted-foreground">Carregando estatísticas...</p>
              </div>
            ) : !selectedInep && stats ? (
              <>
                {/* ...existing code... */}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                  <div className="lg:col-span-2 space-y-4">
                    <Card className="card-clay">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Globe className="w-4 h-4 text-accent" />
                          Mapa Interativo do Brasil
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <BrazilMap
                          ufStats={ufChartData.reduce((acc, item, idx) => {
                            acc[item.uf] = {
                              name: item.name,
                              escolas: item.escolas,
                              color: STATE_FIXED_COLORS[item.uf] ?? PASTEL_COLORS[idx % PASTEL_COLORS.length]
                            };
                            return acc;
                          }, {} as Record<string, { name: string; escolas: number; color: string }>)}
                          selectedUf={evolucaoData?.escola?.sg_uf ?? null}
                          clickedUf={clickedUf}
                          onStateClick={(uf) => {
                            setClickedUf(prev => prev === uf ? null : uf);
                            setFilterUf(uf);
                            setFilterDep("");
                            setListPage(1);
                          }}
                        />
                      </CardContent>
                    </Card>

                    {/* Painel de detalhes do estado clicado */}
                    {clickedUf && (
                      <Card className="card-clay border-blue-200">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-blue-500" />
                              {UF_NAMES[clickedUf] || clickedUf}
                              {evolucaoData?.escola?.sg_uf === clickedUf && (
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">⭐ Estado da sua escola</span>
                              )}
                            </CardTitle>
                            <button onClick={() => setClickedUf(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {ufStatsLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                              <Loader2 className="w-4 h-4 animate-spin" /> Carregando dados do estado...
                            </div>
                          ) : ufStatsData ? (
                            <div className="space-y-4">
                              {/* Números principais */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-blue-50 rounded-xl p-3 text-center">
                                  <div className="text-2xl font-bold text-blue-700">{ufStatsData.total_escolas?.toLocaleString("pt-BR")}</div>
                                  <div className="text-xs text-blue-600 mt-0.5">escolas</div>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                  <div className="text-2xl font-bold text-emerald-700">{ufStatsData.total_matriculas?.toLocaleString("pt-BR")}</div>
                                  <div className="text-xs text-emerald-600 mt-0.5">matrículas</div>
                                </div>
                              </div>

                              {/* Por dependência */}
                              {ufStatsData.por_dependencia && Object.keys(ufStatsData.por_dependencia).length > 0 && (
                                <div>
                                  <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Por rede</div>
                                  <div className="space-y-1.5">
                                    {Object.entries(ufStatsData.por_dependencia as Record<string, number>)
                                      .sort(([,a],[,b]) => b - a)
                                      .map(([dep, n]) => {
                                        const total = ufStatsData.total_escolas || 1;
                                        const pct = Math.round((n / total) * 100);
                                        const colors: Record<string, string> = { Municipal: "#3b82f6", Estadual: "#8b5cf6", Federal: "#f59e0b", Privada: "#10b981" };
                                        const color = colors[dep] || "#6b7280";
                                        return (
                                          <div key={dep}>
                                            <div className="flex justify-between text-xs mb-0.5">
                                              <span>{dep}</span>
                                              <span className="font-medium">{(n as number).toLocaleString("pt-BR")} ({pct}%)</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                              <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full transition-all" />
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              )}

                              {/* Rural vs Urbana */}
                              {ufStatsData.por_localizacao && (
                                <div className="flex gap-2">
                                  {Object.entries(ufStatsData.por_localizacao as Record<string, number>).map(([loc, n]) => (
                                    <div key={loc} className={`flex-1 rounded-xl p-2 text-center text-xs ${loc === "Rural" ? "bg-green-50" : "bg-sky-50"}`}>
                                      <div className="font-bold text-sm">{(n as number).toLocaleString("pt-BR")}</div>
                                      <div className="text-muted-foreground">{loc}</div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Top municípios */}
                              {ufStatsData.top_municipios?.length > 0 && (
                                <div>
                                  <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Municípios com mais escolas</div>
                                  <div className="space-y-1">
                                    {ufStatsData.top_municipios.slice(0, 5).map((m: any, i: number) => (
                                      <div key={m.municipio} className="flex justify-between items-center text-xs py-0.5">
                                        <span className="flex items-center gap-1.5">
                                          <span className="text-muted-foreground w-4 text-right">{i + 1}.</span>
                                          <span className="font-medium truncate max-w-[120px]">{m.municipio}</span>
                                        </span>
                                        <span className="text-muted-foreground">{m.escolas} escolas</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground py-2">Sem dados disponíveis para {clickedUf}.</p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                  </div>

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


              </>
            ) : null}


            {false && (
              <>
                <Card className="card-clay">
                  <CardContent className="p-4">
                    {/* Barra de busca */}
                    <div className="flex flex-col md:flex-row gap-3 mb-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Busque por nome ou código INEP (8 dígitos)..."
                          className="pl-10 bg-background border-border/50 h-11 rounded-xl"
                          value={searchQuery}
                          autoFocus
                          onChange={(e) => { setSearchQuery(e.target.value); }}
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

                    {/* Filtros */}
                    <div className="flex flex-wrap items-center gap-2">
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

                {/* Resultados da busca — lista fixa abaixo da barra */}
                {searchLoading && (
                  <div className="flex items-center gap-2 px-1 py-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Buscando escolas...
                  </div>
                )}
                {!searchLoading && searchResults && searchResults.dados && searchResults.dados.length > 0 && (
                  <Card className="card-clay">
                    <CardContent className="p-0">
                      <div className="px-4 py-2.5 border-b border-border/20 flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {searchResults.dados.length} escola(s) encontrada(s)
                        </span>
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setSearchQuery("")}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="divide-y divide-border/20 max-h-96 overflow-y-auto">
                        {searchResults.dados.map((result: any) => (
                          <button
                            key={result.co_entidade}
                            className="w-full text-left px-4 py-3.5 hover:bg-accent/5 transition-colors flex justify-between items-center group"
                            onClick={() => {
                              selectSchool(String(result.co_entidade));
                              setSearchQuery(result.no_entidade);
                            }}
                          >
                            <div>
                              <p className="font-semibold text-sm group-hover:text-accent transition-colors">{result.no_entidade}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                INEP {result.co_entidade} · {result.no_municipio}/{result.sg_uf} · {result.ds_dependencia}
                                {result.qt_matriculas > 0 && ` · ${result.qt_matriculas.toLocaleString('pt-BR')} alunos`}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2 group-hover:text-accent transition-colors" />
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {!searchLoading && searchQuery.length >= 2 && searchResults && searchResults.dados && searchResults.dados.length === 0 && (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Nenhuma escola encontrada para "<strong>{searchQuery}</strong>"
                  </div>
                )}
              </>
            )}

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
              (() => {
                const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                const criticals = alertasPreocupantes.filter(a => a.tipo === 'critical');
                const warnings = alertasPreocupantes.filter(a => a.tipo === 'warning');
                const total = alertasPreocupantes.length;
                const extractVal = (titulo: string) => { const m = titulo.match(/:\s*([\d,\.]+\s*%?)(\s*(?:alunos\/turma|h\/dia|h))?$/); return m ? m[1] + (m[2] || '') : null; };
                const cleanTitle = (titulo: string) => titulo.replace(/:\s*[\d,\.]+\s*(?:%|alunos\/turma|h\/dia|h)?\s*$/, '').replace(/:\s*Nível\s*\d+\s*$/, '');
                const ch = evolutionCharts;
                const available = [
                  { id: 'matriculas', label: 'Matrículas', icon: '👩‍🎓', data: evolucaoData.anos_disponiveis.slice().sort((a:number,b:number)=>a-b).map((a: number) => ({ ano: String(a), Matrículas: evolucaoData.censo_por_ano[a]?.qt_mat_bas || 0 })), lines: [{ key: 'Matrículas', color: '#2d5a88', name: 'Matrículas' }], desc: 'Total de alunos matriculados em todos os níveis de ensino.' },
                  { id: 'docentes', label: 'Docentes', icon: '🧑‍🏫', data: evolucaoData.anos_disponiveis.slice().sort((a:number,b:number)=>a-b).map((a: number) => ({ ano: String(a), Docentes: evolucaoData.censo_por_ano[a]?.qt_doc_bas || evolucaoData.censo_por_ano[a]?.qt_docentes || 0 })), lines: [{ key: 'Docentes', color: '#9b6a16', name: 'Docentes' }], desc: 'Número de professores atuando na educação básica.' },
                  { id: 'turmas', label: 'Turmas', icon: '🏫', data: evolucaoData.anos_disponiveis.slice().sort((a:number,b:number)=>a-b).map((a: number) => ({ ano: String(a), Turmas: evolucaoData.censo_por_ano[a]?.qt_tur_bas || evolucaoData.censo_por_ano[a]?.qt_turmas || 0 })), lines: [{ key: 'Turmas', color: '#2f7a58', name: 'Turmas' }], desc: 'Total de turmas da educação básica.' },
                  ...(ch?.ideb ? [{ id: 'ideb', label: 'IDEB', icon: '⭐', data: ch.ideb.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'AI': d.ideb_ai, 'AF': d.ideb_af, 'Médio': d.ideb_em })), lines: [{ key: 'AI', color: '#2d5a88', name: 'Anos Iniciais' },{ key: 'AF', color: '#9b6a16', name: 'Anos Finais' },{ key: 'Médio', color: '#2f7a58', name: 'Ensino Médio' }], desc: 'IDEB por etapa de ensino (escala 0–10, meta ≥ 6,0).' }] : []),
                  ...(ch?.taxasRendimento ? [{ id: 'rendimento', label: 'Rendimento', icon: '📊', data: ch.taxasRendimento.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'Aprovação': d.aprovacao, 'Reprovação': d.reprovacao, 'Abandono': d.abandono })), lines: [{ key: 'Aprovação', color: '#2f7a58', name: 'Aprovação' },{ key: 'Reprovação', color: '#b74f42', name: 'Reprovação' },{ key: 'Abandono', color: '#c47a1f', name: 'Abandono' }], desc: 'Taxas de aprovação, reprovação e abandono escolar (%).' }] : []),
                  ...(ch?.tdi ? [{ id: 'tdi', label: 'Dist. Idade', icon: '📅', data: ch.tdi.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'Fundamental': d.fund_total, 'Médio': d.medio })), lines: [{ key: 'Fundamental', color: '#2d5a88', name: 'Fundamental' },{ key: 'Médio', color: '#9b6a16', name: 'Médio' }], desc: 'TDI — % de alunos com 2 ou mais anos de defasagem idade-série.' }] : []),
                  ...(ch?.atu ? [{ id: 'atu', label: 'Alunos/Turma', icon: '🏃', data: ch.atu.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'Fundamental': d.fund, 'Médio': d.medio })), lines: [{ key: 'Fundamental', color: '#2d5a88', name: 'Fundamental' },{ key: 'Médio', color: '#9b6a16', name: 'Médio' }], desc: 'ATU — Média de alunos por turma.' }] : []),
                  ...(ch?.had ? [{ id: 'had', label: 'Horas/Dia', icon: '⏰', data: ch.had.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'Fundamental': d.fund, 'Médio': d.medio })), lines: [{ key: 'Fundamental', color: '#2d5a88', name: 'Fundamental' },{ key: 'Médio', color: '#9b6a16', name: 'Médio' }], desc: 'HAD — Horas-aula diárias médias.' }] : []),
                  ...(ch?.dsu ? [{ id: 'dsu', label: 'Doc. c/ Superior', icon: '🎓', data: ch.dsu.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'Fundamental': d.fund, 'Médio': d.medio })), lines: [{ key: 'Fundamental', color: '#2d5a88', name: 'Fundamental' },{ key: 'Médio', color: '#9b6a16', name: 'Médio' }], desc: 'DSU — % de docentes com ensino superior completo.' }] : []),
                  ...(ch?.inse ? [{ id: 'inse', label: 'INSE', icon: '🏠', data: ch.inse.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'INSE': d.media })), lines: [{ key: 'INSE', color: '#7c5cbf', name: 'INSE Médio' }], desc: 'INSE — Índice Socioeconômico médio dos estudantes (escala I–VIII).' }] : []),
                  ...(ch?.saeb ? [{ id: 'saeb', label: 'SAEB', icon: '📝', data: ch.saeb.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'Mat. AI': d.mt_ai, 'Port. AI': d.lp_ai, 'Mat. AF': d.mt_af, 'Port. AF': d.lp_af })), lines: [{ key: 'Mat. AI', color: '#2d5a88', name: 'Mat. AI' },{ key: 'Port. AI', color: '#9b6a16', name: 'Port. AI' },{ key: 'Mat. AF', color: '#2f7a58', name: 'Mat. AF' },{ key: 'Port. AF', color: '#b74f42', name: 'Port. AF' }], desc: 'SAEB — Proficiência em Matemática e Língua Portuguesa.' }] : []),
                  ...(ch?.icg ? [{ id: 'icg', label: 'Complexidade', icon: '⚙️', data: ch.icg.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'ICG': d.nivel })), lines: [{ key: 'ICG', color: '#c47a1f', name: 'Nível ICG' }], desc: 'ICG — Complexidade de Gestão (1–6). Maior = mais complexo.' }] : []),
                  ...(ch?.ird ? [{ id: 'ird', label: 'Regularidade Doc.', icon: '🔄', data: ch.ird.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'IRD': d.media })), lines: [{ key: 'IRD', color: '#2f7a58', name: 'IRD Médio' }], desc: 'IRD — Regularidade Docente (1–5). Maior = mais estável.' }] : []),
                ].filter(c => c.data.some((d: Record<string, any>) => Object.values(d).slice(1).some((v: any) => v != null && Number(v) > 0)));
                const currentChart = available.find(c => c.id === selectedChart) || available[0];
                return (
              <>
                {/* ── HERO ── */}
                <section className="hero">
                  <div className="hero-inner">
                    <div>
                      <div className="eyebrow">
                        <span className="scribble">📘 Censo Escolar {latestAno} · INEP/MEC</span>
                      </div>
                      <h1 style={{margin:'12px 0 8px',fontSize:'clamp(20px,3vw,34px)',lineHeight:'1.06',letterSpacing:'-0.04em'}}>
                        {evolucaoData.escola.no_entidade}
                      </h1>
                      <p style={{margin:0,color:'var(--m-muted)',fontSize:'14px',lineHeight:'1.6'}}>
                        Dados do Censo Escolar {latestAno} — código INEP <strong>{selectedInep}</strong>
                      </p>
                      <div style={{marginTop:'12px',display:'flex',gap:'8px',flexWrap:'wrap'}}>
                        <div className="tag-label">dados INEP/MEC</div>
                        <div className="tag-label scribble">raio-x educacional</div>
                      </div>
                      <div className="school-meta">
                        <div className="meta-chip">📍 {evolucaoData.escola.no_municipio}/{evolucaoData.escola.sg_uf}</div>
                        <div className="meta-chip">🏷 INEP {selectedInep}</div>
                        <div className="meta-chip">🏢 {evolucaoData.escola.ds_dependencia}</div>
                        <div className="meta-chip">{evolucaoData.escola.ds_localizacao}</div>
                        <div className="meta-chip">✅ {evolucaoData.escola.ds_situacao}</div>
                        {evolucaoData.anos_disponiveis.length > 0 && (
                          <div className="meta-chip">📅 {Math.min(...evolucaoData.anos_disponiveis)}–{Math.max(...evolucaoData.anos_disponiveis)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* ── RESUMO EXECUTIVO ── */}
                <section className="section">
                  <div className="section-title">
                    <div><h2>Resumo executivo</h2><p>Os números que ajudam a entender a escola imediatamente</p></div>
                    <div className="hint-chip">Leitura rápida para gestão</div>
                  </div>
                  <div className="organic-divider" />
                  {(() => {
                    const THEMES = ['theme-blue','theme-yellow','theme-green','theme-purple','theme-pink','theme-teal'];
                    const METRICS = [
                      { label: `Matrículas ${latestAno}`, val: censoLatest.qt_mat_bas || 0, prev: censoPrev?.qt_mat_bas || 0, icon: '👩‍🎓' },
                      { label: `Docentes ${latestAno}`, val: censoLatest.qt_doc_bas || censoLatest.qt_docentes || 0, prev: censoPrev ? (censoPrev.qt_doc_bas || censoPrev.qt_docentes || 0) : 0, icon: '🧑‍🏫' },
                      { label: `Turmas ${latestAno}`, val: censoLatest.qt_tur_bas || censoLatest.qt_turmas || 0, prev: censoPrev ? (censoPrev.qt_tur_bas || censoPrev.qt_turmas || 0) : 0, icon: '🏫' },
                      { label: 'Salas utilizadas', val: censoLatest.qt_salas_utilizadas || 0, prev: censoPrev?.qt_salas_utilizadas || 0, icon: '🚪' },
                      { label: 'Pontos de atenção', val: total, prev: null, icon: criticals.length > 0 ? '⚠️' : total > 0 ? '◌' : '✅', extra: total === 0 ? 'Tudo certo' : `${criticals.length} crítico(s)` },
                      { label: 'Status PDDE', val: pddeData?.ok ? (prestacaoContaData?.ok && prestacaoContaData.itens.every((it:any)=>it.situacao_pc_uex?.toLowerCase().includes('adimpl')) ? '✅' : 'Ver') : '—', prev: null, icon: '💸', extra: prestacaoContaData?.ok && prestacaoContaData.itens.length > 0 ? `${prestacaoContaData.itens.length} programa(s)` : pddeData?.ok ? 'Ativo' : 'Sem dados' },
                    ];
                    return (
                      <div className="summary-grid">
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
                </section>

                {/* ── FICHA GERAL ── */}
                <section className="section">
                  <div className="section-title">
                    <div><h2>Ficha geral da escola</h2><p>Identidade e vida organizacional</p></div>
                  </div>
                  <div className="organic-divider" />
                  <div className="two-col">
                    <div className="soft-card theme-blue">
                      <div className="attention-head"><span>🏫</span><strong>Identidade</strong></div>
                      <div className="row-list" style={{marginTop:'10px'}}>
                        {[
                          ['Situação', censoLatest.ds_situacao],
                          ['Dependência', censoLatest.ds_dependencia],
                          ['Localização', censoLatest.ds_localizacao],
                          ['Região', censoLatest.no_regiao],
                          ['Município', censoLatest.no_municipio],
                          ['UF', censoLatest.sg_uf],
                          ['Código IBGE', censoLatest.co_municipio],
                          ['Regulamentação', censoLatest.tp_regulamentacao === 1 ? 'Sim' : censoLatest.tp_regulamentacao === 2 ? 'Em tramitação' : censoLatest.tp_regulamentacao === 3 ? 'Não' : null],
                          ['Alimentação', censoLatest.in_alimentacao === 1 ? 'Sim' : censoLatest.in_alimentacao === 0 ? 'Não' : null],
                          ['Prédio escolar', censoLatest.in_local_func_predio_escolar === 1 ? 'Sim' : censoLatest.in_local_func_predio_escolar === 0 ? 'Não' : null],
                        ].filter(([,v]) => v != null).map(([k, v], i) => (
                          <div key={i} className="row-item">
                            <span style={{color:'var(--m-muted)',fontSize:'13px'}}>{k}</span>
                            <strong style={{fontSize:'13px'}}>{String(v)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="soft-card theme-yellow">
                      <div className="attention-head"><span>⚙️</span><strong>Vida organizacional</strong></div>
                      <div className="row-list" style={{marginTop:'10px'}}>
                        {[
                          ['Conselho Escolar', censoLatest.in_orgao_conselho_escolar === 1 ? 'Sim' : censoLatest.in_orgao_conselho_escolar === 0 ? 'Não' : null],
                          ['APM / APP', censoLatest.in_orgao_ass_pais_mestres === 1 ? 'Sim' : censoLatest.in_orgao_ass_pais_mestres === 0 ? 'Não' : null],
                          ['Grêmio Estudantil', censoLatest.in_orgao_gremio_estudantil === 1 ? 'Sim' : censoLatest.in_orgao_gremio_estudantil === 0 ? 'Não' : null],
                          ['Redes Sociais', censoLatest.in_redes_sociais === 1 ? 'Sim' : censoLatest.in_redes_sociais === 0 ? 'Não' : null],
                          ['Ed. Ambiental', censoLatest.in_educ_ambiental === 1 ? 'Sim' : censoLatest.in_educ_ambiental === 0 ? 'Não' : null],
                          ['AEE', censoLatest.tp_aee === 1 ? 'Na própria escola' : censoLatest.tp_aee === 2 ? 'Em outra escola' : censoLatest.tp_aee === 3 ? 'Em inst. especializada' : censoLatest.tp_aee === 0 ? 'Não oferece' : null],
                          ['Sala Atend. Especial', censoLatest.in_sala_atendimento_especial === 1 ? 'Sim' : censoLatest.in_sala_atendimento_especial === 0 ? 'Não' : null],
                          ['Internet', censoLatest.in_internet === 1 ? 'Sim' : censoLatest.in_internet === 0 ? 'Não' : null],
                          ['Banda Larga', censoLatest.in_banda_larga === 1 ? 'Sim' : censoLatest.in_banda_larga === 0 ? 'Não' : null],
                          ['Biblioteca', censoLatest.in_biblioteca === 1 ? 'Sim' : censoLatest.in_biblioteca === 0 ? 'Não' : null],
                        ].filter(([,v]) => v != null).map(([k, v], i) => (
                          <div key={i} className="row-item">
                            <span style={{color:'var(--m-muted)',fontSize:'13px'}}>{k}</span>
                            <strong style={{fontSize:'13px'}}>{String(v)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* ── PONTOS DE ATENÇÃO ── */}
                <section className="section">
                  <div className="priority-layout">
                    <div className="soft-card">
                      <div className="panel-head">
                        <h3 style={{margin:'0 0 4px',fontSize:'20px',letterSpacing:'-0.03em'}}>Pontos de atenção</h3>
                        <p style={{margin:0,color:'var(--m-muted)',fontSize:'13px'}}>Indicadores que merecem acompanhamento especial</p>
                      </div>
                      {total === 0 ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl mt-4" style={{background:'#eef7f1',border:'1px solid #c7e8d6'}}>
                          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                          <p style={{fontSize:'13px',color:'#2f7a58',margin:0}}>Diretora, os indicadores desta escola estão dentro das faixas esperadas!</p>
                        </div>
                      ) : (
                        <div className="alert-grid" style={{marginTop:'14px'}}>
                          {[...criticals, ...warnings].map((alerta, i) => {
                            const mv = extractVal(alerta.titulo);
                            const ct = cleanTitle(alerta.titulo);
                            return (
                              <div key={i} className={`alert-sticker ${alerta.tipo === 'critical' ? 'critical' : ''}`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <p style={{fontSize:'13px',fontWeight:700,lineHeight:'1.3',margin:0}}>{ct}</p>
                                  <span className={`severity ${alerta.tipo === 'critical' ? 'critical' : 'attn'}`}>
                                    {alerta.tipo === 'critical' ? 'Crítico' : 'Atenção'}
                                  </span>
                                </div>
                                {mv && <strong style={{display:'block',fontSize:'26px',lineHeight:1,letterSpacing:'-0.04em',marginBottom:'6px'}}>{mv}</strong>}
                                <p style={{fontSize:'12px',color:'#6b7785',lineHeight:'1.5',margin:0}}>{alerta.descricao}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="soft-card">
                      <div className="panel-head">
                        <h3 style={{margin:'0 0 4px',fontSize:'20px',letterSpacing:'-0.03em'}}>Bilhete da Diretora</h3>
                        <p style={{margin:0,color:'var(--m-muted)',fontSize:'13px'}}>Resumo personalizado para orientar a gestão</p>
                      </div>
                      <div className="auto-text-card" style={{marginTop:'14px',fontSize:'14px',color:'#3d4d5a',lineHeight:1.6}}>
                        <strong className="scribble" style={{fontSize:'16px',color:'#4f4126'}}>Diretora, aqui está o raio-x completo desta escola!</strong>
                        <p style={{margin:'6px 0 0'}}>
                          Dados do Censo Escolar <strong>{latestAno}</strong> — {evolucaoData.escola.no_municipio}/{evolucaoData.escola.sg_uf}.
                          Com <strong>{censoLatest.qt_mat_bas?.toLocaleString('pt-BR') || '—'}</strong> matrículas e <strong>{(censoLatest.qt_doc_bas || censoLatest.qt_docentes)?.toLocaleString('pt-BR') || '—'}</strong> docentes.
                        </p>
                        {total > 0 && (
                          <p style={{margin:'6px 0 0',color:'#9b6a16'}}>Há <strong>{total} ponto{total !== 1 ? 's' : ''} de atenção</strong>, sendo {criticals.length} crític{criticals.length !== 1 ? 'os' : 'o'}.</p>
                        )}
                      </div>
                      <div className="snapshot-grid" style={{marginTop:'14px'}}>
                        {[
                          { label: 'Matrículas', val: censoLatest.qt_mat_bas, icon: '👩‍🎓' },
                          { label: 'Docentes', val: censoLatest.qt_doc_bas || censoLatest.qt_docentes, icon: '🧑‍🏫' },
                          { label: 'Turmas', val: censoLatest.qt_tur_bas || censoLatest.qt_turmas, icon: '🏫' },
                          { label: 'Salas', val: censoLatest.qt_salas_utilizadas, icon: '🚪' },
                        ].map((s, i) => (
                          <div key={i} className="mini-card">
                            <span style={{fontSize:'18px'}}>{s.icon}</span>
                            <strong style={{fontSize:'22px',lineHeight:1,display:'block',marginTop:'4px'}}>{s.val != null ? s.val.toLocaleString('pt-BR') : '—'}</strong>
                            <label style={{fontSize:'11px',color:'var(--m-muted)',display:'block',marginTop:'4px'}}>{s.label}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* ── RAIO-X EDUCACIONAL ── */}
                {Object.keys(indicadoresLatest).length > 0 && (
                  <section className="section">
                    <div className="section-title">
                      <div><h2>Raio-X educacional</h2><p>Indicadores calculados com base no Censo Escolar e SAEB</p></div>
                      <div className="hint-chip">Comparação com médias nacionais</div>
                    </div>
                    <div className="organic-divider" />
                    <IndicatorPanel indicadores={indicadoresLatest} mediasNacionais={mediasNacionais} />
                  </section>
                )}

                {/* ── COMPARATIVO IDEB (escola vs município / UF / Brasil) ── */}
                {comparativoData && (
                  <section className="section">
                    <div className="section-title">
                      <div><h2>Posição no ranking</h2><p>IDEB da escola comparado ao município, estado e Brasil</p></div>
                      <div className="hint-chip">Fonte: Railway · {comparativoData.municipio?.nome}/{comparativoData.uf?.sg}</div>
                    </div>
                    <div className="organic-divider" />
                    {(['ai','af','em'] as const).some(etapa => comparativoData.escola[`ideb_${etapa}`] != null) ? (
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'14px'}}>
                        {(['ai','af','em'] as const).map(etapa => {
                          const labels: Record<string,string> = { ai:'Anos Iniciais', af:'Anos Finais', em:'Ensino Médio' };
                          const key = `ideb_${etapa}` as const;
                          const escola = comparativoData.escola[key];
                          if (escola == null) return null;
                          const mun = comparativoData.municipio[key];
                          const uf = comparativoData.uf[key];
                          const br = comparativoData.brasil[key];
                          const fmt = (v: number | null) => v != null ? Number(v).toFixed(1) : '—';
                          const diff = (ref: number | null) => {
                            if (ref == null || escola == null) return null;
                            const d = escola - ref;
                            return d >= 0 ? `+${d.toFixed(1)}` : d.toFixed(1);
                          };
                          const color = (ref: number | null) => {
                            if (ref == null || escola == null) return 'var(--m-muted)';
                            return escola >= ref ? '#2f7a58' : '#c0392b';
                          };
                          return (
                            <div key={etapa} className="soft-card" style={{padding:'16px 18px'}}>
                              <div style={{fontWeight:700,fontSize:'13px',marginBottom:'10px',color:'var(--m-text)'}}>{labels[etapa]}</div>
                              <div style={{fontSize:'34px',fontWeight:800,letterSpacing:'-0.04em',color:'var(--m-text)',marginBottom:'12px'}}>{fmt(escola)}</div>
                              {[
                                { label: comparativoData.municipio?.nome || 'Município', val: mun },
                                { label: comparativoData.uf?.sg || 'Estado', val: uf },
                                { label: 'Brasil', val: br },
                              ].map(row => (
                                <div key={row.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'12px',marginBottom:'5px'}}>
                                  <span style={{color:'var(--m-muted)'}}>{row.label}</span>
                                  <span style={{fontWeight:600}}>
                                    {fmt(row.val)}
                                    {row.val != null && escola != null && (
                                      <span style={{marginLeft:'5px',color:color(row.val),fontSize:'11px'}}>{diff(row.val)}</span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{color:'var(--m-muted)',fontSize:'13px'}}>Dados de IDEB não disponíveis para comparativo.</p>
                    )}
                  </section>
                )}

                {/* ── DIAGNÓSTICO DA ESCOLA ── */}
                {diagnosticoData && (diagnosticoData.pontos_fortes.length > 0 || diagnosticoData.pontos_atencao.length > 0 || diagnosticoData.leituras.length > 0) && (
                  <section className="section">
                    <div className="section-title">
                      <div><h2>Diagnóstico da escola</h2><p>Pontos fortes e de atenção identificados automaticamente</p></div>
                    </div>
                    <div className="organic-divider" />
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'14px'}}>
                      {diagnosticoData.pontos_fortes.length > 0 && (
                        <div className="soft-card" style={{padding:'16px 18px',borderLeft:'3px solid #2f7a58'}}>
                          <div style={{fontWeight:700,fontSize:'13px',marginBottom:'10px',color:'#2f7a58'}}>✅ Pontos fortes</div>
                          <ul style={{listStyle:'none',margin:0,padding:0,display:'flex',flexDirection:'column',gap:'7px'}}>
                            {diagnosticoData.pontos_fortes.map((p: string, i: number) => (
                              <li key={i} style={{fontSize:'13px',lineHeight:1.4,color:'var(--m-text)'}}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {diagnosticoData.pontos_atencao.length > 0 && (
                        <div className="soft-card" style={{padding:'16px 18px',borderLeft:'3px solid #c0392b'}}>
                          <div style={{fontWeight:700,fontSize:'13px',marginBottom:'10px',color:'#c0392b'}}>⚠️ Pontos de atenção</div>
                          <ul style={{listStyle:'none',margin:0,padding:0,display:'flex',flexDirection:'column',gap:'7px'}}>
                            {diagnosticoData.pontos_atencao.map((p: string, i: number) => (
                              <li key={i} style={{fontSize:'13px',lineHeight:1.4,color:'var(--m-text)'}}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {diagnosticoData.leituras.length > 0 && (
                        <div className="soft-card" style={{padding:'16px 18px',borderLeft:'3px solid #2d5a88'}}>
                          <div style={{fontWeight:700,fontSize:'13px',marginBottom:'10px',color:'#2d5a88'}}>📊 Leituras dos dados</div>
                          <ul style={{listStyle:'none',margin:0,padding:0,display:'flex',flexDirection:'column',gap:'7px'}}>
                            {diagnosticoData.leituras.map((p: string, i: number) => (
                              <li key={i} style={{fontSize:'13px',lineHeight:1.4,color:'var(--m-text)'}}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* ── GALERIA DE GRÁFICOS ── */}
                {currentChart && available.length > 0 && (
                  <section className="section">
                    <div className="section-title">
                      <div><h2>Galeria de gráficos</h2><p>Evolução dos indicadores ao longo dos anos</p></div>
                      <div className="hint-chip">Clique na ficha para trocar</div>
                    </div>
                    <div className="organic-divider" />
                    <div className="chart-wall">
                      <div className="chart-menu">
                        {available.map(c => (
                          <button
                            key={c.id}
                            className={`chart-tab ${selectedChart === c.id ? 'active' : ''}`}
                            onClick={() => setSelectedChart(c.id)}
                          >
                            <span className="chart-tab-icon">{c.icon}</span>
                            <span className="chart-tab-label">{c.label}</span>
                          </button>
                        ))}
                        <div className="chart-menu-note">
                          💡 Selecione uma aba para ver a evolução anual do indicador.
                        </div>
                      </div>
                      <div className="chart-stage">
                        <div className="chart-board active soft-card" style={{padding:'20px'}}>
                          <div className="chart-header">
                            <div>
                              <h4>{currentChart.icon} {currentChart.label}</h4>
                              <p>{currentChart.desc}</p>
                              <div className="chip-row">
                                {evolucaoData.anos_disponiveis.slice().sort((a:number,b:number)=>a-b).map((a: number) => (
                                  <span key={a} className="mini-chip">{a}</span>
                                ))}
                              </div>
                            </div>
                            <div className="big-stat">
                              <strong>{currentChart.data[currentChart.data.length - 1]?.[currentChart.lines[0].key]?.toLocaleString('pt-BR') || '—'}</strong>
                              <span>{latestAno}</span>
                            </div>
                          </div>
                          <div style={{height:'260px'}}>
                            <EvolutionChart data={currentChart.data} lines={currentChart.lines} large />
                          </div>
                          <div className="chart-note">
                            📝 Dados do Censo Escolar INEP/MEC · código {selectedInep}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* ── RETRATO DA ESCOLA — TABS ── */}
                <section className="section">
                  <div className="section-title">
                    <div><h2>Retrato da escola</h2><p>Dados detalhados do Censo Escolar {latestAno} por tema</p></div>
                  </div>
                  <div className="organic-divider" />
                  <div className="soft-card" style={{padding:0,overflow:'hidden'}}>
                    <div className="tab-head">
                      <h3 style={{margin:'0 0 4px',fontSize:'18px',letterSpacing:'-0.03em'}}>Dados do Censo Escolar {latestAno}</h3>
                      <p style={{margin:0,color:'var(--m-muted)',fontSize:'13px'}}>Navegue pelas abas para explorar diferentes dimensões</p>
                    </div>
                    <div className="tab-buttons-v6">
                      {(['alunos', 'etapas', 'docentes', 'infra'] as const).map(tab => (
                        <button
                          key={tab}
                          className={`tab-button ${activeSchoolTab === tab ? 'active' : ''}`}
                          onClick={() => setActiveSchoolTab(tab)}
                        >
                          {tab === 'alunos' ? '👩‍🎓 Alunos' : tab === 'etapas' ? '📚 Etapas' : tab === 'docentes' ? '🧑‍🏫 Docentes' : '🏫 Infraestrutura'}
                        </button>
                      ))}
                    </div>
                    {activeSchoolTab === 'alunos' && (
                      <div className="tab-panel-v6 active">
                        <div className="two-col">
                          <div className="space-y-3">
                            <div className="list-card">
                              <h4>Por Turno</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                <div className="row-item"><span>Diurno</span><strong>{censoLatest.qt_mat_bas_d ?? '—'}</strong></div>
                                <div className="row-item"><span>Noturno</span><strong>{censoLatest.qt_mat_bas_n ?? '—'}</strong></div>
                                <div className="row-item"><span>EAD</span><strong>{censoLatest.qt_mat_bas_ead ?? '—'}</strong></div>
                              </div>
                            </div>
                            <div className="list-card">
                              <h4>Por Sexo</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                <div className="row-item"><span>Feminino</span><strong>{censoLatest.qt_mat_bas_fem ?? '—'}</strong></div>
                                <div className="row-item"><span>Masculino</span><strong>{censoLatest.qt_mat_bas_masc ?? '—'}</strong></div>
                                <div className="row-item"><span>Não declarado</span><strong>{censoLatest.qt_mat_bas_nd ?? '—'}</strong></div>
                              </div>
                            </div>
                            <div className="list-card">
                              <h4>Por Cor/Raça</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                <div className="row-item"><span>Branca</span><strong>{censoLatest.qt_mat_bas_branca ?? '—'}</strong></div>
                                <div className="row-item"><span>Preta</span><strong>{censoLatest.qt_mat_bas_preta ?? '—'}</strong></div>
                                <div className="row-item"><span>Parda</span><strong>{censoLatest.qt_mat_bas_parda ?? '—'}</strong></div>
                                <div className="row-item"><span>Amarela</span><strong>{censoLatest.qt_mat_bas_amarela ?? '—'}</strong></div>
                                <div className="row-item"><span>Indígena</span><strong>{censoLatest.qt_mat_bas_indigena ?? '—'}</strong></div>
                              </div>
                            </div>
                            <div className="list-card">
                              <h4>Transporte &amp; Zona</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                <div className="row-item"><span>Zona Urbana</span><strong>{censoLatest.qt_mat_zr_urb ?? '—'}</strong></div>
                                <div className="row-item"><span>Zona Rural</span><strong>{censoLatest.qt_mat_zr_rur ?? '—'}</strong></div>
                                <div className="row-item"><span>Transporte Público</span><strong>{censoLatest.qt_transp_publico ?? '—'}</strong></div>
                                <div className="row-item"><span>Resp. Estadual</span><strong>{censoLatest.qt_transp_resp_est ?? '—'}</strong></div>
                                <div className="row-item"><span>Resp. Municipal</span><strong>{censoLatest.qt_transp_resp_mun ?? '—'}</strong></div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="mini-grid-3">
                              {[
                                { label: '0 a 3 anos', val: censoLatest.qt_mat_bas_0_3, icon: '🍼' },
                                { label: '4 a 5 anos', val: censoLatest.qt_mat_bas_4_5, icon: '🧸' },
                                { label: '6 a 10 anos', val: censoLatest.qt_mat_bas_6_10, icon: '📏' },
                                { label: '11 a 14 anos', val: censoLatest.qt_mat_bas_11_14, icon: '📐' },
                                { label: '15 a 17 anos', val: censoLatest.qt_mat_bas_15_17, icon: '📘' },
                                { label: '18+ anos', val: censoLatest.qt_mat_bas_18_mais, icon: '🎓' },
                              ].map((f, i) => (
                                <div key={i} className="fact">
                                  <label>{f.icon} {f.label}</label>
                                  <strong>{f.val != null ? f.val.toLocaleString('pt-BR') : '—'}</strong>
                                </div>
                              ))}
                            </div>
                            <div className="list-card">
                              <h4>Educação Especial</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                <div className="row-item"><span>Total Matrículas</span><strong>{censoLatest.qt_mat_esp ?? '—'}</strong></div>
                                <div className="row-item"><span>Classes Comuns</span><strong>{censoLatest.qt_mat_esp_cc ?? '—'}</strong></div>
                                <div className="row-item"><span>Classes Exclusivas</span><strong>{censoLatest.qt_mat_esp_ce ?? '—'}</strong></div>
                              </div>
                            </div>
                            <div className="list-card">
                              <h4>Tempo integral</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                <div className="row-item"><span>Infantil Integral</span><strong>{censoLatest.qt_mat_inf_int ?? '—'}</strong></div>
                                <div className="row-item"><span>Fund. AI Integral</span><strong>{censoLatest.qt_mat_fund_ai_int ?? '—'}</strong></div>
                                <div className="row-item"><span>Fund. AF Integral</span><strong>{censoLatest.qt_mat_fund_af_int ?? '—'}</strong></div>
                                <div className="row-item"><span>Médio Integral</span><strong>{censoLatest.qt_mat_med_int ?? '—'}</strong></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeSchoolTab === 'etapas' && (
                      <div className="tab-panel-v6 active">
                        <div className="two-col">
                          <div className="space-y-3">
                            <div className="list-card">
                              <h4>Educação Infantil</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                <div className="row-item"><span>Creche</span><strong>{censoLatest.qt_mat_inf_cre ?? '—'}</strong></div>
                                <div className="row-item"><span>Pré-escola</span><strong>{censoLatest.qt_mat_inf_pre ?? '—'}</strong></div>
                                <div className="row-item"><span>Integral</span><strong>{censoLatest.qt_mat_inf_int ?? '—'}</strong></div>
                              </div>
                            </div>
                            <div className="list-card">
                              <h4>Ensino Fundamental</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                <div className="row-item"><span>Anos Iniciais</span><strong>{censoLatest.qt_mat_fund_ai ?? '—'}</strong></div>
                                <div className="row-item"><span>1º ano</span><strong>{censoLatest.qt_mat_fund_ai_1 ?? '—'}</strong></div>
                                <div className="row-item"><span>2º ano</span><strong>{censoLatest.qt_mat_fund_ai_2 ?? '—'}</strong></div>
                                <div className="row-item"><span>3º ano</span><strong>{censoLatest.qt_mat_fund_ai_3 ?? '—'}</strong></div>
                                <div className="row-item"><span>4º ano</span><strong>{censoLatest.qt_mat_fund_ai_4 ?? '—'}</strong></div>
                                <div className="row-item"><span>5º ano</span><strong>{censoLatest.qt_mat_fund_ai_5 ?? '—'}</strong></div>
                                <div className="row-item"><span>Anos Finais</span><strong>{censoLatest.qt_mat_fund_af ?? '—'}</strong></div>
                                <div className="row-item"><span>6º ano</span><strong>{censoLatest.qt_mat_fund_af_6 ?? '—'}</strong></div>
                                <div className="row-item"><span>7º ano</span><strong>{censoLatest.qt_mat_fund_af_7 ?? '—'}</strong></div>
                                <div className="row-item"><span>8º ano</span><strong>{censoLatest.qt_mat_fund_af_8 ?? '—'}</strong></div>
                                <div className="row-item"><span>9º ano</span><strong>{censoLatest.qt_mat_fund_af_9 ?? '—'}</strong></div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="list-card">
                              <h4>Ensino Médio, EJA e Profissional</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                <div className="row-item"><span>Ensino Médio</span><strong>{censoLatest.qt_mat_med ?? '—'}</strong></div>
                                <div className="row-item"><span>1ª série</span><strong>{censoLatest.qt_mat_med_prop_1 ?? '—'}</strong></div>
                                <div className="row-item"><span>2ª série</span><strong>{censoLatest.qt_mat_med_prop_2 ?? '—'}</strong></div>
                                <div className="row-item"><span>3ª série</span><strong>{censoLatest.qt_mat_med_prop_3 ?? '—'}</strong></div>
                                <div className="row-item"><span>Médio Integral</span><strong>{censoLatest.qt_mat_med_int ?? '—'}</strong></div>
                                <div className="row-item"><span>Ed. Profissional</span><strong>{censoLatest.qt_mat_prof ?? '—'}</strong></div>
                                <div className="row-item"><span>EJA Fund.</span><strong>{censoLatest.qt_mat_eja_fund ?? '—'}</strong></div>
                                <div className="row-item"><span>EJA Médio</span><strong>{censoLatest.qt_mat_eja_med ?? '—'}</strong></div>
                              </div>
                            </div>
                            <div className="list-card">
                              <h4>Etapas oferecidas</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                {[
                                  ['Ed. Infantil', censoLatest.in_inf],
                                  ['Creche', censoLatest.in_inf_cre],
                                  ['Pré-escola', censoLatest.in_inf_pre],
                                  ['Ensino Fund.', censoLatest.in_fund],
                                  ['Fund. AI', censoLatest.in_fund_ai],
                                  ['Fund. AF', censoLatest.in_fund_af],
                                  ['Ensino Médio', censoLatest.in_med],
                                  ['Ed. Profissional', censoLatest.in_prof],
                                  ['EJA', censoLatest.in_eja],
                                  ['Ed. Especial', censoLatest.in_esp],
                                ].filter(([,v]) => v != null).map(([k, v], i) => (
                                  <div key={i} className="row-item">
                                    <span>{String(k)}</span>
                                    <strong style={{color: v === 1 ? '#2f7a58' : '#b74f42'}}>{v === 1 ? '✅ Sim' : '✗ Não'}</strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeSchoolTab === 'docentes' && (
                      <div className="tab-panel-v6 active">
                        <div className="two-col">
                          <div className="space-y-3">
                            <div className="list-card">
                              <h4>Docentes por nível</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                <div className="row-item"><span>Total</span><strong>{censoLatest.qt_doc_bas ?? '—'}</strong></div>
                                <div className="row-item"><span>Ed. Infantil</span><strong>{censoLatest.qt_doc_inf ?? '—'}</strong></div>
                                <div className="row-item"><span>Inf. Creche</span><strong>{censoLatest.qt_doc_inf_cre ?? '—'}</strong></div>
                                <div className="row-item"><span>Inf. Pré</span><strong>{censoLatest.qt_doc_inf_pre ?? '—'}</strong></div>
                                <div className="row-item"><span>Fundamental</span><strong>{censoLatest.qt_doc_fund ?? '—'}</strong></div>
                                <div className="row-item"><span>Fund. AI</span><strong>{censoLatest.qt_doc_fund_ai ?? '—'}</strong></div>
                                <div className="row-item"><span>Fund. AF</span><strong>{censoLatest.qt_doc_fund_af ?? '—'}</strong></div>
                                <div className="row-item"><span>Ensino Médio</span><strong>{censoLatest.qt_doc_med ?? '—'}</strong></div>
                                <div className="row-item"><span>Ed. Profissional</span><strong>{censoLatest.qt_doc_prof ?? '—'}</strong></div>
                                <div className="row-item"><span>EJA</span><strong>{censoLatest.qt_doc_eja ?? '—'}</strong></div>
                                <div className="row-item"><span>Ed. Especial</span><strong>{censoLatest.qt_doc_esp ?? '—'}</strong></div>
                              </div>
                            </div>
                            <div className="list-card">
                              <h4>Turmas por nível</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                <div className="row-item"><span>Total</span><strong>{censoLatest.qt_tur_bas ?? '—'}</strong></div>
                                <div className="row-item"><span>Ed. Infantil</span><strong>{censoLatest.qt_tur_inf ?? '—'}</strong></div>
                                <div className="row-item"><span>Fundamental</span><strong>{censoLatest.qt_tur_fund ?? '—'}</strong></div>
                                <div className="row-item"><span>Fund. AI</span><strong>{censoLatest.qt_tur_fund_ai ?? '—'}</strong></div>
                                <div className="row-item"><span>Fund. AF</span><strong>{censoLatest.qt_tur_fund_af ?? '—'}</strong></div>
                                <div className="row-item"><span>Ensino Médio</span><strong>{censoLatest.qt_tur_med ?? '—'}</strong></div>
                                <div className="row-item"><span>EJA</span><strong>{censoLatest.qt_tur_eja ?? '—'}</strong></div>
                                <div className="row-item"><span>Diurnas</span><strong>{censoLatest.qt_tur_bas_d ?? '—'}</strong></div>
                                <div className="row-item"><span>Noturnas</span><strong>{censoLatest.qt_tur_bas_n ?? '—'}</strong></div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="list-card">
                              <h4>Profissionais não docentes</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                {[
                                  ['Administrativos', censoLatest.qt_prof_administrativos],
                                  ['Serviços Gerais', censoLatest.qt_prof_servicos_gerais],
                                  ['Bibliotecários', censoLatest.qt_prof_bibliotecario],
                                  ['Saúde', censoLatest.qt_prof_saude],
                                  ['Coordenadores', censoLatest.qt_prof_coordenador],
                                  ['Nutricionistas', censoLatest.qt_prof_nutricionista],
                                  ['Psicólogos', censoLatest.qt_prof_psicologo],
                                  ['Fonoaudiólogos', censoLatest.qt_prof_fonaudiologo],
                                  ['Secretários', censoLatest.qt_prof_secretario],
                                  ['Segurança', censoLatest.qt_prof_seguranca],
                                  ['Monitores', censoLatest.qt_prof_monitores],
                                  ['Gestão', censoLatest.qt_prof_gestao],
                                  ['Assistentes Sociais', censoLatest.qt_prof_assist_social],
                                  ['Trad. Libras', censoLatest.qt_prof_trad_libras],
                                ].filter(([,v]) => v != null).map(([k, v], i) => (
                                  <div key={i} className="row-item">
                                    <span>{String(k)}</span>
                                    <strong>{String(v)}</strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="list-card">
                              <h4>Materiais pedagógicos</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                {[
                                  ['Multimídia', censoLatest.in_material_ped_multimidia],
                                  ['Infantil', censoLatest.in_material_ped_infantil],
                                  ['Científico', censoLatest.in_material_ped_cientifico],
                                  ['Musical', censoLatest.in_material_ped_musical],
                                  ['Jogos', censoLatest.in_material_ped_jogos],
                                  ['Artísticas', censoLatest.in_material_ped_artisticas],
                                  ['Desportiva', censoLatest.in_material_ped_desportiva],
                                  ['Ed. Especial', censoLatest.in_material_ped_edu_esp],
                                ].filter(([,v]) => v != null).map(([k, v], i) => (
                                  <div key={i} className="row-item">
                                    <span>{String(k)}</span>
                                    <strong style={{color:v===1?'#2f7a58':'#b74f42'}}>{v===1?'✅':'✗'}</strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeSchoolTab === 'infra' && (
                      <div className="tab-panel-v6 active">
                        <div className="two-col">
                          <div className="space-y-3">
                            <div className="list-card">
                              <h4>Salas e Tecnologia</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                <div className="row-item"><span>Salas utilizadas</span><strong>{censoLatest.qt_salas_utilizadas ?? '—'}</strong></div>
                                <div className="row-item"><span>Dentro</span><strong>{censoLatest.qt_salas_utilizadas_dentro ?? '—'}</strong></div>
                                <div className="row-item"><span>Fora</span><strong>{censoLatest.qt_salas_utilizadas_fora ?? '—'}</strong></div>
                                <div className="row-item"><span>Climatizadas</span><strong>{censoLatest.qt_salas_utiliza_climatizadas ?? '—'}</strong></div>
                                <div className="row-item"><span>Acessíveis</span><strong>{censoLatest.qt_salas_utilizadas_acessiveis ?? '—'}</strong></div>
                                <div className="row-item"><span>Desktops alunos</span><strong>{censoLatest.qt_desktop_aluno ?? '—'}</strong></div>
                                <div className="row-item"><span>Notebooks alunos</span><strong>{censoLatest.qt_comp_portatil_aluno ?? '—'}</strong></div>
                                <div className="row-item"><span>Tablets alunos</span><strong>{censoLatest.qt_tablet_aluno ?? '—'}</strong></div>
                                <div className="row-item"><span>TVs</span><strong>{censoLatest.qt_equip_tv ?? '—'}</strong></div>
                                <div className="row-item"><span>Projetores</span><strong>{censoLatest.qt_equip_multimidia ?? '—'}</strong></div>
                                <div className="row-item"><span>Lousas digitais</span><strong>{censoLatest.qt_equip_lousa_digital ?? '—'}</strong></div>
                              </div>
                            </div>
                            <div className="list-card">
                              <h4>Água, Energia e Saneamento</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                {[
                                  ['Água Potável', censoLatest.in_agua_potavel],
                                  ['Rede Pública Água', censoLatest.in_agua_rede_publica],
                                  ['Poço Artesiano', censoLatest.in_agua_poco_artesiano],
                                  ['Esgoto Rede Pública', censoLatest.in_esgoto_rede_publica],
                                  ['Fossa Séptica', censoLatest.in_esgoto_fossa_septica],
                                  ['Energia Rede Pública', censoLatest.in_energia_rede_publica],
                                  ['Energia Renovável', censoLatest.in_energia_renovavel],
                                  ['Coleta de Lixo', censoLatest.in_lixo_servico_coleta],
                                  ['Reciclagem', censoLatest.in_tratamento_lixo_reciclagem],
                                ].filter(([,v]) => v != null).map(([k, v], i) => (
                                  <div key={i} className="row-item">
                                    <span>{String(k)}</span>
                                    <strong style={{color:v===1?'#2f7a58':'#b74f42'}}>{v===1?'✅':'✗'}</strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="list-card">
                              <h4>Dependências</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                {[
                                  ['Biblioteca', censoLatest.in_biblioteca],
                                  ['Sala de Leitura', censoLatest.in_biblioteca_sala_leitura],
                                  ['Lab. Informática', censoLatest.in_laboratorio_informatica],
                                  ['Lab. Ciências', censoLatest.in_laboratorio_ciencias],
                                  ['Quadra Coberta', censoLatest.in_quadra_esportes_coberta],
                                  ['Quadra Descoberta', censoLatest.in_quadra_esportes_descoberta],
                                  ['Cozinha', censoLatest.in_cozinha],
                                  ['Refeitório', censoLatest.in_refeitorio],
                                  ['Pátio Coberto', censoLatest.in_patio_coberto],
                                  ['Pátio Descoberto', censoLatest.in_patio_descoberto],
                                  ['Parque Infantil', censoLatest.in_parque_infantil],
                                  ['Auditório', censoLatest.in_auditorio],
                                  ['Área Verde', censoLatest.in_area_verde],
                                  ['Sala Diretoria', censoLatest.in_sala_diretoria],
                                  ['Sala Professores', censoLatest.in_sala_professor],
                                  ['Secretaria', censoLatest.in_secretaria],
                                ].filter(([,v]) => v != null).map(([k, v], i) => (
                                  <div key={i} className="row-item">
                                    <span>{String(k)}</span>
                                    <strong style={{color:v===1?'#2f7a58':'#b74f42'}}>{v===1?'✅':'✗'}</strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="list-card">
                              <h4>Acessibilidade</h4>
                              <div className="row-list" style={{padding:'10px 14px'}}>
                                {[
                                  ['Rampas', censoLatest.in_acessibilidade_rampas],
                                  ['Corrimão', censoLatest.in_acessibilidade_corrimao],
                                  ['Elevador', censoLatest.in_acessibilidade_elevador],
                                  ['Pisos Táteis', censoLatest.in_acessibilidade_pisos_tateis],
                                  ['Vão Livre', censoLatest.in_acessibilidade_vao_livre],
                                  ['Sinal Sonoro', censoLatest.in_acessibilidade_sinal_sonoro],
                                  ['Sinal Tátil', censoLatest.in_acessibilidade_sinal_tatil],
                                  ['Sinal Visual', censoLatest.in_acessibilidade_sinal_visual],
                                  ['Banheiro PNE', censoLatest.in_banheiro_pne],
                                  ['Banheiro Ed. Infantil', censoLatest.in_banheiro_ei],
                                ].filter(([,v]) => v != null).map(([k, v], i) => (
                                  <div key={i} className="row-item">
                                    <span>{String(k)}</span>
                                    <strong style={{color:v===1?'#2f7a58':'#b74f42'}}>{v===1?'✅':'✗'}</strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* ── DADOS FINANCEIROS PDDE ── */}
                <section className="section">
                  <div className="section-title">
                    <div><h2>Dados financeiros PDDE</h2><p>Situação financeira e repasses do Programa Dinheiro Direto na Escola</p></div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                      {/* Seletor de ano por setas */}
                      <div style={{display:'flex',alignItems:'center',gap:'0',background:'#f8f4ec',border:'1.5px solid #e0d5c0',borderRadius:'20px',overflow:'hidden',userSelect:'none'}}>
                        <button
                          onClick={() => setPddeAno(a => Math.max(a - 1, 2017))}
                          disabled={pddeAno <= 2017}
                          style={{padding:'5px 10px',border:'none',cursor: pddeAno <= 2017 ? 'not-allowed' : 'pointer',background:'transparent',color: pddeAno <= 2017 ? '#ccc' : 'var(--m-blue)',fontWeight:700,fontSize:'16px',lineHeight:1}}
                          title="Ano anterior"
                        >‹</button>
                        <span style={{padding:'4px 10px',fontWeight:700,fontSize:'13px',color:'var(--m-blue)',minWidth:'44px',textAlign:'center',borderLeft:'1px solid #e0d5c0',borderRight:'1px solid #e0d5c0'}}>
                          {pddeAno}
                        </span>
                        <button
                          onClick={() => setPddeAno(a => Math.min(a + 1, new Date().getFullYear()))}
                          disabled={pddeAno >= new Date().getFullYear()}
                          style={{padding:'5px 10px',border:'none',cursor: pddeAno >= new Date().getFullYear() ? 'not-allowed' : 'pointer',background:'transparent',color: pddeAno >= new Date().getFullYear() ? '#ccc' : 'var(--m-blue)',fontWeight:700,fontSize:'16px',lineHeight:1}}
                          title="Próximo ano"
                        >›</button>
                      </div>
                      <div className="hint-chip">Fonte: FNDE / PDDE Info</div>
                    </div>
                  </div>
                  <div className="organic-divider" />
                  {/* loading state */}
                  {(pddeLoading || cadastralLoading || prestacaoContaLoading || atendimentoLoading) && (
                    <div className="flex items-center gap-2 py-6">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Carregando dados do FNDE...</span>
                    </div>
                  )}

                  {/* ── 1. IDENTIDADE DA UEx ── */}
                  {(pddeData?.ok || cadastralData?.ok) && (() => {
                    const uexNome = pddeData?.uex?.executora || cadastralData?.itens?.[0]?.razao_social || null;
                    const cnpj = pddeData?.uex?.cnpj || null;
                    const cnpjEex = cadastralData?.itens?.[0]?.cnpj_eex || null;
                    const rede = pddeData?.rede || cadastralData?.itens?.[0]?.rede_atendimento || null;
                    const municipio = pddeData?.municipio || pddeData?.uex?.municipio || null;
                    const uf = pddeData?.uf || pddeData?.uex?.uf || null;
                    const localizacao = cadastralData?.itens?.[0]?.localizacao || null;
                    const ddd = cadastralData?.itens?.[0]?.ddd || null;
                    const telefone = cadastralData?.itens?.[0]?.telefone || null;
                    const dataAtualizacao = cadastralData?.itens?.[0]?.data_atualizacao || null;
                    const dirigente = cadastralData?.itens?.[0]?.mandato_dirigente || null;
                    const mandatoFim = cadastralData?.itens?.[0]?.data_fim_mandato || pddeData?.situacao_uex?.mandato_fim || null;
                    const mandatoInicio = pddeData?.situacao_uex?.mandato_inicio || null;
                    const dadosCadastrais = pddeData?.situacao_uex?.dados_cadastrais || null;
                    const now = new Date();
                    const fimDate = mandatoFim ? (() => { const [d,m,a] = mandatoFim.split('/'); return a ? new Date(+a,+m-1,+d) : null; })() : null;
                    const vigente = fimDate ? fimDate >= now : null;
                    return (
                      <div className="soft-card" style={{marginBottom:'16px',padding:'20px'}}>
                        <div style={{display:'flex',alignItems:'flex-start',gap:'16px',flexWrap:'wrap'}}>
                          <div style={{flex:'1 1 260px'}}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                              <Landmark className="w-3.5 h-3.5" /> Unidade Executora (UEx)
                            </p>
                            {uexNome && <p style={{fontWeight:700,fontSize:'14px',lineHeight:'1.4',marginBottom:'6px'}}>{uexNome}</p>}
                            <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                              {cnpj && <span className="meta-chip">CNPJ UEx: {cnpj}</span>}
                              {cnpjEex && <span className="meta-chip">CNPJ EEx: {cnpjEex}</span>}
                              {municipio && uf && <span className="meta-chip">📍 {municipio}/{uf}</span>}
                              {rede && <span className="meta-chip">🏢 {rede}</span>}
                              {localizacao && <span className="meta-chip">📌 {localizacao}</span>}
                              {(ddd || telefone) && <span className="meta-chip">📞 {ddd ? `(${ddd}) ` : ''}{telefone}</span>}
                              {dataAtualizacao && <span className="meta-chip text-muted-foreground">Atualizado: {dataAtualizacao}</span>}
                            </div>
                          </div>
                          <div style={{flex:'1 1 220px',borderLeft:'2px solid #f0ece4',paddingLeft:'16px'}}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Diretoria vigente</p>
                            {dirigente && (
                              <div style={{marginBottom:'6px'}}>
                                <span className="text-xs text-muted-foreground">Presidente / Dirigente</span>
                                <p style={{fontWeight:700,fontSize:'13px'}}>{dirigente}</p>
                              </div>
                            )}
                            {(mandatoInicio || mandatoFim) && (
                              <div style={{marginBottom:'6px'}}>
                                <span className="text-xs text-muted-foreground">Vigência do mandato</span>
                                <p style={{fontSize:'13px',fontWeight:600}}>
                                  {mandatoInicio && mandatoFim ? `${mandatoInicio} → ${mandatoFim}` : mandatoFim ? `até ${mandatoFim}` : mandatoInicio}
                                  {vigente !== null && (
                                    <span className={`ml-2 badge ${vigente ? 'badge-good' : 'badge-attn'}`} style={{verticalAlign:'middle'}}>
                                      {vigente ? 'Vigente' : 'Expirado'}
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}
                            {!dirigente && !mandatoInicio && !mandatoFim && (
                              <p className="text-xs text-muted-foreground">Dados da diretoria não disponíveis</p>
                            )}
                          </div>
                        </div>
                        {dadosCadastrais && (
                          <div style={{marginTop:'14px',paddingTop:'12px',borderTop:'1px solid #f0ece4'}}>
                            <p className="text-xs text-muted-foreground" style={{lineHeight:'1.6'}}>
                              <strong>Situação cadastral:</strong> {dadosCadastrais}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* ── 2. CONTAS BANCÁRIAS ── */}
                  {pddeData?.ok && pddeData.contas && pddeData.contas.length > 0 && (
                    <div style={{marginBottom:'16px'}}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                        <BanknoteIcon className="w-3.5 h-3.5" /> Contas bancárias — ano {pddeData.ano}
                      </p>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'10px'}}>
                        {pddeData.contas.map((c: any, i: number) => (
                          <div key={i} className="soft-card" style={{padding:'14px',borderLeft:'3px solid var(--m-blue)'}}>
                            <p style={{fontWeight:700,fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--m-blue)',marginBottom:'8px'}}>{c.programa}</p>
                            <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
                              <div className="row-item" style={{padding:0}}>
                                <span className="text-xs text-muted-foreground">Banco</span>
                                <span className="text-xs font-semibold">{c.banco || '—'}</span>
                              </div>
                              <div className="row-item" style={{padding:0}}>
                                <span className="text-xs text-muted-foreground">Agência</span>
                                <span className="text-xs font-semibold">{c.agencia || '—'}</span>
                              </div>
                              <div className="row-item" style={{padding:0}}>
                                <span className="text-xs text-muted-foreground">Conta</span>
                                <span className="text-xs font-semibold font-mono">{c.conta || '—'}</span>
                              </div>
                              {c.saldo != null && (
                                <div style={{marginTop:'8px',paddingTop:'8px',borderTop:'1px solid #f0ece4'}}>
                                  <span className="text-xs text-muted-foreground">Saldo</span>
                                  <p style={{fontSize:'16px',fontWeight:800,color: c.saldo > 0 ? '#16a34a' : 'var(--m-muted)'}}>{brl(c.saldo)}</p>
                                </div>
                              )}
                              {c.ocorrencia && (
                                <p className="text-xs text-amber-600 mt-1">⚠️ {c.ocorrencia}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── 2b. MATRÍCULAS POR NÍVEL (PDDE) ── */}
                  {pddeData?.ok && pddeData.matriculas_por_nivel && Object.keys(pddeData.matriculas_por_nivel).length > 0 && (
                    <div style={{marginBottom:'16px'}}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" /> Matrículas por nível — PDDE {pddeData.ano}
                      </p>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'8px'}}>
                        {Object.entries(pddeData.matriculas_por_nivel).map(([nivel, qtd]: [string, any], i: number) => (
                          <div key={i} className="soft-card" style={{padding:'12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span className="text-xs font-medium" style={{textTransform:'capitalize'}}>{nivel.toLowerCase()}</span>
                            <strong style={{fontSize:'15px',color:'#2d5a88'}}>{Number(qtd).toLocaleString('pt-BR')}</strong>
                          </div>
                        ))}
                        {pddeData.matriculas_total != null && (
                          <div className="soft-card" style={{padding:'12px',display:'flex',justifyContent:'space-between',alignItems:'center',borderLeft:'3px solid var(--m-blue)'}}>
                            <span className="text-xs font-semibold">Total</span>
                            <strong style={{fontSize:'15px',color:'#2d5a88'}}>{Number(pddeData.matriculas_total).toLocaleString('pt-BR')}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── 2c. SITUAÇÃO DA EEx ── */}
                  {pddeData?.ok && pddeData.situacao_eex && (pddeData.situacao_eex.adesao || pddeData.situacao_eex.prestacao_contas) && (
                    <div style={{marginBottom:'16px'}}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Situação da Entidade Executora (EEx)
                      </p>
                      <div className="soft-card" style={{padding:'14px',display:'flex',gap:'24px',flexWrap:'wrap'}}>
                        {pddeData.situacao_eex.adesao && (
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">Adesão</span>
                            <span className={`badge ${pddeData.situacao_eex.adesao.toLowerCase().includes('adimpl') ? 'badge-good' : 'badge-attn'}`}>{pddeData.situacao_eex.adesao}</span>
                          </div>
                        )}
                        {pddeData.situacao_eex.prestacao_contas && (
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">Prestação de Contas EEx</span>
                            <span className={`badge ${pddeData.situacao_eex.prestacao_contas.toLowerCase().includes('adimpl') ? 'badge-good' : 'badge-attn'}`}>{pddeData.situacao_eex.prestacao_contas}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── 3. PRESTAÇÃO DE CONTAS ── */}
                  {prestacaoContaData?.ok && prestacaoContaData.itens.length > 0 && (
                    <div style={{marginBottom:'16px'}}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Prestação de Contas
                      </p>
                      <div className="table-card" style={{overflowX:'auto'}}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{borderBottom:'1px solid #eadfcb',background:'#f9f6f0'}}>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Programa</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Ano</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Sit. UEx</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Sit. EEx</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Susp. UEx</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Susp. EEx</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Vl. Previsto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prestacaoContaData.itens.map((item: any, i: number) => {
                              const isOkUex = item.situacao_pc_uex?.toLowerCase().includes('adimpl');
                              const isOkEex = item.situacao_pc_eex?.toLowerCase().includes('adimpl');
                              const hasSuspUex = item.suspensao_uex && item.suspensao_uex !== '—' && item.suspensao_uex.trim() !== '';
                              const hasSuspEex = item.suspensao_eex && item.suspensao_eex !== '—' && item.suspensao_eex.trim() !== '';
                              return (
                                <tr key={i} style={{borderBottom:'1px solid #f0ece4'}}>
                                  <td className="py-2 px-3 text-xs font-medium">{item.ds_programa || item.programa || 'PDDE'}</td>
                                  <td className="py-2 px-3 text-xs">{item.ano || pddeAno}</td>
                                  <td className="py-2 px-3">
                                    {item.situacao_pc_uex ? <span className={`badge ${isOkUex ? 'badge-good' : 'badge-attn'}`}>{item.situacao_pc_uex}</span> : <span className="text-muted-foreground text-xs">—</span>}
                                  </td>
                                  <td className="py-2 px-3">
                                    {item.situacao_pc_eex ? <span className={`badge ${isOkEex ? 'badge-good' : 'badge-attn'}`}>{item.situacao_pc_eex}</span> : <span className="text-muted-foreground text-xs">—</span>}
                                  </td>
                                  <td className="py-2 px-3 text-xs">{hasSuspUex ? <span className="badge badge-critical">{item.suspensao_uex}</span> : <span className="text-muted-foreground">—</span>}</td>
                                  <td className="py-2 px-3 text-xs">{hasSuspEex ? <span className="badge badge-critical">{item.suspensao_eex}</span> : <span className="text-muted-foreground">—</span>}</td>
                                  <td className="py-2 px-3 text-xs text-right font-mono">{item.valor_previsto || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── 4. REPASSES POR PROGRAMA ── */}
                  {atendimentoData?.ok && atendimentoData.itens.length > 0 && (
                    <div style={{marginBottom:'16px'}}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" /> Repasses por Programa — {atendimentoData.itens[0]?.ano || pddeAno}
                      </p>
                      <div className="table-card" style={{overflowX:'auto'}}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{borderBottom:'1px solid #eadfcb',background:'#f9f6f0'}}>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Programa</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Destinação</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Alunos</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Custeio</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Capital</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Total</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Pgto.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {atendimentoData.itens.map((item: any, i: number) => {
                              const t = (item.vl_repasse_custeio || 0) + (item.vl_repasse_capital || 0);
                              return (
                                <tr key={i} style={{borderBottom:'1px solid #f0ece4'}}>
                                  <td className="py-2 px-3 text-xs font-medium">{item.ds_programa || item.programa}</td>
                                  <td className="py-2 px-3 text-xs">{item.destinacao || '—'}</td>
                                  <td className="py-2 px-3 text-xs text-right">{item.qtd_alunos ? Number(item.qtd_alunos).toLocaleString('pt-BR') : '—'}</td>
                                  <td className="py-2 px-3 text-xs text-right font-mono">{brl(item.vl_repasse_custeio || 0)}</td>
                                  <td className="py-2 px-3 text-xs text-right font-mono">{brl(item.vl_repasse_capital || 0)}</td>
                                  <td className="py-2 px-3 text-xs text-right font-mono font-bold text-emerald-700">{brl(t)}</td>
                                  <td className="py-2 px-3 text-xs text-muted-foreground">{item.data_ordem_pgto || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── 4b. DESTINAÇÕES (VALORES DEVIDOS × PAGOS) ── */}
                  {pddeData?.ok && pddeData.destinacoes && pddeData.destinacoes.length > 0 && (
                    <div style={{marginBottom:'16px'}}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> Destinações — Valores Devidos e Pagos ({pddeData.ano})
                      </p>
                      <div className="table-card" style={{overflowX:'auto'}}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{borderBottom:'1px solid #eadfcb',background:'#f9f6f0'}}>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Destinação</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Dev. Custeio</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Dev. Capital</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Ajuste Total</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Final Devido</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Pago Custeio</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Pago Capital</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Total Pago</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Pgto.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pddeData.destinacoes.map((d: any, i: number) => {
                              return (
                                <tr key={i} style={{borderBottom:'1px solid #f0ece4'}}>
                                  <td className="py-2 px-3 text-xs font-medium">{d.destinacao || '—'}</td>
                                  <td className="py-2 px-3 text-xs text-right font-mono">{d.devido_custeio != null ? brl(d.devido_custeio) : '—'}</td>
                                  <td className="py-2 px-3 text-xs text-right font-mono">{d.devido_capital != null ? brl(d.devido_capital) : '—'}</td>
                                  <td className="py-2 px-3 text-xs text-right font-mono">{d.ajuste_total != null ? brl(d.ajuste_total) : '—'}</td>
                                  <td className="py-2 px-3 text-xs text-right font-mono font-semibold">{d.final_devido_total != null ? brl(d.final_devido_total) : '—'}</td>
                                  <td className="py-2 px-3 text-xs text-right font-mono">{d.pago_custeio != null ? brl(d.pago_custeio) : '—'}</td>
                                  <td className="py-2 px-3 text-xs text-right font-mono">{d.pago_capital != null ? brl(d.pago_capital) : '—'}</td>
                                  <td className="py-2 px-3 text-xs text-right font-mono font-bold text-emerald-700">{d.pago_total != null ? brl(d.pago_total) : '—'}</td>
                                  <td className="py-2 px-3 text-xs text-muted-foreground">{d.data_ordem_pgto || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── 4c. SALDO UEx POR TIPO (consultasaldoentidade) ── */}
                  {pddeUexSaldoData?.ok && pddeUexSaldoData.saldos && pddeUexSaldoData.saldos.length > 0 && (
                    <div style={{marginBottom:'16px'}}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                        <BanknoteIcon className="w-3.5 h-3.5" /> Saldo bancário UEx — {pddeUexSaldoData.mes}
                      </p>
                      <div className="table-card" style={{overflowX:'auto'}}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{borderBottom:'1px solid #eadfcb',background:'#f9f6f0'}}>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Programa</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Banco</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Ag./Conta</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Saldo C/C</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Fundos</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Poupança</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">RDB/CDB</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pddeUexSaldoData.saldos.map((s: any, i: number) => (
                              <tr key={i} style={{borderBottom:'1px solid #f0ece4'}}>
                                <td className="py-2 px-3 text-xs font-medium">{s.programa || '—'}</td>
                                <td className="py-2 px-3 text-xs">{s.banco || '—'}</td>
                                <td className="py-2 px-3 text-xs font-mono">{s.agencia || '—'} / {s.conta || '—'}</td>
                                <td className="py-2 px-3 text-xs text-right font-mono">{s.saldo_conta != null ? brl(s.saldo_conta) : '—'}</td>
                                <td className="py-2 px-3 text-xs text-right font-mono">{s.saldo_fundos != null ? brl(s.saldo_fundos) : '—'}</td>
                                <td className="py-2 px-3 text-xs text-right font-mono">{s.saldo_poupanca != null ? brl(s.saldo_poupanca) : '—'}</td>
                                <td className="py-2 px-3 text-xs text-right font-mono">{s.saldo_rdb_cdb != null ? brl(s.saldo_rdb_cdb) : '—'}</td>
                                <td className="py-2 px-3 text-xs text-right font-mono font-bold text-emerald-700">{s.saldo_total != null ? brl(s.saldo_total) : '—'}</td>
                              </tr>
                            ))}
                            {pddeUexSaldoData.saldos.length > 1 && (
                              <tr style={{background:'#f9f6f0',fontWeight:700}}>
                                <td colSpan={7} className="py-2 px-3 text-xs text-right font-semibold">Total Geral</td>
                                <td className="py-2 px-3 text-xs text-right font-mono font-bold text-emerald-700">{brl(pddeUexSaldoData.total_saldo_geral)}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── 5. SALDOS PDDE BÁSICO ── */}
                  {pddeSaldosData?.ok && pddeSaldosData.saldos.length > 0 && (
                    <div style={{marginBottom:'16px'}}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                        <BanknoteIcon className="w-3.5 h-3.5" /> Saldos PDDE Básico ({pddeSaldosData.anosDisponiveis.join(', ')})
                      </p>
                      <div className="table-card">
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{borderBottom:'1px solid #eadfcb',background:'#f9f6f0'}}>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Exercício</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Banco</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Saldo Acumulado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pddeSaldosData.saldos.slice().sort((a: any, b: any) => b.an_exercicio - a.an_exercicio).map((s: any, i: number) => (
                              <tr key={i} style={{borderBottom:'1px solid #f0ece4'}}>
                                <td className="py-2 px-3 text-xs font-medium">{s.an_exercicio}</td>
                                <td className="py-2 px-3 text-xs">{s.banco || '—'}</td>
                                <td className={`py-2 px-3 text-xs text-right font-mono ${s.saldo_acumulado > 0 ? 'font-bold text-emerald-700' : ''}`}>{brl(s.saldo_acumulado)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── 6. EXECUÇÃO FINANCEIRA ── */}
                  {pddeExecFinData?.ok && pddeExecFinData.repasses.length > 0 && (
                    <div style={{marginBottom:'16px'}}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" /> Execução Financeira PDDE ({pddeExecFinData.anosDisponiveis.join(', ')})
                      </p>
                      <div className="table-card" style={{overflowX:'auto'}}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{borderBottom:'1px solid #eadfcb',background:'#f9f6f0'}}>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Ano</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Destinação</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Pago Custeio</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Pago Capital</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Total Pago</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...pddeExecFinData.repasses].sort((a: any, b: any) => b.an_exercicio - a.an_exercicio).map((r: any, i: number) => (
                              <tr key={i} style={{borderBottom:'1px solid #f0ece4'}}>
                                <td className="py-2 px-3 text-xs font-medium">{r.an_exercicio}</td>
                                <td className="py-2 px-3 text-xs">{r.sg_destinacao || r.destinacao || '—'}</td>
                                <td className="py-2 px-3 text-xs text-right font-mono">{r.vl_pago_custeio != null ? brl(r.vl_pago_custeio) : '—'}</td>
                                <td className="py-2 px-3 text-xs text-right font-mono">{r.vl_pago_capital != null ? brl(r.vl_pago_capital) : '—'}</td>
                                <td className={`py-2 px-3 text-xs text-right font-mono ${r.vl_pago_total > 0 ? 'font-bold text-emerald-700' : ''}`}>{brl(r.vl_pago_total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── 7. SIGPC — PRESTAÇÃO DE CONTAS DETALHADA ── */}
                  {(pddeCnpj || pddeData?.ok === false) && (<div style={{marginBottom:'16px'}}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> SIGPC — Prestação de Contas Detalhada
                      <a
                        href={`https://www.fnde.gov.br/sigpcadm/actionPublico.pu?tilesPublico=ConsultarSituacao`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-normal"
                        style={{textTransform:'none',letterSpacing:0}}
                      >
                        <ExternalLink className="w-3 h-3" /> Abrir no SIGPC
                      </a>
                    </p>

                    {sigpcLoading && (
                      <div className="flex items-center gap-2 py-3">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Consultando SIGPC/FNDE...</span>
                      </div>
                    )}

                    {!sigpcLoading && sigpcData?.ok && sigpcData.prestacoes.length > 0 && (
                      <div className="table-card" style={{overflowX:'auto'}}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{borderBottom:'1px solid #eadfcb',background:'#f9f6f0'}}>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Processo</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Programa</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Ano</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Sit. UEx (OPC)</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Fase UEx</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Vl. Pago UEx</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Sit. EEx</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Fase EEx</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Vl. Pago EEx</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Susp.</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Med. Exceção</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sigpcData.prestacoes.map((p: any, i: number) => {
                              const isAdimpl = p.situacaoNome?.toLowerCase().includes('adimpl');
                              const isAdimplEex = p.situacaoPcEex?.toLowerCase().includes('adimpl');
                              const hasSusp = p.efeitoSuspensivo && p.efeitoSuspensivo !== 'NÃO' && p.efeitoSuspensivo !== 'Não' && p.efeitoSuspensivo.trim() !== '';
                              const hasSuspEex = p.efeitoSuspensivoEex && p.efeitoSuspensivoEex !== 'NÃO' && p.efeitoSuspensivoEex !== 'Não' && p.efeitoSuspensivoEex.trim() !== '';
                              const hasMedExc = p.medidaExcecao && p.medidaExcecao !== 'NÃO' && p.medidaExcecao !== 'Não' && p.medidaExcecao.trim() !== '';
                              return (
                                <tr key={i} style={{borderBottom:'1px solid #f0ece4'}}>
                                  <td className="py-2 px-3 text-xs font-mono">{p.processoNumero || '—'}</td>
                                  <td className="py-2 px-3 text-xs font-medium">{p.programaNome || '—'}</td>
                                  <td className="py-2 px-3 text-xs">{p.anoConcessao || '—'}</td>
                                  <td className="py-2 px-3">
                                    {p.situacaoNome
                                      ? <span className={`badge ${isAdimpl ? 'badge-good' : 'badge-attn'}`}>{p.situacaoNome}</span>
                                      : <span className="text-muted-foreground text-xs">—</span>}
                                  </td>
                                  <td className="py-2 px-3 text-xs">{p.faseNome || '—'}</td>
                                  <td className="py-2 px-3 text-xs text-right font-mono font-bold text-emerald-700">
                                    {p.valorConcessao ? brl(p.valorConcessao) : '—'}
                                  </td>
                                  <td className="py-2 px-3">
                                    {p.situacaoPcEex
                                      ? <span className={`badge ${isAdimplEex ? 'badge-good' : 'badge-attn'}`}>{p.situacaoPcEex}</span>
                                      : <span className="text-muted-foreground text-xs">—</span>}
                                  </td>
                                  <td className="py-2 px-3 text-xs">{p.fasePcEex || '—'}</td>
                                  <td className="py-2 px-3 text-xs text-right font-mono">
                                    {p.valorPagoEex ? brl(parseFloat(String(p.valorPagoEex).replace(/\./g,'').replace(',','.'))) : '—'}
                                  </td>
                                  <td className="py-2 px-3 text-xs">
                                    {(hasSusp || hasSuspEex)
                                      ? <span className="badge badge-critical">Sim</span>
                                      : <span className="text-muted-foreground">Não</span>}
                                  </td>
                                  <td className="py-2 px-3 text-xs">
                                    {hasMedExc
                                      ? <span className="badge badge-attn">{p.medidaExcecao}</span>
                                      : <span className="text-muted-foreground">—</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {!sigpcLoading && (!sigpcData?.ok || sigpcData?.prestacoes?.length === 0) && (
                      <div className="soft-card" style={{padding:'14px',display:'flex',alignItems:'flex-start',gap:'12px'}}>
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-amber-700 mb-1">
                            {sigpcData?.fonte === 'indisponivel'
                              ? 'SIGPC/OLINDA temporariamente indisponível'
                              : 'Nenhuma prestação de contas encontrada no SIGPC para este ano'}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {sigpcData?.fonte === 'indisponivel'
                              ? 'A API aberta do FNDE (OLINDA) está fora do ar no momento. Os dados de Prestação de Contas do SIGPC ficam disponíveis automaticamente quando o serviço for restaurado.'
                              : `Não foram localizados registros para o CNPJ ${pddeCnpj || 'da UEx'} no SIGPC em ${pddeAno}. Tente outro ano ou consulte diretamente pelo site.`}
                          </p>
                          <a
                            href="https://www.fnde.gov.br/sigpcadm/actionPublico.pu?tilesPublico=ConsultarSituacao"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Consultar diretamente no SIGPC (FNDE)
                          </a>
                        </div>
                      </div>
                    )}
                  </div>)}

                  {/* ── sem dados ── */}
                  {!pddeLoading && !pddeSaldosLoading && !pddeExecFinLoading && !cadastralLoading && !prestacaoContaLoading && !atendimentoLoading && !pddeData?.ok && !pddeSaldosData?.ok && !pddeExecFinData?.ok && !cadastralData?.ok && !prestacaoContaData?.ok && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Dados financeiros não disponíveis para esta escola no momento.</p>
                    </div>
                  )}

                  <div style={{paddingTop:'12px',borderTop:'1px solid #f0ece4',marginTop:'4px'}}>
                    <p style={{fontSize:'11px',color:'var(--m-muted)',lineHeight:'1.6'}}>
                      Dados obtidos do PDDE Info e Dados Abertos do FNDE (2020–2026). Para dados oficiais, acesse{' '}
                      <a href="https://www.fnde.gov.br/pddeinfo/pddeinfo/escola/consultar" target="_blank" rel="noopener noreferrer" style={{color:'var(--m-blue)',textDecoration:'underline'}}>PDDE Info</a>.
                    </p>
                  </div>

                  {/* ── LINKS ÚTEIS ── */}
                  <div style={{marginTop:'16px',display:'flex',gap:'16px',flexWrap:'wrap',alignItems:'flex-start'}}>
                    <div className="soft-card theme-blue" style={{flex:'1 1 280px'}}>
                      <div className="attention-head"><span>🔗</span><strong>Links Úteis</strong></div>
                      <div className="link-list">
                        {[
                          { nome: 'PDDE Interativo', url: 'https://pddeinterativo.mec.gov.br' },
                          { nome: 'Portal FNDE', url: 'https://www.fnde.gov.br' },
                          { nome: 'Dados INEP', url: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos' },
                          { nome: 'PDDE Info', url: 'https://www.fnde.gov.br/pddeinfo/pddeinfo/escola/consultar' },
                        ].map((link, i) => (
                          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer">
                            {link.nome} <ExternalLink className="w-3 h-3" style={{display:'inline',marginLeft:'4px'}} />
                          </a>
                        ))}
                      </div>
                    </div>
                    <div className="footer-note" style={{flex:'1 1 280px'}}>
                      <strong className="scribble">📌 Nota sobre os dados</strong>
                      <p style={{margin:'8px 0 0',fontSize:'13px'}}>Os dados financeiros são obtidos em tempo real do PDDE Info e dos Dados Abertos do FNDE. Podem apresentar atraso ou indisponibilidade. Os dados censais são do Censo Escolar INEP/MEC.</p>
                    </div>
                  </div>
                </section>
              </>
                );
              })()

            ) : (
              <Card className="card-clay">
                <CardContent className="py-12 text-center">
                  <School className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Escola não encontrada.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => { if (activeTabId !== "overview") closeTab(activeTabId); }}>
                    Fechar
                  </Button>
                </CardContent>
              </Card>
            )}
              </>
            )}

        </div>
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
    const { x, y, width, value } = props;
    if (value == null || value === 0) return <g />;
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
            <Bar
              key={line.key}
              dataKey={line.key}
              fill={`url(#bg-${line.key})`}
              name={line.name}
              radius={[6, 6, 0, 0]}
              maxBarSize={large ? 44 : 32}
              {...(large && lines.length <= 2 ? { label: renderLabel } : {})}
            />
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
