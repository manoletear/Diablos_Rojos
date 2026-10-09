-- relationship_type tipado + unicidad de titular por alumno.
-- Decision aprobada 2026-10-09.

-- backfill: asegurar exactamente 1 es_principal por alumno antes del constraint
with ranked as (
  select apoderado_id, alumno_id,
    row_number() over (partition by alumno_id order by es_principal desc, apoderado_id) as rn
  from apoderado_alumno
)
update apoderado_alumno aa
set es_principal = (r.rn = 1)
from ranked r
where aa.apoderado_id = r.apoderado_id and aa.alumno_id = r.alumno_id;

create type tipo_relacion as enum ('madre', 'padre', 'tutor', 'otro');

alter table apoderado_alumno add column if not exists relacion tipo_relacion;

update apoderado_alumno set relacion = case
  when parentesco = 'madre' then 'madre'
  when parentesco = 'padre' then 'padre'
  else 'tutor'
end::tipo_relacion;

alter table apoderado_alumno alter column relacion set not null;
alter table apoderado_alumno alter column relacion set default 'tutor';

-- un solo titular por alumno (ya garantizado por el backfill de arriba)
create unique index if not exists idx_apoderado_alumno_un_titular
  on apoderado_alumno(alumno_id) where es_principal;

comment on column apoderado_alumno.parentesco is
  'Legacy: texto libre importado de Telar. Usar "relacion" (enum) para logica nueva.';
