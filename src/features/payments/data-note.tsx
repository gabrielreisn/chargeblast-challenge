import { SlidersHorizontal } from "lucide-react";
import type { Formatters } from "./format";
import { useFormatters } from "./format-context";
import { snapshotSourceLabels, type Snapshot } from "./model";

function describeSnapshot({ source, payments }: Snapshot, format: Formatters) {
  const count = format.formatNumber(payments.length);
  if (source === "synthetic") return `Demo workspace · ${count} sample payments`;
  return `${snapshotSourceLabels[source]} · ${count} payments`;
}

type DataNoteProps = { snapshot: Snapshot; now: number };

/** Where the data comes from and which time zone dates use (the viewer's). */
export function DataNote({ snapshot, now }: DataNoteProps) {
  const format = useFormatters();
  return (
    <div className="mt-5.5 flex flex-wrap items-start gap-1.5 pb-5 text-9 leading-3.75 text-[#98a0b0] md:flex-nowrap md:items-center md:leading-normal">
      <SlidersHorizontal size={12} aria-hidden="true" />
      {describeSnapshot(snapshot, format)}
      <span className="ml-4.5 w-full md:ml-auto md:w-auto">
        Dates in {format.timeZoneLabel(now)}
      </span>
    </div>
  );
}
