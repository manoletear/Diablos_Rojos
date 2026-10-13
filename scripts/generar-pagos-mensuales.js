// Genera pagos de mensualidad para el periodo indicado, para todos los
// alumnos matriculados que aun no tengan un pago de ese tipo/periodo.
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const PERIODO = process.argv[2] || "octubre de 2026";
const VENCIMIENTO = process.argv[3] || "2026-11-05";

async function main() {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  const { rows: configRows } = await c.query(`select mensualidad_default from configuracion_financiera limit 1`);
  const defaultOrganizacion = configRows[0]?.mensualidad_default ? Number(configRows[0].mensualidad_default) : 98000;

  const { rows: alumnos } = await c.query(
    `select a.id, a.sede_id, a.beca_pct, a.cuota_personalizada, c.mensualidad_base
     from alumnos a
     left join categorias c on c.id = a.categoria_id
     where a.estado = 'matriculado'`
  );

  let creados = 0;
  for (const a of alumnos) {
    const { rows: existentes } = await c.query(
      `select id from pagos where alumno_id=$1 and tipo='mensualidad' and periodo=$2`,
      [a.id, PERIODO]
    );
    if (existentes.length > 0) continue;

    // Prioridad: cuota acordada con la familia > mensualidad de la
    // categoria > default de la organizacion.
    let monto = a.cuota_personalizada
      ? Number(a.cuota_personalizada)
      : a.mensualidad_base
        ? Number(a.mensualidad_base)
        : defaultOrganizacion;
    if (a.beca_pct) monto = monto * (1 - Number(a.beca_pct) / 100);
    monto = Math.round(monto);

    await c.query(
      `insert into pagos (alumno_id, tipo, periodo, sede_id, monto_total, monto_pagado, estado, fecha_vencimiento, fecha_registro)
       values ($1,'mensualidad',$2,$3,$4,0,'pendiente',$5,current_date)`,
      [a.id, PERIODO, a.sede_id, monto, VENCIMIENTO]
    );
    creados++;
  }

  console.log(`Pagos de mensualidad "${PERIODO}" generados: ${creados}`);
  await c.end();
}

main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
