# SCOPE.md — What MediCore is, and what it is not

Status: authoritative. Anything not listed under "In scope" needs owner approval before work starts.

## 1. Product statement
A web-based, multi-tenant hospital/clinic management system. A platform owner (`super_admin`) creates hospitals;
each hospital is an isolated tenant that gets only the modules the super admin switches on (modular monolith, see PLATFORM_MODULES.md) and never sees another hospital's data.
Target size per hospital: up to ~500 staff users. See MULTI_TENANCY.md.
It manages the patient journey (register → appointment → visit → orders → dispense/bill → follow-up),
the money around it, the stock behind it, and the staff who run it, with a full audit trail.

It is NOT a chat platform, a telehealth platform, a PACS/imaging viewer, or a full ERP.

## 2. Decisions on the inherited prototype

### 2.1 Removed (delete the code, routes, store actions, and dependencies)
| Item | Why |
|---|---|
| Communications module (threads, chat, announcements, attach/emoji) | Staff already have WhatsApp/Teams/phones. Hospitals do not run chat inside the HMS. Large surface, little value, real privacy risk. |
| Email, SMS, WhatsApp, push, or any outbound messaging | The product is pure hospital management. No provider, no gateway, no sending of anything. Login and password resets work without email (MULTI_TENANCY.md §6). |
| Telemedicine (fake video UI) | Needs WebRTC, consent, recording rules, and its own compliance. Out of scope. |
| "AI Assistant" card and `z-ai-web-dev-sdk` | Fake. Clinical AI needs safety review. Out of scope. |
| Backup & Restore screen | Backups belong to the database platform (Supabase PITR/daily backups), not to a browser button that downloads all PHI as JSON. A restore button inside the app is a data-loss and exfiltration risk. |
| Fake integrations labels (Twilio, Stripe, S3, SendGrid, HL7/FHIR) | Not implemented. Re-add only when a real integration ships. |
| SSO/SAML/LDAP, "SOC 2", "HIPAA compliant", uptime and customer-count claims | False today. |
| "LIVE" pulsing badges on static data | Misleading. Re-add only on real realtime data. |
| Services placeholder module | Becomes the service/price catalog inside Billing. |
| Theme sprawl: 8 accent colors, radius scale, density settings | Cost of testing every combination for no clinical value. Keep light/dark only. |
| Prisma (schema, `db.ts`) | Supabase migrations are the single source of truth for schema. Two schema tools means drift. |
| Unused deps: next-auth, next-intl*, next-themes, react-markdown, react-syntax-highlighter, @mdxeditor/editor, uuid, @tanstack/react-table, 33 unused shadcn primitives | Attack surface and noise. (*see i18n note below) |
| `ModalHost.tsx.orig`, `tsbuildinfo`, `tailwind.config.ts` (dead under Tailwind v4) | Junk. |

### 2.2 Simplified (keep, but cut down)
| Module | Keep | Cut |
|---|---|---|
| Finance | Expenses, daily cash/collection summary, simple profit/loss from real invoices and expenses, supplier payables | General ledger, chart of accounts, budgets, bank reconciliation, payroll, tax filing |
| HR | Staff directory, departments, shifts/roster, attendance, leave requests | Payroll, performance reviews, training, recruiting |
| Radiology | Order → report text → status, attach PDF report | DICOM/PACS, image viewer |
| Reports | A fixed set of real reports with date range + CSV export (see 4) | Custom report builder, scheduled reports, saved views |
| Alerts | Dashboard alerts computed from data (low stock, expiring batches, critical lab result, pending approvals) | Anything that sends a message outside the app or between people |
| Settings | Hospital profile, currency, tax rate, numbering formats, departments, user management | Integration credentials UI, theme options |
| Dashboard | A few real KPIs per role | Decorative charts over static arrays |

### 2.3 Deferred (build only on owner request)
Blood Bank · Insurance/claims · Payroll · FHIR/HL7 export.
Blood bank is deferred, not deleted. Every hospital gets every shipped module, so build it only when the owner decides it ships to all.

### 2.4 In scope — final module list
> Detailed functionality, workflows, statuses, reports and the P1/P2 build tags for every module are in `MODULE_SPECS.md`, which wins over the summaries below.

**Phase 1 (MVP, one hospital can run OPD end-to-end)**
0. Platform: super admin creates, suspends, and reactivates hospitals (MULTI_TENANCY.md)
1. Auth (hospital code + username + password + MFA), users, roles and permissions
2. Patients (register, edit, search, merge duplicates, archive, documents)
3. Appointments (schedule, reschedule, cancel, doctor availability, conflicts)
4. Visits / OPD (queue, vitals, consultation, orders, completion)
5. EMR-lite (notes, diagnoses, allergies, problem list, prescriptions, history timeline)
6. Billing (service catalog, invoices, payments, void/credit note, receipts)
7. Pharmacy (prescription → dispense, POS sale, batches, expiry)
8. Inventory (one stock engine shared with pharmacy: items, batches, movements, adjustments, reorder alerts)
9. Lab (orders, sample status, result entry, verify, print)
10. Audit log (read-only viewer, filters, export for auditors)
11. Dashboard (real, per-role) and Settings

**Phase 2**
IPD (wards, beds, admit/transfer/discharge, discharge summary) · Emergency (triage, disposition) · Nursing (task board, vitals, medication administration record) ·
Radiology (order/report) · Purchases and Suppliers (PO, goods receipt, return, supplier ledger) · HR-lite · Finance-lite · Real reports.

**Phase 3 (optional, flagged)**
See 2.3.

## 3. Functionality to INCREASE (the prototype lacks it, enterprise needs it)
- Real persistence, real auth, server-side authorization, immutable audit
- Edit, soft-delete/archive, and merge for patients; edit/cancel for appointments; void and credit notes for invoices
- State machines with enforced transitions (OPD queue, lab order, PO, IPD bed, invoice)
- Stock ledger (every stock change is a movement row) and atomic multi-step operations in Postgres functions
- Server-side pagination, search, and filtering on every list
- Optimistic concurrency (`version` column) so two users cannot silently overwrite each other
- Approvals with separation of duties (creator cannot approve), break-glass access to records outside your department
- User invitation, password reset, session list/revoke, forced MFA for privileged roles
- Printing and export that are permission-gated and audited
- URL-based routing per module (refresh-safe, deep links, back button)
- Clinical safety basics: allergy warning at prescribing, abnormal/critical value flags, duplicate-patient warning

## 4. Reports to build (Phase 2, real data only)
Daily collections · Outstanding invoices (aging) · Revenue by service/department/doctor · OPD/IPD census · Top diagnoses ·
Stock on hand and valuation · Expiring and low stock · Purchases by supplier · Lab turnaround time · Attendance and leave summary · Audit export.

## 5. Non-functional requirements — what changes
**Increase:** security, auditability, data integrity, backup/restore testing, test coverage, accessibility (WCAG 2.2 AA),
observability, error handling, performance budgets, documentation, CI/CD.
**Decrease / do not build:** PWA and offline mode, multi-region active-active, microservices, custom theming engine, realtime-everything,
multi-currency accounting, full i18n catalog (see below), SOC 2 program (until the business needs it).

**i18n/locale decision needed early:** the prototype defaults to the AFN currency and may need RTL languages (Dari/Pashto/Arabic).
If any non-English or RTL UI is required, decide now: retrofitting RTL and string extraction later is expensive.
Minimum now: no hardcoded currency symbols, no hardcoded hospital name, all dates/numbers via `Intl`, use logical Tailwind classes (`ms-`, `ps-`, `text-start`) instead of `ml-`, `pl-`, `text-left`.

## 6. Change control
Scope changes go through an ADR (`docs/adr/`). The owner approves. Update this file in the same PR.
