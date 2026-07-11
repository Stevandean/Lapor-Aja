import { HamletAssignedReportsTable } from "@/src/features/hamlet-head/components/HamletAssignedReportsTable";
import type { AssignedReport } from "@/src/features/hamlet-head/components/HamletAssignedReportsTable";
import { getHamletHeadAssignedReports } from "@/src/features/hamlet-head/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function HamletHeadReportsPage() {
  const { reports, missingHamlet } = await getHamletHeadAssignedReports();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Laporan</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Laporan Dusun Ditugaskan
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Lihat semua laporan yang ditugaskan ke dusun Anda, termasuk laporan
          yang menunggu verifikasi dan laporan yang sudah lanjut ke tahap
          berikutnya.
        </p>
      </section>

      {missingHamlet && (
        <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
          Akun Anda belum ditugaskan ke dusun. Silakan minta admin mengatur
          dusun Anda pada data profil.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Laporan Ditugaskan</CardTitle>
          <CardDescription>
            Menampilkan semua laporan yang terhubung dengan dusun Anda.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <HamletAssignedReportsTable reports={reports as AssignedReport[]} />
        </CardContent>
      </Card>
    </div>
  );
}
