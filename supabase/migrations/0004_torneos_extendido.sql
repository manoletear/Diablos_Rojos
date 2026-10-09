-- Extiende torneos con los campos reales de gestion (tipo, fechas, estado,
-- sede, precio, reglas) + relacion N:N con categorias participantes.

create type tipo_torneo as enum ('un_dia', 'corto_plazo', 'anual');
create type estado_torneo as enum ('activo', 'finalizado', 'cancelado');

alter table torneos
  add column if not exists tipo tipo_torneo not null default 'un_dia',
  add column if not exists fecha_inicio date,
  add column if not exists fecha_fin date,
  add column if not exists estado estado_torneo not null default 'activo',
  add column if not exists sede_id uuid references sedes(id) on delete set null,
  add column if not exists precio numeric(12,2),
  add column if not exists obligatorio boolean not null default false,
  add column if not exists requiere_aprobacion boolean not null default false;

create table torneo_categorias (
  torneo_id uuid not null references torneos(id) on delete cascade,
  categoria_id uuid not null references categorias(id) on delete cascade,
  primary key (torneo_id, categoria_id)
);

create index idx_torneo_categorias_categoria on torneo_categorias(categoria_id);

alter table torneo_categorias enable row level security;
create policy staff_all_torneo_categorias on torneo_categorias for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy read_torneo_categorias on torneo_categorias for select using (auth.uid() is not null);
