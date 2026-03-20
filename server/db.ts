import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

const dbPath = (process.env.SQLITE_DATABASE_URL || process.env.DATABASE_URL || "file:dev.db").replace("file:", "");
const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);

export const sqlite = new Database(resolvedPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("cache_size = -128000");
sqlite.pragma("mmap_size = 268435456");
sqlite.pragma("temp_store = MEMORY");
sqlite.pragma("synchronous = NORMAL");

try {
  sqlite.exec(`CREATE TABLE IF NOT EXISTS stats_cache (
    cache_key TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`);
} catch (e) {
  console.error("Failed to create stats_cache table:", e);
}

try {
  sqlite.exec("CREATE INDEX IF NOT EXISTS idx_censo_ano_dep ON censo_escolar(ano, dependencia)");
  sqlite.exec("CREATE INDEX IF NOT EXISTS idx_censo_ano_loc ON censo_escolar(ano, localizacao)");
  sqlite.exec("CREATE INDEX IF NOT EXISTS idx_censo_ano_sit ON censo_escolar(ano, situacao)");
  sqlite.exec("CREATE INDEX IF NOT EXISTS idx_censo_ano_uf_mat ON censo_escolar(ano, uf)");
  sqlite.exec("CREATE INDEX IF NOT EXISTS idx_censo_inep ON censo_escolar(inep)");
  sqlite.exec("CREATE INDEX IF NOT EXISTS idx_censo_inep_ano ON censo_escolar(inep, ano)");
  sqlite.exec("CREATE INDEX IF NOT EXISTS idx_censo_dep_loc_sit ON censo_escolar(ano, dependencia, localizacao, situacao)");
} catch {}

// FTS5 — índice de texto completo para busca rápida por nome de escola
try {
  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS escola_fts USING fts5(
      inep UNINDEXED,
      nome,
      municipio,
      uf UNINDEXED,
      dependencia UNINDEXED,
      localizacao UNINDEXED,
      matriculas UNINDEXED,
      tokenize='unicode61 remove_diacritics 1'
    )
  `);
  const ftsCount = (sqlite.prepare("SELECT COUNT(*) as n FROM escola_fts").get() as any)?.n ?? 0;
  if (ftsCount === 0) {
    const latestAno = (sqlite.prepare("SELECT MAX(ano) as ano FROM censo_escolar").get() as any)?.ano;
    if (latestAno) {
      console.log(`[db] Construindo índice FTS5 para ano ${latestAno}...`);
      sqlite.exec(`
        INSERT INTO escola_fts(inep, nome, municipio, uf, dependencia, localizacao, matriculas)
        SELECT inep, nome, municipio, uf, dependencia, localizacao, matriculas
        FROM censo_escolar WHERE ano = ${latestAno}
      `);
      console.log(`[db] Índice FTS5 pronto (${(sqlite.prepare("SELECT COUNT(*) as n FROM escola_fts").get() as any)?.n} escolas)`);
    }
  }
} catch (e: any) {
  console.warn("[db] FTS5 não disponível:", e.message);
}

// Tabela auxiliar: inep → co_municipio (extração feita uma vez do censo)
try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS escola_municipio (
      inep TEXT PRIMARY KEY,
      co_municipio TEXT NOT NULL
    )
  `);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_escola_mun ON escola_municipio(co_municipio)`);

  const count = (sqlite.prepare("SELECT COUNT(*) as n FROM escola_municipio").get() as any)?.n ?? 0;
  if (count === 0) {
    setTimeout(() => {
      try {
        console.log("[db] Construindo tabela escola_municipio...");
        const latestAno = (sqlite.prepare("SELECT MAX(ano) as ano FROM censo_escolar").get() as any)?.ano;
        if (latestAno) {
          sqlite.exec(`
            INSERT OR IGNORE INTO escola_municipio(inep, co_municipio)
            SELECT inep, json_extract(dados,'$.co_municipio')
            FROM censo_escolar
            WHERE ano = ${latestAno}
              AND json_extract(dados,'$.co_municipio') IS NOT NULL
          `);
          const inserted = (sqlite.prepare("SELECT COUNT(*) as n FROM escola_municipio").get() as any)?.n ?? 0;
          console.log(`[db] escola_municipio pronta: ${inserted} escolas`);
        }
      } catch (e: any) {
        console.warn("[db] Falha ao construir escola_municipio:", e.message);
      }
    }, 0);
  }
} catch (e: any) {
  console.warn("[db] escola_municipio:", e.message);
}

export const db = drizzle(sqlite, { schema });

export function ensureCadernoTables(): void {
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS caderno_documents (
        id INTEGER PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        inep TEXT,
        header_data TEXT,
        body_html TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'rascunho',
        quality_score TEXT DEFAULT 'red',
        logo_url TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS caderno_document_versions (
        id INTEGER PRIMARY KEY,
        document_id INTEGER NOT NULL,
        body_html TEXT NOT NULL,
        header_data TEXT,
        created_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS caderno_notes (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        source_url TEXT,
        source_title TEXT,
        source_excerpt TEXT,
        tags TEXT,
        document_id INTEGER,
        conversation_id INTEGER,
        created_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS caderno_sources (
        id INTEGER PRIMARY KEY,
        url TEXT,
        title TEXT NOT NULL,
        content TEXT,
        excerpt TEXT,
        fetched_at INTEGER,
        pinned INTEGER DEFAULT 0,
        category TEXT,
        conversation_id INTEGER
      );
    `);
  } catch (error) {
    console.error("Failed to ensure caderno tables:", error);
  }
}

export function ensureAiDocumentsCreatedAtColumn(): void {
        try {
                const table = sqlite
                        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_documents'")
                        .get();
                if (!table) return;

                const columns = sqlite.prepare("PRAGMA table_info(ai_documents)").all() as Array<{ name: string }>;
                const hasCreatedAt = columns.some((col) => col.name === "created_at");
                if (!hasCreatedAt) {
                        sqlite.prepare("ALTER TABLE ai_documents ADD COLUMN created_at INTEGER").run();
                        sqlite.prepare("UPDATE ai_documents SET created_at = ? WHERE created_at IS NULL").run(Date.now());
                }
        } catch (error) {
                console.error("Failed to ensure ai_documents created_at column:", error);
        }
}

export function ensureAiDocumentsLinkColumn(): void {
        try {
                const table = sqlite
                        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_documents'")
                        .get();
                if (!table) return;

                const columns = sqlite.prepare("PRAGMA table_info(ai_documents)").all() as Array<{ name: string }>;
                const hasLink = columns.some((col) => col.name === "link");
                if (!hasLink) {
                        sqlite.prepare("ALTER TABLE ai_documents ADD COLUMN link TEXT").run();
                }
        } catch (error) {
                console.error("Failed to ensure ai_documents link column:", error);
        }
}
