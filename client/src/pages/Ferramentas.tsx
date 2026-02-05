import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useTools } from "@/hooks/use-tools";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, FileSpreadsheet, CheckSquare, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Ferramentas() {
  const [category, setCategory] = useState<string>("Planejar");
  const { data: tools, isLoading } = useTools(category);
  const { toast } = useToast();

  const handleDownload = (toolName: string) => {
    toast({
      title: "Download Iniciado",
      description: `Baixando modelo de ${toolName}...`,
      duration: 3000,
    });
  };

  const CATEGORIES = ["Planejar", "Pesquisar", "Contratar", "Executar", "Receber"];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Caixa de Ferramentas</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Modelos editáveis, planilhas automáticas e checklists para agilizar seu trabalho.
          </p>
        </div>

        <Tabs defaultValue="Planejar" className="w-full max-w-5xl mx-auto" onValueChange={setCategory}>
          <div className="overflow-x-auto pb-4 mb-4">
            <TabsList className="bg-white/5 border border-white/10 p-1 w-full md:w-auto inline-flex">
              {CATEGORIES.map(cat => (
                <TabsTrigger 
                  key={cat} 
                  value={cat}
                  className="px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {CATEGORIES.map(cat => (
            <TabsContent key={cat} value={cat} className="mt-0">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {[1, 2].map(i => <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {tools?.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} onDownload={handleDownload} />
                  ))}
                  {tools?.length === 0 && (
                    <div className="col-span-full text-center py-20 text-muted-foreground">
                      Nenhuma ferramenta encontrada para esta categoria.
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}

function ToolCard({ tool, onDownload }: any) {
  const Icon = tool.type === 'spreadsheet' ? FileSpreadsheet : 
               tool.type === 'checklist' ? CheckSquare : FileText;
               
  return (
    <Card className="glass-card border-white/5 hover:border-primary/30 transition-all duration-300 group">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 bg-white/5 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground border border-white/10 px-2 py-1 rounded">
            {tool.type}
          </span>
        </div>
        <CardTitle className="text-lg group-hover:text-primary transition-colors">{tool.title}</CardTitle>
        <CardDescription className="line-clamp-2">{tool.description}</CardDescription>
      </CardHeader>
      <CardFooter className="pt-0">
        <Button 
          variant="outline" 
          className="w-full border-white/10 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all gap-2"
          onClick={() => onDownload(tool.title)}
        >
          <Download className="w-4 h-4" /> Baixar Modelo
        </Button>
      </CardFooter>
    </Card>
  );
}
