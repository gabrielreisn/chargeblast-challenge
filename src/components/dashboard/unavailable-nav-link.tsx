"use client";
import type { ReactNode } from "react";
import { Hint } from "@/features/payments/ui";

export const UNAVAILABLE_HINT = "Not available in this demo";

type UnavailableNavLinkProps = { children: ReactNode; className: string };

/**
 * A sidebar destination this demo doesn't implement. Like `ReadOnlyButton`, it stays focusable
 * (aria-disabled rather than disabled) so the explanation is reachable by hover and keyboard.
 */
export function UnavailableNavLink({ children, className }: UnavailableNavLinkProps) {
  return (
    <Hint text={UNAVAILABLE_HINT} side="right">
      <button type="button" aria-disabled="true" className={className}>
        {children}
      </button>
    </Hint>
  );
}
