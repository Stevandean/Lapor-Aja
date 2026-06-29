import {
  AlertCircle,
  CheckCircle2,
  GitMerge,
  PauseCircle,
  PlayCircle,
  Timer,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/src/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export type ReportSlaEvent = {
  id: string;
  event_type: string;
  previous_resolution_due_at: string | null;
  new_resolution_due_at: string | null;
  note: string | null;
  created_at: string;
};

type ReportSlaEventTimelineProps = {
  events: ReportSlaEvent[];
  schemaReady?: boolean;
};

export function ReportSlaEventTimeline({
  events,
  schemaReady = true,
}: ReportSlaEventTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SLA Timeline</CardTitle>
        <CardDescription>
          Deadline audit trail for this report.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!schemaReady ? (
          <EmptyState text="SLA event schema is not available yet. Apply migration supabase/migrations/202606250003_report_sla_events.sql to enable this audit trail." />
        ) : events.length === 0 ? (
          <EmptyState text="No SLA events recorded yet." />
        ) : (
          <div className="space-y-0">
            {events.map((event, index) => {
              const meta = getEventMeta(event.event_type);
              const Icon = meta.icon;
              const isLast = index === events.length - 1;

              return (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${meta.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {!isLast ? <div className="h-14 w-px bg-border" /> : null}
                  </div>

                  <div className="min-w-0 pb-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={meta.badgeClass}>{meta.label}</Badge>
                      {isLast ? (
                        <Badge className="bg-primary-50 text-primary-700">
                          Latest
                        </Badge>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {event.note || meta.description}
                    </p>

                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <p>{formatDateTime(event.created_at)}</p>

                      {event.previous_resolution_due_at ||
                      event.new_resolution_due_at ? (
                        <div className="rounded-xl border border-border bg-muted/30 p-3">
                          <DeadlineRow
                            label="Previous due"
                            value={event.previous_resolution_due_at}
                          />
                          <DeadlineRow
                            label="New due"
                            value={event.new_resolution_due_at}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeadlineRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="text-right font-medium text-foreground">
        {value ? formatDateTime(value) : "-"}
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function getEventMeta(eventType: string): {
  label: string;
  description: string;
  badgeClass: string;
  iconClass: string;
  icon: LucideIcon;
} {
  const eventMap: Record<
    string,
    {
      label: string;
      description: string;
      badgeClass: string;
      iconClass: string;
      icon: LucideIcon;
    }
  > = {
    deadline_started: {
      label: "SLA Started",
      description: "Resolution deadline was started for this report.",
      badgeClass: "bg-primary-50 text-primary-700",
      iconClass: "bg-primary-50 text-primary-700",
      icon: Timer,
    },
    paused_budget: {
      label: "SLA Paused",
      description: "Resolution deadline was paused while waiting for budget.",
      badgeClass: "bg-warning-50 text-warning-700",
      iconClass: "bg-warning-50 text-warning-700",
      icon: PauseCircle,
    },
    resumed_budget: {
      label: "SLA Resumed",
      description: "Resolution deadline was resumed after budget review.",
      badgeClass: "bg-primary-50 text-primary-700",
      iconClass: "bg-primary-50 text-primary-700",
      icon: PlayCircle,
    },
    completed: {
      label: "SLA Completed",
      description: "SLA tracking was completed for this report.",
      badgeClass: "bg-success-50 text-success-700",
      iconClass: "bg-success-50 text-success-700",
      icon: CheckCircle2,
    },
    merged: {
      label: "SLA Stopped by Merge",
      description: "SLA tracking stopped because this report was merged.",
      badgeClass: "bg-muted text-muted-foreground",
      iconClass: "bg-muted text-muted-foreground",
      icon: GitMerge,
    },
  };

  return (
    eventMap[eventType] ?? {
      label: formatEnum(eventType),
      description: "SLA event was recorded for this report.",
      badgeClass: "bg-muted text-muted-foreground",
      iconClass: "bg-muted text-muted-foreground",
      icon: AlertCircle,
    }
  );
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
