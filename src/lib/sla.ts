export type EffectiveSlaStatus =
  | "on_time"
  | "at_risk"
  | "overdue"
  | "completed"
  | "paused_budget"
  | "merged"
  | "not_set";

const SLA_COMPLETED_STATUSES = [
  "resolved",
  "archived",
  "rejected",
  "verified_invalid",
];

export type SlaReportSnapshot = {
  status: string;
  created_at: string;
  resolution_due_at: string | null;
  resolved_at: string | null;
};

export function calculateEffectiveSlaStatus(
  report: SlaReportSnapshot,
  now = new Date()
): EffectiveSlaStatus {
  if (report.status === "merged") {
    return "merged";
  }

  if (report.status === "waiting_budget") {
    return "paused_budget";
  }

  if (SLA_COMPLETED_STATUSES.includes(report.status) || report.resolved_at) {
    return "completed";
  }

  if (!report.resolution_due_at) {
    return "not_set";
  }

  const createdAt = new Date(report.created_at);
  const resolutionDueAt = new Date(report.resolution_due_at);

  if (
    Number.isNaN(createdAt.getTime()) ||
    Number.isNaN(resolutionDueAt.getTime())
  ) {
    return "not_set";
  }

  if (now > resolutionDueAt) {
    return "overdue";
  }

  const totalDuration = resolutionDueAt.getTime() - createdAt.getTime();
  const remainingDuration = resolutionDueAt.getTime() - now.getTime();

  if (totalDuration <= 0) {
    return "at_risk";
  }

  const riskThreshold = totalDuration * 0.25;

  if (remainingDuration <= riskThreshold) {
    return "at_risk";
  }

  return "on_time";
}

export function isEffectiveSlaOverdue(report: SlaReportSnapshot) {
  return calculateEffectiveSlaStatus(report) === "overdue";
}
