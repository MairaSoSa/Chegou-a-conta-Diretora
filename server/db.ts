import { drizzle } from "drizzle-orm/node-postgres";
import { pgPool } from "./pg";
import * as schema from "@shared/schema";
import path from "path";

// ── PostgreSQL (primary — Railway) ───────────────────────────────────────────
export const db = drizzle(pgPool, { schema });

// ── SQLite (fallback — dev only, while migration is in progress) ─────────────
let _sqlite: any = null;
function getSqlite() {
  if (_sqlite) return _sqlite;
  try {
    const Database = require("better-sqlite3");
    const dbPath = (process.env.SQLITE_DATABASE_URL || "file:dev.db").replace("file:", "");
    const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
    _sqlite = new Database(resolvedPath, { readonly: true });
    console.log("[db] SQLite fallback ativo:", resolvedPath);
    return _sqlite;
  } catch {
    return null;
  }
}

/** Compat stub — usado apenas por arquivos ainda não migrados para PG */
export const sqlite = new Proxy({} as any, {
  get(_target, prop: string) {
    const db = getSqlite();
    if (!db) {
      // Retorna um stub que não trava a execução
      if (prop === "prepare") return () => ({ get: () => null, all: () => [], run: () => ({}) });
      return undefined;
    }
    return typeof db[prop] === "function" ? db[prop].bind(db) : db[prop];
  }
});

export const resolvedDbPath = path.join(process.cwd(), "dev.db");

/** No-op: tables are already created in Railway via setup script */
export function ensureCadernoTables(): void {}
export function ensureAiDocumentsCreatedAtColumn(): void {}
export function ensureAiDocumentsLinkColumn(): void {}
