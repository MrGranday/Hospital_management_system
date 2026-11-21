import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function PharmacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  const canRead = hasPermission(context, "pharmacy:read");
  const canCreate = hasPermission(context, "pharmacy:create");

  if (!canRead && !canCreate) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Pharmacy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view or manage pharmacy records.
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
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Pharmacy &amp; Dispensing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Outpatient and inpatient prescription fulfillment, batch selection, and dispensation logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/inventory"
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            Check stock
          </Link>
        </div>
      </header>
      <nav className="flex items-center gap-4 text-sm text-muted-foreground border-b border-border pb-2">
        <Link
          href="/pharmacy"
          className="flex items-center gap-1.5 font-medium hover:text-foreground"
        >
          Prescription Queue
        </Link>
        <Link
          href="/pharmacy/dispensations"
          className="flex items-center gap-1.5 font-medium hover:text-foreground"
        >
          Dispensations Log
        </Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
