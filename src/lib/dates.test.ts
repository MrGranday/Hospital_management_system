import { describe, expect, it } from "vitest";
import { TODAY_ISO, daysUntil, isoDaysFromNow } from "@/lib/dates";

describe("dates", () => {
  it("formats today as an ISO date", () => {
    expect(TODAY_ISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns today for a zero-day horizon", () => {
    expect(isoDaysFromNow(0)).toBe(TODAY_ISO);
  });

  it("moves the horizon forward by whole days", () => {
    expect(daysUntil(isoDaysFromNow(7))).toBeCloseTo(7, 5);
    expect(daysUntil(isoDaysFromNow(30))).toBeCloseTo(30, 5);
  });

  it("reports today as zero days away", () => {
    expect(daysUntil(TODAY_ISO)).toBeGreaterThanOrEqual(0);
    expect(daysUntil(TODAY_ISO)).toBeLessThan(1);
  });
});
