-- Audit trail: append-only, partitioned by month, written by a generic
-- security-definer trigger on sensitive tables.

create table audit.events (
  id bigint generated always as identity,
  occurred_at timestamptz not null default now(),
  hospital_id uuid references public.hospitals (id),
  actor_id uuid,
  actor_role text,
  action text not null,
  table_name text not null,
  record_id uuid,
  before jsonb,
  after jsonb,
  request_id text,
  ip inet,
  reason text,
  primary key (occurred_at, id)
) partition by range (occurred_at);

create table audit.events_default partition of audit.events default;

create index audit_events_hospital_time_idx
  on audit.events (hospital_id, occurred_at desc);
create index audit_events_table_record_idx
  on audit.events (table_name, record_id, occurred_at desc);

create or replace function private.write_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_role text := auth.jwt() -> 'app_metadata' ->> 'role';
  before_row jsonb;
  after_row jsonb;
  resource_hospital uuid;
  resource_id uuid;
begin
  if tg_op <> 'INSERT' then
    before_row := to_jsonb(old);
  end if;
  if tg_op <> 'DELETE' then
    after_row := to_jsonb(new);
  end if;

  if tg_table_name = 'hospitals' then
    resource_hospital := coalesce((after_row ->> 'id')::uuid, (before_row ->> 'id')::uuid);
  else
    resource_hospital := coalesce(
      (after_row ->> 'hospital_id')::uuid,
      (before_row ->> 'hospital_id')::uuid
    );
  end if;

  resource_id := coalesce(
    (after_row ->> 'id')::uuid,
    (after_row ->> 'user_id')::uuid,
    (before_row ->> 'id')::uuid,
    (before_row ->> 'user_id')::uuid
  );

  insert into audit.events (
    hospital_id, actor_id, actor_role, action, table_name, record_id, before, after
  ) values (
    resource_hospital, actor, actor_role, tg_op, tg_table_schema || '.' || tg_table_name,
    resource_id, before_row, after_row
  );

  return coalesce(new, old);
end;
$$;

revoke execute on function private.write_audit_event() from public, anon, authenticated;

create trigger hospitals_audit
after insert or update or delete on public.hospitals
for each row execute function private.write_audit_event();

create trigger profiles_audit
after insert or update or delete on public.profiles
for each row execute function private.write_audit_event();

create trigger hospital_settings_audit
after insert or update on public.hospital_settings
for each row execute function private.write_audit_event();

create trigger user_roles_audit
after insert or delete on public.user_roles
for each row execute function private.write_audit_event();

alter table audit.events enable row level security;

create policy audit_events_select on audit.events
for select to authenticated
using (
  (
    hospital_id = (select private.current_hospital_id())
    and (select private.has_permission('audit:read'))
  )
  or (
    (select private.is_super_admin())
    and hospital_id is null
  )
);

revoke insert, update, delete on audit.events from authenticated, anon;
grant select on audit.events to authenticated;
