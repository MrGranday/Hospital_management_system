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

export function parseQrCodeSvg(value: string): string | null {
  const trimmed = value.trim();
  let markup = trimmed;

  if (trimmed.startsWith("data:image/svg+xml")) {
    const commaIndex = trimmed.indexOf(",");
    if (commaIndex !== -1) {
      const payload = trimmed.slice(commaIndex + 1);
      try {
        markup = decodeURIComponent(payload);
      } catch {
        markup = payload;
      }
    }
  }

  const svgStart = markup.indexOf("<svg");
  if (svgStart === -1) return null;

  let svg = markup.slice(svgStart);

  // If the SVG is missing viewBox, extract width and height and inject viewBox so it scales without clipping
  if (!svg.includes("viewBox")) {
    const widthMatch = svg.match(/width=["'](\d+)["']/);
    const heightMatch = svg.match(/height=["'](\d+)["']/);
    if (widthMatch?.[1] && heightMatch?.[1]) {
      svg = svg.replace("<svg", `<svg viewBox="0 0 ${widthMatch[1]} ${heightMatch[1]}"`);
    }
  }

  return svg;
}
