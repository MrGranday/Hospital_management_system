-- Module catalog and per-hospital module enablement.
-- Replaces the global-roles model with per-hospital roles created by the
-- hospital admin from enabled modules. See PLATFORM_MODULES.md §4, §9, §13.

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (btrim(key) <> '') check (key ~ '^[a-z_][a-z0-9_]*$'),
  name text not null check (btrim(name) <> ''),
  description text,
  requires text[] not null default '{}',
  soft_requires text[] not null default '{}',
  sort integer not null default 0,
  is_deferred boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1
);

create index modules_key_idx on public.modules (key);
create index modules_is_deferred_idx on public.modules (is_deferred);

create trigger modules_touch_updated_at
before update on public.modules
for each row execute function private.touch_updated_at();

alter table public.modules enable row level security;

create policy modules_select on public.modules
for select to authenticated
using (true);

revoke all on public.modules from authenticated, anon;
grant select on public.modules to authenticated;

-- hospital_modules: which modules each hospital has enabled.

create table public.hospital_modules (
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  module_key text not null references public.modules (key) on delete cascade,
  enabled boolean not null default true,
  enabled_at timestamptz not null default now(),
  enabled_by uuid references auth.users (id),
  disabled_at timestamptz,
  disabled_by uuid references auth.users (id),
  primary key (hospital_id, module_key)
);

create index hospital_modules_hospital_idx on public.hospital_modules (hospital_id);
create index hospital_modules_module_idx on public.hospital_modules (module_key);

create trigger hospital_modules_touch_updated_at
before update on public.hospital_modules
for each row execute function private.touch_updated_at();

alter table public.hospital_modules enable row level security;

create policy hospital_modules_select on public.hospital_modules
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  or (select private.is_super_admin())
);

create policy hospital_modules_manage on public.hospital_modules
for all to authenticated
using (
  (select private.is_super_admin())
)
with check (
  (select private.is_super_admin())
);

revoke all on public.hospital_modules from authenticated, anon;
grant all on public.hospital_modules to authenticated;

-- support_sessions: audited, time-limited super admin access into one hospital.

create table public.support_sessions (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  super_admin_id uuid not null references auth.users (id),
  mode text not null check (mode in ('view', 'act')) default 'view',
  reason text not null check (char_length(btrim(reason)) >= 20),
  status text not null check (status in ('requested', 'approved', 'active', 'denied', 'ended', 'expired')) default 'requested',
  requested_at timestamptz not null default now(),
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  starts_at timestamptz,
  expires_at timestamptz not null,
  ended_at timestamptz,
  ended_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1
);

create index support_sessions_hospital_idx on public.support_sessions (hospital_id, status);
create index support_sessions_super_admin_idx on public.support_sessions (super_admin_id);
create index support_sessions_expires_idx on public.support_sessions (expires_at)
  where status = 'active';

create trigger support_sessions_touch_updated_at
before update on public.support_sessions
for each row execute function private.touch_updated_at();

alter table public.support_sessions enable row level security;

create policy support_sessions_select on public.support_sessions
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  or super_admin_id = (select auth.uid())
  or (select private.is_super_admin())
);

create policy support_sessions_insert on public.support_sessions
for insert to authenticated
with check (
  super_admin_id = (select auth.uid())
  and (select private.is_super_admin())
);

create policy support_sessions_update on public.support_sessions
for update to authenticated
using (
  (select private.is_super_admin())
  or hospital_id = (select private.current_hospital_id())
)
with check (
  (select private.is_super_admin())
  or hospital_id = (select private.current_hospital_id())
);

revoke all on public.support_sessions from authenticated, anon;
grant all on public.support_sessions to authenticated;

create trigger support_sessions_audit
after insert or update or delete on public.support_sessions
for each row execute function private.write_audit_event();

-- orders: core orders table referenced by lab, radiology, and other modules.
-- A doctor creates an order from a visit; a technician creates a walk-in order.

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  patient_id uuid not null references public.patients (id),
  visit_id uuid references public.visits (id),
  kind text not null check (kind in ('lab', 'radiology')),
  source text not null check (source in ('doctor', 'walk_in')),
  paper_ref text,
  ordered_by uuid not null references public.profiles (user_id),
  status text not null check (status in ('ordered', 'sample_collected', 'in_progress', 'completed', 'cancelled')),
  priority text not null check (priority in ('routine', 'urgent', 'stat')) default 'routine',
  clinical_note text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint orders_hospital_patient_composite unique (hospital_id, id)
);

create index orders_hospital_patient_idx on public.orders (hospital_id, patient_id, created_at desc)
  where deleted_at is null;
create index orders_hospital_status_idx on public.orders (hospital_id, status, created_at desc)
  where deleted_at is null;
create index orders_hospital_kind_idx on public.orders (hospital_id, kind, created_at desc)
  where deleted_at is null;

create trigger orders_prepare
before insert or update on public.orders
for each row execute function private.prepare_order_row();

create trigger orders_audit
after insert or update or delete on public.orders
for each row execute function private.write_audit_event();

alter table public.orders enable row level security;

create policy orders_select on public.orders
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and deleted_at is null
);

create policy orders_insert on public.orders
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
);

create policy orders_update on public.orders
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and deleted_at is null
);

revoke all on public.orders from authenticated, anon;
grant select on public.orders to authenticated;
grant insert (
  hospital_id, patient_id, visit_id, kind, source, paper_ref, ordered_by, status, priority, clinical_note
) on public.orders to authenticated;
grant update (
  status, priority, clinical_note
) on public.orders to authenticated;

-- charges: core charges ledger. Any billable module inserts a pending charge;
-- Finance turns pending charges into invoices.

create table public.charges (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  patient_id uuid not null references public.patients (id),
  visit_id uuid references public.visits (id),
  source_module text not null check (btrim(source_module) <> ''),
  source_ref text not null check (btrim(source_ref) <> ''),
  service_id uuid,
  description text not null check (btrim(description) <> ''),
  quantity integer not null check (quantity > 0) default 1,
  unit_price_minor integer not null check (unit_price_minor >= 0),
  currency char(3) not null default 'AFN',
  status text not null check (status in ('pending', 'invoiced', 'settled_slip', 'void')) default 'pending',
  invoice_line_id uuid references public.invoice_lines (id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint charges_hospital_patient_composite unique (hospital_id, id)
);

create index charges_hospital_patient_idx on public.charges (hospital_id, patient_id, created_at desc)
  where deleted_at is null;
create index charges_hospital_status_idx on public.charges (hospital_id, status, created_at desc)
  where deleted_at is null;
create index charges_hospital_source_idx on public.charges (hospital_id, source_module, source_ref)
  where deleted_at is null;

create trigger charges_prepare
before insert or update on public.charges
for each row execute function private.prepare_charge_row();

create trigger charges_audit
after insert or update or delete on public.charges
for each row execute function private.write_audit_event();

alter table public.charges enable row level security;

create policy charges_select on public.charges
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and deleted_at is null
);

create policy charges_insert on public.charges
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
);

create policy charges_update on public.charges
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and deleted_at is null
);

revoke all on public.charges from authenticated, anon;
grant select on public.charges to authenticated;
grant insert (
  hospital_id, patient_id, visit_id, source_module, source_ref, service_id, description,
  quantity, unit_price_minor, currency, status
) on public.charges to authenticated;
grant update (
  status, invoice_line_id
) on public.charges to authenticated;

-- dashboard_summaries: pre-computed metrics per hospital/module/period.

create table public.dashboard_summaries (
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  module_key text not null check (btrim(module_key) <> ''),
  metric_key text not null check (btrim(metric_key) <> ''),
  period text not null check (period in ('today', '7d', '30d')),
  value jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  primary key (hospital_id, module_key, metric_key, period)
);

create index dashboard_summaries_hospital_idx on public.dashboard_summaries (hospital_id, computed_at desc);

create trigger dashboard_summaries_touch_updated_at
before update on public.dashboard_summaries
for each row execute function private.touch_updated_at();

alter table public.dashboard_summaries enable row level security;

create policy dashboard_summaries_select on public.dashboard_summaries
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
);

revoke all on public.dashboard_summaries from authenticated, anon;
grant select on public.dashboard_summaries to authenticated;

create trigger dashboard_summaries_audit
after insert or update or delete on public.dashboard_summaries
for each row execute function private.write_audit_event();

-- Prepare triggers for orders and charges.

create or replace function private.prepare_order_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  else
    new.hospital_id := old.hospital_id;
    new.patient_id := old.patient_id;
    new.visit_id := old.visit_id;
    new.kind := old.kind;
    new.source := old.source;
    new.paper_ref := old.paper_ref;
    new.ordered_by := old.ordered_by;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.prepare_charge_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  else
    new.hospital_id := old.hospital_id;
    new.patient_id := old.patient_id;
    new.visit_id := old.visit_id;
    new.source_module := old.source_module;
    new.source_ref := old.source_ref;
    new.service_id := old.service_id;
    new.description := old.description;
    new.quantity := old.quantity;
    new.unit_price_minor := old.unit_price_minor;
    new.currency := old.currency;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Update roles to be per-hospital: add hospital_id column (NULL for system role).
-- The existing global roles migration (20261115090100_rbac.sql) stays untouched.
-- This migration adds hospital_id and re-scopes policies.

alter table public.roles
  add column if not exists hospital_id uuid references public.hospitals (id) on delete cascade;

create index roles_hospital_idx on public.roles (hospital_id);

-- role_permissions: already exists; add hospital_id for per-hospital scoping.
-- The existing role_permissions rows from the global migration remain as
-- system-level templates; new per-hospital rows carry hospital_id.

alter table public.role_permissions
  add column if not exists hospital_id uuid references public.hospitals (id) on delete cascade;

create index role_permissions_hospital_idx on public.role_permissions (hospital_id);

-- user_roles: add hospital_id for per-hospital scoping.

alter table public.user_roles
  add column if not exists hospital_id uuid references public.hospitals (id) on delete cascade;

create index user_roles_hospital_idx on public.user_roles (hospital_id);

-- profiles: add role_id for per-hospital role assignment (replaces direct role key).

alter table public.profiles
  add column if not exists role_id uuid references public.roles (id);

create index profiles_role_idx on public.profiles (role_id);

-- Helper function: module_enabled(text) checks if a module is enabled for the
-- caller's hospital (or for super admin acting in a support session).

create or replace function private.module_enabled(p_module_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.hospital_modules hm
    where hm.module_key = p_module_key
      and hm.enabled
      and (
        hm.hospital_id = (select private.current_hospital_id())
        or (
          (select private.is_super_admin())
          and hm.hospital_id = coalesce(
            (auth.jwt() -> 'app_metadata' ->> 'acting_hospital_id')::uuid,
            (select private.current_hospital_id())
          )
        )
      )
  );
$$;

grant execute on function private.module_enabled(text) to authenticated, service_role;

-- Helper function: effective_permissions() returns the permission keys the
-- caller holds, scoped to enabled modules and (for super admin) support session.

create or replace function private.effective_permissions()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  with caller as (
    select
      (auth.jwt() -> 'app_metadata' ->> 'role')::text as role_key,
      (auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid as own_hospital_id,
      (auth.jwt() -> 'app_metadata' ->> 'acting_hospital_id')::uuid as acting_hospital_id,
      coalesce(
        (auth.jwt() -> 'app_metadata' -> 'permissions')::jsonb,
        '[]'::jsonb
      ) as jwt_permissions
  ),
  target_hospital as (
    select coalesce(nullif(c.acting_hospital_id, '00000000-0000-0000-0000-000000000000'::uuid), c.own_hospital_id) as hospital_id
    from caller c
  ),
  role_perms as (
    select distinct p.key as permission_key
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = (auth.uid())
      and (r.hospital_id is null or r.hospital_id = (select hospital_id from target_hospital))
      and (
        r.hospital_id is null
        or (select private.module_enabled(split_part(p.key, ':', 1)))
      )
  ),
  enabled_mod_perms as (
    select distinct p.key
    from public.permissions p
    where (select private.module_enabled(split_part(p.key, ':', 1)))
  )
  select array_agg(distinct rp.permission_key)
  from role_perms rp
  where rp.permission_key = any(select key from enabled_mod_perms)
$$;

grant execute on function private.effective_permissions() to authenticated, service_role;
