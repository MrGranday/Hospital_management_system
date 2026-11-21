import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

import LabOrderForm from "../../lab-order-form";

export const dynamic = "force-dynamic";

export default async function EditLabOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "lab:update")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Edit lab order</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to edit lab orders.
        </p>
      </div>
    );
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase
    .from("lab_orders")
    .select(
      "id, version, patient_id, visit_id, provider_id, status, priority, notes",
    )
    .eq("id", id)
    .eq("hospital_id", context.hospitalId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!order) notFound();

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <Link
          href={`/lab/orders/${order.id}`}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Back to order
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Edit lab order</h1>
      </div>
      <LabOrderForm
        mode="edit"
        order={{
          id: order.id,
          version: order.version,
          patientId: order.patient_id,
          visitId: order.visit_id,
          providerId: order.provider_id,
          status: order.status,
          priority: order.priority,
          notes: order.notes ?? "",
        }}
      />
    </div>
  );
}
