import Link from "next/link";
import type { ComponentProps } from "react";
import { CheckCircle2, ClipboardList, Clock3, Gauge, Wallet } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { VillageStatCard } from "@/src/features/village/components/VillageStatCard";
import { KasiReportTable } from "@/src/features/kasi/components/KasiReportTable";
import { getKasiDashboardData } from "@/src/features/kasi/queries";

type KasiReportTableReports = ComponentProps<typeof KasiReportTable>["reports"];

export default async function KasiDashboardPage() {
  const { missingSection, stats, recentReports } = await getKasiDashboardData();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Dasbor Kasi</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Penanganan Laporan Internal
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Pantau laporan yang ditugaskan ke seksi desa Anda dan kelola alur
            penanganannya.
          </p>
        </div>

        <Link href="/dashboard/kasi/reports">
          <Button>
            <ClipboardList className="mr-2 h-4 w-4" />
            Laporan Ditugaskan
          </Button>
        </Link>
      </section>

      {missingSection ? <MissingSectionNotice /> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <VillageStatCard
          title="Ditugaskan"
          value={stats.totalAssignedReports}
          description="Laporan yang ditugaskan ke seksi Anda."
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <VillageStatCard
          title="Aktif"
          value={stats.activeReports}
          description="Laporan yang masih ditangani."
          icon={<Gauge className="h-5 w-5" />}
        />
        <VillageStatCard
          title="Menunggu Anggaran"
          value={stats.waitingBudgetReports}
          description="Laporan yang membutuhkan perencanaan anggaran."
          icon={<Wallet className="h-5 w-5" />}
        />
        <VillageStatCard
          title="Diproses"
          value={stats.inProgressReports}
          description="Laporan yang sedang diproses."
          icon={<Clock3 className="h-5 w-5" />}
        />
        <VillageStatCard
          title="Selesai"
          value={stats.resolvedReports}
          description="Laporan tugas yang sudah selesai."
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Laporan Ditugaskan Terbaru</CardTitle>
          <CardDescription>
            Laporan terbaru yang ditugaskan ke seksi Anda.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <KasiReportTable
            reports={recentReports as KasiReportTableReports}
            emptyTitle={
              missingSection ? "Penugasan seksi diperlukan" : undefined
            }
            emptyDescription={
              missingSection
                ? "Minta admin, sekdes, atau kepala desa menautkan akun Anda ke seksi desa."
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function MissingSectionNotice() {
  return (
    <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
      Akun Anda belum ditautkan ke seksi desa. Silakan minta admin, sekdes,
      atau kepala desa memperbarui profil pengguna Anda.
    </div>
  );
}
