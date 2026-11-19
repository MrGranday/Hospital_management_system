import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";

import PatientForm from "../patient-form";

export const dynamic = "force-dynamic";

export default async function NewPatientPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "patients:create")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Register patient</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to register patients.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <Link href="/patients" className="text-xs text-muted-foreground hover:underline">
          ← Back to patients
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Register patient</h1>
      </div>
      <PatientForm mode="create" />
    </div>
  );
}
