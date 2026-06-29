"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { createClient } from "@/src/lib/supabase/server";
import type { ActionState } from "@/src/types/action";
import { createReportStatusLog } from "@/src/features/reports/statusLogs";
import { recordSlaEvent } from "@/src/features/reports/slaEvents";
import { notifyRoleInternal } from "@/src/features/reports/internalNotifications";

async function requireHamletHead() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (profile.role !== "kepala_dusun") {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}

function isValidImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

export async function verifyReport(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireHamletHead();

  if (!profile.dusun_id) {
    return {
      status: "error",
      message: "Your account has not been assigned to a hamlet.",
    };
  }

  const reportId = String(formData.get("report_id") || "");
  const result = String(formData.get("result") || "");
  const verificationNote = String(formData.get("verification_note") || "").trim();

  const photos = formData
    .getAll("verification_photos")
    .filter((file): file is File => file instanceof File && file.size > 0);

  if (!reportId) {
    return {
      status: "error",
      message: "Report ID is missing.",
    };
  }

  if (result !== "valid" && result !== "invalid") {
    return {
      status: "error",
      message: "Please choose a verification result.",
    };
  }

  if (!verificationNote) {
    return {
      status: "error",
      message: "Please write a verification note.",
    };
  }

  if (photos.length === 0) {
    return {
      status: "error",
      message: "Please upload at least one verification photo.",
    };
  }

  if (photos.length > 5) {
    return {
      status: "error",
      message: "You can upload a maximum of 5 verification photos.",
    };
  }

  for (const photo of photos) {
    if (!isValidImage(photo)) {
      return {
        status: "error",
        message: "Only JPG, PNG, and WEBP images are allowed.",
      };
    }

    if (photo.size > 10 * 1024 * 1024) {
      return {
        status: "error",
        message: "Each photo must be less than 10MB.",
      };
    }
  }

  const supabase = await createClient();

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("id, report_number, title, dusun_id, status")
    .eq("id", reportId)
    .eq("dusun_id", profile.dusun_id)
    .eq("status", "need_verification")
    .single();

  if (reportError || !report) {
    return {
      status: "error",
      message:
        "Report not found, already verified, or not assigned to your hamlet.",
    };
  }

  const isValid = result === "valid";
  const newStatus = isValid ? "verified_valid" : "verified_invalid";

  const { data: verification, error: verificationError } = await supabase
    .from("report_verifications")
    .insert({
        report_id: reportId,
        verified_by: profile.id,
        is_valid: isValid,
        verification_note: verificationNote,
    })
    .select("id")
    .single();

  if (verificationError || !verification) {
    return {
      status: "error",
      message: verificationError?.message || "Failed to save verification data.",
    };
  }

  for (const photo of photos) {
    const extension = photo.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `${profile.id}/${reportId}/${verification.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("verification-photos")
      .upload(filePath, photo, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      return {
        status: "error",
        message: uploadError.message,
      };
    }

    const { error: photoError } = await supabase
      .from("verification_photos")
      .insert({
        verification_id: verification.id,
        file_path: filePath,
        photo_url: filePath,
      });

    if (photoError) {
      return {
        status: "error",
        message: photoError.message,
      };
    }
  }

  const { error: updateError } = await supabase
    .from("reports")
    .update({
      status: newStatus,
      ...(!isValid ? { sla_status: "completed" } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (updateError) {
    return {
      status: "error",
      message: updateError.message,
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: "need_verification",
    newStatus,
    note: isValid
      ? "Report verified as valid by hamlet head."
      : "Report verified as invalid by hamlet head.",
  });

  if (!isValid) {
    await recordSlaEvent({
      reportId,
      eventType: "completed",
      note: "SLA completed when report was verified as invalid.",
    });
  }

  await notifyRoleInternal({
    roles: ["admin"],
    reportId,
    subject: `Verifikasi selesai ${report.report_number}`,
    message: `Kepala dusun telah memverifikasi laporan ${report.report_number} (${report.title}) sebagai ${isValid ? "valid" : "tidak valid"}. Catatan: ${verificationNote}`,
  });

  revalidatePath("/dashboard/hamlet-head/verification");
  revalidatePath(`/dashboard/hamlet-head/verification/${reportId}`);
  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);

  return {
    status: "success",
    message:
      result === "valid"
        ? "Report has been verified as valid."
        : "Report has been verified as invalid.",
  };
}
