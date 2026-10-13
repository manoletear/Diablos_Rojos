-- =====================================================================
-- Schema de referencia · Módulo Apoderado
-- Postgres 14+. REFERENCIA, no migración: mapear contra el modelo
-- existente del repo antes de aplicar. Si el repo usa un ORM
-- (Prisma/Drizzle/TypeORM/Eloquent), traducir a ese formato.
-- La sección RLS al final es opcional (Supabase/Postgres con auth.uid()).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Enums ----------
create type call_status          as enum ('pendiente','confirmada','rechazada','expirada');
create type participation_status as enum ('pendiente','aprobado','rechazado','expirado');
create type due_type             as enum ('mensualidad','matricula','rifa','torneo','catalogo','otro');
create type payment_method       as enum ('transferencia','tarjeta_online','efectivo','pos');
create type payment_status       as enum ('iniciado','por_comprobar','aprobado','rechazado','fallido');
create type attendance_status    as enum ('presente','tarde','ausente','justificado');
create type match_status         as enum ('programado','en_vivo','finalizado','suspendido','reprogramado');
create type tournament_type      as enum ('un_dia','corto_plazo','anual');
create type order_logistics      as enum ('pendiente','pedido_proveedor','listo_retiro','entregado','cancelado');
create type match_event_type     as enum ('gol','gol_recibido','amarilla','roja','sustitucion','atajada','remate','falta');

-- ---------- Organización ----------
create table academy (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  settings jsonb not null default '{}'  -- proveedor_pago, datos_bancarios, call_deadline_hours, etc.
);

create table venue (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy(id),
  name text not null,
  code text not null,
  unique (academy_id, code)
);

create table category (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy(id),
  venue_id uuid references venue(id),
  name text not null,           -- 'Sub10'
  birth_year int,               -- 2016
  schedule jsonb                -- horario recurrente de entrenamiento
);

-- ---------- Personas ----------
create table guardian (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,  -- FK a la tabla de usuarios/auth del repo
  academy_id uuid not null references academy(id),
  full_name text not null,
  phone text,
  email text,
  notification_prefs jsonb not null default '{}'
);

create table student (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy(id),
  full_name text not null,
  birth_date date,
  gender text,
  shirt_number int,
  preferred_position text,
  status text not null default 'activo',
  health_info jsonb,             -- [nuevo] editable por apoderado
  emergency_contact jsonb        -- [nuevo]
);

create table guardian_student (
  guardian_id uuid references guardian(id) on delete cascade,
  student_id uuid references student(id) on delete cascade,
  relationship text,             -- padre, madre, tutor
  is_primary boolean default false,
  can_pay boolean default true,
  can_respond boolean default true,
  primary key (guardian_id, student_id)
);

create table coach (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  academy_id uuid not null references academy(id),
  full_name text not null,
  contact_channel jsonb          -- {tipo:'whatsapp', valor:'...'} visible a apoderados
);

create table coach_category (
  coach_id uuid references coach(id), category_id uuid references category(id),
  primary key (coach_id, category_id)
);

create table enrollment (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references student(id),
  venue_id uuid not null references venue(id),
  category_id uuid not null references category(id),
  starts_on date not null,
  ends_on date,
  scholarship_pct numeric(5,2) default 0,
  sibling_discount text default 'auto',  -- auto | manual | none
  status text not null default 'activo'
);

-- ---------- Deportivo ----------
create table tournament (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy(id),
  venue_id uuid references venue(id),
  name text not null,
  type tournament_type not null,
  description text,
  starts_on date, ends_on date,
  extra_cost int default 0,                  -- CLP entero
  requires_guardian_approval boolean default false,
  approval_deadline timestamptz
);

create table tournament_category (
  tournament_id uuid references tournament(id), category_id uuid references category(id),
  primary key (tournament_id, category_id)
);

create table tournament_participation (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournament(id),
  student_id uuid not null references student(id),
  status participation_status not null default 'pendiente',
  decided_by uuid, decided_by_role text, decided_at timestamptz,
  notes text,
  unique (tournament_id, student_id)
);

create table match (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy(id),
  category_id uuid not null references category(id),
  tournament_id uuid references tournament(id),
  opponent text not null,
  location text,
  is_home boolean,
  call_time timestamptz,          -- citación
  starts_at timestamptz not null,
  periods int, period_minutes int,
  status match_status not null default 'programado',
  score_us int, score_them int
);

create table match_call (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references match(id) on delete cascade,
  student_id uuid not null references student(id),
  status call_status not null default 'pendiente',
  reject_reason text,
  responded_by uuid, responded_at timestamptz,
  deadline timestamptz,           -- default: match.call_time - academy.settings.call_deadline_hours
  unique (match_id, student_id)
);

create table match_lineup (
  match_id uuid references match(id) on delete cascade,
  student_id uuid references student(id),
  is_starter boolean default false,
  position text,
  primary key (match_id, student_id)
);

create table match_event (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references match(id) on delete cascade,
  period int, minute int,
  type match_event_type not null,
  student_id uuid references student(id),
  related_student_id uuid references student(id),  -- asistidor / jugador que sale
  meta jsonb default '{}',
  created_at timestamptz default now()
);

create table evaluation (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references student(id),
  coach_id uuid references coach(id),
  evaluated_on date not null,
  scores jsonb not null
);

create table anthropometry (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references student(id),
  measured_on date not null,
  height_cm numeric, weight_kg numeric, extra jsonb
);

-- ---------- Asistencia ----------
create table training_session (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references category(id),
  starts_at timestamptz not null, ends_at timestamptz,
  status text default 'programada'  -- programada | suspendida
);

create table attendance (
  session_id uuid references training_session(id) on delete cascade,
  student_id uuid references student(id),
  status attendance_status not null,
  recorded_by uuid,
  primary key (session_id, student_id)
);

create table attendance_notice (           -- [nuevo] aviso de inasistencia
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references training_session(id),
  student_id uuid not null references student(id),
  reason text,
  created_by uuid not null,
  created_at timestamptz default now(),
  unique (session_id, student_id)
);

-- ---------- Finanzas ----------
create table payment_due (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy(id),
  student_id uuid not null references student(id),
  concept text not null,
  type due_type not null,
  amount int not null check (amount >= 0),
  due_date date not null,
  notes text,
  cancelled boolean default false,
  source_order_id uuid,
  source_participation_id uuid references tournament_participation(id)
);

create table payment (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy(id),
  guardian_id uuid references guardian(id),
  amount int not null check (amount > 0),
  method payment_method not null,
  paid_on date not null,
  receipt_path text,               -- storage privado
  status payment_status not null,
  reject_reason text,
  provider text, provider_payment_id text unique,  -- idempotencia webhook
  notes text,
  registered_by uuid, approved_by uuid,
  created_at timestamptz default now()
);

create table payment_allocation (
  payment_id uuid references payment(id) on delete cascade,
  payment_due_id uuid references payment_due(id),
  amount int not null check (amount > 0),
  primary key (payment_id, payment_due_id)
);

create table credit_movement (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references student(id),
  amount int not null,             -- + abono / − uso
  origin text,
  created_at timestamptz default now()
);

-- Estado derivado de la cuota (no se setea a mano)
create view payment_due_status as
select d.id,
       d.amount,
       coalesce(sum(a.amount) filter (where p.status = 'aprobado'), 0) as paid,
       d.amount - coalesce(sum(a.amount) filter (where p.status = 'aprobado'), 0) as balance,
       case
         when d.cancelled then 'anulada'
         when coalesce(sum(a.amount) filter (where p.status = 'aprobado'),0) >= d.amount then 'pagada'
         when bool_or(p.status = 'por_comprobar') then 'por_comprobar'
         when coalesce(sum(a.amount) filter (where p.status = 'aprobado'),0) > 0
              and current_date <= d.due_date then 'parcial'
         when current_date > d.due_date then 'vencido'
         else 'pendiente'
       end as status
from payment_due d
left join payment_allocation a on a.payment_due_id = d.id
left join payment p on p.id = a.payment_id
group by d.id;

-- ---------- Tienda ----------
create table product (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy(id),
  family text not null,            -- Buzo, Polerón...
  name text not null,              -- variante: 'Cierre Negro'
  price int not null,
  active boolean default true,
  size_guide jsonb
);

create table product_stock (
  product_id uuid references product(id) on delete cascade,
  size text not null,
  stock int not null default 0,
  reserved int not null default 0,
  primary key (product_id, size)
);

create table cart_item (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references guardian(id),
  product_id uuid not null references product(id),
  size text not null,
  student_id uuid not null references student(id),
  qty int not null check (qty > 0)
);

create table shop_order (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy(id),
  guardian_id uuid not null references guardian(id),
  student_id uuid not null references student(id),
  logistics order_logistics not null default 'pendiente',
  payment_due_id uuid references payment_due(id),
  created_at timestamptz default now()
);

create table shop_order_item (
  order_id uuid references shop_order(id) on delete cascade,
  product_id uuid references product(id),
  size text not null,
  qty int not null,
  unit_price int not null,
  primary key (order_id, product_id, size)
);

-- ---------- Transversal ----------
create table audit_log (
  id bigserial primary key,
  actor_id uuid, actor_role text,
  entity text not null, entity_id uuid,
  action text not null,
  before jsonb, after jsonb,
  at timestamptz default now()
);

create table push_subscription (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  endpoint text not null unique,
  keys jsonb not null,
  device text,
  created_at timestamptz default now()
);

-- ---------- Índices útiles ----------
create index on match_call (student_id, status);
create index on payment_due (student_id, due_date);
create index on match (category_id, starts_at);
create index on attendance (student_id);
create index on match_event (match_id, created_at);

-- =====================================================================
-- RLS OPCIONAL (Supabase / Postgres con auth.uid())
-- Patrón: el apoderado solo ve filas de sus hijos.
-- =====================================================================
-- create or replace function my_student_ids() returns setof uuid
-- language sql stable security definer as $$
--   select gs.student_id from guardian_student gs
--   join guardian g on g.id = gs.guardian_id
--   where g.user_id = auth.uid()
-- $$;
--
-- alter table student enable row level security;
-- create policy guardian_read_students on student for select
--   using (id in (select my_student_ids()));
--
-- alter table match_call enable row level security;
-- create policy guardian_read_calls on match_call for select
--   using (student_id in (select my_student_ids()));
-- -- Escritura de convocatorias: SOLO vía función RPC que valida estado+deadline,
-- -- no policy de update directa:
-- -- create function respond_call(p_call uuid, p_status call_status, p_reason text) ...
--
-- alter table payment_due enable row level security;
-- create policy guardian_read_dues on payment_due for select
--   using (student_id in (select my_student_ids()));
--
-- Repetir patrón para attendance, tournament_participation, shop_order,
-- evaluation, anthropometry, credit_movement.
-- Lista del plantel convocado: exponer vía VIEW con nombre de pila + inicial,
-- nunca leer student completo de otros alumnos (gap G-01).
