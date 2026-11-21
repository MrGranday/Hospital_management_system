import { z } from "zod";

export const EMPLOYMENT_TYPE_VALUES = [
  "full-time",
  "part-time",
  "contract",
  "temporary",
] as const;

export const SHIFT_STATUS_VALUES = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
] as const;

export const ATTENDANCE_STATUS_VALUES = [
  "present",
  "absent",
  "late",
  "leave",
  "holiday",
] as const;

export const LEAVE_TYPE_VALUES = [
  "sick",
  "vacation",
  "personal",
  "emergency",
  "other",
] as const;

export const LEAVE_STATUS_VALUES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
] as const;

export const HR_PAGE_SIZE = 25;

export const shiftStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    scheduled: "Scheduled",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
};

export const attendanceStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    present: "Present",
    absent: "Absent",
    late: "Late",
    leave: "On Leave",
    holiday: "Holiday",
  };
  return labels[status] ?? status;
};

export const leaveStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
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

export const departmentCreateSchema = z.object({
  name: z.string().trim().min(1, "Enter a department name.").max(200, "Use 200 characters or fewer."),
  description: optionalText(1000, "Use 1000 characters or fewer."),
  isActive: z.boolean().default(true),
});

export type DepartmentCreateInput = z.infer<typeof departmentCreateSchema>;

export const departmentUpdateSchema = departmentCreateSchema.extend({
  id: z.string().uuid("Unknown department."),
  version: z.coerce.number().int().min(1, "Unknown department version."),
});

export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;

export const staffCreateSchema = z.object({
  userId: z.string().uuid("Select a valid user."),
  employeeId: z
    .string()
    .trim()
    .min(1, "Enter an employee ID.")
    .max(50, "Use 50 characters or fewer."),
  jobTitle: z.string().trim().min(1, "Enter a job title.").max(200, "Use 200 characters or fewer."),
  departmentId: z.string().uuid().optional(),
  employmentType: z.enum(EMPLOYMENT_TYPE_VALUES),
  hireDate: z.string().date(),
  terminationDate: z.string().date().optional(),
  salaryAnnualMinor: z.coerce.number().int().min(0, "Salary must be zero or greater.").optional(),
  currency: z.string().length(3, "Use a 3-letter currency code.").default("AFN"),
  isActive: z.boolean().default(true),
});

export type StaffCreateInput = z.infer<typeof staffCreateSchema>;

export const staffUpdateSchema = staffCreateSchema.extend({
  id: z.string().uuid("Unknown staff member."),
  version: z.coerce.number().int().min(1, "Unknown staff version."),
});

export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;

export const shiftCreateSchema = z.object({
  staffId: z.string().uuid("Select a valid staff member."),
  shiftDate: z.string().date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format."),
  breakMinutes: z.coerce.number().int().min(0, "Break minutes must be zero or greater.").default(0),
  status: z.enum(SHIFT_STATUS_VALUES).default("scheduled"),
  notes: optionalText(1000, "Use 1000 characters or fewer."),
});

export type ShiftCreateInput = z.infer<typeof shiftCreateSchema>;

export const shiftUpdateSchema = shiftCreateSchema.extend({
  id: z.string().uuid("Unknown shift."),
  version: z.coerce.number().int().min(1, "Unknown shift version."),
});

export type ShiftUpdateInput = z.infer<typeof shiftUpdateSchema>;

export const attendanceCreateSchema = z.object({
  staffId: z.string().uuid("Select a valid staff member."),
  shiftId: z.string().uuid().optional(),
  attendanceDate: z.string().date(),
  clockIn: z.string().datetime().optional(),
  clockOut: z.string().datetime().optional(),
  status: z.enum(ATTENDANCE_STATUS_VALUES),
  notes: optionalText(1000, "Use 1000 characters or fewer."),
});

export type AttendanceCreateInput = z.infer<typeof attendanceCreateSchema>;

export const attendanceUpdateSchema = attendanceCreateSchema.extend({
  id: z.string().uuid("Unknown attendance record."),
  version: z.coerce.number().int().min(1, "Unknown attendance version."),
});

export type AttendanceUpdateInput = z.infer<typeof attendanceUpdateSchema>;

export const leaveRequestCreateSchema = z.object({
  staffId: z.string().uuid("Select a valid staff member."),
  leaveType: z.enum(LEAVE_TYPE_VALUES),
  startDate: z.string().date(),
  endDate: z.string().date(),
  days: z.coerce.number().min(0.5, "Days must be at least 0.5."),
  reason: z.string().trim().min(1, "Enter a reason.").max(500, "Use 500 characters or fewer."),
});

export type LeaveRequestCreateInput = z.infer<typeof leaveRequestCreateSchema>;

export const leaveRequestUpdateSchema = leaveRequestCreateSchema.extend({
  id: z.string().uuid("Unknown leave request."),
  version: z.coerce.number().int().min(1, "Unknown leave request version."),
  status: z.enum(LEAVE_STATUS_VALUES),
});

export type LeaveRequestUpdateInput = z.infer<typeof leaveRequestUpdateSchema>;

export const hrQuerySchema = z.object({
  q: z.string().trim().max(80, "Search with 80 characters or fewer.").optional().default(""),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

export type HrQuery = z.infer<typeof hrQuerySchema>;
