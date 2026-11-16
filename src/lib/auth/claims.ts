export type SessionClaims = {
  userId: string;
  hospitalId: string | null;
  role: string;
  permissions: readonly string[];
  mustChangePassword: boolean;
  username: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readPermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function parseSessionClaims(claims: unknown): SessionClaims | null {
  const payload = asRecord(claims);
  const userId = readString(payload?.sub);
  if (!payload || !userId) return null;

  const appMetadata = asRecord(payload.app_metadata) ?? {};
  const hospitalId = readString(appMetadata.hospital_id);
  const email = readString(payload.email);
  const username = readString(appMetadata.username) ?? email ?? "";

  return {
    userId,
    hospitalId,
    role: readString(appMetadata.role) ?? "",
    permissions: readPermissions(appMetadata.permissions),
    mustChangePassword: appMetadata.must_change_password === true,
    username,
  };
}
