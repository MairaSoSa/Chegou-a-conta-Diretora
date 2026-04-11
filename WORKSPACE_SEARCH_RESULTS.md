# Workspace Search Results: Teacher Data & Backend Structure

**Search Date**: 2026-04-10  
**Workspace**: Chegou-a-Conta-Diretora  
**Status**: Pre-compiled distribution model (source not present, only compiled dist/)

---

## 1. TEACHER/DOCENTE-RELATED DATA

### 1.1 Data Fields (From Censo Escolar)

Extracted from [attached_assets/Pasted-1-Organiza-o-da-Jornada-Escolar.txt](attached_assets/Pasted-1-Organiza-o-da-Jornada-Escolar-Isso-muito-importante-e_1774229976356.txt) & [Pasted-Modelo-Final.txt](attached_assets/Pasted-Modelo-Final-Camadas-e-Dimens-es-da-Escola-Camada-1-Est_1774231581991.txt):

**Dimensão 9 — Docentes (Teacher/Faculty Dimension)**

Core fields:

- `Formação dos professores` - Teacher formation/training
- `Licenciatura` - Bachelor's degree qualification
- `Pós-graduação` - Postgraduate/master's qualifications
- `Professores efetivos` - Permanent/tenure track teachers
- `Professores temporários` - Temporary/contract teachers
- `Professores por disciplina` - Teachers by subject area
- `Professores por etapa` - Teachers by education level
- `Regime de trabalho` - Employment regime (full-time, part-time, etc.)
- `Tempo de experiência` - Years of teaching experience

**Associated Indicator**:

- **IRD** (Índice de Regularidade do Corpo Docente) = **"Teacher Body Regularization Index"**
  - Measures consistency/stability of teaching staff
  - Related to teacher turnover and permanence

### 1.2 Formação Docente (Teacher Formation) References

- Multiple mentions of "formação docente" and "formação continuada" (continuing professional development)
- Listed as critical component in dashboard for school quality assessment
- Part of broader school capacity indicators

### 1.3 Where Teacher Data Lives

- **Database Table**: `censo_escolar` (SQLite dev / PostgreSQL prod)
  - ~200K+ records per year across 5555 municipalities
  - 2020–2025 data imported from INEP CSV files
- **Import Location**: Data loaded during startup from Censo Escolar 2025 directory or Google Drive historical microdados

---

## 2. EDUCATIONAL INDICATORS & DIMENSIONS

### 2.1 Core Educational Indicators (from replit.md)

```
IDEB   — Índice de Desenvolvimento da Educação Básica
TDI    — Taxa de Distorção Idade-Série
IRD    — Índice de Regularidade do Corpo Docente ⭐ (TEACHER INDEX)
ATU    — (Not explicitly defined in docs)
HAD    — (Not explicitly defined in docs)
DSU    — (Not explicitly defined in docs)
ICG    — Complexidade de Gestão da Escola
INSE   — Nível Socioeconômico
SAEB   — Sistema de Avaliação da Educação Básica
```

### 2.2 10 Dimensions of School Assessment Model

From [Pasted-Modelo-Final.txt](attached_assets/Pasted-Modelo-Final-Camadas-e-Dimens-es-da-Escola-Camada-1-Est_1774231581991.txt):

| Dimension                 | Index                        | Fields                                    |
| ------------------------- | ---------------------------- | ----------------------------------------- |
| 1. Infrastructure         | Índice de Infraestrutura     | Water, electricity, bathrooms, labs, etc. |
| 2. Technology             | (varies)                     | Internet, WiFi, computers, digital boards |
| 3. Accessibility          | (varies)                     | Wheelchair access, adaptive equipment     |
| 4. Service Quality        | (varies)                     | Food, water quality, sanitation           |
| 5. Learning Spaces        | (varies)                     | Libraries, study rooms, common areas      |
| 6. Pedagogical Resources  | (varies)                     | Teaching materials, textbooks, equipment  |
| 7. Student Support        | (varies)                     | Psychology, social work, health services  |
| 8. Management             | Índice de Gestão             | Leadership, planning, evaluation          |
| 9. **Docentes** ⭐        | **Índice Docente**           | **Teacher formation, experience, tenure** |
| 10. Educational Offerings | Índice de Oferta Educacional | Grades, modalities, languages offered     |

---

## 3. BACKEND STRUCTURE & DATA PROCESSING

### 3.1 Backend Architecture

**Compiled Entry Points**:

- [dist/bootstrap.cjs](dist/bootstrap.cjs) — Main entrypoint
  - Decompresses `index.cjs.gz`
  - Patches for Node.js compatibility (createRequire, cache-bust headers)
  - Loads native SQLite binary (optional)
- [dist/index.cjs](dist/index.cjs) (gzipped as `index.cjs.gz`)
  - Main Express server bundle
  - Handlers for all API endpoints
  - Data loading and caching logic
- [dist/pdde-fields-extension.cjs](dist/pdde-fields-extension.cjs)
  - Separate module for PDDE (Programa Dinheiro Direto na Escola) financial fields

**Framework**: Node.js + Express 5  
**Language**: TypeScript (compiled to CommonJS)  
**ORM**: Drizzle (supports PostgreSQL + SQLite)  
**Validation**: Zod runtime schema validation

### 3.2 Caching Strategy

**Pre-warmed at startup** (~450ms):

- IDEB analytics maps for all 5555 municipalities + 27 UFs
- Census statistics per year (2022–2025)
- Geographic data (centroids, micro-regions)

**Per-school caching**:

- PDDE data cached with `_cached_at` timestamp
- Financial executions, fund balances, account status

### 3.3 Key Data Structures

**Censo Escolar Database Schema** (inferred from references):

```
CREATE TABLE censo_escolar (
  -- School identification
  co_escola         INTEGER PRIMARY KEY,      -- INEP school code
  nm_escola         TEXT,                     -- School name

  -- Staff / Docentes
  qt_docentes       INTEGER,                  -- Total teachers
  qt_docentes_efetivos INTEGER,              -- Permanent teachers
  qt_docentes_temporarios INTEGER,           -- Temporary/contract teachers

  -- Academic structure
  qt_turmas         INTEGER,                  -- Number of classes/turmas
  qt_matriculas     INTEGER,                  -- Total enrollments

  -- Indicators (imported)
  indice_regularidade_docente DECIMAL,       -- IRD value
  ideb_score        DECIMAL,

  -- Other census fields (385 columns historically in microdados)
  -- Infrastructure, modality offerings, accessibility, etc.

  ano_censo         INTEGER,                  -- Census year (2020–2025)
  uf_code           TEXT,                     -- State UF code
  municipio_code    INTEGER                   -- Municipality IBGE code
);
```

---

## 4. DATA SOURCES & APIs

### 4.1 External Data Sources

| Source                 | Type           | Use                                               | Frequency          | Reference                                             |
| ---------------------- | -------------- | ------------------------------------------------- | ------------------ | ----------------------------------------------------- |
| **INEP Censo Escolar** | CSV Import     | School census (enrollment, staff, infrastructure) | Annual             | Pre-imported 2020–2025                                |
| **INEP Microdados**    | CSV Import     | Detailed 385-column dataset (2020–2024)           | Annual             | ~200MB per year from Google Drive                     |
| **FNDE PDDE Info**     | HTTP Scraping  | Fund balances, executions, disbursements          | Live (10s timeout) | www.fnde.gov.br/pddeinfo/...                          |
| **INEP IDEB Datasets** | CSV Import     | Performance indices                               | Annual             | Table: ideb, tdi, ird, saeb, etc.                     |
| **IBGE**               | Reference Data | Municipality codes, centroids, regions            | Static             | municipio-centroides.json, municipio-microregiao.json |

### 4.2 API Endpoints (from README-PT.md)

**School Data**:

- `GET /api/censo-escolar/:inep` — Fetch all census data for school by INEP code
- `GET /api/censo-escolar/insights/:scope` — Infrastructure analysis by scope

**Financial (PDDE)**:

- `GET /api/pdde/execfin/:coEscola` — Financial execution details
- `GET /api/pdde/residual/:coEscola` — Residual funds

**Admin**:

- `POST /api/admin/login` — Authenticate with ADMIN_PASSWORD
- `GET /api/admin/stats` — System statistics

### 4.3 Data Import Process

From [start.sh](start.sh) & [replit.md](replit.md):

**Production** (Railway PostgreSQL):

1. Database connection via `RAILWAY_DATABASE_URL` environment variable
2. SSL-secured connection
3. Pre-populated with Censo Escolar 2020–2025

**Development** (SQLite):

1. Large dev.db (~10 GB) downloaded from Google Drive on first run
2. Validated with `PRAGMA quick_check` + table existence check
3. Fallback location: `/data/dev.db` (in devcontainer)

**CSV Import for Census**:

- Files: Escola, Matrícula, Docente, Turma, Gestor (2025 format)
- Location: `Dados/Censo Escolar 2025/`
- Process: Parsed and inserted into DB

---

## 5. FILE STRUCTURE & COMPILATION

### 5.1 Directory Layout

```
/workspaces/Chegou-a-conta-Diretora/
├── dist/                           # COMPILED OUTPUT (what ships)
│   ├── bootstrap.cjs               # Decompressor + entrypoint
│   ├── index.cjs                   # Main server (compiled TypeScript)
│   ├── index.cjs.gz                # Compressed bundle
│   ├── pdde-fields-extension.cjs   # PDDE module
│   └── public/                     # Frontend assets
│       ├── index.html              # Single-page app
│       ├── assets/                 # JS/CSS (React compiled)
│       └── (favicon, fonts, etc.)
│
├── scripts/
│   ├── sync-mec-contatos.mjs       # Updates ministry composition data
│   ├── validate-build.mjs          # Build validation
│   ├── prune-dist-assets.sh        # Cleanup legacy assets
│   └── deploy-build.sh             # Production build
│
├── attached_assets/                # Documentation assets
│   ├── Pasted-Porte-e-Oferta...    # School size & offerings
│   ├── Pasted-Modelo-Final...      # 10D school assessment model ⭐
│   └── Pasted-Organiza-o...        # School organization & docentes ⭐
│
├── tailwind.config.ts              # Tailwind CSS config
├── postcss.config.js               # PostCSS config
├── package.json                    # Dependencies
├── .env.example                    # Config template
├── start.sh                        # App startup script
├── health-check.sh                 # Health monitoring
└── replit.md                       # Architecture docs ⭐

```

### 5.2 Why No Source Code?

- This is a **pre-compiled monorepo**
- Original TypeScript/React source lives in private `client/` directory
- Only compiled `dist/` is committe to repo
- Patches applied directly to compiled files (documented in [STABILITY.md](STABILITY.md))

---

## 6. TYPE DEFINITIONS & SCHEMAS

### 6.1 Validation (Zod)

Located in compiled code, but patterns evident from [STABILITY.md](STABILITY.md):

```typescript
// Example validation pattern used throughout
import { z } from "zod";

const SchoolDataSchema = z.object({
  co_escola: z.number(),
  nm_escola: z.string(),
  qt_docentes: z.number().nonnegative(),
  qt_docentes_efetivos: z.number().nonnegative(),
  indexeIndicadorDocente: z.number().min(0).max(100).optional(),
  // ... more fields
});

type SchoolData = z.infer<typeof SchoolDataSchema>;
```

### 6.2 Key Exported Data Structures

**School Object**:

- INEP code
- Name, municipality, state
- Census year
- Enrollment counts (by grade/modality)
- **Teacher counts** (total, permanent, contract)
- Indicator scores (IDEB, IRD, ICG)
- Infrastructure inventory
- Financial data (PDDE)

**Teacher/Docente Metrics**:

- Permanent/temporary split
- Formation level distribution
- Experience ranges
- Subject area assignments
- Employment regime
- IRD (regularization index)

---

## 7. ENVIRONMENT & CONFIGURATION

### 7.1 Key Environment Variables

```bash
# Database
DATABASE_URL              # PostgreSQL (prod) or file:dev.db (dev)
RAILWAY_DATABASE_URL      # Railway PostgreSQL connection

# Auth
ADMIN_PASSWORD            # Simple auth for admin endpoints

# Optional
OPENAI_API_KEY           # For AI features (optional)
OPENAI_MODEL             # Usually gpt-4o-mini

# Runtime
NODE_ENV                  # development / production
PORT                      # 5000 (dev), 8080 (railway)
```

### 7.2 Build Command

```bash
npm run preflight         # Validate config + structure
npm run validate:config   # Check .env
npm run validate:structure # Detect legacy assets
npm start                 # Start server
npm run dev              # Development mode
```

---

## 8. EXISTING TEACHER/FORMAÇÃO DOCENTE DATA REFERENCES

### 8.1 Mentions in Codebase

| File                                                                                                                                        | Reference                             | Context                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------- |
| [replit.md:53](replit.md)                                                                                                                   | `IRD` – Regularidade do Corpo Docente | Educational indicator table from INEP                |
| [dist/bootstrap.cjs:530](dist/bootstrap.cjs)                                                                                                | "quantidade de docentes"              | Censo description for school directors               |
| [dist/public/assets/index-v21.js:182](dist/public/assets/index-v21.js)                                                                      | "Docente" CSV import header           | 2025 census import file listing                      |
| [attached_assets/Pasted-1-...txt](attached_assets/Pasted-1-Organiza-o-da-Jornada-Escolar-Isso-muito-importante-e_1774229976356.txt)         | Section 8: Docentes                   | Detailed fields for teacher data                     |
| [attached_assets/Pasted-Modelo-Final.txt](attached_assets/Pasted-Modelo-Final-Camadas-e-Dimens-es-da-Escola-Camada-1-Est_1774231581991.txt) | Dimensão 9 — Docentes                 | 10-dimension assessment model with teacher dimension |

### 8.2 What's NOT Yet Visible

- Source code for docent-specific API endpoints (compiled)
- Detailed data transformation logic (compiled)
- Historical teacher data visualization components (compiled React code)
- Teacher comparison/benchmarking algorithm (if exists)

---

## 9. HOW TO ACCESS EXISTING TEACHER DATA

### 9.1 Database Query (Dev)

```sql
-- Get teacher data for a specific school
SELECT
  co_escola,
  qt_docentes,
  qt_docentes_efetivos,
  qt_docentes_temporarios,
  -- Additional fields from Censo would need to be explored
FROM censo_escolar
WHERE co_escola = [INEP_CODE]
  AND ano_censo = 2025;
```

### 9.2 Via API

```bash
# Fetch all school data (includes teacher counts)
curl http://localhost:5000/api/censo-escolar/[INEP_CODE]

# Returns object with structure (inferred):
{
  "co_escola": 35101001,
  "nm_escola": "Escola Estadual XYZ",
  "qt_docentes": 45,
  "qt_docentes_efetivos": 42,
  "qt_docentes_temporarios": 3,
  "indices": {
    "ird": 0.87,          # Teacher regularization
    // ... other indicators
  },
  // ... more fields
}
```

---

## 10. SUMMARY & RECOMMENDATIONS

### 10.1 Current State

✅ **Teacher data exists** and is actively imported from INEP Censo Escolar  
✅ **IRD index** (regularidade do corpo docente) is calculated and stored  
✅ **Teacher field breakdown** (efetivos vs temporários) is tracked  
✅ **API endpoints** exist to fetch school data (includes teacher counts)  
❌ **Source code not available** (compiled distribution only)  
❌ **Teacher formation details** (licenciatura, pós-grad distribution) not yet visible in exports

### 10.2 To Extend Teacher (Docente) Data

1. **Identify new fields** from Censo Escolar microdados (formação, experiência, disciplina)
2. **Add Zod schema** validations for teacher data
3. **Extend API endpoints** to return detailed teacher breakdowns
4. **Add visualizations** (React components, compiled in dist/)
5. **Create benchmarking logic** (compare teacher quality across schools/regions)

### 10.3 Key Files for Teacher Features

- Database: `censo_escolar` table (PostgreSQL/SQLite)
- API: `dist/index.cjs` (endpoints returning teacher counts)
- UI: `dist/public/assets/index-v21.js` (school data dashboards)
- Config: `replit.md` (data structure reference)
- Docs: `attached_assets/Pasted-Modelo-Final.txt` (teacher dimension specs)

---

## 11. RELATED DOCUMENTATION

- [replit.md](replit.md) — Full architecture overview
- [STABILITY.md](STABILITY.md) — Safety guide for making changes
- [README-PT.md](README-PT.md) — Portuguese documentation + quick start
- [Pasted-Modelo-Final.txt](attached_assets/Pasted-Modelo-Final-Camadas-e-Dimens-es-da-Escola-Camada-1-Est_1774231581991.txt) — 10-dimension school assessment model (includes teacher dimension)
- [start.sh](start.sh) — Database initialization & data import logic
