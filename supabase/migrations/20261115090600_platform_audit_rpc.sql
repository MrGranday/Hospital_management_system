-- PostgREST only exposes the public schema, so the platform audit log is read
-- through a security-definer function that re-checks the super admin claims.

create or replace function public.list_platform_audit_events(p_limit integer default 100)
returns table (
  id bigint,
  occurred_at timestamptz,
  hospital_id uuid,
  actor_role text,
  action text,
  table_name text,
  record_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.occurred_at, e.hospital_id, e.actor_role, e.action, e.table_name, e.record_id
  from audit.events e
  where (select private.is_super_admin())
    and (select private.has_permission('audit:read'))
    and e.table_name in ('public.hospitals', 'public.profiles', 'public.user_roles')
  order by e.occurred_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
$$;

revoke execute on function public.list_platform_audit_events(integer) from public, anon;
grant execute on function public.list_platform_audit_events(integer) to authenticated;
