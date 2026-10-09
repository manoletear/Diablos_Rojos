-- Reemplaza "minutajes" (vacia, nunca usada) por box score real por
-- jugador con auditoria de edicion manual. Decision aprobada 2026-10-09.

drop table if exists minutajes;

create type fuente_minutos as enum ('calculado', 'manual');

create table minutajes_partido (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references partidos(id) on delete cascade,
  alumno_id uuid not null references alumnos(id) on delete cascade,
  titular boolean not null default false,
  posicion text,
  minutos_jugados int not null default 0,
  minutos_fuente fuente_minutos not null default 'calculado',
  minutos_editado_por uuid references profiles(id) on delete set null,
  minutos_editado_en timestamptz,
  goles int not null default 0,
  asistencias int not null default 0,
  amarillas int not null default 0,
  rojas int not null default 0,
  nota_entrenador numeric(3,1),
  comentario_entrenador text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partido_id, alumno_id)
);
create index idx_minutajes_partido_partido on minutajes_partido(partido_id);
create index idx_minutajes_partido_alumno on minutajes_partido(alumno_id);

alter table minutajes_partido enable row level security;
create policy staff_all_minutajes_partido on minutajes_partido for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy entrenador_all_minutajes_partido on minutajes_partido for all using (
  auth_rol() = 'entrenador' and partido_id in (
    select p.id from partidos p
    join entrenador_categorias ec on ec.categoria_id = p.categoria_id
    join entrenadores e on e.id = ec.entrenador_id
    where e.profile_id = auth.uid()
  )
) with check (
  auth_rol() = 'entrenador' and partido_id in (
    select p.id from partidos p
    join entrenador_categorias ec on ec.categoria_id = p.categoria_id
    join entrenadores e on e.id = ec.entrenador_id
    where e.profile_id = auth.uid()
  )
);
create policy apoderado_read_minutajes_partido on minutajes_partido for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa
    join apoderados a on a.id = aa.apoderado_id
    where a.profile_id = auth.uid()
  )
);
