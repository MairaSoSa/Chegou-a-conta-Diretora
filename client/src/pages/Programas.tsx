import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { usePrograms } from "@/hooks/use-programs";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function Programas() {
  const { data: programs, isLoading } = usePrograms();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-4">Programas e Políticas</h1>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Entenda as regras de cada verba: o que pode, o que não pode e como prestar contas.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs?.map((program) => (
              <Card key={program.id} className="glass-card flex flex-col border-white/5 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="border-white/10 text-primary bg-primary/5">{program.code}</Badge>
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      program.status === 'Regular' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 
                      'border-amber-500/20 text-amber-500 bg-amber-500/5'
                    }`}>
                      {program.status}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{program.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                    {program.description}
                  </p>
                  {program.observation && (
                    <div className="text-xs bg-white/5 p-3 rounded-lg text-muted-foreground/80">
                      📝 {program.observation}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-4 border-t border-white/5">
                  <Link href={`/programas/${program.code}`} className="w-full">
                    <Button variant="ghost" className="w-full justify-between group text-muted-foreground hover:text-white">
                      Ver Regras e Documentos
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
