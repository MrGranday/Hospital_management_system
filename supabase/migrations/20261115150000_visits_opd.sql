-- Visits / OPD: patient encounter tracking with queue state machine,
-- vitals capture, and optimistic concurrency. Every visit is tenant-scoped
-- and audited.

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  patient_id uuid not null references public.patients (id),
  appointment_id uuid references public.appointments (id),
  provider_id uuid not null references public.profiles (user_id),
  status text not null check (status in ('waiting', 'vitals', 'consultation', 'completed', 'cancelled')),
  queue_position integer,
  started_at timestamptz,
  completed_at timestamptz,
  chief_complaint text,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint visits_queue_position_positive check (queue_position is null or queue_position > 0),
  constraint visits_started_before_completed check (started_at is null or completed_at is null or started_at <= completed_at)
);

create unique index visits_id_hospital_key on public.visits (id, hospital_id);
create index visits_hospital_patient_idx
  on public.visits (hospital_id, patient_id, created_at desc)
  where deleted_at is null;
create index visits_hospital_status_idx
  on public.visits (hospital_id, status, created_at desc)
  where deleted_at is null;
create index visits_hospital_queue_idx
  on public.visits (hospital_id, queue_position)
  where status = 'waiting' and deleted_at is null;
create index visits_hospital_provider_idx
  on public.visits (hospital_id, provider_id, created_at desc)
  where deleted_at is null;

create or replace function private.prepare_visit_row()
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
    new.appointment_id := old.appointment_id;
    new.provider_id := old.provider_id;
    new.queue_position := old.queue_position;
    new.started_at := old.started_at;
    new.chief_complaint := old.chief_complaint;
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

create trigger visits_prepare
before insert or update on public.visits
for each row execute function private.prepare_visit_row();

create trigger visits_audit
after insert or update or delete on public.visits
for each row execute function private.write_audit_event();

alter table public.visits enable row level security;

create policy visits_select on public.visits
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('visits:read'))
  and deleted_at is null
);

create policy visits_insert on public.visits
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('visits:create'))
);

create policy visits_update on public.visits
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('visits:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('visits:update'))
  and deleted_at is null
);

revoke all on public.visits from authenticated, anon;
grant select on public.visits to authenticated;
grant insert (
  hospital_id, patient_id, appointment_id, provider_id, status, queue_position,
  started_at, chief_complaint, notes
) on public.visits to authenticated;
grant update (
  status, queue_position, started_at, completed_at, chief_complaint, notes
) on public.visits to authenticated;

create or replace function public.create_visit(
  p_patient_id uuid,
  p_provider_id uuid,
  p_appointment_id uuid default null,
  p_chief_complaint text default null
)
returns public.visits
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_hospital uuid := private.current_hospital_id();
  created_visit public.visits;
  max_queue integer;
begin
  if target_hospital is null or not (select private.has_permission('visits:create')) then
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

  select coalesce(max(queue_position), 0) into max_queue
  from public.visits
  where hospital_id = target_hospital
    and status = 'waiting'
    and deleted_at is null;

  insert into public.visits (
    hospital_id, patient_id, appointment_id, provider_id, status, queue_position,
    chief_complaint, created_by, updated_by
  )
  values (
    target_hospital, p_patient_id, p_appointment_id, p_provider_id,
    'waiting', max_queue + 1, p_chief_complaint, auth.uid(), auth.uid()
  )
  returning * into created_visit;

  return created_visit;
end;
$$;

revoke execute on function public.create_visit(uuid, uuid, uuid, text) from public, anon;
grant execute on function public.create_visit(uuid, uuid, uuid, text) to authenticated;

create or replace function public.list_visits(
  p_query text default null,
  p_limit integer default 25,
  p_offset integer default 0,
  p_status text default null
)
returns table (
  id uuid,
  patient_id uuid,
  patient_name text,
  patient_mrn text,
  provider_id uuid,
  provider_name text,
  appointment_id uuid,
  status text,
  queue_position integer,
  started_at timestamptz,
  completed_at timestamptz,
  chief_complaint text,
  created_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with filtered as (
    select v.*, p.full_name as patient_name, p.mrn as patient_mrn,
           pr.full_name as provider_name,
           count(*) over () as total_count
    from public.visits v
    join public.patients p on p.id = v.patient_id
    join public.profiles pr on pr.user_id = v.provider_id
    where v.hospital_id = (select private.current_hospital_id())
      and (select private.has_permission('visits:read'))
      and v.deleted_at is null
      and (
        p_query is null
        or btrim(p_query) = ''
        or p.full_name ilike '%' || btrim(p_query) || '%'
        or p.mrn ilike btrim(p_query) || '%'
        or v.chief_complaint ilike '%' || btrim(p_query) || '%'
      )
      and (p_status is null or v.status = p_status)
  )
  select
    f.id, f.patient_id, f.patient_name, f.patient_mrn,
    f.provider_id, f.provider_name, f.appointment_id, f.status,
    f.queue_position, f.started_at, f.completed_at, f.chief_complaint,
    f.created_at, f.total_count
  from filtered f
  order by
    case when f.status = 'waiting' then 0 else 1 end,
    f.queue_position asc nulls last,
    f.created_at asc
  limit least(greatest(coalesce(p_limit, 25), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke execute on function public.list_visits(text, integer, integer, text) from public, anon;
grant execute on function public.list_visits(text, integer, integer, text) to authenticated;

-- Vitals: vital signs captured during a visit.

create table public.vitals (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  visit_id uuid not null references public.visits (id),
  recorded_by uuid not null references public.profiles (user_id),
  recorded_at timestamptz not null default now(),
  temperature_c numeric(4, 1),
  heart_rate integer,
  respiratory_rate integer,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  oxygen_saturation integer,
  weight_kg numeric(5, 2),
  height_cm numeric(5, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  constraint vitals_temperature_range check (temperature_c is null or temperature_c between 20 and 45),
  constraint vitals_heart_rate_range check (heart_rate is null or heart_rate between 20 and 220),
  constraint vitals_resp_rate_range check (respiratory_rate is null or respiratory_rate between 5 and 60),
  constraint vitals_bp_systolic_range check (blood_pressure_systolic is null or blood_pressure_systolic between 50 and 300),
  constraint vitals_bp_diastolic_range check (blood_pressure_diastolic is null or blood_pressure_diastolic between 20 and 200),
  constraint vitals_o2_sat_range check (oxygen_saturation is null or oxygen_saturation between 50 and 100)
);

create index vitals_hospital_visit_idx
  on public.vitals (hospital_id, visit_id, recorded_at desc);

create or replace function private.prepare_vitals_row()
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
    new.visit_id := old.visit_id;
    new.recorded_by := old.recorded_by;
    new.recorded_at := old.recorded_at;
    new.temperature_c := old.temperature_c;
    new.heart_rate := old.heart_rate;
    new.respiratory_rate := old.respiratory_rate;
    new.blood_pressure_systolic := old.blood_pressure_systolic;
    new.blood_pressure_diastolic := old.blood_pressure_diastolic;
    new.oxygen_saturation := old.oxygen_saturation;
    new.weight_kg := old.weight_kg;
    new.height_cm := old.height_cm;
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

create trigger vitals_prepare
before insert or update on public.vitals
for each row execute function private.prepare_vitals_row();

create trigger vitals_audit
after insert or update or delete on public.vitals
for each row execute function private.write_audit_event();

alter table public.vitals enable row level security;

create policy vitals_select on public.vitals
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('visits:read'))
);

create policy vitals_insert on public.vitals
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('visits:create'))
);

create policy vitals_update on public.vitals
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('visits:update'))
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('visits:update'))
);

revoke all on public.vitals from authenticated, anon;
grant select on public.vitals to authenticated;
grant insert (
  hospital_id, visit_id, recorded_by, recorded_at, temperature_c, heart_rate,
  respiratory_rate, blood_pressure_systolic, blood_pressure_diastolic,
  oxygen_saturation, weight_kg, height_cm, notes
) on public.vitals to authenticated;

create or replace function public.record_vitals(
  p_visit_id uuid,
  p_temperature_c numeric(4, 1) default null,
  p_heart_rate integer default null,
  p_respiratory_rate integer default null,
  p_blood_pressure_systolic integer default null,
  p_blood_pressure_diastolic integer default null,
  p_oxygen_saturation integer default null,
  p_weight_kg numeric(5, 2) default null,
  p_height_cm numeric(5, 2) default null,
  p_notes text default null
)
returns public.vitals
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_hospital uuid := private.current_hospital_id();
  recorded_vitals public.vitals;
begin
  if target_hospital is null or not (select private.has_permission('visits:create')) then
    raise exception 'not_authorized';
  end if;

  if not exists (
    select 1 from public.visits v
    where v.id = p_visit_id
      and v.hospital_id = target_hospital
      and v.deleted_at is null
  ) then
    raise exception 'invalid_visit';
  end if;

  insert into public.vitals (
    hospital_id, visit_id, recorded_by, recorded_at, temperature_c, heart_rate,
    respiratory_rate, blood_pressure_systolic, blood_pressure_diastolic,
    oxygen_saturation, weight_kg, height_cm, notes, created_by, updated_by
  )
  values (
    target_hospital, p_visit_id, auth.uid(), now(),
    p_temperature_c, p_heart_rate, p_respiratory_rate,
    p_blood_pressure_systolic, p_blood_pressure_diastolic,
    p_oxygen_saturation, p_weight_kg, p_height_cm, p_notes,
    auth.uid(), auth.uid()
  )
  returning * into recorded_vitals;

  return recorded_vitals;
end;
$$;

revoke execute on function public.record_vitals(uuid, numeric, integer, integer, integer, integer, integer, numeric, numeric, text) from public, anon;
grant execute on function public.record_vitals(uuid, numeric, integer, integer, integer, integer, integer, numeric, numeric, text) to authenticated;
