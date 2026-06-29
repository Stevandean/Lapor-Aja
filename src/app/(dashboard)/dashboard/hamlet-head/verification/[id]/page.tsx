import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { HamletVerificationActionPanel } from "@/src/features/hamlet-head/components/HamletVerificationActionPanel";
import { ReportLocationPreviewSection } from "@/src/features/reports/components/ReportLocationPreviewSection";
import { getHamletHeadVerificationReportDetail } from "@/src/features/hamlet-head/queries";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";

type VerificationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type RelationName = {
  name: string;
};

type ReporterProfile = {
  full_name: string;
  email: string;
  phone_number: string | null;
};

export default async function HamletVerificationDetailPage({
  params,
}: VerificationDetailPageProps) {
  const { id } = await params;
  const detail = await getHamletHeadVerificationReportDetail(id);

  if (!detail) {
    notFound();
  }

  const { report, photos } = detail;

  const status = report.status as keyof typeof REPORT_STATUS_LABELS;
  const priority = report.priority as keyof typeof REPORT_PRIORITY_LABELS;

  const categoryName = getRelationName(report.category);
  const hamletName = getRelationName(report.hamlet);
  const reporter = getReporter(report.reporter);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/hamlet-head/verification"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to verification list
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm font-semibold text-primary">
              {report.report_number}
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {report.title}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Submitted on {formatDateTime(report.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              className={
                REPORT_STATUS_BADGE_CLASSES[status] ??
                "bg-muted text-muted-foreground"
              }
            >
              {REPORT_STATUS_LABELS[status] ?? report.status}
            </Badge>

            <Badge variant="muted">
              {REPORT_PRIORITY_LABELS[priority] ?? report.priority}
            </Badge>
          </div>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Description</CardTitle>
              <CardDescription>
                Read the citizen report before doing field verification.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-line text-sm leading-7 text-foreground">
                {report.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photo Evidence</CardTitle>
              <CardDescription>
                Photos uploaded by the citizen as initial evidence.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {photos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
                  <p className="text-sm font-medium text-foreground">
                    No photos uploaded
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Citizen photo evidence will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="overflow-hidden rounded-2xl border border-border bg-muted"
                    >
                      {photo.signedUrl ? (
                        <Image
                          src={photo.signedUrl}
                          alt="Report evidence"
                          width={800}
                          height={600}
                          className="h-56 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                          Image unavailable
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <ReportLocationPreviewSection
                latitude={report.latitude}
                longitude={report.longitude}
                title={report.title}
                address={report.manual_address || report.auto_address}
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <HamletVerificationActionPanel
            reportId={report.id}
            currentStatus={report.status}
          />

          <Card>
            <CardHeader>
              <CardTitle>Reporter</CardTitle>
              <CardDescription>
                Citizen account that submitted this report.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="Name"
                value={reporter?.full_name ?? "-"}
              />

              <InfoRow
                icon={<ClipboardList className="h-4 w-4" />}
                label="Email"
                value={reporter?.email ?? "-"}
              />

              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={reporter?.phone_number ?? "-"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Classification</CardTitle>
              <CardDescription>
                Classification assigned by the village admin.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <InfoRow label="Category" value={categoryName} />
              <InfoRow label="Hamlet" value={hamletName} />
              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Last updated"
                value={formatDateTime(report.updated_at)}
              />
            </CardContent>
          </Card>

          {report.admin_note && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Note</CardTitle>
                <CardDescription>
                  Internal note from admin for verification.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <p className="whitespace-pre-line text-sm leading-7 text-foreground">
                  {report.admin_note}
                </p>
              </CardContent>
            </Card>
          )}
        </aside>
      </section>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      {icon && <div className="mt-0.5 text-muted-foreground">{icon}</div>}

      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function getRelationName(relation: RelationName[] | RelationName | null) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.name ?? "-";
  return relation.name ?? "-";
}

function getReporter(
  relation: ReporterProfile[] | ReporterProfile | null
): ReporterProfile | null {
  if (!relation) return null;
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
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