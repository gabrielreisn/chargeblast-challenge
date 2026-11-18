"use client";
import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
export function PaymentSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input,textarea,[contenteditable=true]")
      )
        return;
      event.preventDefault();
      input.current?.focus();
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);
  return (
    <div className="global-search">
      <Search size={14} />
      <input
        ref={input}
        aria-label="Search payments"
        placeholder="Search by payment ID, email, or last 4 digits"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value ? (
        <button className="icon-button" aria-label="Clear search" onClick={() => onChange("")}>
          <X size={13} />
        </button>
      ) : (
        <kbd>/</kbd>
      )}
    </div>
  );
}
