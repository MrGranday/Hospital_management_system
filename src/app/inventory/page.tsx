import Link from "next/link";
import { redirect } from "next/navigation";

import { PHARMACY_PAGE_SIZE } from "@/lib/pharmacy/schema";
import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

export default async function InventoryItemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  const hospitalId = context.hospitalId;

  if (!hasPermission(context, "inventory:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Inventory Items</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view inventory items.
        </p>
      </div>
    );
  }

  const raw = await searchParams;
  const page = Math.max(1, Array.isArray(raw.page) ? Number(raw.page[0]) : Number(raw.page || 1));
  const q = Array.isArray(raw.q) ? raw.q[0] : raw.q;
  const offset = (page - 1) * PHARMACY_PAGE_SIZE;

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("items")
    .select(
      "id, sku, name, description, category, unit, is_active, requires_prescription, is_controlled, created_at, version",
      { count: "exact" },
    )
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .range(offset, offset + PHARMACY_PAGE_SIZE - 1);

  if (q && typeof q === "string" && q.trim()) {
    query = query.or(`name.ilike.%${q.trim()}%,sku.ilike.%${q.trim()}%`);
  }

  const { data: items, count, error } = await query;
  if (error) throw new Error(error.message);

  const itemList = items ?? [];
  const itemIds = itemList.map((i) => i.id);

  // Aggregate stock movements for these items to compute current stock on hand
  const { data: movements } = itemIds.length > 0
    ? await supabase
        .from("stock_movements")
        .select("item_id, quantity")
        .eq("hospital_id", hospitalId)
        .in("item_id", itemIds)
    : { data: [] };

  const stockMap = new Map<string, number>();
  for (const m of movements ?? []) {
    stockMap.set(m.item_id, (stockMap.get(m.item_id) ?? 0) + m.quantity);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PHARMACY_PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <form method="get" className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by SKU or item name..."
          className="flex-1 min-w-[240px] max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium hover:bg-secondary/80"
        >
          Search
        </button>
        {q ? (
          <Link
            href="/inventory"
            className="text-xs text-muted-foreground hover:underline"
          >
            Clear filter
          </Link>
        ) : null}
      </form>

      {/* Items Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {itemList.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No inventory items found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">SKU</th>
                  <th scope="col" className="px-4 py-3 font-medium">Name</th>
                  <th scope="col" className="px-4 py-3 font-medium">Category</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Stock On Hand</th>
                  <th scope="col" className="px-4 py-3 font-medium">Unit</th>
                  <th scope="col" className="px-4 py-3 font-medium">Flags</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {itemList.map((item) => {
                  const stock = stockMap.get(item.id) ?? 0;
                  return (
                    <tr key={item.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs font-semibold">
                        <Link href={`/inventory/items/${item.id}`} className="hover:underline">
                          {item.sku}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{item.name}</div>
                        {item.description ? (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {item.description}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">
                        {item.category || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        <span
                          className={
                            stock <= 0
                              ? "text-rose-600 font-bold"
                              : stock < 10
                                ? "text-amber-600 font-semibold"
                                : "text-emerald-700"
                          }
                        >
                          {stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.unit}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {item.requires_prescription ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                              Rx Only
                            </span>
                          ) : null}
                          {item.is_controlled ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                              Controlled
                            </span>
                          ) : null}
                          {!item.is_active ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
                              Inactive
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/inventory/items/${item.id}`}
                          className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <div>
              Showing {offset + 1} to {Math.min(offset + PHARMACY_PAGE_SIZE, count ?? 0)} of {count} items
            </div>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={`/inventory?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className="rounded border border-input px-2.5 py-1 hover:bg-accent"
                >
                  Previous
                </Link>
              ) : null}
              <span>Page {page} of {totalPages}</span>
              {page < totalPages ? (
                <Link
                  href={`/inventory?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className="rounded border border-input px-2.5 py-1 hover:bg-accent"
                >
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
