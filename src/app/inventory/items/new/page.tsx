import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";

import { ItemForm } from "./item-form";

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "inventory:create")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">New Item</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to create inventory items.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/inventory" className="text-xs text-muted-foreground hover:underline">
          ← Back to inventory
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Add inventory item</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register a medication, supply, or equipment in the inventory catalog.
        </p>
      </div>
      <ItemForm />
    </div>
  );
}
