import { z } from "zod";

export const MOVEMENT_TYPE_VALUES = [
  "in",
  "out",
  "adjustment",
  "expired",
  "damaged",
] as const;

export const STOCK_LOCATION_TYPE_VALUES = [
  "ward",
  "pharmacy",
  "warehouse",
  "clinic",
] as const;

export const PHARMACY_PAGE_SIZE = 25;

export const movementTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    in: "Stock In",
    out: "Stock Out",
    adjustment: "Adjustment",
    expired: "Expired",
    damaged: "Damaged",
  };
  return labels[type] ?? type;
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

function optionalNumber(
  min: number | null,
  max: number | null,
  tooLow: string,
  tooHigh: string,
) {
  return z
    .number()
    .refine((n) => min === null || n >= min, { message: tooLow })
    .refine((n) => max === null || n <= max, { message: tooHigh })
    .optional();
}

export const stockLocationCreateSchema = z.object({
  name: z.string().trim().min(1, "Enter a location name.").max(200, "Use 200 characters or fewer."),
  type: z.enum(STOCK_LOCATION_TYPE_VALUES),
  isActive: z.boolean().default(true),
});

export type StockLocationCreateInput = z.infer<typeof stockLocationCreateSchema>;

export const stockLocationUpdateSchema = stockLocationCreateSchema.extend({
  id: z.string().uuid("Unknown location."),
  version: z.coerce.number().int().min(1, "Unknown location version."),
});

export type StockLocationUpdateInput = z.infer<typeof stockLocationUpdateSchema>;

export const itemCreateSchema = z.object({
  sku: z.string().trim().min(1, "Enter a SKU.").max(50, "Use 50 characters or fewer."),
  name: z.string().trim().min(1, "Enter an item name.").max(200, "Use 200 characters or fewer."),
  description: optionalText(1000, "Use 1000 characters or fewer."),
  category: optionalText(100, "Use 100 characters or fewer."),
  unit: z.string().trim().min(1, "Enter a unit.").max(20, "Use 20 characters or fewer.").default("piece"),
  isActive: z.boolean().default(true),
  requiresPrescription: z.boolean().default(false),
  isControlled: z.boolean().default(false),
});

export type ItemCreateInput = z.infer<typeof itemCreateSchema>;

export const itemUpdateSchema = itemCreateSchema.extend({
  id: z.string().uuid("Unknown item."),
  version: z.coerce.number().int().min(1, "Unknown item version."),
});

export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;

export const itemBatchCreateSchema = z.object({
  itemId: z.string().uuid("Select a valid item."),
  batchNo: z.string().trim().min(1, "Enter a batch number.").max(50, "Use 50 characters or fewer."),
  expiryDate: z.string().date(),
  costPriceMinor: z.coerce.number().int().min(0, "Cost price must be zero or greater."),
  salePriceMinor: z.coerce.number().int().min(0, "Sale price must be zero or greater."),
  currency: z.string().length(3, "Use a 3-letter currency code.").default("AFN"),
});

export type ItemBatchCreateInput = z.infer<typeof itemBatchCreateSchema>;

export const itemBatchUpdateSchema = itemBatchCreateSchema.extend({
  id: z.string().uuid("Unknown batch."),
  version: z.coerce.number().int().min(1, "Unknown batch version."),
});

export type ItemBatchUpdateInput = z.infer<typeof itemBatchUpdateSchema>;

export const stockMovementCreateSchema = z.object({
  itemId: z.string().uuid("Select a valid item."),
  batchId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  movementType: z.enum(MOVEMENT_TYPE_VALUES),
  quantity: z.coerce.number().int().refine((n) => n !== 0, { message: "Quantity cannot be zero." }),
  referenceType: optionalText(50, "Use 50 characters or fewer."),
  referenceId: z.string().uuid().optional(),
  notes: optionalText(1000, "Use 1000 characters or fewer."),
});

export type StockMovementCreateInput = z.infer<typeof stockMovementCreateSchema>;

export const dispensationCreateSchema = z.object({
  prescriptionId: z.string().uuid("Select a valid prescription."),
  prescriptionItemId: z.string().uuid("Select a valid prescription item."),
  stockMovementId: z.string().uuid("Select a valid stock movement."),
  notes: optionalText(1000, "Use 1000 characters or fewer."),
});

export type DispensationCreateInput = z.infer<typeof dispensationCreateSchema>;

export const stockAdjustmentCreateSchema = z.object({
  movementId: z.string().uuid("Select a valid stock movement."),
  reason: z.string().trim().min(1, "Enter a reason.").max(500, "Use 500 characters or fewer."),
});

export type StockAdjustmentCreateInput = z.infer<typeof stockAdjustmentCreateSchema>;

export const pharmacyQuerySchema = z.object({
  q: z.string().trim().max(80, "Search with 80 characters or fewer.").optional().default(""),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

export type PharmacyQuery = z.infer<typeof pharmacyQuerySchema>;
