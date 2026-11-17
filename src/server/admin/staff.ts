import "server-only";

import { randomBytes } from "node:crypto";

import { toLoginIdentifier } from "@/lib/auth/identifier";
import type { StaffCreateInput, StaffRoleKey, StaffRoleOption } from "@/lib/staff/schema";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { createSupabaseServerClient } from "@/server/supabase/server";

export type StaffMember = {
  userId: string;
  username: string;
  fullName: string;
  isActive: boolean;
  mustChangePassword: boolean;
  roleKey: string | null;
  roleName: string | null;
  createdAt: string;
};

export type CreatedStaffMember = {
  username: string;
  tempPassword: string;
};

type MutationResult = { ok: true } | { ok: false; error: string };
type CreateResult = ({ ok: true } & CreatedStaffMember) | { ok: false; error: string };
type ResetResult = ({ ok: true } & CreatedStaffMember) | { ok: false; error: string };

function generateTempPassword(): string {
  return randomBytes(12).toString("base64url");
}

export async function listStaff(hospitalId: string): Promise<StaffMember[]> {
  const supabase = await createSupabaseServerClient();

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, is_active, must_change_password, created_at")
    .eq("hospital_id", hospitalId)
    .order("full_name");

  if (profileError) throw new Error(profileError.message);
  if (!profiles || profiles.length === 0) return [];

  const userIds = profiles.map((profile) => profile.user_id);
  const [{ data: grants, error: grantError }, { data: roles, error: roleError }] =
    await Promise.all([
      supabase.from("user_roles").select("user_id, role_id").in("user_id", userIds),
      supabase.from("roles").select("id, key, name"),
    ]);

  if (grantError) throw new Error(grantError.message);
  if (roleError) throw new Error(roleError.message);

  const rolesById = new Map((roles ?? []).map((role) => [role.id, role]));
  const roleByUser = new Map<string, { key: string; name: string }>();
  for (const grant of grants ?? []) {
    const role = rolesById.get(grant.role_id);
    if (role && !roleByUser.has(grant.user_id)) {
      roleByUser.set(grant.user_id, { key: role.key, name: role.name });
    }
  }

  return profiles.map((profile) => {
    const role = roleByUser.get(profile.user_id);
    return {
      userId: profile.user_id,
      username: profile.username ?? "",
      fullName: profile.full_name,
      isActive: profile.is_active,
      mustChangePassword: profile.must_change_password,
      roleKey: role?.key ?? null,
      roleName: role?.name ?? null,
      createdAt: profile.created_at,
    };
  });
}

export async function listAssignableRoles(): Promise<StaffRoleOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("roles")
    .select("key, name")
    .neq("key", "super_admin")
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as StaffRoleOption[];
}

async function loadTarget(
  userId: string,
  hospitalId: string,
): Promise<{ username: string; fullName: string } | null> {
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("user_id, hospital_id, username, full_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile || profile.hospital_id !== hospitalId) return null;

  const { data: grants } = await admin
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId);
  const roleIds = (grants ?? []).map((grant) => grant.role_id);
  if (roleIds.length > 0) {
    const { data: roles } = await admin.from("roles").select("key").in("id", roleIds);
    if ((roles ?? []).some((role) => role.key === "super_admin")) return null;
  }

  return { username: profile.username ?? "", fullName: profile.full_name };
}

export async function createStaffMember(
  hospitalId: string,
  actorId: string,
  input: StaffCreateInput,
): Promise<CreateResult> {
  const admin = createSupabaseAdminClient();

  const { data: hospital, error: hospitalError } = await admin
    .from("hospitals")
    .select("code")
    .eq("id", hospitalId)
    .maybeSingle();
  if (hospitalError || !hospital) {
    return { ok: false, error: "Could not load the hospital." };
  }

  const { data: role, error: roleError } = await admin
    .from("roles")
    .select("id")
    .eq("key", input.role)
    .neq("key", "super_admin")
    .maybeSingle();
  if (roleError || !role) {
    return { ok: false, error: "That role cannot be assigned." };
  }

  const tempPassword = generateTempPassword();
  const email = toLoginIdentifier(hospital.code, input.username);
  let createdUserId: string | null = null;

  try {
    const { data: created, error: userError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });
    if (userError) throw new Error(userError.message);
    createdUserId = created.user.id;

    const { error: profileError } = await admin.from("profiles").insert({
      user_id: createdUserId,
      hospital_id: hospitalId,
      username: input.username,
      full_name: input.fullName,
      must_change_password: true,
      created_by: actorId,
    });
    if (profileError) throw new Error(profileError.message);

    const { error: grantError } = await admin.from("user_roles").insert({
      user_id: createdUserId,
      role_id: role.id,
      assigned_by: actorId,
    });
    if (grantError) throw new Error(grantError.message);

    return { ok: true, username: input.username, tempPassword };
  } catch (error) {
    if (createdUserId) {
      await admin.from("user_roles").delete().eq("user_id", createdUserId);
      await admin.from("profiles").delete().eq("user_id", createdUserId);
      await admin.auth.admin.deleteUser(createdUserId);
    }

    const message = error instanceof Error ? error.message : "";
    if (message.includes("duplicate key") || message.includes("already been registered")) {
      return { ok: false, error: "That username is already in use at this hospital." };
    }
    return { ok: false, error: "Could not create the staff account. Nothing was saved." };
  }
}

export async function setStaffRole(
  actorId: string,
  hospitalId: string,
  userId: string,
  roleKey: StaffRoleKey,
): Promise<MutationResult> {
  if (userId === actorId) {
    return { ok: false, error: "You cannot change your own role." };
  }

  const target = await loadTarget(userId, hospitalId);
  if (!target) return { ok: false, error: "Staff member not found in this hospital." };

  const admin = createSupabaseAdminClient();
  const { data: role, error: roleError } = await admin
    .from("roles")
    .select("id")
    .eq("key", roleKey)
    .neq("key", "super_admin")
    .maybeSingle();
  if (roleError || !role) return { ok: false, error: "That role cannot be assigned." };

  const { data: previous, error: previousError } = await admin
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId);
  if (previousError) return { ok: false, error: "Could not load the current role." };

  const previousRoleIds = (previous ?? []).map((grant) => grant.role_id);

  const { error: clearError } = await admin.from("user_roles").delete().eq("user_id", userId);
  if (clearError) return { ok: false, error: "Could not update the role." };

  const { error: assignError } = await admin
    .from("user_roles")
    .insert({ user_id: userId, role_id: role.id, assigned_by: actorId });

  if (assignError) {
    if (previousRoleIds.length > 0) {
      await admin
        .from("user_roles")
        .insert(previousRoleIds.map((roleId) => ({ user_id: userId, role_id: roleId })));
    }
    return { ok: false, error: "Could not update the role." };
  }

  return { ok: true };
}

export async function setStaffActive(
  actorId: string,
  hospitalId: string,
  userId: string,
  isActive: boolean,
): Promise<MutationResult> {
  if (userId === actorId) {
    return { ok: false, error: "You cannot change your own account status." };
  }

  const target = await loadTarget(userId, hospitalId);
  if (!target) return { ok: false, error: "Staff member not found in this hospital." };

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("profiles").update({ is_active: isActive }).eq("user_id", userId);
  if (error) return { ok: false, error: "Could not update the account status." };

  return { ok: true };
}

export async function resetStaffPassword(
  actorId: string,
  hospitalId: string,
  userId: string,
): Promise<ResetResult> {
  if (userId === actorId) {
    return { ok: false, error: "Use the change-password page for your own account." };
  }

  const target = await loadTarget(userId, hospitalId);
  if (!target) return { ok: false, error: "Staff member not found in this hospital." };

  const admin = createSupabaseAdminClient();
  const tempPassword = generateTempPassword();

  const { error: userError } = await admin.auth.admin.updateUserById(userId, {
    password: tempPassword,
  });
  if (userError) return { ok: false, error: "Could not reset the password." };

  const { error: flagError } = await admin
    .from("profiles")
    .update({ must_change_password: true })
    .eq("user_id", userId);
  if (flagError) return { ok: false, error: "Password reset, but the change flag was not set." };

  return { ok: true, username: target.username, tempPassword };
}
