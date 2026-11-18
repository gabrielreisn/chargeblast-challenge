// Server Component: static markup with small client islands (CopyId, TimeConversion, read-only actions).
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Ellipsis, ExternalLink, Undo2 } from "lucide-react";
import { ReadOnlyButton } from "@/components/dashboard/read-only-button";
import { cn } from "@/components/ui/styles";
import { formattersFor, type FormatSettings, type Formatters } from "./format";
import { FormattersProvider } from "./format-context";
import {
  paymentEventLabels,
  snapshotSourceLabels,
  walletLabels,
  type Payment,
  type RiskLevel,
  type SnapshotSource,
} from "./model";
import { TimeConversion } from "./time-conversion";
import { TimeZoneSync } from "./time-zone-sync";
import { CopyId, PaymentMethodCell, StatusBadge } from "./ui";

const sectionStyles = "border-t border-line pt-5.5 pb-7";
const sectionTitleStyles = "text-15 font-semibold tracking-[-0.2px] text-ink-strong";
const noteStyles = "mt-3 text-11 leading-4.5 text-faint";
/** Two-column definition list for the payment method's details. */
const detailListStyles =
  "grid grid-cols-[130px_minmax(0,1fr)] gap-x-4 gap-y-2.5 py-3 pl-6 text-12 md:grid-cols-[200px_minmax(0,1fr)] [&_dt]:font-medium [&_dt]:text-ink-strong";
/** Stacked label/value pairs for the side column. */
const sideListStyles =
  "flex flex-col gap-4 text-12 [&_dd]:mt-1 [&_dd]:text-subtle [&_dt]:font-semibold [&_dt]:text-ink-strong";

const brandLabels: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
};

const checkBadges: Record<string, { label: string; styles: string }> = {
  pass: { label: "Passed", styles: "border-success-line bg-success-bg text-success" },
  fail: { label: "Failed", styles: "border-danger-line bg-danger-bg text-danger" },
  unavailable: { label: "Unavailable", styles: "border-line bg-field text-subtle" },
  unchecked: { label: "Not checked", styles: "border-line bg-field text-subtle" },
};

const riskBadges: Record<RiskLevel, { label: string; styles: string }> = {
  normal: { label: "Normal", styles: "border-success-line bg-success-bg text-success" },
  elevated: { label: "Elevated", styles: "border-warning-line bg-warning-bg text-warning" },
  highest: { label: "Highest", styles: "border-danger-line bg-danger-bg text-danger" },
};

const activityNotes: Record<SnapshotSource, string> = {
  synthetic: "Demo timeline generated with the synthetic fixture.",
  "stripe-api":
    "Built from the timestamps Stripe records on the payment and its latest charge. Fetch Stripe Events for a complete history.",
};

type PillProps = { styles: string; children: ReactNode };

function Pill({ styles, children }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-[3px] border px-1.25 align-middle text-10 leading-4 font-medium",
        styles,
      )}
    >
      {children}
    </span>
  );
}

/** Regional-indicator emoji for an ISO country code ("US" → 🇺🇸). */
function flag(country: string) {
  return String.fromCodePoint(...Array.from(country, (letter) => 127397 + letter.charCodeAt(0)));
}

type SectionProps = { payment: Payment; format: Formatters };
type PaymentOnlyProps = { payment: Payment };
type SourcedSectionProps = { payment: Payment; source: SnapshotSource };

function RecentActivity({ payment: p, source }: SourcedSectionProps) {
  const newestFirst = p.events.toReversed();
  return (
    <section className="pb-7">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={sectionTitleStyles}>Recent activity</h2>
        <ReadOnlyButton hint="Notes aren’t saved in this read-only demo">Add note</ReadOnlyButton>
      </div>
      <ol className="relative before:absolute before:top-4 before:bottom-4 before:left-1.25 before:w-px before:bg-line-strong">
        {newestFirst.map((event) => (
          <li
            key={`${event.type}-${event.created}`}
            className="group/event relative flex items-center justify-between gap-4 border-b border-line-soft py-2.5 pl-6 text-12 last:border-b-0"
          >
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-0 size-2.75 -translate-y-1/2 rounded-full border-2 border-line-strong bg-white group-first/event:border-brand group-first/event:bg-brand group-first/event:ring-3 group-first/event:ring-brand-soft"
            />
            <span className="font-medium text-ink-strong group-first/event:font-semibold">
              {paymentEventLabels[event.type]}
            </span>
            <span className="shrink-0 text-11 text-subtle">
              <TimeConversion timestamp={event.created} />
            </span>
          </li>
        ))}
      </ol>
      {p.failureMessage && (
        <p className="mt-3 rounded-[5px] border border-danger-line bg-danger-soft px-3 py-2 text-12 text-danger-strong">
          <strong className="font-semibold">Decline reason:</strong> {p.failureMessage}
        </p>
      )}
      <p className={noteStyles}>{activityNotes[source]}</p>
    </section>
  );
}

type BreakdownRowProps = { label: ReactNode; value: string; total?: boolean };

function BreakdownRow({ label, value, total = false }: BreakdownRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-2 text-12",
        total && "mt-1 border-t border-line pt-3 text-13 font-semibold text-ink-strong",
      )}
    >
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function PaymentBreakdown({ payment: p, format }: SectionProps) {
  const currency = p.currency.toUpperCase();
  const money = (amount: number) => `${format.formatAmount(amount, p.currency)} ${currency}`;
  const net = p.amount - (p.fee ?? 0) - p.amountRefunded;
  return (
    <section className={sectionStyles}>
      <h2 className={cn(sectionTitleStyles, "mb-2")}>Payment breakdown</h2>
      <dl>
        <BreakdownRow label="Payment amount" value={money(p.amount)} />
        {p.fee !== null && (
          <BreakdownRow
            label={
              <>
                Stripe processing fees{" "}
                <a
                  className="ml-1 text-subtle underline underline-offset-2 hover:text-ink"
                  href="https://stripe.com/pricing"
                  target="_blank"
                  rel="noreferrer"
                >
                  Learn more
                </a>
              </>
            }
            value={`- ${money(p.fee)}`}
          />
        )}
        {p.amountRefunded > 0 && (
          <BreakdownRow label="Refunded" value={`- ${money(p.amountRefunded)}`} />
        )}
        {p.fee !== null && (
          <BreakdownRow
            label="Net amount"
            // A full refund keeps the fee, so the net can be negative; sign it like the rows above.
            value={net < 0 ? `- ${money(-net)}` : money(net)}
            total
          />
        )}
      </dl>
      {p.fee === null && (
        <p className={noteStyles}>No funds were captured, so there are no fees or net amount.</p>
      )}
    </section>
  );
}

function PaymentMethod({ payment: p, format }: SectionProps) {
  const card = p.card;
  const owner = p.customer.email ?? p.customer.name ?? "—";
  return (
    <section className={sectionStyles}>
      <h2 className={cn(sectionTitleStyles, "mb-2")}>Payment method</h2>
      <details open className="group/method border-b border-line">
        <summary className="flex cursor-pointer list-none items-center gap-2 py-2.5 text-12 [&::-webkit-details-marker]:hidden">
          <ChevronDown
            size={14}
            className="-rotate-90 text-muted group-open/method:rotate-0 motion-safe:transition-transform"
            aria-hidden="true"
          />
          <PaymentMethodCell payment={p} />
          {card?.expMonth && card.expYear && (
            <span className="ml-auto text-11 text-subtle">
              Expires {format.formatExpiry(card.expMonth, card.expYear)}
            </span>
          )}
        </summary>
        <dl className={detailListStyles}>
          {card ? (
            <>
              <dt>Type</dt>
              <dd>
                {[brandLabels[p.brand ?? ""] ?? "Card", card.funding, "card"]
                  .filter(Boolean)
                  .join(" ")}
              </dd>
              {p.wallet && (
                <>
                  <dt>Wallet</dt>
                  <dd>{walletLabels[p.wallet] ?? p.wallet}</dd>
                </>
              )}
              <dt>Number</dt>
              <dd className="tabular-nums">•••• {p.last4 ?? "—"}</dd>
              <dt>Fingerprint</dt>
              <dd className="font-mono text-11 text-brand">{card.fingerprint ?? "—"}</dd>
              <dt>Expires</dt>
              <dd className="tabular-nums">
                {card.expMonth && card.expYear
                  ? `${String(card.expMonth).padStart(2, "0")} / ${card.expYear}`
                  : "—"}
              </dd>
              <dt>Issuer</dt>
              <dd>{card.issuer ?? "—"}</dd>
              <dt>Origin</dt>
              <dd>
                {card.country ? (
                  <>
                    {format.regionName(card.country)}{" "}
                    <span aria-hidden="true">{flag(card.country)}</span>
                  </>
                ) : (
                  "—"
                )}
              </dd>
              <dt>CVC check</dt>
              <dd>
                {card.cvcCheck ? (
                  <Pill styles={checkBadges[card.cvcCheck].styles}>
                    {checkBadges[card.cvcCheck].label}
                  </Pill>
                ) : (
                  "—"
                )}
              </dd>
            </>
          ) : (
            <>
              <dt>Type</dt>
              <dd>{p.method === "ach" ? "US bank account" : (p.methodType ?? "Other")}</dd>
              {p.bankName && (
                <>
                  <dt>Bank</dt>
                  <dd>{p.bankName}</dd>
                </>
              )}
              <dt>Number</dt>
              <dd className="tabular-nums">•••• {p.last4 ?? "—"}</dd>
            </>
          )}
          <dt>Owner</dt>
          <dd className="break-all">{owner}</dd>
        </dl>
      </details>
    </section>
  );
}

function RiskAnalysis({ payment: p }: PaymentOnlyProps) {
  return (
    <section className={sectionStyles}>
      <h2 className={cn(sectionTitleStyles, "mb-3")}>Risk analysis</h2>
      {p.riskLevel && p.riskScore !== null ? (
        <dl className="grid max-w-110 grid-cols-[130px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 text-12 [&_dt]:font-medium [&_dt]:text-ink-strong">
          <dt>Risk evaluation</dt>
          <dd>
            <Pill styles={riskBadges[p.riskLevel].styles}>{riskBadges[p.riskLevel].label}</Pill>
          </dd>
          <dt>Risk score</dt>
          <dd className="flex items-center gap-3">
            <span className="w-6 tabular-nums">{p.riskScore}</span>
            {/* Radar scores run 0–99; 65+ is elevated and 75+ the highest risk. */}
            <meter
              className="h-2 w-full"
              min={0}
              max={99}
              low={65}
              high={75}
              optimum={0}
              value={p.riskScore}
              aria-label="Risk score"
            />
          </dd>
        </dl>
      ) : (
        <p className="text-12 text-subtle">
          Radar didn’t evaluate this payment. It scores card charges that reach the bank.
        </p>
      )}
    </section>
  );
}

function DetailsAside({ payment: p, format }: SectionProps) {
  const lastUpdated = p.events.at(-1)?.created ?? p.created;
  return (
    <section>
      <h2 className={cn(sectionTitleStyles, "mb-4")}>Details</h2>
      <dl className={sideListStyles}>
        <div>
          <dt>Payment ID</dt>
          <dd>
            <CopyId id={p.id} />
          </dd>
        </div>
        <div>
          <dt>Payment method</dt>
          <dd>
            <PaymentMethodCell payment={p} />
          </dd>
        </div>
        <div>
          <dt>Description</dt>
          <dd>{p.description ?? "—"}</dd>
        </div>
        <div>
          <dt>Statement descriptor</dt>
          <dd>{p.statementDescriptor ?? "—"}</dd>
        </div>
        {p.availableOn !== null && (
          <div>
            <dt>Funds available</dt>
            <dd>
              <TimeConversion timestamp={p.availableOn} />
            </dd>
          </div>
        )}
        {p.refundedAt !== null && (
          <div>
            <dt>Refunded</dt>
            <dd>
              {format.formatAmount(p.amountRefunded, p.currency)} {p.currency.toUpperCase()} on{" "}
              <TimeConversion timestamp={p.refundedAt} />
            </dd>
          </div>
        )}
        <div>
          <dt>Last updated</dt>
          <dd>
            <TimeConversion timestamp={lastUpdated} />
          </dd>
        </div>
      </dl>
    </section>
  );
}

function CustomerAside({ payment: p }: PaymentOnlyProps) {
  return (
    <section className={sectionStyles}>
      <h2 className={cn(sectionTitleStyles, "mb-4")}>Customer</h2>
      <div className="flex items-center gap-3">
        <span className="grid size-8.75 shrink-0 place-items-center rounded-full bg-[#e7e1ff] text-15 text-[#7966bb]">
          {(p.customer.name ?? "G").slice(0, 1)}
        </span>
        <div className="min-w-0">
          <h3 className="text-13 font-semibold">{p.customer.name ?? "Guest customer"}</h3>
          <p className="text-12 break-all text-subtle">{p.customer.email ?? "No email provided"}</p>
        </div>
      </div>
      <p className="mt-3 font-mono text-10 text-ghost">{p.customer.id ?? "No customer attached"}</p>
    </section>
  );
}

function MetadataAside({ payment: p, source }: SourcedSectionProps) {
  const entries = Object.entries(p.metadata);
  return (
    <section className={sectionStyles}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className={sectionTitleStyles}>Metadata</h2>
      </div>
      {entries.length ? (
        <dl className={sideListStyles}>
          {entries.map(([key, value]) => (
            <div key={key}>
              <dt className="font-mono text-11">{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="rounded-[7px] border border-dashed border-line-strong py-6 text-center text-12 text-subtle">
          No metadata
        </p>
      )}
      <p className={noteStyles}>Source: {snapshotSourceLabels[source]} · Sandbox</p>
      <a
        className="mt-3 inline-flex items-center gap-1.5 text-11 text-brand hover:text-brand-hover"
        href="https://docs.stripe.com/payments/payment-intents"
        target="_blank"
        rel="noreferrer"
      >
        Learn about payments <ExternalLink size={11} aria-hidden="true" />
      </a>
    </section>
  );
}

type PaymentDetailsProps = {
  payment: Payment;
  source: SnapshotSource;
  formatSettings: FormatSettings;
};

export function PaymentDetails({ payment: p, source, formatSettings }: PaymentDetailsProps) {
  const format = formattersFor(formatSettings);
  return (
    <FormattersProvider settings={formatSettings}>
      <TimeZoneSync renderedTimeZone={format.timeZone} />
      <div className="mx-auto mt-3.75 mb-10 max-w-300">
        <Link className="text-12 font-medium text-brand hover:text-brand-hover" href="/payments">
          Transactions
        </Link>
        <div className="mt-1 mb-7 flex flex-wrap items-center justify-between gap-3.75">
          <h1 className="flex flex-wrap items-center gap-2.5 text-24 font-semibold tracking-[-0.5px] text-ink-strong">
            <span>
              {format.formatAmount(p.amount, p.currency)}{" "}
              <span className="font-normal text-faint">{p.currency.toUpperCase()}</span>
            </span>
            <StatusBadge status={p.status} />
          </h1>
          <div className="flex gap-2">
            <ReadOnlyButton>
              <Undo2 size={13} aria-hidden="true" />
              Refund
            </ReadOnlyButton>
            <ReadOnlyButton iconOnly label="More actions">
              <Ellipsis size={14} aria-hidden="true" />
            </ReadOnlyButton>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_260px] md:gap-12.5">
          <div>
            <RecentActivity payment={p} source={source} />
            <PaymentBreakdown payment={p} format={format} />
            <PaymentMethod payment={p} format={format} />
            <RiskAnalysis payment={p} />
          </div>
          <aside>
            <DetailsAside payment={p} format={format} />
            <CustomerAside payment={p} />
            <MetadataAside payment={p} source={source} />
          </aside>
        </div>
      </div>
    </FormattersProvider>
  );
}
