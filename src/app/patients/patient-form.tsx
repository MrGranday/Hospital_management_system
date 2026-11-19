"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BLOOD_GROUPS,
  PATIENT_SEX_VALUES,
  patientSexLabel,
} from "@/lib/patients/schema";

import { createPatientAction, updatePatientAction, type PatientFormState } from "./actions";

export type PatientDefaults = {
  id: string;
  version: number;
  fullName: string;
  sex: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  notes: string;
};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function PatientForm({
  mode,
  patient,
}: {
  mode: "create" | "edit";
  patient?: PatientDefaults;
}) {
  const action = mode === "create" ? createPatientAction : updatePatientAction;
  const [state, formAction, pending] = useActionState<PatientFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="rounded-lg border border-border bg-card p-4" noValidate>
      <h2 className="text-sm font-semibold">
        {mode === "create" ? "Patient details" : "Edit patient details"}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {mode === "create"
          ? "The medical record number is assigned automatically when you save."
          : "Changes are versioned and written to the audit log."}
      </p>

      {patient ? (
        <>
          <input type="hidden" name="id" value={patient.id} />
          <input type="hidden" name="version" value={patient.version} />
        </>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="off"
            defaultValue={patient?.fullName}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sex">Sex</Label>
          <select
            id="sex"
            name="sex"
            defaultValue={patient?.sex ?? "unknown"}
            className={selectClassName}
          >
            {PATIENT_SEX_VALUES.map((value) => (
              <option key={value} value={value}>
                {patientSexLabel(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            defaultValue={patient?.dateOfBirth}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="off"
            defaultValue={patient?.phone}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bloodGroup">Blood group</Label>
          <select
            id="bloodGroup"
            name="bloodGroup"
            defaultValue={patient?.bloodGroup ?? ""}
            className={selectClassName}
          >
            <option value="">Not recorded</option>
            {BLOOD_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="off"
            defaultValue={patient?.email}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            autoComplete="off"
            defaultValue={patient?.address}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={patient?.notes}
            placeholder="Reception notes, access needs, preferred language..."
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
          {pending ? "Saving..." : mode === "create" ? "Register patient" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
