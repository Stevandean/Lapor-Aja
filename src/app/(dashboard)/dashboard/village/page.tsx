import Link from "next/link";
import {
  Archive,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileSearch,
  Map,
  ShieldAlert,
  Timer,
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
import { VillageStatCard } from "@/src/features/village/components/VillageStatCard";
import { getVillageDashboardData } from "@/src/features/village/queries";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";

type RelationName = {
  name: string;
};

type RecentReport = {
  id: string;
  report_number: string;
  title: string;
  status: keyof typeof REPORT_STATUS_LABELS;
  priority: keyof typeof REPORT_PRIORITY_LABELS;
  created_at: string;
  updated_at: string;
  category: RelationName[] | RelationName | null;
  hamlet: RelationName[] | RelationName | null;
};

export default async function VillageDashboardPage() {
  const { stats, recentReports } = await getVillageDashboardData();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">
            Dasbor Pimpinan Desa
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Monitoring Laporan Desa
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Pantau laporan masyarakat, progres tindak lanjut, kondisi SLA, dan
            dukungan keputusan tingkat desa dari satu dasbor.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/village/analytics">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analitik
            </Button>
          </Link>

          <Link href="/dashboard/village/heatmap">
            <Button variant="outline">
              <Map className="mr-2 h-4 w-4" />
              Heatmap
            </Button>
          </Link>

          <Link href="/dashboard/village/sla">
            <Button>
              <Timer className="mr-2 h-4 w-4" />
              Monitoring SLA
            </Button>
          </Link>

          <Link href="/dashboard/village/budget-requests">
            <Button variant="outline">
              <Wallet className="mr-2 h-4 w-4" />
              Pengajuan Anggaran
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <VillageStatCard
          title="Total Laporan"
          value={stats.totalReports}
          description="Semua laporan yang dikirim."
          icon={<ClipboardList className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Menunggu"
          value={stats.pendingReports}
          description="Menunggu review admin."
          icon={<Clock3 className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Perlu Verifikasi"
          value={stats.needVerificationReports}
          description="Menunggu pemeriksaan lapangan."
          icon={<FileSearch className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Diproses"
          value={stats.inProgressReports}
          description="Sedang ditangani."
          icon={<ShieldAlert className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Selesai"
          value={stats.resolvedReports}
          description="Laporan yang sudah selesai."
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Diarsipkan"
          value={stats.archivedReports}
          description="Rekam laporan yang sudah ditutup."
          icon={<Archive className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Laporan Terbaru</CardTitle>
            <CardDescription>
              Update laporan terbaru dari seluruh dusun.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <RecentVillageReportList reports={recentReports as RecentReport[]} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fokus Pimpinan</CardTitle>
            <CardDescription>
              Area monitoring yang disarankan untuk pengambilan keputusan desa.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <FocusItem
              title="Cek laporan mendesak"
              description="Prioritaskan laporan tinggi atau darurat yang perlu perhatian segera."
            />

            <FocusItem
              title="Pantau masalah belum selesai"
              description="Tinjau laporan yang masih diproses atau menunggu anggaran."
            />

            <FocusItem
              title="Review pengajuan anggaran"
              description="Periksa pengajuan Kasi yang memerlukan perencanaan anggaran desa sebelum penanganan dilanjutkan."
            />

            <FocusItem
              title="Amati sebaran laporan"
              description="Gunakan analitik dan heatmap untuk mengidentifikasi area dengan masalah berulang."
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function RecentVillageReportList({ reports }: { reports: RecentReport[] }) {
  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
        <p className="text-sm font-medium text-foreground">Belum ada laporan</p>

        <p className="mt-2 text-sm text-muted-foreground">
          Laporan akan muncul di sini setelah masyarakat mengirimkannya.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {reports.map((report) => (
        <div
          key={report.id}
          className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {report.title}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {report.report_number} - {getRelationName(report.hamlet)} -{" "}
              {getRelationName(report.category)} - {formatDate(report.updated_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">
              {REPORT_PRIORITY_LABELS[report.priority] ?? report.priority}
            </Badge>

            <Badge
              className={
                REPORT_STATUS_BADGE_CLASSES[report.status] ??
                "bg-muted text-muted-foreground"
              }
            >
              {REPORT_STATUS_LABELS[report.status] ?? report.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function FocusItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function getRelationName(relation: RelationName[] | RelationName | null) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.name ?? "-";
  return relation.name ?? "-";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
