import { z } from "zod";

import {
  RESERVED_HOSPITAL_CODES,
  hospitalCodeSchema,
  usernameSchema,
} from "@/lib/auth/identifier";

const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Enter a valid IANA timezone, for example Africa/Cairo.");

export const hospitalCreateSchema = z
  .object({
    code: hospitalCodeSchema,
    name: z.string().trim().min(2, "Enter the hospital name.").max(120),
    country: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "Use a two-letter country code, for example EG."),
    timezone: timezoneSchema,
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Use a three-letter currency code, for example EGP."),
    adminUsername: usernameSchema,
    adminFullName: z.string().trim().min(2, "Enter the administrator's name.").max(120),
  })
  .refine((value) => !RESERVED_HOSPITAL_CODES.has(value.code), {
    message: "That hospital code is reserved.",
    path: ["code"],
  });

export type HospitalCreateInput = z.infer<typeof hospitalCreateSchema>;

export const hospitalStatusSchema = z.enum(["active", "suspended"]);
