# ROADMAP.md

Estimates are for one experienced full-stack developer working with AI assistance; halve calendar time with two developers. They replace the audit's 180–280 day figure, because scope is reduced (communications, telemedicine, GL, payroll, PACS, backups UI, blood bank, insurance deferred or removed).

## Phase 0 — Stabilize the prototype (1 week)
- Rename `src/pages` → `src/features/*/components` (removes the 25 unauthenticated public routes)
- Create `develop` branch, branch protection, CI skeleton, these docs committed
- Delete removed modules (Communications, Telemedicine, Backup/Restore, AI card, fake integrations, claims, LIVE badges)
- Remove unused deps and 33 unused UI primitives; remove Prisma, `.orig`, `tsbuildinfo`, dead config
- Turn on TypeScript checks and strict mode; fix lint errors
- Add real routes per module, `error.tsx`/`loading.tsx`

## Phase 1 — Foundation + OPD MVP (6–8 weeks)
1. Supabase projects (staging/prod), CLI, migrations, seed, type generation
2. Tenancy, modules and auth: `hospitals`, `hospital_modules`, module registry, super admin console (create wizard, module switches, support sessions), hospital provisioning function, username login, admin-managed passwords, MFA, sessions, access-token hook, `requirePermission`, automated tenant-isolation test
3. RBAC tables, roles seeded, admin UI for users/roles, pgTAP tests
4. Audit triggers + audit log viewer
5. Patients (reference module: full CRUD, search, merge, archive, documents)
6. Appointments → Visits/OPD → EMR-lite
7. Billing (catalog, invoice, payment, void/credit note, receipt)
8. Inventory + Pharmacy on one stock ledger; Lab orders/results
9. Real dashboard per role; settings
10. E2E smoke journeys, load test on search/queue/POS
**Exit:** one clinic can run OPD with real auth, RLS, audit, and recoverable data on staging.

## Phase 2 — Hospital operations (6–8 weeks)
IPD & bed board · Emergency · Nursing & medication administration · Radiology orders/reports · Purchases & suppliers · HR-lite · Finance-lite · Real reports (§4 of SCOPE.md) · Dashboard alerts · Realtime for queue and beds.
**Exit:** inpatient and back-office flows work; month-end finance reports match source documents.

## Phase 3 — Hardening and launch (4–6 weeks)
Pen test and fixes · WCAG audit and fixes · restore drill · load test at target concurrency · UI cleanup (UI_GUIDELINES §9) · training material · pilot with one department, then full go-live.

## Phase 4 — Optional modules (on request)
Blood bank · Insurance/claims · Payroll · FHIR export.

## Module build rule
For every module build the **[P1]** items in `MODULE_SPECS.md` first, with tests and RLS, then move on. **[P2]** items wait until all planned modules have their P1 done, unless the owner says otherwise.

## Working rules for the roadmap
Do not start a later phase item while an earlier exit criterion is unmet. Each module is "done" only per the definition of done in AGENTS.md. Re-estimate at the end of each phase.
