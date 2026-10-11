import { Pool } from "pg";
import type { DbAdapter, Row } from "./adapter";

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export const postgresAdapter: DbAdapter = {
  async query<T extends Row = Row>(sql: string, params: unknown[] = []) {
    const { rows } = await getPool().query(sql, params);
    return rows as T[];
  },
  async queryOne<T extends Row = Row>(sql: string, params: unknown[] = []) {
    const { rows } = await getPool().query(sql, params);
    return (rows[0] ?? null) as T | null;
  },
};
