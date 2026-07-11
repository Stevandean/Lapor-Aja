import { HamletVerificationHistoryTable } from "@/src/features/hamlet-head/components/HamletVerificationHistoryTable";
import type { VerificationHistoryItem } from "@/src/features/hamlet-head/components/HamletVerificationHistoryTable";
import { getHamletHeadVerificationHistory } from "@/src/features/hamlet-head/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function HamletHeadHistoryPage() {
  const { history, missingHamlet } = await getHamletHeadVerificationHistory();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">
          Riwayat Verifikasi
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Laporan Terverifikasi
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Tinjau laporan yang sudah Anda verifikasi, baik yang valid maupun
          tidak valid.
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
          <CardTitle>Daftar Riwayat Verifikasi</CardTitle>
          <CardDescription>
            Menampilkan laporan yang sudah diverifikasi oleh akun Anda.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <HamletVerificationHistoryTable
            history={history as VerificationHistoryItem[]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
