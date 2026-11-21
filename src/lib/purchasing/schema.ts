import { z } from "zod";

export const SUPPLIER_PAYMENT_TERMS = ["net30", "net15", "net60", "cod"] as const;

export const PO_STATUS_VALUES = [
  "draft",
  "sent",
  "approved",
  "received",
  "cancelled",
] as const;

export const RETURN_STATUS_VALUES = [
  "draft",
  "submitted",
  "approved",
  "completed",
] as const;

export const PURCHASING_PAGE_SIZE = 25;

export const poStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: "Draft",
    sent: "Sent",
    approved: "Approved",
    received: "Received",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
};

export const returnStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    approved: "Approved",
    completed: "Completed",
  };
  return labels[status] ?? status;
};

function optionalText(max: number, message: string) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      const trimmed = typeof value === "string" ? value.trim() : "";
      return trimmed === "" ? null : trimmed;
    })
    .refine((value) => value === null || value.length <= max, { message })
    .optional();
}

export const supplierCreateSchema = z.object({
  supplierCode: z
    .string()
    .trim()
    .min(1, "Enter a supplier code.")
    .max(50, "Use 50 characters or fewer."),
  name: z.string().trim().min(1, "Enter a supplier name.").max(200, "Use 200 characters or fewer."),
  contactName: optionalText(200, "Use 200 characters or fewer."),
  contactEmail: z.string().email("Enter a valid email address.").optional(),
  contactPhone: optionalText(50, "Use 50 characters or fewer."),
  address: optionalText(500, "Use 500 characters or fewer."),
  taxId: optionalText(50, "Use 50 characters or fewer."),
  paymentTerms: z.enum(SUPPLIER_PAYMENT_TERMS).default("net30"),
  isActive: z.boolean().default(true),
});

export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>;

export const supplierUpdateSchema = supplierCreateSchema.extend({
  id: z.string().uuid("Unknown supplier."),
  version: z.coerce.number().int().min(1, "Unknown supplier version."),
});

export type SupplierUpdateInput = z.infer<typeof supplierUpdateSchema>;

export const purchaseOrderCreateSchema = z.object({
  supplierId: z.string().uuid("Select a valid supplier."),
  status: z.enum(PO_STATUS_VALUES).default("draft"),
  subtotalMinor: z.coerce.number().int().min(0, "Subtotal must be zero or greater."),
  taxMinor: z.coerce.number().int().min(0, "Tax must be zero or greater."),
  currency: z.string().length(3, "Use a 3-letter currency code.").default("AFN"),
  notes: optionalText(1000, "Use 1000 characters or fewer."),
});

export type PurchaseOrderCreateInput = z.infer<typeof purchaseOrderCreateSchema>;

export const purchaseOrderUpdateSchema = purchaseOrderCreateSchema.extend({
  id: z.string().uuid("Unknown purchase order."),
  version: z.coerce.number().int().min(1, "Unknown purchase order version."),
});

export type PurchaseOrderUpdateInput = z.infer<typeof purchaseOrderUpdateSchema>;

export const poLineCreateSchema = z.object({
  purchaseOrderId: z.string().uuid("Select a valid purchase order."),
  itemId: z.string().uuid().optional(),
  description: z.string().trim().min(1, "Enter a description.").max(500, "Use 500 characters or fewer."),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  unitPriceMinor: z.coerce.number().int().min(0, "Unit price must be zero or greater."),
});

export type PoLineCreateInput = z.infer<typeof poLineCreateSchema>;

export const goodsReceiptCreateSchema = z.object({
  purchaseOrderId: z.string().uuid("Select a valid purchase order."),
  receiptNo: z.string().trim().min(1, "Enter a receipt number.").max(50, "Use 50 characters or fewer."),
  notes: optionalText(1000, "Use 1000 characters or fewer."),
});

export type GoodsReceiptCreateInput = z.infer<typeof goodsReceiptCreateSchema>;

export const purchaseReturnCreateSchema = z.object({
  purchaseOrderId: z.string().uuid().optional(),
  goodsReceiptId: z.string().uuid().optional(),
  status: z.enum(RETURN_STATUS_VALUES).default("draft"),
  reason: z.string().trim().min(1, "Enter a reason.").max(500, "Use 500 characters or fewer."),
  amountMinor: z.coerce.number().int().min(1, "Amount must be at least 1."),
  currency: z.string().length(3, "Use a 3-letter currency code.").default("AFN"),
});

export type PurchaseReturnCreateInput = z.infer<typeof purchaseReturnCreateSchema>;

export const purchasingQuerySchema = z.object({
  q: z.string().trim().max(80, "Search with 80 characters or fewer.").optional().default(""),
  page: z.coerce.number().int().min(1).max(500).default(1),
  status: z.string().optional(),
});

export type PurchasingQuery = z.infer<typeof purchasingQuerySchema>;
