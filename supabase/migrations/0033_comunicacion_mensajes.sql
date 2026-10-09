-- mensajes (lo que se compone) separado de mensaje_envios (1 fila por
-- canal x destinatario, estado que de verdad avanza). En Telar estan
-- mezclados y el resultado es 517/517 mensajes en 'queued' para
-- siempre. Decision aprobada 2026-10-09.

create type canal_mensaje as enum ('whatsapp_api', 'wa_me', 'email');
create type estado_envio as enum ('en_cola', 'enviado', 'entregado', 'leido', 'fallido');
create type tipo_origen_mensaje as enum ('pago', 'partido', 'sesion_entrenamiento', 'torneo', 'manual');

create table mensajes (
  id uuid primary key default gen_random_uuid(),
  plantilla_id uuid references plantillas_mensaje(id) on delete set null,
  tipo tipo_mensaje not null,
  alumno_id uuid references alumnos(id) on delete set null,
  cuerpo_renderizado text not null,
  variables_usadas jsonb,
  source_type tipo_origen_mensaje not null default 'manual',
  source_id uuid,  -- FK polimorfica: id de pagos/partidos/sesiones_entrenamiento/torneos segun source_type
  creado_por uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_mensajes_alumno on mensajes(alumno_id);
create index idx_mensajes_source on mensajes(source_type, source_id);

create table mensaje_envios (
  id uuid primary key default gen_random_uuid(),
  mensaje_id uuid not null references mensajes(id) on delete cascade,
  apoderado_id uuid not null references apoderados(id) on delete cascade,
  canal canal_mensaje not null,
  estado estado_envio not null default 'en_cola',
  proveedor_mensaje_id text,  -- id que devuelve Meta Cloud API / BSP, para cruzar webhooks
  wa_url text,                -- solo si canal='wa_me' (fallback manual)
  token_respuesta uuid default gen_random_uuid(),  -- para confirmar convocatoria sin login
  enviado_en timestamptz,
  entregado_en timestamptz,
  leido_en timestamptz,
  fallo_motivo text,
  created_at timestamptz not null default now()
);
create index idx_mensaje_envios_mensaje on mensaje_envios(mensaje_id);
create index idx_mensaje_envios_apoderado on mensaje_envios(apoderado_id);
create index idx_mensaje_envios_token on mensaje_envios(token_respuesta);
create unique index idx_mensaje_envios_proveedor_id on mensaje_envios(proveedor_mensaje_id) where proveedor_mensaje_id is not null;

alter table mensajes enable row level security;
alter table mensaje_envios enable row level security;

create policy staff_all_mensajes on mensajes for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_mensaje_envios on mensaje_envios for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy apoderado_read_mensaje_envios on mensaje_envios for select using (
  auth_rol() = 'apoderado' and apoderado_id in (select id from apoderados where profile_id = auth.uid())
);
