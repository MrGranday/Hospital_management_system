import { z } from "zod";

export const INVOICE_STATUS_VALUES = [
  "draft",
  "issued",
  "paid",
  "partially_paid",
  "voided",
  "credited",
] as const;

export const PAYMENT_METHOD_VALUES = ["cash", "card", "insurance", "transfer"] as const;

export const BILLING_PAGE_SIZE = 25;

export const invoiceStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: "Draft",
    issued: "Issued",
    paid: "Paid",
    "partially_paid": "Partially Paid",
    voided: "Voided",
    credited: "Credited",
  };
  return labels[status] ?? status;
};

export const paymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    cash: "Cash",
    card: "Card",
    insurance: "Insurance",
    transfer: "Bank Transfer",
  };
  return labels[method] ?? method;
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

export const serviceCreateSchema = z.object({
  code: z.string().trim().min(1, "Enter a service code.").max(50, "Use 50 characters or fewer."),
  name: z.string().trim().min(1, "Enter a service name.").max(200, "Use 200 characters or fewer."),
  description: optionalText(1000, "Use 1000 characters or fewer."),
  unitPriceMinor: z
    .coerce.number()
    .int()
    .min(0, "Price must be zero or greater."),
  currency: z.string().length(3, "Use a 3-letter currency code.").default("AFN"),
  isActive: z.boolean().default(true),
  department: optionalText(100, "Use 100 characters or fewer."),
});

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;

export const serviceUpdateSchema = serviceCreateSchema.extend({
  id: z.string().uuid("Unknown service."),
  version: z.coerce.number().int().min(1, "Unknown service version."),
});

export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;

export const invoiceCreateSchema = z.object({
  patientId: z.string().uuid("Select a valid patient."),
  status: z.enum(INVOICE_STATUS_VALUES).default("draft"),
  subtotalMinor: z.coerce.number().int().min(0, "Subtotal must be zero or greater."),
  taxMinor: z.coerce.number().int().min(0, "Tax must be zero or greater."),
  currency: z.string().length(3, "Use a 3-letter currency code.").default("AFN"),
});

export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;

export const invoiceUpdateSchema = invoiceCreateSchema.extend({
  id: z.string().uuid("Unknown invoice."),
  version: z.coerce.number().int().min(1, "Unknown invoice version."),
});

export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;

export const invoiceLineCreateSchema = z.object({
  invoiceId: z.string().uuid("Select a valid invoice."),
  serviceId: z.string().uuid().optional(),
  description: z.string().trim().min(1, "Enter a description.").max(500, "Use 500 characters or fewer."),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  unitPriceMinor: z.coerce.number().int().min(0, "Unit price must be zero or greater."),
});

export type InvoiceLineCreateInput = z.infer<typeof invoiceLineCreateSchema>;

export const paymentCreateSchema = z.object({
  invoiceId: z.string().uuid("Select a valid invoice."),
  amountMinor: z.coerce.number().int().min(1, "Amount must be at least 1."),
  currency: z.string().length(3, "Use a 3-letter currency code.").default("AFN"),
  paymentMethod: z.enum(PAYMENT_METHOD_VALUES),
  reference: optionalText(200, "Use 200 characters or fewer."),
});

export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;

export const creditNoteCreateSchema = z.object({
  invoiceId: z.string().uuid("Select a valid invoice."),
  amountMinor: z.coerce.number().int().min(1, "Amount must be at least 1."),
  currency: z.string().length(3, "Use a 3-letter currency code.").default("AFN"),
  reason: z.string().trim().min(1, "Enter a reason.").max(500, "Use 500 characters or fewer."),
});

export type CreditNoteCreateInput = z.infer<typeof creditNoteCreateSchema>;

export const billingQuerySchema = z.object({
  q: z.string().trim().max(80, "Search with 80 characters or fewer.").optional().default(""),
  page: z.coerce.number().int().min(1).max(500).default(1),
  status: z.enum(INVOICE_STATUS_VALUES).optional(),
});

export type BillingQuery = z.infer<typeof billingQuerySchema>;
