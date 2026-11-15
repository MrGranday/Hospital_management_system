"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Pill as PillIcon,
  Plus,
  Search,
  AlertTriangle,
  Package,
  TrendingUp,
  DollarSign,
  Clock,
  ShoppingCart,
  Calendar,
  FileText,
  Boxes,
  CheckCircle2,
  CreditCard,
  Banknote,
  Shield,
  RotateCcw,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Mail,
  Phone,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  MEDICINES, PRESCRIPTIONS, PHARMACY_SALES, PHARMACY_SALES_TREND,
  type Medicine, type Prescription, type PharmacySale,
} from "@/lib/data";
import { KpiCard, StatusPill, ColorAvatar, Sparkline } from "@/components/shared/ui-bits";
import { useAppStore } from "@/store/app-store";

const TABS = [
  { key: "inventory", label: "Inventory", icon: Boxes },
  { key: "prescriptions", label: "Prescriptions", icon: FileText },
  { key: "sales", label: "Point of Sale", icon: ShoppingCart },
  { key: "suppliers", label: "Suppliers", icon: Package },
] as const;
type TabKey = typeof TABS[number]["key"];

const CATEGORIES = ["All", "Antibiotic", "Antidiabetic", "Statin", "Antihypertensive", "Analgesic", "PPI", "Bronchodilator", "Insulin", "Antihistamine"];

const SUPPLIERS = [
  { id: "sup1", name: "PharmaCorp Inc.", category: "Medicines", items: 42, lastOrder: "$14,200", status: "active", rating: 4.8, contact: "orders@pharmacorp.com", phone: "+1 (415) 555-0401" },
  { id: "sup2", name: "GlobePharma Ltd.", category: "Medicines", items: 28, lastOrder: "$8,900", status: "active", rating: 4.6, contact: "sales@globepharma.com", phone: "+1 (415) 555-0402" },
  { id: "sup3", name: "MediLabs Supplies", category: "Medicines", items: 18, lastOrder: "$5,400", status: "active", rating: 4.7, contact: "info@medilabs.com", phone: "+1 (415) 555-0403" },
  { id: "sup4", name: "RespiraCare", category: "Respiratory", items: 12, lastOrder: "$3,200", status: "active", rating: 4.9, contact: "support@respiracare.com", phone: "+1 (415) 555-0404" },
  { id: "sup5", name: "DiabeCare Products", category: "Diabetes", items: 8, lastOrder: "$8,900", status: "active", rating: 4.85, contact: "orders@diabecare.com", phone: "+1 (415) 555-0405" },
  { id: "sup6", name: "MedEquip Services", category: "Equipment", items: 22, lastOrder: "$2,200", status: "pending", rating: 4.4, contact: "service@medequip.com", phone: "+1 (415) 555-0406" },
];

export default function Pharmacy() {
  const { openModal, pushToast, setPage } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>("inventory");

  const stats = useMemo(() => {
    const totalStock = MEDICINES.reduce((s, m) => s + m.stock, 0);
    const totalValue = MEDICINES.reduce((s, m) => s + m.stock * m.price, 0);
    const lowStock = MEDICINES.filter((m) => m.stock < m.minStock).length;
    const expiringSoon = MEDICINES.filter((m) => {
      const days = (new Date(m.expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return days < 120;
    }).length;
    const pendingRx = PRESCRIPTIONS.filter((p) => p.status === "pending").length;
    const salesToday = PHARMACY_SALES.reduce((s, p) => s + p.total, 0);
    return { totalStock, totalValue, lowStock, expiringSoon, pendingRx, salesToday };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Pharmacy Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pharmacy</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage inventory, prescriptions, sales, and suppliers</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-9" onClick={() => setPage("purchases")}>
            <Package className="h-4 w-4 mr-1.5" />
            Purchases & Returns
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => openModal("return")}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Process Return
          </Button>
          <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700 shadow-blue-glow" onClick={() => openModal("pos")}>
            <ShoppingCart className="h-4 w-4 mr-1.5" />
            Sell Medicine
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Stock Units" value={stats.totalStock} format={(v) => `${Math.round(v).toLocaleString()}`} icon={Package} accent="brand" sub="across 10 SKUs" sparkline={[5800, 6200, 6100, 6400, 6600, 6700, 6785]} delay={0} />
        <KpiCard label="Inventory Value" value={stats.totalValue} format={(v) => `$${Math.round(v).toLocaleString()}`} icon={DollarSign} accent="emerald" delta="+4.2%" deltaType="up" sparkline={[4200, 4500, 4400, 4700, 4900, 5100, 5240]} delay={0.05} />
        <KpiCard label="Low Stock Items" value={stats.lowStock} icon={AlertTriangle} accent="rose" sub="needs reorder" sparkline={[2, 3, 2, 4, 3, 3, 3]} delay={0.1} />
        <KpiCard label="Pending Rx" value={stats.pendingRx} icon={FileText} accent="amber" sub="awaiting dispense" sparkline={[1, 2, 1, 3, 2, 2, 2]} delay={0.15} />
      </div>

      {/* Sales trend chart */}
      <Card className="border-border/60 shadow-soft rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Pharmacy Sales — This Week</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Daily revenue and transaction count</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-brand-600" />
              <span className="text-xs text-muted-foreground">Sales ($)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Transactions</span>
            </div>
          </div>
        </div>
        <div className="h-[240px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={PHARMACY_SALES_TREND} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.535 0.195 245)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="oklch(0.535 0.195 245)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.62 0.150 155)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="oklch(0.62 0.150 155)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.008 255)" vertical={false} />
              <XAxis dataKey="day" stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid oklch(0.92 0.008 255)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 8px 24px -4px oklch(0.30 0.04 260 / 0.12)",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="sales" stroke="oklch(0.535 0.195 245)" strokeWidth={2.5} fill="url(#salesGrad)" name="Sales" />
              <Area type="monotone" dataKey="transactions" stroke="oklch(0.62 0.150 155)" strokeWidth={2} fill="url(#txGrad)" name="Transactions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Tabs */}
      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        <div className="border-b border-border p-2 flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-brand-50 text-brand-700 border border-brand-200"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.key === "prescriptions" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">{stats.pendingRx}</span>
              )}
              {tab.key === "inventory" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold">{stats.lowStock}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "inventory" && <InventoryTab />}
          {activeTab === "prescriptions" && <PrescriptionsTab />}
          {activeTab === "sales" && <SalesTab />}
          {activeTab === "suppliers" && <SuppliersTab />}
        </div>
      </Card>
    </div>
  );
}

// ============ INVENTORY TAB ============
function InventoryTab() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    return MEDICINES.filter((m) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || m.name.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q);
      const matchesCategory = category === "All" || m.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                category === c ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((med, i) => (
          <MedicineCard key={med.id} med={med} delay={i * 0.04} />
        ))}
      </div>
    </div>
  );
}

function MedicineCard({ med, delay }: { med: Medicine; delay: number }) {
  const { medicineStock, openModal, pushToast } = useAppStore();
  const liveStock = medicineStock[med.id] ?? med.stock;
  const stockPct = Math.min(100, (liveStock / (med.minStock * 4)) * 100);
  const isLow = liveStock < med.minStock;
  const expiringSoon = (new Date(med.expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24) < 120;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -2 }}
    >
      <Card className="border-border/60 shadow-soft hover:shadow-premium transition-all rounded-xl p-4 h-full">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isLow ? "bg-rose-50 text-rose-600" : "bg-brand-50 text-brand-600"
            }`}>
              <PillIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight truncate">{med.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{med.generic}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">{med.category}</Badge>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Stock</span>
            <span className={`font-semibold tabular-nums ${isLow ? "text-rose-600" : "text-foreground"}`}>
              {liveStock.toLocaleString()} {med.unit}s
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Price</span>
            <span className="font-semibold tabular-nums">${med.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Batch</span>
            <span className="font-mono text-[10px]">{med.batch}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Expiry</span>
            <span className={`flex items-center gap-1 ${expiringSoon ? "text-amber-600" : "text-foreground"}`}>
              {expiringSoon && <Calendar className="h-3 w-3" />}
              {new Date(med.expiry).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Stock level</span>
            <span className="text-[10px] text-muted-foreground">min {med.minStock}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stockPct}%` }}
              transition={{ duration: 0.6, delay: delay + 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full ${isLow ? "bg-rose-500" : stockPct > 60 ? "bg-emerald-500" : "bg-amber-500"}`}
            />
          </div>
        </div>

        {isLow && (
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1" onClick={() => openModal("restock", { medicineId: med.id })}>
              <Package className="h-3 w-3 mr-1" /> Restock
            </Button>
            <div className="flex items-center gap-1.5 text-[11px] text-rose-700">
              <AlertTriangle className="h-3 w-3" />
              <span>Below minimum — reorder</span>
            </div>
          </div>
        )}
        {!isLow && (
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1" onClick={() => openModal("restock", { medicineId: med.id })}>
              <Package className="h-3 w-3 mr-1" /> Restock
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1" onClick={() => openModal("pos")}>
              <ShoppingCart className="h-3 w-3 mr-1" /> Sell
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ============ PRESCRIPTIONS TAB ============
function PrescriptionsTab() {
  const RX_STATUS: Record<Prescription["status"], { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
    pending: { status: "warning", label: "Pending" },
    filled: { status: "info", label: "Filled" },
    dispensed: { status: "success", label: "Dispensed" },
    cancelled: { status: "danger", label: "Cancelled" },
  };
  const { livePrescriptions, updatePrescriptionStatus, pushToast } = useAppStore();
  const FALLBACK_COLOR = "oklch(0.62 0.14 200)";
  const rxList: Prescription[] = [
    ...livePrescriptions.map((r) => ({
      id: r.id,
      number: r.number,
      patientName: r.patientName,
      mrn: r.mrn,
      prescribedBy: r.prescribedBy,
      date: r.date,
      status: r.status,
      items: r.items,
      total: r.total,
      avatarColor: FALLBACK_COLOR,
    })),
    ...PRESCRIPTIONS,
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Recent prescriptions awaiting processing</p>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => pushToast({ title: "History (demo)", description: "Full Rx history would load here", variant: "info" })}>
          <FileText className="h-3.5 w-3.5 mr-1" />
          View All History
        </Button>
      </div>
      <div className="space-y-2">
        {rxList.map((rx, i) => (
          <motion.div
            key={rx.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="p-4 rounded-xl border border-border/60 bg-card hover:shadow-soft transition-all"
          >
            <div className="flex items-start gap-3">
              <ColorAvatar name={rx.patientName} color={rx.avatarColor} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-mono text-xs text-brand-600 font-semibold">{rx.number}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{rx.patientName}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {rx.mrn} · Prescribed by {rx.prescribedBy} · {new Date(rx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusPill status={RX_STATUS[rx.status].status}>{RX_STATUS[rx.status].label}</StatusPill>
                    <span className="text-sm font-bold tabular-nums">${rx.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {rx.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-accent/30 border border-border/50">
                      <PillIcon className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.dosage}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">x{item.qty}</Badge>
                    </div>
                  ))}
                </div>
                {rx.status === "pending" && (
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-brand-600 hover:bg-brand-700"
                      onClick={() => {
                        if (rx.id.startsWith("rx-")) {
                          updatePrescriptionStatus(rx.id, "filled");
                          pushToast({ title: "Prescription filled", description: rx.number, variant: "success" });
                        } else {
                          pushToast({ title: "Demo prescription", description: "Static demo records can't be mutated", variant: "info" });
                        }
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Mark as Filled
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => pushToast({ title: "Opening details", description: rx.number, variant: "info" })}>View Details</Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============ SALES TAB (POS) ============
function SalesTab() {
  const PAYMENT_ICONS: Record<string, React.ElementType> = {
    Cash: Banknote,
    Card: CreditCard,
    Insurance: Shield,
  };
  const { sales } = useAppStore();

  // Normalize live SaleRecords into the PharmacySale display shape
  const liveSales: PharmacySale[] = sales.map((s) => ({
    id: s.id,
    invoice: s.number,
    customer: s.customer,
    type: "otc" as const,
    items: s.items.length,
    total: s.total,
    time: s.time,
    status: s.refunded ? "refunded" : "completed",
    paymentMethod: s.paymentMethod,
  }));
  const allSales: PharmacySale[] = [...liveSales, ...PHARMACY_SALES];

  const todayTotal = allSales.reduce((s, p) => s + p.total, 0);
  const completedCount = allSales.filter((s) => s.status === "completed").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="Today's Sales" value={`$${todayTotal.toFixed(2)}`} icon={DollarSign} accent="text-emerald-600 bg-emerald-50" />
        <MiniStat label="Transactions" value={allSales.length} icon={ShoppingCart} accent="text-brand-600 bg-brand-50" />
        <MiniStat label="Completed" value={completedCount} icon={CheckCircle2} accent="text-emerald-600 bg-emerald-50" />
        <MiniStat label="Refunded" value={allSales.filter((s) => s.status === "refunded").length} icon={TrendingUp} accent="text-rose-600 bg-rose-50" />
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <Th>Invoice</Th>
              <Th>Customer</Th>
              <Th>Type</Th>
              <Th>Items</Th>
              <Th>Payment</Th>
              <Th>Time</Th>
              <Th>Total</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {allSales.map((sale, i) => {
              const PayIcon = PAYMENT_ICONS[sale.paymentMethod] || Banknote;
              return (
                <motion.tr
                  key={sale.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                >
                  <Td><span className="text-xs font-mono text-brand-600 font-semibold">{sale.invoice}</span></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <ColorAvatar name={sale.customer} color="oklch(0.62 0.130 240)" size="sm" />
                      <span className="text-sm font-medium">{sale.customer}</span>
                    </div>
                  </Td>
                  <Td>
                    <Badge variant="outline" className={`text-[10px] ${sale.type === "prescription" ? "bg-brand-50 text-brand-700 border-brand-200" : "bg-violet-50 text-violet-700 border-violet-200"}`}>
                      {sale.type === "prescription" ? "Rx" : "OTC"}
                    </Badge>
                  </Td>
                  <Td><span className="text-sm tabular-nums">{sale.items}</span></Td>
                  <Td>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <PayIcon className="h-3.5 w-3.5" />
                      {sale.paymentMethod}
                    </div>
                  </Td>
                  <Td><span className="text-xs tabular-nums">{sale.time}</span></Td>
                  <Td><span className="text-sm font-semibold tabular-nums">${sale.total.toFixed(2)}</span></Td>
                  <Td>
                    {sale.status === "completed" ? (
                      <StatusPill status="success">Completed</StatusPill>
                    ) : (
                      <StatusPill status="danger">Refunded</StatusPill>
                    )}
                  </Td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ SUPPLIERS TAB ============
function SuppliersTab() {
  const { openModal, pushToast, setPage } = useAppStore();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage supplier relationships and purchase orders</p>
        <Button
          size="sm"
          className="h-8 text-xs bg-brand-600 hover:bg-brand-700"
          onClick={() => setPage("suppliers")}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Supplier
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {SUPPLIERS.map((sup, i) => (
          <motion.div
            key={sup.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            whileHover={{ y: -2 }}
          >
            <Card className="border-border/60 shadow-soft hover:shadow-premium transition-all rounded-xl p-4 h-full">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500/15 to-brand-500/5 text-brand-600 flex items-center justify-center">
                  <Package className="h-5 w-5" />
                </div>
                <StatusPill status={sup.status === "active" ? "success" : "warning"}>
                  {sup.status === "active" ? "Active" : "Pending"}
                </StatusPill>
              </div>
              <p className="text-sm font-semibold text-foreground">{sup.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sup.category}</p>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Items</p>
                  <p className="font-semibold mt-0.5">{sup.items}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Last Order</p>
                  <p className="font-semibold mt-0.5 tabular-nums">{sup.lastOrder}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Rating</p>
                  <p className="font-semibold mt-0.5 flex items-center gap-0.5">
                    <span className="text-amber-500">★</span> {sup.rating}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Contact</p>
                  <p className="font-medium mt-0.5 text-[10px] truncate">{sup.phone}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 h-8 text-xs"
                onClick={() => setPage("purchases")}
              >
                Create Purchase Order
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: string }) {
  return (
    <Card className="border-border/60 shadow-soft rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-lg font-bold tabular-nums">{value}</p>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
    </Card>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2.5">{children}</td>;
}
