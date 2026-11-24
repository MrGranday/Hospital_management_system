"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Thermometer,
  Droplet,
  Weight,
  Ruler,
  ChevronRight,
  User,
  Pill,
  FlaskConical,
  FileText,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColorAvatar, StatusPill, KpiCard } from "@/components/shared/ui-bits";
import { useAppStore } from "@/store/app-store";
import type { OpdVisitStatus, OpdVisitUi } from "@/features/visits/opd-types";
import { listOpdQueueForUi, updateVisitStatusForUi } from "@/features/visits/ui-actions";
import { cn } from "@/lib/utils";

type TabKey = "queue" | "waiting" | "vitals" | "consultation" | "completed";

const TAB_LABELS: { key: TabKey; label: string }[] = [
  { key: "queue", label: "Today's Queue" },
  { key: "waiting", label: "Waiting" },
  { key: "vitals", label: "Vitals" },
  { key: "consultation", label: "In Consultation" },
  { key: "completed", label: "Completed" },
];

export default function OPD() {
  const { pageParam, openModal, pushToast, logActivity, opdVersion, bumpOpdVersion } =
    useAppStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("queue");
  const [selectedVisit, setSelectedVisit] = useState<string | null>(pageParam || null);
  const [visits, setVisits] = useState<OpdVisitUi[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    listOpdQueueForUi()
      .then((result) => {
        if (!active) return;
        if (result.ok) {
          setVisits(result.visits);
        } else {
          setVisits([]);
          setError(result.error);
        }
      })
      .catch(() => {
        if (!active) return;
        setVisits([]);
        setError("Could not load the OPD queue. Try again.");
      });

    return () => {
      active = false;
    };
  }, [opdVersion]);

  const loading = visits === null;
  const allVisits = visits ?? [];

  const tabs = TAB_LABELS.map((tab) => ({
    ...tab,
    count:
      tab.key === "queue"
        ? allVisits.length
        : allVisits.filter((visit) => visit.status === tab.key).length,
  }));

  const filtered = allVisits.filter((visit) => {
    if (activeTab === "queue") return true;
    return visit.status === activeTab;
  });

  const visit = allVisits.find((v) => v.id === selectedVisit);

  const handleAdvance = async (target: OpdVisitUi, next: OpdVisitStatus) => {
    if (pendingId) return;
    setPendingId(target.id);

    const result = await updateVisitStatusForUi({
      visitId: target.id,
      version: target.version,
      status: next,
    });

    setPendingId(null);

    if (!result.ok) {
      pushToast({
        title: "Could not update the visit",
        description: result.error,
        variant: "danger",
      });
      return;
    }

    pushToast({
      title: next === "completed" ? "Visit completed" : "Consultation started",
      description: target.patientName,
      variant: "success",
    });
    logActivity({
      action: next === "completed" ? "Completed consultation" : "Started consultation",
      category: "opd",
      details: `${target.patientName} (${target.mrn}) with ${target.doctorName}`,
    });
    bumpOpdVersion();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">Outpatient Department</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">OPD Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">Patient flow for {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <Button size="sm" className="bg-brand-600 hover:bg-brand-700 h-9" onClick={() => openModal("newPatient")}>
          <Plus className="h-4 w-4 mr-1.5" />
          Walk-in Registration
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="In Queue" value={allVisits.filter((v) => v.status === "waiting").length} icon={Clock} accent="amber" delay={0} />
        <KpiCard label="In Consultation" value={allVisits.filter((v) => v.status === "consultation").length} icon={Stethoscope} accent="brand" delay={0.05} />
        <KpiCard label="Vitals" value={allVisits.filter((v) => v.status === "vitals").length} icon={Activity} accent="blue" delay={0.1} />
        <KpiCard label="Completed Today" value={allVisits.filter((v) => v.status === "completed").length} icon={CheckCircle2} accent="emerald" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Queue list - 2 cols */}
        <div className="lg:col-span-2 space-y-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
                  activeTab === tab.key
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                  activeTab === tab.key ? "bg-brand-100 text-brand-700" : "bg-muted-foreground/15 text-muted-foreground",
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Visit cards */}
          <div className="space-y-2">
            {loading && (
              <Card className="border-border/60 shadow-soft rounded-xl p-8 text-center text-sm text-muted-foreground">
                Loading today&apos;s OPD queue…
              </Card>
            )}

            {!loading && error && (
              <Card className="border-border/60 shadow-soft rounded-xl p-8 text-center">
                <AlertTriangle className="h-7 w-7 mx-auto text-amber-500 mb-2" />
                <p className="text-sm font-medium text-foreground">{error}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => { setError(null); setVisits(null); bumpOpdVersion(); }}>
                  Retry
                </Button>
              </Card>
            )}

            {!loading && !error && filtered.length === 0 && (
              <Card className="border-border/60 shadow-soft rounded-xl p-8 text-center text-sm text-muted-foreground">
                <Stethoscope className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No visits in this queue.
              </Card>
            )}

            <AnimatePresence mode="popLayout">
              {filtered.map((visit, i) => (
                <motion.div
                  key={visit.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                >
                  <VisitCard
                    visit={visit}
                    selected={selectedVisit === visit.id}
                    onClick={() => setSelectedVisit(visit.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Detail panel - 1 col */}
        <div className="lg:sticky lg:top-0 h-fit">
          {visit ? (
            <VisitDetail
              visit={visit}
              pending={pendingId === visit.id}
              onAdvance={(next) => handleAdvance(visit, next)}
              onRecord={() => router.push(`/visits/${visit.id}`)}
              onRx={() => openModal("newPrescription", { patientId: visit.patientId })}
              onLabs={() => openModal("newLabOrder", { patientId: visit.patientId })}
              onNotes={() => openModal("newNote", { patientId: visit.patientId })}
            />
          ) : (
            <Card className="border-border/60 shadow-soft rounded-xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-accent mx-auto flex items-center justify-center mb-3">
                <Stethoscope className="h-7 w-7 text-muted-foreground/60" />
              </div>
              <p className="font-medium text-foreground">Select a visit</p>
              <p className="text-sm text-muted-foreground mt-1">Click any patient on the left to see full visit details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function VisitCard({ visit, selected, onClick }: { visit: OpdVisitUi; selected: boolean; onClick: () => void }) {
  const statusInfo = getVisitStatusInfo(visit.status);
  const demographic =
    visit.age !== null
      ? `${visit.age}${visit.gender === "?" ? "" : visit.gender}`
      : visit.gender === "?"
        ? ""
        : visit.gender;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all bg-card group",
        selected
          ? "border-brand-300 ring-2 ring-brand-100 shadow-premium"
          : "border-border/60 hover:border-border hover:shadow-soft",
      )}
    >
      <div className="flex items-start gap-3">
        <ColorAvatar name={visit.patientName} color={visit.avatarColor} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground truncate">{visit.patientName}</p>
                {demographic && <span className="text-xs text-muted-foreground">{demographic}</span>}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{visit.mrn}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <StatusPill status={statusInfo.status}>{statusInfo.label}</StatusPill>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{visit.reason}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {visit.checkInTime}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {visit.doctorName}
            </span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-brand-500 transition-colors" />
      </div>
    </button>
  );
}

function VisitDetail({
  visit,
  pending,
  onAdvance,
  onRecord,
  onRx,
  onLabs,
  onNotes,
}: {
  visit: OpdVisitUi;
  pending: boolean;
  onAdvance: (next: OpdVisitStatus) => void;
  onRecord: () => void;
  onRx: () => void;
  onLabs: () => void;
  onNotes: () => void;
}) {
  const statusInfo = getVisitStatusInfo(visit.status);
  const canStart = visit.status === "waiting" || visit.status === "vitals";
  const canComplete = visit.status === "consultation";
  const primaryLabel = canComplete ? "Mark Completed" : "Start Consultation";
  const primaryDisabled = pending || (!canStart && !canComplete);
  const nextStatus: OpdVisitStatus = canComplete ? "completed" : "consultation";

  return (
    <Card className="border-border/60 shadow-premium rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-gradient-to-br from-brand-50 to-brand-100/40 border-b border-border">
        <div className="flex items-start gap-3">
          <ColorAvatar name={visit.patientName} color={visit.avatarColor} size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-lg">{visit.patientName}</h3>
            <p className="text-xs text-muted-foreground font-mono">{visit.mrn}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusPill status={statusInfo.status}>{statusInfo.label}</StatusPill>
            </div>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="p-5 border-b border-border">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">Reason for Visit</p>
        <p className="text-sm text-foreground leading-relaxed">{visit.reason}</p>
      </div>

      {/* Vitals */}
      {visit.vitals ? (
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Vital Signs</p>
            <Badge variant="outline" className="text-[10px]">Updated {visit.checkInTime}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <VitalCard icon={Heart} label="BP" value={visit.vitals.bp} unit="mmHg" tone="rose" />
            <VitalCard icon={Activity} label="Pulse" value={visit.vitals.pulse} unit="bpm" tone="brand" />
            <VitalCard icon={Thermometer} label="Temp" value={visit.vitals.temp} unit="°F" tone="amber" />
            <VitalCard icon={Droplet} label="SpO₂" value={visit.vitals.spo2} unit="%" tone="blue" />
            <VitalCard icon={Weight} label="Weight" value={visit.vitals.weight} unit="kg" tone="violet" />
            <VitalCard icon={Ruler} label="Height" value={visit.vitals.height} unit="cm" tone="emerald" />
          </div>
        </div>
      ) : (
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Vital Signs</p>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-amber-800">Vitals pending</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Nurse to record vital signs</p>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs bg-white border-amber-300 text-amber-700 hover:bg-amber-50" onClick={onRecord}>
              Record
            </Button>
          </div>
        </div>
      )}

      {/* Doctor */}
      <div className="p-5 border-b border-border">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Assigned To</p>
        <div className="flex items-center gap-3">
          <ColorAvatar name={visit.doctorName} color="oklch(0.42 0.13 200)" />
          <div>
            <p className="text-sm font-medium text-foreground">{visit.doctorName}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 space-y-2">
        <Button
          className="w-full bg-brand-600 hover:bg-brand-700 h-10"
          disabled={primaryDisabled}
          onClick={() => onAdvance(nextStatus)}
        >
          <Stethoscope className="h-4 w-4 mr-2" />
          {pending ? "Saving…" : primaryLabel}
        </Button>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={onRx}>
            <Pill className="h-3.5 w-3.5" />
            Rx
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={onLabs}>
            <FlaskConical className="h-3.5 w-3.5" />
            Labs
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={onNotes}>
            <FileText className="h-3.5 w-3.5" />
            Notes
          </Button>
        </div>
      </div>
    </Card>
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
  tone: "rose" | "brand" | "amber" | "blue" | "violet" | "emerald";
}) {
  const toneClasses = {
    rose: "text-rose-600 bg-rose-50",
    brand: "text-brand-600 bg-brand-50",
    amber: "text-amber-600 bg-amber-50",
    blue: "text-blue-600 bg-blue-50",
    violet: "text-violet-600 bg-violet-50",
    emerald: "text-emerald-600 bg-emerald-50",
  };
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-accent/30 border border-border/50">
      <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", toneClasses[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold tabular-nums">
          {value}<span className="text-[10px] text-muted-foreground ml-0.5">{unit}</span>
        </p>
      </div>
    </div>
  );
}

function getVisitStatusInfo(status: OpdVisitStatus): { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string } {
  switch (status) {
    case "consultation":
      return { status: "info", label: "In Consult" };
    case "vitals":
      return { status: "warning", label: "Vitals" };
    case "waiting":
      return { status: "neutral", label: "Waiting" };
    case "completed":
      return { status: "success", label: "Completed" };
  }
  return { status: "neutral", label: status };
}
