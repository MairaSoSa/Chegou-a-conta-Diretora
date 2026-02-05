# A Conta Chegou, Diretora!

## Overview

A web application designed to help Brazilian school principals manage public school finances. The platform simplifies financial management for education programs (PDDE, PNAE, PNATE) by providing:

- **Dashboard**: School data visualization using public government data (INEP code lookup)
- **Learning Trail (Trilha)**: Step-by-step learning path with Amazonian river/boat theme
- **Programs Library**: Documentation for government education funding programs
- **Tools (Ferramentas)**: Templates, checklists, and spreadsheets organized by action verbs
- **AI Chat**: Question-answering assistant for financial management queries

The interface uses a warm, nature-inspired "Ghibli/territorial" visual style with earthy colors and hand-drawn aesthetics.

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
- **API Design**: REST endpoints defined in `shared/routes.ts` with Zod validation
- **Build**: Custom esbuild script bundles server; Vite builds client

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines all tables
- **Migrations**: Drizzle Kit handles schema pushes (`db:push`)
- **Tables**: schools, programs, program_details, tools, conversations, messages

### AI Integration
- **Provider**: OpenAI API (configured via environment variables)
- **Features**: Text chat and voice chat support
- **Voice Processing**: Audio worklet for real-time PCM16 playback, WebM recording

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route pages
    hooks/        # Custom React hooks
server/           # Express backend
  replit_integrations/  # AI chat and audio modules
shared/           # Shared types, schemas, and API contracts
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