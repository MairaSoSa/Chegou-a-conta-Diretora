/**
 * Ícones desenhados à mão para o Chegou a Hora, Diretora!
 * Cada ícone é único, com traço orgânico e tom artístico.
 * viewBox 0 0 24 24 · stroke="currentColor" · fill="none"
 */
import React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };
export type ChegouIcon = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;
export type LucideIcon = ChegouIcon;

const mk = (children: React.ReactNode) =>
  React.forwardRef<SVGSVGElement, IconProps>(
    ({ size = 18, width, height, className, style, strokeWidth, ...p }, ref) => (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth ?? 1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        width={width ?? size}
        height={height ?? size}
        className={className}
        style={style}
        aria-hidden="true"
        {...p}
      >
        {children}
      </svg>
    )
  );

/* ─────────────────────────────────────────────────────────────
   NAVEGAÇÃO & ESTRUTURA
───────────────────────────────────────────────────────────── */

/* X — duas linhas que se cruzam com leve curvatura */
export const X = mk(
  <>
    <path d="M5 5.3 C8.5 8.5 11 10.5 19 18.7" />
    <path d="M19 5.3 C15.5 8.5 13 10.5 5 18.7" />
  </>
);

/* Menu hambúrguer — três traços irregulares, como rabisco */
export const Menu = mk(
  <>
    <path d="M4 7 C8 6.6 14 7.4 20 7" />
    <path d="M4 12 C9 11.5 15 12.5 20 12" />
    <path d="M4 17 C8 16.7 14 17.3 20 17" />
  </>
);

/* Chevrons com curvatura orgânica */
export const ChevronDown = mk(
  <path d="M5 9.5 C8 12.5 10.5 14.5 12 15 C13.5 14.5 16 12.5 19 9.5" />
);
export const ChevronUp = mk(
  <path d="M5 14.5 C8 11.5 10.5 9.5 12 9 C13.5 9.5 16 11.5 19 14.5" />
);
export const ChevronLeft = mk(
  <path d="M14.5 5 C11.5 8 9.5 10.5 9 12 C9.5 13.5 11.5 16 14.5 19" />
);
export const ChevronRight = mk(
  <path d="M9.5 5 C12.5 8 14.5 10.5 15 12 C14.5 13.5 12.5 16 9.5 19" />
);

/* Setas — com gesto de direção mais expressivo */
export const ArrowLeft = mk(
  <>
    <path d="M20 12 C16 11.7 10 12.3 4.5 12" />
    <path d="M9.5 7.5 C7 9.5 5 11 4.5 12 C5 13 7 14.5 9.5 16.5" />
  </>
);
export const ArrowRight = mk(
  <>
    <path d="M4 12 C8 11.7 14 12.3 19.5 12" />
    <path d="M14.5 7.5 C17 9.5 19 11 19.5 12 C19 13 17 14.5 14.5 16.5" />
  </>
);

/* Link externo — janela com seta que "escapa" */
export const ExternalLink = mk(
  <>
    <path d="M18.5 13.5 C18.5 17 18 19 16.5 19.5 C14 20 8.5 20 6 19.5 C4 19 3.5 17 3.5 14.5 C3.5 12 3.5 9 3.5 7.5 C3.5 5.5 5 5 7 5 C8.5 5 10.5 5 12 5" />
    <path d="M14 3.5 L20.5 3.5 L20.5 10" />
    <path d="M11.5 12.5 C13.5 10.5 17 7 20.5 3.5" />
  </>
);

export const MoreHorizontal = mk(
  <>
    <circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </>
);

export const GripVertical = mk(
  <>
    <circle cx="9" cy="6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="18" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="18" r="1.1" fill="currentColor" stroke="none" />
  </>
);

export const Dot = mk(
  <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
);

export const Circle = mk(
  <path d="M12 3 C17 3 21 7 21 12 C21 17 17 21 12 21 C7 21 3 17 3 12 C3 7 7 3 12 3 Z" />
);

export const PanelLeftIcon = mk(
  <>
    <rect x="2.5" y="3" width="19" height="18" rx="2.5" />
    <path d="M8.5 3 C8.5 8 8.5 15 8.5 21" />
  </>
);

/* ─────────────────────────────────────────────────────────────
   BUSCA & FILTRO
───────────────────────────────────────────────────────────── */

/* Lupa — cabo levemente curvado, anel não perfeitamente circular */
export const Search = mk(
  <>
    <path d="M10.5 4.5 C14.5 4 17.5 7 17.5 10.5 C17.5 14.2 14.5 17 10.5 17 C6.8 17 4 14.2 4 10.5 C4 7 6.8 4.5 10.5 4.5 Z" />
    <path d="M15.5 15.8 C16.5 16.8 18.5 18.8 20.5 20.8" />
  </>
);

/* Filtro — funil com traços horizontais no interior */
export const Filter = mk(
  <>
    <path d="M3.5 5.5 C8 5 16 5 20.5 5.5 L14.5 12.5 L14.5 18.5 L9.5 21 L9.5 12.5 Z" />
  </>
);

/* ─────────────────────────────────────────────────────────────
   EDUCAÇÃO
───────────────────────────────────────────────────────────── */

/* Escola — prédio com telhado, porta central e janelas expressivas */
export const School = mk(
  <>
    <path d="M2.5 10.5 C6 8 9.5 5.5 12 4 C14.5 5.5 18 8 21.5 10.5" />
    <path d="M4 10.5 L4 20.5 L20 20.5 L20 10.5" />
    <rect x="9.5" y="14" width="5" height="6.5" rx="0.5" />
    <rect x="5.5" y="12.5" width="3" height="3" rx="0.5" />
    <rect x="15.5" y="12.5" width="3" height="3" rx="0.5" />
    <path d="M12 4 L12 7" />
    <path d="M10.5 5.5 L13.5 5.5" />
  </>
);

/* Capelo — com borla que cai levemente, linha mais expressiva */
export const GraduationCap = mk(
  <>
    <path d="M2.5 10.5 L12 5.5 L21.5 10.5 L12 15.5 Z" />
    <path d="M6.5 12.8 C6.5 15.5 6.5 18 6.5 19.5 C8 20.5 10 21.5 12 21.5 C14 21.5 16 20.5 17.5 19.5 L17.5 12.8" />
    <path d="M21.5 10.5 L21.5 15.5" />
    <path d="M20 15.5 C20 17 21.5 17.5 21.5 18.5 C21.5 17.5 23 17 23 15.5" strokeWidth={1.2} />
  </>
);

/* Livro aberto — com páginas que se curvam levemente */
export const BookOpen = mk(
  <>
    <path d="M12 5.5 C10 4.5 7 4 4 4.5 C3 4.7 2.5 5.2 2.5 6 L2.5 20 C5.5 19.5 8.5 19.5 12 20.5 C15.5 19.5 18.5 19.5 21.5 20 L21.5 6 C21.5 5.2 21 4.7 20 4.5 C17 4 14 4.5 12 5.5 Z" />
    <path d="M12 5.5 L12 20.5" />
    <path d="M6 8.5 C7.5 8.2 9 8.2 10.5 8.5" strokeWidth={1.2} />
    <path d="M6 11.5 C7.5 11.2 9 11.2 10.5 11.5" strokeWidth={1.2} />
    <path d="M13.5 8.5 C15 8.2 16.5 8.2 18 8.5" strokeWidth={1.2} />
  </>
);

/* Livro marcado — com sinaleira saindo do topo */
export const BookMarked = mk(
  <>
    <path d="M5 3.5 C5 3.5 19 3.5 19 3.5 L19 21.5 L12 17.5 L5 21.5 Z" />
    <path d="M9 3.5 L9 10 L12 8.5 L15 10 L15 3.5" strokeWidth={1.2} />
  </>
);

export const BookText = mk(
  <>
    <path d="M5 3.5 C5 3 19 3 19 3.5 L19 21 L12 17 L5 21 Z" />
    <path d="M8.5 9 L15.5 9" />
    <path d="M8.5 12 L15.5 12" />
    <path d="M8.5 15 L13 15" />
  </>
);

/* Livro aberto com check — conclusão de leitura */
export const BookOpenCheck = mk(
  <>
    <path d="M12 5.5 C10 4.5 7 4 4 4.5 C3 4.7 2.5 5.2 2.5 6 L2.5 20 C5.5 19.5 8.5 19.5 12 20.5 C15.5 19.5 18.5 19.5 21.5 20 L21.5 6 C21.5 5.2 21 4.7 20 4.5 C17 4 14 4.5 12 5.5 Z" />
    <path d="M12 5.5 L12 20.5" />
    <path d="M14 10 L16 12.5 L20 8" />
  </>
);

/* Medalha — círculo superior + fita que se abre na base */
export const Award = mk(
  <>
    <circle cx="12" cy="8.5" r="5.5" />
    <path d="M8.5 13.5 L7 22 L12 19.5 L17 22 L15.5 13.5" />
    <path d="M10 7.5 L11.5 9.5 L15 6.5" />
  </>
);

/* Gráfico de barras — três barras com alturas distintas e base */
export const BarChart3 = mk(
  <>
    <path d="M3.5 20.5 L3.5 12.5 C3.5 12 4 11.5 4.5 11.5 L7 11.5 C7.5 11.5 8 12 8 12.5 L8 20.5" />
    <path d="M10 20.5 L10 7 C10 6.5 10.5 6 11 6 L13 6 C13.5 6 14 6.5 14 7 L14 20.5" />
    <path d="M16 20.5 L16 3.5 C16 3 16.5 2.5 17 2.5 L19.5 2.5 C20 2.5 20.5 3 20.5 3.5 L20.5 20.5" />
    <path d="M2 20.5 L22 20.5" />
  </>
);

/* Tendência crescente — linha com seta final no alto */
export const TrendingUp = mk(
  <>
    <path d="M3 17 C6 15 8 14.5 11 13.5 C13.5 12.5 16 10 20.5 6.5" />
    <path d="M15.5 6.5 L20.5 6.5 L20.5 11.5" />
  </>
);

/* ─────────────────────────────────────────────────────────────
   PESSOAS
───────────────────────────────────────────────────────────── */

/* Duas pessoas — com cabeças e corpos ligeiramente assimétricos */
export const Users = mk(
  <>
    <path d="M1.5 21 C1.5 21 1.5 19 1.5 18 C1.5 15.5 3.5 14 5.5 13.5 C7 13 9 13 10.5 13.5 C12 14 13.5 15.5 13.5 18 L13.5 21" />
    <circle cx="7.5" cy="8" r="4" />
    <path d="M16 13.5 C18 13 19.5 13.5 21 14.5 C22.5 15.5 22.5 17 22.5 19 L22.5 21" />
    <path d="M14 3.5 C16 3 18 4.5 18 7 C18 9.5 16 11 14.5 11" />
  </>
);

/* Pessoa singular */
export const User = mk(
  <>
    <path d="M12 4 C14.5 4 16 5.5 16 8 C16 10.5 14.5 12 12 12 C9.5 12 8 10.5 8 8 C8 5.5 9.5 4 12 4 Z" />
    <path d="M4 21 C4 17.5 7.5 14.5 12 14.5 C16.5 14.5 20 17.5 20 21" />
  </>
);

/* Coração — assimétrico, como desenhado a mão */
export const Heart = mk(
  <path d="M12 20.5 C10 18.5 4.5 15 3 11.5 C1.5 8 3.5 4.5 6.5 4 C9 3.5 11 5 12 6.5 C13 5 15 3.5 17.5 4 C20.5 4.5 22.5 8 21 11.5 C19.5 15 14 18.5 12 20.5 Z" />
);

/* Robô/Bot de IA — com antena e expressão */
export const Bot = mk(
  <>
    <path d="M6.5 9 C6.5 7.5 7.5 7 8.5 7 L15.5 7 C16.5 7 17.5 7.5 17.5 9 L17.5 19 C17.5 20 16.5 20.5 15.5 20.5 L8.5 20.5 C7.5 20.5 6.5 20 6.5 19 Z" />
    <path d="M12 7 L12 4.5" />
    <circle cx="12" cy="3.5" r="1.2" />
    <path d="M9.5 13 L9.5 13.5" strokeWidth={2.5} />
    <path d="M14.5 13 L14.5 13.5" strokeWidth={2.5} />
    <path d="M9.5 17 C10.5 18 13.5 18 14.5 17" />
    <path d="M3 12.5 L6.5 12.5" />
    <path d="M17.5 12.5 L21 12.5" />
  </>
);

/* Aperto de mãos */
export const Handshake = mk(
  <>
    <path d="M2.5 14 L6 10.5 L9 10.5 L12 8 L15 10.5 L18 10.5 L21.5 14" />
    <path d="M6 10.5 C6 12 5 13 4 14.5 C3.5 15.5 3 17 4 17.5 C5 18 6.5 17 7.5 16" />
    <path d="M18 10.5 C18 12 19 13 20 14.5 C20.5 15.5 21 17 20 17.5 C19 18 17.5 17 16.5 16" />
    <path d="M9 10.5 L9 8 L7.5 6.5" />
    <path d="M15 10.5 L15 8 L16.5 6.5" />
    <path d="M7.5 16 C9 17.5 11 19 12 19.5 C13 19 15 17.5 16.5 16" />
  </>
);

/* ─────────────────────────────────────────────────────────────
   LOCALIZAÇÃO & LUGAR
───────────────────────────────────────────────────────────── */

/* Mapa — gota com ponto interior, linha base assimétrica */
export const MapPin = mk(
  <>
    <path d="M12 2.5 C8 2.5 5 5.5 5 9.5 C5 14.5 10 18.5 12 21 C14 18.5 19 14.5 19 9.5 C19 5.5 16 2.5 12 2.5 Z" />
    <circle cx="12" cy="9.5" r="3" />
  </>
);

/* Globo — com meridianos desenhados como linhas a mão */
export const Globe = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12 C7 11.5 17 11.5 21 12" />
    <path d="M3 8 C6 7.5 9 8 12 7.5 C15 7 18 7.5 21 8" />
    <path d="M3 16 C6 15.5 9 16 12 16.5 C15 17 18 16.5 21 16" />
    <path d="M12 3 C10.5 5.5 9.5 8.5 9.5 12 C9.5 15.5 10.5 18.5 12 21" />
    <path d="M12 3 C13.5 5.5 14.5 8.5 14.5 12 C14.5 15.5 13.5 18.5 12 21" />
  </>
);

/* Prédio simples */
export const Building = mk(
  <>
    <path d="M3.5 21 L3.5 5 C3.5 4 4 3.5 5 3.5 L19 3.5 C20 3.5 20.5 4 20.5 5 L20.5 21" />
    <path d="M2 21 L22 21" />
    <rect x="7" y="7" width="3" height="3" rx="0.5" />
    <rect x="14" y="7" width="3" height="3" rx="0.5" />
    <rect x="7" y="13" width="3" height="3" rx="0.5" />
    <rect x="14" y="13" width="3" height="3" rx="0.5" />
    <path d="M10 21 L10 16.5 C10 16 10.5 15.5 11 15.5 L13 15.5 C13.5 15.5 14 16 14 16.5 L14 21" />
  </>
);

/* Prédio com telhado tipo prefeitura */
export const Building2 = mk(
  <>
    <path d="M3 21 L3 11 L12 4 L21 11 L21 21" />
    <path d="M2 21 L22 21" />
    <rect x="8" y="13" width="3.5" height="3.5" rx="0.5" />
    <rect x="12.5" y="13" width="3.5" height="3.5" rx="0.5" />
    <path d="M10 21 L10 18 C10 17.5 10.5 17 11 17 L13 17 C13.5 17 14 17.5 14 18 L14 21" />
    <path d="M12 4 L12 8" />
  </>
);

/* Marco histórico / patrimônio — colunas e frontão */
export const Landmark = mk(
  <>
    <path d="M2 21 L22 21" />
    <path d="M2 11 L22 11" />
    <path d="M12 3.5 C8.5 5.5 5.5 8 3 11 L21 11 C18.5 8 15.5 5.5 12 3.5 Z" />
    <line x1="5" y1="11" x2="5" y2="21" />
    <line x1="9" y1="11" x2="9" y2="21" />
    <line x1="13" y1="11" x2="13" y2="21" />
    <line x1="17" y1="11" x2="17" y2="21" />
    <line x1="21" y1="11" x2="21" y2="21" />
  </>
);

/* Pinheiro — silhueta orgânica, tronco visível */
export const TreePine = mk(
  <>
    <path d="M12 3 C11 5 8 8 6 10 L9.5 10 C8 12 5.5 15 4 17 L8.5 17 C7 19 5.5 20.5 5 21 L19 21 C18.5 20.5 17 19 15.5 17 L19.5 17 C18.5 15 16 12 14.5 10 L18 10 C16 8 13 5 12 3 Z" />
  </>
);

/* Alfinete — para calendário/marcação */
export const Pin = mk(
  <>
    <path d="M12 21.5 C12 21.5 7 17 7 12 C7 8.7 9.2 6.5 12 6.5 C14.8 6.5 17 8.7 17 12 C17 17 12 21.5 12 21.5 Z" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M12 6.5 L12 3" />
    <path d="M9.5 3 L14.5 3" />
  </>
);

/* ─────────────────────────────────────────────────────────────
   FINANÇAS
───────────────────────────────────────────────────────────── */

/* Cifrao — S ondulado com linha dupla */
export const DollarSign = mk(
  <>
    <path d="M12 2 L12 22" />
    <path d="M16.5 6.5 C16.5 5 15 4.5 12 4.5 C9 4.5 7.5 5.5 7.5 7.5 C7.5 10.5 16.5 10.5 16.5 14 C16.5 16.5 15 17.5 12 17.5 C9 17.5 7.5 16.5 7.5 15" />
  </>
);

/* Carteira — com abertura superior e bolso interno */
export const Wallet = mk(
  <>
    <path d="M2.5 8.5 C2.5 7 3.5 6 5 5.5 L17.5 5.5 C19.5 5.5 21.5 6.5 21.5 8.5 L21.5 17.5 C21.5 19.5 19.5 20.5 17.5 20.5 L5 20.5 C3.5 20.5 2.5 19.5 2.5 17.5 Z" />
    <path d="M15.5 13 C15.5 11.5 16.5 11 17.5 11 L21.5 11 L21.5 15.5 L17.5 15.5 C16.5 15.5 15.5 15 15.5 13.5 Z" />
    <circle cx="17.5" cy="13.2" r="1" fill="currentColor" stroke="none" />
    <path d="M6 5.5 C6 5 6 4 6 3.5 C6 3 6.5 2.5 7.5 2.5 C9 2.5 9.5 3 9.5 4 C9.5 4.5 9.5 5 9.5 5.5" />
  </>
);

/* Cédula — retângulo com medalhão central e detalhes de segurança */
export const BanknoteIcon = mk(
  <>
    <path d="M2 7.5 C2 6.5 2.5 6 3.5 6 L20.5 6 C21.5 6 22 6.5 22 7.5 L22 16.5 C22 17.5 21.5 18 20.5 18 L3.5 18 C2.5 18 2 17.5 2 16.5 Z" />
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 10 L12 14" strokeWidth={1.2} />
    <path d="M10 12 L14 12" strokeWidth={1.2} />
    <path d="M4 8 L4 10" />
    <path d="M20 8 L20 10" />
    <path d="M4 14 L4 16" />
    <path d="M20 14 L20 16" />
  </>
);

export const Banknote = BanknoteIcon;

/* Moedas empilhadas */
export const Coins = mk(
  <>
    <ellipse cx="9" cy="15.5" rx="5.5" ry="2" />
    <path d="M3.5 15.5 L3.5 18.5 C3.5 19.5 6 20.5 9 20.5 C12 20.5 14.5 19.5 14.5 18.5 L14.5 15.5" />
    <ellipse cx="15" cy="9" rx="5.5" ry="2" />
    <path d="M9.5 9 C9.5 10 12 11 15 11 C18 11 20.5 10 20.5 9 L20.5 12 C20.5 13 18 14 15 14 C12.5 14 10.5 13.2 9.8 12.2" />
    <path d="M3.5 12.5 L3.5 15.5" />
  </>
);

/* Cifrão num círculo */
export const CircleDollarSign = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6.5 L12 17.5" />
    <path d="M15 9.5 C15 8.5 14 8 12 8 C10 8 9 8.7 9 10 C9 11.5 12 12 15 13.5 C15 15 14 15.5 12 15.5 C10 15.5 9 15 9 14" />
  </>
);

/* Cofrinho */
export const PiggyBank = mk(
  <>
    <path d="M12 7.5 C8.5 7.5 5.5 9 5.5 13 C5.5 17 8.5 18.5 12 18.5 C15.5 18.5 18.5 17 18.5 13 C18.5 9 15.5 7.5 12 7.5 Z" />
    <path d="M18.5 13 L21 12 C21.5 11.5 21 10.5 20 11 L18.5 11.5" />
    <path d="M12 7.5 L12 5.5" />
    <path d="M10 5.5 L14 5.5" />
    <path d="M9 17.5 L7.5 21" />
    <path d="M15 17.5 L16.5 21" />
    <circle cx="15.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <path d="M9.5 11 L10.5 9.5" strokeWidth={1.2} />
  </>
);

/* Cartão de crédito */
export const CreditCard = mk(
  <>
    <path d="M2.5 7 C2.5 6 3 5.5 4 5.5 L20 5.5 C21 5.5 21.5 6 21.5 7 L21.5 17 C21.5 18 21 18.5 20 18.5 L4 18.5 C3 18.5 2.5 18 2.5 17 Z" />
    <path d="M2.5 10 L21.5 10" />
    <path d="M6 14.5 L10 14.5" />
    <rect x="14" y="13.5" width="5" height="2.5" rx="1" />
  </>
);

/* Recibo — papel com cantos irregulares de corte */
export const Receipt = mk(
  <>
    <path d="M4 3 L20 3 L20 21 L18 19.5 L16 21 L14 19.5 L12 21 L10 19.5 L8 21 L6 19.5 L4 21 Z" />
    <path d="M8 8 L16 8" />
    <path d="M8 11.5 L16 11.5" />
    <path d="M8 15 L13 15" />
  </>
);

/* ─────────────────────────────────────────────────────────────
   DOCUMENTOS & TEXTO
───────────────────────────────────────────────────────────── */

/* Documento com dobra — canto dobrado expressivo */
export const FileText = mk(
  <>
    <path d="M5 3 L14.5 3 L19.5 8 L19.5 21.5 C19.5 22 19 22.5 18.5 22.5 L5.5 22.5 C5 22.5 4.5 22 4.5 21.5 L4.5 3.5 C4.5 3 5 3 5 3 Z" />
    <path d="M14.5 3 C14.5 5.5 14.5 8 14.5 8 L19.5 8" />
    <path d="M8 13 L16 13" />
    <path d="M8 16.5 L14 16.5" />
    <path d="M8 9.5 L11 9.5" />
  </>
);

/* Documento com check */
export const FileCheck = mk(
  <>
    <path d="M5 3 L14.5 3 L19.5 8 L19.5 21.5 C19.5 22 19 22.5 18.5 22.5 L5.5 22.5 C5 22.5 4.5 22 4.5 21.5 L4.5 3.5 C4.5 3 5 3 5 3 Z" />
    <path d="M14.5 3 L14.5 8 L19.5 8" />
    <path d="M8 14.5 L10.5 17 L16 11.5" />
  </>
);

/* Documento com assinatura ondulada */
export const FileSignature = mk(
  <>
    <path d="M5 3 L14.5 3 L19.5 8 L19.5 21.5 C19.5 22 19 22.5 18.5 22.5 L5.5 22.5 C5 22.5 4.5 22 4.5 21.5 L4.5 3.5 C4.5 3 5 3 5 3 Z" />
    <path d="M14.5 3 L14.5 8 L19.5 8" />
    <path d="M7.5 17.5 C9 15.5 10 17.5 11 17.5 C12 17.5 13 15.5 14.5 17.5" />
    <path d="M7 20 L15 20" />
  </>
);

/* Pasta de arquivos */
export const Folder = mk(
  <>
    <path d="M2.5 8 C2.5 6.5 3 6 4.5 6 L10 6 L11.5 8 L20 8 C21 8 21.5 8.5 21.5 9.5 L21.5 19.5 C21.5 20.5 21 21 20 21 L4.5 21 C3.5 21 2.5 20.5 2.5 19.5 Z" />
  </>
);

/* Clipe de papel — em espiral mais expressiva */
export const Paperclip = mk(
  <path d="M20.5 11.5 L10 22 C8 24 4.5 23 3.5 21 C2 18.5 3 15.5 5 13.5 L15 3.5 C17 1.5 20.5 2 21.5 4.5 C22.5 7.5 21 10 19 12 L9 22" />
);

/* Clipboard com lista */
export const ClipboardList = mk(
  <>
    <path d="M9 4 C9 3.5 9.5 3 10 3 L14 3 C14.5 3 15 3.5 15 4 L15 5 L9 5 Z" />
    <path d="M7.5 4 L5.5 4 C4.5 4 4 4.5 4 5.5 L4 20.5 C4 21.5 4.5 22 5.5 22 L18.5 22 C19.5 22 20 21.5 20 20.5 L20 5.5 C20 4.5 19.5 4 18.5 4 L16.5 4" />
    <path d="M8 10.5 L16 10.5" />
    <path d="M8 14 L16 14" />
    <path d="M8 17.5 L12 17.5" />
  </>
);

/* Cópia para clipboard */
export const ClipboardCopy = mk(
  <>
    <path d="M9 4 C9 3.5 9.5 3 10 3 L14 3 C14.5 3 15 3.5 15 4 L15 5 L9 5 Z" />
    <path d="M7.5 4 L5.5 4 C4.5 4 4 4.5 4 5.5 L4 16 C4 17 4.5 17.5 5.5 17.5 L10.5 17.5" />
    <path d="M11 13.5 C11 12.5 11.5 12 12.5 12 L19.5 12 C20.5 12 21 12.5 21 13.5 L21 21 C21 22 20.5 22.5 19.5 22.5 L12.5 22.5 C11.5 22.5 11 22 11 21 Z" />
    <path d="M14 12 L14 10 L19 10 L19 12" />
  </>
);

/* Download — seta que desce e bate no chão */
export const Download = mk(
  <>
    <path d="M12 3.5 L12 16" />
    <path d="M7.5 12 C9 14.5 10.5 16.5 12 16.5 C13.5 16.5 15 14.5 16.5 12" />
    <path d="M4 20.5 C8 20 16 20 20 20.5" />
  </>
);

/* Upload — seta que sobe */
export const Upload = mk(
  <>
    <path d="M12 20.5 L12 8" />
    <path d="M7.5 12 C9 9.5 10.5 7.5 12 7.5 C13.5 7.5 15 9.5 16.5 12" />
    <path d="M4 20.5 C8 20 16 20 20 20.5" />
  </>
);

/* Envelope de carta */
export const Mail = mk(
  <>
    <path d="M3 6.5 C3 5.5 3.5 5 4.5 5 L19.5 5 C20.5 5 21 5.5 21 6.5 L21 17.5 C21 18.5 20.5 19 19.5 19 L4.5 19 C3.5 19 3 18.5 3 17.5 Z" />
    <path d="M3 7 C6 10 9.5 12.5 12 13 C14.5 12.5 18 10 21 7" />
  </>
);

/* Favorito / marcador */
export const Bookmark = mk(
  <path d="M6 3.5 C6 3 6.5 2.5 7 2.5 L17 2.5 C17.5 2.5 18 3 18 3.5 L18 21 L12 17 L6 21 Z" />
);

/* Caneta artística */
export const PenTool = mk(
  <>
    <path d="M12 19 L3.5 21.5 L6 13 L19 3.5 C20 3 21 3.5 21.5 4.5 C22 5.5 21.5 6.5 20.5 7 Z" />
    <path d="M12 19 L9 16" />
    <path d="M6 13 L9 16" />
    <path d="M18 4.5 L20.5 7" />
    <circle cx="4.5" cy="20.5" r="1" fill="currentColor" stroke="none" />
  </>
);

/* Caneta de linha fina */
export const PenLine = mk(
  <>
    <path d="M4 21 L21 21" />
    <path d="M16.5 3.5 C17.5 2.5 19.5 2.5 20.5 3.5 C21.5 4.5 21.5 6.5 20.5 7.5 L7 21 L3 22 L4 18 Z" />
    <path d="M15 5 L19.5 9.5" strokeWidth={1.2} />
  </>
);

/* Lápis */
export const Pencil = mk(
  <>
    <path d="M18 3 C19 2 21 2 22 3 C23 4 23 6 22 7 L8 21 L3.5 22.5 L5 18 Z" />
    <path d="M16.5 4.5 L21 9" strokeWidth={1.2} />
    <path d="M5 18 L8 21" />
  </>
);

/* Enviar mensagem */
export const Send = mk(
  <>
    <path d="M21.5 2.5 L10.5 13.5" />
    <path d="M21.5 2.5 L14.5 21.5 L10.5 13.5 L2.5 9.5 Z" />
  </>
);

/* ─────────────────────────────────────────────────────────────
   STATUS & ALERTAS
───────────────────────────────────────────────────────────── */

/* Triângulo de alerta — levemente inclinado, mais orgânico */
export const AlertTriangle = mk(
  <>
    <path d="M10.5 4 C10.8 3 11.5 2.5 12 2.5 C12.5 2.5 13.2 3 13.5 4 L21.5 19 C21.8 20 21.5 21 20 21 L4 21 C2.5 21 2.2 20 2.5 19 Z" />
    <path d="M12 9.5 L12 14.5" />
    <circle cx="12" cy="17.5" r="1" fill="currentColor" stroke="none" />
  </>
);

/* Círculo de alerta */
export const AlertCircle = mk(
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 7.5 L12 13" />
    <circle cx="12" cy="16" r="1.1" fill="currentColor" stroke="none" />
  </>
);

export const CircleAlert = AlertCircle;

/* Badge de alerta — estrela de 8 pontas */
export const BadgeAlert = mk(
  <>
    <path d="M12 2.5 L14.5 5 L18 5 L18 8.5 L20.5 11 L18 13.5 L18 17 L14.5 17 L12 19.5 L9.5 17 L6 17 L6 13.5 L3.5 11 L6 8.5 L6 5 L9.5 5 Z" />
    <path d="M12 7.5 L12 12" />
    <circle cx="12" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
  </>
);

/* Check circular — checkmark levemente artístico */
export const CheckCircle = mk(
  <>
    <path d="M12 2.5 C17.5 2.5 21.5 6.5 21.5 12 C21.5 17.5 17.5 21.5 12 21.5 C6.5 21.5 2.5 17.5 2.5 12 C2.5 6.5 6.5 2.5 12 2.5 Z" />
    <path d="M8 12 C9.5 13.5 11 15.5 12 16 C13.5 14 16 10.5 17 8.5" />
  </>
);

export const CheckCircle2 = CheckCircle;

/* Simples checkmark */
export const Check = mk(
  <path d="M4.5 12 C6.5 14 9.5 17 11 17.5 C13 15.5 17.5 9 19.5 6.5" />
);

/* Caixa com check */
export const CheckSquare = mk(
  <>
    <path d="M3.5 5 C3.5 4 4 3.5 5 3.5 L19 3.5 C20 3.5 20.5 4 20.5 5 L20.5 19 C20.5 20 20 20.5 19 20.5 L5 20.5 C4 20.5 3.5 20 3.5 19 Z" />
    <path d="M8 12 L10.5 15 L16.5 8.5" />
  </>
);

/* Escudo */
export const Shield = mk(
  <path d="M12 3 C12 3 7 5 4.5 6.5 L4.5 13.5 C4.5 18 8 21 12 22 C16 21 19.5 18 19.5 13.5 L19.5 6.5 C17 5 12 3 12 3 Z" />
);

/* Escudo com check */
export const ShieldCheck = mk(
  <>
    <path d="M12 3 C12 3 7 5 4.5 6.5 L4.5 13.5 C4.5 18 8 21 12 22 C16 21 19.5 18 19.5 13.5 L19.5 6.5 C17 5 12 3 12 3 Z" />
    <path d="M8.5 12.5 L11 15 L16 10" />
  </>
);

/* Informação */
export const Info = mk(
  <>
    <circle cx="12" cy="12" r="9.5" />
    <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
    <path d="M10.5 11 L12 11 L12 16.5" />
    <path d="M10.5 16.5 L13.5 16.5" />
  </>
);

/* Ponto de interrogação */
export const HelpCircle = mk(
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M9.5 9 C9.5 7 10.5 6.5 12 6.5 C13.5 6.5 14.5 7.5 14.5 9 C14.5 11 12 11.5 12 13.5" />
    <circle cx="12" cy="16.5" r="1.1" fill="currentColor" stroke="none" />
  </>
);

/* ─────────────────────────────────────────────────────────────
   AÇÕES & CONTROLES
───────────────────────────────────────────────────────────── */

/* Mais / adicionar */
export const Plus = mk(
  <>
    <path d="M12 4.5 C12 8 12 14 12 19.5" />
    <path d="M4.5 12 C8 12 14 12 19.5 12" />
  </>
);

/* Lixeira — com listras no balde */
export const Trash2 = mk(
  <>
    <path d="M3.5 7 L20.5 7" />
    <path d="M8.5 7 L8.5 4.5 C8.5 4 9 3.5 9.5 3.5 L14.5 3.5 C15 3.5 15.5 4 15.5 4.5 L15.5 7" />
    <path d="M5.5 7 L6.5 20 C6.5 21 7 21.5 8 21.5 L16 21.5 C17 21.5 17.5 21 17.5 20 L18.5 7" />
    <path d="M10 11 L10 18" />
    <path d="M14 11 L14 18" />
  </>
);

/* Disquete / salvar */
export const Save = mk(
  <>
    <path d="M4.5 3.5 L19.5 3.5 C20 3.5 20.5 4 20.5 4.5 L20.5 19.5 C20.5 20 20 20.5 19.5 20.5 L4.5 20.5 C4 20.5 3.5 20 3.5 19.5 L3.5 4.5 C3.5 4 4 3.5 4.5 3.5 Z" />
    <path d="M8 3.5 L8 9.5 L15.5 9.5 L15.5 3.5" />
    <path d="M12.5 3.5 L12.5 6.5" strokeWidth={1.2} />
    <path d="M7 13.5 C7 13 7.5 12.5 8 12.5 L16 12.5 C16.5 12.5 17 13 17 13.5 L17 20.5 L7 20.5 Z" />
  </>
);

/* Atualizar — seta circular */
export const RefreshCw = mk(
  <>
    <path d="M4 12 C4 7.5 7.5 4 12 4 C15 4 17.5 5.5 19 8" />
    <path d="M20 12 C20 16.5 16.5 20 12 20 C9 20 6.5 18.5 5 16" />
    <path d="M19 4.5 L19 8.5 L15.5 8.5" />
    <path d="M5 15.5 L5 19.5 L8.5 19.5" />
  </>
);

/* Cadeado */
export const Lock = mk(
  <>
    <path d="M5.5 11.5 L5.5 19.5 C5.5 20.5 6 21 7 21 L17 21 C18 21 18.5 20.5 18.5 19.5 L18.5 11.5 C18.5 10.5 18 10 17 10 L7 10 C6 10 5.5 10.5 5.5 11.5 Z" />
    <path d="M8.5 10 L8.5 7 C8.5 4.5 10 3 12 3 C14 3 15.5 4.5 15.5 7 L15.5 10" />
    <path d="M12 14.5 L12 17" />
    <circle cx="12" cy="14" r="1.8" />
  </>
);

/* Sair / LogOut */
export const LogOut = mk(
  <>
    <path d="M10 5.5 L5.5 5.5 C4.5 5.5 4 6 4 7 L4 17 C4 18 4.5 18.5 5.5 18.5 L10 18.5" />
    <path d="M16.5 8.5 L20.5 12 L16.5 15.5" />
    <path d="M20.5 12 L9.5 12" />
  </>
);

/* Configurações — engrenagem com dentes alternados */
export const Settings = mk(
  <>
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 2 L12 5 M12 19 L12 22 M2 12 L5 12 M19 12 L22 12" strokeWidth={2} />
    <path d="M4.9 4.9 L7.1 7.1 M16.9 16.9 L19.1 19.1 M19.1 4.9 L16.9 7.1 M7.1 16.9 L4.9 19.1" strokeWidth={2} />
  </>
);

/* Negrito */
export const Bold = mk(
  <path d="M7 4.5 L14 4.5 C16.5 4.5 17.5 5.5 17.5 7.5 C17.5 9.5 16.5 10.5 14.5 10.5 L7 10.5 L7 4.5 Z M7 10.5 L15 10.5 C17.5 10.5 18.5 12 18.5 14 C18.5 16.5 17 17.5 14.5 17.5 L7 17.5 Z" />
);

/* Itálico */
export const Italic = mk(
  <>
    <line x1="10" y1="4.5" x2="15" y2="4.5" />
    <line x1="9" y1="19.5" x2="14" y2="19.5" />
    <path d="M14 4.5 C13 8 11.5 14 10 19.5" />
  </>
);

/* Sublinhado */
export const Underline = mk(
  <>
    <path d="M7 4.5 L7 12 C7 15.5 9 17.5 12 17.5 C15 17.5 17 15.5 17 12 L17 4.5" />
    <path d="M4.5 21 C7.5 20.5 16 20.5 19.5 21" />
  </>
);

/* Marcador de texto */
export const Highlighter = mk(
  <>
    <path d="M9.5 12 L16 5.5 C17 4.5 18.5 4.5 19.5 5.5 C20.5 6.5 20.5 8 19.5 9 L13 15.5 Z" />
    <path d="M9.5 12 C8 13 7 15 7 16.5 L10.5 16.5 L13 15.5" />
    <path d="M4 21 C7 20.5 15 20.5 20 21" />
  </>
);

/* Lista simples */
export const List = mk(
  <>
    <circle cx="5.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
    <path d="M9.5 7.5 L20 7.5" />
    <circle cx="5.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <path d="M9.5 12 L20 12" />
    <circle cx="5.5" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
    <path d="M9.5 16.5 L20 16.5" />
  </>
);

/* Lista ordenada */
export const ListOrdered = mk(
  <>
    <path d="M4.5 5.5 L4.5 10" />
    <path d="M3.5 10 L5.5 10" />
    <path d="M3.5 13.5 C3.5 13 4 12.5 5 12.5 C6 12.5 6.5 13 6.5 13.5 C6.5 14.5 3.5 16.5 3.5 17.5 L6.5 17.5" />
    <path d="M9.5 7.5 L20 7.5" />
    <path d="M9.5 12 L20 12" />
    <path d="M9.5 16.5 L20 16.5" />
  </>
);

/* Cabeçalho H2 */
export const Heading2 = mk(
  <>
    <path d="M4 4.5 L4 19.5" />
    <path d="M4 12 L13 12" />
    <path d="M13 4.5 L13 19.5" />
    <path d="M16 16 C16 14.5 17 13.5 18.5 13.5 C20 13.5 21 14.5 21 16 C21 17.5 16 19 16 20 L21 20" />
  </>
);

/* Verificação ortográfica */
export const SpellCheck = mk(
  <>
    <path d="M6 7.5 L9 15" />
    <path d="M6.5 12 L11.5 12" />
    <path d="M12 7.5 L15 15" />
    <path d="M15 17 L18 20.5 L22 15.5" />
  </>
);

/* Hashtag / número */
export const Hash = mk(
  <>
    <path d="M5.5 9 C9 8.5 15 8.5 18.5 9" />
    <path d="M5.5 15 C9 14.5 15 14.5 18.5 15" />
    <path d="M9.5 5 C9 9 8.5 15 8 19" />
    <path d="M15.5 5 C15 9 14.5 15 14 19" />
  </>
);

/* ─────────────────────────────────────────────────────────────
   TEMPO & CALENDÁRIO
───────────────────────────────────────────────────────────── */

/* Relógio — com ponteiros em posição expressiva */
export const Clock = mk(
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 6.5 L12 12.5 L15.5 14.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </>
);

export const Clock3 = mk(
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 7 L12 12 L16.5 12" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </>
);

/* Calendário — com grade e marcações */
export const Calendar = mk(
  <>
    <path d="M3.5 5.5 C3.5 4.5 4 4 5 4 L19 4 C20 4 20.5 4.5 20.5 5.5 L20.5 20 C20.5 21 20 21.5 19 21.5 L5 21.5 C4 21.5 3.5 21 3.5 20 Z" />
    <path d="M3.5 10 L20.5 10" />
    <path d="M8 3 L8 6" />
    <path d="M16 3 L16 6" />
    <path d="M7 14 L9 14" />
    <path d="M11 14 L13 14" />
    <path d="M15 14 L17 14" />
  </>
);

/* Calendário com dias marcados */
export const CalendarDays = mk(
  <>
    <path d="M3.5 5.5 C3.5 4.5 4 4 5 4 L19 4 C20 4 20.5 4.5 20.5 5.5 L20.5 20 C20.5 21 20 21.5 19 21.5 L5 21.5 C4 21.5 3.5 21 3.5 20 Z" />
    <path d="M3.5 10 L20.5 10" />
    <path d="M8 3 L8 6" />
    <path d="M16 3 L16 6" />
    <path d="M7 13.5 L8.5 13.5" />
    <path d="M11 13.5 L12.5 13.5" />
    <path d="M15 13.5 L16.5 13.5" />
    <path d="M7 17 L8.5 17" />
    <path d="M11 17 L12.5 17" />
    <path d="M15 17 L16.5 17" />
  </>
);

/* Sino com vibração */
export const BellRing = mk(
  <>
    <path d="M6 9 C6 5.5 8.5 3 12 3 C15.5 3 18 5.5 18 9 C18 14.5 21 17 21 17 L3 17 C3 17 6 14.5 6 9 Z" />
    <path d="M10 20.5 C10.5 21.5 11.2 22 12 22 C12.8 22 13.5 21.5 14 20.5" />
    <path d="M3.5 4.5 C2 6 1.5 8 2 10" />
    <path d="M20.5 4.5 C22 6 22.5 8 22 10" />
  </>
);

/* ─────────────────────────────────────────────────────────────
   COMUNICAÇÃO
───────────────────────────────────────────────────────────── */

/* Balão de mensagem quadrado com rabo */
export const MessagesSquare = mk(
  <>
    <path d="M3 5 C3 4 3.5 3.5 4.5 3.5 L19.5 3.5 C20.5 3.5 21 4 21 5 L21 14.5 C21 15.5 20.5 16 19.5 16 L8 16 L3 21 L3 5 Z" />
    <path d="M7.5 8.5 L16.5 8.5" />
    <path d="M7.5 12 L13 12" />
  </>
);

/* Balão circular */
export const MessageCircle = mk(
  <>
    <path d="M12 3 C17.5 3 21.5 6.5 21.5 11 C21.5 15.5 17.5 19 12 19 C10.5 19 9 18.7 7.5 18 L2.5 21 L4.5 16.5 C3 14.5 2.5 12.8 2.5 11 C2.5 6.5 6.5 3 12 3 Z" />
    <path d="M8 10.5 L16 10.5" />
    <path d="M8 13.5 L13 13.5" />
  </>
);

/* Jornal / news */
export const Newspaper = mk(
  <>
    <path d="M3.5 4 L20.5 4 C21 4 21.5 4.5 21.5 5 L21.5 20 C21.5 21 21 21.5 19.5 21.5 L4.5 21.5 C3.5 21.5 2.5 21 2.5 19.5 L2.5 4 Z" />
    <path d="M7 8 L13.5 8 L13.5 14 L7 14 Z" />
    <path d="M15.5 8 L19 8" />
    <path d="M15.5 11 L19 11" />
    <path d="M7 17 L19 17" />
    <path d="M7 20 L13 20" />
  </>
);

/* ─────────────────────────────────────────────────────────────
   ACESSIBILIDADE & ÁUDIO
───────────────────────────────────────────────────────────── */

/* Pessoa com braços abertos — símbolo de acessibilidade */
export const Accessibility = mk(
  <>
    <circle cx="12" cy="4.5" r="2" />
    <path d="M5 9 C7.5 7.5 9.5 7 12 7 C14.5 7 16.5 7.5 19 9" />
    <path d="M12 7 L12 14.5" />
    <path d="M8 22 C9 19 10.5 16 12 14.5 C13.5 16 15 19 16 22" />
    <path d="M9 11 L7.5 14.5" />
    <path d="M15 11 L16.5 14.5" />
  </>
);

/* Alto-falante com ondas */
export const Volume2 = mk(
  <>
    <path d="M3 9.5 L7 9.5 L12 5.5 L12 18.5 L7 14.5 L3 14.5 Z" />
    <path d="M15.5 9 C16.5 10 17 11 17 12 C17 13 16.5 14 15.5 15" />
    <path d="M18.5 7 C20.5 8.5 21.5 10 21.5 12 C21.5 14 20.5 15.5 18.5 17" />
  </>
);

/* Pausa */
export const Pause = mk(
  <>
    <rect x="5.5" y="4.5" width="4.5" height="15" rx="1.5" />
    <rect x="14" y="4.5" width="4.5" height="15" rx="1.5" />
  </>
);

/* Play */
export const Play = mk(
  <path d="M5.5 4 C5.5 3.5 6 3 6.5 3.5 L20.5 11.5 C21 12 21 12 20.5 12.5 L6.5 20.5 C6 21 5.5 20.5 5.5 20 Z" />
);

/* Controles deslizantes */
export const SlidersHorizontal = mk(
  <>
    <path d="M3 8 C6 7.5 16 8 21 8" />
    <circle cx="8" cy="8" r="3" />
    <path d="M3 16 C6 15.5 16 16 21 16" />
    <circle cx="16" cy="16" r="3" />
  </>
);

/* Zoom in */
export const ZoomIn = mk(
  <>
    <path d="M10.5 4.5 C14.5 4 17.5 7 17.5 10.5 C17.5 14.2 14.5 17 10.5 17 C6.8 17 4 14.2 4 10.5 C4 7 6.8 4.5 10.5 4.5 Z" />
    <path d="M15.5 15.8 L20.5 20.8" />
    <path d="M7.5 10.5 L13.5 10.5" />
    <path d="M10.5 7.5 L10.5 13.5" />
  </>
);

/* Zoom out */
export const ZoomOut = mk(
  <>
    <path d="M10.5 4.5 C14.5 4 17.5 7 17.5 10.5 C17.5 14.2 14.5 17 10.5 17 C6.8 17 4 14.2 4 10.5 C4 7 6.8 4.5 10.5 4.5 Z" />
    <path d="M15.5 15.8 L20.5 20.8" />
    <path d="M7.5 10.5 L13.5 10.5" />
  </>
);

/* Contraste */
export const Contrast = mk(
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 2.5 L12 21.5" />
    <path d="M12 2.5 C17 2.5 21.5 6.5 21.5 12 C21.5 17.5 17 21.5 12 21.5 Z" fill="currentColor" fillOpacity={0.2} stroke="none" />
  </>
);

/* Tipo / fonte */
export const Type = mk(
  <>
    <path d="M4 5 L12 5 L20 5" />
    <path d="M12 5 L12 19" />
    <path d="M7 19 L17 19" />
  </>
);

/* Girar para esquerda */
export const RotateCcw = mk(
  <>
    <path d="M4.5 12 C4.5 7.5 8 4 12.5 4 C17 4 20.5 7.5 20.5 12 C20.5 16.5 17 20 12.5 20 C9.5 20 7 18.5 5.5 16" />
    <path d="M4.5 7.5 L4.5 12 L9 12" />
  </>
);

/* Ponteiro do mouse */
export const MousePointer2 = mk(
  <>
    <path d="M4 3 L10 20.5 L13 14.5 L19.5 20 L21.5 17.5 L15 12 L21.5 9 Z" />
  </>
);

/* ─────────────────────────────────────────────────────────────
   MISC / ESPECIALIZADOS
───────────────────────────────────────────────────────────── */

/* Balança da justiça — artístico, assimétrica levemente */
export const Scale = mk(
  <>
    <path d="M12 3 L12 21" />
    <path d="M4 21 L20 21" />
    <path d="M4.5 8.5 L19.5 8.5" />
    <path d="M4.5 8.5 L2 16 L9 16 Z" />
    <path d="M19.5 8.5 L15 16 L22 16 Z" />
    <circle cx="12" cy="3" r="1.5" />
  </>
);

/* Chave inglesa — torção expressiva */
export const Wrench = mk(
  <>
    <path d="M15 4 C11.5 2.5 7.5 3.5 6 6.5 C4.5 9.5 5.5 13 7.5 14.5 L4 18.5 C3.5 19 3.5 20 4 20.5 C4.5 21 5.5 21 6 20.5 L10 17 C12 18.5 15.5 19 18 17.5 C20.5 16 21.5 12.5 20 9.5 C19.5 8.5 18.5 7.5 18.5 7.5 L15.5 10.5 L13.5 8.5 Z" />
  </>
);

/* Faíscas / mágica */
export const Sparkles = mk(
  <>
    <path d="M12 2.5 C11.5 5 11 7 10 8 C9 9 7 9.5 4.5 10 C7 10.5 9 11 10 12 C11 13 11.5 15 12 17.5 C12.5 15 13 13 14 12 C15 11 17 10.5 19.5 10 C17 9.5 15 9 14 8 C13 7 12.5 5 12 2.5 Z" />
    <path d="M5 4.5 C4.8 5.5 4.5 6 4 6.5 C3.5 7 2.5 7.2 1.5 7.5 C2.5 7.8 3.5 8 4 8.5 C4.5 9 4.8 9.5 5 10.5 C5.2 9.5 5.5 9 6 8.5 C6.5 8 7.5 7.8 8.5 7.5 C7.5 7.2 6.5 7 6 6.5 C5.5 6 5.2 5.5 5 4.5 Z" />
    <path d="M18.5 16.5 C18.3 17.5 18 18 17.5 18.5 C17 19 16 19.2 15 19.5 C16 19.8 17 20 17.5 20.5 C18 21 18.3 21.5 18.5 22.5 C18.7 21.5 19 21 19.5 20.5 C20 20 21 19.8 22 19.5 C21 19.2 20 19 19.5 18.5 C19 18 18.7 17.5 18.5 16.5 Z" />
  </>
);

/* Carregando — animação giratória */
export const Loader2 = mk(
  <>
    <style>{`@keyframes chegou-spin{from{transform-origin:center;transform:rotate(0deg)}to{transform-origin:center;transform:rotate(360deg)}}.chegou-spin{animation:chegou-spin 1.1s linear infinite}`}</style>
    <g className="chegou-spin">
      <path d="M12 4 C16.5 4 20 7.5 20 12 C20 16.5 16.5 20 12 20 C7.5 20 4 16.5 4 12" strokeOpacity={0.25} />
      <path d="M12 4 C16.5 4 20 7.5 20 12" strokeOpacity={0.9} />
    </g>
  </>
);

/* Cérebro / inteligência */
export const Brain = mk(
  <>
    <path d="M12 6 C12 4 10.5 3 9 3.5 C7 4 5 5.5 5 8.5 C5 10 5.5 11 6.5 12 C5.5 13 5 14.5 5 16 C5 19 7 20.5 9 20.5 C10.5 20.5 11 20 12 19.5" />
    <path d="M12 6 C12 4 13.5 3 15 3.5 C17 4 19 5.5 19 8.5 C19 10 18.5 11 17.5 12 C18.5 13 19 14.5 19 16 C19 19 17 20.5 15 20.5 C13.5 20.5 13 20 12 19.5" />
    <path d="M12 6 L12 19.5" />
    <path d="M7 10 C8.5 10.5 10 10.5 11 10" strokeWidth={1.1} />
    <path d="M13 10 C14 10.5 15.5 10.5 17 10" strokeWidth={1.1} />
    <path d="M7 15 C8 15.5 10 15.5 11 15" strokeWidth={1.1} />
  </>
);

/* Navio */
export const Ship = mk(
  <>
    <path d="M3.5 17 C6.5 20 9.5 21 12 21 C14.5 21 17.5 20 20.5 17 L18 9.5 L15 9.5 L15 5.5 L9 5.5 L9 9.5 L6 9.5 Z" />
    <path d="M12 5.5 L12 3" />
    <path d="M9.5 3 L14.5 3" />
    <path d="M3 18 L2.5 20.5" />
    <path d="M21 18 L21.5 20.5" />
  </>
);

/* Caixa / pacote */
export const Package = mk(
  <>
    <path d="M12 2.5 L21.5 7.5 L21.5 16.5 L12 21.5 L2.5 16.5 L2.5 7.5 Z" />
    <path d="M2.5 7.5 L12 12.5 L21.5 7.5" />
    <path d="M12 12.5 L12 21.5" />
    <path d="M7 5 L16.5 10.5" />
  </>
);

/* Laptop */
export const Laptop = mk(
  <>
    <path d="M4.5 5.5 C4.5 5 5 4.5 5.5 4.5 L18.5 4.5 C19 4.5 19.5 5 19.5 5.5 L19.5 16 L4.5 16 Z" />
    <path d="M1.5 17 L22.5 17" />
    <path d="M8.5 17 L9.5 20 L14.5 20 L15.5 17" />
    <path d="M8 9 L16 9" />
    <path d="M8 12 L13 12" />
  </>
);

/* Martelo do juiz */
export const Gavel = mk(
  <>
    <path d="M14.5 4.5 L19.5 9.5" />
    <path d="M12 7 L17.5 12.5" strokeWidth={3} strokeLinecap="square" />
    <path d="M17.5 12.5 L13.5 16.5 L9 12 L13 8 Z" />
    <path d="M3 21 L12 12" />
    <path d="M3 20 L10 21.5" />
  </>
);

/* Calculadora */
export const Calculator = mk(
  <>
    <path d="M5 3 C5 2.5 5.5 2 6 2 L18 2 C18.5 2 19 2.5 19 3 L19 21 C19 21.5 18.5 22 18 22 L6 22 C5.5 22 5 21.5 5 21 Z" />
    <path d="M8.5 6.5 L15.5 6.5" />
    <circle cx="8.5" cy="10.5" r="1.2" />
    <circle cx="12" cy="10.5" r="1.2" />
    <circle cx="15.5" cy="10.5" r="1.2" />
    <circle cx="8.5" cy="14.5" r="1.2" />
    <circle cx="12" cy="14.5" r="1.2" />
    <circle cx="15.5" cy="14.5" r="1.2" />
    <path d="M8.5 18.5 L15.5 18.5" />
  </>
);

/* Talheres */
export const Utensils = mk(
  <>
    <path d="M8.5 2.5 L8.5 22" />
    <path d="M5.5 2.5 L5.5 9.5 C5.5 11.5 7 12.5 8.5 12.5 C10 12.5 11.5 11.5 11.5 9.5 L11.5 2.5" />
    <path d="M16.5 2.5 C16.5 2.5 15 5 15 9 C15 12.5 16.5 13 16.5 13 L16.5 22" />
    <path d="M16.5 13 C18 12.5 19.5 11 19.5 8 C19.5 5 18 2.5 16.5 2.5" />
  </>
);

/* Ônibus */
export const Bus = mk(
  <>
    <path d="M3 6 C3 4.5 4 4 5 4 L19 4 C20 4 21 4.5 21 6 L21 17 L3 17 Z" />
    <path d="M3 11.5 L21 11.5" />
    <path d="M7.5 4 L7.5 11.5" />
    <path d="M16.5 4 L16.5 11.5" />
    <circle cx="7.5" cy="19.5" r="2.5" />
    <circle cx="16.5" cy="19.5" r="2.5" />
    <path d="M3 17 L3 19.5" />
    <path d="M21 17 L21 19.5" />
  </>
);

/* Frente do ônibus */
export const BusFront = mk(
  <>
    <path d="M3.5 5 C3.5 3.5 4.5 3 5.5 3 L18.5 3 C19.5 3 20.5 3.5 20.5 5 L20.5 17.5 L3.5 17.5 Z" />
    <path d="M3.5 10.5 L20.5 10.5" />
    <path d="M7.5 10.5 L7.5 17.5" />
    <path d="M16.5 10.5 L16.5 17.5" />
    <rect x="7.5" y="3.5" width="9" height="2.5" rx="0.5" />
    <circle cx="7.5" cy="20.5" r="2.5" />
    <circle cx="16.5" cy="20.5" r="2.5" />
    <path d="M6 7.5 C6.5 8.5 8 9 9.5 8.5 L9.5 4" strokeWidth={1.1} />
    <path d="M18 7.5 C17.5 8.5 16 9 14.5 8.5 L14.5 4" strokeWidth={1.1} />
  </>
);

/* Paleta de cores */
export const Palette = mk(
  <>
    <path d="M12 3 C7 3 3 7 3 12 C3 17 7 21 12 21 C13.5 21 14.5 20 14.5 18.5 C14.5 18 14.5 17 15 16.5 L17 16.5 C19.5 16.5 21 15 21 12.5 C21 7 17 3 12 3 Z" />
    <circle cx="8.5" cy="9" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="13" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="11.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="7.5" cy="14" r="1.5" fill="currentColor" stroke="none" />
  </>
);

/* Percentual */
export const Percent = mk(
  <>
    <path d="M19.5 5 L4.5 19" />
    <circle cx="7" cy="7" r="3" />
    <circle cx="17" cy="17" r="3" />
  </>
);

/* Caminhão */
export const Truck = mk(
  <>
    <path d="M1.5 10.5 L1.5 17.5 L4 17.5" />
    <path d="M1.5 10.5 L15.5 6 L15.5 17.5 L4 17.5" />
    <path d="M15.5 9 L19.5 9 L22.5 13.5 L22.5 17.5 L19 17.5" />
    <circle cx="6.5" cy="19.5" r="2.5" />
    <circle cx="19" cy="19.5" r="2.5" />
  </>
);

/* Maçã */
export const Apple = mk(
  <>
    <path d="M12 4.5 C14.5 2 17.5 3 17.5 3 C17.5 3 16 5.5 13.5 6" />
    <path d="M8.5 7 C5.5 7 3 9.5 3 13.5 C3 18 6 22 9 22 C10.5 22 11 21 12 21 C13 21 13.5 22 15 22 C18 22 21 18 21 13.5 C21 9.5 18.5 7 15.5 7 C14.5 7 13.5 7.5 12 7.5 C10.5 7.5 9.5 7 8.5 7 Z" />
  </>
);

/* Gráfico de pizza */
export const PieChart = mk(
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 12 L12 2.5" />
    <path d="M12 12 L20.5 7.5" />
    <path d="M12 12 L21.5 13" />
    <path d="M12 12 L16.5 20.5" />
  </>
);

/* ─────────────────────────────────────────────────────────────
   ALIASES & COMPATIBILIDADE
───────────────────────────────────────────────────────────── */
export { X as CircleX };
export { AlertTriangle as AlertPanel };
