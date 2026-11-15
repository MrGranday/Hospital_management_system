## What and why

<!-- What does this PR change, and why? Link the issue. -->

## Screenshots

<!-- Required for UI changes: before and after, or a short clip. -->

## How tested

<!-- Commands run, tests added, manual steps. -->

## Database changes

<!-- Migrations added, RLS policies, append-only implications. "None" if not applicable. -->

## Permissions changed

<!-- Roles or permissions added or changed. "None" if not applicable. -->

## Security impact

<!-- PHI, money, files, secrets, tenancy impact. "None" if not applicable. -->

## Checklist

- [ ] Permission check server-side and tested
- [ ] Zod schema on every input
- [ ] RLS/policy added or updated if data access changed
- [ ] Audit trigger covers PHI, money, stock, users or permission writes
- [ ] No PHI in logs or URLs
- [ ] Money uses integer minor units plus currency code
- [ ] Loading, empty, error and forbidden states exist
- [ ] Keyboard accessible, labelled, passes axe
- [ ] Tests added and `npm run lint`, `typecheck`, `test` pass
- [ ] No new `any`, `@ts-ignore`, or `ignoreBuildErrors`
- [ ] Docs updated
