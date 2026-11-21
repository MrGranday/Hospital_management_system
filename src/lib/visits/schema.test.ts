import { describe, expect, it } from "vitest";

import {
  VISIT_PAGE_SIZE,
  visitCreateSchema,
  visitListHref,
  visitQuerySchema,
  visitStatusSchema,
  visitUpdateSchema,
  vitalsCreateSchema,
} from "./schema";

const baseVisit = {
  patientId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
  providerId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e65",
  chiefComplaint: "Chest pain",
};

const baseVitals = {
  visitId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e66",
};

describe("visit schema", () => {
  it("accepts a complete visit create input", () => {
    const parsed = visitCreateSchema.parse(baseVisit);
    expect(parsed.patientId).toBe(baseVisit.patientId);
    expect(parsed.chiefComplaint).toBe("Chest pain");
  });

  it("rejects missing required fields", () => {
    expect(visitCreateSchema.safeParse({}).success).toBe(false);
    expect(
      visitCreateSchema.safeParse({ ...baseVisit, patientId: "not-a-uuid" }).success,
    ).toBe(false);
  });

  it("requires id, version and status for updates", () => {
    expect(visitUpdateSchema.safeParse(baseVisit).success).toBe(false);
    const parsed = visitUpdateSchema.parse({
      ...baseVisit,
      id: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e67",
      version: "2",
      status: "vitals",
    });
    expect(parsed.version).toBe(2);
    expect(parsed.status).toBe("vitals");
  });

  it("validates status transition input", () => {
    const parsed = visitStatusSchema.parse({
      id: baseVisit.patientId,
      version: "1",
      status: "consultation",
    });
    expect(parsed.status).toBe("consultation");
    expect(
      visitStatusSchema.safeParse({ ...parsed, status: "archived" as any }).success,
    ).toBe(false);
  });

  it("accepts valid vitals inputs", () => {
    expect(
      vitalsCreateSchema.safeParse({
        ...baseVitals,
        temperatureC: 36.5,
        heartRate: 72,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        oxygenSaturation: 98,
        weightKg: 70,
        heightCm: 175,
      }).success,
    ).toBe(true);
  });

  it("rejects out-of-range vitals", () => {
    expect(
      vitalsCreateSchema.safeParse({
        ...baseVitals,
        temperatureC: 50,
      }).success,
    ).toBe(false);
    expect(
      vitalsCreateSchema.safeParse({
        ...baseVitals,
        heartRate: 300,
      }).success,
    ).toBe(false);
    expect(
      vitalsCreateSchema.safeParse({
        ...baseVitals,
        oxygenSaturation: 110,
      }).success,
    ).toBe(false);
  });

  it("coerces list queries", () => {
    const query = visitQuerySchema.parse({ q: " john ", page: "3", status: "waiting" });
    expect(query).toEqual({ q: "john", page: 3, status: "waiting" });
    expect(visitListHref(query, 1)).toBe("/visits?q=john&status=waiting");
    expect(visitListHref({ page: 1, q: "", status: undefined }, 1)).toBe("/visits");
  });

  it("page size constant", () => {
    expect(VISIT_PAGE_SIZE).toBe(25);
  });
});
