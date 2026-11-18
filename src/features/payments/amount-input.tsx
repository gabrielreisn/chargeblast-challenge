"use client";
import type { ChangeEvent } from "react";
import { fieldStyles } from "@/components/ui/styles";
import {
  caretPosition,
  displayAmount,
  maskAmount,
  separatorsFor,
  significantBefore,
} from "./amount-mask";
import { useFormatters } from "./format-context";

type AmountInputProps = {
  id: string;
  name: string;
  defaultValue: string;
  /** Decimal places allowed: the chosen currency's, or 2 across currencies. */
  fractionDigits: number;
  placeholder?: string;
};

/**
 * Uncontrolled text input that reformats as the user types, keeping the caret after the same
 * digit. The form reads the masked value from FormData and unmasks it on submit.
 */
export function AmountInput({
  id,
  name,
  defaultValue,
  fractionDigits,
  placeholder,
}: AmountInputProps) {
  const { locale } = useFormatters();
  const options = { locale, fractionDigits };
  function applyMask(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const before = significantBefore(
      input.value,
      input.selectionStart ?? input.value.length,
      locale,
    );
    const masked = maskAmount(input.value, options);
    if (masked === input.value) return;
    input.value = masked;
    const caret = caretPosition(masked, before, locale);
    input.setSelectionRange(caret, caret);
  }
  const { decimal } = separatorsFor(locale);
  return (
    <input
      className={fieldStyles}
      id={id}
      name={name}
      type="text"
      inputMode={fractionDigits > 0 ? "decimal" : "numeric"}
      autoComplete="off"
      placeholder={
        placeholder ?? (fractionDigits > 0 ? `0${decimal}${"0".repeat(fractionDigits)}` : "0")
      }
      defaultValue={displayAmount(defaultValue, options)}
      onChange={applyMask}
    />
  );
}
