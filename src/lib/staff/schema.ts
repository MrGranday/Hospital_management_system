import { z } from "zod";

import { usernameSchema } from "@/lib/auth/identifier";

// Roles a hospital administrator may assign. `super_admin` is platform-only.
export const ASSIGNABLE_STAFF_ROLES = [
  "hospital_admin",
  "doctor",
  "nurse",
  "receptionist",
  "cashier",
  "pharmacist",
  "lab_technician",
  "radiology_technician",
  "inventory_manager",
  "accountant",
  "hr_manager",
  "auditor",
] as const;

export const staffRoleSchema = z.enum(ASSIGNABLE_STAFF_ROLES);

export type StaffRoleKey = z.infer<typeof staffRoleSchema>;

export type StaffRoleOption = {
  key: StaffRoleKey;
  name: string;
};

export const staffCreateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter the staff member's full name.")
    .max(120, "Use 120 characters or fewer."),
  username: usernameSchema,
  role: staffRoleSchema,
});

export type StaffCreateInput = z.infer<typeof staffCreateSchema>;

export const staffUserIdSchema = z.string().uuid("Unknown staff member.");

export const staffRoleUpdateSchema = z.object({
  userId: staffUserIdSchema,
  role: staffRoleSchema,
});

export const staffStatusUpdateSchema = z.object({
  userId: staffUserIdSchema,
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});
