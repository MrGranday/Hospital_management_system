"use server";

import type { Patient } from "@/_legacy/mock-data/data";
import { patientCreateSchema } from "@/lib/patients/schema";
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

function ageFromDateOfBirth(dateOfBirth: string | null): number {
  if (!dateOfBirth) return 0;
  const birth = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return 0;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  return color ?? AVATAR_COLORS[0] ?? "#2563eb";
}

export async function listPatientsForUi() {
  try {
    const context = await requirePermission("patients:read");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("patients")
      .select(
        "id, mrn, full_name, sex, date_of_birth, phone, email, address, blood_group, created_at",
      )
      .eq("hospital_id", context.hospitalId)
      .is("deleted_at", null)
      .is("merged_into_id", null)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return { ok: false as const, error: "Could not load patients. Try again." };
    }

    const patients: Patient[] = (data ?? []).map((row) => ({
      id: row.id,
      mrn: row.mrn,
      name: row.full_name,
      age: ageFromDateOfBirth(row.date_of_birth),
      gender: row.sex === "female" ? "F" : "M",
      phone: row.phone ?? "—",
      email: row.email ?? undefined,
      bloodType: row.blood_group ?? undefined,
      address: row.address ?? undefined,
      registeredOn: row.created_at.slice(0, 10),
      status: "active",
      allergies: [],
      chronicConditions: [],
      balance: 0,
      avatarColor: avatarColor(row.id),
    }));

    return { ok: true as const, patients };
  } catch {
    return { ok: false as const, error: "You do not have permission to view patients." };
  }
}

export async function createPatientForUi(input: {
  fullName: string;
  sex: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  notes: string;
}) {
  try {
    const context = await requirePermission("patients:create");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const parsed = patientCreateSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false as const,
        error: parsed.error.issues[0]?.message ?? "Check the patient details.",
      };
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
      return { ok: false as const, error: "Could not register the patient. Try again." };
    }

    return { ok: true as const, patientId: data.id };
  } catch {
    return { ok: false as const, error: "You do not have permission to register patients." };
  }
}
