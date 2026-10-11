// Fase 4 — adaptor unico de datos. El resto del codigo de la app NO debe
// saber si esta pegando a Postgres (Supabase, produccion) o D1 (Cloudflare,
// staging de la migracion). Interfaz minima: una query SQL + params, vuelve
// filas planas. Nada de RLS aca todavia (eso es Fase 5) — hoy ambos backends
// corren sin autorizacion por fila, igual que hoy en D1 staging.

export type Row = Record<string, unknown>;

export interface DbAdapter {
  query<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T | null>;
}

export type Backend = "postgres" | "d1";
