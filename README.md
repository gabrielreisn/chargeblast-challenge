# Chargeblast · Payments

A recreation of the Stripe Dashboard Payments screen using Next.js, TypeScript 7, Tailwind CSS 4 (utilities only), TanStack Table, and accessible Radix primitives. Includes 500 synthetic payments across five currencies, four statuses, cards, wallets, and ACH.

## Run locally

Use Node.js 26 (`.nvmrc`) and pnpm 12.21.0 (pinned in `package.json`):

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Next.js, then `/payments`.

### Choosing the data source

Payments come from one of two sources, chosen with the `PAYMENTS_SOURCE` environment variable, usually set in `.env.local` (see `.env.example`):

- `local` (default): the committed synthetic fixture.
- `remote`: live payments from your Stripe sandbox: PaymentIntents plus legacy Charges without a PaymentIntent, as Stripe's Payments page lists them.

Restart the dev server after changing it. `remote` reads `STRIPE_SECRET_KEY` (from the environment, `.env` or `.env.local`; see `.env.example`). Only sandbox test keys (`sk_test_`/`rk_test_`) are accepted and live-mode objects are rejected. Requests run on the server only, fetch at most 1,000 payments newest first, and are cached for about a minute. A missing key or Stripe outage shows the page's error state, with the cause in the server log. On Vercel, set `PAYMENTS_SOURCE` and `STRIPE_SECRET_KEY` as project environment variables.

## Features

- Search payment IDs, emails, or card/bank last four digits.
- Filter by date (Today, 7/30 days, custom), multiple statuses/payment methods, currency, and inclusive amount range.
- Sort by date, amount, or status; paginate with 25, 50, or 100 rows.
- Copy full payment IDs; focus/hover dates for relative-time tooltips.
- Filters, sorting, and pagination persist in the URL and support browser history.
- Account menus, payment details routes, column resizing and reordering (drag a heading with mouse or touch, the keyboard reorder handle, or the Edit columns menu), and filtered CSV export.
- Responsive dashboard with horizontal table scrolling on small screens.

Dates use `America/Sao_Paulo`. Money stays in integer minor units and respects each currency's decimal precision. Mixed-currency sorting/filtering compares nominal displayed amounts; select a currency for like-for-like comparisons. CSV exports all filtered/sorted results across pages, with quoting and formula neutralization.

## Data

There are exactly two sources (see [Choosing the data source](#choosing-the-data-source)):

- `local`: `data/payments.fixture.json`, 500 fictional payments with customers at `example.com`. `scripts/generate-payments.ts` produces it deterministically; the same date always yields the same file:

  ```sh
  pnpm data:generate 2026-11-18T00:00:00Z
  ```

- `remote`: the Stripe sandbox behind `STRIPE_SECRET_KEY`, read at request time. Nothing is written to disk, and with the default `local` source, development, builds, tests and CI never call Stripe.

Env files are ignored by Git, except `.env.example`.

The four UI status categories deliberately simplify Stripe's source statuses. Refunds take precedence; canceled payments and failed payment-method attempts display Failed; other open PaymentIntents display Pending. The original source status remains visible on the detail page. Activity shows only known timestamps, and custom Stripe metadata is not exported.

## Checks

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test:unit
pnpm test:coverage
pnpm knip            # unused files, exports and dependencies
pnpm audit --audit-level high
pnpm build
```

`pnpm install` installs a [lefthook](https://lefthook.dev) pre-commit hook (`lefthook.yml`) that scans the staged diff for secrets with [gitleaks](https://github.com/gitleaks/gitleaks) (install it with `brew install gitleaks`), then runs `oxlint --fix` and `oxfmt` on staged files and restages the fixes; unstaged edits are left untouched. Skip it for a single command with `LEFTHOOK=0` only when necessary. `pnpm test:coverage` writes text, HTML (`coverage/index.html`) and LCOV reports and fails below the thresholds in `vitest.config.mts`.

GitHub Actions runs lint/format, typecheck, unit tests with coverage thresholds, unused-code (knip), dependency audit, dependency review (pull requests) and gitleaks secret-scan jobs, on pull requests and on pushes to `main`. Actions are pinned to commit SHAs and kept current by Dependabot. Tests cover query combinations, timezone boundaries, currency precision, status normalization, Stripe fetching, sorting, pagination, and clipboard behavior. Use `pnpm test:watch` during development.

## Deployment

[Production](https://chargeblast-challenge-starter.vercel.app/payments) · [GitHub](https://github.com/gabrielreisn/chargeblast-challenge)

Vercel detects Next.js and pnpm from the repository. Canonical URLs, Open Graph tags, `sitemap.xml` and `robots.txt` use `NEXT_PUBLIC_SITE_URL` when set, otherwise Vercel's production domain; all metadata is defined in `src/lib/seo.ts`. No Stripe runtime key is needed. The dashboard is a read-only demo; create-payment and unrelated navigation are reference elements rather than money-moving operations. The original brief is in [`docs/project-brief.pdf`](docs/project-brief.pdf); [`docs/initial-plan.md`](docs/initial-plan.md) keeps the pre-implementation plan for reference.
