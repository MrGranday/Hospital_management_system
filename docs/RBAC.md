# RBAC.md — Roles and permissions

> **Update:** roles are created per hospital by the hospital admin and limited to the hospital's enabled modules. The 12 roles in section 3 are **role templates**, not fixed roles. Permission keys are `<module>:<resource>:<action>` (e.g. `patients:read` is now `reception:patient:read`). The super admin enters a hospital only through a support session. See `PLATFORM_MODULES.md` §7, §9, §10, which win over this file.

## 1. How real hospitals do it
There is no standard number. Small clinics run with 5–8 roles; mid-size hospitals 12–20; large ones 30+ with department variants.
The common backbone is the same: administration, clinical (doctor, nurse), front office (reception), diagnostics (lab, radiology), pharmacy, finance/billing, stores/inventory, HR, and oversight (auditor).
The prototype's 13 roles are a reasonable size. We keep roles **few and data-driven**, and put the detail in permissions, so a custom role can be added later later without code changes.

## 2. Model
- **Permission**: atomic string `module:action`, e.g. `patients:read`, `billing:void`, `stock:adjust`, `audit:read`.
- **Role**: named bundle of permissions, stored in `roles` / `role_permissions`.
- **Assignment**: `user_roles(user_id, role_id)`. A user belongs to exactly one hospital (`profiles.hospital_id`); only `super_admin` belongs to none.
- **Scope**: hospital (always, enforced by RLS), department (optional restriction for clinicians), own-records-only (e.g. a doctor's own schedule).
- Effective permissions are computed into the JWT by the access-token hook. Checked by RLS (`private.has_permission`) and `requirePermission('x:y')` on the server.
- Standard actions: `read`, `create`, `update`, `archive`, `export`, `print`, `approve`, `void`, `adjust`, `manage`.

## 3. Initial roles (11 + 1 reserved)
| Role | Purpose | Can | Cannot |
|---|---|---|---|
| `super_admin` | Platform owner (1–2 people). Belongs to no hospital | Create, suspend, reactivate hospitals; create first hospital admin; reset hospital-admin passwords; platform audit log | Read any hospital's patient, billing, HR or stock data. MFA required |
| `hospital_admin` | Director / operations manager | Dashboards, reports, approvals, user accounts and password resets for own hospital, staff and department management, settings | Edit clinical records, post payments |
| `doctor` | Physicians, dentists | Patients (read/update in care), visits, notes, prescriptions, lab/imaging orders, results read, own schedule | Billing void, stock, HR, user admin |
| `nurse` | Nurses, midwives | Vitals, nursing tasks, medication administration, bed board, patient read, notes (nursing) | Prescribe, billing, stock adjust |
| `receptionist` | Front desk | Register/search/edit demographics, appointments, queue, create invoice drafts | Clinical notes, results, void, discounts |
| `cashier` | Billing clerk | Create invoices from orders, take payments, print receipts, daily close | Edit price list, void without approval, clinical data beyond what an invoice needs |
| `pharmacist` | Pharmacy | Read prescriptions, dispense, POS sale, pharmacy stock, batch/expiry, returns | Edit diagnoses, post payments outside POS, HR |
| `lab_technician` | Laboratory | Lab worklist, sample status, enter results, verify (if senior flag), print reports | Prescriptions, billing, full chart |
| `radiology_technician` | Imaging (Phase 2) | Imaging worklist, upload report, status | Everything else |
| `inventory_manager` | Stores / procurement | Items, batches, receipts, POs (create), adjustments (request), supplier records | Approve own PO, clinical data, payments |
| `accountant` | Finance | Invoices read, payments read, expenses, supplier payables, financial reports, PO approval (finance) | Clinical data, stock edits |
| `hr_manager` | HR | Staff records, shifts, attendance, leave approvals | Clinical data, finance, user permissions |
| `auditor` (read-only) | Compliance/internal audit | Audit log, reports, read-only across modules per policy | Any write |

Notes:
- Consolidation vs prototype: `lab_staff`→`lab_technician`, `inventory_staff`→`inventory_manager`, the prototype's divergent role lists (`dentist`, `pharmacy_manager`, etc.) become permission variants of `doctor`/`pharmacist`. **One role list, one source of truth (database).**
- Sub-flags rather than new roles: `can_verify_results` (senior lab tech), `can_approve_discount`, `department_ids`.
- Charge nurse, ward in-charge, consultant vs resident are permission bundles added later if needed. Do not create a role per job title.

## 4. Permission matrix (module level, V = view, C = create, U = update, A = approve, X = export/print, ✓ = full in-scope)
| Module | super_admin | hospital_admin | doctor | nurse | reception | cashier | pharmacist | lab | inventory | accountant | hr | auditor |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Users (own hospital) | – (platform only: hospitals and hospital admins) | ✓ | – | – | – | – | – | – | – | – | – | V |
| Patients (demographics) | – | V | V,U | V | V,C,U | V | V | V | – | – | – | V |
| Clinical notes / EMR | – | – | ✓ | V,C (nursing) | – | – | V (Rx only) | – | – | – | – | V (logged) |
| Appointments | – | V | V (own) | V | ✓ | V | – | – | – | – | – | V |
| Visits / OPD | – | V | ✓ | V,U vitals | C queue | – | – | – | – | – | – | V |
| Prescriptions | – | – | C,U | V | – | – | V + dispense | – | – | – | – | V |
| Lab | – | V | C orders, V results | V | – | – | – | ✓ | – | – | – | V |
| Billing | – | V,A | – | – | C draft | C,U pay, X | POS only | – | – | V,A,X | – | V |
| Inventory / Stock | – | V | – | request | – | – | V,U pharmacy | – | ✓ | V | – | V |
| Purchases | – | V,A | – | – | – | – | – | – | C | A | – | V |
| Finance | – | V | – | – | – | – | – | – | – | ✓ | – | V |
| HR | – | V | – | – | – | – | – | – | – | – | ✓ | V |
| Reports | ✓ | ✓ | own | – | – | own | own | own | own | ✓ | HR only | ✓ |
| Audit log | V | V (limited) | – | – | – | – | – | – | – | – | – | ✓ |
| Settings | ✓ | V,U (non-security) | – | – | – | – | – | – | – | – | – | V |

The matrix is documentation. The source of truth is `role_permissions`. A test asserts the seeded permissions match this table.

## 5. Rules for adding or changing a permission
1. Add the string to `permissions` via a migration. Never invent a permission only in TypeScript.
2. Add it to the relevant roles via the same migration.
3. Add `requirePermission()` to the action, an RLS policy to the table, and a test for allow and deny.
4. Update this file.
5. Privilege-escalating changes (new admin power, new export, new approve) need owner approval in the PR.

## 6. Anti-patterns
- Checking `user.role === 'doctor'` in code. Check permissions only.
- Hiding a button as the only protection.
- A shared "admin" login. One person, one account, always.
- Giving admins clinical access "just in case". Use break-glass.
