"use client";
import { useState, type ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Popover from "@radix-ui/react-popover";
import { Check, Copy, CreditCard, Landmark, Wallet, X } from "lucide-react";
import { statusLabels, type Payment } from "./model";

export function Hint({ children, text }: { children: ReactNode; text: string }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="tooltip" sideOffset={6}>
          {text}
          <Tooltip.Arrow />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
export function FilterPopover({
  label,
  icon,
  active,
  children,
}: {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger className={`filter-button ${active ? "active-filter" : ""}`}>
        {icon}
        {label}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="popover" sideOffset={7} align="start">
          <div className="popover-heading">
            {label}
            <Popover.Close className="icon-button" aria-label="Close filter">
              <X size={14} />
            </Popover.Close>
          </div>
          {children}
          <Popover.Arrow className="popover-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
export function StatusBadge({ status }: { status: Payment["status"] }) {
  return (
    <span className={`status-badge ${status}`}>
      {statusLabels[status]}
      {status === "succeeded" ? (
        <Check size={10} strokeWidth={3} />
      ) : status === "failed" ? (
        <X size={10} strokeWidth={3} />
      ) : null}
    </span>
  );
}
function CardBrand({ brand }: { brand: string | null }) {
  const content =
    brand === "visa" ? (
      "VISA"
    ) : brand === "amex" ? (
      "AMEX"
    ) : brand === "mastercard" ? (
      <>
        <i />
        <i />
      </>
    ) : (
      <CreditCard size={12} />
    );
  return <span className={`card-brand ${brand ?? ""}`}>{content}</span>;
}
function MethodIcon({ payment }: { payment: Payment }) {
  if (payment.method === "ach")
    return (
      <span className="bank-icon">
        <Landmark size={12} />
      </span>
    );
  if (payment.method === "wallet")
    return (
      <span className="wallet-icon">
        <Wallet size={12} />
      </span>
    );
  return <CardBrand brand={payment.brand} />;
}
function methodDisplayLabel(p: Payment) {
  if (p.method === "ach") return "ACH";
  if (p.method !== "wallet") return "••••";
  return (
    ({ apple_pay: "Apple Pay", google_pay: "Google Pay" } as Record<string, string>)[
      p.wallet ?? ""
    ] ?? "Wallet"
  );
}
export function PaymentMethodCell({ payment: p }: { payment: Payment }) {
  return (
    <span className="method-cell">
      <MethodIcon payment={p} />
      <span className="muted">{methodDisplayLabel(p)}</span>
      <span>{p.last4 ?? "—"}</span>
    </span>
  );
}
export function CopyId({ id }: { id: string }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(id);
      setMessage("Copied");
    } catch {
      setMessage("Could not copy. Select the full ID in payment details.");
    }
  }
  return (
    <span className="copy-wrap">
      <Hint text={id}>
        <button className="copy-id" onClick={copy} aria-label={`Copy payment ID ${id}`}>
          <span>
            {id.slice(0, 10)}…{id.slice(-4)}
          </span>
          {message === "Copied" ? <Check size={11} /> : <Copy size={11} />}
        </button>
      </Hint>
      <output className="sr-only">{message}</output>
    </span>
  );
}
