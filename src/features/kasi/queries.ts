import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { createClient } from "@/src/lib/supabase/server";

const LIST_LIMIT = 50;

const activeStatuses = [
  "handled_by_village",
  "waiting_budget",
  "in_progress",
];

function isMissingDatabaseRelationError(message: string | null | undefined) {
  return Boolean(
    message?.includes("Could not find the table") ||
      message?.includes("schema cache") ||
      message?.includes("does not exist")
  );
}

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

export async function getKasiDashboardData() {
  const profile = await requireKasi();

  if (!profile.section_id) {
    return {
      missingSection: true,
      stats: {
        totalAssignedReports: 0,
        activeReports: 0,
        waitingBudgetReports: 0,
        inProgressReports: 0,
        resolvedReports: 0,
      },
      recentReports: [],
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
      status,
      priority,
      follow_up_type,
      updated_at,
      created_at,
      category:categories(name),
      hamlet:dusuns(name),
      reporter:profiles!reports_reporter_id_fkey(full_name, email, phone_number)
      `
    )
    .eq("assigned_section_id", profile.section_id)
    .order("updated_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    console.error("Failed to fetch Kasi dashboard reports:", error.message);

    return {
      missingSection: false,
      stats: {
        totalAssignedReports: 0,
        activeReports: 0,
        waitingBudgetReports: 0,
        inProgressReports: 0,
        resolvedReports: 0,
      },
      recentReports: [],
    };
  }

  const reports = data ?? [];

  return {
    missingSection: false,
    stats: {
      totalAssignedReports: reports.length,
      activeReports: reports.filter((report) =>
        activeStatuses.includes(report.status)
      ).length,
      waitingBudgetReports: reports.filter(
        (report) => report.status === "waiting_budget"
      ).length,
      inProgressReports: reports.filter(
        (report) => report.status === "in_progress"
      ).length,
      resolvedReports: reports.filter((report) => report.status === "resolved")
        .length,
    },
    recentReports: reports.slice(0, 5),
  };
}

export async function getKasiAssignedReports() {
  const profile = await requireKasi();

  if (!profile.section_id) {
    return {
      missingSection: true,
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
      follow_up_type,
      updated_at,
      created_at,
      category:categories(name),
      hamlet:dusuns(name),
      reporter:profiles!reports_reporter_id_fkey(full_name, email, phone_number)
      `
    )
    .eq("assigned_section_id", profile.section_id)
    .order("updated_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    console.error("Failed to fetch Kasi assigned reports:", error.message);

    return {
      missingSection: false,
      reports: [],
    };
  }

  return {
    missingSection: false,
    reports: data ?? [],
  };
}

export async function getKasiReportDetail(reportId: string) {
  const profile = await requireKasi();

  if (!profile.section_id) {
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
      asset_status,
      authority_level,
      follow_up_type,
      latitude,
      longitude,
      auto_address,
      manual_address,
      internal_handling_note,
      verification_due_at,
      resolution_due_at,
      resolved_at,
      created_at,
      updated_at,
      category:categories(name),
      hamlet:dusuns(name),
      reporter:profiles!reports_reporter_id_fkey(full_name, email, phone_number)
      `
    )
    .eq("id", reportId)
    .eq("assigned_section_id", profile.section_id)
    .maybeSingle();

  if (error || !report) {
    console.error("Failed to fetch Kasi report detail:", error?.message);
    return null;
  }

  const { data: section } = await supabase
    .from("village_sections")
    .select("name")
    .eq("id", profile.section_id)
    .maybeSingle();

  const { data: photos } = await supabase
    .from("report_photos")
    .select("id, file_path, photo_url, created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  const signedPhotos = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const path = photo.file_path || photo.photo_url;

      if (!path) {
        return {
          ...photo,
          signedUrl: null,
        };
      }

      const { data } = await supabase.storage
        .from("report-photos")
        .createSignedUrl(path, 60 * 60);

      return {
        ...photo,
        signedUrl: data?.signedUrl ?? null,
      };
    })
  );

  const { data: statusLogs } = await supabase
    .from("report_status_logs")
    .select("id, old_status, new_status, note, created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  const adminSupabase = createAdminClient();
  const { data: progressUpdates, error: progressUpdatesError } = await adminSupabase
    .from("report_progress_updates")
    .select(
      `
      id,
      progress_title,
      progress_note,
      progress_status,
      created_by,
      created_at
      `
    )
    .eq("report_id", reportId)
    .order("created_at", { ascending: false });

  if (progressUpdatesError) {
    console.error(
      "Failed to fetch Kasi progress updates:",
      progressUpdatesError.message
    );
  }

  const progressUpdateIds = (progressUpdates ?? []).map((update) => update.id);
  const { data: progressPhotos, error: progressPhotosError } =
    progressUpdateIds.length > 0
      ? await adminSupabase
          .from("report_progress_photos")
          .select(
            `
            id,
            progress_update_id,
            file_path,
            photo_url,
            created_at
            `
          )
          .in("progress_update_id", progressUpdateIds)
          .order("created_at", { ascending: true })
      : { data: [], error: null };

  if (progressPhotosError) {
    console.error(
      "Failed to fetch Kasi progress photos:",
      progressPhotosError.message
    );
  }

  const signedProgressPhotos = await Promise.all(
    (progressPhotos ?? []).map(async (photo) => {
      const path = photo.file_path || photo.photo_url;

      if (!path) {
        return {
          ...photo,
          signedUrl: null,
        };
      }

      const { data } = await supabase.storage
        .from("progress-photos")
        .createSignedUrl(path, 60 * 60);

      return {
        ...photo,
        signedUrl: data?.signedUrl ?? null,
      };
    })
  );

  const progressUpdatesWithPhotos = (progressUpdates ?? []).map((update) => ({
    id: update.id,
    update_type: update.progress_status,
    title: update.progress_title,
    note: update.progress_note,
    created_by: update.created_by,
    created_at: update.created_at,
    photos: signedProgressPhotos.filter(
      (photo) => photo.progress_update_id === update.id
    ),
  }));

  const { data: budgetRequests, error: budgetRequestsError } =
    await adminSupabase
      .from("report_budget_requests")
      .select(
        `
        id,
        report_id,
        summary_note,
        total_estimated_budget,
        status,
        reviewed_by,
        reviewed_at,
        review_note,
        created_at,
        updated_at
        `
      )
      .eq("report_id", reportId)
      .eq("section_id", profile.section_id)
      .order("created_at", { ascending: false });

  if (budgetRequestsError && !isMissingDatabaseRelationError(budgetRequestsError.message)) {
    console.error(
      "Failed to fetch Kasi budget requests for report detail:",
      budgetRequestsError.message
    );
  }

  const budgetRequestIds = (budgetRequests ?? []).map((request) => request.id);
  const reviewerIds = Array.from(
    new Set(
      (budgetRequests ?? [])
        .map((request) => request.reviewed_by)
        .filter((id): id is string => Boolean(id))
    )
  );

  const [{ data: budgetItems }, { data: reviewers }] = await Promise.all([
    budgetRequestIds.length > 0
      ? adminSupabase
          .from("report_budget_request_items")
          .select(
            `
            id,
            budget_request_id,
            item_name,
            description,
            quantity,
            unit,
            unit_price,
            subtotal,
            created_at
            `
          )
          .in("budget_request_id", budgetRequestIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    reviewerIds.length > 0
      ? adminSupabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", reviewerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const reviewerById = new Map(
    (reviewers ?? []).map((reviewer) => [reviewer.id, reviewer])
  );
  const budgetRequestsWithItems = (budgetRequests ?? []).map((request) => ({
    ...request,
    total_estimated_budget: Number(request.total_estimated_budget || 0),
    reviewer: request.reviewed_by
      ? reviewerById.get(request.reviewed_by) ?? null
      : null,
    items: (budgetItems ?? [])
      .filter((item) => item.budget_request_id === request.id)
      .map((item) => ({
        ...item,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        subtotal: Number(item.subtotal || 0),
      })),
  }));

  return {
    report: {
      ...report,
      section,
    },
    photos: signedPhotos,
    statusLogs: statusLogs ?? [],
    progressUpdates: progressUpdatesWithPhotos,
    budgetRequests: isMissingDatabaseRelationError(budgetRequestsError?.message)
      ? []
      : budgetRequestsWithItems,
  };
}

export async function getKasiProgressHistory() {
  const { missingSection, reports } = await getKasiAssignedReports();

  return {
    missingSection,
    reports: reports.filter((report) =>
      [
        "handled_by_village",
        "waiting_budget",
        "in_progress",
        "resolved",
        "archived",
      ].includes(report.status)
    ),
  };
}

export async function getKasiBudgetPageData() {
  const profile = await requireKasi();

  if (!profile.section_id) {
    return {
      missingSection: true,
      budgetSchemaReady: true,
      eligibleReports: [],
      budgetRequests: [],
    };
  }

  const supabase = await createClient();

  const { data: eligibleReports, error: reportsError } = await supabase
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
    .eq("assigned_section_id", profile.section_id)
    .in("status", ["handled_by_village", "in_progress"])
    .order("updated_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (reportsError) {
    console.error("Failed to fetch Kasi budget reports:", reportsError.message);
  }

  const budgetSupabase = createAdminClient();
  const { data: budgetRequests, error: requestsError } = await budgetSupabase
    .from("report_budget_requests")
    .select(
      `
      id,
      report_id,
      summary_note,
      total_estimated_budget,
      status,
      created_at,
      updated_at
      `
    )
    .eq("section_id", profile.section_id)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (requestsError) {
    if (isMissingDatabaseRelationError(requestsError.message)) {
      return {
        missingSection: false,
        budgetSchemaReady: false,
        eligibleReports: eligibleReports ?? [],
        budgetRequests: [],
      };
    }

    console.error("Failed to fetch Kasi budget requests:", requestsError.message);

    return {
      missingSection: false,
      budgetSchemaReady: true,
      eligibleReports: eligibleReports ?? [],
      budgetRequests: [],
    };
  }

  const requestReportIds = Array.from(
    new Set((budgetRequests ?? []).map((request) => request.report_id))
  );
  const requestIds = (budgetRequests ?? []).map((request) => request.id);
  const pendingBudgetReportIds = new Set(
    (budgetRequests ?? [])
      .filter((request) => request.status === "submitted")
      .map((request) => request.report_id)
  );

  const [{ data: requestReports }, { data: requestItems }] = await Promise.all([
    requestReportIds.length > 0
      ? budgetSupabase
          .from("reports")
          .select("id, report_number, title, status, priority")
          .in("id", requestReportIds)
      : Promise.resolve({ data: [] }),
    requestIds.length > 0
      ? budgetSupabase
          .from("report_budget_request_items")
          .select(
            `
            id,
            budget_request_id,
            item_name,
            description,
            quantity,
            unit,
            unit_price,
            subtotal
            `
          )
          .in("budget_request_id", requestIds)
      : Promise.resolve({ data: [] }),
  ]);

  const reportById = new Map(
    (requestReports ?? []).map((report) => [report.id, report])
  );

  return {
    missingSection: false,
    budgetSchemaReady: true,
    eligibleReports: (eligibleReports ?? []).filter(
      (report) => !pendingBudgetReportIds.has(report.id)
    ),
    budgetRequests: (budgetRequests ?? []).map((request) => ({
      ...request,
      report: reportById.get(request.report_id) ?? null,
      items: (requestItems ?? []).filter(
        (item) => item.budget_request_id === request.id
      ),
    })),
  };
}
