"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package, Plus, Search, Eye, Edit, Phone, Mail, MapPin, Star,
  TrendingUp, TrendingDown, DollarSign, Building2, ArrowLeft,
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
import { useAppStore, type Supplier } from "@/store/app-store";
import { KpiCard, StatusPill, ColorAvatar } from "@/components/shared/ui-bits";
import { exportToCsv } from "@/lib/print";
import { can } from "@/lib/rbac";

const money = (n: number) => `$${n.toFixed(2)}`;

export default function Suppliers() {
  const { suppliers, openModal, purchaseOrders, purchaseReturns, setPage } = useAppStore();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const role = useAppStore((s) => s.user?.role);
  const canCreate = can(role, "suppliers", "create");
  const canEdit = can(role, "suppliers", "edit");

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      const q = search.trim().toLowerCase();
      return !q || s.name.toLowerCase().includes(q) || s.contactPerson.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.categories.some((c) => c.toLowerCase().includes(q));
    });
  }, [suppliers, search]);

  const stats = useMemo(() => {
    return {
      total: suppliers.length,
      active: suppliers.filter((s) => s.status === "active").length,
      balance: suppliers.reduce((s, x) => s + x.accountBalance, 0),
      avgRating: suppliers.length > 0 ? (suppliers.reduce((s, x) => s + x.rating, 0) / suppliers.length).toFixed(2) : "—",
    };
  }, [suppliers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">Vendor Management</span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage pharmaceutical and medical supply vendors with running account balances</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={() => setPage("purchases")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Purchases
          </Button>
          {canCreate && (
            <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Supplier
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Suppliers" value={stats.total} icon={Building2} accent="brand" delay={0} sub={`${stats.active} active`} />
        <KpiCard label="Total Payable" value={stats.balance} format={(v) => money(v)} icon={DollarSign} accent="rose" delay={0.05} sub="we owe" />
        <KpiCard label="Avg Rating" value={parseFloat(stats.avgRating) || 0} format={(v) => v.toFixed(2)} icon={Star} accent="amber" delay={0.1} sub="out of 5" />
        <KpiCard label="Active POs" value={purchaseOrders.filter((p) => p.status !== "cancelled" && p.status !== "fully_received").length} icon={Package} accent="emerald" delay={0.15} sub="pending delivery" />
      </div>

      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button variant="outline" size="sm" className="h-9" onClick={() => exportToCsv("suppliers.csv", filtered.map((s) => ({
            name: s.name, contact: s.contactPerson, email: s.email, phone: s.phone,
            address: s.address, paymentTerms: s.paymentTerms, accountBalance: s.accountBalance,
            rating: s.rating, status: s.status, categories: s.categories.join("; "),
          })))}>
            <Package className="h-4 w-4 mr-1.5" /> Export
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent/30 border-b border-border">
              <tr>
                <Th>Supplier</Th><Th>Contact</Th><Th>Categories</Th>
                <Th>Payment Terms</Th><Th>Account Balance</Th><Th>Rating</Th><Th>Status</Th>
                <Th className="text-right pr-4">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: i * 0.03 }} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <Td>
                    <div className="flex items-center gap-3">
                      <ColorAvatar name={s.name} color="oklch(0.535 0.195 245)" size="sm" />
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground">{s.address}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div>
                      <p className="text-xs font-medium">{s.contactPerson}</p>
                      <p className="text-[11px] text-muted-foreground">{s.phone}</p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {s.categories.slice(0, 3).map((c) => <Badge key={c} variant="outline" className="text-[9px]">{c}</Badge>)}
                      {s.categories.length > 3 && <span className="text-[10px] text-muted-foreground">+{s.categories.length - 3}</span>}
                    </div>
                  </Td>
                  <Td><span className="text-xs">{s.paymentTerms}</span></Td>
                  <Td>
                    <span className={`text-sm font-semibold tabular-nums ${s.accountBalance > 0 ? "text-rose-600" : s.accountBalance < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {s.accountBalance > 0 ? "+" : ""}{money(s.accountBalance)}
                    </span>
                    {s.accountBalance !== 0 && <span className="text-[10px] text-muted-foreground ml-1">{s.accountBalance > 0 ? "owed" : "credit"}</span>}
                  </Td>
                  <Td>
                    <span className="flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{s.rating.toFixed(1)}</span>
                    </span>
                  </Td>
                  <Td>
                    <StatusPill status={s.status === "active" ? "success" : s.status === "inactive" ? "neutral" : "danger"}>{s.status}</StatusPill>
                  </Td>
                  <Td className="text-right pr-4">
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setSelected(s)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                    {canEdit && (
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setEditing(s)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </Td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">No suppliers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && <SupplierDetail supplier={selected} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null); }} />}
      {editing && <EditSupplierDialog supplier={editing} onClose={() => setEditing(null)} />}
      {showAdd && <AddSupplierDialog onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function SupplierDetail({ supplier, onClose, onEdit }: { supplier: Supplier; onClose: () => void; onEdit: () => void }) {
  const { purchaseOrders, purchaseReturns } = useAppStore();
  const pos = purchaseOrders.filter((p) => p.supplierId === supplier.id);
  const returns = purchaseReturns.filter((r) => r.supplierId === supplier.id);
  const canEdit = can(useAppStore.getState().user?.role, "suppliers", "edit");

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ColorAvatar name={supplier.name} color="oklch(0.535 0.195 245)" size="md" />
            <div>
              <p>{supplier.name}</p>
              <p className="text-xs text-muted-foreground font-normal">{supplier.contactPerson} · {supplier.paymentTerms}</p>
            </div>
            <StatusPill status={supplier.status === "active" ? "success" : "neutral"}>{supplier.status}</StatusPill>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span>{supplier.email}</span></div>
            <div className="flex items-center gap-2 text-xs"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{supplier.phone}</span></div>
            <div className="flex items-center gap-2 text-xs"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span>{supplier.address}</span></div>
          </div>
          <div className="rounded-lg bg-accent/30 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Account Balance</span>
              <span className={`text-base font-bold ${supplier.accountBalance > 0 ? "text-rose-600" : "text-emerald-600"}`}>{money(supplier.accountBalance)}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-muted-foreground">Rating</span>
              <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{supplier.rating.toFixed(1)} / 5</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-muted-foreground">Total Orders</span>
              <span>{pos.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-muted-foreground">Total Returns</span>
              <span>{returns.length}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {supplier.categories.map((c) => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2">Recent Purchase Orders</h4>
          <div className="space-y-1">
            {pos.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs border border-border/50 rounded-md px-3 py-2">
                <span className="font-mono">{p.number}</span>
                <span className="text-muted-foreground">{p.date}</span>
                <span className="font-semibold">{money(p.total)}</span>
                <StatusPill status={p.status === "fully_received" ? "success" : p.status === "cancelled" ? "danger" : "info"}>{p.status.replace(/_/g, " ")}</StatusPill>
              </div>
            ))}
            {pos.length === 0 && <p className="text-xs text-muted-foreground">No purchase orders yet.</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {canEdit && <Button className="bg-brand-600 hover:bg-brand-700" onClick={onEdit}><Edit className="h-4 w-4 mr-1.5" /> Edit</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditSupplierDialog({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
  const { updateSupplier } = useAppStore();
  const [name, setName] = useState(supplier.name);
  const [contactPerson, setContactPerson] = useState(supplier.contactPerson);
  const [email, setEmail] = useState(supplier.email);
  const [phone, setPhone] = useState(supplier.phone);
  const [address, setAddress] = useState(supplier.address);
  const [paymentTerms, setPaymentTerms] = useState(supplier.paymentTerms);
  const [status, setStatus] = useState(supplier.status);
  const [categories, setCategories] = useState(supplier.categories.join(", "));

  const save = () => {
    updateSupplier(supplier.id, {
      name, contactPerson, email, phone, address, paymentTerms, status,
      categories: categories.split(",").map((c) => c.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit Supplier</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" /></Field>
          <Field label="Contact Person"><Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="h-9" /></Field>
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9" /></Field>
          <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9" /></Field>
          <Field label="Address"><Textarea value={address} onChange={(e) => setAddress(e.target.value)} className="min-h-[60px]" /></Field>
          <Field label="Payment Terms"><Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="h-9" /></Field>
          <Field label="Status">
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Categories (comma-separated)"><Input value={categories} onChange={(e) => setCategories(e.target.value)} className="h-9" /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-brand-600 hover:bg-brand-700" onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddSupplierDialog({ onClose }: { onClose: () => void }) {
  const { addSupplier } = useAppStore();
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [categories, setCategories] = useState("");

  const save = () => {
    if (!name.trim()) return;
    addSupplier({
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      paymentTerms: paymentTerms.trim(),
      categories: categories.split(",").map((c) => c.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Name *"><Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" placeholder="PharmaCorp Inc." /></Field>
          <Field label="Contact Person"><Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="h-9" /></Field>
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9" /></Field>
          <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9" /></Field>
          <Field label="Address"><Textarea value={address} onChange={(e) => setAddress(e.target.value)} className="min-h-[60px]" /></Field>
          <Field label="Payment Terms"><Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="h-9" /></Field>
          <Field label="Categories (comma-separated)"><Input value={categories} onChange={(e) => setCategories(e.target.value)} className="h-9" placeholder="Antibiotic, PPI" /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-brand-600 hover:bg-brand-700" onClick={save} disabled={!name.trim()}><Plus className="h-4 w-4 mr-1.5" /> Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${className || ""}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className || ""}`}>{children}</td>;
}
