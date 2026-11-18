"use client";
import { useState } from "react";
import {
  Ban,
  Check,
  CircleAlert,
  Clock3,
  Copy,
  CreditCard,
  Landmark,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Hint } from "@/components/ui/hint";
import { cn } from "@/components/ui/styles";
import { statusLabels, walletLabels, type Payment, type PaymentStatus } from "./model";

const neutralBadge = "border-line bg-field text-subtle";

/** Colors and trailing icon per status, following Stripe's badges. */
const statusBadges: Record<PaymentStatus, { styles: string; icon?: LucideIcon }> = {
  succeeded: { styles: "border-success-line bg-success-bg text-success", icon: Check },
  refunded: { styles: "border-info-line bg-info-bg text-info" },
  disputed: { styles: "border-warning-line bg-warning-bg text-warning", icon: CircleAlert },
  failed: { styles: "border-danger-line bg-danger-bg text-danger", icon: X },
  uncaptured: { styles: neutralBadge, icon: Clock3 },
  blocked: { styles: "border-danger-line bg-danger-bg text-danger", icon: Ban },
  incomplete: { styles: neutralBadge, icon: Clock3 },
  canceled: { styles: neutralBadge, icon: X },
  pending: { styles: "border-warning-line bg-warning-bg text-warning", icon: Clock3 },
};

type StatusBadgeProps = { status: PaymentStatus };

export function StatusBadge({ status }: StatusBadgeProps) {
  const { styles, icon: Icon } = statusBadges[status];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-between gap-1.25 rounded-[3px] border px-1.25 align-middle text-9 leading-4 font-medium",
        styles,
      )}
    >
      {statusLabels[status]}
      {Icon && <Icon size={10} strokeWidth={2.75} aria-hidden="true" />}
    </span>
  );
}

const methodIconStyles =
  "inline-flex h-4 w-6.25 shrink-0 items-center justify-center rounded-[2px] border";

type CardBrandProps = { brand: string | null };

function CardBrand({ brand }: CardBrandProps) {
  if (brand === "visa")
    return (
      <span
        className={cn(
          methodIconStyles,
          "border-[#e1e5ec] bg-white text-[7px] font-extrabold text-[#153ba3] italic",
        )}
      >
        VISA
      </span>
    );
  if (brand === "amex")
    return (
      <span
        className={cn(
          methodIconStyles,
          "border-[#2875bc] bg-[#2875bc] text-[5px] font-extrabold text-white",
        )}
      >
        AMEX
      </span>
    );
  if (brand === "mastercard")
    return (
      <span className={cn(methodIconStyles, "border-[#22283a] bg-[#22283a]")}>
        <i className="size-2.5 rounded-full bg-[#ef3e36]" />
        <i className="-ml-1 size-2.5 rounded-full bg-[#ffaf24] opacity-95" />
      </span>
    );
  return (
    <span className={cn(methodIconStyles, "border-[#e1e5ec] bg-white text-[#153ba3]")}>
      <CreditCard size={12} aria-hidden="true" />
    </span>
  );
}

type PaymentProps = { payment: Payment };

function MethodIcon({ payment }: PaymentProps) {
  if (payment.method === "ach")
    return (
      <span className={cn(methodIconStyles, "border-[#dce1eb] bg-[#edf2f9] text-[#536d94]")}>
        <Landmark size={12} aria-hidden="true" />
      </span>
    );
  if (payment.method === "wallet")
    return (
      <span className={cn(methodIconStyles, "border-[#22283a] bg-[#22283a] text-white")}>
        <Wallet size={12} aria-hidden="true" />
      </span>
    );
  return <CardBrand brand={payment.brand} />;
}

function methodDisplayLabel(payment: Payment) {
  if (payment.method === "ach") return "ACH";
  if (payment.method !== "wallet") return "••••";
  return walletLabels[payment.wallet ?? ""] ?? "Wallet";
}

export function PaymentMethodCell({ payment }: PaymentProps) {
  return (
    <span className="inline-flex items-center gap-1.5 align-middle text-10 tabular-nums">
      <MethodIcon payment={payment} />
      <span className="text-muted">{methodDisplayLabel(payment)}</span>
      <span>{payment.last4 ?? "—"}</span>
    </span>
  );
}

type CopyIdProps = { id: string };

export function CopyId({ id }: CopyIdProps) {
  // Transient feedback for a user action; nothing to derive it from.
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
    } catch {
      setCopied(false);
      toast.error("Couldn’t copy payment ID", {
        description:
          "Your browser blocked clipboard access. Select the ID in payment details instead.",
      });
    }
  }
  return (
    <span>
      <Hint text={id}>
        <button
          type="button"
          className="group/copy inline-flex items-center gap-1.5 align-middle font-mono text-10 text-[#707d92] hover:text-brand focus-visible:text-brand"
          onClick={copy}
          aria-label={`Copy payment ID ${id}`}
        >
          <span>
            {id.slice(0, 10)}…{id.slice(-4)}
          </span>
          {copied ? (
            <Check size={11} aria-hidden="true" />
          ) : (
            <Copy
              size={11}
              aria-hidden="true"
              className="opacity-0 group-hover/copy:opacity-100 group-focus-visible/copy:opacity-100"
            />
          )}
        </button>
      </Hint>
      <output className="sr-only">{copied ? "Copied" : ""}</output>
    </span>
  );
}
