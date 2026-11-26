-- Ver el plantel de una convocatoria con nombre + dorsal de los
-- companeros de equipo (vista-apoderado 03-convocatorias, G-01). No usa
-- una policy de RLS en "alumnos" -- ver la nota en la migracion 0051,
-- causaba 42P17 incluso en lecturas que no tocaban "alumnos" para nada.
-- Este RPC hace su propio chequeo de autorizacion y bypassa RLS adentro
-- (security definer + row_security off), sin agregar una tercera tabla al
-- grafo de policies que comparten apoderado_puede_ver_convocatoria().
create or replace function obtener_plantel_convocatoria(p_convocatoria_id uuid)
returns table (alumno_id uuid, estado estado_convocatoria, nombre text, apellido text, numero_camiseta int)
language plpgsql security definer stable
set search_path = public
set row_security = off
as $$
begin
  if not (apoderado_puede_ver_convocatoria(p_convocatoria_id) or auth_rol() = any (array['director', 'admin']::user_role[])) then
    raise exception 'No autorizado';
  end if;

  return query
    select cj.alumno_id, cj.estado, al.nombre, al.apellido, al.numero_camiseta
    from convocatoria_jugadores cj
    join alumnos al on al.id = cj.alumno_id
    where cj.convocatoria_id = p_convocatoria_id;
end;
$$;

revoke execute on function obtener_plantel_convocatoria(uuid) from public;
grant execute on function obtener_plantel_convocatoria(uuid) to authenticated;
