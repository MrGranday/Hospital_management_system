"use client";

import { useActionState } from "react";
import Link from "next/link";

import { createStockLocationAction } from "@/features/pharmacy/actions";
import { STOCK_LOCATION_TYPE_VALUES } from "@/lib/pharmacy/schema";

export function LocationForm() {
  const [state, formAction, pending] = useActionState(createStockLocationAction, undefined);

  return (
    <form action={formAction} className="rounded-lg border border-border bg-card p-6 space-y-4">
      {state?.error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div>
        <label htmlFor="name" className="block text-xs font-medium text-foreground">
          Location Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Main Hospital Pharmacy, Ward 3 Dispensary"
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-xs font-medium text-foreground">
          Location Type *
        </label>
        <select
          id="type"
          name="type"
          required
          defaultValue="warehouse"
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {STOCK_LOCATION_TYPE_VALUES.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked
            className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
          />
          Active location
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Link
          href="/inventory/locations"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save location"}
        </button>
      </div>
    </form>
  );
}
