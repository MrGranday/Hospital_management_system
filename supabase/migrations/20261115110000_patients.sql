-- Patient registry foundation: tenant-scoped patients, MRN allocation,
-- soft delete (archive), optimistic concurrency and audit.

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  mrn text not null,
  full_name text not null,
  sex text not null default 'unknown' check (sex in ('male', 'female', 'other', 'unknown')),
  date_of_birth date,
  phone text,
  email text,
  address text,
  blood_group text check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  notes text,
  merged_into_id uuid references public.patients (id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint patients_merge_not_self check (merged_into_id is null or merged_into_id <> id),
  constraint patients_archive_excludes_merge check (deleted_at is null or merged_into_id is null)
);

create unique index patients_hospital_mrn_key on public.patients (hospital_id, mrn);
create index patients_hospital_name_idx on public.patients (hospital_id, full_name)
  where deleted_at is null;
create index patients_hospital_phone_idx on public.patients (hospital_id, phone)
  where deleted_at is null;

create or replace function private.prepare_patient_row()
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
    new.mrn := old.mrn;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger patients_prepare
before insert or update on public.patients
for each row execute function private.prepare_patient_row();

create or replace function private.guard_patient_archive()
returns trigger
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if new.deleted_at is distinct from old.deleted_at
    and not (select private.has_permission('patients:archive')) then
    raise exception 'patients:archive required';
  end if;
  return new;
end;
$$;

create trigger patients_guard_archive
before update on public.patients
for each row execute function private.guard_patient_archive();

create trigger patients_audit
after insert or update or delete on public.patients
for each row execute function private.write_audit_event();

alter table public.patients enable row level security;

create policy patients_select on public.patients
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('patients:read'))
  and deleted_at is null
);

create policy patients_insert on public.patients
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('patients:create'))
);

create policy patients_update on public.patients
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('patients:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('patients:update'))
  and deleted_at is null
);

revoke all on public.patients from authenticated, anon;
grant select on public.patients to authenticated;
grant update (
  full_name, sex, date_of_birth, phone, email, address, blood_group, notes
) on public.patients to authenticated;

create or replace function public.register_patient(
  p_full_name text,
  p_sex text default 'unknown',
  p_date_of_birth date default null,
  p_phone text default null,
  p_email text default null,
  p_address text default null,
  p_blood_group text default null,
  p_notes text default null
)
returns public.patients
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_hospital uuid := private.current_hospital_id();
  counter bigint;
  created_patient public.patients;
begin
  if target_hospital is null or not (select private.has_permission('patients:create')) then
    raise exception 'not_authorized';
  end if;

  update public.hospital_counters
  set next_value = next_value + 1
  where hospital_id = target_hospital and name = 'mrn'
  returning next_value - 1 into counter;

  if counter is null then
    insert into public.hospital_counters (hospital_id, name, next_value)
    values (target_hospital, 'mrn', 2)
    on conflict (hospital_id, name)
    do update set next_value = public.hospital_counters.next_value + 1
    returning next_value - 1 into counter;
  end if;

  insert into public.patients (
    hospital_id, mrn, full_name, sex, date_of_birth, phone, email, address,
    blood_group, notes, created_by, updated_by
  )
  values (
    target_hospital, lpad(counter::text, 6, '0'), p_full_name, p_sex,
    p_date_of_birth, p_phone, p_email, p_address, p_blood_group, p_notes,
    auth.uid(), auth.uid()
  )
  returning * into created_patient;

  return created_patient;
end;
$$;

revoke execute on function public.register_patient(text, text, date, text, text, text, text, text)
  from public, anon;
grant execute on function public.register_patient(text, text, date, text, text, text, text, text)
  to authenticated;

create or replace function public.archive_patient(p_patient_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.has_permission('patients:archive')) then
    raise exception 'not_authorized';
  end if;

  update public.patients
  set deleted_at = now()
  where id = p_patient_id
    and hospital_id = private.current_hospital_id()
    and deleted_at is null;

  return found;
end;
$$;

revoke execute on function public.archive_patient(uuid) from public, anon;
grant execute on function public.archive_patient(uuid) to authenticated;

create or replace function public.list_patients(
  p_query text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  mrn text,
  full_name text,
  sex text,
  date_of_birth date,
  phone text,
  created_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with filtered as (
    select p.*, count(*) over () as total_count
    from public.patients p
    where p.hospital_id = (select private.current_hospital_id())
      and (select private.has_permission('patients:read'))
      and p.deleted_at is null
      and (
        p_query is null
        or btrim(p_query) = ''
        or p.full_name ilike '%' || btrim(p_query) || '%'
        or p.phone ilike '%' || btrim(p_query) || '%'
        or p.mrn ilike btrim(p_query) || '%'
      )
  )
  select
    f.id, f.mrn, f.full_name, f.sex, f.date_of_birth, f.phone, f.created_at, f.total_count
  from filtered f
  order by f.full_name, f.mrn
  limit least(greatest(coalesce(p_limit, 25), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke execute on function public.list_patients(text, integer, integer) from public, anon;
grant execute on function public.list_patients(text, integer, integer) to authenticated;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key = 'patients:archive'
where r.key = 'hospital_admin'
on conflict do nothing;
