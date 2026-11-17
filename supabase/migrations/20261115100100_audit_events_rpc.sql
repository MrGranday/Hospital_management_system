-- PostgREST only exposes the public schema, so hospital audit events are read
-- through a security-definer function that re-checks the caller's hospital and
-- the audit:read permission.

create or replace function public.list_hospital_audit_events(
  p_limit integer default 25,
  p_offset integer default 0,
  p_table text default null,
  p_action text default null
)
returns table (
  id bigint,
  occurred_at timestamptz,
  actor_id uuid,
  actor_role text,
  action text,
  table_name text,
  record_id uuid,
  before jsonb,
  after jsonb,
  reason text,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with filtered as (
    select e.*, count(*) over () as total_count
    from audit.events e
    where (select private.has_permission('audit:read'))
      and e.hospital_id = (select private.current_hospital_id())
      and (p_table is null or e.table_name = p_table)
      and (p_action is null or e.action = p_action)
  )
  select
    f.id, f.occurred_at, f.actor_id, f.actor_role, f.action, f.table_name,
    f.record_id, f.before, f.after, f.reason, f.total_count
  from filtered f
  order by f.occurred_at desc, f.id desc
  limit least(greatest(coalesce(p_limit, 25), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke execute on function public.list_hospital_audit_events(integer, integer, text, text)
  from public, anon;
grant execute on function public.list_hospital_audit_events(integer, integer, text, text)
  to authenticated;
