-- Update the custom access-token hook to include modules[], acting_hospital_id,
-- support_session_id, and auth_version claims. Supports per-hospital modules
-- and support sessions (PLATFORM_MODULES.md §7, §12).

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
  mods text[];
  role_key text;
  acting_hospital uuid;
  support_session_id uuid;
  auth_version integer;
  requesting_user uuid := (event ->> 'user_id')::uuid;
begin
  select p.hospital_id, p.is_active, p.must_change_password, h.status as hospital_status,
         p.full_name, p.username, p.role_id
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
    and (r.hospital_id is null or r.hospital_id = profile.hospital_id)
  order by (r.key = 'hospital_admin') desc, r.key
  limit 1;

  select coalesce(array_agg(distinct perm.key), '{}')
    into perms
  from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions perm on perm.id = rp.permission_id
  where ur.user_id = requesting_user;

  -- Enabled modules for the caller's hospital (or acting hospital in a session).
  select coalesce(array_agg(distinct hm.module_key), '{}')
    into mods
  from public.hospital_modules hm
  where hm.enabled
    and hm.hospital_id = coalesce(
      (auth.jwt() -> 'app_metadata' ->> 'acting_hospital_id')::uuid,
      profile.hospital_id
    );

  -- Support session for super admin acting into a hospital.
  select s.id
    into support_session_id
  from public.support_sessions s
  where s.super_admin_id = requesting_user
    and s.status = 'active'
    and s.expires_at > now()
    and s.hospital_id = coalesce(
      (auth.jwt() -> 'app_metadata' ->> 'acting_hospital_id')::uuid,
      profile.hospital_id
    )
  order by s.expires_at desc
  limit 1;

  if support_session_id is not null then
    acting_hospital := (
      select s.hospital_id
      from public.support_sessions s
      where s.id = support_session_id
    );
  else
    acting_hospital := profile.hospital_id;
  end if;

  select coalesce(h.auth_version, 0)
    into auth_version
  from public.hospitals h
  where h.id = coalesce(acting_hospital, profile.hospital_id);

  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(
    claims,
    '{app_metadata}',
    coalesce(claims -> 'app_metadata', '{}'::jsonb) || jsonb_build_object(
      'hospital_id', coalesce(profile.hospital_id::text, ''),
      'role', coalesce(role_key, ''),
      'permissions', to_jsonb(perms),
      'modules', to_jsonb(mods),
      'must_change_password', profile.must_change_password,
      'acting_hospital_id', coalesce(acting_hospital::text, ''),
      'support_session_id', coalesce(support_session_id::text, ''),
      'auth_version', auth_version
    )
  );

  return jsonb_set(event, '{claims}', claims);
end;
$$;

revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant select on public.profiles, public.hospitals, public.roles, public.user_roles,
  public.role_permissions, public.permissions, public.hospital_modules,
  public.support_sessions to supabase_auth_admin;
