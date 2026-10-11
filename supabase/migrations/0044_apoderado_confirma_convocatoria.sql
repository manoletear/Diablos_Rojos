-- Requerimiento real del director (WhatsApp 11-10-2026): "Apoderado no
-- ingresa datos, solo la confirmacion a partidos". Hoy el apoderado no
-- tenia NI SIQUIERA lectura de convocatorias/convocatoria_jugadores —
-- hueco encontrado en el cross-check. Se agrega lectura + la unica
-- escritura real que el apoderado debe tener: confirmar o rechazar su
-- propia convocatoria (no puede tocar la de otros, ni crear convocatorias).

create policy apoderado_read_convocatorias on convocatorias for select
  using (
    auth_rol() = 'apoderado' and partido_id in (
      select p.id from partidos p
      join alumnos al on al.categoria_id = p.categoria_id
      join apoderado_alumno aa on aa.alumno_id = al.id
      join apoderados a on a.id = aa.apoderado_id
      where a.profile_id = auth.uid()
    )
  );

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
