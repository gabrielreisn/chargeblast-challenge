"use client";
import type { ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

type HintProps = { children: ReactNode; text: string };

export function Hint({ children, text }: HintProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="z-70 max-w-82.5 rounded-[5px] bg-ink px-2.5 py-1.75 text-11 leading-4 text-white shadow-tooltip"
          sideOffset={6}
        >
          {text}
          <Tooltip.Arrow className="fill-ink" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
