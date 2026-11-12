"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity, Search, Download, Filter, Trash2, RefreshCw, ShieldAlert,
  CheckCircle2, XCircle, Clock, User, History,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAppStore, type ActivityCategory } from "@/store/app-store";
import { KpiCard, StatusPill, ColorAvatar } from "@/components/shell/ui-bits";
import { exportToCsv } from "@/lib/print";
import { can } from "@/lib/rbac";

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  auth: "Authentication",
  patient: "Patient",
  appointment: "Appointment",
  pharmacy: "Pharmacy",
  inventory: "Inventory",
  purchase: "Purchase Order",
  purchase_return: "Purchase Return",
  supplier: "Supplier",
  lab: "Laboratory",
  radiology: "Radiology",
  billing: "Billing",
  payment: "Payment",
  user: "User",
  role: "Role",
  permission: "Permission",
  backup: "Backup",
  system: "System",
  blood_bank: "Blood Bank",
  nursing: "Nursing",
  ipd: "Inpatient",
  emr: "Medical Records",
  settings: "Settings",
  finance: "Finance",
  clinical: "Clinical",
  hr: "Human Resources",
  opd: "OPD",
};

const CATEGORY_COLOR: Record<ActivityCategory, string> = {
  auth: "bg-violet-100 text-violet-700",
  patient: "bg-blue-100 text-blue-700",
  appointment: "bg-cyan-100 text-cyan-700",
  pharmacy: "bg-emerald-100 text-emerald-700",
  inventory: "bg-amber-100 text-amber-700",
  purchase: "bg-indigo-100 text-indigo-700",
  purchase_return: "bg-rose-100 text-rose-700",
  supplier: "bg-teal-100 text-teal-700",
  lab: "bg-pink-100 text-pink-700",
  radiology: "bg-purple-100 text-purple-700",
  billing: "bg-yellow-100 text-yellow-700",
  payment: "bg-green-100 text-green-700",
  user: "bg-slate-100 text-slate-700",
  role: "bg-orange-100 text-orange-700",
  permission: "bg-red-100 text-red-700",
  backup: "bg-fuchsia-100 text-fuchsia-700",
  system: "bg-gray-100 text-gray-700",
  blood_bank: "bg-red-100 text-red-700",
  nursing: "bg-teal-100 text-teal-700",
  ipd: "bg-blue-100 text-blue-700",
  emr: "bg-indigo-100 text-indigo-700",
  settings: "bg-slate-100 text-slate-700",
  finance: "bg-emerald-100 text-emerald-700",
  clinical: "bg-sky-100 text-sky-700",
  hr: "bg-lime-100 text-lime-700",
  opd: "bg-cyan-100 text-cyan-700",
};

export default function ActivityLog() {
  const { activityLog, clearActivityLog } = useAppStore();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");

  const role = useAppStore((s) => s.user?.role);
  const canManage = can(role, "activity_log", "manage");

  const users = useMemo(() => {
    const set = new Set<string>();
    activityLog.forEach((e) => set.add(e.user));
    return Array.from(set);
  }, [activityLog]);

  const filtered = useMemo(() => {
    return activityLog.filter((e) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || e.action.toLowerCase().includes(q) || e.details.toLowerCase().includes(q) || e.user.toLowerCase().includes(q);
      const matchesCat = catFilter === "all" || e.category === catFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "success" && e.success) || (statusFilter === "failed" && !e.success);
      const matchesUser = userFilter === "all" || e.user === userFilter;
      return matchesSearch && matchesCat && matchesStatus && matchesUser;
    });
  }, [activityLog, search, catFilter, statusFilter, userFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: activityLog.length,
      today: activityLog.filter((e) => e.timestamp.startsWith(today)).length,
      failed: activityLog.filter((e) => !e.success).length,
      categories: new Set(activityLog.map((e) => e.category)).size,
    };
  }, [activityLog]);

  const handleExport = () => {
    const rows = filtered.map((e) => ({
      timestamp: e.timestamp, user: e.user, role: e.role, action: e.action,
      category: CATEGORY_LABELS[e.category], module: e.module, success: e.success ? "yes" : "no",
      details: e.details, targetRecord: e.targetRecordId, targetRecordType: e.targetRecordType,
    }));
    exportToCsv("activity-log.csv", rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">Audit Trail</span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Activity Log</h1>
          <p className="text-sm text-muted-foreground mt-1">Comprehensive audit trail of all system actions. Records are immutable for non-administrators.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
          {canManage && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                  <Trash2 className="h-4 w-4 mr-1.5" /> Clear Log
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all activity log entries?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {activityLog.length} audit entries. This action is recorded in the new log. Continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearActivityLog} className="bg-rose-600 hover:bg-rose-700">
                    Yes, clear log
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Events" value={stats.total} icon={Activity} accent="brand" delay={0} />
        <KpiCard label="Today" value={stats.today} icon={Clock} accent="emerald" delay={0.05} />
        <KpiCard label="Failed Actions" value={stats.failed} icon={ShieldAlert} accent="rose" delay={0.1} sub="access denials & errors" />
        <KpiCard label="Categories" value={stats.categories} icon={Filter} accent="violet" delay={0.15} sub="distinct modules" />
      </div>

      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search actions, users, or details..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="User" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {users.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto max-h-[calc(100vh-380px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-accent/30 border-b border-border sticky top-0 z-10">
              <tr>
                <Th>Time</Th><Th>User</Th><Th>Action</Th><Th>Category</Th>
                <Th>Module</Th><Th>Details</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <motion.tr
                  key={e.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: Math.min(i * 0.005, 0.3) }}
                  className={`border-b border-border/50 hover:bg-accent/30 transition-colors ${!e.success ? "bg-rose-50/40" : ""}`}
                >
                  <Td>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground tabular-nums">{new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{new Date(e.timestamp).toLocaleDateString([], { month: "short", day: "2-digit" })}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-semibold">
                        {e.user.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{e.user}</p>
                        <p className="text-[10px] text-muted-foreground">{e.role}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><span className="text-sm font-medium">{e.action}</span></Td>
                  <Td>
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${CATEGORY_COLOR[e.category]}`}>
                      {CATEGORY_LABELS[e.category]}
                    </span>
                  </Td>
                  <Td><span className="text-xs text-muted-foreground font-mono">{e.module}</span></Td>
                  <Td>
                    <span className="text-xs text-muted-foreground line-clamp-2">{e.details}</span>
                  </Td>
                  <Td>
                    {e.success ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Success</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-rose-700"><XCircle className="h-3 w-3" /> Failed</span>
                    )}
                  </Td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">No activity log entries match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {filtered.length} of {activityLog.length} entries</span>
          <span className="flex items-center gap-1"><History className="h-3 w-3" /> Records are append-only</span>
        </div>
      </Card>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${className || ""}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className || ""}`}>{children}</td>;
}
