-- Fase 2 — Operación diaria: asistencia y pagos

create table sesiones_entrenamiento (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references categorias(id) on delete cascade,
  fecha date not null,
  created_at timestamptz not null default now(),
  unique (categoria_id, fecha)
);

create type estado_asistencia as enum ('presente', 'ausente', 'tardanza', 'justificada');

create table registros_asistencia (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_entrenamiento(id) on delete cascade,
  alumno_id uuid not null references alumnos(id) on delete cascade,
  estado estado_asistencia not null default 'ausente',
  created_at timestamptz not null default now(),
  unique (sesion_id, alumno_id)
);

create type tipo_pago as enum ('matricula', 'mensualidad');
create type estado_pago as enum ('pendiente', 'parcial', 'por_comprobar', 'pagado', 'vencido');

create table pagos (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references alumnos(id) on delete cascade,
  tipo tipo_pago not null,
  periodo text,
  sede_id uuid references sedes(id) on delete set null,
  monto_total numeric(12,2) not null,
  monto_pagado numeric(12,2) not null default 0,
  estado estado_pago not null default 'pendiente',
  fecha_vencimiento date,
  fecha_registro date not null default current_date,
  es_proporcional boolean not null default false,
  dias_proporcional text,
  created_at timestamptz not null default now()
);

create index idx_sesiones_categoria_fecha on sesiones_entrenamiento(categoria_id, fecha);
create index idx_registros_sesion on registros_asistencia(sesion_id);
create index idx_registros_alumno on registros_asistencia(alumno_id);
create index idx_pagos_alumno on pagos(alumno_id);
create index idx_pagos_estado on pagos(estado);

alter table sesiones_entrenamiento enable row level security;
alter table registros_asistencia enable row level security;
alter table pagos enable row level security;

-- staff: acceso total
create policy staff_all_sesiones on sesiones_entrenamiento for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_registros on registros_asistencia for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_pagos on pagos for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));

-- entrenador: gestiona asistencia de sus categorias
create policy entrenador_all_sesiones on sesiones_entrenamiento for all using (
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
create policy entrenador_all_registros on registros_asistencia for all using (
  auth_rol() = 'entrenador' and sesion_id in (
    select s.id from sesiones_entrenamiento s
    join entrenador_categorias ec on ec.categoria_id = s.categoria_id
    join entrenadores e on e.id = ec.entrenador_id
    where e.profile_id = auth.uid()
  )
) with check (
  auth_rol() = 'entrenador' and sesion_id in (
    select s.id from sesiones_entrenamiento s
    join entrenador_categorias ec on ec.categoria_id = s.categoria_id
    join entrenadores e on e.id = ec.entrenador_id
    where e.profile_id = auth.uid()
  )
);

-- apoderado: solo lectura de lo de sus hijos
create policy apoderado_read_registros on registros_asistencia for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa
    join apoderados a on a.id = aa.apoderado_id
    where a.profile_id = auth.uid()
  )
);
create policy apoderado_read_pagos on pagos for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa
    join apoderados a on a.id = aa.apoderado_id
    where a.profile_id = auth.uid()
  )
);
