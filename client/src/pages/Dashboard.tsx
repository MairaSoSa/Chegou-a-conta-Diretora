import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertCircle, TrendingUp, DollarSign, Users, ArrowRight, MapPin, Building, CheckCircle2, AlertTriangle, Calendar, FileText, Banknote, Clock } from "lucide-react";
import { useSchoolSearch, useSchool } from "@/hooks/use-schools";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const DEMO_SCHOOL = {
  id: 0,
  inep: "00000000",
  name: "Escola Municipal Monteiro Lobato",
  city: "Sítio do Picapau Amarelo",
  state: "SP",
  network: "Municipal",
  location: "Urbana",
  enrollmentCount: 342,
  dataStatus: "Completo"
};

const MOCK_FINANCIAL_DATA = [
  { month: 'Jan', pdde: 4200, pnae: 2800 },
  { month: 'Fev', pdde: 0, pnae: 2800 },
  { month: 'Mar', pdde: 0, pnae: 2800 },
  { month: 'Abr', pdde: 4200, pnae: 2800 },
  { month: 'Mai', pdde: 0, pnae: 2800 },
  { month: 'Jun', pdde: 0, pnae: 2800 },
];

const EXPENSE_DATA = [
  { name: 'Material Pedagógico', value: 4500, color: '#166534' },
  { name: 'Manutenção', value: 3200, color: '#a0522d' },
  { name: 'Equipamentos', value: 2100, color: '#0c4a6e' },
  { name: 'Alimentação', value: 5600, color: '#b45309' },
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInep, setSelectedInep] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(true);
  
  const { data: searchResults, isLoading: isSearching } = useSchoolSearch(searchQuery);
  const { data: school, isLoading: isLoadingSchool } = useSchool(selectedInep || "");

  const displaySchool = selectedInep && school ? school : (showDemo ? DEMO_SCHOOL : null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">Dashboard Escolar</h1>
            <p className="text-muted-foreground">Visão geral dos recursos e pendências.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar escola por INEP ou nome..." 
              className="pl-10 bg-card border-border/50 focus:border-accent/50 transition-all h-12 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-school-search"
            />
            
            {searchResults && searchResults.length > 0 && !selectedInep && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                {searchResults.map((result: any) => (
                  <button
                    key={result.id}
                    className="w-full text-left px-4 py-3 hover:bg-accent/5 border-b border-border/30 last:border-0 transition-colors flex justify-between items-center group"
                    onClick={() => {
                      setSelectedInep(result.inep);
                      setSearchQuery("");
                      setShowDemo(false);
                    }}
                    data-testid={`button-select-school-${result.inep}`}
                  >
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-accent transition-colors">{result.name}</p>
                      <p className="text-xs text-muted-foreground">{result.inep} - {result.city}/{result.state}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Demo Banner */}
        {showDemo && !selectedInep && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-green-50 border border-accent/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Visualização de Demonstração</p>
              <p className="text-sm text-muted-foreground">Dados fictícios para exemplo. Busque sua escola pelo INEP para ver dados reais.</p>
            </div>
          </div>
        )}

        {displaySchool ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* School Header Card */}
            <Card className="card-clay overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <Badge className="mb-3 bg-white/80 text-accent border-0 font-mono" data-testid="badge-inep">
                      INEP: {displaySchool.inep}
                    </Badge>
                    <h2 className="text-2xl font-display font-bold text-foreground mb-2" data-testid="text-school-name">
                      {displaySchool.name}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-accent" />
                        {displaySchool.city} - {displaySchool.state}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-accent" />
                        {displaySchool.network} ({displaySchool.location})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-accent" />
                        {displaySchool.enrollmentCount} alunos
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-primary/15 text-primary border-0 self-start" data-testid="badge-status">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Situação Regular
                  </Badge>
                </div>
              </div>
            </Card>
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-card/80 border border-border/40 p-1.5 mb-8 rounded-xl h-auto">
                <TabsTrigger value="overview" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="tab-overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="pdde" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="tab-pdde">PDDE</TabsTrigger>
                <TabsTrigger value="pnae" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="tab-pnae">PNAE</TabsTrigger>
                <TabsTrigger value="alerts" className="rounded-lg py-2.5 text-amber-600 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-600" data-testid="tab-alerts">Alertas</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <StatCard 
                    title="Saldo PDDE" 
                    value="R$ 8.400,00" 
                    icon={DollarSign} 
                    subtitle="Custeio + Capital"
                    color="primary"
                  />
                  <StatCard 
                    title="Saldo PNAE" 
                    value="R$ 5.600,00" 
                    icon={Banknote} 
                    subtitle="Alimentação"
                    color="accent"
                  />
                  <StatCard 
                    title="Alunos" 
                    value={displaySchool.enrollmentCount.toString()} 
                    icon={Users} 
                    subtitle="Matriculados"
                    color="blue"
                  />
                  <StatCard 
                    title="Prestação" 
                    value="32 dias" 
                    icon={Clock} 
                    subtitle="Prazo restante"
                    color="amber"
                  />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="card-clay lg:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-display text-lg">Histórico de Recebimentos</CardTitle>
                      <CardDescription>PDDE e PNAE nos últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={MOCK_FINANCIAL_DATA}>
                          <defs>
                            <linearGradient id="colorPdde" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#166534" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorPnae" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a0522d" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#a0522d" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Area type="monotone" dataKey="pdde" name="PDDE" stroke="#166534" strokeWidth={2} fillOpacity={1} fill="url(#colorPdde)" />
                          <Area type="monotone" dataKey="pnae" name="PNAE" stroke="#a0522d" strokeWidth={2} fillOpacity={1} fill="url(#colorPnae)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="card-clay">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-display text-lg">Despesas por Categoria</CardTitle>
                      <CardDescription>Distribuição do período</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={EXPENSE_DATA}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {EXPENSE_DATA.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-3 -mt-4">
                        {EXPENSE_DATA.map((item) => (
                          <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            {item.name}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Transactions */}
                <Card className="card-clay">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-lg">Últimas Movimentações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { date: '28/01', desc: 'Compra Material Didático', value: '-R$ 850,00', type: 'expense' },
                        { date: '25/01', desc: 'Recebimento PDDE Custeio', value: '+R$ 4.200,00', type: 'income' },
                        { date: '20/01', desc: 'Manutenção Elétrica', value: '-R$ 620,00', type: 'expense' },
                        { date: '15/01', desc: 'Recebimento PNAE', value: '+R$ 2.800,00', type: 'income' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.type === 'income' ? 'bg-primary/10' : 'bg-accent/10'}`}>
                              {item.type === 'income' ? (
                                <TrendingUp className="w-4 h-4 text-primary" />
                              ) : (
                                <FileText className="w-4 h-4 text-accent" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{item.desc}</p>
                              <p className="text-xs text-muted-foreground">{item.date}/2024</p>
                            </div>
                          </div>
                          <span className={`font-mono font-semibold text-sm ${item.type === 'income' ? 'text-primary' : 'text-foreground'}`}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pdde">
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <StatCard title="Custeio" value="R$ 5.200,00" icon={DollarSign} subtitle="Saldo disponível" color="primary" />
                    <StatCard title="Capital" value="R$ 3.200,00" icon={Banknote} subtitle="Saldo disponível" color="accent" />
                    <StatCard title="Executado" value="68%" icon={TrendingUp} subtitle="Do total recebido" color="blue" />
                  </div>
                  <Card className="card-clay">
                    <CardHeader>
                      <CardTitle className="font-display">Programa Dinheiro Direto na Escola</CardTitle>
                      <CardDescription>Recursos federais para manutenção e melhoria da escola</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-4 rounded-xl bg-muted/50">
                          <p className="text-muted-foreground mb-1">Última Parcela</p>
                          <p className="font-semibold">R$ 4.200,00 em 25/01/2024</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50">
                          <p className="text-muted-foreground mb-1">Próxima Previsão</p>
                          <p className="font-semibold">Abril/2024</p>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <p className="text-sm text-primary font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Prestação de contas 2023 aprovada
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="pnae">
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <StatCard title="Saldo Atual" value="R$ 5.600,00" icon={DollarSign} subtitle="Alimentação escolar" color="accent" />
                    <StatCard title="Refeições/Dia" value="342" icon={Users} subtitle="Média atendida" color="primary" />
                    <StatCard title="Agric. Familiar" value="42%" icon={TrendingUp} subtitle="Das compras" color="blue" />
                  </div>
                  <Card className="card-clay">
                    <CardHeader>
                      <CardTitle className="font-display">Alimentação Escolar</CardTitle>
                      <CardDescription>Recursos do PNAE para merenda e nutrição</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-4 rounded-xl bg-muted/50">
                          <p className="text-muted-foreground mb-1">Repasse Mensal</p>
                          <p className="font-semibold">R$ 2.800,00</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50">
                          <p className="text-muted-foreground mb-1">Valor/Aluno/Dia</p>
                          <p className="font-semibold">R$ 0,36</p>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <p className="text-sm text-amber-600 font-medium flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Mínimo de 30% deve ser agricultura familiar
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="alerts">
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-display font-bold text-amber-800">Prestação de Contas PDDE 2024</h4>
                      <p className="text-sm text-amber-700 mt-1">O prazo para envio encerra em 32 dias (28/02/2024). Prepare os documentos.</p>
                      <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg" data-testid="button-resolve-alert">
                        Ver Checklist
                      </Button>
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-green-50 border border-green-200 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-display font-bold text-green-800">Ata de Deliberação Atualizada</h4>
                      <p className="text-sm text-green-700 mt-1">A última reunião do Conselho foi registrada corretamente em 15/01/2024.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-display font-bold mb-2">Nenhuma escola selecionada</h3>
            <p className="text-muted-foreground max-w-sm">Utilize a barra de pesquisa para encontrar os dados da sua escola pelo nome ou código INEP.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, subtitle, color }: { title: string; value: string; icon: any; subtitle: string; color: string }) {
  const colors: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    accent: "text-accent bg-accent/10",
    blue: "text-sky-600 bg-sky-500/10",
    amber: "text-amber-600 bg-amber-500/10",
  };

  return (
    <Card className="card-clay">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`p-2 rounded-xl ${colors[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-1" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>{value}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
