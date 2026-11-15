import "server-only";

import { createSupabaseServerClient } from "@/server/supabase/server";

export type AuthContext = {
  userId: string;
  hospitalId: string | null;
  role: string;
  permissions: readonly string[];
  mustChangePassword: boolean;
};

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readPermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const metadata = user.app_metadata;
  const hospitalId = readString(metadata.hospital_id);

  return {
    userId: user.id,
    hospitalId: hospitalId === "" ? null : hospitalId,
    role: readString(metadata.role) ?? "",
    permissions: readPermissions(metadata.permissions),
    mustChangePassword: metadata.must_change_password === true,
  };
}
