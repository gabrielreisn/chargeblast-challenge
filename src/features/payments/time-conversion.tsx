"use client";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "@/components/ui/styles";
import { formattersFor } from "./format";
import { useFormatters } from "./format-context";

type TimeConversionProps = {
  /** Unix seconds. */
  timestamp: number;
};

const rowStyles = "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-5 px-3 py-2.25";

/**
 * A date shown in the viewer's time zone; hovering or focusing it shows the same moment in
 * the viewer's zone and in UTC, like Stripe's "Time conversion" popover.
 */
export function TimeConversion({ timestamp }: TimeConversionProps) {
  const local = useFormatters();
  const utc = formattersFor({ locale: local.locale, timeZone: "UTC" });
  const iso = new Date(timestamp * 1000).toISOString();
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          className="text-left underline decoration-dotted decoration-1 underline-offset-3 hover:text-ink"
        >
          <time dateTime={iso}>{local.formatFullDate(timestamp)}</time>
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="bottom"
          align="end"
          sideOffset={6}
          className="z-70 min-w-70 rounded-[7px] border border-[#e0e3eb] bg-white py-1.5 text-11 text-ink shadow-popover motion-safe:data-[state=closed]:animate-pop-out motion-safe:data-[state=delayed-open]:animate-pop-in"
        >
          <p className="px-3 pt-1 pb-1.5 text-10 font-semibold">Time conversion</p>
          <p className={rowStyles}>
            <span>
              <span className="tabular-nums">{local.offsetLabel(timestamp)}</span> · Your time zone
            </span>
            <span className="tabular-nums">{local.formatTime(timestamp)}</span>
            <span className="tabular-nums">{local.formatDay(timestamp)}</span>
          </p>
          <p className={cn(rowStyles, "border-t border-line-soft")}>
            <span>UTC</span>
            <span className="tabular-nums">{utc.formatTime(timestamp)}</span>
            <span className="tabular-nums">{utc.formatDay(timestamp)}</span>
          </p>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
