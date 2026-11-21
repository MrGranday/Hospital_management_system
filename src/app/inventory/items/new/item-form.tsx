"use client";

import { useActionState } from "react";
import Link from "next/link";

import { createItemAction } from "@/features/pharmacy/actions";

export function ItemForm() {
  const [state, formAction, pending] = useActionState(createItemAction, undefined);

  return (
    <form action={formAction} className="rounded-lg border border-border bg-card p-6 space-y-4">
      {state?.error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sku" className="block text-xs font-medium text-foreground">
            SKU / Item Code *
          </label>
          <input
            id="sku"
            name="sku"
            type="text"
            required
            placeholder="e.g. MED-PARA-500"
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="unit" className="block text-xs font-medium text-foreground">
            Dispensing Unit *
          </label>
          <input
            id="unit"
            name="unit"
            type="text"
            required
            defaultValue="tablet"
            placeholder="e.g. tablet, vial, bottle, box"
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div>
        <label htmlFor="name" className="block text-xs font-medium text-foreground">
          Item Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Paracetamol 500mg"
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-xs font-medium text-foreground">
          Category
        </label>
        <input
          id="category"
          name="category"
          type="text"
          placeholder="e.g. Analgesics, Antibiotics, Surgical Supplies"
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-xs font-medium text-foreground">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Clinical indications, storage requirements, dosage notes..."
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-2 pt-2 border-t border-border">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked
            className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
          />
          Active in inventory catalog
        </label>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="requiresPrescription"
            className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
          />
          Requires prescription (Rx)
        </label>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="isControlled"
            className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
          />
          Controlled substance (requires dual sign-off)
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Link
          href="/inventory"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save item"}
        </button>
      </div>
    </form>
  );
}
