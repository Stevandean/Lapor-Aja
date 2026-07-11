import { AdminFollowUpTable } from "@/src/features/admin/components/AdminFollowUpTable";
import { getAdminFollowUpReports } from "@/src/features/admin/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function AdminFollowUpPage() {
  const reports = await getAdminFollowUpReports();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Tindak Lanjut</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Pengelolaan Tindak Lanjut
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Pantau laporan yang sudah diklasifikasi dan masuk ke tahap tindak
          lanjut.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Laporan Tindak Lanjut Aktif</CardTitle>
          <CardDescription>
            Menampilkan laporan yang ditangani desa, diteruskan ke instansi,
            menunggu anggaran, atau sedang diproses.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AdminFollowUpTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}
