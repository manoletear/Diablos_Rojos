-- Disparadores automaticos desde eventos de dominio ya existentes +
-- anti-spam (limite diario por apoderado, default 3 - ajustable).
-- Importante: esto SOLO encola en mensaje_envios con estado 'en_cola'.
-- No hay integracion real de envio todavia (requiere cuenta WhatsApp
-- Business API, pendiente - Fase 5 de Comunicacion, decidido dejar
-- para despues). Las filas quedan en_cola honestamente, no se
-- fingen enviadas. Decision aprobada 2026-10-09 (triggers 1-4 de
-- Fase 4; limite exacto de anti-spam queda con default ajustable).

create function puede_enviar_mensaje(p_apoderado_id uuid, p_canal canal_mensaje) returns boolean
language plpgsql stable as $$
declare
  v_opt_in boolean;
  v_envios_hoy int;
  v_limite_diario constant int := 3;  -- ajustable: Fase 5 de Comunicacion pendiente de definir con el club
begin
  select case p_canal when 'email' then notif_email else notif_whatsapp end
  into v_opt_in from apoderados where id = p_apoderado_id;

  if coalesce(v_opt_in, true) is false then
    return false;
  end if;

  select count(*) into v_envios_hoy
  from mensaje_envios
  where apoderado_id = p_apoderado_id and created_at::date = current_date;

  return v_envios_hoy < v_limite_diario;
end;
$$;

comment on function puede_enviar_mensaje is
  'Limite diario hardcodeado en 3 (v_limite_diario). Ajustar con el club
   y mover a configuracion_financiera o tabla propia cuando se confirme
   el numero real a usar - Fase 5 de Comunicacion, pendiente.';

-- helper: encola un mensaje para TODOS los apoderados vigentes de un alumno
create function encolar_mensaje_alumno(
  p_alumno_id uuid, p_tipo tipo_mensaje, p_cuerpo text,
  p_source_type tipo_origen_mensaje, p_source_id uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_mensaje_id uuid;
  v_apoderado record;
begin
  insert into mensajes (tipo, alumno_id, cuerpo_renderizado, source_type, source_id)
  values (p_tipo, p_alumno_id, p_cuerpo, p_source_type, p_source_id)
  returning id into v_mensaje_id;

  for v_apoderado in
    select a.id from apoderados a
    join apoderado_alumno aa on aa.apoderado_id = a.id
    where aa.alumno_id = p_alumno_id
  loop
    if puede_enviar_mensaje(v_apoderado.id, 'whatsapp_api') then
      insert into mensaje_envios (mensaje_id, apoderado_id, canal) values (v_mensaje_id, v_apoderado.id, 'whatsapp_api');
    end if;
  end loop;
end;
$$;

-- 1. Pago vencido
create function trigger_mensaje_pago_vencido() returns trigger
language plpgsql as $$
begin
  if new.estado = 'vencido' and (old.estado is distinct from 'vencido') then
    perform encolar_mensaje_alumno(
      new.alumno_id, 'pago_vencido',
      format('Recordatorio: el pago de %s por $%s esta vencido.', coalesce(new.periodo, new.tipo::text), new.monto_total - new.monto_pagado),
      'pago', new.id
    );
  end if;
  return new;
end;
$$;
create trigger trg_mensaje_pago_vencido
  after update on pagos
  for each row execute function trigger_mensaje_pago_vencido();

-- 2. Convocatoria creada
create function trigger_mensaje_convocatoria() returns trigger
language plpgsql as $$
declare
  v_rival text;
  v_fecha timestamptz;
begin
  select p.rival, p.fecha_hora into v_rival, v_fecha
  from convocatorias co join partidos p on p.id = co.partido_id
  where co.id = new.convocatoria_id;

  perform encolar_mensaje_alumno(
    new.alumno_id, 'convocatoria',
    format('Tu hijo/a fue convocado para el partido vs %s el %s.', v_rival, to_char(v_fecha, 'DD/MM/YYYY HH24:MI')),
    'partido', (select partido_id from convocatorias where id = new.convocatoria_id)
  );
  return new;
end;
$$;
create trigger trg_mensaje_convocatoria
  after insert on convocatoria_jugadores
  for each row execute function trigger_mensaje_convocatoria();

-- 3. Entrenamiento suspendido / cambio de horario
create function trigger_mensaje_entrenamiento_excepcion() returns trigger
language plpgsql as $$
declare
  v_alumno record;
  v_tipo tipo_mensaje;
  v_cuerpo text;
begin
  v_tipo := case when new.tipo = 'suspendido' then 'entrenamiento_cancelado' else 'cambio_entrenamiento' end;
  v_cuerpo := case when new.tipo = 'suspendido'
    then format('Entrenamiento del %s suspendido. Motivo: %s', new.fecha, coalesce(new.motivo, 'sin especificar'))
    else format('Entrenamiento del %s con cambio de horario: %s', new.fecha, coalesce(new.nuevo_horario, 'ver detalle'))
  end;

  for v_alumno in select id from alumnos where categoria_id = new.categoria_id loop
    perform encolar_mensaje_alumno(v_alumno.id, v_tipo, v_cuerpo, 'sesion_entrenamiento', new.id);
  end loop;
  return new;
end;
$$;
create trigger trg_mensaje_entrenamiento_excepcion
  after insert on entrenamiento_excepciones
  for each row execute function trigger_mensaje_entrenamiento_excepcion();
