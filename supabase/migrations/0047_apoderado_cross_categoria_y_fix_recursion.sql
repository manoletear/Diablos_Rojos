-- Probado end-to-end con cuenta real de apoderado (gczolezzi@gmail.com,
-- hijo en Sub13 citado a un partido de Sub11). Aparecieron 3 bugs reales
-- que no se veian sin datos/cuentas reales:
--
-- 1. Apoderado no tenia NINGUNA policy en `categorias` -> "Sin categoría"
--    en vez del nombre real.
-- 2. Entrenador no podia leer alumnos/categorias fuera de su propia
--    categoria -> el buscador "citar jugador de otra categoria" nunca
--    encontraba resultados con una cuenta de entrenador real (la prueba
--    anterior "funciono" porque sin querer estaba logueado como director).
-- 3. RECURSION INFINITA DE RLS: la policy de apoderado en `convocatorias`
--    subconsultaba `convocatoria_jugadores`, que tiene una policy de
--    entrenador que subconsulta `convocatorias` de vuelta. Postgres lo
--    detecta como ciclo (42P17) y la query entera falla con 500 — no
--    solo para apoderado, para CUALQUIER select a convocatorias. Se
--    rompe con funciones `plpgsql security definer ... set row_security
--    = off` (si se usa `language sql` el planner las "inlinea" y el
--    ciclo vuelve a aparecer en el texto expandido).

-- 1. Entrenador: lectura amplia para poder citar jugadores de cualquier
--    categoria (pedido explicito del director). Editar ficha sigue
--    scoped a su propia categoria (entrenador_update_alumnos, 0045).
create policy entrenador_read_alumnos_para_citar on alumnos for select
  using (auth_rol() = 'entrenador' and estado = 'matriculado');

create policy entrenador_read_categorias_todas on categorias for select
  using (auth_rol() = 'entrenador');

-- 2. Apoderado: lectura de categorias de sus propios hijos.
create policy apoderado_read_categorias on categorias for select
  using (
    auth_rol() = 'apoderado' and (
      id in (
        select al.categoria_id from alumnos al
        join apoderado_alumno aa on aa.alumno_id = al.id
        join apoderados a on a.id = aa.apoderado_id
        where a.profile_id = auth.uid()
      )
      or id in (
        select p.categoria_id from partidos p where apoderado_convocado_en_partido(p.id)
      )
    )
  );

-- 3. Funciones que rompen el ciclo de recursion (ver nota arriba).
create function apoderado_convocado_en_partido(p_partido_id uuid) returns boolean
language plpgsql security definer stable
set search_path = public
set row_security = off
as $$
declare
  v_existe boolean;
begin
  select exists (
    select 1 from convocatorias co
    join convocatoria_jugadores cj on cj.convocatoria_id = co.id
    join apoderado_alumno aa on aa.alumno_id = cj.alumno_id
    join apoderados a on a.id = aa.apoderado_id
    where co.partido_id = p_partido_id and a.profile_id = auth.uid()
  ) into v_existe;
  return v_existe;
end;
$$;
revoke execute on function apoderado_convocado_en_partido(uuid) from public;
grant execute on function apoderado_convocado_en_partido(uuid) to authenticated;

create function apoderado_puede_ver_convocatoria(p_convocatoria_id uuid) returns boolean
language plpgsql security definer stable
set search_path = public
set row_security = off
as $$
declare
  v_existe boolean;
begin
  select exists (
    select 1 from convocatoria_jugadores cj
    join apoderado_alumno aa on aa.alumno_id = cj.alumno_id
    join apoderados a on a.id = aa.apoderado_id
    where cj.convocatoria_id = p_convocatoria_id and a.profile_id = auth.uid()
  ) into v_existe;
  return v_existe;
end;
$$;
revoke execute on function apoderado_puede_ver_convocatoria(uuid) from public;
grant execute on function apoderado_puede_ver_convocatoria(uuid) to authenticated;

-- 4. Policies de apoderado reescritas para citaciones cross-categoria,
--    usando las funciones de arriba en vez de subqueries directas (evita
--    la recursion).
create policy apoderado_read_convocatorias on convocatorias for select
  using (auth_rol() = 'apoderado' and apoderado_puede_ver_convocatoria(id));

create policy apoderado_read_convocatoria_jugadores on convocatoria_jugadores for select
  using (
    auth_rol() = 'apoderado' and alumno_id in (
      select aa.alumno_id from apoderado_alumno aa
      join apoderados a on a.id = aa.apoderado_id
      where a.profile_id = auth.uid()
    )
  );

create policy apoderado_confirma_su_convocatoria on convocatoria_jugadores for update
  using (
    auth_rol() = 'apoderado' and alumno_id in (
      select aa.alumno_id from apoderado_alumno aa
      join apoderados a on a.id = aa.apoderado_id
      where a.profile_id = auth.uid()
    )
  )
  with check (
    auth_rol() = 'apoderado'
    and alumno_id in (
      select aa.alumno_id from apoderado_alumno aa
      join apoderados a on a.id = aa.apoderado_id
      where a.profile_id = auth.uid()
    )
    and estado in ('confirmada', 'rechazada')
  );

drop policy apoderado_read_partidos on partidos;
create policy apoderado_read_partidos on partidos for select
  using (
    auth_rol() = 'apoderado' and (
      categoria_id in (
        select al.categoria_id from alumnos al
        join apoderado_alumno aa on aa.alumno_id = al.id
        join apoderados a on a.id = aa.apoderado_id
        where a.profile_id = auth.uid()
      )
      or apoderado_convocado_en_partido(id)
    )
  );

drop policy apoderado_read_partido_vivo on partido_estado_vivo;
create policy apoderado_read_partido_vivo on partido_estado_vivo for select
  using (
    auth_rol() = 'apoderado' and (
      partido_id in (
        select p.id from partidos p
        join alumnos al on al.categoria_id = p.categoria_id
        join apoderado_alumno aa on aa.alumno_id = al.id
        join apoderados a on a.id = aa.apoderado_id
        where a.profile_id = auth.uid()
      )
      or apoderado_convocado_en_partido(partido_id)
    )
  );
