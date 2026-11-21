-- Billing: service catalog, invoices, invoice lines, payments, credit notes.
-- Money is stored as integer minor units + currency code. Financial records
-- are append-only; corrections are new records (credit notes, reversing
-- payments), never UPDATE/DELETE of finalized rows.

-- Service catalog: billable services with prices.

create table public.services (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  code text not null check (btrim(code) <> ''),
  name text not null check (btrim(name) <> ''),
  description text,
  unit_price_minor integer not null check (unit_price_minor >= 0),
  currency char(3) not null default 'AFN',
  is_active boolean not null default true,
  department text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint services_code_hospital_key unique (hospital_id, code)
);

create index services_hospital_active_idx
  on public.services (hospital_id, is_active)
  where deleted_at is null;

create or replace function private.prepare_service_row()
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
    new.code := old.code;
    new.name := old.name;
    new.description := old.description;
    new.unit_price_minor := old.unit_price_minor;
    new.currency := old.currency;
    new.is_active := old.is_active;
    new.department := old.department;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger services_prepare
before insert or update on public.services
for each row execute function private.prepare_service_row();

create trigger services_audit
after insert or update or delete on public.services
for each row execute function private.write_audit_event();

alter table public.services enable row level security;

create policy services_select on public.services
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('billing:read'))
  and deleted_at is null
);

create policy services_insert on public.services
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('billing:create'))
);

create policy services_update on public.services
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('billing:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('billing:update'))
  and deleted_at is null
);

revoke all on public.services from authenticated, anon;
grant select on public.services to authenticated;
grant insert (
  hospital_id, code, name, description, unit_price_minor, currency, is_active, department
) on public.services to authenticated;
grant update (
  name, description, unit_price_minor, is_active, department
) on public.services to authenticated;

-- Invoices: append-only billing documents.

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  patient_id uuid not null references public.patients (id),
  invoice_no text not null check (btrim(invoice_no) <> ''),
  status text not null check (status in ('draft', 'issued', 'paid', 'partially_paid', 'voided', 'credited')),
  subtotal_minor integer not null check (subtotal_minor >= 0),
  tax_minor integer not null check (tax_minor >= 0),
  total_minor integer not null check (total_minor >= 0),
  currency char(3) not null default 'AFN',
  issued_at timestamptz,
  voided_at timestamptz,
  voided_by uuid references auth.users (id),
  void_reason text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint invoices_invoice_no_hospital_key unique (hospital_id, invoice_no),
  constraint invoices_total_matches check (total_minor = subtotal_minor + tax_minor)
);

create index invoices_hospital_patient_idx
  on public.invoices (hospital_id, patient_id, created_at desc)
  where deleted_at is null;
create index invoices_hospital_status_idx
  on public.invoices (hospital_id, status, created_at desc)
  where deleted_at is null;
create index invoices_hospital_invoice_no_idx
  on public.invoices (hospital_id, invoice_no)
  where deleted_at is null;

create or replace function private.prepare_invoice_row()
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
    new.invoice_no := old.invoice_no;
    new.subtotal_minor := old.subtotal_minor;
    new.tax_minor := old.tax_minor;
    new.total_minor := old.total_minor;
    new.currency := old.currency;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger invoices_prepare
before insert or update on public.invoices
for each row execute function private.prepare_invoice_row();

create trigger invoices_audit
after insert or update or delete on public.invoices
for each row execute function private.write_audit_event();

alter table public.invoices enable row level security;

create policy invoices_select on public.invoices
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('billing:read'))
  and deleted_at is null
);

create policy invoices_insert on public.invoices
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('billing:create'))
);

create policy invoices_update on public.invoices
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('billing:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('billing:update'))
  and deleted_at is null
);

revoke all on public.invoices from authenticated, anon;
grant select on public.invoices to authenticated;
grant insert (
  hospital_id, patient_id, invoice_no, status, subtotal_minor, tax_minor,
  total_minor, currency, issued_at
) on public.invoices to authenticated;
grant update (
  status, issued_at, voided_at, voided_by, void_reason
) on public.invoices to authenticated;

-- Invoice lines: line items on an invoice.

create table public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  invoice_id uuid not null references public.invoices (id),
  service_id uuid references public.services (id),
  description text not null check (btrim(description) <> ''),
  quantity integer not null check (quantity > 0),
  unit_price_minor integer not null check (unit_price_minor >= 0),
  line_total_minor integer not null check (line_total_minor >= 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint invoice_lines_total_matches check (line_total_minor = quantity * unit_price_minor)
);

create index invoice_lines_hospital_invoice_idx
  on public.invoice_lines (hospital_id, invoice_id, created_at);

create or replace function private.prepare_invoice_line_row()
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
    new.invoice_id := old.invoice_id;
    new.service_id := old.service_id;
    new.description := old.description;
    new.quantity := old.quantity;
    new.unit_price_minor := old.unit_price_minor;
    new.line_total_minor := old.line_total_minor;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger invoice_lines_prepare
before insert or update on public.invoice_lines
for each row execute function private.prepare_invoice_line_row();

create trigger invoice_lines_audit
after insert or update or delete on public.invoice_lines
for each row execute function private.write_audit_event();

alter table public.invoice_lines enable row level security;

create policy invoice_lines_select on public.invoice_lines
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('billing:read'))
);

create policy invoice_lines_insert on public.invoice_lines
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('billing:create'))
);

create policy invoice_lines_update on public.invoice_lines
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('billing:update'))
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('billing:update'))
);

revoke all on public.invoice_lines from authenticated, anon;
grant select on public.invoice_lines to authenticated;
grant insert (
  hospital_id, invoice_id, service_id, description, quantity, unit_price_minor, line_total_minor
) on public.invoice_lines to authenticated;
grant update (
  description, quantity, unit_price_minor, line_total_minor
) on public.invoice_lines to authenticated;

-- Payments: payments against invoices. Append-only.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  invoice_id uuid not null references public.invoices (id),
  amount_minor integer not null check (amount_minor > 0),
  currency char(3) not null default 'AFN',
  payment_method text not null check (payment_method in ('cash', 'card', 'insurance', 'transfer')),
  paid_at timestamptz not null default now(),
  reference text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1
);

create index payments_hospital_invoice_idx
  on public.payments (hospital_id, invoice_id, paid_at desc);

create or replace function private.prepare_payment_row()
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
    new.invoice_id := old.invoice_id;
    new.amount_minor := old.amount_minor;
    new.currency := old.currency;
    new.payment_method := old.payment_method;
    new.paid_at := old.paid_at;
    new.reference := old.reference;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger payments_prepare
before insert or update on public.payments
for each row execute function private.prepare_payment_row();

create trigger payments_audit
after insert or update or delete on public.payments
for each row execute function private.write_audit_event();

alter table public.payments enable row level security;

create policy payments_select on public.payments
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('billing:read'))
);

create policy payments_insert on public.payments
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('billing:create'))
);

-- Payments are append-only: no UPDATE or DELETE through RLS policies.

revoke all on public.payments from authenticated, anon;
grant select on public.payments to authenticated;
grant insert (
  hospital_id, invoice_id, amount_minor, currency, payment_method, paid_at, reference
) on public.payments to authenticated;

-- Credit notes: voids/credits for invoices. Append-only.

create table public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  invoice_id uuid not null references public.invoices (id),
  amount_minor integer not null check (amount_minor > 0),
  currency char(3) not null default 'AFN',
  reason text not null check (btrim(reason) <> ''),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create index credit_notes_hospital_invoice_idx
  on public.credit_notes (hospital_id, invoice_id, created_at);

alter table public.credit_notes enable row level security;

create policy credit_notes_select on public.credit_notes
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('billing:read'))
);

create policy credit_notes_insert on public.credit_notes
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('billing:update'))
);

-- Credit notes are append-only: no UPDATE or DELETE through RLS policies.

revoke all on public.credit_notes from authenticated, anon;
grant select on public.credit_notes to authenticated;
grant insert (
  hospital_id, invoice_id, amount_minor, currency, reason
) on public.credit_notes to authenticated;
