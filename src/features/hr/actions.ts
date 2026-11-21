"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  departmentCreateSchema,
  departmentUpdateSchema,
  staffCreateSchema,
  staffUpdateSchema,
  shiftCreateSchema,
  shiftUpdateSchema,
  attendanceCreateSchema,
  attendanceUpdateSchema,
  leaveRequestCreateSchema,
  leaveRequestUpdateSchema,
} from "@/lib/hr/schema";
import { requirePermission } from "@/server/auth/require-permission";
import { createSupabaseServerClient } from "@/server/supabase/server";

const NOT_AUTHORIZED = "You do not have permission to change HR records.";

type HrFormState = { error: string } | undefined;

async function getActor(permission: string) {
  try {
    const context = await requirePermission(permission);
    return context.hospitalId ? { userId: context.userId, hospitalId: context.hospitalId } : null;
  } catch {
    return null;
  }
}

// --- Departments ---

export async function createDepartmentAction(
  _previous: HrFormState,
  formData: FormData,
): Promise<HrFormState> {
  const actor = await getActor("hr:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = departmentCreateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the department details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("departments").insert({
    hospital_id: actor.hospitalId,
    name: parsed.data.name,
    description: parsed.data.description,
    is_active: parsed.data.isActive,
  }).select("id").single();

  if (error) return { error: "Could not create the department. Try again." };
  if (!data) return { error: "Could not create the department. Try again." };

  revalidatePath("/hr/departments");
  redirect(`/hr/departments/${data.id}`);
}

export async function updateDepartmentAction(
  _previous: HrFormState,
  formData: FormData,
): Promise<HrFormState> {
  const actor = await getActor("hr:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = departmentUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    name: formData.get("name"),
    description: formData.get("description"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the department details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("departments")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      is_active: parsed.data.isActive,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save the department. Try again." };
  if (!data) {
    return { error: "This department was changed by someone else. Reload and try again." };
  }

  revalidatePath("/hr/departments");
  redirect(`/hr/departments/${data.id}`);
}

// --- Staff ---

export async function createStaffAction(
  _previous: HrFormState,
  formData: FormData,
): Promise<HrFormState> {
  const actor = await getActor("hr:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = staffCreateSchema.safeParse({
    userId: formData.get("userId"),
    employeeId: formData.get("employeeId"),
    jobTitle: formData.get("jobTitle"),
    departmentId: formData.get("departmentId"),
    employmentType: formData.get("employmentType"),
    hireDate: formData.get("hireDate"),
    terminationDate: formData.get("terminationDate"),
    salaryAnnualMinor: formData.get("salaryAnnualMinor"),
    currency: formData.get("currency"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the staff details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("staff").insert({
    hospital_id: actor.hospitalId,
    user_id: parsed.data.userId,
    employee_id: parsed.data.employeeId,
    job_title: parsed.data.jobTitle,
    department_id: parsed.data.departmentId ?? undefined,
    employment_type: parsed.data.employmentType,
    hire_date: parsed.data.hireDate,
    termination_date: parsed.data.terminationDate ?? undefined,
    salary_annual_minor: parsed.data.salaryAnnualMinor ?? undefined,
    currency: parsed.data.currency,
    is_active: parsed.data.isActive,
  }).select("id").single();

  if (error) return { error: "Could not create the staff record. Try again." };
  if (!data) return { error: "Could not create the staff record. Try again." };

  revalidatePath("/hr/staff");
  redirect(`/hr/staff/${data.id}`);
}

export async function updateStaffAction(
  _previous: HrFormState,
  formData: FormData,
): Promise<HrFormState> {
  const actor = await getActor("hr:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = staffUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    userId: formData.get("userId"),
    employeeId: formData.get("employeeId"),
    jobTitle: formData.get("jobTitle"),
    departmentId: formData.get("departmentId"),
    employmentType: formData.get("employmentType"),
    hireDate: formData.get("hireDate"),
    terminationDate: formData.get("terminationDate"),
    salaryAnnualMinor: formData.get("salaryAnnualMinor"),
    currency: formData.get("currency"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the staff details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("staff")
    .update({
      job_title: parsed.data.jobTitle,
      department_id: parsed.data.departmentId ?? undefined,
      employment_type: parsed.data.employmentType,
      hire_date: parsed.data.hireDate,
      termination_date: parsed.data.terminationDate ?? undefined,
      salary_annual_minor: parsed.data.salaryAnnualMinor ?? undefined,
      currency: parsed.data.currency,
      is_active: parsed.data.isActive,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save the staff record. Try again." };
  if (!data) {
    return { error: "This staff record was changed by someone else. Reload and try again." };
  }

  revalidatePath("/hr/staff");
  redirect(`/hr/staff/${parsed.data.id}`);
}

// --- Shifts ---

export async function createShiftAction(
  _previous: HrFormState,
  formData: FormData,
): Promise<HrFormState> {
  const actor = await getActor("hr:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = shiftCreateSchema.safeParse({
    staffId: formData.get("staffId"),
    shiftDate: formData.get("shiftDate"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    breakMinutes: formData.get("breakMinutes"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the shift details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("shifts").insert({
    hospital_id: actor.hospitalId,
    staff_id: parsed.data.staffId,
    shift_date: parsed.data.shiftDate,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
    break_minutes: parsed.data.breakMinutes,
    status: parsed.data.status,
    notes: parsed.data.notes,
  }).select("id").single();

  if (error) return { error: "Could not create the shift. Try again." };
  if (!data) return { error: "Could not create the shift. Try again." };

  revalidatePath("/hr/shifts");
  redirect(`/hr/shifts/${data.id}`);
}

export async function updateShiftAction(
  _previous: HrFormState,
  formData: FormData,
): Promise<HrFormState> {
  const actor = await getActor("hr:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = shiftUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    staffId: formData.get("staffId"),
    shiftDate: formData.get("shiftDate"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    breakMinutes: formData.get("breakMinutes"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the shift details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shifts")
    .update({
      staff_id: parsed.data.staffId,
      shift_date: parsed.data.shiftDate,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      break_minutes: parsed.data.breakMinutes,
      status: parsed.data.status,
      notes: parsed.data.notes,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save the shift. Try again." };
  if (!data) {
    return { error: "This shift was changed by someone else. Reload and try again." };
  }

  revalidatePath("/hr/shifts");
  redirect(`/hr/shifts/${parsed.data.id}`);
}

// --- Attendance ---

export async function createAttendanceAction(
  _previous: HrFormState,
  formData: FormData,
): Promise<HrFormState> {
  const actor = await getActor("hr:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = attendanceCreateSchema.safeParse({
    staffId: formData.get("staffId"),
    shiftId: formData.get("shiftId"),
    attendanceDate: formData.get("attendanceDate"),
    clockIn: formData.get("clockIn"),
    clockOut: formData.get("clockOut"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the attendance details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("attendance").insert({
    hospital_id: actor.hospitalId,
    staff_id: parsed.data.staffId,
    shift_id: parsed.data.shiftId ?? undefined,
    attendance_date: parsed.data.attendanceDate,
    clock_in: parsed.data.clockIn ?? undefined,
    clock_out: parsed.data.clockOut ?? undefined,
    status: parsed.data.status,
    notes: parsed.data.notes,
  }).select("id").single();

  if (error) return { error: "Could not create the attendance record. Try again." };
  if (!data) return { error: "Could not create the attendance record. Try again." };

  revalidatePath("/hr/attendance");
  redirect(`/hr/attendance/${data.id}`);
}

export async function updateAttendanceAction(
  _previous: HrFormState,
  formData: FormData,
): Promise<HrFormState> {
  const actor = await getActor("hr:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = attendanceUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    staffId: formData.get("staffId"),
    shiftId: formData.get("shiftId"),
    attendanceDate: formData.get("attendanceDate"),
    clockIn: formData.get("clockIn"),
    clockOut: formData.get("clockOut"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the attendance details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("attendance")
    .update({
      staff_id: parsed.data.staffId,
      shift_id: parsed.data.shiftId ?? undefined,
      attendance_date: parsed.data.attendanceDate,
      clock_in: parsed.data.clockIn ?? undefined,
      clock_out: parsed.data.clockOut ?? undefined,
      status: parsed.data.status,
      notes: parsed.data.notes,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save the attendance record. Try again." };
  if (!data) {
    return { error: "This attendance record was changed by someone else. Reload and try again." };
  }

  revalidatePath("/hr/attendance");
  redirect(`/hr/attendance/${parsed.data.id}`);
}

// --- Leave requests ---

export async function createLeaveRequestAction(
  _previous: HrFormState,
  formData: FormData,
): Promise<HrFormState> {
  const actor = await getActor("hr:create");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = leaveRequestCreateSchema.safeParse({
    staffId: formData.get("staffId"),
    leaveType: formData.get("leaveType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    days: formData.get("days"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the leave request details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("leave_requests").insert({
    hospital_id: actor.hospitalId,
    staff_id: parsed.data.staffId,
    leave_type: parsed.data.leaveType,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate,
    days: parsed.data.days,
    status: "pending",
    reason: parsed.data.reason,
  }).select("id").single();

  if (error) return { error: "Could not create the leave request. Try again." };
  if (!data) return { error: "Could not create the leave request. Try again." };

  revalidatePath("/hr/leave-requests");
  redirect(`/hr/leave-requests/${data.id}`);
}

export async function updateLeaveRequestAction(
  _previous: HrFormState,
  formData: FormData,
): Promise<HrFormState> {
  const actor = await getActor("hr:update");
  if (!actor) return { error: NOT_AUTHORIZED };

  const parsed = leaveRequestUpdateSchema.safeParse({
    id: formData.get("id"),
    version: formData.get("version"),
    staffId: formData.get("staffId"),
    leaveType: formData.get("leaveType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    days: formData.get("days"),
    status: formData.get("status"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the leave request details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leave_requests")
    .update({
      leave_type: parsed.data.leaveType,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      days: parsed.data.days,
      status: parsed.data.status,
      reason: parsed.data.reason,
    })
    .eq("id", parsed.data.id)
    .eq("hospital_id", actor.hospitalId)
    .eq("version", parsed.data.version)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save the leave request. Try again." };
  if (!data) {
    return { error: "This leave request was changed by someone else. Reload and try again." };
  }

  revalidatePath("/hr/leave-requests");
  redirect(`/hr/leave-requests/${parsed.data.id}`);
}
