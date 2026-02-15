# Chegou a Conta, Diretora!

## Overview

A web application designed to help Brazilian school principals manage public school finances. The platform simplifies financial management for education programs (PDDE, PNAE, PNATE) by providing:

- **Dashboard**: School data visualization using public government data (INEP code lookup)
- **Learning Trail (Trilha)**: Step-by-step learning path with Amazonian river/boat theme
- **Programs Library**: Documentation for government education funding programs
- **Tools (Ferramentas)**: Templates, checklists, and spreadsheets organized by action verbs
- **AI Chat**: Question-answering assistant for financial management queries
- **Admin Panel**: Password-protected content management system at /admin

The interface uses a warm, nature-inspired "Ghibli/territorial" visual style with earthy colors and hand-drawn aesthetics.

## Development Setup

This project runs on **Replit** with Node.js 20+ and includes AI integrations for chat functionality.

**Quick Start:**
```bash
npm install
npm run dev
```

Access the application at the URL provided by Replit.

## Preparação para o GitHub

Para enviar este projeto para o GitHub, siga estes passos:
1.  **Variáveis de Ambiente:** Configure os seguintes segredos no seu repositório GitHub ou ambiente local:
    - `SQLITE_DATABASE_URL`: Defina como `file:dev.db` (local) ou o caminho do seu banco de dados de produção.
    - `ADMIN_PASSWORD`: Sua senha para o painel administrativo.
    - `OPENAI_API_KEY`: Necessário para o Chat de IA.
2.  **Banco de Dados:** O arquivo `dev.db` está excluído do controle de versão para evitar vazamento de dados. Execute `npm run db:push` para inicializar um novo banco de dados.
3.  **Build:** Execute `npm run build` para gerar a versão de produção na pasta `dist`.

**Início Rápido:**
```bash
npm install
npm run dev
```

## Recent Changes

### Self-Sufficient Local Data Engine (Feb 2026)
- **Complete api-escolas parity**: Platform mirrors ALL endpoints from api-escolas.replit.app locally
- **server/importador.ts**: Comprehensive data engine with 15+ functions: import, query, aggregate, statistics
- **Bulk import system**: Admin-triggered background import from external API with progress tracking
  - POST `/api/admin/importar` with optional `tipos[]` and `anos[]` filters
  - Supports 9 data types: censo_escolar, ideb, icg, inse, tdi, ird, taxas_rendimento, taxa_nao_resposta, saeb
  - Paginated import (100 records/page, max 500 pages per type/year)
  - Import progress persisted in `importacao_status` table
- **On-demand single school import**: Schools not in local DB are auto-imported from external API on first access
- **Complete REST API endpoints** (all local-first):
  - `GET /api/info` - API metadata and local stats
  - `GET /api/escola/buscar?nome=X` - Search schools by name
  - `GET /api/escola/:inep` - Complete school data (all years, all indicators)
  - `GET /api/censo-escolar/:ano/escolas` - List schools with filters (uf, municipio, nome, dependencia, localizacao, situacao)
  - `GET /api/censo-escolar/:ano/escolas/:inep` - School census detail
  - `GET /api/censo-escolar/:ano/escolas/estatisticas` - Aggregated statistics
  - `GET /api/{ideb|icg|inse|tdi|ird|taxa-rendimento|taxa-nao-resposta|saeb}/:ano/escolas` - Indicator lists with pagination
  - `GET /api/{indicator}/:ano/escolas/:inep` - Individual indicator detail
  - Legacy `/api/indicador/*` routes maintained for backward compatibility
- **Admin Import UI**: New "Importar Dados" tab in admin panel with:
  - Selectable data types for targeted import
  - Real-time progress bars with page/record counts
  - Local record counts per indicator type
  - Import history with status badges
- Database tables: `censo_escolar`, `indicadores_educacionais`, `importacao_status`
- Environment variable `EXTERNAL_API_URL` configurable (defaults to https://api-escolas.replit.app)

### Dashboard Cleanup - Remove SIGPC & Fictitious Data (Feb 2026)
- Removed SIGPC integration entirely (WAF blocks cloud server requests from FNDE)
  - Deleted `server/scraper/sigpc.ts`, SIGPC routes from `server/routes.ts`, `client/src/hooks/use-sigpc.ts`
  - Removed all SIGPC UI sections from Dashboard (resumido + completo modes)
- Removed all hardcoded fictitious/demo data constants from Dashboard:
  - DEMO_SCHOOL, DEFAULT_ENROLLMENT_HISTORY, DEFAULT_IDEB_DATA, DEFAULT_REPASSES_DATA, etc.
  - Removed demo mode (showDemo state) entirely
- Removed sections that depended 100% on hardcoded data: Conselho Escolar, VAAR, Elegibilidade a Programas, Conectividade, Benchmark
- Dashboard now shows only real data: PDDE Info (live) + admin-uploaded CSV datasets
- Sections that depend on admin datasets only render when data exists (no fallbacks)
- Dashboard reduced from ~2075 lines to ~1302 lines

### FNDE PDDEInfo Live Data Integration (Feb 2026)
- New server-side scraper (`server/scraper/pdde.ts`) extracts school financial data from FNDE's PDDEInfo portal in real-time
- Converts the FNDE HTML response (iso-8859-1 encoded) using cheerio for parsing
- API route: GET `/api/pdde/:inep?ano=YYYY` - public, no auth required
- Data extracted: school info, enrollment by level, UEx (Unidade Executora) with CNPJ, bank accounts with balances, UEx/EEx situation (mandatos, prestação de contas, adesão), destinações/repasses with custeio/capital breakdown
- Client hook: `usePddeInfo(inep, ano)` with 5-min stale time and retry=1
- Dashboard defaults to previous year (currentYear - 1) since FNDE data for current year may not be published yet
- Dashboard integration:
  - Resumido mode: real enrollment count, total paid, bank accounts summary, FNDE situation
  - Completo mode: full PDDE section with year selector, UEx details, bank accounts table, situation cards, destinações table with totals, enrollment by level grid
  - School data section uses PDDE data for name, city, UEx, CNPJ when available
  - Enrollment breakdown shows PDDE levels instead of hardcoded series when available
- Year selector allows switching between last 6 years of FNDE data
- Accessibility icon moved from floating button to navbar (next to logo) using React Context

### PDF & Word Document Support for AI Knowledge Base (Feb 2026)
- AI Documents (Base IA) now accepts PDF (.pdf), Word (.docx, .doc) files in addition to text files
- Server-side text extraction: POST /api/admin/extract-text endpoint (admin auth required)
- Uses pdf-parse v2 (PDFParse class) for PDF text extraction
- Uses mammoth for Word document text extraction
- Frontend detects file type by extension and sends binary to server for extraction
- Fallback: also checks X-File-Name header for format detection when Content-Type is generic
- Accepted formats in UI: .pdf, .docx, .txt, .md, .csv

### Unanswered Questions Tracking (Feb 2026)
- Created unanswered_questions table to track questions AI can't answer from knowledge base
- Pattern matching on AI response detects refusals (e.g., "não tenho essa informação")
- Excludes out-of-scope refusals (e.g., "só posso ajudar com gestão financeira")
- New admin tab "Pendentes IA" shows pending/resolved unanswered questions
- Admin can mark questions as resolved or delete them
- Admin panel now has 8 tabs: Glossário, Ferramentas, Trilha, Programas, Dashboard, Base IA, Pendentes IA, Configurações

### AI Knowledge Base Security Hardening (Feb 2026)
- System prompt completely rewritten with strict "REGRA FUNDAMENTAL — OBRIGATÓRIA E INVIOLÁVEL" framing
- AI now ONLY responds using content from the knowledge base (admin-managed content)
- Explicit refusal for out-of-scope topics and questions not in the knowledge base
- Programs + program details now included in AI knowledge base (were missing before)
- Temperature set to 0.3 on chat route to reduce hallucination
- Knowledge base delimited with clear markers: "BASE DE CONHECIMENTO (ÚNICA FONTE DE VERDADE)"
- Empty knowledge base handling: tells users content is being set up
- Chat responses rendered with react-markdown for formatted output with clickable links

### Expanded Admin Panel (Feb 2026)
- Admin panel expanded from 3 to 7 tabs: Glossário, Ferramentas, Trilha, Programas, Dashboard, Base IA, Configurações
- Programs tab: CRUD for PDDE/PNAE/PNATE programs and their details
- Dashboard tab: CSV upload system with downloadable templates for 9 data categories (enrollment, IDEB, repasses, etc.)
- Base IA tab: AI knowledge base document management - uploaded docs restrict chatbot responses
- Configurações tab: Editable site settings (site_title, footer_slogan, footer_text) fetched dynamically
- Dashboard page uses database data with fallback to hardcoded demo constants
- AI chat system prompt now injects knowledge base + glossary + tools + trilha + programs content
- Footer dynamically fetches settings from database
- All new admin routes validated with Zod schemas
- Insert schemas properly omit auto-generated fields (id, lastUpdated)

### Admin Panel & CMS (Feb 2026)
- Added admin panel at `/admin` with password authentication (Bearer token, default password: "admin2024")
- Full CRUD operations for Glossary, Tools, and Trilha content types
- Database seeding on server startup with 27 glossary terms, 22 tools, and 25 learning trail units
- All frontend pages now fetch content from the database API instead of hardcoded arrays
- Admin routes protected under `/api/admin/*` prefix

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui components (New York style)
- **Animations**: Framer Motion for page transitions
- **Charts**: Recharts for data visualization

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ESM modules
- **API Design**: REST endpoints defined in `server/routes.ts` with Zod validation
- **Build**: Custom esbuild script bundles server; Vite builds client
- **Admin Auth**: Bearer token authentication via `ADMIN_PASSWORD` env var (defaults to "admin2024")

### Data Storage
- **Database**: SQLite via better-sqlite3 and Drizzle ORM (env var: `SQLITE_DATABASE_URL`, defaults to `file:dev.db`)
- **Schema Location**: `shared/schema.ts` defines all tables
- **Migrations**: Drizzle Kit handles schema pushes (`db:push`)
- **Tables**: schools, programs, program_details, tools, glossary, trilha_units, conversations, messages, site_settings, dashboard_datasets, ai_documents, unanswered_questions
- **Seeding**: `server/seed.ts` auto-seeds on startup if tables are empty

### Content Management
- **Glossary**: Terms with definitions, letter grouping, and icon names (Lucide icon names stored as strings)
- **Tools**: Documents/templates with category, type, featured flag, and sort order
- **Trilha Units**: Learning units with JSON sections (text, checklist, tips, practice) and materials
- **Icon Rendering**: Frontend uses ICON_MAP to convert icon name strings to Lucide React components

### API Routes
- **Public**: `/api/glossary`, `/api/tools`, `/api/trilha`, `/api/trilha/:unitId`
- **Admin** (requires Bearer token): `/api/admin/glossary`, `/api/admin/tools`, `/api/admin/trilha` (CRUD)
- **Auth**: `/api/admin/login` (POST with password)

### AI Integration
- **Provider**: OpenAI API (configured via environment variables)
- **Features**: Text chat support, document upload for knowledge base (PDF, Word, Text)
- **Implementation**: Server-side chat routes in `server/replit_integrations/chat/`

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route pages (including Admin.tsx)
    hooks/        # Custom React hooks
server/           # Express backend
  seed.ts         # Database seeding logic
  storage.ts      # Storage interface with CRUD operations
  routes.ts       # API routes (public + admin)
  scraper/        # FNDE data scrapers (PDDE, SIGPC)
  replit_integrations/  # AI modules
    chat/         # Chat functionality
    object_storage/  # File upload handling
shared/           # Shared types, schemas, and API contracts
  schema.ts       # Drizzle ORM schema definitions
```

## External Dependencies

### Database
- **SQLite**: Primary database via better-sqlite3, connection via `SQLITE_DATABASE_URL` environment variable (defaults to `file:dev.db`)
- **Drizzle ORM**: Type-safe database queries and schema management

### AI Services
- **OpenAI API**: Powers the chat assistant
  - `AI_INTEGRATIONS_OPENAI_API_KEY`: API key
  - `AI_INTEGRATIONS_OPENAI_BASE_URL`: API endpoint
### Third-Party Libraries
- **Radix UI**: Accessible component primitives for shadcn/ui
- **TanStack Query**: Data fetching and caching
- **Zod**: Runtime type validation for API contracts
- **date-fns**: Date formatting utilities

### External Data Sources (Planned)
- Brazilian government public data APIs for school information (INEP)
- FNDE program data for financial tracking
