// Import seed: Backups/alumnos_activos_2026-10-09.csv -> alumnos + apoderados + apoderado_alumno + fichas_medicas
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const CSV_PATH = path.join(
  __dirname,
  "..",
  "..",
  "Backups",
  "alumnos_activos_2026-10-09.csv"
);

function parseCsv(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    // naive split (no embedded commas in this dataset's quoted fields observed)
    const cells = line.split(",");
    const row = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}

function toDate(d) {
  if (!d) return null;
  const [dd, mm, yyyy] = d.split("-");
  if (!dd || !mm || !yyyy) return null;
  return `${yyyy}-${mm}-${dd}`;
}

function estadoMap(e) {
  if (e === "Matriculado") return "matriculado";
  if (e === "En Prueba") return "en_prueba";
  return "retirado";
}

async function main() {
  const csv = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parseCsv(csv);

  const c = new Client({
    connectionString:
      "postgresql://postgres.bqnpijcrbiikyfdtfxef:Manoletear.%2C@aws-1-sa-east-1.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  const { rows: sedeRows } = await c.query(
    "select id from sedes where nombre = 'Sede Principal'"
  );
  const sedeId = sedeRows[0].id;

  const { rows: catRows } = await c.query("select id, nombre from categorias");
  const catByName = Object.fromEntries(catRows.map((r) => [r.nombre, r.id]));

  const apoderadoCache = new Map(); // email -> apoderado_id

  let inserted = 0;
  for (const row of rows) {
    const categoriaId = catByName[row["Categoría"]] ?? null;

    const { rows: alumnoRows } = await c.query(
      `insert into alumnos
        (nombre, apellido, rut, fecha_nacimiento, categoria_id, sede_id, estado,
         posicion, numero_camiseta, nombre_camiseta, talla_camiseta, beca_pct,
         cuota_personalizada, fecha_inscripcion)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       returning id`,
      [
        row["Nombre"],
        row["Apellido"],
        row["RUT"] || null,
        toDate(row["Fecha Nacimiento"]),
        categoriaId,
        sedeId,
        estadoMap(row["Estado"]),
        row["Posición"] || null,
        row["Número Camiseta"] ? parseInt(row["Número Camiseta"], 10) : null,
        row["Nombre Camiseta"] || null,
        row["Talla Camiseta"] || null,
        row["Beca %"] ? parseFloat(row["Beca %"]) : 0,
        row["Cuota Personalizada"]
          ? parseFloat(row["Cuota Personalizada"])
          : null,
        toDate(row["Fecha Inscripción"]),
      ]
    );
    const alumnoId = alumnoRows[0].id;

    await c.query(
      `insert into fichas_medicas (alumno_id, condiciones_medicas, alergias, seguro_escolar, nombre_seguro)
       values ($1,$2,$3,$4,$5)`,
      [
        alumnoId,
        row["Condiciones Médicas"] || null,
        row["Alergias"] || null,
        row["Seguro Escolar"] === "Si",
        row["Nombre Seguro"] || null,
      ]
    );

    const apEmail = row["Email Apoderado"];
    const apNombre = row["Apoderado Principal"];
    if (apEmail) {
      let apoderadoId = apoderadoCache.get(apEmail);
      if (!apoderadoId) {
        const { rows: existing } = await c.query(
          "select id from apoderados where email = $1",
          [apEmail]
        );
        if (existing.length > 0) {
          apoderadoId = existing[0].id;
        } else {
          const { rows: apRows } = await c.query(
            "insert into apoderados (nombre, email, telefono) values ($1,$2,$3) returning id",
            [apNombre, apEmail, row["Teléfono Apoderado"] || null]
          );
          apoderadoId = apRows[0].id;
        }
        apoderadoCache.set(apEmail, apoderadoId);
      }
      await c.query(
        `insert into apoderado_alumno (apoderado_id, alumno_id, parentesco, es_principal)
         values ($1,$2,$3,true) on conflict do nothing`,
        [apoderadoId, alumnoId, row["Parentesco"] || null]
      );
    }

    inserted++;
  }

  console.log(`Importados ${inserted} alumnos, ${apoderadoCache.size} apoderados únicos.`);
  await c.end();
}

main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
