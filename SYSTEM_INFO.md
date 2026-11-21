# MediCore HMS — Complete System Information

Generated: 2026-11-21
Repository: `D:\projects\clinic_system-`

---

## 1. Project Overview

MediCore HMS (Hospital Management System) is an enterprise multi-tenant hospital/clinic management system. It stores patient health data (PHI), money (billing/finance), staff records (HR), and stock (pharmacy/inventory). Correctness, security, and auditability beat speed and visual flash.

**Current state:** A Next.js prototype transitioning to a real Supabase-backed system. ~40% complete per the project audit (~80% as a clickable demo, ~25-35% as a production system). No real backend, persistence, auth, or tests existed originally; the foundation (migrations, RLS, RBAC, architecture docs) has since been laid.

**Primary entry:** `http://localhost:3000` (dev)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| React | React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix UI primitives) |
| Client state | Zustand |
| Server state | TanStack Query (intended; partially wired) |
| Forms | React Hook Form + Zod resolver |
| Validation | Zod |
| Database target | Supabase Postgres (local dev via Supabase CLI) |
| Auth | Supabase Auth (hospital code + username + password, TOTP MFA, custom access-token hook) |
| Deployment | Vercel |
| Testing | Vitest (unit), pgTAP (DB/RLS), Playwright (E2E), axe (a11y), k6 (load) |
| Charts | recharts |
| Motion | framer-motion |
| Icons | lucide-react |

---

## 3. Directory Tree (top level)

```
D:\projects\clic_system-\
├── .cursor/
├── .editorconfig
├── .env.example
├── .env.local           (gitignored, local overrides)
├── .git/
├── .github/
├── .gitignore
├── .next/
├── AGENTS.md            (agent/developer rules — read first every session)
├── CLAUDE.md            ("Follow /AGENTS.md and the documents it links to.")
├── components.json      (shadcn config)
├── docs/                (architecture, security, RBAC, coding standards, etc.)
├── e2e/                 (Playwright E2E tests — placeholder README)
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── public/
├── README.md
├── src/
│   ├── app/             (Next.js App Router routes)
│   ├── components/      (shared/ + ui/ shadcn primitives)
│   ├── features/        (23 modules: actions.ts, service.ts, repo.ts, schemas.ts, etc.)
│   ├── hooks/
│   ├── lib/             (env, result, money, dates, auth, platform, audit, patients, staff)
│   ├── proxy.ts         (Next.js middleware — coarse route guard, session refresh)
│   ├── server/          (supabase clients, auth actions, admin, platform guards)
│   ├── store/           (Zustand app store)
│   ├── types/           (generated Supabase DB types)
│   └── _legacy/         (quarantine: mock-data, scheduled for removal)
├── supabase/
│   ├── migrations/      (13 SQL migrations)
│   ├── config.toml
│   ├── seed.sql
│   └── tests/           (pgTAP RLS tests)
├── tsconfig.json
├── tsconfig.tsbuildinfo
├── vitest.config.ts
└── SYSTEM_INFO.md       (this file)
```

---

## 4. NPM Scripts

```json
{
  "dev": "next dev -p 3000 --webpack",
  "build": "next build --webpack",
  "start": "next start -p 3000",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run"
}
```

---

## 5. Configuration Files

### package.json (key fields)
- Name: `nextjs_tailwind_shadcn_ts`, version `0.3.0`, private
- Dependencies include: `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `zustand`, `next`, `react`, `react-dom`, `recharts`, `framer-motion`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `server-only`, `sharp`
- Dev deps: `@tailwindcss/postcss`, `tailwindcss` v4, `eslint` v9, `eslint-config-next`, `typescript` v5, `vitest`, `supabase` CLI, `bun-types`, `tw-animate-css`

### tsconfig.json
- `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`, `noEmit: true`
- Path alias `@/*` → `./src/*`
- No `any`, no `@ts-ignore`, no `ignoreBuildErrors`

### next.config.ts
- `reactStrictMode: true`
- `experimental.serverActions.bodySizeLimit: "12mb"`

### eslint.config.mjs
- Flat config extending `eslint-config-next`
- Ignores `node_modules`, `.next`, `out`, `build`, `dist`, `next-env.d.ts`, `*.orig`

### vitest.config.ts
- Node environment, includes `src/**/*.test.ts`, `@` alias → `./src`

### components.json (shadcn)
- Style: `new-york`, RSC: true, TSX: true
- Tailwind CSS: `src/app/globals.css`, baseColor `neutral`, CSS variables: true
- Aliases: components `@/components`, utils `@/lib`, ui `@/components/ui`, lib `@/lib`, hooks `@/hooks`
- Icon library: `lucide`

### supabase/config.toml
- Project ID: `clinic_system-`
- Postgres major version 17, API port 54321, DB port 54322, Studio port 54323
- Realtime enabled, Storage enabled (50MiB limit), S3 protocol enabled, Vector enabled
- Auth: JWT expiry 3600s, refresh token rotation on, signup enabled, email provider enabled, SMS disabled, TOTP MFA disabled in local config
- Rate limits configured for sign-in, token refresh, OTP verification, etc.

---

## 6. Documentation (docs/)

| File | Purpose |
|---|---|
| `AGENTS.md` | Agent/developer rules, non-negotiable rules, definition of done |
| `docs/SCOPE.md` | What is/isn't in scope; module list by phase; i18n decision |
| `docs/ARCHITECTURE.md` | Principles, system overview, layering, folder structure, data access, state, error handling, observability |
| `docs/DATABASE.md` | Migration rules, naming, standard columns, money/quantities, core entities, RLS, audit, seeds, retention |
| `docs/SECURITY.md` | Threat model, compliance position, auth, authorization, data protection, financial integrity, hardening, Supabase checklist, CI/CD, audit/monitoring, incident response, pre-launch gate |
| `docs/MULTI_TENANCY.md` | Tenant model, data model, two admin levels, provisioning, login without email, JWT/RLS, isolation checklist, hospital lifecycle, per-hospital config |
| `docs/RBAC.md` | Permission model (`module:action`), 11 roles + 1 reserved, permission matrix, rules for adding permissions, anti-patterns |
| `docs/CODING_STANDARDS.md` | TypeScript rules, naming, feature module template, Server Actions pattern, React/Next rules, data rules, error handling, imports, tooling, performance, a11y, review checklist |
| `docs/UI_GUIDELINES.md` | Clinical UI principles, tokens, remove list (AI slop purge), layout/navigation, components, clinical safety UI, a11y (WCAG 2.2 AA), writing rules, UI refactor plan |
| `docs/TESTING.md` | Strategy (testing trophy), rules, critical E2E journeys, coverage targets, CI pipeline |
| `docs/GIT_WORKFLOW.md` | Branch model, day-to-day flow, release flow, hotfix, commits/PRs, release checklist, branch protection, environments map, AI agent rules |
| `docs/DEPLOYMENT.md` | Environments, env vars, Vercel setup, DB deployment, backups/recovery, release/rollback, monitoring, go-live checklist |
| `docs/ROADMAP.md` | Phase 0 (stabilize, 1 wk), Phase 1 (foundation + OPD MVP, 6-8 wks), Phase 2 (hospital ops, 6-8 wks), Phase 3 (hardening/launch, 4-6 wks), Phase 4 (optional modules) |
| `docs/audit/2026-11-14-project-audit.md` | Full project audit (scorecard, feature matrix, security issues S1-S16, P0 bugs, gap analysis, remaining work ~180-280 dev-days) |
| `docs/archive/errors.md` | Git remote setup & file reorganization task instructions |

### AGENTS.md Non-negotiable rules (summary)
1. Never trust the client — all permission checks + validation on server
2. Every table has RLS enabled + policies in the same migration
3. No PHI/billing/HR/stock data in localStorage/sessionStorage/cookies/URLs (theme only)
4. No mock/seed data in production code paths
5. All input validated with Zod at server boundary; same schema reused by form
6. Money = integer minor units + currency code; never floats
7. Finalized financial records and stock movements are append-only
8. Every write to PHI/money/stock/users/permissions produces an audit event (DB trigger, not UI)
9. No `service_role` key in client code or `src/app`; only in `src/server/admin/*` with `import "server-only"`
10. No `any`, no `@ts-ignore`, no `ignoreBuildErrors`; use `unknown` and narrow
11. No compliance/marketing claims in UI unless legally verified
12. No new dependency without justification in PR
13. Never edit a merged migration; add a new one
14. Do not invent features — check SCOPE.md
15. Tenant isolation: `hospital_id NOT NULL` on every domain table; RLS policy; `hospital_id` from session never client input
16. No outbound messaging (no email/SMS/push/chat)

### Definition of done (every task)
Layering (UI → action → service → repository), server-side permission check tested, Zod schema on input, RLS policy tested if data access changed, loading/empty/error/forbidden states, keyboard accessible + axe, unit/integration tests; `npm run lint`, `typecheck`, `test` pass; no `console.log`, no commented-out code, no TODO without issue number; PR < 400 lines targeting `develop`.

---

## 7. Architecture

### System overview
```
Browser ── HTTPS ──> Vercel (Next.js 16)
                        ├─ proxy.ts            (session refresh, coarse route guard, security headers)
                        ├─ Server Components   (read data, render)
                        ├─ Server Actions      (mutations)
                        ├─ Route Handlers      (webhooks, exports, cron)
                        └─ services → repositories
                                               │  user JWT (RLS enforced)
                                               ▼
                                         Supabase
                                           ├─ Postgres (RLS, triggers, functions, pg_cron)
                                           ├─ Auth (hospital code + username + password, TOTP MFA, custom access token hook; sends no email)
                                           ├─ Storage (private buckets, signed URLs)
                                           └─ Realtime (queues, bed board only)
```

### Layering (strict, one direction)
```
UI (components) → Action / Route Handler → Service → Repository → Supabase
```

| Layer | Location | Responsibility | May NOT |
|---|---|---|---|
| UI | `src/features/<module>/components` | Render, local state, call actions | Call Supabase, hold business rules |
| Action | `src/features/<module>/actions.ts` | `"use server"`. Auth, authorize, Zod-parse, call service, revalidate, return `Result` | Contain SQL or business logic |
| Service | `src/features/<module>/service.ts` | Business rules, state transitions, orchestration, RPCs for atomic multi-row work | Import React or Next APIs |
| Repository | `src/features/<module>/repo.ts` | Typed queries via Supabase client; only place that knows table names | Check permissions (RLS does) |
| Shared | `src/lib`, `src/server` | Supabase clients, auth helpers, audit helpers, errors, money, dates | Depend on features |

### Folder structure
```
src/
  app/
    (auth)/login, mfa, reset-password
    (app)/                       # authenticated shell
      layout.tsx                 # AppShell, loads session + permissions once
      dashboard/page.tsx
      patients/ (page, [id]/, new/)
      appointments/ visits/ pharmacy/ inventory/ lab/ billing/ ...
      admin/users, audit-log, settings        # hospital_admin: own hospital only
    (platform)/hospitals         # super_admin only: list, create, suspend, reset admin password
    api/                         # webhooks, exports, cron only
    error.tsx global-error.tsx not-found.tsx
  features/<module>/
    components/ actions.ts service.ts repo.ts schemas.ts types.ts permissions.ts *.test.ts
  components/ui/                 # shadcn primitives (only those in use)
  components/shared/             # DataTable, PageHeader, EmptyState, ConfirmDialog, StatusBadge
  lib/                           # money.ts, dates.ts, result.ts, errors.ts, utils.ts
  server/
    supabase/ (server.ts, browser.ts, admin.ts)   # admin.ts is server-only
    auth/ (session.ts, require-permission.ts)
    audit/ (context.ts)
supabase/
  migrations/ seed.sql tests/ (pgTAP RLS tests) config.toml
```

### Data access rules
- Server code creates Supabase client **with caller's JWT** so RLS applies (default for everything)
- `service_role` (bypasses RLS) only for: hospital/user provisioning, cron, migrations/seeds, system tasks — in `src/server/admin/` with `import "server-only"`
- Multi-row business operations are Postgres functions via `supabase.rpc()` in one transaction, `SELECT … FOR UPDATE`, write movements + audit rows
- Types from `supabase gen types typescript`; regenerate in every schema-changing PR

### State management
- Server state: Server Components + Server Actions + `revalidatePath`/`revalidateTag`; TanStack Query for client-heavy lists
- Client UI state: `useState`/`useReducer` first; Zustand only for cross-component UI state (sidebar, command palette, POS cart) — **never domain data as source of truth**
- Forms: React Hook Form + Zod resolver; schema in `schemas.ts` shared with action

### Performance rules (from ARCHITECTURE §7)
- Keyset/cursor pagination for large tables; `OFFSET` only for small admin tables
- Patient search: `pg_trgm` GIN indexes + `unaccent`, debounce 250ms, min 2 chars
- Every FK and `hospital_id` first in indexes; `EXPLAIN ANALYZE` for queries > 100k rows
- Append-only tables (`audit_events`, `stock_movements`, `vitals`, `payments`): partition by month
- Dashboards: summary tables / materialized views refreshed by `pg_cron`, never aggregate raw tables on page load
- Connection pooling via Supavisor transaction mode for runtime; direct connection only for migrations
- Realtime only for OPD queue, bed board, lab worklist, critical alerts; `hospital_id` filter
- Cache reference data with `unstable_cache`; never cache PHI across users
- `pg_cron` for nightly jobs (expiry scan, stock alerts, partition maintenance, KPI refresh); idempotent
- Files: Supabase Storage private buckets, signed URLs ≤ 60s, size/MIME limits
- Exports: streamed from Route Handler or background job; never 100k-row array in memory
- Bundle: route-level code splitting; `next/dynamic` for charts/heavy modals; < 200 KB JS first load per route
- `version` integer on editable aggregates; `UPDATE … WHERE id=$1 AND version=$2` for optimistic concurrency
- Document numbers (MRN, invoice no, PO no) from database sequences, never client

---

## 8. Source Code — `src/` details

### `src/app/` (App Router routes)
- `audit/`, `change-password/`, `home-client.tsx`, `layout.tsx`, `loading.tsx`, `login/`, `mfa/`, `not-found.tsx`, `page.tsx`, `patients/`, `platform/`, `staff/`
- `error.tsx`, `global-error.tsx` (implied by architecture)

### `src/features/` — 23 modules
`appointments`, `audit-log`, `auth`, `billing`, `blood-bank`, `dashboard`, `emergency`, `emr`, `finance`, `hr`, `inventory`, `ipd`, `lab`, `nursing`, `opd`, `patients`, `pharmacy`, `purchases`, `radiology`, `reports`, `settings`, `suppliers`, `users-roles`

Each module follows: `components/`, `actions.ts` (`"use server"`), `service.ts`, `repo.ts`, `schemas.ts` (Zod), `types.ts`, `permissions.ts`, `*.test.ts`

### `src/components/`
- `shared/` — App shell and cross-module components
- `ui/` — shadcn/ui primitives (only those in use: alert, avatar, badge, button, card, dialog, dropdown-menu, input, label, select, switch, textarea, toast, toaster)

### `src/lib/`
- `env.ts` — Zod-validated public + server env (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- `result.ts` — `Result<T>` type (`{ok: true, data}` | `{ok: false, error: {code, message, fields?}}`) + `ok()`/`fail()` helpers
- `dates.ts` — date utilities (UTC storage, `Intl` display in hospital timezone)
- `ids.ts` — ID helpers
- `print.ts` — print utilities
- `rbac.ts` + `rbac.test.ts` — RBAC helpers
- `storage.ts` — storage helpers
- `theme.ts` — theme system
- `utils.ts` — utilities
- `auth/` — `claims.ts`, `identifier.ts`, `mfa.ts`, `routing.ts` (+ tests)
- `platform/` — `schema.ts`, `schema.test.ts`
- `patients/` — `schema.ts`, `schema.test.ts`
- `staff/` — `schema.ts`, `schema.test.ts`
- `audit/` — `query.ts`, `query.test.ts`

### `src/server/`
- `supabase/` — `server.ts` (client with caller's JWT), `browser.ts`, `admin.ts` (`server-only`, service_role)
- `auth/` — `actions.ts`, `mfa-actions.ts`, `mfa.ts`, `require-permission.ts`, `session.ts`
- `admin/` — `staff.ts`
- `platform/` — `guard.ts`, `hospitals.ts`

### `src/store/`
- `app-store.ts` — Zustand store (1,885 lines originally; being decomposed)

### `src/types/`
- `database.ts` — Generated Supabase DB types (`Database`, `Tables`, `TablesInsert`, `TablesUpdate`, `Enums`, `CompositeTypes`, `Json`)

### `src/hooks/`
- `use-mobile.ts`, `use-toast.ts`

### `src/_legacy/`
- `mock-data/data.ts` — 48 static datasets (1,286 lines), the old fake database
- `README.md` — "Scheduled for removal per docs/SCOPE.md. Do not import from here in new code."

### `src/proxy.ts`
- Next.js middleware (coarse gate): creates Supabase server client, parses session claims, resolves route, redirects unauthenticated/unauthorized users. Never replaces per-action checks.

---

## 9. Database — `supabase/migrations/`

13 migrations (all timestamped, immutable after merge):

| # | File | Purpose |
|---|---|---|
| 1 | `20261115090000_tenancy.sql` | `private` + `audit` schemas; `touch_updated_at` trigger; `hospitals`, `profiles`, `hospital_settings`, `hospital_counters` tables; RLS; `current_hospital_id()`, `current_role()`, `is_super_admin()`, `has_permission()` helper functions; RLS policies |
| 2 | `20261115090100_rbac.sql` | `roles`, `permissions`, `role_permissions`, `user_roles` tables; seeded 13 roles + permissions + grants; RLS; `custom_access_token_hook` (puts `hospital_id`, `role`, `permissions[]` in JWT) |
| 3 | `20261115090200_audit.sql` | Audit infrastructure |
| 4 | `20261115090300_audit_hospital_fk.sql` | Audit hospital FK |
| 5 | `20261115090400_platform_audit.sql` | Platform audit |
| 6 | `20261115090500_tighten_grants.sql` | Tighten grants |
| 7 | `20261115090600_platform_audit_rpc.sql` | Platform audit RPC |
| 8 | `20261115100000_audit_user_roles_scope.sql` | Audit user roles scope |
| 9 | `20261115100100_audit_events_rpc.sql` | Audit events RPC |
| 10 | `20261115110000_patients.sql` | `patients` table (MRN allocation, soft delete, optimistic concurrency, audit trigger); `register_patient()`, `archive_patient()`, `list_patients()` RPCs |
| 11 | `20261115120000_patient_merge.sql` | Patient merge |
| 12 | `20261115120100_patient_merge_allow_archive.sql` | Patient merge allow archive |
| 13 | `20261115130000_patient_documents.sql` | Patient documents |

### Database rules (DATABASE.md)
- Schema defined **only** by SQL migrations (Supabase CLI); Prisma removed
- One migration = one logical change, timestamped, immutable after merge
- Every table: RLS enabled, policies, indexes, audit trigger, `updated_at` trigger — in same migration
- Local dev: `supabase start`, `supabase db reset` (migrations + seed). Staging/prod: migrations via CI only
- Destructive changes: expand → migrate → contract across ≥ 2 releases
- Naming: `snake_case`, plural tables, singular columns, FKs as `<table>_id`, booleans `is_/has_`, timestamps `*_at`
- Standard columns on every domain table: `id` (uuid PK), `hospital_id` (uuid NOT NULL), `created_at/updated_at`, `created_by/updated_by`, `deleted_at` (soft delete), `version` (optimistic concurrency)
- Money: `bigint` minor units + `char(3)` currency; quantities `numeric(14,3)`; tax rates `numeric(5,2)`
- Human-readable numbers (MRN, invoice no, PO no) from per-hospital `hospital_counters` in a function

### Core entity groups (planned)
Identity/tenancy: `hospitals`, `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`, `hospital_settings`, `hospital_counters`, `departments`
Patients: `patients`, `patient_contacts`, `patient_identifiers`, `patient_documents`, `patient_merges`
Care: `appointments`, `provider_schedules`, `visits`, `vitals`, `clinical_notes`, `diagnoses`, `allergies`, `problems`, `prescriptions`, `prescription_items`
Orders: `lab_orders`, `lab_order_items`, `lab_results`, `imaging_orders`, `imaging_reports`
Money: `services`, `price_lists`, `invoices`, `invoice_lines`, `payments`, `credit_notes`, `expenses`
Stock: `items`, `item_batches`, `stock_locations`, `stock_movements` (append-only), `stock_adjustments`
Purchasing: `suppliers`, `purchase_orders`, `po_lines`, `goods_receipts`, `purchase_returns`, `supplier_ledger`
Inpatient: `wards`, `beds`, `admissions`, `bed_transfers`, `discharge_summaries`
HR: `departments`, `staff`, `shifts`, `attendance`, `leave_requests`
System: `audit.events` (partitioned), `access_grants` (break-glass), `settings`

### RLS pattern (every domain table)
```sql
alter table public.<table> enable row level security;
create policy <table>_select on public.<table> for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and private.has_permission('<module>:read')
  and deleted_at is null
);
```
- `anon` role: no table access
- Sensitive tables (`audit.events`, `payments`, `stock_movements`): INSERT only via security-definer functions; REVOKE UPDATE/DELETE from `authenticated` and `anon`
- Every policy tested with pgTAP: allowed role, wrong role, other hospital, anon

### Audit
`audit.events(id, occurred_at, hospital_id, actor_id, actor_role, action, table_name, record_id, before jsonb, after jsonb, request_id, ip, reason)`. Generic trigger on every sensitive table; append-only, partitioned monthly; optional hash chain for tamper evidence.

---



---

## 11. Authentication & Multi-tenancy

### Login (no email)
- Form: Hospital code + Username + Password (+ TOTP if MFA)
- Server maps to internal identifier `username@code.medicore.invalid` (`.invalid` TLD, never receives mail)
- Signups off, email confirmation off, no SMTP configured
- Users created only by admins via `auth.admin.createUser(email_confirm: true)`; temporary password, forced change at first login
- No self-service password reset; hospital admin resets staff, super admin resets hospital admins
- MFA: TOTP required for super_admin, hospital_admin, accountant, hr_manager, pharmacist, inventory_manager; recommended for all
- Sessions: access token ≤ 1 h, refresh rotation on, idle timeout 15–30 min, absolute max 12 h
- Lockout: 5 failed logins → progressive delay + alert; rate-limit at edge
- Generic login errors only

### Tenant model
- Platform = whole system (run by `super_admin`)
- Hospital = tenant; super admin creates it; gets every module; flat (no branches in v1)
- User belongs to exactly one hospital; `super_admin` belongs to none
- Every row has `hospital_id`; RLS isolates hospitals (database-enforced, not app-only)
- `super_admin` cannot read any hospital's clinical/billing/HR/stock data
- Hospital lifecycle: `active` → `suspended` (logins blocked, data kept) → `active` or `archived` (read-only)
- No outbound messaging of any kind

### RBAC (11 roles + super_admin)
| Role | Can | Cannot |
|---|---|---|
| super_admin | Create/suspend/reactivate hospitals, create first hospital admin, reset hospital-admin passwords, platform audit log | Read any hospital's patient/billing/HR/stock data |
| hospital_admin | Dashboards, reports, approvals, user accounts/password resets for own hospital, staff/department mgmt, settings | Edit clinical records, post payments |
| doctor | Patients (read/update in care), visits, notes, prescriptions, lab/imaging orders, results read, own schedule | Billing void, stock, HR, user admin |
| nurse | Vitals, nursing tasks, medication admin, bed board, patient read, nursing notes | Prescribe, billing, stock adjust |
| receptionist | Register/search/edit demographics, appointments, queue, create invoice drafts | Clinical notes, results, void, discounts |
| cashier | Create invoices from orders, take payments, print receipts, daily close | Edit price list, void without approval, clinical data beyond invoice needs |
| pharmacist | Read prescriptions, dispense, POS sale, pharmacy stock, batch/expiry, returns | Edit diagnoses, post payments outside POS, HR |
| lab_technician | Lab worklist, sample status, enter results, verify (senior), print reports | Prescriptions, billing, full chart |
| radiology_technician | Imaging worklist, upload report, status | Everything else |
| inventory_manager | Items, batches, receipts, POs (create), adjustments (request), supplier records | Approve own PO, clinical data, payments |
| accountant | Invoices read, payments read, expenses, supplier payables, financial reports, PO approval (finance) | Clinical data, stock edits |
| hr_manager | Staff records, shifts, attendance, leave approvals | Clinical data, finance, user permissions |
| auditor (read-only) | Audit log, reports, read-only across modules | Any write |

Permissions are atomic `module:action` strings. Separation of duties: PO creator ≠ approver; invoice creator ≠ voider; stock adjuster ≠ approver above threshold.

---

## 12. Security model

### Threat model (top threats)
Stolen credentials, privilege abuse by insiders, financial fraud, data exfiltration, web attacks (XSS/CSRF/injection/SSRF/IDOR), supply chain, misconfiguration, data loss.

### Compliance position
- Compliance regime depends on country (HIPAA US, GDPR EU/UK, local health-data laws). Owner must confirm jurisdiction.
- Do not store real patient data until contracts/BAAs in place (Supabase HIPAA add-on + Vercel Enterprise BAA — verify with vendors).
- Never display "HIPAA compliant", "SOC 2", "encrypted end-to-end", etc. in the UI.
- Choose Supabase region based on data-residency law.

### Application hardening
- Headers: CSP (nonce-based, no unsafe-eval, frame-ancestors 'none'), HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (camera/mic/geolocation off), COOP same-origin
- Input: Zod at every boundary, `.strict()`, length limits, no `dangerouslySetInnerHTML`, no SQL string building, parameterized queries/RPC
- CSRF: Server Actions same-origin; Route Handlers verify `Origin` + auth; no state-changing GET
- Secrets: only in Vercel/Supabase env settings; `NEXT_PUBLIC_*` only Supabase URL + anon key; `.env*` gitignored; `.env.example` has no real values
- Error pages never show stack traces or SQL
- Rate limiting on auth, search, export, PHI bulk endpoints

### Supabase security checklist
- RLS on every table; CI fails if any table has RLS off
- No policy with `using (true)` on non-reference table
- `anon` role cannot read any table or call any function
- Security-definer functions set `search_path = ''`, live in `private` schema
- `service_role` key only in server-side env on Vercel, never in `NEXT_PUBLIC_*`
- Storage buckets private; policies mirror table access
- Public signups disabled; no email provider used
- PITR enabled on production; restore drill quarterly
- Separate Supabase projects for staging/production

### Audit & monitoring
- Logged: logins/logouts/failures, MFA events, role/permission changes, every create/update/void on PHI/money/stock/HR, PHI reads (chart open, print, export), break-glass, config changes, exports
- Logs append-only, readable only by `auditor` and `super_admin`, cannot be cleared from UI
- Alerts: login failure spikes, new admin, role escalation, bulk export, break-glass use, RLS/policy changes, backup failure, 5xx spike

### Incident response (minimum)
Detect → Contain (revoke sessions, rotate keys, disable account) → Assess (audit events) → Notify (legal/regulatory, within deadlines — HIPAA/GDPR 72h examples) → Recover (PITR if needed) → Review (post-mortem within 5 working days)

### Pre-launch security gate (all must be true)
BAAs/DPAs signed; fake auth/demo credentials/false claims removed; RLS tests green; no `service_role` in client bundle (CI grep); MFA enforced for privileged roles; audit log append-only and verified; restore drill performed and timed; pen test done; incident plan + contact list printed.

---

## 13. Audit findings (2026-11-14)

### Overall score: ~38.8% (~40% complete, ~60% remaining)
| Dimension | Weight | Completion | Weighted |
|---|---|---|---|
| UI/design system | 15% | 85% | 12.8 |
| Module screens/breadth | 15% | 80% | 12.0 |
| Functional depth/workflows | 20% | 55% | 11.0 |
| Data persistence | 15% | 5% | 0.8 |
| Backend/API | 10% | 2% | 0.2 |
| Auth & session | 10% | 10% | 1.0 |
| Security & compliance | 5% | 10% | 0.5 |
| QA/testing | 5% | 0% | 0.0 |
| DevOps/docs | 5% | 10% | 0.5 |

### P0 critical bugs
P0-1 No persistence of operational data (lost on refresh)
P0-2 Any non-empty credentials authenticate (total auth bypass)
P0-3 `src/pages` exposes 25 unauthenticated routes (auth bypass via URL) — since restructured to `src/features`
P0-4 Backup restore lost after reload
P0-5 RBAC role mismatch disables nav for two demo roles
P0-6 PHI in unencrypted localStorage + false HIPAA claims
P0-7 Client-only authorization (bypassable via devtools)
P0-8 No error boundaries (one render error can blank app)
P0-9 Type checks skipped at build (`ignoreBuildErrors: true`) — since fixed
P0-10 Prisma/database entirely unused — since replaced by Supabase migrations
P0-11 Auto-backup never executes
P0-12 Login screen claims SSO/SAML/LDAP supported

### Security issues S1–S16
Includes fake auth, hardcoded demo credentials, no session/token, RBAC only in browser, PHI in localStorage, false compliance claims ("HIPAA Compliant", "SOC 2", "99.99% uptime", "Trusted by 240+ hospitals"), no input validation, no CSRF/CSP/headers/rate limiting, no audit immutability, no secrets management, TypeScript errors ignored, public unauthenticated routes, downloadable JSON backup with all PHI, no dependency scanning.

### Remaining work estimate: ~180–280 developer-days (~8–13 months for one developer, 4–6 months for small team)

---

## 14. Git workflow

### Branch model
```
main ← production (protected, deployable, only from develop or hotfix)
 └─ develop ← integration + staging (protected, all features land here first)
     ├─ feature/<issue>-short-name
     ├─ fix/<issue>-short-name
     ├─ chore/<short-name>
     └─ refactor/<short-name>
main ← hotfix/<issue>-short-name (urgent production fix; merged to main AND back to develop)
```

### Flow
1. `git checkout develop && git pull`
2. `git checkout -b feature/<issue>-short-name`
3. Small commits, rebase on develop regularly
4. Push, open PR into `develop` (PR template: what/why, screenshots, how tested, DB changes, permissions changed, security impact, checklist)
5. CI: lint, typecheck, unit, DB pgTAP, build, e2e smoke, secret scan, dependency audit
6. Vercel preview against staging Supabase
7. Review (1 approval min; 2 for security/money/RBAC/migration)
8. Squash merge into `develop`
9. `develop` auto-deploys to staging

### Release flow
Freeze → release checklist on staging → PR `develop → main` titled `release: vX.Y.Z` → all checks green + owner approval + migration review → merge commit (not squash) → tag `vX.Y.Z` → CI applies production migrations (manual approval) → Vercel promotes to production → smoke test → rollback if broken → merge main back into develop

### Commit convention: Conventional Commits
`feat(billing): add credit note`, `fix(pharmacy): block dispensing expired batch`, `chore(deps): bump zod`, etc. Subject ≤ 72 chars, imperative, no period. One logical change per PR, target < 400 changed lines.

### AI agent rules
- Branch from `develop` for each task; never work on `main`/`develop`
- Never force-push, rewrite shared history, or merge own PR
- No unrelated changes bundled
- If PR needs migration, say so at top of PR description
- Do not modify CI, branch protection, `docs/SECURITY.md`, or `docs/RBAC.md` unless explicitly asked

---

## 15. Deployment

### Environments
| Env | App | Database | Purpose |
|---|---|---|---|
| Local | `next dev` | `supabase start` | Development |
| Preview | Vercel preview per PR | Staging Supabase | Review |
| Staging | `develop` → stable domain | Staging Supabase project | Integration, UAT, demos |
| Production | `main` → production domain | Production Supabase project | Real use |

Two separate Supabase projects (staging, production). Different keys, users, buckets. Staging never contains real patient data.

### Env vars
- `NEXT_PUBLIC_SUPABASE_URL` (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public — safe only because RLS enforced)
- `SUPABASE_SERVICE_ROLE_KEY` (server only, bypasses RLS, production scope only)
- `DATABASE_URL` (pooler, server/CI only)
- `DIRECT_URL` (CI only, migrations)
- `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (mixed)
- `APP_ENV` (`local\|staging\|production`)

### Vercel
- Framework: Next.js; Production branch: `main`; `develop` → staging domain; Preview Authentication on
- Region: closest to Supabase region
- Firewall/WAF rate limits on `/login`, `/api/*`, export routes
- Cron: `vercel.json` crons call `/api/cron/*` routes secured with secret; jobs idempotent

### Backups & recovery
- Production: PITR + daily backups; retention per legal requirement
- Restore drill every quarter into scratch project; RPO ≤ 15 min, RTO ≤ 4 h (suggested)
- Storage objects backed up separately
- No in-app backup/restore (do not add one)

### Rollback order
1. Vercel instant rollback to previous deployment
2. Suspend affected hospital or disable affected action
3. Forward-fix migration
4. PITR restore only for data corruption

### Monitoring
- Uptime check on `/api/health` (no PHI, checks DB reachability)
- Alerts per SECURITY.md §9
- Dashboards: error rate, p95 latency, DB CPU/connections, slow queries, auth failures, storage size

### Go-live checklist
Security gate, load test passed, restore drill done, UAT sign-off by each department head, staff training done, downtime procedure (paper fallback) printed, support contact/on-call defined, data migration rehearsed twice on staging.

---

## 16. Testing

### Strategy (testing trophy)
| Layer | Tool | What | Required for |
|---|---|---|---|
| Static | TS strict, ESLint, Prettier | Types, a11y lint, hooks rules | Every PR |
| Unit | Vitest | Money, dates, state machines, Zod schemas, service rules (repo mocked) | Every service |
| Database | pgTAP | RLS policies, constraints, triggers, Postgres functions | Every migration |
| Integration | Vitest + local Supabase | Actions → service → DB with real RLS and real users per role | Every module |
| E2E | Playwright | Critical journeys by role; axe a11y scan | Every release |
| Security | gitleaks, CodeQL, npm audit, ZAP baseline | Secrets, vulns, headers | CI + pre-release |
| Load | k6 | Search, OPD queue, POS, dashboard at concurrency | Before go-live, per major release |

### Rules
- RLS/permission tests most important: allowed role can, other roles cannot, another hospital cannot, anon cannot
- Every Server Action tested: unauthenticated, forbidden, invalid input, success, conflict
- Financial/stock functions: rounding, concurrency (two simultaneous dispenses of last unit), idempotency (double submit), reversal
- State machines: every valid + sample invalid transitions
- Tests deterministic: no real time, no random, no network; inject clock and ids
- Tenant-isolation test mandatory: seed hospitals A + B with rows in every table, sign in as A, assert zero rows from B everywhere (including storage and RPCs); discovers tables from catalog automatically
- Test data synthetic; never copy production data to non-production
- Bug fix PRs include a test that fails before the fix
- Coverage: services/utils ≥ 85% lines; Zod schemas 100% of branches that matter; every RLS policy tested

### Critical E2E journeys (smoke set)
0. Super admin creates hospitals A and B; A's admin logs in with temp password, forced to change, creates users, cannot see B
1. Login with MFA → role-appropriate menu → forbidden route shows 403
2. Receptionist: register patient → book appointment → check in
3. Doctor: open visit → vitals visible → note + prescription + lab order
4. Pharmacist: dispense prescription → stock decreases → batch FEFO respected
5. Cashier: invoice → partial payment → receipt → void blocked without approval
6. Lab: result entry → verify → doctor sees result
7. Inventory: PO create → approve by other user → receive goods → stock up
8. Auditor: sees audit events; cannot edit anything

### CI pipeline
`install → lint → typecheck → unit → supabase start → db tests → integration → build → e2e smoke → gitleaks/codeql/audit → report`. Required to merge. Nightly: full E2E + ZAP baseline against staging.

---

## 17. Scope (SCOPE.md)

### Product statement
Web-based, multi-tenant hospital/clinic management system. Platform owner (`super_admin`) creates hospitals; each hospital is an isolated tenant getting every module. Target ~500 staff users per hospital. Manages patient journey (register → appointment → visit → orders → dispense/bill → follow-up), money, stock, staff, with full audit trail.

**NOT** a chat platform, telehealth platform, PACS/imaging viewer, or full ERP.

### Phase 1 (MVP) module list
0. Platform: super admin creates/suspends/reactivates hospitals
1. Auth (hospital code + username + password + MFA), users, roles, permissions
2. Patients (register, edit, search, merge duplicates, archive, documents)
3. Appointments (schedule, reschedule, cancel, doctor availability, conflicts)
4. Visits/OPD (queue, vitals, consultation, orders, completion)
5. EMR-lite (notes, diagnoses, allergies, problem list, prescriptions, history timeline)
6. Billing (service catalog, invoices, payments, void/credit note, receipts)
7. Pharmacy (prescription → dispense, POS sale, batches, expiry)
8. Inventory (one stock engine shared with pharmacy: items, batches, movements, adjustments, reorder alerts)
9. Lab (orders, sample status, result entry, verify, print)
10. Audit log (read-only viewer, filters, export)
11. Dashboard (real, per-role) and Settings

### Phase 2
IPD (wards, beds, admit/transfer/discharge, discharge summary) · Emergency (triage, disposition) · Nursing (task board, vitals, MAR) · Radiology (order/report) · Purchases and Suppliers (PO, goods receipt, return, supplier ledger) · HR-lite · Finance-lite · Real reports.

### Phase 3 (optional)
Blood Bank · Insurance/claims · Payroll · FHIR/HL7 export.

### Functionality to increase
Real persistence, real auth, server-side authorization, immutable audit; edit/soft-delete/merge for patients; state machines with enforced transitions; stock ledger (every stock change is a movement row); atomic multi-step operations in Postgres functions; server-side pagination/search/filtering; optimistic concurrency (`version` column); approvals with separation of duties; break-glass access; user invitation, password reset, session list/revoke, forced MFA; printing/export permission-gated and audited; URL-based routing; clinical safety basics (allergy warning at prescribing, critical value flags, duplicate-patient warning).

### Reports (Phase 2)
Daily collections · Outstanding invoices (aging) · Revenue by service/department/doctor · OPD/IPD census · Top diagnoses · Stock on hand and valuation · Expiring and low stock · Purchases by supplier · Lab turnaround time · Attendance and leave summary · Audit export.

### Non-functional
Increase: security, auditability, data integrity, backup/restore testing, test coverage, WCAG 2.2 AA a11y, observability, error handling, performance budgets, documentation, CI/CD.
Decrease/do not build: PWA/offline, multi-region active-active, microservices, custom theming engine, realtime-everything, multi-currency accounting, full i18n catalog, SOC 2 program.

### i18n decision needed early
Prototype defaults to AFN currency; may need RTL (Dari/Pashto/Arabic). Minimum now: no hardcoded currency symbols, no hardcoded hospital name, all dates/numbers via `Intl`, use logical Tailwind classes (`ms-`, `ps-`, `text-start`) instead of `ml-`, `pl-`, `text-left`.

---

## 18. UI guidelines (UI_GUIDELINES.md)

### Principles
1. Information first — data is the design; chrome stays quiet
2. One accent color (brand) for primary actions and selection; otherwise neutral gray; color reserved for meaning (red=critical, amber=warning, green=success, blue=info)
3. Solid surfaces — no gradients, glass, glow, mesh; hierarchy from spacing, type weight, 1px borders
4. Density with order — compact but aligned; 4px spacing scale
5. Plain words — sentence case, active verbs, specific labels; no marketing copy
6. Truthful UI — nothing labelled "live", "connected", "encrypted", "AI", "certified" unless true and verified

### Tokens
- Neutral scale: 11 steps, slightly cool gray
- Brand: one hue, 3 steps (restrained teal or blue-green appropriate to healthcare)
- Status: danger/warning/success/info with foreground, background, border; contrast ≥ 4.5:1 text, ≥ 3:1 borders/icons
- Radius: one value for controls, one for containers (e.g. 6px/8px)
- Shadow: at most two levels (none, subtle for popovers/dialogs)
- Type: one sans family (Inter, Geist, or system UI); scale 12/13/14/16/20/24/30; body 14px in data screens; `tabular-nums` for all numbers; mono only for IDs/MRN/codes
- Themes: light and dark only; both pass contrast

### Layout
- App shell: left sidebar (grouped by workflow: Front desk, Clinical, Diagnostics, Pharmacy & Stores, Finance, Admin), top bar with hospital name, global search, alerts, user menu
- Sidebar shows only modules user has permission for
- One URL per screen; breadcrumbs on detail pages; back button works
- List screens: filters on top, table, pagination footer; row click opens detail page or side sheet
- Detail screens: persistent patient banner (name, age/sex, MRN, allergies, alerts) on every clinical screen
- Forms: single column, labels above fields, required marked, inline errors, primary action bottom-right, destructive actions separated and confirmed
- Responsive: desktop-first for clinical stations; tablets for nurses/wards; phones for dashboards/approvals only

### Clinical safety UI
- Allergies and critical alerts always visible in patient banner (red, text + icon, not color alone)
- Abnormal lab values flagged with text (H, L, Critical) plus color
- Destructive/irreversible actions require confirmation saying exactly what will happen
- Never auto-dismiss clinical warnings
- Show units next to every number; never truncate drug names or doses

### Accessibility (WCAG 2.2 AA target)
Keyboard reachable + visible focus ring; logical tab order; labels + `aria-describedby` for errors; contrast ≥ 4.5:1; don't rely on color alone; hit targets ≥ 24×24 CSS px (prefer 32+); skip link; `prefers-reduced-motion` honored; landmarks (`header`, `nav`, `main`); axe checks in E2E for every module.

---

## 19. Coding standards highlights

- TypeScript strict; no `any`, `as any`, `@ts-ignore`; `@ts-expect-error` only with comment + issue link
- Prefer `type` for data shapes, `interface` only for extendable contracts; derive types from Zod (`z.infer`) and generated DB types
- Discriminated unions for state; exhaustive `switch` with `never` check; no enums (use `as const` objects/unions)
- Files: kebab-case.ts; components PascalCase.tsx; functions/variables camelCase; constants UPPER_SNAKE_CASE; DB snake_case; Zod schemas `createXSchema`; actions verb-first
- Feature module template: `components/`, `actions.ts` (`"use server"`), `service.ts`, `repo.ts`, `schemas.ts`, `permissions.ts`, `types.ts`, `*.test.ts`
- Server Action pattern: authorize → validate → service → revalidate → return `Result`
- Server Components by default; `"use client"` only for state/effects/handlers/browser APIs
- Fetch in Server Components, not `useEffect`; no `Date.now()`/`Math.random()` during render; stable `key` props
- Dates: UTC `timestamptz` storage; `Intl.DateTimeFormat` display in hospital timezone
- Money: `lib/money.ts` (`Money = {amount, currency}`); format with `Intl.NumberFormat` and hospital currency; no hardcoded `$`
- Hospital name/currency/timezone/tax from `hospital_settings`, never constants; `hospital_id` always from session
- IDs: UUID from database; never generate IDs or document numbers on client
- State machines: explicit `transitions` map in `service.ts` + `CHECK` in DB
- Soft-delete only; list queries filter `deleted_at is null`
- No business rule lives only in a component
- Expected failures → `Result` objects; unexpected → `AppError` subclasses caught at boundary
- Never log PHI, tokens, full request bodies; log IDs; no `console.log` (lint error)
- Absolute imports via `@/`; order: node/react → third party → `@/lib`, `@/server` → `@/features` → relative
- Feature may import another feature only through its `index.ts` public API
- Prettier (printWidth 100), ESLint (`eslint-config-next`, `@typescript-eslint/strict`, `jsx-a11y`, `import/order`), Husky + lint-staged
- Comments explain **why**, not what; no commented-out code; TODOs require issue number `// TODO(#123): …`
- Performance: query only needed columns; paginate; avoid N+1; debounce search; virtualize beyond ~200 rows; bundle < 200 KB JS first load per route
- a11y: shadcn Dialog/AlertDialog (Radix) for modals; every input has label; every icon-only button has `aria-label`; interactive elements are `button`/`a`

---

## 20. Running locally

```bash
npm install
cp .env.example .env.local
# fill in Supabase values
npm run db:generate        # (if Prisma/types needed)
supabase start             # local Supabase
supabase db reset          # runs migrations + seed
npm run dev                # http://localhost:3000
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
```

---

## 21. Key files created by the audit (docs/archive/errors.md lists these)
- `.gitignore` — ignores node_modules, .next, build output, env files, databases, logs, coverage, editors, OS files, `*.orig`, `*.tsbuildinfo`
- `.env.example` — documents DATABASE_URL and optional auth/AI/integration variables
- `eslint.config.mjs` — flat ESLint config using `eslint-config-next`
- `.editorconfig` — UTF-8, LF, 2-space indentation, final newline
- `AGENTS.md`, `CLAUDE.md` — agent rules

---

*End of system information. This file aggregates AGENTS.md, all docs/, the project audit, package.json, tsconfig.json, next.config.ts, components.json, supabase config/migrations, and src/ structure.*