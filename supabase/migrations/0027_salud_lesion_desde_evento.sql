-- Lesion<->partido conectada de verdad: un evento tipo 'lesion' crea el
-- borrador de ficha operativa, ya enlazado al partido. En Telar esto
-- esta disenado pero nunca conectado (0/11). Decision aprobada 2026-10-09.

create function crear_borrador_lesion_desde_evento() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.tipo = 'lesion' and new.alumno_id is not null then
    insert into lesiones_operativo (alumno_id, partido_id, fecha_lesion, contexto, estado)
    values (new.alumno_id, new.partido_id, (select fecha_hora::date from partidos where id = new.partido_id), 'partido', 'activa');
  end if;
  return new;
end;
$$;

create trigger trg_lesion_desde_evento
  after insert on eventos_partido
  for each row execute function crear_borrador_lesion_desde_evento();
