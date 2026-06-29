"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { createClient } from "@/src/lib/supabase/server";
import type { ActionState } from "@/src/types/action";
import { createReportStatusLog } from "@/src/features/reports/statusLogs";
import { recordSlaEvent } from "@/src/features/reports/slaEvents";
import {
  notifyHamletHeadsForVerification,
  notifyReporterRecurringIssue,
  notifySectionKasiAssignment,
} from "@/src/features/reports/internalNotifications";
import { sendOfficialLetterViaBrevo } from "@/src/lib/email/sendEmail";

async function requireAdmin() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (profile.role !== "admin") {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}

export async function approveReportForVerification(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const reportId = String(formData.get("report_id") || "");
  const categoryId = String(formData.get("category_id") || "");
  const hamletId = String(formData.get("dusun_id") || "");
  const priority = String(formData.get("priority") || "").trim();
  const adminNote = String(formData.get("admin_note") || "").trim();
  const supabase = await createClient();

  if (!reportId || !categoryId || !hamletId) {
    return {
      status: "error",
      message: "Please complete category and hamlet before approving.",
    };
  }

  if (!priority) {
    return {
      status: "error",
      message: "Priority is required.",
    };
  }

  const { data: slaRule, error: slaRuleError } = await supabase
    .from("sla_rules")
    .select("verification_hours, resolution_hours")
    .eq("priority", priority)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (slaRuleError || !slaRule) {
    return {
      status: "error",
      message:
        "Selected priority is not available. Please choose an active SLA priority.",
    };
  }

  const now = new Date();

  const verificationDueAt = new Date(
    now.getTime() + slaRule.verification_hours * 60 * 60 * 1000
  ).toISOString();

  const resolutionDueAt = new Date(
    now.getTime() + slaRule.resolution_hours * 60 * 60 * 1000
  ).toISOString();
    
  const { error } = await supabase
    .from("reports")
    .update({
      category_id: categoryId,
      dusun_id: hamletId,
      priority,
      admin_note: adminNote || null,
      status: "need_verification",
      verification_due_at: verificationDueAt,
      resolution_due_at: resolutionDueAt,
      sla_status: "on_time",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: "pending",
    newStatus: "need_verification",
    note: "Report approved by admin and sent for hamlet verification.",
  });

  await recordSlaEvent({
    reportId,
    eventType: "deadline_started",
    newResolutionDueAt: resolutionDueAt,
    note: `SLA started for ${priority} priority.`,
  });

  const { data: approvedReport } = await supabase
    .from("reports")
    .select("id, report_number, title")
    .eq("id", reportId)
    .maybeSingle();

  if (approvedReport) {
    await notifyHamletHeadsForVerification({
      hamletId,
      reportId,
      reportNumber: approvedReport.report_number,
      reportTitle: approvedReport.title,
    });
  }

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);

  return {
    status: "success",
    message: "Report approved and sent to verification.",
  };
}

export async function rejectReport(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const reportId = String(formData.get("report_id") || "");
  const rejectionReason = String(formData.get("rejection_reason") || "").trim();

  if (!reportId || !rejectionReason) {
    return {
      status: "error",
      message: "Please provide a rejection reason.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("reports")
    .update({
      status: "rejected",
      sla_status: "completed",
      rejection_reason: rejectionReason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: "pending",
    newStatus: "rejected",
    note: rejectionReason || "Report rejected by admin.",
  });

  await recordSlaEvent({
    reportId,
    eventType: "completed",
    note: "SLA completed when report was rejected.",
  });

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);

  return {
    status: "success",
    message: "Report rejected successfully.",
  };
}

export async function classifyAssetReport(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireAdmin();

  const reportId = String(formData.get("report_id") || "");
  const assetStatus = String(formData.get("asset_status") || "");
  const authorityLevel = String(formData.get("authority_level") || "");
  const followUpType = String(formData.get("follow_up_type") || "");
  const assignedSectionId = String(
    formData.get("assigned_section_id") || ""
  ).trim();
  const agencyId = String(formData.get("agency_id") || "").trim();

  const allowedAssetStatuses = [
    "aset_desa",
    "bukan_aset_desa",
    "belum_diketahui",
  ];

  const allowedAuthorityLevels = [
    "desa",
    "kabupaten_kota",
    "provinsi",
    "nasional",
    "belum_diketahui",
  ];

  const allowedFollowUpTypes = [
    "ditangani_desa",
    "diteruskan_ke_dinas",
    "diusulkan_musrenbang",
    "menunggu_anggaran",
  ];

  if (!reportId) {
    return {
      status: "error",
      message: "Report ID is missing.",
    };
  }

  if (!allowedAssetStatuses.includes(assetStatus)) {
    return {
      status: "error",
      message: "Please select a valid asset status.",
    };
  }

  if (!allowedAuthorityLevels.includes(authorityLevel)) {
    return {
      status: "error",
      message: "Please select a valid authority level.",
    };
  }

  if (!allowedFollowUpTypes.includes(followUpType)) {
    return {
      status: "error",
      message: "Please select a valid follow-up type.",
    };
  }

  const supabase = await createClient();
  const requiresVillageSection = [
    "ditangani_desa",
    "diusulkan_musrenbang",
    "menunggu_anggaran",
  ].includes(followUpType);
  const requiresAgency = followUpType === "diteruskan_ke_dinas";
  let selectedSectionId: string | null = null;
  let selectedAgencyId: string | null = null;
  let nextStatus = "";

  if (followUpType === "ditangani_desa") {
    nextStatus = "handled_by_village";
  }

  if (followUpType === "diteruskan_ke_dinas") {
    nextStatus = "forwarded_to_agency";
  }

  if (
    followUpType === "diusulkan_musrenbang" ||
    followUpType === "menunggu_anggaran"
  ) {
    nextStatus = "waiting_budget";
  }

  if (requiresVillageSection) {
    if (!assignedSectionId) {
      return {
        status: "error",
        message:
          "Please assign the report to a village section before saving this classification.",
      };
    }

    const { data: section, error: sectionError } = await supabase
      .from("village_sections")
      .select("id, is_active")
      .eq("id", assignedSectionId)
      .eq("is_active", true)
      .maybeSingle();

    if (sectionError || !section) {
      return {
        status: "error",
        message: "Selected village section is not available or inactive.",
      };
    }

    selectedSectionId = section.id;
  }

  if (requiresAgency) {
    if (!agencyId) {
      return {
        status: "error",
        message: "Please select the target agency before saving classification.",
      };
    }

    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("id, is_active")
      .eq("id", agencyId)
      .eq("is_active", true)
      .maybeSingle();

    if (agencyError || !agency) {
      return {
        status: "error",
        message: "Selected agency is not available or inactive.",
      };
    }

    selectedAgencyId = agency.id;
  }

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select(
      "id, report_number, title, status, assigned_section_id, resolution_due_at"
    )
    .eq("id", reportId)
    .eq("status", "verified_valid")
    .single();

  if (reportError || !report) {
    return {
      status: "error",
      message: "Report not found or already classified.",
    };
  }

  const { error } = await supabase
    .from("reports")
    .update({
      asset_status: assetStatus,
      authority_level: authorityLevel,
      follow_up_type: followUpType,
      assigned_section_id: selectedSectionId,
      agency_id: selectedAgencyId,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: "verified_valid",
    newStatus: nextStatus,
    note: "Report has been classified and routed by admin.",
  });

  if (selectedSectionId && selectedSectionId !== report.assigned_section_id) {
    const { error: assignmentError } = await supabase
      .from("report_section_assignments")
      .insert({
        report_id: reportId,
        section_id: selectedSectionId,
        assigned_by: profile.id,
      });

    if (assignmentError) {
      console.error(
        "Failed to create report section assignment:",
        assignmentError.message
      );
    }
  }

  if (nextStatus === "waiting_budget") {
    await recordSlaEvent({
      reportId,
      eventType: "paused_budget",
      previousResolutionDueAt: report.resolution_due_at,
      newResolutionDueAt: report.resolution_due_at,
      note: "SLA paused because this report is waiting for budget.",
    });
  }

  if (selectedSectionId && ["handled_by_village", "waiting_budget"].includes(nextStatus)) {
    await notifySectionKasiAssignment({
      sectionId: selectedSectionId,
      reportId,
      reportNumber: report.report_number,
      reportTitle: report.title,
    });
  }

  revalidatePath("/dashboard/admin/asset-classification");
  revalidatePath(`/dashboard/admin/asset-classification/${reportId}`);
  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);
  revalidatePath("/dashboard/admin/follow-up");
  revalidatePath("/dashboard/admin/letters");
  revalidatePath("/dashboard/kasi");
  revalidatePath("/dashboard/kasi/reports");
  revalidatePath("/dashboard/village/reports");

  return {
    status: "success",
    message: "Report has been classified and routed successfully.",
  };
}

export async function processReportFollowUp(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const reportId = String(formData.get("report_id") || "");
  const agencyId = String(formData.get("agency_id") || "").trim();

  if (!reportId) {
    return {
      status: "error",
      message: "Report ID is missing.",
    };
  }

  const supabase = await createClient();

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select(
      "id, report_number, title, status, follow_up_type, assigned_section_id, resolution_due_at"
    )
    .eq("id", reportId)
    .eq("status", "classified")
    .single();

  if (reportError || !report) {
    return {
      status: "error",
      message: "Report not found or not ready for follow-up.",
    };
  }

  let nextStatus = "";

  if (report.follow_up_type === "ditangani_desa") {
    nextStatus = "handled_by_village";
  }

  if (report.follow_up_type === "diteruskan_ke_dinas") {
    nextStatus = "forwarded_to_agency";
  }

  if (
    report.follow_up_type === "diusulkan_musrenbang" ||
    report.follow_up_type === "menunggu_anggaran"
  ) {
    nextStatus = "waiting_budget";
  }

  if (!nextStatus) {
    return {
      status: "error",
      message: "Please set a valid follow-up type before processing this report.",
    };
  }

  if (
    ["ditangani_desa", "diusulkan_musrenbang", "menunggu_anggaran"].includes(
      report.follow_up_type
    )
  ) {
    if (!report.assigned_section_id) {
      return {
        status: "error",
        message:
          "Please assign this village follow-up report to a village section before processing it.",
      };
    }

    const { data: section, error: sectionError } = await supabase
      .from("village_sections")
      .select("id")
      .eq("id", report.assigned_section_id)
      .eq("is_active", true)
      .maybeSingle();

    if (sectionError || !section) {
      return {
        status: "error",
        message: "Assigned village section is inactive or unavailable.",
      };
    }
  }

  if (report.follow_up_type === "diteruskan_ke_dinas") {
    if (!agencyId) {
      return {
        status: "error",
        message: "Please select the target agency before forwarding the report.",
      };
    }

    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("id, name, is_active")
      .eq("id", agencyId)
      .eq("is_active", true)
      .single();

    if (agencyError || !agency) {
      return {
        status: "error",
        message: "Selected agency is not available or inactive.",
      };
    }
  }

  const { error } = await supabase
    .from("reports")
    .update({
      status: nextStatus,
      agency_id:
        report.follow_up_type === "diteruskan_ke_dinas" ? agencyId : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: "classified",
    newStatus: nextStatus,
    note: "Report follow-up direction has been determined.",
  });

  if (nextStatus === "waiting_budget") {
    await recordSlaEvent({
      reportId,
      eventType: "paused_budget",
      previousResolutionDueAt: report.resolution_due_at,
      newResolutionDueAt: report.resolution_due_at,
      note: "SLA paused because this report is waiting for budget.",
    });
  }

  if (
    report.assigned_section_id &&
    ["handled_by_village", "waiting_budget"].includes(nextStatus)
  ) {
    await notifySectionKasiAssignment({
      sectionId: report.assigned_section_id,
      reportId,
      reportNumber: report.report_number,
      reportTitle: report.title,
    });
  }

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);
  revalidatePath("/dashboard/admin/asset-classification");
  revalidatePath("/dashboard/admin/follow-up");
  revalidatePath("/dashboard/kasi");
  revalidatePath("/dashboard/kasi/reports");

  return {
    status: "success",
    message: "Report follow-up has been processed successfully.",
  };
}

export async function linkRelatedReport(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireAdmin();

  const sourceReportId = String(formData.get("source_report_id") || "").trim();
  const targetReportId = String(formData.get("target_report_id") || "").trim();
  const relationType = String(formData.get("relation_type") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!sourceReportId || !targetReportId) {
    return {
      status: "error",
      message: "Please select the related report.",
    };
  }

  if (sourceReportId === targetReportId) {
    return {
      status: "error",
      message: "A report cannot be linked to itself.",
    };
  }

  if (!["duplicate", "recurrence"].includes(relationType)) {
    return {
      status: "error",
      message: "Please choose a valid relation type.",
    };
  }

  if (!note) {
    return {
      status: "error",
      message: "Please provide a note explaining the relation.",
    };
  }

  const supabase = createAdminClient();

  const { data: reports, error: reportsError } = await supabase
    .from("reports")
    .select("id, report_number, title, status, reporter_id")
    .in("id", [sourceReportId, targetReportId]);

  if (reportsError) {
    return {
      status: "error",
      message: reportsError.message,
    };
  }

  const sourceReport = (reports ?? []).find(
    (report) => report.id === sourceReportId
  );
  const targetReport = (reports ?? []).find(
    (report) => report.id === targetReportId
  );

  if (!sourceReport || !targetReport) {
    return {
      status: "error",
      message: "Source or target report was not found.",
    };
  }

  if (!ACTIVE_RELATION_STATUSES.includes(sourceReport.status)) {
    return {
      status: "error",
      message:
        "Only active reports can be linked as duplicates or recurrences.",
    };
  }

  if (
    relationType === "duplicate" &&
    !ACTIVE_RELATION_STATUSES.includes(targetReport.status)
  ) {
    return {
      status: "error",
      message:
        "Duplicate reports must be linked to a master report that is still active.",
    };
  }

  if (
    relationType === "recurrence" &&
    !RECURRENCE_REFERENCE_STATUSES.includes(targetReport.status)
  ) {
    return {
      status: "error",
      message:
        "Recurring issues must be linked to a previous report that was already resolved.",
    };
  }

  const { data: existingSourceRelations, error: existingSourceRelationsError } =
    await supabase
      .from("report_relations")
      .select("relation_type")
      .eq("source_report_id", sourceReportId);

  if (existingSourceRelationsError) {
    return {
      status: "error",
      message: existingSourceRelationsError.message,
    };
  }

  const hasSameRelation = (existingSourceRelations ?? []).some(
    (relation) => relation.relation_type === relationType
  );

  if (hasSameRelation) {
    return {
      status: "error",
      message:
        relationType === "duplicate"
          ? "This report has already been merged as a duplicate."
          : "This report has already been marked as a recurring issue.",
    };
  }

  const { error: relationError } = await supabase
    .from("report_relations")
    .insert({
      source_report_id: sourceReportId,
      target_report_id: targetReportId,
      relation_type: relationType,
      note,
      created_by: profile.id,
    });

  if (relationError) {
    const isDuplicateRelation =
      relationError.message.includes("duplicate key") ||
      relationError.message.includes("unique");

    return {
      status: "error",
      message: isDuplicateRelation
        ? "This report relation already exists."
        : relationError.message,
    };
  }

  if (relationType === "duplicate") {
    const { data: mergedReport, error: updateError } = await supabase
      .from("reports")
      .update({
        status: "merged",
        sla_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sourceReportId)
      .eq("status", sourceReport.status)
      .select("id")
      .maybeSingle();

    if (updateError || !mergedReport) {
      await supabase
        .from("report_relations")
        .delete()
        .eq("source_report_id", sourceReportId)
        .eq("target_report_id", targetReportId)
        .eq("relation_type", "duplicate");

      return {
        status: "error",
        message:
          updateError?.message ||
          "This report could not be merged because its status has changed.",
      };
    }

    await createReportStatusLog({
      reportId: sourceReportId,
      oldStatus: sourceReport.status,
      newStatus: "merged",
      note: `Report merged into ${targetReport.report_number}. ${note}`,
    });

    await recordSlaEvent({
      reportId: sourceReportId,
      eventType: "merged",
      note: `SLA stopped because this report was merged into ${targetReport.report_number}.`,
    });

    await createReportStatusLog({
      reportId: targetReportId,
      oldStatus: targetReport.status,
      newStatus: targetReport.status,
      note: `Duplicate report ${sourceReport.report_number} was merged into this master report. ${note}`,
      notifyReporter: false,
      notifyWhatsApp: false,
    });
  }

  if (relationType === "recurrence") {
    await createReportStatusLog({
      reportId: sourceReportId,
      oldStatus: sourceReport.status,
      newStatus: sourceReport.status,
      note: `Report marked as a recurring issue from ${targetReport.report_number}. ${note}`,
      notifyReporter: false,
      notifyWhatsApp: false,
    });

    await notifyReporterRecurringIssue({
      sourceReportId,
      targetReportId,
      note,
    });
  }

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${sourceReportId}`);
  revalidatePath(`/dashboard/admin/reports/${targetReportId}`);
  revalidatePath("/dashboard/admin/follow-up");
  revalidatePath("/dashboard/village/reports");
  revalidatePath(`/dashboard/village/reports/${sourceReportId}`);
  revalidatePath(`/dashboard/village/reports/${targetReportId}`);
  revalidatePath("/dashboard/public");
  revalidatePath("/dashboard/public/reports");
  revalidatePath(`/dashboard/public/reports/${sourceReportId}`);

  return {
    status: "success",
    message:
      relationType === "duplicate"
        ? "Duplicate report has been merged into the master report."
        : "Recurring issue relation has been recorded.",
  };
}

export async function bulkMergeDuplicateReports(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireAdmin();

  const masterReportId = String(formData.get("master_report_id") || "").trim();
  const sourceReportIds = Array.from(
    new Set(
      formData
        .getAll("source_report_ids")
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );
  const note = String(formData.get("bulk_note") || "").trim();

  if (!masterReportId) {
    return {
      status: "error",
      message: "Master report ID is missing.",
    };
  }

  if (sourceReportIds.length === 0) {
    return {
      status: "error",
      message: "Please select at least one duplicate report to merge.",
    };
  }

  if (sourceReportIds.includes(masterReportId)) {
    return {
      status: "error",
      message: "A report cannot be merged into itself.",
    };
  }

  if (!note) {
    return {
      status: "error",
      message: "Please provide a note explaining this bulk merge.",
    };
  }

  const supabase = createAdminClient();
  const { data: reports, error: reportsError } = await supabase
    .from("reports")
    .select("id, report_number, title, status")
    .in("id", [masterReportId, ...sourceReportIds]);

  if (reportsError) {
    return {
      status: "error",
      message: reportsError.message,
    };
  }

  const masterReport = (reports ?? []).find(
    (report) => report.id === masterReportId
  );
  const sourceReports = (reports ?? []).filter((report) =>
    sourceReportIds.includes(report.id)
  );

  if (!masterReport) {
    return {
      status: "error",
      message: "Master report was not found.",
    };
  }

  if (!ACTIVE_RELATION_STATUSES.includes(masterReport.status)) {
    return {
      status: "error",
      message: "Bulk duplicate merge requires an active master report.",
    };
  }

  if (sourceReports.length !== sourceReportIds.length) {
    return {
      status: "error",
      message: "One or more selected duplicate reports were not found.",
    };
  }

  const invalidSource = sourceReports.find(
    (report) => !ACTIVE_RELATION_STATUSES.includes(report.status)
  );

  if (invalidSource) {
    return {
      status: "error",
      message: `Report ${invalidSource.report_number} is no longer active and cannot be merged.`,
    };
  }

  const { data: existingDuplicateRelations, error: existingRelationsError } =
    await supabase
      .from("report_relations")
      .select("source_report_id, target_report_id")
      .in("source_report_id", sourceReportIds)
      .eq("relation_type", "duplicate");

  if (existingRelationsError) {
    return {
      status: "error",
      message: existingRelationsError.message,
    };
  }

  if ((existingDuplicateRelations ?? []).length > 0) {
    const relatedSourceIds = new Set(
      (existingDuplicateRelations ?? []).map(
        (relation) => relation.source_report_id
      )
    );
    const relatedReport = sourceReports.find((report) =>
      relatedSourceIds.has(report.id)
    );

    return {
      status: "error",
      message: relatedReport
        ? `Report ${relatedReport.report_number} is already merged as a duplicate.`
        : "One or more selected reports are already merged as duplicates.",
    };
  }

  const now = new Date().toISOString();
  const { error: relationError } = await supabase
    .from("report_relations")
    .insert(
      sourceReports.map((report) => ({
        source_report_id: report.id,
        target_report_id: masterReportId,
        relation_type: "duplicate",
        note,
        created_by: profile.id,
        created_at: now,
        updated_at: now,
      }))
    );

  if (relationError) {
    return {
      status: "error",
      message: relationError.message,
    };
  }

  const { data: mergedReports, error: updateError } = await supabase
    .from("reports")
    .update({
      status: "merged",
      sla_status: "completed",
      updated_at: now,
    })
    .in("id", sourceReportIds)
    .in("status", ACTIVE_RELATION_STATUSES)
    .select("id");

  if (updateError || (mergedReports ?? []).length !== sourceReports.length) {
    await supabase
      .from("report_relations")
      .delete()
      .in("source_report_id", sourceReportIds)
      .eq("target_report_id", masterReportId)
      .eq("relation_type", "duplicate");

    return {
      status: "error",
      message:
        updateError?.message ||
        "One or more reports could not be merged because their status has changed.",
    };
  }

  for (const sourceReport of sourceReports) {
    await createReportStatusLog({
      reportId: sourceReport.id,
      oldStatus: sourceReport.status,
      newStatus: "merged",
      note: `Report merged into ${masterReport.report_number}. ${note}`,
    });

    await recordSlaEvent({
      reportId: sourceReport.id,
      eventType: "merged",
      note: `SLA stopped because this report was merged into ${masterReport.report_number}.`,
    });
  }

  await createReportStatusLog({
    reportId: masterReportId,
    oldStatus: masterReport.status,
    newStatus: masterReport.status,
    note: `Bulk duplicate merge: ${sourceReports.length} reports were merged into this master report. ${note}`,
    notifyReporter: false,
    notifyWhatsApp: false,
  });

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${masterReportId}`);
  revalidatePath("/dashboard/admin/follow-up");
  revalidatePath("/dashboard/village/reports");
  revalidatePath(`/dashboard/village/reports/${masterReportId}`);
  revalidatePath("/dashboard/public/reports");

  for (const sourceReportId of sourceReportIds) {
    revalidatePath(`/dashboard/admin/reports/${sourceReportId}`);
    revalidatePath(`/dashboard/village/reports/${sourceReportId}`);
    revalidatePath(`/dashboard/public/reports/${sourceReportId}`);
  }

  return {
    status: "success",
    message: `${sourceReports.length} duplicate reports have been merged into ${masterReport.report_number}.`,
  };
}

export async function bulkMarkRecurringReports(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireAdmin();

  const targetReportId = String(formData.get("target_report_id") || "").trim();
  const sourceReportIds = Array.from(
    new Set(
      formData
        .getAll("source_report_ids")
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );
  const note = String(formData.get("bulk_note") || "").trim();

  if (!targetReportId) {
    return {
      status: "error",
      message: "Resolved reference report ID is missing.",
    };
  }

  if (sourceReportIds.length === 0) {
    return {
      status: "error",
      message: "Please select at least one active report to mark as recurring.",
    };
  }

  if (sourceReportIds.includes(targetReportId)) {
    return {
      status: "error",
      message: "A report cannot be linked to itself.",
    };
  }

  if (!note) {
    return {
      status: "error",
      message: "Please provide a note explaining this recurring issue.",
    };
  }

  const supabase = createAdminClient();
  const { data: reports, error: reportsError } = await supabase
    .from("reports")
    .select("id, report_number, title, status")
    .in("id", [targetReportId, ...sourceReportIds]);

  if (reportsError) {
    return {
      status: "error",
      message: reportsError.message,
    };
  }

  const targetReport = (reports ?? []).find(
    (report) => report.id === targetReportId
  );
  const sourceReports = (reports ?? []).filter((report) =>
    sourceReportIds.includes(report.id)
  );

  if (!targetReport) {
    return {
      status: "error",
      message: "Resolved reference report was not found.",
    };
  }

  if (!RECURRENCE_REFERENCE_STATUSES.includes(targetReport.status)) {
    return {
      status: "error",
      message:
        "Bulk recurring issues must be linked to a report that is already resolved or archived.",
    };
  }

  if (sourceReports.length !== sourceReportIds.length) {
    return {
      status: "error",
      message: "One or more selected recurring reports were not found.",
    };
  }

  const invalidSource = sourceReports.find(
    (report) => !ACTIVE_RELATION_STATUSES.includes(report.status)
  );

  if (invalidSource) {
    return {
      status: "error",
      message: `Report ${invalidSource.report_number} is no longer active and cannot be marked as recurring.`,
    };
  }

  const { data: existingRecurrences, error: existingRecurrencesError } =
    await supabase
      .from("report_relations")
      .select("source_report_id, target_report_id")
      .in("source_report_id", sourceReportIds)
      .eq("relation_type", "recurrence");

  if (existingRecurrencesError) {
    return {
      status: "error",
      message: existingRecurrencesError.message,
    };
  }

  if ((existingRecurrences ?? []).length > 0) {
    const recurringSourceIds = new Set(
      (existingRecurrences ?? []).map(
        (relation) => relation.source_report_id
      )
    );
    const relatedReport = sourceReports.find((report) =>
      recurringSourceIds.has(report.id)
    );

    return {
      status: "error",
      message: relatedReport
        ? `Report ${relatedReport.report_number} is already marked as a recurring issue.`
        : "One or more selected reports are already marked as recurring issues.",
    };
  }

  const now = new Date().toISOString();
  const { error: relationError } = await supabase
    .from("report_relations")
    .insert(
      sourceReports.map((report) => ({
        source_report_id: report.id,
        target_report_id: targetReportId,
        relation_type: "recurrence",
        note,
        created_by: profile.id,
        created_at: now,
        updated_at: now,
      }))
    );

  if (relationError) {
    return {
      status: "error",
      message: relationError.message,
    };
  }

  for (const sourceReport of sourceReports) {
    await createReportStatusLog({
      reportId: sourceReport.id,
      oldStatus: sourceReport.status,
      newStatus: sourceReport.status,
      note: `Report marked as a recurring issue from ${targetReport.report_number}. ${note}`,
      notifyReporter: false,
      notifyWhatsApp: false,
    });

    await notifyReporterRecurringIssue({
      sourceReportId: sourceReport.id,
      targetReportId,
      note,
    });
  }

  await createReportStatusLog({
    reportId: targetReportId,
    oldStatus: targetReport.status,
    newStatus: targetReport.status,
    note: `Bulk recurring issue: ${sourceReports.length} active reports were linked to this resolved report. ${note}`,
    notifyReporter: false,
    notifyWhatsApp: false,
  });

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${targetReportId}`);
  revalidatePath("/dashboard/admin/follow-up");
  revalidatePath("/dashboard/village/reports");
  revalidatePath(`/dashboard/village/reports/${targetReportId}`);
  revalidatePath("/dashboard/public");
  revalidatePath("/dashboard/public/reports");

  for (const sourceReportId of sourceReportIds) {
    revalidatePath(`/dashboard/admin/reports/${sourceReportId}`);
    revalidatePath(`/dashboard/village/reports/${sourceReportId}`);
    revalidatePath(`/dashboard/public/reports/${sourceReportId}`);
  }

  return {
    status: "success",
    message: `${sourceReports.length} active reports have been marked as recurring issues from ${targetReport.report_number}.`,
  };
}

export async function startReportProgress(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const reportId = String(formData.get("report_id") || "");

  if (!reportId) {
    return {
      status: "error",
      message: "Report ID is missing.",
    };
  }

  const supabase = await createClient();

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("id, status")
    .eq("id", reportId)
    .eq("status", "forwarded_to_agency")
    .eq("follow_up_type", "diteruskan_ke_dinas")
    .single();

  if (reportError || !report) {
    return {
      status: "error",
      message:
        "Only reports forwarded to an external agency can be started by admin.",
    };
  }

  const { error } = await supabase
    .from("reports")
    .update({
      status: "in_progress",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: report.status,
    newStatus: "in_progress",
    note: "Report handling has started.",
  });

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);
  revalidatePath("/dashboard/admin/follow-up");

  return {
    status: "success",
    message: "Report has been marked as in progress.",
  };
}

export async function resolveReport(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const reportId = String(formData.get("report_id") || "");

  if (!reportId) {
    return {
      status: "error",
      message: "Report ID is missing.",
    };
  }

  const supabase = await createClient();

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("id, status, follow_up_type")
    .eq("id", reportId)
    .eq("status", "in_progress")
    .eq("follow_up_type", "diteruskan_ke_dinas")
    .single();

  if (reportError || !report) {
    return {
      status: "error",
      message:
        "Only in-progress reports forwarded to an external agency can be resolved by admin.",
    };
  }

  const { error } = await supabase
    .from("reports")
    .update({
      status: "resolved",
      sla_status: "completed",
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: "in_progress",
    newStatus: "resolved",
    note: "Report has been resolved.",
  });

  await recordSlaEvent({
    reportId,
    eventType: "completed",
    note: "SLA completed when report was resolved.",
  });

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);
  revalidatePath("/dashboard/admin/follow-up");

  return {
    status: "success",
    message: "Report has been resolved successfully.",
  };
}

export async function archiveReport(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const reportId = String(formData.get("report_id") || "");

  if (!reportId) {
    return {
      status: "error",
      message: "Report ID is missing.",
    };
  }

  const supabase = await createClient();

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("id, status")
    .eq("id", reportId)
    .in("status", ["resolved", "rejected", "verified_invalid"])
    .single();

  if (reportError || !report) {
    return {
      status: "error",
      message:
        "Only resolved, rejected, or invalid reports can be archived.",
    };
  }

  const { error } = await supabase
    .from("reports")
    .update({
      status: "archived",
      sla_status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: report.status,
    newStatus: "archived",
    note: "Report has been archived.",
  });

  await recordSlaEvent({
    reportId,
    eventType: "completed",
    note: "SLA completed when report was archived.",
  });

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);
  revalidatePath("/dashboard/admin/archive");
  revalidatePath("/dashboard/admin/follow-up");

  return {
    status: "success",
    message: "Report has been archived successfully.",
  };
}

export async function createOfficialLetter(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireAdmin();

  const reportId = String(formData.get("report_id") || "");

  if (!reportId) {
    return {
      status: "error",
      message: "Report ID is missing.",
    };
  }

  const supabase = await createClient();

  const { data: existingLetter, error: existingLetterError } = await supabase
    .from("official_letters")
    .select("id")
    .eq("report_id", reportId)
    .eq("letter_type", "surat_permohonan_perbaikan")
    .maybeSingle();

  if (existingLetterError) {
    return {
      status: "error",
      message: existingLetterError.message,
    };
  }

  if (existingLetter) {
    return {
      status: "error",
      message: "Official letter for this report already exists.",
    };
  }

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      description,
      status,
      agency_id,
      auto_address,
      manual_address,
      latitude,
      longitude
      `
    )
    .eq("id", reportId)
    .single();

  if (reportError || !report) {
    return {
      status: "error",
      message: "Report not found.",
    };
  }

  if (report.status !== "forwarded_to_agency") {
    return {
      status: "error",
      message:
        "Official letter can only be generated for reports forwarded to an agency.",
    };
  }

  if (!report.agency_id) {
    return {
      status: "error",
      message: "Target agency is missing for this report.",
    };
  }

  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .select("id, name, address")
    .eq("id", report.agency_id)
    .single();

  if (agencyError || !agency) {
    return {
      status: "error",
      message: "Target agency was not found.",
    };
  }

  const letterNumber = generateOfficialLetterNumber(report.report_number);

  const subject = `Permohonan Perbaikan Tindak Lanjut Laporan ${report.report_number}`;

  const location =
    report.manual_address ||
    report.auto_address ||
    `Latitude ${report.latitude}, Longitude ${report.longitude}`;

  const body = [
    "Kepada Yth.",
    agency.name,
    agency.address ? `Alamat: ${agency.address}` : "",
    "",
    "Dengan hormat,",
    "",
    `Sehubungan dengan adanya laporan masyarakat melalui Sistem Lapor Aja dengan nomor laporan ${report.report_number}, Pemerintah Desa bermaksud menyampaikan permohonan tindak lanjut kepada ${agency.name}.`,
    "",
    "Adapun ringkasan laporan adalah sebagai berikut:",
    `Judul Laporan: ${report.title}`,
    `Lokasi: ${location}`,
    `Deskripsi: ${report.description}`,
    "",
    "Berdasarkan hasil peninjauan dan klasifikasi, laporan tersebut berada di luar kewenangan langsung Pemerintah Desa sehingga perlu diteruskan kepada instansi terkait untuk mendapatkan penanganan lebih lanjut.",
    "",
    "Demikian surat permohonan ini dibuat. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.",
  ]
    .filter(Boolean)
    .join("\n");

  const { error } = await supabase.from("official_letters").insert({
    report_id: report.id,
    letter_type: "surat_permohonan_perbaikan",
    letter_number: letterNumber,
    subject,
    body,
    recipient_agency_id: agency.id,
    generated_by: profile.id,
    generated_at: new Date().toISOString(),
    status: "draft",
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/letters");

  return {
    status: "success",
    message: "Official letter draft has been generated.",
  };
}

function generateOfficialLetterNumber(reportNumber: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = toRomanMonth(now.getMonth() + 1);

  return `SPP/${reportNumber}/${month}/${year}`;
}

function toRomanMonth(month: number) {
  const romanMonths: Record<number, string> = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
    7: "VII",
    8: "VIII",
    9: "IX",
    10: "X",
    11: "XI",
    12: "XII",
  };

  return romanMonths[month] ?? String(month);
}

export async function finalizeOfficialLetter(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const letterId = String(formData.get("letter_id") || "");

  if (!letterId) {
    return {
      status: "error",
      message: "Letter ID is missing.",
    };
  }

  const supabase = await createClient();

  const { data: letter, error: letterError } = await supabase
    .from("official_letters")
    .select("id, status")
    .eq("id", letterId)
    .single();

  if (letterError || !letter) {
    return {
      status: "error",
      message: "Official letter not found.",
    };
  }

  if (letter.status === "sent") {
    return {
      status: "error",
      message: "Sent letters cannot be changed.",
    };
  }

  if (letter.status === "final") {
    return {
      status: "success",
      message: "Official letter is already final.",
    };
  }

  const { error } = await supabase
    .from("official_letters")
    .update({
      status: "final",
      updated_at: new Date().toISOString(),
    })
    .eq("id", letterId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/letters");
  revalidatePath(`/dashboard/admin/letters/${letterId}`);

  return {
    status: "success",
    message: "Official letter has been marked as final.",
  };
}

export async function sendOfficialLetterEmail(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const letterId = String(formData.get("letter_id") || "");

  if (!letterId) {
    return {
      status: "error",
      message: "Letter ID is missing.",
    };
  }

  const supabase = await createClient();

  const { data: letter, error: letterError } = await supabase
    .from("official_letters")
    .select(
      `
      id,
      report_id,
      letter_number,
      subject,
      body,
      recipient_agency_id,
      status
      `
    )
    .eq("id", letterId)
    .single();

  if (letterError || !letter) {
    return {
      status: "error",
      message: "Official letter not found.",
    };
  }

  if (letter.status === "draft") {
    return {
      status: "error",
      message: "Please mark the official letter as final before sending it.",
    };
  }

  if (letter.status === "sent") {
    return {
      status: "error",
      message: "This official letter has already been sent.",
    };
  }

  if (!letter.recipient_agency_id) {
    return {
      status: "error",
      message: "Recipient agency is missing.",
    };
  }

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      description,
      manual_address,
      auto_address,
      latitude,
      longitude
      `
    )
    .eq("id", letter.report_id)
    .single();

  if (reportError || !report) {
    return {
      status: "error",
      message: "Related report was not found.",
    };
  }

  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .select("id, name, email, is_active")
    .eq("id", letter.recipient_agency_id)
    .single();

  if (agencyError || !agency) {
    return {
      status: "error",
      message: "Recipient agency was not found.",
    };
  }

  if (!agency.is_active) {
    return {
      status: "error",
      message: "Recipient agency is inactive.",
    };
  }

  if (!agency.email) {
    return {
      status: "error",
      message: "Recipient agency does not have an email address.",
    };
  }

  const location =
    report.manual_address ||
    report.auto_address ||
    `Latitude ${report.latitude}, Longitude ${report.longitude}`;

  try {
    await sendOfficialLetterViaBrevo({
      agencyEmail: agency.email,
      agencyName: agency.name,
      letterNumber: letter.letter_number,
      letterSubject: letter.subject,
      letterBody: letter.body,
      reportNumber: report.report_number,
      reportTitle: report.title,
      reportDescription: report.description,
      reportAddress: location,
    });

    const now = new Date().toISOString();

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: null,
        report_id: report.id,
        recipient_email: agency.email,
        subject: letter.subject,
        message: `Official letter ${letter.letter_number || letter.subject} has been sent to ${agency.name}.`,
        status: "sent",
        sent_at: now,
        error_message: null,
      });

    if (notificationError) {
      console.error("Failed to create sent notification:", notificationError);
    }

    const { error: updateLetterError } = await supabase
      .from("official_letters")
      .update({
        status: "sent",
        updated_at: now,
      })
      .eq("id", letter.id);

    if (updateLetterError) {
      return {
        status: "error",
        message: updateLetterError.message,
      };
    }

    const { error: updateReportError } = await supabase
      .from("reports")
      .update({
        status: "forwarded_to_agency",
        updated_at: now,
      })
      .eq("id", report.id);

    if (updateReportError) {
      return {
        status: "error",
        message: updateReportError.message,
      };
    }

    revalidatePath("/dashboard/admin/letters");
    revalidatePath(`/dashboard/admin/letters/${letter.id}`);

    return {
      status: "success",
      message: `Official letter has been sent to ${agency.name}.`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to send official letter email.";

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: null,
        report_id: report.id,
        recipient_email: agency.email,
        subject: letter.subject,
        message: `Failed to send official letter ${letter.letter_number || letter.subject} to ${agency.name}.`,
        status: "failed",
        sent_at: null,
        error_message: errorMessage,
      });

    if (notificationError) {
      console.error("Failed to create failed notification:", notificationError);
    }

    return {
      status: "error",
      message: errorMessage,
    };
  }
}

const ACTIVE_RELATION_STATUSES = [
  "pending",
  "need_verification",
  "verified_valid",
  "classified",
  "handled_by_village",
  "forwarded_to_agency",
  "waiting_budget",
  "in_progress",
];

const RECURRENCE_REFERENCE_STATUSES = ["resolved", "archived"];
