import { createAdminClient } from "@/src/lib/supabase/admin";
import { createClient } from "@/src/lib/supabase/server";

const LIST_LIMIT = 50;
const ACTIVE_RELATION_STATUSES = [
  "pending",
  "need_verification",
  "verified_valid",
  "classified",
  "handled_by_village",
  "forwarded_to_agency",
  "waiting_budget",
  "in_progress",
];

type RelatedReportCandidate = {
  id: string;
  report_number: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at?: string | null;
  resolved_at?: string | null;
  manual_address?: string | null;
  auto_address?: string | null;
  category?: { name: string | null }[] | { name: string | null } | null;
  hamlet?: { name: string | null }[] | { name: string | null } | null;
};

type ReportRelationRow = {
  id: string;
  relation_type: "duplicate" | "recurrence";
  note: string | null;
  created_at: string;
  source?: RelatedReportCandidate[] | RelatedReportCandidate | null;
  target?: RelatedReportCandidate[] | RelatedReportCandidate | null;
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

function isMissingReportRelationsError(message: string | null | undefined) {
  return Boolean(
    message?.includes("report_relations") &&
      (message.includes("does not exist") ||
        message.includes("Could not find the table"))
  );
}

function isMissingReportSlaEventsError(message: string | null | undefined) {
  return Boolean(
    message?.includes("report_sla_events") &&
      (message.includes("does not exist") ||
        message.includes("Could not find the table"))
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
    if (relationError && !isMissingReportRelationsError(relationError.message)) {
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

export async function getAdminReports() {
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
      created_at,
      categories(name),
      dusuns(name)
    `
    )
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    console.error("Failed to fetch admin reports:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getAdminReportDetail(reportId: string) {
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
      rejection_reason,
      admin_note,
      verification_due_at,
      resolution_due_at,
      resolved_at,
      sla_status,
      created_at,
      updated_at,
      category:categories(name),
      hamlet:dusuns(name),
      reporter:profiles!reports_reporter_id_fkey(full_name, email, phone_number),
      agency:agencies!reports_agency_id_fkey(name, description, contact_person, phone, email, address)
    `
    )
    .eq("id", reportId)
    .single();

  if (error) {
    console.error("Failed to fetch report detail:", error.message);
    return null;
  }

  if (!report) {
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

    const { data: verification, error: verificationError } = await supabase
    .from("report_verifications")
    .select("id, is_valid, verification_note, created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (verificationError) {
    console.error("Failed to fetch report verification:", verificationError.message);
  }

  let verificationPhotosWithSignedUrls: {
    id: string;
    file_path: string;
    photo_url: string;
    created_at: string;
    signedUrl: string | null;
  }[] = [];

  if (verification) {
    const { data: verificationPhotos, error: verificationPhotosError } =
      await supabase
        .from("verification_photos")
        .select("id, file_path, photo_url, created_at")
        .eq("verification_id", verification.id)
        .order("created_at", { ascending: true });

    if (verificationPhotosError) {
      console.error(
        "Failed to fetch verification photos:",
        verificationPhotosError.message
      );
    }

    verificationPhotosWithSignedUrls = await Promise.all(
      (verificationPhotos ?? []).map(async (photo) => {
        const { data } = await supabase.storage
          .from("verification-photos")
          .createSignedUrl(photo.file_path, 60 * 60);

        return {
          ...photo,
          signedUrl: data?.signedUrl ?? null,
        };
      })
    );
  }

  const { data: statusLogs, error: statusLogsError } = await supabase
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

  if (statusLogsError) {
    console.error("Failed to fetch admin report status logs:", statusLogsError.message);
  }

  const adminSupabase = createAdminClient();
  let relationSchemaReady = true;
  let outgoingRelations: ReportRelationRow[] = [];
  let incomingRelations: ReportRelationRow[] = [];
  let duplicateCandidates: RelatedReportCandidate[] = [];
  let recurringSourceCandidates: RelatedReportCandidate[] = [];
  let recurrenceCandidates: RelatedReportCandidate[] = [];
  let slaEventsSchemaReady = true;
  let slaEvents: ReportSlaEventRow[] = [];

  const [
    outgoingResult,
    incomingResult,
    duplicateCandidatesResult,
    recurrenceCandidatesResult,
    slaEventsResult,
  ] = await Promise.all([
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
          created_at,
          updated_at
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
          created_at,
          updated_at
        )
        `
      )
      .eq("target_report_id", reportId)
      .order("created_at", { ascending: false }),
    adminSupabase
      .from("reports")
      .select(
        `
        id,
        report_number,
        title,
        description,
        status,
        priority,
        manual_address,
        auto_address,
        created_at,
        updated_at,
        category:categories(name),
        hamlet:dusuns(name)
        `
      )
      .neq("id", reportId)
      .in("status", ACTIVE_RELATION_STATUSES)
      .order("updated_at", { ascending: false })
      .limit(100),
    adminSupabase
      .from("reports")
      .select(
        `
        id,
        report_number,
        title,
        description,
        status,
        priority,
        manual_address,
        auto_address,
        resolved_at,
        created_at,
        updated_at,
        category:categories(name),
        hamlet:dusuns(name)
        `
      )
      .neq("id", reportId)
      .in("status", ["resolved", "archived"])
      .order("resolved_at", { ascending: false, nullsFirst: false })
      .limit(100),
    adminSupabase
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

  const relationErrors = [
    outgoingResult.error,
    incomingResult.error,
    duplicateCandidatesResult.error,
    recurrenceCandidatesResult.error,
  ].filter(Boolean);

  const missingRelationSchema = relationErrors.some((error) =>
    isMissingReportRelationsError(error?.message)
  );

  if (missingRelationSchema) {
    relationSchemaReady = false;
  } else {
    for (const relationError of relationErrors) {
      if (relationError) {
        console.error(
          "Failed to fetch admin report relations:",
          relationError.message
        );
      }
    }

    outgoingRelations = (outgoingResult.data ?? []) as ReportRelationRow[];
    incomingRelations = (incomingResult.data ?? []) as ReportRelationRow[];
    const activeCandidates = (duplicateCandidatesResult.data ??
      []) as RelatedReportCandidate[];
    recurrenceCandidates = (recurrenceCandidatesResult.data ??
      []) as RelatedReportCandidate[];

    const activeCandidateIds = activeCandidates.map((candidate) => candidate.id);
    const { data: sourceRelations, error: sourceRelationsError } =
      activeCandidateIds.length > 0
        ? await adminSupabase
            .from("report_relations")
            .select("source_report_id, relation_type")
            .in("source_report_id", activeCandidateIds)
        : { data: [], error: null };

    if (sourceRelationsError) {
      console.error(
        "Failed to fetch active report relation filters:",
        sourceRelationsError.message
      );
    }

    const duplicateSourceIds = new Set(
      (sourceRelations ?? [])
        .filter((relation) => relation.relation_type === "duplicate")
        .map((relation) => relation.source_report_id)
    );
    const recurrenceSourceIds = new Set(
      (sourceRelations ?? [])
        .filter((relation) => relation.relation_type === "recurrence")
        .map((relation) => relation.source_report_id)
    );

    duplicateCandidates = activeCandidates.filter(
      (candidate) => !duplicateSourceIds.has(candidate.id)
    );
    recurringSourceCandidates = activeCandidates.filter(
      (candidate) => !recurrenceSourceIds.has(candidate.id)
    );
  }

  if (slaEventsResult.error) {
    if (isMissingReportSlaEventsError(slaEventsResult.error.message)) {
      slaEventsSchemaReady = false;
    } else {
      console.error(
        "Failed to fetch admin report SLA events:",
        slaEventsResult.error.message
      );
    }
  } else {
    slaEvents = (slaEventsResult.data ?? []) as ReportSlaEventRow[];
  }

  return {
    report,
    photos: photosWithSignedUrls,
    verification,
    verificationPhotos: verificationPhotosWithSignedUrls,
    status_logs: statusLogs ?? [],
    report_relations: {
      schemaReady: relationSchemaReady,
      outgoing: outgoingRelations,
      incoming: incomingRelations,
      duplicateCandidates,
      recurringSourceCandidates,
      recurrenceCandidates,
    },
    sla_events: {
      schemaReady: slaEventsSchemaReady,
      events: slaEvents,
    },
  };
}

export async function getAdminReportReviewOptions() {
  const supabase = await createClient();

  const [{ data: categories }, { data: hamlets }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("dusuns").select("id, name").order("name"),
  ]);

  return {
    categories: categories ?? [],
    hamlets: hamlets ?? [],
  };
}

export async function getAdminAssetClassificationReports() {
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
    .eq("status", "verified_valid")
    .order("updated_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    console.error("Failed to fetch asset classification reports:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getAdminAssetClassificationReportDetail(reportId: string) {
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
      assigned_section_id,
      latitude,
      longitude,
      admin_note,
      created_at,
      updated_at,
      category:categories(name),
      hamlet:dusuns(name),
      reporter:profiles!reports_reporter_id_fkey(full_name, email, phone_number),
      agency:agencies!reports_agency_id_fkey(name)
    `
    )
    .eq("id", reportId)
    .in("status", ["verified_valid", "classified"])
    .single();

  if (error || !report) {
    console.error("Failed to fetch asset classification detail:", error?.message);
    return null;
  }

  const { data: reportPhotos } = await supabase
    .from("report_photos")
    .select("id, file_path, photo_url, created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  const reportPhotosWithSignedUrls = await Promise.all(
    (reportPhotos ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from("report-photos")
        .createSignedUrl(photo.file_path, 60 * 60);

      return {
        ...photo,
        signedUrl: data?.signedUrl ?? null,
      };
    })
  );

  const { data: verification } = await supabase
    .from("report_verifications")
    .select("id, is_valid, verification_note, created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let verificationPhotosWithSignedUrls: {
    id: string;
    file_path: string;
    photo_url: string;
    created_at: string;
    signedUrl: string | null;
  }[] = [];

  if (verification) {
    const { data: verificationPhotos } = await supabase
      .from("verification_photos")
      .select("id, file_path, photo_url, created_at")
      .eq("verification_id", verification.id)
      .order("created_at", { ascending: true });

    verificationPhotosWithSignedUrls = await Promise.all(
      (verificationPhotos ?? []).map(async (photo) => {
        const { data } = await supabase.storage
          .from("verification-photos")
          .createSignedUrl(photo.file_path, 60 * 60);

        return {
          ...photo,
          signedUrl: data?.signedUrl ?? null,
        };
      })
    );
  }

  return {
    report,
    reportPhotos: reportPhotosWithSignedUrls,
    verification,
    verificationPhotos: verificationPhotosWithSignedUrls,
  };
}

export async function getAdminFollowUpReports() {
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
      reporter:profiles!reports_reporter_id_fkey(full_name, email, phone_number),
      agency:agencies!reports_agency_id_fkey(name)
    `
    )
    .in("status", [
      "classified",
      "handled_by_village",
      "forwarded_to_agency",
      "waiting_budget",
      "in_progress"
    ])
    .order("updated_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    console.error("Failed to fetch follow-up reports:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getAdminArchivedReports() {
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
      reporter:profiles!reports_reporter_id_fkey(full_name, email, phone_number),
      agency:agencies!reports_agency_id_fkey(name)
    `
    )
    .eq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    console.error("Failed to fetch archived reports:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getActiveAgencies() {

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agencies")
    .select(
      `
      id,
      name
      `
    )
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch active agencies:", error.message);
    return [];
  }

  const reports = data ?? [];
  const relationSummaryByReportId = await getRelationSummaryByReportId(
    reports.map((report) => report.id)
  );

  return reports.map((report) => ({
    ...report,
    relation_summary:
      relationSummaryByReportId.get(report.id) ?? emptyRelationSummary(),
  }));
}

export async function getActiveVillageSections() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("village_sections")
    .select(
      `
      id,
      name
      `
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch active village sections:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getActiveSlaPriorityOptions() {

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sla_rules")
    .select(
      `
      priority,
      verification_hours,
      resolution_hours,
      updated_at
      `
    )
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch active SLA priorities:", error.message);
    return [];
  }

  const priorityOrder: Record<string, number> = {
    darurat: 1,
    tinggi: 2,
    sedang: 3,
    rendah: 4,
  };

  const uniqueOptions = Array.from(
    new Map((data ?? []).map((option) => [option.priority, option])).values()
  );

  return uniqueOptions.sort(
    (a, b) =>
      (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
  );
}

export async function getOfficialLetterByReportId(reportId: string) {

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("official_letters")
    .select(
      `
      id,
      report_id,
      letter_type,
      letter_number,
      subject,
      body,
      recipient_agency_id,
      generated_by,
      generated_at,
      signed_by,
      signed_at,
      pdf_url,
      file_path,
      status,
      created_at,
      updated_at
      `
    )
    .eq("report_id", reportId)
    .eq("letter_type", "surat_permohonan_perbaikan")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch official letter:", error.message);
    return null;
  }

  return data;
}

export async function getReportsReadyForOfficialLetter() {

  const supabase = await createClient();

  const { data: existingLetters, error: letterError } = await supabase
    .from("official_letters")
    .select("report_id")
    .eq("letter_type", "surat_permohonan_perbaikan");

  if (letterError) {
    console.error("Failed to fetch existing letters:", letterError.message);
    return [];
  }

  const existingReportIds = new Set(
    (existingLetters ?? []).map((letter) => letter.report_id)
  );

  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      description,
      status,
      agency_id,
      updated_at,
      agency:agencies!reports_agency_id_fkey(id, name)
      `
    )
    .eq("status", "forwarded_to_agency")
    .not("agency_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to fetch reports ready for letters:", error.message);
    return [];
  }

  return (data ?? []).filter((report) => !existingReportIds.has(report.id));
}

export async function getGeneratedOfficialLetters() {

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("official_letters")
    .select(
      `
      id,
      report_id,
      letter_type,
      letter_number,
      subject,
      body,
      recipient_agency_id,
      generated_at,
      status,
      created_at,
      updated_at,
      report:reports!official_letters_report_id_fkey(
        id,
        report_number,
        title,
        status
      ),
      agency:agencies!official_letters_recipient_agency_id_fkey(
        id,
        name
      )
      `
    )
    .eq("letter_type", "surat_permohonan_perbaikan")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to fetch generated official letters:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getOfficialLetterDetail(letterId: string) {

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("official_letters")
    .select(
      `
      id,
      report_id,
      letter_type,
      letter_number,
      subject,
      body,
      recipient_agency_id,
      generated_at,
      status,
      created_at,
      updated_at,
      report:reports!official_letters_report_id_fkey(
        id,
        report_number,
        title,
        description,
        status,
        manual_address,
        auto_address,
        latitude,
        longitude
      ),
      agency:agencies!official_letters_recipient_agency_id_fkey(
        id,
        name,
        address,
        contact_person,
        phone,
        email
      )
      `
    )
    .eq("id", letterId)
    .single();

  if (error) {
    console.error("Failed to fetch official letter detail:", error.message);
    return null;
  }

  return data;
}
