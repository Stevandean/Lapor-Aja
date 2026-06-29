import { createAdminClient } from "@/src/lib/supabase/admin";
import { sendReportStatusNotificationViaBrevo } from "@/src/lib/email/sendEmail";

type NotifyReporterStatusChangeParams = {
  reportId: string;
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
};

const NOTIFIABLE_STATUSES = new Set([
  "need_verification",
  "rejected",
  "verified_valid",
  "verified_invalid",
//   "classified",
  "handled_by_village",
  "forwarded_to_agency",
  "waiting_budget",
  "in_progress",
  "resolved",
  "archived",
  "merged",
]);

export async function notifyReporterStatusChange({
  reportId,
  oldStatus = null,
  newStatus,
  note = null,
}: NotifyReporterStatusChangeParams) {
  if (!NOTIFIABLE_STATUSES.has(newStatus)) {
    return;
  }

  const supabase = createAdminClient();

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      reporter_id,
      manual_address,
      auto_address,
      latitude,
      longitude
      `
    )
    .eq("id", reportId)
    .single();

  if (reportError || !report) {
    console.error(
      "Failed to fetch report for status notification:",
      reportError?.message
    );
    return;
  }

  const { data: reporter, error: reporterError } = await supabase
    .from("profiles")
    .select("id, full_name, email, notification_email_enabled")
    .eq("id", report.reporter_id)
    .single();

  if (reporterError || !reporter) {
    console.error(
      "Failed to fetch reporter for status notification:",
      reporterError?.message
    );
    return;
  }

  if (reporter.notification_email_enabled === false) {
    return;
  }

  if (!reporter.email) {
    console.error("Reporter email is missing.");
    return;
  }

  const reportAddress =
    report.manual_address ||
    report.auto_address ||
    `Latitude ${report.latitude}, Longitude ${report.longitude}`;

  try {
    await sendReportStatusNotificationViaBrevo({
      reporterEmail: reporter.email,
      reporterName: reporter.full_name,
      reportNumber: report.report_number,
      reportTitle: report.title,
      oldStatus,
      newStatus,
      note,
      reportAddress,
    });

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: reporter.id,
        report_id: report.id,
        recipient_email: reporter.email,
        subject: `Update Status Laporan ${report.report_number}`,
        message:
          note ||
          `Status laporan ${report.report_number} telah diperbarui menjadi ${newStatus}.`,
        status: "sent",
        sent_at: new Date().toISOString(),
        error_message: null,
      });

    if (notificationError) {
      console.error(
        "Failed to save sent notification:",
        notificationError.message
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to send report status notification.";

    console.error("Failed to send report status notification:", errorMessage);

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: reporter.id,
        report_id: report.id,
        recipient_email: reporter.email,
        subject: `Update Status Laporan ${report.report_number}`,
        message:
          note ||
          `Status laporan ${report.report_number} gagal dikirim melalui email.`,
        status: "failed",
        sent_at: null,
        error_message: errorMessage,
      });

    if (notificationError) {
      console.error(
        "Failed to save failed notification:",
        notificationError.message
      );
    }
  }
}

type NotifyDuplicateReportersStatusChangeParams = {
  masterReportId: string;
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
};

export async function notifyDuplicateReportersStatusChange({
  masterReportId,
  oldStatus = null,
  newStatus,
  note = null,
}: NotifyDuplicateReportersStatusChangeParams) {
  if (!NOTIFIABLE_STATUSES.has(newStatus)) {
    return;
  }

  const supabase = createAdminClient();

  const { data: masterReport, error: masterReportError } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      manual_address,
      auto_address,
      latitude,
      longitude
      `
    )
    .eq("id", masterReportId)
    .maybeSingle();

  if (masterReportError || !masterReport) {
    console.error(
      "Failed to fetch master report for duplicate notification:",
      masterReportError?.message
    );
    return;
  }

  const { data: relations, error } = await supabase
    .from("report_relations")
    .select("source_report_id")
    .eq("target_report_id", masterReportId)
    .eq("relation_type", "duplicate");

  if (error) {
    if (!isMissingReportRelationsError(error.message)) {
      console.error(
        "Failed to fetch duplicate report relations for status notification:",
        error.message
      );
    }

    return;
  }

  const sourceReportIds = Array.from(
    new Set((relations ?? []).map((relation) => relation.source_report_id))
  );

  if (sourceReportIds.length === 0) {
    return;
  }

  const { data: sourceReports, error: sourceReportsError } = await supabase
    .from("reports")
    .select("id, report_number, title, reporter_id")
    .in("id", sourceReportIds);

  if (sourceReportsError) {
    console.error(
      "Failed to fetch duplicate source reports for status notification:",
      sourceReportsError.message
    );
    return;
  }

  const reporterIds = Array.from(
    new Set(
      (sourceReports ?? [])
        .map((sourceReport) => sourceReport.reporter_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const { data: reporters, error: reportersError } =
    reporterIds.length > 0
        ? await supabase
            .from("profiles")
          .select("id, full_name, email, notification_email_enabled")
          .in("id", reporterIds)
      : { data: [], error: null };

  if (reportersError) {
    console.error(
      "Failed to fetch duplicate reporters for status notification:",
      reportersError.message
    );
    return;
  }

  const reporterById = new Map(
    (reporters ?? []).map((reporter) => [reporter.id, reporter])
  );
  const reportAddress =
    masterReport.manual_address ||
    masterReport.auto_address ||
    `Latitude ${masterReport.latitude}, Longitude ${masterReport.longitude}`;

  for (const sourceReport of sourceReports ?? []) {
    const reporter = reporterById.get(sourceReport.reporter_id);

    if (!reporter?.email || reporter.notification_email_enabled === false) {
      continue;
    }

    const duplicateNote = [
      `Laporan Anda (${sourceReport.report_number}) telah digabungkan dengan laporan utama ${masterReport.report_number}.`,
      note || "Status laporan utama telah diperbarui.",
    ].join(" ");

    try {
      await sendReportStatusNotificationViaBrevo({
        reporterEmail: reporter.email,
        reporterName: reporter.full_name,
        reportNumber: masterReport.report_number,
        reportTitle: masterReport.title,
        oldStatus,
        newStatus,
        note: duplicateNote,
        reportAddress,
      });

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: reporter.id,
          report_id: sourceReport.id,
          recipient_email: reporter.email,
          subject: `Update Status Laporan Utama ${masterReport.report_number}`,
          message: duplicateNote,
          status: "sent",
          sent_at: new Date().toISOString(),
          error_message: null,
        });

      if (notificationError) {
        console.error(
          "Failed to save duplicate status notification:",
          notificationError.message
        );
      }
    } catch (sendError) {
      const errorMessage =
        sendError instanceof Error
          ? sendError.message
          : "Failed to send duplicate report status notification.";

      console.error(
        "Failed to send duplicate report status notification:",
        errorMessage
      );

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: reporter.id,
          report_id: sourceReport.id,
          recipient_email: reporter.email,
          subject: `Update Status Laporan Utama ${masterReport.report_number}`,
          message: duplicateNote,
          status: "failed",
          sent_at: null,
          error_message: errorMessage,
        });

      if (notificationError) {
        console.error(
          "Failed to save failed duplicate status notification:",
          notificationError.message
        );
      }
    }
  }
}

function isMissingReportRelationsError(message: string | null | undefined) {
  return Boolean(
    message?.includes("report_relations") &&
      (message.includes("does not exist") ||
        message.includes("Could not find the table"))
  );
}
