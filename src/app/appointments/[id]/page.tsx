import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  appointmentStatusLabel,
  appointmentTypeLabel,
} from "@/lib/appointments/schema";
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

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "appointments:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Appointment</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view appointments.
        </p>
      </div>
    );
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: appointment } = await supabase
    .from("appointments")
    .select(
      "id, patient_id, provider_id, starts_at, ends_at, type, status, reason, notes, created_at, updated_at, version",
    )
    .eq("id", id)
    .eq("hospital_id", context.hospitalId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!appointment) notFound();

  // Load patient and provider names
  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, mrn")
    .eq("id", appointment.patient_id)
    .eq("hospital_id", context.hospitalId)
    .is("deleted_at", null)
    .maybeSingle();

  const { data: provider } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .eq("user_id", appointment.provider_id)
    .eq("hospital_id", context.hospitalId)
    .maybeSingle();

  const canUpdate = hasPermission(context, "appointments:update");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/appointments" className="text-xs text-muted-foreground hover:underline">
            ← Back to appointments
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {patient?.full_name ?? "Unknown patient"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            MRN <span className="font-mono">{patient?.mrn ?? "—"}</span> ·{" "}
            {appointmentTypeLabel(appointment.type)} · {formatTimestamp(appointment.starts_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canUpdate ? (
            <Link
              href={`/appointments/${appointment.id}/edit`}
              className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
            >
              Edit details
            </Link>
          ) : null}
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold">Appointment details</h2>
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
            <dt className="text-xs text-muted-foreground">Type</dt>
            <dd className="mt-0.5">{appointmentTypeLabel(appointment.type)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="mt-0.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                  appointment.status === "completed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : appointment.status === "cancelled" || appointment.status === "no-show"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : appointment.status === "in-progress"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : appointment.status === "checked-in"
                          ? "bg-brand-50 text-brand-700 border-brand-200"
                          : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {appointmentStatusLabel(appointment.status)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Starts</dt>
            <dd className="mt-0.5">{formatTimestamp(appointment.starts_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Ends</dt>
            <dd className="mt-0.5">{formatTimestamp(appointment.ends_at)}</dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-xs text-muted-foreground">Reason</dt>
            <dd className="mt-0.5 whitespace-pre-line">{appointment.reason}</dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-xs text-muted-foreground">Notes</dt>
            <dd className="mt-0.5 whitespace-pre-line">
              {appointment.notes || "None"}
            </dd>
          </div>
        </dl>
      </section>

      <p className="text-xs text-muted-foreground">
        Version {appointment.version} · last updated {formatTimestamp(appointment.updated_at)}.
      </p>
    </div>
  );
}
