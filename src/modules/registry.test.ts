import { describe, expect, it } from "vitest";

import {
  getAllPermissions,
  getModule,
  getModules,
  validateDependencies,
} from "@/modules/registry";

describe("Module Registry", () => {
  it("registers all core and feature modules defined in the specification", () => {
    const modules = getModules();
    const keys = modules.map((m) => m.key);

    expect(keys).toContain("reception");
    expect(keys).toContain("opd");
    expect(keys).toContain("lab");
    expect(keys).toContain("radiology");
    expect(keys).toContain("pharmacy");
    expect(keys).toContain("inventory");
    expect(keys).toContain("finance");
    expect(keys).toContain("hr");
    expect(keys).toContain("inpatient");
  });

  it("ensures each module has required metadata and permissions", () => {
    const modules = getModules();
    for (const mod of modules) {
      expect(mod.key).toBeTruthy();
      expect(mod.name).toBeTruthy();
      expect(Array.isArray(mod.nav)).toBe(true);
      expect(Array.isArray(mod.permissions)).toBe(true);
      expect(Array.isArray(mod.dashboardWidgets)).toBe(true);
    }
  });

  it("validates dependency rules (e.g. inpatient requires opd)", () => {
    const inpatient = getModule("inpatient");
    expect(inpatient?.requires).toContain("opd");

    // Invalid combination: inpatient enabled without opd
    const invalidCheck = validateDependencies(["inpatient", "pharmacy"]);
    expect(invalidCheck.valid).toBe(false);
    expect(invalidCheck.errors.length).toBeGreaterThan(0);

    // Valid combination: inpatient enabled with opd
    const validCheck = validateDependencies(["reception", "opd", "inpatient"]);
    expect(validCheck.valid).toBe(true);
  });

  it("collects all permissions across all modules", () => {
    const allPerms = getAllPermissions();
    expect(allPerms.length).toBeGreaterThan(0);

    const permKeys = allPerms.map((p) => p.key);
    expect(permKeys).toContain("reception:patient:read");
    expect(permKeys).toContain("opd:note:create");
    expect(permKeys).toContain("lab:result:verify");
    expect(permKeys).toContain("pharmacy:dispense:create");
    expect(permKeys).toContain("finance:invoice:read");
  });
});
