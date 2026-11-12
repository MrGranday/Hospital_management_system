"use client";

import { useState, useMemo } from "react";
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
  Send,
  DollarSign,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { INVOICES, type Invoice } from "@/lib/data";
import { ColorAvatar, KpiCard, StatusPill } from "@/components/shell/ui-bits";
import { useAppStore, type LiveInvoice } from "@/store/app-store";
import { printInvoice, exportToCsv } from "@/lib/print";

type UnifiedInvoice = Invoice | LiveInvoice;

const STATUS_INFO: Record<string, { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  paid: { status: "success", label: "Paid" },
  partial: { status: "warning", label: "Partial" },
  unpaid: { status: "danger", label: "Unpaid" },
  overdue: { status: "danger", label: "Overdue" },
};

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return d; }
};

export default function Billing() {
  const { openModal, pushToast, logActivity, liveInvoices, cancelInvoice } = useAppStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<UnifiedInvoice | null>(null);

  // Merge live + static (live first so newest appears on top)
  const allInvoices: UnifiedInvoice[] = useMemo(() => [...liveInvoices, ...INVOICES], [liveInvoices]);

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
    const total = allInvoices.reduce((s, i) => s + i.amount, 0);
    const collected = allInvoices.reduce((s, i) => s + i.paid, 0);
    const outstanding = total - collected;
    const overdue = allInvoices.filter((i) => i.status === "overdue").reduce((s, i) => s + (i.amount - i.paid), 0);
    return { total, collected, outstanding, overdue };
  }, [allInvoices]);

  const handleExport = () => {
    if (filtered.length === 0) { pushToast({ title: "No invoices to export", variant: "warning" }); return; }
    const rows = filtered.map((inv) => ({
      Number: inv.number,
      Patient: inv.patientName,
      MRN: inv.mrn,
      Department: inv.department,
      Date: inv.date,
      Amount: inv.amount,
      Paid: inv.paid,
      Balance: inv.amount - inv.paid,
      Status: inv.status,
    }));
    exportToCsv(`medicore-invoices-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    logActivity({ action: "Exported invoices", category: "billing", details: `${rows.length} invoices → CSV` });
    pushToast({ title: "Export Complete ✓", description: `${rows.length} invoices downloaded as CSV`, variant: "success" });
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
          <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700" onClick={() => openModal("newInvoice")}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Billed" value={stats.total} format={(v) => `$${Math.round(v).toLocaleString()}`} icon={Receipt} accent="brand" delta={`${allInvoices.length} invoices`} deltaType="up" delay={0} />
        <KpiCard label="Collected" value={stats.collected} format={(v) => `$${Math.round(v).toLocaleString()}`} icon={CheckCircle2} accent="emerald" delta={`${stats.total > 0 ? Math.round((stats.collected / stats.total) * 100) : 0}%`} deltaType="up" delay={0.05} />
        <KpiCard label="Outstanding" value={stats.outstanding} format={(v) => `$${Math.round(v).toLocaleString()}`} icon={Clock} accent="amber" delay={0.1} />
        <KpiCard label="Overdue" value={stats.overdue} format={(v) => `$${Math.round(v).toLocaleString()}`} icon={AlertTriangle} accent="rose" delta={`${allInvoices.filter(i => i.status === "overdue").length} invoices`} deltaType="down" delay={0.15} />
      </div>

      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        {/* Toolbar */}
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent/30 border-b border-border">
              <tr>
                <Th>Invoice #</Th>
                <Th>Patient</Th>
                <Th>Department</Th>
                <Th>Date</Th>
                <Th>Amount</Th>
                <Th>Paid</Th>
                <Th>Balance</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No invoices match your filters.
                  </td>
                </tr>
              )}
              {filtered.map((inv, i) => (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.4) }}
                  className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedInvoice(inv)}
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
                  <Td><span className="text-sm text-muted-foreground">{inv.department}</span></Td>
                  <Td><span className="text-xs text-muted-foreground">{fmtDate(inv.date)}</span></Td>
                  <Td><span className="text-sm font-semibold tabular-nums">${inv.amount.toLocaleString()}</span></Td>
                  <Td><span className="text-sm tabular-nums text-emerald-600">${inv.paid.toLocaleString()}</span></Td>
                  <Td><span className="text-sm tabular-nums text-muted-foreground">${(inv.amount - inv.paid).toLocaleString()}</span></Td>
                  <Td><StatusPill status={STATUS_INFO[inv.status].status}>{STATUS_INFO[inv.status].label}</StatusPill></Td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <InvoiceDetailDrawer invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onVoid={(inv) => { cancelInvoice(inv.id); setSelectedInvoice(null); }} />
    </div>
  );
}

function InvoiceDetailDrawer({ invoice, onClose, onVoid }: { invoice: UnifiedInvoice | null; onClose: () => void; onVoid: (inv: UnifiedInvoice) => void }) {
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
            <InvoiceDetail invoice={invoice} onClose={onClose} onVoid={onVoid} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function InvoiceDetail({ invoice, onClose, onVoid }: { invoice: UnifiedInvoice; onClose: () => void; onVoid: (inv: UnifiedInvoice) => void }) {
  const { openModal, pushToast, logActivity } = useAppStore();
  const status = STATUS_INFO[invoice.status];
  const balance = invoice.amount - invoice.paid;

  const handlePrint = () => {
    printInvoice({
      number: invoice.number,
      patientName: invoice.patientName,
      mrn: invoice.mrn,
      date: invoice.date,
      department: invoice.department,
      items: invoice.items,
      amount: invoice.amount,
      paid: invoice.paid,
    });
    logActivity({ action: "Printed invoice", category: "billing", details: invoice.number });
  };

  const handleSend = () => {
    // In a real system, this would email/SMS the patient. For now, we simulate the action with a success toast.
    logActivity({ action: "Sent invoice to patient", category: "billing", details: `${invoice.number} → ${invoice.patientName}` });
    pushToast({ title: "Invoice Sent ✓", description: `${invoice.number} sent to ${invoice.patientName}`, variant: "success" });
  };

  const handleCollect = () => {
    openModal("collectPayment", { invoice });
  };

  const handleVoid = () => {
    if (confirm(`Void invoice ${invoice.number}? This cannot be undone.`)) {
      logActivity({ action: "Voided invoice", category: "billing", details: invoice.number });
      pushToast({ title: "Invoice Voided", description: `${invoice.number} has been removed`, variant: "info" });
      onVoid(invoice);
    }
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
        <h2 className="text-2xl font-bold">${invoice.amount.toLocaleString()}</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs bg-white/15 px-2 py-0.5 rounded-md font-medium">{status.label}</span>
          <span className="text-xs text-brand-200">{invoice.department}</span>
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
            {invoice.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/60">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">${item.rate} × {item.qty}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums">${item.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-accent/30 border border-border space-y-2">
          <Row label="Subtotal" value={`$${invoice.amount.toLocaleString()}`} />
          <Row label="Already Paid" value={`$${invoice.paid.toLocaleString()}`} tone="emerald" />
          <div className="h-px bg-border my-2" />
          <Row label="Balance Due" value={`$${balance.toLocaleString()}`} tone="rose" big />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="h-10" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button variant="outline" size="sm" className="h-10" onClick={handleSend}>
            <Send className="h-4 w-4 mr-1" />
            Send
          </Button>
          <Button size="sm" className="h-10 bg-emerald-600 hover:bg-emerald-700" disabled={balance <= 0} onClick={handleCollect}>
            <DollarSign className="h-4 w-4 mr-1" />
            Collect
          </Button>
        </div>

        {balance <= 0 && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            This invoice has been fully paid.
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200" onClick={handleVoid}>
          <Trash2 className="h-4 w-4 mr-1.5" />
          Void Invoice
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
