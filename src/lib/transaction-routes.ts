/**
 * The Transactions tabs, which are also the site's public pages: the tab bar, each page's
 * title and description, and the sitemap all read this list.
 */
export const transactionRoutes = [
  {
    segment: "payments",
    label: "Payments",
    description: "Search, filter and sort sandbox payments by status, method, amount and date.",
  },
  {
    segment: "payouts",
    label: "Payouts",
    description: "Track test payouts and when they’re expected to arrive in your bank account.",
  },
  {
    segment: "topups",
    label: "Top-ups",
    description: "Review funds added to your balance from your bank account.",
  },
  {
    segment: "standalone-3ds",
    label: "Standalone 3DS",
    description: "Review 3D Secure authentications run outside of a payment.",
  },
  {
    segment: "activity",
    label: "All activity",
    description: "Every balance transaction: charges, refunds, payouts and fees.",
  },
] as const;

export type TransactionSegment = (typeof transactionRoutes)[number]["segment"];
