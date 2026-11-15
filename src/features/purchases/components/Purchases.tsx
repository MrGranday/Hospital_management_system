"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart, Plus, Search, Eye, CheckCircle2, XCircle, Truck, ArrowLeft,
  Package, RotateCcw, Download, Printer, FileText, AlertTriangle, DollarSign,
  Clock, TrendingUp, TrendingDown, Filter,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAppStore, type PurchaseOrder, type PurchaseReturn, type PurchaseOrderStatus, type PurchaseReturnStatus, type ReturnReason } from "@/store/app-store";
import { MEDICINES, SUPPLIERS } from "@/lib/data";
import { KpiCard, StatusPill, ColorAvatar } from "@/components/shell/ui-bits";
import { exportToCsv } from "@/lib/print";
import { can } from "@/lib/rbac";

const money = (n: number) => `$${n.toFixed(2)}`;

const PO_STATUS_META: Record<PurchaseOrderStatus, { label: string; pill: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  draft: { label: "Draft", pill: "neutral" },
  pending: { label: "Pending", pill: "warning" },
  approved: { label: "Approved", pill: "info" },
  ordered: { label: "Ordered", pill: "info" },
  partially_received: { label: "Partial", pill: "warning" },
  fully_received: { label: "Received", pill: "success" },
  cancelled: { label: "Cancelled", pill: "danger" },
};

const PR_STATUS_META: Record<PurchaseReturnStatus, { label: string; pill: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  draft: { label: "Draft", pill: "neutral" },
  pending_approval: { label: "Pending Approval", pill: "warning" },
  approved: { label: "Approved", pill: "info" },
  completed: { label: "Completed", pill: "success" },
  rejected: { label: "Rejected", pill: "danger" },
  cancelled: { label: "Cancelled", pill: "neutral" },
};

const RETURN_REASONS: { value: ReturnReason; label: string }[] = [
  { value: "damaged", label: "Damaged Product" },
  { value: "expired", label: "Expired Product" },
  { value: "near_expiry", label: "Near-Expiry Product" },
  { value: "incorrect_product", label: "Incorrect Product" },
  { value: "wrong_quantity", label: "Wrong Quantity" },
  { value: "supplier_issue", label: "Supplier Issue" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "other", label: "Other" },
];

type TabKey = "orders" | "returns";

export default function Purchases() {
  const [tab, setTab] = useState<TabKey>("orders");
  const { purchaseOrders, purchaseReturns, openModal, setPage } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">Procurement</span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Purchases & Returns</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage purchase orders, goods receipts, and supplier returns with full batch traceability</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={() => setPage("suppliers")}>
            <Package className="h-4 w-4 mr-1.5" /> Suppliers
          </Button>
          {tab === "orders" && (
            <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700" onClick={() => openModal("newPurchaseOrder")}>
              <Plus className="h-4 w-4 mr-1.5" /> New Purchase Order
            </Button>
          )}
          {tab === "returns" && (
            <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700" onClick={() => openModal("newPurchaseReturn")}>
              <RotateCcw className="h-4 w-4 mr-1.5" /> New Return
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Active POs" value={purchaseOrders.filter((p) => !["fully_received", "cancelled"].includes(p.status)).length} icon={ShoppingCart} accent="brand" delay={0} sub={`${purchaseOrders.length} total`} />
        <KpiCard label="Pending Receipts" value={purchaseOrders.filter((p) => ["ordered", "partially_received"].includes(p.status)).length} icon={Truck} accent="amber" delay={0.05} sub="awaiting delivery" />
        <KpiCard label="Pending Returns" value={purchaseReturns.filter((r) => ["pending_approval", "approved"].includes(r.status)).length} icon={RotateCcw} accent="rose" delay={0.1} sub={`${purchaseReturns.length} total`} />
        <KpiCard label="Outstanding Value" value={purchaseOrders.filter((p) => !["cancelled", "fully_received"].includes(p.status)).reduce((s, p) => s + p.total, 0)} format={(v) => money(v)} icon={DollarSign} accent="emerald" delay={0.15} sub="open PO value" />
      </div>

      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        <div className="border-b border-border flex items-center gap-1 p-2">
          <TabButton active={tab === "orders"} onClick={() => setTab("orders")} icon={ShoppingCart} label={`Purchase Orders (${purchaseOrders.length})`} />
          <TabButton active={tab === "returns"} onClick={() => setTab("returns")} icon={RotateCcw} label={`Purchase Returns (${purchaseReturns.length})`} />
        </div>
        {tab === "orders" ? <PurchaseOrdersList /> : <PurchaseReturnsList />}
      </Card>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${active ? "bg-brand-50 text-brand-700" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// ============================================================================
// PURCHASE ORDERS LIST
// ============================================================================
function PurchaseOrdersList() {
  const { purchaseOrders, suppliers, setPage, openModal, approvePurchaseOrder, cancelPurchaseOrder } = useAppStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);

  const filtered = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || po.number.toLowerCase().includes(q) || po.supplierName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || po.status === statusFilter;
      const matchesSupplier = supplierFilter === "all" || po.supplierId === supplierFilter;
      return matchesSearch && matchesStatus && matchesSupplier;
    });
  }, [purchaseOrders, search, statusFilter, supplierFilter]);

  const handleExport = () => {
    const rows = filtered.map((p) => ({
      number: p.number, date: p.date, supplier: p.supplierName, status: p.status,
      items: p.items.length, total: p.total, received: p.items.reduce((s, i) => s + i.receivedQty, 0),
      ordered: p.items.reduce((s, i) => s + i.orderedQty + i.freeQty, 0),
    }));
    exportToCsv("purchase-orders.csv", rows);
  };

  const role = useAppStore((s) => s.user?.role);
  const canApprove = can(role, "purchases", "approve");
  const canReceive = can(role, "purchases", "receive");
  const canCreate = can(role, "purchases", "create");

  return (
    <>
      <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search PO number or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="partially_received">Partially Received</SelectItem>
            <SelectItem value="fully_received">Fully Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Supplier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All suppliers</SelectItem>
            {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1.5" /> Export
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-accent/30 border-b border-border">
            <tr>
              <Th>PO Number</Th><Th>Date</Th><Th>Supplier</Th><Th>Items</Th>
              <Th>Total</Th><Th>Received</Th><Th>Status</Th><Th className="text-right pr-4">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((po, i) => {
              const ordered = po.items.reduce((s, it) => s + it.orderedQty + it.freeQty, 0);
              const received = po.items.reduce((s, it) => s + it.receivedQty, 0);
              const recvPct = ordered > 0 ? Math.min(100, (received / ordered) * 100) : 0;
              return (
                <motion.tr key={po.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: i * 0.02 }} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <Td><span className="text-sm font-medium font-mono">{po.number}</span></Td>
                  <Td><span className="text-xs text-muted-foreground">{po.date}</span></Td>
                  <Td><span className="text-sm">{po.supplierName}</span></Td>
                  <Td><span className="text-sm">{po.items.length}</span></Td>
                  <Td><span className="text-sm font-semibold tabular-nums">{money(po.total)}</span></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${recvPct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">{received}/{ordered}</span>
                    </div>
                  </Td>
                  <Td><StatusPill status={PO_STATUS_META[po.status].pill}>{PO_STATUS_META[po.status].label}</StatusPill></Td>
                  <Td className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setSelectedPo(po)}><Eye className="h-3.5 w-3.5 mr-1" /> View</Button>
                      {canApprove && po.status === "pending" && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-emerald-600 hover:text-emerald-700" onClick={() => approvePurchaseOrder(po.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                      )}
                      {canReceive && ["approved", "ordered", "partially_received"].includes(po.status) && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-brand-600 hover:text-brand-700" onClick={() => openModal("receiveGoods", { po })}>
                          <Truck className="h-3.5 w-3.5 mr-1" /> Receive
                        </Button>
                      )}
                      {canCreate && ["pending", "approved", "ordered"].includes(po.status) && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-rose-600 hover:text-rose-700" onClick={() => cancelPurchaseOrder(po.id)}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </Td>
                </motion.tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">No purchase orders match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedPo && <PurchaseOrderDetail po={selectedPo} onClose={() => setSelectedPo(null)} />}
    </>
  );
}

// ============================================================================
// PURCHASE ORDER DETAIL
// ============================================================================
function PurchaseOrderDetail({ po, onClose }: { po: PurchaseOrder; onClose: () => void }) {
  const { openModal, approvePurchaseOrder, cancelPurchaseOrder } = useAppStore();
  const role = useAppStore((s) => s.user?.role);
  const canApprove = can(role, "purchases", "approve");
  const canReceive = can(role, "purchases", "receive");
  const canCancel = can(role, "purchases", "create");

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono">{po.number}</span>
            <StatusPill status={PO_STATUS_META[po.status].pill}>{PO_STATUS_META[po.status].label}</StatusPill>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
          <InfoBlock label="Supplier" value={po.supplierName} />
          <InfoBlock label="Order Date" value={po.date} />
          <InfoBlock label="Expected" value={po.expectedDate ?? "—"} />
          <InfoBlock label="Created By" value={po.createdBy} />
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-accent/30 border-b border-border">
              <tr>
                <Th>Item</Th><Th>Batch</Th><Th>Expiry</Th>
                <Th className="text-right">Ordered</Th><Th className="text-right">Free</Th>
                <Th className="text-right">Received</Th><Th className="text-right">Returned</Th>
                <Th className="text-right">Unit Cost</Th><Th className="text-right">Disc%</Th><Th className="text-right">Tax%</Th>
                <Th className="text-right pr-4">Total</Th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((it) => (
                <tr key={it.id} className="border-b border-border/40">
                  <Td><span className="text-sm font-medium">{it.name}</span></Td>
                  <Td><span className="text-xs font-mono">{it.batchNo ?? "—"}</span></Td>
                  <Td><span className="text-xs">{it.expiryDate ?? "—"}</span></Td>
                  <Td className="text-right"><span className="text-sm tabular-nums">{it.orderedQty}</span></Td>
                  <Td className="text-right"><span className="text-sm tabular-nums text-emerald-600">{it.freeQty || "—"}</span></Td>
                  <Td className="text-right"><span className="text-sm tabular-nums">{it.receivedQty}</span></Td>
                  <Td className="text-right"><span className="text-sm tabular-nums text-rose-600">{it.returnedQty || "—"}</span></Td>
                  <Td className="text-right"><span className="text-sm tabular-nums">{money(it.unitCost)}</span></Td>
                  <Td className="text-right"><span className="text-xs">{it.discountPct}%</span></Td>
                  <Td className="text-right"><span className="text-xs">{it.taxPct}%</span></Td>
                  <Td className="text-right pr-4"><span className="text-sm font-semibold tabular-nums">{money(it.lineTotal)}</span></Td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-accent/20">
              <tr className="border-t-2 border-border">
                <td colSpan={9} className="px-4 py-2 text-right text-xs text-muted-foreground">Subtotal / Discount / Tax</td>
                <td colSpan={2} className="px-4 py-2 text-right">
                  <div className="text-xs text-muted-foreground">{money(po.subtotal)} / -{money(po.discountTotal)} / +{money(po.taxTotal)}</div>
                </td>
              </tr>
              <tr>
                <td colSpan={10} className="px-4 py-2 text-right text-sm font-semibold">Grand Total</td>
                <td className="px-4 py-2 text-right text-base font-bold text-brand-700">{money(po.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {po.receipts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Truck className="h-4 w-4" /> Goods Receipts ({po.receipts.length})</h3>
            <div className="space-y-2">
              {po.receipts.map((r) => (
                <div key={r.id} className="rounded-lg border border-border p-3 bg-accent/20">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-mono font-medium">{r.number}</span>
                      <span className="text-xs text-muted-foreground ml-2">{new Date(r.receivedAt).toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">by {r.receivedBy}</span>
                  </div>
                  <div className="space-y-1">
                    {r.items.map((it, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span>{it.name}</span>
                        <span className="font-mono">+{it.receivedQty} · Batch {it.batchNo} · Exp {it.expiryDate}</span>
                      </div>
                    ))}
                  </div>
                  {r.notes && <p className="text-xs italic text-muted-foreground mt-2">{r.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {po.notes && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs font-medium text-amber-800 mb-1">Notes</p>
            <p className="text-xs text-amber-700">{po.notes}</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {canApprove && po.status === "pending" && (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { approvePurchaseOrder(po.id); onClose(); }}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve Order
            </Button>
          )}
          {canReceive && ["approved", "ordered", "partially_received"].includes(po.status) && (
            <Button className="bg-brand-600 hover:bg-brand-700" onClick={() => { openModal("receiveGoods", { po }); onClose(); }}>
              <Truck className="h-4 w-4 mr-1.5" /> Receive Goods
            </Button>
          )}
          {canCancel && ["pending", "approved", "ordered"].includes(po.status) && (
            <Button variant="outline" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => { cancelPurchaseOrder(po.id); onClose(); }}>
              <XCircle className="h-4 w-4 mr-1.5" /> Cancel PO
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="text-sm mt-1 font-medium">{value}</p>
    </div>
  );
}

// ============================================================================
// PURCHASE RETURNS LIST
// ============================================================================
function PurchaseReturnsList() {
  const { purchaseReturns, openModal } = useAppStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReturn, setSelectedReturn] = useState<PurchaseReturn | null>(null);

  const filtered = useMemo(() => {
    return purchaseReturns.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || r.number.toLowerCase().includes(q) || r.poNumber.toLowerCase().includes(q) || r.supplierName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [purchaseReturns, search, statusFilter]);

  const handleExport = () => {
    const rows = filtered.map((r) => ({
      number: r.number, date: r.date, po: r.poNumber, supplier: r.supplierName,
      status: r.status, items: r.items.length, units: r.items.reduce((s, i) => s + i.returnQty, 0),
      credit: r.totalCredit, reason: r.reason,
    }));
    exportToCsv("purchase-returns.csv", rows);
  };

  return (
    <>
      <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search return, PO, or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1.5" /> Export
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-accent/30 border-b border-border">
            <tr>
              <Th>Return #</Th><Th>Date</Th><Th>PO #</Th><Th>Supplier</Th>
              <Th>Items</Th><Th>Units</Th><Th>Credit</Th><Th>Reason</Th><Th>Status</Th>
              <Th className="text-right pr-4">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const reasonLabel = RETURN_REASONS.find((rr) => rr.value === r.items[0]?.reason)?.label ?? r.items[0]?.reason ?? "—";
              return (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: i * 0.02 }} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <Td><span className="text-sm font-mono">{r.number}</span></Td>
                  <Td><span className="text-xs text-muted-foreground">{r.date}</span></Td>
                  <Td><span className="text-xs font-mono">{r.poNumber}</span></Td>
                  <Td><span className="text-sm">{r.supplierName}</span></Td>
                  <Td><span className="text-sm">{r.items.length}</span></Td>
                  <Td><span className="text-sm tabular-nums">{r.items.reduce((s, it) => s + it.returnQty, 0)}</span></Td>
                  <Td><span className="text-sm font-semibold tabular-nums text-emerald-600">{money(r.totalCredit)}</span></Td>
                  <Td><span className="text-xs">{reasonLabel}</span></Td>
                  <Td><StatusPill status={PR_STATUS_META[r.status].pill}>{PR_STATUS_META[r.status].label}</StatusPill></Td>
                  <Td className="text-right pr-4">
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setSelectedReturn(r)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                  </Td>
                </motion.tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="text-center py-12 text-sm text-muted-foreground">No purchase returns match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedReturn && <PurchaseReturnDetail ret={selectedReturn} onClose={() => setSelectedReturn(null)} />}
    </>
  );
}

// ============================================================================
// PURCHASE RETURN DETAIL
// ============================================================================
function PurchaseReturnDetail({ ret, onClose }: { ret: PurchaseReturn; onClose: () => void }) {
  const { approvePurchaseReturn, rejectPurchaseReturn, completePurchaseReturn, cancelPurchaseReturn } = useAppStore();
  const role = useAppStore((s) => s.user?.role);
  const canApprove = can(role, "purchase_returns", "approve");
  const canComplete = can(role, "purchase_returns", "return");

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono">{ret.number}</span>
            <StatusPill status={PR_STATUS_META[ret.status].pill}>{PR_STATUS_META[ret.status].label}</StatusPill>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
          <InfoBlock label="Return #" value={ret.number} />
          <InfoBlock label="PO #" value={ret.poNumber} />
          <InfoBlock label="Supplier" value={ret.supplierName} />
          <InfoBlock label="Date" value={ret.date} />
          <InfoBlock label="Created By" value={ret.createdBy} />
          {ret.approvedBy && <InfoBlock label="Approved By" value={ret.approvedBy} />}
          {ret.completedAt && <InfoBlock label="Completed" value={new Date(ret.completedAt).toLocaleString()} />}
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-accent/30 border-b border-border">
              <tr>
                <Th>Item</Th><Th>Batch</Th><Th>Expiry</Th>
                <Th className="text-right">Received</Th><Th className="text-right">Return Qty</Th>
                <Th className="text-right">Unit Cost</Th><Th className="text-right pr-4">Credit</Th>
                <Th>Reason</Th>
              </tr>
            </thead>
            <tbody>
              {ret.items.map((it) => (
                <tr key={it.id} className="border-b border-border/40">
                  <Td><span className="text-sm font-medium">{it.name}</span></Td>
                  <Td><span className="text-xs font-mono">{it.batchNo}</span></Td>
                  <Td><span className="text-xs">{it.expiryDate}</span></Td>
                  <Td className="text-right"><span className="text-xs tabular-nums">{it.receivedQty}</span></Td>
                  <Td className="text-right"><span className="text-sm font-semibold tabular-nums text-rose-600">{it.returnQty}</span></Td>
                  <Td className="text-right"><span className="text-xs tabular-nums">{money(it.unitCost)}</span></Td>
                  <Td className="text-right pr-4"><span className="text-sm font-semibold tabular-nums">{money(it.lineTotal)}</span></Td>
                  <Td><span className="text-xs">{RETURN_REASONS.find((r) => r.value === it.reason)?.label ?? it.reason}</span></Td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-accent/20">
              <tr>
                <td colSpan={6} className="px-4 py-2 text-right text-sm font-semibold">Total Credit</td>
                <td className="px-4 py-2 text-right text-base font-bold text-emerald-700">{money(ret.totalCredit)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {ret.notes && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs font-medium text-amber-800 mb-1">Notes</p>
            <p className="text-xs text-amber-700">{ret.notes}</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {canApprove && ret.status === "pending_approval" && (
            <>
              <Button variant="outline" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => { rejectPurchaseReturn(ret.id); onClose(); }}>
                <XCircle className="h-4 w-4 mr-1.5" /> Reject
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { approvePurchaseReturn(ret.id); onClose(); }}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve
              </Button>
            </>
          )}
          {canComplete && ret.status === "approved" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-brand-600 hover:bg-brand-700">
                  <RotateCcw className="h-4 w-4 mr-1.5" /> Complete Return
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Complete purchase return?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently deduct {ret.items.reduce((s, i) => s + i.returnQty, 0)} units from inventory
                    (using FEFO) and apply <strong>{money(ret.totalCredit)}</strong> credit to {ret.supplierName}'s account.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { completePurchaseReturn(ret.id); onClose(); }}>
                    Yes, complete return
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {["pending_approval", "approved"].includes(ret.status) && (
            <Button variant="outline" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => { cancelPurchaseReturn(ret.id); onClose(); }}>
              Cancel Return
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${className || ""}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className || ""}`}>{children}</td>;
}
