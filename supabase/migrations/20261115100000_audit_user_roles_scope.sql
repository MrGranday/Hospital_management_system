-- user_roles has no hospital_id, so the generic audit trigger filed role
-- assignments with a null hospital and hospital administrators could not see
-- them. Resolve the hospital through the staff member's profile instead.

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
  elsif tg_table_name = 'user_roles' then
    resource_hospital := (
      select p.hospital_id
      from public.profiles p
      where p.user_id = coalesce(
        (after_row ->> 'user_id')::uuid,
        (before_row ->> 'user_id')::uuid
      )
    );
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
