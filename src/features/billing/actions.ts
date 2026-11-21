"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  serviceCreateSchema,
  serviceUpdateSchema,
  invoiceCreateSchema,
  invoiceUpdateSchema,
  invoiceLineCreateSchema,
  paymentCreateSchema,
  creditNoteCreateSchema,
} from "@/lib/billing/schema";
import { requirePermission } from "@/server/auth/require-permission";
import { createSupabaseServerClient } from "@/server/supabase/server";

const NOT_AUTHORIZED = "You do not have permission to change billing records.";

type BillingFormState = { error: string } | undefined;

async function getActor(permission: string) {
  try {
    const context = await requirePermission(permission);
    return context.hospitalId ? { userId: context.userId, hospitalId: context.hospitalId } : null;
  } catch {
    return null;
  }
}

// --- Services ---

export async function createServiceAction(
  _previous: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  const actor = await getActor("billing:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = serviceCreateSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description"),
    unitPriceMinor: formData.get("unitPriceMinor"),
    currency: formData.get("currency"),
    isActive: formData.get("isActive") === "on",
    department: formData.get("department"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the service details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("services").insert({
    hospital_id: actor.hospitalId,
    code: parsed.data.code,
    name: parsed.data.name,
    description: parsed.data.description,
    unit_price_minor: parsed.data.unitPriceMinor,
    currency: parsed.data.currency,
    is_active: parsed.data.isActive,
    department: parsed.data.department,
  });

  if (error) return { error: "Could not create the service. Try again." };

  revalidatePath("/billing/services");
  redirect("/billing/services");
}

export async function updateServiceAction(
  _previous: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  const actor = await getActor("billing:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = serviceUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description"),
    unitPriceMinor: formData.get("unitPriceMinor"),
    currency: formData.get("currency"),
    isActive: formData.get("isActive") === "on",
    department: formData.get("department"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the service details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      unit_price_minor: parsed.data.unitPriceMinor,
      currency: parsed.data.currency,
      is_active: parsed.data.isActive,
      department: parsed.data.department,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save the service. Try again." };
  if (!data) {
    return { error: "This service was changed by someone else. Reload and try again." };
  }

  revalidatePath("/billing/services");
  redirect("/billing/services");
}

// --- Invoices ---

export async function createInvoiceAction(
  _previous: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  const actor = await getActor("billing:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = invoiceCreateSchema.safeParse({
    patientId: formData.get("patientId"),
    status: formData.get("status"),
    subtotalMinor: formData.get("subtotalMinor"),
    taxMinor: formData.get("taxMinor"),
    currency: formData.get("currency"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the invoice details." };
  }

  const supabase = await createSupabaseServerClient();

  // Generate invoice number from hospital counter
  const { data: counter } = await supabase
    .from("hospital_counters")
    .select("next_value")
    .eq("hospital_id", actor.hospitalId)
    .eq("name", "invoice")
    .single();

  const nextValue = (counter as unknown as { next_value: number } | null)?.next_value ?? 1;
  const invoiceNo = `INV-${actor.hospitalId.slice(0, 8)}-${String(nextValue).padStart(6, "0")}`;

  // Increment counter
  await supabase
    .from("hospital_counters")
    .update({ next_value: nextValue + 1 })
    .eq("hospital_id", actor.hospitalId)
    .eq("name", "invoice");

  const { data, error } = await supabase.from("invoices").insert({
    hospital_id: actor.hospitalId,
    patient_id: parsed.data.patientId,
    invoice_no: invoiceNo,
    status: parsed.data.status,
    subtotal_minor: parsed.data.subtotalMinor,
    tax_minor: parsed.data.taxMinor,
    total_minor: parsed.data.subtotalMinor + parsed.data.taxMinor,
    currency: parsed.data.currency,
    issued_at: parsed.data.status === "issued" ? new Date().toISOString() : null,
  }).select("id").single();

  if (error) return { error: "Could not create the invoice. Try again." };
  if (!data) return { error: "Could not create the invoice. Try again." };

  revalidatePath("/billing/invoices");
  redirect(`/billing/invoices/${data.id}`);
}

export async function updateInvoiceAction(
  _previous: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  const actor = await getActor("billing:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = invoiceUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    patientId: formData.get("patientId"),
    status: formData.get("status"),
    subtotalMinor: formData.get("subtotalMinor"),
    taxMinor: formData.get("taxMinor"),
    currency: formData.get("currency"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the invoice details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("invoices")
    .update({
      status: parsed.data.status,
      subtotal_minor: parsed.data.subtotalMinor,
      tax_minor: parsed.data.taxMinor,
      total_minor: parsed.data.subtotalMinor + parsed.data.taxMinor,
      currency: parsed.data.currency,
      issued_at:
        parsed.data.status === "issued" || parsed.data.status === "paid"
          ? new Date().toISOString()
          : null,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save the invoice. Try again." };
  if (!data) {
    return { error: "This invoice was changed by someone else. Reload and try again." };
  }

  revalidatePath("/billing/invoices");
  revalidatePath(`/billing/invoices/${parsed.data.id}`);
  redirect(`/billing/invoices/${parsed.data.id}`);
}

export async function voidInvoiceAction(
  _previous: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  const actor = await getActor("billing:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const invoiceId = formData.get("id");
  const version = formData.get("version");
  const voidReason = formData.get("voidReason");

  if (typeof invoiceId !== "string" || !invoiceId) {
    return { error: "Unknown invoice." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("invoices")
    .update({
      status: "voided",
      voided_at: new Date().toISOString(),
      voided_by: actor.userId,
      void_reason: typeof voidReason === "string" ? voidReason : null,
    })
    .eq("id", invoiceId)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", Number(version))
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not void the invoice. Try again." };
  if (!data) {
    return { error: "This invoice was changed by someone else. Reload and try again." };
  }

  revalidatePath("/billing/invoices");
  revalidatePath(`/billing/invoices/${invoiceId}`);
  redirect(`/billing/invoices/${invoiceId}`);
}

// --- Invoice lines ---

export async function createInvoiceLineAction(
  _previous: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  const actor = await getActor("billing:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = invoiceLineCreateSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    serviceId: formData.get("serviceId"),
    description: formData.get("description"),
    quantity: formData.get("quantity"),
    unitPriceMinor: formData.get("unitPriceMinor"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the invoice line details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("invoice_lines").insert({
    hospital_id: actor.hospitalId,
    invoice_id: parsed.data.invoiceId,
    service_id: parsed.data.serviceId,
    description: parsed.data.description,
    quantity: parsed.data.quantity,
    unit_price_minor: parsed.data.unitPriceMinor,
    line_total_minor: parsed.data.quantity * parsed.data.unitPriceMinor,
  });

  if (error) return { error: "Could not add the invoice line. Try again." };

  revalidatePath(`/billing/invoices/${parsed.data.invoiceId}`);
  redirect(`/billing/invoices/${parsed.data.invoiceId}`);
}

// --- Payments ---

export async function createPaymentAction(
  _previous: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  const actor = await getActor("billing:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = paymentCreateSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    amountMinor: formData.get("amountMinor"),
    currency: formData.get("currency"),
    paymentMethod: formData.get("paymentMethod"),
    reference: formData.get("reference"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the payment details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("payments").insert({
    hospital_id: actor.hospitalId,
    invoice_id: parsed.data.invoiceId,
    amount_minor: parsed.data.amountMinor,
    currency: parsed.data.currency,
    payment_method: parsed.data.paymentMethod,
    reference: parsed.data.reference,
  });

  if (error) return { error: "Could not record the payment. Try again." };

  revalidatePath("/billing/invoices");
  revalidatePath(`/billing/invoices/${parsed.data.invoiceId}`);
  redirect(`/billing/invoices/${parsed.data.invoiceId}`);
}

// --- Credit notes ---

export async function createCreditNoteAction(
  _previous: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  const actor = await getActor("billing:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = creditNoteCreateSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    amountMinor: formData.get("amountMinor"),
    currency: formData.get("currency"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the credit note details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("credit_notes").insert({
    hospital_id: actor.hospitalId,
    invoice_id: parsed.data.invoiceId,
    amount_minor: parsed.data.amountMinor,
    currency: parsed.data.currency,
    reason: parsed.data.reason,
  });

  if (error) return { error: "Could not create the credit note. Try again." };

  revalidatePath("/billing/invoices");
  revalidatePath(`/billing/invoices/${parsed.data.invoiceId}`);
  redirect(`/billing/invoices/${parsed.data.invoiceId}`);
}
