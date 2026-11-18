"use client";
import { X } from "lucide-react";
import { getFilterChips } from "./filter-chips";
import type { PaymentQuery } from "./query";
import type { UpdateQuery } from "./filters";

type ActiveFiltersProps = { query: PaymentQuery; update: UpdateQuery };

export function ActiveFilters({ query, update }: ActiveFiltersProps) {
  const chips = getFilterChips(query);
  if (!chips.length) return null;
  return (
    <div className="mb-2.75 flex flex-wrap gap-1.25">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          className="flex items-center gap-1.75 rounded border border-[#ded9fa] bg-[#f6f4ff] px-1.75 py-1 text-10 text-[#6554c0]"
          onClick={() => update(chip.reset)}
        >
          {chip.label}
          <X size={11} aria-hidden="true" />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
    </div>
  );
}
