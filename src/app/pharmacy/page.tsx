import Link from "next/link";
import { redirect } from "next/navigation";

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

export default async function PharmacyQueuePage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "pharmacy:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Pharmacy Queue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view pharmacy queue.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();

  // Fetch active / pending prescriptions
  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select("id, patient_id, visit_id, provider_id, status, valid_until, notes, created_at")
    .eq("hospital_id", context.hospitalId)
    .in("status", ["active", "draft"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const rxList = prescriptions ?? [];
  const patientIds = [...new Set(rxList.map((r) => r.patient_id))];
  const providerIds = [...new Set(rxList.map((r) => r.provider_id))];
  const rxIds = rxList.map((r) => r.id);

  // Fetch patient details
  const { data: patients } = patientIds.length > 0
    ? await supabase
        .from("patients")
        .select("id, full_name, mrn")
        .in("id", patientIds)
    : { data: [] };

  const patientMap = new Map(patients?.map((p) => [p.id, p]) ?? []);

  // Fetch provider details
  const { data: providers } = providerIds.length > 0
    ? await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", providerIds)
    : { data: [] };

  const providerMap = new Map(providers?.map((pr) => [pr.user_id, pr.full_name]) ?? []);

  // Fetch items count per prescription
  const { data: items } = rxIds.length > 0
    ? await supabase
        .from("prescription_items")
        .select("id, prescription_id, medication_name, quantity")
        .in("prescription_id", rxIds)
    : { data: [] };

  const itemCountMap = new Map<string, number>();
  for (const it of items ?? []) {
    itemCountMap.set(it.prescription_id, (itemCountMap.get(it.prescription_id) ?? 0) + 1);
  }

  const canCreate = hasPermission(context, "pharmacy:create");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Pending Prescriptions Queue</h2>
          <p className="text-xs text-muted-foreground">
            Prescriptions waiting for verification and medication dispensing.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {rxList.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="text-base font-medium">No pending prescriptions</p>
            <p className="text-xs mt-1">All doctor orders have been fulfilled or none are currently queued.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Order Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Patient</th>
                  <th scope="col" className="px-4 py-3 font-medium">Prescriber</th>
                  <th scope="col" className="px-4 py-3 font-medium text-center">Items</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rxList.map((rx) => {
                  const patient = patientMap.get(rx.patient_id);
                  const providerName = providerMap.get(rx.provider_id) ?? "Medical Officer";
                  const count = itemCountMap.get(rx.id) ?? 0;

                  return (
                    <tr key={rx.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {formatTimestamp(rx.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{patient?.full_name ?? "Unknown"}</div>
                        <div className="text-xs text-muted-foreground font-mono">{patient?.mrn}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{providerName}</td>
                      <td className="px-4 py-3 text-center font-mono font-medium">{count}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                          {rx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/prescriptions/${rx.id}`}
                            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
                          >
                            Details
                          </Link>
                          {canCreate ? (
                            <Link
                              href={`/pharmacy/dispense/${rx.id}`}
                              className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                            >
                              Dispense
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
