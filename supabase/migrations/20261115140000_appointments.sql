-- Appointments: tenant-scoped scheduling with state machine, optimistic
-- concurrency and audit. Status transitions enforced in service layer and
-- via CHECK constraint on allowed values.

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  patient_id uuid not null references public.patients (id),
  provider_id uuid not null references public.profiles (user_id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  type text not null check (type in ('new', 'follow-up', 'emergency')),
  status text not null check (status in ('scheduled', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show')),
  reason text not null,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint appointments_ends_after_starts check (ends_at > starts_at),
  constraint appointments_reason_not_blank check (btrim(reason) <> '')
);

create unique index appointments_id_hospital_key on public.appointments (id, hospital_id);
create index appointments_hospital_starts_idx
  on public.appointments (hospital_id, starts_at desc)
  where deleted_at is null;
create index appointments_hospital_patient_idx
  on public.appointments (hospital_id, patient_id, starts_at desc)
  where deleted_at is null;
create index appointments_hospital_provider_idx
  on public.appointments (hospital_id, provider_id, starts_at desc)
  where deleted_at is null;
create index appointments_hospital_status_idx
  on public.appointments (hospital_id, status, starts_at desc)
  where deleted_at is null;

create or replace function private.prepare_appointment_row()
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
    new.provider_id := old.provider_id;
    new.starts_at := old.starts_at;
    new.ends_at := old.ends_at;
    new.type := old.type;
    new.reason := old.reason;
    new.notes := old.notes;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger appointments_prepare
before insert or update on public.appointments
for each row execute function private.prepare_appointment_row();

create trigger appointments_audit
after insert or update or delete on public.appointments
for each row execute function private.write_audit_event();

alter table public.appointments enable row level security;

create policy appointments_select on public.appointments
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('appointments:read'))
  and deleted_at is null
);

create policy appointments_insert on public.appointments
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('appointments:create'))
);

create policy appointments_update on public.appointments
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('appointments:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('appointments:update'))
  and deleted_at is null
);

revoke all on public.appointments from authenticated, anon;
grant select on public.appointments to authenticated;
grant insert (
  hospital_id, patient_id, provider_id, starts_at, ends_at, type, status, reason, notes
) on public.appointments to authenticated;
grant update (
  status, notes
) on public.appointments to authenticated;

create or replace function public.create_appointment(
  p_patient_id uuid,
  p_provider_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_type text,
  p_reason text,
  p_notes text default null
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_hospital uuid := private.current_hospital_id();
  created_appointment public.appointments;
begin
  if target_hospital is null or not (select private.has_permission('appointments:create')) then
    raise exception 'not_authorized';
  end if;

  if not exists (
    select 1 from public.patients p
    where p.id = p_patient_id
      and p.hospital_id = target_hospital
      and p.deleted_at is null
  ) then
    raise exception 'invalid_patient';
  end if;

  if not exists (
    select 1 from public.profiles pr
    where pr.user_id = p_provider_id
      and pr.hospital_id = target_hospital
      and pr.is_active
  ) then
    raise exception 'invalid_provider';
  end if;

  insert into public.appointments (
    hospital_id, patient_id, provider_id, starts_at, ends_at, type, status, reason, notes,
    created_by, updated_by
  )
  values (
    target_hospital, p_patient_id, p_provider_id, p_starts_at, p_ends_at, p_type,
    'scheduled', p_reason, p_notes, auth.uid(), auth.uid()
  )
  returning * into created_appointment;

  return created_appointment;
end;
$$;

revoke execute on function public.create_appointment(uuid, uuid, timestamptz, timestamptz, text, text, text) from public, anon;
grant execute on function public.create_appointment(uuid, uuid, timestamptz, timestamptz, text, text, text) to authenticated;

create or replace function public.list_appointments(
  p_query text default null,
  p_limit integer default 25,
  p_offset integer default 0,
  p_status text default null,
  p_provider_id uuid default null
)
returns table (
  id uuid,
  patient_id uuid,
  patient_name text,
  patient_mrn text,
  provider_id uuid,
  provider_name text,
  starts_at timestamptz,
  ends_at timestamptz,
  type text,
  status text,
  reason text,
  created_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with filtered as (
    select a.*, p.full_name as patient_name, p.mrn as patient_mrn,
           pr.full_name as provider_name,
           count(*) over () as total_count
    from public.appointments a
    join public.patients p on p.id = a.patient_id
    join public.profiles pr on pr.user_id = a.provider_id
    where a.hospital_id = (select private.current_hospital_id())
      and (select private.has_permission('appointments:read'))
      and a.deleted_at is null
      and (
        p_query is null
        or btrim(p_query) = ''
        or p.full_name ilike '%' || btrim(p_query) || '%'
        or p.mrn ilike btrim(p_query) || '%'
        or a.reason ilike '%' || btrim(p_query) || '%'
      )
      and (p_status is null or a.status = p_status)
      and (p_provider_id is null or a.provider_id = p_provider_id)
  )
  select
    f.id, f.patient_id, f.patient_name, f.patient_mrn,
    f.provider_id, f.provider_name, f.starts_at, f.ends_at, f.type, f.status,
    f.reason, f.created_at, f.total_count
  from filtered f
  order by f.starts_at asc
  limit least(greatest(coalesce(p_limit, 25), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke execute on function public.list_appointments(text, integer, integer, text, uuid) from public, anon;
grant execute on function public.list_appointments(text, integer, integer, text, uuid) to authenticated;
