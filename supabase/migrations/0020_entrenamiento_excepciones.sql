-- Excepciones de calendario: entrenamiento suspendido o con horario
-- distinto al fijo de la categoria. Decision aprobada 2026-10-09.

create type tipo_excepcion_entrenamiento as enum ('suspendido', 'horario_distinto', 'cancha_distinta');

create table entrenamiento_excepciones (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references categorias(id) on delete cascade,
  fecha date not null,
  tipo tipo_excepcion_entrenamiento not null,
  motivo text,
  nuevo_horario text,
  nuevo_recinto_id uuid references recintos(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (categoria_id, fecha)
);
create index idx_entrenamiento_excepciones_fecha on entrenamiento_excepciones(fecha);

alter table entrenamiento_excepciones enable row level security;
create policy staff_all_entrenamiento_excepciones on entrenamiento_excepciones for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy read_entrenamiento_excepciones on entrenamiento_excepciones for select using (auth.uid() is not null);
