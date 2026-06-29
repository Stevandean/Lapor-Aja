import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  ImageIcon,
  Phone,
  ShieldCheck,
  ShieldX,
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
import { AdminReportReviewPanel } from "@/src/features/admin/components/AdminReportReviewPanel";
import { AdminArchivePanel } from "@/src/features/admin/components/AdminArchivePanel";
import { AdminReportRelationsPanel } from "@/src/features/admin/components/AdminReportRelationsPanel";
import { GenerateOfficialLetterButton } from "@/src/features/admin/components/GenerateOfficialLetterButton";
import { ReportStatusTimeline } from "@/src/features/reports/components/ReportStatusTimeline";
import { ReportSlaEventTimeline } from "@/src/features/reports/components/ReportSlaEventTimeline";
import { ReportLocationPreviewSection } from "@/src/features/reports/components/ReportLocationPreviewSection";
import { AdminFollowUpProgressPanel } from "@/src/features/admin/components/AdminFollowUpProgressPanel";

import {
  getAdminReportDetail,
  getAdminReportReviewOptions,
  getActiveSlaPriorityOptions,
} from "@/src/features/admin/queries";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";
import { calculateEffectiveSlaStatus } from "@/src/lib/sla";

type ReportDetailPageProps = {
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

type AgencyRelation =
  | {
      name?: string | null;
      description?: string | null;
      contact_person?: string | null;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
    }
  | {
      name?: string | null;
      description?: string | null;
      contact_person?: string | null;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
    }[]
  | null;

export default async function AdminReportDetailPage({
  params,
}: ReportDetailPageProps) {
  const { id } = await params;
  const [ detail, priorityOptions ] = await Promise.all([
    getAdminReportDetail(id),
    getActiveSlaPriorityOptions(),
  ]);
  const { categories, hamlets } = await getAdminReportReviewOptions();

  if (!detail) {
    notFound();
  }

  const { report, photos, verification, verificationPhotos } = detail;

  const status = report.status as keyof typeof REPORT_STATUS_LABELS;
  const priority = report.priority as keyof typeof REPORT_PRIORITY_LABELS;

  const categoryName = getRelationName(report.category);
  const hamletName = getRelationName(report.hamlet);
  const reporter = getReporter(report.reporter);
  const effectiveSlaStatus = calculateEffectiveSlaStatus(report);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/reports"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to reports
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
                Detailed information submitted by the citizen.
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
              <CardTitle>Status Timeline</CardTitle>
              <CardDescription>
                Real status history of this report from submission to the latest handling
                process.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ReportStatusTimeline logs={detail.status_logs ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photo Evidence</CardTitle>
              <CardDescription>
                Uploaded photos submitted as evidence for this report.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {photos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
                  <p className="text-sm font-medium text-foreground">
                    No photos uploaded
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Photo evidence will appear here after upload.
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

          {report.agency ? (
            <Card>
              <CardHeader>
                <CardTitle>Forwarded Agency</CardTitle>
                <CardDescription>
                  Target agency selected for this forwarded report.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {getAgencyValue(report.agency as AgencyRelation, "name") ?? "-"}
                  </p>

                  {getAgencyValue(report.agency as AgencyRelation, "description") ? (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {getAgencyValue(report.agency as AgencyRelation, "description")}
                    </p>
                  ) : null}

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <InfoItem
                      label="Contact Person"
                      value={
                        getAgencyValue(
                          report.agency as AgencyRelation,
                          "contact_person"
                        ) ?? "-"
                      }
                    />

                    <InfoItem
                      label="Phone"
                      value={
                        getAgencyValue(report.agency as AgencyRelation, "phone") ?? "-"
                      }
                    />

                    <InfoItem
                      label="Email"
                      value={
                        getAgencyValue(report.agency as AgencyRelation, "email") ?? "-"
                      }
                    />

                    <InfoItem
                      label="Address"
                      value={
                        getAgencyValue(report.agency as AgencyRelation, "address") ?? "-"
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Field Verification Result</CardTitle>
              <CardDescription>
                Verification result submitted by the hamlet head after checking the report
                location.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {!verification ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                  </div>

                  <p className="mt-4 text-sm font-medium text-foreground">
                    No verification result yet
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    The verification result will appear here after the hamlet head
                    completes field verification.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div
                    className={
                      verification.is_valid
                        ? "rounded-2xl border border-success-100 bg-success-50 p-4 text-sm leading-6 text-success-700"
                        : "rounded-2xl border border-danger-100 bg-danger-50 p-4 text-sm leading-6 text-danger-700"
                    }
                  >
                    <div className="flex items-start gap-3">
                      {verification.is_valid ? (
                        <ShieldCheck className="mt-0.5 h-5 w-5" />
                      ) : (
                        <ShieldX className="mt-0.5 h-5 w-5" />
                      )}

                      <div>
                        <p className="font-semibold">
                          {verification.is_valid
                            ? "Verified as valid"
                            : "Verified as invalid"}
                        </p>

                        <p className="mt-1 text-sm">
                          Verified on {formatDateTime(verification.created_at)}
                        </p>

                        <p className="mt-3 whitespace-pre-line">
                          {verification.verification_note}
                        </p>
                      </div>
                    </div>
                  </div>

                  {verificationPhotos.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center">
                      <p className="text-sm font-medium text-foreground">
                        No verification photos uploaded
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-3 text-sm font-semibold text-foreground">
                        Verification Photos
                      </p>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {verificationPhotos.map((photo) => (
                          <div
                            key={photo.id}
                            className="overflow-hidden rounded-2xl border border-border bg-muted"
                          >
                            {photo.signedUrl ? (
                              <Image
                                src={photo.signedUrl}
                                alt="Verification evidence"
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
                    </div>
                  )}
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
          <AdminReportReviewPanel
            reportId={report.id}
            currentStatus={report.status}
            categories={categories}
            hamlets={hamlets}
            priorityOptions={priorityOptions}
          />

          <AdminArchivePanel
            reportId={report.id}
            currentStatus={report.status}
          />

          {report.status === "forwarded_to_agency" ? (
            <Card>
              <CardHeader>
                <CardTitle>Official Letter</CardTitle>
                <CardDescription>
                  Generate an official letter for the selected target agency.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <GenerateOfficialLetterButton reportId={report.id} />
              </CardContent>
            </Card>
          ) : null}

          <AdminFollowUpProgressPanel
            reportId={report.id}
            currentStatus={report.status}
            followUpType={report.follow_up_type}
          />

          <AdminReportRelationsPanel
            reportId={report.id}
            currentStatus={report.status}
            relations={detail.report_relations}
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
              <CardTitle>Classification</CardTitle>
              <CardDescription>
                These fields will be completed by the village admin.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <InfoItem label="Category" value={categoryName} />
              <InfoItem label="Hamlet" value={hamletName} />
              <InfoItem label="Asset status" value={formatEnum(report.asset_status)} />
              <InfoItem
                label="Authority level"
                value={formatEnum(report.authority_level)}
              />
              <InfoRow
                label="Follow-up type"
                value={formatEnum(report.follow_up_type)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SLA Information</CardTitle>
              <CardDescription>
                SLA will be calculated after admin review.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <InfoRow label="SLA status" value={formatEnum(effectiveSlaStatus)} />
              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Verification due"
                value={
                  report.verification_due_at
                    ? formatDateTime(report.verification_due_at)
                    : "-"
                }
              />
              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Resolution due"
                value={
                  report.resolution_due_at
                    ? formatDateTime(report.resolution_due_at)
                    : "-"
                }
              />
            </CardContent>
          </Card>

          <ReportSlaEventTimeline
            events={detail.sla_events.events}
            schemaReady={detail.sla_events.schemaReady}
          />
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
      {icon && (
        <div className="mt-0.5 text-muted-foreground">
          {icon}
        </div>
      )}

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

function formatEnum(value: string | null) {
  if (!value) return "-";

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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

function getAgencyValue(
  agency: AgencyRelation,
  key:
    | "name"
    | "description"
    | "contact_person"
    | "phone"
    | "email"
    | "address"
) {
  if (!agency) return null;
  if (Array.isArray(agency)) return agency[0]?.[key] ?? null;
  return agency[key] ?? null;
}
