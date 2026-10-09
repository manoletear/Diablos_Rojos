-- Constraints e indices de integridad. Decision aprobada 2026-10-09.
-- Nota: "final_amount = amount - discount" de la referencia no aplica
-- literal aqui porque monto_total ya se genera neto de beca (ver
-- scripts/generar-pagos-mensuales.js); el constraint real que importa
-- es que lo pagado nunca supere lo total.

alter table pagos add constraint chk_pagos_pagado_no_excede
  check (monto_pagado <= monto_total);

alter table pagos add constraint chk_pagos_monto_positivo
  check (monto_total >= 0);

-- unicidad: una sola mensualidad por alumno+periodo+temporada
create unique index if not exists idx_pagos_un_mensualidad_por_periodo
  on pagos(alumno_id, periodo, temporada_id)
  where tipo = 'mensualidad';

create index if not exists idx_pagos_estado_pendientes on pagos(estado) where estado not in ('pagado');
create index if not exists idx_pagos_fecha_vencimiento on pagos(fecha_vencimiento);
create index if not exists idx_apoderado_alumno_relacion on apoderado_alumno(relacion);
