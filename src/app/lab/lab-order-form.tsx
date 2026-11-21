"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LAB_PRIORITY_VALUES,
  labPriorityLabel,
} from "@/lib/lab/schema";

import {
  createLabOrderAction,
  updateLabOrderAction,
} from "@/features/lab/actions";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LabOrderDefaults = {
  id: string;
  version: number;
  patientId: string;
  visitId: string | null;
  providerId: string;
  status: string;
  priority: string;
  notes: string;
};

export default function LabOrderForm({
  mode,
  order,
}: {
  mode: "create" | "edit";
  order?: LabOrderDefaults;
}) {
  const action = mode === "create" ? createLabOrderAction : updateLabOrderAction;
  const [state, formAction, pending] = useActionState<ReturnType<typeof createLabOrderAction>, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="rounded-lg border border-border bg-card p-4" noValidate>
      <h2 className="text-sm font-semibold">
        {mode === "create" ? "Lab order details" : "Edit lab order"}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {mode === "create"
          ? "The order is created in ordered status."
          : "Changes are versioned and written to the audit log."}
      </p>

      {order ? (
        <>
          <input type="hidden" name="id" value={order.id} />
          <input type="hidden" name="version" value={order.version} />
        </>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="patientId">Patient</Label>
          <Input
            id="patientId"
            name="patientId"
            autoComplete="off"
            defaultValue={order?.patientId}
            placeholder="Select or search for a patient"
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="providerId">Provider</Label>
          <Input
            id="providerId"
            name="providerId"
            autoComplete="off"
            defaultValue={order?.providerId}
            placeholder="Select or search for a provider"
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="visitId">Visit (optional)</Label>
          <Input
            id="visitId"
            name="visitId"
            autoComplete="off"
            defaultValue={order?.visitId ?? ""}
            placeholder="Link to an existing visit"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue={order?.priority ?? "routine"}>
            <SelectTrigger id="priority" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LAB_PRIORITY_VALUES.map((p) => (
                <SelectItem key={p} value={p}>
                  {labPriorityLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={order?.notes}
            placeholder="Clinical notes, special instructions..."
          />
        </div>
      </div>

      {state?.error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="mt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : mode === "create" ? "Create order" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
