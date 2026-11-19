import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { patientSexLabel } from "@/lib/patients/schema";
import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

import ArchivePatientButton from "./archive-patient-button";
import DeleteDocumentButton from "./delete-document-button";
import DocumentUploadForm from "./document-upload-form";

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

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
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

  const { data: mergedRecords } = await supabase
    .from("patient_merges")
    .select("id, source_mrn, source_full_name, reason, created_at")
    .eq("target_patient_id", patient.id)
    .eq("hospital_id", context.hospitalId)
    .order("created_at", { ascending: false });

  const { data: documents } = await supabase
    .from("patient_documents")
    .select("id, file_name, mime_type, size_bytes, created_at")
    .eq("patient_id", patient.id)
    .eq("hospital_id", context.hospitalId)
    .order("created_at", { ascending: false });

  const canUpdate = hasPermission(context, "patients:update");
  const canArchive = hasPermission(context, "patients:archive");
  const canMerge = hasPermission(context, "patients:merge");

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
          {canMerge ? (
            <Link
              href={`/patients/${patient.id}/merge`}
              className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
            >
              Merge duplicate
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

      {mergedRecords && mergedRecords.length > 0 ? (
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Merged duplicates</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            These records were archived and linked to this patient.
          </p>
          <ul className="mt-4 divide-y divide-border text-sm">
            {mergedRecords.map((merge) => (
              <li key={merge.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{merge.source_full_name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {merge.source_mrn}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {merge.reason} · merged {formatTimestamp(merge.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section id="documents" className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold">Documents</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Private files linked to this patient. Downloads use short-lived signed links and are
          recorded in the audit log.
        </p>

        {canUpdate ? (
          <div className="mt-4">
            <DocumentUploadForm patientId={patient.id} />
          </div>
        ) : null}

        {!documents || documents.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No documents uploaded.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border text-sm">
            {documents.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <a
                    href={`/patients/${patient.id}/documents/${document.id}`}
                    className="block truncate font-medium hover:underline"
                  >
                    {document.file_name}
                  </a>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatBytes(document.size_bytes)} · uploaded{" "}
                    {formatTimestamp(document.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`/patients/${patient.id}/documents/${document.id}`}
                    className="text-xs font-medium hover:underline"
                  >
                    Download
                  </a>
                  {canUpdate ? (
                    <DeleteDocumentButton patientId={patient.id} documentId={document.id} />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Last updated {formatTimestamp(patient.updated_at)}. Archiving removes the patient from
        active lists; the record and its audit trail are kept.
      </p>
    </div>
  );
}
