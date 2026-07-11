import Link from "next/link";
import { ArrowLeft, MapPinned } from "lucide-react";
import { VillageHeatmapSection } from "@/src/features/village/components/VillageHeatmapSection";
import { getVillageHeatmapReports } from "@/src/features/village/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function VillageHeatmapPage() {
  const reports = await getVillageHeatmapReports();

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
          <p className="text-sm font-semibold text-primary">Peta Sebaran</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Peta Lokasi Laporan
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Lihat sebaran geografis laporan masyarakat di wilayah desa untuk
            mengidentifikasi lokasi masalah yang sering muncul.
          </p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPinned className="h-5 w-5 text-primary" />
            Peta Sebaran Laporan
          </CardTitle>

          <CardDescription>
            Menampilkan {reports.length} titik laporan yang memiliki koordinat.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
              <p className="text-sm font-medium text-foreground">
                Belum ada data lokasi
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Laporan akan muncul di peta ini setelah masyarakat mengirim
                laporan dengan data lokasi.
              </p>
            </div>
          ) : (
            <VillageHeatmapSection reports={reports} />
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MapInfoCard
          title="Total Titik"
          value={reports.length}
          description="Laporan yang memiliki latitude dan longitude."
        />

        <MapInfoCard
          title="Kegunaan Peta"
          value="Monitoring"
          description="Digunakan untuk analisis spasial tingkat desa."
        />

        <MapInfoCard
          title="Pendukung Keputusan"
          value="Lokasi"
          description="Membantu mengenali area masalah berulang."
        />

        <MapInfoCard
          title="Pengembangan Berikutnya"
          value="Heat Layer"
          description="Bisa dikembangkan menjadi heatmap berbasis kepadatan."
        />
      </section>
    </div>
  );
}

function MapInfoCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number | string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>

      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
