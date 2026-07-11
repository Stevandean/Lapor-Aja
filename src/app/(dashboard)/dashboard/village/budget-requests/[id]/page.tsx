import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
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
import { VillageBudgetReviewActions } from "@/src/features/village/components/VillageBudgetReviewActions";
import { getVillageBudgetRequestDetail } from "@/src/features/village/queries";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import {
  REPORT_PRIORITY_BADGE_CLASSES,
  REPORT_PRIORITY_LABELS,
} from "@/src/lib/constants/reportPriority";

type BudgetRequestDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BudgetRequestDetailPage({
  params,
}: BudgetRequestDetailPageProps) {
  const { id } = await params;
  const detail = await getVillageBudgetRequestDetail(id);

  if (!detail) {
    notFound();
  }

  const { request, reviewSchemaReady } = detail;
  const report = request.report;
  const reporter = getSingleRelation(report?.reporter ?? null);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <Link
            href="/dashboard/village/budget-requests"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke pengajuan anggaran
          </Link>

          <p className="mt-5 text-sm font-semibold text-primary">
            Detail Pengajuan Anggaran
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {report?.title ?? "Laporan tidak diketahui"}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Tinjau konteks laporan dan rincian estimasi item sebelum menyetujui
            atau menolak pengajuan.
          </p>
        </div>

        <Link href="/dashboard/village/budget-requests">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Pengajuan
          </Button>
        </Link>
      </section>

      {!reviewSchemaReady ? (
        <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
          Kolom peninjauan anggaran belum tersedia. Jalankan migration{" "}
          <span className="font-semibold">
            supabase/migrations/202606240002_budget_request_review.sql
          </span>{" "}
          sebelum menyetujui atau menolak pengajuan ini.
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <CardTitle>Konteks Laporan</CardTitle>
                  <CardDescription>
                    {report?.report_number ?? "-"} diajukan untuk penanganan
                    tingkat desa.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap gap-2">
                  <BudgetStatusBadge status={request.status} />
                  <ReportStatusBadge status={report?.status} />
                  <PriorityBadge priority={report?.priority} />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <p className="whitespace-pre-line text-sm leading-7 text-foreground">
                {report?.description ?? "Deskripsi laporan tidak tersedia."}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem
                  icon={<ClipboardList className="h-4 w-4" />}
                  label="Kategori"
                  value={getRelationName(report?.category ?? null)}
                />
                <InfoItem
                  icon={<ClipboardList className="h-4 w-4" />}
                  label="Dusun"
                  value={getRelationName(report?.hamlet ?? null)}
                />
                <InfoItem
                  label="Tindak lanjut"
                  value={formatEnum(report?.follow_up_type ?? null)}
                />
                <InfoItem
                  label="Kewenangan"
                  value={formatEnum(report?.authority_level ?? null)}
                />
                <InfoItem
                  label="Catatan internal"
                  value={report?.internal_handling_note ?? "-"}
                />
                <InfoItem
                  icon={<User className="h-4 w-4" />}
                  label="Pelapor"
                  value={reporter?.full_name ?? "-"}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Item Anggaran</CardTitle>
              <CardDescription>
                Rincian estimasi yang dikirim oleh Kasi yang ditugaskan.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {request.items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
                  Item anggaran tidak ditemukan.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Item</th>
                          <th className="px-4 py-3 font-semibold">Jumlah</th>
                          <th className="px-4 py-3 font-semibold">Satuan</th>
                          <th className="px-4 py-3 font-semibold">Harga Satuan</th>
                          <th className="px-4 py-3 font-semibold">Subtotal</th>
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
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
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
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Pengajuan</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <InfoItem
                icon={<Wallet className="h-4 w-4" />}
                label="Total estimasi"
                value={formatCurrency(request.estimated_budget)}
              />
              <InfoItem
                icon={<ClipboardList className="h-4 w-4" />}
                label="Seksi"
                value={request.section?.name ?? "-"}
              />
              <InfoItem
                icon={<User className="h-4 w-4" />}
                label="Diajukan oleh"
                value={request.requester?.full_name ?? "-"}
              />
              <InfoItem
                icon={<CalendarDays className="h-4 w-4" />}
                label="Dikirim"
                value={formatDateTime(request.created_at)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alasan Anggaran</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-line text-sm leading-7 text-foreground">
                {request.note}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keputusan Peninjauan</CardTitle>
              <CardDescription>
                Setujui atau tolak pengajuan setelah memeriksa laporan dan
                rincian item.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {request.status === "submitted" ? (
                <VillageBudgetReviewActions
                  requestId={request.id}
                  requestStatus={request.status}
                  reviewSchemaReady={reviewSchemaReady}
                />
              ) : (
                <ReviewSummary request={request} />
              )}
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}

function BudgetStatusBadge({ status }: { status: string }) {
  const variants: Record<string, "warning" | "success" | "danger" | "muted"> = {
    submitted: "warning",
    approved: "success",
    rejected: "danger",
  };
  const labels: Record<string, string> = {
    submitted: "Menunggu Peninjauan",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  return <Badge variant={variants[status] ?? "muted"}>{labels[status] ?? status}</Badge>;
}

function ReportStatusBadge({ status }: { status?: string }) {
  if (!status) {
    return <Badge variant="muted">-</Badge>;
  }

  const key = status as keyof typeof REPORT_STATUS_LABELS;

  return (
    <Badge className={REPORT_STATUS_BADGE_CLASSES[key] ?? "bg-muted text-muted-foreground"}>
      {REPORT_STATUS_LABELS[key] ?? status}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) {
    return <Badge variant="muted">-</Badge>;
  }

  const key = priority as keyof typeof REPORT_PRIORITY_LABELS;

  return (
    <Badge className={REPORT_PRIORITY_BADGE_CLASSES[key] ?? "bg-muted text-muted-foreground"}>
      {REPORT_PRIORITY_LABELS[key] ?? priority}
    </Badge>
  );
}

function InfoItem({
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
      {icon ? <div className="mt-0.5 text-muted-foreground">{icon}</div> : null}
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 whitespace-pre-line text-sm font-medium leading-6 text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function ReviewSummary({
  request,
}: {
  request: {
    status: string;
    reviewer: { full_name: string | null } | null;
    reviewed_at: string | null;
    review_note: string | null;
  };
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm leading-6">
      <div className="mb-3">
        <BudgetStatusBadge status={request.status} />
      </div>
      <p className="font-semibold text-foreground">
        {request.reviewer?.full_name ?? "Peninjau"}
      </p>
      <p className="text-xs text-muted-foreground">
        {request.reviewed_at ? formatDateTime(request.reviewed_at) : "-"}
      </p>
      <p className="mt-3 whitespace-pre-line text-muted-foreground">
        {request.review_note || "Tidak ada catatan peninjauan."}
      </p>
    </div>
  );
}

function getRelationName(relation: { name: string }[] | { name: string } | null) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.name ?? "-";
  return relation.name ?? "-";
}

function getSingleRelation<T>(relation: T[] | T | null): T | null {
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
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
