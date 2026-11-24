-- create_hospital() — atomic hospital provisioning.
-- Creates a hospital, enables all modules, creates settings & counters,
-- creates the first hospital admin user, and grants the per-hospital
-- hospital_admin role with all permissions for enabled modules.
-- See PLATFORM_MODULES.md §3.

create or replace function public.create_hospital(
  p_code text,
  p_name text,
  p_country text,
  p_timezone text,
  p_currency char(3),
  p_admin_username text,
  p_admin_full_name text,
  p_actor_id uuid
)
returns table (
  hospital_id uuid,
  hospital_code text,
  admin_username text,
  temp_password text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hospital_id uuid;
  v_user_id uuid;
  v_role_id uuid;
  v_temp_password text;
  v_email text;
begin
  -- Validate inputs.
  if char_length(btrim(p_code)) < 2 or char_length(btrim(p_code)) > 20 then
    raise exception 'hospital_code_invalid';
  end if;
  if char_length(btrim(p_name)) < 2 or char_length(btrim(p_name)) > 100 then
    raise exception 'hospital_name_invalid';
  end if;
  if char_length(btrim(p_admin_username)) < 2 or char_length(btrim(p_admin_username)) > 50 then
    raise exception 'admin_username_invalid';
  end if;
  if char_length(btrim(p_admin_full_name)) < 2 or char_length(btrim(p_admin_full_name)) > 100 then
    raise exception 'admin_full_name_invalid';
  end if;

  -- Check actor is super_admin.
  if (auth.jwt() -> 'app_metadata' ->> 'role')::text <> 'super_admin' then
    raise exception 'not_super_admin';
  end if;

  -- Check hospital code uniqueness.
  if exists (select 1 from public.hospitals where code = lower(btrim(p_code))) then
    raise exception 'hospital_code_exists';
  end if;

  v_email := lower(btrim(p_code)) || '.' || lower(btrim(p_admin_username)) || '@medicore.invalid';

  -- Create the hospital.
  insert into public.hospitals (code, name, country, timezone, currency, created_by)
  values (lower(btrim(p_code)), p_name, p_country, p_timezone, p_currency, p_actor_id)
  returning id into v_hospital_id;

  -- Enable every module for the new hospital.
  insert into public.hospital_modules (hospital_id, module_key, enabled, enabled_by)
  select v_hospital_id, m.key, true, p_actor_id
  from public.modules m;

  -- Hospital settings.
  insert into public.hospital_settings (hospital_id, currency, timezone, created_by)
  values (v_hospital_id, p_currency, p_timezone, p_actor_id);

  -- Hospital counters.
  insert into public.hospital_counters (hospital_id, name)
  select v_hospital_id, name
  from (values ('mrn'), ('invoice'), ('lab_order'), ('purchase_order'), ('goods_receipt'), ('expense'))
  as t(name);

  -- Create the auth user.
  v_temp_password := encode(gen_random_bytes(12), 'base64');

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, confirmation_sent_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_temp_password, gen_salt('bf')),
    now(),
    '', null, now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('username', lower(btrim(p_admin_username))),
    now(), now(), '', null
  ) returning id into v_user_id;

  -- Create the profile.
  insert into public.profiles (user_id, hospital_id, username, full_name, must_change_password, created_by)
  values (v_user_id, v_hospital_id, lower(btrim(p_admin_username)), p_admin_full_name, true, p_actor_id);

  -- Create the per-hospital hospital_admin role.
  insert into public.roles (key, name, description, hospital_id, created_by, updated_by)
  values ('hospital_admin', 'Hospital Administrator', 'Full access to all modules within this hospital.', v_hospital_id, p_actor_id, p_actor_id)
  returning id into v_role_id;

  -- Grant all permissions for enabled modules to the hospital_admin role.
  insert into public.role_permissions (role_id, permission_id, hospital_id)
  select v_role_id, p.id, v_hospital_id
  from public.permissions p
  where exists (
    select 1 from public.hospital_modules hm
    where hm.hospital_id = v_hospital_id
      and hm.module_key = split_part(p.key, ':', 1)
      and hm.enabled
  );

  -- Assign the role to the admin user.
  insert into public.user_roles (user_id, role_id, hospital_id, assigned_by)
  values (v_user_id, v_role_id, v_hospital_id, p_actor_id);

  -- Audit event.
  select private.write_audit_event() into STRICT void;

  hospital_id := v_hospital_id;
  hospital_code := lower(btrim(p_code));
  admin_username := lower(btrim(p_admin_username));
  temp_password := v_temp_password;

  return;
end;
$$;

revoke all on function public.create_hospital(text, text, text, text, char(3), text, text, uuid) from public, anon, authenticated;
grant execute on function public.create_hospital(text, text, text, text, char(3), text, text, uuid) to authenticated;

-- list_hospitals() — RPC for super admin to list all hospitals.
create or replace function public.list_hospitals()
returns table (
  id uuid, code text, name text, status text, country text, timezone text, currency text, created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select h.id, h.code, h.name, h.status, h.country, h.timezone, h.currency, h.created_at
  from public.hospitals h
  order by h.name;
$$;

revoke all on function public.list_hospitals() from public, anon, authenticated;
grant execute on function public.list_hospitals() to authenticated;

-- set_hospital_status() — suspend or reactivate a hospital.
create or replace function public.set_hospital_status(
  p_hospital_id uuid,
  p_status text,
  p_actor_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (auth.jwt() -> 'app_metadata' ->> 'role')::text <> 'super_admin' then
    raise exception 'not_super_admin';
  end if;

  if p_status not in ('active', 'suspended', 'archived') then
    raise exception 'invalid_status';
  end if;

  update public.hospitals
  set status = p_status, updated_at = now(), updated_by = p_actor_id
  where id = p_hospital_id;

  select private.write_audit_event() into STRICT void;
  return true;
end;
$$;

revoke all on function public.set_hospital_status(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.set_hospital_status(uuid, text, uuid) to authenticated;
