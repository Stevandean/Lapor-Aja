import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";

type RelationName = {
  name: string;
};

type ReporterProfile = {
  full_name: string;
  email: string;
  phone_number: string | null;
};

type FollowUpReport = {
  id: string;
  report_number: string;
  title: string;
  description: string;
  status: keyof typeof REPORT_STATUS_LABELS;
  priority: keyof typeof REPORT_PRIORITY_LABELS;
  asset_status: string;
  authority_level: string;
  follow_up_type: string;
  created_at: string;
  updated_at: string;
  category: RelationName[] | RelationName | null;
  hamlet: RelationName[] | RelationName | null;
  reporter: ReporterProfile[] | ReporterProfile | null;
  agency: RelationName[] | RelationName | null;
};

type AdminFollowUpTableProps = {
  reports: FollowUpReport[];
};

export function AdminFollowUpTable({ reports }: AdminFollowUpTableProps) {
  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <ClipboardList className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-foreground">
          Belum ada laporan tindak lanjut
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Laporan akan muncul di sini setelah admin memproses laporan yang
          sudah diklasifikasi.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-4 font-semibold">Laporan</th>
              <th className="px-5 py-4 font-semibold">Pelapor</th>
              <th className="px-5 py-4 font-semibold">Dusun</th>
              <th className="px-5 py-4 font-semibold">Jenis Tindak Lanjut</th>
              <th className="px-5 py-4 font-semibold">Instansi</th>
              <th className="px-5 py-4 font-semibold">Kewenangan</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {reports.map((report) => {
              const reporter = getReporter(report.reporter);

              return (
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
                        {report.report_number}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {reporter?.full_name ?? "-"}
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {getRelationName(report.hamlet)}
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {formatEnum(report.follow_up_type)}
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {report.follow_up_type === "diteruskan_ke_dinas"
                      ? getRelationName(report.agency)
                      : "-"}
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {formatEnum(report.authority_level)}
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

                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/dashboard/admin/reports/${report.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700"
                    >
                      Lihat detail
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border lg:hidden">
        {reports.map((report) => {
          const reporter = getReporter(report.reporter);

          return (
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

                <Badge
                  className={
                    REPORT_STATUS_BADGE_CLASSES[report.status] ??
                    "bg-muted text-muted-foreground"
                  }
                >
                  {REPORT_STATUS_LABELS[report.status] ?? report.status}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <InfoItem label="Pelapor" value={reporter?.full_name ?? "-"} />
                <InfoItem label="Dusun" value={getRelationName(report.hamlet)} />
                <InfoItem
                  label="Tindak lanjut"
                  value={formatEnum(report.follow_up_type)}
                />
                <InfoItem
                  label="Instansi"
                  value={
                    report.follow_up_type === "diteruskan_ke_dinas"
                      ? getRelationName(report.agency)
                      : "-"
                  }
                />
                <InfoItem
                  label="Kewenangan"
                  value={formatEnum(report.authority_level)}
                />
              </div>

              <Link
                href={`/dashboard/admin/reports/${report.id}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700"
              >
                Lihat detail
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
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

function getReporter(
  relation: ReporterProfile[] | ReporterProfile | null
): ReporterProfile | null {
  if (!relation) return null;
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

function formatEnum(value: string | null) {
  if (!value) return "-";

  const labels: Record<string, string> = {
    desa: "Desa",
    kabupaten_kota: "Kabupaten/Kota",
    provinsi: "Provinsi",
    nasional: "Nasional",
    belum_diketahui: "Belum Diketahui",
    ditangani_desa: "Ditangani Desa",
    diteruskan_ke_dinas: "Diteruskan ke Dinas",
    diusulkan_musrenbang: "Diusulkan Musrenbang",
    menunggu_anggaran: "Menunggu Anggaran",
    belum_ditentukan: "Belum Ditentukan",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}
