"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { StaffRoleOption } from "@/lib/staff/schema";
import type { StaffMember } from "@/server/admin/staff";

import {
  resetStaffPasswordAction,
  updateStaffRoleAction,
  updateStaffStatusAction,
} from "./actions";

const selectClassName =
  "flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function StaffRowActions({
  member,
  roles,
  isSelf,
}: {
  member: StaffMember;
  roles: StaffRoleOption[];
  isSelf: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState(updateStaffRoleAction, undefined);
  const [statusState, statusAction, statusPending] = useActionState(
    updateStaffStatusAction,
    undefined,
  );
  const [resetState, resetAction, resetPending] = useActionState(
    resetStaffPasswordAction,
    undefined,
  );

  if (isSelf) {
    return <p className="text-xs text-muted-foreground">This is your account.</p>;
  }

  return (
    <div className="space-y-2">
      <form action={roleAction} className="flex items-center gap-2">
        <input type="hidden" name="userId" value={member.userId} />
        <label htmlFor={`role-${member.userId}`} className="sr-only">
          Role for {member.fullName}
        </label>
        <select
          id={`role-${member.userId}`}
          name="role"
          defaultValue={member.roleKey ?? ""}
          required
          className={selectClassName}
        >
          <option value="" disabled>
            No role
          </option>
          {roles.map((role) => (
            <option key={role.key} value={role.key}>
              {role.name}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="outline" disabled={rolePending}>
          {rolePending ? "Saving..." : "Save role"}
        </Button>
      </form>
      {roleState && "error" in roleState ? (
        <p role="alert" className="text-xs text-destructive">
          {roleState.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <form action={statusAction}>
          <input type="hidden" name="userId" value={member.userId} />
          <input type="hidden" name="isActive" value={String(!member.isActive)} />
          <Button type="submit" size="sm" variant="ghost" disabled={statusPending}>
            {member.isActive ? "Deactivate" : "Reactivate"}
          </Button>
        </form>

        <form action={resetAction}>
          <input type="hidden" name="userId" value={member.userId} />
          <Button type="submit" size="sm" variant="ghost" disabled={resetPending}>
            {resetPending ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      </div>
      {statusState && "error" in statusState ? (
        <p role="alert" className="text-xs text-destructive">
          {statusState.error}
        </p>
      ) : null}
      {resetState && "error" in resetState ? (
        <p role="alert" className="text-xs text-destructive">
          {resetState.error}
        </p>
      ) : null}
      {resetState && "reset" in resetState ? (
        <p className="rounded-md border border-border bg-muted p-2 text-xs">
          New password for <span className="font-mono">{resetState.reset.username}</span>:{" "}
          <span className="break-all font-mono">{resetState.reset.tempPassword}</span> (shown once)
        </p>
      ) : null}
    </div>
  );
}
