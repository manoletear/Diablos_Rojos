-- Fase A del modulo apoderado (docs/vista-apoderado/specs/03-convocatorias.md):
-- motivo de rechazo opcional, ver el plantel completo de una convocatoria
-- (no solo la fila del propio hijo), y bloquear el cambio de respuesta
-- despues de la hora del partido.

alter table convocatoria_jugadores add column motivo_rechazo text;

-- Plantel completo: el apoderado ve TODAS las filas de una convocatoria
-- donde tiene un hijo convocado, no solo la suya. Postgres OR-ea las
-- policies SELECT, asi que esto amplia (no reemplaza) a
-- apoderado_read_convocatoria_jugadores.
--
-- OJO: reusa apoderado_puede_ver_convocatoria() (security definer, row_security
-- off) en vez de un subquery crudo contra convocatoria_jugadores -- un
-- subquery crudo aca mismo causa 42P17 (infinite recursion), mismo bug ya
-- documentado en la migracion 0047.
create policy apoderado_read_plantel_convocatoria on convocatoria_jugadores for select
  using (auth_rol() = 'apoderado' and apoderado_puede_ver_convocatoria(convocatoria_id));

-- Nombre + dorsal de los companeros de equipo (G-01 del spec: nombre de
-- pila + inicial de apellido + dorsal) se resuelve en la migracion 0052
-- via un RPC (obtener_plantel_convocatoria), NO con una policy de SELECT
-- en "alumnos": se probo esa policy aca mismo y, aunque en aislamiento la
-- logica es correcta, agregarla rompia CUALQUIER lectura de "convocatorias"
-- con 42P17 (infinite recursion) -- tener una tercera tabla cuya policy
-- llama a la misma funcion security-definer que ya usan "convocatorias" y
-- "convocatoria_jugadores" dispara el ciclo, aunque la query ni toque
-- "alumnos". Confirmado en vivo con requests reales antes de revertir.

-- Reemplaza la policy de UPDATE: antes permitia cambiar de respuesta sin
-- limite de tiempo (ni bloqueo real). Ahora se bloquea despues de la hora
-- del partido (deadline real del spec: "hasta la hora de citacion" -- hoy
-- no existe un campo de citacion separado del partido, se usa fecha_hora).
drop policy apoderado_confirma_su_convocatoria on convocatoria_jugadores;
create policy apoderado_confirma_su_convocatoria on convocatoria_jugadores for update
  using (
    auth_rol() = 'apoderado'
    and alumno_id in (
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
    and estado = any (array['confirmada', 'rechazada']::estado_convocatoria[])
    and convocatoria_id in (
      select co.id from convocatorias co
      join partidos p on p.id = co.partido_id
      where p.fecha_hora > now()
    )
  );
