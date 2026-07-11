import { AdminFollowUpTable } from "@/src/features/admin/components/AdminFollowUpTable";
import { getAdminArchivedReports } from "@/src/features/admin/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function AdminArchivePage() {
  const reports = await getAdminArchivedReports();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Arsip</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Laporan Diarsipkan
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Lihat laporan yang sudah ditutup dan dipindahkan ke arsip.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Laporan Arsip</CardTitle>
          <CardDescription>
            Menampilkan laporan yang tidak lagi aktif dalam alur penanganan.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AdminFollowUpTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}
