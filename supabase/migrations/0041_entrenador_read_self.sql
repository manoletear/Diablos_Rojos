-- Hueco real encontrado probando el primer login de entrenador real:
-- entrenadores solo tenia policy staff (director/admin) — el propio
-- entrenador no podia leer ni su propia fila para saber quien es.
-- apoderados ya tenia su equivalente (apoderado_read_self); entrenadores
-- se quedo sin ella por descuido en la migracion original.

create policy entrenador_read_self on entrenadores for select
  using (profile_id = auth.uid());
