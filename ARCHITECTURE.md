# ARCHITECTURE.md

## 1. Principles
1. **The database is the source of truth and the last line of defense.** Security and integrity rules live in Postgres (RLS, constraints, triggers, functions), not only in app code.
2. **Boring technology.** One Postgres, one Next.js app, one deployment. No microservices until a measured need exists.
3. **Server by default.** Data fetching and mutations run on the server. Client components are for interactivity only.
4. **Modular monolith.** Each module owns its routes, components, schemas, services, and tables. Modules talk through public service functions, never by reaching into each other's tables.
5. **Multi-tenant from day one.** Every row has a `hospital_id`; RLS isolates hospitals. No facilities/branches in v1. See MULTI_TENANCY.md.

## 2. System overview
```
Browser ── HTTPS ──> Vercel (Next.js 16)
                       ├─ proxy.ts            (session refresh, coarse route guard, security headers)
                       ├─ Server Components   (read data, render)
                       ├─ Server Actions      (mutations)   ┐
                       ├─ Route Handlers      (webhooks, exports, cron endpoints) ┘ all call services
                       └─ services → repositories
                                          │  user JWT (RLS enforced)
                                          ▼
                              Supabase
                                ├─ Postgres (RLS, triggers, functions, pg_cron)
                                ├─ Auth (hospital code + username + password, TOTP MFA, custom access token hook; sends no email)
                                ├─ Storage (private buckets, signed URLs)
                                └─ Realtime (queues, bed board only)
```
`proxy.ts` is the Next.js 16 name for what was `middleware.ts`. It is a coarse gate only. It never replaces per-action checks.

## 3. Layering (strict, one direction)
```
UI (components)  →  Action / Route Handler  →  Service  →  Repository  →  Supabase
```
| Layer | Location | Responsibility | May NOT |
|---|---|---|---|
| UI | `src/features/<module>/components` | Render, local state, call actions | Call Supabase, hold business rules |
| Action | `src/features/<module>/actions.ts` | `"use server"`. Authenticate, authorize, Zod-parse, call service, revalidate, return `Result` | Contain SQL or business logic |
| Service | `src/features/<module>/service.ts` | Business rules, state transitions, orchestration, calls RPCs for multi-row atomic work | Import React or Next APIs |
| Repository | `src/features/<module>/repo.ts` | Typed queries via the Supabase client. Only place that knows table names | Check permissions (RLS does) |
| Shared | `src/lib`, `src/server` | Supabase clients, auth helpers, audit helpers, errors, money, dates | Depend on features |

## 4. Folder structure
```
src/
  app/
    (auth)/login, mfa, reset-password
    (app)/                      # authenticated shell
      layout.tsx                # AppShell, loads session + permissions once
      dashboard/page.tsx
      patients/ (page, [id]/, new/)
      appointments/ ...
      visits/ pharmacy/ inventory/ lab/ billing/ ...
      admin/users, audit-log, settings        # hospital_admin: own hospital only
    (platform)/hospitals                      # super_admin only: list, create, suspend, reset admin password
    api/                        # webhooks, exports, cron only
    error.tsx  global-error.tsx  not-found.tsx
  features/<module>/
    components/  actions.ts  service.ts  repo.ts  schemas.ts  types.ts  permissions.ts  *.test.ts
  components/ui/                # shadcn primitives (only those in use)
  components/shared/            # DataTable, PageHeader, EmptyState, ConfirmDialog, StatusBadge
  lib/                          # money.ts, dates.ts, result.ts, errors.ts, utils.ts
  server/
    supabase/ (server.ts, browser.ts, admin.ts)   # admin.ts is `server-only`
    auth/ (session.ts, require-permission.ts)
    audit/ (context.ts)
supabase/
  migrations/  seed.sql  tests/ (pgTAP RLS tests)  config.toml
docs/  e2e/  .github/
```
Routing is real: one URL per screen. No `currentPage` in a store. Rename the prototype's `src/pages/*` to `src/features/*/components` immediately, because `src/pages` is treated by Next.js as the Pages Router and exposes unauthenticated routes.

## 5. Data access
- Server code creates a Supabase client **with the caller's JWT**, so RLS applies. This is the default for everything.
- `service_role` (bypasses RLS) is used only for: hospital and user provisioning, cron jobs, migrations/seeds, and system tasks. Each use sits in `src/server/admin/` with a comment explaining why.
- Multi-row business operations (receive goods, dispense, post payment, admit patient, void invoice) are **Postgres functions** called with `supabase.rpc()`. They run in one transaction, lock rows (`SELECT … FOR UPDATE`), check state, write movements, and write audit rows. Do not chain several client calls for one business action.
- Types come from `supabase gen types typescript`. Regenerate in every PR that changes schema. CI fails if `types.ts` is stale.

## 6. State management
- Server state: Server Components + Server Actions + `revalidatePath`/`revalidateTag`. For client-heavy lists (live queue, POS) use TanStack Query.
- Client UI state: `useState`/`useReducer` first. Zustand only for cross-component UI state (sidebar open, command palette, active POS cart). **Zustand never holds domain data fetched from the server as a source of truth.**
- Forms: React Hook Form + Zod resolver. The Zod schema lives in `schemas.ts` and is shared with the action.

## 7. Handling large data and many users
Realistic target: many hospitals on one database, each with up to ~500 concurrent staff users, millions of rows (patients, visits, invoice lines, stock movements, audit events). A well-indexed single Postgres handles this. Do the following from day one instead of buying complexity later.

| Concern | Rule |
|---|---|
| Lists | Server-side pagination only. Use **keyset (cursor) pagination** for large tables (`WHERE (created_at, id) < ($1, $2) ORDER BY … LIMIT 50`). `OFFSET` only for small admin tables. Never `select *`; select needed columns. |
| Search | Patient search by MRN, phone, name uses `pg_trgm` GIN indexes (and `unaccent`). Debounce 250ms. Min 2 characters. |
| Indexes | Every foreign key, every `hospital_id` first, then status/date filter. Review `EXPLAIN ANALYZE` for any query touching > 100k rows. |
| Big append-only tables | `audit_events`, `stock_movements`, `vitals`, `payments`: **partition by month** (range on `created_at`), automate partition creation with `pg_cron`. Archive partitions older than the retention period to cold storage. |
| Dashboards | Never aggregate raw tables on page load. Use summary tables or materialized views refreshed by `pg_cron` (every 1–5 min or nightly) and `revalidateTag` caching. |
| Connections | Serverless functions open many connections. Use the Supabase pooler (Supavisor, transaction mode) connection string for runtime. Direct connection only for migrations. |
| Realtime | Only OPD queue, bed board, lab worklist, critical alerts. Subscribe with a `hospital_id` filter. Do not stream whole tables. |
| Caching | Cache reference data (service catalog, roles, departments) with `unstable_cache`/cache tags. Never cache PHI across users. Per-user data is dynamic. |
| Background work | `pg_cron` for nightly jobs (expiry scan, stock alerts, partition maintenance, KPI refresh). Vercel Cron or Supabase Edge Functions for tasks needing code. Jobs must be idempotent. |
| Files | Supabase Storage, private buckets, signed URLs (short TTL), size and MIME limits, virus scan before marking "available" if untrusted uploads are enabled. |
| Exports | Large exports (CSV) are streamed from a Route Handler or built as a background job. Never build a 100k-row array in memory. |
| Bundle | Route-level code splitting by default (App Router). `next/dynamic` for charts and heavy modals. Budget: < 200 KB JS first load per route. |
| Scale-up path | (1) tune queries/indexes → (2) increase compute size → (3) read replica for reports → (4) separate reporting schema. Do not skip to step 4. |

Concurrency rules: use a `version` integer on editable aggregates (patients, invoices drafts, POs) and `UPDATE … WHERE id=$1 AND version=$2`; zero rows updated means conflict, show "This record was changed by someone else". Use `FOR UPDATE` in functions that change stock or balances. Generate invoice/MRN numbers from database sequences, never from the client.

## 8. Error handling
- Actions return `Result<T> = { ok: true, data } | { ok: false, error: { code, message, fields? } }`. Do not throw for expected failures (validation, forbidden, conflict, not found).
- Unexpected errors are logged (with request id, user id, never PHI) and the user sees a generic message with a reference id.
- Every route segment has `loading.tsx`; each module has `error.tsx`; app has `global-error.tsx`.

## 9. Observability
Sentry (or equivalent) for errors, with PHI scrubbing. Structured JSON logs with `request_id`, `user_id`, `hospital_id`, `action`. Vercel Analytics/Speed Insights for performance. Supabase logs and `pg_stat_statements` for slow queries. Alerts: error rate, p95 latency, failed logins spike, cron failures, backup failures.

## 10. No per-tenant feature flags
Every hospital gets every module. Deferred modules (Blood Bank, Insurance, Payroll) do not ship until the owner decides. Short-lived dev flags for unfinished work are fine but must be removed before release.

## 11. Architecture decision records
Any decision that changes this document needs `docs/adr/NNNN-title.md` (context, decision, consequences) and owner approval.
