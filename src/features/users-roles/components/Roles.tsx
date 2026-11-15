"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Shield, Users, Plus, Search, MoreVertical, Check, X, Lock, KeyRound,
  Eye, EyeOff, Download, Crown, UserCog,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAppStore, type SystemUserRecord } from "@/store/app-store";
import {
  PERMISSIONS, ALL_ROLES, ALL_MODULES, ALL_ACTIONS,
  ROLE_LABELS as RBAC_ROLE_LABELS, MODULE_LABELS, ACTION_LABELS,
  can, type ExtendedRole, type Module, type Action,
} from "@/lib/rbac";
import { StatusPill, ColorAvatar } from "@/components/shell/ui-bits";
import { exportToCsv } from "@/lib/print";

const AVATAR_COLORS = [
  "oklch(0.62 0.14 200)", "oklch(0.62 0.14 155)", "oklch(0.65 0.16 280)",
  "oklch(0.72 0.17 75)", "oklch(0.62 0.20 15)", "oklch(0.58 0.15 230)",
];

export default function Roles() {
  const [tab, setTab] = useState<"users" | "matrix">("users");

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">Security</span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Roles & Permissions</h1>
        <p className="text-sm text-muted-foreground mt-1">Granular role-based access control. Permissions enforced at UI, store, and data-operation levels.</p>
      </div>

      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        <div className="border-b border-border flex items-center gap-1 p-2">
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "users" ? "bg-brand-50 text-brand-700" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
          >
            <Users className="h-4 w-4" /> User Accounts
          </button>
          <button
            onClick={() => setTab("matrix")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "matrix" ? "bg-brand-50 text-brand-700" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
          >
            <Shield className="h-4 w-4" /> Permission Matrix
          </button>
        </div>
        {tab === "users" ? <UsersTab /> : <MatrixTab />}
      </Card>
    </div>
  );
}

// ============================================================================
// USERS TAB
// ============================================================================
function UsersTab() {
  const { users, addUser, updateUser, deleteUser, suspendUser, reactivateUser, openModal } = useAppStore();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<SystemUserRecord | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);

  const role = useAppStore((s) => s.user?.role);
  const canEdit = can(role, "users", "edit");
  const canDelete = can(role, "users", "delete");
  const canCreate = can(role, "users", "create");

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const handleExport = () => {
    const rows = filtered.map((u) => ({
      name: u.name, email: u.email, role: RBAC_ROLE_LABELS[u.role],
      status: u.status, lastActive: u.lastActive, twoFactor: u.twoFactor ? "yes" : "no",
      department: u.department ?? "",
    }));
    exportToCsv("users.csv", rows);
  };

  return (
    <>
      <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{RBAC_ROLE_LABELS[r]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1.5" /> Export
        </Button>
        {canCreate && (
          <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700" onClick={() => setShowAddUser(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add User
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-accent/30 border-b border-border">
            <tr>
              <Th>User</Th><Th>Role</Th><Th>Department</Th>
              <Th>Last Active</Th><Th>2FA</Th><Th>Status</Th>
              <Th className="text-right pr-4">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: i * 0.03 }} className="border-b border-border/50 hover:bg-accent/30 transition-colors group">
                <Td>
                  <div className="flex items-center gap-3">
                    <ColorAvatar name={u.name} color={u.avatarColor} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-[11px] text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <Badge variant="outline" className="text-[10px]">{RBAC_ROLE_LABELS[u.role]}</Badge>
                </Td>
                <Td><span className="text-xs text-muted-foreground">{u.department ?? "—"}</span></Td>
                <Td><span className="text-xs text-muted-foreground">{u.lastActive}</span></Td>
                <Td>
                  {u.twoFactor ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><Lock className="h-3 w-3" /> Enabled</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">Disabled</span>
                  )}
                </Td>
                <Td>
                  <StatusPill status={u.status === "active" ? "success" : u.status === "invited" ? "warning" : "danger"}>
                    {u.status}
                  </StatusPill>
                </Td>
                <Td className="text-right pr-4">
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingUser(u)}>
                          <UserCog className="h-3.5 w-3.5 mr-2" /> Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUser(u.id, { twoFactor: !u.twoFactor })}>
                          <KeyRound className="h-3.5 w-3.5 mr-2" /> {u.twoFactor ? "Disable" : "Enable"} 2FA
                        </DropdownMenuItem>
                        {u.status === "active" ? (
                          <DropdownMenuItem onClick={() => suspendUser(u.id)} className="text-amber-600">
                            <Lock className="h-3.5 w-3.5 mr-2" /> Suspend
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => reactivateUser(u.id)} className="text-emerald-600">
                            <Check className="h-3.5 w-3.5 mr-2" /> Reactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => { if (confirm(`Delete user ${u.name}?`)) deleteUser(u.id); }}
                          className="text-rose-600"
                          disabled={!canDelete || u.role === "super_admin"}
                        >
                          <X className="h-3.5 w-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </Td>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit user dialog */}
      {editingUser && (
        <EditUserDialog user={editingUser} onClose={() => setEditingUser(null)} />
      )}

      {/* Add user dialog */}
      {showAddUser && (
        <AddUserDialog onClose={() => setShowAddUser(false)} />
      )}
    </>
  );
}

function EditUserDialog({ user, onClose }: { user: SystemUserRecord; onClose: () => void }) {
  const { updateUser } = useAppStore();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<ExtendedRole>(user.role);
  const [department, setDepartment] = useState(user.department ?? "");

  const save = () => {
    updateUser(user.id, { name, email, role, department });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 mt-1" />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 mt-1" />
          </div>
          <div>
            <Label className="text-xs">Role</Label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => <SelectItem key={r} value={r} disabled={r === "super_admin"}>{RBAC_ROLE_LABELS[r]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Department</Label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} className="h-9 mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-brand-600 hover:bg-brand-700" onClick={save}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddUserDialog({ onClose }: { onClose: () => void }) {
  const { addUser } = useAppStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ExtendedRole>("doctor");
  const [department, setDepartment] = useState("");

  const save = () => {
    if (!name.trim() || !email.trim()) return;
    addUser({
      name: name.trim(),
      email: email.trim(),
      role,
      department: department.trim(),
      twoFactor: false,
      status: "invited",
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Full Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 mt-1" placeholder="Dr. Jane Doe" />
          </div>
          <div>
            <Label className="text-xs">Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 mt-1" placeholder="j.doe@medicore.io" />
          </div>
          <div>
            <Label className="text-xs">Role</Label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_ROLES.filter((r) => r !== "super_admin").map((r) => <SelectItem key={r} value={r}>{RBAC_ROLE_LABELS[r]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Department</Label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} className="h-9 mt-1" placeholder="Cardiology" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-brand-600 hover:bg-brand-700" onClick={save} disabled={!name.trim() || !email.trim()}>
            <Plus className="h-4 w-4 mr-1.5" /> Add User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// PERMISSION MATRIX TAB
// ============================================================================
function MatrixTab() {
  const { pushToast } = useAppStore();
  const [selectedRole, setSelectedRole] = useState<ExtendedRole>("pharmacy_manager");
  const role = useAppStore((s) => s.user?.role);
  const canManage = can(role, "roles", "manage");

  const rolePermissions = PERMISSIONS[selectedRole];

  const togglePermission = (module: Module, action: Action) => {
    if (!canManage) {
      pushToast({ title: "Read-only", description: "You don't have permission to modify the permission matrix.", variant: "warning" });
      return;
    }
    pushToast({
      title: "Permission change simulated",
      description: `In production, this would update the server-side permission matrix for ${selectedRole} → ${module} → ${action}.`,
      variant: "info",
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-brand-600" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Permission Matrix</h3>
          <p className="text-xs text-muted-foreground">Inspect which actions each role can perform on each module. {canManage ? "Click a cell to toggle." : "Read-only view."}</p>
        </div>
        <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
          <SelectTrigger className="h-9 w-[240px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ALL_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                <span className="flex items-center gap-2">
                  {r === "super_admin" && <Crown className="h-3 w-3 text-amber-500" />}
                  {RBAC_ROLE_LABELS[r]}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedRole === "super_admin" ? (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <Crown className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Super Administrator</p>
            <p className="text-xs text-amber-700 mt-1">Super admins implicitly have all actions on all modules. This cannot be modified.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-accent/30 border-b border-border sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[180px]">Module</th>
                {ALL_ACTIONS.map((a) => (
                  <th key={a} className="text-center px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[70px]">
                    {ACTION_LABELS[a]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_MODULES.map((m, idx) => {
                const actions = rolePermissions[m] ?? [];
                return (
                  <tr key={m} className={idx % 2 === 0 ? "bg-card" : "bg-accent/10"}>
                    <td className="px-3 py-2 text-xs font-medium">{MODULE_LABELS[m]}</td>
                    {ALL_ACTIONS.map((a) => {
                      const allowed = actions.includes(a);
                      return (
                        <td key={a} className="text-center px-2 py-2">
                          <button
                            onClick={() => togglePermission(m, a)}
                            disabled={!canManage}
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs transition-all ${
                              allowed
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-muted text-muted-foreground hover:bg-muted/70"
                            } ${canManage ? "cursor-pointer" : "cursor-default"}`}
                          >
                            {allowed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3 w-3 opacity-40" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-blue-800">How RBAC is enforced</p>
          <p className="text-xs text-blue-700 mt-1">
            Permissions are checked at three layers: (1) <strong>UI</strong> — buttons and pages hidden when access is missing;
            (2) <strong>Store</strong> — <code className="text-[10px] bg-blue-100 px-1 rounded">checkPermission()</code> blocks actions before they mutate state;
            (3) <strong>Audit</strong> — every denied attempt is recorded in the activity log with user, module, and action attempted.
          </p>
        </div>
      </div>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${className || ""}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className || ""}`}>{children}</td>;
}
