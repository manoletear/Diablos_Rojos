-- Registro en vivo del partido: maquina de estados + cronometro +
-- control optimista para sync offline. El marcador NUNCA se duplica
-- aqui: sigue viviendo solo en partidos.resultado_local/rival.
-- Decision aprobada 2026-10-09.

create type estado_partido_vivo as enum (
  'no_iniciado', 'primer_tiempo', 'entretiempo', 'segundo_tiempo', 'finalizado'
);

create table partido_estado_vivo (
  partido_id uuid primary key references partidos(id) on delete cascade,
  estado estado_partido_vivo not null default 'no_iniciado',
  minuto_actual int,
  periodo_actual text,
  iniciado_en timestamptz,
  pausado boolean not null default false,
  pausado_en timestamptz,
  segundos_acumulados int not null default 0,
  version int not null default 1,
  ultimo_checkpoint_en timestamptz,
  actualizado_en timestamptz not null default now()
);

-- control optimista: cada update debe traer la version que leyo
create function bump_version_partido_vivo() returns trigger
language plpgsql as $$
begin
  new.version := old.version + 1;
  new.actualizado_en := now();
  return new;
end;
$$;
create trigger trg_bump_version_partido_vivo
  before update on partido_estado_vivo
  for each row execute function bump_version_partido_vivo();

alter table partido_estado_vivo enable row level security;
create policy staff_all_partido_vivo on partido_estado_vivo for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy entrenador_all_partido_vivo on partido_estado_vivo for all using (
  auth_rol() = 'entrenador' and partido_id in (
    select p.id from partidos p
    join entrenador_categorias ec on ec.categoria_id = p.categoria_id
    join entrenadores e on e.id = ec.entrenador_id
    where e.profile_id = auth.uid()
  )
) with check (
  auth_rol() = 'entrenador' and partido_id in (
    select p.id from partidos p
    join entrenador_categorias ec on ec.categoria_id = p.categoria_id
    join entrenadores e on e.id = ec.entrenador_id
    where e.profile_id = auth.uid()
  )
);
create policy apoderado_read_partido_vivo on partido_estado_vivo for select using (
  auth_rol() = 'apoderado' and partido_id in (
    select p.id from partidos p
    join alumnos al on al.categoria_id = p.categoria_id
    join apoderado_alumno aa on aa.alumno_id = al.id
    join apoderados a on a.id = aa.apoderado_id
    where a.profile_id = auth.uid()
  )
);
