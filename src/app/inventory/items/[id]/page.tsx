import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { movementTypeLabel } from "@/lib/pharmacy/schema";
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

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium" });
}

function formatMoney(minor: number, currency: string = "AFN"): string {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "inventory:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Item Details</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view inventory items.
        </p>
      </div>
    );
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: item } = await supabase
    .from("items")
    .select(
      "id, sku, name, description, category, unit, is_active, requires_prescription, is_controlled, created_at, updated_at, version",
    )
    .eq("id", id)
    .eq("hospital_id", context.hospitalId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!item) notFound();

  // Batches
  const { data: batches } = await supabase
    .from("item_batches")
    .select("id, batch_no, expiry_date, cost_price_minor, sale_price_minor, currency, created_at")
    .eq("item_id", item.id)
    .eq("hospital_id", context.hospitalId)
    .order("expiry_date", { ascending: true });

  // Stock movements
  const { data: movements } = await supabase
    .from("stock_movements")
    .select(
      "id, batch_id, movement_type, quantity, reference_type, notes, created_at, created_by",
    )
    .eq("item_id", item.id)
    .eq("hospital_id", context.hospitalId)
    .order("created_at", { ascending: false })
    .limit(20);

  const stockOnHand = (movements ?? []).reduce((sum, m) => sum + m.quantity, 0);
  const canCreate = hasPermission(context, "inventory:create");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/inventory" className="text-xs text-muted-foreground hover:underline">
            ← Back to inventory
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold tracking-tight">{item.name}</h1>
            <span className="font-mono text-sm px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {item.sku}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Category: {item.category || "Unassigned"} · Dispensed by {item.unit}
          </p>
        </div>
        {canCreate ? (
          <div className="flex items-center gap-2">
            <Link
              href={`/inventory/batches/new?itemId=${item.id}`}
              className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add batch
            </Link>
          </div>
        ) : null}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Stock on Hand</p>
          <p className={`mt-1 text-2xl font-bold font-mono ${stockOnHand <= 0 ? "text-rose-600" : "text-emerald-700"}`}>
            {stockOnHand} {item.unit}s
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Active Batches</p>
          <p className="mt-1 text-2xl font-bold">{batches?.length ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Status &amp; Restrictions</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {item.requires_prescription ? (
              <span className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700 border border-amber-200">
                Rx Required
              </span>
            ) : null}
            {item.is_controlled ? (
              <span className="px-2 py-0.5 rounded text-xs bg-rose-50 text-rose-700 border border-rose-200">
                Controlled
              </span>
            ) : null}
            {item.is_active ? (
              <span className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                Inactive
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Batches &amp; Expiry (FEFO)</h2>
        {!batches || batches.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No batches recorded for this item.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Batch No</th>
                  <th scope="col" className="px-4 py-2 font-medium">Expiry Date</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Cost Price</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Sale Price</th>
                  <th scope="col" className="px-4 py-2 font-medium">Received</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => {
                  const isExpired = new Date(b.expiry_date) < new Date();
                  return (
                    <tr key={b.id} className="border-t border-border">
                      <td className="px-4 py-3 font-mono font-medium">{b.batch_no}</td>
                      <td className="px-4 py-3">
                        <span className={isExpired ? "text-rose-600 font-semibold" : ""}>
                          {formatDate(b.expiry_date)}
                          {isExpired ? " (Expired)" : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{formatMoney(b.cost_price_minor, b.currency)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatMoney(b.sale_price_minor, b.currency)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(b.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Stock Movement History */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Recent Movements</h2>
        {!movements || movements.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No stock movements recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Date</th>
                  <th scope="col" className="px-4 py-2 font-medium">Type</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Quantity</th>
                  <th scope="col" className="px-4 py-2 font-medium">Reference</th>
                  <th scope="col" className="px-4 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">{formatTimestamp(m.created_at)}</td>
                    <td className="px-4 py-3 font-medium">{movementTypeLabel(m.movement_type)}</td>
                    <td className={`px-4 py-3 text-right font-mono font-medium ${m.quantity < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{m.reference_type || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{m.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
