import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";

import { LocationForm } from "./location-form";

export const dynamic = "force-dynamic";

export default async function NewLocationPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "inventory:create")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">New Stock Location</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to create stock locations.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/inventory/locations" className="text-xs text-muted-foreground hover:underline">
          ← Back to locations
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Add stock location</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a ward dispensary, central warehouse, or emergency trolley location.
        </p>
      </div>
      <LocationForm />
    </div>
  );
}
