import "server-only";

import { randomBytes } from "node:crypto";

import { toLoginIdentifier } from "@/lib/auth/identifier";
import type { HospitalCreateInput } from "@/lib/platform/schema";
import { getSuperAdminContext } from "@/server/platform/guard";
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

type RpcResult = { data: unknown; error: { message: string } | null };

async function callRpc(
  supabase: { rpc: (name: string, params?: Record<string, unknown>) => Promise<RpcResult> },
  name: string,
  params?: Record<string, unknown>,
): Promise<RpcResult> {
  return supabase.rpc(name, params ?? {});
}

export async function listHospitals(): Promise<HospitalSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("hospitals")
    .select(HOSPITAL_COLUMNS)
    .order("name");

  if (error) {
    const admin = createSupabaseAdminClient();
    const { data: adminData, error: adminError } = await admin
      .from("hospitals")
      .select(HOSPITAL_COLUMNS)
      .order("name");
    if (adminError) throw new Error(adminError.message);
    return (adminData ?? []) as HospitalSummary[];
  }
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

export type PlatformAuditEvent = {
  id: string | number;
  occurred_at: string;
  action: string;
  table_name: string;
  actor_role: string | null;
  record_id: string | null;
};

export async function listPlatformAuditEvents(limit = 100): Promise<PlatformAuditEvent[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("list_platform_audit_events", {
      p_limit: limit,
    });

    if (error) return [];
    return (data as unknown as PlatformAuditEvent[] ?? []) as PlatformAuditEvent[];
  } catch {
    return [];
  }
}

function generateTempPassword(): string {
  return randomBytes(12).toString("base64url");
}

export async function provisionHospital(
  input: HospitalCreateInput,
  actorId: string,
): Promise<ProvisionResult> {
  const context = await getSuperAdminContext();
  if (!context) {
    return { ok: false, error: "Super admin authentication required." };
  }

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
      .maybeSingle();
    if (roleError || !role) throw new Error(roleError?.message ?? "Role missing");

    const { error: grantError } = await admin
      .from("user_roles")
      .insert({
        user_id: createdUserId,
        role_id: role.id,
        assigned_by: actorId,
      });
    if (grantError) throw new Error(`Role assignment error: ${grantError.message}`);

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
    return { ok: false, error: `Could not create hospital: ${message}` };
  }
}

export type PlatformDashboardMetrics = {
  totalHospitals: number;
  activeHospitals: number;
  suspendedHospitals: number;
  totalUsers: number;
};

export async function getPlatformDashboardMetrics(): Promise<PlatformDashboardMetrics> {
  const admin = createSupabaseAdminClient();
  const { data: hospitals, error: hError } = await admin
    .from("hospitals")
    .select("status");

  if (hError) throw new Error(hError.message);

  const totalHospitals = hospitals?.length ?? 0;
  const activeHospitals = hospitals?.filter((h) => h.status === "active").length ?? 0;
  const suspendedHospitals = hospitals?.filter((h) => h.status === "suspended").length ?? 0;

  const { count: usersCount } = await admin
    .from("profiles")
    .select("user_id", { count: "exact", head: true })
    .not("hospital_id", "is", null);

  return {
    totalHospitals,
    activeHospitals,
    suspendedHospitals,
    totalUsers: usersCount ?? 0,
  };
}

export async function setHospitalStatus(
  hospitalId: string,
  status: "active" | "suspended",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const context = await getSuperAdminContext();
  if (!context) {
    return { ok: false, error: "Super admin authentication required." };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("hospitals").update({ status }).eq("id", hospitalId);

  if (error) return { ok: false, error: "Could not update the hospital status." };
  return { ok: true };
}

export async function resetHospitalAdminPassword(
  hospitalId: string,
): Promise<ResetPasswordResult> {
  const context = await getSuperAdminContext();
  if (!context) {
    return { ok: false, error: "Super admin authentication required." };
  }

  const admin = createSupabaseAdminClient();

  const { data: role, error: roleError } = await admin
    .from("roles")
    .select("id")
    .eq("key", "hospital_admin")
    .maybeSingle();
  if (roleError || !role) {
    return { ok: false, error: "Hospital administrator role is missing." };
  }

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
