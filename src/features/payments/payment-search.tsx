"use client";
import { useEffect, useRef, type ChangeEvent } from "react";
import { Search, X } from "lucide-react";
import { iconButtonStyles } from "@/components/ui/styles";

type ControlledSearch = { value: string; onChange: (value: string) => void; name?: never };
/** Uncontrolled mode for use inside a `<form>`: read the value from FormData on submit. */
type UncontrolledSearch = { value?: never; onChange?: never; name: string };

type PaymentSearchProps = (ControlledSearch | UncontrolledSearch) & { disabled?: boolean };

export function PaymentSearch({ value, onChange, name, disabled = false }: PaymentSearchProps) {
  const input = useRef<HTMLInputElement>(null);
  const controlled = onChange
    ? { value, onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value) }
    : {};
  useEffect(function focusSearchOnSlash() {
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
    <div className="flex h-7.5 w-full items-center gap-2 rounded-[5px] bg-field px-2.75 text-[#7b8595] md:w-[min(480px,50%)]">
      <Search size={14} aria-hidden="true" />
      <input
        ref={input}
        name={name}
        aria-label="Search payments"
        placeholder="Search by payment ID, email, or last 4 digits"
        className="w-full min-w-0 bg-transparent text-10 text-[#424d60] outline-none placeholder:text-[#8490a0] focus-visible:outline-none md:text-11"
        disabled={disabled}
        {...controlled}
      />
      {onChange && value ? (
        <button
          type="button"
          className={iconButtonStyles}
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          <X size={13} />
        </button>
      ) : (
        <kbd className="rounded-[3px] border border-[#e1e4e9] px-1.25 py-px text-10 text-[#9aa2b0]">
          /
        </kbd>
      )}
    </div>
  );
}
