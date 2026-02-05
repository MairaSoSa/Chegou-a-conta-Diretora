import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Search, FileText, MessagesSquare, GraduationCap, BookOpen, ShieldCheck, Users, Sparkles, ChevronRight, CheckCircle2, Leaf, TreeDeciduous } from "lucide-react";
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section - Watercolor style */}
        <section className="relative overflow-hidden py-20 lg:py-28 watercolor-bg">
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 opacity-20">
            <TreeDeciduous className="w-32 h-32 text-primary" />
          </div>
          <div className="absolute bottom-10 right-10 opacity-20">
            <Leaf className="w-24 h-24 text-accent" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                {/* Badge */}
                <div className="stone-badge mb-8">
                  <Sparkles className="w-4 h-4" />
                  Gestão territorial com carinho
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight font-display">
                  Chegou a Conta,{" "}
                  <span className="text-gradient-earth relative inline-block">
                    Diretora!
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                  O caminho do dinheiro público na escola, explicado com cuidado e acolhimento. 
                  Trilhas, modelos e apoio para quem cuida da educação no território.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/trilha">
                    <Button size="lg" className="h-12 px-8 text-base rounded-full shadow-md bg-primary hover:bg-primary/90">
                      Começar a Jornada
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button size="lg" variant="outline" className="h-12 px-8 text-base rounded-full border-accent/30 hover:bg-accent/5 hover:border-accent/50">
                      Ver Dashboard
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Three Pillars Section */}
        <section className="py-16 border-y border-border/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">Orientamos</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Linguagem acessível sobre PDDE, PNAE, PNATE e prestação de contas.</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">Organizamos</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Checklists, modelos e passo a passo para cada etapa da jornada.</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">Acolhemos</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Chat IA para dúvidas e comunidade de apoio entre gestoras.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Grid - Clay Cards */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-display font-bold mb-4">Por Onde Começar?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Escolha seu caminho e siga no seu ritmo.
              </p>
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
            >
              <FeatureCard 
                icon={GraduationCap}
                title="Trilha"
                desc="Jornada passo a passo com progresso salvo"
                href="/trilha"
                color="bg-primary/10 text-primary"
              />
              <FeatureCard 
                icon={BookOpen}
                title="Programas"
                desc="PDDE, PNAE, PNATE explicados"
                href="/programas"
                color="bg-sky-500/10 text-sky-600"
              />
              <FeatureCard 
                icon={MessagesSquare}
                title="Chat IA"
                desc="Tire dúvidas a qualquer hora"
                href="/chat"
                color="bg-accent/10 text-accent"
              />
              <FeatureCard 
                icon={FileText}
                title="Ferramentas"
                desc="Modelos prontos para baixar"
                href="/ferramentas"
                color="bg-amber-500/10 text-amber-600"
              />
            </motion.div>
          </div>
        </section>

        {/* Money Trail - Jornada Visual */}
        <section className="py-20 bg-gradient-to-b from-amber-50/50 to-green-50/30 border-y border-border/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-display font-bold mb-4">O Caminho do Dinheiro</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Do pedido à prestação de contas, cada passo importa.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {/* Trail visualization */}
              <div className="relative">
                {/* Central path line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-accent/40 via-primary/40 to-accent/40 transform -translate-x-1/2 rounded-full hidden md:block" />
                
                <div className="space-y-8 md:space-y-0">
                  {[
                    { step: "01", title: "Pedido", desc: "Identificar a necessidade" },
                    { step: "02", title: "Pesquisa", desc: "Buscar 3 orçamentos" },
                    { step: "03", title: "Autorização", desc: "Deliberação registrada" },
                    { step: "04", title: "Recebimento", desc: "Conferir e atestar" },
                    { step: "05", title: "Pagamento", desc: "Nota fiscal + comprovante" },
                    { step: "06", title: "Arquivo", desc: "Guardar documentos" },
                    { step: "07", title: "Prestação", desc: "Enviar ao SIGPC" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className={`relative flex items-center gap-6 md:gap-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                    >
                      {/* Content card */}
                      <div className={`flex-1 md:w-[45%] ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}>
                        <div className="card-clay p-5 inline-block">
                          <div className="flex items-center gap-3 mb-1" style={{ justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start' }}>
                            <span className="text-xs font-bold text-accent">{item.step}</span>
                            <h4 className="font-display font-bold text-lg">{item.title}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      
                      {/* Center milestone */}
                      <div className="hidden md:flex items-center justify-center w-[10%]">
                        <div className="w-12 h-12 rounded-2xl bg-white border-4 border-accent/30 flex items-center justify-center shadow-lg z-10">
                          <span className="text-sm font-bold text-accent">{item.step}</span>
                        </div>
                      </div>
                      
                      {/* Spacer for opposite side */}
                      <div className="hidden md:block flex-1 md:w-[45%]" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Card */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <Card className="card-clay border-primary/20 bg-gradient-to-br from-green-50/50 to-amber-50/30 overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Leaf className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl mb-4">Este site é um apoio, não substitui a orientação oficial</h3>
                      <ul className="space-y-3 text-muted-foreground">
                        <li className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <span>Orienta, organiza e reduz ansiedade</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <span>Indica sempre as fontes oficiais (FNDE, Secretaria)</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <span>Não coleta dados sensíveis da escola</span>
                        </li>
                      </ul>
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
        <div className="card-clay glass-card-hover h-full cursor-pointer group p-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {desc}
          </p>
          <div className="flex items-center text-sm font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
            Acessar <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
