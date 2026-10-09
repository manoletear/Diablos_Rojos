-- Fase 4 — Deportivo: partidos, convocatorias, lineup, eventos, minutaje
-- + columnas faltantes en categorias para vincular entrenador y precio base

alter table categorias
  add column if not exists entrenador_principal_id uuid references entrenadores(id) on delete set null,
  add column if not exists mensualidad_base numeric(12,2);

create table recintos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  created_at timestamptz not null default now()
);

create table torneos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  formato_tiempos int,
  formato_minutos int,
  created_at timestamptz not null default now()
);

create type estado_partido as enum ('programado', 'en_curso', 'completado', 'cancelado');
create type local_visita as enum ('local', 'visita');

create table partidos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references categorias(id) on delete cascade,
  torneo_id uuid references torneos(id) on delete set null,
  recinto_id uuid references recintos(id) on delete set null,
  rival text not null,
  fecha_hora timestamptz not null,
  local_o_visita local_visita not null default 'local',
  estado estado_partido not null default 'programado',
  resultado_local int,
  resultado_rival int,
  created_at timestamptz not null default now()
);

create table convocatorias (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null unique references partidos(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table convocatoria_jugadores (
  convocatoria_id uuid not null references convocatorias(id) on delete cascade,
  alumno_id uuid not null references alumnos(id) on delete cascade,
  rechazada boolean not null default false,
  primary key (convocatoria_id, alumno_id)
);

create table lineups (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null unique references partidos(id) on delete cascade,
  formacion text,
  datos_json jsonb,
  created_at timestamptz not null default now()
);

create type tipo_evento_partido as enum ('gol', 'amarilla', 'roja', 'cambio');

create table eventos_partido (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references partidos(id) on delete cascade,
  alumno_id uuid references alumnos(id) on delete set null,
  minuto int,
  tipo tipo_evento_partido not null,
  created_at timestamptz not null default now()
);

create table minutajes (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references partidos(id) on delete cascade,
  alumno_id uuid not null references alumnos(id) on delete cascade,
  minutos_jugados int not null default 0,
  unique (partido_id, alumno_id)
);

create index idx_partidos_categoria on partidos(categoria_id, fecha_hora);
create index idx_partidos_estado on partidos(estado);
create index idx_convocatoria_jugadores_alumno on convocatoria_jugadores(alumno_id);
create index idx_eventos_partido_partido on eventos_partido(partido_id);
create index idx_minutajes_alumno on minutajes(alumno_id);

alter table recintos enable row level security;
alter table torneos enable row level security;
alter table partidos enable row level security;
alter table convocatorias enable row level security;
alter table convocatoria_jugadores enable row level security;
alter table lineups enable row level security;
alter table eventos_partido enable row level security;
alter table minutajes enable row level security;

create policy staff_all_recintos on recintos for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_torneos on torneos for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_partidos on partidos for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_convocatorias on convocatorias for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_convocatoria_jugadores on convocatoria_jugadores for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_lineups on lineups for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_eventos on eventos_partido for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_minutajes on minutajes for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));

-- entrenador: lectura/gestion de partidos de sus categorias
create policy entrenador_all_partidos on partidos for all using (
  auth_rol() = 'entrenador' and categoria_id in (
    select categoria_id from entrenador_categorias ec
    join entrenadores e on e.id = ec.entrenador_id
    where e.profile_id = auth.uid()
  )
) with check (
  auth_rol() = 'entrenador' and categoria_id in (
    select categoria_id from entrenador_categorias ec
    join entrenadores e on e.id = ec.entrenador_id
    where e.profile_id = auth.uid()
  )
);

-- lectura publica (cualquier rol autenticado) de recintos/torneos — datos de referencia sin dato sensible
create policy read_recintos on recintos for select using (auth.uid() is not null);
create policy read_torneos on torneos for select using (auth.uid() is not null);

-- apoderado: lectura de partidos/eventos/minutaje de sus hijos (solo informativo)
create policy apoderado_read_partidos on partidos for select using (
  auth_rol() = 'apoderado' and categoria_id in (
    select categoria_id from alumnos al
    join apoderado_alumno aa on aa.alumno_id = al.id
    join apoderados a on a.id = aa.apoderado_id
    where a.profile_id = auth.uid()
  )
);
create policy apoderado_read_eventos on eventos_partido for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa
    join apoderados a on a.id = aa.apoderado_id
    where a.profile_id = auth.uid()
  )
);
create policy apoderado_read_minutajes on minutajes for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa
    join apoderados a on a.id = aa.apoderado_id
    where a.profile_id = auth.uid()
  )
);
