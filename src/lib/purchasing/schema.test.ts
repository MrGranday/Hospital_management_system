import { describe, expect, it } from "vitest";

import {
  PURCHASING_PAGE_SIZE,
  purchasingQuerySchema,
  purchaseOrderCreateSchema,
  purchaseReturnCreateSchema,
  goodsReceiptCreateSchema,
  poLineCreateSchema,
  supplierCreateSchema,
  poStatusLabel,
  returnStatusLabel,
} from "./schema";

describe("purchasing schema", () => {
  it("accepts a complete supplier", () => {
    const result = supplierCreateSchema.safeParse({
      supplierCode: "SUP-001",
      name: "MedSupply Inc",
      paymentTerms: "net30",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
      expect(result.data.paymentTerms).toBe("net30");
    }
  });

  it("rejects missing required fields", () => {
    expect(supplierCreateSchema.safeParse({}).success).toBe(false);
    expect(
      supplierCreateSchema.safeParse({
        supplierCode: "",
        name: "Test",
      }).success,
    ).toBe(false);
  });

  it("accepts a complete purchase order", () => {
    const result = purchaseOrderCreateSchema.safeParse({
      supplierId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
      subtotalMinor: 10000,
      taxMinor: 1000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("draft");
      expect(result.data.currency).toBe("AFN");
    }
  });

  it("rejects negative subtotal", () => {
    expect(
      purchaseOrderCreateSchema.safeParse({
        supplierId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
        subtotalMinor: -100,
        taxMinor: 0,
      }).success,
    ).toBe(false);
  });

  it("accepts a complete PO line", () => {
    const result = poLineCreateSchema.safeParse({
      purchaseOrderId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e66",
      description: "Surgical masks",
      quantity: 100,
      unitPriceMinor: 500,
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero quantity", () => {
    expect(
      poLineCreateSchema.safeParse({
        purchaseOrderId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e66",
        description: "Test",
        quantity: 0,
        unitPriceMinor: 100,
      }).success,
    ).toBe(false);
  });

  it("accepts a complete goods receipt", () => {
    const result = goodsReceiptCreateSchema.safeParse({
      purchaseOrderId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e66",
      receiptNo: "GR-2026-001",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a complete purchase return", () => {
    const result = purchaseReturnCreateSchema.safeParse({
      reason: "Damaged goods",
      amountMinor: 2000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("draft");
    }
  });

  it("rejects zero return amount", () => {
    expect(
      purchaseReturnCreateSchema.safeParse({
        reason: "Test",
        amountMinor: 0,
      }).success,
    ).toBe(false);
  });

  it("PO status labels", () => {
    expect(poStatusLabel("draft")).toBe("Draft");
    expect(poStatusLabel("received")).toBe("Received");
  });

  it("return status labels", () => {
    expect(returnStatusLabel("submitted")).toBe("Submitted");
    expect(returnStatusLabel("completed")).toBe("Completed");
  });

  it("coerces list queries", () => {
    const query = purchasingQuerySchema.parse({ q: " mask ", page: "2", status: "approved" });
    expect(query).toEqual({ q: "mask", page: 2, status: "approved" });
  });

  it("page size constant", () => {
    expect(PURCHASING_PAGE_SIZE).toBe(25);
  });
});
