-- Salud - capa operativa: restricciones visibles al entrenador
-- (can_train / can_play_matches), sin detalle clinico. Decision
-- aprobada 2026-10-09. Director actua como supervisor clinico (no se
-- crea un rol separado para eso); se agrega profesional_salud porque
-- sin un rol propio un kinesiologo/psicologo no tiene como loguearse
-- con acceso acotado a sus propios casos (los 4 roles existentes no
-- le calzan: admin es demasiado amplio, entrenador no corresponde).

create type severidad_restriccion as enum ('leve', 'moderada', 'severa');

create table restricciones_salud (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references alumnos(id) on delete cascade,
  can_train boolean not null default true,
  can_train_physical boolean not null default true,
  can_play_matches boolean not null default true,
  severidad severidad_restriccion,
  restricciones text,  -- texto corto operativo, NUNCA diagnostico clinico
  vigente_desde date not null default current_date,
  vigente_hasta date,
  override_staff boolean not null default false,
  override_motivo text,
  override_por uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_restricciones_salud_alumno on restricciones_salud(alumno_id);
create index idx_restricciones_salud_vigentes on restricciones_salud(alumno_id) where vigente_hasta is null;

alter table restricciones_salud enable row level security;
create policy staff_all_restricciones_salud on restricciones_salud for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy entrenador_read_restricciones_salud on restricciones_salud for select using (
  auth_rol() = 'entrenador' and alumno_id in (
    select al.id from alumnos al
    join entrenador_categorias ec on ec.categoria_id = al.categoria_id
    join entrenadores e on e.id = ec.entrenador_id
    where e.profile_id = auth.uid()
  )
);
create policy apoderado_read_restricciones_salud on restricciones_salud for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa
    join apoderados a on a.id = aa.apoderado_id
    where a.profile_id = auth.uid()
  )
);
create policy profesional_all_restricciones_salud on restricciones_salud for all using (auth_rol() = 'profesional_salud') with check (auth_rol() = 'profesional_salud');
