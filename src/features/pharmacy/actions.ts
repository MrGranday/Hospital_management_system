"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  stockLocationCreateSchema,
  stockLocationUpdateSchema,
  itemCreateSchema,
  itemUpdateSchema,
  itemBatchCreateSchema,
  itemBatchUpdateSchema,
  stockMovementCreateSchema,
  dispensationCreateSchema,
  stockAdjustmentCreateSchema,
} from "@/lib/pharmacy/schema";
import { requirePermission } from "@/server/auth/require-permission";
import { createSupabaseServerClient } from "@/server/supabase/server";

const NOT_AUTHORIZED = "You do not have permission to change inventory records.";

type PharmacyFormState = { error: string } | undefined;

async function getActor(permission: string) {
  try {
    const context = await requirePermission(permission);
    return context.hospitalId ? { userId: context.userId, hospitalId: context.hospitalId } : null;
  } catch {
    return null;
  }
}

// --- Stock locations ---

export async function createStockLocationAction(
  _previous: PharmacyFormState,
  formData: FormData,
): Promise<PharmacyFormState> {
  const actor = await getActor("inventory:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = stockLocationCreateSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the location details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("stock_locations").insert({
    hospital_id: actor.hospitalId,
    name: parsed.data.name,
    type: parsed.data.type,
    is_active: parsed.data.isActive,
  });

  if (error) return { error: "Could not create the stock location. Try again." };

  revalidatePath("/inventory/locations");
  redirect("/inventory/locations");
}

export async function updateStockLocationAction(
  _previous: PharmacyFormState,
  formData: FormData,
): Promise<PharmacyFormState> {
  const actor = await getActor("inventory:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = stockLocationUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    name: formData.get("name"),
    type: formData.get("type"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the location details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("stock_locations")
    .update({
      name: parsed.data.name,
      type: parsed.data.type,
      is_active: parsed.data.isActive,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save the location. Try again." };
  if (!data) {
    return { error: "This location was changed by someone else. Reload and try again." };
  }

  revalidatePath("/inventory/locations");
  redirect(`/inventory/locations/${data.id}`);
}

// --- Items ---

export async function createItemAction(
  _previous: PharmacyFormState,
  formData: FormData,
): Promise<PharmacyFormState> {
  const actor = await getActor("inventory:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = itemCreateSchema.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    unit: formData.get("unit"),
    isActive: formData.get("isActive") === "on",
    requiresPrescription: formData.get("requiresPrescription") === "on",
    isControlled: formData.get("isControlled") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the item details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("items").insert({
    hospital_id: actor.hospitalId,
    sku: parsed.data.sku,
    name: parsed.data.name,
    description: parsed.data.description,
    category: parsed.data.category,
    unit: parsed.data.unit,
    is_active: parsed.data.isActive,
    requires_prescription: parsed.data.requiresPrescription,
    is_controlled: parsed.data.isControlled,
  });

  if (error) return { error: "Could not create the item. Try again." };

  revalidatePath("/inventory/items");
  redirect("/inventory/items");
}

export async function updateItemAction(
  _previous: PharmacyFormState,
  formData: FormData,
): Promise<PharmacyFormState> {
  const actor = await getActor("inventory:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = itemUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    sku: formData.get("sku"),
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    unit: formData.get("unit"),
    isActive: formData.get("isActive") === "on",
    requiresPrescription: formData.get("requiresPrescription") === "on",
    isControlled: formData.get("isControlled") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the item details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("items")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      unit: parsed.data.unit,
      is_active: parsed.data.isActive,
      requires_prescription: parsed.data.requiresPrescription,
      is_controlled: parsed.data.isControlled,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save the item. Try again." };
  if (!data) {
    return { error: "This item was changed by someone else. Reload and try again." };
  }

  revalidatePath("/inventory/items");
  redirect(`/inventory/items/${data.id}`);
}

// --- Item batches ---

export async function createItemBatchAction(
  _previous: PharmacyFormState,
  formData: FormData,
): Promise<PharmacyFormState> {
  const actor = await getActor("inventory:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = itemBatchCreateSchema.safeParse({
    itemId: formData.get("itemId"),
    batchNo: formData.get("batchNo"),
    expiryDate: formData.get("expiryDate"),
    costPriceMinor: formData.get("costPriceMinor"),
    salePriceMinor: formData.get("salePriceMinor"),
    currency: formData.get("currency"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the batch details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("item_batches").insert({
    hospital_id: actor.hospitalId,
    item_id: parsed.data.itemId,
    batch_no: parsed.data.batchNo,
    expiry_date: parsed.data.expiryDate,
    cost_price_minor: parsed.data.costPriceMinor,
    sale_price_minor: parsed.data.salePriceMinor,
    currency: parsed.data.currency,
    received_by: actor.userId,
  });

  if (error) return { error: "Could not create the batch. Try again." };

  revalidatePath("/inventory/batches");
  redirect("/inventory/batches");
}

export async function updateItemBatchAction(
  _previous: PharmacyFormState,
  formData: FormData,
): Promise<PharmacyFormState> {
  const actor = await getActor("inventory:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = itemBatchUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    itemId: formData.get("itemId"),
    batchNo: formData.get("batchNo"),
    expiryDate: formData.get("expiryDate"),
    costPriceMinor: formData.get("costPriceMinor"),
    salePriceMinor: formData.get("salePriceMinor"),
    currency: formData.get("currency"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the batch details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("item_batches")
    .update({
      batch_no: parsed.data.batchNo,
      expiry_date: parsed.data.expiryDate,
      cost_price_minor: parsed.data.costPriceMinor,
      sale_price_minor: parsed.data.salePriceMinor,
      currency: parsed.data.currency,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save the batch. Try again." };
  if (!data) {
    return { error: "This batch was changed by someone else. Reload and try again." };
  }

  revalidatePath("/inventory/batches");
  redirect(`/inventory/batches/${data.id}`);
}

// --- Stock movements ---

export async function createStockMovementAction(
  _previous: PharmacyFormState,
  formData: FormData,
): Promise<PharmacyFormState> {
  const actor = await getActor("inventory:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = stockMovementCreateSchema.safeParse({
    itemId: formData.get("itemId"),
    batchId: formData.get("batchId"),
    locationId: formData.get("locationId"),
    movementType: formData.get("movementType"),
    quantity: formData.get("quantity"),
    referenceType: formData.get("referenceType"),
    referenceId: formData.get("referenceId"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the movement details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("stock_movements").insert({
    hospital_id: actor.hospitalId,
    item_id: parsed.data.itemId,
    batch_id: parsed.data.batchId ?? undefined,
    location_id: parsed.data.locationId ?? undefined,
    movement_type: parsed.data.movementType,
    quantity: parsed.data.movementType === "out" || parsed.data.movementType === "expired" || parsed.data.movementType === "damaged"
      ? -Math.abs(parsed.data.quantity)
      : Math.abs(parsed.data.quantity),
    reference_type: parsed.data.referenceType,
    reference_id: parsed.data.referenceId,
    notes: parsed.data.notes,
    created_by: actor.userId,
  });

  if (error) return { error: "Could not record the stock movement. Try again." };

  revalidatePath("/inventory/movements");
  revalidatePath(`/inventory/items/${parsed.data.itemId}`);
  redirect(`/inventory/items/${parsed.data.itemId}`);
}

// --- Dispensations ---

export async function createDispensationAction(
  _previous: PharmacyFormState,
  formData: FormData,
): Promise<PharmacyFormState> {
  const actor = await getActor("pharmacy:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = dispensationCreateSchema.safeParse({
    prescriptionId: formData.get("prescriptionId"),
    prescriptionItemId: formData.get("prescriptionItemId"),
    stockMovementId: formData.get("stockMovementId"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the dispensation details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("dispensations").insert({
    hospital_id: actor.hospitalId,
    prescription_id: parsed.data.prescriptionId,
    prescription_item_id: parsed.data.prescriptionItemId,
    stock_movement_id: parsed.data.stockMovementId,
    dispensed_by: actor.userId,
    notes: parsed.data.notes,
  });

  if (error) return { error: "Could not record the dispensation. Try again." };

  revalidatePath(`/prescriptions/${parsed.data.prescriptionId}`);
  redirect(`/prescriptions/${parsed.data.prescriptionId}`);
}

// --- Stock adjustments ---

export async function createStockAdjustmentAction(
  _previous: PharmacyFormState,
  formData: FormData,
): Promise<PharmacyFormState> {
  const actor = await getActor("inventory:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = stockAdjustmentCreateSchema.safeParse({
    movementId: formData.get("movementId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the adjustment details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("stock_adjustments").insert({
    hospital_id: actor.hospitalId,
    movement_id: parsed.data.movementId,
    reason: parsed.data.reason,
    created_by: actor.userId,
  });

  if (error) return { error: "Could not create the stock adjustment. Try again." };

  revalidatePath("/inventory/adjustments");
  redirect("/inventory/adjustments");
}
