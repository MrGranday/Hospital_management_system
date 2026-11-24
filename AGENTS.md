# AGENTS.md — Rules for every AI agent and developer working on MediCore HMS

Read this file first, every session. It is short on purpose. The detail lives in `/docs`.
Claude Code reads `CLAUDE.md`, Cursor reads `.cursor/rules`, Copilot reads `.github/copilot-instructions.md`.
Each of those files should contain exactly one line: `Follow /AGENTS.md and the documents it links to.`

## 1. What this project is
MediCore is an enterprise hospital/clinic management system. It stores patient health data (PHI),
money (billing, finance), staff records (HR) and stock (pharmacy, inventory). Mistakes here harm
patients and lose money. Correctness, security and auditability beat speed and visual flash.

Stack: Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 · shadcn/ui ·
Supabase (Postgres, Auth, Storage, Realtime) · Vercel · Zod · Vitest · Playwright.

## 2. Documents (read the ones that touch your task)
| Doc | Read it when |
|---|---|
| docs/SCOPE.md | Deciding whether a feature belongs in the product |
| docs/ARCHITECTURE.md | Adding any module, route, API, or background job |
| docs/DATABASE.md | Touching the schema, migrations, RLS, or queries |
| docs/SECURITY.md | Touching auth, permissions, PHI, files, money, secrets |
| docs/MODULE_SPECS.md | Building or changing any module's screens, workflows, statuses, reports. Defines [P1]/[P2] scope per module |
| docs/PLATFORM_MODULES.md | Super admin, hospital creation, modules on/off, roles, dashboards, support sessions. **Wins over other docs on these topics** |
| docs/MULTI_TENANCY.md | Anything touching hospitals (tenants), login, `hospital_id`, or the super admin |
| docs/RBAC.md | Adding or changing roles, permissions, or access checks |
| docs/CODING_STANDARDS.md | Writing any code |
| docs/UI_GUIDELINES.md | Writing any UI |
| docs/TESTING.md | Writing or changing tests |
| docs/GIT_WORKFLOW.md | Branching, committing, opening PRs |
| docs/DEPLOYMENT.md | Environments, env vars, releases |
| docs/ROADMAP.md | Knowing what is in scope right now |

## 3. Non-negotiable rules
1. **Never trust the client.** Every permission check and every validation happens on the server. UI hiding is cosmetic.
2. **Every table has RLS enabled** and policies in the same migration that creates it. No exceptions.
3. **No patient, billing, HR or stock data in localStorage, sessionStorage, cookies, or URLs.** Theme preference only.
4. **No mock or seed data in production code paths.** Seeds live in `supabase/seed.sql` and run in dev/staging only.
5. **All input is validated with Zod** at the server boundary (Server Action / Route Handler). Same schema is reused by the form.
6. **Money is integer minor units + currency code.** Never floats. Never `Number` arithmetic on decimals.
7. **Finalized financial records and stock movements are append-only.** Corrections are new records (credit note, reversing movement), never UPDATE/DELETE.
8. **Every write to PHI, money, stock, users or permissions produces an audit event** (database trigger, not UI code).
9. **No `service_role` key in client code or any file under `src/app` that renders to the browser.** It is allowed only in `src/server/admin/*` marked `import "server-only"`.
10. **No `any`, no `@ts-ignore`, no `ignoreBuildErrors`.** Use `unknown` and narrow.
11. **No compliance or marketing claims in the UI** (HIPAA, SOC 2, uptime, "encrypted", customer counts) unless legally verified and approved by the owner.
12. **Do not add a dependency** without a short justification in the PR. Prefer what is already installed.
13. **Never edit a migration that has been merged.** Add a new one.
14. **Do not invent features.** If it is not in `docs/SCOPE.md` for the current phase, ask the owner first.
15. **Tenant isolation.** Every domain table has `hospital_id NOT NULL` and an RLS policy on it. `hospital_id` is taken from the session, never from client input. One hospital must never see another's data, files, cache, or realtime events.
16. **No outbound messaging.** The product sends no email, SMS, push, or chat messages and has no provider for them. Do not add one.
17. **Modules.** Every feature belongs to exactly one module declared in its `module.config.ts`. Permissions are `<module>:<resource>:<action>`. Modules talk only through core tables (patients, orders, charges, stock) or another module's `index.ts`. Never import across feature folders. Disabled modules are unreachable (404), enforced in RLS, server, routing, and UI.
18. **Super admin** sees no hospital data outside an audited support session.

## 4. Definition of done (every task)
- [ ] Follows the layering in ARCHITECTURE.md (UI → action → service → repository)
- [ ] Server-side permission check present and tested
- [ ] Zod schema on every input
- [ ] RLS policy added/updated and tested if data access changed
- [ ] Loading, empty, error and forbidden states exist
- [ ] Keyboard accessible, labelled, passes axe
- [ ] Unit/integration tests added; `npm run lint`, `typecheck`, `test` pass
- [ ] No new `console.log`, no commented-out code, no TODO without an issue number
- [ ] PR is small (target < 400 changed lines), targets `develop`, follows GIT_WORKFLOW.md

## 5. When unsure
Stop and ask. Write the question in the PR or issue. A wrong guess in a medical or financial
system costs more than a delay. For architectural choices, add an ADR in `docs/adr/NNNN-title.md`.
