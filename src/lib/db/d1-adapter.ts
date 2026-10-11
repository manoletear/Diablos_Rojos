import type { DbAdapter, Row } from "./adapter";

// Puente HTTP hacia D1 — valido mientras la app corre fuera de Cloudflare
// Workers (hoy en Netlify/Node). Cuando se corte el hosting (Fase 7), esto
// se reemplaza por el binding nativo `env.DB.prepare(sql).bind(...params).all()`,
// mucho mas rapido y sin llamada HTTP de por medio.
//
// Auth: hoy reusa CLOUDFLARE_API_TOKEN de entorno. En produccion real
// (Fase 7) hay que generar un token acotado solo a D1:Edit para esta cuenta,
// nunca el token OAuth personal de la CLI.

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID ?? "";

async function d1Fetch(sql: string, params: unknown[]) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error("Falta CLOUDFLARE_API_TOKEN en el entorno");
  if (!ACCOUNT_ID || !DATABASE_ID) throw new Error("Falta CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_D1_DATABASE_ID en el entorno");

  const resp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sql, params }),
  });
  const data = await resp.json();
  if (!data.success) throw new Error(`D1 query fallo: ${JSON.stringify(data.errors)}`);
  return data.result?.[0]?.results ?? [];
}

export const d1Adapter: DbAdapter = {
  async query<T extends Row = Row>(sql: string, params: unknown[] = []) {
    return (await d1Fetch(sql, params)) as T[];
  },
  async queryOne<T extends Row = Row>(sql: string, params: unknown[] = []) {
    const rows = await d1Fetch(sql, params);
    return (rows[0] ?? null) as T | null;
  },
};
