import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { AddServiceModal } from "./service-form";

export const dynamic = "force-dynamic";

function formatMoney(minor: number, currency: string = "AFN"): string {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

export default async function BillingServicesPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "billing:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Services Catalog</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view services.
        </p>
      </div>
    );
  }

  const canCreate = hasPermission(context, "billing:create");
  const supabase = await createSupabaseServerClient();

  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .eq("hospital_id", context.hospitalId)
    .is("deleted_at", null)
    .order("code", { ascending: true });

  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Service and Price Catalog</h2>
          <p className="text-xs text-muted-foreground">
            Standard pricing for consultations, procedures, and tests.
          </p>
        </div>
        {canCreate ? <AddServiceModal /> : null}
      </div>

      {!services || services.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No services configured yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Code</th>
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Department</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Price</th>
                <th scope="col" className="px-4 py-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-medium">{s.code}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.name}</div>
                    {s.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1">{s.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.department || "General"}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatMoney(s.unit_price_minor, s.currency)}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        s.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
