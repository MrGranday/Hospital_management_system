"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Wallet,
  Receipt,
  AlertTriangle,
  BedDouble,
  Clock,
  ChevronRight,
  Stethoscope,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard, SectionHeader, StatusPill, ColorAvatar } from "@/components/shared/ui-bits";
import {
  DASHBOARD_STATS,
  REVENUE_TREND,
  REVENUE_BY_DEPARTMENT,
  PATIENT_FLOW,
  BED_OCCUPANCY,
  STAFF_SUMMARY,
  OPD_VISITS,
  KPI_SPARKLINES,
} from "@/lib/data";
import { useAppStore } from "@/store/app-store";

const fmt = (n: number, currency = "AFN") => `${currency} ${Math.round(n).toLocaleString()}`;
const fmtCompact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString();
const fmtUSD = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default function Dashboard() {
  const { setPage, user } = useAppStore();
  const dateLine = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Operations Dashboard</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Good morning, {user?.name?.split(" ").slice(-1)[0] || "Doctor"}.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{dateLine} · San Francisco Medical Center</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={() => setPage("reports")}>
            View Reports
          </Button>
          <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700 shadow-blue-glow" onClick={() => setPage("opd")}>
            <Stethoscope className="h-4 w-4 mr-1.5" />
            Open OPD Queue
          </Button>
        </div>
      </div>

      {/* Top KPI row with sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Monthly Revenue"
          value={DASHBOARD_STATS.monthlyRevenue}
          format={(v) => fmtUSD(v)}
          icon={TrendingUp}
          accent="brand"
          delta="+8.2%"
          deltaType="up"
          sub="vs last month"
          sparkline={KPI_SPARKLINES.revenue}
          delay={0}
        />
        <KpiCard
          label="Monthly Expense"
          value={DASHBOARD_STATS.monthlyExpense}
          format={(v) => fmtUSD(v)}
          icon={TrendingDown}
          accent="rose"
          delta="+5.1%"
          deltaType="up"
          sub="vs last month"
          sparkline={KPI_SPARKLINES.expense}
          delay={0.06}
        />
        <KpiCard
          label="Net Income"
          value={DASHBOARD_STATS.netIncome}
          format={(v) => fmtUSD(v)}
          icon={Wallet}
          accent="emerald"
          delta={`${DASHBOARD_STATS.profitMargin}% margin`}
          deltaType="up"
          sparkline={KPI_SPARKLINES.revenue}
          delay={0.12}
        />
        <KpiCard
          label="Total Patients"
          value={DASHBOARD_STATS.totalPatients}
          icon={Users}
          accent="violet"
          delta={`+${DASHBOARD_STATS.newThisMonth} new`}
          deltaType="up"
          sub="this month"
          sparkline={KPI_SPARKLINES.patients}
          delay={0.18}
        />
      </div>

      {/* Operational KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Visits Today"
          value={DASHBOARD_STATS.visitsToday}
          icon={Activity}
          accent="brand"
          sub={`${DASHBOARD_STATS.waitingNow} in queue`}
          sparkline={KPI_SPARKLINES.visits}
          delay={0.05}
        />
        <KpiCard
          label="Collected Today"
          value={DASHBOARD_STATS.collectedToday}
          format={(v) => fmtUSD(v)}
          icon={Receipt}
          accent="emerald"
          delta="+12%"
          deltaType="up"
          sparkline={KPI_SPARKLINES.collection}
          delay={0.11}
        />
        <KpiCard
          label="Unpaid Bills"
          value={DASHBOARD_STATS.unpaidBillsToday}
          icon={AlertTriangle}
          accent="amber"
          sparkline={KPI_SPARKLINES.lowStock}
          delay={0.17}
        />
        <KpiCard
          label="Bed Occupancy"
          value={Math.round(DASHBOARD_STATS.bedOccupancy * 100)}
          format={(v) => `${v}%`}
          icon={BedDouble}
          accent="blue"
          sub={`${DASHBOARD_STATS.occupiedBeds}/${DASHBOARD_STATS.totalBeds} beds`}
          sparkline={KPI_SPARKLINES.beds}
          delay={0.23}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue trend - large */}
        <Card className="lg:col-span-2 border-border/60 shadow-soft rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Revenue & Expense Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 7 months performance</p>
            </div>
            <div className="flex items-center gap-3">
              <Legend2 color="oklch(0.535 0.195 245)" label="Revenue" />
              <Legend2 color="oklch(0.65 0.200 15)" label="Expense" />
            </div>
          </div>
          <div className="h-[280px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_TREND} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.535 0.195 245)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.535 0.195 245)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.65 0.200 15)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="oklch(0.65 0.200 15)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.008 255)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="oklch(0.55 0.02 260)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.55 0.02 260)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid oklch(0.92 0.008 255)",
                    borderRadius: "0.75rem",
                    boxShadow: "0 8px 24px -4px oklch(0.30 0.04 260 / 0.12)",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => fmtUSD(v)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="oklch(0.535 0.195 245)"
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                  dot={{ r: 0 }}
                  activeDot={{ r: 5, fill: "oklch(0.535 0.195 245)", strokeWidth: 2, stroke: "white" }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="oklch(0.65 0.200 15)"
                  strokeWidth={2.5}
                  fill="url(#expGrad)"
                  dot={{ r: 0 }}
                  activeDot={{ r: 5, fill: "oklch(0.65 0.200 15)", strokeWidth: 2, stroke: "white" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Department pie + radial gauge */}
        <div className="space-y-4">
          <Card className="border-border/60 shadow-soft rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Revenue by Department</h3>
                <p className="text-xs text-muted-foreground mt-0.5">This month</p>
              </div>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={REVENUE_BY_DEPARTMENT}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {REVENUE_BY_DEPARTMENT.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid oklch(0.92 0.008 255)",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                    formatter={(v: number) => fmtUSD(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-3">
              {REVENUE_BY_DEPARTMENT.slice(0, 4).map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-semibold tabular-nums">{fmtCompact(d.value)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Lower row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's OPD queue */}
        <Card className="lg:col-span-2 border-border/60 shadow-soft rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Today&apos;s OPD Queue</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Live patient flow · auto-refreshing</p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-brand-600 hover:text-brand-700" onClick={() => setPage("opd")}>
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-1.5">
            {OPD_VISITS.slice(0, 5).map((visit, i) => {
              const statusInfo = getVisitStatusInfo(visit.status);
              const priorityColor =
                visit.priority === "emergency" ? "border-l-rose-500" :
                visit.priority === "urgent" ? "border-l-amber-500" :
                "border-l-brand-500";
              return (
                <motion.button
                  key={visit.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * i }}
                  onClick={() => setPage("opd", visit.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-l-4 ${priorityColor} border-border/60 bg-card hover:bg-accent/40 transition-colors text-left`}
                >
                  <ColorAvatar name={visit.patientName} color={visit.avatarColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{visit.patientName}</p>
                      <span className="text-[10px] text-muted-foreground font-mono">{visit.mrn}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {visit.reason}
                    </p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="tabular-nums">{visit.checkInTime}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{visit.doctorName.split(" ").slice(-1)[0]}</span>
                  </div>
                  <StatusPill status={statusInfo.status}>{statusInfo.label}</StatusPill>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </motion.button>
              );
            })}
          </div>
        </Card>

        {/* Patient flow + staff */}
        <div className="space-y-4">
          <Card className="border-border/60 shadow-soft rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Patient Flow Today</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Hourly check-ins</p>
              </div>
            </div>
            <div className="h-[120px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PATIENT_FLOW} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.535 0.195 245)" stopOpacity={1} />
                      <stop offset="100%" stopColor="oklch(0.685 0.150 256)" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" stroke="oklch(0.55 0.02 260)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "oklch(0.96 0.012 255)" }}
                    contentStyle={{
                      background: "white",
                      border: "1px solid oklch(0.92 0.008 255)",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" fill="url(#flowGrad)" radius={[6, 6, 0, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border-border/60 shadow-soft rounded-xl p-5">
            <h3 className="font-semibold text-foreground text-sm mb-3">Staff on Duty</h3>
            <div className="grid grid-cols-3 gap-2">
              {STAFF_SUMMARY.map((s) => (
                <div key={s.role} className="text-center p-2 rounded-lg bg-accent/30">
                  <p className="text-lg font-bold tabular-nums" style={{ color: s.color }}>{s.count}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.role}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Bed occupancy row */}
      <Card className="border-border/60 shadow-soft rounded-xl p-5">
        <SectionHeader
          title="Bed Occupancy by Ward"
          subtitle="Real-time bed availability across all wards"
          action={
            <Button variant="outline" size="sm" className="h-8" onClick={() => setPage("ipd")}>
              <BedDouble className="h-4 w-4 mr-1.5" />
              Manage IPD
            </Button>
          }
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {BED_OCCUPANCY.map((ward, i) => {
            const pct = (ward.occupied / ward.total) * 100;
            const tone = pct >= 90 ? "rose" : pct >= 70 ? "amber" : "emerald";
            const barColor =
              tone === "rose" ? "bg-rose-500" :
              tone === "amber" ? "bg-amber-500" :
              "bg-emerald-500";
            return (
              <motion.div
                key={ward.ward}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * i }}
                className="p-3 rounded-lg border border-border/60 bg-accent/20"
              >
                <p className="text-xs font-semibold text-foreground truncate">{ward.ward}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-xl font-bold tabular-nums">{ward.occupied}</p>
                  <p className="text-xs text-muted-foreground">/ {ward.total}</p>
                </div>
                <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 + 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
                    className={`h-full ${barColor} rounded-full`}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{Math.round(pct)}% occupied</p>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Legend2({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function getVisitStatusInfo(status: string): { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string } {
  switch (status) {
    case "in_consultation":
      return { status: "info", label: "In Consult" };
    case "vitals_done":
      return { status: "warning", label: "Vitals Done" };
    case "waiting":
      return { status: "neutral", label: "Waiting" };
    case "completed":
      return { status: "success", label: "Completed" };
    default:
      return { status: "neutral", label: status };
  }
}
