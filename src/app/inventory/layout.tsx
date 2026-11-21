import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  const canRead = hasPermission(context, "inventory:read");
  const canCreate = hasPermission(context, "inventory:create");

  if (!canRead && !canCreate) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Inventory</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view or manage inventory records.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/" className="text-xs text-muted-foreground hover:underline">
            ← Home
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Inventory &amp; Stock Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage medical stock items, batches, warehouse locations, and inventory adjustments.
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/inventory/items/new"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New item
          </Link>
        ) : null}
      </header>
      <nav className="flex items-center gap-4 text-sm text-muted-foreground border-b border-border pb-2">
        <Link
          href="/inventory"
          className="flex items-center gap-1.5 font-medium hover:text-foreground"
        >
          Items
        </Link>
        <Link
          href="/inventory/batches"
          className="flex items-center gap-1.5 font-medium hover:text-foreground"
        >
          Batches &amp; Expiry
        </Link>
        <Link
          href="/inventory/locations"
          className="flex items-center gap-1.5 font-medium hover:text-foreground"
        >
          Locations
        </Link>
        <Link
          href="/inventory/adjustments"
          className="flex items-center gap-1.5 font-medium hover:text-foreground"
        >
          Adjustments
        </Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
