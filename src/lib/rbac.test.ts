import { describe, expect, it } from "vitest";
import { can, canAny, getAccessibleModules } from "@/lib/rbac";

describe("can", () => {
  it("denies an unauthenticated caller", () => {
    expect(can(undefined, "patients", "view")).toBe(false);
  });

  it("grants every action to the super admin", () => {
    expect(can("super_admin", "settings", "manage")).toBe(true);
    expect(can("super_admin", "patients", "delete")).toBe(true);
  });

  it("allows a doctor to view and edit patients", () => {
    expect(can("doctor", "patients", "view")).toBe(true);
    expect(can("doctor", "patients", "edit")).toBe(true);
  });

  it("forbids a doctor from creating billing records", () => {
    expect(can("doctor", "billing", "view")).toBe(true);
    expect(can("doctor", "billing", "create")).toBe(false);
  });

  it("forbids a doctor from managing users", () => {
    expect(can("doctor", "users", "view")).toBe(true);
    expect(can("doctor", "users", "manage")).toBe(false);
  });

  it("forbids a receptionist from accessing the laboratory module", () => {
    expect(can("receptionist", "lab", "view")).toBe(false);
    expect(can("receptionist", "patients", "create")).toBe(true);
  });

  it("forbids access to modules outside the role matrix", () => {
    expect(can("receptionist", "finance", "view")).toBe(false);
  });
});

describe("canAny", () => {
  it("is false for an unauthenticated caller", () => {
    expect(canAny(undefined, "dashboard")).toBe(false);
  });

  it("is true when the role has at least one action", () => {
    expect(canAny("doctor", "patients")).toBe(true);
  });

  it("is false when the role has no actions on the module", () => {
    expect(canAny("receptionist", "lab")).toBe(false);
  });
});

describe("getAccessibleModules", () => {
  it("returns nothing for an unauthenticated caller", () => {
    expect(getAccessibleModules(undefined)).toEqual([]);
  });

  it("includes the dashboard for every staff role", () => {
    expect(getAccessibleModules("doctor")).toContain("dashboard");
    expect(getAccessibleModules("receptionist")).toContain("dashboard");
  });

  it("excludes modules the role cannot access", () => {
    expect(getAccessibleModules("receptionist")).not.toContain("lab");
  });
});
