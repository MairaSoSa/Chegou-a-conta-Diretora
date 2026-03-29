import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users, Heart, ShieldCheck } from "@/components/Icons";

export default function QuemSomos() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 text-center container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-6">Nossa Missão</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Acreditamos que diretores escolares devem focar no pedagógico, não na burocracia. 
            Criamos tecnologia para simplificar a gestão de recursos públicos com transparência e segurança.
          </p>
        </section>

        {/* Values */}
        <section className="bg-white/5 py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ValueCard 
                icon={Users}
                title="Foco nas Pessoas"
                desc="Ferramentas desenhadas para quem está no chão da escola, não para burocratas."
              />
              <ValueCard 
                icon={ShieldCheck}
                title="Segurança Jurídica"
                desc="Todas as orientações são baseadas nas resoluções mais recentes do FNDE."
              />
              <ValueCard 
                icon={Heart}
                title="Amor pela Educação"
                desc="Nascemos dentro da escola pública e trabalhamos para fortalecê-la."
              />
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-20 container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Fale Conosco</h2>
            <Card className="glass-card border-white/5">
              <CardContent className="p-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome</label>
                  <Input placeholder="Seu nome completo" className="bg-background border-white/10" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" placeholder="seu@email.com" className="bg-background border-white/10" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mensagem</label>
                  <Textarea placeholder="Como podemos ajudar?" className="bg-background border-white/10 min-h-[120px]" />
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                  Enviar Mensagem
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function ValueCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="text-center p-6">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground">{desc}</p>
    </div>
  );
}
