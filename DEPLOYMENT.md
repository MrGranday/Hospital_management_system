# DEPLOYMENT.md

## 1. Environments
| Env | App | Database | Purpose |
|---|---|---|---|
| Local | `next dev` | `supabase start` | Development |
| Preview | Vercel preview per PR | Staging Supabase | Review |
| Staging | `develop` → stable staging domain | Staging Supabase project | Integration testing, demos, UAT |
| Production | `main` → production domain | Production Supabase project | Real use |
Two separate Supabase projects (staging, production). Different keys, different users, different buckets. Staging never contains real patient data.

## 2. Environment variables
| Variable | Exposure | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key) | public | Safe only because RLS is enforced |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Bypasses RLS. Production scope only for production |
| `DATABASE_URL` (pooler) | server only | Runtime, transaction mode |
| `DIRECT_URL` | CI only | Migrations |
| `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | mixed | |
| `APP_ENV` | server | `local|staging|production` |
Keep `.env.example` current (names only). CI fails if a required variable is missing at build.
Anything prefixed `NEXT_PUBLIC_` is visible to every visitor.

## 3. Vercel setup
- Framework: Next.js. Node LTS pinned in `engines`. Package manager pinned (`packageManager` field).
- Production Branch: `main`. `develop` is assigned to the staging domain. Preview Authentication on.
- Region: choose closest to the Supabase region to cut latency.
- Remove `output: "standalone"` and the Caddyfile unless self-hosting; they are not used on Vercel.
- Vercel Firewall/WAF rate limits on `/login`, `/api/*`, and export routes.
- Cron: `vercel.json` crons call `/api/cron/*` routes secured with a secret; jobs are idempotent.

## 4. Database deployment
Migrations run from CI, not from laptops. Order: staging automatically on merge to `develop`; production on merge to `main` with a manual approval step. Take note of the PITR timestamp before a production migration. Run heavy migrations (large index builds) with `CREATE INDEX CONCURRENTLY` in off-hours.

## 5. Backups and recovery
- Production: PITR enabled plus daily backups (verify plan features). Retention per legal requirement.
- Restore drill every quarter into a scratch project; record time to restore. Targets to agree with owner: RPO (acceptable data loss) and RTO (acceptable downtime). Suggested starting point: RPO ≤ 15 min, RTO ≤ 4 h.
- Storage objects (documents) backed up separately; verify.
- The app has **no** in-app backup/restore. Do not add one.

## 6. Release and rollback
Release per GIT_WORKFLOW.md. Rollback order: (1) Vercel instant rollback to previous deployment; (2) suspend the affected hospital or disable the affected action; (3) forward-fix migration; (4) PITR restore only for data corruption. Migrations must be backward-compatible with the previous app version for one release (expand/contract), so step 1 is always safe.

## 7. Monitoring
Uptime check on `/api/health` (no PHI, checks DB reachability). Alerts per SECURITY.md §9. Dashboards: error rate, p95 latency, DB CPU/connections, slow queries, auth failures, storage size. Review monthly.

## 8. Go-live checklist
Security gate (SECURITY.md §12) · load test passed · restore drill done · UAT sign-off by each department head · staff training done · downtime procedure (paper fallback) printed · support contact and on-call defined · data migration rehearsed twice on staging.
