"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  patientCreateSchema,
  patientDocumentIdSchema,
  patientDocumentUploadSchema,
  patientIdSchema,
  patientMergeSchema,
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

export type MergePatientState = { error: string } | undefined;

export async function mergePatientAction(
  _previous: MergePatientState,
  formData: FormData,
): Promise<MergePatientState> {
  const actor = await getActor("patients:merge");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = patientMergeSchema.safeParse({
    sourceId: formData.get("sourceId"),
    targetId: formData.get("targetId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the merge details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("merge_patients", {
    p_source_id: parsed.data.sourceId,
    p_target_id: parsed.data.targetId,
    p_reason: parsed.data.reason,
  });

  if (error || !data) {
    return { error: "Could not merge these patients. Reload and try again." };
  }

  revalidatePath("/patients");
  revalidatePath(`/patients/${parsed.data.sourceId}`);
  revalidatePath(`/patients/${parsed.data.targetId}`);
  redirect(`/patients/${parsed.data.targetId}`);
}

const DOCUMENT_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function safeFileName(name: string): string {
  const cleaned = name.replace(/[\\/\u0000-\u001f]/g, " ").trim().slice(0, 160);
  return cleaned || "document";
}

export type DocumentState = { error: string } | undefined;

export async function uploadPatientDocumentAction(
  _previous: DocumentState,
  formData: FormData,
): Promise<DocumentState> {
  const actor = await getActor("patients:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = patientDocumentUploadSchema.safeParse({
    patientId: formData.get("patientId"),
    file: formData.get("file"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Choose a valid document." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("id", parsed.data.patientId)
    .eq("hospital_id", actor.hospitalId)
    .maybeSingle();

  if (!patient) return { error: "Unknown patient." };

  const file = parsed.data.file;
  const extension = DOCUMENT_EXTENSIONS[file.type] ?? "bin";
  const storagePath = `${actor.hospitalId}/${patient.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("patient-documents")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: "Could not upload the document. Try again." };

  const { error: insertError } = await supabase.from("patient_documents").insert({
    hospital_id: actor.hospitalId,
    patient_id: patient.id,
    file_name: safeFileName(file.name),
    mime_type: file.type,
    size_bytes: file.size,
    storage_path: storagePath,
  });

  if (insertError) {
    await supabase.storage.from("patient-documents").remove([storagePath]);
    return { error: "Could not save the document. Try again." };
  }

  revalidatePath(`/patients/${patient.id}`);
  redirect(`/patients/${patient.id}#documents`);
}

export async function deletePatientDocumentAction(
  _previous: DocumentState,
  formData: FormData,
): Promise<DocumentState> {
  const actor = await getActor("patients:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = patientDocumentIdSchema.safeParse({
    patientId: formData.get("patientId"),
    documentId: formData.get("documentId"),
  });
  if (!parsed.success) return { error: "Unknown document." };

  const supabase = await createSupabaseServerClient();
  const { data: document } = await supabase
    .from("patient_documents")
    .select("id, storage_path")
    .eq("id", parsed.data.documentId)
    .eq("patient_id", parsed.data.patientId)
    .eq("hospital_id", actor.hospitalId)
    .maybeSingle();

  if (!document) return { error: "Unknown document." };

  const { data: deleted, error } = await supabase.rpc("delete_patient_document", {
    p_document_id: document.id,
  });

  if (error || !deleted) return { error: "Could not delete the document. Try again." };

  await supabase.storage.from("patient-documents").remove([document.storage_path]);

  revalidatePath(`/patients/${parsed.data.patientId}`);
  redirect(`/patients/${parsed.data.patientId}#documents`);
}
