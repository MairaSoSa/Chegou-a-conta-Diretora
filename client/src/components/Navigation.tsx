import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3, GraduationCap, MessagesSquare, Wrench,
  Menu, BookOpen, Building2, SlidersHorizontal, Scale, Calendar
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAccessibility } from "@/App";

const NAV_ITEMS = [
  { href: "/dashboard",   label: "Dados Educacionais", icon: BarChart3 },
  { href: "/legislacao",  label: "Legislação",          icon: Scale },
  { href: "/calendario",  label: "Calendário",          icon: Calendar },
  { href: "/trilha",      label: "Trilha",              icon: GraduationCap },
  { href: "/programas",   label: "Programas",           icon: Building2 },
  { href: "/ferramentas", label: "Ferramentas",         icon: Wrench },
  { href: "/chat",        label: "Caderno da Diretora", icon: MessagesSquare },
];

export function Navigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { toggle: toggleAccessibility } = useAccessibility();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#ece1d5] shadow-[0_8px_18px_rgba(146,126,108,0.10)]"
      style={{ background: "linear-gradient(180deg,#fbf6ef 0%,#f7efe4 55%,#f2e7d9 100%)" }}
    >
      {/* bevel superior */}
      <div className="absolute inset-x-0 top-0 h-[5px] pointer-events-none"
        style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0))" }} />
      {/* bevel inferior */}
      <div className="absolute inset-x-0 bottom-0 h-[7px] pointer-events-none"
        style={{ background: "linear-gradient(0deg,rgba(120,82,54,0.18),rgba(120,82,54,0))" }} />

      <div className="mx-auto max-w-7xl px-4 lg:px-10">
        <div className="flex h-14 items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-1">
            <Link href="/" className="flex items-center">
              <span
                className="font-bold text-lg md:text-xl tracking-[0.02em]"
                style={{
                  color: "#8a6e5b",
                  textShadow: "0 1px 0 rgba(255,255,255,0.35), 0 -1px 0 rgba(121,84,58,0.25)",
                }}
              >
                Chegou a Conta,{" "}
                <span style={{ color: "#b23a2e", textShadow: "0 1px 0 rgba(255,255,255,0.35), 0 -1px 0 rgba(90,40,30,0.25)" }}>
                  Diretora!
                </span>
              </span>
            </Link>
            <button
              onClick={toggleAccessibility}
              aria-label="Ajustes de visualização e leitura"
              data-testid="button-accessibility-menu"
              className="ml-1 flex h-7 w-7 items-center justify-center rounded-full border border-[#e4d8cc] bg-white/70 text-[#a0907e] transition hover:bg-white hover:text-[#5a4438]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Desktop nav */}
          {location !== "/" && (
            <nav className="hidden md:flex items-end gap-0.5 text-sm font-medium">
              {NAV_ITEMS.map((item) => {
                const active = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-1.5 rounded-full px-3 py-2 transition-all duration-200 tracking-[0.01em]",
                      active
                        ? "text-[#b86e3f] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(110,72,45,0.08)]"
                        : "text-[#8a6e5b] hover:text-[#24344a] hover:bg-[rgba(255,248,240,0.35)]"
                    )}
                    style={active ? { background: "rgba(255,248,240,0.32)" } : undefined}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    {item.label}
                    {active && (
                      <span className="absolute inset-x-3 -bottom-[3px] h-[2px] rounded-full bg-[#b86e3f]/60" />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Mobile menu */}
          {location !== "/" && (
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4c7b3] bg-white/90 text-[#8a6e5b]"
                    aria-label="Menu"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[80%] sm:w-[320px] border-l border-[#e8ddd2] px-0"
                  style={{ background: "linear-gradient(180deg,#fbf6ef 0%,#f4ede4 100%)" }}
                >
                  <div className="flex flex-col gap-1 mt-10 px-4">
                    <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9f968d]">Menu</p>
                    {NAV_ITEMS.map((item) => {
                      const active = location === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                            active
                              ? "bg-[rgba(255,248,240,0.6)] text-[#b86e3f]"
                              : "text-[#8a6e5b] hover:bg-[rgba(255,248,240,0.4)] hover:text-[#24344a]"
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                    <div className="my-3 h-px bg-[#ece1d5]" />
                    <Link
                      href="/quem-somos"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#8a6e5b] hover:bg-[rgba(255,248,240,0.4)] hover:text-[#24344a]"
                    >
                      <BookOpen className="h-4 w-4 shrink-0" />
                      Quem Somos
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
