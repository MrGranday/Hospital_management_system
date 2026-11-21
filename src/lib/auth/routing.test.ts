import { describe, expect, it } from "vitest";

import type { SessionClaims } from "./claims";
import { resolveRoute } from "./routing";

const superAdminClaims: SessionClaims = {
  userId: "cde2f6fb-b267-4029-84be-c6ffb0e6323e",
  hospitalId: null,
  role: "super_admin",
  permissions: ["audit:read", "hospitals:manage", "hospitals:read"],
  mustChangePassword: false,
  username: "admin",
  aal: "aal1",
};

const hospitalAdminClaims: SessionClaims = {
  userId: "243d7ba0-0c1f-4c6d-91d7-b3fe3a5304d9",
  hospitalId: "a35023d7-05ad-494d-8499-460f71c301c9",
  role: "hospital_admin",
  permissions: ["users:read", "patients:read"],
  mustChangePassword: false,
  username: "ahmadshah",
  aal: "aal1",
};

const doctorClaims: SessionClaims = {
  userId: "55555555-0c1f-4c6d-91d7-b3fe3a5304d9",
  hospitalId: "a35023d7-05ad-494d-8499-460f71c301c9",
  role: "doctor",
  permissions: ["patients:read"],
  mustChangePassword: false,
  username: "doctor1",
  aal: "aal1",
};

describe("resolveRoute", () => {
  describe("unauthenticated", () => {
    it("allows access to public paths like /login", () => {
      expect(resolveRoute(null, "/login")).toEqual({ type: "pass" });
    });

    it("redirects protected paths to /login", () => {
      expect(resolveRoute(null, "/")).toEqual({ type: "redirect", target: "/login" });
      expect(resolveRoute(null, "/platform")).toEqual({ type: "redirect", target: "/login" });
      expect(resolveRoute(null, "/mfa")).toEqual({ type: "redirect", target: "/login" });
      expect(resolveRoute(null, "/patients")).toEqual({ type: "redirect", target: "/login" });
    });
  });

  describe("must change password", () => {
    const claims = { ...superAdminClaims, mustChangePassword: true };

    it("allows access to /change-password", () => {
      expect(resolveRoute(claims, "/change-password")).toEqual({ type: "pass" });
    });

    it("redirects other paths to /change-password", () => {
      expect(resolveRoute(claims, "/")).toEqual({ type: "redirect", target: "/change-password" });
      expect(resolveRoute(claims, "/platform")).toEqual({ type: "redirect", target: "/change-password" });
      expect(resolveRoute(claims, "/mfa")).toEqual({ type: "redirect", target: "/change-password" });
    });
  });

  describe("MFA required but not satisfied", () => {
    it("allows super_admin on /mfa without redirecting back to /platform (no loop)", () => {
      expect(resolveRoute(superAdminClaims, "/mfa")).toEqual({ type: "pass" });
    });

    it("redirects super_admin from /platform or / to /mfa", () => {
      expect(resolveRoute(superAdminClaims, "/platform")).toEqual({ type: "redirect", target: "/mfa" });
      expect(resolveRoute(superAdminClaims, "/platform/hospitals")).toEqual({ type: "redirect", target: "/mfa" });
      expect(resolveRoute(superAdminClaims, "/")).toEqual({ type: "redirect", target: "/mfa" });
      expect(resolveRoute(superAdminClaims, "/login")).toEqual({ type: "redirect", target: "/mfa" });
    });

    it("allows hospital_admin on /mfa and redirects other paths to /mfa", () => {
      expect(resolveRoute(hospitalAdminClaims, "/mfa")).toEqual({ type: "pass" });
      expect(resolveRoute(hospitalAdminClaims, "/")).toEqual({ type: "redirect", target: "/mfa" });
      expect(resolveRoute(hospitalAdminClaims, "/patients")).toEqual({ type: "redirect", target: "/mfa" });
    });
  });

  describe("MFA satisfied or not required", () => {
    const superAdminAal2: SessionClaims = { ...superAdminClaims, aal: "aal2" };
    const hospitalAdminAal2: SessionClaims = { ...hospitalAdminClaims, aal: "aal2" };

    it("super_admin with aal2 goes to /platform and stays in /platform", () => {
      expect(resolveRoute(superAdminAal2, "/platform")).toEqual({ type: "pass" });
      expect(resolveRoute(superAdminAal2, "/platform/hospitals")).toEqual({ type: "pass" });
      expect(resolveRoute(superAdminAal2, "/mfa")).toEqual({ type: "redirect", target: "/platform" });
      expect(resolveRoute(superAdminAal2, "/login")).toEqual({ type: "redirect", target: "/platform" });
      expect(resolveRoute(superAdminAal2, "/")).toEqual({ type: "redirect", target: "/platform" });
    });

    it("hospital_admin with aal2 stays in hospital routes and is blocked from /platform", () => {
      expect(resolveRoute(hospitalAdminAal2, "/")).toEqual({ type: "pass" });
      expect(resolveRoute(hospitalAdminAal2, "/patients")).toEqual({ type: "pass" });
      expect(resolveRoute(hospitalAdminAal2, "/mfa")).toEqual({ type: "redirect", target: "/" });
      expect(resolveRoute(hospitalAdminAal2, "/login")).toEqual({ type: "redirect", target: "/" });
      expect(resolveRoute(hospitalAdminAal2, "/platform")).toEqual({ type: "redirect", target: "/" });
      expect(resolveRoute(hospitalAdminAal2, "/platform/hospitals")).toEqual({ type: "redirect", target: "/" });
    });

    it("doctor does not require MFA and stays in hospital routes", () => {
      expect(resolveRoute(doctorClaims, "/")).toEqual({ type: "pass" });
      expect(resolveRoute(doctorClaims, "/patients")).toEqual({ type: "pass" });
      expect(resolveRoute(doctorClaims, "/mfa")).toEqual({ type: "redirect", target: "/" });
      expect(resolveRoute(doctorClaims, "/platform")).toEqual({ type: "redirect", target: "/" });
    });
  });
});
