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
        strokeWidth={strokeWidth ?? 1.5}
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

/* ── NAVIGATION & UI ─────────────────────────────────────────── */

export const X = mk(
  <>
    <path d="M5 5c4.5 4 9 7 14 14" />
    <path d="M19 5c-4.5 4 -9 7 -14 14" />
  </>
);

export const Menu = mk(
  <>
    <path d="M4 7 Q12 6.5 20 7" />
    <path d="M4 12 Q12 11.5 20 12" />
    <path d="M4 17 Q12 16.5 20 17" />
  </>
);

export const ChevronDown = mk(<path d="M5.5 9.5 Q12 16 18.5 9.5" />);
export const ChevronUp = mk(<path d="M5.5 14.5 Q12 8 18.5 14.5" />);
export const ChevronLeft = mk(<path d="M14.5 5.5 Q8 12 14.5 18.5" />);
export const ChevronRight = mk(<path d="M9.5 5.5 Q16 12 9.5 18.5" />);

export const ArrowLeft = mk(
  <>
    <path d="M20 12 Q12 11.5 4 12" />
    <path d="M10 7 Q5 11.5 10 17" />
  </>
);

export const ArrowRight = mk(
  <>
    <path d="M4 12 Q12 11.5 20 12" />
    <path d="M14 7 Q19 11.5 14 17" />
  </>
);

export const ExternalLink = mk(
  <>
    <path d="M18 14v5a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 19V7.5A1.5 1.5 0 015 6h5" />
    <path d="M14 3.5h6.5V10" />
    <path d="M10.5 13.5 L20.5 3.5" />
  </>
);

export const MoreHorizontal = mk(
  <>
    <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </>
);

export const GripVertical = mk(
  <>
    <circle cx="9" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="18" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="18" r="1" fill="currentColor" stroke="none" />
  </>
);

export const Dot = mk(
  <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
);

export const Circle = mk(<circle cx="12" cy="12" r="9" />);

export const PanelLeftIcon = mk(
  <>
    <rect x="2.5" y="3" width="19" height="18" rx="2" />
    <line x1="8.5" y1="3" x2="8.5" y2="21" />
  </>
);

/* ── SEARCH & FILTER ─────────────────────────────────────────── */

export const Search = mk(
  <>
    <path d="M10.5 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" />
    <path d="M15.5 15.5 Q17.5 17.5 20.5 20.5" />
  </>
);

export const Filter = mk(
  <>
    <path d="M3 5.5h18" />
    <path d="M6.5 12h11" />
    <path d="M10 18.5h4" />
  </>
);

/* ── EDUCATION ───────────────────────────────────────────────── */

export const School = mk(
  <>
    <path d="M2 10 L12 3.5 L22 10 L22 21 L2 21 Z" />
    <path d="M9 21V13.5h6V21" />
    <path d="M12 3.5V6.5" />
    <path d="M10.5 5h3" />
  </>
);

export const GraduationCap = mk(
  <>
    <path d="M22 10.5 L12 5.5 L2 10.5 L12 15.5 Z" />
    <path d="M6 13v4.5c0 1.5 2.5 2.5 6 2.5s6-1 6-2.5V13" />
    <path d="M22 10.5v5" />
    <circle cx="22" cy="16" r="1" fill="currentColor" stroke="none" />
  </>
);

export const BookOpen = mk(
  <>
    <path d="M2 4h7a3 3 0 013 3v13a2.5 2.5 0 00-3-2.5H2V4z" />
    <path d="M22 4h-7a3 3 0 00-3 3v13a2.5 2.5 0 013-2.5h7V4z" />
  </>
);

export const BookMarked = mk(
  <>
    <path d="M4 4.5A1.5 1.5 0 015.5 3H19v18l-6.5-3.5L6 21V3" />
    <path d="M6 3h13" />
  </>
);

export const BookText = mk(
  <>
    <path d="M4 4a1.5 1.5 0 011.5-1.5h13A1.5 1.5 0 0120 4v16.5l-7.5-3-7.5 3V4z" />
    <path d="M8 8h8" />
    <path d="M8 11.5h8" />
    <path d="M8 15h5" />
  </>
);

export const BookOpenCheck = mk(
  <>
    <path d="M2 4h7a3 3 0 013 3v13a2.5 2.5 0 00-3-2.5H2V4z" />
    <path d="M22 4h-7a3 3 0 00-3 3v13a2.5 2.5 0 013-2.5h7V4z" />
    <path d="M14 10l2 2 4-4" />
  </>
);

export const Award = mk(
  <>
    <circle cx="12" cy="9" r="6" />
    <path d="M8.5 15.5L7 22l5-2.5L17 22l-1.5-6.5" />
    <path d="M10 8.5l1.5 1.5 3-3" />
  </>
);

export const BarChart3 = mk(
  <>
    <path d="M3.5 20.5V12.5h3.5v8H3.5z" />
    <path d="M10.25 20.5V7.5h3.5v13h-3.5z" />
    <path d="M17 20.5V3.5h3.5v17H17z" />
    <line x1="2" y1="20.5" x2="22" y2="20.5" />
  </>
);

export const TrendingUp = mk(
  <>
    <path d="M3 17 Q8 12 12 13 Q16 14 20.5 7" />
    <path d="M15.5 7h5v5" />
  </>
);

/* ── PEOPLE ──────────────────────────────────────────────────── */

export const Users = mk(
  <>
    <path d="M14 21v-2a4.5 4.5 0 00-4.5-4.5h-5A4.5 4.5 0 000 19v2" />
    <circle cx="7" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.74" />
  </>
);

export const User = mk(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-2a8 8 0 0116 0v2" />
  </>
);

export const Heart = mk(
  <path d="M12 21.5 Q4 16 4 10.5a5 5 0 019.5-2.3A5 5 0 0120 10.5c0 5.5-8 11-8 11z" />
);

export const Bot = mk(
  <>
    <rect x="3" y="8.5" width="18" height="12" rx="2" />
    <path d="M8.5 13h.5" strokeWidth={2.5} />
    <path d="M15 13h.5" strokeWidth={2.5} />
    <path d="M9 17.5c1 1 5 1 6 0" />
    <path d="M12 8.5V5" />
    <path d="M9 5h6" />
  </>
);

export const Handshake = mk(
  <>
    <path d="M3 12h2.5l3-3h5l3 3H19" />
    <path d="M3 12 Q2 15 5 17l4.5-3" />
    <path d="M19 12 Q20 15 17 17l-4.5-3" />
    <path d="M8.5 9 L7 7 M15.5 9 L17 7" />
  </>
);

/* ── LOCATION & PLACE ────────────────────────────────────────── */

export const MapPin = mk(
  <>
    <path d="M12 2.5a7 7 0 00-7 7c0 5.5 7 12 7 12s7-6.5 7-12a7 7 0 00-7-7z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </>
);

export const Globe = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a14 14 0 010 18" />
    <path d="M12 3a14 14 0 000 18" />
  </>
);

export const Building = mk(
  <>
    <rect x="3" y="4" width="18" height="17" rx="0.5" />
    <path d="M9 21V12.5h6V21" />
    <path d="M7.5 8h1.5" />
    <path d="M11 8h1.5" />
    <path d="M14.5 8h1.5" />
    <path d="M7.5 12h1.5" />
    <path d="M14.5 12h1.5" />
    <path d="M3 4V3h18v1" />
  </>
);

export const Building2 = mk(
  <>
    <path d="M3 21V7.5L12 3l9 4.5V21H3z" />
    <path d="M9 21V14h6v7" />
    <path d="M9.5 9.5h1.5" />
    <path d="M13 9.5h1.5" />
    <path d="M9.5 12.5h1.5" />
    <path d="M13 12.5h1.5" />
    <line x1="3" y1="21" x2="21" y2="21" />
  </>
);

export const Landmark = mk(
  <>
    <line x1="3" y1="21" x2="21" y2="21" />
    <path d="M3 10.5h18" />
    <path d="M12 3 Q8 5.5 4 10.5h16Q16 5.5 12 3z" />
    <line x1="6" y1="10.5" x2="6" y2="21" />
    <line x1="10.5" y1="10.5" x2="10.5" y2="21" />
    <line x1="15" y1="10.5" x2="15" y2="21" />
    <line x1="19" y1="10.5" x2="19" y2="21" />
  </>
);

export const TreePine = mk(
  <>
    <path d="M12 3 L4 13h5L6 19h6v3" />
    <path d="M12 3 L20 13h-5l3 6h-6v3" />
    <line x1="10" y1="22" x2="14" y2="22" />
  </>
);

export const Pin = mk(
  <>
    <path d="M9.5 3.5 Q6 4 6 8.5c0 2.5 1.5 4 3 5l-3 7" />
    <path d="M14.5 3.5 Q18 4 18 8.5c0 2.5-1.5 4-3 5l3 7" />
    <path d="M9 3.5h6" />
    <path d="M9 13.5h6" />
  </>
);

/* ── FINANCE ─────────────────────────────────────────────────── */

export const DollarSign = mk(
  <>
    <path d="M12 2v20" />
    <path d="M17 6.5a5 5 0 00-10 0c0 3 5 4.5 10 7.5a5 5 0 01-10 0" />
  </>
);

export const Wallet = mk(
  <>
    <path d="M2.5 7.5a2 2 0 012-2h15a2 2 0 012 2v11a2 2 0 01-2 2h-15a2 2 0 01-2-2v-11z" />
    <path d="M21.5 12.5H16a2 2 0 000 4h5.5v-4z" />
    <path d="M6 5.5V4a1.5 1.5 0 013 0v1.5" />
    <circle cx="16.5" cy="14.5" r="0.8" fill="currentColor" stroke="none" />
  </>
);

export const BanknoteIcon = mk(
  <>
    <rect x="1.5" y="6" width="21" height="13" rx="1.5" />
    <circle cx="12" cy="12.5" r="3" />
    <path d="M4.5 6.5v1.5" />
    <path d="M19.5 6.5v1.5" />
    <path d="M4.5 17v1.5" />
    <path d="M19.5 17v1.5" />
  </>
);

export const Banknote = mk(
  <>
    <rect x="1.5" y="6" width="21" height="13" rx="1.5" />
    <circle cx="12" cy="12.5" r="3" />
    <path d="M4.5 6.5v1.5" />
    <path d="M19.5 6.5v1.5" />
    <path d="M4.5 17v1.5" />
    <path d="M19.5 17v1.5" />
  </>
);

export const Coins = mk(
  <>
    <circle cx="9" cy="15" r="5" />
    <circle cx="15" cy="9" r="5" />
    <path d="M12 6.5c1.5-.5 4-.5 5.5.5" />
    <path d="M6.5 12c-.5 1.5-.5 4 .5 5.5" />
  </>
);

export const CircleDollarSign = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6v12" />
    <path d="M15.5 9a3.5 3.5 0 00-7 0c0 2 3.5 3 7 5a3.5 3.5 0 01-7 0" />
  </>
);

export const PiggyBank = mk(
  <>
    <path d="M19 12a7 7 0 00-7-7H9a7 7 0 000 14h3a7 7 0 007-7z" />
    <path d="M19.5 12h2.5" />
    <path d="M20.5 10v4" />
    <path d="M12 6.5V5" />
    <path d="M10 5h4" />
    <path d="M9 16l-1.5 3.5" />
    <path d="M15 16l1.5 3.5" />
    <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
  </>
);

export const CreditCard = mk(
  <>
    <rect x="2" y="5.5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <path d="M6 15h3" />
    <path d="M14 15h4" />
  </>
);

export const Receipt = mk(
  <>
    <path d="M3.5 2.5v19l2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5V2.5H3.5z" />
    <path d="M8 8.5h8" />
    <path d="M8 12h8" />
    <path d="M8 15.5h5" />
  </>
);

/* ── DOCUMENTS ───────────────────────────────────────────────── */

export const FileText = mk(
  <>
    <path d="M14.5 2.5H5.5a1.5 1.5 0 00-1.5 1.5v17a1.5 1.5 0 001.5 1.5h13a1.5 1.5 0 001.5-1.5V8L14.5 2.5z" />
    <path d="M14.5 2.5v5.5h5.5" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="14" y2="17" />
  </>
);

export const FileCheck = mk(
  <>
    <path d="M14.5 2.5H5.5a1.5 1.5 0 00-1.5 1.5v17a1.5 1.5 0 001.5 1.5h13a1.5 1.5 0 001.5-1.5V8L14.5 2.5z" />
    <path d="M14.5 2.5v5.5h5.5" />
    <path d="M8 13l2.5 2.5 5-5" />
  </>
);

export const FileSignature = mk(
  <>
    <path d="M14.5 2.5H5.5a1.5 1.5 0 00-1.5 1.5v17a1.5 1.5 0 001.5 1.5h13a1.5 1.5 0 001.5-1.5V8L14.5 2.5z" />
    <path d="M14.5 2.5v5.5h5.5" />
    <path d="M7 17.5 Q9 15.5 10 17.5 Q11 19.5 13 15.5" />
    <line x1="7" y1="19.5" x2="14" y2="19.5" />
  </>
);

export const Folder = mk(
  <>
    <path d="M2.5 7a1.5 1.5 0 011.5-1.5h5.5L11.5 7H20a1.5 1.5 0 011.5 1.5v11A1.5 1.5 0 0120 21H4a1.5 1.5 0 01-1.5-1.5V7z" />
  </>
);

export const Paperclip = mk(
  <path d="M21 11.5L10.5 22a5.5 5.5 0 01-7.78-7.78l10.5-10.5a3.5 3.5 0 014.95 4.95L8.25 19.07a1.5 1.5 0 01-2.12-2.12L16.5 6.58" />
);

export const ClipboardList = mk(
  <>
    <path d="M9 3.5a1 1 0 011-1h4a1 1 0 011 1v1H9v-1z" />
    <path d="M8 3.5H6a1.5 1.5 0 00-1.5 1.5v16A1.5 1.5 0 006 22.5h12A1.5 1.5 0 0019.5 21V5a1.5 1.5 0 00-1.5-1.5h-2" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="16" y2="14" />
    <line x1="8" y1="18" x2="12" y2="18" />
  </>
);

export const ClipboardCopy = mk(
  <>
    <path d="M9 3.5a1 1 0 011-1h4a1 1 0 011 1v1H9v-1z" />
    <path d="M8 3.5H6A1.5 1.5 0 004.5 5v10A1.5 1.5 0 006 16.5h5" />
    <rect x="10.5" y="12" width="9" height="9" rx="1.5" />
    <path d="M14.5 12V10.5h5V12" />
  </>
);

export const Download = mk(
  <>
    <path d="M12 3v12" />
    <path d="M7.5 11 Q12 16.5 16.5 11" />
    <path d="M4 20h16" />
  </>
);

export const Upload = mk(
  <>
    <path d="M12 16V4" />
    <path d="M7.5 8 Q12 2.5 16.5 8" />
    <path d="M4 20h16" />
  </>
);

export const Mail = mk(
  <>
    <rect x="2.5" y="5" width="19" height="14" rx="2" />
    <path d="M2.5 7.5L12 13.5l9.5-6" />
  </>
);

export const Bookmark = mk(
  <path d="M5.5 3h13a1 1 0 011 1v17l-7.5-4-7.5 4V4a1 1 0 011-1z" />
);

export const PenTool = mk(
  <>
    <path d="M12 19.5L3 20.5l1-9L16.5 2.5a2 2 0 013 3L12 19.5z" />
    <path d="M12 19.5l-3-3" />
    <path d="M16.5 5l3 3" />
  </>
);

export const PenLine = mk(
  <>
    <path d="M12 20H21" />
    <path d="M15.5 3.5a2 2 0 013 3L6 19 2 20l1-4L15.5 3.5z" />
  </>
);

export const Pencil = mk(
  <>
    <path d="M17.5 2.5a2 2 0 013 3l-14 14L3 21l1.5-3.5 13-15z" />
    <path d="M15 5l4 4" />
  </>
);

export const Send = mk(
  <>
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22 11 13 2 9l20-7z" />
  </>
);

/* ── STATUS & ALERTS ─────────────────────────────────────────── */

export const AlertTriangle = mk(
  <>
    <path d="M10.3 3.5a2 2 0 013.4 0l8 14A2 2 0 0120 20.5H4a2 2 0 01-1.7-3l8-14z" />
    <line x1="12" y1="9.5" x2="12" y2="13.5" />
    <circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
  </>
);

export const AlertCircle = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="12.5" />
    <circle cx="12" cy="15.5" r="0.8" fill="currentColor" stroke="none" />
  </>
);

export const CircleAlert = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="12.5" />
    <circle cx="12" cy="15.5" r="0.8" fill="currentColor" stroke="none" />
  </>
);

export const BadgeAlert = mk(
  <>
    <path d="M12 2L15.5 5.5H21v5.5L17.5 15l3.5 4L15.5 19H9L5.5 19 2 15l3.5-4L2 7V5.5h5.5L12 2z" />
    <line x1="12" y1="8.5" x2="12" y2="13" />
    <circle cx="12" cy="15.5" r="0.8" fill="currentColor" stroke="none" />
  </>
);

export const CheckCircle = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12l2.5 2.5 5.5-5.5" />
  </>
);

export const CheckCircle2 = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12l2.5 2.5 5.5-5.5" />
  </>
);

export const Check = mk(<path d="M4.5 12.5l5 5L19.5 7" />);

export const CheckSquare = mk(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 12l3.5 3.5 7-7" />
  </>
);

export const Shield = mk(
  <path d="M12 2.5 Q7 4.5 4 7v7c0 4.5 4 7.5 8 9.5 4-2 8-5 8-9.5V7Q18 4.5 12 2.5z" />
);

export const ShieldCheck = mk(
  <>
    <path d="M12 2.5 Q7 4.5 4 7v7c0 4.5 4 7.5 8 9.5 4-2 8-5 8-9.5V7Q18 4.5 12 2.5z" />
    <path d="M8.5 12.5l2.5 2.5 5-5" />
  </>
);

export const Info = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="10.5" x2="12" y2="16" />
    <circle cx="12" cy="8" r="0.8" fill="currentColor" stroke="none" />
  </>
);

export const HelpCircle = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a3 3 0 015 2c0 2-3 2.5-3 4.5" />
    <circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none" />
  </>
);

/* ── ACTIONS & CONTROLS ──────────────────────────────────────── */

export const Plus = mk(
  <>
    <line x1="12" y1="4.5" x2="12" y2="19.5" />
    <line x1="4.5" y1="12" x2="19.5" y2="12" />
  </>
);

export const Trash2 = mk(
  <>
    <path d="M3.5 7h17" />
    <path d="M8.5 7V4.5h7V7" />
    <path d="M5.5 7l1 13h11l1-13" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </>
);

export const Save = mk(
  <>
    <path d="M15.5 2.5H4a1.5 1.5 0 00-1.5 1.5v17A1.5 1.5 0 004 22.5h16A1.5 1.5 0 0021.5 21V8L15.5 2.5z" />
    <path d="M8.5 2.5v5.5h7V2.5" />
    <rect x="6.5" y="13.5" width="11" height="8" rx="0.5" />
  </>
);

export const RefreshCw = mk(
  <>
    <path d="M3 12a9 9 0 109-9H7" />
    <path d="M5 6l2-3-3 2" />
  </>
);

export const Lock = mk(
  <>
    <rect x="4.5" y="11" width="15" height="11" rx="2" />
    <path d="M8 11V7.5a4 4 0 018 0V11" />
    <circle cx="12" cy="16.5" r="1.5" />
    <line x1="12" y1="16.5" x2="12" y2="19" />
  </>
);

export const LogOut = mk(
  <>
    <path d="M9.5 5.5H5a1.5 1.5 0 00-1.5 1.5v11A1.5 1.5 0 005 19.5h4.5" />
    <path d="M16 8l4 4-4 4" />
    <line x1="20" y1="12" x2="10" y2="12" />
  </>
);

export const Settings = mk(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </>
);

export const Bold = mk(
  <path d="M6.5 4.5H13a3.5 3.5 0 010 7H6.5V4.5zM6.5 11.5H14a4 4 0 010 8H6.5v-8z" />
);

export const Italic = mk(
  <>
    <line x1="10.5" y1="4.5" x2="14" y2="4.5" />
    <line x1="10" y1="19.5" x2="13.5" y2="19.5" />
    <line x1="13.5" y1="4.5" x2="10" y2="19.5" />
  </>
);

export const Underline = mk(
  <>
    <path d="M7 4.5v7a5 5 0 0010 0v-7" />
    <line x1="4" y1="19.5" x2="20" y2="19.5" />
  </>
);

export const Highlighter = mk(
  <>
    <path d="M9 11L15 5a3 3 0 014 4l-6 6L9 11z" />
    <path d="M11 13 Q8 16 7 19h3l2-2" />
    <line x1="4" y1="21.5" x2="20" y2="21.5" />
  </>
);

export const List = mk(
  <>
    <circle cx="5.5" cy="7" r="1.2" fill="currentColor" stroke="none" />
    <line x1="9" y1="7" x2="20.5" y2="7" />
    <circle cx="5.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <line x1="9" y1="12" x2="20.5" y2="12" />
    <circle cx="5.5" cy="17" r="1.2" fill="currentColor" stroke="none" />
    <line x1="9" y1="17" x2="20.5" y2="17" />
  </>
);

export const ListOrdered = mk(
  <>
    <path d="M4 5.5h2v5" />
    <path d="M3.5 10.5h3" />
    <path d="M3.5 14.5h2.5l-2.5 3.5h3" />
    <line x1="10" y1="7" x2="20.5" y2="7" />
    <line x1="10" y1="12" x2="20.5" y2="12" />
    <line x1="10" y1="17" x2="20.5" y2="17" />
  </>
);

export const Heading2 = mk(
  <>
    <path d="M4 4.5v15" />
    <path d="M4 12h10" />
    <path d="M14 4.5v15" />
    <path d="M17 16a2.5 2.5 0 015 0c0 2-2.5 3.5-5 5h5" />
  </>
);

export const SpellCheck = mk(
  <>
    <path d="M5.5 7L8 14l2.5-7" />
    <path d="M6 11h5" />
    <path d="M14 17l2.5 3 4.5-5" />
  </>
);

export const Hash = mk(
  <>
    <line x1="5.5" y1="8.5" x2="18.5" y2="8.5" />
    <line x1="5.5" y1="15.5" x2="18.5" y2="15.5" />
    <line x1="9.5" y1="4" x2="7.5" y2="20" />
    <line x1="16.5" y1="4" x2="14.5" y2="20" />
  </>
);

/* ── TIME & CALENDAR ─────────────────────────────────────────── */

export const Clock = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.5l3.5 3.5" />
  </>
);

export const Clock3 = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5h5" />
  </>
);

export const Calendar = mk(
  <>
    <rect x="3" y="4.5" width="18" height="17" rx="2" />
    <path d="M3 10h18" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M7 14.5h2" />
    <path d="M11 14.5h2" />
    <path d="M15 14.5h2" />
  </>
);

export const CalendarDays = mk(
  <>
    <rect x="3" y="4.5" width="18" height="17" rx="2" />
    <path d="M3 10h18" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M7.5 14.5h1" />
    <path d="M11.5 14.5h1" />
    <path d="M15.5 14.5h1" />
    <path d="M7.5 18h1" />
    <path d="M11.5 18h1" />
    <path d="M15.5 18h1" />
  </>
);

export const BellRing = mk(
  <>
    <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M10.3 21a2 2 0 003.4 0" />
    <path d="M4.5 3.5 Q2 5 2 8" />
    <path d="M19.5 3.5 Q22 5 22 8" />
  </>
);

/* ── COMMUNICATION ───────────────────────────────────────────── */

export const MessagesSquare = mk(
  <>
    <path d="M21.5 14.5a1.5 1.5 0 01-1.5 1.5H7.5L3 21V5.5A1.5 1.5 0 014.5 4H20a1.5 1.5 0 011.5 1.5v9z" />
    <line x1="8" y1="9.5" x2="16" y2="9.5" />
    <line x1="8" y1="13" x2="13" y2="13" />
  </>
);

export const MessageCircle = mk(
  <>
    <path d="M21 12a9 9 0 01-13 8L3 21l1-5a9 9 0 1117-4z" />
    <line x1="9" y1="11" x2="15" y2="11" />
    <line x1="9" y1="14" x2="13" y2="14" />
  </>
);

export const Newspaper = mk(
  <>
    <path d="M3 4h18a1 1 0 011 1v14a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" />
    <path d="M7 8h6v5H7V8z" />
    <line x1="15" y1="8" x2="19" y2="8" />
    <line x1="15" y1="11" x2="19" y2="11" />
    <line x1="7" y1="16" x2="19" y2="16" />
  </>
);

/* ── ACCESSIBILITY & AUDIO ───────────────────────────────────── */

export const Accessibility = mk(
  <>
    <circle cx="12" cy="4" r="2" />
    <path d="M5.5 10 Q12 8 18.5 10" />
    <path d="M12 10v5" />
    <path d="M8.5 21 Q10 16 12 15 Q14 16 15.5 21" />
  </>
);

export const Volume2 = mk(
  <>
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
    <path d="M15.5 8.5a5 5 0 010 7" />
    <path d="M18.5 5.5a9 9 0 010 13" />
  </>
);

export const Pause = mk(
  <>
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </>
);

export const Play = mk(
  <path d="M5.5 3.5l15 8.5-15 8.5V3.5z" />
);

export const SlidersHorizontal = mk(
  <>
    <line x1="3" y1="7" x2="21" y2="7" />
    <circle cx="8" cy="7" r="2.5" />
    <line x1="3" y1="17" x2="21" y2="17" />
    <circle cx="16" cy="17" r="2.5" />
  </>
);

export const ZoomIn = mk(
  <>
    <path d="M10.5 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" />
    <path d="M15.5 15.5 L20.5 20.5" />
    <line x1="7.5" y1="11" x2="13.5" y2="11" />
    <line x1="10.5" y1="8" x2="10.5" y2="14" />
  </>
);

export const ZoomOut = mk(
  <>
    <path d="M10.5 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" />
    <path d="M15.5 15.5 L20.5 20.5" />
    <line x1="7.5" y1="11" x2="13.5" y2="11" />
  </>
);

export const Contrast = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v18" />
    <path d="M12 3a9 9 0 010 18z" fill="currentColor" fillOpacity={0.15} stroke="none" />
  </>
);

export const Type = mk(
  <>
    <path d="M4 6h16" />
    <path d="M12 6v15" />
    <path d="M4 11h8" />
  </>
);

export const RotateCcw = mk(
  <>
    <path d="M3 12a9 9 0 109-9H7" />
    <path d="M7 3l-4 3 4 3" />
  </>
);

export const MousePointer2 = mk(
  <>
    <path d="M4 2.5l7 19 3-7 7-3L4 2.5z" />
    <path d="M12 14.5l5.5 5.5" />
  </>
);

/* ── MISC / SPECIALISED ──────────────────────────────────────── */

export const Scale = mk(
  <>
    <line x1="12" y1="3" x2="12" y2="21" />
    <path d="M5 21h14" />
    <path d="M3 8l4.5 8H3l4.5-8z" />
    <path d="M16.5 8l4.5 8h-9l4.5-8z" />
    <path d="M5 8h14" />
  </>
);

export const Wrench = mk(
  <>
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
  </>
);

export const Sparkles = mk(
  <>
    <path d="M12 2v3M12 19v3M4.2 4.2l2 2M17.8 17.8l2 2M2 12h3M19 12h3M4.2 19.8l2-2M17.8 6.2l2-2" />
    <circle cx="12" cy="12" r="3" />
  </>
);

export const Loader2 = mk(
  <>
    <style>{`@keyframes chegou-spin{from{transform-origin:center;transform:rotate(0deg)}to{transform-origin:center;transform:rotate(360deg)}}.chegou-spin{animation:chegou-spin 1s linear infinite}`}</style>
    <g className="chegou-spin">
      <circle cx="12" cy="12" r="8" strokeOpacity={0.2} />
      <path d="M12 4a8 8 0 018 8" strokeOpacity={0.9} />
    </g>
  </>
);

export const Brain = mk(
  <>
    <path d="M12 5 Q9 3 6 5a5 5 0 00-1 9.5L5 20h7V5z" />
    <path d="M12 5 Q15 3 18 5a5 5 0 011 9.5L19 20h-7V5z" />
    <path d="M6 10 Q7.5 11 9 10" />
    <path d="M15 10 Q16.5 11 18 10" />
    <path d="M12 5v15" />
  </>
);

export const Ship = mk(
  <>
    <path d="M3 17 Q7 20 12 20 Q17 20 21 17L19 10h-4V6h-6v4H5L3 17z" />
    <path d="M12 6V3" />
    <path d="M9 3h6" />
    <path d="M3 17l-.5 2h19l-.5-2" />
  </>
);

export const Package = mk(
  <>
    <path d="M12 2.5L21.5 8v8L12 21.5 2.5 16V8L12 2.5z" />
    <path d="M12 2.5v19" />
    <path d="M2.5 8l9.5 5.5 9.5-5.5" />
    <path d="M7 5.5L16.5 11" />
  </>
);

export const Laptop = mk(
  <>
    <path d="M4 5.5h16a1 1 0 011 1v10h-18v-10a1 1 0 011-1z" />
    <path d="M1.5 16.5h21" />
    <path d="M9 16.5l1 2.5h4l1-2.5" />
    <path d="M8 9.5h8" />
    <path d="M8 12.5h5" />
  </>
);

export const Gavel = mk(
  <>
    <path d="M14 4L20 10" />
    <path d="M11.5 6.5l7 7" />
    <path d="M14 4l-2-2-7 7 2 2 7-7z" />
    <path d="M16 10l4 4-5 5-4-4 5-5z" />
    <path d="M3 21h9" />
  </>
);

export const Calculator = mk(
  <>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M8 6h8" />
    <path d="M8 10h1.5" />
    <path d="M11.5 10h1.5" />
    <path d="M15 10h1.5" />
    <path d="M8 14h1.5" />
    <path d="M11.5 14h1.5" />
    <path d="M15 14h1.5" />
    <path d="M8 18h5" />
    <path d="M15 18h1.5" />
  </>
);

export const Utensils = mk(
  <>
    <line x1="8" y1="2" x2="8" y2="22" />
    <path d="M5 2v6a3 3 0 006 0V2" />
    <path d="M16 2v22M16 10a4 4 0 000-8" />
  </>
);

export const Bus = mk(
  <>
    <rect x="2.5" y="5" width="19" height="13" rx="2" />
    <path d="M2.5 10h19" />
    <line x1="7" y1="5" x2="7" y2="18" />
    <line x1="17" y1="5" x2="17" y2="18" />
    <circle cx="7" cy="20.5" r="1.5" />
    <circle cx="17" cy="20.5" r="1.5" />
    <path d="M5.5 18v2.5" />
    <path d="M18.5 18v2.5" />
  </>
);

export const BusFront = mk(
  <>
    <rect x="2.5" y="3" width="19" height="16" rx="2" />
    <path d="M2.5 8h19" />
    <path d="M7 8v11" />
    <path d="M17 8v11" />
    <circle cx="7" cy="21.5" r="1.5" />
    <circle cx="17" cy="21.5" r="1.5" />
    <path d="M8 3.5h8" />
    <path d="M7 11h4v4H7z" />
    <path d="M13 11h4v4h-4z" />
  </>
);

export const Palette = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <circle cx="14.5" cy="7.5" r="1.5" />
    <circle cx="17" cy="12.5" r="1.5" />
    <circle cx="14.5" cy="17" r="1.5" />
    <path d="M12 21a3 3 0 003-3 3 3 0 00-3 0z" fill="currentColor" fillOpacity={0.2} />
  </>
);

export const Percent = mk(
  <>
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </>
);

export const Truck = mk(
  <>
    <path d="M1.5 10V17.5h14V5.5H1.5V10z" />
    <path d="M15.5 9h3.5l3.5 5v3.5h-7V9z" />
    <circle cx="5.5" cy="19.5" r="2" />
    <circle cx="18.5" cy="19.5" r="2" />
  </>
);

export const Apple = mk(
  <>
    <path d="M12 4 Q14 2 16 3a5 5 0 01-2 3.5" />
    <path d="M9.5 6.5 Q6 6 5 10a12 12 0 002 8c1.5 2.5 3 3.5 4 3.5 1 0 1.5-.5 3-.5s2 .5 3 .5c1 0 2.5-1 4-3.5a12 12 0 002-8Q21 6 17 6.5 Q15 7 12 7 Q11 7 9.5 6.5z" />
  </>
);

export const Laptop2 = mk(
  <>
    <path d="M4 5.5h16a1 1 0 011 1v10h-18v-10a1 1 0 011-1z" />
    <path d="M1.5 16.5h21" />
  </>
);

export const PieChart = mk(
  <>
    <path d="M21.5 12a9.5 9.5 0 11-9.5-9.5V12h9.5z" />
    <path d="M12 2.5V12l7.5 4.5" />
  </>
);

export const ExternalLinkIcon = ExternalLink;

/* ── ALIASES for named variants ──────────────────────────────── */
export const AlertPanel = AlertTriangle;
export const CircleX = X;
