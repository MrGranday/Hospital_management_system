"use server";

import { z } from "zod";

import type {
  LabOrderStatus,
  LabOrderTestUi,
  LabOrderUi,
  LabPriority,
} from "@/features/lab/lab-types";
import {
  hasPermission,
  requirePermission,
} from "@/server/auth/require-permission";
import { createSupabaseServerClient } from "@/server/supabase/server";

const RADIOLOGY_PATTERN =
  /\b(x-?ray|radiograph|ct\b|mri\b|ultrasound|sonograph|mammogra|fluoroscop|pet\s*scan|nuclear\s+scan)/i;

function uiStatus(dbStatus: string, tests: LabOrderTestUi[]): LabOrderStatus {
  if (dbStatus === "cancelled") return "cancelled";

  const active = tests.filter((test) => test.status !== "cancelled");
  if (active.length > 0 && active.every((test) => test.verified)) {
    return "verified";
  }

  if (dbStatus === "completed") return "completed";
  if (dbStatus === "in_progress") return "in-progress";
  if (dbStatus === "sample_collected") return "sample-collected";
  return "pending";
}

function orderType(tests: LabOrderTestUi[]): "pathology" | "radiology" {
  const text = tests.map((test) => `${test.name} ${test.code ?? ""}`).join(" ");
  return RADIOLOGY_PATTERN.test(text) ? "radiology" : "pathology";
}

function priority(value: string): LabPriority {
  if (value === "urgent" || value === "stat") return value;
  return "routine";
}

export async function listLabOrdersForUi() {
  try {
    const context = await requirePermission("lab:read");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const supabase = await createSupabaseServerClient();
    const { data: orderRows, error: ordersError } = await supabase.rpc("list_lab_orders", {
      p_limit: 200,
    });

    if (ordersError) {
      return { ok: false as const, error: "Could not load lab orders. Try again." };
    }

    const orderIds = (orderRows ?? []).map((row) => row.id);
    const itemsByOrder = new Map<string, LabOrderTestUi[]>();

    if (orderIds.length > 0) {
      const { data: itemRows, error: itemsError } = await supabase
        .from("lab_order_items")
        .select(
          "id, lab_order_id, test_name, test_code, status, result_value, result_unit, reference_range, is_abnormal, verified, verified_at, entered_at",
        )
        .in("lab_order_id", orderIds)
        .eq("hospital_id", context.hospitalId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (itemsError) {
        return { ok: false as const, error: "Could not load lab tests. Try again." };
      }

      for (const item of itemRows ?? []) {
        const list = itemsByOrder.get(item.lab_order_id) ?? [];
        list.push({
          id: item.id,
          name: item.test_name,
          code: item.test_code,
          status: item.status,
          resultValue: item.result_value,
          resultUnit: item.result_unit,
          referenceRange: item.reference_range,
          isAbnormal: item.is_abnormal ?? false,
          verified: item.verified === true,
          verifiedAt: item.verified_at,
          enteredAt: item.entered_at,
        });
        itemsByOrder.set(item.lab_order_id, list);
      }
    }

    const orders: LabOrderUi[] = (orderRows ?? []).map((row) => {
      const tests = itemsByOrder.get(row.id) ?? [];
      return {
        id: row.id,
        number: row.order_no,
        patientId: row.patient_id,
        patientName: row.patient_name,
        mrn: row.patient_mrn,
        orderedBy: row.provider_name,
        orderedAt: row.ordered_at,
        collectedAt: row.collected_at,
        completedAt: row.completed_at,
        type: orderType(tests),
        tests,
        status: uiStatus(row.status, tests),
        priority: priority(row.priority),
        resultReady: tests.some(
          (test) => test.resultValue !== null && test.resultValue.trim() !== "",
        ),
        version: row.version,
      };
    });

    return {
      ok: true as const,
      orders,
      canCreate: hasPermission(context, "lab:create"),
      canUpdate: hasPermission(context, "lab:update"),
      canVerify: hasPermission(context, "lab:verify"),
    };
  } catch {
    return { ok: false as const, error: "You do not have permission to view lab orders." };
  }
}

export async function listLabProvidersForUi() {
  try {
    const context = await requirePermission("lab:read");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("list_lab_providers");

    if (error) {
      return { ok: false as const, error: "Could not load providers. Try again." };
    }

    return {
      ok: true as const,
      providers: (data ?? []).map((row) => ({ id: row.user_id, name: row.full_name })),
    };
  } catch {
    return { ok: false as const, error: "You do not have permission to view providers." };
  }
}

const createInputSchema = z.object({
  patientId: z.string().uuid("Select a valid patient."),
  providerId: z.string().uuid("Select a valid provider."),
  priority: z.enum(["routine", "urgent", "stat"]),
  notes: z.string().trim().max(1000, "Use 1000 characters or fewer.").optional().default(""),
  tests: z
    .array(z.string().trim().min(1, "Enter a test name.").max(200, "Use 200 characters or fewer."))
    .min(1, "Add at least one test.")
    .max(50, "Add 50 tests or fewer."),
});

export async function createLabOrderForUi(input: {
  patientId: string;
  providerId: string;
  priority: LabPriority;
  notes?: string;
  tests: string[];
}) {
  const parsed = createInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Check the lab order details.",
    };
  }

  try {
    const context = await requirePermission("lab:create");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("create_lab_order", {
      p_patient_id: parsed.data.patientId,
      p_provider_id: parsed.data.providerId,
      p_priority: parsed.data.priority,
      p_notes: parsed.data.notes || null,
      p_tests: parsed.data.tests,
    });

    if (error || !data) {
      return { ok: false as const, error: "Could not create the lab order. Try again." };
    }

    return { ok: true as const, orderId: data };
  } catch {
    return { ok: false as const, error: "You do not have permission to create lab orders." };
  }
}

const statusInputSchema = z.object({
  orderId: z.string().uuid("Unknown lab order."),
  version: z.number().int().min(1, "Unknown lab order version."),
  status: z.enum(["sample_collected", "in_progress", "completed", "cancelled"]),
});

export async function updateLabOrderStatusForUi(input: {
  orderId: string;
  version: number;
  status: "sample_collected" | "in_progress" | "completed" | "cancelled";
}) {
  const parsed = statusInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid status change.",
    };
  }

  try {
    const context = await requirePermission("lab:update");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const updates: {
      status: string;
      collected_at?: string;
      completed_at?: string;
    } = { status: parsed.data.status };

    if (parsed.data.status === "sample_collected") {
      updates.collected_at = new Date().toISOString();
    }
    if (parsed.data.status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("lab_orders")
      .update(updates)
      .eq("id", parsed.data.orderId)
      .eq("hospital_id", context.hospitalId)
      .eq("version", parsed.data.version)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false as const, error: "Could not update the lab order. Try again." };
    }
    if (!data) {
      return {
        ok: false as const,
        error: "This lab order was changed by someone else. Refresh and try again.",
      };
    }

    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "You do not have permission to update lab orders." };
  }
}

const resultInputSchema = z.object({
  orderId: z.string().uuid("Unknown lab order."),
  results: z
    .array(
      z.object({
        itemId: z.string().uuid("Unknown lab test."),
        resultValue: z.string().trim().min(1, "Enter a result value.").max(500, "Use 500 characters or fewer."),
        resultUnit: z.string().trim().max(50, "Use 50 characters or fewer.").optional().default(""),
        referenceRange: z.string().trim().max(100, "Use 100 characters or fewer.").optional().default(""),
        isAbnormal: z.boolean().default(false),
      }),
    )
    .min(1, "Enter at least one result.")
    .max(100, "Enter 100 results or fewer."),
});

export async function saveLabResultsForUi(input: {
  orderId: string;
  results: {
    itemId: string;
    resultValue: string;
    resultUnit?: string;
    referenceRange?: string;
    isAbnormal?: boolean;
  }[];
}) {
  const parsed = resultInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Check the result details.",
    };
  }

  try {
    const context = await requirePermission("lab:create");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const hospitalId = context.hospitalId;
    const supabase = await createSupabaseServerClient();
    const itemIds = parsed.data.results.map((result) => result.itemId);
    const { data: items, error: itemsError } = await supabase
      .from("lab_order_items")
      .select("id")
      .eq("lab_order_id", parsed.data.orderId)
      .eq("hospital_id", hospitalId)
      .in("id", itemIds)
      .is("deleted_at", null);

    if (itemsError) {
      return { ok: false as const, error: "Could not load the lab tests. Try again." };
    }

    const validIds = new Set((items ?? []).map((item) => item.id));
    const rows = parsed.data.results
      .filter((result) => validIds.has(result.itemId))
      .map((result) => ({
        hospital_id: hospitalId,
        lab_order_item_id: result.itemId,
        result_value: result.resultValue,
        result_unit: result.resultUnit || null,
        reference_range: result.referenceRange || null,
        is_abnormal: result.isAbnormal,
        status: "final",
        entered_by: context.userId,
      }));

    if (rows.length === 0) {
      return { ok: false as const, error: "No valid lab tests were selected." };
    }

    const { error } = await supabase.from("lab_results").insert(rows);
    if (error) {
      return { ok: false as const, error: "Could not save the results. Try again." };
    }

    return { ok: true as const, saved: rows.length };
  } catch {
    return { ok: false as const, error: "You do not have permission to save lab results." };
  }
}

const verifyInputSchema = z.object({
  orderId: z.string().uuid("Unknown lab order."),
});

export async function verifyLabOrderForUi(input: { orderId: string }) {
  const parsed = verifyInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Unknown lab order.",
    };
  }

  try {
    const context = await requirePermission("lab:verify");
    if (!context.hospitalId) {
      return { ok: false as const, error: "No hospital is associated with this account." };
    }

    const supabase = await createSupabaseServerClient();
    const { data: items, error: itemsError } = await supabase
      .from("lab_order_items")
      .select("id, verified")
      .eq("lab_order_id", parsed.data.orderId)
      .eq("hospital_id", context.hospitalId)
      .is("deleted_at", null);

    if (itemsError) {
      return { ok: false as const, error: "Could not load the lab tests. Try again." };
    }

    const unverifiedIds = (items ?? [])
      .filter((item) => item.verified !== true)
      .map((item) => item.id);

    if (unverifiedIds.length === 0) {
      return { ok: false as const, error: "There are no unverified results for this order." };
    }

    const { data: results, error: resultsError } = await supabase
      .from("lab_results")
      .select("id, lab_order_item_id, entered_at")
      .eq("hospital_id", context.hospitalId)
      .in("lab_order_item_id", unverifiedIds)
      .is("deleted_at", null)
      .order("entered_at", { ascending: false });

    if (resultsError) {
      return { ok: false as const, error: "Could not load the lab results. Try again." };
    }

    const latestByItem = new Map<string, string>();
    for (const result of results ?? []) {
      if (!latestByItem.has(result.lab_order_item_id)) {
        latestByItem.set(result.lab_order_item_id, result.id);
      }
    }

    if (latestByItem.size === 0) {
      return {
        ok: false as const,
        error: "Enter and save results before verifying this order.",
      };
    }

    let verified = 0;
    for (const resultId of latestByItem.values()) {
      const { data, error } = await supabase.rpc("verify_lab_result", {
        p_result_id: resultId,
        p_verified: true,
      });
      if (!error && data === true) verified += 1;
    }

    if (verified === 0) {
      return { ok: false as const, error: "Could not verify the results. Try again." };
    }

    return { ok: true as const, verified };
  } catch {
    return { ok: false as const, error: "You do not have permission to verify lab results." };
  }
}
