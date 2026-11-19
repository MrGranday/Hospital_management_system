import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { patientSexLabel } from "@/lib/patients/schema";
import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

import ArchivePatientButton from "./archive-patient-button";

export const dynamic = "force-dynamic";

function formatDate(value: string | null): string {
  if (!value) return "Not recorded";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "patients:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Patient record</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view patient records.
        </p>
      </div>
    );
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: patient } = await supabase
    .from("patients")
    .select(
      "id, mrn, full_name, sex, date_of_birth, phone, email, address, blood_group, notes, created_at, updated_at",
    )
    .eq("id", id)
    .eq("hospital_id", context.hospitalId)
    .maybeSingle();

  if (!patient) notFound();

  const canUpdate = hasPermission(context, "patients:update");
  const canArchive = hasPermission(context, "patients:archive");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/patients" className="text-xs text-muted-foreground hover:underline">
            ← Back to patients
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{patient.full_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            MRN <span className="font-mono">{patient.mrn}</span> · registered{" "}
            {formatTimestamp(patient.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canUpdate ? (
            <Link
              href={`/patients/${patient.id}/edit`}
              className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
            >
              Edit details
            </Link>
          ) : null}
          {canArchive ? <ArchivePatientButton patientId={patient.id} /> : null}
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold">Demographics</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Medical record number</dt>
            <dd className="mt-0.5 font-mono">{patient.mrn}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Sex</dt>
            <dd className="mt-0.5">{patientSexLabel(patient.sex)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Date of birth</dt>
            <dd className="mt-0.5">{formatDate(patient.date_of_birth)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Phone</dt>
            <dd className="mt-0.5">{patient.phone || "Not recorded"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="mt-0.5">{patient.email || "Not recorded"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Blood group</dt>
            <dd className="mt-0.5">{patient.blood_group || "Not recorded"}</dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-xs text-muted-foreground">Address</dt>
            <dd className="mt-0.5 whitespace-pre-line">{patient.address || "Not recorded"}</dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-xs text-muted-foreground">Notes</dt>
            <dd className="mt-0.5 whitespace-pre-line">{patient.notes || "None"}</dd>
          </div>
        </dl>
      </section>

      <p className="text-xs text-muted-foreground">
        Last updated {formatTimestamp(patient.updated_at)}. Archiving removes the patient from
        active lists; the record and its audit trail are kept.
      </p>
    </div>
  );
}
