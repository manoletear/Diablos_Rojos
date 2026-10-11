// Fase 3: copia los datos reales de Postgres a la D1 de staging (NO toca
// Supabase, solo lee). Orden topologico por FKs para no violar referencias,
// transforma tipos (timestamptz->ISO, numeric->centavos integer, jsonb->texto,
// boolean->0/1) y hace insert en lotes via la D1 HTTP API.
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env.local") });

const ACCOUNT_ID = "01726e42f34f41acd4f08b8438188d58";
const DATABASE_ID = "ac2ddd0b-ebb4-414b-a0bf-00c2d99d2aaa";
const BATCH_SIZE = 50;

function getToken() {
  const configPath = path.join(process.env.APPDATA || "", "xdg.config", "cloudflare", "config", "default.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  return config.oauth_token;
}

function topoSort(tables, fksByTable) {
  const order = [];
  const visited = new Set();
  const visiting = new Set();

  function visit(t) {
    if (visited.has(t)) return;
    if (visiting.has(t)) return; // dependencia circular (ej. pagos.cubierto_por_pago_id) - se rompe el ciclo, se arregla con update posterior si hiciera falta
    visiting.add(t);
    for (const fk of fksByTable[t] ?? []) {
      if (fk.foreign_table_name !== t) visit(fk.foreign_table_name);
    }
    visiting.delete(t);
    visited.add(t);
    order.push(t);
  }
  for (const t of tables) visit(t);
  return order;
}

async function d1Query(token, sql, params) {
  const resp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sql, params }),
  });
  return resp.json();
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  const pg = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  const token = getToken();

  const { rows: enumRows } = await pg.query(`
    select t.typname as enum_name from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typtype = 'e'
  `);
  const enumTypeNames = new Set(enumRows.map((r) => r.enum_name));

  const { rows: tables } = await pg.query(`
    select table_name from information_schema.tables
    where table_schema='public' and table_type='BASE TABLE'
  `);
  const { rows: columns } = await pg.query(`
    select table_name, column_name, data_type, udt_name from information_schema.columns
    where table_schema='public' order by table_name, ordinal_position
  `);
  const { rows: fks } = await pg.query(`
    select tc.table_name, ccu.table_name as foreign_table_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage ccu on tc.constraint_name = ccu.constraint_name and tc.table_schema = ccu.table_schema
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
  `);

  const colsByTable = {};
  for (const c of columns) (colsByTable[c.table_name] ??= []).push(c);
  const fksByTable = {};
  for (const fk of fks) (fksByTable[fk.table_name] ??= []).push(fk);

  const tableNames = tables.map((t) => t.table_name);
  const order = topoSort(tableNames, fksByTable);

  function transformValue(col, val) {
    if (val === null || val === undefined) return null;
    if (enumTypeNames.has(col.udt_name)) return String(val);
    switch (col.data_type) {
      case "boolean":
        return val ? 1 : 0;
      case "numeric":
      case "real":
      case "double precision":
        return Math.round(Number(val) * 100);
      case "date":
      case "timestamp without time zone":
      case "timestamp with time zone":
        return val instanceof Date ? val.toISOString() : String(val);
      case "jsonb":
      case "json":
        return JSON.stringify(val);
      case "ARRAY":
        return JSON.stringify(val);
      default:
        return val;
    }
  }

  const summary = [];

  for (const tableName of order) {
    const cols = colsByTable[tableName];
    const colNames = cols.map((c) => c.column_name);

    const { rows } = await pg.query(`select * from "${tableName}"`);
    if (rows.length === 0) {
      summary.push({ tabla: tableName, filas: 0 });
      continue;
    }

    const placeholders = `(${colNames.map(() => "?").join(", ")})`;
    const insertSql = `insert into "${tableName}" (${colNames.map((c) => `"${c}"`).join(", ")}) values ${placeholders}`;

    await mapWithConcurrency(rows, 8, async (row) => {
      const params = cols.map((c) => transformValue(c, row[c.column_name]));
      const result = await d1Query(token, insertSql, params);
      if (!result.success) {
        console.error(`\nFALLO insertando en "${tableName}":`, JSON.stringify(result.errors));
        console.error("Fila:", JSON.stringify(row));
        process.exit(1);
      }
      process.stdout.write(".");
    });
    summary.push({ tabla: tableName, filas: rows.length });
  }

  console.log("\n\nResumen:");
  for (const s of summary) if (s.filas > 0) console.log(`  ${s.tabla}: ${s.filas} filas`);

  await pg.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
