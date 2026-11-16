"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { resetAdminPasswordAction } from "../actions";

export default function ResetAdminPasswordForm({ hospitalId }: { hospitalId: string }) {
  const [state, formAction, pending] = useActionState(resetAdminPasswordAction, undefined);

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="hospitalId" value={hospitalId} />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Resetting..." : "Reset administrator password"}
        </Button>
      </form>

      {state && "error" in state ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {state && "reset" in state ? (
        <div className="mt-3 rounded-lg border border-border bg-card p-4 text-sm">
          <p className="text-xs text-muted-foreground">
            New temporary password for <span className="font-mono">{state.reset.username}</span>{" "}
            (shown once, must be changed at next sign-in):
          </p>
          <p className="mt-1 font-mono">{state.reset.tempPassword}</p>
        </div>
      ) : null}
    </div>
  );
}
