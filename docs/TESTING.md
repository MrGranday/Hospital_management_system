# TESTING.md

## 1. Strategy (testing trophy, weighted to risk)
| Layer | Tool | What | Required for |
|---|---|---|---|
| Static | TypeScript strict, ESLint, Prettier | Types, a11y lint, hooks rules | Every PR |
| Unit | Vitest | Pure logic: money, dates, state machines, Zod schemas, service rules (repo mocked) | Every service |
| Database | pgTAP (`supabase test db`) | **RLS policies, constraints, triggers, Postgres functions** | Every migration |
| Integration | Vitest + local Supabase | Actions → service → DB with real RLS and real users per role | Every module |
| E2E | Playwright | Critical journeys by role; axe accessibility scan | Every release |
| Security | gitleaks, CodeQL, `npm audit`, ZAP baseline (staging) | Secrets, vulns, headers | CI + pre-release |
| Load | k6 | Search, OPD queue, POS, dashboard at expected concurrency | Before go-live, then per major release |

## 2. Rules
- RLS/permission tests are the most important tests in the project. For each table: allowed role can, other roles cannot, another hospital cannot, anon cannot.
- Every Server Action has a test for: unauthenticated, forbidden, invalid input, success, conflict.
- Financial and stock functions: test rounding, concurrency (two simultaneous dispenses of the last unit), idempotency (double submit), reversal.
- State machines: test every valid and a sample of invalid transitions.
- Tests are deterministic: no real time, no random, no network. Inject clock and ids.
- **Tenant-isolation test (mandatory, automated):** seed hospitals A and B with rows in every table, sign in as A, assert zero rows from B everywhere, including storage and RPCs. It discovers tables from the catalog so new tables are covered automatically.
- Test data is synthetic. **Never copy production data into any non-production environment.**
- Bug fix PRs include a test that fails before the fix.

## 3. Critical E2E journeys (smoke set, run on every PR to develop)
0. Super admin creates hospital A and B; A's admin logs in with the temporary password, is forced to change it, creates users, and cannot see anything of B
1. Login with MFA → role-appropriate menu → forbidden route shows 403
2. Receptionist: register patient → book appointment → check in
3. Doctor: open visit → vitals visible → note + prescription + lab order
4. Pharmacist: dispense prescription → stock decreases → batch FEFO respected
5. Cashier: invoice → partial payment → receipt → void blocked without approval
6. Lab: result entry → verify → doctor sees result
7. Inventory: PO create → approve by other user → receive goods → stock up
8. Auditor: sees audit events for the above; cannot edit anything

## 4. Coverage targets
Services and utilities ≥ 85% lines; Zod schemas 100% of branches that matter; every RLS policy tested; UI components tested by behavior (Testing Library), not snapshots. Coverage is a floor, not the goal.

## 5. CI pipeline (GitHub Actions)
`install → lint → typecheck → unit → supabase start → db tests → integration → build → e2e smoke → gitleaks/codeql/audit → report`. Required to merge. Nightly: full e2e + ZAP baseline against staging.
