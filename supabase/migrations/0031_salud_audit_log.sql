-- Audit log de escritura en tablas clinicas (trigger, automatico).
-- La auditoria de LECTURA no es posible via trigger de Postgres: se
-- registra desde las Server Actions cuando se construyan las pantallas
-- de Salud (nunca acceso directo cliente->Supabase para estas tablas).
-- Decision aprobada 2026-10-09.

create table salud_audit_log (
  id uuid primary key default gen_random_uuid(),
  tabla text not null,
  registro_id uuid not null,
  accion text not null check (accion in ('select','insert','update','delete')),
  usuario uuid references profiles(id) on delete set null,
  detalle jsonb,
  created_at timestamptz not null default now()
);
create index idx_salud_audit_tabla_registro on salud_audit_log(tabla, registro_id);
create index idx_salud_audit_usuario on salud_audit_log(usuario);

create function log_salud_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into salud_audit_log (tabla, registro_id, accion, usuario)
  values (TG_TABLE_NAME, coalesce(new.id, old.id), lower(TG_OP), auth.uid());
  return coalesce(new, old);
end;
$$;

create trigger trg_audit_lesiones_clinico
  after insert or update or delete on lesiones_clinico
  for each row execute function log_salud_audit();

create trigger trg_audit_lesiones_sesiones
  after insert or update or delete on lesiones_sesiones_tratamiento
  for each row execute function log_salud_audit();

create trigger trg_audit_psicologia_casos
  after insert or update or delete on psicologia_casos
  for each row execute function log_salud_audit();

create trigger trg_audit_psicologia_sesiones
  after insert or update or delete on psicologia_sesiones
  for each row execute function log_salud_audit();

-- Solo director lee el log de auditoria. Nadie mas, ni siquiera admin
-- (el log existe precisamente para supervisar a quien tiene acceso clinico).
alter table salud_audit_log enable row level security;
create policy director_read_salud_audit on salud_audit_log for select using (auth_rol() = 'director');
-- insert lo hace solo el trigger (security definer), no hay policy de insert para usuarios.
