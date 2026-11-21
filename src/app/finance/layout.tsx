import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  const canRead = hasPermission(context, "billing:read");

  if (!canRead) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Finance</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view financial collections.
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
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Finance &amp; Collections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cash receipts, daily collections ledger, and payment method summaries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/billing"
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            Manage invoices
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
