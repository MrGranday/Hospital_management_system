import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  const canRead = hasPermission(context, "billing:read");
  const canCreate = hasPermission(context, "billing:create");

  if (!canRead && !canCreate) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Billing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view or manage billing records.
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
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Billing &amp; Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage patient invoices, service price lists, payments, and credit notes.
          </p>
        </div>
        {canCreate ? (
          <div className="flex items-center gap-2">
            <Link
              href="/billing/new"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              New invoice
            </Link>
          </div>
        ) : null}
      </header>
      <nav className="flex items-center gap-4 text-sm text-muted-foreground border-b border-border pb-2">
        <Link
          href="/billing"
          className="flex items-center gap-1.5 font-medium hover:text-foreground"
        >
          Invoices
        </Link>
        <Link
          href="/billing/services"
          className="flex items-center gap-1.5 font-medium hover:text-foreground"
        >
          Services catalog
        </Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
