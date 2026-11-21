import { describe, expect, it } from "vitest";

import {
  allergyCreateSchema,
  clinicalNoteCreateSchema,
  diagnosisCreateSchema,
  emrQuerySchema,
  EMR_PAGE_SIZE,
  problemCreateSchema,
  prescriptionCreateSchema,
  prescriptionItemCreateSchema,
} from "./schema";

const baseVisit = "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e66";
const basePatient = "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64";
const baseProvider = "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e65";
const basePrescription = "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e67";

describe("emr schema", () => {
  it("accepts a complete clinical note", () => {
    const result = clinicalNoteCreateSchema.safeParse({
      visitId: baseVisit,
      providerId: baseProvider,
      noteType: "consultation",
      title: "Initial consultation",
      content: "Patient presents with chest pain.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.noteType).toBe("consultation");
      expect(result.data.isConfidential).toBe(false);
    }
  });

  it("rejects missing required fields", () => {
    expect(clinicalNoteCreateSchema.safeParse({}).success).toBe(false);
    expect(
      clinicalNoteCreateSchema.safeParse({
        visitId: "not-a-uuid",
        providerId: baseProvider,
        noteType: "consultation",
        title: "Test",
        content: "Test content",
      }).success,
    ).toBe(false);
  });

  it("accepts a complete diagnosis", () => {
    const result = diagnosisCreateSchema.safeParse({
      patientId: basePatient,
      providerId: baseProvider,
      icdCode: "I10",
      description: "Essential hypertension",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPrimary).toBe(false);
      expect(result.data.isChronic).toBe(false);
    }
  });

  it("accepts a complete allergy", () => {
    const result = allergyCreateSchema.safeParse({
      patientId: basePatient,
      allergen: "Penicillin",
      reaction: "Rash",
      severity: "moderate",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
    }
  });

  it("rejects invalid severity", () => {
    expect(
      allergyCreateSchema.safeParse({
        patientId: basePatient,
        allergen: "Penicillin",
        severity: "critical" as any,
      }).success,
    ).toBe(false);
  });

  it("accepts a complete problem", () => {
    const result = problemCreateSchema.safeParse({
      patientId: basePatient,
      condition: "Type 2 diabetes",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
    }
  });

  it("accepts a complete prescription", () => {
    const result = prescriptionCreateSchema.safeParse({
      patientId: basePatient,
      providerId: baseProvider,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("active");
    }
  });

  it("accepts a complete prescription item", () => {
    const result = prescriptionItemCreateSchema.safeParse({
      prescriptionId: basePrescription,
      medicationName: "Amoxicillin",
      dosage: "500mg",
      frequency: "Twice daily",
    });
    expect(result.success).toBe(true);
  });

  it("rejects out-of-range quantity and refills", () => {
    expect(
      prescriptionItemCreateSchema.safeParse({
        prescriptionId: basePrescription,
        medicationName: "Amoxicillin",
        dosage: "500mg",
        frequency: "Twice daily",
        quantity: 0,
      }).success,
    ).toBe(false);
    expect(
      prescriptionItemCreateSchema.safeParse({
        prescriptionId: basePrescription,
        medicationName: "Amoxicillin",
        dosage: "500mg",
        frequency: "Twice daily",
        refills: -1,
      }).success,
    ).toBe(false);
  });

  it("coerces list queries", () => {
    const query = emrQuerySchema.parse({ q: " diabetes ", page: "3" });
    expect(query).toEqual({ q: "diabetes", page: 3 });
  });

  it("page size constant", () => {
    expect(EMR_PAGE_SIZE).toBe(25);
  });
});
