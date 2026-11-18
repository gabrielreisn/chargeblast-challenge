@AGENTS.md

# Project rules

Stripe-style payments dashboard: Next.js 16 App Router, React 19, TypeScript 7, Tailwind CSS 4, Radix primitives, TanStack Table, Vitest. Package manager is pnpm.

Before finishing any change, run and pass: `pnpm lint`, `pnpm format:check` (fix with `pnpm format`), `pnpm typecheck`, `pnpm test:coverage`, `pnpm knip`, `pnpm build`. CI also runs `pnpm audit --audit-level high`, dependency review on PRs, and a gitleaks secret scan.

- A lefthook pre-commit hook (`lefthook.yml`, installed by the `prepare` script) runs a gitleaks secret scan of the staged diff (requires `gitleaks`: `brew install gitleaks`), then `oxlint --fix` and `oxfmt` on staged files, restaging the fixes. Never bypass it with `--no-verify` or `LEFTHOOK=0`; fix the reported problem instead. Add new hooks as `jobs` in `lefthook.yml`.
- Lint uses the oxlint `correctness` and `suspicious` categories plus the React hooks rules (`.oxlintrc.json`). Fix findings rather than disabling rules inline; prefer non-mutating APIs such as `toSorted()`.
- `pnpm knip` must stay clean: don't export what nothing imports, and delete unused files and dependencies.
- Supply chain (`pnpm-workspace.yaml`): dependency install scripts are denied by default (`allowBuilds`); `minimumReleaseAge` blocks versions published less than a day ago, and pnpm verifies the lockfile against it on install; `auditConfig.ignoreGhsas` holds reviewed audit exceptions, each with a comment explaining why it's safe and when to remove it.
- GitHub Actions are pinned to full commit SHAs with the version in a trailing comment; Dependabot updates them. Shared setup lives in `.github/actions/setup`.
- Coverage thresholds in `vitest.config.mts` are a ratchet enforced in CI. New code ships with tests; raise the thresholds when coverage improves and never lower them. Next.js route entry files in `src/app/` are excluded; keep logic out of them so it stays covered.

## Styling: Tailwind only

- Style with Tailwind utility classes in JSX. Do not add CSS classes, CSS modules, inline `style` for static design, or new rules to `globals.css`.
- Tailwind runs through the standard `@tailwindcss/postcss` plugin (`postcss.config.mjs`); don't add a custom Turbopack CSS loader.
- `src/app/globals.css` holds only `@import "tailwindcss"`, the `@theme` design tokens, and a minimal `@layer base`. When a value repeats, add a token to `@theme` (colors, font sizes, shadows, animations, breakpoints) instead of a class.
- Font sizes are tokens named by pixel value: `text-10` = 10px. Breakpoints are `md` 700px, `lg` 1100px, `2xl` 1600px.
- Repeated recipes live in `src/components/ui/styles.ts` (`buttonStyles()`, `menuStyles`, `fieldStyles`, …) and are combined with `cn()`. `cn` only joins strings, so never pass two classes that set the same property (for example `my-1.5` with `mb-0`); write the full class list instead.
- Use state variants instead of conditional class logic where the DOM already carries the state: `aria-pressed:`, `aria-[current=page]:`, `aria-disabled:`, `data-highlighted:`, `group-hover/name:`.
- Allowed exceptions: inline `style` for runtime values (TanStack column widths) and in `opengraph-image.tsx` (Satori supports inline styles only).
- View transitions are the one CSS exception: their `::view-transition-*` pseudo-elements can't take utility classes, so their animations live in the "View transitions" section of `globals.css`. Use the wrappers in `src/components/dashboard/route-transitions.tsx` (`PageTransition`, `TabContentTransition`, `ActiveTabIndicator`) instead of adding new `<ViewTransition>` usages ad hoc, and keep `default="none"` so filter/sort updates never animate.

## Metadata and SEO

- All metadata comes from `src/lib/seo.ts`. Pages export `metadata = routeMetadata("<segment>")` or `privateMetadata("<title>")`; never hand-write a `Metadata` object in a route file.
- The public pages are the Transactions tabs in `transactionRoutes` (`src/lib/transaction-routes.ts`). That list drives the tab bar, each page's title and description, and `sitemap.xml`, so a new tab is one entry there. Record-detail and error pages use `privateMetadata` (noindex, no canonical) and stay out of the sitemap.
- Don't add per-route URLs, Open Graph or Twitter fields. `rootMetadata` resolves canonical and `og:url` from each page's pathname (`"./"`), Next copies the page title and description into the social tags, and `app/opengraph-image.tsx` supplies the image.
- `app/robots.ts`, `app/sitemap.ts` and `app/manifest.ts` only re-export helpers from `seo.ts`. The site origin comes from `NEXT_PUBLIC_SITE_URL`, then Vercel's production URL.
- Next merges metadata shallowly: a page that sets `openGraph` or `twitter` replaces the shared defaults, so spread them if one ever must.

## TypeScript

- Always extract props and options into a named type declared above the component or function. Never type parameters inline:

  ```tsx
  type ActiveFiltersProps = { query: PaymentQuery; update: UpdateQuery };

  export function ActiveFilters({ query, update }: ActiveFiltersProps) {}
  ```

- Name types `<Component>Props` for components and `<Thing>Options` for option bags. Export shared callback types (`UpdateQuery`, `MoveColumn`) from the module that owns them.
- No `any`. Narrow `unknown` (for example a thrown `error`) before reading properties.

## React

- Effects use named function expressions so stack traces and DevTools show intent:

  ```tsx
  useEffect(function focusSearchOnSlash() {
    // …
  }, []);
  ```

- Avoid `useState`; derive values during render instead. Before adding state, check whether the value can come from props, the URL (`useSearchParams`), another piece of state, an uncontrolled input read via `FormData`, or a Radix primitive that already manages open/closed state.
- Reset state by changing a component's `key` or keying state to its source (see the row selection in `payments-screen.tsx`). Do not use an effect to sync or reset state.
- Use `useState` only for genuine user input with no other source of truth (dismissing a banner, copy feedback, table column layout, last-submit validation errors). Add a one-line comment explaining why the state is needed.
- Filters, sorting and pagination live in the URL; update them through `paymentsHref()`.
- Column reordering goes through `reorderColumns()` in `table-features.ts` (used by drag-and-drop in `column-dnd.tsx` and the Edit columns menu). Selection and actions columns are pinned via `fixedColumnIds`.

## Data sources

- `getPaymentsData()` in `src/lib/payments-data.ts` is the only way pages read payments. It switches on the `PAYMENTS_SOURCE` env var (`local` | `remote`, read through `parsePaymentsSource`); there is deliberately no CLI wrapper around `next`. Never import the fixture or the Stripe SDK from pages or components.
- There are exactly two sources: the committed fixture (`data/payments.fixture.json`, regenerated by `pnpm data:generate`) and the live Stripe sandbox. Don't add snapshot or import paths.
- `remote` uses `src/features/payments/stripe-source.ts`: sandbox keys only, live objects rejected, server-side only, cached with `"use cache"` + `cacheLife("minutes")`. Never pass the secret key as a cached function argument or expose it through a `NEXT_PUBLIC_` variable.
- `scripts/generate-payments.ts` runs directly in Node, so it and what it imports (`model.ts`) use relative imports with `.ts` extensions and no `@/` alias. Keep `model.ts` free of app imports. The generator must stay deterministic: verify a regeneration with the fixture's `importedAt` produces an identical file.

## Locale and time zone

- Never hardcode a locale or time zone, and never call `toLocaleString()` without one. Pages read `getFormatSettings()` (`src/lib/format-settings.ts`: `Accept-Language`, then the `tz` cookie, Vercel's `x-vercel-ip-timezone` or Cloudflare's `cf-timezone`) and pass the settings down. Client components use `useFormatters()`; server components call `formattersFor(settings)`.
- `TimeZoneSync` stores the browser's time zone in the `tz` cookie and refreshes once when the server rendered in another zone. Render it on every page that shows dates.
- Filtering, sorting and CSV stay locale-independent: `majorAmount()`, ISO dates and raw codes.

## Feedback and errors

- Rendering and data-loading failures are handled by route boundaries: `app/(dashboard)/(transactions)/error.tsx` (tabs stay usable), `app/(dashboard)/error.tsx`, and `app/global-error.tsx`. They render `ErrorState` and receive `{ error, retry }`.
- Failures from user actions (copy, export, future requests) show a sonner toast (`toast.error` with a plain-language description); never surface raw server messages. A request helper (`requestJson`/`toastRequestError`) existed before but was removed while unused; restore it from git history (commit `fd0268c`) when the first client-side request is added.
- Use `EmptyState` for empty and placeholder views, and `LoadingState` for Suspense fallbacks.

## Structure

- `src/app/(dashboard)/layout.tsx` renders the shell (sidebar, top bar, providers) once. `(transactions)/layout.tsx` adds the Transactions header and tabs; tab metadata lives in `transactionRoutes` in `src/lib/transaction-routes.ts`.
- Feature code lives in `src/features/<feature>/`, shared UI in `src/components/`, and server-only data access in `src/lib/`. `components/` never imports from `features/`; generic primitives (`Hint`, `FilterPopover`, style recipes) live in `src/components/ui/`.
- Payments logic is split by concern: `url-state.ts` (parse/serialize the URL query, `paymentsHref`), `format.ts` (amounts, dates, relative time, bound to the viewer's locale and time zone via `formattersFor()`), `query-payments.ts` (filtering and sorting), `csv.ts` (export). Screen pieces are small components (`status-tabs.tsx`, `table-toolbar.tsx`, `data-note.tsx`) composed by `payments-screen.tsx`.
- Prefer Server Components; put `"use client"` on the smallest interactive piece (for example `payment-details.tsx` is a Server Component that renders the client `CopyId`).
- Tests sit next to the code as `*.test.ts(x)`; shared payment test data comes from `src/test/payments.ts` (`buildPayment`, `testNow`). Mock `next/navigation` with `vi.mock("next/navigation", () => import("@/test/next-navigation"))`, which re-renders on history changes like the App Router does.
- This is a read-only demo: never add actions that move money. Reference-only controls use `ReadOnlyButton`.
