import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3, GraduationCap, MessagesSquare, Wrench,
  Menu, BookOpen, Building2, SlidersHorizontal, Scale, Calendar
} from "lucide-react";
import { useState } from "react";
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
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        /* verde floresta profundo: escuro no topo/baixo, leve claridade no centro */
        background: `
          linear-gradient(180deg,
            #142318 0%,
            #1e3826 18%,
            #2a5038 38%,
            #305840 52%,
            #1e3828 72%,
            #121e16 100%
          )`,
        /* relevo pra baixo: highlight fino no topo + sombra funda embaixo */
        boxShadow: `
          inset 0 2px 0 rgba(180,240,180,0.12),
          inset 0 1px 0 rgba(255,255,255,0.07),
          inset 0 -10px 28px rgba(0,0,0,0.40),
          0 10px 32px rgba(5,18,8,0.45)
        `,
      }}
    >
      {/* veio de floresta — textura diagonal sutil em verde */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              108deg,
              rgba(100,200,120,0.025) 0px,
              rgba(100,200,120,0.025) 1px,
              transparent 1px,
              transparent 14px
            ),
            repeating-linear-gradient(
              108deg,
              rgba(0,0,0,0.06) 0px,
              rgba(0,0,0,0.06) 2px,
              transparent 2px,
              transparent 28px
            )
          `,
        }}
        aria-hidden="true"
      />

      {/* borda superior brilhante — luz rasando a superfície */}
      <div
        className="absolute inset-x-0 top-0 h-[3px] pointer-events-none"
        style={{ background: "linear-gradient(90deg, rgba(150,240,160,0.18) 0%, rgba(200,255,210,0.38) 40%, rgba(150,240,160,0.18) 100%)" }}
        aria-hidden="true"
      />

      {/* borda inferior gravada — linha escura que separa do conteúdo */}
      <div
        className="absolute inset-x-0 bottom-0 h-[3px] pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.20) 100%)" }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 lg:px-10">
        <div className="flex h-[60px] items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <span
                className="font-bold text-lg md:text-xl tracking-[0.03em]"
                style={{
                  color: "#f0dfc0",
                  textShadow: "0 1px 3px rgba(0,0,0,0.60), 0 -1px 0 rgba(255,220,140,0.20)",
                }}
              >
                Chegou a Conta,{" "}
                <span style={{
                  color: "#f5a96e",
                  textShadow: "0 1px 3px rgba(0,0,0,0.55), 0 0 12px rgba(245,150,80,0.25)",
                }}>
                  Diretora!
                </span>
              </span>
            </Link>

            <button
              onClick={toggleAccessibility}
              aria-label="Ajustes de visualização e leitura"
              data-testid="button-accessibility-menu"
              className="flex h-6 w-6 items-center justify-center rounded-full transition"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,220,150,0.22)",
                color: "rgba(240,210,160,0.70)",
              }}
            >
              <SlidersHorizontal className="h-3 w-3" />
            </button>
          </div>

          {/* Desktop nav */}
          {location !== "/" && (
            <nav className="hidden md:flex items-center gap-0.5 text-sm font-medium">
              {NAV_ITEMS.map((item) => {
                const active = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all duration-200"
                    style={
                      active
                        ? {
                            color: "#fde8c0",
                            background: "rgba(255,200,100,0.14)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -2px 6px rgba(0,0,0,0.28)",
                            textShadow: "0 1px 2px rgba(0,0,0,0.50)",
                          }
                        : {
                            color: "rgba(230,200,155,0.80)",
                            textShadow: "0 1px 2px rgba(0,0,0,0.45)",
                          }
                    }
                  >
                    <item.icon
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ opacity: active ? 0.95 : 0.65 }}
                    />
                    {item.label}

                    {/* ranhura activa: sulco entalhado embaixo do item */}
                    {active && (
                      <span
                        className="absolute inset-x-2 -bottom-[2px] h-[2px] rounded-full"
                        style={{ background: "rgba(245,169,110,0.75)", boxShadow: "0 1px 4px rgba(245,150,80,0.50)" }}
                      />
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
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition"
                    aria-label="Menu"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,200,120,0.22)",
                      color: "rgba(240,210,160,0.85)",
                    }}
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
