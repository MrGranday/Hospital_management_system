"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Boxes,
  Search,
  AlertTriangle,
  Package,
  TrendingDown,
  DollarSign,
  MapPin,
  Plus,
  Download,
  ShoppingCart,
  Pill,
  Layers,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { INVENTORY_ITEMS, MEDICINES, type InventoryItem, type Medicine } from "@/lib/data";
import { KpiCard, StatusPill } from "@/components/shell/ui-bits";
import { useAppStore } from "@/store/app-store";
import { exportToCsv } from "@/lib/print";
import { can } from "@/lib/rbac";

const CATEGORIES = ["All", "Surgical", "PPE", "Consumable", "Wound Care", "Blood Bank", "Cardiology", "Urology", "Respiratory"];

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [view, setView] = useState<"supplies" | "medicines" | "batches">("supplies");
  const { pushToast, setPage, openModal, medicineStock, medicineBatches, adjustMedicineStock } = useAppStore();
  const role = useAppStore((s) => s.user?.role);
  const canAdjust = can(role, "inventory", "adjust");
  const canCreatePO = can(role, "purchases", "create");

  const filtered = useMemo(() => {
    return INVENTORY_ITEMS.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
      const matchesCategory = category === "All" || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  const filteredMedicines = useMemo(() => {
    return MEDICINES.filter((m) => {
      const q = search.trim().toLowerCase();
      return !q || m.name.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
    });
  }, [search]);

  const filteredBatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return medicineBatches.filter((b) => {
      if (!q) return true;
      const med = MEDICINES.find((m) => m.id === b.medicineId);
      return med?.name.toLowerCase().includes(q) || b.batchNo.toLowerCase().includes(q);
    });
  }, [search, medicineBatches]);

  const stats = useMemo(() => {
    const suppliesValue = INVENTORY_ITEMS.reduce((s, i) => s + i.stock * i.unitCost, 0);
    const medicinesValue = MEDICINES.reduce((s, m) => s + (medicineStock[m.id] ?? m.stock) * m.price * 0.6, 0);
    const totalValue = suppliesValue + medicinesValue;
    const lowStock = INVENTORY_ITEMS.filter((i) => i.stock < i.minStock).length + MEDICINES.filter((m) => (medicineStock[m.id] ?? m.stock) < m.minStock).length;
    const totalItems = INVENTORY_ITEMS.length + MEDICINES.length;
    const criticalLow = INVENTORY_ITEMS.filter((i) => i.stock < i.minStock * 0.5).length + MEDICINES.filter((m) => (medicineStock[m.id] ?? m.stock) < m.minStock * 0.5).length;
    return { totalValue, lowStock, totalItems, criticalLow };
  }, [medicineStock]);

  const handleExport = () => {
    if (view === "supplies") {
      const rows = INVENTORY_ITEMS.map((i) => ({ name: i.name, sku: i.sku, category: i.category, stock: i.stock, unit: i.unit, minStock: i.minStock, location: i.location, unitCost: i.unitCost, totalValue: i.stock * i.unitCost }));
      exportToCsv("inventory-supplies.csv", rows);
    } else if (view === "medicines") {
      const rows = MEDICINES.map((m) => ({ name: m.name, generic: m.generic, category: m.category, stock: medicineStock[m.id] ?? m.stock, minStock: m.minStock, unit: m.unit, price: m.price, manufacturer: m.manufacturer }));
      exportToCsv("inventory-medicines.csv", rows);
    } else {
      const rows = medicineBatches.map((b) => {
        const med = MEDICINES.find((m) => m.id === b.medicineId);
        return { medicine: med?.name ?? b.medicineId, batchNo: b.batchNo, expiry: b.expiryDate, receivedQty: b.receivedQty, currentQty: b.currentQty, unitCost: b.unitCost, poNumber: b.poNumber ?? "—" };
      });
      exportToCsv("inventory-batches.csv", rows);
    }
    pushToast({ title: "Export started", description: "inventory.csv is downloading", variant: "success" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">Inventory Control</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Track consumables, medicines, and batch-level pharmaceutical stock</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
          {canCreatePO && (
            <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700" onClick={() => setPage("purchases")}>
              <ShoppingCart className="h-4 w-4 mr-1.5" /> Purchase Orders
            </Button>
          )}
          {canAdjust && (
            <Button size="sm" variant="outline" className="h-9" onClick={() => openModal("restock")}>
              <Plus className="h-4 w-4 mr-1.5" /> Restock
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total SKUs" value={stats.totalItems} icon={Boxes} accent="brand" delay={0} sub={`${INVENTORY_ITEMS.length} supplies + ${MEDICINES.length} medicines`} />
        <KpiCard label="Inventory Value" value={stats.totalValue} format={(v) => `$${Math.round(v).toLocaleString()}`} icon={DollarSign} accent="emerald" delay={0.05} />
        <KpiCard label="Low Stock" value={stats.lowStock} icon={AlertTriangle} accent="amber" delay={0.1} sub="needs attention" />
        <KpiCard label="Critical Low" value={stats.criticalLow} icon={TrendingDown} accent="rose" delay={0.15} sub="reorder now" />
      </div>

      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, SKU, batch..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            <button onClick={() => setView("supplies")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${view === "supplies" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
              <Package className="h-3 w-3" /> Supplies
            </button>
            <button onClick={() => setView("medicines")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${view === "medicines" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
              <Pill className="h-3 w-3" /> Medicines
            </button>
            <button onClick={() => setView("batches")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${view === "batches" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
              <Layers className="h-3 w-3" /> Batches ({medicineBatches.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {view === "supplies" && (
            <table className="w-full">
              <thead className="bg-accent/30 border-b border-border">
                <tr>
                  <Th>Item</Th><Th>SKU</Th><Th>Category</Th><Th>Stock</Th>
                  <Th>Min</Th><Th>Location</Th><Th>Unit Cost</Th><Th>Total Value</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => <InventoryRow key={item.id} item={item} delay={i * 0.03} onClick={() => pushToast({ title: item.name, description: `${item.sku} · ${item.category} · Stock: ${item.stock} ${item.unit} · ${item.location}`, variant: "info" })} />)}
              </tbody>
            </table>
          )}
          {view === "medicines" && (
            <table className="w-full">
              <thead className="bg-accent/30 border-b border-border">
                <tr>
                  <Th>Medicine</Th><Th>Generic</Th><Th>Category</Th><Th>Stock</Th>
                  <Th>Min</Th><Th>Batch</Th><Th>Expiry</Th><Th>Price</Th><Th>Status</Th>{canAdjust && <Th className="text-right pr-4">Adjust</Th>}
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map((m, i) => <MedicineRow key={m.id} medicine={m} stock={medicineStock[m.id] ?? m.stock} delay={i * 0.03} canAdjust={canAdjust} onAdjust={() => openModal("adjustStock", { medicine: m })} />)}
              </tbody>
            </table>
          )}
          {view === "batches" && (
            <table className="w-full">
              <thead className="bg-accent/30 border-b border-border">
                <tr>
                  <Th>Medicine</Th><Th>Batch No</Th><Th>Expiry</Th>
                  <Th>Received</Th><Th>Current</Th><Th>Unit Cost</Th><Th>PO #</Th><Th>Received Date</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((b, i) => {
                  const med = MEDICINES.find((m) => m.id === b.medicineId);
                  const today = new Date().toISOString().slice(0, 10);
                  const isExpired = b.expiryDate < today;
                  const isExpiringSoon = !isExpired && b.expiryDate <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
                  return (
                    <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: i * 0.02 }} className="border-b border-border/50 hover:bg-accent/30">
                      <Td><span className="text-sm font-medium">{med?.name ?? b.medicineId}</span></Td>
                      <Td><span className="text-xs font-mono">{b.batchNo}</span></Td>
                      <Td>
                        <span className={`text-xs ${isExpired ? "text-rose-600 font-semibold" : isExpiringSoon ? "text-amber-600 font-semibold" : "text-muted-foreground"}`}>
                          {b.expiryDate}{isExpired && " (expired)"}{isExpiringSoon && " (soon)"}
                        </span>
                      </Td>
                      <Td><span className="text-xs tabular-nums">{b.receivedQty}</span></Td>
                      <Td><span className={`text-sm font-semibold tabular-nums ${b.currentQty === 0 ? "text-rose-600" : ""}`}>{b.currentQty}</span></Td>
                      <Td><span className="text-xs tabular-nums">${b.unitCost.toFixed(2)}</span></Td>
                      <Td><span className="text-xs font-mono text-muted-foreground">{b.poNumber ?? "—"}</span></Td>
                      <Td><span className="text-xs text-muted-foreground">{b.receivedDate}</span></Td>
                      <Td>
                        {b.currentQty === 0 ? <StatusPill status="danger">Empty</StatusPill> : isExpired ? <StatusPill status="danger">Expired</StatusPill> : isExpiringSoon ? <StatusPill status="warning">Expiring</StatusPill> : <StatusPill status="success">Active</StatusPill>}
                      </Td>
                    </motion.tr>
                  );
                })}
                {filteredBatches.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-sm text-muted-foreground">No batches found.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

function InventoryRow({ item, delay, onClick }: { item: InventoryItem; delay: number; onClick?: () => void }) {
  const isLow = item.stock < item.minStock;
  const isCritical = item.stock < item.minStock * 0.5;
  const stockPct = Math.min(100, (item.stock / (item.minStock * 2)) * 100);
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay }} onClick={onClick} className="border-b border-border/50 hover:bg-accent/30 transition-colors group cursor-pointer">
      <Td>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isLow ? "bg-rose-50 text-rose-600" : "bg-brand-50 text-brand-600"}`}><Package className="h-4 w-4" /></div>
          <div>
            <p className="text-sm font-medium">{item.name}</p>
            <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden w-24">
              <div className={`h-full rounded-full ${isCritical ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${stockPct}%` }} />
            </div>
          </div>
        </div>
      </Td>
      <Td><span className="text-xs font-mono text-muted-foreground">{item.sku}</span></Td>
      <Td><Badge variant="outline" className="text-[10px]">{item.category}</Badge></Td>
      <Td><span className={`text-sm font-semibold tabular-nums ${isLow ? "text-rose-600" : ""}`}>{item.stock.toLocaleString()}</span><span className="text-xs text-muted-foreground ml-1">{item.unit}</span></Td>
      <Td><span className="text-xs text-muted-foreground tabular-nums">{item.minStock.toLocaleString()}</span></Td>
      <Td><span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{item.location}</span></Td>
      <Td><span className="text-sm tabular-nums">${item.unitCost.toFixed(2)}</span></Td>
      <Td><span className="text-sm font-semibold tabular-nums">${(item.stock * item.unitCost).toLocaleString()}</span></Td>
      <Td>{isCritical ? <StatusPill status="danger">Critical</StatusPill> : isLow ? <StatusPill status="warning">Low</StatusPill> : <StatusPill status="success">In Stock</StatusPill>}</Td>
    </motion.tr>
  );
}

function MedicineRow({ medicine, stock, delay, canAdjust, onAdjust }: { medicine: Medicine; stock: number; delay: number; canAdjust: boolean; onAdjust: () => void }) {
  const isLow = stock < medicine.minStock;
  const isCritical = stock < medicine.minStock * 0.5;
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay }} className="border-b border-border/50 hover:bg-accent/30">
      <Td><div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isLow ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}><Pill className="h-4 w-4" /></div><p className="text-sm font-medium">{medicine.name}</p></div></Td>
      <Td><span className="text-xs text-muted-foreground">{medicine.generic}</span></Td>
      <Td><Badge variant="outline" className="text-[10px]">{medicine.category}</Badge></Td>
      <Td><span className={`text-sm font-semibold tabular-nums ${isLow ? "text-rose-600" : ""}`}>{stock.toLocaleString()}</span><span className="text-xs text-muted-foreground ml-1">{medicine.unit}</span></Td>
      <Td><span className="text-xs text-muted-foreground tabular-nums">{medicine.minStock.toLocaleString()}</span></Td>
      <Td><span className="text-xs font-mono">{medicine.batch}</span></Td>
      <Td><span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{medicine.expiry}</span></Td>
      <Td><span className="text-sm tabular-nums">${medicine.price.toFixed(2)}</span></Td>
      <Td>{isCritical ? <StatusPill status="danger">Critical</StatusPill> : isLow ? <StatusPill status="warning">Low</StatusPill> : <StatusPill status="success">In Stock</StatusPill>}</Td>
      {canAdjust && <Td className="text-right pr-4"><Button variant="ghost" size="sm" className="h-7 px-2" onClick={onAdjust}>Adjust</Button></Td>}
    </motion.tr>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${className || ""}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className || ""}`}>{children}</td>;
}

