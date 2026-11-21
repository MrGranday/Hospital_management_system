import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

function formatMoney(minor: number, currency: string = "AFN"): string {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

export default async function ReportsPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  const supabase = await createSupabaseServerClient();
  const hospitalId = context.hospitalId;

  // 1. Invoices & Revenue metrics
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, status, total_minor, currency")
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null);

  const totalInvoiced = (invoices ?? []).reduce((sum, inv) => sum + inv.total_minor, 0);

  // 2. Payments collected
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount_minor, payment_method, created_at")
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null);

  const totalCollected = (payments ?? []).reduce((sum, p) => sum + p.amount_minor, 0);
  const outstandingReceivables = Math.max(0, totalInvoiced - totalCollected);

  // 3. OPD Visits census
  const { count: visitsCount } = await supabase
    .from("visits")
    .select("id", { count: "exact", head: true })
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null);

  // 4. Total registered patients
  const { count: patientsCount } = await supabase
    .from("patients")
    .select("id", { count: "exact", head: true })
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null);

  // 5. Total inventory items & batches
  const { count: itemsCount } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null);

  // 6. Top diagnoses
  const { data: diagnoses } = await supabase
    .from("diagnoses")
    .select("icd_code, description")
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .limit(100);

  const diagCountMap = new Map<string, { code: string; desc: string; count: number }>();
  for (const d of diagnoses ?? []) {
    const existing = diagCountMap.get(d.icd_code);
    if (existing) {
      existing.count += 1;
    } else {
      diagCountMap.set(d.icd_code, { code: d.icd_code, desc: d.description, count: 1 });
    }
  }

  const topDiagnoses = [...diagCountMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Total Invoiced Volume</p>
          <p className="mt-1 text-2xl font-bold font-mono text-foreground">{formatMoney(totalInvoiced)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Across all issued billing records</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Total Cash Collected</p>
          <p className="mt-1 text-2xl font-bold font-mono text-emerald-600">{formatMoney(totalCollected)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{payments?.length ?? 0} total payments processed</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Outstanding Receivables</p>
          <p className="mt-1 text-2xl font-bold font-mono text-amber-600">{formatMoney(outstandingReceivables)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Pending collection / unpaid balances</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">OPD Census &amp; Patients</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {visitsCount ?? 0} <span className="text-sm font-normal text-muted-foreground">visits</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">{patientsCount ?? 0} active patient charts</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Diagnoses Table */}
        <section className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold">Top Clinical Diagnoses (Morbidity Census)</h2>
          {topDiagnoses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No diagnosis records available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">ICD-10</th>
                    <th scope="col" className="px-3 py-2 font-medium">Diagnosis Description</th>
                    <th scope="col" className="px-3 py-2 font-medium text-right">Encounters</th>
                  </tr>
                </thead>
                <tbody>
                  {topDiagnoses.map((d) => (
                    <tr key={d.code} className="border-t border-border">
                      <td className="px-3 py-2.5 font-mono text-xs font-semibold text-primary">{d.code}</td>
                      <td className="px-3 py-2.5">{d.desc}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Quick Links & Export Directory */}
        <section className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold">Hospital Report Index</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-muted/30">
              <div>
                <p className="text-sm font-medium">Daily Cash Collections &amp; Ledger</p>
                <p className="text-xs text-muted-foreground">Cashier breakdown by payment method and receipt log.</p>
              </div>
              <Link href="/finance" className="text-xs text-primary font-medium hover:underline">
                View Ledger →
              </Link>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-muted/30">
              <div>
                <p className="text-sm font-medium">Pharmacy &amp; Stock On Hand Valuation</p>
                <p className="text-xs text-muted-foreground">Active batches, expiration warnings, and stock ledger.</p>
              </div>
              <Link href="/inventory" className="text-xs text-primary font-medium hover:underline">
                View Stock →
              </Link>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-muted/30">
              <div>
                <p className="text-sm font-medium">Hospital Audit Trail &amp; Access Log</p>
                <p className="text-xs text-muted-foreground">Database level append-only compliance audit trail.</p>
              </div>
              <Link href="/audit" className="text-xs text-primary font-medium hover:underline">
                View Audit →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
