-- Tenancy foundation: hospitals, profiles, settings, counters and the
-- helper functions every RLS policy relies on.

create schema if not exists private;
create schema if not exists audit;

revoke all on schema private from public;
revoke all on schema audit from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.hospitals (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  country text not null,
  timezone text not null default 'UTC',
  currency char(3) not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  constraint hospitals_code_lowercase check (code = lower(code)),
  constraint hospitals_code_format check (code ~ '^[a-z0-9][a-z0-9-]{1,31}$')
);

create unique index hospitals_code_key on public.hospitals (code);
create index hospitals_status_idx on public.hospitals (status);

create trigger hospitals_touch_updated_at
before update on public.hospitals
for each row execute function private.touch_updated_at();

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  hospital_id uuid references public.hospitals (id),
  username text,
  full_name text not null,
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_required check (hospital_id is null or username is not null)
);

create unique index profiles_hospital_username_key
  on public.profiles (hospital_id, username)
  where hospital_id is not null;
create index profiles_hospital_idx on public.profiles (hospital_id);

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function private.touch_updated_at();

create table public.hospital_settings (
  hospital_id uuid primary key references public.hospitals (id) on delete cascade,
  logo_path text,
  tax_rate numeric(5, 2) not null default 0 check (tax_rate >= 0 and tax_rate <= 100),
  currency char(3) not null,
  timezone text not null,
  number_formats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger hospital_settings_touch_updated_at
before update on public.hospital_settings
for each row execute function private.touch_updated_at();

create table public.hospital_counters (
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  name text not null,
  next_value bigint not null default 1 check (next_value > 0),
  primary key (hospital_id, name)
);

create or replace function private.current_hospital_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'hospital_id', '')::uuid;
$$;

create or replace function private.current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select auth.jwt() -> 'app_metadata' ->> 'role';
$$;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_role() = 'super_admin', false);
$$;

create or replace function private.has_permission(permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' -> 'permissions') ? permission,
    false
  );
$$;

grant execute on function private.current_hospital_id() to authenticated, service_role;
grant execute on function private.current_role() to authenticated, service_role;
grant execute on function private.is_super_admin() to authenticated, service_role;
grant execute on function private.has_permission(text) to authenticated, service_role;

alter table public.hospitals enable row level security;
alter table public.profiles enable row level security;
alter table public.hospital_settings enable row level security;
alter table public.hospital_counters enable row level security;

create policy hospitals_select on public.hospitals
for select to authenticated
using (
  id = (select private.current_hospital_id())
  or (select private.is_super_admin())
);

create policy profiles_select_self on public.profiles
for select to authenticated
using (user_id = (select auth.uid()));

create policy profiles_select_hospital on public.profiles
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('users:read'))
);

create policy profiles_update_self on public.profiles
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy hospital_settings_select on public.hospital_settings
for select to authenticated
using (hospital_id = (select private.current_hospital_id()));

create policy hospital_settings_update on public.hospital_settings
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('settings:update'))
)
with check (hospital_id = (select private.current_hospital_id()));

revoke all on public.hospital_counters from authenticated, anon;

grant select on public.hospitals, public.profiles, public.hospital_settings to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant update (logo_path, tax_rate, currency, timezone, number_formats) on public.hospital_settings to authenticated;
