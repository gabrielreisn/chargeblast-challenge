"use client";
import type { ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import { CirclePlus, X } from "lucide-react";
import { cn, floatingPanelStyles, iconButtonStyles } from "./styles";

type FilterPopoverProps = {
  label: string;
  active?: boolean;
  children: ReactNode;
};

/**
 * Toolbar filter pill that opens a titled popover with the filter controls. Like Stripe's,
 * an unused filter is a dashed outline; an applied one turns solid brand.
 */
export function FilterPopover({ label, active = false, children }: FilterPopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          "flex min-h-6 items-center gap-1 rounded-full border py-0.75 pr-2.25 pl-1.5 text-10 font-semibold whitespace-nowrap",
          active
            ? "border-solid border-brand-line bg-brand-tint text-brand"
            : "border-dashed border-[#c0c8d2] bg-white text-ink-soft hover:border-faint hover:bg-wash [&>svg]:text-faint",
        )}
      >
        <CirclePlus size={12} aria-hidden="true" />
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
