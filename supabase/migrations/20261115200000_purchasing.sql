-- Purchasing & Suppliers: supplier management, purchase orders, goods receipts,
-- and supplier ledger. Financial records are append-only.

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  supplier_code text not null check (btrim(supplier_code) <> ''),
  name text not null check (btrim(name) <> ''),
  contact_name text,
  contact_email text,
  contact_phone text,
  address text,
  tax_id text,
  payment_terms text default 'net30',
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint suppliers_code_hospital_key unique (hospital_id, supplier_code)
);

create index suppliers_hospital_active_idx
  on public.suppliers (hospital_id, is_active)
  where deleted_at is null;

create or replace function private.prepare_supplier_row()
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
    new.supplier_code := old.supplier_code;
    new.name := old.name;
    new.contact_name := old.contact_name;
    new.contact_email := old.contact_email;
    new.contact_phone := old.contact_phone;
    new.address := old.address;
    new.tax_id := old.tax_id;
    new.payment_terms := old.payment_terms;
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

create trigger suppliers_prepare
before insert or update on public.suppliers
for each row execute function private.prepare_supplier_row();

create trigger suppliers_audit
after insert or update or delete on public.suppliers
for each row execute function private.write_audit_event();

alter table public.suppliers enable row level security;

create policy suppliers_select on public.suppliers
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:read'))
  and deleted_at is null
);

create policy suppliers_insert on public.suppliers
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:create'))
);

create policy suppliers_update on public.suppliers
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:update'))
  and deleted_at is null
);

revoke all on public.suppliers from authenticated, anon;
grant select on public.suppliers to authenticated;
grant insert (
  hospital_id, supplier_code, name, contact_name, contact_email, contact_phone,
  address, tax_id, payment_terms, is_active
) on public.suppliers to authenticated;
grant update (
  name, contact_name, contact_email, contact_phone, address, tax_id,
  payment_terms, is_active
) on public.suppliers to authenticated;

-- Purchase orders.

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  supplier_id uuid not null references public.suppliers (id),
  po_no text not null check (btrim(po_no) <> ''),
  status text not null check (status in ('draft', 'sent', 'approved', 'received', 'cancelled')),
  subtotal_minor integer not null check (subtotal_minor >= 0),
  tax_minor integer not null check (tax_minor >= 0),
  total_minor integer not null check (total_minor >= 0),
  currency char(3) not null default 'AFN',
  ordered_at timestamptz not null default now(),
  received_at timestamptz,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint po_no_hospital_key unique (hospital_id, po_no),
  constraint po_total_matches check (total_minor = subtotal_minor + tax_minor)
);

create index purchase_orders_hospital_supplier_idx
  on public.purchase_orders (hospital_id, supplier_id, ordered_at desc)
  where deleted_at is null;
create index purchase_orders_hospital_status_idx
  on public.purchase_orders (hospital_id, status, ordered_at desc)
  where deleted_at is null;

create or replace function private.prepare_purchase_order_row()
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
    new.supplier_id := old.supplier_id;
    new.po_no := old.po_no;
    new.subtotal_minor := old.subtotal_minor;
    new.tax_minor := old.tax_minor;
    new.total_minor := old.total_minor;
    new.currency := old.currency;
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

create trigger purchase_orders_prepare
before insert or update on public.purchase_orders
for each row execute function private.prepare_purchase_order_row();

create trigger purchase_orders_audit
after insert or update or delete on public.purchase_orders
for each row execute function private.write_audit_event();

alter table public.purchase_orders enable row level security;

create policy purchase_orders_select on public.purchase_orders
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:read'))
  and deleted_at is null
);

create policy purchase_orders_insert on public.purchase_orders
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:create'))
);

create policy purchase_orders_update on public.purchase_orders
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:update'))
  and deleted_at is null
);

revoke all on public.purchase_orders from authenticated, anon;
grant select on public.purchase_orders to authenticated;
grant insert (
  hospital_id, supplier_id, po_no, status, subtotal_minor, tax_minor,
  total_minor, currency, notes
) on public.purchase_orders to authenticated;
grant update (
  status, notes, received_at
) on public.purchase_orders to authenticated;

-- Purchase order lines.

create table public.po_lines (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  purchase_order_id uuid not null references public.purchase_orders (id),
  item_id uuid references public.items (id),
  description text not null check (btrim(description) <> ''),
  quantity integer not null check (quantity > 0),
  unit_price_minor integer not null check (unit_price_minor >= 0),
  line_total_minor integer not null check (line_total_minor >= 0),
  received_quantity integer not null default 0 check (received_quantity >= 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint po_line_total_matches check (line_total_minor = quantity * unit_price_minor)
);

create index po_lines_hospital_po_idx
  on public.po_lines (hospital_id, purchase_order_id, created_at);

create or replace function private.prepare_po_line_row()
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
    new.purchase_order_id := old.purchase_order_id;
    new.item_id := old.item_id;
    new.description := old.description;
    new.quantity := old.quantity;
    new.unit_price_minor := old.unit_price_minor;
    new.line_total_minor := old.line_total_minor;
    new.received_quantity := old.received_quantity;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger po_lines_prepare
before insert or update on public.po_lines
for each row execute function private.prepare_po_line_row();

create trigger po_lines_audit
after insert or update or delete on public.po_lines
for each row execute function private.write_audit_event();

alter table public.po_lines enable row level security;

create policy po_lines_select on public.po_lines
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:read'))
);

create policy po_lines_insert on public.po_lines
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:create'))
);

create policy po_lines_update on public.po_lines
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:update'))
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:update'))
);

revoke all on public.po_lines from authenticated, anon;
grant select on public.po_lines to authenticated;
grant insert (
  hospital_id, purchase_order_id, item_id, description, quantity,
  unit_price_minor, line_total_minor
) on public.po_lines to authenticated;
grant update (
  description, quantity, unit_price_minor, line_total_minor, received_quantity
) on public.po_lines to authenticated;

-- Goods receipts: receiving goods against a PO.

create table public.goods_receipts (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  purchase_order_id uuid not null references public.purchase_orders (id),
  receipt_no text not null check (btrim(receipt_no) <> ''),
  received_at timestamptz not null default now(),
  received_by uuid not null references auth.users (id),
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  constraint receipt_no_hospital_key unique (hospital_id, receipt_no)
);

create index goods_receipts_hospital_po_idx
  on public.goods_receipts (hospital_id, purchase_order_id, received_at desc);

create or replace function private.prepare_goods_receipt_row()
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
    new.purchase_order_id := old.purchase_order_id;
    new.receipt_no := old.receipt_no;
    new.received_at := old.received_at;
    new.received_by := old.received_by;
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

create trigger goods_receipts_prepare
before insert or update on public.goods_receipts
for each row execute function private.prepare_goods_receipt_row();

create trigger goods_receipts_audit
after insert or update or delete on public.goods_receipts
for each row execute function private.write_audit_event();

alter table public.goods_receipts enable row level security;

create policy goods_receipts_select on public.goods_receipts
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:read'))
  and deleted_at is null
);

create policy goods_receipts_insert on public.goods_receipts
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:create'))
);

revoke all on public.goods_receipts from authenticated, anon;
grant select on public.goods_receipts to authenticated;
grant insert (
  hospital_id, purchase_order_id, receipt_no, received_by, notes
) on public.goods_receipts to authenticated;

-- Purchase returns: returning goods to supplier.

create table public.purchase_returns (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  purchase_order_id uuid references public.purchase_orders (id),
  goods_receipt_id uuid references public.goods_receipts (id),
  return_no text not null check (btrim(return_no) <> ''),
  status text not null check (status in ('draft', 'submitted', 'approved', 'completed')),
  reason text not null check (btrim(reason) <> ''),
  amount_minor integer not null check (amount_minor > 0),
  currency char(3) not null default 'AFN',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz,
  constraint return_no_hospital_key unique (hospital_id, return_no)
);

create index purchase_returns_hospital_idx
  on public.purchase_returns (hospital_id, created_at desc)
  where deleted_at is null;

alter table public.purchase_returns enable row level security;

create policy purchase_returns_select on public.purchase_returns
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:read'))
  and deleted_at is null
);

create policy purchase_returns_insert on public.purchase_returns
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:create'))
);

revoke all on public.purchase_returns from authenticated, anon;
grant select on public.purchase_returns to authenticated;
grant insert (
  hospital_id, purchase_order_id, goods_receipt_id, return_no, status,
  reason, amount_minor, currency
) on public.purchase_returns to authenticated;

-- Supplier ledger: append-only record of all supplier transactions.

create table public.supplier_ledger (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  supplier_id uuid not null references public.suppliers (id),
  reference_type text not null check (reference_type in ('purchase_order', 'goods_receipt', 'purchase_return', 'payment')),
  reference_id uuid not null,
  amount_minor integer not null,
  currency char(3) not null default 'AFN',
  transaction_date timestamptz not null default now(),
  description text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create index supplier_ledger_hospital_supplier_idx
  on public.supplier_ledger (hospital_id, supplier_id, transaction_date desc);

alter table public.supplier_ledger enable row level security;

-- Supplier ledger is append-only.

create policy supplier_ledger_select on public.supplier_ledger
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:read'))
);

create policy supplier_ledger_insert on public.supplier_ledger
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('purchasing:create'))
);

revoke all on public.supplier_ledger from authenticated, anon;
grant select on public.supplier_ledger to authenticated;
grant insert (
  hospital_id, supplier_id, reference_type, reference_id, amount_minor,
  currency, transaction_date, description
) on public.supplier_ledger to authenticated;
