import { FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { CitizenReportTable } from "@/src/features/citizen/components/CitizenReportTable";
import type { CitizenReport } from "@/src/features/citizen/components/CitizenReportTable";
import { CreateReportModal } from "@/src/features/reports/components/CreateReportModal";
import { getCitizenReports } from "@/src/features/citizen/queries";

export default async function CitizenReportsPage() {
  const reports = await getCitizenReports();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Laporan Masyarakat</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Laporan Saya
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Pantau semua laporan yang sudah Anda kirim beserta status
            terbarunya dalam alur pelaporan desa.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <CreateReportModal />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Daftar Laporan
          </CardTitle>

          <CardDescription>
            Menampilkan laporan yang dikirim menggunakan akun masyarakat Anda.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <CitizenReportTable reports={reports as CitizenReport[]} />
        </CardContent>
      </Card>
    </div>
  );
}
