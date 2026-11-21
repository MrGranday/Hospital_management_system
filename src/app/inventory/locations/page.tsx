import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

export default async function StockLocationsPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "inventory:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Stock Locations</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view stock locations.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: locations } = await supabase
    .from("stock_locations")
    .select("id, name, type, is_active, created_at")
    .eq("hospital_id", context.hospitalId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  const canCreate = hasPermission(context, "inventory:create");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Storage Locations &amp; Dispensaries</h2>
          <p className="text-xs text-muted-foreground">
            Manage wards, main pharmacy, satellite dispensaries, and warehouse rooms.
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/inventory/locations/new"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New location
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {locations?.map((loc) => (
          <div key={loc.id} className="rounded-lg border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {loc.type}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  loc.is_active
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {loc.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <h3 className="font-semibold text-foreground text-base">{loc.name}</h3>
          </div>
        ))}
        {(!locations || locations.length === 0) && (
          <div className="col-span-full rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
            No stock locations configured yet.
          </div>
        )}
      </div>
    </div>
  );
}
