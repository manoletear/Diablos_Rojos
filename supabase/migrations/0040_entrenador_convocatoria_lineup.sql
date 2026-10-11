-- Hueco real encontrado: convocatorias, convocatoria_jugadores, lineups y
-- eventos_partido solo tenian policy staff (director/admin) — el entrenador
-- no podia ni leer, mucho menos convocar jugadores o armar el lineup de SU
-- propio partido. Mismo patron de scope por categoria que ya usan
-- partidos / minutajes_partido / partido_estado_vivo.

create policy entrenador_all_convocatorias on convocatorias for all
  using (
    auth_rol() = 'entrenador' and partido_id in (
      select p.id from partidos p
      join entrenador_categorias ec on ec.categoria_id = p.categoria_id
      join entrenadores e on e.id = ec.entrenador_id
      where e.profile_id = auth.uid()
    )
  )
  with check (
    auth_rol() = 'entrenador' and partido_id in (
      select p.id from partidos p
      join entrenador_categorias ec on ec.categoria_id = p.categoria_id
      join entrenadores e on e.id = ec.entrenador_id
      where e.profile_id = auth.uid()
    )
  );

create policy entrenador_all_convocatoria_jugadores on convocatoria_jugadores for all
  using (
    auth_rol() = 'entrenador' and convocatoria_id in (
      select co.id from convocatorias co
      join partidos p on p.id = co.partido_id
      join entrenador_categorias ec on ec.categoria_id = p.categoria_id
      join entrenadores e on e.id = ec.entrenador_id
      where e.profile_id = auth.uid()
    )
  )
  with check (
    auth_rol() = 'entrenador' and convocatoria_id in (
      select co.id from convocatorias co
      join partidos p on p.id = co.partido_id
      join entrenador_categorias ec on ec.categoria_id = p.categoria_id
      join entrenadores e on e.id = ec.entrenador_id
      where e.profile_id = auth.uid()
    )
  );

create policy entrenador_all_lineups on lineups for all
  using (
    auth_rol() = 'entrenador' and partido_id in (
      select p.id from partidos p
      join entrenador_categorias ec on ec.categoria_id = p.categoria_id
      join entrenadores e on e.id = ec.entrenador_id
      where e.profile_id = auth.uid()
    )
  )
  with check (
    auth_rol() = 'entrenador' and partido_id in (
      select p.id from partidos p
      join entrenador_categorias ec on ec.categoria_id = p.categoria_id
      join entrenadores e on e.id = ec.entrenador_id
      where e.profile_id = auth.uid()
    )
  );

create policy entrenador_all_eventos on eventos_partido for all
  using (
    auth_rol() = 'entrenador' and partido_id in (
      select p.id from partidos p
      join entrenador_categorias ec on ec.categoria_id = p.categoria_id
      join entrenadores e on e.id = ec.entrenador_id
      where e.profile_id = auth.uid()
    )
  )
  with check (
    auth_rol() = 'entrenador' and partido_id in (
      select p.id from partidos p
      join entrenador_categorias ec on ec.categoria_id = p.categoria_id
      join entrenadores e on e.id = ec.entrenador_id
      where e.profile_id = auth.uid()
    )
  );
