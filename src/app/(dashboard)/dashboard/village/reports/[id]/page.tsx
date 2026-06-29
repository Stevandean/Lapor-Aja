import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardList,
  ImageIcon,
  User,
  Wallet,
} from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { ReportLocationPreviewSection } from "@/src/features/reports/components/ReportLocationPreviewSection";
import { ReportSlaEventTimeline } from "@/src/features/reports/components/ReportSlaEventTimeline";
import { ReportStatusTimeline } from "@/src/features/reports/components/ReportStatusTimeline";
import { getVillageReportMonitoringDetail } from "@/src/features/village/queries";
import {
  REPORT_PRIORITY_BADGE_CLASSES,
  REPORT_PRIORITY_LABELS,
} from "@/src/lib/constants/reportPriority";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";

type VillageReportDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type RelationName = {
  name?: string | null;
};

type ReporterRelation =
  | {
      full_name?: string | null;
      email?: string | null;
      phone_number?: string | null;
    }
  | {
      full_name?: string | null;
      email?: string | null;
      phone_number?: string | null;
    }[]
  | null;

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

export default async function VillageReportDetailPage({
  params,
}: VillageReportDetailPageProps) {
  const { id } = await params;
  const detail = await getVillageReportMonitoringDetail(id);

  if (!detail) {
    notFound();
  }

  const { report } = detail;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <Link
            href="/dashboard/village/reports"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to reports
          </Link>

          <p className="mt-5 text-sm font-semibold text-primary">
            Report Monitoring
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {report.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {report.report_number} submitted on {formatDateTime(report.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge status={report.status} />
          <PriorityBadge priority={report.priority} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Current Status"
          value={getStatusLabel(report.status)}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <SummaryCard
          title="Assigned Section"
          value={report.section?.name ?? "-"}
          icon={<User className="h-5 w-5" />}
        />
        <SummaryCard
          title="Follow-up"
          value={formatEnum(report.follow_up_type)}
          icon={<Building2 className="h-5 w-5" />}
        />
        <SummaryCard
          title="Updated"
          value={formatDate(report.updated_at)}
          icon={<CalendarDays className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Description</CardTitle>
              <CardDescription>
                Original report content submitted by the citizen.
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
                Full workflow history from submission to the latest movement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportStatusTimeline logs={detail.statusLogs ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kasi Progress Updates</CardTitle>
              <CardDescription>
                Field handling progress submitted by the assigned section.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detail.progressUpdates.length === 0 ? (
                <EmptyState text="No Kasi progress updates yet." />
              ) : (
                <div className="space-y-4">
                  {detail.progressUpdates.map((update) => (
                    <div
                      key={update.id}
                      className="rounded-2xl border border-border bg-muted/20 p-4"
                    >
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                          <p className="font-semibold text-foreground">
                            {update.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {update.creator?.full_name ?? "-"} ·{" "}
                            {formatDateTime(update.created_at)}
                          </p>
                        </div>
                        <Badge variant="muted">{formatEnum(update.status)}</Badge>
                      </div>

                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                        {update.note}
                      </p>

                      {update.photos.length > 0 ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {update.photos.map((photo) => (
                            <PhotoCard
                              key={photo.id}
                              src={photo.signed_url}
                              alt="Kasi progress evidence"
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget History</CardTitle>
              <CardDescription>
                Itemized budget requests submitted for this report.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detail.budgetRequests.length === 0 ? (
                <EmptyState text="No budget request has been submitted for this report." />
              ) : (
                <div className="space-y-4">
                  {detail.budgetRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-border bg-muted/20 p-4"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <BudgetStatusBadge status={request.status} />
                            <Badge variant="muted">
                              {request.section?.name ?? "-"}
                            </Badge>
                          </div>
                          <p className="mt-3 text-lg font-bold text-foreground">
                            {formatCurrency(request.estimated_budget)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Requested by {request.requester?.full_name ?? "-"} ·{" "}
                            {formatDateTime(request.created_at)}
                          </p>
                        </div>

                        <Link href={`/dashboard/village/budget-requests/${request.id}`}>
                          <Button variant="outline" size="sm">
                            <Wallet className="mr-2 h-4 w-4" />
                            Detail
                          </Button>
                        </Link>
                      </div>

                      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                        {request.note}
                      </p>

                      {request.reviewed_at ? (
                        <div className="mt-4 rounded-xl border border-border bg-card p-3 text-sm">
                          <p className="font-semibold text-foreground">
                            Reviewed by {request.reviewer?.full_name ?? "-"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDateTime(request.reviewed_at)}
                          </p>
                          <p className="mt-3 whitespace-pre-line text-muted-foreground">
                            {request.review_note || "-"}
                          </p>
                        </div>
                      ) : null}

                      {request.items.length > 0 ? (
                        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[680px] text-left text-sm">
                              <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                                <tr>
                                  <th className="px-4 py-3 font-semibold">Item</th>
                                  <th className="px-4 py-3 font-semibold">Qty</th>
                                  <th className="px-4 py-3 font-semibold">Unit</th>
                                  <th className="px-4 py-3 font-semibold">
                                    Unit Price
                                  </th>
                                  <th className="px-4 py-3 font-semibold">
                                    Subtotal
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {request.items.map((item) => (
                                  <tr key={item.id}>
                                    <td className="px-4 py-3">
                                      <p className="font-semibold text-foreground">
                                        {item.item_name}
                                      </p>
                                      {item.description ? (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          {item.description}
                                        </p>
                                      ) : null}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                      {formatNumber(item.quantity)}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                      {item.unit}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                      {formatCurrency(item.unit_price)}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-foreground">
                                      {formatCurrency(item.subtotal)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Citizen Evidence Photos</CardTitle>
              <CardDescription>
                Photos uploaded by the citizen when submitting the report.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detail.photos.length === 0 ? (
                <EmptyState text="No citizen evidence photos available." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {detail.photos.map((photo) => (
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

          <Card>
            <CardHeader>
              <CardTitle>Field Verification</CardTitle>
              <CardDescription>
                Verification result submitted by the hamlet head.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!detail.verification ? (
                <EmptyState text="No field verification data available." />
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {detail.verification.is_valid ? (
                        <Badge className="bg-success-50 text-success-700">
                          Valid Report
                        </Badge>
                      ) : (
                        <Badge className="bg-danger-50 text-danger-700">
                          Invalid Report
                        </Badge>
                      )}
                      <Badge variant="muted">
                        {detail.verification.verifier?.full_name ?? "-"}
                      </Badge>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                      {detail.verification.verification_note}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Verified on {formatDateTime(detail.verification.created_at)}
                    </p>
                  </div>

                  {detail.verification.photos.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {detail.verification.photos.map((photo) => (
                        <PhotoCard
                          key={photo.id}
                          src={photo.signed_url}
                          alt="Field verification evidence"
                        />
                      ))}
                    </div>
                  ) : null}
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
              <InfoRow label="Reporter" value={getReporterValue(report.reporter, "full_name")} />
              <InfoRow label="Email" value={getReporterValue(report.reporter, "email")} />
              <InfoRow
                label="Phone"
                value={getReporterValue(report.reporter, "phone_number")}
              />
              <InfoRow label="Category" value={getRelationName(report.category)} />
              <InfoRow label="Hamlet" value={getRelationName(report.hamlet)} />
              <InfoRow label="Created" value={formatDateTime(report.created_at)} />
              <InfoRow label="Resolved" value={report.resolved_at ? formatDateTime(report.resolved_at) : "-"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Asset Status" value={formatEnum(report.asset_status)} />
              <InfoRow label="Authority Level" value={formatEnum(report.authority_level)} />
              <InfoRow label="Follow-up Type" value={formatEnum(report.follow_up_type)} />
              <InfoRow label="Assigned Section" value={report.section?.name ?? "-"} />
              <InfoRow
                label="Verification Due"
                value={
                  report.verification_due_at
                    ? formatDateTime(report.verification_due_at)
                    : "-"
                }
              />
              <InfoRow
                label="Resolution Due"
                value={
                  report.resolution_due_at
                    ? formatDateTime(report.resolution_due_at)
                    : "-"
                }
              />
            </CardContent>
          </Card>

          <ReportSlaEventTimeline
            events={detail.slaEvents.events}
            schemaReady={detail.slaEvents.schemaReady}
          />

          {report.agency ? (
            <Card>
              <CardHeader>
                <CardTitle>Forwarded Agency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Agency" value={getAgencyValue(report.agency, "name")} />
                <InfoRow
                  label="Contact"
                  value={getAgencyValue(report.agency, "contact_person")}
                />
                <InfoRow label="Phone" value={getAgencyValue(report.agency, "phone")} />
                <InfoRow label="Email" value={getAgencyValue(report.agency, "email")} />
                <p className="whitespace-pre-line rounded-xl bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
                  {getAgencyValue(report.agency, "description")}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <NoteBlock title="Admin Note" note={report.admin_note} />
              <NoteBlock
                title="Handling Note"
                note={report.internal_handling_note}
              />
              <NoteBlock title="Rejection Reason" note={report.rejection_reason} />
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
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-3 text-base font-bold text-foreground">{value}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PhotoCard({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
        <ImageIcon className="mr-2 h-4 w-4" />
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="max-w-[190px] text-right text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}

function NoteBlock({ title, note }: { title: string; note: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 whitespace-pre-line rounded-xl bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
        {note || "-"}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={getStatusBadgeClass(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const key = priority as keyof typeof REPORT_PRIORITY_LABELS;

  return (
    <Badge
      className={
        REPORT_PRIORITY_BADGE_CLASSES[
          key as keyof typeof REPORT_PRIORITY_BADGE_CLASSES
        ] ?? "border-border bg-muted text-muted-foreground"
      }
    >
      {REPORT_PRIORITY_LABELS[key] ?? formatEnum(priority)}
    </Badge>
  );
}

function BudgetStatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return <Badge className="bg-success-50 text-success-700">Approved</Badge>;
  }

  if (status === "rejected") {
    return <Badge className="bg-danger-50 text-danger-700">Rejected</Badge>;
  }

  return <Badge className="bg-warning-50 text-warning-700">Submitted</Badge>;
}

function getRelationName(relation: RelationName[] | RelationName | null) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.name ?? "-";
  return relation.name ?? "-";
}

function getReporterValue(
  reporter: ReporterRelation,
  key: "full_name" | "email" | "phone_number"
) {
  if (!reporter) return "-";
  if (Array.isArray(reporter)) return reporter[0]?.[key] ?? "-";
  return reporter[key] ?? "-";
}

function getAgencyValue(
  agency: AgencyRelation,
  key: "name" | "description" | "contact_person" | "phone" | "email" | "address"
) {
  if (!agency) return "-";
  if (Array.isArray(agency)) return agency[0]?.[key] ?? "-";
  return agency[key] ?? "-";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatEnum(value: string | null) {
  if (!value) return "-";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type ReportStatusKey = keyof typeof REPORT_STATUS_LABELS;

function getStatusBadgeClass(status: string) {
  return (
    REPORT_STATUS_BADGE_CLASSES[status as ReportStatusKey] ??
    "border-border bg-muted text-muted-foreground"
  );
}

function getStatusLabel(status: string) {
  return REPORT_STATUS_LABELS[status as ReportStatusKey] ?? formatEnum(status);
}
