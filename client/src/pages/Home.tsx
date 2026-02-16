import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessagesSquare, GraduationCap, BookOpen, Wrench, BarChart3, Scale, Calendar } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
export default function Home() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 flex flex-col items-center justify-center">
        <section className="w-full max-w-3xl mx-auto px-6 py-12 md:py-16">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Chegou a Conta,{" "}
                <span className="text-accent">Diretora!</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
                {settings?.hero_subtitle || "O caminho do dinheiro público na escola, explicado de forma simples. Trilhas, modelos e apoio para quem cuida da educação."}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Link href="/trilha">
                  <Button size="lg" className="h-12 px-8 text-base rounded-xl" data-testid="button-comecar-jornada">
                    Começar a Jornada
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base rounded-xl" data-testid="button-ver-escola">
                    Ver minha escola
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-3xl mx-auto"
            >
              <NavCard href="/dashboard" icon={BarChart3} label="Dados Educacionais" />
              <NavCard href="/legislacao" icon={Scale} label="Legislação" />
              <NavCard href="/calendario" icon={Calendar} label="Calendário" />
              <NavCard href="/trilha" icon={GraduationCap} label="Trilha" />
              <NavCard href="/programas" icon={BookOpen} label="Programas" />
              <NavCard href="/ferramentas" icon={Wrench} label="Ferramentas" />
              <NavCard href="/chat" icon={MessagesSquare} label="Caderno da Diretora" />
            </motion.div>
          </div>
        </section>

        <footer className="w-full py-6 border-t text-center text-sm text-muted-foreground mt-auto">
          <p>{settings?.home_footer_text || "Gratuito para diretores de escolas públicas"}</p>
        </footer>
      </main>
      
    </div>
  );
}

function NavCard({ href, icon: Icon, label, className }: { href: string; icon: any; label: string; className?: string }) {
  return (
    <Link href={href}>
      <div className={`p-4 rounded-xl border bg-card hover:bg-accent/5 hover:border-accent/30 transition-all cursor-pointer group ${className || ''}`}>
        <Icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground group-hover:text-accent transition-colors" />
        <p className="text-sm font-medium">{label}</p>
      </div>
    </Link>
  );
}
