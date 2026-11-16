// ============================================================================
// Role-Based Access Control (RBAC) for MediCore HMS
// ============================================================================
// Granular, secure permission system enforced at UI, store, and (when used
// with a server) data-operation layers. Centralises ALL permission logic so
// it cannot drift between modules.
// ============================================================================

import type { Role } from "@/_legacy/mock-data/data";

// Extended healthcare roles
export type ExtendedRole =
  | "super_admin"
  | "admin"
  | "doctor"
  | "dentist"
  | "pharmacist"
  | "pharmacy_manager"
  | "lab_staff"
  | "receptionist"
  | "accountant"
  | "inventory_staff"
  | "storekeeper"
  | "nurse"
  | "radiologist";

export const ALL_ROLES: ExtendedRole[] = [
  "super_admin",
  "admin",
  "doctor",
  "dentist",
  "pharmacist",
  "pharmacy_manager",
  "lab_staff",
  "receptionist",
  "accountant",
  "inventory_staff",
  "storekeeper",
  "nurse",
  "radiologist",
];

export const ROLE_LABELS: Record<ExtendedRole, string> = {
  super_admin: "Super Administrator",
  admin: "Administrator",
  doctor: "Doctor",
  dentist: "Dentist",
  pharmacist: "Pharmacist",
  pharmacy_manager: "Pharmacy Manager",
  lab_staff: "Laboratory Staff",
  receptionist: "Receptionist",
  accountant: "Accountant",
  inventory_staff: "Inventory Staff",
  storekeeper: "Storekeeper",
  nurse: "Nurse",
  radiologist: "Radiologist",
};

// All system modules (each may have a page or be a sub-module)
export type Module =
  | "dashboard"
  | "patients"
  | "appointments"
  | "opd"
  | "emergency"
  | "ipd"
  | "emr"
  | "nursing"
  | "billing"
  | "pharmacy"
  | "lab"
  | "radiology"
  | "inventory"
  | "blood_bank"
  | "purchases"
  | "purchase_returns"
  | "suppliers"
  | "finance"
  | "hr"
  | "reports"
  | "settings"
  | "activity_log"
  | "roles"
  | "users";

export const ALL_MODULES: Module[] = [
  "dashboard",
  "patients",
  "appointments",
  "opd",
  "emergency",
  "ipd",
  "emr",
  "nursing",
  "billing",
  "pharmacy",
  "lab",
  "radiology",
  "inventory",
  "blood_bank",
  "purchases",
  "purchase_returns",
  "suppliers",
  "finance",
  "hr",
  "reports",
  "settings",
  "activity_log",
  "roles",
  "users",
];

// Granular actions
export type Action =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "receive"
  | "return"
  | "adjust"
  | "export"
  | "print"
  | "manage";

export const ALL_ACTIONS: Action[] = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "receive",
  "return",
  "adjust",
  "export",
  "print",
  "manage",
];

export const ACTION_LABELS: Record<Action, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  approve: "Approve",
  receive: "Receive",
  return: "Return",
  adjust: "Adjust",
  export: "Export",
  print: "Print",
  manage: "Manage",
};

export const MODULE_LABELS: Record<Module, string> = {
  dashboard: "Dashboard",
  patients: "Patients",
  appointments: "Appointments",
  opd: "OPD / Outpatient",
  emergency: "Emergency",
  ipd: "Inpatient (IPD)",
  emr: "Medical Records (EMR)",
  nursing: "Nursing",
  billing: "Billing & Invoices",
  pharmacy: "Pharmacy",
  lab: "Laboratory",
  radiology: "Radiology",
  inventory: "Inventory",
  blood_bank: "Blood Bank",
  purchases: "Purchase Orders",
  purchase_returns: "Purchase Returns",
  suppliers: "Suppliers",
  finance: "Finance",
  hr: "Human Resources",
  reports: "Reports",
  settings: "System Settings",
  activity_log: "Activity Log",
  roles: "Roles & Permissions",
  users: "User Accounts",
};

// ============================================================================
// Permission Matrix
// ============================================================================
// Format: permissions[role][module] = Action[]
// super_admin implicitly has ALL actions on ALL modules (handled in can()).
// ============================================================================
type PermissionMatrix = Record<ExtendedRole, Partial<Record<Module, Action[]>>>;

const A = (actions: Action[]): Action[] => actions;
const FULL: Action[] = ["view", "create", "edit", "delete", "approve", "receive", "return", "adjust", "export", "print", "manage"];

export const PERMISSIONS: PermissionMatrix = {
  super_admin: Object.fromEntries(ALL_MODULES.map((m) => [m, FULL])) as Record<Module, Action[]>,

  admin: {
    dashboard: A(["view"]),
    patients: FULL,
    appointments: FULL,
    opd: FULL,
    emergency: FULL,
    ipd: FULL,
    emr: FULL,
    nursing: FULL,
    billing: FULL,
    pharmacy: FULL,
    lab: FULL,
    radiology: FULL,
    inventory: FULL,
    blood_bank: FULL,
    purchases: FULL,
    purchase_returns: FULL,
    suppliers: FULL,
    finance: FULL,
    hr: FULL,
    reports: FULL,
    settings: FULL,
    activity_log: A(["view", "export", "manage"]),
    roles: FULL,
    users: FULL,
  },

  doctor: {
    dashboard: A(["view"]),
    patients: A(["view", "create", "edit", "print"]),
    appointments: A(["view", "create", "edit"]),
    opd: A(["view", "create", "edit", "print"]),
    emergency: A(["view", "create", "edit"]),
    ipd: A(["view", "create", "edit", "print"]),
    emr: A(["view", "create", "edit", "print"]),
    nursing: A(["view"]),
    billing: A(["view"]),
    pharmacy: A(["view", "print"]),
    lab: A(["view", "create", "print"]),
    radiology: A(["view", "create", "print"]),
    inventory: A(["view"]),
    blood_bank: A(["view", "create", "print"]),
    purchases: A(["view"]),
    purchase_returns: A(["view"]),
    suppliers: A(["view"]),
    finance: A(["view"]),
    hr: A(["view"]),
    reports: A(["view", "export", "print"]),
    settings: A(["view"]),
    activity_log: A(["view"]),
    roles: A(["view"]),
    users: A(["view"]),
  },

  dentist: {
    dashboard: A(["view"]),
    patients: A(["view", "create", "edit", "print"]),
    appointments: A(["view", "create", "edit"]),
    opd: A(["view", "create", "edit", "print"]),
    ipd: A(["view"]),
    emr: A(["view", "create", "edit", "print"]),
    billing: A(["view"]),
    pharmacy: A(["view", "print"]),
    lab: A(["view", "create", "print"]),
    radiology: A(["view", "create", "print"]),
    inventory: A(["view"]),
    blood_bank: A(["view"]),
    purchases: A(["view"]),
    reports: A(["view", "print"]),
    settings: A(["view"]),
    activity_log: A(["view"]),
  },

  pharmacist: {
    dashboard: A(["view"]),
    patients: A(["view"]),
    pharmacy: A(["view", "create", "edit", "print", "export"]),
    inventory: A(["view"]),
    purchases: A(["view", "create"]),
    purchase_returns: A(["view", "create"]),
    suppliers: A(["view"]),
    billing: A(["view", "create"]),
    reports: A(["view", "export", "print"]),
    settings: A(["view"]),
    activity_log: A(["view"]),
  },

  pharmacy_manager: {
    dashboard: A(["view"]),
    patients: A(["view"]),
    pharmacy: FULL,
    inventory: A(["view", "create", "edit", "adjust", "export", "print"]),
    purchases: A(["view", "create", "edit", "approve", "receive", "export", "print"]),
    purchase_returns: A(["view", "create", "edit", "approve", "return", "export", "print"]),
    suppliers: A(["view", "create", "edit"]),
    billing: A(["view", "create"]),
    reports: A(["view", "export", "print"]),
    settings: A(["view"]),
    activity_log: A(["view"]),
    users: A(["view"]),
  },

  lab_staff: {
    dashboard: A(["view"]),
    patients: A(["view"]),
    lab: A(["view", "create", "edit", "print", "export"]),
    radiology: A(["view", "create", "edit", "print"]),
    inventory: A(["view"]),
    blood_bank: A(["view", "create", "edit", "adjust", "print"]),
    billing: A(["view"]),
    reports: A(["view", "export", "print"]),
    settings: A(["view"]),
    activity_log: A(["view"]),
  },

  receptionist: {
    dashboard: A(["view"]),
    patients: A(["view", "create", "edit"]),
    appointments: A(["view", "create", "edit"]),
    opd: A(["view", "create"]),
    emergency: A(["view"]),
    billing: A(["view", "create", "print"]),
    reports: A(["view", "print"]),
    settings: A(["view"]),
    activity_log: A(["view"]),
  },

  accountant: {
    dashboard: A(["view"]),
    patients: A(["view"]),
    billing: A(["view", "create", "edit", "export", "print"]),
    finance: A(["view", "create", "edit", "export", "print"]),
    purchases: A(["view", "export", "print"]),
    purchase_returns: A(["view", "export", "print"]),
    suppliers: A(["view"]),
    reports: A(["view", "export", "print"]),
    settings: A(["view"]),
    activity_log: A(["view"]),
  },

  inventory_staff: {
    dashboard: A(["view"]),
    inventory: A(["view", "create", "edit", "adjust", "export", "print"]),
    pharmacy: A(["view"]),
    purchases: A(["view", "create", "receive", "export", "print"]),
    purchase_returns: A(["view", "create", "return", "export", "print"]),
    suppliers: A(["view"]),
    reports: A(["view", "export", "print"]),
    settings: A(["view"]),
    activity_log: A(["view"]),
  },

  storekeeper: {
    dashboard: A(["view"]),
    inventory: A(["view", "create", "edit", "adjust", "receive", "export", "print"]),
    pharmacy: A(["view"]),
    purchases: A(["view", "receive"]),
    purchase_returns: A(["view", "return"]),
    suppliers: A(["view"]),
    blood_bank: A(["view", "create", "edit", "adjust"]),
    reports: A(["view", "print"]),
    settings: A(["view"]),
    activity_log: A(["view"]),
  },

  nurse: {
    dashboard: A(["view"]),
    patients: A(["view", "edit"]),
    appointments: A(["view"]),
    opd: A(["view", "edit"]),
    emergency: A(["view", "edit"]),
    ipd: A(["view", "edit"]),
    emr: A(["view", "create", "edit"]),
    nursing: A(["view", "create", "edit", "print"]),
    pharmacy: A(["view", "print"]),
    lab: A(["view", "create"]),
    radiology: A(["view", "create"]),
    inventory: A(["view"]),
    blood_bank: A(["view", "create"]),
    billing: A(["view"]),
    reports: A(["view"]),
    settings: A(["view"]),
    activity_log: A(["view"]),
  },

  radiologist: {
    dashboard: A(["view"]),
    patients: A(["view"]),
    radiology: A(["view", "create", "edit", "print", "export"]),
    lab: A(["view"]),
    inventory: A(["view"]),
    reports: A(["view", "export", "print"]),
    settings: A(["view"]),
    activity_log: A(["view"]),
  },
};

// ============================================================================
// Permission checkers
// ============================================================================

export function getRoleActions(role: ExtendedRole | Role | undefined, module: Module): Action[] {
  if (!role) return [];
  const r = role as ExtendedRole;
  if (r === "super_admin") return FULL;
  return PERMISSIONS[r]?.[module] ?? [];
}

export function can(role: ExtendedRole | Role | undefined, module: Module, action: Action): boolean {
  if (!role) return false;
  const r = role as ExtendedRole;
  if (r === "super_admin") return true;
  const actions = PERMISSIONS[r]?.[module];
  if (!actions) return false;
  return actions.includes(action);
}

export function canView(role: ExtendedRole | Role | undefined, module: Module): boolean {
  return can(role, module, "view");
}

export function canAny(role: ExtendedRole | Role | undefined, module: Module): boolean {
  if (!role) return false;
  return getRoleActions(role, module).length > 0;
}

// Map legacy Role to ExtendedRole (for backward compat with existing data.ts)
export function toExtendedRole(role: Role | ExtendedRole | undefined): ExtendedRole {
  if (!role) return "nurse";
  if ((ALL_ROLES as string[]).includes(role as string)) return role as ExtendedRole;
  // Map legacy roles
  const map: Record<string, ExtendedRole> = {
    inventory_manager: "inventory_staff",
    lab_tech: "lab_staff",
  };
  return map[role as string] ?? "nurse";
}

// Get all modules a role has access to (for nav rendering)
export function getAccessibleModules(role: ExtendedRole | Role | undefined): Module[] {
  if (!role) return [];
  const r = toExtendedRole(role);
  if (r === "super_admin") return ALL_MODULES;
  const perms = PERMISSIONS[r] ?? {};
  return ALL_MODULES.filter((m) => (perms[m]?.length ?? 0) > 0);
}
