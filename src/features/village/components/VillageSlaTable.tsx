import { AlertTriangle, ClipboardList, GitMerge, PauseCircle } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";

type RelationName = {
  name: string;
};

type SlaReport = {
  id: string;
  report_number: string;
  title: string;
  status: keyof typeof REPORT_STATUS_LABELS;
  priority: keyof typeof REPORT_PRIORITY_LABELS;
  sla_status: string | null;
  verification_due_at: string | null;
  resolution_due_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  category: RelationName[] | RelationName | null;
  hamlet: RelationName[] | RelationName | null;
};

type VillageSlaTableProps = {
  reports: SlaReport[];
};

export function VillageSlaTable({ reports }: VillageSlaTableProps) {
  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <ClipboardList className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-foreground">
          No SLA reports
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          SLA monitoring data will appear after reports are submitted and
          processed.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-4 font-semibold">Report</th>
              <th className="px-5 py-4 font-semibold">Hamlet</th>
              <th className="px-5 py-4 font-semibold">Priority</th>
              <th className="px-5 py-4 font-semibold">Workflow Status</th>
              <th className="px-5 py-4 font-semibold">SLA Status</th>
              <th className="px-5 py-4 font-semibold">Verification Due</th>
              <th className="px-5 py-4 font-semibold">Resolution Due</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {reports.map((report) => (
              <tr
                key={report.id}
                className="transition-colors hover:bg-muted/40"
              >
                <td className="px-5 py-4">
                  <div className="max-w-xs">
                    <p className="truncate font-semibold text-foreground">
                      {report.title}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {report.report_number} - {getRelationName(report.category)}
                    </p>
                  </div>
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {getRelationName(report.hamlet)}
                </td>

                <td className="px-5 py-4">
                  <Badge variant="muted">
                    {REPORT_PRIORITY_LABELS[report.priority] ?? report.priority}
                  </Badge>
                </td>

                <td className="px-5 py-4">
                  <Badge
                    className={
                      REPORT_STATUS_BADGE_CLASSES[report.status] ??
                      "bg-muted text-muted-foreground"
                    }
                  >
                    {REPORT_STATUS_LABELS[report.status] ?? report.status}
                  </Badge>
                </td>

                <td className="px-5 py-4">
                  <SlaBadge value={report.sla_status} />
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {report.verification_due_at
                    ? formatDateTime(report.verification_due_at)
                    : "-"}
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {report.resolution_due_at
                    ? formatDateTime(report.resolution_due_at)
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border lg:hidden">
        {reports.map((report) => (
          <div key={report.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {report.title}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {report.report_number}
                </p>
              </div>

              <SlaBadge value={report.sla_status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <InfoItem label="Hamlet" value={getRelationName(report.hamlet)} />
              <InfoItem
                label="Priority"
                value={REPORT_PRIORITY_LABELS[report.priority] ?? report.priority}
              />
              <InfoItem
                label="Verification Due"
                value={
                  report.verification_due_at
                    ? formatDateTime(report.verification_due_at)
                    : "-"
                }
              />
              <InfoItem
                label="Resolution Due"
                value={
                  report.resolution_due_at
                    ? formatDateTime(report.resolution_due_at)
                    : "-"
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlaBadge({ value }: { value: string | null }) {
  if (!value) {
    return <Badge variant="muted">Not Set</Badge>;
  }

  if (value === "on_time") {
    return <Badge className="bg-success-50 text-success-700">On Time</Badge>;
  }

  if (value === "at_risk") {
    return (
      <Badge className="bg-warning-50 text-warning-700">
        <AlertTriangle className="mr-1 h-3 w-3" />
        At Risk
      </Badge>
    );
  }

  if (value === "overdue") {
    return (
      <Badge className="bg-danger-50 text-danger-700">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Overdue
      </Badge>
    );
  }

  if (value === "completed") {
    return <Badge className="bg-info-50 text-info-700">Completed</Badge>;
  }

  if (value === "paused_budget") {
    return (
      <Badge className="bg-warning-50 text-warning-700">
        <PauseCircle className="mr-1 h-3 w-3" />
        Paused Budget
      </Badge>
    );
  }

  if (value === "merged") {
    return (
      <Badge className="bg-slate-100 text-slate-700">
        <GitMerge className="mr-1 h-3 w-3" />
        Merged
      </Badge>
    );
  }

  return <Badge variant="muted">{formatEnum(value)}</Badge>;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

function getRelationName(relation: RelationName[] | RelationName | null) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.name ?? "-";
  return relation.name ?? "-";
}

function formatEnum(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
