import { describe, expect, it } from "vitest";

import { parseSessionClaims } from "./claims";

const baseClaims = {
  sub: "9f1f4f2e-0f1a-4c42-9a4f-1c2d3e4f5a6b",
  aal: "aal1",
  email: "admin@platform.medicore.invalid",
  app_metadata: {
    hospital_id: "3b3a1c1e-5a6f-4c1d-8e2f-7a8b9c0d1e2f",
    role: "hospital_admin",
    permissions: ["patients:read", "users:read"],
    must_change_password: true,
    username: "admin",
  },
};

describe("parseSessionClaims", () => {
  it("reads the tenant and permission claims from the verified JWT", () => {
    expect(parseSessionClaims(baseClaims)).toEqual({
      userId: baseClaims.sub,
      hospitalId: baseClaims.app_metadata.hospital_id,
      role: "hospital_admin",
      permissions: ["patients:read", "users:read"],
      mustChangePassword: true,
      username: "admin",
      aal: "aal1",
    });
  });

  it("treats an empty hospital_id as no hospital (super admin)", () => {
    const claims = { ...baseClaims, app_metadata: { ...baseClaims.app_metadata, hospital_id: "" } };
    expect(parseSessionClaims(claims)?.hospitalId).toBeNull();
  });

  it("returns null without a subject", () => {
    expect(parseSessionClaims({ ...baseClaims, sub: undefined })).toBeNull();
    expect(parseSessionClaims({ ...baseClaims, sub: "" })).toBeNull();
    expect(parseSessionClaims(null)).toBeNull();
    expect(parseSessionClaims("token")).toBeNull();
  });

  it("falls back to the email as the username", () => {
    const claims = {
      ...baseClaims,
      app_metadata: { ...baseClaims.app_metadata, username: undefined },
    };
    expect(parseSessionClaims(claims)?.username).toBe(baseClaims.email);
  });

  it("only treats a literal boolean true as a forced password change", () => {
    const truthy = { ...baseClaims, app_metadata: { ...baseClaims.app_metadata, must_change_password: "true" } };
    const absent = { ...baseClaims, app_metadata: { ...baseClaims.app_metadata, must_change_password: undefined } };
    expect(parseSessionClaims(truthy)?.mustChangePassword).toBe(false);
    expect(parseSessionClaims(absent)?.mustChangePassword).toBe(false);
  });

  it("reads the authenticator assurance level", () => {
    expect(parseSessionClaims(baseClaims)?.aal).toBe("aal1");
    expect(parseSessionClaims({ ...baseClaims, aal: "aal2" })?.aal).toBe("aal2");
    expect(parseSessionClaims({ ...baseClaims, aal: "" })?.aal).toBeNull();
  });

  it("ignores malformed permissions and missing app_metadata", () => {
    const malformed = {
      ...baseClaims,
      app_metadata: { ...baseClaims.app_metadata, permissions: ["ok", 1, null, "fine"] },
    };
    expect(parseSessionClaims(malformed)?.permissions).toEqual(["ok", "fine"]);
    expect(parseSessionClaims({ sub: baseClaims.sub })?.permissions).toEqual([]);
    expect(parseSessionClaims({ sub: baseClaims.sub })?.role).toBe("");
  });
});
