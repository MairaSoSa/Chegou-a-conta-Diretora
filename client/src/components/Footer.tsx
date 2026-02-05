import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-gradient-to-b from-amber-50/30 to-green-50/20 py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-foreground" style={{ fontFamily: 'Quicksand' }}>Chegou a Conta, Diretora!</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Descomplicando a gestão financeira escolar para diretores e gestores de todo o Brasil.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Plataforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/trilha" className="hover:text-primary transition-colors">Trilha de Gestão</Link></li>
              <li><Link href="/programas" className="hover:text-primary transition-colors">Programas</Link></li>
              <li><Link href="/ferramentas" className="hover:text-primary transition-colors">Ferramentas</Link></li>
              <li><Link href="/chat" className="hover:text-primary transition-colors">Assistente IA</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Sobre</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/quem-somos" className="hover:text-primary transition-colors">Quem Somos</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Política de Privacidade</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Contato</h4>
            <p className="text-sm text-muted-foreground mb-2">contato@acontachegou.com.br</p>
            <p className="text-sm text-muted-foreground">Brasília, DF</p>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Chegou a Conta, Diretora! Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <span>Feito com carinho pela educação brasileira</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
