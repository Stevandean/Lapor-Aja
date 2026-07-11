import { Download, Filter } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { AdminReportTable } from "@/src/features/admin/components/AdminReportTable";
import { getAdminReports } from "@/src/features/admin/queries";

export default async function AdminReportsPage() {
  const reports = await getAdminReports();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Laporan</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Pengelolaan Laporan
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Tinjau, pantau, klasifikasi, dan kelola laporan masyarakat yang
            masuk ke sistem.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>

          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Ekspor
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Semua Laporan</CardTitle>
          <CardDescription>
            Menampilkan laporan terbaru dari sistem pelaporan.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AdminReportTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}
