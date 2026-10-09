-- Fase 1 — Núcleo: roles, sedes, temporadas, categorías, alumnos, apoderados, ficha médica
-- Diablos Rojos — plataforma propia

create extension if not exists "pgcrypto";

-- =========================================================
-- Roles / perfiles
-- =========================================================
create type user_role as enum ('director', 'admin', 'entrenador', 'apoderado');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text,
  rol user_role not null default 'apoderado',
  created_at timestamptz not null default now()
);

-- =========================================================
-- Núcleo organizacional
-- =========================================================
create table sedes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  created_at timestamptz not null default now()
);

create table temporadas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  fecha_inicio date not null,
  fecha_fin date not null,
  activa boolean not null default false,
  created_at timestamptz not null default now()
);

create table categorias (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references sedes(id) on delete restrict,
  nombre text not null,
  anio_desde int,
  anio_hasta int,
  dias_horario text,
  estado text not null default 'activa' check (estado in ('activa', 'inactiva')),
  created_at timestamptz not null default now()
);

create table entrenadores (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  nombre text not null,
  email text,
  telefono text,
  created_at timestamptz not null default now()
);

create table entrenador_categorias (
  entrenador_id uuid not null references entrenadores(id) on delete cascade,
  categoria_id uuid not null references categorias(id) on delete cascade,
  primary key (entrenador_id, categoria_id)
);

-- =========================================================
-- Personas
-- =========================================================
create table apoderados (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  nombre text not null,
  email text,
  telefono text,
  created_at timestamptz not null default now()
);

create table alumnos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  rut text,
  fecha_nacimiento date,
  categoria_id uuid references categorias(id) on delete set null,
  sede_id uuid references sedes(id) on delete set null,
  temporada_id uuid references temporadas(id) on delete set null,
  estado text not null default 'en_prueba' check (estado in ('en_prueba', 'matriculado', 'retirado')),
  posicion text,
  numero_camiseta int,
  nombre_camiseta text,
  talla_camiseta text,
  beca_pct numeric(5,2) default 0,
  cuota_personalizada numeric(12,2),
  fecha_inscripcion date default current_date,
  created_at timestamptz not null default now()
);

create table apoderado_alumno (
  apoderado_id uuid not null references apoderados(id) on delete cascade,
  alumno_id uuid not null references alumnos(id) on delete cascade,
  parentesco text,
  es_principal boolean not null default false,
  primary key (apoderado_id, alumno_id)
);

create table fichas_medicas (
  alumno_id uuid primary key references alumnos(id) on delete cascade,
  grupo_sanguineo text,
  condiciones_medicas text,
  alergias text,
  seguro_escolar boolean default false,
  nombre_seguro text
);

-- =========================================================
-- Índices
-- =========================================================
create index idx_alumnos_categoria on alumnos(categoria_id);
create index idx_alumnos_estado on alumnos(estado);
create index idx_categorias_sede on categorias(sede_id);
create index idx_apoderado_alumno_alumno on apoderado_alumno(alumno_id);

-- =========================================================
-- RLS
-- =========================================================
alter table profiles enable row level security;
alter table sedes enable row level security;
alter table temporadas enable row level security;
alter table categorias enable row level security;
alter table entrenadores enable row level security;
alter table entrenador_categorias enable row level security;
alter table apoderados enable row level security;
alter table alumnos enable row level security;
alter table apoderado_alumno enable row level security;
alter table fichas_medicas enable row level security;

-- helper: rol del usuario autenticado
create function auth_rol() returns user_role
language sql stable security definer
set search_path = public
as $$
  select rol from profiles where id = auth.uid()
$$;

-- profiles: cada usuario ve/edita el suyo; director/admin ven todos
create policy profiles_self on profiles for select using (id = auth.uid());
create policy profiles_admin_all on profiles for select using (auth_rol() in ('director','admin'));
create policy profiles_self_update on profiles for update using (id = auth.uid());

-- staff (director/admin) tiene acceso total de lectura/escritura a datos operativos
create policy staff_all_sedes on sedes for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_temporadas on temporadas for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_categorias on categorias for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_entrenadores on entrenadores for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_entrenador_categorias on entrenador_categorias for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_apoderados on apoderados for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_alumnos on alumnos for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_apoderado_alumno on apoderado_alumno for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_fichas on fichas_medicas for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));

-- entrenador: lectura de alumnos/categorías asignadas
create policy entrenador_read_categorias on categorias for select using (
  auth_rol() = 'entrenador' and id in (
    select categoria_id from entrenador_categorias ec
    join entrenadores e on e.id = ec.entrenador_id
    where e.profile_id = auth.uid()
  )
);
create policy entrenador_read_alumnos on alumnos for select using (
  auth_rol() = 'entrenador' and categoria_id in (
    select categoria_id from entrenador_categorias ec
    join entrenadores e on e.id = ec.entrenador_id
    where e.profile_id = auth.uid()
  )
);

-- apoderado: solo sus hijos
create policy apoderado_read_alumnos on alumnos for select using (
  auth_rol() = 'apoderado' and id in (
    select alumno_id from apoderado_alumno aa
    join apoderados a on a.id = aa.apoderado_id
    where a.profile_id = auth.uid()
  )
);
create policy apoderado_read_fichas on fichas_medicas for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa
    join apoderados a on a.id = aa.apoderado_id
    where a.profile_id = auth.uid()
  )
);
create policy apoderado_read_self on apoderados for select using (profile_id = auth.uid());
