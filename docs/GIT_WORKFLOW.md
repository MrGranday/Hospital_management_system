# GIT_WORKFLOW.md

## 1. Branch model
```
main        ← production. Always deployable. Protected. Only receives PRs from develop (or hotfix/*).
 └─ develop ← integration + staging. Protected. All features land here first and are tested here.
      ├─ feature/<issue>-short-name
      ├─ fix/<issue>-short-name
      ├─ chore/<short-name>      (deps, config, docs)
      └─ refactor/<short-name>
main ← hotfix/<issue>-short-name   (urgent production fix only; merged to main AND back to develop)
```
Branch names are lowercase with hyphens, include the issue number: `feature/142-patient-merge`.
Nobody commits directly to `main` or `develop`. Not the owner, not an AI agent.

## 2. Day-to-day flow
1. `git checkout develop && git pull`
2. `git checkout -b feature/142-patient-merge`
3. Work in small commits. Rebase on `develop` regularly (`git pull --rebase origin develop`).
4. Push and open a PR **into `develop`**. Fill in the PR template.
5. CI runs: lint, typecheck, unit tests, DB (pgTAP) tests, build, e2e smoke, secret scan, dependency audit.
6. Vercel creates a preview deployment against the **staging** Supabase project.
7. Review (1 approval minimum; 2 for security, money, RBAC, migration changes). Resolve all comments.
8. **Squash merge** into `develop`. Delete the branch.
9. `develop` auto-deploys to the staging environment. Test there (manual + e2e).

## 3. Release flow (develop → main)
1. Freeze: stop merging new features; only fixes.
2. Run the release checklist (section 6) on staging.
3. Open PR `develop → main` titled `release: vX.Y.Z`, with changelog.
4. Required: all checks green, owner approval, migration review.
5. **Merge commit** (not squash, to keep history of what shipped). Tag `vX.Y.Z`.
6. CI applies production migrations (manual approval gate), Vercel promotes to production.
7. Smoke test production. If broken: roll back the Vercel deployment first (instant), then fix forward.
8. Confirm `main` and `develop` are in sync (merge `main` back into `develop` if hotfixes occurred).

## 4. Hotfix flow
`git checkout -b hotfix/201-invoice-total main` → fix + test → PR into `main` (expedited review) → tag patch version → merge `main` back into `develop` the same day.

## 5. Commits and PRs
- **Conventional Commits:** `feat(billing): add credit note`, `fix(pharmacy): block dispensing expired batch`, `chore(deps): bump zod`, `docs:`, `refactor:`, `test:`, `perf:`, `ci:`. Breaking change: `feat!:` plus `BREAKING CHANGE:` footer.
- Subject ≤ 72 chars, imperative, no period. Body explains why.
- One logical change per PR. Target < 400 changed lines. Large work is split into stacked PRs behind a feature flag.
- Migrations are in their own commit within the PR.
- PR template (`.github/pull_request_template.md`): what/why, screenshots, how tested, DB changes, permissions changed, security impact, checklist from CODING_STANDARDS §12.

## 6. Release checklist
- [ ] All PRs merged are reviewed; no WIP
- [ ] Staging migrated from a copy of the previous schema, not only fresh
- [ ] e2e green on staging; manual pass of the critical journeys (register→visit→bill→dispense→lab)
- [ ] RLS tests green; permission matrix test green
- [ ] No new high/critical `npm audit` findings
- [ ] Rollback plan written; backup/PITR point noted
- [ ] Changelog and version updated

## 7. Branch protection (GitHub settings)
For `main` and `develop`: require PR, require approvals (CODEOWNERS for `supabase/`, `docs/SECURITY.md`, `src/server/auth`), dismiss stale approvals, require status checks (lint, typecheck, test, db-test, build, e2e, codeql, gitleaks), require linear history on `develop`, require signed commits (recommended), block force-push and deletion, restrict who can push to `main`. Admins are not exempt.

## 8. Environments map
| Git | Vercel | Supabase | Data |
|---|---|---|---|
| feature/* PR | Preview | Staging project (or per-PR branch DB) | Synthetic |
| develop | Staging (stable domain) | Staging project | Synthetic |
| main | Production | Production project | Real |
| local | `next dev` | `supabase start` | Seed |

## 9. Rules for AI agents specifically
- Create a branch from `develop` for each task. Never work on `main`/`develop`.
- Never force-push, rewrite shared history, or merge your own PR.
- Do not bundle unrelated changes. If you find another bug, open an issue.
- If a PR needs a migration, say so at the top of the PR description.
- Do not modify CI, branch protection, `docs/SECURITY.md`, or `docs/RBAC.md` unless the task explicitly asks.

## 10. Local tooling and database migrations
- **Supabase CLI is required** for schema work. Install with `npm install -g supabase` (or `scoop install supabase`) and verify with `supabase --version`.
- The hosted project's direct host (`db.<ref>.supabase.co`) resolves to IPv6 only. On IPv4-only networks use the pooler URL from `DATABASE_URL`, append `?sslmode=require` (or `&sslmode=require` if it already has a query string), and target it explicitly:
  `supabase db push --db-url "$DATABASE_URL?sslmode=require" --dry-run --yes`
  Rerun without `--dry-run` to apply. Never paste the URL or keys into commits, logs, or chat.
- Always `--dry-run` first. Migrations are immutable once merged; add a new file instead of editing an applied one.
- Apply pending migrations to the target project before testing the feature, and state that in the PR.
- Never commit `.env.local`, `next-env.d.ts`, or `.next/`. If `npm run typecheck` reports missing `.next/dev/types`, run `npm run dev` once (or `npm run build`) to regenerate route types.
- Before every commit: `npm run typecheck && npm run lint && npm run test && npm run build`.
- Feature branches merge into `develop` only. `main` receives releases, never feature work.
