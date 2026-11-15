"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Users,
  Shield,
  Bell,
  Palette,
  Plug,
  Database,
  Plus,
  Search,
  Mail,
  MoreVertical,
  CheckCircle2,
  Lock,
  KeyRound,
  Globe,
  Clock,
  Building2,
  Sun,
  Moon,
  Monitor,
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
import { SYSTEM_USERS, ROLE_LABELS, type SystemUser } from "@/lib/data";
import { StatusPill, ColorAvatar } from "@/components/shell/ui-bits";
import { useTheme, ACCENTS, type ThemeMode, type AccentKey } from "@/lib/theme";
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
  { key: "integrations", label: "Integrations", icon: Plug },
  { key: "system", label: "System", icon: Database },
] as const;
type TabKey = typeof TABS[number]["key"];

const INTEGRATIONS = [
  { name: "Twilio SMS", category: "Communication", status: "connected", icon: Bell, color: "text-red-600 bg-red-50" },
  { name: "Stripe Payments", category: "Billing", status: "connected", icon: Shield, color: "text-violet-600 bg-violet-50" },
  { name: "AWS S3 Storage", category: "Storage", status: "connected", icon: Database, color: "text-amber-600 bg-amber-50" },
  { name: "Twilio Video", category: "Telemedicine", status: "connected", icon: Globe, color: "text-red-600 bg-red-50" },
  { name: "SendGrid Email", category: "Communication", status: "disconnected", icon: Mail, color: "text-blue-600 bg-blue-50" },
  { name: "HL7 FHIR API", category: "Interoperability", status: "connected", icon: Plug, color: "text-emerald-600 bg-emerald-50" },
];

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
        <p className="text-sm text-muted-foreground mt-1">Manage users, security, integrations, appearance, and system preferences</p>
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
            {activeTab === "integrations" && <IntegrationsTab />}
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
        <p className="text-xs text-muted-foreground mt-0.5">Choose what triggers notifications and how they're delivered</p>
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
  const { pushToast } = useAppStore();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-foreground">Appearance & Theme</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Customize the look and feel of MediCore. Preferences are persisted across sessions.</p>
      </div>

      <div>
        <Label className="text-xs uppercase text-muted-foreground mb-2 block">Theme Mode</Label>
        <div className="grid grid-cols-3 gap-3">
          {([
            { mode: "light", label: "Light", desc: "Bright, clean", icon: Sun },
            { mode: "dark", label: "Dark", desc: "Easy on eyes", icon: Moon },
            { mode: "system", label: "System", desc: "Follow OS", icon: Monitor },
          ] as const).map((opt) => {
            const isActive = prefs.mode === opt.mode;
            return (
              <div
                key={opt.mode}
                onClick={() => { update({ mode: opt.mode }); pushToast({ title: `Theme: ${opt.label}`, variant: "success" }); }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isActive ? "border-brand-400 bg-brand-50/50" : "border-border hover:border-brand-300"}`}
              >
                <opt.icon className="h-6 w-6 mb-2 text-brand-600" />
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase text-muted-foreground mb-2 block">Accent Color</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ACCENTS.map((accent) => {
            const isActive = prefs.accent === accent.key;
            return (
              <div
                key={accent.key}
                onClick={() => { update({ accent: accent.key }); pushToast({ title: `Accent: ${accent.label}`, variant: "success" }); }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isActive ? "border-foreground" : "border-border hover:border-brand-300"}`}
              >
                <div className="h-10 rounded-lg mb-2" style={{ backgroundColor: accent.swatch }} />
                <p className="text-sm font-semibold">{accent.label}</p>
                <p className="text-[11px] text-muted-foreground">{accent.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs uppercase text-muted-foreground mb-2 block">Corner Radius</Label>
          <Select value={prefs.radius} onValueChange={(v: any) => { update({ radius: v }); pushToast({ title: `Radius: ${v}`, variant: "success" }); }}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (sharp)</SelectItem>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="md">Medium (default)</SelectItem>
              <SelectItem value="lg">Large (rounded)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground mb-2 block">Density</Label>
          <Select value={prefs.density} onValueChange={(v: any) => { update({ density: v }); pushToast({ title: `Density: ${v}`, variant: "success" }); }}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact (smaller text)</SelectItem>
              <SelectItem value="comfortable">Comfortable (default)</SelectItem>
              <SelectItem value="spacious">Spacious (larger text)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-800">
          <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />
          Your theme preferences are saved automatically and restored on every sign-in. Accent color applies across all modules consistently.
        </p>
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

function IntegrationsTab() {
  const { pushToast } = useAppStore();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Integrations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Connect MediCore with external services</p>
        </div>
        <Button size="sm" className="bg-brand-600 hover:bg-brand-700" onClick={() => pushToast({ title: "Integration marketplace", description: "Browse and install new integrations", variant: "info" })}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Integration
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {INTEGRATIONS.map((integ, i) => (
          <motion.div key={integ.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}>
            <Card className="border-border/60 shadow-soft hover:shadow-premium transition-all rounded-xl p-4 h-full">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${integ.color}`}><integ.icon className="h-5 w-5" /></div>
                <StatusPill status={integ.status === "connected" ? "success" : "neutral"}>{integ.status === "connected" ? "Connected" : "Disconnected"}</StatusPill>
              </div>
              <p className="text-sm font-semibold">{integ.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{integ.category}</p>
              <Button
                variant={integ.status === "connected" ? "outline" : "default"}
                size="sm"
                className={`w-full mt-3 h-8 text-xs ${integ.status === "connected" ? "" : "bg-brand-600 hover:bg-brand-700"}`}
                onClick={() => pushToast({ title: `${integ.status === "connected" ? "Configuring" : "Connecting"} ${integ.name}`, variant: "info" })}
              >
                {integ.status === "connected" ? "Configure" : "Connect"}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SystemTab() {
  const { pushToast, backups, createBackup, setPage } = useAppStore();
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-foreground">System Information</h2>
        <p className="text-xs text-muted-foreground mt-0.5">System status and operational metrics</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SystemInfoCard label="System Version" value="MediCore v3.0.0" icon={SettingsIcon} />
        <SystemInfoCard label="Database" value="Zustand + localStorage (browser)" icon={Database} />
        <SystemInfoCard label="Backups Stored" value={`${backups.length} snapshots`} icon={Database} />
        <SystemInfoCard label="Active Sessions" value="42" icon={Users} />
        <SystemInfoCard label="API Response Time" value="124ms avg" icon={Globe} />
        <SystemInfoCard label="Storage Used" value={`${Math.round((JSON.stringify(localStorage).length * 2) / 1024)} KB`} icon={Database} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="p-4 rounded-xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Quick Actions</p>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => { createBackup("Manual backup from Settings"); }}>
              <Database className="h-4 w-4 mr-2" /> Create Backup Now
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setPage("backup")}>
              <Database className="h-4 w-4 mr-2" /> Open Backup & Restore
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setPage("activity-log")}>
              <Database className="h-4 w-4 mr-2" /> View Activity Log
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setPage("roles")}>
              <Shield className="h-4 w-4 mr-2" /> Manage Roles & Permissions
            </Button>
          </div>
        </Card>
        <Card className="p-4 rounded-xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Health Check</p>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-800">All systems operational</p>
            </div>
            <p className="text-xs text-emerald-700 mt-1">Last health check: 2 minutes ago · Uptime: 99.98%</p>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Auth Service</span><span className="text-emerald-600">● Operational</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Database</span><span className="text-emerald-600">● Operational</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Backup Service</span><span className="text-emerald-600">● Operational</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Audit Logging</span><span className="text-emerald-600">● Operational</span></div>
          </div>
        </Card>
      </div>
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
