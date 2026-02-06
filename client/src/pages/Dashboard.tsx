import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DashboardDataset } from "@shared/schema";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, AlertCircle, TrendingUp, TrendingDown, DollarSign, Users, ArrowRight, 
  MapPin, Building, CheckCircle2, Calendar, FileText, Banknote, Clock, 
  GraduationCap, BookOpen, BarChart3, AlertTriangle, Info, Download, ExternalLink,
  School, Loader2, Wifi, Library, Dumbbell, Accessibility, Monitor, 
  Users2, CalendarDays, Link2, Award, Target, Scale, Building2, ShieldCheck,
  ChevronDown, ChevronUp, LayoutGrid, List, Landmark, CreditCard, ClipboardCheck, Hash
} from "lucide-react";
import { useSchoolSearch, useSchool } from "@/hooks/use-schools";
import { usePddeInfo } from "@/hooks/use-pdde";
import type { PddeInfo } from "@/hooks/use-pdde";
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

// Dados de matrículas históricos (fallback)
const DEFAULT_ENROLLMENT_HISTORY = [
  { year: '2020', total: 380, iniciais: 220, finais: 160 },
  { year: '2021', total: 365, iniciais: 210, finais: 155 },
  { year: '2022', total: 358, iniciais: 205, finais: 153 },
  { year: '2023', total: 350, iniciais: 200, finais: 150 },
  { year: '2024', total: 342, iniciais: 195, finais: 147 },
];

// Dados do IDEB (fallback)
const DEFAULT_IDEB_DATA = [
  { year: '2017', escola: 5.2, municipal: 5.0, estadual: 5.4, meta: 5.0 },
  { year: '2019', escola: 5.5, municipal: 5.2, estadual: 5.6, meta: 5.3 },
  { year: '2021', escola: 5.1, municipal: 4.9, estadual: 5.3, meta: 5.5 },
  { year: '2023', escola: 5.7, municipal: 5.3, estadual: 5.8, meta: 5.7 },
];

// Repasses por programa (fallback)
const DEFAULT_REPASSES_DATA = [
  { year: '2020', pdde: 8400, pnae: 28000, pnate: 0, total: 36400 },
  { year: '2021', pdde: 8400, pnae: 29200, pnate: 0, total: 37600 },
  { year: '2022', pdde: 9200, pnae: 30100, pnate: 0, total: 39300 },
  { year: '2023', pdde: 9800, pnae: 31500, pnate: 0, total: 41300 },
  { year: '2024', pdde: 8400, pnae: 16800, pnate: 0, total: 25200 },
];

// Status de prestação de contas (fallback)
const DEFAULT_PRESTACAO_STATUS = [
  { exercicio: '2021', status: 'Aprovada', programa: 'PDDE' },
  { exercicio: '2022', status: 'Aprovada', programa: 'PDDE' },
  { exercicio: '2023', status: 'Em análise', programa: 'PDDE' },
];

// Taxas educacionais (fallback)
const DEFAULT_TAXAS_EDUCACIONAIS = {
  aprovacao: 94.2,
  reprovacao: 3.1,
  abandono: 2.7,
  distorcao: 8.5,
};

// Infraestrutura (fallback)
const DEFAULT_INFRAESTRUTURA = {
  biblioteca: true,
  quadra: true,
  laboratorio: false,
  internet: true,
  acessibilidade: true,
  computadores: 25,
};

// Ações PDDE (fallback)
const DEFAULT_ACOES_PDDE = [
  { nome: 'PDDE Básico', status: 'Ativo', valor: 8400 },
  { nome: 'PDDE Qualidade', status: 'Ativo', valor: 3200 },
  { nome: 'PDDE Estrutura', status: 'Não aderiu', valor: 0 },
  { nome: 'Educação Conectada', status: 'Ativo', valor: 2800 },
];

// Prazos e Calendário Completo (fallback)
const DEFAULT_CALENDARIO_EVENTOS = [
  // Fevereiro
  { mes: 2, ano: 2025, dia: 28, evento: 'Entregar contas do PDDE de 2024', tipo: 'prestacao', urgente: true },
  // Março
  { mes: 3, ano: 2025, dia: 15, evento: 'Adesão PDDE Qualidade', tipo: 'adesao', urgente: false },
  { mes: 3, ano: 2025, dia: 31, evento: 'Atualizar cadastro no PDDE Interativo', tipo: 'cadastro', urgente: false },
  // Abril
  { mes: 4, ano: 2025, dia: 15, evento: 'Adesão Escola Conectada', tipo: 'adesao', urgente: false },
  { mes: 4, ano: 2025, dia: 30, evento: 'Começa o Censo Escolar', tipo: 'censo', urgente: false },
  // Maio
  { mes: 5, ano: 2025, dia: 31, evento: 'Renovar Conselho Escolar', tipo: 'conselho', urgente: false },
  // Junho
  { mes: 6, ano: 2025, dia: 15, evento: 'Adesão PDDE Estrutura', tipo: 'adesao', urgente: false },
  { mes: 6, ano: 2025, dia: 30, evento: 'Encerra 1ª etapa Censo', tipo: 'censo', urgente: false },
  // Julho
  { mes: 7, ano: 2025, dia: 31, evento: 'Conferência dados Censo', tipo: 'censo', urgente: false },
  // Agosto
  { mes: 8, ano: 2025, dia: 15, evento: 'Adesão Escola Acessível', tipo: 'adesao', urgente: false },
  { mes: 8, ano: 2025, dia: 31, evento: 'Encerra coleta Censo', tipo: 'censo', urgente: true },
  // Setembro
  { mes: 9, ano: 2025, dia: 30, evento: 'Adesão Mais Alfabetização', tipo: 'adesao', urgente: false },
  // Outubro
  { mes: 10, ano: 2025, dia: 15, evento: 'Publicação dados Censo', tipo: 'censo', urgente: false },
  // Novembro
  { mes: 11, ano: 2025, dia: 30, evento: 'Adesão programas 2026', tipo: 'adesao', urgente: false },
  // Dezembro
  { mes: 12, ano: 2025, dia: 31, evento: 'Fechamento exercício', tipo: 'prestacao', urgente: true },
];

const MESES_NOMES = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const TIPO_CORES: Record<string, { bg: string; text: string; border: string }> = {
  prestacao: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  adesao: { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' },
  cadastro: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  censo: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  conselho: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
};

const TIPO_LABELS: Record<string, string> = {
  prestacao: 'Prestação de Contas',
  adesao: 'Adesão a Programa',
  cadastro: 'Atualização Cadastro',
  censo: 'Censo Escolar',
  conselho: 'Conselho Escolar',
};

// Links dos programas
const LINKS_PROGRAMAS = [
  { nome: 'PDDE Interativo', descricao: 'Onde você faz cadastros e adesões', url: 'https://pddeinterativo.mec.gov.br' },
  { nome: 'SIGPC', descricao: 'Onde você presta contas', url: 'https://www.fnde.gov.br/sigpc' },
  { nome: 'Portal FNDE', descricao: 'Tudo sobre as verbas federais', url: 'https://www.fnde.gov.br' },
  { nome: 'Consulta Escola', descricao: 'Dados da sua escola no INEP', url: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/inep-data/consulta-matricula' },
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
    { nome: 'Contas do PDDE em dia', atendido: true },
    { nome: 'Censo preenchido', atendido: true },
    { nome: 'Nota IDEB calculada', atendido: true },
    { nome: 'Conselho funcionando', atendido: true },
  ],
};

// Elegibilidade a Programas Federais
const ELEGIBILIDADE_PROGRAMAS = [
  {
    nome: 'Escola Conectada',
    elegivel: true,
    status: 'Já participa',
    criterios: [
      { nome: 'É escola pública', atendido: true },
      { nome: 'Tem ensino fundamental ou médio', atendido: true },
      { nome: 'Tem estrutura básica', atendido: true },
      { nome: 'Fez cadastro no PDDE Interativo', atendido: true },
    ],
    observacao: 'Recebendo verba desde 2022',
  },
  {
    nome: 'Tempo de Aprender',
    elegivel: true,
    status: 'Pode participar',
    criterios: [
      { nome: 'Tem do 1º ao 5º ano', atendido: true },
      { nome: 'Nota IDEB baixa', atendido: false },
      { nome: 'Prefeitura aderiu', atendido: true },
    ],
    observacao: 'Nota IDEB boa, mas pode participar por outros motivos',
  },
  {
    nome: 'Brasil na Escola',
    elegivel: true,
    status: 'Pode participar',
    criterios: [
      { nome: 'Tem do 6º ao 9º ano', atendido: true },
      { nome: 'Comunidade de baixa renda', atendido: true },
      { nome: 'Estado/Prefeitura aderiu', atendido: true },
    ],
    observacao: null,
  },
  {
    nome: 'PDDE Emergencial',
    elegivel: false,
    status: 'Não precisa',
    criterios: [
      { nome: 'Tem emergência (enchente, etc)', atendido: false },
      { nome: 'Prefeitura declarou emergência', atendido: false },
    ],
    observacao: 'Só quando tem desastre ou emergência',
  },
  {
    nome: 'Escola Acessível',
    elegivel: true,
    status: 'Pode participar',
    criterios: [
      { nome: 'Tem alunos com deficiência', atendido: true },
      { nome: 'Tem plano de melhorias', atendido: true },
      { nome: 'Fez cadastro no PDDE Interativo', atendido: true },
    ],
    observacao: '12 alunos com deficiência matriculados',
  },
  {
    nome: 'Mais Alfabetização',
    elegivel: true,
    status: 'Pode participar',
    criterios: [
      { nome: 'Tem 1º e 2º ano', atendido: true },
      { nome: 'Prefeitura aderiu', atendido: true },
    ],
    observacao: null,
  },
];

// Dados de conectividade
const CONECTIVIDADE = {
  temInternet: true,
  tipoConexao: 'Fibra Óptica',
  velocidade: '100 Mbps',
  fonteConexao: 'PBLE (Programa Banda Larga nas Escolas)',
  dataInstalacao: '03/2022',
  operadora: 'Oi/Algar',
  situacaoGIGA: 'Conectada',
  pontosWifi: 8,
  computadoresConectados: 25,
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
  const [viewMode, setViewMode] = useState<'resumido' | 'completo'>('resumido');
  const [pddeAno, setPddeAno] = useState(new Date().getFullYear() - 1);
  
  const { data: searchResults } = useSchoolSearch(searchQuery);
  const { data: school } = useSchool(selectedInep || "");
  const { data: pddeData, isLoading: pddeLoading, isFetching: pddeFetching } = usePddeInfo(selectedInep, pddeAno);

  const pddeEnrollTotal = pddeData?.ok
    ? pddeData.matriculas_total
      ?? (pddeData.matriculas_por_nivel
        ? Object.values(pddeData.matriculas_por_nivel).reduce((a, b) => a + b, 0)
        : null)
    : null;

  const { data: datasets = [] } = useQuery<DashboardDataset[]>({
    queryKey: ["/api/dashboard/datasets"],
  });

  function getDataset(category: string) {
    return datasets.find(d => d.category === category);
  }

  const enrollmentData = getDataset('enrollment')?.data as any[] || DEFAULT_ENROLLMENT_HISTORY;
  const idebData = getDataset('ideb')?.data as any[] || DEFAULT_IDEB_DATA;
  const repassesData = getDataset('repasses')?.data as any[] || DEFAULT_REPASSES_DATA;
  const prestacaoData = getDataset('prestacao')?.data as any[] || DEFAULT_PRESTACAO_STATUS;
  const taxasRaw = getDataset('taxas')?.data as any;
  const taxasData = Array.isArray(taxasRaw) ? (taxasRaw[0] || DEFAULT_TAXAS_EDUCACIONAIS) : (taxasRaw || DEFAULT_TAXAS_EDUCACIONAIS);
  const infraRaw = getDataset('infraestrutura')?.data as any;
  const infraData = Array.isArray(infraRaw) ? (infraRaw[0] || DEFAULT_INFRAESTRUTURA) : (infraRaw || DEFAULT_INFRAESTRUTURA);
  const acoesPddeData = getDataset('acoes_pdde')?.data as any[] || DEFAULT_ACOES_PDDE;
  const calendarioData = getDataset('calendario')?.data as any[] || DEFAULT_CALENDARIO_EVENTOS;

  const latestUpdate = datasets.length > 0
    ? datasets.reduce((latest, d) => {
        const dt = d.lastUpdated ? new Date(d.lastUpdated) : new Date(0);
        return dt > latest ? dt : latest;
      }, new Date(0))
    : null;

  const pddeSchoolFallback = selectedInep && !school && pddeData?.ok ? {
    inep: selectedInep,
    name: pddeData.nome_escola || `Escola ${selectedInep}`,
    city: pddeData.municipio || '',
    state: pddeData.uf || '',
    network: pddeData.rede || '',
    location: '',
    enrollmentCount: pddeEnrollTotal || 0,
  } : null;

  const displaySchool = selectedInep && school ? school : (pddeSchoolFallback || (showDemo ? DEMO_SCHOOL : null));

  const lastEnrollment = enrollmentData[enrollmentData.length - 1];
  const prevEnrollment = enrollmentData[enrollmentData.length - 2];
  const enrollmentVariation = ((lastEnrollment.total - prevEnrollment.total) / prevEnrollment.total * 100).toFixed(1);

  const lastRepasse = repassesData[repassesData.length - 1];
  const repassePerAluno = (lastRepasse.total / lastEnrollment.total).toFixed(2);

  const lastIdeb = idebData[idebData.length - 1];
  const ultimoPrestacao = prestacaoData[prestacaoData.length - 1];
  const defasagemCiclos = 2025 - parseInt(ultimoPrestacao.exercicio);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        {/* 1. Cabeçalho com busca */}
        <Card className="card-clay">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Coloque aqui o código da escola (8 números)..." 
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
                Buscar Escola
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
                {latestUpdate && latestUpdate.getTime() > 0 && (
                  <span className="text-xs text-muted-foreground" data-testid="text-dashboard-last-update">
                    Dados atualizados em: {latestUpdate.toLocaleDateString('pt-BR')}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant={viewMode === 'resumido' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('resumido')}
                    className="text-xs"
                    data-testid="btn-view-resumido"
                  >
                    <List className="w-3 h-3 mr-1" />
                    Resumido
                  </Button>
                  <Button
                    variant={viewMode === 'completo' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('completo')}
                    className="text-xs"
                    data-testid="btn-view-completo"
                  >
                    <LayoutGrid className="w-3 h-3 mr-1" />
                    Completo
                  </Button>
                </div>
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
                  <p className="font-medium text-amber-800">Exemplo para você conhecer</p>
                  <p className="text-sm text-amber-700">Isso aqui é só um exemplo. Coloque o código da sua escola para ver os dados de verdade.</p>
                </div>
              </div>
            )}

            {pddeLoading && selectedInep && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-sky-600 animate-spin flex-shrink-0" />
                <div>
                  <p className="font-medium text-sky-800">Buscando dados do FNDE...</p>
                  <p className="text-sm text-sky-700">Consultando informações financeiras da escola no portal do governo.</p>
                </div>
              </div>
            )}

            {pddeData && !pddeData.ok && !showDemo && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">Dados financeiros indisponíveis</p>
                  <p className="text-sm text-amber-700">{pddeData.error || "Não foi possível consultar o FNDE para este código."}</p>
                </div>
              </div>
            )}

            {/* MODO RESUMIDO: Explicação inicial amigável */}
            {viewMode === 'resumido' && (
              <div className="space-y-6">
                <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
                  <CardContent className="p-4">
                    <p className="text-emerald-800 leading-relaxed">
                      <strong>Olá!</strong> Aqui você vê um resumo da sua escola. 
                      Esses números vêm do <strong>Censo Escolar</strong> e do <strong>FNDE</strong>. 
                      Use para acompanhar as verbas e não perder nenhum prazo!
                    </p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="card-clay p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-primary">
                          {pddeEnrollTotal ?? displaySchool.enrollmentCount}
                        </p>
                        <p className="text-sm font-medium text-foreground">Alunos matriculados</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {pddeEnrollTotal ? `Fonte: FNDE ${pddeData?.ano}` : 'Esse número define quanto dinheiro você recebe'}
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card className="card-clay p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Banknote className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        {pddeData?.ok && pddeData.destinacoes && pddeData.destinacoes.length > 0 ? (
                          <>
                            <p className="text-3xl font-bold text-accent">
                              R$ {pddeData.destinacoes.reduce((s, d) => s + (d.pago_total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm font-medium text-foreground">Pago em {pddeData.ano}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {pddeData.destinacoes.length} {pddeData.destinacoes.length === 1 ? 'destinação' : 'destinações'} - Fonte FNDE
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-3xl font-bold text-accent">R$ {lastRepasse.total.toLocaleString('pt-BR')}</p>
                            <p className="text-sm font-medium text-foreground">Recebido em 2024</p>
                            <p className="text-xs text-muted-foreground mt-1">Soma de PDDE (R${lastRepasse.pdde.toLocaleString('pt-BR')}) + PNAE (R${lastRepasse.pnae.toLocaleString('pt-BR')})</p>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>

                {pddeData?.ok && pddeData.contas && pddeData.contas.length > 0 && (
                  <Card className="card-clay">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CreditCard className="w-4 h-4 text-primary" />
                        Contas Bancárias
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {pddeData.contas.map((conta, i) => (
                          <div key={i} className="p-3 rounded-xl bg-muted/30 flex items-center justify-between gap-2" data-testid={`conta-bancaria-${i}`}>
                            <div>
                              <p className="text-sm font-medium">{conta.programa}</p>
                              <p className="text-xs text-muted-foreground font-mono">Ag {conta.agencia} / CC {conta.conta}</p>
                            </div>
                            {conta.saldo !== null && (
                              <p className={`text-sm font-bold ${conta.saldo > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                R$ {conta.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {pddeData?.ok && pddeData.situacao_uex && (
                  <Card className="card-clay">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ClipboardCheck className="w-4 h-4 text-accent" />
                        Situação no FNDE
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {pddeData.situacao_uex.dados_cadastrais && (
                          <div className="p-3 rounded-xl bg-muted/30">
                            <p className="text-xs text-muted-foreground mb-1">Cadastro</p>
                            <p className="text-sm font-medium">{pddeData.situacao_uex.dados_cadastrais}</p>
                          </div>
                        )}
                        {pddeData.situacao_uex.prestacao_contas && (
                          <div className="p-3 rounded-xl bg-muted/30">
                            <p className="text-xs text-muted-foreground mb-1">Prestação de Contas</p>
                            <p className="text-sm font-medium">{pddeData.situacao_uex.prestacao_contas}</p>
                          </div>
                        )}
                        {pddeData.situacao_uex.mandato_inicio && (
                          <div className="p-3 rounded-xl bg-muted/30">
                            <p className="text-xs text-muted-foreground mb-1">Mandato</p>
                            <p className="text-sm font-medium">{pddeData.situacao_uex.mandato_inicio} a {pddeData.situacao_uex.mandato_fim}</p>
                          </div>
                        )}
                        {pddeData.situacao_eex?.adesao && (
                          <div className="p-3 rounded-xl bg-muted/30">
                            <p className="text-xs text-muted-foreground mb-1">Adesão (Prefeitura)</p>
                            <p className="text-sm font-medium">{pddeData.situacao_eex.adesao}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* MODO RESUMIDO: Próximos prazos */}
            {viewMode === 'resumido' && (
              <Card className="card-clay">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    Fique de Olho nos Prazos
                  </CardTitle>
                  <CardDescription>
                    Datas importantes para não esquecer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {calendarioData.filter(e => e.urgente || new Date(e.ano, e.mes - 1, e.dia) > new Date()).slice(0, 3).map((evento, i) => (
                      <div key={i} className={`p-4 rounded-xl ${evento.urgente ? 'bg-red-50 border-2 border-red-200' : 'bg-muted/30 border border-transparent'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${evento.urgente ? 'bg-red-100' : 'bg-white border'}`}>
                            <span className={`text-xs font-medium ${evento.urgente ? 'text-red-600' : 'text-muted-foreground'}`}>{MESES_NOMES[evento.mes]}</span>
                            <span className={`text-lg font-bold ${evento.urgente ? 'text-red-700' : 'text-foreground'}`}>{evento.dia}</span>
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${evento.urgente ? 'text-red-800' : 'text-foreground'}`}>{evento.evento}</p>
                            <p className="text-xs text-muted-foreground mt-1">{TIPO_LABELS[evento.tipo]}</p>
                            {evento.urgente && (
                              <Badge className="bg-red-100 text-red-700 border-0 text-xs mt-2">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Prazo chegando!
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setViewMode('completo')}
                    data-testid="btn-ver-calendario-completo"
                  >
                    Ver todos os prazos do ano
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* MODO RESUMIDO: Links úteis */}
            {viewMode === 'resumido' && (
              <Card className="card-clay">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-primary" />
                    Sites que Você Vai Precisar
                  </CardTitle>
                  <CardDescription>
                    Clique para abrir em nova aba
                  </CardDescription>
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
            )}

            {/* MODO COMPLETO: Identidade da Escola */}
            {viewMode === 'completo' && (
              <Card className="card-clay">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <School className="w-5 h-5 text-accent" />
                    Dados da Escola
                  </CardTitle>
                  <CardDescription>Informações básicas que aparecem no Censo e FNDE</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoItem label="Nome" value={pddeData?.ok && pddeData.nome_escola ? pddeData.nome_escola : displaySchool.name} />
                    <InfoItem label="Código INEP" value={displaySchool.inep} mono />
                    <InfoItem label="Cidade/Estado" value={pddeData?.ok && pddeData.municipio ? `${pddeData.municipio}/${pddeData.uf}` : `${displaySchool.city}/${displaySchool.state}`} />
                    <InfoItem label="Rede" value={pddeData?.ok && pddeData.rede ? pddeData.rede : displaySchool.network} />
                    <InfoItem label="Área" value={displaySchool.location} />
                    <InfoItem label="Alunos" value={(pddeEnrollTotal ?? displaySchool.enrollmentCount).toString()} highlight />
                    {pddeData?.ok && pddeData.uex && (
                      <>
                        <InfoItem label="UEx (Caixa Escolar)" value={pddeData.uex.executora} />
                        <InfoItem label="CNPJ da UEx" value={pddeData.uex.cnpj} mono />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 3. Matrículas e Perfil */}
            {viewMode === 'completo' && <Card className="card-clay">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Quantos Alunos Estudam Aqui
                  </CardTitle>
                  <Badge className={parseFloat(enrollmentVariation) < 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}>
                    {parseFloat(enrollmentVariation) < 0 ? 'Diminuiu' : 'Aumentou'} {Math.abs(parseFloat(enrollmentVariation))}%
                  </Badge>
                </div>
                <CardDescription>Comparando com o ano passado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Como foi nos últimos anos</p>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={enrollmentData}>
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
                    <p className="text-sm text-muted-foreground mb-3">
                      {pddeData?.ok && pddeData.matriculas_por_nivel && Object.keys(pddeData.matriculas_por_nivel).length > 0
                        ? `Por nível (FNDE ${pddeData.ano})`
                        : 'Por série em 2024'}
                    </p>
                    <div className="space-y-3">
                      {pddeData?.ok && pddeData.matriculas_por_nivel && Object.keys(pddeData.matriculas_por_nivel).length > 0 ? (
                        Object.entries(pddeData.matriculas_por_nivel).map(([nivel, qtd]) => {
                          const total = pddeEnrollTotal || Object.values(pddeData.matriculas_por_nivel!).reduce((a, b) => a + b, 0);
                          return (
                            <div key={nivel} className="p-3 rounded-xl bg-muted/30 border border-border/30">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">{nivel}</span>
                                <span className="font-bold text-primary">{qtd}</span>
                              </div>
                              <Progress value={total > 0 ? (qtd / total) * 100 : 0} className="h-2" />
                            </div>
                          );
                        })
                      ) : (
                        <>
                          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">1º ao 5º ano</span>
                              <span className="font-bold text-primary">{lastEnrollment.iniciais}</span>
                            </div>
                            <Progress value={(lastEnrollment.iniciais / lastEnrollment.total) * 100} className="h-2" />
                          </div>
                          <div className="p-3 rounded-xl bg-accent/5 border border-accent/10">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">6º ao 9º ano</span>
                              <span className="font-bold text-accent">{lastEnrollment.finais}</span>
                            </div>
                            <Progress value={(lastEnrollment.finais / lastEnrollment.total) * 100} className="h-2" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>}

            {/* 4. Taxas Educacionais */}
            {viewMode === 'completo' && <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-sky-600" />
                  Como os Alunos Estão Indo
                </CardTitle>
                <CardDescription>De cada 100 alunos, quantos passam, reprovam ou desistem</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <TaxaCard label="Passaram de ano" value={taxasData.aprovacao} suffix="%" good />
                  <TaxaCard label="Reprovaram" value={taxasData.reprovacao} suffix="%" />
                  <TaxaCard label="Desistiram" value={taxasData.abandono} suffix="%" />
                  <TaxaCard label="Atrasados na série" value={taxasData.distorcao} suffix="%" />
                </div>
              </CardContent>
            </Card>}

            {/* 5. IDEB */}
            {viewMode === 'completo' && <Card className="card-clay">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-sky-600" />
                    Nota da Escola (IDEB)
                  </CardTitle>
                  <Badge className={lastIdeb.escola >= lastIdeb.meta ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                    {lastIdeb.escola >= lastIdeb.meta ? "Chegou na meta" : "Precisa melhorar"}
                  </Badge>
                </div>
                <CardDescription>O IDEB é a nota que o governo dá para a escola, de 0 a 10</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <p className="text-sm text-muted-foreground mb-3">Como a nota foi mudando</p>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={idebData}>
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
                      <p className="text-xs text-muted-foreground mb-1">Nota da escola em 2023</p>
                      <p className="text-3xl font-bold text-primary">{lastIdeb.escola}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Meta que precisava atingir</p>
                      <p className="text-2xl font-bold">{lastIdeb.meta}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Média das outras escolas da cidade</p>
                      <p className="text-2xl font-bold">{lastIdeb.municipal}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>}

            {/* PDDE: Seletor de Ano + Dados FNDE */}
            {viewMode === 'completo' && selectedInep && !showDemo && (
              <Card className="card-clay bg-gradient-to-r from-sky-50/50 to-blue-50/50 border-sky-200/50" data-testid="card-pdde-fnde">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-sky-700" />
                      Dados do FNDE (PDDEInfo)
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Ano:</span>
                      <select 
                        value={pddeAno}
                        onChange={(e) => setPddeAno(parseInt(e.target.value))}
                        className="text-sm border border-border/50 rounded-lg px-3 py-1.5 bg-background"
                        data-testid="select-pdde-ano"
                        aria-label="Selecionar ano dos dados FNDE"
                      >
                        {[...Array(6)].map((_, i) => {
                          const y = new Date().getFullYear() - i;
                          return <option key={y} value={y}>{y}</option>;
                        })}
                      </select>
                      {pddeFetching && <Loader2 className="w-4 h-4 animate-spin text-sky-600" />}
                    </div>
                  </div>
                  <CardDescription>
                    Informações financeiras extraídas do portal do FNDE
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pddeLoading ? (
                    <div className="flex items-center justify-center py-8 gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                      <p className="text-sm text-muted-foreground">Consultando FNDE...</p>
                    </div>
                  ) : pddeData?.ok ? (
                    <div className="space-y-6">
                      {/* UEx Info */}
                      {pddeData.uex && (
                        <div>
                          <p className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Building className="w-4 h-4 text-sky-600" />
                            Unidade Executora (Caixa Escolar)
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <InfoItem label="Nome" value={pddeData.uex.executora} />
                            <InfoItem label="CNPJ" value={pddeData.uex.cnpj} mono />
                            <InfoItem label="UF" value={pddeData.uex.uf} />
                            <InfoItem label="Município" value={pddeData.uex.municipio} />
                          </div>
                        </div>
                      )}

                      {/* Contas Bancárias */}
                      {pddeData.contas && pddeData.contas.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-3 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-sky-600" />
                            Contas Bancárias Vinculadas
                          </p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border/50">
                                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Programa</th>
                                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Banco</th>
                                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Agência</th>
                                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Conta</th>
                                  <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Saldo</th>
                                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Ocorrência</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pddeData.contas.map((conta, i) => (
                                  <tr key={i} className="border-b border-border/20 hover:bg-muted/30 transition-colors" data-testid={`row-conta-${i}`}>
                                    <td className="py-2.5 px-3 font-medium">{conta.programa}</td>
                                    <td className="py-2.5 px-3 font-mono text-xs">{conta.banco}</td>
                                    <td className="py-2.5 px-3 font-mono text-xs">{conta.agencia}</td>
                                    <td className="py-2.5 px-3 font-mono text-xs">{conta.conta}</td>
                                    <td className="py-2.5 px-3 text-right font-mono">
                                      {conta.saldo !== null
                                        ? <span className={conta.saldo > 0 ? 'text-primary font-medium' : ''}>
                                            R$ {conta.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </span>
                                        : <span className="text-muted-foreground">—</span>}
                                    </td>
                                    <td className="py-2.5 px-3 text-xs text-muted-foreground">{conta.ocorrencia || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Situação UEx + EEx */}
                      {(pddeData.situacao_uex || pddeData.situacao_eex) && (
                        <div>
                          <p className="text-sm font-medium mb-3 flex items-center gap-2">
                            <ClipboardCheck className="w-4 h-4 text-sky-600" />
                            Situação Cadastral e Prestação de Contas
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pddeData.situacao_uex && (
                              <div className="p-4 rounded-xl bg-background border border-border/30">
                                <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Unidade Executora (UEx)</p>
                                <div className="space-y-3">
                                  {pddeData.situacao_uex.dados_cadastrais && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Dados Cadastrais</p>
                                      <p className="text-sm font-medium">{pddeData.situacao_uex.dados_cadastrais}</p>
                                    </div>
                                  )}
                                  {pddeData.situacao_uex.prestacao_contas && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Prestação de Contas</p>
                                      <Badge className={
                                        pddeData.situacao_uex.prestacao_contas.toLowerCase().includes('regular') || pddeData.situacao_uex.prestacao_contas.toLowerCase().includes('aprovad')
                                          ? 'bg-green-100 text-green-700'
                                          : pddeData.situacao_uex.prestacao_contas.toLowerCase().includes('pendent') || pddeData.situacao_uex.prestacao_contas.toLowerCase().includes('análise')
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-muted text-muted-foreground'
                                      }>{pddeData.situacao_uex.prestacao_contas}</Badge>
                                    </div>
                                  )}
                                  {pddeData.situacao_uex.mandato_inicio && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Mandato</p>
                                      <p className="text-sm font-medium">{pddeData.situacao_uex.mandato_inicio} a {pddeData.situacao_uex.mandato_fim}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {pddeData.situacao_eex && (
                              <div className="p-4 rounded-xl bg-background border border-border/30">
                                <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Entidade Executora (Prefeitura/Estado)</p>
                                <div className="space-y-3">
                                  {pddeData.situacao_eex.adesao && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Adesão</p>
                                      <p className="text-sm font-medium">{pddeData.situacao_eex.adesao}</p>
                                    </div>
                                  )}
                                  {pddeData.situacao_eex.prestacao_contas && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Prestação de Contas</p>
                                      <Badge className={
                                        pddeData.situacao_eex.prestacao_contas.toLowerCase().includes('regular') || pddeData.situacao_eex.prestacao_contas.toLowerCase().includes('aprovad')
                                          ? 'bg-green-100 text-green-700'
                                          : pddeData.situacao_eex.prestacao_contas.toLowerCase().includes('pendent') || pddeData.situacao_eex.prestacao_contas.toLowerCase().includes('análise')
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-muted text-muted-foreground'
                                      }>{pddeData.situacao_eex.prestacao_contas}</Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Destinações / Repasses Detalhados */}
                      {pddeData.destinacoes && pddeData.destinacoes.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-sky-600" />
                            Destinações e Repasses ({pddeData.ano})
                          </p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border/50">
                                  <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Destinação</th>
                                  <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Devido Custeio</th>
                                  <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Devido Capital</th>
                                  <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Devido Total</th>
                                  <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Ajuste Custeio</th>
                                  <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Ajuste Capital</th>
                                  <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Ajuste Total</th>
                                  <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Final Devido</th>
                                  <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Pago Custeio</th>
                                  <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Pago Capital</th>
                                  <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Pago Total</th>
                                  <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Data Pgto</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pddeData.destinacoes.map((dest, i) => {
                                  const fmt = (v: number | null) => v !== null ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';
                                  return (
                                    <tr key={i} className="border-b border-border/20 hover:bg-muted/30 transition-colors" data-testid={`row-destinacao-${i}`}>
                                      <td className="py-2.5 px-2 font-medium text-xs whitespace-nowrap">{dest.destinacao}</td>
                                      <td className="py-2.5 px-2 text-right font-mono text-xs">{fmt(dest.devido_custeio)}</td>
                                      <td className="py-2.5 px-2 text-right font-mono text-xs">{fmt(dest.devido_capital)}</td>
                                      <td className="py-2.5 px-2 text-right font-mono text-xs font-medium">{fmt(dest.devido_total)}</td>
                                      <td className="py-2.5 px-2 text-right font-mono text-xs">{fmt(dest.ajuste_custeio)}</td>
                                      <td className="py-2.5 px-2 text-right font-mono text-xs">{fmt(dest.ajuste_capital)}</td>
                                      <td className="py-2.5 px-2 text-right font-mono text-xs">{fmt(dest.ajuste_total)}</td>
                                      <td className="py-2.5 px-2 text-right font-mono text-xs font-medium">{fmt(dest.final_devido_total)}</td>
                                      <td className="py-2.5 px-2 text-right font-mono text-xs">{fmt(dest.pago_custeio)}</td>
                                      <td className="py-2.5 px-2 text-right font-mono text-xs">{fmt(dest.pago_capital)}</td>
                                      <td className="py-2.5 px-2 text-right font-mono text-xs">
                                        {dest.pago_total !== null
                                          ? <span className="text-primary font-medium">{fmt(dest.pago_total)}</span>
                                          : <span className="text-muted-foreground">—</span>}
                                      </td>
                                      <td className="py-2.5 px-2 text-xs text-muted-foreground whitespace-nowrap">{dest.data_ordem_pgto || '—'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="border-t-2 border-border/50 bg-muted/20">
                                  <td className="py-2.5 px-2 font-bold text-xs">TOTAL</td>
                                  <td className="py-2.5 px-2 text-right font-mono text-xs font-bold">
                                    R$ {pddeData.destinacoes.reduce((s, d) => s + (d.devido_custeio || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2.5 px-2 text-right font-mono text-xs font-bold">
                                    R$ {pddeData.destinacoes.reduce((s, d) => s + (d.devido_capital || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2.5 px-2 text-right font-mono text-xs font-bold">
                                    R$ {pddeData.destinacoes.reduce((s, d) => s + (d.devido_total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2.5 px-2 text-right font-mono text-xs font-bold">
                                    R$ {pddeData.destinacoes.reduce((s, d) => s + (d.ajuste_custeio || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2.5 px-2 text-right font-mono text-xs font-bold">
                                    R$ {pddeData.destinacoes.reduce((s, d) => s + (d.ajuste_capital || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2.5 px-2 text-right font-mono text-xs font-bold">
                                    R$ {pddeData.destinacoes.reduce((s, d) => s + (d.ajuste_total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2.5 px-2 text-right font-mono text-xs font-bold">
                                    R$ {pddeData.destinacoes.reduce((s, d) => s + (d.final_devido_total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2.5 px-2 text-right font-mono text-xs font-bold">
                                    R$ {pddeData.destinacoes.reduce((s, d) => s + (d.pago_custeio || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2.5 px-2 text-right font-mono text-xs font-bold">
                                    R$ {pddeData.destinacoes.reduce((s, d) => s + (d.pago_capital || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2.5 px-2 text-right font-mono text-xs font-bold text-primary">
                                    R$ {pddeData.destinacoes.reduce((s, d) => s + (d.pago_total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2.5 px-2"></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {/* Summary cards for quick view */}
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
                            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20" data-testid="text-pdde-total-devido">
                              <p className="text-xs text-muted-foreground mb-1">Total Devido</p>
                              <p className="text-lg font-bold text-primary">
                                R$ {pddeData.destinacoes.reduce((s, d) => s + (d.devido_total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/50" data-testid="text-pdde-ajuste-total">
                              <p className="text-xs text-muted-foreground mb-1">Ajustes</p>
                              <p className="text-lg font-bold">
                                R$ {pddeData.destinacoes.reduce((s, d) => s + (d.ajuste_total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/50" data-testid="text-pdde-final-devido">
                              <p className="text-xs text-muted-foreground mb-1">Final Devido</p>
                              <p className="text-lg font-bold">
                                R$ {pddeData.destinacoes.reduce((s, d) => s + (d.final_devido_total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20" data-testid="text-pdde-total-pago">
                              <p className="text-xs text-muted-foreground mb-1">Total Pago</p>
                              <p className="text-lg font-bold text-accent">
                                R$ {pddeData.destinacoes.reduce((s, d) => s + (d.pago_total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/50" data-testid="text-pdde-custeio">
                              <p className="text-xs text-muted-foreground mb-1">Pago Custeio</p>
                              <p className="text-lg font-bold">
                                R$ {pddeData.destinacoes.reduce((s, d) => s + (d.pago_custeio || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/50" data-testid="text-pdde-capital">
                              <p className="text-xs text-muted-foreground mb-1">Pago Capital</p>
                              <p className="text-lg font-bold">
                                R$ {pddeData.destinacoes.reduce((s, d) => s + (d.pago_capital || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Matrículas detalhadas PDDE */}
                      {pddeData.matriculas_por_nivel && Object.keys(pddeData.matriculas_por_nivel).length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-3 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-sky-600" />
                            Matrículas por Nível ({pddeData.ano})
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {Object.entries(pddeData.matriculas_por_nivel).map(([nivel, qtd]) => (
                              <div key={nivel} className="p-3 rounded-xl bg-background border border-border/30">
                                <p className="text-xs text-muted-foreground mb-1">{nivel}</p>
                                <p className="text-xl font-bold">{qtd}</p>
                              </div>
                            ))}
                            {pddeEnrollTotal && (
                              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20" data-testid="text-pdde-matriculas-total">
                                <p className="text-xs text-muted-foreground mb-1">Total</p>
                                <p className="text-xl font-bold text-primary">{pddeEnrollTotal}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">{pddeData?.error || 'Não foi possível consultar o FNDE.'}</p>
                      <p className="text-xs text-muted-foreground mt-1">Tente outro ano ou verifique o código INEP.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 6. Infraestrutura */}
            {viewMode === 'completo' && <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  O Que a Escola Tem
                </CardTitle>
                <CardDescription>Estrutura registrada no Censo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <InfraItem icon={Library} label="Biblioteca" available={infraData.biblioteca} />
                  <InfraItem icon={Dumbbell} label="Quadra" available={infraData.quadra} />
                  <InfraItem icon={Monitor} label="Sala de Computadores" available={infraData.laboratorio} />
                  <InfraItem icon={Wifi} label="Internet" available={infraData.internet} />
                  <InfraItem icon={Accessibility} label="Acesso para cadeirantes" available={infraData.acessibilidade} />
                  <div className="p-4 rounded-xl bg-muted/50 text-center">
                    <Monitor className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">{infraData.computadores}</p>
                    <p className="text-xs text-muted-foreground">Computadores</p>
                  </div>
                </div>
              </CardContent>
            </Card>}

            {/* 7. Repasses Públicos (FNDE) */}
            {viewMode === 'completo' && <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-accent" />
                  Dinheiro que a Escola Recebeu do Governo
                </CardTitle>
                <CardDescription>Valores enviados pelo FNDE (governo federal)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <p className="text-sm text-muted-foreground mb-3">Quanto veio por ano</p>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={repassesData}>
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
                    <p className="text-sm text-muted-foreground">Por tipo de verba (2024)</p>
                    <ProgramCard name="PDDE" value={lastRepasse.pdde} year="2024" />
                    <ProgramCard name="PNAE" value={lastRepasse.pnae} year="2024" />
                    <ProgramCard name="PNATE" value={lastRepasse.pnate} year="—" empty />
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 mt-4">
                      <p className="text-xs text-muted-foreground">Total recebido em 2024</p>
                      <p className="text-xl font-bold text-primary">R$ {lastRepasse.total.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>}

            {/* 8. Ações do PDDE */}
            {viewMode === 'completo' && <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Verbas Extras do PDDE
                </CardTitle>
                <CardDescription>Programas que a escola participa e quanto recebe de cada um</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {acoesPddeData.map((acao) => (
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
            </Card>}

            {/* 9. Regularidade e Prestação de Contas */}
            {viewMode === 'completo' && <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Contas Prestadas ao Governo
                </CardTitle>
                <CardDescription>Situação das prestações de contas do dinheiro recebido</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Como estão as contas dos últimos anos</p>
                    <div className="space-y-2">
                      {prestacaoData.map((item) => (
                        <div key={item.exercicio} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                          <span className="font-medium">Ano de {item.exercicio}</span>
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
                      <p className="text-xs text-muted-foreground mb-1">Último ano com situação</p>
                      <p className="text-2xl font-bold">{ultimoPrestacao.exercicio}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-xs text-amber-700 mb-1">Anos pendentes</p>
                      <p className="text-2xl font-bold text-amber-700">{defasagemCiclos} {defasagemCiclos === 1 ? 'ano' : 'anos'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>}

            {/* 10. Conselho Escolar */}
            {viewMode === 'completo' && <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Users2 className="w-5 h-5 text-accent" />
                  Conselho Escolar
                </CardTitle>
                <CardDescription>Grupo de pais, professores e funcionários que cuida da escola</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Como está</p>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      <p className="text-lg font-bold text-primary">{CONSELHO.situacao}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Última vez que atualizou</p>
                    <p className="text-lg font-bold">{CONSELHO.ultimaAtualizacao}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Quando precisa renovar</p>
                    <p className="text-lg font-bold">{CONSELHO.proximaRenovacao}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Quantas pessoas</p>
                    <p className="text-lg font-bold">{CONSELHO.membros}</p>
                  </div>
                </div>
              </CardContent>
            </Card>}

            {/* 11. VAAR */}
            {viewMode === 'completo' && <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-sky-600" />
                  VAAR - Bônus por Bons Resultados
                </CardTitle>
                <CardDescription>Dinheiro extra que a escola pode ganhar se atingir metas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                      <div>
                        <p className="font-bold text-lg">Pode participar</p>
                        <p className="text-sm text-muted-foreground">A escola cumpre o que precisa</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">O que a escola precisa ter</p>
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
            </Card>}

            {/* 12. Elegibilidade a Programas Federais */}
            {viewMode === 'completo' && <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Outros Programas que a Escola Pode Participar
                </CardTitle>
                <CardDescription>Veja quais verbas extras a escola pode receber do governo federal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {ELEGIBILIDADE_PROGRAMAS.map((programa) => (
                    <div key={programa.nome} className={`p-4 rounded-xl border ${
                      programa.status === 'Já participa' ? 'bg-primary/5 border-primary/20' :
                      programa.elegivel ? 'bg-sky-50 border-sky-200' : 
                      'bg-muted/30 border-border/50'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">{programa.nome}</h4>
                        <Badge className={
                          programa.status === 'Já participa' ? 'bg-primary text-primary-foreground' :
                          programa.elegivel ? 'bg-sky-100 text-sky-700' :
                          'bg-muted text-muted-foreground'
                        }>
                          {programa.status}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        {programa.criterios.map((c) => (
                          <div key={c.nome} className="flex items-center gap-2 text-xs">
                            {c.atendido ? (
                              <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                            )}
                            <span className={c.atendido ? 'text-muted-foreground' : 'text-amber-600'}>{c.nome}</span>
                          </div>
                        ))}
                      </div>
                      {programa.observacao && (
                        <p className="text-xs text-muted-foreground italic border-t border-border/30 pt-2">
                          {programa.observacao}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Links dos Sistemas */}
                <div className="border-t border-border/30 pt-5">
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-sky-600" />
                    Sites pra você acessar
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {LINKS_PROGRAMAS.map((link) => (
                      <a
                        key={link.nome}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-muted/30 hover:bg-accent/10 border border-transparent hover:border-accent/20 transition-all group"
                        data-testid={`link-${link.nome.toLowerCase().replace(/\s/g, '-')}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm group-hover:text-accent transition-colors">{link.nome}</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-accent transition-colors" />
                        </div>
                        <p className="text-xs text-muted-foreground">{link.descricao}</p>
                      </a>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>}

            {/* 13. Conectividade (Escola Conectada) */}
            {viewMode === 'completo' && <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-sky-600" />
                  Internet na Escola
                </CardTitle>
                <CardDescription>Como está a conexão com a internet e os computadores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Wifi className="w-5 h-5 text-primary" />
                      <p className="text-xs text-muted-foreground">Situação</p>
                    </div>
                    <p className="text-lg font-bold text-primary">{CONECTIVIDADE.situacaoGIGA}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Tipo de internet</p>
                    <p className="text-lg font-bold">{CONECTIVIDADE.tipoConexao}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Velocidade</p>
                    <p className="text-lg font-bold">{CONECTIVIDADE.velocidade}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Quantos Wi-Fi</p>
                    <p className="text-lg font-bold">{CONECTIVIDADE.pontosWifi}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">De onde vem a internet</p>
                    <p className="text-sm font-medium">{CONECTIVIDADE.fonteConexao}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Empresa</p>
                    <p className="text-sm font-medium">{CONECTIVIDADE.operadora}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Quando foi instalado</p>
                    <p className="text-sm font-medium">{CONECTIVIDADE.dataInstalacao}</p>
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-xl bg-sky-50 border border-sky-200">
                  <div className="flex items-start gap-3">
                    <Monitor className="w-5 h-5 text-sky-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-sky-800">
                        {CONECTIVIDADE.computadoresConectados} computadores funcionando com internet
                      </p>
                      <p className="text-xs text-sky-600 mt-1">
                        Programa Escola Conectada funcionando desde 2022
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>}

            {/* 14. Comparadores (Benchmark) */}
            {viewMode === 'completo' && <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-accent" />
                  Comparando com Outras Escolas
                </CardTitle>
                <CardDescription>Veja como a escola está em relação às outras da cidade e do estado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Dinheiro por aluno</p>
                    <div className="space-y-3">
                      <BenchmarkBar label="Esta escola" value={BENCHMARK.repasseEscola} max={100} highlight />
                      <BenchmarkBar label="Outras da cidade" value={BENCHMARK.repasseMunicipal} max={100} />
                      <BenchmarkBar label="Outras do estado" value={BENCHMARK.repasseEstadual} max={100} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      <span className={BENCHMARK.repasseEscola < BENCHMARK.repasseMunicipal ? 'text-amber-600' : 'text-primary'}>
                        {BENCHMARK.repasseEscola < BENCHMARK.repasseMunicipal ? 'Recebe menos que' : 'Recebe mais que'} as outras escolas da cidade
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Nota IDEB</p>
                    <div className="space-y-3">
                      <BenchmarkBar label="Esta escola" value={BENCHMARK.idebEscola} max={10} highlight />
                      <BenchmarkBar label="Outras da cidade" value={BENCHMARK.idebMunicipal} max={10} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      <span className="text-primary">Nota melhor que as outras escolas da cidade</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>}

            {/* 15. Calendário Interativo */}
            {viewMode === 'completo' && <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-amber-600" />
                  Calendário do Ano - Fique de Olho!
                </CardTitle>
                <CardDescription>Todas as datas importantes de adesão, censo e prestação de contas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Calendário Visual */}
                  <div className="lg:col-span-2">
                    {/* Legenda */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Object.entries(TIPO_LABELS).map(([tipo, label]) => (
                        <div key={tipo} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${TIPO_CORES[tipo].bg} ${TIPO_CORES[tipo].text} text-xs`}>
                          <div className={`w-2 h-2 rounded-full ${TIPO_CORES[tipo].bg} border ${TIPO_CORES[tipo].border}`} />
                          {label}
                        </div>
                      ))}
                    </div>
                    
                    {/* Grade de Meses */}
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mes) => {
                        const eventosMes = calendarioData.filter(e => e.mes === mes);
                        const temUrgente = eventosMes.some(e => e.urgente);
                        return (
                          <div 
                            key={mes} 
                            className={`p-3 rounded-xl border ${temUrgente ? 'border-red-300 bg-red-50' : 'border-border/50 bg-muted/30'} relative`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-bold text-sm ${temUrgente ? 'text-red-700' : ''}`}>{MESES_NOMES[mes]}</span>
                              {eventosMes.length > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${temUrgente ? 'bg-red-200 text-red-700' : 'bg-muted text-muted-foreground'}`}>
                                  {eventosMes.length}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              {eventosMes.slice(0, 2).map((evento, i) => (
                                <div 
                                  key={i} 
                                  className={`text-xs p-1.5 rounded-lg ${TIPO_CORES[evento.tipo].bg} ${TIPO_CORES[evento.tipo].text} truncate`}
                                  title={`${evento.dia}/${evento.mes} - ${evento.evento}`}
                                >
                                  <span className="font-medium">{evento.dia}</span> - {evento.evento.split(' ').slice(0, 2).join(' ')}...
                                </div>
                              ))}
                              {eventosMes.length > 2 && (
                                <p className="text-xs text-muted-foreground text-center">+{eventosMes.length - 2} mais</p>
                              )}
                              {eventosMes.length === 0 && (
                                <p className="text-xs text-muted-foreground italic">Sem eventos</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Lista de Próximos Eventos e Alertas */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        Próximos Prazos Urgentes
                      </p>
                      <div className="space-y-2">
                        {calendarioData.filter(e => e.urgente).slice(0, 3).map((evento, i) => (
                          <div key={i} className="p-3 rounded-xl bg-red-50 border border-red-200">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                <span className="text-xs font-bold text-red-700">{evento.dia}</span>
                              </div>
                              <div>
                                <p className="text-xs text-red-600">{MESES_NOMES[evento.mes]}/{evento.ano}</p>
                                <p className="text-sm font-medium text-red-800">{evento.evento}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border-t border-border/30 pt-4">
                      <p className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4 text-sky-600" />
                        Avisos Importantes
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="p-3 rounded-xl bg-muted/50">
                          <p className="text-muted-foreground">Último dinheiro PDDE: <strong className="text-foreground">2024</strong></p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/50">
                          <p className="text-muted-foreground">Última conta prestada: <strong className="text-foreground">2023</strong></p>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                          <p className="text-amber-700">Anos pendentes: <strong>{defasagemCiclos}</strong></p>
                        </div>
                        <div className={`p-3 rounded-xl ${parseFloat(enrollmentVariation) < -5 ? 'bg-amber-50 border border-amber-200' : 'bg-muted/50'}`}>
                          <p className={parseFloat(enrollmentVariation) < -5 ? 'text-amber-700' : 'text-muted-foreground'}>
                            Alunos: <strong className={parseFloat(enrollmentVariation) < -5 ? '' : 'text-foreground'}>{enrollmentVariation}%</strong> vs ano passado
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>}

            {/* 16. Indicadores Derivados */}
            {viewMode === 'completo' && <Card className="card-clay">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Resumo em Números
                </CardTitle>
                <CardDescription>Cálculos que fizemos pra você com os dados públicos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <IndicatorCard label="Quanto cada aluno custou (2024)" value={`R$ ${repassePerAluno}`} subtitle="Verba total ÷ alunos" />
                  <IndicatorCard label="Verba comparando com ano passado" value="-39%" subtitle="2024 vs 2023 (ainda incompleto)" negative />
                  <IndicatorCard label="Último dinheiro do PDDE" value="2024" subtitle="Veio este ano" />
                  <IndicatorCard label="Alunos comparando com ano passado" value={`${enrollmentVariation}%`} subtitle="2024 vs 2023" negative={parseFloat(enrollmentVariation) < 0} />
                </div>
              </CardContent>
            </Card>}

            {/* 17. Fontes e Transparência */}
            {viewMode === 'completo' && <Card className="card-clay bg-muted/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-bold mb-2">De Onde Tiramos Esses Dados</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• <strong>Alunos e Estrutura:</strong> Censo Escolar do INEP</p>
                      <p>• <strong>Notas e Aprovação:</strong> INEP</p>
                      <p>• <strong>Dinheiro recebido:</strong> FNDE - Portal de Liberações</p>
                      <p>• <strong>Prestação de Contas:</strong> FNDE - SIGPC Público</p>
                      <p>• <strong>UEx, Contas, Repasses:</strong> FNDE - PDDEInfo (consulta em tempo real)</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-background border border-border/50 text-sm text-muted-foreground">
                  <p className="mb-2"><strong>Importante:</strong> Aqui só mostramos o que é público na internet. Não mostramos saldo do banco, gastos ou extratos da escola.</p>
                  <p>Os números que calculamos usam os dados públicos de repasses e matrículas.</p>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" size="sm" className="rounded-lg" data-testid="button-export-pdf">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar em PDF
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-lg" data-testid="button-export-json">
                    <FileText className="w-4 h-4 mr-2" />
                    Baixar Dados
                  </Button>
                </div>
              </CardContent>
            </Card>}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Coloque o Código da Escola</h3>
            <p className="text-muted-foreground max-w-sm">Coloque os 8 números do código INEP da escola pra ver os dados públicos.</p>
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
