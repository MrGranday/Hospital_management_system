"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Shield,
  CheckCircle2, RotateCcw, Pill, Package, User, Calendar, FlaskConical, Wallet,
  BedDouble, UserCog, FileText, AlertTriangle, Stethoscope, Activity,
  Syringe, Microscope, Smile, Send, Printer, DollarSign,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { MEDICINES, PATIENTS, DOCTORS, DEPARTMENTS, type Patient } from "@/_legacy/mock-data/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { printInvoice, printReceipt, printPrescription, printLabReport } from "@/lib/print";

const money = (n: number) => `$${n.toFixed(2)}`;

const SUPPLIERS = ["PharmaCorp Inc.", "GlobePharma Ltd.", "MediLabs Supplies", "RespiraCare", "DiabeCare Products", "MedEquip Services"];

// Lab test catalog with realistic prices
const LAB_TEST_CATALOG: { name: string; type: string; price: number }[] = [
  { name: "Complete Blood Count (CBC)", type: "Hematology", price: 35 },
  { name: "Lipid Panel", type: "Chemistry", price: 65 },
  { name: "Basic Metabolic Panel (BMP)", type: "Chemistry", price: 55 },
  { name: "HbA1c", type: "Chemistry", price: 70 },
  { name: "TSH (Thyroid)", type: "Chemistry", price: 80 },
  { name: "Liver Function Test (LFT)", type: "Chemistry", price: 95 },
  { name: "Urinalysis", type: "Microbiology", price: 25 },
  { name: "Blood Glucose (Fasting)", type: "Chemistry", price: 20 },
  { name: "ESR", type: "Hematology", price: 30 },
  { name: "PT/INR", type: "Hematology", price: 45 },
  { name: "Troponin I", type: "Chemistry", price: 110 },
  { name: "D-Dimer", type: "Hematology", price: 90 },
  { name: "C-Reactive Protein (CRP)", type: "Chemistry", price: 60 },
  { name: "Vitamin D", type: "Chemistry", price: 120 },
  { name: "Hemoglobin A1c", type: "Chemistry", price: 70 },
];

// Dental procedure catalog
const DENTAL_PROCEDURES: { name: string; price: number }[] = [
  { name: "Routine Cleaning (Prophylaxis)", price: 120 },
  { name: "Dental Examination", price: 80 },
  { name: "Dental X-Ray (Bitewing)", price: 60 },
  { name: "Panoramic X-Ray", price: 150 },
  { name: "Tooth Filling (Composite)", price: 250 },
  { name: "Tooth Filling (Amalgam)", price: 180 },
  { name: "Root Canal Treatment", price: 1100 },
  { name: "Tooth Extraction (Simple)", price: 200 },
  { name: "Tooth Extraction (Surgical)", price: 400 },
  { name: "Crown Placement", price: 1300 },
  { name: "Bridge (Per Unit)", price: 1500 },
  { name: "Dental Implant", price: 4500 },
  { name: "Teeth Whitening", price: 500 },
  { name: "Deep Cleaning (Scaling/Root Planing)", price: 350 },
  { name: "Fluoride Treatment", price: 50 },
];

const TOOTH_NUMBERS = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16",
  "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32",
];

// Clinical procedures catalog
const CLINICAL_PROCEDURES: { name: string; dept: string; price: number }[] = [
  { name: "Electrocardiogram (ECG)", dept: "Cardiology", price: 150 },
  { name: "Echocardiography", dept: "Cardiology", price: 800 },
  { name: "Stress Test (TMT)", dept: "Cardiology", price: 450 },
  { name: "Cardiac Catheterization", dept: "Cardiology", price: 3500 },
  { name: "Endoscopy (Upper GI)", dept: "Gastroenterology", price: 1200 },
  { name: "Colonoscopy", dept: "Gastroenterology", price: 1800 },
  { name: "Bronchoscopy", dept: "Pulmonology", price: 2200 },
  { name: "EEG", dept: "Neurology", price: 600 },
  { name: "EMG (Nerve Conduction)", dept: "Neurology", price: 700 },
  { name: "Lumbar Puncture", dept: "Neurology", price: 350 },
  { name: "Joint Injection", dept: "Orthopedics", price: 280 },
  { name: "Wound Debridement", dept: "General Surgery", price: 320 },
  { name: "Abscess Incision & Drainage", dept: "General Surgery", price: 250 },
  { name: "Suture Removal", dept: "General Surgery", price: 80 },
  { name: "Skin Biopsy", dept: "Dermatology", price: 220 },
  { name: "Cryotherapy", dept: "Dermatology", price: 180 },
];

// === ModalHost ===
export function ModalHost() {
  const { activeModal, closeModal, toasts, dismissToast } = useAppStore();
  return (
    <>
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activeModal === "pos" && <POSModal key="pos" onClose={closeModal} />}
        {activeModal === "return" && <ReturnModal key="ret" onClose={closeModal} />}
        {activeModal === "newPrescription" && <NewPrescriptionModal key="rx" onClose={closeModal} />}
        {activeModal === "newPurchaseOrder" && <PurchaseOrderModal key="po" onClose={closeModal} />}
        {activeModal === "receiveGoods" && <ReceiveGoodsModal key="rg" onClose={closeModal} />}
        {activeModal === "newPurchaseReturn" && <PurchaseReturnModal key="pr" onClose={closeModal} />}
        {activeModal === "newSupplier" && <SupplierModal key="sup" onClose={closeModal} />}
        {activeModal === "newBloodDonation" && <BloodDonationModal key="bd" onClose={closeModal} />}
        {activeModal === "newDonor" && <DonorModal key="dnr" onClose={closeModal} />}
        {activeModal === "newTransfusion" && <TransfusionModal key="tx" onClose={closeModal} />}
        {activeModal === "restock" && <RestockModal key="rs" onClose={closeModal} />}
        {activeModal === "adjustStock" && <AdjustStockModal key="as" onClose={closeModal} />}
        {activeModal === "newPatient" && <NewPatientModal key="np" onClose={closeModal} />}
        {activeModal === "newInvoice" && <NewInvoiceModal key="ni" onClose={closeModal} />}
        {activeModal === "newAppointment" && <NewAppointmentModal key="na" onClose={closeModal} />}
        {activeModal === "newLabOrder" && <NewLabOrderModal key="nl" onClose={closeModal} />}
        {activeModal === "newExpense" && <NewExpenseModal key="ne" onClose={closeModal} />}
        {activeModal === "admitPatient" && <AdmitPatientModal key="ap" onClose={closeModal} />}
        {activeModal === "newStaff" && <NewStaffModal key="ns" onClose={closeModal} />}
      {activeModal === "newNote" && <NewNoteModal key="nn" onClose={closeModal} />}
        {activeModal === "collectPayment" && <CollectPaymentModal key="cp" onClose={closeModal} />}
        {activeModal === "viewLabResult" && <LabResultModal key="vr" onClose={closeModal} />}
      </AnimatePresence>
      <ToastStack toasts={toasts} dismissToast={dismissToast} />
    </>
  );
}

function ToastStack({ toasts, dismissToast }: { toasts: any[]; dismissToast: (id: string) => void }) {
  const icons: Record<string, React.ElementType> = { success: CheckCircle2, warning: AlertTriangle, info: FileText, danger: AlertTriangle };
  const colors: Record<string, string> = { success: "border-emerald-200 bg-emerald-50", warning: "border-amber-200 bg-amber-50", info: "border-brand-200 bg-brand-50", danger: "border-rose-200 bg-rose-50" };
  const iconColors: Record<string, string> = { success: "text-emerald-600", warning: "text-amber-600", info: "text-brand-600", danger: "text-rose-600" };
  return (
    <div className="fixed top-4 right-4 z-[200] space-y-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.variant] || CheckCircle2;
          return (
            <motion.div key={t.id} initial={{ opacity: 0, x: 50, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 50, scale: 0.9 }} className={cn("pointer-events-auto rounded-xl border shadow-premium p-4 flex items-start gap-3", colors[t.variant])}>
              <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", iconColors[t.variant])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
              </div>
              <button onClick={() => dismissToast(t.id)} className="text-muted-foreground hover:text-foreground shrink-0"><X className="h-4 w-4" /></button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// === ModalShell ===
function ModalShell({ title, subtitle, icon: Icon, iconClass, onClose, children, footer, size = "md" }: any) {
  const sizes: Record<string, string> = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-5xl" };
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
      <div className={cn("w-full bg-card rounded-2xl shadow-premium border border-border overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]", sizes[size])}>
        <div className="p-5 border-b border-border flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconClass || "bg-brand-50 text-brand-600")}><Icon className="h-5 w-5" /></div>
            <div><h2 className="text-lg font-semibold">{title}</h2>{subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="p-4 border-t border-border bg-accent/20">{footer}</div>}
      </div>
    </motion.div>
  );
}

function SubmitFooter({ onClose, onSubmit, label, icon: Icon, disabled }: any) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button className="bg-brand-600 hover:bg-brand-700" onClick={onSubmit} disabled={disabled}>{Icon && <Icon className="h-4 w-4 mr-1.5" />}{label}</Button>
    </div>
  );
}

// Combined patient list (live + static)
function useAllPatients(): Patient[] {
  const livePatients = useAppStore((s) => s.livePatients);
  return useMemo(() => [...livePatients, ...PATIENTS], [livePatients]);
}

// === POS Modal ===
function POSModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, logActivity, addSale, medicineStock } = useAppStore();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customer, setCustomer] = useState("");
  const [payment, setPayment] = useState<"Cash" | "Card" | "Insurance">("Cash");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return !q ? MEDICINES : MEDICINES.filter((m) => m.name.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q));
  }, [search]);

  const cartItems = useMemo(() => Object.entries(cart).map(([id, qty]) => {
    const med = MEDICINES.find((m) => m.id === id);
    return med ? { medicineId: id, name: med.name, qty, price: med.price } : null;
  }).filter(Boolean) as any[], [cart]);

  const subtotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleSubmit = () => {
    if (cartItems.length === 0) { pushToast({ title: "Cart is empty", description: "Add at least one medicine", variant: "warning" }); return; }
    // Check stock availability
    for (const item of cartItems) {
      const stock = medicineStock[item.medicineId] ?? 0;
      if (item.qty > stock) {
        const med = MEDICINES.find((m) => m.id === item.medicineId);
        pushToast({ title: "Insufficient stock", description: `${med?.name}: requested ${item.qty}, available ${stock}`, variant: "danger" });
        return;
      }
    }
    const cust = customer.trim() || "Walk-in Customer";
    const saleRecord = addSale({ customer: cust, items: cartItems, subtotal, tax, total, paymentMethod: payment });
    logActivity({ action: "Completed pharmacy sale", category: "pharmacy", details: `${saleRecord.number} · ${cartItems.length} items · ${money(total)} via ${payment} — ${cust}` });
    pushToast({ title: "Sale Completed ✓", description: `${saleRecord.number} · ${money(total)} — invoice sent to Billing`, variant: "success" });
    printReceipt({ invoice: saleRecord.number, customer: cust, time: saleRecord.time, paymentMethod: payment, items: cartItems.map((i: any) => ({ name: i.name, qty: i.qty, price: i.price })), total });
    closeModal();
  };

  return (
    <ModalShell title="Point of Sale" subtitle="Ring up a pharmacy sale" icon={ShoppingCart} iconClass="bg-brand-50 text-brand-600" size="xl" onClose={onClose}
      footer={<div className="flex items-center justify-between gap-4"><div className="text-sm"><span className="text-muted-foreground">Total: </span><span className="text-xl font-bold tabular-nums">{money(total)}</span></div><div className="flex gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button className="bg-brand-600 hover:bg-brand-700" onClick={handleSubmit} disabled={cartItems.length === 0}><CheckCircle2 className="h-4 w-4 mr-1.5" />Complete Sale</Button></div></div>}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" autoFocus /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
            {filtered.map((med) => {
              const stock = medicineStock[med.id] ?? med.stock;
              return (
                <button key={med.id} onClick={() => setCart((c) => ({ ...c, [med.id]: (c[med.id] ?? 0) + 1 }))} disabled={stock <= 0} className="text-left p-3 rounded-lg border border-border bg-card hover:border-brand-300 hover:bg-brand-50/30 transition-all disabled:opacity-50">
                  <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-sm font-semibold truncate">{med.name}</p><p className="text-[11px] text-muted-foreground">{med.generic}</p></div><div className="text-right shrink-0"><p className="text-sm font-bold tabular-nums">${med.price.toFixed(2)}</p><p className={`text-[10px] ${stock <= med.minStock ? "text-rose-600 font-semibold" : "text-muted-foreground"}`}>{stock} {med.unit}</p></div></div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-3">
          <div><Label className="text-xs uppercase text-muted-foreground">Customer</Label><Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Walk-in Customer" className="h-9 mt-1" /></div>
          <div><Label className="text-xs uppercase text-muted-foreground">Payment Method</Label><div className="grid grid-cols-3 gap-1.5 mt-1">{(["Cash", "Card", "Insurance"] as const).map((m) => { const Icon = m === "Cash" ? Banknote : m === "Card" ? CreditCard : Shield; return <button key={m} onClick={() => setPayment(m)} className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium", payment === m ? "border-brand-400 bg-brand-50 text-brand-700" : "border-border")}><Icon className="h-4 w-4" />{m}</button>; })}</div></div>
          <div><Label className="text-xs uppercase text-muted-foreground">Cart ({cartItems.length})</Label><div className="mt-1 space-y-1.5 max-h-[200px] overflow-y-auto">{cartItems.length === 0 ? <div className="text-center py-8 text-xs text-muted-foreground"><ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />Cart is empty</div> : cartItems.map((item) => (<div key={item.medicineId} className="flex items-center gap-2 p-2 rounded-lg bg-accent/40"><div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{item.name}</p><p className="text-[10px] text-muted-foreground">${item.price.toFixed(2)} × {item.qty}</p></div><div className="flex items-center gap-1"><button onClick={() => setCart((c) => { const n = { ...c }; if (n[item.medicineId] > 1) n[item.medicineId]--; else delete n[item.medicineId]; return n; })} className="w-6 h-6 rounded-md bg-card border flex items-center justify-center"><Minus className="h-3 w-3" /></button><span className="text-xs font-semibold w-6 text-center">{item.qty}</span><button onClick={() => setCart((c) => ({ ...c, [item.medicineId]: c[item.medicineId] + 1 }))} className="w-6 h-6 rounded-md bg-card border flex items-center justify-center"><Plus className="h-3 w-3" /></button><button onClick={() => setCart((c) => { const n = { ...c }; delete n[item.medicineId]; return n; })} className="w-6 h-6 rounded-md text-rose-600 flex items-center justify-center"><Trash2 className="h-3 w-3" /></button></div></div>))}</div></div>
          {cartItems.length > 0 && <div className="p-3 rounded-lg bg-accent/30 border space-y-1.5 text-xs"><div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">{money(subtotal)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Tax (8%)</span><span className="font-semibold">{money(tax)}</span></div><div className="h-px bg-border" /><div className="flex justify-between"><span className="font-semibold">Total</span><span className="font-bold text-base">{money(total)}</span></div></div>}
        </div>
      </div>
    </ModalShell>
  );
}

// === Return Modal ===
function ReturnModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, logActivity, addReturn, refundSale, sales } = useAppStore();
  const [medicine, setMedicine] = useState("");
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("Expired");
  const [supplier, setSupplier] = useState(SUPPLIERS[0]);
  const [returnType, setReturnType] = useState<"supplier" | "customer">("supplier");
  const [selectedSaleId, setSelectedSaleId] = useState("");

  const handleSubmit = () => {
    if (returnType === "supplier") {
      const med = MEDICINES.find((m) => m.id === medicine);
      if (!med) { pushToast({ title: "Select a medicine", variant: "warning" }); return; }
      const credit = med.price * parseInt(qty);
      addReturn({ saleNumber: "N/A", customer: supplier, amount: credit, reason: `${reason}: ${med.name} ×${qty}` });
      logActivity({ action: "Processed supplier return", category: "pharmacy", details: `${med.name} ×${qty} → ${supplier} (credit: ${money(credit)})` });
      pushToast({ title: "Return Processed ✓", description: `${med.name} ×${qty} → ${supplier}`, variant: "success" });
    } else {
      const sale = selectedSaleId ? sales.find((s) => s.id === selectedSaleId) : sales[0];
      if (!sale) { pushToast({ title: "No sale selected", description: "Select a sale to refund", variant: "warning" }); return; }
      if (sale.refunded) { pushToast({ title: "Already refunded", description: `${sale.number} was already refunded`, variant: "warning" }); return; }
      refundSale(sale.id);
      addReturn({ saleNumber: sale.number, customer: sale.customer, amount: sale.total, reason });
      logActivity({ action: "Processed customer return", category: "pharmacy", details: `${sale.number} refunded — ${money(sale.total)}` });
      pushToast({ title: "Customer Return ✓", description: `${sale.number} refunded — ${money(sale.total)}`, variant: "success" });
      printReceipt({ invoice: `REFUND-${sale.number}`, customer: sale.customer, time: new Date().toLocaleTimeString(), paymentMethod: sale.paymentMethod, items: sale.items.map((i: any) => ({ name: i.name, qty: -i.qty, price: i.price })), total: -sale.total });
    }
    closeModal();
  };

  return (
    <ModalShell title="Process Return" subtitle="Return items to supplier or process customer refund" icon={RotateCcw} iconClass="bg-amber-50 text-amber-600" onClose={onClose}
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label="Process Return" icon={RotateCcw} />}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setReturnType("supplier")} className={cn("p-3 rounded-lg border text-sm font-medium", returnType === "supplier" ? "border-brand-400 bg-brand-50 text-brand-700" : "border-border")}>Return to Supplier</button>
          <button onClick={() => setReturnType("customer")} className={cn("p-3 rounded-lg border text-sm font-medium", returnType === "customer" ? "border-brand-400 bg-brand-50 text-brand-700" : "border-border")}>Customer Refund</button>
        </div>
        {returnType === "supplier" ? (
          <>
            <div><Label className="text-xs uppercase text-muted-foreground">Medicine</Label><select value={medicine} onChange={(e) => setMedicine(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{MEDICINES.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs uppercase text-muted-foreground">Quantity</Label><Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="h-9 mt-1" /></div>
              <div><Label className="text-xs uppercase text-muted-foreground">Supplier</Label><select value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm">{SUPPLIERS.map((s) => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div><Label className="text-xs uppercase text-muted-foreground">Reason</Label><select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option>Expired</option><option>Damaged</option><option>Quality Issue</option><option>Overstocking</option><option>Supplier Error</option><option>Recall</option></select></div>
          </>
        ) : (
          <div className="space-y-3">
            <div><Label className="text-xs uppercase text-muted-foreground">Select Sale to Refund</Label>
              {sales.length === 0 ? (
                <div className="p-4 rounded-lg bg-accent/30 border border-border text-sm text-muted-foreground">No sales yet. Complete a sale first.</div>
              ) : (
                <select value={selectedSaleId} onChange={(e) => setSelectedSaleId(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm">
                  <option value="">Most recent sale</option>
                  {sales.map((s) => <option key={s.id} value={s.id} disabled={s.refunded}>{s.number} — {s.customer} — ${s.total.toFixed(2)}{s.refunded ? " (refunded)" : ""}</option>)}
                </select>
              )}
            </div>
            {sales.length > 0 && (
              <div className="p-4 rounded-lg bg-accent/30 border border-border">
                <p className="text-sm">Refunding: <strong>{(selectedSaleId ? sales.find(s => s.id === selectedSaleId) : sales[0])?.number}</strong></p>
                <p className="text-xs text-muted-foreground mt-1">Customer: {(selectedSaleId ? sales.find(s => s.id === selectedSaleId) : sales[0])?.customer} · Amount: {(() => { const s = selectedSaleId ? sales.find(x => x.id === selectedSaleId) : sales[0]; return s ? money(s.total) : "N/A"; })()}</p>
              </div>
            )}
            <div><Label className="text-xs uppercase text-muted-foreground">Reason</Label><select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option>Wrong medicine</option><option>Damaged product</option><option>Expired</option><option>Allergic reaction</option><option>Over-dispensing</option><option>Better alternative</option></select></div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// === New Prescription Modal ===
function NewPrescriptionModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, logActivity, addPrescription, modalContext } = useAppStore();
  const get = useAppStore.getState;
  const allPatients = useAllPatients();
  const [patient, setPatient] = useState<string>(modalContext?.patientId ?? "");
  const [doctor, setDoctor] = useState("");
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("BID");
  const [duration, setDuration] = useState("7 days");
  const [quantity, setQuantity] = useState("30");

  const handleSubmit = () => {
    const p = allPatients.find((x) => x.id === patient);
    if (!p || !medication) { pushToast({ title: "Missing details", description: "Patient and medication are required", variant: "warning" }); return; }
    const med = MEDICINES.find((m) => m.id === medication);
    if (!med) { pushToast({ title: "Select medication", variant: "warning" }); return; }
    const qty = parseInt(quantity) || 30;
    const rxTotal = med.price * qty;
    const rxNumber = `RX-${Date.now()}`;
    const items = [{ name: med.name, qty, dosage: `${dosage || med.generic} ${frequency} × ${duration}` }];
    addPrescription({ patientName: p.name, mrn: p.mrn, prescribedBy: doctor || get().user?.name || "Doctor", items, total: rxTotal, source: "EMR" });
    logActivity({ action: "Created prescription", category: "clinical", details: `${med.name} ${dosage} — ${p.name} → sent to Pharmacy` });
    pushToast({ title: "Prescription Created ✓", description: `${med.name} → ${p.name} — sent to Pharmacy`, variant: "success" });
    printPrescription({ number: rxNumber, patientName: p.name, mrn: p.mrn, date: new Date().toISOString(), doctorName: doctor || get().user?.name || "Doctor", items });
    closeModal();
  };

  return (
    <ModalShell title="New Prescription" subtitle="Issue a medication order" icon={Pill} iconClass="bg-brand-50 text-brand-600" size="lg" onClose={onClose}
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label="Create Prescription" icon={Pill} />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1"><Label className="text-xs uppercase text-muted-foreground">Patient</Label><select value={patient} onChange={(e) => setPatient(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{allPatients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>)}</select></div>
        <div className="col-span-2 md:col-span-1"><Label className="text-xs uppercase text-muted-foreground">Doctor</Label><select value={doctor} onChange={(e) => setDoctor(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{DOCTORS.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Medication</Label><select value={medication} onChange={(e) => { setMedication(e.target.value); const med = MEDICINES.find((m) => m.id === e.target.value); if (med) setDosage(med.generic); }} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{MEDICINES.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.generic}) — ${m.price.toFixed(2)}</option>)}</select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Dosage</Label><Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g., 500mg" className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Frequency</Label><select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option>BID</option><option>TID</option><option>QID</option><option>OD</option><option>PRN</option></select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Duration</Label><Input value={duration} onChange={(e) => setDuration(e.target.value)} className="h-9 mt-1" /></div>
        <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Dispense Quantity</Label><Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-9 mt-1" /></div>
      </div>
    </ModalShell>
  );
}

// === New Invoice Modal (Context-Aware Billing) ===
function NewInvoiceModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, logActivity, addInvoice, modalContext } = useAppStore();
  const get = useAppStore.getState;
  const allPatients = useAllPatients();
  const [serviceType, setServiceType] = useState<string>("");
  const [patient, setPatient] = useState<string>(modalContext?.patientId ?? "");
  // Consultation / OPD fields
  const [doctor, setDoctor] = useState("");
  const [consultType, setConsultType] = useState("New");
  const [consultDate, setConsultDate] = useState(new Date().toISOString().slice(0, 10));
  const [consultFee, setConsultFee] = useState("250");
  // Lab fields
  const [testName, setTestName] = useState("");
  const [testType, setTestType] = useState("Hematology");
  const [orderingDoc, setOrderingDoc] = useState("");
  const [sampleInfo, setSampleInfo] = useState("");
  const [testPrice, setTestPrice] = useState("");
  // Pharmacy fields
  const [medicine, setMedicine] = useState("");
  const [batch, setBatch] = useState("");
  const [expiry, setExpiry] = useState("");
  const [pharmQty, setPharmQty] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [taxPct, setTaxPct] = useState("0");
  // Dental fields
  const [dentist, setDentist] = useState("");
  const [toothNums, setToothNums] = useState<string>("");
  const [dentalProc, setDentalProc] = useState("");
  const [dentalSession, setDentalSession] = useState("1");
  const [dentalFee, setDentalFee] = useState("");
  // Procedure fields
  const [procName, setProcName] = useState("");
  const [provider, setProvider] = useState("");
  const [procDate, setProcDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessions, setSessions] = useState("1");
  const [procPrice, setProcPrice] = useState("");
  // Room fields
  const [ward, setWard] = useState("");
  const [roomType, setRoomType] = useState("General");
  const [days, setDays] = useState("1");
  const [dailyRate, setDailyRate] = useState("1000");
  // Other
  const [desc, setDesc] = useState("");
  const [otherQty, setOtherQty] = useState("1");
  const [otherPrice, setOtherPrice] = useState("");

  const { amount, items, department, source } = useMemo(() => {
    const p = allPatients.find((x) => x.id === patient);
    if (!p || !serviceType) return { amount: 0, items: [] as any[], department: "", source: "Manual" as const };
    if (serviceType === "Consultation") {
      const fee = Number(consultFee) || 0;
      const docName = doctor || "Assigned Provider";
      return { amount: fee, items: [{ description: `${consultType} Consultation — ${docName} (${consultDate})`, qty: 1, rate: fee, total: fee }], department: "OPD", source: "Manual" as const };
    }
    if (serviceType === "Laboratory") {
      const price = Number(testPrice) || 0;
      const sampleTxt = sampleInfo ? ` · Sample: ${sampleInfo}` : "";
      return { amount: price, items: [{ description: `Lab Test: ${testName} (${testType}) — Ordered by ${orderingDoc || "N/A"}${sampleTxt}`, qty: 1, rate: price, total: price }], department: "Laboratory", source: "Lab" as const };
    }
    if (serviceType === "Pharmacy") {
      const qty = Number(pharmQty) || 1;
      const price = Number(unitPrice) || 0;
      const disc = Number(discount) || 0;
      const tax = Number(taxPct) || 0;
      const med = MEDICINES.find((m) => m.id === medicine);
      const subtotal = qty * price;
      const taxAmt = subtotal * (tax / 100);
      const total = subtotal - disc + taxAmt;
      const medName = med?.name ?? "Medication";
      const expiryTxt = expiry ? ` · Exp: ${expiry}` : "";
      return { amount: total, items: [{ description: `${medName} (Batch: ${batch || "N/A"}${expiryTxt})`, qty, rate: price, total }], department: "Pharmacy", source: "Pharmacy" as const };
    }
    if (serviceType === "Dental") {
      const sess = Number(dentalSession) || 1;
      const fee = Number(dentalFee) || 0;
      const total = sess * fee;
      const teeth = toothNums.trim() ? ` · Teeth: ${toothNums}` : "";
      return { amount: total, items: [{ description: `Dental: ${dentalProc || "Procedure"} — ${dentist || "Dentist"}${teeth} (${sess} session(s))`, qty: sess, rate: fee, total }], department: "Dental", source: "Manual" as const };
    }
    if (serviceType === "Procedure") {
      const sess = Number(sessions) || 1;
      const price = Number(procPrice) || 0;
      const total = sess * price;
      return { amount: total, items: [{ description: `${procName} — ${provider || "Provider"} on ${procDate} (${sess} session(s))`, qty: sess, rate: price, total }], department: "Procedures", source: "Manual" as const };
    }
    if (serviceType === "Room Charge") {
      const d = Number(days) || 1;
      const rate = Number(dailyRate) || 0;
      const total = d * rate;
      return { amount: total, items: [{ description: `${roomType} Room — ${ward} (${d} day(s) @ ${money(rate)}/day)`, qty: d, rate, total }], department: "IPD", source: "IPD" as const };
    }
    const qty = Number(otherQty) || 1;
    const price = Number(otherPrice) || 0;
    return { amount: qty * price, items: [{ description: desc || "Service", qty, rate: price, total: qty * price }], department: "Other", source: "Manual" as const };
  }, [serviceType, patient, consultFee, consultType, doctor, consultDate, testName, testType, testPrice, orderingDoc, sampleInfo, medicine, batch, expiry, pharmQty, unitPrice, discount, taxPct, dentist, toothNums, dentalProc, dentalSession, dentalFee, procName, provider, procDate, sessions, procPrice, ward, roomType, days, dailyRate, desc, otherQty, otherPrice, allPatients]);

  const handleSubmit = () => {
    const p = allPatients.find((x) => x.id === patient);
    if (!p) { pushToast({ title: "Select a patient", variant: "warning" }); return; }
    if (!serviceType) { pushToast({ title: "Select service type", variant: "warning" }); return; }
    if (amount <= 0) { pushToast({ title: "Amount must be greater than 0", variant: "warning" }); return; }
    // Service-specific validation
    if (serviceType === "Laboratory" && !testName.trim()) { pushToast({ title: "Test name is required", variant: "warning" }); return; }
    if (serviceType === "Pharmacy" && !medicine) { pushToast({ title: "Select a medicine", variant: "warning" }); return; }
    if (serviceType === "Dental" && !dentalProc) { pushToast({ title: "Select a dental procedure", variant: "warning" }); return; }
    if (serviceType === "Procedure" && !procName.trim()) { pushToast({ title: "Procedure name is required", variant: "warning" }); return; }
    if (serviceType === "Room Charge" && !ward) { pushToast({ title: "Select a ward", variant: "warning" }); return; }
    if (serviceType === "Other" && !desc.trim()) { pushToast({ title: "Description is required", variant: "warning" }); return; }

    get().addInvoice({ patientName: p.name, mrn: p.mrn, amount, paid: 0, department, items, source, serviceType });
    logActivity({ action: "Created invoice", category: "billing", details: `${p.name} — ${serviceType} — ${money(amount)} (${department})` });
    pushToast({ title: "Invoice Created ✓", description: `${p.name} — ${money(amount)} — visible in Billing`, variant: "success" });
    const newInvNumber = `INV-${Date.now()}`;
    printInvoice({ number: newInvNumber, patientName: p.name, mrn: p.mrn, date: new Date().toISOString(), department, items, amount, paid: 0 });
    closeModal();
  };

  const serviceTypes = [
    { key: "Consultation", label: "Consultation", icon: Stethoscope, color: "bg-brand-50 text-brand-600" },
    { key: "Laboratory", label: "Laboratory", icon: FlaskConical, color: "bg-amber-50 text-amber-600" },
    { key: "Pharmacy", label: "Pharmacy", icon: Pill, color: "bg-emerald-50 text-emerald-600" },
    { key: "Dental", label: "Dental", icon: Smile, color: "bg-cyan-50 text-cyan-600" },
    { key: "Procedure", label: "Procedure", icon: Activity, color: "bg-violet-50 text-violet-600" },
    { key: "Room Charge", label: "Room Charge", icon: BedDouble, color: "bg-rose-50 text-rose-600" },
    { key: "Other", label: "Other Service", icon: FileText, color: "bg-muted text-muted-foreground" },
  ];

  return (
    <ModalShell title="Create Invoice" subtitle="Context-aware billing — select service type first" icon={FileText} iconClass="bg-brand-50 text-brand-600" size="lg" onClose={onClose}
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label={`Create Invoice · ${money(amount)}`} icon={FileText} disabled={!serviceType || amount <= 0} />}>
      <div className="space-y-4">
        {/* Service Type Selector */}
        {!serviceType ? (
          <div>
            <Label className="text-xs uppercase text-muted-foreground mb-2 block">Select Service Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {serviceTypes.map((st) => (
                <button key={st.key} onClick={() => setServiceType(st.key)} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-brand-300 hover:bg-brand-50/30 transition-all">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", st.color)}><st.icon className="h-5 w-5" /></div>
                  <span className="text-sm font-medium">{st.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-brand-50 border border-brand-200">
            <span className="text-xs font-medium text-brand-700">Service: {serviceType}</span>
            <button onClick={() => setServiceType("")} className="text-xs text-brand-600 hover:underline ml-auto">Change</button>
          </div>
        )}

        {serviceType && (
          <>
            <div><Label className="text-xs uppercase text-muted-foreground">Patient</Label><select value={patient} onChange={(e) => setPatient(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select patient...</option>{allPatients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>)}</select></div>

            {serviceType === "Consultation" && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs uppercase text-muted-foreground">Doctor / Provider</Label><select value={doctor} onChange={(e) => setDoctor(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{DOCTORS.map((d) => <option key={d.id} value={d.name}>{d.name} — {d.specialty}</option>)}</select></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Consultation Type</Label><select value={consultType} onChange={(e) => setConsultType(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option>New</option><option>Follow-up</option><option>Emergency</option><option>Telemedicine</option></select></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Appointment Date</Label><Input type="date" value={consultDate} onChange={(e) => setConsultDate(e.target.value)} className="h-9 mt-1" /></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Consultation Fee ($)</Label><Input type="number" value={consultFee} onChange={(e) => setConsultFee(e.target.value)} className="h-9 mt-1" /></div>
                <div className="col-span-2 p-2 rounded-md bg-accent/40 text-[11px] text-muted-foreground">Quantity is automatically 1 — this is a single consultation visit.</div>
              </div>
            )}

            {serviceType === "Laboratory" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Test</Label><select value={testName} onChange={(e) => { setTestName(e.target.value); const t = LAB_TEST_CATALOG.find((x) => x.name === e.target.value); if (t) { setTestType(t.type); setTestPrice(t.price.toString()); } }} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select test or type custom...</option>{LAB_TEST_CATALOG.map((t) => <option key={t.name} value={t.name}>{t.name} ({t.type}) — ${t.price}</option>)}</select></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Test Type</Label><select value={testType} onChange={(e) => setTestType(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option>Hematology</option><option>Chemistry</option><option>Microbiology</option><option>Pathology</option><option>Immunology</option></select></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Ordering Doctor</Label><select value={orderingDoc} onChange={(e) => setOrderingDoc(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{DOCTORS.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Sample Info</Label><Input value={sampleInfo} onChange={(e) => setSampleInfo(e.target.value)} placeholder="e.g., Fasting blood, 5mL serum" className="h-9 mt-1" /></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Test Price ($)</Label><Input type="number" value={testPrice} onChange={(e) => setTestPrice(e.target.value)} className="h-9 mt-1" /></div>
                <div className="col-span-2 p-2 rounded-md bg-accent/40 text-[11px] text-muted-foreground">Quantity is automatically 1 — each test is performed once per order.</div>
              </div>
            )}

            {serviceType === "Pharmacy" && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs uppercase text-muted-foreground">Medicine</Label><select value={medicine} onChange={(e) => { setMedicine(e.target.value); const med = MEDICINES.find((m) => m.id === e.target.value); if (med) { setUnitPrice(med.price.toString()); setBatch(med.batch); setExpiry(med.expiry); } }} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{MEDICINES.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.generic})</option>)}</select></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Batch Number</Label><Input value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="e.g., BATCH-001" className="h-9 mt-1" /></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Expiration Date</Label><Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="h-9 mt-1" /></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Quantity</Label><Input type="number" value={pharmQty} onChange={(e) => setPharmQty(e.target.value)} className="h-9 mt-1" /></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Unit Price ($)</Label><Input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="h-9 mt-1" /></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Discount ($)</Label><Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="h-9 mt-1" /></div>
                <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Tax (%)</Label><Input type="number" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} className="h-9 mt-1" /></div>
              </div>
            )}

            {serviceType === "Dental" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Procedure</Label><select value={dentalProc} onChange={(e) => { setDentalProc(e.target.value); const p = DENTAL_PROCEDURES.find((x) => x.name === e.target.value); if (p) setDentalFee(p.price.toString()); }} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select procedure...</option>{DENTAL_PROCEDURES.map((p) => <option key={p.name} value={p.name}>{p.name} — ${p.price}</option>)}</select></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Dentist</Label><select value={dentist} onChange={(e) => setDentist(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{DOCTORS.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Sessions</Label><Input type="number" value={dentalSession} onChange={(e) => setDentalSession(e.target.value)} className="h-9 mt-1" /></div>
                <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Tooth Number(s) — comma separated</Label><Input value={toothNums} onChange={(e) => setToothNums(e.target.value)} placeholder="e.g., 3, 14, 19" className="h-9 mt-1" /><p className="text-[10px] text-muted-foreground mt-1">Universal numbering 1-32. Leave blank for full-mouth procedures.</p></div>
                <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Fee per Session ($)</Label><Input type="number" value={dentalFee} onChange={(e) => setDentalFee(e.target.value)} className="h-9 mt-1" /></div>
              </div>
            )}

            {serviceType === "Procedure" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Procedure</Label><select value={procName} onChange={(e) => { setProcName(e.target.value); const p = CLINICAL_PROCEDURES.find((x) => x.name === e.target.value); if (p) { setProcPrice(p.price.toString()); setProvider(""); } }} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select procedure or type custom...</option>{CLINICAL_PROCEDURES.map((p) => <option key={p.name} value={p.name}>{p.name} ({p.dept}) — ${p.price}</option>)}</select></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Performing Provider</Label><select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{DOCTORS.map((d) => <option key={d.id} value={d.name}>{d.name} — {d.specialty}</option>)}</select></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Date</Label><Input type="date" value={procDate} onChange={(e) => setProcDate(e.target.value)} className="h-9 mt-1" /></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Sessions / Duration</Label><Input type="number" value={sessions} onChange={(e) => setSessions(e.target.value)} className="h-9 mt-1" /></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Price per Session ($)</Label><Input type="number" value={procPrice} onChange={(e) => setProcPrice(e.target.value)} className="h-9 mt-1" /></div>
              </div>
            )}

            {serviceType === "Room Charge" && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs uppercase text-muted-foreground">Ward</Label><select value={ward} onChange={(e) => setWard(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option><option>ICU</option><option>CCU</option><option>General Ward A</option><option>General Ward B</option><option>Pediatric</option><option>Maternity</option></select></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Room Type</Label><select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option>General</option><option>Private</option><option>Semi-Private</option><option>ICU</option><option>Suite</option></select></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Days</Label><Input type="number" value={days} onChange={(e) => setDays(e.target.value)} className="h-9 mt-1" /></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Daily Rate ($)</Label><Input type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} className="h-9 mt-1" /></div>
              </div>
            )}

            {serviceType === "Other" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Description</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Service description" className="h-9 mt-1" /></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Quantity</Label><Input type="number" value={otherQty} onChange={(e) => setOtherQty(e.target.value)} className="h-9 mt-1" /></div>
                <div><Label className="text-xs uppercase text-muted-foreground">Unit Price ($)</Label><Input type="number" value={otherPrice} onChange={(e) => setOtherPrice(e.target.value)} className="h-9 mt-1" /></div>
              </div>
            )}

            {/* Live total */}
            {amount > 0 && (
              <div className="p-3 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-between">
                <span className="text-sm text-brand-700">Total Amount:</span>
                <span className="text-lg font-bold text-brand-700 tabular-nums">{money(amount)}</span>
              </div>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}

// === New Lab Order Modal ===
function NewLabOrderModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, logActivity, addLabOrder, addInvoice, modalContext } = useAppStore();
  const get = useAppStore.getState;
  const allPatients = useAllPatients();
  const [patient, setPatient] = useState<string>(modalContext?.patientId ?? "");
  const [doctor, setDoctor] = useState("");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [priority, setPriority] = useState<"routine" | "urgent" | "stat">("routine");

  const toggleTest = (name: string) => {
    setSelectedTests((prev) => prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]);
  };

  const totalCost = selectedTests.reduce((sum, name) => {
    const t = LAB_TEST_CATALOG.find((x) => x.name === name);
    return sum + (t?.price ?? 0);
  }, 0);

  const handleSubmit = () => {
    const p = allPatients.find((x) => x.id === patient);
    if (!p) { pushToast({ title: "Select patient", variant: "warning" }); return; }
    if (selectedTests.length === 0) { pushToast({ title: "Select at least one test", variant: "warning" }); return; }
    addLabOrder({ patientName: p.name, mrn: p.mrn, orderedBy: doctor || get().user?.name || "Doctor", tests: selectedTests, priority, source: "EMR" });
    addInvoice({
      patientName: p.name, mrn: p.mrn, amount: totalCost, paid: 0, department: "Laboratory",
      items: selectedTests.map((name) => { const t = LAB_TEST_CATALOG.find((x) => x.name === name); return { description: `Lab Test: ${name}`, qty: 1, rate: t?.price ?? 0, total: t?.price ?? 0 }; }),
      source: "Lab", serviceType: "Laboratory",
    });
    logActivity({ action: "Placed lab order", category: "clinical", details: `${selectedTests.length} test(s) for ${p.name} → sent to Lab & Billing` });
    pushToast({ title: "Lab Order Placed ✓", description: `${selectedTests.length} test(s) for ${p.name} — invoice ${money(totalCost)} sent to Billing`, variant: "success" });
    closeModal();
  };

  return (
    <ModalShell title="New Lab Order" subtitle="Order lab tests for a patient" icon={FlaskConical} iconClass="bg-violet-50 text-violet-600" size="lg" onClose={onClose}
      footer={<div className="flex items-center justify-between gap-4"><div className="text-sm"><span className="text-muted-foreground">Total: </span><span className="font-bold tabular-nums">{money(totalCost)}</span></div><SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label="Place Lab Order" icon={FlaskConical} /></div>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label className="text-xs uppercase text-muted-foreground">Patient</Label><select value={patient} onChange={(e) => setPatient(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{allPatients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>)}</select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Ordering Doctor</Label><select value={doctor} onChange={(e) => setDoctor(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{DOCTORS.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Priority</Label><select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="routine">Routine</option><option value="urgent">Urgent</option><option value="stat">STAT</option></select></div>
        <div className="md:col-span-2">
          <Label className="text-xs uppercase text-muted-foreground">Tests (click to select)</Label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[260px] overflow-y-auto p-1 rounded-lg border border-border bg-card">
            {LAB_TEST_CATALOG.map((t) => (
              <button key={t.name} type="button" onClick={() => toggleTest(t.name)} className={cn("text-left p-2 rounded-md text-xs border transition-all", selectedTests.includes(t.name) ? "border-brand-400 bg-brand-50 text-brand-700" : "border-transparent hover:bg-accent")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">${t.price}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{t.type}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

// === Lab Result Viewer ===
function LabResultModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, logActivity, updateLabOrderStatus, modalContext } = useAppStore();
  const order = modalContext?.order;
  const [results, setResults] = useState<any[]>(
    order?.results ?? order?.tests?.map((t: string) => ({ name: t, result: "", range: "", flag: "normal" as const })) ?? []
  );

  if (!order) {
    return <ModalShell title="Lab Result" subtitle="No order selected" icon={FlaskConical} iconClass="bg-violet-50 text-violet-600" onClose={onClose} footer={<Button variant="outline" onClick={onClose}>Close</Button>}><p className="text-sm text-muted-foreground">No lab order selected.</p></ModalShell>;
  }

  const updateResult = (i: number, field: string, value: string) => {
    setResults((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value, flag: field === "result" ? autoFlag(value, r.range) : r.flag } : r));
  };

  const autoFlag = (result: string, range: string): "normal" | "high" | "low" => {
    const num = parseFloat(result);
    if (!num || !range) return "normal";
    const m = range.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
    if (!m) return "normal";
    const lo = parseFloat(m[1]); const hi = parseFloat(m[2]);
    if (num > hi) return "high";
    if (num < lo) return "low";
    return "normal";
  };

  const handleVerify = () => {
    updateLabOrderStatus(order.id, "verified", results);
    logActivity({ action: "Verified lab results", category: "clinical", details: `${order.number} — ${order.patientName}` });
    pushToast({ title: "Results Verified ✓", description: `${order.number} marked as verified`, variant: "success" });
    printLabReport({ number: order.number, patientName: order.patientName, mrn: order.mrn, date: new Date().toISOString(), orderedBy: order.orderedBy, tests: results });
    closeModal();
  };

  return (
    <ModalShell title="Lab Results" subtitle={`${order.number} — ${order.patientName}`} icon={FlaskConical} iconClass="bg-violet-50 text-violet-600" size="lg" onClose={onClose}
      footer={<div className="flex items-center justify-end gap-2"><Button variant="outline" onClick={onClose}>Close</Button><Button className="bg-brand-600 hover:bg-brand-700" onClick={handleVerify}><CheckCircle2 className="h-4 w-4 mr-1.5" />Verify & Print</Button></div>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground text-xs">Patient:</span> <span className="font-medium">{order.patientName}</span></div>
          <div><span className="text-muted-foreground text-xs">MRN:</span> <span className="font-mono">{order.mrn}</span></div>
          <div><span className="text-muted-foreground text-xs">Ordered by:</span> <span className="font-medium">{order.orderedBy}</span></div>
          <div><span className="text-muted-foreground text-xs">Priority:</span> <span className="font-medium uppercase">{order.priority}</span></div>
        </div>
        <div className="space-y-2">
          {results.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center p-2 rounded-md border border-border bg-card">
              <div className="col-span-4 text-sm font-medium">{r.name}</div>
              <div className="col-span-3"><Input placeholder="Result" value={r.result} onChange={(e) => updateResult(i, "result", e.target.value)} className="h-8 text-xs" /></div>
              <div className="col-span-3"><Input placeholder="Ref range (e.g. 4.0-11.0)" value={r.range} onChange={(e) => updateResult(i, "range", e.target.value)} className="h-8 text-xs" /></div>
              <div className="col-span-2">
                <select value={r.flag} onChange={(e) => updateResult(i, "flag", e.target.value)} className="w-full h-8 px-2 rounded-md border border-border bg-card text-xs">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

// === Purchase Order Modal ===
function PurchaseOrderModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, createPurchaseOrder, suppliers, modalContext } = useAppStore();
  const [supplierId, setSupplierId] = useState<string>(modalContext?.supplierId ?? suppliers[0]?.id ?? "");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Array<{
    medicineId: string; name: string; batchNo: string; expiryDate: string;
    orderedQty: number; freeQty: number; unitCost: number; discountPct: number; taxPct: number;
  }>>([
    { medicineId: "", name: "", batchNo: "", expiryDate: "", orderedQty: 0, freeQty: 0, unitCost: 0, discountPct: 0, taxPct: 0 },
  ]);

  const updateItem = (idx: number, patch: Partial<typeof items[0]>) => {
    setItems((arr) => arr.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };
  const addItem = () => setItems((arr) => [...arr, { medicineId: "", name: "", batchNo: "", expiryDate: "", orderedQty: 0, freeQty: 0, unitCost: 0, discountPct: 0, taxPct: 0 }]);
  const removeItem = (idx: number) => setItems((arr) => arr.filter((_, i) => i !== idx));

  const lineTotals = items.map((it) => {
    const gross = (it.orderedQty + it.freeQty) * it.unitCost;
    const afterDisc = gross * (1 - it.discountPct / 100);
    return Math.round(afterDisc * (1 + it.taxPct / 100) * 100) / 100;
  });
  const grandTotal = lineTotals.reduce((s, n) => s + n, 0);
  const subtotal = items.reduce((s, it) => s + (it.orderedQty + it.freeQty) * it.unitCost, 0);
  const discountTotal = items.reduce((s, it) => s + (it.orderedQty + it.freeQty) * it.unitCost * (it.discountPct / 100), 0);
  const taxTotal = items.reduce((s, it) => s + (it.orderedQty + it.freeQty) * it.unitCost * (1 - it.discountPct / 100) * (it.taxPct / 100), 0);

  const handleSubmit = () => {
    if (!supplierId) { pushToast({ title: "Select a supplier", variant: "warning" }); return; }
    const validItems = items.filter((it) => it.medicineId && it.orderedQty > 0);
    if (validItems.length === 0) { pushToast({ title: "Add at least one item", description: "Each item needs a medicine and ordered quantity > 0", variant: "warning" }); return; }
    const po = createPurchaseOrder({
      supplierId,
      expectedDate: expectedDate || undefined,
      notes: notes.trim() || undefined,
      items: validItems.map((it) => ({
        medicineId: it.medicineId, name: it.name, batchNo: it.batchNo || undefined, expiryDate: it.expiryDate || undefined,
        orderedQty: it.orderedQty, freeQty: it.freeQty, unitCost: it.unitCost, discountPct: it.discountPct, taxPct: it.taxPct,
      })),
    });
    if (po) closeModal();
  };

  return (
    <ModalShell title="New Purchase Order" subtitle="Create a multi-item purchase order with batch tracking" icon={Package} iconClass="bg-violet-50 text-violet-600" onClose={onClose} size="xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Subtotal: <span className="font-semibold text-foreground">{money(subtotal)}</span> ·
            Disc: <span className="font-semibold text-rose-600">-{money(discountTotal)}</span> ·
            Tax: <span className="font-semibold text-emerald-600">+{money(taxTotal)}</span> ·
            <span className="ml-2 text-brand-700 font-bold">Total: {money(grandTotal)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button className="bg-brand-600 hover:bg-brand-700" onClick={handleSubmit}><Package className="h-4 w-4 mr-1.5" /> Create PO</Button>
          </div>
        </div>
      }>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs uppercase text-muted-foreground">Supplier *</Label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm">
              {suppliers.filter((s) => s.status === "active").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs uppercase text-muted-foreground">Expected Date</Label>
            <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} className="h-9 mt-1" />
          </div>
          <div>
            <Label className="text-xs uppercase text-muted-foreground">Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="h-9 mt-1" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs uppercase text-muted-foreground">Line Items ({items.length})</Label>
            <Button variant="outline" size="sm" className="h-7" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add Item</Button>
          </div>
          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="rounded-lg border border-border p-3 bg-accent/10">
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 md:col-span-3">
                    <Label className="text-[10px] uppercase">Medicine *</Label>
                    <select value={it.medicineId} onChange={(e) => {
                      const m = MEDICINES.find((x) => x.id === e.target.value);
                      updateItem(idx, { medicineId: e.target.value, name: m?.name ?? "", unitCost: m ? Math.round(m.price * 0.6 * 100) / 100 : 0 });
                    }} className="w-full h-8 mt-1 px-2 rounded-md border border-border bg-card text-xs">
                      <option value="">Select...</option>
                      {MEDICINES.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <Label className="text-[10px] uppercase">Batch</Label>
                    <Input value={it.batchNo} onChange={(e) => updateItem(idx, { batchNo: e.target.value })} placeholder="AMX-2401" className="h-8 mt-1 text-xs" />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <Label className="text-[10px] uppercase">Expiry</Label>
                    <Input type="date" value={it.expiryDate} onChange={(e) => updateItem(idx, { expiryDate: e.target.value })} className="h-8 mt-1 text-xs" />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <Label className="text-[10px] uppercase">Order Qty</Label>
                    <Input type="number" min={0} value={it.orderedQty || ""} onChange={(e) => updateItem(idx, { orderedQty: parseInt(e.target.value) || 0 })} className="h-8 mt-1 text-xs" />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <Label className="text-[10px] uppercase">Free</Label>
                    <Input type="number" min={0} value={it.freeQty || ""} onChange={(e) => updateItem(idx, { freeQty: parseInt(e.target.value) || 0 })} className="h-8 mt-1 text-xs" />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <Label className="text-[10px] uppercase">Unit $</Label>
                    <Input type="number" step="0.01" value={it.unitCost || ""} onChange={(e) => updateItem(idx, { unitCost: parseFloat(e.target.value) || 0 })} className="h-8 mt-1 text-xs" />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <Label className="text-[10px] uppercase">Disc %</Label>
                    <Input type="number" min={0} max={100} value={it.discountPct || ""} onChange={(e) => updateItem(idx, { discountPct: parseFloat(e.target.value) || 0 })} className="h-8 mt-1 text-xs" />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <Label className="text-[10px] uppercase">Tax %</Label>
                    <Input type="number" min={0} value={it.taxPct || ""} onChange={(e) => updateItem(idx, { taxPct: parseFloat(e.target.value) || 0 })} className="h-8 mt-1 text-xs" />
                  </div>
                  <div className="col-span-3 md:col-span-1 text-right">
                    <Label className="text-[10px] uppercase">Total</Label>
                    <p className="text-sm font-semibold tabular-nums mt-1">{money(lineTotals[idx])}</p>
                  </div>
                  <div className="col-span-1 text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function ReceiveGoodsModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, receiveGoods, modalContext } = useAppStore();
  const po = modalContext?.po;
  const [receiveItems, setReceiveItems] = useState<Array<{ lineId: string; receivedQty: number; batchNo: string; expiryDate: string }>>(
    po ? po.items.filter((it: any) => it.receivedQty < it.orderedQty + it.freeQty).map((it: any) => ({
      lineId: it.id, receivedQty: 0, batchNo: it.batchNo ?? "", expiryDate: it.expiryDate ?? "",
    })) : []
  );
  const [notes, setNotes] = useState("");

  if (!po) {
    return <ModalShell title="Receive Goods" subtitle="No PO selected" icon={Package} iconClass="bg-emerald-50 text-emerald-600" onClose={onClose} footer={<Button variant="outline" onClick={onClose}>Close</Button>}><p className="text-sm text-muted-foreground">No purchase order selected.</p></ModalShell>;
  }

  const updateRecv = (idx: number, patch: Partial<typeof receiveItems[0]>) => {
    setReceiveItems((arr) => arr.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const handleSubmit = () => {
    const validItems = receiveItems.filter((it) => it.receivedQty > 0 && it.batchNo && it.expiryDate);
    if (validItems.length === 0) {
      pushToast({ title: "Nothing to receive", description: "Enter at least one received quantity with batch and expiry.", variant: "warning" });
      return;
    }
    // Validate that received qty doesn't exceed remaining
    for (const it of validItems) {
      const line = po.items.find((l: any) => l.id === it.lineId);
      if (line) {
        const remaining = (line.orderedQty + line.freeQty) - line.receivedQty;
        if (it.receivedQty > remaining) {
          pushToast({ title: "Quantity exceeds remaining", description: `${line.name}: max ${remaining} units.`, variant: "danger" });
          return;
        }
      }
    }
    const receipt = receiveGoods({ poId: po.id, items: validItems, notes: notes.trim() || undefined });
    if (receipt) closeModal();
  };

  return (
    <ModalShell title="Receive Goods" subtitle={`${po.number} — ${po.supplierName}`} icon={Package} iconClass="bg-emerald-50 text-emerald-600" onClose={onClose} size="xl"
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label="Receive & Update Stock" icon={CheckCircle2} />}>
      <div className="space-y-3">
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
          Enter received quantity (≤ remaining), batch number, and expiry date for each line. Inventory will be updated with full batch traceability.
        </div>
        {receiveItems.map((it, idx) => {
          const line = po.items.find((l: any) => l.id === it.lineId);
          if (!line) return null;
          const remaining = (line.orderedQty + line.freeQty) - line.receivedQty;
          return (
            <div key={it.lineId} className="rounded-lg border border-border p-3 bg-accent/10">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{line.name}</p>
                  <p className="text-[11px] text-muted-foreground">Ordered: {line.orderedQty} + {line.freeQty} free · Already received: {line.receivedQty} · Remaining: <span className="font-semibold text-brand-700">{remaining}</span></p>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  <Label className="text-[10px] uppercase">Receiving Qty</Label>
                  <Input type="number" min={0} max={remaining} value={it.receivedQty || ""} onChange={(e) => updateRecv(idx, { receivedQty: parseInt(e.target.value) || 0 })} className="h-8 mt-1 text-xs" />
                </div>
                <div className="col-span-4">
                  <Label className="text-[10px] uppercase">Batch No *</Label>
                  <Input value={it.batchNo} onChange={(e) => updateRecv(idx, { batchNo: e.target.value })} placeholder="AMX-2401" className="h-8 mt-1 text-xs" />
                </div>
                <div className="col-span-4">
                  <Label className="text-[10px] uppercase">Expiry *</Label>
                  <Input type="date" value={it.expiryDate} onChange={(e) => updateRecv(idx, { expiryDate: e.target.value })} className="h-8 mt-1 text-xs" />
                </div>
              </div>
            </div>
          );
        })}
        <div>
          <Label className="text-xs uppercase text-muted-foreground">Receiving Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes about this delivery..." className="mt-1" />
        </div>
      </div>
    </ModalShell>
  );
}

function PurchaseReturnModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, createPurchaseReturn, purchaseOrders, modalContext } = useAppStore();
  const eligiblePOs = purchaseOrders.filter((p) => p.items.some((it) => it.receivedQty - it.returnedQty > 0));
  const initialPoId = modalContext?.poId ?? eligiblePOs[0]?.id ?? "";
  const [poId, setPoId] = useState<string>(initialPoId);
  const [returnItems, setReturnItems] = useState<Array<{ poLineId: string; returnQty: number; reason: any; notes: string }>>(() => {
    const po = purchaseOrders.find((p) => p.id === initialPoId);
    if (!po) return [];
    return po.items.filter((it) => it.receivedQty - it.returnedQty > 0).map((it) => ({
      poLineId: it.id, returnQty: 0, reason: "damaged", notes: "",
    }));
  });
  const [notes, setNotes] = useState("");

  const selectedPO = purchaseOrders.find((p) => p.id === poId);

  // When PO changes, reset return items
  const updatePoId = (id: string) => {
    setPoId(id);
    const po = purchaseOrders.find((p) => p.id === id);
    if (po) {
      setReturnItems(po.items.filter((it) => it.receivedQty - it.returnedQty > 0).map((it) => ({
        poLineId: it.id, returnQty: 0, reason: "damaged", notes: "",
      })));
    } else {
      setReturnItems([]);
    }
  };

  const updateReturnItem = (idx: number, patch: Partial<typeof returnItems[0]>) => {
    setReturnItems((arr) => arr.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const totalCredit = returnItems.reduce((s, it) => {
    const line = selectedPO?.items.find((l) => l.id === it.poLineId);
    if (!line) return s;
    return s + it.returnQty * line.unitCost * (1 - line.discountPct / 100) * (1 + line.taxPct / 100);
  }, 0);

  const handleSubmit = () => {
    if (!poId) { pushToast({ title: "Select a PO", variant: "warning" }); return; }
    const valid = returnItems.filter((it) => it.returnQty > 0);
    if (valid.length === 0) { pushToast({ title: "Enter at least one return quantity", variant: "warning" }); return; }
    // Validate quantities
    for (const it of valid) {
      const line = selectedPO?.items.find((l) => l.id === it.poLineId);
      if (!line) continue;
      const maxReturnable = line.receivedQty - line.returnedQty;
      if (it.returnQty > maxReturnable) {
        pushToast({ title: "Return exceeds received", description: `${line.name}: max ${maxReturnable} units returnable.`, variant: "danger" });
        return;
      }
    }
    const ret = createPurchaseReturn({ poId, items: valid, notes: notes.trim() || undefined });
    if (ret) closeModal();
  };

  return (
    <ModalShell title="New Purchase Return" subtitle="Return received goods to supplier with full batch traceability" icon={RotateCcw} iconClass="bg-rose-50 text-rose-600" onClose={onClose} size="xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-muted-foreground">Total Credit: </span>
            <span className="font-bold text-emerald-700">{money(totalCredit)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button className="bg-brand-600 hover:bg-brand-700" onClick={handleSubmit}><RotateCcw className="h-4 w-4 mr-1.5" /> Submit Return</Button>
          </div>
        </div>
      }>
      <div className="space-y-4">
        {eligiblePOs.length === 0 ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            No eligible purchase orders. Returns can only be created against POs with received (and not-yet-returned) quantities.
          </div>
        ) : (
          <>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">From Purchase Order *</Label>
              <select value={poId} onChange={(e) => updatePoId(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm">
                {eligiblePOs.map((p) => <option key={p.id} value={p.id}>{p.number} — {p.supplierName} ({p.date})</option>)}
              </select>
            </div>

            {selectedPO && (
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Items to Return</Label>
                <div className="space-y-2 mt-1">
                  {returnItems.map((it, idx) => {
                    const line = selectedPO.items.find((l) => l.id === it.poLineId);
                    if (!line) return null;
                    const maxReturnable = line.receivedQty - line.returnedQty;
                    return (
                      <div key={it.poLineId} className="rounded-lg border border-border p-3 bg-accent/10">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium">{line.name}</p>
                            <p className="text-[11px] text-muted-foreground">Batch {line.batchNo ?? "—"} · Exp {line.expiryDate ?? "—"} · Received: {line.receivedQty} · Already returned: {line.returnedQty} · Max returnable: <span className="font-semibold text-rose-600">{maxReturnable}</span></p>
                          </div>
                        </div>
                        <div className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-3">
                            <Label className="text-[10px] uppercase">Return Qty</Label>
                            <Input type="number" min={0} max={maxReturnable} value={it.returnQty || ""} onChange={(e) => updateReturnItem(idx, { returnQty: parseInt(e.target.value) || 0 })} className="h-8 mt-1 text-xs" />
                          </div>
                          <div className="col-span-4">
                            <Label className="text-[10px] uppercase">Reason</Label>
                            <select value={it.reason} onChange={(e) => updateReturnItem(idx, { reason: e.target.value })} className="w-full h-8 mt-1 px-2 rounded-md border border-border bg-card text-xs">
                              <option value="damaged">Damaged Product</option>
                              <option value="expired">Expired Product</option>
                              <option value="near_expiry">Near-Expiry</option>
                              <option value="incorrect_product">Incorrect Product</option>
                              <option value="wrong_quantity">Wrong Quantity</option>
                              <option value="supplier_issue">Supplier Issue</option>
                              <option value="quality_issue">Quality Issue</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div className="col-span-5">
                            <Label className="text-[10px] uppercase">Line Notes</Label>
                            <Input value={it.notes} onChange={(e) => updateReturnItem(idx, { notes: e.target.value })} placeholder="Optional" className="h-8 mt-1 text-xs" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {returnItems.length === 0 && <p className="text-xs text-muted-foreground">No items eligible for return on this PO.</p>}
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs uppercase text-muted-foreground">Return Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional overall notes..." className="mt-1" />
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}

function SupplierModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, addSupplier } = useAppStore();
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [categories, setCategories] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) { pushToast({ title: "Name is required", variant: "warning" }); return; }
    addSupplier({
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      paymentTerms: paymentTerms.trim(),
      categories: categories.split(",").map((c) => c.trim()).filter(Boolean),
    });
    closeModal();
  };

  return (
    <ModalShell title="Add Supplier" subtitle="Create a new vendor record" icon={Package} iconClass="bg-teal-50 text-teal-600" onClose={onClose}
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label="Add Supplier" icon={Plus} />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Supplier Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Contact Person</Label><Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Payment Terms</Label><Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="h-9 mt-1" /></div>
        <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Address</Label><Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="mt-1" /></div>
        <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Categories (comma-separated)</Label><Input value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="Antibiotic, PPI" className="h-9 mt-1" /></div>
      </div>
    </ModalShell>
  );
}

function BloodDonationModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, bloodDonors, recordDonation } = useAppStore();
  const [donorId, setDonorId] = useState("");
  const [component, setComponent] = useState<"whole_blood" | "rbc" | "plasma" | "platelets" | "cryoprecipitate">("whole_blood");
  const [volume, setVolume] = useState("450");
  const [location, setLocation] = useState("Cold Room 1");
  const [notes, setNotes] = useState("");

  const donor = bloodDonors.find((d) => d.id === donorId);

  const handleSubmit = () => {
    if (!donorId || !donor) { pushToast({ title: "Select a donor", variant: "warning" }); return; }
    if (donor.status !== "eligible") { pushToast({ title: "Donor not eligible", description: `Status: ${donor.status}. ${donor.notes ?? ""}`, variant: "danger" }); return; }
    const vol = parseInt(volume);
    if (!vol || vol <= 0) { pushToast({ title: "Invalid volume", variant: "warning" }); return; }
    const bag = recordDonation({ donorId, bloodType: donor.bloodType, component, volume: vol, location, notes: notes.trim() || undefined });
    if (bag) closeModal();
  };

  return (
    <ModalShell title="Record Blood Donation" subtitle="Log a new donation and add bag to inventory" icon={Syringe} iconClass="bg-rose-50 text-rose-600" onClose={onClose}
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label="Record Donation" icon={CheckCircle2} />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs uppercase text-muted-foreground">Donor *</Label>
          <select value={donorId} onChange={(e) => setDonorId(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm">
            <option value="">Select...</option>
            {bloodDonors.map((d) => <option key={d.id} value={d.id} disabled={d.status !== "eligible"}>{d.name} ({d.bloodType}) — {d.status}{d.status !== "eligible" ? " [not eligible]" : ""}</option>)}
          </select>
        </div>
        {donor && (
          <div className="col-span-2 rounded-lg bg-accent/30 p-3 text-xs">
            <p><strong>{donor.name}</strong> — Blood type <strong>{donor.bloodType}</strong> · Total donations: {donor.totalDonations} · Last: {donor.lastDonationDate ?? "Never"}</p>
          </div>
        )}
        <div>
          <Label className="text-xs uppercase text-muted-foreground">Component</Label>
          <select value={component} onChange={(e) => setComponent(e.target.value as any)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm">
            <option value="whole_blood">Whole Blood</option>
            <option value="rbc">Red Blood Cells</option>
            <option value="plasma">Fresh Frozen Plasma</option>
            <option value="platelets">Platelets</option>
            <option value="cryoprecipitate">Cryoprecipitate</option>
          </select>
        </div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">Volume (ml)</Label>
          <Input type="number" value={volume} onChange={(e) => setVolume(e.target.value)} className="h-9 mt-1" />
        </div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">Storage Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-9 mt-1" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs uppercase text-muted-foreground">Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1" />
        </div>
      </div>
    </ModalShell>
  );
}

function DonorModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, addBloodDonor } = useAppStore();
  const [name, setName] = useState("");
  const [bloodType, setBloodType] = useState<"A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-">("O+");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) { pushToast({ title: "Name required", variant: "warning" }); return; }
    if (!phone.trim()) { pushToast({ title: "Phone required", variant: "warning" }); return; }
    addBloodDonor({
      name: name.trim(), bloodType, age: parseInt(age) || 0, gender,
      phone: phone.trim(), email: email.trim() || undefined, address: address.trim() || undefined,
    });
    closeModal();
  };

  return (
    <ModalShell title="Add Blood Donor" subtitle="Register a new donor in the system" icon={User} iconClass="bg-rose-50 text-rose-600" onClose={onClose}
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label="Add Donor" icon={CheckCircle2} />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Full Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 mt-1" /></div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">Blood Type *</Label>
          <select value={bloodType} onChange={(e) => setBloodType(e.target.value as any)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm">
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div><Label className="text-xs uppercase text-muted-foreground">Age</Label><Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="h-9 mt-1" /></div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">Gender</Label>
          <select value={gender} onChange={(e) => setGender(e.target.value as any)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm">
            <option value="M">Male</option><option value="F">Female</option>
          </select>
        </div>
        <div><Label className="text-xs uppercase text-muted-foreground">Phone *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-9 mt-1" /></div>
      </div>
    </ModalShell>
  );
}

function TransfusionModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, bloodBags, createTransfusion } = useAppStore();
  const allPatients = useAllPatients();
  const [patientId, setPatientId] = useState("");
  const [component, setComponent] = useState<"whole_blood" | "rbc" | "plasma" | "platelets" | "cryoprecipitate">("rbc");
  const [requiredBloodType, setRequiredBloodType] = useState<"A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-">("O-");
  const [selectedBagIds, setSelectedBagIds] = useState<string[]>([]);
  const [performedBy, setPerformedBy] = useState("");
  const [crossMatchedBy, setCrossMatchedBy] = useState("");
  const [notes, setNotes] = useState("");

  const patient = allPatients.find((p) => p.id === patientId);

  // Compatibility check
  const compatibilityMap: Record<string, string[]> = {
    "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"],
  };
  const isCompatible = patient ? compatibilityMap[requiredBloodType].includes(patient.bloodType ?? "") : false;

  const availableBags = bloodBags.filter((b) => b.status === "available" && b.bloodType === requiredBloodType && b.component === component);

  const toggleBag = (id: string) => {
    setSelectedBagIds((arr) => arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };

  const handleSubmit = () => {
    if (!patient) { pushToast({ title: "Select patient", variant: "warning" }); return; }
    if (!patient.bloodType) { pushToast({ title: "Patient blood type unknown", description: "Set patient's blood type first.", variant: "danger" }); return; }
    if (!isCompatible) { pushToast({ title: "Incompatible transfusion", description: `Donor ${requiredBloodType} cannot go to recipient ${patient.bloodType}`, variant: "danger" }); return; }
    if (selectedBagIds.length === 0) { pushToast({ title: "Select at least one bag", variant: "warning" }); return; }
    if (!performedBy.trim() || !crossMatchedBy.trim()) { pushToast({ title: "Performed by and cross-matched by are required", variant: "warning" }); return; }
    const tx = createTransfusion({
      patientId: patient.id,
      patientBloodType: patient.bloodType as any,
      requiredBloodType,
      component,
      units: selectedBagIds.length,
      bagIds: selectedBagIds,
      orderedBy: useAppStore.getState().user?.name ?? "Doctor",
      performedBy: performedBy.trim(),
      crossMatchedBy: crossMatchedBy.trim(),
      notes: notes.trim() || undefined,
    });
    if (tx) closeModal();
  };

  return (
    <ModalShell title="New Blood Transfusion" subtitle="Order and record a transfusion with compatibility checking" icon={Syringe} iconClass="bg-rose-50 text-rose-600" onClose={onClose} size="lg"
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label={`Record Transfusion (${selectedBagIds.length} units)`} icon={CheckCircle2} disabled={selectedBagIds.length === 0} />}>
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs uppercase text-muted-foreground">Patient *</Label>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm">
              <option value="">Select...</option>
              {allPatients.filter((p) => p.bloodType).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.mrn}) — Blood: {p.bloodType}</option>)}
            </select>
          </div>
          {patient && (
            <div className="col-span-2 rounded-lg bg-accent/30 p-3 text-xs">
              <p><strong>{patient.name}</strong> — Recipient blood type: <strong>{patient.bloodType ?? "Unknown"}</strong></p>
            </div>
          )}
          <div>
            <Label className="text-xs uppercase text-muted-foreground">Component</Label>
            <select value={component} onChange={(e) => setComponent(e.target.value as any)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm">
              <option value="whole_blood">Whole Blood</option>
              <option value="rbc">Red Blood Cells</option>
              <option value="plasma">Fresh Frozen Plasma</option>
              <option value="platelets">Platelets</option>
              <option value="cryoprecipitate">Cryoprecipitate</option>
            </select>
          </div>
          <div>
            <Label className="text-xs uppercase text-muted-foreground">Donor Blood Type *</Label>
            <select value={requiredBloodType} onChange={(e) => setRequiredBloodType(e.target.value as any)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm">
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {patient && (
          <div className={`rounded-lg p-3 text-xs ${isCompatible ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-rose-50 border border-rose-200 text-rose-800"}`}>
            {isCompatible ? (
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Compatible: donor {requiredBloodType} → recipient {patient.bloodType}</span>
            ) : (
              <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> INCOMPATIBLE: donor {requiredBloodType} cannot be transfused to recipient {patient.bloodType}</span>
            )}
          </div>
        )}

        <div>
          <Label className="text-xs uppercase text-muted-foreground">Available Bags ({availableBags.length})</Label>
          <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {availableBags.map((b) => (
              <label key={b.id} className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-accent/30 ${selectedBagIds.includes(b.id) ? "bg-brand-50" : ""}`}>
                <input type="checkbox" checked={selectedBagIds.includes(b.id)} onChange={() => toggleBag(b.id)} className="h-4 w-4" />
                <div className="flex-1">
                  <p className="text-xs font-mono">{b.bagId}</p>
                  <p className="text-[10px] text-muted-foreground">{b.volume}ml · Donor: {b.donorName} · Exp: {b.expiryDate}</p>
                </div>
              </label>
            ))}
            {availableBags.length === 0 && <p className="text-xs text-muted-foreground p-3">No available bags match the criteria.</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs uppercase text-muted-foreground">Performed By *</Label><Input value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} className="h-9 mt-1" /></div>
          <div><Label className="text-xs uppercase text-muted-foreground">Cross-Matched By *</Label><Input value={crossMatchedBy} onChange={(e) => setCrossMatchedBy(e.target.value)} className="h-9 mt-1" /></div>
        </div>
        <div><Label className="text-xs uppercase text-muted-foreground">Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1" /></div>
      </div>
    </ModalShell>
  );
}

function RestockModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, restockMedicine, medicineStock } = useAppStore();
  const [medicine, setMedicine] = useState("");
  const [qty, setQty] = useState("100");
  const [batch, setBatch] = useState("");
  const [expiry, setExpiry] = useState("");

  const handleSubmit = () => {
    if (!medicine) { pushToast({ title: "Select medicine", variant: "warning" }); return; }
    if (!batch.trim()) { pushToast({ title: "Batch number required", variant: "warning" }); return; }
    if (!expiry) { pushToast({ title: "Expiry date required", variant: "warning" }); return; }
    const med = MEDICINES.find((m) => m.id === medicine);
    if (!med) return;
    const qtyN = Number(qty) || 0;
    if (qtyN <= 0) { pushToast({ title: "Quantity must be > 0", variant: "warning" }); return; }
    restockMedicine(medicine, qtyN, batch, expiry, med.price * 0.6);
    pushToast({ title: "Stock Updated ✓", description: `Added ${qtyN} units to ${med.name} (batch: ${batch})`, variant: "success" });
    closeModal();
  };

  return (
    <ModalShell title="Restock Medicine" subtitle="Add new stock to inventory with batch traceability" icon={Package} iconClass="bg-emerald-50 text-emerald-600" onClose={onClose}
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label="Update Stock" icon={CheckCircle2} />}>
      <div className="space-y-4">
        <div><Label className="text-xs uppercase text-muted-foreground">Medicine</Label><select value={medicine} onChange={(e) => setMedicine(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{MEDICINES.map((m) => <option key={m.id} value={m.id}>{m.name} (current: {medicineStock[m.id] ?? m.stock})</option>)}</select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs uppercase text-muted-foreground">Quantity *</Label><Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="h-9 mt-1" /></div>
          <div><Label className="text-xs uppercase text-muted-foreground">Batch No *</Label><Input value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="BATCH-001" className="h-9 mt-1" /></div>
        </div>
        <div><Label className="text-xs uppercase text-muted-foreground">Expiry Date *</Label><Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="h-9 mt-1" /></div>
      </div>
    </ModalShell>
  );
}

function NewPatientModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, logActivity, addPatient, setSelectedPatient, setPage } = useAppStore();
  const [name, setName] = useState(""); const [age, setAge] = useState(""); const [gender, setGender] = useState<"M" | "F">("M"); const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(""); const [address, setAddress] = useState(""); const [bloodType, setBloodType] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState(""); const [insuranceCoverage, setInsuranceCoverage] = useState("0");

  const handleSubmit = () => {
    if (!name.trim()) { pushToast({ title: "Name is required", variant: "warning" }); return; }
    if (!phone.trim()) { pushToast({ title: "Phone is required", variant: "warning" }); return; }
    const newP = addPatient({
      name: name.trim(),
      age: parseInt(age) || 0,
      gender,
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      bloodType: bloodType || undefined,
      insurance: insuranceProvider ? { provider: insuranceProvider, coverage: parseInt(insuranceCoverage) || 0 } : undefined,
      lastVisit: undefined,
    });
    logActivity({ action: "Registered new patient", category: "patient", details: `${newP.name} (${newP.mrn}) — ${newP.age}y ${newP.gender}` });
    pushToast({ title: "Patient Registered ✓", description: `${newP.name} — ${newP.mrn} added to registry`, variant: "success" });
    setSelectedPatient(newP.id);
    setPage("patients");
    closeModal();
  };

  return (
    <ModalShell title="Register New Patient" subtitle="Add a new patient" icon={User} onClose={onClose}
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label="Register Patient" icon={CheckCircle2} />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Full Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 mt-1" autoFocus /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Age</Label><Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Gender</Label><select value={gender} onChange={(e) => setGender(e.target.value as any)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="M">Male</option><option value="F">Female</option></select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Phone *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Blood Type</Label><select value={bloodType} onChange={(e) => setBloodType(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Unknown</option><option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option></select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Insurance Provider</Label><Input value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} placeholder="e.g., BlueShield" className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Coverage (%)</Label><Input type="number" value={insuranceCoverage} onChange={(e) => setInsuranceCoverage(e.target.value)} className="h-9 mt-1" /></div>
      </div>
    </ModalShell>
  );
}

function NewAppointmentModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, logActivity, addAppointment, modalContext } = useAppStore();
  const allPatients = useAllPatients();
  const [patient, setPatient] = useState<string>(modalContext?.patientId ?? "");
  const [doctor, setDoctor] = useState(""); const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [time, setTime] = useState("09:00"); const [reason, setReason] = useState(""); const [type, setType] = useState<"new" | "follow-up" | "emergency">("new");

  const handleSubmit = () => {
    const p = allPatients.find((x) => x.id === patient);
    if (!p) { pushToast({ title: "Select patient", variant: "warning" }); return; }
    if (!date || !time) { pushToast({ title: "Date and time are required", variant: "warning" }); return; }
    const doc = DOCTORS.find((d) => d.id === doctor) || DOCTORS[0];
    addAppointment({ patientId: p.id, patientName: p.name, doctorId: doc.id, doctorName: doc.name, department: doc.specialty, time, date, duration: 30, reason: reason || "General consultation", type });
    logActivity({ action: "Booked appointment", category: "patient", details: `${p.name} with ${doc.name} on ${date} at ${time}` });
    pushToast({ title: "Appointment Booked ✓", description: `${p.name} — ${doc.name} on ${date} ${time}`, variant: "success" });
    closeModal();
  };

  return (
    <ModalShell title="Book Appointment" subtitle="Schedule a new appointment" icon={Calendar} onClose={onClose}
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label="Book Appointment" icon={Calendar} />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Patient</Label><select value={patient} onChange={(e) => setPatient(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{allPatients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>)}</select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Doctor</Label><select value={doctor} onChange={(e) => setDoctor(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{DOCTORS.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>)}</select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Type</Label><select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="new">New Visit</option><option value="follow-up">Follow-up</option><option value="emergency">Emergency</option></select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Time</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-9 mt-1" /></div>
        <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Reason</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Routine check-up" className="h-9 mt-1" /></div>
      </div>
    </ModalShell>
  );
}

function NewExpenseModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, logActivity, addExpense } = useAppStore();
  const [category, setCategory] = useState("Payroll"); const [amount, setAmount] = useState(""); const [desc, setDesc] = useState(""); const [vendor, setVendor] = useState("");

  const handleSubmit = () => {
    if (!desc.trim()) { pushToast({ title: "Description is required", variant: "warning" }); return; }
    const amt = Number(amount);
    if (!amt || amt <= 0) { pushToast({ title: "Valid amount is required", variant: "warning" }); return; }
    addExpense({ category, amount: amt, description: desc.trim(), vendor: vendor.trim() || "N/A" });
    logActivity({ action: "Recorded expense", category: "finance", details: `${category} — ${money(amt)} — ${desc}` });
    pushToast({ title: "Expense Recorded ✓", description: `${category} — ${money(amt)}`, variant: "success" });
    closeModal();
  };

  return (
    <ModalShell title="Record Expense" subtitle="Log a business expense" icon={Wallet} iconClass="bg-rose-50 text-rose-600" onClose={onClose}
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label="Record Expense" icon={Wallet} />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label className="text-xs uppercase text-muted-foreground">Category</Label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option>Payroll</option><option>Pharmacy</option><option>Utilities</option><option>Equipment</option><option>Supplies</option><option>Maintenance</option><option>Insurance</option><option>IT</option></select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Amount ($) *</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 mt-1" /></div>
        <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Description *</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} className="h-9 mt-1" /></div>
        <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Vendor</Label><Input value={vendor} onChange={(e) => setVendor(e.target.value)} className="h-9 mt-1" /></div>
      </div>
    </ModalShell>
  );
}

function AdmitPatientModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, logActivity, liveBeds, admitPatient, modalContext } = useAppStore();
  const allPatients = useAllPatients();
  const [patient, setPatient] = useState<string>(modalContext?.patientId ?? "");
  const [bedId, setBedId] = useState(""); const [attending, setAttending] = useState(""); const [condition, setCondition] = useState("stable"); const [expectedDischarge, setExpectedDischarge] = useState("");

  const availableBeds = liveBeds.filter((b) => b.status === "available");

  const handleSubmit = () => {
    const p = allPatients.find((x) => x.id === patient);
    if (!p) { pushToast({ title: "Select patient", variant: "warning" }); return; }
    if (!bedId) { pushToast({ title: "Select a bed", variant: "warning" }); return; }
    admitPatient(bedId, patient, attending || "Assigned Provider", condition);
    logActivity({ action: "Admitted patient", category: "ipd", details: `${p.name} → bed ${liveBeds.find((b) => b.id === bedId)?.bedNumber} (${condition})` });
    pushToast({ title: "Patient Admitted ✓", description: `${p.name} → ${liveBeds.find((b) => b.id === bedId)?.bedNumber}`, variant: "success" });
    closeModal();
  };

  return (
    <ModalShell title="Admit Patient to IPD" subtitle="Assign bed and attending doctor" icon={BedDouble} onClose={onClose}
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label="Admit Patient" icon={CheckCircle2} />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Patient</Label><select value={patient} onChange={(e) => setPatient(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{allPatients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>)}</select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Available Beds</Label><select value={bedId} onChange={(e) => setBedId(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select bed...</option>{availableBeds.map((b) => <option key={b.id} value={b.id}>{b.bedNumber} — {b.ward} ({b.type})</option>)}</select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Attending Doctor</Label><select value={attending} onChange={(e) => setAttending(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{DOCTORS.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Condition</Label><select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="stable">Stable</option><option value="observation">Observation</option><option value="serious">Serious</option><option value="critical">Critical</option></select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Expected Discharge</Label><Input type="date" value={expectedDischarge} onChange={(e) => setExpectedDischarge(e.target.value)} className="h-9 mt-1" /></div>
      </div>
    </ModalShell>
  );
}

function NewStaffModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, logActivity, addStaff } = useAppStore();
  const [name, setName] = useState(""); const [role, setRole] = useState("Doctor"); const [dept, setDept] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) { pushToast({ title: "Name is required", variant: "warning" }); return; }
    if (!email.trim()) { pushToast({ title: "Email is required", variant: "warning" }); return; }
    addStaff({ name: name.trim(), role, department: dept.trim() || "General", email: email.trim(), phone: phone.trim() });
    logActivity({ action: "Added staff member", category: "hr", details: `${name} — ${role} (${dept})` });
    pushToast({ title: "Staff Added ✓", description: `${name} — ${role}`, variant: "success" });
    closeModal();
  };

  return (
    <ModalShell title="Add Staff Member" subtitle="Create a new staff profile" icon={UserCog} onClose={onClose}
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label="Add Staff" icon={CheckCircle2} />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2"><Label className="text-xs uppercase text-muted-foreground">Full Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Role</Label><select value={role} onChange={(e) => setRole(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option>Doctor</option><option>Nurse</option><option>Receptionist</option><option>Pharmacist</option><option>Lab Technician</option><option>Radiologist</option><option>Accountant</option><option>Inventory Manager</option></select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Department</Label><select value={dept} onChange={(e) => setDept(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">General</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Email *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 mt-1" /></div>
      </div>
    </ModalShell>
  );
}

function NewNoteModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, logActivity, addNote, modalContext } = useAppStore();
  const allPatients = useAllPatients();
  const [patient, setPatient] = useState<string>(modalContext?.patientId ?? "");
  const [noteType, setNoteType] = useState("Progress"); const [content, setContent] = useState("");

  const handleSubmit = () => {
    const p = allPatients.find((x) => x.id === patient);
    if (!p) { pushToast({ title: "Select patient", variant: "warning" }); return; }
    if (!content.trim()) { pushToast({ title: "Note content is required", variant: "warning" }); return; }
    addNote({ patientId: p.id, patientName: p.name, mrn: p.mrn, type: noteType, content: content.trim() });
    logActivity({ action: `Wrote ${noteType} note`, category: "emr", details: `${p.name} — ${content.substring(0, 80)}` });
    pushToast({ title: "Clinical Note Saved ✓", description: `${noteType} note saved for ${p.name}`, variant: "success" });
    closeModal();
  };

  return (
    <ModalShell title="Write Clinical Note" subtitle="Document patient encounter" icon={FileText} onClose={onClose} size="lg"
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label="Save Note" icon={CheckCircle2} />}>
      <div className="space-y-4">
        <div><Label className="text-xs uppercase text-muted-foreground">Patient</Label><select value={patient} onChange={(e) => setPatient(e.target.value)} className="w-full h-9 mt-1 px-3 rounded-lg border border-border bg-card text-sm"><option value="">Select...</option>{allPatients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>)}</select></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Note Type</Label><div className="flex flex-wrap gap-1.5 mt-1">{["SOAP", "Progress", "Nursing", "Admission", "Discharge"].map((t) => <button key={t} onClick={() => setNoteType(t)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border", noteType === t ? "bg-brand-50 text-brand-700 border-brand-300" : "border-border")}>{t}</button>)}</div></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Note Content</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="mt-1" placeholder="Write the clinical note here..." /></div>
      </div>
    </ModalShell>
  );
}

// === Collect Payment Modal ===
function CollectPaymentModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, logActivity, payInvoice, modalContext } = useAppStore();
  const invoice = modalContext?.invoice;
  const balance = invoice ? invoice.amount - invoice.paid : 0;
  const [amount, setAmount] = useState(balance.toFixed(2));
  const [method, setMethod] = useState<"Cash" | "Card" | "Insurance" | "Bank Transfer">("Cash");

  if (!invoice) {
    return <ModalShell title="Collect Payment" subtitle="No invoice selected" icon={DollarSign} iconClass="bg-emerald-50 text-emerald-600" onClose={onClose} footer={<Button variant="outline" onClick={onClose}>Close</Button>}><p className="text-sm text-muted-foreground">No invoice selected.</p></ModalShell>;
  }

  const handleSubmit = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { pushToast({ title: "Enter a valid amount", variant: "warning" }); return; }
    if (amt > balance + 0.01) { pushToast({ title: "Amount exceeds balance", description: `Balance is ${money(balance)}`, variant: "warning" }); return; }
    payInvoice(invoice.id, amt);
    logActivity({ action: "Collected payment", category: "billing", details: `${invoice.number} — ${money(amt)} via ${method}` });
    pushToast({ title: "Payment Collected ✓", description: `${money(amt)} for ${invoice.number} via ${method}`, variant: "success" });
    closeModal();
  };

  return (
    <ModalShell title="Collect Payment" subtitle={`${invoice.number} — ${invoice.patientName}`} icon={DollarSign} iconClass="bg-emerald-50 text-emerald-600" onClose={onClose}
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label={`Collect ${money(Number(amount) || 0)}`} icon={DollarSign} disabled={!invoice} />}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-accent/30 border border-border text-sm">
          <div><p className="text-[10px] uppercase text-muted-foreground">Total</p><p className="font-bold tabular-nums">{money(invoice.amount)}</p></div>
          <div><p className="text-[10px] uppercase text-muted-foreground">Paid</p><p className="font-bold tabular-nums text-emerald-600">{money(invoice.paid)}</p></div>
          <div><p className="text-[10px] uppercase text-muted-foreground">Balance</p><p className="font-bold tabular-nums text-rose-600">{money(balance)}</p></div>
        </div>
        <div><Label className="text-xs uppercase text-muted-foreground">Amount to Collect ($)</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 mt-1" autoFocus /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Payment Method</Label><div className="grid grid-cols-4 gap-1.5 mt-1">{(["Cash", "Card", "Insurance", "Bank Transfer"] as const).map((m) => { const Icon = m === "Cash" ? Banknote : m === "Card" ? CreditCard : m === "Insurance" ? Shield : Wallet; return <button key={m} onClick={() => setMethod(m)} className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium", method === m ? "border-brand-400 bg-brand-50 text-brand-700" : "border-border")}><Icon className="h-4 w-4" />{m}</button>; })}</div></div>
      </div>
    </ModalShell>
  );
}

function AdjustStockModal({ onClose }: { onClose: () => void }) {
  const { closeModal, pushToast, adjustMedicineStock, medicineStock, modalContext } = useAppStore();
  const medicine = modalContext?.medicine;
  const [newQty, setNewQty] = useState(medicine ? String(medicineStock[medicine.id] ?? medicine.stock) : "");
  const [reason, setReason] = useState("");

  if (!medicine) {
    return <ModalShell title="Adjust Stock" subtitle="No medicine selected" icon={Package} iconClass="bg-amber-50 text-amber-600" onClose={onClose} footer={<Button variant="outline" onClick={onClose}>Close</Button>}><p className="text-sm text-muted-foreground">No medicine selected.</p></ModalShell>;
  }

  const current = medicineStock[medicine.id] ?? medicine.stock;
  const target = parseInt(newQty) || 0;
  const diff = target - current;

  const handleSubmit = () => {
    if (!reason.trim()) { pushToast({ title: "Reason required", description: "Provide a reason for the adjustment.", variant: "warning" }); return; }
    if (target < 0) { pushToast({ title: "Quantity cannot be negative", variant: "warning" }); return; }
    adjustMedicineStock(medicine.id, target, reason.trim());
    pushToast({ title: "Stock adjusted", description: `${medicine.name}: ${current} → ${target} (${diff > 0 ? "+" : ""}${diff})`, variant: "success" });
    closeModal();
  };

  return (
    <ModalShell title="Adjust Stock" subtitle={`${medicine.name} — current: ${current}`} icon={Package} iconClass="bg-amber-50 text-amber-600" onClose={onClose}
      footer={<SubmitFooter onClose={closeModal} onSubmit={handleSubmit} label="Apply Adjustment" icon={CheckCircle2} />}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-accent/30 p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Current Stock</p>
            <p className="text-xl font-bold tabular-nums">{current}</p>
          </div>
          <div className="rounded-lg bg-brand-50 p-3">
            <p className="text-[10px] uppercase text-brand-700">New Stock</p>
            <p className="text-xl font-bold tabular-nums text-brand-700">{target}</p>
          </div>
        </div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">New Stock Level *</Label>
          <Input type="number" min={0} value={newQty} onChange={(e) => setNewQty(e.target.value)} className="h-9 mt-1" autoFocus />
          <p className="text-[11px] text-muted-foreground mt-1">Change: <span className={diff > 0 ? "text-emerald-600 font-semibold" : diff < 0 ? "text-rose-600 font-semibold" : ""}>{diff > 0 ? `+${diff}` : diff} units</span></p>
        </div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">Reason *</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g., Cycle count adjustment, damaged units, expired disposal..." className="mt-1" />
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-800"><AlertTriangle className="h-3.5 w-3.5 inline mr-1" />Stock adjustments are logged to the activity audit trail with user, reason, and timestamp.</p>
        </div>
      </div>
    </ModalShell>
  );
}
