import { AdminAssetClassificationTable } from "@/src/features/admin/components/AdminAssetClassificationTable";
import { getAdminAssetClassificationReports } from "@/src/features/admin/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function AdminAssetClassificationPage() {
  const reports = await getAdminAssetClassificationReports();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">
          Klasifikasi Aset
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Laporan Siap Diklasifikasi
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Tinjau laporan yang sudah diverifikasi valid oleh kepala dusun, lalu
          tentukan status aset, level kewenangan, dan jenis tindak lanjut.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Laporan Terverifikasi</CardTitle>
          <CardDescription>
            Menampilkan laporan valid yang siap diklasifikasi oleh admin.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AdminAssetClassificationTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}
