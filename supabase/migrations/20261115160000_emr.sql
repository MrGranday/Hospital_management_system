-- EMR: electronic medical records - clinical notes, diagnoses, allergies,
-- problems, and prescriptions. All tenant-scoped with audit and soft delete.

-- Clinical notes: consultation notes linked to a visit.

create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  visit_id uuid not null references public.visits (id),
  provider_id uuid not null references public.profiles (user_id),
  note_type text not null check (note_type in ('consultation', 'progress', 'discharge', 'procedure')),
  title text not null check (btrim(title) <> ''),
  content text not null check (btrim(content) <> ''),
  is_confidential boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1
);

create index clinical_notes_hospital_visit_idx
  on public.clinical_notes (hospital_id, visit_id, created_at desc)
  where deleted_at is null;
create index clinical_notes_hospital_provider_idx
  on public.clinical_notes (hospital_id, provider_id, created_at desc)
  where deleted_at is null;

create or replace function private.prepare_clinical_note_row()
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
    new.provider_id := old.provider_id;
    new.note_type := old.note_type;
    new.title := old.title;
    new.content := old.content;
    new.is_confidential := old.is_confidential;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger clinical_notes_prepare
before insert or update on public.clinical_notes
for each row execute function private.prepare_clinical_note_row();

create trigger clinical_notes_audit
after insert or update or delete on public.clinical_notes
for each row execute function private.write_audit_event();

alter table public.clinical_notes enable row level security;

create policy clinical_notes_select on public.clinical_notes
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:read'))
  and deleted_at is null
);

create policy clinical_notes_insert on public.clinical_notes
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:create'))
);

create policy clinical_notes_update on public.clinical_notes
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:update'))
  and deleted_at is null
);

revoke all on public.clinical_notes from authenticated, anon;
grant select on public.clinical_notes to authenticated;
grant insert (
  hospital_id, visit_id, provider_id, note_type, title, content, is_confidential
) on public.clinical_notes to authenticated;
grant update (
  title, content, is_confidential
) on public.clinical_notes to authenticated;

-- Diagnoses: conditions diagnosed during a visit.

create table public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  patient_id uuid not null references public.patients (id),
  visit_id uuid references public.visits (id),
  provider_id uuid not null references public.profiles (user_id),
  icd_code text not null check (btrim(icd_code) <> ''),
  description text not null,
  is_primary boolean not null default false,
  is_chronic boolean not null default false,
  diagnosed_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1
);

create index diagnoses_hospital_patient_idx
  on public.diagnoses (hospital_id, patient_id, diagnosed_at desc)
  where deleted_at is null;
create index diagnoses_hospital_visit_idx
  on public.diagnoses (hospital_id, visit_id, diagnosed_at desc)
  where deleted_at is null;

create or replace function private.prepare_diagnosis_row()
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
    new.icd_code := old.icd_code;
    new.description := old.description;
    new.is_primary := old.is_primary;
    new.is_chronic := old.is_chronic;
    new.diagnosed_at := old.diagnosed_at;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger diagnoses_prepare
before insert or update on public.diagnoses
for each row execute function private.prepare_diagnosis_row();

create trigger diagnoses_audit
after insert or update or delete on public.diagnoses
for each row execute function private.write_audit_event();

alter table public.diagnoses enable row level security;

create policy diagnoses_select on public.diagnoses
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:read'))
  and deleted_at is null
);

create policy diagnoses_insert on public.diagnoses
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:create'))
);

create policy diagnoses_update on public.diagnoses
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:update'))
  and deleted_at is null
);

revoke all on public.diagnoses from authenticated, anon;
grant select on public.diagnoses to authenticated;
grant insert (
  hospital_id, patient_id, visit_id, provider_id, icd_code, description,
  is_primary, is_chronic, diagnosed_at
) on public.diagnoses to authenticated;
grant update (
  icd_code, description, is_primary, is_chronic
) on public.diagnoses to authenticated;

-- Allergies: patient allergies and adverse reactions.

create table public.allergies (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  patient_id uuid not null references public.patients (id),
  allergen text not null check (btrim(allergen) <> ''),
  reaction text,
  severity text check (severity in ('mild', 'moderate', 'severe')),
  is_active boolean not null default true,
  recorded_at timestamptz not null default now(),
  recorded_by uuid not null references public.profiles (user_id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index allergies_hospital_patient_idx
  on public.allergies (hospital_id, patient_id, recorded_at desc)
  where deleted_at is null;

create or replace function private.prepare_allergy_row()
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
    new.allergen := old.allergen;
    new.reaction := old.reaction;
    new.severity := old.severity;
    new.is_active := old.is_active;
    new.recorded_at := old.recorded_at;
    new.recorded_by := old.recorded_by;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger allergies_prepare
before insert or update on public.allergies
for each row execute function private.prepare_allergy_row();

create trigger allergies_audit
after insert or update or delete on public.allergies
for each row execute function private.write_audit_event();

alter table public.allergies enable row level security;

create policy allergies_select on public.allergies
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:read'))
  and deleted_at is null
);

create policy allergies_insert on public.allergies
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:create'))
);

create policy allergies_update on public.allergies
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:update'))
  and deleted_at is null
);

revoke all on public.allergies from authenticated, anon;
grant select on public.allergies to authenticated;
grant insert (
  hospital_id, patient_id, allergen, reaction, severity, is_active, recorded_by
) on public.allergies to authenticated;
grant update (
  reaction, severity, is_active
) on public.allergies to authenticated;

-- Problems: chronic conditions on the patient problem list.

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  patient_id uuid not null references public.patients (id),
  condition text not null check (btrim(condition) <> ''),
  icd_code text,
  is_active boolean not null default true,
  onset_date date,
  resolved_date date,
  recorded_by uuid not null references public.profiles (user_id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  constraint problems_resolved_after_onset check (
    resolved_date is null or onset_date is null or resolved_date >= onset_date
  )
);

create index problems_hospital_patient_idx
  on public.problems (hospital_id, patient_id, created_at desc)
  where deleted_at is null;

create or replace function private.prepare_problem_row()
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
    new.condition := old.condition;
    new.icd_code := old.icd_code;
    new.is_active := old.is_active;
    new.onset_date := old.onset_date;
    new.resolved_date := old.resolved_date;
    new.recorded_by := old.recorded_by;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger problems_prepare
before insert or update on public.problems
for each row execute function private.prepare_problem_row();

create trigger problems_audit
after insert or update or delete on public.problems
for each row execute function private.write_audit_event();

alter table public.problems enable row level security;

create policy problems_select on public.problems
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:read'))
  and deleted_at is null
);

create policy problems_insert on public.problems
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:create'))
);

create policy problems_update on public.problems
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:update'))
  and deleted_at is null
);

revoke all on public.problems from authenticated, anon;
grant select on public.problems to authenticated;
grant insert (
  hospital_id, patient_id, condition, icd_code, is_active, onset_date,
  resolved_date, recorded_by
) on public.problems to authenticated;
grant update (
  condition, icd_code, is_active, onset_date, resolved_date
) on public.problems to authenticated;

-- Prescriptions: medication prescriptions linked to a visit.

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  patient_id uuid not null references public.patients (id),
  visit_id uuid references public.visits (id),
  provider_id uuid not null references public.profiles (user_id),
  status text not null check (status in ('active', 'completed', 'cancelled', 'discontinued')),
  prescribed_at timestamptz not null default now(),
  valid_until date,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1
);

create index prescriptions_hospital_patient_idx
  on public.prescriptions (hospital_id, patient_id, prescribed_at desc)
  where deleted_at is null;
create index prescriptions_hospital_visit_idx
  on public.prescriptions (hospital_id, visit_id, prescribed_at desc)
  where deleted_at is null;

create or replace function private.prepare_prescription_row()
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
    new.status := old.status;
    new.prescribed_at := old.prescribed_at;
    new.valid_until := old.valid_until;
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

create trigger prescriptions_prepare
before insert or update on public.prescriptions
for each row execute function private.prepare_prescription_row();

create trigger prescriptions_audit
after insert or update or delete on public.prescriptions
for each row execute function private.write_audit_event();

alter table public.prescriptions enable row level security;

create policy prescriptions_select on public.prescriptions
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:read'))
  and deleted_at is null
);

create policy prescriptions_insert on public.prescriptions
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:create'))
);

create policy prescriptions_update on public.prescriptions
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:update'))
  and deleted_at is null
);

revoke all on public.prescriptions from authenticated, anon;
grant select on public.prescriptions to authenticated;
grant insert (
  hospital_id, patient_id, visit_id, provider_id, status, prescribed_at,
  valid_until, notes
) on public.prescriptions to authenticated;
grant update (
  status, valid_until, notes
) on public.prescriptions to authenticated;

-- Prescription items: individual medications within a prescription.

create table public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  prescription_id uuid not null references public.prescriptions (id),
  medication_name text not null check (btrim(medication_name) <> ''),
  dosage text not null check (btrim(dosage) <> ''),
  frequency text not null check (btrim(frequency) <> ''),
  duration text,
  quantity integer check (quantity > 0),
  refills integer not null default 0 check (refills >= 0),
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1
);

create index prescription_items_hospital_prescription_idx
  on public.prescription_items (hospital_id, prescription_id, created_at);

create or replace function private.prepare_prescription_item_row()
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
    new.prescription_id := old.prescription_id;
    new.medication_name := old.medication_name;
    new.dosage := old.dosage;
    new.frequency := old.frequency;
    new.duration := old.duration;
    new.quantity := old.quantity;
    new.refills := old.refills;
    new.instructions := old.instructions;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger prescription_items_prepare
before insert or update on public.prescription_items
for each row execute function private.prepare_prescription_item_row();

create trigger prescription_items_audit
after insert or update or delete on public.prescription_items
for each row execute function private.write_audit_event();

alter table public.prescription_items enable row level security;

create policy prescription_items_select on public.prescription_items
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:read'))
);

create policy prescription_items_insert on public.prescription_items
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:create'))
);

create policy prescription_items_update on public.prescription_items
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:update'))
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('emr:update'))
);

revoke all on public.prescription_items from authenticated, anon;
grant select on public.prescription_items to authenticated;
grant insert (
  hospital_id, prescription_id, medication_name, dosage, frequency, duration,
  quantity, refills, instructions
) on public.prescription_items to authenticated;
grant update (
  medication_name, dosage, frequency, duration, quantity, refills, instructions
) on public.prescription_items to authenticated;
