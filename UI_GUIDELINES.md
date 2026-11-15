# UI_GUIDELINES.md — Clinical software, not a SaaS landing page

Goal: calm, dense, legible, fast. Staff use this for 8 hours a day under pressure. Decoration that costs attention is a defect.
This file also defines how to remove the "AI-generated" look from the prototype.

## 1. Principles
1. **Information first.** The data is the design. Chrome stays quiet.
2. **One accent color** (brand) used for primary actions and selection. Everything else is neutral gray. Color is otherwise reserved for **meaning**: red = critical/danger, amber = warning, green = success/normal, blue = info. Never decorative.
3. **Solid surfaces.** No gradients, glass, glow, or mesh backgrounds in the app. Hierarchy comes from spacing, type weight, and 1px borders.
4. **Density with order.** Tables and forms are compact but aligned. Use consistent 4px spacing scale.
5. **Plain words.** Sentence case, active verbs, specific labels ("Save patient", not "Submit"). No marketing copy inside the product.
6. **Truthful UI.** Nothing is labelled "live", "connected", "encrypted", "AI", or "certified" unless it is true and verified.

## 2. Tokens (replace the prototype's 8-accent / density / radius system)
Define once in `globals.css` (Tailwind v4 `@theme`). Delete `tailwind.config.ts` (dead under v4). One color system only (pick `oklch` or hex; remove the `hsl()` leftovers).
- **Neutral scale:** 11 steps, slightly cool gray. Background, surface, border, muted text, text.
- **Brand:** one hue, 3 usable steps (default, hover, subtle background). Proposed: a restrained teal or blue-green appropriate to healthcare. Confirm with owner.
- **Status:** `danger`, `warning`, `success`, `info`, each with foreground, background, border. Contrast ≥ 4.5:1 for text, ≥ 3:1 for UI borders/icons.
- **Radius:** one value for controls and one for containers (e.g. 6px / 8px). No pill-everything.
- **Shadow:** at most two levels (none, and a subtle one for popovers/dialogs). No colored glows.
- **Type:** one sans family (Inter, Geist, or system UI stack). Scale: 12/13/14/16/20/24/30. Body 14px in data screens. `tabular-nums` for all numbers, doses, amounts, times. Mono only for IDs/MRN/codes if needed. No all-caps eyebrow labels above headings; no gradient text.
- **Themes:** light and dark only. Both pass contrast. Remove accent/density/radius user settings.

## 3. Remove list (the AI tells to purge)
Search the codebase and remove or replace. Commands:
```bash
# Gradients, glow, glass
grep -rnE "bg-gradient|from-|via-|to-(brand|primary|\w+-[0-9]{3})|bg-clip-text|text-transparent" src
grep -rnE "backdrop-blur|bg-white/[0-9]+|bg-black/[0-9]+|glass|glow|shadow-\[" src
# Decorative motion and fake live indicators
grep -rnE "animate-pulse|animate-ping|animate-bounce|LIVE|Live" src
grep -rnE "framer-motion|motion\.(div|section|li)" src
# Marketing claims and fake integrations
grep -rniE "HIPAA|SOC ?2|99\.9|uptime|trusted by|end-to-end|encrypted|AI Assistant|Twilio|Stripe|SendGrid|FHIR|HL7|SAML|LDAP|coming soon|demo\)" src
# Hardcoded identity/currency
grep -rnE "\\$[0-9]|\"\\$\"|AFN|MediCore (General|Hospital)" src
```
| Tell | Replace with |
|---|---|
| Mesh/gradient page and login backgrounds | Flat neutral background; login is a simple centered card |
| Gradient buttons and gradient icon tiles | Solid brand primary; neutral outline secondary; icons without colored tiles |
| Glass cards, `backdrop-blur`, glow shadows | `bg-card border` with 1px border |
| Every card a rounded-2xl with same shadow | Fewer cards. Use tables, sections with dividers, and plain headers. Cards only for distinct objects |
| KPI row + chart + table template on every page | Start each screen from the user's task: queue first, then filters, then details. KPIs only where they drive action |
| Big number + small label + gradient accent hero stats | Compact stat with unit and comparison, no decoration |
| Pulsing "LIVE" badges | Remove. Use "Updated 2 min ago" on real data, with Realtime only where implemented |
| Fade-and-slide on every list/page/card, hover lifts | Remove page and list entrance animations. Keep only response-to-action motion (dialog open, toast, expand) ≤ 150 ms. Respect reduced-motion. Drop `framer-motion` unless a specific need remains |
| Emoji and sparkle icons, "AI" badges | Lucide icons at one size (16/20 px), one stroke width |
| Tinted status backgrounds everywhere | Status pill (text + subtle bg) only where status exists |
| Marketing slogans, fake numbers, fake partners | Delete. Real hospital name from settings |
| Eyebrow labels, "→" on every link, numbered 01/02/03 | Delete unless content is truly a sequence |
| Decorative illustrations | Delete. Empty states use one icon + one sentence + one action |
| Placeholder buttons ("coming soon" toasts) | Remove the button until the feature exists |

Keep the good parts the audit praised: grouped sidebar, command palette, tabular numbers, status pills, dark mode, pre-hydration theme bootstrap.

## 4. Layout and navigation
- App shell: left sidebar (grouped by workflow: Front desk, Clinical, Diagnostics, Pharmacy & Stores, Finance, Admin), top bar with hospital name, global search, alerts, user menu.
- Sidebar shows only modules the user has permission for.
- One URL per screen; breadcrumbs on detail pages; back button works.
- List screens: filters on top, table, pagination footer. Row click opens detail page (or a side sheet for quick view). Sticky header.
- Detail screens: persistent patient banner (name, age/sex, MRN, allergies, alerts) on every clinical screen.
- Forms: single column, labels above fields, required marked, inline errors, primary action bottom-right, destructive actions separated and confirmed.
- Responsive: desktop-first for clinical stations; tablets supported (nurses, wards); phones for dashboards and approvals only. Tables scroll inside their container.

## 5. Components
- Use shadcn/ui primitives that are in use. Add primitives only when needed.
- Shared: `PageHeader`, `DataTable` (server pagination, sort, filters, empty/loading/error), `StatusBadge`, `EmptyState`, `ConfirmDialog`, `FormField`, `PatientBanner`, `MoneyText`, `DateText`.
- Dialogs: Radix `Dialog`/`AlertDialog` only. Destructive or financial actions use `AlertDialog` with a reason field when required (void, adjust, archive).
- Toasts for confirmation of success only; errors that need action are inline.
- No more than one primary button per view.

## 6. Clinical safety UI
- Allergies and critical alerts are always visible in the patient banner (red, text + icon, not color alone).
- Abnormal lab values flagged with text (`H`, `L`, `Critical`) plus color.
- Destructive/irreversible actions require confirmation and say exactly what will happen.
- Never auto-dismiss clinical warnings.
- Show units next to every number. Never truncate drug names or doses.

## 7. Accessibility (WCAG 2.2 AA is the target)
Keyboard reachable and visible focus ring on everything · logical tab order · labels and `aria-describedby` for errors · contrast ≥ 4.5:1 · don't rely on color alone · hit targets ≥ 24×24 CSS px (prefer 32+) · skip link · `prefers-reduced-motion` honored · landmarks (`header`, `nav`, `main`) · axe checks in e2e for every module.

## 8. Writing rules
Sentence case. Buttons are verbs. The same action keeps the same name in the button, the dialog title, and the toast. Errors say what happened and what to do, without apologizing. Empty states say what the screen is for and offer the next action. Never "Oops!". Use the clinic's terms (Visit, Encounter, Admission) consistently; pick one and use it.

## 9. UI refactor plan (when you have time; not blocking backend work)
1. Replace tokens in `globals.css`; delete accent/density/radius settings and `tailwind.config.ts`.
2. Run the grep commands; remove gradients, glass, glow, pulse, fake claims in one PR per area (login, shell, dashboard, then modules).
3. Remove `framer-motion` page/list animations.
4. Rebuild the login screen as a plain form.
5. Migrate modals to Radix `Dialog`.
6. Replace hand-rolled tables with `DataTable`.
Do these opportunistically: any module being rewired to Supabase gets its UI cleanup in the same PR.
