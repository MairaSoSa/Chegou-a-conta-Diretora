import { useState } from "react";
import { useParams, Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useTrilhaProgress } from "@/hooks/useTrilhaProgress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Barquinho } from "@/components/Barquinho";
import { 
  CheckCircle2, ChevronLeft, ChevronRight, Clock, 
  FileText, Download, MapPin, ListChecks,
  Lightbulb, BookOpen, Sparkles, Anchor, Ship
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const UNIDADES_CONTEUDO: Record<string, {
  id: string;
  titulo: string;
  subtitulo: string;
  tempo: string;
  intro: string;
  secoes: Array<{
    tipo: 'texto' | 'checklist' | 'modelo' | 'dica' | 'pratica';
    titulo: string;
    conteudo: string | string[];
  }>;
  anterior?: string;
  proximo?: string;
}> = {
  'U00': {
    id: 'U00',
    titulo: 'Boas-vindas: o mapa do rio',
    subtitulo: 'Entenda como usar a trilha',
    tempo: '10 min',
    intro: 'Bem-vinda ao Mapa do Rio! Aqui você vai aprender tudo sobre gestão de recursos da escola, navegando de porto em porto. Cada porto é uma parada pra você aprender algo novo.',
    secoes: [
      {
        tipo: 'texto',
        titulo: 'Como navegar pelo mapa',
        conteudo: 'O mapa mostra todos os portos (unidades) que você vai visitar. O barquinho mostra onde você está agora. Quando terminar um porto, o barquinho navega pro próximo!'
      },
      {
        tipo: 'dica',
        titulo: 'Seu progresso é salvo automaticamente',
        conteudo: 'Não se preocupe em perder onde parou. O sistema guarda seu progresso, então você pode fechar e voltar quando quiser.'
      },
      {
        tipo: 'texto',
        titulo: 'O que significam as caixas',
        conteudo: 'Ao longo da trilha você vai encontrar diferentes tipos de caixas: textos explicando o conceito, checklists pra você seguir, modelos prontos pra baixar, e dicas práticas.'
      },
      {
        tipo: 'pratica',
        titulo: 'Na Prática',
        conteudo: 'Ao final de cada unidade, marque como concluída pra avançar no mapa. Você pode voltar a qualquer unidade depois!'
      }
    ],
    proximo: 'U01'
  },
  'U01': {
    id: 'U01',
    titulo: 'Checklist de 30 dias (Piloto)',
    subtitulo: 'Organize a escola em um mês',
    tempo: '30 min',
    intro: 'Nos primeiros 30 dias, você vai organizar a casa! Este checklist te guia semana a semana pra criar uma rotina que funciona.',
    secoes: [
      {
        tipo: 'checklist',
        titulo: 'Semana 1 - Conhecer o terreno',
        conteudo: [
          'Levantar todos os programas que a escola participa (PDDE, PNAE, PNATE)',
          'Verificar se há prestações de contas pendentes',
          'Localizar documentos importantes (atas, notas fiscais, extratos)',
          'Conhecer os membros do Conselho Escolar'
        ]
      },
      {
        tipo: 'checklist',
        titulo: 'Semana 2 - Organizar os documentos',
        conteudo: [
          'Criar pasta física para cada programa',
          'Criar pasta digital espelhando a física',
          'Padronizar nomes de arquivos (ex: 2024_PDDE_NF001_material)',
          'Separar documentos por ano'
        ]
      },
      {
        tipo: 'checklist',
        titulo: 'Semana 3 - Estabelecer rotinas',
        conteudo: [
          'Definir dia da semana para verificar extratos',
          'Agendar reunião mensal do Conselho',
          'Criar checklist de conferência de notas fiscais',
          'Definir responsável por cada tarefa'
        ]
      },
      {
        tipo: 'checklist',
        titulo: 'Semana 4 - Consolidar e avaliar',
        conteudo: [
          'Fazer primeira reunião do Conselho com nova rotina',
          'Revisar o que funcionou e o que precisa ajustar',
          'Documentar as decisões tomadas',
          'Planejar o próximo mês'
        ]
      },
      {
        tipo: 'modelo',
        titulo: 'Modelo: Agenda de Reunião do Conselho',
        conteudo: 'Um modelo pronto pra você usar nas reuniões do Conselho Escolar, com pauta organizada e espaço pra decisões.'
      },
      {
        tipo: 'modelo',
        titulo: 'Modelo: Lista de Padronizações',
        conteudo: 'Lista com sugestões de nomes de arquivos, pastas e rotinas pra manter tudo organizado.'
      }
    ],
    anterior: 'U00',
    proximo: 'U02'
  },
  'U02': {
    id: 'U02',
    titulo: 'Pôster: Caminho do Dinheiro',
    subtitulo: 'Do pedido à prestação de contas',
    tempo: '15 min',
    intro: 'Entenda o caminho completo que o dinheiro faz: desde quando você decide comprar algo até prestar contas. São 8 etapas simples!',
    secoes: [
      {
        tipo: 'texto',
        titulo: '1. Pedido',
        conteudo: 'Tudo começa com alguém pedindo algo. Pode ser material, serviço, ou reparo. O pedido precisa estar por escrito!'
      },
      {
        tipo: 'texto',
        titulo: '2. Pesquisa de Preços',
        conteudo: 'Antes de comprar, pesquise pelo menos 3 preços diferentes. Isso garante que você está pagando um preço justo.'
      },
      {
        tipo: 'texto',
        titulo: '3. Autorização',
        conteudo: 'O Conselho Escolar precisa aprovar a compra. Registre em ata!'
      },
      {
        tipo: 'texto',
        titulo: '4. Compra/Contratação',
        conteudo: 'Faça a compra ou contrate o serviço. Guarde todos os comprovantes!'
      },
      {
        tipo: 'texto',
        titulo: '5. Entrega/Execução',
        conteudo: 'Receba o material ou acompanhe o serviço. Confira se está tudo certo antes de assinar.'
      },
      {
        tipo: 'texto',
        titulo: '6. Nota Fiscal',
        conteudo: 'A nota fiscal precisa estar completa: nome da escola, CNPJ, descrição detalhada do que foi comprado.'
      },
      {
        tipo: 'texto',
        titulo: '7. Pagamento',
        conteudo: 'Pague somente depois de receber. Nunca pague antes! O pagamento deve ser feito da conta do programa.'
      },
      {
        tipo: 'texto',
        titulo: '8. Arquivo e Prestação',
        conteudo: 'Guarde todos os documentos organizados. Na hora de prestar contas, você vai precisar de tudo!'
      },
      {
        tipo: 'pratica',
        titulo: 'Na Prática',
        conteudo: 'Imprima o pôster e cole num lugar visível. Toda vez que for fazer uma compra, siga as 8 etapas!'
      },
      {
        tipo: 'modelo',
        titulo: 'Pôster para Imprimir',
        conteudo: 'Versão do pôster "Caminho do Dinheiro" pronta para imprimir e colar na parede da escola.'
      }
    ],
    anterior: 'U01',
    proximo: 'U03'
  }
};

for (let i = 3; i <= 24; i++) {
  const id = `U${i.toString().padStart(2, '0')}`;
  const anterior = `U${(i-1).toString().padStart(2, '0')}`;
  const proximo = i < 24 ? `U${(i+1).toString().padStart(2, '0')}` : undefined;
  
  UNIDADES_CONTEUDO[id] = {
    id,
    titulo: `Unidade ${i}`,
    subtitulo: 'Conteúdo em desenvolvimento',
    tempo: '20 min',
    intro: 'Esta unidade está sendo desenvolvida. Em breve você terá acesso ao conteúdo completo!',
    secoes: [
      {
        tipo: 'texto',
        titulo: 'Aguarde novidades',
        conteudo: 'Estamos trabalhando neste conteúdo. Volte em breve para ver as atualizações!'
      },
      {
        tipo: 'dica',
        titulo: 'Continue navegando',
        conteudo: 'Enquanto isso, você pode continuar explorando as outras unidades disponíveis.'
      }
    ],
    anterior,
    proximo
  };
}

function FloatingLeaf({ delay, left, size }: { delay: number; left: string; size: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none opacity-30"
      style={{ left, top: -20 }}
      initial={{ y: -20, rotate: 0, opacity: 0 }}
      animate={{ 
        y: ['0%', '100vh'],
        rotate: [0, 360],
        opacity: [0, 0.3, 0.3, 0]
      }}
      transition={{
        duration: 15,
        delay,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path 
          d="M12 2C8 6 4 10 4 14c0 4 4 8 8 8s8-4 8-8c0-4-4-8-8-12z" 
          fill="#22c55e" 
          opacity="0.6"
        />
        <path 
          d="M12 6v12M8 10c2 2 4 4 4 8M16 10c-2 2-4 4-4 8" 
          stroke="#166534" 
          strokeWidth="1"
          opacity="0.4"
        />
      </svg>
    </motion.div>
  );
}

function WaterRipple() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-2 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export default function TrilhaUnidade() {
  const params = useParams();
  const unitId = params.unitId || 'U00';
  const { completeUnit, isUnitCompleted, completedCount, totalUnits } = useTrilhaProgress();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  
  const unidade = UNIDADES_CONTEUDO[unitId] || UNIDADES_CONTEUDO['U00'];
  const isCompleted = isUnitCompleted(unitId);
  const unitNumber = parseInt(unitId.replace('U', ''));
  const progressPercent = Math.round(((unitNumber + 1) / totalUnits) * 100);

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSecao = (secao: typeof unidade.secoes[0], idx: number) => {
    const variants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    };

    switch (secao.tipo) {
      case 'texto':
        return (
          <motion.div
            key={idx}
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm overflow-hidden group hover:shadow-md transition-shadow duration-300">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/40 to-primary/10" />
              <CardContent className="p-6 pl-8">
                <h3 className="font-semibold text-lg mb-3 text-foreground/90 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">
                    {idx + 1}
                  </span>
                  {secao.titulo}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{secao.conteudo as string}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      
      case 'checklist':
        return (
          <motion.div
            key={idx}
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-0 shadow-sm overflow-hidden bg-gradient-to-br from-emerald-50/90 to-green-50/80 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-green-400" />
              <CardContent className="p-6 pl-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <ListChecks className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-emerald-900">{secao.titulo}</h3>
                </div>
                <div className="space-y-4">
                  {(secao.conteudo as string[]).map((item, i) => {
                    const key = `${idx}-${i}`;
                    const isChecked = checkedItems[key] || false;
                    return (
                      <motion.div 
                        key={i} 
                        className={cn(
                          "flex items-start gap-4 p-3 rounded-lg transition-all duration-200",
                          isChecked ? "bg-emerald-100/50" : "bg-white/50 hover:bg-white/80"
                        )}
                        whileHover={{ x: 4 }}
                      >
                        <Checkbox 
                          id={key}
                          checked={isChecked}
                          onCheckedChange={() => toggleCheck(key)}
                          className="mt-0.5 border-emerald-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                          data-testid={`checkbox-${idx}-${i}`}
                        />
                        <label 
                          htmlFor={key}
                          className={cn(
                            "cursor-pointer text-sm leading-relaxed flex-1",
                            isChecked ? "line-through text-emerald-600/60" : "text-emerald-800"
                          )}
                        >
                          {item}
                        </label>
                        {isChecked && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      
      case 'modelo':
        return (
          <motion.div
            key={idx}
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-0 shadow-sm overflow-hidden bg-gradient-to-br from-sky-50/90 to-blue-50/80 backdrop-blur-sm group">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sky-500 to-blue-400" />
              <CardContent className="p-6 pl-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 text-sky-600" />
                      </div>
                      <h3 className="font-semibold text-lg text-sky-900">{secao.titulo}</h3>
                    </div>
                    <p className="text-sm text-sky-700/80 leading-relaxed">{secao.conteudo as string}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-shrink-0 border-sky-200 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all"
                    data-testid={`download-modelo-${idx}`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      
      case 'dica':
        return (
          <motion.div
            key={idx}
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-0 shadow-sm overflow-hidden bg-gradient-to-br from-amber-50/90 to-yellow-50/80 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-yellow-400" />
              <CardContent className="p-6 pl-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">{secao.titulo}</h3>
                    <p className="text-sm text-amber-700/80 leading-relaxed">{secao.conteudo as string}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      
      case 'pratica':
        return (
          <motion.div
            key={idx}
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-0 shadow-sm overflow-hidden bg-gradient-to-br from-violet-50/90 to-purple-50/80 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-purple-400" />
              <CardContent className="p-6 pl-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-violet-900 mb-2">{secao.titulo}</h3>
                    <p className="text-sm text-violet-700/80 leading-relaxed">{secao.conteudo as string}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 via-background to-background flex flex-col font-sans overflow-hidden">
      <Navigation />
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <FloatingLeaf delay={0} left="10%" size={16} />
        <FloatingLeaf delay={3} left="25%" size={12} />
        <FloatingLeaf delay={6} left="75%" size={14} />
        <FloatingLeaf delay={9} left="85%" size={10} />
      </div>
      
      <main className="flex-1 relative z-10">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/40 via-sky-50/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
          
          <svg className="absolute bottom-0 left-0 right-0 w-full h-8" preserveAspectRatio="none" viewBox="0 0 1200 40">
            <path 
              d="M0 40 Q300 20 600 30 T1200 20 V40 H0 Z" 
              fill="url(#waveGrad)" 
              opacity="0.3"
            />
            <defs>
              <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="container mx-auto px-4 py-8 relative">
            <motion.div 
              className="flex items-center gap-4 mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Link href="/trilha">
                <Button variant="ghost" size="sm" className="group" data-testid="button-voltar-mapa">
                  <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                  Voltar ao Mapa
                </Button>
              </Link>
              
              <div className="h-4 w-px bg-border/50" />
              
              <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-sky-200">
                <Clock className="w-3 h-3 mr-1.5 text-sky-500" />
                <span className="text-sky-700">{unidade.tempo}</span>
              </Badge>
              
              {isCompleted && (
                <Badge className="bg-emerald-500 text-white border-0">
                  <CheckCircle2 className="w-3 h-3 mr-1.5" />
                  Concluída
                </Badge>
              )}
            </motion.div>
            
            <motion.div 
              className="flex flex-col md:flex-row items-start gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/20">
                  <span className="font-bold text-white text-xl md:text-2xl">{unidade.id}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-accent" />
                </div>
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl md:text-4xl font-bold font-display mb-2 text-foreground/90">
                  {unidade.titulo}
                </h1>
                <p className="text-lg text-muted-foreground">{unidade.subtitulo}</p>
                
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 max-w-xs h-2 bg-sky-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-sky-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Porto {unitNumber + 1} de {totalUnits}
                  </span>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <motion.div
                  className="w-24 h-16"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Barquinho />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="mb-10 border-0 shadow-md overflow-hidden bg-gradient-to-br from-accent/5 to-orange-50/50 backdrop-blur-sm relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-orange-400 to-accent" />
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg text-accent mb-2">Sobre esta parada</h2>
                      <p className="text-lg text-foreground/80 leading-relaxed">{unidade.intro}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="space-y-6">
              {unidade.secoes.map((secao, idx) => renderSecao(secao, idx))}
            </div>

            <motion.div 
              className="mt-14 relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              
              <div className="pt-10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    {unidade.anterior && (
                      <Link href={`/trilha/${unidade.anterior}`}>
                        <Button variant="outline" className="group" data-testid="button-anterior">
                          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                          Porto Anterior
                        </Button>
                      </Link>
                    )}
                  </div>
                  
                  <div className="flex gap-4">
                    {!isCompleted && (
                      <Button 
                        className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-md shadow-emerald-500/20"
                        onClick={() => completeUnit(unitId)}
                        data-testid="button-concluir"
                      >
                        <Anchor className="w-4 h-4 mr-2" />
                        Ancorar neste Porto
                      </Button>
                    )}
                    {isCompleted && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-4 py-2">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Porto Visitado
                      </Badge>
                    )}
                    {unidade.proximo && (
                      <Link href={`/trilha/${unidade.proximo}`}>
                        <Button className="bg-gradient-to-r from-accent to-orange-500 hover:from-accent/90 hover:to-orange-500/90 shadow-md shadow-accent/20 group" data-testid="button-proximo">
                          <Ship className="w-4 h-4 mr-2" />
                          Navegar pro Próximo
                          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
