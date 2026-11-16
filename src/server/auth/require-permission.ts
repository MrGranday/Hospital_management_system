import "server-only";

import { getAuthContext, type AuthContext } from "@/server/auth/session";

export class UnauthorizedError extends Error {
  readonly code = "UNAUTHORIZED";

  constructor() {
    super("Authentication required");
  }
}

export class ForbiddenError extends Error {
  readonly code = "FORBIDDEN";

  constructor(permission: string) {
    super(`Missing permission: ${permission}`);
  }
}

export class PasswordChangeRequiredError extends Error {
  readonly code = "PASSWORD_CHANGE_REQUIRED";

  constructor() {
    super("Password change required");
  }
}

export async function requireAuthenticatedUser(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) throw new UnauthorizedError();
  return context;
}

export async function requirePermission(permission: string): Promise<AuthContext> {
  const context = await requireAuthenticatedUser();
  if (!context.permissions.includes(permission)) throw new ForbiddenError(permission);
  if (context.mustChangePassword) throw new PasswordChangeRequiredError();
  return context;
}

export function hasPermission(context: AuthContext, permission: string): boolean {
  return context.permissions.includes(permission);
}
