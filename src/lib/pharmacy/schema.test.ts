import { describe, expect, it } from "vitest";

import {
  PHARMACY_PAGE_SIZE,
  dispensationCreateSchema,
  itemBatchCreateSchema,
  itemCreateSchema,
  pharmacyQuerySchema,
  stockAdjustmentCreateSchema,
  stockLocationCreateSchema,
  stockMovementCreateSchema,
  movementTypeLabel,
} from "./schema";

describe("pharmacy schema", () => {
  it("accepts a complete stock location", () => {
    const result = stockLocationCreateSchema.safeParse({
      name: "Main Pharmacy",
      type: "pharmacy",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
    }
  });

  it("accepts a complete item", () => {
    const result = itemCreateSchema.safeParse({
      sku: "MED-001",
      name: "Amoxicillin 500mg",
      unit: "tablet",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
      expect(result.data.unit).toBe("tablet");
    }
  });

  it("accepts a complete item batch", () => {
    const result = itemBatchCreateSchema.safeParse({
      itemId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
      batchNo: "BATCH-2026-001",
      expiryDate: "2027-12-31",
      costPriceMinor: 1000,
      salePriceMinor: 1500,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("AFN");
    }
  });

  it("accepts a stock in movement", () => {
    const result = stockMovementCreateSchema.safeParse({
      itemId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
      movementType: "in",
      quantity: 100,
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero quantity movement", () => {
    expect(
      stockMovementCreateSchema.safeParse({
        itemId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
        movementType: "out",
        quantity: 0,
      }).success,
    ).toBe(false);
  });

  it("accepts a complete dispensation", () => {
    const result = dispensationCreateSchema.safeParse({
      prescriptionId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e66",
      prescriptionItemId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e67",
      stockMovementId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e68",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a complete stock adjustment", () => {
    const result = stockAdjustmentCreateSchema.safeParse({
      movementId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e68",
      reason: "Cycle count correction",
    });
    expect(result.success).toBe(true);
  });

  it("movement type labels", () => {
    expect(movementTypeLabel("in")).toBe("Stock In");
    expect(movementTypeLabel("expired")).toBe("Expired");
  });

  it("coerces list queries", () => {
    const query = pharmacyQuerySchema.parse({ q: " amoxicillin ", page: "3" });
    expect(query).toEqual({ q: "amoxicillin", page: 3 });
  });

  it("page size constant", () => {
    expect(PHARMACY_PAGE_SIZE).toBe(25);
  });
});
