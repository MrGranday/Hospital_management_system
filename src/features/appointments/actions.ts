"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  appointmentCreateSchema,
  appointmentIdSchema,
  appointmentStatusSchema,
  appointmentUpdateSchema,
} from "@/lib/appointments/schema";
import { requirePermission } from "@/server/auth/require-permission";
import { createSupabaseServerClient } from "@/server/supabase/server";

const NOT_AUTHORIZED = "You do not have permission to change appointments.";

export type AppointmentFormState = { error: string } | undefined;

async function getActor(permission: string) {
  try {
    const context = await requirePermission(permission);
    return context.hospitalId ? { userId: context.userId, hospitalId: context.hospitalId } : null;
  } catch {
    return null;
  }
}

export async function createAppointmentAction(
  _previous: AppointmentFormState,
  formData: FormData,
): Promise<AppointmentFormState> {
  const actor = await getActor("appointments:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = appointmentCreateSchema.safeParse({
    patientId: formData.get("patientId"),
    providerId: formData.get("providerId"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    type: formData.get("type"),
    status: formData.get("status"),
    reason: formData.get("reason"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the appointment details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_appointment", {
    p_patient_id: parsed.data.patientId,
    p_provider_id: parsed.data.providerId,
    p_starts_at: parsed.data.startsAt,
    p_ends_at: parsed.data.endsAt,
    p_type: parsed.data.type,
    p_reason: parsed.data.reason,
    p_notes: parsed.data.notes ?? undefined,
  });

  if (error || !data) {
    return { error: "Could not create the appointment. Try again." };
  }

  revalidatePath("/appointments");
  redirect(`/appointments/${data.id}`);
}

export async function updateAppointmentAction(
  _previous: AppointmentFormState,
  formData: FormData,
): Promise<AppointmentFormState> {
  const actor = await getActor("appointments:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = appointmentUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    patientId: formData.get("patientId"),
    providerId: formData.get("providerId"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    type: formData.get("type"),
    status: formData.get("status"),
    reason: formData.get("reason"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the appointment details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({
      patient_id: parsed.data.patientId,
      provider_id: parsed.data.providerId,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
      type: parsed.data.type,
      status: parsed.data.status,
      reason: parsed.data.reason,
      notes: parsed.data.notes,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save the appointment. Try again." };
  if (!data) {
    return { error: "This appointment was changed by someone else. Reload and try again." };
  }

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${parsed.data.id}`);
  redirect(`/appointments/${parsed.data.id}`);
}

export type UpdateAppointmentStatusState = { error: string } | undefined;

export async function updateAppointmentStatusAction(
  _previous: UpdateAppointmentStatusState,
  formData: FormData,
): Promise<UpdateAppointmentStatusState> {
  const actor = await getActor("appointments:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = appointmentStatusSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid status change." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not update the appointment status. Try again." };
  if (!data) {
    return { error: "This appointment was changed by someone else. Reload and try again." };
  }

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${parsed.data.id}`);
  return undefined;
}

export type CancelAppointmentState = { error: string } | undefined;

export async function cancelAppointmentAction(
  _previous: CancelAppointmentState,
  formData: FormData,
): Promise<CancelAppointmentState> {
  const actor = await getActor("appointments:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = appointmentStatusSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    status: "cancelled",
  });
  if (!parsed.success) {
    return { error: "Unknown appointment." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not cancel the appointment. Try again." };
  if (!data) {
    return { error: "This appointment was changed by someone else. Reload and try again." };
  }

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${parsed.data.id}`);
  return undefined;
}

export type ArchiveAppointmentState = { error: string } | undefined;

export async function archiveAppointmentAction(
  _previous: ArchiveAppointmentState,
  formData: FormData,
): Promise<ArchiveAppointmentState> {
  const actor = await getActor("appointments:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = appointmentIdSchema.safeParse(formData.get("id"));
  if (!parsed.success) return { error: "Unknown appointment." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("hospital_id", actor.hospitalId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) return { error: "Could not archive the appointment. Try again." };

  revalidatePath("/appointments");
  redirect("/appointments");
}
