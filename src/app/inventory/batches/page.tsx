import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium" });
}

function formatMoney(minor: number, currency: string = "AFN"): string {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

export default async function BatchesPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "inventory:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Batches</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view inventory batches.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: batches } = await supabase
    .from("item_batches")
    .select(
      "id, item_id, batch_no, expiry_date, cost_price_minor, sale_price_minor, currency, received_at",
    )
    .eq("hospital_id", context.hospitalId)
    .is("deleted_at", null)
    .order("expiry_date", { ascending: true })
    .limit(100);

  const batchList = batches ?? [];
  const itemIds = [...new Set(batchList.map((b) => b.item_id))];

  const { data: items } = itemIds.length > 0
    ? await supabase
        .from("items")
        .select("id, name, sku, unit")
        .in("id", itemIds)
    : { data: [] };

  const itemMap = new Map(items?.map((i) => [i.id, i]) ?? []);
  const canCreate = hasPermission(context, "inventory:create");

  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Item Batches &amp; Expiry Tracker</h2>
          <p className="text-xs text-muted-foreground">
            Track batch numbers, expiration dates, and FEFO (First-Expired, First-Out) picking order.
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/inventory/batches/new"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New batch
          </Link>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {batchList.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No batches recorded in the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Batch No</th>
                  <th scope="col" className="px-4 py-3 font-medium">Item</th>
                  <th scope="col" className="px-4 py-3 font-medium">Expiry Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Cost Price</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Sale Price</th>
                  <th scope="col" className="px-4 py-3 font-medium">Received</th>
                </tr>
              </thead>
              <tbody>
                {batchList.map((b) => {
                  const item = itemMap.get(b.item_id);
                  const expDate = new Date(b.expiry_date);
                  const isExpired = expDate < today;
                  const isExpiringSoon = !isExpired && expDate <= thirtyDaysFromNow;

                  return (
                    <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono font-medium">{b.batch_no}</td>
                      <td className="px-4 py-3">
                        <Link href={`/inventory/items/${b.item_id}`} className="font-medium hover:underline">
                          {item?.name ?? "Unknown item"}
                        </Link>
                        <div className="text-xs text-muted-foreground font-mono">{item?.sku}</div>
                      </td>
                      <td className="px-4 py-3">{formatDate(b.expiry_date)}</td>
                      <td className="px-4 py-3">
                        {isExpired ? (
                          <span className="px-2 py-0.5 rounded text-xs bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                            Expired
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                            Expiring soon
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Valid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{formatMoney(b.cost_price_minor, b.currency)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatMoney(b.sale_price_minor, b.currency)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(b.received_at)}</td>
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
