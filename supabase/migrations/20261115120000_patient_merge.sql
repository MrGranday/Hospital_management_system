-- Duplicate patient merge: append-only merge records plus an atomic RPC that
-- archives the source record and points it at the surviving patient.

insert into public.permissions (key, module, action, description)
values ('patients:merge', 'patients', 'merge', 'Merge duplicate patient records')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key = 'patients:merge'
where r.key = 'hospital_admin'
on conflict do nothing;

create table public.patient_merges (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  source_patient_id uuid not null references public.patients (id),
  target_patient_id uuid not null references public.patients (id),
  source_mrn text not null,
  source_full_name text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  constraint patient_merges_distinct_patients check (source_patient_id <> target_patient_id),
  constraint patient_merges_reason_length check (char_length(btrim(reason)) between 5 and 500)
);

create unique index patient_merges_source_key
  on public.patient_merges (hospital_id, source_patient_id);
create index patient_merges_target_idx
  on public.patient_merges (hospital_id, target_patient_id, created_at desc);

create trigger patient_merges_audit
after insert or update or delete on public.patient_merges
for each row execute function private.write_audit_event();

alter table public.patient_merges enable row level security;

create policy patient_merges_select on public.patient_merges
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('patients:read'))
);

revoke all on public.patient_merges from authenticated, anon;
grant select on public.patient_merges to authenticated;

create or replace function private.guard_patient_archive()
returns trigger
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if new.deleted_at is distinct from old.deleted_at
    and not (
      (select private.has_permission('patients:archive'))
      or (select private.has_permission('patients:merge'))
    ) then
    raise exception 'patients:archive required';
  end if;
  return new;
end;
$$;

create or replace function public.merge_patients(
  p_source_id uuid,
  p_target_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_hospital uuid := private.current_hospital_id();
  source_patient public.patients;
  target_patient public.patients;
  merge_id uuid;
begin
  if target_hospital is null or not (select private.has_permission('patients:merge')) then
    raise exception 'not_authorized';
  end if;

  if p_source_id = p_target_id then
    raise exception 'cannot_merge_into_self';
  end if;

  if char_length(btrim(coalesce(p_reason, ''))) < 5 then
    raise exception 'merge_reason_required';
  end if;

  select * into source_patient
  from public.patients
  where id = p_source_id
    and hospital_id = target_hospital
    and deleted_at is null
  for update;

  select * into target_patient
  from public.patients
  where id = p_target_id
    and hospital_id = target_hospital
    and deleted_at is null
  for update;

  if source_patient.id is null or target_patient.id is null then
    raise exception 'patient_not_found';
  end if;

  update public.patients
  set deleted_at = now(), merged_into_id = p_target_id
  where id = p_source_id;

  insert into public.patient_merges (
    hospital_id, source_patient_id, target_patient_id,
    source_mrn, source_full_name, reason, created_by
  )
  values (
    target_hospital, p_source_id, p_target_id,
    source_patient.mrn, source_patient.full_name, btrim(p_reason), auth.uid()
  )
  returning id into merge_id;

  return merge_id;
end;
$$;

revoke execute on function public.merge_patients(uuid, uuid, text) from public, anon;
grant execute on function public.merge_patients(uuid, uuid, text) to authenticated;
