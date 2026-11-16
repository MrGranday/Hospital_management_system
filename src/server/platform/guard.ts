import "server-only";

import { getAuthContext, type AuthContext } from "@/server/auth/session";

// Super admin powers come from the JWT claims issued by the access-token hook.
// Every platform action re-checks here on the server; UI hiding is cosmetic.
export async function getSuperAdminContext(): Promise<AuthContext | null> {
  const context = await getAuthContext();
  if (!context) return null;
  if (context.role !== "super_admin") return null;
  return context;
}
