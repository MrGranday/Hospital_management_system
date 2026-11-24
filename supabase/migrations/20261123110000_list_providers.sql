-- Provider directory for appointment scheduling.
-- The profiles RLS policy requires users:read, but receptionists and other
-- schedulers need to pick a provider without being granted access to user
-- administration. This SECURITY DEFINER function exposes only the active
-- doctor/nurse profiles of the caller's hospital and still checks the
-- appointments:read permission and tenant scope.

create or replace function public.list_providers()
returns table (user_id uuid, full_name text)
language sql
security definer
set search_path = public, pg_temp
as $$
  select distinct p.user_id, p.full_name
  from public.profiles p
  join public.user_roles ur on ur.user_id = p.user_id
  join public.roles r on r.id = ur.role_id
  where p.hospital_id = private.current_hospital_id()
    and p.is_active
    and r.key in ('doctor', 'nurse')
    and private.has_permission('appointments:read')
  order by p.full_name;
$$;

revoke execute on function public.list_providers() from public, anon;
grant execute on function public.list_providers() to authenticated;
