import { Archive, CheckCircle2, Clock3 } from "lucide-react";
import { VillageArchiveTable } from "@/src/features/village/components/VillageArchiveTable";
import type { ArchivedReport } from "@/src/features/village/components/VillageArchiveTable";
import { getVillageArchivedReports } from "@/src/features/village/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function VillageArchivePage() {
  const reports = await getVillageArchivedReports();

  const resolvedBeforeArchive = reports.filter(
    (report) => report.resolved_at
  ).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
            <p className="text-sm font-semibold text-primary">Arsip</p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Laporan Arsip
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Tinjau laporan yang sudah selesai dan diarsipkan dalam alur
            pelaporan desa.
            </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ArchiveInfoCard
          title="Laporan Arsip"
          value={reports.length}
          description="Laporan yang saat ini tersimpan di arsip."
          icon={<Archive className="h-5 w-5" />}
        />

        <ArchiveInfoCard
          title="Selesai Sebelum Arsip"
          value={resolvedBeforeArchive}
          description="Laporan yang selesai sebelum diarsipkan."
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <ArchiveInfoCard
          title="Fungsi Arsip"
          value="Baca Saja"
          description="Digunakan untuk monitoring, akuntabilitas, dan pencatatan."
          icon={<Clock3 className="h-5 w-5" />}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Laporan Arsip</CardTitle>

          <CardDescription>
            Menampilkan laporan arsip beserta pelapor, kategori, dusun,
            prioritas, dan informasi tindak lanjut.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <VillageArchiveTable reports={reports as ArchivedReport[]} />
        </CardContent>
      </Card>
    </div>
  );
}

function ArchiveInfoCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
