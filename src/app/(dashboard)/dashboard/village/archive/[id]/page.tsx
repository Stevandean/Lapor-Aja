import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  ShieldCheck,
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
import { ReportStatusTimeline } from "@/src/features/reports/components/ReportStatusTimeline";
import { ReportLocationPreviewSection } from "@/src/features/reports/components/ReportLocationPreviewSection";
import { getVillageArchivedReportDetail } from "@/src/features/village/queries";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";

type ArchiveDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type RelationName = {
  name?: string | null;
};

type ReporterRelation = {
  full_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
};

type ArchivePhoto = {
  id: string;
  signed_url: string | null;
};

export default async function VillageArchiveDetailPage({
  params,
}: ArchiveDetailPageProps) {
  const { id } = await params;
  const report = await getVillageArchivedReportDetail(id);

  if (!report) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Arsip</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Detail Laporan Arsip
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Tinjau informasi laporan arsip, bukti verifikasi lapangan,
            klasifikasi, dan riwayat tindak lanjut.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/village/archive">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Arsip
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Nomor Laporan"
          value={report.report_number}
          icon={<FileText className="h-5 w-5" />}
        />

        <SummaryCard
          title="Prioritas"
          value={formatPriority(report.priority)}
          icon={<ShieldCheck className="h-5 w-5" />}
        />

        <SummaryCard
          title="Tanggal Selesai"
          value={report.resolved_at ? formatDate(report.resolved_at) : "-"}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <SummaryCard
          title="Tanggal Arsip"
          value={formatDate(report.updated_at)}
          icon={<CalendarDays className="h-5 w-5" />}
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

          <Card>
            <CardHeader>
                <CardTitle>Linimasa Status</CardTitle>
                <CardDescription>
                Riwayat penanganan laporan arsip ini.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <ReportStatusTimeline logs={report.status_logs ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Foto Bukti Masyarakat</CardTitle>
              <CardDescription>
                Foto yang dikirim masyarakat saat membuat laporan.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {report.report_photos.length === 0 ? (
                <EmptyText text="Belum ada foto dari masyarakat." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {report.report_photos.map((photo: ArchivePhoto) => (
                    <PhotoCard
                      key={photo.id}
                      src={photo.signed_url}
                      alt="Bukti laporan masyarakat"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verifikasi Lapangan</CardTitle>
              <CardDescription>
                Hasil verifikasi dan bukti lapangan dari kepala dusun.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {!report.verification ? (
                <EmptyText text="Belum ada data verifikasi lapangan." />
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {report.verification.is_valid ? (
                        <Badge className="bg-success-50 text-success-700">
                          Laporan Valid
                        </Badge>
                      ) : (
                        <Badge className="bg-danger-50 text-danger-700">
                          Laporan Tidak Valid
                        </Badge>
                      )}

                      <Badge variant="muted">
                        Diverifikasi oleh{" "}
                        {report.verification.verifier?.full_name ?? "-"}
                      </Badge>
                    </div>

                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                      {report.verification.verification_note}
                    </p>

                    <p className="mt-3 text-xs text-muted-foreground">
                      Diverifikasi pada {formatDate(report.verification.created_at)}
                    </p>
                  </div>

                  {report.verification.photos.length === 0 ? (
                    <EmptyText text="Belum ada foto verifikasi." />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {report.verification.photos.map((photo: ArchivePhoto) => (
                        <PhotoCard
                          key={photo.id}
                          src={photo.signed_url}
                          alt="Bukti verifikasi lapangan"
                        />
                      ))}
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
          <Card>
            <CardHeader>
              <CardTitle>Informasi Laporan</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <InfoRow label="Pelapor" value={getReporterName(report.reporter)} />
              <InfoRow label="Email Pelapor" value={getReporterEmail(report.reporter)} />
              <InfoRow label="Nomor HP Pelapor" value={getReporterPhone(report.reporter)} />
              <InfoRow label="Kategori" value={getRelationName(report.category)} />
              <InfoRow label="Dusun" value={getRelationName(report.hamlet)} />
              <InfoRow label="Dibuat" value={formatDate(report.created_at)} />
              <InfoRow label="Diperbarui" value={formatDate(report.updated_at)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Klasifikasi</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <InfoRow label="Status Aset" value={formatEnum(report.asset_status)} />
              <InfoRow label="Level Kewenangan" value={formatEnum(report.authority_level)} />
              <InfoRow label="Jenis Tindak Lanjut" value={formatEnum(report.follow_up_type)} />
              <InfoRow
                label="Batas Verifikasi"
                value={
                  report.verification_due_at
                    ? formatDate(report.verification_due_at)
                    : "-"
                }
              />
              <InfoRow
                label="Batas Penyelesaian"
                value={
                  report.resolution_due_at
                    ? formatDate(report.resolution_due_at)
                    : "-"
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Catatan Admin</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {report.admin_note || "-"}
              </p>
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
        Foto tidak tersedia
      </div>
    );
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
      <Image src={src} alt={alt} fill className="object-cover" />
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "darurat") {
    return <Badge className="bg-danger-50 text-danger-700">Darurat</Badge>;
  }

  if (priority === "tinggi") {
    return <Badge className="bg-warning-50 text-warning-700">Tinggi</Badge>;
  }

  if (priority === "sedang") {
    return <Badge className="bg-primary-50 text-primary-700">Sedang</Badge>;
  }

  return <Badge variant="muted">Rendah</Badge>;
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

function getReporterName(reporter: ReporterRelation[] | ReporterRelation | null) {
  if (!reporter) return "-";
  if (Array.isArray(reporter)) return reporter[0]?.full_name ?? "-";
  return reporter.full_name ?? "-";
}

function getReporterEmail(reporter: ReporterRelation[] | ReporterRelation | null) {
  if (!reporter) return "-";
  if (Array.isArray(reporter)) return reporter[0]?.email ?? "-";
  return reporter.email ?? "-";
}

function getReporterPhone(reporter: ReporterRelation[] | ReporterRelation | null) {
  if (!reporter) return "-";
  if (Array.isArray(reporter)) return reporter[0]?.phone_number ?? "-";
  return reporter.phone_number ?? "-";
}

function formatPriority(priority: string) {
  return REPORT_PRIORITY_LABELS[
    priority as keyof typeof REPORT_PRIORITY_LABELS
  ] ?? priority;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatEnum(value: string | null) {
  if (!value) return "-";

  const labels: Record<string, string> = {
    aset_desa: "Aset Desa",
    bukan_aset_desa: "Bukan Aset Desa",
    belum_diketahui: "Belum Diketahui",
    desa: "Desa",
    kabupaten_kota: "Kabupaten/Kota",
    provinsi: "Provinsi",
    nasional: "Nasional",
    ditangani_desa: "Ditangani Desa",
    diteruskan_ke_dinas: "Diteruskan ke Dinas",
    diusulkan_musrenbang: "Diusulkan Musrenbang",
    menunggu_anggaran: "Menunggu Anggaran",
    belum_ditentukan: "Belum Ditentukan",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

type ReportStatusKey = keyof typeof REPORT_STATUS_LABELS;

function getStatusBadgeClass(status: string) {
  return (
    REPORT_STATUS_BADGE_CLASSES[status as ReportStatusKey] ??
    "bg-muted text-muted-foreground border-border"
  );
}

function getStatusLabel(status: string) {
  return REPORT_STATUS_LABELS[status as ReportStatusKey] ?? formatEnum(status);
}
