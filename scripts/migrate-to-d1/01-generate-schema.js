// Fase 3: introspecciona el schema real de Postgres y genera el equivalente
// en SQLite/D1 (enums -> text+check, uuid -> text, timestamptz -> text ISO,
// numeric -> integer centavos, jsonb -> text). Solo LEE Postgres, no escribe
// nada ahi. Produce scripts/migrate-to-d1/out/schema.sql
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env.local") });

const OUT_DIR = path.join(__dirname, "out");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function mapType(col, enumValues) {
  if (enumValues[col.udt_name]) {
    const values = enumValues[col.udt_name].map((v) => `'${v.replace(/'/g, "''")}'`).join(", ");
    return `text check ("${col.column_name}" in (${values}))`;
  }
  switch (col.data_type) {
    case "uuid":
      return "text";
    case "text":
    case "character varying":
      return "text";
    case "boolean":
      return "integer"; // 0/1
    case "integer":
    case "smallint":
    case "bigint":
      return "integer";
    case "numeric":
    case "real":
    case "double precision":
      return "integer"; // centavos
    case "date":
    case "timestamp without time zone":
    case "timestamp with time zone":
      return "text"; // ISO 8601
    case "jsonb":
    case "json":
      return "text"; // JSON.stringify
    case "ARRAY":
      return "text"; // JSON.stringify de array
    default:
      return "text";
  }
}

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Enums: nombre de tipo -> valores
  const { rows: enumRows } = await c.query(`
    select t.typname as enum_name, e.enumlabel as value
    from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
    order by t.typname, e.enumsortorder
  `);
  const enumValues = {};
  for (const r of enumRows) {
    (enumValues[r.enum_name] ??= []).push(r.value);
  }

  // Tablas y columnas
  const { rows: tables } = await c.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `);

  const { rows: columns } = await c.query(`
    select table_name, column_name, data_type, udt_name, is_nullable, column_default, ordinal_position
    from information_schema.columns
    where table_schema = 'public'
    order by table_name, ordinal_position
  `);

  const { rows: pks } = await c.query(`
    select tc.table_name, kcu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    where tc.constraint_type = 'PRIMARY KEY' and tc.table_schema = 'public'
    order by tc.table_name, kcu.ordinal_position
  `);

  const { rows: checks } = await c.query(`
    select conrelid::regclass::text as table_name, pg_get_constraintdef(oid) as def
    from pg_constraint
    where contype = 'c' and connamespace = 'public'::regnamespace
  `);

  const { rows: fks } = await c.query(`
    select
      tc.table_name, kcu.column_name,
      ccu.table_name as foreign_table_name, ccu.column_name as foreign_column_name,
      rc.delete_rule
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage ccu on tc.constraint_name = ccu.constraint_name and tc.table_schema = ccu.table_schema
    join information_schema.referential_constraints rc on rc.constraint_name = tc.constraint_name and rc.constraint_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
  `);

  const colsByTable = {};
  for (const col of columns) (colsByTable[col.table_name] ??= []).push(col);
  const pksByTable = {};
  for (const pk of pks) (pksByTable[pk.table_name] ??= []).push(pk.column_name);
  const fksByTable = {};
  for (const fk of fks) (fksByTable[fk.table_name] ??= []).push(fk);
  const checksByTable = {};
  for (const ch of checks) (checksByTable[ch.table_name] ??= []).push(ch.def);

  function translateCheck(def) {
    // CHECK ((estado = ANY (ARRAY['a'::text, 'b'::text]))) -> estado in ('a', 'b')
    // Quita exactamente un "CHECK (" ... ")" exterior (balanceado), haya uno o dos parentesis.
    let inner = def.replace(/^CHECK\s*\(/, "").replace(/\)$/, "");
    return inner
      .replace(/(\w+) = ANY \(ARRAY\[([^\]]+)\]\)/g, (_, col, list) => {
        const items = list
          .split(",")
          .map((s) => s.trim().replace(/::\w+$/, ""))
          .join(", ");
        return `"${col}" in (${items})`;
      })
      .replace(/::\w+/g, "");
  }

  let sql = `-- Generado automaticamente desde el schema real de Supabase (Fase 3 migracion Cloudflare D1).\n`;
  sql += `-- ${new Date().toISOString()}\n\n`;
  sql += `PRAGMA foreign_keys = OFF;\n\n`; // se activa despues de cargar datos, para no pelear con orden de inserts

  for (const t of tables) {
    const name = t.table_name;
    const cols = colsByTable[name] ?? [];
    const pkCols = pksByTable[name] ?? [];
    const tableFks = fksByTable[name] ?? [];

    const colDefs = cols.map((col) => {
      const type = mapType(col, enumValues);
      const notNull = col.is_nullable === "NO" && !pkCols.includes(col.column_name) ? " not null" : "";
      return `  "${col.column_name}" ${type}${notNull}`;
    });

    if (pkCols.length > 0) {
      colDefs.push(`  primary key (${pkCols.map((c) => `"${c}"`).join(", ")})`);
    }
    for (const fk of tableFks) {
      const onDelete = fk.delete_rule === "CASCADE" ? " on delete cascade" : fk.delete_rule === "SET NULL" ? " on delete set null" : "";
      colDefs.push(`  foreign key ("${fk.column_name}") references "${fk.foreign_table_name}"("${fk.foreign_column_name}")${onDelete}`);
    }
    for (const def of checksByTable[name] ?? []) {
      colDefs.push(`  check (${translateCheck(def)})`);
    }

    sql += `create table "${name}" (\n${colDefs.join(",\n")}\n);\n\n`;
  }

  fs.writeFileSync(path.join(OUT_DIR, "schema.sql"), sql);
  console.log(`Schema generado: ${tables.length} tablas -> scripts/migrate-to-d1/out/schema.sql`);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
