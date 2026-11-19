import { describe, expect, it } from "vitest";

import {
  patientCreateSchema,
  patientListHref,
  patientQuerySchema,
  patientUpdateSchema,
} from "./schema";

const base = {
  fullName: "Amina Hassan",
  sex: "female",
  dateOfBirth: "1991-04-12",
  phone: "+254 700 123456",
  email: "amina@example.com",
  address: "12 Kilimani Road",
  bloodGroup: "O+",
  notes: "Prefers morning appointments.",
};

describe("patient schema", () => {
  it("accepts a complete patient and trims text", () => {
    const parsed = patientCreateSchema.parse({ ...base, fullName: "  Amina Hassan  " });
    expect(parsed.fullName).toBe("Amina Hassan");
    expect(parsed.bloodGroup).toBe("O+");
  });

  it("defaults missing optional fields to null and sex to unknown", () => {
    const parsed = patientCreateSchema.parse({
      fullName: "John Doe",
      sex: "",
      dateOfBirth: "",
      phone: "",
      email: "",
      address: "",
      bloodGroup: "",
      notes: "",
    });
    expect(parsed.sex).toBe("unknown");
    expect(parsed.dateOfBirth).toBeNull();
    expect(parsed.phone).toBeNull();
    expect(parsed.email).toBeNull();
    expect(parsed.bloodGroup).toBeNull();
  });

  it("rejects blank names, bad sexes and malformed dates", () => {
    expect(patientCreateSchema.safeParse({ ...base, fullName: " " }).success).toBe(false);
    expect(patientCreateSchema.safeParse({ ...base, sex: "child" }).success).toBe(false);
    expect(patientCreateSchema.safeParse({ ...base, dateOfBirth: "2026-02-30" }).success).toBe(
      false,
    );
    expect(patientCreateSchema.safeParse({ ...base, dateOfBirth: "2999-01-01" }).success).toBe(
      false,
    );
    expect(patientCreateSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
  });

  it("requires an id and version for updates", () => {
    expect(patientUpdateSchema.safeParse(base).success).toBe(false);
    const parsed = patientUpdateSchema.parse({
      ...base,
      id: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
      version: "3",
    });
    expect(parsed.version).toBe(3);
  });

  it("coerces list queries and preserves the search in page links", () => {
    const query = patientQuerySchema.parse({ q: " amina ", page: "2" });
    expect(query).toEqual({ q: "amina", page: 2 });
    expect(patientListHref(query, 3)).toBe("/patients?q=amina&page=3");
    expect(patientListHref({ page: 1 }, 1)).toBe("/patients");
  });
});
