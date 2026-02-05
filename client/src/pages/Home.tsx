import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Search, FileText, MessagesSquare, GraduationCap, BookOpen, ShieldCheck, Users, Sparkles, ChevronRight, CheckCircle2 } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-28">
          {/* Decorative background */}
          <div className="absolute inset-0 pattern-dots opacity-40" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
                  <Sparkles className="w-4 h-4" />
                  Ferramentas práticas + linguagem humana
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Dinheiro público na escola,{" "}
                  <span className="font-hand text-gradient-primary relative inline-block transform -rotate-1">
                    sem pânico.
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                  Trilha passo a passo, explicação dos programas, modelos prontos, chat para dúvidas e dashboard com dados públicos — tudo pensado para quem cuida da escola.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/trilha">
                    <Button size="lg" className="h-12 px-8 text-base shadow-md shadow-primary/20">
                      Começar pela Trilha
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                      Acessar Dashboard
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* What We Do Section */}
        <section className="py-16 border-y border-border/50 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Orientamos</h3>
                <p className="text-sm text-muted-foreground">Linguagem acessível sobre PDDE, PNAE, PNATE e prestação de contas.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Organizamos</h3>
                <p className="text-sm text-muted-foreground">Checklists, modelos e passo a passo para não perder nenhum prazo.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-semibold mb-2">Apoiamos</h3>
                <p className="text-sm text-muted-foreground">Chat IA para tirar dúvidas e indicação de onde conferir nas fontes oficiais.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Atalhos Rápidos</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Acesse diretamente o que você precisa, em um clique.
              </p>
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto"
            >
              <FeatureCard 
                icon={GraduationCap}
                title="Trilha"
                desc="Passo a passo + progresso"
                href="/trilha"
                color="bg-emerald-500/10 text-emerald-600"
              />
              <FeatureCard 
                icon={BookOpen}
                title="Programas"
                desc="Pode / Não pode"
                href="/programas"
                color="bg-sky-500/10 text-sky-600"
              />
              <FeatureCard 
                icon={MessagesSquare}
                title="Chat IA"
                desc="Dúvidas do dia a dia"
                href="/chat"
                color="bg-amber-500/10 text-amber-600"
              />
              <FeatureCard 
                icon={FileText}
                title="Modelos"
                desc="Copiar / Baixar"
                href="/ferramentas"
                color="bg-purple-500/10 text-purple-600"
              />
            </motion.div>
          </div>
        </section>

        {/* Money Flow Visualization */}
        <section className="py-20 bg-muted/30 border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold mb-4">Caminho do Dinheiro</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Entenda o ciclo completo, do pedido à prestação de contas.
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="flex flex-wrap justify-center gap-3">
                {["Pedido", "Pesquisa", "Autorização", "Recebimento", "NF", "Pagamento", "Arquivo", "Prestação"].map((step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <div className="px-4 py-2.5 rounded-full border border-border bg-card flex items-center gap-2 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium">{step}</span>
                    </div>
                    {i < 7 && <ChevronRight className="w-4 h-4 text-muted-foreground/50 hidden sm:block" />}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Como este site ajuda</h3>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Orienta, organiza e reduz ansiedade</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Aumenta rastreabilidade e transparência</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Indica onde conferir nas fontes oficiais</span>
                        </li>
                      </ul>
                      <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50">
                        <strong>Importante:</strong> Este site não substitui orientações oficiais do FNDE, Secretaria ou controle interno.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
    <motion.div variants={{ hidden: { y: 15, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
      <Link href={href}>
        <Card className="glass-card glass-card-hover h-full cursor-pointer group">
          <CardHeader className="pb-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-105 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-muted-foreground">
              {desc}
            </CardDescription>
            <div className="mt-3 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Acessar <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
