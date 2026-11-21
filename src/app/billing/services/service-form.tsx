"use client";

import { useActionState, useState } from "react";
import { createServiceAction } from "@/features/billing/actions";

export function AddServiceModal({ defaultCurrency = "AFN" }: { defaultCurrency?: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createServiceAction, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        + Add service
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl space-y-4">
        <h3 className="text-base font-semibold">Add New Service</h3>
        {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="code" className="block text-xs font-medium">Service Code</label>
              <input
                id="code"
                name="code"
                required
                placeholder="e.g. CNS-001, LAB-CBC"
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm font-mono"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-xs font-medium">Department</label>
              <input
                id="department"
                name="department"
                placeholder="e.g. OPD, Laboratory"
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-xs font-medium">Service Name</label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g. General Consultation"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-medium">Description</label>
            <textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Detailed explanation of what this service covers"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="unitPriceMinor" className="block text-xs font-medium">Price (Minor Units)</label>
              <input
                id="unitPriceMinor"
                name="unitPriceMinor"
                type="number"
                min="0"
                defaultValue="5000"
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">5000 = 50.00</p>
            </div>
            <div>
              <label htmlFor="currency" className="block text-xs font-medium">Currency</label>
              <input
                id="currency"
                name="currency"
                type="text"
                defaultValue={defaultCurrency}
                maxLength={3}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm font-mono uppercase"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="isActive" className="text-xs font-medium">Active service available for billing</label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 px-4 rounded-md border border-input text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-9 px-4 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
