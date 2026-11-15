"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Users,
  Shield,
  Bell,
  Palette,
  Database,
  Search,
  MoreVertical,
  CheckCircle2,
  Lock,
  KeyRound,
  Globe,
  Clock,
  Building2,
  Sun,
  Moon,
  Save,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/app-store";
import { SYSTEM_USERS, ROLE_LABELS, type SystemUser } from "@/_legacy/mock-data/data";
import { StatusPill, ColorAvatar } from "@/components/shared/ui-bits";
import { useTheme } from "@/lib/theme";
import { can } from "@/lib/rbac";
import { ALL_ROLES, ROLE_LABELS as RBAC_ROLE_LABELS, type ExtendedRole } from "@/lib/rbac";
import { toast } from "@/hooks/use-toast";

const USER_STATUS: Record<SystemUser["status"], { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  active: { status: "success", label: "Active" },
  invited: { status: "warning", label: "Invited" },
  suspended: { status: "danger", label: "Suspended" },
};

const TABS = [
  { key: "users", label: "Users & Roles", icon: Users },
  { key: "security", label: "Security", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "hospital", label: "Hospital Profile", icon: Building2 },
  { key: "system", label: "System", icon: Database },
] as const;
type TabKey = typeof TABS[number]["key"];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabKey>("appearance");
  const [search, setSearch] = useState("");
  const { openModal, pushToast, setPage } = useAppStore();

  const filteredUsers = SYSTEM_USERS.filter((u) => {
    const q = search.trim().toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">System Configuration</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage users, security, appearance, and system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sidebar tabs */}
        <Card className="lg:col-span-3 border-border/60 shadow-soft rounded-xl p-2 h-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-brand-50 text-brand-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </Card>

        {/* Content */}
        <div className="lg:col-span-9">
          <Card className="border-border/60 shadow-soft rounded-xl p-5">
            {activeTab === "users" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="font-semibold text-foreground">Users & Roles</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{SYSTEM_USERS.length} users · {SYSTEM_USERS.filter((u) => u.status === "active").length} active</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-64" />
                    </div>
                    <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700 shadow-blue-glow" onClick={() => setPage("roles")}>
                      <Users className="h-4 w-4 mr-1.5" /> Manage Roles
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-accent/30 border-b border-border">
                      <tr>
                        <Th>User</Th><Th>Role</Th><Th>Last Active</Th><Th>2FA</Th><Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, i) => (
                        <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: i * 0.03 }} className="border-b border-border/50 hover:bg-accent/30 transition-colors group">
                          <Td>
                            <div className="flex items-center gap-3">
                              <ColorAvatar name={user.name} color={user.avatarColor} size="sm" />
                              <div>
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-[11px] text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </Td>
                          <Td><Badge variant="outline" className="text-[10px]">{ROLE_LABELS[user.role]}</Badge></Td>
                          <Td><span className="text-xs text-muted-foreground">{user.lastActive}</span></Td>
                          <Td>
                            {user.twoFactor ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Enabled</span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Disabled</span>
                            )}
                          </Td>
                          <Td><StatusPill status={USER_STATUS[user.status].status}>{USER_STATUS[user.status].label}</StatusPill></Td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">For full user management (create, edit, suspend, delete) and the permission matrix, visit the <button onClick={() => setPage("roles")} className="text-brand-600 hover:underline">Roles & Permissions</button> page.</p>
              </div>
            )}

            {activeTab === "security" && <SecurityTab />}
            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "appearance" && <AppearanceTab />}
            {activeTab === "hospital" && <HospitalTab />}
            {activeTab === "system" && <SystemTab />}
          </Card>
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  const { security, setSecurity, pushToast } = useAppStore();
  const items: Array<{ icon: React.ElementType; title: string; description: string; key: keyof typeof security; value: boolean | number; type: "switch" | "number" }> = [
    { icon: KeyRound, title: "Two-Factor Authentication", description: "Require 2FA for all staff accounts", key: "twoFactorRequired", value: security.twoFactorRequired, type: "switch" },
    { icon: Clock, title: "Session Timeout", description: `Auto-logout after ${security.sessionTimeoutMin} minutes of inactivity`, key: "sessionTimeoutMin", value: security.sessionTimeoutMin, type: "number" },
    { icon: Lock, title: "Strong Password Policy", description: "Enforce passwords (12+ chars, special, numbers)", key: "strongPasswordRequired", value: security.strongPasswordRequired, type: "switch" },
    { icon: Shield, title: "IP Whitelist", description: "Restrict access to specific IP ranges", key: "ipWhitelistEnabled", value: security.ipWhitelistEnabled, type: "switch" },
    { icon: Globe, title: "Geo-blocking", description: "Block logins from restricted countries", key: "geoBlockingEnabled", value: security.geoBlockingEnabled, type: "switch" },
    { icon: Database, title: "Audit Logging", description: "Log all data access and modifications", key: "auditLoggingEnabled", value: security.auditLoggingEnabled, type: "switch" },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-foreground">Security Settings</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Configure authentication and access policies</p>
      </div>
      {items.map((item) => (
        <SecurityRow
          key={item.key}
          icon={item.icon}
          title={item.title}
          description={item.description}
          enabled={item.type === "switch" ? item.value as boolean : false}
          onCheckedChange={(v) => { setSecurity({ [item.key]: v } as any); pushToast({ title: `${item.title} ${v ? "enabled" : "disabled"}`, variant: "success" }); }}
        />
      ))}
      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
        <p className="text-xs text-emerald-800">
          <Shield className="h-3.5 w-3.5 inline mr-1" />
          Permissions are enforced at three layers: UI (hidden buttons), Store (action blocked before mutation), and Audit (denied attempts logged).
        </p>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const { notifications, setNotifications, pushToast } = useAppStore();
  const items: Array<{ title: string; description: string; key: keyof typeof notifications }> = [
    { title: "Critical Patient Alerts", description: "Immediate alerts for critical lab values and conditions", key: "criticalPatientAlerts" },
    { title: "Low Stock Warnings", description: "Alert when inventory drops below minimum", key: "lowStockWarnings" },
    { title: "New Appointment Bookings", description: "Notify on new patient appointments", key: "newAppointments" },
    { title: "Payment Receipts", description: "Confirm successful payments", key: "paymentReceipts" },
    { title: "Lab Results Ready", description: "Notify when lab results are verified", key: "labResultsReady" },
    { title: "Staff Schedule Changes", description: "Alert on shift modifications", key: "staffScheduleChanges" },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-foreground">Notification Preferences</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Choose what triggers notifications and how they&apos;re delivered</p>
      </div>
      {items.map((it) => (
        <SecurityRow
          key={it.key}
          icon={Bell}
          title={it.title}
          description={it.description}
          enabled={notifications[it.key]}
          onCheckedChange={(v) => { setNotifications({ [it.key]: v } as any); pushToast({ title: `${it.title} ${v ? "enabled" : "disabled"}`, variant: "success" }); }}
        />
      ))}
    </div>
  );
}

function AppearanceTab() {
  const { prefs, update } = useTheme();
  const options = [
    { mode: "light", label: "Light", icon: Sun },
    { mode: "dark", label: "Dark", icon: Moon },
  ] as const;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-foreground">Appearance</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose a light or dark theme. The setting is stored in this browser.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 max-w-md">
        {options.map((option) => {
          const isActive = prefs.mode === option.mode;
          return (
            <button
              key={option.mode}
              type="button"
              aria-pressed={isActive}
              onClick={() => update({ mode: option.mode })}
              className={`p-4 rounded-lg border text-left ${isActive ? "border-brand-500 bg-brand-50" : "border-border hover:border-brand-300"}`}
            >
              <option.icon className="h-5 w-5 mb-2 text-brand-600" />
              <p className="text-sm font-medium">{option.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function HospitalTab() {
  const { hospital, setHospital, pushToast } = useAppStore();
  const [form, setForm] = useState(hospital);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-foreground">Hospital Profile</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Information shown on invoices, prescriptions, and reports</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs uppercase text-muted-foreground">Hospital Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 mt-1" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs uppercase text-muted-foreground">Address</Label>
          <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="mt-1" />
        </div>
        <div><Label className="text-xs uppercase text-muted-foreground">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Tax ID</Label><Input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} className="h-9 mt-1" /></div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">Currency</Label>
          <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v, currencySymbol: v === "USD" ? "$" : v === "EUR" ? "€" : v === "GBP" ? "£" : "$" })}>
            <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs uppercase text-muted-foreground">Timezone</Label><Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="h-9 mt-1" /></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Fiscal Year Start</Label><Input value={form.fiscalYearStart} onChange={(e) => setForm({ ...form, fiscalYearStart: e.target.value })} className="h-9 mt-1" /></div>
      </div>
      <div className="flex justify-end">
        <Button className="bg-brand-600 hover:bg-brand-700" onClick={() => { setHospital(form); pushToast({ title: "Hospital profile saved", variant: "success" }); }}>
          <Save className="h-4 w-4 mr-1.5" /> Save Changes
        </Button>
      </div>
    </div>
  );
}

function SystemTab() {
  const { setPage } = useAppStore();
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-foreground">System Information</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Build and storage details for this installation</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SystemInfoCard label="System Version" value="MediCore v3.0.0" icon={SettingsIcon} />
        <SystemInfoCard label="Data Storage" value="Browser local storage (prototype)" icon={Database} />
      </div>
      <Card className="p-4 rounded-xl">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Quick Actions</p>
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setPage("activity-log")}>
            <Database className="h-4 w-4 mr-2" /> View Activity Log
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setPage("roles")}>
            <Shield className="h-4 w-4 mr-2" /> Manage Roles & Permissions
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SecurityRow({ icon: Icon, title, description, enabled, onCheckedChange }: { icon: React.ElementType; title: string; description: string; enabled: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card hover:bg-accent/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function SystemInfoCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <Card className="border-border/60 shadow-soft rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><Icon className="h-5 w-5" /></div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
        <p className="text-sm font-semibold mt-0.5">{value}</p>
      </div>
    </Card>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${className || ""}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className || ""}`}>{children}</td>;
}
