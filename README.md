# Chargeblast · Payments

A recreation of the Stripe Dashboard Payments screen using Next.js, TypeScript 7, Tailwind CSS 4 (utilities only), TanStack Table, and accessible Radix primitives. Includes 500 synthetic payments across five currencies, four statuses, cards, wallets, and ACH.

## Run locally

Use Node.js 24 and pnpm 12.6.0 (pinned in `package.json`):

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Next.js, then `/payments`.

## Features

- Search payment IDs, emails, or card/bank last four digits.
- Filter by date (Today, 7/30 days, custom), multiple statuses/payment methods, currency, and inclusive amount range.
- Sort by date, amount, or status; paginate with 25, 50, or 100 rows.
- Copy full payment IDs; focus/hover dates for relative-time tooltips.
- Filters, sorting, and pagination persist in the URL and support browser history.
- Account menus, payment details routes, column resizing/reordering (drag or keyboard controls), and filtered CSV export.
- Responsive dashboard with horizontal table scrolling on small screens.

Dates use `America/Sao_Paulo`. Money stays in integer minor units and respects each currency's decimal precision. Mixed-currency sorting/filtering compares nominal displayed amounts; select a currency for like-for-like comparisons. CSV exports all filtered/sorted results across pages, with quoting and formula neutralization.

## Data

The deployed application uses `data/payments.fixture.json`, containing fictional customers at `example.com`. Regenerate it with `pnpm data:generate`, optionally with a fixed ISO timestamp:

```sh
pnpm data:generate 2026-11-18T00:00:00Z
```

The local-only Stripe SDK importer is available as `pnpm stripe:import`. It uses the existing `STRIPE_SECRET_KEY` from the environment or `.env.local`, accepts sandbox test secret/restricted keys only, and refuses live objects. It uses SDK auto-pagination with retries, caps the import at 1,000 records, and atomically replaces `data/stripe-payments.local.json` after validation. The importer is explicit; development, builds, tests, and CI never call Stripe. No publishable key or webhook is needed. Integration alignment can be done separately.

In development, an existing local snapshot takes precedence over the fixture. Both `.env.local` and the local JSON are ignored by Git. Production always uses the committed synthetic fixture. Importing fewer than 300 payments does not duplicate or invent Stripe records.

The four UI status categories deliberately simplify Stripe's source statuses. Refunds take precedence; canceled payments and failed payment-method attempts display Failed; other open PaymentIntents display Pending. The original source status remains visible on the detail page. Activity shows only known timestamps, and custom Stripe metadata is not exported.

## Checks

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test:unit
pnpm test:coverage
pnpm build
```

`pnpm install` installs a [lefthook](https://lefthook.dev) pre-commit hook (`lefthook.yml`) that runs `oxlint --fix` and then `oxfmt` on staged files and restages the fixes; unstaged edits are left untouched. Skip it for a single command with `LEFTHOOK=0` only when necessary. `pnpm test:coverage` writes text, HTML (`coverage/index.html`) and LCOV reports and fails below the thresholds in `vitest.config.mts`.

GitHub Actions runs separate lint/format, typecheck, and unit-test (with coverage thresholds) jobs with frozen pnpm installs. Tests cover query combinations, timezone boundaries, currency precision, status normalization, safe import persistence, sorting, pagination, and clipboard behavior. Use `pnpm test:watch` during development.

## Deployment

[Production](https://chargeblast-challenge-starter.vercel.app/payments) · [GitHub](https://github.com/gabrielreisn/chargeblast-challenge)

Vercel detects Next.js and pnpm from the repository. Canonical URLs, Open Graph tags, `sitemap.xml` and `robots.txt` use `NEXT_PUBLIC_SITE_URL` when set, otherwise Vercel's production domain; all metadata is defined in `src/lib/seo.ts`. No Stripe runtime key is needed. The dashboard is a read-only demo; create-payment and unrelated navigation are reference elements rather than money-moving operations. See `plan.md` for the original requirement mapping and delivery checklist.
