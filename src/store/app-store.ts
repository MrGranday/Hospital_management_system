// ============================================================================
// MediCore Global Application Store (Zustand)
// ============================================================================
// Single source of truth for all live data, including:
//   - Auth / current user
//   - UI state (current page, modals, toasts, sidebar)
//   - Activity log (audit trail)
//   - RBAC enforcement
//   - Theme preferences (also persisted separately in localStorage)
//   - Pharmacy: stock, batches, sales, prescriptions
//   - Purchasing: purchase orders, goods receipts, purchase returns
//   - Suppliers: with running account balances
//   - Blood bank: bags, donors, transfusions
//   - App settings: hospital profile, security, notifications
// ============================================================================

import { create } from "zustand";
import type { User, Role, Patient, Appointment, Medicine } from "@/_legacy/mock-data/data";
import {
  CURRENT_USER, PATIENTS, DOCTORS, MEDICINES, APPOINTMENTS,
  SUPPLIERS, BLOOD_DONORS, BLOOD_BAGS_SEED, DEFAULT_HOSPITAL,
  type Supplier, type BloodBag, type BloodDonor, type BloodType, type BloodComponent,
  type HospitalProfile,
} from "@/_legacy/mock-data/data";

// Re-export types that consumers need
export type { Supplier, BloodBag, BloodDonor, BloodType, BloodComponent, HospitalProfile };
import { can as rbacCan, toExtendedRole, type ExtendedRole, type Module, type Action } from "@/lib/rbac";
import { ThemePrefs, DEFAULT_THEME } from "@/lib/theme";
import { readLS, writeLS } from "@/lib/storage";

export type PageKey =
  | "dashboard" | "patients" | "appointments" | "opd" | "emergency" | "ipd" | "emr"
  | "nursing" | "billing" | "pharmacy" | "lab" | "radiology" | "inventory"
  | "blood-bank" | "insurance" | "finance" | "hr" | "reports"
  | "settings" | "activity-log" | "services"
  | "roles" | "purchases" | "suppliers";

export type ModalType =
  | "pos" | "return" | "newPrescription" | "newPurchaseOrder" | "restock"
  | "newPatient" | "newInvoice" | "newAppointment" | "newLabOrder" | "newExpense"
  | "admitPatient" | "newStaff" | "newNote"
  | "collectPayment" | "newInventoryItem" | "newImagingOrder" | "viewLabResult"
  | "receiveGoods" | "newPurchaseReturn" | "newSupplier" | "newBloodDonation"
  | "newDonor" | "newTransfusion" | "editUser" | "editPermissions"
  | "adjustStock";

export type ToastVariant = "success" | "warning" | "info" | "danger";
export interface ToastItem { id: string; title: string; description?: string; variant: ToastVariant; }

// ============================================================================
// ACTIVITY LOG (audit trail)
// ============================================================================
export type ActivityCategory =
  | "auth" | "patient" | "appointment" | "pharmacy" | "inventory"
  | "purchase" | "purchase_return" | "supplier" | "lab" | "radiology"
  | "billing" | "payment" | "user" | "role" | "permission"
  | "system" | "blood_bank" | "nursing" | "ipd" | "emr" | "settings"
  | "finance" | "clinical" | "hr" | "opd";

export interface ActivityEntry {
  id: string;
  timestamp: string; // ISO
  user: string;
  role: string;
  action: string;       // human-readable, e.g. "Created purchase order"
  category: ActivityCategory;
  module: string;       // module key
  targetRecordId?: string;
  targetRecordType?: string;
  details: string;
  success: boolean;
  ipAddress?: string;
}

// ============================================================================
// PURCHASE ORDERS + RETURNS + RECEIPTS
// ============================================================================
export type PurchaseOrderStatus =
  | "draft" | "pending" | "approved" | "ordered"
  | "partially_received" | "fully_received" | "cancelled";

export interface PurchaseOrderLine {
  id: string;
  medicineId: string;
  name: string;
  batchNo?: string;
  expiryDate?: string;
  orderedQty: number;
  freeQty: number;
  receivedQty: number;   // running total received
  returnedQty: number;   // running total returned
  unitCost: number;
  discountPct: number;
  taxPct: number;
  lineTotal: number;     // computed: (orderedQty + freeQty) * unitCost * (1 - disc) * (1 + tax)
  notes?: string;
}

export interface GoodsReceiptItem {
  lineId: string;
  medicineId: string;
  name: string;
  receivedQty: number;
  batchNo: string;
  expiryDate: string;
}

export interface GoodsReceipt {
  id: string;
  number: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  receivedBy: string;
  receivedAt: string; // ISO
  items: GoodsReceiptItem[];
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  date: string;
  expectedDate?: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  approvedAt?: string;
  receipts: GoodsReceipt[];
}

export type PurchaseReturnStatus =
  | "draft" | "pending_approval" | "approved" | "completed" | "rejected" | "cancelled";

export type ReturnReason =
  | "damaged" | "expired" | "near_expiry" | "incorrect_product"
  | "wrong_quantity" | "supplier_issue" | "quality_issue" | "other";

export interface PurchaseReturnLine {
  id: string;
  poLineId: string;
  medicineId: string;
  name: string;
  batchNo: string;
  expiryDate: string;
  receivedQty: number;
  returnedBefore: number; // returned qty before this return
  returnQty: number;
  unitCost: number;
  lineTotal: number;
  reason: ReturnReason;
  notes?: string;
}

export interface PurchaseReturn {
  id: string;
  number: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  status: PurchaseReturnStatus;
  items: PurchaseReturnLine[];
  totalCredit: number;
  reason?: ReturnReason; // overall dominant reason
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
}

// ============================================================================
// INVENTORY BATCHES (for medicine stock traceability)
// ============================================================================
export interface MedicineBatch {
  id: string;
  medicineId: string;
  batchNo: string;
  expiryDate: string;
  receivedQty: number;
  currentQty: number;
  unitCost: number;
  receivedDate: string;
  poNumber?: string;
  supplierId?: string;
}

// ============================================================================
// BLOOD BANK TRANSFUSIONS
// ============================================================================
export interface BloodTransfusion {
  id: string;
  number: string;
  patientId: string;
  patientName: string;
  mrn: string;
  patientBloodType: BloodType;
  requiredBloodType: BloodType;
  component: BloodComponent;
  units: number; // bag count
  bagIds: string[];
  orderedBy: string;
  performedBy: string;
  crossMatchedBy: string;
  crossMatchResult: "compatible" | "incompatible";
  date: string;
  status: "pending" | "cross_matched" | "in_progress" | "completed" | "cancelled" | "reaction";
  notes?: string;
  reactions?: string;
}

// ============================================================================
// USERS (extended) + SECURITY SETTINGS
// ============================================================================
export interface SystemUserRecord {
  id: string;
  name: string;
  email: string;
  role: ExtendedRole;
  status: "active" | "invited" | "suspended";
  lastActive: string;
  twoFactor: boolean;
  avatarColor: string;
  department?: string;
}

export interface SecuritySettings {
  twoFactorRequired: boolean;
  sessionTimeoutMin: number;
  strongPasswordRequired: boolean;
  ipWhitelistEnabled: boolean;
  geoBlockingEnabled: boolean;
  auditLoggingEnabled: boolean;
}

export interface NotificationSettings {
  criticalPatientAlerts: boolean;
  lowStockWarnings: boolean;
  newAppointments: boolean;
  paymentReceipts: boolean;
  labResultsReady: boolean;
  staffScheduleChanges: boolean;
}

// ============================================================================
// Existing live-record types (kept for backward compat with pages)
// ============================================================================
export interface SaleItem { medicineId: string; name: string; qty: number; price: number; }
export interface SaleRecord { id: string; number: string; customer: string; items: SaleItem[]; subtotal: number; tax: number; total: number; paymentMethod: "Cash" | "Card" | "Insurance"; cashier: string; time: string; refunded?: boolean; }
export interface LiveLabOrder {
  id: string; number: string; patientName: string; mrn: string; orderedBy: string;
  tests: string[]; priority: "routine" | "urgent" | "stat";
  status: "pending" | "sample-collected" | "in-progress" | "completed" | "verified";
  source: string; date: string; resultReady?: boolean;
  results?: { name: string; result: string; range: string; flag: "normal" | "high" | "low" }[];
}
export interface LivePrescription {
  id: string; number: string; patientName: string; mrn: string; prescribedBy: string;
  date: string; status: "pending" | "filled" | "dispensed" | "cancelled";
  items: { name: string; qty: number; dosage: string }[]; total: number; source: string;
}
export interface LiveInvoice {
  id: string; number: string; patientName: string; mrn: string; date: string;
  amount: number; paid: number; status: "paid" | "partial" | "unpaid" | "overdue";
  department: string; items: { description: string; qty: number; rate: number; total: number }[];
  source: string; serviceType?: string;
}
export interface LiveReturn { id: string; number: string; saleNumber: string; customer: string; amount: number; reason: string; date: string; status: "processed" | "pending"; }
export interface LiveStaff {
  id: string; name: string; role: string; department: string; email: string;
  phone: string; status: "active" | "on-leave" | "inactive"; joinedOn: string; avatarColor: string;
}
export interface LiveExpense {
  id: string; number: string; category: string; amount: number; description: string;
  vendor: string; date: string; recordedBy: string;
}
export interface LiveNote {
  id: string; patientId: string; patientName: string; mrn: string; type: string;
  content: string; author: string; date: string;
}
export interface LiveBed {
  id: string; bedNumber: string; ward: string; type: string; status: "available" | "occupied" | "cleaning" | "maintenance";
  patientId?: string; patientName?: string; admittedOn?: string; attending?: string; condition?: string;
}
export interface LiveAppointment extends Appointment {}

// ============================================================================
// Sequence counters + UID helper
// ============================================================================
let toastSeq = 0, activitySeq = 0, saleSeq = 100, labSeq = 500, rxSeq = 1100, invSeq = 1100, retSeq = 300;
let patSeq = 100, aptSeq = 200, staffSeq = 100, expSeq = 100, noteSeq = 100, poSeq = 100;
let grSeq = 0, prSeq = 100, donorSeq = 100, bagSeq = 100, txSeq = 100, userSeq = 100;
function uid(p: string) { return `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

// ============================================================================
// Helpers for line totals
// ============================================================================
function computeLineTotal(qty: number, freeQty: number, unitCost: number, discountPct: number, taxPct: number): number {
  const gross = (qty + freeQty) * unitCost;
  const afterDisc = gross * (1 - discountPct / 100);
  const withTax = afterDisc * (1 + taxPct / 100);
  return Math.round(withTax * 100) / 100;
}

function computePoTotals(items: PurchaseOrderLine[]) {
  let subtotal = 0, discountTotal = 0, taxTotal = 0;
  for (const it of items) {
    const gross = (it.orderedQty + it.freeQty) * it.unitCost;
    subtotal += gross;
    discountTotal += gross * (it.discountPct / 100);
    taxTotal += (gross * (1 - it.discountPct / 100)) * (it.taxPct / 100);
  }
  const total = subtotal - discountTotal + taxTotal;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

// ============================================================================
// Store interface
// ============================================================================
interface AppState {
  // ===== Auth / UI =====
  authenticated: boolean;
  user: User | null;
  setSessionUser: (user: User) => void;
  logout: () => void;
  failedLoginAttempts: number;
  currentPage: PageKey;
  pageInitialized: boolean;
  pageParam?: string;
  setPage: (page: PageKey, param?: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebar: (v: boolean) => void;
  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;
  notificationsRead: Set<string>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  selectedPatientId?: string;
  setSelectedPatient: (id?: string) => void;
  activeModal: ModalType | null;
  modalContext?: any;
  openModal: (m: ModalType, ctx?: any) => void;
  closeModal: () => void;
  toasts: ToastItem[];
  pushToast: (t: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;

  // ===== RBAC =====
  can: (module: Module, action: Action) => boolean;
  canView: (module: Module) => boolean;
  checkPermission: (module: Module, action: Action, opts?: { silent?: boolean }) => boolean;

  // ===== Activity log =====
  activityLog: ActivityEntry[];
  logActivity: (a: {
    action: string; category: ActivityCategory; module?: string;
    details: string; success?: boolean;
    targetRecordId?: string; targetRecordType?: string;
  }) => void;
  clearActivityLog: () => void; // super_admin only

  // ===== Theme =====
  theme: ThemePrefs;
  setTheme: (partial: Partial<ThemePrefs>) => void;

  // ===== Settings =====
  hospital: HospitalProfile;
  setHospital: (partial: Partial<HospitalProfile>) => void;
  security: SecuritySettings;
  setSecurity: (partial: Partial<SecuritySettings>) => void;
  notifications: NotificationSettings;
  setNotifications: (partial: Partial<NotificationSettings>) => void;

  // ===== Users (extended) =====
  users: SystemUserRecord[];
  addUser: (u: Omit<SystemUserRecord, "id" | "lastActive" | "avatarColor"> & Partial<Pick<SystemUserRecord, "avatarColor">>) => void;
  updateUser: (id: string, patch: Partial<SystemUserRecord>) => void;
  deleteUser: (id: string) => void;
  suspendUser: (id: string) => void;
  reactivateUser: (id: string) => void;

  // ===== Pharmacy: sales / prescriptions / stock =====
  sales: SaleRecord[];
  addSale: (s: Omit<SaleRecord, "id" | "number" | "time" | "cashier">) => SaleRecord;
  refundSale: (id: string) => void;
  liveLabOrders: LiveLabOrder[];
  addLabOrder: (o: Omit<LiveLabOrder, "id" | "number" | "date" | "status">) => void;
  updateLabOrderStatus: (id: string, status: LiveLabOrder["status"], results?: any[]) => void;
  livePrescriptions: LivePrescription[];
  addPrescription: (p: Omit<LivePrescription, "id" | "number" | "date" | "status">) => void;
  updatePrescriptionStatus: (id: string, status: LivePrescription["status"]) => void;
  liveInvoices: LiveInvoice[];
  addInvoice: (i: Omit<LiveInvoice, "id" | "number" | "date" | "status">) => void;
  payInvoice: (id: string, amount: number) => void;
  cancelInvoice: (id: string) => void;
  liveReturns: LiveReturn[];
  addReturn: (r: Omit<LiveReturn, "id" | "number" | "date" | "status">) => void;

  // ===== Patients / Appointments / Beds / Staff / Notes / Expenses =====
  livePatients: Patient[];
  addPatient: (p: Omit<Patient, "id" | "mrn" | "registeredOn" | "status" | "allergies" | "chronicConditions" | "balance" | "avatarColor"> & Partial<Patient>) => Patient;
  patientsVersion: number;
  bumpPatientsVersion: () => void;
  realPatients: Patient[] | null;
  setRealPatients: (patients: Patient[]) => void;
  appointmentsVersion: number;
  bumpAppointmentsVersion: () => void;
  opdVersion: number;
  bumpOpdVersion: () => void;
  liveAppointments: LiveAppointment[];
  addAppointment: (a: Omit<LiveAppointment, "id" | "status">) => void;
  updateAppointmentStatus: (id: string, status: LiveAppointment["status"]) => void;
  liveStaff: LiveStaff[];
  addStaff: (s: Omit<LiveStaff, "id" | "joinedOn" | "status" | "avatarColor">) => void;
  liveExpenses: LiveExpense[];
  addExpense: (e: Omit<LiveExpense, "id" | "number" | "date" | "recordedBy">) => void;
  liveNotes: LiveNote[];
  addNote: (n: Omit<LiveNote, "id" | "date" | "author">) => void;
  liveBeds: LiveBed[];
  admitPatient: (bedId: string, patientId: string, attending: string, condition: string) => void;
  dischargeBed: (bedId: string) => void;

  // ===== Suppliers =====
  suppliers: Supplier[];
  addSupplier: (s: Omit<Supplier, "id" | "accountBalance" | "rating" | "status"> & Partial<Pick<Supplier, "accountBalance" | "rating" | "status">>) => void;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  adjustSupplierBalance: (id: string, delta: number, reason: string) => void;

  // ===== Purchase Orders + Receipts =====
  purchaseOrders: PurchaseOrder[];
  createPurchaseOrder: (input: {
    supplierId: string;
    expectedDate?: string;
    notes?: string;
    items: Array<Omit<PurchaseOrderLine, "id" | "receivedQty" | "returnedQty" | "lineTotal">>;
  }) => PurchaseOrder | null;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrderStatus) => void;
  approvePurchaseOrder: (id: string) => void;
  cancelPurchaseOrder: (id: string) => void;
  receiveGoods: (input: {
    poId: string;
    items: Array<{ lineId: string; receivedQty: number; batchNo: string; expiryDate: string; }>;
    notes?: string;
  }) => GoodsReceipt | null;
  deletePurchaseOrder: (id: string) => void;

  // ===== Purchase Returns =====
  purchaseReturns: PurchaseReturn[];
  createPurchaseReturn: (input: {
    poId: string;
    items: Array<{
      poLineId: string;
      returnQty: number;
      reason: ReturnReason;
      notes?: string;
    }>;
    notes?: string;
  }) => PurchaseReturn | null;
  approvePurchaseReturn: (id: string) => void;
  rejectPurchaseReturn: (id: string) => void;
  completePurchaseReturn: (id: string) => void;
  cancelPurchaseReturn: (id: string) => void;
  deletePurchaseReturn: (id: string) => void;

  // ===== Medicine batches (inventory traceability) =====
  medicineBatches: MedicineBatch[];
  medicineStock: Record<string, number>;
  restockMedicine: (medicineId: string, qty: number, batch?: string, expiryDate?: string, unitCost?: number, poNumber?: string, supplierId?: string) => void;
  dispenseMedicine: (medicineId: string, qty: number) => boolean;
  adjustMedicineStock: (medicineId: string, newQty: number, reason: string) => void;
  expireBatches: () => void; // mark batches past expiry as expired / 0 qty

  // ===== Blood Bank =====
  bloodBags: BloodBag[];
  bloodDonors: BloodDonor[];
  bloodTransfusions: BloodTransfusion[];
  addBloodDonor: (d: Omit<BloodDonor, "id" | "totalDonations" | "status" | "avatarColor"> & Partial<Pick<BloodDonor, "totalDonations" | "status" | "avatarColor">>) => void;
  updateBloodDonor: (id: string, patch: Partial<BloodDonor>) => void;
  recordDonation: (input: {
    donorId: string; bloodType: BloodType; component: BloodComponent;
    volume: number; location: string; notes?: string;
  }) => BloodBag | null;
  discardBloodBag: (id: string, reason: string) => void;
  createTransfusion: (input: {
    patientId: string; patientBloodType: BloodType; requiredBloodType: BloodType;
    component: BloodComponent; units: number; bagIds: string[];
    orderedBy: string; performedBy: string; crossMatchedBy: string;
    notes?: string;
  }) => BloodTransfusion | null;
  updateTransfusionStatus: (id: string, status: BloodTransfusion["status"], reactions?: string) => void;
}

// ============================================================================
// Seed data
// ============================================================================
const SEED_BEDS: LiveBed[] = [
  { id: "b1", bedNumber: "ICU-01", ward: "ICU", type: "ICU", status: "occupied", patientId: "p1", patientName: "Michael Foster", admittedOn: "2026-07-18", attending: "Dr. Sarah Chen", condition: "stable" },
  { id: "b2", bedNumber: "ICU-02", ward: "ICU", type: "ICU", status: "available" },
  { id: "b3", bedNumber: "ICU-03", ward: "ICU", type: "ICU", status: "occupied", patientId: "p4", patientName: "Isabella Romano", admittedOn: "2026-07-19", attending: "Dr. Sarah Chen", condition: "critical" },
  { id: "b4", bedNumber: "ICU-04", ward: "ICU", type: "ICU", status: "cleaning" },
  { id: "b5", bedNumber: "WD-A-01", ward: "General Ward A", type: "General", status: "occupied", patientId: "p7", patientName: "Liam Patel", admittedOn: "2026-07-17", attending: "Dr. Marcus Reed", condition: "stable" },
  { id: "b6", bedNumber: "WD-A-02", ward: "General Ward A", type: "General", status: "available" },
  { id: "b7", bedNumber: "WD-A-03", ward: "General Ward A", type: "General", status: "available" },
  { id: "b8", bedNumber: "WD-A-04", ward: "General Ward A", type: "General", status: "maintenance" },
  { id: "b9", bedNumber: "WD-B-01", ward: "General Ward B", type: "General", status: "available" },
  { id: "b10", bedNumber: "WD-B-02", ward: "General Ward B", type: "General", status: "available" },
  { id: "b11", bedNumber: "PED-01", ward: "Pediatric", type: "General", status: "available" },
  { id: "b12", bedNumber: "MAT-01", ward: "Maternity", type: "Private", status: "available" },
];

const AVATAR_COLORS = [
  "oklch(0.62 0.14 200)", "oklch(0.62 0.14 155)", "oklch(0.65 0.16 280)",
  "oklch(0.72 0.17 75)", "oklch(0.62 0.20 15)", "oklch(0.58 0.15 230)",
  "oklch(0.65 0.14 100)", "oklch(0.62 0.18 320)",
];

// Seed users (extended)
const SEED_USERS: SystemUserRecord[] = [
  { id: "u1", name: "James Whitfield", email: "j.whitfield@medicore.io", role: "admin", status: "active", lastActive: "5 min ago", twoFactor: true, avatarColor: AVATAR_COLORS[0]!, department: "Administration" },
  { id: "u2", name: "Dr. Sarah Chen", email: "s.chen@medicore.io", role: "doctor", status: "active", lastActive: "2 min ago", twoFactor: true, avatarColor: AVATAR_COLORS[1]!, department: "Cardiology" },
  { id: "u3", name: "Olivia Brown", email: "o.brown@medicore.io", role: "nurse", status: "active", lastActive: "12 min ago", twoFactor: false, avatarColor: AVATAR_COLORS[2]!, department: "ICU" },
  { id: "u4", name: "Emma Wilson", email: "e.wilson@medicore.io", role: "receptionist", status: "active", lastActive: "Just now", twoFactor: false, avatarColor: AVATAR_COLORS[3]!, department: "Front Desk" },
  { id: "u5", name: "David Kim", email: "d.kim@medicore.io", role: "pharmacy_manager", status: "active", lastActive: "8 min ago", twoFactor: true, avatarColor: AVATAR_COLORS[4]!, department: "Pharmacy" },
  { id: "u6", name: "Marcus Lee", email: "m.lee@medicore.io", role: "lab_staff", status: "active", lastActive: "20 min ago", twoFactor: false, avatarColor: AVATAR_COLORS[5]!, department: "Laboratory" },
  { id: "u7", name: "Dr. Aisha Patel", email: "a.patel@medicore.io", role: "radiologist", status: "active", lastActive: "1 hr ago", twoFactor: true, avatarColor: AVATAR_COLORS[6]!, department: "Radiology" },
  { id: "u8", name: "Robert Garcia", email: "r.garcia@medicore.io", role: "accountant", status: "active", lastActive: "3 hr ago", twoFactor: true, avatarColor: AVATAR_COLORS[7]!, department: "Finance" },
  { id: "u9", name: "Linda Martinez", email: "l.martinez@medicore.io", role: "inventory_staff", status: "active", lastActive: "1 hr ago", twoFactor: false, avatarColor: AVATAR_COLORS[0]!, department: "Inventory" },
  { id: "u10", name: "Dr. Hassan Ali", email: "h.ali@medicore.io", role: "dentist", status: "active", lastActive: "Just now", twoFactor: true, avatarColor: AVATAR_COLORS[4]!, department: "Dental" },
  { id: "u11", name: "Nadia Petrova", email: "n.petrova@medicore.io", role: "pharmacist", status: "active", lastActive: "30 min ago", twoFactor: false, avatarColor: AVATAR_COLORS[5]!, department: "Pharmacy" },
  { id: "u12", name: "Carlos Reyes", email: "c.reyes@medicore.io", role: "storekeeper", status: "active", lastActive: "15 min ago", twoFactor: false, avatarColor: AVATAR_COLORS[2]!, department: "Warehouse" },
];

// Seed medicine batches from MEDICINES (one batch each, with current stock)
function seedMedicineBatches(): MedicineBatch[] {
  return MEDICINES.map((m) => ({
    id: `mb-${m.id}`,
    medicineId: m.id,
    batchNo: m.batch,
    expiryDate: m.expiry,
    receivedQty: m.stock,
    currentQty: m.stock,
    unitCost: Math.round(m.price * 0.6 * 100) / 100, // estimated cost = 60% of retail
    receivedDate: "2026-06-15",
  }));
}

// Seed one fully-received purchase order for context
function seedPurchaseOrders(): PurchaseOrder[] {
  const po1: PurchaseOrder = {
    id: "po-seed-1",
    number: "PO-2026-0042",
    supplierId: "sup1",
    supplierName: "PharmaCorp Inc.",
    date: "2026-07-05",
    expectedDate: "2026-07-12",
    status: "fully_received",
    items: [
      { id: "pol-1", medicineId: "m1", name: "Amoxicillin 500mg", batchNo: "AMX-2401", expiryDate: "2027-03-15", orderedQty: 1000, freeQty: 100, receivedQty: 1100, returnedQty: 0, unitCost: 0.27, discountPct: 5, taxPct: 0, lineTotal: computeLineTotal(1000, 100, 0.27, 5, 0), notes: "Standard order" },
    ],
    subtotal: 297, discountTotal: 14.85, taxTotal: 0, total: 282.15,
    notes: "Quarterly antibiotic restock",
    createdBy: "David Kim",
    approvedBy: "James Whitfield",
    createdAt: "2026-07-05T09:00:00Z",
    approvedAt: "2026-07-05T11:00:00Z",
    receipts: [{
      id: "gr-1", number: "GRN-2026-0001", poId: "po-seed-1", poNumber: "PO-2026-0042",
      supplierId: "sup1", supplierName: "PharmaCorp Inc.",
      receivedBy: "Linda Martinez", receivedAt: "2026-07-12T10:30:00Z",
      items: [{ lineId: "pol-1", medicineId: "m1", name: "Amoxicillin 500mg", receivedQty: 1100, batchNo: "AMX-2401", expiryDate: "2027-03-15" }],
      notes: "Full delivery received in good condition",
    }],
  };
  const po2: PurchaseOrder = {
    id: "po-seed-2",
    number: "PO-2026-0043",
    supplierId: "sup2",
    supplierName: "GlobePharma Ltd.",
    date: "2026-07-15",
    expectedDate: "2026-07-22",
    status: "partially_received",
    items: [
      { id: "pol-2", medicineId: "m5", name: "Paracetamol 500mg", batchNo: "PAR-2410", expiryDate: "2028-01-25", orderedQty: 2000, freeQty: 200, receivedQty: 1100, returnedQty: 0, unitCost: 0.03, discountPct: 0, taxPct: 0, lineTotal: computeLineTotal(2000, 200, 0.03, 0, 0) },
      { id: "pol-3", medicineId: "m9", name: "Cetirizine 10mg", batchNo: "CET-2408", expiryDate: "2027-08-15", orderedQty: 500, freeQty: 50, receivedQty: 0, returnedQty: 0, unitCost: 0.05, discountPct: 0, taxPct: 0, lineTotal: computeLineTotal(500, 50, 0.05, 0, 0) },
    ],
    subtotal: 92.5, discountTotal: 0, taxTotal: 0, total: 92.5,
    notes: "Partial delivery expected",
    createdBy: "David Kim",
    approvedBy: "James Whitfield",
    createdAt: "2026-07-15T10:00:00Z",
    approvedAt: "2026-07-15T14:00:00Z",
    receipts: [{
      id: "gr-2", number: "GRN-2026-0002", poId: "po-seed-2", poNumber: "PO-2026-0043",
      supplierId: "sup2", supplierName: "GlobePharma Ltd.",
      receivedBy: "Carlos Reyes", receivedAt: "2026-07-18T09:00:00Z",
      items: [{ lineId: "pol-2", medicineId: "m5", name: "Paracetamol 500mg", receivedQty: 1100, batchNo: "PAR-2410", expiryDate: "2028-01-25" }],
      notes: "Cetirizine back-ordered, expected next week",
    }],
  };
  const po3: PurchaseOrder = {
    id: "po-seed-3",
    number: "PO-2026-0044",
    supplierId: "sup5",
    supplierName: "DiabeCare Products",
    date: "2026-07-19",
    expectedDate: "2026-07-26",
    status: "pending",
    items: [
      { id: "pol-4", medicineId: "m8", name: "Insulin Glargine", batchNo: "INS-2404", expiryDate: "2026-10-30", orderedQty: 100, freeQty: 0, receivedQty: 0, returnedQty: 0, unitCost: 22.00, discountPct: 3, taxPct: 0, lineTotal: computeLineTotal(100, 0, 22.0, 3, 0) },
    ],
    subtotal: 2200, discountTotal: 66, taxTotal: 0, total: 2134,
    notes: "Awaiting approval — insulin critical stock",
    createdBy: "David Kim",
    createdAt: "2026-07-19T08:00:00Z",
    receipts: [],
  };
  return [po3, po2, po1];
}

function seedPurchaseReturns(): PurchaseReturn[] {
  return [{
    id: "pr-seed-1",
    number: "PR-2026-0007",
    poId: "po-seed-1",
    poNumber: "PO-2026-0042",
    supplierId: "sup1",
    supplierName: "PharmaCorp Inc.",
    date: "2026-07-15",
    status: "completed",
    items: [{
      id: "prl-1", poLineId: "pol-1", medicineId: "m1", name: "Amoxicillin 500mg",
      batchNo: "AMX-2401", expiryDate: "2027-03-15",
      receivedQty: 1100, returnedBefore: 0, returnQty: 50,
      unitCost: 0.27, lineTotal: 13.5,
      reason: "damaged", notes: "50 capsules with crushed packaging",
    }],
    totalCredit: 13.5,
    reason: "damaged",
    notes: "Damaged in transit — credit memo requested",
    createdBy: "Linda Martinez",
    approvedBy: "James Whitfield",
    createdAt: "2026-07-14T10:00:00Z",
    approvedAt: "2026-07-15T09:00:00Z",
    completedAt: "2026-07-16T11:00:00Z",
  }];
}

// Initial activity log seed
function seedActivityLog(): ActivityEntry[] {
  const now = new Date("2026-07-20T08:00:00Z");
  return [
    { id: uid("act"), timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), user: "James Whitfield", role: "admin", action: "Approved purchase order", category: "purchase", module: "purchases", targetRecordId: "po-seed-3", targetRecordType: "PurchaseOrder", details: "Approved PO-2026-0044 (DiabeCare Products, $2,134.00)", success: true },
    { id: uid("act"), timestamp: new Date(now.getTime() - 1000 * 60 * 90).toISOString(), user: "Linda Martinez", role: "inventory_staff", action: "Received goods", category: "purchase", module: "purchases", targetRecordId: "gr-2", targetRecordType: "GoodsReceipt", details: "Received GRN-2026-0002 (1100/2200 units)", success: true },
    { id: uid("act"), timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(), user: "Linda Martinez", role: "inventory_staff", action: "Created purchase return", category: "purchase_return", module: "purchase_returns", targetRecordId: "pr-seed-1", targetRecordType: "PurchaseReturn", details: "Returned 50 units of Amoxicillin (damaged)", success: true },
    { id: uid("act"), timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 8).toISOString(), user: "David Kim", role: "pharmacy_manager", action: "Created purchase order", category: "purchase", module: "purchases", targetRecordId: "po-seed-3", targetRecordType: "PurchaseOrder", details: "Created PO-2026-0044 (DiabeCare Products, $2,134.00)", success: true },
    { id: uid("act"), timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(), user: "System", role: "system", action: "Automatic task completed", category: "system", module: "settings", details: "Scheduled system task completed", success: true },
    { id: uid("act"), timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(), user: "Marcus Lee", role: "lab_staff", action: "Verified lab result", category: "lab", module: "lab", targetRecordId: "l5", targetRecordType: "LabOrder", details: "Verified Chest X-Ray for Liam Patel", success: true },
  ];
}

// ============================================================================
// STORE
// ============================================================================
export const useAppStore = create<AppState>((set, get) => ({
  // ===== Auth / UI =====
  authenticated: false,
  user: null,
  failedLoginAttempts: 0,
  setSessionUser: (sessionUser) => {
    set({ authenticated: true, user: sessionUser, failedLoginAttempts: 0 });
    get().logActivity({
      action: "Signed in",
      category: "auth",
      module: "auth",
      details: `${sessionUser.name} signed in`,
      success: true,
    });
  },
  logout: () => {
    const u = get().user;
    if (u) {
      get().logActivity({
        action: "Signed out",
        category: "auth",
        module: "auth",
        details: `${u.name} signed out`,
        success: true,
      });
    }
    set({ authenticated: false, user: null, currentPage: "dashboard", pageInitialized: false });
  },
  currentPage: "dashboard",
  pageInitialized: false,
  pageParam: undefined,
  setPage: (page, param) => set({ currentPage: page, pageInitialized: true, pageParam: param }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  mobileSidebarOpen: false,
  setMobileSidebar: (v) => set({ mobileSidebarOpen: v }),
  commandOpen: false,
  setCommandOpen: (v) => set({ commandOpen: v }),
  notificationsRead: new Set<string>(),
  markNotificationRead: (id) => set((s) => {
    const n = new Set(s.notificationsRead);
    n.add(id);
    return { notificationsRead: n };
  }),
  markAllNotificationsRead: () => set(() => ({ notificationsRead: new Set(["all"]) })),
  selectedPatientId: undefined,
  setSelectedPatient: (id) => set({ selectedPatientId: id }),
  activeModal: null,
  modalContext: undefined,
  openModal: (m, ctx) => set({ activeModal: m, modalContext: ctx }),
  closeModal: () => set({ activeModal: null, modalContext: undefined }),
  toasts: [],
  pushToast: (t) => {
    toastSeq++;
    const id = `t${Date.now()}-${toastSeq}`;
    set((s) => ({ toasts: [...s.toasts, { id, ...t }] }));
    if (typeof window !== "undefined") window.setTimeout(() => get().dismissToast(id), 4000);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // ===== RBAC =====
  can: (module, action) => {
    const u = get().user;
    if (!u) return false;
    return rbacCan(u.role, module, action);
  },
  canView: (module) => {
    const u = get().user;
    if (!u) return false;
    return rbacCan(u.role, module, "view");
  },
  checkPermission: (module, action, opts) => {
    const u = get().user;
    const allowed = u ? rbacCan(u.role, module, action) : false;
    if (!allowed && !opts?.silent) {
      get().logActivity({
        action: `Permission denied: ${action} on ${module}`,
        category: "permission",
        module,
        details: `User ${u?.name ?? "anonymous"} attempted ${action} on ${module} but was denied`,
        success: false,
      });
      get().pushToast({
        title: "Access denied",
        description: `You do not have permission to ${action} in this module.`,
        variant: "danger",
      });
    }
    return allowed;
  },

  // ===== Activity log =====
  activityLog: seedActivityLog(),
  logActivity: (a) => {
    activitySeq++;
    const u = get().user;
    const entry: ActivityEntry = {
      id: uid("act"),
      timestamp: new Date().toISOString(),
      user: u?.name ?? "System",
      role: u?.role ? toExtendedRole(u.role as ExtendedRole) : "system",
      action: a.action,
      category: a.category,
      module: a.module ?? a.category,
      details: a.details,
      success: a.success ?? true,
      targetRecordId: a.targetRecordId,
      targetRecordType: a.targetRecordType,
      ipAddress: "127.0.0.1",
    };
    set((s) => ({ activityLog: [entry, ...s.activityLog].slice(0, 5000) }));
  },
  clearActivityLog: () => {
    if (!get().can("activity_log", "manage")) {
      get().pushToast({ title: "Access denied", description: "Only administrators can clear audit logs.", variant: "danger" });
      return;
    }
    set({ activityLog: [] });
    get().logActivity({ action: "Cleared activity log", category: "system", module: "activity_log", details: "All activity log entries were cleared", success: true });
  },

  // ===== Theme =====
  theme: (typeof window !== "undefined" ? readLS<ThemePrefs>("medicore-theme") : null) ?? DEFAULT_THEME,
  setTheme: (partial) => {
    set((s) => {
      const next = { ...s.theme, ...partial };
      writeLS("medicore-theme", next);
      return { theme: next };
    });
  },

  // ===== Settings =====
  hospital: DEFAULT_HOSPITAL,
  setHospital: (partial) => {
    set((s) => ({ hospital: { ...s.hospital, ...partial } }));
    get().logActivity({ action: "Updated hospital profile", category: "settings", module: "settings", details: `Updated: ${Object.keys(partial).join(", ")}`, success: true });
  },
  security: {
    twoFactorRequired: true,
    sessionTimeoutMin: 30,
    strongPasswordRequired: true,
    ipWhitelistEnabled: false,
    geoBlockingEnabled: true,
    auditLoggingEnabled: true,
  },
  setSecurity: (partial) => {
    set((s) => ({ security: { ...s.security, ...partial } }));
    get().logActivity({ action: "Updated security settings", category: "settings", module: "settings", details: `Updated: ${Object.keys(partial).join(", ")}`, success: true });
  },
  notifications: {
    criticalPatientAlerts: true,
    lowStockWarnings: true,
    newAppointments: false,
    paymentReceipts: true,
    labResultsReady: true,
    staffScheduleChanges: false,
  },
  setNotifications: (partial) => {
    set((s) => ({ notifications: { ...s.notifications, ...partial } }));
    get().logActivity({ action: "Updated notification preferences", category: "settings", module: "settings", details: `Updated: ${Object.keys(partial).join(", ")}`, success: true });
  },

  // ===== Users =====
  users: SEED_USERS,
  addUser: (u) => {
    if (!get().can("users", "create")) {
      get().pushToast({ title: "Access denied", description: "You cannot create users.", variant: "danger" });
      return;
    }
    userSeq++;
    const newUser: SystemUserRecord = {
      ...u,
      id: uid("usr"),
      lastActive: "Never",
      avatarColor: u.avatarColor ?? AVATAR_COLORS[userSeq % AVATAR_COLORS.length]!,
    };
    set((s) => ({ users: [newUser, ...s.users] }));
    get().logActivity({ action: "Created user", category: "user", module: "users", targetRecordId: newUser.id, targetRecordType: "User", details: `Created ${newUser.name} (${newUser.role})`, success: true });
    get().pushToast({ title: "User created", description: `${newUser.name} added successfully`, variant: "success" });
  },
  updateUser: (id, patch) => {
    if (!get().can("users", "edit")) {
      get().pushToast({ title: "Access denied", description: "You cannot edit users.", variant: "danger" });
      return;
    }
    set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, ...patch } : u) }));
    const u = get().users.find((x) => x.id === id);
    get().logActivity({ action: "Updated user", category: "user", module: "users", targetRecordId: id, targetRecordType: "User", details: `Updated ${u?.name ?? id}: ${Object.keys(patch).join(", ")}`, success: true });
    get().pushToast({ title: "User updated", description: `${u?.name} updated successfully`, variant: "success" });
  },
  deleteUser: (id) => {
    if (!get().can("users", "delete")) {
      get().pushToast({ title: "Access denied", description: "You cannot delete users.", variant: "danger" });
      return;
    }
    const u = get().users.find((x) => x.id === id);
    set((s) => ({ users: s.users.filter((x) => x.id !== id) }));
    get().logActivity({ action: "Deleted user", category: "user", module: "users", targetRecordId: id, targetRecordType: "User", details: `Deleted ${u?.name ?? id}`, success: true });
    get().pushToast({ title: "User deleted", description: `${u?.name} has been removed`, variant: "warning" });
  },
  suspendUser: (id) => {
    if (!get().can("users", "edit")) return;
    set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, status: "suspended" } : u) }));
    const u = get().users.find((x) => x.id === id);
    get().logActivity({ action: "Suspended user", category: "user", module: "users", targetRecordId: id, targetRecordType: "User", details: `Suspended ${u?.name}`, success: true });
    get().pushToast({ title: "User suspended", description: `${u?.name} has been suspended`, variant: "warning" });
  },
  reactivateUser: (id) => {
    if (!get().can("users", "edit")) return;
    set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, status: "active" } : u) }));
    const u = get().users.find((x) => x.id === id);
    get().logActivity({ action: "Reactivated user", category: "user", module: "users", targetRecordId: id, targetRecordType: "User", details: `Reactivated ${u?.name}`, success: true });
    get().pushToast({ title: "User reactivated", description: `${u?.name} is now active`, variant: "success" });
  },

  // ===== Sales / Lab / Prescriptions / Invoices =====
  sales: [],
  addSale: (s) => {
    saleSeq++;
    const r: SaleRecord = {
      ...s,
      id: uid("sale"),
      number: `POS-2026-${String(saleSeq).padStart(4, "0")}`,
      cashier: get().user?.name ?? CURRENT_USER.name,
      time: new Date().toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
    };
    set((st) => ({ sales: [r, ...st.sales] }));
    // Decrement medicine stock
    s.items.forEach((it) => get().dispenseMedicine(it.medicineId, it.qty));
    get().addInvoice({
      patientName: s.customer,
      mrn: "Walk-in",
      amount: s.total,
      paid: s.total,
      department: "Pharmacy",
      items: s.items.map((i) => ({ description: `${i.name} x${i.qty}`, qty: i.qty, rate: i.price, total: i.price * i.qty })),
      source: "Pharmacy",
      serviceType: "Pharmacy",
    });
    get().logActivity({
      action: "Recorded pharmacy sale",
      category: "pharmacy",
      module: "pharmacy",
      targetRecordId: r.id,
      targetRecordType: "Sale",
      details: `${r.number} — ${s.customer} — $${s.total.toFixed(2)}`,
      success: true,
    });
    return r;
  },
  refundSale: (id) => {
    set((s) => ({ sales: s.sales.map((sl) => sl.id === id ? { ...sl, refunded: true } : sl) }));
    const sale = get().sales.find((s) => s.id === id);
    get().logActivity({ action: "Refunded sale", category: "pharmacy", module: "pharmacy", targetRecordId: id, targetRecordType: "Sale", details: `Refunded ${sale?.number}`, success: true });
  },
  liveLabOrders: [],
  addLabOrder: (o) => {
    labSeq++;
    set((s) => ({ liveLabOrders: [{ ...o, id: uid("lab"), number: `LAB-2026-${String(labSeq).padStart(4, "0")}`, date: new Date().toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }), status: "pending" }, ...s.liveLabOrders] }));
    get().logActivity({ action: "Created lab order", category: "lab", module: "lab", details: `Ordered ${o.tests.length} test(s) for ${o.patientName}`, success: true });
  },
  updateLabOrderStatus: (id, status, results) => {
    set((s) => ({ liveLabOrders: s.liveLabOrders.map((o) => o.id === id ? { ...o, status, resultReady: status === "verified", results: results ?? o.results } : o) }));
    const o = get().liveLabOrders.find((x) => x.id === id);
    get().logActivity({ action: `Lab order ${status.replace("_", " ")}`, category: "lab", module: "lab", targetRecordId: id, targetRecordType: "LabOrder", details: `${o?.number} — ${o?.patientName}`, success: true });
  },
  livePrescriptions: [],
  addPrescription: (p) => {
    rxSeq++;
    set((s) => ({ livePrescriptions: [{ ...p, id: uid("rx"), number: `RX-2026-${String(rxSeq).padStart(4, "0")}`, date: new Date().toLocaleDateString(), status: "pending" }, ...s.livePrescriptions] }));
    get().logActivity({ action: "Created prescription", category: "pharmacy", module: "pharmacy", details: `${p.items.length} item(s) for ${p.patientName}`, success: true });
  },
  updatePrescriptionStatus: (id, status) => {
    set((s) => ({ livePrescriptions: s.livePrescriptions.map((p) => p.id === id ? { ...p, status } : p) }));
    const p = get().livePrescriptions.find((x) => x.id === id);
    get().logActivity({ action: `Prescription ${status}`, category: "pharmacy", module: "pharmacy", targetRecordId: id, targetRecordType: "Prescription", details: `${p?.number} — ${p?.patientName}`, success: true });
  },
  liveInvoices: [],
  addInvoice: (i) => {
    invSeq++;
    set((s) => ({ liveInvoices: [{ ...i, id: uid("inv"), number: `INV-2026-${String(invSeq).padStart(4, "0")}`, date: new Date().toLocaleDateString(), status: i.paid >= i.amount ? "paid" : i.paid > 0 ? "partial" : "unpaid" }, ...s.liveInvoices] }));
  },
  payInvoice: (id, amount) => {
    set((s) => ({ liveInvoices: s.liveInvoices.map((inv) => {
      if (inv.id === id) {
        const np = inv.paid + amount;
        return { ...inv, paid: np, status: np >= inv.amount ? "paid" : "partial" };
      }
      return inv;
    }) }));
    const inv = get().liveInvoices.find((x) => x.id === id);
    get().logActivity({ action: "Recorded payment", category: "payment", module: "billing", targetRecordId: id, targetRecordType: "Invoice", details: `Payment of $${amount.toFixed(2)} on ${inv?.number}`, success: true });
  },
  cancelInvoice: (id) => {
    set((s) => ({ liveInvoices: s.liveInvoices.filter((inv) => inv.id !== id) }));
    get().logActivity({ action: "Cancelled invoice", category: "billing", module: "billing", targetRecordId: id, targetRecordType: "Invoice", details: `Invoice ${id} cancelled`, success: true });
  },
  liveReturns: [],
  addReturn: (r) => {
    retSeq++;
    set((s) => ({ liveReturns: [{ ...r, id: uid("ret"), number: `RET-2026-${String(retSeq).padStart(4, "0")}`, date: new Date().toLocaleDateString(), status: "processed" }, ...s.liveReturns] }));
    get().logActivity({ action: "Processed sale return", category: "billing", module: "billing", details: `Return for ${r.saleNumber} — $${r.amount.toFixed(2)}`, success: true });
  },

  // ===== Patients / Appointments / Beds / Staff / Notes / Expenses =====
  livePatients: [],
  addPatient: (p) => {
    patSeq++;
    const newP: Patient = {
      id: uid("pat"),
      mrn: `MRN-2026-${String(patSeq).padStart(4, "0")}`,
      registeredOn: new Date().toISOString().slice(0, 10),
      status: "active",
      allergies: p.allergies ?? [],
      chronicConditions: p.chronicConditions ?? [],
      balance: 0,
      avatarColor: AVATAR_COLORS[patSeq % AVATAR_COLORS.length]!,
      ...p,
    } as Patient;
    set((s) => ({ livePatients: [newP, ...s.livePatients] }));
    get().logActivity({ action: "Registered new patient", category: "patient", module: "patients", targetRecordId: newP.id, targetRecordType: "Patient", details: `${newP.name} (${newP.mrn})`, success: true });
    return newP;
  },
  patientsVersion: 0,
  bumpPatientsVersion: () => set((s) => ({ patientsVersion: s.patientsVersion + 1 })),
  realPatients: null,
  setRealPatients: (patients) => set({ realPatients: patients }),
  appointmentsVersion: 0,
  bumpAppointmentsVersion: () => set((s) => ({ appointmentsVersion: s.appointmentsVersion + 1 })),
  opdVersion: 0,
  bumpOpdVersion: () => set((s) => ({ opdVersion: s.opdVersion + 1 })),
  liveAppointments: [],
  addAppointment: (a) => {
    aptSeq++;
    set((s) => ({ liveAppointments: [{ ...a, id: uid("apt"), status: "scheduled" }, ...s.liveAppointments] }));
    get().logActivity({ action: "Created appointment", category: "appointment", module: "appointments", details: `${a.patientName} with ${a.doctorName}`, success: true });
  },
  updateAppointmentStatus: (id, status) => {
    set((s) => ({ liveAppointments: s.liveAppointments.map((a) => a.id === id ? { ...a, status } : a) }));
    const a = get().liveAppointments.find((x) => x.id === id);
    get().logActivity({ action: `Appointment ${status}`, category: "appointment", module: "appointments", targetRecordId: id, targetRecordType: "Appointment", details: `${a?.patientName} — ${status}`, success: true });
  },
  liveStaff: [],
  addStaff: (s) => {
    staffSeq++;
    const newS: LiveStaff = {
      ...s,
      id: uid("staff"),
      joinedOn: new Date().toISOString().slice(0, 10),
      status: "active",
      avatarColor: AVATAR_COLORS[staffSeq % AVATAR_COLORS.length]!,
    };
    set((st) => ({ liveStaff: [newS, ...st.liveStaff] }));
    get().logActivity({ action: "Added staff member", category: "user", module: "hr", targetRecordId: newS.id, targetRecordType: "Staff", details: `${newS.name} (${newS.role})`, success: true });
  },
  liveExpenses: [],
  addExpense: (e) => {
    expSeq++;
    set((s) => ({ liveExpenses: [{ ...e, id: uid("exp"), number: `EXP-2026-${String(expSeq).padStart(4, "0")}`, date: new Date().toLocaleDateString(), recordedBy: get().user?.name ?? CURRENT_USER.name }, ...s.liveExpenses] }));
    get().logActivity({ action: "Recorded expense", category: "finance", module: "finance", details: `${e.category} — $${e.amount.toFixed(2)}`, success: true });
  },
  liveNotes: [],
  addNote: (n) => {
    noteSeq++;
    set((s) => ({ liveNotes: [{ ...n, id: uid("note"), date: new Date().toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }), author: get().user?.name ?? CURRENT_USER.name }, ...s.liveNotes] }));
    get().logActivity({ action: `Added ${n.type} note`, category: "emr", module: "emr", targetRecordId: n.patientId, targetRecordType: "Patient", details: `Note for ${n.patientName}`, success: true });
  },
  liveBeds: SEED_BEDS,
  admitPatient: (bedId, patientId, attending, condition) => set((s) => {
    const p = [...PATIENTS, ...s.livePatients].find((x) => x.id === patientId);
    if (!p) return {};
    get().logActivity({ action: "Admitted patient", category: "ipd", module: "ipd", targetRecordId: bedId, targetRecordType: "Bed", details: `${p.name} → bed ${s.liveBeds.find((b) => b.id === bedId)?.bedNumber}`, success: true });
    return { liveBeds: s.liveBeds.map((b) => b.id === bedId ? { ...b, status: "occupied", patientId, patientName: p.name, admittedOn: new Date().toISOString().slice(0, 10), attending, condition } : b) };
  }),
  dischargeBed: (bedId) => set((s) => {
    const bed = s.liveBeds.find((b) => b.id === bedId);
    if (bed?.patientName) get().logActivity({ action: "Discharged patient", category: "ipd", module: "ipd", targetRecordId: bedId, targetRecordType: "Bed", details: `${bed.patientName} discharged from ${bed.bedNumber}`, success: true });
    return { liveBeds: s.liveBeds.map((b) => b.id === bedId ? { ...b, status: "cleaning", patientId: undefined, patientName: undefined, admittedOn: undefined, attending: undefined, condition: undefined } : b) };
  }),

  // ===== Suppliers =====
  suppliers: [...SUPPLIERS],
  addSupplier: (s) => {
    const newSup: Supplier = {
      ...s,
      id: uid("sup"),
      accountBalance: s.accountBalance ?? 0,
      rating: s.rating ?? 0,
      status: s.status ?? "active",
    };
    set((st) => ({ suppliers: [newSup, ...st.suppliers] }));
    get().logActivity({ action: "Added supplier", category: "supplier", module: "suppliers", targetRecordId: newSup.id, targetRecordType: "Supplier", details: `${newSup.name}`, success: true });
    get().pushToast({ title: "Supplier added", description: newSup.name, variant: "success" });
  },
  updateSupplier: (id, patch) => {
    set((s) => ({ suppliers: s.suppliers.map((sup) => sup.id === id ? { ...sup, ...patch } : sup) }));
    const sup = get().suppliers.find((x) => x.id === id);
    get().logActivity({ action: "Updated supplier", category: "supplier", module: "suppliers", targetRecordId: id, targetRecordType: "Supplier", details: `${sup?.name}: ${Object.keys(patch).join(", ")}`, success: true });
  },
  adjustSupplierBalance: (id, delta, reason) => {
    set((s) => ({ suppliers: s.suppliers.map((sup) => sup.id === id ? { ...sup, accountBalance: sup.accountBalance + delta } : sup) }));
    const sup = get().suppliers.find((x) => x.id === id);
    get().logActivity({ action: "Adjusted supplier balance", category: "supplier", module: "suppliers", targetRecordId: id, targetRecordType: "Supplier", details: `${sup?.name}: ${delta >= 0 ? "+" : ""}$${delta.toFixed(2)} — ${reason}`, success: true });
  },

  // ===== Purchase Orders =====
  purchaseOrders: seedPurchaseOrders(),
  createPurchaseOrder: (input) => {
    if (!get().can("purchases", "create")) {
      get().pushToast({ title: "Access denied", description: "You cannot create purchase orders.", variant: "danger" });
      return null;
    }
    poSeq++;
    const supplier = get().suppliers.find((s) => s.id === input.supplierId);
    if (!supplier) {
      get().pushToast({ title: "Invalid supplier", description: "Please select a valid supplier.", variant: "danger" });
      return null;
    }
    if (!input.items.length) {
      get().pushToast({ title: "Empty order", description: "Add at least one line item.", variant: "danger" });
      return null;
    }
    const items: PurchaseOrderLine[] = input.items.map((it) => {
      const lineTotal = computeLineTotal(it.orderedQty, it.freeQty, it.unitCost, it.discountPct, it.taxPct);
      return {
        id: uid("pol"),
        ...it,
        receivedQty: 0,
        returnedQty: 0,
        lineTotal,
      };
    });
    const totals = computePoTotals(items);
    const po: PurchaseOrder = {
      id: uid("po"),
      number: `PO-2026-${String(1045 + poSeq).padStart(4, "0")}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      date: new Date().toISOString().slice(0, 10),
      expectedDate: input.expectedDate,
      status: "pending",
      items,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
      notes: input.notes,
      createdBy: get().user?.name ?? CURRENT_USER.name,
      createdAt: new Date().toISOString(),
      receipts: [],
    };
    set((s) => ({ purchaseOrders: [po, ...s.purchaseOrders] }));
    get().logActivity({ action: "Created purchase order", category: "purchase", module: "purchases", targetRecordId: po.id, targetRecordType: "PurchaseOrder", details: `${po.number} — ${supplier.name} — $${po.total.toFixed(2)}`, success: true });
    get().pushToast({ title: "Purchase order created", description: `${po.number} (${po.status})`, variant: "success" });
    return po;
  },
  updatePurchaseOrderStatus: (id, status) => {
    set((s) => ({ purchaseOrders: s.purchaseOrders.map((p) => p.id === id ? { ...p, status } : p) }));
    const po = get().purchaseOrders.find((x) => x.id === id);
    get().logActivity({ action: `PO status → ${status}`, category: "purchase", module: "purchases", targetRecordId: id, targetRecordType: "PurchaseOrder", details: `${po?.number} now ${status}`, success: true });
  },
  approvePurchaseOrder: (id) => {
    if (!get().can("purchases", "approve")) {
      get().pushToast({ title: "Access denied", description: "You cannot approve purchase orders.", variant: "danger" });
      return;
    }
    set((s) => ({
      purchaseOrders: s.purchaseOrders.map((p) => p.id === id ? {
        ...p,
        status: p.status === "pending" ? "approved" : p.status,
        approvedBy: get().user?.name ?? CURRENT_USER.name,
        approvedAt: new Date().toISOString(),
      } : p),
    }));
    const po = get().purchaseOrders.find((x) => x.id === id);
    get().logActivity({ action: "Approved purchase order", category: "purchase", module: "purchases", targetRecordId: id, targetRecordType: "PurchaseOrder", details: `${po?.number} approved by ${po?.approvedBy}`, success: true });
    get().pushToast({ title: "PO approved", description: po?.number, variant: "success" });
  },
  cancelPurchaseOrder: (id) => {
    set((s) => ({ purchaseOrders: s.purchaseOrders.map((p) => p.id === id && (p.status === "pending" || p.status === "approved" || p.status === "ordered") ? { ...p, status: "cancelled" } : p) }));
    const po = get().purchaseOrders.find((x) => x.id === id);
    if (po && po.status === "cancelled") {
      get().logActivity({ action: "Cancelled purchase order", category: "purchase", module: "purchases", targetRecordId: id, targetRecordType: "PurchaseOrder", details: `${po.number} cancelled`, success: true });
      get().pushToast({ title: "PO cancelled", description: po.number, variant: "warning" });
    } else {
      get().pushToast({ title: "Cannot cancel", description: "Only pending/approved/ordered POs can be cancelled.", variant: "danger" });
    }
  },
  receiveGoods: (input) => {
    if (!get().can("purchases", "receive")) {
      get().pushToast({ title: "Access denied", description: "You cannot receive goods.", variant: "danger" });
      return null;
    }
    const po = get().purchaseOrders.find((p) => p.id === input.poId);
    if (!po) {
      get().pushToast({ title: "PO not found", variant: "danger" });
      return null;
    }
    if (po.status === "cancelled") {
      get().pushToast({ title: "Cannot receive", description: "PO is cancelled.", variant: "danger" });
      return null;
    }
    if (po.status === "fully_received") {
      get().pushToast({ title: "Already received", description: "PO is fully received.", variant: "warning" });
      return null;
    }
    if (!input.items.length || input.items.every((i) => i.receivedQty <= 0)) {
      get().pushToast({ title: "Nothing to receive", description: "Enter at least one quantity > 0.", variant: "danger" });
      return null;
    }
    grSeq++;
    const receipt: GoodsReceipt = {
      id: uid("gr"),
      number: `GRN-2026-${String(1003 + grSeq).padStart(4, "0")}`,
      poId: po.id,
      poNumber: po.number,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      receivedBy: get().user?.name ?? CURRENT_USER.name,
      receivedAt: new Date().toISOString(),
      items: input.items.map((i) => {
        const line = po.items.find((l) => l.id === i.lineId)!;
        return { lineId: i.lineId, medicineId: line.medicineId, name: line.name, receivedQty: i.receivedQty, batchNo: i.batchNo, expiryDate: i.expiryDate };
      }),
      notes: input.notes,
    };

    // Update PO: increment receivedQty on each line, recompute status, push receipt
    let allFullyReceived = true;
    const updatedItems = po.items.map((line) => {
      const recv = input.items.find((i) => i.lineId === line.id);
      if (!recv || recv.receivedQty <= 0) {
        if (line.receivedQty < line.orderedQty + line.freeQty) allFullyReceived = false;
        return line;
      }
      const newReceivedQty = line.receivedQty + recv.receivedQty;
      // Prevent over-receiving
      const cappedReceived = Math.min(newReceivedQty, line.orderedQty + line.freeQty);
      if (cappedReceived < line.orderedQty + line.freeQty) allFullyReceived = false;
      // Restock inventory with the batch info
      get().restockMedicine(line.medicineId, recv.receivedQty, recv.batchNo, recv.expiryDate, line.unitCost, po.number, po.supplierId);
      return { ...line, receivedQty: cappedReceived };
    });

    // Update supplier account balance (we owe them for the received goods)
    const receivedValue = input.items.reduce((sum, i) => {
      const line = po.items.find((l) => l.id === i.lineId)!;
      return sum + i.receivedQty * line.unitCost * (1 - line.discountPct / 100) * (1 + line.taxPct / 100);
    }, 0);
    get().adjustSupplierBalance(po.supplierId, receivedValue, `Goods received: ${receipt.number}`);

    const newStatus: PurchaseOrderStatus = allFullyReceived ? "fully_received" : "partially_received";
    set((s) => ({
      purchaseOrders: s.purchaseOrders.map((p) => p.id === input.poId ? {
        ...p,
        items: updatedItems,
        status: newStatus,
        receipts: [...p.receipts, receipt],
      } : p),
    }));

    get().logActivity({
      action: "Received goods",
      category: "purchase",
      module: "purchases",
      targetRecordId: receipt.id,
      targetRecordType: "GoodsReceipt",
      details: `${receipt.number} for ${po.number} — ${input.items.reduce((s, i) => s + i.receivedQty, 0)} units received`,
      success: true,
    });
    get().pushToast({ title: "Goods received", description: `${receipt.number} — stock updated`, variant: "success" });
    return receipt;
  },
  deletePurchaseOrder: (id) => {
    if (!get().can("purchases", "delete")) {
      get().pushToast({ title: "Access denied", variant: "danger" });
      return;
    }
    const po = get().purchaseOrders.find((x) => x.id === id);
    if (po && (po.receipts.length > 0 || po.status === "fully_received" || po.status === "partially_received")) {
      get().pushToast({ title: "Cannot delete", description: "PO has receipts. Cancel instead.", variant: "danger" });
      return;
    }
    set((s) => ({ purchaseOrders: s.purchaseOrders.filter((p) => p.id !== id) }));
    get().logActivity({ action: "Deleted purchase order", category: "purchase", module: "purchases", targetRecordId: id, targetRecordType: "PurchaseOrder", details: `Deleted ${po?.number}`, success: true });
    get().pushToast({ title: "PO deleted", description: po?.number, variant: "warning" });
  },

  // ===== Purchase Returns =====
  purchaseReturns: seedPurchaseReturns(),
  createPurchaseReturn: (input) => {
    if (!get().can("purchase_returns", "create")) {
      get().pushToast({ title: "Access denied", description: "You cannot create purchase returns.", variant: "danger" });
      return null;
    }
    const po = get().purchaseOrders.find((p) => p.id === input.poId);
    if (!po) {
      get().pushToast({ title: "PO not found", variant: "danger" });
      return null;
    }
    if (!input.items.length) {
      get().pushToast({ title: "Empty return", description: "Add at least one item to return.", variant: "danger" });
      return null;
    }
    prSeq++;
    const items: PurchaseReturnLine[] = input.items.map((it) => {
      const line = po.items.find((l) => l.id === it.poLineId)!;
      const maxReturnable = line.receivedQty - line.returnedQty;
      const returnQty = Math.min(it.returnQty, maxReturnable);
      const lineTotal = returnQty * line.unitCost * (1 - line.discountPct / 100) * (1 + line.taxPct / 100);
      return {
        id: uid("prl"),
        poLineId: line.id,
        medicineId: line.medicineId,
        name: line.name,
        batchNo: line.batchNo ?? "",
        expiryDate: line.expiryDate ?? "",
        receivedQty: line.receivedQty,
        returnedBefore: line.returnedQty,
        returnQty,
        unitCost: line.unitCost,
        lineTotal: Math.round(lineTotal * 100) / 100,
        reason: it.reason,
        notes: it.notes,
      };
    });
    const totalCredit = items.reduce((s, i) => s + i.lineTotal, 0);
    const ret: PurchaseReturn = {
      id: uid("pr"),
      number: `PR-2026-${String(1008 + prSeq).padStart(4, "0")}`,
      poId: po.id,
      poNumber: po.number,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      date: new Date().toISOString().slice(0, 10),
      status: "pending_approval",
      items,
      totalCredit: Math.round(totalCredit * 100) / 100,
      reason: items[0]?.reason,
      notes: input.notes,
      createdBy: get().user?.name ?? CURRENT_USER.name,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ purchaseReturns: [ret, ...s.purchaseReturns] }));
    get().logActivity({ action: "Created purchase return", category: "purchase_return", module: "purchase_returns", targetRecordId: ret.id, targetRecordType: "PurchaseReturn", details: `${ret.number} — ${po.supplierName} — $${ret.totalCredit.toFixed(2)}`, success: true });
    get().pushToast({ title: "Return created", description: `${ret.number} awaiting approval`, variant: "success" });
    return ret;
  },
  approvePurchaseReturn: (id) => {
    if (!get().can("purchase_returns", "approve")) {
      get().pushToast({ title: "Access denied", description: "You cannot approve purchase returns.", variant: "danger" });
      return;
    }
    set((s) => ({
      purchaseReturns: s.purchaseReturns.map((r) => r.id === id && r.status === "pending_approval" ? {
        ...r,
        status: "approved",
        approvedBy: get().user?.name ?? CURRENT_USER.name,
        approvedAt: new Date().toISOString(),
      } : r),
    }));
    const r = get().purchaseReturns.find((x) => x.id === id);
    get().logActivity({ action: "Approved purchase return", category: "purchase_return", module: "purchase_returns", targetRecordId: id, targetRecordType: "PurchaseReturn", details: `${r?.number} approved`, success: true });
    get().pushToast({ title: "Return approved", description: r?.number, variant: "success" });
  },
  rejectPurchaseReturn: (id) => {
    if (!get().can("purchase_returns", "approve")) return;
    set((s) => ({ purchaseReturns: s.purchaseReturns.map((r) => r.id === id && r.status === "pending_approval" ? { ...r, status: "rejected" } : r) }));
    const r = get().purchaseReturns.find((x) => x.id === id);
    get().logActivity({ action: "Rejected purchase return", category: "purchase_return", module: "purchase_returns", targetRecordId: id, targetRecordType: "PurchaseReturn", details: `${r?.number} rejected`, success: true });
    get().pushToast({ title: "Return rejected", description: r?.number, variant: "warning" });
  },
  completePurchaseReturn: (id) => {
    if (!get().can("purchase_returns", "return")) {
      get().pushToast({ title: "Access denied", description: "You cannot complete purchase returns.", variant: "danger" });
      return;
    }
    const r = get().purchaseReturns.find((x) => x.id === id);
    if (!r) return;
    if (r.status !== "approved") {
      get().pushToast({ title: "Cannot complete", description: "Return must be approved first.", variant: "danger" });
      return;
    }
    // Deduct inventory from each line's batch (find the matching batch and decrement)
    for (const item of r.items) {
      // Find the latest batch with enough quantity for this medicine
      const batches = get().medicineBatches
        .filter((b) => b.medicineId === item.medicineId && b.currentQty > 0)
        .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)); // FEFO
      let remaining = item.returnQty;
      for (const b of batches) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, b.currentQty);
        set((s) => ({
          medicineBatches: s.medicineBatches.map((mb) => mb.id === b.id ? { ...mb, currentQty: mb.currentQty - take } : mb),
        }));
        remaining -= take;
      }
      // Recompute medicine stock
      const newStock = get().medicineBatches
        .filter((b) => b.medicineId === item.medicineId)
        .reduce((s, b) => s + b.currentQty, 0);
      set((s) => ({ medicineStock: { ...s.medicineStock, [item.medicineId]: newStock } }));
    }
    // Increase the PO line's returnedQty
    set((s) => ({
      purchaseOrders: s.purchaseOrders.map((p) => p.id === r.poId ? {
        ...p,
        items: p.items.map((line) => {
          const match = r.items.find((it) => it.poLineId === line.id);
          return match ? { ...line, returnedQty: line.returnedQty + match.returnQty } : line;
        }),
      } : p),
    }));
    // Adjust supplier balance — credit the return value (reduce what we owe)
    get().adjustSupplierBalance(r.supplierId, -r.totalCredit, `Purchase return: ${r.number}`);
    // Mark return as completed
    set((s) => ({
      purchaseReturns: s.purchaseReturns.map((ret) => ret.id === id ? { ...ret, status: "completed", completedAt: new Date().toISOString() } : ret),
    }));
    get().logActivity({
      action: "Completed purchase return",
      category: "purchase_return",
      module: "purchase_returns",
      targetRecordId: id,
      targetRecordType: "PurchaseReturn",
      details: `${r.number} — ${r.items.reduce((s, i) => s + i.returnQty, 0)} units returned, $${r.totalCredit.toFixed(2)} credit`,
      success: true,
    });
    get().pushToast({ title: "Return completed", description: `${r.number} — inventory and supplier account updated`, variant: "success" });
  },
  cancelPurchaseReturn: (id) => {
    set((s) => ({ purchaseReturns: s.purchaseReturns.map((r) => r.id === id && (r.status === "pending_approval" || r.status === "approved") ? { ...r, status: "cancelled" } : r) }));
    const r = get().purchaseReturns.find((x) => x.id === id);
    if (r && r.status === "cancelled") {
      get().logActivity({ action: "Cancelled purchase return", category: "purchase_return", module: "purchase_returns", targetRecordId: id, targetRecordType: "PurchaseReturn", details: `${r.number} cancelled`, success: true });
      get().pushToast({ title: "Return cancelled", description: r.number, variant: "warning" });
    }
  },
  deletePurchaseReturn: (id) => {
    if (!get().can("purchase_returns", "delete")) return;
    const r = get().purchaseReturns.find((x) => x.id === id);
    if (r && r.status === "completed") {
      get().pushToast({ title: "Cannot delete", description: "Completed returns cannot be deleted.", variant: "danger" });
      return;
    }
    set((s) => ({ purchaseReturns: s.purchaseReturns.filter((x) => x.id !== id) }));
    get().logActivity({ action: "Deleted purchase return", category: "purchase_return", module: "purchase_returns", targetRecordId: id, targetRecordType: "PurchaseReturn", details: `Deleted ${r?.number}`, success: true });
    get().pushToast({ title: "Return deleted", description: r?.number, variant: "warning" });
  },

  // ===== Medicine batches + stock =====
  medicineBatches: seedMedicineBatches(),
  medicineStock: Object.fromEntries(MEDICINES.map((m) => [m.id, m.stock])),
  restockMedicine: (medicineId, qty, batchNo, expiryDate, unitCost, poNumber, supplierId) => {
    if (qty <= 0) return;
    // If a batch with same batchNo + medicineId exists, merge
    const existing = get().medicineBatches.find((b) => b.medicineId === medicineId && batchNo && b.batchNo === batchNo);
    if (existing) {
      set((s) => ({
        medicineBatches: s.medicineBatches.map((b) => b.id === existing.id ? {
          ...b,
          receivedQty: b.receivedQty + qty,
          currentQty: b.currentQty + qty,
        } : b),
      }));
    } else {
      const newBatch: MedicineBatch = {
        id: uid("mb"),
        medicineId,
        batchNo: batchNo ?? `BATCH-${Date.now().toString().slice(-6)}`,
        expiryDate: expiryDate ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10),
        receivedQty: qty,
        currentQty: qty,
        unitCost: unitCost ?? 0,
        receivedDate: new Date().toISOString().slice(0, 10),
        poNumber,
        supplierId,
      };
      set((s) => ({ medicineBatches: [newBatch, ...s.medicineBatches] }));
    }
    set((s) => ({ medicineStock: { ...s.medicineStock, [medicineId]: (s.medicineStock[medicineId] ?? 0) + qty } }));
  },
  dispenseMedicine: (medicineId, qty) => {
    if (qty <= 0) return false;
    const cur = get().medicineStock[medicineId] ?? 0;
    if (cur < qty) return false;
    // FEFO dispense: take from earliest-expiring batch first
    const batches = get().medicineBatches
      .filter((b) => b.medicineId === medicineId && b.currentQty > 0)
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
    let remaining = qty;
    for (const b of batches) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, b.currentQty);
      set((s) => ({ medicineBatches: s.medicineBatches.map((mb) => mb.id === b.id ? { ...mb, currentQty: mb.currentQty - take } : mb) }));
      remaining -= take;
    }
    set((s) => ({ medicineStock: { ...s.medicineStock, [medicineId]: cur - qty } }));
    return true;
  },
  adjustMedicineStock: (medicineId, newQty, reason) => {
    if (!get().can("inventory", "adjust")) {
      get().pushToast({ title: "Access denied", description: "You cannot adjust stock.", variant: "danger" });
      return;
    }
    const cur = get().medicineStock[medicineId] ?? 0;
    const diff = newQty - cur;
    if (diff === 0) return;
    if (diff > 0) {
      get().restockMedicine(medicineId, diff, `ADJ-${Date.now().toString().slice(-6)}`, undefined, 0);
    } else {
      get().dispenseMedicine(medicineId, -diff);
    }
    const med = MEDICINES.find((m) => m.id === medicineId);
    get().logActivity({ action: "Adjusted inventory", category: "inventory", module: "inventory", targetRecordId: medicineId, targetRecordType: "Medicine", details: `${med?.name ?? medicineId}: ${cur} → ${newQty} (${reason})`, success: true });
  },
  expireBatches: () => {
    const today = new Date().toISOString().slice(0, 10);
    set((s) => ({
      medicineBatches: s.medicineBatches.map((b) => b.expiryDate < today && b.currentQty > 0 ? { ...b, currentQty: 0 } : b),
      bloodBags: s.bloodBags.map((b) => b.expiryDate < today && b.status === "available" ? { ...b, status: "expired" } : b),
    }));
    // Recompute medicine stock after batch expiry
    const stock: Record<string, number> = { ...get().medicineStock };
    for (const m of MEDICINES) {
      stock[m.id] = get().medicineBatches.filter((b) => b.medicineId === m.id).reduce((s, b) => s + b.currentQty, 0);
    }
    set({ medicineStock: stock });
  },

  // ===== Blood Bank =====
  bloodBags: [...BLOOD_BAGS_SEED],
  bloodDonors: [...BLOOD_DONORS],
  bloodTransfusions: [],
  addBloodDonor: (d) => {
    if (!get().can("blood_bank", "create")) {
      get().pushToast({ title: "Access denied", variant: "danger" });
      return;
    }
    donorSeq++;
    const newD: BloodDonor = {
      ...d,
      id: uid("bd"),
      totalDonations: d.totalDonations ?? 0,
      status: d.status ?? "eligible",
      avatarColor: d.avatarColor ?? AVATAR_COLORS[donorSeq % AVATAR_COLORS.length]!,
    };
    set((s) => ({ bloodDonors: [newD, ...s.bloodDonors] }));
    get().logActivity({ action: "Registered blood donor", category: "blood_bank", module: "blood_bank", targetRecordId: newD.id, targetRecordType: "BloodDonor", details: `${newD.name} (${newD.bloodType})`, success: true });
    get().pushToast({ title: "Donor registered", description: newD.name, variant: "success" });
  },
  updateBloodDonor: (id, patch) => {
    set((s) => ({ bloodDonors: s.bloodDonors.map((d) => d.id === id ? { ...d, ...patch } : d) }));
    const d = get().bloodDonors.find((x) => x.id === id);
    get().logActivity({ action: "Updated donor", category: "blood_bank", module: "blood_bank", targetRecordId: id, targetRecordType: "BloodDonor", details: `${d?.name}: ${Object.keys(patch).join(", ")}`, success: true });
  },
  recordDonation: (input) => {
    if (!get().can("blood_bank", "create")) {
      get().pushToast({ title: "Access denied", variant: "danger" });
      return null;
    }
    const donor = get().bloodDonors.find((d) => d.id === input.donorId);
    if (!donor) {
      get().pushToast({ title: "Donor not found", variant: "danger" });
      return null;
    }
    if (donor.status !== "eligible") {
      get().pushToast({ title: "Donor not eligible", description: `Status: ${donor.status}. ${donor.notes ?? ""}`, variant: "danger" });
      return null;
    }
    if (donor.bloodType !== input.bloodType) {
      get().pushToast({ title: "Blood type mismatch", description: `Donor is ${donor.bloodType}, not ${input.bloodType}`, variant: "danger" });
      return null;
    }
    bagSeq++;
    const today = new Date().toISOString().slice(0, 10);
    const compInfo = (BLOOD_COMPONENTS_INFO as any)[input.component] as { shelfLife: number; label: string; unit: string };
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + compInfo.shelfLife);
    const bag: BloodBag = {
      id: uid("bb"),
      bagId: `BBG-2026-${String(1017 + bagSeq).padStart(4, "0")}`,
      bloodType: input.bloodType,
      component: input.component,
      volume: input.volume,
      donorId: donor.id,
      donorName: donor.name,
      donationDate: today,
      expiryDate: expiry.toISOString().slice(0, 10),
      batchNo: `BBT-${today.replace(/-/g, "")}-${String(bagSeq).padStart(3, "0")}`,
      location: input.location,
      status: "available",
      notes: input.notes,
    };
    set((s) => ({
      bloodBags: [bag, ...s.bloodBags],
      bloodDonors: s.bloodDonors.map((d) => d.id === donor.id ? {
        ...d,
        lastDonationDate: today,
        totalDonations: d.totalDonations + 1,
      } : d),
    }));
    get().logActivity({ action: "Recorded blood donation", category: "blood_bank", module: "blood_bank", targetRecordId: bag.id, targetRecordType: "BloodBag", details: `${bag.bagId} — ${donor.name} (${input.bloodType}, ${compInfo.label})`, success: true });
    get().pushToast({ title: "Donation recorded", description: `${bag.bagId} added to inventory`, variant: "success" });
    return bag;
  },
  discardBloodBag: (id, reason) => {
    if (!get().can("blood_bank", "adjust")) return;
    set((s) => ({ bloodBags: s.bloodBags.map((b) => b.id === id ? { ...b, status: "discarded", notes: reason } : b) }));
    const b = get().bloodBags.find((x) => x.id === id);
    get().logActivity({ action: "Discarded blood bag", category: "blood_bank", module: "blood_bank", targetRecordId: id, targetRecordType: "BloodBag", details: `${b?.bagId} discarded — ${reason}`, success: true });
    get().pushToast({ title: "Bag discarded", description: b?.bagId, variant: "warning" });
  },
  createTransfusion: (input) => {
    if (!get().can("blood_bank", "create")) {
      get().pushToast({ title: "Access denied", variant: "danger" });
      return null;
    }
    // Validate compatibility
    const compatible = (BLOOD_COMPATIBILITY_MAP as any)[input.requiredBloodType] as BloodType[];
    if (!compatible?.includes(input.patientBloodType)) {
      get().pushToast({ title: "Incompatible transfusion", description: `Donor ${input.requiredBloodType} → recipient ${input.patientBloodType} not allowed`, variant: "danger" });
      get().logActivity({ action: "Transfusion blocked (incompatible)", category: "blood_bank", module: "blood_bank", details: `Attempted ${input.requiredBloodType} → ${input.patientBloodType}`, success: false });
      return null;
    }
    // Validate bag availability
    const bags = get().bloodBags.filter((b) => input.bagIds.includes(b.id));
    if (bags.length !== input.bagIds.length) {
      get().pushToast({ title: "Bag not found", variant: "danger" });
      return null;
    }
    if (bags.some((b) => b.status !== "available")) {
      get().pushToast({ title: "Bag not available", description: "One or more bags are not available.", variant: "danger" });
      return null;
    }
    if (bags.some((b) => b.bloodType !== input.requiredBloodType)) {
      get().pushToast({ title: "Blood type mismatch", description: "Selected bag does not match required type.", variant: "danger" });
      return null;
    }
    txSeq++;
    const patient = [...PATIENTS, ...get().livePatients].find((p) => p.id === input.patientId);
    const tx: BloodTransfusion = {
      id: uid("tx"),
      number: `TX-2026-${String(1001 + txSeq).padStart(4, "0")}`,
      patientId: input.patientId,
      patientName: patient?.name ?? "Unknown",
      mrn: patient?.mrn ?? "N/A",
      patientBloodType: input.patientBloodType,
      requiredBloodType: input.requiredBloodType,
      component: input.component,
      units: input.units,
      bagIds: input.bagIds,
      orderedBy: input.orderedBy,
      performedBy: input.performedBy,
      crossMatchedBy: input.crossMatchedBy,
      crossMatchResult: "compatible",
      date: new Date().toISOString(),
      status: "in_progress",
      notes: input.notes,
    };
    set((s) => ({
      bloodTransfusions: [tx, ...s.bloodTransfusions],
      bloodBags: s.bloodBags.map((b) => input.bagIds.includes(b.id) ? { ...b, status: "transfused" } : b),
    }));
    get().logActivity({ action: "Created blood transfusion", category: "blood_bank", module: "blood_bank", targetRecordId: tx.id, targetRecordType: "Transfusion", details: `${tx.number} — ${tx.patientName} (${tx.units} units ${tx.requiredBloodType})`, success: true });
    get().pushToast({ title: "Transfusion recorded", description: tx.number, variant: "success" });
    return tx;
  },
  updateTransfusionStatus: (id, status, reactions) => {
    set((s) => ({ bloodTransfusions: s.bloodTransfusions.map((t) => t.id === id ? { ...t, status, reactions: reactions ?? t.reactions } : t) }));
    const t = get().bloodTransfusions.find((x) => x.id === id);
    get().logActivity({ action: `Transfusion ${status}`, category: "blood_bank", module: "blood_bank", targetRecordId: id, targetRecordType: "Transfusion", details: `${t?.number} now ${status}${reactions ? ` — reactions: ${reactions}` : ""}`, success: true });
  },
}));

// ============================================================================
// Re-export blood-bank constants from data.ts so consumers can import from store
// ============================================================================
import { BLOOD_COMPONENTS as BLOOD_COMPONENTS_INFO, BLOOD_COMPATIBILITY as BLOOD_COMPATIBILITY_MAP } from "@/_legacy/mock-data/data";

// ============================================================================
// Helper selectors
// ============================================================================
export function getAllPatients(): Patient[] {
  const live = useAppStore.getState().livePatients;
  return [...live, ...PATIENTS];
}
export function getAllAppointments(): LiveAppointment[] {
  const live = useAppStore.getState().liveAppointments;
  return [...live, ...APPOINTMENTS];
}
export function getAllDoctors() { return DOCTORS; }
export function getAllStaff(): LiveStaff[] {
  return useAppStore.getState().liveStaff;
}
export function getMedicineStock(m: Medicine): number {
  return useAppStore.getState().medicineStock[m.id] ?? m.stock;
}
