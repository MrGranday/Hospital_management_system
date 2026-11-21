import Link from "next/link";
import { redirect } from "next/navigation";

import {
  BILLING_PAGE_SIZE,
  INVOICE_STATUS_VALUES,
  invoiceStatusLabel,
} from "@/lib/billing/schema";
import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    dateStyle: "medium",
  });
}

function formatMoney(minor: number, currency: string = "AFN"): string {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

export default async function BillingInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  const hospitalId = context.hospitalId;

  if (!hasPermission(context, "billing:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Invoices</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view invoices.
        </p>
      </div>
    );
  }

  const raw = await searchParams;
  const page = Math.max(1, Array.isArray(raw.page) ? Number(raw.page[0]) : Number(raw.page || 1));
  const status = Array.isArray(raw.status) ? raw.status[0] : raw.status;
  const offset = (page - 1) * BILLING_PAGE_SIZE;

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("invoices")
    .select(
      "id, patient_id, invoice_no, status, subtotal_minor, tax_minor, total_minor, currency, issued_at, created_at, version",
      { count: "exact" },
    )
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + BILLING_PAGE_SIZE - 1);

  if (status && INVOICE_STATUS_VALUES.includes(status as (typeof INVOICE_STATUS_VALUES)[number])) {
    query = query.eq("status", status);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const invoices = data ?? [];

  // Fetch patient names
  const patientIds = [...new Set(invoices.map((inv) => inv.patient_id))];
  const { data: patients } = patientIds.length > 0
    ? await supabase
        .from("patients")
        .select("id, full_name, mrn")
        .in("id", patientIds)
    : { data: [] };

  const patientMap = new Map(
    patients?.map((p) => [p.id, { full_name: p.full_name, mrn: p.mrn }]) ?? [],
  );

  // Fetch payments for these invoices
  const invoiceIds = invoices.map((inv) => inv.id);
  const { data: payments } = invoiceIds.length > 0
    ? await supabase
        .from("payments")
        .select("invoice_id, amount_minor")
        .eq("hospital_id", hospitalId)
        .in("invoice_id", invoiceIds)
    : { data: [] };

  const paidMap = new Map<string, number>();
  for (const p of payments ?? []) {
    paidMap.set(p.invoice_id, (paidMap.get(p.invoice_id) ?? 0) + p.amount_minor);
  }

  // Compute summary metrics
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.total_minor, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (paidMap.get(inv.id) ?? 0), 0);
  const totalDue = Math.max(0, totalBilled - totalPaid);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Invoiced (Page)</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(totalBilled)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Collected</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{formatMoney(totalPaid)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Outstanding Balance</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{formatMoney(totalDue)}</p>
        </div>
      </div>

      {/* Filters */}
      <form method="get" action="/billing" className="flex flex-wrap gap-2">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All invoice statuses</option>
          {INVOICE_STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {invoiceStatusLabel(s)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          Filter
        </button>
      </form>

      {/* Invoices Table */}
      {invoices.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No invoices found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Invoice #</th>
                <th scope="col" className="px-4 py-3 font-medium">Patient</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Total</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Paid</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Balance</th>
                <th scope="col" className="px-4 py-3 font-medium">Date</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const patient = patientMap.get(inv.patient_id);
                const paidMinor = paidMap.get(inv.id) ?? 0;
                const balance = Math.max(0, inv.total_minor - paidMinor);
                return (
                  <tr key={inv.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono font-medium">
                      <Link href={`/billing/${inv.id}`} className="hover:underline">
                        {inv.invoice_no}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>{patient?.full_name ?? "Unknown"}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {patient?.mrn}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          inv.status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : inv.status === "partially_paid"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : inv.status === "issued"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : inv.status === "voided" || inv.status === "credited"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {invoiceStatusLabel(inv.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatMoney(inv.total_minor, inv.currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      {formatMoney(paidMinor, inv.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {balance > 0 ? (
                        <span className="text-amber-600">{formatMoney(balance, inv.currency)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatTimestamp(inv.issued_at || inv.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/billing/${inv.id}`}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {count && count > BILLING_PAGE_SIZE ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Total: {count} invoices</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/billing?page=${page - 1}${status ? `&status=${status}` : ""}`}
                className="inline-flex h-8 items-center rounded-md border border-input px-3 hover:bg-accent"
              >
                Previous
              </Link>
            )}
            {offset + BILLING_PAGE_SIZE < count && (
              <Link
                href={`/billing?page=${page + 1}${status ? `&status=${status}` : ""}`}
                className="inline-flex h-8 items-center rounded-md border border-input px-3 hover:bg-accent"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
