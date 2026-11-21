import { describe, expect, it } from "vitest";

import {
  BILLING_PAGE_SIZE,
  billingQuerySchema,
  creditNoteCreateSchema,
  invoiceCreateSchema,
  invoiceLineCreateSchema,
  paymentCreateSchema,
  serviceCreateSchema,
  invoiceStatusLabel,
  paymentMethodLabel,
} from "./schema";

describe("billing schema", () => {
  it("accepts a complete service", () => {
    const result = serviceCreateSchema.safeParse({
      code: "CONSULT",
      name: "General Consultation",
      unitPriceMinor: 5000,
      currency: "AFN",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
      expect(result.data.currency).toBe("AFN");
    }
  });

  it("rejects invalid currency code", () => {
    expect(
      serviceCreateSchema.safeParse({
        code: "CONSULT",
        name: "Consultation",
        unitPriceMinor: 5000,
        currency: "USDollar",
      }).success,
    ).toBe(false);
  });

  it("accepts a complete invoice", () => {
    const result = invoiceCreateSchema.safeParse({
      patientId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
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
      invoiceCreateSchema.safeParse({
        patientId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e64",
        subtotalMinor: -100,
        taxMinor: 0,
      }).success,
    ).toBe(false);
  });

  it("accepts a complete invoice line", () => {
    const result = invoiceLineCreateSchema.safeParse({
      invoiceId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e66",
      description: "Consultation fee",
      quantity: 2,
      unitPriceMinor: 5000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero quantity", () => {
    expect(
      invoiceLineCreateSchema.safeParse({
        invoiceId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e66",
        description: "Test",
        quantity: 0,
        unitPriceMinor: 100,
      }).success,
    ).toBe(false);
  });

  it("accepts a complete payment", () => {
    const result = paymentCreateSchema.safeParse({
      invoiceId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e66",
      amountMinor: 5000,
      paymentMethod: "cash",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("AFN");
    }
  });

  it("rejects zero payment amount", () => {
    expect(
      paymentCreateSchema.safeParse({
        invoiceId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e66",
        amountMinor: 0,
        paymentMethod: "cash",
      }).success,
    ).toBe(false);
  });

  it("accepts a complete credit note", () => {
    const result = creditNoteCreateSchema.safeParse({
      invoiceId: "5f7b2c1e-5a65-4f6d-9d5e-0d9b1c8a7e66",
      amountMinor: 2000,
      reason: "Duplicate charge",
    });
    expect(result.success).toBe(true);
  });

  it("coerces list queries", () => {
    const query = billingQuerySchema.parse({ q: " invoice ", page: "2", status: "issued" });
    expect(query).toEqual({ q: "invoice", page: 2, status: "issued" });
  });

  it("invoice status labels", () => {
    expect(invoiceStatusLabel("draft")).toBe("Draft");
    expect(invoiceStatusLabel("paid")).toBe("Paid");
  });

  it("payment method labels", () => {
    expect(paymentMethodLabel("cash")).toBe("Cash");
    expect(paymentMethodLabel("insurance")).toBe("Insurance");
  });

  it("page size constant", () => {
    expect(BILLING_PAGE_SIZE).toBe(25);
  });
});
