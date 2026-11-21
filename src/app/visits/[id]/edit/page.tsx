import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

import VisitForm from "../../visit-form";

export const dynamic = "force-dynamic";

export default async function EditVisitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "visits:update")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Edit visit</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to edit visits.
        </p>
      </div>
    );
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: visit } = await supabase
    .from("visits")
    .select(
      "id, version, patient_id, provider_id, appointment_id, status, queue_position, started_at, completed_at, chief_complaint, notes",
    )
    .eq("id", id)
    .eq("hospital_id", context.hospitalId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!visit) notFound();

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <Link
          href={`/visits/${visit.id}`}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Back to visit
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Edit visit</h1>
      </div>
      <VisitForm
        mode="edit"
        visit={{
          id: visit.id,
          version: visit.version,
          patientId: visit.patient_id,
          providerId: visit.provider_id,
          appointmentId: visit.appointment_id ?? "",
          status: visit.status,
          queuePosition: visit.queue_position,
          startedAt: visit.started_at,
          completedAt: visit.completed_at,
          chiefComplaint: visit.chief_complaint ?? "",
          notes: visit.notes ?? "",
        }}
      />
    </div>
  );
}
