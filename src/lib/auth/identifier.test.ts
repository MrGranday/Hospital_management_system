import { describe, expect, it } from "vitest";

import {
  loginInputSchema,
  passwordChangeSchema,
  toLoginIdentifier,
} from "@/lib/auth/identifier";

describe("toLoginIdentifier", () => {
  it("builds an internal address from hospital code and username", () => {
    expect(toLoginIdentifier("alnoor", "j.whitfield")).toBe(
      "j.whitfield@alnoor.medicore.invalid",
    );
  });

  it("never produces a routable domain", () => {
    expect(toLoginIdentifier("alnoor", "admin")).toMatch(/\.medicore\.invalid$/);
  });
});

describe("loginInputSchema", () => {
  it("normalizes hospital code and username", () => {
    const parsed = loginInputSchema.parse({
      hospitalCode: "  AlNoor ",
      username: "  Admin ",
      password: "secret",
    });

    expect(parsed.hospitalCode).toBe("alnoor");
    expect(parsed.username).toBe("admin");
  });

  it("rejects an empty password", () => {
    expect(
      loginInputSchema.safeParse({ hospitalCode: "alnoor", username: "admin", password: "" })
        .success,
    ).toBe(false);
  });

  it("rejects malformed hospital codes", () => {
    expect(
      loginInputSchema.safeParse({
        hospitalCode: "al noor",
        username: "admin",
        password: "secret",
      }).success,
    ).toBe(false);
  });
});

describe("passwordChangeSchema", () => {
  it("requires at least 12 characters", () => {
    expect(
      passwordChangeSchema.safeParse({ password: "short", confirmPassword: "short" }).success,
    ).toBe(false);
  });

  it("requires matching passwords", () => {
    expect(
      passwordChangeSchema.safeParse({
        password: "correct horse battery",
        confirmPassword: "correct horse batteries",
      }).success,
    ).toBe(false);
  });

  it("accepts a long, matching password", () => {
    expect(
      passwordChangeSchema.safeParse({
        password: "correct horse battery",
        confirmPassword: "correct horse battery",
      }).success,
    ).toBe(true);
  });
});
