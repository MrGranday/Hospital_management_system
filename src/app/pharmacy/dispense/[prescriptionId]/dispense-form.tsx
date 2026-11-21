"use client";

import { useActionState, useState } from "react";
import { fulfillPrescriptionItemAction } from "@/features/pharmacy/actions";

export function DispenseItemForm({
  prescriptionId,
  prescriptionItemId,
  medicationName,
  prescribedQuantity,
  catalogItems,
  batches,
  locations,
}: {
  prescriptionId: string;
  prescriptionItemId: string;
  medicationName: string;
  prescribedQuantity: number;
  catalogItems: Array<{ id: string; name: string; sku: string; unit: string }>;
  batches: Array<{ id: string; item_id: string; batch_no: string; expiry_date: string }>;
  locations: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(fulfillPrescriptionItemAction, undefined);

  // Auto-match catalog item by medication name
  const matchedItem = catalogItems.find(
    (c) => c.name.toLowerCase().includes(medicationName.toLowerCase()) ||
           medicationName.toLowerCase().includes(c.name.toLowerCase())
  );

  const [selectedItemId, setSelectedItemId] = useState(matchedItem?.id ?? catalogItems[0]?.id ?? "");

  const availableBatches = batches.filter((b) => b.item_id === selectedItemId);

  return (
    <form action={formAction} className="space-y-3 bg-muted/30 p-4 rounded-md">
      {state?.error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
          {state.error}
        </div>
      ) : null}

      <input type="hidden" name="prescriptionId" value={prescriptionId} />
      <input type="hidden" name="prescriptionItemId" value={prescriptionItemId} />

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="block text-[11px] font-medium text-foreground">
            Stock Catalog Item *
          </label>
          <select
            name="itemId"
            required
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {catalogItems.map((ci) => (
              <option key={ci.id} value={ci.id}>
                {ci.name} ({ci.sku})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-foreground">
            Batch (FEFO) *
          </label>
          <select
            name="batchId"
            required
            className="mt-1 block w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {availableBatches.length === 0 ? (
              <option value="">No batches in stock</option>
            ) : (
              availableBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_no} (Exp: {b.expiry_date})
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-foreground">
            Location *
          </label>
          <select
            name="locationId"
            required
            className="mt-1 block w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-foreground">
            Dispense Qty *
          </label>
          <input
            type="number"
            name="quantity"
            required
            min={1}
            defaultValue={prescribedQuantity}
            className="mt-1 block w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <input
          type="text"
          name="notes"
          placeholder="Pharmacist instructions or counselling notes (optional)..."
          className="flex-1 max-w-md rounded-md border border-input bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={pending || availableBatches.length === 0}
          className="inline-flex h-8 items-center justify-center rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Fulfilling..." : "Confirm Dispensation"}
        </button>
      </div>
    </form>
  );
}
