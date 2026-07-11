import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";

type RelationName = {
  name: string;
};

export type VerificationHistoryItem = {
  verification: {
    id: string;
    report_id: string;
    is_valid: boolean;
    verification_note: string | null;
    created_at: string;
  };
  report: {
    id: string;
    report_number: string;
    title: string;
    status: keyof typeof REPORT_STATUS_LABELS;
    priority: keyof typeof REPORT_PRIORITY_LABELS;
    updated_at: string;
    category: RelationName[] | RelationName | null;
    hamlet: RelationName[] | RelationName | null;
  };
};

type HamletVerificationHistoryTableProps = {
  history: VerificationHistoryItem[];
};

export function HamletVerificationHistoryTable({
  history,
}: HamletVerificationHistoryTableProps) {
  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <History className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-foreground">
          Belum ada riwayat verifikasi
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Laporan yang sudah Anda verifikasi akan muncul di sini.
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
              <th className="px-5 py-4 font-semibold">Kategori</th>
              <th className="px-5 py-4 font-semibold">Hasil Verifikasi</th>
              <th className="px-5 py-4 font-semibold">Status Saat Ini</th>
              <th className="px-5 py-4 font-semibold">Diverifikasi</th>
              <th className="px-5 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {history.map(({ verification, report }) => (
              <tr
                key={verification.id}
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
                  {getRelationName(report.category)}
                </td>

                <td className="px-5 py-4">
                  {verification.is_valid ? (
                    <Badge className="bg-success-50 text-success-700">
                      Valid
                    </Badge>
                  ) : (
                    <Badge className="bg-danger-50 text-danger-700">
                      Tidak Valid
                    </Badge>
                  )}
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

                <td className="px-5 py-4 text-muted-foreground">
                  {formatDateTime(verification.created_at)}
                </td>

                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/dashboard/hamlet-head/verification/${report.id}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700"
                  >
                    Detail
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border lg:hidden">
        {history.map(({ verification, report }) => (
          <div key={verification.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {report.title}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {report.report_number}
                </p>
              </div>

              {verification.is_valid ? (
                <Badge className="bg-success-50 text-success-700">Valid</Badge>
              ) : (
                <Badge className="bg-danger-50 text-danger-700">Tidak Valid</Badge>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <InfoItem
                label="Kategori"
                value={getRelationName(report.category)}
              />
              <InfoItem
                label="Status"
                value={REPORT_STATUS_LABELS[report.status] ?? report.status}
              />
              <InfoItem
                label="Prioritas"
                value={REPORT_PRIORITY_LABELS[report.priority] ?? report.priority}
              />
              <InfoItem
                label="Diverifikasi"
                value={formatDateTime(verification.created_at)}
              />
            </div>

            <Link
              href={`/dashboard/hamlet-head/verification/${report.id}`}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700"
            >
              Lihat detail
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
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

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
