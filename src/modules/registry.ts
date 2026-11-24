// Module registry for MediCore HMS.
// Each module declares itself in module.config.ts. This registry imports
// every module.config.ts and exports a typed registry used by the sidebar,
// role editor, dashboard, route guards, and seed generator.
// See PLATFORM_MODULES.md §11.

import { ModuleConfigSchema, type ModuleConfig, type ModuleConfigInput } from "@/modules/schema";

// Import every module config. Core modules first, then feature modules.
import receptionConfig from "@/features/reception/module.config";
import opdConfig from "@/features/opd/module.config";
import labConfig from "@/features/lab/module.config";
import radiologyConfig from "@/features/radiology/module.config";
import pharmacyConfig from "@/features/pharmacy/module.config";
import inventoryConfig from "@/features/inventory/module.config";
import financeConfig from "@/features/finance/module.config";
import hrConfig from "@/features/hr/module.config";
import inpatientConfig from "@/features/inpatient/module.config";

export { ModuleConfigSchema, type ModuleConfig, type ModuleConfigInput };

export interface ModuleDefinition {
  key: string;
  name: string;
  description?: string;
  requires: string[];
  softRequires: string[];
  sort: number;
  isDeferred: boolean;
  nav: Array<{ label: string; href: string; permission: string }>;
  permissions: Array<{
    key: string;
    label: string;
    clinicalAuthoring: boolean;
    sodGroup?: string;
  }>;
  dashboardWidgets: Array<{
    key: string;
    permission: string;
    component: string;
  }>;
}

// The registry is populated by importing every module.config.ts above.
// Order matters: core modules first, then feature modules.

const registeredModules: ModuleConfig[] = [
  receptionConfig,
  opdConfig,
  labConfig,
  radiologyConfig,
  pharmacyConfig,
  inventoryConfig,
  financeConfig,
  hrConfig,
  inpatientConfig,
];

export function registerModule(config: ModuleConfig): void {
  const parsed = ModuleConfigSchema.parse(config);
  registeredModules.push(parsed);
}

export function getModules(): readonly ModuleConfig[] {
  return registeredModules;
}

export function getModule(key: string): ModuleConfig | undefined {
  return registeredModules.find((m) => m.key === key);
}

export function getEnabledModuleKeys(enabledKeys: readonly string[]): string[] {
  return registeredModules
    .filter((m) => enabledKeys.includes(m.key))
    .map((m) => m.key);
}

export function getModuleDependencies(key: string): string[] {
  const mod = getModule(key);
  return mod ? mod.requires : [];
}

export function getAllPermissions(): Array<{
  key: string;
  label: string;
  clinicalAuthoring: boolean;
  sodGroup?: string;
  moduleKey: string;
}> {
  const result: Array<{
    key: string;
    label: string;
    clinicalAuthoring: boolean;
    sodGroup?: string;
    moduleKey: string;
  }> = [];
  for (const mod of registeredModules) {
    for (const perm of mod.permissions) {
      result.push({
        key: perm.key,
        label: perm.label,
        clinicalAuthoring: perm.clinicalAuthoring,
        sodGroup: perm.sodGroup,
        moduleKey: mod.key,
      });
    }
  }
  return result;
}

export function validateDependencies(enabledKeys: readonly string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const enabledSet = new Set(enabledKeys);
  for (const mod of registeredModules) {
    if (!enabledSet.has(mod.key)) continue;
    for (const dep of mod.requires) {
      if (!enabledSet.has(dep)) {
        errors.push(
          `Module "${mod.key}" requires "${dep}" but it is not enabled.`
        );
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
