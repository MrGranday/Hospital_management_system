import { z } from "zod";

export const APPOINTMENT_TYPE_VALUES = ["new", "follow-up", "emergency"] as const;
export const APPOINTMENT_STATUS_VALUES = [
  "scheduled",
  "checked-in",
  "in-progress",
  "completed",
  "cancelled",
  "no-show",
] as const;

export const APPOINTMENT_PAGE_SIZE = 25;

const TYPE_LABELS: Record<(typeof APPOINTMENT_TYPE_VALUES)[number], string> = {
  new: "New patient",
  "follow-up": "Follow-up",
  emergency: "Emergency",
};

const STATUS_LABELS: Record<(typeof APPOINTMENT_STATUS_VALUES)[number], string> = {
  scheduled: "Scheduled",
  "checked-in": "Checked in",
  "in-progress": "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No-show",
};

export function appointmentTypeLabel(type: string): string {
  return TYPE_LABELS[type as (typeof APPOINTMENT_TYPE_VALUES)[number]] ?? type;
}

export function appointmentStatusLabel(status: string): string {
  return STATUS_LABELS[status as (typeof APPOINTMENT_STATUS_VALUES)[number]] ?? status;
}

function optionalText(max: number, message: string) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      const trimmed = typeof value === "string" ? value.trim() : "";
      return trimmed === "" ? null : trimmed;
    })
    .refine((value) => value === null || value.length <= max, { message });
}

function isoDateTime(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/.test(trimmed))
    return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : trimmed;
}

export const appointmentCreateSchema = z
  .object({
    patientId: z.string().uuid("Select a valid patient."),
    providerId: z.string().uuid("Select a valid provider."),
    startsAt: z
      .preprocess(isoDateTime, z.string().datetime({ message: "Enter a valid start date and time." }))
      .refine((value) => new Date(value) > new Date(), {
        message: "The start time must be in the future.",
      }),
    endsAt: z
      .preprocess(isoDateTime, z.string().datetime({ message: "Enter a valid end date and time." })),
    type: z.enum(APPOINTMENT_TYPE_VALUES),
    status: z.preprocess(
      (value) => (value === "" || value === undefined || value === null ? "scheduled" : value),
      z.enum(APPOINTMENT_STATUS_VALUES),
    ),
    reason: z
      .string()
      .trim()
      .min(3, "Enter a reason for the appointment.")
      .max(200, "Use 200 characters or fewer."),
    notes: optionalText(1000, "Use 1000 characters or fewer."),
  })
  .refine(
    (value) => new Date(value.endsAt) > new Date(value.startsAt),
    { message: "The end time must be after the start time.", path: ["endsAt"] },
  );

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;

export const appointmentUpdateSchema = appointmentCreateSchema.extend({
  id: z.string().uuid("Unknown appointment."),
  version: z.coerce.number().int().min(1, "Unknown appointment version."),
});

export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;

export const appointmentIdSchema = z.string().uuid("Unknown appointment.");

export const appointmentStatusSchema = z.object({
  id: appointmentIdSchema,
  version: z.coerce.number().int().min(1, "Unknown appointment version."),
  status: z.enum(APPOINTMENT_STATUS_VALUES),
});

export type AppointmentStatusInput = z.infer<typeof appointmentStatusSchema>;

export const appointmentQuerySchema = z.object({
  q: z.string().trim().max(80, "Search with 80 characters or fewer.").optional().catch(""),
  page: z.coerce.number().int().min(1).max(500).catch(1),
  status: z
    .union([z.enum(APPOINTMENT_STATUS_VALUES), z.literal(""), z.null(), z.undefined()])
    .optional(),
  providerId: z.string().uuid().optional(),
});

export type AppointmentQuery = z.infer<typeof appointmentQuerySchema>;

export function appointmentListHref(query: AppointmentQuery, page: number): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.providerId) params.set("providerId", query.providerId);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/appointments?${search}` : "/appointments";
}
