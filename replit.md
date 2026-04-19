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

**Critical fix applied (April 2026):** `dist/public/assets/Dashboard-v30.js` L1426 had broken syntax caused by a security card (`seguranca-publica-card`) being nested inside the govserv button card via a double `Bt && (() => {` IIFE pattern. The fix replaced the broken closing `})()] })})() ] });` with `})()] }) })()] })] });` which correctly closes: govserv IIFE (`})()`), govserv button div (`] })`), security Bt IIFE (`})()`), security card (`] })`), and outer children array (`]`).

### Saúde Municipal (April 2026)
New endpoints `/api/saude-municipio/:coIbge` and `/api/saude-backfill?ids=` lazy-ingest data from the SUS open data API (`apidadosabertos.saude.gov.br`) into Postgres tables on Railway:
- **`saude_estabelecimentos`** — CNES facilities (UBS, hospitals, CAPS, UPA, clinics) with geocoordinates, type label, address, phone. Type derived from `codigo_tipo_unidade` via in-bootstrap mapping (`CNES_TIPO_UNIDADE`).
- **`saude_indicadores_municipio`** — fact table for aggregated indicators. Now populated by 5 fontes:
  - **CNES** (lazy via SUS open API): counts per facility type (`cnes_ubs_centro_saude`, `cnes_hospital_geral`, `cnes_caps`, `cnes_upa`, etc.).
  - **SISVAN** (lazy via SUS open API): categorical IMC distribution from API sample (labelled as sample, not population aggregate).
  - **SINASC** (bulk via pysus, 2018–2022): 7 indicadores por município/ano — `sinasc_nascidos_vivos_total`, `sinasc_pct_cesarea`, `sinasc_pct_prenatal_7mais`, `sinasc_pct_baixo_peso`, `sinasc_pct_prematuro`, `sinasc_pct_mae_adolescente`, `sinasc_pct_mae_sem_escolaridade`.
  - **SIM** (bulk via pysus, 2020–2024): 6 indicadores — `sim_obitos_total`, `sim_obitos_menor_1_ano`, `sim_obitos_maternos`, `sim_obitos_externos`, `sim_obitos_evitaveis`, `sim_obitos_covid`.
  - **PNI** (bulk via pysus, 2015–2019): cobertura vacinal por imunobiológico (recorte = código IMUNO; 23 imunos típicos por município/ano). Apenas até 2019 (depois migrou para LocalizaSUS sem download massivo).
  - **SINAN** (bulk via pysus, 2020–2026): doenças de notificação compulsória — Dengue, Chikungunya, Zika, Hepatites virais, Tuberculose, Hanseníase, Violência (incl. doméstica/sexual), Malária, Sífilis (adq./congên./gestante), Meningite, Leptospirose, Chagas aguda, Acid. animal peçonhento. Indicadores: `sinan_<doenca>_casos` e `sinan_<doenca>_obitos` (com `denominador` = casos, metadata `letalidade_pct`). DENG/CHIK/ZIKA chegam até 2026 (dados parciais do ano corrente).
  - **SISAGUA** (bulk via DEMAS API pública `apidadosabertos.saude.gov.br/sisagua/controle-mensal-parametros-basicos`, 2020+): qualidade da água por município/ano. 6 indicadores — `sisagua_pct_amostras_conformes_coliformes` (% ausência), `sisagua_pct_amostras_conformes_ecoli`, `sisagua_pct_cloro_conforme` (>=2,0 e <=5,0 mg/L; portaria 888/2021), `sisagua_pct_turbidez_conforme` (<=5,0 uT), `sisagua_total_amostras_analisadas`, `sisagua_meses_com_dados` (proxy de cumprimento, 0..12). API usa **IBGE6** (Pirapora=`315120`, não 3151206) — conversão automática no módulo. Cap de 50 páginas/(município×ano) para municípios grandes; `parametro=` filter disponível para reduzir volume. Sem auth.
- **`saude_ingestao_log`** — per (município, fonte) status + last fetch. Cache TTL = 30 days. Use `?refresh=1` to force; `?async=1` to refresh in background.
- **`saude_etl_runs`** — audit log de execuções bulk ETL.

Handlers live in `dist/bootstrap.cjs` as `globalThis._saudeMunHandler` / `_saudeBackfillHandler` / `_saudeEtlRunHandler` / `_saudeEtlStatusHandler` (avoids string-escaping pain in route patches). Routes are injected via the `/api/health` anchor.

#### Bulk ETL pipeline (`dist/saude-etl/`)
- **`runner.cjs`** — Node orchestrator. Spawns Python source modules in `.venv-saude/bin/python`, streams JSONL on stdout, batch-upserts (1000-row batches) into `saude_indicadores_municipio` with intra-batch dedup (last-write-wins on the unique key).
- **`sources/sinasc.py`** — pysus.SINASC.download per UF/year, aggregates por CODMUNRES → 7 indicadores.
- **`sources/sim.py`** — pysus.SIM.download(groups='CID10') por UF/year → 6 indicadores (CID10 chapters: V01–Y98 externos, B34.2/U07 covid, capítulo XV maternos, etc.).
- **`sources/pni.py`** — pysus.PNI.download (CPNI files, formato pré-agregado) → cobertura vacinal por imuno. Decimais BR (vírgula) parseados pelo helper.
- **`sources/sisagua.cjs`** — STUB (portal opendatasus.saude.gov.br/dataset/sisagua é SPA com auth Bearer; CSVs históricos não acessíveis sem API token).

#### Conversão IBGE6 → IBGE7
DataSUS usa código IBGE de 6 dígitos (`CODMUNRES`); aplicação usa 7 dígitos. Função `ibge6_to_ibge7` no Python: dígito verificador via Módulo 10 com pesos `[1,2,1,2,1,2]`, subtrai 9 se produto > 9, `chk = (10 - (sum % 10)) % 10`. Validado em Pirapora (`315120` → `3151206`) e capitais.

#### Endpoints admin ETL
- `POST/GET /api/saude-etl/run?source=sinasc|sim|pni&states=ALL|MG,SP&years=2020-2024&co_municipio=3151206` — dispara runner em processo detached, retorna `jobId`/`pid`/`logFile`. Token opcional via `ADMIN_TOKEN` env (header `x-admin-token` ou query `token`).
- `GET /api/saude-etl/status` — lista jobs ativos (com tail do log), counts por fonte, e últimas 30 entradas de `saude_etl_runs`.

#### Operational runbook
1. Smoke test município único: `node dist/saude-etl/runner.cjs --source sinasc --states MG --years 2022 --co-municipio 3151206`
2. Backfill UF: omitir `--co-municipio`. Backfill nacional: `--states ALL`.
3. Logs ficam em `/tmp/etl-<jobId>.log` quando disparado pelo endpoint.
4. Consulta direta: `SELECT fonte, COUNT(*) FROM saude_indicadores_municipio GROUP BY fonte;`

Python env: `.venv-saude/` (Python 3.11 + pysus). Sistema bloqueado por NixOS read-only; venv local é a única forma. Dependência `pg` no node_modules raiz para o runner conectar ao Railway.

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

### MEC YouTube Streams
- **Endpoint:** `/api/mec-streams` — scrapes the MEC YouTube channel streams page (`https://www.youtube.com/@ministeriodaeducacao_MEC/streams`)
- **Cache:** In-memory, 30-minute TTL to avoid hammering YouTube
- **Data:** Returns up to 20 streams with title, URL, live/upcoming status, thumbnails
- **Frontend:** Integrated into the Calendar page (`/calendario`) as MEC-category cards with red styling and "Assistir no YouTube" links
- **Implementation:** Backend endpoint injected via `bootstrap.cjs` patch; frontend integration via direct patches to the minified JS bundles

### Data Sources (External Scraping)
- **FNDE PDDE Info** (`www.fnde.gov.br/pddeinfo/...`): Live scraping for school registration status, fund balances, financial executions, accounts payable status, and attendance data per school per year (2020–2026)
- **INEP Censo Escolar**: Pre-imported CSV data for 2020–2025; stored in DB with 200K+ records per indicator
- **IDEB / TDI / IRD / ATU / HAD / DSU / ICG**: Educational indicator tables imported from INEP datasets

### Caching Strategy
- In-memory + persistent cache for census statistics (pre-warmed at startup per year: 2022, 2023, 2024, 2025)
- IDEB analytics maps pre-computed in memory at startup (~450ms for all municipalities and UFs)
- PDDE data cached per school/year with `_cached_at` timestamp
- **Similares in-memory index** (`globalThis._simIdx`): Full censo_escolar 2025 data (214K schools) + ICG records (179K) preloaded at startup (~15s) into Map for sub-second candidate filtering. Result cache (`globalThis._simCache`) with 1hr TTL.

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

## Known Patches to Compiled Output

Since the source code is not present, all fixes are applied directly to the compiled files in `dist/`.

| File | Patch |
|---|---|
| `dist/public/assets/index-v21.js` | Removed `.slice(0,43)` truncation from `hl-trilha-item-sub` subtitle render — was cutting subtitles to 43 chars. Fix: `(n.subtitle\|\|"").slice(0,43)` → `n.subtitle\|\|""` |
| `dist/public/index.html` | Added `<style>` block with CSS overrides for Trilha sidebar (white-space, overflow, font sizes); added accessibility panel JS for inner pages; added a11y-zoom observer script |
| `dist/public/assets/index-v2.css` | Patched compact sidebar `.hl-trilha-item-sub` and `.hl-trilha-item-title` rules to use `white-space: normal; overflow: visible` |
| `dist/public/assets/postit.css` | Added global (non-media-query) trilha subtitle fix rules |
| `dist/public/painel-educacional.css` | Global CSS with a11y zoom overrides and additional trilha sidebar rules |
| `dist/public/assets/Dashboard-v30.js` | Fixed syntax error (extra `})` at line 884 position 12461-12463) introduced in commit f990b83 — the MEC contacts section had an extra closing paren+brace that prematurely terminated the MEC institutional container div before the Fonte footnote was added to its children array. Removed ` })` (3 chars) to restore brace balance. |
| `dist/public/assets/index-v21.js` / `index-v10-shared.js` | **AiExplica component**: AI explanation feature for Normas cards (Leis fundamentais + Demais Normas) and DOU tab free-text input. Uses `useRef` to track titulo changes and reset stale data. |
| `dist/public/assets/index-v21.js` / `index-v10-shared.js` | **Lo component (DOU)**: Added "Explicar ato do DOU com IA" section with text input for free-text AI explanations of DOU publications. |
| `dist/bootstrap.cjs` | **AI explicar-norma route**: `POST /api/ai/explicar-norma` — calls OpenAI gpt-4o-mini with educator-specific prompt, structured JSON response, 24hr in-memory cache (capped at 500 entries), rate-limited to 10 req/min. |
| `dist/bootstrap.cjs` | **CONSED/UNDIME news route**: `GET /api/noticias-extras` — scrapes consed.org.br and undime.org.br for education news, 10min in-memory cache, merged with existing MEC/FNDE/INEP feed on the calendar page. |
| `dist/public/assets/index-v21.js` / `index-v10-shared.js` | **Calendar news merge**: Added second query to `/api/noticias-extras`, merging CONSED+UNDIME news with existing MEC/FNDE/INEP feed, sorted by date. Badge colors: CONSED=amber, UNDIME=rose. |
| `dist/public/assets/Dashboard-v30.js` | **FNDE contacts populated**: All 8 FNDE directorate entries (Presidência, GABIN, DIRAD, DIRTI, DIFIN, DIRAE, DIGAP, DIGEF) now have `tel` and `email` fields filled with official contact data from gov.br/fnde. |
| `dist/bootstrap.cjs` + `dist/public/assets/Dashboard-v30.js` | **SME IA fill**: `GET /api/secretaria-municipal/ia?municipio=X&uf=Y` uses OpenAI (gpt-4o-mini, temp=0.3) to return structured SME contact data (titular, tel, email, foco, horario, site). 24h cache. Frontend: "Busca Google ↗" replaced by "✨ Preencher com IA" button in the SME card; on click, calls the IA endpoint and populates all SME fields. Button shows "⏳ Buscando..." during load, "✨ Atualizar via IA" after fill. |
| `dist/bootstrap.cjs` + `dist/public/assets/Dashboard-v30.js` | **Censo 2022 / IBGE SIDRA**: `GET /api/contexto-municipal/:co` now fetches t9955 (indicadores demográficos: índice envelhecimento, idade mediana, razão de sexo, pop 60+, pop 0-14, homens/mulheres) and t9951 (taxa de alfabetização 15+) via SIDRA API (apisidra.ibge.gov.br). Requires 7-digit IBGE code. Frontend: card "Perfil Demográfico — Censo 2022 / IBGE" (fundo azul índigo) abaixo do BPC card, exibindo 4 métricas em grade 2×2 + faixas etárias + distribuição por sexo. |
| `dist/bootstrap.cjs` + `dist/public/assets/Dashboard-v30.js` + `scripts/sync-ongs-contatos.mjs` | **ONGs e Entidades de Assistência Social (CNEAS)**: New section in the Equipamentos Públicos accordion, shown below the saúde block. Data from CNEAS (dados.gov.br CKAN API), enriched with CEBAS certification flag. Backend: `ongs` field added to `/api/equipamentos-publicos/:coMunicipio` response + standalone `GET /api/ongs/:coMunicipio` endpoint. Frontend: cards with colored area badges (green=Assistência Social, blue=Saúde, orange=Educação) and purple CEBAS badge. Sync script: `scripts/sync-ongs-contatos.mjs` pre-generates `ongs-contatos.json` from CNEAS+CEBAS; env vars: `ONG_CODIGO_MUNICIPIO`, `ONG_UF`, `ONG_TOP_N`, `ONG_CONTATOS_OUTPUT_JSON`. Runtime fallback queries dados.gov.br CKAN API directly. |
| `dist/bootstrap.cjs` → patches `dist/public/assets/Dashboard-v30.js` | **Serviços gov.br (aba nova em Suporte Institucional)**: Nova aba "Serviços gov.br" no card "Suporte Institucional para Gestão", com 7 serviços do FNDE curados no portal gov.br. Patch em dois passos: (1) adiciona `{ id: "servicos-gov" }` ao array de abas antes do `.map`; (2) injeta bloco IIFE `aa==="servicos-gov"&&(()=>{...})()` antes do `]` que fecha o children array do painel de abas. Dados hardcoded: IDs 9340 (PBLE), 9925 (PAR), 9930 (RPN), 10025 (PNLD), 12620 (PNAE Conta Cartão), 12780 (assinatura eletrônica FNDE), 12920 (PNAE retroativo). Cards com cor por programa (PNLD=azul, PNAE=amarelo, PAR=verde, PBLE=teal, FNDE Digital=roxo, Compras=rosa) + link direto para gov.br. Âncora de detecção: `servicos-gov` no arquivo; âncoras de injeção: `{ id: "sistemas", label: "Sistemas" }].map` e `, B2)) })] });`. |
| `dist/bootstrap.cjs` (~L209-440 handler / ~L1080-1240 frontend) + `funai-contatos.json` | **FUNAI block V3 (Presença Indígena com endereço/telefone/e-mail da CR)**: Backend handler `/api/equipamentos-publicos/:coMunicipio?inep=` enriquece cada CTL/CR com `municipios_atendidos_resolved` / `abrangencia_resolved` / `sede_resolved` (objetos `{co, nome, uf, eh_o_municipio_atual}`) usando cache lazy `globalThis._munNames` carregado uma vez de `censo_escolas`. CTLs ordenadas com `atende_municipio_atual=true` primeiro. **Novo na V3:** carrega lazy `funai-contatos.json` (cache `globalThis._funaiContatos`) com contatos curados das 39 CRs (36/39 telefone, 38/39 e-mail, 36/39 endereço, fonte: pesquisa web em gov.br/funai e portais públicos), faz merge por `sigla` em `cr.contato={endereco,cep,telefones[],emails[]}` e adiciona `funai.ouvidoria_nacional` (0800-208-0399, ouvidoria@funai.gov.br) como fallback. A base GeoServer FUNAI tem campos de contato vazios em 304/304 CTLs e portais gov.br bloqueiam scraping; CTLs continuam sem contato direto (orientação: usar a CR articuladora). Frontend mostra: explicação CTL vs CR, badges contextuais (Escola Indígena, Terra Indígena, matrículas indígenas com %), seção "Quem atende {município}" destacando CTLs responsáveis com badge ✓, card CR com sede nomeada, abrangência (município atual em negrito), **bloco "Contato" com 🏠 endereço+CEP, ☎️ telefones (`tel:` clicáveis) e ✉️ e-mails (`mailto:`)** ou aviso "Contato direto desta CR não catalogado" + link de busca no portal FUNAI quando não há dados, `<details>` colapsável para outras CTLs vinculadas, e links para portais oficiais. Patch idempotente via marcador `/*_FUNAI_V3_*/` + remoção regex de V1 (`Saiba mais sobre a FUNAI`) e V2 (`/\*_FUNAI_V2_\*\/[\s\S]*?\}\)\(\)/` — sem leading comma). Âncora primária: `, !Ta && !a && e.jsx("p", { style: { fontSize: 12, color: "#888"` (fallback "Código IBGE indisponível"); fallback: `_SAUDE_FE_ANCHOR`. |
| `dist/bootstrap.cjs` + `dist/public/assets/Dashboard-v30.js` | **Context cards (Segurança/SINESP, Saúde/DataSUS, Perfil Socioeconômico/IBGE) + ONDH + FUNAI**: Three accordion context cards injected before the CME Suporte Institucional card. CRITICAL BUG FIXED: The context cards patch (`_SUPORTE_ANCHOR` via `indexOf`) found the first of two identical `#d4c4f5` occurrences in the file, injecting `_NEW_CARDS` before it. The anchor ends with `Bt && (() => {` (Bt IIFE #1), and the second occurrence (inner CME content) is inside that IIFE as a statement without `return`. This caused `Unexpected token ']'` at line 1426 col 13 because occurrence 2's `e.jsxs(` and Bt IIFE #1's wrapper `(` were never closed before the second `]` tried to close occurrence 1's `children: [`. FIX: line 1426 changed from `})()] })] });` → `})()] })})() ] });` (adds `)` to close occurrence 2's e.jsxs, `})()` to close+call Bt IIFE #1). Also added idempotent fix-patch in bootstrap.cjs (`_BROKEN_CLOSE` → `_FIXED_CLOSE`) so restarts re-apply the fix if needed. |
| `dist/bootstrap.cjs` + `dist/public/assets/Dashboard-v30.js` | **Segurança Pública block rewrite (April 2026)**: `/api/seguranca-municipio/:coIbge` was broken because `dados.gov.br` CKAN API now returns HTTP 401 (policy change). Rewrote endpoint to use local PostgreSQL DB as primary source: queries `saude_indicadores_municipio` for `sinan_violencia_casos` (SINAN violence cases) and `sim_obitos_externos` / `sim_obitos_total` (SIM external-cause deaths) at municipality level. SINESP CKAN API still attempted as bonus (if it ever becomes available again). Response: `{ ok, naturezas[], municipal_db, sinesp_uf, fonte, nota, sinesp_disponivel }`. UI updated via sub-patch `segui-v2-sinan`: subtitle → "Violência e segurança — SINAN/MS, SIM/MS + SINESP"; section header → "Indicadores de Segurança — Municipal (ano)"; badge → "Municipal"; each indicator card shows `nivel` badge (Municipal/UF) and `unidade`. |

---

### PNAD Contínua removida do Perfil Socioeconômico (April 2026)
Os cards de PNAD Contínua (taxa de desocupação e rendimento habitual) foram **removidos** porque a PNAD Contínua só publica em nível UF e RM/Capitais — não há dado em nível municipal para os ~5.500 municípios do interior. O Censo 2022 (`rendimento_medio_domiciliar` e `taxa_extrema_pobreza`) cobre o espaço com dados em nível municipal.

Sub-patch `pnad-removed-v1` em `_patchDashboardContextCards` reverte a legenda do card, remove os divs dos dois cards e remove o trecho de fonte PNAD do rodapé. Backend `/api/perfil-socioeconomico` voltou a `Promise.allSettled` com 4 fontes (PIB, população, Censo rendimento, Censo extrema pobreza).

#### Histórico (referência)
- A versão anterior tentava buscar PNAD Contínua trimestral em N3/UF derivado de `co6.slice(0,2)`:
- **Taxa de desocupação**: SIDRA tabela 4093, variável 4099, nível UF (N3). Busca os últimos 5 trimestres sequencialmente até encontrar dado disponível.
- **Rendimento médio habitual — todos os trabalhos**: SIDRA tabela 5436, variável 5933, nível UF (N3), filtro Sexo=Total (D4C=6794).
- Derivação do código UF: primeiros 2 dígitos do código IBGE de 6 dígitos (`co6.slice(0,2)`).
- Período retornado em formato humano: ex. "4º trimestre 2024".
- Backend: 2 novas promises async (loop sequencial por trimestre) adicionadas ao `Promise.allSettled` de 4→6 items no `/api/perfil-socioeconomico/:coIbge`.
- Frontend: sub-patches `pnad-continua-socio-v1` (legenda) + `pnad-socio-grid-v1` (cards na grade) em `_patchDashboardContextCards`.
- Indicadores ausentes omitidos silenciosamente; nota de rodapé cita PNAD Contínua separada do PIB Municipal.

### Suporte Institucional (SI) accordion fix (April 2026)
Root cause found and fixed: the `Bt && (() => { e.jsxs("div", { d4c4f5... }) })()` pattern in the compiled Dashboard-v30.js was missing a `return` keyword before `e.jsxs`, so the SI card IIFE always returned `undefined`. React rendered nothing when the accordion was expanded.
- **Fix**: sub-patch `si-iife-return-v1` in `dist/bootstrap.cjs` adds `return` before the first `e.jsxs("div", {borderRadius:"16px"...d4c4f5` inside `Bt && (() => {`.
- **Cosmetic fix**: subtitle had `/* segui-v2-sinan */` embedded as visible string — cleaned up in same patch run.
- Both patches run at startup via the `_patchDashboardContextCards` IIFE in bootstrap.cjs; markers `si-iife-return-v1` and `SINAN/MS, SIM/MS + SINESP` prevent re-application.

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
OPENAI_API_KEY         # OpenAI API key for AI explanations (gpt-4o-mini)
OPENAI_MODEL           # Optional: override AI model (default: gpt-4o-mini)
NODE_ENV               # development / production
PORT                   # Server port (5000 dev, 8080 prod)
ONG_CODIGO_MUNICIPIO   # IBGE municipality code for CNEAS sync (6 or 7 digits)
ONG_UF                 # UF sigla for CNEAS sync (informational, e.g. SP)
ONG_TOP_N              # Max entities to include in ongs-contatos.json (default: 15)
ONG_CONTATOS_OUTPUT_JSON # Output path for sync script (default: ongs-contatos.json)
```