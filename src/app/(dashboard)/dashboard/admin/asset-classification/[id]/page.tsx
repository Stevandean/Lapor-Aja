import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  MapPin,
  Phone,
  ShieldCheck,
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
import { AdminAssetClassificationPanel } from "@/src/features/admin/components/AdminAssetClassificationPanel";
import {
  getActiveAgencies,
  getActiveVillageSections,
  getAdminAssetClassificationReportDetail,
} from "@/src/features/admin/queries";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";

type AssetClassificationDetailPageProps = {
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

export default async function AdminAssetClassificationDetailPage({
  params,
}: AssetClassificationDetailPageProps) {
  const { id } = await params;
  const [detail, villageSections, agencies] = await Promise.all([
    getAdminAssetClassificationReportDetail(id),
    getActiveVillageSections(),
    getActiveAgencies(),
  ]);

  if (!detail) {
    notFound();
  }

  const { report, reportPhotos, verification, verificationPhotos } = detail;

  const status = report.status as keyof typeof REPORT_STATUS_LABELS;
  const priority = report.priority as keyof typeof REPORT_PRIORITY_LABELS;

  const categoryName = getRelationName(report.category);
  const hamletName = getRelationName(report.hamlet);
  const reporter = getReporter(report.reporter);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/asset-classification"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke daftar klasifikasi
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
              Laporan valid yang siap diklasifikasi oleh admin.
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
              <CardTitle>Deskripsi Laporan</CardTitle>
              <CardDescription>
                Informasi laporan yang dikirim masyarakat melalui form publik.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-line text-sm leading-7 text-foreground">
                {report.description}
              </p>
            </CardContent>
          </Card>

          <PhotoCard
            title="Foto Bukti Masyarakat"
            description="Foto awal yang diunggah oleh pelapor."
            photos={reportPhotos}
            emptyText="Belum ada foto dari pelapor."
          />

          <Card>
            <CardHeader>
              <CardTitle>Hasil Verifikasi</CardTitle>
              <CardDescription>
                Verifikasi lapangan yang dikirim oleh kepala dusun.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {!verification ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Data verifikasi tidak ditemukan
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-success-100 bg-success-50 p-4 text-sm leading-6 text-success-700">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5" />
                      <div>
                        <p className="font-semibold">
                          {verification.is_valid
                            ? "Terverifikasi valid"
                            : "Terverifikasi tidak valid"}
                        </p>
                        <p className="mt-1 whitespace-pre-line">
                          {verification.verification_note}
                        </p>
                      </div>
                    </div>
                  </div>

                  <PhotoCard
                    title="Foto Verifikasi"
                    description="Foto lapangan yang diunggah oleh kepala dusun."
                    photos={verificationPhotos}
                    emptyText="Belum ada foto verifikasi."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lokasi</CardTitle>
              <CardDescription>
                Koordinat lokasi yang dikirim oleh pelapor.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="rounded-2xl border border-border bg-muted/40 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Koordinat laporan
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Latitude: {report.latitude}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Longitude: {report.longitude}
                    </p>

                    <a
                      href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-sm font-semibold text-primary hover:text-primary-700"
                    >
                      Buka di Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <AdminAssetClassificationPanel
            reportId={report.id}
            currentStatus={report.status}
            currentAssetStatus={report.asset_status}
            currentAuthorityLevel={report.authority_level}
            currentFollowUpType={report.follow_up_type}
            currentAssignedSectionId={report.assigned_section_id}
            villageSections={villageSections}
            agencies={agencies}
          />

          <Card>
            <CardHeader>
              <CardTitle>Klasifikasi Saat Ini</CardTitle>
              <CardDescription>
                Data klasifikasi yang saat ini tersimpan pada laporan.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <InfoRow label="Kategori" value={categoryName} />
              <InfoRow label="Dusun" value={hamletName} />
              <InfoRow
                label="Status aset"
                value={formatEnum(report.asset_status)}
              />
              <InfoRow
                label="Level kewenangan"
                value={formatEnum(report.authority_level)}
              />
              <InfoRow
                label="Jenis tindak lanjut"
                value={formatEnum(report.follow_up_type)}
              />
              <InfoRow
                label="Seksi tujuan"
                value={getSectionName(
                  villageSections,
                  report.assigned_section_id
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pelapor</CardTitle>
              <CardDescription>
                Akun masyarakat yang mengirim laporan ini.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="Nama"
                value={reporter?.full_name ?? "-"}
              />

              <InfoRow
                icon={<ClipboardList className="h-4 w-4" />}
                label="Email"
                value={reporter?.email ?? "-"}
              />

              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Nomor HP"
                value={reporter?.phone_number ?? "-"}
              />
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}

function PhotoCard({
  title,
  description,
  photos,
  emptyText,
}: {
  title: string;
  description: string;
  photos: { id: string; signedUrl: string | null }[];
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        {photos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <p className="text-sm font-medium text-foreground">{emptyText}</p>
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
                    alt={title}
                    width={800}
                    height={600}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                    Gambar tidak tersedia
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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

function getSectionName(
  sections: { id: string; name: string }[],
  sectionId: string | null
) {
  if (!sectionId) return "-";
  return sections.find((section) => section.id === sectionId)?.name ?? "-";
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
