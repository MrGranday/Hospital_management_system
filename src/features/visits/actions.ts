"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { visitCreateSchema, visitIdSchema, visitStatusSchema, visitUpdateSchema } from "@/lib/visits/schema";
import { requirePermission } from "@/server/auth/require-permission";
import { createSupabaseServerClient } from "@/server/supabase/server";

const NOT_AUTHORIZED = "You do not have permission to change visits.";

export type VisitFormState = { error: string } | undefined;

async function getActor(permission: string) {
  try {
    const context = await requirePermission(permission);
    return context.hospitalId ? { userId: context.userId, hospitalId: context.hospitalId } : null;
  } catch {
    return null;
  }
}

export async function createVisitAction(
  _previous: VisitFormState,
  formData: FormData,
): Promise<VisitFormState> {
  const actor = await getActor("visits:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = visitCreateSchema.safeParse({
    patientId: formData.get("patientId"),
    providerId: formData.get("providerId"),
    appointmentId: formData.get("appointmentId"),
    chiefComplaint: formData.get("chiefComplaint"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the visit details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_visit", {
    p_patient_id: parsed.data.patientId,
    p_provider_id: parsed.data.providerId,
    p_appointment_id: parsed.data.appointmentId ?? undefined,
    p_chief_complaint: parsed.data.chiefComplaint ?? undefined,
  });

  if (error || !data) {
    return { error: "Could not create the visit. Try again." };
  }

  revalidatePath("/visits");
  redirect(`/visits/${data.id}`);
}

export async function updateVisitAction(
  _previous: VisitFormState,
  formData: FormData,
): Promise<VisitFormState> {
  const actor = await getActor("visits:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = visitUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    patientId: formData.get("patientId"),
    providerId: formData.get("providerId"),
    appointmentId: formData.get("appointmentId"),
    status: formData.get("status"),
    queuePosition: formData.get("queuePosition"),
    startedAt: formData.get("startedAt"),
    completedAt: formData.get("completedAt"),
    chiefComplaint: formData.get("chiefComplaint"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the visit details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("visits")
    .update({
      patient_id: parsed.data.patientId,
      provider_id: parsed.data.providerId,
      appointment_id: parsed.data.appointmentId ?? undefined,
      status: parsed.data.status,
      queue_position: parsed.data.queuePosition ?? undefined,
      started_at: parsed.data.startedAt ?? undefined,
      completed_at: parsed.data.completedAt ?? undefined,
      chief_complaint: parsed.data.chiefComplaint ?? undefined,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save the visit. Try again." };
  if (!data) {
    return { error: "This visit was changed by someone else. Reload and try again." };
  }

  revalidatePath("/visits");
  revalidatePath(`/visits/${parsed.data.id}`);
  redirect(`/visits/${parsed.data.id}`);
}

export type UpdateVisitStatusState = { error: string } | undefined;

export async function updateVisitStatusAction(
  _previous: UpdateVisitStatusState,
  formData: FormData,
): Promise<UpdateVisitStatusState> {
  const actor = await getActor("visits:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = visitStatusSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid status change." };
  }

  const supabase = await createSupabaseServerClient();
  const updates: { status: string; started_at?: string } = { status: parsed.data.status };

  if (parsed.data.status === "vitals" && !formData.get("skipStarted")) {
    updates.started_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("visits")
    .update(updates)
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not update the visit status. Try again." };
  if (!data) {
    return { error: "This visit was changed by someone else. Reload and try again." };
  }

  revalidatePath("/visits");
  revalidatePath(`/visits/${parsed.data.id}`);
  return undefined;
}

export type CancelVisitState = { error: string } | undefined;

export async function cancelVisitAction(
  _previous: CancelVisitState,
  formData: FormData,
): Promise<CancelVisitState> {
  const actor = await getActor("visits:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = visitStatusSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    status: "cancelled",
  });
  if (!parsed.success) {
    return { error: "Unknown visit." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("visits")
    .update({ status: "cancelled" })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not cancel the visit. Try again." };
  if (!data) {
    return { error: "This visit was changed by someone else. Reload and try again." };
  }

  revalidatePath("/visits");
  revalidatePath(`/visits/${parsed.data.id}`);
  return undefined;
}

export type ArchiveVisitState = { error: string } | undefined;

export async function archiveVisitAction(
  _previous: ArchiveVisitState,
  formData: FormData,
): Promise<ArchiveVisitState> {
  const actor = await getActor("visits:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = visitIdSchema.safeParse(formData.get("id"));
  if (!parsed.success) return { error: "Unknown visit." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("visits")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("hospital_id", actor.hospitalId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) return { error: "Could not archive the visit. Try again." };

  revalidatePath("/visits");
  redirect("/visits");
}

export type RecordVitalsState = { error: string } | undefined;

export async function recordVitalsAction(
  _previous: RecordVitalsState,
  formData: FormData,
): Promise<RecordVitalsState> {
  const actor = await getActor("visits:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const visitId = formData.get("visitId");
  if (typeof visitId !== "string" || !visitId) {
    return { error: "Unknown visit." };
  }
  const temperatureC = formData.get("temperatureC");
  const heartRate = formData.get("heartRate");
  const respiratoryRate = formData.get("respiratoryRate");
  const bloodPressureSystolic = formData.get("bloodPressureSystolic");
  const bloodPressureDiastolic = formData.get("bloodPressureDiastolic");
  const oxygenSaturation = formData.get("oxygenSaturation");
  const weightKg = formData.get("weightKg");
  const heightCm = formData.get("heightCm");
  const notes = formData.get("notes");

  const asNumber = (value: FormDataEntryValue | null): number | undefined => {
    if (typeof value !== "string" || value === "") return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("record_vitals", {
    p_visit_id: visitId,
    p_temperature_c: asNumber(temperatureC),
    p_heart_rate: asNumber(heartRate),
    p_respiratory_rate: asNumber(respiratoryRate),
    p_blood_pressure_systolic: asNumber(bloodPressureSystolic),
    p_blood_pressure_diastolic: asNumber(bloodPressureDiastolic),
    p_oxygen_saturation: asNumber(oxygenSaturation),
    p_weight_kg: asNumber(weightKg),
    p_height_cm: asNumber(heightCm),
    p_notes: typeof notes === "string" ? notes : undefined,
  });

  if (error || !data) {
    return { error: "Could not record vitals. Try again." };
  }

  revalidatePath(`/visits/${visitId}`);
  return undefined;
}
