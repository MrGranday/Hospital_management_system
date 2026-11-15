"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  Radio,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  Microscope,
  X,
  FileText,
  Download,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LAB_ORDERS, type LabOrder } from "@/_legacy/mock-data/data";
import { ColorAvatar, KpiCard, StatusPill } from "@/components/shared/ui-bits";
import { useAppStore, type LiveLabOrder } from "@/store/app-store";
import { printLabReport } from "@/lib/print";

type UnifiedLabOrder = LabOrder | (LiveLabOrder & { type: LabOrder["type"] });

const STATUS_INFO: Record<string, { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string; color: string }> = {
  pending: { status: "neutral", label: "Pending", color: "bg-muted text-muted-foreground" },
  "sample-collected": { status: "info", label: "Sample Collected", color: "bg-brand-50 text-brand-700" },
  "in-progress": { status: "warning", label: "In Progress", color: "bg-amber-50 text-amber-700" },
  completed: { status: "info", label: "Completed", color: "bg-blue-50 text-blue-700" },
  verified: { status: "success", label: "Verified", color: "bg-emerald-50 text-emerald-700" },
};

const PRIORITY_INFO: Record<string, { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  routine: { status: "neutral", label: "Routine" },
  urgent: { status: "warning", label: "Urgent" },
  stat: { status: "danger", label: "STAT" },
};

const TABS = [
  { key: "all", label: "All Orders" },
  { key: "pathology", label: "Pathology", icon: FlaskConical },
  { key: "radiology", label: "Radiology", icon: Radio },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function Lab() {
  const { openModal, liveLabOrders, pushToast, logActivity, updateLabOrderStatus } = useAppStore();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [selectedOrder, setSelectedOrder] = useState<UnifiedLabOrder | null>(null);

  // Merge live (pathology) + static. Live orders always have type "pathology".
  const allOrders: UnifiedLabOrder[] = useMemo(() => {
    const live: UnifiedLabOrder[] = liveLabOrders.map((o) => ({ ...o, type: "pathology" as const, orderedAt: o.date }));
    return [...live, ...LAB_ORDERS];
  }, [liveLabOrders]);

  const filtered = useMemo(() => {
    return allOrders.filter((o) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || o.patientName.toLowerCase().includes(q) || o.number.toLowerCase().includes(q);
      const matchesTab = activeTab === "all" || o.type === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [allOrders, search, activeTab]);

  const stats = useMemo(() => {
    return {
      pending: allOrders.filter((o) => ["pending", "sample-collected", "in-progress"].includes(o.status)).length,
      completedToday: allOrders.filter((o) => ["completed", "verified"].includes(o.status)).length,
      stat: allOrders.filter((o) => o.priority === "stat").length,
      verified: allOrders.filter((o) => o.status === "verified").length,
    };
  }, [allOrders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">Laboratory & Diagnostics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Laboratory</h1>
          <p className="text-sm text-muted-foreground mt-1">Track lab orders from request to verified results</p>
        </div>
        <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700" onClick={() => openModal("newLabOrder")}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Lab Order
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Pending Orders" value={stats.pending} icon={Clock} accent="amber" delay={0} />
        <KpiCard label="Completed Today" value={stats.completedToday} icon={CheckCircle2} accent="emerald" delay={0.05} />
        <KpiCard label="STAT Orders" value={stats.stat} icon={Microscope} accent="rose" delay={0.1} />
        <KpiCard label="Verified Results" value={stats.verified} icon={FileText} accent="brand" delay={0.15} />
      </div>

      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lab orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === tab.key ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {"icon" in tab && tab.icon && <tab.icon className="h-3.5 w-3.5" />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border/50">
          <AnimatePresence initial={false}>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-sm text-muted-foreground">
                <FlaskConical className="h-10 w-10 mx-auto mb-3 opacity-30" />
                No lab orders match your search.
              </div>
            )}
            {filtered.map((order, i) => {
              const TypeIcon = order.type === "pathology" ? FlaskConical : Radio;
              return (
                <motion.button
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors text-left group"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    order.type === "pathology" ? "bg-brand-50 text-brand-600" : "bg-violet-50 text-violet-600"
                  }`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-mono text-xs text-brand-600 font-medium">{order.number}</p>
                      <StatusPill status={PRIORITY_INFO[order.priority].status}>{PRIORITY_INFO[order.priority].label}</StatusPill>
                      {order.resultReady && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                          Result Ready
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground group-hover:text-brand-600 transition-colors">
                      {order.patientName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">{order.tests.join(" · ")}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">Ordered by {order.orderedBy} at {(order as any).orderedAt ?? (order as any).date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusPill status={STATUS_INFO[order.status].status}>{STATUS_INFO[order.status].label}</StatusPill>
                    <ColorAvatar name={order.patientName} color="oklch(0.62 0.14 200)" size="sm" />
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </Card>

      <LabOrderDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}

function LabOrderDrawer({ order, onClose }: { order: UnifiedLabOrder | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-background shadow-premium overflow-y-auto"
          >
            <LabOrderDetail order={order} onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function LabOrderDetail({ order, onClose }: { order: UnifiedLabOrder; onClose: () => void }) {
  const { openModal, updateLabOrderStatus, pushToast, logActivity } = useAppStore();
  const TypeIcon = order.type === "pathology" ? FlaskConical : Radio;
  const statusInfo = STATUS_INFO[order.status];
  const priorityInfo = PRIORITY_INFO[order.priority];

  const isLive = (order as any).id?.startsWith("lab-");

  const advanceStatus = (next: "sample-collected" | "in-progress" | "completed" | "verified") => {
    if (isLive) {
      updateLabOrderStatus(order.id, next);
      logActivity({ action: `Lab status → ${next}`, category: "clinical", details: `${order.number} — ${order.patientName}` });
      pushToast({ title: `Status: ${STATUS_INFO[next].label}`, description: order.number, variant: "success" });
    } else {
      pushToast({ title: "Demo data — cannot mutate", description: "Place a new lab order to test the workflow.", variant: "info" });
    }
  };

  const handleViewResults = () => {
    openModal("viewLabResult", { order });
  };

  const handleDownloadPdf = () => {
    printLabReport({
      number: order.number,
      patientName: order.patientName,
      mrn: order.mrn,
      date: new Date().toISOString(),
      orderedBy: order.orderedBy,
      tests: (order as any).results ?? order.tests.map((t: string) => ({ name: t, result: "Pending", range: "—", flag: "normal" as const })),
    });
    logActivity({ action: "Downloaded lab report PDF", category: "clinical", details: order.number });
  };

  return (
    <div>
      <div className="p-5 bg-gradient-to-br from-brand-700 to-brand-900 text-white relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 text-xs text-brand-200 mb-2">
          <TypeIcon className="h-3.5 w-3.5" />
          <span className="font-mono">{order.number}</span>
        </div>
        <h2 className="text-xl font-bold">{order.patientName}</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] bg-white/15 px-2 py-0.5 rounded-md font-medium">{statusInfo.label}</span>
          <span className="text-[11px] bg-white/15 px-2 py-0.5 rounded-md font-medium">{priorityInfo.label}</span>
          <span className="text-[11px] text-brand-200 capitalize">{order.type}</span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-accent/30 border border-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ordered By</p>
            <p className="font-medium mt-1">{order.orderedBy}</p>
          </div>
          <div className="p-3 rounded-lg bg-accent/30 border border-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ordered At</p>
            <p className="font-medium mt-1 tabular-nums">{(order as any).orderedAt ?? (order as any).date}</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2.5">Tests Requested</p>
          <div className="space-y-1.5">
            {order.tests.map((test, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border/60">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
                  order.status === "verified" ? "bg-emerald-50 text-emerald-600" :
                  order.status === "completed" ? "bg-blue-50 text-blue-600" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {order.status === "verified" ? <CheckCircle2 className="h-4 w-4" /> : <Microscope className="h-4 w-4" />}
                </div>
                <span className="text-sm font-medium flex-1">{test}</span>
                <span className="text-xs text-muted-foreground capitalize">{order.status.replace("-", " ")}</span>
              </div>
            ))}
          </div>
        </div>

        {order.resultReady && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/30 border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-800">Results Available</p>
            </div>
            <p className="text-xs text-emerald-700 mb-3">Lab results have been verified and are ready for clinical review.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={handleViewResults}>
                <FileText className="h-4 w-4 mr-1.5" />
                View Results
              </Button>
              <Button variant="outline" size="sm" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4 mr-1.5" />
                Download PDF
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="h-10" disabled={order.status !== "pending"} onClick={() => advanceStatus("sample-collected")}>Collect Sample</Button>
          <Button variant="outline" size="sm" className="h-10" disabled={order.status !== "sample-collected"} onClick={() => advanceStatus("in-progress")}>Enter Result</Button>
          <Button size="sm" className="h-10 bg-brand-600 hover:bg-brand-700" disabled={order.status !== "in-progress" && order.status !== "completed"} onClick={() => { if (isLive) openModal("viewLabResult", { order }); else advanceStatus("verified"); }}>Verify</Button>
        </div>
      </div>
    </div>
  );
}
