-- ============================================================
-- Migration 0023: POS, Services, Scheduling & Recurring Jobs
-- Missing tables not covered in migrations 0001-0022
-- ============================================================

BEGIN;

-- ──────────────────────────────────────────────
-- POS Orders
-- ──────────────────────────────────────────────

create table if not exists public.pos_orders (
  id                uuid        primary key default gen_random_uuid(),
  company_id        uuid        not null references public.companies(id) on delete cascade,
  branch_id         uuid        references public.branches(id) on delete set null,
  order_number      text        not null,
  cashier_id        uuid        references public.employees(id) on delete set null,
  cashier_name      text,
  customer_id       uuid        references public.customers(id) on delete set null,
  customer_name     text,
  order_date        timestamptz not null default now(),
  status            text        not null default 'COMPLETED' check (status in ('DRAFT','HELD','COMPLETED','REFUNDED','CANCELLED')),
  payment_method    text        not null default 'CASH' check (payment_method in ('CASH','CARD','BANK_TRANSFER','SPLIT','OTHER')),
  subtotal          numeric(15,3) not null default 0,
  discount_amount   numeric(15,3) not null default 0,
  tax_amount        numeric(15,3) not null default 0,
  total_amount      numeric(15,3) not null default 0,
  amount_tendered   numeric(15,3) not null default 0,
  change_amount     numeric(15,3) not null default 0,
  shift_id          uuid,                         -- references cashier_shifts
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.pos_order_items (
  id                uuid        primary key default gen_random_uuid(),
  pos_order_id      uuid        not null references public.pos_orders(id) on delete cascade,
  product_id        uuid        references public.products(id) on delete set null,
  description       text        not null,
  quantity          numeric(15,3) not null default 1,
  unit_price        numeric(15,3) not null default 0,
  discount_percent  numeric(5,2) not null default 0,
  tax_rate          numeric(5,2) not null default 0,
  total_price       numeric(15,3) not null default 0,
  created_at        timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- Cashier Shifts
-- ──────────────────────────────────────────────

create table if not exists public.cashier_shifts (
  id                uuid        primary key default gen_random_uuid(),
  company_id        uuid        not null references public.companies(id) on delete cascade,
  branch_id         uuid        references public.branches(id) on delete set null,
  cashier_id        uuid        references public.employees(id) on delete set null,
  cashier_name      text,
  shift_number      text        not null,
  opened_at         timestamptz not null default now(),
  closed_at         timestamptz,
  opening_cash      numeric(15,3) not null default 0,
  closing_cash      numeric(15,3),
  expected_cash     numeric(15,3),
  cash_difference   numeric(15,3),
  total_sales       numeric(15,3) not null default 0,
  total_refunds     numeric(15,3) not null default 0,
  total_transactions integer     not null default 0,
  status            text        not null default 'OPEN' check (status in ('OPEN','CLOSED')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Add foreign key from pos_orders to cashier_shifts after both tables exist
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'fk_pos_orders_shift'
  ) then
    alter table public.pos_orders
      add constraint fk_pos_orders_shift
      foreign key (shift_id) references public.cashier_shifts(id) on delete set null;
  end if;
end $$;

-- ──────────────────────────────────────────────
-- Consulting Services
-- ──────────────────────────────────────────────

create table if not exists public.consulting_services (
  id                uuid        primary key default gen_random_uuid(),
  company_id        uuid        not null references public.companies(id) on delete cascade,
  branch_id         uuid        references public.branches(id) on delete set null,
  name              text        not null,
  name_en           text,
  category          text,
  description       text,
  pricing_model     text        not null default 'FIXED' check (pricing_model in ('FIXED','HOURLY','DAILY','MONTHLY','CUSTOM')),
  base_price        numeric(15,3) not null default 0,
  hourly_rate       numeric(15,3) not null default 0,
  duration_hours    numeric(5,1) not null default 0,
  max_capacity      integer     not null default 1,
  tags              text[]      not null default '{}',
  image_url         text,
  is_active         boolean     not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- Service Bookings
-- ──────────────────────────────────────────────

create table if not exists public.service_bookings (
  id                uuid        primary key default gen_random_uuid(),
  company_id        uuid        not null references public.companies(id) on delete cascade,
  service_id        uuid        references public.consulting_services(id) on delete set null,
  customer_id       uuid        references public.customers(id) on delete set null,
  customer_name     text,
  booking_date      date        not null,
  start_time        time,
  end_time          time,
  attendees         integer     not null default 1,
  total_amount      numeric(15,3) not null default 0,
  amount_paid       numeric(15,3) not null default 0,
  status            text        not null default 'PENDING' check (status in ('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW')),
  payment_status    text        not null default 'UNPAID' check (payment_status in ('UNPAID','PARTIAL','PAID','REFUNDED')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- Membership Packages
-- ──────────────────────────────────────────────

create table if not exists public.membership_packages (
  id                uuid        primary key default gen_random_uuid(),
  company_id        uuid        not null references public.companies(id) on delete cascade,
  branch_id         uuid        references public.branches(id) on delete set null,
  name              text        not null,
  name_en           text,
  description       text,
  price             numeric(15,3) not null default 0,
  duration_months   integer     not null default 1,
  features          text[]      not null default '{}',
  discount_percent  numeric(5,2) not null default 0,
  max_users         integer     not null default 1,
  is_active         boolean     not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- Tenant Subscriptions
-- ──────────────────────────────────────────────

create table if not exists public.tenant_subscriptions (
  id                uuid        primary key default gen_random_uuid(),
  company_id        uuid        not null references public.companies(id) on delete cascade,
  customer_id       uuid        references public.customers(id) on delete set null,
  customer_name     text,
  package_id        uuid        references public.membership_packages(id) on delete set null,
  package_name      text,
  start_date        date        not null,
  end_date          date        not null,
  status            text        not null default 'ACTIVE' check (status in ('ACTIVE','EXPIRED','CANCELLED','SUSPENDED')),
  total_amount      numeric(15,3) not null default 0,
  amount_paid       numeric(15,3) not null default 0,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- Recurring Schedules
-- ──────────────────────────────────────────────

create table if not exists public.recurring_schedules (
  id                uuid        primary key default gen_random_uuid(),
  company_id        uuid        not null references public.companies(id) on delete cascade,
  name              text        not null,
  entity_type       text        not null,       -- 'INVOICE', 'JOURNAL_ENTRY', 'PAYMENT', etc.
  entity_id         uuid,                        -- template entity to duplicate
  frequency         text        not null check (frequency in ('DAILY','WEEKLY','MONTHLY','QUARTERLY','YEARLY')),
  start_date        date        not null,
  end_date          date,
  next_run_date     date,
  last_run_date     date,
  is_active         boolean     not null default true,
  notes             text,
  created_by        uuid        references public.employees(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────

create index if not exists pos_orders_company_id_idx on public.pos_orders (company_id);
create index if not exists pos_orders_order_date_idx on public.pos_orders (order_date desc);
create index if not exists pos_order_items_order_id_idx on public.pos_order_items (pos_order_id);
create index if not exists cashier_shifts_company_id_idx on public.cashier_shifts (company_id);
create index if not exists consulting_services_company_id_idx on public.consulting_services (company_id);
create index if not exists service_bookings_company_id_idx on public.service_bookings (company_id);
create index if not exists membership_packages_company_id_idx on public.membership_packages (company_id);
create index if not exists tenant_subscriptions_company_id_idx on public.tenant_subscriptions (company_id);
create index if not exists recurring_schedules_company_id_idx on public.recurring_schedules (company_id);

-- ──────────────────────────────────────────────
-- Enable RLS
-- ──────────────────────────────────────────────

alter table public.pos_orders enable row level security;
alter table public.pos_order_items enable row level security;
alter table public.cashier_shifts enable row level security;
alter table public.consulting_services enable row level security;
alter table public.service_bookings enable row level security;
alter table public.membership_packages enable row level security;
alter table public.tenant_subscriptions enable row level security;
alter table public.recurring_schedules enable row level security;

-- ──────────────────────────────────────────────
-- RLS Policies (company-scoped via auth_user_company_ids function from 0007)
-- ──────────────────────────────────────────────

drop policy if exists "Users can view their company POS orders" on public.pos_orders;
create policy "Users can view their company POS orders"
  on public.pos_orders for select
  to authenticated
  using (company_id in (select public.auth_user_company_ids()));

drop policy if exists "Users can insert their company POS orders" on public.pos_orders;
create policy "Users can insert their company POS orders"
  on public.pos_orders for insert
  to authenticated
  with check (company_id in (select public.auth_user_company_ids()));

drop policy if exists "Users can update their company POS orders" on public.pos_orders;
create policy "Users can update their company POS orders"
  on public.pos_orders for update
  to authenticated
  using (company_id in (select public.auth_user_company_ids()))
  with check (company_id in (select public.auth_user_company_ids()));

drop policy if exists "Users can view their company POS order items" on public.pos_order_items;
create policy "Users can view their company POS order items"
  on public.pos_order_items for select
  to authenticated
  using (exists (
    select 1 from public.pos_orders po
    where po.id = pos_order_id
    and po.company_id in (select public.auth_user_company_ids())
  ));

drop policy if exists "Users can insert POS order items" on public.pos_order_items;
create policy "Users can insert POS order items"
  on public.pos_order_items for insert
  to authenticated
  with check (exists (
    select 1 from public.pos_orders po
    where po.id = pos_order_id
    and po.company_id in (select public.auth_user_company_ids())
  ));

drop policy if exists "Users can view their company cashier shifts" on public.cashier_shifts;
create policy "Users can view their company cashier shifts"
  on public.cashier_shifts for select
  to authenticated
  using (company_id in (select public.auth_user_company_ids()));

drop policy if exists "Users can insert cashier shifts" on public.cashier_shifts;
create policy "Users can insert cashier shifts"
  on public.cashier_shifts for insert
  to authenticated
  with check (company_id in (select public.auth_user_company_ids()));

drop policy if exists "Users can update cashier shifts" on public.cashier_shifts;
create policy "Users can update cashier shifts"
  on public.cashier_shifts for update
  to authenticated
  using (company_id in (select public.auth_user_company_ids()))
  with check (company_id in (select public.auth_user_company_ids()));

drop policy if exists "Users can view their company consulting services" on public.consulting_services;
create policy "Users can view their company consulting services"
  on public.consulting_services for select
  to authenticated
  using (company_id in (select public.auth_user_company_ids()));

drop policy if exists "Users can manage consulting services" on public.consulting_services;
create policy "Users can manage consulting services"
  on public.consulting_services for all
  to authenticated
  using (company_id in (select public.auth_user_company_ids()))
  with check (company_id in (select public.auth_user_company_ids()));

drop policy if exists "Users can view their company service bookings" on public.service_bookings;
create policy "Users can view their company service bookings"
  on public.service_bookings for select
  to authenticated
  using (company_id in (select public.auth_user_company_ids()));

drop policy if exists "Users can manage service bookings" on public.service_bookings;
create policy "Users can manage service bookings"
  on public.service_bookings for all
  to authenticated
  using (company_id in (select public.auth_user_company_ids()))
  with check (company_id in (select public.auth_user_company_ids()));

drop policy if exists "Users can view their company membership packages" on public.membership_packages;
create policy "Users can view their company membership packages"
  on public.membership_packages for select
  to authenticated
  using (company_id in (select public.auth_user_company_ids()));

drop policy if exists "Users can manage membership packages" on public.membership_packages;
create policy "Users can manage membership packages"
  on public.membership_packages for all
  to authenticated
  using (company_id in (select public.auth_user_company_ids()))
  with check (company_id in (select public.auth_user_company_ids()));

drop policy if exists "Users can view their company tenant subscriptions" on public.tenant_subscriptions;
create policy "Users can view their company tenant subscriptions"
  on public.tenant_subscriptions for select
  to authenticated
  using (company_id in (select public.auth_user_company_ids()));

drop policy if exists "Users can manage tenant subscriptions" on public.tenant_subscriptions;
create policy "Users can manage tenant subscriptions"
  on public.tenant_subscriptions for all
  to authenticated
  using (company_id in (select public.auth_user_company_ids()))
  with check (company_id in (select public.auth_user_company_ids()));

drop policy if exists "Users can view their company recurring schedules" on public.recurring_schedules;
create policy "Users can view their company recurring schedules"
  on public.recurring_schedules for select
  to authenticated
  using (company_id in (select public.auth_user_company_ids()));

drop policy if exists "Users can manage recurring schedules" on public.recurring_schedules;
create policy "Users can manage recurring schedules"
  on public.recurring_schedules for all
  to authenticated
  using (company_id in (select public.auth_user_company_ids()))
  with check (company_id in (select public.auth_user_company_ids()));

-- ──────────────────────────────────────────────
-- updated_at triggers
-- ──────────────────────────────────────────────

create or replace function public.set_pos_services_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_pos_orders on public.pos_orders;
create trigger set_updated_at_pos_orders
  before update on public.pos_orders
  for each row execute function public.set_pos_services_updated_at();

drop trigger if exists set_updated_at_cashier_shifts on public.cashier_shifts;
create trigger set_updated_at_cashier_shifts
  before update on public.cashier_shifts
  for each row execute function public.set_pos_services_updated_at();

drop trigger if exists set_updated_at_consulting_services on public.consulting_services;
create trigger set_updated_at_consulting_services
  before update on public.consulting_services
  for each row execute function public.set_pos_services_updated_at();

drop trigger if exists set_updated_at_service_bookings on public.service_bookings;
create trigger set_updated_at_service_bookings
  before update on public.service_bookings
  for each row execute function public.set_pos_services_updated_at();

drop trigger if exists set_updated_at_membership_packages on public.membership_packages;
create trigger set_updated_at_membership_packages
  before update on public.membership_packages
  for each row execute function public.set_pos_services_updated_at();

drop trigger if exists set_updated_at_tenant_subscriptions on public.tenant_subscriptions;
create trigger set_updated_at_tenant_subscriptions
  before update on public.tenant_subscriptions
  for each row execute function public.set_pos_services_updated_at();

drop trigger if exists set_updated_at_recurring_schedules on public.recurring_schedules;
create trigger set_updated_at_recurring_schedules
  before update on public.recurring_schedules
  for each row execute function public.set_pos_services_updated_at();

COMMIT;
