import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "@/components/Icons";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto glass-card border-white/10">
        <CardContent className="pt-6 text-center">
          <div className="flex mb-4 justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Página não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            O recurso que você tentou acessar não existe ou foi movido.
          </p>
          <Link href="/">
            <Button className="w-full bg-primary hover:bg-primary/90">
              Voltar para o Início
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
