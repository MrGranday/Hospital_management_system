import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";

import LabOrderForm from "../lab-order-form";

export const dynamic = "force-dynamic";

export default async function NewLabOrderPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "lab:create")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">New lab order</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to create lab orders.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <Link href="/lab" className="text-xs text-muted-foreground hover:underline">
          ← Back to lab orders
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">New lab order</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Order laboratory tests for a patient.
        </p>
      </div>
      <LabOrderForm mode="create" />
    </div>
  );
}
