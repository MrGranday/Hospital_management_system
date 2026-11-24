import { describe, expect, it, vi } from "vitest";

import {
  hasModulePermission,
  ModuleNotEnabledError,
  ModulePermissionError,
} from "@/server/auth/module-permission";

describe("Module Permission Utilities", () => {
  it("creates custom error instances with appropriate codes", () => {
    const notEnabled = new ModuleNotEnabledError("pharmacy");
    expect(notEnabled.code).toBe("MODULE_NOT_ENABLED");
    expect(notEnabled.moduleKey).toBe("pharmacy");
    expect(notEnabled.message).toContain("pharmacy");

    const denied = new ModulePermissionError("opd", "opd:note:create");
    expect(denied.code).toBe("MODULE_PERMISSION_DENIED");
    expect(denied.moduleKey).toBe("opd");
    expect(denied.permission).toBe("opd:note:create");
  });

  it("checks whether an auth context contains a specific module permission", () => {
    const context = {
      permissions: ["reception:patient:read", "reception:patient:create"],
    };

    expect(
      hasModulePermission(context, "reception", "reception:patient:read")
    ).toBe(true);
    expect(
      hasModulePermission(context, "reception", "reception:patient:archive")
    ).toBe(false);
    expect(
      hasModulePermission(context, "opd", "opd:note:create")
    ).toBe(false);
  });
});
