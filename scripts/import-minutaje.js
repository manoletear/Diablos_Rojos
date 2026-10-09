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
    } else if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else current += ch;
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

function num(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}
function bool(v) {
  return v === "true";
}

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const { rows: alumnosRows } = await c.query("select id, nombre, apellido from alumnos");
  const alumnoByName = new Map(alumnosRows.map((a) => [`${a.nombre} ${a.apellido}`.trim().toLowerCase(), a.id]));

  const { rows: categoriaRows } = await c.query("select id, nombre from categorias");
  const categoriaByName = new Map(categoriaRows.map((c) => [c.nombre.trim().toLowerCase(), c.id]));

  // ---- minutaje_alumnos ----
  const alumnosCsv = parseCsv(fs.readFileSync(path.join(DOWNLOADS, "minutaje_alumnos_diablos_rojos.csv"), "utf8"));
  let creados = 0, noEncontrados = new Set();

  for (const row of alumnosCsv) {
    const alumnoId = alumnoByName.get((row["alumno"] || "").trim().toLowerCase());
    if (!alumnoId) {
      noEncontrados.add(row["alumno"]);
      continue;
    }
    const categoriaId = categoriaByName.get((row["categoria"] || "").trim().toLowerCase()) ?? null;

    await c.query(
      `insert into minutaje_resumen (
        alumno_id, categoria_id, temporada, estado, fecha_incorporacion,
        entrenamientos_presente, entrenamientos_registrados, asistencia_pct,
        jornadas_categoria, partidos_categoria, convocado_jornadas, convocado_partidos,
        convocatorias_rechazadas, convocatoria_pct, partidos_con_minutos, partidos_sin_entrar,
        minutaje_efectivo_pct, datos_insuficientes, minutos_cat_propia, minutos_otras_cat,
        minutos_totales, minutos_ult5_jornadas, jornadas_ult5,
        cumple_asistencia_60, cumple_convocatoria_70, cumple_minutos_50
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
      on conflict (alumno_id, temporada) do update set
        categoria_id=excluded.categoria_id, estado=excluded.estado, fecha_incorporacion=excluded.fecha_incorporacion,
        entrenamientos_presente=excluded.entrenamientos_presente, entrenamientos_registrados=excluded.entrenamientos_registrados,
        asistencia_pct=excluded.asistencia_pct, jornadas_categoria=excluded.jornadas_categoria,
        partidos_categoria=excluded.partidos_categoria, convocado_jornadas=excluded.convocado_jornadas,
        convocado_partidos=excluded.convocado_partidos, convocatorias_rechazadas=excluded.convocatorias_rechazadas,
        convocatoria_pct=excluded.convocatoria_pct, partidos_con_minutos=excluded.partidos_con_minutos,
        partidos_sin_entrar=excluded.partidos_sin_entrar, minutaje_efectivo_pct=excluded.minutaje_efectivo_pct,
        datos_insuficientes=excluded.datos_insuficientes, minutos_cat_propia=excluded.minutos_cat_propia,
        minutos_otras_cat=excluded.minutos_otras_cat, minutos_totales=excluded.minutos_totales,
        minutos_ult5_jornadas=excluded.minutos_ult5_jornadas, jornadas_ult5=excluded.jornadas_ult5,
        cumple_asistencia_60=excluded.cumple_asistencia_60, cumple_convocatoria_70=excluded.cumple_convocatoria_70,
        cumple_minutos_50=excluded.cumple_minutos_50`,
      [
        alumnoId, categoriaId, row["temporada"], row["estado"], row["fecha_incorporacion"] || null,
        num(row["entrenamientos_presente"]), num(row["entrenamientos_registrados"]), num(row["asistencia_pct"]),
        num(row["jornadas_categoria"]), num(row["partidos_categoria"]), num(row["convocado_jornadas"]), num(row["convocado_partidos"]),
        num(row["convocatorias_rechazadas"]), num(row["convocatoria_pct"]) !== null ? num(row["convocatoria_pct"]) * 100 : null, num(row["partidos_con_minutos"]), num(row["partidos_sin_entrar"]),
        num(row["minutaje_efectivo_pct"]), bool(row["datos_insuficientes"]), num(row["minutos_cat_propia"]), num(row["minutos_otras_cat"]),
        num(row["minutos_totales"]), num(row["minutos_ult5_jornadas"]), num(row["jornadas_ult5"]),
        bool(row["cumple_asistencia_60"]), bool(row["cumple_convocatoria_70"]), bool(row["cumple_minutos_50"]),
      ]
    );
    creados++;
  }
  console.log(`minutaje_resumen: ${creados} filas.`);
  if (noEncontrados.size > 0) console.log(`Alumnos no encontrados (${noEncontrados.size}):`, [...noEncontrados]);

  // ---- minutaje_categorias ----
  const catCsv = parseCsv(fs.readFileSync(path.join(DOWNLOADS, "minutaje_categorias_diablos_rojos.csv"), "utf8"));
  let catCreados = 0, catNoEncontradas = new Set();
  for (const row of catCsv) {
    const categoriaId = categoriaByName.get((row["categoria"] || "").trim().toLowerCase());
    if (!categoriaId) {
      catNoEncontradas.add(row["categoria"]);
      continue;
    }
    await c.query(
      `insert into minutaje_categoria_resumen (categoria_id, temporada, alumnos, jornadas, partidos, minutos_totales, citados_promedio_jornada)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (categoria_id, temporada) do update set
         alumnos=excluded.alumnos, jornadas=excluded.jornadas, partidos=excluded.partidos,
         minutos_totales=excluded.minutos_totales, citados_promedio_jornada=excluded.citados_promedio_jornada`,
      [categoriaId, row["temporada"], num(row["alumnos"]), num(row["jornadas"]), num(row["partidos"]), num(row["minutos_totales"]), num(row["citados_promedio_jornada"])]
    );
    catCreados++;
  }
  console.log(`minutaje_categoria_resumen: ${catCreados} filas.`);
  if (catNoEncontradas.size > 0) console.log(`Categorias no encontradas:`, [...catNoEncontradas]);

  await c.end();
}

main().catch((e) => {
  console.error("ERR", e.message, e.stack);
  process.exit(1);
});
