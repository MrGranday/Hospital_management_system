"use client";

import { useActionState } from "react";
import Link from "next/link";

import { createItemBatchAction } from "@/features/pharmacy/actions";

export function BatchForm({
  items,
  initialItemId,
}: {
  items: Array<{ id: string; name: string; sku: string; unit: string }>;
  initialItemId?: string;
}) {
  const [state, formAction, pending] = useActionState(createItemBatchAction, undefined);

  return (
    <form action={formAction} className="rounded-lg border border-border bg-card p-6 space-y-4">
      {state?.error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div>
        <label htmlFor="itemId" className="block text-xs font-medium text-foreground">
          Select Item *
        </label>
        <select
          id="itemId"
          name="itemId"
          required
          defaultValue={initialItemId ?? ""}
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="" disabled>Choose an item...</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} ({i.sku})
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="batchNo" className="block text-xs font-medium text-foreground">
            Batch / Lot Number *
          </label>
          <input
            id="batchNo"
            name="batchNo"
            type="text"
            required
            placeholder="e.g. B2026-09"
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="expiryDate" className="block text-xs font-medium text-foreground">
            Expiry Date *
          </label>
          <input
            id="expiryDate"
            name="expiryDate"
            type="date"
            required
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="costPriceMinor" className="block text-xs font-medium text-foreground">
            Cost Price (cents) *
          </label>
          <input
            id="costPriceMinor"
            name="costPriceMinor"
            type="number"
            min={0}
            required
            placeholder="e.g. 500"
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="salePriceMinor" className="block text-xs font-medium text-foreground">
            Sale Price (cents) *
          </label>
          <input
            id="salePriceMinor"
            name="salePriceMinor"
            type="number"
            min={0}
            required
            placeholder="e.g. 750"
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="currency" className="block text-xs font-medium text-foreground">
            Currency
          </label>
          <input
            id="currency"
            name="currency"
            type="text"
            maxLength={3}
            defaultValue="AFN"
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Link
          href="/inventory/batches"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save batch"}
        </button>
      </div>
    </form>
  );
}
