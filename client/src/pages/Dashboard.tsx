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
  Globe, Building2, TreePine, Filter, X
} from "lucide-react";
import { useSchoolSearch, useSchool, useEscolaCompleta, useEstatisticas, useListaEscolas } from "@/hooks/use-schools";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
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
  const { data: escolaCompleta, isLoading: completaLoading } = useEscolaCompleta(selectedInep || "", selectedAno);

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

  const censoData = escolaCompleta?.censo_escolar || null;
  const allIndicators = escolaCompleta || {};

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

            {completaLoading ? (
              <Card className="card-clay">
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-3" />
                  <p className="text-muted-foreground">Carregando dados da escola...</p>
                </CardContent>
              </Card>
            ) : censoData ? (
              <>
                <Card className="card-clay border-l-4 border-l-accent">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-foreground">{censoData.no_entidade}</h2>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {censoData.no_municipio}/{censoData.sg_uf}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-accent/10 text-accent border-0 font-mono">{selectedInep}</Badge>
                        <Badge variant="outline">{censoData.ds_dependencia || censoData.tp_dependencia_texto}</Badge>
                        <Badge variant="outline">{censoData.ds_localizacao || censoData.tp_localizacao_texto}</Badge>
                        <Badge variant="outline">{censoData.ds_situacao || censoData.tp_situacao_texto}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    icon={<Users className="w-5 h-5 text-accent" />}
                    value={formatNumber(censoData.qt_mat_bas || 0)}
                    label="Matrículas"
                    color="bg-accent/10"
                  />
                  <StatCard
                    icon={<GraduationCap className="w-5 h-5 text-blue-600" />}
                    value={formatNumber(censoData.qt_doc_bas || censoData.qt_docentes || 0)}
                    label="Docentes"
                    color="bg-blue-600/10"
                  />
                  <StatCard
                    icon={<BookOpen className="w-5 h-5 text-purple-600" />}
                    value={formatNumber(censoData.qt_tur_bas || censoData.qt_turmas || 0)}
                    label="Turmas"
                    color="bg-purple-600/10"
                  />
                  <StatCard
                    icon={<School className="w-5 h-5 text-orange-600" />}
                    value={formatNumber(censoData.qt_salas_utilizadas || 0)}
                    label="Salas"
                    color="bg-orange-600/10"
                  />
                </div>

                <IndicatorSection
                  title="Matrículas por Etapa"
                  icon={<BookOpen className="w-5 h-5 text-accent" />}
                  expanded={expandedSections['matriculas'] ?? true}
                  onToggle={() => toggleSection('matriculas')}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <InfoItem label="Ed. Infantil - Creche" value={censoData.qt_mat_inf_cre} />
                    <InfoItem label="Ed. Infantil - Pré-escola" value={censoData.qt_mat_inf_pre} />
                    <InfoItem label="Fund. Anos Iniciais" value={censoData.qt_mat_fund_ai} />
                    <InfoItem label="Fund. 1º ano" value={censoData.qt_mat_fund_ai_1} />
                    <InfoItem label="Fund. 2º ano" value={censoData.qt_mat_fund_ai_2} />
                    <InfoItem label="Fund. 3º ano" value={censoData.qt_mat_fund_ai_3} />
                    <InfoItem label="Fund. 4º ano" value={censoData.qt_mat_fund_ai_4} />
                    <InfoItem label="Fund. 5º ano" value={censoData.qt_mat_fund_ai_5} />
                    <InfoItem label="Fund. Anos Finais" value={censoData.qt_mat_fund_af} />
                    <InfoItem label="Fund. 6º ano" value={censoData.qt_mat_fund_af_6} />
                    <InfoItem label="Fund. 7º ano" value={censoData.qt_mat_fund_af_7} />
                    <InfoItem label="Fund. 8º ano" value={censoData.qt_mat_fund_af_8} />
                    <InfoItem label="Fund. 9º ano" value={censoData.qt_mat_fund_af_9} />
                    <InfoItem label="Ensino Médio" value={censoData.qt_mat_med} />
                    <InfoItem label="Médio 1ª série" value={censoData.qt_mat_med_prop_1} />
                    <InfoItem label="Médio 2ª série" value={censoData.qt_mat_med_prop_2} />
                    <InfoItem label="Médio 3ª série" value={censoData.qt_mat_med_prop_3} />
                    <InfoItem label="Médio 4ª série" value={censoData.qt_mat_med_prop_4} />
                    <InfoItem label="Ed. Profissional" value={censoData.qt_mat_prof} />
                    <InfoItem label="EJA Fund." value={censoData.qt_mat_eja_fund} />
                    <InfoItem label="EJA Médio" value={censoData.qt_mat_eja_med} />
                    <InfoItem label="Ed. Especial (inclusão)" value={censoData.qt_mat_esp_cc} />
                    <InfoItem label="Ed. Especial (exclusiva)" value={censoData.qt_mat_esp_ce} />
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
                        <InfoItem label="Diurno" value={censoData.qt_mat_bas_d} />
                        <InfoItem label="Noturno" value={censoData.qt_mat_bas_n} />
                        <InfoItem label="EAD" value={censoData.qt_mat_bas_ead} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Por Sexo</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="Feminino" value={censoData.qt_mat_bas_fem} />
                        <InfoItem label="Masculino" value={censoData.qt_mat_bas_masc} />
                        <InfoItem label="Não declarado" value={censoData.qt_mat_bas_nd} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Por Cor/Raça</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="Branca" value={censoData.qt_mat_bas_branca} />
                        <InfoItem label="Preta" value={censoData.qt_mat_bas_preta} />
                        <InfoItem label="Parda" value={censoData.qt_mat_bas_parda} />
                        <InfoItem label="Amarela" value={censoData.qt_mat_bas_amarela} />
                        <InfoItem label="Indígena" value={censoData.qt_mat_bas_indigena} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Por Faixa Etária</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="0 a 3 anos" value={censoData.qt_mat_bas_0_3} />
                        <InfoItem label="4 a 5 anos" value={censoData.qt_mat_bas_4_5} />
                        <InfoItem label="6 a 10 anos" value={censoData.qt_mat_bas_6_10} />
                        <InfoItem label="11 a 14 anos" value={censoData.qt_mat_bas_11_14} />
                        <InfoItem label="15 a 17 anos" value={censoData.qt_mat_bas_15_17} />
                        <InfoItem label="18+ anos" value={censoData.qt_mat_bas_18_mais} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Por Zona de Residência</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="Urbana" value={censoData.qt_mat_zr_urb} />
                        <InfoItem label="Rural" value={censoData.qt_mat_zr_rur} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Integral</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="Infantil Integral" value={censoData.qt_mat_inf_int} />
                        <InfoItem label="Fund. AI Integral" value={censoData.qt_mat_fund_ai_int} />
                        <InfoItem label="Fund. AF Integral" value={censoData.qt_mat_fund_af_int} />
                        <InfoItem label="Médio Integral" value={censoData.qt_mat_med_int} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Transporte Escolar</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <InfoItem label="Transporte Público" value={censoData.qt_transp_publico} />
                        <InfoItem label="Resp. Estadual" value={censoData.qt_transp_resp_est} />
                        <InfoItem label="Resp. Municipal" value={censoData.qt_transp_resp_mun} />
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
                    <InfoItem label="Total" value={censoData.qt_doc_bas} highlight />
                    <InfoItem label="Ed. Infantil" value={censoData.qt_doc_inf} />
                    <InfoItem label="Infantil Creche" value={censoData.qt_doc_inf_cre} />
                    <InfoItem label="Infantil Pré" value={censoData.qt_doc_inf_pre} />
                    <InfoItem label="Fundamental" value={censoData.qt_doc_fund} />
                    <InfoItem label="Fund. Anos Iniciais" value={censoData.qt_doc_fund_ai} />
                    <InfoItem label="Fund. Anos Finais" value={censoData.qt_doc_fund_af} />
                    <InfoItem label="Ensino Médio" value={censoData.qt_doc_med} />
                    <InfoItem label="Ed. Profissional" value={censoData.qt_doc_prof} />
                    <InfoItem label="EJA" value={censoData.qt_doc_eja} />
                    <InfoItem label="Ed. Especial" value={censoData.qt_doc_esp} />
                  </div>
                </IndicatorSection>

                <IndicatorSection
                  title="Turmas"
                  icon={<BookOpen className="w-5 h-5 text-teal-600" />}
                  expanded={expandedSections['turmas'] ?? false}
                  onToggle={() => toggleSection('turmas')}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <InfoItem label="Total" value={censoData.qt_tur_bas} highlight />
                    <InfoItem label="Ed. Infantil" value={censoData.qt_tur_inf} />
                    <InfoItem label="Infantil Creche" value={censoData.qt_tur_inf_cre} />
                    <InfoItem label="Infantil Pré" value={censoData.qt_tur_inf_pre} />
                    <InfoItem label="Fundamental" value={censoData.qt_tur_fund} />
                    <InfoItem label="Fund. Anos Iniciais" value={censoData.qt_tur_fund_ai} />
                    <InfoItem label="Fund. Anos Finais" value={censoData.qt_tur_fund_af} />
                    <InfoItem label="Ensino Médio" value={censoData.qt_tur_med} />
                    <InfoItem label="Ed. Profissional" value={censoData.qt_tur_prof} />
                    <InfoItem label="EJA" value={censoData.qt_tur_eja} />
                    <InfoItem label="Ed. Especial" value={censoData.qt_tur_esp} />
                    <InfoItem label="Diurnas" value={censoData.qt_tur_bas_d} />
                    <InfoItem label="Noturnas" value={censoData.qt_tur_bas_n} />
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
                        <InfoItem label="Situação" value={censoData.ds_situacao} />
                        <InfoItem label="Dependência" value={censoData.ds_dependencia} />
                        <InfoItem label="Localização" value={censoData.ds_localizacao} />
                        <InfoItem label="Região" value={censoData.no_regiao} />
                        <InfoItem label="Município" value={censoData.no_municipio} />
                        <InfoItem label="UF" value={censoData.sg_uf} />
                        <InfoItem label="Cód. Município" value={censoData.co_municipio} />
                        <InfoItem label="Regulamentação" value={censoData.tp_regulamentacao === 1 ? "Sim" : censoData.tp_regulamentacao === 2 ? "Sim, em tramitação" : censoData.tp_regulamentacao === 3 ? "Não" : undefined} />
                        <InfraItem label="Prédio Escolar" value={censoData.in_local_func_predio_escolar} />
                        <InfraItem label="Prédio Compartilhado" value={censoData.in_predio_compartilhado} />
                        <InfraItem label="Alimentação" value={censoData.in_alimentacao} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Etapas e Modalidades Oferecidas</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Ed. Infantil" value={censoData.in_inf} />
                        <InfraItem label="Creche" value={censoData.in_inf_cre} />
                        <InfraItem label="Pré-escola" value={censoData.in_inf_pre} />
                        <InfraItem label="Ensino Fund." value={censoData.in_fund} />
                        <InfraItem label="Fund. Anos Iniciais" value={censoData.in_fund_ai} />
                        <InfraItem label="Fund. Anos Finais" value={censoData.in_fund_af} />
                        <InfraItem label="Ensino Médio" value={censoData.in_med} />
                        <InfraItem label="Ed. Profissional" value={censoData.in_prof} />
                        <InfraItem label="EJA" value={censoData.in_eja} />
                        <InfraItem label="EJA Fund." value={censoData.in_eja_fund} />
                        <InfraItem label="EJA Médio" value={censoData.in_eja_med} />
                        <InfraItem label="Ed. Especial" value={censoData.in_esp} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Organização</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Conselho Escolar" value={censoData.in_orgao_conselho_escolar} />
                        <InfraItem label="APM / APP" value={censoData.in_orgao_ass_pais_mestres} />
                        <InfraItem label="Grêmio Estudantil" value={censoData.in_orgao_gremio_estudantil} />
                        <InfraItem label="Redes Sociais" value={censoData.in_redes_sociais} />
                        <InfraItem label="Ed. Ambiental" value={censoData.in_educ_ambiental} />
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
                        <InfraItem label="Água Potável" value={censoData.in_agua_potavel} />
                        <InfraItem label="Rede Pública" value={censoData.in_agua_rede_publica} />
                        <InfraItem label="Poço Artesiano" value={censoData.in_agua_poco_artesiano} />
                        <InfraItem label="Cacimba" value={censoData.in_agua_cacimba} />
                        <InfraItem label="Fonte/Rio" value={censoData.in_agua_fonte_rio} />
                        <InfraItem label="Carro-pipa" value={censoData.in_agua_carro_pipa} />
                        <InfraItem label="Inexistente" value={censoData.in_agua_inexistente} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Energia</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Rede Pública" value={censoData.in_energia_rede_publica} />
                        <InfraItem label="Gerador Fóssil" value={censoData.in_energia_gerador_fossil} />
                        <InfraItem label="Renovável" value={censoData.in_energia_renovavel} />
                        <InfraItem label="Inexistente" value={censoData.in_energia_inexistente} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Esgoto</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Rede Pública" value={censoData.in_esgoto_rede_publica} />
                        <InfraItem label="Fossa Séptica" value={censoData.in_esgoto_fossa_septica} />
                        <InfraItem label="Fossa Comum" value={censoData.in_esgoto_fossa_comum} />
                        <InfraItem label="Inexistente" value={censoData.in_esgoto_inexistente} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Lixo</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Coleta" value={censoData.in_lixo_servico_coleta} />
                        <InfraItem label="Queima" value={censoData.in_lixo_queima} />
                        <InfraItem label="Enterra" value={censoData.in_lixo_enterra} />
                        <InfraItem label="Separação" value={censoData.in_tratamento_lixo_separacao} />
                        <InfraItem label="Reciclagem" value={censoData.in_tratamento_lixo_reciclagem} />
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
                        <InfoItem label="Salas Utilizadas" value={censoData.qt_salas_utilizadas} />
                        <InfoItem label="Salas Dentro" value={censoData.qt_salas_utilizadas_dentro} />
                        <InfoItem label="Salas Fora" value={censoData.qt_salas_utilizadas_fora} />
                        <InfoItem label="Climatizadas" value={censoData.qt_salas_utiliza_climatizadas} />
                        <InfoItem label="Acessíveis" value={censoData.qt_salas_utilizadas_acessiveis} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Espaços</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Biblioteca" value={censoData.in_biblioteca} />
                        <InfraItem label="Sala de Leitura" value={censoData.in_biblioteca_sala_leitura} />
                        <InfraItem label="Lab. Informática" value={censoData.in_laboratorio_informatica} />
                        <InfraItem label="Lab. Ciências" value={censoData.in_laboratorio_ciencias} />
                        <InfraItem label="Lab. Ed. Profissional" value={censoData.in_laboratorio_educ_prof} />
                        <InfraItem label="Quadra Coberta" value={censoData.in_quadra_esportes_coberta} />
                        <InfraItem label="Quadra Descoberta" value={censoData.in_quadra_esportes_descoberta} />
                        <InfraItem label="Cozinha" value={censoData.in_cozinha} />
                        <InfraItem label="Despensa" value={censoData.in_despensa} />
                        <InfraItem label="Refeitório" value={censoData.in_refeitorio} />
                        <InfraItem label="Almoxarifado" value={censoData.in_almoxarifado} />
                        <InfraItem label="Pátio Coberto" value={censoData.in_patio_coberto} />
                        <InfraItem label="Pátio Descoberto" value={censoData.in_patio_descoberto} />
                        <InfraItem label="Parque Infantil" value={censoData.in_parque_infantil} />
                        <InfraItem label="Auditório" value={censoData.in_auditorio} />
                        <InfraItem label="Piscina" value={censoData.in_piscina} />
                        <InfraItem label="Área Verde" value={censoData.in_area_verde} />
                        <InfraItem label="Sala Multiuso" value={censoData.in_sala_multiuso} />
                        <InfraItem label="Sala Diretoria" value={censoData.in_sala_diretoria} />
                        <InfraItem label="Sala Professores" value={censoData.in_sala_professor} />
                        <InfraItem label="Secretaria" value={censoData.in_secretaria} />
                        <InfraItem label="Sala Atend. Especial" value={censoData.in_sala_atendimento_especial} />
                        <InfraItem label="Sala Artes" value={censoData.in_sala_atelie_artes} />
                        <InfraItem label="Sala Música" value={censoData.in_sala_musica_coral} />
                        <InfraItem label="Viveiro" value={censoData.in_viveiro} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Banheiros</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Banheiro" value={censoData.in_banheiro} />
                        <InfraItem label="Banheiro Ed. Infantil" value={censoData.in_banheiro_ei} />
                        <InfraItem label="Banheiro PNE" value={censoData.in_banheiro_pne} />
                        <InfraItem label="Banheiro Funcionários" value={censoData.in_banheiro_funcionarios} />
                        <InfraItem label="Chuveiro" value={censoData.in_banheiro_chuveiro} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Acessibilidade</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Rampas" value={censoData.in_acessibilidade_rampas} />
                        <InfraItem label="Corrimão" value={censoData.in_acessibilidade_corrimao} />
                        <InfraItem label="Elevador" value={censoData.in_acessibilidade_elevador} />
                        <InfraItem label="Pisos Táteis" value={censoData.in_acessibilidade_pisos_tateis} />
                        <InfraItem label="Vão Livre" value={censoData.in_acessibilidade_vao_livre} />
                        <InfraItem label="Sinal Sonoro" value={censoData.in_acessibilidade_sinal_sonoro} />
                        <InfraItem label="Sinal Tátil" value={censoData.in_acessibilidade_sinal_tatil} />
                        <InfraItem label="Sinal Visual" value={censoData.in_acessibilidade_sinal_visual} />
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
                        <InfraItem label="Computador" value={censoData.in_computador} />
                        <InfoItem label="Desktops p/ Alunos" value={censoData.qt_desktop_aluno} />
                        <InfoItem label="Notebooks p/ Alunos" value={censoData.qt_comp_portatil_aluno} />
                        <InfoItem label="Tablets p/ Alunos" value={censoData.qt_tablet_aluno} />
                        <InfoItem label="TVs" value={censoData.qt_equip_tv} />
                        <InfoItem label="Projetores" value={censoData.qt_equip_multimidia} />
                        <InfoItem label="Lousas Digitais" value={censoData.qt_equip_lousa_digital} />
                        <InfoItem label="Equipamentos de Som" value={censoData.qt_equip_som} />
                        <InfraItem label="Impressora" value={censoData.in_equip_impressora} />
                        <InfraItem label="Copiadora" value={censoData.in_equip_copiadora} />
                        <InfraItem label="Scanner" value={censoData.in_equip_scanner} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Internet e Conectividade</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfraItem label="Internet" value={censoData.in_internet} />
                        <InfraItem label="Banda Larga" value={censoData.in_banda_larga} />
                        <InfraItem label="Internet p/ Alunos" value={censoData.in_internet_alunos} />
                        <InfraItem label="Internet Administrativo" value={censoData.in_internet_administrativo} />
                        <InfraItem label="Internet Aprendizagem" value={censoData.in_internet_aprendizagem} />
                        <InfraItem label="Internet Comunidade" value={censoData.in_internet_comunidade} />
                        <InfraItem label="Acesso por Computador" value={censoData.in_acesso_internet_computador} />
                        <InfraItem label="Acesso por Dispositivos" value={censoData.in_aces_internet_disp_pessoais} />
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
                    <InfoItem label="Administrativos" value={censoData.qt_prof_administrativos} />
                    <InfoItem label="Serviços Gerais" value={censoData.qt_prof_servicos_gerais} />
                    <InfoItem label="Bibliotecários" value={censoData.qt_prof_bibliotecario} />
                    <InfoItem label="Saúde" value={censoData.qt_prof_saude} />
                    <InfoItem label="Coordenadores" value={censoData.qt_prof_coordenador} />
                    <InfoItem label="Fonoaudiólogos" value={censoData.qt_prof_fonaudiologo} />
                    <InfoItem label="Nutricionistas" value={censoData.qt_prof_nutricionista} />
                    <InfoItem label="Psicólogos" value={censoData.qt_prof_psicologo} />
                    <InfoItem label="Alimentação" value={censoData.qt_prof_alimentacao} />
                    <InfoItem label="Pedagogia" value={censoData.qt_prof_pedagogia} />
                    <InfoItem label="Secretários" value={censoData.qt_prof_secretario} />
                    <InfoItem label="Segurança" value={censoData.qt_prof_seguranca} />
                    <InfoItem label="Monitores" value={censoData.qt_prof_monitores} />
                    <InfoItem label="Gestão" value={censoData.qt_prof_gestao} />
                    <InfoItem label="Assistentes Sociais" value={censoData.qt_prof_assist_social} />
                    <InfoItem label="Trad. Libras" value={censoData.qt_prof_trad_libras} />
                  </div>
                </IndicatorSection>

                <IndicatorSection
                  title="Materiais Pedagógicos"
                  icon={<BookOpen className="w-5 h-5 text-rose-600" />}
                  expanded={expandedSections['materiais'] ?? false}
                  onToggle={() => toggleSection('materiais')}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <InfraItem label="Multimídia" value={censoData.in_material_ped_multimidia} />
                    <InfraItem label="Infantil" value={censoData.in_material_ped_infantil} />
                    <InfraItem label="Científico" value={censoData.in_material_ped_cientifico} />
                    <InfraItem label="Difusão" value={censoData.in_material_ped_difusao} />
                    <InfraItem label="Musical" value={censoData.in_material_ped_musical} />
                    <InfraItem label="Jogos" value={censoData.in_material_ped_jogos} />
                    <InfraItem label="Artísticas" value={censoData.in_material_ped_artisticas} />
                    <InfraItem label="Profissional" value={censoData.in_material_ped_profissional} />
                    <InfraItem label="Desportiva" value={censoData.in_material_ped_desportiva} />
                    <InfraItem label="Indígena" value={censoData.in_material_ped_indigena} />
                    <InfraItem label="Étnico" value={censoData.in_material_ped_etnico} />
                    <InfraItem label="Quilombola" value={censoData.in_material_ped_quilombola} />
                    <InfraItem label="Ed. Especial" value={censoData.in_material_ped_edu_esp} />
                  </div>
                </IndicatorSection>

                {allIndicators.ideb && (
                  <IndicatorSection
                    title="IDEB"
                    icon={<Award className="w-5 h-5 text-amber-600" />}
                    expanded={expandedSections['ideb'] ?? true}
                    onToggle={() => toggleSection('ideb')}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <InfoItem label="IDEB" value={allIndicators.ideb.ideb} highlight />
                      <InfoItem label="Meta" value={allIndicators.ideb.projecao || allIndicators.ideb.meta} />
                      <InfoItem label="Nota SAEB Mat." value={allIndicators.ideb.nota_saeb_mat || allIndicators.ideb.nota_mat} />
                      <InfoItem label="Nota SAEB Port." value={allIndicators.ideb.nota_saeb_lp || allIndicators.ideb.nota_lp} />
                      <InfoItem label="Rendimento" value={allIndicators.ideb.indicador_rendimento} />
                    </div>
                  </IndicatorSection>
                )}

                {allIndicators.icg && (
                  <IndicatorSection
                    title="ICG - Complexidade de Gestão"
                    icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
                    expanded={expandedSections['icg'] ?? false}
                    onToggle={() => toggleSection('icg')}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <InfoItem label="Nível" value={allIndicators.icg.nivel_texto || allIndicators.icg.nivel} highlight />
                      <InfoItem label="Valor" value={allIndicators.icg.valor} />
                    </div>
                  </IndicatorSection>
                )}

                {allIndicators.inse && (
                  <IndicatorSection
                    title="INSE - Nível Socioeconômico"
                    icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
                    expanded={expandedSections['inse'] ?? false}
                    onToggle={() => toggleSection('inse')}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <InfoItem label="Classificação" value={allIndicators.inse.classificacao || allIndicators.inse.nivel} highlight />
                      <InfoItem label="Valor INSE" value={allIndicators.inse.media_inse || allIndicators.inse.valor} />
                    </div>
                  </IndicatorSection>
                )}

                {allIndicators.tdi && (
                  <IndicatorSection
                    title="TDI - Distorção Idade-Série"
                    icon={<BarChart3 className="w-5 h-5 text-orange-600" />}
                    expanded={expandedSections['tdi'] ?? false}
                    onToggle={() => toggleSection('tdi')}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <IndicatorRows data={allIndicators.tdi} />
                    </div>
                  </IndicatorSection>
                )}

                {allIndicators.ird && (
                  <IndicatorSection
                    title="IRD - Regularidade do Docente"
                    icon={<BarChart3 className="w-5 h-5 text-teal-600" />}
                    expanded={expandedSections['ird'] ?? false}
                    onToggle={() => toggleSection('ird')}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <IndicatorRows data={allIndicators.ird} />
                    </div>
                  </IndicatorSection>
                )}

                {allIndicators.taxas_rendimento && (
                  <IndicatorSection
                    title="Taxas de Rendimento"
                    icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                    expanded={expandedSections['taxas'] ?? false}
                    onToggle={() => toggleSection('taxas')}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <IndicatorRows data={allIndicators.taxas_rendimento} />
                    </div>
                  </IndicatorSection>
                )}

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
                  <p className="text-muted-foreground">Escola não encontrada no censo {selectedAno}.</p>
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
