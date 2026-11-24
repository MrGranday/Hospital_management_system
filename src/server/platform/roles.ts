import "server-only";

import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { createSupabaseServerClient } from "@/server/supabase/server";

export type HospitalRole = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  hospitalId: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RolePermission = {
  key: string;
  label: string;
};

export type RoleWithPermissions = HospitalRole & {
  permissions: RolePermission[];
};

export type CreateRoleInput = {
  key: string;
  name: string;
  description?: string;
  hospitalId?: string;
  permissionKeys: string[];
};

export type UpdateRoleInput = {
  id: string;
  name?: string;
  description?: string;
  permissionKeys?: string[];
};

export async function listHospitalRoles(hospitalId: string | null): Promise<HospitalRole[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id, key, name, description, hospital_id, is_system, created_at, updated_at")
    .eq("hospital_id", hospitalId ?? "")
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    hospitalId: row.hospital_id,
    isSystem: row.is_system,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getRoleWithPermissions(roleId: string): Promise<RoleWithPermissions | null> {
  const supabase = await createSupabaseServerClient();

  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id, key, name, description, hospital_id, is_system, created_at, updated_at")
    .eq("id", roleId)
    .maybeSingle();

  if (roleError) throw new Error(roleError.message);
  if (!role) return null;

  const { data: grants, error: grantError } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", roleId);

  if (grantError) throw new Error(grantError.message);

  const permissionIds = (grants ?? []).map((g) => g.permission_id);
  let permissions: RolePermission[] = [];

  if (permissionIds.length > 0) {
    const { data: perms, error: permError } = await supabase
      .from("permissions")
      .select("key, label")
      .in("id", permissionIds);

    if (permError) throw new Error(permError.message);
    permissions = (perms ?? []).map((p) => ({
      key: p.key,
      label: p.label,
    }));
  }

  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    hospitalId: role.hospital_id,
    isSystem: role.is_system,
    createdAt: role.created_at,
    updatedAt: role.updated_at,
    permissions,
  };
}

export async function createRole(input: CreateRoleInput): Promise<{ ok: true; role: HospitalRole } | { ok: false; error: string }> {
  const admin = createSupabaseAdminClient();

  const { data: role, error: roleError } = await admin
    .from("roles")
    .insert({
      key: input.key,
      name: input.name,
      description: input.description ?? null,
      hospital_id: input.hospitalId ?? "",
      is_system: false,
    })
    .select("id, key, name, description, hospital_id, is_system, created_at, updated_at")
    .single();

  if (roleError) {
    if (roleError.message.includes("duplicate key")) {
      return { ok: false, error: "A role with this key already exists." };
    }
    return { ok: false, error: "Could not create the role." };
  }

  if (input.permissionKeys.length > 0) {
    const { data: perms, error: permError } = await admin
      .from("permissions")
      .select("id")
      .in("key", input.permissionKeys);

    if (permError) throw new Error(permError.message);

    const permissionIds = (perms ?? []).map((p) => p.id);
    if (permissionIds.length > 0) {
      const { error: grantError } = await admin.from("role_permissions").insert(
        permissionIds.map((pid) => ({
          role_id: role.id,
          permission_id: pid,
          hospital_id: input.hospitalId ?? "",
        })),
      );
      if (grantError) throw new Error(grantError.message);
    }
  }

  return {
    ok: true,
    role: {
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      hospitalId: role.hospital_id,
      isSystem: role.is_system,
      createdAt: role.created_at,
      updatedAt: role.updated_at,
    },
  };
}

export async function updateRole(input: UpdateRoleInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createSupabaseAdminClient();

  const updateFields: Record<string, string | null | boolean> = {};
  if (input.name !== undefined) updateFields.name = input.name;
  if (input.description !== undefined) updateFields.description = input.description;

  if (Object.keys(updateFields).length > 0) {
    const { error: updateError } = await admin
      .from("roles")
      .update(updateFields as never)
      .eq("id", input.id);
    if (updateError) return { ok: false, error: "Could not update the role." };
  }

  if (input.permissionKeys !== undefined) {
    const { error: delError } = await admin
      .from("role_permissions")
      .delete()
      .eq("role_id", input.id);
    if (delError) return { ok: false, error: "Could not update role permissions." };

    if (input.permissionKeys.length > 0) {
      const { data: perms, error: permError } = await admin
        .from("permissions")
        .select("id")
        .in("key", input.permissionKeys);

      if (permError) throw new Error(permError.message);

      const permissionIds = (perms ?? []).map((p) => p.id);
      if (permissionIds.length > 0) {
        const { error: grantError } = await admin.from("role_permissions").insert(
          permissionIds.map((pid) => ({
            role_id: input.id,
            permission_id: pid,
            hospital_id: "",
          })),
        );
        if (grantError) return { ok: false, error: "Could not update role permissions." };
      }
    }
  }

  return { ok: true };
}

export async function deleteRole(roleId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createSupabaseAdminClient();

  const { data: userRoles } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("role_id", roleId)
    .limit(1);
  if (userRoles?.length) {
    return { ok: false, error: "Cannot delete a role that is assigned to users." };
  }

  const { error } = await admin.from("roles").delete().eq("id", roleId);
  if (error) return { ok: false, error: "Could not delete the role." };

  return { ok: true };
}

export async function listAllPermissions(): Promise<RolePermission[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("permissions")
    .select("key, label")
    .order("key");

  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    key: p.key,
    label: p.label,
  }));
}
