// defineModule — type-safe module configuration builder.
// Each module exports its config from module.config.ts using this helper.
// See PLATFORM_MODULES.md §11.

import { ModuleConfigSchema, type ModuleConfig, type ModuleConfigInput } from "@/modules/schema";

export function defineModule(config: ModuleConfigInput): ModuleConfig {
  return ModuleConfigSchema.parse(config);
}
