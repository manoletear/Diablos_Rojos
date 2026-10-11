-- Mismo patron de hueco que entrenadores (migracion 0041), encontrado al
-- probar el primer login real: las tablas puente entrenador_categorias y
-- apoderado_alumno solo tenian policy staff — ni el propio entrenador ni el
-- propio apoderado podian leer sus vinculos, aunque las demas tablas que
-- dependen de ellas (alumnos, partidos, etc.) si confiaban en poder hacer
-- ese join. Rompia el home de ambos roles.

create policy entrenador_read_propias_categorias on entrenador_categorias for select
  using (
    entrenador_id in (select id from entrenadores where profile_id = auth.uid())
  );

create policy apoderado_read_propios_vinculos on apoderado_alumno for select
  using (
    apoderado_id in (select id from apoderados where profile_id = auth.uid())
  );
