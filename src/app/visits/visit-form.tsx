"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  VISIT_STATUS_VALUES,
  visitStatusLabel,
} from "@/lib/visits/schema";

import {
  createVisitAction,
  updateVisitAction,
  type VisitFormState,
} from "@/features/visits/actions";

type VisitDefaults = {
  id: string;
  version: number;
  patientId: string;
  providerId: string;
  appointmentId: string | null;
  status: string;
  queuePosition: number | null;
  startedAt: string | null;
  completedAt: string | null;
  chiefComplaint: string;
  notes: string;
};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function VisitForm({
  mode,
  visit,
}: {
  mode: "create" | "edit";
  visit?: VisitDefaults;
}) {
  const action = mode === "create" ? createVisitAction : updateVisitAction;
  const [state, formAction, pending] = useActionState<VisitFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="rounded-lg border border-border bg-card p-4" noValidate>
      <h2 className="text-sm font-semibold">
        {mode === "create" ? "Visit details" : "Edit visit details"}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {mode === "create"
          ? "The visit is created in waiting status and added to the end of the OPD queue."
          : "Changes are versioned and written to the audit log."}
      </p>

      {visit ? (
        <>
          <input type="hidden" name="id" value={visit.id} />
          <input type="hidden" name="version" value={visit.version} />
        </>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="patientId">Patient</Label>
          <Input
            id="patientId"
            name="patientId"
            autoComplete="off"
            defaultValue={visit?.patientId}
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
            defaultValue={visit?.providerId}
            placeholder="Select or search for a provider"
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="appointmentId">Appointment (optional)</Label>
          <Input
            id="appointmentId"
            name="appointmentId"
            autoComplete="off"
            defaultValue={visit?.appointmentId ?? ""}
            placeholder="Link to an existing appointment"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            name="status"
            defaultValue={visit?.status ?? "waiting"}
          >
            <SelectTrigger id="status" className={selectClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VISIT_STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {visitStatusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="chiefComplaint">Chief complaint</Label>
          <Input
            id="chiefComplaint"
            name="chiefComplaint"
            autoComplete="off"
            defaultValue={visit?.chiefComplaint}
            placeholder="e.g. Chest pain, fever, follow-up..."
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={visit?.notes}
            placeholder="Clinical notes, preparation instructions..."
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
          {pending ? "Saving..." : mode === "create" ? "Create visit" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
