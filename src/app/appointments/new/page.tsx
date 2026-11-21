import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";

import AppointmentForm from "../appointment-form";

export const dynamic = "force-dynamic";

export default async function NewAppointmentPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "appointments:create")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">New appointment</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to create appointments.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <Link href="/appointments" className="text-xs text-muted-foreground hover:underline">
          ← Back to appointments
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">New appointment</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Schedule a patient appointment with a provider.
        </p>
      </div>
      <AppointmentForm mode="create" />
    </div>
  );
}
