import { useState } from "react";
import { useParams, Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useTrilhaProgress } from "@/hooks/useTrilhaProgress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CheckCircle2, ChevronLeft, ChevronRight, Clock, 
  FileText, Download, Play, MapPin, ListChecks,
  Lightbulb, BookOpen, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function TrilhaUnidade() {
  const params = useParams();
  const unitId = params.unitId || 'U00';
  const { completeUnit, isUnitCompleted } = useTrilhaProgress();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  
  const unidade = UNIDADES_CONTEUDO[unitId] || UNIDADES_CONTEUDO['U00'];
  const isCompleted = isUnitCompleted(unitId);

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSecao = (secao: typeof unidade.secoes[0], idx: number) => {
    switch (secao.tipo) {
      case 'texto':
        return (
          <Card key={idx} className="border-border/50">
            <CardContent className="p-5">
              <h3 className="font-bold text-lg mb-2">{secao.titulo}</h3>
              <p className="text-muted-foreground">{secao.conteudo as string}</p>
            </CardContent>
          </Card>
        );
      
      case 'checklist':
        return (
          <Card key={idx} className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">{secao.titulo}</h3>
              </div>
              <div className="space-y-3">
                {(secao.conteudo as string[]).map((item, i) => {
                  const key = `${idx}-${i}`;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <Checkbox 
                        id={key}
                        checked={checkedItems[key] || false}
                        onCheckedChange={() => toggleCheck(key)}
                        className="mt-0.5"
                        data-testid={`checkbox-${idx}-${i}`}
                      />
                      <label 
                        htmlFor={key}
                        className={cn(
                          "cursor-pointer text-sm",
                          checkedItems[key] ? "line-through text-muted-foreground" : ""
                        )}
                      >
                        {item}
                      </label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      
      case 'modelo':
        return (
          <Card key={idx} className="border-sky-200 bg-sky-50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-sky-600" />
                    <h3 className="font-bold text-lg text-sky-900">{secao.titulo}</h3>
                  </div>
                  <p className="text-sm text-sky-700">{secao.conteudo as string}</p>
                </div>
                <Button variant="outline" size="sm" className="flex-shrink-0" data-testid={`download-modelo-${idx}`}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'dica':
        return (
          <Card key={idx} className="border-amber-200 bg-amber-50">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-amber-900 mb-1">{secao.titulo}</h3>
                  <p className="text-sm text-amber-700">{secao.conteudo as string}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'pratica':
        return (
          <Card key={idx} className="border-purple-200 bg-purple-50">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-purple-900 mb-1">{secao.titulo}</h3>
                  <p className="text-sm text-purple-700">{secao.conteudo as string}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1">
        <div className="bg-gradient-to-b from-sky-50 to-background border-b border-border/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/trilha">
                <Button variant="ghost" size="sm" data-testid="button-voltar-mapa">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Voltar ao Mapa
                </Button>
              </Link>
              <Badge variant="outline" className="bg-white">
                <Clock className="w-3 h-3 mr-1" />
                {unidade.tempo}
              </Badge>
              {isCompleted && (
                <Badge className="bg-primary text-primary-foreground">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Concluída
                </Badge>
              )}
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border-2 border-accent flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-accent text-lg">{unidade.id}</span>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-display mb-2">{unidade.titulo}</h1>
                <p className="text-muted-foreground">{unidade.subtitulo}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Card className="mb-8 border-accent/20 bg-accent/5">
              <CardContent className="p-6">
                <p className="text-lg">{unidade.intro}</p>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {unidade.secoes.map((secao, idx) => renderSecao(secao, idx))}
            </div>

            <div className="mt-12 pt-8 border-t border-border/30">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex gap-2">
                  {unidade.anterior && (
                    <Link href={`/trilha/${unidade.anterior}`}>
                      <Button variant="outline" data-testid="button-anterior">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Anterior
                      </Button>
                    </Link>
                  )}
                </div>
                
                <div className="flex gap-3">
                  {!isCompleted && (
                    <Button 
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => completeUnit(unitId)}
                      data-testid="button-concluir"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Marcar como Concluída
                    </Button>
                  )}
                  {unidade.proximo && (
                    <Link href={`/trilha/${unidade.proximo}`}>
                      <Button className="bg-accent hover:bg-accent/90" data-testid="button-proximo">
                        Próximo
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
