"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { deletePatientDocumentAction, type DocumentState } from "../actions";

export default function DeleteDocumentButton({
  patientId,
  documentId,
}: {
  patientId: string;
  documentId: string;
}) {
  const [state, formAction, pending] = useActionState<DocumentState, FormData>(
    deletePatientDocumentAction,
    undefined,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="documentId" value={documentId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Deleting..." : "Delete"}
      </Button>
      {state?.error ? (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
