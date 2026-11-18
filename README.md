# Chargeblast · Payments

A recreation of the Stripe Dashboard Payments screen (Transactions → Payments) in Next.js 16, TypeScript, Tailwind CSS 4 (utilities only), TanStack Table and accessible Radix primitives.

**[Live demo](https://chargeblast-challenge.vercel.app/payments)** · [GitHub](https://github.com/gabrielreisn/chargeblast-challenge) · [Project presentation](docs/presentation.md) · [Brief](docs/project-brief.pdf)

The brief's reference screenshot shows an older Stripe Dashboard. Where today's Dashboard differs (status tabs, the sidebar rail, the details page), the app aims for a middle ground between the two; [the presentation](docs/presentation.md#ui-choices-a-middle-ground-between-the-brief-and-todays-stripe) lists each choice.

## Run locally

Use Node.js 26 (`.nvmrc`) and pnpm 12.21.0 (pinned in `package.json`):

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Next.js; `/` redirects to `/payments`.

### Choosing the data source

Payments come from one of two sources, chosen with the `PAYMENTS_SOURCE` environment variable, usually set in `.env.local` (see `.env.example`):

- `local` (default): the committed synthetic fixture.
- `remote`: live payments from your Stripe sandbox: PaymentIntents plus legacy Charges without a PaymentIntent, as Stripe's Payments page lists them.

Restart the dev server after changing it. `remote` reads `STRIPE_SECRET_KEY`. Only sandbox test keys (`sk_test_` / `rk_test_`) are accepted and live-mode objects are rejected. Requests run on the server only, fetch at most 1,000 payments newest first, and are cached for about a minute. A missing key or Stripe outage shows the page's error state, with the cause in the server log. On Vercel, set `PAYMENTS_SOURCE` and `STRIPE_SECRET_KEY` as project environment variables.

## Features

- **Table:** shortened payment IDs with copy, customer, amount in its currency, status badges, payment method (brand, wallet or bank, last 4), and dates with a relative-time tooltip.
- **Statuses:** Stripe's nine (Succeeded, Refunded, Disputed, Failed, Uncaptured, Blocked, Incomplete, Canceled, Pending), as tabs with counts, a "…" menu, and an inline empty state for a status with no payments.
- **Filters:** date (Today, 7 / 30 days, custom), multi-select status and payment method, currency, and an amount range with a live input mask. Search by payment ID, email or last 4 digits (`/` focuses it).
- **Sorting and pagination:** date, amount and status; 25, 50 or 100 rows. Filters, sorting and pagination live in the URL, so views can be shared and the back button works.
- **Columns:** drag headings to reorder (mouse, touch or keyboard), resize, and show, hide, reorder or reset columns from Edit columns.
- **CSV export** of the visible columns, for the selected rows or every payment matching the filters.
- **Payment details page** (`/payments/[id]`): recent activity timeline, payment breakdown (fees, refunds, net), card or bank details, Radar risk, statement descriptor, funds availability, customer and metadata. Every date shows a time-conversion popover (your time zone and UTC).
- **Layout:** sidebar that collapses to an icon rail, a mobile navigation drawer, and a fixed-height table on desktop so search and filters stay in view.

Dates and numbers follow the viewer: the locale comes from `Accept-Language`, and the time zone from the browser (stored in a `tz` cookie), Vercel's `x-vercel-ip-timezone` or Cloudflare's `cf-timezone`, then UTC. Money stays in integer minor units and respects each currency's precision. Mixed-currency sorting and filtering compare nominal amounts; choose a currency to compare like for like.

## Data

There are exactly two sources:

- `local`: `data/payments.fixture.json`, 500 fictional payments with customers at `example.com`, across five currencies, eight statuses (Uncaptured is left empty to show its empty state), cards, wallets and ACH. Each payment carries card details, fees, payout dates, risk scores, metadata and a timeline. `scripts/generate-payments.ts` produces it deterministically; the same date always yields the same file:

  ```sh
  pnpm data:generate 2026-11-18T00:38:27.887Z
  ```

- `remote`: the Stripe sandbox behind `STRIPE_SECRET_KEY`, read at request time. Nothing is written to disk, and with the default `local` source, development, builds, tests and CI never call Stripe.

`src/features/payments/normalize.ts` maps Stripe objects to the dashboard statuses: a dispute outranks a refund, Radar blocks show as Blocked, `requires_capture` as Uncaptured, declined attempts as Failed, and intents still waiting on the customer as Incomplete. The original Stripe status stays visible as the Intent status column. Env files are ignored by Git, except `.env.example`.

## Checks

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test:coverage
pnpm knip            # unused files, exports and dependencies
pnpm audit --audit-level high
pnpm build
```

`pnpm install` installs a [lefthook](https://lefthook.dev) pre-commit hook (`lefthook.yml`) that scans the staged diff for secrets with [gitleaks](https://github.com/gitleaks/gitleaks) (install it with `brew install gitleaks`), then runs `oxlint --fix` and `oxfmt` on staged files and restages the fixes. `pnpm test:coverage` writes text, HTML (`coverage/index.html`) and LCOV reports and fails below the thresholds in `vitest.config.mts`, which only ever go up.

GitHub Actions runs lint and format, typecheck, unit tests with coverage thresholds, unused code (knip), dependency audit, dependency review (pull requests) and a gitleaks secret scan, on pull requests and pushes to `main`. Actions are pinned to commit SHAs and kept current by Dependabot; pnpm refuses install scripts by default and versions published less than a day ago.

## Deployment

Vercel deploys a preview for every pull request and production on merge to `main`. Canonical URLs, Open Graph tags, `sitemap.xml` and `robots.txt` use `NEXT_PUBLIC_SITE_URL` when set, otherwise Vercel's production domain; all metadata is defined in `src/lib/seo.ts`. No Stripe key is needed for the default source. The dashboard is a read-only demo: Create payment, Refund and destinations outside Payments are reference elements that never move money.
