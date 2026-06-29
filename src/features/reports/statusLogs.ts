import { revalidatePath } from "next/cache";
import { getProfile } from "@/src/lib/auth/getProfile";
import { createClient } from "@/src/lib/supabase/server";
import {
  notifyDuplicateReportersStatusChange,
  notifyReporterStatusChange,
} from "@/src/features/reports/statusNotifications";
import {
  notifyDuplicateReportersWhatsAppStatusChange,
  notifyReporterWhatsAppStatusChange,
} from "@/src/features/reports/whatsappNotifications";
import {
  notifyDuplicateReportersInternalStatusChange,
  notifyReporterInternalStatusChange,
} from "@/src/features/reports/internalNotifications";

type CreateStatusLogParams = {
  reportId: string;
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
  notifyReporter?: boolean;
  notifyWhatsApp?: boolean;
};

export async function createReportStatusLog({
  reportId,
  oldStatus = null,
  newStatus,
  note = null,
  notifyReporter = true,
  notifyWhatsApp = true,
}: CreateStatusLogParams) {
  const profile = await getProfile();

  if (!profile) {
    return;
  }

  const supabase = await createClient();

  const { error } = await supabase.from("report_status_logs").insert({
    report_id: reportId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: profile.id,
    note,
  });

  if (error) {
    console.error("Failed to create report status log:", error.message);
    return;
  }

  if (notifyReporter) {
    await notifyReporterInternalStatusChange({
      reportId,
      oldStatus,
      newStatus,
      note,
    });

    await notifyDuplicateReportersInternalStatusChange({
      masterReportId: reportId,
      oldStatus,
      newStatus,
      note,
    });

    revalidatePath("/dashboard/public");
  }

  if (notifyReporter) {
    await notifyReporterStatusChange({
      reportId,
      oldStatus,
      newStatus,
      note,
    });

    await notifyDuplicateReportersStatusChange({
      masterReportId: reportId,
      oldStatus,
      newStatus,
      note,
    });
  }
  if (notifyWhatsApp) {
    await notifyReporterWhatsAppStatusChange({
      reportId,
      oldStatus,
      newStatus,
      note,
    });

    await notifyDuplicateReportersWhatsAppStatusChange({
      masterReportId: reportId,
      oldStatus,
      newStatus,
      note,
    });
  }
}
