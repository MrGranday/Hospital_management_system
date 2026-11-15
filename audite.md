# MediCore HMS â€” Full Project Audit

**Audited:** 14 November 2026
**Repository:** `D:\projects\clinic_system-`
**Commit:** `72f0e35` ("Add files via upload") â€” only 2 commits in history
**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + shadcn/ui + Zustand + Recharts + Framer Motion + Prisma (unused)
**Code size:** ~22,600 lines of TS/TSX across 25 page modules and 48 UI primitives

---

## 0. TL;DR

| Question | Answer |
|---|---|
| How complete is it? | **~40% overall.** As a clickable demo/prototype it is ~80%; as a production hospital system it is ~25-35%. |
| How much remains? | **~60% of the total product**, but ~90% of the hard work (backend, auth, persistence, security, QA). |
| Is the UI AI slop? | **Not pure slop â€” it is a good-looking prototype with real design-system craft**, but it carries many AI-generated tells: fake marketing claims, static "live" data, invented integrations, monolithic generated files, and template repetition. Visual craft ~7.5/10, product authenticity ~4/10. |
| Biggest blocker | **There is no database, no API, no real auth, and no persistence.** Every change is lost on refresh. |
| Can it ship today? | **No.** It would fail a security/compliance review on day one (PHI in localStorage, fake auth, hardcoded credentials, false HIPAA claims). |
| Build status | `npm run build` compiles; **type checking is deliberately skipped** (`ignoreBuildErrors: true`). |
| Lint status | Was broken (no config). A config was added; **lint now reports 15 errors + 8 warnings**. |
| Tests | **Zero.** No unit, integration, E2E, or accessibility tests. |

---

## 1. What This Project Actually Is

MediCore is a **single-page, client-side hospital management UI prototype**. All 25 modules are React components rendered by one client component (`src/app/page.tsx`) behind a fake login. Data is imported from a large static mock file (`src/lib/data.ts`, 48 exported arrays, 1,286 lines) and optionally augmented by an in-memory Zustand store (`src/store/app-store.ts`, 1,885 lines).

There is no server-side logic, no database usage, no authentication, no real integrations, and no test suite. The Prisma schema and `src/lib/db.ts` exist but are boilerplate and unused.

---

## 2. Completion From 100%

### 2.1 Weighted scorecard

| Dimension | Weight | Completion | Weighted |
|---|---:|---:|---:|
| UI / design system | 15% | 85% | 12.8 |
| Module screens / breadth | 15% | 80% | 12.0 |
| Functional depth & workflows | 20% | 55% | 11.0 |
| Data persistence | 15% | 5% | 0.8 |
| Backend / API | 10% | 2% | 0.2 |
| Authentication & session | 10% | 10% | 1.0 |
| Security & compliance | 5% | 10% | 0.5 |
| QA / testing | 5% | 0% | 0.0 |
| DevOps / docs | 5% | 10% | 0.5 |
| **Total** | **100%** | | **â‰ˆ 38.8%** |

**Verdict: ~40% done, ~60% remaining.**

Three separate lenses tell a clearer story:

| Lens | Done | Remaining | Meaning |
|---|---:|---:|---|
| Clickable product demo | 80% | 20% | Almost every screen exists and looks convincing. |
| Functional prototype | 50% | 50% | Many create flows work in-memory; many are read-only. |
| Production-ready system | 30% | 70% | No backend, auth, persistence, compliance, or tests. |
| Enterprise/HIPAA-ready | 10% | 90% | Nothing in security/compliance is real. |

### 2.2 What is genuinely done

- Complete visual shell: grouped sidebar, top bar, command palette, notifications panel, profile menu, mobile drawer.
- 25 modules with real layouts, tables, filters, charts, detail panels and modals.
- A proper theme system: light/dark/system, 8 accent colors, radius and density settings, persisted to localStorage, with pre-hydration bootstrap.
- Role-based navigation filtering and a 13-role permission matrix (UI-level only).
- Several genuinely deep workflows:
  - Purchase orders: draft â†’ pending â†’ approved â†’ partial/fully received â†’ cancel.
  - Goods receipts that restock medicine batches and adjust supplier balances.
  - Purchase returns: create â†’ approve/reject â†’ complete (stock + supplier credit) â†’ cancel.
  - Blood bank: donors, eligibility, donations, bag inventory, expiry, compatibility checking, transfusions, reactions.
  - Pharmacy POS, batch-level stock, dispensing, restocking, low-stock/expiry logic.
  - Activity log with categories, filtering, CSV export, super-admin clear.
  - Backup create/download/restore with checksum validation (within one session).
- CSV export on many screens, print windows for invoices/receipts/prescriptions/lab reports.
- Responsive layouts and consistent use of `tabular-nums` for clinical numbers.

### 2.3 What is missing or fake

- Real database and server API.
- Real authentication and server-side authorization.
- Persistence of any operational data.
- Patient editing/deletion, appointment editing/deletion, invoice editing/deletion.
- Real reporting (all charts are static arrays).
- Real communications (no email/SMS/chat).
- Real telemedicine (no WebRTC).
- Real integrations (Twilio, Stripe, S3, SendGrid, HL7/FHIR are just labels).
- Real AI assistant (only a "coming soon" card; `z-ai-web-dev-sdk` is unused).
- Real backups (localStorage only; auto-backup never runs).
- Insurance and Services modules (placeholders).
- Tests, CI, Dockerfile, README, LICENSE, error/loading boundaries.

---

## 3. Architecture Reality Check

### 3.1 Intended vs actual

| Layer | Expected | Actual |
|---|---|---|
| Frontend | Next.js App Router | Yes â€” but `page.tsx` is one large client component; no server components, no routing per module. |
| Routing | App Router routes | **No real routes.** Navigation is `currentPage` state in Zustand. Refresh always returns to login/dashboard. |
| Backend | API routes / server actions | **Only `GET /api` returning `{"message":"Hello, world!"}`.** |
| Database | Prisma models for all domains | **Boilerplate `User` and `Post` models only. Nothing uses Prisma.** |
| Auth | next-auth / sessions | **Fake client-side login. Any non-empty credentials work.** |
| State | Server cache + client state | **One 1,885-line Zustand store. No persistence middleware.** |
| Authorization | Server-enforced RBAC | **Client-side hiding only; bypassable in devtools.** |
| Files | Upload/storage | **None.** |
| Realtime | WebSockets/SSE | **None.** |
| i18n | next-intl | **Installed, never imported.** |

### 3.2 Critical structural problem: `src/pages` is being treated as the Next.js Pages Router

`next build` compiled the 25 files in `src/pages/` as **public top-level routes**:

```
Route (pages)
â”œ â—‹ /ActivityLog
â”œ â—‹ /Appointments
â”œ â—‹ /BackupRestore
â”œ â—‹ /Billing
â”œ â—‹ /BloodBank
...
â”œ â—‹ /Patients
â”œ â—‹ /Pharmacy
...
```

Consequences:

1. **Every module is reachable directly** (`/Patients`, `/Billing`, `/Settings`, â€¦) **without the login gate and without `AppShell`**, because the auth check lives only in `src/app/page.tsx`.
2. The same components are bundled twice (once in the SPA tree, once as pages-router routes).
3. It looks like an AI-generated structural mistake: `src/pages` was intended as a component folder, not a router folder.

**Fix:** rename `src/pages` â†’ `src/screens` (or `src/features/pages`), update imports in `src/app/page.tsx`, then delete the duplicate routes. This is a P0 architectural fix.

### 3.3 Monolithic files

| File | Lines | Problem |
|---|---:|---|
| `src/store/app-store.ts` | 1,885 | Auth, UI, audit, pharmacy, purchasing, blood bank, backups, settings, RBAC all in one store. 156 actions. |
| `src/components/shell/ModalHost.tsx` | 1,760 | 24 modal implementations in one file; no lazy loading; no shared form/validation layer. |
| `src/lib/data.ts` | 1,286 | 48 static datasets acting as a fake database. |
| `src/lib/rbac.ts` | 467 | Permission matrix for 13 roles Ã— 27 modules. |
| `src/pages/Patients.tsx` | 546 | Page logic plus detail drawers. |
| `src/pages/Pharmacy.tsx` | 634 | Five tabs in one file. |
| `src/pages/Purchases.tsx` | 608 | POs and returns in one file. |

---

## 4. Feature-by-Feature Audit

**Legend:** Done = works end-to-end in-memory Â· Partial = some actions work, key actions missing Â· Mock = read-only static data Â· Missing = not implemented.

### 4.1 Module matrix

| # | Module | Status | Completion | What works | What is missing |
|---:|---|---|---:|---|---|
| 1 | Auth / Login | Mock | 10% | Demo role buttons, any credentials accepted, toast | Real credentials, hashing, sessions, lockout, MFA, SSO/SAML/LDAP, password reset, audit persistence |
| 2 | Dashboard | Mock | 65% | KPIs, charts, quick links, live badge | Uses static data; "Good morning" always; hardcoded hospital name; no live aggregation |
| 3 | Patients | Partial | 60% | Search, filters, pagination, detail panel, add patient, CSV export, start visit/invoice | Edit, delete, merge, documents, insurance editing, full demographics, archive, audit of changes |
| 4 | Appointments | Partial | 50% | Day/week view, add appointment, status updates | Edit/delete, drag-reschedule, availability, reminders, conflicts, waitlist, recurrence |
| 5 | OPD | Mock | 35% | Static queue, tabs, detail panel, modals open | Queue state transitions, vitals capture, assignment, consultation completion, live counts |
| 6 | Emergency | Mock | 30% | Static triage board, filter by ESI, KPIs | New case registration into board, triage reassessment, disposition, timers, alerts |
| 7 | IPD | Partial | 45% | Bed board, admit patient, discharge bed | Transfers, ward rounds, discharge summaries, bed cleaning workflow, occupancy sync |
| 8 | EMR | Partial | 55% | Patient selector, timeline (static), notes, prescriptions modal, print | Problem list, allergies editing, meds management, immunizations, documents, e-prescribing |
| 9 | Nursing | Mock | 25% | Static tasks, note modal | Task assignment/complete, eMAR, vitals, handover, shift board |
| 10 | Billing | Partial | 60% | Invoice list, create invoice, collect payment, cancel, print, CSV | Edit/delete, refunds, discounts/taxes, insurance split, statements, receipts history |
| 11 | Pharmacy | Partial | 70% | POS, stock, batches, prescriptions, low-stock/expiry, restock, returns | Interaction checks, controlled drugs, insurance, supplier ordering, full Rx history |
| 12 | Lab | Partial | 55% | Orders, add order, status advance, result entry/verify, print | Sample tracking, barcode, reference ranges, critical alerts, analyzer/FHIR integration, QC |
| 13 | Radiology | Mock | 30% | Static study list, report download logs | Order entry, DICOM/PACS, worklist, radiologist sign-off, images |
| 14 | Inventory | Partial | 60% | Medicine stock, batches, adjust, restock, export | Supplies CRUD, requisitions, transfers, stocktake, reorder points, supplier links |
| 15 | Blood Bank | Partial | 75% | Donors, eligibility, donations, bags, expiry, compatibility, transfusions, reactions, export | Donor deferral workflow, component processing, crossmatch records, traceability reports |
| 16 | Purchases | Partial | 80% | PO lifecycle, approval, partial receipts, returns, supplier ledger, export | 3-way match, taxes per line, credit notes, PDF POs, multi-currency |
| 17 | Suppliers | Partial | 65% | List, add/update, balances, ledger, export | Delete, documents, contracts, performance, AP statements |
| 18 | Finance | Partial | 40% | Expenses (add/mock), P&L static, export | Chart of accounts, AP/AR, GL, payments, reconciliation, budgets, payroll, tax |
| 19 | HR | Partial | 35% | Staff directory, add staff, attendance chart (static), export | Shifts/roster, leave, credentials, payroll, training, performance |
| 20 | Reports | Mock | 35% | Four static BI tabs, print export | Real data, date ranges, filters, scheduled reports, CSV/XLSX, saved views |
| 21 | Communications | Mock | 30% | Static threads, local message append, announcements | Email/SMS/WhatsApp, templates, campaigns, attachments, real inbox |
| 22 | Telemedicine | Mock | 15% | Fake video call UI, mic/video toggles | WebRTC, scheduling, waiting room, chat, screen share, recording, consent |
| 23 | Settings | Partial | 50% | Tabs, theme/accent/density, local toggles, hospital form | Live user list, integration credentials, email/SMS config, tax/currency, persistence |
| 24 | Roles & Permissions | Partial | 65% | User CRUD (in-memory), role matrix viewer, export | Custom roles, editable matrix, server enforcement, invitations, password policy |
| 25 | Activity Log | Partial | 60% | Filters, search, export, clear (super admin) | Persistence, immutability, tamper evidence, retention, server-side audit |
| 26 | Backup & Restore | Partial | 40% | Create/download/restore with checksum | Real DB backup, scheduler, offsite/S3, encryption, restore that survives reload |
| 27 | Insurance | Missing | 0% | Placeholder text | Entire module |
| 28 | Services | Missing | 0% | Placeholder text | Entire module |

### 4.2 Modules that are mostly static (read-only)

Dashboard, Emergency, Nursing, Radiology, Reports, Communications, Telemedicine, plus the OPD queue. They are visually complete but do not mutate state beyond toasts/logs. Several show a pulsing "LIVE" badge over static arrays (`Dashboard.tsx:72`, `OPD.tsx:65`), which is misleading.

### 4.3 Modules with real in-memory workflows

Purchases (POs/receipts/returns), Blood Bank, Pharmacy stock/batches, Billing invoices/payments, Roles user CRUD, Activity Log, Backup (single session). These are the strongest parts of the project and show the intended architecture.

---

## 5. Functional Requirements Backlog

### 5.1 Platform / foundation

- [ ] Database schema for patients, encounters, orders, invoices, inventory, users, audit, etc.
- [ ] Server API (REST or tRPC / server actions) with validation.
- [ ] Persistence across reloads and devices.
- [ ] Real authentication (password hashing, sessions/JWT, refresh, lockout).
- [ ] MFA, SSO/SAML/LDAP (currently only text on the login screen).
- [ ] Server-side RBAC and tenant isolation.
- [ ] Immutable, persisted audit log.
- [ ] Real global search across patients, invoices, orders.
- [ ] File upload/storage for documents, reports, images.
- [ ] Real-time notifications (SSE/WebSocket).
- [ ] URL-based routing and deep links; refresh-safe pages.
- [ ] Error boundaries, loading states, empty states.
- [ ] Pagination/virtualization for large tables.
- [ ] Internationalization and RTL; currency/locale configuration.
- [ ] Data import/migration tools.

### 5.2 Clinical

- [ ] Patient registration, edit, merge, archive, consent, documents.
- [ ] Appointment scheduling with availability, conflicts, reminders, rescheduling.
- [ ] OPD queue state machine (waiting â†’ vitals â†’ consultation â†’ completed).
- [ ] Vitals capture and abnormal-value flagging.
- [ ] Consultation notes, diagnoses, orders, prescriptions.
- [ ] Emergency triage scoring, reassessment, disposition.
- [ ] IPD admission/transfer/discharge, rounds, discharge summary.
- [ ] EMR problem list, allergies, medications, immunizations, history.
- [ ] Nursing task board and eMAR (medication administration).
- [ ] Lab sample tracking, results, reference ranges, critical alerts.
- [ ] Radiology orders, DICOM/PACS, reporting, sign-off.
- [ ] Pharmacy dispensing, interaction checks, controlled substances.
- [ ] Blood bank donor screening, crossmatch, traceability.
- [ ] Telemedicine WebRTC with waiting room and consent.
- [ ] Insurance eligibility, pre-auth, claims, remittance.
- [ ] Services catalog and pricing.

### 5.3 Revenue / supply / operations

- [ ] Invoice editing, refunds, discounts, taxes, insurance split.
- [ ] Payments, receipts, statements, aging reports.
- [ ] Chart of accounts, AP/AR, GL, payroll, budgets, reconciliation.
- [ ] HR shifts/roster, leave, credentials, training, payroll.
- [ ] Supply inventory, requisitions, transfers, stocktake, reorder points.
- [ ] Purchase approval workflow, 3-way match, credit notes.
- [ ] Supplier contracts, documents, performance, AP statements.
- [ ] Real reports with filters and scheduled exports.
- [ ] Email/SMS/WhatsApp communications with templates/campaigns.
- [ ] Settings for currency, tax, branding, integrations, retention.
- [ ] Real scheduled backups with offsite storage and restore drills.
- [ ] Activity log retention, search, tamper evidence.

### 5.4 Non-functional

- [ ] WCAG 2.2 AA accessibility.
- [ ] Security hardening (see section 7).
- [ ] HIPAA/GDPR controls and documentation.
- [ ] Performance budgets and bundle splitting.
- [ ] Observability (logs, metrics, traces, error tracking).
- [ ] Automated tests (unit, integration, E2E, a11y, load).
- [ ] CI/CD, Docker, environments, migrations.
- [ ] Documentation (README, setup, architecture, runbooks).
- [ ] License and legal documents.

---

## 6. Non-Functional Audit

| Area | Status | Findings |
|---|---|---|
| Performance | Weak | All 25 modules are eagerly imported in `src/app/page.tsx`; no `dynamic()`/code splitting. 48 UI primitives + large charts in one bundle. No memoized selectors in many places. Lint flags arrays recreated each render. |
| Accessibility | Weak | Modals are custom `motion.div`s (`ModalHost.tsx:165-179`) with no `role="dialog"`, `aria-modal`, focus trap, or Escape handler. Only 10 `aria-label`s in the entire codebase; zero `aria-*` beyond that; zero `role=`. No `alt` text (no images). No skip link. No reduced-motion handling. Color contrast on glass/white text is questionable. |
| Responsiveness | Good | 110 responsive utility usages; mobile sidebar and card grids exist. Tables still overflow horizontally. |
| Reliability | Weak | No error boundaries, `loading.tsx`, or `error.tsx`. A single render error can blank the app. No retry/offline handling. |
| Scalability | Not applicable | Client-only; every list is rendered from memory. No pagination except Patients. |
| Maintainability | Weak | Monolithic store/modal/page files; 24 `any` usages; duplicated role types; dead code. |
| Testability | None | No test framework, mocks, or fixtures. Store logic is entangled with UI toasts. |
| Observability | None | No structured logging, metrics, tracing, or error tracking. `console.*` absent (good) but nothing logs to a service. |
| SEO | Weak | Metadata exists, but the app is an authenticated SPA. `robots.txt` allows everything. No `sitemap.xml`, no Open Graph/Twitter cards, no manifest. |
| i18n | None | `next-intl` installed but unused; all strings hardcoded English. |
| Offline/PWA | None | No service worker, manifest, or offline state. |
| Browser support | Unknown | No browserslist, no polyfill strategy, no documented support matrix. |
| Documentation | None | No README, setup guide, architecture doc, API docs, or runbooks. |
| Legal | Missing | No LICENSE, terms, privacy policy, or BAA template (critical for a hospital product). |
| DevOps | Weak | `output: "standalone"` and a Caddyfile exist, but no Dockerfile, compose, CI, environment config, or migrations. |

---

## 7. Security & Compliance Audit

**This is the most serious part of the audit. Do not present this as HIPAA-compliant.**

| # | Issue | Evidence | Impact |
|---:|---|---|---|
| S1 | Any non-empty username/password logs in as doctor | `LoginScreen.tsx:59-62` | Total auth bypass |
| S2 | Demo credentials hardcoded in the client bundle | `LoginScreen.tsx:25-34` | Credential disclosure |
| S3 | Passwords never checked; no hashing | `LoginScreen.tsx:45-66`, `app-store.ts:725-743` | No identity assurance |
| S4 | No session/token; auth is a boolean in memory | `app-store.ts:722` | Refresh logs out; no session control |
| S5 | RBAC enforced only in the browser | `app-store.ts:790-818`, `AppShell.tsx:170` | Trivially bypassed via devtools |
| S6 | PHI stored unencrypted in localStorage | `storage.ts`, `app-store.ts:1715`, BackupRestore download | HIPAA/GDPR violation risk |
| S7 | False claims: "HIPAA Compliant", "End-to-end encrypted", "SOC 2", "99.99% uptime", "Trusted by 240+ hospitals" | `LoginScreen.tsx:97-99,137-145`, `Telemedicine.tsx:60` | Legal/marketing misrepresentation |
| S8 | No input validation/sanitization layer | `zod` installed but unused; modals use raw strings | Injection/XSS risk once a backend exists |
| S9 | No CSRF/CSP/security headers/rate limiting | No middleware or headers config | Standard web hardening absent |
| S10 | No audit immutability; log can be cleared and is in-memory | `ActivityLog.tsx`, `app-store.ts` | No credible audit trail |
| S11 | No secrets management; `.env` absent | No `.env.example` before this audit | Misconfiguration risk |
| S12 | TypeScript errors ignored at build time | `next.config.ts:6-8` | Type defects can ship |
| S13 | React strict mode disabled | `next.config.ts:9` | Hides unsafe effects |
| S14 | Public unauthenticated module routes | `src/pages` build output | Auth bypass by URL |
| S15 | Backup data is downloadable JSON containing all PHI | `BackupRestore.tsx:62-82` | Data exfiltration risk |
| S16 | No dependency vulnerability scanning | No CI/audit script | Supply-chain risk |

**Minimum before any real deployment:** real auth, server-side authorization, encrypted database, HTTPS, secrets management, audit logging, input validation, rate limiting, dependency scanning, security headers, and removal of all compliance claims until actually certified.

---

## 8. Data Layer Audit

- `prisma/schema.prisma` contains only the default `User` and `Post` models â€” unrelated to a hospital system (`schema.prisma:16-32`).
- `src/lib/db.ts` initializes Prisma but **is imported nowhere**.
- No `DATABASE_URL` was configured (now documented in `.env.example`).
- No migrations directory.
- No domain models for patients, appointments, invoices, medicines, batches, POs, blood bank, audit, etc.
- All 48 datasets live in `src/lib/data.ts` and are re-exported statically.
- Zustand state is initialized from seeds on every load; there is **no `persist` middleware** (`app-store.ts:720`).
- Only the backup index and theme are persisted (`app-store.ts:1715`, `theme.ts:140`).
- **Result: every patient, invoice, PO, stock adjustment, donation, and audit entry is lost on refresh.**
- Restore writes to the in-memory store, then `BackupRestore.tsx:336` reloads the page â€” which resets the store to seeds. **Restore is effectively a no-op after reload.**
- Automatic backups never run: only the schedule object is stored (`app-store.ts:890-900`); no `setInterval`/cron/worker exists. The seeded activity log even claims an auto-backup completed (`app-store.ts:712`).

---

## 9. UI / UX and "AI Slop" Verdict

### 9.1 Score

| Criterion | Score | Notes |
|---|---:|---|
| Visual craft | 7.5 / 10 | Real tokens, consistent spacing, good data density, solid dark mode. |
| Design-system consistency | 8 / 10 | oklch brand ramp, semantic tokens, accent/radius/density system. |
| Originality | 5 / 10 | Clean Epic/Cerner-inspired, but generic premium-SaaS styling. |
| Product authenticity | 4 / 10 | Static data, fake claims, invented integrations, "LIVE" badges over mocks. |
| Accessibility | 3 / 10 | Custom modals, almost no ARIA, no focus management. |
| Content quality | 4 / 10 | Repeated template copy; stale July-2026 data; wrong currency in places. |
| **Overall UI** | **6.5 / 10** | Good-looking prototype, not production UI. |

### 9.2 Why it is NOT classic AI slop

- It uses a coherent design system rather than random Tailwind classes: brand ramp, semantic colors, chart palette, radius scale, density scale (`globals.css`).
- Dark mode, 8 accents, and pre-hydration theme bootstrap are thoughtfully implemented (`layout.tsx:35-61`, `theme.ts`).
- Layout hierarchy is generally sound: grouped navigation, clear page headers, KPI rows, tables, detail panels.
- Numbers use `tabular-nums`, statuses use status pills, avatars are consistent.
- Motion is restrained and purposeful (page transitions, list animations).

### 9.3 Why it still reads as AI-generated

1. **Marketing fiction instead of product truth.** "99.99% uptime", "SOC 2 Certified", "HIPAA Compliant", "Trusted by 240+ hospitals", "End-to-end encrypted" â€” none are implemented (`LoginScreen.tsx:137-145`).
2. **Fake integrations.** Twilio, Stripe, S3, SendGrid, HL7/FHIR are labeled "connected" with no code (`Settings.tsx:66-73`).
3. **Fake AI.** An "AI Assistant" card promising 3x faster notes that only fires a "coming soon" toast (`AppShell.tsx:221-235`), while `z-ai-web-dev-sdk` sits unused.
4. **"LIVE" over static arrays.** Pulsing live badges on data that never changes (`Dashboard.tsx:72`, `OPD.tsx:65`, `Telemedicine.tsx:54`).
5. **Template repetition.** Nearly every module is: header + KPI cards + chart + table/cards + modal. Same gradient/glass/glow vocabulary everywhere.
6. **Generic premium-SaaS aesthetic.** Mesh gradients, floating glass cards on login, glow shadows, gradient buttons â€” the 2024-26 AI design clichÃ©.
7. **Structural tells.** `src/pages` mistaken for a router, a 1,760-line ModalHost, a 1,885-line store, a 768-line `.orig` backup file committed to git, 48 UI components of which only 15 are used.
8. **Stale/hardcoded content.** Seeded dates cluster around July 2026 (`app-store.ts:706`); hospital name hardcoded in Dashboard and print output instead of using the hospital profile; currency variable defaults to `AFN` but the UI prints `$` (`Dashboard.tsx:50`, `print.ts`).
9. **Claims of layered enforcement** ("UI, store, and data-operation levels") while everything is client-side (`Settings.tsx:211-215`).

### 9.4 Bottom line

The UI is **above average for AI-generated work** and has genuine craft. But it is **demo-ware**: polished surfaces over static data and fictional claims. Fix the truthfulness, wire real data, and it could become a credible product UI. Ship it as-is and it looks impressive for 30 seconds and then fails every real workflow.

---

## 10. Code Quality & Technical Debt

| Issue | Details |
|---|---|
| Monoliths | 1,885-line store, 1,760-line modal host, 1,286-line data file. |
| Duplicated role systems | `Role` in `data.ts` lacks `dentist`, `lab_staff`, `pharmacy_manager`, etc.; `ExtendedRole` in `rbac.ts` has them. Mapping exists only in `toExtendedRole`, which the shell never calls. |
| Type safety holes | 24 `any`/`as any` usages; `modalContext: any`; `ignoreBuildErrors: true`; `noImplicitAny: false`. |
| Dead code | `ModulePlaceholder.tsx` unused; 5 `ModalType` members have no handler; `src/pages` used as both components and routes. |
| Unused dependencies | `z-ai-web-dev-sdk`, `next-auth`, `next-intl`, `next-themes`, `@tanstack/react-query`, `@tanstack/react-table`, `@mdxeditor/editor`, `react-markdown`, `react-syntax-highlighter`, `uuid` (10 packages). |
| Unused UI primitives | 33 of 48 `src/components/ui` files are never imported. |
| Orphaned config | `tailwind.config.ts` uses `hsl(var(--â€¦))`, but `globals.css` defines `oklch` values, and Tailwind v4 never loads this file (no `@config`). It is misleading dead config. |
| Lint | No config before this audit; now 15 errors + 8 warnings. |
| CSS | Two competing color systems (`oklch` in CSS, `hsl()` in Tailwind config). |
| Forms | No validation library wired; all modal validation is ad-hoc. |
| Navigation | No URL routing; back/forward and deep links do not work. |
| State | No persistence middleware; no selectors; entire store subscriptions in many components. |
| Comments | Helpful in places, but also marketing/aspirational comments that overstate implementation. |

---

## 11. Verification Results

Commands run during this audit:

```text
npx tsc --noEmit          â†’ no output (passes with current loose settings)
npm run build             â†’ compiles successfully in ~45s; static generation of 30 routes
npm run lint              â†’ FAILED originally (no eslint config)
                            after adding eslint.config.mjs: 15 errors, 8 warnings
```

Notable build output: `Route (pages)` lists `/ActivityLog` through `/Telemedicine`, confirming the accidental Pages Router exposure.

Lint error categories:

- `react-hooks/purity` â€” `Date.now()` / `Math.random()` during render (Finance, Inventory, Pharmacy, sidebar).
- `react-hooks/set-state-in-effect` â€” setState directly in effects (AppShell command palette, carousel, use-mobile).
- `react/no-unescaped-entities` â€” apostrophes in JSX (Purchases, Settings, Telemedicine).
- Missing hook dependencies (several warnings).

---

## 12. Critical Bugs (P0)

| ID | Bug | Evidence | Impact | Fix |
|---|---|---|---|---|
| P0-1 | No persistence of operational data | `app-store.ts:720` (no `persist`); only backup index/theme persisted | All work lost on refresh | Add real DB/API; or at minimum Zustand `persist` |
| P0-2 | Any non-empty credentials authenticate | `LoginScreen.tsx:59-62` | Complete auth bypass | Real credential check + hashed passwords + sessions |
| P0-3 | `src/pages` exposes 25 unauthenticated routes | `next build` output | Auth bypass via URL | Rename folder to `src/screens`, update imports |
| P0-4 | Backup restore is lost after reload | `BackupRestore.tsx:336` reloads; store reloads from seeds | "Disaster recovery" does nothing | Persist restored snapshot and load it on boot, or restore server DB |
| P0-5 | RBAC role mismatch disables nav for two demo roles | `data.ts:202,205` (`lab_tech`, `inventory_manager`) vs `rbac.ts:19,22` (`lab_staff`, `inventory_staff`); `AppShell.tsx:170` uses raw role | Lab tech and inventory manager see almost no modules | Normalize roles via `toExtendedRole` everywhere |
| P0-6 | PHI in unencrypted localStorage + false HIPAA claims | `storage.ts`, `LoginScreen.tsx:97` | Compliance/legal exposure | Encrypt, move to server, remove claims |
| P0-7 | Client-only authorization | `app-store.ts:790-818` | Permission bypass | Enforce on server |
| P0-8 | No error boundaries | no `error.tsx`/`global-error.tsx` | One render error can blank the app | Add boundaries per route |
| P0-9 | Type checks skipped at build | `next.config.ts:6-8` | Type bugs ship | Remove `ignoreBuildErrors` |
| P0-10 | Prisma/database entirely unused | `schema.prisma:16-32`, `db.ts` | No source of truth | Model the domain and use it |
| P0-11 | Auto-backup never executes | `app-store.ts:890-900`; no scheduler | Data loss risk | Server cron/worker |
| P0-12 | Login screen claims SSO/SAML/LDAP supported | `LoginScreen.tsx:290-292` | Misrepresentation | Implement or remove |

---

## 13. High / Medium / Low Issues

### High

- `ModalHost.tsx.orig` (768 lines) committed to git â€” remove from tracking.
- `tsconfig.tsbuildinfo` committed â€” generated file.
- Missing `/favicon.ico` referenced by `layout.tsx:29` (public only has `logo.svg`, `robots.txt`).
- Settings page uses static `SYSTEM_USERS`, so new/edited users never appear (`Settings.tsx:42,80,122`).
- No patient edit/delete; no appointment edit/delete; no invoice edit/delete; no staff delete.
- Inconsistent currency: `AFN` default vs `$` everywhere (`Dashboard.tsx:50`).
- Hardcoded hospital identity in Dashboard/print instead of `hospital` settings (`Dashboard.tsx:79`, `print.ts:37`).
- Stale seeded dates (July 2026) presented as live.
- Modal accessibility (no dialog role/focus trap/Escape).
- No pagination on most tables.
- No loading/empty/error states.
- No input validation for forms.
- `notificationsRead` is a `Set` in Zustand â€” not serializable/persistable.
- Dead `ModalType` members (`newInventoryItem`, `newImagingOrder`, `restoreBackup`, `editUser`, `editPermissions`).
- "Bed management (demo)" toast on IPD; "History (demo)" on Pharmacy; attach/emoji "coming soon" in Communications; telemedicine controls are toasts.

### Medium

- `next.config.ts` disables React strict mode.
- `tailwind.config.ts` is dead/misleading under Tailwind v4.
- `components.json` points to a config that is not loaded.
- `package.json` name is the template default `nextjs_tailwind_shadcn_ts`.
- No `engines`/package manager pin; `bun-types` installed but no Bun usage.
- Caddyfile exposes plain HTTP on `:81`; no TLS/headers.
- No `Dockerfile` despite `output: "standalone"`.
- No CI, tests, or coverage.
- No README/LICENSE/CHANGELOG.
- Unused dependencies inflate install time and attack surface.
- 33 unused UI component files.
- Activity log seeded entries and in-memory retention.
- `getAllPatients`/`getAllAppointments` helpers read global store state outside React (fragile).

### Low

- `eslint-config-next` flat config now exists but the project still has lint errors.
- Repeated inline table markup instead of the shadcn `Table` primitive.
- Inline color literals (`oklch(...)`) scattered through charts instead of tokens.
- Mixed date formatting (`toLocaleDateString`, `toISOString().slice`).
- No favicon/manifest/OG image.
- `robots.txt` allows indexing a private app.

---

## 14. Files Added During This Audit

| File | Purpose |
|---|---|
| `.gitignore` | Ignore `node_modules`, `.next`, build output, env files, databases, logs, coverage, editors, OS files, `*.orig`, `*.tsbuildinfo`. |
| `.env.example` | Documents `DATABASE_URL` and optional auth/AI/integration variables. |
| `eslint.config.mjs` | Flat ESLint config using `eslint-config-next` so `npm run lint` works. |
| `.editorconfig` | UTF-8, LF, 2-space indentation, final newline. |
| `audite.md` | This document. |

### Recommended cleanup (not executed, because it changes the git index)

```bash
git rm --cached src/components/shell/ModalHost.tsx.orig
git rm --cached tsconfig.tsbuildinfo
```

Both are now covered by `.gitignore` but remain tracked until removed from the index.

---

## 15. Gap Analysis and Remaining Work

### 15.1 Remaining work by priority

| Priority | Work | Effort (dev-days) |
|---|---|---:|
| P0 | Rename `src/pages` â†’ `src/screens`; remove duplicate routes | 0.5 |
| P0 | Real auth (hashed passwords, sessions, lockout) | 4-6 |
| P0 | Server-side RBAC + audit log | 4-6 |
| P0 | Database schema + migrations + seed | 8-12 |
| P0 | API/server actions for all entities | 15-20 |
| P0 | Persistence + load-on-boot + restore correctness | 4-6 |
| P0 | Fix role mapping; remove false claims | 1-2 |
| P1 | Patient/appointment/invoice/staff edit+delete | 6-8 |
| P1 | OPD/Emergency/Nursing/IPD state machines | 10-14 |
| P1 | Lab/Radiology order + result workflows | 8-10 |
| P1 | Pharmacy interaction checks, controlled drugs | 6-8 |
| P1 | Reports on real data + filters/exports | 6-8 |
| P1 | Communications (email/SMS) + templates | 6-8 |
| P1 | Telemedicine WebRTC | 10-15 |
| P1 | Insurance/claims module | 10-15 |
| P1 | Finance (GL/AP/AR/payroll) + HR (roster/leave/payroll) | 20-30 |
| P2 | Real backups (offsite, encrypted, scheduled, tested) | 5-8 |
| P2 | Accessibility remediation to WCAG 2.2 AA | 8-12 |
| P2 | Error/loading/empty states + pagination | 4-6 |
| P2 | Tests: unit, integration, E2E, a11y, load | 15-25 |
| P2 | CI/CD, Docker, environments, migrations | 4-6 |
| P2 | Observability (logs, metrics, tracing, alerts) | 4-6 |
| P2 | Documentation, README, LICENSE, runbooks | 3-5 |
| P3 | i18n/RTL, PWA/offline, theming polish | 6-10 |
| P3 | Remove dead code/deps/components; split monoliths | 5-8 |

**Total: roughly 180-280 developer-days (â‰ˆ 8-13 months for one developer, or 4-6 months for a small team).** The current UI/design work covers perhaps 20-25% of that effort; the remaining 75-80% is backend, security, workflows, and QA.

### 15.2 What "100%" means for this product

A true 100% hospital system is not a fixed target â€” it includes clinical safety, regulatory certification, integrations (HL7/FHIR/DICOM), billing/claims, payroll, and operational hardening. Realistically:

- **Demo-complete:** ~90% now achievable with persistence + edit/delete + real reports.
- **Pilot-ready (single clinic):** requires P0 + core P1 + security basics.
- **Enterprise/HIPAA-ready:** requires all P0/P1/P2 plus audits, pen tests, BAAs, and operational runbooks.

---

## 16. Recommended Roadmap to 100%

### Phase 0 â€” Stop the bleeding (1 week)
1. Rename `src/pages` â†’ `src/screens`; fix imports; delete accidental routes.
2. Remove false compliance/marketing claims from UI.
3. Normalize roles (`toExtendedRole` everywhere).
4. Remove tracked `.orig`/`tsbuildinfo`; add README/ LICENSE.
5. Make lint pass; re-enable TypeScript build checks and React strict mode.

### Phase 1 â€” Real foundation (3-5 weeks)
1. Design the domain schema in Prisma (or another ORM) and migrate.
2. Build the API/server actions with Zod validation.
3. Implement real auth (credentials + Argon2/bcrypt, sessions, lockout, MFA-ready).
4. Server-enforce RBAC; persist audit log.
5. Replace Zustand seeds with server data; add React Query.
6. Add error boundaries, loading states, pagination.

### Phase 2 â€” Clinical core (6-10 weeks)
1. Patients (CRUD, documents, consent, merge).
2. Appointments (availability, conflicts, reminders).
3. OPD/Emergency/IPD/Nursing state machines and documentation.
4. EMR problem list, meds, allergies, orders.
5. Lab and Radiology order-to-result workflows.
6. Pharmacy dispensing and inventory integration.
7. Blood bank traceability.

### Phase 3 â€” Revenue and operations (6-10 weeks)
1. Billing, payments, insurance/claims.
2. Finance GL/AP/AR/payroll.
3. HR roster/leave/credentials.
4. Purchasing 3-way match, supplier statements.
5. Reports on real data, scheduled exports.
6. Communications (email/SMS) and telemedicine.

### Phase 4 â€” Production hardening (4-6 weeks)
1. Security review + pen test + dependency scanning.
2. WCAG 2.2 AA remediation.
3. Real backups (offsite/encrypted/scheduled/restore drills).
4. Observability, CI/CD, Docker, environments.
5. Unit/integration/E2E/load tests.
6. Documentation, runbooks, incident response.

### Phase 5 â€” Compliance and scale (ongoing)
1. HIPAA/GDPR program, BAAs, policies, data retention, DSAR.
2. Audit/certification readiness.
3. Multi-tenancy, SLAs, monitoring, capacity planning.

---

## 17. Final Scorecard

| Area | Grade | Comment |
|---|---|---|
| Visual design | B+ | Coherent, polished, themeable. |
| UX for a demo | B | Convincing, fluid, but many dead-end buttons. |
| Product completeness | D | ~40%; no backend or persistence. |
| Functional depth | C- | A few strong workflows, many read-only screens. |
| Data architecture | F | Prisma unused; all data in memory/static. |
| Auth & security | F | Fake auth, client RBAC, PHI in localStorage. |
| Compliance | F | Claims are false; no controls. |
| Accessibility | D- | Custom modals, few ARIA attributes. |
| Testing | F | None. |
| Documentation | F | None before this audit. |
| DevOps | D | Builds, but no CI/Docker/envs. |
| Maintainability | D | Huge generated files and dead code. |

**Overall: ~40% complete. A visually strong, structurally flawed prototype. The next 60% is almost entirely backend, security, workflow depth, and QA â€” not more UI.**

---

## Appendix A â€” Dependency Usage

| Dependency | Used? | Notes |
|---|:---:|---|
| `react`, `react-dom`, `next` | Yes | Core. |
| `zustand` | Yes | Global store. |
| `recharts` | Yes | Dashboard/reports charts. |
| `framer-motion` | Yes | Page/list/modal motion. |
| `lucide-react` | Yes | Icons. |
| `react-hook-form`, `@hookform/resolvers` | No | Only shadcn `form.tsx` uses it. |
| `zod` | No | Not imported anywhere. |
| `@prisma/client`, `prisma` | No | `db.ts` unused; schema boilerplate. |
| `next-auth` | No | Auth is fake. |
| `next-intl` | No | No i18n. |
| `next-themes` | No | Custom theme system instead. |
| `@tanstack/react-query` | No | No server state. |
| `@tanstack/react-table` | No | Hand-rolled tables. |
| `@mdxeditor/editor` | No | Unused. |
| `react-markdown`, `react-syntax-highlighter` | No | Unused. |
| `uuid` | No | Custom `uid()` helper. |
| `z-ai-web-dev-sdk` | No | "AI Assistant" is fake. |
| `sharp` | No | No image optimization. |
| `sonner` | No | Uses shadcn toast instead. |
| `embla-carousel-react`, `vaul`, `input-otp`, `cmdk`, `@dnd-kit/*`, `react-resizable-panels`, `react-day-picker`, `@reactuses/core` | No | Only backing unused UI primitives. |

## Appendix B â€” Unused UI Primitives (33 of 48)

`accordion`, `alert-dialog`, `aspect-ratio`, `breadcrumb`, `calendar`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `drawer`, `form`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `table`, `tabs`, `toggle`, `toggle-group`, `tooltip`.

Used: `alert`, `avatar`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `select`, `switch`, `textarea`, `toast`, `toaster`.

## Appendix C â€” Route Exposure From Build

```text
Route (app)          Size
â”Œ â—‹ /                ...
â”œ â—‹ /_not-found
â”” Æ’ /api

Route (pages)        â† unintended
â”œ â—‹ /ActivityLog
â”œ â—‹ /Appointments
â”œ â—‹ /BackupRestore
â”œ â—‹ /Billing
â”œ â—‹ /BloodBank
â”œ â—‹ /Communications
â”œ â—‹ /Dashboard
â”œ â—‹ /Emergency
â”œ â—‹ /EMR
â”œ â—‹ /Finance
â”œ â—‹ /HR
â”œ â—‹ /Inventory
â”œ â—‹ /IPD
â”œ â—‹ /Lab
â”œ â—‹ /Nursing
â”œ â—‹ /OPD
â”œ â—‹ /Patients
â”œ â—‹ /Pharmacy
â”œ â—‹ /Purchases
â”œ â—‹ /Radiology
â”œ â—‹ /Reports
â”œ â—‹ /Roles
â”œ â—‹ /Settings
â”œ â—‹ /Suppliers
â”” â—‹ /Telemedicine
```

---

*End of audit. This document reflects the repository state at the time of writing and should be re-run after the P0 fixes.*
