import { Link } from "wouter";
import { Settings } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-foreground">Chegou a Conta, Diretora!</span>
            <span className="hidden md:inline">|</span>
            <span>Gratuito para escolas públicas</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/trilha" className="hover:text-primary transition-colors">Trilha</Link>
            <Link href="/programas" className="hover:text-primary transition-colors">Programas</Link>
            <Link href="/ferramentas" className="hover:text-primary transition-colors">Ferramentas</Link>
            <Link href="/chat" className="hover:text-primary transition-colors">Chat IA</Link>
            <Link href="/admin" className="inline-flex items-center gap-1 hover:text-primary transition-colors" data-testid="link-admin">
              <Settings className="w-3.5 h-3.5" />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
