"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hospitalCreateSchema, hospitalStatusSchema } from "@/lib/platform/schema";
import { getSuperAdminContext } from "@/server/platform/guard";
import {
  provisionHospital,
  resetHospitalAdminPassword,
  setHospitalStatus,
} from "@/server/platform/hospitals";

const NOT_AUTHORIZED = "You do not have permission to manage hospitals.";

export type CreateHospitalState =
  | { error: string }
  | { created: { code: string; username: string; tempPassword: string } }
  | undefined;

export async function createHospitalAction(
  _previous: CreateHospitalState,
  formData: FormData,
): Promise<CreateHospitalState> {
  const context = await getSuperAdminContext();
  if (!context) return { error: NOT_AUTHORIZED };

  const parsed = hospitalCreateSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    country: formData.get("country"),
    timezone: formData.get("timezone"),
    currency: formData.get("currency"),
    adminUsername: formData.get("adminUsername"),
    adminFullName: formData.get("adminFullName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the hospital details." };
  }

  const result = await provisionHospital(parsed.data, context.userId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/platform/hospitals");
  revalidatePath("/platform/audit");

  return {
    created: {
      code: result.code,
      username: result.username,
      tempPassword: result.tempPassword,
    },
  };
}

const statusFormSchema = z.object({
  hospitalId: z.string().uuid(),
  status: hospitalStatusSchema,
});

export async function setHospitalStatusAction(formData: FormData): Promise<void> {
  const context = await getSuperAdminContext();
  if (!context) redirect("/login");

  const parsed = statusFormSchema.safeParse({
    hospitalId: formData.get("hospitalId"),
    status: formData.get("status"),
  });
  if (!parsed.success) redirect("/platform/hospitals");

  await setHospitalStatus(parsed.data.hospitalId, parsed.data.status);

  revalidatePath("/platform/hospitals");
  revalidatePath(`/platform/hospitals/${parsed.data.hospitalId}`);
  revalidatePath("/platform/audit");
  redirect(`/platform/hospitals/${parsed.data.hospitalId}`);
}

export type ResetPasswordState =
  | { error: string }
  | { reset: { username: string; tempPassword: string } }
  | undefined;

export async function resetAdminPasswordAction(
  _previous: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const context = await getSuperAdminContext();
  if (!context) return { error: NOT_AUTHORIZED };

  const hospitalId = z.string().uuid().safeParse(formData.get("hospitalId"));
  if (!hospitalId.success) return { error: "Unknown hospital." };

  const result = await resetHospitalAdminPassword(hospitalId.data);
  if (!result.ok) return { error: result.error };

  revalidatePath("/platform/audit");

  return { reset: { username: result.username, tempPassword: result.tempPassword } };
}
