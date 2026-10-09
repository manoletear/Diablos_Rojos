alter table torneos
  add column if not exists telar_id text unique,
  add column if not exists costo_adicional boolean not null default false,
  add column if not exists plazo_aprobacion date;
