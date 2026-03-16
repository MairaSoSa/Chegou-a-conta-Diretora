import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  ChevronDown, ChevronUp, BookText, Search, Loader2,
  type LucideIcon,
  Handshake, Users, FileText, Laptop, ClipboardList, Hash,
  Banknote, PiggyBank, Building2, GraduationCap, School,
  Gavel, Receipt, FileSignature, FileCheck,
  Coins, CircleDollarSign, ShieldCheck, Package, Scale,
  BookOpen, BookMarked, Calculator, Sparkles,
  Utensils, Bus, Accessibility, Palette, TreePine,
  Percent, Truck, CalendarDays, Folder, Clock,
  AlertCircle, CheckCircle2, HelpCircle, Landmark,
} from "lucide-react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import type { GlossaryItem } from "@shared/schema";

const ICON_MAP: Record<string, LucideIcon> = {
  Handshake, Users, FileText, Laptop, ClipboardList, Hash,
  Banknote, PiggyBank, Building2, GraduationCap, School,
  Gavel, Receipt, Search, FileSignature, FileCheck,
  Coins, CircleDollarSign, ShieldCheck, Package, Scale,
  BookOpen, BookText, BookMarked, Calculator, Sparkles,
  Utensils, Bus, Accessibility, Palette, TreePine,
  Percent, Truck, CalendarDays, Folder, Clock,
  AlertCircle, CheckCircle2, HelpCircle, Landmark,
};

const SUBPROGRAMAS = [
  { id: "educacao-integral",  nome: "Educação Integral",    descricao: "Pra escolas com jornada ampliada — materiais e equipamentos pro contraturno" },
  { id: "escola-acessivel",   nome: "Escola Acessível",     descricao: "Adaptar a escola pra alunos com deficiência — rampas, banheiros, sinalização" },
  { id: "mais-alfabetizacao", nome: "Mais Alfabetização",   descricao: "Materiais e recursos pra turmas de 1º e 2º ano do fundamental" },
  { id: "escola-conectada",   nome: "Escola Conectada",     descricao: "Equipamentos de informática e infraestrutura de internet" },
  { id: "educacao-campo",     nome: "Educação do Campo",    descricao: "Recursos específicos pra escolas rurais, quilombolas e indígenas" },
  { id: "novo-ensino-medio",  nome: "Novo Ensino Médio",    descricao: "Implementação dos itinerários formativos e laboratórios" },
];

const VERBAS_COMPARTILHADAS = [
  { id: "pnae",  sigla: "PNAE",  subtitulo: "Alimentação Escolar", cor: "#e07b3f", descricao: "Verba da merenda. Gerida pela prefeitura ou estado, mas a escola participa do cardápio e da fiscalização.", fundo: "rgba(224,123,63,0.08)" },
  { id: "pnate", sigla: "PNATE", subtitulo: "Zona rural",          cor: "#3f7bca", descricao: "Dinheiro pro transporte dos alunos da zona rural até a escola. Normalmente fica com o município, mas a escola pode ajudar na fiscalização.", fundo: "rgba(63,123,202,0.08)" },
];

const PASSOS = [
  { num: 1, titulo: "O dinheiro chega",     desc: "O FNDE libera a verba e ela cai direto na conta da UEx — APM ou Conselho Escolar.", cor: "#e8a03a", fundo: "rgba(232,160,58,0.12)" },
  { num: 2, titulo: "O Conselho decide",    desc: "Vocês se reúnem para decidir o que comprar. Tudo precisa estar no plano de aplicação.", cor: "#4caf7d", fundo: "rgba(76,175,125,0.12)" },
  { num: 3, titulo: "Você compra",          desc: "Faz a pesquisa de preços, escolhe o fornecedor e realiza a compra seguindo as regras.", cor: "#5b8fd6", fundo: "rgba(91,143,214,0.12)" },
  { num: 4, titulo: "Guarda os documentos", desc: "Nota fiscal, comprovante de pagamento e ata — tudo organizado por programa e ano.", cor: "#e06e6e", fundo: "rgba(224,110,110,0.12)" },
  { num: 5, titulo: "Presta contas",        desc: "No prazo, você envia os documentos para mostrar como usou cada centavo.", cor: "#9b6bcc", fundo: "rgba(155,107,204,0.12)" },
];

const DICAS = [
  { titulo: "Sempre em grupo",      texto: "Nunca decida sozinha. O Conselho Escolar precisa aprovar todas as compras.", cor: "#4caf7d", fundo: "rgba(76,175,125,0.10)", borda: "rgba(76,175,125,0.30)" },
  { titulo: "Nada de dinheiro vivo",texto: "Todo pagamento deve sair da conta do programa direto para o fornecedor.",  cor: "#e06e6e", fundo: "rgba(224,110,110,0.10)", borda: "rgba(224,110,110,0.30)" },
  { titulo: "De olho no prazo",     texto: "A prestação de contas tem data certa. Anote no calendário.",               cor: "#e8a03a", fundo: "rgba(232,160,58,0.10)",  borda: "rgba(232,160,58,0.30)" },
  { titulo: "Pesquise preços",      texto: "Pelo menos 3 orçamentos antes de comprar qualquer coisa.",                 cor: "#5b8fd6", fundo: "rgba(91,143,214,0.10)",  borda: "rgba(91,143,214,0.30)" },
];

const FEAT = [
  { titulo: "Linguagem simples", texto: "Explicações diretas para a rotina da diretora.",                         rot: "-0.8deg", cor: "#e8a03a" },
  { titulo: "Passo a passo",     texto: "Do recebimento do recurso até a prestação de contas.",                   rot: "0.5deg",  cor: "#4caf7d" },
  { titulo: "Consulta rápida",   texto: "Glossário, dicas e programas organizados em um só lugar.",               rot: "-0.4deg", cor: "#5b8fd6" },
];

const SEC  = "rounded-[30px] border border-[#e8ddd2] p-6 shadow-[0_18px_40px_rgba(134,112,92,0.08)] relative overflow-hidden";
const BG   = { background: "linear-gradient(180deg,rgba(255,252,248,0.97) 0%,rgba(251,246,239,0.97) 100%)" };
const LINE = "before:absolute before:left-[22px] before:top-0 before:bottom-0 before:w-px before:bg-[#e8b7b7]/60 after:absolute after:left-0 after:right-0 after:top-[62px] after:h-px after:bg-[#f1e8df]";

function Hl({ children }: { children: React.ReactNode }) {
  return <span className="bg-yellow-200/70 px-0.5 rounded-sm">{children}</span>;
}

function GlossarioSection() {
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLetra, setActiveLetra] = useState<string | null>(null);

  const { data: glossaryItems = [], isLoading } = useQuery<GlossaryItem[]>({ queryKey: ["/api/glossary"] });

  const glossario = useMemo(() =>
    glossaryItems.map(i => ({ termo: i.term, explicacao: i.explanation, letra: i.letter })),
    [glossaryItems]
  );

  const letras = useMemo(() => [...new Set(glossario.map(g => g.letra))].sort(), [glossario]);

  const filtrados = useMemo(() => {
    let f = glossario;
    if (searchTerm.trim()) { const t = searchTerm.toLowerCase(); f = f.filter(g => g.termo.toLowerCase().includes(t) || g.explicacao.toLowerCase().includes(t)); }
    if (activeLetra) f = f.filter(g => g.letra === activeLetra);
    return f;
  }, [glossario, searchTerm, activeLetra]);

  const isFiltering = searchTerm.trim() !== "" || activeLetra !== null;
  const visiveis = isFiltering ? filtrados : (expanded ? glossario : glossario.slice(0, 5));

  if (isLoading) return (
    <div className={`${SEC} ${LINE} flex items-center justify-center py-16`} style={BG}>
      <Loader2 className="w-6 h-6 animate-spin text-[#9f968d]" />
    </div>
  );

  return (
    <div className={`${SEC} ${LINE}`} style={BG}>
      <h3 className="text-xl font-bold tracking-tight text-[#1f2a37] pl-6" style={{ fontFamily: "Georgia, serif" }}>Glossário</h3>
      <p className="mt-1 text-sm text-[#738194] pl-6">Palavras que você vai encontrar — explicadas em linguagem simples.</p>

      <div className="mt-4 rounded-[10px] border border-[#e3d8cd] bg-[#fffdfa] px-4 py-2.5 flex items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <Search className="w-4 h-4 shrink-0 text-[#b8a898]" />
        <input
          placeholder="Buscar termo... (ex: prestação de contas)"
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); if (e.target.value.trim()) setActiveLetra(null); }}
          className="w-full bg-transparent outline-none text-sm text-[#5a5048] placeholder:text-[#c8b8a8]"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 pl-6">
        {letras.map(l => (
          <button
            key={l}
            onClick={() => { setActiveLetra(activeLetra === l ? null : l); setSearchTerm(""); }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all border"
            style={activeLetra === l
              ? { background: "#8a6e5b", color: "white", borderColor: "#8a6e5b" }
              : { background: "#fffaf6", color: "#8a6e5b", borderColor: "#ebdfd4" }}
          >{l}</button>
        ))}
        {(activeLetra || searchTerm) && (
          <button onClick={() => { setActiveLetra(null); setSearchTerm(""); }}
            className="h-8 px-3 rounded-full text-xs font-medium transition-all"
            style={{ background: "#f5ede4", color: "#8a6e5b", border: "1px solid #ebdfd4" }}>
            Limpar
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3 pl-6">
        {isFiltering && filtrados.length === 0 && (
          <p className="text-sm text-[#9f968d] py-4 text-center">Nenhum termo encontrado</p>
        )}
        {visiveis.map((g, i) => (
          <div key={g.termo}
            className="relative rounded-[6px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_6px_12px_rgba(120,100,80,0.08)] overflow-hidden before:absolute before:-top-2 before:right-5 before:h-5 before:w-12 before:rotate-[5deg] before:bg-[#efe5d8]/90 before:shadow-sm"
            style={{ transform: `rotate(${i % 2 === 0 ? "0.3" : "-0.2"}deg)` }}
          >
            <div className="text-sm font-semibold text-[#24344a]">{g.termo}</div>
            <p className="mt-1.5 text-sm leading-5 text-[#738194]">{g.explicacao}</p>
          </div>
        ))}
      </div>

      {!isFiltering && glossario.length > 5 && (
        <button onClick={() => setExpanded(!expanded)}
          className="mt-4 pl-6 text-sm font-medium transition flex items-center gap-1"
          style={{ color: "#b86e3f" }}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? "Ver menos" : `Ver todos os ${glossario.length} termos`}
        </button>
      )}
    </div>
  );
}

function VerbasSection() {
  const [acoesExpanded, setAcoesExpanded] = useState(false);

  return (
    <section className={`${SEC} ${LINE}`} style={BG}>
      <div className="pl-6 mb-6">
        <h3 className="text-2xl font-extrabold text-[#1f2a37]" style={{ fontFamily: "Georgia, serif" }}>Verbas que a Escola Gerencia</h3>
        <p className="mt-1 text-sm text-[#738194]">Programas organizados entre verbas diretas da escola e verbas compartilhadas com a Secretaria.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 pl-6">
        {/* PDDE */}
        <div className="rounded-[8px] border border-[#e7dccf] bg-[#fffdf8] p-5 shadow-[0_10px_20px_rgba(120,100,80,0.14)] relative overflow-hidden before:absolute before:left-[18px] before:top-0 before:bottom-0 before:w-px before:bg-[#f5c04a]/60"
          style={{ transform: "rotate(0.4deg)" }}>
          <span className="absolute -top-3 right-4 border-2 px-2 py-[2px] text-[10px] font-bold tracking-[0.12em] bg-white"
            style={{ color: "#b23a2e", borderColor: "#b23a2e", transform: "rotate(8deg)" }}>IMPORTANTE</span>
          <div className="mb-4 pb-3 border-b border-[#f0e8de] flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-[#24344a]">PDDE</div>
              <div className="mt-0.5 text-xs" style={{ color: "#4caf7d" }}>✦ Direto para a escola</div>
            </div>
            <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "rgba(232,160,58,0.15)", color: "#b27a2a" }}>Mais usado</span>
          </div>
          <div className="space-y-3">
            <Link href="/programas/pdde-basico">
              <div className="rounded-[6px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_6px_12px_rgba(120,100,80,0.10)] hover:shadow-[0_8px_16px_rgba(120,100,80,0.18)] transition-all cursor-pointer group"
                style={{ borderLeft: "3px solid #e8a03a" }}>
                <div className="text-sm font-semibold text-[#24344a]"><Hl>PDDE Básico</Hl></div>
                <p className="mt-1.5 text-sm leading-5 text-[#738194]">Dinheiro direto na conta da escola para material, manutenção e melhorias. O arroz com feijão dos recursos.</p>
                <span className="mt-2 inline-block text-sm font-medium transition-colors" style={{ color: "#b86e3f" }}>Ver Regras →</span>
              </div>
            </Link>
            <div className="rounded-[6px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_6px_12px_rgba(120,100,80,0.10)]"
              style={{ borderLeft: "3px solid #9b6bcc" }}>
              <div className="text-sm font-semibold text-[#24344a]">Ações Integradas do PDDE</div>
              <p className="mt-1.5 text-sm leading-5 text-[#738194]">Verbas extras do PDDE para projetos específicos. Cada ação tem regras próprias e a escola precisa aderir a cada uma.</p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm font-medium" style={{ color: "#b86e3f" }}>
                <Link href="/programas/acoes-integradas"><span className="hover:opacity-70 transition cursor-pointer">Ver Regras →</span></Link>
                <button onClick={() => setAcoesExpanded(!acoesExpanded)} className="hover:opacity-70 transition">
                  {acoesExpanded ? `Fechar ações ↑` : `Ver ${SUBPROGRAMAS.length} ações ↓`}
                </button>
              </div>
              <AnimatePresence>
                {acoesExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="mt-3 grid gap-2">
                      {SUBPROGRAMAS.map(sub => (
                        <Link key={sub.id} href={`/programas/acoes-integradas/${sub.id}`}>
                          <div className="rounded-[4px] border border-[#ece3db] bg-white/80 p-3 hover:bg-white hover:shadow-sm transition-all cursor-pointer">
                            <div className="text-xs font-semibold text-[#24344a]">{sub.nome}</div>
                            <p className="mt-0.5 text-xs leading-4 text-[#8f8275]">{sub.descricao}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Compartilhadas */}
        <div className="rounded-[8px] border border-[#e7dccf] bg-[#fffdf8] p-5 shadow-[0_10px_20px_rgba(120,100,80,0.14)] relative overflow-hidden before:absolute before:left-[18px] before:top-0 before:bottom-0 before:w-px before:bg-[#a8c4e8]/55"
          style={{ transform: "rotate(-0.3deg)" }}>
          <div className="mb-4 pb-3 border-b border-[#f0e8de] flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-[#24344a]">Verbas Compartilhadas</div>
              <div className="mt-0.5 text-xs text-[#8f8275]">Geridas pela Secretaria</div>
            </div>
            <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "rgba(91,143,214,0.12)", color: "#3f6aa0" }}>Gestão compartilhada</span>
          </div>
          <div className="space-y-3">
            {VERBAS_COMPARTILHADAS.map(v => (
              <div key={v.id} className="rounded-[6px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_6px_12px_rgba(120,100,80,0.10)] hover:shadow-[0_8px_16px_rgba(120,100,80,0.18)] transition-all group"
                style={{ borderLeft: `3px solid ${v.cor}` }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-[#24344a]">{v.sigla}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: v.fundo, color: v.cor }}>{v.subtitulo}</span>
                </div>
                <p className="text-sm leading-5 text-[#738194]">{v.descricao}</p>
                <Link href={`/programas/${v.id}`}>
                  <span className="mt-2 inline-block text-sm font-medium cursor-pointer transition hover:opacity-70" style={{ color: "#b86e3f" }}>Ver Regras →</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Programas() {
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  return (
    <div className="min-h-screen text-slate-700" style={{ background: "#f4ede3" }}>
      <Navigation />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 lg:px-10">

        {/* ── HERO ── */}
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          {/* Card principal */}
          <div className={`${SEC} ${LINE} p-7`} style={BG}>
            <div className="pl-6">
              <div className="inline-flex items-center rounded-full border border-[#efe3d8] bg-[#fffaf6] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[#9f968d]">
                Programas e Políticas
              </div>
              <h2 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-[#1f2a37] md:text-4xl" style={{ fontFamily: "Georgia, serif" }}>
                {settings?.programas_hero_titulo || <>Entenda de onde vem o dinheiro da escola e como cuidar de cada <Hl>verba</Hl> com segurança.</>}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#66768a]">
                {settings?.programas_hero_desc || <>Tudo em linguagem simples: como o recurso chega, quem decide, o que pode comprar e o que precisa guardar para <Hl>prestar contas</Hl> direitinho.</>}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {FEAT.map(f => (
                  <div key={f.titulo}
                    className="relative rounded-[4px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_10px_20px_rgba(120,100,80,0.14)] overflow-hidden before:absolute before:-top-3 before:left-6 before:h-6 before:w-14 before:rotate-[-8deg] before:bg-[#efe4d5]/90 before:shadow-sm after:absolute after:-bottom-[2px] after:left-0 after:right-0 after:h-[8px] after:bg-[repeating-linear-gradient(90deg,#efe3d6_0px,#efe3d6_8px,transparent_8px,transparent_14px)]"
                    style={{ transform: `rotate(${f.rot})`, borderTop: `3px solid ${f.cor}` }}
                  >
                    <div className="text-sm font-semibold text-[#24344a]">{f.titulo}</div>
                    <p className="mt-2 text-sm leading-6 text-[#738194]">{f.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Aside */}
          <aside className={`${SEC} ${LINE} p-6`} style={BG}>
            <div className="pl-4">
              <div className="text-sm font-bold text-[#24344a]">Por onde começar?</div>
              <p className="mt-3 text-sm leading-6 text-[#6f7d8f]">
                O <strong><Hl>PDDE Básico</Hl></strong> é o programa mais importante para a diretora no dia a dia. É ele que ajuda na compra de materiais, pequenos reparos e melhorias que mantêm a escola funcionando.
              </p>
              <Link href="/programas/pdde-basico">
                <button
                  className="mt-5 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_20px_rgba(184,110,63,0.28)] transition hover:-translate-y-[1px] active:translate-y-0"
                  style={{ background: "#b86e3f" }}
                >
                  Conhecer o <Hl>PDDE Básico</Hl>
                </button>
              </Link>

              <div className="mt-6 pt-5 border-t border-[#f0e8de] space-y-3">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9f968d]">Outros programas</div>
                {VERBAS_COMPARTILHADAS.map(v => (
                  <Link key={v.id} href={`/programas/${v.id}`}>
                    <div className="flex items-center gap-2 py-1.5 group cursor-pointer">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: v.cor }} />
                      <span className="text-sm text-[#8a7b70] group-hover:text-[#24344a] transition">{v.sigla} — {v.subtitulo}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </section>

        {/* ── GLOSSÁRIO + DICAS ── */}
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <GlossarioSection />

          <div className={`${SEC} ${LINE}`} style={BG}>
            <span className="absolute right-6 top-5 border-2 bg-white px-3 py-[2px] text-[10px] font-bold tracking-[0.12em]"
              style={{ color: "#b23a2e", borderColor: "#b23a2e", transform: "rotate(8deg)" }}>ATENÇÃO</span>
            <h3 className="text-xl font-bold text-[#1f2a37] pl-6" style={{ fontFamily: "Georgia, serif" }}>Dicas de Ouro</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 pl-6">
              {DICAS.map((d, i) => (
                <div key={d.titulo}
                  className="relative rounded-[4px] p-4 shadow-[0_8px_16px_rgba(120,100,80,0.12)] overflow-hidden before:absolute before:-top-3 before:right-6 before:h-6 before:w-14 before:rotate-[8deg] before:bg-[#f1e6da]/90 before:shadow-sm after:absolute after:-bottom-[2px] after:left-0 after:right-0 after:h-[8px] after:bg-[repeating-linear-gradient(90deg,#efe3d6_0px,#efe3d6_8px,transparent_8px,transparent_14px)]"
                  style={{ background: d.fundo, border: `1px solid ${d.borda}`, transform: `rotate(${i % 2 === 0 ? "0.6" : "-0.5"}deg)` }}
                >
                  <div className="text-sm font-semibold" style={{ color: d.cor }}>{d.titulo}</div>
                  <p className="mt-2 text-sm leading-6 text-[#738194]">{d.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMO FUNCIONA ── */}
        <section className={`${SEC} ${LINE}`} style={BG}>
          <div className="pl-6 mb-6">
            <h3 className="text-2xl font-extrabold text-[#1f2a37]" style={{ fontFamily: "Georgia, serif" }}>Como funciona na prática?</h3>
            <p className="mt-2 text-sm text-[#738194]">O caminho do dinheiro em 5 passos simples.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-5 pl-6">
            {PASSOS.map(p => (
              <div key={p.num}
                className="relative rounded-[4px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_10px_20px_rgba(120,100,80,0.14)] overflow-hidden before:absolute before:-top-3 before:right-5 before:h-6 before:w-12 before:rotate-[7deg] before:bg-[#f0e4d8]/90 before:shadow-sm after:absolute after:-bottom-[2px] after:left-0 after:right-0 after:h-[8px] after:bg-[repeating-linear-gradient(90deg,#efe3d6_0px,#efe3d6_8px,transparent_8px,transparent_14px)]"
                style={{ transform: "rotate(-0.6deg)", borderTop: `3px solid ${p.cor}` }}
              >
                <div className="mb-3 inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full px-3 text-xs font-bold" style={{ background: p.fundo, color: p.cor }}>{p.num}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9f968d]">Passo {p.num}</div>
                <div className="mt-2 text-sm font-semibold text-[#24344a]">{p.titulo}</div>
                <p className="mt-2 text-sm leading-5 text-[#738194]">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── VERBAS ── */}
        <VerbasSection />

      </main>

      <Footer />
    </div>
  );
}
