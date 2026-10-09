-- Psicologia: el dato mas sensible del sistema. Mismo patron de capas
-- que Kinesiologia (operativo/apoderado/staff vs clinico), con el
-- agregado del consentimiento obligatorio bloqueado por constraint de
-- base de datos (no solo validacion de UI). Decision aprobada 2026-10-09.

create table psicologia_catalogo (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  nombre text not null,
  categoria text,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create type estado_caso_psicologico as enum ('abierto', 'en_progreso', 'pausado', 'cerrado');
create type origen_derivacion as enum ('entrenador', 'autodeteccion', 'apoderado', 'otro');
create type prioridad_recomendacion as enum ('normal', 'importante', 'urgente');

create table psicologia_casos (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references alumnos(id) on delete cascade,
  catalogo_item_id uuid references psicologia_catalogo(id) on delete set null,
  temporada_id uuid references temporadas(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  abierto_en date not null default current_date,
  cerrado_en date,
  estado estado_caso_psicologico not null default 'abierto',
  origen origen_derivacion,
  derivacion_externa text,
  -- capas compartibles
  resumen_apoderado text,
  recomendacion_staff text,
  recomendacion_staff_vence date,
  recomendacion_staff_prioridad prioridad_recomendacion default 'normal',
  -- consentimiento (obligatorio antes de la primera sesion, ver trigger)
  consentimiento_id uuid references consentimientos(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_psicologia_casos_alumno on psicologia_casos(alumno_id);

-- Clinico: solo el profesional tratante (via sesiones) o director.
create table psicologia_sesiones (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references psicologia_casos(id) on delete cascade,
  recorded_by uuid not null references profiles(id) on delete restrict,
  fecha timestamptz not null default now(),
  duracion_minutos int,
  tipo_sesion text,
  animo_inicio int check (animo_inicio between 1 and 10),
  animo_fin int check (animo_fin between 1 and 10),
  intervenciones text,
  notas_clinicas text,
  notas_progreso text,
  tarea text,
  resumen_apoderado text,
  recomendacion_staff text,
  created_at timestamptz not null default now()
);
create index idx_psicologia_sesiones_caso on psicologia_sesiones(caso_id);

create table psicologia_objetivos (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references psicologia_casos(id) on delete cascade,
  descripcion text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','en_progreso','logrado','descartado')),
  fecha_objetivo date,
  logrado_en timestamptz,
  created_at timestamptz not null default now()
);

create table psicologia_adjuntos (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references psicologia_casos(id) on delete cascade,
  uploaded_by uuid references profiles(id) on delete set null,
  storage_path text not null,
  nombre_archivo text,
  descripcion text,
  created_at timestamptz not null default now()
);

-- Constraint real: no se puede crear un caso sin consentimiento vigente.
create function check_consentimiento_psicologia() returns trigger
language plpgsql as $$
begin
  if not consentimiento_vigente(new.alumno_id, 'atencion_psicologica') then
    raise exception 'No existe consentimiento informado vigente para atencion psicologica de este alumno. Registra el consentimiento antes de abrir el caso.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger trg_check_consentimiento_psicologia
  before insert on psicologia_casos
  for each row execute function check_consentimiento_psicologia();

alter table psicologia_catalogo enable row level security;
alter table psicologia_casos enable row level security;
alter table psicologia_sesiones enable row level security;
alter table psicologia_objetivos enable row level security;
alter table psicologia_adjuntos enable row level security;

create policy read_psicologia_catalogo on psicologia_catalogo for select using (auth.uid() is not null);
create policy staff_write_psicologia_catalogo on psicologia_catalogo for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));

-- Casos: capa compartible visible a director + profesional tratante (via sesiones) + apoderado (solo resumen, via policy de columnas en la app, RLS da la fila completa pero la UI solo debe pintar resumen_apoderado para ese rol).
create policy director_all_psicologia_casos on psicologia_casos for all using (auth_rol() = 'director') with check (auth_rol() = 'director');
create policy profesional_all_psicologia_casos on psicologia_casos for all using (
  auth_rol() = 'profesional_salud' and (created_by = auth.uid() or id in (select caso_id from psicologia_sesiones where recorded_by = auth.uid()))
) with check (auth_rol() = 'profesional_salud');
create policy apoderado_read_psicologia_casos on psicologia_casos for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa join apoderados a on a.id = aa.apoderado_id where a.profile_id = auth.uid()
  )
);

-- Clinico: SOLO quien registro la sesion o director. Nadie mas, ni siquiera admin.
create policy director_all_psicologia_sesiones on psicologia_sesiones for all using (auth_rol() = 'director') with check (auth_rol() = 'director');
create policy profesional_own_psicologia_sesiones on psicologia_sesiones for all using (
  auth_rol() = 'profesional_salud' and recorded_by = auth.uid()
) with check (auth_rol() = 'profesional_salud' and recorded_by = auth.uid());

create policy director_all_psicologia_objetivos on psicologia_objetivos for all using (auth_rol() = 'director') with check (auth_rol() = 'director');
create policy profesional_all_psicologia_objetivos on psicologia_objetivos for all using (
  auth_rol() = 'profesional_salud' and caso_id in (select id from psicologia_casos where created_by = auth.uid())
) with check (auth_rol() = 'profesional_salud');

create policy director_all_psicologia_adjuntos on psicologia_adjuntos for all using (auth_rol() = 'director') with check (auth_rol() = 'director');
create policy profesional_own_psicologia_adjuntos on psicologia_adjuntos for all using (
  auth_rol() = 'profesional_salud' and uploaded_by = auth.uid()
) with check (auth_rol() = 'profesional_salud' and uploaded_by = auth.uid());
