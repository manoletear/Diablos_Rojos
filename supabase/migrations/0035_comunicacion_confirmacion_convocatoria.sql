-- Funcion que cierra el circulo roto en Telar: la respuesta real del
-- apoderado a una convocatoria actualiza convocatoria_jugadores.
-- Se expone via una ruta publica /confirmar/:token (sin login) -
-- construccion de esa pagina queda pendiente hasta tener el canal de
-- envio real (Fase 5 de Comunicacion, decidido dejar para despues).
-- La funcion SQL si se deja lista ahora. Decision aprobada 2026-10-09.

create function confirmar_convocatoria_por_token(p_token uuid, p_confirma boolean)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_envio record;
  v_alumno_id uuid;
  v_convocatoria_id uuid;
begin
  select me.*, m.source_id as partido_id into v_envio
  from mensaje_envios me
  join mensajes m on m.id = me.mensaje_id
  where me.token_respuesta = p_token and m.tipo = 'convocatoria';

  if not found then
    return false;
  end if;

  v_alumno_id := (select alumno_id from mensajes where id = v_envio.mensaje_id);

  select co.id into v_convocatoria_id
  from convocatorias co where co.partido_id = v_envio.partido_id;

  update convocatoria_jugadores
  set estado = case when p_confirma then 'confirmada' else 'rechazada' end,
      confirmado_en = now()
  where convocatoria_id = v_convocatoria_id and alumno_id = v_alumno_id;

  update mensaje_envios set leido_en = coalesce(leido_en, now()) where id = v_envio.id;

  return true;
end;
$$;

comment on function confirmar_convocatoria_por_token is
  'Expuesta sin autenticacion (SECURITY DEFINER) porque el apoderado
   confirma por link, sin login. El token UUID aleatorio es el unico
   control de acceso - no reutilizar tokens, no hacerlos predecibles.';
