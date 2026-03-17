import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3, GraduationCap, MessagesSquare, Wrench,
  BookOpen, Building2, Scale, Calendar,
  X, Menu, Accessibility,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAccessibility } from "@/App";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { href: "/dashboard",   label: "Dados Educacionais", icon: BarChart3,      desc: "Painel do Censo Escolar" },
  { href: "/legislacao",  label: "Legislação",          icon: Scale,          desc: "Normas e Diários Oficiais" },
  { href: "/calendario",  label: "Calendário",          icon: Calendar,       desc: "Prazos e compromissos" },
  { href: "/trilha",      label: "Trilha",              icon: GraduationCap,  desc: "Aprenda no seu ritmo" },
  { href: "/programas",   label: "Programas",           icon: Building2,      desc: "PDDE, PNAE, PNATE" },
  { href: "/ferramentas", label: "Ferramentas",         icon: Wrench,         desc: "Planilhas e modelos" },
  { href: "/chat",        label: "Caderno da Diretora", icon: MessagesSquare, desc: "Pesquise e edite documentos" },
];

/* ─── colours & styles ─── */
const SAGE_BG = `linear-gradient(180deg,#b0bfa4 0%,#c2d0b5 22%,#cddac0 42%,#c8d6ba 58%,#b8c8aa 78%,#a8b89a 100%)`;
const HEADER_SHADOW = `inset 0 2px 0 rgba(255,255,255,.38),inset 0 1px 0 rgba(255,255,255,.22),inset 0 -8px 22px rgba(80,100,70,.18),0 6px 20px rgba(80,100,70,.20)`;
const TEXTURE = `repeating-linear-gradient(112deg,rgba(255,255,255,.12) 0px,rgba(255,255,255,.12) 1px,transparent 1px,transparent 18px),repeating-linear-gradient(112deg,rgba(80,100,60,.06) 0px,rgba(80,100,60,.06) 2px,transparent 2px,transparent 36px)`;

export function Navigation() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { toggle: toggleAccessibility } = useAccessibility();

  /* lock body scroll when drawer is open */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* close on route change */
  useEffect(() => { setOpen(false); }, [location]);

  const isInner = location !== "/";

  return (
    <>
      {/* ── Top header bar ── */}
      <header
        className="sticky top-0 z-50 w-full"
        style={{ background: SAGE_BG, boxShadow: HEADER_SHADOW }}
      >
        {/* fibre texture */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: TEXTURE }} aria-hidden />
        {/* highlight top */}
        <div className="absolute inset-x-0 top-0 h-[3px] pointer-events-none"
          style={{ background: "linear-gradient(90deg,rgba(255,255,255,.40) 0%,rgba(255,255,255,.70) 40%,rgba(255,255,255,.40) 100%)" }}
          aria-hidden />
        {/* shadow bottom */}
        <div className="absolute inset-x-0 bottom-0 h-[3px] pointer-events-none"
          style={{ background: "linear-gradient(180deg,rgba(60,80,50,.30) 0%,rgba(60,80,50,.08) 100%)" }}
          aria-hidden />

        <div className="mx-auto max-w-7xl px-4 lg:px-10">
          <div className="flex h-[60px] items-center">

            {/* ── Left: Logo ── */}
            <div className="flex items-center shrink-0 mr-4">
              <Link href="/" className="flex items-center">
                <span className="font-bold text-base lg:text-[1.05rem] tracking-[0.025em] whitespace-nowrap"
                  style={{ color: "#2e4030", textShadow: "0 1px 0 rgba(255,255,255,.50)" }}>
                  Chegou a Conta,{" "}
                  <span style={{ color: "#b23a2e", textShadow: "0 1px 0 rgba(255,255,255,.40)" }}>
                    Diretora!
                  </span>
                </span>
              </Link>
            </div>

            {/* ── Center: Desktop nav (absolutely centered) ── */}
            {isInner && (
              <nav className="hidden lg:flex flex-1 items-center justify-center gap-0 text-xs font-medium">
                {NAV_ITEMS.map((item) => {
                  const active = location === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="relative flex items-center gap-1 rounded-lg px-2 py-1.5 whitespace-nowrap transition-all duration-200"
                      style={
                        active
                          ? {
                              color: "#1e3020",
                              background: "rgba(255,255,255,.38)",
                              boxShadow: "inset 0 1px 0 rgba(255,255,255,.60),inset 0 -3px 8px rgba(60,90,50,.14)",
                              textShadow: "0 1px 0 rgba(255,255,255,.50)",
                            }
                          : {
                              color: "#354830",
                              textShadow: "0 1px 0 rgba(255,255,255,.40)",
                            }
                      }
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" style={{ opacity: active ? 1 : 0.70 }} />
                      {item.label}
                      {active && (
                        <>
                          <span className="absolute -bottom-[3px] h-[3px] pointer-events-none"
                            style={{
                              left: "6px", right: "8px",
                              background: "linear-gradient(90deg,transparent 0%,rgba(38,30,18,.72) 8%,rgba(52,42,24,.88) 28%,rgba(44,36,20,.82) 55%,rgba(50,40,22,.78) 80%,transparent 100%)",
                              transform: "rotate(-0.6deg) skewX(-1deg)",
                              filter: "blur(.3px)",
                              borderRadius: "1px",
                            }} />
                          <span className="absolute -bottom-[2px] h-[1px] pointer-events-none"
                            style={{
                              left: "10px", right: "14px",
                              background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,.35) 30%,rgba(255,255,255,.20) 70%,transparent 100%)",
                              transform: "rotate(-0.4deg)",
                              filter: "blur(.2px)",
                            }} />
                        </>
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* ── Right: Quem Somos (desktop) + hamburger (mobile) ── */}
            <div className={`flex items-center justify-end gap-2 shrink-0 ${!isInner ? "flex-1" : "ml-2"}`}>
              {/* Mobile hamburger */}
              {isInner && (
                <button
                  className="lg:hidden relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 active:scale-95"
                  aria-label="Abrir menu de navegação"
                  onClick={() => setOpen(true)}
                  style={{
                    background: "rgba(255,255,255,.28)",
                    border: "1.5px solid rgba(255,255,255,.50)",
                    boxShadow: "0 2px 6px rgba(60,90,50,.18), inset 0 1px 0 rgba(255,255,255,.60)",
                    color: "#2e4030",
                  }}
                >
                  <Menu className="h-5 w-5" strokeWidth={2.2} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Sidebar Drawer (mobile / tablet) ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-[60]"
              style={{ background: "rgba(20,30,15,.45)", backdropFilter: "blur(3px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              onClick={() => setOpen(false)}
            />

            {/* Drawer panel */}
            <motion.aside
              key="drawer"
              className="fixed inset-y-0 left-0 z-[70] flex flex-col overflow-hidden"
              style={{
                width: "min(82vw, 320px)",
                background: SAGE_BG,
                boxShadow: "4px 0 32px rgba(40,60,30,.28), 1px 0 0 rgba(255,255,255,.18)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              {/* drawer texture */}
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: TEXTURE }} aria-hidden />

              {/* top highlight */}
              <div className="absolute inset-y-0 left-0 w-[3px] pointer-events-none"
                style={{ background: "linear-gradient(180deg,rgba(255,255,255,.55) 0%,rgba(255,255,255,.22) 50%,rgba(255,255,255,.10) 100%)" }}
                aria-hidden />

              {/* ── Drawer header ── */}
              <div className="relative flex items-start justify-between px-5 pt-10 pb-6">
                {/* site title */}
                <div>
                  <Link href="/" onClick={() => setOpen(false)}>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-1"
                      style={{ color: "rgba(46,64,48,.60)" }}>
                      Plataforma
                    </p>
                    <h2 className="font-bold text-[1.15rem] leading-tight"
                      style={{ color: "#2e4030", textShadow: "0 1px 0 rgba(255,255,255,.50)" }}>
                      Chegou a Conta,{" "}
                      <span style={{ color: "#b23a2e" }}>Diretora!</span>
                    </h2>
                  </Link>
                </div>

                {/* close button */}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Fechar menu"
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-150 active:scale-90"
                  style={{
                    background: "rgba(255,255,255,.30)",
                    border: "1.5px solid rgba(255,255,255,.50)",
                    color: "#2e4030",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,.60)",
                  }}
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>

              {/* divider */}
              <div className="mx-5 h-px mb-4" style={{ background: "rgba(255,255,255,.45)" }} />

              {/* ── Nav items ── */}
              <nav className="relative flex-1 overflow-y-auto px-3 pb-4">
                <p className="px-3 pb-2 text-[0.68rem] font-bold uppercase tracking-[0.20em]"
                  style={{ color: "rgba(46,64,48,.55)" }}>
                  Navegação
                </p>

                {NAV_ITEMS.map((item, i) => {
                  const active = location === item.href;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.06 + i * 0.045, duration: 0.32 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="group relative flex items-center gap-3.5 rounded-2xl px-4 py-3.5 mb-1 transition-all duration-200"
                        style={
                          active
                            ? {
                                background: "rgba(255,255,255,.45)",
                                boxShadow: "inset 0 1px 0 rgba(255,255,255,.70), inset 0 -2px 6px rgba(60,90,50,.12), 0 2px 8px rgba(60,90,50,.10)",
                                color: "#1e3020",
                              }
                            : {
                                color: "#2e4030",
                              }
                        }
                      >
                        {/* icon bubble */}
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200"
                          style={
                            active
                              ? {
                                  background: "rgba(178,58,46,.14)",
                                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.60)",
                                  color: "#b23a2e",
                                }
                              : {
                                  background: "rgba(255,255,255,.28)",
                                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.60)",
                                  color: "#3d5035",
                                }
                          }
                        >
                          <item.icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
                        </span>

                        {/* label + desc */}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-tight truncate"
                            style={{ color: active ? "#1e3020" : "#2e4030" }}>
                            {item.label}
                          </p>
                          <p className="text-[0.70rem] leading-tight mt-0.5 truncate"
                            style={{ color: active ? "rgba(30,48,32,.65)" : "rgba(46,64,48,.55)" }}>
                            {item.desc}
                          </p>
                        </div>

                        {/* active pencil stripe */}
                        {active && (
                          <span className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-full"
                            style={{ background: "linear-gradient(180deg,rgba(178,58,46,.80) 0%,rgba(178,58,46,.50) 100%)" }} />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}

                {/* separator */}
                <div className="my-3 mx-2 h-px" style={{ background: "rgba(255,255,255,.40)" }} />

                {/* Quem somos */}
                <motion.div
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + NAV_ITEMS.length * 0.045, duration: 0.32 }}
                >
                  <Link
                    href="/quem-somos"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-all duration-200"
                    style={{ color: "#2e4030" }}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "rgba(255,255,255,.28)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.60)", color: "#3d5035" }}>
                      <BookOpen className="h-[17px] w-[17px]" strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight" style={{ color: "#2e4030" }}>Quem Somos</p>
                      <p className="text-[0.70rem] leading-tight mt-0.5" style={{ color: "rgba(46,64,48,.55)" }}>Sobre a plataforma</p>
                    </div>
                  </Link>
                </motion.div>

                {/* Acessibilidade */}
                <motion.div
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + (NAV_ITEMS.length + 1) * 0.045, duration: 0.32 }}
                >
                  <button
                    onClick={() => { toggleAccessibility(); setOpen(false); }}
                    className="w-full flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-all duration-200 active:scale-[.98]"
                    style={{ color: "#2e4030" }}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "rgba(218,185,60,.22)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.60)", color: "#6b5208" }}>
                      <Accessibility className="h-[17px] w-[17px]" strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-semibold leading-tight" style={{ color: "#2e4030" }}>Acessibilidade</p>
                      <p className="text-[0.70rem] leading-tight mt-0.5" style={{ color: "rgba(46,64,48,.55)" }}>Ajustes de leitura e contraste</p>
                    </div>
                  </button>
                </motion.div>
              </nav>

            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
