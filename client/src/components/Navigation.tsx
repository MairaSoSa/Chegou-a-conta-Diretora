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
        /* sage suave: neutro quente, quase bege com toque verde */
        background: `
          linear-gradient(180deg,
            #b0bfa4 0%,
            #c2d0b5 22%,
            #cddac0 42%,
            #c8d6ba 58%,
            #b8c8aa 78%,
            #a8b89a 100%
          )`,
        /* relevo leve: highlight no topo, sombra suave embaixo */
        boxShadow: `
          inset 0 2px 0 rgba(255,255,255,0.38),
          inset 0 1px 0 rgba(255,255,255,0.22),
          inset 0 -8px 22px rgba(80,100,70,0.18),
          0 6px 20px rgba(80,100,70,0.20)
        `,
      }}
    >
      {/* textura sutil — fibras diagonais suaves */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              112deg,
              rgba(255,255,255,0.12) 0px,
              rgba(255,255,255,0.12) 1px,
              transparent 1px,
              transparent 18px
            ),
            repeating-linear-gradient(
              112deg,
              rgba(80,100,60,0.06) 0px,
              rgba(80,100,60,0.06) 2px,
              transparent 2px,
              transparent 36px
            )
          `,
        }}
        aria-hidden="true"
      />

      {/* borda superior brilhante */}
      <div
        className="absolute inset-x-0 top-0 h-[3px] pointer-events-none"
        style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.70) 40%, rgba(255,255,255,0.40) 100%)" }}
        aria-hidden="true"
      />

      {/* borda inferior — separa do conteúdo com sombra suave */}
      <div
        className="absolute inset-x-0 bottom-0 h-[3px] pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(60,80,50,0.30) 0%, rgba(60,80,50,0.08) 100%)" }}
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
                  color: "#2e4030",
                  textShadow: "0 1px 0 rgba(255,255,255,0.50)",
                }}
              >
                Chegou a Conta,{" "}
                <span style={{
                  color: "#b23a2e",
                  textShadow: "0 1px 0 rgba(255,255,255,0.40)",
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
                background: "rgba(255,255,255,0.35)",
                border: "1px solid rgba(80,110,60,0.25)",
                color: "#3d5035",
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
                            color: "#1e3020",
                            background: "rgba(255,255,255,0.38)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.60), inset 0 -3px 8px rgba(60,90,50,0.14)",
                            textShadow: "0 1px 0 rgba(255,255,255,0.50)",
                          }
                        : {
                            color: "#354830",
                            textShadow: "0 1px 0 rgba(255,255,255,0.40)",
                          }
                    }
                  >
                    <item.icon
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ opacity: active ? 1 : 0.70 }}
                    />
                    {item.label}

                    {/* sulco ativo */}
                    {active && (
                      <span
                        className="absolute inset-x-2 -bottom-[2px] h-[2px] rounded-full"
                        style={{ background: "rgba(178,58,46,0.65)", boxShadow: "0 1px 3px rgba(178,58,46,0.30)" }}
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
