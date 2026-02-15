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
  Globe, Building2, TreePine, Filter, X, Clock
} from "lucide-react";
import { useSchoolSearch, useSchool, useEscolaEvolucao, useEstatisticas, useListaEscolas } from "@/hooks/use-schools";
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
  const [selectedAno, setSelectedAno] = useState(2024);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"overview" | "search" | "detail">("overview");
  const [filterUf, setFilterUf] = useState("");
  const [filterDep, setFilterDep] = useState("");
  const [listPage, setListPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = useEstatisticas(selectedAno);
  const { data: searchResults, refetch: refetchSearch, isLoading: searchLoading } = useSchoolSearch(searchQuery);
  const { data: evolucaoData, isLoading: evolucaoLoading } = useEscolaEvolucao(selectedInep || "");

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
    setActiveTab("detail");
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
    return evolucaoData.indicadores_por_ano?.[latestAno] || {};
  }, [evolucaoData, latestAno]);

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
            ...(selectedInep ? [{ key: "detail" as const, label: "Detalhe da Escola", icon: School }] : []),
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
                    icon={<Users className="w-6 h-6 text-blue-600" />}
                    value={formatNumber(stats.total_matriculas)}
                    label="Matrículas"
                    color="bg-blue-600/10"
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
                      onChange={(e) => setSearchQuery(e.target.value)}
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
                    {searchResults && searchResults.dados && searchResults.dados.length > 0 && (
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

            <Card className="card-clay">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <School className="w-4 h-4 text-accent" />
                  {listaEscolas ? `${formatNumber(listaEscolas.total)} escolas encontradas` : "Escolas"}
                  {filterUf && <Badge variant="outline" className="text-xs">{filterUf}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {listaLoading ? (
                  <div className="py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" />
                  </div>
                ) : listaEscolas?.dados?.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/30">
                            <th className="text-left py-2 px-2 text-muted-foreground font-medium">INEP</th>
                            <th className="text-left py-2 px-2 text-muted-foreground font-medium">Escola</th>
                            <th className="text-left py-2 px-2 text-muted-foreground font-medium hidden md:table-cell">Município</th>
                            <th className="text-left py-2 px-2 text-muted-foreground font-medium hidden sm:table-cell">UF</th>
                            <th className="text-left py-2 px-2 text-muted-foreground font-medium hidden lg:table-cell">Rede</th>
                            <th className="text-right py-2 px-2 text-muted-foreground font-medium">Matrículas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {listaEscolas.dados.map((escola: any) => (
                            <tr
                              key={escola.co_entidade}
                              className="border-b border-border/10 hover:bg-accent/5 cursor-pointer transition-colors"
                              onClick={() => selectSchool(String(escola.co_entidade))}
                            >
                              <td className="py-2.5 px-2 font-mono text-xs text-muted-foreground">{escola.co_entidade}</td>
                              <td className="py-2.5 px-2 font-medium text-foreground max-w-[200px] truncate">{escola.no_entidade}</td>
                              <td className="py-2.5 px-2 text-muted-foreground hidden md:table-cell">{escola.no_municipio}</td>
                              <td className="py-2.5 px-2 hidden sm:table-cell">{escola.sg_uf}</td>
                              <td className="py-2.5 px-2 hidden lg:table-cell">
                                <Badge variant="outline" className="text-xs">{escola.ds_dependencia}</Badge>
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono">{formatNumber(escola.qt_matriculas || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {listaEscolas.total_paginas > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
                        <p className="text-xs text-muted-foreground">
                          Página {listaEscolas.pagina} de {formatNumber(listaEscolas.total_paginas)}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={listPage <= 1}
                            onClick={() => setListPage(p => Math.max(1, p - 1))}
                          >
                            <ArrowLeft className="w-4 h-4 mr-1" /> Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={listPage >= listaEscolas.total_paginas}
                            onClick={() => setListPage(p => p + 1)}
                          >
                            Próxima <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhuma escola encontrada com esses filtros.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "detail" && selectedInep && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("search")}
              className="text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar à lista
            </Button>

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
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-foreground">{evolucaoData.escola.no_entidade}</h2>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {evolucaoData.escola.no_municipio}/{evolucaoData.escola.sg_uf}
                        </p>
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    icon={<Users className="w-5 h-5 text-accent" />}
                    value={formatNumber(censoLatest.qt_mat_bas || 0)}
                    label={`Matrículas (${latestAno})`}
                    color="bg-accent/10"
                  />
                  <StatCard
                    icon={<GraduationCap className="w-5 h-5 text-blue-600" />}
                    value={formatNumber(censoLatest.qt_doc_bas || censoLatest.qt_docentes || 0)}
                    label={`Docentes (${latestAno})`}
                    color="bg-blue-600/10"
                  />
                  <StatCard
                    icon={<BookOpen className="w-5 h-5 text-purple-600" />}
                    value={formatNumber(censoLatest.qt_tur_bas || censoLatest.qt_turmas || 0)}
                    label={`Turmas (${latestAno})`}
                    color="bg-purple-600/10"
                  />
                  <StatCard
                    icon={<School className="w-5 h-5 text-orange-600" />}
                    value={formatNumber(censoLatest.qt_salas_utilizadas || 0)}
                    label={`Salas (${latestAno})`}
                    color="bg-orange-600/10"
                  />
                </div>

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
                                icon={<GraduationCap className="w-4 h-4 text-blue-600" />}
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
                              icon={<GraduationCap className="w-4 h-4 text-blue-600" />}
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
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {(indicadoresLatest.icg || indicadoresLatest.tdi || indicadoresLatest.ird || indicadoresLatest.taxas_rendimento || indicadoresLatest.atu || indicadoresLatest.had || indicadoresLatest.dsu || indicadoresLatest.ideb || indicadoresLatest.inse) && (
                  <Card className="card-clay border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        Indicadores Educacionais ({latestAno})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {indicadoresLatest.ideb && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-600" /> IDEB
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            <InfoItem label="IDEB" value={indicadoresLatest.ideb.ideb} highlight />
                            <InfoItem label="Meta" value={indicadoresLatest.ideb.projecao || indicadoresLatest.ideb.meta} />
                            <InfoItem label="Nota SAEB Mat." value={indicadoresLatest.ideb.nota_saeb_mat || indicadoresLatest.ideb.nota_mat} />
                            <InfoItem label="Nota SAEB Port." value={indicadoresLatest.ideb.nota_saeb_lp || indicadoresLatest.ideb.nota_lp} />
                            <InfoItem label="Rendimento" value={indicadoresLatest.ideb.indicador_rendimento} />
                          </div>
                        </div>
                      )}

                      {indicadoresLatest.icg && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                            <BarChart3 className="w-3.5 h-3.5 text-blue-600" /> ICG - Complexidade de Gestão
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <InfoItem label="Nível" value={indicadoresLatest.icg.nivel_texto || indicadoresLatest.icg.nivel} highlight />
                            <InfoItem label="Valor" value={indicadoresLatest.icg.valor} />
                          </div>
                        </div>
                      )}

                      {indicadoresLatest.inse && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-purple-600" /> INSE - Nível Socioeconômico
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <InfoItem label="Classificação" value={indicadoresLatest.inse.classificacao || indicadoresLatest.inse.nivel} highlight />
                            <InfoItem label="Valor INSE" value={indicadoresLatest.inse.media_inse || indicadoresLatest.inse.valor} />
                          </div>
                        </div>
                      )}

                      {indicadoresLatest.tdi && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                            <BarChart3 className="w-3.5 h-3.5 text-orange-600" /> TDI - Distorção Idade-Série
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <IndicatorRows data={indicadoresLatest.tdi} />
                          </div>
                        </div>
                      )}

                      {indicadoresLatest.ird && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                            <BarChart3 className="w-3.5 h-3.5 text-teal-600" /> IRD - Regularidade do Docente
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <IndicatorRows data={indicadoresLatest.ird} />
                          </div>
                        </div>
                      )}

                      {indicadoresLatest.taxas_rendimento && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-green-600" /> Taxas de Rendimento
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <IndicatorRows data={indicadoresLatest.taxas_rendimento} />
                          </div>
                        </div>
                      )}

                      {indicadoresLatest.atu && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-indigo-600" /> ATU - Média de Alunos por Turma
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <InfoItem label="Fundamental Total" value={indicadoresLatest.atu.media_fund} />
                            <InfoItem label="Fund. Anos Iniciais" value={indicadoresLatest.atu.media_fund_ai} />
                            <InfoItem label="Fund. Anos Finais" value={indicadoresLatest.atu.media_fund_af} />
                            <InfoItem label="Ensino Médio" value={indicadoresLatest.atu.media_med} />
                          </div>
                        </div>
                      )}

                      {indicadoresLatest.had && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-cyan-600" /> HAD - Horas-Aula Diária
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <InfoItem label="Fundamental Total" value={indicadoresLatest.had.media_fund} />
                            <InfoItem label="Fund. Anos Iniciais" value={indicadoresLatest.had.media_fund_ai} />
                            <InfoItem label="Fund. Anos Finais" value={indicadoresLatest.had.media_fund_af} />
                            <InfoItem label="Ensino Médio" value={indicadoresLatest.had.media_med} />
                          </div>
                        </div>
                      )}

                      {indicadoresLatest.dsu && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" /> DSU - Docentes com Curso Superior
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <InfoItem label="Fundamental Total" value={indicadoresLatest.dsu.percentual_fund != null ? `${indicadoresLatest.dsu.percentual_fund}%` : null} />
                            <InfoItem label="Fund. Anos Iniciais" value={indicadoresLatest.dsu.percentual_fund_ai != null ? `${indicadoresLatest.dsu.percentual_fund_ai}%` : null} />
                            <InfoItem label="Fund. Anos Finais" value={indicadoresLatest.dsu.percentual_fund_af != null ? `${indicadoresLatest.dsu.percentual_fund_af}%` : null} />
                            <InfoItem label="Ensino Médio" value={indicadoresLatest.dsu.percentual_med != null ? `${indicadoresLatest.dsu.percentual_med}%` : null} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

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
                    <InfoItem label="Ed. Especial (inclusão)" value={censoLatest.qt_mat_esp_cc} />
                    <InfoItem label="Ed. Especial (exclusiva)" value={censoLatest.qt_mat_esp_ce} />
                  </div>
                </IndicatorSection>

                <IndicatorSection
                  title="Perfil dos Alunos"
                  icon={<Users className="w-5 h-5 text-blue-600" />}
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
                  icon={<Info className="w-5 h-5 text-blue-600" />}
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
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveTab("search")}>
                    Voltar à busca
                  </Button>
                </CardContent>
              </Card>
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
    <Card className="card-clay p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold truncate">{value}</p>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
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
    <div className="p-3 rounded-xl bg-muted/30">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`font-medium ${highlight ? 'text-accent font-bold text-lg' : ''}`}>{displayValue}</p>
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
