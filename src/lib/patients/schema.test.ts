import { describe, expect, it } from "vitest";

import {
  DOCUMENT_MAX_BYTES,
  patientCreateSchema,
  patientDocumentIdSchema,
  patientDocumentUploadSchema,
  patientListHref,
  patientMergeSchema,
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

  it("requires a distinct target and a reason when merging", () => {
    const ids = {
      sourceId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
      targetId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e65",
    };
    expect(patientMergeSchema.safeParse({ ...ids, reason: "Same person, duplicate file" }).success).toBe(
      true,
    );
    expect(patientMergeSchema.safeParse({ ...ids, reason: "dup" }).success).toBe(false);
    expect(
      patientMergeSchema.safeParse({ ...ids, targetId: ids.sourceId, reason: "Same person" }).success,
    ).toBe(false);
  });

  it("validates document type, size and ids", () => {
    const patientId = "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64";
    const pdf = new File([new Uint8Array([1, 2, 3])], "scan.pdf", {
      type: "application/pdf",
    });
    expect(patientDocumentUploadSchema.safeParse({ patientId, file: pdf }).success).toBe(true);
    expect(
      patientDocumentUploadSchema.safeParse({
        patientId,
        file: new File(["text"], "notes.txt", { type: "text/plain" }),
      }).success,
    ).toBe(false);
    expect(
      patientDocumentUploadSchema.safeParse({
        patientId,
        file: new File([], "empty.pdf", { type: "application/pdf" }),
      }).success,
    ).toBe(false);
    expect(
      patientDocumentUploadSchema.safeParse({
        patientId,
        file: new File([new Uint8Array(DOCUMENT_MAX_BYTES + 1)], "big.pdf", {
          type: "application/pdf",
        }),
      }).success,
    ).toBe(false);
    expect(
      patientDocumentIdSchema.safeParse({ patientId, documentId: patientId }).success,
    ).toBe(true);
  });
});
