import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import "./home-landing.css";

const STORAGE_KEY = "chegou-conta-trilha-progresso";

const TRILHA_ITEMS = [
  { id: "t1", label: "ver os dados principais da escola" },
  { id: "t2", label: "acompanhar regras e calendários" },
  { id: "t3", label: "entender programas e recursos" },
  { id: "t4", label: "usar ferramentas de apoio" },
  { id: "t5", label: "marcar o que já foi concluído" },
  { id: "t6", label: "seguir a jornada com mais clareza" },
];

const NOTE_CARDS = [
  { color: "hl-yellow", emoji: "📊", title: ["Dados", "da escola"],   desc: "IDEB, matrículas, docentes e indicadores.",         small: "indicadores e análises", href: "/dashboard" },
  { color: "hl-pink",   emoji: "⚖️", title: ["Regras", "e leis"],     desc: "Normas e orientações para apoiar decisões.",        small: "legislação",             href: "/legislacao" },
  { color: "hl-blue",   emoji: "📅", title: ["Calendário", "de prazos"], desc: "O que precisa entrar no radar da direção.",       small: "agenda e prazos",        href: "/calendario" },
  { color: "hl-green",  emoji: "🧭", title: ["Trilha", "da gestão"],  desc: "Passo a passo para navegar pela plataforma.",       small: "jornada guiada",         href: "/trilha" },
  { color: "hl-purple", emoji: "💰", title: ["Programas", "e recursos"], desc: "Informações organizadas sobre repasses.",        small: "repasses e ações",       href: "/programas" },
  { color: "hl-orange", emoji: "🧰", title: ["Ferramentas", "úteis"], desc: "Modelos, materiais e apoio para o dia a dia.",      small: "materiais úteis",        href: "/ferramentas" },
];

const MENU_PILLS = [
  { label: "dados",        href: "/dashboard" },
  { label: "legislação",   href: "/legislacao" },
  { label: "calendário",   href: "/calendario" },
  { label: "programas",    href: "/programas" },
  { label: "ferramentas",  href: "/ferramentas" },
  { label: "trilha",       href: "/trilha" },
];

export default function Home() {
  const [, navigate] = useLocation();
  const [checks, setChecks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { t1: true, ...saved };
    } catch {
      return { t1: true };
    }
  });

  const toggleCheck = (id: string) => {
    setChecks(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <div className="hl-root">
      {/* Background doodles */}
      <div className="hl-doodle-1" />
      <div className="hl-doodle-2" />
      <div className="hl-doodle-3" />

      {/* Notebook */}
      <div className="hl-notebook">
        <aside className="hl-spiral" />

        <section className="hl-page">
          {/* Top bar */}
          <div className="hl-topbar">
            <div className="hl-brand">
              <span className="hl-brand-badge" />
              <div>
                <h1>Chegou a Conta, Diretora!</h1>
                <p>um caderno bonito para organizar a gestão da escola</p>
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

          {/* Main layout */}
          <div className="hl-layout">
            {/* Left column */}
            <div>
              {/* Hero note */}
              <div className="hl-hero-note">
                <span className="hl-eyebrow">
                  <span className="hl-dots" />
                  um cantinho mais bonito para cuidar da escola
                </span>
                <h2>
                  Chegou a Conta, <span className="hl-accent">Diretora.</span>
                </h2>
                <p>
                  Como anda a gestão da sua escola? Aqui você acompanha dados, programas, prazos e ferramentas em um só lugar.
                  Um lugar com cara de caderno de verdade: colorido, acolhedor, leve e mais útil logo na primeira olhada.
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
                  <span className="hl-tag">programas</span>
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
                      <h3>{card.emoji} {card.title[0]}<br />{card.title[1]}</h3>
                      <p>{card.desc}</p>
                      <small>{card.small}</small>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="hl-right-col">
              {/* Tip box */}
              <div className="hl-tip-box">
                <strong>💡 Dica do dia</strong>
                <p>Comece pelos prazos e pelos dados da escola. Depois, avance para programas, ferramentas e legislação.</p>
              </div>

              {/* Trilha checklist */}
              <div className="hl-caderno-box">
                <h3>🧭 Trilha da Diretora</h3>
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

          {/* Footer */}
          <div className="hl-footer-strip">
            <span>gratuito para diretores de escolas públicas</span>
            <span>chegou a conta, diretora • um espaço mais bonito para a gestão escolar</span>
          </div>
        </section>
      </div>
    </div>
  );
}
