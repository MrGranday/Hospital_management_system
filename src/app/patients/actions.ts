"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  patientCreateSchema,
  patientIdSchema,
  patientUpdateSchema,
} from "@/lib/patients/schema";
import { requirePermission } from "@/server/auth/require-permission";
import { createSupabaseServerClient } from "@/server/supabase/server";

const NOT_AUTHORIZED = "You do not have permission to change patient records.";

export type PatientFormState = { error: string } | undefined;

async function getActor(permission: string) {
  try {
    const context = await requirePermission(permission);
    return context.hospitalId ? { userId: context.userId, hospitalId: context.hospitalId } : null;
  } catch {
    return null;
  }
}

export async function createPatientAction(
  _previous: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  const actor = await getActor("patients:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = patientCreateSchema.safeParse({
    fullName: formData.get("fullName"),
    sex: formData.get("sex"),
    dateOfBirth: formData.get("dateOfBirth"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    bloodGroup: formData.get("bloodGroup"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the patient details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("register_patient", {
    p_full_name: parsed.data.fullName,
    p_sex: parsed.data.sex,
    p_date_of_birth: parsed.data.dateOfBirth ?? undefined,
    p_phone: parsed.data.phone ?? undefined,
    p_email: parsed.data.email ?? undefined,
    p_address: parsed.data.address ?? undefined,
    p_blood_group: parsed.data.bloodGroup ?? undefined,
    p_notes: parsed.data.notes ?? undefined,
  });

  if (error || !data) {
    return { error: "Could not register the patient. Try again." };
  }

  revalidatePath("/patients");
  redirect(`/patients/${data.id}`);
}

export async function updatePatientAction(
  _previous: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  const actor = await getActor("patients:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = patientUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    fullName: formData.get("fullName"),
    sex: formData.get("sex"),
    dateOfBirth: formData.get("dateOfBirth"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    bloodGroup: formData.get("bloodGroup"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the patient details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("patients")
    .update({
      full_name: parsed.data.fullName,
      sex: parsed.data.sex,
      date_of_birth: parsed.data.dateOfBirth,
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: parsed.data.address,
      blood_group: parsed.data.bloodGroup,
      notes: parsed.data.notes,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save the patient. Try again." };
  if (!data) {
    return { error: "This patient was changed by someone else. Reload and try again." };
  }

  revalidatePath("/patients");
  revalidatePath(`/patients/${parsed.data.id}`);
  redirect(`/patients/${parsed.data.id}`);
}

export type ArchivePatientState = { error: string } | undefined;

export async function archivePatientAction(
  _previous: ArchivePatientState,
  formData: FormData,
): Promise<ArchivePatientState> {
  const actor = await getActor("patients:archive");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = patientIdSchema.safeParse(formData.get("id"));
  if (!parsed.success) return { error: "Unknown patient." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("archive_patient", { p_patient_id: parsed.data });

  if (error || !data) return { error: "Could not archive the patient. Try again." };

  revalidatePath("/patients");
  redirect("/patients");
}
