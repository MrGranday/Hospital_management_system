import { describe, expect, it, vi } from "vitest";

import { PatientsService, type CreatePatientInput } from "@/features/reception/service";
import type { PatientsRepo } from "@/features/reception/repo";

describe("PatientsService (Unit/Integration)", () => {
  const mockRepo = {
    insert: vi.fn(),
    get: vi.fn(),
    search: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    getByMRN: vi.fn(),
  } as unknown as PatientsRepo;

  const service = new PatientsService(mockRepo);

  it("validates input before creating a patient", async () => {
    const invalidResult = await service.createPatient(
      {
        fullName: "", // Invalid: empty string
        sex: "female",
      } as unknown as CreatePatientInput,
      "user-1"
    );

    expect(invalidResult.ok).toBe(false);
    if (!invalidResult.ok) {
      expect(invalidResult.error.code).toBe("validation_error");
    }
  });

  it("calls repository insert and returns patient ID on valid input", async () => {
    (mockRepo.insert as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "pat-123",
      full_name: "Fatima Zahra",
    });

    const result = await service.createPatient(
      {
        fullName: "Fatima Zahra",
        sex: "female",
        phone: "+93700112233",
      },
      "user-1"
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe("pat-123");
    }
    expect(mockRepo.insert).toHaveBeenCalledTimes(1);
  });

  it("retrieves a patient by id", async () => {
    (mockRepo.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "pat-123",
      full_name: "Fatima Zahra",
    });

    const result = await service.getPatient("pat-123");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ id: "pat-123", full_name: "Fatima Zahra" });
    }
  });

  it("delegates archive to repository", async () => {
    (mockRepo.archive as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

    const result = await service.archivePatient("pat-123", "user-1");
    expect(result.ok).toBe(true);
    expect(mockRepo.archive).toHaveBeenCalledWith("pat-123");
  });
});
