"use client";
import { useState, type ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Popover from "@radix-ui/react-popover";
import { Check, Copy, CreditCard, Landmark, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { cn, floatingPanelStyles, iconButtonStyles } from "@/components/ui/styles";
import { statusLabels, type Payment, type PaymentStatus } from "./model";

type HintProps = {
  children: ReactNode;
  text: string;
  side?: Tooltip.TooltipContentProps["side"];
};

export function Hint({ children, text, side = "top" }: HintProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="z-70 max-w-82.5 rounded-[5px] bg-ink px-2.5 py-1.75 text-11 leading-4 text-white shadow-tooltip"
          side={side}
          sideOffset={6}
        >
          {text}
          {/* Radix places the arrow flush with the edge; overlapping 1px hides the subpixel seam. */}
          <Tooltip.Arrow className="-mt-px fill-ink" width={12} height={6} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

type FilterPopoverProps = {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  children: ReactNode;
};

export function FilterPopover({ label, icon, active = false, children }: FilterPopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          "flex min-h-5.75 items-center gap-1.25 rounded-[5px] border px-1.75 py-0.75 text-10 whitespace-nowrap hover:bg-wash",
          active
            ? "border-brand-line bg-[#f8f6ff] text-brand"
            : "border-[#dce0e7] bg-white text-[#687386] [&>svg]:text-[#7f8998]",
        )}
      >
        {icon}
        {label}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={cn(floatingPanelStyles, "w-67.5 max-w-[calc(100vw-30px)]")}
          sideOffset={7}
          align="start"
        >
          <div className="flex items-center justify-between border-b border-[#e9ecf1] px-3.5 py-3 text-12 font-semibold">
            {label}
            <Popover.Close className={iconButtonStyles} aria-label="Close filter">
              <X size={14} />
            </Popover.Close>
          </div>
          {children}
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

const statusBadgeStyles: Record<PaymentStatus, string> = {
  succeeded: "border-success-line bg-success-bg text-success",
  failed: "border-danger-line bg-danger-bg text-danger",
  pending: "border-warning-line bg-warning-bg text-warning",
  refunded: "border-info-line bg-info-bg text-info",
};

type StatusBadgeProps = { status: PaymentStatus };

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-between gap-1.25 rounded-[3px] border px-1.25 align-middle text-9 leading-4 font-medium",
        statusBadgeStyles[status],
      )}
    >
      {statusLabels[status]}
      {status === "succeeded" ? (
        <Check size={10} strokeWidth={3} aria-hidden="true" />
      ) : status === "failed" ? (
        <X size={10} strokeWidth={3} aria-hidden="true" />
      ) : null}
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

const walletLabels: Record<string, string> = { apple_pay: "Apple Pay", google_pay: "Google Pay" };

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
