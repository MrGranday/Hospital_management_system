"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Pill,
  Activity,
  Stethoscope,
  Plus,
  Calendar,
  AlertTriangle,
  Heart,
  Download,
  Syringe,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  PATIENTS, PATIENT_TIMELINE, ACTIVE_MEDICATIONS,
  type ClinicalNote, type Encounter, type MedicationRecord, type Patient,
} from "@/_legacy/mock-data/data";
import { StatusPill, ColorAvatar } from "@/components/shared/ui-bits";
import { useAppStore } from "@/store/app-store";
import { printDoc } from "@/lib/print";

const VITALS_TREND = [
  { day: "Mon", bp_sys: 138, bp_dia: 88, hr: 82, spo2: 97 },
  { day: "Tue", bp_sys: 142, bp_dia: 91, hr: 88, spo2: 97 },
  { day: "Wed", bp_sys: 145, bp_dia: 93, hr: 90, spo2: 96 },
  { day: "Thu", bp_sys: 140, bp_dia: 89, hr: 85, spo2: 97 },
  { day: "Fri", bp_sys: 138, bp_dia: 87, hr: 80, spo2: 98 },
  { day: "Sat", bp_sys: 135, bp_dia: 85, hr: 78, spo2: 98 },
  { day: "Sun", bp_sys: 132, bp_dia: 82, hr: 76, spo2: 99 },
];

const TABS = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "timeline", label: "Timeline", icon: ClipboardList },
  { key: "medications", label: "Medications", icon: Pill },
  { key: "vitals", label: "Vitals Chart", icon: Heart },
  { key: "notes", label: "Clinical Notes", icon: FileText },
] as const;
type TabKey = typeof TABS[number]["key"];

export default function EMR() {
  const { openModal, pushToast, livePatients, liveNotes } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const firstPatient = PATIENTS[0]!;
  const [patientId, setPatientId] = useState<string>(firstPatient.id);
  // Merge live + static patients (live first)
  const allPatients: Patient[] = [...livePatients, ...PATIENTS];
  const patient = allPatients.find((p) => p.id === patientId) ?? firstPatient;

  const handleExport = () => {
    const liveNotesForPatient = liveNotes.filter((n) => n.patientId === patient.id);
    const notesHtml = liveNotesForPatient.length
      ? liveNotesForPatient.map((n) => `<p><strong>${n.type} — ${n.date}</strong> (${n.author}): ${n.content}</p>`).join("")
      : "<p>No clinical notes recorded in this session.</p>";
    const medsHtml = ACTIVE_MEDICATIONS.length
      ? `<ul>${ACTIVE_MEDICATIONS.map((m) => `<li>${m.name} ${m.dose} — ${m.frequency} (${m.route})</li>`).join("")}</ul>`
      : "<p>No active medications.</p>";
    printDoc({
      title: `Clinical Summary — ${patient.name}`,
      docType: "Clinical Summary",
      docNum: patient.mrn,
      patient: patient.name,
      mrn: patient.mrn,
      date: new Date().toISOString(),
      body: `<h3>Active Problems</h3><p>${patient.chronicConditions.join(", ") || "None"}</p><h3>Allergies</h3><p>${patient.allergies.join(", ") || "No known allergies"}</p><h3>Active Medications</h3>${medsHtml}<h3>Recent Clinical Notes</h3>${notesHtml}`,
    });
    pushToast({ title: "Exporting...", description: "Clinical summary sent to print preview", variant: "info" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Electronic Medical Record</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Patient Chart</h1>
          <p className="text-sm text-muted-foreground mt-1">Longitudinal view of patient history, notes, and medications</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="h-9 rounded-md border border-border bg-card text-sm px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            aria-label="Select patient"
          >
            {allPatients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} · {p.mrn}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700 shadow-blue-glow" onClick={() => openModal("newNote", { patientId: patient.id })}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Note
          </Button>
        </div>
      </div>

      {/* Patient banner */}
      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        <div className="p-5 bg-gradient-to-br from-brand-50 to-brand-100/30 border-b border-border">
          <div className="flex items-start gap-4">
            <ColorAvatar name={patient.name} color={patient.avatarColor} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{patient.name}</h2>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{patient.mrn}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusPill status="info">Admitted</StatusPill>
                  <StatusPill status="danger">⚠ Penicillin</StatusPill>
                  <Badge variant="outline" className="text-[10px]">{patient.bloodType}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
                <span>{patient.age}y · {patient.gender === "M" ? "Male" : "Female"}</span>
                <span>·</span>
                <span>Registered {new Date(patient.registeredOn).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                <span>·</span>
                <span>{patient.phone}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {patient.chronicConditions.map((c) => (
                  <Badge key={c} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          <QuickStat label="Active Meds" value={ACTIVE_MEDICATIONS.length} icon={Pill} />
          <QuickStat label="Encounters" value={PATIENT_TIMELINE.filter((t) => "type" in t && (t.type === "OPD" || t.type === "Emergency" || t.type === "IPD")).length} icon={Stethoscope} />
          <QuickStat label="Allergies" value={patient.allergies.length} icon={AlertTriangle} tone="rose" />
          <QuickStat label="Balance" value={`$${patient.balance.toLocaleString()}`} icon={FileText} tone="amber" />
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
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "overview" && <OverviewTab patient={patient} />}
          {activeTab === "timeline" && <TimelineTab />}
          {activeTab === "medications" && <MedicationsTab />}
          {activeTab === "vitals" && <VitalsTab />}
          {activeTab === "notes" && <NotesTab patient={patient} />}
        </div>
      </Card>
    </div>
  );
}

function QuickStat({ label, value, icon: Icon, tone = "default" }: { label: string; value: string | number; icon: React.ElementType; tone?: "default" | "rose" | "amber" }) {
  const colorClass = tone === "rose" ? "text-rose-600 bg-rose-50" : tone === "amber" ? "text-amber-600 bg-amber-50" : "text-brand-600 bg-brand-50";
  return (
    <div className="p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-lg font-bold tabular-nums">{value}</p>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

function OverviewTab({ patient }: { patient: typeof PATIENTS[0] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Active Problems</p>
          <div className="space-y-1.5">
            {patient.chronicConditions.map((c) => (
              <div key={c} className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="text-sm font-medium text-amber-800">{c}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Allergies</p>
          <div className="space-y-1.5">
            {patient.allergies.length > 0 ? patient.allergies.map((a) => (
              <div key={a} className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <span className="text-rose-600">⚠</span>
                <span className="text-sm font-medium text-rose-800">{a}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No known allergies</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Latest Vitals</p>
          <div className="grid grid-cols-2 gap-2">
            <VitalTile label="Blood Pressure" value="132/82" unit="mmHg" tone="brand" />
            <VitalTile label="Heart Rate" value="76" unit="bpm" tone="rose" />
            <VitalTile label="Temperature" value="98.4" unit="°F" tone="amber" />
            <VitalTile label="SpO₂" value="99" unit="%" tone="blue" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Recent Encounters</p>
          <div className="space-y-2">
            {PATIENT_TIMELINE.filter((t): t is Encounter => "type" in t && (t.type === "OPD" || t.type === "Emergency" || t.type === "IPD")).slice(0, 3).map((enc) => (
              <div key={enc.id} className="p-2.5 rounded-lg bg-accent/30 border border-border/50">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-brand-700">{enc.type}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(enc.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
                <p className="text-xs text-foreground mt-1">{enc.reason}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{enc.diagnosis}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VitalTile({ label, value, unit, tone }: { label: string; value: string; unit: string; tone: "brand" | "rose" | "amber" | "blue" }) {
  const toneClasses = {
    brand: "from-brand-500/10 to-brand-500/5 text-brand-600",
    rose: "from-rose-500/10 to-rose-500/5 text-rose-600",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-600",
    blue: "from-blue-500/10 to-blue-500/5 text-blue-600",
  };
  return (
    <div className={`p-3 rounded-lg bg-gradient-to-br ${toneClasses[tone]} border border-border/50`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tabular-nums mt-0.5">
        {value}<span className="text-[10px] text-muted-foreground ml-0.5">{unit}</span>
      </p>
    </div>
  );
}

function TimelineTab() {
  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />

      <div className="space-y-4">
        {PATIENT_TIMELINE.map((item, i) => {
          const isNote = "type" in item && (item.type === "SOAP" || item.type === "Progress" || item.type === "Nursing" || item.type === "Discharge" || item.type === "Admission");
          const isEncounter = "type" in item && (item.type === "OPD" || item.type === "Emergency" || item.type === "IPD" || item.type === "Telemedicine" || item.type === "Procedure");
          const isMed = "name" in item;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="relative"
            >
              <div className={`absolute -left-4 top-3 w-3 h-3 rounded-full border-2 border-background ${
                isNote ? "bg-brand-500" : isEncounter ? "bg-emerald-500" : "bg-violet-500"
              }`} />

              <Card className="border-border/60 shadow-soft rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">
                      {item.date ? new Date(item.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "—"}
                      {"time" in item && item.time && ` · ${item.time}`}
                    </span>
                  </div>
                  {isNote && (
                    <Badge variant="outline" className="text-[10px] bg-brand-50 text-brand-700 border-brand-200">
                      {(item as ClinicalNote).type}
                    </Badge>
                  )}
                  {isEncounter && (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      {(item as Encounter).type}
                    </Badge>
                  )}
                  {isMed && (
                    <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-700 border-violet-200">
                      Medication
                    </Badge>
                  )}
                </div>

                {isNote && (
                  <NoteContent note={item as ClinicalNote} />
                )}
                {isEncounter && (
                  <div>
                    <p className="text-sm font-medium text-foreground">{(item as Encounter).reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">Diagnosis: {(item as Encounter).diagnosis}</p>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Provider: {(item as Encounter).provider} · {(item as Encounter).department}
                    </p>
                  </div>
                )}
                {isMed && (
                  <div>
                    <p className="text-sm font-medium text-foreground">{(item as MedicationRecord).name} {(item as MedicationRecord).dose}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(item as MedicationRecord).frequency} · {(item as MedicationRecord).route}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Prescribed by {(item as MedicationRecord).prescribedBy}
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function NoteContent({ note }: { note: ClinicalNote }) {
  if (note.type === "SOAP" && note.subjective) {
    return (
      <div className="space-y-2 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-brand-700">Subjective</p>
          <p className="text-foreground mt-0.5">{note.subjective}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-brand-700">Objective</p>
          <p className="text-foreground mt-0.5">{note.objective}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-brand-700">Assessment</p>
          <p className="text-foreground mt-0.5">{note.assessment}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-brand-700">Plan</p>
          <p className="text-foreground mt-0.5">{note.plan}</p>
        </div>
      </div>
    );
  }
  return <p className="text-sm text-foreground">{note.content}</p>;
}

function MedicationsTab() {
  const { openModal } = useAppStore();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Active medications for this patient</p>
        <Button size="sm" className="h-8 text-xs bg-brand-600 hover:bg-brand-700" onClick={() => openModal("newPrescription")}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Prescribe
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <Th>Medication</Th>
              <Th>Dose</Th>
              <Th>Frequency</Th>
              <Th>Route</Th>
              <Th>Start Date</Th>
              <Th>Prescribed By</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {ACTIVE_MEDICATIONS.map((med, i) => (
              <motion.tr
                key={med.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className="border-b border-border/50 hover:bg-accent/30"
              >
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                      <Pill className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{med.name}</span>
                  </div>
                </Td>
                <Td><span className="text-sm font-semibold tabular-nums">{med.dose}</span></Td>
                <Td><span className="text-sm">{med.frequency}</span></Td>
                <Td><Badge variant="outline" className="text-[10px]">{med.route}</Badge></Td>
                <Td><span className="text-xs text-muted-foreground">{new Date(med.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></Td>
                <Td><span className="text-xs text-muted-foreground">{med.prescribedBy}</span></Td>
                <Td><StatusPill status="success">Active</StatusPill></Td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VitalsTab() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">Vital Signs Trend</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Last 7 days</p>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={VITALS_TREND} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="bpSysGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.535 0.195 245)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="oklch(0.535 0.195 245)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.65 0.200 15)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="oklch(0.65 0.200 15)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.008 255)" vertical={false} />
            <XAxis dataKey="day" stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "white",
                border: "1px solid oklch(0.92 0.008 255)",
                borderRadius: "0.75rem",
                fontSize: "12px",
              }}
            />
            <Area type="monotone" dataKey="bp_sys" stroke="oklch(0.535 0.195 245)" strokeWidth={2.5} fill="url(#bpSysGrad)" name="BP Systolic" />
            <Area type="monotone" dataKey="hr" stroke="oklch(0.65 0.200 15)" strokeWidth={2} fill="url(#hrGrad)" name="Heart Rate" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function NotesTab({ patient }: { patient: Patient }) {
  const { openModal, liveNotes } = useAppStore();
  const staticNotes = PATIENT_TIMELINE.filter((t): t is ClinicalNote => "type" in t && (t.type === "SOAP" || t.type === "Progress" || t.type === "Nursing"));
  const liveNotesForPatient: ClinicalNote[] = liveNotes
    .filter((n) => n.patientId === patient.id)
    .map((n) => ({
      id: n.id,
      date: n.date,
      time: "",
      author: n.author,
      authorRole: n.type,
      type: "Progress" as const,
      content: n.content,
    }));
  const notes = [...liveNotesForPatient, ...staticNotes];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{notes.length} clinical notes on record</p>
        <Button size="sm" className="h-8 text-xs bg-brand-600 hover:bg-brand-700" onClick={() => openModal("newNote", { patientId: patient.id })}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          New Note
        </Button>
      </div>
      <div className="relative pl-6">
        <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
        <div className="space-y-3">
          {notes.map((note, i) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="relative"
            >
              <div className="absolute -left-4 top-3 w-3 h-3 rounded-full border-2 border-background bg-brand-500" />
              <Card className="border-border/60 shadow-soft rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{note.type} Note</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(note.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{note.time ? ` · ${note.time}` : ""} · {note.author}{note.authorRole ? ` (${note.authorRole})` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{note.type}</Badge>
                </div>
                <NoteContent note={note} />
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2.5">{children}</td>;
}
