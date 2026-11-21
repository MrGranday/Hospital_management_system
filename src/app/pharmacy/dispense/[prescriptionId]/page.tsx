import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

import { DispenseItemForm } from "./dispense-form";

export const dynamic = "force-dynamic";

export default async function DispensePrescriptionPage({
  params,
}: {
  params: Promise<{ prescriptionId: string }>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "pharmacy:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Dispense</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to dispense prescriptions.
        </p>
      </div>
    );
  }

  const { prescriptionId } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch prescription
  const { data: prescription } = await supabase
    .from("prescriptions")
    .select("id, patient_id, visit_id, provider_id, status, notes, created_at")
    .eq("id", prescriptionId)
    .eq("hospital_id", context.hospitalId)
    .maybeSingle();

  if (!prescription) notFound();

  // Fetch patient
  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, mrn, date_of_birth, blood_group")
    .eq("id", prescription.patient_id)
    .maybeSingle();

  // Fetch prescription items
  const { data: items } = await supabase
    .from("prescription_items")
    .select("id, medication_name, dosage, frequency, duration, quantity, refills, instructions")
    .eq("prescription_id", prescription.id)
    .order("medication_name", { ascending: true });

  // Fetch already dispensed records
  const { data: dispensations } = await supabase
    .from("dispensations")
    .select("id, prescription_item_id, dispensed_at")
    .eq("prescription_id", prescription.id);

  const dispensedItemIds = new Set(dispensations?.map((d) => d.prescription_item_id) ?? []);

  // Fetch available inventory items and batches to fulfill
  const { data: catalogItems } = await supabase
    .from("items")
    .select("id, name, sku, unit")
    .eq("hospital_id", context.hospitalId)
    .eq("is_active", true)
    .is("deleted_at", null);

  const { data: batches } = await supabase
    .from("item_batches")
    .select("id, item_id, batch_no, expiry_date")
    .eq("hospital_id", context.hospitalId)
    .is("deleted_at", null)
    .order("expiry_date", { ascending: true });

  const { data: locations } = await supabase
    .from("stock_locations")
    .select("id, name")
    .eq("hospital_id", context.hospitalId)
    .eq("is_active", true)
    .is("deleted_at", null);

  const canDispense = hasPermission(context, "pharmacy:create");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/pharmacy" className="text-xs text-muted-foreground hover:underline">
          ← Back to pharmacy queue
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Dispense for {patient?.full_name ?? "Patient"}
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              MRN: {patient?.mrn} · Rx ID: {prescription.id}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200 capitalize">
            {prescription.status}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold">Prescribed Items</h2>
        {(!items || items.length === 0) ? (
          <p className="text-sm text-muted-foreground">No medication items on this prescription.</p>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => {
              const isDispensed = dispensedItemIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`rounded-lg border p-5 bg-card transition-all ${
                    isDispensed ? "border-emerald-200 bg-emerald-50/20" : "border-border"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-base">
                          {item.medication_name}
                        </h3>
                        {isDispensed ? (
                          <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-100 text-emerald-800 font-medium">
                            ✓ Dispensed
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dosage: <span className="font-medium text-foreground">{item.dosage}</span> ·
                        Frequency: <span className="font-medium text-foreground">{item.frequency}</span> ·
                        Duration: <span className="font-medium text-foreground">{item.duration}</span>
                      </p>
                      {item.instructions ? (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          &quot;{item.instructions}&quot;
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">Prescribed Quantity</span>
                      <span className="text-lg font-bold font-mono">{item.quantity}</span>
                    </div>
                  </div>

                  {!isDispensed && canDispense ? (
                    <div className="mt-4 pt-4 border-t border-border">
                      <DispenseItemForm
                        prescriptionId={prescription.id}
                        prescriptionItemId={item.id}
                        medicationName={item.medication_name}
                        prescribedQuantity={item.quantity ?? 1}
                        catalogItems={catalogItems ?? []}
                        batches={batches ?? []}
                        locations={locations ?? []}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
