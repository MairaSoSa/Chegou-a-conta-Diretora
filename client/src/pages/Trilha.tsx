import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CheckCircle2, Circle, Clock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    id: 1,
    title: "Planejamento Inicial",
    desc: "Definição de metas e prioridades com o Conselho Escolar.",
    status: "completed",
    duration: "2 Semanas"
  },
  {
    id: 2,
    title: "Pesquisa de Preços",
    desc: "Cotação com no mínimo 3 fornecedores para cada item.",
    status: "current",
    duration: "1 Semana"
  },
  {
    id: 3,
    title: "Aquisição",
    desc: "Compra dos materiais ou contratação dos serviços.",
    status: "pending",
    duration: "Conforme necessidade"
  },
  {
    id: 4,
    title: "Execução e Recebimento",
    desc: "Conferência da entrega e nota fiscal.",
    status: "pending",
    duration: "Imediato"
  },
  {
    id: 5,
    title: "Prestação de Contas",
    desc: "Organização documental e envio ao sistema.",
    status: "pending",
    duration: "Até 30/Abr"
  }
];

export default function Trilha() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Trilha de Gestão</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Um guia passo a passo para você executar os recursos sem medo de errar na prestação de contas.
          </p>
        </div>

        <div className="max-w-3xl mx-auto relative">
          {/* Vertical Line */}
          <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-white/10" />

          <div className="space-y-8">
            {STEPS.map((step, index) => (
              <div key={step.id} className="relative pl-20 group">
                {/* Status Indicator */}
                <div className={`absolute left-0 top-1 w-14 h-14 rounded-full border-4 flex items-center justify-center z-10 transition-colors bg-background
                  ${step.status === 'completed' ? 'border-primary text-primary' : 
                    step.status === 'current' ? 'border-accent text-accent animate-pulse' : 'border-white/10 text-muted-foreground'}
                `}>
                  {step.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : 
                   step.status === 'current' ? <Clock className="w-6 h-6" /> : 
                   <Circle className="w-6 h-6" />}
                </div>

                <Card className={`glass-card border-white/5 overflow-hidden transition-all duration-300 hover:border-primary/20 hover:shadow-lg
                  ${step.status === 'current' ? 'border-accent/30 bg-accent/5' : ''}
                `}>
                  <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Passo 0{step.id}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/5">{step.duration}</span>
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${step.status === 'current' ? 'text-accent' : 'text-white'}`}>{step.title}</h3>
                      <p className="text-muted-foreground">{step.desc}</p>
                    </div>
                    
                    <Button variant={step.status === 'current' ? 'default' : 'outline'} className={step.status === 'current' ? 'bg-accent text-white hover:bg-accent/90' : 'border-white/10'}>
                      Ver Detalhes <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
