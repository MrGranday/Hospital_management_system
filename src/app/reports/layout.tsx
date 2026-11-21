import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthContext } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/" className="text-xs text-muted-foreground hover:underline">
            ← Home
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Clinical &amp; Financial Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aggregated metrics, census statistics, inventory valuations, and audit reports.
          </p>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
