# CODING_STANDARDS.md

## 1. TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitAny: true`, `exactOptionalPropertyTypes` recommended. `ignoreBuildErrors` stays false.
- No `any`, `as any`, `@ts-ignore`. `@ts-expect-error` only with a comment and issue link.
- Prefer `type` for data shapes, `interface` only for extendable contracts. Derive types from Zod (`z.infer`) and from generated DB types. Do not hand-write a type that duplicates one of those.
- Discriminated unions for state (`{status:'loading'} | {status:'ok', data}`), not several booleans.
- Exhaustive `switch` with a `never` check on status machines.
- No enums; use `as const` objects or unions.

## 2. Naming and files
| Thing | Convention |
|---|---|
| Files/folders | `kebab-case.ts`; React components `PascalCase.tsx` |
| Components, types | `PascalCase` |
| Functions, variables | `camelCase`; booleans `isX`, `hasX`, `canX` |
| Constants | `UPPER_SNAKE_CASE` only for true constants |
| DB / SQL | `snake_case` (see DATABASE.md) |
| Zod schemas | `createPatientSchema`, type `CreatePatientInput` |
| Actions | verb-first: `createPatient`, `voidInvoice` |
| Permissions | `module:action` |
Named exports everywhere except Next.js files that require default exports. One component per file. Max ~300 lines per file; split before that.

## 3. Feature module template
```
features/patients/
  components/       PatientTable.tsx, PatientForm.tsx, PatientHeader.tsx
  actions.ts        "use server" — thin
  service.ts        business rules
  repo.ts           Supabase queries
  schemas.ts        Zod
  permissions.ts    export const PATIENT_PERMS = { read: 'patients:read', ... } as const
  types.ts
  patients.test.ts
```
Copy the `patients` module as the reference implementation when building a new module. Do not invent a new layout.

## 4. Server Actions pattern (mandatory shape)
```ts
"use server";
export async function createPatient(raw: unknown): Promise<Result<PatientDTO>> {
  const ctx = await requirePermission(PATIENT_PERMS.create);      // 1. authenticate + authorize
  const parsed = createPatientSchema.safeParse(raw);               // 2. validate
  if (!parsed.success) return fail("VALIDATION", parsed.error);
  const result = await patientService.create(ctx, parsed.data);    // 3. business logic
  if (result.ok) revalidatePath("/patients");                      // 4. refresh
  return result;                                                   // 5. typed result, never throw for expected errors
}
```
Order is always: authorize → validate → service → revalidate.

## 5. React and Next.js
- Server Components by default. Add `"use client"` only for state, effects, event handlers, browser APIs. Push the boundary as low as possible.
- Fetch in Server Components, not in `useEffect`.
- Do not call `Date.now()` / `Math.random()` during render (lint rule `react-hooks/purity`). Do not `setState` synchronously inside effects.
- `key` props are stable ids, never array index for dynamic lists.
- Memoize only with evidence (`useMemo`, `memo`). No premature optimization. Never create objects/arrays inline as props to memoized children.
- Dynamic import (`next/dynamic`) for charts, rich editors, print views.
- Images through `next/image`. No raw `<img>` for remote content.
- Every route segment: `loading.tsx`; every module: `error.tsx`; not-found handled.
- Suspense boundaries around slow sections; skeletons match final layout.
- Forms: React Hook Form + `zodResolver`, field-level errors from the server `Result.error.fields`, disable submit while pending, prevent double submit, idempotency key for payments.

## 6. Data and business logic rules
- Dates: store UTC `timestamptz`; display in the hospital's timezone using `Intl.DateTimeFormat`. Utilities in `lib/dates.ts`. Never `new Date(string)` on ambiguous strings.
- Money: `lib/money.ts` (`Money` = `{ amount: bigint|number minor, currency }`). Format with `Intl.NumberFormat` and hospital currency. No hardcoded `$`.
- Hospital name, currency, timezone, tax come from `hospital_settings`, never constants. `hospital_id` always comes from the session.
- IDs: UUID from the database. Never generate ids or document numbers on the client.
- State machines are explicit: a `transitions` map in `service.ts` and a `CHECK` in the DB. Invalid transitions return `fail("INVALID_TRANSITION")`.
- Soft-delete only; list queries filter `deleted_at is null` (RLS does it too).
- No business rule lives only in a component.

## 7. Error handling and logging
- Expected failures → `Result` objects. Unexpected → throw `AppError` subclasses; caught at boundary, logged with request id.
- Never log PHI, tokens, or full request bodies. Log ids.
- No `console.log` in committed code (`no-console` lint error). Use `logger`.
- User-facing messages: say what happened and what to do ("Invoice can't be voided because a payment was posted. Create a credit note instead.").

## 8. Imports and dependencies
- Absolute imports via `@/`. Order: node/react → third party → `@/lib`, `@/server` → `@/features` → relative. Enforced by ESLint + Prettier plugin.
- A feature may import another feature only through its `index.ts` public API. No deep imports into another feature's files.
- `components/ui` (shadcn) contains only primitives in use. Unused files are deleted.
- New dependency checklist: maintained? license ok? size? alternative already in repo? Put the answer in the PR.

## 9. Style and tooling
- Prettier (default config + `printWidth: 100`), ESLint (`eslint-config-next`, `@typescript-eslint/strict`, `jsx-a11y`, `import/order`), Husky + lint-staged on commit.
- Scripts that must exist and pass in CI: `lint`, `typecheck`, `test`, `build`, `db:test`, `e2e`.
- Comments explain **why**, not what. No commented-out code. No aspirational or marketing comments ("enterprise-grade security layer"). TODOs require an issue number: `// TODO(#123): …`.
- English identifiers and comments.

## 10. Performance rules
- Query only needed columns; paginate; avoid N+1 (use joins/`select` with relations or RPC).
- No unbounded lists in the DOM; virtualize beyond ~200 rows (`@tanstack/react-virtual`) or paginate.
- Debounce search; cancel stale requests.
- Keep client bundles small: check `next build` output; justify any route over 200 KB first-load JS.

## 11. Accessibility baseline (code level; visual rules in UI_GUIDELINES.md)
Use shadcn `Dialog`/`AlertDialog` (Radix) for all modals so focus trap, `role="dialog"`, Escape, and `aria-modal` come free. Never build a modal from a bare `div`. Every input has a label. Every icon-only button has `aria-label`. Interactive elements are `button`/`a`, not clickable `div`. Respect `prefers-reduced-motion`.

## 12. Review checklist (reviewer must tick)
Permission check ✔ · Zod ✔ · RLS/policy ✔ · audit trigger ✔ · no PHI in logs/URLs ✔ · money integer ✔ · states (loading/empty/error/forbidden) ✔ · a11y ✔ · tests ✔ · no new `any` ✔ · docs updated ✔
