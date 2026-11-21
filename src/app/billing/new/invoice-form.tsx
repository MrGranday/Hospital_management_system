"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createInvoiceAction } from "@/features/billing/actions";

interface PatientOption {
  id: string;
  full_name: string;
  mrn: string;
}

export function InvoiceForm({
  patients,
  defaultCurrency = "AFN",
}: {
  patients: PatientOption[];
  defaultCurrency?: string;
}) {
  const [state, formAction, isPending] = useActionState(createInvoiceAction, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <label htmlFor="patientId" className="block text-sm font-medium">
            Patient <span className="text-destructive">*</span>
          </label>
          <select
            id="patientId"
            name="patientId"
            required
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select a patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} (MRN: {p.mrn})
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="status" className="block text-sm font-medium">
              Initial Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue="draft"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
            </select>
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium">
              Currency
            </label>
            <input
              id="currency"
              name="currency"
              type="text"
              maxLength={3}
              defaultValue={defaultCurrency}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm font-mono uppercase"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="subtotalMinor" className="block text-sm font-medium">
              Subtotal (Minor units / Cents) <span className="text-destructive">*</span>
            </label>
            <input
              id="subtotalMinor"
              name="subtotalMinor"
              type="number"
              min="0"
              defaultValue="0"
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">e.g. 5000 = 50.00 AFN</p>
          </div>

          <div>
            <label htmlFor="taxMinor" className="block text-sm font-medium">
              Tax (Minor units / Cents)
            </label>
            <input
              id="taxMinor"
              name="taxMinor"
              type="number"
              min="0"
              defaultValue="0"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">e.g. 500 = 5.00 AFN</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/billing"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create invoice"}
        </button>
      </div>
    </form>
  );
}
