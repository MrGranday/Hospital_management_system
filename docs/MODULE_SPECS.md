# MODULE_SPECS.md — What every module does

**Authority:** this file defines the functionality of core and every module (screens, workflows, statuses, rules, reports, dashboard widgets, permissions).
Module switching, dependencies, roles, and support sessions are in `PLATFORM_MODULES.md`. Isolation is in `MULTI_TENANCY.md`. Security in `SECURITY.md`.
If this file lists a feature, it is in scope for its tag. If a feature is not here, it is out of scope: ask the owner first.

## 0. How to read and build this file
- **[P1]** = build in the module's first release. **[P2]** = build later, after the module's P1 is done and tested. Do not build P2 early.
- **(new)** = added in this revision to cover a normal hospital need that was missing. Kept deliberately simple.
- Every module exposes: sidebar tabs, permissions `<module>:<resource>:<action>`, dashboard widgets, audit events. All declared in `module.config.ts`.
- Common rules for **every** module:
  - Lists: server-side pagination, search, filters, CSV export (permission + audit), print where stated.
  - Status machines are explicit; invalid transitions are rejected in the service and by a DB check.
  - Soft delete/archive only. Finalized records are corrected by a new record (amendment, credit note, reversing movement), never edited in place.
  - Every create/update/void/approve/print/export writes an audit event with the actor's full name (section 2).
  - Every patient-facing screen shows the **patient banner**: full name, age/sex, MRN, allergies, alerts.
  - Money: integer minor units + hospital currency. Dates: UTC stored, hospital timezone shown. Numbers (MRN, invoice, PO, token) from per-hospital counters.
  - Late/downtime entries carry `occurred_at` (when it happened), `entered_at`, `entry_source` (`live` | `downtime_import`).

## 1. Explicitly NOT in the product (do not build, do not suggest)
Email/SMS/chat/notifications to people · telemedicine · patient portal · PACS/DICOM viewer · AI features · insurance and claims · payroll · blood bank · operation-theatre scheduling · ambulance fleet · diet/laundry/housekeeping · asset register · multi-currency accounting · biometric devices.
(Insurance, payroll, blood bank, OT are deferred modules: build only when the owner asks.)

---------------------------------------------------------------------
## 2. Users, staff profiles, and the activity log (core)
### 2.1 Hospital admin creates users
- The hospital admin can create **as many users as needed in every role and department** the hospital has enabled (many doctors, many cashiers, many pharmacists, many HR users...). No per-role user limit in the product.
- Create-user form [P1]: **full name** (required), username (unique in hospital), role (required), department (optional), job title, staff ID (optional), phone, **professional license number + license expiry** (required for clinical roles: doctor, nurse, pharmacist, lab, radiology), specialization (doctors), gender, photo (optional), temporary password (generated, shown once), active flag.
- First login forces password change; MFA enrollment prompt for privileged roles (`SECURITY.md`).
- Admin can: edit profile, change role, reset password, deactivate/reactivate, view a user's activity. **Users are never deleted.** Deactivation blocks login and keeps history intact.
- **My profile** page for every user [P1]: see own details, change own password, manage MFA, view own recent activity ("My activity").
- If the HR module is on, each profile links to an HR staff record (HR adds employment details). If HR is off, the profile above is the staff record.

### 2.2 Activity log (hospital audit log) [P1]
- Every row shows: **date/time, actor full name, actor username, actor role name, action, module, record label** (e.g. "Prescription RX-000123 for Ahmad K. (MRN 000451)"), result, and for changes a before/after diff view for authorized users.
- **Names are snapshotted at event time** (`actor_name`, `actor_username`, `actor_role_name`) so later renames, role changes, or deactivation never alter history.
- Filters: user (by name), role, module, action type, patient/record, date range, support-session events. Search by name or record label. Export CSV (permission `core:audit:export`, itself audited).
- Visible to: hospital admin (all), auditor role (all, read-only), any user (own activity only). Append-only: no edit, no delete, no clear.
- Logged actions include: login/logout/failed login, password reset, role/permission change, user create/deactivate, every create/update/void/approve/dispense/verify/print/export, patient chart opens (reads), support sessions, module changes.

### 2.3 Roles
Defined in `PLATFORM_MODULES.md` §9 (per-hospital roles created by the hospital admin from enabled modules, with templates).

---------------------------------------------------------------------
## 3. Reception (core, always on)
**Sidebar tabs:** Patients · Register patient · Appointments · Queue · Today's visits

**Patient registration [P1]**
- Fields: full name, father/guardian name, gender, date of birth (or estimated age), phone, address (province/district/village), national ID (optional, masked), blood group (optional), emergency contact name+phone, photo (optional), registration source (walk-in/appointment/referral/emergency).
- **Allergies and alerts** are part of the core patient record (name, severity, reaction, entered by). Reception, doctor, nurse may add; changes audited. Shown in the patient banner everywhere. (new)
- **Duplicate check** on name + DOB + phone before saving; user must confirm "different person" or open the existing record. [P1]
- MRN generated by the system (per-hospital counter and format from Settings). [P1]
- **Patient card/registration slip print** with QR/barcode of MRN. (new) [P1]
- Registration fee / consultation fee added to the **charges ledger** automatically from Settings. [P1]
- Edit demographics (audited), archive (not delete), **merge duplicates** (keeps both histories under one patient, reversible only by owner procedure). [P1 edit/archive, P2 merge]
- Patient documents (ID copy, referral letter, outside reports): private upload, type/size limits. [P2]
- Patient timeline: visits and key events the viewer is permitted to see. [P1]

**Visits and queue [P1]**
- **Check-in creates a visit** (`visits` is a core table: type `opd|emergency|ipd|walk_in`, status, department/doctor, token). Clinical content is added by the `opd` module when present; without it a visit is only an attendance/charge record.
- **Token/queue**: token number per day per department or doctor; statuses `waiting → called → in_service → completed | no_show | cancelled`; "call next"; priority flag (emergency, elderly, disabled) moves patient up with a reason; **queue display screen** (`/queue-display`, token numbers only, no patient names). (new)
- "Send to": after reception the patient is routed to the selected doctor/department queue.

**Appointments [P1]**
- Doctor/department schedules (working days, hours, slot length, leave blocks). Book, reschedule, cancel, mark arrived, no-show. Conflict prevention (double booking). Walk-in converts to a visit. Day/week view, printable daily list.
- Doctor directory (name, specialization, schedule, consultation fee) for booking. (new)

**Reports [P1]:** registrations per day/month, by gender and age group, appointments vs attended vs no-show, average waiting time.
**Dashboard widgets:** patients registered (today/month/total), appointments today, queue length, average wait.
**Permissions (examples):** `reception:patient:read|create|update|archive|merge|export|print`, `reception:allergy:create|update`, `reception:appointment:read|create|update|cancel`, `reception:queue:read|manage`, `reception:visit:create`, `reception:dashboard:read`.

---------------------------------------------------------------------
## 4. Doctors and OPD (`opd`)
**Sidebar tabs:** My queue · Consultation · Visits · Patient history · Prescriptions · Orders · Templates · Certificates and referrals
**Hard needs:** core. **Soft:** lab, radiology, pharmacy, finance.

**Workflow [P1]**
```
Reception checks in patient (name already registered, or new walk-in) → token in doctor's queue
→ (nurse/doctor records vitals) → doctor opens patient from "My queue" or searches any registered patient
→ consultation (complaint, history, exam, diagnosis, plan) → orders (lab/radiology if on) → digital prescription
→ follow-up date → complete visit → consultation fee on charges ledger → patient goes to lab/pharmacy/billing
```
- **Patient selection:** doctors pick patients **from the reception data**, never retyping. Sources: (1) My queue (checked-in today), (2) search by name/MRN/phone/token (any registered patient the doctor is permitted to read; every chart open is audited). [P1]
- **Vitals** [P1]: BP, pulse, temperature, respiratory rate, SpO2, weight, height, BMI (auto), pain score. Abnormal values flagged (text + color). Recorded by nurse or doctor; trend table across visits.
- **Consultation note** [P1]: chief complaint, history of present illness, examination, diagnosis list (searchable list + free text; ICD-10 code optional), plan, follow-up. Note templates per specialty with quick text. [P2 templates]
- **Problem list and chronic conditions** per patient (diabetes, hypertension...), with onset and status. [P1]
- **Allergy awareness:** banner always visible; prescribing checks allergies (below). [P1]
- **Notes lock:** a completed visit is locked. Corrections are **addenda** (new signed entry with reason). [P1]
- **Patient history** tab: previous visits, diagnoses, prescriptions, lab and radiology results (if modules on), vitals trend. [P1]
- **Medical certificate / sick-leave note**, **referral letter** (to another facility or specialty): generated, printable with hospital header and doctor's name, license, signature line. (new) [P1 print]
- **Follow-up:** set follow-up date, which creates a pending appointment suggestion in Reception. (new) [P1]
- **Doctor's own list:** today's patients seen/waiting, searchable history of "my patients". [P1]

**Digital prescription [P1]** (core of this module)
- Create from inside a visit (or standalone for a registered patient, e.g. repeat). Patient and visit are prefilled from reception data.
- Each line: medicine (picked from the hospital's **medicine catalog** if `pharmacy` is on; otherwise free text with a simple local list), strength/form, dose, route, frequency, duration, quantity (auto-calculated, editable), instructions (e.g. "after meals"), controlled-drug flag.
- **Checks:** drug–allergy match against patient allergies (hard warning that must be acknowledged with a reason), duplicate medicine in the same prescription, quantity/duration out of normal range (soft warning). Full interaction database is not included; a small manual "do not combine" list per hospital is P2.
- **Favorites and templates** (e.g. common antibiotic course), **repeat last prescription**. [P2]
- **Statuses:** `draft → issued → partially_dispensed → dispensed` or `cancelled`. An issued prescription is **never edited**: changes create a new version linked to the old one (old one marked superseded). Cancelling needs a reason.
- **Sign/issue:** records doctor full name, license number, timestamp; prints with hospital header, patient data, QR code carrying the prescription number.
- **Flow to pharmacy:** if `pharmacy` is on, issued prescriptions appear in the pharmacy queue automatically. If pharmacy is off, only print is available.
- **Walk-in/outside:** the patient can take the printed prescription anywhere.

**Orders [P1]:** order lab tests and radiology exams from a visit (catalog picker, urgency, clinical note). Results return to the visit. Hidden if those modules are off.
**Reports [P1]:** visits per doctor/day, top diagnoses, prescriptions per doctor, average consultation time. **Widgets:** visits today, waiting now, top diagnoses.
**Permissions:** `opd:visit:read|update|complete`, `opd:vitals:create|update`, `opd:note:create|addendum`, `opd:diagnosis:create`, `opd:prescription:create|issue|cancel|print`, `opd:order:create`, `opd:certificate:create|print`, `opd:dashboard:read`. Clinical-authoring flagged: `opd:note:*`, `opd:prescription:*`.

---------------------------------------------------------------------
## 5. Laboratory (`lab`)
**Tabs:** Worklist · Walk-in order · Sample collection · Results · Verification · Reports · Test catalog

- **Test catalog [P1]:** test name, code, category, sample type, unit, **reference ranges by sex/age**, critical limits, price, turnaround time, active flag. **Panels** (e.g. CBC, LFT) group tests. Result types: numeric, text, choice (positive/negative), multi-line.
- **Orders [P1]:** from a doctor's visit, or **walk-in** created by the technician from a paper request (patient picked from reception data, or quick-register through Reception). Charges go to the ledger per test.
- **Status machine [P1]:** `ordered → sample_collected → in_progress → resulted → verified → released`; `rejected_sample` (reason, recollect) and `cancelled` (reason).
- **Sample collection [P1]:** collection time, collector, sample ID **label with barcode/QR** (print). (new)
- **Result entry [P1]:** values with units; automatic **H/L/Critical flags** from the reference range. **Critical results** raise a prominent alert on the ordering doctor's dashboard and need an acknowledgement. 
- **Verification [P1]:** a second person (or senior flag `can_verify`) verifies before release; entering and verifying by the same person is blocked unless the hospital allows it in Settings (small hospitals).
- **Amendments [P1]:** released results are never edited; a corrected version is created with reason and both versions kept.
- **Report print/PDF [P1]:** hospital header, patient banner, results with ranges and flags, verifier name and license, print time.
- **Result history and trend** for numeric tests per patient. [P2]
- **External/referred tests** (sent to another lab): mark as sent-out, enter result as attached PDF. (new) [P2]
- **Reports [P1]:** test volume, turnaround time, pending/overdue, revenue by test. **Widgets:** pending, in progress, critical alerts, average turnaround.
- **Permissions:** `lab:order:read|create|cancel`, `lab:sample:collect|reject`, `lab:result:create|amend|verify`, `lab:report:print`, `lab:catalog:read|manage`, `lab:dashboard:read`. Clinical-authoring flagged: `lab:result:verify`.

---------------------------------------------------------------------
## 6. Radiology (`radiology`)
**Tabs:** Worklist · Walk-in order · Reports · Exam catalog
- **Exam catalog [P1]:** modality (X-ray, ultrasound, CT, MRI, other), exam name, preparation notes, price, active.
- **Orders [P1]:** from doctor (visit) or walk-in. Fields: clinical indication, urgency, pregnancy/contrast flags (checkbox + note).
- **Status machine [P1]:** `ordered → scheduled → in_progress → performed → reported → verified`; `cancelled` (reason).
- **Report [P1]:** findings and impression text with **normal-report templates** (quick fill), radiologist name and license, sign-off; attach images or a PDF/scan (private storage, signed URLs). No image viewer.
- **Print report [P1]** with hospital header.
- **Reports [P1]:** exams by modality, turnaround time, pending. **Widgets:** pending, reported today.
- **Permissions:** `radiology:order:read|create|cancel`, `radiology:exam:perform`, `radiology:report:create|sign|print`, `radiology:attachment:upload`, `radiology:catalog:manage`, `radiology:dashboard:read`. Clinical-authoring: `radiology:report:sign`. A general doctor may hold `radiology:report:sign` if the hospital has no radiologist.

---------------------------------------------------------------------
## 7. Pharmacy (`pharmacy`)
**Tabs:** Prescriptions · Dispense · Sales (POS) · Stock and batches · Medicine catalog · Returns · Receive stock · Expiry and low stock · Stock count

- **Medicine catalog [P1]:** generic name, brand, strength, dosage form, unit/pack size, selling price, reorder level, controlled flag, storage notes, active. This is also the picker used by doctors' prescriptions.
- **Prescription queue [P1]:** issued prescriptions with patient banner, doctor, time, status. Open one to **dispense**.
- **Dispense [P1]:** line by line, **full or partial**; batch suggested by **first-expiry-first-out**; expired batches blocked; allergy and duplicate warning repeated; **generic substitution** with a note; quantity checked against stock (negative stock blocked unless a permission override with reason). Prints a **dispensing label/slip** (patient, medicine, dose, instructions) and receipt. Charges to ledger.
- **POS / over-the-counter sale [P1]:** sell without a prescription (patient optional), cart, discount (permission and limit), payment recorded (cash etc.), receipt print.
- **Walk-in prescription entry [P1]:** enter an outside/paper prescription (needed when `opd` is off or the patient comes from elsewhere).
- **Stock and batches [P1]:** per batch: quantity, expiry, cost, supplier (text or link), location. Stock comes from the core stock engine.
- **Receive stock [P1]:** manual stock-in (batch, expiry, quantity, cost, supplier name). When `inventory` is on it also accepts goods from purchase orders.
- **Returns [P1]:** customer return (with reason; back to stock only if the user marks it resaleable; approval) and return to supplier (via Inventory if on, otherwise manual record).
- **Adjustments and stock count [P1 adjust, P2 count]:** damage/expired write-off/found stock with reason code and approval above threshold. Stock count sheet per location with variance report. (new)
- **Expiry and low stock [P1]:** lists for 30/60/90 days, below reorder level; dashboard alerts only (no messages).
- **Controlled drugs register [P2]:** every controlled dispense logged with prescriber, patient, quantity, running balance. (new)
- **Reports [P1]:** sales by day/user/item, top medicines, stock valuation (weighted average cost), expiring, dispensed vs prescribed, returns, daily pharmacy cash summary (if Finance is off).
- **Widgets:** prescriptions waiting, sales today, low-stock count, expiring-soon count, stock value.
- **Permissions:** `pharmacy:prescription:read`, `pharmacy:dispense:create|override_stock`, `pharmacy:sale:create|discount`, `pharmacy:stock:read|adjust|count`, `pharmacy:catalog:read|manage`, `pharmacy:return:create|approve`, `pharmacy:dashboard:read`.

---------------------------------------------------------------------
## 8. Inventory and purchasing (`inventory`)
**Tabs:** Items · Stock in/out · Requisitions · Adjustments and count · Suppliers · Purchase orders · Goods receipts · Purchase returns · Reports

- **Item master [P1]:** name, category (consumables, equipment parts, stationery, cleaning, lab supplies, other; medicines are in the pharmacy catalog and appear here read-only), unit, min/reorder level, preferred supplier, active.
- **Locations [P1]:** Main store plus departmental locations (Pharmacy, Lab, Wards). Stock-in and stock-out per location; **transfers between locations** with a record. (new)
- **Requisitions [P1] (new):** a department requests items from the store → store keeper approves/issues (full or partial) → stock moves to the department location. Statuses `requested → approved → issued → closed` or `rejected`.
- **Adjustments and stock count [P1 adjust, P2 count]:** reason codes, approval above threshold, count sheets with variance report.
- **Suppliers [P1]:** name, contact, address, payment terms, active; supplier ledger (purchases, returns, payments, balance) when Finance is on.
- **Purchase orders [P1]:** `draft → pending_approval → approved → partially_received → received → closed`, or `cancelled` (reason). **Creator cannot approve their own PO**; approval limit by amount from Settings. Print PO.
- **Goods receipt (GRN) [P1]:** against a PO (partial allowed) or without a PO; batch, expiry, quantity, cost; attach supplier invoice (file). Updates stock through the stock engine in one transaction.
- **Purchase returns [P1]:** `draft → approved → completed`; stock out and supplier credit recorded.
- **Price history per supplier/item [P2].** (new)
- **Reports [P1]:** stock on hand and valuation, items below reorder, consumption by department/period, purchases by supplier, open POs, expiring items, supplier balances (with Finance).
- **Widgets:** low-stock items, open purchase orders, pending requisitions, recent receipts.
- **Permissions:** `inventory:item:read|manage`, `inventory:stock:in|out|transfer|adjust|count`, `inventory:requisition:create|approve|issue`, `inventory:supplier:read|manage`, `inventory:po:create|approve|cancel|print`, `inventory:grn:create`, `inventory:return:create|approve`, `inventory:dashboard:read`.

---------------------------------------------------------------------
## 9. Finance (`finance`)
**Tabs:** Invoices · Payments and receipts · Refunds and credit notes · Cash sessions (daily close) · Expenses · Supplier payables · Price list · Discounts and waivers · Reports

- **Charges to invoices [P1]:** pending charges from every module (registration, consultation, lab, radiology, pharmacy, bed days, procedures) appear per patient; the cashier builds an invoice from them or adds a manual line. **Price list/service catalog** [P1] with categories, prices, active; consultation fee per doctor/department from here.
- **Invoice statuses [P1]:** `draft → issued → partially_paid → paid`, or `void` (via credit note). Issued invoices are immutable. Printable invoice and receipt with hospital header, numbering from Settings.
- **Payments [P1]:** methods configured in Settings (cash, mobile money, bank transfer, other); partial payments; balance due; receipt per payment; overpayment blocked or held as deposit.
- **Patient deposits/advances [P1] (new):** advance payments, mostly for inpatients; applied to the final bill; refundable with approval.
- **Discounts and waivers [P1]:** discount within the user's limit; above limit needs `finance:discount:approve`; **free-care/waiver** with category and reason (charity, staff, NGO-funded) so it is reported separately. (new)
- **Refunds and credit notes [P1]:** reason, approver different from creator, linked to the original invoice/payment.
- **Cash sessions [P1] (new):** cashier opens a session with a float, closes with a counted amount; system shows expected vs counted and **variance**; manager review. Daily close report.
- **Expenses [P1]:** category, amount, date, description, attachment; approval above a limit; petty cash tracking. 
- **Supplier payables [P1, if inventory on]:** invoices from GRNs, payments against them, aging.
- **Packages/bundles [P2] (new):** a fixed-price bundle (e.g. normal delivery package) that expands to charges.
- **Reports [P1]:** daily collections (by cashier and method), revenue by service/department/doctor, outstanding invoices with aging, expenses by category, **simple profit and loss** (revenue minus expenses) by period, discounts/waivers given, void/refund log, patient statement.
- **Widgets:** revenue today/month, cash collected today, outstanding total, expenses month, waivers month.
- **Currency note:** one currency per hospital in v1 (set at creation). Mixed USD/AFN payments are an open owner decision (see section 14).
- **Permissions:** `finance:invoice:read|create|issue|void|print`, `finance:payment:create|refund|print`, `finance:deposit:create|refund`, `finance:discount:apply|approve`, `finance:waiver:apply|approve`, `finance:session:open|close|review`, `finance:expense:create|approve`, `finance:payable:read|pay`, `finance:price:manage`, `finance:report:read|export`, `finance:dashboard:read`.

---------------------------------------------------------------------
## 10. HR (`hr`)
**Tabs:** Staff directory · Departments and positions · Shifts and roster · Attendance · Leave · Documents · Reports
- **Staff directory [P1]:** staff record linked to the user profile (optional): full name, staff ID, department, position, employment type, join date, contract end date, phone, emergency contact, status (`active | on_leave | suspended | left`). Setting `left` also deactivates the login.
- **Departments and positions [P1]:** hospital departments list (also used by roles/users) and job positions.
- **Documents [P1]:** contracts, certificates, **licenses with expiry date**; dashboard alert for licenses/contracts expiring in 30/60/90 days. (new)
- **Shifts and roster [P1]:** shift definitions (morning/evening/night), weekly roster per department, swap/edit with audit.
- **Attendance [P1]:** manual check-in/out by the supervisor or HR (no biometric devices), status present/late/absent/leave; monthly summary. 
- **Leave [P1]:** leave types (annual, sick, unpaid, other), yearly balance, request → approve/reject by HR or the supervisor, calendar of who is away.
- **Reports [P1]:** headcount by department/position, attendance summary, leave summary, expiring licenses/contracts. Payroll is not included (deferred module).
- **Widgets:** staff count, on leave today, attendance rate, licenses expiring.
- **Permissions:** `hr:staff:read|create|update|archive`, `hr:department:manage`, `hr:document:read|upload`, `hr:shift:manage`, `hr:attendance:read|record`, `hr:leave:read|request|approve`, `hr:report:read|export`, `hr:dashboard:read`. HR staff **cannot** read clinical data.

---------------------------------------------------------------------
## 11. Inpatient, nursing, and emergency (`inpatient`)
**Hard needs:** `opd`. **Tabs:** Bed board · Admissions · Transfers · Discharge · Nursing tasks · Vitals chart · Medication administration · Ward rounds · Emergency board

- **Wards, rooms, beds setup [P1]:** ward type (general, private, ICU, maternity, pediatric), bed numbers, bed daily price (to the price list), status `available | occupied | reserved | cleaning | maintenance`.
- **Admission [P1]:** from an OPD visit or emergency; admitting doctor, ward/bed, diagnosis, expected stay, attendant name/phone; **deposit** requested (Finance link). Bed becomes occupied.
- **Daily bed charges [P1] (new):** a nightly job adds each occupied bed's daily charge to the ledger (idempotent, one charge per patient per day).
- **Transfers [P1]:** bed-to-bed or ward-to-ward with time and reason; history kept.
- **Ward rounds [P1]:** doctor's progress notes per day (reuses the note component), orders for the nurse.
- **Nursing [P1]:** task list per ward/shift (from orders and care plan), mark done with time and nurse name; **vitals chart** with abnormal flags; **shift handover note** per ward. (new)
- **Medication administration record [P1]:** scheduled doses from inpatient prescriptions; nurse marks `given | held | refused | missed` with time and reason; **two-person check for flagged high-risk medicines [P2]**.
- **Intake/output and care-plan detail [P2].**
- **Discharge [P1]:** discharge summary (diagnosis, treatment given, results, discharge medication, follow-up advice), outcome (`discharged | referred | left_against_advice | deceased`) with required details for referral/death, **billing clearance check** if Finance is on (warning, not hard block unless the hospital chooses), bed set to `cleaning` then `available` (cleaning confirmation by nurse/housekeeping user). Printable summary.
- **Emergency board [P1]:** quick registration (including **unknown patient** with a temporary identity merged later), arrival mode, chief complaint, **triage level 1–5** with vitals, waiting timer, assessment, **disposition** (`admit | discharge | refer | died`) linked to admission or visit.
- **Reports [P1]:** bed occupancy, admissions/discharges, average length of stay, emergency volume by triage level, outcomes summary. **Widgets:** occupancy %, admissions/discharges today, emergency waiting.
- **Permissions:** `inpatient:ward:manage`, `inpatient:admission:create|read`, `inpatient:bed:assign|clean`, `inpatient:transfer:create`, `inpatient:round:create`, `inpatient:task:read|complete`, `inpatient:vitals:create`, `inpatient:medication:administer`, `inpatient:discharge:create|print`, `inpatient:emergency:triage|dispose`, `inpatient:dashboard:read`. Clinical-authoring: `inpatient:round:create`, `inpatient:medication:administer`, `inpatient:discharge:create`.

---------------------------------------------------------------------
## 12. Cross-cutting features (core, used by every module)
- **Global search** (patients by name/MRN/phone/token, invoices by number, prescriptions by number) restricted by the user's permissions. [P1]
- **Patient banner**, **print templates** (hospital logo, name, address, footer from Settings; same style across all printouts). [P1]
- **Barcode/QR labels** for patient card, lab samples, prescriptions. [P1]
- **File attachments**: private storage, types and sizes limited, signed URLs, tenant-prefixed paths. [P1]
- **Settings [P1]:** hospital profile and logo, currency, timezone, tax rate, number formats, working hours, departments, payment methods, consultation fees, print header/footer, approval limits (PO, discount, adjustment, expense), "same person may enter and verify results" switch, session timeout. (Role/permission editing is in Users and roles.)
- **Dashboards:** per `PLATFORM_MODULES.md` §8. **Alerts** (computed, in-app only): low stock, expiring batches, critical lab results, pending approvals, expiring licenses, overdue results.
- **Downtime import [P2]:** Excel template upload after outages (`docs/DOWNTIME.md` when written); patient registration, check-in, vitals, notes first.
- **Import/export:** CSV export on lists (audited); bulk **import of price list, medicine catalog, supplier list and staff** from CSV with validation preview. (new) [P2]

## 13. Dashboard summary by role (what appears)
Hospital admin: every enabled module's widgets. Doctor: my queue, visits today, critical results for my patients. Nurse: ward tasks, vitals due, MAR due. Receptionist: queue, appointments, registrations. Cashier: my cash session, collections today. Finance manager: revenue, outstanding, expenses, waivers. Pharmacist: prescriptions waiting, low stock, expiring. Lab: pending, critical, turnaround. Radiology: pending, reported. Store keeper: low stock, requisitions, open POs. HR manager: headcount, leave, attendance, expiring licenses. Auditor: audit events and exceptions.

## 14. Open decisions (defaults in brackets)
1. Mixed currency (USD and AFN payments on one invoice) [not in v1; one currency per hospital].
2. Whether Lab/Radiology may enter and verify by the same person [off by default, switch in Settings].
3. Whether discharge is blocked until billing is cleared [warning only by default].
4. ICD-10 diagnosis codes [optional, free text allowed].
5. Interface language and right-to-left support [open].
6. Retention periods by country [open].
