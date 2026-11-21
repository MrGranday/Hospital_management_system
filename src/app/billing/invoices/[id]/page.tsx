import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { invoiceStatusLabel, paymentMethodLabel } from "@/lib/billing/schema";
import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";
import {
  AddInvoiceLineForm,
  RecordPaymentModal,
  VoidOrCreditInvoiceForm,
} from "./invoice-actions-forms";

export const dynamic = "force-dynamic";

function formatMoney(minor: number, currency: string = "AFN"): string {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "billing:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Invoice Details</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view billing records.
        </p>
      </div>
    );
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, invoice_no, status, subtotal_minor, tax_minor, total_minor, currency, issued_at, voided_at, void_reason, patient_id, version, created_at",
    )
    .eq("id", id)
    .eq("hospital_id", context.hospitalId)
    .maybeSingle();

  if (!invoice) notFound();

  // Patient
  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, mrn, phone, email")
    .eq("id", invoice.patient_id)
    .maybeSingle();

  // Invoice Lines
  const { data: lines } = await supabase
    .from("invoice_lines")
    .select("id, description, quantity, unit_price_minor, line_total_minor, created_at")
    .eq("invoice_id", invoice.id)
    .eq("hospital_id", context.hospitalId)
    .order("created_at", { ascending: true });

  // Payments
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount_minor, currency, payment_method, reference, created_at")
    .eq("invoice_id", invoice.id)
    .eq("hospital_id", context.hospitalId)
    .order("created_at", { ascending: false });

  // Credit notes
  const { data: creditNotes } = await supabase
    .from("credit_notes")
    .select("id, amount_minor, currency, reason, created_at")
    .eq("invoice_id", invoice.id)
    .eq("hospital_id", context.hospitalId)
    .order("created_at", { ascending: false });

  const canUpdate = hasPermission(context, "billing:update");
  const canCreate = hasPermission(context, "billing:create");
  const paidMinor = (payments ?? []).reduce((sum, p) => sum + p.amount_minor, 0);
  const balance = Math.max(0, invoice.total_minor - paidMinor);
  const isSettled = invoice.status === "paid" || invoice.status === "voided" || invoice.status === "credited";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/billing" className="text-xs text-muted-foreground hover:underline">
            ← Back to invoices
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold tracking-tight font-mono">{invoice.invoice_no}</h1>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                invoice.status === "paid"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : invoice.status === "partially_paid"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : invoice.status === "issued"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : invoice.status === "voided" || invoice.status === "credited"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {invoiceStatusLabel(invoice.status)}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Patient: <span className="font-medium text-foreground">{patient?.full_name ?? "Unknown"}</span> (MRN: {patient?.mrn ?? "—"}) · Issued: {formatTimestamp(invoice.issued_at || invoice.created_at)}
          </p>
        </div>

        {canUpdate && !isSettled ? (
          <div className="flex items-center gap-2">
            <RecordPaymentModal
              invoiceId={invoice.id}
              currency={invoice.currency}
              maxAmountMinor={balance}
            />
            <VoidOrCreditInvoiceForm
              invoiceId={invoice.id}
              version={invoice.version}
              currency={invoice.currency}
              totalMinor={invoice.total_minor}
            />
          </div>
        ) : null}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Subtotal</p>
          <p className="mt-1 text-xl font-bold">{formatMoney(invoice.subtotal_minor, invoice.currency)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Tax</p>
          <p className="mt-1 text-xl font-bold">{formatMoney(invoice.tax_minor, invoice.currency)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Invoiced</p>
          <p className="mt-1 text-xl font-bold">{formatMoney(invoice.total_minor, invoice.currency)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Balance Due</p>
          <p className={`mt-1 text-xl font-bold ${balance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            {formatMoney(balance, invoice.currency)}
          </p>
        </div>
      </div>

      {/* Line Items */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Line items</h2>
          {canCreate && !isSettled ? (
            <AddInvoiceLineForm invoiceId={invoice.id} />
          ) : null}
        </div>

        {!lines || lines.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No line items recorded on this invoice.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Description</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Qty</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Unit Price</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="px-4 py-3">{l.description}</td>
                    <td className="px-4 py-3 text-right">{l.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(l.unit_price_minor, invoice.currency)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMoney(l.line_total_minor, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payment History */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Payment history</h2>
        {!payments || payments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No payments received yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Date</th>
                  <th scope="col" className="px-4 py-2 font-medium">Method</th>
                  <th scope="col" className="px-4 py-2 font-medium">Reference</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">{formatTimestamp(p.created_at)}</td>
                    <td className="px-4 py-3">{paymentMethodLabel(p.payment_method)}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.reference || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">
                      {formatMoney(p.amount_minor, p.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Credit notes if any */}
      {creditNotes && creditNotes.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold">Credit notes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Date</th>
                  <th scope="col" className="px-4 py-2 font-medium">Reason</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Credit Amount</th>
                </tr>
              </thead>
              <tbody>
                {creditNotes.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">{formatTimestamp(c.created_at)}</td>
                    <td className="px-4 py-3">{c.reason}</td>
                    <td className="px-4 py-3 text-right font-medium text-rose-600">
                      {formatMoney(c.amount_minor, c.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
