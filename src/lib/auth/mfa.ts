import { z } from "zod";

// Roles that must authenticate with a TOTP second factor (docs/SECURITY.md §2).
export const MFA_REQUIRED_ROLES: ReadonlySet<string> = new Set([
  "super_admin",
  "hospital_admin",
  "accountant",
  "hr_manager",
  "pharmacist",
  "inventory_manager",
  "auditor",
]);

export function isMfaRequiredForRole(role: string): boolean {
  return MFA_REQUIRED_ROLES.has(role);
}

export function isMfaSatisfied(role: string, aal: string | null): boolean {
  return !isMfaRequiredForRole(role) || aal === "aal2";
}

export const mfaCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app.");

export const mfaFactorIdSchema = z.string().uuid("Invalid authenticator factor.");

export const mfaVerifySchema = z.object({
  factorId: mfaFactorIdSchema,
  code: mfaCodeSchema,
});
