"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileBarChart,
  TrendingUp,
  Users,
  Clock,
  Star,
  Download,
  Activity,
  Heart,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import {
  DEPARTMENT_PERFORMANCE, PATIENT_SATISFACTION_TREND, READMISSION_RATE,
  AVG_WAIT_TIME, REVENUE_TREND,
} from "@/_legacy/mock-data/data";
import { KpiCard } from "@/components/shared/ui-bits";
import { useAppStore } from "@/store/app-store";
import { printDoc } from "@/lib/print";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "clinical", label: "Clinical Quality" },
  { key: "operational", label: "Operational" },
  { key: "financial", label: "Financial" },
] as const;
type TabKey = typeof TABS[number]["key"];

export default function Reports() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const { pushToast } = useAppStore();

  const handleExport = () => {
    printDoc({
      title: "Dashboard Report",
      docType: "Report",
      docNum: `DASH-${Date.now()}`,
      patient: "Hospital",
      mrn: "N/A",
      date: new Date().toISOString(),
      body: `<h3>Dashboard Export</h3><p>Generated at ${new Date().toLocaleString()}</p>`,
    });
    pushToast({ title: "Exporting dashboard", description: "Dashboard report sent to print preview", variant: "success" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Reports & Analytics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">BI dashboards, KPIs, and operational insights</p>
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1.5" />
          Export Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Patient Satisfaction" value={4.85} format={(v) => v.toFixed(2)} icon={Star} accent="emerald" delta="+0.05" deltaType="up" sub="out of 5.0" sparkline={[4.5, 4.6, 4.55, 4.7, 4.75, 4.8, 4.85]} delay={0} />
        <KpiCard label="Avg Wait Time" value={22} format={(v) => `${Math.round(v)}m`} icon={Clock} accent="amber" delta="-3m" deltaType="up" sub="across departments" sparkline={[28, 26, 25, 24, 23, 22, 22]} delay={0.05} />
        <KpiCard label="Readmission Rate" value={6.2} format={(v) => `${v.toFixed(1)}%`} icon={AlertCircle} accent="rose" delta="-0.3%" deltaType="up" sub="30-day" sparkline={[8.2, 7.8, 7.5, 7.1, 6.8, 6.5, 6.2]} delay={0.1} />
        <KpiCard label="Bed Occupancy" value={78} format={(v) => `${Math.round(v)}%`} icon={Activity} accent="brand" sub="87/112 beds" sparkline={[75, 78, 76, 80, 79, 82, 78]} delay={0.15} />
      </div>

      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        <div className="border-b border-border p-2 flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-brand-50 text-brand-700 border border-brand-200"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">
          {activeTab === "overview" && (
            <>
              {/* Patient Satisfaction + Readmission */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Patient Satisfaction Trend</h3>
                  <p className="text-xs text-muted-foreground mb-3">Monthly average with response count</p>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={PATIENT_SATISFACTION_TREND} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="satGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="oklch(0.62 0.150 155)" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="oklch(0.62 0.150 155)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.008 255)" vertical={false} />
                        <XAxis dataKey="month" stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis domain={[4, 5]} stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: "white", border: "1px solid oklch(0.92 0.008 255)", borderRadius: "0.5rem", fontSize: "12px" }} />
                        <Area type="monotone" dataKey="score" stroke="oklch(0.62 0.150 155)" strokeWidth={2.5} fill="url(#satGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-1">30-Day Readmission Rate</h3>
                  <p className="text-xs text-muted-foreground mb-3">Lower is better — monthly trend</p>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={READMISSION_RATE} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.008 255)" vertical={false} />
                        <XAxis dataKey="month" stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis domain={[5, 9]} stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip contentStyle={{ background: "white", border: "1px solid oklch(0.92 0.008 255)", borderRadius: "0.5rem", fontSize: "12px" }} formatter={(v: number) => `${v}%`} />
                        <Line type="monotone" dataKey="rate" stroke="oklch(0.65 0.200 15)" strokeWidth={2.5} dot={{ r: 4, fill: "oklch(0.65 0.200 15)" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Department performance radar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Department Performance</h3>
                  <p className="text-xs text-muted-foreground mb-3">Multi-dimensional comparison</p>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={DEPARTMENT_PERFORMANCE}>
                        <PolarGrid stroke="oklch(0.92 0.008 255)" />
                        <PolarAngleAxis dataKey="dept" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 10 }} />
                        <Radar name="Efficiency" dataKey="efficiency" stroke="oklch(0.535 0.195 245)" fill="oklch(0.535 0.195 245)" fillOpacity={0.3} />
                        <Tooltip contentStyle={{ background: "white", border: "1px solid oklch(0.92 0.008 255)", borderRadius: "0.5rem", fontSize: "12px" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-1">Avg Wait Time by Department</h3>
                  <p className="text-xs text-muted-foreground mb-3">Minutes from check-in to consultation</p>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={AVG_WAIT_TIME} layout="vertical" margin={{ top: 8, right: 12, left: 80, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.008 255)" horizontal={false} />
                        <XAxis type="number" stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}m`} />
                        <YAxis type="category" dataKey="dept" stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                        <Tooltip contentStyle={{ background: "white", border: "1px solid oklch(0.92 0.008 255)", borderRadius: "0.5rem", fontSize: "12px" }} formatter={(v: number) => `${v} min`} />
                        <Bar dataKey="time" fill="oklch(0.535 0.195 245)" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "clinical" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Mortality Rate", value: "1.8%", trend: "-0.2%", icon: Heart, color: "text-rose-600 bg-rose-50" },
                { title: "Surgical Complications", value: "2.1%", trend: "-0.3%", icon: AlertCircle, color: "text-amber-600 bg-amber-50" },
                { title: "Infection Rate", value: "0.9%", trend: "-0.1%", icon: Activity, color: "text-violet-600 bg-violet-50" },
                { title: "Avg Length of Stay", value: "4.2 days", trend: "-0.3d", icon: Clock, color: "text-blue-600 bg-blue-50" },
                { title: "Patient Satisfaction", value: "4.85/5", trend: "+0.05", icon: Star, color: "text-emerald-600 bg-emerald-50" },
                { title: "Readmission Rate", value: "6.2%", trend: "-0.3%", icon: TrendingUp, color: "text-brand-600 bg-brand-50" },
              ].map((metric, i) => (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Card className="border-border/60 shadow-soft rounded-xl p-5">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${metric.color}`}>
                      <metric.icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{metric.title}</p>
                    <p className="text-2xl font-bold tabular-nums mt-1">{metric.value}</p>
                    <p className="text-xs text-emerald-600 mt-1 font-medium">{metric.trend} vs last period</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "operational" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="border-border/60 shadow-soft rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-3">Department Patient Volume</h3>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={DEPARTMENT_PERFORMANCE} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.008 255)" vertical={false} />
                      <XAxis dataKey="dept" stroke="oklch(0.55 0.02 260)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "white", border: "1px solid oklch(0.92 0.008 255)", borderRadius: "0.5rem", fontSize: "12px" }} />
                      <Bar dataKey="patients" fill="oklch(0.535 0.195 245)" radius={[4, 4, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="border-border/60 shadow-soft rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-3">Department Efficiency Score</h3>
                <div className="space-y-3 mt-4">
                  {DEPARTMENT_PERFORMANCE.map((dept, i) => (
                    <div key={dept.dept}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{dept.dept}</span>
                        <span className="text-xs font-bold tabular-nums">{dept.efficiency}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${dept.efficiency}%` }}
                          transition={{ duration: 0.6, delay: i * 0.05 }}
                          className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "financial" && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Revenue Trend (7 months)</h3>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={REVENUE_TREND} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="repRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.535 0.195 245)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="oklch(0.535 0.195 245)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.008 255)" vertical={false} />
                    <XAxis dataKey="month" stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: "white", border: "1px solid oklch(0.92 0.008 255)", borderRadius: "0.75rem", fontSize: "12px" }}
                      formatter={(v: number) => `$${v.toLocaleString()}`}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="oklch(0.535 0.195 245)" strokeWidth={2.5} fill="url(#repRevGrad)" />
                    <Area type="monotone" dataKey="expense" stroke="oklch(0.65 0.200 15)" strokeWidth={2} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
