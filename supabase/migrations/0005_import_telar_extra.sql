-- Columnas adicionales para recibir el export completo de Telar
-- (apoderados con mas campos, partidos/convocatorias con id externo
-- para reimportar sin duplicar).

alter table apoderados
  add column if not exists telar_id text unique,
  add column if not exists direccion text,
  add column if not exists contacto_emergencia text,
  add column if not exists telefono_emergencia text,
  add column if not exists notif_whatsapp boolean,
  add column if not exists notif_email boolean;

alter table partidos
  add column if not exists telar_id text unique;

alter table torneos
  add column if not exists telar_nombre text;

alter type local_visita add value if not exists 'neutral';
