-- Resumen de minutaje por alumno/temporada (datos agregados, no
-- derivables de partidos+convocatorias porque Telar no exporta minutos
-- por partido, solo el resumen ya calculado).

create table minutaje_resumen (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references alumnos(id) on delete cascade,
  categoria_id uuid references categorias(id) on delete set null,
  temporada text not null,
  estado text,
  fecha_incorporacion date,
  entrenamientos_presente int,
  entrenamientos_registrados int,
  asistencia_pct numeric(5,1),
  jornadas_categoria int,
  partidos_categoria int,
  convocado_jornadas int,
  convocado_partidos int,
  convocatorias_rechazadas int,
  convocatoria_pct numeric(5,2),
  partidos_con_minutos int,
  partidos_sin_entrar int,
  minutaje_efectivo_pct numeric(5,1),
  datos_insuficientes boolean,
  minutos_cat_propia int,
  minutos_otras_cat int,
  minutos_totales int,
  minutos_ult5_jornadas int,
  jornadas_ult5 int,
  cumple_asistencia_60 boolean,
  cumple_convocatoria_70 boolean,
  cumple_minutos_50 boolean,
  unique (alumno_id, temporada)
);

create table minutaje_categoria_resumen (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references categorias(id) on delete cascade,
  temporada text not null,
  alumnos int,
  jornadas int,
  partidos int,
  minutos_totales int,
  citados_promedio_jornada numeric(6,1),
  unique (categoria_id, temporada)
);

create index idx_minutaje_resumen_categoria on minutaje_resumen(categoria_id);

alter table minutaje_resumen enable row level security;
alter table minutaje_categoria_resumen enable row level security;

create policy staff_all_minutaje_resumen on minutaje_resumen for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_minutaje_cat_resumen on minutaje_categoria_resumen for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));

create policy entrenador_read_minutaje_resumen on minutaje_resumen for select using (
  auth_rol() = 'entrenador' and categoria_id in (
    select categoria_id from entrenador_categorias ec
    join entrenadores e on e.id = ec.entrenador_id
    where e.profile_id = auth.uid()
  )
);
create policy apoderado_read_minutaje_resumen on minutaje_resumen for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa
    join apoderados a on a.id = aa.apoderado_id
    where a.profile_id = auth.uid()
  )
);
