"use client";
import { X } from "lucide-react";
import { getFilterChips } from "./filter-chips";
import type { PaymentQuery } from "./query";
import type { UpdateQuery } from "./filters";
export function ActiveFilters({ query, update }: { query: PaymentQuery; update: UpdateQuery }) {
  const chips = getFilterChips(query);
  if (!chips.length) return null;
  return (
    <div className="active-chips">
      {chips.map((chip) => (
        <button key={chip.key} onClick={() => update(chip.reset)}>
          {chip.label}
          <X size={11} />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
    </div>
  );
}
