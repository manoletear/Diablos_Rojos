-- Flujo de caja real: boletas/facturas EMITIDAS por Diablos Rojos (cobro a
-- apoderados, concilian con `pagos`) y RECIBIDAS (compras/gastos del club).
-- Carga manual o CSV por ahora (export del Registro de Compras y Ventas del
-- SII) — sin integracion automatica con banco/SII todavia: requiere decidir
-- proveedor (Fintoc para banco; Nubox/Defontana/Bsale/OpenFactura o similar
-- para e-facturacion) antes de automatizar. Documentado en docs/PLAN.md.

create type tipo_documento_tributario as enum ('boleta', 'factura', 'nota_credito');
create type direccion_documento as enum ('emitido', 'recibido');
create type estado_conciliacion as enum ('pendiente', 'conciliado', 'anulado');

create table documentos_tributarios (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_documento_tributario not null,
  direccion direccion_documento not null,
  folio text,
  rut_contraparte text,
  razon_social_contraparte text,
  monto_neto numeric(12,2),
  monto_iva numeric(12,2),
  monto_total numeric(12,2) not null,
  fecha_emision date not null,
  categoria_gasto text,  -- solo para 'recibido': arriendo, servicios, insumos, implementacion, otro
  estado estado_conciliacion not null default 'pendiente',
  pago_id uuid references pagos(id) on delete set null,  -- conciliacion con el cobro real (solo 'emitido')
  origen text not null default 'manual',  -- manual | csv_sii | api
  notas text,
  creado_por uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_documentos_tributarios_direccion on documentos_tributarios(direccion);
create index idx_documentos_tributarios_fecha on documentos_tributarios(fecha_emision);
create index idx_documentos_tributarios_pago on documentos_tributarios(pago_id);

alter table documentos_tributarios enable row level security;
create policy staff_all_documentos_tributarios on documentos_tributarios for all
  using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));

-- Flujo de caja consolidado por periodo: cobros conciliados (boletas/facturas
-- emitidas) menos gastos (documentos recibidos). Misma logica que
-- ingresos_periodo() pero cruzando con documentos tributarios reales, no solo
-- el estado interno de `pagos`.
create function flujo_caja_periodo(p_desde date, p_hasta date)
returns table (
  cobrado_conciliado numeric,
  cobrado_sin_conciliar numeric,
  gastos numeric,
  flujo_neto numeric
)
language sql stable as $$
  select
    coalesce((select sum(monto_total) from documentos_tributarios
      where direccion = 'emitido' and estado = 'conciliado'
        and fecha_emision between p_desde and p_hasta), 0) as cobrado_conciliado,
    coalesce((select sum(monto_pagado) from pagos p
      where p.estado in ('pagado','parcial')
        and not exists (select 1 from documentos_tributarios d where d.pago_id = p.id)
        and p.fecha_registro::date between p_desde and p_hasta), 0) as cobrado_sin_conciliar,
    coalesce((select sum(monto_total) from documentos_tributarios
      where direccion = 'recibido' and estado <> 'anulado'
        and fecha_emision between p_desde and p_hasta), 0) as gastos,
    coalesce((select sum(monto_total) from documentos_tributarios
      where direccion = 'emitido' and estado = 'conciliado'
        and fecha_emision between p_desde and p_hasta), 0)
    - coalesce((select sum(monto_total) from documentos_tributarios
      where direccion = 'recibido' and estado <> 'anulado'
        and fecha_emision between p_desde and p_hasta), 0) as flujo_neto;
$$;
