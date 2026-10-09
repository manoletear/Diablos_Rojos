-- Abonos (payment_transactions) + estado/monto_pagado derivados por trigger.
-- Decision aprobada 2026-10-09 (P0).

create type estado_aprobacion_abono as enum ('pendiente', 'aprobado', 'rechazado');

create table pagos_transacciones (
  id uuid primary key default gen_random_uuid(),
  pago_id uuid not null references pagos(id) on delete cascade,
  monto numeric(12,2) not null check (monto > 0),
  metodo_pago text,
  comprobante_url text,
  estado_aprobacion estado_aprobacion_abono not null default 'pendiente',
  registrado_por uuid references profiles(id) on delete set null,
  aprobado_por uuid references profiles(id) on delete set null,
  notas text,
  created_at timestamptz not null default now()
);
create index idx_pagos_transacciones_pago on pagos_transacciones(pago_id);

-- Recalcula pagos.monto_pagado y pagos.estado cada vez que cambian los abonos.
-- No toca 'vencido' (eso lo decide un job por fecha_vencimiento, fuera de este trigger).
create function recalcular_pago() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_pago_id uuid;
  v_monto_total numeric;
  v_pagado numeric;
  v_hay_pendiente boolean;
  v_estado_actual text;
begin
  v_pago_id := coalesce(new.pago_id, old.pago_id);

  select monto_total, estado into v_monto_total, v_estado_actual from pagos where id = v_pago_id;

  select coalesce(sum(monto), 0) into v_pagado
  from pagos_transacciones where pago_id = v_pago_id and estado_aprobacion = 'aprobado';

  select exists(
    select 1 from pagos_transacciones where pago_id = v_pago_id and estado_aprobacion = 'pendiente'
  ) into v_hay_pendiente;

  update pagos set
    monto_pagado = v_pagado,
    estado = case
      when v_pagado >= v_monto_total and v_monto_total > 0 then 'pagado'
      when v_pagado > 0 then 'parcial'
      when v_hay_pendiente then 'por_comprobar'
      when v_estado_actual in ('pagado','parcial','por_comprobar') then 'pendiente'
      else v_estado_actual
    end::estado_pago
  where id = v_pago_id;

  return coalesce(new, old);
end;
$$;

create trigger trg_recalcular_pago
  after insert or update or delete on pagos_transacciones
  for each row execute function recalcular_pago();

alter table pagos_transacciones enable row level security;
create policy staff_all_pagos_transacciones on pagos_transacciones for all using (auth_rol() in ('director','admin')) with check (auth_rol() in ('director','admin'));
create policy apoderado_read_pagos_transacciones on pagos_transacciones for select using (
  auth_rol() = 'apoderado' and pago_id in (
    select p.id from pagos p
    join apoderado_alumno aa on aa.alumno_id = p.alumno_id
    join apoderados a on a.id = aa.apoderado_id
    where a.profile_id = auth.uid()
  )
);
