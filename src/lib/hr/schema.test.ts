import { describe, expect, it } from "vitest";

import {
  HR_PAGE_SIZE,
  attendanceCreateSchema,
  departmentCreateSchema,
  hrQuerySchema,
  leaveRequestCreateSchema,
  shiftCreateSchema,
  staffCreateSchema,
  attendanceStatusLabel,
  leaveStatusLabel,
  shiftStatusLabel,
} from "./schema";

describe("hr schema", () => {
  it("accepts a complete department", () => {
    const result = departmentCreateSchema.safeParse({
      name: "Nursing",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
    }
  });

  it("accepts a complete staff member", () => {
    const result = staffCreateSchema.safeParse({
      userId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
      employeeId: "EMP-001",
      jobTitle: "Staff Nurse",
      employmentType: "full-time",
      hireDate: "2026-01-15",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
      expect(result.data.currency).toBe("AFN");
    }
  });

  it("rejects missing required fields", () => {
    expect(staffCreateSchema.safeParse({}).success).toBe(false);
    expect(
      staffCreateSchema.safeParse({
        userId: "not-a-uuid",
        employeeId: "EMP-001",
        jobTitle: "Nurse",
        employmentType: "full-time",
        hireDate: "2026-01-15",
      }).success,
    ).toBe(false);
  });

  it("accepts a complete shift", () => {
    const result = shiftCreateSchema.safeParse({
      staffId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e65",
      shiftDate: "2026-12-01",
      startTime: "08:00",
      endTime: "16:00",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.breakMinutes).toBe(0);
      expect(result.data.status).toBe("scheduled");
    }
  });

  it("rejects invalid time format", () => {
    expect(
      shiftCreateSchema.safeParse({
        staffId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e65",
        shiftDate: "2026-12-01",
        startTime: "8:00",
        endTime: "16:00",
      }).success,
    ).toBe(false);
  });

  it("accepts a complete attendance record", () => {
    const result = attendanceCreateSchema.safeParse({
      staffId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
      attendanceDate: "2026-12-01",
      status: "present",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a complete leave request", () => {
    const result = leaveRequestCreateSchema.safeParse({
      staffId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
      leaveType: "vacation",
      startDate: "2026-12-01",
      endDate: "2026-12-05",
      days: 5,
      reason: "Family vacation",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero days", () => {
    expect(
      leaveRequestCreateSchema.safeParse({
        staffId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
        leaveType: "vacation",
        startDate: "2026-12-01",
        endDate: "2026-12-01",
        days: 0,
        reason: "Test",
      }).success,
    ).toBe(false);
  });

  it("status labels", () => {
    expect(shiftStatusLabel("scheduled")).toBe("Scheduled");
    expect(attendanceStatusLabel("present")).toBe("Present");
    expect(leaveStatusLabel("pending")).toBe("Pending");
  });

  it("coerces list queries", () => {
    const query = hrQuerySchema.parse({ q: " nurse ", page: "2" });
    expect(query).toEqual({ q: "nurse", page: 2 });
  });

  it("page size constant", () => {
    expect(HR_PAGE_SIZE).toBe(25);
  });
});
