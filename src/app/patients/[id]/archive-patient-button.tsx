"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { archivePatientAction, type ArchivePatientState } from "../actions";

export default function ArchivePatientButton({ patientId }: { patientId: string }) {
  const [state, formAction, pending] = useActionState<ArchivePatientState, FormData>(
    archivePatientAction,
    undefined,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={patientId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Archiving..." : "Archive patient"}
      </Button>
      {state?.error ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
