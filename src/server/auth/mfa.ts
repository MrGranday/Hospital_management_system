import "server-only";

import { isMfaRequiredForRole, isMfaSatisfied } from "@/lib/auth/mfa";
import { createSupabaseServerClient } from "@/server/supabase/server";

export type MfaState = {
  required: boolean;
  satisfied: boolean;
  verifiedFactorId: string | null;
};

export async function getMfaState(role: string, aal: string | null): Promise<MfaState> {
  const required = isMfaRequiredForRole(role);
  const satisfied = isMfaSatisfied(role, aal);

  if (!required || satisfied) {
    return { required, satisfied, verifiedFactorId: null };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const verified = data?.totp.find((factor) => factor.status === "verified");

  return { required, satisfied, verifiedFactorId: verified?.id ?? null };
}
