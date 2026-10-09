-- Minutaje calculado en vivo (no mas foto importada). Requiere
-- temporada_id en partidos, que faltaba para ser consistente con el
-- resto del esquema. Decision aprobada 2026-10-09.

alter table partidos add column if not exists temporada_id uuid references temporadas(id) on delete set null;
update partidos set temporada_id = (select id from temporadas where activa limit 1) where temporada_id is null;
create index if not exists idx_partidos_temporada on partidos(temporada_id);

create function minutaje_vivo(p_categoria_id uuid, p_temporada_id uuid)
returns table (
  alumno_id uuid,
  nombre text,
  apellido text,
  jornadas_entrenamiento int,
  entrenamientos_presente int,
  entrenamientos_registrados int,
  asistencia_pct numeric,
  partidos_categoria int,
  convocado_partidos int,
  convocatorias_rechazadas int,
  convocatoria_pct numeric,
  partidos_con_minutos int,
  minutos_totales int,
  minutos_cat_propia int,
  minutos_otras_cat int
)
language sql stable as $$
  with jornadas as (
    select count(distinct fecha) as n
    from sesiones_entrenamiento
    where categoria_id = p_categoria_id and temporada_id = p_temporada_id
  ),
  asistencia as (
    select ra.alumno_id,
      count(*) filter (where ra.estado = 'presente') as presentes,
      count(*) as registrados
    from registros_asistencia ra
    join sesiones_entrenamiento se on se.id = ra.sesion_id
    where se.categoria_id = p_categoria_id and se.temporada_id = p_temporada_id
    group by ra.alumno_id
  ),
  partidos_cat as (
    select count(*) as n from partidos
    where categoria_id = p_categoria_id and temporada_id = p_temporada_id
  ),
  convocatoria as (
    select cj.alumno_id,
      count(*) as convocado,
      count(*) filter (where cj.estado = 'rechazada') as rechazadas
    from convocatoria_jugadores cj
    join convocatorias co on co.id = cj.convocatoria_id
    join partidos p on p.id = co.partido_id
    where p.categoria_id = p_categoria_id and p.temporada_id = p_temporada_id
    group by cj.alumno_id
  ),
  minutos as (
    select mp.alumno_id,
      count(*) filter (where mp.minutos_jugados > 0) as partidos_con_minutos,
      sum(mp.minutos_jugados) filter (where p.categoria_id = p_categoria_id) as min_propia,
      sum(mp.minutos_jugados) filter (where p.categoria_id <> p_categoria_id) as min_otras
    from minutajes_partido mp
    join partidos p on p.id = mp.partido_id
    where mp.alumno_id in (select alumno_id from alumno_categorias where categoria_id = p_categoria_id)
      and p.temporada_id = p_temporada_id
    group by mp.alumno_id
  )
  select
    al.id, al.nombre, al.apellido,
    (select n from jornadas),
    coalesce(a.presentes, 0),
    coalesce(a.registrados, 0),
    case when coalesce(a.registrados,0) > 0 then round(100.0 * a.presentes / a.registrados, 1) else null end,
    (select n from partidos_cat),
    coalesce(c.convocado, 0),
    coalesce(c.rechazadas, 0),
    case when (select n from partidos_cat) > 0 then round(100.0 * coalesce(c.convocado,0) / (select n from partidos_cat), 1) else null end,
    coalesce(m.partidos_con_minutos, 0),
    coalesce(m.min_propia, 0) + coalesce(m.min_otras, 0),
    coalesce(m.min_propia, 0),
    coalesce(m.min_otras, 0)
  from alumnos al
  join alumno_categorias ac on ac.alumno_id = al.id and ac.categoria_id = p_categoria_id
  left join asistencia a on a.alumno_id = al.id
  left join convocatoria c on c.alumno_id = al.id
  left join minutos m on m.alumno_id = al.id
  order by (coalesce(m.min_propia, 0) + coalesce(m.min_otras, 0)) desc;
$$;
