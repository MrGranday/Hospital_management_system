-- Add audit and prepare triggers for append-only and adjustment tables:
-- credit_notes, stock_adjustments, purchase_returns, supplier_ledger.
-- Every write to money and stock must produce an audit event (AGENTS.md Rule 8).

-- 1. credit_notes
create or replace function private.prepare_credit_note_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
  end if;
  return new;
end;
$$;

create trigger credit_notes_prepare
before insert on public.credit_notes
for each row execute function private.prepare_credit_note_row();

create trigger credit_notes_audit
after insert or update or delete on public.credit_notes
for each row execute function private.write_audit_event();

-- 2. stock_adjustments
create or replace function private.prepare_stock_adjustment_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
  end if;
  return new;
end;
$$;

create trigger stock_adjustments_prepare
before insert on public.stock_adjustments
for each row execute function private.prepare_stock_adjustment_row();

create trigger stock_adjustments_audit
after insert or update or delete on public.stock_adjustments
for each row execute function private.write_audit_event();

-- 3. purchase_returns
create or replace function private.prepare_purchase_return_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
  end if;
  return new;
end;
$$;

create trigger purchase_returns_prepare
before insert on public.purchase_returns
for each row execute function private.prepare_purchase_return_row();

create trigger purchase_returns_audit
after insert or update or delete on public.purchase_returns
for each row execute function private.write_audit_event();

-- 4. supplier_ledger
create or replace function private.prepare_supplier_ledger_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
  end if;
  return new;
end;
$$;

create trigger supplier_ledger_prepare
before insert on public.supplier_ledger
for each row execute function private.prepare_supplier_ledger_row();

create trigger supplier_ledger_audit
after insert or update or delete on public.supplier_ledger
for each row execute function private.write_audit_event();
