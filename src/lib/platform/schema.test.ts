import { describe, expect, it } from "vitest";

import { hospitalCreateSchema } from "@/lib/platform/schema";

const validInput = {
  code: "alnoor",
  name: "Al Noor Hospital",
  country: "eg",
  timezone: "Africa/Cairo",
  currency: "egp",
  adminUsername: "admin",
  adminFullName: "Hospital Administrator",
};

describe("hospitalCreateSchema", () => {
  it("normalizes country, currency and codes", () => {
    const parsed = hospitalCreateSchema.parse(validInput);
    expect(parsed.country).toBe("EG");
    expect(parsed.currency).toBe("EGP");
    expect(parsed.code).toBe("alnoor");
  });

  it("rejects the reserved platform code", () => {
    expect(hospitalCreateSchema.safeParse({ ...validInput, code: "platform" }).success).toBe(false);
  });

  it("rejects an unknown timezone", () => {
    expect(
      hospitalCreateSchema.safeParse({ ...validInput, timezone: "Mars/Olympus" }).success,
    ).toBe(false);
  });

  it("rejects malformed country and currency codes", () => {
    expect(hospitalCreateSchema.safeParse({ ...validInput, country: "EGY" }).success).toBe(false);
    expect(hospitalCreateSchema.safeParse({ ...validInput, currency: "E" }).success).toBe(false);
  });
});
