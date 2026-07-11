import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/src/lib/supabase/admin";

type NotificationReport = {
  id: string;
  report_number: string;
  title: string;
  reporter_id: string | null;
};

type NotificationProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  notification_internal_enabled?: boolean | null;
};

type CreateInternalNotificationParams = {
  userId: string;
  recipientEmail: string | null;
  reportId: string;
  subject: string;
  message: string;
};

type NotifyReporterInternalStatusChangeParams = {
  reportId: string;
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
};

type NotifyDuplicateReportersInternalStatusChangeParams = {
  masterReportId: string;
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
};

type NotifyReporterRelationParams = {
  sourceReportId: string;
  targetReportId: string;
  note?: string | null;
};

type NotifyUsersInternalParams = {
  userIds: string[];
  reportId: string;
  subject: string;
  message: string;
};

type NotifyRoleInternalParams = {
  roles: string[];
  reportId: string;
  subject: string;
  message: string;
};

type NotifyHamletHeadsParams = {
  hamletId: string;
  reportId: string;
  reportNumber: string;
  reportTitle: string;
};

type NotifySectionKasiParams = {
  sectionId: string;
  reportId: string;
  reportNumber: string;
  reportTitle: string;
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

export async function notifyReporterInternalStatusChange({
  reportId,
  newStatus,
  note = null,
}: NotifyReporterInternalStatusChangeParams) {
  if (!NOTIFIABLE_STATUSES.has(newStatus)) {
    return;
  }

  const report = await getReportById(reportId);

  if (!report?.reporter_id) {
    return;
  }

  const reporter = await getProfileById(report.reporter_id);

  if (!reporter) {
    return;
  }

  if (reporter.notification_internal_enabled === false) {
    return;
  }

  await createInternalNotification({
    userId: reporter.id,
    recipientEmail: reporter.email,
    reportId: report.id,
    subject: `Update laporan ${report.report_number}`,
    message:
      note ||
      `Status laporan ${report.report_number} telah diperbarui menjadi ${formatStatus(newStatus)}.`,
  });
}

export async function notifyDuplicateReportersInternalStatusChange({
  masterReportId,
  oldStatus = null,
  newStatus,
  note = null,
}: NotifyDuplicateReportersInternalStatusChangeParams) {
  if (!NOTIFIABLE_STATUSES.has(newStatus)) {
    return;
  }

  const supabase = createAdminClient();
  const masterReport = await getReportById(masterReportId);

  if (!masterReport) {
    return;
  }

  const { data: relations, error: relationsError } = await supabase
    .from("report_relations")
    .select("source_report_id")
    .eq("target_report_id", masterReportId)
    .eq("relation_type", "duplicate");

  if (relationsError) {
    if (!isMissingReportRelationsError(relationsError.message)) {
      console.error(
        "Failed to fetch duplicate relations for internal notifications:",
        relationsError.message
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
      "Failed to fetch duplicate source reports for internal notifications:",
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

  const reportersById = await getProfilesById(reporterIds);
  const statusText =
    oldStatus && oldStatus !== newStatus
      ? `${formatStatus(oldStatus)} ke ${formatStatus(newStatus)}`
      : formatStatus(newStatus);

  for (const sourceReport of sourceReports ?? []) {
    const reporter = sourceReport.reporter_id
      ? reportersById.get(sourceReport.reporter_id)
      : null;

    if (!reporter) {
      continue;
    }

    if (reporter.notification_internal_enabled === false) {
      continue;
    }

    await createInternalNotification({
      userId: reporter.id,
      recipientEmail: reporter.email,
      reportId: sourceReport.id,
      subject: `Update laporan utama ${masterReport.report_number}`,
      message: [
        `Laporan Anda (${sourceReport.report_number}) telah digabungkan ke laporan utama ${masterReport.report_number}.`,
        `Status laporan utama diperbarui: ${statusText}.`,
        note || null,
      ]
        .filter(Boolean)
        .join(" "),
    });
  }
}

export async function notifyReporterRecurringIssue({
  sourceReportId,
  targetReportId,
  note = null,
}: NotifyReporterRelationParams) {
  const sourceReport = await getReportById(sourceReportId);
  const targetReport = await getReportById(targetReportId);

  if (!sourceReport?.reporter_id || !targetReport) {
    return;
  }

  const reporter = await getProfileById(sourceReport.reporter_id);

  if (!reporter) {
    return;
  }

  if (reporter.notification_internal_enabled === false) {
    return;
  }

  await createInternalNotification({
    userId: reporter.id,
    recipientEmail: reporter.email,
    reportId: sourceReport.id,
    subject: `Laporan berulang ${sourceReport.report_number}`,
    message: [
      `Laporan Anda (${sourceReport.report_number}) ditandai sebagai masalah berulang dari laporan ${targetReport.report_number}.`,
      note || null,
    ]
      .filter(Boolean)
      .join(" "),
  });
}

export async function notifyUsersInternal({
  userIds,
  reportId,
  subject,
  message,
}: NotifyUsersInternalParams) {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  const profilesById = await getProfilesById(uniqueUserIds);

  for (const userId of uniqueUserIds) {
    const profile = profilesById.get(userId);

    if (!profile) {
      continue;
    }

    if (profile.notification_internal_enabled === false) {
      continue;
    }

    await createInternalNotification({
      userId: profile.id,
      recipientEmail: profile.email,
      reportId,
      subject,
      message,
    });
  }
}

export async function notifyRoleInternal({
  roles,
  reportId,
  subject,
  message,
}: NotifyRoleInternalParams) {
  const uniqueRoles = Array.from(new Set(roles.filter(Boolean)));

  if (uniqueRoles.length === 0) {
    return;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, notification_internal_enabled")
    .in("role", uniqueRoles)
    .eq("is_active", true);

  if (error) {
    console.error("Failed to fetch role notification recipients:", error.message);
    return;
  }

  for (const profile of data ?? []) {
    if (profile.notification_internal_enabled === false) {
      continue;
    }

    await createInternalNotification({
      userId: profile.id,
      recipientEmail: profile.email,
      reportId,
      subject,
      message,
    });
  }
}

export async function notifyHamletHeadsForVerification({
  hamletId,
  reportId,
  reportNumber,
  reportTitle,
}: NotifyHamletHeadsParams) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, notification_internal_enabled")
    .eq("role", "kepala_dusun")
    .eq("dusun_id", hamletId)
    .eq("is_active", true);

  if (error) {
    console.error("Failed to fetch hamlet head recipients:", error.message);
    return;
  }

  for (const profile of data ?? []) {
    if (profile.notification_internal_enabled === false) {
      continue;
    }

    await createInternalNotification({
      userId: profile.id,
      recipientEmail: profile.email,
      reportId,
      subject: `Verifikasi baru ${reportNumber}`,
      message: `Laporan ${reportNumber} (${reportTitle}) perlu diverifikasi di wilayah dusun Anda.`,
    });
  }
}

export async function notifySectionKasiAssignment({
  sectionId,
  reportId,
  reportNumber,
  reportTitle,
}: NotifySectionKasiParams) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, notification_internal_enabled")
    .eq("role", "kasi")
    .eq("section_id", sectionId)
    .eq("is_active", true);

  if (error) {
    console.error("Failed to fetch Kasi recipients:", error.message);
    return;
  }

  for (const profile of data ?? []) {
    if (profile.notification_internal_enabled === false) {
      continue;
    }

    await createInternalNotification({
      userId: profile.id,
      recipientEmail: profile.email,
      reportId,
      subject: `Laporan baru ditugaskan ${reportNumber}`,
      message: `Laporan ${reportNumber} (${reportTitle}) telah ditugaskan ke seksi Anda.`,
    });
  }
}

async function getReportById(reportId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id, report_number, title, reporter_id")
    .eq("id", reportId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch report for internal notification:", error.message);
    return null;
  }

  return data as NotificationReport | null;
}

async function getProfileById(profileId: string) {
  const profiles = await getProfilesById([profileId]);

  return profiles.get(profileId) ?? null;
}

async function getProfilesById(profileIds: string[]) {
  const profilesById = new Map<string, NotificationProfile>();

  if (profileIds.length === 0) {
    return profilesById;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, notification_internal_enabled")
    .in("id", profileIds);

  if (error) {
    console.error(
      "Failed to fetch profiles for internal notifications:",
      error.message
    );
    return profilesById;
  }

  for (const profile of data ?? []) {
    profilesById.set(profile.id, profile as NotificationProfile);
  }

  return profilesById;
}

async function createInternalNotification({
  userId,
  recipientEmail,
  reportId,
  subject,
  message,
}: CreateInternalNotificationParams) {
  const supabase = createAdminClient();
  const sentAt = new Date().toISOString();
  const basePayload = {
    user_id: userId,
    report_id: reportId,
    recipient_email: recipientEmail || "",
    subject,
    message,
    status: "sent",
    sent_at: sentAt,
    error_message: null,
  };

  const { error } = await supabase.from("notifications").insert({
    ...basePayload,
    channel: "internal",
    provider: null,
    provider_message_id: null,
  });

  if (!error) {
    revalidatePath("/dashboard");
    return;
  }

  if (!isMissingNotificationChannelError(error.message)) {
    console.error("Failed to create internal notification:", error.message);
    return;
  }

  const { error: fallbackError } = await supabase
    .from("notifications")
    .insert(basePayload);

  if (fallbackError) {
    console.error(
      "Failed to create fallback internal notification:",
      fallbackError.message
    );
    return;
  }

  revalidatePath("/dashboard");
}

function isMissingNotificationChannelError(message: string | null | undefined) {
  return Boolean(
    message?.includes("notifications") &&
      message.includes("channel") &&
      (message.includes("schema cache") || message.includes("column"))
  );
}

function isMissingReportRelationsError(message: string | null | undefined) {
  return Boolean(
    message?.includes("report_relations") &&
      (message.includes("does not exist") ||
        message.includes("Could not find the table"))
  );
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    pending: "Menunggu Review",
    need_verification: "Perlu Verifikasi",
    verified_valid: "Terverifikasi Valid",
    verified_invalid: "Terverifikasi Tidak Valid",
    classified: "Diklasifikasi",
    handled_by_village: "Ditangani Desa",
    forwarded_to_agency: "Diteruskan ke Instansi",
    waiting_budget: "Menunggu Anggaran",
    in_progress: "Diproses",
    resolved: "Selesai",
    rejected: "Ditolak",
    archived: "Diarsipkan",
    merged: "Digabungkan",
  };

  return labels[status] ?? status.replaceAll("_", " ");
}
