import "server-only";

import { randomBytes } from "node:crypto";

import { toLoginIdentifier } from "@/lib/auth/identifier";
import type { HospitalCreateInput } from "@/lib/platform/schema";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { createSupabaseServerClient } from "@/server/supabase/server";

const DEFAULT_COUNTERS = [
  "mrn",
  "invoice",
  "lab_order",
  "purchase_order",
  "goods_receipt",
  "expense",
] as const;

export type HospitalStatus = "active" | "suspended" | "archived";

export type HospitalSummary = {
  id: string;
  code: string;
  name: string;
  status: HospitalStatus;
  country: string;
  timezone: string;
  currency: string;
  created_at: string;
};

export type ProvisionResult =
  | { ok: true; hospitalId: string; code: string; username: string; tempPassword: string }
  | { ok: false; error: string };

export type ResetPasswordResult =
  | { ok: true; username: string; tempPassword: string }
  | { ok: false; error: string };

const HOSPITAL_COLUMNS = "id, code, name, status, country, timezone, currency, created_at";

export async function listHospitals(): Promise<HospitalSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("hospitals")
    .select(HOSPITAL_COLUMNS)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as HospitalSummary[];
}

export async function getHospital(id: string): Promise<HospitalSummary | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("hospitals")
    .select(HOSPITAL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as HospitalSummary | null) ?? null;
}

export async function listPlatformAuditEvents(limit = 100) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("list_platform_audit_events", {
    p_limit: limit,
  });

  if (error) throw new Error(error.message);
  return data ?? [];
}

function generateTempPassword(): string {
  return randomBytes(12).toString("base64url");
}

export async function provisionHospital(
  input: HospitalCreateInput,
  actorId: string,
): Promise<ProvisionResult> {
  const admin = createSupabaseAdminClient();
  const tempPassword = generateTempPassword();
  const email = toLoginIdentifier(input.code, input.adminUsername);

  let hospitalId: string | null = null;
  let createdUserId: string | null = null;

  try {
    const { data: hospital, error: hospitalError } = await admin
      .from("hospitals")
      .insert({
        code: input.code,
        name: input.name,
        country: input.country,
        timezone: input.timezone,
        currency: input.currency,
        created_by: actorId,
      })
      .select("id")
      .single();

    if (hospitalError) throw new Error(hospitalError.message);
    hospitalId = hospital.id;
    const newHospitalId = hospital.id;

    const { error: settingsError } = await admin.from("hospital_settings").insert({
      hospital_id: newHospitalId,
      currency: input.currency,
      timezone: input.timezone,
    });
    if (settingsError) throw new Error(settingsError.message);

    const { error: countersError } = await admin.from("hospital_counters").insert(
      DEFAULT_COUNTERS.map((name) => ({ hospital_id: newHospitalId, name })),
    );
    if (countersError) throw new Error(countersError.message);

    const { data: createdUser, error: userError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });
    if (userError) throw new Error(userError.message);
    createdUserId = createdUser.user.id;

    const { error: profileError } = await admin.from("profiles").insert({
      user_id: createdUserId,
      hospital_id: newHospitalId,
      username: input.adminUsername,
      full_name: input.adminFullName,
      must_change_password: true,
      created_by: actorId,
    });
    if (profileError) throw new Error(profileError.message);

    const { data: role, error: roleError } = await admin
      .from("roles")
      .select("id")
      .eq("key", "hospital_admin")
      .single();
    if (roleError) throw new Error(roleError.message);

    const { error: grantError } = await admin
      .from("user_roles")
      .insert({ user_id: createdUserId, role_id: role.id });
    if (grantError) throw new Error(grantError.message);

    return {
      ok: true,
      hospitalId,
      code: input.code,
      username: input.adminUsername,
      tempPassword,
    };
  } catch (error) {
    if (createdUserId) {
      await admin.from("user_roles").delete().eq("user_id", createdUserId);
      await admin.from("profiles").delete().eq("user_id", createdUserId);
      await admin.auth.admin.deleteUser(createdUserId);
    }
    if (hospitalId) {
      await admin.from("hospital_counters").delete().eq("hospital_id", hospitalId);
      await admin.from("hospital_settings").delete().eq("hospital_id", hospitalId);
      await admin.from("hospitals").delete().eq("id", hospitalId);
    }

    const message = error instanceof Error ? error.message : "Provisioning failed.";
    if (message.includes("duplicate key") || message.includes("already been registered")) {
      return { ok: false, error: "That hospital code or administrator username is already in use." };
    }
    return { ok: false, error: "Could not create the hospital. Nothing was saved; try again." };
  }
}

export async function setHospitalStatus(
  hospitalId: string,
  status: "active" | "suspended",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("hospitals").update({ status }).eq("id", hospitalId);

  if (error) return { ok: false, error: "Could not update the hospital status." };
  return { ok: true };
}

export async function resetHospitalAdminPassword(
  hospitalId: string,
): Promise<ResetPasswordResult> {
  const admin = createSupabaseAdminClient();

  const { data: role, error: roleError } = await admin
    .from("roles")
    .select("id")
    .eq("key", "hospital_admin")
    .single();
  if (roleError) return { ok: false, error: "Hospital administrator role is missing." };

  const { data: grants, error: grantError } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("role_id", role.id);
  if (grantError) return { ok: false, error: "Could not load the hospital administrator." };

  const candidateIds = (grants ?? []).map((grant) => grant.user_id);
  if (candidateIds.length === 0) {
    return { ok: false, error: "This hospital has no administrator account." };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("user_id, username")
    .eq("hospital_id", hospitalId)
    .in("user_id", candidateIds)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (profileError) return { ok: false, error: "Could not load the administrator profile." };
  if (!profile?.username) {
    return { ok: false, error: "This hospital has no administrator account." };
  }

  const tempPassword = generateTempPassword();
  const { error: userError } = await admin.auth.admin.updateUserById(profile.user_id, {
    password: tempPassword,
  });
  if (userError) return { ok: false, error: "Could not reset the administrator password." };

  const { error: flagError } = await admin
    .from("profiles")
    .update({ must_change_password: true })
    .eq("user_id", profile.user_id);
  if (flagError) return { ok: false, error: "Password reset, but the change flag was not set." };

  return { ok: true, username: profile.username, tempPassword };
}
