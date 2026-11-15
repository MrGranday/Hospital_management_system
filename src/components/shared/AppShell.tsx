"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CalendarPlus,
  Stethoscope,
  Ambulance,
  Bed,
  FileText,
  HeartPulse,
  Receipt,
  Pill,
  FlaskConical,
  Radio,
  Boxes,
  Wallet,
  UserCog,
  FileBarChart,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  CalendarDays,
  ChevronsLeft,
  Command,
  CircleDot,
  AlertTriangle,
  CheckCircle2,
  Info,
  AlertCircle,
  ShoppingCart,
  RotateCcw,
  Droplet,
  History,
  Shield,
  Sun,
  Moon,
  Monitor,
  Package,
} from "lucide-react";
import { useAppStore, type PageKey } from "@/store/app-store";
import { NOTIFICATIONS, ROLE_LABELS, type Role } from "@/_legacy/mock-data/data";
import { ModalHost } from "./ModalHost";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { can, toExtendedRole, type Module } from "@/lib/rbac";
import { useTheme, type ThemeMode } from "@/lib/theme";

interface NavItem {
  key: PageKey;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  module?: Module;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Clinical",
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
      { key: "patients", label: "Patients", icon: Users, module: "patients" },
      { key: "appointments", label: "Appointments", icon: CalendarPlus, module: "appointments" },
      { key: "opd", label: "OPD / Outpatient", icon: Stethoscope, badge: 5, module: "opd" },
      { key: "emergency", label: "Emergency", icon: Ambulance, badge: "2", module: "emergency" },
      { key: "ipd", label: "IPD / Inpatient", icon: Bed, module: "ipd" },
      { key: "emr", label: "EMR", icon: FileText, module: "emr" },
      { key: "nursing", label: "Nursing", icon: HeartPulse, module: "nursing" },
    ],
  },
  {
    label: "Revenue & Supply",
    items: [
      { key: "billing", label: "Billing", icon: Receipt, badge: "8", module: "billing" },
      { key: "pharmacy", label: "Pharmacy", icon: Pill, module: "pharmacy" },
      { key: "lab", label: "Laboratory", icon: FlaskConical, badge: 4, module: "lab" },
      { key: "radiology", label: "Radiology", icon: Radio, module: "radiology" },
      { key: "inventory", label: "Inventory", icon: Boxes, badge: "!", module: "inventory" },
      { key: "blood-bank", label: "Blood Bank", icon: Droplet, module: "blood_bank" },
      { key: "purchases", label: "Purchases & Returns", icon: ShoppingCart, module: "purchases" },
      { key: "suppliers", label: "Suppliers", icon: Package, module: "suppliers" },
    ],
  },
  {
    label: "Operations",
    items: [
      { key: "finance", label: "Finance", icon: Wallet, module: "finance" },
      { key: "hr", label: "Human Resources", icon: UserCog, module: "hr" },
      { key: "reports", label: "Reports", icon: FileBarChart, module: "reports" },
    ],
  },
  {
    label: "Administration",
    items: [
      { key: "settings", label: "Settings", icon: Settings, module: "settings" },
      { key: "roles", label: "Roles & Permissions", icon: Shield, module: "roles" },
      { key: "activity-log", label: "Activity Log", icon: History, module: "activity_log" },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { mobileSidebarOpen, setMobileSidebar, currentPage } = useAppStore();
  // Initialize theme on mount
  useTheme();
  return (
    <div className="h-screen overflow-hidden flex bg-background">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Global Modal Host */}
      <ModalHost />

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <MobileSidebar onClose={() => setMobileSidebar(false)} />
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="min-w-0 flex-1 h-screen flex flex-col overflow-hidden">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto bg-background">
          <div className="max-w-[1600px] w-full mx-auto p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

function DesktopSidebar() {
  const { sidebarCollapsed, toggleSidebar, currentPage, setPage, user } = useAppStore();
  const role = user?.role;
  const filteredGroups = useMemo(() => {
    return NAV_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((it) => !it.module || can(role, it.module, "view")),
    })).filter((g) => g.items.length > 0);
  }, [role]);
  return (
    <aside
      className={cn(
        "hidden md:flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-out shrink-0 border-r border-sidebar-border",
        sidebarCollapsed ? "w-[76px]" : "w-[260px]",
      )}
    >
      {/* Logo / Brand */}
      <div className={cn("h-16 flex items-center border-b border-sidebar-border shrink-0", sidebarCollapsed ? "justify-center px-2" : "gap-2.5 px-5")}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 shadow-blue-glow">
          <Stethoscope className="h-5 w-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="animate-fade-in">
            <p className="font-bold text-foreground tracking-tight leading-none">MediCore</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Hospital OS</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-6 sidebar-scroll">
        {filteredGroups.map((group) => {
          const items = group.items;
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              {!sidebarCollapsed && (
                <p className="px-3 text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/40 font-semibold mb-2">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavButton
                    key={item.key}
                    item={item}
                    active={currentPage === item.key}
                    collapsed={sidebarCollapsed}
                    onClick={() => setPage(item.key)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="h-10 shrink-0 border-t border-sidebar-border flex items-center justify-center text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent transition-colors"
      >
        <ChevronsLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
      </button>
    </aside>
  );
}

function NavButton({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  const isBadgeNum = typeof item.badge === "number";
  const isBadgeStr = typeof item.badge === "string";

  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        "w-full group relative flex items-center gap-3 rounded-lg text-sm transition-all duration-150",
        collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2",
        active
          ? "bg-brand-600 text-white shadow-blue-glow"
          : "text-sidebar-foreground hover:text-brand-700 hover:bg-brand-50",
      )}
    >
      {/* Active indicator bar */}
      {active && !collapsed && (
        <motion.div
          layoutId="activeNavIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-brand-600"
        />
      )}
      <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-white" : "text-muted-foreground group-hover:text-brand-600")} />
      {!collapsed && (
        <>
          <span className={cn("flex-1 text-left truncate font-medium", !active && "text-foreground/80")}>{item.label}</span>
          {item.badge && (
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-md min-w-[18px] text-center",
                active
                  ? "bg-white/25 text-white"
                  : item.badge === "!"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-brand-100 text-brand-700",
              )}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
      {collapsed && item.badge && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500" />
      )}
    </button>
  );
}

function MobileSidebar({ onClose }: { onClose: () => void }) {
  const { currentPage, setPage, user } = useAppStore();
  const role = user?.role;
  const filteredGroups = useMemo(() => {
    return NAV_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((it) => !it.module || can(role, it.module, "view")),
    })).filter((g) => g.items.length > 0);
  }, [role]);
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 240 }}
        className="fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-sidebar text-sidebar-foreground flex flex-col md:hidden"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-blue-glow">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-foreground leading-none">MediCore</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Hospital OS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {filteredGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = currentPage === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setPage(item.key);
                        onClose();
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        active
                          ? "bg-brand-600 text-white shadow-blue-glow"
                          : "text-foreground/80 hover:bg-brand-50 hover:text-brand-700",
                      )}
                    >
                      <Icon className={cn("h-[18px] w-[18px]", active ? "text-white" : "text-muted-foreground")} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
                          active ? "bg-white/25 text-white" : "bg-brand-100 text-brand-700",
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </motion.aside>
    </>
  );
}

function TopBar() {
  const { user, logout, setMobileSidebar, setPage, commandOpen, setCommandOpen, pushToast } = useAppStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Cmd-K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commandOpen, setCommandOpen]);

  const { notificationsRead, markAllNotificationsRead } = useAppStore();
  const unread = useMemo(
    () => NOTIFICATIONS.filter((n) => !n.read && !notificationsRead.has(n.id) && !notificationsRead.has("all")).length,
    [notificationsRead],
  );

  const initials = user?.name
    ?.split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const roleLabel = user?.role ? (ROLE_LABELS[user.role as Role] ?? user.role) : "User";

  return (
    <header className="h-16 shrink-0 bg-card/80 backdrop-blur-xl border-b border-border z-30 flex items-center gap-3 px-4 md:px-6">
      <button
        className="md:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground"
        onClick={() => setMobileSidebar(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-xl">
        <button
          onClick={() => setCommandOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg bg-muted/60 hover:bg-muted border border-transparent hover:border-border transition-colors text-sm text-muted-foreground"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search patients, doctors, invoices...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 h-5 rounded border border-border bg-background text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Calendar quick */}
        <button
          onClick={() => setPage("appointments")}
          className="hidden sm:flex p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          title="Calendar"
        >
          <CalendarDays className="h-[18px] w-[18px]" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-rose-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center ring-2 ring-card">
                {unread}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-[380px] bg-card rounded-xl shadow-premium border border-border overflow-hidden z-40"
                >
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">Notifications</p>
                      <p className="text-xs text-muted-foreground">{unread} unread</p>
                    </div>
                    {unread > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={markAllNotificationsRead}
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-[420px] overflow-y-auto">
                    {NOTIFICATIONS.map((n) => {
                      const isUnread = !n.read && !notificationsRead.has(n.id) && !notificationsRead.has("all");
                      const Icon =
                        n.type === "critical" ? AlertCircle :
                        n.type === "warning" ? AlertTriangle :
                        n.type === "success" ? CheckCircle2 :
                        Info;
                      const color =
                        n.type === "critical" ? "text-rose-500 bg-rose-50" :
                        n.type === "warning" ? "text-amber-500 bg-amber-50" :
                        n.type === "success" ? "text-emerald-500 bg-emerald-50" :
                        "text-brand-500 bg-brand-50";
                      return (
                        <button
                          key={n.id}
                          onClick={() => {
                            if (n.action) setPage(n.action.route as PageKey);
                            setNotifOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border/50 flex gap-3 relative",
                            isUnread && "bg-brand-50/40",
                          )}
                        >
                          {isUnread && (
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-500" />
                          )}
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", color)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground leading-snug">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground/70 mt-1">{n.time}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-6 bg-border mx-1.5" />

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <Avatar className="h-8 w-8 ring-2 ring-background">
              <AvatarFallback className="bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold leading-tight">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{roleLabel}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-premium border border-border overflow-hidden z-40"
                >
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-brand-500 to-brand-700 text-white text-sm font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px] font-medium bg-brand-50 text-brand-700 hover:bg-brand-100">
                        {roleLabel}
                      </Badge>
                      {user?.department && (
                        <Badge variant="outline" className="text-[10px]">
                          {user.department}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-1.5">
                    <ProfileMenuItem icon={Settings} label="Account settings" onClick={() => { setPage("settings"); setProfileOpen(false); }} />
                    <ProfileMenuItem icon={CircleDot} label="Status: Available" onClick={() => pushToast({ title: "Status (demo)", description: "Status would update here", variant: "info" })} />
                    <ProfileMenuItem icon={LogOut} label="Sign out" danger onClick={logout} />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CommandPalette />
    </header>
  );
}

function ProfileMenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-accent transition-colors",
        danger ? "text-rose-600 hover:bg-rose-50" : "text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function CommandPalette() {
  const { commandOpen, setCommandOpen, setPage, user } = useAppStore();
  const role = user?.role;
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const all = NAV_GROUPS.flatMap((g) => g.items).filter((it) => !it.module || can(role, it.module, "view"));
    if (!query) return all;
    return all.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));
  }, [query, role]);

  const closePalette = () => {
    setCommandOpen(false);
    setQuery("");
  };

  return (
    <AnimatePresence>
      {commandOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={closePalette}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed top-[12%] left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl"
          >
            <div className="bg-card rounded-2xl shadow-premium border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search anything..."
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                />
                <kbd className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 border border-border rounded">ESC</kbd>
              </div>
              <div className="max-h-[360px] overflow-y-auto p-2">
                <p className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Navigation
                </p>
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setPage(item.key);
                        closePalette();
                      }}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm">{item.label}</span>
                      <Command className="h-3 w-3 text-muted-foreground/60" />
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Theme toggle button — cycles Light → Dark → System
// ============================================================================
function ThemeToggle() {
  const { prefs, update } = useTheme();
  const [open, setOpen] = useState(false);
  const cycle: ThemeMode[] = ["light", "dark", "system"];
  const next = cycle[(cycle.indexOf(prefs.mode) + 1) % cycle.length];
  const Icon = prefs.mode === "light" ? Sun : prefs.mode === "dark" ? Moon : Monitor;
  return (
    <div className="relative">
      <button
        onClick={() => update({ mode: next })}
        onContextMenu={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        title={`Theme: ${prefs.mode} (click to cycle, right-click for menu)`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-premium border border-border overflow-hidden z-40 p-1.5"
            >
              <p className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Theme Mode</p>
              {([
                { mode: "light", label: "Light", icon: Sun },
                { mode: "dark", label: "Dark", icon: Moon },
                { mode: "system", label: "System", icon: Monitor },
              ] as const).map((opt) => (
                <button
                  key={opt.mode}
                  onClick={() => { update({ mode: opt.mode }); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-accent transition-colors",
                    prefs.mode === opt.mode && "bg-brand-50 text-brand-700",
                  )}
                >
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                  {prefs.mode === opt.mode && <CheckCircle2 className="h-3.5 w-3.5 ml-auto" />}
                </button>
              ))}
              <div className="my-1 h-px bg-border" />
              <p className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Accent Color</p>
              <div className="grid grid-cols-8 gap-1 px-2 pb-1.5">
                {([
                  { key: "blue", color: "oklch(0.608 0.180 245)" },
                  { key: "emerald", color: "oklch(0.62 0.150 155)" },
                  { key: "violet", color: "oklch(0.58 0.150 290)" },
                  { key: "rose", color: "oklch(0.65 0.200 15)" },
                  { key: "amber", color: "oklch(0.72 0.160 75)" },
                  { key: "cyan", color: "oklch(0.62 0.150 200)" },
                  { key: "teal", color: "oklch(0.60 0.130 180)" },
                  { key: "indigo", color: "oklch(0.55 0.180 265)" },
                ] as const).map((a) => (
                  <button
                    key={a.key}
                    onClick={() => update({ accent: a.key })}
                    className={cn("w-5 h-5 rounded-full border-2 transition-all", prefs.accent === a.key ? "scale-110 border-foreground" : "border-transparent hover:scale-105")}
                    style={{ backgroundColor: a.color }}
                    title={a.key}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
