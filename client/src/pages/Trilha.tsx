import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Barquinho } from "@/components/Barquinho";
import { useTrilhaProgress } from "@/hooks/useTrilhaProgress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, Circle, Clock, ChevronRight, MapPin, 
  BookOpen, Info, Play, RotateCcw, Anchor, Ship,
  FileText, ListChecks, Download, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const UNIDADES = [
  {
    id: 'U00',
    parte: 0,
    titulo: 'Boas-vindas: o mapa do rio',
    subtitulo: 'Entenda como usar a trilha',
    tempo: '10 min',
    aprendizados: [
      'Como navegar pelo mapa',
      'O que significam as caixas e ícones',
      'Como salvar seu progresso'
    ]
  },
  {
    id: 'U01',
    parte: 0,
    titulo: 'Checklist de 30 dias (Piloto)',
    subtitulo: 'Organize a escola em um mês',
    tempo: '30 min',
    aprendizados: [
      'Rotina semanal de organização',
      'Padronização de arquivos e pastas',
      'Agenda de reunião do Conselho'
    ]
  },
  {
    id: 'U02',
    parte: 0,
    titulo: 'Pôster: Caminho do Dinheiro',
    subtitulo: 'Do pedido à prestação de contas',
    tempo: '15 min',
    aprendizados: [
      'As 8 etapas do fluxo de recursos',
      'O que precisa em cada etapa',
      'Checklist por etapa'
    ]
  },
  {
    id: 'U03',
    parte: 1,
    titulo: 'Da cabaça ao carimbo',
    subtitulo: 'Por que prestamos contas',
    tempo: '20 min',
    aprendizados: [
      'A história da prestação de contas',
      'O que muda quando a escola se organiza',
      'Confiança e controle social'
    ]
  },
  {
    id: 'U04',
    parte: 1,
    titulo: 'O nascimento do orçamento',
    subtitulo: 'Planejar antes de gastar',
    tempo: '25 min',
    aprendizados: [
      'O que é planejar na vida real',
      'Erros comuns quando não planeja',
      'Checklist antes de comprar'
    ]
  },
  {
    id: 'U05',
    parte: 1,
    titulo: 'Transparência e confiança',
    subtitulo: 'O que a sociedade espera',
    tempo: '20 min',
    aprendizados: [
      'O que publicar, guardar e registrar',
      'Controle social sem medo',
      'Painel "Dinheiro bem explicado"'
    ]
  },
  {
    id: 'U06',
    parte: 2,
    titulo: 'Do PPP ao PAF',
    subtitulo: 'Transforme o plano em ação',
    tempo: '30 min',
    aprendizados: [
      'Canvas PPP → PAF',
      'Cronograma de execução',
      'Checklist do PAF'
    ]
  },
  {
    id: 'U07',
    parte: 2,
    titulo: 'Pesquisa de preços sem dor',
    subtitulo: '3 propostas, 0 dor de cabeça',
    tempo: '25 min',
    aprendizados: [
      'Como padronizar a especificação',
      'Comparar maçã com maçã',
      'Modelo de e-mail de cotação'
    ]
  },
  {
    id: 'U08',
    parte: 2,
    titulo: 'Rito mínimo para serviços',
    subtitulo: 'Serviço não é "qualquer coisa"',
    tempo: '25 min',
    aprendizados: [
      'Escopo, OS e termo de recebimento',
      'Antes, durante e depois',
      'NF que fala'
    ]
  },
  {
    id: 'U09',
    parte: 2,
    titulo: 'Do pedido ao pagamento',
    subtitulo: 'A rotina completa',
    tempo: '30 min',
    aprendizados: [
      'Solicitação → Entrega → NF → Pagamento',
      'Erros caros mais comuns',
      'Checklist de pagamento'
    ]
  },
  {
    id: 'U10',
    parte: 2,
    titulo: 'Estoque e patrimônio',
    subtitulo: 'O que entra vira responsabilidade',
    tempo: '20 min',
    aprendizados: [
      'Inventário e tombamento',
      'Como evitar perda e sumiço',
      'Termo de responsabilidade'
    ]
  },
  {
    id: 'U11',
    parte: 2,
    titulo: 'Rotina mensal + Painel 5 peças',
    subtitulo: '15 minutos por mês',
    tempo: '20 min',
    aprendizados: [
      'Checklist mensal clicável',
      'Painel visual das 5 peças',
      'Mapa de conciliação'
    ]
  },
  {
    id: 'U12',
    parte: 2,
    titulo: 'Mapa de decisão',
    subtitulo: '"Quero comprar X, faço o quê?"',
    tempo: '25 min',
    aprendizados: [
      'Assistente de decisão (wizard)',
      'Item → Finalidade → Programa',
      'Documentos mínimos'
    ]
  },
  {
    id: 'U13',
    parte: 2,
    titulo: 'Erros caros (e como evitar)',
    subtitulo: 'Armadilhas que custam caro',
    tempo: '25 min',
    aprendizados: [
      'NF genérica, conta errada, pagar antes',
      'Como corrigir rota',
      'Checklist pré-auditoria'
    ]
  },
  {
    id: 'U14',
    parte: 3,
    titulo: 'Documentar é amar o futuro',
    subtitulo: 'A pasta da história',
    tempo: '25 min',
    aprendizados: [
      'Estrutura índice 0-7',
      'Padrão de nomenclatura',
      'Versionamento simples'
    ]
  },
  {
    id: 'U15',
    parte: 3,
    titulo: 'Relatórios que alguém quer ler',
    subtitulo: '1 página trimestral',
    tempo: '20 min',
    aprendizados: [
      'Template "Dinheiro bem explicado"',
      'Foto que prova',
      'Mini-guia de evidências'
    ]
  },
  {
    id: 'U16',
    parte: 3,
    titulo: 'Quando algo saiu torto',
    subtitulo: 'Correção e aprendizado',
    tempo: '25 min',
    aprendizados: [
      'Como escrever justificativa',
      'Resposta N1/N2/N3',
      'Quadro de saneamento'
    ]
  },
  {
    id: 'U17',
    parte: 4,
    titulo: 'Conselho Escolar',
    subtitulo: 'Controle social com pé no chão',
    tempo: '30 min',
    aprendizados: [
      'Roteiro de reunião 45-60 min',
      'Prioridade vira decisão registrada',
      'Ata padronizada'
    ]
  },
  {
    id: 'U18',
    parte: 4,
    titulo: 'Casos reais',
    subtitulo: 'Merenda, transporte, reparos',
    tempo: '25 min',
    aprendizados: [
      'Checklist PNAE',
      'Checklist PNATE',
      'Checklist manutenção'
    ]
  },
  {
    id: 'U19',
    parte: 4,
    titulo: 'Exceções & emergências',
    subtitulo: 'Cano estourado, geladeira quebrou',
    tempo: '20 min',
    aprendizados: [
      'Rito mínimo em emergência',
      'Como provar o necessário',
      'Caixa de emergências'
    ]
  },
  {
    id: 'U20',
    parte: 4,
    titulo: 'Cultura de integridade',
    subtitulo: 'Conflito de interesse na prática',
    tempo: '20 min',
    aprendizados: [
      'O que é conflito de interesse',
      'Como reduzir risco sem burocracia',
      'Declaração de conflito'
    ]
  },
  {
    id: 'U21',
    parte: 5,
    titulo: 'Panorama das fontes federais',
    subtitulo: 'PDDE, PNAE, PNATE e mais',
    tempo: '25 min',
    aprendizados: [
      'Mapa visual das fontes',
      'Para quê serve cada verba',
      'Regras de ouro'
    ]
  },
  {
    id: 'U22',
    parte: 5,
    titulo: 'Onde procurar (e em que ordem)',
    subtitulo: 'SEDUC, portais, diários oficiais',
    tempo: '20 min',
    aprendizados: [
      'Passo a passo de busca',
      'Guarde protocolo',
      'Checklist 7 passos'
    ]
  },
  {
    id: 'U23',
    parte: 5,
    titulo: 'Cartões dos Programas',
    subtitulo: 'Pode, não pode, dica',
    tempo: '30 min',
    aprendizados: [
      'Cards PDDE/PNAE/PNATE',
      'Matriz ação→programa→documentos',
      'Versão imprimível'
    ]
  },
  {
    id: 'U24',
    parte: 5,
    titulo: 'Como aderir a programas',
    subtitulo: 'Da adesão à prestação',
    tempo: '25 min',
    aprendizados: [
      'Linha do tempo completa',
      'Edital e elegibilidade',
      'Acompanhamento e deferimento'
    ]
  },
];

const PARTES = [
  { id: 0, nome: 'Antes de Começar', cor: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 1, nome: 'Parte I: De onde veio essa história', cor: 'bg-sky-100 text-sky-800 border-sky-200' },
  { id: 2, nome: 'Parte II: Como o dinheiro chega e como usar', cor: 'bg-green-100 text-green-800 border-green-200' },
  { id: 3, nome: 'Parte III: Prestação de contas sem pânico', cor: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 4, nome: 'Parte IV: Gente que faz', cor: 'bg-rose-100 text-rose-800 border-rose-200' },
  { id: 5, nome: 'Parte V: De onde vem o dinheiro', cor: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
];

interface PortoProps {
  unidade: typeof UNIDADES[0];
  isCompleted: boolean;
  isCurrent: boolean;
  index: number;
  onSelect: () => void;
  onComplete: () => void;
}

function Porto({ unidade, isCompleted, isCurrent, index, onSelect, onComplete }: PortoProps) {
  const [expanded, setExpanded] = useState(false);
  const parte = PARTES.find(p => p.id === unidade.parte);
  const isEven = index % 2 === 0;
  
  return (
    <div className={cn(
      "relative flex items-start gap-4 py-6",
      isEven ? "flex-row" : "flex-row-reverse"
    )}>
      <div className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 transition-all",
        isCompleted ? "bg-primary/10 border-primary text-primary" :
        isCurrent ? "bg-accent/10 border-accent text-accent animate-pulse" :
        "bg-muted border-border/50 text-muted-foreground"
      )}>
        {isCompleted ? (
          <CheckCircle2 className="w-7 h-7" />
        ) : isCurrent ? (
          <div className="relative">
            <Anchor className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-ping" />
          </div>
        ) : (
          <Circle className="w-6 h-6" />
        )}
      </div>
      
      <Card 
        className={cn(
          "flex-1 cursor-pointer transition-all hover:shadow-lg border-2",
          isCompleted ? "border-primary/20 bg-primary/5" :
          isCurrent ? "border-accent/30 bg-accent/5 shadow-md" :
          "border-border/50 hover:border-accent/20"
        )}
        onClick={() => setExpanded(!expanded)}
        data-testid={`porto-${unidade.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className={cn("text-xs font-medium", parte?.cor)}>
                  {unidade.id}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {unidade.tempo}
                </span>
                {isCompleted && (
                  <Badge className="bg-primary text-primary-foreground text-xs">Concluída</Badge>
                )}
                {isCurrent && !isCompleted && (
                  <Badge className="bg-accent text-accent-foreground text-xs">Você está aqui</Badge>
                )}
              </div>
              <h3 className={cn(
                "font-bold text-lg mb-1",
                isCurrent && !isCompleted ? "text-accent" : ""
              )}>{unidade.titulo}</h3>
              <p className="text-sm text-muted-foreground">{unidade.subtitulo}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="flex-shrink-0"
              data-testid={`toggle-porto-${unidade.id}`}
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </div>
          
          {expanded && (
            <div className="mt-4 pt-4 border-t border-border/30 space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Você vai sair sabendo:</p>
                <ul className="space-y-1.5">
                  {unidade.aprendizados.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Link href={`/trilha/${unidade.id}`}>
                  <Button 
                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                    className={isCurrent ? "bg-accent hover:bg-accent/90" : ""}
                    data-testid={`abrir-${unidade.id}`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isCompleted ? 'Revisar' : isCurrent ? 'Continuar' : 'Começar'}
                  </Button>
                </Link>
                {!isCompleted && (
                  <Button 
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); onComplete(); }}
                    data-testid={`concluir-${unidade.id}`}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Marcar como Concluída
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isCurrent && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-16 z-10">
          <Barquinho className="w-full h-full" />
        </div>
      )}
    </div>
  );
}

export default function Trilha() {
  const { progress, completedCount, totalUnits, completeUnit, setCurrentUnit, isUnitCompleted, resetProgress } = useTrilhaProgress();
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  
  const progressPercent = Math.round((completedCount / totalUnits) * 100);
  
  const unidadesByParte = PARTES.map(parte => ({
    ...parte,
    unidades: UNIDADES.filter(u => u.parte === parte.id)
  }));
  
  const handleSelectUnit = (unitId: string) => {
    setSelectedUnit(unitId);
    setCurrentUnit(unitId);
  };

  const handleCompleteUnit = (unitId: string) => {
    completeUnit(unitId);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1">
        <div className="bg-gradient-to-b from-sky-50 to-background border-b border-border/30">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Ship className="w-8 h-8 text-accent" />
                  <h1 className="text-3xl md:text-4xl font-bold font-display">Mapa do Rio</h1>
                </div>
                <p className="text-muted-foreground max-w-xl">
                  Navegue pelo igarapé do conhecimento! Cada porto é uma parada pra você aprender algo novo sobre gestão escolar.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <Card className="bg-white border-border/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Progresso</p>
                      <p className="font-bold">{completedCount} de {totalUnits} portos</p>
                      <div className="w-32 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500" 
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex gap-2">
                  <Button 
                    className="bg-accent hover:bg-accent/90"
                    onClick={() => handleSelectUnit(progress.currentUnit)}
                    data-testid="button-continuar"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Continuar de onde parei
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={resetProgress}
                    title="Reiniciar progresso"
                    data-testid="button-reset"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-sky-100 via-sky-50 to-sky-100 py-4 border-b border-sky-200/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-sky-600" />
                <span className="font-medium">Legenda:</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-border/50">
                <div className="w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-primary" />
                </div>
                <span className="text-xs">Concluída</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-border/50">
                <div className="w-4 h-4 rounded-full bg-accent/20 border-2 border-accent animate-pulse" />
                <span className="text-xs">Você está aqui</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-border/50">
                <div className="w-4 h-4 rounded-full bg-muted border-2 border-border/50" />
                <span className="text-xs">A fazer</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-border/50">
                <div className="w-6 h-4">
                  <Barquinho floating={false} />
                </div>
                <span className="text-xs">Seu barquinho</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <svg className="absolute left-0 top-0 w-24 h-24 text-green-700/20" viewBox="0 0 100 100">
              <path d="M20 80 Q30 60 25 40 Q20 20 35 10" stroke="currentColor" strokeWidth="8" fill="none" />
              <circle cx="35" cy="10" r="15" fill="currentColor" />
              <circle cx="20" cy="25" r="10" fill="currentColor" />
            </svg>
            <svg className="absolute right-0 top-20 w-20 h-20 text-green-700/15" viewBox="0 0 100 100">
              <path d="M80 80 Q70 60 75 40 Q80 20 65 10" stroke="currentColor" strokeWidth="8" fill="none" />
              <circle cx="65" cy="10" r="12" fill="currentColor" />
              <circle cx="80" cy="30" r="8" fill="currentColor" />
            </svg>
            <svg className="absolute left-4 bottom-1/3 w-16 h-16 text-green-600/10" viewBox="0 0 100 100">
              <ellipse cx="50" cy="50" rx="40" ry="30" fill="currentColor" />
            </svg>
            <svg className="absolute right-8 bottom-1/2 w-14 h-14 text-green-600/10" viewBox="0 0 100 100">
              <ellipse cx="50" cy="50" rx="35" ry="25" fill="currentColor" />
            </svg>
          </div>
          
          <div className="container mx-auto px-4 py-8 relative z-10">
            <div className="relative max-w-3xl mx-auto">
              <svg className="absolute left-1/2 top-0 h-full w-16 -translate-x-1/2 -z-10" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(139,90,43,0.08)" />
                    <stop offset="50%" stopColor="rgba(139,90,43,0.15)" />
                    <stop offset="100%" stopColor="rgba(139,90,43,0.08)" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#riverGrad)" rx="30" />
                <path 
                  d="M30 0 Q40 50 30 100 Q20 150 35 200 Q50 250 30 300 Q10 350 35 400 Q60 450 30 500 Q0 550 35 600 Q60 650 30 700 Q0 750 35 800 Q60 850 30 900 Q0 950 35 1000" 
                  stroke="rgba(139,90,43,0.2)" 
                  strokeWidth="2" 
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            
            {unidadesByParte.map((parte) => (
              <div key={parte.id} className="mb-12">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                  <Badge className={cn("text-sm px-4 py-2 font-medium", parte.cor)}>
                    {parte.nome}
                  </Badge>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
                </div>
                
                <div className="space-y-2">
                  {parte.unidades.map((unidade, idx) => (
                    <Porto
                      key={unidade.id}
                      unidade={unidade}
                      isCompleted={isUnitCompleted(unidade.id)}
                      isCurrent={progress.currentUnit === unidade.id}
                      index={UNIDADES.findIndex(u => u.id === unidade.id)}
                      onSelect={() => handleSelectUnit(unidade.id)}
                      onComplete={() => handleCompleteUnit(unidade.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
            
            <div className="flex items-center justify-center mt-12 py-8">
              <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200">
                <div className="w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-amber-700" />
                </div>
                <h3 className="font-bold text-xl text-amber-900 mb-2">Fim da Jornada!</h3>
                <p className="text-amber-700">Parabéns! Você navegou por todos os portos e agora domina a gestão financeira escolar.</p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
