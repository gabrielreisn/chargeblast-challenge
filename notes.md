# Cleanup notes and CI proposals

Findings from a project audit (Nov 18, 2026). Unused code was detected with
[knip](https://knip.dev), plus manual checks for static assets and `@theme`
tokens, which knip doesn't cover. Open items are listed first; completed work
is at the end.

## Open: unused code and files

| Item                                           | Where                                                                  | Suggestion                                                                                                                                                                                                  |
| ---------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requestJson`, `ApiError`, `toastRequestError` | `lib/api-client.ts`                                                    | No production caller yet; only tests use them. Keep only if client-side requests are planned soon, otherwise remove with their tests.                                                                       |
| 5 starter SVGs                                 | `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | Leftovers from `create-next-app`; delete.                                                                                                                                                                   |
| `--text-25` token                              | `src/app/globals.css`                                                  | No longer referenced; delete.                                                                                                                                                                               |
| `package-lock.json` ignore                     | `.oxfmtrc.json`                                                        | npm leftover since the pnpm migration; delete the entry.                                                                                                                                                    |
| `allowJs: true`                                | `tsconfig.json`                                                        | No JavaScript sources remain; set to `false`. `target: "ES2017"` can also move to `ES2022` (Next transpiles anyway).                                                                                        |
| `plan.md`                                      | repo root                                                              | Describes the original plan (importer, local snapshots, file layout, old tabs). Archive it under `docs/` with a "historical" note, or delete it now that README and `CLAUDE.md` describe the current state. |

### Is `src/test/next-navigation.ts` used?

Yes. It is the `next/navigation` test double for three suites
(`payments-screen.test.tsx`, `topbar-search.test.tsx`,
`transactions-header.test.tsx`) via
`vi.mock("next/navigation", () => import("@/test/next-navigation"))`. It makes
`useSearchParams`/`usePathname` re-render on `history.pushState`, which the
URL-driven filters depend on. Keep it.

## Open: readability and structure

Ordered by value. All follow the "readability over performance" rule in `AGENTS.md`.

1. **Move `Hint` (and `FilterPopover`) to `src/components/ui/`.** Shared UI in
   `components/dashboard` currently imports from `features/payments/ui.tsx`,
   which inverts the layering (`components` should not depend on `features`).
2. **Move the `MoveColumn` type to `table-features.ts`.** `payment-table.tsx`
   and `column-dnd.tsx` import each other today (type-only, but circular).
3. **Split `features/payments/query.ts`** into URL state
   (`parseQuery`/`serializeQuery`/`paymentsHref`), formatting
   (`formatAmount`/`formatDate`/`relativeTime`), filtering and sorting
   (`queryPayments`), and CSV export (`csvForPayments`).
4. **Break up `payments-screen.tsx`** into `StatusTabs`, `TableToolbar` and
   `DataNote` components so the screen reads as composition.
5. **Make `payment-details.tsx` a Server Component.** Only `CopyId` needs the
   client; the rest is static markup, so the `"use client"` directive can move
   down to the interactive island.
6. **Billing name holding an email.** Some legacy Stripe charges store the email
   in `billing_details.name`, so the details card shows the email as the name
   and "No email provided". Detect `name` values that look like emails and treat
   them as the email.
7. **Tailwind loader.** `next.config.ts` wires `@tailwindcss/turbopack`
   through a custom Turbopack rule. Its dev cache once served a stale `@theme`
   after a big `globals.css` change. Consider the standard
   `@tailwindcss/postcss` setup unless the custom loader is needed.

## Open: test gaps

Coverage is 84% of lines overall, but these files are low (line coverage):

| File                                         | Lines | What to test                                                      |
| -------------------------------------------- | ----- | ----------------------------------------------------------------- |
| `components/dashboard/shell.tsx`             | 0%    | Account menu, notifications popover, nav current state.           |
| `features/payments/payment-details.tsx`      | 0%    | Renders each source's notes, refunds row, customer fallbacks.     |
| `components/feedback/loading-state.tsx`      | 0%    | Trivial; a render test or exclude it.                             |
| `components/dashboard/route-transitions.tsx` | 40%   | Wrappers render children; tab key changes per segment.            |
| `features/payments/column-dnd.tsx`           | 68%   | Keyboard reordering (needs mocked rects in jsdom) or an E2E test. |
| `features/payments/payments-screen.tsx`      | 71%   | CSV export (success and failure toast), status tab counts.        |
| `features/payments/filters.tsx`              | 72%   | Custom date range validation errors.                              |

## Open: CI proposals

1. **Build job.** CI never runs `pnpm build`; only Vercel's preview catches
   build failures. Add a `build` job (it also validates Node 26 and metadata routes).
2. **Automated npm updates.** Dependabot currently updates GitHub Actions only.
   Adding the npm ecosystem (grouped weekly, respecting `minimumReleaseAge`)
   would replace manual `pnpm outdated` rounds.
3. **License allow-list.** `dependency-review-action` can fail PRs that add
   dependencies under disallowed licenses (`allow-licenses`).
4. **OpenSSF Scorecard** for a periodic supply-chain report.
5. **GitHub secret scanning with push protection.** A repository setting (free
   for public repos) that blocks pushes containing known token formats,
   including Stripe keys. Complements the gitleaks checks.
6. **Fixture data guard.** A small test asserting every fixture email ends in
   `@example.com` and IDs look synthetic, so real customer data can't be
   committed by accident.
7. **CodeQL** (`github/codeql-action`, JavaScript/TypeScript) for security-focused
   static analysis such as injection and unsafe URL handling.
8. **End-to-end smoke tests.** Playwright against `pnpm build && pnpm start`
   covering the drag-and-drop, filters and tab transitions that jsdom can't
   exercise, plus an axe accessibility scan per page.
9. **Lighthouse CI or bundle-size budget.** Fail when performance or
   accessibility scores, or client JavaScript size, regress past a threshold.

## Done

### Data pipeline

- **Removed the Stripe import pipeline.** `scripts/import-payments.ts`,
  `scripts/import-stripe-payments.ts`, `pnpm stripe:import`, the
  `data/stripe-payments.local.json` override and the `stripe-sandbox` snapshot
  type are gone. There are exactly two sources: the fixture and live Stripe.
  The fixture already uses the app's `Payment` schema; `normalize.ts` only
  translates Stripe API objects into it.
- **Rewrote the fixture generator** as `scripts/generate-payments.ts`. It
  reproduces the committed fixture byte for byte (same checksum).
- **`normalize.ts` without nested ternaries.** Status and method mapping are
  named functions plus a `methodByStripeType` lookup table.
- **Added the brief** as `docs/project-brief.pdf`.

### Lint and unused code

- **Stricter lint.** `.oxlintrc.json` enables `suspicious` plus
  `react/rules-of-hooks` and `react/exhaustive-deps` (the obsolete
  `react-in-jsx-scope` is off; the project uses the automatic JSX runtime).
  It caught a real bug: after a rename, CSV export would have called the
  browser's deprecated global `escape()` instead of the field escaper.
  Other fixes: `sort()` → `toSorted()`, a shadowed variable, helpers moved to
  module scope.
- **knip in the project and CI** (`pnpm knip`). The five unused exports and one
  unused type it reported are unexported.

### CI and supply chain

- **Runs once per PR.** `push` is limited to `main`.
- **New jobs:** unused code (knip), dependency audit
  (`pnpm audit --audit-level high`), dependency review on PRs (fails on
  high-severity vulnerabilities), and a gitleaks secret scan over full history.
- **Audit exception:** `GHSA-fc5q-39xc-vjpf` (picomatch ReDoS) is ignored in
  `pnpm-workspace.yaml` with a justification. It is dev-only (`pnpm audit
  --prod` is clean) and no patched version exists yet. Remove it once
  picomatch ships a fix.
- **`minimumReleaseAge`: 1 day.** Three days would fail today's lockfile
  (oxlint 1.94 and oxfmt 0.79 were published on Nov 16). It can be raised once
  dependencies age.
- **Actions pinned to commit SHAs** with version comments, upgraded to current
  majors (`pnpm/action-setup` v6, `gitleaks-action` v3: v2 stopped working when
  GitHub removed Node 20 from runners). Shared setup lives in a composite
  action (`.github/actions/setup`); Dependabot keeps the pins current.
- **Pre-commit secret scan.** lefthook runs
  `gitleaks git --pre-commit --staged` before lint and format (`protect` is
  deprecated in gitleaks 8.19+). It fails with install instructions if gitleaks
  is missing.
- **Scan results:** full git history is clean. Locally, gitleaks flags only
  git-ignored files: your Stripe key in `.env`, and Next.js's per-build preview
  and encryption keys in `.next/`. The Stripe key does not appear in any build
  output.
