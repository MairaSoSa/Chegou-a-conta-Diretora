import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, Users, ArrowRight, 
  MapPin,
  GraduationCap, Info, ExternalLink,
  School, Loader2, Link2,
  BarChart3, TrendingUp, BookOpen, Award,
  ChevronDown, ChevronUp
} from "lucide-react";
import { useSchoolSearch, useSchool, useEscolaCompleta } from "@/hooks/use-schools";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LINKS_PROGRAMAS = [
  { nome: 'PDDE Interativo', descricao: 'Onde você faz cadastros e adesões', url: 'https://pddeinterativo.mec.gov.br' },
  { nome: 'Portal FNDE', descricao: 'Tudo sobre as verbas federais', url: 'https://www.fnde.gov.br' },
  { nome: 'Consulta Escola', descricao: 'Dados da sua escola no INEP', url: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/inep-data/consulta-matricula' },
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInep, setSelectedInep] = useState<string | null>(null);
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear());
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  const { data: searchResults, refetch: refetchSearch, isLoading: searchLoading } = useSchoolSearch(searchQuery);
  const { data: school, isLoading: schoolLoading } = useSchool(selectedInep || "");
  const { data: escolaCompleta, isLoading: completaLoading } = useEscolaCompleta(selectedInep || "", selectedAno);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const censoData = escolaCompleta?.censo_escolar;
  const idebData = escolaCompleta?.ideb;
  const icgData = escolaCompleta?.icg;
  const inseData = escolaCompleta?.inse;
  const tdiData = escolaCompleta?.tdi;
  const irdData = escolaCompleta?.ird;
  const taxasData = escolaCompleta?.taxas_rendimento;
  const saebData = escolaCompleta?.saeb;

  const matriculasTotal = censoData?.qt_mat_bas || censoData?.matriculas || school?.enrollmentCount || 0;

  const anosDisponiveis = escolaCompleta?.anos_disponiveis;
  const anos = anosDisponiveis && anosDisponiveis.length > 0
    ? (anosDisponiveis as string[]).map((a) => Number(a)).sort((a, b) => b - a)
    : [2024, 2023, 2022, 2021, 2020];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <Card className="card-clay">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Busque por nome ou código INEP..." 
                  className="pl-10 bg-background border-border/50 focus:border-accent/50 h-12 rounded-xl font-mono"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedInep) setSelectedInep(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (searchQuery.length === 8 && /^\d+$/.test(searchQuery)) {
                        setSelectedInep(searchQuery);
                      } else {
                        refetchSearch();
                      }
                    }
                  }}
                />
                
                {searchResults && searchResults.length > 0 && !selectedInep && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                    {searchResults.map((result: any) => (
                      <button
                        key={result.inep || result.id}
                        className="w-full text-left px-4 py-3 hover:bg-accent/5 border-b border-border/30 last:border-0 transition-colors flex justify-between items-center group"
                        onClick={() => {
                          setSelectedInep(result.inep);
                          setSearchQuery(result.name);
                        }}
                      >
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-accent transition-colors">{result.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{result.inep} - {result.city}/{result.state}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button 
                className="h-12 px-6 rounded-xl"
                disabled={searchLoading || schoolLoading}
                onClick={() => {
                  if (searchQuery.length === 8 && /^\d+$/.test(searchQuery)) {
                    setSelectedInep(searchQuery);
                  } else {
                    refetchSearch();
                  }
                }}
              >
                {searchLoading || schoolLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <School className="w-4 h-4 mr-2" />}
                Buscar Escola
              </Button>
            </div>

            {school && (
              <div className="mt-4 pt-4 border-t border-border/30 flex flex-wrap items-center gap-4 text-sm">
                <Badge className="bg-accent/10 text-accent border-0 font-mono">{school.inep}</Badge>
                <span className="font-semibold">{school.name}</span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {school.city}/{school.state}
                </span>
                
                <Badge variant="outline">{school.network || "—"}</Badge>
                <Badge variant="outline">{school.location || "—"}</Badge>

                <div className="ml-auto flex items-center gap-2">
                  <select
                    value={selectedAno}
                    onChange={(e) => setSelectedAno(Number(e.target.value))}
                    className="text-xs bg-background border border-border/50 rounded-lg px-2 py-1"
                  >
                    {anos.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedInep ? (
          <div className="space-y-6">
            {completaLoading && (
              <Card className="card-clay">
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                  <p className="text-muted-foreground">Carregando dados da API...</p>
                </CardContent>
              </Card>
            )}

            {!escolaCompleta && !completaLoading && (
              <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
                <CardContent className="p-4">
                  <p className="text-amber-800 leading-relaxed">
                    Os dados desta escola ainda estão sendo carregados na API externa. Tente novamente em alguns minutos.
                  </p>
                </CardContent>
              </Card>
            )}

            {censoData && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={<Users className="w-6 h-6 text-primary" />}
                    value={matriculasTotal || '—'}
                    label="Matrículas"
                    color="primary"
                  />
                  <StatCard
                    icon={<GraduationCap className="w-6 h-6 text-accent" />}
                    value={censoData.qt_docentes || '—'}
                    label="Docentes"
                    color="accent"
                  />
                  <StatCard
                    icon={<BookOpen className="w-6 h-6 text-blue-600" />}
                    value={censoData.qt_turmas || '—'}
                    label="Turmas"
                    color="blue"
                  />
                  <StatCard
                    icon={<School className="w-6 h-6 text-orange-600" />}
                    value={censoData.qt_salas || '—'}
                    label="Salas"
                    color="orange"
                  />
                </div>

                <Card className="card-clay">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Matrículas por Etapa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      <InfoItem label="Ed. Infantil" value={censoData.qt_mat_inf} />
                      <InfoItem label="Fundamental" value={censoData.qt_mat_fund_ai} />
                      <InfoItem label="Ensino Médio" value={censoData.qt_mat_med} />
                      <InfoItem label="EJA" value={censoData.qt_mat_eja} />
                      <InfoItem label="Ed. Especial" value={censoData.qt_mat_esp} />
                      <InfoItem label="Profissional" value={censoData.matriculas_por_etapa?.profissional} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-clay">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Info className="w-5 h-5 text-blue-600" />
                      Informações da Escola
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <InfoItem label="Situação" value={censoData.tp_situacao_texto} />
                      <InfoItem label="Dependência" value={censoData.tp_dependencia_texto} />
                      <InfoItem label="Localização" value={censoData.tp_localizacao_texto} />
                      <InfoItem label="Município" value={censoData.no_municipio} />
                      <InfoItem label="UF" value={censoData.sg_uf} />
                      <InfoItem label="Internet" value={censoData.in_internet === 1 ? "Sim" : censoData.in_internet === 0 ? "Não" : undefined} />
                      <InfoItem label="Banda Larga" value={censoData.infraestrutura?.in_banda_larga === 1 ? "Sim" : censoData.infraestrutura?.in_banda_larga === 0 ? "Não" : undefined} />
                      <InfoItem label="Acessibilidade" value={censoData.infraestrutura?.in_acessibilidade === 1 ? "Sim" : censoData.infraestrutura?.in_acessibilidade === 0 ? "Não" : undefined} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-clay">
                  <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('infra')}>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <School className="w-5 h-5 text-green-600" />
                      Infraestrutura
                      <span className="ml-auto">
                        {expandedSections['infra'] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  {expandedSections['infra'] && censoData.infraestrutura && (
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfoItem label="Biblioteca" value={censoData.infraestrutura.in_biblioteca === 1 ? "Sim" : "Não"} />
                        <InfoItem label="Lab. Informática" value={censoData.infraestrutura.in_laboratorio_informatica === 1 ? "Sim" : "Não"} />
                        <InfoItem label="Lab. Ciências" value={censoData.infraestrutura.in_laboratorio_ciencias === 1 ? "Sim" : "Não"} />
                        <InfoItem label="Quadra Esportes" value={censoData.infraestrutura.in_quadra_esportes === 1 ? "Sim" : "Não"} />
                        <InfoItem label="Cozinha" value={censoData.infraestrutura.in_cozinha === 1 ? "Sim" : "Não"} />
                        <InfoItem label="Refeitório" value={censoData.infraestrutura.in_refeitorio === 1 ? "Sim" : "Não"} />
                        <InfoItem label="Pátio Coberto" value={censoData.infraestrutura.in_patio_coberto === 1 ? "Sim" : "Não"} />
                        <InfoItem label="Parque Infantil" value={censoData.infraestrutura.in_parque_infantil === 1 ? "Sim" : "Não"} />
                        <InfoItem label="Auditório" value={censoData.infraestrutura.in_auditorio === 1 ? "Sim" : "Não"} />
                        <InfoItem label="Sala de Leitura" value={censoData.infraestrutura.in_sala_leitura === 1 ? "Sim" : "Não"} />
                        <InfoItem label="Banheiro PNE" value={censoData.infraestrutura.in_banheiro_pne === 1 ? "Sim" : "Não"} />
                        <InfoItem label="Água Potável" value={censoData.infraestrutura.in_agua_potavel === 1 ? "Sim" : "Não"} />
                        <InfoItem label="Energia Rede Pública" value={censoData.infraestrutura.in_energia_rede_publica === 1 ? "Sim" : "Não"} />
                        <InfoItem label="Esgoto Rede Pública" value={censoData.infraestrutura.in_esgoto_rede_publica === 1 ? "Sim" : "Não"} />
                        <InfoItem label="Coleta de Lixo" value={censoData.infraestrutura.in_lixo_servico_coleta === 1 ? "Sim" : "Não"} />
                        <InfoItem label="Internet p/ Aprendizagem" value={censoData.infraestrutura.in_internet_aprendizagem === 1 ? "Sim" : "Não"} />
                      </div>
                    </CardContent>
                  )}
                </Card>

                {censoData.tempo_integral && (
                  <Card className="card-clay">
                    <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('integral')}>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Award className="w-5 h-5 text-purple-600" />
                        Tempo Integral
                        <span className="ml-auto">
                          {expandedSections['integral'] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    {expandedSections['integral'] && (
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <InfoItem label="Total Integral" value={censoData.tempo_integral.qt_mat_total_integral} />
                          <InfoItem label="Fund. Integral" value={censoData.tempo_integral.qt_mat_fundamental_integral} />
                          <InfoItem label="Infantil Integral" value={censoData.tempo_integral.qt_mat_infantil_integral} />
                          <InfoItem label="Médio Integral" value={censoData.tempo_integral.qt_mat_medio_integral} />
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )}
              </>
            )}

            {idebData && (
              <IndicatorSection
                title="IDEB"
                icon={<Award className="w-5 h-5 text-amber-600" />}
                expanded={expandedSections['ideb'] ?? true}
                onToggle={() => toggleSection('ideb')}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <InfoItem label="IDEB" value={idebData.ideb} highlight />
                  <InfoItem label="Meta" value={idebData.projecao || idebData.meta} />
                  <InfoItem label="Nota SAEB Matemática" value={idebData.nota_saeb_mat || idebData.nota_mat} />
                  <InfoItem label="Nota SAEB Português" value={idebData.nota_saeb_lp || idebData.nota_lp} />
                  <InfoItem label="Indicador Rendimento" value={idebData.indicador_rendimento} />
                  <InfoItem label="Etapa" value={idebData.etapa} />
                  <InfoItem label="Ano" value={idebData.ano} />
                </div>
              </IndicatorSection>
            )}

            {inseData && (
              <IndicatorSection
                title="INSE - Nível Socioeconômico"
                icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
                expanded={expandedSections['inse'] ?? true}
                onToggle={() => toggleSection('inse')}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <InfoItem label="Classificação" value={inseData.classificacao || inseData.nivel || inseData.inse_classificacao} highlight />
                  <InfoItem label="Valor INSE" value={inseData.media_inse || inseData.valor || inseData.inse_valor} />
                  <InfoItem label="Ano" value={inseData.ano} />
                </div>
              </IndicatorSection>
            )}

            {icgData && (
              <IndicatorSection
                title="ICG - Complexidade de Gestão"
                icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
                expanded={expandedSections['icg'] ?? true}
                onToggle={() => toggleSection('icg')}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <InfoItem label="Nível" value={icgData.nivel_texto || icgData.nivel || icgData.icg_nivel} highlight />
                  <InfoItem label="Valor" value={icgData.valor || icgData.icg_valor} />
                  <InfoItem label="Ano" value={icgData.ano} />
                </div>
              </IndicatorSection>
            )}

            {tdiData && (
              <IndicatorSection
                title="TDI - Distorção Idade-Série"
                icon={<BarChart3 className="w-5 h-5 text-orange-600" />}
                expanded={expandedSections['tdi'] ?? false}
                onToggle={() => toggleSection('tdi')}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <IndicatorRows data={tdiData} />
                </div>
              </IndicatorSection>
            )}

            {irdData && (
              <IndicatorSection
                title="IRD - Regularidade do Docente"
                icon={<BarChart3 className="w-5 h-5 text-teal-600" />}
                expanded={expandedSections['ird'] ?? false}
                onToggle={() => toggleSection('ird')}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <IndicatorRows data={irdData} />
                </div>
              </IndicatorSection>
            )}

            {taxasData && (
              <IndicatorSection
                title="Taxas de Rendimento"
                icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                expanded={expandedSections['taxas'] ?? false}
                onToggle={() => toggleSection('taxas')}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <IndicatorRows data={taxasData} />
                </div>
              </IndicatorSection>
            )}

            {saebData && (
              <IndicatorSection
                title="SAEB"
                icon={<Award className="w-5 h-5 text-indigo-600" />}
                expanded={expandedSections['saeb'] ?? false}
                onToggle={() => toggleSection('saeb')}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <IndicatorRows data={saebData} />
                </div>
              </IndicatorSection>
            )}

            {escolaCompleta && renderExtraIndicators(escolaCompleta, expandedSections, toggleSection)}

            <Card className="card-clay">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary" />
                  Links Úteis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LINKS_PROGRAMAS.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-primary/20 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <ExternalLink className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">{link.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">{link.descricao}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-foreground">Busque sua escola</h2>
              <p className="text-muted-foreground mt-2">
                Digite o nome ou código INEP de 8 dígitos acima para visualizar os dados.
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: any; label: string; color: string }) {
  return (
    <Card className="card-clay p-5">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl bg-${color}/10 flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm font-medium text-foreground">{label}</p>
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
                .filter(([k]) => !['co_entidade', 'co_municipio', 'no_entidade'].includes(k))
                .map(([key, val]) => (
                  <InfoItem key={key} label={formatLabel(key)} value={val as any} />
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
        .filter(([k]) => !['co_entidade', 'co_municipio', 'no_entidade'].includes(k))
        .map(([key, val]) => (
          <InfoItem key={key} label={formatLabel(key)} value={val as any} />
        ))}
    </>
  );
}

function renderExtraIndicators(escolaCompleta: any, expandedSections: Record<string, boolean>, toggleSection: (k: string) => void) {
  const extras = [
    { key: 'dsu', title: 'DSU - Docentes com Superior', color: 'cyan-600' },
    { key: 'had', title: 'HAD - Horas-aula Diárias', color: 'pink-600' },
    { key: 'atu', title: 'ATU - Alunos por Turma', color: 'lime-600' },
    { key: 'ied', title: 'IED - Esforço Docente', color: 'violet-600' },
    { key: 'afd', title: 'AFD - Formação Docente', color: 'rose-600' },
    { key: 'taxa_nao_resposta', title: 'Taxa de Não-Resposta', color: 'slate-600' },
  ];

  return extras
    .filter(e => escolaCompleta[e.key])
    .map(e => (
      <IndicatorSection
        key={e.key}
        title={e.title}
        icon={<BarChart3 className={`w-5 h-5 text-${e.color}`} />}
        expanded={expandedSections[e.key] ?? false}
        onToggle={() => toggleSection(e.key)}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <IndicatorRows data={escolaCompleta[e.key]} />
        </div>
      </IndicatorSection>
    ));
}

function formatLabel(key: string): string {
  const map: Record<string, string> = {
    ano: 'Ano', etapa: 'Etapa', rede: 'Rede',
    ideb: 'IDEB', projecao: 'Meta/Projeção',
    nota_saeb_mat: 'Nota Matemática', nota_saeb_lp: 'Nota Português',
    nota_mat: 'Nota Matemática', nota_lp: 'Nota Português',
    indicador_rendimento: 'Indicador Rendimento',
    nivel: 'Nível', nivel_texto: 'Classificação', valor: 'Valor',
    media_inse: 'Média INSE', classificacao: 'Classificação',
    qt_mat_bas: 'Matrículas Total', qt_mat_inf: 'Ed. Infantil',
    qt_mat_fund_ai: 'Fund. Iniciais', qt_mat_fund_af: 'Fund. Finais',
    qt_mat_med: 'Ensino Médio', qt_mat_eja: 'EJA',
    qt_docentes: 'Docentes', qt_turmas: 'Turmas',
    taxa_aprovacao: 'Aprovação', taxa_reprovacao: 'Reprovação',
    taxa_abandono: 'Abandono',
    tp_dependencia_texto: 'Dependência', tp_localizacao_texto: 'Localização',
    no_municipio: 'Município', co_uf: 'UF',
    inse_classificacao: 'Classificação INSE', inse_valor: 'Valor INSE',
    icg_nivel: 'Nível ICG', icg_valor: 'Valor ICG',
  };
  return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function InfoItem({ label, value, mono, highlight }: { label: string; value: string | number | null | undefined; mono?: boolean; highlight?: boolean }) {
  if (value === null || value === undefined || value === '') return null;
  const displayValue = typeof value === 'number' ? (Number.isInteger(value) ? value.toLocaleString('pt-BR') : value.toFixed(2)) : String(value);
  return (
    <div className="p-3 rounded-xl bg-muted/30">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`font-medium ${mono ? 'font-mono' : ''} ${highlight ? 'text-primary font-bold text-lg' : ''}`}>{displayValue}</p>
    </div>
  );
}
