export type Money = {
  readonly amountMinor: number;
  readonly currency: string;
};

const digitsCache = new Map<string, number>();

function fractionDigits(currency: string): number {
  const cached = digitsCache.get(currency);
  if (cached !== undefined) return cached;
  const formatter = new Intl.NumberFormat("en", { style: "currency", currency });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  digitsCache.set(currency, digits);
  return digits;
}

export function minorUnitsPerMajor(currency: string): number {
  return 10 ** fractionDigits(currency);
}

export function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} and ${b.currency}.`);
  }
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
}

export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amountMinor: a.amountMinor - b.amountMinor, currency: a.currency };
}

export function negateMoney(money: Money): Money {
  return { amountMinor: -money.amountMinor, currency: money.currency };
}

export function sumMoney(currency: string, amounts: readonly Money[]): Money {
  let total = 0;
  for (const money of amounts) {
    if (money.currency !== currency) {
      throw new Error(`Currency mismatch: expected ${currency}, received ${money.currency}.`);
    }
    total += money.amountMinor;
  }
  return { amountMinor: total, currency };
}

export function moneyFromMajor(amountMajor: number, currency: string): Money {
  return { amountMinor: Math.round(amountMajor * minorUnitsPerMajor(currency)), currency };
}

export function formatMoney(money: Money, locale = "en"): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currency,
    minimumFractionDigits: fractionDigits(money.currency),
    maximumFractionDigits: fractionDigits(money.currency),
  });
  return formatter.format(money.amountMinor / minorUnitsPerMajor(money.currency));
}
