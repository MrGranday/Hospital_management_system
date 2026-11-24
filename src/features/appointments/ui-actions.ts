"use server";

import type { Appointment } from "@/_legacy/mock-data/data";
import { appointmentCreateSchema } from "@/lib/appointments/schema";
import { requirePermission } from "@/server/auth/require-permission";
import { createSupabaseServerClient } from "@/server/supabase/server";

const AVATAR_COLORS = [
  "#2563eb",
  "#0891b2",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#ca8a04",
  "#dc2626",
];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  return color ?? AVATAR_COLORS[0] ?? "#2563eb";
}

function hospitalTimeParts(iso: string, timeZone: string): { date: string; time: string } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(iso));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${hour}:${get("minute")}`,
  };
}

function durationMinutes(startsAt: string, endsAt: string): number {
  const diff = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  return Math.max(5, Math.round(diff / 60_000));
}

export async function listAppointmentsForUi() {
  try {
    const context = await requirePermission("appointments:read");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const supabase = await createSupabaseServerClient();
    const { data: settings } = await supabase
      .from("hospital_settings")
      .select("timezone")
      .eq("hospital_id", context.hospitalId)
      .maybeSingle();
    const timeZone = settings?.timezone ?? "UTC";

    const { data, error } = await supabase.rpc("list_appointments", {
      p_limit: 500,
      p_offset: 0,
    });

    if (error) {
      return { ok: false as const, error: "Could not load appointments. Try again." };
    }

    const appointments: Appointment[] = (data ?? []).map((row) => {
      const start = hospitalTimeParts(row.starts_at, timeZone);
      return {
        id: row.id,
        patientId: row.patient_id,
        patientName: row.patient_name,
        doctorId: row.provider_id,
        doctorName: row.provider_name,
        department: "Care provider",
        time: start.time,
        date: start.date,
        duration: durationMinutes(row.starts_at, row.ends_at),
        status: row.status as Appointment["status"],
        reason: row.reason,
        type: row.type as Appointment["type"],
      };
    });

    return { ok: true as const, appointments };
  } catch {
    return { ok: false as const, error: "You do not have permission to view appointments." };
  }
}

export async function listProvidersForUi() {
  try {
    const context = await requirePermission("appointments:read");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("list_providers");

    if (error) {
      return { ok: false as const, error: "Could not load providers. Try again." };
    }

    const providers = (data ?? []).map((row) => ({
      id: row.user_id,
      name: row.full_name,
      specialty: "Care provider",
      avatarColor: avatarColor(row.user_id),
    }));

    return { ok: true as const, providers };
  } catch {
    return { ok: false as const, error: "You do not have permission to view providers." };
  }
}

export async function createAppointmentForUi(input: {
  patientId: string;
  providerId: string;
  startsAt: string;
  endsAt: string;
  type: string;
  reason: string;
  notes: string;
}) {
  try {
    const context = await requirePermission("appointments:create");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const parsed = appointmentCreateSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false as const,
        error: parsed.error.issues[0]?.message ?? "Check the appointment details.",
      };
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
      return { ok: false as const, error: "Could not create the appointment. Try again." };
    }

    return { ok: true as const, appointmentId: data.id };
  } catch {
    return { ok: false as const, error: "You do not have permission to create appointments." };
  }
}
