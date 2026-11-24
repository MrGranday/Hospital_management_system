"use server";

import { z } from "zod";

import type {
  InvoiceLineUi,
  InvoiceStatus,
  InvoiceUi,
} from "@/features/billing/billing-types";
import {
  hasPermission,
  requirePermission,
} from "@/server/auth/require-permission";
import { createSupabaseServerClient } from "@/server/supabase/server";

const OVERDUE_DAYS = 30;

function deriveStatus(
  dbStatus: string,
  totalMinor: number,
  paidMinor: number,
  creditMinor: number,
  issuedAt: string | null,
): InvoiceStatus {
  if (dbStatus === "voided") return "voided";
  if (dbStatus === "draft") return "draft";
  if (dbStatus === "credited") return "credited";

  const balance = totalMinor - paidMinor - creditMinor;
  if (balance <= 0) return "paid";
  if (paidMinor > 0) return "partial";

  if (issuedAt) {
    const days = (Date.now() - new Date(issuedAt).getTime()) / 86_400_000;
    if (days > OVERDUE_DAYS) return "overdue";
  }

  return "unpaid";
}

function rpcError(message: string): string {
  if (message.includes("amount_exceeds_balance")) {
    return "The payment is more than the outstanding balance.";
  }
  if (message.includes("invoice_paid")) {
    return "This invoice is already paid.";
  }
  if (message.includes("invoice_closed")) {
    return "This invoice is closed and cannot take payments.";
  }
  if (message.includes("invalid_amount")) {
    return "Enter a valid payment amount.";
  }
  if (message.includes("invalid_payment_method")) {
    return "Select a valid payment method.";
  }
  if (message.includes("invalid_patient")) {
    return "Select a valid patient.";
  }
  if (message.includes("invalid_currency")) {
    return "Use a valid 3-letter currency code.";
  }
  if (message.includes("invalid_lines")) {
    return "Add at least one valid line item.";
  }
  if (message.includes("not_authorized")) {
    return "You do not have permission to change billing records.";
  }
  return "The billing request could not be completed. Try again.";
}

export async function listInvoicesForUi() {
  try {
    const context = await requirePermission("billing:read");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const hospitalId = context.hospitalId;
    const supabase = await createSupabaseServerClient();
    const { data: rows, error } = await supabase.rpc("list_invoices", { p_limit: 200 });

    if (error) {
      return { ok: false as const, error: "Could not load invoices. Try again." };
    }

    const invoiceIds = (rows ?? []).map((row) => row.id);
    const linesByInvoice = new Map<string, InvoiceLineUi[]>();

    if (invoiceIds.length > 0) {
      const { data: lineRows, error: linesError } = await supabase
        .from("invoice_lines")
        .select("id, invoice_id, description, quantity, unit_price_minor, line_total_minor")
        .in("invoice_id", invoiceIds)
        .eq("hospital_id", hospitalId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (linesError) {
        return { ok: false as const, error: "Could not load invoice lines. Try again." };
      }

      for (const line of lineRows ?? []) {
        const list = linesByInvoice.get(line.invoice_id) ?? [];
        list.push({
          id: line.id,
          description: line.description,
          quantity: line.quantity,
          unitPriceMinor: line.unit_price_minor,
          lineTotalMinor: line.line_total_minor,
        });
        linesByInvoice.set(line.invoice_id, list);
      }
    }

    const invoices: InvoiceUi[] = (rows ?? []).map((row) => {
      const paidMinor = Number(row.paid_minor);
      const creditMinor = Number(row.credit_minor);
      return {
        id: row.id,
        number: row.invoice_no,
        patientId: row.patient_id,
        patientName: row.patient_name,
        mrn: row.patient_mrn,
        status: deriveStatus(
          row.status,
          row.total_minor,
          paidMinor,
          creditMinor,
          row.issued_at,
        ),
        issuedAt: row.issued_at,
        createdAt: row.created_at,
        subtotalMinor: row.subtotal_minor,
        taxMinor: row.tax_minor,
        totalMinor: row.total_minor,
        paidMinor,
        creditMinor,
        balanceMinor: Math.max(0, row.total_minor - paidMinor - creditMinor),
        currency: row.currency.trim(),
        version: row.version,
        items: linesByInvoice.get(row.id) ?? [],
      };
    });

    return {
      ok: true as const,
      invoices,
      canCreate: hasPermission(context, "billing:create"),
      canUpdate: hasPermission(context, "billing:update"),
      canPrint: hasPermission(context, "billing:print"),
    };
  } catch {
    return { ok: false as const, error: "You do not have permission to view invoices." };
  }
}

const createInputSchema = z.object({
  patientId: z.string().uuid("Select a valid patient."),
  currency: z.string().trim().length(3, "Use a 3-letter currency code.").default("AFN"),
  taxMinor: z.number().int().min(0, "Tax cannot be negative.").default(0),
  status: z.enum(["draft", "issued"]).default("issued"),
  lines: z
    .array(
      z.object({
        description: z.string().trim().min(1, "Enter a line description.").max(300, "Use 300 characters or fewer."),
        quantity: z.number().int().min(1, "Quantity must be at least 1.").max(10_000, "Quantity is too large."),
        unitPriceMinor: z.number().int().min(0, "Unit price cannot be negative."),
      }),
    )
    .min(1, "Add at least one line item.")
    .max(100, "Add 100 line items or fewer."),
});

export async function createInvoiceForUi(input: {
  patientId: string;
  currency?: string;
  taxMinor?: number;
  status?: "draft" | "issued";
  lines: { description: string; quantity: number; unitPriceMinor: number }[];
}) {
  const parsed = createInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Check the invoice details.",
    };
  }

  try {
    const context = await requirePermission("billing:create");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("create_invoice", {
      p_patient_id: parsed.data.patientId,
      p_currency: parsed.data.currency,
      p_tax_minor: parsed.data.taxMinor,
      p_status: parsed.data.status,
      p_lines: parsed.data.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unit_price_minor: line.unitPriceMinor,
      })),
    });

    if (error || !data) {
      return { ok: false as const, error: error ? rpcError(error.message) : "Could not create the invoice. Try again." };
    }

    return { ok: true as const, invoiceId: data };
  } catch {
    return { ok: false as const, error: "You do not have permission to create invoices." };
  }
}

const paymentInputSchema = z.object({
  invoiceId: z.string().uuid("Unknown invoice."),
  amountMinor: z.number().int().min(1, "Enter an amount greater than 0."),
  paymentMethod: z.enum(["cash", "card", "insurance", "transfer"]),
  reference: z.string().trim().max(200, "Use 200 characters or fewer.").optional().default(""),
});

export async function recordPaymentForUi(input: {
  invoiceId: string;
  amountMinor: number;
  paymentMethod: "cash" | "card" | "insurance" | "transfer";
  reference?: string;
}) {
  const parsed = paymentInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Check the payment details.",
    };
  }

  try {
    const context = await requirePermission("billing:create");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("record_invoice_payment", {
      p_invoice_id: parsed.data.invoiceId,
      p_amount_minor: parsed.data.amountMinor,
      p_payment_method: parsed.data.paymentMethod,
      p_reference: parsed.data.reference || null,
    });

    if (error || !data) {
      return { ok: false as const, error: error ? rpcError(error.message) : "Could not record the payment. Try again." };
    }

    return { ok: true as const, paymentId: data };
  } catch {
    return { ok: false as const, error: "You do not have permission to record payments." };
  }
}

const voidInputSchema = z.object({
  invoiceId: z.string().uuid("Unknown invoice."),
  reason: z.string().trim().max(500, "Use 500 characters or fewer.").optional().default(""),
});

export async function voidInvoiceForUi(input: { invoiceId: string; reason?: string }) {
  const parsed = voidInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Unknown invoice.",
    };
  }

  try {
    const context = await requirePermission("billing:update");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("void_invoice", {
      p_invoice_id: parsed.data.invoiceId,
      p_reason: parsed.data.reason,
    });

    if (error) {
      return { ok: false as const, error: rpcError(error.message) };
    }
    if (!data) {
      return { ok: false as const, error: "This invoice cannot be voided." };
    }

    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "You do not have permission to void invoices." };
  }
}
