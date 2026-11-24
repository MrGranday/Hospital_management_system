# MULTI_TENANCY.md — One platform, many hospitals, zero data mixing

Authoritative for tenant isolation. Modules, roles, super admin screens and support sessions are defined in `PLATFORM_MODULES.md`, which wins where the two differ.

## 1. Model (your idea, confirmed)
- **Platform** = the whole system. Run by the owner through the `super_admin` role.
- **Hospital** = a tenant. The super admin creates it. It gets the modules the super admin switches on (see PLATFORM_MODULES.md).
- **Flat, not nested.** There is no hospital inside a hospital and no branches in v1. One hospital = one tenant = one `hospital_id`.
- **A user belongs to exactly one hospital.** The only exception is `super_admin`, who belongs to none.
- Every hospital's data is private to that hospital, enforced by the database, not by app code alone.

## 2. How modern systems isolate tenants (and what we pick)
| Pattern | How | Isolation | Cost / complexity | Verdict |
|---|---|---|---|---|
| **Shared schema + `hospital_id` + RLS** | One database, one set of tables, a `hospital_id` column on every row, Postgres Row Level Security | Strong if RLS is tested | Lowest. One migration updates everyone | **Chosen** |
| Schema per tenant | One Postgres schema per hospital | Strong | Migrations run N times; Supabase API/RLS tooling fights it | No |
| Database/project per tenant | One Supabase project per hospital | Strongest | Highest. N projects to migrate, monitor, pay for | Only as a later "dedicated" option for a hospital that contractually demands it. The same code runs there with one tenant |

This is what most SaaS products use, and it matches what the docs already describe. Nothing needs to be redesigned, only simplified: `facility_id` is removed, `org_id` is renamed `hospital_id`.

## 3. Data model
```
hospitals(id, code, name, status, country, timezone, currency, created_at, created_by)
          status: active | suspended | archived          -- code is unique, lowercase, e.g. "alnoor"
profiles(user_id PK → auth.users, hospital_id NULL for super_admin, username, full_name,
         is_active, must_change_password, created_by)    -- unique (hospital_id, username)
roles, role_permissions                                  -- per hospital, created by the hospital admin (PLATFORM_MODULES.md §9)
permissions, modules, hospital_modules                   -- global catalog; hospital_modules = which modules each hospital has
user_roles(user_id, role_id)
hospital_settings(hospital_id PK, logo_path, tax_rate, number_formats, ...)
hospital_counters(hospital_id, name, next_value)         -- MRN, invoice no, PO no per hospital
<every domain table>(..., hospital_id NOT NULL → hospitals(id), ...)
```
- Unique constraints are per hospital: `unique (hospital_id, mrn)`, never global.
- Cross-table references use composite keys `(hospital_id, id)` so a row can never point at another hospital's row (blocks a class of bugs and IDOR attacks).
- Roles are per hospital. Role templates are global and read-only.

## 4. Two levels of admin (never confuse them)
| | `super_admin` (platform) | `hospital_admin` (tenant) |
|---|---|---|
| Belongs to | No hospital | One hospital |
| Can | Create, suspend, reactivate hospitals; create the first `hospital_admin`; reset a hospital admin's password; see the platform audit log | Create and manage users of **their** hospital, reset their passwords, settings, departments, dashboards, approvals |
| Cannot | Read patient, billing, HR, or stock data of any hospital **except inside an audited support session** (PLATFORM_MODULES.md §7) | Touch other hospitals; see platform data |
RLS makes this real: domain-table policies require `hospital_id = current_hospital_id()`. A super admin has no hospital id, so every domain query returns zero rows. Support access into a hospital happens only through a **support session**: mandatory reason, recent MFA, time-limited, audited, visible to the hospital admin (PLATFORM_MODULES.md §7).

## 5. Provisioning a hospital (super admin console)
The only screens in the `(platform)` area: Hospitals list, Create hospital, Hospital detail (suspend/reactivate, reset admin password), Platform audit log.
Create hospital runs as **one Postgres function** called by a server action (admin client, `server-only`), in one transaction:
1. Insert `hospitals` (name, unique `code`, country, timezone, currency).
2. Insert `hospital_settings` and `hospital_counters` defaults.
3. Create the first user (`auth.admin.createUser`, `email_confirm: true`, temporary password) and `profiles` row with `must_change_password = true`.
4. Assign role `hospital_admin`.
5. Write a platform audit event.
If any step fails, everything rolls back (user creation is compensated by deleting the auth user). The super admin hands the code, username, and temporary password to the hospital **in person or by phone** (the system sends nothing).

## 6. Login without email
The product sends no email and no SMS. Supabase Auth needs an email-shaped identifier, so:
- The login form asks for **Hospital code + Username + Password** (+ authenticator code if MFA).
- The server maps it to an internal identifier `username@code.medicore.invalid` (the `.invalid` TLD can never receive mail). Users never see it.
- Supabase settings: signups off, email confirmation off, custom SMTP not configured. Users are created only by admins with `email_confirm: true`.
- **No self-service password reset.** Hospital admin resets staff; super admin resets hospital admins. A reset sets a one-time temporary password and forces a change at next login. Every reset is audited.
- MFA is TOTP (authenticator app); it needs no email. Lost device: an admin resets the factor, with the same audit.
- Super admin lockout risk: keep two super admins, store recovery details offline in a safe, and keep the Supabase dashboard as the last-resort access path.
Trade-off you accept: a forgotten password needs a human admin. For a hospital this is normal practice and safer than email reset links.

## 7. JWT and RLS
The Supabase access-token hook adds claims: `hospital_id`, `permissions[]`, and `role`. It **refuses to issue a token** if the hospital is `suspended` or `archived` or the profile is inactive, which locks everyone out within one token lifetime (keep it ≤ 1 h and revoke refresh tokens on suspend).
```sql
create function private.current_hospital_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'hospital_id','')::uuid;
$$;
-- every domain policy starts with:  hospital_id = (select private.current_hospital_id())
```

## 8. Isolation checklist (all must hold)
- [ ] `hospital_id` NOT NULL on every domain table; every index and unique key starts with it
- [ ] RLS enabled with `hospital_id` policy on every domain table (allowlist: `hospitals`, `roles`, `permissions`, `role_permissions`)
- [ ] Storage object paths are `{hospital_id}/...` and bucket policies check the first path segment
- [ ] Server code never accepts `hospital_id` from the client; it comes from the session
- [ ] Cache keys, `revalidateTag` tags, and Realtime channel filters include `hospital_id`
- [ ] Cron jobs and RPCs take `hospital_id` explicitly or iterate tenants; no unscoped aggregates
- [ ] Reports and dashboards read per-hospital summary tables
- [ ] Audit events carry `hospital_id`; a hospital sees only its own
- [ ] **Automated tenant-isolation test:** create hospitals A and B with data in every table, sign in as A, assert zero rows from B on every table (the test discovers tables from the catalog, so new tables are covered automatically). CI also fails if a `public` table has no `hospital_id` and is not on the allowlist

## 9. Hospital lifecycle
`active` → `suspended` (logins blocked, data kept) → `active` again, or → `archived` (read-only, no logins). No hard delete from the UI. Permanent deletion or a data hand-over to a hospital that leaves is an **operations runbook** performed by the owner with a recorded legal basis, not an app button.

## 10. Per-hospital configuration
Each hospital sets its own name, logo, country, timezone, **currency**, tax rate, and numbering formats in `hospital_settings`. The platform is global, so: no hardcoded currency or name, all dates and numbers formatted with `Intl` for the hospital's locale. Whether the UI itself needs several languages or RTL is still an open owner decision (see SCOPE.md §5).

## 11. Scale and fairness between tenants
- Every index leads with `hospital_id`; large append-only tables are partitioned monthly.
- Per-hospital rate limits and a database `statement_timeout` stop one hospital from slowing the rest.
- Heavy reports run from summary tables, never over raw rows.
- If one hospital outgrows the shared database, move it to its own Supabase project (the dedicated option in §2). That is why `hospital_id` and settings are the only tenant concept in the code.

## 12. Not in scope
Tenant billing/subscriptions, plans and quotas, per-tenant custom domains or subdomains, white-labeling beyond name and logo. Each can be added later by ADR.
