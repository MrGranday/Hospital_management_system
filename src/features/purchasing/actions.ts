"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  supplierCreateSchema,
  supplierUpdateSchema,
  purchaseOrderCreateSchema,
  purchaseOrderUpdateSchema,
  poLineCreateSchema,
  goodsReceiptCreateSchema,
  purchaseReturnCreateSchema,
} from "@/lib/purchasing/schema";
import { requirePermission } from "@/server/auth/require-permission";
import { createSupabaseServerClient } from "@/server/supabase/server";

const NOT_AUTHORIZED = "You do not have permission to change purchasing records.";

type PurchasingFormState = { error: string } | undefined;

async function getActor(permission: string) {
  try {
    const context = await requirePermission(permission);
    return context.hospitalId ? { userId: context.userId, hospitalId: context.hospitalId } : null;
  } catch {
    return null;
  }
}

// --- Suppliers ---

export async function createSupplierAction(
  _previous: PurchasingFormState,
  formData: FormData,
): Promise<PurchasingFormState> {
  const actor = await getActor("purchasing:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = supplierCreateSchema.safeParse({
    supplierCode: formData.get("supplierCode"),
    name: formData.get("name"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    address: formData.get("address"),
    taxId: formData.get("taxId"),
    paymentTerms: formData.get("paymentTerms"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the supplier details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("suppliers").insert({
    hospital_id: actor.hospitalId,
    supplier_code: parsed.data.supplierCode,
    name: parsed.data.name,
    contact_name: parsed.data.contactName,
    contact_email: parsed.data.contactEmail,
    contact_phone: parsed.data.contactPhone,
    address: parsed.data.address,
    tax_id: parsed.data.taxId,
    payment_terms: parsed.data.paymentTerms,
    is_active: parsed.data.isActive,
  }).select("id").single();

  if (error) return { error: "Could not create the supplier. Try again." };
  if (!data) return { error: "Could not create the supplier. Try again." };

  revalidatePath("/purchasing/suppliers");
  redirect(`/purchasing/suppliers/${data.id}`);
}

export async function updateSupplierAction(
  _previous: PurchasingFormState,
  formData: FormData,
): Promise<PurchasingFormState> {
  const actor = await getActor("purchasing:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = supplierUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    supplierCode: formData.get("supplierCode"),
    name: formData.get("name"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    address: formData.get("address"),
    taxId: formData.get("taxId"),
    paymentTerms: formData.get("paymentTerms"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the supplier details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("suppliers")
    .update({
      name: parsed.data.name,
      contact_name: parsed.data.contactName,
      contact_email: parsed.data.contactEmail,
      contact_phone: parsed.data.contactPhone,
      address: parsed.data.address,
      tax_id: parsed.data.taxId,
      payment_terms: parsed.data.paymentTerms,
      is_active: parsed.data.isActive,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save the supplier. Try again." };
  if (!data) {
    return { error: "This supplier was changed by someone else. Reload and try again." };
  }

  revalidatePath("/purchasing/suppliers");
  redirect(`/purchasing/suppliers/${data.id}`);
}

// --- Purchase orders ---

export async function createPurchaseOrderAction(
  _previous: PurchasingFormState,
  formData: FormData,
): Promise<PurchasingFormState> {
  const actor = await getActor("purchasing:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = purchaseOrderCreateSchema.safeParse({
    supplierId: formData.get("supplierId"),
    status: formData.get("status"),
    subtotalMinor: formData.get("subtotalMinor"),
    taxMinor: formData.get("taxMinor"),
    currency: formData.get("currency"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the purchase order details." };
  }

  const supabase = await createSupabaseServerClient();

  // Generate PO number from hospital counter
  const { data: counter } = await supabase
    .from("hospital_counters")
    .select("next_value")
    .eq("hospital_id", actor.hospitalId)
    .eq("name", "po")
    .single();

  const nextValue = (counter as unknown as { next_value: number } | null)?.next_value ?? 1;
  const poNo = `PO-${actor.hospitalId.slice(0, 8)}-${String(nextValue).padStart(6, "0")}`;

  await supabase
    .from("hospital_counters")
    .update({ next_value: nextValue + 1 })
    .eq("hospital_id", actor.hospitalId)
    .eq("name", "po");

  const { data, error } = await supabase.from("purchase_orders").insert({
    hospital_id: actor.hospitalId,
    supplier_id: parsed.data.supplierId,
    po_no: poNo,
    status: parsed.data.status,
    subtotal_minor: parsed.data.subtotalMinor,
    tax_minor: parsed.data.taxMinor,
    total_minor: parsed.data.subtotalMinor + parsed.data.taxMinor,
    currency: parsed.data.currency,
    notes: parsed.data.notes,
  }).select("id").single();

  if (error) return { error: "Could not create the purchase order. Try again." };
  if (!data) return { error: "Could not create the purchase order. Try again." };

  revalidatePath("/purchasing/orders");
  redirect(`/purchasing/orders/${data.id}`);
}

export async function updatePurchaseOrderAction(
  _previous: PurchasingFormState,
  formData: FormData,
): Promise<PurchasingFormState> {
  const actor = await getActor("purchasing:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = purchaseOrderUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    supplierId: formData.get("supplierId"),
    status: formData.get("status"),
    subtotalMinor: formData.get("subtotalMinor"),
    taxMinor: formData.get("taxMinor"),
    currency: formData.get("currency"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the purchase order details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .update({
      status: parsed.data.status,
      subtotal_minor: parsed.data.subtotalMinor,
      tax_minor: parsed.data.taxMinor,
      total_minor: parsed.data.subtotalMinor + parsed.data.taxMinor,
      currency: parsed.data.currency,
      notes: parsed.data.notes,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save the purchase order. Try again." };
  if (!data) {
    return { error: "This purchase order was changed by someone else. Reload and try again." };
  }

  revalidatePath("/purchasing/orders");
  redirect(`/purchasing/orders/${data.id}`);
}

// --- PO lines ---

export async function createPoLineAction(
  _previous: PurchasingFormState,
  formData: FormData,
): Promise<PurchasingFormState> {
  const actor = await getActor("purchasing:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = poLineCreateSchema.safeParse({
    purchaseOrderId: formData.get("purchaseOrderId"),
    itemId: formData.get("itemId"),
    description: formData.get("description"),
    quantity: formData.get("quantity"),
    unitPriceMinor: formData.get("unitPriceMinor"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the PO line details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("po_lines").insert({
    hospital_id: actor.hospitalId,
    purchase_order_id: parsed.data.purchaseOrderId,
    item_id: parsed.data.itemId ?? undefined,
    description: parsed.data.description,
    quantity: parsed.data.quantity,
    unit_price_minor: parsed.data.unitPriceMinor,
    line_total_minor: parsed.data.quantity * parsed.data.unitPriceMinor,
  });

  if (error) return { error: "Could not add the PO line. Try again." };

  revalidatePath(`/purchasing/orders/${parsed.data.purchaseOrderId}`);
  redirect(`/purchasing/orders/${parsed.data.purchaseOrderId}`);
}

// --- Goods receipts ---

export async function createGoodsReceiptAction(
  _previous: PurchasingFormState,
  formData: FormData,
): Promise<PurchasingFormState> {
  const actor = await getActor("purchasing:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = goodsReceiptCreateSchema.safeParse({
    purchaseOrderId: formData.get("purchaseOrderId"),
    receiptNo: formData.get("receiptNo"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the goods receipt details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("goods_receipts").insert({
    hospital_id: actor.hospitalId,
    purchase_order_id: parsed.data.purchaseOrderId,
    receipt_no: parsed.data.receiptNo,
    received_by: actor.userId,
    notes: parsed.data.notes,
  });

  if (error) return { error: "Could not create the goods receipt. Try again." };

  revalidatePath("/purchasing/orders");
  revalidatePath(`/purchasing/orders/${parsed.data.purchaseOrderId}`);
  redirect(`/purchasing/orders/${parsed.data.purchaseOrderId}`);
}

// --- Purchase returns ---

export async function createPurchaseReturnAction(
  _previous: PurchasingFormState,
  formData: FormData,
): Promise<PurchasingFormState> {
  const actor = await getActor("purchasing:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = purchaseReturnCreateSchema.safeParse({
    purchaseOrderId: formData.get("purchaseOrderId"),
    goodsReceiptId: formData.get("goodsReceiptId"),
    status: formData.get("status"),
    reason: formData.get("reason"),
    amountMinor: formData.get("amountMinor"),
    currency: formData.get("currency"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the purchase return details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("purchase_returns").insert({
    hospital_id: actor.hospitalId,
    purchase_order_id: parsed.data.purchaseOrderId ?? undefined,
    goods_receipt_id: parsed.data.goodsReceiptId ?? undefined,
    return_no: `RET-${actor.hospitalId.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`,
    status: parsed.data.status,
    reason: parsed.data.reason,
    amount_minor: parsed.data.amountMinor,
    currency: parsed.data.currency,
  });

  if (error) return { error: "Could not create the purchase return. Try again." };

  revalidatePath("/purchasing/returns");
  redirect("/purchasing/returns");
}
