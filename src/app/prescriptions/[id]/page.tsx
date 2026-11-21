import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: prescription } = await supabase
    .from("prescriptions")
    .select("id, patient_id, visit_id, provider_id, status, valid_until, notes, created_at, version")
    .eq("id", id)
    .eq("hospital_id", context.hospitalId)
    .maybeSingle();

  if (!prescription) notFound();

  // Patient
  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, mrn, date_of_birth")
    .eq("id", prescription.patient_id)
    .maybeSingle();

  // Provider
  const { data: provider } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .eq("user_id", prescription.provider_id)
    .maybeSingle();

  // Items
  const { data: items } = await supabase
    .from("prescription_items")
    .select("id, medication_name, dosage, frequency, duration, quantity, refills, instructions")
    .eq("prescription_id", prescription.id);

  const canDispense = hasPermission(context, "pharmacy:create");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/pharmacy" className="text-xs text-muted-foreground hover:underline">
          ← Back to pharmacy
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Prescription Details</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ordered {formatTimestamp(prescription.created_at)} by {provider?.full_name ?? "Medical Officer"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200 capitalize">
              {prescription.status}
            </span>
            {canDispense ? (
              <Link
                href={`/pharmacy/dispense/${prescription.id}`}
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Fulfill / Dispense
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Patient demographics */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold">Patient Information</h2>
        <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Full Name</dt>
            <dd className="mt-0.5 font-medium">
              <Link href={`/patients/${patient?.id}`} className="hover:underline text-primary">
                {patient?.full_name ?? "—"}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">MRN</dt>
            <dd className="mt-0.5 font-mono">{patient?.mrn ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Prescription ID</dt>
            <dd className="mt-0.5 font-mono text-xs">{prescription.id}</dd>
          </div>
        </dl>
      </section>

      {/* Prescription items */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Medications</h2>
        {(!items || items.length === 0) ? (
          <p className="text-sm text-muted-foreground">No medication items on this prescription.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Medication</th>
                  <th scope="col" className="px-4 py-2 font-medium">Dosage</th>
                  <th scope="col" className="px-4 py-2 font-medium">Frequency</th>
                  <th scope="col" className="px-4 py-2 font-medium">Duration</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Quantity</th>
                  <th scope="col" className="px-4 py-2 font-medium">Instructions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{it.medication_name}</td>
                    <td className="px-4 py-3">{it.dosage}</td>
                    <td className="px-4 py-3">{it.frequency}</td>
                    <td className="px-4 py-3">{it.duration}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{it.quantity}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{it.instructions || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
