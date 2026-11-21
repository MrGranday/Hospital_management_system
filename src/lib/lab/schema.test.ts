import { describe, expect, it } from "vitest";

import {
  LAB_PAGE_SIZE,
  labOrderCreateSchema,
  labOrderItemCreateSchema,
  labOrderUpdateSchema,
  labQuerySchema,
  labResultCreateSchema,
  labOrderStatusLabel,
  labPriorityLabel,
} from "./schema";

describe("lab schema", () => {
  it("accepts a complete lab order", () => {
    const result = labOrderCreateSchema.safeParse({
      patientId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
      providerId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e65",
      priority: "stat",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("stat");
      expect(result.data.notes).toBeUndefined();
    }
  });

  it("rejects missing required fields", () => {
    expect(labOrderCreateSchema.safeParse({}).success).toBe(false);
    expect(
      labOrderCreateSchema.safeParse({
        patientId: "not-a-uuid",
        providerId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e65",
        priority: "routine",
      }).success,
    ).toBe(false);
  });

  it("requires id, version, status for updates", () => {
    expect(labOrderUpdateSchema.safeParse({}).success).toBe(false);
    const parsed = labOrderUpdateSchema.parse({
      id: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e66",
      version: "2",
      status: "completed",
      patientId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
      providerId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e65",
    });
    expect(parsed.version).toBe(2);
    expect(parsed.status).toBe("completed");
  });

  it("accepts a complete lab order item", () => {
    const result = labOrderItemCreateSchema.safeParse({
      labOrderId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e66",
      testName: "Blood Glucose",
      testCode: "GLU",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty test name", () => {
    expect(
      labOrderItemCreateSchema.safeParse({
        labOrderId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e66",
        testName: "   ",
      }).success,
    ).toBe(false);
  });

  it("accepts a complete lab result", () => {
    const result = labResultCreateSchema.safeParse({
      labOrderItemId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e67",
      resultValue: "98.5",
      resultUnit: "mg/dL",
      isAbnormal: false,
      status: "final",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("final");
    }
  });

  it("rejects empty result value", () => {
    expect(
      labResultCreateSchema.safeParse({
        labOrderItemId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e67",
        resultValue: "",
      }).success,
    ).toBe(false);
  });

  it("status labels", () => {
    expect(labOrderStatusLabel("ordered")).toBe("Ordered");
    expect(labOrderStatusLabel("completed")).toBe("Completed");
  });

  it("priority labels", () => {
    expect(labPriorityLabel("stat")).toBe("STAT");
    expect(labPriorityLabel("routine")).toBe("Routine");
  });

  it("coerces list queries", () => {
    const query = labQuerySchema.parse({ q: " glucose ", page: "2", status: "completed" });
    expect(query).toEqual({ q: "glucose", page: 2, status: "completed" });
  });

  it("page size constant", () => {
    expect(LAB_PAGE_SIZE).toBe(25);
  });
});
