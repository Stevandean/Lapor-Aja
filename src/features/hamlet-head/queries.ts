import { getProfile } from "@/src/lib/auth/getProfile";
import { createClient } from "@/src/lib/supabase/server";

const LIST_LIMIT = 50;

export async function getHamletHeadVerificationReports() {
  const profile = await getProfile();

  if (!profile) {
    return {
      reports: [],
      missingHamlet: false,
    };
  }

  if (profile.role !== "kepala_dusun") {
    return {
      reports: [],
      missingHamlet: false,
    };
  }

  if (!profile.dusun_id) {
    return {
      reports: [],
      missingHamlet: true,
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      description,
      status,
      priority,
      created_at,
      categories(name),
      dusuns(name)
    `
    )
    .eq("status", "need_verification")
    .eq("dusun_id", profile.dusun_id)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT)

  if (error) {
    console.error("Failed to fetch hamlet verification reports:", error.message);

    return {
      reports: [],
      missingHamlet: false,
    };
  }

  return {
    reports: data ?? [],
    missingHamlet: false,
  };
}

export async function getHamletHeadVerificationReportDetail(reportId: string) {
  const profile = await getProfile();

  if (!profile || profile.role !== "kepala_dusun" || !profile.dusun_id) {
    return null;
  }

  const supabase = await createClient();

  const { data: report, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      description,
      status,
      priority,
      latitude,
      longitude,
      auto_address,
      manual_address,
      admin_note,
      created_at,
      updated_at,
      category:categories(name),
      hamlet:dusuns(name),
      reporter:profiles!reports_reporter_id_fkey(full_name, email, phone_number)
    `
    )
    .eq("id", reportId)
    .eq("dusun_id", profile.dusun_id)
    .single();

  if (error || !report) {
    console.error("Failed to fetch verification report detail:", error?.message);
    return null;
  }

  const { data: photos, error: photosError } = await supabase
    .from("report_photos")
    .select("id, file_path, photo_url, created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  if (photosError) {
    console.error("Failed to fetch report photos:", photosError.message);
  }

  const photosWithSignedUrls = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from("report-photos")
        .createSignedUrl(photo.file_path, 60 * 60);

      return {
        ...photo,
        signedUrl: data?.signedUrl ?? null,
      };
    })
  );

  return {
    report,
    photos: photosWithSignedUrls,
  };
}

async function getHamletReportCount(
  dusunId: string,
  filter?: {
    column: string;
    value: string;
  }
) {
  const supabase = await createClient();

  let query = supabase
    .from("reports")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("dusun_id", dusunId);

  if (filter) {
    query = query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Failed to count hamlet reports:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function getHamletHeadDashboardData() {
  const profile = await getProfile();

  if (!profile || profile.role !== "kepala_dusun") {
    return {
      missingHamlet: false,
      stats: {
        totalAssignedReports: 0,
        needVerificationReports: 0,
        verifiedValidReports: 0,
        verifiedInvalidReports: 0,
        resolvedReports: 0,
      },
      recentReports: [],
    };
  }

  if (!profile.dusun_id) {
    return {
      missingHamlet: true,
      stats: {
        totalAssignedReports: 0,
        needVerificationReports: 0,
        verifiedValidReports: 0,
        verifiedInvalidReports: 0,
        resolvedReports: 0,
      },
      recentReports: [],
    };
  }

  const supabase = await createClient();

  const [
    totalAssignedReports,
    needVerificationReports,
    verifiedValidReports,
    verifiedInvalidReports,
    resolvedReports,
  ] = await Promise.all([
    getHamletReportCount(profile.dusun_id),
    getHamletReportCount(profile.dusun_id, {
      column: "status",
      value: "need_verification",
    }),
    getHamletReportCount(profile.dusun_id, {
      column: "status",
      value: "verified_valid",
    }),
    getHamletReportCount(profile.dusun_id, {
      column: "status",
      value: "verified_invalid",
    }),
    getHamletReportCount(profile.dusun_id, {
      column: "status",
      value: "resolved",
    }),
  ]);

  const { data: recentReports, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      status,
      priority,
      created_at,
      updated_at,
      category:categories(name)
    `
    )
    .eq("dusun_id", profile.dusun_id)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Failed to fetch recent hamlet reports:", error.message);
  }

  return {
    missingHamlet: false,
    stats: {
      totalAssignedReports,
      needVerificationReports,
      verifiedValidReports,
      verifiedInvalidReports,
      resolvedReports,
    },
    recentReports: recentReports ?? [],
  };
}

export async function getHamletHeadVerificationHistory() {
  const profile = await getProfile();

  if (!profile || profile.role !== "kepala_dusun") {
    return {
      missingHamlet: false,
      history: [],
    };
  }

  if (!profile.dusun_id) {
    return {
      missingHamlet: true,
      history: [],
    };
  }

  const supabase = await createClient();

  const { data: verifications, error: verificationError } = await supabase
    .from("report_verifications")
    .select("id, report_id, is_valid, verification_note, created_at")
    .eq("verified_by", profile.id)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT)

  if (verificationError) {
    console.error(
      "Failed to fetch verification history:",
      verificationError.message
    );

    return {
      missingHamlet: false,
      history: [],
    };
  }

  const latestVerificationByReportId = new Map<
    string,
    {
      id: string;
      report_id: string;
      is_valid: boolean;
      verification_note: string | null;
      created_at: string;
    }
  >();

  for (const verification of verifications ?? []) {
    if (!verification.report_id) continue;

    if (!latestVerificationByReportId.has(verification.report_id)) {
      latestVerificationByReportId.set(verification.report_id, verification);
    }
  }

  const uniqueVerifications = Array.from(latestVerificationByReportId.values());

  const reportIds = uniqueVerifications
    .map((verification) => verification.report_id)
    .filter(Boolean);

  if (reportIds.length === 0) {
    return {
      missingHamlet: false,
      history: [],
    };
  }

  const { data: reports, error: reportsError } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      status,
      priority,
      updated_at,
      category:categories(name),
      hamlet:dusuns(name)
    `
    )
    .in("id", reportIds)
    .eq("dusun_id", profile.dusun_id)
    .limit(LIST_LIMIT)

  if (reportsError) {
    console.error("Failed to fetch verified reports:", reportsError.message);

    return {
      missingHamlet: false,
      history: [],
    };
  }

  const reportMap = new Map((reports ?? []).map((report) => [report.id, report]));

  const history = uniqueVerifications
    .map((verification) => {
      const report = reportMap.get(verification.report_id);

      if (!report) return null;

      return {
        verification,
        report,
      };
    })
    .filter(
      (
        item
      ): item is {
        verification: {
          id: string;
          report_id: string;
          is_valid: boolean;
          verification_note: string | null;
          created_at: string;
        };
        report: NonNullable<typeof reports>[number];
      } => item !== null
    );

  return {
    missingHamlet: false,
    history,
  };
}

export async function getHamletHeadAssignedReports() {
  const profile = await getProfile();

  if (!profile || profile.role !== "kepala_dusun") {
    return {
      missingHamlet: false,
      reports: [],
    };
  }

  if (!profile.dusun_id) {
    return {
      missingHamlet: true,
      reports: [],
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      description,
      status,
      priority,
      asset_status,
      authority_level,
      follow_up_type,
      created_at,
      updated_at,
      category:categories(name),
      hamlet:dusuns(name),
      reporter:profiles!reports_reporter_id_fkey(full_name, email, phone_number)
    `
    )
    .eq("dusun_id", profile.dusun_id)
    .order("updated_at", { ascending: false })
    .limit(LIST_LIMIT)

  if (error) {
    console.error("Failed to fetch assigned hamlet reports:", error.message);

    return {
      missingHamlet: false,
      reports: [],
    };
  }

  return {
    missingHamlet: false,
    reports: data ?? [],
  };
}