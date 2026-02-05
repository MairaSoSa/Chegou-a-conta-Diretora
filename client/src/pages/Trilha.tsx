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
  const isLeft = index % 2 === 0;
  
  return (
    <div className="relative grid grid-cols-[1fr_80px_1fr] md:grid-cols-[1fr_120px_1fr] items-center gap-0 py-4">
      <div className={cn(
        "transition-all duration-300",
        isLeft ? "col-start-1" : "col-start-3",
        isLeft ? "pr-2" : "pl-2"
      )}>
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-lg border-2 relative",
            isCompleted ? "border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10" :
            isCurrent ? "border-accent/40 bg-gradient-to-br from-accent/5 to-accent/15 shadow-lg" :
            "border-border/50 hover:border-accent/30 bg-card"
          )}
          onClick={() => setExpanded(!expanded)}
          data-testid={`porto-${unidade.id}`}
        >
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <Badge variant="outline" className={cn("text-xs font-medium", parte?.cor)}>
                    {unidade.id}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {unidade.tempo}
                  </span>
                </div>
                <h3 className={cn(
                  "font-bold text-sm md:text-base mb-0.5 leading-tight",
                  isCurrent && !isCompleted ? "text-accent" : ""
                )}>{unidade.titulo}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{unidade.subtitulo}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                {isCompleted && <CheckCircle2 className="w-5 h-5 text-primary" />}
                {isCurrent && !isCompleted && (
                  <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7"
                  data-testid={`toggle-porto-${unidade.id}`}
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            {expanded && (
              <div className="mt-3 pt-3 border-t border-border/30 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Você vai aprender:</p>
                  <ul className="space-y-1">
                    {unidade.aprendizados.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs">
                        <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Link href={`/trilha/${unidade.id}`}>
                    <Button 
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onSelect(); }}
                      className={isCurrent ? "bg-accent hover:bg-accent/90" : ""}
                      data-testid={`abrir-${unidade.id}`}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      {isCompleted ? 'Revisar' : isCurrent ? 'Continuar' : 'Começar'}
                    </Button>
                  </Link>
                  {!isCompleted && (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onComplete(); }}
                      data-testid={`concluir-${unidade.id}`}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Concluída
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="col-start-2 relative h-full flex items-center justify-center">
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 h-1 transition-all duration-300",
          isLeft ? "right-1/2 left-0" : "left-1/2 right-0",
          expanded ? "bg-gradient-to-r from-amber-600/60 via-amber-500/80 to-amber-600/60" : 
          isCompleted ? "bg-primary/30" :
          isCurrent ? "bg-accent/40" : "bg-border/30"
        )} 
        style={{ 
          clipPath: isLeft 
            ? 'polygon(0 0, 100% 30%, 100% 70%, 0 100%)' 
            : 'polygon(0 30%, 100% 0, 100% 100%, 0 70%)'
        }}
        />
        
        <div className={cn(
          "w-4 h-4 md:w-5 md:h-5 rounded-full border-2 z-10 transition-all",
          isCompleted ? "bg-primary border-primary" :
          isCurrent ? "bg-accent border-accent animate-pulse" :
          "bg-muted border-border"
        )}>
          {isCompleted && <CheckCircle2 className="w-full h-full text-white p-0.5" />}
        </div>
        
        {isCurrent && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 h-14 z-20">
            <Barquinho className="w-full h-full" />
          </div>
        )}
      </div>
      
      <div className={cn(
        isLeft ? "col-start-3" : "col-start-1"
      )} />
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

        <div className="trilha-amazonia relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute left-0 top-0 w-24 md:w-40 h-full">
              <div className="absolute inset-0 bg-gradient-to-r from-[#1a4d1a]/40 via-[#2d5a27]/25 to-transparent" />
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <pattern id="forestLeft" patternUnits="userSpaceOnUse" width="80" height="120">
                  <ellipse cx="40" cy="25" rx="35" ry="20" fill="#2d5a27" opacity="0.7" />
                  <ellipse cx="25" cy="35" rx="25" ry="15" fill="#3d7a37" opacity="0.6" />
                  <ellipse cx="55" cy="40" rx="22" ry="14" fill="#4a8a47" opacity="0.5" />
                  <ellipse cx="20" cy="50" rx="18" ry="12" fill="#2d5a27" opacity="0.4" />
                  <rect x="35" y="50" width="8" height="50" fill="#5d4037" opacity="0.3" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#forestLeft)" />
              </svg>
            </div>
            
            <div className="absolute right-0 top-0 w-24 md:w-40 h-full">
              <div className="absolute inset-0 bg-gradient-to-l from-[#1a4d1a]/40 via-[#2d5a27]/25 to-transparent" />
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <pattern id="forestRight" patternUnits="userSpaceOnUse" width="80" height="120">
                  <ellipse cx="40" cy="30" rx="32" ry="18" fill="#3d7a37" opacity="0.7" />
                  <ellipse cx="55" cy="40" rx="28" ry="16" fill="#2d5a27" opacity="0.6" />
                  <ellipse cx="25" cy="45" rx="20" ry="13" fill="#4a8a47" opacity="0.5" />
                  <ellipse cx="60" cy="55" rx="16" ry="11" fill="#3d7a37" opacity="0.4" />
                  <rect x="38" y="52" width="7" height="48" fill="#6d5047" opacity="0.3" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#forestRight)" />
              </svg>
            </div>
          </div>
          
          <div className="container mx-auto px-4 py-8 relative z-10">
            <div className="relative max-w-3xl mx-auto">
              <div className="absolute left-1/2 top-0 bottom-0 w-20 md:w-28 -translate-x-1/2 -z-10 overflow-hidden rounded-full">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-cyan-500/30 to-cyan-400/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-300/20 to-transparent" />
                
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="riverBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0891b2" stopOpacity="0.15" />
                      <stop offset="30%" stopColor="#22d3ee" stopOpacity="0.35" />
                      <stop offset="50%" stopColor="#67e8f9" stopOpacity="0.45" />
                      <stop offset="70%" stopColor="#22d3ee" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity="0.15" />
                    </linearGradient>
                    <linearGradient id="riverShine2" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                      <stop offset="50%" stopColor="white" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="white" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="100%" height="100%" fill="url(#riverBlue)" />
                </svg>
                
                <div className="absolute inset-0 overflow-hidden">
                  <div className="animate-river-flow absolute inset-x-0 -top-20 bottom-0">
                    <svg className="w-full h-[120%]" viewBox="0 0 100 200" preserveAspectRatio="none">
                      <path d="M30 0 Q45 20 30 40 Q15 60 30 80 Q45 100 30 120 Q15 140 30 160 Q45 180 30 200" 
                            stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" />
                      <path d="M50 10 Q65 30 50 50 Q35 70 50 90 Q65 110 50 130 Q35 150 50 170 Q65 190 50 210" 
                            stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
                      <path d="M70 0 Q85 20 70 40 Q55 60 70 80 Q85 100 70 120 Q55 140 70 160 Q85 180 70 200" 
                            stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" fill="none" />
                    </svg>
                  </div>
                </div>
                
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-white/0 via-white/30 to-white/0" />
              </div>
            
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
