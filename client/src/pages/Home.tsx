import { useState } from "react";
import { Link } from "wouter";
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
    color: "hl-green",
    emoji: "🧭",
    title: "Trilha Guiada",
    desc: "Jornada passo a passo para dominar a gestão.",
    small: "comece aqui",
    href: "/trilha",
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
];

const MENU_PILLS = [
  { label: "dados",       href: "/dashboard" },
  { label: "legislação",  href: "/legislacao" },
  { label: "calendário",  href: "/calendario" },
  { label: "programas",   href: "/programas" },
  { label: "ferramentas", href: "/ferramentas" },
  { label: "trilha",      href: "/trilha" },
];

export default function Home() {
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
          {/* ── Topo ── */}
          <div className="hl-topbar">
            <div className="hl-brand">
              <span className="hl-brand-badge" />
              <div>
                <h1>Chegou a Conta, Diretora!</h1>
                <p>gestão escolar mais bonita e mais simples</p>
              </div>
            </div>
            <nav className="hl-mini-menu">
              {MENU_PILLS.map(p => (
                <Link key={p.href} href={p.href}>
                  <span className="hl-pill">{p.label}</span>
                </Link>
              ))}
            </nav>
          </div>

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
                  <Link href="/trilha">
                    <span className="hl-btn hl-btn-primary">Começar a jornada</span>
                  </Link>
                  <Link href="/dashboard">
                    <span className="hl-btn hl-btn-secondary">Ver minha escola</span>
                  </Link>
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
                    <div className={`hl-note-card ${card.color}`}>
                      <div className="hl-card-emoji">{card.emoji}</div>
                      <h3>{card.title}</h3>
                      <p>{card.desc}</p>
                      <small>{card.small}</small>
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
            <span>chegou a conta, diretora • gestão escolar simplificada</span>
          </div>
        </section>
      </div>
    </div>
  );
}
