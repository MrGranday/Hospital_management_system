import { describe, expect, it } from "vitest";

import { isMfaRequiredForRole, isMfaSatisfied, mfaCodeSchema, mfaVerifySchema, MFA_REQUIRED_ROLES } from "./mfa";

describe("MFA policy", () => {
  it("requires MFA for every privileged role in SECURITY.md", () => {
    for (const role of [
      "super_admin",
      "hospital_admin",
      "accountant",
      "hr_manager",
      "pharmacist",
      "inventory_manager",
      "auditor",
    ]) {
      expect(isMfaRequiredForRole(role)).toBe(true);
    }
  });

  it("does not require MFA for clinical and front-desk roles", () => {
    for (const role of ["doctor", "nurse", "receptionist", "cashier", "lab_technician"]) {
      expect(isMfaRequiredForRole(role)).toBe(false);
    }
    expect(isMfaRequiredForRole("")).toBe(false);
  });

  it("is satisfied only at AAL2 for privileged roles", () => {
    expect(isMfaSatisfied("super_admin", "aal1")).toBe(false);
    expect(isMfaSatisfied("super_admin", null)).toBe(false);
    expect(isMfaSatisfied("super_admin", "aal2")).toBe(true);
    expect(isMfaSatisfied("doctor", "aal1")).toBe(true);
  });

  it("validates a six-digit authenticator code", () => {
    expect(mfaCodeSchema.safeParse(" 123456 ").success).toBe(true);
    expect(mfaCodeSchema.safeParse("12345").success).toBe(false);
    expect(mfaCodeSchema.safeParse("12345a").success).toBe(false);
    expect(mfaCodeSchema.safeParse("").success).toBe(false);
  });

  it("rejects a malformed factor id", () => {
    const valid = mfaVerifySchema.safeParse({
      factorId: "3b3a1c1e-5a6f-4c1d-8e2f-7a8b9c0d1e2f",
      code: "123456",
    });
    expect(valid.success).toBe(true);
    expect(mfaVerifySchema.safeParse({ factorId: "nope", code: "123456" }).success).toBe(false);
  });

  it("keeps the privileged role set closed", () => {
    expect([...MFA_REQUIRED_ROLES].sort()).toEqual([
      "accountant",
      "auditor",
      "hospital_admin",
      "hr_manager",
      "inventory_manager",
      "pharmacist",
      "super_admin",
    ]);
  });
});
