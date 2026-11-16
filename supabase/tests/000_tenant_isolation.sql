-- Tenant isolation and tenancy-surface tests (pgTAP).
-- Run with: supabase test db
--
-- Catalog checks fail automatically when a new public table ships without RLS,
-- hospital_id, a hospital_id policy or a tenant-leading index.

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(26);

-- ---------------------------------------------------------------------------
-- Catalog invariants
-- ---------------------------------------------------------------------------

select is(
  (
    select count(*)::int
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relispartition
      and not c.relrowsecurity
  ),
  0,
  'every table in public has row level security enabled'
);

select is(
  (
    select count(*)::int
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'audit'
      and c.relkind in ('r', 'p')
      and not c.relispartition
      and not c.relrowsecurity
  ),
  0,
  'every table in audit has row level security enabled'
);

select is_empty(
  $$
    select c.table_name
    from information_schema.tables c
    where c.table_schema = 'public'
      and c.table_type = 'BASE TABLE'
      and c.table_name not in
        ('hospitals', 'profiles', 'roles', 'permissions', 'role_permissions', 'user_roles')
      and not exists (
        select 1
        from information_schema.columns col
        where col.table_schema = 'public'
          and col.table_name = c.table_name
          and col.column_name = 'hospital_id'
          and col.is_nullable = 'NO'
      )
  $$,
  'every domain table has a NOT NULL hospital_id'
);

select is_empty(
  $$
    select c.table_name
    from information_schema.tables c
    where c.table_schema = 'public'
      and c.table_type = 'BASE TABLE'
      and c.table_name not in
        ('hospitals', 'profiles', 'roles', 'permissions', 'role_permissions', 'user_roles', 'hospital_counters')
      and not exists (
        select 1
        from pg_policies p
        where p.schemaname = 'public'
          and p.tablename = c.table_name
          and (coalesce(p.qual, '') like '%hospital_id%' or coalesce(p.with_check, '') like '%hospital_id%')
      )
  $$,
  'every domain table has a policy that scopes by hospital_id'
);

select is_empty(
  $$
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relname not in
        ('hospitals', 'profiles', 'roles', 'permissions', 'role_permissions', 'user_roles')
      and not exists (
        select 1
        from pg_index i
        join pg_attribute a on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
        where i.indrelid = c.oid
          and a.attname = 'hospital_id'
      )
  $$,
  'every domain table has an index starting with hospital_id'
);

select is_empty(
  $$
    select c.relname || ':' || ic.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_index i on i.indrelid = c.oid
    join pg_class ic on ic.oid = i.indexrelid
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and i.indisunique
      and not i.indisprimary
      and c.relname not in
        ('hospitals', 'profiles', 'roles', 'permissions', 'role_permissions', 'user_roles')
      and a.attname <> 'hospital_id'
  $$,
  'every non-primary unique index on a domain table starts with hospital_id'
);

-- ---------------------------------------------------------------------------
-- Grants: authenticated must not write outside the intended column surface
-- ---------------------------------------------------------------------------

select ok(
  not has_table_privilege('authenticated', 'public.hospitals', 'INSERT'),
  'authenticated cannot insert hospitals'
);

select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'UPDATE'),
  'authenticated has no table-level UPDATE on profiles'
);

select ok(
  has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE'),
  'authenticated can update profiles.full_name'
);

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'hospital_id', 'UPDATE'),
  'authenticated cannot update profiles.hospital_id'
);

select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'DELETE'),
  'authenticated cannot delete profiles'
);

select ok(
  not has_table_privilege('authenticated', 'public.hospital_counters', 'SELECT'),
  'authenticated cannot read hospital_counters directly'
);

-- ---------------------------------------------------------------------------
-- Fixtures: two hospitals, two tenant users
-- ---------------------------------------------------------------------------

insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'tenant-a@isolation.invalid', 'x', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'tenant-b@isolation.invalid', 'x', now(), '{}', '{}', now(), now());

insert into public.hospitals (id, code, name, country, timezone, currency)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'isolation-a', 'Isolation Hospital A', 'EG', 'Africa/Cairo', 'EGP'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'isolation-b', 'Isolation Hospital B', 'EG', 'Africa/Cairo', 'EGP');

insert into public.hospital_settings (hospital_id, currency, timezone)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EGP', 'Africa/Cairo'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'EGP', 'Africa/Cairo');

insert into public.hospital_counters (hospital_id, name, next_value)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'mrn', 1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'mrn', 1);

insert into public.profiles (user_id, hospital_id, username, full_name)
values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'tenant-a', 'Tenant A Admin'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'tenant-b', 'Tenant B Admin');

insert into public.user_roles (user_id, role_id)
select '11111111-1111-1111-1111-111111111111', id from public.roles where key = 'hospital_admin';
insert into public.user_roles (user_id, role_id)
select '22222222-2222-2222-2222-222222222222', id from public.roles where key = 'hospital_admin';

-- ---------------------------------------------------------------------------
-- Behave as tenant A
-- ---------------------------------------------------------------------------

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{"hospital_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"hospital_admin","permissions":["patients:read","settings:update","users:read"]}}';

select is(
  (select count(*)::int from public.hospitals),
  1,
  'tenant A sees exactly one hospital'
);

select is(
  (select id from public.hospitals),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'tenant A sees only its own hospital'
);

select is(
  (select count(*)::int from public.hospital_settings),
  1,
  'tenant A sees exactly one settings row'
);

select is(
  (select hospital_id from public.hospital_settings),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'tenant A sees only its own settings'
);

select is(
  (select count(*)::int from public.profiles),
  1,
  'tenant A sees only the caller profile'
);

select throws_ok(
  'select * from public.hospital_counters limit 1',
  '42501',
  null,
  'tenant A cannot read hospital_counters'
);

select throws_ok(
  $$insert into public.hospitals (code, name, country) values ('evil', 'Evil', 'EG')$$,
  '42501',
  null,
  'tenant A cannot create a hospital'
);

select throws_ok(
  $$insert into public.profiles (user_id, hospital_id, username, full_name)
    values ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'evil', 'Evil')$$,
  '42501',
  null,
  'tenant A cannot create profiles'
);

select throws_ok(
  $$update public.profiles set hospital_id = null
    where user_id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'tenant A cannot detach its profile from the hospital'
);

update public.hospital_settings
set tax_rate = 99
where hospital_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

reset role;

select is(
  (select tax_rate from public.hospital_settings where hospital_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0::numeric,
  'tenant A cannot update another hospital settings'
);

-- ---------------------------------------------------------------------------
-- Automatic cross-tenant visibility sweep for every hospital_id table
-- ---------------------------------------------------------------------------

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{"hospital_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"hospital_admin","permissions":["patients:read","settings:update","users:read"]}}';

create temp table tenant_leaks (table_name text, visible_rows bigint);

do $$
declare
  rel record;
  leaked bigint;
begin
  for rel in
    select c.table_name
    from information_schema.columns c
    join pg_class pc on pc.relname = c.table_name
    join pg_namespace pn on pn.oid = pc.relnamespace and pn.nspname = 'public'
    where c.table_schema = 'public'
      and c.column_name = 'hospital_id'
      and c.table_name <> 'profiles'
      and pc.relkind in ('r', 'p')
  loop
    execute format(
      'select count(*) from public.%I where hospital_id = %L',
      rel.table_name,
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    )
    into leaked;
    if leaked > 0 then
      insert into tenant_leaks values (rel.table_name, leaked);
    end if;
  end loop;
end;
$$;

select is_empty('select * from tenant_leaks', 'no hospital_id table leaks another tenant rows');

-- ---------------------------------------------------------------------------
-- Super admin and anon boundaries
-- ---------------------------------------------------------------------------

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated","app_metadata":{"hospital_id":"","role":"super_admin","permissions":["hospitals:read","hospitals:manage","audit:read"]}}';

select is(
  (select count(*)::int from public.hospitals),
  2,
  'super admin sees every hospital'
);

reset role;

set local role anon;
set local "request.jwt.claims" = '{}';

select is(
  (select count(*)::int from public.hospitals),
  0,
  'anon sees no hospitals'
);

select throws_ok(
  $$insert into public.hospitals (code, name, country) values ('anon', 'Anon', 'EG')$$,
  '42501',
  null,
  'anon cannot create a hospital'
);

reset role;

select * from finish();
rollback;
