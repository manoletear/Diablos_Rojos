const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const DOWNLOADS = path.join(require("os").homedir(), "Downloads");

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) { cells.push(current); current = ""; }
    else current += ch;
  }
  cells.push(current);
  return cells;
}
function parseCsv(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.length > 0);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}

const TIPO_MAP = { one_day: "un_dia", short_term: "corto_plazo", annual: "anual" };
const ESTADO_MAP = { active: "activo", finished: "finalizado", cancelled: "cancelado" };

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const { rows: categoriaRows } = await c.query("select id, nombre from categorias");
  const categoriaByName = new Map(categoriaRows.map((cc) => [cc.nombre.trim().toLowerCase(), cc.id]));
  const { rows: sedeRows } = await c.query("select id, nombre from sedes");
  const sedeByName = new Map(sedeRows.map((s) => [s.nombre.trim().toLowerCase(), s.id]));

  const csv = parseCsv(fs.readFileSync(path.join(DOWNLOADS, "torneos_diablos_rojos.csv"), "utf8"));
  let actualizados = 0, creados = 0, catsLinkeadas = 0;

  for (const row of csv) {
    const nombre = row["nombre"];
    const tipo = TIPO_MAP[row["tipo"]] ?? "anual";
    const estado = ESTADO_MAP[row["estado"]] ?? "activo";
    const sedeId = sedeByName.get((row["sede"] || "").trim().toLowerCase()) ?? null;

    const { rows: existing } = await c.query("select id from torneos where lower(nombre) = $1", [nombre.trim().toLowerCase()]);
    let torneoId;
    if (existing.length > 0) {
      torneoId = existing[0].id;
      await c.query(
        `update torneos set telar_id=$1, tipo=$2, fecha_inicio=$3, fecha_fin=$4, estado=$5, sede_id=$6,
           precio=$7, obligatorio=$8, requiere_aprobacion=$9, costo_adicional=$10, plazo_aprobacion=$11
         where id=$12`,
        [row["tournament_id"], tipo, row["fecha_inicio"] || null, row["fecha_fin"] || null, estado, sedeId,
         row["monto"] ? Number(row["monto"]) : null, row["obligatorio"] === "true", row["requiere_aprobacion"] === "true",
         row["costo_adicional"] === "true", row["plazo_aprobacion"] || null, torneoId]
      );
      actualizados++;
    } else {
      const { rows: created } = await c.query(
        `insert into torneos (telar_id, nombre, tipo, fecha_inicio, fecha_fin, estado, sede_id, precio, obligatorio, requiere_aprobacion, costo_adicional, plazo_aprobacion)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id`,
        [row["tournament_id"], nombre, tipo, row["fecha_inicio"] || null, row["fecha_fin"] || null, estado, sedeId,
         row["monto"] ? Number(row["monto"]) : null, row["obligatorio"] === "true", row["requiere_aprobacion"] === "true",
         row["costo_adicional"] === "true", row["plazo_aprobacion"] || null]
      );
      torneoId = created[0].id;
      creados++;
    }

    const cats = (row["categorias"] || "").split("|").map((s) => s.trim()).filter(Boolean);
    for (const catName of cats) {
      const categoriaId = categoriaByName.get(catName.toLowerCase());
      if (!categoriaId) continue;
      await c.query(
        `insert into torneo_categorias (torneo_id, categoria_id) values ($1,$2) on conflict do nothing`,
        [torneoId, categoriaId]
      );
      catsLinkeadas++;
    }
  }

  console.log(`Torneos: ${creados} creados, ${actualizados} actualizados, ${catsLinkeadas} vinculos de categoria.`);
  await c.end();
}

main().catch((e) => { console.error("ERR", e.message, e.stack); process.exit(1); });
