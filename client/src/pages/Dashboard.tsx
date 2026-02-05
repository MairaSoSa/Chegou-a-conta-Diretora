import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertCircle, TrendingUp, DollarSign, Users } from "lucide-react";
import { useSchoolSearch, useSchool } from "@/hooks/use-schools";
import { SchoolCard } from "@/components/SchoolCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const MOCK_FINANCIAL_DATA = [
  { month: 'Jan', amount: 4000 },
  { month: 'Fev', amount: 3000 },
  { month: 'Mar', amount: 2000 },
  { month: 'Abr', amount: 2780 },
  { month: 'Mai', amount: 1890 },
  { month: 'Jun', amount: 2390 },
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInep, setSelectedInep] = useState<string | null>(null);
  
  const { data: searchResults, isLoading: isSearching } = useSchoolSearch(searchQuery);
  const { data: school, isLoading: isLoadingSchool } = useSchool(selectedInep || "");

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard Escolar</h1>
            <p className="text-muted-foreground">Visão geral dos recursos e pendências.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar escola por INEP ou nome..." 
              className="pl-10 bg-card border-white/10 focus:border-primary/50 transition-all h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {/* Search Results Dropdown */}
            {searchResults && searchResults.length > 0 && !selectedInep && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                {searchResults.map((result: any) => (
                  <button
                    key={result.id}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors flex justify-between items-center group"
                    onClick={() => {
                      setSelectedInep(result.inep);
                      setSearchQuery(""); // Clear search to hide dropdown
                    }}
                  >
                    <div>
                      <p className="font-semibold text-white group-hover:text-primary transition-colors">{result.name}</p>
                      <p className="text-xs text-muted-foreground">{result.inep} • {result.city}-{result.state}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedInep && school ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SchoolCard school={school} />
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-card/50 p-1 mb-8">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="pdde">PDDE</TabsTrigger>
                <TabsTrigger value="pnae">PNAE</TabsTrigger>
                <TabsTrigger value="alerts" className="text-amber-500 data-[state=active]:text-amber-400">Alertas</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard 
                    title="Saldo Total" 
                    value="R$ 12.450,00" 
                    icon={DollarSign} 
                    trend="+2.5%" 
                    color="emerald"
                  />
                  <StatCard 
                    title="Alunos Ativos" 
                    value={school.enrollmentCount.toString()} 
                    icon={Users} 
                    trend="+12" 
                    color="blue"
                  />
                  <StatCard 
                    title="Pendências" 
                    value="2" 
                    icon={AlertCircle} 
                    trend="Ação Necessária" 
                    color="amber"
                  />
                </div>

                <Card className="glass-card border-white/5">
                  <CardHeader>
                    <CardTitle>Histórico de Recebimentos</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={MOCK_FINANCIAL_DATA}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111f36', border: '1px solid #ffffff10', borderRadius: '8px' }}
                          itemStyle={{ color: '#34d399' }}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pdde">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Programa Dinheiro Direto na Escola</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Detalhes específicos do PDDE para a escola selecionada.</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="pnae">
                 <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Alimentação Escolar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Detalhes específicos do PNAE para a escola selecionada.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts">
                <div className="space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-4">
                    <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-500">Prestação de Contas Pendente</h4>
                      <p className="text-sm text-amber-500/80 mt-1">O prazo para envio da prestação de contas do PDDE 2024 encerra em 15 dias.</p>
                      <Button size="sm" variant="outline" className="mt-3 border-amber-500/30 text-amber-500 hover:bg-amber-500/10">Resolver Agora</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Nenhuma escola selecionada</h3>
            <p className="text-muted-foreground max-w-sm">Utilize a barra de pesquisa acima para encontrar os dados da sua escola pelo nome ou código INEP.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

import { ArrowRight } from "lucide-react";

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-400/10",
    blue: "text-blue-400 bg-blue-400/10",
    amber: "text-amber-400 bg-amber-400/10",
  };

  return (
    <Card className="glass-card border-white/5">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-bold text-white">{value}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${colors[color]}`}>
            {trend}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
