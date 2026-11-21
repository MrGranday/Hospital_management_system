"use client";

import { useActionState, useState } from "react";
import {
  createDiagnosisAction,
  createAllergyAction,
  createProblemAction,
  createPrescriptionAction,
} from "@/features/emr/actions";

export function AddDiagnosisForm({
  patientId,
  currentUserId,
}: {
  patientId: string;
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createDiagnosisAction, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-7 items-center justify-center rounded border border-input bg-background px-2.5 text-xs font-medium hover:bg-accent"
      >
        + Add diagnosis
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-3 rounded-md border border-border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">Record Diagnosis (ICD)</h3>
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

      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="providerId" value={currentUserId} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-[11px] font-medium text-foreground">ICD Code *</label>
          <input
            name="icdCode"
            type="text"
            required
            placeholder="e.g. J06.9, E11.9"
            className="mt-1 block w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-mono uppercase focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-medium text-foreground">Description *</label>
          <input
            name="description"
            type="text"
            required
            placeholder="e.g. Acute upper respiratory infection, Type 2 diabetes"
            className="mt-1 block w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs pt-1">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="isPrimary" className="h-3.5 w-3.5 rounded border-input text-primary" />
          Primary diagnosis
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="isChronic" className="h-3.5 w-3.5 rounded border-input text-primary" />
          Chronic condition
        </label>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save diagnosis"}
        </button>
      </div>
    </form>
  );
}

export function AddAllergyForm({
  patientId,
}: {
  patientId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createAllergyAction, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-7 items-center justify-center rounded border border-input bg-background px-2.5 text-xs font-medium hover:bg-accent"
      >
        + Add allergy
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-3 rounded-md border border-border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">Record Patient Allergy</h3>
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

      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="isActive" value="on" />

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-[11px] font-medium text-foreground">Allergen *</label>
          <input
            name="allergen"
            type="text"
            required
            placeholder="e.g. Penicillin, Peanuts, Latex"
            className="mt-1 block w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-foreground">Reaction</label>
          <input
            name="reaction"
            type="text"
            placeholder="e.g. Rash, Anaphylaxis, Wheezing"
            className="mt-1 block w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-foreground">Severity</label>
          <select
            name="severity"
            defaultValue="moderate"
            className="mt-1 block w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-8 items-center justify-center rounded-md bg-rose-600 px-3 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Record allergy"}
        </button>
      </div>
    </form>
  );
}

export function AddProblemForm({
  patientId,
}: {
  patientId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createProblemAction, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-7 items-center justify-center rounded border border-input bg-background px-2.5 text-xs font-medium hover:bg-accent"
      >
        + Add problem
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-3 rounded-md border border-border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">Add to Chronic Problem List</h3>
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

      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="isActive" value="on" />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-medium text-foreground">Condition *</label>
          <input
            name="condition"
            type="text"
            required
            placeholder="e.g. Essential Hypertension, Bronchial Asthma"
            className="mt-1 block w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-foreground">Onset Date</label>
          <input
            name="onsetDate"
            type="date"
            className="mt-1 block w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Add to list"}
        </button>
      </div>
    </form>
  );
}

export function CreatePrescriptionModal({
  patientId,
  currentUserId,
}: {
  patientId: string;
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createPrescriptionAction, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-7 items-center justify-center rounded border border-input bg-background px-2.5 text-xs font-medium hover:bg-accent"
      >
        + New prescription
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-3 rounded-md border border-border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">Prescribe Medication</h3>
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

      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="providerId" value={currentUserId} />
      <input type="hidden" name="status" value="active" />

      <div>
        <label className="block text-[11px] font-medium text-foreground">Valid Until</label>
        <input
          name="validUntil"
          type="date"
          className="mt-1 block w-full max-w-xs rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-foreground">Prescription Notes / Directives</label>
        <textarea
          name="notes"
          rows={2}
          placeholder="e.g. Take with food. Discontinue if rash develops."
          className="mt-1 block w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create prescription draft"}
        </button>
      </div>
    </form>
  );
}
