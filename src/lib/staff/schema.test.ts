import { describe, expect, it } from "vitest";

import {
  ASSIGNABLE_STAFF_ROLES,
  staffCreateSchema,
  staffRoleSchema,
  staffStatusUpdateSchema,
} from "./schema";

describe("staff schema", () => {
  it("never allows assigning super_admin", () => {
    expect(ASSIGNABLE_STAFF_ROLES.includes("super_admin" as never)).toBe(false);
    expect(staffRoleSchema.safeParse("super_admin").success).toBe(false);
  });

  it("normalises names and usernames", () => {
    const parsed = staffCreateSchema.parse({
      fullName: "  Dr. Mona Hassan ",
      username: " Mona.Hassan ",
      role: "doctor",
    });

    expect(parsed.fullName).toBe("Dr. Mona Hassan");
    expect(parsed.username).toBe("mona.hassan");
  });

  it("rejects short names and malformed usernames", () => {
    expect(
      staffCreateSchema.safeParse({ fullName: "M", username: "mona", role: "nurse" }).success,
    ).toBe(false);
    expect(
      staffCreateSchema.safeParse({ fullName: "Mona", username: "not valid", role: "nurse" })
        .success,
    ).toBe(false);
  });

  it("parses the active flag from form values", () => {
    expect(
      staffStatusUpdateSchema.parse({
        userId: "3b3a1c1e-5a6f-4c1d-8e2f-7a8b9c0d1e2f",
        isActive: "false",
      }).isActive,
    ).toBe(false);
  });
});
