export type OpdVisitStatus = "waiting" | "vitals" | "consultation" | "completed";

export type OpdVitals = {
  bp: string;
  pulse: number | string;
  temp: number | string;
  spo2: number | string;
  weight: number | string;
  height: number | string;
};

export type OpdVisitUi = {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  doctorId: string;
  doctorName: string;
  status: OpdVisitStatus;
  checkInTime: string;
  reason: string;
  age: number | null;
  gender: "M" | "F" | "?";
  avatarColor: string;
  version: number;
  vitals?: OpdVitals;
};
