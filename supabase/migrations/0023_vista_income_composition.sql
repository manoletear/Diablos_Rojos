-- Capa semantica unica de ingresos. Una sola definicion de devengo
-- (por fecha_vencimiento del pago, no por fecha_registro) para que
-- Inicio, Reporte Asistencias y Dashboard Ejecutivo nunca muestren 3
-- numeros distintos para "ingresos del mes" como le pasa a Telar.
-- Decision aprobada 2026-10-09 (P0).

create function ingresos_periodo(p_desde date, p_hasta date)
returns table (
  tipo tipo_pago,
  devengado numeric,
  recaudado numeric,
  pendiente numeric,
  cantidad bigint
)
language sql stable as $$
  select
    p.tipo,
    round(sum(p.monto_total))::numeric as devengado,
    round(sum(p.monto_pagado))::numeric as recaudado,
    round(sum(p.monto_total - p.monto_pagado))::numeric as pendiente,
    count(*) as cantidad
  from pagos p
  where p.fecha_vencimiento between p_desde and p_hasta
     or (p.fecha_vencimiento is null and p.fecha_registro between p_desde and p_hasta)
  group by p.tipo
  order by devengado desc;
$$;

comment on function ingresos_periodo is
  'Fuente unica de verdad para "ingresos del periodo". Devengo = fecha_vencimiento
   (o fecha_registro si no tiene vencimiento, ej. pagos ya saldados sin cuota pendiente).
   Todas las pantallas financieras deben llamar esta funcion, nunca sumar
   pagos.monto_total directo con un filtro propio.';
