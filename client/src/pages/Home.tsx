import { useState } from "react";
import { Link } from "wouter";
import {
  GraduationCap, Scale, CalendarDays,
  Landmark, Wrench, BookOpen, type LucideIcon,
  SlidersHorizontal,
} from "lucide-react";
import { useAccessibility } from "../App";
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

interface NoteCard {
  color: string;
  iconColor: string;
  Icon: LucideIcon;
  title: string;
  desc: string;
  small: string;
  href: string;
}

const NOTE_CARDS: NoteCard[] = [
  {
    color: "hl-yellow",
    iconColor: "#b5860a",
    Icon: GraduationCap,
    title: "Painel da Escola",
    desc: "Censo, IDEB, matrículas e repasses por código INEP.",
    small: "dados do INEP · FNDE",
    href: "/dashboard",
  },
  {
    color: "hl-pink",
    iconColor: "#a0425a",
    Icon: Scale,
    title: "Legislação",
    desc: "Normas MEC/FNDE, resoluções e Diário Oficial.",
    small: "base legal",
    href: "/legislacao",
  },
  {
    color: "hl-green",
    iconColor: "#1a7a6a",
    Icon: CalendarDays,
    title: "Calendário",
    desc: "Prazos de prestação de contas e repasses FNDE.",
    small: "não perca o prazo",
    href: "/calendario",
  },
  {
    color: "hl-purple",
    iconColor: "#6b46a0",
    Icon: Landmark,
    title: "Programas",
    desc: "PDDE, PNAE, PNATE — saldos e situação cadastral.",
    small: "recurso público",
    href: "/programas",
  },
  {
    color: "hl-orange",
    iconColor: "#a05a1a",
    Icon: Wrench,
    title: "Ferramentas",
    desc: "Modelos de ofício, planilhas e materiais prontos.",
    small: "apoio prático",
    href: "/ferramentas",
  },
  {
    color: "hl-teal",
    iconColor: "#1a7a6a",
    Icon: BookOpen,
    title: "Caderno da Diretora",
    desc: "IA especializada em gestão escolar para tirar dúvidas.",
    small: "inteligência artificial",
    href: "/chat",
  },
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
  const { toggle: toggleA11y } = useAccessibility();

  return (
    <div className="hl-root">
      <div className="hl-doodle-1" />
      <div className="hl-doodle-2" />
      <div className="hl-doodle-3" />

      <div className="hl-notebook">
        <aside className="hl-spiral" />

        <section className="hl-page">
          {/* ── Layout principal ── */}
          <div className="hl-layout">
            {/* Coluna esquerda */}
            <div className="hl-left-col">
              {/* Hero */}
              <div className="hl-hero-note">
                <span className="hl-eyebrow">
                  <span className="hl-dots" />
                  quando a escola administra bem, o direito de aprender se fortalece
                </span>
                <h2>
                  Chegou a Conta,{" "}
                  <span className="hl-accent">Diretora!</span>
                </h2>
                <p className="hl-hero-desc">
                  Um lugar para entender como funcionam os recursos e programas da educação.
                </p>
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
                      <div className="hl-card-icon">
                        <card.Icon size={22} color={card.iconColor} strokeWidth={1.75} />
                      </div>
                      <h3>{card.title}</h3>
                      <p>{card.desc}</p>
                      <small>{card.small}</small>
                      {card.href === "/dashboard" && (
                        <div className="hl-remendo">ver minha escola</div>
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
                <strong>Dica do dia</strong>
                <p>
                  Comece pelo Painel da Escola — digite o código INEP e veja os dados em segundos.
                </p>
              </div>

              {/* Trilha */}
              <div className="hl-caderno-box">
                <div className="hl-trilha-header">
                  <h3>Trilha da Diretora</h3>
                  <span className="hl-trilha-badge">
                    {done}/{TRILHA_ITEMS.length}
                  </span>
                </div>
                <p className="hl-trilha-desc">
                  Marque cada etapa conforme for explorando a plataforma. Sua jornada fica salva automaticamente.
                </p>
                <Link href="/trilha" className="hl-remendo-jornada-wrap">
                  <div className="hl-remendo hl-remendo-jornada">começar a jornada</div>
                </Link>
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

        {/* ── Botão de acessibilidade flutuante ── */}
        <button
          className="hl-a11y-btn"
          onClick={toggleA11y}
          aria-label="Abrir menu de acessibilidade"
          title="Acessibilidade"
        >
          <SlidersHorizontal size={18} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
