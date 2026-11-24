import { describe, expect, it } from "vitest";
import {
  addMoney,
  assertSameCurrency,
  formatMoney,
  minorUnitsPerMajor,
  moneyFromMajor,
  negateMoney,
  subtractMoney,
  sumMoney,
} from "@/lib/money";

describe("money", () => {
  it("reports the minor-unit scale per currency", () => {
    expect(minorUnitsPerMajor("USD")).toBe(100);
    expect(minorUnitsPerMajor("JPY")).toBe(1);
  });

  it("adds and subtracts money in the same currency", () => {
    expect(addMoney({ amountMinor: 1250, currency: "USD" }, { amountMinor: 375, currency: "USD" })).toEqual({
      amountMinor: 1625,
      currency: "USD",
    });
    expect(subtractMoney({ amountMinor: 1625, currency: "USD" }, { amountMinor: 375, currency: "USD" })).toEqual({
      amountMinor: 1250,
      currency: "USD",
    });
    expect(negateMoney({ amountMinor: 500, currency: "USD" }).amountMinor).toBe(-500);
  });

  it("rejects mixing currencies", () => {
    expect(() =>
      addMoney({ amountMinor: 100, currency: "USD" }, { amountMinor: 100, currency: "AFN" }),
    ).toThrow(/Currency mismatch/);
    expect(() =>
      assertSameCurrency({ amountMinor: 1, currency: "USD" }, { amountMinor: 1, currency: "EUR" }),
    ).toThrow();
  });

  it("sums a list of amounts", () => {
    expect(
      sumMoney("USD", [
        { amountMinor: 100, currency: "USD" },
        { amountMinor: 250, currency: "USD" },
      ]).amountMinor,
    ).toBe(350);
  });

  it("converts major units to minor units", () => {
    expect(moneyFromMajor(12.34, "USD")).toEqual({ amountMinor: 1234, currency: "USD" });
    expect(moneyFromMajor(1000, "JPY")).toEqual({ amountMinor: 1000, currency: "JPY" });
  });

  it("formats minor units as a localized currency string", () => {
    expect(formatMoney({ amountMinor: 1234, currency: "USD" }, "en-US")).toBe("$12.34");
    expect(formatMoney({ amountMinor: 1000, currency: "JPY" }, "en-US")).toBe("¥1,000");
  });
});
