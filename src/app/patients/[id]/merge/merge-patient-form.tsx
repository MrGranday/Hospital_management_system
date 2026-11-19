"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { mergePatientAction, type MergePatientState } from "../../actions";

export default function MergePatientForm({
  sourceId,
  sourceName,
  targetId,
  targetName,
}: {
  sourceId: string;
  sourceName: string;
  targetId: string;
  targetName: string;
}) {
  const [state, formAction, pending] = useActionState<MergePatientState, FormData>(
    mergePatientAction,
    undefined,
  );

  return (
    <form action={formAction} className="rounded-lg border border-border bg-card p-4" noValidate>
      <input type="hidden" name="sourceId" value={sourceId} />
      <input type="hidden" name="targetId" value={targetId} />
      <h2 className="text-sm font-semibold">Confirm merge</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{sourceName}</span> will be archived and
        linked to <span className="font-medium text-foreground">{targetName}</span>. Lists and
        future clinical records will resolve to the surviving patient.
      </p>
      <div className="mt-4 space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Textarea
          id="reason"
          name="reason"
          rows={2}
          required
          placeholder="Duplicate file created at reception; same national ID and phone."
        />
      </div>
      {state?.error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Merging..." : "Merge and archive duplicate"}
        </Button>
        <span className="text-xs text-muted-foreground">This cannot be undone from the app.</span>
      </div>
    </form>
  );
}
