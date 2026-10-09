-- Kinesiologia: catalogo + ficha operativa (visible staff/apoderado) +
-- ficha clinica separada (solo profesional tratante + director como
-- supervisor clinico) + sesiones de tratamiento (clinico).
-- Decision aprobada 2026-10-09.

create table lesiones_catalogo (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  nombre text not null,
  region_corporal text,
  tipo_lesion text,
  severidad_default severidad_restriccion,
  dias_recuperacion_default int,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create type estado_lesion as enum ('activa', 'en_tratamiento', 'alta_medica', 'alta_deportiva', 'archivada');
create type lado_lesion as enum ('izquierdo', 'derecho', 'bilateral', 'no_aplica');
create type contexto_lesion as enum ('entrenamiento', 'partido', 'fuera_del_club', 'desconocido');

-- Capa operativa: lo que ve staff/apoderado, sin diagnostico clinico detallado.
create table lesiones_operativo (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references alumnos(id) on delete cascade,
  catalogo_item_id uuid references lesiones_catalogo(id) on delete set null,
  partido_id uuid references partidos(id) on delete set null,
  restriccion_id uuid references restricciones_salud(id) on delete set null,
  fecha_lesion date not null,
  region_corporal text,
  lado lado_lesion default 'no_aplica',
  contexto contexto_lesion default 'desconocido',
  estado estado_lesion not null default 'activa',
  fecha_retorno_estimada date,
  alta_medica_fecha date,
  alta_medica_por uuid references profiles(id) on delete set null,
  alta_deportiva_fecha date,
  alta_deportiva_por uuid references profiles(id) on delete set null,
  resumen_apoderado text,       -- lo que ve el apoderado
  recomendacion_staff text,     -- lo que ve el entrenador, sin clinica
  apoderado_notificado boolean not null default false,
  instrucciones_apoderado text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_lesiones_operativo_alumno on lesiones_operativo(alumno_id);
create index idx_lesiones_operativo_estado on lesiones_operativo(estado) where estado not in ('alta_deportiva','archivada');

-- Capa clinica: SOLO profesional tratante + director (supervisor clinico).
create table lesiones_clinico (
  id uuid primary key default gen_random_uuid(),
  lesion_operativo_id uuid not null unique references lesiones_operativo(id) on delete cascade,
  mecanismo text,
  diagnostico text,
  derivacion_externa text,
  notas_clinicas text,
  profesional_tratante uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lesiones_sesiones_tratamiento (
  id uuid primary key default gen_random_uuid(),
  lesion_operativo_id uuid not null references lesiones_operativo(id) on delete cascade,
  recorded_by uuid references profiles(id) on delete set null,
  fecha timestamptz not null default now(),
  tipo_sesion text,
  nivel_dolor int check (nivel_dolor between 0 and 10),
  rango_movimiento text,
  inflamacion boolean,
  tratamiento_aplicado text,
  feedback_alumno text,
  notas_progreso text,
  proxima_sesion date,
  created_at timestamptz not null default now()
);
create index idx_lesiones_sesiones_lesion on lesiones_sesiones_tratamiento(lesion_operativo_id);

create table lesiones_adjuntos (
  id uuid primary key default gen_random_uuid(),
  lesion_operativo_id uuid not null references lesiones_operativo(id) on delete cascade,
  uploaded_by uuid references profiles(id) on delete set null,
  storage_path text not null,  -- path dentro del bucket privado, nunca URL publica
  nombre_archivo text,
  tipo_archivo text,
  descripcion text,
  created_at timestamptz not null default now()
);

-- RLS
alter table lesiones_catalogo enable row level security;
alter table lesiones_operativo enable row level security;
alter table lesiones_clinico enable row level security;
alter table lesiones_sesiones_tratamiento enable row level security;
alter table lesiones_adjuntos enable row level security;

create policy read_lesiones_catalogo on lesiones_catalogo for select using (auth.uid() is not null);
create policy staff_write_lesiones_catalogo on lesiones_catalogo for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));

-- Operativo: staff y profesional_salud gestionan; entrenador/apoderado solo leen.
create policy staff_all_lesiones_operativo on lesiones_operativo for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy profesional_all_lesiones_operativo on lesiones_operativo for all using (auth_rol() = 'profesional_salud') with check (auth_rol() = 'profesional_salud');
create policy entrenador_read_lesiones_operativo on lesiones_operativo for select using (
  auth_rol() = 'entrenador' and alumno_id in (
    select al.id from alumnos al
    join entrenador_categorias ec on ec.categoria_id = al.categoria_id
    join entrenadores e on e.id = ec.entrenador_id
    where e.profile_id = auth.uid()
  )
);
create policy apoderado_read_lesiones_operativo on lesiones_operativo for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa
    join apoderados a on a.id = aa.apoderado_id
    where a.profile_id = auth.uid()
  )
);

-- Clinico: SOLO el profesional tratante de esa ficha o el director.
create policy clinico_lesiones on lesiones_clinico for all using (
  auth_rol() = 'director'
  or (auth_rol() = 'profesional_salud' and profesional_tratante = auth.uid())
) with check (
  auth_rol() = 'director'
  or (auth_rol() = 'profesional_salud' and profesional_tratante = auth.uid())
);

create policy clinico_sesiones_tratamiento on lesiones_sesiones_tratamiento for all using (
  auth_rol() = 'director'
  or (auth_rol() = 'profesional_salud' and recorded_by = auth.uid())
  or (auth_rol() = 'profesional_salud' and lesion_operativo_id in (
    select lesion_operativo_id from lesiones_clinico where profesional_tratante = auth.uid()
  ))
) with check (
  auth_rol() = 'director'
  or (auth_rol() = 'profesional_salud' and recorded_by = auth.uid())
);

create policy clinico_lesiones_adjuntos on lesiones_adjuntos for all using (
  auth_rol() = 'director'
  or (auth_rol() = 'profesional_salud' and uploaded_by = auth.uid())
  or (auth_rol() = 'profesional_salud' and lesion_operativo_id in (
    select lesion_operativo_id from lesiones_clinico where profesional_tratante = auth.uid()
  ))
) with check (
  auth_rol() = 'director'
  or (auth_rol() = 'profesional_salud' and uploaded_by = auth.uid())
);
