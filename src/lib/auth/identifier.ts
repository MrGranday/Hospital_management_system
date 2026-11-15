import { z } from "zod";

// Supabase Auth requires an email-shaped identifier. Users only ever enter a
// hospital code and username, so the server derives the internal address.
// The `.invalid` TLD can never receive mail (RFC 2606).
export const LOGIN_IDENTIFIER_DOMAIN = "medicore.invalid";

export const hospitalCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/,
    "Hospital code may only contain lowercase letters, digits and dashes.",
  );

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])?$/,
    "Username may only contain letters, digits, dots, dashes and underscores.",
  );

export const loginInputSchema = z.object({
  hospitalCode: hospitalCodeSchema,
  username: usernameSchema,
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const passwordChangeSchema = z
  .object({
    password: z.string().min(12, "Use at least 12 characters."),
    confirmPassword: z.string().min(12, "Use at least 12 characters."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

export function toLoginIdentifier(hospitalCode: string, username: string): string {
  return `${username}@${hospitalCode}.${LOGIN_IDENTIFIER_DOMAIN}`;
}
