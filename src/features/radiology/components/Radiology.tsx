"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Radio,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  ScanLine,
  Brain,
  Activity,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { IMAGING_STUDIES, type ImagingStudy } from "@/_legacy/mock-data/data";
import { KpiCard, StatusPill, ColorAvatar } from "@/components/shared/ui-bits";
import { useAppStore } from "@/store/app-store";
import { printDoc } from "@/lib/print";

const STATUS_INFO: Record<ImagingStudy["status"], { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  scheduled: { status: "neutral", label: "Scheduled" },
  "in-progress": { status: "info", label: "In Progress" },
  completed: { status: "warning", label: "Awaiting Report" },
  reported: { status: "info", label: "Reported" },
  verified: { status: "success", label: "Verified" },
};

const PRIORITY_INFO: Record<ImagingStudy["priority"], { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  routine: { status: "neutral", label: "Routine" },
  urgent: { status: "warning", label: "Urgent" },
  stat: { status: "danger", label: "STAT" },
};

const MODALITY_ICONS: Record<ImagingStudy["modality"], React.ElementType> = {
  "X-Ray": ScanLine,
  CT: Activity,
  MRI: Brain,
  Ultrasound: Radio,
  Mammography: Eye,
  Fluoroscopy: Activity,
};

const MODALITY_COLORS: Record<ImagingStudy["modality"], string> = {
  "X-Ray": "bg-violet-50 text-violet-600",
  CT: "bg-rose-50 text-rose-600",
  MRI: "bg-brand-50 text-brand-600",
  Ultrasound: "bg-emerald-50 text-emerald-600",
  Mammography: "bg-amber-50 text-amber-600",
  Fluoroscopy: "bg-blue-50 text-blue-600",
};

const TABS = [
  { key: "all", label: "All Studies" },
  { key: "scheduled", label: "Scheduled" },
  { key: "in-progress", label: "In Progress" },
  { key: "reported", label: "Reported" },
  { key: "verified", label: "Verified" },
] as const;
type TabKey = typeof TABS[number]["key"];

export default function Radiology() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const { openModal, pushToast, logActivity } = useAppStore();

  const filtered = useMemo(() => {
    return IMAGING_STUDIES.filter((s) => {
      const matchesTab = activeTab === "all" || s.status === activeTab;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || s.patientName.toLowerCase().includes(q) || s.accession.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, search]);

  const stats = useMemo(() => ({
    total: IMAGING_STUDIES.length,
    scheduled: IMAGING_STUDIES.filter((s) => s.status === "scheduled").length,
    inProgress: IMAGING_STUDIES.filter((s) => s.status === "in-progress").length,
    verified: IMAGING_STUDIES.filter((s) => s.status === "verified").length,
  }), []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Radiology & Imaging</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Radiology</h1>
          <p className="text-sm text-muted-foreground mt-1">Imaging worklist, PACS integration, and reporting</p>
        </div>
        <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700 shadow-blue-glow" onClick={() => openModal("newLabOrder")}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Imaging Order
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Studies" value={stats.total} icon={Radio} accent="brand" delay={0} />
        <KpiCard label="Scheduled" value={stats.scheduled} icon={Clock} accent="amber" sub="awaiting patient" sparkline={[1, 2, 1, 3, 2, 2, 2]} delay={0.05} />
        <KpiCard label="In Progress" value={stats.inProgress} icon={Activity} accent="blue" sub="being scanned" sparkline={[1, 1, 0, 1, 1, 1, 1]} delay={0.1} />
        <KpiCard label="Verified" value={stats.verified} icon={CheckCircle2} accent="emerald" sub="ready for clinician" sparkline={[1, 2, 1, 2, 1, 2, 2]} delay={0.15} />
      </div>

      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by patient or accession..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent/30 border-b border-border">
              <tr>
                <Th>Accession</Th>
                <Th>Patient</Th>
                <Th>Modality</Th>
                <Th>Body Part</Th>
                <Th>Ordered By</Th>
                <Th>Time</Th>
                <Th>Priority</Th>
                <Th>Status</Th>
                <Th className="text-right pr-4">Action</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((study, i) => {
                const ModIcon = MODALITY_ICONS[study.modality];
                return (
                  <motion.tr
                    key={study.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors group"
                  >
                    <Td><span className="text-xs font-mono text-brand-600 font-semibold">{study.accession}</span></Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <ColorAvatar name={study.patientName} color={study.avatarColor} size="sm" />
                        <div>
                          <p className="text-sm font-medium">{study.patientName}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{study.mrn}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${MODALITY_COLORS[study.modality]}`}>
                          <ModIcon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium">{study.modality}</span>
                      </div>
                    </Td>
                    <Td><span className="text-sm">{study.bodyPart}</span></Td>
                    <Td><span className="text-xs text-muted-foreground">{study.orderedBy}</span></Td>
                    <Td><span className="text-xs tabular-nums">{study.orderedAt}</span></Td>
                    <Td><StatusPill status={PRIORITY_INFO[study.priority].status}>{PRIORITY_INFO[study.priority].label}</StatusPill></Td>
                    <Td><StatusPill status={STATUS_INFO[study.status].status}>{STATUS_INFO[study.status].label}</StatusPill></Td>
                    <Td className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="View image" onClick={() => pushToast({ title: "Opening viewer", description: study.accession, variant: "info" })}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Download report" onClick={() => {
                          printDoc({
                            title: `Radiology Report — ${study.accession}`,
                            docType: "Radiology Report",
                            docNum: study.accession,
                            patient: study.patientName,
                            mrn: study.mrn,
                            date: new Date().toISOString(),
                            body: `<h3>${study.modality} — ${study.bodyPart}</h3><p><strong>Ordered by:</strong> ${study.orderedBy}</p><p><strong>Modality:</strong> ${study.modality}</p><p><strong>Priority:</strong> ${study.priority}</p><h4>Finding</h4><p>${study.finding || "Report pending."}</p><p><strong>Radiologist:</strong> ${study.radiologist}</p>`,
                          });
                          logActivity({ action: "Downloaded radiology report", category: "clinical", details: study.accession });
                        }}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Findings preview */}
      {filtered.some((s) => s.finding) && (
        <Card className="border-border/60 shadow-soft rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-600" />
            Recent Findings
          </h3>
          <div className="space-y-2">
            {filtered.filter((s) => s.finding).map((study) => (
              <div key={study.id} className="p-3 rounded-lg bg-accent/30 border border-border/50">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold text-foreground">{study.patientName} — {study.modality} {study.bodyPart}</p>
                  <span className="text-[10px] text-muted-foreground font-mono">{study.accession}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{study.finding}</p>
                <p className="text-[10px] text-muted-foreground mt-2">Reported by {study.radiologist}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${className || ""}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className || ""}`}>{children}</td>;
}
