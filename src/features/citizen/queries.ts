import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { createClient } from "@/src/lib/supabase/server";

const LIST_LIMIT = 50;

async function requireCitizen() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (profile.role !== "public") {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}

const progressStatuses = [
  "need_verification",
  "verified_valid",
  "classified",
  "handled_by_village",
  "forwarded_to_agency",
  "waiting_budget",
  "in_progress",
];

type CitizenRelatedReport = {
  id: string;
  report_number: string;
  title: string;
  status: string;
  priority: string;
  updated_at?: string | null;
  resolved_at?: string | null;
};

type CitizenReportRelationRow = {
  id: string;
  relation_type: "duplicate" | "recurrence";
  note: string | null;
  created_at: string;
  source?: CitizenRelatedReport[] | CitizenRelatedReport | null;
  target?: CitizenRelatedReport[] | CitizenRelatedReport | null;
};

function isMissingReportRelationsError(message: string | null | undefined) {
  return Boolean(
    message?.includes("report_relations") &&
      (message.includes("does not exist") ||
        message.includes("Could not find the table"))
  );
}

export async function getCitizenDashboardData() {
  const profile = await requireCitizen();
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
      created_at,
      updated_at,
      resolved_at,
      category:categories(name),
      hamlet:dusuns(name)
    `
    )
    .eq("reporter_id", profile.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch citizen dashboard data:", error.message);

    return {
      reports: [],
      stats: {
        totalReports: 0,
        pendingReports: 0,
        inProcessReports: 0,
        resolvedReports: 0,
        archivedReports: 0,
      },
    };
  }

  const reports = data ?? [];

  return {
    reports: reports.slice(0, 5),
    stats: {
      totalReports: reports.length,
      pendingReports: reports.filter((report) => report.status === "pending")
        .length,
      inProcessReports: reports.filter((report) =>
        progressStatuses.includes(report.status)
      ).length,
      resolvedReports: reports.filter((report) => report.status === "resolved")
        .length,
      archivedReports: reports.filter((report) => report.status === "archived")
        .length,
    },
  };
}

export async function getCitizenReports() {
  const profile = await requireCitizen();
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
      updated_at,
      resolved_at,
      category:categories(name),
      hamlet:dusuns(name)
    `
    )
    .eq("reporter_id", profile.id)
    .order("updated_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    console.error("Failed to fetch citizen reports:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getCitizenReportDetail(reportId: string) {
  const profile = await requireCitizen();
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
      admin_note,
      rejection_reason,
      latitude,
      longitude,
      auto_address,
      manual_address,
      created_at,
      updated_at,
      resolved_at,
      category:categories(name),
      hamlet:dusuns(name)
    `
    )
    .eq("id", reportId)
    .eq("reporter_id", profile.id)
    .maybeSingle();

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

  if (error || !report) {
    console.error("Failed to fetch citizen report detail:", error?.message);
    return null;
  }

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

  const adminSupabase = createAdminClient();
  let relationSchemaReady = true;
  let outgoingRelations: CitizenReportRelationRow[] = [];
  let incomingRelations: CitizenReportRelationRow[] = [];

  const [outgoingResult, incomingResult] = await Promise.all([
    adminSupabase
      .from("report_relations")
      .select(
        `
        id,
        relation_type,
        note,
        created_at,
        target:reports!report_relations_target_report_id_fkey(
          id,
          report_number,
          title,
          status,
          priority,
          updated_at,
          resolved_at
        )
        `
      )
      .eq("source_report_id", reportId)
      .order("created_at", { ascending: false }),
    adminSupabase
      .from("report_relations")
      .select(
        `
        id,
        relation_type,
        note,
        created_at,
        source:reports!report_relations_source_report_id_fkey(
          id,
          report_number,
          title,
          status,
          priority,
          updated_at,
          resolved_at
        )
        `
      )
      .eq("target_report_id", reportId)
      .order("created_at", { ascending: false }),
  ]);

  const relationErrors = [outgoingResult.error, incomingResult.error].filter(
    Boolean
  );
  const missingRelationSchema = relationErrors.some((relationError) =>
    isMissingReportRelationsError(relationError?.message)
  );

  if (missingRelationSchema) {
    relationSchemaReady = false;
  } else {
    for (const relationError of relationErrors) {
      if (relationError) {
        console.error(
          "Failed to fetch citizen report relations:",
          relationError.message
        );
      }
    }

    outgoingRelations = (outgoingResult.data ?? []) as CitizenReportRelationRow[];
    incomingRelations = (incomingResult.data ?? []) as CitizenReportRelationRow[];
  }

  return {
    ...report,
    photos: signedPhotos,
    status_logs: statusLogs ?? [],
    report_relations: {
      schemaReady: relationSchemaReady,
      outgoing: outgoingRelations,
      incoming: incomingRelations,
    },
  };
}
