-- Finanzas extendida: packs de pago, descuento por hermanos, uniformes,
-- catalogo. Diseno propio (tipos tipados desde el inicio, a diferencia
-- del sistema de referencia que guardaba el tipo de cobro como texto
-- libre en "concept" — no replicamos ese problema).

-- ---------- Pagos: campos que faltaban ----------
alter type tipo_pago add value if not exists 'pack';
alter type tipo_pago add value if not exists 'uniforme';
alter type tipo_pago add value if not exists 'catalogo';
alter type tipo_pago add value if not exists 'torneo';
alter type tipo_pago add value if not exists 'rifa';
alter type tipo_pago add value if not exists 'viaje';
alter type tipo_pago add value if not exists 'otro';

alter table pagos
  add column if not exists pack_tipo text,                 -- trimestral | semestral | anual
  add column if not exists descuento_monto numeric(12,2) not null default 0,
  add column if not exists cubierto_por_pago_id uuid references pagos(id) on delete set null,
  add column if not exists metodo_pago text,                -- transferencia | efectivo | mercadopago | pos | credito_cuenta
  add column if not exists comprobante_url text,
  add column if not exists notas text;

-- ---------- Configuracion financiera (fila unica) ----------
create table configuracion_financiera (
  id boolean primary key default true check (id),  -- fuerza fila unica
  mensualidad_default numeric(12,2),
  matricula_default numeric(12,2),
  matricula_reducida numeric(12,2),
  dia_vencimiento int default 5,
  descuento_hermano_2_pct numeric(5,2) default 0,
  descuento_hermano_3_pct numeric(5,2) default 0,
  packs jsonb not null default '[]',
  -- packs: [{"nombre":"Trimestral","meses":3,"descuento_pct":10}, ...]
  uniforme_incluido_en_matricula boolean not null default true,
  uniforme_precio numeric(12,2),
  uniforme_precio_cambio_numero numeric(12,2),
  uniforme_precio_reposicion numeric(12,2)
);
insert into configuracion_financiera (id) values (true) on conflict do nothing;

-- ---------- Pedidos de uniforme ----------
create type estado_pedido_uniforme as enum (
  'pendiente_pago', 'pagado', 'enviado_proveedor', 'en_produccion', 'entregado', 'cancelado'
);
create type motivo_pedido_uniforme as enum ('inicial', 'reposicion', 'cambio_numero');

create table uniforme_pedidos (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references alumnos(id) on delete cascade,
  categoria_id uuid references categorias(id) on delete set null,
  numero_camiseta int,
  talla_camiseta text,
  talla_short text,
  estado estado_pedido_uniforme not null default 'pendiente_pago',
  pago_requerido boolean not null default true,
  pago_id uuid references pagos(id) on delete set null,
  monto numeric(12,2),
  motivo motivo_pedido_uniforme not null default 'inicial',
  pedido_anterior_id uuid references uniforme_pedidos(id) on delete set null,
  fecha_pedido date default current_date,
  fecha_entrega date,
  notas text,
  created_at timestamptz not null default now()
);

-- ---------- Catalogo de productos ----------
create table catalogo_productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo text,
  descripcion text,
  imagen_url text,
  generico boolean not null default true,
  created_at timestamptz not null default now()
);

create table catalogo_variantes (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references catalogo_productos(id) on delete cascade,
  nombre text not null,
  codigo text
);

create table catalogo_items_inventario (
  id uuid primary key default gen_random_uuid(),
  variante_id uuid not null references catalogo_variantes(id) on delete cascade,
  talla text not null,
  precio numeric(12,2) not null,
  stock int not null default 0,
  unique (variante_id, talla)
);

create type estado_cumplimiento_pedido as enum (
  'pendiente_pago', 'pago_confirmado', 'pedido', 'listo_retiro', 'entregado', 'cancelado'
);

create table catalogo_pedidos (
  id uuid primary key default gen_random_uuid(),
  solicitado_por uuid references profiles(id) on delete set null,
  estado estado_cumplimiento_pedido not null default 'pendiente_pago',
  monto_total numeric(12,2) not null default 0,
  notas text,
  created_at timestamptz not null default now()
);

-- items como tabla real (no JSON) — mejora deliberada sobre el diseno
-- de referencia, que guardaba las lineas en JSONB sin poder consultarlas.
create table catalogo_pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references catalogo_pedidos(id) on delete cascade,
  alumno_id uuid references alumnos(id) on delete set null,
  item_inventario_id uuid not null references catalogo_items_inventario(id) on delete restrict,
  cantidad int not null default 1,
  precio_unitario numeric(12,2) not null,
  pago_id uuid references pagos(id) on delete set null
);

create index idx_pagos_cubierto_por on pagos(cubierto_por_pago_id);
create index idx_uniforme_pedidos_alumno on uniforme_pedidos(alumno_id);
create index idx_uniforme_pedidos_pago on uniforme_pedidos(pago_id);
create index idx_catalogo_pedido_items_pedido on catalogo_pedido_items(pedido_id);
create index idx_catalogo_pedido_items_alumno on catalogo_pedido_items(alumno_id);

alter table configuracion_financiera enable row level security;
alter table uniforme_pedidos enable row level security;
alter table catalogo_productos enable row level security;
alter table catalogo_variantes enable row level security;
alter table catalogo_items_inventario enable row level security;
alter table catalogo_pedidos enable row level security;
alter table catalogo_pedido_items enable row level security;

create policy staff_all_config_financiera on configuracion_financiera for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy read_config_financiera on configuracion_financiera for select using (auth.uid() is not null);

create policy staff_all_uniforme_pedidos on uniforme_pedidos for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_catalogo_productos on catalogo_productos for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy read_catalogo_productos on catalogo_productos for select using (auth.uid() is not null);
create policy staff_all_catalogo_variantes on catalogo_variantes for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy read_catalogo_variantes on catalogo_variantes for select using (auth.uid() is not null);
create policy staff_all_catalogo_items on catalogo_items_inventario for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy read_catalogo_items on catalogo_items_inventario for select using (auth.uid() is not null);
create policy staff_all_catalogo_pedidos on catalogo_pedidos for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy staff_all_catalogo_pedido_items on catalogo_pedido_items for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));

-- apoderado: lectura de lo propio
create policy apoderado_read_uniforme_pedidos on uniforme_pedidos for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa
    join apoderados a on a.id = aa.apoderado_id
    where a.profile_id = auth.uid()
  )
);
create policy apoderado_read_catalogo_pedido_items on catalogo_pedido_items for select using (
  auth_rol() = 'apoderado' and alumno_id in (
    select alumno_id from apoderado_alumno aa
    join apoderados a on a.id = aa.apoderado_id
    where a.profile_id = auth.uid()
  )
);
