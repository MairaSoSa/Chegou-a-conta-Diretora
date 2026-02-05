import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, AlertCircle, TrendingUp, TrendingDown, DollarSign, Users, ArrowRight, 
  MapPin, Building, CheckCircle2, Calendar, FileText, Banknote, Clock, 
  GraduationCap, BookOpen, BarChart3, AlertTriangle, Info, Download, ExternalLink,
  School, Loader2, Wifi, Library, Dumbbell, Accessibility, Monitor, 
  Users2, CalendarDays, Link2, Award, Target, Scale, Building2, ShieldCheck
} from "lucide-react";
import { useSchoolSearch, useSchool } from "@/hooks/use-schools";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

// Taxas educacionais
const TAXAS_EDUCACIONAIS = {
  aprovacao: 94.2,
  reprovacao: 3.1,
  abandono: 2.7,
  distorcao: 8.5,
};

// Infraestrutura
const INFRAESTRUTURA = {
  biblioteca: true,
  quadra: true,
  laboratorio: false,
  internet: true,
  acessibilidade: true,
  computadores: 25,
};

// Ações PDDE
const ACOES_PDDE = [
  { nome: 'PDDE Básico', status: 'Ativo', valor: 8400 },
  { nome: 'PDDE Qualidade', status: 'Ativo', valor: 3200 },
  { nome: 'PDDE Estrutura', status: 'Não aderiu', valor: 0 },
  { nome: 'Educação Conectada', status: 'Ativo', valor: 2800 },
];

// Prazos
const PRAZOS = [
  { data: '28/02/2025', evento: 'Prestação de Contas PDDE 2024', urgente: true },
  { data: '31/03/2025', evento: 'Atualização Cadastral PDDE Interativo', urgente: false },
  { data: '30/04/2025', evento: 'Censo Escolar - Início coleta', urgente: false },
  { data: '31/05/2025', evento: 'Renovação Conselho Escolar', urgente: false },
];

// Benchmark
const BENCHMARK = {
  repasseEscola: 73.68,
  repasseMunicipal: 82.50,
  repasseEstadual: 78.30,
  idebEscola: 5.7,
  idebMunicipal: 5.3,
};

// VAAR
const VAAR = {
  elegivel: true,
  criterios: [
    { nome: 'Regularidade PDDE', atendido: true },
    { nome: 'Censo atualizado', atendido: true },
    { nome: 'IDEB calculado', atendido: true },
    { nome: 'Conselho ativo', atendido: true },
  ],
};

// Conselho Escolar
const CONSELHO = {
  situacao: 'Regular',
  ultimaAtualizacao: '15/01/2024',
  proximaRenovacao: '15/01/2026',
  membros: 12,
};

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
  const defasagemCiclos = 2025 - parseInt(ultimoPrestacao.exercicio);

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
            {showDemo && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">Dados de Demonstração</p>
                  <p className="text-sm text-amber-700">Este é um exemplo fictício. Digite um código INEP real para ver dados públicos.</p>
                </div>
              </div>
            )}

            {/* 2. Identidade da Escola */}
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

            {/* 3. Matrículas e Perfil */}
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
                        <Progress value={(lastEnrollment.iniciais / lastEnrollment.total) * 100} className="h-2" />
                      </div>
                      <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Anos Finais</span>
                          <span className="font-bold text-accent">{lastEnrollment.finais}</span>
                        </div>
                        <Progress value={(lastEnrollment.finais / lastEnrollment.total) * 100} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. Taxas Educacionais */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-sky-600" />
                  Taxas Educacionais
                </CardTitle>
                <CardDescription>Indicadores de rendimento escolar (Censo Escolar)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <TaxaCard label="Aprovação" value={TAXAS_EDUCACIONAIS.aprovacao} suffix="%" good />
                  <TaxaCard label="Reprovação" value={TAXAS_EDUCACIONAIS.reprovacao} suffix="%" />
                  <TaxaCard label="Abandono" value={TAXAS_EDUCACIONAIS.abandono} suffix="%" />
                  <TaxaCard label="Distorção Idade-Série" value={TAXAS_EDUCACIONAIS.distorcao} suffix="%" />
                </div>
              </CardContent>
            </Card>

            {/* 5. IDEB */}
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
                      <p className="text-xs text-muted-foreground mb-1">IDEB 2023</p>
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 6. Infraestrutura */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  Infraestrutura
                </CardTitle>
                <CardDescription>Dados do Censo Escolar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <InfraItem icon={Library} label="Biblioteca" available={INFRAESTRUTURA.biblioteca} />
                  <InfraItem icon={Dumbbell} label="Quadra" available={INFRAESTRUTURA.quadra} />
                  <InfraItem icon={Monitor} label="Lab. Informática" available={INFRAESTRUTURA.laboratorio} />
                  <InfraItem icon={Wifi} label="Internet" available={INFRAESTRUTURA.internet} />
                  <InfraItem icon={Accessibility} label="Acessibilidade" available={INFRAESTRUTURA.acessibilidade} />
                  <div className="p-4 rounded-xl bg-muted/50 text-center">
                    <Monitor className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">{INFRAESTRUTURA.computadores}</p>
                    <p className="text-xs text-muted-foreground">Computadores</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 7. Repasses Públicos (FNDE) */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-accent" />
                  Repasses Públicos Recebidos (FNDE)
                </CardTitle>
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

            {/* 8. Ações do PDDE */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Ações do PDDE
                </CardTitle>
                <CardDescription>Programas específicos e status de adesão</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {ACOES_PDDE.map((acao) => (
                    <div key={acao.nome} className={`p-4 rounded-xl border ${acao.status === 'Ativo' ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border/50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{acao.nome}</span>
                        <Badge className={acao.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'} variant="outline">
                          {acao.status}
                        </Badge>
                      </div>
                      <p className={`text-lg font-bold ${acao.status === 'Ativo' ? 'text-primary' : 'text-muted-foreground'}`}>
                        {acao.valor > 0 ? `R$ ${acao.valor.toLocaleString('pt-BR')}` : '—'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 9. Regularidade e Prestação de Contas */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Regularidade e Prestação de Contas
                </CardTitle>
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
                      <p className="text-xs text-muted-foreground mb-1">Último exercício com status</p>
                      <p className="text-2xl font-bold">{ultimoPrestacao.exercicio}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-xs text-amber-700 mb-1">Defasagem de ciclos</p>
                      <p className="text-2xl font-bold text-amber-700">{defasagemCiclos} {defasagemCiclos === 1 ? 'ciclo' : 'ciclos'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 10. Conselho Escolar */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <Users2 className="w-5 h-5 text-accent" />
                  Conselho Escolar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Situação</p>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      <p className="text-lg font-bold text-primary">{CONSELHO.situacao}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Última Atualização</p>
                    <p className="text-lg font-bold">{CONSELHO.ultimaAtualizacao}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Próxima Renovação</p>
                    <p className="text-lg font-bold">{CONSELHO.proximaRenovacao}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Membros</p>
                    <p className="text-lg font-bold">{CONSELHO.membros}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 11. VAAR */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <Target className="w-5 h-5 text-sky-600" />
                  VAAR (Valor Aluno Ano por Resultado)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                      <div>
                        <p className="font-bold text-lg">Elegível</p>
                        <p className="text-sm text-muted-foreground">A escola atende aos critérios</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Critérios de Elegibilidade</p>
                    <div className="space-y-2">
                      {VAAR.criterios.map((criterio) => (
                        <div key={criterio.nome} className="flex items-center gap-2 text-sm">
                          {criterio.atendido ? (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          )}
                          <span className={criterio.atendido ? '' : 'text-amber-600'}>{criterio.nome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 12. Comparadores (Benchmark) */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <Scale className="w-5 h-5 text-accent" />
                  Comparadores (Benchmark)
                </CardTitle>
                <CardDescription>Posição relativa da escola</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Repasse por Aluno</p>
                    <div className="space-y-3">
                      <BenchmarkBar label="Esta Escola" value={BENCHMARK.repasseEscola} max={100} highlight />
                      <BenchmarkBar label="Média Municipal" value={BENCHMARK.repasseMunicipal} max={100} />
                      <BenchmarkBar label="Média Estadual" value={BENCHMARK.repasseEstadual} max={100} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      <span className={BENCHMARK.repasseEscola < BENCHMARK.repasseMunicipal ? 'text-amber-600' : 'text-primary'}>
                        {BENCHMARK.repasseEscola < BENCHMARK.repasseMunicipal ? 'Abaixo' : 'Acima'} da média municipal
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">IDEB</p>
                    <div className="space-y-3">
                      <BenchmarkBar label="Esta Escola" value={BENCHMARK.idebEscola} max={10} highlight />
                      <BenchmarkBar label="Média Municipal" value={BENCHMARK.idebMunicipal} max={10} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      <span className="text-primary">Acima da média municipal</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 13. Calendário de Prazos */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-amber-600" />
                  Calendário de Prazos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {PRAZOS.map((prazo, i) => (
                    <div key={i} className={`flex items-center gap-4 p-4 rounded-xl ${prazo.urgente ? 'bg-amber-50 border border-amber-200' : 'bg-muted/30'}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${prazo.urgente ? 'bg-amber-100' : 'bg-muted'}`}>
                        <Calendar className={`w-5 h-5 ${prazo.urgente ? 'text-amber-600' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${prazo.urgente ? 'text-amber-800' : ''}`}>{prazo.evento}</p>
                        <p className={`text-sm ${prazo.urgente ? 'text-amber-600' : 'text-muted-foreground'}`}>{prazo.data}</p>
                      </div>
                      {prazo.urgente && (
                        <Badge className="bg-amber-100 text-amber-700 border-0">Urgente</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 14. Indicadores Derivados */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Indicadores Derivados
                </CardTitle>
                <CardDescription>Cálculos baseados em dados públicos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <IndicatorCard label="Repasse por Aluno (2024)" value={`R$ ${repassePerAluno}`} subtitle="Total ÷ matrículas" />
                  <IndicatorCard label="Tendência Repasses" value="-39%" subtitle="2024 vs 2023 (parcial)" negative />
                  <IndicatorCard label="Último Repasse PDDE" value="2024" subtitle="Há 0 anos" />
                  <IndicatorCard label="Variação Matrículas" value={`${enrollmentVariation}%`} subtitle="2024 vs 2023" negative={parseFloat(enrollmentVariation) < 0} />
                </div>
              </CardContent>
            </Card>

            {/* 15. Alertas Neutros */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Observações e Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <AlertItem text="Último repasse PDDE registrado em: 2024" source="FNDE - Liberações" />
                  <AlertItem text="Último exercício de prestação com status registrado: 2023" source="FNDE - SIGPC" />
                  <AlertItem text={`Defasagem de ciclos: ${defasagemCiclos}`} source="Cálculo derivado" type="warning" />
                  <AlertItem text={`Matrículas em variação: ${enrollmentVariation}%`} source="INEP - Censo Escolar" type={parseFloat(enrollmentVariation) < -5 ? 'warning' : 'info'} />
                </div>
              </CardContent>
            </Card>

            {/* 16. Links Úteis */}
            <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-sky-600" />
                  Links Úteis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <LinkCard name="PDDE Interativo" url="https://pddeinterativo.mec.gov.br" />
                  <LinkCard name="SIGPC" url="https://www.fnde.gov.br/sigpc" />
                  <LinkCard name="Portal FNDE" url="https://www.fnde.gov.br" />
                  <LinkCard name="Consulta Escola (INEP)" url="https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/inep-data/consulta-matricula" />
                </div>
              </CardContent>
            </Card>

            {/* 17. Fontes e Transparência */}
            <Card className="card-clay bg-muted/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-display font-bold mb-2">Fontes e Transparência</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• <strong>Matrículas/Infraestrutura:</strong> INEP - Censo Escolar (consulta: Fev/2025)</p>
                      <p>• <strong>IDEB/Taxas:</strong> INEP - Indicadores Educacionais (consulta: Fev/2025)</p>
                      <p>• <strong>Repasses:</strong> FNDE - Portal de Liberações (consulta: Fev/2025)</p>
                      <p>• <strong>Prestação de Contas:</strong> FNDE - SIGPC Público (consulta: Fev/2025)</p>
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

// Componentes auxiliares
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

function TaxaCard({ label, value, suffix, good }: { label: string; value: number; suffix: string; good?: boolean }) {
  return (
    <div className={`p-4 rounded-xl ${good ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30'}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${good ? 'text-primary' : ''}`}>{value}{suffix}</p>
    </div>
  );
}

function InfraItem({ icon: Icon, label, available }: { icon: any; label: string; available: boolean }) {
  return (
    <div className={`p-4 rounded-xl text-center ${available ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30 border border-border/30'}`}>
      <Icon className={`w-6 h-6 mx-auto mb-2 ${available ? 'text-primary' : 'text-muted-foreground'}`} />
      <p className="text-xs font-medium">{label}</p>
      <p className={`text-xs ${available ? 'text-primary' : 'text-muted-foreground'}`}>
        {available ? 'Sim' : 'Não'}
      </p>
    </div>
  );
}

function BenchmarkBar({ label, value, max, highlight }: { label: string; value: number; max: number; highlight?: boolean }) {
  const percentage = (value / max) * 100;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={highlight ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
        <span className={highlight ? 'font-bold text-primary' : ''}>{max === 10 ? value.toFixed(1) : `R$ ${value.toFixed(2)}`}</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${highlight ? 'bg-primary' : 'bg-muted-foreground/30'}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function LinkCard({ name, url }: { name: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl bg-muted/30 hover:bg-accent/5 border border-border/50 hover:border-accent/30 transition-all group flex items-center gap-3">
      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
      <span className="text-sm font-medium group-hover:text-accent transition-colors">{name}</span>
    </a>
  );
}
