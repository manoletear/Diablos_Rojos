// Fase 4: prueba de paridad. Corre las MISMAS consultas representativas
// contra Postgres (produccion, solo lectura) y D1 (staging) y compara
// resultados. No toca ninguna de las dos bases, solo lee.
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env.local") });

const ACCOUNT_ID = "01726e42f34f41acd4f08b8438188d58";
const DATABASE_ID = "ac2ddd0b-ebb4-414b-a0bf-00c2d99d2aaa";

function getToken() {
  const configPath = path.join(process.env.APPDATA || "", "xdg.config", "cloudflare", "config", "default.json");
  return JSON.parse(fs.readFileSync(configPath, "utf8")).oauth_token;
}

async function d1Query(token, sql) {
  const resp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sql }),
  });
  const data = await resp.json();
  if (!data.success) throw new Error(JSON.stringify(data.errors));
  return data.result[0].results;
}

const CASOS = [
  {
    nombre: "Alumnos — listado (modulo Alumnos)",
    pg: `select id, nombre, apellido, estado from alumnos order by apellido limit 10`,
    d1: `select id, nombre, apellido, estado from alumnos order by apellido limit 10`,
    comparar: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  },
  {
    nombre: "Pagos — resumen por estado (modulo Finanzas)",
    pg: `select estado, count(*)::int as n, sum(monto_total)::float as total from pagos group by estado order by estado`,
    d1: `select estado, count(*) as n, sum(monto_total) as total from pagos group by estado order by estado`,
    comparar: (pgRows, d1Rows) => {
      if (pgRows.length !== d1Rows.length) return false;
      return pgRows.every((p, i) => {
        const d = d1Rows[i];
        return p.estado === d.estado && p.n === d.n && Math.round(p.total * 100) === d.total;
      });
    },
  },
  {
    nombre: "Convocatoria — jugadores convocados por partido (modulo Partidos)",
    pg: `select convocatoria_id, count(*)::int as n from convocatoria_jugadores group by convocatoria_id order by n desc limit 5`,
    d1: `select convocatoria_id, count(*) as n from convocatoria_jugadores group by convocatoria_id order by n desc limit 5`,
    comparar: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  },
];

async function main() {
  const pg = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  const token = getToken();

  let todoOk = true;
  for (const caso of CASOS) {
    const { rows: pgRows } = await pg.query(caso.pg);
    const d1Rows = await d1Query(token, caso.d1);
    const ok = caso.comparar(pgRows, d1Rows);
    console.log(`${ok ? "✅" : "❌"} ${caso.nombre}`);
    if (!ok) {
      todoOk = false;
      console.log("  Postgres:", JSON.stringify(pgRows));
      console.log("  D1:      ", JSON.stringify(d1Rows));
    }
  }

  console.log(todoOk ? "\nParidad OK en los 3 casos." : "\nHay diferencias — revisar arriba.");
  await pg.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
