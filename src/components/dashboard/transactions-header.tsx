"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { ChartNoAxesCombined, Plus, Settings, Share } from "lucide-react";
import { ReadOnlyButton } from "./read-only-button";
import { ActiveTabIndicator } from "./route-transitions";

const transactionTabs = [
  { segment: "payments", label: "Payments" },
  { segment: "payouts", label: "Payouts" },
  { segment: "topups", label: "Top-ups" },
  { segment: "standalone-3ds", label: "Standalone 3DS" },
  { segment: "activity", label: "All activity" },
] as const;

type TransactionSegment = (typeof transactionTabs)[number]["segment"];

const headingActions: Record<TransactionSegment, ReactNode> = {
  payments: (
    <>
      <ReadOnlyButton primary>
        <Plus size={13} aria-hidden="true" />
        Create payment
      </ReadOnlyButton>
      <ReadOnlyButton hint="Use the filters below to explore payments">
        <ChartNoAxesCombined size={13} aria-hidden="true" />
        Analyze
      </ReadOnlyButton>
    </>
  ),
  payouts: (
    <>
      <ReadOnlyButton iconOnly label="Export payouts">
        <Share size={13} aria-hidden="true" />
      </ReadOnlyButton>
      <ReadOnlyButton iconOnly label="Analyze payouts">
        <ChartNoAxesCombined size={13} aria-hidden="true" />
      </ReadOnlyButton>
      <ReadOnlyButton iconOnly label="Payout settings">
        <Settings size={13} aria-hidden="true" />
      </ReadOnlyButton>
      <ReadOnlyButton>
        <Plus size={13} aria-hidden="true" />
        New payout
        <kbd className="ml-1 font-sans text-10 font-medium text-faint" aria-hidden="true">
          N
        </kbd>
      </ReadOnlyButton>
    </>
  ),
  topups: (
    <ReadOnlyButton>
      <Plus size={13} aria-hidden="true" />
      Add to balance
    </ReadOnlyButton>
  ),
  "standalone-3ds": null,
  activity: (
    <ReadOnlyButton iconOnly label="Export activity">
      <Share size={13} aria-hidden="true" />
    </ReadOnlyButton>
  ),
};

/** "Transactions" title, per-tab actions and the tab bar shared by every transactions route. */
export function TransactionsHeader() {
  const active = (useSelectedLayoutSegment() ?? "payments") as TransactionSegment;
  return (
    <>
      <div className="mt-2.5 mb-4 flex items-center justify-between gap-2.5">
        <h1 className="text-22 leading-7.5 font-[650] tracking-[-0.6px] text-[#303645] md:text-24">
          Transactions
        </h1>
        <div className="flex flex-wrap justify-end gap-2">{headingActions[active]}</div>
      </div>
      <nav
        className="flex h-8.25 items-start gap-5 overflow-x-auto border-b border-line text-10 font-medium whitespace-nowrap md:gap-6.25 md:text-11"
        aria-label="Transaction type"
      >
        {transactionTabs.map((tab) => (
          <Link
            key={tab.segment}
            href={`/${tab.segment}`}
            data-label={tab.label}
            // The invisible semibold copy (::after) reserves the bold width, so the active
            // label's weight change can't shift the tabs that follow it. It's hidden from
            // assistive tech by the empty alt text after the slash.
            className="relative inline-flex flex-col pb-3.75 text-subtle after:invisible after:h-0 after:overflow-hidden after:font-semibold after:content-[attr(data-label)_/_''] hover:text-ink-strong aria-[current=page]:font-semibold aria-[current=page]:text-ink-strong"
            aria-current={tab.segment === active ? "page" : undefined}
          >
            {tab.label}
            {tab.segment === active && <ActiveTabIndicator />}
          </Link>
        ))}
      </nav>
    </>
  );
}
