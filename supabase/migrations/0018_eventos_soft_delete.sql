-- Soft delete auditado para eventos de partido (nunca borrar la fila).
-- Decision aprobada 2026-10-09.

alter table eventos_partido
  add column if not exists eliminado boolean not null default false,
  add column if not exists eliminado_por uuid references profiles(id) on delete set null,
  add column if not exists eliminado_en timestamptz,
  add column if not exists motivo_eliminacion text;

create index if not exists idx_eventos_partido_activos on eventos_partido(partido_id) where not eliminado;
