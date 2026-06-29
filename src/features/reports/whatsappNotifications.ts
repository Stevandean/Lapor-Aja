import { createAdminClient } from "@/src/lib/supabase/admin";
import { sendWhatsvaMessage } from "@/src/lib/whatsapp/whatsva";
import { buildReportStatusWhatsAppMessage } from "@/src/lib/whatsapp/templates";

type NotifyReporterWhatsAppStatusChangeParams = {
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
  "handled_by_village",
  "forwarded_to_agency",
  "waiting_budget",
  "in_progress",
  "resolved",
  "archived",
  "merged",
]);

export async function notifyReporterWhatsAppStatusChange({
  reportId,
  oldStatus = null,
  newStatus,
  note = null,
}: NotifyReporterWhatsAppStatusChangeParams) {
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
      reporter_id
      `
    )
    .eq("id", reportId)
    .single();

  if (reportError || !report) {
    console.error(
      "Failed to fetch report for WhatsApp notification:",
      reportError?.message
    );
    return;
  }

  const { data: reporter, error: reporterError } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone_number, notification_whatsapp_enabled")
    .eq("id", report.reporter_id)
    .single();

  if (reporterError || !reporter) {
    console.error(
      "Failed to fetch reporter for WhatsApp notification:",
      reporterError?.message
    );
    return;
  }

  if (reporter.notification_whatsapp_enabled === false) {
    return;
  }

  if (!reporter.phone_number) {
    console.error("Reporter phone number is missing.");
    return;
  }

  const message = buildReportStatusWhatsAppMessage({
    reporterName: reporter.full_name,
    reportNumber: report.report_number,
    reportTitle: report.title,
    oldStatus,
    newStatus,
    note,
  });

  try {
    const result = await sendWhatsvaMessage({
      phoneNumber: reporter.phone_number,
      message,
    });

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: reporter.id,
        report_id: report.id,
        recipient_email: reporter.email || null,
        recipient_phone: reporter.phone_number,
        subject: `WhatsApp Update Status Laporan ${report.report_number}`,
        message,
        status: "sent",
        sent_at: new Date().toISOString(),
        error_message: null,
        channel: "whatsapp",
        provider: "whatsva",
        provider_message_id:
          result?.id || result?.message_id || result?.data?.id || null,
      });

    if (notificationError) {
      console.error(
        "Failed to save WhatsApp notification:",
        notificationError.message
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to send WhatsApp notification.";

    console.error("Failed to send WhatsApp notification:", errorMessage);

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: reporter.id,
        report_id: report.id,
        recipient_email: reporter.email || null,
        recipient_phone: reporter.phone_number,
        subject: `WhatsApp Update Status Laporan ${report.report_number}`,
        message,
        status: "failed",
        sent_at: null,
        error_message: errorMessage,
        channel: "whatsapp",
        provider: "whatsva",
        provider_message_id: null,
      });

    if (notificationError) {
      console.error(
        "Failed to save failed WhatsApp notification:",
        notificationError.message
      );
    }
  }
}

type NotifyDuplicateReportersWhatsAppStatusChangeParams = {
  masterReportId: string;
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
};

export async function notifyDuplicateReportersWhatsAppStatusChange({
  masterReportId,
  oldStatus = null,
  newStatus,
  note = null,
}: NotifyDuplicateReportersWhatsAppStatusChangeParams) {
  if (!NOTIFIABLE_STATUSES.has(newStatus)) {
    return;
  }

  const supabase = createAdminClient();

  const { data: masterReport, error: masterReportError } = await supabase
    .from("reports")
    .select("id, report_number, title")
    .eq("id", masterReportId)
    .maybeSingle();

  if (masterReportError || !masterReport) {
    console.error(
      "Failed to fetch master report for duplicate WhatsApp notification:",
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
        "Failed to fetch duplicate report relations for WhatsApp notification:",
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
      "Failed to fetch duplicate source reports for WhatsApp notification:",
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
          .select("id, full_name, email, phone_number, notification_whatsapp_enabled")
          .in("id", reporterIds)
      : { data: [], error: null };

  if (reportersError) {
    console.error(
      "Failed to fetch duplicate reporters for WhatsApp notification:",
      reportersError.message
    );
    return;
  }

  const reporterById = new Map(
    (reporters ?? []).map((reporter) => [reporter.id, reporter])
  );

  for (const sourceReport of sourceReports ?? []) {
    const reporter = reporterById.get(sourceReport.reporter_id);

    if (
      !reporter?.phone_number ||
      reporter.notification_whatsapp_enabled === false
    ) {
      continue;
    }

    const duplicateNote = [
      `Laporan Anda (${sourceReport.report_number}) telah digabungkan dengan laporan utama ${masterReport.report_number}.`,
      note || "Status laporan utama telah diperbarui.",
    ].join(" ");
    const message = buildReportStatusWhatsAppMessage({
      reporterName: reporter.full_name,
      reportNumber: masterReport.report_number,
      reportTitle: masterReport.title,
      oldStatus,
      newStatus,
      note: duplicateNote,
    });

    try {
      const result = await sendWhatsvaMessage({
        phoneNumber: reporter.phone_number,
        message,
      });

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: reporter.id,
          report_id: sourceReport.id,
          recipient_email: reporter.email || null,
          recipient_phone: reporter.phone_number,
          subject: `WhatsApp Update Status Laporan Utama ${masterReport.report_number}`,
          message,
          status: "sent",
          sent_at: new Date().toISOString(),
          error_message: null,
          channel: "whatsapp",
          provider: "whatsva",
          provider_message_id:
            result?.id || result?.message_id || result?.data?.id || null,
        });

      if (notificationError) {
        console.error(
          "Failed to save duplicate WhatsApp notification:",
          notificationError.message
        );
      }
    } catch (sendError) {
      const errorMessage =
        sendError instanceof Error
          ? sendError.message
          : "Failed to send duplicate report WhatsApp notification.";

      console.error(
        "Failed to send duplicate report WhatsApp notification:",
        errorMessage
      );

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: reporter.id,
          report_id: sourceReport.id,
          recipient_email: reporter.email || null,
          recipient_phone: reporter.phone_number,
          subject: `WhatsApp Update Status Laporan Utama ${masterReport.report_number}`,
          message,
          status: "failed",
          sent_at: null,
          error_message: errorMessage,
          channel: "whatsapp",
          provider: "whatsva",
          provider_message_id: null,
        });

      if (notificationError) {
        console.error(
          "Failed to save failed duplicate WhatsApp notification:",
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
