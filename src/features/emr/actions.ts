"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  clinicalNoteCreateSchema,
  clinicalNoteUpdateSchema,
  diagnosisCreateSchema,
  diagnosisUpdateSchema,
  allergyCreateSchema,
  allergyUpdateSchema,
  problemCreateSchema,
  problemUpdateSchema,
  prescriptionCreateSchema,
  prescriptionUpdateSchema,
  prescriptionItemCreateSchema,
  prescriptionItemUpdateSchema,
} from "@/lib/emr/schema";
import { requirePermission } from "@/server/auth/require-permission";
import { createSupabaseServerClient } from "@/server/supabase/server";

const NOT_AUTHORIZED = "You do not have permission to change EMR records.";

type EmrFormState = { error: string } | undefined;

async function getActor(permission: string) {
  try {
    const context = await requirePermission(permission);
    return context.hospitalId ? { userId: context.userId, hospitalId: context.hospitalId } : null;
  } catch {
    return null;
  }
}

// --- Clinical notes ---

export async function createClinicalNoteAction(
  _previous: EmrFormState,
  formData: FormData,
): Promise<EmrFormState> {
  const actor = await getActor("emr:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = clinicalNoteCreateSchema.safeParse({
    visitId: formData.get("visitId"),
    providerId: formData.get("providerId"),
    noteType: formData.get("noteType"),
    title: formData.get("title"),
    content: formData.get("content"),
    isConfidential: formData.get("isConfidential") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the note details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("clinical_notes").insert({
    hospital_id: actor.hospitalId,
    visit_id: parsed.data.visitId,
    provider_id: parsed.data.providerId,
    note_type: parsed.data.noteType,
    title: parsed.data.title,
    content: parsed.data.content,
    is_confidential: parsed.data.isConfidential,
  });

  if (error) return { error: "Could not create the clinical note. Try again." };

  revalidatePath(`/visits/${parsed.data.visitId}`);
  redirect(`/visits/${parsed.data.visitId}`);
}

export async function updateClinicalNoteAction(
  _previous: EmrFormState,
  formData: FormData,
): Promise<EmrFormState> {
  const actor = await getActor("emr:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = clinicalNoteUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    visitId: formData.get("visitId"),
    providerId: formData.get("providerId"),
    noteType: formData.get("noteType"),
    title: formData.get("title"),
    content: formData.get("content"),
    isConfidential: formData.get("isConfidential") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the note details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clinical_notes")
    .update({
      title: parsed.data.title,
      content: parsed.data.content,
      note_type: parsed.data.noteType,
      is_confidential: parsed.data.isConfidential,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id, visit_id")
    .maybeSingle();

  if (error) return { error: "Could not save the note. Try again." };
  if (!data) {
    return { error: "This note was changed by someone else. Reload and try again." };
  }

  revalidatePath(`/visits/${(data as { visit_id: string }).visit_id}`);
  redirect(`/visits/${(data as { visit_id: string }).visit_id}`);
}

// --- Diagnoses ---

export async function createDiagnosisAction(
  _previous: EmrFormState,
  formData: FormData,
): Promise<EmrFormState> {
  const actor = await getActor("emr:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = diagnosisCreateSchema.safeParse({
    patientId: formData.get("patientId"),
    visitId: formData.get("visitId"),
    providerId: formData.get("providerId"),
    icdCode: formData.get("icdCode"),
    description: formData.get("description"),
    isPrimary: formData.get("isPrimary") === "on",
    isChronic: formData.get("isChronic") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the diagnosis details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("diagnoses").insert({
    hospital_id: actor.hospitalId,
    patient_id: parsed.data.patientId,
    visit_id: parsed.data.visitId ?? undefined,
    provider_id: parsed.data.providerId,
    icd_code: parsed.data.icdCode,
    description: parsed.data.description,
    is_primary: parsed.data.isPrimary,
    is_chronic: parsed.data.isChronic,
  });

  if (error) return { error: "Could not create the diagnosis. Try again." };

  revalidatePath(`/patients/${parsed.data.patientId}`);
  redirect(`/patients/${parsed.data.patientId}`);
}

export async function updateDiagnosisAction(
  _previous: EmrFormState,
  formData: FormData,
): Promise<EmrFormState> {
  const actor = await getActor("emr:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = diagnosisUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    patientId: formData.get("patientId"),
    visitId: formData.get("visitId"),
    providerId: formData.get("providerId"),
    icdCode: formData.get("icdCode"),
    description: formData.get("description"),
    isPrimary: formData.get("isPrimary") === "on",
    isChronic: formData.get("isChronic") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the diagnosis details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("diagnoses")
    .update({
      icd_code: parsed.data.icdCode,
      description: parsed.data.description,
      is_primary: parsed.data.isPrimary,
      is_chronic: parsed.data.isChronic,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id, patient_id")
    .maybeSingle();

  if (error) return { error: "Could not save the diagnosis. Try again." };
  if (!data) {
    return { error: "This diagnosis was changed by someone else. Reload and try again." };
  }

  revalidatePath(`/patients/${(data as { patient_id: string }).patient_id}`);
  redirect(`/patients/${(data as { patient_id: string }).patient_id}`);
}

// --- Allergies ---

export async function createAllergyAction(
  _previous: EmrFormState,
  formData: FormData,
): Promise<EmrFormState> {
  const actor = await getActor("emr:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = allergyCreateSchema.safeParse({
    patientId: formData.get("patientId"),
    allergen: formData.get("allergen"),
    reaction: formData.get("reaction"),
    severity: formData.get("severity"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the allergy details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("allergies").insert({
    hospital_id: actor.hospitalId,
    patient_id: parsed.data.patientId,
    allergen: parsed.data.allergen,
    reaction: parsed.data.reaction,
    severity: parsed.data.severity ?? undefined,
    is_active: parsed.data.isActive,
    recorded_by: actor.userId,
  });

  if (error) return { error: "Could not create the allergy. Try again." };

  revalidatePath(`/patients/${parsed.data.patientId}`);
  redirect(`/patients/${parsed.data.patientId}`);
}

export async function updateAllergyAction(
  _previous: EmrFormState,
  formData: FormData,
): Promise<EmrFormState> {
  const actor = await getActor("emr:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = allergyUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    patientId: formData.get("patientId"),
    allergen: formData.get("allergen"),
    reaction: formData.get("reaction"),
    severity: formData.get("severity"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the allergy details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("allergies")
    .update({
      allergen: parsed.data.allergen,
      reaction: parsed.data.reaction,
      severity: parsed.data.severity ?? undefined,
      is_active: parsed.data.isActive,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id, patient_id")
    .maybeSingle();

  if (error) return { error: "Could not save the allergy. Try again." };
  if (!data) {
    return { error: "This allergy was changed by someone else. Reload and try again." };
  }

  revalidatePath(`/patients/${(data as { patient_id: string }).patient_id}`);
  redirect(`/patients/${(data as { patient_id: string }).patient_id}`);
}

// --- Problems ---

export async function createProblemAction(
  _previous: EmrFormState,
  formData: FormData,
): Promise<EmrFormState> {
  const actor = await getActor("emr:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = problemCreateSchema.safeParse({
    patientId: formData.get("patientId"),
    condition: formData.get("condition"),
    icdCode: formData.get("icdCode"),
    isActive: formData.get("isActive") === "on",
    onsetDate: formData.get("onsetDate"),
    resolvedDate: formData.get("resolvedDate"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the problem details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("problems").insert({
    hospital_id: actor.hospitalId,
    patient_id: parsed.data.patientId,
    condition: parsed.data.condition,
    icd_code: parsed.data.icdCode,
    is_active: parsed.data.isActive,
    onset_date: parsed.data.onsetDate ?? undefined,
    resolved_date: parsed.data.resolvedDate ?? undefined,
    recorded_by: actor.userId,
  });

  if (error) return { error: "Could not create the problem. Try again." };

  revalidatePath(`/patients/${parsed.data.patientId}`);
  redirect(`/patients/${parsed.data.patientId}`);
}

export async function updateProblemAction(
  _previous: EmrFormState,
  formData: FormData,
): Promise<EmrFormState> {
  const actor = await getActor("emr:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = problemUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    patientId: formData.get("patientId"),
    condition: formData.get("condition"),
    icdCode: formData.get("icdCode"),
    isActive: formData.get("isActive") === "on",
    onsetDate: formData.get("onsetDate"),
    resolvedDate: formData.get("resolvedDate"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the problem details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("problems")
    .update({
      condition: parsed.data.condition,
      icd_code: parsed.data.icdCode,
      is_active: parsed.data.isActive,
      onset_date: parsed.data.onsetDate ?? undefined,
      resolved_date: parsed.data.resolvedDate ?? undefined,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id, patient_id")
    .maybeSingle();

  if (error) return { error: "Could not save the problem. Try again." };
  if (!data) {
    return { error: "This problem was changed by someone else. Reload and try again." };
  }

  revalidatePath(`/patients/${(data as { patient_id: string }).patient_id}`);
  redirect(`/patients/${(data as { patient_id: string }).patient_id}`);
}

// --- Prescriptions ---

export async function createPrescriptionAction(
  _previous: EmrFormState,
  formData: FormData,
): Promise<EmrFormState> {
  const actor = await getActor("emr:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = prescriptionCreateSchema.safeParse({
    patientId: formData.get("patientId"),
    visitId: formData.get("visitId"),
    providerId: formData.get("providerId"),
    status: formData.get("status"),
    validUntil: formData.get("validUntil"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the prescription details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("prescriptions").insert({
    hospital_id: actor.hospitalId,
    patient_id: parsed.data.patientId,
    visit_id: parsed.data.visitId ?? undefined,
    provider_id: parsed.data.providerId,
    status: parsed.data.status,
    valid_until: parsed.data.validUntil ?? undefined,
    notes: parsed.data.notes,
  });

  if (error) return { error: "Could not create the prescription. Try again." };

  revalidatePath(`/visits/${parsed.data.visitId ?? parsed.data.patientId}`);
  redirect(`/patients/${parsed.data.patientId}`);
}

export async function updatePrescriptionAction(
  _previous: EmrFormState,
  formData: FormData,
): Promise<EmrFormState> {
  const actor = await getActor("emr:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = prescriptionUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    patientId: formData.get("patientId"),
    visitId: formData.get("visitId"),
    providerId: formData.get("providerId"),
    status: formData.get("status"),
    validUntil: formData.get("validUntil"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the prescription details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("prescriptions")
    .update({
      status: parsed.data.status,
      valid_until: parsed.data.validUntil ?? undefined,
      notes: parsed.data.notes,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id, patient_id")
    .maybeSingle();

  if (error) return { error: "Could not save the prescription. Try again." };
  if (!data) {
    return { error: "This prescription was changed by someone else. Reload and try again." };
  }

  revalidatePath(`/patients/${(data as { patient_id: string }).patient_id}`);
  redirect(`/patients/${(data as { patient_id: string }).patient_id}`);
}

// --- Prescription items ---

export async function createPrescriptionItemAction(
  _previous: EmrFormState,
  formData: FormData,
): Promise<EmrFormState> {
  const actor = await getActor("emr:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = prescriptionItemCreateSchema.safeParse({
    prescriptionId: formData.get("prescriptionId"),
    medicationName: formData.get("medicationName"),
    dosage: formData.get("dosage"),
    frequency: formData.get("frequency"),
    duration: formData.get("duration"),
    quantity: formData.get("quantity"),
    refills: formData.get("refills"),
    instructions: formData.get("instructions"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the medication details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("prescription_items").insert({
    hospital_id: actor.hospitalId,
    prescription_id: parsed.data.prescriptionId,
    medication_name: parsed.data.medicationName,
    dosage: parsed.data.dosage,
    frequency: parsed.data.frequency,
    duration: parsed.data.duration,
    quantity: parsed.data.quantity,
    refills: parsed.data.refills,
    instructions: parsed.data.instructions,
  });

  if (error) return { error: "Could not add the medication. Try again." };

  revalidatePath(`/prescriptions/${parsed.data.prescriptionId}`);
  redirect(`/prescriptions/${parsed.data.prescriptionId}`);
}

export async function updatePrescriptionItemAction(
  _previous: EmrFormState,
  formData: FormData,
): Promise<EmrFormState> {
  const actor = await getActor("emr:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = prescriptionItemUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    prescriptionId: formData.get("prescriptionId"),
    medicationName: formData.get("medicationName"),
    dosage: formData.get("dosage"),
    frequency: formData.get("frequency"),
    duration: formData.get("duration"),
    quantity: formData.get("quantity"),
    refills: formData.get("refills"),
    instructions: formData.get("instructions"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the medication details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("prescription_items")
    .update({
      medication_name: parsed.data.medicationName,
      dosage: parsed.data.dosage,
      frequency: parsed.data.frequency,
      duration: parsed.data.duration,
      quantity: parsed.data.quantity,
      refills: parsed.data.refills,
      instructions: parsed.data.instructions,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .select("id, prescription_id")
    .maybeSingle();

  if (error) return { error: "Could not save the medication. Try again." };
  if (!data) {
    return { error: "This medication was changed by someone else. Reload and try again." };
  }

  revalidatePath(`/prescriptions/${(data as { prescription_id: string }).prescription_id}`);
  redirect(`/prescriptions/${(data as { prescription_id: string }).prescription_id}`);
}
