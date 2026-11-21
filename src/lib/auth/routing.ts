import type { SessionClaims } from "@/lib/auth/claims";
import { isMfaSatisfied } from "@/lib/auth/mfa";

export const PUBLIC_PATHS = new Set(["/login"]);

export type RouteDecision =
  | { type: "pass" }
  | { type: "redirect"; target: string };

export function resolveRoute(
  claims: SessionClaims | null,
  pathname: string,
): RouteDecision {
  if (!claims) {
    return PUBLIC_PATHS.has(pathname)
      ? { type: "pass" }
      : { type: "redirect", target: "/login" };
  }

  if (claims.mustChangePassword) {
    return pathname === "/change-password"
      ? { type: "pass" }
      : { type: "redirect", target: "/change-password" };
  }

  const mfaSatisfied = isMfaSatisfied(claims.role, claims.aal);
  if (!mfaSatisfied) {
    return pathname === "/mfa"
      ? { type: "pass" }
      : { type: "redirect", target: "/mfa" };
  }

  const isSuperAdmin = claims.role === "super_admin";
  const homePath = isSuperAdmin ? "/platform" : "/";

  if (pathname === "/mfa" || pathname === "/login" || pathname === "/change-password") {
    return { type: "redirect", target: homePath };
  }

  const isPlatformPath = pathname === "/platform" || pathname.startsWith("/platform/");

  if (isSuperAdmin && !isPlatformPath) {
    return { type: "redirect", target: "/platform" };
  }

  if (!isSuperAdmin && isPlatformPath) {
    return { type: "redirect", target: "/" };
  }

  return { type: "pass" };
}
