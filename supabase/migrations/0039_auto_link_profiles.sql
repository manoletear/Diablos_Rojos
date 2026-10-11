-- Vincula tablas: cuando alguien crea cuenta (auth.users), se crea su fila
-- en `profiles` y, si su email coincide con un `entrenadores.email` o
-- `apoderados.email` ya existente, se reclama esa fila (profile_id) y el rol
-- se asigna solo. No crea filas nuevas en entrenadores/apoderados — solo
-- reclama las que ya estaban (importadas del CSV, sin profile_id).
-- Prioridad si coincide en ambas: entrenador gana (caso raro, decidir caso a caso).

create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_entrenador_id uuid;
  v_apoderado_id uuid;
  v_rol user_role := 'apoderado';
begin
  select id into v_entrenador_id from entrenadores where lower(email) = lower(new.email) and profile_id is null limit 1;
  select id into v_apoderado_id from apoderados where lower(email) = lower(new.email) and profile_id is null limit 1;

  if v_entrenador_id is not null then
    v_rol := 'entrenador';
  elsif v_apoderado_id is not null then
    v_rol := 'apoderado';
  end if;

  insert into profiles (id, email, nombre, rol)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)), v_rol);

  if v_entrenador_id is not null then
    update entrenadores set profile_id = new.id where id = v_entrenador_id;
  elsif v_apoderado_id is not null then
    update apoderados set profile_id = new.id where id = v_apoderado_id;
  end if;

  return new;
end;
$$;

create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function handle_new_user();

comment on function handle_new_user is
  'Auto-vincula cuenta nueva a entrenadores/apoderados existentes por email
   (reclama profile_id null). No crea alumnos/entrenadores/apoderados nuevos
   — solo reclama filas importadas sin cuenta. Rol default apoderado si no
   matchea nada (cuenta sin acceso a datos via RLS hasta que se le asigne rol
   manualmente desde el panel de director).';
