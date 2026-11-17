import { describe, expect, it } from "vitest";

import { auditPageHref, auditQuerySchema } from "./query";

describe("audit query", () => {
  it("coerces the page number and keeps valid filters", () => {
    expect(
      auditQuerySchema.parse({ page: "3", table: "public.profiles", action: "UPDATE" }),
    ).toEqual({ page: 3, table: "public.profiles", action: "UPDATE" });
  });

  it("falls back safely on bad input", () => {
    expect(auditQuerySchema.parse({ page: "-2", table: "patients", action: "DROP" })).toEqual({
      page: 1,
      table: undefined,
      action: undefined,
    });
  });

  it("builds filter-preserving page links", () => {
    expect(auditPageHref({ page: 1, table: "public.profiles", action: "INSERT" }, 2)).toBe(
      "/audit?table=public.profiles&action=INSERT&page=2",
    );
    expect(auditPageHref({ page: 1, table: undefined, action: undefined }, 1)).toBe("/audit");
  });
});
