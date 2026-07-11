import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";
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

type AssetClassificationReport = {
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
};

type AdminAssetClassificationTableProps = {
  reports: AssetClassificationReport[];
};

export function AdminAssetClassificationTable({
  reports,
}: AdminAssetClassificationTableProps) {
  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <ClipboardCheck className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-foreground">
          Belum ada laporan siap diklasifikasi
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Laporan akan muncul di sini setelah diverifikasi valid oleh kepala
          dusun.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[950px] text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-4 font-semibold">Laporan</th>
              <th className="px-5 py-4 font-semibold">Pelapor</th>
              <th className="px-5 py-4 font-semibold">Kategori</th>
              <th className="px-5 py-4 font-semibold">Dusun</th>
              <th className="px-5 py-4 font-semibold">Prioritas</th>
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
                    {getRelationName(report.category)}
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {getRelationName(report.hamlet)}
                  </td>

                  <td className="px-5 py-4">
                    <Badge variant="muted">
                      {REPORT_PRIORITY_LABELS[report.priority] ??
                        report.priority}
                    </Badge>
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
                      href={`/dashboard/admin/asset-classification/${report.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700"
                    >
                      Klasifikasi
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
                <InfoItem
                  label="Kategori"
                  value={getRelationName(report.category)}
                />
                <InfoItem label="Dusun" value={getRelationName(report.hamlet)} />
                <InfoItem
                  label="Prioritas"
                  value={
                    REPORT_PRIORITY_LABELS[report.priority] ?? report.priority
                  }
                />
              </div>

              <Link
                href={`/dashboard/admin/asset-classification/${report.id}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700"
              >
                Klasifikasi
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
