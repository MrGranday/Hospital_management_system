-- RBAC: global system roles, atomic permissions, assignments and the
-- Supabase custom access token hook that puts tenancy + permissions in the JWT.

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  module text not null,
  action text not null,
  description text,
  created_at timestamptz not null default now(),
  constraint permissions_key_format check (key ~ '^[a-z_]+:[a-z_]+$')
);

create index permissions_module_idx on public.permissions (module);

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users (id),
  primary key (user_id, role_id)
);

create index user_roles_role_idx on public.user_roles (role_id);

insert into public.roles (key, name) values
  ('super_admin', 'Super Administrator'),
  ('hospital_admin', 'Hospital Administrator'),
  ('doctor', 'Doctor'),
  ('nurse', 'Nurse'),
  ('receptionist', 'Receptionist'),
  ('cashier', 'Cashier'),
  ('pharmacist', 'Pharmacist'),
  ('lab_technician', 'Laboratory Technician'),
  ('radiology_technician', 'Radiology Technician'),
  ('inventory_manager', 'Inventory Manager'),
  ('accountant', 'Accountant'),
  ('hr_manager', 'HR Manager'),
  ('auditor', 'Auditor');

insert into public.permissions (key, module, action) values
  ('hospitals:read', 'hospitals', 'read'),
  ('hospitals:manage', 'hospitals', 'manage'),
  ('users:read', 'users', 'read'),
  ('users:create', 'users', 'create'),
  ('users:update', 'users', 'update'),
  ('users:manage', 'users', 'manage'),
  ('roles:read', 'roles', 'read'),
  ('patients:read', 'patients', 'read'),
  ('patients:create', 'patients', 'create'),
  ('patients:update', 'patients', 'update'),
  ('patients:archive', 'patients', 'archive'),
  ('patients:export', 'patients', 'export'),
  ('patients:print', 'patients', 'print'),
  ('appointments:read', 'appointments', 'read'),
  ('appointments:create', 'appointments', 'create'),
  ('appointments:update', 'appointments', 'update'),
  ('visits:read', 'visits', 'read'),
  ('visits:create', 'visits', 'create'),
  ('visits:update', 'visits', 'update'),
  ('emr:read', 'emr', 'read'),
  ('emr:create', 'emr', 'create'),
  ('emr:update', 'emr', 'update'),
  ('emr:print', 'emr', 'print'),
  ('prescriptions:read', 'prescriptions', 'read'),
  ('prescriptions:create', 'prescriptions', 'create'),
  ('prescriptions:update', 'prescriptions', 'update'),
  ('lab:read', 'lab', 'read'),
  ('lab:create', 'lab', 'create'),
  ('lab:update', 'lab', 'update'),
  ('lab:print', 'lab', 'print'),
  ('imaging:read', 'imaging', 'read'),
  ('imaging:create', 'imaging', 'create'),
  ('imaging:update', 'imaging', 'update'),
  ('imaging:print', 'imaging', 'print'),
  ('billing:read', 'billing', 'read'),
  ('billing:create', 'billing', 'create'),
  ('billing:update', 'billing', 'update'),
  ('billing:approve', 'billing', 'approve'),
  ('billing:void', 'billing', 'void'),
  ('billing:export', 'billing', 'export'),
  ('billing:print', 'billing', 'print'),
  ('inventory:read', 'inventory', 'read'),
  ('inventory:create', 'inventory', 'create'),
  ('inventory:update', 'inventory', 'update'),
  ('inventory:adjust', 'inventory', 'adjust'),
  ('stock:adjust', 'stock', 'adjust'),
  ('purchases:read', 'purchases', 'read'),
  ('purchases:create', 'purchases', 'create'),
  ('purchases:approve', 'purchases', 'approve'),
  ('purchases:print', 'purchases', 'print'),
  ('suppliers:read', 'suppliers', 'read'),
  ('suppliers:create', 'suppliers', 'create'),
  ('suppliers:update', 'suppliers', 'update'),
  ('finance:read', 'finance', 'read'),
  ('finance:create', 'finance', 'create'),
  ('finance:update', 'finance', 'update'),
  ('finance:export', 'finance', 'export'),
  ('hr:read', 'hr', 'read'),
  ('hr:create', 'hr', 'create'),
  ('hr:update', 'hr', 'update'),
  ('hr:approve', 'hr', 'approve'),
  ('hr:manage', 'hr', 'manage'),
  ('reports:read', 'reports', 'read'),
  ('reports:export', 'reports', 'export'),
  ('reports:print', 'reports', 'print'),
  ('audit:read', 'audit', 'read'),
  ('audit:export', 'audit', 'export'),
  ('settings:read', 'settings', 'read'),
  ('settings:update', 'settings', 'update');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from (values
  ('super_admin', 'hospitals:read'),
  ('super_admin', 'hospitals:manage'),
  ('super_admin', 'audit:read'),

  ('hospital_admin', 'users:read'),
  ('hospital_admin', 'users:create'),
  ('hospital_admin', 'users:update'),
  ('hospital_admin', 'users:manage'),
  ('hospital_admin', 'roles:read'),
  ('hospital_admin', 'patients:read'),
  ('hospital_admin', 'appointments:read'),
  ('hospital_admin', 'visits:read'),
  ('hospital_admin', 'lab:read'),
  ('hospital_admin', 'billing:read'),
  ('hospital_admin', 'billing:approve'),
  ('hospital_admin', 'inventory:read'),
  ('hospital_admin', 'purchases:read'),
  ('hospital_admin', 'purchases:approve'),
  ('hospital_admin', 'finance:read'),
  ('hospital_admin', 'hr:read'),
  ('hospital_admin', 'reports:read'),
  ('hospital_admin', 'reports:export'),
  ('hospital_admin', 'reports:print'),
  ('hospital_admin', 'audit:read'),
  ('hospital_admin', 'settings:read'),
  ('hospital_admin', 'settings:update'),

  ('doctor', 'patients:read'),
  ('doctor', 'patients:update'),
  ('doctor', 'appointments:read'),
  ('doctor', 'appointments:create'),
  ('doctor', 'appointments:update'),
  ('doctor', 'visits:read'),
  ('doctor', 'visits:create'),
  ('doctor', 'visits:update'),
  ('doctor', 'emr:read'),
  ('doctor', 'emr:create'),
  ('doctor', 'emr:update'),
  ('doctor', 'emr:print'),
  ('doctor', 'prescriptions:read'),
  ('doctor', 'prescriptions:create'),
  ('doctor', 'prescriptions:update'),
  ('doctor', 'lab:read'),
  ('doctor', 'lab:create'),
  ('doctor', 'imaging:read'),
  ('doctor', 'imaging:create'),
  ('doctor', 'reports:read'),

  ('nurse', 'patients:read'),
  ('nurse', 'appointments:read'),
  ('nurse', 'visits:read'),
  ('nurse', 'visits:update'),
  ('nurse', 'emr:read'),
  ('nurse', 'emr:create'),
  ('nurse', 'emr:update'),
  ('nurse', 'prescriptions:read'),
  ('nurse', 'lab:read'),
  ('nurse', 'imaging:read'),
  ('nurse', 'inventory:read'),

  ('receptionist', 'patients:read'),
  ('receptionist', 'patients:create'),
  ('receptionist', 'patients:update'),
  ('receptionist', 'appointments:read'),
  ('receptionist', 'appointments:create'),
  ('receptionist', 'appointments:update'),
  ('receptionist', 'visits:read'),
  ('receptionist', 'visits:create'),
  ('receptionist', 'billing:read'),
  ('receptionist', 'billing:create'),
  ('receptionist', 'reports:read'),

  ('cashier', 'patients:read'),
  ('cashier', 'appointments:read'),
  ('cashier', 'billing:read'),
  ('cashier', 'billing:create'),
  ('cashier', 'billing:update'),
  ('cashier', 'billing:print'),
  ('cashier', 'reports:read'),
  ('cashier', 'reports:print'),

  ('pharmacist', 'patients:read'),
  ('pharmacist', 'prescriptions:read'),
  ('pharmacist', 'prescriptions:update'),
  ('pharmacist', 'inventory:read'),
  ('pharmacist', 'inventory:update'),
  ('pharmacist', 'stock:adjust'),
  ('pharmacist', 'billing:read'),
  ('pharmacist', 'billing:create'),
  ('pharmacist', 'billing:print'),
  ('pharmacist', 'reports:read'),

  ('lab_technician', 'patients:read'),
  ('lab_technician', 'lab:read'),
  ('lab_technician', 'lab:create'),
  ('lab_technician', 'lab:update'),
  ('lab_technician', 'lab:print'),
  ('lab_technician', 'reports:read'),

  ('radiology_technician', 'patients:read'),
  ('radiology_technician', 'imaging:read'),
  ('radiology_technician', 'imaging:create'),
  ('radiology_technician', 'imaging:update'),
  ('radiology_technician', 'imaging:print'),

  ('inventory_manager', 'inventory:read'),
  ('inventory_manager', 'inventory:create'),
  ('inventory_manager', 'inventory:update'),
  ('inventory_manager', 'inventory:adjust'),
  ('inventory_manager', 'stock:adjust'),
  ('inventory_manager', 'purchases:read'),
  ('inventory_manager', 'purchases:create'),
  ('inventory_manager', 'purchases:print'),
  ('inventory_manager', 'suppliers:read'),
  ('inventory_manager', 'suppliers:create'),
  ('inventory_manager', 'suppliers:update'),
  ('inventory_manager', 'reports:read'),

  ('accountant', 'billing:read'),
  ('accountant', 'billing:approve'),
  ('accountant', 'billing:export'),
  ('accountant', 'finance:read'),
  ('accountant', 'finance:create'),
  ('accountant', 'finance:update'),
  ('accountant', 'finance:export'),
  ('accountant', 'purchases:read'),
  ('accountant', 'purchases:approve'),
  ('accountant', 'reports:read'),
  ('accountant', 'reports:export'),
  ('accountant', 'reports:print'),

  ('hr_manager', 'hr:read'),
  ('hr_manager', 'hr:create'),
  ('hr_manager', 'hr:update'),
  ('hr_manager', 'hr:approve'),
  ('hr_manager', 'hr:manage'),
  ('hr_manager', 'reports:read'),

  ('auditor', 'audit:read'),
  ('auditor', 'audit:export'),
  ('auditor', 'patients:read'),
  ('auditor', 'appointments:read'),
  ('auditor', 'visits:read'),
  ('auditor', 'emr:read'),
  ('auditor', 'prescriptions:read'),
  ('auditor', 'lab:read'),
  ('auditor', 'imaging:read'),
  ('auditor', 'billing:read'),
  ('auditor', 'inventory:read'),
  ('auditor', 'purchases:read'),
  ('auditor', 'finance:read'),
  ('auditor', 'hr:read'),
  ('auditor', 'reports:read'),
  ('auditor', 'reports:export'),
  ('auditor', 'reports:print'),
  ('auditor', 'settings:read'),
  ('auditor', 'users:read')
) as grants(role_key, permission_key)
join public.roles r on r.key = grants.role_key
join public.permissions p on p.key = grants.permission_key;

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;

create policy roles_select on public.roles
for select to authenticated using (true);

create policy permissions_select on public.permissions
for select to authenticated using (true);

create policy role_permissions_select on public.role_permissions
for select to authenticated using (true);

create policy user_roles_select_self on public.user_roles
for select to authenticated
using (user_id = (select auth.uid()));

create policy user_roles_select_hospital on public.user_roles
for select to authenticated
using (
  (select private.has_permission('users:read'))
  and exists (
    select 1 from public.profiles p
    where p.user_id = user_roles.user_id
      and p.hospital_id = (select private.current_hospital_id())
  )
);

grant select on public.roles, public.permissions, public.role_permissions, public.user_roles to authenticated;

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  profile record;
  claims jsonb;
  perms text[];
  role_key text;
  requesting_user uuid := (event ->> 'user_id')::uuid;
begin
  select p.hospital_id, p.is_active, p.must_change_password, h.status as hospital_status
    into profile
  from public.profiles p
  left join public.hospitals h on h.id = p.hospital_id
  where p.user_id = requesting_user;

  if not found then
    raise exception 'profile_missing';
  end if;

  if not profile.is_active then
    raise exception 'account_disabled';
  end if;

  if profile.hospital_id is not null and profile.hospital_status <> 'active' then
    raise exception 'hospital_inactive';
  end if;

  select r.key
    into role_key
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = requesting_user
  order by (r.key = 'super_admin') desc, r.key
  limit 1;

  select coalesce(array_agg(distinct perm.key), '{}')
    into perms
  from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions perm on perm.id = rp.permission_id
  where ur.user_id = requesting_user;

  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(
    claims,
    '{app_metadata}',
    coalesce(claims -> 'app_metadata', '{}'::jsonb) || jsonb_build_object(
      'hospital_id', coalesce(profile.hospital_id::text, ''),
      'role', coalesce(role_key, ''),
      'permissions', to_jsonb(perms),
      'must_change_password', profile.must_change_password
    )
  );

  return jsonb_set(event, '{claims}', claims);
end;
$$;

revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant select on public.profiles, public.hospitals, public.roles, public.user_roles,
  public.role_permissions, public.permissions to supabase_auth_admin;
