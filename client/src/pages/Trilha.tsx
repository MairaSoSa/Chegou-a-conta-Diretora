import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useTrilhaProgress } from "@/hooks/useTrilhaProgress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, Clock, ChevronRight, Play, RotateCcw,
  Ship, Anchor, MapPin, BookOpen, Compass
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { motion } from "framer-motion";

const UNIDADES = [
  { id: 'U00', parte: 0, titulo: 'Boas-vindas: o mapa do rio', subtitulo: 'Entenda como usar a trilha', tempo: '10 min' },
  { id: 'U01', parte: 0, titulo: 'Checklist de 30 dias', subtitulo: 'Organize a escola em um mês', tempo: '30 min' },
  { id: 'U02', parte: 0, titulo: 'Pôster: Caminho do Dinheiro', subtitulo: 'Do pedido à prestação de contas', tempo: '15 min' },
  { id: 'U03', parte: 1, titulo: 'Da cabaça ao carimbo', subtitulo: 'Por que prestamos contas', tempo: '20 min' },
  { id: 'U04', parte: 1, titulo: 'O nascimento do orçamento', subtitulo: 'Planejar antes de gastar', tempo: '25 min' },
  { id: 'U05', parte: 1, titulo: 'Transparência e confiança', subtitulo: 'O que a sociedade espera', tempo: '20 min' },
  { id: 'U06', parte: 2, titulo: 'Do PPP ao PAF', subtitulo: 'Transforme o plano em ação', tempo: '30 min' },
  { id: 'U07', parte: 2, titulo: 'Pesquisa de preços sem dor', subtitulo: '3 propostas, 0 dor de cabeça', tempo: '25 min' },
  { id: 'U08', parte: 2, titulo: 'Rito mínimo para serviços', subtitulo: 'Serviço não é "qualquer coisa"', tempo: '25 min' },
  { id: 'U09', parte: 2, titulo: 'Do pedido ao pagamento', subtitulo: 'A rotina completa', tempo: '30 min' },
  { id: 'U10', parte: 2, titulo: 'Estoque e patrimônio', subtitulo: 'O que entra vira responsabilidade', tempo: '20 min' },
  { id: 'U11', parte: 2, titulo: 'Rotina mensal', subtitulo: '15 minutos por mês', tempo: '20 min' },
  { id: 'U12', parte: 2, titulo: 'Mapa de decisão', subtitulo: '"Quero comprar X, faço o quê?"', tempo: '25 min' },
  { id: 'U13', parte: 2, titulo: 'Erros caros (e como evitar)', subtitulo: 'Armadilhas que custam caro', tempo: '25 min' },
  { id: 'U14', parte: 3, titulo: 'Documentar é amar o futuro', subtitulo: 'A pasta da história', tempo: '25 min' },
  { id: 'U15', parte: 3, titulo: 'Relatórios que alguém quer ler', subtitulo: '1 página trimestral', tempo: '20 min' },
  { id: 'U16', parte: 3, titulo: 'Quando algo saiu torto', subtitulo: 'Correção e aprendizado', tempo: '25 min' },
  { id: 'U17', parte: 4, titulo: 'Conselho Escolar', subtitulo: 'Controle social com pé no chão', tempo: '30 min' },
  { id: 'U18', parte: 4, titulo: 'Casos reais', subtitulo: 'Merenda, transporte, reparos', tempo: '25 min' },
  { id: 'U19', parte: 4, titulo: 'Exceções & emergências', subtitulo: 'Cano estourado, geladeira quebrou', tempo: '20 min' },
  { id: 'U20', parte: 4, titulo: 'Cultura de integridade', subtitulo: 'Conflito de interesse na prática', tempo: '20 min' },
  { id: 'U21', parte: 5, titulo: 'Panorama das fontes federais', subtitulo: 'PDDE, PNAE, PNATE e mais', tempo: '25 min' },
  { id: 'U22', parte: 5, titulo: 'Onde procurar (e em que ordem)', subtitulo: 'SEDUC, portais, diários oficiais', tempo: '20 min' },
  { id: 'U23', parte: 5, titulo: 'Cartões dos Programas', subtitulo: 'Pode, não pode, dica', tempo: '30 min' },
  { id: 'U24', parte: 5, titulo: 'Como aderir a programas', subtitulo: 'Da adesão à prestação', tempo: '25 min' },
];

const PARTES = [
  { id: 0, nome: 'Antes de Começar', icone: Compass, cor: 'amber' },
  { id: 1, nome: 'De onde veio essa história', icone: BookOpen, cor: 'sky' },
  { id: 2, nome: 'Como o dinheiro chega e como usar', icone: MapPin, cor: 'emerald' },
  { id: 3, nome: 'Prestação de contas sem pânico', icone: CheckCircle2, cor: 'purple' },
  { id: 4, nome: 'Gente que faz', icone: Ship, cor: 'rose' },
  { id: 5, nome: 'De onde vem o dinheiro', icone: Anchor, cor: 'indigo' },
];

const COR_CLASSES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', badge: 'bg-sky-100 text-sky-800' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800' },
};

function UnidadeCard({ 
  unidade, 
  index,
  isCompleted, 
  isCurrent,
  corParte,
  onComplete 
}: { 
  unidade: typeof UNIDADES[0];
  index: number;
  isCompleted: boolean;
  isCurrent: boolean;
  corParte: string;
  onComplete: () => void;
}) {
  const cores = COR_CLASSES[corParte];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/trilha/${unidade.id}`}>
        <Card 
          className={cn(
            "group cursor-pointer transition-all duration-300 hover:shadow-md border-2",
            isCompleted && "border-primary/40 bg-primary/5",
            isCurrent && !isCompleted && "border-accent ring-2 ring-accent/20 shadow-lg",
            !isCompleted && !isCurrent && "border-slate-200 hover:border-slate-300"
          )}
          data-testid={`unidade-${unidade.id}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg transition-all",
                isCompleted && "bg-primary text-white",
                isCurrent && !isCompleted && "bg-accent text-white",
                !isCompleted && !isCurrent && cn(cores.bg, cores.text)
              )}>
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={cn("text-xs", cores.badge)}>
                    {unidade.id}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {unidade.tempo}
                  </span>
                  {isCurrent && !isCompleted && (
                    <Badge className="bg-accent/10 text-accent border-0 text-xs animate-pulse">
                      Você está aqui
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {unidade.titulo}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {unidade.subtitulo}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {!isCompleted && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onComplete();
                    }}
                    className="text-xs text-muted-foreground hover:text-primary"
                    data-testid={`concluir-${unidade.id}`}
                  >
                    Marcar como concluída
                  </Button>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function ParteSection({ 
  parte, 
  unidades, 
  progress,
  isUnitCompleted,
  completeUnit,
  globalIndex 
}: { 
  parte: typeof PARTES[0];
  unidades: typeof UNIDADES;
  progress: { currentUnit: string };
  isUnitCompleted: (id: string) => boolean;
  completeUnit: (id: string) => void;
  globalIndex: number;
}) {
  const Icon = parte.icone;
  const cores = COR_CLASSES[parte.cor];
  const completedInPart = unidades.filter(u => isUnitCompleted(u.id)).length;
  
  return (
    <div className="mb-10">
      <div className={cn(
        "flex items-center gap-4 mb-4 p-4 rounded-xl border-2",
        cores.bg,
        cores.border
      )}>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          cores.badge
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {parte.id > 0 && (
              <Badge variant="outline" className={cores.badge}>
                Parte {parte.id}
              </Badge>
            )}
            <h2 className={cn("font-bold text-lg", cores.text)}>
              {parte.nome}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {completedInPart} de {unidades.length} concluídas
          </p>
        </div>
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl",
          completedInPart === unidades.length ? "bg-primary text-white" : cores.badge
        )}>
          {Math.round((completedInPart / unidades.length) * 100)}%
        </div>
      </div>
      
      <div className="space-y-3 pl-4 border-l-4 border-slate-100">
        {unidades.map((unidade, i) => (
          <UnidadeCard
            key={unidade.id}
            unidade={unidade}
            index={globalIndex + i}
            isCompleted={isUnitCompleted(unidade.id)}
            isCurrent={progress.currentUnit === unidade.id}
            corParte={parte.cor}
            onComplete={() => completeUnit(unidade.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function Trilha() {
  const { progress, completedCount, totalUnits, completeUnit, setCurrentUnit, isUnitCompleted, resetProgress } = useTrilhaProgress();
  
  const progressPercent = Math.round((completedCount / totalUnits) * 100);
  
  let globalIndex = 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 via-background to-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1">
        <div className="bg-gradient-to-br from-sky-100/50 via-cyan-50/30 to-transparent border-b py-10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center shadow-lg">
                      <Ship className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground">
                        Trilha de Aprendizado
                      </h1>
                      <p className="text-muted-foreground">
                        Navegue pelo conhecimento, um passo de cada vez
                      </p>
                    </div>
                  </div>
                </div>
                
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center relative"
                      style={{
                        background: `conic-gradient(#16a34a ${progressPercent}%, #e5e7eb ${progressPercent}%)`
                      }}
                    >
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">{progressPercent}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Seu progresso</p>
                      <p className="font-bold text-lg">{completedCount} de {totalUnits}</p>
                      <p className="text-xs text-muted-foreground">unidades concluídas</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-6">
                <Link href={`/trilha/${progress.currentUnit}`}>
                  <Button className="bg-accent hover:bg-accent/90" data-testid="button-continuar">
                    <Play className="w-4 h-4 mr-2" />
                    Continuar de onde parei
                  </Button>
                </Link>
                <Button 
                  variant="outline"
                  onClick={resetProgress}
                  data-testid="button-reset"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Recomeçar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10">
          <div className="max-w-4xl mx-auto">
            {PARTES.map((parte) => {
              const unidadesDaParte = UNIDADES.filter(u => u.parte === parte.id);
              const section = (
                <ParteSection
                  key={parte.id}
                  parte={parte}
                  unidades={unidadesDaParte}
                  progress={progress}
                  isUnitCompleted={isUnitCompleted}
                  completeUnit={completeUnit}
                  globalIndex={globalIndex}
                />
              );
              globalIndex += unidadesDaParte.length;
              return section;
            })}
            
            <div className="mt-12 text-center p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-emerald-50 border border-primary/20">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Anchor className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fim da Jornada!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Quando completar todas as unidades, você terá o conhecimento completo 
                pra gerenciar as verbas da escola com segurança.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
