import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Download, FileSpreadsheet, CheckSquare, FileText, 
  Wrench, ClipboardList, Calculator, Search,
  ShoppingCart, Receipt, FolderCheck, Calendar,
  Users, Banknote, FileCheck, Printer, Table,
  BookOpen, PenLine, ListChecks, Clock, Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Ferramenta {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'excel' | 'word' | 'checklist' | 'pdf';
  categoria: string;
  destaque?: boolean;
}

const CATEGORIAS = [
  { 
    id: 'planejar', 
    nome: 'Planejar', 
    icone: <Calendar className="w-5 h-5" />,
    cor: 'bg-violet-100 text-violet-700 border-violet-200',
    corAtivo: 'bg-violet-600 text-white'
  },
  { 
    id: 'pesquisar', 
    nome: 'Pesquisar Preços', 
    icone: <Search className="w-5 h-5" />,
    cor: 'bg-sky-100 text-sky-700 border-sky-200',
    corAtivo: 'bg-sky-600 text-white'
  },
  { 
    id: 'comprar', 
    nome: 'Comprar', 
    icone: <ShoppingCart className="w-5 h-5" />,
    cor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    corAtivo: 'bg-emerald-600 text-white'
  },
  { 
    id: 'receber', 
    nome: 'Receber e Conferir', 
    icone: <FolderCheck className="w-5 h-5" />,
    cor: 'bg-amber-100 text-amber-700 border-amber-200',
    corAtivo: 'bg-amber-600 text-white'
  },
  { 
    id: 'prestar', 
    nome: 'Prestar Contas', 
    icone: <FileCheck className="w-5 h-5" />,
    cor: 'bg-rose-100 text-rose-700 border-rose-200',
    corAtivo: 'bg-rose-600 text-white'
  }
];

const FERRAMENTAS: Ferramenta[] = [
  // PLANEJAR
  {
    id: 'plano-aplicacao',
    nome: 'Plano de Aplicação de Recursos',
    descricao: 'Planilha pra planejar como vai usar o dinheiro do PDDE. Já vem com as categorias certas.',
    tipo: 'excel',
    categoria: 'planejar',
    destaque: true
  },
  {
    id: 'ata-reuniao',
    nome: 'Modelo de Ata de Reunião',
    descricao: 'Documento pronto pra registrar as decisões do Conselho Escolar. É só preencher!',
    tipo: 'word',
    categoria: 'planejar'
  },
  {
    id: 'calendario-anual',
    nome: 'Calendário de Prazos',
    descricao: 'Planilha com todos os prazos importantes do ano: prestação de contas, reuniões, etc.',
    tipo: 'excel',
    categoria: 'planejar'
  },
  {
    id: 'lista-prioridades',
    nome: 'Lista de Prioridades da Escola',
    descricao: 'Checklist pra levantar e organizar o que a escola mais precisa antes de gastar.',
    tipo: 'checklist',
    categoria: 'planejar'
  },
  {
    id: 'convocacao-conselho',
    nome: 'Convocação de Reunião',
    descricao: 'Modelo de convocação pro Conselho Escolar com espaço pra pauta.',
    tipo: 'word',
    categoria: 'planejar'
  },

  // PESQUISAR
  {
    id: 'pesquisa-precos',
    nome: 'Planilha de Pesquisa de Preços',
    descricao: 'Compare até 5 fornecedores lado a lado. Calcula automaticamente o melhor preço.',
    tipo: 'excel',
    categoria: 'pesquisar',
    destaque: true
  },
  {
    id: 'mapa-fornecedores',
    nome: 'Cadastro de Fornecedores',
    descricao: 'Planilha pra manter os contatos dos fornecedores organizados com CNPJ e telefone.',
    tipo: 'excel',
    categoria: 'pesquisar'
  },
  {
    id: 'checklist-fornecedor',
    nome: 'Checklist de Análise de Fornecedor',
    descricao: 'Lista de verificação antes de escolher um fornecedor: documentos, regularidade, etc.',
    tipo: 'checklist',
    categoria: 'pesquisar'
  },
  {
    id: 'solicitacao-orcamento',
    nome: 'Modelo de Solicitação de Orçamento',
    descricao: 'Carta formal pra pedir orçamento aos fornecedores com todas as especificações.',
    tipo: 'word',
    categoria: 'pesquisar'
  },

  // COMPRAR
  {
    id: 'autorizacao-compra',
    nome: 'Autorização de Compra',
    descricao: 'Documento que autoriza a compra após aprovação do Conselho. Essencial pro arquivo!',
    tipo: 'word',
    categoria: 'comprar',
    destaque: true
  },
  {
    id: 'controle-pagamentos',
    nome: 'Controle de Pagamentos',
    descricao: 'Planilha pra registrar cada pagamento feito: data, valor, fornecedor, NF.',
    tipo: 'excel',
    categoria: 'comprar'
  },
  {
    id: 'checklist-nota-fiscal',
    nome: 'Checklist de Nota Fiscal',
    descricao: 'Confira se a nota fiscal está completa antes de pagar. Evita dor de cabeça depois!',
    tipo: 'checklist',
    categoria: 'comprar'
  },
  {
    id: 'termo-contratacao',
    nome: 'Termo de Contratação de Serviço',
    descricao: 'Modelo pra contratar serviços como manutenção, pintura, consertos.',
    tipo: 'word',
    categoria: 'comprar'
  },

  // RECEBER
  {
    id: 'termo-recebimento',
    nome: 'Termo de Recebimento de Material',
    descricao: 'Documento pra assinar quando o material chegar. Comprova que você recebeu tudo certo.',
    tipo: 'word',
    categoria: 'receber',
    destaque: true
  },
  {
    id: 'checklist-conferencia',
    nome: 'Checklist de Conferência',
    descricao: 'Lista pra conferir se o que chegou é igual ao que foi pedido: quantidade, qualidade, etc.',
    tipo: 'checklist',
    categoria: 'receber'
  },
  {
    id: 'ateste-servico',
    nome: 'Atestado de Execução de Serviço',
    descricao: 'Documento pra atestar que o serviço foi executado conforme combinado.',
    tipo: 'word',
    categoria: 'receber'
  },
  {
    id: 'controle-patrimonio',
    nome: 'Controle de Patrimônio',
    descricao: 'Planilha pra registrar os bens permanentes: móveis, equipamentos, com número de patrimônio.',
    tipo: 'excel',
    categoria: 'receber'
  },

  // PRESTAR CONTAS
  {
    id: 'demonstrativo-execucao',
    nome: 'Demonstrativo de Execução',
    descricao: 'Planilha resumo de tudo que foi gasto no período. Base pra prestação de contas.',
    tipo: 'excel',
    categoria: 'prestar',
    destaque: true
  },
  {
    id: 'relacao-pagamentos',
    nome: 'Relação de Pagamentos',
    descricao: 'Lista todos os pagamentos feitos com a verba, organizados por data.',
    tipo: 'excel',
    categoria: 'prestar'
  },
  {
    id: 'conciliacao-bancaria',
    nome: 'Conciliação Bancária',
    descricao: 'Planilha pra conferir se o extrato bate com os pagamentos registrados.',
    tipo: 'excel',
    categoria: 'prestar'
  },
  {
    id: 'checklist-prestacao',
    nome: 'Checklist da Prestação de Contas',
    descricao: 'Confira todos os documentos antes de enviar. Não vai faltar nada!',
    tipo: 'checklist',
    categoria: 'prestar'
  },
  {
    id: 'declaracao-nao-contratacao',
    nome: 'Declaração de Não Contratação de Parentes',
    descricao: 'Documento obrigatório declarando que não houve contratação de familiares.',
    tipo: 'word',
    categoria: 'prestar'
  }
];

const TIPOS_ARQUIVO = {
  excel: { 
    icone: <FileSpreadsheet className="w-5 h-5" />, 
    nome: 'Planilha Excel',
    cor: 'bg-emerald-100 text-emerald-700',
    extensao: '.xlsx'
  },
  word: { 
    icone: <FileText className="w-5 h-5" />, 
    nome: 'Documento Word',
    cor: 'bg-blue-100 text-blue-700',
    extensao: '.docx'
  },
  checklist: { 
    icone: <CheckSquare className="w-5 h-5" />, 
    nome: 'Checklist',
    cor: 'bg-amber-100 text-amber-700',
    extensao: '.pdf'
  },
  pdf: { 
    icone: <FileText className="w-5 h-5" />, 
    nome: 'PDF',
    cor: 'bg-red-100 text-red-700',
    extensao: '.pdf'
  }
};

function FerramentaCard({ ferramenta }: { ferramenta: Ferramenta }) {
  const { toast } = useToast();
  const tipoInfo = TIPOS_ARQUIVO[ferramenta.tipo];

  const handleDownload = () => {
    toast({
      title: "Download iniciado",
      description: `Baixando ${ferramenta.nome}${tipoInfo.extensao}...`,
      duration: 3000,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
    >
      <Card className={cn(
        "h-full transition-all duration-300 hover:shadow-lg border-2",
        ferramenta.destaque ? "border-accent/30 bg-gradient-to-br from-accent/5 to-orange-50/30" : "border-slate-100 hover:border-slate-200"
      )}>
        <CardContent className="p-5 h-full flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
              tipoInfo.cor
            )}>
              {tipoInfo.icone}
            </div>
            <div className="flex items-center gap-2">
              {ferramenta.destaque && (
                <Badge className="bg-accent/10 text-accent border-0 text-xs">
                  Essencial
                </Badge>
              )}
              <Badge variant="outline" className="text-xs font-normal">
                {tipoInfo.extensao}
              </Badge>
            </div>
          </div>
          
          <h3 className="font-semibold text-foreground mb-2 leading-snug">
            {ferramenta.nome}
          </h3>
          
          <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
            {ferramenta.descricao}
          </p>
          
          <Button 
            variant="outline" 
            size="sm"
            className="w-full group"
            onClick={handleDownload}
            data-testid={`download-${ferramenta.id}`}
          >
            <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
            Baixar {tipoInfo.nome}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Ferramentas() {
  const [categoriaAtiva, setCategoriaAtiva] = useState('planejar');
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);

  const ferramentasFiltradas = FERRAMENTAS.filter(f => {
    const matchCategoria = f.categoria === categoriaAtiva;
    const matchTipo = !filtroTipo || f.tipo === filtroTipo;
    return matchCategoria && matchTipo;
  });

  const categoriaInfo = CATEGORIAS.find(c => c.id === categoriaAtiva);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-background to-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1">
        <div className="bg-gradient-to-br from-accent/5 via-orange-50/50 to-transparent py-12 border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-accent" />
                </div>
                <Badge variant="outline" className="border-accent/30 text-accent">
                  Modelos Prontos
                </Badge>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4 text-foreground">
                Caixa de Ferramentas
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Planilhas, modelos de documentos e checklists prontos pra usar. 
                É só baixar, preencher e pronto!
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="bg-slate-50 rounded-2xl p-4 mb-8 border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-600">O que você precisa fazer?</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((cat) => (
                <Button
                  key={cat.id}
                  variant={categoriaAtiva === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className={cn(
                    "gap-2 transition-all",
                    categoriaAtiva === cat.id 
                      ? cat.corAtivo 
                      : "bg-white hover:bg-slate-50"
                  )}
                  data-testid={`categoria-${cat.id}`}
                >
                  {cat.icone}
                  {cat.nome}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                {categoriaInfo?.icone}
                {categoriaInfo?.nome}
              </h2>
              <p className="text-muted-foreground text-sm">
                {ferramentasFiltradas.length} ferramenta{ferramentasFiltradas.length !== 1 ? 's' : ''} disponíve{ferramentasFiltradas.length !== 1 ? 'is' : 'l'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1">
                <Button
                  variant={filtroTipo === null ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFiltroTipo(null)}
                  className="text-xs"
                >
                  Todos
                </Button>
                <Button
                  variant={filtroTipo === 'excel' ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFiltroTipo(filtroTipo === 'excel' ? null : 'excel')}
                  className="text-xs gap-1"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  Excel
                </Button>
                <Button
                  variant={filtroTipo === 'word' ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFiltroTipo(filtroTipo === 'word' ? null : 'word')}
                  className="text-xs gap-1"
                >
                  <FileText className="w-3 h-3" />
                  Word
                </Button>
                <Button
                  variant={filtroTipo === 'checklist' ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFiltroTipo(filtroTipo === 'checklist' ? null : 'checklist')}
                  className="text-xs gap-1"
                >
                  <CheckSquare className="w-3 h-3" />
                  Checklist
                </Button>
              </div>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            <motion.div 
              key={categoriaAtiva + (filtroTipo || '')}
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {ferramentasFiltradas.map((ferramenta) => (
                <FerramentaCard key={ferramenta.id} ferramenta={ferramenta} />
              ))}
            </motion.div>
          </AnimatePresence>

          {ferramentasFiltradas.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma ferramenta encontrada com esse filtro.</p>
              <Button 
                variant="ghost" 
                onClick={() => setFiltroTipo(null)}
                className="mt-2 text-primary"
              >
                Limpar filtro
              </Button>
            </div>
          )}
        </div>

        <div className="container mx-auto px-4 pb-16">
          <div className="bg-gradient-to-br from-sky-50 to-cyan-50/50 rounded-2xl p-8 border border-sky-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                <Printer className="w-6 h-6 text-sky-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-sky-900 mb-2">Dica: Imprima e Cole na Parede!</h3>
                <p className="text-sky-700 mb-4">
                  Os checklists funcionam melhor impressos. Cole na parede da secretaria 
                  e vá marcando cada item conforme faz. Assim você não esquece de nada!
                </p>
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    <FileSpreadsheet className="w-3 h-3 mr-1" />
                    Planilhas: use no computador
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-700 border-0">
                    <FileText className="w-3 h-3 mr-1" />
                    Documentos: imprima pra assinar
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-700 border-0">
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Checklists: cole na parede
                  </Badge>
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
