import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Download, FileSpreadsheet, CheckSquare, FileText, 
  Wrench, Search, ShoppingCart, FolderCheck, Calendar,
  FileCheck, Filter, Pin, Paperclip
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
  { id: 'planejar', nome: 'Planejar', icone: Calendar, corPostIt: 'bg-violet-100', corTexto: 'text-violet-800', corBorda: 'border-violet-300' },
  { id: 'pesquisar', nome: 'Pesquisar Preços', icone: Search, corPostIt: 'bg-sky-100', corTexto: 'text-sky-800', corBorda: 'border-sky-300' },
  { id: 'comprar', nome: 'Comprar', icone: ShoppingCart, corPostIt: 'bg-emerald-100', corTexto: 'text-emerald-800', corBorda: 'border-emerald-300' },
  { id: 'receber', nome: 'Receber e Conferir', icone: FolderCheck, corPostIt: 'bg-amber-100', corTexto: 'text-amber-800', corBorda: 'border-amber-300' },
  { id: 'prestar', nome: 'Prestar Contas', icone: FileCheck, corPostIt: 'bg-rose-100', corTexto: 'text-rose-800', corBorda: 'border-rose-300' }
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

const ROTACOES = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0', '-rotate-1', 'rotate-1'];

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
      initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, rotate: 0, zIndex: 10 }}
      className={cn(
        "relative group cursor-pointer",
        rotacao
      )}
    >
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
        <Pin className="w-5 h-5 text-slate-400 drop-shadow-sm" />
      </div>
      
      <div 
        className={cn(
          "p-5 pt-6 rounded-sm shadow-md transition-shadow group-hover:shadow-xl min-h-[180px] flex flex-col",
          categoria.corPostIt,
          "border-b-4",
          categoria.corBorda
        )}
        style={{
          background: `linear-gradient(135deg, ${categoria.corPostIt === 'bg-violet-100' ? '#ede9fe' : 
            categoria.corPostIt === 'bg-sky-100' ? '#e0f2fe' :
            categoria.corPostIt === 'bg-emerald-100' ? '#d1fae5' :
            categoria.corPostIt === 'bg-amber-100' ? '#fef3c7' : '#ffe4e6'} 0%, 
            ${categoria.corPostIt === 'bg-violet-100' ? '#f5f3ff' : 
            categoria.corPostIt === 'bg-sky-100' ? '#f0f9ff' :
            categoria.corPostIt === 'bg-emerald-100' ? '#ecfdf5' :
            categoria.corPostIt === 'bg-amber-100' ? '#fffbeb' : '#fff1f2'} 100%)`
        }}
      >
        {ferramenta.destaque && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/80 text-amber-700 border-0 text-[10px] shadow-sm">
              Essencial
            </Badge>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <TipoIcone className={cn("w-5 h-5", tipoInfo.cor)} />
          <span className={cn("text-xs font-medium", tipoInfo.cor)}>
            {tipoInfo.nome}
          </span>
        </div>
        
        <h3 className={cn(
          "font-bold text-base mb-2 leading-tight",
          categoria.corTexto
        )}>
          {ferramenta.nome}
        </h3>
        
        <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-4">
          {ferramenta.descricao}
        </p>
        
        <Button 
          size="sm"
          variant="ghost"
          className={cn(
            "w-full justify-center gap-2 bg-white/60 hover:bg-white/90 border border-white/50",
            categoria.corTexto
          )}
          onClick={handleDownload}
          data-testid={`download-${ferramenta.id}`}
        >
          <Download className="w-4 h-4" />
          Baixar
        </Button>
      </div>
      
      <div 
        className="absolute inset-0 rounded-sm -z-10 translate-y-1 translate-x-0.5"
        style={{ 
          background: 'rgba(0,0,0,0.08)',
          filter: 'blur(2px)'
        }}
      />
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

  const categoriaInfo = CATEGORIAS.find(c => c.id === categoriaAtiva)!;
  const CategoriaIcone = categoriaInfo.icone;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-background to-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1">
        <div className="bg-gradient-to-br from-amber-100/30 via-orange-50/20 to-transparent py-10 border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Wrench className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground">
                    Mural de Ferramentas
                  </h1>
                  <p className="text-muted-foreground">
                    Modelos prontos pra baixar, preencher e usar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-xl p-4 mb-8 border shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Filtrar por:
              </span>
              
              <div className="flex flex-wrap gap-2">
                {CATEGORIAS.map((cat) => {
                  const Icon = cat.icone;
                  return (
                    <Button
                      key={cat.id}
                      variant={categoriaAtiva === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategoriaAtiva(cat.id)}
                      className={cn(
                        "gap-2",
                        categoriaAtiva === cat.id && cn(cat.corPostIt, cat.corTexto, "border-2", cat.corBorda, "hover:opacity-90")
                      )}
                      data-testid={`categoria-${cat.id}`}
                    >
                      <Icon className="w-4 h-4" />
                      {cat.nome}
                    </Button>
                  );
                })}
              </div>
              
              <div className="h-6 w-px bg-slate-200 hidden sm:block" />
              
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
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  Excel
                </Button>
                <Button
                  variant={filtroTipo === 'word' ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFiltroTipo(filtroTipo === 'word' ? null : 'word')}
                  className="text-xs gap-1"
                >
                  <FileText className="w-3 h-3 text-blue-600" />
                  Word
                </Button>
                <Button
                  variant={filtroTipo === 'checklist' ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFiltroTipo(filtroTipo === 'checklist' ? null : 'checklist')}
                  className="text-xs gap-1"
                >
                  <CheckSquare className="w-3 h-3 text-amber-600" />
                  Checklist
                </Button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className={cn(
              "inline-flex items-center gap-3 px-4 py-2 rounded-lg",
              categoriaInfo.corPostIt
            )}>
              <CategoriaIcone className={cn("w-5 h-5", categoriaInfo.corTexto)} />
              <h2 className={cn("text-xl font-bold", categoriaInfo.corTexto)}>
                {categoriaInfo.nome}
              </h2>
              <Badge variant="outline" className={cn("ml-2", categoriaInfo.corTexto, categoriaInfo.corBorda)}>
                {ferramentasFiltradas.length} {ferramentasFiltradas.length === 1 ? 'modelo' : 'modelos'}
              </Badge>
            </div>
          </div>

          <div 
            className="p-6 rounded-2xl mb-8"
            style={{
              background: 'linear-gradient(to bottom, #f5f0e8 0%, #ebe6de 100%)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
            }}
          >
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {ferramentasFiltradas.map((ferramenta, index) => (
                  <PostIt 
                    key={ferramenta.id} 
                    ferramenta={ferramenta} 
                    index={index}
                    categoria={categoriaInfo}
                  />
                ))}
              </div>
            </AnimatePresence>

            {ferramentasFiltradas.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Nenhum modelo encontrado com esse filtro.</p>
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

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Pin className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-amber-800 mb-2">Dica: Cole na parede!</h3>
                <p className="text-amber-700 text-sm leading-relaxed">
                  Os checklists funcionam melhor impressos. Cole no mural da secretaria 
                  e vá marcando cada item. Assim você não esquece de nada!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
