"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  Plus,
  Download,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Printer,
  DollarSign,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColorAvatar, KpiCard, StatusPill } from "@/components/shared/ui-bits";
import { useAppStore } from "@/store/app-store";
import { printInvoice, exportToCsv } from "@/lib/print";
import { formatMoney, minorUnitsPerMajor } from "@/lib/money";
import type { InvoiceStatus, InvoiceUi } from "@/features/billing/billing-types";
import { listInvoicesForUi, voidInvoiceForUi } from "@/features/billing/ui-actions";

const STATUS_INFO: Record<
  InvoiceStatus,
  { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string }
> = {
  paid: { status: "success", label: "Paid" },
  partial: { status: "warning", label: "Partial" },
  unpaid: { status: "danger", label: "Unpaid" },
  overdue: { status: "danger", label: "Overdue" },
  voided: { status: "neutral", label: "Voided" },
  draft: { status: "info", label: "Draft" },
  credited: { status: "info", label: "Credited" },
};

const fmtDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return d;
  }
};

export default function Billing() {
  const { openModal, pushToast, logActivity, billingVersion, bumpBillingVersion } = useAppStore();
  const [invoices, setInvoices] = useState<InvoiceUi[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canPrint, setCanPrint] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    listInvoicesForUi()
      .then((result) => {
        if (!active) return;
        if (result.ok) {
          setInvoices(result.invoices);
          setCanCreate(result.canCreate);
          setCanUpdate(result.canUpdate);
          setCanPrint(result.canPrint);
          setError(null);
        } else {
          setInvoices([]);
          setError(result.error);
        }
      })
      .catch(() => {
        if (!active) return;
        setInvoices([]);
        setError("Could not load invoices. Try again.");
      });

    return () => {
      active = false;
    };
  }, [billingVersion]);

  const loading = invoices === null;
  const allInvoices = useMemo(() => invoices ?? [], [invoices]);
  const currency = allInvoices[0]?.currency ?? "AFN";

  const filtered = useMemo(() => {
    return allInvoices.filter((inv) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        inv.patientName.toLowerCase().includes(q) ||
        inv.number.toLowerCase().includes(q) ||
        inv.mrn.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allInvoices, search, statusFilter]);

  const stats = useMemo(() => {
    const total = allInvoices.reduce((sum, inv) => sum + inv.totalMinor, 0);
    const collected = allInvoices.reduce((sum, inv) => sum + inv.paidMinor, 0);
    const outstanding = allInvoices.reduce((sum, inv) => sum + inv.balanceMinor, 0);
    const overdue = allInvoices
      .filter((inv) => inv.status === "overdue")
      .reduce((sum, inv) => sum + inv.balanceMinor, 0);
    return { total, collected, outstanding, overdue };
  }, [allInvoices]);

  const selectedInvoice = useMemo(
    () => allInvoices.find((inv) => inv.id === selectedInvoiceId) ?? null,
    [allInvoices, selectedInvoiceId],
  );

  const handleExport = () => {
    if (filtered.length === 0) {
      pushToast({ title: "No invoices to export", variant: "warning" });
      return;
    }
    const rows = filtered.map((inv) => {
      const factor = minorUnitsPerMajor(inv.currency);
      return {
        Number: inv.number,
        Patient: inv.patientName,
        MRN: inv.mrn,
        Date: inv.issuedAt ?? inv.createdAt,
        Amount: inv.totalMinor / factor,
        Paid: inv.paidMinor / factor,
        Balance: inv.balanceMinor / factor,
        Status: inv.status,
      };
    });
    exportToCsv(`medicore-invoices-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    logActivity({ action: "Exported invoices", category: "billing", details: `${rows.length} invoices → CSV` });
    pushToast({ title: "Export complete", description: `${rows.length} invoices downloaded as CSV`, variant: "success" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">Billing & Invoicing</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">Track invoices, payments, and outstanding balances</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={handleExport} disabled={loading}>
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700" onClick={() => openModal("newInvoice")} disabled={!canCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Billed" value={stats.total} format={(v) => formatMoney({ amountMinor: Math.round(v), currency })} icon={Receipt} accent="brand" delta={`${allInvoices.length} invoices`} deltaType="up" delay={0} />
        <KpiCard label="Collected" value={stats.collected} format={(v) => formatMoney({ amountMinor: Math.round(v), currency })} icon={CheckCircle2} accent="emerald" delta={`${stats.total > 0 ? Math.round((stats.collected / stats.total) * 100) : 0}%`} deltaType="up" delay={0.05} />
        <KpiCard label="Outstanding" value={stats.outstanding} format={(v) => formatMoney({ amountMinor: Math.round(v), currency })} icon={Clock} accent="amber" delay={0.1} />
        <KpiCard label="Overdue" value={stats.overdue} format={(v) => formatMoney({ amountMinor: Math.round(v), currency })} icon={AlertTriangle} accent="rose" delta={`${allInvoices.filter((inv) => inv.status === "overdue").length} invoices`} deltaType="down" delay={0.15} />
      </div>

      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg overflow-x-auto">
            {["all", "paid", "partial", "unpaid", "overdue"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap capitalize ${
                  statusFilter === s ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent/30 border-b border-border">
              <tr>
                <Th>Invoice #</Th>
                <Th>Patient</Th>
                <Th>Service</Th>
                <Th>Date</Th>
                <Th>Amount</Th>
                <Th>Paid</Th>
                <Th>Balance</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Loading invoices.
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <p className="text-sm font-medium text-foreground">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setError(null);
                        setInvoices(null);
                        bumpBillingVersion();
                      }}
                    >
                      Retry
                    </Button>
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No invoices match your filters.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                filtered.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.4) }}
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedInvoiceId(inv.id)}
                  >
                    <Td>
                      <span className="text-xs font-mono font-medium text-brand-600">{inv.number}</span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <ColorAvatar name={inv.patientName} color="oklch(0.62 0.14 200)" size="sm" />
                        <div>
                          <p className="text-sm font-medium">{inv.patientName}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{inv.mrn}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="text-sm text-muted-foreground">
                        {inv.items[0]?.description ?? "Billing"}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-xs text-muted-foreground">{fmtDate(inv.issuedAt ?? inv.createdAt)}</span>
                    </Td>
                    <Td>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatMoney({ amountMinor: inv.totalMinor, currency: inv.currency })}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-sm tabular-nums text-emerald-600">
                        {formatMoney({ amountMinor: inv.paidMinor, currency: inv.currency })}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {formatMoney({ amountMinor: inv.balanceMinor, currency: inv.currency })}
                      </span>
                    </Td>
                    <Td>
                      <StatusPill status={STATUS_INFO[inv.status].status}>{STATUS_INFO[inv.status].label}</StatusPill>
                    </Td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      <InvoiceDetailDrawer
        invoice={selectedInvoice}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canPrint={canPrint}
        onClose={() => setSelectedInvoiceId(null)}
        onChanged={bumpBillingVersion}
      />
    </div>
  );
}

function InvoiceDetailDrawer({
  invoice,
  canCreate,
  canUpdate,
  canPrint,
  onClose,
  onChanged,
}: {
  invoice: InvoiceUi | null;
  canCreate: boolean;
  canUpdate: boolean;
  canPrint: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  return (
    <AnimatePresence>
      {invoice && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-background shadow-premium overflow-y-auto"
          >
            <InvoiceDetail
              invoice={invoice}
              canCreate={canCreate}
              canUpdate={canUpdate}
              canPrint={canPrint}
              onClose={onClose}
              onChanged={onChanged}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function InvoiceDetail({
  invoice,
  canCreate,
  canUpdate,
  canPrint,
  onClose,
  onChanged,
}: {
  invoice: InvoiceUi;
  canCreate: boolean;
  canUpdate: boolean;
  canPrint: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { openModal, pushToast, logActivity } = useAppStore();
  const [busy, setBusy] = useState(false);
  const status = STATUS_INFO[invoice.status];
  const factor = minorUnitsPerMajor(invoice.currency);
  const canCollect = canCreate && invoice.balanceMinor > 0 && invoice.status !== "voided";

  const handlePrint = () => {
    printInvoice({
      number: invoice.number,
      patientName: invoice.patientName,
      mrn: invoice.mrn,
      date: invoice.issuedAt ?? invoice.createdAt,
      department: invoice.items[0]?.description ?? "Billing",
      items: invoice.items.map((item) => ({
        description: item.description,
        qty: item.quantity,
        rate: item.unitPriceMinor / factor,
        total: item.lineTotalMinor / factor,
      })),
      amount: invoice.totalMinor / factor,
      paid: invoice.paidMinor / factor,
    });
    logActivity({ action: "Printed invoice", category: "billing", details: invoice.number });
  };

  const handleCollect = () => {
    if (!canCollect) return;
    openModal("collectPayment", { invoice, canCreate });
  };

  const handleVoid = async () => {
    if (busy || !canUpdate) return;
    if (!confirm(`Void invoice ${invoice.number}? This cannot be undone.`)) return;

    setBusy(true);
    const result = await voidInvoiceForUi({ invoiceId: invoice.id, reason: "Voided from billing" });
    setBusy(false);

    if (!result.ok) {
      pushToast({ title: "Could not void the invoice", description: result.error, variant: "danger" });
      return;
    }

    logActivity({ action: "Voided invoice", category: "billing", details: invoice.number });
    pushToast({ title: "Invoice voided", description: invoice.number, variant: "info" });
    onChanged();
    onClose();
  };

  return (
    <div>
      <div className="p-5 bg-gradient-to-br from-brand-700 to-brand-900 text-white relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 text-xs text-brand-200 mb-2">
          <Receipt className="h-3.5 w-3.5" />
          <span className="font-mono">{invoice.number}</span>
        </div>
        <h2 className="text-2xl font-bold">{formatMoney({ amountMinor: invoice.totalMinor, currency: invoice.currency })}</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs bg-white/15 px-2 py-0.5 rounded-md font-medium">{status.label}</span>
          <span className="text-xs text-brand-200">{invoice.items[0]?.description ?? "Billing"}</span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border">
          <ColorAvatar name={invoice.patientName} color="oklch(0.62 0.14 200)" />
          <div>
            <p className="font-medium text-foreground">{invoice.patientName}</p>
            <p className="text-xs text-muted-foreground font-mono">{invoice.mrn}</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2.5">Line Items</p>
          <div className="space-y-1.5">
            {invoice.items.length === 0 && (
              <p className="text-sm text-muted-foreground">No line items have been recorded for this invoice.</p>
            )}
            {invoice.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/60">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatMoney({ amountMinor: item.unitPriceMinor, currency: invoice.currency })} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {formatMoney({ amountMinor: item.lineTotalMinor, currency: invoice.currency })}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-accent/30 border border-border space-y-2">
          <Row label="Subtotal" value={formatMoney({ amountMinor: invoice.subtotalMinor, currency: invoice.currency })} />
          {invoice.taxMinor > 0 && (
            <Row label="Tax" value={formatMoney({ amountMinor: invoice.taxMinor, currency: invoice.currency })} />
          )}
          <Row label="Already Paid" value={formatMoney({ amountMinor: invoice.paidMinor, currency: invoice.currency })} tone="emerald" />
          {invoice.creditMinor > 0 && (
            <Row label="Credits" value={formatMoney({ amountMinor: invoice.creditMinor, currency: invoice.currency })} tone="emerald" />
          )}
          <div className="h-px bg-border my-2" />
          <Row label="Balance Due" value={formatMoney({ amountMinor: invoice.balanceMinor, currency: invoice.currency })} tone="rose" big />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-10" onClick={handlePrint} disabled={!canPrint || busy}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button size="sm" className="h-10 bg-emerald-600 hover:bg-emerald-700" disabled={!canCollect || busy} onClick={handleCollect}>
            <DollarSign className="h-4 w-4 mr-1" />
            Collect
          </Button>
        </div>

        {invoice.balanceMinor <= 0 && invoice.status !== "voided" && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            This invoice has been fully paid.
          </div>
        )}

        {invoice.status === "voided" && (
          <div className="p-3 rounded-lg bg-muted border border-border text-xs text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            This invoice has been voided.
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
          onClick={() => void handleVoid()}
          disabled={!canUpdate || busy || invoice.status === "voided" || invoice.status === "paid"}
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          {busy ? "Voiding..." : "Void Invoice"}
        </Button>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}

function Row({ label, value, tone, big }: { label: string; value: string; tone?: "emerald" | "rose"; big?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${big ? "text-sm font-semibold" : "text-xs"} text-muted-foreground`}>{label}</span>
      <span className={`${big ? "text-lg font-bold" : "text-sm font-medium"} tabular-nums ${
        tone === "emerald" ? "text-emerald-600" : tone === "rose" ? "text-rose-600" : "text-foreground"
      }`}>{value}</span>
    </div>
  );
}
