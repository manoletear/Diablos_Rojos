-- Antropometria: la mas simple de Salud (sin consentimiento, sin notas
-- clinicas), percentiles calculados contra tabla OMS versionada en
-- servidor, nunca hardcodeado. Decision aprobada 2026-10-09.

create table oms_tablas_referencia (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  sexo text not null check (sexo in ('M','F')),
  edad_meses int not null,
  tipo_medida text not null check (tipo_medida in ('imc','talla','peso')),
  percentil numeric(5,2) not null,
  valor numeric(8,3) not null,
  created_at timestamptz not null default now(),
  unique (version, sexo, edad_meses, tipo_medida, percentil)
);
create index idx_oms_lookup on oms_tablas_referencia(version, sexo, edad_meses, tipo_medida);

comment on table oms_tablas_referencia is
  'Sembrar con las tablas publicas OMS (growthreference.who.int) antes de
   usar mediciones_antropometricas.calcular_percentiles(). Sin datos acá
   las mediciones se guardan pero sin percentil calculado.';

create table mediciones_antropometricas (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references alumnos(id) on delete cascade,
  categoria_id uuid references categorias(id) on delete set null,
  temporada_id uuid references temporadas(id) on delete set null,
  medido_por uuid references profiles(id) on delete set null,
  fecha_medicion date not null default current_date,
  periodo_medicion text,  -- inicio | mitad | fin de temporada
  peso_kg numeric(5,2),
  talla_cm numeric(5,1),
  imc numeric(5,2) generated always as (
    case when peso_kg is not null and talla_cm is not null and talla_cm > 0
      then round((peso_kg / ((talla_cm/100.0)^2))::numeric, 2)
      else null end
  ) stored,
  imc_percentil numeric(5,2),
  talla_percentil numeric(5,2),
  peso_percentil numeric(5,2),
  oms_version_usada text,
  categoria_imc text,  -- bajo_peso | normal | sobrepeso | obesidad (derivado del percentil, calculado en servidor)
  tiene_alerta boolean not null default false,
  tipo_alerta text,
  mensaje_alerta text,
  alerta_revisada boolean not null default false,
  alerta_revisada_por uuid references profiles(id) on delete set null,
  alerta_revisada_en timestamptz,
  nota_revision text,
  notas text,
  created_at timestamptz not null default now()
);
create index idx_mediciones_alumno on mediciones_antropometricas(alumno_id);
create index idx_mediciones_alertas on mediciones_antropometricas(alumno_id) where tiene_alerta and not alerta_revisada;

-- Calculo de percentil contra la tabla OMS versionada (busca el mas cercano
-- por edad en meses dentro de la version activa mas reciente).
create function calcular_percentil_oms(p_sexo text, p_edad_meses int, p_tipo text, p_valor numeric)
returns numeric
language sql stable as $$
  select t.percentil
  from oms_tablas_referencia t
  where t.sexo = p_sexo and t.tipo_medida = p_tipo
    and t.version = (select max(version) from oms_tablas_referencia)
  order by abs(t.edad_meses - p_edad_meses), abs(t.valor - p_valor)
  limit 1
$$;

alter table oms_tablas_referencia enable row level security;
alter table mediciones_antropometricas enable row level security;

create policy read_oms_tablas on oms_tablas_referencia for select using (auth.uid() is not null);
create policy staff_write_oms_tablas on oms_tablas_referencia for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));

create policy staff_all_mediciones on mediciones_antropometricas for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy profesional_all_mediciones on mediciones_antropometricas for all using (auth_rol() = 'profesional_salud') with check (auth_rol() = 'profesional_salud');
create policy entrenador_read_mediciones on mediciones_antropometricas for select using (
  auth_rol() = 'entrenador' and alumno_id in (
    select al.id from alumnos al
    join entrenador_categorias ec on ec.categoria_id = al.categoria_id
    join entrenadores e on e.id = ec.entrenador_id
    where e.profile_id = auth.uid()
  )
);
create policy apoderado_read_mediciones on mediciones_antropometricas for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa join apoderados a on a.id = aa.apoderado_id where a.profile_id = auth.uid()
  )
);
