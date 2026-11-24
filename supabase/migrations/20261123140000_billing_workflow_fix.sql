-- Billing workflow fixes:
-- 1. list_invoices gives the SPA a tenant-scoped invoice read model with the
--    patient name and the payment/credit totals, without requiring patients:read.
-- 2. create_invoice atomically allocates the invoice number (hospital_counters is
--    not writable by authenticated users) and inserts the invoice with its lines,
--    computing totals on the server.
-- 3. record_invoice_payment locks the invoice, rejects overpayment, inserts the
--    append-only payment and moves the invoice to partially_paid/paid.
-- 4. void_invoice is the only supported way to void an invoice.

create or replace function public.list_invoices(p_limit integer default 200)
returns table (
  id uuid,
  patient_id uuid,
  invoice_no text,
  status text,
  subtotal_minor integer,
  tax_minor integer,
  total_minor integer,
  currency text,
  issued_at timestamptz,
  created_at timestamptz,
  version integer,
  patient_name text,
  patient_mrn text,
  paid_minor bigint,
  credit_minor bigint
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    i.id,
    i.patient_id,
    i.invoice_no,
    i.status,
    i.subtotal_minor,
    i.tax_minor,
    i.total_minor,
    i.currency::text,
    i.issued_at,
    i.created_at,
    i.version,
    p.full_name,
    p.mrn,
    coalesce((
      select sum(pay.amount_minor)
      from public.payments pay
      where pay.invoice_id = i.id
        and pay.hospital_id = i.hospital_id
        and pay.deleted_at is null
    ), 0)::bigint,
    coalesce((
      select sum(cn.amount_minor)
      from public.credit_notes cn
      where cn.invoice_id = i.id
        and cn.hospital_id = i.hospital_id
    ), 0)::bigint
  from public.invoices i
  join public.patients p
    on p.id = i.patient_id
   and p.hospital_id = i.hospital_id
  where i.hospital_id = private.current_hospital_id()
    and i.deleted_at is null
    and (select private.has_permission('billing:read'))
  order by i.created_at desc
  limit greatest(1, least(coalesce(p_limit, 200), 500));
$$;

revoke execute on function public.list_invoices(integer) from public, anon;
grant execute on function public.list_invoices(integer) to authenticated;

create or replace function public.create_invoice(
  p_patient_id uuid,
  p_currency text default 'AFN',
  p_tax_minor integer default 0,
  p_status text default 'issued',
  p_lines jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_hospital uuid := private.current_hospital_id();
  target_currency text := upper(coalesce(nullif(btrim(p_currency), ''), 'AFN'));
  next_value bigint;
  new_invoice_id uuid;
  new_invoice_no text;
  line_record record;
  line_count integer := 0;
  subtotal integer := 0;
begin
  if target_hospital is null or not (select private.has_permission('billing:create')) then
    raise exception 'not_authorized';
  end if;

  if p_status not in ('draft', 'issued') then
    raise exception 'invalid_status';
  end if;

  if p_tax_minor is null or p_tax_minor < 0 then
    raise exception 'invalid_tax';
  end if;

  if length(target_currency) <> 3 then
    raise exception 'invalid_currency';
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

  if jsonb_typeof(coalesce(p_lines, '[]'::jsonb)) <> 'array' then
    raise exception 'invalid_lines';
  end if;

  for line_record in
    select *
    from jsonb_to_recordset(coalesce(p_lines, '[]'::jsonb))
      as x(description text, quantity integer, unit_price_minor integer)
  loop
    if line_record.description is null or btrim(line_record.description) = '' then
      raise exception 'invalid_line_description';
    end if;
    if line_record.quantity is null or line_record.quantity <= 0 then
      raise exception 'invalid_line_quantity';
    end if;
    if line_record.unit_price_minor is null or line_record.unit_price_minor < 0 then
      raise exception 'invalid_line_price';
    end if;
    subtotal := subtotal + (line_record.quantity * line_record.unit_price_minor);
    line_count := line_count + 1;
  end loop;

  if line_count = 0 then
    raise exception 'invalid_lines';
  end if;

  if subtotal > 2147483647 - p_tax_minor then
    raise exception 'amount_too_large';
  end if;

  insert into public.hospital_counters (hospital_id, name, next_value)
  values (target_hospital, 'invoice', 2)
  on conflict (hospital_id, name)
  do update set next_value = public.hospital_counters.next_value + 1
  returning next_value - 1 into next_value;

  new_invoice_no := 'INV-' || left(target_hospital::text, 8) || '-' || lpad(next_value::text, 6, '0');

  insert into public.invoices (
    hospital_id,
    patient_id,
    invoice_no,
    status,
    subtotal_minor,
    tax_minor,
    total_minor,
    currency,
    issued_at
  ) values (
    target_hospital,
    p_patient_id,
    new_invoice_no,
    p_status,
    subtotal,
    p_tax_minor,
    subtotal + p_tax_minor,
    target_currency,
    case when p_status = 'issued' then now() else null end
  )
  returning id into new_invoice_id;

  insert into public.invoice_lines (
    hospital_id,
    invoice_id,
    description,
    quantity,
    unit_price_minor,
    line_total_minor
  )
  select
    target_hospital,
    new_invoice_id,
    btrim(x.description),
    x.quantity,
    x.unit_price_minor,
    x.quantity * x.unit_price_minor
  from jsonb_to_recordset(coalesce(p_lines, '[]'::jsonb))
    as x(description text, quantity integer, unit_price_minor integer);

  return new_invoice_id;
end;
$$;

revoke execute on function public.create_invoice(uuid, text, integer, text, jsonb) from public, anon;
grant execute on function public.create_invoice(uuid, text, integer, text, jsonb) to authenticated;

create or replace function public.record_invoice_payment(
  p_invoice_id uuid,
  p_amount_minor integer,
  p_payment_method text,
  p_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_hospital uuid := private.current_hospital_id();
  target_invoice public.invoices%rowtype;
  paid_total bigint;
  credit_total bigint;
  balance bigint;
  new_payment_id uuid;
begin
  if target_hospital is null or not (select private.has_permission('billing:create')) then
    raise exception 'not_authorized';
  end if;

  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'invalid_amount';
  end if;

  if p_payment_method not in ('cash', 'card', 'insurance', 'transfer') then
    raise exception 'invalid_payment_method';
  end if;

  select *
  into target_invoice
  from public.invoices
  where id = p_invoice_id
    and hospital_id = target_hospital
    and deleted_at is null
  for update;

  if not found then
    raise exception 'invalid_invoice';
  end if;

  if target_invoice.status in ('draft', 'voided', 'credited') then
    raise exception 'invoice_closed';
  end if;

  select coalesce(sum(amount_minor), 0)
  into paid_total
  from public.payments
  where invoice_id = p_invoice_id
    and hospital_id = target_hospital
    and deleted_at is null;

  select coalesce(sum(amount_minor), 0)
  into credit_total
  from public.credit_notes
  where invoice_id = p_invoice_id
    and hospital_id = target_hospital;

  balance := target_invoice.total_minor - paid_total - credit_total;

  if balance <= 0 then
    raise exception 'invoice_paid';
  end if;

  if p_amount_minor > balance then
    raise exception 'amount_exceeds_balance';
  end if;

  insert into public.payments (
    hospital_id,
    invoice_id,
    amount_minor,
    currency,
    payment_method,
    reference
  ) values (
    target_hospital,
    p_invoice_id,
    p_amount_minor,
    target_invoice.currency,
    p_payment_method,
    nullif(btrim(p_reference), '')
  )
  returning id into new_payment_id;

  update public.invoices
  set status = case
    when paid_total + p_amount_minor + credit_total >= target_invoice.total_minor then 'paid'
    else 'partially_paid'
  end
  where id = p_invoice_id
    and hospital_id = target_hospital;

  return new_payment_id;
end;
$$;

revoke execute on function public.record_invoice_payment(uuid, integer, text, text) from public, anon;
grant execute on function public.record_invoice_payment(uuid, integer, text, text) to authenticated;

create or replace function public.void_invoice(p_invoice_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_hospital uuid := private.current_hospital_id();
  affected integer;
begin
  if target_hospital is null or not (select private.has_permission('billing:update')) then
    raise exception 'not_authorized';
  end if;

  update public.invoices
  set status = 'voided',
      voided_at = now(),
      voided_by = auth.uid(),
      void_reason = nullif(btrim(p_reason), '')
  where id = p_invoice_id
    and hospital_id = target_hospital
    and deleted_at is null
    and status not in ('voided', 'paid');

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

revoke execute on function public.void_invoice(uuid, text) from public, anon;
grant execute on function public.void_invoice(uuid, text) to authenticated;
