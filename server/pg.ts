import { Pool } from "pg";

const RAILWAY_URL = process.env.RAILWAY_DATABASE_URL;

if (!RAILWAY_URL) {
  console.error("[pg] AVISO: RAILWAY_DATABASE_URL não definida! Tentando DATABASE_URL como fallback...");
}

// Remove as variáveis PG* do Replit que apontam para localhost e interferem com Railway
// (O Replit injeta PGHOST=127.0.0.1 via módulo postgresql-16, que não existe em produção)
if (RAILWAY_URL) {
  delete process.env.PGHOST;
  delete process.env.PGPORT;
  delete process.env.PGDATABASE;
  delete process.env.PGUSER;
  delete process.env.PGPASSWORD;
}

const connStr = RAILWAY_URL || process.env.DATABASE_URL;
console.log(`[pg] Conectando ao PostgreSQL via ${RAILWAY_URL ? "RAILWAY_DATABASE_URL" : "DATABASE_URL"} (definida: ${!!connStr})`);

export const pgPool = new Pool({
  connectionString: connStr,
  ssl: connStr ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pgPool.on("error", (err) => {
  console.error("[pg] pool error:", err.message);
});

/** Converte placeholders ? do SQLite para $1, $2, ... do PostgreSQL */
function convertPlaceholders(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

/** Executa query e retorna todos os resultados */
export async function pgAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const { rows } = await pgPool.query(convertPlaceholders(sql), params);
  return rows as T[];
}

/** Executa query e retorna primeiro resultado ou undefined */
export async function pgGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const { rows } = await pgPool.query(convertPlaceholders(sql), params);
  return rows[0] as T | undefined;
}

/** Executa query sem retorno (INSERT/UPDATE/DELETE) */
export async function pgRun(sql: string, params: any[] = []): Promise<{ changes: number; lastID?: number }> {
  const result = await pgPool.query(convertPlaceholders(sql), params);
  return { changes: result.rowCount ?? 0 };
}

/** Executa query de INSERT e retorna o id gerado */
export async function pgInsert(sql: string, params: any[] = []): Promise<number> {
  const pgSql = convertPlaceholders(sql);
  // Adiciona RETURNING id se não tiver
  const withReturn = pgSql.trimEnd().endsWith("RETURNING id")
    ? pgSql
    : pgSql.replace(/;?\s*$/, " RETURNING id");
  const { rows } = await pgPool.query(withReturn, params);
  return rows[0]?.id;
}

export default pgPool;
