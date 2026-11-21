import { z } from "zod";

export const NOTE_TYPE_VALUES = [
  "consultation",
  "progress",
  "discharge",
  "procedure",
] as const;

export const DIAGNOSIS_SEVERITY_VALUES = ["mild", "moderate", "severe"] as const;

export const PRESCRIPTION_STATUS_VALUES = [
  "active",
  "completed",
  "cancelled",
  "discontinued",
] as const;

export const EMR_PAGE_SIZE = 25;

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

export const clinicalNoteCreateSchema = z.object({
  visitId: z.string().uuid("Select a valid visit."),
  providerId: z.string().uuid("Select a valid provider."),
  noteType: z.enum(NOTE_TYPE_VALUES),
  title: z.string().trim().min(1, "Enter a title.").max(200, "Use 200 characters or fewer."),
  content: z.string().trim().min(1, "Enter note content."),
  isConfidential: z.boolean().default(false),
});

export type ClinicalNoteCreateInput = z.infer<typeof clinicalNoteCreateSchema>;

export const clinicalNoteUpdateSchema = clinicalNoteCreateSchema.extend({
  id: z.string().uuid("Unknown note."),
  version: z.coerce.number().int().min(1, "Unknown note version."),
});

export type ClinicalNoteUpdateInput = z.infer<typeof clinicalNoteUpdateSchema>;

export const diagnosisCreateSchema = z.object({
  patientId: z.string().uuid("Select a valid patient."),
  visitId: z.string().uuid().optional(),
  providerId: z.string().uuid("Select a valid provider."),
  icdCode: z.string().trim().min(1, "Enter an ICD code.").max(20, "Use 20 characters or fewer."),
  description: z.string().trim().min(1, "Enter a description.").max(500, "Use 500 characters or fewer."),
  isPrimary: z.boolean().default(false),
  isChronic: z.boolean().default(false),
});

export type DiagnosisCreateInput = z.infer<typeof diagnosisCreateSchema>;

export const diagnosisUpdateSchema = diagnosisCreateSchema.extend({
  id: z.string().uuid("Unknown diagnosis."),
  version: z.coerce.number().int().min(1, "Unknown diagnosis version."),
});

export type DiagnosisUpdateInput = z.infer<typeof diagnosisUpdateSchema>;

export const allergyCreateSchema = z.object({
  patientId: z.string().uuid("Select a valid patient."),
  allergen: z.string().trim().min(1, "Enter an allergen.").max(200, "Use 200 characters or fewer."),
  reaction: optionalText(500, "Use 500 characters or fewer."),
  severity: z.enum(DIAGNOSIS_SEVERITY_VALUES).optional(),
  isActive: z.boolean().default(true),
});

export type AllergyCreateInput = z.infer<typeof allergyCreateSchema>;

export const allergyUpdateSchema = allergyCreateSchema.extend({
  id: z.string().uuid("Unknown allergy."),
  version: z.coerce.number().int().min(1, "Unknown allergy version."),
});

export type AllergyUpdateInput = z.infer<typeof allergyUpdateSchema>;

export const problemCreateSchema = z.object({
  patientId: z.string().uuid("Select a valid patient."),
  condition: z.string().trim().min(1, "Enter a condition.").max(200, "Use 200 characters or fewer."),
  icdCode: optionalText(20, "Use 20 characters or fewer."),
  isActive: z.boolean().default(true),
  onsetDate: z.string().date().optional(),
  resolvedDate: z.string().date().optional(),
});

export type ProblemCreateInput = z.infer<typeof problemCreateSchema>;

export const problemUpdateSchema = problemCreateSchema.extend({
  id: z.string().uuid("Unknown problem."),
  version: z.coerce.number().int().min(1, "Unknown problem version."),
});

export type ProblemUpdateInput = z.infer<typeof problemUpdateSchema>;

export const prescriptionCreateSchema = z.object({
  patientId: z.string().uuid("Select a valid patient."),
  visitId: z.string().uuid().optional(),
  providerId: z.string().uuid("Select a valid provider."),
  status: z.enum(PRESCRIPTION_STATUS_VALUES).default("active"),
  validUntil: z.string().date().optional(),
  notes: optionalText(1000, "Use 1000 characters or fewer."),
});

export type PrescriptionCreateInput = z.infer<typeof prescriptionCreateSchema>;

export const prescriptionUpdateSchema = prescriptionCreateSchema.extend({
  id: z.string().uuid("Unknown prescription."),
  version: z.coerce.number().int().min(1, "Unknown prescription version."),
});

export type PrescriptionUpdateInput = z.infer<typeof prescriptionUpdateSchema>;

export const prescriptionItemCreateSchema = z.object({
  prescriptionId: z.string().uuid("Select a valid prescription."),
  medicationName: z.string().trim().min(1, "Enter a medication name.").max(200, "Use 200 characters or fewer."),
  dosage: z.string().trim().min(1, "Enter a dosage.").max(100, "Use 100 characters or fewer."),
  frequency: z.string().trim().min(1, "Enter a frequency.").max(100, "Use 100 characters or fewer."),
  duration: optionalText(100, "Use 100 characters or fewer."),
  quantity: optionalNumber(1, null, "Quantity must be at least 1", ""),
  refills: optionalNumber(0, null, "Refills must be at least 0", ""),
  instructions: optionalText(1000, "Use 1000 characters or fewer."),
});

export type PrescriptionItemCreateInput = z.infer<typeof prescriptionItemCreateSchema>;

export const prescriptionItemUpdateSchema = prescriptionItemCreateSchema.extend({
  id: z.string().uuid("Unknown prescription item."),
  version: z.coerce.number().int().min(1, "Unknown prescription item version."),
});

export type PrescriptionItemUpdateInput = z.infer<typeof prescriptionItemUpdateSchema>;

export const emrQuerySchema = z.object({
  q: z.string().trim().max(80, "Search with 80 characters or fewer.").optional().default(""),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

export type EmrQuery = z.infer<typeof emrQuerySchema>;
