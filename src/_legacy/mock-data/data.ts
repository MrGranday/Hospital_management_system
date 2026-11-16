// Mock data store for the MediCore Hospital Management System.
// All data is realistic and internally consistent so charts, tables, and
// detail panels render the same numbers across modules.

export type Role =
  | "super_admin"
  | "admin"
  | "doctor"
  | "nurse"
  | "receptionist"
  | "pharmacist"
  | "lab_tech"
  | "radiologist"
  | "accountant"
  | "inventory_manager";

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  avatar?: string;
  department?: string;
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  name: string;
  age: number;
  gender: "M" | "F";
  phone: string;
  email?: string;
  bloodType?: string;
  address?: string;
  registeredOn: string;
  lastVisit?: string;
  status: "active" | "admitted" | "discharged" | "critical";
  insurance?: { provider: string; coverage: number };
  allergies: string[];
  chronicConditions: string[];
  balance: number;
  avatarColor: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  room: string;
  status: "available" | "busy" | "off";
  patientsToday: number;
  rating: number;
  avatarColor: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  time: string; // ISO hh:mm
  date: string; // ISO date
  duration: number;
  status: "scheduled" | "checked-in" | "in-progress" | "completed" | "cancelled" | "no-show";
  reason: string;
  type: "new" | "follow-up" | "emergency";
}

export interface OpdVisit {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  doctorId: string;
  doctorName: string;
  department: string;
  checkInTime: string;
  status: "waiting" | "vitals_done" | "in_consultation" | "completed";
  vitals?: {
    bp: string;
    pulse: number;
    temp: number;
    spo2: number;
    weight: number;
    height: number;
  };
  reason: string;
  priority: "routine" | "urgent" | "emergency";
  age: number;
  gender: "M" | "F";
  avatarColor: string;
}

export interface Invoice {
  id: string;
  number: string;
  patientName: string;
  mrn: string;
  date: string;
  amount: number;
  paid: number;
  status: "paid" | "partial" | "unpaid" | "overdue";
  department: string;
  items: { description: string; qty: number; rate: number; total: number }[];
}

export interface Medicine {
  id: string;
  name: string;
  generic: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  price: number;
  expiry: string;
  batch: string;
  manufacturer: string;
}

export interface LabOrder {
  id: string;
  number: string;
  patientName: string;
  mrn: string;
  orderedBy: string;
  orderedAt: string;
  type: "pathology" | "radiology";
  tests: string[];
  status: "pending" | "sample-collected" | "in-progress" | "completed" | "verified";
  priority: "routine" | "urgent" | "stat";
  resultReady?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  location: string;
  lastRestocked: string;
  unitCost: number;
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "critical";
  title: string;
  message: string;
  time: string;
  read: boolean;
  action?: { label: string; route: string };
}

const AVATAR_COLORS = [
  "oklch(0.62 0.14 200)",
  "oklch(0.62 0.14 155)",
  "oklch(0.65 0.16 280)",
  "oklch(0.72 0.17 75)",
  "oklch(0.62 0.20 15)",
  "oklch(0.58 0.15 230)",
  "oklch(0.65 0.14 100)",
  "oklch(0.62 0.18 320)",
];

const pick = <T,>(arr: T[], i: number): T => arr[i % arr.length]!;

export const DEPARTMENTS = [
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Gynecology",
  "Dermatology",
  "ENT",
  "Ophthalmology",
  "General Medicine",
  "Emergency",
];

export const CURRENT_USER: User = {
  id: "u1",
  name: "Dr. Sarah Chen",
  role: "doctor",
  email: "sarah.chen@medicore.io",
  department: "Cardiology",
};

export const USERS_BY_ROLE: Record<Role, User> = {
  super_admin: { id: "u0", name: "System Administrator", role: "super_admin", email: "admin@medicore.io" },
  admin: { id: "u1", name: "James Whitfield", role: "admin", email: "j.whitfield@medicore.io" },
  doctor: { id: "u2", name: "Dr. Sarah Chen", role: "doctor", email: "sarah.chen@medicore.io", department: "Cardiology" },
  nurse: { id: "u3", name: "Nurse Olivia Brown", role: "nurse", email: "o.brown@medicore.io", department: "ICU" },
  receptionist: { id: "u4", name: "Emma Wilson", role: "receptionist", email: "e.wilson@medicore.io" },
  pharmacist: { id: "u5", name: "Pharm. David Kim", role: "pharmacist", email: "d.kim@medicore.io" },
  lab_tech: { id: "u6", name: "Lab Tech Marcus Lee", role: "lab_tech", email: "m.lee@medicore.io" },
  radiologist: { id: "u7", name: "Dr. Aisha Patel", role: "radiologist", email: "a.patel@medicore.io" },
  accountant: { id: "u8", name: "Robert Garcia", role: "accountant", email: "r.garcia@medicore.io" },
  inventory_manager: { id: "u9", name: "Linda Martinez", role: "inventory_manager", email: "l.martinez@medicore.io" },
};

export const PATIENTS: Patient[] = [
  {
    id: "p1", mrn: "MRN-2024-0001", name: "Michael Foster", age: 54, gender: "M",
    phone: "+1 (415) 555-0192", email: "m.foster@email.com", bloodType: "O+",
    address: "284 Bayview Ave, San Francisco, CA",
    registeredOn: "2024-01-14", lastVisit: "2026-07-18",
    status: "admitted", insurance: { provider: "BlueShield", coverage: 85 },
    allergies: ["Penicillin"], chronicConditions: ["Hypertension", "Type 2 Diabetes"],
    balance: 1240, avatarColor: pick(AVATAR_COLORS, 0),
  },
  {
    id: "p2", mrn: "MRN-2024-0002", name: "Sofia Reyes", age: 32, gender: "F",
    phone: "+1 (415) 555-0148", email: "s.reyes@email.com", bloodType: "A+",
    address: "12 Pine St, Oakland, CA",
    registeredOn: "2024-02-03", lastVisit: "2026-07-15",
    status: "active", insurance: { provider: "Kaiser", coverage: 90 },
    allergies: [], chronicConditions: ["Asthma"],
    balance: 0, avatarColor: pick(AVATAR_COLORS, 1),
  },
  {
    id: "p3", mrn: "MRN-2024-0003", name: "Ethan Nakamura", age: 8, gender: "M",
    phone: "+1 (415) 555-0173", email: "guardian.nakamura@email.com", bloodType: "B+",
    registeredOn: "2024-03-21", lastVisit: "2026-07-19",
    status: "active", insurance: { provider: "Aetna", coverage: 75 },
    allergies: ["Peanuts"], chronicConditions: [],
    balance: 320, avatarColor: pick(AVATAR_COLORS, 2),
  },
  {
    id: "p4", mrn: "MRN-2024-0004", name: "Isabella Romano", age: 67, gender: "F",
    phone: "+1 (415) 555-0111", email: "i.romano@email.com", bloodType: "AB-",
    registeredOn: "2024-01-28", lastVisit: "2026-07-19",
    status: "critical", insurance: { provider: "Medicare", coverage: 100 },
    allergies: ["Latex"], chronicConditions: ["CHF", "Atrial Fibrillation"],
    balance: 8900, avatarColor: pick(AVATAR_COLORS, 3),
  },
  {
    id: "p5", mrn: "MRN-2024-0005", name: "Daniel Okafor", age: 41, gender: "M",
    phone: "+1 (415) 555-0198", email: "d.okafor@email.com", bloodType: "O-",
    registeredOn: "2024-04-09", lastVisit: "2026-07-12",
    status: "active", insurance: { provider: "Cigna", coverage: 80 },
    allergies: [], chronicConditions: ["Migraine"],
    balance: 0, avatarColor: pick(AVATAR_COLORS, 4),
  },
  {
    id: "p6", mrn: "MRN-2024-0006", name: "Aisha Khan", age: 28, gender: "F",
    phone: "+1 (415) 555-0144", email: "a.khan@email.com", bloodType: "A-",
    registeredOn: "2024-05-16", lastVisit: "2026-07-10",
    status: "active", insurance: { provider: "United Health", coverage: 88 },
    allergies: ["Sulfa drugs"], chronicConditions: [],
    balance: 180, avatarColor: pick(AVATAR_COLORS, 5),
  },
  {
    id: "p7", mrn: "MRN-2024-0007", name: "Liam Patel", age: 73, gender: "M",
    phone: "+1 (415) 555-0127", email: "l.patel@email.com", bloodType: "B-",
    registeredOn: "2024-02-19", lastVisit: "2026-07-17",
    status: "admitted", insurance: { provider: "Medicare", coverage: 100 },
    allergies: ["Aspirin"], chronicConditions: ["COPD", "Arthritis"],
    balance: 4300, avatarColor: pick(AVATAR_COLORS, 6),
  },
  {
    id: "p8", mrn: "MRN-2024-0008", name: "Olivia Bennett", age: 19, gender: "F",
    phone: "+1 (415) 555-0189", email: "o.bennett@email.com", bloodType: "O+",
    registeredOn: "2024-06-04", lastVisit: "2026-07-16",
    status: "active", insurance: { provider: "BlueShield", coverage: 70 },
    allergies: [], chronicConditions: [],
    balance: 0, avatarColor: pick(AVATAR_COLORS, 7),
  },
  {
    id: "p9", mrn: "MRN-2024-0009", name: "Noah Kowalski", age: 50, gender: "M",
    phone: "+1 (415) 555-0103", email: "n.kowalski@email.com", bloodType: "A+",
    registeredOn: "2024-03-30", lastVisit: "2026-07-11",
    status: "active", insurance: { provider: "Kaiser", coverage: 92 },
    allergies: ["Iodine"], chronicConditions: ["Hyperlipidemia"],
    balance: 540, avatarColor: pick(AVATAR_COLORS, 0),
  },
  {
    id: "p10", mrn: "MRN-2024-0010", name: "Mia Chen", age: 35, gender: "F",
    phone: "+1 (415) 555-0156", email: "m.chen@email.com", bloodType: "AB+",
    registeredOn: "2024-04-22", lastVisit: "2026-07-18",
    status: "active", insurance: { provider: "Aetna", coverage: 85 },
    allergies: [], chronicConditions: ["Hypothyroidism"],
    balance: 0, avatarColor: pick(AVATAR_COLORS, 1),
  },
  {
    id: "p11", mrn: "MRN-2024-0011", name: "Lucas Mbeki", age: 46, gender: "M",
    phone: "+1 (415) 555-0122", email: "l.mbeki@email.com", bloodType: "O+",
    registeredOn: "2024-05-08", lastVisit: "2026-07-09",
    status: "active", insurance: { provider: "Cigna", coverage: 78 },
    allergies: [], chronicConditions: ["Gout"],
    balance: 0, avatarColor: pick(AVATAR_COLORS, 2),
  },
  {
    id: "p12", mrn: "MRN-2024-0012", name: "Charlotte Dubois", age: 61, gender: "F",
    phone: "+1 (415) 555-0135", email: "c.dubois@email.com", bloodType: "A-",
    registeredOn: "2024-01-19", lastVisit: "2026-07-14",
    status: "discharged", insurance: { provider: "United Health", coverage: 90 },
    allergies: ["Penicillin"], chronicConditions: ["Rheumatoid Arthritis"],
    balance: 0, avatarColor: pick(AVATAR_COLORS, 3),
  },
];

export const DOCTORS: Doctor[] = [
  { id: "d1", name: "Dr. Sarah Chen", specialty: "Cardiology", room: "C-204", status: "busy", patientsToday: 12, rating: 4.9, avatarColor: pick(AVATAR_COLORS, 0) },
  { id: "d2", name: "Dr. Marcus Reed", specialty: "Neurology", room: "N-110", status: "available", patientsToday: 8, rating: 4.7, avatarColor: pick(AVATAR_COLORS, 4) },
  { id: "d3", name: "Dr. Priya Anand", specialty: "Pediatrics", room: "P-301", status: "available", patientsToday: 15, rating: 4.95, avatarColor: pick(AVATAR_COLORS, 5) },
  { id: "d4", name: "Dr. Robert Hayes", specialty: "Orthopedics", room: "O-220", status: "busy", patientsToday: 10, rating: 4.6, avatarColor: pick(AVATAR_COLORS, 6) },
  { id: "d5", name: "Dr. Elena Petrova", specialty: "Gynecology", room: "G-105", status: "available", patientsToday: 11, rating: 4.85, avatarColor: pick(AVATAR_COLORS, 7) },
  { id: "d6", name: "Dr. James Okoro", specialty: "Emergency", room: "ER-01", status: "busy", patientsToday: 22, rating: 4.8, avatarColor: pick(AVATAR_COLORS, 2) },
];

export const OPD_VISITS: OpdVisit[] = [
  {
    id: "v1", patientId: "p1", patientName: "Michael Foster", mrn: "MRN-2024-0001",
    doctorId: "d1", doctorName: "Dr. Sarah Chen", department: "Cardiology",
    checkInTime: "08:42", status: "in_consultation", priority: "urgent", age: 54, gender: "M",
    avatarColor: pick(AVATAR_COLORS, 0),
    vitals: { bp: "142/91", pulse: 88, temp: 98.4, spo2: 97, weight: 92, height: 178 },
    reason: "Chest tightness on exertion, follow-up on hypertension",
  },
  {
    id: "v2", patientId: "p3", patientName: "Ethan Nakamura", mrn: "MRN-2024-0003",
    doctorId: "d3", doctorName: "Dr. Priya Anand", department: "Pediatrics",
    checkInTime: "09:15", status: "vitals_done", priority: "routine", age: 8, gender: "M",
    avatarColor: pick(AVATAR_COLORS, 2),
    vitals: { bp: "100/65", pulse: 92, temp: 100.2, spo2: 98, weight: 27, height: 130 },
    reason: "Persistent fever 3 days, reduced appetite",
  },
  {
    id: "v3", patientId: "p5", patientName: "Daniel Okafor", mrn: "MRN-2024-0005",
    doctorId: "d2", doctorName: "Dr. Marcus Reed", department: "Neurology",
    checkInTime: "09:30", status: "vitals_done", priority: "routine", age: 41, gender: "M",
    avatarColor: pick(AVATAR_COLORS, 4),
    vitals: { bp: "128/82", pulse: 74, temp: 98.6, spo2: 99, weight: 81, height: 180 },
    reason: "Recurrent migraine with aura, medication review",
  },
  {
    id: "v4", patientId: "p9", patientName: "Noah Kowalski", mrn: "MRN-2024-0009",
    doctorId: "d1", doctorName: "Dr. Sarah Chen", department: "Cardiology",
    checkInTime: "10:05", status: "waiting", priority: "routine", age: 50, gender: "M",
    avatarColor: pick(AVATAR_COLORS, 0),
    reason: "Annual cardiac check-up, lipid panel review",
  },
  {
    id: "v5", patientId: "p6", patientName: "Aisha Khan", mrn: "MRN-2024-0006",
    doctorId: "d5", doctorName: "Dr. Elena Petrova", department: "Gynecology",
    checkInTime: "10:20", status: "waiting", priority: "routine", age: 28, gender: "F",
    avatarColor: pick(AVATAR_COLORS, 5),
    reason: "Routine prenatal visit, week 24",
  },
  {
    id: "v6", patientId: "p10", patientName: "Mia Chen", mrn: "MRN-2024-0010",
    doctorId: "d1", doctorName: "Dr. Sarah Chen", department: "Cardiology",
    checkInTime: "10:45", status: "waiting", priority: "routine", age: 35, gender: "F",
    avatarColor: pick(AVATAR_COLORS, 1),
    reason: "Palpitations, family history of CAD",
  },
  {
    id: "v7", patientId: "p4", patientName: "Isabella Romano", mrn: "MRN-2024-0004",
    doctorId: "d1", doctorName: "Dr. Sarah Chen", department: "Cardiology",
    checkInTime: "11:00", status: "waiting", priority: "emergency", age: 67, gender: "F",
    avatarColor: pick(AVATAR_COLORS, 3),
    reason: "Acute dyspnea, suspected CHF exacerbation",
  },
  {
    id: "v8", patientId: "p11", patientName: "Lucas Mbeki", mrn: "MRN-2024-0011",
    doctorId: "d4", doctorName: "Dr. Robert Hayes", department: "Orthopedics",
    checkInTime: "11:15", status: "completed", priority: "routine", age: 46, gender: "M",
    avatarColor: pick(AVATAR_COLORS, 2),
    vitals: { bp: "130/85", pulse: 78, temp: 98.6, spo2: 99, weight: 88, height: 175 },
    reason: "Knee pain follow-up, post-arthroscopy",
  },
];

export const APPOINTMENTS: Appointment[] = [
  { id: "a1", patientId: "p1", patientName: "Michael Foster", doctorId: "d1", doctorName: "Dr. Sarah Chen", department: "Cardiology", time: "08:30", date: "today", duration: 30, status: "completed", reason: "Hypertension follow-up", type: "follow-up" },
  { id: "a2", patientId: "p3", patientName: "Ethan Nakamura", doctorId: "d3", doctorName: "Dr. Priya Anand", department: "Pediatrics", time: "09:00", date: "today", duration: 20, status: "in-progress", reason: "Fever, reduced appetite", type: "new" },
  { id: "a3", patientId: "p5", patientName: "Daniel Okafor", doctorId: "d2", doctorName: "Dr. Marcus Reed", department: "Neurology", time: "09:30", date: "today", duration: 30, status: "in-progress", reason: "Migraine review", type: "follow-up" },
  { id: "a4", patientId: "p9", patientName: "Noah Kowalski", doctorId: "d1", doctorName: "Dr. Sarah Chen", department: "Cardiology", time: "10:00", date: "today", duration: 30, status: "checked-in", reason: "Annual check-up", type: "follow-up" },
  { id: "a5", patientId: "p6", patientName: "Aisha Khan", doctorId: "d5", doctorName: "Dr. Elena Petrova", department: "Gynecology", time: "10:30", date: "today", duration: 30, status: "checked-in", reason: "Prenatal visit", type: "follow-up" },
  { id: "a6", patientId: "p10", patientName: "Mia Chen", doctorId: "d1", doctorName: "Dr. Sarah Chen", department: "Cardiology", time: "11:00", date: "today", duration: 20, status: "scheduled", reason: "Palpitations", type: "new" },
  { id: "a7", patientId: "p4", patientName: "Isabella Romano", doctorId: "d1", doctorName: "Dr. Sarah Chen", department: "Cardiology", time: "11:30", date: "today", duration: 45, status: "scheduled", reason: "Acute dyspnea", type: "emergency" },
  { id: "a8", patientId: "p11", patientName: "Lucas Mbeki", doctorId: "d4", doctorName: "Dr. Robert Hayes", department: "Orthopedics", time: "12:00", date: "today", duration: 30, status: "scheduled", reason: "Knee pain follow-up", type: "follow-up" },
  { id: "a9", patientId: "p2", patientName: "Sofia Reyes", doctorId: "d3", doctorName: "Dr. Priya Anand", department: "Pediatrics", time: "13:00", date: "today", duration: 20, status: "scheduled", reason: "Asthma review", type: "follow-up" },
  { id: "a10", patientId: "p12", patientName: "Charlotte Dubois", doctorId: "d1", doctorName: "Dr. Sarah Chen", department: "Cardiology", time: "13:30", date: "today", duration: 30, status: "scheduled", reason: "Post-discharge follow-up", type: "follow-up" },
];

export const INVOICES: Invoice[] = [
  {
    id: "i1", number: "INV-2026-1024", patientName: "Michael Foster", mrn: "MRN-2024-0001",
    date: "2026-07-18", amount: 1850, paid: 1000, status: "partial", department: "Cardiology",
    items: [
      { description: "OPD Consultation", qty: 1, rate: 250, total: 250 },
      { description: "ECG", qty: 1, rate: 350, total: 350 },
      { description: "Echocardiography", qty: 1, rate: 850, total: 850 },
      { description: "Lab Panel - Lipid", qty: 1, rate: 400, total: 400 },
    ],
  },
  {
    id: "i2", number: "INV-2026-1025", patientName: "Isabella Romano", mrn: "MRN-2024-0004",
    date: "2026-07-19", amount: 8900, paid: 0, status: "unpaid", department: "Cardiology",
    items: [
      { description: "Emergency Consultation", qty: 1, rate: 800, total: 800 },
      { description: "ICU Day 1", qty: 1, rate: 4500, total: 4500 },
      { description: "Cardiac Biomarkers", qty: 1, rate: 600, total: 600 },
      { description: "Chest X-Ray", qty: 1, rate: 450, total: 450 },
      { description: "Medications", qty: 1, rate: 2550, total: 2550 },
    ],
  },
  {
    id: "i3", number: "INV-2026-1026", patientName: "Sofia Reyes", mrn: "MRN-2024-0002",
    date: "2026-07-15", amount: 420, paid: 420, status: "paid", department: "Pediatrics",
    items: [
      { description: "OPD Consultation", qty: 1, rate: 250, total: 250 },
      { description: "Spirometry", qty: 1, rate: 170, total: 170 },
    ],
  },
  {
    id: "i4", number: "INV-2026-1027", patientName: "Liam Patel", mrn: "MRN-2024-0007",
    date: "2026-07-17", amount: 4300, paid: 0, status: "overdue", department: "Pulmonology",
    items: [
      { description: "IPD Room (3 days)", qty: 3, rate: 1000, total: 3000 },
      { description: "Oxygen Therapy", qty: 3, rate: 350, total: 1050 },
      { description: "Specialist Rounds", qty: 3, rate: 80, total: 240 },
    ],
  },
  {
    id: "i5", number: "INV-2026-1028", patientName: "Daniel Okafor", mrn: "MRN-2024-0005",
    date: "2026-07-12", amount: 380, paid: 380, status: "paid", department: "Neurology",
    items: [
      { description: "OPD Consultation", qty: 1, rate: 280, total: 280 },
      { description: "Pharmacy", qty: 1, rate: 100, total: 100 },
    ],
  },
  {
    id: "i6", number: "INV-2026-1029", patientName: "Ethan Nakamura", mrn: "MRN-2024-0003",
    date: "2026-07-19", amount: 320, paid: 0, status: "unpaid", department: "Pediatrics",
    items: [
      { description: "Pediatric Consultation", qty: 1, rate: 220, total: 220 },
      { description: "CBC", qty: 1, rate: 100, total: 100 },
    ],
  },
  {
    id: "i7", number: "INV-2026-1030", patientName: "Noah Kowalski", mrn: "MRN-2024-0009",
    date: "2026-07-11", amount: 540, paid: 540, status: "paid", department: "Cardiology",
    items: [
      { description: "OPD Consultation", qty: 1, rate: 250, total: 250 },
      { description: "Lipid Panel", qty: 1, rate: 290, total: 290 },
    ],
  },
  {
    id: "i8", number: "INV-2026-1031", patientName: "Mia Chen", mrn: "MRN-2024-0010",
    date: "2026-07-18", amount: 670, paid: 200, status: "partial", department: "Cardiology",
    items: [
      { description: "OPD Consultation", qty: 1, rate: 250, total: 250 },
      { description: "Holter Monitor", qty: 1, rate: 420, total: 420 },
    ],
  },
];

export const MEDICINES: Medicine[] = [
  { id: "m1", name: "Amoxicillin 500mg", generic: "Amoxicillin", category: "Antibiotic", stock: 1240, minStock: 200, unit: "capsule", price: 0.45, expiry: "2027-03-15", batch: "AMX-2401", manufacturer: "PharmaCorp" },
  { id: "m2", name: "Metformin 850mg", generic: "Metformin HCl", category: "Antidiabetic", stock: 85, minStock: 150, unit: "tablet", price: 0.18, expiry: "2026-12-20", batch: "MET-2403", manufacturer: "GlobePharma" },
  { id: "m3", name: "Atorvastatin 20mg", generic: "Atorvastatin Calcium", category: "Statin", stock: 540, minStock: 100, unit: "tablet", price: 0.32, expiry: "2027-06-30", batch: "ATV-2405", manufacturer: "PharmaCorp" },
  { id: "m4", name: "Losartan 50mg", generic: "Losartan Potassium", category: "Antihypertensive", stock: 320, minStock: 100, unit: "tablet", price: 0.28, expiry: "2026-11-10", batch: "LOS-2402", manufacturer: "MediLabs" },
  { id: "m5", name: "Paracetamol 500mg", generic: "Acetaminophen", category: "Analgesic", stock: 2100, minStock: 500, unit: "tablet", price: 0.05, expiry: "2028-01-25", batch: "PAR-2410", manufacturer: "GlobePharma" },
  { id: "m6", name: "Omeprazole 20mg", generic: "Omeprazole", category: "PPI", stock: 42, minStock: 100, unit: "capsule", price: 0.22, expiry: "2026-09-12", batch: "OME-2406", manufacturer: "PharmaCorp" },
  { id: "m7", name: "Salbutamol Inhaler", generic: "Salbutamol", category: "Bronchodilator", stock: 78, minStock: 50, unit: "inhaler", price: 8.50, expiry: "2027-04-08", batch: "SAL-2407", manufacturer: "RespiraCare" },
  { id: "m8", name: "Insulin Glargine", generic: "Insulin Glargine", category: "Insulin", stock: 56, minStock: 80, unit: "vial", price: 24.80, expiry: "2026-10-30", batch: "INS-2404", manufacturer: "DiabeCare" },
  { id: "m9", name: "Cetirizine 10mg", generic: "Cetirizine HCl", category: "Antihistamine", stock: 680, minStock: 200, unit: "tablet", price: 0.08, expiry: "2027-08-15", batch: "CET-2408", manufacturer: "GlobePharma" },
  { id: "m10", name: "Amlodipine 5mg", generic: "Amlodipine Besylate", category: "Antihypertensive", stock: 410, minStock: 100, unit: "tablet", price: 0.15, expiry: "2027-05-22", batch: "AML-2409", manufacturer: "MediLabs" },
];

export const LAB_ORDERS: LabOrder[] = [
  {
    id: "l1", number: "LAB-2026-0451", patientName: "Michael Foster", mrn: "MRN-2024-0001",
    orderedBy: "Dr. Sarah Chen", orderedAt: "08:55", type: "pathology",
    tests: ["Lipid Panel", "HbA1c", "BMP"], status: "in-progress", priority: "urgent",
  },
  {
    id: "l2", number: "LAB-2026-0452", patientName: "Isabella Romano", mrn: "MRN-2024-0004",
    orderedBy: "Dr. Sarah Chen", orderedAt: "09:10", type: "pathology",
    tests: ["Troponin I", "BNP", "CBC", "CMP"], status: "completed", priority: "stat",
    resultReady: true,
  },
  {
    id: "l3", number: "LAB-2026-0453", patientName: "Daniel Okafor", mrn: "MRN-2024-0005",
    orderedBy: "Dr. Marcus Reed", orderedAt: "09:40", type: "radiology",
    tests: ["MRI Brain w/ contrast"], status: "pending", priority: "routine",
  },
  {
    id: "l4", number: "LAB-2026-0454", patientName: "Ethan Nakamura", mrn: "MRN-2024-0003",
    orderedBy: "Dr. Priya Anand", orderedAt: "09:20", type: "pathology",
    tests: ["CBC", "CRP", "Blood Culture"], status: "sample-collected", priority: "routine",
  },
  {
    id: "l5", number: "LAB-2026-0455", patientName: "Liam Patel", mrn: "MRN-2024-0007",
    orderedBy: "Dr. James Okoro", orderedAt: "08:30", type: "radiology",
    tests: ["Chest X-Ray PA", "ABG"], status: "verified", priority: "urgent",
    resultReady: true,
  },
  {
    id: "l6", number: "LAB-2026-0456", patientName: "Mia Chen", mrn: "MRN-2024-0010",
    orderedBy: "Dr. Sarah Chen", orderedAt: "10:15", type: "pathology",
    tests: ["Thyroid Panel", "CBC"], status: "pending", priority: "routine",
  },
  {
    id: "l7", number: "LAB-2026-0457", patientName: "Noah Kowalski", mrn: "MRN-2024-0009",
    orderedBy: "Dr. Sarah Chen", orderedAt: "07:50", type: "pathology",
    tests: ["Lipid Panel", "HsCRP"], status: "verified", priority: "routine",
    resultReady: true,
  },
];

export const INVENTORY_ITEMS: InventoryItem[] = [
  { id: "iv1", name: "Surgical Gloves (M)", sku: "SUR-GLV-M", category: "Surgical", stock: 12400, minStock: 5000, unit: "pair", location: "Store A1", lastRestocked: "2026-07-12", unitCost: 0.08 },
  { id: "iv2", name: "Surgical Gloves (L)", sku: "SUR-GLV-L", category: "Surgical", stock: 8400, minStock: 5000, unit: "pair", location: "Store A1", lastRestocked: "2026-07-12", unitCost: 0.08 },
  { id: "iv3", name: "N95 Masks", sku: "PPE-N95", category: "PPE", stock: 2800, minStock: 3000, unit: "piece", location: "Store A2", lastRestocked: "2026-07-08", unitCost: 0.65 },
  { id: "iv4", name: "IV Cannula 20G", sku: "IVC-20G", category: "Consumable", stock: 145, minStock: 500, unit: "piece", location: "Store B1", lastRestocked: "2026-06-29", unitCost: 1.20 },
  { id: "iv5", name: "Syringe 5ml", sku: "SYR-5ML", category: "Consumable", stock: 8200, minStock: 2000, unit: "piece", location: "Store B1", lastRestocked: "2026-07-10", unitCost: 0.05 },
  { id: "iv6", name: "Bandage 4in", sku: "BDG-4IN", category: "Wound Care", stock: 320, minStock: 200, unit: "roll", location: "Store B2", lastRestocked: "2026-07-14", unitCost: 0.85 },
  { id: "iv7", name: "Blood Bag 450ml", sku: "BLD-450", category: "Blood Bank", stock: 78, minStock: 100, unit: "bag", location: "Cold Room 1", lastRestocked: "2026-07-11", unitCost: 12.50 },
  { id: "iv8", name: "ECG Electrodes", sku: "ECG-ELC", category: "Cardiology", stock: 4500, minStock: 1000, unit: "pack", location: "Store C1", lastRestocked: "2026-07-13", unitCost: 2.40 },
  { id: "iv9", name: "Urinary Catheter 16Fr", sku: "CAT-16F", category: "Urology", stock: 64, minStock: 80, unit: "piece", location: "Store C2", lastRestocked: "2026-07-05", unitCost: 3.80 },
  { id: "iv10", name: "Oxygen Mask", sku: "O2-MSK", category: "Respiratory", stock: 240, minStock: 100, unit: "piece", location: "Store D1", lastRestocked: "2026-07-15", unitCost: 1.75 },
];

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "critical", title: "Critical patient alert", message: "Isabella Romano (MRN-2024-0004) — Troponin elevated to 0.42 ng/mL", time: "2 min ago", read: false, action: { label: "Review", route: "patients" } },
  { id: "n2", type: "warning", title: "Low stock warning", message: "Metformin 850mg is below minimum stock (85/150)", time: "18 min ago", read: false, action: { label: "Restock", route: "pharmacy" } },
  { id: "n3", type: "info", title: "Lab result ready", message: "Liam Patel's Chest X-Ray is now verified", time: "32 min ago", read: false, action: { label: "View", route: "lab" } },
  { id: "n4", type: "success", title: "Payment received", message: "$420 payment from Sofia Reyes recorded", time: "1 hr ago", read: true, action: { label: "View", route: "billing" } },
  { id: "n5", type: "warning", title: "Overdue invoice", message: "Liam Patel — Invoice INV-2026-1027 is 2 days overdue", time: "3 hr ago", read: true, action: { label: "Follow up", route: "billing" } },
];

// Charts data
export const REVENUE_TREND = [
  { month: "Jan", revenue: 142000, expense: 98000, patients: 412 },
  { month: "Feb", revenue: 158000, expense: 102000, patients: 438 },
  { month: "Mar", revenue: 171000, expense: 108000, patients: 475 },
  { month: "Apr", revenue: 165000, expense: 105000, patients: 462 },
  { month: "May", revenue: 184000, expense: 112000, patients: 503 },
  { month: "Jun", revenue: 196000, expense: 118000, patients: 521 },
  { month: "Jul", revenue: 212000, expense: 124000, patients: 568 },
];

export const REVENUE_BY_DEPARTMENT = [
  { name: "Cardiology", value: 58000, color: "oklch(0.535 0.195 245)" },
  { name: "Pediatrics", value: 28000, color: "oklch(0.62 0.150 200)" },
  { name: "Neurology", value: 34000, color: "oklch(0.58 0.150 290)" },
  { name: "Orthopedics", value: 31000, color: "oklch(0.72 0.160 75)" },
  { name: "Emergency", value: 42000, color: "oklch(0.65 0.200 15)" },
  { name: "Others", value: 19000, color: "oklch(0.62 0.130 240)" },
];

export const PATIENT_FLOW = [
  { hour: "06", value: 4 },
  { hour: "08", value: 18 },
  { hour: "10", value: 32 },
  { hour: "12", value: 28 },
  { hour: "14", value: 24 },
  { hour: "16", value: 19 },
  { hour: "18", value: 11 },
  { hour: "20", value: 6 },
];

export const BED_OCCUPANCY = [
  { ward: "ICU", total: 12, occupied: 10 },
  { ward: "CCU", total: 8, occupied: 7 },
  { ward: "General Ward A", total: 30, occupied: 22 },
  { ward: "General Ward B", total: 30, occupied: 18 },
  { ward: "Pediatric", total: 18, occupied: 9 },
  { ward: "Maternity", total: 14, occupied: 11 },
];

export const STAFF_SUMMARY = [
  { role: "Doctors", count: 24, color: "oklch(0.535 0.195 245)" },
  { role: "Nurses", count: 78, color: "oklch(0.62 0.150 200)" },
  { role: "Technicians", count: 32, color: "oklch(0.58 0.150 290)" },
  { role: "Pharmacists", count: 8, color: "oklch(0.72 0.160 75)" },
  { role: "Admin Staff", count: 18, color: "oklch(0.65 0.200 15)" },
  { role: "Support", count: 42, color: "oklch(0.62 0.130 240)" },
];

// === Sparkline data for KPI cards (last 7 days) ===
export const KPI_SPARKLINES = {
  revenue: [28, 32, 30, 35, 38, 42, 45],
  expense: [22, 24, 23, 26, 25, 27, 28],
  patients: [12, 14, 13, 16, 15, 18, 19],
  visits: [82, 88, 85, 92, 90, 96, 96],
  beds: [78, 80, 76, 82, 79, 84, 78],
  collection: [12, 14, 16, 13, 18, 16, 18],
  labs: [4, 6, 5, 7, 8, 6, 8],
  lowStock: [2, 3, 2, 4, 3, 3, 4],
};

// Convenience derived metrics
export const DASHBOARD_STATS = {
  monthlyRevenue: 212000,
  monthlyExpense: 124000,
  netIncome: 88000,
  profitMargin: 41.5,
  totalPatients: 568,
  newThisMonth: 47,
  visitsToday: 96,
  waitingNow: 5,
  collectedToday: 18420,
  unpaidBillsToday: 8,
  lowStockMedicines: 3,
  lowStockInventory: 4,
  pendingLabs: 4,
  completedLabsToday: 8,
  bedOccupancy: 0.78,
  totalBeds: 112,
  occupiedBeds: 87,
};

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Administrator",
  admin: "Administrator",
  doctor: "Doctor",
  nurse: "Nurse",
  receptionist: "Receptionist",
  pharmacist: "Pharmacist",
  lab_tech: "Lab Technician",
  radiologist: "Radiologist",
  accountant: "Accountant",
  inventory_manager: "Inventory Manager",
};

// ====================================================================
// EMERGENCY DEPARTMENT
// ====================================================================
export interface EmergencyCase {
  id: string;
  patientName: string;
  mrn: string;
  age: number;
  gender: "M" | "F";
  triage: "1-critical" | "2-emergent" | "3-urgent" | "4-less-urgent" | "5-non-urgent";
  complaint: string;
  arrivalTime: string;
  status: "waiting" | "in-treatment" | "admitted" | "discharged" | "observed";
  vitals: { bp: string; pulse: number; temp: number; spo2: number; rr: number };
  attending: string;
  avatarColor: string;
  waitedMin: number;
}

export const EMERGENCY_CASES: EmergencyCase[] = [
  {
    id: "e1", patientName: "Isabella Romano", mrn: "MRN-2024-0004", age: 67, gender: "F",
    triage: "1-critical", complaint: "Acute pulmonary edema, CHF exacerbation",
    arrivalTime: "08:42", status: "in-treatment",
    vitals: { bp: "88/52", pulse: 124, temp: 97.8, spo2: 86, rr: 32 },
    attending: "Dr. James Okoro", avatarColor: pick(AVATAR_COLORS, 3), waitedMin: 8,
  },
  {
    id: "e2", patientName: "Marcus Webb", mrn: "MRN-2024-0021", age: 54, gender: "M",
    triage: "1-critical", complaint: "STEMI — anterior wall MI",
    arrivalTime: "09:15", status: "in-treatment",
    vitals: { bp: "102/68", pulse: 96, temp: 98.4, spo2: 94, rr: 22 },
    attending: "Dr. Sarah Chen", avatarColor: pick(AVATAR_COLORS, 0), waitedMin: 12,
  },
  {
    id: "e3", patientName: "Priya Sharma", mrn: "MRN-2024-0022", age: 28, gender: "F",
    triage: "2-emergent", complaint: "Severe abdominal pain, possible appendicitis",
    arrivalTime: "09:38", status: "waiting",
    vitals: { bp: "118/76", pulse: 92, temp: 100.8, spo2: 97, rr: 18 },
    attending: "Dr. James Okoro", avatarColor: pick(AVATAR_COLORS, 1), waitedMin: 4,
  },
  {
    id: "e4", patientName: "Daniel Cohen", mrn: "MRN-2024-0023", age: 41, gender: "M",
    triage: "2-emergent", complaint: "Road traffic accident, multiple fractures",
    arrivalTime: "09:50", status: "in-treatment",
    vitals: { bp: "112/72", pulse: 88, temp: 98.6, spo2: 98, rr: 16 },
    attending: "Dr. Robert Hayes", avatarColor: pick(AVATAR_COLORS, 4), waitedMin: 6,
  },
  {
    id: "e5", patientName: "Emma Liu", mrn: "MRN-2024-0024", age: 35, gender: "F",
    triage: "3-urgent", complaint: "Anaphylaxis — bee sting, responding to epinephrine",
    arrivalTime: "10:05", status: "observed",
    vitals: { bp: "122/78", pulse: 84, temp: 98.6, spo2: 99, rr: 14 },
    attending: "Dr. James Okoro", avatarColor: pick(AVATAR_COLORS, 5), waitedMin: 18,
  },
  {
    id: "e6", patientName: "Henry Walsh", mrn: "MRN-2024-0025", age: 72, gender: "M",
    triage: "3-urgent", complaint: "Syncope episode, monitoring for arrhythmia",
    arrivalTime: "10:22", status: "observed",
    vitals: { bp: "134/82", pulse: 68, temp: 98.4, spo2: 96, rr: 16 },
    attending: "Dr. Sarah Chen", avatarColor: pick(AVATAR_COLORS, 6), waitedMin: 22,
  },
  {
    id: "e7", patientName: "Layla Hassan", mrn: "MRN-2024-0026", age: 6, gender: "F",
    triage: "4-less-urgent", complaint: "Fever 102°F, mild dehydration",
    arrivalTime: "10:35", status: "waiting",
    vitals: { bp: "98/62", pulse: 110, temp: 102.1, spo2: 98, rr: 22 },
    attending: "Dr. Priya Anand", avatarColor: pick(AVATAR_COLORS, 2), waitedMin: 35,
  },
  {
    id: "e8", patientName: "Robert Khan", mrn: "MRN-2024-0027", age: 38, gender: "M",
    triage: "5-non-urgent", complaint: "Minor laceration on hand, needs suturing",
    arrivalTime: "10:48", status: "waiting",
    vitals: { bp: "120/78", pulse: 74, temp: 98.6, spo2: 99, rr: 14 },
    attending: "Dr. Robert Hayes", avatarColor: pick(AVATAR_COLORS, 7), waitedMin: 42,
  },
];

// ====================================================================
// IPD / WARD & BED MANAGEMENT
// ====================================================================
export interface Bed {
  id: string;
  ward: string;
  number: string;
  status: "available" | "occupied" | "reserved" | "cleaning" | "maintenance";
  patientName?: string;
  mrn?: string;
  admittedOn?: string;
  expectedDischarge?: string;
  attending?: string;
  condition?: "stable" | "observation" | "critical" | "serious";
}

export const WARDS = [
  { id: "icu", name: "ICU", total: 12, available: 2, color: "oklch(0.65 0.200 15)" },
  { id: "ccu", name: "CCU", total: 8, available: 1, color: "oklch(0.535 0.195 245)" },
  { id: "gwa", name: "General Ward A", total: 30, available: 8, color: "oklch(0.62 0.150 200)" },
  { id: "gwb", name: "General Ward B", total: 30, available: 12, color: "oklch(0.62 0.130 240)" },
  { id: "ped", name: "Pediatric", total: 18, available: 9, color: "oklch(0.72 0.160 75)" },
  { id: "mat", name: "Maternity", total: 14, available: 3, color: "oklch(0.58 0.150 290)" },
];

export const BEDS: Bed[] = [
  { id: "b1", ward: "ICU", number: "ICU-01", status: "occupied", patientName: "Isabella Romano", mrn: "MRN-2024-0004", admittedOn: "Jul 19", expectedDischarge: "Jul 24", attending: "Dr. Sarah Chen", condition: "critical" },
  { id: "b2", ward: "ICU", number: "ICU-02", status: "occupied", patientName: "Marcus Webb", mrn: "MRN-2024-0021", admittedOn: "Jul 19", expectedDischarge: "Jul 22", attending: "Dr. Sarah Chen", condition: "serious" },
  { id: "b3", ward: "ICU", number: "ICU-03", status: "available" },
  { id: "b4", ward: "ICU", number: "ICU-04", status: "cleaning" },
  { id: "b5", ward: "ICU", number: "ICU-05", status: "occupied", patientName: "Liam Patel", mrn: "MRN-2024-0007", admittedOn: "Jul 17", expectedDischarge: "Jul 21", attending: "Dr. James Okoro", condition: "observation" },
  { id: "b6", ward: "ICU", number: "ICU-06", status: "available" },
  { id: "b7", ward: "CCU", number: "CCU-01", status: "occupied", patientName: "Michael Foster", mrn: "MRN-2024-0001", admittedOn: "Jul 18", expectedDischarge: "Jul 22", attending: "Dr. Sarah Chen", condition: "stable" },
  { id: "b8", ward: "CCU", number: "CCU-02", status: "occupied", patientName: "Henry Walsh", mrn: "MRN-2024-0025", admittedOn: "Jul 19", expectedDischarge: "Jul 21", attending: "Dr. Sarah Chen", condition: "observation" },
  { id: "b9", ward: "CCU", number: "CCU-03", status: "available" },
  { id: "b10", ward: "General Ward A", number: "GWA-01", status: "occupied", patientName: "Charlotte Dubois", mrn: "MRN-2024-0012", admittedOn: "Jul 14", expectedDischarge: "Jul 20", attending: "Dr. Sarah Chen", condition: "stable" },
  { id: "b11", ward: "General Ward A", number: "GWA-02", status: "available" },
  { id: "b12", ward: "General Ward A", number: "GWA-03", status: "occupied", patientName: "Daniel Cohen", mrn: "MRN-2024-0023", admittedOn: "Jul 19", expectedDischarge: "Jul 26", attending: "Dr. Robert Hayes", condition: "stable" },
  { id: "b13", ward: "General Ward A", number: "GWA-04", status: "reserved" },
  { id: "b14", ward: "General Ward A", number: "GWA-05", status: "available" },
  { id: "b15", ward: "Pediatric", number: "PED-01", status: "occupied", patientName: "Ethan Nakamura", mrn: "MRN-2024-0003", admittedOn: "Jul 19", expectedDischarge: "Jul 21", attending: "Dr. Priya Anand", condition: "stable" },
  { id: "b16", ward: "Pediatric", number: "PED-02", status: "available" },
  { id: "b17", ward: "Maternity", number: "MAT-01", status: "occupied", patientName: "Aisha Khan", mrn: "MRN-2024-0006", admittedOn: "Jul 19", expectedDischarge: "Jul 21", attending: "Dr. Elena Petrova", condition: "stable" },
  { id: "b18", ward: "Maternity", number: "MAT-02", status: "available" },
];

// ====================================================================
// EMR / Clinical Notes
// ====================================================================
export interface ClinicalNote {
  id: string;
  date: string;
  time: string;
  author: string;
  authorRole: string;
  type: "SOAP" | "Progress" | "Nursing" | "Discharge" | "Admission";
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  content?: string;
}

export interface MedicationRecord {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  route: string;
  startDate: string;
  status: "active" | "completed" | "discontinued";
  prescribedBy: string;
  date?: string;
}

export interface Encounter {
  id: string;
  date: string;
  type: "OPD" | "IPD" | "Emergency" | "Telemedicine" | "Procedure";
  provider: string;
  department: string;
  reason: string;
  diagnosis: string;
}

export const PATIENT_TIMELINE: (ClinicalNote | Encounter | MedicationRecord)[] = [
  { id: "t1", date: "2026-07-19", time: "10:30", author: "Dr. Sarah Chen", authorRole: "Cardiologist", type: "Progress", content: "Patient reports reduced dyspnea after diuretic therapy. Lungs clearer. Continue current management and monitor renal function." } as ClinicalNote,
  { id: "t2", date: "2026-07-19", time: "09:15", author: "Nurse Olivia", authorRole: "ICU Nurse", type: "Nursing", content: "Vital signs stable. Urine output 60ml/hr. Patient comfortable, alert and oriented." } as ClinicalNote,
  { id: "t3", date: "2026-07-19", time: "08:00", author: "Dr. Sarah Chen", authorRole: "Cardiologist", type: "SOAP", subjective: "Chest tightness on exertion for 3 days, worse this morning.", objective: "BP 142/91, HR 88, SpO2 97%. Lungs bibasilar crackles. ECG shows LVH. Echo pending.", assessment: "Hypertensive urgency, suspected CHF exacerbation", plan: "Admit to ICU. Start IV furosemide. Cardiac biomarkers. Echo. BP monitoring q15min." } as ClinicalNote,
  { id: "t4", date: "2026-07-18", type: "Emergency", provider: "Dr. James Okoro", department: "Emergency", reason: "Chest tightness", diagnosis: "Hypertensive urgency" } as Encounter,
  { id: "t5", date: "2026-07-18", name: "Furosemide", dose: "40mg", frequency: "BID", route: "IV", startDate: "2026-07-18", status: "active", prescribedBy: "Dr. Sarah Chen" } as MedicationRecord,
  { id: "t6", date: "2026-07-15", type: "OPD", provider: "Dr. Sarah Chen", department: "Cardiology", reason: "Hypertension follow-up", diagnosis: "Essential hypertension, controlled" } as Encounter,
  { id: "t7", date: "2026-07-15", name: "Losartan", dose: "50mg", frequency: "OD", route: "PO", startDate: "2026-07-15", status: "active", prescribedBy: "Dr. Sarah Chen" } as MedicationRecord,
  { id: "t8", date: "2026-06-20", type: "OPD", provider: "Dr. Sarah Chen", department: "Cardiology", reason: "Annual check-up", diagnosis: "Hypertension, Type 2 Diabetes" } as Encounter,
];

export const ACTIVE_MEDICATIONS: MedicationRecord[] = [
  { id: "m1", name: "Losartan", dose: "50mg", frequency: "OD", route: "PO", startDate: "2026-07-15", status: "active", prescribedBy: "Dr. Sarah Chen" },
  { id: "m2", name: "Metformin", dose: "850mg", frequency: "BID", route: "PO", startDate: "2026-06-15", status: "active", prescribedBy: "Dr. Sarah Chen" },
  { id: "m3", name: "Atorvastatin", dose: "20mg", frequency: "OD", route: "PO", startDate: "2026-06-15", status: "active", prescribedBy: "Dr. Sarah Chen" },
  { id: "m4", name: "Furosemide", dose: "40mg", frequency: "BID", route: "IV", startDate: "2026-07-18", status: "active", prescribedBy: "Dr. Sarah Chen" },
  { id: "m5", name: "Aspirin", dose: "81mg", frequency: "OD", route: "PO", startDate: "2026-06-15", status: "active", prescribedBy: "Dr. Sarah Chen" },
];

// ====================================================================
// NURSING - Care plans and tasks
// ====================================================================
export interface NursingTask {
  id: string;
  patientName: string;
  mrn: string;
  ward: string;
  bed: string;
  task: string;
  scheduledAt: string;
  status: "pending" | "in-progress" | "completed" | "overdue";
  priority: "routine" | "urgent" | "stat";
  avatarColor: string;
}

export const NURSING_TASKS: NursingTask[] = [
  { id: "nt1", patientName: "Isabella Romano", mrn: "MRN-2024-0004", ward: "ICU", bed: "ICU-01", task: "Vital signs check", scheduledAt: "11:00", status: "pending", priority: "stat", avatarColor: pick(AVATAR_COLORS, 3) },
  { id: "nt2", patientName: "Isabella Romano", mrn: "MRN-2024-0004", ward: "ICU", bed: "ICU-01", task: "Administer IV Furosemide", scheduledAt: "11:30", status: "pending", priority: "urgent", avatarColor: pick(AVATAR_COLORS, 3) },
  { id: "nt3", patientName: "Marcus Webb", mrn: "MRN-2024-0021", ward: "ICU", bed: "ICU-02", task: "12-lead ECG", scheduledAt: "10:45", status: "in-progress", priority: "urgent", avatarColor: pick(AVATAR_COLORS, 0) },
  { id: "nt4", patientName: "Michael Foster", mrn: "MRN-2024-0001", ward: "CCU", bed: "CCU-01", task: "Blood glucose monitoring", scheduledAt: "11:00", status: "pending", priority: "routine", avatarColor: pick(AVATAR_COLORS, 0) },
  { id: "nt5", patientName: "Charlotte Dubois", mrn: "MRN-2024-0012", ward: "GWA", bed: "GWA-01", task: "Wound dressing change", scheduledAt: "10:30", status: "overdue", priority: "urgent", avatarColor: pick(AVATAR_COLORS, 3) },
  { id: "nt6", patientName: "Liam Patel", mrn: "MRN-2024-0007", ward: "ICU", bed: "ICU-05", task: "Nebulization", scheduledAt: "11:15", status: "pending", priority: "routine", avatarColor: pick(AVATAR_COLORS, 6) },
  { id: "nt7", patientName: "Ethan Nakamura", mrn: "MRN-2024-0003", ward: "PED", bed: "PED-01", task: "Temperature check", scheduledAt: "11:00", status: "pending", priority: "routine", avatarColor: pick(AVATAR_COLORS, 2) },
  { id: "nt8", patientName: "Daniel Cohen", mrn: "MRN-2024-0023", ward: "GWA", bed: "GWA-03", task: "Pain assessment", scheduledAt: "10:50", status: "completed", priority: "routine", avatarColor: pick(AVATAR_COLORS, 4) },
  { id: "nt9", patientName: "Aisha Khan", mrn: "MRN-2024-0006", ward: "MAT", bed: "MAT-01", task: "Fetal heart rate monitoring", scheduledAt: "11:30", status: "pending", priority: "urgent", avatarColor: pick(AVATAR_COLORS, 5) },
  { id: "nt10", patientName: "Henry Walsh", mrn: "MRN-2024-0025", ward: "CCU", bed: "CCU-02", task: "Neurological check", scheduledAt: "11:00", status: "pending", priority: "urgent", avatarColor: pick(AVATAR_COLORS, 6) },
];

// ====================================================================
// RADIOLOGY / Imaging
// ====================================================================
export interface ImagingStudy {
  id: string;
  accession: string;
  patientName: string;
  mrn: string;
  modality: "X-Ray" | "CT" | "MRI" | "Ultrasound" | "Mammography" | "Fluoroscopy";
  bodyPart: string;
  orderedBy: string;
  orderedAt: string;
  status: "scheduled" | "in-progress" | "completed" | "reported" | "verified";
  priority: "routine" | "urgent" | "stat";
  radiologist?: string;
  finding?: string;
  avatarColor: string;
}

export const IMAGING_STUDIES: ImagingStudy[] = [
  { id: "r1", accession: "RAD-2026-0231", patientName: "Liam Patel", mrn: "MRN-2024-0007", modality: "X-Ray", bodyPart: "Chest PA", orderedBy: "Dr. James Okoro", orderedAt: "08:30", status: "verified", priority: "urgent", radiologist: "Dr. Aisha Patel", finding: "Bilateral infiltrates consistent with COPD exacerbation. No pneumothorax.", avatarColor: pick(AVATAR_COLORS, 6) },
  { id: "r2", accession: "RAD-2026-0232", patientName: "Daniel Okafor", mrn: "MRN-2024-0005", modality: "MRI", bodyPart: "Brain w/ contrast", orderedBy: "Dr. Marcus Reed", orderedAt: "09:40", status: "scheduled", priority: "routine", avatarColor: pick(AVATAR_COLORS, 4) },
  { id: "r3", accession: "RAD-2026-0233", patientName: "Isabella Romano", mrn: "MRN-2024-0004", modality: "CT", bodyPart: "Chest angio", orderedBy: "Dr. Sarah Chen", orderedAt: "09:20", status: "completed", priority: "stat", radiologist: "Dr. Aisha Patel", avatarColor: pick(AVATAR_COLORS, 3) },
  { id: "r4", accession: "RAD-2026-0234", patientName: "Daniel Cohen", mrn: "MRN-2024-0023", modality: "X-Ray", bodyPart: "Right arm", orderedBy: "Dr. Robert Hayes", orderedAt: "10:00", status: "reported", priority: "urgent", radiologist: "Dr. Aisha Patel", finding: "Transverse fracture of right radius. No displacement.", avatarColor: pick(AVATAR_COLORS, 4) },
  { id: "r5", accession: "RAD-2026-0235", patientName: "Priya Sharma", mrn: "MRN-2024-0022", modality: "Ultrasound", bodyPart: "Abdomen", orderedBy: "Dr. James Okoro", orderedAt: "10:10", status: "in-progress", priority: "urgent", avatarColor: pick(AVATAR_COLORS, 1) },
  { id: "r6", accession: "RAD-2026-0236", patientName: "Mia Chen", mrn: "MRN-2024-0010", modality: "Ultrasound", bodyPart: "Thyroid", orderedBy: "Dr. Sarah Chen", orderedAt: "10:30", status: "scheduled", priority: "routine", avatarColor: pick(AVATAR_COLORS, 1) },
  { id: "r7", accession: "RAD-2026-0237", patientName: "Marcus Webb", mrn: "MRN-2024-0021", modality: "CT", bodyPart: "Coronary angiogram", orderedBy: "Dr. Sarah Chen", orderedAt: "09:45", status: "completed", priority: "stat", radiologist: "Dr. Aisha Patel", avatarColor: pick(AVATAR_COLORS, 0) },
];

// ====================================================================
// FINANCE - P&L and expenses
// ====================================================================
export interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  vendor: string;
  status: "paid" | "pending" | "overdue";
  paymentMethod: string;
}

export const EXPENSES: ExpenseRecord[] = [
  { id: "ex1", date: "2026-07-18", category: "Payroll", description: "Staff salaries — July (week 3)", amount: 68000, vendor: "Internal", status: "paid", paymentMethod: "Bank transfer" },
  { id: "ex2", date: "2026-07-17", category: "Pharmacy", description: "Medicine restock — PharmaCorp", amount: 14200, vendor: "PharmaCorp", status: "paid", paymentMethod: "Bank transfer" },
  { id: "ex3", date: "2026-07-16", category: "Utilities", description: "Electricity — July", amount: 8400, vendor: "Pacific Power", status: "paid", paymentMethod: "Auto-debit" },
  { id: "ex4", date: "2026-07-15", category: "Equipment", description: "ECG machine maintenance", amount: 2200, vendor: "MedEquip Services", status: "paid", paymentMethod: "Check" },
  { id: "ex5", date: "2026-07-14", category: "Supplies", description: "Surgical consumables", amount: 5800, vendor: "MediSupply Co", status: "pending", paymentMethod: "Credit terms" },
  { id: "ex6", date: "2026-07-13", category: "IT", description: "Software licenses — Q3", amount: 4200, vendor: "MediCore Systems", status: "paid", paymentMethod: "Credit card" },
  { id: "ex7", date: "2026-07-12", category: "Maintenance", description: "HVAC servicing", amount: 1800, vendor: "CoolAir Inc", status: "pending", paymentMethod: "Bank transfer" },
  { id: "ex8", date: "2026-07-10", category: "Insurance", description: "Professional liability — monthly", amount: 3600, vendor: "MedPro Insurance", status: "paid", paymentMethod: "Auto-debit" },
  { id: "ex9", date: "2026-07-08", category: "Facility", description: "Cleaning services — July", amount: 2400, vendor: "CleanCare", status: "overdue", paymentMethod: "Bank transfer" },
  { id: "ex10", date: "2026-07-05", category: "Pharmacy", description: "Insulin restock — DiabeCare", amount: 8900, vendor: "DiabeCare", status: "paid", paymentMethod: "Bank transfer" },
];

export const EXPENSE_BY_CATEGORY = [
  { category: "Payroll", amount: 68000, color: "oklch(0.535 0.195 245)" },
  { category: "Pharmacy", amount: 23100, color: "oklch(0.62 0.150 200)" },
  { category: "Equipment", amount: 2200, color: "oklch(0.58 0.150 290)" },
  { category: "Utilities", amount: 8400, color: "oklch(0.72 0.160 75)" },
  { category: "Supplies", amount: 5800, color: "oklch(0.65 0.200 15)" },
  { category: "Other", amount: 12000, color: "oklch(0.62 0.130 240)" },
];

export const PROFIT_LOSS = [
  { month: "Jan", revenue: 142000, expense: 98000, profit: 44000 },
  { month: "Feb", revenue: 158000, expense: 102000, profit: 56000 },
  { month: "Mar", revenue: 171000, expense: 108000, profit: 63000 },
  { month: "Apr", revenue: 165000, expense: 105000, profit: 60000 },
  { month: "May", revenue: 184000, expense: 112000, profit: 72000 },
  { month: "Jun", revenue: 196000, expense: 118000, profit: 78000 },
  { month: "Jul", revenue: 212000, expense: 124000, profit: 88000 },
];

// ====================================================================
// HR - Staff directory and attendance
// ====================================================================
export interface StaffMember {
  id: string;
  name: string;
  role: Role;
  department: string;
  email: string;
  phone: string;
  status: "on-duty" | "off-duty" | "on-leave" | "remote";
  shift: "Morning" | "Evening" | "Night";
  rating: number;
  yearsOfService: number;
  avatarColor: string;
  joinDate: string;
}

export const STAFF_DIRECTORY: StaffMember[] = [
  { id: "s1", name: "Dr. Sarah Chen", role: "doctor", department: "Cardiology", email: "s.chen@medicore.io", phone: "+1 (415) 555-0301", status: "on-duty", shift: "Morning", rating: 4.9, yearsOfService: 8, avatarColor: pick(AVATAR_COLORS, 0), joinDate: "2018-03-15" },
  { id: "s2", name: "Dr. Marcus Reed", role: "doctor", department: "Neurology", email: "m.reed@medicore.io", phone: "+1 (415) 555-0302", status: "on-duty", shift: "Morning", rating: 4.7, yearsOfService: 6, avatarColor: pick(AVATAR_COLORS, 4), joinDate: "2020-07-22" },
  { id: "s3", name: "Dr. Priya Anand", role: "doctor", department: "Pediatrics", email: "p.anand@medicore.io", phone: "+1 (415) 555-0303", status: "on-duty", shift: "Morning", rating: 4.95, yearsOfService: 11, avatarColor: pick(AVATAR_COLORS, 5), joinDate: "2015-01-12" },
  { id: "s4", name: "Dr. Robert Hayes", role: "doctor", department: "Orthopedics", email: "r.hayes@medicore.io", phone: "+1 (415) 555-0304", status: "on-duty", shift: "Evening", rating: 4.6, yearsOfService: 5, avatarColor: pick(AVATAR_COLORS, 6), joinDate: "2021-09-01" },
  { id: "s5", name: "Dr. Elena Petrova", role: "doctor", department: "Gynecology", email: "e.petrova@medicore.io", phone: "+1 (415) 555-0305", status: "on-duty", shift: "Morning", rating: 4.85, yearsOfService: 9, avatarColor: pick(AVATAR_COLORS, 7), joinDate: "2017-06-10" },
  { id: "s6", name: "Dr. James Okoro", role: "doctor", department: "Emergency", email: "j.okoro@medicore.io", phone: "+1 (415) 555-0306", status: "on-duty", shift: "Night", rating: 4.8, yearsOfService: 7, avatarColor: pick(AVATAR_COLORS, 2), joinDate: "2019-04-18" },
  { id: "s7", name: "Olivia Brown", role: "nurse", department: "ICU", email: "o.brown@medicore.io", phone: "+1 (415) 555-0311", status: "on-duty", shift: "Morning", rating: 4.8, yearsOfService: 4, avatarColor: pick(AVATAR_COLORS, 1), joinDate: "2022-02-14" },
  { id: "s8", name: "Sophia Martinez", role: "nurse", department: "ICU", email: "s.martinez@medicore.io", phone: "+1 (415) 555-0312", status: "on-duty", shift: "Evening", rating: 4.7, yearsOfService: 3, avatarColor: pick(AVATAR_COLORS, 3), joinDate: "2023-05-08" },
  { id: "s9", name: "Emma Wilson", role: "receptionist", department: "Front Desk", email: "e.wilson@medicore.io", phone: "+1 (415) 555-0321", status: "on-duty", shift: "Morning", rating: 4.5, yearsOfService: 2, avatarColor: pick(AVATAR_COLORS, 7), joinDate: "2024-03-20" },
  { id: "s10", name: "David Kim", role: "pharmacist", department: "Pharmacy", email: "d.kim@medicore.io", phone: "+1 (415) 555-0331", status: "on-duty", shift: "Morning", rating: 4.85, yearsOfService: 6, avatarColor: pick(AVATAR_COLORS, 4), joinDate: "2020-08-15" },
  { id: "s11", name: "Marcus Lee", role: "lab_tech", department: "Laboratory", email: "m.lee@medicore.io", phone: "+1 (415) 555-0341", status: "on-duty", shift: "Morning", rating: 4.6, yearsOfService: 5, avatarColor: pick(AVATAR_COLORS, 0), joinDate: "2021-11-03" },
  { id: "s12", name: "Dr. Aisha Patel", role: "radiologist", department: "Radiology", email: "a.patel@medicore.io", phone: "+1 (415) 555-0351", status: "on-duty", shift: "Morning", rating: 4.9, yearsOfService: 10, avatarColor: pick(AVATAR_COLORS, 5), joinDate: "2016-09-12" },
  { id: "s13", name: "Robert Garcia", role: "accountant", department: "Finance", email: "r.garcia@medicore.io", phone: "+1 (415) 555-0361", status: "on-duty", shift: "Morning", rating: 4.7, yearsOfService: 8, avatarColor: pick(AVATAR_COLORS, 6), joinDate: "2018-01-25" },
  { id: "s14", name: "Linda Martinez", role: "inventory_manager", department: "Inventory", email: "l.martinez@medicore.io", phone: "+1 (415) 555-0371", status: "on-leave", shift: "Morning", rating: 4.65, yearsOfService: 4, avatarColor: pick(AVATAR_COLORS, 2), joinDate: "2022-06-15" },
];

export const ATTENDANCE_TREND = [
  { day: "Mon", present: 118, absent: 6, leave: 4 },
  { day: "Tue", present: 122, absent: 4, leave: 2 },
  { day: "Wed", present: 120, absent: 5, leave: 3 },
  { day: "Thu", present: 124, absent: 3, leave: 1 },
  { day: "Fri", present: 119, absent: 7, leave: 2 },
  { day: "Sat", present: 86, absent: 4, leave: 1 },
  { day: "Sun", present: 64, absent: 3, leave: 2 },
];

// ====================================================================
// REPORTS / BI Dashboards
// ====================================================================
export const DEPARTMENT_PERFORMANCE = [
  { dept: "Cardiology", patients: 142, revenue: 58000, satisfaction: 4.8, efficiency: 92 },
  { dept: "Pediatrics", patients: 96, revenue: 28000, satisfaction: 4.9, efficiency: 88 },
  { dept: "Neurology", patients: 78, revenue: 34000, satisfaction: 4.6, efficiency: 85 },
  { dept: "Orthopedics", patients: 64, revenue: 31000, satisfaction: 4.7, efficiency: 90 },
  { dept: "Emergency", patients: 184, revenue: 42000, satisfaction: 4.5, efficiency: 78 },
  { dept: "Gynecology", patients: 52, revenue: 19000, satisfaction: 4.85, efficiency: 87 },
];

export const PATIENT_SATISFACTION_TREND = [
  { month: "Jan", score: 4.5, response: 380 },
  { month: "Feb", score: 4.6, response: 412 },
  { month: "Mar", score: 4.55, response: 445 },
  { month: "Apr", score: 4.7, response: 460 },
  { month: "May", score: 4.75, response: 488 },
  { month: "Jun", score: 4.8, response: 510 },
  { month: "Jul", score: 4.85, response: 542 },
];

export const READMISSION_RATE = [
  { month: "Jan", rate: 8.2 },
  { month: "Feb", rate: 7.8 },
  { month: "Mar", rate: 7.5 },
  { month: "Apr", rate: 7.1 },
  { month: "May", rate: 6.8 },
  { month: "Jun", rate: 6.5 },
  { month: "Jul", rate: 6.2 },
];

export const AVG_WAIT_TIME = [
  { dept: "Cardiology", time: 18 },
  { dept: "Pediatrics", time: 12 },
  { dept: "Neurology", time: 22 },
  { dept: "Orthopedics", time: 25 },
  { dept: "Emergency", time: 38 },
  { dept: "Gynecology", time: 15 },
];

// ====================================================================
// PHARMACY - Sales and prescriptions
// ====================================================================
export interface Prescription {
  id: string;
  number: string;
  patientName: string;
  mrn: string;
  prescribedBy: string;
  date: string;
  status: "pending" | "filled" | "dispensed" | "cancelled";
  items: { name: string; qty: number; dosage: string }[];
  total: number;
  avatarColor: string;
}

export const PRESCRIPTIONS: Prescription[] = [
  { id: "rx1", number: "RX-2026-1042", patientName: "Michael Foster", mrn: "MRN-2024-0001", prescribedBy: "Dr. Sarah Chen", date: "2026-07-19", status: "pending", items: [{ name: "Furosemide 40mg", qty: 14, dosage: "1 tab BID" }, { name: "Losartan 50mg", qty: 30, dosage: "1 tab OD" }], total: 18.20, avatarColor: pick(AVATAR_COLORS, 0) },
  { id: "rx2", number: "RX-2026-1041", patientName: "Sofia Reyes", mrn: "MRN-2024-0002", prescribedBy: "Dr. Priya Anand", date: "2026-07-19", status: "dispensed", items: [{ name: "Salbutamol Inhaler", qty: 1, dosage: "2 puffs PRN" }, { name: "Cetirizine 10mg", qty: 14, dosage: "1 tab OD" }], total: 9.62, avatarColor: pick(AVATAR_COLORS, 1) },
  { id: "rx3", number: "RX-2026-1040", patientName: "Ethan Nakamura", mrn: "MRN-2024-0003", prescribedBy: "Dr. Priya Anand", date: "2026-07-19", status: "filled", items: [{ name: "Amoxicillin 500mg", qty: 21, dosage: "1 cap TID" }, { name: "Paracetamol 500mg", qty: 20, dosage: "1 tab QID PRN" }], total: 19.45, avatarColor: pick(AVATAR_COLORS, 2) },
  { id: "rx4", number: "RX-2026-1039", patientName: "Isabella Romano", mrn: "MRN-2024-0004", prescribedBy: "Dr. Sarah Chen", date: "2026-07-19", status: "dispensed", items: [{ name: "Furosemide 40mg", qty: 14, dosage: "1 tab BID IV" }, { name: "Atorvastatin 20mg", qty: 30, dosage: "1 tab OD" }], total: 17.40, avatarColor: pick(AVATAR_COLORS, 3) },
  { id: "rx5", number: "RX-2026-1038", patientName: "Daniel Okafor", mrn: "MRN-2024-0005", prescribedBy: "Dr. Marcus Reed", date: "2026-07-19", status: "pending", items: [{ name: "Sumatriptan 50mg", qty: 6, dosage: "1 tab PRN migraine" }], total: 24.30, avatarColor: pick(AVATAR_COLORS, 4) },
  { id: "rx6", number: "RX-2026-1037", patientName: "Mia Chen", mrn: "MRN-2024-0010", prescribedBy: "Dr. Sarah Chen", date: "2026-07-18", status: "dispensed", items: [{ name: "Levothyroxine 50mcg", qty: 30, dosage: "1 tab OD AM" }], total: 12.50, avatarColor: pick(AVATAR_COLORS, 1) },
];

export interface PharmacySale {
  id: string;
  invoice: string;
  customer: string;
  type: "prescription" | "otc";
  items: number;
  total: number;
  time: string;
  status: "completed" | "refunded";
  paymentMethod: string;
}

export const PHARMACY_SALES: PharmacySale[] = [
  { id: "ps1", invoice: "PS-2026-0521", customer: "Sofia Reyes", type: "prescription", items: 2, total: 9.62, time: "09:32", status: "completed", paymentMethod: "Card" },
  { id: "ps2", invoice: "PS-2026-0520", customer: "Walk-in Customer", type: "otc", items: 3, total: 24.50, time: "09:18", status: "completed", paymentMethod: "Cash" },
  { id: "ps3", invoice: "PS-2026-0519", customer: "Isabella Romano", type: "prescription", items: 2, total: 17.40, time: "08:55", status: "completed", paymentMethod: "Insurance" },
  { id: "ps4", invoice: "PS-2026-0518", customer: "Walk-in Customer", type: "otc", items: 1, total: 8.50, time: "08:42", status: "completed", paymentMethod: "Cash" },
  { id: "ps5", invoice: "PS-2026-0517", customer: "Mia Chen", type: "prescription", items: 1, total: 12.50, time: "08:30", status: "completed", paymentMethod: "Card" },
  { id: "ps6", invoice: "PS-2026-0516", customer: "Walk-in Customer", type: "otc", items: 2, total: 15.80, time: "08:15", status: "refunded", paymentMethod: "Cash" },
];

export const PHARMACY_SALES_TREND = [
  { day: "Mon", sales: 1240, transactions: 42 },
  { day: "Tue", sales: 1580, transactions: 56 },
  { day: "Wed", sales: 1320, transactions: 48 },
  { day: "Thu", sales: 1680, transactions: 62 },
  { day: "Fri", sales: 1920, transactions: 68 },
  { day: "Sat", sales: 1450, transactions: 52 },
  { day: "Sun", sales: 890, transactions: 28 },
];

// ====================================================================
// SETTINGS - Users
// ====================================================================
export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited" | "suspended";
  lastActive: string;
  twoFactor: boolean;
  avatarColor: string;
}

export const SYSTEM_USERS: SystemUser[] = [
  { id: "u1", name: "James Whitfield", email: "j.whitfield@medicore.io", role: "admin", status: "active", lastActive: "5 min ago", twoFactor: true, avatarColor: pick(AVATAR_COLORS, 0) },
  { id: "u2", name: "Dr. Sarah Chen", email: "s.chen@medicore.io", role: "doctor", status: "active", lastActive: "2 min ago", twoFactor: true, avatarColor: pick(AVATAR_COLORS, 1) },
  { id: "u3", name: "Olivia Brown", email: "o.brown@medicore.io", role: "nurse", status: "active", lastActive: "12 min ago", twoFactor: false, avatarColor: pick(AVATAR_COLORS, 2) },
  { id: "u4", name: "Emma Wilson", email: "e.wilson@medicore.io", role: "receptionist", status: "active", lastActive: "Just now", twoFactor: false, avatarColor: pick(AVATAR_COLORS, 3) },
  { id: "u5", name: "David Kim", email: "d.kim@medicore.io", role: "pharmacist", status: "active", lastActive: "8 min ago", twoFactor: true, avatarColor: pick(AVATAR_COLORS, 4) },
  { id: "u6", name: "Marcus Lee", email: "m.lee@medicore.io", role: "lab_tech", status: "active", lastActive: "20 min ago", twoFactor: false, avatarColor: pick(AVATAR_COLORS, 5) },
  { id: "u7", name: "Dr. Aisha Patel", email: "a.patel@medicore.io", role: "radiologist", status: "active", lastActive: "1 hr ago", twoFactor: true, avatarColor: pick(AVATAR_COLORS, 6) },
  { id: "u8", name: "Robert Garcia", email: "r.garcia@medicore.io", role: "accountant", status: "active", lastActive: "3 hr ago", twoFactor: true, avatarColor: pick(AVATAR_COLORS, 7) },
  { id: "u9", name: "Linda Martinez", email: "l.martinez@medicore.io", role: "inventory_manager", status: "invited", lastActive: "Never", twoFactor: false, avatarColor: pick(AVATAR_COLORS, 0) },
  { id: "u10", name: "Dr. Hassan Ali", email: "h.ali@medicore.io", role: "doctor", status: "active", lastActive: "Just now", twoFactor: true, avatarColor: pick(AVATAR_COLORS, 4) },
  { id: "u11", name: "Nadia Petrova", email: "n.petrova@medicore.io", role: "pharmacist", status: "active", lastActive: "30 min ago", twoFactor: false, avatarColor: pick(AVATAR_COLORS, 5) },
];

// ====================================================================
// SUPPLIERS / VENDORS
// ====================================================================
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string; // e.g. "Net 30"
  accountBalance: number; // negative = supplier owes us (credit); positive = we owe them
  rating: number; // 0..5
  status: "active" | "inactive" | "blocked";
  categories: string[];
}

export const SUPPLIERS: Supplier[] = [
  { id: "sup1", name: "PharmaCorp Inc.", contactPerson: "Steven Walker", email: "orders@pharmacorp.com", phone: "+1 (415) 555-0901", address: "1200 Industrial Blvd, San Jose, CA", paymentTerms: "Net 30", accountBalance: 18420.50, rating: 4.7, status: "active", categories: ["Antibiotic", "Statin", "PPI"] },
  { id: "sup2", name: "GlobePharma Ltd.", contactPerson: "Maria Gonzalez", email: "sales@globepharma.com", phone: "+1 (415) 555-0902", address: "88 Commerce Dr, Oakland, CA", paymentTerms: "Net 15", accountBalance: 6280.00, rating: 4.5, status: "active", categories: ["Antidiabetic", "Analgesic", "Antihistamine"] },
  { id: "sup3", name: "MediLabs Supplies", contactPerson: "James Park", email: "info@medilabs.com", phone: "+1 (415) 555-0903", address: "45 Medical Way, Sacramento, CA", paymentTerms: "Net 45", accountBalance: -2400.00, rating: 4.8, status: "active", categories: ["Antihypertensive", "Consumable"] },
  { id: "sup4", name: "RespiraCare", contactPerson: "Eleanor Hayes", email: "orders@respiracare.com", phone: "+1 (415) 555-0904", address: "200 Health Ave, San Francisco, CA", paymentTerms: "Net 30", accountBalance: 0, rating: 4.6, status: "active", categories: ["Bronchodilator"] },
  { id: "sup5", name: "DiabeCare Products", contactPerson: "Rajesh Kumar", email: "support@diabecare.com", phone: "+1 (415) 555-0905", address: "12 Diabetes Rd, Berkeley, CA", paymentTerms: "Net 30", accountBalance: 3200.00, rating: 4.4, status: "active", categories: ["Insulin"] },
  { id: "sup6", name: "MedEquip Services", contactPerson: "Linda Shaw", email: "info@medequip.com", phone: "+1 (415) 555-0906", address: "770 Equipment St, San Mateo, CA", paymentTerms: "Net 60", accountBalance: 8900.00, rating: 4.2, status: "active", categories: ["Surgical", "PPE", "Cardiology"] },
];

// ====================================================================
// BLOOD BANK — Donors + initial inventory
// ====================================================================
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export const BLOOD_TYPES: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export type BloodComponent = "whole_blood" | "rbc" | "plasma" | "platelets" | "cryoprecipitate";
export const BLOOD_COMPONENTS: { key: BloodComponent; label: string; shelfLife: number; unit: string }[] = [
  { key: "whole_blood", label: "Whole Blood", shelfLife: 35, unit: "ml" },
  { key: "rbc", label: "Red Blood Cells", shelfLife: 42, unit: "ml" },
  { key: "plasma", label: "Fresh Frozen Plasma", shelfLife: 365, unit: "ml" },
  { key: "platelets", label: "Platelets", shelfLife: 5, unit: "ml" },
  { key: "cryoprecipitate", label: "Cryoprecipitate", shelfLife: 365, unit: "units" },
];

export interface BloodBag {
  id: string;
  bagId: string;
  bloodType: BloodType;
  component: BloodComponent;
  volume: number;
  donorId?: string;
  donorName?: string;
  donationDate: string;
  expiryDate: string;
  batchNo: string;
  location: string;
  status: "available" | "reserved" | "transfused" | "discarded" | "expired";
  notes?: string;
}

export interface BloodDonor {
  id: string;
  name: string;
  bloodType: BloodType;
  age: number;
  gender: "M" | "F";
  phone: string;
  email?: string;
  address?: string;
  lastDonationDate?: string;
  totalDonations: number;
  status: "eligible" | "deferred" | "blocked";
  notes?: string;
  avatarColor: string;
}

// Blood compatibility map: donorType -> compatible recipient types
export const BLOOD_COMPATIBILITY: Record<BloodType, BloodType[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

export const BLOOD_DONORS: BloodDonor[] = [
  { id: "bd1", name: "Carlos Mendez", bloodType: "O-", age: 32, gender: "M", phone: "+1 (415) 555-1001", email: "c.mendez@email.com", address: "88 Pine St, SF", lastDonationDate: "2026-04-12", totalDonations: 8, status: "eligible", avatarColor: pick(AVATAR_COLORS, 0) },
  { id: "bd2", name: "Hannah Lee", bloodType: "A+", age: 28, gender: "F", phone: "+1 (415) 555-1002", email: "h.lee@email.com", lastDonationDate: "2026-06-20", totalDonations: 4, status: "eligible", avatarColor: pick(AVATAR_COLORS, 1) },
  { id: "bd3", name: "Robert King", bloodType: "B+", age: 45, gender: "M", phone: "+1 (415) 555-1003", lastDonationDate: "2026-05-08", totalDonations: 12, status: "eligible", avatarColor: pick(AVATAR_COLORS, 2) },
  { id: "bd4", name: "Sofia Ivanova", bloodType: "AB-", age: 36, gender: "F", phone: "+1 (415) 555-1004", lastDonationDate: "2026-03-15", totalDonations: 6, status: "eligible", avatarColor: pick(AVATAR_COLORS, 3) },
  { id: "bd5", name: "Marcus Johnson", bloodType: "O+", age: 41, gender: "M", phone: "+1 (415) 555-1005", lastDonationDate: "2026-07-01", totalDonations: 15, status: "eligible", avatarColor: pick(AVATAR_COLORS, 4) },
  { id: "bd6", name: "Yuki Tanaka", bloodType: "A-", age: 29, gender: "F", phone: "+1 (415) 555-1006", lastDonationDate: "2026-02-18", totalDonations: 3, status: "deferred", notes: "Low hemoglobin — defer 3 months", avatarColor: pick(AVATAR_COLORS, 5) },
];

// Generate initial blood inventory: 24 bags across types/components
function makeInitialBags(): BloodBag[] {
  const today = new Date("2026-07-20");
  const bags: BloodBag[] = [];
  const seed: Array<[BloodType, BloodComponent, number, number, string, number]> = [
    // [type, component, volume, ageDays, donorName, idx]
    ["O-", "rbc", 350, 5, "Carlos Mendez", 0],
    ["O-", "plasma", 250, 5, "Carlos Mendez", 1],
    ["O+", "rbc", 350, 12, "Marcus Johnson", 2],
    ["O+", "whole_blood", 450, 3, "Marcus Johnson", 3],
    ["A+", "rbc", 350, 8, "Hannah Lee", 4],
    ["A+", "platelets", 200, 2, "Hannah Lee", 5],
    ["A-", "rbc", 350, 18, "Yuki Tanaka", 6],
    ["B+", "rbc", 350, 25, "Robert King", 7],
    ["B+", "plasma", 250, 10, "Robert King", 8],
    ["AB-", "plasma", 250, 30, "Sofia Ivanova", 9],
    ["AB-", "cryoprecipitate", 50, 30, "Sofia Ivanova", 10],
    ["AB+", "rbc", 350, 6, "Sofia Ivanova", 11],
    ["O-", "whole_blood", 450, 1, "Carlos Mendez", 12],
    ["O+", "rbc", 350, 32, "Marcus Johnson", 13],
    ["A+", "plasma", 250, 14, "Hannah Lee", 14],
    ["B+", "platelets", 200, 4, "Robert King", 15],
  ];
  seed.forEach(([bt, comp, vol, ageDays, donorName], i) => {
    const donor = BLOOD_DONORS.find((d) => d.name === donorName);
    const compInfo = BLOOD_COMPONENTS.find((c) => c.key === comp)!;
    const donation = new Date(today);
    donation.setDate(donation.getDate() - ageDays);
    const expiry = new Date(donation);
    expiry.setDate(expiry.getDate() + compInfo.shelfLife);
    const isExpired = expiry < today;
    bags.push({
      id: `bb-${i + 1}`,
      bagId: `BBG-2026-${String(i + 1).padStart(4, "0")}`,
      bloodType: bt,
      component: comp,
      volume: vol,
      donorId: donor?.id,
      donorName,
      donationDate: donation.toISOString().slice(0, 10),
      expiryDate: expiry.toISOString().slice(0, 10),
      batchNo: `BBT-${donation.getFullYear()}${String(donation.getMonth() + 1).padStart(2, "0")}${String(i + 1).padStart(2, "0")}`,
      location: ["Cold Room 1", "Cold Room 2", "Freezer A"][i % 3]!,
      status: isExpired ? "expired" : "available",
    });
  });
  return bags;
}

export const BLOOD_BAGS_SEED: BloodBag[] = makeInitialBags();

// ====================================================================
// HOSPITAL PROFILE + DEFAULT APP SETTINGS
// ====================================================================
export interface HospitalProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  fiscalYearStart: string;
}

export const DEFAULT_HOSPITAL: HospitalProfile = {
  name: "San Francisco Medical Center",
  address: "100 Medical Plaza, San Francisco, CA 94143",
  phone: "+1 (415) 555-0100",
  email: "info@sfmc.io",
  taxId: "US-TX-94-1234567",
  currency: "USD",
  currencySymbol: "$",
  timezone: "America/Los_Angeles",
  fiscalYearStart: "01-01",
};
