import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function StockAdjustmentsPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "inventory:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Stock Adjustments</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view stock adjustments.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: adjustments } = await supabase
    .from("stock_adjustments")
    .select("id, movement_id, reason, approved_at, approved_by, created_at, created_by")
    .eq("hospital_id", context.hospitalId)
    .order("created_at", { ascending: false })
    .limit(50);

  const adjList = adjustments ?? [];
  const movementIds = adjList.map((a) => a.movement_id);

  const { data: movements } = movementIds.length > 0
    ? await supabase
        .from("stock_movements")
        .select("id, item_id, quantity, movement_type")
        .in("id", movementIds)
    : { data: [] };

  const movementMap = new Map(movements?.map((m) => [m.id, m]) ?? []);
  const itemIds = [...new Set(movements?.map((m) => m.item_id) ?? [])];

  const { data: items } = itemIds.length > 0
    ? await supabase
        .from("items")
        .select("id, name, sku, unit")
        .in("id", itemIds)
    : { data: [] };

  const itemMap = new Map(items?.map((i) => [i.id, i]) ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Inventory Adjustment Audit Trail</h2>
        <p className="text-xs text-muted-foreground">
          Append-only audit record of manual stock adjustments, counts, damage, and write-offs.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {adjList.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No stock adjustments on record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Item</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Adjusted Qty</th>
                  <th scope="col" className="px-4 py-3 font-medium">Reason</th>
                  <th scope="col" className="px-4 py-3 font-medium">Approval</th>
                </tr>
              </thead>
              <tbody>
                {adjList.map((a) => {
                  const mov = movementMap.get(a.movement_id);
                  const item = mov ? itemMap.get(mov.item_id) : undefined;

                  return (
                    <tr key={a.id} className="border-t border-border">
                      <td className="px-4 py-3 text-muted-foreground">{formatTimestamp(a.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item?.sku}</div>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-medium ${(mov?.quantity ?? 0) < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                        {mov ? (mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity) : "—"} {item?.unit}
                      </td>
                      <td className="px-4 py-3 text-xs">{a.reason}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {a.approved_at ? (
                          <span className="text-emerald-700">Approved</span>
                        ) : (
                          <span className="text-amber-600">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
