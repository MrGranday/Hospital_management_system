"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  staffCreateSchema,
  staffRoleUpdateSchema,
  staffStatusUpdateSchema,
  staffUserIdSchema,
} from "@/lib/staff/schema";
import { requirePermission } from "@/server/auth/require-permission";
import {
  createStaffMember,
  resetStaffPassword,
  setStaffActive,
  setStaffRole,
} from "@/server/admin/staff";

const NOT_AUTHORIZED = "You do not have permission to manage staff accounts.";

async function getActor(permission: string) {
  try {
    const context = await requirePermission(permission);
    return context.hospitalId ? context : null;
  } catch {
    return null;
  }
}

export type CreateStaffState =
  | { error: string }
  | { created: { username: string; tempPassword: string } }
  | undefined;

export async function createStaffAction(
  _previous: CreateStaffState,
  formData: FormData,
): Promise<CreateStaffState> {
  const actor = await getActor("users:create");
  if (!actor?.hospitalId) return { error: NOT_AUTHORIZED };

  const parsed = staffCreateSchema.safeParse({
    fullName: formData.get("fullName"),
    username: formData.get("username"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the staff details." };
  }

  const result = await createStaffMember(actor.hospitalId, actor.userId, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath("/staff");
  return { created: { username: result.username, tempPassword: result.tempPassword } };
}

export type StaffMutationState = { error: string } | { ok: true } | undefined;

export async function updateStaffRoleAction(
  _previous: StaffMutationState,
  formData: FormData,
): Promise<StaffMutationState> {
  const actor = await getActor("users:update");
  if (!actor?.hospitalId) return { error: NOT_AUTHORIZED };

  const parsed = staffRoleUpdateSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Choose a valid role." };
  }

  const result = await setStaffRole(actor.userId, actor.hospitalId, parsed.data.userId, parsed.data.role);
  if (!result.ok) return { error: result.error };

  revalidatePath("/staff");
  return { ok: true };
}

export async function updateStaffStatusAction(
  _previous: StaffMutationState,
  formData: FormData,
): Promise<StaffMutationState> {
  const actor = await getActor("users:update");
  if (!actor?.hospitalId) return { error: NOT_AUTHORIZED };

  const parsed = staffStatusUpdateSchema.safeParse({
    userId: formData.get("userId"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) return { error: "Unknown staff member." };

  const result = await setStaffActive(actor.userId, actor.hospitalId, parsed.data.userId, parsed.data.isActive);
  if (!result.ok) return { error: result.error };

  revalidatePath("/staff");
  return { ok: true };
}

export type ResetStaffPasswordState =
  | { error: string }
  | { reset: { username: string; tempPassword: string } }
  | undefined;

export async function resetStaffPasswordAction(
  _previous: ResetStaffPasswordState,
  formData: FormData,
): Promise<ResetStaffPasswordState> {
  const actor = await getActor("users:manage");
  if (!actor?.hospitalId) return { error: NOT_AUTHORIZED };

  const userId = staffUserIdSchema.safeParse(formData.get("userId"));
  if (!userId.success) return { error: "Unknown staff member." };

  const result = await resetStaffPassword(actor.userId, actor.hospitalId, userId.data);
  if (!result.ok) return { error: result.error };

  revalidatePath("/staff");
  return { reset: { username: result.username, tempPassword: result.tempPassword } };
}
