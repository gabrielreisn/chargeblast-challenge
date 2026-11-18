import { describe, expect, test } from "vitest";
import {
  caretPosition,
  displayAmount,
  maskAmount,
  significantBefore,
  unmaskAmount,
} from "./amount-mask";

const us = { locale: "en-US", fractionDigits: 2 };
const br = { locale: "pt-BR", fractionDigits: 2 };

describe("maskAmount", () => {
  test("groups digits and keeps one decimal mark in the locale's style", () => {
    expect(maskAmount("1234567.891", us)).toBe("1,234,567.89");
    expect(maskAmount("1234567,891", br)).toBe("1.234.567,89");
    expect(maskAmount("12.3.4", us)).toBe("12.34");
  });

  test("drops anything that isn't a digit, leading zeros and extra integer digits", () => {
    expect(maskAmount("$ 0012abc", us)).toBe("12");
    expect(maskAmount("13123231232", us)).toBe("131,232,312");
    expect(maskAmount("", us)).toBe("");
    expect(maskAmount("abc", us)).toBe("");
  });

  test("starts a bare decimal with zero and respects the currency's precision", () => {
    expect(maskAmount(".5", us)).toBe("0.5");
    expect(maskAmount("1234.56", { locale: "en-US", fractionDigits: 0 })).toBe("123,456");
    expect(maskAmount("1.2345", { locale: "en-US", fractionDigits: 3 })).toBe("1.234");
  });
});

test("unmasks to the canonical URL form and back", () => {
  expect(unmaskAmount("1.234.567,89", "pt-BR")).toBe("1234567.89");
  expect(unmaskAmount("1,234", "en-US")).toBe("1234");
  expect(unmaskAmount("0.5", "en-US")).toBe("0.5");
  expect(unmaskAmount("", "en-US")).toBe("");
  expect(displayAmount("1234567.5", br)).toBe("1.234.567,5");
  expect(displayAmount("", us)).toBe("");
});

test("keeps the caret after the same digit when separators move", () => {
  // Typing "4" at the end of "123" gives "1234" → "1,234"; the caret follows the 4.
  const before = significantBefore("1234", 4, "en-US");
  expect(caretPosition("1,234", before, "en-US")).toBe(5);
  // Caret after the "1" in "12345" stays after it in "12,345".
  expect(caretPosition("12,345", significantBefore("12345", 1, "en-US"), "en-US")).toBe(1);
  expect(caretPosition("1,234", 0, "en-US")).toBe(0);
});
