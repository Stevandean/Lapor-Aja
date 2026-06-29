import { CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";

type ReportStatusLog = {
  id: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
};

type ReportStatusTimelineProps = {
  logs: ReportStatusLog[];
  emptyText?: string;
};

export function ReportStatusTimeline({
  logs,
  emptyText = "No status history available yet.",
}: ReportStatusTimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {logs.map((log, index) => {
        const isLast = index === logs.length - 1;

        return (
          <div key={log.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={
                  isLast
                    ? "flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    : "flex h-9 w-9 items-center justify-center rounded-full bg-success-50 text-success-700"
                }
              >
                {isLast ? (
                  <Clock3 className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>

              {!isLast ? <div className="h-12 w-px bg-border" /> : null}
            </div>

            <div className="pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={getStatusBadgeClass(log.new_status)}>
                  {getStatusLabel(log.new_status)}
                </Badge>

                {isLast ? (
                  <Badge className="bg-primary-50 text-primary-700">
                    Current
                  </Badge>
                ) : null}
              </div>

              <p className="mt-2 text-sm font-semibold text-foreground">
                {getTimelineTitle(log.new_status)}
              </p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {log.note || getTimelineDescription(log.new_status)}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {formatDateTime(log.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getStatusBadgeClass(status: string) {
  type StatusKey = keyof typeof REPORT_STATUS_LABELS;

  return (
    REPORT_STATUS_BADGE_CLASSES[status as StatusKey] ??
    "bg-muted text-muted-foreground border-border"
  );
}

function getStatusLabel(status: string) {
  type StatusKey = keyof typeof REPORT_STATUS_LABELS;

  return REPORT_STATUS_LABELS[status as StatusKey] ?? formatEnum(status);
}

function getTimelineTitle(status: string) {
  const titles: Record<string, string> = {
    pending: "Report Submitted",
    need_verification: "Sent for Field Verification",
    verified_valid: "Verified as Valid",
    verified_invalid: "Verified as Invalid",
    classified: "Report Classified",
    handled_by_village: "Handled by Village",
    forwarded_to_agency: "Forwarded to Agency",
    waiting_budget: "Waiting for Budget",
    in_progress: "Handling in Progress",
    resolved: "Report Resolved",
    rejected: "Report Rejected",
    archived: "Report Archived",
    merged: "Report Merged",
  };

  return titles[status] ?? getStatusLabel(status);
}

function getTimelineDescription(status: string) {
  const descriptions: Record<string, string> = {
    pending: "Your report has been submitted and is waiting for admin review.",
    need_verification:
      "The report has been approved by admin and sent to the hamlet head for field verification.",
    verified_valid:
      "The hamlet head has verified that the report is valid.",
    verified_invalid:
      "The hamlet head has verified that the report is invalid.",
    classified:
      "The admin has classified the report for the proper follow-up process.",
    handled_by_village:
      "The report will be handled directly by the village.",
    forwarded_to_agency:
      "The report has been forwarded to the relevant agency.",
    waiting_budget:
      "The report is waiting for budget allocation or planning.",
    in_progress:
      "The report is currently being handled by the responsible party.",
    resolved:
      "The report has been resolved.",
    rejected:
      "The report was rejected after review.",
    archived:
      "The report has been archived for record keeping.",
    merged:
      "The report has been merged into a master report for consolidated handling.",
  };

  return descriptions[status] ?? "The report status has been updated.";
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatEnum(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
