import { z } from "zod";

export const LAB_ORDER_STATUS_VALUES = [
  "ordered",
  "sample_collected",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const LAB_PRIORITY_VALUES = ["routine", "urgent", "stat"] as const;

export const LAB_ITEM_STATUS_VALUES = [
  "pending",
  "collected",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const LAB_RESULT_STATUS_VALUES = ["preliminary", "final", "corrected"] as const;

export const LAB_PAGE_SIZE = 25;

export const labOrderStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    ordered: "Ordered",
    sample_collected: "Sample Collected",
    "in_progress": "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
};

export const labPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    routine: "Routine",
    urgent: "Urgent",
    stat: "STAT",
  };
  return labels[priority] ?? priority;
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

export const labOrderCreateSchema = z.object({
  patientId: z.string().uuid("Select a valid patient."),
  visitId: z.string().uuid().optional(),
  providerId: z.string().uuid("Select a valid provider."),
  priority: z.enum(LAB_PRIORITY_VALUES).default("routine"),
  notes: optionalText(1000, "Use 1000 characters or fewer."),
});

export type LabOrderCreateInput = z.infer<typeof labOrderCreateSchema>;

export const labOrderUpdateSchema = labOrderCreateSchema.extend({
  id: z.string().uuid("Unknown lab order."),
  version: z.coerce.number().int().min(1, "Unknown lab order version."),
  status: z.enum(LAB_ORDER_STATUS_VALUES),
});

export type LabOrderUpdateInput = z.infer<typeof labOrderUpdateSchema>;

export const labOrderItemCreateSchema = z.object({
  labOrderId: z.string().uuid("Select a valid lab order."),
  testName: z.string().trim().min(1, "Enter a test name.").max(200, "Use 200 characters or fewer."),
  testCode: optionalText(50, "Use 50 characters or fewer."),
});

export type LabOrderItemCreateInput = z.infer<typeof labOrderItemCreateSchema>;

export const labResultCreateSchema = z.object({
  labOrderItemId: z.string().uuid("Select a valid lab order item."),
  resultValue: z.string().trim().min(1, "Enter a result value."),
  resultUnit: optionalText(50, "Use 50 characters or fewer."),
  referenceRange: optionalText(100, "Use 100 characters or fewer."),
  isAbnormal: z.boolean().default(false),
  status: z.enum(LAB_RESULT_STATUS_VALUES).default("preliminary"),
});

export type LabResultCreateInput = z.infer<typeof labResultCreateSchema>;

export const labQuerySchema = z.object({
  q: z.string().trim().max(80, "Search with 80 characters or fewer.").optional().default(""),
  page: z.coerce.number().int().min(1).max(500).default(1),
  status: z.enum(LAB_ORDER_STATUS_VALUES).optional(),
});

export type LabQuery = z.infer<typeof labQuerySchema>;
