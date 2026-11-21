import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { visitStatusLabel } from "@/lib/visits/schema";
import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "visits:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Visit</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view visits.
        </p>
      </div>
    );
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: visit } = await supabase
    .from("visits")
    .select(
      "id, patient_id, provider_id, appointment_id, status, queue_position, started_at, completed_at, chief_complaint, notes, created_at, updated_at, version",
    )
    .eq("id", id)
    .eq("hospital_id", context.hospitalId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!visit) notFound();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, mrn")
    .eq("id", visit.patient_id)
    .eq("hospital_id", context.hospitalId)
    .is("deleted_at", null)
    .maybeSingle();

  const { data: provider } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .eq("user_id", visit.provider_id)
    .eq("hospital_id", context.hospitalId)
    .maybeSingle();

  const canUpdate = hasPermission(context, "visits:update");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/visits" className="text-xs text-muted-foreground hover:underline">
            ← Back to visits
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {patient?.full_name ?? "Unknown patient"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            MRN <span className="font-mono">{patient?.mrn ?? "—"}</span> · {visitStatusLabel(
            visit.status,
          )} · queue {visit.queue_position ?? "—"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canUpdate ? (
            <Link
              href={`/visits/${visit.id}/edit`}
              className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
            >
              Edit details
            </Link>
          ) : null}
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold">Visit details</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Patient</dt>
            <dd className="mt-0.5 font-medium">{patient?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Provider</dt>
            <dd className="mt-0.5">{provider?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="mt-0.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                  visit.status === "completed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : visit.status === "cancelled"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : visit.status === "consultation"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : visit.status === "vitals"
                          ? "bg-brand-50 text-brand-700 border-brand-200"
                          : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {visitStatusLabel(visit.status)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Queue position</dt>
            <dd className="mt-0.5">{visit.queue_position ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Started</dt>
            <dd className="mt-0.5">
              {visit.started_at ? formatTimestamp(visit.started_at) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Completed</dt>
            <dd className="mt-0.5">
              {visit.completed_at ? formatTimestamp(visit.completed_at) : "—"}
            </dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-xs text-muted-foreground">Chief complaint</dt>
            <dd className="mt-0.5 whitespace-pre-line">{visit.chief_complaint || "—"}</dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-xs text-muted-foreground">Notes</dt>
            <dd className="mt-0.5 whitespace-pre-line">{visit.notes || "None"}</dd>
          </div>
        </dl>
      </section>

      <p className="text-xs text-muted-foreground">
        Version {visit.version} · last updated {formatTimestamp(visit.updated_at)}.
      </p>
    </div>
  );
}
