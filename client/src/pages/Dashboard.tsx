import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, AlertCircle, TrendingUp, TrendingDown, DollarSign, Users, ArrowRight, 
  MapPin, Building, CheckCircle2, Calendar, FileText, Banknote, Clock, 
  GraduationCap, BookOpen, BarChart3, AlertTriangle, Info, Download, ExternalLink,
  School, Loader2
} from "lucide-react";
import { useSchoolSearch, useSchool } from "@/hooks/use-schools";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar, LineChart, Line } from "recharts";

// Escola fictícia para demonstração
const DEMO_SCHOOL = {
  id: 0,
  inep: "00000000",
  name: "Escola Municipal Monteiro Lobato",
  city: "Sítio do Picapau Amarelo",
  state: "SP",
  network: "Municipal",
  location: "Urbana",
  enrollmentCount: 342,
  dataStatus: "Completo",
  // Dados expandidos
  etapas: ["Anos Iniciais", "Anos Finais"],
  bairro: "Centro",
};

// Dados de matrículas históricos
const ENROLLMENT_HISTORY = [
  { year: '2020', total: 380, iniciais: 220, finais: 160 },
  { year: '2021', total: 365, iniciais: 210, finais: 155 },
  { year: '2022', total: 358, iniciais: 205, finais: 153 },
  { year: '2023', total: 350, iniciais: 200, finais: 150 },
  { year: '2024', total: 342, iniciais: 195, finais: 147 },
];

// Dados do IDEB
const IDEB_DATA = [
  { year: '2017', escola: 5.2, municipal: 5.0, estadual: 5.4, meta: 5.0 },
  { year: '2019', escola: 5.5, municipal: 5.2, estadual: 5.6, meta: 5.3 },
  { year: '2021', escola: 5.1, municipal: 4.9, estadual: 5.3, meta: 5.5 },
  { year: '2023', escola: 5.7, municipal: 5.3, estadual: 5.8, meta: 5.7 },
];

// Repasses por programa
const REPASSES_DATA = [
  { year: '2020', pdde: 8400, pnae: 28000, pnate: 0, total: 36400 },
  { year: '2021', pdde: 8400, pnae: 29200, pnate: 0, total: 37600 },
  { year: '2022', pdde: 9200, pnae: 30100, pnate: 0, total: 39300 },
  { year: '2023', pdde: 9800, pnae: 31500, pnate: 0, total: 41300 },
  { year: '2024', pdde: 8400, pnae: 16800, pnate: 0, total: 25200 },
];

// Status de prestação de contas
const PRESTACAO_STATUS = [
  { exercicio: '2021', status: 'Aprovada', programa: 'PDDE' },
  { exercicio: '2022', status: 'Aprovada', programa: 'PDDE' },
  { exercicio: '2023', status: 'Em análise', programa: 'PDDE' },
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInep, setSelectedInep] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: searchResults } = useSchoolSearch(searchQuery);
  const { data: school } = useSchool(selectedInep || "");

  const displaySchool = selectedInep && school ? school : (showDemo ? DEMO_SCHOOL : null);

  // Cálculos derivados
  const lastEnrollment = ENROLLMENT_HISTORY[ENROLLMENT_HISTORY.length - 1];
  const prevEnrollment = ENROLLMENT_HISTORY[ENROLLMENT_HISTORY.length - 2];
  const enrollmentVariation = ((lastEnrollment.total - prevEnrollment.total) / prevEnrollment.total * 100).toFixed(1);

  const lastRepasse = REPASSES_DATA[REPASSES_DATA.length - 1];
  const repassePerAluno = (lastRepasse.total / lastEnrollment.total).toFixed(2);

  const lastIdeb = IDEB_DATA[IDEB_DATA.length - 1];
  const ultimoPrestacao = PRESTACAO_STATUS[PRESTACAO_STATUS.length - 1];
  const defasagemCiclos = 2024 - parseInt(ultimoPrestacao.exercicio);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        {/* 1. Cabeçalho com busca */}
        <Card className="card-clay sticky top-20 z-40 bg-card/98 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Digite o código INEP da escola..." 
                  className="pl-10 bg-background border-border/50 focus:border-accent/50 h-12 rounded-xl font-mono"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-inep-search"
                />
                
                {searchResults && searchResults.length > 0 && !selectedInep && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                    {searchResults.map((result: any) => (
                      <button
                        key={result.id}
                        className="w-full text-left px-4 py-3 hover:bg-accent/5 border-b border-border/30 last:border-0 transition-colors flex justify-between items-center group"
                        onClick={() => {
                          setSelectedInep(result.inep);
                          setSearchQuery(result.inep);
                          setShowDemo(false);
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
                disabled={isLoading}
                onClick={() => {
                  if (searchQuery.length === 8) {
                    setSelectedInep(searchQuery);
                    setShowDemo(false);
                  }
                }}
                data-testid="button-load-school"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <School className="w-4 h-4 mr-2" />}
                Carregar Escola
              </Button>
            </div>

            {/* Mini-resumo quando carregado */}
            {displaySchool && (
              <div className="mt-4 pt-4 border-t border-border/30 flex flex-wrap items-center gap-4 text-sm">
                <Badge className="bg-accent/10 text-accent border-0 font-mono">{displaySchool.inep}</Badge>
                <span className="font-semibold">{displaySchool.name}</span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {displaySchool.city}/{displaySchool.state}
                </span>
                <Badge variant="outline">{displaySchool.network}</Badge>
                <Badge variant="outline">{displaySchool.location}</Badge>
                {showDemo && (
                  <Badge className="bg-amber-100 text-amber-700 border-0">Demonstração</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {displaySchool ? (
          <div className="space-y-6">
            {/* Aviso de demonstração */}
            {showDemo && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">Dados de Demonstração</p>
                  <p className="text-sm text-amber-700">Este é um exemplo fictício. Digite um código INEP real para ver dados públicos.</p>
                </div>
              </div>
            )}

            {/* 2. Card Identidade da Escola */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <School className="w-5 h-5 text-accent" />
                  Identidade da Escola
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoItem label="Nome" value={displaySchool.name} />
                  <InfoItem label="Código INEP" value={displaySchool.inep} mono />
                  <InfoItem label="Município/UF" value={`${displaySchool.city}/${displaySchool.state}`} />
                  <InfoItem label="Rede" value={displaySchool.network} />
                  <InfoItem label="Zona" value={displaySchool.location} />
                  <InfoItem label="Etapas Atendidas" value={DEMO_SCHOOL.etapas.join(", ")} />
                  <InfoItem label="Matrículas (2024)" value={displaySchool.enrollmentCount.toString()} highlight />
                  <InfoItem label="Localização" value={DEMO_SCHOOL.bairro} />
                </div>
              </CardContent>
            </Card>

            {/* 3. Card Matrículas e Perfil */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Matrículas e Perfil
                  </CardTitle>
                  <Badge className={parseFloat(enrollmentVariation) < 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}>
                    {parseFloat(enrollmentVariation) > 0 ? '+' : ''}{enrollmentVariation}% vs ano anterior
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Evolução das Matrículas (Censo Escolar)</p>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={ENROLLMENT_HISTORY}>
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#166534" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                          <Area type="monotone" dataKey="total" name="Total" stroke="#166534" strokeWidth={2} fill="url(#colorTotal)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Matrículas por Etapa (2024)</p>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Anos Iniciais</span>
                          <span className="font-bold text-primary">{lastEnrollment.iniciais}</span>
                        </div>
                        <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${(lastEnrollment.iniciais / lastEnrollment.total) * 100}%` }} />
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Anos Finais</span>
                          <span className="font-bold text-accent">{lastEnrollment.finais}</span>
                        </div>
                        <div className="w-full h-2 bg-accent/10 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${(lastEnrollment.finais / lastEnrollment.total) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. Card Qualidade e Contexto (IDEB) */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-sky-600" />
                    Qualidade e Contexto (IDEB)
                  </CardTitle>
                  <Badge className={lastIdeb.escola >= lastIdeb.meta ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                    {lastIdeb.escola >= lastIdeb.meta ? "Meta atingida" : "Abaixo da meta"}
                  </Badge>
                </div>
                <CardDescription>Indicadores educacionais públicos para leitura financeira</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <p className="text-sm text-muted-foreground mb-3">Evolução do IDEB</p>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={IDEB_DATA}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis domain={[4, 7]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                          <Line type="monotone" dataKey="escola" name="Escola" stroke="#166534" strokeWidth={3} dot={{ fill: '#166534', strokeWidth: 2 }} />
                          <Line type="monotone" dataKey="municipal" name="Média Municipal" stroke="#a0522d" strokeWidth={2} strokeDasharray="5 5" />
                          <Line type="monotone" dataKey="meta" name="Meta" stroke="#94a3b8" strokeWidth={2} strokeDasharray="3 3" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">IDEB 2023 (Escola)</p>
                      <p className="text-3xl font-bold text-primary">{lastIdeb.escola}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Meta 2023</p>
                      <p className="text-2xl font-bold">{lastIdeb.meta}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Média Municipal</p>
                      <p className="text-2xl font-bold">{lastIdeb.municipal}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className={lastIdeb.escola > lastIdeb.municipal ? "text-primary" : "text-amber-600"}>
                        {lastIdeb.escola > lastIdeb.municipal ? "Acima" : lastIdeb.escola === lastIdeb.municipal ? "Igual" : "Abaixo"} da média municipal
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5. Card Repasses Públicos (FNDE) */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-accent" />
                  Repasses Públicos Recebidos (FNDE)
                </CardTitle>
                <CardDescription>Transferências registradas em bases públicas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <p className="text-sm text-muted-foreground mb-3">Total de Repasses por Ano</p>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={REPASSES_DATA}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                          />
                          <Bar dataKey="pdde" name="PDDE" fill="#166534" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="pnae" name="PNAE" fill="#a0522d" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Por Programa (2024)</p>
                    <ProgramCard name="PDDE" value={lastRepasse.pdde} year="2024" />
                    <ProgramCard name="PNAE" value={lastRepasse.pnae} year="2024" />
                    <ProgramCard name="PNATE" value={lastRepasse.pnate} year="—" empty />
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 mt-4">
                      <p className="text-xs text-muted-foreground">Total 2024</p>
                      <p className="text-xl font-bold text-primary">R$ {lastRepasse.total.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 6. Card Regularidade e Prestação de Contas */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Regularidade e Prestação de Contas
                </CardTitle>
                <CardDescription>Status público por exercício</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Histórico de Prestações (PDDE)</p>
                    <div className="space-y-2">
                      {PRESTACAO_STATUS.map((item) => (
                        <div key={item.exercicio} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                          <span className="font-medium">Exercício {item.exercicio}</span>
                          <Badge className={
                            item.status === 'Aprovada' ? 'bg-green-100 text-green-700' :
                            item.status === 'Em análise' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {item.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Último exercício com status registrado</p>
                      <p className="text-2xl font-bold">{ultimoPrestacao.exercicio}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-xs text-amber-700 mb-1">Defasagem de ciclos</p>
                      <p className="text-2xl font-bold text-amber-700">{defasagemCiclos} {defasagemCiclos === 1 ? 'ciclo' : 'ciclos'}</p>
                      <p className="text-xs text-amber-600 mt-1">(Ano atual − último exercício registrado)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 8. Card Indicadores Financeiros Derivados */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  Indicadores Derivados
                </CardTitle>
                <CardDescription>Cálculos baseados em repasses e matrículas públicas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <IndicatorCard 
                    label="Repasse por Aluno (2024)" 
                    value={`R$ ${repassePerAluno}`}
                    subtitle="Total repasses ÷ matrículas"
                  />
                  <IndicatorCard 
                    label="Tendência de Repasses" 
                    value="-39%"
                    subtitle="2024 vs 2023 (parcial)"
                    negative
                  />
                  <IndicatorCard 
                    label="Último Repasse PDDE" 
                    value="2024"
                    subtitle="Há 0 anos"
                  />
                  <IndicatorCard 
                    label="Variação Matrículas" 
                    value={`${enrollmentVariation}%`}
                    subtitle="2024 vs 2023"
                    negative={parseFloat(enrollmentVariation) < 0}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 10. Card Alertas Neutros */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Observações e Alertas
                </CardTitle>
                <CardDescription>Informações baseadas em evidências públicas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <AlertItem 
                    text="Último repasse PDDE registrado em: 2024"
                    source="FNDE - Liberações"
                  />
                  <AlertItem 
                    text="Último exercício de prestação com status registrado: 2023"
                    source="FNDE - SIGPC"
                  />
                  <AlertItem 
                    text={`Defasagem de ciclos: ${defasagemCiclos}`}
                    source="Cálculo derivado"
                    type="warning"
                  />
                  <AlertItem 
                    text={`Matrículas em variação: ${enrollmentVariation}%`}
                    source="INEP - Censo Escolar"
                    type={parseFloat(enrollmentVariation) < -5 ? 'warning' : 'info'}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 11. Rodapé de Fontes e Transparência */}
            <Card className="card-clay bg-muted/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-display font-bold mb-2">Fontes e Transparência</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• <strong>Matrículas:</strong> INEP - Censo Escolar (consulta: Jan/2025)</p>
                      <p>• <strong>IDEB:</strong> INEP - Indicadores Educacionais (consulta: Jan/2025)</p>
                      <p>• <strong>Repasses:</strong> FNDE - Portal de Liberações (consulta: Jan/2025)</p>
                      <p>• <strong>Prestação de Contas:</strong> FNDE - SIGPC Público (consulta: Jan/2025)</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-background border border-border/50 text-sm text-muted-foreground">
                  <p className="mb-2"><strong>Aviso:</strong> Este painel usa apenas dados públicos. Não reflete saldo bancário, despesas internas ou extratos.</p>
                  <p>Indicadores derivados são cálculos a partir de repasses e matrículas disponíveis publicamente.</p>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" size="sm" className="rounded-lg" data-testid="button-export-pdf">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-lg" data-testid="button-export-json">
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-display font-bold mb-2">Digite um Código INEP</h3>
            <p className="text-muted-foreground max-w-sm">Insira o código de 8 dígitos da escola para carregar os dados públicos disponíveis.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function InfoItem({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-muted/30">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`font-medium ${mono ? 'font-mono' : ''} ${highlight ? 'text-primary font-bold text-lg' : ''}`}>{value}</p>
    </div>
  );
}

function ProgramCard({ name, value, year, empty }: { name: string; value: number; year: string; empty?: boolean }) {
  return (
    <div className={`p-3 rounded-xl border ${empty ? 'bg-muted/20 border-border/30' : 'bg-muted/50 border-border/50'}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs text-muted-foreground">{year}</span>
      </div>
      <p className={`text-lg font-bold mt-1 ${empty ? 'text-muted-foreground' : ''}`}>
        {empty ? 'Não consta' : `R$ ${value.toLocaleString('pt-BR')}`}
      </p>
    </div>
  );
}

function IndicatorCard({ label, value, subtitle, negative }: { label: string; value: string; subtitle: string; negative?: boolean }) {
  return (
    <div className="p-4 rounded-xl bg-muted/30">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <p className={`text-2xl font-bold ${negative ? 'text-amber-600' : 'text-primary'}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

function AlertItem({ text, source, type = 'info' }: { text: string; source: string; type?: 'info' | 'warning' }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl ${type === 'warning' ? 'bg-amber-50 border border-amber-200' : 'bg-muted/30'}`}>
      {type === 'warning' ? (
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
      ) : (
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1">
        <p className={`text-sm ${type === 'warning' ? 'text-amber-800' : ''}`}>{text}</p>
        <p className="text-xs text-muted-foreground mt-1">Fonte: {source}</p>
      </div>
    </div>
  );
}
