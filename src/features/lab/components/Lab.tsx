"use client";

import { useEffect, useMemo, useState } from "react";
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
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ColorAvatar, KpiCard, StatusPill } from "@/components/shared/ui-bits";
import { useAppStore } from "@/store/app-store";
import { printLabReport } from "@/lib/print";
import type { LabOrderStatus, LabOrderUi } from "@/features/lab/lab-types";
import {
  listLabOrdersForUi,
  updateLabOrderStatusForUi,
  verifyLabOrderForUi,
} from "@/features/lab/ui-actions";

const STATUS_INFO: Record<
  LabOrderStatus,
  { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string; color: string }
> = {
  pending: { status: "neutral", label: "Pending", color: "bg-muted text-muted-foreground" },
  "sample-collected": { status: "info", label: "Sample Collected", color: "bg-brand-50 text-brand-700" },
  "in-progress": { status: "warning", label: "In Progress", color: "bg-amber-50 text-amber-700" },
  completed: { status: "info", label: "Completed", color: "bg-blue-50 text-blue-700" },
  verified: { status: "success", label: "Verified", color: "bg-emerald-50 text-emerald-700" },
  cancelled: { status: "danger", label: "Cancelled", color: "bg-rose-50 text-rose-700" },
};

const PRIORITY_INFO: Record<
  LabOrderUi["priority"],
  { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string }
> = {
  routine: { status: "neutral", label: "Routine" },
  urgent: { status: "warning", label: "Urgent" },
  stat: { status: "danger", label: "STAT" },
};

const TABS = [
  { key: "all", label: "All Orders" },
  { key: "pathology", label: "Pathology", icon: FlaskConical },
  { key: "radiology", label: "Radiology", icon: Radio },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isToday(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function Lab() {
  const { openModal, labVersion, bumpLabVersion } = useAppStore();
  const [orders, setOrders] = useState<LabOrderUi[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canVerify, setCanVerify] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    listLabOrdersForUi()
      .then((result) => {
        if (!active) return;
        if (result.ok) {
          setOrders(result.orders);
          setCanCreate(result.canCreate);
          setCanUpdate(result.canUpdate);
          setCanVerify(result.canVerify);
          setError(null);
        } else {
          setOrders([]);
          setError(result.error);
        }
      })
      .catch(() => {
        if (!active) return;
        setOrders([]);
        setError("Could not load lab orders. Try again.");
      });

    return () => {
      active = false;
    };
  }, [labVersion]);

  const loading = orders === null;
  const allOrders = useMemo(() => orders ?? [], [orders]);

  const selectedOrder = useMemo(
    () => allOrders.find((order) => order.id === selectedOrderId) ?? null,
    [allOrders, selectedOrderId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allOrders.filter((order) => {
      const matchesSearch =
        !q ||
        order.patientName.toLowerCase().includes(q) ||
        order.number.toLowerCase().includes(q) ||
        order.mrn.toLowerCase().includes(q) ||
        order.tests.some((test) => test.name.toLowerCase().includes(q));
      const matchesTab = activeTab === "all" || order.type === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [allOrders, search, activeTab]);

  const stats = useMemo(
    () => ({
      pending: allOrders.filter((order) =>
        ["pending", "sample-collected", "in-progress"].includes(order.status),
      ).length,
      completedToday: allOrders.filter(
        (order) =>
          (order.status === "completed" || order.status === "verified") &&
          isToday(order.completedAt),
      ).length,
      stat: allOrders.filter((order) => order.priority === "stat").length,
      verified: allOrders.filter((order) => order.status === "verified").length,
    }),
    [allOrders],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">
              Laboratory & Diagnostics
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Laboratory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track lab orders from request to verified results
          </p>
        </div>
        {canCreate && (
          <Button
            size="sm"
            className="h-9 bg-brand-600 hover:bg-brand-700"
            onClick={() => openModal("newLabOrder")}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Lab Order
          </Button>
        )}
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
                  activeTab === tab.key
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {"icon" in tab && tab.icon && <tab.icon className="h-3.5 w-3.5" />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border/50">
          {loading && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <FlaskConical className="h-10 w-10 mx-auto mb-3 opacity-30" />
              Loading lab orders.
            </div>
          )}

          {!loading && error && (
            <div className="py-16 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
              <p className="text-sm font-medium text-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setError(null);
                  setOrders(null);
                  bumpLabVersion();
                }}
              >
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <FlaskConical className="h-10 w-10 mx-auto mb-3 opacity-30" />
              No lab orders match your search.
            </div>
          )}

          <AnimatePresence initial={false}>
            {!loading &&
              !error &&
              filtered.map((order, i) => {
                const TypeIcon = order.type === "pathology" ? FlaskConical : Radio;
                const statusInfo = STATUS_INFO[order.status];
                const priorityInfo = PRIORITY_INFO[order.priority];
                return (
                  <motion.button
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors text-left group"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        order.type === "pathology"
                          ? "bg-brand-50 text-brand-600"
                          : "bg-violet-50 text-violet-600"
                      }`}
                    >
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-mono text-xs text-brand-600 font-medium">{order.number}</p>
                        <StatusPill status={priorityInfo.status}>{priorityInfo.label}</StatusPill>
                        {order.resultReady && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
                          >
                            Result Ready
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground group-hover:text-brand-600 transition-colors">
                        {order.patientName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {order.tests.length > 0
                            ? order.tests.map((test) => test.name).join(" · ")
                            : "No tests recorded"}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Ordered by {order.orderedBy} at {formatWhen(order.orderedAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <StatusPill status={statusInfo.status}>{statusInfo.label}</StatusPill>
                      <ColorAvatar name={order.patientName} color="oklch(0.62 0.14 200)" size="sm" />
                    </div>
                  </motion.button>
                );
              })}
          </AnimatePresence>
        </div>
      </Card>

      <LabOrderDrawer
        order={selectedOrder}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canVerify={canVerify}
        onClose={() => setSelectedOrderId(null)}
        onChanged={bumpLabVersion}
      />
    </div>
  );
}

function LabOrderDrawer({
  order,
  canCreate,
  canUpdate,
  canVerify,
  onClose,
  onChanged,
}: {
  order: LabOrderUi | null;
  canCreate: boolean;
  canUpdate: boolean;
  canVerify: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
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
            <LabOrderDetail
              order={order}
              canCreate={canCreate}
              canUpdate={canUpdate}
              canVerify={canVerify}
              onClose={onClose}
              onChanged={onChanged}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function LabOrderDetail({
  order,
  canCreate,
  canUpdate,
  canVerify,
  onClose,
  onChanged,
}: {
  order: LabOrderUi;
  canCreate: boolean;
  canUpdate: boolean;
  canVerify: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { openModal, pushToast, logActivity } = useAppStore();
  const [busy, setBusy] = useState(false);
  const TypeIcon = order.type === "pathology" ? FlaskConical : Radio;
  const statusInfo = STATUS_INFO[order.status];
  const priorityInfo = PRIORITY_INFO[order.priority];

  const advanceStatus = async (next: "sample_collected" | "in_progress" | "completed") => {
    if (busy) return;
    setBusy(true);
    const result = await updateLabOrderStatusForUi({
      orderId: order.id,
      version: order.version,
      status: next,
    });
    setBusy(false);

    if (!result.ok) {
      pushToast({ title: "Could not update the lab order", description: result.error, variant: "danger" });
      return;
    }

    logActivity({
      action: `Lab order status updated`,
      category: "lab",
      details: `${order.number} — ${order.patientName}`,
    });
    pushToast({
      title: "Lab order updated",
      description: order.number,
      variant: "success",
    });
    onChanged();
  };

  const handleVerify = async () => {
    if (busy) return;
    setBusy(true);
    const result = await verifyLabOrderForUi({ orderId: order.id });
    setBusy(false);

    if (!result.ok) {
      pushToast({ title: "Could not verify results", description: result.error, variant: "danger" });
      return;
    }

    logActivity({
      action: "Verified lab results",
      category: "lab",
      details: `${order.number} — ${order.patientName}`,
    });
    pushToast({
      title: "Results verified",
      description: `${result.verified} test${result.verified === 1 ? "" : "s"} verified`,
      variant: "success",
    });
    onChanged();
  };

  const handleDownloadPdf = () => {
    printLabReport({
      number: order.number,
      patientName: order.patientName,
      mrn: order.mrn,
      date: order.completedAt ?? new Date().toISOString(),
      orderedBy: order.orderedBy,
      tests: order.tests.map((test) => ({
        name: test.name,
        result: test.resultValue ?? "Pending",
        range: test.referenceRange ?? "—",
        flag: test.isAbnormal ? "high" : "normal",
      })),
    });
    logActivity({ action: "Downloaded lab report PDF", category: "lab", details: order.number });
  };

  return (
    <div>
      <div className="p-5 bg-gradient-to-br from-brand-700 to-brand-900 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 text-xs text-brand-200 mb-2">
          <TypeIcon className="h-3.5 w-3.5" />
          <span className="font-mono">{order.number}</span>
        </div>
        <h2 className="text-xl font-bold">{order.patientName}</h2>
        <p className="text-xs text-brand-200 mt-1 font-mono">{order.mrn}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] bg-white/15 px-2 py-0.5 rounded-md font-medium">
            {statusInfo.label}
          </span>
          <span className="text-[11px] bg-white/15 px-2 py-0.5 rounded-md font-medium">
            {priorityInfo.label}
          </span>
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
            <p className="font-medium mt-1 tabular-nums">{formatWhen(order.orderedAt)}</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2.5">
            Tests Requested
          </p>
          <div className="space-y-1.5">
            {order.tests.length === 0 && (
              <p className="text-sm text-muted-foreground">No tests have been recorded for this order.</p>
            )}
            {order.tests.map((test) => (
              <div
                key={test.id}
                className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border/60"
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center ${
                    test.verified
                      ? "bg-emerald-50 text-emerald-600"
                      : test.resultValue
                        ? "bg-blue-50 text-blue-600"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {test.verified ? <CheckCircle2 className="h-4 w-4" /> : <Microscope className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{test.name}</span>
                  {test.resultValue && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Result: <span className={test.isAbnormal ? "text-destructive font-medium" : ""}>{test.resultValue}</span>
                      {test.resultUnit ? ` ${test.resultUnit}` : ""}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {test.verified ? "Verified" : test.status.replace(/_/g, " ")}
                </span>
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
            <p className="text-xs text-emerald-700 mb-3">
              Lab results are ready for clinical review.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => openModal("viewLabResult", { order, canCreate, canVerify })}
              >
                <FileText className="h-4 w-4 mr-1.5" />
                View Results
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={handleDownloadPdf}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Download PDF
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            disabled={!canUpdate || order.status !== "pending" || busy}
            onClick={() => void advanceStatus("sample_collected")}
          >
            Collect Sample
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            disabled={!canCreate || order.status !== "sample-collected" || busy}
            onClick={() => openModal("viewLabResult", { order, canCreate, canVerify })}
          >
            Enter Result
          </Button>
          <Button
            size="sm"
            className="h-10 bg-brand-600 hover:bg-brand-700"
            disabled={
              !canVerify ||
              busy ||
              (order.status !== "in-progress" && order.status !== "completed")
            }
            onClick={() => void handleVerify()}
          >
            Verify
          </Button>
        </div>
      </div>
    </div>
  );
}
