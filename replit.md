# Chegou a Conta, Diretora!

## Overview
"Chegou a Conta, Diretora!" is a web application designed to assist Brazilian public school principals in managing school finances, particularly for government education programs (PDDE, PNAE, PNATE). The platform aims to simplify complex financial regulations and data, offering features such as an Educational Data Panel, Learning Trail, Programs Library, Tools, Caderno da Diretora (AI-powered chat and document editor), Legislation section (MEC norms and Official Gazettes), and a Calendar & Deadlines. The project envisions a user-friendly experience with a warm, nature-inspired visual style, utilizing earthy colors and hand-drawn aesthetics to make financial management more accessible.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The application features a "Ghibli/territorial" visual style with warm, earthy colors and hand-drawn aesthetics. The UI uses React with TypeScript, Tailwind CSS, shadcn/ui components (New York style), Framer Motion for animations, and Recharts for data visualizations. An accessibility icon is available in the navbar.

**Responsive design**: Navigation uses a custom Framer Motion sidebar drawer for mobile/tablet (< lg = 1024px) — slides in from the left with spring animation, sage gradient matching the header, icon bubbles, item descriptions, and active indicators. Home page (`/`) is a fixed-height notebook on desktop that becomes a full-width scrollable lined-paper page on mobile (≤ 640px). All inner-page grids use `sm:` breakpoints to collapse to 1-column on small phones.

### Technical Implementations
The frontend is built with React, TypeScript, Vite, Wouter for routing, and TanStack React Query for state management. The backend uses Node.js with Express 5 and TypeScript, defining REST API endpoints validated with Zod. Custom esbuild scripts handle server bundling, and Vite manages client builds. Admin authentication uses a Bearer token.

Key Features:
-   **Data Engine**: Processes and stores over 1.1M census records and 5.87M indicator records from INEP, with comprehensive database indexing for efficient retrieval. Supports bulk data imports from INEP's official files, handling large CSVs with batch inserts. **Microdados completos 2020–2025 importados**: todos os 5 anos com 176–202 campos ricos por escola (infraestrutura: água, energia, esgoto, internet, lixo, espaços; matrículas por sexo/raça/faixa etária; docentes; turmas; acessibilidade; equipamentos) via Google Drive (`server/importador-drive.ts`). Banco: 1.3M+ registros no censo_escolar (2020–2025). Admin panel com painel `DriveImportPanel` para reprocessar anos individuais ou todos de uma vez.
-   **Real-time FNDE Integration**: Server-side scrapers extract live financial data from FNDE's PDDEInfo portal (all endpoints use query-string format, NOT path segments). Working endpoints: `escola/consultar` (school details), `consultasaldoentidade` (UEx account balances with month/year picker), `situacaocadastroentidade` (cadastral status, mandato dirigente), `situacaoprestacaoconta` (PC status per program — Adimplente/Inadimplente), `situacaoatendimentoentidade` (repasses per program with monetary values). All parsers use `$("tbody tr")` Cheerio selector. SIGPC (`sigpcadm`) is WAF-blocked for server IPs. OLINDA API (`educacaobasica.fnde.gov.br`) also provides PDDE Saldos and Execução Financeira.
-   **Caderno da Diretora** (`/chat`): Redesigned with two tabs — "Folha de Pesquisa" (AI chat with suggestion chips, sticky notes from API, real-time conversation) and "Editor de Documentos" (form-based document editor with Chrome-style tabs for open docs, per-field textareas, guide sidebar with "linguinhas" progress indicators, and API persistence). State stored in localStorage with autosave + explicit API sync. Components: `client/src/pages/Chat.tsx` (self-contained, replaces previous `DocumentEditor.tsx`).
-   **AI Knowledge Base**: A chat system that responds exclusively using content from an admin-managed knowledge base. It supports text extraction from PDF, Word, and text files and tracks unanswered questions.
-   **Expanded Admin Panel**: Provides CRUD operations for managing glossary, tools, learning trail, programs, AI knowledge base documents, and site settings. Includes CSV upload capabilities.

### System Design Choices
-   **Database**: **Railway PostgreSQL** (migrated from SQLite in full). Drizzle ORM for type-safe queries. `server/pg.ts` provides `pgPool` + `pgGet/pgAll/pgRun` helpers. `server/db.ts` uses `drizzle(pgPool)` as primary connection. Includes a `stats_cache` table for persistent caching of expensive aggregations. External API calls use a 15-minute in-memory cache.
-   **Key Database Tables** (Railway PostgreSQL, 44 tables total):
    - `censo_escolas` (1.32M rows, 45 cols) — main census data; indexed on `co_entidade`
    - `censo_escolar` (VIEW of censo_escolas) — provides `inep`, `ano`, `nome`, `dados` JSON for SQL queries
    - `ideb_escola`, `tdi_escola`, `inse_escola`, etc. — indicator tables (11 total), indexed on `co_entidade`
    - `escola_busca` — full-text search index with TSVector
    - `stats_cache` — persistent cache keyed by `cache_key` column
-   **Performance**: `getEscolaEvolucaoLocal` queries underlying tables directly (not VIEWs) with integer `co_entidade` to use indexes. Response time: ~1s (was 93s with text cast on VIEW).
-   **Content Management**: All application content is dynamically managed via the admin panel and fetched from the database.
-   **AI Security**: The AI system prompt enforces strict adherence to the knowledge base, refusing out-of-scope queries and topics not present in the provided content. A low temperature setting (0.3) is used to minimize hallucination.
-   **Data Management**: Emphasizes local data processing and includes mechanisms for tracking and resolving AI's unanswered questions.
-   **Censo 2025 detalhado**: Tabelas `turma_escola`, `docente_escola`, `gestor_escolar`, `matricula_escola` importadas (~178K escolas cada). Endpoint `/api/escola-censo2025/:inep` retorna breakdown por nível, turno, gênero, faixa etária e raça para matrículas, turmas, docentes e gestor. Frontend usa `useEscolaCenso2025` hook (TTL 24h). Painel "Perfil Censo 2025" no Retrato da escola com contexto territorial (município → microrregião → estado). Novos charts na Evolução: "Turno 2025" (diurno/noturno), "Doc. Gênero 2025" (feminino/masculino), e campos Especial/Profissional integrados ao chart de Matrículas.
-   **Data Gap**: Detailed census fields (gender/racial/age breakdowns: `qt_mat_bas_fem`, `qt_mat_bas_masc`, `qt_mat_bas_branca`, etc.) not in Railway — only in old SQLite Google Drive import. "Perfil dos estudantes" pizza charts show "Sem dados" for these. Admin can run `server/importador-drive.ts` to populate via Google Drive CSVs.

## Demo Data / Codespace Setup

A script `scripts/seed-demo.mjs` inserts 3 realistic demo schools so the dashboard works without the full INEP dataset (~1 hour download):

| INEP     | Escola                               | Cidade           | UF |
|----------|--------------------------------------|------------------|----|
| 35000001 | EMEF JARDIM DAS ACÁCIAS              | São Paulo        | SP |
| 31000002 | EE PROF MARIA DA CONCEIÇÃO SILVA     | Belo Horizonte   | MG |
| 43000003 | EMEF ASSIS BRASIL                    | Porto Alegre     | RS |

Each demo school has 3 years of census data (2022–2024) and 35 educational indicators per school. The `.devcontainer/devcontainer.json` automatically runs this seed after `npm run db:push` when opening in GitHub Codespaces. The `setup.sh` script also runs it as step 4/5.

NPM scripts:
- `npm run seed:demo` — inserts/updates demo school data (idempotent, safe to re-run)
- `npm run setup:data` — downloads and imports the full INEP census data (~1h, ~1.1M schools)

## External Dependencies
-   **Database**: SQLite (`better-sqlite3`), Drizzle ORM
-   **AI Services**: OpenAI API
-   **Frontend Libraries**: Radix UI, TanStack Query, Zod, date-fns
-   **Text Extraction Libraries**: `pdf-parse`, `mammoth`
-   **HTML Parsing**: `cheerio`
-   **External Data Sources**:
    -   INEP: Official Brazilian educational census data
    -   FNDE's PDDEInfo portal: Live financial data for education programs
    -   FNDE's OLINDA API: Financial data for education programs (PDDE SIGPC, PDDE Saldos, PDDE Execução Financeira)
    -   MEC Normas API (`mecnormas.mec.gov.br`)
    -   Imprensa Nacional API (`in.gov.br`) for DOU Federal
    -   Querido Diário API (`queridodiario.ok.org.br`) for Diários Municipais

## Deployment

**Autoscale** deployment (Replit). No SQLite — all data lives in Railway PostgreSQL.

### Strategy
- `start.sh` starts Node.js directly: `node dist/index.cjs` (no database download step)
- `dist/bootstrap.cjs` is optional — made SQLite-optional/graceful so it doesn't crash if SQLite missing
- All 1.3M+ census records are in Railway PostgreSQL (not bundled)
- Build: `bash scripts/deploy-build.sh` compiles client + server into `dist/`

### Required secrets for production
- `RAILWAY_DATABASE_URL` — Railway PostgreSQL connection string
- `OPENAI_API_KEY` — OpenAI API key for Caderno da Diretora AI