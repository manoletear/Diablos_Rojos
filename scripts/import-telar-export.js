// Importa el export completo de Telar: apoderados, partidos, convocatorias.
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
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
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

function toTimestamp(s) {
  if (!s) return null;
  // "2026-01-14 12:00" -> ISO
  return s.replace(" ", "T") + (s.length <= 16 ? ":00" : "");
}

const ESTADO_PARTIDO_MAP = {
  scheduled: "programado",
  live: "en_curso",
  completed: "completado",
  cancelled: "cancelado",
};

const TIPO_MAP = {
  home: "local",
  away: "visita",
  neutral: "neutral",
};

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // ---------- Caches ----------
  const { rows: alumnosRows } = await c.query("select id, nombre, apellido from alumnos");
  const alumnoByName = new Map();
  for (const a of alumnosRows) {
    const key = `${a.nombre} ${a.apellido}`.trim().toLowerCase();
    alumnoByName.set(key, a.id);
  }

  const { rows: categoriaRows } = await c.query("select id, nombre from categorias");
  const categoriaByName = new Map(categoriaRows.map((c) => [c.nombre.trim().toLowerCase(), c.id]));

  const { rows: sedeRows } = await c.query("select id from sedes where nombre = 'Sede Principal'");
  const sedeId = sedeRows[0]?.id ?? null;

  const torneoByName = new Map();
  const recintoByName = new Map();

  async function getOrCreateTorneo(nombre) {
    if (!nombre) return null;
    const key = nombre.trim().toLowerCase();
    if (torneoByName.has(key)) return torneoByName.get(key);
    const { rows: existing } = await c.query("select id from torneos where lower(nombre) = $1", [key]);
    let id;
    if (existing.length > 0) {
      id = existing[0].id;
    } else {
      const { rows: created } = await c.query(
        "insert into torneos (nombre, tipo) values ($1, 'anual') returning id",
        [nombre.trim()]
      );
      id = created[0].id;
    }
    torneoByName.set(key, id);
    return id;
  }

  async function getOrCreateRecinto(nombre) {
    if (!nombre) return null;
    const key = nombre.trim().toLowerCase();
    if (!key) return null;
    if (recintoByName.has(key)) return recintoByName.get(key);
    const { rows: existing } = await c.query("select id from recintos where lower(nombre) = $1", [key]);
    let id;
    if (existing.length > 0) {
      id = existing[0].id;
    } else {
      const { rows: created } = await c.query("insert into recintos (nombre) values ($1) returning id", [nombre.trim()]);
      id = created[0].id;
    }
    recintoByName.set(key, id);
    return id;
  }

  function findAlumno(nombreCompleto) {
    const key = nombreCompleto.trim().toLowerCase();
    return alumnoByName.get(key) ?? null;
  }

  // ---------- 1. Apoderados ----------
  const apCsv = parseCsv(fs.readFileSync(path.join(DOWNLOADS, "apoderados_diablos_rojos.csv"), "utf8"));
  let apCreados = 0, apActualizados = 0, linksCreados = 0, alumnosNoEncontrados = new Set();

  for (const row of apCsv) {
    const telarId = row["parent_id"];
    const email = row["email"] || null;

    let apoderadoId;
    const { rows: byTelarId } = await c.query("select id from apoderados where telar_id = $1", [telarId]);
    if (byTelarId.length > 0) {
      apoderadoId = byTelarId[0].id;
    } else if (email) {
      const { rows: byEmail } = await c.query("select id from apoderados where lower(email) = lower($1)", [email]);
      if (byEmail.length > 0) apoderadoId = byEmail[0].id;
    }

    const nombreCompleto = `${row["nombre"]} ${row["apellido"]}`.trim();
    const notifWhatsapp = row["notif_whatsapp"] === "true";
    const notifEmail = row["notif_email"] === "true";

    if (apoderadoId) {
      await c.query(
        `update apoderados set telar_id=$1, nombre=$2, email=$3, telefono=$4, direccion=$5,
           contacto_emergencia=$6, telefono_emergencia=$7, notif_whatsapp=$8, notif_email=$9
         where id=$10`,
        [telarId, nombreCompleto, email, row["telefono"] || null, row["direccion"] || null,
         row["contacto_emergencia"] || null, row["telefono_emergencia"] || null, notifWhatsapp, notifEmail, apoderadoId]
      );
      apActualizados++;
    } else {
      const { rows: created } = await c.query(
        `insert into apoderados (telar_id, nombre, email, telefono, direccion, contacto_emergencia, telefono_emergencia, notif_whatsapp, notif_email)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
        [telarId, nombreCompleto, email, row["telefono"] || null, row["direccion"] || null,
         row["contacto_emergencia"] || null, row["telefono_emergencia"] || null, notifWhatsapp, notifEmail]
      );
      apoderadoId = created[0].id;
      apCreados++;
    }

    const estudiantes = (row["estudiantes"] || "").split("|").map((s) => s.trim()).filter(Boolean);
    const relaciones = (row["relaciones"] || "").split("|").map((s) => s.trim());
    const esPrincipalArr = (row["es_principal"] || "").split("|").map((s) => s.trim());

    for (let i = 0; i < estudiantes.length; i++) {
      const alumnoId = findAlumno(estudiantes[i]);
      if (!alumnoId) {
        alumnosNoEncontrados.add(estudiantes[i]);
        continue;
      }
      const parentesco = relaciones[i] || null;
      const esPrincipal = esPrincipalArr[i] === "true";
      await c.query(
        `insert into apoderado_alumno (apoderado_id, alumno_id, parentesco, es_principal)
         values ($1,$2,$3,$4)
         on conflict (apoderado_id, alumno_id) do update set parentesco=excluded.parentesco, es_principal=excluded.es_principal`,
        [apoderadoId, alumnoId, parentesco, esPrincipal]
      );
      linksCreados++;
    }
  }

  console.log(`Apoderados: ${apCreados} creados, ${apActualizados} actualizados, ${linksCreados} vinculos alumno-apoderado.`);
  if (alumnosNoEncontrados.size > 0) {
    console.log(`Alumnos no encontrados (${alumnosNoEncontrados.size}):`, [...alumnosNoEncontrados].slice(0, 20));
  }

  // ---------- 2. Partidos ----------
  const partidosCsv = parseCsv(fs.readFileSync(path.join(DOWNLOADS, "partidos_diablos_rojos.csv"), "utf8"));
  let partidosCreados = 0, partidosSinCategoria = new Set();
  const partidoIdByTelarId = new Map();

  for (const row of partidosCsv) {
    const categoriaId = categoriaByName.get((row["categoria"] || "").trim().toLowerCase());
    if (!categoriaId) {
      partidosSinCategoria.add(row["categoria"]);
      continue;
    }
    const torneoId = await getOrCreateTorneo(row["torneo"]);
    const recintoId = await getOrCreateRecinto(row["ubicacion"]);
    const estado = ESTADO_PARTIDO_MAP[row["estado"]] ?? "programado";
    const tipo = TIPO_MAP[row["tipo"]] ?? "local";
    const golesNuestros = row["goles_nuestros"] ? parseInt(row["goles_nuestros"], 10) : null;
    const golesRival = row["goles_rival"] ? parseInt(row["goles_rival"], 10) : null;

    const { rows: existing } = await c.query("select id from partidos where telar_id = $1", [row["match_id"]]);
    let partidoId;
    if (existing.length > 0) {
      partidoId = existing[0].id;
    } else {
      const { rows: created } = await c.query(
        `insert into partidos (categoria_id, torneo_id, recinto_id, rival, fecha_hora, local_o_visita, estado, resultado_local, resultado_rival, telar_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
        [categoriaId, torneoId, recintoId, row["rival"], toTimestamp(row["fecha_hora"]), tipo, estado, golesNuestros, golesRival, row["match_id"]]
      );
      partidoId = created[0].id;
      partidosCreados++;
    }
    partidoIdByTelarId.set(row["match_id"], partidoId);
  }

  console.log(`Partidos: ${partidosCreados} creados.`);
  if (partidosSinCategoria.size > 0) {
    console.log(`Categorias no encontradas (${partidosSinCategoria.size}):`, [...partidosSinCategoria]);
  }

  // ---------- 3. Convocatorias ----------
  const convCsv = parseCsv(fs.readFileSync(path.join(DOWNLOADS, "convocatorias_diablos_rojos.csv"), "utf8"));
  const convocatoriaIdByPartido = new Map();
  let convJugadoresCreados = 0, jugadoresNoEncontrados = new Set();

  for (const row of convCsv) {
    const partidoId = partidoIdByTelarId.get(row["match_id"]);
    if (!partidoId) continue;

    let convocatoriaId = convocatoriaIdByPartido.get(partidoId);
    if (!convocatoriaId) {
      const { rows: existing } = await c.query("select id from convocatorias where partido_id = $1", [partidoId]);
      if (existing.length > 0) {
        convocatoriaId = existing[0].id;
      } else {
        const { rows: created } = await c.query("insert into convocatorias (partido_id) values ($1) returning id", [partidoId]);
        convocatoriaId = created[0].id;
      }
      convocatoriaIdByPartido.set(partidoId, convocatoriaId);
    }

    const alumnoId = findAlumno(row["jugador"]);
    if (!alumnoId) {
      jugadoresNoEncontrados.add(row["jugador"]);
      continue;
    }
    const rechazada = row["estado_convocatoria"] === "declined" || row["estado_convocatoria"] === "rejected";

    await c.query(
      `insert into convocatoria_jugadores (convocatoria_id, alumno_id, rechazada)
       values ($1,$2,$3) on conflict do nothing`,
      [convocatoriaId, alumnoId, rechazada]
    );
    convJugadoresCreados++;
  }

  console.log(`Convocatorias: ${convJugadoresCreados} citaciones de jugador.`);
  if (jugadoresNoEncontrados.size > 0) {
    console.log(`Jugadores no encontrados (${jugadoresNoEncontrados.size}):`, [...jugadoresNoEncontrados].slice(0, 20));
  }

  await c.end();
}

main().catch((e) => {
  console.error("ERR", e.message, e.stack);
  process.exit(1);
});
