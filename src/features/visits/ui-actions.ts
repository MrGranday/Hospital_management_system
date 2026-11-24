"use server";

import { z } from "zod";

import type { OpdVisitStatus, OpdVisitUi, OpdVitals } from "@/features/visits/opd-types";
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

type OpdQueueRow = {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_mrn: string;
  patient_age: number | null;
  patient_sex: string;
  provider_id: string;
  provider_name: string;
  status: string;
  check_in_time: string;
  chief_complaint: string | null;
  version: number;
  temperature_c: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  oxygen_saturation: number | null;
  weight_kg: number | null;
  height_cm: number | null;
};

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  return color ?? AVATAR_COLORS[0] ?? "#2563eb";
}

function normalizeStatus(status: string): OpdVisitStatus {
  if (status === "vitals" || status === "consultation" || status === "completed") {
    return status;
  }
  return "waiting";
}

function toVitals(row: OpdQueueRow): OpdVitals | undefined {
  const hasVitals =
    row.temperature_c !== null ||
    row.heart_rate !== null ||
    row.respiratory_rate !== null ||
    row.blood_pressure_systolic !== null ||
    row.blood_pressure_diastolic !== null ||
    row.oxygen_saturation !== null ||
    row.weight_kg !== null ||
    row.height_cm !== null;

  if (!hasVitals) return undefined;

  return {
    bp:
      row.blood_pressure_systolic !== null || row.blood_pressure_diastolic !== null
        ? `${row.blood_pressure_systolic ?? "—"}/${row.blood_pressure_diastolic ?? "—"}`
        : "—",
    pulse: row.heart_rate ?? "—",
    temp:
      row.temperature_c === null
        ? "—"
        : Math.round(((row.temperature_c * 9) / 5 + 32) * 10) / 10,
    spo2: row.oxygen_saturation ?? "—",
    weight: row.weight_kg ?? "—",
    height: row.height_cm ?? "—",
  };
}

export async function listOpdQueueForUi() {
  try {
    const context = await requirePermission("visits:read");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("list_opd_queue", { p_limit: 200 });

    if (error) {
      return { ok: false as const, error: "Could not load the OPD queue. Try again." };
    }

    const visits: OpdVisitUi[] = (data ?? []).map((row) => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      mrn: row.patient_mrn,
      doctorId: row.provider_id,
      doctorName: row.provider_name,
      status: normalizeStatus(row.status),
      checkInTime: row.check_in_time,
      reason: row.chief_complaint?.trim() || "No chief complaint recorded",
      age: row.patient_age,
      gender: row.patient_sex === "male" ? "M" : row.patient_sex === "female" ? "F" : "?",
      avatarColor: avatarColor(row.patient_id),
      version: row.version,
      vitals: toVitals(row),
    }));

    return { ok: true as const, visits };
  } catch {
    return { ok: false as const, error: "You do not have permission to view the OPD queue." };
  }
}

const statusInputSchema = z.object({
  visitId: z.string().uuid("Unknown visit."),
  version: z.number().int().min(1, "Unknown visit version."),
  status: z.enum(["waiting", "vitals", "consultation", "completed"]),
});

export async function updateVisitStatusForUi(input: {
  visitId: string;
  version: number;
  status: OpdVisitStatus;
}) {
  const parsed = statusInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid status change." };
  }

  try {
    const context = await requirePermission("visits:update");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const updates: { status: string; started_at?: string; completed_at?: string } = {
      status: parsed.data.status,
    };
    if (parsed.data.status === "consultation") {
      updates.started_at = new Date().toISOString();
    }
    if (parsed.data.status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("visits")
      .update(updates)
      .eq("id", parsed.data.visitId)
      .eq("hospital_id", context.hospitalId)
      .eq("version", parsed.data.version)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false as const, error: "Could not update the visit. Try again." };
    }
    if (!data) {
      return {
        ok: false as const,
        error: "This visit was changed by someone else. Refresh and try again.",
      };
    }

    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "You do not have permission to update visits." };
  }
}
