You are the repository setup engineer for MediCore HMS. Do this task in order and do not skip steps.
This task is ONLY about git remote setup and file organization. Do NOT change application logic,
do NOT delete features or modules, do NOT upgrade or remove dependencies, do NOT fix lint errors.

INPUTS (if either is still a placeholder, stop and ask me):
  NEW_REPO_URL = <PASTE THE NEW EMPTY GITHUB REPO URL HERE>
  DOCS_PATH    = <PATH TO THE FOLDER THAT CONTAINS AGENTS.md AND docs/ (the medicore-docs folder)>

GLOBAL SAFETY RULES
- Never use: git push --force, git reset --hard, git clean, rm -rf, or rewrite history.
- Never put a token or password inside the remote URL. If a push needs authentication and fails,
  stop and tell me exactly what failed. Do not work around it.
- Never commit .env files, secrets, node_modules, .next, or build output.
- Use `git mv` for every move so history is preserved. This is Windows: for case-only renames use
  a two-step move (old -> temp -> new).
- Do not change line endings of existing files or change global git config.
- Show me every command you run and its output summary in your final report.

STEP 0 - INSPECT
1. Run: git status, git branch -a, git log --oneline -5, git remote -v. Report the current remote URL.
2. If there are uncommitted changes, stop and ask me what to do. Do not stash or discard anything.
3. Record the BASELINE: run `npx tsc --noEmit` and `npm run build`, and note pass/fail and the number of errors.
   (npm run lint is known to be broken, record its result but do not fix it.)
4. Safety scan before anything leaves this machine: list tracked files matching .env*, *.pem, *.key,
   *.sqlite, *.db, and grep tracked files for strings like "SECRET", "API_KEY", "PASSWORD=", "service_role".
   If anything looks like a real secret, STOP and tell me. Do not push.

STEP 1 - POINT THE REPO AT THE NEW REMOTE
1. Verify the new repo is empty: `git ls-remote NEW_REPO_URL`. If it returns any refs, stop and ask me.
2. `git remote set-url origin NEW_REPO_URL`, then `git remote -v` to confirm. Note the old URL in your report.
3. Make sure the current branch is named `main` (rename with `git branch -M main` only if it is not).
4. Push the untouched baseline: `git push -u origin main`.
5. Create and push the integration branch: `git checkout -b develop` then `git push -u origin develop`.
(This baseline push is a one-time bootstrap exception. Everything after this goes through a branch and a PR.)

STEP 2 - WORK BRANCH
`git checkout -b chore/repo-restructure` from develop. Make small commits using Conventional Commits.
After EACH commit run `npx tsc --noEmit` and `npm run build`. They must match the baseline. If a move breaks
them, fix the imports for that move or revert that commit. Never leave the branch broken.

STEP 3 - ROOT AND DOCUMENTATION LAYOUT (commit: "chore: add project docs and agent rules")
1. Copy AGENTS.md to the repo root and the contents of DOCS_PATH/docs/ into ./docs/ exactly as provided.
2. Move the existing audit file (audite.md or similar) to docs/audit/2026-11-14-project-audit.md.
3. Move any other stray .md files into docs/ (or docs/archive/ if obsolete). README.md stays at the root.
4. Create these root pointer files, each with exactly one line "Follow /AGENTS.md and the documents it links to.":
   CLAUDE.md, .github/copilot-instructions.md, and .cursor/rules/project.mdc
   (the .mdc file needs front matter: --- alwaysApply: true --- above that line).
5. Create README.md (if missing or default-template) with: one-paragraph description, tech stack,
   how to run locally, and a link list to AGENTS.md and every file in docs/. No marketing claims, no compliance claims.
6. Create .github/pull_request_template.md from docs/GIT_WORKFLOW.md section 5 (what/why, screenshots, how tested,
   DB changes, permissions changed, security impact, checklist from docs/CODING_STANDARDS.md section 12).
7. Ensure .gitignore, .env.example and .editorconfig exist. Remove tracked junk from the git index ONLY:
   `git rm --cached` for any *.orig and tsconfig.tsbuildinfo (do not delete them from disk).
8. The root must end up containing only: README.md, AGENTS.md, CLAUDE.md, config files (package.json, lockfile,
   tsconfig, next.config.ts, eslint config, postcss config, components.json, vercel/caddy files if they exist),
   .gitignore, .env.example, .editorconfig, and these folders: src, public, docs, supabase, e2e, .github.
   Create empty supabase/ and e2e/ folders with a one-line README.md each saying what will live there.
   Do not create a LICENSE file: ask me which license I want.

STEP 4 - SOURCE LAYOUT (target defined in docs/ARCHITECTURE.md section 4; moves only)
Target under src/:
  app/                       Next.js routes only (keep the current app/page.tsx and api/ working)
  features/<module>/components/    one folder per module, kebab-case, files in PascalCase
  components/ui/             shadcn primitives
  components/shared/         app shell and cross-module components (AppShell, sidebar, topbar, command palette, ModalHost)
  lib/                       utilities (rbac, print, storage, theme, utils)
  store/                     the existing Zustand store (unchanged for now)
  _legacy/                   quarantine for things already decided to be removed or replaced (see below)
Commits (one per bullet):
 a) "refactor: rename src/pages to src/features". The folder src/pages is currently treated by Next.js as the Pages
    Router and exposes 25 public unauthenticated routes. Move each src/pages/<Module>.tsx to
    src/features/<module-kebab>/components/<Module>.tsx. Use these folder names: activity-log -> audit-log,
    appointments, billing, blood-bank, dashboard, emergency, emr, finance, hr, inventory, ipd, lab, nursing, opd,
    patients, pharmacy, purchases, radiology, reports, roles -> users-roles, settings, suppliers.
    Update imports in src/app/page.tsx and anywhere else. After this, `npm run build` must NO LONGER list any
    "Route (pages)" entries. Confirm that in your report.
 b) "refactor: group shell and shared components". Move AppShell, LoginScreen, ModalHost and other cross-module
    files into src/components/shared/ (LoginScreen into src/features/auth/components/).
 c) "refactor: quarantine legacy modules". Move these into src/_legacy/<name>/ WITHOUT deleting or editing them:
    Communications, Telemedicine, BackupRestore, and any placeholder components (e.g. ModulePlaceholder), plus
    src/lib/data.ts into src/_legacy/mock-data/data.ts. Add src/_legacy/README.md explaining: "Scheduled for removal
    per docs/SCOPE.md. Do not import from here in new code. Delete when the replacement is wired to Supabase."
    If a moved file is still imported by live code, keep the import working by updating the path, and list it.
 d) Remove empty folders. Do not leave a file in a folder where it does not belong.
Rules for any other file you are unsure about: do not guess. Leave it where it is and list it under
"Needs decision" in your report.

STEP 5 - VERIFY AND PUSH
1. Run `npx tsc --noEmit` and `npm run build` one last time and compare to the baseline.
2. Print the final tree with `git ls-files | head -200` summarized by top-level folders.
3. `git push -u origin chore/repo-restructure`.
4. If the `gh` CLI is installed and authenticated, open a PR into `develop` titled
   "chore: restructure repository and add project docs" using the PR template. Otherwise, give me the GitHub URL
   to open the PR myself. Do NOT merge anything.

FINAL REPORT (required)
- Old remote URL and new remote URL (confirm with `git remote -v`)
- Branches pushed: main, develop, chore/repo-restructure
- Table of every move: old path -> new path
- Baseline vs final results for tsc and build; confirmation that no "Route (pages)" routes remain
- Files left in place that need my decision
- Anything you noticed that looks risky (secrets, large files, odd tracked files). Report only, do not fix.


new: repo :https://github.com/MrGranday/Hospital_management_system.git