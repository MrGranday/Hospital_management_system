"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  HeartPulse,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Stethoscope,
  BedDouble,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NURSING_TASKS, type NursingTask } from "@/lib/data";
import { KpiCard, StatusPill, ColorAvatar } from "@/components/shared/ui-bits";
import { useAppStore } from "@/store/app-store";

const TASK_STATUS: Record<NursingTask["status"], { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  pending: { status: "warning", label: "Pending" },
  "in-progress": { status: "info", label: "In Progress" },
  completed: { status: "success", label: "Completed" },
  overdue: { status: "danger", label: "Overdue" },
};

const PRIORITY_INFO: Record<NursingTask["priority"], { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  routine: { status: "neutral", label: "Routine" },
  urgent: { status: "warning", label: "Urgent" },
  stat: { status: "danger", label: "STAT" },
};

const TABS = [
  { key: "all", label: "All Tasks" },
  { key: "pending", label: "Pending" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
] as const;
type TabKey = typeof TABS[number]["key"];

export default function Nursing() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [localTasks, setLocalTasks] = useState<Record<string, NursingTask["status"]>>({});
  const { openModal, pushToast } = useAppStore();

  const tasksWithLocal = useMemo(() => NURSING_TASKS.map((t) => ({ ...t, status: localTasks[t.id] ?? t.status })), [localTasks]);

  const filtered = useMemo(() => {
    return tasksWithLocal.filter((t) => activeTab === "all" || t.status === activeTab);
  }, [tasksWithLocal, activeTab]);

  const stats = useMemo(() => ({
    total: tasksWithLocal.length,
    pending: tasksWithLocal.filter((t) => t.status === "pending").length,
    inProgress: tasksWithLocal.filter((t) => t.status === "in-progress").length,
    overdue: tasksWithLocal.filter((t) => t.status === "overdue").length,
  }), [tasksWithLocal]);

  const markComplete = (id: string, name: string) => {
    setLocalTasks((m) => ({ ...m, [id]: "completed" }));
    pushToast({ title: "Task marked complete", description: name, variant: "success" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Nursing Station</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Nursing Care</h1>
          <p className="text-sm text-muted-foreground mt-1">Task lists, vital signs, and patient care workflows</p>
        </div>
        <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700 shadow-blue-glow" onClick={() => openModal("newNote")}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Tasks" value={stats.total} icon={HeartPulse} accent="brand" delay={0} />
        <KpiCard label="Pending" value={stats.pending} icon={Clock} accent="amber" sub="awaiting action" sparkline={[3, 4, 3, 5, 4, 5, 5]} delay={0.05} />
        <KpiCard label="In Progress" value={stats.inProgress} icon={Activity} accent="blue" sparkline={[1, 2, 1, 2, 1, 1, 1]} delay={0.1} />
        <KpiCard label="Overdue" value={stats.overdue} icon={AlertTriangle} accent="rose" sub="needs attention" sparkline={[0, 1, 0, 1, 0, 1, 1]} delay={0.15} />
      </div>

      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        <div className="border-b border-border p-2 flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const count = tab.key === "all" ? tasksWithLocal.length : tasksWithLocal.filter((t) => t.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-brand-50 text-brand-700 border border-brand-200"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {tab.label}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted-foreground/10 font-semibold">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="p-5 space-y-2">
          {filtered.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className={`p-4 rounded-xl border-l-4 bg-card border border-border/60 hover:shadow-soft transition-all ${
                task.priority === "stat" ? "border-l-rose-500" :
                task.priority === "urgent" ? "border-l-amber-500" :
                "border-l-brand-500"
              }`}
            >
              <div className="flex items-start gap-3">
                <ColorAvatar name={task.patientName} color={task.avatarColor} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{task.task}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.patientName} · {task.mrn} · {task.ward} · Bed {task.bed}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusPill status={PRIORITY_INFO[task.priority].status}>{PRIORITY_INFO[task.priority].label}</StatusPill>
                      <StatusPill status={TASK_STATUS[task.status].status}>{TASK_STATUS[task.status].label}</StatusPill>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Scheduled {task.scheduledAt}
                      </span>
                      {task.status === "overdue" && (
                        <span className="text-rose-600 font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Overdue
                        </span>
                      )}
                    </div>
                    {task.status !== "completed" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markComplete(task.id, task.task)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
