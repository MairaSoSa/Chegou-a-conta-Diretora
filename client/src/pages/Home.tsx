import { useState } from "react";
import { Link } from "wouter";
import { SlidersHorizontal } from "lucide-react";
import { useAccessibility } from "@/App";
import "./home-landing.css";

const STORAGE_KEY = "chegou-conta-trilha-progresso";

const TRILHA_ITEMS = [
  { id: "t1", label: "explorar os dados da minha escola" },
  { id: "t2", label: "conferir prazos e o calendário FNDE" },
  { id: "t3", label: "entender o PDDE e os programas" },
  { id: "t4", label: "acessar ferramentas e modelos prontos" },
  { id: "t5", label: "ler a legislação que importa" },
  { id: "t6", label: "usar o Caderno da Diretora com IA" },
];

const NOTE_CARDS = [
  {
    color: "hl-yellow",
    emoji: "📊",
    title: "Painel da Escola",
    desc: "Censo, IDEB, matrículas e repasses por código INEP.",
    small: "dados do INEP · FNDE",
    href: "/dashboard",
  },
  {
    color: "hl-pink",
    emoji: "⚖️",
    title: "Legislação",
    desc: "Normas MEC/FNDE, resoluções e Diário Oficial.",
    small: "base legal",
    href: "/legislacao",
  },
  {
    color: "hl-blue",
    emoji: "📅",
    title: "Calendário",
    desc: "Prazos de prestação de contas e repasses FNDE.",
    small: "não perca o prazo",
    href: "/calendario",
  },
  {
    color: "hl-purple",
    emoji: "💰",
    title: "Programas",
    desc: "PDDE, PNAE, PNATE — saldos e situação cadastral.",
    small: "recurso público",
    href: "/programas",
  },
  {
    color: "hl-orange",
    emoji: "🧰",
    title: "Ferramentas",
    desc: "Modelos de ofício, planilhas e materiais prontos.",
    small: "apoio prático",
    href: "/ferramentas",
  },
  {
    color: "hl-teal",
    emoji: "📓",
    title: "Caderno da Diretora",
    desc: "IA especializada em gestão escolar para tirar dúvidas.",
    small: "inteligência artificial",
    href: "/chat",
  },
];

const MENU_PILLS = [
  { label: "dados",       href: "/dashboard" },
  { label: "legislação",  href: "/legislacao" },
  { label: "calendário",  href: "/calendario" },
  { label: "trilha",      href: "/trilha" },
  { label: "programas",   href: "/programas" },
  { label: "ferramentas", href: "/ferramentas" },
  { label: "caderno",     href: "/chat" },
];

export default function Home() {
  const { toggle: toggleAccessibility } = useAccessibility();
  const [checks, setChecks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { t1: false, ...saved };
    } catch {
      return {};
    }
  });

  const toggleCheck = (id: string) => {
    setChecks(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const done = Object.values(checks).filter(Boolean).length;

  return (
    <div className="hl-root">
      <div className="hl-doodle-1" />
      <div className="hl-doodle-2" />
      <div className="hl-doodle-3" />

      <div className="hl-notebook">
        <aside className="hl-spiral" />

        <section className="hl-page">
          {/* Topo removido conforme solicitado */}

          {/* ── Layout principal ── */}
          <div className="hl-layout">
            {/* Coluna esquerda */}
            <div className="hl-left-col">
              {/* Hero */}
              <div className="hl-hero-note">
                <span className="hl-eyebrow">
                  <span className="hl-dots" />
                  um cantinho mais bonito para cuidar da escola
                </span>
                <h2>
                  Chegou a Conta,{" "}
                  <span className="hl-accent">Diretora.</span>
                </h2>
                <p className="hl-hero-desc">
                  Aqui você acompanha dados da escola, programas federais, prazos e ferramentas —
                  tudo num só lugar, com cara de caderno de verdade.
                </p>
                <div className="hl-hero-actions">
                  {/* Botão removido daqui para ser colado no card do Painel da Escola */}
                </div>
                <div className="hl-hero-tags">
                  <span className="hl-tag">dados educacionais</span>
                  <span className="hl-tag">PDDE · PNAE</span>
                  <span className="hl-tag">legislação</span>
                  <span className="hl-tag">ferramentas práticas</span>
                </div>
              </div>

              {/* Mural */}
              <p className="hl-mural-label">Mural da diretora</p>
              <div className="hl-cards-grid">
                {NOTE_CARDS.map((card, i) => (
                  <Link key={i} href={card.href}>
                    <div className={`hl-note-card ${card.color}`} style={{ position: 'relative' }}>
                      <div className="hl-card-emoji">{card.emoji}</div>
                      <h3>{card.title}</h3>
                      <p>{card.desc}</p>
                      <small>{card.small}</small>
                      {/* Se for o Painel da Escola, mostra o botão remendo */}
                      {card.title === 'Painel da Escola' && (
                        <Link href="/dashboard" style={{ position: 'absolute', top: 8, right: 8, textDecoration: 'none', zIndex: 2 }}>
                          <span style={{
                            background: '#fffbe6',
                            color: '#1e293b',
                            border: '2px dashed #facc15',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            padding: '4px 10px',
                            boxShadow: '2px 2px 8px rgba(0,0,0,0.08)',
                            transform: 'rotate(-6deg)',
                            display: 'inline-block',
                            cursor: 'pointer',
                          }}>
                            Ver minha escola
                          </span>
                        </Link>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Coluna direita */}
            <div className="hl-right-col">
              {/* Dica do dia */}
              <div className="hl-tip-box">
                <strong>💡 Dica do dia</strong>
                <p>
                  Comece pelo Painel da Escola — digite o código INEP e veja os dados em segundos.
                </p>
              </div>

              {/* Trilha */}
              <div className="hl-caderno-box">
                <div className="hl-trilha-header">
                  <h3>🧭 Trilha da Diretora</h3>
                  <span className="hl-trilha-badge">
                    {done}/{TRILHA_ITEMS.length}
                  </span>
                </div>
                <p className="hl-trilha-desc">
                  Marque cada etapa conforme for explorando a plataforma. Sua jornada fica salva automaticamente.
                </p>
                {/* Botão 'Começar a jornada' imediatamente após o título e descrição */}
                <div style={{ margin: '12px 0 18px 0', textAlign: 'center' }}>
                  <Link href="/trilha">
                    <span className="hl-btn hl-btn-primary">Começar a jornada</span>
                  </Link>
                </div>
                <div className="hl-checklist">
                  {TRILHA_ITEMS.map(item => (
                    <div
                      key={item.id}
                      className={`hl-check-item${checks[item.id] ? " done" : ""}`}
                    >
                      <input
                        id={item.id}
                        type="checkbox"
                        checked={!!checks[item.id]}
                        onChange={() => toggleCheck(item.id)}
                      />
                      <label htmlFor={item.id}>{item.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Rodapé ── */}
          <div className="hl-footer-strip">
            <span>gratuito para diretores de escolas públicas</span>
          </div>
        </section>
      </div>
      {/* Botão de acessibilidade fixo no canto inferior direito */}
      <button
        onClick={toggleAccessibility}
        className="hl-a11y-btn"
        aria-label="Ajustes de acessibilidade"
        title="Acessibilidade"
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
        }}
      >
        <SlidersHorizontal size={22} />
      </button>
    </div>
  );
}
