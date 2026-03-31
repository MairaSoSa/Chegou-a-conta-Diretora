-- ============================================================
-- CAMADA DE COMPATIBILIDADE: Railway PG → Schema do app
-- ============================================================

-- ── VIEW: censo_escolar ──────────────────────────────────────
DROP VIEW IF EXISTS censo_escolar CASCADE;
CREATE VIEW censo_escolar AS
SELECT
  ROW_NUMBER() OVER (ORDER BY ano, co_entidade) AS id,
  co_entidade::text AS inep,
  ano,
  no_entidade AS nome,
  no_municipio AS municipio,
  sg_uf AS uf,
  CASE tp_dependencia
    WHEN 1 THEN 'Federal'
    WHEN 2 THEN 'Estadual'
    WHEN 3 THEN 'Municipal'
    WHEN 4 THEN 'Privada'
    ELSE tp_dependencia::text
  END AS dependencia,
  CASE tp_localizacao
    WHEN 1 THEN 'Urbana'
    WHEN 2 THEN 'Rural'
    ELSE tp_localizacao::text
  END AS localizacao,
  CASE tp_situacao_funcionamento
    WHEN 1 THEN 'Em Atividade'
    WHEN 2 THEN 'Paralisada'
    WHEN 3 THEN 'Extinta'
    ELSE tp_situacao_funcionamento::text
  END AS situacao,
  COALESCE(qt_mat_bas, 0) AS matriculas,
  COALESCE(qt_doc_bas, 0) AS docentes,
  COALESCE(qt_tur_bas, 0) AS turmas,
  jsonb_build_object(
    'co_municipio', co_municipio,
    'tp_dependencia', tp_dependencia,
    'tp_localizacao', tp_localizacao,
    'qt_mat_bas', qt_mat_bas,
    'qt_mat_inf', qt_mat_inf,
    'qt_mat_fund', qt_mat_fund,
    'qt_mat_med', qt_mat_med,
    'qt_mat_eja', qt_mat_eja,
    'qt_doc_bas', qt_doc_bas,
    'qt_doc_inf', qt_doc_inf,
    'qt_doc_fund', qt_doc_fund,
    'qt_doc_med', qt_doc_med,
    'qt_tur_bas', qt_tur_bas,
    'qt_tur_inf', qt_tur_inf,
    'qt_tur_fund', qt_tur_fund,
    'qt_tur_med', qt_tur_med,
    'qt_salas_utilizadas', qt_salas_utilizadas,
    'qt_salas_utilizadas_dentro', qt_salas_utilizadas_dentro,
    'qt_salas_utilizadas_fora', qt_salas_utilizadas_fora,
    'in_agua_potavel', in_agua_potavel,
    'in_energia_rede_publica', in_energia_rede_publica,
    'in_esgoto_rede_publica', in_esgoto_rede_publica,
    'in_internet', in_internet,
    'in_banda_larga', in_banda_larga,
    'in_laboratorio_informatica', in_laboratorio_informatica,
    'in_biblioteca', in_biblioteca,
    'in_quadra_esportes', in_quadra_esportes,
    'in_alimentacao', in_alimentacao,
    'no_regiao', no_regiao,
    'co_regiao', co_regiao,
    'no_uf', no_uf,
    'co_uf', co_uf,
    'no_mesorregiao', no_mesorregiao,
    'no_microrregiao', no_microrregiao
  )::text AS dados,
  NULL::bigint AS updated_at
FROM censo_escolas;

-- ── VIEW: indicadores_educacionais ───────────────────────────
DROP VIEW IF EXISTS indicadores_educacionais CASCADE;
CREATE VIEW indicadores_educacionais AS
  SELECT co_entidade::text AS inep, ano, 'ied'       AS tipo, dados_json::text AS dados, NULL::bigint AS updated_at FROM ied_escola
  UNION ALL
  SELECT co_entidade::text,          ano, 'icg',               dados_json::text,          NULL FROM icg_escola
  UNION ALL
  SELECT co_entidade::text,          ano, 'inse',              dados_json::text,          NULL FROM inse_escola
  UNION ALL
  SELECT co_entidade::text,          ano, 'ird',               dados_json::text,          NULL FROM ird_escola
  UNION ALL
  SELECT co_entidade::text,          ano, 'afd',               dados_json::text,          NULL FROM afd_escola
  UNION ALL
  SELECT co_entidade::text,          ano, 'atu',               dados_json::text,          NULL FROM atu_escola
  UNION ALL
  SELECT co_entidade::text,          ano, 'tdi',               dados_json::text,          NULL FROM tdi_escola
  UNION ALL
  SELECT co_entidade::text,          ano, 'rendimento',        dados_json::text,          NULL FROM rendimento_escola
  UNION ALL
  SELECT co_entidade::text,          ano, 'had',               dados_json::text,          NULL FROM had_escola
  UNION ALL
  SELECT co_entidade::text,          ano, 'tnr',               dados_json::text,          NULL FROM tnr_escola
  UNION ALL
  SELECT co_entidade::text,          ano, 'ideb',
    jsonb_build_object(
      'anos_iniciais', (SELECT row_to_json(x) FROM (SELECT ideb, nota_saeb, taxa_aprovacao FROM ideb_escola i2 WHERE i2.co_entidade=i.co_entidade AND i2.ano=i.ano AND i2.etapa='anos_iniciais' LIMIT 1) x),
      'anos_finais',   (SELECT row_to_json(x) FROM (SELECT ideb, nota_saeb, taxa_aprovacao FROM ideb_escola i3 WHERE i3.co_entidade=i.co_entidade AND i3.ano=i.ano AND i3.etapa='anos_finais'   LIMIT 1) x)
    )::text, NULL
  FROM (SELECT DISTINCT co_entidade, ano FROM ideb_escola) i;

-- ── TABLE: escola_municipio ───────────────────────────────────
CREATE TABLE IF NOT EXISTS escola_municipio (
  inep TEXT PRIMARY KEY,
  co_municipio TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_escola_mun ON escola_municipio(co_municipio);

INSERT INTO escola_municipio (inep, co_municipio)
SELECT DISTINCT co_entidade::text, co_municipio::text
FROM censo_escolas
WHERE ano = (SELECT MAX(ano) FROM censo_escolas)
ON CONFLICT (inep) DO NOTHING;

-- ── FULL-TEXT SEARCH: escola_busca ───────────────────────────
CREATE TABLE IF NOT EXISTS escola_busca (
  inep TEXT PRIMARY KEY,
  nome TEXT,
  municipio TEXT,
  uf TEXT,
  dependencia TEXT,
  localizacao TEXT,
  matriculas INTEGER,
  busca_tsv TSVECTOR
);
CREATE INDEX IF NOT EXISTS idx_escola_busca_tsv ON escola_busca USING GIN(busca_tsv);
CREATE INDEX IF NOT EXISTS idx_escola_busca_nome ON escola_busca(nome);

INSERT INTO escola_busca (inep, nome, municipio, uf, dependencia, localizacao, matriculas, busca_tsv)
SELECT
  co_entidade::text,
  no_entidade,
  no_municipio,
  sg_uf,
  CASE tp_dependencia WHEN 1 THEN 'Federal' WHEN 2 THEN 'Estadual' WHEN 3 THEN 'Municipal' WHEN 4 THEN 'Privada' END,
  CASE tp_localizacao WHEN 1 THEN 'Urbana' WHEN 2 THEN 'Rural' END,
  COALESCE(qt_mat_bas, 0),
  to_tsvector('portuguese', COALESCE(no_entidade,'') || ' ' || COALESCE(no_municipio,'') || ' ' || COALESCE(sg_uf,''))
FROM censo_escolas
WHERE ano = (SELECT MAX(ano) FROM censo_escolas)
ON CONFLICT (inep) DO NOTHING;

-- ── TABLE: stats_cache ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS stats_cache (
  cache_key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- ── TABLE: importacao_status ─────────────────────────────────
CREATE TABLE IF NOT EXISTS importacao_status (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  status TEXT NOT NULL,
  total INTEGER DEFAULT 0,
  importados INTEGER DEFAULT 0,
  updated_at BIGINT
);

-- ── TABLE: caderno_documents ─────────────────────────────────
CREATE TABLE IF NOT EXISTS caderno_documents (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  inep TEXT,
  header_data TEXT,
  body_html TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'rascunho',
  quality_score TEXT DEFAULT 'red',
  logo_url TEXT,
  created_at BIGINT,
  updated_at BIGINT
);

CREATE TABLE IF NOT EXISTS caderno_document_versions (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL,
  body_html TEXT NOT NULL,
  header_data TEXT,
  created_at BIGINT
);

CREATE TABLE IF NOT EXISTS caderno_notes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT,
  source_title TEXT,
  source_excerpt TEXT,
  tags TEXT,
  document_id INTEGER,
  conversation_id INTEGER,
  created_at BIGINT
);

CREATE TABLE IF NOT EXISTS caderno_sources (
  id SERIAL PRIMARY KEY,
  url TEXT,
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  fetched_at BIGINT,
  pinned INTEGER DEFAULT 0,
  category TEXT,
  conversation_id INTEGER
);

-- ── TABLE: conversations / messages ──────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);

-- ── TABLE: ai_documents ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  source TEXT,
  link TEXT,
  created_at BIGINT
);

CREATE TABLE IF NOT EXISTS ai_document_embeddings (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES ai_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  chunk_text TEXT NOT NULL,
  embedding TEXT
);

CREATE TABLE IF NOT EXISTS ai_api_sources (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  fetched_at BIGINT,
  content TEXT,
  category TEXT
);

-- ── TABLE: glossary / tools / programs ───────────────────────
CREATE TABLE IF NOT EXISTS glossary (
  id SERIAL PRIMARY KEY,
  term TEXT NOT NULL,
  explanation TEXT NOT NULL,
  letter TEXT NOT NULL,
  icon_name TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tools (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  download_url TEXT,
  type TEXT NOT NULL,
  featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  last_reference_year INTEGER,
  status TEXT NOT NULL,
  observation TEXT
);

CREATE TABLE IF NOT EXISTS program_details (
  id SERIAL PRIMARY KEY,
  program_code TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT
);

CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  label TEXT
);

CREATE TABLE IF NOT EXISTS schools (
  id SERIAL PRIMARY KEY,
  inep TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  network TEXT NOT NULL,
  location TEXT NOT NULL,
  enrollment_count INTEGER NOT NULL,
  data_status TEXT NOT NULL,
  last_update BIGINT
);

CREATE TABLE IF NOT EXISTS dashboard_datasets (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  label TEXT,
  data BYTEA NOT NULL,
  last_updated BIGINT
);

CREATE TABLE IF NOT EXISTS trilha_units (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  order_index INTEGER DEFAULT 0,
  content TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  is_published BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS unanswered_questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  asked_at BIGINT,
  context TEXT,
  answered BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS mun_road_dist (
  id SERIAL PRIMARY KEY,
  co_municipio_origem TEXT NOT NULL,
  co_municipio_destino TEXT NOT NULL,
  distancia_km REAL
);
