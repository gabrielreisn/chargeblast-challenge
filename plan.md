# Chargeblast Stripe Payments screen implementation plan

Status: implementation authorized. Use the official Stripe SDK; skip the standalone import command.

## Goal and source

Recreate the Stripe Dashboard **Transactions > Payments** screen with close visual fidelity and all required table behavior from `Chargeblast Front-End Project Stripe Payments Screen.pdf` (four pages, supplied locally in Downloads). Pages 1–2 define the requirements; pages 3–4 show the reference. Page 4 is a static walkthrough image in this PDF, with no embedded video or linked walkthrough available.

Deadline: **Friday, November 20, 2026, end of day, America/Sao_Paulo**. The current starter already uses Next.js, TypeScript, Tailwind, Oxlint, Oxfmt, Vitest, and GitHub Actions. Preserve that stack while switching the package manager to pnpm.

The brief permits local mock JSON. Stripe sandbox data will be an optional import source; the delivered screen must work from local data without Stripe credentials or a network connection to Stripe.

## 1. Migrate npm to pnpm

- Pin `packageManager` to `pnpm@12.6.0`, the version currently installed locally. Keep Node.js 24.
- Run `pnpm import` against `package-lock.json`, inspect the resolved versions, install successfully with pnpm, then remove `package-lock.json`. Commit only `pnpm-lock.yaml` as the application lockfile.
- Update README examples to `pnpm install --frozen-lockfile`, `pnpm dev`, `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test:unit`, and `pnpm build`.
- Update all three GitHub Actions jobs: install the pinned pnpm before Node's pnpm cache setup, use `cache: pnpm`, and install with `pnpm install --frozen-lockfile`. Preserve separate lint/format, typecheck, and unit-test checks.
- Check pnpm's dependency build-script policy. Allow only dependencies that need installation scripts, based on the actual install output; do not globally allow every dependency script.
- Confirm Vercel detects pnpm from the lockfile and pinned package manager. Do not leave an npm install override in project settings.
- Recheck the six previously reported development-dependency audit advisories during migration. Review fixes without forcing unrelated major downgrades.

Reference: [pnpm installation](https://pnpm.io/installation), [lockfile import](https://pnpm.io/cli/import).

## 2. Define the payment model and local data source

Use a normalized, typed model independent of Stripe SDK response types:

```ts
type PaymentStatus = "succeeded" | "pending" | "failed" | "refunded";
type PaymentMethod = "card" | "ach" | "wallet" | "other";

type Payment = {
  id: string;
  customer: { id: string | null; name: string | null; email: string | null };
  amount: number; // integer minor units, never floating-point storage
  currency: string;
  status: PaymentStatus;
  sourceStatus: string;
  method: PaymentMethod;
  methodType: string | null;
  brand: string | null;
  last4: string | null;
  wallet: string | null;
  created: number; // Unix seconds
  amountRefunded: number;
  description: string | null;
};
```

- Add a versioned JSON envelope containing `schemaVersion`, `source`, `importedAt`, and `payments`.
- Commit a deterministic synthetic fixture with approximately **500 rows**, fictional names/emails, USD/EUR/GBP/BRL plus a zero-decimal currency, several card brands, ACH/wallets, and all four statuses. Include dates today, within 7/30 days, and older dates. A fixed seed and explicit generation timestamp make tests reproducible.
- Keep sandbox imports separate at `data/stripe-payments.local.json`, ignored by Git. Do not commit imported customer information. Commit only the synthetic fixture for the public demo.
- Add a server-only data loader and runtime validation. A local import takes precedence in development when present; otherwise use the synthetic fixture. The deployed demo defaults to the committed fixture. Client components receive only normalized display data.
- Missing customer, card, or charge details must render intentional fallbacks. An imported sandbox may contain fewer than 300 payments; do not silently duplicate those records. Use the synthetic fixture to satisfy the assignment dataset size.
- Use PaymentIntents as one row per payment. Expand customer, latest charge, and payment method. A Charges-only export would miss pending PaymentIntents without charges and could produce multiple attempts for one payment.
- Normalize statuses explicitly: refunded latest charge first; `succeeded` next; `canceled` and `requires_payment_method` with a payment error become Failed; remaining open states become Pending. Preserve `sourceStatus` so the simplified four-badge mapping is inspectable. A partially refunded charge uses Refunded plus its refund amount.
- Classify wallet-backed cards as Wallet before ordinary Card; `us_bank_account` as ACH; preserve unsupported types as Other. Use the latest charge's method details, falling back to the expanded payment method or last payment error's method.

## 3. Build the reference layout and required table

First implement the required table. Build a light dashboard shell alongside it because the sidebar/top bar materially affect the side-by-side reference comparison, but they remain optional in the brief.

- Match the reference's white surfaces, subtle gray borders, compact rows, muted typography, purple active controls, and restrained status colors. Measure the source screenshot before choosing widths, row height, font size, padding, and radius; do not substitute a spacious generic dashboard.
- Match visible text such as **Transactions**, **Payments**, **Payouts**, **Top-ups**, **Collected fees**, **Transfers**, **All activity**, **Date and time**, **Amount**, **Status**, **Payment method**, and **More filters** where these controls are implemented.
- Keep the required shortened **Payment ID** column even though the screenshot emphasizes other columns. Keep all six required fields visible in the desktop table; make the table horizontally scrollable on narrow screens.
- Use a headless table approach, preferably TanStack Table, for controlled filtering, sorting, and pagination. Tailwind owns its appearance. Reuse accessible primitives for popovers, menus, and tooltips rather than styling an unrelated component theme.

| Required item  | Planned behavior and acceptance                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Payment ID     | Shorten visually, expose full value accessibly, copy the full ID with feedback and clipboard-failure handling.                                  |
| Customer       | Display email/name with a stable fallback for absent or deleted customers.                                                                      |
| Amount         | Currency-aware `Intl.NumberFormat`; minor-unit conversion respects zero-decimal currencies.                                                     |
| Status         | Exact badges: Succeeded, Pending, Failed, Refunded. Text conveys status in addition to color.                                                   |
| Payment method | Card brand and last four digits for cards; appropriate wallet/ACH label and available last four digits for other methods.                       |
| Created        | Show date and time; show relative time in a hover **and keyboard-focus** tooltip. Use one documented display timezone consistently.             |
| Sorting        | Toggle ascending/descending on date, amount, and status; show direction, `aria-sort`, and a deterministic ID tie-breaker. Default newest first. |
| Pagination     | Page sizes 25, 50, 100; accurate filtered count/range, previous/next boundaries, and page reset after filtering/page-size changes.              |

## 4. Implement filters as one predictable pipeline

Apply **search + all active filters -> stable sorting -> pagination**. Combine different filter families with AND; combine selections within a multi-select with OR. An empty selection means no restriction.

| Required filter | Planned behavior and edge cases                                                                                                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date range      | Today, 7 days, 30 days, Custom. Use calendar-day boundaries in the chosen display timezone, inclusive start and exclusive next-day end. Validate reversed/incomplete custom ranges.                                                             |
| Status          | Multi-select the four required statuses with selected count and clear action.                                                                                                                                                                   |
| Payment method  | Multi-select Card, ACH, Wallet, and Other where present.                                                                                                                                                                                        |
| Amount          | Inclusive min/max input in displayed major units; blank bounds allowed; reject negative/reversed/non-numeric input. Account for each currency's minor-unit precision. Add the reference's Currency filter if useful; no implicit FX conversion. |
| Search          | Case-insensitive substring search on full payment ID and email; literal substring search on last four digits. Trim surrounding whitespace.                                                                                                      |

Sort/filter amounts by nominal numeric value in their displayed currency units, without pretending values in different currencies are economically comparable. Provide a currency restriction alongside the amount filter when narrowing mixed-currency data.

Add removable active-filter chips, Clear all, an empty-results state, and disabled pagination controls when appropriate. Keep filter drafts separate from applied values where a popover has Apply/Cancel.

## 5. Optional polish, in the brief's order

Complete and verify every required item before expanding scope:

1. Sidebar: reference hierarchy, icons, active Transactions/Payments state, Customers, Balances, Product catalog, and account switcher.
2. Top bar: global search appearance and keyboard-accessible account menu. Make implemented controls meaningful; do not imply unrelated payments/account operations work.
3. `/payments/[id]`: a real details route with normalized payment information. For imported data, fetch events separately if a factual Stripe timeline is needed; do not invent event timestamps from the final PaymentIntent. Label synthetic timelines as demo data. Unknown IDs render a proper not-found state.
4. URL-preserved filters/sort/page size with parse validation and browser back/forward support; consider this while designing controlled state to avoid later rewrites.
5. Column resizing and drag reorder, including a keyboard alternative and sensible min widths.
6. CSV export of **all filtered and sorted rows across pages**, with proper escaping and spreadsheet-formula neutralization. Label that scope clearly.

The reference's Create payment, Analyze, other tabs, and unrelated sidebar destinations are outside the required task. Avoid implementing money-moving actions. Keep decorative reference elements distinct from working table interactions.

## 6. File organization

```text
src/app/(dashboard)/payments/page.tsx
src/app/(dashboard)/payments/[id]/page.tsx  # optional phase
src/app/page.tsx                          # redirect or entry to /payments
src/components/dashboard/                # sidebar, top bar, shell
src/features/payments/                    # table, columns, filters, types
src/features/payments/lib/                # query pipeline, formatters, normalization
src/lib/payments-data.ts                  # server-only local JSON loader
data/payments.fixture.json                # committed, synthetic
data/stripe-payments.local.json           # ignored, sandbox import
scripts/import-stripe-payments.mjs        # promote command below into this script
scripts/generate-payments.mjs             # deterministic fixture generation
```

Implemented scripts: `pnpm stripe:import` uses the official Stripe SDK, and `pnpm data:generate` creates the synthetic fixture. The standalone command was skipped as requested.

## 7. Stripe sandbox connection instructions

1. Open the [Stripe Dashboard](https://dashboard.stripe.com/). In the account picker choose **Switch to sandbox > Create sandbox**. Name it `chargeblast-local`, or select an existing dedicated sandbox. Use an isolated sandbox, not the live account.
2. While viewing that sandbox, open **API keys** and copy its secret test key (`sk_test_...`). A restricted test key (`rk_test_...`) is also suitable if granted read access to PaymentIntents and the expanded Customers, Charges, and PaymentMethods resources. A test-key prefix alone cannot identify which sandbox it belongs to: verify the selected sandbox in the Dashboard.
3. Edit the existing ignored `.env.local` file and **append** the following variable. Preserve the Vercel variables already in that file. Keep the actual key local; do not send it through chat or commit it.

   ```dotenv
   STRIPE_SECRET_KEY=sk_test_REPLACE_WITH_YOUR_SANDBOX_KEY
   ```

4. No publishable key, Stripe.js, OAuth connection, webhook listener, or database is needed for this read-only JSON snapshot flow. The key is used by the local Node import command and must never use a `NEXT_PUBLIC_` variable name.
5. If the sandbox is empty, create a few **test** payments in its Dashboard first. Use Stripe's documented test cards (for example `4242 4242 4242 4242` for a successful card payment); add failed/refunded examples only within the sandbox. This is separate from the read-only import and is not performed automatically by the command below. For assignment-scale coverage, use the planned synthetic generator instead of creating hundreds of Stripe payments by hand.
6. The SDK importer can import a snapshot when explicitly invoked. It reads at most 1,000 PaymentIntents, paginates in batches of up to 100, rejects live keys and live objects, omits client secrets, and writes a normalized local JSON file only after the fetch succeeds. Re-running refreshes the snapshot; it never creates payments or refunds.

Sources: [sandbox management](https://docs.stripe.com/sandboxes/dashboard/manage), [API keys](https://docs.stripe.com/keys), [test values](https://docs.stripe.com/testing), [PaymentIntent list API](https://docs.stripe.com/api/payment_intents/list), [expanded responses](https://docs.stripe.com/api/expanding_objects).

### Import implementation

The official `stripe` package is used in a local-only script exposed as `pnpm stripe:import`. The standalone fetch command was removed per the updated scope. Sandbox configuration was left untouched. The importer was not executed; align the integration separately.

## 8. Verification and delivery

- **Unit tests:** all Stripe status mappings, missing/deleted customers, absent charges, partial refunds, wallets, integer currency formatting (including JPY), inclusive date boundaries/timezone behavior, combined filters, sorting ties, and page reset/clamping.
- **Component/integration tests:** copying the full ID and error feedback; tooltip keyboard access; applied versus draft filter values; clearing filters; keyboard interactions; 25/50/100 sizes; zero results; first/last page. Tests use local fixtures and mocked API responses, never Stripe keys in CI.
- **Import tests once implemented:** reject live/missing keys and live objects, follow pagination, cap results, avoid secrets in the JSON, and preserve an existing file on API failures. CI uses synthetic data only.
- **Visual QA:** compare screenshots at the reference aspect ratio; inspect desktop and narrow widths, row density, fonts, icons, chips, badges, truncation, popovers, and hover/focus/selected states. Use the Orca browser workflow during implementation. Run React Doctor after React changes.
- **Checks:** pnpm frozen install, lint, format check, typecheck, unit tests, production build, and all GitHub Actions jobs pass.
- **Deploy:** update the existing `chargeblast-challenge-starter` project through the authorized Vercel CLI workflow after implementation. Deploy synthetic data without a Stripe runtime key. Verify the production route works in a signed-out browser: the brief requires a **public URL**, so inspect current Vercel authentication protection and remove production access restrictions as needed for submission.
- **Submission checklist:** share GitHub and public app links before the deadline. If GitHub remains private, the brief requests access for `arthurrios-chargeblast` and `BrunoMestanzaChargeblast`. The brief also requests an acknowledgement email and a final reply to the original email; record these as user submission actions, without sending email or changing collaborators during planning.

## Suggested execution sequence

1. pnpm migration and green CI baseline.
2. Typed model, synthetic dataset, sandbox importer, loader, and query/formatting tests.
3. Reference measurements, dashboard shell, table, and every required interaction/filter.
4. Visual comparison and accessibility pass; fix required-spec gaps first.
5. Optional features in the brief's order while time allows.
6. Final checks, public Vercel deployment, and submission links.

Implementation defaults are 500 synthetic rows, 25 rows initially, newest-first sorting, light reference styling, and one documented display timezone (`America/Sao_Paulo`) for dates and presets.
