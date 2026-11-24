-- Lab workflow fixes:
-- 1. list_lab_orders/list_lab_providers give the SPA tenant-scoped read models
--    without depending on users:read or appointments:read.
-- 2. create_lab_order atomically allocates the order number (hospital_counters
--    is not writable by authenticated users) and inserts the requested tests.
-- 3. verify_lab_result updated lab_results.verified, a column that does not
--    exist. Verification belongs on lab_order_items; fix the function.
-- 4. Sync the latest lab result onto its order item so the order and result
--    screens agree, and complete the order when every test has a result.

create or replace function public.list_lab_orders(p_limit integer default 200)
returns table (
  id uuid,
  patient_id uuid,
  provider_id uuid,
  order_no text,
  status text,
  priority text,
  ordered_at timestamptz,
  collected_at timestamptz,
  completed_at timestamptz,
  version integer,
  patient_name text,
  patient_mrn text,
  provider_name text
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    o.id,
    o.patient_id,
    o.provider_id,
    o.order_no,
    o.status,
    o.priority,
    o.ordered_at,
    o.collected_at,
    o.completed_at,
    o.version,
    p.full_name,
    p.mrn,
    coalesce(pr.full_name, 'Unknown provider')
  from public.lab_orders o
  join public.patients p
    on p.id = o.patient_id
   and p.hospital_id = o.hospital_id
  left join public.profiles pr
    on pr.user_id = o.provider_id
   and pr.hospital_id = o.hospital_id
  where o.hospital_id = private.current_hospital_id()
    and o.deleted_at is null
    and (select private.has_permission('lab:read'))
  order by o.ordered_at desc
  limit greatest(1, least(coalesce(p_limit, 200), 500));
$$;

revoke execute on function public.list_lab_orders(integer) from public, anon;
grant execute on function public.list_lab_orders(integer) to authenticated;

create or replace function public.list_lab_providers()
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
    and (select private.has_permission('lab:read'))
  order by p.full_name;
$$;

revoke execute on function public.list_lab_providers() from public, anon;
grant execute on function public.list_lab_providers() to authenticated;

create or replace function public.create_lab_order(
  p_patient_id uuid,
  p_provider_id uuid,
  p_priority text,
  p_notes text default null,
  p_tests text[] default '{}',
  p_visit_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_hospital uuid := private.current_hospital_id();
  next_value bigint;
  new_order_id uuid;
  new_order_no text;
  test_name text;
begin
  if target_hospital is null or not (select private.has_permission('lab:create')) then
    raise exception 'not_authorized';
  end if;

  if p_priority not in ('routine', 'urgent', 'stat') then
    raise exception 'invalid_priority';
  end if;

  if not exists (
    select 1
    from public.patients
    where id = p_patient_id
      and hospital_id = target_hospital
      and deleted_at is null
  ) then
    raise exception 'invalid_patient';
  end if;

  if not exists (
    select 1
    from public.profiles p
    join public.user_roles ur on ur.user_id = p.user_id
    join public.roles r on r.id = ur.role_id
    where p.user_id = p_provider_id
      and p.hospital_id = target_hospital
      and p.is_active
      and r.key in ('doctor', 'nurse')
  ) then
    raise exception 'invalid_provider';
  end if;

  insert into public.hospital_counters (hospital_id, name, next_value)
  values (target_hospital, 'lab_order', 2)
  on conflict (hospital_id, name)
  do update set next_value = public.hospital_counters.next_value + 1
  returning next_value - 1 into next_value;

  new_order_no := 'LAB-' || left(target_hospital::text, 8) || '-' || lpad(next_value::text, 6, '0');

  insert into public.lab_orders (
    hospital_id,
    patient_id,
    visit_id,
    provider_id,
    order_no,
    status,
    priority,
    notes
  ) values (
    target_hospital,
    p_patient_id,
    p_visit_id,
    p_provider_id,
    new_order_no,
    'ordered',
    p_priority,
    p_notes
  )
  returning id into new_order_id;

  foreach test_name in array coalesce(p_tests, '{}'::text[]) loop
    test_name := btrim(test_name);
    if test_name <> '' then
      insert into public.lab_order_items (hospital_id, lab_order_id, test_name, status)
      values (target_hospital, new_order_id, test_name, 'pending');
    end if;
  end loop;

  return new_order_id;
end;
$$;

revoke execute on function public.create_lab_order(uuid, uuid, text, text, text[], uuid) from public, anon;
grant execute on function public.create_lab_order(uuid, uuid, text, text, text[], uuid) to authenticated;

create or replace function private.sync_lab_result_to_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.lab_order_items
  set result_value = new.result_value,
      result_unit = new.result_unit,
      reference_range = new.reference_range,
      is_abnormal = new.is_abnormal,
      status = case when status = 'cancelled' then status else 'completed' end,
      verified = false,
      verified_by = null,
      verified_at = null,
      entered_at = coalesce(new.entered_at, now()),
      entered_by = new.entered_by
  where id = new.lab_order_item_id
    and hospital_id = new.hospital_id;

  update public.lab_orders o
  set status = 'completed',
      completed_at = coalesce(o.completed_at, now())
  where o.id = (
      select lab_order_id
      from public.lab_order_items
      where id = new.lab_order_item_id
        and hospital_id = new.hospital_id
    )
    and o.hospital_id = new.hospital_id
    and o.status not in ('completed', 'cancelled')
    and not exists (
      select 1
      from public.lab_order_items i
      where i.lab_order_id = o.id
        and i.hospital_id = o.hospital_id
        and i.status <> 'cancelled'
        and i.result_value is null
    );

  return new;
end;
$$;

drop trigger if exists lab_results_sync_item on public.lab_results;
create trigger lab_results_sync_item
after insert on public.lab_results
for each row execute function private.sync_lab_result_to_item();

-- The order item trigger also reset reference_range on update, so the sync
-- trigger could never copy the range entered with the result. Reference ranges
-- are editable; keep the identity fields protected.
create or replace function private.prepare_lab_order_item_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  else
    new.hospital_id := old.hospital_id;
    new.lab_order_id := old.lab_order_id;
    new.test_name := old.test_name;
    new.test_code := old.test_code;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.verify_lab_result(
  p_result_id uuid,
  p_verified boolean default true
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_hospital uuid := private.current_hospital_id();
  target_item uuid;
begin
  if target_hospital is null or not (select private.has_permission('lab:verify')) then
    raise exception 'not_authorized';
  end if;

  select r.lab_order_item_id
  into target_item
  from public.lab_results r
  where r.id = p_result_id
    and r.hospital_id = target_hospital
    and r.deleted_at is null;

  if target_item is null then
    return false;
  end if;

  update public.lab_order_items
  set verified = p_verified,
      verified_by = auth.uid(),
      verified_at = now(),
      status = case when p_verified then 'completed' else status end
  where id = target_item
    and hospital_id = target_hospital
    and (p_verified is false or verified is not true);

  return found;
end;
$$;

revoke execute on function public.verify_lab_result(uuid, boolean) from public, anon;
grant execute on function public.verify_lab_result(uuid, boolean) to authenticated;

-- Notes are editable on a lab order; the original trigger silently discarded
-- them on update. Keep the other immutable fields protected.
create or replace function private.prepare_lab_order_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  else
    new.hospital_id := old.hospital_id;
    new.patient_id := old.patient_id;
    new.visit_id := old.visit_id;
    new.provider_id := old.provider_id;
    new.order_no := old.order_no;
    new.ordered_at := old.ordered_at;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
