import "server-only";

import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export class ModuleNotEnabledError extends Error {
  readonly code = "MODULE_NOT_ENABLED";
  constructor(public moduleKey: string) {
    super(`Module not enabled: ${moduleKey}`);
  }
}

export class ModulePermissionError extends Error {
  readonly code = "MODULE_PERMISSION_DENIED";
  constructor(public moduleKey: string, public permission: string) {
    super(`Missing module permission: ${permission}`);
  }
}

function getEnabledModules(claims: unknown): string[] {
  const appMetadata =
    claims && typeof claims === "object" && "app_metadata" in claims
      ? (claims as { app_metadata?: unknown }).app_metadata
      : undefined;
  const mods =
    appMetadata && typeof appMetadata === "object" && "modules" in appMetadata
      ? (appMetadata as { modules?: unknown }).modules
      : undefined;
  if (!Array.isArray(mods)) return [];
  return mods.filter((m): m is string => typeof m === "string");
}

export async function requireModule(moduleKey: string) {
  const context = await getAuthContext();
  if (!context) {
    throw new Error("Authentication required");
  }

  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  const enabledModules = getEnabledModules(claims?.claims);

  if (!enabledModules.includes(moduleKey)) {
    throw new ModuleNotEnabledError(moduleKey);
  }

  return context;
}

export async function requireModulePermission(
  moduleKey: string,
  permission: string
) {
  await requireModule(moduleKey);

  const context = await getAuthContext();
  if (!context) {
    throw new Error("Authentication required");
  }

  if (!context.permissions.includes(permission)) {
    throw new ModulePermissionError(moduleKey, permission);
  }

  return context;
}

export function hasModulePermission(
  context: { permissions: readonly string[] },
  moduleKey: string,
  permission: string
): boolean {
  return context.permissions.includes(permission);
}
