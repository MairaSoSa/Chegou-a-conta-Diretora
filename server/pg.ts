import { Pool } from "pg";

export const pgPool = new Pool({
  connectionString: process.env.RAILWAY_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
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
