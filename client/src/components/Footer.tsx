import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

export function Footer() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  return (
    <footer
      className="mt-auto w-full relative"
      style={{
        /* mesmo sage do header, mas escalonado — espelha o topo */
        background: `
          linear-gradient(180deg,
            #a8b89a 0%,
            #b8c8aa 22%,
            #c8d6ba 42%,
            #cddac0 58%,
            #c2d0b5 78%,
            #b0bfa4 100%
          )`,
        boxShadow: `
          inset 0 10px 28px rgba(80,100,70,0.18),
          inset 0 -2px 0 rgba(255,255,255,0.32),
          0 -6px 20px rgba(80,100,70,0.16)
        `,
      }}
    >
      {/* textura — mesmas fibras diagonais do header */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              112deg,
              rgba(255,255,255,0.12) 0px,
              rgba(255,255,255,0.12) 1px,
              transparent 1px,
              transparent 18px
            ),
            repeating-linear-gradient(
              112deg,
              rgba(80,100,60,0.06) 0px,
              rgba(80,100,60,0.06) 2px,
              transparent 2px,
              transparent 36px
            )
          `,
        }}
        aria-hidden="true"
      />

      {/* borda superior — sombra que separa do conteúdo */}
      <div
        className="absolute inset-x-0 top-0 h-[3px] pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(60,80,50,0.30) 0%, rgba(60,80,50,0.06) 100%)" }}
        aria-hidden="true"
      />

      {/* borda inferior brilhante — luz rasando a borda de baixo */}
      <div
        className="absolute inset-x-0 bottom-0 h-[3px] pointer-events-none"
        style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.62) 45%, rgba(255,255,255,0.35) 100%)" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-4 lg:px-10">
        <div className="flex items-center justify-between">

          {/* Quem somos */}
          <Link
            href="/quem-somos"
            className="group flex items-center gap-2 text-sm font-medium transition-all"
            style={{ color: "#2e4030" }}
            data-testid="text-footer-slogan"
          >
            <span style={{ textShadow: "0 1px 0 rgba(255,255,255,0.50)" }}>
              {settings?.footer_slogan || "Quem somos"}
            </span>

            {/* risco de lápis no hover — igual ao nav */}
            <span className="relative block h-[3px] w-12 overflow-visible">
              <span
                className="absolute inset-0 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(38,30,18,0.72) 10%, rgba(52,42,24,0.88) 40%, rgba(44,36,20,0.82) 70%, transparent 100%)",
                  transform: "rotate(-0.6deg) skewX(-1deg)",
                  filter: "blur(0.3px)",
                  borderRadius: "1px",
                  top: "0px",
                }}
              />
            </span>
          </Link>

          {/* Ícone admin */}
          <Link
            href="/admin"
            data-testid="link-admin"
            aria-label="Admin"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all"
            style={{
              background: "rgba(255,255,255,0.32)",
              border: "1px solid rgba(80,110,60,0.28)",
              color: "#3d5035",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), 0 1px 3px rgba(60,90,50,0.15)",
            }}
          >
            <span className="text-sm leading-none" role="img" aria-label="ferramentas">🛠️</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
