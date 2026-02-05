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
    <div className="relative grid grid-cols-[1fr_220px_1fr] md:grid-cols-[1fr_500px_1fr] items-center gap-0 py-6">
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
      
      <div className="col-start-2 relative h-full flex items-center justify-center min-h-[80px]">
        <div className={cn(
          "w-5 h-5 md:w-6 md:h-6 rounded-full border-3 z-10 transition-all duration-300 shadow-md",
          isCompleted ? "bg-primary border-primary scale-110" :
          isCurrent ? "bg-accent border-accent scale-125" :
          expanded ? "bg-cyan-500 border-cyan-400 scale-110" :
          "bg-white border-border"
        )}>
          {isCompleted && <CheckCircle2 className="w-full h-full text-white p-0.5" />}
        </div>
        
        {isCurrent && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="w-32 h-24 boat-in-river">
              <Barquinho className="w-full h-full" floating={true} />
            </div>
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
  const [isNavigating, setIsNavigating] = useState(false);
  
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

  const navegarPeloRio = () => {
    setIsNavigating(true);
    const endElement = document.getElementById('fim-jornada');
    if (endElement) {
      endElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => setIsNavigating(false), 5000);
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
                    onClick={navegarPeloRio}
                    disabled={isNavigating}
                    data-testid="button-navegar-rio"
                  >
                    <Ship className="w-4 h-4 mr-2" />
                    {isNavigating ? 'Navegando...' : 'Ver todo o rio'}
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
            <div className="absolute left-0 top-0 w-32 md:w-48 h-full">
              <div className="absolute inset-0 bg-gradient-to-r from-[#1a4d1a]/30 via-[#2d5a27]/15 to-transparent" />
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <defs>
                  <pattern id="acaiLeft" patternUnits="userSpaceOnUse" width="100" height="180">
                    {/* Açaizeiro 1 */}
                    <rect x="45" y="60" width="6" height="80" fill="#5d4037" rx="2" />
                    <rect x="44" y="55" width="8" height="12" fill="#6d5047" rx="1" />
                    {/* Folhas do açaí - formato palmeira */}
                    <path d="M48 55 Q30 30 15 25" stroke="#2d5a27" strokeWidth="2" fill="none" />
                    <path d="M48 55 Q25 35 8 35" stroke="#3d7a37" strokeWidth="2" fill="none" />
                    <path d="M48 55 Q35 45 20 50" stroke="#4a8a47" strokeWidth="2" fill="none" />
                    <path d="M48 55 Q70 30 85 25" stroke="#2d5a27" strokeWidth="2" fill="none" />
                    <path d="M48 55 Q75 35 92 35" stroke="#3d7a37" strokeWidth="2" fill="none" />
                    <path d="M48 55 Q65 45 80 50" stroke="#4a8a47" strokeWidth="2" fill="none" />
                    <path d="M48 55 Q48 25 48 10" stroke="#3d7a37" strokeWidth="2" fill="none" />
                    {/* Folhinhas detalhadas */}
                    <ellipse cx="15" cy="25" rx="8" ry="3" fill="#2d5a27" opacity="0.8" transform="rotate(-30 15 25)" />
                    <ellipse cx="8" cy="35" rx="7" ry="3" fill="#3d7a37" opacity="0.7" transform="rotate(-15 8 35)" />
                    <ellipse cx="20" cy="50" rx="6" ry="2" fill="#4a8a47" opacity="0.6" transform="rotate(10 20 50)" />
                    <ellipse cx="85" cy="25" rx="8" ry="3" fill="#2d5a27" opacity="0.8" transform="rotate(30 85 25)" />
                    <ellipse cx="92" cy="35" rx="7" ry="3" fill="#3d7a37" opacity="0.7" transform="rotate(15 92 35)" />
                    <ellipse cx="80" cy="50" rx="6" ry="2" fill="#4a8a47" opacity="0.6" transform="rotate(-10 80 50)" />
                    <ellipse cx="48" cy="10" rx="4" ry="6" fill="#3d7a37" opacity="0.7" />
                    {/* Cachos de açaí */}
                    <circle cx="42" cy="58" r="2" fill="#2d1b4e" opacity="0.8" />
                    <circle cx="46" cy="60" r="2" fill="#3d2b5e" opacity="0.7" />
                    <circle cx="50" cy="58" r="2" fill="#2d1b4e" opacity="0.8" />
                    <circle cx="54" cy="60" r="2" fill="#3d2b5e" opacity="0.7" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#acaiLeft)" />
              </svg>
            </div>
            
            <div className="absolute right-0 top-0 w-32 md:w-48 h-full">
              <div className="absolute inset-0 bg-gradient-to-l from-[#1a4d1a]/30 via-[#2d5a27]/15 to-transparent" />
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <defs>
                  <pattern id="acaiRight" patternUnits="userSpaceOnUse" width="100" height="180" patternTransform="translate(30, 40)">
                    {/* Açaizeiro 2 - ligeiramente diferente */}
                    <rect x="50" y="65" width="5" height="75" fill="#6d5047" rx="2" />
                    <rect x="49" y="60" width="7" height="10" fill="#5d4037" rx="1" />
                    {/* Folhas do açaí */}
                    <path d="M52 60 Q35 35 20 28" stroke="#3d7a37" strokeWidth="2" fill="none" />
                    <path d="M52 60 Q30 42 12 40" stroke="#2d5a27" strokeWidth="2" fill="none" />
                    <path d="M52 60 Q38 50 25 55" stroke="#4a8a47" strokeWidth="2" fill="none" />
                    <path d="M52 60 Q68 35 82 28" stroke="#3d7a37" strokeWidth="2" fill="none" />
                    <path d="M52 60 Q72 42 88 40" stroke="#2d5a27" strokeWidth="2" fill="none" />
                    <path d="M52 60 Q65 50 78 55" stroke="#4a8a47" strokeWidth="2" fill="none" />
                    <path d="M52 60 Q52 30 52 15" stroke="#2d5a27" strokeWidth="2" fill="none" />
                    {/* Folhinhas */}
                    <ellipse cx="20" cy="28" rx="7" ry="3" fill="#3d7a37" opacity="0.8" transform="rotate(-25 20 28)" />
                    <ellipse cx="12" cy="40" rx="6" ry="2" fill="#2d5a27" opacity="0.7" transform="rotate(-10 12 40)" />
                    <ellipse cx="25" cy="55" rx="5" ry="2" fill="#4a8a47" opacity="0.6" transform="rotate(15 25 55)" />
                    <ellipse cx="82" cy="28" rx="7" ry="3" fill="#3d7a37" opacity="0.8" transform="rotate(25 82 28)" />
                    <ellipse cx="88" cy="40" rx="6" ry="2" fill="#2d5a27" opacity="0.7" transform="rotate(10 88 40)" />
                    <ellipse cx="78" cy="55" rx="5" ry="2" fill="#4a8a47" opacity="0.6" transform="rotate(-15 78 55)" />
                    <ellipse cx="52" cy="15" rx="4" ry="5" fill="#2d5a27" opacity="0.7" />
                    {/* Cachos */}
                    <circle cx="47" cy="63" r="2" fill="#3d2b5e" opacity="0.8" />
                    <circle cx="51" cy="65" r="2" fill="#2d1b4e" opacity="0.7" />
                    <circle cx="55" cy="63" r="2" fill="#3d2b5e" opacity="0.8" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#acaiRight)" />
              </svg>
            </div>
          </div>
          
          <div className="container mx-auto px-4 py-8 relative z-10">
            <div className="relative max-w-3xl mx-auto">
              <svg className="absolute left-1/2 top-0 h-full w-56 md:w-[480px] -translate-x-1/2 -z-10 overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="riverMain" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.1" />
                    <stop offset="25%" stopColor="#22d3ee" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#67e8f9" stopOpacity="0.55" />
                    <stop offset="75%" stopColor="#22d3ee" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="riverEdge" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0891b2" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0.3" />
                  </linearGradient>
                  <filter id="riverGlow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                
                <path 
                  d="M50 0 
                     Q70 50 50 100 
                     Q30 150 50 200 
                     Q70 250 50 300 
                     Q30 350 50 400 
                     Q70 450 50 500
                     Q30 550 50 600
                     Q70 650 50 700
                     Q30 750 50 800
                     Q70 850 50 900
                     Q30 950 50 1000
                     Q70 1050 50 1100
                     Q30 1150 50 1200
                     Q70 1250 50 1300
                     Q30 1350 50 1400
                     Q70 1450 50 1500"
                  stroke="url(#riverMain)"
                  strokeWidth="50"
                  fill="none"
                  strokeLinecap="round"
                  filter="url(#riverGlow)"
                  vectorEffect="non-scaling-stroke"
                />
                
                <path 
                  d="M50 0 
                     Q70 50 50 100 
                     Q30 150 50 200 
                     Q70 250 50 300 
                     Q30 350 50 400 
                     Q70 450 50 500
                     Q30 550 50 600
                     Q70 650 50 700
                     Q30 750 50 800
                     Q70 850 50 900
                     Q30 950 50 1000
                     Q70 1050 50 1100
                     Q30 1150 50 1200
                     Q70 1250 50 1300
                     Q30 1350 50 1400
                     Q70 1450 50 1500"
                  stroke="url(#riverEdge)"
                  strokeWidth="55"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.3"
                  vectorEffect="non-scaling-stroke"
                />
                
                <g className="animate-river-flow" opacity="0.5">
                  <path 
                    d="M45 0 Q60 40 45 80 Q30 120 45 160 Q60 200 45 240 Q30 280 45 320"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path 
                    d="M55 20 Q70 60 55 100 Q40 140 55 180 Q70 220 55 260 Q40 300 55 340"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
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
            
            <div id="fim-jornada" className="flex items-center justify-center mt-12 py-8">
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
