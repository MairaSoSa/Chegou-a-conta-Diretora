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
  Lightbulb, BookOpen, Sparkles, Anchor, Ship, Paperclip
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
  materiais?: Array<{
    nome: string;
    descricao: string;
    tipo: 'pdf' | 'planilha' | 'modelo';
  }>;
  anterior?: string;
  proximo?: string;
}> = {
  'U00': {
    id: 'U00',
    titulo: 'Boas-vindas: o mapa do rio',
    subtitulo: 'Entenda como usar a trilha de aprendizagem',
    tempo: '10 min',
    intro: 'Bem-vinda ao Mapa do Rio! Aqui você vai aprender tudo sobre gestão de recursos da escola, navegando de trapiche em trapiche. Cada trapiche é uma parada pra você aprender algo novo e levar conhecimento pro seu dia a dia na escola.',
    secoes: [
      {
        tipo: 'texto',
        titulo: 'Como navegar pelo mapa',
        conteudo: 'O mapa mostra todos os trapiches (unidades) que você vai visitar ao longo da sua jornada de aprendizado. O barquinho mostra onde você está agora. Quando terminar um trapiche, o barquinho navega pro próximo automaticamente!'
      },
      {
        tipo: 'dica',
        titulo: 'Seu progresso é salvo automaticamente',
        conteudo: 'Não se preocupe em perder onde parou. O sistema guarda seu progresso direitinho, então você pode fechar o navegador e voltar quando quiser que tudo vai estar lá esperando por você.'
      },
      {
        tipo: 'texto',
        titulo: 'O que você vai encontrar em cada trapiche',
        conteudo: 'Ao longo da trilha você vai encontrar diferentes tipos de conteúdo: textos explicando os conceitos de forma simples, checklists pra você seguir passo a passo, modelos prontos pra baixar e usar na escola, e dicas práticas do dia a dia.'
      },
      {
        tipo: 'pratica',
        titulo: 'Mãos à obra!',
        conteudo: 'Ao final de cada unidade, marque como concluída pra avançar no mapa. Você pode voltar a qualquer trapiche depois pra revisar o conteúdo sempre que precisar!'
      }
    ],
    materiais: [
      { nome: 'Guia de Navegação', descricao: 'PDF explicando como usar a plataforma', tipo: 'pdf' }
    ],
    proximo: 'U01'
  },
  'U01': {
    id: 'U01',
    titulo: 'Checklist de 30 dias (Piloto)',
    subtitulo: 'Organize a gestão financeira da escola em um mês',
    tempo: '30 min',
    intro: 'Nos primeiros 30 dias como gestora, você vai organizar a casa! Este checklist te guia semana a semana pra criar uma rotina que funciona de verdade. Não precisa fazer tudo de uma vez - vá no seu ritmo.',
    secoes: [
      {
        tipo: 'texto',
        titulo: 'Por que organizar nos primeiros 30 dias?',
        conteudo: 'O primeiro mês é fundamental pra entender como as coisas funcionam na escola. É nesse período que você vai conhecer os programas, os documentos e as pessoas que fazem a gestão financeira acontecer. Organizando tudo desde o início, você evita problemas lá na frente.'
      },
      {
        tipo: 'checklist',
        titulo: 'Semana 1 - Conhecer o terreno',
        conteudo: [
          'Levantar todos os programas que a escola participa (PDDE, PNAE, PNATE)',
          'Verificar se há prestações de contas pendentes de anos anteriores',
          'Localizar documentos importantes (atas, notas fiscais, extratos bancários)',
          'Conhecer os membros do Conselho Escolar e suas funções'
        ]
      },
      {
        tipo: 'checklist',
        titulo: 'Semana 2 - Organizar os documentos',
        conteudo: [
          'Criar uma pasta física para cada programa (PDDE, PNAE, etc)',
          'Criar pasta digital no computador espelhando a organização física',
          'Padronizar nomes de arquivos (ex: 2024_PDDE_NF001_material_escolar)',
          'Separar documentos por ano para facilitar a busca'
        ]
      },
      {
        tipo: 'checklist',
        titulo: 'Semana 3 - Estabelecer rotinas',
        conteudo: [
          'Definir um dia fixo da semana para verificar extratos bancários',
          'Agendar reunião mensal do Conselho Escolar no calendário',
          'Criar checklist de conferência de notas fiscais antes de pagar',
          'Definir quem é responsável por cada tarefa financeira'
        ]
      },
      {
        tipo: 'checklist',
        titulo: 'Semana 4 - Consolidar e avaliar',
        conteudo: [
          'Fazer primeira reunião do Conselho com a nova rotina estabelecida',
          'Revisar o que funcionou bem e o que precisa de ajuste',
          'Documentar todas as decisões tomadas em ata',
          'Planejar as ações do próximo mês com base no aprendizado'
        ]
      },
      {
        tipo: 'dica',
        titulo: 'Dica de ouro',
        conteudo: 'Não tente fazer tudo sozinha! Envolva a equipe e o Conselho Escolar desde o início. Gestão financeira é trabalho em equipe e a transparência é sua maior aliada.'
      }
    ],
    materiais: [
      { nome: 'Modelo de Agenda de Reunião', descricao: 'Pauta pronta pra reunião do Conselho Escolar', tipo: 'modelo' },
      { nome: 'Planilha de Controle Mensal', descricao: 'Acompanhe receitas e despesas de cada programa', tipo: 'planilha' },
      { nome: 'Lista de Padronizações', descricao: 'Sugestões de nomes pra arquivos e pastas', tipo: 'pdf' }
    ],
    anterior: 'U00',
    proximo: 'U02'
  },
  'U02': {
    id: 'U02',
    titulo: 'Pôster: Caminho do Dinheiro',
    subtitulo: 'Do pedido até a prestação de contas - as 8 etapas',
    tempo: '15 min',
    intro: 'Entenda o caminho completo que o dinheiro faz: desde quando você decide comprar algo até prestar contas pro governo. São 8 etapas simples que, quando seguidas direitinho, garantem uma gestão transparente e sem problemas.',
    secoes: [
      {
        tipo: 'texto',
        titulo: 'Etapa 1: O Pedido',
        conteudo: 'Tudo começa com alguém identificando uma necessidade. Pode ser material escolar, serviço de manutenção, ou reparo urgente. O importante é que o pedido esteja por escrito, explicando o que precisa e por quê. Isso evita compras por impulso e garante que o dinheiro seja usado pro que realmente importa.'
      },
      {
        tipo: 'texto',
        titulo: 'Etapa 2: Pesquisa de Preços',
        conteudo: 'Antes de comprar qualquer coisa, pesquise pelo menos 3 preços diferentes de fornecedores. Anote tudo: nome da loja, valor, condições de pagamento. Isso garante que você está pagando um preço justo e mostra transparência na hora de prestar contas.'
      },
      {
        tipo: 'texto',
        titulo: 'Etapa 3: Autorização do Conselho',
        conteudo: 'O Conselho Escolar precisa aprovar a compra antes de você gastar. Apresente o pedido, mostre a pesquisa de preços e deixe o grupo decidir. Registre tudo em ata! Essa é uma das etapas mais importantes pra garantir que a decisão foi coletiva.'
      },
      {
        tipo: 'texto',
        titulo: 'Etapa 4: Compra ou Contratação',
        conteudo: 'Com a aprovação do Conselho, faça a compra ou contrate o serviço. Guarde todos os comprovantes: orçamentos, e-mails, conversas por mensagem. Quanto mais documentação, melhor!'
      },
      {
        tipo: 'texto',
        titulo: 'Etapa 5: Recebimento e Conferência',
        conteudo: 'Quando o material chegar ou o serviço for executado, confira tudo com calma. O que foi entregue é exatamente o que foi pedido? A quantidade está certa? A qualidade é boa? Só assine o recebimento depois de conferir.'
      },
      {
        tipo: 'texto',
        titulo: 'Etapa 6: Nota Fiscal Completa',
        conteudo: 'A nota fiscal precisa estar completa e correta: nome da escola, CNPJ, descrição detalhada do que foi comprado, valores unitários e totais. Uma nota fiscal incompleta pode dar problema na prestação de contas!'
      },
      {
        tipo: 'texto',
        titulo: 'Etapa 7: Pagamento',
        conteudo: 'Pague somente DEPOIS de receber o material ou serviço. Nunca pague antes! O pagamento deve ser feito diretamente da conta do programa (PDDE, PNAE, etc) para a conta do fornecedor. Nada de pagar em dinheiro vivo!'
      },
      {
        tipo: 'texto',
        titulo: 'Etapa 8: Arquivo e Prestação de Contas',
        conteudo: 'Guarde todos os documentos organizados na pasta do programa. Quando chegar a hora de prestar contas, você vai precisar de tudo: pedido, pesquisa de preços, ata, nota fiscal, comprovante de pagamento. Com tudo organizado, a prestação de contas fica muito mais fácil!'
      },
      {
        tipo: 'pratica',
        titulo: 'Coloque na parede!',
        conteudo: 'Imprima o pôster do Caminho do Dinheiro e cole num lugar visível da secretaria. Toda vez que for fazer uma compra, siga as 8 etapas. Com o tempo, isso vira automático!'
      }
    ],
    materiais: [
      { nome: 'Pôster Caminho do Dinheiro', descricao: 'Versão pra imprimir e colar na parede', tipo: 'pdf' },
      { nome: 'Checklist de Conferência', descricao: 'Lista pra conferir cada etapa antes de pagar', tipo: 'modelo' }
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
    intro: 'Esta unidade está sendo desenvolvida com muito carinho. Em breve você terá acesso ao conteúdo completo com textos, checklists e materiais de apoio!',
    secoes: [
      {
        tipo: 'texto',
        titulo: 'Aguarde novidades',
        conteudo: 'Estamos trabalhando neste conteúdo pra trazer informações práticas e úteis pro seu dia a dia na escola. Volte em breve para ver as atualizações!'
      },
      {
        tipo: 'dica',
        titulo: 'Continue sua jornada',
        conteudo: 'Enquanto isso, você pode continuar explorando os trapiches anteriores ou revisar o que já aprendeu. Cada revisão fortalece o conhecimento!'
      }
    ],
    anterior,
    proximo
  };
}

function NotebookLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute left-8 top-0 bottom-0 w-px bg-red-300/40" />
      <div className="absolute left-10 top-0 bottom-0 w-px bg-red-300/20" />
      {Array.from({ length: 40 }).map((_, i) => (
        <div 
          key={i} 
          className="absolute left-0 right-0 h-px bg-sky-200/50" 
          style={{ top: `${(i + 1) * 28}px` }}
        />
      ))}
    </div>
  );
}

function PaperClip({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 40" 
      className={cn("w-6 h-10", className)}
      fill="none"
    >
      <path 
        d="M12 2 C6 2 2 6 2 12 L2 28 C2 34 6 38 12 38 C18 38 22 34 22 28 L22 12 C22 8 19 5 16 5 C13 5 10 8 10 12 L10 26 C10 28 11 30 12 30 C13 30 14 28 14 26 L14 12"
        stroke="#9ca3af"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function FloatingLeaf({ delay, left, size }: { delay: number; left: string; size: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none opacity-20"
      style={{ left, top: -20 }}
      initial={{ y: -20, rotate: 0, opacity: 0 }}
      animate={{ 
        y: ['0%', '100vh'],
        rotate: [0, 360],
        opacity: [0, 0.2, 0.2, 0]
      }}
      transition={{
        duration: 20,
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
      </svg>
    </motion.div>
  );
}

export default function TrilhaUnidade() {
  const params = useParams();
  const unitId = params.unitId || 'U00';
  const { completeUnit, isUnitCompleted, totalUnits } = useTrilhaProgress();
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
            className="relative"
          >
            <div className="bg-[#fffef8] rounded-lg shadow-sm border border-amber-100/50 overflow-hidden relative">
              <NotebookLines />
              <div className="relative p-8 pl-14">
                <h3 className="font-semibold text-lg mb-4 text-amber-900 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-sm text-amber-700 font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  {secao.titulo}
                </h3>
                <p className="text-amber-800/80 leading-loose text-base">{secao.conteudo as string}</p>
              </div>
            </div>
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
            <div className="bg-[#f0fdf4] rounded-lg shadow-sm border border-emerald-200/50 overflow-hidden relative">
              <NotebookLines />
              <div className="relative p-8 pl-14">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shadow-sm">
                    <ListChecks className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-xl text-emerald-900">{secao.titulo}</h3>
                </div>
                <div className="space-y-4">
                  {(secao.conteudo as string[]).map((item, i) => {
                    const key = `${idx}-${i}`;
                    const isChecked = checkedItems[key] || false;
                    return (
                      <motion.div 
                        key={i} 
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-lg transition-all duration-200 border",
                          isChecked 
                            ? "bg-emerald-100/70 border-emerald-200" 
                            : "bg-white/70 border-emerald-100 hover:bg-white hover:border-emerald-200"
                        )}
                        whileHover={{ x: 4 }}
                      >
                        <Checkbox 
                          id={key}
                          checked={isChecked}
                          onCheckedChange={() => toggleCheck(key)}
                          className="mt-1 border-emerald-400 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 w-5 h-5"
                          data-testid={`checkbox-${idx}-${i}`}
                        />
                        <label 
                          htmlFor={key}
                          className={cn(
                            "cursor-pointer leading-relaxed flex-1 text-base",
                            isChecked ? "line-through text-emerald-600/60" : "text-emerald-800"
                          )}
                        >
                          {item}
                        </label>
                        {isChecked && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
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
            <div className="bg-[#fffbeb] rounded-lg shadow-sm border border-amber-200/50 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300" />
              <div className="p-8">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Lightbulb className="w-7 h-7 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-amber-900 mb-3">{secao.titulo}</h3>
                    <p className="text-amber-700/90 leading-relaxed text-base">{secao.conteudo as string}</p>
                  </div>
                </div>
              </div>
            </div>
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
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg shadow-sm border border-violet-200/50 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 via-purple-500 to-violet-400" />
              <div className="p-8">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <BookOpen className="w-7 h-7 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-violet-900 mb-3">{secao.titulo}</h3>
                    <p className="text-violet-700/90 leading-relaxed text-base">{secao.conteudo as string}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-background to-background flex flex-col font-sans overflow-hidden">
      <Navigation />
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <FloatingLeaf delay={0} left="5%" size={14} />
        <FloatingLeaf delay={5} left="90%" size={12} />
        <FloatingLeaf delay={10} left="50%" size={10} />
      </div>
      
      <main className="flex-1 relative z-10">
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-100/50 via-cyan-50/30 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
          
          <svg className="absolute bottom-0 left-0 right-0 w-full h-6" preserveAspectRatio="none" viewBox="0 0 1200 30">
            <path 
              d="M0 30 Q200 15 400 22 T800 18 T1200 25 V30 H0 Z" 
              fill="url(#waveGrad)" 
              opacity="0.25"
            />
            <defs>
              <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="container mx-auto px-4 py-10 relative">
            <motion.div 
              className="flex items-center gap-4 mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Link href="/trilha">
                <Button variant="ghost" size="sm" className="group" data-testid="button-voltar-mapa">
                  <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                  Voltar ao Mapa
                </Button>
              </Link>
              
              <div className="h-5 w-px bg-border/50" />
              
              <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-sky-200 px-3 py-1">
                <Clock className="w-3.5 h-3.5 mr-2 text-sky-500" />
                <span className="text-sky-700">{unidade.tempo}</span>
              </Badge>
              
              {isCompleted && (
                <Badge className="bg-emerald-500 text-white border-0 px-3 py-1">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                  Concluída
                </Badge>
              )}
            </motion.div>
            
            <motion.div 
              className="flex flex-col lg:flex-row items-start gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-accent via-orange-500 to-amber-500 flex items-center justify-center shadow-xl shadow-accent/30">
                  <span className="font-bold text-white text-2xl md:text-3xl">{unidade.id}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-accent/20">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-3 text-foreground/90 leading-tight">
                  {unidade.titulo}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-6">{unidade.subtitulo}</p>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-sm h-3 bg-sky-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-cyan-400 via-sky-500 to-cyan-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    Trapiche {unitNumber + 1} de {totalUnits}
                  </span>
                </div>
              </div>
              
              <div className="hidden xl:block">
                <motion.div
                  className="w-28 h-20"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Barquinho />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="mb-12 bg-gradient-to-br from-accent/10 via-orange-50 to-amber-50/50 rounded-2xl shadow-md overflow-hidden relative border border-accent/10">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent via-orange-400 to-amber-400" />
                <div className="p-10">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-orange-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Sparkles className="w-8 h-8 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-xl text-accent mb-4">Sobre este trapiche</h2>
                      <p className="text-lg text-foreground/80 leading-relaxed">{unidade.intro}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="space-y-8">
              {unidade.secoes.map((secao, idx) => renderSecao(secao, idx))}
            </div>

            {unidade.materiais && unidade.materiais.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12"
              >
                <div className="bg-[#f8fafc] rounded-2xl border border-slate-200/50 overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-8 py-5 border-b border-slate-200/50">
                    <div className="flex items-center gap-3">
                      <Paperclip className="w-5 h-5 text-slate-500" />
                      <h3 className="font-semibold text-lg text-slate-800">Materiais de Apoio</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid gap-4">
                      {unidade.materiais.map((material, idx) => (
                        <motion.div
                          key={idx}
                          className="relative group"
                          whileHover={{ x: 4 }}
                        >
                          <div className="absolute -left-3 top-1/2 -translate-y-1/2">
                            <PaperClip className="text-slate-400 group-hover:text-slate-500 transition-colors" />
                          </div>
                          <div className="ml-6 bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between gap-4 shadow-sm group-hover:shadow-md group-hover:border-slate-300 transition-all">
                            <div className="flex items-center gap-4 flex-1">
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                material.tipo === 'pdf' && "bg-red-50",
                                material.tipo === 'planilha' && "bg-emerald-50",
                                material.tipo === 'modelo' && "bg-sky-50"
                              )}>
                                <FileText className={cn(
                                  "w-6 h-6",
                                  material.tipo === 'pdf' && "text-red-500",
                                  material.tipo === 'planilha' && "text-emerald-500",
                                  material.tipo === 'modelo' && "text-sky-500"
                                )} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-900 mb-1">{material.nome}</h4>
                                <p className="text-sm text-slate-500 truncate">{material.descricao}</p>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-shrink-0 border-slate-200 hover:bg-slate-50"
                              data-testid={`download-material-${idx}`}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Baixar
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div 
              className="mt-16 relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              
              <div className="pt-12">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    {unidade.anterior && (
                      <Link href={`/trilha/${unidade.anterior}`}>
                        <Button variant="outline" size="lg" className="group" data-testid="button-anterior">
                          <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                          Trapiche Anterior
                        </Button>
                      </Link>
                    )}
                  </div>
                  
                  <div className="flex gap-4">
                    {!isCompleted && (
                      <Button 
                        size="lg"
                        className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/25"
                        onClick={() => completeUnit(unitId)}
                        data-testid="button-concluir"
                      >
                        <Anchor className="w-5 h-5 mr-2" />
                        Ancorar neste Trapiche
                      </Button>
                    )}
                    {isCompleted && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-5 py-2.5 text-base">
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Trapiche Visitado
                      </Badge>
                    )}
                    {unidade.proximo && (
                      <Link href={`/trilha/${unidade.proximo}`}>
                        <Button 
                          size="lg"
                          className="bg-gradient-to-r from-accent to-orange-500 hover:from-accent/90 hover:to-orange-500/90 shadow-lg shadow-accent/25 group" 
                          data-testid="button-proximo"
                        >
                          <Ship className="w-5 h-5 mr-2" />
                          Navegar pro Próximo
                          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
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
