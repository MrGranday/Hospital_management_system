import { z } from "zod";

export const PATIENT_SEX_VALUES = ["male", "female", "other", "unknown"] as const;

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const PATIENT_PAGE_SIZE = 25;

const SEX_LABELS: Record<(typeof PATIENT_SEX_VALUES)[number], string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  unknown: "Unknown",
};

export function patientSexLabel(sex: string): string {
  return SEX_LABELS[sex as (typeof PATIENT_SEX_VALUES)[number]] ?? "Unknown";
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

function optionalDateOfBirth() {
  return optionalText(10, "Use a valid date of birth.").refine(
    (value) => {
      if (value === null) return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const parsed = new Date(`${value}T00:00:00Z`);
      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value &&
        parsed.getTime() <= Date.now()
      );
    },
    { message: "Use a valid date of birth that is not in the future." },
  );
}

const optionalBloodGroup = z
  .union([z.enum(BLOOD_GROUPS), z.literal(""), z.null(), z.undefined()])
  .transform((value) => (value === "" || value === undefined ? null : value));

export const patientCreateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter the patient's full name.")
    .max(120, "Use 120 characters or fewer."),
  sex: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? "unknown" : value),
    z.enum(PATIENT_SEX_VALUES),
  ),
  dateOfBirth: optionalDateOfBirth(),
  phone: optionalText(32, "Use 32 characters or fewer."),
  email: optionalText(160, "Use 160 characters or fewer.").refine(
    (value) => value === null || z.email().safeParse(value).success,
    { message: "Enter a valid email address." },
  ),
  address: optionalText(240, "Use 240 characters or fewer."),
  bloodGroup: optionalBloodGroup,
  notes: optionalText(1000, "Use 1000 characters or fewer."),
});

export type PatientCreateInput = z.infer<typeof patientCreateSchema>;

export const patientUpdateSchema = patientCreateSchema.extend({
  id: z.string().uuid("Unknown patient."),
  version: z.coerce.number().int().min(1, "Unknown patient version."),
});

export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

export const patientIdSchema = z.string().uuid("Unknown patient.");

export const patientMergeSchema = z
  .object({
    sourceId: patientIdSchema,
    targetId: patientIdSchema,
    reason: z
      .string()
      .trim()
      .min(5, "Give a short reason for the merge.")
      .max(500, "Use 500 characters or fewer."),
  })
  .refine((value) => value.sourceId !== value.targetId, {
    message: "Choose a different patient to merge into.",
    path: ["targetId"],
  });

export type PatientMergeInput = z.infer<typeof patientMergeSchema>;

export const patientQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(80, "Search with 80 characters or fewer.")
    .optional()
    .catch(""),
  page: z.coerce.number().int().min(1).max(500).catch(1),
});

export type PatientQuery = z.infer<typeof patientQuerySchema>;

export function patientListHref(query: PatientQuery, page: number): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/patients?${search}` : "/patients";
}
