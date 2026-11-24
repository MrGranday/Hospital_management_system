import "server-only";

import { z } from "zod";

import { patientCreateSchema } from "@/lib/patients/schema";
import { PatientsRepo } from "@/features/reception/repo";
import { Result, ok, fail } from "@/lib/result";

export type CreatePatientInput = z.input<typeof patientCreateSchema>;

export class PatientsService {
  constructor(private repo: PatientsRepo) {}

  async createPatient(input: CreatePatientInput, actorId: string): Promise<Result<{ id: string }>> {
    const parsed = patientCreateSchema.safeParse(input);
    if (!parsed.success) {
      return fail("validation_error", parsed.error.issues[0]?.message ?? "Invalid patient data.");
    }

    const row = await this.repo.insert({
      mrn: "PENDING",
      full_name: parsed.data.fullName,
      sex: parsed.data.sex,
      date_of_birth: parsed.data.dateOfBirth ?? null,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null,
      address: parsed.data.address ?? null,
      blood_group: parsed.data.bloodGroup ?? null,
      notes: parsed.data.notes ?? null,
    });

    return ok({ id: (row.id as string) });
  }

  async getPatient(id: string): Promise<Result<Record<string, unknown> | null>> {
    try {
      const row = await this.repo.get(id);
      return ok(row);
    } catch (error) {
      return fail("load_error", error instanceof Error ? error.message : "Failed to load patient.");
    }
  }

  async searchPatients(query: string, page = 1, pageSize = 50): Promise<Result<{ data: Record<string, unknown>[]; total: number }>> {
    try {
      const result = await this.repo.search(query, page, pageSize);
      return ok(result);
    } catch (error) {
      return fail("search_error", error instanceof Error ? error.message : "Failed to search patients.");
    }
  }

  async updatePatient(
    id: string,
    input: Partial<CreatePatientInput>,
    actorId: string,
  ): Promise<Result<void>> {
    try {
      await this.repo.update(id, {
        full_name: input.fullName ?? undefined,
        sex: input.sex ?? undefined,
        date_of_birth: input.dateOfBirth ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
        blood_group: input.bloodGroup ?? null,
        notes: input.notes ?? null,
      });
      return ok(undefined);
    } catch (error) {
      return fail("update_error", error instanceof Error ? error.message : "Failed to update patient.");
    }
  }

  async archivePatient(id: string, actorId: string): Promise<Result<void>> {
    try {
      await this.repo.archive(id);
      return ok(undefined);
    } catch (error) {
      return fail("archive_error", error instanceof Error ? error.message : "Failed to archive patient.");
    }
  }
}
