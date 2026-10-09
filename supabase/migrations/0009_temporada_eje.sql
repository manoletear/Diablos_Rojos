-- Temporada como eje real de pagos y asistencia (hoy temporadas existe
-- pero nada la referencia). Decision aprobada 2026-10-09.

insert into temporadas (nombre, fecha_inicio, fecha_fin, activa)
values ('Temporada 2026', '2026-01-01', '2026-12-31', true)
on conflict do nothing;

alter table pagos add column if not exists temporada_id uuid references temporadas(id) on delete set null;
alter table sesiones_entrenamiento add column if not exists temporada_id uuid references temporadas(id) on delete set null;

update pagos set temporada_id = (select id from temporadas where activa limit 1) where temporada_id is null;
update sesiones_entrenamiento set temporada_id = (select id from temporadas where activa limit 1) where temporada_id is null;

create index if not exists idx_pagos_temporada on pagos(temporada_id);
create index if not exists idx_sesiones_temporada on sesiones_entrenamiento(temporada_id);
