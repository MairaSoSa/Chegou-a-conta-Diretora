import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Download, FileSpreadsheet, CheckSquare, FileText, 
  Wrench, Search, ShoppingCart, FolderCheck, Calendar,
  FileCheck, Filter, Pin, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Tool } from "@shared/schema";

const CATEGORIAS = [
  { id: 'planejar', nome: 'Planejar', icone: Calendar, corPostIt: 'bg-violet-100', corTexto: 'text-violet-800', corBorda: 'border-violet-300', corFundo: '#ede9fe' },
  { id: 'pesquisar', nome: 'Pesquisar Preços', icone: Search, corPostIt: 'bg-sky-100', corTexto: 'text-sky-800', corBorda: 'border-sky-300', corFundo: '#e0f2fe' },
  { id: 'comprar', nome: 'Comprar', icone: ShoppingCart, corPostIt: 'bg-emerald-100', corTexto: 'text-emerald-800', corBorda: 'border-emerald-300', corFundo: '#d1fae5' },
  { id: 'receber', nome: 'Receber e Conferir', icone: FolderCheck, corPostIt: 'bg-amber-100', corTexto: 'text-amber-800', corBorda: 'border-amber-300', corFundo: '#fef3c7' },
  { id: 'prestar', nome: 'Prestar Contas', icone: FileCheck, corPostIt: 'bg-rose-100', corTexto: 'text-rose-800', corBorda: 'border-rose-300', corFundo: '#ffe4e6' }
];

const TIPOS_ARQUIVO: Record<string, { icone: typeof FileSpreadsheet; nome: string; cor: string; extensao: string }> = {
  excel: { icone: FileSpreadsheet, nome: 'Excel', cor: 'text-emerald-600', extensao: '.xlsx' },
  word: { icone: FileText, nome: 'Word', cor: 'text-blue-600', extensao: '.docx' },
  checklist: { icone: CheckSquare, nome: 'Checklist', cor: 'text-amber-600', extensao: '.pdf' },
  pdf: { icone: FileText, nome: 'PDF', cor: 'text-red-600', extensao: '.pdf' }
};

const ROTACOES = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0'];

function PostIt({ 
  tool, 
  index, 
  categoria 
}: { 
  tool: Tool; 
  index: number;
  categoria: typeof CATEGORIAS[0];
}) {
  const { toast } = useToast();
  const tipoInfo = TIPOS_ARQUIVO[tool.type] || TIPOS_ARQUIVO.pdf;
  const TipoIcone = tipoInfo.icone;
  const rotacao = ROTACOES[index % ROTACOES.length];

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tool.downloadUrl) {
      window.open(tool.downloadUrl, '_blank');
    } else {
      toast({
        title: "Download iniciado",
        description: `Baixando ${tool.title}${tipoInfo.extensao}...`,
        duration: 3000,
      });
    }
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
        {tool.featured && (
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
          {tool.title}
        </h3>
        
        <p className="text-xs text-slate-600 leading-relaxed flex-1 mb-3">
          {tool.description}
        </p>
        
        <Button 
          size="sm"
          variant="ghost"
          className={cn(
            "w-full justify-center gap-1.5 text-xs h-8 bg-white/60",
            categoria.corTexto
          )}
          onClick={handleDownload}
          data-testid={`download-tool-${tool.id}`}
        >
          <Download className="w-3.5 h-3.5" />
          Baixar
        </Button>
      </div>
    </motion.div>
  );
}

function CategoriaSection({ categoria, ferramentas }: { categoria: typeof CATEGORIAS[0]; ferramentas: Tool[] }) {
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
        {ferramentas.map((tool, index) => (
          <PostIt 
            key={tool.id} 
            tool={tool} 
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

  const { data: tools = [], isLoading } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
  });

  const ferramentasFiltradas = filtroTipo 
    ? tools.filter(f => f.type === filtroTipo)
    : tools;

  const categoriasComFerramentas = CATEGORIAS.map(cat => ({
    ...cat,
    ferramentas: ferramentasFiltradas.filter(f => f.category === cat.id)
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
                    {isLoading ? "Carregando..." : `${tools.length} modelos prontos pra baixar e usar`}
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

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
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
        )}

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
