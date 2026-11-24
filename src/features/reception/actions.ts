"use server";

import { z } from "zod";

import { requireModulePermission } from "@/server/auth/module-permission";
import { PatientsService } from "@/features/reception/service";
import { PatientsRepo } from "@/features/reception/repo";
import { patientCreateSchema } from "@/lib/patients/schema";

const CreatePatientActionSchema = patientCreateSchema;

export async function createPatientAction(formData: FormData) {
  await requireModulePermission("reception", "reception:patient:create");

  const raw = Object.fromEntries(formData.entries());
  const parsed = CreatePatientActionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid patient data." };
  }

  const repo = new PatientsRepo("");
  const service = new PatientsService(repo);

  const result = await service.createPatient(parsed.data, "system");
  if (!result.ok) {
    return { ok: false as const, error: result.error.message };
  }

  return { ok: true as const, patientId: result.data.id };
}

export async function listPatientsAction() {
  await requireModulePermission("reception", "reception:patient:read");
  return { ok: true as const, patients: [] };
}

export async function searchPatientsAction(query: string) {
  await requireModulePermission("reception", "reception:patient:read");
  return { ok: true as const, patients: [], total: 0 };
}

export async function getPatientAction(id: string) {
  await requireModulePermission("reception", "reception:patient:read");
  return { ok: true as const, patient: null };
}

export async function archivePatientAction(id: string) {
  await requireModulePermission("reception", "reception:patient:archive");
  return { ok: true as const };
}
