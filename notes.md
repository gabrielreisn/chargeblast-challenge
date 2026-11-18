# Cleanup notes and CI proposals

Findings from a project audit (Nov 18, 2026), detected with
[knip](https://knip.dev) plus manual checks. Open items are listed first;
completed work is at the end.

## Open: dates

**Replacing `Date` (deferred).** Temporal is native in Node 26, Chrome 144+ and
Firefox 139+, but not in stable Safari, and the date filters, tooltips and CSV
export run in the browser. Options considered: Temporal with `temporal-polyfill`
(~20 KB gzipped, dropped once Safari ships), Day.js with its utc/timezone/
relativeTime plugins (~4–5 KB), or another small library. Current `Date` usage
is limited to `format.ts`, `url-state.ts` (`isCalendarDate`), `csv.ts`,
`columns.tsx`, `stripe-source.ts`, the payments page and the generator.

## Open: test gaps

Coverage is 88.6% of lines overall. Files still below 80% (line coverage):

| File                                         | Lines | What to test                                                      |
| -------------------------------------------- | ----- | ----------------------------------------------------------------- |
| `components/dashboard/shell.tsx`             | 0%    | Account menu, notifications popover, nav current state.           |
| `components/feedback/loading-state.tsx`      | 0%    | Trivial; a render test or exclude it.                             |
| `components/dashboard/route-transitions.tsx` | 40%   | Wrappers render children; tab key changes per segment.            |
| `features/payments/column-dnd.tsx`           | 68%   | Keyboard reordering (needs mocked rects in jsdom) or an E2E test. |
| `features/payments/filters.tsx`              | 72%   | Custom date range validation errors.                              |
| `features/payments/data-note.tsx`            | 75%   | The live-Stripe source label.                                     |

## Open: CI proposals

1. **Build job.** CI never runs `pnpm build`; only Vercel's preview catches
   build failures. Add a `build` job (it also validates Node 26 and metadata routes).
2. **Automated npm updates.** Dependabot currently updates GitHub Actions only.
   Adding the npm ecosystem (grouped weekly, respecting `minimumReleaseAge`)
   would replace manual `pnpm outdated` rounds.
3. **License allow-list.** `dependency-review-action` can fail PRs that add
   dependencies under disallowed licenses (`allow-licenses`).
4. **OpenSSF Scorecard** for a periodic supply-chain report.
5. **CodeQL** (`github/codeql-action`, JavaScript/TypeScript) for security-focused
   static analysis such as injection and unsafe URL handling.
6. **End-to-end smoke tests.** Playwright against `pnpm build && pnpm start`
   covering the drag-and-drop, filters and tab transitions that jsdom can't
   exercise, plus an axe accessibility scan per page.
7. **Lighthouse CI or bundle-size budget.** Fail when performance or
   accessibility scores, or client JavaScript size, regress past a threshold.

### Is `src/test/next-navigation.ts` used?

Yes. It is the `next/navigation` test double for three suites
(`payments-screen.test.tsx`, `topbar-search.test.tsx`,
`transactions-header.test.tsx`). It makes `useSearchParams`/`usePathname`
re-render on `history.pushState`, which the URL-driven filters depend on.

## Done

### Structure and readability (third pass)

- **Shared primitives moved to `src/components/ui/`:** `Hint` (`hint.tsx`) and
  `FilterPopover` (`filter-popover.tsx`). `components/` no longer imports from
  `features/`.
- **`MoveColumn` lives in `table-features.ts`**, removing the
  `payment-table.tsx` ↔ `column-dnd.tsx` import cycle.
- **`query.ts` split by concern:** `url-state.ts`, `format.ts`,
  `query-payments.ts` and `csv.ts`, each with its own tests and named helpers.
  Shared test data lives in `src/test/payments.ts`.
- **`payments-screen.tsx` composes smaller pieces:** `StatusTabs`,
  `TableToolbar` (filters, CSV export, column menu) and `DataNote`. It went
  from 241 to 142 lines.
- **`payment-details.tsx` is a Server Component**; only `CopyId` is client-side.
- **Email-shaped billing names** are now treated as the customer's email in
  `normalize.ts`, so legacy charges no longer show an address as the name.
- **Standard Tailwind setup:** `@tailwindcss/postcss` via `postcss.config.mjs`
  replaced the custom Turbopack loader rule.
- **New tests:** payment details (was 0%), CSV export success and failure
  toasts (toolbar was 19%), relative time, URL defaults. Coverage thresholds
  raised to 88/81/82/88.

### Unused code and files

- Removed `src/lib/api-client.ts` (`requestJson`, `ApiError`,
  `toastRequestError`) and its tests: nothing in the app used them. Restore
  from commit `fd0268c` when the first client-side request is added.
- Deleted the five `create-next-app` SVGs in `public/` and the `--text-25` token.
- Dropped the `package-lock.json` ignore from `.oxfmtrc.json`.
- `tsconfig.json`: `allowJs: false`, `target: "ES2022"`.
- Archived `plan.md` as `docs/initial-plan.md` with a "historical" note.
- The fixture data guard (every email ends in `@example.com`) already existed;
  it now lives in `fixture.test.ts`.

### Data pipeline (second pass)

- Removed the Stripe import pipeline; there are exactly two sources, the
  fixture and live Stripe. The fixture already uses the app's `Payment` schema;
  `normalize.ts` only translates Stripe API objects into it.
- Rewrote the fixture generator as `scripts/generate-payments.ts`
  (byte-identical output).
- `normalize.ts` uses named functions and a lookup table instead of nested
  ternaries.
- Added the brief as `docs/project-brief.pdf`.

### Lint, CI and supply chain (second pass)

- oxlint `suspicious` plus React hooks rules; knip in the project and CI.
- CI runs once per PR, with knip, dependency audit, dependency review and
  gitleaks jobs. Actions are pinned to commit SHAs through a shared composite
  setup action, kept current by Dependabot.
- `minimumReleaseAge` of 1 day; one reviewed audit exception (picomatch,
  dev-only, no patched release).
- Pre-commit gitleaks scan of staged changes.
- GitHub settings: secret scanning with push protection was already on; the
  dependency graph and Dependabot alerts were enabled for PR #2.
