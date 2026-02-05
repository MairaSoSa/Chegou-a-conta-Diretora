import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useTrilhaProgress } from "@/hooks/useTrilhaProgress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, Clock, ChevronRight, Play, RotateCcw,
  Ship, Anchor, MapPin, BookOpen, Compass, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { motion } from "framer-motion";
import type { TrilhaUnit } from "@shared/schema";

const PARTES = [
  { id: 0, nome: 'Antes de Começar', icone: Compass, cor: 'amber' },
  { id: 1, nome: 'De onde veio essa história', icone: BookOpen, cor: 'sky' },
  { id: 2, nome: 'Como o dinheiro chega e como usar', icone: MapPin, cor: 'emerald' },
  { id: 3, nome: 'Prestação de contas sem pânico', icone: CheckCircle2, cor: 'purple' },
  { id: 4, nome: 'Gente que faz', icone: Ship, cor: 'rose' },
  { id: 5, nome: 'De onde vem o dinheiro', icone: Anchor, cor: 'indigo' },
];

const COR_CLASSES: Record<string, { bg: string; border: string; text: string; badge: string; wave: string }> = {
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', wave: '#fef3c7' },
  sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', badge: 'bg-sky-100 text-sky-800', wave: '#e0f2fe' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', wave: '#d1fae5' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800', wave: '#f3e8ff' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800', wave: '#ffe4e6' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800', wave: '#e0e7ff' },
};

function Barquinho({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 24" className={className} fill="none">
      <path d="M4 16 C8 20, 32 20, 36 16 L34 12 L6 12 Z" fill="#8B4513" />
      <path d="M20 12 L20 4 L30 10 L20 10 Z" fill="#fff" stroke="#ddd" strokeWidth="0.5" />
      <path d="M18 14 L22 14 L22 12 L18 12 Z" fill="#5D4037" />
    </svg>
  );
}

function UnidadeCard({ 
  unidade, 
  index,
  isCompleted, 
  isCurrent,
  corParte,
  onComplete 
}: { 
  unidade: TrilhaUnit;
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
      className="relative"
    >
      {isCurrent && !isCompleted && (
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 z-10">
          <motion.div
            animate={{ x: [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Barquinho className="w-8 h-5" />
          </motion.div>
        </div>
      )}
      
      <Link href={`/trilha/${unidade.unitId}`}>
        <Card 
          className={cn(
            "group cursor-pointer transition-all duration-300 hover:shadow-md border-2",
            isCompleted && "border-primary/40 bg-primary/5",
            isCurrent && !isCompleted && "border-emerald-400 ring-2 ring-emerald-200 shadow-lg bg-gradient-to-r from-emerald-50/50 to-transparent",
            !isCompleted && !isCurrent && "border-slate-200 hover:border-slate-300"
          )}
          data-testid={`unidade-${unidade.unitId}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg transition-all",
                isCompleted && "bg-primary text-white",
                isCurrent && !isCompleted && "bg-emerald-500 text-white",
                !isCompleted && !isCurrent && cn(cores.bg, cores.text)
              )}>
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className={cn("text-xs", cores.badge)}>
                    {unidade.unitId}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {unidade.duration}
                  </span>
                  {isCurrent && !isCompleted && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                      <Ship className="w-3 h-3 mr-1" />
                      Seu barco está aqui
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {unidade.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {unidade.subtitle}
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
                    className="text-xs text-muted-foreground hover:text-primary hidden sm:flex"
                    data-testid={`concluir-${unidade.unitId}`}
                  >
                    Concluir
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
  unidades: TrilhaUnit[];
  progress: { currentUnit: string };
  isUnitCompleted: (id: string) => boolean;
  completeUnit: (id: string) => void;
  globalIndex: number;
}) {
  const Icon = parte.icone;
  const cores = COR_CLASSES[parte.cor];
  const completedInPart = unidades.filter(u => isUnitCompleted(u.unitId)).length;
  
  return (
    <div className="mb-10">
      <div className={cn(
        "flex items-center gap-4 mb-4 p-4 rounded-xl border-2 relative overflow-hidden",
        cores.bg,
        cores.border
      )}>
        <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
          <pattern id={`wave-${parte.id}`} patternUnits="userSpaceOnUse" width="100" height="20">
            <path 
              d="M0 10 Q25 0, 50 10 T100 10" 
              fill="none" 
              stroke={cores.wave} 
              strokeWidth="2"
            />
          </pattern>
          <rect width="100%" height="100%" fill={`url(#wave-${parte.id})`} />
        </svg>
        
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center relative z-10",
          cores.badge
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            {parte.id > 0 && (
              <Badge variant="outline" className={cores.badge}>
                Trecho {parte.id}
              </Badge>
            )}
            <h2 className={cn("font-bold text-lg", cores.text)}>
              {parte.nome}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {completedInPart} de {unidades.length} paradas visitadas
          </p>
        </div>
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg relative z-10",
          completedInPart === unidades.length ? "bg-primary text-white" : cores.badge
        )}>
          {unidades.length > 0 ? Math.round((completedInPart / unidades.length) * 100) : 0}%
        </div>
      </div>
      
      <div className="space-y-3 pl-6 ml-2 border-l-2 border-dashed border-emerald-200 relative">
        <div className="absolute left-0 top-0 w-4 h-full pointer-events-none opacity-20">
          <svg className="w-full h-full" preserveAspectRatio="none">
            <pattern id="river-dots" patternUnits="userSpaceOnUse" width="4" height="20">
              <circle cx="2" cy="10" r="1.5" fill="#10b981" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#river-dots)" />
          </svg>
        </div>
        
        {unidades.map((unidade, i) => (
          <UnidadeCard
            key={unidade.unitId}
            unidade={unidade}
            index={globalIndex + i}
            isCompleted={isUnitCompleted(unidade.unitId)}
            isCurrent={progress.currentUnit === unidade.unitId}
            corParte={parte.cor}
            onComplete={() => completeUnit(unidade.unitId)}
          />
        ))}
      </div>
    </div>
  );
}

export default function Trilha() {
  const { progress, completedCount, totalUnits, completeUnit, isUnitCompleted, resetProgress } = useTrilhaProgress();
  
  const { data: units = [], isLoading } = useQuery<TrilhaUnit[]>({
    queryKey: ["/api/trilha"],
  });

  const unitCount = units.length || totalUnits;
  const progressPercent = unitCount > 0 ? Math.round((completedCount / unitCount) * 100) : 0;
  
  let globalIndex = 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1">
        <div className="relative border-b overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <pattern id="header-waves" patternUnits="userSpaceOnUse" width="200" height="40">
                <path d="M0 20 Q50 10, 100 20 T200 20" fill="none" stroke="#10b981" strokeWidth="1.5" />
                <path d="M0 30 Q50 20, 100 30 T200 30" fill="none" stroke="#34d399" strokeWidth="1" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#header-waves)" />
            </svg>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-100/40 via-green-50/50 to-transparent py-8 relative z-10">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                      <Ship className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">
                        Navegue pelo Rio
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        {completedCount} de {unitCount} paradas visitadas
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{
                        background: `conic-gradient(#10b981 ${progressPercent}%, #e5e7eb ${progressPercent}%)`
                      }}
                    >
                      <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
                        <span className="text-lg font-bold text-emerald-600">{progressPercent}%</span>
                      </div>
                    </div>
                    
                    <Link href={`/trilha/${progress.currentUnit}`}>
                      <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-continuar">
                        <Play className="w-4 h-4 mr-2" />
                        Continuar
                      </Button>
                    </Link>
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={resetProgress}
                      className="border-emerald-200 hover:bg-emerald-50"
                      data-testid="button-reset"
                      title="Recomeçar do início"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : (
              <>
                {PARTES.map((parte) => {
                  const unidadesDaParte = units.filter(u => u.part === parte.id);
                  if (unidadesDaParte.length === 0) return null;
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
              </>
            )}
            
            <div className="mt-12 text-center p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 relative overflow-hidden">
              <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
                <pattern id="end-waves" patternUnits="userSpaceOnUse" width="100" height="20">
                  <path d="M0 10 Q25 5, 50 10 T100 10" fill="none" stroke="#10b981" strokeWidth="2" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#end-waves)" />
              </svg>
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Anchor className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-emerald-800">Porto Final</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Quando completar toda a jornada pelo rio, você terá o conhecimento 
                  pra gerenciar as verbas da escola com confiança e segurança.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
