import { Pool } from "pg";
import type { DbAdapter, Row } from "./adapter";

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

// El resto del codigo (auth-guard.ts, etc) escribe SQL portable con `?`
// (estilo D1/SQLite) para no tener que saber que backend corre detras del
// adaptor. Postgres necesita `$1, $2, ...` — se traduce aca, una sola vez.
function aPlaceholdersPostgres(sql: string) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export const postgresAdapter: DbAdapter = {
  async query<T extends Row = Row>(sql: string, params: unknown[] = []) {
    const { rows } = await getPool().query(aPlaceholdersPostgres(sql), params);
    return rows as T[];
  },
  async queryOne<T extends Row = Row>(sql: string, params: unknown[] = []) {
    const { rows } = await getPool().query(aPlaceholdersPostgres(sql), params);
    return (rows[0] ?? null) as T | null;
  },
};
