"use client";
import type { ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

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
