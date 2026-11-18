/**
 * Live formatting for the amount filter inputs: digits group as the viewer's locale does
 * ("1,234,567.89" or "1.234.567,89") and decimals stop at the currency's precision.
 * The URL keeps the canonical form ("1234567.89").
 */

/** Stripe's largest charge is under 1 billion in every currency, so longer input is a typo. */
const MAX_INTEGER_DIGITS = 9;

type Separators = { group: string; decimal: string };

const separatorCache = new Map<string, Separators>();

export function separatorsFor(locale: string): Separators {
  let separators = separatorCache.get(locale);
  if (!separators) {
    const parts = new Intl.NumberFormat(locale).formatToParts(1234567.5);
    separators = {
      group: parts.find((part) => part.type === "group")?.value ?? ",",
      decimal: parts.find((part) => part.type === "decimal")?.value ?? ".",
    };
    separatorCache.set(locale, separators);
  }
  return separators;
}

type MaskOptions = { locale: string; fractionDigits: number };

/** Reformats whatever was typed or pasted; anything but digits and one decimal mark is dropped. */
export function maskAmount(input: string, { locale, fractionDigits }: MaskOptions) {
  const { decimal } = separatorsFor(locale);
  const decimalAt = fractionDigits > 0 ? input.indexOf(decimal) : -1;
  const integerInput = decimalAt < 0 ? input : input.slice(0, decimalAt);
  const digits = integerInput
    .replaceAll(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, MAX_INTEGER_DIGITS);
  if (decimalAt < 0) return digits && formatInteger(digits, locale);
  const fraction = input
    .slice(decimalAt + 1)
    .replaceAll(/\D/g, "")
    .slice(0, fractionDigits);
  return `${formatInteger(digits || "0", locale)}${decimal}${fraction}`;
}

function formatInteger(digits: string, locale: string) {
  // BigInt keeps every digit exact; Intl adds the locale's grouping (including en-IN lakh groups).
  return new Intl.NumberFormat(locale).format(BigInt(digits));
}

/** Masked display value → canonical URL value ("1.234,5" in pt-BR → "1234.5"). */
export function unmaskAmount(masked: string, locale: string) {
  const { decimal } = separatorsFor(locale);
  const [integer = "", fraction = ""] = masked.split(decimal);
  const digits = integer.replaceAll(/\D/g, "");
  const decimals = fraction.replaceAll(/\D/g, "");
  if (!digits && !decimals) return "";
  return decimals ? `${digits || "0"}.${decimals}` : digits;
}

/** Canonical URL value → masked display value, for the input's initial value. */
export function displayAmount(canonical: string, options: MaskOptions) {
  const { decimal } = separatorsFor(options.locale);
  return maskAmount(canonical.replace(".", decimal), options);
}

/** Position in `masked` after the same number of digits and decimal marks as `count`. */
export function caretPosition(masked: string, count: number, locale: string) {
  const { decimal } = separatorsFor(locale);
  let seen = 0;
  for (let index = 0; index < masked.length; index += 1) {
    if (seen === count) return index;
    if (/\d/.test(masked[index]) || masked[index] === decimal) seen += 1;
  }
  return masked.length;
}

/** How many digits and decimal marks precede `caret` in `value`. */
export function significantBefore(value: string, caret: number, locale: string) {
  const { decimal } = separatorsFor(locale);
  return Array.from(value.slice(0, caret)).filter((char) => /\d/.test(char) || char === decimal)
    .length;
}
