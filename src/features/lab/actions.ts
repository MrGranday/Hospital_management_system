"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  labOrderCreateSchema,
  labOrderUpdateSchema,
  labOrderItemCreateSchema,
  labResultCreateSchema,
} from "@/lib/lab/schema";
import { requirePermission } from "@/server/auth/require-permission";
import { createSupabaseServerClient } from "@/server/supabase/server";

const NOT_AUTHORIZED = "You do not have permission to change lab records.";

type LabFormState = { error: string } | undefined;

async function getActor(permission: string) {
  try {
    const context = await requirePermission(permission);
    return context.hospitalId ? { userId: context.userId, hospitalId: context.hospitalId } : null;
  } catch {
    return null;
  }
}

// --- Lab orders ---

export async function createLabOrderAction(
  _previous: LabFormState,
  formData: FormData,
): Promise<LabFormState> {
  const actor = await getActor("lab:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = labOrderCreateSchema.safeParse({
    patientId: formData.get("patientId"),
    visitId: formData.get("visitId"),
    providerId: formData.get("providerId"),
    priority: formData.get("priority"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the lab order details." };
  }

  const supabase = await createSupabaseServerClient();

  // Generate order number from hospital counter
  const { data: counter } = await supabase
    .from("hospital_counters")
    .select("next_value")
    .eq("hospital_id", actor.hospitalId)
    .eq("name", "lab_order")
    .single();

  const nextValue = (counter as unknown as { next_value: number } | null)?.next_value ?? 1;
  const orderNo = `LAB-${actor.hospitalId.slice(0, 8)}-${String(nextValue).padStart(6, "0")}`;

  await supabase
    .from("hospital_counters")
    .update({ next_value: nextValue + 1 })
    .eq("hospital_id", actor.hospitalId)
    .eq("name", "lab_order");

  const { data, error } = await supabase.from("lab_orders").insert({
    hospital_id: actor.hospitalId,
    patient_id: parsed.data.patientId,
    visit_id: parsed.data.visitId ?? undefined,
    provider_id: parsed.data.providerId,
    order_no: orderNo,
    status: "ordered",
    priority: parsed.data.priority,
    notes: parsed.data.notes,
  });

  if (error) return { error: "Could not create the lab order. Try again." };

  revalidatePath("/lab/orders");
  redirect("/lab/orders");
}

export async function updateLabOrderAction(
  _previous: LabFormState,
  formData: FormData,
): Promise<LabFormState> {
  const actor = await getActor("lab:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = labOrderUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    patientId: formData.get("patientId"),
    visitId: formData.get("visitId"),
    providerId: formData.get("providerId"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the lab order details." };
  }

  const supabase = await createSupabaseServerClient();
  const updates: { status: string; priority: string; notes: string | null | undefined; collected_at?: string; completed_at?: string } = {
    status: parsed.data.status,
    priority: parsed.data.priority,
    notes: parsed.data.notes,
  };

  if (parsed.data.status === "sample_collected") {
    updates.collected_at = new Date().toISOString();
  }
  if (parsed.data.status === "completed") {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("lab_orders")
    .update(updates)
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save the lab order. Try again." };
  if (!data) {
    return { error: "This lab order was changed by someone else. Reload and try again." };
  }

  revalidatePath("/lab/orders");
  redirect(`/lab/orders/${data.id}`);
}

// --- Lab order items ---

export async function createLabOrderItemAction(
  _previous: LabFormState,
  formData: FormData,
): Promise<LabFormState> {
  const actor = await getActor("lab:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = labOrderItemCreateSchema.safeParse({
    labOrderId: formData.get("labOrderId"),
    testName: formData.get("testName"),
    testCode: formData.get("testCode"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the lab test details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("lab_order_items").insert({
    hospital_id: actor.hospitalId,
    lab_order_id: parsed.data.labOrderId,
    test_name: parsed.data.testName,
    test_code: parsed.data.testCode,
    status: "pending",
  });

  if (error) return { error: "Could not add the lab test. Try again." };

  revalidatePath(`/lab/orders/${parsed.data.labOrderId}`);
  redirect(`/lab/orders/${parsed.data.labOrderId}`);
}

// --- Lab results ---

export async function createLabResultAction(
  _previous: LabFormState,
  formData: FormData,
): Promise<LabFormState> {
  const actor = await getActor("lab:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = labResultCreateSchema.safeParse({
    labOrderItemId: formData.get("labOrderItemId"),
    resultValue: formData.get("resultValue"),
    resultUnit: formData.get("resultUnit"),
    referenceRange: formData.get("referenceRange"),
    isAbnormal: formData.get("isAbnormal") === "on",
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the result details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("lab_results").insert({
    hospital_id: actor.hospitalId,
    lab_order_item_id: parsed.data.labOrderItemId,
    result_value: parsed.data.resultValue,
    result_unit: parsed.data.resultUnit,
    reference_range: parsed.data.referenceRange,
    is_abnormal: parsed.data.isAbnormal,
    status: parsed.data.status,
    entered_by: actor.userId,
  });

  if (error) return { error: "Could not record the result. Try again." };

  revalidatePath(`/lab/orders`);
  redirect(`/lab/orders`);
}

export async function verifyLabResultAction(
  _previous: LabFormState,
  formData: FormData,
): Promise<LabFormState> {
  const actor = await getActor("lab:verify");
  if (!actor) return { error: NOT_AUTHORIZED };

  const resultId = formData.get("resultId");
  if (typeof resultId !== "string" || !resultId) {
    return { error: "Unknown lab result." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("verify_lab_result", {
    p_result_id: resultId,
    p_verified: true,
  });

  if (error) return { error: "Could not verify the result. Try again." };

  revalidatePath("/lab/orders");
  return undefined;
}
