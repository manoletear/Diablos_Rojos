-- Convocatoria con estado completo (no solo boolean rechazada) + quien
-- confirmo. Decision aprobada 2026-10-09.

create type estado_convocatoria as enum ('pendiente', 'confirmada', 'rechazada');

alter table convocatoria_jugadores
  add column if not exists estado estado_convocatoria,
  add column if not exists confirmado_por uuid references profiles(id) on delete set null,
  add column if not exists confirmado_en timestamptz;

update convocatoria_jugadores
set estado = case when rechazada then 'rechazada' else 'confirmada' end::estado_convocatoria
where estado is null;

alter table convocatoria_jugadores alter column estado set not null;
alter table convocatoria_jugadores alter column estado set default 'pendiente';

comment on column convocatoria_jugadores.rechazada is
  'Legacy: usar "estado" para logica nueva. Se mantiene por compatibilidad con datos importados.';
