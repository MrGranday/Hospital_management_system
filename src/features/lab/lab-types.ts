export type LabOrderStatus =
  | "pending"
  | "sample-collected"
  | "in-progress"
  | "completed"
  | "verified"
  | "cancelled";

export type LabPriority = "routine" | "urgent" | "stat";

export type LabOrderTestUi = {
  id: string;
  name: string;
  code: string | null;
  status: string;
  resultValue: string | null;
  resultUnit: string | null;
  referenceRange: string | null;
  isAbnormal: boolean;
  verified: boolean;
  verifiedAt: string | null;
  enteredAt: string | null;
};

export type LabOrderUi = {
  id: string;
  number: string;
  patientId: string;
  patientName: string;
  mrn: string;
  orderedBy: string;
  orderedAt: string;
  collectedAt: string | null;
  completedAt: string | null;
  type: "pathology" | "radiology";
  tests: LabOrderTestUi[];
  status: LabOrderStatus;
  priority: LabPriority;
  resultReady: boolean;
  version: number;
};
