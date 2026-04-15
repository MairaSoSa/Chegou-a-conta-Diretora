# Chegou a Conta, Diretora 📊

## Overview

**Chegou a Conta, Diretora** is a financial management dashboard for Brazilian public schools. It aggregates data from multiple Brazilian government sources (INEP Censo Escolar, FNDE PDDE, IDEB) to give school directors a unified view of their school's financial status, educational indicators, infrastructure, and regional benchmarks.

Key capabilities:
- School lookup and comparison by INEP code
- PDDE (Programa Dinheiro Direto na Escola) fund tracking — balances, executions, and account status scraped live from FNDE
- Census data (Censo Escolar) for enrollment, staff, classrooms, and infrastructure indicators
- IDEB performance data compared at school, micro-region, municipality, and national levels
- Diagnostic summaries and "trilha" (learning path) recommendations per school

The application is a pre-compiled, fully bundled Node.js app. The source is compiled into `dist/` and served via Express. The frontend is a React SPA served as static files from `dist/public/`.

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Overall Pattern
This is a **monorepo with a compiled distribution model**. The actual TypeScript/React source is not present in the repository root — what ships is the compiled output in `dist/`. Developers work in `client/` (React frontend) and a server-side TypeScript codebase, then bundle everything before committing.

### Frontend
- **React SPA** compiled to `dist/public/assets/` as ES modules
- **Tailwind CSS** for styling (configured in `tailwind.config.ts` + `postcss.config.js`)
- CSS variables used extensively for theming (HSL-based color system with dark mode support via `darkMode: ["class"]`)
- Google Fonts loaded: DM Sans, Fira Code, Geist Mono, Architects Daughter
- Framer Motion for animations (`vendor-motion` chunk)
- Single entry HTML at `dist/public/index.html`

### Backend
- **Node.js + Express** server, bundled as CommonJS (`dist/index.cjs`)
- Entrypoint: `dist/bootstrap.cjs`
- PDDE extension module: `dist/pdde-fields-extension.cjs` (loaded separately)
- Serves both the REST API and the static frontend from the same process on a single port (5000 dev / 8080 prod)
- Pre-warms analytics and stats caches on startup (IDEB maps for 5555 municipalities + 27 UFs, census stats by year)

### Database
- **Primary (production):** PostgreSQL on Railway, connected via `RAILWAY_DATABASE_URL` environment variable
- **Development fallback:** SQLite (`file:dev.db`) as indicated by the devcontainer config (`SQLITE_DATABASE_URL`)
- The app uses an ORM/query layer that supports both backends (Drizzle is likely, given `npm run db:push` in devcontainer setup)
- Large dataset (~10 GB SQLite dev.db) historically downloaded from Google Drive at container start; production uses PostgreSQL

### MEC YouTube Streams
- **Endpoint:** `/api/mec-streams` — scrapes the MEC YouTube channel streams page (`https://www.youtube.com/@ministeriodaeducacao_MEC/streams`)
- **Cache:** In-memory, 30-minute TTL to avoid hammering YouTube
- **Data:** Returns up to 20 streams with title, URL, live/upcoming status, thumbnails
- **Frontend:** Integrated into the Calendar page (`/calendario`) as MEC-category cards with red styling and "Assistir no YouTube" links
- **Implementation:** Backend endpoint injected via `bootstrap.cjs` patch; frontend integration via direct patches to the minified JS bundles

### Data Sources (External Scraping)
- **FNDE PDDE Info** (`www.fnde.gov.br/pddeinfo/...`): Live scraping for school registration status, fund balances, financial executions, accounts payable status, and attendance data per school per year (2020–2026)
- **INEP Censo Escolar**: Pre-imported CSV data for 2020–2025; stored in DB with 200K+ records per indicator
- **IDEB / TDI / IRD / ATU / HAD / DSU / ICG**: Educational indicator tables imported from INEP datasets

### Caching Strategy
- In-memory + persistent cache for census statistics (pre-warmed at startup per year: 2022, 2023, 2024, 2025)
- IDEB analytics maps pre-computed in memory at startup (~450ms for all municipalities and UFs)
- PDDE data cached per school/year with `_cached_at` timestamp
- **Similares in-memory index** (`globalThis._simIdx`): Full censo_escolar 2025 data (214K schools) + ICG records (179K) preloaded at startup (~15s) into Map for sub-second candidate filtering. Result cache (`globalThis._simCache`) with 1hr TTL.

### Geographic Data
- `municipio-centroides.json`: Lat/lng centroids for all ~5570 Brazilian municipalities (by IBGE code)
- `municipio-microregiao.json`: Maps municipality codes to micro-region names and codes

### Build & Deployment
- **Production target:** Railway (Docker-based), port 8080
- **Dev container:** VS Code devcontainer on Node 22, port 5000
- Build script: `scripts/deploy-build.sh` (produces ~3.5MB bundle)
- Start script: `start.sh` (handles DB download/setup before launching Express)
- Validation scripts: `scripts/validate-build.mjs` (detects legacy assets), `scripts/prune-dist-assets.sh` (cleans old versioned files)
- Pre-flight check: `npm run preflight` = validate config + validate structure

### Authentication
- Simple admin password via `ADMIN_PASSWORD` environment variable (set to `admin2024` in devcontainer)
- No OAuth or JWT system apparent from the available files

### Optional Dependencies
- `@napi-rs/canvas`: Native canvas rendering for chart/image generation; optional — app degrades gracefully when absent (logs warning but continues)

---

## Known Patches to Compiled Output

Since the source code is not present, all fixes are applied directly to the compiled files in `dist/`.

| File | Patch |
|---|---|
| `dist/public/assets/index-v21.js` | Removed `.slice(0,43)` truncation from `hl-trilha-item-sub` subtitle render — was cutting subtitles to 43 chars. Fix: `(n.subtitle\|\|"").slice(0,43)` → `n.subtitle\|\|""` |
| `dist/public/index.html` | Added `<style>` block with CSS overrides for Trilha sidebar (white-space, overflow, font sizes); added accessibility panel JS for inner pages; added a11y-zoom observer script |
| `dist/public/assets/index-v2.css` | Patched compact sidebar `.hl-trilha-item-sub` and `.hl-trilha-item-title` rules to use `white-space: normal; overflow: visible` |
| `dist/public/assets/postit.css` | Added global (non-media-query) trilha subtitle fix rules |
| `dist/public/painel-educacional.css` | Global CSS with a11y zoom overrides and additional trilha sidebar rules |
| `dist/public/assets/Dashboard-v30.js` | Fixed syntax error (extra `})` at line 884 position 12461-12463) introduced in commit f990b83 — the MEC contacts section had an extra closing paren+brace that prematurely terminated the MEC institutional container div before the Fonte footnote was added to its children array. Removed ` })` (3 chars) to restore brace balance. |
| `dist/public/assets/index-v21.js` / `index-v10-shared.js` | **AiExplica component**: AI explanation feature for Normas cards (Leis fundamentais + Demais Normas) and DOU tab free-text input. Uses `useRef` to track titulo changes and reset stale data. |
| `dist/public/assets/index-v21.js` / `index-v10-shared.js` | **Lo component (DOU)**: Added "Explicar ato do DOU com IA" section with text input for free-text AI explanations of DOU publications. |
| `dist/bootstrap.cjs` | **AI explicar-norma route**: `POST /api/ai/explicar-norma` — calls OpenAI gpt-4o-mini with educator-specific prompt, structured JSON response, 24hr in-memory cache (capped at 500 entries), rate-limited to 10 req/min. |
| `dist/bootstrap.cjs` | **CONSED/UNDIME news route**: `GET /api/noticias-extras` — scrapes consed.org.br and undime.org.br for education news, 10min in-memory cache, merged with existing MEC/FNDE/INEP feed on the calendar page. |
| `dist/public/assets/index-v21.js` / `index-v10-shared.js` | **Calendar news merge**: Added second query to `/api/noticias-extras`, merging CONSED+UNDIME news with existing MEC/FNDE/INEP feed, sorted by date. Badge colors: CONSED=amber, UNDIME=rose. |
| `dist/public/assets/Dashboard-v30.js` | **FNDE contacts populated**: All 8 FNDE directorate entries (Presidência, GABIN, DIRAD, DIRTI, DIFIN, DIRAE, DIGAP, DIGEF) now have `tel` and `email` fields filled with official contact data from gov.br/fnde. |
| `dist/bootstrap.cjs` + `dist/public/assets/Dashboard-v30.js` | **SME IA fill**: `GET /api/secretaria-municipal/ia?municipio=X&uf=Y` uses OpenAI (gpt-4o-mini, temp=0.3) to return structured SME contact data (titular, tel, email, foco, horario, site). 24h cache. Frontend: "Busca Google ↗" replaced by "✨ Preencher com IA" button in the SME card; on click, calls the IA endpoint and populates all SME fields. Button shows "⏳ Buscando..." during load, "✨ Atualizar via IA" after fill. |
| `dist/bootstrap.cjs` + `dist/public/assets/Dashboard-v30.js` | **Censo 2022 / IBGE SIDRA**: `GET /api/contexto-municipal/:co` now fetches t9955 (indicadores demográficos: índice envelhecimento, idade mediana, razão de sexo, pop 60+, pop 0-14, homens/mulheres) and t9951 (taxa de alfabetização 15+) via SIDRA API (apisidra.ibge.gov.br). Requires 7-digit IBGE code. Frontend: card "Perfil Demográfico — Censo 2022 / IBGE" (fundo azul índigo) abaixo do BPC card, exibindo 4 métricas em grade 2×2 + faixas etárias + distribuição por sexo. |
| `dist/bootstrap.cjs` + `dist/public/assets/Dashboard-v30.js` + `scripts/sync-ongs-contatos.mjs` | **ONGs e Entidades de Assistência Social (CNEAS)**: New section in the Equipamentos Públicos accordion, shown below the saúde block. Data from CNEAS (dados.gov.br CKAN API), enriched with CEBAS certification flag. Backend: `ongs` field added to `/api/equipamentos-publicos/:coMunicipio` response + standalone `GET /api/ongs/:coMunicipio` endpoint. Frontend: cards with colored area badges (green=Assistência Social, blue=Saúde, orange=Educação) and purple CEBAS badge. Sync script: `scripts/sync-ongs-contatos.mjs` pre-generates `ongs-contatos.json` from CNEAS+CEBAS; env vars: `ONG_CODIGO_MUNICIPIO`, `ONG_UF`, `ONG_TOP_N`, `ONG_CONTATOS_OUTPUT_JSON`. Runtime fallback queries dados.gov.br CKAN API directly. |
| `dist/bootstrap.cjs` → patches `dist/public/assets/Dashboard-v30.js` | **Serviços gov.br (aba nova em Suporte Institucional)**: Nova aba "Serviços gov.br" no card "Suporte Institucional para Gestão", com 7 serviços do FNDE curados no portal gov.br. Patch em dois passos: (1) adiciona `{ id: "servicos-gov" }` ao array de abas antes do `.map`; (2) injeta bloco IIFE `aa==="servicos-gov"&&(()=>{...})()` antes do `]` que fecha o children array do painel de abas. Dados hardcoded: IDs 9340 (PBLE), 9925 (PAR), 9930 (RPN), 10025 (PNLD), 12620 (PNAE Conta Cartão), 12780 (assinatura eletrônica FNDE), 12920 (PNAE retroativo). Cards com cor por programa (PNLD=azul, PNAE=amarelo, PAR=verde, PBLE=teal, FNDE Digital=roxo, Compras=rosa) + link direto para gov.br. Âncora de detecção: `servicos-gov` no arquivo; âncoras de injeção: `{ id: "sistemas", label: "Sistemas" }].map` e `, B2)) })] });`. |
| `dist/bootstrap.cjs` + `dist/public/assets/Dashboard-v30.js` | **Context cards (Segurança/SINESP, Saúde/DataSUS, Perfil Socioeconômico/IBGE) + ONDH + FUNAI**: Three accordion context cards injected before the CME Suporte Institucional card. CRITICAL BUG FIXED: The context cards patch (`_SUPORTE_ANCHOR` via `indexOf`) found the first of two identical `#d4c4f5` occurrences in the file, injecting `_NEW_CARDS` before it. The anchor ends with `Bt && (() => {` (Bt IIFE #1), and the second occurrence (inner CME content) is inside that IIFE as a statement without `return`. This caused `Unexpected token ']'` at line 1426 col 13 because occurrence 2's `e.jsxs(` and Bt IIFE #1's wrapper `(` were never closed before the second `]` tried to close occurrence 1's `children: [`. FIX: line 1426 changed from `})()] })] });` → `})()] })})() ] });` (adds `)` to close occurrence 2's e.jsxs, `})()` to close+call Bt IIFE #1). Also added idempotent fix-patch in bootstrap.cjs (`_BROKEN_CLOSE` → `_FIXED_CLOSE`) so restarts re-apply the fix if needed. |

---

## External Dependencies

| Dependency | Purpose | Notes |
|---|---|---|
| **Railway PostgreSQL** | Production database | Connected via `RAILWAY_DATABASE_URL`; uses SSL |
| **SQLite (dev.db)** | Development database | ~10 GB file, historically from Google Drive |
| **FNDE PDDE Info** (`fnde.gov.br`) | Live school fund data | HTTP scraping; 10s timeout; failures are non-fatal and cached |
| **INEP / Censo Escolar** | School census data | Pre-imported into DB; not live-scraped |
| **Google Drive** | Dev DB download source | Used in `start.sh`; rate-limited and unreliable at scale |
| **Google Fonts** | Typography | DM Sans, Fira Code, Geist Mono, Architects Daughter |
| **@napi-rs/canvas** | Server-side canvas rendering | Optional native module; skipped if unavailable |
| **Zod** | Runtime type validation | devDependency used in validation scripts |
| **Tailwind CSS** | Utility-first styling | Config in `tailwind.config.ts` |
| **PostCSS + Autoprefixer** | CSS processing | Config in `postcss.config.js` |

### Key Environment Variables
```
RAILWAY_DATABASE_URL   # PostgreSQL connection string (production)
SQLITE_DATABASE_URL    # SQLite path (development: file:dev.db)
ADMIN_PASSWORD         # Simple admin auth password
OPENAI_API_KEY         # OpenAI API key for AI explanations (gpt-4o-mini)
OPENAI_MODEL           # Optional: override AI model (default: gpt-4o-mini)
NODE_ENV               # development / production
PORT                   # Server port (5000 dev, 8080 prod)
ONG_CODIGO_MUNICIPIO   # IBGE municipality code for CNEAS sync (6 or 7 digits)
ONG_UF                 # UF sigla for CNEAS sync (informational, e.g. SP)
ONG_TOP_N              # Max entities to include in ongs-contatos.json (default: 15)
ONG_CONTATOS_OUTPUT_JSON # Output path for sync script (default: ongs-contatos.json)
```