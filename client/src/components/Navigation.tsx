import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, GraduationCap, MessagesSquare, Wrench, Menu, X, BookOpen, Building2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/trilha", label: "Trilha", icon: GraduationCap },
    { href: "/programas", label: "Programas", icon: Building2 },
    { href: "/ferramentas", label: "Ferramentas", icon: Wrench },
    { href: "/chat", label: "Chat IA", icon: MessagesSquare },
  ];

  const NavLink = ({ item, mobile = false }: { item: typeof navItems[0], mobile?: boolean }) => {
    const isActive = location === item.href;
    return (
      <Link href={item.href} className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium",
        isActive 
          ? "bg-primary/10 text-primary hover:bg-primary/20" 
          : "text-muted-foreground hover:text-foreground hover:bg-white/5",
        mobile ? "w-full text-base py-3" : ""
      )} onClick={() => mobile && setIsOpen(false)}>
        <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
        {item.label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-background font-bold text-lg group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all">
            A
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block">
            A Conta Chegou<span className="text-primary">, Diretora!</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-l border-white/10 w-[80%] sm:w-[350px]">
              <div className="flex flex-col gap-6 mt-10">
                <Link href="/" onClick={() => setIsOpen(false)} className="text-xl font-bold px-4">
                  Menu
                </Link>
                <div className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <NavLink key={item.href} item={item} mobile />
                  ))}
                  <div className="h-px bg-white/5 my-2 mx-4" />
                  <Link href="/quem-somos" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-3 text-muted-foreground hover:text-foreground text-base font-medium">
                    <BookOpen className="w-4 h-4" />
                    Quem Somos
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
