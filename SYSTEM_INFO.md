# MediCore HMS — Complete System Information

Generated: 2026-11-24
Repository: `D:\projects\clinic_system-`
Branch: (local working tree)
Audited against: `AGENTS.md` and all files in `docs/`

---

## 1. Project Overview

MediCore HMS (Hospital Management System) is an enterprise multi-tenant hospital/clinic management system. It stores patient health data (PHI), money (billing/finance), staff records (HR), and stock (pharmacy/inventory). Correctness, security, and auditability beat speed and visual flash.

**Primary entry:** `http://localhost:3000` (dev)

**Overall state:** The system is a Next.js frontend prototype transitioning to a real Supabase-backed system. The database layer (schema, migrations, RLS, RBAC, audit triggers, RPCs) is substantially designed and written in SQL. The application layer (feature modules, Server Actions, services, repositories) is only partially wired — most feature modules contain thin `actions.ts` files but lack the `service.ts`/`repo.ts` layer mandated by `ARCHITECTURE.md`. Persistence, real auth, server-side authorization, and tests are not yet functional end-to-end.

Per the project audit recorded in `SYSTEM_INFO.md` history: ~40% complete overall (~80% as a clickable demo, ~25-35% as a production system). Remaining work estimate: ~180–280 developer-days (~8–13 months for one developer, 4–6 months for a small team).

---

## 2. Tech Stack

| Layer | Technology | Version | Role |
|---|---|---|---|
| Framework | Next.js | 16 (App Router) | App shell, routing, Server Actions, Route Handlers, middleware |
| React | React | 19 | UI library |
| Language | TypeScript | 5 (strict) | Type safety; `strict`, `noImplicitAny`, `noUncheckedIndexedAccess` |
| Styling | Tailwind CSS | v4 | Utility-first styling via `@tailwindcss/postcss` |
| Component primitives | shadcn/ui | — | Radix UI-based primitives in `src/components/ui/` |
| UI motion | framer-motion | ^12.23.2 | (slated for removal per `UI_GUIDELINES.md`) |
| Icons | lucide-react | ^0.525.0 | Icon library |
| Charts | recharts | ^2.15.4 | Dashboard charts |
| Forms | React Hook Form | — | Form state (with Zod resolver) |
| Validation | Zod | ^4.0.2 | Server-boundary input validation |
| Client state | Zustand | ^5.0.6 | Cross-component UI state (`src/store/app-store.ts`) |
| Server state | TanStack Query | — | Intended; partially wired (not in package.json deps) |
| Database | Supabase Postgres | 17 | Primary data store (local dev via Supabase CLI) |
| Auth | Supabase Auth | — | Hospital code + username + password, TOTP MFA, custom access-token hook |
| Storage | Supabase Storage | — | Private buckets, signed URLs |
| Realtime | Supabase Realtime | — | OPD queue, bed board, lab worklist, critical alerts only |
| Deployment | Vercel | — | Hosting target |
| Unit testing | Vitest | ^3.2.7 | Unit/integration tests (`src/**/*.test.ts`) |
| DB testing | pgTAP | — | RLS/constraint/trigger/function tests (`supabase/tests/`) |
| E2E testing | Playwright | — | Critical journeys (`e2e/` placeholder) |
| Accessibility | axe | — | a11y scanning in E2E |
| Load testing | k6 | — | Load tests before go-live |
| Package manager | npm | — | `package-lock.json` committed |

### Dependencies (from `package.json`)

**Production dependencies:**
`@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-toast`, `@radix-ui/react-toggle`, `@radix-ui/react-tooltip`, `@supabase/ssr`, `@supabase/supabase-js`, `class-variance-authority`, `clsx`, `framer-motion`, `lucide-react`, `next`, `react`, `react-dom`, `recharts`, `server-only`, `sharp`, `tailwind-merge`, `zod`, `zustand`

**Dev dependencies:**
`@tailwindcss/postcss`, `@types/react`, `@types/react-dom`, `bun-types`, `eslint`, `eslint-config-next`, `supabase` (CLI), `tailwindcss`, `tw-animate-css`, `typescript`, `vitest`

**Removed / not used (per `SCOPE.md` §2.1):** Prisma, next-auth, next-intl, next-themes, react-markdown, react-syntax-highlighter, @mdxeditor/editor, uuid, @tanstack/react-table, 33 unused shadcn primitives, z-ai-web-dev-sdk, Communications module, Telemedicine, Backup/Restore UI, AI Assistant card, SSO/SAML/LDAP, email/SMS/push providers.

---

## 3. NPM Scripts

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

No dedicated `db:test`, `e2e`, or `db:generate` scripts are defined in `package.json` despite being referenced in docs.

---

## 4. Configuration Files

### `tsconfig.json`
- `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`, `noEmit: true`, `skipLibCheck: true`
- JSX: `react-jsx`, module: `esnext`, moduleResolution: `bundler`
- Path alias: `@/*` → `./src/*`
- Includes `next-env.d.ts`, `.next/types/**/*.ts`
- No `any`, no `@ts-ignore`, no `ignoreBuildErrors`

### `next.config.ts`
- `reactStrictMode: true`
- `experimental.serverActions.bodySizeLimit: "12mb"`
- No `headers()` block configured (CSP/HSTS/etc. headers documented in `SECURITY.md` but not yet implemented in code)

### `eslint.config.mjs`
- Flat config extending `eslint-config-next`
- Ignores `node_modules`, `.next`, `out`, `build`, `dist`, `next-env.d.ts`, `*.orig`
- No `jsx-a11y`, `@typescript-eslint/strict`, or `import/order` plugins explicitly configured (referenced in `CODING_STANDARDS.md` but absent from config)

### `vitest.config.ts`
- Node environment
- Includes `src/**/*.test.ts`
- Alias `@` → `./src`

### `components.json` (shadcn)
- Style: `new-york`, RSC: true, TSX: true
- Tailwind CSS: `src/app/globals.css`, baseColor `neutral`, CSS variables: true
- Aliases: components `@/components`, utils `@/lib`, ui `@/components/ui`, lib `@/lib`, hooks `@/hooks`
- Icon library: `lucide`

### `supabase/config.toml`
- Project ID: `clinic_system-`
- Postgres major version 17
- API port 54321, DB port 54322, Studio port 54323, Realtime enabled, Storage enabled (50MiB limit), S3 protocol enabled, Vector enabled
- Auth: JWT expiry 3600s, refresh token rotation on, signup enabled (`enable_signup = true` — conflicts with `SECURITY.md` which says signups off), email provider enabled, SMS disabled, TOTP MFA enabled
- Rate limits configured for sign-in, token refresh, OTP verification
- Local SMTP enabled (testing server, emails not actually sent)
- Analytics enabled (postgres backend)

### `.env.example`
Documents (names only, no real values):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
- `SUPABASE_SERVICE_ROLE_KEY` (server only, bypasses RLS)
- `DATABASE_URL`, `DIRECT_URL` (server/CI only)
- `APP_ENV` (`local\|staging\|production`)

### `.gitignore`
Ignores: `node_modules`, `.next`, `out`, `build`, `dist`, `coverage`, `*.tsbuildinfo`, `.env`, `.env*.local`, `.env.production`, `supabase_.md`, logs, coverage, editor/OS files, `*.orig`, `*.rej`, `*.bak`, `tmp/`, `temp/`, `.vercel`, `.turbo`

---

## 5. Documentation (docs/)

| File | Purpose | Status |
|---|---|---|
| `AGENTS.md` | Agent/developer rules, 16 non-negotiable rules, definition of done | Authoritative, read first every session |
| `docs/SCOPE.md` | In/out of scope, module list by phase, i18n decision, removed modules | Authoritative |
| `docs/ARCHITECTURE.md` | Principles, system overview, layering, folder structure, data access, state, error handling, observability | Describes target state; partially implemented |
| `docs/DATABASE.md` | Migration rules, naming, standard columns, money/quantities, core entities, RLS, audit, seeds, retention | Describes target state; largely reflected in migrations |
| `docs/SECURITY.md` | Threat model, compliance position, auth, authorization, data protection, financial integrity, hardening, Supabase checklist, CI/CD, audit/monitoring, incident response, pre-launch gate | Authoritative security baseline |
| `docs/MULTI_TENANCY.md` | Tenant model, data model, two admin levels, provisioning, login without email, JWT/RLS, isolation checklist, hospital lifecycle | Authoritative |
| `docs/RBAC.md` | Permission model (`module:action`), 11 roles + 1 reserved, permission matrix, rules for adding permissions, anti-patterns | Authoritative; reflected in migration 2 |
| `docs/CODING_STANDARDS.md` | TypeScript rules, naming, feature module template, Server Actions pattern, React/Next rules, data rules, error handling, imports, tooling, performance, a11y, review checklist | Authoritative; partially followed |
| `docs/UI_GUIDELINES.md` | Clinical UI principles, tokens, remove list (AI slop purge), layout/navigation, components, clinical safety UI, a11y (WCAG 2.2 AA), writing rules, UI refactor plan | UI refactor plan; not yet executed |
| `docs/TESTING.md` | Strategy (testing trophy), rules, critical E2E journeys, coverage targets, CI pipeline | Authoritative; tests not yet in place |
| `docs/GIT_WORKFLOW.md` | Branch model, day-to-day flow, release flow, hotfix, commits/PRs, release checklist, branch protection, environments map, AI agent rules | Authoritative |
| `docs/DEPLOYMENT.md` | Environments, env vars, Vercel setup, DB deployment, backups/recovery, release/rollback, monitoring, go-live checklist | Authoritative; not yet set up |
| `docs/ROADMAP.md` | Phase 0 (stabilize), Phase 1 (foundation + OPD MVP), Phase 2 (hospital ops), Phase 3 (hardening/launch), Phase 4 (optional) | Planning doc |
| `docs/archive/errors.md` | Git remote setup & file reorganization task instructions (historical) | Historical record |

### AGENTS.md Non-negotiable rules (16)
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
14. Do not invent features — check `SCOPE.md`
15. Tenant isolation: `hospital_id NOT NULL` on every domain table; RLS policy; `hospital_id` from session never client input
16. No outbound messaging (no email/SMS/push/chat)

### Definition of done (every task)
Layering (UI → action → service → repository), server-side permission check tested, Zod schema on input, RLS policy tested if data access changed, loading/empty/error/forbidden states, keyboard accessible + axe, unit/integration tests; `npm run lint`, `typecheck`, `test` pass; no `console.log`, no commented-out code, no TODO without issue number; PR < 400 lines targeting `develop`.

---

## 6. Directory Tree (top level)

```
D:\projects\clinic_system-\
├── .cursor/                    (Cursor rules)
├── .editorconfig               (UTF-8, LF, 2-space indent)
├── .env.example                (env template, no real values)
├── .env.local                  (gitignored, local overrides)
├── .git/
├── .github/                    (not present — no CI workflows, PR templates)
├── .gitignore
├── .next/                      (build output, gitignored)
├── AGENTS.md                   (agent/developer rules — read first every session)
├── CLAUDE.md                   ("Follow /AGENTS.md and the documents it links to.")
├── components.json             (shadcn config)
├── docs/                       (13 architecture/security/process docs)
├── e2e/                        (Playwright E2E — README placeholder only)
├── eslint.config.mjs
├── info.md                     (task instruction for this audit)
├── next.config.ts
├── next-env.d.ts               (gitignored)
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── public/
├── README.md
├── scratch_typecheck.log
├── src/
│   ├── app/                    (Next.js App Router routes)
│   ├── components/             (shared/ + ui/ shadcn primitives)
│   ├── features/               (24 modules — mostly actions.ts only)
│   ├── hooks/
│   ├── lib/                    (env, result, money, dates, auth, schemas, etc.)
│   ├── proxy.ts                (Next.js middleware — coarse route guard, session refresh)
│   ├── server/                 (supabase clients, auth actions, admin, platform guards)
│   ├── store/                  (Zustand app store)
│   ├── types/                  (generated Supabase DB types)
│   └── _legacy/                (quarantine: mock-data, scheduled for removal)
├── supabase/
│   ├── migrations/             (27 SQL migrations)
│   ├── config.toml
│   ├── seed.sql                (placeholder — dev/staging only)
│   └── tests/                  (pgTAP — 1 tenant isolation test)
├── SYSTEM_INFO.md              (this file)
├── tsconfig.json
├── tsconfig.tsbuildinfo
├── vitest.config.ts
```

---

## 7. Source Code — `src/` details

### `src/app/` (App Router routes)

| Route | Purpose | Auth status |
|---|---|---|
| `page.tsx` | Landing / home | Public |
| `layout.tsx` | Root layout | — |
| `loading.tsx` | Loading UI | — |
| `error.tsx` | Error boundary | — |
| `not-found.tsx` | 404 | — |
| `home-client.tsx` | Client home component | — |
| `login/page.tsx`, `login/login-form.tsx` | Login (hospital code + username + password) | Public |
| `mfa/page.tsx`, `mfa/mfa-form.tsx` | MFA (TOTP) | Public (post-login step) |
| `change-password/page.tsx`, `change-password-form.tsx` | Password change | Authenticated |
| `patients/layout.tsx`, `patients/page.tsx`, `patients/patient-form.tsx`, `patients/actions.ts` | Patient management | Authenticated (role-gated) |
| `appointments/layout.tsx`, `appointments/page.tsx`, `appointments/appointment-form.tsx` | Appointments | Authenticated |
| `visits/layout.tsx`, `visits/page.tsx`, `visits/visit-form.tsx` | Visits / OPD | Authenticated |
| `lab/layout.tsx`, `lab/page.tsx`, `lab/lab-order-form.tsx` | Lab orders | Authenticated |
| `hr/layout.tsx`, `hr/page.tsx` | HR | Authenticated |
| `staff/layout.tsx`, `staff/page.tsx`, `staff/create-staff-form.tsx`, `staff/staff-row-actions.tsx`, `staff/actions.ts` | Staff management | Authenticated |
| `platform/layout.tsx`, `platform/page.tsx` | Super admin console (hospitals) | super_admin only |
| `purchasing/layout.tsx`, `purchasing/page.tsx` | Purchasing | Authenticated |
| `audit/layout.tsx`, `audit/page.tsx` | Audit log viewer | Authenticated (audit:read) |
| `app/` (nested dir) | Additional app routes | — |

**Note:** `next.config.ts` has no `headers()` block; security headers (CSP, HSTS, etc.) are documented in `SECURITY.md` §6 but not yet implemented in code.

### `src/features/` — 24 modules

Modules: `appointments`, `audit-log`, `auth`, `billing`, `blood-bank`, `dashboard`, `emergency`, `emr`, `finance`, `hr`, `inventory`, `ipd`, `lab`, `nursing`, `opd`, `patients`, `pharmacy`, `purchases`, `purchasing`, `radiology`, `reports`, `settings`, `suppliers`, `users-roles`, `visits`

**Implementation reality (vs. ARCHITECTURE.md template):**

The architecture doc mandates each module have: `components/`, `actions.ts` (`"use server"`), `service.ts`, `repo.ts`, `schemas.ts` (Zod), `types.ts`, `permissions.ts`, `*.test.ts`.

Actual state per module (from filesystem scan):
- Only `actions.ts` files exist (and some `ui-actions.ts`): `appointments`, `billing`, `emr`, `hr`, `lab`, `pharmacy`, `purchasing`, `visits`
- No module has `service.ts`, `repo.ts`, `permissions.ts`, or `types.ts`
- No module has `components/` folder inside `features/`
- Zod schemas live in `src/lib/<module>/schema.ts` (not `src/features/<module>/schemas.ts`)
- Zod schema tests live alongside: `src/lib/<module>/schema.test.ts`

This is a significant gap: the mandated layering (UI → action → service → repository → Supabase) is documented but not implemented in the feature modules. Business logic lives in `actions.ts` or in Postgres RPC functions within migrations.

### `src/components/`

**`shared/`** (app shell and cross-module components):
- `AppShell.tsx` — authenticated shell, loads session + permissions once
- `hospital-shell.tsx` — hospital-specific shell
- `ModalHost.tsx` — modal host (marked `.orig` junk in SCOPE.md)
- `ui-bits.tsx` — small shared UI bits

**`ui/`** (shadcn/ui primitives in use):
`alert`, `alert-dialog`, `avatar`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `select`, `separator`, `sheet`, `skeleton`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toaster`, `toggle`, `tooltip`

### `src/lib/`

| File/Folder | Purpose | Tests |
|---|---|---|
| `env.ts` | Zod-validated public + server env | — |
| `result.ts` | `Result<T>` type + `ok()`/`fail()` helpers | — |
| `money.ts` | `Money = { amount, currency }`, integer minor units | `money.test.ts` |
| `dates.ts` | Date utilities (UTC storage, `Intl` display) | `dates.test.ts` |
| `ids.ts` | ID helpers | — |
| `print.ts` | Print utilities | — |
| `storage.ts` | Storage helpers | — |
| `theme.ts` | Theme system | — |
| `utils.ts` | Utilities | — |
| `app-routes.ts` | Route definitions | — |
| `rbac.ts` + `rbac.test.ts` | RBAC helpers | Yes |
| `auth/claims.ts` + test | Session claims parsing | Yes |
| `auth/identifier.ts` + test | Hospital code + username mapping | Yes |
| `auth/mfa.ts` + test | MFA (TOTP) helpers | Yes |
| `auth/routing.ts` + test | Route resolution for proxy middleware | Yes |
| `platform/schema.ts` + test | Platform schema (Zod) | Yes |
| `patients/schema.ts` + test | Patient Zod schema | Yes |
| `staff/schema.ts` + test | Staff Zod schema | Yes |
| `audit/query.ts` + test | Audit query helpers | Yes |
| `appointments/schema.ts` + test | Appointments Zod schema | Yes |
| `billing/schema.ts` + test | Billing Zod schema | Yes |
| `emr/schema.ts` + test | EMR Zod schema | Yes |
| `hr/schema.ts` + test | HR Zod schema | Yes |
| `lab/schema.ts` + test | Lab Zod schema | Yes |
| `pharmacy/schema.ts` + test | Pharmacy Zod schema | Yes |
| `purchasing/schema.ts` + test | Purchasing Zod schema | Yes |
| `visits/schema.ts` + test | Visits Zod schema | Yes |

### `src/server/`

| File | Purpose | Notes |
|---|---|---|
| `supabase/server.ts` | Supabase client with caller's JWT (RLS applies) | Default for all server code |
| `supabase/browser.ts` | Supabase browser client | Client components |
| `supabase/admin.ts` | Supabase admin client (service_role) | `import "server-only"` |
| `auth/session.ts` | Session helpers | — |
| `auth/require-permission.ts` | `requirePermission()` server-side authz | — |
| `auth/actions.ts` | Auth Server Actions | — |
| `auth/mfa-actions.ts` | MFA Server Actions | — |
| `auth/mfa.ts` | MFA helpers | — |
| `platform/guard.ts` | Platform route guards | — |
| `platform/hospitals.ts` | Hospital provisioning | — |
| `admin/staff.ts` | Admin staff management | — |

### `src/store/`
- `app-store.ts` — Zustand store (~1,885 lines originally); being decomposed. Holds cross-component UI state only (sidebar, command palette, POS cart) — never domain data as source of truth.

### `src/types/`
- `database.ts` — Generated Supabase DB types (`Database`, `Tables`, `TablesInsert`, `TablesUpdate`, `Enums`, `CompositeTypes`, `Json`). Must be regenerated via `supabase gen types typescript` on every schema change.

### `src/hooks/`
- `use-mobile.ts`, `use-toast.ts`

### `src/_legacy/`
- `mock-data/data.ts` — 48 static datasets (1,286 lines), the old fake database
- `README.md` — "Scheduled for removal per docs/SCOPE.md. Do not import from here in new code."

### `src/proxy.ts`
- Next.js middleware (coarse gate): creates Supabase server client, parses session claims, resolves route, redirects unauthenticated/unauthorized users. Never replaces per-action checks. Matcher covers all routes except static assets.

---

## 8. Database — `supabase/migrations/`

27 migrations (all timestamped, immutable after merge). Schema defined **only** by SQL migrations; Prisma removed.

| # | File | Purpose |
|---|---|---|
| 1 | `20261115090000_tenancy.sql` | `private` + `audit` schemas; `touch_updated_at` trigger; `hospitals`, `profiles`, `hospital_settings`, `hospital_counters` tables; RLS; `current_hospital_id()`, `current_role()`, `is_super_admin()`, `has_permission()` helper functions; RLS policies |
| 2 | `20261115090100_rbac.sql` | `roles`, `permissions`, `role_permissions`, `user_roles` tables; seeded 13 roles + permissions + grants; RLS; `custom_access_token_hook` (puts `hospital_id`, `role`, `permissions[]`, `must_change_password` in JWT) |
| 3 | `20261115090200_audit.sql` | `audit.events` partitioned table; `write_audit_event()` generic trigger; audit triggers on hospitals/profiles/hospital_settings/user_roles; RLS on audit.events |
| 4 | `20261115090300_audit_hospital_fk.sql` | Drops hospital FK on audit.events (audit must outlive hospital deletion) |
| 5 | `20261115090400_platform_audit.sql` | Platform audit policy (super_admin only, hospitals/profiles/user_roles tables) |
| 6 | `20261115090500_tighten_grants.sql` | Restricts table-level DML grants; column-level grants only |
| 7 | `20261115090600_platform_audit_rpc.sql` | `list_platform_audit_events()` security-definer RPC |
| 8 | `20261115100000_audit_user_roles_scope.sql` | Rewrites `write_audit_event()` to resolve hospital for user_roles via profiles |
| 9 | `20261115100100_audit_events_rpc.sql` | `list_hospital_audit_events()` paginated RPC with filters |
| 10 | `20261115110000_patients.sql` | `patients` table (MRN allocation, soft delete, optimistic concurrency, audit trigger); `register_patient()`, `archive_patient()`, `list_patients()` RPCs |
| 11 | `20261115120000_patient_merge.sql` | `patient_merges` table; `patients:merge` permission; `merge_patients()` atomic RPC |
| 12 | `20261115120100_patient_merge_allow_archive.sql` | Drops `patients_archive_excludes_merge` constraint (merge needs both deleted_at and merged_into_id) |
| 13 | `20261115130000_patient_documents.sql` | `patient_documents` table; `patient-documents` private Storage bucket; storage RLS policies; `delete_patient_document()`, `log_patient_document_access()` RPCs |
| 14 | `20261115140000_appointments.sql` | `appointments` table (state machine, optimistic concurrency, audit); triggers |
| 15 | `20261115150000_visits_opd.sql` | `visits` table (queue state machine, vitals, optimistic concurrency, audit) |
| 16 | `20261115160000_emr.sql` | `clinical_notes`, `diagnoses`, `allergies`, `problems`, `prescriptions`, `prescription_items` tables; triggers |
| 17 | `20261115170000_billing.sql` | `services`, `invoices`, `invoice_lines`, `payments`, `credit_notes` tables; money as integer minor units; append-only payments/credit_notes; triggers |
| 18 | `20261115180000_pharmacy_inventory.sql` | `stock_locations`, `items`, `item_batches`, `stock_movements` (append-only), `dispensations`, `stock_adjustments`; FEFO-ready batch tracking |
| 19 | `20261115190000_lab.sql` | `lab_orders`, `lab_order_items`, `lab_results` (append-only); `verify_lab_result()` RPC |
| 20 | `20261115200000_purchasing.sql` | `suppliers`, `purchase_orders`, `po_lines`, `goods_receipts`, `purchase_returns`, `supplier_ledger` (append-only) |
| 21 | `20261115210000_hr_lite.sql` | `departments`, `staff`, `shifts`, `attendance`, `leave_requests` |
| 22 | `20261115220000_audit_append_only_tables.sql` | Audit triggers + prepare triggers for credit_notes, stock_adjustments, purchase_returns, supplier_ledger |
| 23 | `20261123100000_permission_catalog_fix.sql` | Adds missing permissions: `purchasing:*`, `pharmacy:*`, `lab:verify` + role grants |
| 24 | `20261123110000_list_providers.sql` | `list_providers()` security-definer RPC (doctor/nurse profiles for scheduling) |
| 25 | `20261123120000_list_opd_queue.sql` | `list_opd_queue()` paginated read-model RPC for OPD queue SPA |
| 26 | `20261123130000_lab_workflow_fix.sql` | `list_lab_orders()`, `create_lab_order()`, fixes `verify_lab_result()` to target `lab_order_items.verified` |
| 27 | `20261123140000_billing_workflow_fix.sql` | `list_invoices()`, `create_invoice()`, `record_invoice_payment()`, `void_invoice()` atomic RPCs |

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

### Core entity groups (implemented in migrations)
- Identity/tenancy: `hospitals`, `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`, `hospital_settings`, `hospital_counters`
- Patients: `patients`, `patient_merges`, `patient_documents`
- Care: `appointments`, `visits`, `clinical_notes` (EMR tables partially: diagnoses, allergies, problems, prescriptions, prescription_items referenced but migration 16 is 611 lines — needs full review)
- Money: `services`, `invoices`, `invoice_lines`, `payments`, `credit_notes`
- Stock: `stock_locations`, `items`, `item_batches`, `stock_movements` (append-only), `dispensations`, `stock_adjustments`
- Purchasing: `suppliers`, `purchase_orders`, `po_lines`, `goods_receipts`, `purchase_returns`, `supplier_ledger` (append-only)
- Lab: `lab_orders`, `lab_order_items`, `lab_results` (append-only)
- HR: `departments`, `staff`, `shifts`, `attendance`, `leave_requests`
- System: `audit.events` (partitioned monthly)

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
- Every policy should be tested with pgTAP (allowed role, wrong role, other hospital, anon) — currently only 1 pgTAP test file exists

### Audit
`audit.events(id, occurred_at, hospital_id, actor_id, actor_role, action, table_name, record_id, before jsonb, after jsonb, request_id, ip, reason)`. Generic trigger on every sensitive table; append-only, partitioned monthly; optional hash chain for tamper evidence.

### pgTAP tests
`supabase/tests/000_tenant_isolation.sql` — single tenant-isolation test. No per-policy pgTAP tests exist yet.

### Seed
`supabase/seed.sql` — placeholder comment only; development/staging seed, never production.

---

## 9. Authentication & Multi-tenancy

### Login (no email)
- Form: Hospital code + Username + Password (+ TOTP if MFA enabled)
- Server maps to internal identifier `username@code.medicore.invalid` (`.invalid` TLD, never receives mail)
- Signups: `enable_signup = true` in local config.toml (conflicts with SECURITY.md which says signups off)
- Email confirmation off, no SMTP configured
- Users created only by admins via `auth.admin.createUser(email_confirm: true)`; temporary password, forced change at first login
- No self-service password reset; hospital admin resets staff, super admin resets hospital admins
- MFA: TOTP required for super_admin, hospital_admin, accountant, hr_manager, pharmacist, inventory_manager; recommended for all
- Sessions: access token ≤ 1 h (config: 3600s), refresh rotation on, idle timeout 15–30 min, absolute max 12 h
- Lockout: 5 failed logins → progressive delay + alert (documented, not yet implemented in code)
- Generic login errors only

### Tenant model
- Platform = whole system (run by `super_admin`)
- Hospital = tenant; super admin creates it; gets every module; flat (no branches in v1)
- User belongs to exactly one hospital; `super_admin` belongs to none
- Every row has `hospital_id`; RLS isolates hospitals (database-enforced)
- `super_admin` cannot read any hospital's clinical/billing/HR/stock data
- Hospital lifecycle: `active` → `suspended` (logins blocked, data kept) → `active` or `archived` (read-only)
- No outbound messaging of any kind

### RBAC (13 roles seeded, 11 + super_admin documented)
| Role | Can | Cannot |
|---|---|---|
| `super_admin` | Create/suspend/reactivate hospitals, create first hospital admin, reset hospital-admin passwords, platform audit log | Read any hospital's patient/billing/HR/stock data |
| `hospital_admin` | Dashboards, reports, approvals, user accounts/password resets for own hospital, staff/department mgmt, settings | Edit clinical records, post payments |
| `doctor` | Patients (read/update in care), visits, notes, prescriptions, lab/imaging orders, results read, own schedule | Billing void, stock, HR, user admin |
| `nurse` | Vitals, nursing tasks, medication admin, bed board, patient read, nursing notes | Prescribe, billing, stock adjust |
| `receptionist` | Register/search/edit demographics, appointments, queue, create invoice drafts | Clinical notes, results, void, discounts |
| `cashier` | Create invoices from orders, take payments, print receipts, daily close | Edit price list, void without approval, clinical data beyond invoice needs |
| `pharmacist` | Read prescriptions, dispense, POS sale, pharmacy stock, batch/expiry, returns | Edit diagnoses, post payments outside POS, HR |
| `lab_technician` | Lab worklist, sample status, enter results, verify (senior), print reports | Prescriptions, billing, full chart |
| `radiology_technician` | Imaging worklist, upload report, status | Everything else |
| `inventory_manager` | Items, batches, receipts, POs (create), adjustments (request), supplier records | Approve own PO, clinical data, payments |
| `accountant` | Invoices read, payments read, expenses, supplier payables, financial reports, PO approval (finance) | Clinical data, stock edits |
| `hr_manager` | Staff records, shifts, attendance, leave approvals | Clinical data, finance, user permissions |
| `auditor` (read-only) | Audit log, reports, read-only across modules | Any write |

Permissions are atomic `module:action` strings. Separation of duties: PO creator ≠ approver; invoice creator ≠ voider; stock adjuster ≠ approver above threshold.

### JWT and RLS
The Supabase custom access-token hook (`custom_access_token_hook`) adds claims: `hospital_id`, `permissions[]`, `role`, `must_change_password`. It refuses to issue a token if the hospital is `suspended`/`archived` or the profile is inactive.

---

## 10. Security model

### Threat model (top threats)
Stolen credentials, privilege abuse by insiders, financial fraud, data exfiltration, web attacks (XSS/CSRF/injection/SSRF/IDOR), supply chain, misconfiguration, data loss.

### Compliance position
- Compliance regime depends on country (HIPAA US, GDPR EU/UK, local health-data laws). Owner must confirm jurisdiction.
- Do not store real patient data until contracts/BAAs in place (Supabase HIPAA add-on + Vercel Enterprise BAA — verify with vendors).
- Never display "HIPAA compliant", "SOC 2", "encrypted end-to-end", etc. in the UI.

### Application hardening (documented, partially implemented)
- Headers: CSP (nonce-based, no unsafe-eval, frame-ancestors 'none'), HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP same-origin — **NOT implemented in `next.config.ts`** (no `headers()` block)
- Input: Zod at every boundary, `.strict()`, length limits, no `dangerouslySetInnerHTML`, no SQL string building, parameterized queries/RPC
- CSRF: Server Actions same-origin; Route Handlers verify `Origin` + auth; no state-changing GET
- Secrets: only in Vercel/Supabase env settings; `NEXT_PUBLIC_*` only Supabase URL + anon key; `.env*` gitignored
- Error pages never show stack traces or SQL
- Rate limiting on auth, search, export, PHI bulk endpoints — documented, not implemented

### Supabase security checklist
- RLS enabled on every table (migrations do this)
- `anon` role cannot read any table or call any function
- Security-definer functions set `search_path = ''`, live in `private` schema
- `service_role` key only in server-side env on Vercel, never in `NEXT_PUBLIC_*`
- Storage buckets private; policies mirror table access (patient-documents bucket)
- Public signups should be disabled (config.toml has `enable_signup = true` — conflict)
- PITR enabled on production; restore drill quarterly (documented, not yet done)

### Audit & monitoring
- Logged: logins/logouts/failures, MFA events, role/permission changes, every create/update/void on PHI/money/stock/HR, PHI reads (chart open, print, export), break-glass, config changes, exports
- Logs append-only, readable only by `auditor` and `super_admin`, cannot be cleared from UI
- Alerts: login failure spikes, new admin, role escalation, bulk export, break-glass use, RLS/policy changes, backup failure, 5xx spike

### Incident response
Detect → Contain → Assess → Notify → Recover → Review (post-mortem within 5 working days)

### Pre-launch security gate (all must be true)
BAAs/DPAs signed; fake auth/demo credentials/false claims removed; RLS tests green; no `service_role` in client bundle; MFA enforced for privileged roles; audit log append-only and verified; restore drill performed and timed; pen test done; incident plan + contact list printed.

---

## 11. Architecture

### System overview
```
Browser ── HTTPS ──> Vercel (Next.js 16)
                        ├─ proxy.ts            (session refresh, coarse route guard)
                        ├─ Server Components   (read data, render)
                        ├─ Server Actions      (mutations)
                        ├─ Route Handlers      (webhooks, exports, cron)
                        └─ services → repositories
                                                   │  user JWT (RLS enforced)
                                                   ▼
                                             Supabase
                                               ├─ Postgres (RLS, triggers, functions, pg_cron)
                                               ├─ Auth (hospital code + username + password, TOTP MFA)
                                               ├─ Storage (private buckets, signed URLs)
                                               └─ Realtime (queues, bed board only)
```

### Layering (strict, one direction — documented target)
```
UI (components) → Action / Route Handler → Service → Repository → Supabase
```

| Layer | Location | Responsibility | May NOT |
|---|---|---|---|
| UI | `src/features/<module>/components` | Render, local state, call actions | Call Supabase, hold business rules |
| Action | `src/features/<module>/actions.ts` | `"use server"`. Auth, authorize, Zod-parse, call service, revalidate, return `Result` | Contain SQL or business logic |
| Service | `src/features/<module>/service.ts` | Business rules, state transitions, orchestration, RPCs | Import React or Next APIs |
| Repository | `src/features/<module>/repo.ts` | Typed queries via Supabase client; only place that knows table names | Check permissions (RLS does) |
| Shared | `src/lib`, `src/server` | Supabase clients, auth helpers, audit helpers, errors, money, dates | Depend on features |

**Implementation gap:** The `service.ts`, `repo.ts`, `permissions.ts`, `types.ts` files and `components/` folders inside `features/` do not exist. Schemas live in `src/lib/<module>/schema.ts` instead. Business logic is split between thin `actions.ts` files and Postgres RPC functions in migrations.

### State management
- Server state: Server Components + Server Actions + `revalidatePath`/`revalidateTag`; TanStack Query intended for client-heavy lists (not in package.json)
- Client UI state: `useState`/`useReducer` first; Zustand only for cross-component UI state (sidebar, command palette, POS cart) — **never domain data as source of truth**
- Forms: React Hook Form + Zod resolver; schema in `schemas.ts` shared with action

### Performance rules (from ARCHITECTURE §7)
- Keyset/cursor pagination for large tables; `OFFSET` only for small admin tables
- Patient search: `pg_trgm` GIN indexes + `unaccent`, debounce 250ms, min 2 chars
- Every FK and `hospital_id` first in indexes; `EXPLAIN ANALYZE` for queries > 100k rows
- Append-only tables (`audit_events`, `stock_movements`, `vitals`, `payments`): partition by month
- Dashboards: summary tables / materialized views refreshed by `pg_cron`, never aggregate raw tables on page load
- Connection pooling via Supavisor transaction mode for runtime
- Realtime only for OPD queue, bed board, lab worklist, critical alerts; `hospital_id` filter
- Cache reference data with `unstable_cache`; never cache PHI across users
- `pg_cron` for nightly jobs (expiry scan, stock alerts, partition maintenance, KPI refresh); idempotent
- Files: Supabase Storage private buckets, signed URLs ≤ 60s, size/MIME limits
- Exports: streamed from Route Handler or background job; never 100k-row array in memory
- Bundle: route-level code splitting; `next/dynamic` for charts/heavy modals; < 200 KB JS first load per route
- `version` integer on editable aggregates; `UPDATE … WHERE id=$1 AND version=$2` for optimistic concurrency
- Document numbers (MRN, invoice no, PO no) from database sequences, never client

---

## 12. Scope (SCOPE.md)

### Product statement
Web-based, multi-tenant hospital/clinic management system. Platform owner (`super_admin`) creates hospitals; each hospital is an isolated tenant that gets every module. Target ~500 staff users per hospital. Manages patient journey (register → appointment → visit → orders → dispense/bill → follow-up), money, stock, staff, with full audit trail.

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

### Removed (per SCOPE §2.1)
Communications module, email/SMS/push messaging, Telemedicine, "AI Assistant" card, Backup & Restore screen, fake integration labels, SSO/SAML/LDAP, compliance claims, "LIVE" badges, Services placeholder module, theme sprawl, Prisma, unused deps (next-auth, next-intl, next-themes, react-markdown, react-syntax-highlighter, @mdxeditor/editor, uuid, @tanstack/react-table, 33 unused shadcn primitives).

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

### P0 critical bugs (historical; some fixed)
P0-1 No persistence of operational data (lost on refresh) — partially fixed (migrations exist)
P0-2 Any non-empty credentials authenticate (total auth bypass) — proxy middleware added
P0-3 `src/pages` exposes 25 unauthenticated routes — restructured to `src/features`
P0-4 Backup restore lost after reload — no in-app backup (by design)
P0-5 RBAC role mismatch disables nav for two demo roles
P0-6 PHI in unencrypted localStorage + false HIPAA claims — _legacy/ quarantined
P0-7 Client-only authorization (bypassable via devtools) — server actions being added
P0-8 No error boundaries — `error.tsx`/`loading.tsx` added
P0-9 Type checks skipped at build — fixed (`ignoreBuildErrors` not in next.config.ts)
P0-10 Prisma/database entirely unused — replaced by Supabase migrations
P0-11 Auto-backup never executes — no in-app backup (by design)
P0-12 Login screen claims SSO/SAML/LDAP supported — removed

### Security issues S1–S16
Fake auth, hardcoded demo credentials, no session/token, RBAC only in browser, PHI in localStorage, false compliance claims ("HIPAA Compliant", "SOC 2", "99.99% uptime", "Trusted by 240+ hospitals"), no input validation, no CSRF/CSP/headers/rate limiting, no audit immutability, no secrets management, TypeScript errors ignored, public unauthenticated routes, downloadable JSON backup with all PHI, no dependency scanning.

### Remaining work estimate: ~180–280 developer-days (~8–13 months for one developer, 4–6 months for small team)

---

## 14. Git workflow

### Branch model
```
main        ← production (protected, deployable, only from develop or hotfix)
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
Freeze → release checklist on staging → PR `develop → main` titled `release: vX.Y.Z` → all checks green + owner approval + migration review → merge commit → tag `vX.Y.Z` → CI applies production migrations (manual approval) → Vercel promotes to production → smoke test → rollback if broken → merge main back into develop

### Commit convention: Conventional Commits
`feat(billing): add credit note`, `fix(pharmacy): block dispensing expired batch`, etc. Subject ≤ 72 chars, imperative, no period.

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

### CI pipeline (documented, not yet implemented)
`install → lint → typecheck → unit → supabase start → db tests → integration → build → e2e smoke → gitleaks/codeql/audit → report`. Required to merge. Nightly: full E2E + ZAP baseline against staging.

**Current test state:** Vitest config exists; Zod schema tests exist for 14 modules (`appointments`, `audit`, `billing`, `emr`, `hr`, `lab`, `patients`, `pharmacy`, `platform`, `purchasing`, `staff`, `visits`, `money`, `dates`, `rbac`, `auth/*`); pgTAP has 1 test file (`000_tenant_isolation.sql`); no E2E tests (e2e/ has README only); no CI pipeline (no `.github/` workflows found).

---

## 17. UI guidelines (UI_GUIDELINES.md)

### Principles
1. Information first — data is the design; chrome stays quiet
2. One accent color (brand) for primary actions and selection; otherwise neutral gray; color reserved for meaning
3. Solid surfaces — no gradients, glass, glow, mesh; hierarchy from spacing, type weight, 1px borders
4. Density with order — compact but aligned; 4px spacing scale
5. Plain words — sentence case, active verbs, specific labels; no marketing copy
6. Truthful UI — nothing labelled "live", "connected", "encrypted", "AI", "certified" unless true and verified

### Remove list (AI slop purge)
Gradients, glow, glass, decorative motion, fake live indicators, marketing claims, fake integrations, hardcoded identity/currency — see `UI_GUIDELINES.md` §3 for grep commands. Not yet executed.

### Layout
- App shell: left sidebar (grouped by workflow), top bar with hospital name, global search, alerts, user menu
- Sidebar shows only modules user has permission for
- One URL per screen; breadcrumbs on detail pages; back button works
- List screens: filters on top, table, pagination footer
- Detail screens: persistent patient banner (name, age/sex, MRN, allergies, alerts) on every clinical screen
- Forms: single column, labels above fields, required marked, inline errors

### Clinical safety UI
- Allergies and critical alerts always visible in patient banner (red, text + icon, not color alone)
- Abnormal lab values flagged with text (H, L, Critical) plus color
- Destructive actions require confirmation saying exactly what will happen
- Never auto-dismiss clinical warnings
- Show units next to every number; never truncate drug names or doses

### Accessibility (WCAG 2.2 AA target)
Keyboard reachable + visible focus ring; logical tab order; labels + `aria-describedby` for errors; contrast ≥ 4.5:1; don't rely on color alone; hit targets ≥ 24×24 CSS px; skip link; `prefers-reduced-motion` honored; landmarks; axe checks in E2E for every module.

---

## 18. Coding standards highlights

- TypeScript strict; no `any`, `as any`, `@ts-ignore`; `@ts-expect-error` only with comment + issue link
- Prefer `type` for data shapes, `interface` only for extendable contracts; derive types from Zod and generated DB types
- Discriminated unions for state; exhaustive `switch` with `never` check; no enums (use `as const`)
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
- Prettier (printWidth 100), ESLint, Husky + lint-staged
- Comments explain **why**, not what; no commented-out code; TODOs require issue number
- Performance: query only needed columns; paginate; avoid N+1; debounce search; virtualize beyond ~200 rows; bundle < 200 KB JS first load per route
- a11y: shadcn Dialog/AlertDialog (Radix) for modals; every input has label; every icon-only button has `aria-label`

---

## 19. Running locally

```bash
npm install
cp .env.example .env.local
# fill in Supabase values (URL, anon key, service role key)
supabase start             # local Supabase (Postgres 17, Auth, Storage, Realtime)
supabase db reset          # runs migrations + seed
npm run dev                # http://localhost:3000
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
```

---

## 20. What is done vs. what is left

### Done (foundation layer)
- [x] All project documentation (`docs/`) written and authoritative
- [x] `AGENTS.md` with 16 non-negotiable rules and definition of done
- [x] 27 SQL migrations covering tenancy, RBAC, audit, patients, appointments, visits/OPD, EMR, billing, pharmacy/inventory, lab, purchasing, HR-lite
- [x] RLS on every domain table with `hospital_id` + permission policies
- [x] Custom access-token hook injecting `hospital_id`, `role`, `permissions[]` into JWT
- [x] Audit trigger (`write_audit_event()`) on all sensitive tables, partitioned monthly
- [x] Append-only financial/stock tables (payments, credit_notes, stock_movements, supplier_ledger, purchase_returns)
- [x] Postgres RPCs: `register_patient`, `archive_patient`, `list_patients`, `merge_patients`, `list_providers`, `list_opd_queue`, `list_lab_orders`, `create_lab_order`, `verify_lab_result`, `list_invoices`, `create_invoice`, `record_invoice_payment`, `void_invoice`, `delete_patient_document`, `log_patient_document_access`, `list_platform_audit_events`, `list_hospital_audit_events`
- [x] Private Storage bucket (`patient-documents`) with storage RLS policies
- [x] `proxy.ts` Next.js middleware (coarse route guard, session refresh)
- [x] Login/MFA/password-change pages; `requirePermission()` server helper
- [x] Supabase clients (server with JWT, browser, admin service_role in `server-only`)
- [x] Zod schemas + tests for 14 modules in `src/lib/<module>/`
- [x] `Result<T>` type, money/dates/ids/rbac utils
- [x] App shell components (AppShell, ModalHost, hospital-shell)
- [x] shadcn/ui primitives installed
- [x] Generated Supabase DB types in `src/types/database.ts`

### In progress / partially done
- [ ] Feature module layering: most modules have only `actions.ts`; missing `service.ts`, `repo.ts`, `permissions.ts`, `types.ts`, `components/`
- [ ] Real auth flow wired end-to-end (proxy middleware exists but session/permission enforcement in actions incomplete)
- [ ] Server-side authorization in every Server Action (documented pattern, partially implemented)
- [ ] Persistence of operational data (mock data still in `_legacy/`)
- [ ] Error boundaries (`error.tsx`/`loading.tsx` exist but not fully wired)
- [ ] UI refactor per `UI_GUIDELINES.md` (gradients/glass/pulse removal not executed)

### Not done (remaining work)
- [ ] pgTAP tests for every RLS policy (only 1 test file exists)
- [ ] Integration tests (Vitest + local Supabase per module)
- [ ] E2E tests (Playwright; `e2e/` has README only)
- [ ] CI pipeline (no `.github/` workflows; lint/typecheck/test/build/e2e/security not automated)
- [ ] Security headers (CSP, HSTS, etc.) not implemented in `next.config.ts`
- [ ] Rate limiting on auth/search/export endpoints
- [ ] Vercel deployment, staging/production Supabase projects
- [ ] PITR, backups, restore drills
- [ ] `supabase gen types` regeneration workflow in CI
- [ ] `develop`/`main` branch protection, PR template, CODEOWNERS
- [ ] Phase 2 modules (IPD, Emergency, Nursing, Radiology, Purchases, HR-lite, Finance-lite, Real reports)
- [ ] Phase 3 hardening (pen test, WCAG audit, load test, restore drill, UI cleanup)
- [ ] `service_role` key CI grep check (no `service_role` in client bundle)
- [ ] Tenant-isolation automated test in CI

---

## 21. Key gaps between documentation and implementation

1. **Architecture layering not implemented:** `ARCHITECTURE.md` mandates `service.ts`/`repo.ts`/`permissions.ts`/`types.ts` in every feature module, but none exist. Business logic is split between thin `actions.ts` files and Postgres RPCs.

2. **Schema location mismatch:** `CODING_STANDARDS.md` says Zod schemas live in `src/features/<module>/schemas.ts`, but they actually live in `src/lib/<module>/schema.ts`.

3. **Security headers missing:** `SECURITY.md` §6 documents CSP/HSTS/etc., but `next.config.ts` has no `headers()` block.

4. **Auth config conflict:** `config.toml` has `enable_signup = true`, but `SECURITY.md` says signups should be off.

5. **Testing not implemented:** Only Zod schema unit tests and 1 pgTAP test exist. No integration, E2E, or CI pipeline.

6. **No CI/CD:** No `.github/` workflows found; no automated lint/typecheck/test/build/e2e/security scans.

7. **`src/pages` restructure:** `ARCHITECTURE.md` says rename `src/pages` → `src/features/*/components` to remove 25 unauthenticated Pages Router routes. This appears done (no `src/pages` exists), but route files are still largely in `src/app/` directly rather than feature-based.

8. **Zustand store:** `app-store.ts` (~1,885 lines) is being decomposed; should not hold domain data as source of truth.

---

## 22. Definition of done checklist (per AGENTS.md §4)

- [ ] Follows layering (UI → action → service → repository) — **NOT implemented in features**
- [ ] Server-side permission check present and tested — **partially**
- [ ] Zod schema on every input — **partial (lib-level schemas exist)**
- [ ] RLS policy added/updated and tested if data access changed — **migrations have policies; pgTAP tests missing**
- [ ] Loading, empty, error and forbidden states exist — **partial (error.tsx/loading.tsx exist)**
- [ ] Keyboard accessible, labelled, passes axe — **not tested**
- [ ] Unit/integration tests added; `npm run lint`, `typecheck`, `test` pass — **partial**
- [ ] No new `console.log`, no commented-out code, no TODO without issue number — **unknown (not audited)**
- [ ] PR is small (< 400 changed lines), targets `develop` — **process defined, not yet used**

---

*End of system information. This file aggregates AGENTS.md, all docs/, the project audit, package.json, tsconfig.json, next.config.ts, components.json, supabase config/migrations/tests/seed, and src/ structure. It is intended to be the single reference for any developer or AI agent working on MediCore HMS.*
