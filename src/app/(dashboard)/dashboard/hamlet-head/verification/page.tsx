import { HamletVerificationTable } from "@/src/features/hamlet-head/components/HamletVerificationTable";
import { getHamletHeadVerificationReports } from "@/src/features/hamlet-head/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function HamletHeadVerificationPage() {
  const { reports, missingHamlet } = await getHamletHeadVerificationReports();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Verifikasi</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Verifikasi Laporan
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Tinjau laporan yang ditugaskan ke dusun Anda dan verifikasi apakah
          masalah yang dilaporkan valid di lapangan.
        </p>
      </section>

      {missingHamlet && (
        <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
          Akun Anda belum ditugaskan ke dusun. Hubungi admin untuk mengatur
          dusun pada data profil Anda.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Laporan Perlu Verifikasi</CardTitle>
          <CardDescription>
            Menampilkan laporan yang sudah disetujui admin dan ditugaskan ke
            dusun Anda.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <HamletVerificationTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}
