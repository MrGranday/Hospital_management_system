"use server";

import { redirect } from "next/navigation";

import { isMfaRequiredForRole, mfaVerifySchema } from "@/lib/auth/mfa";
import { requireAuthenticatedUser } from "@/server/auth/require-permission";
import { createSupabaseServerClient } from "@/server/supabase/server";

export type MfaEnrolmentState =
  | { error: string }
  | { factorId: string; qrCode: string; secret: string }
  | undefined;

export type MfaVerifyState = { error: string } | undefined;

const GENERIC_START_ERROR = "Could not start authenticator setup. Try again.";
const GENERIC_CODE_ERROR = "That code did not match. Check your authenticator app and try again.";

export async function startMfaEnrolmentAction(
  _previous: MfaEnrolmentState,
  _formData: FormData,
): Promise<MfaEnrolmentState> {
  const context = await requireAuthenticatedUser();
  if (!isMfaRequiredForRole(context.role) || context.aal === "aal2") {
    return { error: "This account does not need a new authenticator." };
  }
  if (context.mustChangePassword) {
    return { error: "Change your password before setting up the authenticator." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase.auth.mfa.listFactors();
  for (const factor of existing?.all ?? []) {
    if (factor.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "MediCore",
  });

  if (error || !data) return { error: GENERIC_START_ERROR };

  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

export async function verifyMfaAction(
  _previous: MfaVerifyState,
  formData: FormData,
): Promise<MfaVerifyState> {
  const context = await requireAuthenticatedUser();

  const parsed = mfaVerifySchema.safeParse({
    factorId: formData.get("factorId"),
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid code." };
  }

  const supabase = await createSupabaseServerClient();

  const challenge = await supabase.auth.mfa.challenge({ factorId: parsed.data.factorId });
  if (challenge.error || !challenge.data) return { error: GENERIC_CODE_ERROR };

  const verify = await supabase.auth.mfa.verify({
    factorId: parsed.data.factorId,
    challengeId: challenge.data.id,
    code: parsed.data.code,
  });

  if (verify.error) return { error: GENERIC_CODE_ERROR };

  redirect(context.role === "super_admin" ? "/platform" : "/");
}
