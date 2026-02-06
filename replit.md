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

## Recent Changes

### PDF & Word Document Support for AI Knowledge Base (Feb 2026)
- AI Documents (Base IA) now accepts PDF (.pdf), Word (.docx, .doc) files in addition to text files
- Server-side text extraction: POST /api/admin/extract-text endpoint (admin auth required)
- Uses pdf-parse v2 (PDFParse class) for PDF text extraction
- Uses mammoth for Word document text extraction
- Frontend detects file type by extension and sends binary to server for extraction
- Fallback: also checks X-File-Name header for format detection when Content-Type is generic
- Accepted formats in UI: .pdf, .docx, .txt, .md, .csv

### Voice Input & Unanswered Questions Tracking (Feb 2026)
- Added microphone button to AI chat for voice input (record → transcribe → send as text)
- Uses MediaRecorder API in frontend, OpenAI gpt-4o-mini-transcribe for speech-to-text
- Audio auto-converted to compatible format via ffmpeg (WebM/MP4/OGG → WAV)
- Recording UI shows red "Gravando..." indicator and amber "Transcrevendo..." state
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
- Temperature set to 0.3 on both chat and audio routes to reduce hallucination
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
- **Database**: PostgreSQL via Drizzle ORM
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
- **Features**: Text chat and voice chat support
- **Voice Processing**: Audio worklet for real-time PCM16 playback, WebM recording

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
  replit_integrations/  # AI chat and audio modules
shared/           # Shared types, schemas, and API contracts
  schema.ts       # Drizzle ORM schema definitions
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### AI Services
- **OpenAI API**: Powers the chat assistant
  - `AI_INTEGRATIONS_OPENAI_API_KEY`: API key
  - `AI_INTEGRATIONS_OPENAI_BASE_URL`: API endpoint
- **FFmpeg**: Required for audio format conversion in voice features

### Third-Party Libraries
- **Radix UI**: Accessible component primitives for shadcn/ui
- **TanStack Query**: Data fetching and caching
- **Zod**: Runtime type validation for API contracts
- **date-fns**: Date formatting utilities

### External Data Sources (Planned)
- Brazilian government public data APIs for school information (INEP)
- FNDE program data for financial tracking
