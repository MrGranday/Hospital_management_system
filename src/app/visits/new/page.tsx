import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";

import VisitForm from "../visit-form";

export const dynamic = "force-dynamic";

export default async function NewVisitPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "visits:create")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">New visit</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to create visits.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <Link href="/visits" className="text-xs text-muted-foreground hover:underline">
          ← Back to visits
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">New visit</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new OPD visit and add the patient to the queue.
        </p>
      </div>
      <VisitForm mode="create" />
    </div>
  );
}
