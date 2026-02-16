# Chegou a Conta, Diretora!

## Overview

"Chegou a Conta, Diretora!" is a web application designed to empower Brazilian public school principals with tools for managing school finances, particularly for government education programs (PDDE, PNAE, PNATE). The platform aims to simplify complex financial regulations and data, offering features such as:

- **Educational Data Panel**: Provides a comprehensive overview of national school data from over 215,000 schools, including interactive charts and detailed school profiles sourced from INEP census data.
- **Learning Trail (Trilha)**: A structured, themed learning path to guide principals through financial management concepts.
- **Programs Library**: A repository of documentation for government funding programs.
- **Tools (Ferramentas)**: Curated templates, checklists, and spreadsheets to assist in various financial tasks.
- **Caderno da Diretora (Principal's Notebook)**: A two-tab interface at `/chat`: (1) **Folha de Pesquisa** (Research Chat) with AI-powered Q&A, expandable citation blocks ("📌 Fontes usadas"), "Salvar como nota" and "Copiar" buttons on each response, saved notes panel; (2) **Editor de Documentos** with 4 document templates (Ata de Reunião, Ofício, Pesquisa de Preços, Relatório de Execução), INEP auto-fill header lookup, TipTap rich text editor with toolbar, debounced autosave (3s), AI assistant panel (rewrite, grammar, completeness, checklist, inconsistencies analysis), quality indicators (red/yellow/green), and version history (keeps 10 versions). Backend: `server/caderno-routes.ts` with SQLite tables (`caderno_documents`, `caderno_document_versions`, `caderno_notes`, `caderno_sources`). Frontend component: `client/src/components/caderno/DocumentEditor.tsx`.
- **Legislation Section**: A two-tab interface: (1) **Normas do MEC** (unified view, no sub-tabs) showing 12 fundamental education laws pinned at the top of page 0 (when no search/filter is active) with a "Para a Diretora" column providing child-friendly plain-language explanations of each law, followed by 4,359+ MEC norms auto-loaded from `mecnormas.mec.gov.br/pesquisa/api` with inline search, type filtering, pagination, ementa summaries below each norm, and vigência status badges showing Vigente/Com alteração/Revogada with correlation details; (2) **Diário Oficial** with sub-tabs for DOU Federal (Imprensa Nacional API via `in.gov.br`), Diários Municipais (Querido Diário API via `queridodiario.ok.org.br` covering 350+ municipalities), and DOE Estados (direct links to all 27 state official gazette portals with search URL templates for 6 states).
- **Calendar & Deadlines (Calendário)**: A dedicated page showing 18 recurring educational deadlines (PDDE, PNAE, PNATE, FUNDEB, Censo Escolar, SAEB, etc.) organized by month with urgency indicators, plus real-time news scraped from MEC, FNDE, and INEP official portals (gov.br). Monthly selector allows filtering by month. News section updates from 3 federal education sources.
- **Admin Panel**: A secure content management system for platform administrators.

The project envisions a user-friendly experience with a warm, nature-inspired "Ghibli/territorial" visual style, utilizing earthy colors and hand-drawn aesthetics to make financial management more accessible.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The application features a "Ghibli/territorial" visual style, characterized by warm, earthy colors and hand-drawn aesthetics. The UI utilizes React with TypeScript, styled using Tailwind CSS and shadcn/ui components (New York style), with Framer Motion for animations and Recharts for data visualizations. An accessibility icon is available in the navbar.

### Technical Implementations
The frontend is built with React and TypeScript, using Vite, Wouter for routing, and TanStack React Query for state management. The backend is powered by Node.js with Express 5 and TypeScript, defining REST API endpoints validated with Zod. A custom esbuild script bundles the server, while Vite handles client builds. Admin authentication uses a Bearer token.

### Feature Specifications
- **Data Engine**: A comprehensive local-first data engine processes and stores 1.1M+ census records across 5 years (2020-2024, ~215K schools/year) and 5.87M+ indicator records across 14 INEP indicators (ICG, TDI, IRD, taxas_rendimento, ATU, HAD, DSU, AFD, IDEB, INSE, SAEB, IED, taxa_nao_resposta) with full multi-year coverage. Annual indicators (ICG, TDI, IRD, taxas_rendimento, ATU, HAD, DSU, AFD) cover 2020-2024; IDEB covers 2019, 2021, 2023 (biennial); INSE covers 2021, 2023; SAEB covers proficiency scores; IED covers teacher effort levels 1-6 (2020-2024, ~130K records/year); taxa_nao_resposta covers non-response rates (2020-2024, ~128-131K records/year). TNR files use `CODIGO` column (not `CO_ENTIDADE`) and column names like `FUN_CAT4`, `MED_CAT4`. Census data includes 90-97 infrastructure fields per year (water, energy, sanitation, internet, equipment, accessibility, materials, professionals, bathrooms). It supports bulk data imports from INEP's official Excel/CSV files, SQL-optimized queries with raw SQLite for performance-critical paths, and comprehensive database indexing (including composite indexes on ano+dependencia, ano+localizacao, ano+situacao, ano+uf) for efficient data retrieval. The school detail view displays data across ALL available years with evolution charts (LineChart for multiple years, BarChart for single year) using the `/api/escola-evolucao/:inep` endpoint. Census import uses `server/import-censo-lite.mjs` which handles large CSV files (200MB+) with batch inserts (20K batch size) via better-sqlite3 directly. For large files, use `server/chunk-import.mjs` which supports start-line offset and INSERT OR REPLACE for resumable imports. The import system handles different column naming conventions across years (e.g., 2020 files use `tap_FUN` vs 2021+ using `1_CAT_FUN` for taxas_rendimento). IDEB files use `ID_ESCOLA` instead of `CO_ENTIDADE` for the school code column and have headers at row index 9. INSE files are direct XLSX downloads (not ZIP archives) from the `nivel_socioeconomico` path on INEP's servers and also use `ID_ESCOLA`. The 2024 census CSV is located at a different path structure (`microdados_censo_escolar_2024/dados/`) compared to earlier years (`censo_YYYY/`).
- **Real-time FNDE Integration**: Server-side scrapers extract live financial data from FNDE portals. The PDDE Info scraper (`server/scraper/pdde.ts`) fetches real data from `https://www.fnde.gov.br/pddeinfo/pddeinfo/escola/consultar` including school enrollment, UEx info, bank accounts, transfers, and accountability status. The SIGPC scraper (`server/scraper/sigpc.ts`) attempts the real SIGPC API (`/sigpcadm/publico/json/util/localizarPc`) with graceful fallback when the WAF blocks requests — it returns proper unavailability status instead of mock data. The Dashboard shows a "Dados Financeiros (PDDE / SIGPC)" section with clear messaging when either system is temporarily unavailable. Frontend hooks: `client/src/hooks/use-pdde.ts`, `client/src/hooks/use-sigpc.ts`.
- **AI Knowledge Base**: The AI chat system is designed to respond exclusively using content from an admin-managed knowledge base. It supports text extraction from PDF, Word, and text files for populating the knowledge base and tracks unanswered questions for administrative review.
- **Expanded Admin Panel**: The admin panel provides comprehensive CRUD operations for managing glossary terms, tools, learning trail units, and government programs. It includes a CSV upload system for various data categories, a dedicated section for AI knowledge base document management, and site settings configuration.

### System Design Choices
- **Database**: SQLite is used as the primary database with Drizzle ORM for type-safe queries. The schema is defined in `shared/schema.ts`, and Drizzle Kit manages schema pushes.
- **Content Management**: All application content (glossary, tools, learning trail units, programs) is managed through the admin panel and fetched from the database, ensuring dynamic content delivery.
- **AI Security**: The AI system prompt enforces strict adherence to the knowledge base, refusing out-of-scope queries and topics not present in the provided content. A low temperature setting (0.3) is used to minimize hallucination.
- **Data Management**: The system emphasizes local data processing, reducing reliance on external APIs where possible, and includes mechanisms for tracking and resolving AI's unanswered questions.

## External Dependencies

- **Database**: SQLite (via `better-sqlite3`), Drizzle ORM
- **AI Services**: OpenAI API for chat functionality
- **Frontend Libraries**: Radix UI (for shadcn/ui), TanStack Query, Zod, date-fns
- **Text Extraction Libraries**: `pdf-parse` (for PDFs), `mammoth` (for Word documents)
- **HTML Parsing**: `cheerio` (for FNDE scraper)
- **External Data Sources**:
    - **INEP**: Official Brazilian educational census data (microdata CSVs and indicator Excel files)
    - **FNDE's PDDEInfo portal**: Live financial data for education programs