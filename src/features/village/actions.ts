"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createReportStatusLog } from "@/src/features/reports/statusLogs";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { createClient } from "@/src/lib/supabase/server";
import type { ActionState } from "@/src/types/action";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { recordSlaEvent } from "@/src/features/reports/slaEvents";
import { notifyUsersInternal } from "@/src/features/reports/internalNotifications";

const allowedRoles = [
  "public",
  "admin",
  "kepala_desa",
  "sekdes",
  "kepala_dusun",
  "kasi",
] as const;

type ManagedUserRole = (typeof allowedRoles)[number];

async function requireUserManager() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (!["admin", "sekdes", "kepala_desa"].includes(profile.role)) {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}

async function requireBudgetReviewer() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (!["kepala_desa", "sekdes"].includes(profile.role)) {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}

function isManagedUserRole(role: string): role is ManagedUserRole {
  return allowedRoles.includes(role as ManagedUserRole);
}

function revalidateBudgetReviewPaths(reportId?: string | null) {
  revalidatePath("/dashboard/village");
  revalidatePath("/dashboard/village/budget-requests");
  revalidatePath("/dashboard/kasi");
  revalidatePath("/dashboard/kasi/reports");
  revalidatePath("/dashboard/kasi/budget");
  revalidatePath("/dashboard/admin/reports");
  revalidatePath("/dashboard/admin/follow-up");

  if (reportId) {
    revalidatePath(`/dashboard/kasi/reports/${reportId}`);
    revalidatePath(`/dashboard/admin/reports/${reportId}`);
  }
}

async function hasReportProgressUpdates(reportId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("report_progress_updates")
    .select("id")
    .eq("report_id", reportId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to check report progress updates:", error.message);
    return false;
  }

  return Boolean(data);
}

function extendDueDateByPauseWindow(
  dueAt: string | null,
  pausedAt: string,
  resumedAt: string
) {
  if (!dueAt) {
    return null;
  }

  const dueTime = new Date(dueAt).getTime();
  const pausedTime = new Date(pausedAt).getTime();
  const resumedTime = new Date(resumedAt).getTime();

  if (
    Number.isNaN(dueTime) ||
    Number.isNaN(pausedTime) ||
    Number.isNaN(resumedTime)
  ) {
    return dueAt;
  }

  const pauseDuration = Math.max(0, resumedTime - pausedTime);

  return new Date(dueTime + pauseDuration).toISOString();
}

export async function updateVillageUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const manager = await requireUserManager();

  const userId = String(formData.get("user_id") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const phoneNumber = String(formData.get("phone_number") || "").trim();
  const role = String(formData.get("role") || "");
  const dusunId = String(formData.get("dusun_id") || "");
  const sectionId = String(formData.get("section_id") || "");

  if (!userId) {
    return {
      status: "error",
      message: "User ID is missing.",
    };
  }

  if (!fullName) {
    return {
      status: "error",
      message: "Full name is required.",
    };
  }

  if (!isManagedUserRole(role)) {
    return {
      status: "error",
      message: "Invalid user role.",
    };
  }

  if (role === "admin" && manager.role !== "admin") {
    return {
        status: "error",
        message: "Only admin can assign admin role.",
    };
  }

  if (role === "kepala_dusun" && !dusunId) {
    return {
      status: "error",
      message: "Kepala dusun must be assigned to a hamlet.",
    };
  }

  if (role === "kasi" && !sectionId) {
    return {
      status: "error",
      message: "Kepala seksi must be assigned to a section.",
    };
  }

  if (userId === manager.id && role !== manager.role) {
    return {
      status: "error",
      message: "You cannot change your own role.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone_number: phoneNumber || null,
      role,
      dusun_id: role === "kepala_dusun" ? dusunId : null,
      section_id: role === "kasi" ? sectionId : null,
    })
    .eq("id", userId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/village/users");
  revalidatePath(`/dashboard/village/users/${userId}`);

  return {
    status: "success",
    message: "User profile has been updated.",
  };
}

export async function toggleVillageUserStatus(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const manager = await requireUserManager();

  const userId = String(formData.get("user_id") || "");
  const action = String(formData.get("action") || "");

  if (!userId) {
    return {
      status: "error",
      message: "User ID is missing.",
    };
  }

  if (userId === manager.id) {
    return {
      status: "error",
      message: "You cannot deactivate your own account.",
    };
  }

  if (action !== "activate" && action !== "deactivate") {
    return {
      status: "error",
      message: "Invalid status action.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      is_active: action === "activate",
    })
    .eq("id", userId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/village/users");
  revalidatePath(`/dashboard/village/users/${userId}`);

  return {
    status: "success",
    message:
      action === "activate"
        ? "User account has been activated."
        : "User account has been deactivated.",
  };
}

export async function createVillageUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const manager = await requireUserManager();

  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const phoneNumber = String(formData.get("phone_number") || "").trim();
  const role = String(formData.get("role") || "");
  const dusunId = String(formData.get("dusun_id") || "");
  const sectionId = String(formData.get("section_id") || ""); 

  if (!fullName) {
    return {
      status: "error",
      message: "Full name is required.",
    };
  }

  if (!email) {
    return {
      status: "error",
      message: "Email is required.",
    };
  }

  if (!password || password.length < 6) {
    return {
      status: "error",
      message: "Password must be at least 6 characters.",
    };
  }

  if (!isManagedUserRole(role)) {
    return {
      status: "error",
      message: "Invalid user role.",
    };
  }

  if (role === "admin" && manager.role !== "admin") {
    return {
      status: "error",
      message: "Only admin can create another admin account.",
    };
  }

  if (role === "kepala_dusun" && !dusunId) {
    return {
      status: "error",
      message: "Kepala dusun must be assigned to a hamlet.",
    };
  }

  if (role === "kasi" && !sectionId) {
    return {
      status: "error",
      message: "Section is required for Kasi.",
    };
  }

  const adminSupabase = createAdminClient();

  const { data: createdUser, error: createError } =
    await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone_number: phoneNumber,
      },
    });

  if (createError || !createdUser.user) {
    return {
      status: "error",
      message: createError?.message || "Failed to create user.",
    };
  }

  const userId = createdUser.user.id;

  const { error: profileError } = await adminSupabase.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      phone_number: phoneNumber || null,
      role,
      dusun_id: role === "kepala_dusun" ? dusunId : null,
      is_active: true,
      section_id: role === "kasi" ? sectionId : null,
    },
    {
      onConflict: "id",
    }
  );

  if (profileError) {
    return {
      status: "error",
      message: profileError.message,
    };
  }

  revalidatePath("/dashboard/village/users");

  return {
    status: "success",
    message: "User account has been created.",
  };
}

export async function approveBudgetRequest(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const reviewer = await requireBudgetReviewer();
  const requestId = String(formData.get("budget_request_id") || "");
  const reviewNote = String(formData.get("review_note") || "").trim();

  if (!requestId) {
    return {
      status: "error",
      message: "Budget request ID is missing.",
    };
  }

  const supabase = createAdminClient();
  const { data: budgetRequest, error: requestError } = await supabase
    .from("report_budget_requests")
    .select("id, report_id, requested_by, status, created_at")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    return {
      status: "error",
      message:
        requestError.message ||
        "Failed to read budget request. Make sure the review migration has been applied.",
    };
  }

  if (!budgetRequest) {
    return {
      status: "error",
      message: "Budget request was not found.",
    };
  }

  if (budgetRequest.status !== "submitted") {
    return {
      status: "error",
      message: "Only submitted budget requests can be approved.",
    };
  }

  const now = new Date().toISOString();
  const { data: updatedRequest, error: updateError } = await supabase
    .from("report_budget_requests")
    .update({
      status: "approved",
      reviewed_by: reviewer.id,
      reviewed_at: now,
      review_note: reviewNote || null,
      updated_at: now,
    })
    .eq("id", requestId)
    .eq("status", "submitted")
    .select("id")
    .maybeSingle();

  if (updateError || !updatedRequest) {
    return {
      status: "error",
      message:
        updateError?.message ||
        "Budget request is no longer available for approval.",
    };
  }

  const { data: report, error: reportReadError } = await supabase
    .from("reports")
    .select("id, report_number, title, status, resolution_due_at")
    .eq("id", budgetRequest.report_id)
    .maybeSingle();

  if (reportReadError) {
    console.error("Failed to read report after budget approval:", reportReadError.message);
  }

  if (report?.status === "waiting_budget") {
    const statusNote = reviewNote
      ? `Budget request approved: ${reviewNote}`
      : "Budget request approved.";
    const nextReportStatus = (await hasReportProgressUpdates(budgetRequest.report_id))
      ? "in_progress"
      : "handled_by_village";
    const nextResolutionDueAt = extendDueDateByPauseWindow(
      report.resolution_due_at,
      budgetRequest.created_at,
      now
    );
    const { error: reportUpdateError } = await supabase
      .from("reports")
      .update({
        status: nextReportStatus,
        resolution_due_at: nextResolutionDueAt,
        internal_handling_note: statusNote,
        updated_at: now,
      })
      .eq("id", budgetRequest.report_id)
      .eq("status", "waiting_budget");

    if (reportUpdateError) {
      return {
        status: "error",
        message: reportUpdateError.message,
      };
    }

    await createReportStatusLog({
      reportId: budgetRequest.report_id,
      oldStatus: "waiting_budget",
      newStatus: nextReportStatus,
      note: statusNote,
    });

    await recordSlaEvent({
      reportId: budgetRequest.report_id,
      eventType: "resumed_budget",
      previousResolutionDueAt: report.resolution_due_at,
      newResolutionDueAt: nextResolutionDueAt,
      note: statusNote,
    });
  }

  if (budgetRequest.requested_by && report) {
    await notifyUsersInternal({
      userIds: [budgetRequest.requested_by],
      reportId: budgetRequest.report_id,
      subject: `Anggaran disetujui ${report.report_number}`,
      message: `Pengajuan anggaran untuk laporan ${report.report_number} (${report.title}) telah disetujui.${reviewNote ? ` Catatan: ${reviewNote}` : ""}`,
    });
  }

  revalidateBudgetReviewPaths(budgetRequest.report_id);

  return {
    status: "success",
    message: "Budget request has been approved.",
  };
}

export async function rejectBudgetRequest(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const reviewer = await requireBudgetReviewer();
  const requestId = String(formData.get("budget_request_id") || "");
  const reviewNote = String(formData.get("review_note") || "").trim();

  if (!requestId) {
    return {
      status: "error",
      message: "Budget request ID is missing.",
    };
  }

  if (!reviewNote) {
    return {
      status: "error",
      message: "Please write a rejection reason.",
    };
  }

  const supabase = createAdminClient();
  const { data: budgetRequest, error: requestError } = await supabase
    .from("report_budget_requests")
    .select("id, report_id, requested_by, status, created_at")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    return {
      status: "error",
      message:
        requestError.message ||
        "Failed to read budget request. Make sure the review migration has been applied.",
    };
  }

  if (!budgetRequest) {
    return {
      status: "error",
      message: "Budget request was not found.",
    };
  }

  if (budgetRequest.status !== "submitted") {
    return {
      status: "error",
      message: "Only submitted budget requests can be rejected.",
    };
  }

  const now = new Date().toISOString();
  const { data: updatedRequest, error: updateError } = await supabase
    .from("report_budget_requests")
    .update({
      status: "rejected",
      reviewed_by: reviewer.id,
      reviewed_at: now,
      review_note: reviewNote,
      updated_at: now,
    })
    .eq("id", requestId)
    .eq("status", "submitted")
    .select("id")
    .maybeSingle();

  if (updateError || !updatedRequest) {
    return {
      status: "error",
      message:
        updateError?.message ||
        "Budget request is no longer available for rejection.",
    };
  }

  const { data: report, error: reportReadError } = await supabase
    .from("reports")
    .select("id, report_number, title, status, resolution_due_at")
    .eq("id", budgetRequest.report_id)
    .maybeSingle();

  if (reportReadError) {
    console.error("Failed to read report after budget rejection:", reportReadError.message);
  }

  if (report?.status === "waiting_budget") {
    const nextResolutionDueAt = extendDueDateByPauseWindow(
      report.resolution_due_at,
      budgetRequest.created_at,
      now
    );
    const { error: reportUpdateError } = await supabase
      .from("reports")
      .update({
        status: "handled_by_village",
        resolution_due_at: nextResolutionDueAt,
        internal_handling_note: reviewNote,
        updated_at: now,
      })
      .eq("id", budgetRequest.report_id)
      .eq("status", "waiting_budget");

    if (reportUpdateError) {
      return {
        status: "error",
        message: reportUpdateError.message,
      };
    }

    await createReportStatusLog({
      reportId: budgetRequest.report_id,
      oldStatus: "waiting_budget",
      newStatus: "handled_by_village",
      note: `Budget request rejected: ${reviewNote}`,
    });

    await recordSlaEvent({
      reportId: budgetRequest.report_id,
      eventType: "resumed_budget",
      previousResolutionDueAt: report.resolution_due_at,
      newResolutionDueAt: nextResolutionDueAt,
      note: `Budget request rejected: ${reviewNote}`,
    });
  }

  if (budgetRequest.requested_by && report) {
    await notifyUsersInternal({
      userIds: [budgetRequest.requested_by],
      reportId: budgetRequest.report_id,
      subject: `Anggaran ditolak ${report.report_number}`,
      message: `Pengajuan anggaran untuk laporan ${report.report_number} (${report.title}) ditolak. Catatan: ${reviewNote}`,
    });
  }

  revalidateBudgetReviewPaths(budgetRequest.report_id);

  return {
    status: "success",
    message: "Budget request has been rejected.",
  };
}
