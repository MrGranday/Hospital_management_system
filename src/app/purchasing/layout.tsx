import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function PurchasingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  const canRead = hasPermission(context, "purchasing:read");
  const canCreate = hasPermission(context, "purchasing:create");

  if (!canRead && !canCreate) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Purchasing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view or manage purchasing records.
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
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Purchasing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage suppliers, purchase orders, and goods receipts.
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/purchasing/suppliers/new"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New supplier
          </Link>
        ) : null}
      </header>
      <nav className="flex items-center gap-4 text-sm text-muted-foreground border-b border-border pb-2">
        <Link
          href="/purchasing/suppliers"
          className="flex items-center gap-1.5 font-medium hover:text-foreground"
        >
          Suppliers
        </Link>
        <Link
          href="/purchasing/orders"
          className="flex items-center gap-1.5 font-medium hover:text-foreground"
        >
          Purchase Orders
        </Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
