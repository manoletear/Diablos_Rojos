-- Fase 1 vista-apoderado (Mis Hijos): `sedes` y `temporadas` no tenian
-- NINGUNA policy fuera de staff — ni entrenador ni apoderado podian leerlas.
-- Se noto al probar el perfil de alumno real: "Sede" salia vacio en vez de
-- "Sede Principal". No son datos sensibles (nombres de sede/temporada de
-- la organizacion), se abren a cualquier usuario autenticado.

create policy authenticated_read_sedes on sedes for select
  using (auth.uid() is not null);

create policy authenticated_read_temporadas on temporadas for select
  using (auth.uid() is not null);
