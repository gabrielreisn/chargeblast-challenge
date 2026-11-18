"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaymentQuery } from "./query";
import type { UpdateQuery } from "./filters";
export function TableFooter({
  count,
  selected,
  page,
  pages,
  query,
  update,
}: {
  count: number;
  selected: number;
  page: number;
  pages: number;
  query: PaymentQuery;
  update: UpdateQuery;
}) {
  return (
    <div className="table-footer">
      <span>
        {selected > 0 ? `${selected} selected · ` : ""}
        Viewing{" "}
        <strong>
          {count ? (page - 1) * query.size + 1 : 0}–{Math.min(page * query.size, count)}
        </strong>{" "}
        of <strong>{count.toLocaleString()}</strong> results
      </span>
      <div className="pagination">
        <label>
          Rows per page
          <select
            aria-label="Rows per page"
            value={query.size}
            onChange={(event) =>
              update({ size: Number(event.target.value) as PaymentQuery["size"] })
            }
          >
            {[25, 50, 100].map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </label>
        <span className="page-number">
          Page {page} of {pages}
        </span>
        <button
          className="button small"
          disabled={page <= 1}
          onClick={() => update({ page: page - 1 })}
        >
          <ChevronLeft size={12} />
          Previous
        </button>
        <button
          className="button small"
          disabled={page >= pages}
          onClick={() => update({ page: page + 1 })}
        >
          Next
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
