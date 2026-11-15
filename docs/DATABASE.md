# DATABASE.md

## 1. Rules
- Schema is defined **only** by SQL migrations in `supabase/migrations/` (Supabase CLI). Prisma is removed.
- One migration = one logical change, timestamped, immutable after merge.
- Every table is created with: RLS enabled, policies, indexes, audit trigger, `updated_at` trigger — in the same migration.
- Local dev: `supabase start`, `supabase db reset` (runs migrations + seed). Staging and production receive migrations only through CI.
- Destructive changes (drop column/table) use expand → migrate → contract across at least two releases.

## 2. Naming
`snake_case`, plural table names (`patients`), singular columns, FKs as `<table_singular>_id`, booleans `is_/has_`, timestamps `*_at`, enums as lookup tables or Postgres enums for stable sets only (status machines use `text` + `CHECK` so they are easy to extend).
Schemas: `public` (domain), `private` (helper functions, never exposed through the API), `audit` (audit tables).

## 3. Standard columns (every domain table)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK default gen_random_uuid() | Do not expose sequential ids |
| hospital_id | uuid not null references hospitals(id) | Tenant. First column of every index and unique key. See MULTI_TENANCY.md |
| created_at / updated_at | timestamptz not null default now() | UTC always |
| created_by / updated_by | uuid references auth.users | Set by trigger from `auth.uid()` |
| deleted_at | timestamptz null | Soft delete for clinical and master data |
| version | int not null default 1 | Optimistic concurrency, bumped by trigger |

Human-readable numbers (MRN, invoice no, PO no) come from per-hospital counters (`hospital_counters`) in a function, formatted by settings.

## 4. Money and quantities
- Money: `bigint` minor units + `currency char(3)`. Example: 1250 = 12.50. Helper in `src/lib/money.ts`. No floats.
- Quantities: `numeric(14,3)`. Unit stored with the item.
- Rates (tax %): `numeric(5,2)`; computed amounts are stored on the line at posting time (never recompute history from today's rate).

## 5. Core entity groups (initial design, refine in Phase 1)
- Identity and tenancy: `hospitals`, `profiles` (1:1 auth.users; `hospital_id` null only for super_admin), `roles`/`permissions`/`role_permissions` (global system roles), `user_roles`, `hospital_settings`, `hospital_counters`, `departments`
- Patients: `patients`, `patient_contacts`, `patient_identifiers`, `patient_documents`, `patient_merges`
- Care: `appointments`, `provider_schedules`, `visits`, `vitals`, `clinical_notes`, `diagnoses`, `allergies`, `problems`, `prescriptions`, `prescription_items`
- Orders: `lab_orders`, `lab_order_items`, `lab_results`, `imaging_orders`, `imaging_reports`
- Money: `services` (catalog), `price_lists`, `invoices`, `invoice_lines`, `payments`, `credit_notes`, `expenses`
- Stock: `items`, `item_batches`, `stock_locations`, `stock_movements` (append-only), `stock_adjustments`
- Purchasing: `suppliers`, `purchase_orders`, `po_lines`, `goods_receipts`, `purchase_returns`, `supplier_ledger`
- Inpatient: `wards`, `beds`, `admissions`, `bed_transfers`, `discharge_summaries`
- HR: `departments`, `staff`, `shifts`, `attendance`, `leave_requests`
- System: `audit.events` (partitioned), `access_grants` (break-glass), `settings`

Stock quantity on hand is derived from `stock_movements` (or a trigger-maintained `stock_balances` table that can be rebuilt from movements). Never UPDATE a quantity column directly.

## 6. Row Level Security
Every policy answers: "same hospital, and does the user hold the permission?"

```sql
-- private helper, security definer, stable. Reads claims set by the Auth access-token hook.
create or replace function private.has_permission(p text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((auth.jwt() -> 'app_metadata' -> 'permissions') ? p, false);
$$;

-- see MULTI_TENANCY.md §7
create or replace function private.current_hospital_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'hospital_id','')::uuid;
$$;

alter table public.patients enable row level security;

create policy patients_select on public.patients for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and private.has_permission('patients:read')
  and deleted_at is null
);
```
Notes:
- Wrap `auth.uid()`/`auth.jwt()` calls in `(select …)` inside policies where possible so Postgres evaluates them once per statement, not per row.
- Permissions and `hospital_id` are placed in the JWT by a Supabase **custom access token hook**; permission changes take effect at next token refresh. Keep access-token lifetime short (e.g. 15–60 min) and revoke sessions when a role is removed.
- Policies per operation (select/insert/update/delete). No `FOR ALL` shortcuts for sensitive tables. No policy `using (true)`.
- Delete is almost never allowed. Soft delete is an UPDATE guarded by `patients:archive`.
- Sensitive tables (`audit.events`, `payments`, `stock_movements`): INSERT only via security-definer functions; `REVOKE UPDATE, DELETE` from `authenticated` and `anon`.
- `anon` role has no access to any table.
- Test every policy with pgTAP in `supabase/tests/`: allowed role, wrong role, other hospital (tenant isolation), anon.

## 7. Audit
`audit.events(id, occurred_at, hospital_id, actor_id, actor_role, action, table_name, record_id, before jsonb, after jsonb, request_id, ip, reason)`.
Generic trigger on every sensitive table writes INSERT/UPDATE/DELETE events. Reads of PHI (opening a patient chart, printing, exporting) are logged by the server through `audit.log_access()`. Table is append-only, partitioned monthly. Optional: hash chain (`prev_hash`, `hash`) for tamper evidence.

## 8. Migrations workflow
1. `supabase migration new add_lab_orders`
2. Write SQL, RLS, indexes, triggers, pgTAP tests.
3. `supabase db reset` locally, run tests, `supabase gen types`.
4. PR to `develop`. CI applies migrations to a throwaway DB and runs pgTAP.
5. Merge to `develop` → CI applies to **staging** project. Merge to `main` → CI applies to **production** after manual approval.
Rollback strategy: forward-fix migration. Keep a tested restore (PITR) as the real safety net.

## 9. Seeds
`supabase/seed.sql`: reference data (roles, permissions, units) always; demo patients/invoices only for local and staging. Production never receives demo data.

## 10. Retention
Retention periods are legal requirements that vary by country. Owner confirms them. Default policy in code: clinical records and audit events are never hard-deleted by the app; archival moves old partitions to cold storage after the retention window.
