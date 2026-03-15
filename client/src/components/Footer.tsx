import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

export function Footer() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  return (
    <footer className="mt-auto border-t border-[#e8ded3]" style={{ background: "#faf6f1" }}>
      <div className="mx-auto max-w-7xl px-4 py-5 lg:px-10">
        <div
          className="relative overflow-hidden rounded-[22px] border border-[#ebe1d7] px-6 py-4 shadow-[0_8px_18px_rgba(146,126,108,0.06)]"
          style={{ background: "linear-gradient(180deg,#fffdf9 0%,#f8f2eb 100%)" }}
        >
          {/* left red margin line */}
          <div className="pointer-events-none absolute left-[18px] top-0 bottom-0 w-px bg-[#e8b7b7]/55" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pl-4">
            {/* Left: branding + slogan */}
            <div className="flex flex-col gap-1">
              <span
                className="font-bold text-sm"
                data-testid="text-footer-title"
                style={{ color: "#8a6e5b" }}
              >
                {settings?.site_title || "Chegou a Conta, Diretora!"}
              </span>
              <span className="text-xs" style={{ color: "#9f968d" }} data-testid="text-footer-slogan">
                {settings?.footer_slogan || "Acesso livre para quem trabalha e acredita na escola pública."}
              </span>
              {settings?.footer_text && (
                <span className="text-xs" style={{ color: "#b8ae9e" }}>{settings.footer_text}</span>
              )}
            </div>

            {/* Right: links */}
            <div className="flex flex-wrap items-center gap-5 text-sm" style={{ color: "#8a7b70" }}>
              <Link href="/legislacao" className="transition hover:text-[#24344a]">Legislação</Link>
              <Link href="/trilha" className="transition hover:text-[#24344a]">Trilha</Link>
              <Link href="/programas" className="transition hover:text-[#24344a]">Programas</Link>
              <Link href="/ferramentas" className="transition hover:text-[#24344a]">Ferramentas</Link>
              <Link href="/chat" className="transition hover:text-[#24344a]">Caderno da Diretora</Link>
              <Link href="/quem-somos" className="transition hover:text-[#24344a]">Quem somos</Link>
              <Link
                href="/admin"
                data-testid="link-admin"
                aria-label="Admin"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e3d9cf] bg-white/85 text-[#9a9188] transition hover:border-[#d6c8ba] hover:text-[#24344a]"
              >
                <span className="text-sm leading-none">🛠️</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
