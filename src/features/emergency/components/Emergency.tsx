"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Ambulance,
  Activity,
  Clock,
  AlertTriangle,
  Heart,
  Thermometer,
  Droplet,
  Wind,
  Plus,
  Stethoscope,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EMERGENCY_CASES, type EmergencyCase } from "@/lib/data";
import { KpiCard, StatusPill, ColorAvatar } from "@/components/shell/ui-bits";
import { useAppStore } from "@/store/app-store";

const TRIAGE_LEVELS = [
  { key: "1-critical", label: "1 - Critical", color: "oklch(0.65 0.200 15)", bg: "bg-rose-500", text: "text-rose-700", border: "border-rose-500" },
  { key: "2-emergent", label: "2 - Emergent", color: "oklch(0.65 0.180 25)", bg: "bg-orange-500", text: "text-orange-700", border: "border-orange-500" },
  { key: "3-urgent", label: "3 - Urgent", color: "oklch(0.72 0.160 75)", bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-500" },
  { key: "4-less-urgent", label: "4 - Less Urgent", color: "oklch(0.62 0.130 240)", bg: "bg-blue-500", text: "text-blue-700", border: "border-blue-500" },
  { key: "5-non-urgent", label: "5 - Non-Urgent", color: "oklch(0.62 0.130 200)", bg: "bg-cyan-500", text: "text-cyan-700", border: "border-cyan-500" },
];

const STATUS_INFO: Record<EmergencyCase["status"], { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  waiting: { status: "warning", label: "Waiting" },
  "in-treatment": { status: "info", label: "In Treatment" },
  admitted: { status: "neutral", label: "Admitted" },
  discharged: { status: "success", label: "Discharged" },
  observed: { status: "info", label: "Observation" },
};

export default function Emergency() {
  const [selectedTriage, setSelectedTriage] = useState<string>("all");
  const { openModal, pushToast } = useAppStore();

  const filtered = useMemo(() => {
    return EMERGENCY_CASES
      .filter((c) => selectedTriage === "all" || c.triage === selectedTriage)
      .sort((a, b) => a.triage.localeCompare(b.triage));
  }, [selectedTriage]);

  const stats = useMemo(() => {
    return {
      critical: EMERGENCY_CASES.filter((c) => c.triage === "1-critical").length,
      inTreatment: EMERGENCY_CASES.filter((c) => c.status === "in-treatment").length,
      waiting: EMERGENCY_CASES.filter((c) => c.status === "waiting").length,
      avgWait: Math.round(EMERGENCY_CASES.reduce((s, c) => s + c.waitedMin, 0) / EMERGENCY_CASES.length),
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Emergency Department</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              TRIAGE ACTIVE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Emergency</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time triage board · critical cases first</p>
        </div>
        <Button size="sm" className="h-9 bg-rose-600 hover:bg-rose-700 shadow-blue-glow" onClick={() => openModal("newPatient")}>
          <Plus className="h-4 w-4 mr-1.5" />
          Register ED Patient
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Critical (L1)" value={stats.critical} icon={AlertTriangle} accent="rose" sub="immediate attention" sparkline={[1, 2, 1, 2, 3, 2, 2]} delay={0} />
        <KpiCard label="In Treatment" value={stats.inTreatment} icon={Activity} accent="brand" sub="active cases" sparkline={[3, 4, 3, 5, 4, 4, 4]} delay={0.05} />
        <KpiCard label="Waiting" value={stats.waiting} icon={Clock} accent="amber" sub="awaiting provider" sparkline={[2, 3, 2, 4, 3, 3, 3]} delay={0.1} />
        <KpiCard label="Avg Wait" value={stats.avgWait} format={(v) => `${Math.round(v)}m`} icon={Clock} accent="violet" sub="across all cases" sparkline={[15, 18, 22, 20, 25, 18, 18]} delay={0.15} />
      </div>

      {/* Triage filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedTriage("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            selectedTriage === "all"
              ? "bg-foreground text-background border-foreground"
              : "bg-card text-muted-foreground border-border hover:border-foreground/30"
          }`}
        >
          All ({EMERGENCY_CASES.length})
        </button>
        {TRIAGE_LEVELS.map((level) => {
          const count = EMERGENCY_CASES.filter((c) => c.triage === level.key).length;
          return (
            <button
              key={level.key}
              onClick={() => setSelectedTriage(level.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${
                selectedTriage === level.key
                  ? `${level.bg} text-white border-transparent`
                  : "bg-card text-muted-foreground border-border hover:border-foreground/30"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${level.bg}`} />
              {level.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Triage board - grouped by acuity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((case_, i) => {
          const triageInfo = TRIAGE_LEVELS.find((t) => t.key === case_.triage)!;
          return (
            <motion.div
              key={case_.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              onClick={() => pushToast({ title: "Opening case", description: case_.patientName, variant: "info" })}
              className={`rounded-xl border-l-4 ${triageInfo.border} border border-border/60 bg-card shadow-soft hover:shadow-premium transition-all overflow-hidden cursor-pointer`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <ColorAvatar name={case_.patientName} color={case_.avatarColor} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{case_.patientName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {case_.age}{case_.gender === "M" ? "M" : "F"} · {case_.mrn}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md text-white ${triageInfo.bg}`}>
                          {triageInfo.label}
                        </span>
                        <StatusPill status={STATUS_INFO[case_.status].status}>{STATUS_INFO[case_.status].label}</StatusPill>
                      </div>
                    </div>
                    <p className="text-sm text-foreground mt-2 leading-relaxed">{case_.complaint}</p>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 mt-3">
                  <VitalCard icon={Heart} label="BP" value={case_.vitals.bp} unit="mmHg" tone="rose" />
                  <VitalCard icon={Activity} label="HR" value={case_.vitals.pulse} unit="bpm" tone="brand" />
                  <VitalCard icon={Thermometer} label="Temp" value={case_.vitals.temp} unit="°F" tone="amber" />
                  <VitalCard icon={Droplet} label="SpO₂" value={case_.vitals.spo2} unit="%" tone="blue" />
                  <VitalCard icon={Wind} label="RR" value={case_.vitals.rr} unit="/min" tone="violet" />
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Arrived {case_.arrivalTime}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Stethoscope className="h-3 w-3" />
                      {case_.attending}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md font-medium">
                      Wait {case_.waitedMin}m
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function VitalCard({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit: string;
  tone: "rose" | "brand" | "amber" | "blue" | "violet";
}) {
  const toneClasses = {
    rose: "text-rose-600 bg-rose-50",
    brand: "text-brand-600 bg-brand-50",
    amber: "text-amber-600 bg-amber-50",
    blue: "text-blue-600 bg-blue-50",
    violet: "text-violet-600 bg-violet-50",
  };
  return (
    <div className="p-2 rounded-lg bg-accent/30 border border-border/50 text-center">
      <div className={`w-6 h-6 rounded-md ${toneClasses[tone]} flex items-center justify-center mx-auto mb-1`}>
        <Icon className="h-3 w-3" />
      </div>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold tabular-nums mt-0.5">
        {value}<span className="text-[9px] text-muted-foreground ml-0.5">{unit}</span>
      </p>
    </div>
  );
}
