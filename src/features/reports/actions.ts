"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { createReportStatusLog } from "@/src/features/reports/statusLogs";
import { ActionState } from "@/src/types/action";

function generateReportNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);

  return `LPR-${year}-${random}`;
}

function isValidImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

export async function createReport(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {  const profile = await getProfile();

  if (!profile) {
    redirect(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(ROUTES.REPORT_CREATE)}`);
  }

  if (profile.role !== "public") {
    redirect(getDashboardRouteByRole(profile.role));
  }

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const gpsLatitude = Number(formData.get("gps_latitude"));
  const gpsLongitude = Number(formData.get("gps_longitude"));
  const locationRadiusKm = Number(formData.get("location_radius_km") || 5);
  const autoAddress = String(formData.get("auto_address") || "").trim();
  const photos = formData
    .getAll("photos")
    .filter((file): file is File => file instanceof File && file.size > 0);

  if (!title || !description) {
    throw new Error("Please complete the report title and description.");
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Please select your report location first.");
  }

  if (
    Number.isNaN(gpsLatitude) ||
    Number.isNaN(gpsLongitude) ||
    Number.isNaN(locationRadiusKm)
  ) {
    return {
      status: "error",
      message: "GPS origin is required. Please use GPS location first.",
    };
  }

  const distanceFromGpsKm = calculateDistanceKm(
    gpsLatitude,
    gpsLongitude,
    latitude,
    longitude
  );

  if (distanceFromGpsKm > locationRadiusKm) {
    return {
      status: "error",
      message: `Report location must be within ${locationRadiusKm} km from your GPS location.`,
    };
  }

  if (photos.length === 0) {
    throw new Error("Please upload at least one photo evidence.");
  }

  if (photos.length > 5) {
    throw new Error("You can upload a maximum of 5 photos.");
  }

  for (const photo of photos) {
    if (!isValidImage(photo)) {
      throw new Error("Only JPG, PNG, and WEBP images are allowed.");
    }

    if (photo.size > 10 * 1024 * 1024) {
      throw new Error("Each photo must be less than 10MB.");
    }
  }

  const supabase = await createClient();

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .insert({
      report_number: generateReportNumber(),
      reporter_id: profile.id,
      title,
      description,
      latitude,
      longitude,
      auto_address: autoAddress || null,
      status: "pending",
      priority: "sedang",
      asset_status: "belum_diketahui",
      authority_level: "belum_diketahui",
      follow_up_type: "belum_ditentukan",
    })
    .select("id")
    .single();

  if (reportError || !report) {
    throw new Error(reportError?.message || "Failed to create report.");
  }

  for (const photo of photos) {
    const extension = photo.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `${profile.id}/${report.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("report-photos")
      .upload(filePath, photo, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { error: photoError } = await supabase.from("report_photos").insert({
      report_id: report.id,
      uploaded_by: profile.id,
      file_path: filePath,
      photo_url: filePath,
    });

    if (photoError) {
      throw new Error(photoError.message);
    }

    await createReportStatusLog({
      reportId: report.id,
      oldStatus: null,
      newStatus: "pending",
      note: "Report submitted by citizen.",
    });
  }

  revalidatePath("/dashboard/public");
  revalidatePath("/dashboard/public/reports");

  return {
    status: "success",
    message: "Report has been submitted successfully.",
  };
}

function calculateDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
) {
  const earthRadiusKm = 6371;

  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}