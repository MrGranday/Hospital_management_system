import { z } from "zod";

export const AUDIT_TABLES = [
  "public.hospitals",
  "public.profiles",
  "public.hospital_settings",
  "public.user_roles",
  "public.patients",
  "public.patient_merges",
] as const;

export const AUDIT_ACTIONS = ["INSERT", "UPDATE", "DELETE"] as const;

export const AUDIT_PAGE_SIZE = 25;

export const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).catch(1),
  table: z.enum(AUDIT_TABLES).optional().catch(undefined),
  action: z.enum(AUDIT_ACTIONS).optional().catch(undefined),
});

export type AuditQuery = z.infer<typeof auditQuerySchema>;

export function auditPageHref(query: AuditQuery, page: number): string {
  const params = new URLSearchParams();
  if (query.table) params.set("table", query.table);
  if (query.action) params.set("action", query.action);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/audit?${search}` : "/audit";
}
