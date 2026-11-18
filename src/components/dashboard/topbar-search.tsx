"use client";
import type { FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PaymentSearch } from "@/features/payments/payment-search";
import { defaultQuery, paymentsHref, parseQuery } from "@/features/payments/query";

/**
 * On the payments list the search filters in place; elsewhere Enter opens the
 * list with it applied. Keying by pathname clears an unsent draft on navigation.
 */
export function TopbarSearch() {
  const pathname = usePathname();
  return pathname === "/payments" ? <LiveSearch /> : <SubmitSearch key={pathname} />;
}

function LiveSearch() {
  const params = useSearchParams();
  const query = parseQuery(new URLSearchParams(params.toString()));
  return (
    <PaymentSearch
      value={query.search}
      onChange={(search) =>
        window.history.replaceState(null, "", paymentsHref({ ...query, page: 1, search }))
      }
    />
  );
}

function SubmitSearch() {
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const search = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    if (search) router.push(paymentsHref({ ...defaultQuery, search }));
  }
  return (
    <search className="contents">
      <form className="contents" onSubmit={submit}>
        <PaymentSearch name="q" />
      </form>
    </search>
  );
}

export function TopbarSearchFallback() {
  return <PaymentSearch name="q" disabled />;
}
