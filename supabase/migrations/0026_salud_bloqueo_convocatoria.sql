-- can_play_matches=false bloquea la convocatoria de verdad (no solo UI).
-- Decision aprobada 2026-10-09.

create function check_restriccion_convocatoria() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_bloqueado boolean;
begin
  -- override_staff=true (con motivo registrado) permite convocar igual
  select exists(
    select 1 from restricciones_salud
    where alumno_id = new.alumno_id
      and can_play_matches = false
      and not override_staff
      and vigente_desde <= current_date
      and (vigente_hasta is null or vigente_hasta >= current_date)
  ) into v_bloqueado;

  if v_bloqueado then
    raise exception 'El alumno tiene una restriccion de salud activa que bloquea la convocatoria a partidos (can_play_matches=false). Usa override_staff en restricciones_salud si corresponde autorizar igual.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger trg_check_restriccion_convocatoria
  before insert on convocatoria_jugadores
  for each row execute function check_restriccion_convocatoria();
