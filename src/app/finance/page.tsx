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

function formatMoney(minor: number, currency: string = "AFN"): string {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

export default async function FinancePage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "billing:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Finance</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view finance records.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const hospitalId = context.hospitalId;

  // Payments ledger (append-only collections)
  const { data: payments } = await supabase
    .from("payments")
    .select("id, invoice_id, amount_minor, currency, payment_method, reference, created_at, created_by")
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  const paymentList = payments ?? [];
  const invoiceIds = [...new Set(paymentList.map((p) => p.invoice_id))];

  // Fetch invoice numbers
  const { data: invoices } = invoiceIds.length > 0
    ? await supabase
        .from("invoices")
        .select("id, invoice_no, patient_id")
        .in("id", invoiceIds)
    : { data: [] };

  const invoiceMap = new Map(invoices?.map((i) => [i.id, i]) ?? []);

  // Summary by payment method
  const methodMap = new Map<string, number>();
  let totalCollected = 0;
  for (const p of paymentList) {
    totalCollected += p.amount_minor;
    methodMap.set(p.payment_method, (methodMap.get(p.payment_method) ?? 0) + p.amount_minor);
  }

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Cash Collected</p>
          <p className="mt-1 text-2xl font-bold font-mono text-emerald-600">
            {formatMoney(totalCollected)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">From {paymentList.length} receipt transactions</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Cash Payments</p>
          <p className="mt-1 text-2xl font-bold font-mono text-foreground">
            {formatMoney(methodMap.get("cash") ?? 0)}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Card &amp; Bank Transfers</p>
          <p className="mt-1 text-2xl font-bold font-mono text-foreground">
            {formatMoney((methodMap.get("card") ?? 0) + (methodMap.get("bank_transfer") ?? 0))}
          </p>
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Payment Receipts Ledger</h2>
            <p className="text-xs text-muted-foreground">Append-only chronological audit ledger of all funds received.</p>
          </div>
        </div>

        {paymentList.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No payment records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Receipt Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Invoice No</th>
                  <th scope="col" className="px-4 py-3 font-medium">Payment Method</th>
                  <th scope="col" className="px-4 py-3 font-medium">Reference</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {paymentList.map((p) => {
                  const inv = invoiceMap.get(p.invoice_id);
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {formatTimestamp(p.created_at)}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium">
                        {inv ? (
                          <Link href={`/billing/${inv.id}`} className="hover:underline text-primary">
                            {inv.invoice_no}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize">{p.payment_method.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.reference || "—"}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        {formatMoney(p.amount_minor, p.currency)}
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
