import { createClient } from "@/src/lib/supabase/server";
import { isEffectiveSlaOverdue } from "@/src/lib/sla";

async function getReportCount(
  filter?: {
    column: string;
    value: string;
  }
) {
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
    return 0;
  }

  return count ?? 0;
}

async function getEffectiveOverdueReportCount() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("status, created_at, resolution_due_at, resolved_at");

  if (error) {
    console.error("Failed to count effective overdue reports:", error.message);
    return 0;
  }

  return (data ?? []).filter((report) => isEffectiveSlaOverdue(report)).length;
}

export async function getAdminDashboardStats() {
  const [
    totalReports,
    pendingReports,
    needVerificationReports,
    inProgressReports,
    resolvedReports,
    overdueReports,
  ] = await Promise.all([
    getReportCount(),
    getReportCount({ column: "status", value: "pending" }),
    getReportCount({ column: "status", value: "need_verification" }),
    getReportCount({ column: "status", value: "in_progress" }),
    getReportCount({ column: "status", value: "resolved" }),
    getEffectiveOverdueReportCount(),
  ]);

  return {
    totalReports,
    pendingReports,
    needVerificationReports,
    inProgressReports,
    resolvedReports,
    overdueReports,
  };
}

export async function getRecentReports() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("id, report_number, title, status, priority, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return [];
  }

  return data ?? [];
}
