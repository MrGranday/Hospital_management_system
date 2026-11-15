"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  UserCog,
  Plus,
  Search,
  Users,
  Star,
  Clock,
  Calendar,
  TrendingUp,
  Mail,
  Phone,
  Download,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { STAFF_DIRECTORY, ATTENDANCE_TREND, ROLE_LABELS, type StaffMember } from "@/lib/data";
import { KpiCard, StatusPill, ColorAvatar } from "@/components/shared/ui-bits";
import { useAppStore } from "@/store/app-store";
import { exportToCsv } from "@/lib/print";

const STATUS_INFO: Record<StaffMember["status"], { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  "on-duty": { status: "success", label: "On Duty" },
  "off-duty": { status: "neutral", label: "Off Duty" },
  "on-leave": { status: "warning", label: "On Leave" },
  remote: { status: "info", label: "Remote" },
};

const SHIFT_COLORS: Record<StaffMember["shift"], string> = {
  Morning: "bg-amber-100 text-amber-700 border-amber-200",
  Evening: "bg-violet-100 text-violet-700 border-violet-200",
  Night: "bg-blue-100 text-blue-700 border-blue-200",
};

const TABS = [
  { key: "directory", label: "Staff Directory" },
  { key: "attendance", label: "Attendance" },
  { key: "performance", label: "Performance" },
] as const;
type TabKey = typeof TABS[number]["key"];

export default function HR() {
  const [activeTab, setActiveTab] = useState<TabKey>("directory");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const { openModal, pushToast, liveStaff } = useAppStore();

  // Merge live + static staff (live first). Map LiveStaff → StaffMember-like shape with defaults.
  const allStaff: StaffMember[] = [
    ...liveStaff.map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role as StaffMember["role"],
      department: s.department,
      email: s.email,
      phone: s.phone,
      status: (s.status === "on-leave" ? "on-leave" : "on-duty") as StaffMember["status"],
      shift: "Morning" as const,
      rating: 0,
      yearsOfService: 0,
      avatarColor: s.avatarColor,
      joinDate: s.joinedOn,
    })),
    ...STAFF_DIRECTORY,
  ];

  const departments = useMemo(() => ["All", ...Array.from(new Set(allStaff.map((s) => s.department)))], [allStaff]);

  const filtered = useMemo(() => {
    return allStaff.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      const matchesDept = deptFilter === "All" || s.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [search, deptFilter, allStaff]);

  const stats = useMemo(() => ({
    total: allStaff.length,
    onDuty: allStaff.filter((s) => s.status === "on-duty").length,
    onLeave: allStaff.filter((s) => s.status === "on-leave").length,
    avgRating: allStaff.length ? (allStaff.reduce((s, m) => s + m.rating, 0) / allStaff.length).toFixed(2) : "0.00",
  }), [allStaff]);

  const handleExport = () => {
    const rows = allStaff.map((s) => ({
      name: s.name,
      role: ROLE_LABELS[s.role] ?? s.role,
      department: s.department,
      email: s.email,
      phone: s.phone,
      status: s.status,
    }));
    exportToCsv("staff.csv", rows);
    pushToast({ title: "Export started", description: "staff.csv is downloading", variant: "success" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Human Resources</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff & HR</h1>
          <p className="text-sm text-muted-foreground mt-1">Directory, attendance, shifts, and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700 shadow-blue-glow" onClick={() => openModal("newStaff")}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Staff
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Staff" value={stats.total} icon={Users} accent="brand" delay={0} />
        <KpiCard label="On Duty" value={stats.onDuty} icon={TrendingUp} accent="emerald" sub="working now" sparkline={[10, 12, 11, 14, 13, 13, 13]} delay={0.05} />
        <KpiCard label="On Leave" value={stats.onLeave} icon={Calendar} accent="amber" sub="approved leave" sparkline={[1, 0, 1, 0, 1, 1, 1]} delay={0.1} />
        <KpiCard label="Avg Rating" value={parseFloat(stats.avgRating)} format={(v) => v.toFixed(2)} icon={Star} accent="violet" sub="out of 5.0" delay={0.15} />
      </div>

      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        <div className="border-b border-border p-2 flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-brand-50 text-brand-700 border border-brand-200"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "directory" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
                </div>
                <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg overflow-x-auto">
                  {departments.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDeptFilter(d)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                        deptFilter === d ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((staff, i) => (
                  <StaffCard key={staff.id} staff={staff} delay={i * 0.04} onView={() => pushToast({ title: staff.name, description: `${ROLE_LABELS[staff.role]} · ${staff.department} · ${staff.email}`, variant: "info" })} />
                ))}
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Weekly Attendance Trend</h3>
                <p className="text-xs text-muted-foreground">Daily present, absent, and leave counts</p>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ATTENDANCE_TREND} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
                    <Bar dataKey="present" stackId="a" fill="oklch(0.62 0.150 155)" name="Present" barSize={32} />
                    <Bar dataKey="absent" stackId="a" fill="oklch(0.65 0.200 15)" name="Absent" barSize={32} />
                    <Bar dataKey="leave" stackId="a" fill="oklch(0.72 0.160 75)" name="Leave" barSize={32} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-700 uppercase tracking-wider font-semibold">Avg Present</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">107</p>
                  <p className="text-[11px] text-emerald-600 mt-1">per day this week</p>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                  <p className="text-xs text-rose-700 uppercase tracking-wider font-semibold">Avg Absent</p>
                  <p className="text-2xl font-bold text-rose-700 mt-1 tabular-nums">4.6</p>
                  <p className="text-[11px] text-rose-600 mt-1">per day this week</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-700 uppercase tracking-wider font-semibold">Avg Leave</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">2.1</p>
                  <p className="text-[11px] text-amber-600 mt-1">per day this week</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "performance" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allStaff.slice(0, 9).map((staff, i) => (
                <motion.div
                  key={staff.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <Card className="border-border/60 shadow-soft rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <ColorAvatar name={staff.name} color={staff.avatarColor} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{staff.name}</p>
                        <p className="text-[11px] text-muted-foreground">{ROLE_LABELS[staff.role]}</p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-bold">{staff.rating}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Years of service</span>
                        <span className="font-semibold">{staff.yearsOfService}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Department</span>
                        <span className="font-medium">{staff.department}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Shift</span>
                        <Badge variant="outline" className={`text-[10px] ${SHIFT_COLORS[staff.shift]}`}>{staff.shift}</Badge>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Performance</span>
                        <span className="text-[10px] font-semibold">{Math.round(staff.rating * 20)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${staff.rating * 20}%` }}
                          transition={{ duration: 0.6, delay: 0.1 + i * 0.04 }}
                          className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function StaffCard({ staff, delay, onView }: { staff: StaffMember; delay: number; onView?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -2 }}
    >
      <Card className="border-border/60 shadow-soft hover:shadow-premium transition-all rounded-xl p-4 h-full">
        <div className="flex items-start gap-3 mb-3">
          <ColorAvatar name={staff.name} color={staff.avatarColor} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{staff.name}</p>
                <p className="text-[11px] text-muted-foreground">{ROLE_LABELS[staff.role]}</p>
              </div>
              <StatusPill status={STATUS_INFO[staff.status].status}>{STATUS_INFO[staff.status].label}</StatusPill>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={`text-[10px] ${SHIFT_COLORS[staff.shift]}`}>{staff.shift}</Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                {staff.rating}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate">{staff.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{staff.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{staff.department} · {staff.yearsOfService}y service</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-3 h-7 text-xs" onClick={onView}>View</Button>
      </Card>
    </motion.div>
  );
}
