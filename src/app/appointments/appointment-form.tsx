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
  APPOINTMENT_TYPE_VALUES,
  appointmentTypeLabel,
} from "@/lib/appointments/schema";

import { createAppointmentAction, updateAppointmentAction, type AppointmentFormState } from "@/features/appointments/actions";

type AppointmentDefaults = {
  id: string;
  version: number;
  patientId: string;
  providerId: string;
  startsAt: string;
  endsAt: string;
  type: string;
  status: string;
  reason: string;
  notes: string;
};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function AppointmentForm({
  mode,
  appointment,
}: {
  mode: "create" | "edit";
  appointment?: AppointmentDefaults;
}) {
  const action = mode === "create" ? createAppointmentAction : updateAppointmentAction;
  const [state, formAction, pending] = useActionState<AppointmentFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="rounded-lg border border-border bg-card p-4" noValidate>
      <h2 className="text-sm font-semibold">
        {mode === "create" ? "Appointment details" : "Edit appointment details"}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {mode === "create"
          ? "The appointment is created in scheduled status."
          : "Changes are versioned and written to the audit log."}
      </p>

      {appointment ? (
        <>
          <input type="hidden" name="id" value={appointment.id} />
          <input type="hidden" name="version" value={appointment.version} />
        </>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="patientId">Patient</Label>
          <Input
            id="patientId"
            name="patientId"
            autoComplete="off"
            defaultValue={appointment?.patientId}
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
            defaultValue={appointment?.providerId}
            placeholder="Select or search for a provider"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startsAt">Starts at</Label>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={appointment?.startsAt}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endsAt">Ends at</Label>
          <Input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            defaultValue={appointment?.endsAt}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            name="type"
            defaultValue={appointment?.type ?? "new"}
          >
            <SelectTrigger id="type" className={selectClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPOINTMENT_TYPE_VALUES.map((t) => (
                <SelectItem key={t} value={t}>
                  {appointmentTypeLabel(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="reason">Reason</Label>
          <Input
            id="reason"
            name="reason"
            autoComplete="off"
            defaultValue={appointment?.reason}
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={appointment?.notes}
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
          {pending ? "Saving..." : mode === "create" ? "Schedule appointment" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
