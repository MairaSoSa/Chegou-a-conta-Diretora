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
  { id: "t1", label: "De onde vêm os recursos da escola", subtitle: "As principais fontes de financiamento da escola pública.", ementa: "Apresenta as diferentes fontes de recursos da escola pública, incluindo programas federais, repasses estaduais e municipais e outras formas de financiamento da educação." },
  { id: "t2", label: "Quais programas financiam a escola", subtitle: "Conhecendo os programas que apoiam o funcionamento da escola.", ementa: "Explica os principais programas educacionais que chegam às escolas, como PDDE, PNAE e PNATE, seus objetivos e como eles contribuem para o funcionamento da escola." },
  { id: "t3", label: "Como funciona o PDDE", subtitle: "O principal programa de repasse direto para escolas públicas.", ementa: "Apresenta o funcionamento do Programa Dinheiro Direto na Escola, suas modalidades, regras gerais e responsabilidades da escola na gestão dos recursos." },
  { id: "t4", label: "Como a escola se organiza para receber recursos", subtitle: "Estruturas administrativas necessárias para participar dos programas.", ementa: "Explica as estruturas administrativas que permitem que a escola participe dos programas educacionais e receba recursos financeiros." },
  { id: "t5", label: "O que é a unidade executora", subtitle: "A entidade responsável por administrar os recursos da escola.", ementa: "Apresenta o conceito de unidade executora, suas funções e sua importância para a gestão financeira da escola." },
  { id: "t6", label: "Quem administra os recursos da escola", subtitle: "Diretoria, conselho e responsabilidades na gestão.", ementa: "Explica quem são os responsáveis pela administração dos recursos da unidade executora e como ocorre a participação da comunidade escolar." },
  { id: "t7", label: "O estatuto da unidade executora", subtitle: "O documento que define regras e funcionamento da entidade.", ementa: "Apresenta o estatuto da unidade executora, seus objetivos e sua importância para o funcionamento institucional da entidade." },
  { id: "t8", label: "Documentos da escola no cartório", subtitle: "Registros que formalizam a unidade executora.", ementa: "Explica quais documentos precisam ser registrados em cartório, como estatuto e atas, e por que esses registros são importantes." },
  { id: "t9", label: "A conta bancária da escola", subtitle: "Onde ficam os recursos dos programas educacionais.", ementa: "Apresenta o funcionamento das contas bancárias vinculadas aos programas educacionais e sua importância na gestão financeira." },
  { id: "t10", label: "Quem pode movimentar a conta", subtitle: "Responsáveis e autorizações para movimentação financeira.", ementa: "Explica quem pode movimentar as contas da unidade executora e como essas autorizações são registradas no banco." },
  { id: "t11", label: "Quando os recursos chegam", subtitle: "Entendendo os repasses dos programas educacionais.", ementa: "Apresenta como funcionam os calendários de repasse dos programas e como a escola pode acompanhar a chegada dos recursos." },
  { id: "t12", label: "Como planejar o uso dos recursos", subtitle: "Definindo prioridades para melhorar a escola.", ementa: "Explica como planejar o uso dos recursos da escola considerando necessidades pedagógicas e administrativas." },
  { id: "t13", label: "O que pode ser pago com os recursos", subtitle: "Regras para utilização dos recursos dos programas.", ementa: "Apresenta as despesas permitidas pelos programas educacionais e as principais restrições relacionadas ao uso dos recursos." },
  { id: "t14", label: "Notas fiscais e comprovantes", subtitle: "Documentos necessários para registrar despesas.", ementa: "Explica os documentos fiscais utilizados para comprovar despesas e garantir a regularidade da gestão financeira." },
  { id: "t15", label: "Como organizar os documentos da escola", subtitle: "Gestão e arquivamento de documentos administrativos.", ementa: "Apresenta formas de organizar e arquivar documentos relacionados aos programas e à administração da escola." },
  { id: "t16", label: "Como funciona a prestação de contas", subtitle: "Demonstrando como os recursos foram utilizados.", ementa: "Explica o processo de prestação de contas dos programas educacionais e sua importância para a continuidade dos repasses." },
  { id: "t17", label: "Processos administrativos da escola", subtitle: "Registros formais de decisões e procedimentos institucionais.", ementa: "Apresenta o conceito de processos administrativos e sua importância para registrar decisões e procedimentos da escola." },
  { id: "t18", label: "Documentos oficiais da escola", subtitle: "Atas, ofícios e registros institucionais.", ementa: "Apresenta os principais documentos oficiais utilizados na administração escolar e suas funções." },
  { id: "t19", label: "Transparência e participação da comunidade", subtitle: "Controle social e acompanhamento da gestão escolar.", ementa: "Explica o papel do conselho escolar e da comunidade no acompanhamento dos recursos e decisões administrativas." },
  { id: "t20", label: "Transição entre diretores", subtitle: "Organizando a passagem de gestão da escola.", ementa: "Apresenta os cuidados necessários na transição administrativa entre diretoras e diretores para garantir continuidade na gestão." },
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
                  <span className="hl-trilha-badge">
                    {done}/{TRILHA_ITEMS.length}
                  </span>
                </div>
                <p className="hl-trilha-desc">
                  Aqui você pode escolher uma unidade da trilha ou percorrer o caminho de norte a sul.
                </p>
                <Link href="/trilha" className="hl-remendo-jornada-wrap">
                  <div className="hl-remendo hl-remendo-jornada">começar a jornada</div>
                </Link>
                <div className="hl-checklist">
                  {TRILHA_ITEMS.map(item => (
                    <div
                      key={item.id}
                      className={`hl-check-item${checks[item.id] ? " done" : ""}`}
                      style={{ marginBottom: 18 }}
                    >
                      <input
                        id={item.id}
                        type="checkbox"
                        checked={!!checks[item.id]}
                        onChange={() => toggleCheck(item.id)}
                      />
                      <label htmlFor={item.id} style={{ fontWeight: 700 }}>{item.label}</label>
                      {item.subtitle && (
                        <div style={{ fontSize: '.92em', color: '#587082', marginTop: 2, fontWeight: 500 }}>{item.subtitle}</div>
                      )}
                      {item.ementa && (
                        <div style={{ fontSize: '.86em', color: '#7a8a99', marginTop: 2 }}>{item.ementa}</div>
                      )}
                    </div>
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
