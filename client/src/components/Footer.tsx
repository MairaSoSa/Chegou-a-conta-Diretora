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
          {/* left margin line */}
          <div className="pointer-events-none absolute left-[18px] top-0 bottom-0 w-px bg-[#e8b7b7]/55" />

          <div className="flex items-center justify-between pl-4">
            {/* Quem somos */}
            <Link
              href="/quem-somos"
              className="text-sm transition-colors"
              style={{ color: "#8a7b70" }}
              data-testid="text-footer-slogan"
            >
              {settings?.footer_slogan
                ? <span className="hover:text-[#24344a]">{settings.footer_slogan}</span>
                : <span className="hover:text-[#24344a]">Quem somos</span>}
            </Link>

            {/* Admin icon */}
            <Link
              href="/admin"
              data-testid="link-admin"
              aria-label="Admin"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e3d9cf] bg-white/85 text-[#9a9188] transition hover:border-[#d6c8ba] hover:text-[#24344a]"
            >
              <span className="text-sm leading-none" role="img" aria-label="ferramentas">🛠️</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
