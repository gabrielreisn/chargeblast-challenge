// Server Component: static markup. Only `CopyId` (a client component) is interactive.
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Clock3, ExternalLink } from "lucide-react";
import { CopyId, PaymentMethodCell, StatusBadge } from "./ui";
import { formatAmount, formatDate, TIME_ZONE } from "./format";
import { snapshotSourceLabels, type Payment, type SnapshotSource } from "./model";

const sectionStyles = "border-t border-line pt-5.5 pb-6.5";
const sectionTitleStyles = "mb-5.5 text-15 font-semibold tracking-[-0.2px]";
const definitionListStyles =
  "grid grid-cols-[110px_minmax(0,1fr)] gap-4 text-11 md:grid-cols-[155px_minmax(0,1fr)] md:gap-4.5 md:text-12 [&_dt]:text-[#8490a0]";
const noteStyles = "mb-5.5 text-11 leading-4.5 text-[#9099a8]";

type TimelineItemProps = { icon: ReactNode; title: string; detail: string };

function TimelineItem({ icon, title, detail }: TimelineItemProps) {
  return (
    <div className="mb-6 flex gap-3.75 text-12">
      <span className="grid size-7 shrink-0 place-items-center rounded-full border border-[#e4e8ee] bg-[#faf9fe] text-[#7d77c5]">
        {icon}
      </span>
      <div>
        <strong className="font-medium">{title}</strong>
        <p className="mt-1.5 text-11 text-[#9099a8]">{detail}</p>
      </div>
    </div>
  );
}

type PaymentDetailsProps = { payment: Payment; source: SnapshotSource };

const activityNotes: Record<SnapshotSource, string> = {
  synthetic:
    "Illustrative demo timeline. Only the creation timestamp is represented by the sample data.",
  "stripe-api":
    "Current state from Stripe. Fetch Stripe Events separately for a complete event timeline.",
};

export function PaymentDetails({ payment: p, source }: PaymentDetailsProps) {
  const amount = formatAmount(p.amount, p.currency);
  const currency = p.currency.toUpperCase();
  return (
    <div className="mx-auto mt-3.75 mb-10 max-w-300">
      <Link className="mb-7 inline-flex items-center gap-1.5 text-12 text-brand" href="/payments">
        <ArrowLeft size={14} aria-hidden="true" />
        Payments
      </Link>
      <div className="mb-9 flex flex-col items-start gap-3.75 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2.25 text-10 font-semibold tracking-[0.8px] text-[#8b94a4]">
            PAYMENT
          </div>
          <h1 className="mb-2.5 text-32 font-semibold tracking-[-0.7px] text-[#323b4e]">
            {amount} <span className="text-24 font-normal text-[#969eac]">{currency}</span>
          </h1>
          <StatusBadge status={p.status} />
        </div>
        <CopyId id={p.id} />
      </div>
      <div className="grid grid-cols-1 gap-3.75 md:grid-cols-[minmax(0,1fr)_280px] md:gap-12.5">
        <div>
          <section className={sectionStyles}>
            <h2 className={sectionTitleStyles}>Payment details</h2>
            <dl className={definitionListStyles}>
              <dt>Payment ID</dt>
              <dd className="font-mono text-11 break-all">{p.id}</dd>
              <dt>Amount</dt>
              <dd>
                {amount} {currency}
              </dd>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={p.status} />
              </dd>
              <dt>Created</dt>
              <dd>
                {formatDate(p.created)} <span className="text-muted">({TIME_ZONE})</span>
              </dd>
              <dt>Description</dt>
              <dd>{p.description ?? "No description"}</dd>
              <dt>Payment method</dt>
              <dd>
                <PaymentMethodCell payment={p} />
              </dd>
              {p.amountRefunded > 0 && (
                <>
                  <dt>Amount refunded</dt>
                  <dd>{formatAmount(p.amountRefunded, p.currency)}</dd>
                </>
              )}
            </dl>
          </section>
          <section className={sectionStyles}>
            <h2 className={sectionTitleStyles}>Activity</h2>
            <p className={noteStyles}>{activityNotes[source]}</p>
            <TimelineItem
              icon={<Check size={14} />}
              title={`Current status: ${p.status}`}
              detail={`Source status: ${p.sourceStatus}`}
            />
            <TimelineItem
              icon={<Clock3 size={14} />}
              title="Payment created"
              detail={formatDate(p.created)}
            />
          </section>
          <section className={sectionStyles}>
            <h2 className={sectionTitleStyles}>Metadata</h2>
            <dl className={definitionListStyles}>
              <dt>Data source</dt>
              <dd>{snapshotSourceLabels[source]}</dd>
              <dt>Mode</dt>
              <dd>Sandbox</dd>
            </dl>
            <p className="mt-5.5 text-11 leading-4.5 text-[#9099a8]">
              Custom Stripe metadata is not included in this local snapshot.
            </p>
          </section>
        </div>
        <aside>
          <section className={sectionStyles}>
            <h2 className={sectionTitleStyles}>Customer</h2>
            <span className="mb-3 grid size-8.75 place-items-center rounded-full bg-[#e7e1ff] text-15 text-[#7966bb]">
              {(p.customer.name ?? "G").slice(0, 1)}
            </span>
            <h3 className="mb-2 text-13 font-semibold">{p.customer.name ?? "Guest customer"}</h3>
            <p className="text-12 break-all text-[#7c8799]">
              {p.customer.email ?? "No email provided"}
            </p>
            <div className="mt-4 font-mono text-10 text-[#949dac]">
              {p.customer.id ?? "No customer attached"}
            </div>
          </section>
          <div className="rounded-[5px] bg-sidebar p-3.75 text-11 text-[#8992a1]">
            Need more information?
            <a
              className="mt-2.25 flex items-center gap-2 text-brand"
              href="https://docs.stripe.com/payments/payment-intents"
              target="_blank"
              rel="noreferrer"
            >
              Learn about payments <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
