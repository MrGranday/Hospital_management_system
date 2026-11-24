export type InvoiceStatus =
  | "paid"
  | "partial"
  | "unpaid"
  | "overdue"
  | "voided"
  | "draft"
  | "credited";

export type InvoiceLineUi = {
  id: string;
  description: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
};

export type InvoiceUi = {
  id: string;
  number: string;
  patientId: string;
  patientName: string;
  mrn: string;
  status: InvoiceStatus;
  issuedAt: string | null;
  createdAt: string;
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  paidMinor: number;
  creditMinor: number;
  balanceMinor: number;
  currency: string;
  version: number;
  items: InvoiceLineUi[];
};
