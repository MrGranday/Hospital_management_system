import { z } from "zod";

export const VISIT_STATUS_VALUES = [
  "waiting",
  "vitals",
  "consultation",
  "completed",
  "cancelled",
] as const;

export const VISIT_PAGE_SIZE = 25;

const STATUS_LABELS: Record<(typeof VISIT_STATUS_VALUES)[number], string> = {
  waiting: "Waiting",
  vitals: "Vitals",
  consultation: "Consultation",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function visitStatusLabel(status: string): string {
  return STATUS_LABELS[status as (typeof VISIT_STATUS_VALUES)[number]] ?? status;
}

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

export const visitCreateSchema = z.object({
  patientId: z.string().uuid("Select a valid patient."),
  providerId: z.string().uuid("Select a valid provider."),
  appointmentId: z.string().uuid().optional(),
  chiefComplaint: optionalText(200, "Use 200 characters or fewer."),
});

export type VisitCreateInput = z.infer<typeof visitCreateSchema>;

export const visitUpdateSchema = visitCreateSchema.extend({
  id: z.string().uuid("Unknown visit."),
  version: z.coerce.number().int().min(1, "Unknown visit version."),
  status: z.enum(VISIT_STATUS_VALUES),
  queuePosition: optionalNumber(1, null, "Queue position must be at least 1", ""),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

export type VisitUpdateInput = z.infer<typeof visitUpdateSchema>;

export const visitIdSchema = z.string().uuid("Unknown visit.");

export const visitStatusSchema = z.object({
  id: visitIdSchema,
  version: z.coerce.number().int().min(1, "Unknown visit version."),
  status: z.enum(VISIT_STATUS_VALUES),
});

export type VisitStatusInput = z.infer<typeof visitStatusSchema>;

export const vitalsCreateSchema = z.object({
  visitId: z.string().uuid("Unknown visit."),
  temperatureC: optionalNumber(
    20,
    45,
    "Temperature must be at least 20°C",
    "Temperature must be at most 45°C",
  ),
  heartRate: optionalNumber(
    20,
    220,
    "Heart rate must be at least 20 bpm",
    "Heart rate must be at most 220 bpm",
  ),
  respiratoryRate: optionalNumber(
    5,
    60,
    "Respiratory rate must be at least 5",
    "Respiratory rate must be at most 60",
  ),
  bloodPressureSystolic: optionalNumber(
    50,
    300,
    "Systolic BP must be at least 50",
    "Systolic BP must be at most 300",
  ),
  bloodPressureDiastolic: optionalNumber(
    20,
    200,
    "Diastolic BP must be at least 20",
    "Diastolic BP must be at most 200",
  ),
  oxygenSaturation: optionalNumber(
    50,
    100,
    "Oxygen saturation must be at least 50%",
    "Oxygen saturation must be at most 100%",
  ),
  weightKg: optionalNumber(
    0,
    null,
    "Weight must be positive",
    "",
  ),
  heightCm: optionalNumber(
    0,
    null,
    "Height must be positive",
    "",
  ),
  notes: optionalText(1000, "Use 1000 characters or fewer."),
});

export type VitalsCreateInput = z.infer<typeof vitalsCreateSchema>;

export const visitQuerySchema = z.object({
  q: z.string().trim().max(80, "Search with 80 characters or fewer.").optional().default(""),
  page: z.coerce.number().int().min(1).max(500).default(1),
  status: z.enum(VISIT_STATUS_VALUES).nullable().optional(),
});

export type VisitQuery = z.infer<typeof visitQuerySchema>;

export function visitListHref(query: VisitQuery, page: number): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/visits?${search}` : "/visits";
}
