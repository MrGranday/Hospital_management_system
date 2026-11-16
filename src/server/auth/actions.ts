"use server";

import { redirect } from "next/navigation";

import { loginInputSchema, passwordChangeSchema, toLoginIdentifier } from "@/lib/auth/identifier";
import { getAuthContext } from "@/server/auth/session";
import { requireAuthenticatedUser } from "@/server/auth/require-permission";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { createSupabaseServerClient } from "@/server/supabase/server";

export type AuthFormState = { error: string } | undefined;

const GENERIC_LOGIN_ERROR = "Hospital code, username or password is incorrect.";

export async function signInAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginInputSchema.safeParse({
    hospitalCode: formData.get("hospitalCode"),
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: GENERIC_LOGIN_ERROR };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: toLoginIdentifier(parsed.data.hospitalCode, parsed.data.username),
    password: parsed.data.password,
  });

  if (error) return { error: GENERIC_LOGIN_ERROR };

  const context = await getAuthContext();
  if (context?.mustChangePassword) redirect("/change-password");
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function changePasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const context = await requireAuthenticatedUser();

  const parsed = passwordChangeSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid new password." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Could not update the password. Try again." };

  const admin = createSupabaseAdminClient();
  const { error: flagError } = await admin
    .from("profiles")
    .update({ must_change_password: false })
    .eq("user_id", context.userId);

  if (flagError) {
    return {
      error: "Password changed, but the account could not be unlocked. Contact an administrator.",
    };
  }

  await supabase.auth.refreshSession();
  redirect("/");
}
