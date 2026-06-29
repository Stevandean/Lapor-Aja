import { getProfile } from "@/src/lib/auth/getProfile";
import { calculateEffectiveSlaStatus } from "@/src/lib/sla";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { createClient } from "@/src/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const LIST_LIMIT = 50;
const MAP_LIMIT = 200;

type VillageBudgetRequestRow = {
  id: string;
  report_id: string;
  summary_note: string;
  total_estimated_budget: number | string | null;
  requested_by: string | null;
  section_id: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
};

type ReportSlaEventRow = {
  id: string;
  event_type: string;
  previous_resolution_due_at: string | null;
  new_resolution_due_at: string | null;
  note: string | null;
  created_at: string;
};

type ReportRelationSummary = {
  duplicateAsSource: number;
  duplicateAsTarget: number;
  recurrenceAsSource: number;
  recurrenceAsTarget: number;
};

function isMissingDatabaseRelationError(message: string | null | undefined) {
  return Boolean(
    message?.includes("Could not find the table") ||
      message?.includes('relation "public.') && message?.includes("does not exist")
  );
}

function emptyRelationSummary(): ReportRelationSummary {
  return {
    duplicateAsSource: 0,
    duplicateAsTarget: 0,
    recurrenceAsSource: 0,
    recurrenceAsTarget: 0,
  };
}

async function getRelationSummaryByReportId(reportIds: string[]) {
  const summaryByReportId = new Map<string, ReportRelationSummary>();

  for (const reportId of reportIds) {
    summaryByReportId.set(reportId, emptyRelationSummary());
  }

  if (reportIds.length === 0) {
    return summaryByReportId;
  }

  const supabase = createAdminClient();
  const [{ data: outgoing, error: outgoingError }, { data: incoming, error: incomingError }] =
    await Promise.all([
      supabase
        .from("report_relations")
        .select("source_report_id, relation_type")
        .in("source_report_id", reportIds),
      supabase
        .from("report_relations")
        .select("target_report_id, relation_type")
        .in("target_report_id", reportIds),
    ]);

  for (const relationError of [outgoingError, incomingError]) {
    if (
      relationError &&
      !isMissingDatabaseRelationError(relationError.message)
    ) {
      console.error("Failed to fetch report relation summary:", relationError.message);
    }
  }

  if (outgoingError || incomingError) {
    return summaryByReportId;
  }

  for (const relation of outgoing ?? []) {
    const summary = summaryByReportId.get(relation.source_report_id);

    if (!summary) continue;

    if (relation.relation_type === "duplicate") {
      summary.duplicateAsSource += 1;
    }

    if (relation.relation_type === "recurrence") {
      summary.recurrenceAsSource += 1;
    }
  }

  for (const relation of incoming ?? []) {
    const summary = summaryByReportId.get(relation.target_report_id);

    if (!summary) continue;

    if (relation.relation_type === "duplicate") {
      summary.duplicateAsTarget += 1;
    }

    if (relation.relation_type === "recurrence") {
      summary.recurrenceAsTarget += 1;
    }
  }

  return summaryByReportId;
}

function isMissingBudgetReviewSchemaError(message: string | null | undefined) {
  if (!message) {
    return false;
  }

  return (
    ["reviewed_by", "reviewed_at", "review_note"].some((column) =>
      message.includes(column)
    ) &&
    (message.includes("schema cache") || message.includes("does not exist"))
  );
}

async function getReportCount(filter?: {
  column: string;
  value: string;
}) {
  const supabase = await createClient();

  let query = supabase.from("reports").select("*", {
    count: "exact",
    head: true,
  });

  if (filter) {
    query = query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Failed to count village reports:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function getVillageDashboardData() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return {
      stats: {
        totalReports: 0,
        pendingReports: 0,
        needVerificationReports: 0,
        inProgressReports: 0,
        resolvedReports: 0,
        archivedReports: 0,
      },
      recentReports: [],
    };
  }

  const supabase = await createClient();

  const [
    totalReports,
    pendingReports,
    needVerificationReports,
    inProgressReports,
    resolvedReports,
    archivedReports,
  ] = await Promise.all([
    getReportCount(),
    getReportCount({
      column: "status",
      value: "pending",
    }),
    getReportCount({
      column: "status",
      value: "need_verification",
    }),
    getReportCount({
      column: "status",
      value: "in_progress",
    }),
    getReportCount({
      column: "status",
      value: "resolved",
    }),
    getReportCount({
      column: "status",
      value: "archived",
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
      category:categories(name),
      hamlet:dusuns(name)
    `
    )
    .order("updated_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("Failed to fetch recent village reports:", error.message);
  }

  return {
    stats: {
      totalReports,
      pendingReports,
      needVerificationReports,
      inProgressReports,
      resolvedReports,
      archivedReports,
    },
    recentReports: recentReports ?? [],
  };
}

type RelationName = {
  name: string;
};

function getRelationName(relation: RelationName[] | RelationName | null) {
  if (!relation) return "Uncategorized";
  if (Array.isArray(relation)) return relation[0]?.name ?? "Uncategorized";
  return relation.name ?? "Uncategorized";
}

function countByValue(values: string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getVillageAnalyticsData() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return {
      totalReports: 0,
      statusStats: [],
      priorityStats: [],
      categoryStats: [],
      hamletStats: [],
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      status,
      priority,
      category:categories(name),
      hamlet:dusuns(name)
    `
    );

  if (error) {
    console.error("Failed to fetch village analytics:", error.message);

    return {
      totalReports: 0,
      statusStats: [],
      priorityStats: [],
      categoryStats: [],
      hamletStats: [],
    };
  }

  const reports = data ?? [];

  return {
    totalReports: reports.length,
    statusStats: countByValue(reports.map((report) => report.status)),
    priorityStats: countByValue(reports.map((report) => report.priority)),
    categoryStats: countByValue(
      reports.map((report) => getRelationName(report.category))
    ),
    hamletStats: countByValue(
      reports.map((report) => getRelationName(report.hamlet))
    ),
  };
}

function countByValueWithFallback(values: (string | null)[], fallback = "not_set") {
  const counts = new Map<string, number>();

  for (const value of values) {
    const key = value || fallback;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getVillageSlaMonitoringData() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return {
      totalReports: 0,
      slaStats: [],
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
      status,
      priority,
      sla_status,
      verification_due_at,
      resolution_due_at,
      resolved_at,
      created_at,
      updated_at,
      category:categories(name),
      hamlet:dusuns(name)
    `
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch village SLA data:", error.message);

    return {
      totalReports: 0,
      slaStats: [],
      reports: [],
    };
  }

  const reports = (data ?? []).map((report) => ({
    ...report,
    sla_status: calculateEffectiveSlaStatus(report),
  }));

  return {
    totalReports: reports.length,
    slaStats: countByValueWithFallback(
      reports.map((report) => report.sla_status)
    ),
    reports,
  };
}

export async function getVillageHeatmapReports() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return [];
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
      latitude,
      longitude,
      created_at,
      updated_at,
      category:categories(name),
      hamlet:dusuns(name)
    `
    )
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("updated_at", { ascending: false })
    .limit(MAP_LIMIT);

  if (error) {
    console.error("Failed to fetch heatmap reports:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getVillageUsersData() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return {
      users: [],
      stats: {
        totalUsers: 0,
        publicUsers: 0,
        adminUsers: 0,
        hamletHeadUsers: 0,
        villageLeaders: 0,
      },
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      email,
      phone_number,
      role,
      is_active,
      created_at,
      dusun:dusuns!profiles_dusun_id_fkey(id, name),
      section:village_sections!profiles_section_id_fkey(id, name)
      `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch village users:", error.message);

    return {
      users: [],
      stats: {
        totalUsers: 0,
        publicUsers: 0,
        adminUsers: 0,
        hamletHeadUsers: 0,
        villageLeaders: 0,
      },
    };
  }

  const users = data ?? [];

  return {
    users,
    stats: {
      totalUsers: users.length,
      publicUsers: users.filter((user) => user.role === "public").length,
      adminUsers: users.filter((user) => user.role === "admin").length,
      hamletHeadUsers: users.filter((user) => user.role === "kepala_dusun")
        .length,
      villageLeaders: users.filter((user) =>
        ["kepala_desa", "sekdes"].includes(user.role)
      ).length,
    },
  };
}

export async function getVillageUserDetail(userId: string) {
  const profile = await getProfile();

  if (!profile || !["admin", "sekdes", "kepala_desa"].includes(profile.role)) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      email,
      phone_number,
      role,
      dusun_id,
      section_id,
      is_active,
      created_at,
      dusun:dusuns!profiles_dusun_id_fkey(id, name),
      section:village_sections!profiles_section_id_fkey(id, name)
    `
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch village user detail:", error.message);
    return null;
  }

  return data;
}

export async function getVillageUserFormOptions() {
  const profile = await getProfile();

  if (!profile || !["admin", "sekdes", "kepala_desa"].includes(profile.role)) {
    return {
      hamlets: [],
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dusuns")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch hamlet options:", error.message);

    return {
      hamlets: [],
    };
  }

  return {
    hamlets: data ?? [],
  };
}

export async function getVillageArchivedReports() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return [];
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
      asset_status,
      authority_level,
      follow_up_type,
      resolved_at,
      updated_at,
      created_at,
      category:categories(name),
      hamlet:dusuns(name),
      reporter:profiles!reports_reporter_id_fkey(full_name, email)
    `
    )
    .eq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(LIST_LIMIT)

  if (error) {
    console.error("Failed to fetch village archived reports:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getVillageArchivedReportDetail(reportId: string) {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
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
      admin_note,
      rejection_reason,
      latitude,
      longitude,
      auto_address,
      manual_address,
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
    .eq("status", "archived")
    .maybeSingle();

  if (error || !report) {
    console.error("Failed to fetch archived report detail:", error?.message);
    return null;
  }

  const { data: reportPhotos } = await supabase
    .from("report_photos")
    .select("id, file_path, photo_url, created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  const signedReportPhotos = await Promise.all(
    (reportPhotos ?? []).map(async (photo) => {
      const path = photo.file_path || photo.photo_url;

      if (!path) {
        return {
          ...photo,
          signed_url: null,
        };
      }

      const { data } = await supabase.storage
        .from("report-photos")
        .createSignedUrl(path, 60 * 60);

      return {
        ...photo,
        signed_url: data?.signedUrl ?? null,
      };
    })
  );

  const { data: verification } = await supabase
    .from("report_verifications")
    .select("id, verified_by, is_valid, verification_note, created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let verificationData = null;

  if (verification) {
    const { data: verifier } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", verification.verified_by)
      .maybeSingle();

    const { data: verificationPhotos } = await supabase
      .from("verification_photos")
      .select("id, file_path, photo_url, created_at")
      .eq("verification_id", verification.id)
      .order("created_at", { ascending: true });

    const signedVerificationPhotos = await Promise.all(
      (verificationPhotos ?? []).map(async (photo) => {
        const path = photo.file_path || photo.photo_url;

        if (!path) {
          return {
            ...photo,
            signed_url: null,
          };
        }

        const { data } = await supabase.storage
          .from("verification-photos")
          .createSignedUrl(path, 60 * 60);

        return {
          ...photo,
          signed_url: data?.signedUrl ?? null,
        };
      })
    );

    verificationData = {
      ...verification,
      verifier,
      photos: signedVerificationPhotos,
    };
  }

  const { data: statusLogs } = await supabase
  .from("report_status_logs")
  .select(
    `
    id,
    old_status,
    new_status,
    note,
    created_at
  `
  )
  .eq("report_id", reportId)
  .order("created_at", { ascending: true });

  return {
    ...report,
    report_photos: signedReportPhotos,
    verification: verificationData,
    status_logs: statusLogs ?? [],
  };
}

export async function getVillageReportsData() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return {
      stats: {
        totalReports: 0,
        activeReports: 0,
        waitingBudgetReports: 0,
        villageHandledReports: 0,
        forwardedReports: 0,
        resolvedReports: 0,
      },
      reports: [],
      sections: [],
    };
  }

  const supabase = createAdminClient();

  const [{ data: reports, error }, { data: sections }] = await Promise.all([
    supabase
      .from("reports")
      .select(
        `
        id,
        report_number,
        title,
        status,
        priority,
        asset_status,
        authority_level,
        follow_up_type,
        assigned_section_id,
        created_at,
        updated_at,
        resolved_at,
        category:categories(name),
        hamlet:dusuns(name),
        reporter:profiles!reports_reporter_id_fkey(full_name, email)
        `
      )
      .order("updated_at", { ascending: false })
      .limit(200),
    supabase
      .from("village_sections")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  if (error) {
    console.error("Failed to fetch village reports:", error.message);

    return {
      stats: {
        totalReports: 0,
        activeReports: 0,
        waitingBudgetReports: 0,
        villageHandledReports: 0,
        forwardedReports: 0,
        resolvedReports: 0,
      },
      reports: [],
      sections: sections ?? [],
    };
  }

  const sectionById = new Map(
    (sections ?? []).map((section) => [section.id, section])
  );
  const relationSummaryByReportId = await getRelationSummaryByReportId(
    (reports ?? []).map((report) => report.id)
  );
  const reportRows = (reports ?? []).map((report) => ({
    ...report,
    section: report.assigned_section_id
      ? sectionById.get(report.assigned_section_id) ?? null
      : null,
    relation_summary:
      relationSummaryByReportId.get(report.id) ?? emptyRelationSummary(),
  }));

  return {
    stats: {
      totalReports: reportRows.length,
      activeReports: reportRows.filter((report) =>
        [
          "pending",
          "need_verification",
          "verified_valid",
          "classified",
          "handled_by_village",
          "forwarded_to_agency",
          "waiting_budget",
          "in_progress",
        ].includes(report.status)
      ).length,
      waitingBudgetReports: reportRows.filter(
        (report) => report.status === "waiting_budget"
      ).length,
      villageHandledReports: reportRows.filter((report) =>
        ["handled_by_village", "waiting_budget", "in_progress"].includes(
          report.status
        )
      ).length,
      forwardedReports: reportRows.filter(
        (report) =>
          report.status === "forwarded_to_agency" ||
          report.follow_up_type === "diteruskan_ke_dinas"
      ).length,
      resolvedReports: reportRows.filter(
        (report) => report.status === "resolved"
      ).length,
    },
    reports: reportRows,
    sections: sections ?? [],
  };
}

export async function getVillageReportMonitoringDetail(reportId: string) {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return null;
  }

  const supabase = createAdminClient();

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
      assigned_section_id,
      admin_note,
      internal_handling_note,
      rejection_reason,
      latitude,
      longitude,
      auto_address,
      manual_address,
      verification_due_at,
      resolution_due_at,
      resolved_at,
      created_at,
      updated_at,
      category:categories(name),
      hamlet:dusuns(name),
      reporter:profiles!reports_reporter_id_fkey(full_name, email, phone_number),
      agency:agencies!reports_agency_id_fkey(name, description, contact_person, phone, email, address)
      `
    )
    .eq("id", reportId)
    .maybeSingle();

  if (error || !report) {
    console.error("Failed to fetch village report detail:", error?.message);
    return null;
  }

  const [
    { data: section },
    { data: reportPhotos },
    { data: statusLogs },
    { data: verification },
    { data: progressUpdates, error: progressUpdatesError },
    { data: budgetRequests, error: budgetRequestsError },
    { data: slaEvents, error: slaEventsError },
  ] = await Promise.all([
    report.assigned_section_id
      ? supabase
          .from("village_sections")
          .select("id, name")
          .eq("id", report.assigned_section_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("report_photos")
      .select("id, file_path, photo_url, created_at")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true }),
    supabase
      .from("report_status_logs")
      .select("id, old_status, new_status, note, created_at")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true }),
    supabase
      .from("report_verifications")
      .select("id, verified_by, is_valid, verification_note, created_at")
      .eq("report_id", reportId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
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
      .order("created_at", { ascending: false }),
    supabase
      .from("report_budget_requests")
      .select(
        `
        id,
        summary_note,
        total_estimated_budget,
        requested_by,
        section_id,
        status,
        reviewed_by,
        reviewed_at,
        review_note,
        created_at,
        updated_at
        `
      )
      .eq("report_id", reportId)
      .order("created_at", { ascending: false }),
    supabase
      .from("report_sla_events")
      .select(
        `
        id,
        event_type,
        previous_resolution_due_at,
        new_resolution_due_at,
        note,
        created_at
        `
      )
      .eq("report_id", reportId)
      .order("created_at", { ascending: true }),
  ]);

  if (
    progressUpdatesError &&
    !isMissingDatabaseRelationError(progressUpdatesError.message)
  ) {
    console.error(
      "Failed to fetch village report progress updates:",
      progressUpdatesError.message
    );
  }

  if (
    budgetRequestsError &&
    !isMissingDatabaseRelationError(budgetRequestsError.message)
  ) {
    console.error(
      "Failed to fetch village report budget requests:",
      budgetRequestsError.message
    );
  }

  const slaEventsSchemaReady =
    !slaEventsError || !isMissingDatabaseRelationError(slaEventsError.message);

  if (slaEventsError && slaEventsSchemaReady) {
    console.error(
      "Failed to fetch village report SLA events:",
      slaEventsError.message
    );
  }

  const signedReportPhotos = await createSignedPhotoUrls(
    reportPhotos ?? [],
    "report-photos",
    supabase
  );

  let verificationData = null;

  if (verification) {
    const [{ data: verifier }, { data: verificationPhotos }] = await Promise.all([
      verification.verified_by
        ? supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", verification.verified_by)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("verification_photos")
        .select("id, file_path, photo_url, created_at")
        .eq("verification_id", verification.id)
        .order("created_at", { ascending: true }),
    ]);

    verificationData = {
      ...verification,
      verifier,
      photos: await createSignedPhotoUrls(
        verificationPhotos ?? [],
        "verification-photos",
        supabase
      ),
    };
  }

  const progressRows = progressUpdatesError
    ? []
    : progressUpdates ?? [];
  const progressUpdateIds = progressRows.map((update) => update.id);
  const progressCreatorIds = uniqueValues(
    progressRows
      .map((update) => update.created_by)
      .filter((id): id is string => Boolean(id))
  );

  const [{ data: progressPhotos }, { data: progressCreators }] =
    await Promise.all([
      progressUpdateIds.length > 0
        ? supabase
            .from("report_progress_photos")
            .select("id, progress_update_id, file_path, photo_url, created_at")
            .in("progress_update_id", progressUpdateIds)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      progressCreatorIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", progressCreatorIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  const signedProgressPhotos = await createSignedPhotoUrls(
    progressPhotos ?? [],
    "progress-photos",
    supabase
  );
  const progressCreatorById = new Map(
    (progressCreators ?? []).map((creator) => [creator.id, creator])
  );

  const budgetRows = budgetRequestsError ? [] : budgetRequests ?? [];
  const budgetRequestIds = budgetRows.map((request) => request.id);
  const profileIds = uniqueValues(
    [
      ...budgetRows.map((request) => request.requested_by),
      ...budgetRows.map((request) => request.reviewed_by),
    ].filter((id): id is string => Boolean(id))
  );
  const sectionIds = uniqueValues(
    budgetRows
      .map((request) => request.section_id)
      .filter((id): id is string => Boolean(id))
  );

  const [
    { data: budgetItems },
    { data: budgetProfiles },
    { data: budgetSections },
  ] = await Promise.all([
    budgetRequestIds.length > 0
      ? supabase
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
      : Promise.resolve({ data: [], error: null }),
    profileIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", profileIds)
      : Promise.resolve({ data: [], error: null }),
    sectionIds.length > 0
      ? supabase
          .from("village_sections")
          .select("id, name")
          .in("id", sectionIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const budgetProfileById = new Map(
    (budgetProfiles ?? []).map((budgetProfile) => [
      budgetProfile.id,
      budgetProfile,
    ])
  );
  const budgetSectionById = new Map(
    (budgetSections ?? []).map((budgetSection) => [
      budgetSection.id,
      budgetSection,
    ])
  );

  return {
    report: {
      ...report,
      section,
    },
    photos: signedReportPhotos,
    statusLogs: statusLogs ?? [],
    slaEvents: {
      schemaReady: slaEventsSchemaReady,
      events: (slaEventsError ? [] : slaEvents ?? []) as ReportSlaEventRow[],
    },
    verification: verificationData,
    progressUpdates: progressRows.map((update) => ({
      id: update.id,
      title: update.progress_title,
      note: update.progress_note,
      status: update.progress_status,
      created_at: update.created_at,
      creator: update.created_by
        ? progressCreatorById.get(update.created_by) ?? null
        : null,
      photos: signedProgressPhotos.filter(
        (photo) => photo.progress_update_id === update.id
      ),
    })),
    budgetRequests: budgetRows.map((request) => ({
      id: request.id,
      note: request.summary_note,
      estimated_budget: Number(request.total_estimated_budget || 0),
      status: request.status,
      created_at: request.created_at,
      updated_at: request.updated_at,
      reviewed_at: request.reviewed_at,
      review_note: request.review_note,
      requester: request.requested_by
        ? budgetProfileById.get(request.requested_by) ?? null
        : null,
      reviewer: request.reviewed_by
        ? budgetProfileById.get(request.reviewed_by) ?? null
        : null,
      section: request.section_id
        ? budgetSectionById.get(request.section_id) ?? null
        : null,
      items: (budgetItems ?? [])
        .filter((item) => item.budget_request_id === request.id)
        .map((item) => ({
          ...item,
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          subtotal: Number(item.subtotal || 0),
        })),
    })),
  };
}

export type VillageSectionOption = {
  id: string;
  name: string;
};

export async function getVillageSectionOptions() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("village_sections")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch village section options:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getVillageBudgetRequestsData() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return {
      budgetSchemaReady: true,
      reviewSchemaReady: true,
      stats: {
        totalRequests: 0,
        totalEstimatedBudget: 0,
        waitingBudgetReports: 0,
      },
      requests: [],
    };
  }

  const supabase = createAdminClient();

  const baseBudgetRequestSelect = `
      id,
      report_id,
      summary_note,
      total_estimated_budget,
      requested_by,
      section_id,
      status,
      created_at
      `;

  const reviewBudgetRequestSelect = `
      ${baseBudgetRequestSelect},
      reviewed_by,
      reviewed_at,
      review_note
      `;

  let reviewSchemaReady = true;
  let budgetRequests: VillageBudgetRequestRow[] | null = null;
  let requestsError: { message: string } | null = null;
  const fullResult = await supabase
    .from("report_budget_requests")
    .select(reviewBudgetRequestSelect)
    .order("created_at", { ascending: false })
    .limit(100);

  budgetRequests = fullResult.data as VillageBudgetRequestRow[] | null;
  requestsError = fullResult.error;

  if (requestsError && isMissingBudgetReviewSchemaError(requestsError.message)) {
    reviewSchemaReady = false;

    const fallbackResult = await supabase
      .from("report_budget_requests")
      .select(baseBudgetRequestSelect)
      .order("created_at", { ascending: false })
      .limit(100);

    budgetRequests = fallbackResult.data as VillageBudgetRequestRow[] | null;
    requestsError = fallbackResult.error;
  }

  if (requestsError) {
    if (isMissingDatabaseRelationError(requestsError.message)) {
      return {
        budgetSchemaReady: false,
        reviewSchemaReady: false,
        stats: {
          totalRequests: 0,
          totalEstimatedBudget: 0,
          waitingBudgetReports: 0,
        },
        requests: [],
      };
    }

    console.error("Failed to fetch village budget requests:", requestsError.message);

    return {
      budgetSchemaReady: true,
      reviewSchemaReady,
      stats: {
        totalRequests: 0,
        totalEstimatedBudget: 0,
        waitingBudgetReports: 0,
      },
      requests: [],
    };
  }

  const requestsData = budgetRequests ?? [];
  const reportIds = uniqueValues(
    requestsData.map((request) => request.report_id)
  );
  const requesterIds = uniqueValues(
    requestsData
      .map((request) => request.requested_by)
      .filter((id): id is string => Boolean(id))
  );
  const reviewerIds = uniqueValues(
    requestsData
      .map((request) => request.reviewed_by)
      .filter((id): id is string => Boolean(id))
  );

  const [
    { data: reports, error: reportsError },
    { data: requesters },
    { data: reviewers },
  ] = await Promise.all([
      reportIds.length > 0
        ? supabase
            .from("reports")
            .select(
              `
              id,
              report_number,
              title,
              status,
              priority,
              follow_up_type,
              assigned_section_id,
              updated_at,
              category:categories(name),
              hamlet:dusuns(name)
              `
            )
            .in("id", reportIds)
        : Promise.resolve({ data: [], error: null }),
      requesterIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, full_name, email, section_id")
            .in("id", requesterIds)
        : Promise.resolve({ data: [], error: null }),
      reviewerIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", reviewerIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (reportsError) {
    console.error(
      "Failed to fetch reports for village budget requests:",
      reportsError.message
    );
  }

  const sectionIds = uniqueValues([
    ...requestsData
      .map((request) => request.section_id)
      .filter((id): id is string => Boolean(id)),
  ]);

  const { data: sections } =
    sectionIds.length > 0
      ? await supabase
          .from("village_sections")
          .select("id, name")
          .in("id", sectionIds)
      : { data: [] };

  const reportById = new Map((reports ?? []).map((report) => [report.id, report]));
  const requesterById = new Map(
    (requesters ?? []).map((requester) => [requester.id, requester])
  );
  const reviewerById = new Map(
    (reviewers ?? []).map((reviewer) => [reviewer.id, reviewer])
  );
  const sectionById = new Map(
    (sections ?? []).map((section) => [section.id, section])
  );

  const requestIds = requestsData.map((request) => request.id);
  const { data: items } =
    requestIds.length > 0
      ? await supabase
          .from("report_budget_request_items")
          .select("id, budget_request_id")
          .in("budget_request_id", requestIds)
      : { data: [] };

  const requests = requestsData.map((request) => {
    const report = reportById.get(request.report_id) ?? null;
    const requester = request.requested_by
      ? requesterById.get(request.requested_by) ?? null
      : null;
    const reviewer = request.reviewed_by
      ? reviewerById.get(request.reviewed_by) ?? null
      : null;
    const sectionId = request.section_id ?? report?.assigned_section_id ?? null;

    return {
      id: request.id,
      note: request.summary_note,
      estimated_budget: Number(request.total_estimated_budget || 0),
      status: request.status,
      created_at: request.created_at,
      reviewed_at: request.reviewed_at ?? null,
      review_note: request.review_note ?? null,
      report,
      requester,
      reviewer,
      section: sectionId ? sectionById.get(sectionId) ?? null : null,
      itemCount: (items ?? []).filter(
        (item) => item.budget_request_id === request.id
      ).length,
    };
  });

  return {
    budgetSchemaReady: true,
    reviewSchemaReady,
    stats: {
      totalRequests: requests.length,
      totalEstimatedBudget: requests.reduce(
        (sum, request) => sum + request.estimated_budget,
        0
      ),
      waitingBudgetReports: requests.filter(
        (request) => request.report?.status === "waiting_budget"
      ).length,
    },
    requests,
  };
}

export async function getVillageBudgetRequestDetail(requestId: string) {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return null;
  }

  const supabase = createAdminClient();
  const baseSelect = `
    id,
    report_id,
    summary_note,
    total_estimated_budget,
    requested_by,
    section_id,
    status,
    created_at,
    updated_at
  `;
  const reviewSelect = `
    ${baseSelect},
    reviewed_by,
    reviewed_at,
    review_note
  `;

  let reviewSchemaReady = true;
  let request: VillageBudgetRequestRow | null = null;
  let requestError: { message: string } | null = null;
  const fullResult = await supabase
    .from("report_budget_requests")
    .select(reviewSelect)
    .eq("id", requestId)
    .maybeSingle();

  request = fullResult.data as VillageBudgetRequestRow | null;
  requestError = fullResult.error;

  if (requestError && isMissingBudgetReviewSchemaError(requestError.message)) {
    reviewSchemaReady = false;

    const fallback = await supabase
      .from("report_budget_requests")
      .select(baseSelect)
      .eq("id", requestId)
      .maybeSingle();

    request = fallback.data as VillageBudgetRequestRow | null;
    requestError = fallback.error;
  }

  if (requestError) {
    if (!isMissingDatabaseRelationError(requestError.message)) {
      console.error("Failed to fetch budget request detail:", requestError.message);
    }

    return null;
  }

  if (!request) {
    return null;
  }

  const [
    { data: report, error: reportError },
    { data: requester },
    { data: reviewer },
    { data: section },
    { data: items, error: itemsError },
  ] = await Promise.all([
    supabase
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
        asset_status,
        authority_level,
        internal_handling_note,
        created_at,
        updated_at,
        category:categories(name),
        hamlet:dusuns(name),
        reporter:profiles!reports_reporter_id_fkey(full_name, email, phone_number)
        `
      )
      .eq("id", request.report_id)
      .maybeSingle(),
    request.requested_by
      ? supabase
          .from("profiles")
          .select("id, full_name, email, phone_number")
          .eq("id", request.requested_by)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    request.reviewed_by
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", request.reviewed_by)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    request.section_id
      ? supabase
          .from("village_sections")
          .select("id, name")
          .eq("id", request.section_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("report_budget_request_items")
      .select(
        `
        id,
        item_name,
        description,
        quantity,
        unit,
        unit_price,
        subtotal,
        created_at
        `
      )
      .eq("budget_request_id", request.id)
      .order("created_at", { ascending: true }),
  ]);

  if (reportError) {
    console.error("Failed to fetch report for budget request detail:", reportError.message);
  }

  if (itemsError) {
    console.error("Failed to fetch budget request items:", itemsError.message);
  }

  return {
    budgetSchemaReady: true,
    reviewSchemaReady,
    request: {
      id: request.id,
      note: request.summary_note,
      estimated_budget: Number(request.total_estimated_budget || 0),
      status: request.status,
      created_at: request.created_at,
      updated_at: request.updated_at,
      reviewed_at: request.reviewed_at ?? null,
      review_note: request.review_note ?? null,
      report,
      requester,
      reviewer,
      section,
      items: (items ?? []).map((item) => ({
        ...item,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        subtotal: Number(item.subtotal || 0),
      })),
    },
  };
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

type PhotoRow = {
  file_path?: string | null;
  photo_url?: string | null;
};

async function createSignedPhotoUrls<TPhoto extends PhotoRow>(
  photos: TPhoto[],
  bucket: string,
  supabase: SupabaseClient
) {
  return Promise.all(
    photos.map(async (photo) => {
      const path = photo.file_path || photo.photo_url;

      if (!path) {
        return {
          ...photo,
          signed_url: null,
        };
      }

      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60);

      return {
        ...photo,
        signed_url: data?.signedUrl ?? null,
      };
    })
  );
}
