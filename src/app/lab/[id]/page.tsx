import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { labOrderStatusLabel, labPriorityLabel } from "@/lib/lab/schema";
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

export default async function LabOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  const hospitalId = context.hospitalId;

  if (!hasPermission(context, "lab:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Lab order</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view lab orders.
        </p>
      </div>
    );
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase
    .from("lab_orders")
    .select(
      "id, patient_id, provider_id, order_no, status, priority, ordered_at, collected_at, completed_at, notes, version",
    )
    .eq("id", id)
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!order) notFound();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, mrn")
    .eq("id", order.patient_id)
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .maybeSingle();

  const { data: items } = await supabase
    .from("lab_order_items")
    .select(
      "id, test_name, test_code, status, result_value, result_unit, reference_range, is_abnormal, verified, verified_at, entered_at",
    )
    .eq("lab_order_id", order.id)
    .eq("hospital_id", hospitalId)
    .order("created_at", { ascending: true });

  const { data: results } = await supabase
    .from("lab_results")
    .select(
      "id, lab_order_item_id, result_value, result_unit, reference_range, is_abnormal, status, entered_at, verified, verified_at",
    )
    .eq("hospital_id", hospitalId)
    .order("entered_at", { ascending: true });

  const latestResultByItem = new Map<string, { result_value: string; result_unit: string | null; reference_range: string | null; is_abnormal: boolean | null; status: string; entered_at: string; verified: boolean; verified_at: string | null } | undefined>();
  items?.forEach((item) => {
    const itemResults = results?.filter((r) => r.lab_order_item_id === item.id);
    latestResultByItem.set(item.id, itemResults?.[itemResults.length - 1]);
  });

  const canUpdate = hasPermission(context, "lab:update");
  const canVerify = hasPermission(context, "lab:verify");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/lab" className="text-xs text-muted-foreground hover:underline">
            ← Back to lab orders
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {order.order_no}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {patient?.full_name ?? "Unknown patient"} · MRN{" "}
            <span className="font-mono">{patient?.mrn ?? "—"}</span> ·{" "}
            {labPriorityLabel(order.priority)} · {formatTimestamp(order.ordered_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canUpdate ? (
            <Link
              href={`/lab/orders/${order.id}/edit`}
              className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
            >
              Edit order
            </Link>
          ) : null}
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold">Order details</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Patient</dt>
            <dd className="mt-0.5 font-medium">{patient?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="mt-0.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                  order.status === "completed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : order.status === "cancelled"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : order.status === "in_progress"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : order.status === "sample_collected"
                          ? "bg-brand-50 text-brand-700 border-brand-200"
                          : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {labOrderStatusLabel(order.status)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Priority</dt>
            <dd className="mt-0.5">{labPriorityLabel(order.priority)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Ordered</dt>
            <dd className="mt-0.5">{formatTimestamp(order.ordered_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Collected</dt>
            <dd className="mt-0.5">
              {order.collected_at ? formatTimestamp(order.collected_at) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Completed</dt>
            <dd className="mt-0.5">
              {order.completed_at ? formatTimestamp(order.completed_at) : "—"}
            </dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-xs text-muted-foreground">Notes</dt>
            <dd className="mt-0.5 whitespace-pre-line">{order.notes || "None"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold">Tests &amp; results</h2>
        {(!items || items.length === 0) ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No tests ordered yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Test</th>
                  <th scope="col" className="px-4 py-2 font-medium">Status</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Result</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Unit</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Reference</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Verified</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Entered</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const latestResult = latestResultByItem.get(item.id);
                  return (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        {item.test_name}
                        {item.test_code && (
                          <span className="ml-2 text-xs text-muted-foreground font-mono">
                            ({item.test_code})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                            item.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : item.status === "cancelled"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : item.status === "in_progress"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : item.status === "collected"
                                    ? "bg-brand-50 text-brand-700 border-brand-200"
                                    : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {item.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {latestResult ? (
                          <span
                            className={`font-medium ${latestResult.is_abnormal ? "text-destructive" : "text-foreground"}`}
                          >
                            {latestResult.result_value}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {latestResult?.result_unit || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {latestResult?.reference_range || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {latestResult?.verified ? (
                          <span className="text-xs text-emerald-700">Yes</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {latestResult?.entered_at ? formatTimestamp(latestResult.entered_at) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Version {order.version}.
      </p>
    </div>
  );
}
