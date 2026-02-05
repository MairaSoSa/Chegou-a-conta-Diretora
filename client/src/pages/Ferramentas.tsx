import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Download, FileSpreadsheet, CheckSquare, FileText, 
  Wrench, Search, ShoppingCart, FolderCheck, Calendar,
  FileCheck, Filter, Pin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
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
  { id: 'planejar', nome: 'Planejar', icone: Calendar, corPostIt: 'bg-violet-100', corTexto: 'text-violet-800', corBorda: 'border-violet-300', corFundo: '#ede9fe' },
  { id: 'pesquisar', nome: 'Pesquisar Preços', icone: Search, corPostIt: 'bg-sky-100', corTexto: 'text-sky-800', corBorda: 'border-sky-300', corFundo: '#e0f2fe' },
  { id: 'comprar', nome: 'Comprar', icone: ShoppingCart, corPostIt: 'bg-emerald-100', corTexto: 'text-emerald-800', corBorda: 'border-emerald-300', corFundo: '#d1fae5' },
  { id: 'receber', nome: 'Receber e Conferir', icone: FolderCheck, corPostIt: 'bg-amber-100', corTexto: 'text-amber-800', corBorda: 'border-amber-300', corFundo: '#fef3c7' },
  { id: 'prestar', nome: 'Prestar Contas', icone: FileCheck, corPostIt: 'bg-rose-100', corTexto: 'text-rose-800', corBorda: 'border-rose-300', corFundo: '#ffe4e6' }
];

const FERRAMENTAS: Ferramenta[] = [
  { id: 'plano-aplicacao', nome: 'Plano de Aplicação', descricao: 'Planilha pra planejar como usar o dinheiro do PDDE', tipo: 'excel', categoria: 'planejar', destaque: true },
  { id: 'ata-reuniao', nome: 'Ata de Reunião', descricao: 'Documento pra registrar decisões do Conselho', tipo: 'word', categoria: 'planejar' },
  { id: 'calendario-anual', nome: 'Calendário de Prazos', descricao: 'Todos os prazos importantes do ano', tipo: 'excel', categoria: 'planejar' },
  { id: 'lista-prioridades', nome: 'Lista de Prioridades', descricao: 'O que a escola mais precisa antes de gastar', tipo: 'checklist', categoria: 'planejar' },
  { id: 'convocacao-conselho', nome: 'Convocação de Reunião', descricao: 'Modelo pra convocar o Conselho Escolar', tipo: 'word', categoria: 'planejar' },
  { id: 'pesquisa-precos', nome: 'Pesquisa de Preços', descricao: 'Compare até 5 fornecedores lado a lado', tipo: 'excel', categoria: 'pesquisar', destaque: true },
  { id: 'mapa-fornecedores', nome: 'Cadastro de Fornecedores', descricao: 'Contatos organizados com CNPJ e telefone', tipo: 'excel', categoria: 'pesquisar' },
  { id: 'checklist-fornecedor', nome: 'Análise de Fornecedor', descricao: 'Verificação antes de escolher fornecedor', tipo: 'checklist', categoria: 'pesquisar' },
  { id: 'solicitacao-orcamento', nome: 'Pedido de Orçamento', descricao: 'Carta formal pra pedir orçamento', tipo: 'word', categoria: 'pesquisar' },
  { id: 'autorizacao-compra', nome: 'Autorização de Compra', descricao: 'Autoriza a compra após aprovação do Conselho', tipo: 'word', categoria: 'comprar', destaque: true },
  { id: 'controle-pagamentos', nome: 'Controle de Pagamentos', descricao: 'Registra cada pagamento: data, valor, NF', tipo: 'excel', categoria: 'comprar' },
  { id: 'checklist-nota-fiscal', nome: 'Checklist de NF', descricao: 'Confira a nota fiscal antes de pagar', tipo: 'checklist', categoria: 'comprar' },
  { id: 'termo-contratacao', nome: 'Contratação de Serviço', descricao: 'Modelo pra contratar manutenção, pintura', tipo: 'word', categoria: 'comprar' },
  { id: 'termo-recebimento', nome: 'Recebimento de Material', descricao: 'Documento pra assinar quando material chegar', tipo: 'word', categoria: 'receber', destaque: true },
  { id: 'checklist-conferencia', nome: 'Checklist de Conferência', descricao: 'Conferir se chegou igual ao pedido', tipo: 'checklist', categoria: 'receber' },
  { id: 'ateste-servico', nome: 'Atestado de Serviço', descricao: 'Atestar que serviço foi executado', tipo: 'word', categoria: 'receber' },
  { id: 'controle-patrimonio', nome: 'Controle de Patrimônio', descricao: 'Registrar bens: móveis, equipamentos', tipo: 'excel', categoria: 'receber' },
  { id: 'demonstrativo-execucao', nome: 'Demonstrativo', descricao: 'Resumo de tudo que foi gasto no período', tipo: 'excel', categoria: 'prestar', destaque: true },
  { id: 'relacao-pagamentos', nome: 'Relação de Pagamentos', descricao: 'Lista todos os pagamentos por data', tipo: 'excel', categoria: 'prestar' },
  { id: 'conciliacao-bancaria', nome: 'Conciliação Bancária', descricao: 'Conferir se extrato bate com registros', tipo: 'excel', categoria: 'prestar' },
  { id: 'checklist-prestacao', nome: 'Checklist Final', descricao: 'Todos os documentos antes de enviar', tipo: 'checklist', categoria: 'prestar' },
  { id: 'declaracao-parentes', nome: 'Declaração de Parentes', descricao: 'Não houve contratação de familiares', tipo: 'word', categoria: 'prestar' }
];

const TIPOS_ARQUIVO = {
  excel: { icone: FileSpreadsheet, nome: 'Excel', cor: 'text-emerald-600', extensao: '.xlsx' },
  word: { icone: FileText, nome: 'Word', cor: 'text-blue-600', extensao: '.docx' },
  checklist: { icone: CheckSquare, nome: 'Checklist', cor: 'text-amber-600', extensao: '.pdf' },
  pdf: { icone: FileText, nome: 'PDF', cor: 'text-red-600', extensao: '.pdf' }
};

const ROTACOES = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0'];

function PostIt({ 
  ferramenta, 
  index, 
  categoria 
}: { 
  ferramenta: Ferramenta; 
  index: number;
  categoria: typeof CATEGORIAS[0];
}) {
  const { toast } = useToast();
  const tipoInfo = TIPOS_ARQUIVO[ferramenta.tipo];
  const TipoIcone = tipoInfo.icone;
  const rotacao = ROTACOES[index % ROTACOES.length];

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Download iniciado",
      description: `Baixando ${ferramenta.nome}${tipoInfo.extensao}...`,
      duration: 3000,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, rotate: 0, zIndex: 10 }}
      className={cn("relative group cursor-pointer", rotacao)}
    >
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
        <Pin className="w-4 h-4 text-slate-400 drop-shadow-sm" />
      </div>
      
      <div 
        className={cn(
          "p-4 pt-5 rounded-sm shadow-md transition-shadow group-hover:shadow-xl min-h-[160px] flex flex-col",
          "border-b-4",
          categoria.corBorda
        )}
        style={{
          background: `linear-gradient(145deg, ${categoria.corFundo} 0%, white 100%)`
        }}
      >
        {ferramenta.destaque && (
          <Badge className="absolute top-2 right-2 bg-white/80 text-amber-700 border-0 text-[10px] shadow-sm">
            Essencial
          </Badge>
        )}

        <div className="flex items-center gap-1.5 mb-2">
          <TipoIcone className={cn("w-4 h-4", tipoInfo.cor)} />
          <span className={cn("text-[10px] font-medium uppercase", tipoInfo.cor)}>
            {tipoInfo.nome}
          </span>
        </div>
        
        <h3 className={cn("font-bold text-sm mb-1.5 leading-tight", categoria.corTexto)}>
          {ferramenta.nome}
        </h3>
        
        <p className="text-xs text-slate-600 leading-relaxed flex-1 mb-3">
          {ferramenta.descricao}
        </p>
        
        <Button 
          size="sm"
          variant="ghost"
          className={cn(
            "w-full justify-center gap-1.5 text-xs h-8 bg-white/60 hover:bg-white/90",
            categoria.corTexto
          )}
          onClick={handleDownload}
          data-testid={`download-${ferramenta.id}`}
        >
          <Download className="w-3.5 h-3.5" />
          Baixar
        </Button>
      </div>
    </motion.div>
  );
}

function CategoriaSection({ categoria, ferramentas }: { categoria: typeof CATEGORIAS[0]; ferramentas: Ferramenta[] }) {
  const Icon = categoria.icone;
  
  if (ferramentas.length === 0) return null;
  
  return (
    <section className="mb-10">
      <div className={cn(
        "flex items-center gap-3 mb-4 px-4 py-3 rounded-lg border-2",
        categoria.corPostIt,
        categoria.corBorda
      )}>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", categoria.corPostIt)}>
          <Icon className={cn("w-5 h-5", categoria.corTexto)} />
        </div>
        <div>
          <h2 className={cn("font-bold text-lg", categoria.corTexto)}>{categoria.nome}</h2>
          <p className="text-xs text-muted-foreground">{ferramentas.length} {ferramentas.length === 1 ? 'modelo' : 'modelos'}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {ferramentas.map((ferramenta, index) => (
          <PostIt 
            key={ferramenta.id} 
            ferramenta={ferramenta} 
            index={index}
            categoria={categoria}
          />
        ))}
      </div>
    </section>
  );
}

export default function Ferramentas() {
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);

  const ferramentasFiltradas = filtroTipo 
    ? FERRAMENTAS.filter(f => f.tipo === filtroTipo)
    : FERRAMENTAS;

  const categoriasComFerramentas = CATEGORIAS.map(cat => ({
    ...cat,
    ferramentas: ferramentasFiltradas.filter(f => f.categoria === cat.id)
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1">
        <div className="bg-gradient-to-br from-emerald-100/30 via-green-50/20 to-transparent py-10 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
                  <Wrench className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Mural de Ferramentas
                  </h1>
                  <p className="text-muted-foreground">
                    {FERRAMENTAS.length} modelos prontos pra baixar e usar
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-white rounded-lg p-2 border shadow-sm">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tipo:</span>
                <div className="flex gap-1">
                  <Button
                    variant={filtroTipo === null ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setFiltroTipo(null)}
                    className="text-xs h-7"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filtroTipo === 'excel' ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setFiltroTipo(filtroTipo === 'excel' ? null : 'excel')}
                    className="text-xs h-7 gap-1"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                    Excel
                  </Button>
                  <Button
                    variant={filtroTipo === 'word' ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setFiltroTipo(filtroTipo === 'word' ? null : 'word')}
                    className="text-xs h-7 gap-1"
                  >
                    <FileText className="w-3 h-3 text-blue-600" />
                    Word
                  </Button>
                  <Button
                    variant={filtroTipo === 'checklist' ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setFiltroTipo(filtroTipo === 'checklist' ? null : 'checklist')}
                    className="text-xs h-7 gap-1"
                  >
                    <CheckSquare className="w-3 h-3 text-amber-600" />
                    Checklist
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="py-8"
          style={{
            background: 'linear-gradient(to bottom, #f5f0e8 0%, #ebe6de 50%, #f5f0e8 100%)'
          }}
        >
          <div className="container mx-auto px-4">
            {categoriasComFerramentas.map((categoria) => (
              <CategoriaSection key={categoria.id} categoria={categoria} ferramentas={categoria.ferramentas} />
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Pin className="w-4 h-4" />
            Dica: os checklists funcionam melhor impressos e colados no mural da secretaria!
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
