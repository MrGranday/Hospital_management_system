"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StaffRoleOption } from "@/lib/staff/schema";

import { createStaffAction } from "./actions";

export default function CreateStaffForm({ roles }: { roles: StaffRoleOption[] }) {
  const [state, formAction, pending] = useActionState(createStaffAction, undefined);

  if (state && "created" in state) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Staff account created</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Give these credentials to the staff member. The password is shown once and must be
          changed at first sign-in.
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Username</dt>
            <dd className="font-mono">{state.created.username}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Temporary password</dt>
            <dd className="break-all font-mono">{state.created.tempPassword}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-lg border border-border bg-card p-4" noValidate>
      <h2 className="text-sm font-semibold">Add a staff account</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" autoComplete="off" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" autoComplete="off" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="staffRole">Role</Label>
          <select
            id="staffRole"
            name="role"
            required
            defaultValue=""
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="" disabled>
              Choose a role
            </option>
            {roles.map((role) => (
              <option key={role.key} value={role.key}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state?.error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="mt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create account"}
        </Button>
      </div>
    </form>
  );
}
