"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonStyles } from "@/components/ui/styles";
import type { PaymentQuery } from "./query";
import type { UpdateQuery } from "./filters";

type TableFooterProps = {
  count: number;
  selected: number;
  page: number;
  pages: number;
  query: PaymentQuery;
  update: UpdateQuery;
};

const pageSizes: PaymentQuery["size"][] = [25, 50, 100];

export function TableFooter({ count, selected, page, pages, query, update }: TableFooterProps) {
  const first = count ? (page - 1) * query.size + 1 : 0;
  const last = Math.min(page * query.size, count);
  return (
    <div className="mt-3.25 flex flex-col gap-3.75 text-10 text-[#758095] md:flex-row md:items-start md:justify-between md:gap-3 lg:items-center">
      <span>
        {selected > 0 ? `${selected} selected · ` : ""}
        Viewing{" "}
        <strong className="font-medium text-[#4e5a70]">
          {first}–{last}
        </strong>{" "}
        of <strong className="font-medium text-[#4e5a70]">{count.toLocaleString()}</strong> results
      </span>
      <div className="flex w-full flex-wrap items-center gap-1.75 md:w-auto md:justify-end md:gap-2 lg:flex-nowrap">
        <label className="mr-auto flex items-center gap-1.75 whitespace-nowrap md:mr-0">
          Rows per page
          <select
            className="rounded border border-[#dce1e9] bg-white px-1 py-0.75 text-10"
            aria-label="Rows per page"
            value={query.size}
            onChange={(event) =>
              update({ size: Number(event.target.value) as PaymentQuery["size"] })
            }
          >
            {pageSizes.map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </label>
        <span className="mx-1.25 hidden md:inline">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          className={buttonStyles({ size: "sm" })}
          disabled={page <= 1}
          onClick={() => update({ page: page - 1 })}
        >
          <ChevronLeft size={12} aria-hidden="true" />
          Previous
        </button>
        <button
          type="button"
          className={buttonStyles({ size: "sm" })}
          disabled={page >= pages}
          onClick={() => update({ page: page + 1 })}
        >
          Next
          <ChevronRight size={12} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
