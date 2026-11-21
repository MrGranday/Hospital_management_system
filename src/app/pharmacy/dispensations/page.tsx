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

export default async function DispensationsLogPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "pharmacy:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Dispensations</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view dispensations.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: dispensations } = await supabase
    .from("dispensations")
    .select("id, prescription_id, prescription_item_id, stock_movement_id, dispensed_at, dispensed_by, notes")
    .eq("hospital_id", context.hospitalId)
    .order("dispensed_at", { ascending: false })
    .limit(50);

  const dispList = dispensations ?? [];
  const rxItemIds = dispList.map((d) => d.prescription_item_id);
  const dispenserIds = [...new Set(dispList.map((d) => d.dispensed_by))];

  // Fetch items info
  const { data: rxItems } = rxItemIds.length > 0
    ? await supabase
        .from("prescription_items")
        .select("id, medication_name, dosage, quantity")
        .in("id", rxItemIds)
    : { data: [] };

  const rxItemMap = new Map(rxItems?.map((i) => [i.id, i]) ?? []);

  // Fetch dispenser names
  const { data: dispensers } = dispenserIds.length > 0
    ? await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", dispenserIds)
    : { data: [] };

  const dispenserMap = new Map(dispensers?.map((d) => [d.user_id, d.full_name]) ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Medication Dispensation Audit Log</h2>
        <p className="text-xs text-muted-foreground">
          Real-time record of all dispensed prescription items, pharmacists, and stock deductions.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {dispList.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No dispensations recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Dispensed At</th>
                  <th scope="col" className="px-4 py-3 font-medium">Medication</th>
                  <th scope="col" className="px-4 py-3 font-medium">Dosage</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Qty</th>
                  <th scope="col" className="px-4 py-3 font-medium">Dispensed By</th>
                  <th scope="col" className="px-4 py-3 font-medium">Notes</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Prescription</th>
                </tr>
              </thead>
              <tbody>
                {dispList.map((d) => {
                  const item = rxItemMap.get(d.prescription_item_id);
                  const dispenser = dispenserMap.get(d.dispensed_by) ?? "Pharmacist";

                  return (
                    <tr key={d.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {formatTimestamp(d.dispensed_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {item?.medication_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item?.dosage ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">
                        {item?.quantity ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{dispenser}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{d.notes || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/prescriptions/${d.prescription_id}`}
                          className="text-xs text-primary hover:underline font-mono"
                        >
                          View Rx
                        </Link>
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
