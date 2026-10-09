-- Consentimiento informado obligatorio antes de registrar sesiones
-- psicologicas. Telar tiene 0/16 casos con consentimiento -- el
-- defecto mas grave del documento de referencia, no se replica bajo
-- ninguna circunstancia. Decision aprobada 2026-10-09.

create type tipo_consentimiento as enum ('atencion_psicologica', 'atencion_kinesiologica', 'uso_imagen', 'otro');

create table consentimientos (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references alumnos(id) on delete cascade,
  apoderado_id uuid not null references apoderados(id) on delete restrict,
  tipo tipo_consentimiento not null,
  version_documento text not null,
  otorgado_en timestamptz not null default now(),
  metodo text,  -- firma_digital | presencial | telefono
  revocado_en timestamptz,
  revocado_motivo text,
  created_at timestamptz not null default now()
);
create index idx_consentimientos_alumno_tipo on consentimientos(alumno_id, tipo);

alter table consentimientos enable row level security;
create policy staff_all_consentimientos on consentimientos for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy profesional_read_consentimientos on consentimientos for select using (auth_rol() = 'profesional_salud');
create policy apoderado_all_own_consentimientos on consentimientos for all using (
  auth_rol() = 'apoderado' and apoderado_id in (select id from apoderados where profile_id = auth.uid())
) with check (
  auth_rol() = 'apoderado' and apoderado_id in (select id from apoderados where profile_id = auth.uid())
);

create function consentimiento_vigente(p_alumno_id uuid, p_tipo tipo_consentimiento) returns boolean
language sql stable as $$
  select exists(
    select 1 from consentimientos
    where alumno_id = p_alumno_id and tipo = p_tipo and revocado_en is null
  )
$$;
