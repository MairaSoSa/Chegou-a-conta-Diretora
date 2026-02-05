import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Search, FileText, MessagesSquare, GraduationCap } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          {/* Background Gradient Blob */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-10" />
          
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
                Dinheiro público na escola,<br />
                <span className="text-gradient-primary font-hand relative inline-block transform -rotate-2 mt-2">
                   sem pânico.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                Tudo que você precisa para gerir PDDE, PNAE e outros recursos com segurança, transparência e zero dor de cabeça.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/dashboard">
                  <Button size="lg" className="h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/20">
                    Acessar Dashboard
                  </Button>
                </Link>
                <Link href="/trilha">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/10 hover:bg-white/5">
                    Começar pela Trilha
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-black/20">
          <div className="container mx-auto px-4">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <FeatureCard 
                icon={Search}
                title="Dashboard"
                desc="Consulte a situação da sua escola pelo INEP."
                href="/dashboard"
                color="text-blue-400"
              />
              <FeatureCard 
                icon={GraduationCap}
                title="Trilha de Gestão"
                desc="Passo a passo para não se perder na burocracia."
                href="/trilha"
                color="text-emerald-400"
              />
              <FeatureCard 
                icon={FileText}
                title="Modelos Prontos"
                desc="Atas, planilhas e checklists para baixar."
                href="/ferramentas"
                color="text-purple-400"
              />
              <FeatureCard 
                icon={MessagesSquare}
                title="Chat IA"
                desc="Tire dúvidas sobre legislação instantaneamente."
                href="/chat"
                color="text-amber-400"
              />
            </motion.div>
          </div>
        </section>

        {/* Money Flow Visualization */}
        <section className="py-24 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">O Caminho do Dinheiro</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Entenda o ciclo completo dos recursos federais, do pedido à prestação de contas.
              </p>
            </div>

            <div className="relative">
              {/* Connector Line */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-purple-500/20 -translate-y-1/2 hidden md:block" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <FlowStep number="01" title="Planejamento" desc="Definição de prioridades no PPP." />
                <FlowStep number="02" title="Recebimento" desc="Verificação nas contas do BB." />
                <FlowStep number="03" title="Execução" desc="Pesquisa de preços e compras." />
                <FlowStep number="04" title="Prestação" desc="Envio de dados ao SIGPC." />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, href, color }: any) {
  return (
    <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
      <Link href={href}>
        <Card className="glass-card glass-card-hover h-full cursor-pointer group border-white/5">
          <CardHeader>
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-muted-foreground/80 leading-relaxed">
              {desc}
            </CardDescription>
            <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
              Acessar <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function FlowStep({ number, title, desc }: any) {
  return (
    <div className="relative bg-card border border-white/10 rounded-2xl p-6 text-center z-10 hover:border-primary/30 transition-colors">
      <div className="w-10 h-10 rounded-full bg-background border-2 border-primary flex items-center justify-center text-primary font-bold mx-auto mb-4 text-sm shadow-lg shadow-primary/20">
        {number}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
