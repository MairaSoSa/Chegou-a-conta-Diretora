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

### Data Sources (External Scraping)
- **FNDE PDDE Info** (`www.fnde.gov.br/pddeinfo/...`): Live scraping for school registration status, fund balances, financial executions, accounts payable status, and attendance data per school per year (2020–2026)
- **INEP Censo Escolar**: Pre-imported CSV data for 2020–2025; stored in DB with 200K+ records per indicator
- **IDEB / TDI / IRD / ATU / HAD / DSU / ICG**: Educational indicator tables imported from INEP datasets

### Caching Strategy
- In-memory + persistent cache for census statistics (pre-warmed at startup per year: 2022, 2023, 2024, 2025)
- IDEB analytics maps pre-computed in memory at startup (~450ms for all municipalities and UFs)
- PDDE data cached per school/year with `_cached_at` timestamp

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
NODE_ENV               # development / production
PORT                   # Server port (5000 dev, 8080 prod)
```