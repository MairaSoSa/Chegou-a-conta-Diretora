import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, MapPin, Building2, Calendar, FileText, Users, 
  Download, CheckCircle2, Clock, AlertCircle, TrendingUp,
  Banknote, CreditCard, User, Shield, FileCheck, ChevronRight,
  BarChart3, PieChart, Hash, ExternalLink
} from "@/components/Icons";
import { useSigpcDetalhar, useSigpcHistorico, type SigpcPrestacaoListItem } from "@/hooks/use-sigpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from "recharts";

interface SigpcDetailModalProps {
  prestacao: SigpcPrestacaoListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLORS = {
  liberado: '#10b981',
  executado: '#3b82f6',
  saldo: '#f59e0b',
  aprovado: '#22c55e',
  pendente: '#f59e0b',
  irregular: '#ef4444'
};

export function SigpcDetailModal({ prestacao, open, onOpenChange }: SigpcDetailModalProps) {
  const [activeTab, setActiveTab] = useState("geral");
  
  const { data: detalhesData, isLoading: loadingDetalhes } = useSigpcDetalhar(open ? prestacao.pcId : undefined);
  const detalhes = detalhesData?.prestacao;
  
  const { data: historicoData, isLoading: loadingHistorico } = useSigpcHistorico(
    open && detalhes ? detalhes.concessaoId : undefined
  );
  const historico = historicoData?.historico || [];

  if (!open) return null;

  const statusColor = prestacao.situacaoNome?.toLowerCase().includes('aprovad')
    ? 'bg-green-100 text-green-800 border-green-200'
    : prestacao.situacaoNome?.toLowerCase().includes('pendent') || prestacao.situacaoNome?.toLowerCase().includes('aguardando')
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-red-100 text-red-800 border-red-200';

  // Dados para gráficos
  const financialData = detalhes ? [
    { name: 'Concessão', valor: detalhes.valorConcessao, fill: '#94a3b8' },
    { name: 'Liberado', valor: detalhes.valorLiberado, fill: COLORS.liberado },
    { name: 'Executado', valor: detalhes.valorExecutado, fill: COLORS.executado },
    { name: 'Saldo', valor: detalhes.saldoConta, fill: COLORS.saldo }
  ] : [];

  const execucaoPercent = detalhes && detalhes.valorLiberado > 0
    ? (detalhes.valorExecutado / detalhes.valorLiberado) * 100
    : 0;

  const handleExportPDF = () => {
    if (detalhes) {
      window.open(
        `https://www.fnde.gov.br/sigpcadm/exportarLocalizar.pu?operation=exportarDetalheOPC&concessaoId=${detalhes.concessaoId}`,
        '_blank'
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{prestacao.programaNome}</DialogTitle>
              <DialogDescription className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="w-4 h-4" />
                  <span className="font-mono">{prestacao.processoNumero}</span>
                </div>
                {prestacao.convenioNumero && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4" />
                    <span>Convênio: {prestacao.convenioNumero}</span>
                  </div>
                )}
              </DialogDescription>
            </div>
            <Badge variant="secondary" className={`${statusColor} text-sm px-3 py-1`}>
              {prestacao.situacaoNome}
            </Badge>
          </div>
        </DialogHeader>

        {loadingDetalhes ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
              <TabsTrigger value="equipe">Equipe</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            {/* ABA GERAL */}
            <TabsContent value="geral" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Informações da Entidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nome:</span>
                      <p className="font-medium">{detalhes?.entidadeNome}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CNPJ:</span>
                      <p className="font-mono font-medium">{detalhes?.cnpj}</p>
                    </div>
                    {detalhes?.endereco && (
                      <div>
                        <span className="text-muted-foreground">Endereço:</span>
                        <p className="font-medium">{detalhes.endereco}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium">{detalhes?.municipio} - {detalhes?.uf}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Prazos e Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Ano de Concessão:</span>
                      <p className="font-medium">{prestacao.anoConcessao}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Período:</span>
                      <p className="font-medium">{detalhes?.dataInicio} até {detalhes?.dataFim}</p>
                    </div>
                    {detalhes?.dataAprovacao && (
                      <div>
                        <span className="text-muted-foreground">Aprovação:</span>
                        <p className="font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          {detalhes.dataAprovacao}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Fase Atual:</span>
                      <p className="font-medium">{prestacao.faseNome}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {detalhes && detalhes.documentos.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileCheck className="w-4 h-4" />
                      Documentos ({detalhes.documentos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {detalhes.documentos.map((doc) => (
                        <div key={doc.documentoId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{doc.tipo}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.numero} • {doc.dataEmissao}
                            </p>
                            {doc.observacao && (
                              <p className="text-xs text-muted-foreground mt-1">{doc.observacao}</p>
                            )}
                          </div>
                          <Badge 
                            variant="secondary"
                            className={
                              doc.situacao.toLowerCase().includes('aprovad') || doc.situacao.toLowerCase().includes('emitido')
                                ? 'bg-green-100 text-green-800'
                                : doc.situacao.toLowerCase().includes('pendent')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }
                          >
                            {doc.situacao}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ABA FINANCEIRO */}
            <TabsContent value="financeiro" className="space-y-4 mt-4">
              {detalhes && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <DollarSign className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                          <p className="text-xs text-muted-foreground mb-1">Concessão</p>
                          <p className="text-lg font-bold">
                            R$ {detalhes.valorConcessao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                          <p className="text-xs text-muted-foreground mb-1">Liberado</p>
                          <p className="text-lg font-bold text-green-600">
                            R$ {detalhes.valorLiberado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                          <p className="text-xs text-muted-foreground mb-1">Executado</p>
                          <p className="text-lg font-bold text-blue-600">
                            R$ {detalhes.valorExecutado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Banknote className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                          <p className="text-xs text-muted-foreground mb-1">Saldo</p>
                          <p className="text-lg font-bold text-amber-600">
                            R$ {detalhes.saldoConta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Execução Financeira
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Percentual Executado</span>
                          <span className="font-bold">{execucaoPercent.toFixed(1)}%</span>
                        </div>
                        <Progress value={execucaoPercent} className="h-3" />
                      </div>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={financialData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          />
                          <Bar dataKey="valor" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* ABA PARCELAS */}
            <TabsContent value="parcelas" className="space-y-4 mt-4">
              {detalhes && detalhes.parcelas.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Parcelas de Liberação ({detalhes.parcelas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {detalhes.parcelas.map((parcela) => (
                        <div key={parcela.parcelaId} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                            {parcela.numero}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              R$ {parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {parcela.dataLiberacao}
                            </p>
                          </div>
                          <Badge 
                            variant="secondary"
                            className={
                              parcela.situacao.toLowerCase().includes('liberad')
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                            }
                          >
                            {parcela.situacao}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma parcela registrada
                </div>
              )}
            </TabsContent>

            {/* ABA EQUIPE */}
            <TabsContent value="equipe" className="space-y-4 mt-4">
              {detalhes && detalhes.dirigentes.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Dirigentes ({detalhes.dirigentes.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {detalhes.dirigentes.map((dirigente) => (
                        <div key={dirigente.dirigenteId} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{dirigente.nome}</p>
                            <p className="text-sm text-muted-foreground">{dirigente.cargo}</p>
                            <p className="text-xs font-mono text-muted-foreground mt-1">
                              CPF: {dirigente.cpf}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              Desde {dirigente.dataInicio}
                              {dirigente.dataFim && ` até ${dirigente.dataFim}`}
                            </p>
                          </div>
                          <Badge 
                            variant="secondary"
                            className={
                              dirigente.situacao.toLowerCase() === 'ativo'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {dirigente.situacao}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum dirigente registrado
                </div>
              )}
            </TabsContent>

            {/* ABA HISTÓRICO */}
            <TabsContent value="historico" className="space-y-4 mt-4">
              {loadingHistorico ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : historico.length > 0 ? (
                <div className="relative">
                  {/* Timeline */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border"></div>
                  
                  <div className="space-y-6">
                    {historico.map((item, idx) => (
                      <div key={item.historicoId} className="relative pl-12">
                        {/* Bolinha da timeline */}
                        <div className={`absolute left-3 w-4 h-4 rounded-full border-2 ${
                          item.resultado.toLowerCase().includes('aprovad')
                            ? 'bg-green-500 border-green-300'
                            : item.resultado.toLowerCase().includes('ressalva')
                            ? 'bg-amber-500 border-amber-300'
                            : 'bg-blue-500 border-blue-300'
                        }`}></div>
                        
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-sm font-medium">{item.tipoAnalise}</CardTitle>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {item.dataAnalise} • {item.analista}
                                </p>
                              </div>
                              <Badge 
                                variant="secondary"
                                className={
                                  item.resultado.toLowerCase().includes('aprovad')
                                    ? 'bg-green-100 text-green-800'
                                    : item.resultado.toLowerCase().includes('ressalva')
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                }
                              >
                                {item.resultado}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <p className="text-sm">{item.parecer}</p>
                            {item.documentosAnalisados.length > 0 && (
                              <div className="mt-3 p-2 bg-muted/50 rounded">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Documentos analisados:</p>
                                <ul className="text-xs space-y-1">
                                  {item.documentosAnalisados.map((doc, i) => (
                                    <li key={i} className="flex items-center gap-1">
                                      <ChevronRight className="w-3 h-3" />
                                      {doc}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum histórico de análise disponível
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportPDF}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Relatório
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://www.fnde.gov.br/sigpcadm/`, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Ver no SIGPC
            </Button>
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
