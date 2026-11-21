"use client";

import { useActionState, useState } from "react";
import { createClinicalNoteAction } from "@/features/emr/actions";

export function AddClinicalNoteForm({
  visitId,
  currentUserId,
}: {
  visitId: string;
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createClinicalNoteAction, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
      >
        + Add clinical note
      </button>
    );
  }

  return (
    <form action={formAction} className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Record Consultation / Clinical Note</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>

      {state?.error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
          {state.error}
        </div>
      ) : null}

      <input type="hidden" name="visitId" value={visitId} />
      <input type="hidden" name="providerId" value={currentUserId} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-foreground">Note Type *</label>
          <select
            name="noteType"
            defaultValue="consultation"
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-xs capitalize focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="consultation">Consultation</option>
            <option value="progress">Progress Note</option>
            <option value="procedure">Procedure Note</option>
            <option value="discharge">Discharge Summary</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-foreground">Title *</label>
          <input
            name="title"
            type="text"
            required
            placeholder="e.g. Initial OPD Evaluation, Post-op Review"
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-foreground">Clinical Narrative / SOAP Content *</label>
        <textarea
          name="content"
          required
          rows={4}
          placeholder="Subjective history, Objective exam findings, Assessment, and Plan (SOAP)..."
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <label className="flex items-center gap-2 text-xs font-medium">
          <input type="checkbox" name="isConfidential" className="h-3.5 w-3.5 rounded border-input text-primary" />
          Mark as confidential (restricted clinical access)
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save note"}
        </button>
      </div>
    </form>
  );
}
