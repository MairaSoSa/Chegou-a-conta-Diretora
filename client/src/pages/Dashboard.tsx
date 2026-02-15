import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DashboardDataset } from "@shared/schema";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, AlertCircle, TrendingUp, DollarSign, Users, ArrowRight, 
  MapPin, Building, CheckCircle2, Calendar, FileText, Banknote, Clock, 
  GraduationCap, BookOpen, BarChart3, AlertTriangle, Info, Download, ExternalLink,
  School, Loader2, Wifi, Library, Dumbbell, Accessibility, Monitor, 
  Users2, CalendarDays, Link2, Award, Building2,
  ChevronDown, ChevronUp, LayoutGrid, List, Landmark, CreditCard, ClipboardCheck, Hash
} from "lucide-react";
import { useSchoolSearch, useSchool } from "@/hooks/use-schools";
import { usePddeInfo } from "@/hooks/use-pdde";
import type { PddeInfo } from "@/hooks/use-pdde";
import { useSigpcLocalizar, type SigpcPrestacaoListItem } from "@/hooks/use-sigpc";
import { SigpcDetailModal } from "@/components/SigpcDetailModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from "recharts";

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

const LINKS_PROGRAMAS = [
  { nome: 'PDDE Interativo', descricao: 'Onde você faz cadastros e adesões', url: 'https://pddeinterativo.mec.gov.br' },
  { nome: 'Portal FNDE', descricao: 'Tudo sobre as verbas federais', url: 'https://www.fnde.gov.br' },
  { nome: 'Consulta Escola', descricao: 'Dados da sua escola no INEP', url: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/inep-data/consulta-matricula' },
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInep, setSelectedInep] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'resumido' | 'completo'>('resumido');
  const [pddeAno, setPddeAno] = useState(new Date().getFullYear() - 1);
  const [selectedPrestacao, setSelectedPrestacao] = useState<SigpcPrestacaoListItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const { data: searchResults } = useSchoolSearch(searchQuery);
  const { data: dbSchool } = useSchool(selectedInep || "");
  const { data: pddeData, isLoading: pddeLoading, isFetching: pddeFetching } = usePddeInfo(selectedInep, pddeAno);

  // Combine DB school data with PDDE live data
  const school = useMemo(() => {
    if (!dbSchool && !pddeData?.ok) return null;
    
    // If we have PDDE data, use it to fill or override DB data
    if (pddeData?.ok) {
      return {
        id: dbSchool?.id || 0,
        inep: (selectedInep || "") as string,
        name: (pddeData.nome_escola || dbSchool?.name || "Escola não identificada") as string,
        city: (pddeData.municipio || dbSchool?.city || "") as string,
        state: (pddeData.uf || dbSchool?.state || "") as string,
        network: (pddeData.rede || dbSchool?.network || "") as string,
        location: (dbSchool?.location || "Urbana") as string,
        enrollmentCount: (pddeData.matriculas_total || dbSchool?.enrollmentCount || 0) as number,
        dataStatus: (pddeData.ok ? "Completo" : (dbSchool?.dataStatus || "Incompleto")) as string,
        lastUpdate: Date.now()
      } as any;
    }
    
    return dbSchool;
  }, [dbSchool, pddeData, selectedInep]);

  // Extrai CNPJ da UEx para consultar prestações de contas
  const cnpjUex = useMemo(() => pddeData?.ok && pddeData.uex?.cnpj ? pddeData.uex.cnpj : null, [pddeData]);
  const { data: sigpcData, isLoading: sigpcLoading } = useSigpcLocalizar(cnpjUex || undefined, pddeAno);

  const pddeEnrollTotal = useMemo(() => {
    if (!pddeData?.ok) return null;
    return pddeData.matriculas_total
      ?? (pddeData.matriculas_por_nivel
        ? Object.values(pddeData.matriculas_por_nivel).reduce((a, b) => a + b, 0)
        : null);
  }, [pddeData]);

  const { data: datasets = [] } = useQuery<DashboardDataset[]>({
    queryKey: ["/api/dashboard/datasets"],
  });

  function getDataset(category: string) {
    return datasets.find(d => d.category === category);
  }

  const enrollmentData = getDataset('enrollment')?.data as any[] | null;
  const idebData = getDataset('ideb')?.data as any[] | null;
  const repassesData = getDataset('repasses')?.data as any[] | null;
  const prestacaoData = getDataset('prestacao')?.data as any[] | null;
  const taxasRaw = getDataset('taxas')?.data as any;
  const taxasData = taxasRaw ? (Array.isArray(taxasRaw) ? taxasRaw[0] : taxasRaw) : null;
  const infraRaw = getDataset('infraestrutura')?.data as any;
  const infraData = infraRaw ? (Array.isArray(infraRaw) ? infraRaw[0] : infraRaw) : null;
  const acoesPddeData = getDataset('acoes_pdde')?.data as any[] | null;
  const calendarioData = getDataset('calendario')?.data as any[] | null;

  const latestUpdate = datasets.length > 0
    ? datasets.reduce((latest, d) => {
        const dt = d.lastUpdated ? new Date(d.lastUpdated) : new Date(0);
        return dt > latest ? dt : latest;
      }, new Date(0))
    : null;

  const pddeSchoolFallback = useMemo(() => {
    if (selectedInep && !school && pddeData?.ok) {
      return {
        inep: selectedInep,
        name: pddeData.nome_escola || `Escola ${selectedInep}`,
        city: pddeData.municipio || '',
        state: pddeData.uf || '',
        network: pddeData.rede || '',
        location: '',
        enrollmentCount: pddeEnrollTotal || 0,
      };
    }
    return null;
  }, [selectedInep, school, pddeData, pddeEnrollTotal]);

  const displaySchool = school;

  const lastEnrollment = enrollmentData?.[enrollmentData.length - 1];
  const prevEnrollment = enrollmentData?.[enrollmentData.length - 2];
  const enrollmentVariation = lastEnrollment && prevEnrollment 
    ? ((lastEnrollment.total - prevEnrollment.total) / prevEnrollment.total * 100).toFixed(1) 
    : null;

  const lastRepasse = repassesData?.[repassesData.length - 1];
  const repassePerAluno = lastRepasse && lastEnrollment 
    ? (lastRepasse.total / lastEnrollment.total).toFixed(2)
    : null;

  const lastIdeb = idebData?.[idebData.length - 1];
  const ultimoPrestacao = prestacaoData?.[prestacaoData.length - 1];
  const defasagemCiclos = ultimoPrestacao ? 2025 - parseInt(ultimoPrestacao.exercicio) : null;

  // Processa dados do SIGPC
  const sigpcProcessado = useMemo(() => {
    if (!sigpcData?.ok || !sigpcData.prestacoes || sigpcData.prestacoes.length === 0) {
      return null;
    }

    const prestacoes = sigpcData.prestacoes;
    const totalPrestacoes = prestacoes.length;
    const valorTotal = prestacoes.reduce((acc, pc) => acc + (pc.valorConcessao || 0), 0);

    const statusCount = {
      aprovado: prestacoes.filter(pc =>
        pc.situacaoNome?.toLowerCase().includes('aprovad') ||
        pc.situacaoNome?.toLowerCase().includes('regular')
      ).length,
      pendente: prestacoes.filter(pc =>
        pc.situacaoNome?.toLowerCase().includes('pendent') ||
        pc.situacaoNome?.toLowerCase().includes('análise') ||
        pc.situacaoNome?.toLowerCase().includes('aguardando')
      ).length,
      irregular: prestacoes.filter(pc =>
        pc.situacaoNome?.toLowerCase().includes('irregular') ||
        pc.situacaoNome?.toLowerCase().includes('rejeit')
      ).length,
    };

    const maiorPendente = prestacoes.find(pc =>
      pc.situacaoNome?.toLowerCase().includes('pendent') ||
      pc.situacaoNome?.toLowerCase().includes('análise') ||
      pc.situacaoNome?.toLowerCase().includes('aguardando')
    );

    const porAno = prestacoes.reduce((acc, pc) => {
      const ano = pc.anoConcessao || 'Sem ano';
      if (!acc[ano]) acc[ano] = [];
      acc[ano].push(pc);
      return acc;
    }, {} as Record<string, typeof prestacoes>);

    const anos = Object.keys(porAno).sort((a, b) => Number(b) - Number(a));

    return {
      prestacoes,
      totalPrestacoes,
      valorTotal,
      statusCount,
      maiorPendente,
      porAno,
      anos,
    };
  }, [sigpcData]);

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
                <Badge className="bg-accent/10 text-accent border-0 font-mono">{school?.inep}</Badge>
                <span className="font-semibold">{school?.name}</span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {school?.city}/{school?.state}
                </span>
                
                <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-lg border border-border/50">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <select 
                    value={pddeAno} 
                    onChange={(e) => setPddeAno(parseInt(e.target.value))}
                    className="bg-transparent border-0 text-xs font-medium focus:ring-0 cursor-pointer outline-none"
                    data-testid="select-ano-pdde"
                  >
                    {[2025, 2024, 2023, 2022, 2021, 2020].map(year => (
                      <option key={year} value={year}>Ano {year}</option>
                    ))}
                  </select>
                </div>

                <Badge variant="outline">{school?.network || "—"}</Badge>
                <Badge variant="outline">{school?.location || "—"}</Badge>
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

        {selectedInep ? (
          <div className="space-y-6">
            {pddeLoading && selectedInep && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-sky-600 animate-spin flex-shrink-0" />
                <div>
                  <p className="font-medium text-sky-800">Buscando dados do FNDE...</p>
                  <p className="text-sm text-sky-700">Consultando informações financeiras da escola no portal do governo.</p>
                </div>
              </div>
            )}

            {pddeData && pddeData.ok && (!pddeData.contas || pddeData.contas.length === 0) && (!pddeData.destinacoes || pddeData.destinacoes.length === 0) && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-800">Sem movimentações em {pddeAno}</p>
                  <p className="text-sm text-slate-700">Não encontramos repasses ou contas ativas para este ano específico. Tente selecionar outro ano no menu acima.</p>
                </div>
              </div>
            )}

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
                          {pddeEnrollTotal ?? school?.enrollmentCount ?? '—'}
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
                        ) : lastRepasse ? (
                          <>
                            <p className="text-3xl font-bold text-accent">R$ {lastRepasse.total.toLocaleString('pt-BR')}</p>
                            <p className="text-sm font-medium text-foreground">Recebido em {lastRepasse.year || '—'}</p>
                            <p className="text-xs text-muted-foreground mt-1">Dados do CSV carregado pelo administrador</p>
                          </>
                        ) : (
                          <>
                            <p className="text-3xl font-bold text-muted-foreground">—</p>
                            <p className="text-sm font-medium text-foreground">Repasses</p>
                            <p className="text-xs text-muted-foreground mt-1">Sem dados de repasses disponíveis</p>
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

            {viewMode === 'resumido' && calendarioData && calendarioData.length > 0 && (
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

            {viewMode === 'resumido' && sigpcProcessado && (
              <>
                <Card className="card-clay border-sky-200 bg-sky-50/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-sky-600" />
                      Prestações de Contas
                    </CardTitle>
                    <CardDescription>Situação no SIGPC/FNDE</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-2xl font-bold text-green-900">{sigpcProcessado.statusCount.aprovado}</p>
                        <p className="text-xs text-green-700 mt-1">✓ Aprovadas</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-2xl font-bold text-amber-900">{sigpcProcessado.statusCount.pendente}</p>
                        <p className="text-xs text-amber-700 mt-1">⏱ Pendentes</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-2xl font-bold text-red-900">{sigpcProcessado.statusCount.irregular}</p>
                        <p className="text-xs text-red-700 mt-1">⚠ Irregulares</p>
                      </div>
                    </div>

                    {sigpcProcessado.maiorPendente && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 mb-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-amber-900">Atenção necessária</p>
                            <p className="text-xs text-amber-700 mt-1 truncate">
                              {sigpcProcessado.maiorPendente.programaNome} ({sigpcProcessado.maiorPendente.anoConcessao}) está pendente
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setViewMode('completo')}
                    >
                      Ver todas as prestações
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

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

            {viewMode === 'completo' && displaySchool && (
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

            {viewMode === 'completo' && enrollmentData && enrollmentData.length > 0 && (
              <Card className="card-clay">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Quantos Alunos Estudam Aqui
                    </CardTitle>
                    {enrollmentVariation != null && (
                      <Badge className={parseFloat(enrollmentVariation) < 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}>
                        {parseFloat(enrollmentVariation) < 0 ? 'Diminuiu' : 'Aumentou'} {Math.abs(parseFloat(enrollmentVariation))}%
                      </Badge>
                    )}
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
                          : 'Por nível'}
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
                          <p className="text-sm text-muted-foreground text-center py-4">Busque uma escola para ver os dados por nível</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {viewMode === 'completo' && taxasData && (
              <Card className="card-clay">
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
              </Card>
            )}

            {viewMode === 'completo' && idebData && idebData.length > 0 && lastIdeb && (
              <Card className="card-clay">
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
                        <p className="text-xs text-muted-foreground mb-1">Nota da escola em {lastIdeb.year}</p>
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
              </Card>
            )}

            {viewMode === 'completo' && selectedInep && (
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
                                  <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Ação</th>
                                  <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Pago Custeio</th>
                                  <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Pago Capital</th>
                                  <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Total Pago</th>
                                  <th className="text-center py-2 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">Data Pgto</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pddeData.destinacoes.map((dest, i) => (
                                  <tr key={i} className="border-b border-border/20 hover:bg-muted/30 transition-colors" data-testid={`row-dest-${i}`}>
                                    <td className="py-2 px-2 text-xs font-medium max-w-[200px] truncate" title={dest.destinacao}>{dest.destinacao}</td>
                                    <td className="py-2 px-2 text-xs max-w-[120px] truncate" title={dest.acao}>{dest.acao || '—'}</td>
                                    <td className="py-2 px-2 text-right font-mono text-xs">
                                      {dest.pago_custeio != null ? `R$ ${dest.pago_custeio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                                    </td>
                                    <td className="py-2 px-2 text-right font-mono text-xs">
                                      {dest.pago_capital != null ? `R$ ${dest.pago_capital.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                                    </td>
                                    <td className="py-2 px-2 text-right font-mono text-xs font-medium">
                                      {dest.pago_total != null ? `R$ ${dest.pago_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                                    </td>
                                    <td className="py-2 px-2 text-center font-mono text-xs text-muted-foreground">
                                      {dest.data_ordem_pgto || '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-4">
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
                            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20" data-testid="text-pdde-total">
                              <p className="text-xs text-muted-foreground mb-1">Total Pago</p>
                              <p className="text-lg font-bold text-primary">
                                R$ {pddeData.destinacoes.reduce((s, d) => s + (d.pago_total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

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

            {viewMode === 'completo' && sigpcProcessado && (
              <>
                <Card className="card-clay">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-sky-600" />
                      Prestações de Contas
                    </CardTitle>
                    <CardDescription>
                      Dados do Sistema SIGPC/FNDE • CNPJ: {cnpjUex}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                  {sigpcLoading ? (
                    <div className="py-6 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                      <p className="text-sm text-muted-foreground">Consultando prestações de contas...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Resumo */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-sky-600" />
                            <p className="text-xs text-sky-700 font-medium">Total</p>
                          </div>
                          <p className="text-2xl font-bold text-sky-900">{sigpcProcessado.totalPrestacoes}</p>
                          <p className="text-xs text-sky-600">
                            {sigpcProcessado.totalPrestacoes === 1 ? 'prestação' : 'prestações'}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <p className="text-xs text-green-700 font-medium">Aprovadas</p>
                          </div>
                          <p className="text-2xl font-bold text-green-900">{sigpcProcessado.statusCount.aprovado}</p>
                          <p className="text-xs text-green-600">
                            {sigpcProcessado.totalPrestacoes > 0 ? Math.round((sigpcProcessado.statusCount.aprovado / sigpcProcessado.totalPrestacoes) * 100) : 0}% do total
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <p className="text-xs text-amber-700 font-medium">Pendentes</p>
                          </div>
                          <p className="text-2xl font-bold text-amber-900">{sigpcProcessado.statusCount.pendente}</p>
                          <p className="text-xs text-amber-600">em análise</p>
                        </div>

                        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Banknote className="w-4 h-4 text-purple-600" />
                            <p className="text-xs text-purple-700 font-medium">Valor Total</p>
                          </div>
                          <p className="text-lg font-bold text-purple-900">
                            R$ {(sigpcProcessado.valorTotal / 1000).toFixed(0)}k
                          </p>
                          <p className="text-xs text-purple-600">em concessões</p>
                        </div>
                      </div>

                      {/* Mini gráfico de distribuição */}
                      <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                        <p className="text-xs font-medium text-slate-700 mb-3">Distribuição por Status</p>
                        <ResponsiveContainer width="100%" height={120}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Aprovadas', value: sigpcProcessado.statusCount.aprovado, fill: '#10b981' },
                                { name: 'Pendentes', value: sigpcProcessado.statusCount.pendente, fill: '#f59e0b' },
                                { name: 'Irregulares', value: sigpcProcessado.statusCount.irregular, fill: '#ef4444' }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={50}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              <Cell fill="#10b981" />
                              <Cell fill="#f59e0b" />
                              <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => [`${value} prestações`, '']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-muted-foreground">Aprovadas</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <span className="text-muted-foreground">Pendentes</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-muted-foreground">Irregulares</span>
                          </div>
                        </div>
                      </div>

                      {/* Prestações por ano */}
                      <div className="space-y-4">
                        {sigpcProcessado.anos.map((ano) => {
                          const prestacoesDoAno = sigpcProcessado.porAno[ano];
                          const valorAno = prestacoesDoAno.reduce((acc, pc) => acc + (pc.valorConcessao || 0), 0);
                          
                          return (
                            <div key={ano}>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-sky-600" />
                                  Ano {ano}
                                  <Badge variant="secondary" className="text-xs ml-2">
                                    {prestacoesDoAno.length} {prestacoesDoAno.length === 1 ? 'prestação' : 'prestações'}
                                  </Badge>
                                </h3>
                                {valorAno > 0 && (
                                  <span className="text-sm font-mono text-muted-foreground">
                                    Total: R$ {valorAno.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>

                              <div className="space-y-2">
                                {prestacoesDoAno.map((pc, idx) => (
                                  <div 
                                    key={`${pc.pcId}-${idx}`}
                                    onClick={() => {
                                      setSelectedPrestacao(pc);
                                      setModalOpen(true);
                                    }}
                                    className="p-3 rounded-lg bg-background border border-border/30 hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
                                  >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm text-foreground truncate">{pc.programaNome}</h4>
                                        {pc.entidadeNome && (
                                          <p className="text-xs text-muted-foreground truncate">{pc.entidadeNome}</p>
                                        )}
                                      </div>
                                      <Badge 
                                        variant="secondary"
                                        className={
                                          pc.situacaoNome?.toLowerCase().includes('aprovad') || pc.situacaoNome?.toLowerCase().includes('regular')
                                            ? 'bg-green-100 text-green-800 border-green-200'
                                            : pc.situacaoNome?.toLowerCase().includes('pendent') || pc.situacaoNome?.toLowerCase().includes('análise') || pc.situacaoNome?.toLowerCase().includes('aguardando')
                                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                                            : pc.situacaoNome?.toLowerCase().includes('irregular') || pc.situacaoNome?.toLowerCase().includes('rejeit')
                                            ? 'bg-red-100 text-red-800 border-red-200'
                                            : 'bg-muted text-muted-foreground'
                                        }
                                      >
                                        {pc.situacaoNome || 'Não informado'}
                                      </Badge>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4 text-xs">
                                      {pc.convenioNumero && (
                                        <div className="flex items-center gap-1">
                                          <Hash className="w-3 h-3 text-muted-foreground" />
                                          <span className="text-muted-foreground">Convênio:</span>
                                          <span className="font-mono font-medium">{pc.convenioNumero}</span>
                                        </div>
                                      )}
                                      {pc.valorConcessao && (
                                        <div className="flex items-center gap-1">
                                          <DollarSign className="w-3 h-3 text-muted-foreground" />
                                          <span className="text-muted-foreground">Valor:</span>
                                          <span className="font-mono font-medium text-primary">
                                            R$ {pc.valorConcessao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      )}
                                      {pc.faseNome && (
                                        <div className="flex items-center gap-1">
                                          <TrendingUp className="w-3 h-3 text-muted-foreground" />
                                          <span className="text-muted-foreground">Fase:</span>
                                          <span className="font-medium">{pc.faseNome}</span>
                                        </div>
                                      )}
                                      {/* @ts-ignore */}
                                      {pc.dataLimite && (
                                        <div className="flex items-center gap-1">
                                          <AlertCircle className="w-3 h-3 text-muted-foreground" />
                                          <span className="text-muted-foreground">Limite:</span>
                                          {/* @ts-ignore */}
                                          <span className="font-mono font-medium">{pc.dataLimite}</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-border/20 flex items-center justify-between">
                                      <span className="text-xs text-sky-600 group-hover:text-sky-700 font-medium flex items-center gap-1">
                                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                        Clique para ver detalhes completos
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              </>
            )}

            {viewMode === 'completo' && cnpjUex && sigpcData?.ok && (!sigpcData.prestacoes || sigpcData.prestacoes.length === 0) && (
              <Card className="card-clay border-sky-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sky-800">Sem prestações de contas encontradas</p>
                    <p className="text-sm text-sky-700">
                      Não foram encontradas prestações de contas no SIGPC para o CNPJ {cnpjUex} no ano de {pddeAno}.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {viewMode === 'completo' && selectedInep && !cnpjUex && pddeData?.ok && (
              <Card className="card-clay border-amber-200 bg-amber-50/30">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800">CNPJ da UEx não disponível</p>
                    <p className="text-sm text-amber-700">
                      Esta escola não possui CNPJ da Unidade Executora (UEx) cadastrado no FNDE. Sem o CNPJ não é possível consultar as prestações de contas no SIGPC.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {viewMode === 'completo' && infraData && (
              <Card className="card-clay">
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
              </Card>
            )}

            {viewMode === 'completo' && repassesData && repassesData.length > 0 && lastRepasse && (
              <Card className="card-clay">
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
                      <p className="text-sm text-muted-foreground">Por tipo de verba ({lastRepasse.year || '—'})</p>
                      <ProgramCard name="PDDE" value={lastRepasse.pdde} year={lastRepasse.year || '—'} />
                      <ProgramCard name="PNAE" value={lastRepasse.pnae} year={lastRepasse.year || '—'} />
                      <ProgramCard name="PNATE" value={lastRepasse.pnate} year="—" empty={!lastRepasse.pnate} />
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 mt-4">
                        <p className="text-xs text-muted-foreground">Total recebido em {lastRepasse.year || '—'}</p>
                        <p className="text-xl font-bold text-primary">R$ {lastRepasse.total.toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {viewMode === 'completo' && acoesPddeData && acoesPddeData.length > 0 && (
              <Card className="card-clay">
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
              </Card>
            )}

            {viewMode === 'completo' && prestacaoData && prestacaoData.length > 0 && ultimoPrestacao && (
              <Card className="card-clay">
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
                      {defasagemCiclos != null && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                          <p className="text-xs text-amber-700 mb-1">Anos pendentes</p>
                          <p className="text-2xl font-bold text-amber-700">{defasagemCiclos} {defasagemCiclos === 1 ? 'ano' : 'anos'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {viewMode === 'completo' && (
              <Card className="card-clay">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-primary" />
                    Sites pra Você Acessar
                  </CardTitle>
                  <CardDescription>
                    Clique para abrir em nova aba
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                </CardContent>
              </Card>
            )}

            {viewMode === 'completo' && calendarioData && calendarioData.length > 0 && (
              <Card className="card-clay">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-amber-600" />
                    Calendário do Ano - Fique de Olho!
                  </CardTitle>
                  <CardDescription>Todas as datas importantes de adesão, censo e prestação de contas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {Object.entries(TIPO_LABELS).map(([tipo, label]) => (
                          <div key={tipo} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${TIPO_CORES[tipo].bg} ${TIPO_CORES[tipo].text} text-xs`}>
                            <div className={`w-2 h-2 rounded-full ${TIPO_CORES[tipo].bg} border ${TIPO_CORES[tipo].border}`} />
                            {label}
                          </div>
                        ))}
                      </div>
                      
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
                            <p className="text-muted-foreground">Último dinheiro PDDE: <strong className="text-foreground">{pddeData?.ok ? pddeData.ano : '—'}</strong></p>
                          </div>
                          {ultimoPrestacao && (
                            <div className="p-3 rounded-xl bg-muted/50">
                              <p className="text-muted-foreground">Última conta prestada: <strong className="text-foreground">{ultimoPrestacao.exercicio}</strong></p>
                            </div>
                          )}
                          {defasagemCiclos != null && (
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                              <p className="text-amber-700">Anos pendentes: <strong>{defasagemCiclos}</strong></p>
                            </div>
                          )}
                          {enrollmentVariation != null && (
                            <div className={`p-3 rounded-xl ${parseFloat(enrollmentVariation) < -5 ? 'bg-amber-50 border border-amber-200' : 'bg-muted/50'}`}>
                              <p className={parseFloat(enrollmentVariation) < -5 ? 'text-amber-700' : 'text-muted-foreground'}>
                                Alunos: <strong className={parseFloat(enrollmentVariation) < -5 ? '' : 'text-foreground'}>{enrollmentVariation}%</strong> vs ano passado
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {viewMode === 'completo' && repassePerAluno && enrollmentVariation && (
              <Card className="card-clay">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Resumo em Números
                  </CardTitle>
                  <CardDescription>Cálculos que fizemos pra você com os dados públicos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <IndicatorCard label="Quanto cada aluno custou" value={`R$ ${repassePerAluno}`} subtitle="Verba total / alunos" />
                    <IndicatorCard label="Último dinheiro do PDDE" value={pddeData?.ok ? String(pddeData.ano) : '—'} subtitle="Fonte FNDE" />
                    <IndicatorCard label="Alunos comparando com ano passado" value={`${enrollmentVariation}%`} subtitle="Variação no período" negative={parseFloat(enrollmentVariation) < 0} />
                  </div>
                </CardContent>
              </Card>
            )}

            {viewMode === 'completo' && (
              <Card className="card-clay bg-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-bold mb-2">De Onde Tiramos Esses Dados</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>• <strong>Alunos e Estrutura:</strong> Censo Escolar do INEP</p>
                        <p>• <strong>Notas e Aprovação:</strong> INEP</p>
                        <p>• <strong>Dinheiro recebido:</strong> FNDE - Portal de Liberações</p>
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
              </Card>
            )}
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

      {/* Modal de Detalhes da Prestação SIGPC */}
      {selectedPrestacao && (
        <SigpcDetailModal 
          prestacao={selectedPrestacao}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      )}

      <Footer />
    </div>
  );
}

function InfoItem({ label, value, mono, highlight }: { label: string; value: string | null | undefined; mono?: boolean; highlight?: boolean }) {
  if (value === null || value === undefined) return null;
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
