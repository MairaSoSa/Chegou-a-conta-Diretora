import { Link } from "wouter";

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
          
          <div className="flex gap-6">
            <Link href="/trilha" className="hover:text-primary transition-colors">Trilha</Link>
            <Link href="/programas" className="hover:text-primary transition-colors">Programas</Link>
            <Link href="/ferramentas" className="hover:text-primary transition-colors">Ferramentas</Link>
            <Link href="/chat" className="hover:text-primary transition-colors">Chat IA</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
