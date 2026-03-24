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
  CheckCircle, CircleAlert, Hash, CalendarDays
} from "lucide-react";
import { useSchoolSearch, useSchool, useEscolaEvolucao, useEstatisticas, useListaEscolas, useMediasNacionais, useEscolaComparativo, useEscolaDiagnostico, useEscolaMicroregiao, useUfStats, useSimilarSchools } from "@/hooks/use-schools";
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
  const [selectedAno, setSelectedAno] = useState(2025);
  const selectedInep = activeTabId === "overview" ? null : (schoolTabs.find(t => t.id === activeTabId)?.inep || null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedChart, setSelectedChart] = useState("matriculas");
  const [chartEtapa, setChartEtapa] = useState<string>('total');
  const [showChartDropdown, setShowChartDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSchoolTab, setActiveSchoolTab] = useState<"dim1"|"dim2"|"dim3"|"dim4"|"dim5"|"dim6"|"dim7"|"dim8"|"dim9"|"dim10">("dim1");
  const [filterUf, setFilterUf] = useState("");
  const [filterDep, setFilterDep] = useState("");
  const [listPage, setListPage] = useState(1);
  const [clickedUf, setClickedUf] = useState<string | null>(null);
  const [similarMode, setSimilarMode] = useState(false);
  const [similarClickedUf, setSimilarClickedUf] = useState<string | null>(null);
  const [saldoMesSel, setSaldoMesSel] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  });

  const { data: stats, isLoading: statsLoading } = useEstatisticas(selectedAno);
  const { data: ufStatsData, isLoading: ufStatsLoading } = useUfStats(similarMode ? null : clickedUf, selectedAno);
  const { data: similarData, isLoading: similarLoading } = useSimilarSchools(selectedInep || "", selectedAno, similarMode);
  const { data: searchResults, refetch: refetchSearch, isLoading: searchLoading } = useSchoolSearch(searchQuery);
  const { data: evolucaoData, isLoading: evolucaoLoading } = useEscolaEvolucao(selectedInep || "");
  const { data: mediasNacionais } = useMediasNacionais(selectedAno);
  const { data: comparativoData } = useEscolaComparativo(selectedInep || "");
  const { data: microregiaoData } = useEscolaMicroregiao(selectedInep || "");
  const { data: diagnosticoData } = useEscolaDiagnostico(selectedInep || "");
  const [pddeAno, setPddeAno] = useState<number>(new Date().getFullYear());
  const [showEquipamentos, setShowEquipamentos] = useState(false);
  const [showSuporteInstitucional, setShowSuporteInstitucional] = useState(false);
  const [equipamentosData, setEquipamentosData] = useState<any>(null);
  const [equipamentosLoading, setEquipamentosLoading] = useState(false);
  const [osmUnidades, setOsmUnidades] = useState<Record<string, any[]> | null>(null);
  const [osmLoading, setOsmLoading] = useState(false);
  const [crasData, setCrasData] = useState<any>(null);
  const [crasLoading, setCrasLoading] = useState(false);
  const [rendSegmento, setRendSegmento] = useState<'ai' | 'af' | 'med' | null>(null);
  const [tnrSegmento, setTnrSegmento] = useState<string | null>(null);
  const [tdiSegmento, setTdiSegmento] = useState<string | null>(null);
  const [iedAno, setIedAno] = useState<number | null>(null);
  const [afdAno, setAfdAno] = useState<number | null>(null);
  const [atuAno, setAtuAno] = useState<number | null>(null);
  const [hadAno, setHadAno] = useState<number | null>(null);
  const [inseAno, setInseAno] = useState<number | null>(null);
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

  const [censoInsightsUF, setCensoInsightsUF] = useState<any>(null);
  const [censoInsightsUFLoading, setCensoInsightsUFLoading] = useState(false);
  const [censoInsightsNacional, setCensoInsightsNacional] = useState<any>(null);

  useEffect(() => {
    if (!clickedUf) { setCensoInsightsUF(null); return; }
    setCensoInsightsUFLoading(true);
    fetch(`/api/censo-escolar/insights/${clickedUf}`)
      .then(r => r.json()).then(d => { setCensoInsightsUF(d); setCensoInsightsUFLoading(false); })
      .catch(() => setCensoInsightsUFLoading(false));
  }, [clickedUf]);

  useEffect(() => {
    fetch('/api/censo-escolar/insights/BR')
      .then(r => r.json()).then(setCensoInsightsNacional).catch(() => {});
  }, []);

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
    setEquipamentosData(null);
    setEquipamentosLoading(false);
    setOsmUnidades(null);
    setOsmLoading(false);
    setCrasData(null);
    setCrasLoading(false);
    setShowEquipamentos(false);
  }, [selectedInep]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 170);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

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
    type Progressao = { delta: number; label: string; anoAnterior: number };
    const alertas: { tipo: 'critical' | 'warning'; titulo: string; descricao: string; indicador: string; progressao?: Progressao }[] = [];
    const ind = indicadoresLatest;

    // Build IDEB history sorted by year to detect year-over-year improvement
    const idebHistorico: Array<{ ano: number; ideb_ai?: number; ideb_af?: number; ideb_em?: number }> =
      evolucaoData
        ? Object.entries(evolucaoData.indicadores_por_ano || {})
            .filter(([, tipos]: [string, any]) => tipos?.ideb)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([ano, tipos]: [string, any]) => ({ ano: Number(ano), ...tipos.ideb }))
        : [];

    const getIdebProgressao = (field: 'ideb_ai' | 'ideb_af' | 'ideb_em'): Progressao | undefined => {
      if (idebHistorico.length < 2) return undefined;
      const ultimo = idebHistorico[idebHistorico.length - 1];
      const penultimo = idebHistorico[idebHistorico.length - 2];
      const vAtual = Number(ultimo[field]);
      const vAnterior = Number(penultimo[field]);
      if (!vAtual || !vAnterior) return undefined;
      const delta = vAtual - vAnterior;
      if (delta > 0.05) return { delta, label: `Subiu ${delta.toFixed(1)} ponto${delta >= 2 ? 's' : ''} desde ${penultimo.ano}`, anoAnterior: penultimo.ano };
      return undefined;
    };

    if (ind.ideb) {
      const vals = [
        { v: ind.ideb.ideb_ai, name: 'Anos Iniciais', field: 'ideb_ai' as const },
        { v: ind.ideb.ideb_af, name: 'Anos Finais', field: 'ideb_af' as const },
        { v: ind.ideb.ideb_em, name: 'Ensino Médio', field: 'ideb_em' as const },
      ];
      for (const { v, name, field } of vals) {
        if (v != null && Number(v) > 0) {
          const progressao = getIdebProgressao(field);
          if (Number(v) < 4.0) {
            alertas.push({ tipo: 'critical', titulo: `IDEB ${name}: ${Number(v).toFixed(1)}`, descricao: progressao ? `O IDEB de ${name} ainda está abaixo de 4,0, mas a escola já está avançando. Continue com o plano pedagógico para acelerar a evolução.` : `O IDEB de ${name} está abaixo de 4,0. Recomenda-se elaborar um plano de melhoria pedagógica com metas claras.`, indicador: 'ideb', progressao });
          } else if (Number(v) < 5.0) {
            alertas.push({ tipo: 'warning', titulo: `IDEB ${name}: ${Number(v).toFixed(1)}`, descricao: progressao ? `O IDEB de ${name} está em trajetória positiva. Mantenha as ações pedagógicas que estão surtindo efeito.` : `O IDEB de ${name} está entre 4,0 e 5,0. Recomenda-se acompanhamento e planejamento de ações pedagógicas.`, indicador: 'ideb', progressao });
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
  }, [indicadoresLatest, evolucaoData]);

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
          aprovacao_ai: tr.aprovacao_fund_ai ?? null,
          reprovacao_ai: tr.reprovacao_fund_ai ?? null,
          abandono_ai: tr.abandono_fund_ai ?? null,
          aprovacao_af: tr.aprovacao_fund_af ?? null,
          reprovacao_af: tr.reprovacao_fund_af ?? null,
          abandono_af: tr.abandono_fund_af ?? null,
          aprovacao_med: tr.aprovacao_med ?? null,
          reprovacao_med: tr.reprovacao_med ?? null,
          abandono_med: tr.abandono_med ?? null,
          // Por série — Anos Finais (6º–9º)
          aprov_f06: tr.aprovacao_fun_06 ?? null, aprov_f07: tr.aprovacao_fun_07 ?? null,
          aprov_f08: tr.aprovacao_fun_08 ?? null, aprov_f09: tr.aprovacao_fun_09 ?? null,
          reprov_f06: tr.reprovacao_fun_06 ?? null, reprov_f07: tr.reprovacao_fun_07 ?? null,
          reprov_f08: tr.reprovacao_fun_08 ?? null, reprov_f09: tr.reprovacao_fun_09 ?? null,
          aband_f06: tr.abandono_fun_06 ?? null, aband_f07: tr.abandono_fun_07 ?? null,
          aband_f08: tr.abandono_fun_08 ?? null, aband_f09: tr.abandono_fun_09 ?? null,
          // Por série — Anos Iniciais (1º–5º)
          aprov_f01: tr.aprovacao_fun_01 ?? null, aprov_f02: tr.aprovacao_fun_02 ?? null,
          aprov_f03: tr.aprovacao_fun_03 ?? null, aprov_f04: tr.aprovacao_fun_04 ?? null, aprov_f05: tr.aprovacao_fun_05 ?? null,
          reprov_f01: tr.reprovacao_fun_01 ?? null, reprov_f02: tr.reprovacao_fun_02 ?? null,
          reprov_f03: tr.reprovacao_fun_03 ?? null, reprov_f04: tr.reprovacao_fun_04 ?? null, reprov_f05: tr.reprovacao_fun_05 ?? null,
          aband_f01: tr.abandono_fun_01 ?? null, aband_f02: tr.abandono_fun_02 ?? null,
          aband_f03: tr.abandono_fun_03 ?? null, aband_f04: tr.abandono_fun_04 ?? null, aband_f05: tr.abandono_fun_05 ?? null,
          // Por série — Ensino Médio (1ª–3ª)
          aprov_m01: tr.aprovacao_med_01 ?? null, aprov_m02: tr.aprovacao_med_02 ?? null, aprov_m03: tr.aprovacao_med_03 ?? null,
          reprov_m01: tr.reprovacao_med_01 ?? null, reprov_m02: tr.reprovacao_med_02 ?? null, reprov_m03: tr.reprovacao_med_03 ?? null,
          aband_m01: tr.abandono_med_01 ?? null, aband_m02: tr.abandono_med_02 ?? null, aband_m03: tr.abandono_med_03 ?? null,
        };
      }),
      tdi: anos.map((a: number) => {
        const t = indicadores[a]?.tdi;
        if (!t) return { ano: a };
        return {
          ano: a,
          fund_total: t.fundamental_total ?? null,
          fund_ai:    t.fundamental_ai   ?? null,
          fund_af:    t.fundamental_af   ?? null,
          medio:      t.medio_total      ?? null,
          // Por ano — Fundamental (campos reais do INEP)
          f01: t.fund_1ano ?? null, f02: t.fund_2ano ?? null, f03: t.fund_3ano ?? null,
          f04: t.fund_4ano ?? null, f05: t.fund_5ano ?? null,
          f06: t.fund_6ano ?? null, f07: t.fund_7ano ?? null,
          f08: t.fund_8ano ?? null, f09: t.fund_9ano ?? null,
          // Por série — Ensino Médio (campos reais do INEP)
          m01: t.medio_1serie ?? null, m02: t.medio_2serie ?? null,
          m03: t.medio_3serie ?? null, m04: t.medio_4serie ?? null,
        };
      }),
      atu: anos.map((a: number) => {
        const at = indicadores[a]?.atu;
        if (!at) return { ano: a };
        return {
          ano: a,
          // Educação Infantil
          inf_total:   at.inf_cat_0       ?? null,
          inf_cre:     at.inf_cre_cat_0   ?? null,
          inf_pre:     at.inf_pre_cat_0   ?? null,
          // Ensino Fundamental
          fund:        at.fun_cat_0       ?? at.media_fund    ?? null,
          fund_ai:     at.fun_ai_cat_0    ?? at.media_fund_ai ?? null,
          fund_af:     at.fun_af_cat_0    ?? at.media_fund_af ?? null,
          fun_01:      at.fun_01_cat_0    ?? null,
          fun_02:      at.fun_02_cat_0    ?? null,
          fun_03:      at.fun_03_cat_0    ?? null,
          fun_04:      at.fun_04_cat_0    ?? null,
          fun_05:      at.fun_05_cat_0    ?? null,
          fun_06:      at.fun_06_cat_0    ?? null,
          fun_07:      at.fun_07_cat_0    ?? null,
          fun_08:      at.fun_08_cat_0    ?? null,
          fun_09:      at.fun_09_cat_0    ?? null,
          fun_mul:     at.fun_mul_cat_0   ?? null,  // Multietapa/Multi/Correção de Fluxo
          // Ensino Médio
          medio:       at.med_cat_0       ?? at.media_med     ?? null,
          med_01:      at.med_01_cat_0    ?? null,
          med_02:      at.med_02_cat_0    ?? null,
          med_03:      at.med_03_cat_0    ?? null,
          med_04:      at.med_04_cat_0    ?? null,
          med_ns:      at.med_ns_cat_0    ?? null,
        };
      }),
      had: anos.map((a: number) => {
        const h = indicadores[a]?.had;
        if (!h) return { ano: a };
        return {
          ano: a,
          // Educação Infantil
          inf_total:   h.inf_cat_0       ?? null,
          inf_cre:     h.inf_cre_cat_0   ?? null,
          inf_pre:     h.inf_pre_cat_0   ?? null,
          // Ensino Fundamental
          fund:        h.fun_cat_0       ?? h.media_fund    ?? null,
          fund_ai:     h.fun_ai_cat_0    ?? h.media_fund_ai ?? null,
          fund_af:     h.fun_af_cat_0    ?? h.media_fund_af ?? null,
          fun_01:      h.fun_01_cat_0    ?? null,
          fun_02:      h.fun_02_cat_0    ?? null,
          fun_03:      h.fun_03_cat_0    ?? null,
          fun_04:      h.fun_04_cat_0    ?? null,
          fun_05:      h.fun_05_cat_0    ?? null,
          fun_06:      h.fun_06_cat_0    ?? null,
          fun_07:      h.fun_07_cat_0    ?? null,
          fun_08:      h.fun_08_cat_0    ?? null,
          fun_09:      h.fun_09_cat_0    ?? null,
          // Ensino Médio
          medio:       h.med_cat_0       ?? h.media_med     ?? null,
          med_01:      h.med_01_cat_0    ?? null,
          med_02:      h.med_02_cat_0    ?? null,
          med_03:      h.med_03_cat_0    ?? null,
          med_04:      h.med_04_cat_0    ?? null,
          med_ns:      h.med_ns_cat_0    ?? null,
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
        return {
          ano: a,
          media: ins.media_inse ?? ins.valor ?? null,
          classificacao: ins.inse_classificacao ?? ins.nivel_inse ?? null,
          qtd_alunos: ins.qtd_alunos_inse ?? null,
          // distribuição pelos 8 níveis INSE (% dos alunos)
          n1: ins.pc_nivel_1 ?? null, n2: ins.pc_nivel_2 ?? null,
          n3: ins.pc_nivel_3 ?? null, n4: ins.pc_nivel_4 ?? null,
          n5: ins.pc_nivel_5 ?? null, n6: ins.pc_nivel_6 ?? null,
          n7: ins.pc_nivel_7 ?? null, n8: ins.pc_nivel_8 ?? null,
        };
      }),
      saeb: anos.map((a: number) => {
        const s = indicadores[a]?.saeb;
        if (!s) return { ano: a };
        return { ano: a, mt_ai: s.nota_mt_ai ?? null, lp_ai: s.nota_lp_ai ?? null, mt_af: s.nota_mt_af ?? null, lp_af: s.nota_lp_af ?? null, mt_em: s.nota_mt_em ?? null, lp_em: s.nota_lp_em ?? null };
      }),
      ied: anos.map((a: number) => {
        const ie = indicadores[a]?.ied;
        if (!ie) return { ano: a };
        return {
          ano: a,
          nivel_1: ie.nivel_1 ?? null, nivel_2: ie.nivel_2 ?? null, nivel_3: ie.nivel_3 ?? null,
          nivel_4: ie.nivel_4 ?? null, nivel_5: ie.nivel_5 ?? null, nivel_6: ie.nivel_6 ?? null,
          fund_ai_nivel_1: ie.fund_ai_nivel_1 ?? null, fund_ai_nivel_2: ie.fund_ai_nivel_2 ?? null,
          fund_ai_nivel_3: ie.fund_ai_nivel_3 ?? null, fund_ai_nivel_4: ie.fund_ai_nivel_4 ?? null,
          fund_ai_nivel_5: ie.fund_ai_nivel_5 ?? null, fund_ai_nivel_6: ie.fund_ai_nivel_6 ?? null,
          fund_af_nivel_1: ie.fund_af_nivel_1 ?? null, fund_af_nivel_2: ie.fund_af_nivel_2 ?? null,
          fund_af_nivel_3: ie.fund_af_nivel_3 ?? null, fund_af_nivel_4: ie.fund_af_nivel_4 ?? null,
          fund_af_nivel_5: ie.fund_af_nivel_5 ?? null, fund_af_nivel_6: ie.fund_af_nivel_6 ?? null,
          med_nivel_1: ie.med_nivel_1 ?? null, med_nivel_2: ie.med_nivel_2 ?? null,
          med_nivel_3: ie.med_nivel_3 ?? null, med_nivel_4: ie.med_nivel_4 ?? null,
          med_nivel_5: ie.med_nivel_5 ?? null, med_nivel_6: ie.med_nivel_6 ?? null,
        };
      }),
      tnr: anos.map((a: number) => {
        const t = indicadores[a]?.taxa_nao_resposta;
        if (!t) return { ano: a };
        return {
          ano: a,
          fund: t.taxa_nao_resposta_fund ?? t.tnr_fund ?? null,
          med:  t.taxa_nao_resposta_med  ?? t.tnr_med  ?? null,
          fund_ai: t.taxa_nao_resposta_fund_ai ?? null,
          fund_af: t.taxa_nao_resposta_fund_af ?? null,
          // por série — Fundamental Anos Iniciais
          f01: t.tnr_fun_01 ?? null, f02: t.tnr_fun_02 ?? null, f03: t.tnr_fun_03 ?? null,
          f04: t.tnr_fun_04 ?? null, f05: t.tnr_fun_05 ?? null,
          // por série — Fundamental Anos Finais
          f06: t.tnr_fun_06 ?? null, f07: t.tnr_fun_07 ?? null,
          f08: t.tnr_fun_08 ?? null, f09: t.tnr_fun_09 ?? null,
          // por série — Ensino Médio
          m01: t.tnr_med_01 ?? null, m02: t.tnr_med_02 ?? null,
          m03: t.tnr_med_03 ?? null, m04: t.tnr_med_04 ?? null,
        };
      }),
      afd: anos.map((a: number) => {
        const af = indicadores[a]?.afd;
        if (!af) return { ano: a };
        const g = (base: string, n: number) => af[`${base}_cat_${n}`] ?? null;
        return {
          ano: a,
          // Ed. Infantil (INF_)
          inf_g1: g('inf', 1), inf_g2: g('inf', 2), inf_g3: g('inf', 3), inf_g4: g('inf', 4), inf_g5: g('inf', 5),
          // Fundamental Total (FUN_)
          fun_g1: g('fun', 1), fun_g2: g('fun', 2), fun_g3: g('fun', 3), fun_g4: g('fun', 4), fun_g5: g('fun', 5),
          // Fundamental AI (FUN_AI_)
          fun_ai_g1: g('fun_ai', 1), fun_ai_g2: g('fun_ai', 2), fun_ai_g3: g('fun_ai', 3), fun_ai_g4: g('fun_ai', 4), fun_ai_g5: g('fun_ai', 5),
          // Fundamental AF (FUN_AF_)
          fun_af_g1: g('fun_af', 1), fun_af_g2: g('fun_af', 2), fun_af_g3: g('fun_af', 3), fun_af_g4: g('fun_af', 4), fun_af_g5: g('fun_af', 5),
          // Ensino Médio (MED_)
          med_g1: g('med', 1), med_g2: g('med', 2), med_g3: g('med', 3), med_g4: g('med', 4), med_g5: g('med', 5),
          // EJA Fundamental
          eja_fun_g1: g('eja_fun', 1), eja_fun_g2: g('eja_fun', 2), eja_fun_g3: g('eja_fun', 3), eja_fun_g4: g('eja_fun', 4), eja_fun_g5: g('eja_fun', 5),
          // EJA Médio
          eja_med_g1: g('eja_med', 1), eja_med_g2: g('eja_med', 2), eja_med_g3: g('eja_med', 3), eja_med_g4: g('eja_med', 4), eja_med_g5: g('eja_med', 5),
        };
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

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="relative overflow-hidden rounded-[34px] border border-[#d9ceb8] bg-[#fbf7ee] shadow-[0_20px_60px_rgba(90,80,50,0.10)] p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel de Dados Educacionais</h1>
          <p className="text-sm text-muted-foreground mt-1">Fonte: INEP/MEC, FNDE e Banco do Brasil</p>
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
                <div className="summary-grid" style={{gridTemplateColumns: 'repeat(4, 1fr)'}}>
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
                justifyContent: 'center',
                alignItems: 'stretch',
                gap: '32px',
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
                    flex: '1 1 0',
                    minWidth: 260,
                    maxWidth: 560,
                    padding: '24px 28px 22px 28px',
                    position: 'relative',
                    fontFamily: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{marginBottom:'10px',textAlign:'center'}}>
                    <span className="scribble" style={{fontSize:'15px',color:'#b59f3b',background:'#fffbe7',padding:'2px 10px',borderRadius:'10px'}}>Bilhete da Diretora</span>
                  </div>
                  <div style={{fontSize:'15px',color:'#4f4126',lineHeight:1.6,textAlign:'center'}}>
                    <strong style={{fontSize:'17px',color:'#4f4126'}}>Diretora, este painel utiliza os dados do Censo Escolar {selectedAno}, realizado pelo INEP/MEC.</strong>
                    <p style={{margin:'8px 0 0',fontSize:'14px',color:'#3d4d5a'}}>
                      É o principal levantamento sobre a educação básica no Brasil. Os números apresentados aqui representam o retrato mais atualizado da educação brasileira e podem ser usados como referência para comparar a realidade da sua escola com o município, o estado e o Brasil.
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
                    flex: '1 1 0',
                    minWidth: 260,
                    maxWidth: 560,
                    padding: '24px 28px 22px 28px',
                    position: 'relative',
                    fontFamily: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{marginBottom:'10px',textAlign:'center'}}>
                    <span className="scribble" style={{fontSize:'15px',color:'#00838f',background:'#e0f7fa',padding:'2px 10px',borderRadius:'10px'}}>Situação das Escolas</span>
                  </div>
                  <div style={{fontSize:'15px',color:'#006064',lineHeight:1.6,textAlign:'center'}}>
                    <p style={{margin:'0',fontSize:'14px',color:'#006064'}}>
                      Nem todas as escolas são iguais. Muitas escolas rurais possuem poucos alunos, enquanto escolas urbanas costumam ter mais matrículas. Por isso, ao comparar escolas, é importante observar também o tamanho da escola, a localização (urbana ou rural) e a rede de ensino. Os dados apresentados aqui ajudam a entender o contexto educacional e não devem ser usados isoladamente para avaliar a qualidade de uma escola.
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
                          clickedUf={similarMode ? null : clickedUf}
                          similarMode={similarMode}
                          similarUfCounts={similarMode ? (similarData?.por_uf ?? {}) : undefined}
                          onStateClick={(uf) => {
                            if (similarMode) {
                              setSimilarClickedUf(prev => prev === uf ? null : uf);
                            } else {
                              setClickedUf(prev => prev === uf ? null : uf);
                              setFilterUf(uf);
                              setFilterDep("");
                              setListPage(1);
                            }
                          }}
                        />
                      </CardContent>
                    </Card>

                    {/* Modal flutuante removido daqui — renderizado no nível da página abaixo */}

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

                    {/* card de similares movido para ficha da escola */}
                  </div>
                </div>

                {/* Card: Situação das Escolas */}
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

                {/* Cards: O que mudou de 2024 para 2025 */}
                {censoInsightsNacional?.campos?.length > 0 && (() => {
                  const campos = censoInsightsNacional.campos as any[];
                  const todos = campos.filter(c => c.diff_pp !== 0 && c.pct_2025 > 0);
                  const aumentou = todos.filter(c => c.diff_pp > 0).sort((a, b) => b.diff_pp - a.diff_pp).slice(0, 5);
                  const diminuiu = todos.filter(c => c.diff_pp < 0).sort((a, b) => a.diff_pp - b.diff_pp).slice(0, 5);
                  if (!aumentou.length && !diminuiu.length) return null;

                  const MiniCard = ({ cam }: { cam: any }) => {
                    const ganhou = cam.diff_pp > 0;
                    const abs = Math.abs(cam.diff_pp);
                    const deltaN = Math.round(cam.total_2025 - cam.total_2024);
                    return (
                      <div style={{
                        background: ganhou ? "#f0fdf4" : "#fff5f5",
                        borderRadius: 10,
                        padding: "10px 11px",
                        border: `1px solid ${ganhou ? "#bbf7d0" : "#fecaca"}`,
                        display: "flex", flexDirection: "column", gap: 4,
                        flex: "1 1 0", minWidth: 0,
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#1e293b", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {cam.label}
                        </span>
                        <div style={{ marginTop: 2 }}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: ganhou ? "#16a34a" : "#dc2626", display: "block", lineHeight: 1 }}>
                            {ganhou ? "▲" : "▼"} {abs.toFixed(1)}<span style={{ fontSize: 10, fontWeight: 600 }}>p.p.</span>
                          </span>
                          <span style={{ fontSize: 10, color: "#64748b" }}>
                            {cam.pct_2024}% → <strong style={{ color: "#334155" }}>{cam.pct_2025}%</strong>
                          </span>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: ganhou ? "#15803d" : "#b91c1c" }}>
                          {ganhou ? "+" : ""}{deltaN.toLocaleString("pt-BR")} escolas
                        </span>
                      </div>
                    );
                  };

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {aumentou.length > 0 && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#15803d", marginBottom: 7, display: "flex", alignItems: "center", gap: 5 }}>
                            📈 O que aumentou — 2024 → 2025
                          </div>
                          <div style={{ display: "flex", gap: 7 }}>
                            {aumentou.map((cam: any) => <MiniCard key={cam.key} cam={cam} />)}
                          </div>
                        </div>
                      )}
                      {diminuiu.length > 0 && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#b91c1c", marginBottom: 7, display: "flex", alignItems: "center", gap: 5 }}>
                            📉 O que diminuiu — 2024 → 2025
                          </div>
                          <div style={{ display: "flex", gap: 7 }}>
                            {diminuiu.map((cam: any) => <MiniCard key={cam.key} cam={cam} />)}
                          </div>
                        </div>
                      )}
                      <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>
                        Fonte: Censo Escolar INEP/MEC. p.p. = pontos percentuais.
                      </p>
                    </div>
                  );
                })()}


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
                  { id: 'matriculas', label: 'Matrículas', icon: '👩‍🎓', etapas: true, data: evolucaoData.anos_disponiveis.slice().sort((a:number,b:number)=>a-b).map((a: number) => { const c = evolucaoData.censo_por_ano[a]; return { ano: String(a), 'Total': c?.qt_mat_bas || null, 'E. Infantil': c?.qt_mat_inf || null, 'Fundamental': c?.qt_mat_fund || null, 'Médio': c?.qt_mat_med || null, 'EJA': c?.qt_mat_eja || null }; }), lines: [{ key: 'Total', color: '#2d5a88', name: 'Total', etapa: 'total' }, { key: 'E. Infantil', color: '#7c5cbf', name: 'E. Infantil', etapa: 'inf' }, { key: 'Fundamental', color: '#2f7a58', name: 'Fundamental', etapa: 'fund' }, { key: 'Médio', color: '#9b6a16', name: 'Médio', etapa: 'med' }, { key: 'EJA', color: '#b74f42', name: 'EJA', etapa: 'eja' }], desc: 'Total de alunos matriculados por etapa de ensino.' },
                  { id: 'docentes', label: 'Docentes', icon: '🧑‍🏫', etapas: true, data: evolucaoData.anos_disponiveis.slice().sort((a:number,b:number)=>a-b).map((a: number) => { const c = evolucaoData.censo_por_ano[a]; return { ano: String(a), 'Total': c?.qt_doc_bas || c?.qt_docentes || null, 'E. Infantil': c?.qt_doc_inf || null, 'Fundamental': c?.qt_doc_fund || null, 'Médio': c?.qt_doc_med || null }; }), lines: [{ key: 'Total', color: '#9b6a16', name: 'Total', etapa: 'total' }, { key: 'E. Infantil', color: '#7c5cbf', name: 'E. Infantil', etapa: 'inf' }, { key: 'Fundamental', color: '#2f7a58', name: 'Fundamental', etapa: 'fund' }, { key: 'Médio', color: '#c47a1f', name: 'Médio', etapa: 'med' }], desc: 'Número de docentes atuando por etapa de ensino.' },
                  { id: 'turmas', label: 'Turmas', icon: '🏫', etapas: true, data: evolucaoData.anos_disponiveis.slice().sort((a:number,b:number)=>a-b).map((a: number) => { const c = evolucaoData.censo_por_ano[a]; return { ano: String(a), 'Total': c?.qt_tur_bas || c?.qt_turmas || null, 'E. Infantil': c?.qt_tur_inf || null, 'Fundamental': c?.qt_tur_fund || null, 'Médio': c?.qt_tur_med || null }; }), lines: [{ key: 'Total', color: '#2f7a58', name: 'Total', etapa: 'total' }, { key: 'E. Infantil', color: '#7c5cbf', name: 'E. Infantil', etapa: 'inf' }, { key: 'Fundamental', color: '#2d5a88', name: 'Fundamental', etapa: 'fund' }, { key: 'Médio', color: '#9b6a16', name: 'Médio', etapa: 'med' }], desc: 'Total de turmas por etapa de ensino.' },
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
                  ...(ch?.tnr && ch.tnr.some((d:any) => d.fund != null || d.med != null) ? [{ id: 'tnr', label: 'Não Resposta', icon: '🚫', data: ch.tnr.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'Fundamental': d.fund, 'Médio': d.med })), lines: [{ key: 'Fundamental', color: '#2d5a88', name: 'Fundamental' },{ key: 'Médio', color: '#9b6a16', name: 'Médio' }], desc: 'TNR — % de alunos que não participaram da avaliação Prova Brasil/SAEB. Afeta o IDEB.' }] : []),
                ].filter(c => c.data.some((d: Record<string, any>) => Object.values(d).slice(1).some((v: any) => v != null && Number(v) > 0)));
                const currentChart = available.find(c => c.id === selectedChart) || available[0];
                return (
              <>
                {/* ── STICKY HEADER — aparece ao rolar ── */}
                {scrolled && selectedInep && (
                  <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                    background: 'rgba(251,247,238,0.97)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid #e0d4b8',
                    padding: '8px 20px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    boxShadow: '0 2px 16px rgba(90,80,50,0.10)',
                    animation: 'fadeSlideDown 0.2s ease',
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#3d2b1a', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {evolucaoData.escola.no_entidade}
                    </div>
                    <span style={{ fontSize: 12, color: '#8a7a6a', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      📍 {evolucaoData.escola.no_municipio}/{evolucaoData.escola.sg_uf}
                    </span>
                    <span style={{ fontSize: 11, color: '#bbb', fontWeight: 600, flexShrink: 0 }}>INEP {selectedInep}</span>
                    {criticals.length > 0 && (
                      <span style={{ background: '#fff0f0', color: '#c0392b', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid #f5c6cb', flexShrink: 0 }}>
                        ⚠️ {criticals.length} {criticals.length !== 1 ? 'precisam' : 'precisa'} de atenção
                      </span>
                    )}
                  </div>
                )}

                {/* ── CABEÇALHO APENAS PARA IMPRESSÃO ── */}
                <div className="print-only-header">
                  <div className="print-brand">
                    <span className="print-brand-logo">Chegou a Conta,</span>
                    <span className="print-brand-highlight"> Diretora!</span>
                  </div>
                  <div className="print-school-name">{evolucaoData.escola.no_entidade}</div>
                  <div className="print-meta-row">
                    <span>📍 {evolucaoData.escola.no_municipio}/{evolucaoData.escola.sg_uf}</span>
                    <span>INEP {selectedInep}</span>
                    <span>{evolucaoData.escola.ds_dependencia}</span>
                    <span>{evolucaoData.escola.ds_localizacao}</span>
                    <span>{evolucaoData.escola.ds_situacao}</span>
                  </div>
                  <div className="print-divider" />
                </div>

                {/* ── HERO ── */}
                <section className="hero">
                  <div className="hero-inner">
                    <div>
                      <div className="eyebrow">
                        <span className="scribble">Ficha Completa</span>
                      </div>
                      <h1 style={{margin:'12px 0 8px',fontSize:'clamp(20px,3vw,34px)',lineHeight:'1.06',letterSpacing:'-0.04em'}}>
                        {evolucaoData.escola.no_entidade}
                      </h1>
                      <p style={{margin:0,color:'var(--m-muted)',fontSize:'14px',lineHeight:'1.6'}}>
                        Aqui você encontra dados públicos da sua escola e o histórico desde 2020, permitindo acompanhar a evolução das matrículas, docentes, infraestrutura, indicadores educacionais e recursos financeiros.
                      </p>
                      <div className="school-meta">
                        <div className="meta-chip" style={{display:'inline-flex',alignItems:'center',gap:5}}><MapPin className="w-3.5 h-3.5" style={{flexShrink:0}} /> {evolucaoData.escola.no_municipio}/{evolucaoData.escola.sg_uf}</div>
                        <div className="meta-chip" style={{display:'inline-flex',alignItems:'center',gap:5}}><Hash className="w-3.5 h-3.5" style={{flexShrink:0}} /> INEP {selectedInep}</div>
                        <div className="meta-chip" style={{display:'inline-flex',alignItems:'center',gap:5}}><Building2 className="w-3.5 h-3.5" style={{flexShrink:0}} /> {evolucaoData.escola.ds_dependencia}</div>
                        <div className="meta-chip" style={{display:'inline-flex',alignItems:'center',gap:5}}>{evolucaoData.escola.ds_localizacao === 'Rural' ? <TreePine className="w-3.5 h-3.5" style={{flexShrink:0}} /> : <Globe className="w-3.5 h-3.5" style={{flexShrink:0}} />} {evolucaoData.escola.ds_localizacao}</div>
                        <div className="meta-chip" style={{display:'inline-flex',alignItems:'center',gap:5}}><CheckCircle className="w-3.5 h-3.5" style={{flexShrink:0}} /> {evolucaoData.escola.ds_situacao}</div>
                        {evolucaoData.anos_disponiveis.length > 0 && (
                          <div className="meta-chip" style={{display:'inline-flex',alignItems:'center',gap:5}}><CalendarDays className="w-3.5 h-3.5" style={{flexShrink:0}} /> {Math.min(...evolucaoData.anos_disponiveis)}–{Math.max(...evolucaoData.anos_disponiveis)}</div>
                        )}
                      </div>

                      {/* Botão de escolas similares — sempre visível na ficha */}
                      <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => { setSimilarMode(true); setSimilarClickedUf(null); }}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 8,
                            padding: "10px 20px", background: "#0d9488", color: "#fff",
                            border: "none", borderRadius: 14, fontWeight: 700, fontSize: 14,
                            cursor: "pointer", boxShadow: "0 2px 8px rgba(13,148,136,0.3)",
                            transition: "all .2s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#0f766e")}
                          onMouseLeave={e => (e.currentTarget.style.background = "#0d9488")}
                        >
                          🔍 Ver escolas com perfil similar
                        </button>
                        <button
                          onClick={() => window.print()}
                          title="Imprimir / Salvar PDF"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "6px 12px", background: "transparent", color: "#b8a899",
                            border: "1px solid #e0d5c0", borderRadius: 10, fontWeight: 500, fontSize: 12,
                            cursor: "pointer", transition: "all .2s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#5d4037"; e.currentTarget.style.borderColor = '#c4b49e'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "#b8a899"; e.currentTarget.style.borderColor = '#e0d5c0'; }}
                        >
                          🖨️ imprimir
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ── FAIXA DE DIAGNÓSTICO ── */}
                {(() => {
                  const idebLatest = ch?.ideb?.slice().sort((a:any,b:any) => b.ano - a.ano)[0];
                  const bestIdeb = idebLatest ? ([idebLatest.ideb_ai, idebLatest.ideb_af, idebLatest.ideb_em].filter((v): v is number => v != null).reduce((mx,v) => v > mx ? v : mx, 0) || null) : null;
                  const rendLatestD = ch?.taxasRendimento?.slice().sort((a:any,b:any)=>b.ano-a.ano).find((d:any) => d.abandono != null);
                  const abandono = rendLatestD?.abandono ?? null;
                  const pddeAdimplente = prestacaoContaData?.ok && prestacaoContaData.itens.length > 0
                    ? prestacaoContaData.itens.every((it:any) => it.situacao_pc_uex?.toLowerCase().includes('adimpl'))
                    : null;
                  const diagChips = [
                    bestIdeb != null ? { label: 'IDEB', val: Number(bestIdeb).toFixed(1), status: bestIdeb >= 6 ? 'ok' : bestIdeb >= 4 ? 'warn' : 'bad' } : null,
                    abandono != null ? { label: 'Abandono', val: `${Number(abandono).toFixed(1)}%`, status: Number(abandono) < 1 ? 'ok' : Number(abandono) < 5 ? 'warn' : 'bad' } : null,
                    pddeAdimplente !== null ? { label: 'PDDE', val: pddeAdimplente ? 'Adimplente' : 'Verificar', status: pddeAdimplente ? 'ok' : 'warn' } : null,
                    total === 0 ? { label: 'Alertas', val: 'Tudo certo', status: 'ok' } : null,
                    criticals.length > 0 ? { label: `${criticals.length} ${criticals.length !== 1 ? 'precisam' : 'precisa'} de atenção`, val: 'ver alertas', status: 'bad' } : null,
                    warnings.length > 0 && criticals.length === 0 ? { label: `${warnings.length} atenção`, val: 'ver alertas', status: 'warn' } : null,
                  ].filter(Boolean) as { label: string; val: string; status: 'ok'|'warn'|'bad' }[];
                  if (diagChips.length === 0) return null;
                  const col = { ok: { bg:'#eef7f1', txt:'#2f7a58', bd:'#c7e8d6', dot:'#34a97b' }, warn: { bg:'#fffbec', txt:'#9b6a16', bd:'#f7d87c', dot:'#c47a1f' }, bad: { bg:'#fff0f0', txt:'#c0392b', bd:'#f5c6cb', dot:'#c0392b' } };
                  return (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:'4px 0 8px', margin:'0 0 4px' }}>
                      {diagChips.map((chip, i) => {
                        const c = col[chip.status];
                        return (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 14px', borderRadius:22, background:c.bg, border:`1px solid ${c.bd}` }}>
                            <div style={{ width:7, height:7, borderRadius:'50%', background:c.dot, flexShrink:0 }} />
                            <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:c.txt, opacity:0.75 }}>{chip.label}</span>
                            <span style={{ fontSize:13, fontWeight:800, color:c.txt }}>{chip.val}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* ── PAINÉIS DE CONTEXTO: EQUIPAMENTOS PÚBLICOS + SUPORTE INSTITUCIONAL ── */}
                {(() => {
                  const coMunicipio = censoLatest?.co_municipio || evolucaoData?.escola?.co_municipio;
                  const nomeMunicipio = evolucaoData?.escola?.no_municipio || '';
                  const sgUf = evolucaoData?.escola?.sg_uf || '';

                  const classifyOsmElement = (tags: Record<string, string>): string | null => {
                    const name = (tags.name || '').toLowerCase();
                    const amenity = (tags.amenity || '').toLowerCase();
                    const healthcare = (tags.healthcare || '').toLowerCase();
                    if (/conselho\s+tutelar/.test(name)) return 'conselho_tutelar';
                    if (/\bcras\b/.test(name)) return 'cras';
                    if (/\bcreas\b/.test(name)) return 'creas';
                    if (/centro\s+pop/.test(name)) return 'centro_pop';
                    if (/pronto\s+socorro|pronto-socorro|upa\b/.test(name)) return 'pronto_socorro';
                    if (amenity === 'hospital' || healthcare === 'hospital') return 'hospital';
                    if (/\bubs\b|unidade\s+b[áa]sica|centro\s+de\s+sa[úu]de|posto\s+de\s+sa[úu]de|psf\b|usf\b|esf\b|unidade\s+de\s+sa[úu]de/.test(name)) return 'ubs';
                    if (amenity === 'clinic' || amenity === 'health_centre' || healthcare === 'clinic' || healthcare === 'centre') return 'ubs';
                    if (amenity === 'doctors' || healthcare === 'doctor') return 'ubs';
                    return null;
                  };

                  const classifyCnes = (est: any): string | null => {
                    const tp = (est.descricao_tipo_unidade || '').toLowerCase();
                    const nm = ((est.nome_fantasia || est.nome_razao_social) || '').toLowerCase();
                    const full = nm + ' ' + tp;
                    if (/pronto[- ]socorro|upa\b|upas\b|urgência|urgencia|upa -/.test(full)) return 'pronto_socorro';
                    if (/hospital\b/.test(full)) return 'hospital';
                    if (/cras\b|centro de referência da assist|centro de refer.ncia da assist/.test(full)) return 'cras';
                    if (/creas\b|centro de referência especializ|centro de refer.ncia especializ/.test(full)) return 'creas';
                    if (/centro pop\b|pop de rua/.test(full)) return 'centro_pop';
                    if (/conselho tutelar/.test(full)) return 'conselho_tutelar';
                    if (/abrigo|casa lar|albergue/.test(full)) return 'abrigos';
                    if (/posto de sa[uú]de|unidade b[áa]sica|centro de sa[uú]de|unidade de sa[uú]de|policl[íi]nica|usf\b|psf\b|esf\b|ubsf?\b|ubds\b|unidade mista/.test(full)) return 'ubs';
                    if (/sa[uú]de da fam[íi]lia|saúde da família|estratégia/.test(full)) return 'ubs';
                    return null;
                  };

                  const fetchOsmData = (coMun: string) => {
                    if (!coMun || osmUnidades !== null || osmLoading) return;
                    setOsmLoading(true);

                    const coMunSeis = String(coMun).length === 7 ? String(coMun).slice(0, 6) : String(coMun);

                    const cats: Record<string, any[]> = {
                      conselho_tutelar: [], cras: [], creas: [], centro_pop: [],
                      ubs: [], hospital: [], pronto_socorro: [], abrigos: [],
                    };

                    const ctrl = new AbortController();
                    const timer = setTimeout(() => ctrl.abort(), 32000);

                    // ── 1. CNES (Ministério da Saúde) — endereços oficiais ──
                    const cnesPromise = fetch(
                      `https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?codigo_municipio=${coMunSeis}&limit=300`,
                      { signal: ctrl.signal }
                    )
                      .then(r => r.ok ? r.json() : null)
                      .then((data: any) => {
                        if (!data?.estabelecimentos) return;
                        for (const est of data.estabelecimentos) {
                          const cat = classifyCnes(est);
                          if (cat && cats[cat]) {
                            const lat = est.latitude ? parseFloat(est.latitude) : null;
                            const lon = est.longitude ? parseFloat(est.longitude) : null;
                            const logr = [est.logradouro, est.numero].filter(Boolean).join(', ');
                            const endStr = [logr, est.bairro, est.municipio, est.cep ? `CEP ${est.cep}` : ''].filter(Boolean).join(' — ');
                            cats[cat].push({
                              source: 'cnes',
                              nome: est.nome_fantasia || est.nome_razao_social || null,
                              endereco: endStr || null,
                              telefone: est.telefone || null,
                              lat, lon,
                              mapsUrl: (lat && lon) ? `https://www.google.com/maps?q=${lat},${lon}` : null,
                            });
                          }
                        }
                      })
                      .catch(() => {});

                    // ── 2. Overpass/OSM — complementa com equipamentos sociais ──
                    const overpassQuery = `[out:json][timeout:25];
(
  rel["ref:IBGE"="${coMun}"]["boundary"="administrative"];
)->.r;
map_to_area(.r)->.mun;
(
  node(area.mun)[amenity~"^(clinic|hospital|doctors|health_centre|social_facility)$"];
  node(area.mun)[healthcare~"^(hospital|clinic|centre|doctor)$"];
  node(area.mun)[social_facility~"^(shelter|emergency|outreach)$"];
  node(area.mun)[office="government"][name~"conselho tutelar|CRAS|CREAS|centro pop",i];
  node(area.mun)[name~"conselho tutelar|CRAS|CREAS|centro pop|pronto socorro|UBS|UPA|posto de saude|centro de saude|unidade de saude|unidade basica|PSF|USF|ESF|abrigo|casa lar|albergue",i];
  way(area.mun)[amenity~"^(clinic|hospital|social_facility)$"];
  way(area.mun)[healthcare~"^(hospital|clinic|centre)$"];
  way(area.mun)[name~"conselho tutelar|CRAS|CREAS|pronto socorro|UBS|UPA|posto de saude|PSF|abrigo",i];
);
out center tags 100;`;
                    const overpassPromise = fetch('https://overpass-api.de/api/interpreter', {
                      method: 'POST',
                      body: new URLSearchParams({ data: overpassQuery }),
                      signal: ctrl.signal,
                    })
                      .then(r => r.json())
                      .then((json: any) => {
                        const elements: any[] = json.elements || [];
                        const seen = new Set<number>();
                        for (const el of elements) {
                          if (seen.has(el.id)) continue;
                          seen.add(el.id);
                          const cat = classifyOsmElement(el.tags || {});
                          if (cat && cats[cat]) {
                            const t = el.tags || {};
                            const lat = el.lat ?? el.center?.lat ?? null;
                            const lon = el.lon ?? el.center?.lon ?? null;
                            const street = t['addr:street'] || t['addr:place'] || '';
                            const num = t['addr:housenumber'] || '';
                            const bairro = t['addr:suburb'] || t['addr:neighbourhood'] || t['addr:district'] || '';
                            const cep = t['addr:postcode'] || '';
                            const city = t['addr:city'] || '';
                            const streetPart = [street, num].filter(Boolean).join(', ');
                            const endStr = [streetPart, bairro, city, cep].filter(Boolean).join(' — ');
                            cats[cat].push({
                              source: 'osm',
                              nome: t.name || t['name:pt'] || null,
                              endereco: endStr || null,
                              telefone: t.phone || t['contact:phone'] || t['contact:mobile'] || null,
                              horario: t.opening_hours || null,
                              website: t.website || t['contact:website'] || null,
                              lat, lon,
                              mapsUrl: (lat && lon) ? `https://www.google.com/maps?q=${lat},${lon}` : null,
                            });
                          }
                        }
                      })
                      .catch(() => {});

                    Promise.allSettled([cnesPromise, overpassPromise]).then(() => {
                      clearTimeout(timer);
                      // dedup: remove OSM duplicates se CNES já cobriu a categoria com nome similar
                      for (const cat of Object.keys(cats)) {
                        const cnesNames = new Set(
                          cats[cat].filter((u: any) => u.source === 'cnes').map((u: any) => (u.nome || '').toLowerCase().slice(0, 20))
                        );
                        cats[cat] = cats[cat].filter((u: any) =>
                          u.source === 'cnes' || !cnesNames.has((u.nome || '').toLowerCase().slice(0, 20))
                        );
                      }
                      setOsmUnidades({ ...cats });
                      setOsmLoading(false);
                    });

                  };

                  const handleToggleEquipamentos = () => {
                    const next = !showEquipamentos;
                    setShowEquipamentos(next);
                    if (next && coMunicipio) {
                      if (!equipamentosData && !equipamentosLoading) {
                        setEquipamentosLoading(true);
                        fetch(`/api/equipamentos-publicos/${coMunicipio}`)
                          .then(r => r.json())
                          .then(d => { setEquipamentosData(d); setEquipamentosLoading(false); })
                          .catch(() => { setEquipamentosData({ ok: false }); setEquipamentosLoading(false); });
                      }
                      if (coMunicipio) fetchOsmData(String(coMunicipio));
                      // Busca CRAS/CREAS via cadunicobrasil.com.br
                      if (nomeMunicipio && sgUf && !crasData && !crasLoading) {
                        setCrasLoading(true);
                        Promise.all([
                          fetch(`/api/busca-cras?municipio=${encodeURIComponent(nomeMunicipio)}&uf=${sgUf}&tipo=cras`).then(r => r.json()).catch(() => ({ ok: false, units: [] })),
                          fetch(`/api/busca-cras?municipio=${encodeURIComponent(nomeMunicipio)}&uf=${sgUf}&tipo=creas`).then(r => r.json()).catch(() => ({ ok: false, units: [] })),
                        ]).then(([crasd, creasd]) => {
                          setCrasData({ cras: crasd.units || [], creas: creasd.units || [], ok: crasd.ok || creasd.ok });
                          setCrasLoading(false);
                        });
                      }
                    }
                  };

                  const CAT_META: Record<string, { icon: string; label: string; bg: string; border: string; txt: string; dot: string }> = {
                    conselho_tutelar: { icon: '⚖️', label: 'Conselho Tutelar',    bg: '#fff3e0', border: '#ffd180', txt: '#7a3f00', dot: '#ff8f00' },
                    cras:             { icon: '🏘️', label: 'CRAS',                bg: '#e8f5ee', border: '#b8dfc8', txt: '#1f6b45', dot: '#2f7a58' },
                    creas:            { icon: '🛡️', label: 'CREAS',               bg: '#e6eef8', border: '#b8cfe8', txt: '#1e4a78', dot: '#2d5a88' },
                    centro_pop:       { icon: '🏕️', label: 'Centro POP',          bg: '#fdf3e0', border: '#f0ddb5', txt: '#7a4a10', dot: '#d4870a' },
                    ubs:              { icon: '🏥', label: 'UBS / Posto de Saúde', bg: '#e3f2fd', border: '#90caf9', txt: '#0d47a1', dot: '#1565c0' },
                    hospital:         { icon: '🏨', label: 'Hospital',             bg: '#fce4ec', border: '#f48fb1', txt: '#880e4f', dot: '#c2185b' },
                    pronto_socorro:   { icon: '🚨', label: 'Pronto Socorro / UPA', bg: '#ffebee', border: '#ef9a9a', txt: '#b71c1c', dot: '#d32f2f' },
                    abrigos:          { icon: '🏠', label: 'Abrigos / Casa Lar',   bg: '#f3eeff', border: '#d4c4f5', txt: '#5b3fa8', dot: '#7c4dff' },
                  };

                  const UnitCard = ({ u, cat }: { u: any; cat: string }) => {
                    const m = CAT_META[cat] || CAT_META.ubs;
                    const mapsUrl = u.mapsUrl || (u.lat && u.lon ? `https://www.google.com/maps?q=${u.lat},${u.lon}` : null);
                    const mapsSearchUrl = u.nome ? `https://www.google.com/maps/search/${encodeURIComponent(u.nome)}` : null;
                    return (
                      <div style={{ background: '#fff', border: `1.5px solid ${m.border}`, borderRadius: 12, padding: '12px 14px', borderLeft: `4px solid ${m.dot}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                          <p style={{ fontWeight: 700, fontSize: 12, color: m.txt, margin: 0, lineHeight: 1.3 }}>{u.nome || m.label}</p>
                          {(mapsUrl || mapsSearchUrl) && (
                            <a href={mapsUrl || mapsSearchUrl!} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 10, color: '#1a73e8', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="#1a73e8"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                              Maps
                            </a>
                          )}
                        </div>
                        {u.endereco ? (
                          <p style={{ fontSize: 11, color: '#555', margin: '0 0 3px', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                            <span style={{ flexShrink: 0 }}>📍</span>
                            <span>
                              {u.endereco}
                              {u.endereco_verificado && (
                                <span style={{ marginLeft: 5, fontSize: 9, fontWeight: 700, color: '#2f7a58', background: '#d2f0e0', borderRadius: 8, padding: '1px 5px', verticalAlign: 'middle' }}>✓ mapa</span>
                              )}
                            </span>
                          </p>
                        ) : (
                          <p style={{ fontSize: 11, color: '#999', margin: '0 0 3px', fontStyle: 'italic' }}>
                            Endereço não disponível no mapa colaborativo
                          </p>
                        )}
                        {u.telefone && (
                          <p style={{ fontSize: 11, color: '#555', margin: '0 0 3px', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>📞</span>
                            <a href={`tel:${u.telefone.replace(/\D/g,'')}`} style={{ color: m.txt, textDecoration: 'none', fontWeight: 600 }}>{u.telefone}</a>
                          </p>
                        )}
                        {u.website && (
                          <p style={{ fontSize: 11, color: '#555', margin: '0 0 3px', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>🌐</span>
                            <a href={u.website} target="_blank" rel="noopener noreferrer" style={{ color: m.txt, textDecoration: 'underline' }}>Site oficial</a>
                          </p>
                        )}
                        {u.horario && (
                          <p style={{ fontSize: 10, color: '#888', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>🕐</span> {u.horario}
                          </p>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Botão 1: Equipamentos Públicos */}
                      <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #b8dfc8', background: '#f4fbf7' }}>
                        <button
                          onClick={handleToggleEquipamentos}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        >
                          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#d2f0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏛️</div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: '13px', color: '#1f6b45', margin: 0 }}>Equipamentos Públicos do Município</p>
                            <p style={{ fontSize: '11px', color: '#4a8a65', margin: 0 }}>CRAS, CREAS, UBS, Pronto Socorro, Conselho Tutelar — {nomeMunicipio || '—'}</p>
                          </div>
                          <span style={{ fontSize: '16px', color: '#4a8a65', transform: showEquipamentos ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
                        </button>

                        {showEquipamentos && (
                          <div style={{ padding: '0 18px 16px', borderTop: '1px solid #d2f0e0' }}>
                            {equipamentosLoading && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0', color: '#4a8a65', fontSize: 13 }}>
                                <Loader2 className="w-4 h-4 animate-spin" /> Consultando IBGE e mapa de equipamentos...
                              </div>
                            )}

                            {!equipamentosLoading && equipamentosData && (() => {
                              const counts = equipamentosData.suas_counts || {};
                              const totalOsm = osmUnidades ? Object.values(osmUnidades).reduce((s: number, arr: any) => s + arr.length, 0) : 0;
                              return (
                                <>
                                  {/* Contagens SUAS (IBGE) */}
                                  {Object.keys(counts).length > 0 && (() => {
                                    const suasList = Object.entries(counts)
                                      .filter(([, val]: [string, any]) => val.total && val.total !== 'Não aplicável' && val.total !== '0');
                                    const suasSummary = suasList.map(([, val]: [string, any]) => `${val.total} ${val.label}`).join(', ');
                                    return (
                                      <div style={{ marginTop: 14, marginBottom: 12 }}>
                                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4a8a65', marginBottom: 4 }}>Rede SUAS no município (IBGE 2013)</p>
                                        {suasSummary && <p style={{ fontSize: 12, color: '#2f7a58', marginBottom: 8, fontWeight: 600 }}>
                                          {nomeMunicipio} tem: {suasSummary}
                                        </p>}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                                          {Object.entries(counts).map(([key, val]: [string, any]) => {
                                            const m = CAT_META[key] || CAT_META.cras;
                                            const isNA = !val.total || val.total === 'Não aplicável' || val.total === '0';
                                            return (
                                              <div key={key} style={{ background: isNA ? '#f5f5f5' : m.bg, border: `1.5px solid ${isNA ? '#ddd' : m.border}`, borderRadius: 10, padding: '10px 12px', opacity: isNA ? 0.6 : 1 }}>
                                                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: isNA ? '#999' : m.txt, margin: '0 0 2px' }}>{m.icon} {val.label}</p>
                                                <p style={{ fontSize: 22, fontWeight: 800, color: isNA ? '#bbb' : m.txt, margin: '0 0 2px', lineHeight: 1 }}>{val.total ?? '—'}</p>
                                                {val.descricao && <p style={{ fontSize: 9, color: isNA ? '#aaa' : m.txt, margin: 0, opacity: 0.75, lineHeight: 1.3 }}>{val.descricao}</p>}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Unidades individuais (OSM) */}
                                  {osmLoading && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', color: '#4a8a65', fontSize: 12 }}>
                                      <Loader2 className="w-3 h-3 animate-spin" /> Localizando unidades com endereço...
                                    </div>
                                  )}
                                  {!osmLoading && osmUnidades && (totalOsm > 0 ? (
                                    <div style={{ marginTop: 6 }}>
                                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4a8a65', marginBottom: 8 }}>Unidades localizadas — CNES / Mapa colaborativo</p>
                                      {Object.entries(CAT_META).map(([cat, meta]) => {
                                        const items: any[] = osmUnidades[cat] || [];
                                        if (items.length === 0) return null;
                                        return (
                                          <div key={cat} style={{ marginBottom: 12 }}>
                                            <p style={{ fontSize: 11, fontWeight: 700, color: meta.txt, background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', marginBottom: 6 }}>
                                              {meta.icon} {meta.label} <span style={{ opacity: 0.7 }}>({items.length})</span>
                                            </p>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                                              {items.map((u: any, i: number) => <UnitCard key={i} u={u} cat={cat} />)}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div style={{ marginTop: 8, padding: '12px 14px', background: '#fffdf5', border: '1px solid #f0ddb5', borderRadius: 10, fontSize: 12, color: '#7a4a10' }}>
                                      <p style={{ margin: '0 0 8px', fontWeight: 600 }}>📍 Unidades não localizadas no CNES ou no mapa colaborativo para {nomeMunicipio}</p>
                                      <p style={{ margin: '0 0 8px', color: '#555', fontSize: 11 }}>Os equipamentos existem segundo o IBGE, mas não foram encontrados no CNES (Ministério da Saúde) nem no OpenStreetMap. Consulte diretamente nos sistemas oficiais:</p>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        <a href={`https://cadsuas.mds.gov.br/`} target="_blank" rel="noopener noreferrer"
                                          style={{ fontSize: 11, fontWeight: 600, color: '#1f6b45', background: '#d2f0e0', borderRadius: 20, padding: '3px 9px', textDecoration: 'none' }}>
                                          🏘️ CRAS/CREAS no CadSUAS ↗
                                        </a>
                                        <a href={`https://www.google.com/maps/search/CRAS+${encodeURIComponent(nomeMunicipio)}+${sgUf}`} target="_blank" rel="noopener noreferrer"
                                          style={{ fontSize: 11, fontWeight: 600, color: '#1e4a78', background: '#e6eef8', borderRadius: 20, padding: '3px 9px', textDecoration: 'none' }}>
                                          🗺️ CRAS no Maps ↗
                                        </a>
                                        <a href={`https://www.google.com/maps/search/CREAS+${encodeURIComponent(nomeMunicipio)}+${sgUf}`} target="_blank" rel="noopener noreferrer"
                                          style={{ fontSize: 11, fontWeight: 600, color: '#5b3fa8', background: '#f3eeff', borderRadius: 20, padding: '3px 9px', textDecoration: 'none' }}>
                                          🗺️ CREAS no Maps ↗
                                        </a>
                                        <a href={`https://cnes.datasus.gov.br/pages/estabelecimentos/consulta.jsp`} target="_blank" rel="noopener noreferrer"
                                          style={{ fontSize: 11, fontWeight: 600, color: '#0d47a1', background: '#e3f2fd', borderRadius: 20, padding: '3px 9px', textDecoration: 'none' }}>
                                          🏥 UBS/Hospital no CNES ↗
                                        </a>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Seção cadunicobrasil.com.br — CRAS e CREAS com endereço e telefone */}
                                  {crasLoading && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', color: '#4a8a65', fontSize: 12 }}>
                                      <Loader2 className="w-3 h-3 animate-spin" /> Consultando relação de CRAS e CREAS...
                                    </div>
                                  )}
                                  {!crasLoading && crasData && ((crasData.cras?.length > 0 || crasData.creas?.length > 0)) && (() => {
                                    const cadu_cras: any[] = (crasData.cras || []).map((u: any) => ({ ...u, source: 'cadunico', mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(u.nome + ' ' + u.endereco + ' ' + nomeMunicipio)}` }));
                                    const cadu_creas: any[] = (crasData.creas || []).map((u: any) => ({ ...u, source: 'cadunico', mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(u.nome + ' ' + u.endereco + ' ' + nomeMunicipio)}` }));
                                    return (
                                      <div style={{ marginTop: 12 }}>
                                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4a8a65', marginBottom: 8 }}>
                                          Unidades da Assistência Social — CadUnico Brasil
                                        </p>
                                        {cadu_cras.length > 0 && (
                                          <div style={{ marginBottom: 10 }}>
                                            <p style={{ fontSize: 11, fontWeight: 700, color: CAT_META.cras.txt, background: CAT_META.cras.bg, border: `1px solid ${CAT_META.cras.border}`, borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', marginBottom: 6 }}>
                                              {CAT_META.cras.icon} {CAT_META.cras.label} <span style={{ opacity: 0.7 }}>({cadu_cras.length})</span>
                                            </p>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                                              {cadu_cras.map((u: any, i: number) => <UnitCard key={i} u={u} cat="cras" />)}
                                            </div>
                                          </div>
                                        )}
                                        {cadu_creas.length > 0 && (
                                          <div style={{ marginBottom: 10 }}>
                                            <p style={{ fontSize: 11, fontWeight: 700, color: CAT_META.creas.txt, background: CAT_META.creas.bg, border: `1px solid ${CAT_META.creas.border}`, borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', marginBottom: 6 }}>
                                              {CAT_META.creas.icon} {CAT_META.creas.label} <span style={{ opacity: 0.7 }}>({cadu_creas.length})</span>
                                            </p>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                                              {cadu_creas.map((u: any, i: number) => <UnitCard key={i} u={u} cat="creas" />)}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  <p style={{ fontSize: '10px', color: '#6b8a74', marginTop: 10, marginBottom: 6 }}>
                                    {equipamentosData.ibge_fonte && <span>Contagens: {equipamentosData.ibge_fonte}. </span>}
                                    {osmUnidades && totalOsm > 0 && <span>Endereços: CNES/Min. Saúde e OpenStreetMap. </span>}
                                    {crasData && (crasData.cras?.length > 0 || crasData.creas?.length > 0) && <span>CRAS/CREAS: CadUnico Brasil. </span>}
                                    Dados podem estar desatualizados.
                                  </p>
                                </>
                              );
                            })()}

                            {!equipamentosLoading && !coMunicipio && (
                              <p style={{ fontSize: 12, color: '#888', padding: '12px 0' }}>Código IBGE do município não disponível para esta escola.</p>
                            )}

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                              {(equipamentosData?.links || [
                                { nome: 'Mapa SUAS', url: 'https://mapas.mds.gov.br/mapas/app/painel-suas/' },
                                { nome: 'CNES (saúde)', url: 'https://cnes.datasus.gov.br/' },
                                { nome: 'Dados SUAS', url: 'https://dados.gov.br/dataset/unidades-de-atendimento-da-assistencia-social' },
                                { nome: 'CadSUAS', url: 'https://cadsuas.mds.gov.br/' },
                              ]).map((link: any, i: number) => (
                                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: 11, fontWeight: 600, color: '#1f6b45', background: '#d2f0e0', borderRadius: 20, padding: '4px 10px', textDecoration: 'none' }}>
                                  {link.nome} ↗
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Botão 2: Suporte Institucional */}
                      <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #d4c4f5', background: '#f9f6ff' }}>
                        <button
                          onClick={() => setShowSuporteInstitucional(v => !v)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#e8deff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🤝</div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: '13px', color: '#5b3fa8', margin: 0 }}>Suporte Institucional para Gestão</p>
                            <p style={{ fontSize: '11px', color: '#7c5cbf', margin: 0 }}>Programas, recursos e canais de apoio à diretora escolar</p>
                          </div>
                          <span style={{ fontSize: '16px', color: '#7c5cbf', transform: showSuporteInstitucional ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
                        </button>

                        {showSuporteInstitucional && (
                          <div style={{ padding: '0 18px 16px', borderTop: '1px solid #e8deff' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px', marginTop: '14px' }}>
                              {[
                                { icon: '📚', titulo: 'PDDE Interativo', desc: 'Planejamento e gestão financeira escolar pelo MEC', url: 'https://pddeinterativo.mec.gov.br', cor: '#1f6b45', bg: '#e8f5ee', bd: '#b8dfc8' },
                                { icon: '🎓', titulo: 'ProGestão', desc: 'Programa de capacitação para gestores escolares', url: 'https://progestao.mec.gov.br', cor: '#1e4a78', bg: '#e6eef8', bd: '#b8cfe8' },
                                { icon: '🏛️', titulo: 'UNDIME', desc: 'União Nacional dos Dirigentes Municipais de Educação', url: 'https://undime.org.br', cor: '#7a4a10', bg: '#fdf3e0', bd: '#f0ddb5' },
                                { icon: '📊', titulo: 'QEdu', desc: 'Plataforma de dados educacionais para gestão baseada em evidências', url: 'https://qedu.org.br', cor: '#5b3fa8', bg: '#f3eeff', bd: '#d4c4f5' },
                                { icon: '💰', titulo: 'Portal FNDE', desc: 'Programas de financiamento da educação básica', url: 'https://www.fnde.gov.br', cor: '#1f6b45', bg: '#e8f5ee', bd: '#b8dfc8' },
                                { icon: '📋', titulo: 'SIMEC/PAR', desc: 'Sistema de monitoramento do Plano de Ações Articuladas', url: 'https://simec.mec.gov.br', cor: '#1e4a78', bg: '#e6eef8', bd: '#b8cfe8' },
                              ].map((item, i) => (
                                <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12, background: item.bg, border: `1.5px solid ${item.bd}`, textDecoration: 'none' }}>
                                  <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                                  <div>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: item.cor, margin: '0 0 2px' }}>{item.titulo} ↗</p>
                                    <p style={{ fontSize: 11, color: item.cor, opacity: 0.8, margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

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
                      { label: 'Pontos de atenção', val: total, prev: null, icon: criticals.length > 0 ? '⚠️' : total > 0 ? '◌' : '✅', extra: total === 0 ? 'Tudo certo' : criticals.length > 0 ? `${criticals.length} ${criticals.length !== 1 ? 'precisam' : 'precisa'} de atenção` : `${warnings.length} aviso${warnings.length !== 1 ? 's' : ''}` },
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
                      <div className="row-list" style={{marginTop:'8px'}}>
                        {[
                          ['Situação', censoLatest.ds_situacao],
                          ['Dependência', censoLatest.ds_dependencia],
                          ['Localização', censoLatest.ds_localizacao],
                          ['Região', censoLatest.no_regiao],
                          ['Município', censoLatest.no_municipio],
                          ['UF', censoLatest.sg_uf],
                          ['Código IBGE', censoLatest.co_municipio],
                          ['Regulamentação', censoLatest.tp_regulamentacao === 1 ? 'Sim' : censoLatest.tp_regulamentacao === 2 ? 'Em tramitação' : censoLatest.tp_regulamentacao === 3 ? 'Não' : null],
                          ['Prédio escolar', censoLatest.in_local_func_predio_escolar === 1 ? 'Sim' : censoLatest.in_local_func_predio_escolar === 0 ? 'Não' : null],
                        ].filter(([,v]) => v != null).map(([k, v], i) => (
                          <div key={i} className="row-item" style={{padding:'7px 14px'}}>
                            <span style={{color:'var(--m-muted)',fontSize:'12px'}}>{k}</span>
                            <strong style={{fontSize:'12px'}}>{String(v)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="soft-card theme-yellow">
                      <div className="attention-head"><span>⚙️</span><strong>Vida organizacional</strong></div>
                      {(() => {
                        const cl = censoLatest;
                        const chip = (label: string, val: number | null | undefined) => {
                          if (val == null) return null;
                          return (
                            <span key={label} style={{
                              display:'inline-flex',alignItems:'center',gap:'4px',
                              padding:'3px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:600,
                              background: val === 1 ? '#eef7f1' : '#fff3f3',
                              color:      val === 1 ? '#2f7a58' : '#c0392b',
                              border:     val === 1 ? '1px solid #c7e8d6' : '1px solid #f5c6cb',
                              marginRight:'4px',marginBottom:'4px',
                            }}>
                              {val === 1 ? '✓' : '✗'} {label}
                            </span>
                          );
                        };
                        const group = (title: string, content: React.ReactNode) => (
                          <div style={{marginBottom:'10px'}}>
                            <div style={{fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#888',marginBottom:'5px',paddingLeft:'2px'}}>{title}</div>
                            <div style={{display:'flex',flexWrap:'wrap'}}>{content}</div>
                          </div>
                        );
                        const aeeLabel = cl.tp_aee === 1 ? 'Na própria escola' : cl.tp_aee === 2 ? 'Em outra escola' : cl.tp_aee === 3 ? 'Em inst. especializada' : cl.tp_aee === 0 ? 'Não oferece' : null;
                        const orgaos = [
                          chip('Conselho Escolar', cl.in_orgao_conselho_escolar),
                          chip('APM / APP', cl.in_orgao_ass_pais_mestres),
                          chip('Grêmio Estudantil', cl.in_orgao_gremio_estudantil),
                        ].filter(Boolean);
                        const programas = [
                          chip('Alimentação escolar', cl.in_alimentacao),
                          chip('Ed. Ambiental', cl.in_educ_ambiental),
                          chip('Atividade complementar', cl.in_atividade_complementar),
                          chip('Redes Sociais', cl.in_redes_sociais),
                        ].filter(Boolean);
                        const inclusao = [
                          chip('Sala AEE', cl.in_sala_atendimento_especial),
                          chip('Atendimento AEE', cl.in_atendimento_aee),
                        ].filter(Boolean);
                        const conectividade = [
                          chip('Internet', cl.in_internet),
                          chip('Banda larga', cl.in_banda_larga),
                          chip('Internet alunos', cl.in_internet_alunos),
                          chip('Int. aprendizagem', cl.in_internet_aprendizagem),
                          chip('Int. administrativo', cl.in_internet_administrativo),
                        ].filter(Boolean);
                        const tecnologia = [
                          chip('Tablet', cl.in_tablet_aluno),
                          chip('TV', cl.in_equip_tv),
                          chip('Multimídia', cl.in_equip_multimidia),
                          chip('Impressora', cl.in_impressora),
                        ].filter(Boolean);
                        const acessibilidade = [
                          chip('Rampas', cl.in_rampas),
                          chip('Corrimão', cl.in_corrimao),
                          chip('Elevador', cl.in_elevador),
                          chip('Pisos táteis', cl.in_pisos_tateis),
                          chip('Sinal visual', cl.in_sinal_visual),
                        ].filter(Boolean);
                        return (
                          <div style={{marginTop:'10px'}}>
                            {orgaos.length > 0 && group('Órgãos colegiados', orgaos)}
                            {programas.length > 0 && group('Programas e serviços', programas)}
                            {(inclusao.length > 0 || aeeLabel) && group('Inclusão / AEE', <>
                              {inclusao}
                              {aeeLabel && <span style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:600,background:'#f0f4f8',color:'#3d4d5a',border:'1px solid #dde3ea',marginRight:'4px',marginBottom:'4px'}}>AEE: {aeeLabel}</span>}
                            </>)}
                            {conectividade.length > 0 && group('Conectividade', conectividade)}
                            {(tecnologia.length > 0 || (cl.qt_computadores != null && cl.qt_computadores > 0)) && group('Tecnologia', <>
                              {cl.qt_computadores != null && cl.qt_computadores > 0 && <span style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:600,background:'#f0f4f8',color:'#3d4d5a',border:'1px solid #dde3ea',marginRight:'4px',marginBottom:'4px'}}>💻 {cl.qt_computadores} computadores</span>}
                              {tecnologia}
                            </>)}
                            {acessibilidade.length > 0 && group('Acessibilidade', acessibilidade)}
                          </div>
                        );
                      })()}
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
                                    {alerta.tipo === 'critical' ? 'Atenção especial' : 'Atenção'}
                                  </span>
                                </div>
                                {mv && <strong style={{display:'block',fontSize:'26px',lineHeight:1,letterSpacing:'-0.04em',marginBottom:'6px'}}>{mv}</strong>}
                                <p style={{fontSize:'12px',color:'#6b7785',lineHeight:'1.5',margin:0}}>{alerta.descricao}</p>
                                {(alerta as any).progressao && (
                                  <div style={{marginTop:'8px',display:'inline-flex',alignItems:'center',gap:'5px',background:'#eafaf2',border:'1px solid #a3dfc0',borderRadius:'20px',padding:'3px 10px'}}>
                                    <span style={{fontSize:'12px'}}>📈</span>
                                    <span style={{fontSize:'11px',fontWeight:700,color:'#1f7a4a'}}>{(alerta as any).progressao.label}</span>
                                  </div>
                                )}
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
                          <p style={{margin:'6px 0 0',color:'#9b6a16'}}>Há <strong>{total} ponto{total !== 1 ? 's' : ''} de atenção</strong>{criticals.length > 0 ? `, sendo ${criticals.length} ${criticals.length !== 1 ? 'indicadores que precisam' : 'indicador que precisa'} de atenção especial` : ''}.</p>
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

                      {/* Matrículas por etapa */}
                      {(() => {
                        const total_mat = censoLatest.qt_mat_bas || 0;
                        const etapas = [
                          { label: 'Ed. Infantil', key: 'qt_mat_inf', color: '#a78bfa' },
                          { label: 'Fund. AI', key: 'qt_mat_fund_ai', color: '#60a5fa' },
                          { label: 'Fund. AF', key: 'qt_mat_fund_af', color: '#34d399' },
                          { label: 'Ens. Médio', key: 'qt_mat_med', color: '#f59e0b' },
                          { label: 'EJA', key: 'qt_mat_eja', color: '#fb923c' },
                          { label: 'Ed. Especial', key: 'qt_mat_esp', color: '#f472b6' },
                        ].filter(e => (censoLatest[e.key] || 0) > 0);
                        if (!etapas.length || !total_mat) return null;
                        return (
                          <div style={{marginTop:'16px'}}>
                            <div style={{fontSize:'11px',fontWeight:700,color:'var(--m-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'8px'}}>Matrículas por etapa</div>
                            <div style={{display:'flex',height:'8px',borderRadius:'99px',overflow:'hidden',gap:'2px',marginBottom:'8px'}}>
                              {etapas.map(e => {
                                const pct = total_mat > 0 ? (censoLatest[e.key] / total_mat) * 100 : 0;
                                return <div key={e.key} style={{flex: pct, background: e.color, minWidth: pct > 0 ? '4px' : 0}} />;
                              })}
                            </div>
                            <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                              {etapas.map(e => {
                                const pct = total_mat > 0 ? ((censoLatest[e.key] / total_mat) * 100).toFixed(1) : '0';
                                return (
                                  <div key={e.key} style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px'}}>
                                    <span style={{width:8,height:8,borderRadius:'50%',background:e.color,flexShrink:0,display:'inline-block'}} />
                                    <span style={{color:'var(--m-muted)'}}>{e.label}</span>
                                    <strong style={{color:'var(--m-text)'}}>{Number(censoLatest[e.key]).toLocaleString('pt-BR')}</strong>
                                    <span style={{color:'#94a3b8'}}>({pct}%)</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Docentes por nível */}
                      {(() => {
                        const niveis = [
                          { label: 'Ed. Infantil', val: censoLatest.qt_doc_inf },
                          { label: 'Fundamental', val: censoLatest.qt_doc_fund },
                          { label: 'Ensino Médio', val: censoLatest.qt_doc_med },
                        ].filter(n => n.val != null && n.val > 0);
                        if (!niveis.length) return null;
                        return (
                          <div style={{marginTop:'14px'}}>
                            <div style={{fontSize:'11px',fontWeight:700,color:'var(--m-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'8px'}}>Docentes por nível</div>
                            <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                              {niveis.map(n => (
                                <div key={n.label} style={{background:'#f1f5f9',borderRadius:'8px',padding:'5px 10px',fontSize:'12px',display:'flex',gap:'5px',alignItems:'center'}}>
                                  <strong style={{color:'var(--m-text)'}}>{Number(n.val).toLocaleString('pt-BR')}</strong>
                                  <span style={{color:'var(--m-muted)'}}>{n.label}</span>
                                </div>
                              ))}
                            </div>
                            <p style={{fontSize:'10px',color:'#94a3b8',margin:'6px 0 0'}}>O Censo Escolar não detalha por disciplina — apenas por nível de ensino.</p>
                          </div>
                        );
                      })()}
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
                      <div><h2>Panorama estadual e nacional</h2><p>IDEB da escola comparado à microrregião, município, estado e Brasil</p></div>
                      <div className="hint-chip">{comparativoData.municipio?.nome}/{comparativoData.uf?.sg}</div>
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
                          const microVal = microregiaoData?.[`ideb_${etapa}`] ?? null;
                          return (
                            <div key={etapa} className="soft-card" style={{padding:'16px 18px'}}>
                              <div style={{fontWeight:700,fontSize:'13px',marginBottom:'10px',color:'var(--m-text)'}}>{labels[etapa]}</div>
                              <div style={{fontSize:'34px',fontWeight:800,letterSpacing:'-0.04em',color:'var(--m-text)',marginBottom:'12px'}}>{fmt(escola)}</div>
                              {[
                                ...(microregiaoData ? [{ label: `Microrregião ${microregiaoData.micro_nome}`, val: microVal }] : []),
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

                {/* ── DESEMPENHO ESCOLAR: SAEB + RENDIMENTO ── */}
                {(() => {
                  const ch = evolutionCharts;
                  const saebLatest = ch?.saeb?.slice().reverse().find((d: any) => d.mt_af != null || d.lp_af != null || d.mt_ai != null || d.mt_em != null);
                  const rendLatest = ch?.taxasRendimento?.slice().reverse().find((d: any) => d.aprovacao != null || d.aprovacao_ai != null || d.aprovacao_af != null || d.aprovacao_med != null);
                  const allRend = ch?.taxasRendimento?.filter((d: any) => d.aprovacao != null || d.aprovacao_ai != null || d.aprovacao_af != null || d.aprovacao_med != null).slice().sort((a: any, b: any) => a.ano - b.ano) || [];
                  const rendSegmentos = [
                    { key: 'ai', label: 'Anos Iniciais', sub: 'Fund. 1º–5º ano', aprov: 'aprovacao_ai', reprov: 'reprovacao_ai', aband: 'abandono_ai', color: '#2d6a4f' },
                    { key: 'af', label: 'Anos Finais', sub: 'Fund. 6º–9º ano', aprov: 'aprovacao_af', reprov: 'reprovacao_af', aband: 'abandono_af', color: '#1d3557' },
                    { key: 'med', label: 'Ensino Médio', sub: '1ª–3ª série', aprov: 'aprovacao_med', reprov: 'reprovacao_med', aband: 'abandono_med', color: '#6b2d6b' },
                  ].filter(s => rendLatest && rendLatest[s.aprov] != null);
                  if (!saebLatest && !rendLatest) return null;
                  const saebMetrics = [
                    { key: 'mt_ai', label: 'Matemática', sub: 'Anos Iniciais', color: '#2d5a88' },
                    { key: 'lp_ai', label: 'Língua Port.', sub: 'Anos Iniciais', color: '#9b6a16' },
                    { key: 'mt_af', label: 'Matemática', sub: 'Anos Finais', color: '#2d5a88' },
                    { key: 'lp_af', label: 'Língua Port.', sub: 'Anos Finais', color: '#9b6a16' },
                    { key: 'mt_em', label: 'Matemática', sub: 'Ens. Médio', color: '#2d5a88' },
                    { key: 'lp_em', label: 'Língua Port.', sub: 'Ens. Médio', color: '#9b6a16' },
                  ].filter(m => saebLatest && saebLatest[m.key] != null);
                  return (
                    <section className="section">
                      <div className="section-title">
                        <div><h2>Desempenho escolar</h2><p>Notas do SAEB e taxas de aprovação, reprovação e abandono</p></div>
                        <div className="hint-chip">Fonte: INEP</div>
                      </div>
                      <div className="organic-divider" />
                      {saebLatest && saebMetrics.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#5d4037', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                            📝 Notas SAEB <span style={{ fontWeight: 400, fontSize: 12, color: '#9e8a75' }}>— {saebLatest.ano}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                            {saebMetrics.map(m => (
                              <div key={m.key} className="soft-card" style={{ padding: '14px 16px', borderTop: `3px solid ${m.color}` }}>
                                <div style={{ fontSize: 11, color: '#9e8a75', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.3 }}>{m.label}</div>
                                <div style={{ fontSize: 10, color: '#b8a899', marginBottom: 6 }}>{m.sub}</div>
                                <div style={{ fontSize: 26, fontWeight: 800, color: m.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                                  {saebLatest[m.key] != null ? Number(saebLatest[m.key]).toFixed(1) : '—'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {allRend.length > 0 && (
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#5d4037', marginBottom: 10 }}>
                            📊 Taxas de aprovação, reprovação e abandono (%)
                          </div>

                          {/* ── Cartões de segmento clicáveis ── */}
                          {rendSegmentos.length > 0 && (
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                              {rendSegmentos.map(s => {
                                const isActive = rendSegmento === s.key;
                                const latestAprov = rendLatest?.[s.aprov];
                                return (
                                  <button
                                    key={s.key}
                                    onClick={() => setRendSegmento(isActive ? null : s.key as any)}
                                    style={{
                                      flex: '1 1 130px', minWidth: 120,
                                      padding: '12px 14px',
                                      border: `2px solid ${isActive ? s.color : '#e7d9bf'}`,
                                      borderRadius: '14px 16px 12px 15px',
                                      background: isActive ? s.color : '#fffef8',
                                      color: isActive ? '#fff' : '#3d4450',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      boxShadow: isActive ? `0 4px 14px ${s.color}44` : '0 2px 8px rgba(83,72,53,0.07)',
                                      transition: 'all .18s',
                                    }}
                                  >
                                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: isActive ? 0.85 : 0.6, marginBottom: 2 }}>{s.sub}</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{s.label}</div>
                                    {latestAprov != null && (
                                      <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>
                                        {Number(latestAprov).toFixed(1)}<span style={{ fontSize: 13, fontWeight: 600 }}>%</span>
                                      </div>
                                    )}
                                    <div style={{ fontSize: 10, marginTop: 3, opacity: 0.7 }}>{isActive ? '▼ clique p/ fechar' : 'aprovação · clique'}</div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* ── Tabela: visão geral ou drill-down por segmento ── */}
                          {(() => {
                            const seg = rendSegmento ? rendSegmentos.find(s => s.key === rendSegmento) : null;
                            const rows = allRend.filter((d: any) => seg ? d[seg.aprov] != null : d.aprovacao != null);
                            if (rows.length === 0) return null;

                            // Grades por segmento (dados por série do Railway)
                            const gradesBySeg: Record<string, {label: string, aprov: string, reprov: string, aband: string}[]> = {
                              ai: [
                                { label: '1º ano', aprov: 'aprov_f01', reprov: 'reprov_f01', aband: 'aband_f01' },
                                { label: '2º ano', aprov: 'aprov_f02', reprov: 'reprov_f02', aband: 'aband_f02' },
                                { label: '3º ano', aprov: 'aprov_f03', reprov: 'reprov_f03', aband: 'aband_f03' },
                                { label: '4º ano', aprov: 'aprov_f04', reprov: 'reprov_f04', aband: 'aband_f04' },
                                { label: '5º ano', aprov: 'aprov_f05', reprov: 'reprov_f05', aband: 'aband_f05' },
                              ],
                              af: [
                                { label: '6º ano', aprov: 'aprov_f06', reprov: 'reprov_f06', aband: 'aband_f06' },
                                { label: '7º ano', aprov: 'aprov_f07', reprov: 'reprov_f07', aband: 'aband_f07' },
                                { label: '8º ano', aprov: 'aprov_f08', reprov: 'reprov_f08', aband: 'aband_f08' },
                                { label: '9º ano', aprov: 'aprov_f09', reprov: 'reprov_f09', aband: 'aband_f09' },
                              ],
                              med: [
                                { label: '1ª série', aprov: 'aprov_m01', reprov: 'reprov_m01', aband: 'aband_m01' },
                                { label: '2ª série', aprov: 'aprov_m02', reprov: 'reprov_m02', aband: 'aband_m02' },
                                { label: '3ª série', aprov: 'aprov_m03', reprov: 'reprov_m03', aband: 'aband_m03' },
                              ],
                            };
                            const grades = seg ? gradesBySeg[seg.key] : null;
                            const latestRow = rows[rows.length - 1];
                            const hasGrades = grades && latestRow && grades.some(g => latestRow[g.aprov] != null);

                            return (
                              <>
                                <div className="soft-card" style={{ padding: 0, overflow: 'hidden' }}>
                                  {seg && (
                                    <div style={{ padding: '9px 14px', background: seg.color, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span>📌 {seg.label} — {seg.sub} — evolução por ano</span>
                                      <button onClick={() => setRendSegmento(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, opacity: 0.8 }}>✕ ver geral</button>
                                    </div>
                                  )}
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                      <tr style={{ background: '#f7f2ea' }}>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#5d4037', fontSize: 12 }}>Ano</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#2f7a58', fontSize: 12 }}>✓ Aprovação</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#b74f42', fontSize: 12 }}>✗ Reprovação</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#c47a1f', fontSize: 12 }}>⚠ Abandono</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {rows.map((d: any, i: number) => {
                                        const aprov = seg ? d[seg.aprov] : d.aprovacao;
                                        const reprov = seg ? d[seg.reprov] : d.reprovacao;
                                        const aband = seg ? d[seg.aband] : d.abandono;
                                        return (
                                          <tr key={d.ano} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#5d4037' }}>{d.ano}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#2f7a58', fontWeight: 600 }}>{aprov != null ? `${Number(aprov).toFixed(1)}%` : '—'}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#b74f42', fontWeight: 600 }}>{reprov != null ? `${Number(reprov).toFixed(1)}%` : '—'}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#c47a1f', fontWeight: 600 }}>{aband != null ? `${Number(aband).toFixed(1)}%` : '—'}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>

                                {/* ── Por série (último ano disponível) ── */}
                                {hasGrades && seg && (
                                  <div style={{ marginTop: 12 }}>
                                    <div style={{ fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 8 }}>
                                      📋 Por série — {latestRow.ano}
                                    </div>
                                    <div className="soft-card" style={{ padding: 0, overflow: 'hidden' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                        <thead>
                                          <tr style={{ background: seg.color + '22' }}>
                                            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: seg.color, fontSize: 12 }}>Série</th>
                                            <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: '#2f7a58', fontSize: 12 }}>✓ Aprov.</th>
                                            <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: '#b74f42', fontSize: 12 }}>✗ Reprov.</th>
                                            <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: '#c47a1f', fontSize: 12 }}>⚠ Aband.</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {grades!.filter(g => latestRow[g.aprov] != null || latestRow[g.reprov] != null).map((g, i) => (
                                            <tr key={g.label} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                              <td style={{ padding: '9px 14px', fontWeight: 700, color: '#5d4037' }}>{g.label}</td>
                                              <td style={{ padding: '9px 14px', textAlign: 'right', color: '#2f7a58', fontWeight: 600 }}>{latestRow[g.aprov] != null ? `${Number(latestRow[g.aprov]).toFixed(1)}%` : '—'}</td>
                                              <td style={{ padding: '9px 14px', textAlign: 'right', color: '#b74f42', fontWeight: 600 }}>{latestRow[g.reprov] != null ? `${Number(latestRow[g.reprov]).toFixed(1)}%` : '—'}</td>
                                              <td style={{ padding: '9px 14px', textAlign: 'right', color: '#c47a1f', fontWeight: 600 }}>{latestRow[g.aband] != null ? `${Number(latestRow[g.aband]).toFixed(1)}%` : '—'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </section>
                  );
                })()}

                {/* ── TAXA DE NÃO RESPOSTA (TNR) ── */}
                {(() => {
                  const ch = evolutionCharts;
                  const allTnr = ch?.tnr?.filter((d: any) => d.fund != null || d.med != null).slice().sort((a: any, b: any) => a.ano - b.ano) || [];
                  if (allTnr.length === 0) return null;
                  const latest = allTnr[allTnr.length - 1];
                  const pct = (v: any) => v != null ? `${Number(v).toFixed(1)}%` : '—';
                  const tnrColor = (v: any) => Number(v) > 20 ? '#b74f42' : Number(v) > 10 ? '#c47a1f' : null;

                  // Segmentos disponíveis (igual ao padrão de Rendimento)
                  const tnrSegmentos = [
                    { key: 'fund',    label: 'Fundamental',  sub: 'Total',          valKey: 'fund',    color: '#2d5a88',
                      grades: [
                        { label: '1º ano', key: 'f01' }, { label: '2º ano', key: 'f02' }, { label: '3º ano', key: 'f03' },
                        { label: '4º ano', key: 'f04' }, { label: '5º ano', key: 'f05' },
                        { label: '6º ano', key: 'f06' }, { label: '7º ano', key: 'f07' },
                        { label: '8º ano', key: 'f08' }, { label: '9º ano', key: 'f09' },
                      ],
                    },
                    { key: 'fund_ai', label: 'Anos Iniciais', sub: 'Fund. 1º–5º',   valKey: 'fund_ai', color: '#2d6a4f',
                      grades: [
                        { label: '1º ano', key: 'f01' }, { label: '2º ano', key: 'f02' }, { label: '3º ano', key: 'f03' },
                        { label: '4º ano', key: 'f04' }, { label: '5º ano', key: 'f05' },
                      ],
                    },
                    { key: 'fund_af', label: 'Anos Finais',   sub: 'Fund. 6º–9º',   valKey: 'fund_af', color: '#1d3557',
                      grades: [
                        { label: '6º ano', key: 'f06' }, { label: '7º ano', key: 'f07' },
                        { label: '8º ano', key: 'f08' }, { label: '9º ano', key: 'f09' },
                      ],
                    },
                    { key: 'med',     label: 'Ensino Médio', sub: 'Total',           valKey: 'med',     color: '#6b2d6b',
                      grades: [
                        { label: '1ª série', key: 'm01' }, { label: '2ª série', key: 'm02' },
                        { label: '3ª série', key: 'm03' }, { label: '4ª série', key: 'm04' },
                      ],
                    },
                  ].filter(s => latest[s.valKey] != null);

                  const seg = tnrSegmento ? tnrSegmentos.find(s => s.key === tnrSegmento) : null;
                  const tnrRows = allTnr.filter((d: any) => seg ? d[seg.valKey] != null : d.fund != null);
                  const gradesDisponiveis = seg ? seg.grades.filter(g => latest[g.key] != null) : [];

                  return (
                    <section className="section">
                      <div className="section-title">
                        <div>
                          <h2>Taxa de Não Resposta</h2>
                          <p>% de alunos que não participaram da avaliação Prova Brasil/SAEB — afeta diretamente o cálculo do IDEB</p>
                        </div>
                        <div className="hint-chip">Fonte: INEP / Railway</div>
                      </div>
                      <div className="organic-divider" />

                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#5d4037', marginBottom: 10 }}>
                          🚫 Taxa de não resposta ao SAEB/Prova Brasil (%)
                        </div>

                        {/* Cartões de segmento clicáveis — igual ao Rendimento */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                          {tnrSegmentos.map(s => {
                            const isActive = tnrSegmento === s.key;
                            const val = latest[s.valKey];
                            const valColor = tnrColor(val);
                            return (
                              <button
                                key={s.key}
                                onClick={() => setTnrSegmento(isActive ? null : s.key)}
                                style={{
                                  flex: '1 1 130px', minWidth: 120,
                                  padding: '12px 14px',
                                  border: `2px solid ${isActive ? s.color : '#e7d9bf'}`,
                                  borderRadius: '14px 16px 12px 15px',
                                  background: isActive ? s.color : '#fffef8',
                                  color: isActive ? '#fff' : '#3d4450',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  boxShadow: isActive ? `0 4px 14px ${s.color}44` : '0 2px 8px rgba(83,72,53,0.07)',
                                  transition: 'all .18s',
                                }}
                              >
                                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: isActive ? 0.85 : 0.6, marginBottom: 2 }}>{s.sub}</div>
                                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{s.label}</div>
                                {val != null && (
                                  <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', color: isActive ? '#fff' : (valColor ?? s.color) }}>
                                    {Number(val).toFixed(1)}<span style={{ fontSize: 13, fontWeight: 600 }}>%</span>
                                  </div>
                                )}
                                <div style={{ fontSize: 10, marginTop: 3, opacity: 0.7 }}>{isActive ? '▼ clique p/ fechar' : 'não resposta · clique'}</div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Tabela e detalhe — só aparece quando um segmento está selecionado */}
                        {seg && tnrRows.length > 0 && (
                          <>
                            <div className="soft-card" style={{ padding: 0, overflow: 'hidden', marginBottom: gradesDisponiveis.length > 0 ? 12 : 0 }}>
                              <div style={{ padding: '9px 14px', background: seg.color, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>📌 {seg.label} — {seg.sub} — evolução por ano</span>
                                <button onClick={() => setTnrSegmento(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, opacity: 0.8 }}>✕ fechar</button>
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#f7f2ea' }}>
                                    <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: '#5d4037', fontSize: 12 }}>Ano</th>
                                    <th style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: seg.color, fontSize: 12 }}>🚫 Taxa de Não Resposta</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {tnrRows.map((d: any, i: number) => {
                                    const v = d[seg.valKey];
                                    return (
                                      <tr key={d.ano} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                        <td style={{ padding: '9px 14px', fontWeight: 700, color: '#5d4037' }}>{d.ano}</td>
                                        <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600, color: tnrColor(v) ?? seg.color }}>{pct(v)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Por série — último ano (se houver dados por série) */}
                            {gradesDisponiveis.length > 0 && (
                              <div style={{ marginTop: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 8 }}>
                                  📋 Por série — {latest.ano}
                                </div>
                                <div className="soft-card" style={{ padding: 0, overflow: 'hidden' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                      <tr style={{ background: seg.color + '22' }}>
                                        <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: seg.color, fontSize: 12 }}>Série / Ano</th>
                                        <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: seg.color, fontSize: 12 }}>🚫 Não Resposta</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {gradesDisponiveis.map((g, i) => (
                                        <tr key={g.key} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                          <td style={{ padding: '9px 14px', fontWeight: 700, color: '#5d4037' }}>{g.label}</td>
                                          <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600, color: tnrColor(latest[g.key]) ?? seg.color }}>{pct(latest[g.key])}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </section>
                  );
                })()}

                {/* ── INSE — DISTRIBUIÇÃO POR NÍVEL ── */}
                {(() => {
                  const ch = evolutionCharts;
                  const inseData = (ch?.inse ?? []).filter((d: any) => d.media != null).sort((a: any, b: any) => a.ano - b.ano);
                  if (inseData.length === 0) return null;
                  const hasLevels = inseData.some((d: any) => d.n1 != null);
                  if (!hasLevels) return null; // Só mostra se tiver distribuição
                  const latest = inseData[inseData.length - 1];
                  const selAnoInse = inseAno && inseData.some((d: any) => d.ano === inseAno) ? inseAno : latest.ano;
                  const rowInse = inseData.find((d: any) => d.ano === selAnoInse) ?? latest;

                  const niveis = [
                    { n: 1, label: 'Nível I',   desc: 'Muito baixo',     color: '#b71c1c' },
                    { n: 2, label: 'Nível II',  desc: 'Baixo',           color: '#d44f2a' },
                    { n: 3, label: 'Nível III', desc: 'Médio-baixo',     color: '#e9a82b' },
                    { n: 4, label: 'Nível IV',  desc: 'Médio',           color: '#c8a228' },
                    { n: 5, label: 'Nível V',   desc: 'Médio-alto',      color: '#7aad3f' },
                    { n: 6, label: 'Nível VI',  desc: 'Alto',            color: '#4caf50' },
                    { n: 7, label: 'Nível VII', desc: 'Muito alto',      color: '#2d8f4e' },
                    { n: 8, label: 'Nível VIII',desc: 'Muito alto (+)',  color: '#1a5c33' },
                  ].filter(nv => rowInse[`n${nv.n}`] != null);

                  if (niveis.length === 0) return null;

                  return (
                    <section className="section">
                      <div className="section-title">
                        <div>
                          <h2>INSE — Distribuição dos Estudantes por Nível Socioeconômico</h2>
                          <p>Percentual de alunos em cada um dos 8 níveis do índice socioeconômico INEP</p>
                        </div>
                        <div className="hint-chip">Fonte: INEP/SAEB</div>
                      </div>
                      <div className="organic-divider" />

                      {inseData.length > 1 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                          {inseData.map(d => (
                            <button key={d.ano} onClick={() => setInseAno(d.ano)}
                              style={{
                                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                border: `2px solid ${d.ano === selAnoInse ? '#7c5cbf' : '#e7d9bf'}`,
                                background: d.ano === selAnoInse ? '#7c5cbf' : '#fffef8',
                                color: d.ano === selAnoInse ? '#fff' : '#5d4037',
                              }}>
                              {d.ano}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="soft-card" style={{ padding: 16, marginBottom: 8 }}>
                        <div style={{ marginBottom: 12, fontSize: 13, color: '#5d4037' }}>
                          <strong>INSE Médio {rowInse.ano}:</strong>{' '}
                          <span style={{ fontSize: 20, fontWeight: 900, color: '#7c5cbf' }}>
                            {rowInse.media != null ? Number(rowInse.media).toFixed(2) : '—'}
                          </span>
                          {rowInse.classificacao && (
                            <span style={{ marginLeft: 10, fontSize: 12, background: '#f0eaf8', color: '#7c5cbf', borderRadius: 12, padding: '2px 10px', fontWeight: 700 }}>
                              {rowInse.classificacao}
                            </span>
                          )}
                          {rowInse.qtd_alunos && (
                            <span style={{ marginLeft: 10, fontSize: 12, color: '#888' }}>
                              {Number(rowInse.qtd_alunos).toLocaleString('pt-BR')} alunos
                            </span>
                          )}
                        </div>
                        {niveis.map(nv => {
                          const pct = rowInse[`n${nv.n}`] as number | null;
                          const w = pct != null ? Math.max(2, Math.min(100, pct)) : 0;
                          return (
                            <div key={nv.n} style={{ marginBottom: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
                                <span style={{ fontWeight: 700, color: nv.color }}>{nv.label} <span style={{ fontWeight: 400, color: '#888' }}>— {nv.desc}</span></span>
                                <span style={{ fontWeight: 700, color: nv.color }}>{pct != null ? `${pct.toFixed(1)}%` : '—'}</span>
                              </div>
                              <div style={{ height: 10, borderRadius: 6, background: '#f0e8d8', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${w}%`, borderRadius: 6, background: nv.color, transition: 'width 0.4s' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })()}

                {/* ── DISTORÇÃO IDADE-SÉRIE (TDI) ── */}
                {(() => {
                  const ch = evolutionCharts;
                  const allTdi = ch?.tdi?.filter((d: any) => d.fund_total != null || d.fund_ai != null || d.fund_af != null || d.medio != null).slice().sort((a: any, b: any) => a.ano - b.ano) || [];
                  if (allTdi.length === 0) return null;
                  const latest = allTdi[allTdi.length - 1];
                  const pct = (v: any) => v != null ? `${Number(v).toFixed(1)}%` : '—';
                  // Vermelho > 30%, laranja > 20%
                  const tdiColor = (v: any) => Number(v) > 30 ? '#b74f42' : Number(v) > 20 ? '#c47a1f' : null;

                  const tdiSegmentos = [
                    { key: 'fund',    label: 'Fundamental',  sub: 'Total',         valKey: 'fund_total', color: '#2d5a88',
                      grades: [
                        { label: '1º ano', key: 'f01' }, { label: '2º ano', key: 'f02' }, { label: '3º ano', key: 'f03' },
                        { label: '4º ano', key: 'f04' }, { label: '5º ano', key: 'f05' },
                        { label: '6º ano', key: 'f06' }, { label: '7º ano', key: 'f07' },
                        { label: '8º ano', key: 'f08' }, { label: '9º ano', key: 'f09' },
                      ],
                    },
                    { key: 'fund_ai', label: 'Anos Iniciais', sub: 'Fund. 1º–5º',  valKey: 'fund_ai',    color: '#2d6a4f',
                      grades: [
                        { label: '1º ano', key: 'f01' }, { label: '2º ano', key: 'f02' }, { label: '3º ano', key: 'f03' },
                        { label: '4º ano', key: 'f04' }, { label: '5º ano', key: 'f05' },
                      ],
                    },
                    { key: 'fund_af', label: 'Anos Finais',   sub: 'Fund. 6º–9º',  valKey: 'fund_af',    color: '#1d3557',
                      grades: [
                        { label: '6º ano', key: 'f06' }, { label: '7º ano', key: 'f07' },
                        { label: '8º ano', key: 'f08' }, { label: '9º ano', key: 'f09' },
                      ],
                    },
                    { key: 'med',     label: 'Ensino Médio', sub: 'Total',          valKey: 'medio',      color: '#6b2d6b',
                      grades: [
                        { label: '1ª série', key: 'm01' }, { label: '2ª série', key: 'm02' },
                        { label: '3ª série', key: 'm03' }, { label: '4ª série', key: 'm04' },
                      ],
                    },
                  ].filter(s => latest[s.valKey] != null);

                  const seg = tdiSegmento ? tdiSegmentos.find(s => s.key === tdiSegmento) : null;
                  const tdiRows = allTdi.filter((d: any) => seg ? d[seg.valKey] != null : d.fund_total != null || d.medio != null);
                  const gradesDisponiveis = seg ? seg.grades.filter(g => latest[g.key] != null) : [];

                  return (
                    <section className="section">
                      <div className="section-title">
                        <div>
                          <h2>Distorção Idade-Série</h2>
                          <p>% de alunos com 2 ou mais anos de defasagem em relação à série esperada para a idade</p>
                        </div>
                        <div className="hint-chip">Fonte: INEP / Railway</div>
                      </div>
                      <div className="organic-divider" />

                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#5d4037', marginBottom: 10 }}>
                          📅 Taxa de Distorção Idade-Série (TDI)
                        </div>

                        {/* Cartões de segmento clicáveis */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                          {tdiSegmentos.map(s => {
                            const isActive = tdiSegmento === s.key;
                            const val = latest[s.valKey];
                            const valColor = tdiColor(val);
                            return (
                              <button
                                key={s.key}
                                onClick={() => setTdiSegmento(isActive ? null : s.key)}
                                style={{
                                  flex: '1 1 130px', minWidth: 120,
                                  padding: '12px 14px',
                                  border: `2px solid ${isActive ? s.color : '#e7d9bf'}`,
                                  borderRadius: '14px 16px 12px 15px',
                                  background: isActive ? s.color : '#fffef8',
                                  color: isActive ? '#fff' : '#3d4450',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  boxShadow: isActive ? `0 4px 14px ${s.color}44` : '0 2px 8px rgba(83,72,53,0.07)',
                                  transition: 'all .18s',
                                }}
                              >
                                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: isActive ? 0.85 : 0.6, marginBottom: 2 }}>{s.sub}</div>
                                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{s.label}</div>
                                {val != null && (
                                  <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', color: isActive ? '#fff' : (valColor ?? s.color) }}>
                                    {Number(val).toFixed(1)}<span style={{ fontSize: 13, fontWeight: 600 }}>%</span>
                                  </div>
                                )}
                                <div style={{ fontSize: 10, marginTop: 3, opacity: 0.7 }}>{isActive ? '▼ clique p/ fechar' : 'distorção · clique'}</div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Tabela de evolução — aparece só quando um segmento está selecionado */}
                        {seg && tdiRows.length > 0 && (
                          <>
                            <div className="soft-card" style={{ padding: 0, overflow: 'hidden', marginBottom: gradesDisponiveis.length > 0 ? 12 : 0 }}>
                              <div style={{ padding: '9px 14px', background: seg.color, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>📌 {seg.label} — {seg.sub} — evolução por ano</span>
                                <button onClick={() => setTdiSegmento(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, opacity: 0.8 }}>✕ fechar</button>
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#f7f2ea' }}>
                                    <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: '#5d4037', fontSize: 12 }}>Ano</th>
                                    <th style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: seg.color, fontSize: 12 }}>📅 Distorção Idade-Série</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {tdiRows.map((d: any, i: number) => {
                                    const v = d[seg.valKey];
                                    return (
                                      <tr key={d.ano} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                        <td style={{ padding: '9px 14px', fontWeight: 700, color: '#5d4037' }}>{d.ano}</td>
                                        <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600, color: tdiColor(v) ?? seg.color }}>{pct(v)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Por série — último ano */}
                            {gradesDisponiveis.length > 0 && (
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 8 }}>
                                  📋 Por série / ano escolar — {latest.ano}
                                </div>
                                <div className="soft-card" style={{ padding: 0, overflow: 'hidden' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                      <tr style={{ background: seg.color + '22' }}>
                                        <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: seg.color, fontSize: 12 }}>Série / Ano</th>
                                        <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: seg.color, fontSize: 12 }}>📅 Distorção</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {gradesDisponiveis.map((g, i) => (
                                        <tr key={g.key} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                          <td style={{ padding: '9px 14px', fontWeight: 700, color: '#5d4037' }}>{g.label}</td>
                                          <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600, color: tdiColor(latest[g.key]) ?? seg.color }}>{pct(latest[g.key])}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </section>
                  );
                })()}

                {/* ── ESTRUTURA E RECURSOS ── */}
                {(() => {
                  const turEI  = censoLatest.qt_tur_inf  ?? null;
                  const turEF  = censoLatest.qt_tur_fund ?? null;
                  const turEM  = censoLatest.qt_tur_med  ?? null;
                  const turTot = censoLatest.qt_tur_bas  ?? censoLatest.qt_turmas ?? null;
                  const docEI  = censoLatest.qt_doc_inf  ?? null;
                  const docEF  = censoLatest.qt_doc_fund ?? null;
                  const docEM  = censoLatest.qt_doc_med  ?? null;
                  const docTot = censoLatest.qt_doc_bas  ?? censoLatest.qt_docentes ?? null;
                  const salTot    = censoLatest.qt_salas_utilizadas        ?? null;
                  const salDentro = censoLatest.qt_salas_utilizadas_dentro ?? null;
                  const salFora   = censoLatest.qt_salas_utilizadas_fora   ?? null;
                  const hasTur = [turEI,turEF,turEM,turTot].some(v => v != null && v > 0);
                  const hasDoc = [docEI,docEF,docEM,docTot].some(v => v != null && v > 0);
                  const hasSal = salTot != null && salTot > 0;
                  if (!hasTur && !hasDoc && !hasSal) return null;
                  const etapaRow = (label: string, val: number | null, tot: number | null) => {
                    const pct = (val != null && tot != null && tot > 0) ? Math.round(val / tot * 100) : null;
                    return (
                      <div key={label} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                        <span style={{minWidth:'90px',fontSize:'12px',color:'var(--m-muted)',fontWeight:600}}>{label}</span>
                        <div style={{flex:1,height:'8px',borderRadius:'4px',background:'#e9ecef',overflow:'hidden'}}>
                          {pct != null && <div style={{height:'100%',width:`${pct}%`,borderRadius:'4px',background:'var(--m-primary)',transition:'width 0.4s'}} />}
                        </div>
                        <span style={{minWidth:'40px',fontSize:'13px',fontWeight:700,textAlign:'right'}}>{val != null ? val.toLocaleString('pt-BR') : '—'}</span>
                        {pct != null && <span style={{minWidth:'32px',fontSize:'11px',color:'var(--m-muted)',textAlign:'right'}}>{pct}%</span>}
                      </div>
                    );
                  };
                  return (
                    <section className="section">
                      <div className="section-title">
                        <div><h2>Estrutura e recursos</h2><p>Turmas, equipe docente e espaços físicos por etapa</p></div>
                      </div>
                      <div className="organic-divider" />
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'14px'}}>
                        {hasTur && (
                          <div className="soft-card">
                            <div className="attention-head"><span>🏫</span><strong>Turmas por etapa</strong></div>
                            <div style={{marginTop:'14px'}}>
                              {etapaRow('Infantil',  turEI,  turTot)}
                              {etapaRow('Fundamental', turEF, turTot)}
                              {etapaRow('Médio',     turEM,  turTot)}
                              <div style={{borderTop:'1px solid #eee',marginTop:'6px',paddingTop:'8px',display:'flex',justifyContent:'space-between',fontSize:'12px'}}>
                                <span style={{color:'var(--m-muted)',fontWeight:600}}>Total</span>
                                <strong>{turTot != null ? turTot.toLocaleString('pt-BR') : '—'} turmas</strong>
                              </div>
                            </div>
                          </div>
                        )}
                        {hasDoc && (
                          <div className="soft-card">
                            <div className="attention-head"><span>🧑‍🏫</span><strong>Docentes por etapa</strong></div>
                            <div style={{marginTop:'14px'}}>
                              {etapaRow('Infantil',  docEI,  docTot)}
                              {etapaRow('Fundamental', docEF, docTot)}
                              {etapaRow('Médio',     docEM,  docTot)}
                              <div style={{borderTop:'1px solid #eee',marginTop:'6px',paddingTop:'8px',display:'flex',justifyContent:'space-between',fontSize:'12px'}}>
                                <span style={{color:'var(--m-muted)',fontWeight:600}}>Total</span>
                                <strong>{docTot != null ? docTot.toLocaleString('pt-BR') : '—'} docentes</strong>
                              </div>
                            </div>
                          </div>
                        )}
                        {hasSal && (
                          <div className="soft-card">
                            <div className="attention-head"><span>🚪</span><strong>Salas de aula</strong></div>
                            <div style={{marginTop:'14px'}}>
                              <div style={{textAlign:'center',marginBottom:'10px'}}>
                                <strong style={{fontSize:'42px',letterSpacing:'-0.04em',lineHeight:1}}>{salTot?.toLocaleString('pt-BR')}</strong>
                                <div style={{fontSize:'12px',color:'var(--m-muted)',marginTop:'2px'}}>salas utilizadas</div>
                              </div>
                              {(salDentro != null || salFora != null) && (
                                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginTop:'8px'}}>
                                  {salDentro != null && (
                                    <div style={{textAlign:'center',padding:'8px',borderRadius:'8px',background:'#f0f4f8'}}>
                                      <strong style={{fontSize:'20px'}}>{salDentro}</strong>
                                      <div style={{fontSize:'11px',color:'var(--m-muted)'}}>dentro do prédio</div>
                                    </div>
                                  )}
                                  {salFora != null && (
                                    <div style={{textAlign:'center',padding:'8px',borderRadius:'8px',background:'#f0f4f8'}}>
                                      <strong style={{fontSize:'20px'}}>{salFora}</strong>
                                      <div style={{fontSize:'11px',color:'var(--m-muted)'}}>fora do prédio</div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })()}

                {/* ── INFRAESTRUTURA E SANEAMENTO ── */}
                {(() => {
                  const cl = censoLatest;
                  const infChips = (items: { label: string; val: number | null | undefined; ok?: boolean }[]) =>
                    items.filter(i => i.val != null).map((it, idx) => (
                      <span key={idx} style={{
                        display:'inline-flex',alignItems:'center',gap:'5px',
                        padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:600,
                        background: it.val === 1 ? '#eef7f1' : it.val === 0 ? '#fff3f3' : '#f0f4f8',
                        color:      it.val === 1 ? '#2f7a58' : it.val === 0 ? '#c0392b' : '#555',
                        border:     it.val === 1 ? '1px solid #c7e8d6' : it.val === 0 ? '1px solid #f5c6cb' : '1px solid #ddd',
                        marginRight:'6px',marginBottom:'6px',
                      }}>
                        {it.val === 1 ? '✓' : it.val === 0 ? '✗' : '·'} {it.label}
                      </span>
                    ));

                  const aguaItems = [
                    { label: 'Rede pública',   val: cl.in_agua_rede_publica },
                    { label: 'Poço artesiano', val: cl.in_agua_poco_artesiano },
                    { label: 'Cacimba/cisterna', val: cl.in_agua_cacimba },
                    { label: 'Fonte/rio',      val: cl.in_agua_fonte_rio },
                    { label: 'Carro-pipa',     val: cl.in_agua_carro_pipa },
                    { label: 'Inexistente',    val: cl.in_agua_inexistente },
                  ].filter(i => i.val != null);
                  const esgotoItems = [
                    { label: 'Rede pública',   val: cl.in_esgoto_rede_publica },
                    { label: 'Fossa séptica',  val: cl.in_esgoto_fossa_septica },
                    { label: 'Fossa comum',    val: cl.in_esgoto_fossa_comum },
                    { label: 'Inexistente',    val: cl.in_esgoto_inexistente },
                  ].filter(i => i.val != null);
                  const energiaItems = [
                    { label: 'Rede pública',   val: cl.in_energia_rede_publica },
                    { label: 'Gerador a fóssil', val: cl.in_energia_gerador_fossil },
                    { label: 'Energia renovável', val: cl.in_energia_renovavel },
                    { label: 'Inexistente',    val: cl.in_energia_inexistente },
                  ].filter(i => i.val != null);
                  const lixoItems = [
                    { label: 'Coleta pública',   val: cl.in_lixo_coleta_publica },
                    { label: 'Queima',           val: cl.in_lixo_queima },
                    { label: 'Enterra',          val: cl.in_lixo_enterra },
                    { label: 'Separação',        val: cl.in_tratamento_lixo_separacao },
                    { label: 'Reciclagem',       val: cl.in_tratamento_lixo_reciclagem },
                    { label: 'Reutiliza',        val: cl.in_tratamento_lixo_reutiliza },
                  ].filter(i => i.val != null);
                  const banhItems = [
                    { label: 'Banheiro alunos',      val: cl.in_banheiro },
                    { label: 'Banheiro Ed. Infantil', val: cl.in_banheiro_ei },
                    { label: 'Banheiro PNE',         val: cl.in_banheiro_pne },
                    { label: 'Banheiro funcionários', val: cl.in_banheiro_funcionarios },
                  ].filter(i => i.val != null);

                  const hasAnySanit = aguaItems.length + esgotoItems.length + energiaItems.length + lixoItems.length + banhItems.length > 0;
                  if (!hasAnySanit) return null;

                  const subCard = (icon: string, title: string, items: { label: string; val: number | null | undefined }[]) => (
                    <div className="soft-card" style={{padding:'16px 18px'}}>
                      <div className="attention-head" style={{marginBottom:'10px'}}><span>{icon}</span><strong>{title}</strong></div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'0'}}>
                        {infChips(items)}
                      </div>
                      {items.length === 0 && <span style={{fontSize:'12px',color:'var(--m-muted)'}}>Sem dados disponíveis</span>}
                    </div>
                  );

                  return (
                    <section className="section">
                      <div className="section-title">
                        <div><h2>Infraestrutura e saneamento</h2><p>Água, esgoto, energia, coleta de lixo e instalações sanitárias</p></div>
                      </div>
                      <div className="organic-divider" />
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'14px'}}>
                        {aguaItems.length > 0   && subCard('💧', 'Abastecimento de água', aguaItems)}
                        {esgotoItems.length > 0 && subCard('🚿', 'Esgotamento sanitário', esgotoItems)}
                        {energiaItems.length > 0 && subCard('⚡', 'Fornecimento de energia', energiaItems)}
                        {lixoItems.length > 0   && subCard('♻️', 'Coleta e tratamento de lixo', lixoItems)}
                        {banhItems.length > 0   && subCard('🚽', 'Banheiros e sanitários', banhItems)}
                      </div>
                    </section>
                  );
                })()}

                {/* ── ESFORÇO DOCENTE (IED) ── */}
                {(() => {
                  const ch = evolutionCharts;
                  const allIed = (ch?.ied ?? []).filter((d: any) =>
                    [1,2,3,4,5,6].some(n => d[`nivel_${n}`] != null)
                  ).sort((a: any, b: any) => a.ano - b.ano);
                  if (allIed.length === 0) return null;

                  const anos = allIed.map((d: any) => d.ano);
                  const selectedAno = iedAno && anos.includes(iedAno) ? iedAno : anos[anos.length - 1];
                  const row = allIed.find((d: any) => d.ano === selectedAno) ?? allIed[allIed.length - 1];

                  const etapas = [
                    { key: 'nivel',   label: 'Total',        prefix: 'nivel_',        color: '#4a5568' },
                    { key: 'fund_ai', label: 'Fund. AI',      prefix: 'fund_ai_nivel_', color: '#2d6a4f' },
                    { key: 'fund_af', label: 'Fund. AF',      prefix: 'fund_af_nivel_', color: '#1d3557' },
                    { key: 'med',     label: 'Ens. Médio',    prefix: 'med_nivel_',    color: '#6b2d6b' },
                  ].filter(e => [1,2,3,4,5,6].some(n => row[`${e.prefix}${n}`] != null));

                  const niveis = [
                    { n: 1, desc: '1 escola · 1 ou 2 turmas · 1 turno' },
                    { n: 2, desc: '1 escola · 3–4 turmas · 1 ou 2 turnos' },
                    { n: 3, desc: '1 escola · 5+ turmas · 1 ou 2 turnos' },
                    { n: 4, desc: '2 escolas · até 4 turmas · 2 turnos' },
                    { n: 5, desc: '2 escolas · 5+ turmas · 2 ou 3 turnos' },
                    { n: 6, desc: '3+ escolas · 3 turnos · maior esforço' },
                  ];

                  const nivelColor = (n: number) =>
                    n >= 6 ? '#b74f42' : n >= 5 ? '#c47a1f' : n >= 4 ? '#8a6e3b' : null;

                  const pct = (v: any) => v != null ? `${Number(v).toFixed(1)}%` : '—';

                  return (
                    <section className="section">
                      <div className="section-title">
                        <div>
                          <h2>Esforço Docente (IED)</h2>
                          <p>Percentual de docentes por nível de esforço e etapa de ensino — quanto maior o nível, maior a sobrecarga</p>
                        </div>
                        <div className="hint-chip">Fonte: INEP</div>
                      </div>
                      <div className="organic-divider" />

                      {/* Seletor de ano */}
                      {anos.length > 1 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                          {anos.map(a => (
                            <button key={a} onClick={() => setIedAno(a)}
                              style={{
                                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                border: `2px solid ${a === selectedAno ? '#5d4037' : '#e7d9bf'}`,
                                background: a === selectedAno ? '#5d4037' : '#fffef8',
                                color: a === selectedAno ? '#fff' : '#5d4037',
                              }}>
                              {a}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Legenda de níveis */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 6 }}>
                          👩‍🏫 Percentual de docentes por nível de esforço — {selectedAno}
                        </div>
                        <div className="soft-card" style={{ padding: 0, overflow: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 400 }}>
                            <thead>
                              <tr style={{ background: '#f7f2ea' }}>
                                <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: '#5d4037', fontSize: 12, whiteSpace: 'nowrap' }}>
                                  Nível de esforço
                                </th>
                                {etapas.map(e => (
                                  <th key={e.key} style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: e.color, fontSize: 12, whiteSpace: 'nowrap' }}>
                                    {e.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {niveis.map(({ n, desc }, i) => {
                                const cor = nivelColor(n);
                                return (
                                  <tr key={n} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                    <td style={{ padding: '9px 14px' }}>
                                      <span style={{
                                        display: 'inline-block', width: 24, height: 24, lineHeight: '24px', textAlign: 'center',
                                        borderRadius: '50%', fontWeight: 800, fontSize: 12, marginRight: 8,
                                        background: cor ?? '#e8dfd0', color: cor ? '#fff' : '#5d4037',
                                      }}>{n}</span>
                                      <span style={{ fontSize: 12, color: '#7a6651' }}>{desc}</span>
                                    </td>
                                    {etapas.map(e => {
                                      const val = row[`${e.prefix}${n}`];
                                      return (
                                        <td key={e.key} style={{
                                          padding: '9px 12px', textAlign: 'right', fontWeight: 700,
                                          color: val != null ? (cor ?? e.color) : '#bbb',
                                          fontSize: 13,
                                        }}>
                                          {pct(val)}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                          * Níveis 5 e 6 indicam sobrecarga docente: atuação em múltiplas escolas e turnos.
                        </div>
                      </div>

                      {/* Mini evolução N5+N6 se houver múltiplos anos */}
                      {allIed.length > 1 && (() => {
                        const evoRows = allIed.filter((d: any) => d.nivel_5 != null || d.nivel_6 != null);
                        if (evoRows.length < 2) return null;
                        const iedEvoOpen = expandedSections['ied-evo'] !== false;
                        return (
                          <div>
                            <button onClick={() => toggleSection('ied-evo')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#b74f42', marginBottom: 6, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {iedEvoOpen ? '▼' : '▶'} ⚠️ Evolução da sobrecarga docente (Níveis 5 e 6) — Total
                            </button>
                            {!iedEvoOpen && null}
                            {iedEvoOpen && <div>
                            <div className="soft-card" style={{ padding: 0, overflow: 'hidden' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#fdf2f2' }}>
                                    <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#b74f42', fontSize: 12 }}>Ano</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#c47a1f', fontSize: 12 }}>Nível 5</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#b74f42', fontSize: 12 }}>Nível 6</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#b74f42', fontSize: 12 }}>N5 + N6</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {evoRows.map((d: any, i: number) => {
                                    const n5 = d.nivel_5 != null ? Number(d.nivel_5) : null;
                                    const n6 = d.nivel_6 != null ? Number(d.nivel_6) : null;
                                    const soma = n5 != null && n6 != null ? n5 + n6 : (n5 ?? n6);
                                    return (
                                      <tr key={d.ano} style={{ background: i % 2 === 0 ? '#fff' : '#fff8f8', borderTop: '1px solid #f0e8e8' }}>
                                        <td style={{ padding: '8px 14px', fontWeight: 700, color: '#5d4037' }}>{d.ano}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#c47a1f', fontWeight: 600 }}>{n5 != null ? `${n5.toFixed(1)}%` : '—'}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#b74f42', fontWeight: 600 }}>{n6 != null ? `${n6.toFixed(1)}%` : '—'}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: soma != null && soma > 50 ? '#b74f42' : '#5d4037' }}>
                                          {soma != null ? `${soma.toFixed(1)}%` : '—'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            </div>}
                          </div>
                        );
                      })()}
                    </section>
                  );
                })()}

                {/* ── ADEQUAÇÃO DA FORMAÇÃO DOCENTE (AFD) ── */}
                {(() => {
                  const ch = evolutionCharts;
                  const allAfd = (ch?.afd ?? [])
                    .filter((d: any) => d.fun_g1 != null || d.fun_g2 != null || d.med_g1 != null)
                    .sort((a: any, b: any) => a.ano - b.ano);
                  if (allAfd.length === 0) return null;

                  const afdAnos = allAfd.map((d: any) => d.ano);
                  const selAno  = afdAno && afdAnos.includes(afdAno) ? afdAno : afdAnos[afdAnos.length - 1];
                  const row     = allAfd.find((d: any) => d.ano === selAno) ?? allAfd[allAfd.length - 1];

                  const pct = (v: any) => v != null ? `${Number(v).toFixed(1)}%` : '—';

                  // Grupos como colunas (1=melhor, 5=pior)
                  const grupos = [
                    { n: 1, label: 'Grupo 1', color: '#2d6a4f', desc: 'Licenciatura na disciplina' },
                    { n: 2, label: 'Grupo 2', color: '#40916c', desc: 'Bacharelado na disciplina' },
                    { n: 3, label: 'Grupo 3', color: '#e9a82b', desc: 'Licenciatura em outra área' },
                    { n: 4, label: 'Grupo 4', color: '#d46b2a', desc: 'Outra formação superior' },
                    { n: 5, label: 'Grupo 5', color: '#b71c1c', desc: 'Sem formação superior adequada' },
                  ];

                  // Etapas como linhas
                  type AfdEtapa = { key: string; label: string; color: string; hasData: boolean };
                  const etapas: AfdEtapa[] = [
                    { key: 'inf',     label: 'Educação Infantil',          color: '#7b5ea7', hasData: allAfd.some((d: any) => d.inf_g1 != null) },
                    { key: 'fun',     label: 'Ensino Fundamental (Total)', color: '#2d5a88', hasData: allAfd.some((d: any) => d.fun_g1 != null) },
                    { key: 'fun_ai',  label: '↳ Anos Iniciais',            color: '#3a7bd5', hasData: allAfd.some((d: any) => d.fun_ai_g1 != null) },
                    { key: 'fun_af',  label: '↳ Anos Finais',              color: '#1d3557', hasData: allAfd.some((d: any) => d.fun_af_g1 != null) },
                    { key: 'med',     label: 'Ensino Médio',               color: '#6b2d6b', hasData: allAfd.some((d: any) => d.med_g1 != null) },
                    { key: 'eja_fun', label: 'EJA — Fundamental',          color: '#795548', hasData: allAfd.some((d: any) => d.eja_fun_g1 != null) },
                    { key: 'eja_med', label: 'EJA — Médio',                color: '#4e342e', hasData: allAfd.some((d: any) => d.eja_med_g1 != null) },
                  ].filter(e => e.hasData);

                  return (
                    <section className="section">
                      <div className="section-title">
                        <div>
                          <h2>Adequação da Formação Docente (AFD)</h2>
                          <p>Percentual de docentes por grupo de adequação à disciplina e etapa de ensino</p>
                        </div>
                        <div className="hint-chip">Fonte: INEP</div>
                      </div>
                      <div className="organic-divider" />

                      {/* Legenda dos grupos */}
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                        {grupos.map(g => (
                          <div key={g.n} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                            <span style={{ width: 12, height: 12, borderRadius: 3, background: g.color, display: 'inline-block' }} />
                            <span style={{ fontWeight: 700, color: g.color }}>{g.label}:</span>
                            <span style={{ color: '#5d4037' }}>{g.desc}</span>
                          </div>
                        ))}
                      </div>

                      {/* Seletor de ano */}
                      {afdAnos.length > 1 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                          {afdAnos.map(a => (
                            <button key={a} onClick={() => setAfdAno(a)}
                              style={{
                                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                border: `2px solid ${a === selAno ? '#5d4037' : '#e7d9bf'}`,
                                background: a === selAno ? '#5d4037' : '#fffef8',
                                color: a === selAno ? '#fff' : '#5d4037',
                              }}>
                              {a}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Tabela Etapas × Grupos */}
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 6 }}>
                        📊 % de docentes por grupo de adequação — {selAno}
                      </div>
                      <div className="soft-card" style={{ padding: 0, overflow: 'auto', marginBottom: 16 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: '#f7f2ea' }}>
                              <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#5d4037', fontSize: 12, whiteSpace: 'nowrap' }}>
                                Etapa / Modalidade
                              </th>
                              {grupos.map(g => (
                                <th key={g.n} style={{
                                  padding: '8px 10px', textAlign: 'center', fontWeight: 800,
                                  color: '#fff', background: g.color, fontSize: 11, whiteSpace: 'nowrap',
                                  borderLeft: '2px solid #fff',
                                }}>
                                  {g.label}
                                </th>
                              ))}
                              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#888', fontSize: 11, borderLeft: '1px solid #e0d8cc' }}>
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {etapas.map((e, i) => {
                              const vals = grupos.map(g => row[`${e.key}_g${g.n}`] as number | null);
                              const total = vals.every(v => v == null) ? null : vals.reduce((s, v) => (s ?? 0) + (v ?? 0), 0 as number | null);
                              return (
                                <tr key={e.key} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                  <td style={{ padding: '9px 14px', fontWeight: 700, color: e.color, whiteSpace: 'nowrap', fontSize: 12 }}>
                                    {e.label}
                                  </td>
                                  {grupos.map((g, gi) => {
                                    const v = vals[gi];
                                    const isG1 = g.n === 1;
                                    const isG5 = g.n === 5;
                                    const alert5 = isG5 && v != null && Number(v) > 20;
                                    const good1  = isG1 && v != null && Number(v) > 70;
                                    return (
                                      <td key={g.n} style={{
                                        padding: '9px 10px', textAlign: 'center', fontWeight: v != null ? 700 : 400,
                                        color: alert5 ? '#b71c1c' : good1 ? '#2d6a4f' : v != null ? g.color : '#bbb',
                                        borderLeft: '1px solid #f0e8d8',
                                        background: alert5 ? '#fff5f5' : good1 ? '#f0faf4' : undefined,
                                      }}>
                                        {pct(v)}{alert5 ? ' ⚠️' : good1 ? ' ✓' : ''}
                                      </td>
                                    );
                                  })}
                                  <td style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 600, color: '#888', borderLeft: '1px solid #e0d8cc', fontSize: 12 }}>
                                    {total != null ? `${total.toFixed(1)}%` : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Evolução de Grupo 1 por etapa */}
                      {allAfd.length > 1 && (() => {
                        const evoEtapas = etapas.filter(e => allAfd.some((d: any) => d[`${e.key}_g1`] != null));
                        if (evoEtapas.length === 0) return null;
                        return (
                          <div>
                            <button onClick={() => toggleSection('afd-evo')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 6, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {expandedSections['afd-evo'] !== false ? '▼' : '▶'} 📅 Evolução do Grupo 1 (formação adequada) por etapa
                            </button>
                            {expandedSections['afd-evo'] !== false && <div className="soft-card" style={{ padding: 0, overflow: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#f7f2ea' }}>
                                    <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#5d4037', fontSize: 12 }}>Ano</th>
                                    {evoEtapas.map(e => (
                                      <th key={e.key} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: e.color, fontSize: 12, whiteSpace: 'nowrap' }}>
                                        {e.label.replace('↳ ', '')}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {allAfd.map((d: any, i: number) => (
                                    <tr key={d.ano} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                      <td style={{ padding: '8px 14px', fontWeight: 700, color: d.ano === selAno ? '#2d5a88' : '#5d4037' }}>
                                        {d.ano === selAno ? `▶ ${d.ano}` : d.ano}
                                      </td>
                                      {evoEtapas.map(e => {
                                        const v = d[`${e.key}_g1`];
                                        return (
                                          <td key={e.key} style={{
                                            padding: '8px 10px', textAlign: 'center', fontWeight: 600,
                                            color: v != null ? (Number(v) > 70 ? '#2d6a4f' : Number(v) > 50 ? e.color : '#d46b2a') : '#ccc',
                                          }}>
                                            {pct(v)}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>}
                          </div>
                        );
                      })()}
                    </section>
                  );
                })()}

                {/* ── MÉDIA DE ALUNOS POR TURMA (ATU) ── */}
                {(() => {
                  const ch = evolutionCharts;
                  const allAtu = (ch?.atu ?? [])
                    .filter((d: any) => d.fund != null || d.fund_ai != null || d.fund_af != null || d.medio != null || d.inf_total != null)
                    .sort((a: any, b: any) => a.ano - b.ano);
                  if (allAtu.length === 0) return null;

                  const atuAnos = allAtu.map((d: any) => d.ano);
                  const selAno  = atuAno && atuAnos.includes(atuAno) ? atuAno : atuAnos[atuAnos.length - 1];
                  const row     = allAtu.find((d: any) => d.ano === selAno) ?? allAtu[allAtu.length - 1];

                  const fmt = (v: any) => v != null ? Number(v).toFixed(1) : '—';

                  const hasAnyInf    = allAtu.some((d: any) => d.inf_total != null || d.inf_cre != null || d.inf_pre != null);
                  const hasSeries    = allAtu.some((d: any) => d.fun_01 != null);
                  const hasMul       = allAtu.some((d: any) => d.fun_mul != null);
                  const hasMedSeries = allAtu.some((d: any) => d.med_01 != null);

                  type AtuCol   = { key: string; label: string };
                  type AtuGroup = { label: string; color: string; cols: AtuCol[] };
                  const grupos: AtuGroup[] = [
                    ...(hasAnyInf ? [{
                      label: 'Educação Infantil', color: '#7b5ea7',
                      cols: [
                        { key: 'inf_total', label: 'Total' },
                        { key: 'inf_cre',   label: 'Creche' },
                        { key: 'inf_pre',   label: 'Pré-Escola' },
                      ] as AtuCol[],
                    }] : []),
                    {
                      label: 'Ensino Fundamental', color: '#2d5a88',
                      cols: [
                        { key: 'fund',    label: 'Total' },
                        { key: 'fund_ai', label: 'Anos Iniciais' },
                        { key: 'fund_af', label: 'Anos Finais' },
                        ...(hasSeries ? [
                          { key: 'fun_01', label: '1º Ano' }, { key: 'fun_02', label: '2º Ano' },
                          { key: 'fun_03', label: '3º Ano' }, { key: 'fun_04', label: '4º Ano' },
                          { key: 'fun_05', label: '5º Ano' }, { key: 'fun_06', label: '6º Ano' },
                          { key: 'fun_07', label: '7º Ano' }, { key: 'fun_08', label: '8º Ano' },
                          { key: 'fun_09', label: '9º Ano' },
                        ] as AtuCol[] : []),
                        ...(hasMul ? [{ key: 'fun_mul', label: 'Multietapa / Correção de Fluxo' }] as AtuCol[] : []),
                      ] as AtuCol[],
                    },
                    {
                      label: 'Ensino Médio', color: '#6b2d6b',
                      cols: [
                        { key: 'medio',  label: 'Total' },
                        ...(hasMedSeries ? [
                          { key: 'med_01', label: '1ª Série' }, { key: 'med_02', label: '2ª Série' },
                          { key: 'med_03', label: '3ª Série' }, { key: 'med_04', label: '4ª Série' },
                          { key: 'med_ns', label: 'Não-Seriado' },
                        ] as AtuCol[] : []),
                      ] as AtuCol[],
                    },
                  ].filter(g => g.cols.some(c => row[c.key] != null || allAtu.some((d: any) => d[c.key] != null)));

                  const allCols = grupos.flatMap(g => g.cols);

                  // Aviso INEP se turma tiver acima de 35 alunos (referência comum)
                  const atuAlert = (v: any) => v != null && Number(v) > 35;

                  return (
                    <section className="section">
                      <div className="section-title">
                        <div>
                          <h2>Média de Alunos por Turma (ATU)</h2>
                          <p>Número médio de alunos por turma, por etapa e ano de ensino</p>
                        </div>
                        <div className="hint-chip">Fonte: INEP</div>
                      </div>
                      <div className="organic-divider" />

                      {/* Seletor de ano */}
                      {atuAnos.length > 1 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                          {atuAnos.map(a => (
                            <button key={a} onClick={() => setAtuAno(a)}
                              style={{
                                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                border: `2px solid ${a === selAno ? '#5d4037' : '#e7d9bf'}`,
                                background: a === selAno ? '#5d4037' : '#fffef8',
                                color: a === selAno ? '#fff' : '#5d4037',
                              }}>
                              {a}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Tabela agrupada */}
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 6 }}>
                        🧑‍🤝‍🧑 Alunos por turma — {selAno}
                      </div>
                      <div className="soft-card" style={{ padding: 0, overflow: 'auto', marginBottom: 16 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr>
                              {grupos.map(g => (
                                <th key={g.label} colSpan={g.cols.length}
                                  style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 800,
                                    color: '#fff', background: g.color, borderRight: '2px solid #fff',
                                    whiteSpace: 'nowrap', fontSize: 11 }}>
                                  {g.label}
                                </th>
                              ))}
                            </tr>
                            <tr style={{ background: '#f7f2ea' }}>
                              {allCols.map((c) => {
                                const grp = grupos.find(g => g.cols.includes(c))!;
                                return (
                                  <th key={c.key} style={{
                                    padding: '6px 8px', textAlign: 'center', fontWeight: 700, fontSize: 11,
                                    color: grp.color, whiteSpace: 'nowrap',
                                    borderRight: '1px solid #ede5d5',
                                  }}>
                                    {c.label}
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ background: '#fff' }}>
                              {allCols.map((c) => {
                                const grp = grupos.find(g => g.cols.includes(c))!;
                                const val = row[c.key];
                                const alert = atuAlert(val);
                                return (
                                  <td key={c.key} style={{
                                    padding: '9px 10px', textAlign: 'center',
                                    fontWeight: val != null ? 700 : 400,
                                    color: alert ? '#b71c1c' : val != null ? grp.color : '#bbb',
                                    borderRight: '1px solid #f0e8d8',
                                    fontSize: 13, background: alert ? '#fff5f5' : undefined,
                                  }}>
                                    {fmt(val)}
                                    {alert && <span style={{ fontSize: 10, marginLeft: 3 }}>⚠️</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      {allAtu.some((d: any) => allCols.some(c => atuAlert(d[c.key]))) && (
                        <p style={{ fontSize: 11, color: '#b71c1c', marginBottom: 12 }}>
                          ⚠️ Valores acima de 35 alunos/turma podem indicar superlotação (referência INEP/MEC).
                        </p>
                      )}

                      {/* Evolução histórica */}
                      {allAtu.length > 1 && (() => {
                        const evoEtapas = [
                          { key: 'inf_total', label: 'Ed. Infantil',  color: '#7b5ea7' },
                          { key: 'fund',      label: 'Fund. Total',   color: '#2d5a88' },
                          { key: 'fund_ai',   label: 'Fund. AI',      color: '#2d6a4f' },
                          { key: 'fund_af',   label: 'Fund. AF',      color: '#1d3557' },
                          { key: 'medio',     label: 'Ensino Médio',  color: '#6b2d6b' },
                        ].filter(e => allAtu.some((d: any) => d[e.key] != null));
                        if (evoEtapas.length === 0) return null;
                        return (
                          <div>
                            <button onClick={() => toggleSection('atu-evo')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 6, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {expandedSections['atu-evo'] !== false ? '▼' : '▶'} 📅 Evolução histórica — médias por etapa
                            </button>
                            {expandedSections['atu-evo'] !== false && <div className="soft-card" style={{ padding: 0, overflow: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#f7f2ea' }}>
                                    <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#5d4037', fontSize: 12 }}>Ano</th>
                                    {evoEtapas.map(e => (
                                      <th key={e.key} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: e.color, fontSize: 12, whiteSpace: 'nowrap' }}>
                                        {e.label}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {allAtu.map((d: any, i: number) => (
                                    <tr key={d.ano} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                      <td style={{ padding: '8px 14px', fontWeight: 700, color: d.ano === selAno ? '#2d5a88' : '#5d4037' }}>
                                        {d.ano === selAno ? `▶ ${d.ano}` : d.ano}
                                      </td>
                                      {evoEtapas.map(e => {
                                        const v = d[e.key];
                                        return (
                                          <td key={e.key} style={{
                                            padding: '8px 10px', textAlign: 'center', fontWeight: 600,
                                            color: atuAlert(v) ? '#b71c1c' : v != null ? e.color : '#ccc',
                                            background: atuAlert(v) ? '#fff5f5' : undefined,
                                          }}>
                                            {fmt(v)}{atuAlert(v) ? ' ⚠️' : ''}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>}
                          </div>
                        );
                      })()}
                    </section>
                  );
                })()}

                {/* ── HORAS-AULA DIÁRIAS (HAD) ── */}
                {(() => {
                  const ch = evolutionCharts;
                  const allHad = (ch?.had ?? [])
                    .filter((d: any) => d.fund != null || d.fund_ai != null || d.fund_af != null || d.medio != null || d.inf_total != null)
                    .sort((a: any, b: any) => a.ano - b.ano);
                  if (allHad.length === 0) return null;

                  const hadAnos = allHad.map((d: any) => d.ano);
                  const selAno = hadAno && hadAnos.includes(hadAno) ? hadAno : hadAnos[hadAnos.length - 1];
                  const row = allHad.find((d: any) => d.ano === selAno) ?? allHad[allHad.length - 1];

                  const hr = (v: any) => v != null ? `${Number(v).toFixed(1)}h` : '—';

                  // Define grupos e colunas — mostra coluna só se ALGUM ano tem dado
                  const hasAnyInf = allHad.some((d: any) => d.inf_total != null || d.inf_cre != null || d.inf_pre != null);
                  const hasSeries = allHad.some((d: any) => d.fun_01 != null);
                  const hasMedSeries = allHad.some((d: any) => d.med_01 != null);

                  type HadCol = { key: string; label: string };
                  type HadGroup = { label: string; color: string; cols: HadCol[] };
                  const grupos: HadGroup[] = [
                    ...(hasAnyInf ? [{
                      label: 'Educação Infantil', color: '#7b5ea7',
                      cols: [
                        { key: 'inf_total', label: 'Total' },
                        { key: 'inf_cre',   label: 'Creche' },
                        { key: 'inf_pre',   label: 'Pré-Escola' },
                      ] as HadCol[],
                    }] : []),
                    {
                      label: 'Ensino Fundamental', color: '#2d5a88',
                      cols: [
                        { key: 'fund',    label: 'Total' },
                        { key: 'fund_ai', label: 'Anos Iniciais' },
                        { key: 'fund_af', label: 'Anos Finais' },
                        ...(hasSeries ? [
                          { key: 'fun_01', label: '1º Ano' }, { key: 'fun_02', label: '2º Ano' },
                          { key: 'fun_03', label: '3º Ano' }, { key: 'fun_04', label: '4º Ano' },
                          { key: 'fun_05', label: '5º Ano' }, { key: 'fun_06', label: '6º Ano' },
                          { key: 'fun_07', label: '7º Ano' }, { key: 'fun_08', label: '8º Ano' },
                          { key: 'fun_09', label: '9º Ano' },
                        ] as HadCol[] : []),
                      ] as HadCol[],
                    },
                    {
                      label: 'Ensino Médio', color: '#6b2d6b',
                      cols: [
                        { key: 'medio',  label: 'Total' },
                        ...(hasMedSeries ? [
                          { key: 'med_01', label: '1ª Série' }, { key: 'med_02', label: '2ª Série' },
                          { key: 'med_03', label: '3ª Série' }, { key: 'med_04', label: '4ª Série' },
                          { key: 'med_ns', label: 'Não-Seriado' },
                        ] as HadCol[] : []),
                      ] as HadCol[],
                    },
                  ].filter(g => g.cols.some(c => row[c.key] != null || allHad.some((d: any) => d[c.key] != null)));

                  const allCols = grupos.flatMap(g => g.cols);

                  return (
                    <section className="section">
                      <div className="section-title">
                        <div>
                          <h2>Horas-Aula Diárias (HAD)</h2>
                          <p>Média de horas-aula diárias por etapa de ensino e ano escolar</p>
                        </div>
                        <div className="hint-chip">Fonte: INEP</div>
                      </div>
                      <div className="organic-divider" />

                      {/* Seletor de ano */}
                      {hadAnos.length > 1 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                          {hadAnos.map(a => (
                            <button key={a} onClick={() => setHadAno(a)}
                              style={{
                                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                border: `2px solid ${a === selAno ? '#5d4037' : '#e7d9bf'}`,
                                background: a === selAno ? '#5d4037' : '#fffef8',
                                color: a === selAno ? '#fff' : '#5d4037',
                              }}>
                              {a}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Tabela agrupada por etapa — scroll horizontal */}
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 6 }}>
                        ⏱️ Média de horas-aula diárias — {selAno}
                      </div>
                      <div className="soft-card" style={{ padding: 0, overflow: 'auto', marginBottom: 16 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            {/* Linha dos grupos */}
                            <tr style={{ background: '#f7f2ea' }}>
                              {grupos.map(g => (
                                <th key={g.label} colSpan={g.cols.length}
                                  style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 800, color: '#fff',
                                    background: g.color, borderRight: '2px solid #fff', whiteSpace: 'nowrap', fontSize: 11 }}>
                                  {g.label}
                                </th>
                              ))}
                            </tr>
                            {/* Linha das sub-colunas */}
                            <tr style={{ background: '#f7f2ea' }}>
                              {allCols.map((c, i) => {
                                const grp = grupos.find(g => g.cols.includes(c))!;
                                const isLast = i === allCols.length - 1 || !grupos.find(g => g.cols.includes(allCols[i+1]))?.cols.includes(allCols[i+1]);
                                return (
                                  <th key={c.key} style={{
                                    padding: '6px 8px', textAlign: 'center', fontWeight: 700, fontSize: 11,
                                    color: grp.color, whiteSpace: 'nowrap',
                                    borderRight: isLast ? '2px solid #e0d8cc' : '1px solid #ede5d5',
                                  }}>
                                    {c.label}
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ background: '#fff' }}>
                              {allCols.map((c, i) => {
                                const grp = grupos.find(g => g.cols.includes(c))!;
                                const isLast = i === allCols.length - 1 || grupos.find(g => g.cols.includes(allCols[i+1])) !== grp;
                                const val = row[c.key];
                                return (
                                  <td key={c.key} style={{
                                    padding: '9px 10px', textAlign: 'center', fontWeight: val != null ? 700 : 400,
                                    color: val != null ? grp.color : '#bbb',
                                    borderRight: isLast ? '2px solid #e0d8cc' : '1px solid #f0e8d8',
                                    fontSize: 13,
                                  }}>
                                    {hr(val)}
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Evolução histórica — apenas etapas disponíveis */}
                      {allHad.length > 1 && (() => {
                        const evoEtapas = [
                          { key: 'inf_total', label: 'Ed. Infantil',  color: '#7b5ea7' },
                          { key: 'fund',      label: 'Fund. Total',   color: '#2d5a88' },
                          { key: 'fund_ai',   label: 'Fund. AI',      color: '#2d6a4f' },
                          { key: 'fund_af',   label: 'Fund. AF',      color: '#1d3557' },
                          { key: 'medio',     label: 'Ensino Médio',  color: '#6b2d6b' },
                        ].filter(e => allHad.some((d: any) => d[e.key] != null));
                        if (evoEtapas.length === 0) return null;
                        return (
                          <div>
                            <button onClick={() => toggleSection('had-evo')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 6, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {expandedSections['had-evo'] !== false ? '▼' : '▶'} 📅 Evolução histórica por etapa (em horas/dia)
                            </button>
                            {expandedSections['had-evo'] !== false && <div className="soft-card" style={{ padding: 0, overflow: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#f7f2ea' }}>
                                    <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#5d4037', fontSize: 12 }}>Ano</th>
                                    {evoEtapas.map(e => (
                                      <th key={e.key} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: e.color, fontSize: 12, whiteSpace: 'nowrap' }}>
                                        {e.label}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {allHad.map((d: any, i: number) => (
                                    <tr key={d.ano} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                      <td style={{ padding: '8px 14px', fontWeight: 700, color: d.ano === selAno ? '#2d5a88' : '#5d4037' }}>
                                        {d.ano === selAno ? `▶ ${d.ano}` : d.ano}
                                      </td>
                                      {evoEtapas.map(e => (
                                        <td key={e.key} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: d[e.key] != null ? e.color : '#ccc' }}>
                                          {hr(d[e.key])}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>}
                          </div>
                        );
                      })()}
                    </section>
                  );
                })()}

                {/* ── GALERIA DE GRÁFICOS ── */}
                {currentChart && available.length > 0 && (
                  <section className="section">
                    <div className="section-title">
                      <div><h2>Galeria de gráficos</h2><p>Evolução dos indicadores ao longo dos anos</p></div>
                    </div>
                    <div className="organic-divider" />

                    {/* Pills selector */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                      {available.map(c => {
                        const active = selectedChart === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => { setSelectedChart(c.id); setChartEtapa('total'); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '7px 14px',
                              background: active ? 'linear-gradient(135deg,#dff1ff,#f0f9ff)' : '#fffef8',
                              border: active ? '1.5px solid #2d5a88' : '1.5px solid #e7d9bf',
                              borderRadius: '20px',
                              cursor: 'pointer', fontWeight: active ? 700 : 500,
                              fontSize: 13, color: active ? '#2d5a88' : '#5d6470',
                              boxShadow: active ? '0 2px 8px rgba(45,90,136,0.13)' : '0 1px 3px rgba(0,0,0,0.04)',
                              transition: 'all .15s',
                            }}
                          >
                            <span style={{ fontSize: 15 }}>{c.icon}</span>
                            <span>{c.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Chart card — full width */}
                    {(() => {
                      const hasEtapas = !!(currentChart as any).etapas;
                      // Linhas filtradas pela etapa selecionada
                      const filteredLines = hasEtapas
                        ? currentChart.lines.filter((l: any) => chartEtapa === 'total' ? l.etapa === 'total' : l.etapa === chartEtapa)
                        : currentChart.lines;
                      // Anos com dados reais para a(s) linha(s) ativa(s)
                      const activeKeys = new Set(filteredLines.map((l: any) => l.key));
                      const yearsWithData = currentChart.data.filter((d: Record<string,any>) =>
                        Object.entries(d).some(([k, v]) => k !== 'ano' && activeKeys.has(k) && v != null && Number(v) > 0)
                      );
                      // Valor do último ponto com dado
                      const lastPoint = [...yearsWithData].reverse()[0];
                      const bigVal = lastPoint ? lastPoint[filteredLines[0]?.key] : null;
                      const bigAno = lastPoint ? lastPoint.ano : latestAno;
                      // Etapas disponíveis neste gráfico (com pelo menos 1 ano com dado > 0)
                      const availableEtapas = hasEtapas ? currentChart.lines.filter((l: any) =>
                        currentChart.data.some((d: Record<string,any>) => d[l.key] != null && Number(d[l.key]) > 0)
                      ) : [];
                      return (
                        <div className="soft-card" style={{ padding: '20px' }}>
                          {/* Filtro de etapa — só quando suportado e há múltiplas etapas */}
                          {availableEtapas.length > 1 && (
                            <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'16px',alignItems:'center'}}>
                              <span style={{fontSize:'11px',fontWeight:600,color:'#888',marginRight:'4px',textTransform:'uppercase',letterSpacing:'0.04em'}}>Etapa:</span>
                              {availableEtapas.map((l: any) => (
                                <button key={l.etapa} onClick={() => setChartEtapa(l.etapa)} style={{
                                  padding:'4px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:600,
                                  cursor:'pointer',transition:'all .15s',border:'none',
                                  background: chartEtapa === l.etapa ? l.color : '#f0f4f8',
                                  color: chartEtapa === l.etapa ? '#fff' : '#555',
                                  boxShadow: chartEtapa === l.etapa ? `0 2px 8px ${l.color}55` : 'none',
                                }}>
                                  {l.name}
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="chart-header">
                            <div>
                              <h4>{currentChart.icon} {currentChart.label}{hasEtapas && chartEtapa !== 'total' ? ` — ${filteredLines[0]?.name}` : ''}</h4>
                              <p>{currentChart.desc}</p>
                              <div className="chip-row">
                                {yearsWithData.map((d: Record<string,any>) => (
                                  <span key={d.ano} className="mini-chip">{d.ano}</span>
                                ))}
                              </div>
                            </div>
                            <div className="big-stat">
                              <strong>{bigVal != null ? Number(bigVal).toLocaleString('pt-BR') : '—'}</strong>
                              <span>{bigAno}</span>
                            </div>
                          </div>
                          <div style={{ height: '280px' }}>
                            <EvolutionChart data={currentChart.data} lines={filteredLines} large />
                          </div>
                          <div className="chart-note">
                            📝 Dados do Censo Escolar INEP/MEC · código {selectedInep}
                          </div>
                        </div>
                      );
                    })()}
                  </section>
                )}

                {/* ── RETRATO DA ESCOLA — 3 CAMADAS × 10 DIMENSÕES ── */}
                <section className="section">
                  <div className="section-title">
                    <div><h2>Retrato da escola</h2><p>Evolução dos dados do Censo Escolar ao longo dos anos</p></div>
                  </div>
                  <div className="organic-divider" />
                  <div className="soft-card" style={{padding:0,overflow:'hidden'}}>
                    <div className="tab-head">
                      <h3 style={{margin:'0 0 4px',fontSize:'18px',letterSpacing:'-0.03em'}}>Evolução do Censo Escolar</h3>
                      <p style={{margin:0,color:'var(--m-muted)',fontSize:'13px'}}>3 camadas · 10 dimensões · células verdes/vermelhas indicam mudanças entre anos</p>
                    </div>

                    {/* ── NAVEGAÇÃO: 3 CAMADAS × 10 DIMENSÕES ── */}
                    <div style={{background:'#faf7f2', borderBottom:'2px solid #e8e0d0'}}>
                      {([
                        {
                          label: 'Camada 1 — Estrutura da Escola',
                          color: '#e8f0fb', activeColor: '#2d5a88', borderColor:'#b8cde8',
                          dims: [
                            { key:'dim1', label:'🏗️ Infraestrutura' },
                            { key:'dim2', label:'💻 Tecnologia' },
                            { key:'dim3', label:'🛡️ Segurança' },
                            { key:'dim4', label:'🌱 Sustentabilidade' },
                          ],
                        },
                        {
                          label: 'Camada 2 — Pessoas e Inclusão',
                          color: '#edf7ee', activeColor: '#2f7a58', borderColor:'#b8dcca',
                          dims: [
                            { key:'dim5', label:'♿ Inclusão' },
                            { key:'dim6', label:'⚖️ Equidade Social' },
                            { key:'dim7', label:'🤝 Participação' },
                          ],
                        },
                        {
                          label: 'Camada 3 — Organização e Funcionamento',
                          color: '#faf3e8', activeColor: '#9b6a16', borderColor:'#dfc99a',
                          dims: [
                            { key:'dim8', label:'📋 Gestão' },
                            { key:'dim9', label:'🧑‍🏫 Docentes' },
                            { key:'dim10', label:'📚 Oferta' },
                          ],
                        },
                      ] as const).map((camada, ci) => {
                        const isActive = camada.dims.some(d => d.key === activeSchoolTab);
                        return (
                          <div key={ci} style={{
                            background: isActive ? camada.color : '#faf7f2',
                            borderBottom: ci < 2 ? '1px solid #e8e0d0' : 'none',
                            padding:'8px 16px 10px',
                            transition:'background 0.15s',
                          }}>
                            <div style={{fontSize:10,fontWeight:800,color:'#9a7a5a',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{camada.label}</div>
                            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                              {camada.dims.map(dim => {
                                const active = activeSchoolTab === dim.key;
                                return (
                                  <button key={dim.key} onClick={() => setActiveSchoolTab(dim.key as any)} style={{
                                    padding:'6px 14px',
                                    border:`1.5px solid ${active ? camada.activeColor : camada.borderColor}`,
                                    borderRadius:20,
                                    fontSize:13,
                                    fontWeight: active ? 700 : 500,
                                    background: active ? camada.activeColor : 'white',
                                    color: active ? 'white' : '#5d4037',
                                    cursor:'pointer',
                                    transition:'all 0.12s',
                                    whiteSpace:'nowrap',
                                  }}>{dim.label}</button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {(() => {
                      const anos = evolucaoData.anos_disponiveis.slice().sort((a: number, b: number) => a - b).filter((a: number) => a >= 2020);
                      const c = evolucaoData.censo_por_ano;
                      type Row = { label: string; key: string; header?: boolean };

                      // ── COMPONENTE: cabeçalho da dimensão ──
                      const DimHeader = ({ num, icon, title, desc, index: idx2 }: { num: number; icon: string; title: string; desc: string; index: string }) => (
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid #eee8db', background: '#faf8f4', display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ fontSize: 28, lineHeight: 1 }}>{icon}</div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#3d2b1a', letterSpacing: '-0.02em' }}>Dimensão {num} — {title}</div>
                            <div style={{ fontSize: 12, color: '#8a7a6a', marginTop: 2 }}>{desc} · <span style={{ fontWeight: 600 }}>Índice: {idx2}</span></div>
                          </div>
                        </div>
                      );

                      // ── ESTILOS DE SUMMARY COMPARTILHADOS ──
                      const summaryStyle: React.CSSProperties = {
                        padding: '11px 20px', fontWeight: 700, fontSize: 13, color: '#5d4037',
                        background: '#faf7f2', borderBottom: '1px solid #ede8df',
                        cursor: 'pointer', userSelect: 'none', listStyle: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      };

                      // ── COMPONENTE: tabela numérica (evoluções quantitativas) ──
                      const NumTable = ({ rows, title }: { rows: Row[]; title?: string }) => {
                        const tableBody = (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                              <thead>
                                <tr style={{ background: '#f0ebe0' }}>
                                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 700, color: '#5d3a1a', fontSize: 12, minWidth: 220, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Indicador</th>
                                  {anos.map((a: number, ai: number) => (
                                    <th key={a} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#5d3a1a', fontSize: 12, minWidth: 70, background: ai === anos.length - 1 ? '#e8dfc8' : undefined }}>
                                      {a}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row, rowIdx) => {
                                  if (row.header) return (
                                    <tr key={rowIdx}>
                                      <td colSpan={anos.length + 1} style={{ padding: '8px 20px', background: '#ede8df', fontWeight: 800, fontSize: 11, color: '#7a5230', textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: '2px solid #ddd5c5' }}>
                                        {row.label}
                                      </td>
                                    </tr>
                                  );
                                  const vals = anos.map((a: number) => c[a]?.[row.key] ?? null);
                                  if (vals.every((v: any) => v == null || v === 0)) return null;
                                  return (
                                    <tr key={rowIdx} style={{ borderTop: '1px solid #f0e8d8', background: rowIdx % 2 === 0 ? '#fff' : '#fdf9f4' }}>
                                      <td style={{ padding: '9px 20px', color: '#4a3020', fontWeight: 500, fontSize: 13 }}>{row.label}</td>
                                      {vals.map((v: any, vi: number) => {
                                        const prev = vi > 0 ? vals[vi - 1] : null;
                                        const delta = v != null && prev != null ? v - prev : null;
                                        const isLatest = vi === anos.length - 1;
                                        return (
                                          <td key={vi} style={{ padding: '9px 12px', textAlign: 'right', fontWeight: isLatest ? 700 : 500, color: '#2c3e50', verticalAlign: 'top', background: isLatest ? '#fdf5e6' : undefined }}>
                                            {v != null ? v.toLocaleString('pt-BR') : <span style={{ color: '#ccc' }}>—</span>}
                                            {delta != null && delta !== 0 && (
                                              <div style={{ fontSize: 10, lineHeight: 1.3, marginTop: 1, fontWeight: 700, color: delta > 0 ? '#16714a' : '#b74f42' }}>
                                                {delta > 0 ? '▲ ' : '▼ '}{Math.abs(delta).toLocaleString('pt-BR')}
                                              </div>
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                        if (title) return (
                          <details style={{ borderBottom: '1px solid #ede8df' }}>
                            <summary style={summaryStyle}><span>{title}</span><span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>clique para ver ▾</span></summary>
                            {tableBody}
                          </details>
                        );
                        return <div style={{ borderBottom: '1px solid #ede8df' }}>{tableBody}</div>;
                      };

                      // ── COMPONENTE: tabela binária (sim/não) ──
                      const BinTable = ({ rows, title }: { rows: Row[]; title?: string }) => {
                        const tableBody = (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                              <thead>
                                <tr style={{ background: '#f0ebe0' }}>
                                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 700, color: '#5d3a1a', fontSize: 12, minWidth: 220, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Indicador</th>
                                  {anos.map((a: number, ai: number) => (
                                    <th key={a} style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#5d3a1a', fontSize: 12, minWidth: 70, background: ai === anos.length - 1 ? '#e8dfc8' : undefined }}>{a}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row, rowIdx) => {
                                  if (row.header) return (
                                    <tr key={rowIdx}>
                                      <td colSpan={anos.length + 1} style={{ padding: '8px 20px', background: '#ede8df', fontWeight: 800, fontSize: 11, color: '#7a5230', textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: '2px solid #ddd5c5' }}>
                                        {row.label}
                                      </td>
                                    </tr>
                                  );
                                  const vals = anos.map((a: number) => c[a]?.[row.key] ?? null);
                                  if (vals.every((v: any) => v == null)) return null;
                                  return (
                                    <tr key={rowIdx} style={{ borderTop: '1px solid #f0e8d8', background: rowIdx % 2 === 0 ? '#fff' : '#fdf9f4' }}>
                                      <td style={{ padding: '9px 20px', color: '#4a3020', fontWeight: 500, fontSize: 13 }}>{row.label}</td>
                                      {vals.map((v: any, vi: number) => {
                                        const prev = vi > 0 ? vals[vi - 1] : null;
                                        const gained = prev === 0 && v === 1;
                                        const lost = prev === 1 && v === 0;
                                        const isLatest = vi === anos.length - 1;
                                        const bgCell = gained ? '#e8faf0' : lost ? '#fef2f2' : isLatest && v === 1 ? '#f0faf4' : undefined;
                                        return (
                                          <td key={vi} style={{ padding: '9px 12px', textAlign: 'center', verticalAlign: 'middle', background: bgCell }}>
                                            {v === 1 ? (
                                              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                <span style={{ fontSize: 18, color: '#16714a', lineHeight: 1 }}>✓</span>
                                                {gained && <span style={{ fontSize: 9, fontWeight: 800, color: '#16714a', background: '#d1fadf', borderRadius: 4, padding: '1px 4px' }}>ganhou</span>}
                                              </span>
                                            ) : v === 0 ? (
                                              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                <span style={{ fontSize: 15, color: '#ccc5bb', lineHeight: 1 }}>✗</span>
                                                {lost && <span style={{ fontSize: 9, fontWeight: 800, color: '#b74f42', background: '#fee2e2', borderRadius: 4, padding: '1px 4px' }}>perdeu</span>}
                                              </span>
                                            ) : (
                                              <span style={{ color: '#ddd', fontSize: 13 }}>—</span>
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                        if (title) return (
                          <details style={{ borderBottom: '1px solid #ede8df' }}>
                            <summary style={summaryStyle}><span>{title}</span><span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>clique para ver ▾</span></summary>
                            {tableBody}
                          </details>
                        );
                        return <div style={{ borderBottom: '1px solid #ede8df' }}>{tableBody}</div>;
                      };

                      // ── DIM 1: INFRAESTRUTURA ──
                      if (activeSchoolTab === 'dim1') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={1} icon="🏗️" title="Infraestrutura" desc="Estrutura física, espaços e serviços da escola" index="Índice de Infraestrutura" />
                          <NumTable title="Salas de Aula" rows={[
                            { label: 'Salas utilizadas (total)', key: 'qt_salas_utilizadas' },
                            { label: 'Salas climatizadas', key: 'qt_salas_utiliza_climatizadas' },
                            { label: 'Salas acessíveis (PNE)', key: 'qt_salas_utilizadas_acessiveis' },
                          ]} />
                          <BinTable title="Água e Saneamento" rows={[
                            { label: 'Água potável', key: 'in_agua_potavel' },
                            { label: 'Água — Rede pública', key: 'in_agua_rede_publica' },
                            { label: 'Água — Poço artesiano', key: 'in_agua_poco_artesiano' },
                            { label: 'Água — Cacimba/cisterna', key: 'in_agua_cacimba' },
                            { label: 'Água — Rio/fonte/igarapé', key: 'in_agua_fonte_rio' },
                            { label: 'Água — Carro pipa', key: 'in_agua_carro_pipa' },
                            { label: 'Água — Inexistente', key: 'in_agua_inexistente' },
                            { label: 'Esgoto — Rede pública', key: 'in_esgoto_rede_publica' },
                            { label: 'Esgoto — Fossa séptica', key: 'in_esgoto_fossa_septica' },
                            { label: 'Esgoto — Fossa comum', key: 'in_esgoto_fossa_comum' },
                            { label: 'Esgoto — Inexistente', key: 'in_esgoto_inexistente' },
                            { label: 'Lixo — Coleta pública', key: 'in_lixo_servico_coleta' },
                            { label: 'Lixo — Queima', key: 'in_lixo_queima' },
                            { label: 'Lixo — Enterra', key: 'in_lixo_enterra' },
                          ]} />
                          <BinTable title="Energia" rows={[
                            { label: 'Energia — Rede pública', key: 'in_energia_rede_publica' },
                            { label: 'Energia — Gerador a diesel', key: 'in_energia_gerador_fossil' },
                            { label: 'Energia — Renovável (solar etc.)', key: 'in_energia_renovavel' },
                            { label: 'Energia — Inexistente', key: 'in_energia_inexistente' },
                          ]} />
                          <BinTable title="Banheiros e Higiene" rows={[
                            { label: 'Banheiro', key: 'in_banheiro' },
                            { label: 'Banheiro com chuveiro', key: 'in_banheiro_chuveiro' },
                            { label: 'Banheiro para funcionários', key: 'in_banheiro_funcionarios' },
                            { label: 'Banheiro acessível (PNE)', key: 'in_banheiro_pne' },
                            { label: 'Banheiro para Ed. Infantil', key: 'in_banheiro_ei' },
                          ]} />
                          <BinTable title="Alimentação" rows={[
                            { label: 'Cozinha', key: 'in_cozinha' },
                            { label: 'Refeitório', key: 'in_refeitorio' },
                            { label: 'Despensa', key: 'in_despensa' },
                            { label: 'Almoxarifado', key: 'in_almoxarifado' },
                          ]} />
                          <BinTable title="Espaços de Aprendizagem" rows={[
                            { label: 'Biblioteca', key: 'in_biblioteca' },
                            { label: 'Sala de leitura', key: 'in_biblioteca_sala_leitura' },
                            { label: 'Lab. de informática', key: 'in_laboratorio_informatica' },
                            { label: 'Lab. de ciências', key: 'in_laboratorio_ciencias' },
                            { label: 'Lab. Ed. Profissional', key: 'in_laboratorio_educ_prof' },
                            { label: 'Sala AEE (Atend. Especializado)', key: 'in_sala_atendimento_especial' },
                            { label: 'Sala multiuso', key: 'in_sala_multiuso' },
                            { label: 'Ateliê de artes', key: 'in_sala_atelie_artes' },
                            { label: 'Sala de música/coral', key: 'in_sala_musica_coral' },
                            { label: 'Estúdio de dança', key: 'in_sala_estudio_danca' },
                            { label: 'Estúdio de gravação', key: 'in_sala_estudio_gravacao' },
                            { label: 'Sala de repouso de alunos', key: 'in_sala_repouso_aluno' },
                          ]} />
                          <BinTable title="Espaços Administrativos" rows={[
                            { label: 'Sala dos professores', key: 'in_sala_professor' },
                            { label: 'Sala de diretoria', key: 'in_sala_diretoria' },
                            { label: 'Secretaria', key: 'in_secretaria' },
                          ]} />
                          <BinTable title="Esportes e Lazer" rows={[
                            { label: 'Pátio coberto', key: 'in_patio_coberto' },
                            { label: 'Pátio descoberto', key: 'in_patio_descoberto' },
                            { label: 'Quadra coberta', key: 'in_quadra_esportes_coberta' },
                            { label: 'Quadra descoberta', key: 'in_quadra_esportes_descoberta' },
                            { label: 'Parque infantil', key: 'in_parque_infantil' },
                            { label: 'Piscina', key: 'in_piscina' },
                            { label: 'Auditório', key: 'in_auditorio' },
                            { label: 'Dormitório de alunos (internato)', key: 'in_dormitorio_aluno' },
                            { label: 'Dormitório de professores', key: 'in_dormitorio_professor' },
                          ]} />
                        </div>
                      );

                      // ── DIM 2: TECNOLOGIA E CONECTIVIDADE ──
                      if (activeSchoolTab === 'dim2') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={2} icon="💻" title="Tecnologia e Conectividade" desc="Acesso digital e equipamentos tecnológicos" index="Índice de Equidade Digital" />
                          <BinTable title="Conectividade" rows={[
                            { label: 'Internet (qualquer)', key: 'in_internet' },
                            { label: 'Internet para uso administrativo', key: 'in_internet_administrativo' },
                            { label: 'Internet para uso dos alunos', key: 'in_internet_alunos' },
                            { label: 'Banda larga', key: 'in_banda_larga' },
                            { label: 'Rede local (intranet)', key: 'in_rede_local' },
                            { label: 'Wi-Fi', key: 'in_wifi' },
                          ]} />
                          <NumTable title="Dispositivos — Alunos" rows={[
                            { label: 'Desktops para alunos', key: 'qt_desktop_aluno' },
                            { label: 'Notebooks/portáteis para alunos', key: 'qt_comp_portatil_aluno' },
                            { label: 'Tablets para alunos', key: 'qt_tablet_aluno' },
                          ]} />
                          <NumTable title="Dispositivos — Administrativo" rows={[
                            { label: 'Desktops administrativos', key: 'qt_desktop_adm' },
                            { label: 'Notebooks administrativos', key: 'qt_comp_portatil_adm' },
                          ]} />
                          <NumTable title="Equipamentos Multimídia" rows={[
                            { label: 'TVs', key: 'qt_equip_tv' },
                            { label: 'Projetor/Multimídia', key: 'qt_equip_multimidia' },
                            { label: 'Lousa digital', key: 'qt_equip_lousa_digital' },
                            { label: 'Aparelhos de som', key: 'qt_equip_som' },
                            { label: 'Impressoras', key: 'qt_equip_impressora' },
                            { label: 'Impressoras multifuncionais', key: 'qt_equip_impressora_mult' },
                            { label: 'Copiadoras', key: 'qt_equip_copiadora' },
                          ]} />
                          <BinTable title="Materiais Pedagógicos" rows={[
                            { label: 'Material multimídia', key: 'in_material_ped_multimidia' },
                            { label: 'Material Ed. Infantil', key: 'in_material_ped_infantil' },
                            { label: 'Material científico', key: 'in_material_ped_cientifico' },
                            { label: 'Material musical', key: 'in_material_ped_musical' },
                            { label: 'Jogos educativos', key: 'in_material_ped_jogos' },
                            { label: 'Material artístico', key: 'in_material_ped_artisticas' },
                            { label: 'Material esportivo', key: 'in_material_ped_desportiva' },
                            { label: 'Material Ed. Especial', key: 'in_material_ped_edu_esp' },
                          ]} />
                        </div>
                      );

                      // ── DIM 3: SEGURANÇA ESCOLAR ──
                      if (activeSchoolTab === 'dim3') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={3} icon="🛡️" title="Segurança Escolar" desc="Ambiente seguro e local de funcionamento" index="Índice de Segurança" />
                          <BinTable title="Local de Funcionamento" rows={[
                            { label: 'Prédio escolar próprio', key: 'in_local_func_predio_escolar' },
                            { label: 'Salas em outra escola', key: 'in_local_func_salas_outra_esc' },
                            { label: 'Galpão/rancho', key: 'in_local_func_galpao' },
                            { label: 'Socioeducativo', key: 'in_local_func_socioeducativo' },
                            { label: 'Unidade prisional', key: 'in_local_func_unid_prisional' },
                            { label: 'Prédio compartilhado', key: 'in_predio_compartilhado' },
                            { label: 'Outros locais', key: 'in_local_func_outros' },
                          ]} />
                          <div style={{ padding: '14px 20px', background: '#fffbf2', borderTop: '1px solid #f0e8d0', fontSize: 13, color: '#8a7040' }}>
                            ⚠️ <strong>Nota:</strong> O Censo Escolar não coleta dados sobre câmeras, portaria, alarmes, extintores ou plano de evacuação. Esses itens compõem o Índice de Segurança proposto, mas dependem de fontes complementares.
                          </div>
                        </div>
                      );

                      // ── DIM 4: SUSTENTABILIDADE E MEIO AMBIENTE ──
                      if (activeSchoolTab === 'dim4') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={4} icon="🌱" title="Sustentabilidade e Meio Ambiente" desc="Uso de recursos naturais e educação ambiental" index="Índice de Sustentabilidade" />
                          <BinTable title="Recursos Naturais e Energia Limpa" rows={[
                            { label: 'Energia renovável (solar etc.)', key: 'in_energia_renovavel' },
                            { label: 'Área verde', key: 'in_area_verde' },
                            { label: 'Área para plantio', key: 'in_area_plantio' },
                            { label: 'Horta escolar', key: 'in_horta' },
                            { label: 'Compostagem', key: 'in_compostagem' },
                            { label: 'Viveiro', key: 'in_viveiro' },
                          ]} />
                          <BinTable title="Gestão de Resíduos" rows={[
                            { label: 'Separação de lixo', key: 'in_tratamento_lixo_separacao' },
                            { label: 'Reciclagem', key: 'in_tratamento_lixo_reciclagem' },
                            { label: 'Reutilização de materiais', key: 'in_tratamento_lixo_reutiliza' },
                            { label: 'Lixo — Coleta pública', key: 'in_lixo_servico_coleta' },
                            { label: 'Lixo — Queima (negativo)', key: 'in_lixo_queima' },
                            { label: 'Lixo — Enterra (negativo)', key: 'in_lixo_enterra' },
                            { label: 'Tratamento — Inexistente', key: 'in_tratamento_lixo_inexistente' },
                          ]} />
                          <BinTable title="Educação Ambiental" rows={[
                            { label: 'Ed. Ambiental', key: 'in_educacao_ambiental' },
                          ]} />
                        </div>
                      );

                      // ── DIM 5: INCLUSÃO E ACESSIBILIDADE ──
                      if (activeSchoolTab === 'dim5') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={5} icon="♿" title="Inclusão e Acessibilidade" desc="Inclusão de estudantes com deficiência e necessidades especiais" index="Índice de Inclusão" />
                          <BinTable title="Acessibilidade Física" rows={[
                            { label: 'Rampas', key: 'in_acessibilidade_rampas' },
                            { label: 'Corrimão', key: 'in_acessibilidade_corrimao' },
                            { label: 'Elevador', key: 'in_acessibilidade_elevador' },
                            { label: 'Piso tátil', key: 'in_acessibilidade_pisos_tateis' },
                            { label: 'Sinalização visual', key: 'in_acessibilidade_sinal_visual' },
                            { label: 'Sinalização sonora', key: 'in_acessibilidade_sinal_sonoro' },
                            { label: 'Telas/leitores (def. visual)', key: 'in_acessibilidade_telas_leitoras' },
                            { label: 'Banheiro acessível (PNE)', key: 'in_banheiro_pne' },
                            { label: 'Dependências acessíveis', key: 'in_dependencias_pne' },
                          ]} />
                          <BinTable title="Recursos Pedagógicos de Inclusão" rows={[
                            { label: 'Sala AEE (Atend. Ed. Especializado)', key: 'in_sala_atendimento_especial' },
                            { label: 'Libras', key: 'in_esp_libras' },
                            { label: 'Braille', key: 'in_esp_braille' },
                            { label: 'Comunicação alternativa', key: 'in_esp_comunicacao_alternativa' },
                            { label: 'Orientação e mobilidade', key: 'in_esp_orient_mobilidade' },
                            { label: 'Enriquecimento curricular', key: 'in_esp_enriquecimento_curricular' },
                            { label: 'Intérprete de Libras', key: 'in_prof_interprete_libras' },
                            { label: 'Profissional de apoio', key: 'in_prof_apoio' },
                          ]} />
                          <NumTable title="Educação Especial — Matrículas" rows={[
                            { label: 'Total Ed. Especial', key: 'qt_mat_esp' },
                            { label: 'Classes comuns (inclusão)', key: 'qt_mat_esp_cc' },
                            { label: 'Classes exclusivas', key: 'qt_mat_esp_ce' },
                          ]} />
                          <NumTable title="Educação Especial — Docentes e Turmas" rows={[
                            { label: 'Docentes Ed. Especial', key: 'qt_doc_esp' },
                            { label: 'Doc. — Classes Comuns', key: 'qt_doc_esp_cc' },
                            { label: 'Doc. — Classes Exclusivas', key: 'qt_doc_esp_ce' },
                            { label: 'Turmas Ed. Especial', key: 'qt_tur_esp' },
                            { label: 'Turmas — Classes Comuns', key: 'qt_tur_esp_cc' },
                            { label: 'Turmas — Classes Exclusivas', key: 'qt_tur_esp_ce' },
                          ]} />
                        </div>
                      );

                      // ── DIM 6: EQUIDADE SOCIAL E EDUCACIONAL ──
                      if (activeSchoolTab === 'dim6') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={6} icon="⚖️" title="Equidade Social e Educacional" desc="Perfil social dos estudantes e modalidades de equidade" index="Índice Social" />
                          <NumTable title="Perfil dos Estudantes — por Sexo" rows={[
                            { label: 'Feminino', key: 'qt_mat_bas_fem' },
                            { label: 'Masculino', key: 'qt_mat_bas_masc' },
                          ]} />
                          <NumTable title="por Cor/Raça" rows={[
                            { label: 'Branca', key: 'qt_mat_bas_branca' },
                            { label: 'Preta', key: 'qt_mat_bas_preta' },
                            { label: 'Parda', key: 'qt_mat_bas_parda' },
                            { label: 'Amarela', key: 'qt_mat_bas_amarela' },
                            { label: 'Indígena', key: 'qt_mat_bas_indigena' },
                            { label: 'Não declarada', key: 'qt_mat_bas_nd' },
                          ]} />
                          <NumTable title="por Faixa Etária" rows={[
                            { label: '0 a 3 anos', key: 'qt_mat_bas_0_3' },
                            { label: '4 a 5 anos', key: 'qt_mat_bas_4_5' },
                            { label: '6 a 10 anos', key: 'qt_mat_bas_6_10' },
                            { label: '11 a 14 anos', key: 'qt_mat_bas_11_14' },
                            { label: '15 a 17 anos', key: 'qt_mat_bas_15_17' },
                            { label: '18 anos ou mais', key: 'qt_mat_bas_18_mais' },
                          ]} />
                          <NumTable title="por Zona de Residência e Turno" rows={[
                            { label: 'Zona urbana', key: 'qt_mat_zr_urb' },
                            { label: 'Zona rural', key: 'qt_mat_zr_rur' },
                            { label: 'Turno diurno', key: 'qt_mat_bas_d' },
                            { label: 'Turno noturno', key: 'qt_mat_bas_n' },
                            { label: 'EAD', key: 'qt_mat_bas_ead' },
                          ]} />
                          <BinTable title="Modalidades de Equidade" rows={[
                            { label: 'Ed. Indígena', key: 'in_educacao_indigena' },
                            { label: 'Ed. Quilombola', key: 'in_educacao_quilombola' },
                            { label: 'Ed. do Campo', key: 'in_educacao_campo' },
                            { label: 'EJA', key: 'in_eja' },
                            { label: 'Ed. Profissional', key: 'in_prof' },
                            { label: 'Tempo Integral', key: 'in_tempo_integral' },
                            { label: 'Alimentação escolar', key: 'in_alimentacao' },
                          ]} />
                          <NumTable title="Transporte Escolar" rows={[
                            { label: 'Alunos com transporte público', key: 'qt_transp_publico' },
                            { label: 'Custeado pelo Estado', key: 'qt_transp_resp_est' },
                            { label: 'Custeado pelo Município', key: 'qt_transp_resp_mun' },
                          ]} />
                          <BinTable title="Tipo de Transporte" rows={[
                            { label: 'Van / Veículo leve', key: 'in_equip_transpor_vans_micro' },
                            { label: 'Micro-ônibus', key: 'in_equip_transpor_micro_onibus' },
                            { label: 'Ônibus', key: 'in_equip_transpor_onibus' },
                            { label: 'Bicicleta', key: 'in_equip_transpor_bicicleta' },
                            { label: 'Tração animal', key: 'in_equip_transpor_tracao_animal' },
                            { label: 'Aquaviário (barco/canoa)', key: 'in_equip_transpor_aquaviario' },
                            { label: 'Ferroviário (trem)', key: 'in_equip_transpor_ferroviario' },
                          ]} />
                        </div>
                      );

                      // ── DIM 7: PARTICIPAÇÃO E COMUNIDADE ──
                      if (activeSchoolTab === 'dim7') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={7} icon="🤝" title="Participação e Comunidade" desc="Gestão democrática, vínculos e participação da comunidade" index="Índice de Participação" />
                          <BinTable title="Gestão Democrática" rows={[
                            { label: 'Conselho escolar', key: 'in_orgao_conselho_escolar' },
                            { label: 'Associação de pais e mestres', key: 'in_orgao_ass_pais_mestres' },
                            { label: 'Grêmio estudantil', key: 'in_orgao_gremio_estudantil' },
                            { label: 'Projeto Político-Pedagógico', key: 'in_ppp' },
                            { label: 'Redes sociais', key: 'in_redes_sociais' },
                            { label: 'Parceria com Poder Público', key: 'in_poder_publico_parceria' },
                          ]} />
                          <BinTable title="Vínculo Institucional" rows={[
                            { label: 'Vínculo — Secretaria de Educação', key: 'in_vinculo_secretaria_educacao' },
                            { label: 'Vínculo — Segurança Pública', key: 'in_vinculo_seguranca_publica' },
                            { label: 'Vínculo — Secretaria de Saúde', key: 'in_vinculo_secretaria_saude' },
                            { label: 'Vínculo — Outro órgão', key: 'in_vinculo_outro_orgao' },
                          ]} />
                          <BinTable title="Idiomas Ofertados" rows={[
                            { label: 'Inglês', key: 'in_lingua_ingles' },
                            { label: 'Espanhol', key: 'in_lingua_espanhol' },
                            { label: 'Francês', key: 'in_lingua_frances' },
                            { label: 'Libras', key: 'in_lingua_libras' },
                            { label: 'Língua indígena', key: 'in_lingua_indigena' },
                            { label: 'Outro idioma estrangeiro', key: 'in_lingua_outra_estrang' },
                          ]} />
                        </div>
                      );

                      // ── DIM 8: GESTÃO ESCOLAR ──
                      if (activeSchoolTab === 'dim8') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={8} icon="📋" title="Gestão Escolar" desc="Estrutura administrativa e equipe de suporte" index="Índice de Gestão" />
                          <NumTable title="Equipe Não Docente" rows={[
                            { label: 'Coordenadores pedagógicos', key: 'qt_prof_coordenador' },
                            { label: 'Secretários escolares', key: 'qt_prof_secretario' },
                            { label: 'Administrativos', key: 'qt_prof_administrativos' },
                            { label: 'Serviços gerais', key: 'qt_prof_servicos_gerais' },
                            { label: 'Segurança/vigilância', key: 'qt_prof_seguranca' },
                            { label: 'Monitores/Auxiliares', key: 'qt_prof_monitores' },
                            { label: 'Bibliotecários', key: 'qt_prof_bibliotecario' },
                            { label: 'Psicólogos', key: 'qt_prof_psicologo' },
                            { label: 'Assistentes sociais', key: 'qt_prof_assist_social' },
                            { label: 'Nutricionistas', key: 'qt_prof_nutricionista' },
                          ]} />
                          <NumTable title="Gestores" rows={[
                            { label: 'Gestores Ed. Básica', key: 'qt_gest_bas' },
                          ]} />
                        </div>
                      );

                      // ── DIM 9: DOCENTES ──
                      if (activeSchoolTab === 'dim9') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={9} icon="🧑‍🏫" title="Docentes" desc="Quantidade e distribuição dos professores por etapa" index="Índice Docente" />
                          <NumTable title="Docentes por Etapa de Ensino" rows={[
                            { label: 'Total (Ed. Básica)', key: 'qt_doc_bas' },
                            { label: 'Ed. Infantil', key: 'qt_doc_inf' },
                            { label: '— Creche', key: 'qt_doc_inf_cre' },
                            { label: '— Pré-escola', key: 'qt_doc_inf_pre' },
                            { label: 'Ens. Fundamental', key: 'qt_doc_fund' },
                            { label: '— Anos Iniciais', key: 'qt_doc_fund_ai' },
                            { label: '— Anos Finais', key: 'qt_doc_fund_af' },
                            { label: 'Ensino Médio', key: 'qt_doc_med' },
                            { label: 'EJA', key: 'qt_doc_eja' },
                            { label: '— EJA Fundamental', key: 'qt_doc_eja_fund' },
                            { label: '— EJA Médio', key: 'qt_doc_eja_med' },
                            { label: 'Ed. Profissional', key: 'qt_doc_prof' },
                            { label: 'Ed. Especial', key: 'qt_doc_esp' },
                          ]} />
                          <div style={{ padding: '14px 20px', background: '#fffbf2', borderTop: '1px solid #f0e8d0', fontSize: 13, color: '#8a7040' }}>
                            ℹ️ <strong>Nota:</strong> O Censo Escolar informa a quantidade de docentes por etapa. Dados de formação, licenciatura e regime de trabalho não estão disponíveis nesta versão.
                          </div>
                        </div>
                      );

                      // ── DIM 10: OFERTA EDUCACIONAL ──
                      if (activeSchoolTab === 'dim10') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={10} icon="📚" title="Oferta Educacional" desc="O que a escola oferece — etapas, turmas e matrículas" index="Índice de Oferta Educacional" />
                          <BinTable title="Etapas e Modalidades Oferecidas" rows={[
                            { label: 'Ed. Infantil', key: 'in_inf' },
                            { label: '— Creche', key: 'in_inf_cre' },
                            { label: '— Pré-escola', key: 'in_inf_pre' },
                            { label: 'Ens. Fundamental', key: 'in_fund' },
                            { label: '— Anos Iniciais', key: 'in_fund_ai' },
                            { label: '— Anos Finais', key: 'in_fund_af' },
                            { label: 'Ensino Médio', key: 'in_med' },
                            { label: 'Ed. Profissional', key: 'in_prof' },
                            { label: 'EJA', key: 'in_eja' },
                            { label: 'Ed. Especial', key: 'in_esp' },
                            { label: 'Tempo Integral', key: 'in_tempo_integral' },
                            { label: 'Ed. Indígena', key: 'in_educacao_indigena' },
                            { label: 'Ed. Quilombola', key: 'in_educacao_quilombola' },
                            { label: 'Ed. do Campo', key: 'in_educacao_campo' },
                            { label: 'Ed. Ambiental', key: 'in_educacao_ambiental' },
                          ]} />
                          <NumTable title="Matrículas" rows={[
                            { label: 'Total Ed. Básica', key: 'qt_mat_bas' },
                            { label: 'Ed. Infantil', key: 'qt_mat_inf' },
                            { label: '— Creche', key: 'qt_mat_inf_cre' },
                            { label: '— Pré-escola', key: 'qt_mat_inf_pre' },
                            { label: 'Ens. Fundamental', key: 'qt_mat_fund' },
                            { label: '— Anos Iniciais (1º–5º)', key: 'qt_mat_fund_ai' },
                            { label: '    1º ano', key: 'qt_mat_fund_ai_1' },
                            { label: '    2º ano', key: 'qt_mat_fund_ai_2' },
                            { label: '    3º ano', key: 'qt_mat_fund_ai_3' },
                            { label: '    4º ano', key: 'qt_mat_fund_ai_4' },
                            { label: '    5º ano', key: 'qt_mat_fund_ai_5' },
                            { label: '— Anos Finais (6º–9º)', key: 'qt_mat_fund_af' },
                            { label: '    6º ano', key: 'qt_mat_fund_af_6' },
                            { label: '    7º ano', key: 'qt_mat_fund_af_7' },
                            { label: '    8º ano', key: 'qt_mat_fund_af_8' },
                            { label: '    9º ano', key: 'qt_mat_fund_af_9' },
                            { label: 'Ensino Médio', key: 'qt_mat_med' },
                            { label: '— 1ª série', key: 'qt_mat_med_prop_1' },
                            { label: '— 2ª série', key: 'qt_mat_med_prop_2' },
                            { label: '— 3ª série', key: 'qt_mat_med_prop_3' },
                            { label: '— Médio integrado', key: 'qt_mat_med_int' },
                            { label: 'EJA', key: 'qt_mat_eja' },
                            { label: '— EJA Fundamental', key: 'qt_mat_eja_fund' },
                            { label: '— EJA Médio', key: 'qt_mat_eja_med' },
                            { label: 'Ed. Profissional', key: 'qt_mat_prof' },
                            { label: '— Ed. Prof. Técnica', key: 'qt_mat_prof_tec' },
                            { label: 'Ed. Especial', key: 'qt_mat_esp' },
                            { label: '— Classes comuns (inclusão)', key: 'qt_mat_esp_cc' },
                            { label: '— Classes exclusivas', key: 'qt_mat_esp_ce' },
                          ]} />
                          <NumTable title="Turmas" rows={[
                            { label: 'Total turmas', key: 'qt_tur_bas' },
                            { label: '— Ed. Infantil', key: 'qt_tur_inf' },
                            { label: '— Fundamental', key: 'qt_tur_fund' },
                            { label: '— Ensino Médio', key: 'qt_tur_med' },
                            { label: '— EJA', key: 'qt_tur_eja' },
                            { label: '— Ed. Profissional', key: 'qt_tur_prof' },
                            { label: '— Ed. Especial', key: 'qt_tur_esp' },
                            { label: 'Turmas diurnas', key: 'qt_tur_bas_d' },
                            { label: 'Turmas noturnas', key: 'qt_tur_bas_n' },
                          ]} />
                          <NumTable title="Tempo Integral" rows={[
                            { label: 'Matrículas Infantil integral', key: 'qt_mat_inf_int' },
                            { label: 'Matrículas Fund. AI integral', key: 'qt_mat_fund_ai_int' },
                            { label: 'Matrículas Fund. AF integral', key: 'qt_mat_fund_af_int' },
                            { label: 'Matrículas Médio integral', key: 'qt_mat_med_int' },
                            { label: 'Turmas Infantil integral', key: 'qt_tur_inf_int' },
                            { label: 'Turmas Fund. AI integral', key: 'qt_tur_fund_ai_int' },
                            { label: 'Turmas Fund. AF integral', key: 'qt_tur_fund_af_int' },
                            { label: 'Turmas Médio integral', key: 'qt_tur_med_int' },
                          ]} />
                        </div>
                      );

                      return null;

                    })()}

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

                  {/* ── RESUMO RÁPIDO ── */}
                  {(() => {
                    const totalRepasses = atendimentoData?.ok
                      ? atendimentoData.itens.reduce((s: number, r: any) => s + (r.vl_repasse_custeio || 0) + (r.vl_repasse_capital || 0), 0)
                      : pddeExecFinData?.ok
                        ? pddeExecFinData.repasses.reduce((s: number, r: any) => s + (r.vl_pago_total || 0), 0)
                        : null;
                    const totalSaldo = pddeUexSaldoData?.ok
                      ? pddeUexSaldoData.total_saldo_geral
                      : pddeSaldosData?.ok
                        ? pddeSaldosData.saldos.reduce((s: number, r: any) => s + (r.saldo_acumulado || 0), 0)
                        : pddeData?.contas
                          ? pddeData.contas.reduce((s: number, c: any) => s + (c.saldo || 0), 0)
                          : null;
                    const hasAny = totalRepasses != null || totalSaldo != null;
                    if (!hasAny) return null;
                    return (
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'10px',marginBottom:'20px'}}>
                        {totalRepasses != null && totalRepasses > 0 && (
                          <div className="soft-card" style={{padding:'16px',borderLeft:'3px solid #2f7a58',display:'flex',flexDirection:'column',gap:'4px'}}>
                            <span style={{fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'#2f7a58'}}>Total Recebido</span>
                            <span style={{fontSize:'20px',fontWeight:800,color:'#2f7a58',fontVariantNumeric:'tabular-nums'}}>{brl(totalRepasses)}</span>
                            <span style={{fontSize:'11px',color:'var(--m-muted)'}}>repasses {atendimentoData?.itens?.[0]?.ano || pddeAno}</span>
                          </div>
                        )}
                        {totalSaldo != null && (
                          <div className="soft-card" style={{padding:'16px',borderLeft:`3px solid ${totalSaldo > 0 ? '#2d5a88' : '#b74f42'}`,display:'flex',flexDirection:'column',gap:'4px'}}>
                            <span style={{fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:totalSaldo > 0 ? '#2d5a88' : '#b74f42'}}>Saldo Atual</span>
                            <span style={{fontSize:'20px',fontWeight:800,color:totalSaldo > 0 ? '#2d5a88' : '#b74f42',fontVariantNumeric:'tabular-nums'}}>{brl(totalSaldo)}</span>
                            <span style={{fontSize:'11px',color:'var(--m-muted)'}}>
                              {pddeUexSaldoData?.ok ? `posição ${pddeUexSaldoData.mes}` : 'saldo acumulado'}
                            </span>
                          </div>
                        )}
                        {pddeData?.ok && pddeData.matriculas_total != null && (
                          <div className="soft-card" style={{padding:'16px',borderLeft:'3px solid #9b6a16',display:'flex',flexDirection:'column',gap:'4px'}}>
                            <span style={{fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'#9b6a16'}}>Alunos (PDDE)</span>
                            <span style={{fontSize:'20px',fontWeight:800,color:'#9b6a16',fontVariantNumeric:'tabular-nums'}}>{Number(pddeData.matriculas_total).toLocaleString('pt-BR')}</span>
                            <span style={{fontSize:'11px',color:'var(--m-muted)'}}>base de cálculo {pddeData.ano}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* ── GRUPO: QUEM GERENCIA ── */}
                  {(pddeData?.ok || cadastralData?.ok) && (
                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px',marginTop:'4px'}}>
                      <span style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#7c5cbf',background:'#f3eeff',padding:'3px 10px',borderRadius:'20px'}}>Quem gerencia</span>
                      <div style={{flex:1,height:'1px',background:'linear-gradient(to right,#e8e0f5,transparent)'}} />
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
                  {/* ── GRUPO: CONTAS E SALDOS ── */}
                  {((pddeData?.contas?.length ?? 0) > 0 || pddeUexSaldoData?.ok || pddeSaldosData?.ok) && (
                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px',marginTop:'20px'}}>
                      <span style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#2d5a88',background:'#e6eef8',padding:'3px 10px',borderRadius:'20px'}}>Contas e saldos</span>
                      <div style={{flex:1,height:'1px',background:'linear-gradient(to right,#b8cfe8,transparent)'}} />
                    </div>
                  )}

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

                  {/* ── GRUPO: REPASSES E EXECUÇÃO ── */}
                  {(atendimentoData?.ok || pddeExecFinData?.ok || (pddeData?.destinacoes?.length ?? 0) > 0) && (
                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px',marginTop:'20px'}}>
                      <span style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#2f7a58',background:'#e8f5ee',padding:'3px 10px',borderRadius:'20px'}}>Repasses e execução</span>
                      <div style={{flex:1,height:'1px',background:'linear-gradient(to right,#b8e0cc,transparent)'}} />
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

                  {/* ── 4b. DESTINAÇÕES (CARDS) ── */}
                  {pddeData?.ok && pddeData.destinacoes && pddeData.destinacoes.length > 0 && (
                    <div style={{marginBottom:'16px'}}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> Destinações por tipo — {pddeData.ano}
                      </p>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'10px'}}>
                        {pddeData.destinacoes.map((d: any, i: number) => {
                          const devido = d.final_devido_total ?? ((d.devido_custeio || 0) + (d.devido_capital || 0));
                          const pago = d.pago_total ?? ((d.pago_custeio || 0) + (d.pago_capital || 0));
                          const pct = devido > 0 ? Math.min(100, Math.round((pago / devido) * 100)) : null;
                          return (
                            <div key={i} className="soft-card" style={{padding:'14px',borderLeft:'3px solid #2f7a58'}}>
                              <p style={{fontWeight:700,fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.04em',color:'#2f7a58',marginBottom:'10px'}}>{d.destinacao || 'Destinação'}</p>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'4px'}}>
                                <span style={{fontSize:'11px',color:'var(--m-muted)'}}>Devido</span>
                                <span style={{fontSize:'12px',fontWeight:600,fontFamily:'monospace'}}>{devido != null ? brl(devido) : '—'}</span>
                              </div>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'8px'}}>
                                <span style={{fontSize:'11px',color:'var(--m-muted)'}}>Pago</span>
                                <span style={{fontSize:'14px',fontWeight:800,color:pago > 0 ? '#16a34a' : 'var(--m-muted)',fontFamily:'monospace'}}>{pago != null ? brl(pago) : '—'}</span>
                              </div>
                              {pct !== null && (
                                <>
                                  <div style={{height:'5px',borderRadius:'3px',background:'#e8f5ee',overflow:'hidden'}}>
                                    <div style={{height:'100%',width:`${pct}%`,background: pct >= 100 ? '#16a34a' : '#2f7a58',borderRadius:'3px',transition:'width .4s'}} />
                                  </div>
                                  <p style={{fontSize:'10px',color:'var(--m-muted)',marginTop:'4px',textAlign:'right'}}>{pct}% executado</p>
                                </>
                              )}
                              {d.data_ordem_pgto && <p style={{fontSize:'10px',color:'var(--m-muted)',marginTop:'4px'}}>Pgto: {d.data_ordem_pgto}</p>}
                            </div>
                          );
                        })}
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

                  {/* ── GRUPO: PRESTAÇÃO DE CONTAS ── */}
                  {(prestacaoContaData?.ok || sigpcData?.ok) && (
                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px',marginTop:'20px'}}>
                      <span style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#9b6a16',background:'#fdf3e0',padding:'3px 10px',borderRadius:'20px'}}>Prestação de contas</span>
                      <div style={{flex:1,height:'1px',background:'linear-gradient(to right,#f0ddb5,transparent)'}} />
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
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Programa</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Ano</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Sit. UEx</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Sit. EEx</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Valor</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Susp.</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Exceção</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sigpcData.prestacoes.map((p: any, i: number) => {
                              const isAdimpl = p.situacaoNome?.toLowerCase().includes('adimpl');
                              const isAdimplEex = p.situacaoPcEex?.toLowerCase().includes('adimpl');
                              const hasSusp = (p.efeitoSuspensivo && !['NÃO','Não',''].includes(String(p.efeitoSuspensivo).trim())) || (p.efeitoSuspensivoEex && !['NÃO','Não',''].includes(String(p.efeitoSuspensivoEex).trim()));
                              const hasMedExc = p.medidaExcecao && !['NÃO','Não',''].includes(String(p.medidaExcecao).trim());
                              return (
                                <tr key={i} style={{borderBottom:'1px solid #f0ece4'}}>
                                  <td className="py-2 px-3 text-xs font-medium">{p.programaNome || '—'}</td>
                                  <td className="py-2 px-3 text-xs">{p.anoConcessao || '—'}</td>
                                  <td className="py-2 px-3">
                                    {p.situacaoNome
                                      ? <span className={`badge ${isAdimpl ? 'badge-good' : 'badge-attn'}`}>{p.situacaoNome}</span>
                                      : <span className="text-muted-foreground text-xs">—</span>}
                                  </td>
                                  <td className="py-2 px-3">
                                    {p.situacaoPcEex
                                      ? <span className={`badge ${isAdimplEex ? 'badge-good' : 'badge-attn'}`}>{p.situacaoPcEex}</span>
                                      : <span className="text-muted-foreground text-xs">—</span>}
                                  </td>
                                  <td className="py-2 px-3 text-xs text-right font-mono font-bold text-emerald-700">
                                    {p.valorConcessao ? brl(p.valorConcessao) : '—'}
                                  </td>
                                  <td className="py-2 px-3 text-xs">
                                    {hasSusp ? <span className="badge badge-critical">Sim</span> : <span className="text-muted-foreground">—</span>}
                                  </td>
                                  <td className="py-2 px-3 text-xs">
                                    {hasMedExc ? <span className="badge badge-attn">{p.medidaExcecao}</span> : <span className="text-muted-foreground">—</span>}
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
                              ? 'SIGPC indisponível na API aberta do FNDE'
                              : 'Nenhuma prestação de contas encontrada no SIGPC para este ano'}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {sigpcData?.fonte === 'indisponivel'
                              ? 'O serviço OLINDA do FNDE está com instabilidade na consulta de Prestação de Contas (erro interno no banco de dados do FNDE). Os dados ficam disponíveis automaticamente quando o FNDE restaurar o serviço.'
                              : `Não foram localizados registros para o CNPJ ${pddeCnpj || 'da UEx'} no SIGPC em ${pddeAno}. Tente outro ano ou consulte diretamente pelo site.`}
                          </p>
                          <a
                            href={sigpcData?.sigpcUrl || "https://www.fnde.gov.br/sigpcadm/sistema.pu?operation=localizar"}
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

      {/* ── Modal flutuante: detalhes do estado clicado ── */}
      {clickedUf && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setClickedUf(null)}
        >
          {/* backdrop */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }} />

          {/* card */}
          <div
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              padding: "28px 28px 24px",
              width: "min(420px, 92vw)",
              maxHeight: "85vh",
              overflowY: "auto",
              animation: "uf-pop .18s cubic-bezier(.34,1.56,.64,1)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <style>{`@keyframes uf-pop { from { opacity:0; transform:scale(.85) translateY(24px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>

            {/* cabeçalho */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPin style={{ width: 18, height: 18, color: "#3b82f6", flexShrink: 0 }} />
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>{UF_NAMES[clickedUf] || clickedUf}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, background: "#dbeafe", color: "#1d4ed8", borderRadius: 99, padding: "2px 10px" }}>{clickedUf}</span>
                </div>
                {evolucaoData?.escola?.sg_uf === clickedUf && (
                  <span style={{ display: "inline-block", marginTop: 6, fontSize: 12, background: "#fef3c7", color: "#92400e", borderRadius: 99, padding: "2px 10px", fontWeight: 600 }}>⭐ Estado da sua escola</span>
                )}
              </div>
              <button
                onClick={() => setClickedUf(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: 99, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginLeft: 8 }}
              >
                <X style={{ width: 16, height: 16, color: "#64748b" }} />
              </button>
            </div>

            {ufStatsLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 14, padding: "16px 0" }}>
                <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
                Carregando dados do estado...
              </div>
            ) : ufStatsData ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Números principais */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "#eff6ff", borderRadius: 14, padding: "14px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#1d4ed8" }}>{ufStatsData.total_escolas?.toLocaleString("pt-BR")}</div>
                    <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 2 }}>🏫 escolas</div>
                  </div>
                  <div style={{ background: "#ecfdf5", borderRadius: 14, padding: "14px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#065f46" }}>{ufStatsData.total_matriculas?.toLocaleString("pt-BR")}</div>
                    <div style={{ fontSize: 12, color: "#059669", marginTop: 2 }}>👩‍🎓 matrículas</div>
                  </div>
                </div>

                {/* Por rede */}
                {ufStatsData.por_dependencia && Object.keys(ufStatsData.por_dependencia).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Por rede</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {Object.entries(ufStatsData.por_dependencia as Record<string, number>)
                        .sort(([,a],[,b]) => b - a)
                        .map(([dep, n]) => {
                          const total = ufStatsData.total_escolas || 1;
                          const pct = Math.round((n / total) * 100);
                          const colors: Record<string, string> = { Municipal: "#3b82f6", Estadual: "#8b5cf6", Federal: "#f59e0b", Privada: "#10b981" };
                          const color = colors[dep] || "#6b7280";
                          return (
                            <div key={dep}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                                <span style={{ color: "#334155" }}>{dep}</span>
                                <span style={{ fontWeight: 600, color }}>{(n as number).toLocaleString("pt-BR")} <span style={{ fontWeight: 400, color: "#94a3b8" }}>({pct}%)</span></span>
                              </div>
                              <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                                <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 99, transition: "width .4s" }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Rural vs Urbana */}
                {ufStatsData.por_localizacao && (
                  <div style={{ display: "flex", gap: 10 }}>
                    {Object.entries(ufStatsData.por_localizacao as Record<string, number>).map(([loc, n]) => (
                      <div key={loc} style={{ flex: 1, borderRadius: 14, padding: "10px 8px", textAlign: "center", background: loc === "Rural" ? "#f0fdf4" : "#f0f9ff" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: loc === "Rural" ? "#16a34a" : "#0284c7" }}>{(n as number).toLocaleString("pt-BR")}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{loc === "Rural" ? "🌿" : "🏙️"} {loc}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Top municípios */}
                {ufStatsData.top_municipios?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Municípios com mais escolas</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {ufStatsData.top_municipios.slice(0, 5).map((m: any, i: number) => (
                        <div key={m.municipio} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 4 ? "1px solid #f1f5f9" : "none" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                            <span style={{ color: "#94a3b8", fontWeight: 700, fontSize: 12, minWidth: 18, textAlign: "right" }}>{i + 1}.</span>
                            <span style={{ color: "#1e293b", fontWeight: 500 }}>{m.municipio}</span>
                          </span>
                          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{m.escolas.toLocaleString("pt-BR")} escolas</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observações do Censo 2024→2025 */}
                {censoInsightsUFLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#94a3b8", padding: "12px 0" }}>
                    <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> Carregando observações do Censo...
                  </div>
                )}
                {!censoInsightsUFLoading && censoInsightsUF?.campos?.length > 0 && (() => {
                  const destaques = censoInsightsUF.campos
                    .filter((c: any) => c.diff_pp !== 0 && c.pct_2025 > 0)
                    .sort((a: any, b: any) => Math.abs(b.diff_pp) - Math.abs(a.diff_pp))
                    .slice(0, 5);
                  if (!destaques.length) return null;
                  return (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                        📊 Censo Escolar — mudanças 2024→2025
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                        {destaques.map((cam: any) => {
                          const ganhou = cam.diff_pp > 0;
                          const abs = Math.abs(cam.diff_pp);
                          return (
                            <div key={cam.key} style={{ background: ganhou ? "#f0fdf4" : "#fff5f5", borderRadius: 12, padding: "10px 12px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{cam.label}</span>
                                <span style={{ fontSize: 13, fontWeight: 800, color: ganhou ? "#16a34a" : "#dc2626", flexShrink: 0, marginLeft: 8 }}>
                                  {ganhou ? "▲" : "▼"} {abs.toFixed(1)} p.p.
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                                {cam.pct_2024}% em 2024 → <strong style={{ color: "#334155" }}>{cam.pct_2025}%</strong> em 2025
                                {ganhou
                                  ? <span style={{ color: "#16a34a", marginLeft: 6 }}>+{Math.round((cam.total_2025 - cam.total_2024))} escolas</span>
                                  : <span style={{ color: "#dc2626", marginLeft: 6 }}>{Math.round(cam.total_2025 - cam.total_2024)} escolas</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              </div>
            ) : (
              <p style={{ fontSize: 14, color: "#94a3b8", padding: "16px 0" }}>Sem dados disponíveis para {clickedUf}.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Modal flutuante: escolas similares ── */}
      {similarMode && (() => {
        const todasEscolas = (similarData?.escolas || []);

        const grupos = [
          { label: "Na mesma cidade", cor: "#0d9488", bg: "#f0fdfa", test: (d: number) => d === 0 },
          { label: "Próximas · até 50 km", cor: "#2563eb", bg: "#eff6ff", test: (d: number) => d > 0 && d <= 50 },
          { label: "Na região · até 200 km", cor: "#7c3aed", bg: "#f5f3ff", test: (d: number) => d > 50 && d <= 200 },
          { label: "No estado · acima de 200 km", cor: "#64748b", bg: "#f8fafc", test: (d: number) => d > 200 || d == null },
        ];

        return (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => { setSimilarMode(false); setSimilarClickedUf(null); }}
          >
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }} />
            <div
              style={{
                position: "relative", background: "#fff", borderRadius: 20,
                boxShadow: "0 20px 60px rgba(0,0,0,0.25)", padding: "24px 24px 0",
                width: "min(600px, 96vw)", maxHeight: "90vh", display: "flex", flexDirection: "column",
                animation: "uf-pop .18s cubic-bezier(.34,1.56,.64,1)",
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Cabeçalho */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f766e" }}>🔍 Escolas com perfil similar</div>
                  {similarData && (
                    <div style={{ margin: "6px 0 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, background: "#f0fdf4", color: "#15803d", borderRadius: 99, padding: "2px 10px", fontWeight: 600 }}>
                        {similarData.total} escolas encontradas
                      </span>
                      <span style={{ fontSize: 12, background: "#eff6ff", color: "#1d4ed8", borderRadius: 99, padding: "2px 10px" }}>
                        🏢 {similarData.escola_base?.dependencia}
                      </span>
                      <span style={{ fontSize: 12, background: "#fef9c3", color: "#854d0e", borderRadius: 99, padding: "2px 10px" }}>
                        {similarData.escola_base?.localizacao === "Rural" ? "🌿 Rural" : "🏙️ Urbana"}
                      </span>
                      {similarData.escola_base?.modalidades && (
                        <span style={{ fontSize: 12, background: "#fdf4ff", color: "#7e22ce", borderRadius: 99, padding: "2px 10px" }}>
                          📚 {similarData.escola_base.modalidades}
                        </span>
                      )}
                      {similarData.escola_base?.icg_nivel != null && (
                        <span style={{ fontSize: 12, background: "#fff7ed", color: "#c2410c", borderRadius: 99, padding: "2px 10px" }}>
                          ICG Nível {similarData.escola_base.icg_nivel}
                        </span>
                      )}
                      <span style={{ fontSize: 11, background: similarData.distancia_tipo === "rodoviária" ? "#ecfdf5" : "#f1f5f9", color: similarData.distancia_tipo === "rodoviária" ? "#065f46" : "#475569", borderRadius: 99, padding: "2px 10px" }}>
                        {similarData.distancia_tipo === "rodoviária" ? "🛣️ km por estrada" : "📐 km em linha reta"}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setSimilarMode(false); setSimilarClickedUf(null); }}
                  style={{ background: "#f1f5f9", border: "none", borderRadius: 99, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginLeft: 8 }}
                >
                  <X style={{ width: 16, height: 16, color: "#64748b" }} />
                </button>
              </div>

              {similarLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 14, padding: "32px 0", justifyContent: "center" }}>
                  <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
                  Buscando escolas similares…
                </div>
              ) : similarData ? (
                <>
                  {/* Lista agrupada por proximidade */}
                  <div style={{ overflowY: "auto", flex: 1, paddingBottom: 24 }}>
                    {todasEscolas.length === 0 ? (
                      <p style={{ color: "#94a3b8", fontSize: 14, padding: "16px 0" }}>Nenhuma escola encontrada com perfil similar no mesmo estado.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {grupos.map(grupo => {
                          const escolas = todasEscolas
                            .filter((e: any) => grupo.test(e.distancia_km ?? 9999))
                            .sort((a: any, b: any) => (a.distancia_km ?? 9999) - (b.distancia_km ?? 9999));
                          if (escolas.length === 0) return null;
                          return (
                            <div key={grupo.label}>
                              {/* Cabeçalho do grupo */}
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                <div style={{ height: 2, flex: 1, background: grupo.cor, opacity: 0.25, borderRadius: 99 }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: grupo.cor, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                                  {grupo.label} · {escolas.length} escola{escolas.length > 1 ? "s" : ""}
                                </span>
                                <div style={{ height: 2, flex: 1, background: grupo.cor, opacity: 0.25, borderRadius: 99 }} />
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {escolas.map((escola: any) => (
                                  <div key={escola.inep} style={{ background: grupo.bg, borderRadius: 14, padding: "12px 14px", border: `1px solid ${grupo.cor}22` }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                                      <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", lineHeight: 1.4, flex: 1 }}>{escola.nome}</div>
                                      <button
                                        onClick={() => {
                                          setSimilarMode(false);
                                          setSimilarClickedUf(null);
                                          selectSchool(escola.inep, escola.nome);
                                        }}
                                        style={{ fontSize: 11, padding: "3px 10px", background: grupo.cor, color: "#fff", border: "none", borderRadius: 99, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                                      >
                                        Ver ficha →
                                      </button>
                                    </div>
                                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
                                      <span style={{ fontSize: 12, background: "#fff", color: "#374151", borderRadius: 99, padding: "2px 8px", border: "1px solid #e5e7eb" }}>
                                        📍 {escola.municipio}/{escola.uf}
                                      </span>
                                      {escola.distancia_km != null && (
                                        <span style={{ fontSize: 12, background: grupo.cor, color: "#fff", borderRadius: 99, padding: "2px 8px", fontWeight: 600 }}>
                                          {escola.distancia_km === 0 ? "Mesma cidade" : `≈ ${escola.distancia_km} km`}
                                        </span>
                                      )}
                                      <span style={{ fontSize: 12, background: "#fef3c7", color: "#92400e", borderRadius: 99, padding: "2px 8px" }}>
                                        👩‍🎓 {escola.matriculas?.toLocaleString("pt-BR") || "—"} alunos
                                      </span>
                                      {escola.icg_nivel != null && (
                                        <span style={{ fontSize: 11, background: "#fff7ed", color: "#c2410c", borderRadius: 99, padding: "2px 8px" }}>ICG {escola.icg_nivel}</span>
                                      )}
                                      {escola.modalidades?.map((m: string) => (
                                        <span key={m} style={{ fontSize: 11, background: "#f1f5f9", color: "#64748b", borderRadius: 99, padding: "2px 8px" }}>{m}</span>
                                      ))}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                                      {escola.ds_endereco && (
                                        <div>📬 {escola.ds_endereco}{escola.no_bairro ? `, ${escola.no_bairro}` : ""}{escola.co_cep ? ` · CEP ${escola.co_cep}` : ""}</div>
                                      )}
                                      {escola.telefone ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                                          <span>📞 {escola.telefone}</span>
                                          <button
                                            onClick={() => navigator.clipboard.writeText(escola.telefone)}
                                            style={{ fontSize: 11, padding: "2px 8px", background: "#0d9488", color: "#fff", border: "none", borderRadius: 99, cursor: "pointer" }}
                                          >
                                            copiar
                                          </button>
                                        </div>
                                      ) : (
                                        <div style={{ color: "#94a3b8", marginTop: 2, fontSize: 11 }}>📞 Telefone não disponível no Censo</div>
                                      )}
                                      <div style={{ color: "#cbd5e1", fontSize: 11, marginTop: 2 }}>INEP: {escola.inep}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        );
      })()}

        </div>{/* fim card grandão */}
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
