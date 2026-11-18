"use client";
import type { ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import { X } from "lucide-react";
import { cn, floatingPanelStyles, iconButtonStyles } from "./styles";

type FilterPopoverProps = {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  children: ReactNode;
};

/** Toolbar filter button that opens a titled popover with the filter controls. */
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
