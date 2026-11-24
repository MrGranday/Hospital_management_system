import { z } from "zod";

export const ModuleConfigSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(30)
    .regex(/^[a-z_][a-z0-9_]*$/, "Module key must be snake_case"),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  requires: z.array(z.string()).default([]),
  softRequires: z.array(z.string()).default([]),
  sort: z.number().int().min(0).default(0),
  isDeferred: z.boolean().default(false),
  nav: z
    .array(
      z.object({
        label: z.string().min(1).max(50),
        href: z.string().min(1).startsWith("/"),
        permission: z.string().min(1),
      })
    )
    .default([]),
  permissions: z
    .array(
      z.object({
        key: z.string().min(1).regex(/^[a-z_]+:[a-z_]+:[a-z_]+$/),
        label: z.string().min(1).max(100),
        clinicalAuthoring: z.boolean().optional().default(false),
        sodGroup: z.string().optional(),
      })
    )
    .default([]),
  dashboardWidgets: z
    .array(
      z.object({
        key: z.string().min(1),
        permission: z.string().min(1),
        component: z.string().min(1),
      })
    )
    .default([]),
});

export type ModuleConfig = z.infer<typeof ModuleConfigSchema>;
export type ModuleConfigInput = z.input<typeof ModuleConfigSchema>;
