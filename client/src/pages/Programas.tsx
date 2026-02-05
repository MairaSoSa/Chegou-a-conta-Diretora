import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, BookOpen, GraduationCap, Utensils, Bus, 
  Coins, ChevronDown, ChevronUp, FileText, Calculator,
  CheckCircle2, AlertCircle, HelpCircle, Landmark, Users,
  Accessibility, Sparkles, BookMarked, Laptop, Palette,
  TreePine, Heart, School
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Programa {
  id: string;
  nome: string;
  sigla: string;
  descricao: string;
  icone: React.ReactNode;
  cor: string;
  corFundo: string;
  corBorda: string;
  destaque?: string;
  subprogramas?: Array<{
    id: string;
    nome: string;
    descricao: string;
    icone: React.ReactNode;
  }>;
}

const PROGRAMAS: Programa[] = [
  {
    id: 'pdde-basico',
    nome: 'PDDE Básico',
    sigla: 'PDDE',
    descricao: 'Dinheiro que vai direto pra conta da escola pra você usar em material, manutenção e melhorias. É o "arroz com feijão" dos recursos - toda escola pública recebe.',
    icone: <Coins className="w-6 h-6" />,
    cor: 'text-emerald-700',
    corFundo: 'bg-emerald-50',
    corBorda: 'border-emerald-200',
    destaque: 'Mais usado',
    subprogramas: undefined
  },
  {
    id: 'acoes-integradas',
    nome: 'Ações Integradas do PDDE',
    sigla: 'PDDE Qualidade',
    descricao: 'São verbas extras do PDDE pra projetos específicos. Cada ação tem regras próprias sobre o que pode comprar. A escola precisa aderir a cada uma.',
    icone: <Sparkles className="w-6 h-6" />,
    cor: 'text-violet-700',
    corFundo: 'bg-violet-50',
    corBorda: 'border-violet-200',
    subprogramas: [
      {
        id: 'educacao-integral',
        nome: 'Educação Integral',
        descricao: 'Pra escolas com jornada ampliada - comprar materiais e equipamentos pro contraturno',
        icone: <GraduationCap className="w-5 h-5" />
      },
      {
        id: 'escola-acessivel',
        nome: 'Escola Acessível',
        descricao: 'Adaptar a escola pra alunos com deficiência - rampas, banheiros, sinalização',
        icone: <Accessibility className="w-5 h-5" />
      },
      {
        id: 'mais-alfabetizacao',
        nome: 'Mais Alfabetização',
        descricao: 'Materiais e recursos pra turmas de 1º e 2º ano do fundamental',
        icone: <BookMarked className="w-5 h-5" />
      },
      {
        id: 'escola-conectada',
        nome: 'Escola Conectada',
        descricao: 'Equipamentos de informática e infraestrutura de internet',
        icone: <Laptop className="w-5 h-5" />
      },
      {
        id: 'educacao-campo',
        nome: 'Educação do Campo',
        descricao: 'Recursos específicos pra escolas rurais, quilombolas e indígenas',
        icone: <TreePine className="w-5 h-5" />
      },
      {
        id: 'novo-ensino-medio',
        nome: 'Novo Ensino Médio',
        descricao: 'Implementação dos itinerários formativos e laboratórios',
        icone: <Palette className="w-5 h-5" />
      }
    ]
  },
  {
    id: 'pnae',
    nome: 'Alimentação Escolar',
    sigla: 'PNAE',
    descricao: 'Verba pra merenda! Mas atenção: quem gerencia geralmente é a prefeitura ou estado. A escola participa do cardápio e da fiscalização.',
    icone: <Utensils className="w-6 h-6" />,
    cor: 'text-orange-700',
    corFundo: 'bg-orange-50',
    corBorda: 'border-orange-200',
    destaque: 'Gestão compartilhada'
  },
  {
    id: 'pnate',
    nome: 'Transporte Escolar',
    sigla: 'PNATE',
    descricao: 'Dinheiro pro transporte dos alunos da zona rural até a escola. Geralmente fica com o município, mas a escola pode ajudar na fiscalização.',
    icone: <Bus className="w-6 h-6" />,
    cor: 'text-sky-700',
    corFundo: 'bg-sky-50',
    corBorda: 'border-sky-200',
    destaque: 'Zona rural'
  }
];

function ProgramaCard({ programa }: { programa: Programa }) {
  const [expanded, setExpanded] = useState(false);
  const hasSubprogramas = programa.subprogramas && programa.subprogramas.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300 border-2",
        programa.corBorda,
        "hover:shadow-lg"
      )}>
        <div className={cn("absolute top-0 left-0 right-0 h-1.5", programa.corFundo.replace('bg-', 'bg-').replace('50', '400'))} />
        
        <CardContent className="p-0">
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                programa.corFundo,
                programa.cor
              )}>
                {programa.icone}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className={cn("font-mono text-xs", programa.corBorda, programa.cor)}>
                    {programa.sigla}
                  </Badge>
                  {programa.destaque && (
                    <Badge className={cn("text-xs", programa.corFundo, programa.cor, "border-0")}>
                      {programa.destaque}
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-xl text-foreground">{programa.nome}</h3>
              </div>
            </div>
            
            <p className="text-muted-foreground leading-relaxed mb-4">
              {programa.descricao}
            </p>
            
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={`/programas/${programa.id}`}>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={cn("group", programa.corBorda)}
                  data-testid={`ver-regras-${programa.id}`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Regras
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              {hasSubprogramas && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className={programa.cor}
                  data-testid={`expandir-${programa.id}`}
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Fechar ações
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Ver {programa.subprogramas?.length} ações
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          <AnimatePresence>
            {expanded && hasSubprogramas && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className={cn("border-t p-4", programa.corBorda, programa.corFundo)}>
                  <div className="grid gap-3">
                    {programa.subprogramas?.map((sub) => (
                      <Link key={sub.id} href={`/programas/${programa.id}/${sub.id}`}>
                        <div 
                          className="bg-white/80 rounded-lg p-4 flex items-start gap-3 hover:bg-white hover:shadow-sm transition-all cursor-pointer group"
                          data-testid={`subprograma-${sub.id}`}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            programa.corFundo,
                            programa.cor
                          )}>
                            {sub.icone}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {sub.nome}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {sub.descricao}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickInfoCard({ 
  icone, 
  titulo, 
  descricao, 
  cor 
}: { 
  icone: React.ReactNode; 
  titulo: string; 
  descricao: string; 
  cor: string;
}) {
  return (
    <div className={cn(
      "rounded-xl p-5 border",
      cor
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {icone}
        </div>
        <div>
          <h4 className="font-semibold mb-1">{titulo}</h4>
          <p className="text-sm opacity-80">{descricao}</p>
        </div>
      </div>
    </div>
  );
}

export default function Programas() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-background to-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1">
        <div className="bg-gradient-to-br from-accent/5 via-orange-50/50 to-transparent py-12 border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-accent" />
                </div>
                <Badge variant="outline" className="border-accent/30 text-accent">
                  Verbas Federais
                </Badge>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4 text-foreground">
                Programas e Políticas
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Conheça cada verba que chega na escola: de onde vem, o que pode comprar, 
                e como prestar contas direitinho. Tudo explicado em linguagem simples!
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <QuickInfoCard
              icone={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              titulo="O que pode"
              descricao="Cada programa tem uma lista do que você pode comprar ou contratar"
              cor="bg-emerald-50 border-emerald-200 text-emerald-900"
            />
            <QuickInfoCard
              icone={<AlertCircle className="w-5 h-5 text-red-500" />}
              titulo="O que não pode"
              descricao="Fique atenta às proibições pra não ter problema na prestação de contas"
              cor="bg-red-50 border-red-200 text-red-900"
            />
            <QuickInfoCard
              icone={<Calculator className="w-5 h-5 text-sky-600" />}
              titulo="Prestação de Contas"
              descricao="Prazo, documentos e sistema - tudo o que você precisa saber"
              cor="bg-sky-50 border-sky-200 text-sky-900"
            />
          </div>
        </div>

        <div className="container mx-auto px-4 pb-16">
          <div className="flex items-center gap-3 mb-8">
            <School className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-bold">Verbas da Escola</h2>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            {PROGRAMAS.slice(0, 2).map((programa) => (
              <ProgramaCard key={programa.id} programa={programa} />
            ))}
          </div>

          <div className="flex items-center gap-3 mb-8">
            <Users className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-bold">Verbas Compartilhadas</h2>
            <Badge variant="outline" className="text-muted-foreground">
              Geridas pela Secretaria
            </Badge>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            {PROGRAMAS.slice(2).map((programa) => (
              <ProgramaCard key={programa.id} programa={programa} />
            ))}
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl p-8 border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-amber-900 mb-2">Não sabe por onde começar?</h3>
                <p className="text-amber-700 mb-4">
                  O PDDE Básico é o programa mais importante pra diretora. É ele que você vai usar no dia a dia 
                  pra comprar material, fazer pequenos reparos e manter a escola funcionando.
                </p>
                <Link href="/programas/pdde-basico">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white" data-testid="comecar-pdde">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Começar pelo PDDE Básico
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
