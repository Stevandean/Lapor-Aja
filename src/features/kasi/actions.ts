"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createReportStatusLog } from "@/src/features/reports/statusLogs";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { createClient } from "@/src/lib/supabase/server";
import type { ActionState } from "@/src/types/action";
import { recordSlaEvent } from "@/src/features/reports/slaEvents";
import { notifyRoleInternal } from "@/src/features/reports/internalNotifications";

const MAX_PROGRESS_PHOTOS = 5;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const PROGRESS_PHOTO_BUCKET = "progress-photos";

type AssignedReport = {
  id: string;
  report_number: string;
  title: string;
  status: string;
  resolution_due_at: string | null;
  assigned_section_id: string | null;
};

async function requireKasi() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (profile.role !== "kasi") {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}

function isValidImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

function formatProgressPolicyError(message: string) {
  if (message.toLowerCase().includes("row-level security")) {
    return "Izin progres belum dikonfigurasi. Jalankan migration RLS progres Kasi terlebih dahulu.";
  }

  return message;
}

function getProgressPhotos(formData: FormData) {
  return formData
    .getAll("progress_photos")
    .filter((file): file is File => file instanceof File && file.size > 0);
}

function validateProgressPhotos(photos: File[]): ActionState | null {
  if (photos.length > MAX_PROGRESS_PHOTOS) {
    return {
      status: "error",
      message: `Anda hanya bisa mengunggah maksimal ${MAX_PROGRESS_PHOTOS} foto progres.`,
    };
  }

  for (const photo of photos) {
    if (!isValidImage(photo)) {
      return {
        status: "error",
        message: "Hanya gambar JPG, PNG, dan WEBP yang diizinkan.",
      };
    }

    if (photo.size > MAX_PHOTO_SIZE) {
      return {
        status: "error",
        message: "Setiap foto progres harus kurang dari 10MB.",
      };
    }
  }

  return null;
}

async function getAssignedReport(
  reportId: string,
  sectionId: string
): Promise<AssignedReport | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("id, report_number, title, status, resolution_due_at, assigned_section_id")
    .eq("id", reportId)
    .eq("assigned_section_id", sectionId)
    .maybeSingle();

  if (error || !data) {
    console.error("Failed to fetch assigned Kasi report:", error?.message);
    return null;
  }

  return data;
}

async function uploadProgressPhotos({
  reportId,
  progressUpdateId,
  userId,
  photos,
}: {
  reportId: string;
  progressUpdateId: string;
  userId: string;
  photos: File[];
}) {
  const supabase = await createClient();
  const uploadedPaths: string[] = [];

  for (const photo of photos) {
    const extension = photo.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `${userId}/${reportId}/${progressUpdateId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(PROGRESS_PHOTO_BUCKET)
      .upload(filePath, photo, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from(PROGRESS_PHOTO_BUCKET)
          .remove(uploadedPaths);
      }

      return {
        status: "error" as const,
        message: uploadError.message,
        photos: [],
      };
    }

    uploadedPaths.push(filePath);
  }

  return {
    status: "success" as const,
    message: "",
    photos: uploadedPaths.map((filePath) => ({
      progress_update_id: progressUpdateId,
      file_path: filePath,
      photo_url: filePath,
    })),
  };
}

async function saveProgressUpdate({
  reportId,
  userId,
  updateType,
  title,
  note,
  photos,
}: {
  reportId: string;
  userId: string;
  updateType: "progress" | "resolved";
  title: string;
  note: string;
  photos: File[];
}) {
  const supabase = createAdminClient();
  const progressUpdateId = crypto.randomUUID();
  const uploadResult = await uploadProgressPhotos({
    reportId,
    progressUpdateId,
    userId,
    photos,
  });

  if (uploadResult.status === "error") {
    return {
      status: "error" as const,
      message: uploadResult.message,
    };
  }

  const { error: updateError } = await supabase
    .from("report_progress_updates")
    .insert({
      id: progressUpdateId,
      report_id: reportId,
      progress_title: title,
      progress_note: note,
      progress_status: updateType,
      created_by: userId,
    });

  if (updateError) {
    if (uploadResult.photos.length > 0) {
      await supabase.storage
        .from(PROGRESS_PHOTO_BUCKET)
        .remove(uploadResult.photos.map((photo) => photo.file_path));
    }

    return {
      status: "error" as const,
      message: formatProgressPolicyError(updateError.message),
    };
  }

  if (uploadResult.photos.length > 0) {
    const { error: photoError } = await supabase
      .from("report_progress_photos")
      .insert(uploadResult.photos);

    if (photoError) {
      await supabase.storage
        .from(PROGRESS_PHOTO_BUCKET)
        .remove(uploadResult.photos.map((photo) => photo.file_path));

      await supabase
        .from("report_progress_updates")
        .delete()
        .eq("id", progressUpdateId);

      return {
        status: "error" as const,
        message: formatProgressPolicyError(photoError.message),
      };
    }
  }

  return {
    status: "success" as const,
    message: "",
  };
}

async function reportHasProgressUpdates(reportId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("report_progress_updates")
    .select("id")
    .eq("report_id", reportId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to check existing progress updates:", error.message);
    return false;
  }

  return Boolean(data);
}

async function reportHasBudgetRequests(reportId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("report_budget_requests")
    .select("id")
    .eq("report_id", reportId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to check existing budget requests:", error.message);
    return true;
  }

  return Boolean(data);
}

function revalidateKasiReport(reportId: string) {
  revalidatePath("/dashboard/kasi");
  revalidatePath("/dashboard/kasi/reports");
  revalidatePath("/dashboard/kasi/history");
  revalidatePath("/dashboard/kasi/budget");
  revalidatePath(`/dashboard/kasi/reports/${reportId}`);
  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);
  revalidatePath("/dashboard/admin/follow-up");
  revalidatePath("/dashboard/village/budget-requests");
}

function getStringArray(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value || "").trim());
}

function getBudgetItems(formData: FormData) {
  const names = getStringArray(formData, "item_name");
  const descriptions = getStringArray(formData, "item_description");
  const quantities = getStringArray(formData, "item_quantity");
  const units = getStringArray(formData, "item_unit");
  const unitPrices = getStringArray(formData, "item_unit_price");

  return names
    .map((name, index) => {
      const quantity = Number(quantities[index]);
      const unitPrice = Number(unitPrices[index]);

      return {
        item_name: name,
        description: descriptions[index] || null,
        quantity,
        unit: units[index] || "unit",
        unit_price: unitPrice,
      };
    })
    .filter((item) => item.item_name);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export async function returnKasiReportAssignment(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireKasi();

  if (!profile.section_id) {
    return {
      status: "error",
      message: "Akun Anda belum ditautkan ke seksi desa.",
    };
  }

  const reportId = String(formData.get("report_id") || "");
  const note = String(formData.get("note") || "").trim();

  if (!reportId) {
    return {
      status: "error",
      message: "ID laporan tidak ditemukan.",
    };
  }

  if (!note) {
    return {
      status: "error",
      message: "Jelaskan alasan laporan ini perlu dikembalikan ke admin.",
    };
  }

  const report = await getAssignedReport(reportId, profile.section_id);

  if (!report) {
    return {
      status: "error",
      message: "Laporan tidak ditemukan atau tidak ditugaskan ke seksi Anda.",
    };
  }

  if (!["handled_by_village", "waiting_budget"].includes(report.status)) {
    return {
      status: "error",
      message: "Hanya laporan yang baru ditugaskan yang bisa dikembalikan ke admin.",
    };
  }

  const [hasProgressUpdates, hasBudgetRequests] = await Promise.all([
    reportHasProgressUpdates(reportId),
    reportHasBudgetRequests(reportId),
  ]);

  if (hasProgressUpdates || hasBudgetRequests) {
    return {
      status: "error",
      message:
        "Laporan ini sudah memiliki aktivitas progres atau anggaran sehingga tidak bisa dikembalikan.",
    };
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data: returnedReport, error } = await supabase
    .from("reports")
    .update({
      status: "verified_valid",
      assigned_section_id: null,
      internal_handling_note: note,
      updated_at: now,
    })
    .eq("id", reportId)
    .eq("assigned_section_id", profile.section_id)
    .in("status", ["handled_by_village", "waiting_budget"])
    .select("id")
    .maybeSingle();

  if (error || !returnedReport) {
    return {
      status: "error",
      message:
        error?.message ||
        "Laporan tidak bisa dikembalikan karena penugasannya sudah berubah.",
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: report.status,
    newStatus: "verified_valid",
    note: `Dikembalikan oleh Kasi untuk penugasan ulang: ${note}`,
    notifyReporter: false,
    notifyWhatsApp: false,
  });

  await notifyRoleInternal({
    roles: ["admin"],
    reportId,
    subject: `Laporan dikembalikan ${report.report_number}`,
    message: `Kasi mengembalikan laporan ${report.report_number} (${report.title}) untuk penugasan ulang. Catatan: ${note}`,
  });

  revalidateKasiReport(reportId);
  revalidatePath("/dashboard/admin/asset-classification");
  revalidatePath(`/dashboard/admin/asset-classification/${reportId}`);

  return {
    status: "success",
    message: "Laporan berhasil dikembalikan ke admin untuk penugasan ulang.",
  };
}

export async function startKasiReportProgress(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireKasi();

  if (!profile.section_id) {
    return {
      status: "error",
      message: "Akun Anda belum ditautkan ke seksi desa.",
    };
  }

  const reportId = String(formData.get("report_id") || "");
  const note = String(formData.get("note") || "").trim();

  if (!reportId) {
    return {
      status: "error",
      message: "ID laporan tidak ditemukan.",
    };
  }

  if (!note) {
    return {
      status: "error",
      message: "Tulis catatan singkat penanganan sebelum memulai progres.",
    };
  }

  const report = await getAssignedReport(reportId, profile.section_id);

  if (!report) {
    return {
      status: "error",
      message: "Laporan tidak ditemukan atau tidak ditugaskan ke seksi Anda.",
    };
  }

  if (report.status !== "handled_by_village") {
    return {
      status: "error",
      message: "Hanya laporan yang ditangani desa yang bisa dimulai.",
    };
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  if (await reportHasProgressUpdates(reportId)) {
    const { error: repairError } = await supabase
      .from("reports")
      .update({
        status: "in_progress",
        updated_at: now,
      })
      .eq("id", reportId)
      .eq("assigned_section_id", profile.section_id)
      .eq("status", "handled_by_village");

    if (repairError) {
      return {
        status: "error",
        message: repairError.message,
      };
    }

    revalidateKasiReport(reportId);

    return {
      status: "success",
      message: "Penanganan laporan sudah sedang diproses.",
    };
  }

  const { data: startedReport, error } = await supabase
    .from("reports")
    .update({
      status: "in_progress",
      internal_handling_note: note,
      updated_at: now,
    })
    .eq("id", reportId)
    .eq("assigned_section_id", profile.section_id)
    .eq("status", "handled_by_village")
    .select("id")
    .maybeSingle();

  if (error || !startedReport) {
    return {
      status: "error",
      message:
        error?.message ||
        "Laporan ini sudah dimulai atau tidak lagi tersedia untuk dimulai.",
    };
  }

  const saveResult = await saveProgressUpdate({
    reportId,
    userId: profile.id,
    updateType: "progress",
    title: "Penanganan dimulai",
    note,
    photos: [],
  });

  if (saveResult.status === "error") {
    await supabase
      .from("reports")
      .update({
        status: "handled_by_village",
        internal_handling_note: note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("assigned_section_id", profile.section_id)
      .eq("status", "in_progress");

    return saveResult;
  }

  await createReportStatusLog({
    reportId,
    oldStatus: report.status,
    newStatus: "in_progress",
    note,
  });

  revalidateKasiReport(reportId);

  return {
    status: "success",
    message: "Penanganan laporan berhasil ditandai sedang diproses.",
  };
}

export async function submitKasiProgressUpdate(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireKasi();

  if (!profile.section_id) {
    return {
      status: "error",
      message: "Akun Anda belum ditautkan ke seksi desa.",
    };
  }

  const reportId = String(formData.get("report_id") || "");
  const note = String(formData.get("note") || "").trim();
  const photos = getProgressPhotos(formData);
  const photoValidation = validateProgressPhotos(photos);

  if (photoValidation) {
    return photoValidation;
  }

  if (!reportId) {
    return {
      status: "error",
      message: "ID laporan tidak ditemukan.",
    };
  }

  if (!note) {
    return {
      status: "error",
      message: "Tulis catatan progres terlebih dahulu.",
    };
  }

  const report = await getAssignedReport(reportId, profile.section_id);

  if (!report) {
    return {
      status: "error",
      message: "Laporan tidak ditemukan atau tidak ditugaskan ke seksi Anda.",
    };
  }

  const supabase = createAdminClient();
  let effectiveStatus = report.status;

  if (report.status === "handled_by_village") {
    const hasExistingProgress = await reportHasProgressUpdates(reportId);

    if (!hasExistingProgress) {
      return {
        status: "error",
        message:
          "Update progres hanya tersedia setelah penanganan dimulai.",
      };
    }

    const { error: repairError } = await supabase
      .from("reports")
      .update({
        status: "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("assigned_section_id", profile.section_id)
      .eq("status", "handled_by_village");

    if (repairError) {
      return {
        status: "error",
        message: repairError.message,
      };
    }

    effectiveStatus = "in_progress";
  }

  if (effectiveStatus !== "in_progress") {
    return {
      status: "error",
      message: "Update progres hanya tersedia setelah penanganan dimulai.",
    };
  }

  const saveResult = await saveProgressUpdate({
    reportId,
    userId: profile.id,
    updateType: "progress",
    title: "Update progres",
    note,
    photos,
  });

  if (saveResult.status === "error") {
    return saveResult;
  }

  const { error } = await supabase
    .from("reports")
    .update({
      internal_handling_note: note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .eq("assigned_section_id", profile.section_id);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidateKasiReport(reportId);

  return {
    status: "success",
    message: "Update progres berhasil disimpan.",
  };
}

export async function submitKasiBudgetRequest(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireKasi();

  if (!profile.section_id) {
    return {
      status: "error",
      message: "Akun Anda belum ditautkan ke seksi desa.",
    };
  }

  const reportId = String(formData.get("report_id") || "");
  const summaryNote = String(formData.get("summary_note") || "").trim();
  const items = getBudgetItems(formData);

  if (!reportId) {
    return {
      status: "error",
      message: "Pilih laporan yang ditugaskan.",
    };
  }

  if (!summaryNote) {
    return {
      status: "error",
      message: "Jelaskan kebutuhan anggaran terlebih dahulu.",
    };
  }

  if (items.length === 0) {
    return {
      status: "error",
      message: "Tambahkan minimal satu item anggaran.",
    };
  }

  for (const item of items) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      return {
        status: "error",
        message: "Jumlah setiap item harus lebih dari 0.",
      };
    }

    if (!Number.isFinite(item.unit_price) || item.unit_price < 0) {
      return {
        status: "error",
        message: "Harga satuan setiap item harus 0 atau lebih.",
      };
    }
  }

  const report = await getAssignedReport(reportId, profile.section_id);

  if (!report) {
    return {
      status: "error",
      message: "Laporan tidak ditemukan atau tidak ditugaskan ke seksi Anda.",
    };
  }

  if (!["handled_by_village", "in_progress"].includes(report.status)) {
    return {
      status: "error",
      message:
        "Pengajuan anggaran hanya tersedia sebelum atau selama penanganan aktif.",
    };
  }

  const totalEstimatedBudget = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const supabase = createAdminClient();
  const { data: pendingBudgetRequest, error: pendingBudgetError } =
    await supabase
      .from("report_budget_requests")
      .select("id")
      .eq("report_id", reportId)
      .eq("status", "submitted")
      .limit(1)
      .maybeSingle();

  if (pendingBudgetError) {
    return {
      status: "error",
      message: pendingBudgetError.message,
    };
  }

  if (pendingBudgetRequest) {
    return {
      status: "error",
      message: "Laporan ini sudah memiliki pengajuan anggaran yang menunggu peninjauan.",
    };
  }

  const { data: budgetRequest, error: requestError } = await supabase
    .from("report_budget_requests")
    .insert({
      report_id: reportId,
      requested_by: profile.id,
      section_id: profile.section_id,
      summary_note: summaryNote,
      total_estimated_budget: totalEstimatedBudget,
      status: "submitted",
    })
    .select("id")
    .single();

  if (requestError || !budgetRequest) {
    return {
      status: "error",
      message:
        requestError?.message ||
        "Gagal mengirim pengajuan anggaran. Pastikan migration anggaran sudah dijalankan.",
    };
  }

  const { error: itemsError } = await supabase
    .from("report_budget_request_items")
    .insert(
      items.map((item) => ({
        budget_request_id: budgetRequest.id,
        ...item,
      }))
    );

  if (itemsError) {
    await supabase
      .from("report_budget_requests")
      .delete()
      .eq("id", budgetRequest.id);

    return {
      status: "error",
      message: itemsError.message,
    };
  }

  const { error: reportError } = await supabase
    .from("reports")
    .update({
      status: "waiting_budget",
      internal_handling_note: summaryNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .eq("assigned_section_id", profile.section_id);

  if (reportError) {
    return {
      status: "error",
      message: reportError.message,
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: report.status,
    newStatus: "waiting_budget",
    note: summaryNote,
  });

  await recordSlaEvent({
    reportId,
    eventType: "paused_budget",
    previousResolutionDueAt: report.resolution_due_at,
    newResolutionDueAt: report.resolution_due_at,
    note: "SLA dijeda selama menunggu peninjauan anggaran.",
  });

  await notifyRoleInternal({
    roles: ["kepala_desa", "sekdes"],
    reportId,
    subject: `Pengajuan anggaran ${report.report_number}`,
    message: `Kasi mengajukan anggaran untuk laporan ${report.report_number} (${report.title}) dengan estimasi ${formatCurrency(totalEstimatedBudget)}. Catatan: ${summaryNote}`,
  });

  revalidateKasiReport(reportId);

  return {
    status: "success",
    message: "Pengajuan anggaran berhasil dikirim.",
  };
}

export async function resolveKasiReport(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireKasi();

  if (!profile.section_id) {
    return {
      status: "error",
      message: "Akun Anda belum ditautkan ke seksi desa.",
    };
  }

  const reportId = String(formData.get("report_id") || "");
  const note = String(formData.get("note") || "").trim();
  const photos = getProgressPhotos(formData);
  const photoValidation = validateProgressPhotos(photos);

  if (photoValidation) {
    return photoValidation;
  }

  if (!reportId) {
    return {
      status: "error",
      message: "ID laporan tidak ditemukan.",
    };
  }

  if (!note) {
    return {
      status: "error",
      message: "Tulis catatan penyelesaian terlebih dahulu.",
    };
  }

  const report = await getAssignedReport(reportId, profile.section_id);

  if (!report) {
    return {
      status: "error",
      message: "Laporan tidak ditemukan atau tidak ditugaskan ke seksi Anda.",
    };
  }

  const supabase = createAdminClient();
  let effectiveStatus = report.status;

  if (report.status === "handled_by_village") {
    const hasExistingProgress = await reportHasProgressUpdates(reportId);

    if (hasExistingProgress) {
      const { error: repairError } = await supabase
        .from("reports")
        .update({
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId)
        .eq("assigned_section_id", profile.section_id)
        .eq("status", "handled_by_village");

      if (repairError) {
        return {
          status: "error",
          message: repairError.message,
        };
      }

      effectiveStatus = "in_progress";
    }
  }

  if (effectiveStatus !== "in_progress") {
    return {
      status: "error",
      message: "Hanya laporan yang sedang diproses yang bisa diselesaikan.",
    };
  }

  const saveResult = await saveProgressUpdate({
    reportId,
    userId: profile.id,
    updateType: "progress",
    title: "Laporan selesai",
    note,
    photos,
  });

  if (saveResult.status === "error") {
    return saveResult;
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("reports")
    .update({
      status: "resolved",
      sla_status: "completed",
      internal_handling_note: note,
      resolved_at: now,
      updated_at: now,
    })
    .eq("id", reportId)
    .eq("assigned_section_id", profile.section_id);

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
    note,
  });

  await recordSlaEvent({
    reportId,
    eventType: "completed",
    note: "SLA selesai karena laporan diselesaikan oleh Kasi.",
  });

  revalidateKasiReport(reportId);

  return {
    status: "success",
    message: "Laporan berhasil ditandai selesai.",
  };
}
