-- Suscripciones Web Push por usuario (apoderado, entrenador, etc).
-- Un mismo profile puede tener varias (distintos navegadores/dispositivos).

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index idx_push_subscriptions_profile on push_subscriptions(profile_id);

alter table push_subscriptions enable row level security;

create policy own_push_subscriptions on push_subscriptions for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy staff_read_push_subscriptions on push_subscriptions for select
  using (auth_rol() in ('director','admin'));
