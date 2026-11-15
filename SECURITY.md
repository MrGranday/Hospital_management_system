# SECURITY.md

Scope: web app, Supabase project, Vercel project, CI/CD, and the people operating them.
This system holds PHI, financial records, HR records and inventory. Treat every feature as a potential leak or fraud path.

## 1. Threat model (what we defend against)
| Threat | Example | Primary controls |
|---|---|---|
| Stolen or guessed credentials | Phished receptionist account | MFA, password policy, lockout, session limits, anomaly alerts |
| Privilege abuse by insiders | Cashier edits prices, nurse browses a celebrity's chart, HR sees clinical notes | Least privilege RBAC, RLS, separation of duties, access logging, break-glass |
| Financial fraud | Voided invoices after cash taken, stock written off silently | Append-only ledgers, approvals, credit notes, audit, daily reconciliation reports |
| Data exfiltration | Mass export, leaked backup, public storage bucket | Permission-gated and audited exports, private buckets, no JSON "backup" downloads, rate limits |
| Web attacks | XSS, CSRF, injection, SSRF, IDOR | CSP, framework escaping, Zod, parameterized queries, RLS (kills IDOR), Server Action origin checks |
| Supply chain | Malicious npm package | Lockfile, pinned versions, Dependabot, audit in CI, minimal dependencies |
| Misconfiguration | Service key in client, RLS off on one table | CI checks, code review checklist, secret scanning |
| Data loss | Bad migration, ransomware, accidental delete | PITR backups, soft delete, append-only, tested restores |

## 2. Compliance position (be honest)
- Compliance regime depends on country. HIPAA (US), GDPR (EU/UK), and local health-data laws elsewhere. **Owner must confirm the jurisdiction.** Until then, treat this as: health data is the most sensitive class of data.
- **Do not store real patient data until contracts are in place.** For HIPAA this means signed Business Associate Agreements with the database host and the app host. At the time of writing, Supabase offers a HIPAA add-on and BAA on specific paid plans, and Vercel offers BAAs on its Enterprise plan. **Verify current plan requirements directly with each vendor before go-live.** Pre-launch work with synthetic data only.
- Never display "HIPAA compliant", "SOC 2", "encrypted end-to-end", etc. in the product. Compliance is an organizational program, not a UI label.
- Choose the Supabase region based on data-residency law.

## 3. Authentication
- Supabase Auth with **hospital code + username + password**. No self-signup and no email: users are created only by an admin (`auth.admin.createUser` with `email_confirm: true`) and must change the temporary password at first login. Details in MULTI_TENANCY.md §6.
- Password: minimum 12 characters, breached-password check enabled, no composition theater. There is no self-service reset: a hospital admin resets staff passwords and the super admin resets hospital admins, with a one-time temporary password and forced change. Every reset is audited.
- **MFA (TOTP) required** for: super_admin, hospital_admin, accountant/finance, hr_manager, pharmacist, inventory_manager, auditor. Recommended for all. Enforce with AAL2 checks in `requirePermission()` and RLS (`auth.jwt()->>'aal' = 'aal2'`) on sensitive tables.
- Sessions: short access token (≤ 1 h), refresh rotation on, idle timeout 15–30 min on shared workstations (client timer + server check), absolute max 12 h. User can view and revoke own sessions. Admin can revoke any user.
- Lockout/rate limit: 5 failed logins → progressive delay and alert. Rate-limit login and admin password-reset endpoints at the edge (Vercel Firewall/WAF or Upstash).
- Never log or store passwords, tokens, or OTP codes. Login errors are generic ("Hospital code, username or password is incorrect").
- Remove the prototype's demo role buttons and hardcoded credentials from the production bundle. Dev-only demo users are created by `seed.sql` in local/staging.

## 3.1 Tenant isolation and platform admin
- One hospital must never see another's data: `hospital_id` on every row, RLS on every table, tenant-prefixed storage paths, an automated cross-tenant test in CI (MULTI_TENANCY.md §8). A tenant leak is a **critical** incident.
- `super_admin` belongs to no hospital and cannot read clinical, billing, HR, or stock data. Its power is limited to hospital lifecycle and password resets. Keep only two super admins, MFA mandatory, every action in the platform audit log.
- Suspending a hospital blocks token issuance and revokes sessions.
- `hospital_id` is never accepted from the client.

## 4. Authorization
Full model in `RBAC.md`. Rules:
1. Deny by default. A user with no role sees nothing.
2. Three enforcement layers, all required: **RLS** (data) → **`requirePermission()` in every Server Action/Route Handler** (operation) → **UI gating** (cosmetic).
3. Permissions are atomic strings `module:action` (`billing:void`). Roles are bundles stored in the database.
4. Separation of duties (enforced in service + DB): PO creator ≠ approver; invoice creator ≠ voider; stock adjuster ≠ approver above a threshold; the person who creates a user cannot assign `super_admin`.
5. **Break-glass:** a clinician needing a record outside their department requests access with a mandatory reason; it creates a time-limited `access_grants` row, is logged, and notifies a supervisor.
6. Admins manage users and configuration; they do not get clinical read access by default.

## 5. Data protection
- In transit: HTTPS only, HSTS (`max-age=63072000; includeSubDomains; preload`), TLS 1.2+.
- At rest: Supabase encrypts storage/backups at rest. Add column-level encryption only for specific high-risk identifiers (national ID) after a design review; keys are never in the repo.
- PHI stays out of: URLs and query strings, logs, error messages, analytics, Sentry payloads (scrub).
- Minimize: collect only fields the workflow needs. Mask by default (`ID ••••1234`), reveal on click and log the reveal.
- Files: private Storage buckets only; access through signed URLs (≤ 60 s) generated server-side after permission check; allowlisted MIME types and size limits; random object keys; no public buckets, ever.
- Exports and printing: require permission (`<module>:export`), are rate-limited, watermark with user and time where practical, and write an audit event.
- No bulk "download entire database" feature in the UI. Backups are infrastructure, not an app feature.

## 5.1 Financial and inventory integrity
- Money in integer minor units. Totals are computed in the database function that posts the document, not trusted from the client.
- Finalized invoices, payments, goods receipts, and stock movements are immutable. Corrections: credit note, reversing payment, reversing movement, each with reason and approver.
- Price changes and discounts above a threshold need `billing:discount_approve`.
- Daily close: cashier session totals reconcile to payments; mismatch is flagged.
- Stock adjustments, write-offs, and negative-stock overrides require a reason code and (above threshold) a second approver.
- Alerts for unusual patterns: many voids by one user, after-hours adjustments, repeated discounts.

## 6. Application hardening
- **Headers** (set in `next.config.ts` `headers()` or `proxy.ts`): `Content-Security-Policy` (nonce-based, no `unsafe-eval`, `frame-ancestors 'none'`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geolocation off), `Cross-Origin-Opener-Policy: same-origin`.
- **Input:** Zod at every boundary; reject unknown keys (`.strict()`); length limits; no `dangerouslySetInnerHTML`; never build SQL strings; use Supabase query builder or parameterized RPC.
- **CSRF:** Server Actions enforce same-origin; Route Handlers that mutate must verify `Origin` and require auth. No state-changing GET.
- **Open redirects / SSRF:** allowlist redirect targets; server fetches only to known hosts.
- **Secrets:** only in Vercel/Supabase environment settings. `NEXT_PUBLIC_*` contains only the Supabase URL and anon key. `.env*` is gitignored; `.env.example` has no real values. Rotate on staff departure or suspected leak.
- **Error pages** never show stack traces or SQL.
- **Rate limiting** on auth, search, export, and any endpoint that returns PHI in bulk.

## 7. Supabase-specific checklist
- [ ] RLS enabled on **every** table in `public`; CI test fails if any table has RLS off
- [ ] No policy with `using (true)` on a non-reference table
- [ ] `anon` role cannot read any table or call any function
- [ ] Functions marked `security definer` set `search_path = ''` and live in `private` schema
- [ ] `service_role` key exists only in server-side env on Vercel; never in `NEXT_PUBLIC_*`
- [ ] Storage buckets private; policies mirror table access
- [ ] Public signups disabled; no email provider configured or used; secure password change on
- [ ] Network restrictions / SSL enforcement enabled; DB direct access limited to CI and named admins
- [ ] PITR enabled on production; restore drill every quarter
- [ ] Separate Supabase projects for staging and production, with different keys

## 8. Vercel and CI/CD
- Production env vars scoped to Production only; Preview uses staging Supabase keys. Never point previews at production data.
- Protect preview deployments (Vercel Authentication) because they may contain synthetic but realistic data.
- GitHub: branch protection, required reviews, required status checks, signed commits recommended, secret scanning + push protection, Dependabot, CodeQL, `npm audit --omit=dev` and a license check in CI, `gitleaks` in CI.
- Least-privilege tokens; no long-lived personal tokens in CI. Two people with production access minimum; 2FA mandatory on GitHub, Vercel, Supabase.
- Production deploy only from `main`, only after the staging run passes.

## 9. Audit and monitoring
- What is logged: logins/logouts/failures, MFA events, role/permission changes, every create/update/void on PHI/money/stock/HR, PHI reads (chart open, print, export), break-glass, config changes, exports.
- Logs are append-only, retained per legal requirement, readable only by `auditor` and `super_admin`, and cannot be cleared from the UI (the prototype's "clear log" is removed).
- Alerts (to a named on-call): login failure spikes, new admin created, role escalation, bulk export, break-glass use, RLS/policy changes, backup failure, 5xx spike.

## 10. Incident response (minimum plan)
1. **Detect** (alert or report) → 2. **Contain** (revoke sessions, rotate keys, disable account/module via flag) → 3. **Assess** (what data, whose, how long, using audit events) → 4. **Notify** (legal/regulatory and affected patients within the deadlines of your jurisdiction; HIPAA breach rules and GDPR 72 h are examples) → 5. **Recover** (restore from PITR if needed) → 6. **Review** (written post-mortem within 5 working days, add a control).
Keep a printed contact list: owner, lead developer, Supabase support, Vercel support, legal counsel.

## 11. Secure development rules
- Security review checklist in every PR touching auth, permissions, money, files, or PHI.
- Threat-model new modules in a short section in the PR.
- Annual (or pre-launch) third-party penetration test; fix criticals/highs before go-live.
- Staff training: phishing, shared logins forbidden, lock screen, no PHI in chat apps.

## 12. Pre-launch security gate (all must be true)
- [ ] BAAs/DPAs signed where required; jurisdiction confirmed
- [ ] Fake auth, demo credentials, false claims removed
- [ ] RLS tests green; no `service_role` in client bundle (CI grep)
- [ ] MFA enforced for privileged roles
- [ ] Audit log append-only and verified
- [ ] Restore drill performed and timed
- [ ] Pen test done; criticals closed
- [ ] Incident plan and contact list printed
