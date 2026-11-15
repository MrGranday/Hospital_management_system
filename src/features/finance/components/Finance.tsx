"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Download,
  Search,
  CreditCard,
  Banknote,
  Building,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { EXPENSES, EXPENSE_BY_CATEGORY, PROFIT_LOSS, type ExpenseRecord } from "@/_legacy/mock-data/data";
import { KpiCard, StatusPill } from "@/components/shared/ui-bits";
import { useAppStore } from "@/store/app-store";
import { exportToCsv, printDoc } from "@/lib/print";

const EXPENSE_STATUS: Record<ExpenseRecord["status"], { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  paid: { status: "success", label: "Paid" },
  pending: { status: "warning", label: "Pending" },
  overdue: { status: "danger", label: "Overdue" },
};

const PAYMENT_ICONS: Record<string, React.ElementType> = {
  "Bank transfer": Building,
  "Auto-debit": CreditCard,
  "Credit card": CreditCard,
  Check: DollarSign,
  "Credit terms": Banknote,
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "expenses", label: "Expenses" },
  { key: "reports", label: "Reports" },
] as const;
type TabKey = typeof TABS[number]["key"];

export default function Finance() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [search, setSearch] = useState("");
  const { openModal, pushToast, liveExpenses } = useAppStore();

  // Merge live + static expenses (live first). Live expenses default to paid/Cash.
  const allExpenses: ExpenseRecord[] = [
    ...liveExpenses.map((e) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      description: e.description,
      amount: e.amount,
      vendor: e.vendor,
      status: "paid" as const,
      paymentMethod: "Cash",
    })),
    ...EXPENSES,
  ];

  const stats = useMemo(() => {
    const totalExpense = allExpenses.reduce((s, e) => s + e.amount, 0);
    const paid = allExpenses.filter((e) => e.status === "paid").reduce((s, e) => s + e.amount, 0);
    const pending = allExpenses.filter((e) => e.status === "pending").reduce((s, e) => s + e.amount, 0);
    const overdue = allExpenses.filter((e) => e.status === "overdue").reduce((s, e) => s + e.amount, 0);
    const monthlyRevenue = 212000;
    const monthlyExpense = 124000;
    return {
      totalExpense, paid, pending, overdue,
      monthlyRevenue, monthlyExpense,
      netIncome: monthlyRevenue - monthlyExpense,
      profitMargin: ((monthlyRevenue - monthlyExpense) / monthlyRevenue) * 100,
    };
  }, [allExpenses]);

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((e) => {
      const q = search.trim().toLowerCase();
      return !q || e.description.toLowerCase().includes(q) || e.vendor.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
    });
  }, [search, allExpenses]);

  const handleExportPnl = () => {
    const rows = allExpenses.map((e) => ({
      date: e.date,
      description: e.description,
      category: e.category,
      vendor: e.vendor,
      amount: e.amount,
      status: e.status,
      paymentMethod: e.paymentMethod,
    }));
    exportToCsv("pnl.csv", rows);
    pushToast({ title: "Export started", description: "pnl.csv is downloading", variant: "success" });
  };

  const handleGenerateReport = (title: string) => {
    printDoc({
      title,
      docType: "Report",
      docNum: `RPT-${Date.now()}`,
      patient: "Hospital",
      mrn: "N/A",
      date: new Date().toISOString(),
      body: `<h3>${title}</h3><p>Generated report content for ${title}.</p><p>Reporting period: ${new Date().toLocaleDateString()}</p>`,
    });
    pushToast({ title: "Generating report", description: title, variant: "info" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Finance & Accounting</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Finance</h1>
          <p className="text-sm text-muted-foreground mt-1">P&L, expenses, cash flow, and financial reporting</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={handleExportPnl}>
            <Download className="h-4 w-4 mr-1.5" />
            Export P&L
          </Button>
          <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700 shadow-blue-glow" onClick={() => openModal("newExpense")}>
            <Plus className="h-4 w-4 mr-1.5" />
            Record Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Monthly Revenue" value={stats.monthlyRevenue} format={(v) => `$${Math.round(v).toLocaleString()}`} icon={TrendingUp} accent="brand" delta="+8.2%" deltaType="up" sparkline={[142, 158, 171, 165, 184, 196, 212]} delay={0} />
        <KpiCard label="Monthly Expense" value={stats.monthlyExpense} format={(v) => `$${Math.round(v).toLocaleString()}`} icon={TrendingDown} accent="rose" delta="+5.1%" deltaType="up" sparkline={[98, 102, 108, 105, 112, 118, 124]} delay={0.05} />
        <KpiCard label="Net Income" value={stats.netIncome} format={(v) => `$${Math.round(v).toLocaleString()}`} icon={Wallet} accent="emerald" delta={`${stats.profitMargin.toFixed(1)}% margin`} deltaType="up" sparkline={[44, 56, 63, 60, 72, 78, 88]} delay={0.1} />
        <KpiCard label="Pending Payments" value={stats.pending} format={(v) => `$${Math.round(v).toLocaleString()}`} icon={DollarSign} accent="amber" sub="awaiting approval" sparkline={[3, 5, 4, 6, 5, 7, 8]} delay={0.15} />
      </div>

      {/* Tabs */}
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
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* P&L Chart */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">Profit & Loss Trend</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Last 7 months</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <LegendDot color="oklch(0.535 0.195 245)" label="Revenue" />
                    <LegendDot color="oklch(0.65 0.200 15)" label="Expense" />
                    <LegendDot color="oklch(0.62 0.150 155)" label="Profit" />
                  </div>
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PROFIT_LOSS} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.008 255)" vertical={false} />
                      <XAxis dataKey="month" stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{
                          background: "white",
                          border: "1px solid oklch(0.92 0.008 255)",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                        formatter={(v: number) => `$${v.toLocaleString()}`}
                      />
                      <Bar dataKey="revenue" fill="oklch(0.535 0.195 245)" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="expense" fill="oklch(0.65 0.200 15)" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="profit" fill="oklch(0.62 0.150 155)" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expense by Category */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Expense by Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={EXPENSE_BY_CATEGORY} dataKey="amount" nameKey="category" innerRadius={50} outerRadius={85} paddingAngle={3} stroke="none">
                          {EXPENSE_BY_CATEGORY.map((e) => (
                            <Cell key={e.category} fill={e.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "white",
                            border: "1px solid oklch(0.92 0.008 255)",
                            borderRadius: "0.5rem",
                            fontSize: "12px",
                          }}
                          formatter={(v: number) => `$${v.toLocaleString()}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {EXPENSE_BY_CATEGORY.map((cat) => (
                      <div key={cat.category} className="flex items-center justify-between p-2.5 rounded-lg bg-accent/30 border border-border/50">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm" style={{ background: cat.color }} />
                          <span className="text-sm font-medium">{cat.category}</span>
                        </div>
                        <span className="text-sm font-bold tabular-nums">${cat.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="space-y-3">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-accent/30 border-b border-border">
                    <tr>
                      <Th>Date</Th>
                      <Th>Description</Th>
                      <Th>Category</Th>
                      <Th>Vendor</Th>
                      <Th>Payment</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((exp, i) => {
                      const PayIcon = PAYMENT_ICONS[exp.paymentMethod] || DollarSign;
                      return (
                        <motion.tr
                          key={exp.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                          className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                        >
                          <Td><span className="text-xs text-muted-foreground">{new Date(exp.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></Td>
                          <Td><span className="text-sm font-medium">{exp.description}</span></Td>
                          <Td><Badge variant="outline" className="text-[10px]">{exp.category}</Badge></Td>
                          <Td><span className="text-xs text-muted-foreground">{exp.vendor}</span></Td>
                          <Td>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <PayIcon className="h-3.5 w-3.5" />
                              {exp.paymentMethod}
                            </div>
                          </Td>
                          <Td><span className="text-sm font-semibold tabular-nums">${exp.amount.toLocaleString()}</span></Td>
                          <Td><StatusPill status={EXPENSE_STATUS[exp.status].status}>{EXPENSE_STATUS[exp.status].label}</StatusPill></Td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Monthly P&L Statement", desc: "Revenue, expenses, and net income breakdown", icon: TrendingUp, color: "text-brand-600 bg-brand-50" },
                { title: "Cash Flow Statement", desc: "Operating, investing, and financing cash flows", icon: Wallet, color: "text-emerald-600 bg-emerald-50" },
                { title: "Balance Sheet", desc: "Assets, liabilities, and equity snapshot", icon: Building, color: "text-violet-600 bg-violet-50" },
                { title: "AR Aging Report", desc: "Outstanding receivables by age bucket", icon: CreditCard, color: "text-amber-600 bg-amber-50" },
                { title: "AP Aging Report", desc: "Outstanding payables by age bucket", icon: Banknote, color: "text-rose-600 bg-rose-50" },
                { title: "Tax Summary", desc: "Quarterly tax breakdown by category", icon: DollarSign, color: "text-blue-600 bg-blue-50" },
              ].map((report, i) => (
                <motion.div
                  key={report.title}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="border-border/60 shadow-soft hover:shadow-premium transition-all rounded-xl p-5 cursor-pointer h-full">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${report.color}`}>
                      <report.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{report.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{report.desc}</p>
                    <Button variant="outline" size="sm" className="w-full mt-3 h-8 text-xs" onClick={() => handleGenerateReport(report.title)}>
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Generate Report
                    </Button>
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

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${className || ""}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className || ""}`}>{children}</td>;
}
