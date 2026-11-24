# PLATFORM_MODULES.md — Super admin, hospitals, modules, roles, dashboards

**Authority:** this file is the single source of truth for: the super admin, creating and managing hospitals, which modules a hospital has,
how hospital admins create roles and users, dashboards, and support sessions.
Where any other doc disagrees with this file, **this file wins** (section 19 lists the exact conflicts and they have been patched).
Read together with `MULTI_TENANCY.md` (tenant isolation), `RBAC.md` (permission rules), `SECURITY.md`, `ARCHITECTURE.md`.

---------------------------------------------------------------------
## 1. Glossary (use these words exactly, in code, UI, and docs)
| Term | Meaning |
|---|---|
| **Platform** | The whole system, run by the owner. |
| **Super admin** | Platform owner account. Belongs to no hospital. Creates and manages hospitals. |
| **Hospital** | A tenant: a hospital or clinic. Isolated from all others by `hospital_id`. |
| **Core** | Always-on parts every hospital has. Cannot be switched off. |
| **Module** | A switchable department-sized unit (Finance, HR, Pharmacy...). The super admin switches modules on or off per hospital. This is what is sold. |
| **Preset** | A saved bundle of modules for quick hospital creation. |
| **Hospital admin** | The first and main account of a hospital. Manages users, roles, settings. Sees everything in the enabled modules. |
| **Role** | Named set of permissions created by a hospital admin inside one hospital. |
| **Permission** | Atomic right: `<module>:<resource>:<action>`, e.g. `finance:invoice:void`. |
| **Support session** | Time-limited, reasoned, audited access of the super admin into one hospital (section 7). |
| **Sidebar** | The left navigation. (Never call it navbar. The top bar is the "top bar".) |

---------------------------------------------------------------------
## 2. Architecture decision: modular monolith
One Next.js app, one Supabase database. Each module is a self-contained folder with its own screens, actions, services, tables, permissions, and dashboard widgets.
Modules are **independent** (a hospital can run without most of them) and **connected** (through shared core pieces only).
Not microservices. Not separate apps per department. Reasons: one developer, offline on-premise installs, simple deploy, one place to enforce security.

### 2.1 The three connection mechanisms (the only allowed ways modules talk)
1. **Patient record (core).** Reception creates the patient once. Every module references `patients.id`.
2. **Orders (core).** `orders(id, hospital_id, patient_id, visit_id NULL, kind: lab|radiology, source: doctor|walk_in, paper_ref NULL, ordered_by NULL, status, ...)`.
   A doctor creates an order from a visit, **or** a lab/radiology technician creates a walk-in order from a paper request. Lab and Radiology never depend on the OPD module.
3. **Charges ledger (core).** `charges(id, hospital_id, patient_id, visit_id NULL, source_module, source_ref, service_id, description, quantity, unit_price_minor, currency, status: pending|invoiced|settled_slip|void, invoice_line_id NULL)`.
   Any module that makes something billable inserts a charge row. The Finance module turns pending charges into invoices.
   If Finance is off, the module prints a simple receipt slip and the charge is marked `settled_slip`. If Finance is enabled later, historical charges are still there.
4. **Stock engine (core, no screens of its own).** `stock_items`, `stock_batches`, `stock_locations`, `stock_movements` (append-only), plus Postgres functions `receive_stock`, `issue_stock`, `adjust_stock`. Pharmacy and Inventory are two *screens* on the same engine.

### 2.2 Hard rules of modularity
- A module **never reads or writes another module's tables**. It uses core tables or the other module's public service (`features/<x>/index.ts`).
- A module **never imports from another module's folder** except through `index.ts`. ESLint `no-restricted-imports` enforces it; CI fails otherwise.
- Core never imports from modules.
- Every module declares itself in one file `module.config.ts` (section 11). Nothing about modules is hardcoded elsewhere.
- Every permission, route, table, and dashboard widget belongs to exactly one module.

---------------------------------------------------------------------
## 3. Core (always on, no switch)
| Core item | Contains |
|---|---|
| **Reception** | Patient registration, search, edit, merge, archive, documents; appointments; queue/check-in |
| Orders, charges ledger, stock engine | Section 2.1 |
| **Users and roles** | Hospital admin manages users and roles (section 9) |
| **Audit log** | Hospital's own audit events |
| **Settings** | Hospital profile, currency, timezone, tax, numbering formats, departments list |
| **Dashboard** | Role-based summary dashboard (section 8) |

## 4. Module catalog (switchable)
> The detailed functions, workflows, statuses, reports and permissions of every module are in `MODULE_SPECS.md`. The tab lists below are the summary; if they differ, `MODULE_SPECS.md` wins.
| Key | Name | Tabs (sidebar items) | Hard needs | Soft needs (extra features if also on) |
|---|---|---|---|---|
| `opd` | Doctors and OPD | Visits, Consultation, Vitals, Diagnoses, Prescriptions, Patient history (EMR-lite) | core | `lab`, `radiology`, `pharmacy` (orders and prescriptions flow there), `finance` |
| `lab` | Laboratory | Worklist, Walk-in order, Results, Verification, Reports/print, Test catalog | core | `opd` (orders from visits), `finance` |
| `radiology` | Radiology | Worklist, Walk-in order, Reports, Attachments (images/PDF), Exam catalog | core | `opd`, `finance` |
| `pharmacy` | Pharmacy | Prescriptions to dispense, POS sale, Stock and batches, Expiry and low stock, Returns, Receive stock | core (stock engine) | `opd` (e-prescriptions), `finance`, `inventory` (restock via purchase orders) |
| `inventory` | Inventory and Purchasing | Items, Batches, Stock-in/out, Adjustments, Suppliers, Purchase orders, Goods receipts, Purchase returns | core (stock engine) | `finance` (supplier payables), `pharmacy` |
| `finance` | Finance | Invoices, Payments and receipts, Credit notes/voids, Daily close, Expenses, Supplier payables, Financial reports, Service price list | core (charges ledger) | all charge-producing modules |
| `hr` | HR | Staff directory, Departments, Shifts/roster, Attendance, Leave | none | `finance` (later: payroll) |
| `inpatient` | Inpatient, Nursing and Emergency | Bed board, Admissions, Transfers, Discharge, Nursing tasks, Vitals charting, Medication administration, Emergency triage board | `opd` | `pharmacy`, `lab`, `finance` |
| *(deferred)* `blood_bank`, `insurance`, `payroll` | Not built until owner decides | | | |

Notes
- Dependencies are **data**, stored in `modules.requires` and `modules.soft_requires`, mirrored in each `module.config.ts`. A CI test asserts both match.
- Reception is core, so the single patient registration screen feeds every module.
- Services/price list lives in Finance. If Finance is off, Lab/Radiology/Pharmacy keep their own simple price fields on their catalogs; when Finance is enabled later, a one-time import maps them to the service list.
- "Sidebar items" above are the tabs. Each tab has permissions (section 10).

### 4.1 What happens when a soft dependency is missing (degradation rules)
| Situation | Behavior |
|---|---|
| `opd` off | Lab and Radiology show **Walk-in order** (technician enters patient and tests from a paper request). Pharmacy shows **Walk-in prescription** entry. |
| `finance` off | Charge-producing modules print a receipt slip and mark charges `settled_slip`. No invoices screen anywhere. Daily totals come from the charges ledger on the dashboard. |
| `inventory` off | Pharmacy has a simple **Receive stock** form (supplier name as free text). No purchase orders. |
| `pharmacy` off, `inventory` on | Inventory manages general supplies. No dispensing screens. |
| `lab`/`radiology` off, `opd` on | Doctors cannot order that kind of test; the order button is not shown. |
| `hr` off | No staff directory. User accounts still exist (core). |

## 5. Presets (starting points; custom allowed)
| Preset | Modules (plus core) |
|---|---|
| Small clinic | `opd`, `pharmacy` |
| Clinic with lab | `opd`, `pharmacy`, `lab`, `finance` |
| Hospital | `opd`, `pharmacy`, `lab`, `radiology`, `finance`, `inventory`, `inpatient` |
| Full | all non-deferred modules including `hr` |
| Custom | any selection that satisfies hard dependencies |
Only the combinations the owner actually sells are tested (section 17). A new combination requires the module-combination test to pass before offering it.

---------------------------------------------------------------------
## 6. Super admin: creating and managing hospitals
Platform area lives under `src/app/(platform)/`, reachable only by `super_admin`. Everything here uses the admin Supabase client inside `src/server/admin/` (`server-only`) and writes to the **platform audit log**.

### 6.1 Screens
1. **Platform dashboard.** Totals only: hospitals by status, modules adoption, users count per hospital, last activity per hospital, storage used. **No patient-level data.**
2. **Hospitals list.** Name, code, status, country, modules enabled (chips), users, created date, last activity. Search and filter.
3. **Create hospital (wizard, 4 steps).**
   - Step 1 Basic information: name, unique code (lowercase, `[a-z0-9-]`, 3-30), country, timezone, currency (ISO 4217), tax rate, address, phone, logo (optional).
   - Step 2 Modules: preset picker, then one switch per module with description. Turning on a module auto-turns on its hard needs and shows why. Turning off a module is blocked while another enabled module hard-needs it. Soft needs show an informational note.
   - Step 3 First hospital admin: full name, username, temporary password (generated, shown once, copy button), optional phone. `must_change_password = true`.
   - Step 4 Review and create. One transaction (section 6.3).
4. **Manage hospital (detail page).** This is the "open hospital" screen. Tabs:
   - **Overview:** basic info (editable), status, enabled modules, user counts per role, usage summary (counts only), recent platform actions on this hospital.
   - **Modules:** the same switches, editable at any time, with a change log (who, when, from, to, reason required).
   - **Users:** list of the hospital's **hospital admin accounts**: reset password, deactivate, create an additional admin. (Staff accounts are managed by the hospital admin.)
   - **Support sessions:** history and the "Start support session" button (section 7).
   - **Status:** suspend, reactivate, archive (confirm with typed hospital code and a reason).
5. **Platform audit log.** Hospital created, modules changed, status changed, password reset, support session requested/approved/started/ended, super admin logins. Append-only.

### 6.2 What a super admin can and cannot do
| Can | Cannot |
|---|---|
| Create, edit basic info, switch modules, suspend/reactivate/archive hospitals | Read patient, billing, HR, or stock records **outside** a support session |
| Create and reset hospital admin accounts | See any password. Reset only sets a new temporary one |
| See counts and totals per hospital | Edit or delete audit logs |
| Start a support session (section 7) | Hard-delete a hospital from the UI |
Module changes are **additive-safe**: turning a module off hides it and blocks its actions but **never deletes data**. Turning it on again restores everything as it was.

### 6.3 Hospital creation function (one Postgres function, one transaction)
`platform.create_hospital(input jsonb) returns uuid`, called by a server action via the admin client:
1. Validate input (Zod in the action, constraints in the function). Validate module dependencies.
2. Insert `hospitals` (status `active`).
3. Insert `hospital_modules` rows (one per catalog module, `enabled` true/false).
4. Insert `hospital_settings` and `hospital_counters` defaults.
5. Create the auth user (`auth.admin.createUser`, internal email `username@code.medicore.invalid`, `email_confirm: true`) and `profiles` row (`must_change_password = true`).
6. Create the system role `hospital_admin` for this hospital and assign it.
7. Insert platform audit event.
On any failure everything rolls back; the created auth user is deleted by compensation.
Editing modules later: `platform.set_hospital_modules(hospital_id, modules jsonb, reason text)` with the same dependency validation and an audit event, then forces token refresh (section 12).

---------------------------------------------------------------------
## 7. Support session (the chosen option "B")
Purpose: the super admin can help a hospital by seeing what the hospital admin sees, safely and traceably. Without an active support session the super admin sees no hospital data.

### 7.1 Rules
- **Reason is mandatory** (min 20 characters) and stored.
- **Recent MFA** required (AAL2, authenticated within the last 15 minutes).
- **Two modes:**
  - `view` (default): read-only. All write permissions are removed from the session's effective permissions.
  - `act`: can perform actions. Requires **approval by that hospital's admin** (in-app approve button; for a hospital with no one reachable, owner-defined fallback is not allowed: no approval, no `act`).
- **Duration:** default 60 minutes, maximum 4 hours, then it expires automatically. Extending = a new session with a new reason.
- **Scope:** the session carries the hospital admin's view of the **enabled modules**. It never exceeds a hospital admin's permissions. Clinical-authoring permissions are excluded in both modes.
- **Masking:** national ID and phone are masked by default in a session; "reveal" is allowed and logged.
- **Visibility to the hospital:** the hospital admin sees a banner "Platform support session active until HH:MM" and the full session history (who, when, reason, mode, what was opened/changed) in their audit log. Hospital users cannot hide or delete it.
- Every read of patient-level data and every write inside a session is logged with `support_session_id`.
- The super admin can end the session at any time. The hospital admin can also **terminate** it immediately.

### 7.2 Data model
`support_sessions(id, hospital_id, super_admin_id, mode, reason, status: requested|approved|active|denied|ended|expired, requested_at, approved_by NULL, approved_at NULL, starts_at, expires_at, ended_at, ended_by)`.

### 7.3 Enforcement
- The Supabase **access-token hook** adds `acting_hospital_id` and `support_session_id` to a super admin's token only when an `active` session exists and is unexpired; token lifetime is 5 minutes during a session so expiry takes effect quickly.
- `private.current_hospital_id()` returns the user's own hospital, or for a super admin the `acting_hospital_id` **only if** the session row is still `active` and unexpired (checked in the function against `support_sessions`).
- `private.effective_permissions()` for a session = hospital admin permissions of enabled modules, minus clinical-authoring, minus write permissions if mode is `view`.
- All of this is covered by pgTAP tests: no session = zero rows; expired session = zero rows; view mode cannot write; other hospital = zero rows.
- On-premise installs: support sessions work only when the owner can reach the server (VPN). The same code and rules apply.

---------------------------------------------------------------------
## 8. Hospital admin dashboard and navigation
### 8.1 Hospital admin account
- Has **every tab of every enabled module**, plus Users, Roles, Audit log, Settings, and its **own Dashboard**.
- Its permission set is **computed, not stored**: all permissions of the hospital's enabled modules, except `clinical_authoring` ones (writing clinical notes, prescribing, verifying lab results, signing radiology reports, administering medication). Those belong to licensed clinical roles. Reason: patient safety and legal accountability. (Owner may override; see section 20.)
- Enabling a module for the hospital immediately gives the hospital admin that module's tabs. Disabling removes them.
- Separation of duties still applies to this account (cannot approve its own purchase order or void, cannot give itself a permission it lacks).
- MFA required. All actions audited.

### 8.2 Sidebar (generated, never hand-written)
Built from the module registry (`src/modules/registry.ts`) filtered by **enabled modules ∩ the user's permissions**:
```
Dashboard                      (always; first item)
Reception                      (core)  Patients · Appointments · Queue
<Enabled module A>             its tabs the user may see
<Enabled module B>             ...
Administration                 Users · Roles · Audit log · Settings   (hospital admin only, by permission)
```
A group with zero visible tabs is hidden. A direct URL to a hidden/disabled tab returns 404 (disabled module) or 403 (no permission), never the page.

### 8.3 Dashboard
- First sidebar item for everyone. **Content depends on role**: a widget appears only if the module is enabled **and** the user has `<module>:dashboard:read`.
- **Hospital admin dashboard** shows a summary of every enabled module (counts and totals only):
| Module | Example widgets |
|---|---|
| Reception | Patients registered today / this month / total; appointments today; queue length |
| `opd` | Visits today; average wait; top diagnoses |
| `lab` | Pending/in-progress/completed orders; average turnaround |
| `radiology` | Pending/reported studies |
| `pharmacy` | Prescriptions pending; sales today; low-stock count; expiring-soon count; stock value |
| `inventory` | Low-stock items; open purchase orders; recent receipts |
| `finance` | Revenue today/month; outstanding invoices; expenses; cash collected today |
| `hr` | Staff count; on leave today; attendance rate |
| `inpatient` | Bed occupancy; admissions/discharges today |
- **A department user** (e.g. Finance Manager) sees only the widgets of their modules ("nothing less, nothing more").
- Widgets read **summary tables** (`dashboard_summaries(hospital_id, module_key, metric_key, period, value jsonb, computed_at)`) refreshed by `pg_cron` every 5 minutes (and on demand after key events). Never aggregate raw tables on page load. Show "Updated HH:MM". Date range: Today / 7 days / 30 days.
- Each module registers its widgets in `module.config.ts`; the dashboard renders them generically.
- Money shown with the hospital's currency via `Intl`. Never hardcode a currency.

---------------------------------------------------------------------
## 9. Roles and users inside a hospital
### 9.1 Model (replaces "global fixed roles")
- Roles are **per hospital**, created by the hospital admin: `roles(id, hospital_id, name, description, is_system, created_by)` and `role_permissions(role_id, permission_key)`.
- The only system role is `hospital_admin` (computed permissions, not editable, not deletable).
- **A role can only contain permissions from modules enabled for that hospital** (and core permissions the admin holds). The role editor shows a permission tree grouped by module and hides disabled modules. The server and a database constraint both reject others.
- The number of roles is not limited. Typically one per department ("Finance Manager" with only finance permissions), but a role may span enabled modules.
- A hospital admin cannot grant a permission they do not hold, cannot grant platform permissions, and cannot edit `hospital_admin`.
- **Role templates** (global, read-only, seeded) speed up creation: one click creates a role from a template, limited to enabled modules, then the admin may adjust. Templates: Receptionist, Doctor, Nurse, Lab Technician, Radiology Technician, Pharmacist, Cashier, Finance Manager, Accountant, Store Keeper (Inventory), HR Manager, Auditor (read-only).
- Re-enabling a disabled module restores the role permissions that were set before; while disabled they are inert.
- **One role per user in v1** (simple, predictable). Multi-role is a future ADR.

### 9.2 Creating a user
The hospital admin can create **unlimited users in every role and department** of the hospital. Fields: full name, username (unique per hospital), role, department, job title, phone, license number and expiry (clinical roles), specialization, temporary password (shown once), active flag. Full field list and the profile page are in `MODULE_SPECS.md` §2. User must change password at first login. Admin can reset password, deactivate, change role. Every action audited. No emails sent.

### 9.3 Effective permissions
`effective = role.permissions ∩ permissions of enabled modules` (and for hospital admin: all enabled-module permissions minus clinical-authoring). Computed by the access-token hook into JWT claims `permissions[]` and `modules[]`. Checked in four places (section 12).

---------------------------------------------------------------------
### 9.4 Names in the activity log
Every audit event stores a **snapshot** of the actor's full name, username, and role name at the time of the action, and a human-readable record label, so the activity log always shows who did what by full name even after renames, role changes, or deactivation. Users are never deleted, only deactivated. Details: `MODULE_SPECS.md` §2.2 and `DATABASE.md` §7.

---------------------------------------------------------------------
## 10. Permissions
- Format `<module>:<resource>:<action>`. Core uses module key `core` or `reception`. Examples: `reception:patient:read`, `opd:note:create`, `lab:result:verify`, `pharmacy:dispense:create`, `finance:invoice:void`, `finance:invoice:approve_discount`, `inventory:po:approve`, `hr:leave:approve`, `inpatient:bed:assign`, `finance:dashboard:read`.
- Table `permissions(key PK, module_key, resource, action, label, clinical_authoring bool default false, sod_group NULL)`. Seeded by migration from the `module.config.ts` files. A CI test fails if the DB and the config files differ.
- Standard actions: `read`, `create`, `update`, `archive`, `export`, `print`, `approve`, `void`, `adjust`, `verify`, `dashboard:read`.
- Adding a permission: follow `RBAC.md` section 5, plus add it to the module's `module.config.ts`.
- `RBAC.md` examples like `patients:read` mean `reception:patient:read` now.

---------------------------------------------------------------------
## 11. Code structure
```
src/
  core/                      # patients, orders, charges, stock-engine, dashboard framework, audit
  modules/
    registry.ts              # imports every module.config.ts, exports typed registry
  features/
    reception/ opd/ lab/ radiology/ pharmacy/ inventory/ finance/ hr/ inpatient/
      module.config.ts       # the module's single declaration
      components/ actions.ts service.ts repo.ts schemas.ts permissions.ts index.ts *.test.ts
  app/
    (platform)/hospitals/... # super admin only
    (app)/<module-route>/... # one route group per module
supabase/migrations/         # tables, RLS, functions, seed of modules + permissions + templates
```
`module.config.ts` shape:
```ts
export default defineModule({
  key: 'lab',
  name: 'Laboratory',
  requires: [],                     // hard needs (module keys); core is implicit
  softRequires: ['opd', 'finance'],
  nav: [{ label: 'Worklist', href: '/lab/worklist', permission: 'lab:order:read' }, /* ... */],
  permissions: [{ key: 'lab:result:verify', label: 'Verify results', clinicalAuthoring: true }, /* ... */],
  dashboardWidgets: [{ key: 'lab.pending', permission: 'lab:dashboard:read', component: 'PendingOrders' }],
});
```
Rules: nav, permissions, and widgets are only declared here. The sidebar, role editor, dashboard, and seed generator all read the registry.

---------------------------------------------------------------------
## 12. Enforcement (all four layers, all required)
1. **Database (RLS).** Every module table: `hospital_id = (select private.current_hospital_id())` **and** `private.module_enabled('<key>')` **and** `private.has_permission('<perm>')`. `module_enabled` reads the `modules[]` claim.
2. **Server.** Every Server Action / Route Handler: `requireModule('lab')` then `requirePermission('lab:result:verify')`, then Zod, then service.
3. **Routing.** `proxy.ts` and the route group layout check module enabled; disabled module routes return 404.
4. **UI.** Sidebar and buttons hidden by registry + permissions (cosmetic only).
Propagation: module or role changes take effect at the user's next token refresh (access token life 15 minutes). After a module change the platform also revokes the hospital's refresh tokens to force refresh at once, and sets `hospitals.auth_version = auth_version + 1`; the token hook embeds it and the server rejects tokens with an older version.
Disabled module data stays in the database and stays under RLS. No module-off action deletes anything.

---------------------------------------------------------------------
## 13. Database objects (new or changed; follow `DATABASE.md` conventions)
- `modules(key PK, name, description, requires text[], soft_requires text[], sort int, is_deferred bool)`: seeded, global.
- `hospital_modules(hospital_id, module_key, enabled bool, enabled_at, enabled_by, disabled_at, disabled_by, PRIMARY KEY (hospital_id, module_key))`. Change log in `platform.audit_events`.
- `permissions` as in section 10, `role_templates(id, name, module_scope text[])`, `role_template_permissions`.
- `roles`, `role_permissions` now **per hospital** (`hospital_id NOT NULL`, except templates).
- `profiles(user_id, hospital_id NULL for super_admin, username, full_name, role_id NULL, is_active, must_change_password)`.
- `support_sessions` as in 7.2.
- `orders`, `charges`, `stock_*`, `dashboard_summaries` as defined in sections 2 and 8.
- `platform.audit_events` (super admin actions) separate from `audit.events` (hospital actions). Hospital admin sees only `audit.events` for their hospital plus support-session entries about their hospital.
- Helper functions in `private`: `current_hospital_id()`, `module_enabled(text)`, `has_permission(text)`, `effective_permissions()`.
- CI check: every `public` table has `hospital_id` and RLS, except the allowlist (`hospitals`, `modules`, `permissions`, `role_templates*`).

---------------------------------------------------------------------
## 14. Lifecycle of a hospital
`active` (normal) · `suspended` (no logins; data kept; reversible) · `archived` (read-only for the super admin through a support session; no user logins). No hard delete from the UI. Permanent deletion is an owner-run operations procedure with a recorded legal basis.
Status change blocks token issuance via the token hook and revokes sessions.

## 15. On-premise and offline installs (`DEPLOYMENT_MODE=onprem`)
One hospital per install. The installer script creates the hospital, the hospital admin, and the module set chosen at sale time, using the same `platform.create_hospital`. The `(platform)` area is available only to the vendor's local super admin account (used for module changes and support sessions over VPN). The cloud backup copy carries the hospital's module settings. Module switches are therefore also the licensing mechanism: modules sold = switches on.

---------------------------------------------------------------------
## 16. Security requirements specific to this file
- Super admin: two accounts maximum recommended, MFA required, all actions in the platform audit log, no data access without a support session.
- Support sessions: section 7. A test must prove no data without a session.
- Module/role editors: server-side validation that selected permissions belong to enabled modules and to the actor's own set.
- Passwords: shown once, never logged, forced change on first login.
- `hospital_id` always from session, never client input. `module key` from route config, never client input.

## 17. Tests required
1. Module dependency validation: all presets valid; every invalid combination rejected; disabling a hard-needed module blocked.
2. Module combination tests (smoke) for each **sold** preset: sidebar items, dashboard widgets, degradation rules from 4.1.
3. Permission seeding parity: DB `permissions` equals the union of all `module.config.ts`.
4. Role editor: cannot add permission from a disabled module; cannot exceed own permissions; re-enable restores.
5. Hospital admin: sees all enabled-module tabs, none of the disabled; clinical-authoring excluded; SoD enforced.
6. Dashboard: widgets match modules and permissions; no raw-table aggregation (query plan check on large seed).
7. Tenant isolation (existing) plus: super admin without session gets zero rows; expired session zero rows; view mode cannot write; other hospital zero rows.
8. Hospital creation: success path; rollback on each failing step; duplicate code rejected.
9. Direct URL to a disabled module returns 404; to a forbidden tab returns 403.
10. Token refresh after module change: access lost/gained within the defined window.

## 18. Build order (for the AI/developer)
1. Core tables: `hospitals`, `modules`, `hospital_modules`, `permissions`, `roles`, `profiles`, helper functions, token hook, RLS patterns, tenant-isolation test.
2. Module registry, `defineModule`, sidebar generator, `requireModule`/`requirePermission`, route-group guards, ESLint import rule.
3. Super admin console: hospitals list, create wizard, manage hospital (overview, modules, users, status), platform audit log.
4. Hospital admin: users, roles (editor + templates), audit log, settings, computed admin permissions.
5. Dashboard framework + summary tables + widgets for modules as each module lands.
6. Support sessions (request, approve, hook, banner, history).
7. Modules in order: Reception (core) → `opd` → `pharmacy` + stock engine → `finance` + charges ledger → `lab` → `inventory` → `radiology` → `inpatient` → `hr`.
Each step ends with its tests green and a PR to `develop`.

---------------------------------------------------------------------
## 19. Conflicts with earlier docs (already patched; do not reintroduce)
| Earlier statement | Now |
|---|---|
| "Every hospital gets every module"; no per-tenant toggles (MULTI_TENANCY §1, §12; ARCHITECTURE §10) | Super admin selects modules per hospital, editable any time |
| Roles are global, fixed system roles; custom roles deferred (MULTI_TENANCY §3; RBAC) | Roles are per hospital, created by the hospital admin from enabled modules; the 12 listed roles are **templates** |
| Super admin cannot read any hospital data; support access not built (MULTI_TENANCY §4; SECURITY §3.1) | Super admin sees only counts, except inside an audited support session (option B) |
| Permission keys like `patients:read` | `<module>:<resource>:<action>` |
| Hospital admin cannot touch clinical data | Hospital admin has all enabled-module tabs; only clinical-authoring permissions are excluded |
| Billing and Finance as separate modules; Services placeholder | One `finance` module; service price list inside it |

## 20. Open decisions for the owner (defaults in brackets; AI must not change them without approval)
1. Should hospital admin be allowed clinical authoring? [No: excluded]
2. Support session limits [reason ≥ 20 chars, default 60 min, max 4 h, `act` needs hospital approval, MFA within 15 min]
3. One role per user in v1? [Yes]
4. Preset list and which module combinations are sold [section 5]
5. Whether the hospital's user-interface language needs more than English or RTL [open]
6. Retention periods by country [open]
