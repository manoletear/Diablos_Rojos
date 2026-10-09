-- Comunicacion: plantillas con catalogo de variables validado (no texto
-- libre sin control como Telar). Decision aprobada 2026-10-09.

create type tipo_mensaje as enum (
  'cumpleanos', 'recordatorio_pago', 'pago_vencido', 'cambio_entrenamiento',
  'entrenamiento_cancelado', 'convocatoria', 'evento', 'general'
);

-- catalogo fijo de variables permitidas por tipo (controla que una
-- plantilla no use una variable que no corresponde a su tipo)
create table variables_mensaje_catalogo (
  tipo tipo_mensaje not null,
  variable text not null,
  descripcion text,
  primary key (tipo, variable)
);

insert into variables_mensaje_catalogo (tipo, variable, descripcion) values
  ('cumpleanos', 'nombre_alumno', 'Nombre del alumno'),
  ('cumpleanos', 'edad', 'Edad que cumple'),
  ('cumpleanos', 'nombre_apoderado', 'Nombre del apoderado destinatario'),
  ('recordatorio_pago', 'nombre_apoderado', 'Nombre del apoderado'),
  ('recordatorio_pago', 'nombre_alumno', 'Nombre del alumno'),
  ('recordatorio_pago', 'concepto', 'Concepto del pago'),
  ('recordatorio_pago', 'monto', 'Monto pendiente'),
  ('recordatorio_pago', 'fecha_vencimiento', 'Fecha de vencimiento'),
  ('pago_vencido', 'nombre_apoderado', 'Nombre del apoderado'),
  ('pago_vencido', 'nombre_alumno', 'Nombre del alumno'),
  ('pago_vencido', 'monto', 'Monto vencido'),
  ('pago_vencido', 'dias_vencido', 'Dias de atraso'),
  ('cambio_entrenamiento', 'categoria', 'Categoria afectada'),
  ('cambio_entrenamiento', 'fecha', 'Fecha del cambio'),
  ('cambio_entrenamiento', 'nuevo_horario', 'Nuevo horario'),
  ('entrenamiento_cancelado', 'categoria', 'Categoria afectada'),
  ('entrenamiento_cancelado', 'fecha', 'Fecha suspendida'),
  ('entrenamiento_cancelado', 'motivo', 'Motivo de la suspension'),
  ('convocatoria', 'nombre_alumno', 'Nombre del alumno'),
  ('convocatoria', 'rival', 'Rival del partido'),
  ('convocatoria', 'lugar', 'Recinto'),
  ('convocatoria', 'fecha_partido', 'Fecha del partido'),
  ('convocatoria', 'hora_partido', 'Hora del partido'),
  ('convocatoria', 'hora_citacion', 'Hora de citacion'),
  ('convocatoria', 'categoria', 'Categoria del partido'),
  ('evento', 'nombre_evento', 'Nombre del evento/torneo'),
  ('evento', 'fecha', 'Fecha del evento'),
  ('general', 'nombre_apoderado', 'Nombre del apoderado'),
  ('general', 'nombre_alumno', 'Nombre del alumno');

create table plantillas_mensaje (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_mensaje not null,
  nombre text not null,
  cuerpo text not null,
  activa boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- valida que el cuerpo de la plantilla solo use variables {{var}}
-- permitidas para su tipo segun el catalogo de arriba.
create function validar_variables_plantilla() returns trigger
language plpgsql as $$
declare
  v_vars text[];
  v_permitidas text[];
  v_var text;
begin
  select array_agg(distinct m[1]) into v_vars
  from regexp_matches(new.cuerpo, '\{\{(\w+)\}\}', 'g') as m;

  select array_agg(variable) into v_permitidas
  from variables_mensaje_catalogo where tipo = new.tipo;

  if v_vars is not null then
    foreach v_var in array v_vars loop
      if v_permitidas is null or not (v_var = any(v_permitidas)) then
        raise exception 'Variable {{%}} no esta en el catalogo permitido para el tipo "%"', v_var, new.tipo
          using errcode = 'P0001';
      end if;
    end loop;
  end if;

  return new;
end;
$$;
create trigger trg_validar_variables_plantilla
  before insert or update on plantillas_mensaje
  for each row execute function validar_variables_plantilla();

alter table variables_mensaje_catalogo enable row level security;
alter table plantillas_mensaje enable row level security;
create policy read_variables_catalogo on variables_mensaje_catalogo for select using (auth.uid() is not null);
create policy staff_all_plantillas on plantillas_mensaje for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
