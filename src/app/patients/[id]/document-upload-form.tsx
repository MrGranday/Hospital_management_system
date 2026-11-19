"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DOCUMENT_MIME_TYPES } from "@/lib/patients/schema";

import { uploadPatientDocumentAction, type DocumentState } from "../actions";

export default function DocumentUploadForm({ patientId }: { patientId: string }) {
  const [state, formAction, pending] = useActionState<DocumentState, FormData>(
    uploadPatientDocumentAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="patientId" value={patientId} />
      <div className="space-y-2">
        <Label htmlFor="document-file">Add a document</Label>
        <Input
          id="document-file"
          name="file"
          type="file"
          accept={DOCUMENT_MIME_TYPES.join(",")}
          required
          className="h-auto py-2"
        />
        <p className="text-xs text-muted-foreground">
          PDF, JPEG, PNG or WebP; up to 10 MB. Stored privately; downloads are logged.
        </p>
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Uploading..." : "Upload document"}
      </Button>
    </form>
  );
}
