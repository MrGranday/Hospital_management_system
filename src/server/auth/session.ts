import "server-only";

import { parseSessionClaims } from "@/lib/auth/claims";
import { createSupabaseServerClient } from "@/server/supabase/server";

export type AuthContext = {
  userId: string;
  hospitalId: string | null;
  role: string;
  permissions: readonly string[];
  mustChangePassword: boolean;
  username: string;
  fullName: string;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data) return null;

  const claims = parseSessionClaims(data.claims);
  if (!claims) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, must_change_password")
    .eq("user_id", claims.userId)
    .maybeSingle();

  return {
    userId: claims.userId,
    hospitalId: claims.hospitalId,
    role: claims.role,
    permissions: claims.permissions,
    mustChangePassword: profile?.must_change_password ?? claims.mustChangePassword,
    username: profile?.username ?? claims.username,
    fullName: profile?.full_name ?? claims.username,
  };
}
