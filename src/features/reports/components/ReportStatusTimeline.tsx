import { CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";

type ReportStatusLog = {
  id: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
};

type ReportStatusTimelineProps = {
  logs: ReportStatusLog[];
  emptyText?: string;
};

export function ReportStatusTimeline({
  logs,
  emptyText = "Riwayat status belum tersedia.",
}: ReportStatusTimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {logs.map((log, index) => {
        const isLast = index === logs.length - 1;

        return (
          <div key={log.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={
                  isLast
                    ? "flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    : "flex h-9 w-9 items-center justify-center rounded-full bg-success-50 text-success-700"
                }
              >
                {isLast ? (
                  <Clock3 className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>

              {!isLast ? <div className="h-12 w-px bg-border" /> : null}
            </div>

            <div className="pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={getStatusBadgeClass(log.new_status)}>
                  {getStatusLabel(log.new_status)}
                </Badge>

                {isLast ? (
                  <Badge className="bg-primary-50 text-primary-700">
                    Saat Ini
                  </Badge>
                ) : null}
              </div>

              <p className="mt-2 text-sm font-semibold text-foreground">
                {getTimelineTitle(log.new_status)}
              </p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {log.note || getTimelineDescription(log.new_status)}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {formatDateTime(log.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
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

function getTimelineTitle(status: string) {
  const titles: Record<string, string> = {
    pending: "Laporan Dikirim",
    need_verification: "Dikirim untuk Verifikasi Lapangan",
    verified_valid: "Terverifikasi Valid",
    verified_invalid: "Terverifikasi Tidak Valid",
    classified: "Laporan Diklasifikasi",
    handled_by_village: "Ditangani Desa",
    forwarded_to_agency: "Diteruskan ke Dinas",
    waiting_budget: "Menunggu Anggaran",
    in_progress: "Sedang Diproses",
    resolved: "Laporan Selesai",
    rejected: "Laporan Ditolak",
    archived: "Laporan Diarsipkan",
    merged: "Laporan Digabungkan",
  };

  return titles[status] ?? getStatusLabel(status);
}

function getTimelineDescription(status: string) {
  const descriptions: Record<string, string> = {
    pending: "Laporan sudah dikirim dan menunggu review admin.",
    need_verification:
      "Laporan sudah disetujui admin dan dikirim ke kepala dusun untuk verifikasi lapangan.",
    verified_valid:
      "Kepala dusun sudah memverifikasi bahwa laporan valid.",
    verified_invalid:
      "Kepala dusun sudah memverifikasi bahwa laporan tidak valid.",
    classified:
      "Admin sudah mengklasifikasi laporan untuk proses tindak lanjut yang sesuai.",
    handled_by_village:
      "Laporan akan ditangani langsung oleh desa.",
    forwarded_to_agency:
      "Laporan sudah diteruskan ke dinas terkait.",
    waiting_budget:
      "Laporan sedang menunggu alokasi atau perencanaan anggaran.",
    in_progress:
      "Laporan sedang ditangani oleh pihak yang bertanggung jawab.",
    resolved:
      "Laporan sudah selesai.",
    rejected:
      "Laporan ditolak setelah review.",
    archived:
      "Laporan sudah diarsipkan untuk pencatatan.",
    merged:
      "Laporan sudah digabungkan ke laporan master untuk penanganan terpadu.",
  };

  return descriptions[status] ?? "Status laporan sudah diperbarui.";
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

function formatEnum(value: string) {
  const labels: Record<string, string> = {
    pending: "Menunggu Review",
    need_verification: "Perlu Verifikasi",
    verified_valid: "Terverifikasi Valid",
    verified_invalid: "Terverifikasi Tidak Valid",
    classified: "Diklasifikasi",
    handled_by_village: "Ditangani Desa",
    forwarded_to_agency: "Diteruskan ke Instansi",
    waiting_budget: "Menunggu Anggaran",
    in_progress: "Diproses",
    resolved: "Selesai",
    rejected: "Ditolak",
    archived: "Diarsipkan",
    merged: "Digabungkan",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}
