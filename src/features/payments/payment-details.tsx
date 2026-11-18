"use client";
import Link from "next/link";
import * as Tooltip from "@radix-ui/react-tooltip";
import { ArrowLeft, Check, Clock3, ExternalLink } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { CopyId, PaymentMethodCell, StatusBadge } from "./ui";
import { formatAmount, formatDate, TIME_ZONE } from "./query";
import type { Payment } from "./model";

export function PaymentDetails({
  payment: p,
  synthetic,
}: {
  payment: Payment;
  synthetic: boolean;
}) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <DashboardShell>
        <div className="detail-page">
          <Link className="back-link" href="/payments">
            <ArrowLeft size={14} />
            Payments
          </Link>
          <div className="detail-heading">
            <div>
              <div className="eyebrow">PAYMENT</div>
              <h1>
                {formatAmount(p.amount, p.currency)} <span>{p.currency.toUpperCase()}</span>
              </h1>
              <StatusBadge status={p.status} />
            </div>
            <CopyId id={p.id} />
          </div>
          <div className="detail-grid">
            <div>
              <section className="detail-section">
                <h2>Payment details</h2>
                <dl>
                  <dt>Payment ID</dt>
                  <dd className="full-id">{p.id}</dd>
                  <dt>Amount</dt>
                  <dd>
                    {formatAmount(p.amount, p.currency)} {p.currency.toUpperCase()}
                  </dd>
                  <dt>Status</dt>
                  <dd>
                    <StatusBadge status={p.status} />
                  </dd>
                  <dt>Created</dt>
                  <dd>
                    {formatDate(p.created)} <span className="muted">({TIME_ZONE})</span>
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
              <section className="detail-section">
                <h2>Activity</h2>
                <p className="section-note">
                  {synthetic
                    ? "Illustrative demo timeline. Only the creation timestamp is represented by the sample data."
                    : "Snapshot activity. Import Stripe Events separately for a complete event timeline."}
                </p>
                <div className="timeline">
                  <span className="timeline-icon">
                    <Check size={14} />
                  </span>
                  <div>
                    <strong>Current status: {p.status}</strong>
                    <p>Source status: {p.sourceStatus}</p>
                  </div>
                </div>
                <div className="timeline">
                  <span className="timeline-icon">
                    <Clock3 size={14} />
                  </span>
                  <div>
                    <strong>Payment created</strong>
                    <p>{formatDate(p.created)}</p>
                  </div>
                </div>
              </section>
              <section className="detail-section">
                <h2>Metadata</h2>
                <dl>
                  <dt>Data source</dt>
                  <dd>{synthetic ? "Synthetic demo fixture" : "Stripe sandbox snapshot"}</dd>
                  <dt>Mode</dt>
                  <dd>Sandbox</dd>
                </dl>
                <p className="section-note">
                  Custom Stripe metadata is not included in this local snapshot.
                </p>
              </section>
            </div>
            <aside>
              <section className="detail-section customer-card">
                <h2>Customer</h2>
                <span className="customer-avatar">{(p.customer.name ?? "G").slice(0, 1)}</span>
                <h3>{p.customer.name ?? "Guest customer"}</h3>
                <p>{p.customer.email ?? "No email provided"}</p>
                <div className="customer-id">{p.customer.id ?? "No customer attached"}</div>
              </section>
              <div className="detail-help">
                Need more information?
                <a
                  href="https://docs.stripe.com/payments/payment-intents"
                  target="_blank"
                  rel="noreferrer"
                >
                  Learn about payments <ExternalLink size={12} />
                </a>
              </div>
            </aside>
          </div>
        </div>
      </DashboardShell>
    </Tooltip.Provider>
  );
}
