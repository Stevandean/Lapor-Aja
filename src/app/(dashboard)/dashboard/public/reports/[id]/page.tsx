import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GitMerge,
  History,
} from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { ReportStatusTimeline } from "@/src/features/reports/components/ReportStatusTimeline";
import { CreateReportModal } from "@/src/features/reports/components/CreateReportModal";
import { ReportLocationPreviewSection } from "@/src/features/reports/components/ReportLocationPreviewSection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { getCitizenReportDetail } from "@/src/features/citizen/queries";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";

type CitizenReportDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type RelationName = {
  name: string | null;
};

type ReportPhoto = {
  id: string;
  signed_url: string | null;
};

export default async function CitizenReportDetailPage({
  params,
}: CitizenReportDetailPageProps) {
  const { id } = await params;
  const report = await getCitizenReportDetail(id);

  if (!report) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">My Reports</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Report Detail
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Track your submitted report and monitor its latest handling status.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/public/reports">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Reports
            </Button>
          </Link>

          <CreateReportModal />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Report Number"
          value={report.report_number}
          icon={<FileText className="h-5 w-5" />}
        />

        <SummaryCard
          title="Current Status"
          value={getStatusLabel(report.status)}
          icon={<Clock3 className="h-5 w-5" />}
        />

        <SummaryCard
          title="Submitted Date"
          value={formatDate(report.created_at)}
          icon={<CalendarDays className="h-5 w-5" />}
        />

        <SummaryCard
          title="Resolved Date"
          value={report.resolved_at ? formatDate(report.resolved_at) : "-"}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <CardTitle>{report.title}</CardTitle>
                  <CardDescription>{report.report_number}</CardDescription>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusBadgeClass(report.status)}>
                    {getStatusLabel(report.status)}
                  </Badge>

                  <PriorityBadge priority={report.priority} />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {report.description}
              </p>
            </CardContent>
          </Card>

          <ReportRelationsNotice relations={report.report_relations} />

          <Card>
            <CardHeader>
                <CardTitle>Status Timeline</CardTitle>
                <CardDescription>
                This timeline shows the real handling history of your report.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <ReportStatusTimeline logs={report.status_logs} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submitted Photos</CardTitle>
              <CardDescription>
                Evidence photos uploaded when you submitted the report.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {report.photos.length === 0 ? (
                <EmptyText text="No photos available." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {report.photos.map((photo: ReportPhoto) => (
                    <PhotoCard
                      key={photo.id}
                      src={photo.signed_url}
                      alt="Citizen report evidence"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <CardContent>
            <ReportLocationPreviewSection
              latitude={report.latitude}
              longitude={report.longitude}
              title={report.title}
              address={report.manual_address || report.auto_address}
            />
          </CardContent>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <InfoRow label="Category" value={getRelationName(report.category)} />
              <InfoRow label="Hamlet" value={getRelationName(report.hamlet)} />
              <InfoRow label="Priority" value={formatPriority(report.priority)} />
              <InfoRow label="Created At" value={formatDate(report.created_at)} />
              <InfoRow label="Updated At" value={formatDate(report.updated_at)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Message from Staff</CardTitle>
            </CardHeader>

            <CardContent>
              {report.status === "rejected" ? (
                <p className="whitespace-pre-line text-sm leading-7 text-danger-700">
                  {report.rejection_reason || "Your report was rejected."}
                </p>
              ) : (
                <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {report.admin_note ||
                    "No additional message from staff yet."}
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-3 text-lg font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function PhotoCard({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
        Photo unavailable
      </div>
    );
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
      <Image src={src} alt={alt} fill className="object-cover" />
    </div>
  );
}

type RelatedReport = {
  id: string;
  report_number: string;
  title: string;
  status: string;
  priority: string;
  updated_at?: string | null;
  resolved_at?: string | null;
};

type CitizenReportRelation = {
  id: string;
  relation_type: "duplicate" | "recurrence";
  note: string | null;
  created_at: string;
  source?: RelatedReport[] | RelatedReport | null;
  target?: RelatedReport[] | RelatedReport | null;
};

type CitizenReportRelations = {
  schemaReady: boolean;
  outgoing: CitizenReportRelation[];
  incoming: CitizenReportRelation[];
};

function ReportRelationsNotice({
  relations,
}: {
  relations: CitizenReportRelations;
}) {
  if (!relations?.schemaReady) {
    return null;
  }

  const visibleRelations = [
    ...relations.outgoing.map((relation) => ({
      relation,
      report: getSingleRelation(relation.target),
      direction: "outgoing" as const,
    })),
    ...relations.incoming.map((relation) => ({
      relation,
      report: getSingleRelation(relation.source),
      direction: "incoming" as const,
    })),
  ];

  if (visibleRelations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Related Reports</CardTitle>
        <CardDescription>
          This section explains if your report was merged or connected to a
          recurring issue.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {visibleRelations.map(({ relation, report, direction }) => (
          <div
            key={relation.id}
            className="rounded-2xl border border-border bg-muted/30 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-primary">
                {relation.relation_type === "duplicate" ? (
                  <GitMerge className="h-5 w-5" />
                ) : (
                  <History className="h-5 w-5" />
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">
                  {getRelationTitle(relation.relation_type, direction)}
                </p>

                {report ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {report.report_number} - {report.title}
                  </p>
                ) : null}

                {relation.note ? (
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                    {relation.note}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function getRelationTitle(
  relationType: "duplicate" | "recurrence",
  direction: "outgoing" | "incoming"
) {
  if (relationType === "duplicate") {
    return direction === "outgoing"
      ? "This report was merged into a master report"
      : "Another report was merged into this report";
  }

  return direction === "outgoing"
    ? "This report is a recurring issue"
    : "A newer report was marked as a recurrence of this issue";
}

function getSingleRelation<T>(relation: T[] | T | null | undefined) {
  if (!relation) return null;
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

function PriorityBadge({ priority }: { priority: string }) {
  const label = formatPriority(priority);

  if (priority === "darurat") {
    return <Badge className="bg-danger-50 text-danger-700">{label}</Badge>;
  }

  if (priority === "tinggi") {
    return <Badge className="bg-warning-50 text-warning-700">{label}</Badge>;
  }

  if (priority === "sedang") {
    return <Badge className="bg-primary-50 text-primary-700">{label}</Badge>;
  }

  return <Badge variant="muted">{label}</Badge>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="max-w-[180px] text-right text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function getRelationName(relation: RelationName[] | RelationName | null) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.name ?? "-";
  return relation.name ?? "-";
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

function formatPriority(priority: string) {
  return (
    REPORT_PRIORITY_LABELS[
      priority as keyof typeof REPORT_PRIORITY_LABELS
    ] ?? formatEnum(priority)
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatEnum(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
