import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function EmrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  const canRead = hasPermission(context, "emr:read");

  if (!canRead) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">EMR Workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view electronic medical records.
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
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Electronic Medical Records (EMR)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Clinical consultations, problem lists, allergies, diagnoses, and medical histories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/patients"
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            Find patient
          </Link>
          <Link
            href="/visits"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Active OPD Queue
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
