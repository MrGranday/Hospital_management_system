-- HR-lite: staff records, shifts, attendance, and leave management.

-- Departments: organizational departments.

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  name text not null check (btrim(name) <> ''),
  description text,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint departments_name_hospital_key unique (hospital_id, name)
);

create index departments_hospital_active_idx
  on public.departments (hospital_id, is_active)
  where deleted_at is null;

create or replace function private.prepare_department_row()
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
    new.name := old.name;
    new.description := old.description;
    new.is_active := old.is_active;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger departments_prepare
before insert or update on public.departments
for each row execute function private.prepare_department_row();

create trigger departments_audit
after insert or update or delete on public.departments
for each row execute function private.write_audit_event();

alter table public.departments enable row level security;

create policy departments_select on public.departments
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:read'))
  and deleted_at is null
);

create policy departments_insert on public.departments
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:create'))
);

create policy departments_update on public.departments
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:update'))
  and deleted_at is null
);

revoke all on public.departments from authenticated, anon;
grant select on public.departments to authenticated;
grant insert (
  hospital_id, name, description, is_active
) on public.departments to authenticated;
grant update (
  name, description, is_active
) on public.departments to authenticated;

-- Staff: extends profiles with HR-specific information.

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  user_id uuid not null references public.profiles (user_id),
  employee_id text not null check (btrim(employee_id) <> ''),
  job_title text not null check (btrim(job_title) <> ''),
  department_id uuid references public.departments (id),
  employment_type text not null check (employment_type in ('full-time', 'part-time', 'contract', 'temporary')),
  hire_date date not null,
  termination_date date,
  salary_annual_minor bigint check (salary_annual_minor >= 0),
  currency char(3) not null default 'AFN',
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint staff_employee_id_hospital_key unique (hospital_id, employee_id),
  constraint staff_termination_after_hire check (
    termination_date is null or hire_date is null or termination_date >= hire_date
  )
);

create index staff_hospital_active_idx
  on public.staff (hospital_id, is_active)
  where deleted_at is null;
create index staff_hospital_department_idx
  on public.staff (hospital_id, department_id)
  where deleted_at is null;

create or replace function private.prepare_staff_row()
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
    new.user_id := old.user_id;
    new.employee_id := old.employee_id;
    new.job_title := old.job_title;
    new.department_id := old.department_id;
    new.employment_type := old.employment_type;
    new.hire_date := old.hire_date;
    new.termination_date := old.termination_date;
    new.salary_annual_minor := old.salary_annual_minor;
    new.currency := old.currency;
    new.is_active := old.is_active;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger staff_prepare
before insert or update on public.staff
for each row execute function private.prepare_staff_row();

create trigger staff_audit
after insert or update or delete on public.staff
for each row execute function private.write_audit_event();

alter table public.staff enable row level security;

create policy staff_select on public.staff
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:read'))
  and deleted_at is null
);

create policy staff_insert on public.staff
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:create'))
);

create policy staff_update on public.staff
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:update'))
  and deleted_at is null
);

revoke all on public.staff from authenticated, anon;
grant select on public.staff to authenticated;
grant insert (
  hospital_id, user_id, employee_id, job_title, department_id, employment_type,
  hire_date, termination_date, salary_annual_minor, currency, is_active
) on public.staff to authenticated;
grant update (
  job_title, department_id, employment_type, termination_date,
  salary_annual_minor, currency, is_active
) on public.staff to authenticated;

-- Shifts: staff work shifts.

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  staff_id uuid not null references public.staff (id),
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  break_minutes integer not null default 0 check (break_minutes >= 0),
  status text not null check (status in ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint shifts_end_after_start check (end_time > start_time)
);

create index shifts_hospital_staff_idx
  on public.shifts (hospital_id, staff_id, shift_date desc)
  where deleted_at is null;
create index shifts_hospital_date_idx
  on public.shifts (hospital_id, shift_date desc)
  where deleted_at is null;

create or replace function private.prepare_shift_row()
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
    new.staff_id := old.staff_id;
    new.shift_date := old.shift_date;
    new.start_time := old.start_time;
    new.end_time := old.end_time;
    new.break_minutes := old.break_minutes;
    new.status := old.status;
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

create trigger shifts_prepare
before insert or update on public.shifts
for each row execute function private.prepare_shift_row();

create trigger shifts_audit
after insert or update or delete on public.shifts
for each row execute function private.write_audit_event();

alter table public.shifts enable row level security;

create policy shifts_select on public.shifts
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:read'))
  and deleted_at is null
);

create policy shifts_insert on public.shifts
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:create'))
);

create policy shifts_update on public.shifts
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:update'))
  and deleted_at is null
);

revoke all on public.shifts from authenticated, anon;
grant select on public.shifts to authenticated;
grant insert (
  hospital_id, staff_id, shift_date, start_time, end_time, break_minutes, status, notes
) on public.shifts to authenticated;
grant update (
  status, notes
) on public.shifts to authenticated;

-- Attendance: staff attendance records.

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  staff_id uuid not null references public.staff (id),
  shift_id uuid references public.shifts (id),
  attendance_date date not null,
  clock_in timestamptz,
  clock_out timestamptz,
  status text not null check (status in ('present', 'absent', 'late', 'leave', 'holiday')),
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint attendance_date_staff_unique unique (hospital_id, staff_id, attendance_date),
  constraint attendance_clock_out_after_in check (
    clock_out is null or clock_in is null or clock_out > clock_in
  )
);

create index attendance_hospital_staff_idx
  on public.attendance (hospital_id, staff_id, attendance_date desc)
  where deleted_at is null;
create index attendance_hospital_date_idx
  on public.attendance (hospital_id, attendance_date desc)
  where deleted_at is null;

create or replace function private.prepare_attendance_row()
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
    new.staff_id := old.staff_id;
    new.shift_id := old.shift_id;
    new.attendance_date := old.attendance_date;
    new.clock_in := old.clock_in;
    new.clock_out := old.clock_out;
    new.status := old.status;
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

create trigger attendance_prepare
before insert or update on public.attendance
for each row execute function private.prepare_attendance_row();

create trigger attendance_audit
after insert or update or delete on public.attendance
for each row execute function private.write_audit_event();

alter table public.attendance enable row level security;

create policy attendance_select on public.attendance
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:read'))
  and deleted_at is null
);

create policy attendance_insert on public.attendance
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:create'))
);

create policy attendance_update on public.attendance
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:update'))
  and deleted_at is null
);

revoke all on public.attendance from authenticated, anon;
grant select on public.attendance to authenticated;
grant insert (
  hospital_id, staff_id, shift_id, attendance_date, clock_in, clock_out,
  status, notes
) on public.attendance to authenticated;
grant update (
  clock_in, clock_out, status, notes
) on public.attendance to authenticated;

-- Leave requests: staff leave/time-off requests.

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  staff_id uuid not null references public.staff (id),
  leave_type text not null check (leave_type in ('sick', 'vacation', 'personal', 'emergency', 'other')),
  start_date date not null,
  end_date date not null,
  days numeric(4, 1) not null check (days > 0),
  status text not null check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reason text not null check (btrim(reason) <> ''),
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  rejection_reason text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint leave_end_after_start check (end_date >= start_date)
);

create index leave_requests_hospital_staff_idx
  on public.leave_requests (hospital_id, staff_id, created_at desc)
  where deleted_at is null;
create index leave_requests_hospital_status_idx
  on public.leave_requests (hospital_id, status, created_at desc)
  where deleted_at is null;

create or replace function private.prepare_leave_request_row()
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
    new.staff_id := old.staff_id;
    new.leave_type := old.leave_type;
    new.start_date := old.start_date;
    new.end_date := old.end_date;
    new.days := old.days;
    new.status := old.status;
    new.reason := old.reason;
    new.approved_by := old.approved_by;
    new.approved_at := old.approved_at;
    new.rejection_reason := old.rejection_reason;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger leave_requests_prepare
before insert or update on public.leave_requests
for each row execute function private.prepare_leave_request_row();

create trigger leave_requests_audit
after insert or update or delete on public.leave_requests
for each row execute function private.write_audit_event();

alter table public.leave_requests enable row level security;

create policy leave_requests_select on public.leave_requests
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:read'))
  and deleted_at is null
);

create policy leave_requests_insert on public.leave_requests
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:create'))
);

create policy leave_requests_update on public.leave_requests
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('hr:update'))
  and deleted_at is null
);

revoke all on public.leave_requests from authenticated, anon;
grant select on public.leave_requests to authenticated;
grant insert (
  hospital_id, staff_id, leave_type, start_date, end_date, days, status, reason
) on public.leave_requests to authenticated;
grant update (
  status, approved_by, approved_at, rejection_reason
) on public.leave_requests to authenticated;
