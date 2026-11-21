import { describe, expect, it } from "vitest";

import {
  APPOINTMENT_PAGE_SIZE,
  appointmentCreateSchema,
  appointmentListHref,
  appointmentQuerySchema,
  appointmentStatusSchema,
  appointmentUpdateSchema,
} from "./schema";

const base = {
  patientId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
  providerId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e65",
  startsAt: "2026-12-01T09:00:00Z",
  endsAt: "2026-12-01T09:30:00Z",
  type: "new" as const,
  status: "scheduled" as const,
  reason: "Initial consultation",
  notes: "Patient reports mild headache.",
};

describe("appointment schema", () => {
  it("accepts a complete appointment", () => {
    const parsed = appointmentCreateSchema.parse(base);
    expect(parsed.patientId).toBe(base.patientId);
    expect(parsed.type).toBe("new");
    expect(parsed.status).toBe("scheduled");
  });

  it("rejects past start times", () => {
    expect(
      appointmentCreateSchema.safeParse({ ...base, startsAt: "2020-01-01T00:00:00Z" }).success,
    ).toBe(false);
  });

  it("rejects end time before start time", () => {
    expect(
      appointmentCreateSchema.safeParse({
        ...base,
        startsAt: "2026-12-01T10:00:00Z",
        endsAt: "2026-12-01T09:00:00Z",
      }).success,
    ).toBe(false);
  });

  it("rejects blank reason and invalid status", () => {
    expect(
      appointmentCreateSchema.safeParse({ ...base, reason: "   " }).success,
    ).toBe(false);
    expect(
      appointmentCreateSchema.safeParse({ ...base, status: "rescheduled" as any }).success,
    ).toBe(false);
  });

  it("requires id and version for updates", () => {
    expect(appointmentUpdateSchema.safeParse(base).success).toBe(false);
    const parsed = appointmentUpdateSchema.parse({
      ...base,
      id: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e66",
      version: "3",
    });
    expect(parsed.version).toBe(3);
  });

  it("validates status transition input", () => {
    const parsed = appointmentStatusSchema.parse({
      id: base.patientId,
      version: "1",
      status: "checked-in",
    });
    expect(parsed.status).toBe("checked-in");
    expect(
      appointmentStatusSchema.safeParse({ ...parsed, status: "unknown" as any }).success,
    ).toBe(false);
  });

  it("coerces list queries and preserves filters in page links", () => {
    const query = appointmentQuerySchema.parse({
      q: " amina ",
      page: "2",
      status: "scheduled",
      providerId: base.providerId,
    });
    expect(query).toEqual({ q: "amina", page: 2, status: "scheduled", providerId: base.providerId });
    expect(appointmentListHref(query, 3)).toBe(
      "/appointments?q=amina&status=scheduled&providerId=" + base.providerId + "&page=3",
    );
    expect(appointmentListHref({ page: 1, status: undefined, providerId: undefined }, 1)).toBe(
      "/appointments",
    );
  });

  it("page size constant", () => {
    expect(APPOINTMENT_PAGE_SIZE).toBe(25);
  });
});
