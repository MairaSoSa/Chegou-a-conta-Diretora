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
-   **Database**: SQLite with Drizzle ORM for type-safe queries. Uses performance-critical pragmas and includes a `stats_cache` table for persistent 24-hour caching of expensive aggregations, with auto-invalidation and warming. External API calls use a 15-minute in-memory cache.
-   **Content Management**: All application content is dynamically managed via the admin panel and fetched from the database.
-   **AI Security**: The AI system prompt enforces strict adherence to the knowledge base, refusing out-of-scope queries and topics not present in the provided content. A low temperature setting (0.3) is used to minimize hallucination.
-   **Data Management**: Emphasizes local data processing and includes mechanisms for tracking and resolving AI's unanswered questions.

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