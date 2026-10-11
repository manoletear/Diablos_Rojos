-- Requerimiento real del director: "dentro del perfil del niño puede crear
-- la evaluacion y modificar datos personales o de la ficha de este mismo"
-- — evaluacion = mediciones antropometricas (peso/talla). Antes el
-- entrenador era SOLO lectura en alumnos y mediciones_antropometricas;
-- ahora puede escribir, scoped a los alumnos de sus propias categorias
-- (via entrenador_categorias, mismo patron que el resto del proyecto).

-- Entrenador puede EDITAR (no crear ni eliminar) la ficha de sus alumnos.
-- "for all" se probo primero y se reemplazo por select+update exclusivos
-- porque el director pidio "modificar", no dar de alta ni borrar alumnos
-- (eso sigue siendo solo director/admin).
drop policy entrenador_read_alumnos on alumnos;

create policy entrenador_read_alumnos on alumnos for select
  using (
    auth_rol() = 'entrenador' and categoria_id in (
      select ec.categoria_id from entrenador_categorias ec
      join entrenadores e on e.id = ec.entrenador_id
      where e.profile_id = auth.uid()
    )
  );

create policy entrenador_update_alumnos on alumnos for update
  using (
    auth_rol() = 'entrenador' and categoria_id in (
      select ec.categoria_id from entrenador_categorias ec
      join entrenadores e on e.id = ec.entrenador_id
      where e.profile_id = auth.uid()
    )
  )
  with check (
    auth_rol() = 'entrenador' and categoria_id in (
      select ec.categoria_id from entrenador_categorias ec
      join entrenadores e on e.id = ec.entrenador_id
      where e.profile_id = auth.uid()
    )
  );

drop policy entrenador_read_mediciones on mediciones_antropometricas;
create policy entrenador_all_mediciones on mediciones_antropometricas for all
  using (
    auth_rol() = 'entrenador' and alumno_id in (
      select al.id from alumnos al
      join entrenador_categorias ec on ec.categoria_id = al.categoria_id
      join entrenadores e on e.id = ec.entrenador_id
      where e.profile_id = auth.uid()
    )
  )
  with check (
    auth_rol() = 'entrenador' and alumno_id in (
      select al.id from alumnos al
      join entrenador_categorias ec on ec.categoria_id = al.categoria_id
      join entrenadores e on e.id = ec.entrenador_id
      where e.profile_id = auth.uid()
    )
  );
