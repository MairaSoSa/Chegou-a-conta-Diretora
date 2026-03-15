import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  ArrowRight, BookOpen, GraduationCap, Utensils, Bus,
  Coins, ChevronDown, ChevronUp, FileText, Calculator,
  CheckCircle2, AlertCircle, HelpCircle, Landmark, Users,
  Accessibility, Sparkles, BookMarked, Laptop, Palette,
  TreePine, School, BookText, MessageCircleQuestion,
  Banknote, Building2, FileCheck, Clock, Folder,
  Search, Scale, Receipt, Handshake, ShieldCheck,
  Percent, ClipboardList, PiggyBank, Gavel, CalendarDays,
  FileSignature, Package, Truck, CircleDollarSign, Hash,
  Loader2, type LucideIcon
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

function renderIcon(iconName: string, className = "w-5 h-5") {
  const I = ICON_MAP[iconName];
  return I ? <I className={className} /> : <BookText className={className} />;
}

const PROGRAMAS = [
  {
    id: "pdde-basico",
    sigla: "PDDE Básico",
    destaque: "Mais usado",
    descricao: "Dinheiro que vai direto pra conta da escola pra você usar em material, manutenção e melhorias. É o arroz com feijão dos recursos — toda escola pública recebe.",
    subprogramas: undefined as undefined | { id: string; nome: string; descricao: string }[],
  },
  {
    id: "acoes-integradas",
    sigla: "Ações Integradas do PDDE",
    destaque: undefined,
    descricao: "São verbas extras do PDDE pra projetos específicos. Cada ação tem regras próprias sobre o que pode comprar. A escola precisa aderir a cada uma.",
    subprogramas: [
      { id: "educacao-integral", nome: "Educação Integral", descricao: "Pra escolas com jornada ampliada — comprar materiais e equipamentos pro contraturno" },
      { id: "escola-acessivel", nome: "Escola Acessível", descricao: "Adaptar a escola pra alunos com deficiência — rampas, banheiros, sinalização" },
      { id: "mais-alfabetizacao", nome: "Mais Alfabetização", descricao: "Materiais e recursos pra turmas de 1º e 2º ano do fundamental" },
      { id: "escola-conectada", nome: "Escola Conectada", descricao: "Equipamentos de informática e infraestrutura de internet" },
      { id: "educacao-campo", nome: "Educação do Campo", descricao: "Recursos específicos pra escolas rurais, quilombolas e indígenas" },
      { id: "novo-ensino-medio", nome: "Novo Ensino Médio", descricao: "Implementação dos itinerários formativos e laboratórios" },
    ],
  },
];

const VERBAS_COMPARTILHADAS = [
  {
    id: "pnae",
    sigla: "PNAE",
    subtitulo: "Alimentação Escolar",
    descricao: "Verba da merenda. Em geral é gerida pela prefeitura ou pelo estado, mas a escola participa do cardápio e da fiscalização.",
  },
  {
    id: "pnate",
    sigla: "PNATE",
    subtitulo: "Zona rural",
    descricao: "Dinheiro pro transporte dos alunos da zona rural até a escola. Normalmente fica com o município, mas a escola pode ajudar na fiscalização.",
  },
];

const PASSOS = [
  { num: 1, titulo: "O dinheiro chega", desc: "O FNDE libera a verba e ela cai direto na conta da UEx, geralmente APM ou Conselho Escolar." },
  { num: 2, titulo: "O Conselho decide", desc: "Vocês se reúnem para decidir o que comprar. Tudo precisa estar no plano de aplicação." },
  { num: 3, titulo: "Você compra", desc: "Faz a pesquisa de preços, escolhe o fornecedor e realiza a compra seguindo as regras." },
  { num: 4, titulo: "Guarda os documentos", desc: "Nota fiscal, comprovante de pagamento e ata: tudo organizado por programa e ano." },
  { num: 5, titulo: "Presta contas", desc: "No prazo, você envia os documentos para mostrar como usou cada centavo." },
];

const DICAS = [
  { titulo: "Sempre em grupo", texto: "Nunca decida sozinha. O Conselho Escolar precisa aprovar todas as compras." },
  { titulo: "Nada de dinheiro vivo", texto: "Todo pagamento deve sair da conta do programa direto para o fornecedor." },
  { titulo: "De olho no prazo", texto: "A prestação de contas tem data certa. Anote no calendário." },
  { titulo: "Pesquise preços", texto: "Pelo menos 3 orçamentos antes de comprar qualquer coisa." },
];

const SEC = "rounded-[30px] border border-[#e8ddd2] bg-[linear-gradient(180deg,rgba(255,252,248,0.97)_0%,rgba(251,246,239,0.97)_100%)] p-6 shadow-[0_18px_40px_rgba(134,112,92,0.08)] relative overflow-hidden";
const SEC_LINES = "before:absolute before:left-[22px] before:top-0 before:bottom-0 before:w-px before:bg-[#e8b7b7]/60 after:absolute after:left-0 after:right-0 after:top-[62px] after:h-px after:bg-[#f1e8df]";
const PAPER = "relative rounded-[4px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_10px_20px_rgba(120,100,80,0.14)] overflow-hidden";
const TAPE_TOP = "before:absolute before:-top-3 before:left-6 before:h-6 before:w-14 before:rotate-[-8deg] before:bg-[#efe4d5]/95 before:shadow-sm after:absolute after:-bottom-[2px] after:left-0 after:right-0 after:h-[8px] after:bg-[repeating-linear-gradient(90deg,#efe3d6_0px,#efe3d6_8px,transparent_8px,transparent_14px)]";

function Highlight({ children }: { children: React.ReactNode }) {
  return <span className="bg-yellow-200/70 px-0.5 rounded-sm">{children}</span>;
}

function GlossarioSection() {
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLetra, setActiveLetra] = useState<string | null>(null);

  const { data: glossaryItems = [], isLoading } = useQuery<GlossaryItem[]>({ queryKey: ["/api/glossary"] });

  const glossario = useMemo(() =>
    glossaryItems.map(item => ({ termo: item.term, explicacao: item.explanation, letra: item.letter, iconName: item.iconName || "BookText" })),
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
    <div className={`${SEC} ${SEC_LINES} flex items-center justify-center py-16`}>
      <Loader2 className="w-6 h-6 animate-spin text-[#9f968d]" />
    </div>
  );

  return (
    <div className={`${SEC} ${SEC_LINES}`}>
      <h3 className="text-xl font-bold tracking-tight text-[#1f2a37] pl-6" style={{ fontFamily: "Georgia, serif" }}>Glossário</h3>
      <p className="mt-1 text-sm text-[#738194] pl-6">Palavras que você vai encontrar — explicadas em linguagem simples.</p>

      <div className="mt-4 rounded-[10px] border border-[#e3d8cd] bg-[#fffdfa] px-4 py-2.5 text-sm text-[#8b8075] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] flex items-center gap-2">
        <Search className="w-4 h-4 shrink-0 text-[#b8a898]" />
        <input
          placeholder={`Buscar termo... (ex: prestação de contas)`}
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); if (e.target.value.trim()) setActiveLetra(null); }}
          className="w-full bg-transparent outline-none text-[#5a5048] placeholder:text-[#b8a898]"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 pl-6">
        {letras.map(l => (
          <button
            key={l}
            onClick={() => { setActiveLetra(activeLetra === l ? null : l); setSearchTerm(""); }}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all border ${
              activeLetra === l
                ? "bg-[#8a6e5b] text-white border-[#8a6e5b]"
                : "border-[#ebdfd4] bg-[#fffaf6] text-[#8a6e5b] hover:bg-[#f5ede4]"
            }`}
          >{l}</button>
        ))}
        {(activeLetra || searchTerm) && (
          <button onClick={() => { setActiveLetra(null); setSearchTerm(""); }} className="h-8 px-3 rounded-full text-xs font-medium bg-[#f5ede4] text-[#8a6e5b] border border-[#ebdfd4]">
            Limpar
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3 pl-6">
        {isFiltering && filtrados.length === 0 && (
          <p className="text-sm text-[#9f968d] py-4 text-center">Nenhum termo encontrado</p>
        )}
        {visiveis.map(g => (
          <div key={g.termo} className={`${PAPER} ${TAPE_TOP} rotate-[0.3deg]`}>
            <div className="text-sm font-semibold text-[#24344a]">{g.termo}</div>
            <p className="mt-1.5 text-sm leading-6 text-[#738194]">{g.explicacao}</p>
          </div>
        ))}
      </div>

      {!isFiltering && glossario.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 pl-6 text-sm font-medium text-[#b86e3f] hover:text-[#8f542d] transition flex items-center gap-1"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? "Ver menos" : `Ver todos os ${glossario.length} termos`}
        </button>
      )}
    </div>
  );
}

function ProgramaSubCard({ nome, descricao, id, parentId }: { nome: string; descricao: string; id: string; parentId: string }) {
  return (
    <Link href={`/programas/${parentId}/${id}`}>
      <div className="rounded-[6px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_6px_12px_rgba(120,100,80,0.10)] hover:shadow-[0_8px_16px_rgba(120,100,80,0.16)] transition-all cursor-pointer group">
        <div className="text-sm font-semibold text-[#24344a] group-hover:text-[#b86e3f] transition-colors">{nome}</div>
        <p className="mt-1.5 text-sm leading-5 text-[#738194]">{descricao}</p>
      </div>
    </Link>
  );
}

function VerbasSection() {
  const [acoesExpanded, setAcoesExpanded] = useState(false);

  return (
    <section className={`${SEC} ${SEC_LINES}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between pl-6 mb-6">
        <div>
          <h3 className="text-2xl font-extrabold text-[#1f2a37]" style={{ fontFamily: "Georgia, serif" }}>Verbas que a Escola Gerencia</h3>
          <p className="mt-1 text-sm leading-6 text-[#738194]">Programas organizados entre verbas diretas da escola e verbas compartilhadas com a Secretaria.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 pl-6">
        {/* PDDE */}
        <div className="rounded-[8px] border border-[#e7dccf] bg-[#fffdf8] p-5 shadow-[0_10px_20px_rgba(120,100,80,0.14)] rotate-[0.4deg] relative overflow-hidden before:absolute before:left-[18px] before:top-0 before:bottom-0 before:w-px before:bg-[#e8b7b7]/55">
          <span className="absolute -top-3 right-4 rotate-[8deg] border-2 border-[#b23a2e] bg-white px-2 py-[2px] text-[10px] font-bold tracking-[0.12em] text-[#b23a2e]">IMPORTANTE</span>
          <div className="mb-4">
            <div className="text-sm font-semibold text-[#24344a]">PDDE</div>
            <div className="mt-0.5 text-xs text-[#8f8275]">Mais usado · Direto para a escola</div>
          </div>
          <div className="space-y-3">
            <Link href="/programas/pdde-basico">
              <div className="rounded-[6px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_8px_16px_rgba(120,100,80,0.12)] hover:shadow-[0_10px_20px_rgba(120,100,80,0.18)] transition-all cursor-pointer group">
                <div className="text-sm font-semibold text-[#24344a]">
                  <Highlight>PDDE Básico</Highlight>
                </div>
                <p className="mt-1.5 text-sm leading-5 text-[#738194]">
                  Dinheiro que vai direto para a conta da escola para usar em material, manutenção e melhorias. É o arroz com feijão dos recursos.
                </p>
                <span className="mt-2 inline-block text-sm font-medium text-[#b86e3f] group-hover:text-[#8f542d] transition-colors">Ver Regras →</span>
              </div>
            </Link>

            <div className="rounded-[6px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_8px_16px_rgba(120,100,80,0.12)]">
              <div className="text-sm font-semibold text-[#24344a]">Ações Integradas do PDDE</div>
              <p className="mt-1.5 text-sm leading-5 text-[#738194]">
                Verbas extras do PDDE para projetos específicos. Cada ação tem regras próprias e a escola precisa aderir a cada uma.
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm font-medium text-[#b86e3f]">
                <Link href="/programas/acoes-integradas"><span className="hover:text-[#8f542d] transition-colors cursor-pointer">Ver Regras →</span></Link>
                <button onClick={() => setAcoesExpanded(!acoesExpanded)} className="hover:text-[#8f542d] transition-colors">
                  {acoesExpanded ? "Fechar ações ↑" : `Ver ${PROGRAMAS[1].subprogramas!.length} ações ↓`}
                </button>
              </div>

              <AnimatePresence>
                {acoesExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 grid gap-2">
                      {PROGRAMAS[1].subprogramas!.map(sub => (
                        <ProgramaSubCard key={sub.id} nome={sub.nome} descricao={sub.descricao} id={sub.id} parentId="acoes-integradas" />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Verbas compartilhadas */}
        <div className="rounded-[8px] border border-[#e7dccf] bg-[#fffdf8] p-5 shadow-[0_10px_20px_rgba(120,100,80,0.14)] rotate-[0.4deg] relative overflow-hidden before:absolute before:left-[18px] before:top-0 before:bottom-0 before:w-px before:bg-[#e8b7b7]/55">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[#24344a]">Verbas Compartilhadas</div>
              <div className="mt-0.5 text-xs text-[#8f8275]">Geridas pela Secretaria</div>
            </div>
            <span className="rounded-full bg-[#eef3f7] px-3 py-1 text-xs font-medium text-[#66768a] shrink-0">Gestão compartilhada</span>
          </div>
          <div className="space-y-3">
            {VERBAS_COMPARTILHADAS.map(v => (
              <div key={v.id} className="rounded-[6px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_8px_16px_rgba(120,100,80,0.12)] hover:shadow-[0_10px_20px_rgba(120,100,80,0.18)] transition-all group">
                <div className="text-sm font-semibold text-[#24344a]">{v.sigla}</div>
                <div className="mt-0.5 text-xs text-[#8f8275]">{v.subtitulo}</div>
                <p className="mt-2 text-sm leading-5 text-[#738194]">{v.descricao}</p>
                <Link href={`/programas/${v.id}`}>
                  <span className="mt-2 inline-block text-sm font-medium text-[#b86e3f] group-hover:text-[#8f542d] transition-colors cursor-pointer">Ver Regras →</span>
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
  return (
    <div className="min-h-screen text-slate-700" style={{ background: "#f6f0e8" }}>
      <Navigation />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 lg:px-10">

        {/* ── HERO ── */}
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className={`${SEC} ${SEC_LINES} p-7`}>
            <div className="pl-6">
              <div className="inline-flex items-center rounded-full border border-[#efe3d8] bg-[#fffaf6] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[#9f968d]">
                Programas e Políticas
              </div>
              <h2 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-[#1f2a37] md:text-4xl" style={{ fontFamily: "Georgia, serif" }}>
                Entenda de onde vem o dinheiro da escola e como cuidar de cada <Highlight>verba</Highlight> com segurança.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#66768a]">
                Tudo explicado em linguagem simples: como o recurso chega, quem decide, o que pode comprar e o que precisa guardar para <Highlight>prestar contas</Highlight> direitinho.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  ["Linguagem simples", "Explicações diretas para a rotina da diretora."],
                  ["Passo a passo", "Do recebimento do recurso até a prestação de contas."],
                  ["Consulta rápida", "Glossário, dicas e programas organizados em um só lugar."],
                ].map(([title, text]) => (
                  <div key={title} className={`${PAPER} rotate-[-0.8deg] ${TAPE_TOP}`}>
                    <div className="text-sm font-semibold text-[#24344a]">{title}</div>
                    <p className="mt-2 text-sm leading-6 text-[#738194]">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className={`${SEC} ${SEC_LINES} p-6`}>
            <div className="pl-4">
              <div className="text-sm font-semibold text-[#24344a]">Por onde começar?</div>
              <p className="mt-3 text-sm leading-6 text-[#6f7d8f]">
                O <strong><Highlight>PDDE Básico</Highlight></strong> é o programa mais importante para a diretora no dia a dia. É ele que ajuda na compra de materiais, pequenos reparos e melhorias que mantêm a escola funcionando.
              </p>
              <Link href="/programas/pdde-basico">
                <button className="mt-5 rounded-full bg-[#b86e3f] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_20px_rgba(184,110,63,0.22)] transition hover:-translate-y-[1px] active:translate-y-0">
                  Conhecer o <Highlight>PDDE Básico</Highlight>
                </button>
              </Link>
            </div>
          </aside>
        </section>

        {/* ── GLOSSÁRIO + DICAS ── */}
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <GlossarioSection />

          <div className={`${SEC} ${SEC_LINES}`}>
            <span className="absolute right-6 top-5 rotate-[8deg] border-2 border-[#b23a2e] bg-white px-3 py-[2px] text-[10px] font-bold tracking-[0.12em] text-[#b23a2e]">ATENÇÃO</span>
            <h3 className="text-xl font-bold text-[#1f2a37] pl-6" style={{ fontFamily: "Georgia, serif" }}>Dicas de Ouro</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 pl-6">
              {DICAS.map((d, i) => (
                <div key={d.titulo} className={`${PAPER} rotate-[${i % 2 === 0 ? "0.6" : "-0.5"}deg] ${TAPE_TOP.replace("left-6", "right-6").replace("-8deg", "8deg")}`}>
                  <div className="text-sm font-semibold text-[#24344a]">{d.titulo}</div>
                  <p className="mt-2 text-sm leading-6 text-[#738194]">{d.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMO FUNCIONA ── */}
        <section className={`${SEC} ${SEC_LINES}`}>
          <div className="pl-6 max-w-2xl mb-6">
            <h3 className="text-2xl font-extrabold text-[#1f2a37]" style={{ fontFamily: "Georgia, serif" }}>Como funciona na prática?</h3>
            <p className="mt-2 text-sm leading-6 text-[#738194]">O caminho do dinheiro em 5 passos simples.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-5 pl-6">
            {PASSOS.map((p, i) => (
              <div key={p.num} className={`${PAPER} rotate-[-0.8deg] ${TAPE_TOP}`}>
                <div className="mb-3 inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-[#f4e5d8] px-3 text-xs font-semibold text-[#a2663f]">{i + 1}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9f968d]">Passo {p.num}</div>
                <div className="mt-2 text-sm font-semibold text-[#24344a]">{p.titulo}</div>
                <p className="mt-2 text-sm leading-6 text-[#738194]">{p.desc}</p>
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
