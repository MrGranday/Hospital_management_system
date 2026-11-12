"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BedDouble,
  Activity,
  Clock,
  CheckCircle2,
  Plus,
  Users,
  Wrench,
  Sparkles,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WARDS, BEDS, type Bed } from "@/lib/data";
import { KpiCard, StatusPill, ColorAvatar } from "@/components/shell/ui-bits";
import { useAppStore } from "@/store/app-store";

const BED_STATUS: Record<Bed["status"], { label: string; color: string; bg: string; text: string }> = {
  available: { label: "Available", color: "oklch(0.62 0.150 155)", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  occupied: { label: "Occupied", color: "oklch(0.535 0.195 245)", bg: "bg-brand-50 border-brand-200", text: "text-brand-700" },
  reserved: { label: "Reserved", color: "oklch(0.72 0.160 75)", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  cleaning: { label: "Cleaning", color: "oklch(0.62 0.130 240)", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  maintenance: { label: "Maintenance", color: "oklch(0.55 0.02 260)", bg: "bg-muted border-border", text: "text-muted-foreground" },
};

const CONDITION_INFO: Record<NonNullable<Bed["condition"]>, { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  stable: { status: "success", label: "Stable" },
  observation: { status: "info", label: "Observation" },
  serious: { status: "warning", label: "Serious" },
  critical: { status: "danger", label: "Critical" },
};

export default function IPD() {
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const { openModal, pushToast, liveBeds, dischargeBed } = useAppStore();

  // Merge live + static beds (live first). Map LiveBed → Bed shape.
  const allBeds: (Bed & { _live?: boolean })[] = [
    ...liveBeds.map((b) => ({
      id: b.id,
      ward: b.ward,
      number: b.bedNumber,
      status: b.status,
      patientName: b.patientName,
      mrn: undefined as string | undefined,
      admittedOn: b.admittedOn,
      expectedDischarge: undefined as string | undefined,
      attending: b.attending,
      condition: b.condition as Bed["condition"],
      _live: true as const,
    })),
    ...BEDS,
  ];

  const filteredBeds = useMemo(() => {
    return allBeds.filter((b) => selectedWard === "all" || b.ward === selectedWard);
  }, [selectedWard, allBeds]);

  const stats = useMemo(() => {
    const total = allBeds.length;
    const occupied = allBeds.filter((b) => b.status === "occupied").length;
    const available = allBeds.filter((b) => b.status === "available").length;
    const critical = allBeds.filter((b) => b.condition === "critical").length;
    return { total, occupied, available, critical };
  }, [allBeds]);

  const handleDischarge = (bed: Bed & { _live?: boolean }) => {
    if (bed._live) {
      dischargeBed(bed.id);
      pushToast({ title: "Patient discharged", description: `${bed.number} is now being cleaned`, variant: "success" });
    } else {
      pushToast({ title: "Demo bed", description: "Static demo beds can't be mutated", variant: "info" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Inpatient Department</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Wards & Beds</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time bed management and patient monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={() => openModal("admitPatient")}>
            <Activity className="h-4 w-4 mr-1.5" />
            Admit Patient
          </Button>
          <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700 shadow-blue-glow" onClick={() => pushToast({ title: "Bed management (demo)", variant: "info" })}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Bed
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Beds" value={stats.total} icon={BedDouble} accent="brand" delay={0} />
        <KpiCard label="Occupied" value={stats.occupied} icon={Users} accent="violet" sub={`${Math.round((stats.occupied/stats.total)*100)}% occupancy`} sparkline={[10, 11, 12, 10, 11, 12, 12]} delay={0.05} />
        <KpiCard label="Available" value={stats.available} icon={CheckCircle2} accent="emerald" sub="ready for admission" sparkline={[5, 4, 3, 5, 4, 3, 6]} delay={0.1} />
        <KpiCard label="Critical Patients" value={stats.critical} icon={Activity} accent="rose" sub="ICU level care" sparkline={[1, 2, 1, 2, 3, 2, 1]} delay={0.15} />
      </div>

      {/* Ward overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {WARDS.map((ward, i) => {
          const pct = ((ward.total - ward.available) / ward.total) * 100;
          const isSelected = selectedWard === ward.id;
          return (
            <motion.button
              key={ward.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              onClick={() => setSelectedWard(isSelected ? "all" : ward.id)}
              className={`text-left p-3 rounded-xl border transition-all ${
                isSelected
                  ? "border-brand-300 bg-brand-50 ring-2 ring-brand-100"
                  : "border-border/60 bg-card hover:border-brand-200"
              }`}
            >
              <p className="text-xs font-semibold text-foreground truncate">{ward.name}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className="text-xl font-bold tabular-nums" style={{ color: ward.color }}>{ward.total - ward.available}</p>
                <p className="text-xs text-muted-foreground">/ {ward.total}</p>
              </div>
              <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.04 }}
                  className="h-full rounded-full"
                  style={{ background: ward.color }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{ward.available} available</p>
            </motion.button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedWard("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            selectedWard === "all"
              ? "bg-foreground text-background border-foreground"
              : "bg-card text-muted-foreground border-border hover:border-foreground/30"
          }`}
        >
          All Wards ({allBeds.length})
        </button>
        {WARDS.map((w) => (
          <button
            key={w.id}
            onClick={() => setSelectedWard(w.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              selectedWard === w.id
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-muted-foreground border-border hover:border-foreground/30"
            }`}
          >
            {w.name}
          </button>
        ))}
      </div>

      {/* Bed grid */}
      <Card className="border-border/60 shadow-soft rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">
              {selectedWard === "all" ? "All Beds" : WARDS.find((w) => w.id === selectedWard)?.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{filteredBeds.length} beds · click any bed for details</p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap">
            {Object.entries(BED_STATUS).map(([key, info]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: info.color }} />
                <span className="text-[10px] text-muted-foreground">{info.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredBeds.map((bed, i) => (
            <BedCard key={bed.id} bed={bed} delay={i * 0.03} onDischarge={() => handleDischarge(bed)} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function BedCard({ bed, delay, onDischarge }: { bed: Bed & { _live?: boolean }; delay: number; onDischarge?: () => void }) {
  const statusInfo = BED_STATUS[bed.status];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -2 }}
      className={`p-3 rounded-xl border ${statusInfo.bg} transition-all cursor-pointer relative overflow-hidden`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <BedDouble className={`h-4 w-4 ${statusInfo.text}`} />
          <span className="text-xs font-mono font-semibold">{bed.number}</span>
        </div>
        <span className="w-2 h-2 rounded-full" style={{ background: statusInfo.color }} />
      </div>

      {bed.status === "occupied" && bed.patientName ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ColorAvatar name={bed.patientName} color="oklch(0.535 0.195 245)" size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{bed.patientName}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{bed.mrn}</p>
            </div>
          </div>
          <div className="space-y-1 text-[10px] text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Admitted</span>
              <span className="font-medium text-foreground">{bed.admittedOn}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Discharge</span>
              <span className="font-medium text-foreground">{bed.expectedDischarge}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Attending</span>
              <span className="font-medium text-foreground truncate ml-1">{bed.attending?.split(" ").slice(-1)[0]}</span>
            </div>
          </div>
          {bed.condition && (
            <div className="mt-2 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between gap-2">
                <StatusPill status={CONDITION_INFO[bed.condition].status}>
                  {CONDITION_INFO[bed.condition].label}
                </StatusPill>
                {bed.status === "occupied" && (
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); onDischarge?.(); }}>Discharge</Button>
                )}
              </div>
            </div>
          )}
          {bed.status === "occupied" && !bed.condition && (
            <div className="mt-2 pt-2 border-t border-border/40">
              <Button size="sm" variant="outline" className="w-full h-6 text-[10px]" onClick={(e) => { e.stopPropagation(); onDischarge?.(); }}>Discharge</Button>
            </div>
          )}
        </div>
      ) : bed.status === "cleaning" ? (
        <div className="py-3 text-center">
          <Sparkles className="h-5 w-5 text-blue-500 mx-auto mb-1" />
          <p className="text-[10px] text-blue-700 font-medium">Cleaning in progress</p>
        </div>
      ) : bed.status === "reserved" ? (
        <div className="py-3 text-center">
          <Lock className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <p className="text-[10px] text-amber-700 font-medium">Reserved</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">Awaiting admission</p>
        </div>
      ) : bed.status === "maintenance" ? (
        <div className="py-3 text-center">
          <Wrench className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground font-medium">Under maintenance</p>
        </div>
      ) : (
        <div className="py-3 text-center">
          <BedDouble className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-[10px] text-emerald-700 font-medium">Available</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">Ready for admission</p>
        </div>
      )}
    </motion.div>
  );
}
