"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Droplet, Plus, Search, Eye, Trash2, Download, Heart, UserPlus,
  AlertTriangle, Activity, ShieldCheck, Syringe, Calendar, MapPin,
  CheckCircle2, XCircle, Clock, History,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useAppStore, type BloodTransfusion } from "@/store/app-store";
import {
  BLOOD_TYPES, BLOOD_COMPONENTS, BLOOD_COMPATIBILITY,
  type BloodType, type BloodComponent, type BloodBag, type BloodDonor,
} from "@/_legacy/mock-data/data";
import { KpiCard, StatusPill, ColorAvatar } from "@/components/shared/ui-bits";
import { exportToCsv } from "@/lib/print";
import { can } from "@/lib/rbac";

const COMPONENT_LABEL: Record<BloodComponent, string> = {
  whole_blood: "Whole Blood",
  rbc: "Red Blood Cells",
  plasma: "Fresh Frozen Plasma",
  platelets: "Platelets",
  cryoprecipitate: "Cryoprecipitate",
};

const BAG_STATUS_META: Record<BloodBag["status"], { label: string; pill: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  available: { label: "Available", pill: "success" },
  reserved: { label: "Reserved", pill: "warning" },
  transfused: { label: "Transfused", pill: "info" },
  discarded: { label: "Discarded", pill: "danger" },
  expired: { label: "Expired", pill: "danger" },
};

const BAG_COLOR: Record<BloodType, string> = {
  "O+": "oklch(0.65 0.200 15)",
  "O-": "oklch(0.65 0.200 15)",
  "A+": "oklch(0.535 0.195 245)",
  "A-": "oklch(0.535 0.195 245)",
  "B+": "oklch(0.62 0.150 200)",
  "B-": "oklch(0.62 0.150 200)",
  "AB+": "oklch(0.58 0.150 290)",
  "AB-": "oklch(0.58 0.150 290)",
};

type TabKey = "inventory" | "donors" | "transfusions";

export default function BloodBank() {
  const [tab, setTab] = useState<TabKey>("inventory");
  const { bloodBags, bloodDonors, bloodTransfusions, openModal } = useAppStore();
  const role = useAppStore((s) => s.user?.role);
  const canCreate = can(role, "blood_bank", "create");

  const stats = useMemo(() => {
    const available = bloodBags.filter((b) => b.status === "available").length;
    const today = new Date().toISOString().slice(0, 10);
    const expiringSoon = bloodBags.filter((b) => b.status === "available" && b.expiryDate <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) && b.expiryDate >= today).length;
    const expired = bloodBags.filter((b) => b.status === "expired" || (b.status === "available" && b.expiryDate < today)).length;
    const transfused = bloodTransfusions.length;
    return { available, expiringSoon, expired, transfused, donors: bloodDonors.filter((d) => d.status === "eligible").length };
  }, [bloodBags, bloodTransfusions, bloodDonors]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">Blood Bank</span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Blood Bank Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Donor management, inventory tracking, compatibility checking, and transfusion records</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && tab === "inventory" && (
            <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700" onClick={() => openModal("newBloodDonation")}>
              <Plus className="h-4 w-4 mr-1.5" /> Record Donation
            </Button>
          )}
          {canCreate && tab === "donors" && (
            <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700" onClick={() => openModal("newDonor")}>
              <UserPlus className="h-4 w-4 mr-1.5" /> Add Donor
            </Button>
          )}
          {canCreate && tab === "transfusions" && (
            <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700" onClick={() => openModal("newTransfusion")}>
              <Syringe className="h-4 w-4 mr-1.5" /> New Transfusion
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Available Bags" value={stats.available} icon={Droplet} accent="rose" delay={0} sub="ready for use" />
        <KpiCard label="Expiring Soon" value={stats.expiringSoon} icon={Clock} accent="amber" delay={0.05} sub="next 7 days" />
        <KpiCard label="Eligible Donors" value={stats.donors} icon={Heart} accent="emerald" delay={0.1} sub={`${bloodDonors.length} total`} />
        <KpiCard label="Transfusions" value={stats.transfused} icon={Activity} accent="brand" delay={0.15} sub="all-time" />
      </div>

      {/* Blood type inventory matrix */}
      <BloodTypeMatrix />

      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        <div className="border-b border-border flex items-center gap-1 p-2">
          <TabButton active={tab === "inventory"} onClick={() => setTab("inventory")} icon={Droplet} label={`Inventory (${bloodBags.length})`} />
          <TabButton active={tab === "donors"} onClick={() => setTab("donors")} icon={Heart} label={`Donors (${bloodDonors.length})`} />
          <TabButton active={tab === "transfusions"} onClick={() => setTab("transfusions")} icon={Syringe} label={`Transfusions (${bloodTransfusions.length})`} />
        </div>
        {tab === "inventory" && <BloodInventory />}
        {tab === "donors" && <Donors />}
        {tab === "transfusions" && <Transfusions />}
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
// BLOOD TYPE INVENTORY MATRIX
// ============================================================================
function BloodTypeMatrix() {
  const { bloodBags } = useAppStore();
  const matrix = useMemo(() => {
    const out: Record<BloodType, Record<BloodComponent, number>> = {} as any;
    for (const bt of BLOOD_TYPES) {
      out[bt] = { whole_blood: 0, rbc: 0, plasma: 0, platelets: 0, cryoprecipitate: 0 };
    }
    bloodBags.filter((b) => b.status === "available").forEach((b) => {
      out[b.bloodType][b.component] += 1;
    });
    return out;
  }, [bloodBags]);

  return (
    <Card className="border-border/60 shadow-soft rounded-xl p-5">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Droplet className="h-4 w-4 text-rose-500" /> Available Units by Type & Component</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
              {BLOOD_COMPONENTS.map((c) => (
                <th key={c.key} className="text-center px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{c.label.split(" ")[0]}</th>
              ))}
              <th className="text-center px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
            </tr>
          </thead>
          <tbody>
            {BLOOD_TYPES.map((bt) => {
              const total = Object.values(matrix[bt]).reduce((s, n) => s + n, 0);
              return (
                <tr key={bt} className="border-b border-border/40 hover:bg-accent/30">
                  <td className="px-2 py-2">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-white font-bold text-sm" style={{ backgroundColor: BAG_COLOR[bt] }}>
                      {bt}
                    </span>
                  </td>
                  {BLOOD_COMPONENTS.map((c) => (
                    <td key={c.key} className="text-center px-2 py-2">
                      <span className={`text-sm font-semibold tabular-nums ${matrix[bt][c.key] === 0 ? "text-muted-foreground" : ""}`}>
                        {matrix[bt][c.key]}
                      </span>
                    </td>
                  ))}
                  <td className="text-center px-2 py-2">
                    <span className="text-sm font-bold tabular-nums text-brand-700">{total}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ============================================================================
// BLOOD INVENTORY
// ============================================================================
function BloodInventory() {
  const { bloodBags, discardBloodBag } = useAppStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [compFilter, setCompFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBag, setSelectedBag] = useState<BloodBag | null>(null);
  const role = useAppStore((s) => s.user?.role);
  const canAdjust = can(role, "blood_bank", "adjust");

  const filtered = useMemo(() => {
    return bloodBags.filter((b) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || b.bagId.toLowerCase().includes(q) || b.donorName?.toLowerCase().includes(q) || b.batchNo.toLowerCase().includes(q);
      const matchesType = typeFilter === "all" || b.bloodType === typeFilter;
      const matchesComp = compFilter === "all" || b.component === compFilter;
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      return matchesSearch && matchesType && matchesComp && matchesStatus;
    });
  }, [bloodBags, search, typeFilter, compFilter, statusFilter]);

  const handleExport = () => {
    const rows = filtered.map((b) => ({
      bagId: b.bagId, bloodType: b.bloodType, component: COMPONENT_LABEL[b.component],
      volume: b.volume, donor: b.donorName ?? "—", donationDate: b.donationDate,
      expiryDate: b.expiryDate, batchNo: b.batchNo, location: b.location, status: b.status,
    }));
    exportToCsv("blood-inventory.csv", rows);
  };

  return (
    <>
      <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search bag ID, donor, batch..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-[120px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {BLOOD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={compFilter} onValueChange={setCompFilter}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Component" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All components</SelectItem>
            {BLOOD_COMPONENTS.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="transfused">Transfused</SelectItem>
            <SelectItem value="discarded">Discarded</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
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
              <Th>Bag ID</Th><Th>Type</Th><Th>Component</Th><Th>Volume</Th>
              <Th>Donor</Th><Th>Donation</Th><Th>Expiry</Th><Th>Location</Th><Th>Status</Th>
              <Th className="text-right pr-4">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b, i) => {
              const today = new Date().toISOString().slice(0, 10);
              const isExpiringSoon = b.status === "available" && b.expiryDate <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) && b.expiryDate >= today;
              const isExpired = b.expiryDate < today;
              return (
                <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: i * 0.02 }} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <Td><span className="text-xs font-mono">{b.bagId}</span></Td>
                  <Td>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md text-white font-bold text-xs" style={{ backgroundColor: BAG_COLOR[b.bloodType] }}>
                      {b.bloodType}
                    </span>
                  </Td>
                  <Td><span className="text-xs">{COMPONENT_LABEL[b.component]}</span></Td>
                  <Td><span className="text-sm tabular-nums">{b.volume} ml</span></Td>
                  <Td><span className="text-xs">{b.donorName ?? "—"}</span></Td>
                  <Td><span className="text-xs text-muted-foreground">{b.donationDate}</span></Td>
                  <Td>
                    <span className={`text-xs ${isExpired ? "text-rose-600 font-semibold" : isExpiringSoon ? "text-amber-600 font-semibold" : "text-muted-foreground"}`}>
                      {b.expiryDate}
                      {isExpiringSoon && <span className="ml-1">(soon)</span>}
                      {isExpired && <span className="ml-1">(expired)</span>}
                    </span>
                  </Td>
                  <Td><span className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" />{b.location}</span></Td>
                  <Td><StatusPill status={BAG_STATUS_META[b.status].pill}>{BAG_STATUS_META[b.status].label}</StatusPill></Td>
                  <Td className="text-right pr-4">
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setSelectedBag(b)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {canAdjust && b.status === "available" && (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-rose-600 hover:text-rose-700" onClick={() => {
                        const reason = prompt("Reason for discarding this bag?");
                        if (reason) discardBloodBag(b.id, reason);
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </Td>
                </motion.tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="text-center py-12 text-sm text-muted-foreground">No blood bags match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedBag && <BagDetail bag={selectedBag} onClose={() => setSelectedBag(null)} />}
    </>
  );
}

function BagDetail({ bag, onClose }: { bag: BloodBag; onClose: () => void }) {
  const compatibleRecipients = BLOOD_COMPATIBILITY[bag.bloodType];
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-white font-bold" style={{ backgroundColor: BAG_COLOR[bag.bloodType] }}>
              {bag.bloodType}
            </span>
            <span className="font-mono">{bag.bagId}</span>
            <StatusPill status={BAG_STATUS_META[bag.status].pill}>{BAG_STATUS_META[bag.status].label}</StatusPill>
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <InfoBlock label="Component" value={COMPONENT_LABEL[bag.component]} />
          <InfoBlock label="Volume" value={`${bag.volume} ml`} />
          <InfoBlock label="Donor" value={bag.donorName ?? "—"} />
          <InfoBlock label="Batch No" value={bag.batchNo} />
          <InfoBlock label="Donation Date" value={bag.donationDate} />
          <InfoBlock label="Expiry Date" value={bag.expiryDate} />
          <InfoBlock label="Location" value={bag.location} />
          <InfoBlock label="Status" value={BAG_STATUS_META[bag.status].label} />
        </div>
        {bag.notes && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800">{bag.notes}</p>
          </div>
        )}
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
          <p className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Compatible Recipient Blood Types</p>
          <div className="flex flex-wrap gap-1">
            {compatibleRecipients.map((t) => (
              <span key={t} className="inline-flex items-center justify-center w-9 h-7 rounded text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300">{t}</span>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// DONORS
// ============================================================================
function Donors() {
  const { bloodDonors, updateBloodDonor } = useAppStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return bloodDonors.filter((d) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || d.name.toLowerCase().includes(q) || d.phone.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q);
      const matchesType = typeFilter === "all" || d.bloodType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [bloodDonors, search, typeFilter]);

  return (
    <>
      <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search donors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {BLOOD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-accent/30 border-b border-border">
            <tr>
              <Th>Donor</Th><Th>Type</Th><Th>Age</Th><Th>Phone</Th>
              <Th>Last Donation</Th><Th>Total</Th><Th>Status</Th>
              <Th className="text-right pr-4">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: i * 0.02 }} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                <Td>
                  <div className="flex items-center gap-3">
                    <ColorAvatar name={d.name} color={d.avatarColor} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-[11px] text-muted-foreground">{d.email ?? d.phone}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-md text-white font-bold text-xs" style={{ backgroundColor: BAG_COLOR[d.bloodType] }}>
                    {d.bloodType}
                  </span>
                </Td>
                <Td><span className="text-sm tabular-nums">{d.age}</span></Td>
                <Td><span className="text-xs">{d.phone}</span></Td>
                <Td><span className="text-xs text-muted-foreground">{d.lastDonationDate ?? "Never"}</span></Td>
                <Td><span className="text-sm font-semibold tabular-nums">{d.totalDonations}</span></Td>
                <Td>
                  <StatusPill status={d.status === "eligible" ? "success" : d.status === "deferred" ? "warning" : "danger"}>
                    {d.status}
                  </StatusPill>
                </Td>
                <Td className="text-right pr-4">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => {
                    const next = d.status === "eligible" ? "deferred" : "eligible";
                    updateBloodDonor(d.id, { status: next });
                  }}>
                    Toggle status
                  </Button>
                </Td>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">No donors found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ============================================================================
// TRANSFUSIONS
// ============================================================================
function Transfusions() {
  const { bloodTransfusions, updateTransfusionStatus } = useAppStore();
  const [selectedTx, setSelectedTx] = useState<BloodTransfusion | null>(null);
  const role = useAppStore((s) => s.user?.role);
  const canEdit = can(role, "blood_bank", "edit");

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-accent/30 border-b border-border">
          <tr>
            <Th>TX #</Th><Th>Patient</Th><Th>Required</Th><Th>Component</Th>
            <Th>Units</Th><Th>Performed By</Th><Th>Date</Th><Th>Status</Th>
            <Th className="text-right pr-4">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {bloodTransfusions.map((t, i) => (
            <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: i * 0.02 }} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
              <Td><span className="text-xs font-mono">{t.number}</span></Td>
              <Td>
                <div>
                  <p className="text-sm font-medium">{t.patientName}</p>
                  <p className="text-[11px] text-muted-foreground">{t.mrn}</p>
                </div>
              </Td>
              <Td>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded text-white font-bold text-xs" style={{ backgroundColor: BAG_COLOR[t.requiredBloodType] }}>{t.requiredBloodType}</span>
                  <span className="text-muted-foreground text-xs">→</span>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded text-white font-bold text-xs" style={{ backgroundColor: BAG_COLOR[t.patientBloodType] }}>{t.patientBloodType}</span>
                </span>
              </Td>
              <Td><span className="text-xs">{COMPONENT_LABEL[t.component]}</span></Td>
              <Td><span className="text-sm tabular-nums">{t.units}</span></Td>
              <Td><span className="text-xs">{t.performedBy}</span></Td>
              <Td><span className="text-xs text-muted-foreground">{new Date(t.date).toLocaleString()}</span></Td>
              <Td>
                <StatusPill status={t.status === "completed" ? "success" : t.status === "in_progress" ? "info" : t.status === "cancelled" ? "neutral" : t.status === "reaction" ? "danger" : "warning"}>
                  {t.status.replace("_", " ")}
                </StatusPill>
              </Td>
              <Td className="text-right pr-4">
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setSelectedTx(t)}>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                {canEdit && t.status === "in_progress" && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-emerald-600 hover:text-emerald-700" onClick={() => updateTransfusionStatus(t.id, "completed")}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                {canEdit && t.status === "in_progress" && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-rose-600 hover:text-rose-700" onClick={() => {
                    const reaction = prompt("Describe the adverse reaction:");
                    if (reaction) updateTransfusionStatus(t.id, "reaction", reaction);
                  }}>
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </Button>
                )}
              </Td>
            </motion.tr>
          ))}
          {bloodTransfusions.length === 0 && (
            <tr><td colSpan={9} className="text-center py-12 text-sm text-muted-foreground">No transfusions recorded yet.</td></tr>
          )}
        </tbody>
      </table>

      {selectedTx && (
        <Dialog open onOpenChange={(v) => !v && setSelectedTx(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span className="font-mono">{selectedTx.number}</span>
                <StatusPill status={selectedTx.status === "completed" ? "success" : selectedTx.status === "in_progress" ? "info" : selectedTx.status === "reaction" ? "danger" : "neutral"}>
                  {selectedTx.status.replace("_", " ")}
                </StatusPill>
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2">
              <InfoBlock label="Patient" value={`${selectedTx.patientName} (${selectedTx.mrn})`} />
              <InfoBlock label="Date" value={new Date(selectedTx.date).toLocaleString()} />
              <InfoBlock label="Required Type" value={selectedTx.requiredBloodType} />
              <InfoBlock label="Patient Type" value={selectedTx.patientBloodType} />
              <InfoBlock label="Component" value={COMPONENT_LABEL[selectedTx.component]} />
              <InfoBlock label="Units" value={String(selectedTx.units)} />
              <InfoBlock label="Ordered By" value={selectedTx.orderedBy} />
              <InfoBlock label="Performed By" value={selectedTx.performedBy} />
              <InfoBlock label="Cross-Matched By" value={selectedTx.crossMatchedBy} />
              <InfoBlock label="Cross-Match Result" value={selectedTx.crossMatchResult} />
            </div>
            <div className="rounded-lg bg-accent/30 p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Bag IDs</p>
              <div className="flex flex-wrap gap-1">
                {selectedTx.bagIds.map((id) => (
                  <Badge key={id} variant="outline" className="text-xs font-mono">{id}</Badge>
                ))}
              </div>
            </div>
            {selectedTx.reactions && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                <p className="text-xs font-semibold text-rose-800 mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Adverse Reaction</p>
                <p className="text-xs text-rose-700">{selectedTx.reactions}</p>
              </div>
            )}
            {selectedTx.notes && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-800">{selectedTx.notes}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTx(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
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

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${className || ""}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className || ""}`}>{children}</td>;
}
