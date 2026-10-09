-- Decisiones aprobadas 2026-10-09:
--  1. Alumno<->Categoria pasa a N:M (alumno_categorias), con es_principal.
--     alumnos.categoria_id se mantiene como categoria principal cacheada
--     (no se rompe ninguna pagina existente); alumno_categorias es la
--     fuente de verdad para el dia que un alumno tenga mas de una.
--  2. Matricula por sede (matriculas_sede) ademas de por categoria+temporada.

create table alumno_categorias (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references alumnos(id) on delete cascade,
  categoria_id uuid not null references categorias(id) on delete cascade,
  es_principal boolean not null default true,
  created_at timestamptz not null default now(),
  unique (alumno_id, categoria_id)
);
create index idx_alumno_categorias_alumno on alumno_categorias(alumno_id);
create index idx_alumno_categorias_categoria on alumno_categorias(categoria_id);

insert into alumno_categorias (alumno_id, categoria_id, es_principal)
select id, categoria_id, true from alumnos where categoria_id is not null
on conflict do nothing;

-- un solo "principal" por alumno
create unique index idx_alumno_categorias_un_principal
  on alumno_categorias(alumno_id) where es_principal;

-- ---------- Matricula por sede ----------
create type estado_matricula_sede as enum ('activa', 'finalizada', 'suspendida');

create table matriculas_sede (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references alumnos(id) on delete cascade,
  sede_id uuid not null references sedes(id) on delete restrict,
  estado estado_matricula_sede not null default 'activa',
  fecha_inicio date not null default current_date,
  fecha_fin date,
  notas text,
  created_at timestamptz not null default now()
);
create index idx_matriculas_sede_alumno on matriculas_sede(alumno_id);

insert into matriculas_sede (alumno_id, sede_id, estado, fecha_inicio)
select id, sede_id, 'activa', coalesce(fecha_inscripcion, current_date)
from alumnos where sede_id is not null;

-- ---------- Matricula por categoria + temporada (puente Academia<->Finanzas) ----------
create type tipo_cuota_matricula as enum ('full', 'reducida', 'exenta');

create table matriculas_categoria (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references alumnos(id) on delete cascade,
  categoria_id uuid not null references categorias(id) on delete cascade,
  temporada_id uuid not null references temporadas(id) on delete cascade,
  estado text not null default 'activa' check (estado in ('activa', 'pendiente_pago')),
  tipo_cuota tipo_cuota_matricula not null default 'full',
  pago_id uuid references pagos(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (alumno_id, categoria_id, temporada_id)
);
create index idx_matriculas_categoria_alumno on matriculas_categoria(alumno_id);
create index idx_matriculas_categoria_pago on matriculas_categoria(pago_id);

-- backfill: una fila por alumno matriculado, ligada a su pago de matricula
-- si existe (match por alumno_id + tipo='matricula'), si no, sin pago_id.
insert into matriculas_categoria (alumno_id, categoria_id, temporada_id, estado, pago_id)
select a.id, a.categoria_id, t.id, 'activa',
  (select p.id from pagos p where p.alumno_id = a.id and p.tipo = 'matricula' order by p.fecha_registro desc limit 1)
from alumnos a
cross join (select id from temporadas where activa limit 1) t
where a.categoria_id is not null and a.estado = 'matriculado'
on conflict do nothing;

alter table alumno_categorias enable row level security;
alter table matriculas_sede enable row level security;
alter table matriculas_categoria enable row level security;

create policy staff_all_alumno_categorias on alumno_categorias for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy entrenador_read_alumno_categorias on alumno_categorias for select using (
  auth_rol() = 'entrenador' and categoria_id in (
    select categoria_id from entrenador_categorias ec join entrenadores e on e.id = ec.entrenador_id where e.profile_id = auth.uid()
  )
);
create policy apoderado_read_alumno_categorias on alumno_categorias for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa join apoderados a on a.id = aa.apoderado_id where a.profile_id = auth.uid()
  )
);

create policy staff_all_matriculas_sede on matriculas_sede for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy apoderado_read_matriculas_sede on matriculas_sede for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa join apoderados a on a.id = aa.apoderado_id where a.profile_id = auth.uid()
  )
);

create policy staff_all_matriculas_categoria on matriculas_categoria for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy apoderado_read_matriculas_categoria on matriculas_categoria for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa join apoderados a on a.id = aa.apoderado_id where a.profile_id = auth.uid()
  )
);
