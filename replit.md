# Chegou a Conta, Diretora 📊

## Overview
"Chegou a Conta, Diretora" is a financial management dashboard designed for Brazilian public schools. Its primary purpose is to offer school directors a consolidated view of their school's financial health, educational metrics, infrastructure status, and regional performance benchmarks. The project aggregates data from various Brazilian government sources, including INEP Censo Escolar, FNDE PDDE, and IDEB.

Key capabilities include:
- School lookup and comparison using INEP codes.
- Tracking of PDDE (Programa Dinheiro Direto na Escola) funds, covering balances, executions, and account statuses.
- Presentation of Census data (Censo Escolar) for enrollment, staff, classrooms, and infrastructure.
- Display of IDEB performance data, benchmarked against municipal, micro-regional, and national levels.
- Provision of diagnostic summaries and "trilha" (learning path) recommendations tailored to each school.
- Integration of Saúde Municipal data from SUS APIs, including health facilities, municipal indicators (CNES, SISVAN, SINASC, SIM, PNI, SINAN, SISAGUA), and an ETL pipeline for data ingestion.
- Arboviroses (dengue/zika/chikungunya): cascade de fontes oficiais — InfoDengue → Mosqlimate (Fiocruz/PUC-Rio, requer `MOSQLIMATE_UID_KEY`) → SINAN/MS (microdados via apidadosabertos.saude.gov.br, agregados pelo ETL `scripts/sync-arboviroses-sinan.mjs` na tabela `arboviroses_sinan_municipio`). Como Fiocruz interrompeu série Zika em fev/2024, SINAN cobre o gap para Zika 2025/2026.
- Display of curated MEC YouTube streams and news from CONSED/UNDIME.
- Enriched municipal context with TRIA (Triagem para Risco de Insegurança Alimentar), PSE (Programa Saúde na Escola — card por escola na v10: rótulo principal SEMPRE "Município aderiu" para todas as esferas (PSE é estruturalmente municipal por desenho do Decreto 6.286/2007); para escolas ESTADUAIS/FEDERAIS/PRIVADAS, pequena legenda em itálico explica que essas escolas só entram no PSE quando a rede delas autoriza, refletido no badge "Escola aderiu". Casamento da escola atual feito por **INEP** (`N.escola.co_entidade` ↔ `ctxMunData.pse.escolas[].inep`), com fallback por nome normalizado quando o INEP não está disponível. Badges per-escola: Escola aderiu / Prioritária / Maioria PBF. Fonte: Relatórios APS / `pse-municipios.json`. Sync em duas etapas: (1) `scripts/sync-pse-municipios.mjs` itera todos os ciclos publicados pelo MS; (2) `scripts/enrich-pse-with-inep.mjs` casa cada escola PSE com `censo_escolas` por (município + nome normalizado + esfera→tp_dependencia) adicionando o campo `inep` (~85,8% de casamento; ambíguos ficam `inep:null` e o frontend cai no fallback por nome). O sync principal já invoca o enriquecimento ao final quando há `RAILWAY_DATABASE_URL`.), Censo 2022 demographic data, and CNEAS (ONGs and Social Assistance Entities) information.
- Enhanced institutional support features, including curated gov.br services and detailed FUNAI contact information for Indigenous presence.

The application is a pre-compiled Node.js application, with its frontend built using React and served as a static SPA.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Overall Pattern
The project uses a **monorepo with a compiled distribution model**. The source code is compiled into a `dist/` directory, which is then deployed. The frontend is a React SPA, and the backend is an Express Node.js server.

### Frontend
- **React SPA** bundled into ES modules.
- **Tailwind CSS** for styling, utilizing CSS variables for theming and dark mode.
- Google Fonts (DM Sans, Fira Code, Geist Mono, Architects Daughter) are used for typography.
- Framer Motion is used for animations.

### Backend
- **Node.js + Express** server, bundled as CommonJS.
- Serves both the REST API and static frontend assets from a single process.
- Implements in-memory caching for analytics, stats, and scraped data (e.g., MEC YouTube streams, news, AI explanations, PDDE data).
- Includes an ETL pipeline for ingesting health data (`Saúde Municipal`) from various SUS sources into a PostgreSQL database.

### Database
- **Production:** PostgreSQL hosted on Railway.
- **Development:** SQLite (`file:dev.db`).
- The application uses an ORM/query layer compatible with both PostgreSQL and SQLite.
- Large datasets like Censo Escolar and IDEB are pre-imported.

### Data Sources and Integrations
- **FNDE PDDE Info:** Live scraping for school fund data.
- **INEP Censo Escolar, IDEB, etc.:** Pre-imported CSV data.
- **SUS Open Data API (`apidadosabertos.saude.gov.br`):** Lazy ingestion of health establishment and indicator data.
- **SIDRA API (IBGE):** For Censo 2022 demographic indicators and socio-economic data.
- **dados.gov.br (CKAN API):** For CNEAS data, with a local pre-generated JSON fallback due to API changes.
- **OpenAI API:** For AI-powered explanations of regulations and municipal contact data (gpt-4o-mini).
- **YouTube:** Scraped for MEC live streams.
- **CONSED and UNDIME websites:** Scraped for educational news.

### Caching Strategy
- Extensive use of in-memory caching for performance, including pre-warmed caches for census statistics, IDEB maps, and frequently accessed data.
- Specific caches for PDDE data (per school/year), AI explanations (24hr TTL), MEC streams (30min TTL), and news (10min TTL).
- A global in-memory index (`_simIdx`) for school similarity searches.

### Geographic Data
- `municipio-centroides.json`: Latitude/longitude centroids for Brazilian municipalities.
- `municipio-microregiao.json`: Mapping of municipality codes to micro-region data.

### Build & Deployment
- Production target: Railway (Docker-based).
- Development environment: VS Code devcontainer.
- Build scripts (`scripts/deploy-build.sh`) produce a compact bundle.
- Start scripts (`start.sh`) handle database setup.

## External Dependencies

| Dependency | Purpose |
|---|---|
| Railway PostgreSQL | Production database |
| SQLite (dev.db) | Development database |
| FNDE PDDE Info (`fnde.gov.br`) | Live school fund data scraping |
| INEP / Censo Escolar | School census data |
| SUS Open Data API (`apidadosabertos.saude.gov.br`) | Health data for Saúde Municipal |
| SIDRA API (IBGE) | Demographic and socio-economic indicators |
| dados.gov.br (CKAN API) | CNEAS data for ONGs and social assistance |
| OpenAI API | AI explanations and data enrichment |
| YouTube | MEC stream scraping |
| CONSED & UNDIME websites | Educational news scraping |
| Google Fonts | Typography assets |
| @napi-rs/canvas | Optional server-side canvas rendering |
| Zod | Runtime type validation |
| Tailwind CSS | Utility-first CSS framework |
| PostCSS + Autoprefixer | CSS processing |