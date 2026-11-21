import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

import AppointmentForm from "../../appointment-form";

export const dynamic = "force-dynamic";

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "appointments:update")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Edit appointment</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to edit appointments.
        </p>
      </div>
    );
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: appointment } = await supabase
    .from("appointments")
    .select(
      "id, version, patient_id, provider_id, starts_at, ends_at, type, status, reason, notes",
    )
    .eq("id", id)
    .eq("hospital_id", context.hospitalId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!appointment) notFound();

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <Link
          href={`/appointments/${appointment.id}`}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Back to appointment
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Edit appointment</h1>
      </div>
      <AppointmentForm
        mode="edit"
        appointment={{
          id: appointment.id,
          version: appointment.version,
          patientId: appointment.patient_id,
          providerId: appointment.provider_id,
          startsAt: appointment.starts_at,
          endsAt: appointment.ends_at,
          type: appointment.type,
          status: appointment.status,
          reason: appointment.reason,
          notes: appointment.notes ?? "",
        }}
      />
    </div>
  );
}
