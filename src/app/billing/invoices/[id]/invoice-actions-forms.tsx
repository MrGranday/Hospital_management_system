"use client";

import { useActionState, useState } from "react";
import {
  createInvoiceLineAction,
  createPaymentAction,
  createCreditNoteAction,
  voidInvoiceAction,
} from "@/features/billing/actions";

export function AddInvoiceLineForm({ invoiceId }: { invoiceId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createInvoiceLineAction, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
      >
        + Add line item
      </button>
    );
  }

  return (
    <form action={formAction} className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">Add line item</h3>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      <input type="hidden" name="invoiceId" value={invoiceId} />

      <div>
        <label htmlFor="description" className="block text-xs font-medium">Description</label>
        <input
          id="description"
          name="description"
          required
          placeholder="e.g. Consultation fee, Blood test"
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="quantity" className="block text-xs font-medium">Quantity</label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            defaultValue="1"
            required
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="unitPriceMinor" className="block text-xs font-medium">Unit price (Minor units)</label>
          <input
            id="unitPriceMinor"
            name="unitPriceMinor"
            type="number"
            min="0"
            defaultValue="0"
            required
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-8 px-3 rounded-md border border-input text-xs font-medium hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="h-8 px-3 rounded-md bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add line"}
        </button>
      </div>
    </form>
  );
}

export function RecordPaymentModal({
  invoiceId,
  currency,
  maxAmountMinor,
}: {
  invoiceId: string;
  currency: string;
  maxAmountMinor: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createPaymentAction, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Record payment
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl space-y-4">
        <h3 className="text-base font-semibold">Record Payment</h3>
        {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="invoiceId" value={invoiceId} />
          <input type="hidden" name="currency" value={currency} />

          <div>
            <label htmlFor="amountMinor" className="block text-xs font-medium">
              Amount (in minor units / cents)
            </label>
            <input
              id="amountMinor"
              name="amountMinor"
              type="number"
              min="1"
              max={maxAmountMinor > 0 ? maxAmountMinor : undefined}
              defaultValue={maxAmountMinor > 0 ? maxAmountMinor : 0}
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="paymentMethod" className="block text-xs font-medium">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              required
              defaultValue="cash"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="insurance">Insurance</option>
              <option value="transfer">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label htmlFor="reference" className="block text-xs font-medium">
              Reference / Receipt Note (Optional)
            </label>
            <input
              id="reference"
              name="reference"
              type="text"
              placeholder="e.g. Transaction ID, receipt #"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            />
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
              {isPending ? "Recording..." : "Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function VoidOrCreditInvoiceForm({
  invoiceId,
  version,
  currency,
  totalMinor,
}: {
  invoiceId: string;
  version: number;
  currency: string;
  totalMinor: number;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"void" | "credit">("void");
  const [voidState, voidAction, isVoidPending] = useActionState(voidInvoiceAction, undefined);
  const [creditState, creditAction, isCreditPending] = useActionState(createCreditNoteAction, undefined);

  if (!open) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => { setMode("void"); setOpen(true); }}
          className="inline-flex h-9 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 px-3 text-xs font-medium text-destructive hover:bg-destructive/20"
        >
          Void invoice
        </button>
        <button
          onClick={() => { setMode("credit"); setOpen(true); }}
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
        >
          Issue credit note
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl space-y-4">
        <h3 className="text-base font-semibold">
          {mode === "void" ? "Void Invoice" : "Issue Credit Note"}
        </h3>
        {mode === "void" ? (
          <form action={voidAction} className="space-y-4">
            {voidState?.error && <p className="text-xs text-destructive">{voidState.error}</p>}
            <input type="hidden" name="id" value={invoiceId} />
            <input type="hidden" name="version" value={version} />

            <div>
              <label htmlFor="voidReason" className="block text-xs font-medium">
                Reason for voiding
              </label>
              <textarea
                id="voidReason"
                name="voidReason"
                required
                rows={3}
                placeholder="Why is this invoice being voided?"
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              />
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
                disabled={isVoidPending}
                className="h-9 px-4 rounded-md bg-destructive text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {isVoidPending ? "Voiding..." : "Confirm Void"}
              </button>
            </div>
          </form>
        ) : (
          <form action={creditAction} className="space-y-4">
            {creditState?.error && <p className="text-xs text-destructive">{creditState.error}</p>}
            <input type="hidden" name="invoiceId" value={invoiceId} />
            <input type="hidden" name="currency" value={currency} />

            <div>
              <label htmlFor="amountMinor" className="block text-xs font-medium">
                Credit Amount (minor units / cents)
              </label>
              <input
                id="amountMinor"
                name="amountMinor"
                type="number"
                min="1"
                defaultValue={totalMinor}
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              />
            </div>

            <div>
              <label htmlFor="reason" className="block text-xs font-medium">
                Reason
              </label>
              <textarea
                id="reason"
                name="reason"
                required
                rows={3}
                placeholder="Reason for credit note"
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              />
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
                disabled={isCreditPending}
                className="h-9 px-4 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isCreditPending ? "Issuing..." : "Issue Credit Note"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
