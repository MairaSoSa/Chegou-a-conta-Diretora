# Chegou a Conta, Diretora!

## Overview
"Chegou a Conta, Diretora!" is a web application designed to assist Brazilian public school principals in managing school finances, particularly for government education programs (PDDE, PNAE, PNATE). The platform aims to simplify complex financial regulations and data, offering features such as an Educational Data Panel, Learning Trail, Programs Library, Tools, Caderno da Diretora (AI-powered chat and document editor), Legislation section (MEC norms and Official Gazettes), and a Calendar & Deadlines. The project envisions a user-friendly experience with a warm, nature-inspired visual style, utilizing earthy colors and hand-drawn aesthetics to make financial management more accessible.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The application features a "Ghibli/territorial" visual style with warm, earthy colors and hand-drawn aesthetics. The UI uses React with TypeScript, Tailwind CSS, shadcn/ui components (New York style), Framer Motion for animations, and Recharts for data visualizations. An accessibility icon is available in the navbar.

### Technical Implementations
The frontend is built with React, TypeScript, Vite, Wouter for routing, and TanStack React Query for state management. The backend uses Node.js with Express 5 and TypeScript, defining REST API endpoints validated with Zod. Custom esbuild scripts handle server bundling, and Vite manages client builds. Admin authentication uses a Bearer token.

Key Features:
-   **Data Engine**: Processes and stores over 1.1M census records and 5.87M indicator records from INEP, with comprehensive database indexing for efficient retrieval. Supports bulk data imports from INEP's official files, handling large CSVs with batch inserts.
-   **Real-time FNDE Integration**: Server-side scrapers extract live financial data from FNDE portals, including PDDEInfo and OLINDA API. This provides detailed information on school enrollment, bank accounts, transfers, accountability status (PDDEInfo), prestação de contas (SIGPC), bank account balances (PDDE Saldos), and actual payment records (PDDE Execução Financeira).
-   **AI Knowledge Base**: A chat system that responds exclusively using content from an admin-managed knowledge base. It supports text extraction from PDF, Word, and text files and tracks unanswered questions.
-   **Expanded Admin Panel**: Provides CRUD operations for managing glossary, tools, learning trail, programs, AI knowledge base documents, and site settings. Includes CSV upload capabilities.

### System Design Choices
-   **Database**: SQLite with Drizzle ORM for type-safe queries. Uses performance-critical pragmas and includes a `stats_cache` table for persistent 24-hour caching of expensive aggregations, with auto-invalidation and warming. External API calls use a 15-minute in-memory cache.
-   **Content Management**: All application content is dynamically managed via the admin panel and fetched from the database.
-   **AI Security**: The AI system prompt enforces strict adherence to the knowledge base, refusing out-of-scope queries and topics not present in the provided content. A low temperature setting (0.3) is used to minimize hallucination.
-   **Data Management**: Emphasizes local data processing and includes mechanisms for tracking and resolving AI's unanswered questions.

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