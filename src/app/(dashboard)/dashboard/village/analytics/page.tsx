import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { VillageAnalyticsCard } from "@/src/features/village/components/VillageAnalyticsCard";
import { VillageAnalyticsCharts } from "@/src/features/village/components/VillageAnalyticsCharts";
import { getVillageAnalyticsData } from "@/src/features/village/queries";
import {
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function VillageAnalyticsPage() {
  const {
    totalReports,
    statusStats,
    priorityStats,
    categoryStats,
    hamletStats,
  } = await getVillageAnalyticsData();

  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/dashboard/village"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke dashboard desa
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-primary">Analitik</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Analitik Laporan
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Analisis sebaran laporan berdasarkan status, prioritas, kategori,
            dan dusun untuk mendukung pengambilan keputusan tingkat desa.
          </p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Ringkasan Analitik
          </CardTitle>
          <CardDescription>
            Total laporan yang tercatat di sistem pelaporan desa.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-2xl border border-border bg-muted/30 p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Total Laporan
            </p>

            <p className="mt-2 text-4xl font-bold tracking-tight text-foreground">
              {totalReports}
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Angka ini mencakup laporan aktif, selesai, ditolak, dan
              diarsipkan.
            </p>
          </div>
        </CardContent>
      </Card>

      <VillageAnalyticsCharts
        total={totalReports}
        statusStats={statusStats}
        priorityStats={priorityStats}
        categoryStats={categoryStats}
        hamletStats={hamletStats}
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <VillageAnalyticsCard
          title="Laporan Berdasarkan Status"
          description="Distribusi laporan berdasarkan status alur saat ini."
          items={statusStats}
          total={totalReports}
          formatLabel={(label) =>
            REPORT_STATUS_LABELS[
              label as keyof typeof REPORT_STATUS_LABELS
            ] ?? formatEnum(label)
          }
        />

        <VillageAnalyticsCard
          title="Laporan Berdasarkan Prioritas"
          description="Distribusi laporan berdasarkan tingkat prioritas."
          items={priorityStats}
          total={totalReports}
          formatLabel={(label) =>
            REPORT_PRIORITY_LABELS[
              label as keyof typeof REPORT_PRIORITY_LABELS
            ] ?? formatEnum(label)
          }
        />

        <VillageAnalyticsCard
          title="Laporan Berdasarkan Kategori"
          description="Kategori masalah yang paling sering dikirim masyarakat."
          items={categoryStats}
          total={totalReports}
        />

        <VillageAnalyticsCard
          title="Laporan Berdasarkan Dusun"
          description="Distribusi laporan di tiap dusun desa."
          items={hamletStats}
          total={totalReports}
        />
      </section>
    </div>
  );
}

function formatEnum(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
