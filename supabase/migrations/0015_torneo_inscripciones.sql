-- Puente real Deportivo<->Finanzas: inscripcion individual de un alumno
-- a un torneo, con su cuota. Decision aprobada 2026-10-09.

create type estado_inscripcion_torneo as enum ('pendiente', 'aprobada', 'rechazada', 'retirada');

create table torneo_inscripciones (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null references torneos(id) on delete cascade,
  alumno_id uuid not null references alumnos(id) on delete cascade,
  estado estado_inscripcion_torneo not null default 'pendiente',
  pago_id uuid references pagos(id) on delete set null,
  aprobado_por uuid references profiles(id) on delete set null,
  aprobado_en timestamptz,
  notas text,
  created_at timestamptz not null default now(),
  unique (torneo_id, alumno_id)
);
create index idx_torneo_inscripciones_torneo on torneo_inscripciones(torneo_id);
create index idx_torneo_inscripciones_alumno on torneo_inscripciones(alumno_id);
create index idx_torneo_inscripciones_pago on torneo_inscripciones(pago_id);

alter table torneo_inscripciones enable row level security;
create policy staff_all_torneo_inscripciones on torneo_inscripciones for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy entrenador_read_torneo_inscripciones on torneo_inscripciones for select using (
  auth_rol() = 'entrenador' and torneo_id in (
    select torneo_id from torneo_categorias tc
    join entrenador_categorias ec on ec.categoria_id = tc.categoria_id
    join entrenadores e on e.id = ec.entrenador_id
    where e.profile_id = auth.uid()
  )
);
create policy apoderado_read_torneo_inscripciones on torneo_inscripciones for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa
    join apoderados a on a.id = aa.apoderado_id
    where a.profile_id = auth.uid()
  )
);
