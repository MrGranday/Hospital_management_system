import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

import PatientForm from "../../patient-form";

export const dynamic = "force-dynamic";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "patients:update")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Edit patient</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to edit patient records.
        </p>
      </div>
    );
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: patient } = await supabase
    .from("patients")
    .select(
      "id, version, full_name, sex, date_of_birth, phone, email, address, blood_group, notes",
    )
    .eq("id", id)
    .eq("hospital_id", context.hospitalId)
    .maybeSingle();

  if (!patient) notFound();

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <Link href={`/patients/${patient.id}`} className="text-xs text-muted-foreground hover:underline">
          ← Back to patient
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Edit {patient.full_name}</h1>
      </div>
      <PatientForm
        mode="edit"
        patient={{
          id: patient.id,
          version: patient.version,
          fullName: patient.full_name,
          sex: patient.sex,
          dateOfBirth: patient.date_of_birth ?? "",
          phone: patient.phone ?? "",
          email: patient.email ?? "",
          address: patient.address ?? "",
          bloodGroup: patient.blood_group ?? "",
          notes: patient.notes ?? "",
        }}
      />
    </div>
  );
}
