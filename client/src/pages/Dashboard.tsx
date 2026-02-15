import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DashboardDataset } from "@shared/schema";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, Users, ArrowRight, 
  MapPin, Calendar, Banknote, 
  GraduationCap, Info, ExternalLink,
  School, Loader2, List, LayoutGrid, Link2,
  BarChart3
} from "lucide-react";
import { useSchoolSearch, useSchool } from "@/hooks/use-schools";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LINKS_PROGRAMAS = [
  { nome: 'PDDE Interativo', descricao: 'Onde você faz cadastros e adesões', url: 'https://pddeinterativo.mec.gov.br' },
  { nome: 'Portal FNDE', descricao: 'Tudo sobre as verbas federais', url: 'https://www.fnde.gov.br' },
  { nome: 'Consulta Escola', descricao: 'Dados da sua escola no INEP', url: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/inep-data/consulta-matricula' },
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInep, setSelectedInep] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'resumido' | 'completo'>('resumido');
  
  const { data: searchResults, refetch: refetchSearch, isLoading: searchLoading } = useSchoolSearch(searchQuery);
  const { data: school, isLoading: schoolLoading } = useSchool(selectedInep || "");
  
  const { data: datasets = [] } = useQuery<DashboardDataset[]>({
    queryKey: ["/api/dashboard/datasets"],
  });

  function getDataset(category: string) {
    return datasets.find(d => d.category === category);
  }

  const repassesData = getDataset('repasses')?.data as any[] | null;
  const enrollmentData = getDataset('enrollment')?.data as any[] | null;
  const icgData = getDataset('icg')?.data as any[] | null;
  const inseData = getDataset('inse')?.data as any[] | null;
  const tdiData = getDataset('tdi')?.data as any[] | null;
  const irdData = getDataset('ird')?.data as any[] | null;
  const dsuData = getDataset('dsu')?.data as any[] | null;
  const hadData = getDataset('had')?.data as any[] | null;
  const atuData = getDataset('atu')?.data as any[] | null;
  const iedData = getDataset('ied')?.data as any[] | null;
  const afdData = getDataset('afd')?.data as any[] | null;
  const idebData = getDataset('ideb')?.data as any[] | null;

  const latestUpdate = datasets.length > 0
    ? datasets.reduce((latest, d) => {
        const dt = d.lastUpdated ? new Date(d.lastUpdated) : new Date(0);
        return dt > latest ? dt : latest;
      }, new Date(0))
    : null;

  const lastRepasse = repassesData?.[repassesData.length - 1];
  
  const repassePerAluno = useMemo(() => {
    const totalAlunos = (school?.enrollmentCount ?? enrollmentData?.[enrollmentData.length - 1]?.total) as number | null | undefined;
    if (lastRepasse && typeof totalAlunos === 'number' && totalAlunos > 0) {
      return (lastRepasse.total / totalAlunos).toFixed(2);
    }
    return null;
  }, [lastRepasse, school?.enrollmentCount, enrollmentData]);

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
                    if (e.key === 'Enter') refetchSearch();
                  }}
                />
                
                {searchResults && searchResults.length > 0 && !selectedInep && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                    {searchResults.map((result: any) => (
                      <button
                        key={result.id}
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
                {latestUpdate && latestUpdate.getTime() > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Dados atualizados em: {latestUpdate.toLocaleDateString('pt-BR')}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant={viewMode === 'resumido' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('resumido')}
                    className="text-xs"
                  >
                    <List className="w-3 h-3 mr-1" />
                    Resumido
                  </Button>
                  <Button
                    variant={viewMode === 'completo' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('completo')}
                    className="text-xs"
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
            <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
              <CardContent className="p-4">
                <p className="text-emerald-800 leading-relaxed">
                  <strong>Olá!</strong> Aqui você vê um resumo da sua escola baseado nos dados cadastrados na nossa plataforma.
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
                      {school?.enrollmentCount ?? '—'}
                    </p>
                    <p className="text-sm font-medium text-foreground">Alunos matriculados</p>
                  </div>
                </div>
              </Card>
              
              <Card className="card-clay p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Banknote className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    {lastRepasse ? (
                      <>
                        <p className="text-3xl font-bold text-accent">R$ {lastRepasse.total.toLocaleString('pt-BR')}</p>
                        <p className="text-sm font-medium text-foreground">Recebido em {lastRepasse.year || '—'}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-muted-foreground">—</p>
                        <p className="text-sm font-medium text-foreground">Repasses</p>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {viewMode === 'completo' && (
              <Card className="card-clay">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    Detalhes da Escola
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoItem label="Nome" value={school?.name} />
                    <InfoItem label="INEP" value={school?.inep} mono />
                    <InfoItem label="Cidade" value={school?.city} />
                    <InfoItem label="Estado" value={school?.state} />
                    <InfoItem label="Rede" value={school?.network} />
                    <InfoItem label="Localização" value={school?.location} />
                    <InfoItem label="Situação dos Dados" value={school?.dataStatus} />
                    {repassePerAluno && (
                      <InfoItem label="Repasse por Aluno" value={`R$ ${repassePerAluno}`} highlight />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {viewMode === 'completo' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="card-clay">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Indicadores de Contexto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem label="ICG (Complexidade)" value={icgData?.[0]?.valor} />
                      <InfoItem label="INSE (Socioeconômico)" value={inseData?.[0]?.valor} />
                      <InfoItem label="IED (Esforço Docente)" value={iedData?.[0]?.valor} />
                      <InfoItem label="AFD (Formação Docente)" value={afdData?.[0]?.valor} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-clay">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-accent" />
                      Indicadores de Desempenho
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem label="IDEB" value={idebData?.[0]?.valor || idebData?.[0]?.escola} />
                      <InfoItem label="TDI (Distorção)" value={tdiData?.[0]?.valor} />
                      <InfoItem label="ATU (Alunos/Turma)" value={atuData?.[0]?.valor} />
                      <InfoItem label="HAD (Horas-aula)" value={hadData?.[0]?.valor} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

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

function InfoItem({ label, value, mono, highlight }: { label: string; value: string | number | null | undefined; mono?: boolean; highlight?: boolean }) {
  if (value === null || value === undefined) return null;
  const displayValue = String(value);
  return (
    <div className="p-3 rounded-xl bg-muted/30">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`font-medium ${mono ? 'font-mono' : ''} ${highlight ? 'text-primary font-bold text-lg' : ''}`}>{displayValue}</p>
    </div>
  );
}
