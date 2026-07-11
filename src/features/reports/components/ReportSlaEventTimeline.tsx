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
        <CardTitle>Linimasa SLA</CardTitle>
        <CardDescription>
          Jejak audit batas waktu untuk laporan ini.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!schemaReady ? (
          <EmptyState text="Skema event SLA belum tersedia. Jalankan migration supabase/migrations/202606250003_report_sla_events.sql untuk mengaktifkan jejak audit ini." />
        ) : events.length === 0 ? (
          <EmptyState text="Belum ada event SLA yang tercatat." />
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
                          Terbaru
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
                            label="Batas sebelumnya"
                            value={event.previous_resolution_due_at}
                          />
                          <DeadlineRow
                            label="Batas baru"
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
      label: "SLA Dimulai",
      description: "Batas penyelesaian dimulai untuk laporan ini.",
      badgeClass: "bg-primary-50 text-primary-700",
      iconClass: "bg-primary-50 text-primary-700",
      icon: Timer,
    },
    paused_budget: {
      label: "SLA Dijeda",
      description: "Batas penyelesaian dijeda selama menunggu anggaran.",
      badgeClass: "bg-warning-50 text-warning-700",
      iconClass: "bg-warning-50 text-warning-700",
      icon: PauseCircle,
    },
    resumed_budget: {
      label: "SLA Dilanjutkan",
      description: "Batas penyelesaian dilanjutkan setelah review anggaran.",
      badgeClass: "bg-primary-50 text-primary-700",
      iconClass: "bg-primary-50 text-primary-700",
      icon: PlayCircle,
    },
    completed: {
      label: "SLA Selesai",
      description: "Pelacakan SLA selesai untuk laporan ini.",
      badgeClass: "bg-success-50 text-success-700",
      iconClass: "bg-success-50 text-success-700",
      icon: CheckCircle2,
    },
    merged: {
      label: "SLA Dihentikan karena Merge",
      description: "Pelacakan SLA dihentikan karena laporan ini digabungkan.",
      badgeClass: "bg-muted text-muted-foreground",
      iconClass: "bg-muted text-muted-foreground",
      icon: GitMerge,
    },
  };

  return (
    eventMap[eventType] ?? {
      label: formatEnum(eventType),
      description: "Peristiwa SLA tercatat untuk laporan ini.",
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
  const labels: Record<string, string> = {
    deadline_started: "SLA Dimulai",
    paused_budget: "SLA Dijeda",
    resumed_budget: "SLA Dilanjutkan",
    completed: "SLA Selesai",
    merged: "SLA Dihentikan karena Merge",
    at_risk: "Berisiko",
    overdue: "Melewati Tenggat",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}
