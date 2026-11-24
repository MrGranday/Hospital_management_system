import Link from "next/link";
import { redirect } from "next/navigation";

import {
  LAB_PAGE_SIZE,
  labOrderStatusLabel,
  labPriorityLabel,
} from "@/lib/lab/schema";
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

export default async function LabOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  const hospitalId = context.hospitalId;

  if (!hasPermission(context, "lab:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Laboratory</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view lab orders.
        </p>
      </div>
    );
  }

  const raw = await searchParams;
  const q = Array.isArray(raw.q) ? raw.q[0] : raw.q;
  const page = Array.isArray(raw.page) ? Number(raw.page[0]) : Number(raw.page);
  const status = Array.isArray(raw.status) ? raw.status[0] : raw.status;
  const offset = (page - 1) * LAB_PAGE_SIZE;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("lab_orders").select(
    "id, patient_id, provider_id, order_no, status, priority, ordered_at, collected_at, completed_at, version",
  )
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("ordered_at", { ascending: false })
    .range(offset, offset + LAB_PAGE_SIZE - 1);

  if (error) throw new Error(error.message);

  const orders = data ?? [];
  const canCreate = hasPermission(context, "lab:create");
  const canUpdate = hasPermission(context, "lab:update");

  // Fetch patient names
  const patientIds = [...new Set(orders.map((o) => o.patient_id))];
  const { data: patients } = await supabase
    .from("patients")
    .select("id, full_name, mrn")
    .in("id", patientIds);

  const patientMap = new Map(
    patients?.map((p) => [p.id, { full_name: p.full_name, mrn: p.mrn }]) ?? [],
  );

  return (
    <div className="space-y-6">
      <form method="get" action="/lab" className="flex flex-wrap gap-2">
        <label htmlFor="lab-search" className="sr-only">
          Search lab orders
        </label>
        <input
          id="lab-search"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Search order number or patient name"
          className="flex h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All statuses</option>
          {["ordered", "sample_collected", "in_progress", "completed", "cancelled"].map((s) => (
            <option key={s} value={s}>
              {labOrderStatusLabel(s)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          Search
        </button>
        {(q || status) && (
          <Link
            href="/lab"
            className="inline-flex h-9 items-center justify-center px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </Link>
        )}
      </form>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Lab orders</h2>
          <p className="text-xs text-muted-foreground">
            {orders.length} order{orders.length !== 1 ? "s" : ""} shown
          </p>
        </div>

        {orders.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            {q || status ? "No lab orders match your search." : "No lab orders yet. Create the first order to get started."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Order
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Patient
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    MRN
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Priority
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Ordered
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const patient = patientMap.get(o.patient_id);
                  return (
                    <tr key={o.id} className="border-t border-border">
                      <td className="px-4 py-3 font-mono text-xs">
                        {o.order_no}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/lab/${o.id}`} className="font-medium hover:underline">
                          {patient?.full_name ?? "Unknown patient"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {patient?.mrn ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">{labPriorityLabel(o.priority)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                            o.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : o.status === "cancelled"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : o.status === "in_progress"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : o.status === "sample_collected"
                                    ? "bg-brand-50 text-brand-700 border-brand-200"
                                    : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {labOrderStatusLabel(o.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {o.ordered_at ? formatTimestamp(o.ordered_at) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/lab/${o.id}`}
                            className="text-xs font-medium hover:underline"
                          >
                            View
                          </Link>
                          {canUpdate && o.status !== "completed" ? (
                            <Link
                              href={`/lab/${o.id}/edit`}
                              className="text-xs text-brand hover:underline"
                            >
                              Edit
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
