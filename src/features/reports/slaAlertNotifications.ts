import { revalidatePath } from "next/cache";
import { calculateEffectiveSlaStatus } from "@/src/lib/sla";
import { sendBrevoEmail } from "@/src/lib/email/brevo";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { sendWhatsvaMessage } from "@/src/lib/whatsapp/whatsva";

type SlaAlertType = "at_risk" | "overdue";

type SlaAlertReport = {
  id: string;
  report_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  resolution_due_at: string | null;
  resolved_at: string | null;
  manual_address: string | null;
  auto_address: string | null;
  latitude: number | null;
  longitude: number | null;
};

type StaffRecipient = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  role: string;
  notification_internal_enabled?: boolean | null;
  notification_email_enabled?: boolean | null;
  notification_whatsapp_enabled?: boolean | null;
};

type SendSlaAlertNotificationsParams = {
  triggeredBy?: string | null;
};

type NotificationPayload = {
  userId: string;
  reportId: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  subject: string;
  message: string;
  channel: "internal" | "email" | "whatsapp";
  status: "sent" | "failed";
  provider?: string | null;
  providerMessageId?: string | null;
  errorMessage?: string | null;
};

const ALERT_RECIPIENT_ROLES = ["admin", "kepala_desa", "sekdes"];

export async function sendSlaAlertNotifications({
  triggeredBy = null,
}: SendSlaAlertNotificationsParams = {}) {
  const supabase = createAdminClient();

  const [{ data: reportRows, error: reportsError }, { data: recipients, error: recipientsError }] =
    await Promise.all([
      supabase
        .from("reports")
        .select(
          `
          id,
          report_number,
          title,
          status,
          priority,
          created_at,
          resolution_due_at,
          resolved_at,
          manual_address,
          auto_address,
          latitude,
          longitude
          `
        )
        .not("resolution_due_at", "is", null)
        .order("updated_at", { ascending: false })
        .limit(200),
      supabase
        .from("profiles")
        .select(
          "id, full_name, email, phone_number, role, notification_internal_enabled, notification_email_enabled, notification_whatsapp_enabled"
        )
        .in("role", ALERT_RECIPIENT_ROLES)
        .eq("is_active", true),
    ]);

  if (reportsError) {
    return {
      status: "error" as const,
      message: reportsError.message,
      processed: 0,
      skipped: 0,
      failed: 0,
    };
  }

  if (recipientsError) {
    return {
      status: "error" as const,
      message: recipientsError.message,
      processed: 0,
      skipped: 0,
      failed: 0,
    };
  }

  const alertReports = ((reportRows ?? []) as SlaAlertReport[])
    .map((report) => ({
      report,
      alertType: calculateEffectiveSlaStatus(report),
    }))
    .filter(
      (item): item is { report: SlaAlertReport; alertType: SlaAlertType } =>
        item.alertType === "at_risk" || item.alertType === "overdue"
    );

  if (alertReports.length === 0) {
    return {
      status: "success" as const,
      message: "No at-risk or overdue SLA reports found.",
      processed: 0,
      skipped: 0,
      failed: 0,
    };
  }

  if (!recipients || recipients.length === 0) {
    return {
      status: "success" as const,
      message: "SLA alerts found, but no active staff recipients are available.",
      processed: 0,
      skipped: alertReports.length,
      failed: 0,
    };
  }

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const { report, alertType } of alertReports) {
    const lockResult = await createSlaAlertLock({
      reportId: report.id,
      alertType,
      triggeredBy,
    });

    if (lockResult === "missing_schema") {
      return {
        status: "error" as const,
        message:
          "SLA alert notification schema is not available yet. Apply migration supabase/migrations/202606250005_sla_alert_notifications.sql.",
        processed,
        skipped,
        failed,
      };
    }

    if (lockResult === "duplicate") {
      skipped += 1;
      continue;
    }

    if (lockResult === "error") {
      failed += 1;
      continue;
    }

    const alertMessage = buildSlaAlertMessage(report, alertType);
    const alertSubject = buildSlaAlertSubject(report, alertType);

    for (const recipient of recipients as StaffRecipient[]) {
      if (recipient.notification_internal_enabled !== false) {
        await createNotificationRecord({
          userId: recipient.id,
          reportId: report.id,
          recipientEmail: recipient.email,
          subject: alertSubject,
          message: alertMessage,
          channel: "internal",
          status: "sent",
        });
      }

      if (recipient.email && recipient.notification_email_enabled !== false) {
        await sendSlaEmailNotification({
          recipient,
          report,
          alertType,
          subject: alertSubject,
          message: alertMessage,
        });
      }

      if (
        recipient.phone_number &&
        recipient.notification_whatsapp_enabled !== false
      ) {
        await sendSlaWhatsAppNotification({
          recipient,
          report,
          alertType,
          subject: alertSubject,
          message: alertMessage,
        });
      }
    }

    processed += 1;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/village/sla");

  return {
    status: failed > 0 ? ("error" as const) : ("success" as const),
    message:
      failed > 0
        ? `SLA alerts completed with ${failed} failed report(s).`
        : `SLA alerts sent for ${processed} report(s). ${skipped} duplicate alert(s) skipped.`,
    processed,
    skipped,
    failed,
  };
}

async function createSlaAlertLock({
  reportId,
  alertType,
  triggeredBy,
}: {
  reportId: string;
  alertType: SlaAlertType;
  triggeredBy: string | null;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("report_sla_alert_notifications")
    .insert({
      report_id: reportId,
      alert_type: alertType,
      triggered_by: triggeredBy,
    });

  if (!error) {
    return "created" as const;
  }

  if (isMissingSlaAlertSchemaError(error.message)) {
    return "missing_schema" as const;
  }

  if (
    error.message.includes("duplicate key") ||
    error.message.includes("unique")
  ) {
    return "duplicate" as const;
  }

  console.error("Failed to create SLA alert lock:", error.message);
  return "error" as const;
}

async function sendSlaEmailNotification({
  recipient,
  report,
  alertType,
  subject,
  message,
}: {
  recipient: StaffRecipient;
  report: SlaAlertReport;
  alertType: SlaAlertType;
  subject: string;
  message: string;
}) {
  try {
    await sendBrevoEmail({
      to: recipient.email || "",
      toName: recipient.full_name || recipient.email || "Village Officer",
      subject,
      htmlContent: buildSlaEmailHtml({
        recipientName: recipient.full_name || "Village Officer",
        report,
        alertType,
        message,
      }),
      textContent: buildSlaEmailText({
        recipientName: recipient.full_name || "Village Officer",
        report,
        alertType,
        message,
      }),
    });

    await createNotificationRecord({
      userId: recipient.id,
      reportId: report.id,
      recipientEmail: recipient.email,
      subject,
      message,
      channel: "email",
      status: "sent",
      provider: "brevo",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send SLA email.";

    console.error("Failed to send SLA email notification:", errorMessage);

    await createNotificationRecord({
      userId: recipient.id,
      reportId: report.id,
      recipientEmail: recipient.email,
      subject,
      message,
      channel: "email",
      status: "failed",
      provider: "brevo",
      errorMessage,
    });
  }
}

async function sendSlaWhatsAppNotification({
  recipient,
  report,
  subject,
  message,
}: {
  recipient: StaffRecipient;
  report: SlaAlertReport;
  alertType: SlaAlertType;
  subject: string;
  message: string;
}) {
  try {
    const result = await sendWhatsvaMessage({
      phoneNumber: recipient.phone_number || "",
      message,
    });

    await createNotificationRecord({
      userId: recipient.id,
      reportId: report.id,
      recipientEmail: recipient.email,
      recipientPhone: recipient.phone_number,
      subject,
      message,
      channel: "whatsapp",
      status: "sent",
      provider: "whatsva",
      providerMessageId:
        result?.id || result?.message_id || result?.data?.id || null,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send SLA WhatsApp.";

    console.error("Failed to send SLA WhatsApp notification:", errorMessage);

    await createNotificationRecord({
      userId: recipient.id,
      reportId: report.id,
      recipientEmail: recipient.email,
      recipientPhone: recipient.phone_number,
      subject,
      message,
      channel: "whatsapp",
      status: "failed",
      provider: "whatsva",
      errorMessage,
    });
  }
}

async function createNotificationRecord({
  userId,
  reportId,
  recipientEmail,
  recipientPhone,
  subject,
  message,
  channel,
  status,
  provider = null,
  providerMessageId = null,
  errorMessage = null,
}: NotificationPayload) {
  const supabase = createAdminClient();
  const sentAt = status === "sent" ? new Date().toISOString() : null;
  const basePayload = {
    user_id: userId,
    report_id: reportId,
    recipient_email: recipientEmail || "",
    subject,
    message,
    status,
    sent_at: sentAt,
    error_message: errorMessage,
  };
  const { error } = await supabase.from("notifications").insert({
    ...basePayload,
    recipient_phone: recipientPhone || null,
    channel,
    provider,
    provider_message_id: providerMessageId,
  });

  if (!error) {
    return;
  }

  if (!isMissingNotificationChannelError(error.message)) {
    console.error("Failed to create SLA notification record:", error.message);
    return;
  }

  const { error: fallbackError } = await supabase
    .from("notifications")
    .insert(basePayload);

  if (fallbackError) {
    console.error(
      "Failed to create fallback SLA notification record:",
      fallbackError.message
    );
  }
}

function buildSlaAlertSubject(report: SlaAlertReport, alertType: SlaAlertType) {
  return `${getSlaAlertLabel(alertType)} SLA ${report.report_number}`;
}

function buildSlaAlertMessage(report: SlaAlertReport, alertType: SlaAlertType) {
  return [
    `${getSlaAlertLabel(alertType)}: laporan ${report.report_number} (${report.title}).`,
    `Deadline resolusi: ${
      report.resolution_due_at ? formatDateTime(report.resolution_due_at) : "-"
    }.`,
    `Prioritas: ${formatEnum(report.priority)}.`,
    `Lokasi: ${getReportAddress(report)}.`,
  ].join(" ");
}

function buildSlaEmailHtml({
  recipientName,
  report,
  alertType,
  message,
}: {
  recipientName: string;
  report: SlaAlertReport;
  alertType: SlaAlertType;
  message: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111827;">
      <p>Halo ${escapeHtml(recipientName)},</p>
      <p>${escapeHtml(message)}</p>
      <div style="margin: 20px 0; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <p><strong>Status SLA:</strong> ${escapeHtml(getSlaAlertLabel(alertType))}</p>
        <p><strong>Nomor Laporan:</strong> ${escapeHtml(report.report_number)}</p>
        <p><strong>Judul:</strong> ${escapeHtml(report.title)}</p>
        <p><strong>Prioritas:</strong> ${escapeHtml(formatEnum(report.priority))}</p>
        <p><strong>Deadline Resolusi:</strong> ${escapeHtml(report.resolution_due_at ? formatDateTime(report.resolution_due_at) : "-")}</p>
        <p><strong>Lokasi:</strong> ${escapeHtml(getReportAddress(report))}</p>
      </div>
      <p>Mohon segera lakukan pengecekan pada dashboard SLA Monitoring.</p>
      <p>Hormat kami,<br /><strong>Sistem Lapor Aja</strong></p>
    </div>
  `;
}

function buildSlaEmailText({
  recipientName,
  report,
  alertType,
  message,
}: {
  recipientName: string;
  report: SlaAlertReport;
  alertType: SlaAlertType;
  message: string;
}) {
  return `
Halo ${recipientName},

${message}

Status SLA: ${getSlaAlertLabel(alertType)}
Nomor Laporan: ${report.report_number}
Judul: ${report.title}
Prioritas: ${formatEnum(report.priority)}
Deadline Resolusi: ${report.resolution_due_at ? formatDateTime(report.resolution_due_at) : "-"}
Lokasi: ${getReportAddress(report)}

Mohon segera lakukan pengecekan pada dashboard SLA Monitoring.
  `.trim();
}

function getSlaAlertLabel(alertType: SlaAlertType) {
  return alertType === "overdue" ? "Overdue" : "At Risk";
}

function getReportAddress(report: SlaAlertReport) {
  return (
    report.manual_address ||
    report.auto_address ||
    (report.latitude && report.longitude
      ? `Latitude ${report.latitude}, Longitude ${report.longitude}`
      : "-")
  );
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatEnum(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isMissingNotificationChannelError(message: string | null | undefined) {
  return Boolean(
    message?.includes("notifications") &&
      (message.includes("schema cache") || message.includes("column"))
  );
}

function isMissingSlaAlertSchemaError(message: string | null | undefined) {
  return Boolean(
    message?.includes("report_sla_alert_notifications") &&
      (message.includes("does not exist") ||
        message.includes("Could not find the table") ||
        message.includes("schema cache"))
  );
}
