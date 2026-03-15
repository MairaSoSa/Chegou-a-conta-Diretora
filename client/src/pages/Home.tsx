import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap, Scale, CalendarDays,
  Landmark, Wrench, BookOpen, type LucideIcon,
  SlidersHorizontal,
} from "lucide-react";
import { useAccessibility } from "../App";
import type { TrilhaUnit } from "@shared/schema";
import "./home-landing.css";


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
    desc: "Censo, IDEB, matrículas e repasses.",
    small: "",
    href: "/dashboard",
  },
  {
    color: "hl-pink",
    iconColor: "#a0425a",
    Icon: Scale,
    title: "Legislação",
    desc: "Leis, resoluções, portarias, instruções normativas e decretos.",
    small: "",
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
    desc: "PDDE e Ações Integradas",
    small: "",
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
    desc: "Pesquise, pergunte, anote e redija documentos escolares com ajuda da IA.",
    small: "",
    href: "/chat",
  },
];

export default function Home() {
  const { toggle: toggleA11y } = useAccessibility();
  const { data: trilhaUnits = [] } = useQuery<TrilhaUnit[]>({ queryKey: ["/api/trilha"] });

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
                  <span className="hl-tag">PDDE</span>
                  <span className="hl-tag">financiamento</span>
                  <span className="hl-tag">ferramentas</span>
                  <span className="hl-tag">políticas públicas</span>
                </div>
              </div>

              <p className="hl-mural-label">Por onde começar</p>
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
                <strong>Dica</strong>
                <p>
                  Comece pelo Painel da Escola. Se tiver dúvidas, procure o termo no Glossário ou siga a Trilha da Diretora.
                </p>
              </div>

              {/* Trilha */}
              <div className="hl-caderno-box">
                <div className="hl-trilha-header">
                  <h3>Trilha da Diretora</h3>
                  <Link href="/trilha" className="hl-trilha-ver-todas">
                    ver todas →
                  </Link>
                </div>
                <div className="hl-trilha-list">
                  {trilhaUnits.map((unit) => (
                    <Link
                      key={unit.unitId}
                      href={`/trilha/${unit.unitId}`}
                      className="hl-trilha-item"
                    >
                      <span className="hl-trilha-item-num">
                        {String(unit.sortOrder ?? unit.unitId.replace("U", "")).padStart(2, "0")}
                      </span>
                      <div className="hl-trilha-item-body">
                        <span className="hl-trilha-item-title">{unit.title}</span>
                        <span className="hl-trilha-item-sub">{unit.subtitle}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Rodapé ── */}
          <div className="hl-footer-strip">
            <span>Acesso livre para quem trabalha e acredita na escola pública.</span>
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
